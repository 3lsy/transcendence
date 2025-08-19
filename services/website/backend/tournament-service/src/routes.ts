import { FastifyInstance } from 'fastify';
import { Tournament } from './tournament';

// Description:
// This module registers the routes for the Tournament service.
// Routes :
// - GET /health: Check service health
// - POST: /new: Create a new tournament with the list of players and the first round matches order (tournament id, players)
// - GET: /status: Get the status of a tournament by id (players, matches, current round), will call game to get result of the match
// - POST: /next-game: Start the next game in a round
// - POST: /next-round: Show the next round matchups
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
 
    // Add players to the tournament (make a function in Tournament class to handle this)

    // returns the tournament ID and the first round matches
    console.log(`Tournament ${tournamentId} created with first round matches:`, tournament.rounds[0]);

    return { 
      tournamentId,
      firstRound: tournament.rounds[0]
    };
  });

}
