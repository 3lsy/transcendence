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

// Auto-cleanup every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 min
const TOURNAMENT_TTL = 10 * 60 * 1000; // 10 min lifetime after finishing

setInterval(() => {
  const now = Date.now();
  for (const [id, tournament] of tournaments.entries()) {
    if (tournament.ended && tournament.finishedAt && (now - tournament.finishedAt > TOURNAMENT_TTL)) {
      console.log(`Cleaning up finished tournament ${id}`);
      tournaments.delete(id);
    }
  }
}, CLEANUP_INTERVAL);


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