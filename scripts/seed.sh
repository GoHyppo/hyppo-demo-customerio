#!/bin/sh
# Manda datos de prueba al workspace por la integración "Customer.io API" (HTTP, fuente 189544).
# Usa la key privada (sk_) de .env: corre solo desde una terminal, nunca en la página.
#
#   scripts/seed.sh                 → identify + evento para demo-http-1
#   scripts/seed.sh demo-http-7     → lo mismo con otro userId
set -eu
cd "$(dirname "$0")/.."
. ./.env
: "${CIO_HTTP_API_KEY:?Falta CIO_HTTP_API_KEY en .env}"

USER_ID="${1:-demo-http-1}"

call() {
  # X-Strict-Mode: sin esto, una key mala también devuelve 200 y el dato se pierde.
  curl -sS -w ' → HTTP %{http_code}\n' -X POST "https://cdp.customer.io/v1/$1" \
    -H "Authorization: Bearer $CIO_HTTP_API_KEY" \
    -H 'content-type: application/json' \
    -H 'X-Strict-Mode: 1' \
    -d "$2"
}

call identify "{\"userId\":\"$USER_ID\",\"traits\":{\"email\":\"$USER_ID@example.com\",\"first_name\":\"Demo HTTP\",\"plan\":\"pro\",\"origen\":\"http-api\"}}"
call track "{\"userId\":\"$USER_ID\",\"event\":\"demo_desde_backend\",\"properties\":{\"origen\":\"seed.sh\"}}"
