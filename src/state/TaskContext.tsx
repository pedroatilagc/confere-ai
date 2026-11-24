import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/react";
import { NOTE_LIMIT, type Status, type Task } from "../types";
import { loadTasks, purgeOld, saveTasks } from "../lib/storage";
import { addDays } from "../lib/dates";
import { useToday } from "./useToday";

interface TaskApi {
  tasks: Task[];
  today: string;
  tomorrow: string;
  add(text: string, date: string): void;
  edit(id: string, text: string): void;
  setStatus(id: string, status: Status): void;
  remove(id: string): void;
  moveToToday(id: string): void;
  reorder(orderedIds: string[]): void;
  setNote(id: string, doc: JSONContent, text: string): void;
}

const Ctx = createContext<TaskApi | null>(null);

export const tasksOn = (tasks: Task[], date: string) =>
  tasks.filter((t) => t.date === date).sort((a, b) => a.order - b.order);

const nextOrder = (tasks: Task[], date: string) =>
  Math.max(0, ...tasks.filter((t) => t.date === date).map((t) => t.order)) + 1;

export function TaskProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const [tasks, setTasks] = useState<Task[] | null>(null); // null = carregando do disco
  const loaded = tasks !== null;

  useEffect(() => {
    loadTasks().then(setTasks).catch((e) => {
      console.error(e);
      setTasks([]);
    });
  }, []);

  // Limpeza (>7 dias): ao terminar de carregar e a cada virada de dia.
  useEffect(() => {
    if (loaded) setTasks((ts) => ts && purgeOld(ts, today));
  }, [today, loaded]);

  // Toda mudança de estado é gravada no JSON.
  useEffect(() => {
    if (tasks) saveTasks(tasks).catch(console.error);
  }, [tasks]);

  if (!tasks) return null;

  const change = (fn: (ts: Task[]) => Task[]) => setTasks((ts) => ts && fn(ts));
  const patch = (id: string, p: Partial<Task>) =>
    change((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const api: TaskApi = {
    tasks,
    today,
    tomorrow: addDays(today, 1),
    add: (text, date) =>
      change((ts) => [
        ...ts,
        {
          id: crypto.randomUUID(),
          text,
          date,
          status: "todo",
          order: nextOrder(ts, date),
          createdAt: new Date().toISOString(),
        },
      ]),
    edit: (id, text) => patch(id, { text }),
    // Regra de negócio também na camada de dados: tarefa de dia futuro
    // não muda de status, venha a chamada da UI ou (no futuro) do agente.
    setStatus: (id, status) =>
      change((ts) =>
        ts.map((t) =>
          t.id === id && t.date <= today
            ? { ...t, status, completedAt: status === "done" ? new Date().toISOString() : undefined }
            : t,
        ),
      ),
    remove: (id) => change((ts) => ts.filter((t) => t.id !== id)),
    moveToToday: (id) =>
      change((ts) => ts.map((t) => (t.id === id ? { ...t, date: today, order: nextOrder(ts, today) } : t))),
    reorder: (ids) =>
      change((ts) => ts.map((t) => (ids.includes(t.id) ? { ...t, order: ids.indexOf(t.id) } : t))),
    // Nota vazia = sem nota: o campo é removido.
    setNote: (id, doc, text) =>
      change((ts) =>
        ts.map((t) => {
          if (t.id !== id) return t;
          if (!text.trim()) {
            const { note: _removed, ...rest } = t;
            return rest;
          }
          return { ...t, note: { doc, text: text.slice(0, NOTE_LIMIT), updatedAt: new Date().toISOString() } };
        }),
      ),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useTasks(): TaskApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useTasks fora do TaskProvider");
  return api;
}
