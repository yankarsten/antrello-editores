import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

/** Bytes per chunk on the client. Must stay < 100 MB so each request fits
 * under Cloudflare's proxied request-body limit. Kept here for reference; the
 * client (UploadDropzone) holds the authoritative copy. */
export const CHUNK_SIZE = 90 * 1024 * 1024;

export interface ChunkMeta {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
}

/** Reads the chunk headers a chunked upload sends. Falls back to a single
 * whole-file chunk when the headers are absent (older/non-chunked clients). */
export function readChunkMeta(request: NextRequest): ChunkMeta {
  const uploadId = (request.headers.get("x-upload-id") ?? "").trim() || randomUUID();
  const chunkIndex = Number.parseInt(request.headers.get("x-chunk-index") ?? "0", 10);
  const totalChunks = Number.parseInt(request.headers.get("x-total-chunks") ?? "1", 10);
  return {
    uploadId,
    chunkIndex: Number.isNaN(chunkIndex) ? 0 : chunkIndex,
    totalChunks: Number.isNaN(totalChunks) ? 1 : totalChunks,
  };
}
