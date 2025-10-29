// Simple SSE notifications broadcaster
const clients = new Set();

function sendEvent(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (e) {
    // ignore
  }
}

function addClient(res, user_id) {
  // set headers
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  // send initial ping
  res.write(": connected\n\n");
  const client = { res, user_id };
  clients.add(client);
  return client;
}

function removeClient(client) {
  try {
    clients.delete(client);
  } catch (e) {}
}

function pushNotification(row) {
  for (const c of clients) {
    // if user_id is present on client, optionally filter
    if (c.user_id && row.user_id && String(c.user_id) !== String(row.user_id))
      continue;
    sendEvent(c.res, { type: "notification", data: row });
  }
}

module.exports = { addClient, removeClient, pushNotification };
