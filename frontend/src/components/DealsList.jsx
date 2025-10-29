import React, { useEffect, useRef, useState } from "react";
import { fetchList, post, put, del, get } from "../lib/api";
import { showToast, showConfirm } from "../lib/ui";
import DealDrawer from "./DealDrawer";

const STAGES = [
  "prospect",
  "qualified",
  "proposal",
  "closed-won",
  "closed-lost",
];

export default function DealsList() {
  const [deals, setDeals] = useState([]);
  const [total, setTotal] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [stageFilter, setStageFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [modalDeal, setModalDeal] = useState(null);
  const [drawerDeal, setDrawerDeal] = useState(null);

  // Create/edit form state
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [value, setValue] = useState("");
  const [probability, setProbability] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [stage, setStage] = useState(STAGES[0]);
  const [status, setStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const titleRef = useRef(null);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const contactsPromise = fetchList("/api/contacts");
      const companiesPromise = fetchList("/api/companies");

      if (viewMode === "kanban") {
        const qs = new URLSearchParams();
        qs.set("limit", "1000");
        qs.set("sort_by", "position");
        qs.set("order", "asc");
        if (stageFilter) qs.set("stage", stageFilter);
        if (contactFilter) qs.set("contact_id", contactFilter);
        if (companyFilter) qs.set("company_id", companyFilter);
        const list = await fetchList(`/api/deals?${qs.toString()}`);
        const [c, co] = await Promise.all([contactsPromise, companiesPromise]);
        setDeals(list || []);
        setContacts(c || []);
        setCompanies(co || []);
        setTotal((list && list.length) || 0);
      } else {
        const qs = new URLSearchParams();
        if (stageFilter) qs.set("stage", stageFilter);
        if (contactFilter) qs.set("contact_id", contactFilter);
        if (companyFilter) qs.set("company_id", companyFilter);
        qs.set("sort_by", sortBy);
        qs.set("order", sortOrder);
        qs.set("page", String(page));
        qs.set("limit", String(limit));
        const json = await get(`/api/deals?${qs.toString()}`);
        const data = json.data || json;
        const [c, co] = await Promise.all([contactsPromise, companiesPromise]);
        setDeals(Array.isArray(data) ? data : []);
        setTotal(json.total || 0);
        setContacts(c || []);
        setCompanies(co || []);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load deals/options", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Open drawer when global search selects a deal
  useEffect(() => {
    const handler = async (e) => {
      const id = e?.detail?.id;
      if (!id) return;
      try {
        const full = await get(`/api/deals/${id}`);
        setDrawerDeal(full);
      } catch (err) {
        console.error(err);
      }
    };
    window.addEventListener("deal:open", handler);
    return () => window.removeEventListener("deal:open", handler);
  }, []);

  useEffect(() => {
    const h = () => fetchDeals();
    window.addEventListener("contacts:changed", h);
    window.addEventListener("companies:changed", h);
    window.addEventListener("deals:changed", h);
    return () => {
      window.removeEventListener("contacts:changed", h);
      window.removeEventListener("companies:changed", h);
      window.removeEventListener("deals:changed", h);
    };
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [
    viewMode,
    stageFilter,
    contactFilter,
    companyFilter,
    sortBy,
    sortOrder,
    page,
  ]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setStatus("error");
    setStatus("sending");
    try {
      if (editingId) {
        await put(`/api/deals/${editingId}`, {
          title: title.trim(),
          contact_id: contactId || null,
          company_id: companyId || null,
          value: parseFloat(value) || 0,
          stage,
        });
      } else {
        await post("/api/deals", {
          title: title.trim(),
          contact_id: contactId || null,
          company_id: companyId || null,
          value: parseFloat(value) || 0,
          stage,
        });
      }
      showToast(editingId ? "Deal updated" : "Deal created");
      setStatus(editingId ? "updated" : "created");
      setTitle("");
      setContactId("");
      setCompanyId("");
      setValue("");
      setStage(STAGES[0]);
      setEditingId(null);
      window.dispatchEvent(new Event("deals:changed"));
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  if (loading) return <div>Loading deals…</div>;

  return (
    <div>
      <h2>Deals</h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="radio"
            checked={viewMode === "list"}
            onChange={() => setViewMode("list")}
          />{" "}
          List
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="radio"
            checked={viewMode === "kanban"}
            onChange={() => setViewMode("kanban")}
          />{" "}
          Kanban
        </label>
        <select
          value={stageFilter}
          onChange={(e) => {
            setStageFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">— All stages —</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">Sort: newest</option>
          <option value="value">Sort: value</option>
          <option value="probability">Sort: probability</option>
          <option value="expected_close">Sort: expected close</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <select
          value={contactFilter}
          onChange={(e) => {
            setContactFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">— All contacts —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {(c.first_name || "") + " " + (c.last_name || "")}
            </option>
          ))}
        </select>
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

      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, maxWidth: 600, marginBottom: 12 }}
      >
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deal title"
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          >
            <option value="">— Select contact (optional) —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.first_name || "") + " " + (c.last_name || "")}
              </option>
            ))}
          </select>
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
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
          />
          <input
            type="number"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            placeholder="Probability %"
            min={0}
            max={100}
          />
          <input
            type="date"
            value={expectedClose}
            onChange={(e) => setExpectedClose(e.target.value)}
            placeholder="Expected close"
          />
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button type="submit" disabled={status === "sending"}>
            {editingId ? "Save changes" : "Create deal"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setContactId("");
                setCompanyId("");
                setValue("");
                setStage(STAGES[0]);
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

      {viewMode === "kanban" ? (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {STAGES.map((col) => (
            <div
              key={col}
              style={{ flex: 1, minWidth: 180 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                const id = e.dataTransfer.getData("text/deal-id");
                if (!id) return;
                const draggedId = String(id);
                const colIds = deals
                  .filter((d) => d.stage === col)
                  .map((d) => String(d.id))
                  .filter((x) => x !== draggedId);
                const insertIdx =
                  overId && colIds.includes(String(overId))
                    ? colIds.indexOf(String(overId))
                    : colIds.length;
                colIds.splice(insertIdx, 0, draggedId);
                try {
                  await post(`/api/deals/reorder`, {
                    stage: col,
                    ids: colIds.map((x) => Number(x)),
                  });
                  setDraggingId(null);
                  setOverId(null);
                  showToast("Deal moved");
                  fetchDeals();
                } catch (err) {
                  console.error(err);
                  showToast("Failed to move deal", "error");
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <h4 style={{ textTransform: "capitalize", margin: 0 }}>
                  {col}{" "}
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>
                    ({deals.filter((d) => d.stage === col).length})
                  </span>
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 400,
                    }}
                  >
                    {(() => {
                      const items = deals.filter((d) => d.stage === col);
                      const total = items.reduce(
                        (s, x) => s + (x.value || 0),
                        0
                      );
                      const weighted = items.reduce(
                        (s, x) =>
                          s + (x.value || 0) * ((x.probability || 0) / 100),
                        0
                      );
                      return `Total: ${total} • Weighted: ${weighted.toFixed(
                        2
                      )}`;
                    })()}
                  </span>
                </h4>
                <button
                  style={{ fontSize: 12, padding: "4px 8px" }}
                  onClick={() => {
                    setStage(col);
                    setEditingId(null);
                    setTitle("");
                    setContactId("");
                    setCompanyId("");
                    setValue("");
                    setProbability("");
                    setExpectedClose("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setTimeout(
                      () => titleRef.current && titleRef.current.focus(),
                      150
                    );
                  }}
                >
                  + Add
                </button>
              </div>
              <div
                style={{
                  background: "#f8f8f8",
                  padding: 8,
                  minHeight: 200,
                  borderRadius: 6,
                }}
              >
                {deals
                  .filter((d) => d.stage === col)
                  .map((d) => (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/deal-id", String(d.id));
                        setDraggingId(d.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setOverId(d.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverId(null);
                      }}
                      onClick={() => setDrawerDeal(d)}
                      style={{
                        padding: 8,
                        marginBottom: 8,
                        background: "white",
                        borderRadius: 6,
                        boxShadow:
                          draggingId === d.id
                            ? "0 0 0 2px #b3d4fc"
                            : "0 1px 3px rgba(0,0,0,0.06)",
                        opacity: draggingId === d.id ? 0.6 : 1,
                        borderTop:
                          overId === d.id
                            ? "3px solid #5b9dff"
                            : "3px solid transparent",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {d.company_name || "—"} • {d.value || 0} •{" "}
                        {d.probability ?? 0}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div>No deals yet</div>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Title
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Contact
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Company
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Value
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Probability
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Expected Close
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Stage
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id}>
                <td
                  style={{ padding: "8px 0", cursor: "pointer" }}
                  onClick={() => setDrawerDeal(d)}
                >
                  {d.title}
                </td>
                <td style={{ padding: "8px 0" }}>
                  {d.contact_first
                    ? `${d.contact_first} ${d.contact_last || ""}`
                    : "—"}
                </td>
                <td style={{ padding: "8px 0" }}>{d.company_name || "—"}</td>
                <td style={{ padding: "8px 0" }}>{d.value}</td>
                <td style={{ padding: "8px 0" }}>{d.probability ?? 0}%</td>
                <td style={{ padding: "8px 0" }}>{d.expected_close || "—"}</td>
                <td style={{ padding: "8px 0" }}>{d.stage}</td>
                <td style={{ padding: "8px 0" }}>
                  <button
                    onClick={() => {
                      setEditingId(d.id);
                      setTitle(d.title || "");
                      setContactId(d.contact_id || "");
                      setCompanyId(d.company_id || "");
                      setValue(d.value || "");
                      setProbability(
                        typeof d.probability === "number"
                          ? String(d.probability)
                          : d.probability || ""
                      );
                      setExpectedClose(d.expected_close || "");
                      setStage(d.stage || STAGES[0]);
                      setStatus(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const ok = await showConfirm("Delete this deal?");
                        if (!ok) return;
                        await del(`/api/deals/${d.id}`);
                        showToast("Deal deleted");
                        window.dispatchEvent(new Event("deals:changed"));
                      } catch (err) {
                        console.error(err);
                        showToast("Failed to delete deal", "error");
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

      {viewMode === "list" && (
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
      )}

      {drawerDeal && (
        <DealDrawer
          deal={drawerDeal}
          onClose={() => setDrawerDeal(null)}
          onEdit={() => {
            setModalDeal(drawerDeal);
            setDrawerDeal(null);
          }}
        />
      )}

      {modalDeal && (
        <div
          onClick={() => setModalDeal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 16,
              borderRadius: 8,
              minWidth: 360,
              boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
            }}
          >
            <h3>Edit deal</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <input
                value={modalDeal.title || ""}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, title: e.target.value })
                }
              />
              <input
                value={modalDeal.value || 0}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, value: e.target.value })
                }
              />
              <input
                type="number"
                value={modalDeal.probability ?? 0}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, probability: e.target.value })
                }
                placeholder="Probability %"
                min={0}
                max={100}
              />
              <input
                type="date"
                value={modalDeal.expected_close || ""}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, expected_close: e.target.value })
                }
                placeholder="Expected close"
              />
              <select
                value={modalDeal.contact_id || ""}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, contact_id: e.target.value })
                }
              >
                <option value="">— Select contact —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.first_name || "") + " " + (c.last_name || "")}
                  </option>
                ))}
              </select>
              <select
                value={modalDeal.company_id || ""}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, company_id: e.target.value })
                }
              >
                <option value="">— Select company —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={modalDeal.stage || STAGES[0]}
                onChange={(e) =>
                  setModalDeal({ ...modalDeal, stage: e.target.value })
                }
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button onClick={() => setModalDeal(null)}>Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await put(`/api/deals/${modalDeal.id}`, {
                      title: modalDeal.title || "",
                      value: parseFloat(modalDeal.value) || 0,
                      contact_id: modalDeal.contact_id || null,
                      company_id: modalDeal.company_id || null,
                      probability: Math.max(
                        0,
                        Math.min(100, parseFloat(modalDeal.probability) || 0)
                      ),
                      expected_close: modalDeal.expected_close || null,
                      stage: modalDeal.stage || STAGES[0],
                    });
                    showToast("Deal updated");
                    setModalDeal(null);
                    fetchDeals();
                  } catch (err) {
                    console.error(err);
                    showToast("Failed to update deal", "error");
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
