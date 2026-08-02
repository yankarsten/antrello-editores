// Local-disk file storage for uploaded videos.
// TODO: swap these helpers for real object storage (S3/R2/GCS) — every disk
// touch in the app goes through this module, so the swap is contained here.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const STORAGE_DIR = path.join(process.cwd(), "storage");

export const ALLOWED_EXTENSIONS = ["mp4", "mov", "mkv", "webm", "avi"];

export const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  webm: "video/webm",
  avi: "video/x-msvideo",
};

export function extensionOf(fileName: string): string {
  return path.extname(fileName).slice(1).toLowerCase();
}

export function isAllowedVideo(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extensionOf(fileName));
}

export function contentTypeFor(fileName: string): string {
  return CONTENT_TYPES[extensionOf(fileName)] ?? "application/octet-stream";
}

/**
 * Streams a request body to disk without buffering it in memory,
 * so multi-GB uploads work. Returns the generated stored name and byte size.
 */
export async function saveStream(
  body: ReadableStream<Uint8Array>,
  originalName: string
): Promise<{ storedName: string; size: number }> {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${extensionOf(originalName)}`;
  const filePath = path.join(STORAGE_DIR, storedName);
  const nodeStream = Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>);
  try {
    await pipeline(nodeStream, fs.createWriteStream(filePath));
  } catch (err) {
    fs.rmSync(filePath, { force: true });
    throw err;
  }
  return { storedName, size: fs.statSync(filePath).size };
}

// Chunked uploads: big videos arrive as a sequence of <100 MB parts (so they
// fit under Cloudflare's proxied request-body limit). Parts are appended to a
// temp file keyed by uploadId, then finalized into STORAGE_DIR on the last one.
const TMP_DIR = path.join(STORAGE_DIR, "tmp");
const UPLOAD_ID_RE = /^[0-9a-fA-F-]{8,64}$/;
const STALE_PART_MS = 24 * 60 * 60 * 1000;

function sweepStaleParts(): void {
  try {
    const now = Date.now();
    for (const f of fs.readdirSync(TMP_DIR)) {
      if (!f.endsWith(".part")) continue;
      const p = path.join(TMP_DIR, f);
      if (now - fs.statSync(p).mtimeMs > STALE_PART_MS) fs.rmSync(p, { force: true });
    }
  } catch {
    // best-effort cleanup; never block an upload on it
  }
}

/**
 * Appends one chunk of a chunked upload to its temp part file. On the final
 * chunk, renames the assembled file into STORAGE_DIR and returns its stored
 * name + size. Chunks must arrive in order (the client uploads them serially).
 */
export async function saveChunk(opts: {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  originalName: string;
  body: ReadableStream<Uint8Array>;
}): Promise<{ done: boolean; storedName?: string; size?: number }> {
  const { uploadId, chunkIndex, totalChunks, originalName, body } = opts;
  if (!UPLOAD_ID_RE.test(uploadId)) throw new Error("invalid upload id");
  if (
    !Number.isInteger(chunkIndex) ||
    !Number.isInteger(totalChunks) ||
    totalChunks < 1 ||
    chunkIndex < 0 ||
    chunkIndex >= totalChunks
  ) {
    throw new Error("invalid chunk metadata");
  }

  fs.mkdirSync(TMP_DIR, { recursive: true });
  const partPath = path.join(TMP_DIR, `${uploadId}.part`);

  if (chunkIndex === 0) {
    sweepStaleParts();
  } else if (!fs.existsSync(partPath)) {
    throw new Error("missing previous chunks; restart the upload");
  }

  const nodeStream = Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>);
  // First chunk truncates ("w"), the rest append ("a").
  const writeStream = fs.createWriteStream(partPath, { flags: chunkIndex === 0 ? "w" : "a" });
  await pipeline(nodeStream, writeStream);

  if (chunkIndex < totalChunks - 1) {
    return { done: false };
  }

  // Last chunk: promote the assembled part file to a permanent stored file.
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${extensionOf(originalName)}`;
  const finalPath = path.join(STORAGE_DIR, storedName);
  fs.renameSync(partPath, finalPath);
  return { done: true, storedName, size: fs.statSync(finalPath).size };
}

export function storedFilePath(storedName: string): string {
  // Guard against path traversal — storedName must stay inside STORAGE_DIR.
  const filePath = path.join(STORAGE_DIR, path.basename(storedName));
  return filePath;
}

export function storedFileSize(storedName: string): number | null {
  const filePath = storedFilePath(storedName);
  return fs.existsSync(filePath) ? fs.statSync(filePath).size : null;
}

export function createReadStream(storedName: string, start?: number, end?: number) {
  return fs.createReadStream(storedFilePath(storedName), start !== undefined ? { start, end } : undefined);
}

export function deleteStoredFile(storedName: string): void {
  fs.rmSync(storedFilePath(storedName), { force: true });
}
