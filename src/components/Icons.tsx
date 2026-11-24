// Ícones pequenos em SVG inline (herdam a cor do texto via currentColor).

export function NoteIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M4 2.5h6l2.5 2.5v8.5H4z" strokeLinejoin="round" />
      <path d="M6 7.5h4.5M6 10h4.5" />
    </svg>
  );
}

export function HighlighterIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M9.5 2.5l4 4-5.5 5.5H5v-3z" />
      <path d="M3 14h4" />
    </svg>
  );
}
