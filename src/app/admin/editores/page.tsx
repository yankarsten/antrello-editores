import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
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
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold text-zinc-900">Editores</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        Todos os editores cadastrados na plataforma.
      </p>

      {editors.length === 0 ? (
        <p className="card mt-6 px-4 py-10 text-center text-sm text-zinc-500">
          Nenhum editor cadastrado ainda. Peça para a equipe criar conta na página de cadastro.
        </p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
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
                  <tr key={editor.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-800">{editor.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{editor.email}</td>
                    <td className="px-4 py-3 text-zinc-700">{active}</td>
                    <td className="px-4 py-3 text-zinc-700">{done}</td>
                    <td className="px-4 py-3 text-zinc-700">{editor._count.deliveryVideos}</td>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(editor.createdAt)}</td>
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
      )}
    </div>
  );
}
