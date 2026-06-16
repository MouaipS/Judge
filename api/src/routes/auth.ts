import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email et password requis" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "mot de passe trop court (8 min)" });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "username ou email déjà utilisé" });
    }
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email et password requis" });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "identifiants invalides" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "identifiants invalides" });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

authRouter.get("/me", requireAuth, async(req, res) =>{
  const result = await pool.query(
    `SELECT id, username, email, display_name, bio, avatar_url, created_at
     FROM users WHERE id = $1`,
    [req.userId]
  );
  res.json({ user: result.rows[0] });
})