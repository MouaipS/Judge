import { Router } from "express";
import { searchMovies } from "../services/tmdb.js";
import { pool } from "../db.js";
import { similarity } from "../utils/levenshtein.js";

export const moviesRouter = Router();

// Normalise la query avant de la soumettre à TMDB :
// 1. Collapse les runs de 3+ chars identiques à 2 (préserve "ll", "ss"…)
// 2. Collapse les répétitions en fin de mot à 1 (les suffixes répétés sont presque toujours des fautes)
function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .replace(/(.)\1{2,}/gu, "$1$1")
    .replace(/(.)\1+$/u, "$1")
    .trim();
}

moviesRouter.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res.status(400).json({ error: "paramètre q requis" });
  }

  try {
    let movies = await searchMovies(q);

    if (movies.length === 0) {
      const base = normalizeQuery(q);
      // Construire les candidats : forme normalisée puis troncatures progressives
      const seen = new Set([q.trim()]);
      const candidates: string[] = [];
      if (!seen.has(base)) { candidates.push(base); seen.add(base); }
      for (let cut = 1; cut <= base.length - 4; cut++) {
        const c = base.slice(0, -cut);
        if (!seen.has(c)) { candidates.push(c); seen.add(c); }
      }
      for (const candidate of candidates) {
        movies = await searchMovies(candidate);
        if (movies.length > 0) break;
      }
    }

    // Dernier recours : table locale
    if (movies.length === 0) {
      const root = normalizeQuery(q).slice(0, -1) || normalizeQuery(q);
      const result = await pool.query(
        `SELECT tmdb_id, title, release_year, poster_path
         FROM movies WHERE title ILIKE $1
         ORDER BY title LIMIT 10`,
        [`%${root}%`]
      );
      movies = result.rows;
    }

    movies.sort((a, b) => {
      const simDiff = similarity(q, b.title) - similarity(q, a.title);
      if (Math.abs(simDiff) > 0.05) return simDiff;
      return (b.release_year ?? 0) - (a.release_year ?? 0);
    });

    res.json({ movies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur recherche" });
  }
});
