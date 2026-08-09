import { isDoneStatus } from "@/lib/constants";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
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
 * input lands at 18:00 of that day. Returns null for anything unparseable.
 */
export function parseDeadlineInput(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T18:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

/** Whole days between today and the deadline; negative = overdue. */
export function daysUntil(deadline: Date | string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(deadline);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day.getTime() - today.getTime()) / 86_400_000);
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
