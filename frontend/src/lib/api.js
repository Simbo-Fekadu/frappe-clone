// In Vite, use import.meta.env for environment variables. Fallback to localhost.
const BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  "http://localhost:4000";

async function apiFetch(path, opts = {}) {
  const url = path.startsWith("http")
    ? path
    : `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    if (text) json = JSON.parse(text);
  } catch (err) {
    // invalid json
  }
  if (!res.ok) {
    const err = new Error(
      (json && json.error) || res.statusText || "Request failed"
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json === null ? text : json;
}

async function fetchList(path, opts = {}) {
  const j = await apiFetch(path, opts);
  if (Array.isArray(j)) return j;
  if (j && Array.isArray(j.data)) return j.data;
  return [];
}

async function get(path, opts = {}) {
  return apiFetch(path, { method: "GET", ...opts });
}

async function post(path, body) {
  return apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function put(path, body) {
  return apiFetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function del(path) {
  return apiFetch(path, { method: "DELETE" });
}

export { BASE, apiFetch, fetchList, get, post, put, del };
