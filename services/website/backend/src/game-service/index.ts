import Fastify from 'fastify';
import wsPlugin from '@fastify/websocket';

const fastify = Fastify({ logger: true });
fastify.register(wsPlugin);

fastify.get('/', { websocket: true }, (connection) => {
  console.log('WS connected to Game Service');
  connection.socket.on('message', (msg: Buffer | string) => {
    console.log('Message:', msg.toString());
    connection.socket.send(JSON.stringify({ type: 'pong', message: 'Hello from Game Service' }));
  });
});

fastify.get('/health', async () => ({ status: 'Game Service OK' }));

export const startGameService = async () => {
  try {
    await fastify.listen({ port: 3601, host: '0.0.0.0' });
    console.log('Game Service running on http://localhost:3601');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
