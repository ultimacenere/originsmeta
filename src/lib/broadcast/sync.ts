/**
 * Broadcasting OM (prototipo del 16/10/2026): come la regia parla con l'overlay senza database.
 *
 * - Stesso browser (due finestre o schede): BroadcastChannel più localStorage, aggiornamento al volo a ogni clic della
 *   regia. Non vale fra il pannello (dock) di OBS e una sua fonte browser: OBS dà ai pannelli un profilo del browser
 *   separato (verificato il 05/11/2026 su OBS 32.2.2).
 * - Altrove: l'indirizzo dell'overlay porta lo stato nell'hash (#s=B1.…), fotografato al momento della copia.
 *
 * Dal 05/11/2026 c'è la diretta dal sito (live.ts, BroadcastLiveBox): la regia salva lo stato su originsmeta.com e
 * l'overlay con ?id=… lo rilegge da lì, su qualunque PC.
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
