"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NewProjectForm from "@/components/NewProjectForm";
import { STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import type { EditorOption } from "@/lib/editors";
import { formatDate } from "@/lib/format";

/**
 * Modal wrapper around the create-project form, opened from the "+" buttons on
 * the board and the calendar. Mount it only while it is open — remounting is
 * what resets the form between openings.
 */
export default function NewProjectDialog({
  editors,
  status,
  day,
  onClose,
}: {
  editors: EditorOption[];
  /** Board column the "+" was clicked in, if any. */
  status?: ProjectStatus;
  /** "YYYY-MM-DD" of the calendar day the "+" was clicked in, if any. */
  day?: string;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    // Keep the page behind the overlay from scrolling along with the dialog.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const context = [
    status ? STATUS_LABELS[status] : null,
    day ? `entrega em ${formatDate(`${day}T12:00:00`)}` : null,
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
      onMouseDown={onClose}
    >
      <div
        className="mx-auto w-full max-w-2xl rounded-panel border border-ink bg-white shadow-hard"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/15 px-6 py-5 sm:px-8">
          <div>
            <h2 id="new-project-title" className="text-2xl font-medium leading-tight">
              <span className="pill">Novo vídeo</span>
            </h2>
            {context.length > 0 && (
              <p className="mt-2 text-sm text-ink/70">{context.join(" · ")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink bg-white transition hover:bg-ink hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <NewProjectForm
            editors={editors}
            status={status}
            defaultDeadline={day ?? ""}
            onCancel={onClose}
            onCreated={() => {
              onClose();
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}
