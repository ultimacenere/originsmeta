/**
 * Immagini caricate dal sito nel bucket `profile-media` (pacchetto VETRINA, 27/09/2026): foto profilo per tutti gli
 * iscritti, copertina per i ruoli con vetrina. Modulo minuscolo e senza import, apposta: `Avatar` (header, su ogni
 * pagina) lo usa per `avatarSrc` senza portarsi dietro il resto della vetrina. showcase.ts lo riesporta; le regole sono
 * uguali ai vincoli e alle policy di supabase/wave2-VETRINA.sql (showcase.test.ts le confronta).
 */

/** Bucket pubblico dello Storage con foto profilo e copertine, una cartella per utente: `<id>/avatar/…`, `<id>/cover/…`. */
export const PROFILE_MEDIA_BUCKET = "profile-media";
/**
 * Peso massimo della foto profilo (1 MB): lo impone il trigger quando si salva la foto. Il caricamento lo limita solo il
 * bucket (2 MB): lo Storage prova la policy prima di conoscere il peso del file.
 */
export const AVATAR_MAX_BYTES = 1024 * 1024;
/** Peso massimo della copertina (2 MB): il limite del bucket, e il trigger quando si salva la vetrina. */
export const COVER_MAX_BYTES = 2 * 1024 * 1024;
/** Lato della foto profilo caricata (quadrata, ritagliata al centro nel browser). */
export const AVATAR_SIZE = 512;
/** Lato lungo massimo della copertina caricata (la pagina la ritaglia larga con object-fit). */
export const COVER_MAX_SIDE = 1920;
/** Tipi ammessi, uguali a `allowed_mime_types` del bucket. */
export const MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
/**
 * File che un utente può tenere nel bucket (la policy di caricamento lo controlla, a ogni caricamento: tetto morbido,
 * non ferma i caricamenti lanciati tutti insieme). Il sito cancella i file vecchi dopo il salvataggio e prima di caricare.
 */
export const MEDIA_FILES_MAX = 12;
/**
 * Evento della finestra lanciato dopo il cambio della foto profilo: il menu dell'account (header, che sopravvive alla
 * navigazione e legge il profilo solo al montaggio) lo ascolta e rilegge la foto.
 */
export const PROFILE_UPDATED_EVENT = "om:profile-updated";
/** Nome di un file caricato (lo sceglie il sito: un uuid) con l'estensione del tipo. Uguale nei vincoli SQL. */
export const MEDIA_FILE_RE = "[A-Za-z0-9_-]{8,64}\\.(png|jpg|jpeg|webp)";

export type MediaKind = "avatar" | "cover";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Il percorso di un'immagine caricata è nella cartella giusta di QUESTO utente? (`<id>/avatar/<file>` o `<id>/cover/<file>`) */
export function mediaPathOk(userId: string, kind: MediaKind, path: unknown): path is string {
  if (typeof path !== "string" || !UUID_RE.test(userId)) return false;
  return new RegExp(`^${userId}/${kind}/${MEDIA_FILE_RE}$`).test(path);
}

/** Stesso controllo senza conoscere l'utente (profili letti insieme ai mazzi): una cartella con un id valido. */
export function anyMediaPathOk(kind: MediaKind, path: unknown): path is string {
  return typeof path === "string" && new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/${kind}/${MEDIA_FILE_RE}$`).test(path);
}

/** Estensione del file da caricare, dal tipo del blob (il browser lo converte quasi sempre in WebP). */
export function mediaExtension(type: string): "webp" | "png" | "jpg" | null {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return null;
}

/** Indirizzo pubblico di un file del bucket (`base` = URL del progetto Supabase, src/lib/supabase/env.ts). */
export function mediaPublicUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${PROFILE_MEDIA_BUCKET}/${path}`;
}

/**
 * La foto da mostrare per un profilo: prima quella caricata dal sito (`avatar_path`, se la lettura la porta), poi
 * `avatar_url`. Il trigger del database tiene comunque `avatar_url` allineata alla foto caricata (e la riporta a quella
 * di Discord quando la si toglie), quindi anche le letture che non chiedono `avatar_path` mostrano la foto giusta.
 */
export function avatarSrc(profile: { avatar_url?: string | null; avatar_path?: string | null } | null | undefined, base: string): string | null {
  if (!profile) return null;
  if (anyMediaPathOk("avatar", profile.avatar_path)) return mediaPublicUrl(base, profile.avatar_path);
  return profile.avatar_url || null;
}
