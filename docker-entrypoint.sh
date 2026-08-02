#!/bin/sh
# Prepare the persistent SQLite DB + video storage, then hand off to the CMD.
set -e

# Make sure the mounted data/storage dirs exist (compose volumes mount here).
mkdir -p /app/data /app/storage

# Apply migrations against the persistent DB, then (idempotently) seed it.
echo "==> Applying Prisma migrations..."
npx prisma migrate deploy

echo "==> Seeding database (idempotent)..."
npx prisma db seed || echo "!! Seed skipped/failed (continuing)"

echo "==> Starting Next.js..."
exec "$@"
