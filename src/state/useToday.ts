import { useEffect, useState } from "react";
import { msUntilMidnight, todayKey } from "../lib/dates";

export function useToday(): string {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    const check = () => setToday(todayKey());
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
