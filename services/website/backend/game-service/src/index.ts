import Fastify from 'fastify';
import wsPlugin from '@fastify/websocket';
import fastifyMetrics from 'fastify-metrics';
import { PongGame } from './game';
import { registerRoutes } from './routes';
import { registerWebsocket } from './websocket';
import { register } from 'module';

const fastify = Fastify({ logger: true });
fastify.register(wsPlugin);
fastify.register(fastifyMetrics, { endpoint: '/metrics' });

// Store all active games by matchId
const games = new Map<string, PongGame>();

let wsHandler: any;

fastify.register((instance) => {
  wsHandler = registerWebsocket(instance, games);
});

fastify.register((instance) => {
  registerRoutes(instance, games, wsHandler);
});

const TICK_RATE = 1000 / 60; // 60 FPS

setInterval(async () => {
  for (const [matchId, game] of games.entries()) {
    // Only update and broadcast if game has two players and has started
    if (!game.isFull() || !game.started) continue;
    const foundWinner = await game.update();
    // Broadcast the latest state to clients
    wsHandler.broadcastState(matchId, foundWinner);
    // If the game has ended, remove from active matches
    if (foundWinner && games.has(matchId)) {
      console.log(`Game ended for match ${matchId}, cleaning up...`);
      games.delete(matchId);
    }
  }
}, TICK_RATE);

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