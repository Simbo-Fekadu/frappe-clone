import React, { useEffect, useState } from "react";
import { get, post, put, del } from "../lib/api";
import { showToast, showConfirm } from "../lib/ui";

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      if (source) qs.set("source", source);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const json = await get(`/api/leads?${qs.toString()}`);
      const data = (json && json.data) || json || [];
      setLeads(Array.isArray(data) ? data : []);
      setTotal(json?.total || (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);
  useEffect(() => {
    fetchLeads();
  }, [q, status, source, page]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name && !email) return;
    setSaving(true);
    try {
      if (editingId) {
        await put(`/api/leads/${editingId}`, {
          name,
          email,
          phone,
          company,
          source: leadSource,
          status: "open",
        });
        showToast("Lead updated");
      } else {
        await post("/api/leads", {
          name,
          email,
          phone,
          company,
          source: leadSource,
        });
        showToast("Lead created");
      }
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setLeadSource("");
      setEditingId(null);
      fetchLeads();
    } catch (e) {
      console.error(e);
      showToast("Failed to save lead", "error");
    } finally {
      setSaving(false);
    }
  };

  const convert = async (lead) => {
    try {
      const ok = await showConfirm(
        `Convert lead \"${lead.name || lead.email}\"?`
      );
      if (!ok) return;
      await post(`/api/leads/${lead.id}/convert`, { create_deal: true });
      showToast("Lead converted");
      fetchLeads();
      window.dispatchEvent(new Event("contacts:changed"));
      window.dispatchEvent(new Event("companies:changed"));
      window.dispatchEvent(new Event("deals:changed"));
    } catch (e) {
      console.error(e);
      showToast("Conversion failed", "error");
    }
  };

  if (loading) return <div>Loading leads…</div>;

  return (
    <div>
      <h2>Leads</h2>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, maxWidth: 720, marginBottom: 12 }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
          />
          <input
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value)}
            placeholder="Source"
          />
        </div>
        <div>
          <button type="submit" disabled={saving}>
            {editingId ? "Save" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              style={{ marginLeft: 8 }}
              onClick={() => {
                setEditingId(null);
                setName("");
                setEmail("");
                setPhone("");
                setCompany("");
                setLeadSource("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <input
          placeholder="Search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">— Status —</option>
          <option value="open">Open</option>
          <option value="converted">Converted</option>
        </select>
        <input
          placeholder="Source"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {leads.length === 0 ? (
        <div>No leads</div>
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
                Source
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Status
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td style={{ padding: "8px 0" }}>{l.name || "—"}</td>
                <td style={{ padding: "8px 0" }}>{l.email || "—"}</td>
                <td style={{ padding: "8px 0" }}>{l.phone || "—"}</td>
                <td style={{ padding: "8px 0" }}>{l.company || "—"}</td>
                <td style={{ padding: "8px 0" }}>{l.source || "—"}</td>
                <td style={{ padding: "8px 0" }}>{l.status || "open"}</td>
                <td style={{ padding: "8px 0" }}>
                  <button
                    onClick={() => {
                      setEditingId(l.id);
                      setName(l.name || "");
                      setEmail(l.email || "");
                      setPhone(l.phone || "");
                      setCompany(l.company || "");
                      setLeadSource(l.source || "");
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Edit
                  </button>
                  <button onClick={() => convert(l)} disabled={l.converted}>
                    Convert
                  </button>
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                      const ok = await showConfirm("Delete lead?");
                      if (!ok) return;
                      await del(`/api/leads/${l.id}`);
                      fetchLeads();
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
