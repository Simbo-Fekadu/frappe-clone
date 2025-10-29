import React, { useState } from "react";
import { fetchList, BASE, apiFetch } from "../lib/api";
import { showToast } from "../lib/ui";

export default function ImportExport() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("contacts");
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // default: perform a dry-run preview first
      fd.append("dry_run", "1");
      const preview = await fetch(`${BASE}/api/import/${type}`, {
        method: "POST",
        body: fd,
      }).then((r) => r.json());
      // preview contains inserted count and data
      if (!preview || typeof preview.inserted === "undefined")
        throw new Error("Preview failed");
      // Ask user to confirm (simple confirm for now)
      const ok = window.confirm(
        `This import will create ${preview.inserted} ${type}. Proceed?`
      );
      if (!ok) {
        setLoading(false);
        return;
      }
      // actually perform import (without dry_run)
      const fd2 = new FormData();
      fd2.append("file", file);
      const res2 = await fetch(`${BASE}/api/import/${type}`, {
        method: "POST",
        body: fd2,
      });
      const j = await res2.json();
      if (!res2.ok) throw new Error(j.error || "Import failed");
      showToast(`Imported ${j.inserted} ${type}`);
      setFile(null);
    } catch (e) {
      console.error(e);
      showToast("Import failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const previewFile = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BASE}/api/import/${type}/preview`, {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    return j;
  };

  const exportCsv = (t) => {
    // use backend base URL so browser requests go directly to backend
    window.location.href = `${BASE}/api/export/${t}`;
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>Import / Export</h2>
      <div style={{ marginBottom: 12 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="contacts">Contacts</option>
          <option value="deals">Deals</option>
        </select>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          type="file"
          onChange={(e) => setFile(e.target.files && e.target.files[0])}
        />
        <button onClick={upload} disabled={!file || loading}>
          {loading ? "Importing…" : "Import CSV"}
        </button>
        <button
          onClick={async () => {
            const p = await previewFile();
            if (!p) return showToast("Preview failed", "error");
            // show a simple preview in alert for now
            const cols = p.columns.join(", ");
            const rows = (p.rows || [])
              .slice(0, 5)
              .map((r) => Object.values(r).join(" | "))
              .join("\n");
            alert(`Columns:\n${cols}\n\nSample rows:\n${rows}`);
          }}
        >
          Preview
        </button>
        <button onClick={() => exportCsv(type)}>Export CSV</button>
        <button
          onClick={() =>
            (window.location.href = `${BASE}/api/export/${type}.xlsx`)
          }
        >
          Export XLSX
        </button>
      </div>
      <div style={{ color: "#6b7280" }}>
        Notes: CSV must have header row matching fields (for contacts:
        first_name,last_name,email,phone). Imported records are created as new
        rows.
      </div>
    </div>
  );
}
