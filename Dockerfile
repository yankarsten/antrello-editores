# Antrello Editores — Next.js 15 + Prisma (SQLite) container.
# Multi-stage: install deps, build, then a lean runner that keeps the full
# node_modules so Prisma migrate/seed and `next start` all work.

FROM node:20-bookworm-slim AS base
# Prisma's query engine needs openssl at runtime; tzdata gives the container a
# real zone database instead of a bare UTC clock.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates tzdata \
  && rm -rf /var/lib/apt/lists/*
# The app resolves every date through America/Sao_Paulo on its own (see
# lib/format.ts), so this is not what makes the dates right — it just keeps the
# container's own clock and logs on Brazilian time instead of UTC.
ENV TZ=America/Sao_Paulo
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client, then build Next.
RUN npx prisma generate \
  && npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
# Bring over everything the app needs at runtime: built output, node_modules
# (with the generated Prisma client), and the source needed by prisma seed.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json /app/package-lock.json /app/next.config.ts /app/tsconfig.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
