"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export interface CalendarProject {
  id: string;
  title: string;
  status: string;
  /** Deadline already reduced to a "YYYY-MM-DD" key in the app's timezone. */
  day: string;
  editorId: string | null;
  editorName: string | null;
  deliveryCount: number;
}

export interface CalendarEditor {
  id: string;
  name: string;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const CHIP_CLASSES: Record<ProjectStatus, string> = {
  novo: "bg-sky-50 text-sky-800 ring-sky-200 hover:bg-sky-100",
  em_edicao: "bg-violet-50 text-violet-800 ring-violet-200 hover:bg-violet-100",
  em_revisao: "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100",
  concluido: "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100",
};

const DOT_CLASSES: Record<ProjectStatus, string> = {
  novo: "bg-sky-400",
  em_edicao: "bg-violet-400",
  em_revisao: "bg-amber-400",
  concluido: "bg-emerald-400",
};

const monthTitleFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function statusOf(status: string): ProjectStatus {
  return (status in STATUS_LABELS ? status : "novo") as ProjectStatus;
}

/** "YYYY-MM-DD" from a locally-built date — mirrors lib/format's dayKey shape. */
function localKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Whole weeks (Sunday-first) covering the given month. */
function buildWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;

  const weeks: Date[][] = [];
  for (let i = 0; i < cellCount; i += 7) {
    weeks.push(
      Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i + d))
    );
  }
  return weeks;
}

export default function ProjectCalendar({
  projects,
  editors,
  todayKey,
}: {
  projects: CalendarProject[];
  editors: CalendarEditor[];
  todayKey: string;
}) {
  const [year, setYear] = useState(() => Number(todayKey.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(todayKey.slice(5, 7)) - 1);
  const [editorFilter, setEditorFilter] = useState("all");
  const [hideDone, setHideDone] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      projects.filter((p) => {
        if (hideDone && p.status === "concluido") return false;
        if (editorFilter === "all") return true;
        if (editorFilter === "none") return p.editorId === null;
        return p.editorId === editorFilter;
      }),
    [projects, editorFilter, hideDone]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarProject[]>();
    for (const project of visible) {
      const list = map.get(project.day);
      if (list) list.push(project);
      else map.set(project.day, [project]);
    }
    for (const list of map.values()) list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    return map;
  }, [visible]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthProjects = useMemo(
    () =>
      visible
        .filter((p) => p.day.startsWith(monthPrefix))
        .sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title, "pt-BR")),
    [visible, monthPrefix]
  );

  const listed = selectedDay ? (byDay.get(selectedDay) ?? []) : monthProjects;

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDay(null);
  }

  function goToToday() {
    setYear(Number(todayKey.slice(0, 4)));
    setMonth(Number(todayKey.slice(5, 7)) - 1);
    setSelectedDay(todayKey);
  }

  return (
    <div>
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => shiftMonth(-1)} className="btn-secondary !px-3 !py-1.5 text-xs" aria-label="Mês anterior">
              ‹
            </button>
            <h2 className="min-w-[10.5rem] text-center text-sm font-semibold capitalize text-zinc-800">
              {monthTitleFormatter.format(new Date(year, month, 15))}
            </h2>
            <button type="button" onClick={() => shiftMonth(1)} className="btn-secondary !px-3 !py-1.5 text-xs" aria-label="Próximo mês">
              ›
            </button>
            <button type="button" onClick={goToToday} className="btn-secondary !px-3 !py-1.5 text-xs">
              Hoje
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
              />
              Ocultar concluídos
            </label>
            <select
              className="input !w-auto !py-1.5 text-xs"
              value={editorFilter}
              onChange={(e) => setEditorFilter(e.target.value)}
              aria-label="Filtrar por editor"
            >
              <option value="all">Todos os editores</option>
              <option value="none">Sem editor atribuído</option>
              {editors.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[46rem]">
            <div className="grid grid-cols-7 gap-px border-b border-zinc-200 pb-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-px grid grid-cols-7 gap-px bg-zinc-200">
              {weeks.flat().map((date) => {
                const key = localKey(date);
                const inMonth = date.getMonth() === month;
                const isToday = key === todayKey;
                const isSelected = key === selectedDay;
                const dayProjects = byDay.get(key) ?? [];
                const shown = dayProjects.slice(0, 3);

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={`flex min-h-[6.5rem] flex-col gap-1 p-1.5 text-left transition ${
                      inMonth ? "bg-white" : "bg-zinc-50"
                    } ${isSelected ? "ring-2 ring-inset ring-indigo-500" : "hover:bg-indigo-50/60"}`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                        isToday
                          ? "bg-indigo-600 font-semibold text-white"
                          : inMonth
                            ? "text-zinc-600"
                            : "text-zinc-400"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {shown.map((project) => {
                      const overdue = project.status !== "concluido" && project.day < todayKey;
                      return (
                        <span
                          key={project.id}
                          title={`${project.title} — ${project.editorName ?? "Sem editor atribuído"} (${STATUS_LABELS[statusOf(project.status)]})`}
                          className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] leading-tight ring-1 ring-inset ${
                            CHIP_CLASSES[statusOf(project.status)]
                          } ${overdue ? "!ring-red-400" : ""}`}
                        >
                          {overdue && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
                          <span className="truncate">{project.title}</span>
                        </span>
                      );
                    })}

                    {dayProjects.length > shown.length && (
                      <span className="px-1.5 text-[11px] font-medium text-zinc-500">
                        +{dayProjects.length - shown.length} mais
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${DOT_CLASSES[status]}`} />
              {STATUS_LABELS[status]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Prazo vencido
          </span>
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-800">
            {selectedDay ? `Entregas de ${formatDate(`${selectedDay}T12:00:00`)}` : "Entregas do mês"}{" "}
            <span className="text-sm font-normal text-zinc-400">({listed.length})</span>
          </h2>
          {selectedDay && (
            <button type="button" onClick={() => setSelectedDay(null)} className="btn-secondary !px-3 !py-1.5 text-xs">
              Ver o mês inteiro
            </button>
          )}
        </div>

        {listed.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
            {selectedDay
              ? "Nenhuma entrega marcada para este dia."
              : "Nenhuma entrega marcada para este mês."}
          </p>
        ) : (
          <ul className="space-y-2">
            {listed.map((project) => {
              const overdue = project.status !== "concluido" && project.day < todayKey;
              return (
                <li key={project.id} className="card flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[statusOf(project.status)]}`} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="truncate text-sm font-medium text-zinc-800 hover:text-indigo-600"
                    >
                      {project.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {project.editorName ?? "Sem editor atribuído"} ·{" "}
                      {STATUS_LABELS[statusOf(project.status)]}
                      {project.deliveryCount > 0 && (
                        <span>
                          {" · "}
                          {project.deliveryCount} {project.deliveryCount === 1 ? "entrega" : "entregas"}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium ${overdue ? "text-red-600" : "text-zinc-500"}`}
                  >
                    {formatDate(`${project.day}T12:00:00`)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
