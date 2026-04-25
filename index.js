require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const validator = require("validator");
const { createObjectCsvStringifier } = require("csv-writer");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

function calculateScore(lead) {
  let score = 0;

  if (lead.help_7_days === "Yes") score += 25;

  const majorIssues = ["Collections", "Charge-offs", "Identity theft", "Inaccurate account"];
  if (majorIssues.includes(lead.main_issue)) score += 20;

  const highValueGoals = ["Buy a home", "Buy a car", "Rent an apartment"];
  if (highValueGoals.includes(lead.main_goal)) score += 20;

  const lowCreditScores = ["Under 500", "500–579", "580–649", "500-579", "580-649"];
  if (lowCreditScores.includes(lead.credit_score_range)) score += 15;

  if (lead.checked_recently === "Yes") score += 10;
  if (lead.consent) score += 10;

  return score;
}

app.post("/api/leads", (req, res) => {
  const { name, phone, email, state, consent, source } = req.body;

  if (!name || !phone || !email || !state) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email." });
  }

  try {
    const existing = db.prepare("SELECT id FROM leads WHERE email = ? OR phone = ?").get(email, phone);

    if (existing) {
      return res.status(409).json({ error: "Lead already exists." });
    }

    const id = uuidv4();
    const score = calculateScore(req.body);

    const stmt = db.prepare(`
      INSERT INTO leads (
        id, name, phone, email, credit_score_range, main_goal, main_issue,
        checked_recently, help_7_days, state, consent, score, status, source
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)
    `);

    stmt.run(
      id,
      name,
      phone,
      email,
      req.body.credit_score_range || "",
      req.body.main_goal || "",
      req.body.main_issue || "",
      req.body.checked_recently || "No",
      req.body.help_7_days || "No",
      state,
      consent ? 1 : 0,
      score,
      source || "direct"
    );

    console.log("Mock email notification: New lead submitted:", email);

    res.status(201).json({ id, score });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/leads", (req, res) => {
  const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
  res.json(leads);
});

app.patch("/api/leads/:id", (req, res) => {
  const { status, notes, assigned_buyer } = req.body;

  const stmt = db.prepare(`
    UPDATE leads
    SET status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        assigned_buyer = COALESCE(?, assigned_buyer),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(status, notes, assigned_buyer, req.params.id);

  res.json({ message: "Updated" });
});

app.get("/api/leads/export", (req, res) => {
  const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();

  if (leads.length === 0) {
    return res.send("No leads yet");
  }

  const csvStringifier = createObjectCsvStringifier({
    header: Object.keys(leads[0]).map((k) => ({ id: k, title: k }))
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
  res.send(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(leads));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend API running at http://localhost:${port}`);
});
