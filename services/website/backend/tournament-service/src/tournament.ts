
interface Match {
  matchId?: string;
  left: string;
  right: string;
  winnerAlias?: string;
  winnerSide?: 'left' | 'right';
}

export class Tournament {
    id : string;
    players: string[];
    winners: string[];
    rounds: Match[][];
    currentRound: number;
    currentMatch: number;
    matchesLeftInRound: number = 0;
    roundsLeft: number = 0;

    constructor(id: string, players: string[]) {
        this.id = id;
        this.players = players;
        this.winners = [];
        this.rounds = [];
        this.currentRound = -1;
        this.currentMatch = 0;

        this.roundsLeft = Math.sqrt(players.length);
        this.createRound();
    }

    public createRound() {

        if (this.winners.length > 0) {
            this.players = this.winners;
            this.winners = [];
        }

        const shuffled = [...this.players].sort(() => Math.random() - 0.5);
        const matches: Match[] = [];

        for (let i = 0; i < shuffled.length; i += 2) {
            matches.push({
                left: shuffled[i],
                right: shuffled[i + 1],
            });
        }

        this.matchesLeftInRound = matches.length;
        this.currentMatch = 0;
        this.roundsLeft--;
        this.currentRound++;
        this.rounds.push(matches);
    }
}