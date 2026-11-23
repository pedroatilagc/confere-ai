import { useLayoutEffect, useRef, useState } from "react";
import type { View } from "../types";
import { addDays } from "../lib/dates";
import { useTasks } from "../state/TaskContext";

export const VIEWS: { id: View; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "pending", label: "Pendentes" },
  { id: "history", label: "Histórico" },
];

export function Nav({ view, onView }: { view: View; onView(v: View): void }) {
  const { tasks, today, tomorrow } = useTasks();
  const refs = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState({ left: 0, width: 0 });

  // Contadores ao lado de cada seção: o que ainda falta fazer em cada uma.
  const oldest = addDays(today, -6);
  const counts: Partial<Record<View, number>> = {
    today: tasks.filter((t) => t.date === today && t.status !== "done").length,
    tomorrow: tasks.filter((t) => t.date === tomorrow).length,
    pending: tasks.filter((t) => t.date < today && t.date >= oldest && t.status !== "done").length,
  };

  // O destaque da aba ativa desliza até o botão selecionado.
  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[view];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [view, counts.today, counts.tomorrow, counts.pending]);

  return (
    <nav className="nav">
      <div className="nav-track">
        <span className="nav-pill" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} />
        {VIEWS.map((v) => (
          <button
            key={v.id}
            ref={(el) => {
              refs.current[v.id] = el;
            }}
            className={v.id === view ? "active" : ""}
            onClick={() => onView(v.id)}
          >
            {v.label}
            {!!counts[v.id] && <span className="nav-count">{counts[v.id]}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
