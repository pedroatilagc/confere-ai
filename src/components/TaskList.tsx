import type { ReactNode } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task } from "../types";
import { useTasks } from "../state/TaskContext";
import { TaskItem } from "./TaskItem";
import { NewTask } from "./NewTask";

interface Props {
  tasks: Task[];
  date?: string; // presente = dá para adicionar e reordenar nesse dia
  extra?: (t: Task) => ReactNode;
  completable?: boolean;
}

export function TaskList({ tasks, date, extra, completable = true }: Props) {
  const { reorder } = useTasks();
  // O arraste só começa depois de 6 px; assim clicar e editar continuam funcionando.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    reorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="tasks">
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} sortable={!!date} extra={extra?.(t)} completable={completable} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {date && <NewTask date={date} />}
    </>
  );
}
