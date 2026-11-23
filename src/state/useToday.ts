import { useEffect, useState } from "react";
import { msUntilMidnight, todayKey } from "../lib/dates";

// Mantém "hoje" atualizado se o app ficar aberto na virada do dia.
// O timer cobre o caso normal. focus/visibilitychange cobrem o PC que
// hibernou (timers ficam parados durante a suspensão).
export function useToday(): string {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    const check = () => setToday(todayKey()); // mesma string = React não re-renderiza
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        check();
        schedule();
      }, msUntilMidnight());
    };
    schedule();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return today;
}
