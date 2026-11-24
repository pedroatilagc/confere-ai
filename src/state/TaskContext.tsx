import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/react";
import type { Status, Task } from "../types";
import { loadTasks, purgeOld, saveTasks } from "../lib/storage";
import { addDays } from "../lib/dates";
import * as domain from "../lib/tasks";
import { useToday } from "./useToday";

export { tasksOn } from "../lib/tasks";

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
  applyAgent(cmds: unknown): Pick<domain.ApplyResult, "applied" | "rejected">;
}

const Ctx = createContext<TaskApi | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const loaded = tasks !== null;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    loadTasks().then(setTasks).catch((e) => {
      console.error(e);
      setTasks([]);
    });
  }, []);

  useEffect(() => {
    if (loaded) setTasks((ts) => ts && purgeOld(ts, today));
  }, [today, loaded]);

  useEffect(() => {
    if (tasks) saveTasks(tasks).catch(console.error);
  }, [tasks]);

  if (!tasks) return null;

  const change = (fn: (ts: Task[]) => Task[]) => setTasks((ts) => ts && fn(ts));

  const api: TaskApi = {
    tasks,
    today,
    tomorrow: addDays(today, 1),
    add: (text, date) => change((ts) => domain.addTask(ts, { text, date })),
    edit: (id, text) => change((ts) => domain.editTask(ts, id, text)),
    setStatus: (id, status) => change((ts) => domain.setStatus(ts, id, status, today)),
    remove: (id) => change((ts) => domain.removeTask(ts, id)),
    moveToToday: (id) => change((ts) => domain.moveToToday(ts, id, today)),
    reorder: (ids) => change((ts) => domain.reorder(ts, ids)),
    setNote: (id, doc, text) => change((ts) => domain.setNote(ts, id, doc, text)),
    applyAgent: (cmds) => {
      const result = domain.applyCommands(tasksRef.current ?? [], cmds, today);
      tasksRef.current = result.tasks;
      setTasks(result.tasks);
      console.info("[agent]", { applied: result.applied, rejected: result.rejected });
      return { applied: result.applied, rejected: result.rejected };
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useTasks(): TaskApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useTasks fora do TaskProvider");
  return api;
}
