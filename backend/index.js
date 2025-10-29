const express = require("express");
const cors = require("cors");
const { dbPromise } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Contacts
app.get("/api/contacts", async (req, res) => {
  const db = await dbPromise;
  const { q, company_id, page = 1, limit = 20 } = req.query;
  const offset =
    (Math.max(parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);

  // Build WHERE clauses
  const where = [];
  const params = [];
  if (q) {
    where.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
    const like = `%${q.replace(/%/g, "\\%")}%`;
    params.push(like, like, like);
  }
  if (company_id) {
    where.push("company_id = ?");
    params.push(company_id);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await db.get(
    `SELECT COUNT(*) as c FROM contacts ${whereSQL}`,
    ...params
  );
  const total = totalRow ? totalRow.c : 0;

  const rows = await db.all(
    `SELECT contacts.*, companies.name as company_name FROM contacts LEFT JOIN companies ON contacts.company_id = companies.id ${whereSQL} ORDER BY contacts.created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    parseInt(limit, 10) || 20,
    offset
  );

  res.json({
    data: rows,
    total,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
  });
});

app.get("/api/contacts/:id", async (req, res) => {
  const id = req.params.id;
  const db = await dbPromise;
  const contact = await db.get(
    `
    SELECT contacts.*, companies.name as company_name
    FROM contacts
    LEFT JOIN companies ON contacts.company_id = companies.id
    WHERE contacts.id = ?
  `,
    id
  );
  if (!contact) return res.status(404).json({ error: "Not found" });
  res.json(contact);
});

app.post("/api/contacts", async (req, res) => {
  const { first_name, last_name, email, phone, company_id } = req.body;
  const db = await dbPromise;
  const info = await db.run(
    "INSERT INTO contacts (first_name, last_name, email, phone, company_id) VALUES (?,?,?,?,?)",
    first_name || null,
    last_name || null,
    email || null,
    phone || null,
    company_id || null
  );
  const contact = await db.get(
    "SELECT contacts.*, companies.name as company_name FROM contacts LEFT JOIN companies ON contacts.company_id = companies.id WHERE contacts.id = ?",
    info.lastID
  );
  res.status(201).json(contact);
});

app.put("/api/contacts/:id", async (req, res) => {
  const id = req.params.id;
  const { first_name, last_name, email, phone, company_id } = req.body;
  const db = await dbPromise;
  const info = await db.run(
    "UPDATE contacts SET first_name=?, last_name=?, email=?, phone=?, company_id=? WHERE id=?",
    first_name,
    last_name,
    email,
    phone,
    company_id,
    id
  );
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  const contact = await db.get(
    "SELECT contacts.*, companies.name as company_name FROM contacts LEFT JOIN companies ON contacts.company_id = companies.id WHERE contacts.id = ?",
    id
  );
  res.json(contact);
});

app.delete("/api/contacts/:id", async (req, res) => {
  const id = req.params.id;
  const db = await dbPromise;
  const info = await db.run("DELETE FROM contacts WHERE id = ?", id);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Companies
app.get("/api/companies", async (req, res) => {
  const db = await dbPromise;
  const { page = 1, limit = 50 } = req.query;
  const offset =
    (Math.max(parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 50);
  const totalRow = await db.get("SELECT COUNT(*) as c FROM companies");
  const total = totalRow ? totalRow.c : 0;
  const rows = await db.all(
    "SELECT * FROM companies ORDER BY created_at DESC LIMIT ? OFFSET ?",
    parseInt(limit, 10) || 50,
    offset
  );
  res.json({
    data: rows,
    total,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 50,
  });
});

app.post("/api/companies", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const db = await dbPromise;
  const info = await db.run("INSERT INTO companies (name) VALUES (?)", name);
  const company = await db.get(
    "SELECT * FROM companies WHERE id = ?",
    info.lastID
  );
  res.status(201).json(company);
});
// Deals
app.get("/api/deals", async (req, res) => {
  const db = await dbPromise;
  const {
    stage,
    sort_by = "created_at",
    company_id,
    contact_id,
    order = "desc",
    page = 1,
    limit = 20,
  } = req.query;
  const offset =
    (Math.max(parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);

  const where = [];
  const params = [];
  if (stage) {
    where.push("deals.stage = ?");
    params.push(stage);
  }
  if (company_id) {
    where.push("deals.company_id = ?");
    params.push(company_id);
  }
  if (contact_id) {
    where.push("deals.contact_id = ?");
    params.push(contact_id);
  }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // allow only certain sort columns to avoid SQL injection
  const allowedSort = new Set([
    "created_at",
    "value",
    "position",
    "probability",
    "expected_close",
  ]);
  const sortCol = allowedSort.has(sort_by) ? sort_by : "created_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";

  const totalRow = await db.get(
    `SELECT COUNT(*) as c FROM deals ${whereSQL}`,
    ...params
  );
  const total = totalRow ? totalRow.c : 0;

  const rows = await db.all(
    `SELECT deals.*, contacts.first_name as contact_first, contacts.last_name as contact_last, companies.name as company_name
    FROM deals
    LEFT JOIN contacts ON deals.contact_id = contacts.id
    LEFT JOIN companies ON deals.company_id = companies.id
    ${whereSQL}
    ORDER BY deals.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?`,
    ...params,
    parseInt(limit, 10) || 20,
    offset
  );

  res.json({
    data: rows,
    total,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
  });
});

// Reorder deals within a stage (and optionally move to that stage)
app.post("/api/deals/reorder", async (req, res) => {
  const { stage, ids } = req.body || {};
  if (!stage || !Array.isArray(ids)) {
    return res.status(400).json({ error: "stage and ids[] required" });
  }
  const db = await dbPromise;
  // Update sequential positions; also set stage for these ids
  await db.run("BEGIN TRANSACTION");
  try {
    for (let i = 0; i < ids.length; i++) {
      await db.run(
        "UPDATE deals SET stage = ?, position = ? WHERE id = ?",
        stage,
        i + 1,
        ids[i]
      );
    }
    await db.run("COMMIT");
  } catch (e) {
    await db.run("ROLLBACK");
    return res.status(500).json({ error: "failed to reorder" });
  }
  res.json({ success: true });
});

app.get("/api/deals/:id", async (req, res) => {
  const id = req.params.id;
  const db = await dbPromise;
  const deal = await db.get(
    `
    SELECT deals.*, contacts.first_name as contact_first, contacts.last_name as contact_last, companies.name as company_name
    FROM deals
    LEFT JOIN contacts ON deals.contact_id = contacts.id
    LEFT JOIN companies ON deals.company_id = companies.id
    WHERE deals.id = ?
  `,
    id
  );
  if (!deal) return res.status(404).json({ error: "Not found" });
  res.json(deal);
});

app.post("/api/deals", async (req, res) => {
  const {
    title,
    contact_id,
    company_id,
    value,
    stage,
    probability,
    expected_close,
  } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const db = await dbPromise;
  const info = await db.run(
    "INSERT INTO deals (title, contact_id, company_id, value, stage, probability, expected_close) VALUES (?,?,?,?,?,?,?)",
    title,
    contact_id || null,
    company_id || null,
    value || 0,
    stage || "prospect",
    Math.max(0, Math.min(100, parseFloat(probability) || 0)),
    expected_close || null
  );
  const deal = await db.get("SELECT * FROM deals WHERE id = ?", info.lastID);
  res.status(201).json(deal);
});

app.put("/api/deals/:id", async (req, res) => {
  const id = req.params.id;
  const {
    title,
    contact_id,
    company_id,
    value,
    stage,
    probability,
    expected_close,
  } = req.body;
  const db = await dbPromise;
  const info = await db.run(
    "UPDATE deals SET title=?, contact_id=?, company_id=?, value=?, stage=?, probability=?, expected_close=? WHERE id=?",
    title,
    contact_id || null,
    company_id || null,
    value || 0,
    stage || "prospect",
    Math.max(0, Math.min(100, parseFloat(probability) || 0)),
    expected_close || null,
    id
  );
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  const deal = await db.get("SELECT * FROM deals WHERE id = ?", id);
  res.json(deal);
});

app.delete("/api/deals/:id", async (req, res) => {
  const id = req.params.id;
  const db = await dbPromise;
  const info = await db.run("DELETE FROM deals WHERE id = ?", id);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Activities
app.get("/api/activities", async (req, res) => {
  const db = await dbPromise;
  const {
    contact_id,
    deal_id,
    page = 1,
    limit = 50,
    sort_by = "created_at",
    order = "desc",
  } = req.query;
  const offset =
    (Math.max(parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 50);

  const where = [];
  const params = [];
  if (contact_id) {
    where.push("activities.contact_id = ?");
    params.push(contact_id);
  }
  if (deal_id) {
    where.push("activities.deal_id = ?");
    params.push(deal_id);
  }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await db.get(
    `SELECT COUNT(*) as c FROM activities ${whereSQL}`,
    ...params
  );
  const total = totalRow ? totalRow.c : 0;

  const allowedSort = new Set(["created_at", "due_date"]);
  const sortCol = allowedSort.has(sort_by) ? sort_by : "created_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";

  const rows = await db.all(
    `SELECT activities.*, contacts.first_name as contact_first, contacts.last_name as contact_last, deals.title as deal_title FROM activities LEFT JOIN contacts ON activities.contact_id = contacts.id LEFT JOIN deals ON activities.deal_id = deals.id ${whereSQL} ORDER BY activities.${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
    ...params,
    parseInt(limit, 10) || 50,
    offset
  );

  res.json({
    data: rows,
    total,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 50,
  });
});

app.post("/api/activities", async (req, res) => {
  const { type, note, contact_id, deal_id, due_date } = req.body;
  if (!type) return res.status(400).json({ error: "type required" });
  const db = await dbPromise;
  const info = await db.run(
    "INSERT INTO activities (type, note, contact_id, deal_id, due_date) VALUES (?,?,?,?,?)",
    type,
    note || null,
    contact_id || null,
    deal_id || null,
    due_date || null
  );
  const activity = await db.get(
    "SELECT * FROM activities WHERE id = ?",
    info.lastID
  );
  res.status(201).json(activity);
});

app.put("/api/activities/:id", async (req, res) => {
  const id = req.params.id;
  const { type, note, contact_id, deal_id, due_date } = req.body;
  const db = await dbPromise;
  const info = await db.run(
    "UPDATE activities SET type = ?, note = ?, contact_id = ?, deal_id = ?, due_date = ? WHERE id = ?",
    type || null,
    note || null,
    contact_id || null,
    deal_id || null,
    due_date || null,
    id
  );
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  const activity = await db.get("SELECT * FROM activities WHERE id = ?", id);
  res.json(activity);
});

app.delete("/api/activities/:id", async (req, res) => {
  const id = req.params.id;
  const db = await dbPromise;
  const info = await db.run("DELETE FROM activities WHERE id = ?", id);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Global search across companies, contacts, deals
app.get("/api/search", async (req, res) => {
  const db = await dbPromise;
  const { q = "" } = req.query;
  const like = `%${String(q).trim().replace(/%/g, "\\%")}%`;
  try {
    const companies = await db.all(
      "SELECT id, name as label, 'company' as type FROM companies WHERE name LIKE ? ORDER BY created_at DESC LIMIT 5",
      like
    );
    const contacts = await db.all(
      "SELECT id, (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) as label, email as subtitle, 'contact' as type FROM contacts WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT 5",
      like,
      like,
      like
    );
    const deals = await db.all(
      "SELECT id, title as label, stage as subtitle, 'deal' as type FROM deals WHERE title LIKE ? ORDER BY created_at DESC LIMIT 5",
      like
    );
    res.json({ data: [...deals, ...contacts, ...companies] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "search failed" });
  }
});

// Leads CRUD
app.get("/api/leads", async (req, res) => {
  const db = await dbPromise;
  const { q, status, source, page = 1, limit = 20 } = req.query;
  const offset =
    (Math.max(parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);
  const where = [];
  const params = [];
  if (q) {
    const like = `%${String(q).replace(/%/g, "\\%")}%`;
    where.push(
      "(name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)"
    );
    params.push(like, like, like, like);
  }
  if (status) {
    where.push("status = ?");
    params.push(status);
  }
  if (source) {
    where.push("source = ?");
    params.push(source);
  }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const totalRow = await db.get(
    `SELECT COUNT(*) as c FROM leads ${whereSQL}`,
    ...params
  );
  const rows = await db.all(
    `SELECT * FROM leads ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    parseInt(limit, 10) || 20,
    offset
  );
  res.json({
    data: rows,
    total: totalRow?.c || 0,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
  });
});

app.get("/api/leads/:id", async (req, res) => {
  const db = await dbPromise;
  const lead = await db.get("SELECT * FROM leads WHERE id = ?", req.params.id);
  if (!lead) return res.status(404).json({ error: "Not found" });
  res.json(lead);
});

app.post("/api/leads", async (req, res) => {
  const { name, email, phone, company, source, status } = req.body || {};
  if (!name && !email)
    return res.status(400).json({ error: "name or email required" });
  const db = await dbPromise;
  const info = await db.run(
    "INSERT INTO leads (name, email, phone, company, source, status) VALUES (?,?,?,?,?,?)",
    name || null,
    email || null,
    phone || null,
    company || null,
    source || null,
    status || "open"
  );
  const lead = await db.get("SELECT * FROM leads WHERE id = ?", info.lastID);
  res.status(201).json(lead);
});

app.put("/api/leads/:id", async (req, res) => {
  const { name, email, phone, company, source, status, converted } =
    req.body || {};
  const db = await dbPromise;
  const info = await db.run(
    "UPDATE leads SET name=?, email=?, phone=?, company=?, source=?, status=?, converted=? WHERE id=?",
    name || null,
    email || null,
    phone || null,
    company || null,
    source || null,
    status || "open",
    converted ? 1 : 0,
    req.params.id
  );
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  const lead = await db.get("SELECT * FROM leads WHERE id = ?", req.params.id);
  res.json(lead);
});

app.delete("/api/leads/:id", async (req, res) => {
  const db = await dbPromise;
  const info = await db.run("DELETE FROM leads WHERE id = ?", req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Convert lead to contact (+company) and deal
app.post("/api/leads/:id/convert", async (req, res) => {
  const db = await dbPromise;
  const id = req.params.id;
  const lead = await db.get("SELECT * FROM leads WHERE id = ?", id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  const {
    create_deal = true,
    deal_title,
    value = 0,
    stage = "prospect",
    probability = 10,
  } = req.body || {};
  await db.run("BEGIN TRANSACTION");
  try {
    let companyId = null;
    if (lead.company) {
      const existing = await db.get(
        "SELECT id FROM companies WHERE name = ?",
        lead.company
      );
      if (existing) companyId = existing.id;
      else {
        const cinfo = await db.run(
          "INSERT INTO companies (name) VALUES (?)",
          lead.company
        );
        companyId = cinfo.lastID;
      }
    }
    const contactInfo = await db.run(
      "INSERT INTO contacts (first_name, last_name, email, phone, company_id) VALUES (?,?,?,?,?)",
      lead.name || null,
      null,
      lead.email || null,
      lead.phone || null,
      companyId
    );
    let dealId = null;
    if (create_deal) {
      const dinfo = await db.run(
        "INSERT INTO deals (title, contact_id, company_id, value, stage, probability) VALUES (?,?,?,?,?,?)",
        deal_title || lead.company || lead.name || "New Deal",
        contactInfo.lastID,
        companyId,
        value || 0,
        stage || "prospect",
        probability || 0
      );
      dealId = dinfo.lastID;
    }
    await db.run(
      "UPDATE leads SET converted = 1, status = 'converted' WHERE id = ?",
      id
    );
    await db.run("COMMIT");
    res.json({
      success: true,
      contact_id: contactInfo.lastID,
      company_id: companyId,
      deal_id: dealId,
    });
  } catch (e) {
    await db.run("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "conversion failed" });
  }
});

// Reports: pipeline totals
app.get("/api/reports/pipeline_totals", async (req, res) => {
  const db = await dbPromise;
  const { date_from, date_to } = req.query;
  const where = [];
  const params = [];
  if (date_from) {
    where.push("deals.created_at >= ?");
    params.push(date_from);
  }
  if (date_to) {
    where.push("deals.created_at <= ?");
    params.push(date_to);
  }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await db.all(
    `SELECT stage, COUNT(*) as count, SUM(value) as total_value, SUM(value * (COALESCE(probability,0)/100.0)) as total_weighted
     FROM deals ${whereSQL}
     GROUP BY stage`,
    ...params
  );
  res.json({ data: rows });
});

app.get("/", (req, res) => res.json({ ok: true, msg: "Frappe CRM clone API" }));

// Ensure schema migrations on startup (add deals.position if missing)
async function ensureDealsPosition() {
  const db = await dbPromise;
  const cols = await db.all("PRAGMA table_info('deals')");
  const hasPosition =
    Array.isArray(cols) && cols.some((c) => c.name === "position");
  if (!hasPosition) {
    await db.run("ALTER TABLE deals ADD COLUMN position INTEGER DEFAULT 0");
    // Initialize positions per stage by created_at
    const stages = [
      "prospect",
      "qualified",
      "proposal",
      "closed-won",
      "closed-lost",
    ];
    for (const s of stages) {
      const rows = await db.all(
        "SELECT id FROM deals WHERE stage = ? ORDER BY created_at ASC",
        s
      );
      let i = 1;
      for (const r of rows) {
        await db.run("UPDATE deals SET position = ? WHERE id = ?", i++, r.id);
      }
    }
    console.log("[migrate] deals.position column added and initialized");
  }
}

// Ensure leads table exists
async function ensureLeadsTable() {
  const db = await dbPromise;
  const tbl = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='leads'"
  );
  if (!tbl) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        company TEXT,
        source TEXT,
        status TEXT DEFAULT 'open',
        converted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[migrate] leads table created");
  }
}

// Ensure forecast fields on deals
async function ensureDealsForecastFields() {
  const db = await dbPromise;
  const cols = await db.all("PRAGMA table_info('deals')");
  const hasProb =
    Array.isArray(cols) && cols.some((c) => c.name === "probability");
  const hasClose =
    Array.isArray(cols) && cols.some((c) => c.name === "expected_close");
  if (!hasProb) {
    await db.run("ALTER TABLE deals ADD COLUMN probability INTEGER DEFAULT 0");
  }
  if (!hasClose) {
    await db.run("ALTER TABLE deals ADD COLUMN expected_close DATETIME");
  }
  if (!hasProb || !hasClose) {
    console.log("[migrate] deals.probability/expected_close ensured");
  }
}

(async () => {
  try {
    await ensureDealsPosition();
    await ensureLeadsTable();
    await ensureDealsForecastFields();
  } catch (e) {
    console.error("Migration error:", e);
  }
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
})();
// (old synchronous handlers removed)
