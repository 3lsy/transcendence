import path from 'node:path';
import { FastifyInstance } from 'fastify';
import { Tournament } from './tournament';

const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL ?? "http://game-service:3601";

// Description:
// This module registers the routes for the Tournament service.
// Routes :
// - GET /health: Check service health
// - POST: /new: Create a new tournament with the list of players and the first round matches order (tournament id, players)
// - POST: /new-match: Create a new match in the current round (tournament id)
// - GET: /status: Get the status of a tournament by id (players, matches, current round)
// - POST: /match-finished: Save the result of a match (tournament id, match id, winner side, winner alias)
// - POST: /quit: Quit a tournament in progress

// Helper function to check if a nickname is valid
function isValidNickname(nickname: string): boolean {
  if (!nickname || !(typeof nickname === 'string')) return false;
  if (nickname.length < 3 || nickname.length > 8) return false;
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(nickname);
}

export function registerRoutes(fastify: FastifyInstance, tournaments: Map<string, Tournament>) {
  fastify.get('/health', async () => ({ status: 'Tournament Service OK' }));

  // New tournament creation
  fastify.post('/new', {
    schema: {
      body: {
        type: 'object',
        properties: {
          nicks: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 16
          }
        },
        required: ['nicks'],
        additionalProperties: false
      }
    }
  }, async (req, reply) => {

    const { nicks } = req.body as { nicks: string[] };

    // Check if nicknames don't come empty 
    for (const nick of nicks) {
      if (!nick || nick.trim() === '') {
        return reply.code(400).send({ error: 'All nicknames are required' });
      }
    }

    if (![2, 4, 8, 16].includes(nicks.length)) {
      return reply.code(400).send({ error: 'Only 2, 4, 8, or 16 nicks allowed' });
    }

    // Check that all nicknames are different
    const uniqueNicks = new Set(nicks);
    if (uniqueNicks.size !== nicks.length) {
      return reply.code(400).send({ error: 'All nicknames must be unique' });
    }

    // Check if nicks are validNicknames
    for (const nick of nicks) {
      if (!isValidNickname(nick)) {
        return reply.code(400).send({ error: `Invalid nickname: ${nick}` });
      }
    }

    // Create tournament ID
    const tournamentId = `tournament-${Date.now()}`; // Simple tournament ID generation
    console.log(`Creating new tournament ${tournamentId} with players: ${nicks.join(', ')}`);

    // Create a new tournament instance if it doesn't exist
    let tournament = tournaments.get(tournamentId);
    if (!tournament) {
      tournament = new Tournament(tournamentId, nicks);
      tournaments.set(tournamentId, tournament);
    }

    // returns the tournament ID and the first round matches
    console.log(`Tournament ${tournamentId} created with first round matches:`, tournament.rounds[0]);

    return { 
      tournamentId,
      firstRound: tournament.rounds[0]
    };
  });

  // POST /new-match
  fastify.post<{ Body: { tournamentId: string } }>('/new-match', async (req, reply) => {
    const { tournamentId } = req.body;

    // check if tournament exists
    const tournament = tournaments.get(tournamentId);
    if (!tournament) {
      return reply.code(404).send({ error: 'Tournament not found' });
    }

    // check if tournament already ended
    if (tournament.ended) {
      return reply.code(400).send({ error: 'Tournament has already ended. No new matches can be created.' });
    }

    // check which round and which match we need to create
    const currentRound = tournament.currentRound;
    const currentMatch = tournament.currentMatch;
    if (currentRound < 0 || currentRound >= tournament.rounds.length) {
      return reply.code(400).send({ error: 'No current round available' });
    }
    if (currentMatch < 0 || currentMatch >= tournament.rounds[currentRound].length) {
      return reply.code(400).send({ error: 'No current match available' });
    }
    if (!tournament.rounds[currentRound][currentMatch]) {
      return reply.code(404).send({ error: 'Current match not found' });
    }

    const match = tournament.rounds[currentRound][currentMatch];

    console.log(`Creating new match for tournament ${tournamentId}, round ${currentRound}, match ${currentMatch}`, match);

    try {
      const res = await fetch(path.join(GAME_SERVICE_URL, 'new-tournament-match'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, nick_left: match.left, nick_right: match.right }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to create new match', text);
        return reply.code(500).send({ error: 'Failed to create new match' });
      }
      const data = await res.json() as { matchId: string };
      match.matchId = data.matchId; // Save the matchID in rounds
      console.log(`New match created with ID: ${data.matchId}`);
      return { matchId: data.matchId, left: match.left, right: match.right };
    } catch (error) {
      console.error('Error creating new match:', error);
      return reply.code(500).send({ error: 'Error creating new match' });
    }
  });

  // POST save match result
  fastify.post<{ Body: { tournamentId: string; matchId: string; winnerSide: 'left' | 'right'; winnerAlias: string } }>('/match-finished', async (req, reply) => {
    const { tournamentId, matchId, winnerSide, winnerAlias } = req.body;

    if (!tournamentId || !matchId || !winnerSide || !winnerAlias) {
      return reply.code(400).send({ error: 'All fields are required' });
    }

    // Check if tournament exists
    const tournament = tournaments.get(tournamentId);
    if (!tournament) {
      return reply.code(404).send({ error: 'Tournament not found' });
    }

    // Save Winner in : Tournament instance (tournamentId) -> Rounds -> Match[currentRound][currentMatch]
    const currentRound = tournament.currentRound;
    const currentMatch = tournament.currentMatch;
    if (!tournament.rounds[currentRound] || !tournament.rounds[currentRound][currentMatch]) {
      return reply.code(404).send({ error: 'Current match not found' });
    }

    const match = tournament.rounds[currentRound][currentMatch];
    match.winnerSide = winnerSide;
    match.winnerAlias = winnerAlias;

    tournament.winners.push(winnerAlias);

    console.log(`Match result saved for tournament ${tournamentId}, match ${matchId}:`, { winnerSide, winnerAlias });

    // Update indexes and create next round if needed
    tournament.matchesLeftInRound--;
    if (tournament.matchesLeftInRound <= 0) {
      if (tournament.winners.length === 1) {
        // Tournament has a final winner
        const finalWinner = tournament.winners[0];
        tournament.ended = true;
        tournament.finishedAt = Date.now();
        console.log(`Tournament ${tournamentId} has ended. Winner: ${finalWinner}`);
        return { message: `Tournament ended. Winner: ${finalWinner}`, winner: finalWinner };
      } else {
        tournament.createRound();
      }
    } else {
      tournament.currentMatch++;
    }
      
    // Respond with success
    return { message: 'Match result saved successfully' };
  });

  // Get tournament status
  fastify.get<{ Params: { tournamentId: string } }>('/status/:tournamentId', async (req, reply) => {
    const { tournamentId } = req.params;

    // Check if tournament exists
    const tournament = tournaments.get(tournamentId);
    if (!tournament) {
      return reply.code(404).send({ error: 'Tournament not found' });
    }

    // Return tournament status
    return {
      id: tournament.id,
      players: tournament.players,
      currentRound: tournament.currentRound,
      currentMatch: tournament.currentMatch,
      matchesLeft: tournament.matchesLeftInRound,
      roundsLeft: tournament.roundsLeft,
      rounds: tournament.rounds,
      ended: tournament.ended
    };
  });

  // POST /quit: Quit the tournament in progress (and quit the current match where the /quit was called)
  fastify.post<{ Body: { tournamentId: string } }>('/quit', async (req, reply) => {
    const { tournamentId } = req.body;
    const tournament = tournaments.get(tournamentId);

    if (!tournament) {
      return reply.code(404).send({ error: 'Tournament not found' });
    }

    // check the current match for a matchId
    const currentRound = tournament.currentRound;
    const currentMatch = tournament.currentMatch;
    const match = tournament.rounds[currentRound]?.[currentMatch];

    if (match?.matchId) {
      try {
        const res = await fetch('http://game-service:3601/quit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: match.matchId }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`Failed to quit match ${match.matchId} in tournament`, text);
        } else {
          console.log(`Match ${match.matchId} quit successfully in tournament: ${tournamentId}`);
        }
      } catch (error) {
        console.error('Error calling game service /quit:', error);
      }
    }

    tournament.ended = true;
    tournaments.delete(tournamentId); // removes it from active tournaments
    console.log(`Tournament ${tournamentId} has been quit. Cleaning up ...`);

    return { message: `Tournament ${tournamentId} has been ended.` };
  });

}
