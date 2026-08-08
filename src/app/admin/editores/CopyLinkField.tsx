"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyLinkField({ url, className = "" }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access is blocked on insecure origins; the input below is
      // selectable, so the admin can still copy by hand.
      return;
    }
    setCopied(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex flex-col gap-2 sm:flex-row ${className}`}>
      <input
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="input flex-1 bg-white font-mono text-xs"
      />
      <button type="button" onClick={copy} className="btn-secondary shrink-0 whitespace-nowrap">
        {copied ? "Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
