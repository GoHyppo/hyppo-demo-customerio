const cfg = window.CIO_CONFIG;
const $ = (sel) => document.querySelector(sel);

const PRODUCTS = [
  { id: "remera-hyppo", name: "Remera Hyppo", price: 25, frase: "la remera Hyppo" },
  { id: "buzo-hyppo", name: "Buzo Hyppo", price: 64, frase: "el buzo Hyppo" },
  { id: "gorra-hyppo", name: "Gorra Hyppo", price: 22, frase: "la gorra Hyppo" },
];

function log(method, detail = "", kind = "") {
  const li = document.createElement("li");
  li.className = kind;
  li.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span> <code>${method}</code> ${detail ? `<pre>${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}</pre>` : ""}`;
  $("#log").prepend(li);
  countLog();
  const tab = $("#btn-log-open");
  tab.classList.remove("pulse"); void tab.offsetWidth; tab.classList.add("pulse");
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

function countLog() { $("#log-count").textContent = $("#log").children.length; }

// El log, y si el panel está abierto, sobreviven a las recargas de la demo (solo en esta pestaña).
const LOG_KEY = "cio-demo-log";
function saveLog() {
  try { sessionStorage.setItem(LOG_KEY, $("#log").innerHTML); } catch (e) { /* sin storage, se pierde el log */ }
}
function restoreLog() {
  try { $("#log").innerHTML = sessionStorage.getItem(LOG_KEY) || ""; } catch (e) { /* idem */ }
  countLog();
  try { setLogOpen(sessionStorage.getItem(LOG_OPEN_KEY) === "1"); } catch (e) { /* queda minimizado */ }
}
const LOG_OPEN_KEY = "cio-demo-log-open";
function setLogOpen(open) {
  document.body.classList.toggle("log-closed", !open);
  try { sessionStorage.setItem(LOG_OPEN_KEY, open ? "1" : "0"); } catch (e) { /* sin storage */ }
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

// WhatsApp: intl-tel-input igual que el formulario de hyppo.io (hyppo_landing, src/lib/phone.ts).
// País inicial según la zona horaria del dispositivo; si no la reconoce, Argentina.
const TZ = {
  ar: /^America\/(Argentina\/|Buenos_Aires$|Cordoba$|Mendoza$|Catamarca$|Jujuy$)/,
  mx: /^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana)$/,
  pe: /^America\/Lima$/, cl: /^(America\/(Santiago|Punta_Arenas)|Pacific\/Easter)$/,
  co: /^America\/Bogota$/, uy: /^America\/Montevideo$/, py: /^America\/Asuncion$/,
  es: /^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/,
  us: /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise)|Pacific\/Honolulu)$/,
};
function detectCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    for (const iso in TZ) if (TZ[iso].test(tz)) return iso;
  } catch (e) { /* sin Intl: Argentina */ }
  return "ar";
}
let phoneInput = null;
function setupPhone() {
  if (!window.intlTelInput) return; // si el CDN no cargó, queda un campo de texto común
  phoneInput = window.intlTelInput($("#f-whatsapp"), {
    initialCountry: detectCountry(),
    separateDialCode: true,
    countryNameLocale: "es",
    uiTranslations: { searchPlaceholder: "Buscar", searchEmptyState: "No se encontraron resultados", countryListAriaLabel: "Lista de países", noCountrySelected: "Selecciona el país" },
    countryOrder: ["ar", "mx", "pe", "co", "cl", "py", "uy", "us", "es"],
  });
}
// Devuelve el WhatsApp en dígitos con código de país (como lo identifica GoChat), "" si está vacío,
// o null si no es un número válido.
function readWhatsapp() {
  const input = $("#f-whatsapp");
  const raw = input.value.trim();
  if (!raw) return "";
  if (!phoneInput) return raw.replace(/\D/g, "");
  if (!phoneInput.isValidNumber()) return null;
  let e164 = phoneInput.getNumber();
  // libphonenumber lee "11 5555 0142" como fijo argentino (+5411…): WhatsApp necesita el 9 del celular.
  if (phoneInput.getSelectedCountry()?.iso2 === "ar" && /^\+54[1-8]\d{9}$/.test(e164)) e164 = "+549" + e164.slice(3);
  return e164.replace(/\D/g, "");
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

// Cada clic tiene que verse: el botón pasa por "enviando" y "listo ✓" (o error), y con el panel
// minimizado aparece un aviso a la derecha con el evento. Si la llamada falla (bloqueador, key mala),
// queda marcado en el log.
function send(label, promise, detail, { btn, human } = {}) {
  log(label, detail);
  const t = toast(label, human);
  busy(btn);
  return Promise.all([Promise.resolve(promise), new Promise((r) => setTimeout(r, 300))])
    .then(() => { refreshUserInfo(); done(btn); })
    .catch((err) => { log(`${label}: ERROR`, String(err), "err"); toastError(t); done(btn, "err"); });
}

function busy(btn) {
  if (!btn) return;
  btn.dataset.label ??= btn.textContent;
  btn.dataset.state = "busy";
  btn.disabled = true;
}
// "Listo ✓" por 2,5 s y vuelve al texto original; data-keep lo deja fijo (como "Comprado ✓").
function done(btn, state = "done") {
  if (!btn) return;
  btn.dataset.state = state;
  btn.textContent = state === "err" ? "No se pudo enviar" : btn.dataset.done || "Enviado ✓";
  if (state === "done" && "keep" in btn.dataset) return;
  btn.disabled = false;
  setTimeout(() => { delete btn.dataset.state; btn.textContent = btn.dataset.label; }, 2500);
}
// Falta un paso previo (por ejemplo, identificarse): el botón lo marca y el aviso dice qué hacer.
function blocked(btn, hint, msg) {
  hint.textContent = msg;
  btn.dataset.label ??= btn.textContent;
  btn.dataset.state = "err";
  setTimeout(() => delete btn.dataset.state, 2500);
}

// Avisos a la derecha cuando el panel está minimizado: hasta 3, cada uno se va solo a los 10 s (que se alcance a leer mientras se presenta).
function toast(label, human) {
  if (!document.body.classList.contains("log-closed")) return null;
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<code></code><span></span>`;
  el.querySelector("code").textContent = label;
  el.querySelector("span").textContent = human || "Enviado a Customer.io";
  box.prepend(el);
  while (box.children.length > 3) box.lastElementChild.remove();
  el._timer = setTimeout(() => dismiss(el), 10000);
  return el;
}
function toastError(el) {
  if (!el) return;
  el.classList.add("err");
  el.querySelector("span").textContent = "No llegó a Customer.io: mira el panel";
  clearTimeout(el._timer);
  el._timer = setTimeout(() => dismiss(el), 8000);
}
function dismiss(el) {
  el.classList.add("out");
  setTimeout(() => el.remove(), 200);
}

