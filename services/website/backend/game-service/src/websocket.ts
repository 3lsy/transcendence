import { FastifyInstance } from 'fastify';
import { PongGame } from './game';

// Description:
// This module registers the WebSocket endpoint for the Pong game service.
// WebSocket Endpoint:
// - /: WebSocket connection for real-time game updates and player actions

export function registerWebsocket(fastify: FastifyInstance, game: PongGame) {
  fastify.get('/', { websocket: true }, (connection, req) => {
    console.log('Client connected to WebSocket');

    const ws = connection.socket;

    ws.on('message', (message: Buffer | String) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'move' && data.side && typeof data.dy === 'number') {
          game.movePaddle(data.side, data.dy);
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    });

    // Send initial state
    ws.send(JSON.stringify({ type: 'welcome', state: game.getState() }));

    // Periodically send game state updates
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'update', state: game.getState() }));
      }
    }, 1000 / 30);

    ws.on('close', () => {
      clearInterval(interval);
      console.log('Client disconnected from WebSocket');
    });
  });
}
