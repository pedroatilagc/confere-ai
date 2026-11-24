import { load, type Store } from "@tauri-apps/plugin-store";

export interface AgentConfig {
  botToken: string;
  chatId: string | null;
  openrouterKey: string;
  model: string;
  agentEnabled: boolean;
}

export const DEFAULT_CONFIG: AgentConfig = {
  botToken: "",
  chatId: null,
  openrouterKey: "",
  model: "",
  agentEnabled: false,
};

let store: Promise<Store> | null = null;
const getStore = () => (store ??= load("config.json", { defaults: {}, autoSave: false }));

export async function loadConfig(): Promise<AgentConfig> {
  const s = await getStore();
  return { ...DEFAULT_CONFIG, ...((await s.get<Partial<AgentConfig>>("agent")) ?? {}) };
}

export async function saveConfig(config: AgentConfig): Promise<void> {
  const s = await getStore();
  await s.set("agent", config);
  await s.save();
}
