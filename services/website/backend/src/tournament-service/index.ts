import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.post('/start', async (req) => {
  const body = req.body as { players: string[] };
  return { message: 'Tournament created', players: body.players };
});

fastify.get('/health', async () => ({ status: 'Tournament Service OK' }));

export const startTournamentService = async () => {
  try {
    await fastify.listen({ port: 3603, host: '0.0.0.0' });
    console.log('Tournament Service running on http://localhost:3603');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
