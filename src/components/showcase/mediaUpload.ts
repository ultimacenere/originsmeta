import type { Db } from "@/lib/supabase/public";
import { MEDIA_TYPES, PROFILE_MEDIA_BUCKET, mediaExtension, type MediaKind } from "@/lib/community/showcase";
import { MEDIA_KINDS } from "@/lib/community/profileMedia";

/**
 * Caricamenti della vetrina dal browser allo Storage (pacchetto VETRINA, 27/09/2026), come le copertine dei tornei: mai
 * attraverso le Server Action (limite di 1 MB). Solo nel browser: canvas, createImageBitmap, crypto.randomUUID.
 *
 * L'immagine si ricodifica SEMPRE (WebP, o JPEG dove il browser non sa scrivere WebP): peso ridotto e niente metadati
 * EXIF (posizione, fotocamera). Se il browser non ci riesce il file non si carica, invece di mandare l'originale.
 */

export class MediaError extends Error {
  /** `limit`: lo Storage ha rifiutato il file anche dopo aver tolto quelli non usati (tetto dei file, o permesso) */
  constructor(public code: "type" | "tooBig" | "upload" | "limit") {
    super(code);
  }
}

/** Fondo delle zone trasparenti: il blu notte delle schede (token `night`), mai il nero che darebbe il JPEG. */
const TRANSPARENT_FILL = "#182238";

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Come ridurre un'immagine: vedi `encodeImageSized`. */
export type EncodeOptions = { square?: number; aspect?: number; maxSide?: number; box?: { width: number; height: number }; maxBytes: number };

/**
 * Ricodifica un'immagine: `square` = ritaglio quadrato al centro e lato massimo (foto profilo); `aspect` (larghezza /
 * altezza) = ritaglio al centro in quelle proporzioni e lato lungo al massimo `maxSide` (copertina di una guida in 16:9,
 * artwork di un mazzo in 5:7, dal 29/09/2026); `box` = nessun ritaglio, l'immagine intera ridotta finché sta nel
 * riquadro (tavole dei fumetti, 1080 × 1920); altrimenti solo il lato lungo al massimo `maxSide` (copertina e sfondo
 * della vetrina). Lancia `MediaError("type")` per un file che non è un'immagine ammessa o che il browser non sa
 * leggere, `MediaError("tooBig")` se anche ridotta supera `maxBytes`.
 */
export async function encodeImage(file: File, opts: EncodeOptions): Promise<Blob> {
  return (await encodeImageSized(file, opts)).blob;
}

/** `encodeImage` con le misure dell'immagine ricodificata (le tavole dei fumetti le salvano, per riservare lo spazio). */
export async function encodeImageSized(file: File, opts: EncodeOptions): Promise<{ blob: Blob; width: number; height: number }> {
  if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) throw new MediaError("type");
  let bitmap: ImageBitmap;
  try {
    // l'orientamento scritto dalla fotocamera (EXIF): senza, dove il predefinito è "none", le foto del telefono escono girate
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new MediaError("type");
  }
  const { width: w, height: h } = bitmap;
  let sx = 0;
  let sy = 0;
  let sw = w;
  let sh = h;
  let dw: number;
  let dh: number;
  if (opts.square) {
    const side = Math.min(w, h);
    sx = Math.round((w - side) / 2);
    sy = Math.round((h - side) / 2);
    sw = sh = side;
    dw = dh = Math.max(1, Math.min(opts.square, side));
  } else if (opts.box) {
    // intera, ridotta finché non sta nel riquadro (mai ingrandita)
    const scale = Math.min(1, opts.box.width / w, opts.box.height / h);
    dw = Math.max(1, Math.round(w * scale));
    dh = Math.max(1, Math.round(h * scale));
  } else if (opts.aspect && opts.aspect > 0) {
    // ritaglio al centro nelle proporzioni chieste, poi il lato lungo entro maxSide
    if (w / h > opts.aspect) {
      sw = Math.max(1, Math.round(h * opts.aspect));
      sx = Math.round((w - sw) / 2);
    } else {
      sh = Math.max(1, Math.round(w / opts.aspect));
      sy = Math.round((h - sh) / 2);
    }
    const scale = Math.min(1, (opts.maxSide ?? 1920) / Math.max(sw, sh));
    dw = Math.max(1, Math.round(sw * scale));
    dh = Math.max(1, Math.round(sh * scale));
  } else {
    const scale = Math.min(1, (opts.maxSide ?? 1920) / Math.max(w, h));
    dw = Math.max(1, Math.round(w * scale));
    dh = Math.max(1, Math.round(h * scale));
  }
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new MediaError("type");
  // un PNG trasparente ricodificato in JPEG (Safari non scrive WebP) diventerebbe nero pieno: prima il blu notte
  ctx.fillStyle = TRANSPARENT_FILL;
  ctx.fillRect(0, 0, dw, dh);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  bitmap.close();
  // WebP; Safari non lo scrive e restituirebbe un PNG pesante: allora JPEG. Qualità più bassa se il peso non basta.
  for (const quality of [0.85, 0.72, 0.6]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (!blob || !mediaExtension(blob.type)) throw new MediaError("type");
    if (blob.size <= opts.maxBytes) return { blob, width: dw, height: dh };
  }
  throw new MediaError("tooBig");
}

