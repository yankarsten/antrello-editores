import type { ProjectStatus } from "@/lib/constants";

/**
 * The palette is monochrome plus a single accent, so the two statuses are
 * separated by *fill weight* rather than by hue — grey → solid ink. That
 * keeps the progression readable while staying inside the design system,
 * and survives greyscale printing.
 */
export const STATUS_FILL: Record<ProjectStatus, string> = {
  em_edicao: "bg-mist text-ink",
  concluido: "bg-ink text-white",
};

/** Same scale as a small dot: legends, list markers, calendar keys. */
export const STATUS_DOT: Record<ProjectStatus, string> = {
  em_edicao: "bg-muted",
  concluido: "bg-ink",
};

/** Hover-capable variant for clickable chips (calendar day cells). */
export const STATUS_CHIP: Record<ProjectStatus, string> = {
  em_edicao: "bg-mist text-ink hover:bg-ink/10",
  concluido: "bg-ink text-white hover:bg-black",
};
