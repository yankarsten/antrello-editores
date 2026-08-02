import { db } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader
        title="Novo projeto"
        subtitle="Preencha os dados do projeto e envie os vídeos brutos para o editor trabalhar."
      />
      <div className="rounded-card border border-ink bg-white p-8 shadow-hard">
        <NewProjectForm editors={editors} />
      </div>
    </div>
  );
}
