"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { STATUSES, STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import DeadlineBadge from "@/components/DeadlineBadge";

export interface BoardProject {
  id: string;
  title: string;
  status: string;
  deadline: string;
  editorName: string | null;
  deliveryCount: number;
}

const COLUMN_ACCENT: Record<ProjectStatus, string> = {
  novo: "border-t-sky-400",
  em_edicao: "border-t-violet-400",
  em_revisao: "border-t-amber-400",
  concluido: "border-t-emerald-400",
};

export default function KanbanBoard({ initialProjects }: { initialProjects: BoardProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState<string | null>(null);

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
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const cards = projects.filter((p) => p.status === status);
            return (
              <div key={status} className={`card border-t-4 ${COLUMN_ACCENT[status]} flex min-h-[280px] flex-col`}>
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <h2 className="text-sm font-semibold text-zinc-700">{STATUS_LABELS[status]}</h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                    {cards.length}
                  </span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 px-3 pb-3 transition-colors ${
                        snapshot.isDraggingOver ? "rounded-b-xl bg-indigo-50/70" : ""
                      }`}
                    >
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <p className="px-1 py-4 text-center text-xs text-zinc-400">
                          Nenhum projeto aqui.
                        </p>
                      )}
                      {cards.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow ${
                                dragSnapshot.isDragging ? "shadow-lg ring-2 ring-indigo-400" : "hover:shadow"
                              }`}
                            >
                              <Link
                                href={`/admin/projects/${project.id}`}
                                className="block text-sm font-semibold text-zinc-800 hover:text-indigo-600"
                              >
                                {project.title}
                              </Link>
                              <p className="mt-1 text-xs text-zinc-500">
                                {project.editorName ?? "Sem editor atribuído"}
                                {project.deliveryCount > 0 && (
                                  <span>
                                    {" · "}
                                    {project.deliveryCount}{" "}
                                    {project.deliveryCount === 1 ? "entrega" : "entregas"}
                                  </span>
                                )}
                              </p>
                              <div className="mt-2">
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
    </div>
  );
}