// Cupones de la promoción in-app (paso 3): el link del modal trae ?cupon=… y vale para el producto destacado.
const CUPONES = { BIENVENIDA15: 15, VUELVE20: 20 };
let oferta = null; // { producto, cupon, pct }

// Precio final de un producto: con descuento si es el de la oferta.
function priceOf(p) {
  if (oferta?.producto !== p.id) return { price: p.price };
  const price = Math.round(p.price * (100 - oferta.pct)) / 100;
  return { price, coupon: oferta.cupon, discount: Math.round((p.price - price) * 100) / 100 };
}

function renderProducts(highlight) {
  $("#products").innerHTML = PRODUCTS.map((p) => {
    const { price, coupon } = priceOf(p);
    return `
    <div class="product${p.id === highlight ? " highlight" : ""}" id="prod-${p.id}">
      ${p.id === highlight ? '<span class="tag">Para ti</span>' : ""}
      <div class="thumb">${p.name.split(" ")[0]}</div>
      <strong>${p.name}</strong>
      <span class="muted">${coupon ? `<span class="price-old">USD ${p.price}</span> <strong>USD ${price.toFixed(2)}</strong> con ${coupon}` : `USD ${p.price}`}</span>
      <div class="row">
        <button class="ghost small" data-cart="${p.id}" data-done="Agregado ✓">Al carrito</button>
        <button class="small" data-buy="${p.id}" data-done="Comprado ✓" data-keep>Comprar</button>
      </div>
    </div>`;
  }).join("");
}

