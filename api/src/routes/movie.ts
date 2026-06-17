import { Router } from "express";
import { searchMovies } from "../services/tmdb.js";
import { pool } from "../db.js"; 

export const moviesRouter = Router();

// -----> Pour rechercher un film 
moviesRouter.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res.status(400).json({ error: "paramètre q requis" });
  }

  try {
    const movies = await searchMovies(q);
    res.json({ movies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur recherche TMDB" });
  }
});

// -----> Pour accumuler les reviews sur un meme film 
moviesRouter.get("/:tmdbId", async (req, res) => {
  const tmdbId = Number(req.params.tmdbId);
  if (!Number.isInteger(tmdbId)) {
    return res.status(400).json({ error: "tmdb_id invalide" });
  }

  try {
    const movieRes = await pool.query(
      `SELECT
         m.tmdb_id, m.title, m.release_year, m.poster_path,
         ROUND(AVG(r.rating), 1)::float8                          AS average_rating,
         COUNT(r.id) FILTER (WHERE r.rating IS NOT NULL)::int      AS rating_count,
         COUNT(r.id)::int                                         AS review_count
       FROM movies m
       LEFT JOIN reviews r
         ON r.tmdb_id = m.tmdb_id AND r.published_at IS NOT NULL
       WHERE m.tmdb_id = $1
       GROUP BY m.tmdb_id`,
      [tmdbId]
    );

    const movie = movieRes.rows[0];
    if (!movie) return res.status(404).json({ error: "film introuvable" });

    const reviewsRes = await pool.query(
      `SELECT
         r.id, r.headline, r.standfirst, r.cover_url, r.rating, r.published_at,
         u.id AS author_id, u.username AS author_username, u.display_name AS author_name
       FROM reviews r
       JOIN users u ON u.id = r.author_id
       WHERE r.tmdb_id = $1 AND r.published_at IS NOT NULL
       ORDER BY r.published_at DESC`,
      [tmdbId]
    );

    res.json({ movie, reviews: reviewsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});