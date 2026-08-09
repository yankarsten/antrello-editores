/**
 * Naming of the final videos delivered for a project.
 *
 * Whoever uploads (the assigned editor or an admin), the file is renamed after
 * the project itself — the name the editor's export happens to carry says
 * nothing to anyone downloading it later. Every delivery of a project shares
 * the same stem and differs only by its revision number.
 *
 * Free of node built-ins so the upload forms can preview the exact name the
 * server is going to assign.
 */
import { extensionOf } from "@/lib/media";

/** "Pobre Quente" -> "pobre_quente". */
export function projectSlug(title: string): string {
  const slug = title
    .normalize("NFD")
    // Strip the combining marks NFD just split off: "Ação" -> "Acao".
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  // A title made only of symbols would otherwise leave the file unnamed.
  return slug || "video";
}

/** The name without its extension: "Pobre Quente", 2 -> "pobre_quente-r2". */
export function deliveryStem(title: string, revision: number): string {
  return `${projectSlug(title)}-r${revision}`;
}

/** "Pobre Quente", 2, "Final_EXPORT.MP4" -> "pobre_quente-r2.mp4". */
export function deliveryFileName(title: string, revision: number, originalName: string): string {
  const stem = deliveryStem(title, revision);
  const extension = extensionOf(originalName);
  return extension ? `${stem}.${extension}` : stem;
}

/** Human-readable name of the delivery, kept in step with the file name. */
export function deliveryLabel(revision: number): string {
  return `Vídeo Final R${revision}`;
}
