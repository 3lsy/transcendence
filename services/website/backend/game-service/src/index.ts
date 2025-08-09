import Fastify from 'fastify';
import wsPlugin from '@fastify/websocket';
import { PongGame } from './game';
import { registerRoutes } from './routes';
import { registerWebsocket } from './websocket';

const fastify = Fastify({ logger: true });
fastify.register(wsPlugin);

const game = new PongGame();

registerRoutes(fastify, game);
registerWebsocket(fastify, game);

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