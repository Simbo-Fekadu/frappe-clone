import React, { useEffect, useState } from "react";
import { apiFetch, fetchList, del } from "../lib/api";
import { showToast, showConfirm } from "../lib/ui";

export default function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [companies, setCompanies] = useState([]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      if (companyFilter) qs.set("company_id", companyFilter);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const json = await apiFetch(`/api/contacts?${qs.toString()}`);
      const data = (json && json.data) || json || [];
      setContacts(data);
      setTotal((json && json.total) || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // load companies for filter
    fetchList("/api/companies")
      .then(setCompanies)
      .catch(() => {});
  }, []);

  // Refresh when other parts of the app signal a change
  useEffect(() => {
    const handler = () => fetchContacts();
    window.addEventListener("contacts:changed", handler);
    return () => window.removeEventListener("contacts:changed", handler);
  }, []);

  // refetch when filters/page change
  useEffect(() => {
    fetchContacts();
  }, [query, companyFilter, page]);

  if (loading) return <div>Loading contacts…</div>;

  return (
    <div>
      <h2>Contacts</h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">— All companies —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {contacts.length === 0 ? (
        <div>No contacts yet</div>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Name
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Email
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Phone
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Company
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: "8px 0" }}>
                  {(c.first_name || "") + " " + (c.last_name || "")}
                </td>
                <td style={{ padding: "8px 0" }}>{c.email}</td>
                <td style={{ padding: "8px 0" }}>{c.phone}</td>
                <td style={{ padding: "8px 0" }}>{c.company_name || "—"}</td>
                <td style={{ padding: "8px 0" }}>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("contacts:edit", { detail: c })
                      )
                    }
                    style={{ marginRight: 8 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const ok = await showConfirm("Delete this contact?");
                        if (!ok) return;
                        await del(`/api/contacts/${c.id}`);
                        window.dispatchEvent(new Event("contacts:changed"));
                      } catch (err) {
                        console.error(err);
                        showToast("Failed to delete contact", "error");
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
