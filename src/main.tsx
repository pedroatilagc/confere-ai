import React from "react";
import ReactDOM from "react-dom/client";
// Fontes empacotadas pelo Vite junto com o app (offline). Licença OFL.
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles/app.css";
import App from "./App";
import { TaskProvider } from "./state/TaskContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TaskProvider>
      <App />
    </TaskProvider>
  </React.StrictMode>,
);
