const SHORTCUTS: [string, string][] = [
  ["Ctrl 1–4", "Hoje · Amanhã · Pendentes · Histórico"],
  ["Ctrl K", "Alternar lista, kanban e notas"],
  ["Ctrl Shift H", "Grifar texto na nota"],
  ["Ctrl ,", "Configurações"],
  ["N", "Nova tarefa"],
  ["↑ ↓", "Andar entre tarefas"],
  ["Espaço", "Concluir ou reabrir"],
  ["Enter · F2", "Editar"],
  ["Delete", "Apagar"],
  ["Esc", "Cancelar ou fechar"],
];

export function ShortcutsHelp({ onClose }: { onClose(): void }) {
  return (
    <div className="help" onClick={onClose}>
      <div className="help-card" onClick={(e) => e.stopPropagation()}>
        <h2>Atalhos</h2>
        <dl>
          {SHORTCUTS.map(([k, v]) => (
            <div key={k}>
              <dt>{v}</dt>
              <dd>
                <kbd>{k}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
