import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { isInviteUsable } from "@/lib/invites";
import PageHeader from "@/components/PageHeader";
import DeleteEditorButton from "./DeleteEditorButton";
import InviteForm from "./InviteForm";
import InviteActions from "./InviteActions";

export const dynamic = "force-dynamic";

export default async function EditorsPage() {
  const [editors, pendingInvites] = await Promise.all([
    db.user.findMany({
      where: { role: "editor" },
      orderBy: { name: "asc" },
      include: {
        projectsAssigned: { select: { status: true } },
        _count: { select: { deliveryVideos: true } },
      },
    }),
    db.invite.findMany({ where: { acceptedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Editores" subtitle="Contas de editor e links de acesso pendentes." />

      <InviteForm />

      {pendingInvites.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-medium">Convites pendentes</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink bg-mist text-xs uppercase tracking-wide text-ink">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Criado em</th>
                    <th className="px-4 py-3 font-medium">Situação</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => {
                    const usable = isInviteUsable(invite);
                    return (
                      <tr key={invite.id} className="border-b border-ink/15 last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">{invite.name}</td>
                        <td className="px-4 py-3 text-ink/60">{formatDate(invite.createdAt)}</td>
                        <td className="px-4 py-3 text-ink/60">
                          {usable ? `Válido até ${formatDate(invite.expiresAt)}` : "Expirado"}
                        </td>
                        <td className="px-4 py-3">
                          <InviteActions
                            inviteId={invite.id}
                            inviteName={invite.name}
                            expired={!usable}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-medium">Contas ativas</h2>
        {editors.length === 0 ? (
          <p className="card-empty">
            Nenhum editor cadastrado ainda. Gere um link de acesso acima e envie para a pessoa.
          </p>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink bg-mist text-xs uppercase tracking-wide text-ink">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Projetos ativos</th>
                    <th className="px-4 py-3 font-medium">Concluídos</th>
                    <th className="px-4 py-3 font-medium">Entregas</th>
                    <th className="px-4 py-3 font-medium">Cadastro</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {editors.map((editor) => {
                    const active = editor.projectsAssigned.filter((p) => p.status !== "concluido").length;
                    const done = editor.projectsAssigned.length - active;
                    return (
                      <tr key={editor.id} className="border-b border-ink/15 last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">{editor.name}</td>
                        <td className="px-4 py-3 text-ink">{active}</td>
                        <td className="px-4 py-3 text-ink">{done}</td>
                        <td className="px-4 py-3 text-ink">{editor._count.deliveryVideos}</td>
                        <td className="px-4 py-3 text-ink/60">{formatDate(editor.createdAt)}</td>
                        <td className="px-4 py-3">
                          <DeleteEditorButton
                            editorId={editor.id}
                            editorName={editor.name}
                            activeProjects={active}
                            deliveries={editor._count.deliveryVideos}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
