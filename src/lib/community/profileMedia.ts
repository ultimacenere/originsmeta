/**
 * Immagini caricate dal sito nel bucket `profile-media` (pacchetto VETRINA, 27/09/2026): foto profilo per tutti gli
 * iscritti, copertina per i ruoli con vetrina. Modulo minuscolo e senza import, apposta: `Avatar` (header, su ogni
 * pagina) lo usa per `avatarSrc` senza portarsi dietro il resto della vetrina. showcase.ts lo riesporta; le regole sono
 * uguali ai vincoli e alle policy del blocco VETRINA di supabase/schema.sql (showcase.test.ts le confronta).
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
/** Misura consigliata della copertina (3:1): la pagina la ritaglia larga. */
export const COVER_SUGGESTED = { width: 1500, height: 500 } as const;
/** Lato lungo massimo dello sfondo della pagina del profilo (27/09/2026): si riduce senza ritagliare. */
export const BACKGROUND_MAX_SIDE = 2560;
/** Misura consigliata dello sfondo (16:9, orizzontale): la pagina lo adatta alla finestra. */
export const BACKGROUND_SUGGESTED = { width: 1920, height: 1080 } as const;
/** Tipi ammessi, uguali a `allowed_mime_types` del bucket. */
export const MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
/**
 * File che un utente può tenere nel bucket (la policy di caricamento lo controlla, a ogni caricamento: tetto morbido,
 * non ferma i caricamenti lanciati tutti insieme). Il sito cancella i file vecchi dopo il salvataggio e prima di caricare.
 */
export const MEDIA_FILES_MAX = 12;
/**
 * Lo stesso tetto per i ruoli con vetrina e gli admin (29/09/2026, blocco IMMAGINI di schema.sql): oltre a foto,
 * copertina e sfondo hanno una copertina per guida e, Creator e Staff, un artwork per mazzo.
 */
export const MEDIA_FILES_MAX_SHOWCASE = 60;
/**
 * Evento della finestra lanciato dopo il cambio della foto profilo: il menu dell'account (header, che sopravvive alla
 * navigazione e legge il profilo solo al montaggio) lo ascolta e rilegge la foto.
 */
export const PROFILE_UPDATED_EVENT = "om:profile-updated";
/** Nome di un file caricato (lo sceglie il sito: un uuid) con l'estensione del tipo. Uguale nei vincoli SQL. */
export const MEDIA_FILE_RE = "[A-Za-z0-9_-]{8,64}\\.(png|jpg|jpeg|webp)";
/**
 * Il nome che il sito dà a un file caricato (`uploadMedia`: un uuid minuscolo con l'estensione del tipo, sempre nuovo).
 * La policy di caricamento del bucket accetta solo questo (revisione del 27/09/2026, `storage.filename(name) ~ …` nel
 * blocco VETRINA di schema.sql): chi salta il sito non sceglie nomi a piacere. Più stretto di `MEDIA_FILE_RE`, che
 * resta il vincolo dei percorsi salvati nel profilo.
 */
export const MEDIA_UPLOAD_NAME_RE = String.raw`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$`;
/**
 * Una foto di Discord (dai metadati dell'accesso OAuth). Stessa espressione di `handle_new_user` e di
 * `profile_discord_avatar` in schema.sql (showcase.test.ts le confronta): solo i due host delle immagini di Discord.
 */
export const DISCORD_AVATAR_RE = String.raw`^https://(cdn\.discordapp\.com|media\.discordapp\.net)/[A-Za-z0-9/_.-]{1,255}(\?size=[0-9]{1,4})?$`;
const DISCORD_AVATAR = new RegExp(DISCORD_AVATAR_RE);

/**
 * Le cartelle di un utente nel bucket: foto profilo, copertina e sfondo della vetrina (27/09/2026) e, dal 29/09/2026, le
 * copertine delle guide (`guide`, chi pubblica guide) e l'artwork dei mazzi (`deck`, Creator e Staff). La policy di
 * caricamento e quella di cancellazione le conoscono tutte (blocco IMMAGINI di supabase/schema.sql).
 */
export type MediaKind = "avatar" | "cover" | "background" | "guide" | "deck";
export const MEDIA_KINDS: readonly MediaKind[] = ["avatar", "cover", "background", "guide", "deck"];

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
 * `avatar_url` se è una foto che il sito sa di poter mostrare: una foto di Discord (`DISCORD_AVATAR_RE`) o una foto
 * caricata nel bucket del progetto (`base`, cartella avatar). Altrimenti null: difesa in più rispetto al database
 * (revisione del 27/09/2026), perché fino a quel giorno `handle_new_user` copiava qualsiasi indirizzo dai metadati del
 * magic link, che manda il browser (pixel traccianti, immagini non moderate su /u, sui mazzi e sui tornei).
 */
export function safeAvatarUrl(url: string | null | undefined, base: string): string | null {
  if (typeof url !== "string" || !url) return null;
  if (DISCORD_AVATAR.test(url)) return url;
  const prefix = mediaPublicUrl(base, "");
  return url.startsWith(prefix) && anyMediaPathOk("avatar", url.slice(prefix.length)) ? url : null;
}

/**
 * La foto da mostrare per un profilo: prima quella caricata dal sito (`avatar_path`, se la lettura la porta), poi
 * `avatar_url` (solo Discord o il bucket del sito, `safeAvatarUrl`). Il trigger del database tiene comunque
 * `avatar_url` allineata alla foto caricata (e la riporta a quella di Discord quando la si toglie), quindi anche le
 * letture che non chiedono `avatar_path` mostrano la foto giusta.
 */
export function avatarSrc(profile: { avatar_url?: string | null; avatar_path?: string | null } | null | undefined, base: string): string | null {
  if (!profile) return null;
  if (anyMediaPathOk("avatar", profile.avatar_path)) return mediaPublicUrl(base, profile.avatar_path);
  return safeAvatarUrl(profile.avatar_url, base);
}
