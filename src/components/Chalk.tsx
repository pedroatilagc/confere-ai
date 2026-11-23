// Traços de giz em SVG. pathLength={1} permite ao CSS "desenhar" o traço
// animando stroke-dashoffset de 1 para 0.

const STRIKES = [
  "M1 11 C 18 8, 38 13, 58 10 S 88 8, 99 12",
  "M1 10 C 14 13, 34 8, 54 11 S 84 13, 99 9",
  "M1 12 C 24 9, 44 12, 64 9 S 87 12, 99 10",
];

export function Strike({ seed }: { seed: string }) {
  const d = STRIKES[seed.charCodeAt(0) % STRIKES.length];
  return (
    <svg className="strike" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
      <path d={d} pathLength={1} />
    </svg>
  );
}

export function ChalkCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      className="check"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "desmarcar" : "marcar como feita"}
      tabIndex={-1}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path
          className="box"
          d="M4.3 5.1 C 9 4.6, 15 4.2, 19.7 4.9 C 19.4 10, 20.2 15, 19.5 19.6 C 14 20.1, 9 19.5, 4.6 20 C 4.7 15, 3.9 10, 4.3 5.1 Z"
        />
        {checked && (
          <path className="tick" pathLength={1} d="M7.2 12.6 C 8.5 13.8, 9.6 15, 10.6 16.3 C 12.5 12.6, 14.8 9.6, 18 6.4" />
        )}
      </svg>
    </button>
  );
}
