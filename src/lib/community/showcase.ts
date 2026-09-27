import { cleanText, parseVideoUrl, type ParsedVideo } from "../videos";
import { UUID_RE, mediaPathOk } from "./profileMedia";

/**
 * Vetrina dei profili (pacchetto VETRINA, 27/09/2026: Pierluigi "OK A TUTTO, OTTIMO!!" alle proposte per i profili).
 * Per i ruoli con vetrina (Creator, Autore, Pro, Staff: `isShowcaseBadge` in badges.ts) la pagina /u/<nome> diventa
 * personalizzabile da /account, sezione "Personalizza la vetrina":
 *
 *   1. copertina in testa al profilo: uno degli 8 sfondi disegnati qui con la palette del sito (`COVER_PRESETS`: solo
 *      gradienti e motivi SVG, niente materiale Koin, che non si usa per l'interfaccia) oppure un'immagine caricata;
 *   2. foto profilo più grande sulla vetrina (la foto caricabile vale per TUTTI gli iscritti, anche community);
 *   3. colore d'accento per cornici e titoli (`ACCENTS`, contrasto ≥ 4,5:1 sul blu notte, lo controlla il test);
 *   4. Leggendaria del cuore, con l'illustrazione ufficiale e i crediti (contenuto, non interfaccia);
 *   5. mazzo in evidenza (uno dei SUOI mazzi pubblicati) e video in evidenza (le regole di `parseVideoUrl`);
 *   6. orari delle dirette: fino a 7 voci {giorno, ora, durata facoltativa} nel fuso del creator, mostrati a chi guarda
 *      nel SUO fuso (calcolo nel browser, `nextSlot`);
 *   7. frase di presentazione (80 caratteri, testo semplice).
 *
 * Nel database (blocco VETRINA di supabase/schema.sql) le stesse regole: vincoli sulle colonne, un
 * trigger che rifiuta i campi della vetrina a chi non ha il ruolo (avatar_path escluso: è di tutti), il controllo che il
 * mazzo in evidenza sia suo e pubblicato e che le immagini esistano nel bucket `profile-media`, con tipo e peso giusti.
 * Il test showcase.test.ts confronta codice e SQL.
 *
 * Funzioni pure, senza import dal server: le usano la Server Action, le pagine e i moduli nel browser; `node --test`.
 */

// ---------- immagini caricate (bucket profile-media): regole in profileMedia.ts ----------

export {
  AVATAR_MAX_BYTES,
  AVATAR_SIZE,
  COVER_MAX_BYTES,
  COVER_MAX_SIDE,
  DISCORD_AVATAR_RE,
  MEDIA_FILES_MAX,
  MEDIA_FILE_RE,
  MEDIA_TYPES,
  MEDIA_UPLOAD_NAME_RE,
  PROFILE_MEDIA_BUCKET,
  PROFILE_UPDATED_EVENT,
  anyMediaPathOk,
  avatarSrc,
  mediaExtension,
  mediaPathOk,
  mediaPublicUrl,
  safeAvatarUrl,
  type MediaKind,
} from "./profileMedia";

// ---------- copertine preimpostate ----------

/**
 * Gli 8 sfondi preimpostati (id stabili: stanno nel database, vincolo `profiles_cover_preset_check`). Disegnati qui con
 * la palette del sito (felt, night, mint, sky, gold, magenta, violetto, il gradiente del bottone primario): gradienti e
 * motivi SVG in linea, nessuna immagine esterna e nessun materiale Koin.
 */
export const COVER_PRESETS = ["aurora", "mint-tide", "sky-crystal", "gold-stars", "crimson-rays", "violet-nebula", "night-grid", "sunset"] as const;
export type CoverPreset = (typeof COVER_PRESETS)[number];
/** Copertina di un profilo vetrina che non ne ha scelta una. */
export const DEFAULT_COVER_PRESET: CoverPreset = "aurora";

export function isCoverPreset(value: unknown): value is CoverPreset {
  return typeof value === "string" && (COVER_PRESETS as readonly string[]).includes(value);
}

export type CoverStyle = { backgroundColor: string; backgroundImage: string; backgroundSize: string; backgroundPosition: string };

