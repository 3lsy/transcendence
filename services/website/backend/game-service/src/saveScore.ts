import { fetch } from 'undici';

export async function saveScore(alias: string, score: number) {
  try {
    const res = await fetch('http://scoreboard-service:3602/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: alias, score }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to save score:', text);
    } else {
      console.log(`Score saved for ${alias}: ${score}`);
    }
  } catch (error) {
    console.error('Error saving score:', error);
  }
}
