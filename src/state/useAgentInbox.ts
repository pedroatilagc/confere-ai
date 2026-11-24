import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useTasks } from "./TaskContext";

export const AGENT_EVENT = "agent://commands";

declare global {
  interface Window {
    __inject?: (cmds: unknown) => Promise<void>;
  }
}

export function useAgentInbox() {
  const { applyAgent } = useTasks();
  const applyRef = useRef(applyAgent);
  applyRef.current = applyAgent;

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    listen<unknown>(AGENT_EVENT, (e) => applyRef.current(e.payload)).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    if (import.meta.env.DEV) {
      window.__inject = (cmds) => invoke("debug_inject", { cmds });
    }

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
