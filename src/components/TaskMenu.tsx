import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface Props {
  hasNote: boolean;
  onNotes(): void;
  onDelete(): void;
}

// Menu "⋯" da tarefa: abre com clique ou Enter, setas navegam, Esc/clique fora fecha.
export function TaskMenu({ hasNote, onNotes, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(i + step + items.length) % items.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const pick = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="menu-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <button
        ref={btn}
        className="task-more"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais ações"
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open && (
        <div ref={menu} className="menu" role="menu" onKeyDown={onKeyDown}>
          <button role="menuitem" tabIndex={-1} onClick={() => pick(onNotes)}>
            {hasNote ? "Notas" : "Adicionar nota"}
          </button>
          <button role="menuitem" tabIndex={-1} onClick={() => pick(onDelete)}>
            Apagar
          </button>
        </div>
      )}
    </div>
  );
}
