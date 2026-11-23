import { load, type Store } from "@tauri-apps/plugin-store";
import type { Task } from "../types";
import { addDays } from "./dates";

// O plugin-store guarda um JSON em appDataDir:
//   %APPDATA%\com.confereai.app\tasks.json
// Cada get/set/save é uma chamada IPC para o lado Rust do plugin.
let store: Promise<Store> | null = null;
const getStore = () => (store ??= load("tasks.json", { defaults: {}, autoSave: false }));

export async function loadTasks(): Promise<Task[]> {
  const s = await getStore();
  return (await s.get<Task[]>("tasks")) ?? [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const s = await getStore();
  await s.set("version", 1);
  await s.set("tasks", tasks);
  await s.save();
}

// Mantém hoje, os 6 dias anteriores e o futuro (amanhã). O resto é apagado.
export function purgeOld(tasks: Task[], today: string): Task[] {
  const oldest = addDays(today, -6);
  return tasks.filter((t) => t.date >= oldest); // "YYYY-MM-DD" compara certo como string
}