/** Un motivo SVG come immagine di sfondo (data URI, niente richieste). */
function svg(markup: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${markup}</svg>`)}")`;
}

const WAVES = svg(
  "width='160' height='48' viewBox='0 0 160 48'><path d='M0 30 Q20 14 40 30 T80 30 T120 30 T160 30' fill='none' stroke='#31e3bd' stroke-opacity='.28' stroke-width='2'/><path d='M0 42 Q20 26 40 42 T80 42 T120 42 T160 42' fill='none' stroke='#31e3bd' stroke-opacity='.14' stroke-width='2'/>",
);
const FACETS = svg(
  "width='64' height='64' viewBox='0 0 64 64'><path d='M32 2 L62 32 L32 62 L2 32 Z M32 2 L32 62 M2 32 L62 32' fill='none' stroke='#3fc4e8' stroke-opacity='.22' stroke-width='1.5'/>",
);
const STARS = (color: string, opacity: number) =>
  svg(
    `width='120' height='80' viewBox='0 0 120 80'><g fill='${color}' fill-opacity='${opacity}'><circle cx='12' cy='14' r='1.6'/><circle cx='58' cy='8' r='1'/><circle cx='96' cy='22' r='1.8'/><circle cx='34' cy='52' r='1.2'/><circle cx='80' cy='62' r='1.5'/><circle cx='110' cy='70' r='1'/><path d='M66 36 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z'/></g>`,
  );
const GRID = svg(
  "width='40' height='40' viewBox='0 0 40 40'><path d='M40 0 H0 V40' fill='none' stroke='#3fc4e8' stroke-opacity='.16' stroke-width='1'/><circle cx='0' cy='0' r='1.8' fill='#31e3bd' fill-opacity='.45'/>",
);

// I colori dentro gli SVG si scrivono in chiaro (#31e3bd): li codifica `svg()` con encodeURIComponent.
const COVER_STYLES: Record<CoverPreset, CoverStyle> = {
  aurora: {
    backgroundColor: "#0e071f",
    backgroundImage: "linear-gradient(115deg, #0e071f 0%, #17a689 34%, #3fc4e8 56%, #3a2a60 80%, #150c2c 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  "mint-tide": {
    backgroundColor: "#0e071f",
    backgroundImage: `${WAVES}, linear-gradient(160deg, #0e071f 0%, #0f3d3a 55%, #17a689 100%)`,
    backgroundSize: "160px 48px, cover",
    backgroundPosition: "0 100%, center",
  },
  "sky-crystal": {
    backgroundColor: "#121a2c",
    backgroundImage: `${FACETS}, linear-gradient(135deg, #121a2c 0%, #1a4f73 62%, #1a9ec4 100%)`,
    backgroundSize: "64px 64px, cover",
    backgroundPosition: "center, center",
  },
  "gold-stars": {
    backgroundColor: "#0e071f",
    backgroundImage: `${STARS("#f2d23c", 0.7)}, radial-gradient(circle at 82% 18%, rgba(242, 210, 60, 0.42), rgba(242, 210, 60, 0) 46%), linear-gradient(180deg, #150c2c 0%, #0e071f 100%)`,
    backgroundSize: "120px 80px, cover, cover",
    backgroundPosition: "center, center, center",
  },
  "crimson-rays": {
    backgroundColor: "#2a0a22",
    backgroundImage:
      "repeating-conic-gradient(from 0deg at 50% 130%, rgba(255, 61, 154, 0.2) 0deg 6deg, rgba(255, 61, 154, 0) 6deg 14deg), linear-gradient(135deg, #2a0a22 0%, #971359 70%, #c81e7a 100%)",
    backgroundSize: "cover, cover",
    backgroundPosition: "center, center",
  },
  "violet-nebula": {
    backgroundColor: "#0e071f",
    backgroundImage: `${STARS("#d9dfe8", 0.55)}, radial-gradient(ellipse at 28% 40%, rgba(182, 156, 255, 0.55), rgba(182, 156, 255, 0) 56%), radial-gradient(ellipse at 76% 72%, rgba(63, 196, 232, 0.32), rgba(63, 196, 232, 0) 50%), linear-gradient(180deg, #21143c 0%, #0e071f 100%)`,
    backgroundSize: "120px 80px, cover, cover, cover",
    backgroundPosition: "center, center, center, center",
  },
  "night-grid": {
    backgroundColor: "#121a2c",
    backgroundImage: `${GRID}, linear-gradient(180deg, #182238 0%, #121a2c 100%)`,
    backgroundSize: "40px 40px, cover",
    backgroundPosition: "center, center",
  },
  sunset: {
    backgroundColor: "#833ab4",
    backgroundImage:
      "linear-gradient(180deg, rgba(14, 7, 31, 0) 45%, rgba(14, 7, 31, 0.55) 100%), linear-gradient(45deg, #f09433 0%, #e6683c 18%, #dc2743 40%, #cc2366 60%, #bc1888 80%, #833ab4 100%)",
    backgroundSize: "cover, cover",
    backgroundPosition: "center, center",
  },
};

