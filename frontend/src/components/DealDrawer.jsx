import React, { useEffect, useState } from "react";
import { get } from "../lib/api";
import { showToast } from "../lib/ui";
import ActivitiesPanel from "./ActivitiesPanel";

export default function DealDrawer({ deal: initialDeal, onClose, onEdit }) {
  const [deal, setDeal] = useState(initialDeal || null);
  const id = initialDeal && initialDeal.id;

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const full = await get(`/api/deals/${id}`);
        if (!ignore) setDeal(full);
      } catch (e) {
        console.error(e);
        showToast("Failed to load deal", "error");
      }
    }
    if (id && (!initialDeal || !initialDeal.company_name)) load();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (!deal) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        zIndex: 10000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: 420,
          background: "#fff",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{deal.title}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {deal.company_name || "—"} • {deal.stage} • {deal.value || 0} •{" "}
              {deal.probability ?? 0}% • Expected: {deal.expected_close || "—"}
            </div>
          </div>
          <div>
            <button onClick={onEdit} style={{ marginRight: 8 }}>
              Edit
            </button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ padding: 12, overflow: "auto" }}>
          <ActivitiesPanel fixedMode="deal" fixedId={String(deal.id)} />
        </div>
      </div>
    </div>
  );
}
