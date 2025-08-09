
type PlayerSide = 'left' | 'right';

interface Player {
  alias: string;
  side: PlayerSide;
  y: number; // paddle Y position
}

export class PongGame {
  width = 800;
  height = 400;
  paddleHeight = 80;
  ballSize = 10;

  ball = { x: this.width / 2, y: this.height / 2, vx: 4, vy: 2 };
  players: { left?: Player; right?: Player } = {};
  scores = { left: 0, right: 0 };

  update() {
    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Bounce on top/bottom
    if (this.ball.y <= 0 || this.ball.y >= this.height - this.ballSize) {
      this.ball.vy *= -1;
    }

    // Paddle collision
    if (this.ball.x <= 20 && this.players.left) {
      if (this.ball.y >= this.players.left.y && this.ball.y <= this.players.left.y + this.paddleHeight) {
        this.ball.vx *= -1;
      } else {
        this.scores.right++;
        this.resetBall();
      }
    }
    if (this.ball.x >= this.width - 20 && this.players.right) {
      if (this.ball.y >= this.players.right.y && this.ball.y <= this.players.right.y + this.paddleHeight) {
        this.ball.vx *= -1;
      } else {
        this.scores.left++;
        this.resetBall();
      }
    }
  }

  movePaddle(side: PlayerSide, dy: number) {
    const player = this.players[side];
    if (player) {
      player.y = Math.max(0, Math.min(this.height - this.paddleHeight, player.y + dy));
    }
  }

  addPlayer(alias: string): PlayerSide | null {
    if (!this.players.left) {
      this.players.left = { alias, side: 'left', y: this.height / 2 - this.paddleHeight / 2 };
      return 'left';
    } else if (!this.players.right) {
      this.players.right = { alias, side: 'right', y: this.height / 2 - this.paddleHeight / 2 };
      return 'right';
    }
    return null;
  }

  resetBall() {
    this.ball = { x: this.width / 2, y: this.height / 2, vx: 4 * (Math.random() > 0.5 ? 1 : -1), vy: 2 };
  }

  getState() {
    return {
      ball: this.ball,
      players: this.players,
      scores: this.scores
    };
  }
}