export function coverStyle(preset: CoverPreset): CoverStyle {
  return COVER_STYLES[preset];
}

// ---------- colore d'accento ----------

/**
 * I colori d'accento della vetrina (vincolo `profiles_accent_check`): cornice della copertina e delle schede, nome.
 * Tutti dalla palette del sito tranne il violetto e la pesca, schiariti apposta; `crimson` è il magenta chiaro del sito
 * (token `pink`): il `crimson` pieno (#c81e7a) sul blu notte sta a 3:1 e come testo non si legge.
 */
export const ACCENTS = ["sky", "mint", "gold", "crimson", "violet", "coral", "green", "peach"] as const;
export type Accent = (typeof ACCENTS)[number];

export const ACCENT_HEX: Readonly<Record<Accent, string>> = {
  sky: "#3fc4e8",
  mint: "#31e3bd",
  gold: "#f2d23c",
  crimson: "#ff3d9a",
  violet: "#b69cff",
  coral: "#ff5c5c",
  green: "#46d369",
  peach: "#ffb38a",
};

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

/** Cornice nel colore d'accento; senza un colore scelto resta il celeste delle schede (nessuno stile). */
export function accentBorder(accent: Accent | null | undefined): { borderColor: string } | undefined {
  return accent && accent !== "sky" ? { borderColor: ACCENT_HEX[accent] } : undefined;
}

/** Testo (nome, titoletti) nel colore d'accento; senza un colore scelto resta quello della classe. */
export function accentText(accent: Accent | null | undefined): { color: string } | undefined {
  return accent && accent !== "sky" ? { color: ACCENT_HEX[accent] } : undefined;
}

/** Rapporto di contrasto WCAG fra due colori #rrggbb (per il test dei colori d'accento). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- frase di presentazione ----------

export const TAGLINE_MAX = 80;

/** Frase sotto il nome: testo semplice su una riga, niente invisibili, al massimo `TAGLINE_MAX` caratteri; vuota = null. */
export function cleanTagline(raw: unknown): { ok: true; value: string | null } | { ok: false; error: "long" } {
  // prima si pulisce senza tagliare (un tetto largo contro i testi enormi), poi si misura: troppo lunga è un errore
  const text = cleanText(typeof raw === "string" ? raw.slice(0, TAGLINE_MAX * 8) : "", TAGLINE_MAX * 4);
  if (!text) return { ok: true, value: null };
  return [...text].length > TAGLINE_MAX ? { ok: false, error: "long" } : { ok: true, value: text };
}

// ---------- orari delle dirette ----------

