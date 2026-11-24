import type { Mode, Task } from "../types";
import { tasksOn, useTasks } from "../state/TaskContext";
import { addDays, formatDay } from "../lib/dates";
import { TaskList } from "../components/TaskList";
import { Kanban } from "../components/Kanban";
import { Strike } from "../components/Chalk";
import { NotesSheet } from "./NotesSheet";

function Progress({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  const done = tasks.filter((t) => t.status === "done").length;
  return (
    <div className="progress">
      <div className="progress-bar">
        <span style={{ width: `${(done / tasks.length) * 100}%` }} />
      </div>
      <span className="progress-label">
        {done}/{tasks.length}
      </span>
    </div>
  );
}

function Header({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
      </div>
      {children}
    </header>
  );
}

const MODES: { id: Mode; label: string }[] = [
  { id: "list", label: "Lista" },
  { id: "kanban", label: "Kanban" },
  { id: "notes", label: "Notas" },
];

interface TodayProps {
  mode: Mode;
  onMode(m: Mode): void;
  focusId?: string; // nota a focar ao abrir o modo Notas
}

export function Today({ mode, onMode, focusId }: TodayProps) {
  const { tasks, today } = useTasks();
  const list = tasksOn(tasks, today);
  return (
    <>
      <Header eyebrow="Hoje" title={formatDay(today)}>
        <div className="segmented" role="tablist">
          {MODES.map((m) => (
            <button key={m.id} className={mode === m.id ? "active" : ""} onClick={() => onMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </Header>
      <Progress tasks={list} />
      {mode === "list" && <TaskList tasks={list} date={today} />}
      {mode === "kanban" && <Kanban tasks={list} date={today} />}
      {mode === "notes" && <NotesSheet tasks={list} focusId={focusId} />}
    </>
  );
}

export function Tomorrow() {
  const { tasks, tomorrow } = useTasks();
  const list = tasksOn(tasks, tomorrow);
  return (
    <>
      <Header eyebrow="Amanhã" title={formatDay(tomorrow)} />
      <p className="hint">
        {list.length === 0 ? "Anote o que vem amanhã. Tudo aqui aparece em Hoje quando o dia virar." : `${list.length} planejada${list.length > 1 ? "s" : ""}`}
      </p>
      <TaskList tasks={list} date={tomorrow} completable={false} />
    </>
  );
}

export function Pending() {
  const { tasks, today, moveToToday } = useTasks();
  const oldest = addDays(today, -6);
  const list = tasks
    .filter((t) => t.date < today && t.date >= oldest && t.status !== "done")
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  return (
    <>
      <Header eyebrow="Últimos 7 dias" title="Pendentes" />
      {list.length === 0 ? (
        <p className="empty">Nada ficou para trás.</p>
      ) : (
        <TaskList
          tasks={list}
          extra={(t) => (
            <>
              <span className="tag">{formatDay(t.date).split(",")[0]}</span>
              <button className="action" tabIndex={-1} onClick={() => moveToToday(t.id)}>
                Trazer para hoje
              </button>
            </>
          )}
        />
      )}
    </>
  );
}

export function History() {
  const { tasks, today } = useTasks();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));

  return (
    <>
      <Header eyebrow="Últimos 7 dias" title="Histórico" />
      {days.map((day) => {
        const list = tasksOn(tasks, day);
        return (
          <section key={day} className={list.length ? "history-day" : "history-day empty-day"}>
            <div className="history-head">
              <h2>{day === today ? "Hoje" : formatDay(day)}</h2>
              {list.length > 0 ? <Progress tasks={list} /> : <span className="progress-label">sem tarefas</span>}
            </div>
            {list.length > 0 && (
              <ul className="history-list">
                {list.map((t) => (
                  <li key={t.id} className={t.status === "done" ? "done" : "undone"}>
                    <span className="task-text">
                      {t.text}
                      {t.status === "done" && <Strike seed={t.id} />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
