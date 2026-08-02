import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import DeleteEditorButton from "./DeleteEditorButton";

export const dynamic = "force-dynamic";

export default async function EditorsPage() {
  const editors = await db.user.findMany({
    where: { role: "editor" },
    orderBy: { name: "asc" },
    include: {
      projectsAssigned: { select: { status: true } },
      _count: { select: { deliveryVideos: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Editores" subtitle="Todos os editores cadastrados na plataforma." />

      {editors.length === 0 ? (
        <p className="card-empty">
          Nenhum editor cadastrado ainda. Peça para a equipe criar conta na página de cadastro.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink bg-mist text-xs uppercase tracking-wide text-ink">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
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
                      <td className="px-4 py-3 text-ink/60">{editor.email}</td>
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
    </div>
  );
}
