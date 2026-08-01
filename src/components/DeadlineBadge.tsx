import { deadlineText, deadlineTone, formatDate } from "@/lib/format";

const TONE_CLASSES = {
  overdue: "bg-red-100 text-red-700 ring-red-200",
  soon: "bg-amber-100 text-amber-700 ring-amber-200",
  ok: "bg-zinc-100 text-zinc-600 ring-zinc-200",
} as const;

export default function DeadlineBadge({
  deadline,
  status,
  showRelative = true,
}: {
  deadline: Date | string;
  status?: string;
  showRelative?: boolean;
}) {
  const tone = deadlineTone(deadline, status);
  const done = status === "concluido";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}
      title={`Prazo: ${formatDate(deadline)}`}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden>
        <path d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3h.5A1.5 1.5 0 0 1 14 4.5v8A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-8A1.5 1.5 0 0 1 3.5 3H4V1.75ZM3.5 6v6.5h9V6h-9Z" />
      </svg>
      {formatDate(deadline)}
      {showRelative && !done && <span className="opacity-80">· {deadlineText(deadline)}</span>}
    </span>
  );
}
