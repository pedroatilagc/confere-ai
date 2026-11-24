import type { JSONContent } from "@tiptap/react";
import { NOTE_LIMIT, type AgentCommand, type Source, type Status, type Task } from "../types";
import { addDays } from "./dates";

export const MAX_TASK_TEXT = 280;

const nowIso = () => new Date().toISOString();

export const tasksOn = (tasks: Task[], date: string) =>
  tasks.filter((t) => t.date === date).sort((a, b) => a.order - b.order);

const nextOrder = (tasks: Task[], date: string) =>
  Math.max(0, ...tasks.filter((t) => t.date === date).map((t) => t.order)) + 1;

export interface NewTask {
  text: string;
  date: string;
  status?: Status;
  source?: Source;
}

export function addTask(tasks: Task[], input: NewTask, id = crypto.randomUUID(), now = nowIso()): Task[] {
  return [
    ...tasks,
    {
      id,
      text: input.text,
      date: input.date,
      status: input.status ?? "todo",
      order: nextOrder(tasks, input.date),
      createdAt: now,
      ...(input.source && input.source !== "app" ? { source: input.source } : {}),
    },
  ];
}

export const editTask = (tasks: Task[], id: string, text: string): Task[] =>
  tasks.map((t) => (t.id === id ? { ...t, text } : t));

export const setStatus = (tasks: Task[], id: string, status: Status, today: string, now = nowIso()): Task[] =>
  tasks.map((t) =>
    t.id === id && t.date <= today
      ? { ...t, status, completedAt: status === "done" ? now : undefined }
      : t,
  );

export const removeTask = (tasks: Task[], id: string): Task[] => tasks.filter((t) => t.id !== id);

export const moveToToday = (tasks: Task[], id: string, today: string): Task[] =>
  tasks.map((t) => (t.id === id ? { ...t, date: today, order: nextOrder(tasks, today) } : t));

export const reorder = (tasks: Task[], ids: string[]): Task[] =>
  tasks.map((t) => (ids.includes(t.id) ? { ...t, order: ids.indexOf(t.id) } : t));

export function setNote(tasks: Task[], id: string, doc: JSONContent, text: string, now = nowIso()): Task[] {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    if (!text.trim()) {
      const { note: _removed, ...rest } = t;
      return rest;
    }
    return { ...t, note: { doc, text: text.slice(0, NOTE_LIMIT), updatedAt: now } };
  });
}

export interface Rejected {
  cmd: unknown;
  reason: string;
}

export interface ApplyResult {
  tasks: Task[];
  applied: AgentCommand[];
  rejected: Rejected[];
}

export function applyCommands(tasks: Task[], cmds: unknown, today: string, source: Source = "telegram"): ApplyResult {
  const tomorrow = addDays(today, 1);
  const applied: AgentCommand[] = [];
  const rejected: Rejected[] = [];
  let next = tasks;

  if (!Array.isArray(cmds)) {
    return { tasks, applied, rejected: [{ cmd: cmds, reason: "esperava uma lista de comandos" }] };
  }

  for (const raw of cmds) {
    const reason = validate(raw, today, tomorrow);
    if (reason) {
      rejected.push({ cmd: raw, reason });
      continue;
    }
    const cmd = raw as AgentCommand;
    next = addTask(next, { text: cmd.text.trim(), date: cmd.date, status: cmd.status ?? "todo", source });
    applied.push(cmd);
  }

  return { tasks: next, applied, rejected };
}

function validate(raw: unknown, today: string, tomorrow: string): string | null {
  if (typeof raw !== "object" || raw === null) return "comando não é um objeto";
  const c = raw as Record<string, unknown>;
  if (c.type !== "add_task") return `tipo desconhecido: ${String(c.type)}`;
  if (typeof c.text !== "string" || !c.text.trim()) return "texto vazio";
  if (c.text.trim().length > MAX_TASK_TEXT) return `texto passa de ${MAX_TASK_TEXT} caracteres`;
  if (c.date !== today && c.date !== tomorrow) return "data precisa ser hoje ou amanhã";
  if (c.status !== undefined && c.status !== "todo" && c.status !== "doing") return "status precisa ser todo ou doing";
  if (c.status === "doing" && c.date === tomorrow) return "tarefa de amanhã não pode estar em andamento";
  return null;
}
