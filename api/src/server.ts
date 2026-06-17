import express from "express";
import "dotenv/config";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { reviewsRouter } from "./routes/reviews.js";
import cors from "cors";
import { moviesRouter } from "./routes/movie.js";

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
//accept for cross-origin requests (dev_)
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/movies", moviesRouter);
