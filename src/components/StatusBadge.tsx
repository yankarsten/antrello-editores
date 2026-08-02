import { DEFAULT_STATUS, STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { STATUS_FILL } from "@/lib/status-ui";

export default function StatusBadge({ status }: { status: string }) {
  const s = (status in STATUS_FILL ? status : DEFAULT_STATUS) as ProjectStatus;
  return <span className={`chip ${STATUS_FILL[s]}`}>{STATUS_LABELS[s]}</span>;
}
