"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { DEFAULT_STATUS, STATUSES, STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { STATUS_FILL } from "@/lib/status-ui";
import { compareDeadlines, type SortDirection } from "@/lib/format";
import DeadlineBadge from "@/components/DeadlineBadge";
import NewProjectDialog from "@/components/NewProjectDialog";
import type { EditorOption } from "@/lib/editors";

export interface BoardProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  /** null when the video has no prazo yet. */
  deadline: string | null;
  editorName: string | null;
  deliveryCount: number;
}

export default function KanbanBoard({
  initialProjects,
  editors,
  canCreate = false,
}: {
  initialProjects: BoardProject[];
  editors: EditorOption[];
  /** Admins only: shows the per-column "+" that creates a project. */
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState<string | null>(null);
  const [newIn, setNewIn] = useState<ProjectStatus | null>(null);
  // Farthest prazo first by default; the toggle flips it.
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // A project created in the dialog arrives through a router.refresh(), which
  // re-renders the server page and hands us a fresh list to adopt.
  useEffect(() => setProjects(initialProjects), [initialProjects]);

  // Arriving at the board — from another section, the browser's back button or
  // another browser tab — re-reads the server instead of trusting the cached
  // RSC payload, which may predate a status change made somewhere else.
  useEffect(() => {
    router.refresh();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router]);

  // Cards are ordered by prazo, never by where they were dropped, so a column
  // reads the same whether it was just rearranged or freshly loaded.
  const cardsByStatus = useMemo(() => {
    const sorted = [...projects].sort((a, b) => compareDeadlines(a.deadline, b.deadline, sortDirection));
    return new Map(STATUSES.map((status) => [status, sorted.filter((p) => p.status === status)]));
  }, [projects, sortDirection]);

  async function onDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    // Only the column matters — the order inside it belongs to the prazo sort.
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as ProjectStatus;
    const previous = projects;

    // Optimistic move: restatus the card locally, then persist.
    setProjects((prev) => prev.map((p) => (p.id === draggableId ? { ...p, status: newStatus } : p)));

    setError(null);
    const res = await fetch(`/api/projects/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setProjects(previous);
      setError("Não foi possível mover o vídeo. Tente novamente.");
      return;
    }

    // The move is now server state: refreshing drops the cached RSC payload of
    // this page (and of the calendar), so coming back to the tab doesn't show
    // the card in the column it left.
    router.refresh();
  }

  return (
    <div>
      {error && <p className="alert-error mb-4">{error}</p>}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setSortDirection((dir) => (dir === "desc" ? "asc" : "desc"))}
          aria-pressed={sortDirection === "asc"}
          title={
            sortDirection === "desc"
              ? "Ordenar do prazo mais próximo para o mais distante"
              : "Ordenar do prazo mais distante para o mais próximo"
          }
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          Prazo{" "}
          <span aria-hidden className="font-medium">
            {sortDirection === "desc" ? "↓" : "↑"}
          </span>{" "}
          <span className="text-ink/60">
            {sortDirection === "desc" ? "mais distante primeiro" : "mais próximo primeiro"}
          </span>
        </button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Four columns only fit side by side on a wide screen; below that they
            pair up rather than shrinking into unreadable strips. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const cards = cardsByStatus.get(status) ?? [];
            return (
              <div key={status} className="card-mist flex min-h-[300px] flex-col">
                <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-5">
                  <h2 className={`chip ${STATUS_FILL[status]}`}>{STATUS_LABELS[status]}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink/60">{cards.length}</span>
                    {/* Only the starting column creates projects — nothing is
                        born already delivered. */}
                    {canCreate && status === DEFAULT_STATUS && (
                      <button
                        type="button"
                        onClick={() => setNewIn(status)}
                        title="Novo vídeo"
                        aria-label={`Novo vídeo em ${STATUS_LABELS[status]}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink bg-white transition hover:bg-accent focus:outline-none focus:ring-4 focus:ring-accent/70"
                      >
                        <PlusIcon />
                      </button>
                    )}
                  </div>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 px-4 pb-5 transition-colors ${
                        snapshot.isDraggingOver ? "rounded-b-panel bg-accent/50" : ""
                      }`}
                    >
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <p className="px-1 py-6 text-center text-xs text-ink/50">Nenhum vídeo aqui.</p>
                      )}
                      {cards.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            // The card opens the project; dragging lives in the
                            // grip on the right, so a click never has to
                            // compete with a drag.
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`flex items-stretch overflow-hidden rounded-control border border-ink bg-white transition-shadow ${
                                dragSnapshot.isDragging ? "shadow-hard" : "hover:shadow-hard-sm"
                              }`}
                            >
                              <Link
                                href={`/admin/projects/${project.id}`}
                                className="min-w-0 flex-1 p-4 transition hover:bg-mist focus:outline-none focus:ring-4 focus:ring-inset focus:ring-accent/70"
                              >
                                <span className="block text-sm font-medium text-ink">{project.title}</span>
                                {/* The briefing, set apart from the card's own
                                    facts (editor, entregas) by the rule and the
                                    italic — it is the video's own words. One
                                    line only: the rest is on the video page. */}
                                {project.description && (
                                  <span
                                    title={project.description}
                                    className="mt-1.5 block truncate border-l-2 border-ink/20 pl-2 text-xs italic leading-relaxed text-ink/55"
                                  >
                                    {project.description}
                                  </span>
                                )}
                                <span className="mt-1.5 block text-xs text-ink/60">
                                  {project.editorName ?? "Sem editor atribuído"}
                                  {project.deliveryCount > 0 && (
                                    <span>
                                      {" · "}
                                      {project.deliveryCount}{" "}
                                      {project.deliveryCount === 1 ? "entrega" : "entregas"}
                                    </span>
                                  )}
                                </span>
                                <span className="mt-3 block">
                                  <DeadlineBadge deadline={project.deadline} status={project.status} showRelative={false} />
                                </span>
                              </Link>
                              <div
                                {...dragProvided.dragHandleProps}
                                title="Arraste para mover o vídeo"
                                aria-label={`Arrastar ${project.title}`}
                                className="flex shrink-0 cursor-grab items-center border-l border-ink/20 px-2.5 text-ink/40 transition hover:bg-mist hover:text-ink focus:outline-none focus:ring-4 focus:ring-inset focus:ring-accent/70 active:cursor-grabbing"
                              >
                                <GripIcon />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {newIn && (
        <NewProjectDialog editors={editors} status={newIn} onClose={() => setNewIn(null)} />
      )}
    </div>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" d="M3 4.5h10M3 8h10M3 11.5h10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
