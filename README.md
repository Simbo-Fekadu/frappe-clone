# Frappe CRM Clone (Vite React + Node/Express + SQLite)

This repository is a minimal CRM clone inspired by Frappe concepts. It contains:

- `backend/` - Node.js + Express API using `better-sqlite3` (SQLite DB)
- `frontend/` - Vite + React single-page app

Quick start (Windows PowerShell):

1. Backend

```powershell
cd backend
npm install
# initialize sqlite DB and seed sample data
npm run init-db
# start server (dev)
npm run dev
```

Backend runs on http://localhost:4000 by default.

2. Frontend

Open a new PowerShell session and run:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 by default and expects the backend at http://localhost:4000.

Notes and next steps

- Add authentication, roles, and permissions.
- Add more doctypes (Companies, Deals, Activities) and relations.
- Add database migrations and automated tests.
