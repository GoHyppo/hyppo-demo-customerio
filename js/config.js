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
    bannerIdentificado: "https://fly.customer.io/workspaces/186015/journeys/automations/18",
    email: "https://fly.customer.io/workspaces/186015/journeys/automations/19",
    inapp: "https://fly.customer.io/workspaces/186015/journeys/automations/17",
  },

  // Web push: pegar acá la public key de Settings → Push → Web cuando Customer.io lo habilite.
  vapidPublicKey: "",
};
