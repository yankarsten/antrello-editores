"use client";

import { useState } from "react";
import { formatDateTime, formatFileSize } from "@/lib/format";

export interface VideoItem {
  id: string;
  type: "source" | "delivery";
  fileName: string;
  size: number;
  uploadedAt: string;
  label?: string;
  uploaderName?: string;
}

function VideoRow({ video }: { video: VideoItem }) {
  const [playing, setPlaying] = useState(false);
  const src = `/api/videos/${video.type}/${video.id}`;

  return (
    <li className="overflow-hidden rounded-control border border-ink bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{video.label ?? video.fileName}</p>
          <p className="mt-0.5 truncate text-xs text-ink/60">
            {video.label && <span>{video.fileName} · </span>}
            {formatFileSize(video.size)}
            {video.uploaderName && <span> · enviado por {video.uploaderName}</span>}
            <span> · {formatDateTime(video.uploadedAt)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setPlaying((p) => !p)} className="btn-secondary !px-3 !py-1.5 text-xs">
            {playing ? "Fechar" : "Assistir"}
          </button>
          <a href={`${src}?download=1`} className="btn-accent !px-3 !py-1.5 text-xs" download>
            Baixar
          </a>
        </div>
      </div>
      {playing && (
        <div className="border-t border-ink bg-ink">
          <video src={src} controls autoPlay className="mx-auto max-h-[420px] w-full" />
        </div>
      )}
    </li>
  );
}

export default function VideoList({ videos, emptyText }: { videos: VideoItem[]; emptyText: string }) {
  if (videos.length === 0) {
    return <p className="card-empty">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {videos.map((v) => (
        <VideoRow key={v.id} video={v} />
      ))}
    </ul>
  );
}
