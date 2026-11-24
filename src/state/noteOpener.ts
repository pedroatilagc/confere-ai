import { createContext, useContext } from "react";
import type { Task } from "../types";

// Abre a nota de uma tarefa. Quem decide *como* (modo Notas ou painel) é o App.
export const NoteOpenerContext = createContext<(task: Task) => void>(() => {});
export const useOpenNote = () => useContext(NoteOpenerContext);
