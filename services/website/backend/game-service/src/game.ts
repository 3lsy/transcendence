import { saveScore } from "./saveScore";

type PlayerSide = 'left' | 'right';

interface Player {
  alias: string;
  side: PlayerSide;
  y: number; // paddle Y position
}

export class PongGame {
  readonly width = 800;
  readonly height = 400;
  readonly paddleHeight = 80;
  readonly ballSize = 10;
  readonly winningScore = 10;

  matchId: string;

  ball = { x: this.width / 2, y: this.height / 2, vx: 4, vy: 2 };
  players: { left?: Player; right?: Player } = {};
  scores = { left: 0, right: 0 };

  // Optional callback to notify when game ends
  onGameEnd?: (winnerSide: PlayerSide, winnerAlias: string) => void;

  constructor(matchId: string) {
    this.matchId = matchId;
  }

  async update(): Promise<boolean> {
    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Bounce on top/bottom walls
    if (this.ball.y <= 0 || this.ball.y >= this.height - this.ballSize) {
      this.ball.vy *= -1;
    }

    // Paddle collision & scoring left side
    if (this.ball.x <= 20 && this.players.left) {
      if (this.ball.y >= this.players.left.y && this.ball.y <= this.players.left.y + this.paddleHeight) {
        this.ball.vx *= -1;
      } else {
        this.scores.right++;
        const gameEnded = await this.checkWinner('right');
        if (gameEnded) return true;
        this.resetBall();
      }
    }

    // Paddle collision & scoring right side
    if (this.ball.x >= this.width - 20 && this.players.right) {
      if (this.ball.y >= this.players.right.y && this.ball.y <= this.players.right.y + this.paddleHeight) {
        this.ball.vx *= -1;
      } else {
        this.scores.left++;
        const gameEnded = await this.checkWinner('left');
        if (gameEnded) return true;
        this.resetBall();
      }
    }

    return false; // Game still ongoing
  }

  private async checkWinner(side: PlayerSide): Promise<boolean> {
    if (this.scores[side] >= this.winningScore) {
      const winnerAlias = this.players[side]?.alias || 'Unknown';
      console.log(`Player on side ${side} (${winnerAlias}) won the game!`);

      // Save score to scoreboard-service
      if (this.players[side]) {
        await saveScore(winnerAlias, this.scores[side]);
      }

      // Notify if callback is set
      if (this.onGameEnd) {
        this.onGameEnd(side, winnerAlias);
      }

      this.resetGame();
      return true;
    }
    return false;
  }

  private resetRound() {
    this.scores = { left: 0, right: 0 };
    this.resetBall();
  }

  private resetGame() {
    this.resetRound();
    this.players = {};
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

  removePlayer(alias: string): boolean {
    if (this.players.left?.alias === alias) {
      delete this.players.left;
      return true;
    }
    if (this.players.right?.alias === alias) {
      delete this.players.right;
      return true;
    }
    return false;
  }

  isFull(): boolean {
    return !!(this.players.left && this.players.right);
  }

  resetBall() {
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: 2,
    };
  }

  getState() {
    return {
      ball: this.ball,
      players: this.players,
      scores: this.scores,
    };
  }

  getPlayers() {
    return {
      left: this.players.left?.alias ?? null,
      right: this.players.right?.alias ?? null,
    };
  }
}
