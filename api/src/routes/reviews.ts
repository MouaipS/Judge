import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchMovie } from "../services/tmdb.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

export const reviewsRouter = Router();

reviewsRouter.post("/", requireAuth, async (req, res) => {
  const { tmdb_id, headline, standfirst, body, cover_url, rating, publish } = req.body;

  if (!tmdb_id || !headline || !body) {
    return res.status(400).json({ error: "tmdb_id, headline et body requis" });
  }

  try {
    const movie = await fetchMovie(Number(tmdb_id));
    if (!movie) {
      return res.status(404).json({ error: "film introuvable sur TMDB" });
    }

    await pool.query(
      `INSERT INTO movies (tmdb_id, title, release_year, poster_path)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tmdb_id) DO UPDATE
         SET title = EXCLUDED.title,
             poster_path = EXCLUDED.poster_path,
             cached_at = now()`,
      [movie.tmdb_id, movie.title, movie.release_year, movie.poster_path]
    );

    const result = await pool.query(
      `INSERT INTO reviews
         (author_id, tmdb_id, headline, standfirst, body, cover_url, rating, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.userId,
        movie.tmdb_id,
        headline,
        standfirst ?? null,
        body,
        cover_url ?? null,
        rating ?? null,
        publish ? new Date() : null,
      ]
    );

    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

// -----> Liker une critique
reviewsRouter.post("/:id/like", requireAuth, async (req, res) => {
  try {
    // ON CONFLICT DO NOTHING : liker deux fois ne fait rien (idempotent),
    // grâce à la clé primaire (user_id, review_id)
    await pool.query(
      `INSERT INTO likes (user_id, review_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, review_id) DO NOTHING`,
      [req.userId, req.params.id]
    );

    const count = await pool.query(
      `SELECT COUNT(*)::int AS like_count FROM likes WHERE review_id = $1`,
      [req.params.id]
    );

    res.json({ liked: true, like_count: count.rows[0].like_count });
  } catch (err: any) {
    // 23503 = violation de clé étrangère (review_id inexistant)
    // 22P02 = UUID mal formé dans l'URL
    if (err.code === "23503" || err.code === "22P02") {
      return res.status(404).json({ error: "critique introuvable" });
    }
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

// -----> Deliker une critique
reviewsRouter.delete("/:id/like", requireAuth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM likes WHERE user_id = $1 AND review_id = $2`,
      [req.userId, req.params.id]
    );

    const count = await pool.query(
      `SELECT COUNT(*)::int AS like_count FROM likes WHERE review_id = $1`,
      [req.params.id]
    );

    res.json({ liked: false, like_count: count.rows[0].like_count });
  } catch (err: any) {
    if (err.code === "22P02") {
      return res.status(404).json({ error: "critique introuvable" });
    }
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

reviewsRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT
         r.id, r.headline, r.standfirst, r.cover_url, r.rating, r.published_at,
         u.id AS author_id, u.username AS author_username, u.display_name AS author_name,
         m.tmdb_id, m.title AS movie_title, m.release_year, m.poster_path
       FROM reviews r
       JOIN users u  ON u.id = r.author_id
       JOIN movies m ON m.tmdb_id = r.tmdb_id
       WHERE r.published_at IS NOT NULL
       ORDER BY r.published_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ reviews: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

reviewsRouter.get("/:id", optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id, r.headline, r.standfirst, r.body, r.cover_url, r.rating,
         r.published_at, r.created_at,
         u.id AS author_id, u.username AS author_username,
         u.display_name AS author_name, u.avatar_url AS author_avatar, u.bio AS author_bio,
         m.tmdb_id, m.title AS movie_title, m.release_year, m.poster_path,
         (SELECT COUNT(*) FROM likes l WHERE l.review_id = r.id)::int AS like_count,
         EXISTS(
           SELECT 1 FROM likes l
           WHERE l.review_id = r.id AND l.user_id = $2
         ) AS liked_by_me
       FROM reviews r
       JOIN users u  ON u.id = r.author_id
       JOIN movies m ON m.tmdb_id = r.tmdb_id
       WHERE r.id = $1`,
      [req.params.id, req.userId ?? null]
    );

    const review = result.rows[0];
    if (!review) {
      return res.status(404).json({ error: "critique introuvable" });
    }
    res.json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

reviewsRouter.get("/", optionalAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT
         r.id, r.headline, r.standfirst, r.cover_url, r.rating, r.published_at,
         u.id AS author_id, u.username AS author_username, u.display_name AS author_name,
         m.tmdb_id, m.title AS movie_title, m.release_year, m.poster_path,
         (SELECT COUNT(*) FROM likes l WHERE l.review_id = r.id)::int AS like_count,
         EXISTS(
           SELECT 1 FROM likes l
           WHERE l.review_id = r.id AND l.user_id = $3
         ) AS liked_by_me
       FROM reviews r
       JOIN users u  ON u.id = r.author_id
       JOIN movies m ON m.tmdb_id = r.tmdb_id
       WHERE r.published_at IS NOT NULL
       ORDER BY r.published_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, req.userId ?? null]
    );
    res.json({ reviews: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});