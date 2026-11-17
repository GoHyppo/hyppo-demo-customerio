# hyppo-demo-customerio

Demo interna de Hyppo para mostrar cómo se integra Customer.io en una web y ver en el workspace cómo
aparece cada cosa: identidad, atributos, eventos, compras, in-app messages y objetos. Es un sitio
estático (HTML + JS, sin build) publicado en GitHub Pages. Es la hermana de `hyppo-demo-braze`.

Workspace: **186015** (US), <https://fly.customer.io/workspaces/186015/people>.

Cada sección de la página tiene un desplegable de **Particularidades** con lo que no es obvio la
primera vez, y el panel de la derecha muestra cada llamada a `cioanalytics`.

## Archivos

| Archivo | Qué tiene |
|---|---|
| `index.html` | Las secciones de la demo |
| `js/config.js` | La key pública (`pk_`) de la integración JavaScript |
| `js/app.js` | El snippet de Customer.io y toda la integración |
| `css/styles.css` | Estilos con los colores y la tipografía de Hyppo |
| `scripts/seed.sh` | Datos de prueba por la integración HTTP API, con la key privada |

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
scripts/seed.sh demo-http-7   # otro userId
```

`seed.sh` manda `X-Strict-Mode: 1`: sin ese header, una key mala también devuelve `200` y el dato se
pierde sin aviso.

## Setup en Customer.io

1. **In-app**: Workspace Settings → In-App → *Enable in-app*. Con eso el snippet carga el plugin solo.
2. **Automation de prueba**: trigger *Performed event* `demo_inapp`, con un mensaje In-App.
3. **Objetos** (opcional): Data Index → Objects, crear un tipo (por ejemplo *Empresas*). La demo usa
   `object_type_id: "1"`, el primero que se crea.

## Correr local

```sh
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. Abrir el `index.html` directo como archivo no sirve.

Los bloqueadores de anuncios (Brave Shields, uBlock) bloquean `cdp.customer.io`: la página lo avisa
en el estado de arriba a la derecha.

## Qué se manda a Customer.io

| Acción | Llamada | Dónde se ve |
|---|---|---|
| Identificar | `identify(id, {email, first_name, plan})` | People → el perfil |
| Cerrar sesión | `reset()` | Persona anónima con `anonymousId` nuevo |
| Enviar evento | `track(nombre, props)` | Activity del perfil; Integrations → JavaScript → Data In |
| Page view | `page()` (también al cargar) | Ídem |
| Al carrito | `track("Product Added", {product_id, price, …})` | Ídem |
| Comprar | `track("Order Completed", {order_id, revenue, products})` | Ídem; sirve de conversion goal |
| Disparar in-app | `track("demo_inapp")` | El mensaje en la página |
| Empresa | `group(id, {name, object_type_id})` | Data Index → Objects |
