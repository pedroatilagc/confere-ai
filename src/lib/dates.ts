// Datas como "YYYY-MM-DD" no fuso LOCAL do Windows (America/Sao_Paulo).
// Nunca usar toISOString() aqui: ele converte para UTC e, depois das 21h
// em São Paulo, já devolveria o dia seguinte.
const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d); // meia-noite local
}

export const todayKey = () => toKey(new Date());

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n); // setDate cuida da virada de mês/ano
  return toKey(d);
}

const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

// "segunda-feira, 23 de novembro" -> "segunda, 23 de novembro"
export const formatDay = (key: string) => fmt.format(fromKey(key)).replace("-feira", "");

export function msUntilMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 500; // margem para não disparar 1 ms antes
}
