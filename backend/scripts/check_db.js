const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
(async () => {
  try {
    const dbPath = path.join(__dirname, "..", "data", "db.sqlite");
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const c = await db.get("SELECT COUNT(*) as c FROM companies");
    const contacts = await db.get("SELECT COUNT(*) as c FROM contacts");
    const deals = await db.get("SELECT COUNT(*) as c FROM deals");
    console.log("DB Path:", dbPath);
    console.log("companies:", c?.c || 0);
    console.log("contacts:", contacts?.c || 0);
    console.log("deals:", deals?.c || 0);
    await db.close();
  } catch (e) {
    console.error("Error reading DB:", e.message || e);
    process.exit(1);
  }
})();
