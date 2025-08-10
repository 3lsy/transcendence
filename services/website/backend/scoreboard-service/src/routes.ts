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

  // Retrieve leaderboard (highest scores first)
  fastify.get('/leaderboard', async () => {
    const rows = await db.all(`
      SELECT nickname, score, created_at
      FROM scores
      ORDER BY score DESC, created_at ASC
      LIMIT 10
    `);
    return rows;
  });
}
