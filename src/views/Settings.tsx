import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, type AgentConfig } from "../lib/config";

const SAVE_DELAY = 500;

export function Settings({ onClose }: { onClose(): void }) {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<AgentConfig | null>(null);

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

  const update = (patch: Partial<AgentConfig>) => {
    setConfig((c) => {
      const next = { ...(c ?? DEFAULT_CONFIG), ...patch };
      pending.current = next;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        pending.current = null;
        saveConfig(next).catch(console.error);
      }, SAVE_DELAY);
      return next;
    });
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
            <Field label="Token do bot" hint="Crie o seu bot no @BotFather e cole o token aqui.">
              <SecretInput value={config.botToken} onChange={(v) => update({ botToken: v })} placeholder="123456:ABC…" />
            </Field>
            <Field label="Chat autorizado" hint="Preenchido automaticamente quando você enviar /start ao bot.">
              <input className="input" value={config.chatId ?? "—"} readOnly tabIndex={-1} />
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
                <p className="hint">Sem efeito até a integração com o Telegram ser implementada.</p>
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
            Salvo automaticamente em <code>config.json</code>, separado das tarefas. As chaves ficam em texto puro
            neste computador.
          </p>
        </>
      )}
    </div>
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
