import { newGame } from './newGame';

interface Match {
  matchId?: string;
  left: string;
  right: string;
  winner?: string;
}

export class Tournament {
    id : string;
    players: string[];
    rounds: Match[][];
    currentRound: number;
    nextEvent: string | null = null;

    constructor(id: string, players: string[]) {
        this.id = id;
        this.players = players;
        this.rounds = [];
        this.currentRound = 0;

        this.createFirstRoundOrder();
    }

    private createFirstRoundOrder() {
        const shuffled = [...this.players].sort(() => Math.random() - 0.5);
        const matches: Match[] = [];

        for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({
            left: shuffled[i],
            right: shuffled[i + 1],
        });
        }

        this.rounds.push(matches);
    }
}