/** Una voce degli orari: giorno (0 = lunedì … 6 = domenica), ora "HH:MM" nel fuso del creator, durata in minuti facoltativa. */
export type ScheduleEntry = { day: number; time: string; minutes?: number };
export const SCHEDULE_MAX = 7;
export const DURATION_MIN = 15;
export const DURATION_MAX = 720;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Fusi orari fra cui il creator sceglie il suo (lingue del sito: Europa, Americhe di lingua spagnola e inglese, più UTC).
 * Il database accetta qualsiasi nome IANA ben formato (l'elenco può cambiare senza migrazione); il sito solo questi.
 */
export const TIMEZONES = [
  "Europe/Rome",
  "Europe/Madrid",
  "Atlantic/Canary",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Zurich",
  "Europe/Athens",
  "America/Mexico_City",
  "America/Guatemala",
  "America/Panama",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  "America/Santo_Domingo",
  "America/Puerto_Rico",
  "America/La_Paz",
  "America/Santiago",
  "America/Asuncion",
  "America/Montevideo",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
] as const;
export type TimeZone = (typeof TIMEZONES)[number];

export function isTimeZone(value: unknown): value is TimeZone {
  return typeof value === "string" && (TIMEZONES as readonly string[]).includes(value);
}

/**
 * Nome del giorno (0 = lunedì … 6 = domenica) nella lingua della pagina, con l'iniziale maiuscola: lo scrive Intl, niente
 * etichette da tradurre (il 1° gennaio 2024 era un lunedì).
 */
export function weekdayName(locale: string, day: number, style: "long" | "short" = "long"): string {
  const name = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + day)));
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** Nome del fuso da mostrare: "America/Mexico_City" → "America/Mexico City". */
export function timeZoneName(tz: string): string {
  return tz.replace(/_/g, " ");
}

/** Una voce valida, com'è scritta nel database (difesa in lettura: quello che non torna si scarta). */
function entryOf(raw: unknown): ScheduleEntry | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { day, time, minutes, ...rest } = raw as Record<string, unknown>;
  if (Object.keys(rest).length) return null;
  if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6) return null;
  if (typeof time !== "string" || !TIME_RE.test(time)) return null;
  if (minutes === undefined) return { day, time };
  if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < DURATION_MIN || minutes > DURATION_MAX) return null;
  return { day, time, minutes };
}

