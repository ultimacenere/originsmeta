import { useEffect, useState } from "react";
import { useMounted } from "./useMounted";

/**
 * L'ora attuale che avanza ogni `intervalMs` finché `active` (conti alla rovescia dei tornei, 05/10/2026). Prima del
 * montaggio vale null, così l'HTML del server e il primo render nel browser coincidono (niente differenze di idratazione).
 */
export function useNow(intervalMs = 1000, active = true): number | null {
  const mounted = useMounted();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, active]);
  return mounted ? now : null;
}
