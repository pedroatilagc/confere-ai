import { useState } from "react";
import { useTasks } from "../state/TaskContext";

export function NewTask({ date }: { date: string }) {
  const { add } = useTasks();
  const [text, setText] = useState("");

  return (
    <label className="new-task">
      <span className="new-plus" aria-hidden>+</span>
      <input
        id="new-task"
        placeholder="Adicionar tarefa"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) {
            add(text.trim(), date);
            setText("");
          }
          if (e.key === "Escape") e.currentTarget.blur();
        }}
      />
      <kbd className={text.trim() ? "visible" : ""}>Enter</kbd>
    </label>
  );
}
