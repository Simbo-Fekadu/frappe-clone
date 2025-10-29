import React, { useEffect, useState } from "react";
import { fetchList, post, get } from "../lib/api";
import { showToast } from "../lib/ui";

export default function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const json = await get(`/api/companies?${qs.toString()}`);
      const data = (json && json.data) || json || [];
      setCompanies(Array.isArray(data) ? data : []);
      setTotal((json && json.total) || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await post("/api/companies", { name: name.trim() });
      setStatus("created");
      showToast("Company created");
      setName("");
      // refresh list and notify others (contact form)
      await fetchCompanies();
      window.dispatchEvent(new Event("companies:changed"));
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (loading) return <div>Loading companies…</div>;

  return (
    <div>
      <h2>Companies</h2>
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company name"
        />
        <button type="submit">Create</button>
        {status === "sending" && <span style={{ marginLeft: 8 }}>Saving…</span>}
        {status === "created" && (
          <span style={{ marginLeft: 8, color: "green" }}>Created</span>
        )}
        {status === "error" && (
          <span style={{ marginLeft: 8, color: "red" }}>Error</span>
        )}
      </form>

      {companies.length === 0 ? (
        <div>No companies yet</div>
      ) : (
        <ul>
          {companies.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 12 }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span style={{ margin: "0 8px" }}>
          Page {page} — {total} results
        </span>
        <button
          disabled={page * limit >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