/**
 * Carica il file nella cartella dell'utente (`<id>/<kind>/<uuid>.<ext>`, nome sempre nuovo) e ne restituisce il percorso.
 * Cache di un'ora (il valore predefinito dello Storage, come le copertine dei tornei): una foto sostituita o tolta, che
 * il sito cancella, non resta nelle cache per mesi. Si riprova una volta; se lo Storage ha rifiutato il file (per esempio
 * il tetto dei 12 file, pieno di immagini caricate e mai salvate), prima si tolgono i file non in uso di tutte le
 * cartelle: quelli in uso (profilo, guide, mazzi, fumetti) la policy non li lascia cancellare.
 */
export async function uploadMedia(sb: Db, userId: string, kind: MediaKind, blob: Blob): Promise<string> {
  const ext = mediaExtension(blob.type);
  if (!ext) throw new MediaError("type");
  const put = async (): Promise<{ path: string } | { denied: boolean }> => {
    const path = `${userId}/${kind}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from(PROFILE_MEDIA_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    if (!error) return { path };
    // rifiuto della policy (403, "row-level security"): tetto dei file o permesso; il resto è rete o Storage
    const status = (error as { status?: number; statusCode?: string | number }).status ?? Number((error as { statusCode?: string | number }).statusCode);
    return { denied: status === 403 || /row-level security|policy/i.test(error.message) };
  };
  const first = await put();
  if ("path" in first) return first.path;
  // rifiutato: si fa spazio (solo allora: dopo un errore di rete si riprova e basta, senza toccare i file). Tutte le
  // cartelle: i file in uso (profilo, copertine delle guide, artwork dei mazzi) la policy non li lascia cancellare
  if (first.denied) {
    for (const k of MEDIA_KINDS) await cleanupMedia(sb, userId, k, null);
  }
  const second = await put();
  if ("path" in second) return second.path;
  throw new MediaError(second.denied ? "limit" : "upload");
}

/**
 * Cancella i file della cartella tranne `keep` (quello in uso o appena caricato): le immagini sostituite, tolte o
 * caricate e non salvate. La policy del bucket non lascia cancellare il file in uso sul profilo; gli errori si ignorano
 * (si riprova al prossimo giro, e i file mai usati li toglie anche `scripts/clear-profile-media.mjs --orphans`).
 */
export async function cleanupMedia(sb: Db, userId: string, kind: MediaKind, keep: string | null): Promise<void> {
  try {
    const folder = `${userId}/${kind}`;
    const { data } = await sb.storage.from(PROFILE_MEDIA_BUCKET).list(folder, { limit: 100 });
    const stale = (data ?? []).map((f) => `${folder}/${f.name}`).filter((p) => p !== keep);
    if (stale.length) await sb.storage.from(PROFILE_MEDIA_BUCKET).remove(stale);
  } catch {
    // niente: resta per il prossimo giro
  }
}
