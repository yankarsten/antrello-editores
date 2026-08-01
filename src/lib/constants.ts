export const STATUSES = ["novo", "em_edicao", "em_revisao", "concluido"] as const;

export type ProjectStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  novo: "Novo",
  em_edicao: "Em edição",
  em_revisao: "Em revisão",
  concluido: "Concluído",
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (STATUSES as readonly string[]).includes(value);
}
