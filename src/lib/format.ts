import { isDoneStatus } from "@/lib/constants";

/**
 * The app runs on Brazilian time (UTC−3), never on the timezone it happens to
 * be executing in: the server is a container that boots in UTC, and the same
 * code renders again in a browser whose clock is wherever the viewer is. A
 * deadline of "20 de agosto" has to be the 20th for everyone, so every date
 * shown or compared is resolved through this zone and nothing reads the
 * runtime's local calendar.
 *
 * The two constants describe the same zone and must agree: Brazil dropped DST
 * in 2019, so America/Sao_Paulo is a fixed −03:00.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";
export const APP_UTC_OFFSET = "-03:00";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: APP_TIME_ZONE,
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

/** "YYYY-MM-DD" in the app's timezone — used to bucket items into calendar days. */
export function dayKey(date: Date | string): string {
  return dayKeyFormatter.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

/**
 * A deadline is a day, not a moment: the "YYYY-MM-DD" that comes from a date
 * input lands at 18:00 of that day *in the app's timezone* — spelling out the
 * offset is what keeps the stored instant from sliding to another calendar day
 * on a server that boots in UTC. Returns null for anything unparseable.
 */
export function parseDeadlineInput(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T18:00:00${APP_UTC_OFFSET}`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Whole days between today and the deadline; negative = overdue.
 *
 * Both ends are reduced to a calendar day in the app's timezone first, so the
 * count is the same one a person in Brazil would make — and the same on the
 * server and in the browser, whatever their clocks are set to.
 */
export function daysUntil(deadline: Date | string): number {
  return daysBetweenKeys(dayKey(new Date()), dayKey(deadline));
}

/** Whole days from one "YYYY-MM-DD" to another. The keys already carry the
 * app's timezone, so reading both as UTC midnight makes the difference exact. */
function daysBetweenKeys(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export type SortDirection = "asc" | "desc";

/**
 * Orders two deadlines. A video without a deadline has no place on the
 * timeline, so it lands at the end of the list whichever way the sort points.
 */
export function compareDeadlines(
  a: Date | string | null,
  b: Date | string | null,
  direction: SortDirection = "asc"
): number {
  if (!a || !b) return a ? -1 : b ? 1 : 0;
  const diff = new Date(a).getTime() - new Date(b).getTime();
  return direction === "asc" ? diff : -diff;
}

export type DeadlineTone = "overdue" | "soon" | "ok";

export function deadlineTone(deadline: Date | string, status?: string): DeadlineTone {
  if (isDoneStatus(status)) return "ok";
  const days = daysUntil(deadline);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "ok";
}

export function deadlineText(deadline: Date | string): string {
  const days = daysUntil(deadline);
  if (days < 0) return days === -1 ? "Atrasado há 1 dia" : `Atrasado há ${-days} dias`;
  if (days === 0) return "Entrega hoje";
  if (days === 1) return "1 dia restante";
  return `${days} dias restantes`;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
