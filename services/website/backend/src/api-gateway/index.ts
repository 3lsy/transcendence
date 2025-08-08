import Fastify from 'fastify';
import wsPlugin from '@fastify/websocket';
import proxy from '@fastify/http-proxy';

const fastify = Fastify({ logger: true });
fastify.register(wsPlugin);

// Proxy to Game Service (WebSocket + HTTP)
fastify.register(proxy, {
  upstream: 'http://localhost:3601',
  prefix: '/game',
  websocket: true
});

// Proxy to Scoreboard Service
fastify.register(proxy, {
  upstream: 'http://localhost:3602',
  prefix: '/scoreboard'
});

// Proxy to Tournament Service
fastify.register(proxy, {
  upstream: 'http://localhost:3603',
  prefix: '/tournament'
});

fastify.get('/api/hello', async () => {
  return { message: 'Hello from API Gateway' };
});

export const startApiGateway = async () => {
  try {
    await fastify.listen({ port: 3600, host: '0.0.0.0' });
    console.log('API Gateway running on http://localhost:3600');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
