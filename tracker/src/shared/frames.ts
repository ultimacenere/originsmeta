/**
 * Modalità cattura dello scanner (10/10/2026, docs/tracker.md "Scanner dello schermo"): regole pure, senza Electron né
 * Node, usate dal processo principale (main/frames.ts) e dalla finestra nascosta che riprende il gioco (frames/).
 *
 * Con la patch 0.7 il gioco non scrive più il replay (né la build del 04/10 né il ramo `communityplaytest`), quindi le
 * carte giocate si leggeranno dallo schermo. Prima serve un archivio di fotogrammi veri per tarare il riconoscitore:
 * con `--frames` l'app riprende solo la finestra del gioco e salva i fotogrammi sul PC, mai altrove.
 */

/** Nomi della finestra del gioco (il titolo della finestra Unity è il nome del prodotto: app.info della demo). */
export const GAME_WINDOWS = ["Origins TCG Demo", "Origins TCG", "Origins TCG Playtest"] as const;

/** Un fotogramma ogni mezzo secondo: le giocate restano a schermo più a lungo. */
export const FRAME_MS = 500;
/** Lato del fotogramma ridotto (16:9) su cui si misura se lo schermo è cambiato. */
export const SIGNATURE_W = 48;
export const SIGNATURE_H = 27;
/** Differenza media (0–255) sotto la quale il fotogramma è uguale al precedente e non si salva (menu fermi, attese). */
export const SAME_FRAME_DIFF = 1.5;
/** Tetto dei fotogrammi salvati in una sessione dell'app: 4 GB, poi la cattura si ferma. */
export const MAX_SESSION_BYTES = 4 * 1024 ** 3;
/** Tetto di un fotogramma (un JPEG 4K di qualità 0,9 sta sotto i 3 MB). */
export const MAX_FRAME_BYTES = 8 * 1024 ** 2;

export type WindowSource = { id: string; name: string };

/** La finestra del gioco fra quelle aperte: solo un titolo esatto, così non si riprende mai un'altra finestra. */
export function pickGameWindow(sources: readonly WindowSource[], titles: readonly string[] = GAME_WINDOWS): WindowSource | null {
  for (const title of titles) {
    const hit = sources.find((s) => s.name === title);
    if (hit) return hit;
  }
  return null;
}

/** Impronta in grigi di un fotogramma ridotto (dati RGBA di un canvas `SIGNATURE_W × SIGNATURE_H`). */
export function frameSignature(rgba: ArrayLike<number>): Uint8Array {
  const out = new Uint8Array(Math.floor(rgba.length / 4));
  for (let i = 0; i < out.length; i++) {
    const p = i * 4;
    out[i] = Math.round(0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]);
  }
  return out;
}

/** Differenza media fra due impronte (Infinity se non si confrontano). */
export function signatureDiff(a: Uint8Array | null, b: Uint8Array): number {
  if (!a || a.length !== b.length || !a.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/** Nome della cartella di una sessione di cattura: data e ora locali, ordinabili. */
export function sessionDirName(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

/** Nome del file di un fotogramma: millisecondi dall'inizio della sessione, a 9 cifre (oltre 11 giorni). */
export function frameFileName(sinceStartMs: number): string {
  return `${String(Math.max(0, Math.floor(sinceStartMs))).padStart(9, "0")}.jpg`;
}

/** Un JPEG vero e non troppo grande: l'unica cosa che la finestra nascosta può far scrivere sul disco. */
export function isJpegFrame(data: Uint8Array): boolean {
  return data.length > 4 && data.length <= MAX_FRAME_BYTES && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}
