import { useEffect, useState } from "react";
import type { Mode, View } from "./types";
import { Nav, VIEWS } from "./components/Nav";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import { History, Pending, Today, Tomorrow } from "./views/Views";

export default function App() {
  const [view, setView] = useState<View>("today"); // sempre abre em "hoje"
  const [mode, setMode] = useState<Mode>("list");
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        setView(VIEWS[Number(e.key) - 1].id);
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setView("today"); // kanban só existe em "hoje"
        setMode((m) => (m === "list" ? "kanban" : "list"));
        return;
      }
      if ((e.target as HTMLElement).matches("input, textarea")) return;
      if (e.key.toLowerCase() === "n" && !e.ctrlKey) {
        const input = document.getElementById("new-task");
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
      if (e.key === "?") setHelp((h) => !h);
      if (e.key === "Escape") setHelp(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const wide = view === "today" && mode === "kanban";

  return (
    <div className="app">
      <Nav view={view} onView={setView} />
      <main className={wide ? "page wide" : "page"} key={view + mode}>
        {view === "today" && <Today mode={mode} onMode={setMode} />}
        {view === "tomorrow" && <Tomorrow />}
        {view === "pending" && <Pending />}
        {view === "history" && <History />}
      </main>
      <button className="help-btn" onClick={() => setHelp(true)} aria-label="Atalhos de teclado">
        ?
      </button>
      {help && <ShortcutsHelp onClose={() => setHelp(false)} />}
    </div>
  );
}
