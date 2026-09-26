import type { Db } from "@/lib/supabase/public";
import { MEDIA_TYPES, PROFILE_MEDIA_BUCKET, mediaExtension, type MediaKind } from "@/lib/community/showcase";

/**
 * Caricamenti della vetrina dal browser allo Storage (pacchetto VETRINA, 27/09/2026), come le copertine dei tornei: mai
 * attraverso le Server Action (limite di 1 MB). Solo nel browser: canvas, createImageBitmap, crypto.randomUUID.
 *
 * L'immagine si ricodifica SEMPRE (WebP, o JPEG dove il browser non sa scrivere WebP): peso ridotto e niente metadati
 * EXIF (posizione, fotocamera). Se il browser non ci riesce il file non si carica, invece di mandare l'originale.
 */

export class MediaError extends Error {
  constructor(public code: "type" | "tooBig" | "upload") {
    super(code);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Ricodifica un'immagine: `square` = ritaglio quadrato al centro e lato massimo (foto profilo), altrimenti lato lungo al
 * massimo `maxSide` (copertina). Lancia `MediaError("type")` per un file che non è un'immagine ammessa o che il browser
 * non sa leggere, `MediaError("tooBig")` se anche ridotta supera `maxBytes`.
 */
export async function encodeImage(file: File, opts: { square?: number; maxSide?: number; maxBytes: number }): Promise<Blob> {
  if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) throw new MediaError("type");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
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
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  bitmap.close();
  // WebP; Safari non lo scrive e restituirebbe un PNG pesante: allora JPEG. Qualità più bassa se il peso non basta.
  for (const quality of [0.85, 0.72, 0.6]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (!blob || !mediaExtension(blob.type)) throw new MediaError("type");
    if (blob.size <= opts.maxBytes) return blob;
  }
  throw new MediaError("tooBig");
}

/** Carica il file nella cartella dell'utente (`<id>/<kind>/<uuid>.<ext>`, nome sempre nuovo) e ne restituisce il percorso. */
export async function uploadMedia(sb: Db, userId: string, kind: MediaKind, blob: Blob): Promise<string> {
  const ext = mediaExtension(blob.type);
  if (!ext) throw new MediaError("type");
  const path = `${userId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(PROFILE_MEDIA_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new MediaError("upload");
  return path;
}

/**
 * Cancella i file della cartella tranne `keep` (quello in uso): le immagini sostituite, tolte o caricate e non salvate.
 * La policy del bucket non lascia cancellare il file in uso sul profilo; gli errori si ignorano (si riprova al prossimo
 * salvataggio, e il bucket tiene al massimo 12 file per utente).
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
