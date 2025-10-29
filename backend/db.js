const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "db.sqlite");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

// Export a promise that resolves to the open database
const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database,
});

module.exports = { dbPromise, dbPath };
