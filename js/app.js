const cfg = window.CIO_CONFIG;
const $ = (sel) => document.querySelector(sel);

const PRODUCTS = [
  { id: "remera-hyppo", name: "Remera Hyppo", price: 25 },
  { id: "buzo-hyppo", name: "Buzo Hyppo", price: 60 },
  { id: "taza-hyppo", name: "Taza Hyppo", price: 12 },
];

function log(method, detail = "", kind = "") {
  const li = document.createElement("li");
  li.className = kind;
  li.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span> <code>${method}</code> ${detail ? `<pre>${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}</pre>` : ""}`;
  $("#log").prepend(li);
  console.log("[cio]", method, detail);
}

// Snippet oficial de la integración JavaScript (Data Pipelines), versión 4.15.3.
// Define window.cioanalytics y encola las llamadas hasta que carga analytics.min.js.
function loadSnippet(writeKey, options) {
  var i = "cioanalytics", analytics = (window[i] = window[i] || []);
  if (analytics.initialize || analytics.invoked) return;
  analytics.invoked = !0;
  analytics.methods = ["trackSubmit", "trackClick", "trackLink", "trackForm", "pageview", "identify", "reset", "group", "track", "ready", "alias", "debug", "page", "once", "off", "on", "addSourceMiddleware", "addIntegrationMiddleware", "setAnonymousId", "addDestinationMiddleware", "register"];
  analytics.factory = function (e) { return function () { var t = Array.prototype.slice.call(arguments); t.unshift(e); analytics.push(t); return analytics; }; };
  for (var e = 0; e < analytics.methods.length; e++) { var key = analytics.methods[e]; analytics[key] = analytics.factory(key); }
  analytics.load = function (key, e) {
    var t = document.createElement("script"); t.type = "text/javascript"; t.async = !0;
    t.setAttribute("data-global-customerio-analytics-key", i);
    t.src = "https://cdp.customer.io/v1/analytics-js/snippet/" + key + "/analytics.min.js";
    var n = document.getElementsByTagName("script")[0]; n.parentNode.insertBefore(t, n);
    analytics._writeKey = key; analytics._loadOptions = e;
  };
  analytics.SNIPPET_VERSION = "4.15.3";
  analytics.load(writeKey, options);
}

// El log sobrevive a las recargas de la demo (solo en esta pestaña).
const LOG_KEY = "cio-demo-log";
function saveLog() {
  try { sessionStorage.setItem(LOG_KEY, $("#log").innerHTML); } catch (e) { /* sin storage, se pierde el log */ }
}
function restoreLog() {
  try { $("#log").innerHTML = sessionStorage.getItem(LOG_KEY) || ""; } catch (e) { /* idem */ }
}

function reloadIn(secs, reason) {
  const status = $("#status");
  status.classList.remove("ok");
  const tick = () => {
    if (secs <= 0) { saveLog(); location.reload(); return; }
    status.textContent = `${reason}… recargo en ${secs} s`;
    secs -= 1;
    setTimeout(tick, 1000);
  };
  tick();
}

function currentUserId() {
  return cioanalytics.user?.().id() || null;
}

// Link a la lista de People filtrada por el id: el formato documentado de Customer.io
// (filtro JSON → URL-escape → base64 → URL-escape). Lleva a una sola fila, la de esta persona.
function profileUrl(id) {
  const filter = JSON.stringify({ and: [{ attribute: { field: "id", operator: "eq", value: id } }] });
  return `${cfg.links.people}?filters=${encodeURIComponent(btoa(encodeURIComponent(filter)))}`;
}

function refreshUserInfo() {
  const user = cioanalytics.user?.();
  if (!user) return;
  const id = user.id();
  const profile = $("#link-profile");
  profile.hidden = !id;
  if (id) profile.href = profileUrl(id);
  $("#who").textContent = id ? `identificado: ${user.traits()?.email || id}` : "anónimo";
  $("#who").classList.toggle("ok", Boolean(id));
  $("#anon-id").textContent = user.anonymousId() || "—";
}

// Cada llamada devuelve una promesa; si falla (bloqueador, key mala), lo marca en el log.
function send(label, promise, detail) {
  log(label, detail);
  return Promise.resolve(promise)
    .then(() => refreshUserInfo())
    .catch((err) => log(`${label}: ERROR`, String(err), "err"));
}

function renderProducts(highlight) {
  $("#products").innerHTML = PRODUCTS.map((p) => `
    <div class="product${p.id === highlight ? " highlight" : ""}" id="prod-${p.id}">
      ${p.id === highlight ? '<span class="tag">Del email</span>' : ""}
      <div class="thumb">${p.name.split(" ")[0]}</div>
      <strong>${p.name}</strong>
      <span class="muted">USD ${p.price}</span>
      <div class="row">
        <button class="ghost small" data-cart="${p.id}">Al carrito</button>
        <button class="small" data-buy="${p.id}">Comprar</button>
      </div>
    </div>`).join("");
}

function setupUi() {
  document.querySelectorAll("[data-link]").forEach((a) => { a.href = cfg.links[a.dataset.link]; });

  $("#toggle-notes").addEventListener("change", (e) => document.body.classList.toggle("show-notes", e.target.checked));

  $("#form-user").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    // ID estable por persona: el mismo email da el mismo perfil en cada demo.
    const id = "demo-" + f.email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const traits = { email: f.email.trim(), plan: f.plan };
    if (f.first_name) traits.first_name = f.first_name.trim();
    await send(`identify("${id}")`, cioanalytics.identify(id, traits), traits);
    await send('track("demo_identificado")', cioanalytics.track("demo_identificado"), "Dispara el banner para identificados");
    // Un inline ocupa su lugar hasta que se cierra: el banner nuevo entra al recargar la página.
    reloadIn(15, "Customer.io está armando tu banner");
  });

  $("#btn-logout").addEventListener("click", () => {
    cioanalytics.reset();
    log("reset", "Vuelve a ser un visitante anónimo");
    reloadIn(1, "Cerrando sesión");
  });

  $("#btn-email").addEventListener("click", () => {
    const email = cioanalytics.user?.().traits()?.email;
    if (!currentUserId() || !email) {
      $("#email-hint").textContent = "Primero identificate con tu email en el paso 2.";
      return;
    }
    send('track("demo_email_solicitado")', cioanalytics.track("demo_email_solicitado"), { email });
    $("#email-hint").textContent = `Listo: en uno o dos minutos llega a ${email}. Abrilo y tocá "Ver el buzo Hyppo".`;
  });

  $("#products").addEventListener("click", (e) => {
    const cartId = e.target.dataset.cart;
    const buyId = e.target.dataset.buy;
    const p = PRODUCTS.find((x) => x.id === (cartId || buyId));
    if (!p) return;
    const product = { product_id: p.id, name: p.name, price: p.price, quantity: 1 };
    if (cartId) {
      send('track("Product Added")', cioanalytics.track("Product Added", product), product);
      return;
    }
    const order = { order_id: `demo-${Date.now()}`, revenue: p.price, currency: "USD", products: [product] };
    send('track("Order Completed")', cioanalytics.track("Order Completed", order), order);
    e.target.textContent = "Comprado ✓";
  });

  $("#btn-inapp").addEventListener("click", () => {
    send('track("demo_inapp")', cioanalytics.track("demo_inapp"), "La automation responde con un modal en unos segundos");
  });

  $("#btn-clear").addEventListener("click", () => { $("#log").innerHTML = ""; saveLog(); });
}

// Si la persona llega desde el link del email (?uid=…), la identificamos y destacamos el producto.
function handleEmailLanding() {
  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");
  const producto = params.get("producto");
  renderProducts(uid ? producto : null);
  if (!uid) return;
  send(`identify("${uid}")`, cioanalytics.identify(uid), { origen: "link del email", utm_campaign: params.get("utm_campaign") });
  $("#from-email-id").textContent = uid;
  $("#from-email").hidden = false;
  history.replaceState(null, "", location.pathname);
  setTimeout(() => document.getElementById(`prod-${producto}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
}

function init() {
  loadSnippet(cfg.writeKey, {
    integrations: {
      "Customer.io In-App Plugin": {
        anonymousInApp: true, // el banner del paso 1 es para visitantes sin identificar
        events: (e) => log(`in-app: ${e.type.replace("in-app:", "")}`),
      },
    },
  });
  cioanalytics.page();
  restoreLog();
  setupUi();
  handleEmailLanding();

  // Si analytics.min.js no carga en unos segundos, casi siempre es un bloqueador de anuncios.
  const blocked = setTimeout(() => {
    $("#status").textContent = "Bloqueado: desactivá el bloqueador para esta página";
    $("#status").classList.add("err");
    log("snippet no cargó", "Un bloqueador de anuncios (Brave Shields, uBlock…) bloquea cdp.customer.io. Desactivalo para este sitio y recargá.", "err");
  }, 6000);

  cioanalytics.ready(() => {
    clearTimeout(blocked);
    $("#status").textContent = "Conectado a Customer.io";
    $("#status").classList.add("ok");
    log("ready", { workspace: cfg.workspaceId });
    refreshUserInfo();
  });
}

init();
