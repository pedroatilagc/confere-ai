export type Status = "todo" | "doing" | "done";

export interface Task {
  id: string; // uuid
  text: string;
  date: string; // "YYYY-MM-DD" — dia (local) ao qual a tarefa pertence
  status: Status;
  order: number;
  createdAt: string; // ISO
  completedAt?: string;
}

export type View = "today" | "tomorrow" | "pending" | "history";
export type Mode = "list" | "kanban";
