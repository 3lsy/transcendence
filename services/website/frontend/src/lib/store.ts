// Types
export type Player = { id: string; name: string };
export type Match = { left: Player; right: Player };
export type HighScore = { name: string; points: number; date: string };

// Utils
function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------- Game ---------------------- */
let gameLeft = 'Player A';
let gameRight = 'Player B';
const TARGET_POINTS = 11;

export function setGamePlayers(left: string, right: string): void {
  gameLeft = (left || '').trim() || 'Player A';
  gameRight = (right || '').trim() || 'Player B';
}

export function getGamePlayers(): { left: string; right: string; target: number } {
  return { left: gameLeft, right: gameRight, target: TARGET_POINTS };
}

/* -------------------- High Scores -------------------- */
const LS_SCORES = 'pong:highscores:v1';

let scores: HighScore[] = (() => {
  try {
    return JSON.parse(localStorage.getItem(LS_SCORES) || '[]') as HighScore[];
  } catch {
    return [];
  }
})();

function saveScores(): void {
  try {
    localStorage.setItem(LS_SCORES, JSON.stringify(scores));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export function addScore(name: string, points: number): void {
  scores.push({ name, points, date: new Date().toISOString() });
  scores.sort((a, b) => b.points - a.points);
  scores = scores.slice(0, 10);
  saveScores();
}

export function getScores(): HighScore[] {
  return [...scores];
}

export function clearScores(): void {
  scores = [];
  saveScores();
}

/* -------------------- Tournament -------------------- */
let tSize = 2;
let tPlayers: Player[] = [];
let tPairs: Match[] = [];

export function setTournamentSize(size: number): void {
  const allowed = [2, 4, 8, 16];
  tSize = allowed.includes(size) ? size : 2;
  if (tPlayers.length > tSize) tPlayers = tPlayers.slice(0, tSize);
}

export function getTournamentSize(): number {
  return tSize;
}

export function addTournamentPlayer(name: string): void {
  const clean = (name || '').trim();
  if (!clean || tPlayers.length >= tSize) return;
  tPlayers.push({ id: uid(), name: clean });
}

export function removeTournamentPlayer(id: string): void {
  tPlayers = tPlayers.filter((p) => p.id !== id);
}

export function getTournamentPlayers(): Player[] {
  return [...tPlayers];
}

export function canStartTournament(): boolean {
  return tPlayers.length === tSize && tSize % 2 === 0;
}

export function buildFirstRound(): Match[] {
  const ps = shuffle(tPlayers);
  const pairs: Match[] = [];
  for (let i = 0; i < ps.length; i += 2) {
    const left = ps[i];
    const right = ps[i + 1];
    if (left && right) pairs.push({ left, right });
  }
  tPairs = pairs;
  return getFirstRound();
}

export function getFirstRound(): Match[] {
  return [...tPairs];
}

export function resetTournament(): void {
  tSize = 2;
  tPlayers = [];
  tPairs = [];
}