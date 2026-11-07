/**
 * Avviso "la tua partita è pronta" (07/11/2026, richiesta di Gami durante EndGame First Blood): notifica del browser su
 * consenso esplicito e suono disattivabile. Tutto nel browser: si appoggia alla lettura che MatchReadyWatcher fa già ogni
 * 20 secondi, nessuna richiesta in più a Supabase. Niente service worker: con la pagina chiusa non arriva niente.
 */
export const MATCH_ALERTS_KEY = "originsmeta.matchAlerts.v1";

export type MatchAlertPrefs = { notify: boolean; sound: boolean };
export type NotifyState = NotificationPermission | "unsupported";

const ACTIVE = new Set(["pending", "reported", "disputed"]);

export function parseAlertPrefs(raw: string | null): MatchAlertPrefs {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return { notify: v?.notify === true, sound: v?.sound === true };
  } catch {
    return { notify: false, sound: false };
  }
}

/** L'id della partita se si può giocare: due giocatori e referto non chiuso. */
export function readyMatchId(m: { id: string; player_a: string | null; player_b: string | null; status: string } | null): string | null {
  return m && m.player_a && m.player_b && ACTIVE.has(m.status) ? m.id : null;
}

/** Una volta sola per partita e solo finché chi gioca non è entrato nella stanza. */
export function shouldAlert(readyId: string | null, seen: boolean, alerted: string | null): boolean {
  return readyId !== null && !seen && readyId !== alerted;
}

export function notifyState(): NotifyState {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

/** Null se non parte: Chrome su Android ha `Notification` ma il costruttore lancia un errore (vuole un service worker). */
export function showNotification(title: string, options: NotificationOptions, onClick?: () => void): Notification | null {
  if (notifyState() !== "granted") return null;
  try {
    const note = new Notification(title, options);
    if (onClick) note.onclick = onClick;
    return note;
  } catch {
    return null;
  }
}

let audio: AudioContext | null = null;

/** Il browser fa suonare una pagina solo dopo un gesto: va chiamata da un clic o da un tasto, poi il suono resta sbloccato. */
export function wakeAudio(): AudioContext | null {
  try {
    audio ??= new AudioContext();
    void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

/** Tre note, mezzo secondo, senza file da scaricare. Senza un gesto sulla pagina resta muto, e non suona in ritardo dopo. */
export async function playChime() {
  const ctx = wakeAudio();
  if (!ctx) return;
  await Promise.race([ctx.resume(), new Promise((done) => setTimeout(done, 300))]);
  if (ctx.state !== "running") return;
  [880, 1175, 1568].forEach((frequency, i) => {
    const at = ctx.currentTime + 0.02 + i * 0.16;
    const tone = ctx.createOscillator();
    const volume = ctx.createGain();
    tone.frequency.value = frequency;
    volume.gain.setValueAtTime(0.0001, at);
    volume.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    tone.connect(volume).connect(ctx.destination);
    tone.start(at);
    tone.stop(at + 0.5);
  });
}
