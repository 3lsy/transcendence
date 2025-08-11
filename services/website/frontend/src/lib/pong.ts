export type GameCallbacks = {
  onScore: (left: number, right: number) => void;
  onGameOver: (winner: string, points: number) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class PongGame {
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocket;

  // Canvas size (auto-resizes to container)
  private width = 800;
  private height = 500;

  // Geometry
  private readonly paddleW = 10;
  private readonly paddleH = 90;
  private readonly ballR = 7;

  // Paddle positions
  private leftY = 0;
  private rightY = 0;

  // Ball state
  private ballX = 0;
  private ballY = 0;
  private vx = 0;
  private vy = 0;

  private updateGameState(state: any) {
    // Update paddle positions
    if (state.players) {
      this.leftY = state.players.left?.y ?? this.height / 2 - this.paddleH / 2;
      this.rightY = state.players.right?.y ?? this.height / 2 - this.paddleH / 2;
    }

    // Update ball position
    if (state.ball) {
      this.ballX = state.ball.x;
      this.ballY = state.ball.y;
      this.vx = state.ball.vx;
      this.vy = state.ball.vy;
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

      // Check for game over
      if (this.leftScore >= this.target) {
        this.gameOver(this.leftPlayer, this.leftScore);
      } else if (this.rightScore >= this.target) {
        this.gameOver(this.rightPlayer, this.rightScore);
      }
    }
  }

  // Input / loop
  private keys = new Set<string>();
  private raf = 0;
  private running = false;

  // Scores
  private leftScore = 0;
  private rightScore = 0;

  // Event handlers (bound for add/remove)
  private onKeyDown = (e: KeyboardEvent) => this.keys.add(e.key);
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key);
  private onResize = () => this.handleResize();

  // Game loop (arrow keeps "this")
  private tick = () => {
    if (!this.running) return;

    // Input
    const paddleSpeed = 7;
    let dy = 0;
    
    // Left paddle
    if (this.keys.has('w') || this.keys.has('W')) dy = -paddleSpeed;
    else if (this.keys.has('s') || this.keys.has('S')) dy = paddleSpeed;
    if (dy !== 0) {
      this.ws.send(JSON.stringify({ type: 'move', side: 'left', dy }));
    }
    
    // Right paddle
    dy = 0;
    if (this.keys.has('ArrowUp')) dy = -paddleSpeed;
    else if (this.keys.has('ArrowDown')) dy = paddleSpeed;
    if (dy !== 0) {
      this.ws.send(JSON.stringify({ type: 'move', side: 'right', dy }));
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
    private matchId: string,
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
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    this.handleResize();
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
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = 800; // Match server dimensions
    this.height = 400; // Match server dimensions
    
    // Scale canvas to fit container while maintaining aspect ratio
    const scale = Math.min(
      rect.width / this.width,
      rect.height / this.height
    );
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.transform = `scale(${scale})`;
    this.canvas.style.transformOrigin = 'top left';
  }

  private draw(): void {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);

    // Midline
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.setLineDash([6, 12]);
    c.beginPath();
    c.moveTo(this.width / 2, 0);
    c.lineTo(this.width / 2, this.height);
    c.stroke();
    c.setLineDash([]);

    // Paddles
    c.fillStyle = '#fff';
    c.fillRect(8, this.leftY, this.paddleW, this.paddleH);
    c.fillRect(this.width - (this.paddleW + 8), this.rightY, this.paddleW, this.paddleH);

    // Ball
    c.beginPath();
    c.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2);
    c.fill();
  }

  private gameOver(winner: string, points: number): void {
    this.stop();
    this.cb.onGameOver(winner, points);
  }
}