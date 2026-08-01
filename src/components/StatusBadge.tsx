import { STATUS_LABELS, type ProjectStatus } from "@/lib/constants";

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  novo: "bg-sky-100 text-sky-700 ring-sky-200",
  em_edicao: "bg-violet-100 text-violet-700 ring-violet-200",
  em_revisao: "bg-amber-100 text-amber-700 ring-amber-200",
  concluido: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = (status in STATUS_CLASSES ? status : "novo") as ProjectStatus;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[s]}`}
    >
      {STATUS_LABELS[s]}
    </span>
  );
}
