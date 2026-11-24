import { useEffect, useRef, useState, type ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  DEFAULT_CONFIG,
  clearBotToken,
  hasBotToken,
  loadConfig,
  saveConfig,
  setBotToken,
  unlinkChat,
  type AgentConfig,
  type EditableConfig,
} from "../lib/config";

const SAVE_DELAY = 500;

export function Settings({ onClose }: { onClose(): void }) {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<Partial<EditableConfig> | null>(null);

  useEffect(() => {
    const refreshChat = () => loadConfig().then((c) => setConfig((prev) => prev && { ...prev, chatId: c.chatId }));
    const off = listen("agent://config", refreshChat);
    return () => {
      off.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((e) => {
        console.error(e);
        setConfig(DEFAULT_CONFIG);
      });
    return () => {
      window.clearTimeout(timer.current);
      if (pending.current) saveConfig(pending.current).catch(console.error);
    };
  }, []);

  const update = (patch: Partial<EditableConfig>) => {
    setConfig((c) => ({ ...(c ?? DEFAULT_CONFIG), ...patch }));
    const toSave = { ...pending.current, ...patch };
    pending.current = toSave;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      pending.current = null;
      saveConfig(toSave).catch(console.error);
    }, SAVE_DELAY);
  };

  const unlink = () => {
    unlinkChat()
      .then(() => setConfig((c) => c && { ...c, chatId: null }))
      .catch(console.error);
  };

  return (
    <div
      className="settings"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <header className="header">
        <div>
          <p className="eyebrow">Ctrl + ,</p>
          <h1 className="title">Configurações</h1>
        </div>
        <button className="settings-close" onClick={onClose}>
          Voltar
        </button>
      </header>

      {config && (
        <>
          <section className="settings-group">
            <h2>Telegram</h2>
            <BotTokenField />
            <Field label="Chat autorizado" hint="Preenchido automaticamente quando você enviar /start ao bot.">
              <div className="secret">
                <input className="input" value={config.chatId ?? "—"} readOnly tabIndex={-1} />
                {config.chatId && (
                  <button type="button" className="secret-toggle" onClick={unlink}>
                    Desvincular
                  </button>
                )}
              </div>
            </Field>
          </section>

          <section className="settings-group">
            <h2>Modelo (OpenRouter)</h2>
            <Field label="Chave da API">
              <SecretInput value={config.openrouterKey} onChange={(v) => update({ openrouterKey: v })} placeholder="sk-or-…" />
            </Field>
            <Field label="ID do modelo" hint="Como aparece no OpenRouter, no formato provedor/modelo.">
              <input
                className="input"
                value={config.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder="provedor/modelo"
                spellCheck={false}
              />
            </Field>
          </section>

          <section className="settings-group">
            <div className="switch-row">
              <div>
                <h2>Agente ativo</h2>
                <p className="hint">Liga o bot do Telegram enquanto o app estiver aberto.</p>
              </div>
              <button
                role="switch"
                aria-checked={config.agentEnabled}
                aria-label="Agente ativo"
                className="switch"
                onClick={() => update({ agentEnabled: !config.agentEnabled })}
              >
                <span />
              </button>
            </div>
          </section>

          <p className="settings-note">
            Salvo automaticamente em <code>config.json</code>, separado das tarefas. O token do bot fica no
            Gerenciador de Credenciais do Windows; a chave do OpenRouter ainda fica em texto puro.
          </p>
        </>
      )}
    </div>
  );
}

function BotTokenField() {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    hasBotToken().then(setSaved).catch(() => setSaved(false));
  }, []);

  const save = () => {
    setBotToken(draft)
      .then(() => {
        setDraft("");
        setError("");
        setSaved(true);
      })
      .catch((e) => setError(String(e)));
  };
  const remove = () => {
    clearBotToken().then(() => setSaved(false)).catch((e) => setError(String(e)));
  };

  if (saved === null) return null;
  return (
    <Field
      label="Token do bot"
      hint={error || (saved ? "Guardado no Gerenciador de Credenciais do Windows." : "Crie o seu bot no @BotFather e cole o token aqui.")}
    >
      {saved ? (
        <div className="secret">
          <input className="input" value="Configurado ✓" readOnly tabIndex={-1} />
          <button type="button" className="secret-toggle" onClick={remove}>
            Remover
          </button>
        </div>
      ) : (
        <div className="secret-row">
          <SecretInput value={draft} onChange={setDraft} placeholder="123456:ABC…" />
          <button type="button" className="secret-toggle" onClick={save} disabled={!draft.trim()}>
            Salvar
          </button>
        </div>
      )}
    </Field>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange(v: string): void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="secret">
      <input
        className="input"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      <button type="button" className="secret-toggle" onClick={() => setVisible((v) => !v)}>
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
