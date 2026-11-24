import { useState } from "react";
import type { Task } from "../types";
import { formatDay } from "../lib/dates";
import { NoteEditor } from "../components/NoteEditor";

// Uma folha por tarefa. Acima dela, um índice com as tarefas de hoje
// para trocar de folha; só a nota escolhida aparece.
export function NotesSheet({ tasks, focusId }: { tasks: Task[]; focusId?: string }) {
  const initial = focusId ?? tasks.find((t) => t.note)?.id ?? tasks[0]?.id;
  const [selectedId, setSelectedId] = useState(initial);
  const [focusOnOpen, setFocusOnOpen] = useState(!!focusId);

  if (tasks.length === 0) return <p className="empty">Nenhuma tarefa hoje para anotar.</p>;
  const task = tasks.find((t) => t.id === selectedId) ?? tasks[0];

  return (
    <>
      <div className="sheet-index" role="tablist" aria-label="Tarefas de hoje">
        {tasks.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === task.id}
            className={[t.id === task.id && "active", t.status === "done" && "done"].filter(Boolean).join(" ")}
            onClick={() => {
              setSelectedId(t.id);
              setFocusOnOpen(true);
            }}
          >
            {t.note && <span className="sheet-dot" aria-label="tem nota" />}
            {t.text}
          </button>
        ))}
      </div>
      {/* key: trocar de tarefa monta uma folha (e um editor) novos */}
      <div className="paper" key={task.id}>
        <Sheet task={task} autoFocus={focusOnOpen} />
      </div>
    </>
  );
}

function Sheet({ task, autoFocus }: { task: Task; autoFocus: boolean }) {
  return (
    <section className={task.status === "done" ? "sheet-block done" : "sheet-block"}>
      <h2 className="sheet-title">{task.text}</h2>
      <NoteEditor task={task} autoFocus={autoFocus} />
    </section>
  );
}

// Mesma folha, num painel por cima da tela (tarefas de outros dias).
export function NoteOverlay({ task, onClose }: { task: Task; onClose(): void }) {
  return (
    <div
      className="note-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="paper paper-single" role="dialog" aria-label={`Nota: ${task.text}`}>
        <div className="paper-head">
          <span className="paper-date">{formatDay(task.date)}</span>
          <button className="paper-close" onClick={onClose}>
            Fechar
          </button>
        </div>
        <Sheet task={task} autoFocus />
      </div>
    </div>
  );
}
