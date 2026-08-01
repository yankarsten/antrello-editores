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
