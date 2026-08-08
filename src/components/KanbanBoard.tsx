"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { DEFAULT_STATUS, STATUSES, STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { STATUS_FILL } from "@/lib/status-ui";
import DeadlineBadge from "@/components/DeadlineBadge";
import NewProjectDialog from "@/components/NewProjectDialog";
import type { EditorOption } from "@/components/NewProjectForm";

export interface BoardProject {
  id: string;
  title: string;
  status: string;
  deadline: string;
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
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState<string | null>(null);
  const [newIn, setNewIn] = useState<ProjectStatus | null>(null);

  // A project created in the dialog arrives through a router.refresh(), which
  // re-renders the server page and hands us a fresh list to adopt.
  useEffect(() => setProjects(initialProjects), [initialProjects]);

  async function onDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ProjectStatus;
    const previous = projects;

    // Optimistic move: reposition the card locally, then persist.
    setProjects((prev) => {
      const moved = prev.find((p) => p.id === draggableId);
      if (!moved) return prev;
      const rest = prev.filter((p) => p.id !== draggableId);
      const destCards = rest.filter((p) => p.status === newStatus);
      const insertAfter = destCards[destination.index - 1] ?? null;
      const updated = { ...moved, status: newStatus };
      const idx = insertAfter ? rest.indexOf(insertAfter) + 1 : rest.findIndex((p) => p.status === newStatus);
      const at = idx === -1 ? rest.length : idx;
      return [...rest.slice(0, at), updated, ...rest.slice(at)];
    });

    setError(null);
    const res = await fetch(`/api/projects/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setProjects(previous);
      setError("Não foi possível mover o projeto. Tente novamente.");
    }
  }

  return (
    <div>
      {error && <p className="alert-error mb-4">{error}</p>}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {STATUSES.map((status) => {
            const cards = projects.filter((p) => p.status === status);
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
                        title="Novo projeto"
                        aria-label={`Novo projeto em ${STATUS_LABELS[status]}`}
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
                        <p className="px-1 py-6 text-center text-xs text-ink/50">Nenhum projeto aqui.</p>
                      )}
                      {cards.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`rounded-control border border-ink bg-white p-4 transition-shadow ${
                                dragSnapshot.isDragging ? "shadow-hard" : "hover:shadow-hard-sm"
                              }`}
                            >
                              <Link
                                href={`/admin/projects/${project.id}`}
                                className="block text-sm font-medium text-ink hover:underline"
                              >
                                {project.title}
                              </Link>
                              <p className="mt-1 text-xs text-ink/60">
                                {project.editorName ?? "Sem editor atribuído"}
                                {project.deliveryCount > 0 && (
                                  <span>
                                    {" · "}
                                    {project.deliveryCount}{" "}
                                    {project.deliveryCount === 1 ? "entrega" : "entregas"}
                                  </span>
                                )}
                              </p>
                              <div className="mt-3">
                                <DeadlineBadge deadline={project.deadline} status={project.status} showRelative={false} />
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
