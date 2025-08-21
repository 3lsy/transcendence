type GameOverCause = 'normal' | 'quit' | 'disconnected';

export type GameCallbacks = {
  onScore: (left: number, right: number) => void;
  onGameOver: (winner: string | null, cause: GameOverCause) => void;
};

type Player = {
  alias: string;
  side: 'left' | 'right';
  y: number;
};

export type GameState = {
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  players: {
    left?: Player;
    right?: Player;
  };
  scores: {
    left: number;
    right: number;
  };
  target: number;
};

const SERVER_WIDTH = 800;
const SERVER_HEIGHT = 400;

export class PongGame {
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocket;

  // Geometry
  private readonly paddleW = 5;
  private readonly paddleH = 80;
  

  // Paddle positions
  private leftY = 0;
  private rightY = 0;

  // Ball state
  private ballX = 0;
  private ballY = 0;
  private readonly ballSize = 10;
  private readonly padding = 20 - this.paddleW - this.ballSize;

  private updateGameState(state: GameState) {
    // Update paddle positions
    if (state.players) {
      this.leftY = state.players.left?.y ?? 0;
      this.rightY = state.players.right?.y ?? 0;
    }

    // Update ball position
    if (state.ball) {
      this.ballX = state.ball.x;
      this.ballY = state.ball.y;
    }

    // Update scores
    if (state.scores) {
      const oldLeftScore = this.leftScore;
      const oldRightScore = this.rightScore;
      this.leftScore = state.scores.left;
      this.rightScore = state.scores.right;

      // Notify score changes
      if (oldLeftScore !== this.leftScore || oldRightScore !== this.rightScore) {
        this.cb.onScore(this.leftScore, this.rightScore);
      }
    }
  }

  // Input / loop
  private keys = new Set<string>();
  private raf = 0;
  private running = false;

  private activeTouches: Record<number, { side: 'left' | 'right'; lastY: number }> = {};

  // Scores
  private leftScore = 0;
  private rightScore = 0;

  // Event handlers (bound for add/remove)
  private onKeyDown = (e: KeyboardEvent) => this.keys.add(e.key);
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key);

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      const rect = this.canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const side = x < rect.width / 2 ? 'left' : 'right';

      this.activeTouches[t.identifier] = { side, lastY: y };
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      const touch = this.activeTouches[t.identifier];
      if (!touch) continue;

      const rect = this.canvas.getBoundingClientRect();
      const y = t.clientY - rect.top;

      const deltaY = y - touch.lastY;
      let direction: 'up' | 'down' | null = null;
      if (Math.abs(deltaY) > 2) {
        direction = deltaY < 0 ? 'up' : 'down';
      }

      if (direction) {
        this.ws.send(JSON.stringify({ type: 'move', side: touch.side, direction }));
      }

      touch.lastY = y;
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      delete this.activeTouches[t.identifier];
    }
  };

  // Game loop (arrow keeps "this")
  private tick = () => {
    if (!this.running) return;

    // Input
    let direction: "up" | "down" | null = null;

    // Left paddle
    if (this.keys.has('w') || this.keys.has('W')) direction = 'up';
    else if (this.keys.has('s') || this.keys.has('S')) direction = 'down';
    if (direction) {
      this.ws.send(JSON.stringify({ type: 'move', side: 'left', direction }));
    }

    // Right paddle
    direction = null;
    if (this.keys.has('ArrowUp')) direction = 'up';
    else if (this.keys.has('ArrowDown')) direction = 'down';
    if (direction) {
      this.ws.send(JSON.stringify({ type: 'move', side: 'right', direction }));
    }

    // Draw frame
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private leftPlayer: string,
    private rightPlayer: string,
    private target: number,
    matchId: string,
    private cb: GameCallbacks,
  ) {
    this.ctx = canvas.getContext('2d')!;

    // Initialize WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.ws = new WebSocket(`${protocol}//${host}/api/game/${matchId}`);
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.state) {
          this.updateGameState(data.state);
        } else if (data.type === 'gameEnd' && data.winnerAlias) {
          this.gameOver(data.winnerAlias, 'normal');
        } else if (data.type === 'gameQuit') {
          this.gameOver(null, 'quit');
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    };

    this.ws.onerror = () => {
      this.gameOver(null, 'disconnected');
    };

    this.ws.onclose = () => {
      this.gameOver(null, 'disconnected');
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    this.ws.close();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    // Touch events
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
  }

  private draw(): void {
    const c = this.ctx;
    const { width, height } = this.canvas;
    const scaleX = width / SERVER_WIDTH;
    const scaleY = height / SERVER_HEIGHT;

    c.clearRect(0, 0, width, height);

    // Midline
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.setLineDash([6, 12]);
    c.beginPath();
    c.moveTo(SERVER_WIDTH / 2 * scaleX, 0);
    c.lineTo(SERVER_WIDTH / 2 * scaleX, SERVER_HEIGHT * scaleY);
    c.stroke();
    c.setLineDash([]);

    // Paddles
    c.fillStyle = '#fff';
    c.fillRect(this.padding * scaleX, this.leftY * scaleY, this.paddleW * scaleX, this.paddleH * scaleY);
    c.fillRect((SERVER_WIDTH - (this.paddleW + this.padding)) * scaleX, this.rightY * scaleY, this.paddleW * scaleX, this.paddleH * scaleY);

    // Ball
    c.beginPath();
    c.arc(this.ballX * scaleX, this.ballY * scaleY, this.ballSize * scaleX, 0, Math.PI * 2);
    c.fill();
  }

  private gameOver(winner: string | null, cause: GameOverCause): void {
    this.stop();
    this.cb.onGameOver(winner, cause);
  }
}