function setupUi() {
  document.querySelectorAll("[data-link]").forEach((a) => { a.href = cfg.links[a.dataset.link]; });

  $("#btn-log-open").addEventListener("click", () => setLogOpen(true));
  $("#btn-log-close").addEventListener("click", () => setLogOpen(false));
  $("#toggle-notes").addEventListener("change", (e) => document.body.classList.toggle("show-notes", e.target.checked));

  $("#form-user").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    // ID estable por persona: el mismo email da el mismo perfil en cada demo.
    const id = "demo-" + f.email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const traits = { email: f.email.trim(), nivel: f.nivel };
    if (f.first_name) traits.first_name = f.first_name.trim();
    const whatsapp = readWhatsapp();
    $("#whatsapp-error").hidden = whatsapp !== null;
    if (whatsapp === null) { $("#f-whatsapp").focus(); return; }
    if (whatsapp) { traits.whatsapp = whatsapp; traits.phone = "+" + whatsapp; }
    const btn = e.target.querySelector("button[type=submit]");
    await send(`identify("${id}")`, cioanalytics.identify(id, traits), traits, { btn, human: "Perfil creado o actualizado" });
    // El banner lee nombre y nivel del evento: si los leyera del perfil, a veces Customer.io
    // arma el mensaje antes de guardar los atributos del identify y cae en los valores por defecto.
    const props = { first_name: traits.first_name || "", nivel: traits.nivel };
    await send('track("demo_identificado")', cioanalytics.track("demo_identificado", props), props, { human: "Dispara el banner y la promoción de tu nivel" });
    // Un inline ocupa su lugar hasta que se cierra: el banner nuevo entra al recargar la página.
    reloadIn(15, "Customer.io está armando tu banner");
  });

  // Vuelve a ser un visitante anónimo nuevo: reset() borra el id, los traits y el anonymousId.
  $("#btn-reset").addEventListener("click", () => {
    cioanalytics.reset();
    $("#log").innerHTML = "";
    log("reset", "Visitante anónimo nuevo");
    reloadIn(1, "Empezando de nuevo");
  });

  $("#btn-email").addEventListener("click", (e) => {
    const email = cioanalytics.user?.().traits()?.email;
    if (!currentUserId() || !email) return blocked(e.currentTarget, $("#email-hint"), "Primero identifícate con tu email en el paso 2.");
    // El nivel viaja en el evento: la automation elige la rama con él (nuevo → remera; frecuente → buzo con test de asunto).
    const nivel = cioanalytics.user().traits()?.nivel || "nuevo";
    send('track("demo_email_solicitado")', cioanalytics.track("demo_email_solicitado", { nivel }), { email, nivel }, { btn: e.currentTarget, human: `Email para cliente ${nivel}` });
    const producto = nivel === "nuevo" ? "la remera" : "el buzo";
    $("#email-hint").textContent = `Listo: en uno o dos minutos llega a ${email}. Como cliente ${nivel}, el email te ofrece ${producto}.`;
  });

  $("#products").addEventListener("click", (e) => {
    const cartId = e.target.dataset.cart;
    const buyId = e.target.dataset.buy;
    const p = PRODUCTS.find((x) => x.id === (cartId || buyId));
    if (!p) return;
    const product = { product_id: p.id, name: p.name, price: p.price, quantity: 1 };
    if (cartId) {
      // Anónimo también: Customer.io guarda el evento y, al identificarse, lo suma al perfil y dispara el carrito abandonado.
      $("#cart-hint").textContent = currentUserId()
        ? `Agregaste ${p.frase} al carrito. Si no compras en 1 minuto, Customer.io te lo recuerda por email.`
        : `Agregaste ${p.frase} al carrito como visitante anónimo. Cuando te identifiques, Customer.io lo suma a tu perfil y te lo recuerda por email.`;
      send('track("Product Added")', cioanalytics.track("Product Added", product), product, { btn: e.target, human: `${p.name} al carrito` });
      return;
    }
    const { price, coupon, discount } = priceOf(p);
    const order = { order_id: `demo-${Date.now()}`, revenue: price, currency: "USD", products: [{ ...product, price }], ...(coupon && { coupon, discount }) };
    send('track("Order Completed")', cioanalytics.track("Order Completed", order), order, { btn: e.target, human: `Compra: ${p.name}, USD ${price.toFixed(2)}${coupon ? ` con ${coupon}` : ""}` });
  });

  $("#btn-whatsapp").addEventListener("click", (e) => {
    const btn = e.currentTarget, hint = $("#whatsapp-hint");
    const traits = cioanalytics.user?.().traits() || {};
    if (!currentUserId()) return blocked(btn, hint, "Primero identifícate en el paso 2.");
    if (!traits.whatsapp) return blocked(btn, hint, "Agrega un WhatsApp en el paso 2 y vuelve a identificarte.");
    // El producto sigue la misma regla que el email: nuevo → remera; frecuente → buzo.
    const nivel = traits.nivel || "nuevo";
    const p = PRODUCTS.find((x) => x.id === (nivel === "nuevo" ? "remera-hyppo" : "buzo-hyppo"));
    // Con el mismo cupón que el in-app del paso 3, así el precio no cambia según el canal por el que vuelve.
    const cupon = nivel === "nuevo" ? "BIENVENIDA15" : "VUELVE20";
    const props = { whatsapp: traits.whatsapp, first_name: traits.first_name || "", nivel, producto: p.id, producto_nombre: p.frase, cupon };
    send('track("demo_whatsapp_solicitado")', cioanalytics.track("demo_whatsapp_solicitado", props), props, { btn, human: `WhatsApp a +${traits.whatsapp} por GoChat` });
    hint.textContent = `Listo: en unos segundos te llega un WhatsApp a +${traits.whatsapp}.`;
  });


}

