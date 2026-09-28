import { useEffect, useState } from "react";
import { safeLiveUsers, type LiveResponse, type LiveUsers } from "./twitchLive";

/**
 * Chi è in diretta, letto nel browser da /api/live (pacchetto CREATOR, 26/09/2026; condiviso dal 28/09/2026 fra il
 * badge LIVE, la voce "Ora live" della striscia del calendario e la pagina /live). Una richiesta sola per pagina anche
 * con tanti lettori: la promessa è condivisa e vale 90 secondi, come la cache della rotta, quindi a Twitch arriva al
 * massimo una richiesta ogni minuto e mezzo qualunque sia il traffico. Le pagine restano statiche o ISR.
 * Solo per i componenti client (usa gli hook di React).
 */

const TTL_MS = 90_000;
let shared: { at: number; promise: Promise<LiveResponse | null> } | null = null;

/** La risposta di /api/live, dalla promessa condivisa (rinnovata dopo 90 secondi); null se la rotta non risponde. */
export function loadLive(): Promise<LiveResponse | null> {
  if (!shared || Date.now() - shared.at > TTL_MS) {
    shared = {
      at: Date.now(),
      promise: fetch("/api/live")
        .then((r) => (r.ok ? (r.json() as Promise<LiveResponse>) : null))
        .catch(() => null),
    };
  }
  return shared.promise;
}

/**
 * Chi è in diretta adesso, ricontrollato da `safeLiveUsers`; null finché la prima risposta non arriva. Con `refreshMs`
 * si rilegge a intervalli, solo a scheda visibile (la striscia del calendario resta montata fra una pagina e l'altra,
 * la pagina /live resta aperta). `enabled` è false quando il sito non ha le chiavi di Twitch.
 */
export function useLiveUsers(refreshMs?: number): { users: LiveUsers; enabled: boolean } | null {
  const [state, setState] = useState<{ users: LiveUsers; enabled: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    const read = () => {
      loadLive().then((res) => {
        if (alive) setState({ users: safeLiveUsers(res?.users), enabled: res?.enabled === true });
      });
    };
    read();
    if (!refreshMs) {
      return () => {
        alive = false;
      };
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") read();
    }, refreshMs);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);
  return state;
}
