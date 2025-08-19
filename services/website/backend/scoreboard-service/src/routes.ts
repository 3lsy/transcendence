import { FastifyInstance } from 'fastify';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';

// Description:
// This module registers the routes for the Scoreboard service.
// Routes:
// - GET /health: Check service health
// - POST /score: Save a player's score
// - GET /list: Retrieve the scoreboard list (newest matches first)

const MAX_RECORDS = 100; // Limit for storing scores

export function registerScoreboardRoutes(
  fastify: FastifyInstance,
  db: Database<sqlite3.Database, sqlite3.Statement>
) {
  fastify.get('/health', async () => ({ status: 'Scoreboard Service OK' }));

  // Save a player's score
  fastify.post('/score', async (req, reply) => {
    const body = req.body as { match_id: string; left_nick: string; left_score: number; right_nick: string; right_score: number };

    if ((!body.left_nick || typeof body.left_score !== 'number') ||
        (!body.right_nick || typeof body.right_score !== 'number') ||
        !body.match_id) {
      reply.status(400).send({ error: 'Invalid input' });
      return;
    }

    await db.run(
      `INSERT INTO scores (match_id, left_nick, left_score, right_nick, right_score) VALUES (?, ?, ?, ?, ?)`,
      body.match_id,
      body.left_nick,
      body.left_score,
      body.right_nick,
      body.right_score
    );

    // Deletes oldest records if exceeding MAX_RECORDS
    await db.run(
      `DELETE FROM scores
       WHERE id NOT IN (
         SELECT id FROM scores
         ORDER BY created_at DESC
         LIMIT ?
       )`,
      MAX_RECORDS
    );

    return { message: 'Score saved', data: body };
  });

  // Retrieve scoreboard list (Newest matches first)
  fastify.get('/list', async () => {
    const rows = await db.all(`
      SELECT created_at, left_nick, left_score, right_nick, right_score
      FROM scores
      ORDER BY created_at DESC
      LIMIT 30
    `);
    return rows;
  });

  fastify.get('/get-match', async (req, reply) => {
    const matchId = (req.query as { matchId?: string }).matchId;
    if (!matchId) {
      reply.status(400).send({ error: 'Match ID is required' });
      return;
    }

    const row = await db.get(
      `SELECT created_at, left_nick, left_score, right_nick, right_score
       FROM scores 
       WHERE match_id = ?
       LIMIT 1`,
       matchId
    );

    if (!row) {
      reply.code(404).send({ error: 'No result found for this matchId' });
      return;
    }

    // get the winner of the match
    let winner: string | null = null;
    if (row.left_score > row.right_score) {
      winner = row.left_nick;
    } else if (row.right_score > row.left_score) {
      winner = row.right_nick;
    }

    return {
      matchId,
      left: { nick: row.left_nick, score: row.left_score },
      right: { nick: row.right_nick, score: row.right_score },
      winner,
    };
  });

}
