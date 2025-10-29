import React, { useEffect, useState } from "react";
import { fetchList, post, put } from "../lib/api";
import { showToast } from "../lib/ui";

export default function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchList("/api/companies")
      .then(setCompanies)
      .catch((e) => console.error(e));
  }, []);

  // Re-fetch companies when they change elsewhere
  useEffect(() => {
    const handler = () => {
      fetchList("/api/companies")
        .then(setCompanies)
        .catch((e) => console.error(e));
    };
    window.addEventListener("companies:changed", handler);
    return () => window.removeEventListener("companies:changed", handler);
  }, []);

  // Support edit mode: listen for contacts:edit events
  const [editingId, setEditingId] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      const c = e.detail;
      setEditingId(c.id);
      setFirstName(c.first_name || "");
      setLastName(c.last_name || "");
      setEmail(c.email || "");
      setPhone(c.phone || "");
      setCompanyId(c.company_id || "");
      setStatus(null);
    };
    window.addEventListener("contacts:edit", handler);
    return () => window.removeEventListener("contacts:edit", handler);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      if (editingId) {
        await put(`/api/contacts/${editingId}`, {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          company_id: companyId || null,
        });
      } else {
        await post("/api/contacts", {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          company_id: companyId || null,
        });
      }
      setStatus(editingId ? "updated" : "created");
      showToast(editingId ? "Contact updated" : "Contact created");
      // clear
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCompanyId("");
      setEditingId(null);
      // notify others
      window.dispatchEvent(new Event("contacts:changed"));
    } catch (err) {
      console.error(err);
      showToast("Failed to save contact", "error");
      setStatus("error");
    }
  };

  return (
    <div>
      <h2>Create contact</h2>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, maxWidth: 480 }}
      >
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
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

        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">— Select company (optional) —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div>
          <button type="submit" disabled={status === "sending"}>
            {editingId ? "Save changes" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFirstName("");
                setLastName("");
                setEmail("");
                setPhone("");
                setCompanyId("");
                setStatus(null);
              }}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
          {status === "sending" && (
            <span style={{ marginLeft: 8 }}>Saving…</span>
          )}
          {status === "created" && (
            <span style={{ marginLeft: 8, color: "green" }}>Created</span>
          )}
          {status === "updated" && (
            <span style={{ marginLeft: 8, color: "green" }}>Updated</span>
          )}
          {status === "error" && (
            <span style={{ marginLeft: 8, color: "red" }}>Error</span>
          )}
        </div>
      </form>
    </div>
  );
}
