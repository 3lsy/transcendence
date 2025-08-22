import { FastifyInstance } from 'fastify';
import { PADDLE_STEP, PongGame } from './game';

// Description:
// This module registers the WebSocket endpoint for the Pong game service.
// WebSocket Endpoint:
// - /: WebSocket connection for real-time game updates and player actions

// Map of matchId -> connected clients
const matchClients = new Map<string, Set<WebSocket>>();

export function registerWebsocket(fastify: FastifyInstance, games: Map<string, PongGame>) {
  fastify.get('/:matchId', { websocket: true }, (ws, req) => {

    const { matchId } = req.params as { matchId: string };

    let game = games.get(matchId);
    if (!game) {
      game = new PongGame(matchId);
      games.set(matchId, game);
    }

    // Get or create the client set for this match
    let clients = matchClients.get(matchId);
    if (!clients) {
      clients = new Set<WebSocket>();
      matchClients.set(matchId, clients);
    }

    clients.add(ws);
    console.log(`Client connected to match ${matchId}, total: ${clients.size}`);

    ws.on('message', (message: Buffer | string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'move' && data.side && 
          (data.direction === 'up' || data.direction === 'down')
        ) {
          const dy = data.direction === 'up' ? -PADDLE_STEP : PADDLE_STEP;
          game.movePaddle(data.side, dy);
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    });

    ws.on('close', () => {
      clients?.delete(ws);
      console.log(`Client disconnected from match ${matchId}, total: ${clients?.size}`);
      if (clients?.size === 0) {
        matchClients.delete(matchId);
        console.log(`No clients left for match ${matchId}, removed from matchClients`);
      }
    });

    // Send initial state
    ws.send(JSON.stringify({ type: 'welcome', state: game.getState() }));
  });

  return {
    // Broadcast State and win
    broadcastState: (matchId: string, foundWinner: boolean) => {
      const clients = matchClients.get(matchId);
      if (!clients) return;

      const game = games.get(matchId);
      if (!game) return;

      for (const client of clients) {
        if (client.readyState === client.OPEN) {

          // Send the updated game state to each connected client
          client.send(JSON.stringify({ type: 'update', state: game.getState() }));

          // check if the game has ended, announce winner.
          if (foundWinner && games.has(matchId)) {
            const result = game.getResult();
            if (result) {
              client.send(JSON.stringify({
                type: 'gameEnd',
                winnerSide: result.winnerSide,
                winnerAlias: result.winnerAlias,
                scores: result.scores
              }));
            }
          }
        }
      }
    },

    // Broadcast Quit
    broadcastQuit: (matchId: string) => {
      const clients = matchClients.get(matchId);
      if (!clients) return;

      for (const client of clients) {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'gameQuit',
            message: `Match ${matchId} was quit.`
          }));
        }
      }
      matchClients.delete(matchId);
      console.log(`Match ${matchId} removed from matchClients after quit`);
    }
  }
}
