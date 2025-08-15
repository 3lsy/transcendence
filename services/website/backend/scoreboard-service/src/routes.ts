import { FastifyInstance } from 'fastify';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';

// Description:
// This module registers the routes for the Scoreboard service.
// Routes:
// - GET /health: Check service health
// - POST /score: Save a player's score
// - GET /leaderboard: Retrieve the top scores

export function registerScoreboardRoutes(
  fastify: FastifyInstance,
  db: Database<sqlite3.Database, sqlite3.Statement>
) {
  fastify.get('/health', async () => ({ status: 'Scoreboard Service OK' }));

  // Save a player's score
  fastify.post('/score', async (req, reply) => {
    const body = req.body as { left_nick: string; left_score: number; right_nick: string; right_score: number };

    if ((!body.left_nick || typeof body.left_score !== 'number') ||
        (!body.right_nick || typeof body.right_score !== 'number')) {
      reply.status(400).send({ error: 'Invalid input' });
      return;
    }

    await db.run(
      `INSERT INTO scores (left_nick, left_score, right_nick, right_score) VALUES (?, ?, ?, ?)`,
      body.left_nick,
      body.left_score,
      body.right_nick,
      body.right_score
    );

    return { message: 'Score saved', data: body };
  });

  // Retrieve scoreboard (highest scores first)
  fastify.get('/scoreboard', async () => {
    const rows = await db.all(`
      SELECT created_at, left_nick, left_score, right_nick, right_score
      FROM scores
      ORDER BY created_at DESC
      LIMIT 30
    `);
    return rows;
  });
}
