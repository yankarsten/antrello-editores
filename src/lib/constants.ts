export const STATUSES = ["em_edicao", "concluido"] as const;

export type ProjectStatus = (typeof STATUSES)[number];

/** Status assumed for a new project and for any unrecognised stored value. */
export const DEFAULT_STATUS: ProjectStatus = "em_edicao";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  em_edicao: "Em edição",
  concluido: "Concluído",
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (STATUSES as readonly string[]).includes(value);
}
