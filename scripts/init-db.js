const db = require("../db");

function init() {
  console.log("Initializing database...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      credit_score_range TEXT,
      main_goal TEXT,
      main_issue TEXT,
      checked_recently TEXT,
      help_7_days TEXT,
      state TEXT,
      consent INTEGER,
      score INTEGER,
      status TEXT DEFAULT 'New',
      notes TEXT,
      assigned_buyer TEXT,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database initialized successfully.");
}

if (require.main === module) {
  init();
}

module.exports = init;
