/**
 * What counts as an uploadable file and how it is labelled/served.
 *
 * Kept free of node built-ins on purpose: the upload dropzone (a client
 * component) validates against the very same lists the API routes enforce.
 */

export const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "webm", "avi"];

// Web-renderable raster formats only. SVG is deliberately absent: it is served
// from our own origin, and an SVG can carry script.
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif"];

/** Anexos take both — reference clips and stills/briefings alike. */
export const ATTACHMENT_EXTENSIONS = [...VIDEO_EXTENSIONS, ...IMAGE_EXTENSIONS];

export type MediaKind = "video" | "image";

export const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  webm: "video/webm",
  avi: "video/x-msvideo",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

export function extensionOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  // `dot > 0` so ".gitignore" is a name without an extension, not an extension.
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function isAllowedVideo(fileName: string): boolean {
  return VIDEO_EXTENSIONS.includes(extensionOf(fileName));
}

export function isAllowedImage(fileName: string): boolean {
  return IMAGE_EXTENSIONS.includes(extensionOf(fileName));
}

export function isAllowedAttachment(fileName: string): boolean {
  return ATTACHMENT_EXTENSIONS.includes(extensionOf(fileName));
}

/** How the file should be previewed. Videos are the fallback. */
export function mediaKind(fileName: string): MediaKind {
  return isAllowedImage(fileName) ? "image" : "video";
}

export function contentTypeFor(fileName: string): string {
  return CONTENT_TYPES[extensionOf(fileName)] ?? "application/octet-stream";
}

/** "mp4, mov" -> "MP4, MOV" for the hints shown next to a file picker. */
export function formatExtensions(extensions: string[]): string {
  return extensions.map((e) => e.toUpperCase()).join(", ");
}
