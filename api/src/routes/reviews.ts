import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchMovie } from "../services/tmdb.js";

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