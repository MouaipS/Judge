import { Router } from "express";
import { searchMovies } from "../services/tmdb.js";

export const moviesRouter = Router();

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