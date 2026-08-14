# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
cp .env.example .env         # AUTH_SECRET, ADMIN_NAME/ADMIN_PASSWORD, DATABASE_URL
npx prisma migrate dev       # create/migrate the SQLite db
npm run db:seed              # admin + sample editors + sample vídeos (idempotent)
npm run dev                  # next dev --turbopack, http://localhost:3000

npm run build                # next build --turbopack
npm run lint                 # eslint (next/core-web-vitals + next/typescript)
npx tsc --noEmit             # type check — not part of `npm run lint`
```

After changing `prisma/schema.prisma`: `npx prisma migrate dev --name <slug>` (migrations are committed; `docker-entrypoint.sh` runs `migrate deploy` on boot).

There is **no test suite and no test runner** in this repo — verify changes by running the app.

Deploy: `./restart.sh` rebuilds the image and restarts the `app` container; a host `cloudflared` systemd service tunnels `localhost:3000` to https://antrello.com.br. See `DEPLOY.md`.

## Architecture

Next.js 15 App Router · React 19 · TypeScript · Tailwind 3 · Prisma/SQLite · JWT session cookie · `@hello-pangea/dnd`.

**All user-facing copy is Brazilian Portuguese.** The UI unit of work is a "vídeo"; in code and in the database it is `Project` (`/admin/projects/[id]`, `db.project`). Keep that split — don't rename either side to match the other.

### Roles and routing

Two roles, no e-mail addresses, no public signup:

- `src/middleware.ts` (Edge) verifies the session cookie and redirects `/`, `/login`, `/admin/*`, `/editor/*`. `/convite/[token]` is deliberately *not* matched — it is the only public entry point.
- `src/lib/jwt.ts` must stay free of Node built-ins so the Edge middleware can import it. Node-only session work (bcrypt, `cookies()`) lives in `src/lib/auth.ts`.
- Middleware is routing, not authorization. Every layout, page, and API route re-checks with `getSession()` and returns 403/404 itself.
- Accounts are created only by accepting a single-use invite link (`src/lib/invites.ts`); only the SHA-256 of the token is stored. The first admin comes from the seed.
- Login is **name + password**. `User.nameKey` (from `normalizeName()` in `src/lib/users.ts`) carries the unique index; every lookup goes through it so "Marina Duarte" and "marina  duarte" can't be two accounts.

### Data flow

Server components read Prisma directly (`src/lib/db.ts`) and pass plain serializable props to client components; mutations go through `src/app/api/**` route handlers which the client calls with `fetch` + `router.refresh()`. Pages that read the database set `export const dynamic = "force-dynamic"`.

`Project.status` is a string column; the source of truth is `STATUSES` in `src/lib/constants.ts` — **declaration order is the kanban column order**. Use `isProjectStatus()` to validate input and `isDoneStatus()`/`DONE_STATUSES` rather than comparing to `"concluido"`, since "publicado" is also past the finish line.

### Dates

Everything date-related goes through `src/lib/format.ts`, which pins to `America/Sao_Paulo` (fixed −03:00). The server runs in a container and the same code re-renders in browsers anywhere, so **nothing may read the runtime's local calendar**: use `formatDate`/`formatDateTime`/`dayKey`/`daysUntil`, and parse date inputs with `parseDeadlineInput()` (which lands a `YYYY-MM-DD` at 18:00 UTC−3).

`Project.deadline` is **nullable** — a vídeo can be created (or later edited) with no prazo. Anything that reads it has to handle null: `DeadlineBadge` renders "Sem prazo", the calendar skips those vídeos, and every deadline sort goes through `compareDeadlines()`, which parks the undated ones at the end in both directions.

### Uploads and files

Three file collections per project: `SourceVideo` (brutos, admin uploads), `Attachment` (anexos, admin, videos **and** images), `DeliveryVideo` (vídeos finais, assigned editor or admin).

- Uploads are **chunked raw-body POSTs**, not multipart: each request body must stay under Cloudflare's 100 MB proxy limit. `CHUNK_SIZE` (90 MB) is duplicated in `src/components/UploadDropzone.tsx` (authoritative, client-side) and `src/lib/upload.ts`; keep both under 100 MB and in step. Chunks arrive serially keyed by `x-upload-id`; the server appends to `storage/tmp/<id>.part` (`saveChunk`) and only creates the DB row on the final chunk.
- `src/lib/media.ts` and `src/lib/delivery.ts` are **client-safe by design** (no Node built-ins) so the dropzone validates against the exact lists the API enforces and the upload forms preview the exact filename the server will assign. Don't add Node imports to them. SVG is excluded from image uploads on purpose.
- Delivery filenames are always server-assigned: `<project-slug>-r<N>.<ext>` with `N = count(deliveries) + 1`. The uploaded file's own name is discarded.
- All disk access is funnelled through `src/lib/storage.ts`; files are served by `src/app/api/files/[type]/[id]/route.ts`, which authorizes (admin, or the assigned editor) and supports HTTP Range for `<video>` seeking. Those two files are the entire swap surface for moving to S3/R2/GCS.
- `storage/` and `prisma/dev.db` are gitignored; in Docker they live on named volumes (`video-storage`, `db-data`).

### Styling

A Positivus-derived design system: near-black `ink`, gold `accent`, `mist` surface, flat 1px ink borders and offset `shadow-hard` instead of soft shadows, with custom radii (`rounded-card|panel|control`) — all in `tailwind.config.ts`. Reusable component classes (`.btn-*`, `.card*`, `.chip`, `.pill`, `.input`, `.alert-*`) are defined in `src/app/globals.css`; prefer them over re-deriving utility strings. Status colors live in `src/lib/status-ui.ts` and separate states by fill weight, reserving the accent for "Publicado". `/positivus` renders the original landing-page reference the system was ported from.
