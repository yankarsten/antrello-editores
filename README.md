# Antrello Editores

Ferramenta interna para gestão de edição de vídeos: a administração cria vídeos, envia os brutos e acompanha tudo em um quadro kanban; editores recebem vídeos, baixam o material e enviam suas entregas ("Vídeo Final", "Vídeo Final R2"…).

Na interface a unidade de trabalho se chama **vídeo**; no código e no banco ela continua sendo `Project` (`/admin/projects`, `db.project`).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Prisma + SQLite · sessões JWT (cookie httpOnly) · `@hello-pangea/dnd`.

## Rodando localmente

```bash
npm install
cp .env.example .env        # ajuste AUTH_SECRET/ADMIN_* se quiser
npx prisma migrate dev      # cria o banco SQLite
npm run db:seed             # admin + editores + vídeos de exemplo
npm run dev
```

Acesse http://localhost:3000.

**Contas de teste (seed):**

| Papel  | Nome (login)                | Senha       |
| ------ | --------------------------- | ----------- |
| Admin  | `Administrador`             | `admin123`  |
| Editor | `Marina Duarte` (e outros)  | `editor123` |

## Acesso

Não existe e-mail nem cadastro público: o login é **nome + senha**, e a única forma de criar uma conta é por um link de acesso.

1. Em `/admin/editores`, o admin informa **apenas o nome** e gera um link (`/convite/<token>`), válido por 7 dias.
2. A pessoa abre o link e define a própria senha — a conta é criada nesse momento e ela já entra logada.
3. O link é de uso único. Se for perdido, o admin gera um novo (o anterior deixa de valer) ou revoga o convite.

O banco guarda só o SHA-256 do token, então o link completo aparece uma única vez, logo depois de ser gerado. O nome é normalizado (minúsculas, espaços colapsados) para o índice único, então não dá para ter duas contas "Marina Duarte" e "marina duarte".

A conta de admin é criada apenas pelo seed (`ADMIN_NAME`/`ADMIN_PASSWORD` no `.env`).

## Uploads

Os vídeos são gravados em `storage/` (ignorado pelo git) via streaming — um request por arquivo, sem carregar o arquivo na memória — e servidos por rota autenticada com suporte a HTTP Range (seek no player). A troca por object storage (S3/R2/GCS) fica concentrada em `src/lib/storage.ts` e na rota `src/app/api/videos/[type]/[id]/route.ts`.
