"use client";

import { useState } from "react";
import { formatDateTime, formatFileSize } from "@/lib/format";
import type { MediaKind } from "@/lib/media";

export interface FileItem {
  id: string;
  /** Which table the file lives in — also the API path segment. */
  type: "source" | "delivery" | "attachment";
  /** How to preview it. Defaults to "video". */
  kind?: MediaKind;
  fileName: string;
  size: number;
  uploadedAt: string;
  label?: string;
  uploaderName?: string;
}

function FileRow({ file }: { file: FileItem }) {
  const [open, setOpen] = useState(false);
  const isImage = file.kind === "image";
  const src = `/api/files/${file.type}/${file.id}`;

  return (
    <li className="overflow-hidden rounded-control border border-ink bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {isImage && (
          /* next/image is not an option here: the file sits behind an
             authenticated route, and the optimizer needs a fetchable URL. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-10 w-14 shrink-0 rounded-[4px] border border-ink object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.label ?? file.fileName}</p>
          <p className="mt-0.5 truncate text-xs text-ink/60">
            {file.label && <span>{file.fileName} · </span>}
            {formatFileSize(file.size)}
            {file.uploaderName && <span> · enviado por {file.uploaderName}</span>}
            <span> · {formatDateTime(file.uploadedAt)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setOpen((o) => !o)} className="btn-secondary !px-3 !py-1.5 text-xs">
            {open ? "Fechar" : isImage ? "Ver" : "Assistir"}
          </button>
          <a href={`${src}?download=1`} className="btn-accent !px-3 !py-1.5 text-xs" download>
            Baixar
          </a>
        </div>
      </div>
      {open && (
        <div className="border-t border-ink bg-ink">
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element -- see above */
            <img src={src} alt={file.fileName} className="mx-auto max-h-[420px] w-auto max-w-full" />
          ) : (
            <video src={src} controls autoPlay className="mx-auto max-h-[420px] w-full" />
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Lists a project's files. `maxVisible` caps how many rows are shown at rest:
 * a video with dozens of raw uploads would otherwise push everything after it
 * (the anexos, the editor's deliveries) far below the fold.
 */
export default function FileList({
  files,
  emptyText,
  maxVisible,
}: {
  files: FileItem[];
  emptyText: string;
  maxVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (files.length === 0) {
    return <p className="card-empty">{emptyText}</p>;
  }

  const collapsible = maxVisible !== undefined && files.length > maxVisible;
  const visible = collapsible && !expanded ? files.slice(0, maxVisible) : files;

  return (
    <div>
      <ul className="space-y-2">
        {visible.map((f) => (
          <FileRow key={f.id} file={f} />
        ))}
      </ul>
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="btn-secondary mt-2 w-full !py-2 text-xs"
        >
          {expanded
            ? `Mostrar menos (${maxVisible} de ${files.length})`
            : `Mostrar todos os ${files.length} arquivos`}
        </button>
      )}
    </div>
  );
}
