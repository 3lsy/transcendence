export type GameCallbacks = {
  onScore: (left: number, right: number) => void;
  onGameOver: (winner: string, points: number) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class PongGame {
  private ctx: CanvasRenderingContext2D;

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
    if (this.keys.has('w') || this.keys.has('W')) this.leftY -= paddleSpeed;
    if (this.keys.has('s') || this.keys.has('S')) this.leftY += paddleSpeed;
    if (this.keys.has('ArrowUp')) this.rightY -= paddleSpeed;
    if (this.keys.has('ArrowDown')) this.rightY += paddleSpeed;

    this.leftY = clamp(this.leftY, 0, this.height - this.paddleH);
    this.rightY = clamp(this.rightY, 0, this.height - this.paddleH);

    // Ball motion
    this.ballX += this.vx;
    this.ballY += this.vy;

    // Wall bounce
    if (this.ballY < this.ballR || this.ballY > this.height - this.ballR) {
      this.vy *= -1;
      this.ballY = clamp(this.ballY, this.ballR, this.height - this.ballR);
    }

    // Left paddle collision
    if (
      this.ballX - this.ballR <= this.paddleW + 8 &&
      this.ballY >= this.leftY &&
      this.ballY <= this.leftY + this.paddleH &&
      this.vx < 0
    ) {
      this.vx *= -1;
      const hit = (this.ballY - (this.leftY + this.paddleH / 2)) / (this.paddleH / 2);
      this.vy = hit * 5;
      this.ballX = this.paddleW + 8 + this.ballR + 0.1;
    }

    // Right paddle collision
    if (
      this.ballX + this.ballR >= this.width - (this.paddleW + 8) &&
      this.ballY >= this.rightY &&
      this.ballY <= this.rightY + this.paddleH &&
      this.vx > 0
    ) {
      this.vx *= -1;
      const hit = (this.ballY - (this.rightY + this.paddleH / 2)) / (this.paddleH / 2);
      this.vy = hit * 5;
      this.ballX = this.width - (this.paddleW + 8 + this.ballR + 0.1);
    }

    // Scoring
    if (this.ballX < -this.ballR) {
      this.rightScore++;
      this.cb.onScore(this.leftScore, this.rightScore);
      if (this.rightScore >= this.target) return this.gameOver(this.rightName, this.rightScore);
      this.resetBall(false);
    } else if (this.ballX > this.width + this.ballR) {
      this.leftScore++;
      this.cb.onScore(this.leftScore, this.rightScore);
      if (this.leftScore >= this.target) return this.gameOver(this.leftName, this.leftScore);
      this.resetBall(true);
    }

    // Draw frame
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private leftName: string,
    private rightName: string,
    private target: number,
    private cb: GameCallbacks
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    this.handleResize();
    this.resetBall(true);
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
    this.width = Math.max(480, Math.floor(rect.width));
    this.height = Math.floor(this.width * 0.6);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  private resetBall(toRight: boolean): void {
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    const speed = 5;
    this.vx = toRight ? speed : -speed;
    this.vy = (Math.random() * 2 - 1) * speed * 0.6;
    this.leftY = this.rightY = this.height / 2 - this.paddleH / 2;
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