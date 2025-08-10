import Fastify from 'fastify';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { registerScoreboardRoutes } from './routes';

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
