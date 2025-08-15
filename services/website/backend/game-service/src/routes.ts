import { FastifyInstance } from 'fastify';
import { PongGame } from './game';

// Description:
// This module registers the routes for the Pong game service.
// Routes :
// - GET /health: Check service health
// - POST /join: Join the game with an alias
// - POST /move: Move paddle up or down
// - GET /state: Get the current game state
// - POST /start: Start the game when both players are ready
// - QUIT: /quit: Quit a match in progress

export function registerRoutes(fastify: FastifyInstance, games: Map<string, PongGame>) {
  fastify.get('/health', async () => ({ status: 'Game Service OK' }));

  // Join a match
  fastify.post<{ Body: { matchId: string; alias: string } }>('/join', async (req, reply) => {
    const { matchId, alias } = req.body;
    if (!matchId || !alias) {
      return reply.code(400).send({ error: 'matchId and alias are required' });
    }

    let game = games.get(matchId);
    if (!game) {
      game = new PongGame(matchId);
      games.set(matchId, game);
    }

    const side = game.addPlayer(alias);
    if (!side) {
      return reply.code(403).send({ error: 'Game full' });
    }

    return { side };
  });

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

  // Start the game
  fastify.post<{ Body: { matchId: string } }>('/start', async (req, reply) => {
  const { matchId } = req.body;
  const game = games.get(matchId);

  if (!game) {
    return reply.code(404).send({ error: 'Match not found' });
  }
  if (!game.isFull()) {
    return reply.code(400).send({ error: 'Not enough players to start' });
  }

  game.start();
  return { message: 'Game started' };
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

    return { message: `Match ${matchId} has been ended.` };
  });

  // GET /match-id: Get match ID

}
