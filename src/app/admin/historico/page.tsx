import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime, formatFileSize } from "@/lib/format";

export const dynamic = "force-dynamic";

interface HistoryEntry {
  id: string;
  kind: "source" | "delivery";
  title: string;
  fileName: string;
  size: number;
  uploadedAt: Date;
  projectId: string;
  projectTitle: string;
  uploaderName: string;
}

export default async function HistoryPage() {
  const [sources, deliveries] = await Promise.all([
    db.sourceVideo.findMany({
      include: { project: { select: { id: true, title: true } } },
      orderBy: { uploadedAt: "desc" },
    }),
    db.deliveryVideo.findMany({
      include: {
        project: { select: { id: true, title: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const entries: HistoryEntry[] = [
    ...sources.map((v) => ({
      id: v.id,
      kind: "source" as const,
      title: "Vídeo bruto",
      fileName: v.fileName,
      size: v.size,
      uploadedAt: v.uploadedAt,
      projectId: v.project.id,
      projectTitle: v.project.title,
      uploaderName: "Administração",
    })),
    ...deliveries.map((v) => ({
      id: v.id,
      kind: "delivery" as const,
      title: v.label,
      fileName: v.fileName,
      size: v.size,
      uploadedAt: v.uploadedAt,
      projectId: v.project.id,
      projectTitle: v.project.title,
      uploaderName: v.uploadedBy?.name ?? "Editor removido",
    })),
  ].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold text-zinc-900">Histórico de vídeos</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        Todos os vídeos enviados na plataforma, do mais recente para o mais antigo.
      </p>

      {entries.length === 0 ? (
        <p className="card mt-6 px-4 py-10 text-center text-sm text-zinc-500">
          Nenhum vídeo enviado ainda.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {entries.map((entry) => (
            <li key={`${entry.kind}-${entry.id}`} className="card flex flex-wrap items-center gap-3 px-4 py-3">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  entry.kind === "delivery"
                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                    : "bg-sky-100 text-sky-700 ring-sky-200"
                }`}
              >
                {entry.kind === "delivery" ? "Entrega" : "Bruto"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">{entry.title}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {entry.fileName} · {formatFileSize(entry.size)} · por {entry.uploaderName} ·{" "}
                  {formatDateTime(entry.uploadedAt)}
                </p>
              </div>
              <Link
                href={`/admin/projects/${entry.projectId}`}
                className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
              >
                {entry.projectTitle}
              </Link>
              <a
                href={`/api/videos/${entry.kind}/${entry.id}?download=1`}
                className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs"
                download
              >
                Baixar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
