function ensureToastsContainer() {
  let c = document.getElementById("__toasts");
  if (!c) {
    c = document.createElement("div");
    c.id = "__toasts";
    c.style.position = "fixed";
    c.style.right = "12px";
    c.style.top = "12px";
    c.style.zIndex = 9999;
    document.body.appendChild(c);
  }
  return c;
}

export function showToast(message, type = "info", ttl = 3000) {
  const c = ensureToastsContainer();
  const el = document.createElement("div");
  el.textContent = message;
  el.style.background = type === "error" ? "#ffdddd" : "#eef6ff";
  el.style.color = "#111";
  el.style.padding = "8px 12px";
  el.style.marginTop = "8px";
  el.style.border = "1px solid #ccc";
  el.style.borderRadius = "6px";
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
  c.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => c.removeChild(el), 300);
  }, ttl);
  return () => {
    if (el.parentNode) el.parentNode.removeChild(el);
  };
}

export function showConfirm(message) {
  return new Promise((resolve) => {
    // build a very small modal
    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.left = 0;
    backdrop.style.top = 0;
    backdrop.style.right = 0;
    backdrop.style.bottom = 0;
    backdrop.style.background = "rgba(0,0,0,0.3)";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.zIndex = 10000;

    const box = document.createElement("div");
    box.style.background = "white";
    box.style.padding = "16px";
    box.style.borderRadius = "8px";
    box.style.minWidth = "280px";
    box.style.boxShadow = "0 6px 24px rgba(0,0,0,0.2)";

    const msg = document.createElement("div");
    msg.textContent = message;
    msg.style.marginBottom = "12px";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const no = document.createElement("button");
    no.textContent = "No";
    no.onclick = () => {
      document.body.removeChild(backdrop);
      resolve(false);
    };

    const yes = document.createElement("button");
    yes.textContent = "Yes";
    yes.onclick = () => {
      document.body.removeChild(backdrop);
      resolve(true);
    };

    actions.appendChild(no);
    actions.appendChild(yes);
    box.appendChild(msg);
    box.appendChild(actions);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
  });
}
