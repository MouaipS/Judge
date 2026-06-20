import { Router } from "express";
import { pool } from "../db.js";
import { avatarUrl } from "../services/storage.js";

export const usersRouter = Router();

usersRouter.get("/:username", async (req, res) => {
  try {
    // 1) Le profil public
    const userResult = await pool.query(
      `SELECT username, display_name, bio, avatar_url, created_at
       FROM users
       WHERE username = $1`,
      [req.params.username]
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