// Web push (paso 6): el plugin oficial se carga solo si hay public key, y pide permiso con un clic.
async function setupWebPush() {
  const on = $("#btn-push-on"), push = $("#btn-push"), hint = $("#push-hint");
  await new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdp.customer.io/v1/analytics-js/webPushPlugin.js";
    s.onload = s.onerror = resolve;
    document.head.appendChild(s);
  });
  if (!window.CustomerIOWebPush) {
    hint.textContent = "El bloqueador de anuncios no deja cargar el plugin de web push.";
    return;
  }
  await cioanalytics.register(CustomerIOWebPush.WebPushPlugin({
    vapidPublicKey: cfg.vapidPublicKey,
    // El sitio vive en /hyppo-demo-customerio/: el service worker se sirve desde esa carpeta.
    serviceWorkerUrl: new URL("cio-webpush-sw.js", location.href).pathname,
    trackUrl: "https://track.customer.io",
  }));

  async function refresh() {
    const subscribed = Boolean(await cioanalytics.webPush.subscription());
    on.disabled = subscribed;
    push.disabled = !subscribed;
    hint.textContent = subscribed
      ? "Notificaciones activadas en este navegador."
      : currentUserId() ? "" : "Primero identifícate en el paso 2; después activa las notificaciones.";
  }
  on.addEventListener("click", () => {
    if (!currentUserId()) return blocked(on, hint, "Primero identifícate en el paso 2.");
    // subscribe() va primero y sin await antes, para que Safari muestre el pedido de permiso.
    const sub = cioanalytics.webPush.subscribe();
    send("webPush.subscribe()", sub, "El navegador quedó como dispositivo web en tu perfil", { btn: on, human: "Navegador guardado en tu perfil" });
    sub.then(refresh)
      .catch((err) => {
        hint.textContent = Notification.permission === "denied"
          ? "Las notificaciones están bloqueadas: permítelas en la configuración del navegador y vuelve a intentar."
          : String(err.message || err);
      });
  });
  push.addEventListener("click", () => {
    send('track("demo_push")', cioanalytics.track("demo_push"), "La automation responde con un web push en unos segundos", { btn: push, human: "Llega un push en unos segundos" });
  });
  await refresh();
}

// Si la persona llega desde el link del email (?uid=…), la identificamos y destacamos el producto.
function handleEmailLanding() {
  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");
  const producto = params.get("producto");
  const cupon = params.get("cupon");
  if (uid && CUPONES[cupon]) oferta = { producto, cupon, pct: CUPONES[cupon] };
  renderProducts(uid ? producto : null);
  if (!uid) return;
  const canal = { whatsapp: "WhatsApp", inapp: "el mensaje in-app" }[params.get("utm_source")] || "el email";
  send(`identify("${uid}")`, cioanalytics.identify(uid), { origen: `link de ${canal}`, utm_campaign: params.get("utm_campaign") });
  $("#from-email-canal").textContent = canal;
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
  setupPhone();
  setupUi();
  handleEmailLanding();

  // Si analytics.min.js no carga en unos segundos, casi siempre es un bloqueador de anuncios.
  const blocked = setTimeout(() => {
    $("#status").textContent = "Bloqueado: desactiva el bloqueador para esta página";
    $("#status").classList.add("err");
    log("snippet no cargó", "Un bloqueador de anuncios (Brave Shields, uBlock…) bloquea cdp.customer.io. Desactívalo para este sitio y recarga.", "err");
  }, 6000);

  cioanalytics.ready(() => {
    clearTimeout(blocked);
    $("#status").textContent = "Conectado a Customer.io";
    $("#status").classList.add("ok");
    log("ready", { workspace: cfg.workspaceId });
    refreshUserInfo();
    setupWebPush().catch((err) => log("web push: ERROR", String(err), "err"));
  });
}

init();
