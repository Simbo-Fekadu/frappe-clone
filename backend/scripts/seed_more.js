const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
(async () => {
  try {
    const dbPath = path.join(__dirname, "..", "data", "db.sqlite");
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    console.log("Seeding additional sample data into", dbPath);

    await db.run("BEGIN TRANSACTION");
    try {
      // Companies
      const companies = ["Globex Inc", "Soylent Corp", "Initech"];
      const compIds = [];
      for (const name of companies) {
        const info = await db.run(
          "INSERT INTO companies (name) VALUES (?)",
          name
        );
        compIds.push(info.lastID);
      }

      // Contacts (two per company)
      const contactIds = [];
      for (let i = 0; i < compIds.length; i++) {
        const cid = compIds[i];
        const base = companies[i].split(" ")[0];
        const info1 = await db.run(
          "INSERT INTO contacts (first_name,last_name,email,phone,company_id) VALUES (?,?,?,?,?)",
          `${base}Rep`,
          "Alpha",
          `${base.toLowerCase()}.alpha@example.com`,
          "+1000000001",
          cid
        );
        contactIds.push(info1.lastID);
        const info2 = await db.run(
          "INSERT INTO contacts (first_name,last_name,email,phone,company_id) VALUES (?,?,?,?,?)",
          `${base}Rep`,
          "Beta",
          `${base.toLowerCase()}.beta@example.com`,
          "+1000000002",
          cid
        );
        contactIds.push(info2.lastID);
      }

      // Deals: one deal per contact
      const dealIds = [];
      for (let i = 0; i < contactIds.length; i++) {
        const contact_id = contactIds[i];
        const company_id = compIds[Math.floor(i / 2)];
        const title = `Deal for contact ${contact_id}`;
        const value = (i + 1) * 1000;
        const stage = [
          "prospect",
          "qualified",
          "proposal",
          "closed-won",
          "closed-lost",
        ][i % 5];
        const prob = [10, 30, 50, 100, 0][i % 5];
        const info = await db.run(
          "INSERT INTO deals (title, contact_id, company_id, value, stage, probability) VALUES (?,?,?,?,?,?)",
          title,
          contact_id,
          company_id,
          value,
          stage,
          prob
        );
        dealIds.push(info.lastID);
      }

      // Activities: one per deal
      const now = new Date();
      for (let i = 0; i < dealIds.length; i++) {
        const deal_id = dealIds[i];
        const contact_id = contactIds[i];
        const due = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        await db.run(
          "INSERT INTO activities (type, note, contact_id, deal_id, due_date) VALUES (?,?,?,?,?)",
          "call",
          `Follow up ${i + 1}`,
          contact_id,
          deal_id,
          due
        );
      }

      // Notifications: one scheduled for now (so scheduler can pick it up)
      await db.run(
        "INSERT INTO notifications (user_id, title, body, metadata, scheduled_for) VALUES (?,?,?,?,?)",
        "system",
        "Test scheduled notification",
        "This is a test",
        JSON.stringify({ email: null }),
        new Date().toISOString()
      );

      await db.run("COMMIT");
      console.log(
        "Inserted sample companies, contacts, deals, activities, and a notification."
      );
    } catch (e) {
      await db.run("ROLLBACK");
      throw e;
    }
    await db.close();
  } catch (e) {
    console.error("Seeding failed:", e);
    process.exit(1);
  }
})();
