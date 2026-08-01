# Antrello Editores

Ferramenta interna para gestão de projetos de edição de vídeo: a administração cria projetos, envia vídeos brutos e acompanha tudo em um quadro kanban; editores recebem projetos, baixam o material e enviam suas entregas ("Vídeo Final", "Vídeo Final R2"…).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Prisma + SQLite · sessões JWT (cookie httpOnly) · `@hello-pangea/dnd`.

## Rodando localmente

```bash
npm install
cp .env.example .env        # ajuste AUTH_SECRET/ADMIN_* se quiser
npx prisma migrate dev      # cria o banco SQLite
npm run db:seed             # admin + editores + projetos de exemplo
npm run dev
```

Acesse http://localhost:3000.

**Contas de teste (seed):**

| Papel  | E-mail               | Senha      |
| ------ | -------------------- | ---------- |
| Admin  | `admin@antrello.com` | `admin123` |
| Editor | `marina@antrello.com` (e outros) | `editor123` |

Editores também podem se cadastrar em `/register`. Contas de admin são criadas apenas pelo seed (`ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env`).

## Uploads

Os vídeos são gravados em `storage/` (ignorado pelo git) via streaming — um request por arquivo, sem carregar o arquivo na memória — e servidos por rota autenticada com suporte a HTTP Range (seek no player). A troca por object storage (S3/R2/GCS) fica concentrada em `src/lib/storage.ts` e na rota `src/app/api/videos/[type]/[id]/route.ts`.
