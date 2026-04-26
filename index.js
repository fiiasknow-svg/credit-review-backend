require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    score INTEGER,
    status TEXT,
    source TEXT,
    main_issue TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save lead
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, score, status, source, main_issue } = req.body;

    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, score, status, source, main_issue)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, email, phone, score, status, source, main_issue]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

// Get leads
app.get("/api/leads", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM leads ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API running on ${port}`);
});