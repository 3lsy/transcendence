import Fastify from 'fastify';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database<sqlite3.Database, sqlite3.Statement>;

async function initDb() {
  db = await open({
    filename: path.join(process.cwd(), 'scoreboard.db'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

const fastify = Fastify({ logger: true });

fastify.get('/', async () => {
  const rows = await db.all(`
    SELECT nickname, score, created_at
    FROM scores
    ORDER BY score DESC, created_at ASC
  `);
  return rows;
});

fastify.post('/', async (req, reply) => {
  const body = req.body as { nickname: string; score: number };

  if (!body.nickname || typeof body.score !== 'number') {
    reply.status(400).send({ error: 'Invalid input' });
    return;
  }

  await db.run(
    `INSERT INTO scores (nickname, score) VALUES (?, ?)`,
    body.nickname,
    body.score
  );

  return { message: 'Score saved', data: body };
});

fastify.get('/health', async () => ({ status: 'Scoreboard Service OK' }));

export const startScoreboardService = async () => {
  try {
    await initDb();
    await fastify.listen({ port: 3602, host: '0.0.0.0' });
    console.log('Scoreboard Service running on http://localhost:3602');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
