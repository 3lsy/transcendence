import { saveScore } from "./saveScore";

type PlayerSide = 'left' | 'right';

interface Player {
  alias: string;
  side: PlayerSide;
  y: number; // paddle Y position
}

type BotDifficulty = "easy" | "medium" | "hard";

interface BotConfig {
  aimError: number;
}

interface BotState {
  targetY: number;
  lastDecision: number;
}

const BOT_REACTION_INTERVAL = 1000; // ms between decisions (1s)

const BOT_SETTINGS: Record<BotDifficulty, BotConfig> = {
  easy: { aimError: 80 },
  medium: { aimError: 40 },
  hard: { aimError: 20 },
};

const TOURNAMENT_SERVICE_URL = process.env.TOURNAMENT_SERVICE_URL ?? "http://tournament-service:3603"

export const PADDLE_STEP = 10;

export class PongGame {
  readonly width = 800;
  readonly height = 400;
  readonly paddleHeight = 80;
  readonly ballSize = 10;
  readonly winningScore = 11;
  private gameEnded = false;
  private finalResult: {
    winnerSide: PlayerSide;
    winnerAlias: string;
    scores: { left: number; right: number };
  } | null = null;
  private botStates: { left?: BotState; right?: BotState } = {};


  matchId: string;
  tournamentId: string | null = null;

  ball = { x: this.width / 2, y: this.height / 2, vx: 4, vy: 2 };
  players: { left?: Player; right?: Player } = {};
  scores = { left: 0, right: 0 };

  // overload signatures
  constructor(matchId: string);
  constructor(matchId: string, tournamentId: string);

  constructor(matchId: string, tournamentId?: string) {
    this.matchId = matchId;
    if (tournamentId) {
      this.tournamentId = tournamentId;
    }
  }

  async update(): Promise<boolean> {
    if (this.gameEnded) return true; // Game already ended
    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Bounce on top/bottom walls
    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.vy *= -1;
    } else if (this.ball.y >= this.height - this.ballSize) {
      this.ball.y = this.height - this.ballSize;
      this.ball.vy *= -1;
    }

    // Paddle collision & scoring left side
    if (this.ball.x <= 20 && this.players.left) {
      if (this.ball.y >= this.players.left.y && this.ball.y <= this.players.left.y + this.paddleHeight) {
        this.ball.x = 20;
        this.ball.vx *= -1;
      } else {
        this.scores.right++;
        this.gameEnded = await this.checkWinner('right');
        if (this.gameEnded) return true;
        this.resetBall();
      }
    }

    // Paddle collision & scoring right side
    else if (this.ball.x >= this.width - 20 && this.players.right) {
      if (this.ball.y >= this.players.right.y && this.ball.y <= this.players.right.y + this.paddleHeight) {
        this.ball.x = this.width - 20 - this.ballSize;
        this.ball.vx *= -1;
      } else {
        this.scores.left++;
        this.gameEnded = await this.checkWinner('left');
        if (this.gameEnded) return true;
        this.resetBall();
      }
    }

    for (const side of ["left", "right"] as PlayerSide[]) {
      const player = this.players[side];
      if (!player || !player.alias.startsWith("Bot")) continue;

      const difficulty: BotDifficulty =
        player.alias.startsWith("BotE") ? "easy" :
          player.alias.startsWith("BotM") ? "medium" : "hard";

      const settings = BOT_SETTINGS[difficulty];
      const state = this.botStates[side] ?? { targetY: player.y + this.paddleHeight / 2, lastDecision: 0 };

      const now = Date.now();

      // Only refresh target once per second
      if (now - state.lastDecision > BOT_REACTION_INTERVAL) {
        this.botThink(side, settings);
      }

      // Move paddle gradually toward targetY
      const paddleCenter = player.y + this.paddleHeight / 2;
      if (Math.abs(state.targetY - paddleCenter) > settings.aimError) {
        if (state.targetY < paddleCenter) this.movePaddle(side, -PADDLE_STEP, true);
        else this.movePaddle(side, +PADDLE_STEP, true);
      }
    }

