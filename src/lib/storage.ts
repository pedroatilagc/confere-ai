import { load, type Store } from "@tauri-apps/plugin-store";
import type { Task } from "../types";
import { addDays } from "./dates";

let store: Promise<Store> | null = null;
const getStore = () => (store ??= load("tasks.json", { defaults: {}, autoSave: false }));

export const SCHEMA_VERSION = 2;

interface RawData {
  version?: number;
  tasks?: unknown;
}

// Cada versão nova do formato ganha um passo aqui (if (v < 3) …), para arquivos antigos continuarem abrindo.
export function migrate(raw: RawData): Task[] {
  let version = raw.version ?? 1;
  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : []) as Task[];

  if (version < 2) {
    version = 2;
  }

  return tasks;
}

export async function loadTasks(): Promise<Task[]> {
  const s = await getStore();
  return migrate({ version: await s.get<number>("version"), tasks: await s.get("tasks") });
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const s = await getStore();
  await s.set("version", SCHEMA_VERSION);
  await s.set("tasks", tasks);
  await s.save();
}

export function purgeOld(tasks: Task[], today: string): Task[] {
  const oldest = addDays(today, -6);
  return tasks.filter((t) => t.date >= oldest);
}
