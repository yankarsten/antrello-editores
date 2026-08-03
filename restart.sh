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


# The SQLite DB lives on the named volume "db-data" (see docker-compose.yml),
# which `up -d --build` never touches — only `down -v` or `volume rm` would.
# Report which case this run is, so data loss is obvious if it ever happens.
if docker volume ls -q 2>/dev/null | grep -q "db-data$"; then
  echo "==> Existing database volume found — data will be preserved."
else
  echo "==> No existing database volume — a fresh one will be created (first boot)."
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
