import Fastify from 'fastify';
import fastifyMetrics from 'fastify-metrics';
import { Tournament } from './tournament';
import { registerRoutes } from './routes';

const fastify = Fastify({ logger: true });
fastify.register(fastifyMetrics, { endpoint: '/metrics' });

// Store all active tournaments by tournamentId
const tournaments = new Map<string, Tournament>();

fastify.register((instance) => {
  registerRoutes(instance, tournaments);
});

const startTournamentService = async () => {
  try {
    await fastify.listen({ port: 3603, host: '0.0.0.0' });
    console.log('Tournament Service running on http://localhost:3603');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startTournamentService();