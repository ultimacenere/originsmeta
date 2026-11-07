import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MATCH_ALERTS_KEY, notifyState, parseAlertPrefs, playChime, showNotification, wakeAudio, type MatchAlertPrefs, type NotifyState } from "./matchAlerts";
import { useMounted } from "../useMounted";

const listeners = new Set<() => void>();
/** Vale quando il browser non lascia scrivere nel localStorage: la scelta dura fino alla chiusura della pagina. */
let inMemory: string | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readSaved() {
  try {
    return localStorage.getItem(MATCH_ALERTS_KEY) ?? inMemory;
  } catch {
    return inMemory;
  }
}

function save(prefs: MatchAlertPrefs) {
  inMemory = JSON.stringify(prefs);
  try {
    localStorage.setItem(MATCH_ALERTS_KEY, inMemory);
  } catch {
    /* storage non disponibile */
  }
  listeners.forEach((listener) => listener());
}

/**
 * Scelte di chi gioca sugli avvisi, salvate nel browser. `permission` è null finché la pagina non è montata (il server non
 * sa niente del browser). `enable` va chiamata da un clic: è lì che il browser chiede il consenso alla persona.
 */
export function useMatchAlerts() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const prefs = useMemo(() => parseAlertPrefs(raw), [raw]);
  const mounted = useMounted();
  const [answered, setAnswered] = useState<NotifyState | null>(null);
  const permission = answered ?? (mounted ? notifyState() : null);

  // dopo un ricaricamento il suono si sblocca al primo clic o tasto sulla pagina
  useEffect(() => {
    if (!prefs.sound) return;
    const wake = () => void wakeAudio();
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [prefs.sound]);

  const enable = async (title: string, body: string) => {
    wakeAudio();
    if (typeof Notification === "undefined") return setAnswered("unsupported");
    const answer = await Notification.requestPermission();
    if (answer !== "granted") return setAnswered(answer);
    // la prima notifica è anche la prova che qui funzionano davvero
    const works = showNotification(title, { body }) !== null;
    setAnswered(works ? "granted" : "unsupported");
    save({ notify: works, sound: true });
    void playChime();
  };

  const disable = () => save({ ...prefs, notify: false });

  const setSound = (sound: boolean) => {
    save({ ...prefs, sound });
    if (sound) void playChime();
  };

  return { prefs, permission, enable, disable, setSound };
}
