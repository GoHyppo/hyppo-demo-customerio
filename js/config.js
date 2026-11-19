// Integración JavaScript del workspace 186015 (US): Integrations → JavaScript → Settings.
// Es una key pública (pk_): solo identifica personas y manda eventos, así que va commiteada.
// La key privada (sk_) de la integración HTTP API nunca va acá: ver scripts/seed.sh.
window.CIO_CONFIG = {
  writeKey: "pk_us_9eZE6ngOzWrmW4yFry0PbKI1JgnHD9Ah_02B35V",
  workspaceId: 186015,

  // Lo que está armado en Customer.io para cada paso (ver README → Setup en Customer.io).
  links: {
    people: "https://fly.customer.io/workspaces/186015/journeys/people",
    bannerAnonimo: "https://fly.customer.io/workspaces/186015/journeys/anonymous/2",
    bannerIdentificado: "https://fly.customer.io/workspaces/186015/journeys/automations/18/overview/workflow/actions",
    email: "https://fly.customer.io/workspaces/186015/journeys/automations/19/overview/workflow/actions",
    experimento: "https://fly.customer.io/workspaces/186015/experiments/1",
    inapp: "https://fly.customer.io/workspaces/186015/journeys/automations/17/overview/workflow/actions",
    whatsapp: "https://fly.customer.io/workspaces/186015/journeys/automations/22/overview/workflow/actions",
    carrito: "https://fly.customer.io/workspaces/186015/journeys/automations/23/overview/workflow/actions",
    push: "https://fly.customer.io/workspaces/186015/journeys/automations/21/overview/workflow/actions",
  },

  // Web push: la public key (VAPID) de Settings → Push → Web. Es pública, va commiteada.
  vapidPublicKey: "BNjeEI5inFXgau7enCkWSnDzPhzI8_O42MiUIsQqGVI63FAMGxFZx8QfOp-xdYqtHngedB-8phg_hRFap8p0Wcw",
};
