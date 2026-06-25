import { Router } from "express";
import { searchMovies } from "../services/tmdb.js";
import { pool } from "../db.js";
import { similarity } from "../utils/levenshtein.js";

export const moviesRouter = Router();

moviesRouter.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res.status(400).json({ error: "paramètre q requis" });
  }

  try {
    let movies = await searchMovies(q);

    if (movies.length === 0) {
      const result = await pool.query(
        `SELECT tmdb_id, title, release_year, poster_path
         FROM movies
         WHERE title ILIKE $1
         ORDER BY title
         LIMIT 10`,
        [`%${q.trim()}%`]
      );
      movies = result.rows;
    }

    movies.sort((a, b) => similarity(q, b.title) - similarity(q, a.title));

    res.json({ movies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur recherche" });
  }
});
