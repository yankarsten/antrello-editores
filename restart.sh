#!/usr/bin/env bash
# Build (if needed) and start/restart the Antrello Editores container.
# Usage: ./restart.sh          -> build + (re)start in the background
#        ./restart.sh --logs   -> same, then follow the logs
set -euo pipefail

cd "$(dirname "$0")"

# Pick up an optional local .env (AUTH_SECRET, ADMIN_*) if present.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Support both `docker compose` (v2) and legacy `docker-compose`.
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Error: Docker Compose not found. Install Docker to continue." >&2
  exit 1
fi

echo "==> Building and (re)starting the container..."
$COMPOSE up -d --build

echo
echo "==> Antrello Editores is running at http://localhost:3000"
$COMPOSE ps

if [ "${1:-}" = "--logs" ]; then
  echo
  echo "==> Following logs (Ctrl-C to stop; the container keeps running)..."
  $COMPOSE logs -f
fi
