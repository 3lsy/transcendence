import { fetch } from 'undici';

// This function will call the game service to create a new game
export async function newGame(
  nick_left: string, 
  nick_right: string
) : Promise<string | null> {
  try {
    const res = await fetch('http://game-service:3601/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick_left, nick_right }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to create new game:', text);
      return null;
    }
    const data = await res.json() as { matchId: string };
    console.log(`New game created: ${data.matchId}`);
    return data.matchId;
  } catch (error) {
    console.error('Error creating new game:', error);
    return null;
  }
}
