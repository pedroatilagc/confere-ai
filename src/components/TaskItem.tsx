import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
import { useTasks } from "../state/TaskContext";
import { useOpenNote } from "../state/noteOpener";
import { ChalkCheckbox, Strike } from "./Chalk";
import { NoteIcon } from "./Icons";
import { TaskMenu } from "./TaskMenu";
import { ConfirmPopover } from "./ConfirmPopover";

interface Props {
  task: Task;
  sortable: boolean;
  extra?: ReactNode;
  completable?: boolean; // false em "Amanhã": não pode concluir nem marcar "fazendo"
}

const focusEl = (el: Element | null) => (el as HTMLElement | null)?.focus();

export function TaskItem({ task, sortable, extra, completable = true }: Props) {
  const { edit, setStatus, remove } = useTasks();
  const openNote = useOpenNote();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [confirming, setConfirming] = useState(false);
  const liRef = useRef<HTMLLIElement | null>(null);
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !sortable || editing || confirming,
  });

  const done = completable && task.status === "done";
  const doing = completable && task.status === "doing";
  const toggle = () => {
    if (completable) setStatus(task.id, done ? "todo" : "done");
  };

  const save = () => {
    const text = draft.trim();
    if (text && text !== task.text) edit(task.id, text);
    else setDraft(task.text);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(task.text);
    setEditing(false);
  };

  const doRemove = () => {
    const li = liRef.current;
    if (li) focusEl(li.nextElementSibling ?? li.previousElementSibling);
    remove(task.id);
  };
  // Com nota, pede confirmação; sem nota, apaga direto.
  const requestDelete = () => (task.note ? setConfirming(true) : doRemove());

  // Teclado com o item (li) em foco.
  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget) return;
    const li = e.currentTarget;
    switch (e.key) {
      case "Delete":
        requestDelete();
        break;
      case " ":
        e.preventDefault();
        toggle();
        break;
      case "Enter":
      case "F2":
        e.preventDefault();
        setEditing(true);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusEl(li.nextElementSibling);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusEl(li.previousElementSibling);
        break;
    }
  };

  const cls = ["task", done && "done", doing && "doing", isDragging && "dragging", confirming && "raised"]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        liRef.current = el;
      }}
      className={cls}
      tabIndex={0}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onKeyDown={onKeyDown}
      {...listeners}
    >
      {completable ? (
        <ChalkCheckbox checked={done} onToggle={toggle} />
      ) : (
        <span className="check-placeholder" aria-hidden>
          –
        </span>
      )}
      {editing ? (
        <input
          className="task-edit"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
        />
      ) : (
        <span className="task-text" onClick={() => setEditing(true)}>
          {task.text}
          {done && <Strike seed={task.id} />}
        </span>
      )}
      {task.note && !editing && (
        <button className="note-ind" tabIndex={-1} onClick={() => openNote(task)} aria-label="Abrir nota" title="Abrir nota">
          <NoteIcon />
        </button>
      )}
      <div className="task-actions">
        {extra}
        <TaskMenu hasNote={!!task.note} onNotes={() => openNote(task)} onDelete={requestDelete} />
      </div>
      {confirming && (
        <ConfirmPopover
          message="Apagar esta tarefa? A nota dela também será apagada."
          confirmLabel="Apagar tudo"
          onConfirm={() => {
            setConfirming(false);
            doRemove();
          }}
          onCancel={() => {
            setConfirming(false);
            liRef.current?.focus();
          }}
        />
      )}
    </li>
  );
}
