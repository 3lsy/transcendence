import Fastify from 'fastify';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { registerScoreboardRoutes } from './routes';

let db: Database<sqlite3.Database, sqlite3.Statement>;

async function initDb() {

  const dbPath = path.join('/app/data', 'scoreboard.db');

  await import('fs/promises').then(fs => fs.mkdir('/app/data', { recursive: true }));
  console.log(`Initializing database at ${dbPath}`);

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      left_nick TEXT NOT NULL,
      left_score INTEGER NOT NULL,
      right_nick TEXT NOT NULL,
      right_score INTEGER NOT NULL
    )
  `);
}

const fastify = Fastify({ logger: true });

const startScoreboardService = async () => {
  try {
    await initDb();

    // Register scoreboard routes
    registerScoreboardRoutes(fastify, db);

    await fastify.listen({ port: 3602, host: '0.0.0.0' });
    console.log('Scoreboard Service running on http://localhost:3602');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startScoreboardService();
