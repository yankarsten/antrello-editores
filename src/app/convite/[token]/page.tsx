import { db } from "@/lib/db";
import { hashInviteToken, isInviteUsable } from "@/lib/invites";
import SetPasswordForm from "./SetPasswordForm";

export const dynamic = "force-dynamic";

// Public page — the invite token is the credential. Everything else in the app
// sits behind the session cookie.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.invite.findUnique({ where: { tokenHash: hashInviteToken(token) } });
  const valid = invite !== null && isInviteUsable(invite);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-medium tracking-tight">
            Antrello <span className="pill">Editores</span>
          </h1>
          <p className="mt-3 text-base text-ink/70">Gestão de projetos de edição de vídeo</p>
        </div>

        <div className="rounded-card border border-ink bg-white p-8 shadow-hard sm:p-10">
          {valid ? (
            <>
              <h2 className="mb-2 text-2xl font-medium">Criar seu acesso</h2>
              <p className="mb-6 text-sm text-ink/70">
                Você entrará como <strong className="font-medium text-ink">{invite.name}</strong>. Escolha
                a senha que vai usar para entrar.
              </p>
              <SetPasswordForm token={token} name={invite.name} />
            </>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-medium">Link indisponível</h2>
              <p className="text-sm text-ink/70">
                Este link de acesso não é válido, já foi usado ou expirou. Peça um novo para a
                administração.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
