// Declaration order is the pipeline order: it drives the board's columns and
// the calendar legend, so a video walks left to right through this list.
export const STATUSES = ["a_gravar", "em_edicao", "concluido", "publicado"] as const;

export type ProjectStatus = (typeof STATUSES)[number];

/** Status assumed for a new project and for any unrecognised stored value. */
export const DEFAULT_STATUS: ProjectStatus = "a_gravar";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  a_gravar: "A gravar",
  em_edicao: "Em edição",
  concluido: "Concluído",
  publicado: "Publicado",
};

/**
 * Statuses past the finish line. They stop the deadline countdown and file the
 * video under finished work, so anything that used to test for "concluido"
 * alone should ask this instead.
 */
export const DONE_STATUSES: readonly ProjectStatus[] = ["concluido", "publicado"];

export function isProjectStatus(value: string): value is ProjectStatus {
  return (STATUSES as readonly string[]).includes(value);
}

export function isDoneStatus(value: string | undefined): boolean {
  return value !== undefined && (DONE_STATUSES as readonly string[]).includes(value);
}
