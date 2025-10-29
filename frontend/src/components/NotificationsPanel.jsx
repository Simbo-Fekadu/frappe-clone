import React, { useEffect, useState } from "react";
import { BASE, get, apiFetch } from "../lib/api";

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    let es;
    async function load() {
      try {
        const j = await get("/api/notifications");
        setNotifications(j.data || []);
      } catch (e) {}
    }
    load();
    try {
      es = new EventSource(`${BASE}/api/notifications/stream`);
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.type === "notification")
            setNotifications((s) => [d.data, ...s]);
        } catch (e) {}
      };
    } catch (e) {}
    return () => {
      if (es) es.close();
    };
  }, []);

  const markRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/mark_read`, { method: "PUT" });
      setNotifications((ns) =>
        ns.map((n) => (n.id === id ? { ...n, seen: 1 } : n))
      );
    } catch (e) {}
  };

  return (
    <div style={{ position: "relative" }}>
      <h4>Notifications</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {notifications.map((n) => (
          <li
            key={n.id}
            style={{
              padding: 8,
              background: n.seen ? "#fff" : "#eef",
              marginBottom: 6,
            }}
          >
            <div style={{ fontWeight: 600 }}>{n.title}</div>
            <div style={{ fontSize: 12 }}>{n.body}</div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => markRead(n.id)}>Mark read</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
