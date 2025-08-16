import { FastifyInstance } from 'fastify';
import { PongGame } from './game';

// Helper function to check if a nickname is valid
function isValidNickname(nickname: string): boolean {
  if (!nickname || !(typeof nickname === 'string')) return false;
  if (nickname.length < 3 || nickname.length > 8) return false;
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(nickname);
}

// Description:
// This module registers the routes for the Pong game service.
// Routes :
// - GET /health: Check service health
// - POST /move: Move paddle up or down
// - GET /state: Get the current game state
// - POST: /new: Create a new game with two players and start it immediately
// - QUIT: /quit: Quit a match in progress

export function registerRoutes(fastify: FastifyInstance, games: Map<string, PongGame>, wsHandler: any) {
  fastify.get('/health', async () => ({ status: 'Game Service OK' }));

  // Move paddle
  fastify.post<{ Body: { matchId: string; side: 'left' | 'right'; dy: number } }>('/move', async (req, reply) => {
    const { matchId, side, dy } = req.body;
    const game = games.get(matchId);

    if (!game) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    game.movePaddle(side, dy);
    return { ok: true };
  });

  // Get current game state
  fastify.get<{ Querystring: { matchId: string } }>('/state', async (req, reply) => {
    const { matchId } = req.query;
    const game = games.get(matchId);

    if (!game) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    return game.getState();
  });

  // New game creation instead of joining one player at a time and then starting.
  // Now when you click "Start" in the UI, it creates a new match with two players.
  fastify.post<{ Body: { nick_left: string; nick_right: string } }>('/new', async (req, reply) => {
    const { nick_left, nick_right } = req.body;
    if (!nick_left || !nick_right) {
      return reply.code(400).send({ error: 'Both nicknames are required' });
    }

    if (!isValidNickname(nick_left) || !isValidNickname(nick_right)) {
      return reply.code(400).send({ error: 'Nicknames must be alphanumeric, max 8 characters, and not empty' });
    }

    const matchId = `match-${Date.now()}`; // Simple match ID generation
    console.log(`Creating new match ${matchId} with players ${nick_left} and ${nick_right}`);

    // Create a new game instance
    let game = games.get(matchId);
    if (!game) {
      game = new PongGame(matchId);
      games.set(matchId, game);
    }

    //Add both players to the game
    const sideLeft = game.addPlayer(nick_left);
    const sideRight = game.addPlayer(nick_right);
    if (!sideLeft || !sideRight) {
      return reply.code(403).send({ error: 'Game full' });
    }

    game.start(); // Start the game immediately with both players
    console.log(`New match ${matchId} started with players ${nick_left} (left) and ${nick_right} (right)`);

    return { matchId };
  });

  // Quit a match mid-game
  fastify.post<{ Body: { matchId: string } }>('/quit', async (req, reply) => {
    const { matchId } = req.body;
    const game = games.get(matchId);

    if (!game) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    game.quit();           // stops the game immediately
    games.delete(matchId); // removes it from active matches

    wsHandler.broadcastQuit(matchId);

    return { message: `Match ${matchId} has been ended.` };
  });
}
