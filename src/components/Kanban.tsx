import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Status, Task } from "../types";
import { useTasks } from "../state/TaskContext";
import { NewTask } from "./NewTask";

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo", label: "A fazer" },
  { status: "doing", label: "Fazendo" },
  { status: "done", label: "Feito" },
];

export function Kanban({ tasks, date }: { tasks: Task[]; date: string }) {
  const { setStatus } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Soltar numa coluna muda o status. São os mesmos dados da lista.
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const task = tasks.find((t) => t.id === active.id);
    const status = over?.id as Status | undefined;
    if (task && status && task.status !== status) setStatus(task.id, status);
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="kanban">
          {COLUMNS.map((c) => (
            <Column key={c.status} {...c} tasks={tasks.filter((t) => t.status === c.status)} />
          ))}
        </div>
      </DndContext>
      <NewTask date={date} />
    </>
  );
}

function Column({ status, label, tasks }: { status: Status; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={`column col-${status}${isOver ? " over" : ""}`}>
      <h2>{label} <span className="col-count">{tasks.length}</span></h2>
      <ul>
        {tasks.map((t) => (
          <Card key={t.id} task={t} />
        ))}
      </ul>
    </section>
  );
}

function Card({ task }: { task: Task }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <li
      ref={setNodeRef}
      className={`card${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
    >
      <span className="task-text">{task.text}</span>
    </li>
  );
}
