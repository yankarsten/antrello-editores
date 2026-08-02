"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { formatFileSize } from "@/lib/format";

const ALLOWED = ["mp4", "mov", "mkv", "webm", "avi"];
const ACCEPT = ALLOWED.map((e) => `.${e}`).join(",");

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

export interface UploadDropzoneHandle {
  /** Uploads all pending files to the endpoint; resolves true if all succeeded. */
  upload(endpoint: string, extraHeaders?: Record<string, string>): Promise<boolean>;
  hasFiles(): boolean;
}

interface Props {
  multiple?: boolean;
  /** When set, files start uploading as soon as they are selected. */
  endpoint?: string;
  extraHeaders?: Record<string, string>;
  onAllDone?: () => void;
}

// Each request body must stay under Cloudflare's 100 MB proxy limit, so files
// are sent as a sequence of chunks this size. The server reassembles them.
const CHUNK_SIZE = 90 * 1024 * 1024;

/** POSTs a single chunk (raw body) and reports bytes-sent for this chunk. */
function sendChunk(
  blob: Blob,
  endpoint: string,
  headers: Record<string, string>,
  onChunkProgress: (loaded: number) => void
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onChunkProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true });
      } else {
        let message = "Falha no envio.";
        try {
          message = JSON.parse(xhr.responseText).error ?? message;
        } catch {}
        resolve({ ok: false, error: message });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Falha de conexão durante o envio." });
    xhr.send(blob);
  });
}

/** Uploads a file as ordered <100 MB chunks so the server can stream each part
 * straight to disk, with real aggregate progress across the whole file. */
async function uploadFile(
  entry: FileEntry,
  endpoint: string,
  extraHeaders: Record<string, string>,
  onProgress: (pct: number) => void
): Promise<{ ok: boolean; error?: string }> {
  const { file } = entry;
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const baseHeaders: Record<string, string> = {
    "x-file-name": encodeURIComponent(file.name),
    "x-upload-id": crypto.randomUUID(),
    "x-total-chunks": String(totalChunks),
  };
  for (const [k, v] of Object.entries(extraHeaders)) {
    baseHeaders[k] = encodeURIComponent(v);
  }

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
    const result = await sendChunk(
      chunk,
      endpoint,
      { ...baseHeaders, "x-chunk-index": String(i) },
      (loaded) => {
        const pct = file.size > 0 ? Math.round(((start + loaded) / file.size) * 100) : 100;
        onProgress(Math.min(100, pct));
      }
    );
    if (!result.ok) return result;
  }
  return { ok: true };
}

const UploadDropzone = forwardRef<UploadDropzoneHandle, Props>(function UploadDropzone(
  { multiple = true, endpoint, extraHeaders, onAllDone },
  ref
) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const entriesRef = useRef<FileEntry[]>(entries);
  entriesRef.current = entries;

  const updateEntry = useCallback((file: File, patch: Partial<FileEntry>) => {
    setEntries((prev) => prev.map((e) => (e.file === file ? { ...e, ...patch } : e)));
  }, []);

  const runUpload = useCallback(
    async (target: string, headers?: Record<string, string>, only?: FileEntry[]) => {
      const list = (only ?? entriesRef.current).filter(
        (e) => e.status === "pending" || e.status === "error"
      );
      let allOk = true;
      for (const entry of list) {
        updateEntry(entry.file, { status: "uploading", progress: 0, error: undefined });
        const result = await uploadFile(entry, target, headers ?? {}, (pct) =>
          updateEntry(entry.file, { progress: pct })
        );
        if (result.ok) {
          updateEntry(entry.file, { status: "done", progress: 100 });
        } else {
          allOk = false;
          updateEntry(entry.file, { status: "error", error: result.error });
        }
      }
      if (allOk && list.length > 0) onAllDone?.();
      return allOk;
    },
    [onAllDone, updateEntry]
  );

  useImperativeHandle(ref, () => ({
    upload: (target, headers) => runUpload(target, headers),
    hasFiles: () => entriesRef.current.some((e) => e.status !== "done"),
  }));

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const bad = incoming.filter(
        (f) => !ALLOWED.includes(f.name.split(".").pop()?.toLowerCase() ?? "")
      );
      const good = incoming.filter((f) => !bad.includes(f));
      setRejected(bad.map((f) => f.name));
      if (good.length === 0) return;
      const picked = multiple ? good : [good[0]];
      const newEntries: FileEntry[] = picked.map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }));
      setEntries((prev) => (multiple ? [...prev, ...newEntries] : newEntries));
      if (endpoint) {
        // Immediate mode: fire the upload right after selection.
        setTimeout(() => runUpload(endpoint, extraHeaders, newEntries), 0);
      }
    },
    [endpoint, extraHeaders, multiple, runUpload]
  );

  function removeEntry(file: File) {
    setEntries((prev) => prev.filter((e) => e.file !== file));
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? "border-indigo-500 bg-indigo-50"
            : "border-zinc-300 bg-zinc-50 hover:border-indigo-400 hover:bg-indigo-50/50"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-indigo-500" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
        <p className="text-sm font-medium text-zinc-700">
          {multiple ? "Arraste os vídeos aqui ou clique para selecionar" : "Arraste o vídeo aqui ou clique para selecionar"}
        </p>
        <p className="text-xs text-zinc-500">Formatos aceitos: MP4, MOV, MKV, WEBM, AVI</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Formato não suportado: {rejected.join(", ")}
        </p>
      )}

      {entries.length > 0 && (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={`${entry.file.name}-${entry.file.size}-${entry.file.lastModified}`} className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-800">{entry.file.name}</p>
                  <p className="text-xs text-zinc-500">{formatFileSize(entry.file.size)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {entry.status === "done" && (
                    <span className="text-xs font-medium text-emerald-600">Enviado ✓</span>
                  )}
                  {entry.status === "uploading" && (
                    <span className="text-xs font-medium text-indigo-600">{entry.progress}%</span>
                  )}
                  {entry.status === "error" && (
                    <span className="text-xs font-medium text-red-600">{entry.error ?? "Erro"}</span>
                  )}
                  {entry.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.file)}
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
              {(entry.status === "uploading" || entry.status === "done") && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all ${entry.status === "done" ? "bg-emerald-500" : "bg-indigo-500"}`}
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default UploadDropzone;
