const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const dbPath = process.env.DATABASE_URL || path.join(__dirname, "leads.db");
const db = new Database(dbPath);

module.exports = db;
