/**
 * Riduce un'immagine nel browser (lato massimo `max` px) e la converte in WebP prima di caricarla nello
 * Storage: copertine e screenshot dei tornei restano leggeri e il piano Free di Supabase (1 GB) basta a lungo.
 * Se il browser non collabora restituisce il file originale: i limiti veri li impone il bucket.
 */
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    return blob ?? file;
  } catch {
    return file;
  }
}
