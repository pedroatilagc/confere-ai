import { load, type Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";

export interface AgentConfig {
  chatId: string | null;
  agentEnabled: boolean;
}

export const DEFAULT_CONFIG: AgentConfig = {
  chatId: null,
  agentEnabled: false,
};

export type EditableConfig = Omit<AgentConfig, "chatId">;

let store: Promise<Store> | null = null;
const getStore = () => (store ??= load("config.json", { defaults: {}, autoSave: false }));

async function readRaw(): Promise<Record<string, unknown>> {
  const s = await getStore();
  return (await s.get<Record<string, unknown>>("agent")) ?? {};
}

async function writeRaw(raw: Record<string, unknown>): Promise<void> {
  const s = await getStore();
  await s.set("agent", raw);
  await s.save();
}

export async function loadConfig(): Promise<AgentConfig> {
  const raw = await readRaw();
  const { botToken, openrouterKey, model, ...rest } = raw;
  if (typeof botToken === "string" && botToken.trim()) await invoke("set_bot_token", { token: botToken });
  if (botToken !== undefined || openrouterKey !== undefined || model !== undefined) await writeRaw(rest);
  return { ...DEFAULT_CONFIG, ...(rest as Partial<AgentConfig>) };
}

export async function saveConfig(patch: Partial<EditableConfig>): Promise<void> {
  await writeRaw({ ...(await readRaw()), ...patch });
}

export async function unlinkChat(): Promise<void> {
  await writeRaw({ ...(await readRaw()), chatId: null });
}

export const hasBotToken = () => invoke<boolean>("has_bot_token");
export const setBotToken = (token: string) => invoke<void>("set_bot_token", { token });
export const clearBotToken = () => invoke<void>("clear_bot_token");
