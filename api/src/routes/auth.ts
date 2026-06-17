import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "node:crypto";
import { sendPasswordResetEmail } from "../mailer";
import { todo } from "node:test";

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


// ----->ROUTE Mot de passe oublie
authRouter.post("/forgot-password", async (req, res) => {
  console.log(`➡️  /forgot-password appelé pour ${req.body?.email}`);
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email requis" });

  try {
    const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 heure

      await pool.query(
        `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [tokenHash, user.id, expiresAt]
      );
      const resetUrl = `${process.env.WEB_URL ?? "http://localhost:5173"}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(email, resetUrl);    
    }
    // Réponse identique que le compte existe ou non (anti-énumération d'emails)
    res.json({ message: "Si un compte existe, un email a été envoyé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});


// ----->ROUTE Pour reset le mot de passe 
 authRouter.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "token et password requis" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "mot de passe trop court (8 min)" });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const result = await pool.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
      [tokenHash]
    );
    const row = result.rows[0];
    if (!row) return res.status(400).json({ error: "lien invalide ou expiré" });

    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      password_hash,
      row.user_id,
    ]);
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1`,
      [tokenHash]
    );

    res.json({ message: "Mot de passe mis à jour." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});