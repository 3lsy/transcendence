import Fastify from 'fastify';
import wsPlugin from '@fastify/websocket';
import { PongGame } from './game';
import { registerRoutes } from './routes';
import { registerWebsocket } from './websocket';

const fastify = Fastify({ logger: true });
fastify.register(wsPlugin);

// Store all active games by matchId
const games = new Map<string, PongGame>();

const TICK_RATE = 1000 / 60; // 60 FPS

setInterval(async () => {
  for (const [matchId, game] of games.entries()) {
    await game.update();

    // Broadcast updated state to clients connected to this match
    // Websocket logic to broadcast to the right clients
  }
}, TICK_RATE);

registerRoutes(fastify, games);
registerWebsocket(fastify, games);

const startGameService = async () => {
  try {
    await fastify.listen({ port: 3601, host: '0.0.0.0' });
    console.log('Game Service running on http://localhost:3601');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startGameService();