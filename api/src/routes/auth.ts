import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "node:crypto";
import multer from "multer";
import sharp from "sharp";
import { uploadAvatar } from "../middleware/upload.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, AVATAR_BUCKET, avatarUrl } from "../services/storage.js";

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
       RETURNING id, username, email, created_at, display_name, avatar_url`,
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
      `SELECT id, username, email, password_hash, display_name, avatar_url
       FROM users WHERE email = $1`,
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
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        display_name: user.display_name,
        avatar_url: avatarUrl(user.avatar_url), },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});

// TODO(me): Pour recuper les infos du user
authRouter.get("/me", requireAuth, async(req, res) =>{
  const result = await pool.query(
    `SELECT id, username, email, display_name, bio, avatar_url, created_at
     FROM users WHERE id = $1`,
    [req.userId]
  );
  const user = result.rows[0];
  res.json({ user: { ...user, avatar_url: avatarUrl(user.avatar_url) } });
})

// TODO(me): Pour changer les infos du user
authRouter.patch("/me", requireAuth, async (req, res) => {
  const { bio } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET bio = $1 WHERE id = $2
       RETURNING id, username, email, display_name, bio, avatar_url, created_at`,
      [bio?.trim() || null, req.userId]
    );
    const u = result.rows[0];
    res.json({ user: { ...u, avatar_url: avatarUrl(u.avatar_url) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erreur serveur" });
  }
});


// ----->ROUTE Mot de passe oublie
authRouter.post("/forgot-password", async (req, res) => {
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
      // TODO : brancher un vrai service d'email (Resend, SendGrid, nodemailer…).
      // En dev, on logue simplement le lien dans la console :
      console.log(`Lien de réinitialisation pour ${email} : ${resetUrl}`);
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

// -----> Prend le fichier image avatar en memoire puis le donne au sharp et met a jour la base 
authRouter.post(
  "/me/avatar",
  requireAuth,
  // -- adaptateur : on enrobe multer pour transformer ses erreurs en 400 JSON propres
  (req, res, next) => {
    uploadAvatar.single("avatar")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "fichier trop volumineux (5 Mo max)" });
      }
      if (err) {
        return res.status(400).json({ error: "format non supporté (jpeg, png, webp)" });
      }
      next();
    });
  },
  // -- handler principal
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "aucun fichier reçu (champ 'avatar')" });
    }

    try {
      // 1) Traitement image : carré 256x256, webp, orientation corrigée, EXIF strippé
      const processed = await sharp(req.file.buffer)
        .rotate()
        .resize(256, 256, { fit: "cover" })
        .webp({ quality: 82 })
        .toBuffer();

      // 2) Clé d'objet unique (un nouvel UUID à chaque upload)
      const key = `avatars/${crypto.randomUUID()}.webp`;

      // 3) Envoi au bucket
      await s3.send(
        new PutObjectCommand({
          Bucket: AVATAR_BUCKET,
          Key: key,
          Body: processed,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      // 4) On lit l'ancienne clé avant d'écraser, pour la supprimer ensuite
      const prev = await pool.query(`SELECT avatar_url FROM users WHERE id = $1`, [
        req.userId,
      ]);
      const oldKey: string | null = prev.rows[0]?.avatar_url ?? null;

      // 5) Mise à jour en base : on stocke la CLÉ, pas l'URL
      const result = await pool.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2
         RETURNING id, username, email, display_name, bio, avatar_url, created_at`,
        [key, req.userId]
      );

      // 6) Nettoyage best-effort de l'ancien objet
      if (oldKey && oldKey !== key) {
        s3.send(new DeleteObjectCommand({ Bucket: AVATAR_BUCKET, Key: oldKey })).catch(
          (e) => console.error("suppression ancien avatar échouée:", e)
        );
      }

      const user = result.rows[0];
      res.json({ user: { ...user, avatar_url: avatarUrl(user.avatar_url) } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "erreur serveur" });
    }
  }
); 