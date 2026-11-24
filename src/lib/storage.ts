import { load, type Store } from "@tauri-apps/plugin-store";
import type { Task } from "../types";
import { addDays } from "./dates";

// O plugin-store guarda um JSON em appDataDir:
//   %APPDATA%\com.confereai.app\tasks.json
// Cada get/set/save é uma chamada IPC para o lado Rust do plugin.
let store: Promise<Store> | null = null;
const getStore = () => (store ??= load("tasks.json", { defaults: {}, autoSave: false }));

// Versão do formato dos dados gravados. Suba quando o formato mudar
// e ensine `migrate` a converter a versão anterior.
export const SCHEMA_VERSION = 2;

interface RawData {
  version?: number;
  tasks?: unknown;
}

// Recebe o que estiver no disco (de qualquer versão) e devolve no formato atual.
// Cada passo converte de N para N+1, então arquivos muito antigos passam por todos.
export function migrate(raw: RawData): Task[] {
  let version = raw.version ?? 1;
  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : []) as Task[];

  if (version < 2) {
    // v1 -> v2: novo campo opcional `note`. Nada a transformar.
    version = 2;
  }
  // if (version < 3) { ... próxima migração ... }

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

// Mantém hoje, os 6 dias anteriores e o futuro (amanhã). O resto é apagado,
// incluindo as notas, que vivem dentro de cada tarefa.
export function purgeOld(tasks: Task[], today: string): Task[] {
  const oldest = addDays(today, -6);
  return tasks.filter((t) => t.date >= oldest); // "YYYY-MM-DD" compara certo como string
}
