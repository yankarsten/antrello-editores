import { db } from "@/lib/db";
import NewProjectForm from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const editors = await db.user.findMany({
    where: { role: "editor" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-zinc-900">Novo projeto</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        Preencha os dados do projeto e envie os vídeos brutos para o editor trabalhar.
      </p>
      <div className="card mt-5 p-6">
        <NewProjectForm editors={editors} />
      </div>
    </div>
  );
}
