# hyppo-demo-customerio

Demo de Hyppo para mostrar Customer.io en una web, pensada para presentar en una reunión compartiendo
pantalla. Es un recorrido guiado de cinco pasos, cada uno con un botón que dispara algo real en el
workspace y un link a dónde se ve en Customer.io. Sitio estático (HTML + JS, sin build) en GitHub
Pages: <https://gohyppo.github.io/hyppo-demo-customerio/>. Push a `main` = deploy. Es la hermana de
`hyppo-demo-braze`.

Workspace: **186015** ("Hyppo", cuenta de clientes `126155`, US).

## El recorrido

| Paso | Qué hace la web | Qué responde Customer.io |
|---|---|---|
| 1 · Visitante anónimo | `page()` con un `anonymousId` | Banner inline naranja: broadcast anónimo 2 |
| 2 · Identificarse | `identify(id, {email, first_name, plan})` + `track("demo_identificado")`, y recarga a los 15 s | Banner inline azul con nombre y plan: automation 18 |
| 3 · Email → web → conversión | `track("demo_email_solicitado", {plan})` | Automation 19: rama por plan (free → email de la remera; pro y enterprise → Experiment 1 de asunto sobre el email del buzo). El link vuelve a la web con `?uid=…&producto=…`; conversión `Order Completed` en 1 día |
| 4 · In-app | `track("demo_inapp")` | Modal: automation 17 |
| 5 · Web push | Pendiente | Web push está en alpha; hay que pedirle a Customer.io que lo habilite |

El toggle **Notas técnicas** de arriba muestra el detalle de cada paso. El panel negro (arranca
minimizado, se abre abajo a la derecha) muestra cada llamada a `cioanalytics` y se conserva entre recargas de
la misma pestaña.

## Antes de la reunión

- Hacer el recorrido una vez con tu email: el plugin de in-app consulta despacio (cerca de una vez
  por minuto) hasta el primer mensaje del navegador y después pasa a tiempo real.
- Bajar el bloqueador de anuncios en el sitio (Brave Shields, uBlock bloquean `cdp.customer.io`).
- Para empezar de cero, "Empezar de nuevo" en el panel negro: visitante anónimo con otro `anonymousId` y el panel limpio.
- El ID de cada persona es `demo-` + su email normalizado, así que el mismo email vuelve al mismo
  perfil.

## Archivos

| Archivo | Qué tiene |
|---|---|
| `index.html` | Los pasos |
| `js/config.js` | La key pública (`pk_`), los links a Customer.io y la public key de web push |
| `js/app.js` | El snippet de Customer.io y toda la integración |
| `css/styles.css` | Estilos con los colores y la tipografía de Hyppo |
| `scripts/seed.sh` | Datos de prueba por la integración HTTP API, con la key privada |

## Lo armado en Customer.io

| Pieza | ID | Detalle |
|---|---|---|
| Broadcast anónimo "Demo web · banner anónimo" | 2 | Inline en `#cio-banner`, persistente, regla de página `/hyppo-demo-customerio`, objetivo: que se identifique |
| Automation "Demo web · banner identificado" | 18 | Trigger `demo_identificado` (con `first_name` y `plan` como propiedades), in-app inline en `#cio-banner`, persistente con ✕ para cerrarlo |
| Automation "Demo web · email por plan con test de asunto" | 19 | Trigger `demo_email_solicitado`; rama True/False sobre la propiedad `plan` del evento; emails de Design Studio; conversión `Order Completed` en 1 día |
| Experiment "Demo web · asunto del email del buzo" | 1 | 50/50 entre dos asuntos, conversión `Order Completed` en 1 día, ganador manual |
| Automation "Demo web · in-app" | 17 | Trigger `demo_inapp`, in-app modal |

Lo que no es obvio:

- **El ID del elemento de un inline va en `body_json.display.value`** (con `mode: "inline"`), no en
  el markup.
- **Un inline ocupa su lugar hasta que se cierra o vence.** Por eso, al identificarse, la página se
  recarga: el banner identificado recién entra en la carga siguiente.
- **El banner identificado lee nombre y plan del evento**, no del perfil: la web manda el `identify` y el
  evento casi juntos, y a veces Customer.io arma el mensaje antes de guardar los atributos (salía "Hola
  demo-…, tenés el plan free"). Es persistente: queda entre recargas hasta que se cierra con la ✕. Si
  alguien se identifica varias veces sin cerrarlo, los banners se encolan y salen de a uno, el más viejo
  primero.
- **Si el Liquid nombra un atributo que el perfil no tiene, Customer.io no manda el mensaje**, aunque
  esté como argumento de `default:`. Con `event.first_name | default: customer.first_name`, quien se
  identificaba sin nombre no recibía el banner (`undefined variable: customer.first_name` en la
  delivery). Por eso el banner usa solo `event.*`.
- **En el href de un email de Design Studio va `&`, no `&amp;`**: el compilador escapa igual, y con
  `&amp;` el link trackeado llegaba con un parámetro `amp;producto`.
- Los broadcasts anónimos son de plan Premium o Enterprise, y el snippet necesita
  `anonymousInApp: true` en el plugin de in-app.
- El email usa Arial: Gmail no carga fuentes web, así que Space Grotesk no se vería.

## Las dos integraciones (fuentes) del workspace

| Integración | Key | Dónde se usa |
|---|---|---|
| **JavaScript** | `pk_us_…` (pública) | La página. Solo identifica y manda eventos; va commiteada en `js/config.js` |
| **Customer.io API** (HTTP, fuente 189544) | `sk_us_…` (privada) | `scripts/seed.sh`, desde una terminal. Va en `.env` (gitignoreado) |

La key `sk_` da acceso a todas las APIs (borrar personas, mandar broadcasts, tocar segmentos) y la
Pipelines API la rechaza si llega desde un navegador. Nunca va en la página.

```sh
echo 'CIO_HTTP_API_KEY=sk_us_...' > .env
scripts/seed.sh               # identify + evento para demo-http-1
```

`seed.sh` manda `X-Strict-Mode: 1`: sin ese header, una key mala también devuelve `200` y el dato se
pierde sin aviso.

## Correr local

La regla de página del banner anónimo pide que la ruta contenga `/hyppo-demo-customerio`, así que hay
que servir la carpeta de arriba:

```sh
cd .. && python3 -m http.server 8000
```

y abrir `http://localhost:8000/hyppo-demo-customerio/`.
