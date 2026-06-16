import express from "express";
import "dotenv/config";
import { pool } from "./db.js";

const app = express();
app.use(express.json());

// Healthcheck
app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT now()");
    res.json({ status: "ok", db_time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "DB unreachable" });
  }
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`API en écoute sur http://localhost:${port}`);
});