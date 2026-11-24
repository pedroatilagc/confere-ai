import type { JSONContent } from "@tiptap/react";

export type Status = "todo" | "doing" | "done";

export const NOTE_LIMIT = 2000; // caracteres por nota

export interface Note {
  doc: JSONContent; // documento do editor (árvore ProseMirror em JSON)
  text: string; // versão em texto puro: busca, export, agente
  updatedAt: string; // ISO
}

export interface Task {
  id: string; // uuid
  text: string;
  date: string; // "YYYY-MM-DD" — dia (local) ao qual a tarefa pertence
  status: Status;
  order: number;
  createdAt: string; // ISO
  completedAt?: string;
  note?: Note; // embutida: apagou a tarefa, a nota vai junto
}

export type View = "today" | "tomorrow" | "pending" | "history";
export type Mode = "list" | "kanban" | "notes";
