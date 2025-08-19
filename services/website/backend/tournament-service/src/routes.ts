import { FastifyInstance } from 'fastify';
import { Tournament } from './tournament';
import { create } from 'domain';

// Description:
// This module registers the routes for the Tournament service.
// Routes :
// - GET /health: Check service health
// - POST: /new: Create a new tournament with the list of players and the first round matches order (tournament id, players)
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
      tournament.createRound();
    }
    else {
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
      rounds: tournament.rounds
    };
  });
}
