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
  analytics.methods = ["trackSubmit", "trackClick", "trackLink", "trackForm", "pageview", "identify", "reset", "group", "track", "ready", "alias", "debug", "page", "once", "off", "on", "addSourceMiddleware", "addIntegrationMiddleware", "setAnonymousId", "addDestinationMiddleware"];
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

function refreshUserInfo() {
  const user = cioanalytics.user?.();
  if (!user) return;
  $("#current-user").textContent = user.id() || "anónima";
  $("#anon-id").textContent = user.anonymousId() || "—";
}

// Cada llamada devuelve una promesa con el contexto; si falla (bloqueador, key mala), lo marca en el log.
function send(label, promise, detail) {
  log(label, detail);
  Promise.resolve(promise)
    .then(() => refreshUserInfo())
    .catch((err) => log(`${label}: ERROR`, String(err), "err"));
}

function setupUi() {
  $("#form-user").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const traits = { plan: f.plan };
    if (f.email) traits.email = f.email;
    if (f.first_name) traits.first_name = f.first_name;
    send(`identify("${f.user_id}")`, cioanalytics.identify(f.user_id, traits), traits);
  });

  $("#btn-logout").addEventListener("click", () => {
    cioanalytics.reset();
    log("reset", "Persona anónima con un anonymousId nuevo");
    refreshUserInfo();
  });

  $("#form-event").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get("name");
    const props = { seccion: "eventos", origen: "demo-customerio" };
    send(`track("${name}")`, cioanalytics.track(name, props), props);
  });

  $("#btn-page").addEventListener("click", () => {
    send("page()", cioanalytics.page(), { path: location.pathname });
  });

  $("#products").innerHTML = PRODUCTS.map((p) => `
    <div class="product">
      <div class="thumb">${p.name.split(" ")[0]}</div>
      <strong>${p.name}</strong>
      <span class="muted">USD ${p.price}</span>
      <div class="row">
        <button class="ghost small" data-cart="${p.id}">Al carrito</button>
        <button class="small" data-buy="${p.id}">Comprar</button>
      </div>
    </div>`).join("");

  $("#products").addEventListener("click", (e) => {
    const cartId = e.target.dataset.cart;
    const buyId = e.target.dataset.buy;
    const p = PRODUCTS.find((x) => x.id === (cartId || buyId));
    if (!p) return;
    const product = { product_id: p.id, name: p.name, price: p.price, quantity: 1 };
    if (cartId) {
      send('track("Product Added")', cioanalytics.track("Product Added", product), product);
    } else {
      const order = { order_id: `demo-${Date.now()}`, revenue: p.price, currency: "USD", products: [product] };
      send('track("Order Completed")', cioanalytics.track("Order Completed", order), order);
    }
  });

  $("#btn-inapp").addEventListener("click", () => {
    send('track("demo_inapp")', cioanalytics.track("demo_inapp"), "Si hay una automation con ese trigger, el in-app aparece en unos segundos");
  });

  $("#form-group").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const traits = { name: f.name, object_type_id: "1" };
    send(`group("${f.group_id}")`, cioanalytics.group(f.group_id, traits), traits);
  });

  $("#btn-clear").addEventListener("click", () => { $("#log").innerHTML = ""; });
}

function inAppEvents(e) {
  log(`in-app: ${e.type.replace("in-app:", "")}`, e.detail?.messageId ? { messageId: e.detail.messageId } : "");
}

function init() {
  if (!cfg.writeKey) {
    $("#status").textContent = "Falta writeKey en js/config.js";
    $("#status").classList.add("err");
    return;
  }

  loadSnippet(cfg.writeKey, {
    integrations: { "Customer.io In-App Plugin": { events: inAppEvents } },
  });
  cioanalytics.page();
  setupUi();

  // Si analytics.min.js no carga en unos segundos, casi siempre es un bloqueador de anuncios.
  const blocked = setTimeout(() => {
    $("#status").textContent = "Bloqueado: desactivá el bloqueador para esta página";
    $("#status").classList.add("err");
    log("snippet no cargó", "Un bloqueador de anuncios (Brave Shields, uBlock…) bloquea cdp.customer.io. Desactivalo para este sitio y recargá.", "err");
  }, 6000);

  cioanalytics.ready(() => {
    clearTimeout(blocked);
    $("#status").textContent = `Conectado · workspace ${cfg.workspaceId}`;
    $("#status").classList.add("ok");
    log("ready", { writeKey: `${cfg.writeKey.slice(0, 12)}…` });
    refreshUserInfo();
  });
}

init();
