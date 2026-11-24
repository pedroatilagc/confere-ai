import { createContext, useContext } from "react";
import type { Task } from "../types";

export const NoteOpenerContext = createContext<(task: Task) => void>(() => {});
export const useOpenNote = () => useContext(NoteOpenerContext);
