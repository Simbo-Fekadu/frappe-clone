const { dbPromise, dbPath } = require("./db");

async function init() {
  const db = await dbPromise;

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      contact_id INTEGER,
      company_id INTEGER,
      value REAL DEFAULT 0,
      stage TEXT DEFAULT 'prospect',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id),
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );
    
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- call, email, task
      note TEXT,
      contact_id INTEGER,
      deal_id INTEGER,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id),
      FOREIGN KEY(deal_id) REFERENCES deals(id)
    );

    -- Attachments table: store metadata and link to contact or deal
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT,
      mime TEXT,
      size INTEGER,
      entity_type TEXT, -- 'contact' | 'deal'
      entity_id INTEGER,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications / in-app events
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      title TEXT,
      body TEXT,
      seen INTEGER DEFAULT 0,
      metadata TEXT,
      scheduled_for DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Saved filters / searches for lists and dashboards
    CREATE TABLE IF NOT EXISTS saved_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      scope TEXT, -- e.g., 'deals', 'contacts'
      filters TEXT, -- JSON encoded
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed sample data if empty
  const row = await db.get("SELECT COUNT(*) as c FROM companies");
  const companyCount = row ? row.c : 0;
  if (companyCount === 0) {
    const info = await db.run(
      "INSERT INTO companies (name) VALUES (?)",
      "Acme Corp"
    );
    const companyId = info.lastID;

    await db.run(
      "INSERT INTO contacts (first_name, last_name, email, phone, company_id) VALUES (?,?,?,?,?)",
      "John",
      "Doe",
      "john.doe@example.com",
      "+123456789",
      companyId
    );
    await db.run(
      "INSERT INTO contacts (first_name, last_name, email, phone, company_id) VALUES (?,?,?,?,?)",
      "Jane",
      "Smith",
      "jane.smith@example.com",
      "+1987654321",
      companyId
    );

    console.log("Seeded sample data.");
  } else {
    console.log("Companies already present, skipping seed.");
  }

  console.log("Database initialized at", dbPath);
  await db.close();
}

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
