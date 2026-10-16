/**
 * Broadcasting OM (prototipo del 16/10/2026): come la regia parla con l'overlay senza database.
 *
 * - Stessa macchina e stesso browser (la regia come "dock" di OBS e l'overlay come sorgente browser di OBS, che hanno
 *   lo stesso profilo; oppure due finestre dello stesso browser): BroadcastChannel più localStorage, aggiornamento al
 *   volo a ogni clic della regia.
 * - Altrove: l'indirizzo dell'overlay porta lo stato nell'hash (#s=B1.…), fotografato al momento della copia.
 *
 * Il prodotto vero leggerà lo stato dal database (una riga per partita in diretta, aggiornata dalla regia e letta in
 * tempo reale): qui non c'è, per non toccare lo schema con un prototipo.
 */
export const BROADCAST_CHANNEL = "originsmeta-broadcast-v1";
export const BROADCAST_STORAGE_KEY = "originsmeta.broadcast.v1";

/** Sfondi dell'anteprima: schermate della partita dal materiale ufficiale (contenuto, mai interfaccia del sito). */
export const BROADCAST_BACKGROUNDS = [
  { id: "reveals", src: "/media/ss-board-reveals.webp" },
  { id: "clash", src: "/media/ss-board-clash.webp" },
  { id: "combat", src: "/media/ss-board-combat.webp" },
  { id: "locations", src: "/media/ss-board-locations.webp" },
  { id: "sea", src: "/media/ss-board-sea.webp" },
] as const;

export function backgroundSrc(id: string | null | undefined): string | null {
  return BROADCAST_BACKGROUNDS.find((b) => b.id === id)?.src ?? null;
}

export function readStored(): string | null {
  try {
    return window.localStorage.getItem(BROADCAST_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStored(code: string): void {
  try {
    window.localStorage.setItem(BROADCAST_STORAGE_KEY, code);
  } catch {
    /* navigazione privata o archivio pieno: resta il canale */
  }
}

export function openChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(BROADCAST_CHANNEL);
  } catch {
    return null;
  }
}
