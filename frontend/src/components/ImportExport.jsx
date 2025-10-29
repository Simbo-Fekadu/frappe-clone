import React, { useState } from "react";
import { fetchList, BASE } from "../lib/api";
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
      const res = await fetch(`${BASE}/api/import/${type}`, {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import failed");
      showToast(`Imported ${j.inserted} ${type}`);
      setFile(null);
    } catch (e) {
      console.error(e);
      showToast("Import failed", "error");
    } finally {
      setLoading(false);
    }
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
        <button onClick={() => exportCsv(type)}>Export CSV</button>
      </div>
      <div style={{ color: "#6b7280" }}>
        Notes: CSV must have header row matching fields (for contacts:
        first_name,last_name,email,phone). Imported records are created as new
        rows.
      </div>
    </div>
  );
}
