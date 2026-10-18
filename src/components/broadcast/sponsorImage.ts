import { MediaError, encodeImageSized } from "@/components/showcase/mediaUpload";
import { SPONSOR_FILE_MAX_BYTES, SPONSOR_FORMATS, SPONSOR_IMAGE_MAX_BYTES, type SponsorKind } from "@/lib/broadcast/state";

/**
 * Immagine di uno sponsor scelta dal computer (Broadcasting OM, 19/10/2026): ricodificata nel browser con lo stesso
 * codice delle immagini della vetrina (WebP, o JPEG dove il browser non lo scrive; niente EXIF) alle misure del formato
 * (`SPONSOR_FORMATS`): il logo intero dentro 496 × 208, il bannerino ritagliato al centro in 69:40 e portato a 552 × 320.
 * Mai ingrandita: un'immagine più piccola del minimo si rifiuta. Il risultato è un data URL che resta nel browser
 * della regia e dell'overlay (nessun caricamento sul server).
 */
export type SponsorImageError = "type" | "fileTooBig" | "tooSmall" | "tooBig";
export type SponsorImageResult = { ok: true; src: string; width: number; height: number } | { ok: false; error: SponsorImageError };

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function sponsorImage(file: File, kind: SponsorKind): Promise<SponsorImageResult> {
  if (file.size > SPONSOR_FILE_MAX_BYTES) return { ok: false, error: "fileTooBig" };
  const f = SPONSOR_FORMATS[kind];
  try {
    const out =
      kind === "banner"
        ? await encodeImageSized(file, { aspect: f.width / f.height, maxSide: f.width, maxBytes: SPONSOR_IMAGE_MAX_BYTES })
        : await encodeImageSized(file, { box: { width: f.width, height: f.height }, maxBytes: SPONSOR_IMAGE_MAX_BYTES });
    const small = kind === "banner" ? out.width < f.shown.width || out.height < f.shown.height : out.width < f.shown.width && out.height < f.shown.height;
    if (small) return { ok: false, error: "tooSmall" };
    return { ok: true, src: await toDataUrl(out.blob), width: out.width, height: out.height };
  } catch (e) {
    if (e instanceof MediaError) return { ok: false, error: e.code === "tooBig" ? "tooBig" : "type" };
    return { ok: false, error: "type" };
  }
}
