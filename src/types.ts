import type { JSONContent } from "@tiptap/react";

export type Status = "todo" | "doing" | "done";
export type Source = "app" | "telegram";

export const NOTE_LIMIT = 2000;

export interface Note {
  doc: JSONContent;
  text: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  text: string;
  date: string;
  status: Status;
  order: number;
  createdAt: string;
  completedAt?: string;
  note?: Note;
  source?: Source;
}

export type AgentCommand = {
  type: "add_task";
  text: string;
  date: string;
  status?: "todo" | "doing";
};

export type View = "today" | "tomorrow" | "pending" | "history" | "settings";
export type Mode = "list" | "kanban" | "notes";
