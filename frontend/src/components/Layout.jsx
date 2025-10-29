import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { get } from "../lib/api";

export default function Layout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef();
  const [counts, setCounts] = useState({
    deals: 0,
    contacts: 0,
    companies: 0,
    leads: 0,
  });

  // Fetch counts quickly using total from paginated endpoints
  const fetchCounts = async () => {
    try {
      const [d, c, co, l] = await Promise.all([
        get("/api/deals?page=1&limit=1"),
        get("/api/contacts?page=1&limit=1"),
        get("/api/companies?page=1&limit=1"),
        get("/api/leads?page=1&limit=1"),
      ]);
      setCounts({
        deals: d?.total || 0,
        contacts: c?.total || 0,
        companies: co?.total || 0,
        leads: l?.total || 0,
      });
    } catch {}
  };

  useEffect(() => {
    fetchCounts();
    const h = () => fetchCounts();
    window.addEventListener("deals:changed", h);
    window.addEventListener("contacts:changed", h);
    window.addEventListener("companies:changed", h);
    window.addEventListener("leads:changed", h);
    return () => {
      window.removeEventListener("deals:changed", h);
      window.removeEventListener("contacts:changed", h);
      window.removeEventListener("companies:changed", h);
      window.removeEventListener("leads:changed", h);
    };
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const json = await get(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = (json && json.data) || [];
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 200);
  }, [q]);

  const onPick = (row) => {
    setOpen(false);
    setQ("");
    if (row.type === "deal") {
      navigate("/deals");
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("deal:open", { detail: { id: row.id } })
        );
      }, 50);
    } else if (row.type === "contact") {
      navigate("/contacts");
    } else if (row.type === "company") {
      navigate("/companies");
    }
  };

  return (
    <div
      className="app-shell"
      style={{ gridTemplateColumns: collapsed ? "60px 1fr" : undefined }}
    >
      <aside className="sidebar" style={{ width: collapsed ? 60 : 240 }}>
        <div
          className="brand"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{collapsed ? "FC" : "Frappe CRM"}</span>
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand" : "Collapse"}
            style={{ fontSize: 12 }}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <nav className="nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            <span role="img" aria-label="dashboard">
              📊
            </span>{" "}
            {!collapsed && <span style={{ marginLeft: 6 }}>Dashboard</span>}
          </NavLink>
          <NavLink
            to="/leads"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            <span role="img" aria-label="leads">
              📝
            </span>{" "}
            {!collapsed && (
              <>
                <span style={{ marginLeft: 6 }}>Leads</span>
                <span
                  style={{
                    marginLeft: "auto",
                    float: "right",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  ({counts.leads})
                </span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/deals"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            <span role="img" aria-label="deals">
              💼
            </span>{" "}
            {!collapsed && (
              <>
                <span style={{ marginLeft: 6 }}>Deals</span>
                <span
                  style={{
                    marginLeft: "auto",
                    float: "right",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  ({counts.deals})
                </span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            <span role="img" aria-label="contacts">
              👥
            </span>{" "}
            {!collapsed && (
              <>
                <span style={{ marginLeft: 6 }}>Contacts</span>
                <span
                  style={{
                    marginLeft: "auto",
                    float: "right",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  ({counts.contacts})
                </span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/companies"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            <span role="img" aria-label="companies">
              🏢
            </span>{" "}
            {!collapsed && (
              <>
                <span style={{ marginLeft: 6 }}>Companies</span>
                <span
                  style={{
                    marginLeft: "auto",
                    float: "right",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  ({counts.companies})
                </span>
              </>
            )}
          </NavLink>
        </nav>
      </aside>
      <main className="content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            position: "relative",
          }}
        >
          <input
            placeholder="Quick search (deals, contacts, companies)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", maxWidth: 480 }}
          />
          {open && results.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 36,
                left: 0,
                width: 480,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                zIndex: 50,
              }}
            >
              {results.map((r) => (
                <div
                  key={`${r.type}:${r.id}`}
                  onClick={() => onPick(r)}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {r.type}
                    {r.subtitle ? ` • ${r.subtitle}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
