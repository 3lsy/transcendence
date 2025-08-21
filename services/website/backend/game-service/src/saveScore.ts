import { fetch } from 'undici';
import path from 'node:path';

const SCOREBOARD_SERVICE_URL = process.env.SCOREBOARD_SERVICE_URL || 'http://scoreboard-service:3602/';

export async function saveScore(match_id: string, left_nick: string, left_score: number, right_nick: string, right_score: number) {
  try {
    const res = await fetch(path.join(SCOREBOARD_SERVICE_URL, 'score'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id, left_nick, left_score, right_nick, right_score }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to save score:', text);
    } else {
      console.log(`Score saved for ${left_nick}: ${left_score} and ${right_nick}: ${right_score} in match: ${match_id}`);
    }
  } catch (error) {
    console.error('Error saving score:', error);
  }
}