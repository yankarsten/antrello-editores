import type { ProjectStatus } from "@/lib/constants";

/**
 * The palette is monochrome plus a single accent, so the working statuses are
 * separated by *fill weight* rather than by hue — white → grey → solid ink —
 * and the accent is spent on the one state that ends the pipeline, "Publicado".
 * That keeps the progression readable while staying inside the design system.
 */
export const STATUS_FILL: Record<ProjectStatus, string> = {
  a_gravar: "bg-white text-ink",
  em_edicao: "bg-mist text-ink",
  concluido: "bg-ink text-white",
  publicado: "bg-accent text-ink",
};

/** Same scale as a small dot: legends, list markers, calendar keys. */
export const STATUS_DOT: Record<ProjectStatus, string> = {
  a_gravar: "bg-white",
  em_edicao: "bg-muted",
  concluido: "bg-ink",
  publicado: "bg-accent",
};

/** Hover-capable variant for clickable chips (calendar day cells). */
export const STATUS_CHIP: Record<ProjectStatus, string> = {
  a_gravar: "bg-white text-ink hover:bg-mist",
  em_edicao: "bg-mist text-ink hover:bg-ink/10",
  concluido: "bg-ink text-white hover:bg-black",
  publicado: "bg-accent text-ink hover:bg-accent-dark",
};
