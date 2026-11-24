import { useCallback, useEffect, useState } from "react";
import type { Mode, Task, View } from "./types";
import { Nav, VIEWS } from "./components/Nav";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import { History, Pending, Today, Tomorrow } from "./views/Views";
import { NoteOverlay } from "./views/NotesSheet";
import { useTasks } from "./state/TaskContext";
import { NoteOpenerContext } from "./state/noteOpener";

const MODE_CYCLE: Mode[] = ["list", "kanban", "notes"];

// Teclas de atalho de uma letra não valem enquanto se digita (inputs e o editor de notas).
const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && !!el.closest("input, textarea, [contenteditable='true']");

export default function App() {
  const { tasks, today } = useTasks();
  const [view, setView] = useState<View>("today"); // sempre abre em "hoje"
  const [mode, setMode] = useState<Mode>("list");
  const [help, setHelp] = useState(false);
  const [focusId, setFocusId] = useState<string>();
  const [overlayId, setOverlayId] = useState<string>();

  // Nota de hoje → modo Notas com foco nela. Outro dia → painel por cima.
  const openNote = useCallback(
    (task: Task) => {
      if (task.date === today) {
        setView("today");
        setMode("notes");
        setFocusId(task.id);
      } else {
        setOverlayId(task.id);
      }
    },
    [today],
  );

  const changeMode = (m: Mode) => {
    setFocusId(undefined);
    setMode(m);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        setView(VIEWS[Number(e.key) - 1].id);
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setView("today"); // os modos só existem em "hoje"
        setFocusId(undefined);
        setMode((m) => MODE_CYCLE[(MODE_CYCLE.indexOf(m) + 1) % MODE_CYCLE.length]);
        return;
      }
      if (isTyping(e.target)) return;
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

  const pageClass =
    view === "today" && mode === "kanban" ? "page wide" : view === "today" && mode === "notes" ? "page notes" : "page";
  const overlayTask = tasks.find((t) => t.id === overlayId);

  return (
    <NoteOpenerContext.Provider value={openNote}>
      <div className="app">
        <Nav view={view} onView={setView} />
        <main className={pageClass} key={view + mode}>
          {view === "today" && <Today mode={mode} onMode={changeMode} focusId={focusId} />}
          {view === "tomorrow" && <Tomorrow />}
          {view === "pending" && <Pending />}
          {view === "history" && <History />}
        </main>
        <button className="help-btn" onClick={() => setHelp(true)} aria-label="Atalhos de teclado">
          ?
        </button>
        {help && <ShortcutsHelp onClose={() => setHelp(false)} />}
        {overlayTask && <NoteOverlay task={overlayTask} onClose={() => setOverlayId(undefined)} />}
      </div>
    </NoteOpenerContext.Provider>
  );
}
