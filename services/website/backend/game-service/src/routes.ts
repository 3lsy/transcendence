import { FastifyInstance } from 'fastify';
import { PongGame } from './game';

// Description:
// This module registers the routes for the Pong game service.
// Routes :
// - GET /health: Check service health
// - POST /join: Join the game with an alias
// - POST /move: Move paddle up or down
// - GET /state: Get the current game state

export function registerRoutes(fastify: FastifyInstance, game: PongGame) {
  fastify.get('/health', async () => ({ status: 'Game Service OK' }));

  fastify.post('/join', async (req, reply) => {
    const { alias } = req.body as { alias: string };
    if (!alias) return reply.code(400).send({ error: 'Alias required' });
    const side = game.addPlayer(alias);
    if (!side) return reply.code(403).send({ error: 'Game full' });
    return { side };
  });

  fastify.post('/move', async (req, reply) => {
    const { side, dy } = req.body as { side: 'left' | 'right'; dy: number };
    game.movePaddle(side, dy);
    return { ok: true };
  });

  fastify.get('/state', async () => game.getState());
}