    return false; // Game still ongoing
  }

  private botThink(side: PlayerSide, settings: BotConfig) {
    const bot = this.players[side];
    if (!bot) return;

    const predictedY = this.predictBallY(side);

    // Add imperfection (aim error)
    const targetY = predictedY + (Math.random() * settings.aimError - settings.aimError / 2);

    this.botStates[side] = {
      targetY,
      lastDecision: Date.now(),
    };
  }


  private predictBallY(side: PlayerSide): number {
    let { x, y, vx, vy } = { ...this.ball };
    const targetX = side === "left" ? 20 : this.width - 20 - this.ballSize;

    // Simulate until ball reaches paddle line
    while ((vx < 0 && x > targetX) || (vx > 0 && x < targetX)) {
      x += vx;
      y += vy;

      // Bounce off walls
      if (y <= 0 || y >= this.height - this.ballSize) {
        vy *= -1;
        y = Math.max(0, Math.min(this.height - this.ballSize, y));
      }
    }
    return y;
  }



  private async checkWinner(side: PlayerSide): Promise<boolean> {
    console.log(`Checking winner for side: ${side}, score: ${this.scores[side]}`);
    if (this.scores[side] >= (this.winningScore)) {
      this.gameEnded = true;
      const winnerAlias = this.players[side]?.alias || 'Unknown';
      const loserSide: PlayerSide = side === 'left' ? 'right' : 'left';
      const loserAlias = this.players[loserSide]?.alias || 'Unknown';

      // save the game result
      this.finalResult = {
        winnerSide: side,
        winnerAlias,
        scores: { left: this.scores.left, right: this.scores.right },
      };

      console.log(`Player on side ${side} (${winnerAlias}) won the game!`);

      // Save score to scoreboard-service
      if (this.players[side] && this.players[loserSide]) {
        if (side === 'left') {
          await saveScore(this.matchId, winnerAlias, this.scores[side], loserAlias, this.scores[loserSide]);
        }
        else {
          await saveScore(this.matchId, loserAlias, this.scores[loserSide], winnerAlias, this.scores[side]);
        }
      }

      if (this.tournamentId) {
        // fetch POST request to tournament service to save the match result
        try {
          const res = await fetch(`${TOURNAMENT_SERVICE_URL}/match-finished`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tournamentId: this.tournamentId,
              matchId: this.matchId,
              winnerSide: side,
              winnerAlias
            }),
          });

          if (!res.ok) {
            console.error('Failed to save match result in tournament service');
          } else {
            console.log('Match result saved in tournament service');
          }
        }
        catch (error) {
          console.error('Error saving match result in tournament service:', error);
        }
      }

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

  movePaddle(side: PlayerSide, dy: number, isBotMove = false) {
    const player = this.players[side];
    if (!player) return;
    if (player.alias.startsWith("Bot") && !isBotMove) return; // Prevent human from moving bot paddle
    player.y = Math.max(0, Math.min(this.height - this.paddleHeight, player.y + dy));
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
    return !!(this.players.left && this.players.right &&
      this.players.left.alias.trim() !== '' &&
      this.players.right.alias.trim() !== ''
    );
  }

  resetBall() {
    const speed = 4.5;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // small random angle
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: direction * speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
    };
  }

  getState() {
    return {
      ball: this.ball,
      players: this.players,
      scores: this.scores,
      target: this.winningScore,
    };
  }

  getResult() {
    return this.finalResult;
  }

  getPlayers() {
    return {
      left: this.players.left?.alias ?? null,
      right: this.players.right?.alias ?? null,
    };
  }

  // Start the pong game
  started = false;

  start() {
    if (this.isFull()) {
      this.started = true;
      this.resetBall();
      this.finalResult = null;
      this.gameEnded = false;
      this.scores = { left: 0, right: 0 };
    }
  }

  // Stop the game immediately, quitting the match
  quit() {
    this.gameEnded = true;
    this.started = false;
    this.resetGame(); // cleans scores, players, ball
  }

}
