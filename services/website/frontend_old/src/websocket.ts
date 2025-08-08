export const createWebSocket = (url: string, onMessage: (message: string) => void) => {
  const socket = new WebSocket(url);
  socket.onmessage = (event) => onMessage(event.data);
  return socket;
};
