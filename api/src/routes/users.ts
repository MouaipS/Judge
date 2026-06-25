import { Router } from "express";
import { pool } from "../db.js";
import { avatarUrl } from "../services/storage.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.post("/:username/follow", requireAuth, async (req, res) => {
  try {
    const followeeResult = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [req.params.username]
    );
    const followee = followeeResult.rows[0];
    if (!followee) {
      return res.status(404).json({ error: "utilisateur introuvable" });
    }

    if (followee.id === req.userId) {
      return res.status(400).json({ error: "impossible de se suivre soi-même" });
    }

    await pool.query(
      `INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2)`,
      [req.userId, followee.id]
    );

    res.status(201).json({ message: "suivi" });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "déjà suivi" });
    }
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

usersRouter.delete("/:username/follow", requireAuth, async (req, res) => {
  try {
    const followeeResult = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [req.params.username]
    );
    const followee = followeeResult.rows[0];
    if (!followee) {
      return res.status(404).json({ error: "utilisateur introuvable" });
    }

    const result = await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`,
      [req.userId, followee.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "vous ne suivez pas cet utilisateur" });
    }

    res.json({ message: "désabonné" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

usersRouter.get("/:username/followers", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  try {
    const check = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [req.params.username]
    );
    if (!check.rows[0]) {
      return res.status(404).json({ error: "utilisateur introuvable" });
    }

    const result = await pool.query(
      `SELECT u.username, u.display_name, u.avatar_url, u.bio, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.followee_id = (SELECT id FROM users WHERE username = $1)
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.username, limit, offset]
    );

    res.json({
      followers: result.rows.map((r) => ({ ...r, avatar_url: avatarUrl(r.avatar_url) })),
      total: result.rowCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

usersRouter.get("/:username/following", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  try {
    const check = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [req.params.username]
    );
    if (!check.rows[0]) {
      return res.status(404).json({ error: "utilisateur introuvable" });
    }

    const result = await pool.query(
      `SELECT u.username, u.display_name, u.avatar_url, u.bio, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON u.id = f.followee_id
       WHERE f.follower_id = (SELECT id FROM users WHERE username = $1)
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.username, limit, offset]
    );

    res.json({
      following: result.rows.map((r) => ({ ...r, avatar_url: avatarUrl(r.avatar_url) })),
      total: result.rowCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

usersRouter.get("/:username", optionalAuth, async (req, res) => {
  try {
    // 1) Le profil public
    const userResult = await pool.query(
      `SELECT
         u.username, u.display_name, u.bio, u.avatar_url, u.created_at,
         (SELECT COUNT(*) FROM follows WHERE followee_id = u.id)::int AS follower_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)::int AS following_count,
         (SELECT EXISTS(
           SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = u.id
         )) AS is_following
       FROM users u
       WHERE u.username = $1`,
      [req.params.username, req.userId ?? null]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "utilisateur introuvable" });
    }

    // 2) Ses critiques publiées (même forme que le feed)
    const reviewsResult = await pool.query(
      `SELECT
         r.id, r.headline, r.standfirst, r.body, r.cover_url, r.rating, r.published_at,
         u.username AS author_username, u.display_name AS author_name,
         m.tmdb_id, m.title AS movie_title, m.release_year, m.poster_path
       FROM reviews r
       JOIN users u  ON u.id = r.author_id
       JOIN movies m ON m.tmdb_id = r.tmdb_id
       WHERE u.username = $1 AND r.published_at IS NOT NULL
       ORDER BY r.published_at DESC`,
      [req.params.username]
    );

    res.json({
      user: { ...user, avatar_url: avatarUrl(user.avatar_url) },
      reviews: reviewsResult.rows,
      review_count: reviewsResult.rowCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});