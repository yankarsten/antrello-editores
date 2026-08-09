// The editor roster as the assignment controls need it: each editor carries how
// much work is already on their plate, so picking one is never a blind choice.
import { db } from "@/lib/db";
import { DONE_STATUSES } from "@/lib/constants";

export interface EditorOption {
  id: string;
  name: string;
  /** Projects assigned to them that have not crossed the finish line yet. */
  activeProjects: number;
}

export async function listEditorOptions(): Promise<EditorOption[]> {
  const editors = await db.user.findMany({
    where: { role: "editor" },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          projectsAssigned: { where: { status: { notIn: [...DONE_STATUSES] } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return editors.map((editor) => ({
    id: editor.id,
    name: editor.name,
    activeProjects: editor._count.projectsAssigned,
  }));
}
