import React, { useEffect, useState } from "react";
import { get } from "../lib/api";

export default function PipelineDashboard() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);
      const json = await get(`/api/reports/pipeline_totals?${qs.toString()}`);
      setRows(json?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = rows.reduce(
    (acc, r) => {
      acc.value += r.total_value || 0;
      acc.weighted += r.total_weighted || 0;
      acc.count += r.count || 0;
      return acc;
    },
    { value: 0, weighted: 0, count: 0 }
  );

  return (
    <div>
      <h2>Pipeline Dashboard</h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <button onClick={load}>Apply</button>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: 12 }}>Total value</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {totals.value.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                Weighted value
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {totals.weighted.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: 12 }}>Deals</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {totals.count}
              </div>
            </div>
          </div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Stage
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Deals
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Total value
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  Weighted
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.stage}>
                  <td style={{ padding: "8px 0" }}>{r.stage}</td>
                  <td style={{ padding: "8px 0" }}>{r.count}</td>
                  <td style={{ padding: "8px 0" }}>
                    {(r.total_value || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    {(r.total_weighted || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
