const { dbPromise } = require("./db");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const fs = require("fs");

// Simple scheduler: every minute check for notifications scheduled_for <= now and not seen

async function sendEmail(to, subject, text) {
  // Use SMTP if configured via env; otherwise just log
  const smtpUrl = process.env.SMTP_URL;
  if (!smtpUrl) {
    console.log("[scheduler] SMTP not configured. Skipping email send.");
    return;
  }
  try {
    const transporter = nodemailer.createTransport(smtpUrl);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@example.com",
      to,
      subject,
      text,
    });
    console.log("[scheduler] Email sent to", to);
  } catch (e) {
    console.error("[scheduler] Failed to send email", e);
  }
}

async function checkNotifications() {
  try {
    const db = await dbPromise;
    const now = new Date().toISOString();
    const rows = await db.all(
      "SELECT * FROM notifications WHERE scheduled_for IS NOT NULL AND scheduled_for <= ? AND seen = 0",
      now
    );
    for (const r of rows) {
      console.log("[scheduler] Triggering notification", r.id, r.title);
      // Try to send email if metadata contains an "email" field
      let meta = null;
      try {
        meta = r.metadata ? JSON.parse(r.metadata) : null;
      } catch (e) {}
      if (meta && meta.email) {
        await sendEmail(meta.email, r.title, r.body || "");
      }
      // mark seen to avoid re-sending
      await db.run("UPDATE notifications SET seen = 1 WHERE id = ?", r.id);
    }
  } catch (e) {
    console.error("[scheduler] error", e);
  }
}

function start() {
  console.log("[scheduler] starting cron (runs every minute)");
  cron.schedule("* * * * *", () => {
    checkNotifications();
  });
}

module.exports = { start };