/** In ordine di giorno e ora, senza doppioni (stesso giorno e ora: vince la prima), al massimo `SCHEDULE_MAX`. */
function tidy(entries: ScheduleEntry[]): ScheduleEntry[] {
  const seen = new Set<string>();
  return entries
    .filter((e) => {
      const key = `${e.day} ${e.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
    .slice(0, SCHEDULE_MAX);
}

/** Gli orari salvati nel database, ricontrollati. */
export function storedSchedule(raw: unknown): ScheduleEntry[] {
  if (!Array.isArray(raw)) return [];
  return tidy(raw.slice(0, SCHEDULE_MAX * 2).map(entryOf).filter((e): e is ScheduleEntry => e !== null));
}

export type ScheduleRowError = { index: number; error: "day" | "time" | "duration" };

/** Le righe degli orari del modulo (giorno, ora, durata): quelle senza ora si saltano. */
export function parseScheduleRows(
  days: readonly string[],
  times: readonly string[],
  durations: readonly string[],
): { ok: true; value: ScheduleEntry[] } | { ok: false; errors: ScheduleRowError[]; tooMany?: boolean } {
  const out: ScheduleEntry[] = [];
  const errors: ScheduleRowError[] = [];
  const rows = Math.min(Math.max(days.length, times.length, durations.length), SCHEDULE_MAX * 3);
  for (let i = 0; i < rows; i++) {
    const time = String(times[i] ?? "").trim();
    if (!time) continue;
    const dayRaw = String(days[i] ?? "").trim();
    const day = /^[0-6]$/.test(dayRaw) ? Number(dayRaw) : NaN;
    if (!Number.isInteger(day)) {
      errors.push({ index: i, error: "day" });
      continue;
    }
    if (!TIME_RE.test(time)) {
      errors.push({ index: i, error: "time" });
      continue;
    }
    const durRaw = String(durations[i] ?? "").trim();
    if (!durRaw) {
      out.push({ day, time });
      continue;
    }
    const minutes = /^\d{1,4}$/.test(durRaw) ? Number(durRaw) : NaN;
    if (!Number.isInteger(minutes) || minutes < DURATION_MIN || minutes > DURATION_MAX) {
      errors.push({ index: i, error: "duration" });
      continue;
    }
    out.push({ day, time, minutes });
  }
  const value = tidy(out);
  const tooMany = new Set(out.map((e) => `${e.day} ${e.time}`)).size > SCHEDULE_MAX;
  if (errors.length || tooMany) return { ok: false, errors, ...(tooMany ? { tooMany } : {}) };
  return { ok: true, value };
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const partsFormat = new Map<string, Intl.DateTimeFormat>();

/** Data e ora di un istante nel fuso `tz` (weekday: 0 = lunedì). */
export function zonedParts(ms: number, tz: string): ZonedParts {
  let f = partsFormat.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" });
    partsFormat.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), hour: Number(p.hour) % 24, minute: Number(p.minute), weekday: WEEKDAYS.indexOf(p.weekday) };
}

/** Differenza fra l'ora locale di `tz` e UTC in quell'istante, in millisecondi. */
function offsetAt(ms: number, tz: string): number {
  const t = Math.floor(ms / 60_000) * 60_000;
  const p = zonedParts(t, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - t;
}

/**
 * L'istante (ms UTC) di un'ora "da orologio" nel fuso `tz`. Con il cambio dell'ora: un'ora che non esiste (la notte
 * in cui si va avanti, 02:30 a Roma) scivola avanti di un'ora; una che esiste due volte ne prende una delle due.
 */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetAt(guess, tz);
  const utc = guess - first;
  const second = offsetAt(utc, tz);
  return second === first ? utc : guess - second;
}

/**
 * La prossima diretta di una voce degli orari, vista dall'istante `now`: inizio e fine (se c'è la durata) in ms UTC, e
 * `ongoing` se è in corso adesso secondo gli orari (una diretta iniziata ieri sera e non ancora finita conta).
 */
export function nextSlot(entry: ScheduleEntry, tz: string, now: number): { start: number; end?: number; ongoing: boolean } {
  const p = zonedParts(now, tz);
  const [hh, mm] = entry.time.split(":").map(Number);
  const duration = (entry.minutes ?? 0) * 60_000;
  const ahead = (entry.day - p.weekday + 7) % 7;
  for (const offset of [ahead - 7, ahead, ahead + 7]) {
    const date = new Date(Date.UTC(p.year, p.month - 1, p.day + offset));
    const start = zonedTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hh, mm, tz);
    if (start > now || start + duration > now) return { start, ...(duration ? { end: start + duration } : {}), ongoing: start <= now && now < start + duration };
  }
  // non si arriva qui (ahead + 7 è sempre nel futuro); per sicurezza, la settimana dopo
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day + ahead + 7));
  return { start: zonedTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hh, mm, tz), ongoing: false };
}

/** Le prossime dirette di tutte le voci, dalla più vicina (quelle in corso per prime). */
export function upcomingSlots(entries: readonly ScheduleEntry[], tz: string, now: number): { entry: ScheduleEntry; start: number; end?: number; ongoing: boolean }[] {
  return entries.map((entry) => ({ entry, ...nextSlot(entry, tz, now) })).sort((a, b) => Number(b.ongoing) - Number(a.ongoing) || a.start - b.start);
}

// ---------- la vetrina letta e scritta ----------

/** Colonne della vetrina in public.profiles (blocco VETRINA di supabase/schema.sql). */
export const VETRINA_COLUMNS = "avatar_path, cover_preset, cover_path, accent, tagline, favorite_legendary, featured_deck, featured_video, schedule, schedule_tz";

export type VetrinaRow = {
  avatar_path: string | null;
  cover_preset: string | null;
  cover_path: string | null;
  accent: string | null;
  tagline: string | null;
  favorite_legendary: string | null;
  featured_deck: string | null;
  featured_video: string | null;
  schedule: unknown;
  schedule_tz: string | null;
};

/** La vetrina pronta da mostrare: ogni campo ricontrollato, quello che non torna è null. */
export type Vetrina = {
  avatarPath: string | null;
  coverPreset: CoverPreset | null;
  coverPath: string | null;
  accent: Accent | null;
  tagline: string | null;
  favoriteLegendary: string | null;
  featuredDeck: string | null;
  featuredVideo: ParsedVideo | null;
  schedule: ScheduleEntry[];
  scheduleTz: TimeZone | null;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toVetrina(row: Partial<VetrinaRow> | null | undefined, profileId: string): Vetrina {
  const r = row ?? {};
  const tagline = cleanTagline(r.tagline ?? "");
  const tz = isTimeZone(r.schedule_tz) ? r.schedule_tz : null;
  const video = typeof r.featured_video === "string" ? parseVideoUrl(r.featured_video) : null;
  return {
    avatarPath: mediaPathOk(profileId, "avatar", r.avatar_path) ? r.avatar_path : null,
    coverPreset: isCoverPreset(r.cover_preset) ? r.cover_preset : null,
    coverPath: mediaPathOk(profileId, "cover", r.cover_path) ? r.cover_path : null,
    accent: isAccent(r.accent) ? r.accent : null,
    tagline: tagline.ok ? tagline.value : null,
    favoriteLegendary: typeof r.favorite_legendary === "string" && r.favorite_legendary.length <= 60 && SLUG_RE.test(r.favorite_legendary) ? r.favorite_legendary : null,
    featuredDeck: typeof r.featured_deck === "string" && UUID_RE.test(r.featured_deck) ? r.featured_deck : null,
    featuredVideo: video ? { provider: video.provider, kind: video.kind, id: video.id, url: video.url } : null,
    // gli orari senza fuso non si possono mostrare a chi guarda: niente orari
    schedule: tz ? storedSchedule(r.schedule) : [],
    scheduleTz: tz,
  };
}

/** Valori da scrivere nel database (Server Action `saveShowcase`). */
export type ShowcaseValue = {
  cover_preset: CoverPreset | null;
  cover_path: string | null;
  accent: Accent | null;
  tagline: string | null;
  favorite_legendary: string | null;
  featured_deck: string | null;
  featured_video: string | null;
  schedule: ScheduleEntry[];
  schedule_tz: TimeZone | null;
};

export type ShowcaseFormInput = {
  /** id di uno sfondo preimpostato, "image" per l'immagine caricata, "" per quella predefinita */
  cover: string;
  coverPath: string;
  accent: string;
  tagline: string;
  favoriteLegendary: string;
  featuredDeck: string;
  featuredVideo: string;
  days: readonly string[];
  times: readonly string[];
  durations: readonly string[];
  timezone: string;
};

export type ShowcaseFormErrors = {
  cover?: "invalid" | "image";
  accent?: "invalid";
  tagline?: "long";
  legendary?: "invalid";
  deck?: "invalid";
  video?: "invalid";
  timezone?: "invalid" | "required";
  schedule?: ScheduleRowError[];
  scheduleTooMany?: boolean;
};

export type ShowcaseContext = {
  userId: string;
  /** la carta è una Leggendaria attiva del database? */
  isLegendary: (slug: string) => boolean;
  /** i mazzi PUBBLICATI dell'utente */
  deckIds: ReadonlySet<string>;
};

/**
 * Il modulo "Personalizza la vetrina": tutto ricontrollato (il server non si fida del modulo). Tutto valido: i valori da
 * salvare; altrimenti gli errori campo per campo e nulla si salva.
 */
export function parseShowcaseForm(input: ShowcaseFormInput, ctx: ShowcaseContext): { ok: true; value: ShowcaseValue } | { ok: false; errors: ShowcaseFormErrors } {
  const errors: ShowcaseFormErrors = {};
  // copertina: uno sfondo preimpostato OPPURE l'immagine caricata, mai tutte e due
  let cover_preset: CoverPreset | null = null;
  let cover_path: string | null = null;
  const cover = input.cover.trim();
  if (cover === "image") {
    if (mediaPathOk(ctx.userId, "cover", input.coverPath.trim())) cover_path = input.coverPath.trim();
    else errors.cover = "image";
  } else if (cover) {
    if (isCoverPreset(cover)) cover_preset = cover;
    else errors.cover = "invalid";
  }
  const accentRaw = input.accent.trim();
  const accent = accentRaw ? (isAccent(accentRaw) ? accentRaw : null) : null;
  if (accentRaw && !accent) errors.accent = "invalid";
  const tagline = cleanTagline(input.tagline);
  if (!tagline.ok) errors.tagline = tagline.error;
  const legRaw = input.favoriteLegendary.trim();
  const favorite_legendary = legRaw && legRaw.length <= 60 && SLUG_RE.test(legRaw) && ctx.isLegendary(legRaw) ? legRaw : null;
  if (legRaw && !favorite_legendary) errors.legendary = "invalid";
  const deckRaw = input.featuredDeck.trim();
  const featured_deck = deckRaw && UUID_RE.test(deckRaw) && ctx.deckIds.has(deckRaw) ? deckRaw : null;
  if (deckRaw && !featured_deck) errors.deck = "invalid";
  const videoRaw = input.featuredVideo.trim();
  const video = videoRaw ? parseVideoUrl(videoRaw) : null;
  if (videoRaw && !video) errors.video = "invalid";
  const schedule = parseScheduleRows(input.days, input.times, input.durations);
  if (!schedule.ok) {
    if (schedule.errors.length) errors.schedule = schedule.errors;
    if (schedule.tooMany) errors.scheduleTooMany = true;
  }
  // il fuso solo con degli orari: la colonna è pubblica, e un fuso salvato senza orari direbbe soltanto dove vive chi
  // salva (il modulo lo manderebbe comunque, partendo dal fuso del browser). Righe con errori contano come orari.
  const hasRows = schedule.ok ? schedule.value.length > 0 : true;
  const tzRaw = input.timezone.trim();
  const schedule_tz = hasRows && isTimeZone(tzRaw) ? tzRaw : null;
  if (hasRows && tzRaw && !isTimeZone(tzRaw)) errors.timezone = "invalid";
  else if (hasRows && !tzRaw) errors.timezone = "required";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      cover_preset,
      cover_path,
      accent,
      tagline: tagline.ok ? tagline.value : null,
      favorite_legendary,
      featured_deck,
      featured_video: video ? video.url : null,
      schedule: schedule.ok ? schedule.value : [],
      schedule_tz,
    },
  };
}

/** La vetrina salvata è già uguale a quella del modulo? Allora niente scrittura e niente pagine da rigenerare. */
export function sameShowcaseValue(row: Partial<VetrinaRow>, value: ShowcaseValue): boolean {
  const keys = ["cover_preset", "cover_path", "accent", "tagline", "favorite_legendary", "featured_deck", "featured_video", "schedule_tz"] as const;
  if (keys.some((k) => (row[k] ?? null) !== value[k])) return false;
  return JSON.stringify(storedSchedule(row.schedule)) === JSON.stringify(value.schedule) && Array.isArray(row.schedule) && row.schedule.length === value.schedule.length;
}

/** La vetrina vuota: quello che scrive "Togli i dati della vetrina" (anche a chi ha perso il ruolo; il trigger lo ammette). */
export const EMPTY_SHOWCASE: ShowcaseValue = {
  cover_preset: null,
  cover_path: null,
  accent: null,
  tagline: null,
  favorite_legendary: null,
  featured_deck: null,
  featured_video: null,
  schedule: [],
  schedule_tz: null,
};

/**
 * Nella riga c'è qualcosa della vetrina (foto esclusa, che è di tutti)? Guarda i valori grezzi, anche quelli che la pagina
 * non mostrerebbe: chi ha perso il ruolo deve poter togliere tutto quello che l'API rende ancora leggibile.
 */
export function hasShowcaseData(row: Partial<VetrinaRow> | null | undefined): boolean {
  if (!row) return false;
  const keys = ["cover_preset", "cover_path", "accent", "tagline", "favorite_legendary", "featured_deck", "featured_video", "schedule_tz"] as const;
  return keys.some((k) => row[k] !== null && row[k] !== undefined) || (Array.isArray(row.schedule) && row.schedule.length > 0);
}

/**
 * Secondi che mancano prima di poter salvare di nuovo (0: si può), dall'ultima modifica `updatedAt` e dall'intervallo
 * minimo `minMs`. Arrotondati in su: "aspetta 3 secondi" non deve diventare un secondo rifiuto.
 */
export function retryAfterSeconds(updatedAt: string | null | undefined, minMs: number, now: number): number {
  const last = updatedAt ? Date.parse(updatedAt) : NaN;
  if (!Number.isFinite(last)) return 0;
  const left = last + minMs - now;
  return left > 0 ? Math.ceil(left / 1000) : 0;
}
