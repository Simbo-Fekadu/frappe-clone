import React, { useEffect, useState } from "react";
import { fetchList, apiFetch, post, put, del } from "../lib/api";
import { showToast, showConfirm } from "../lib/ui";

export default function ActivitiesPanel({ fixedMode, fixedId }) {
  const [mode, setMode] = useState(fixedMode || "contact"); // or 'deal'
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [selectedId, setSelectedId] = useState(fixedId || "");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("call");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchOptions = async () => {
    try {
      const [c, d] = await Promise.all([
        fetchList("/api/contacts"),
        fetchList("/api/deals"),
      ]);
      setContacts(c || []);
      setDeals(d || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!fixedMode) fetchOptions();
  }, [fixedMode]);

  const fetchActivities = async () => {
    if (!selectedId) {
      setActivities([]);
      return;
    }
    setLoading(true);
    try {
      const query =
        mode === "contact"
          ? `?contact_id=${selectedId}`
          : `?deal_id=${selectedId}`;
      const qs = new URLSearchParams(query.replace(/^\?/, ""));
      qs.set("sort_by", sortBy);
      qs.set("order", sortOrder);
      const json = await apiFetch(`/api/activities?${qs.toString()}`);
      setActivities((json && json.data) || json || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedId, mode, sortBy, sortOrder]);

  useEffect(() => {
    const h = () => {
      if (!fixedMode) fetchOptions();
      fetchActivities();
    };
    window.addEventListener("contacts:changed", h);
    window.addEventListener("deals:changed", h);
    return () => {
      window.removeEventListener("contacts:changed", h);
      window.removeEventListener("deals:changed", h);
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!type) return setStatus("error");
    setStatus("sending");
    try {
      const body = { type, note, due_date: dueDate };
      if (mode === "contact") body.contact_id = selectedId || null;
      else body.deal_id = selectedId || null;
      if (editingId) {
        await put(`/api/activities/${editingId}`, body);
        setStatus("updated");
        showToast("Activity updated");
      } else {
        await post("/api/activities", body);
        setStatus("created");
        showToast("Activity added");
      }
      setType("call");
      setNote("");
      setDueDate("");
      setEditingId(null);
      window.dispatchEvent(new Event("contacts:changed"));
      window.dispatchEvent(new Event("deals:changed"));
      fetchActivities();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div>
      {!fixedId && <h2>Activities</h2>}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {!fixedId && (
          <>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                checked={mode === "contact"}
                onChange={() => setMode("contact")}
              />{" "}
              Contact
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                checked={mode === "deal"}
                onChange={() => setMode("deal")}
              />{" "}
              Deal
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— Select {mode} —</option>
              {mode === "contact"
                ? contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.first_name || "") + " " + (c.last_name || "")}
                    </option>
                  ))
                : deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
            </select>
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">Sort by: created</option>
          <option value="due_date">Sort by: due date</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, maxWidth: 600, marginBottom: 12 }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="task">Task</option>
          </select>
          <input
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Due date (YYYY-MM-DD)"
          />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
          rows={3}
        />
        <div>
          <button type="submit">{editingId ? "Save" : "Add activity"}</button>
          {status === "sending" && (
            <span style={{ marginLeft: 8 }}>Saving…</span>
          )}
          {status === "created" && (
            <span style={{ marginLeft: 8, color: "green" }}>Created</span>
          )}
          {status === "error" && (
            <span style={{ marginLeft: 8, color: "red" }}>Error</span>
          )}
        </div>
      </form>

      <div>
        <h3>Activity log</h3>
        {loading ? (
          <div>Loading…</div>
        ) : activities.length === 0 ? (
          <div>No activities</div>
        ) : (
          <ul>
            {activities.map((a) => (
              <li key={a.id} style={{ marginBottom: 8 }}>
                <div>
                  <strong>{a.type}</strong>{" "}
                  {a.due_date ? `• due ${a.due_date}` : ""}
                </div>
                <div style={{ color: "#555" }}>{a.note}</div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  {a.contact_first
                    ? `${a.contact_first} ${a.contact_last || ""}`
                    : a.deal_title || ""}{" "}
                  • {a.created_at}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const ok = await showConfirm("Delete activity?");
                      if (!ok) return;
                      await del(`/api/activities/${a.id}`);
                      showToast("Activity deleted");
                      fetchActivities();
                    } catch (err) {
                      console.error(err);
                      showToast("Failed to delete activity", "error");
                    }
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    // start editing this activity
                    setEditingId(a.id);
                    setType(a.type || "call");
                    setNote(a.note || "");
                    setDueDate(a.due_date || "");
                    // select appropriate mode and id
                    if (a.contact_id) {
                      setMode("contact");
                      setSelectedId(String(a.contact_id));
                    } else if (a.deal_id) {
                      setMode("deal");
                      setSelectedId(String(a.deal_id));
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
