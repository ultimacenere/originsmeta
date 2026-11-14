import { MIRROR_MODES, TALENT_ROLES, type EventConfig, type EventDeck, type FinalDraw, type GiveawaySlot, type MirrorMode, type Talent, type TalentLink, type TalentRole } from "./types";
import { twitchLogin } from "./codes";

/**
 * Configurazione di un evento (10/11/2026): lettura e controllo del JSON che la regia salva. Funzioni pure.
 *
 * `parseConfig(x, "strict")` è il controllo prima del salvataggio: qualunque campo sbagliato è un errore con il suo
 * percorso ("decks[2].code: …") e il salvataggio non parte. `parseConfig(x, "lenient")` è la lettura per le pagine:
 * le voci sbagliate si scartano e i campi mancanti prendono il valore di default, così una configurazione scritta a mano
 * male non rompe mai la pagina pubblica (e un indirizzo che non è https non diventa mai un link).
 */

export const DEFAULT_KEYWORD = "!codice";
export const LIMITS = {
  name: 60,
  tagline: 200,
  talent: 40,
  bio: 600,
  links: 6,
  linkLabel: 40,
  url: 300,
  decks: 16,
  deckNote: 200,
  code: 2000,
  pairs: 20,
  slots: 60,
  packs: 50,
  minutes: 60,
  rounds: 15,
  maxCodesPerUser: 60,
  maxWinsPerViewer: 60,
  pickup: 1500,
  finalText: 300,
} as const;

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const KEYWORD_PATTERN = /^![a-z0-9_]{2,24}$/;
export const COLOR_PATTERN = /^#[0-9a-f]{6}$/;
export const GAME_CODE_PATTERN = /^KGBLDC[A-Za-z0-9+/=]+:[0-9a-f]{8}$/;
const USERNAME_PATTERN = /^[a-z0-9-]{3,39}$/;

export type ParseMode = "strict" | "lenient";
export type ParsedConfig = { config: EventConfig; errors: string[] };

/** Configurazione vuota di un evento nuovo. */
export function emptyConfig(name = "Evento"): EventConfig {
  return {
    name,
    tagline: "",
    startsAt: null,
    endsAt: null,
    talent: [],
    decks: [],
    pairs: [],
    mirror: "avoid",
    rounds: null,
    slots: [],
    finalDraw: null,
    keyword: DEFAULT_KEYWORD,
    maxCodesPerUser: 1,
    maxWinsPerViewer: 1,
    redeemUntil: null,
    pickup: "",
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Testo pulito: niente caratteri di controllo (a capo solo dove serve), spazi in fondo tolti. */
export function cleanText(x: unknown, multiline = false): string {
  if (typeof x !== "string") return "";
  // i caratteri invisibili (larghezza zero, direzione del testo) si tolgono; quelli di controllo diventano spazi
  const noInvisible = x.replace(/[\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\ufeff]/g, "");
  const noCtrl = multiline
    ? noInvisible.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
    : noInvisible.replace(/[\u0000-\u001f\u007f]/g, " ");
  return (multiline ? noCtrl.replace(/\n{3,}/g, "\n\n") : noCtrl.replace(/\s+/g, " ")).trim();
}

/** Indirizzo https valido (e non troppo lungo), o null. */
export function httpsUrl(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const s = x.trim();
  if (!s || s.length > LIMITS.url) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

/** File delle foto dei talent pubblicati dal sito (public/media/events/<evento>/). */
export const EVENT_MEDIA_PATTERN = /^[/]media[/]events[/][a-z0-9-]{1,60}[/][A-Za-z0-9._-]{1,80}[.](webp|jpe?g|png)$/;

/** Foto di un talent: un indirizzo https, o un file del sito in /media/events/ (12/11/2026: le foto mandate dai creator). */
export function photoUrl(x: unknown): string | null {
  if (typeof x === "string" && EVENT_MEDIA_PATTERN.test(x.trim()) && !x.includes("..")) return x.trim();
  return httpsUrl(x);
}

/** Data ISO normalizzata, o null (stringa vuota o assente = null; una data che non si legge è un errore). */
function isoOrNull(x: unknown): { ok: boolean; value: string | null } {
  if (x === null || x === undefined || x === "") return { ok: true, value: null };
  if (typeof x !== "string") return { ok: false, value: null };
  const t = Date.parse(x);
  return Number.isNaN(t) ? { ok: false, value: null } : { ok: true, value: new Date(t).toISOString() };
}

function intIn(x: unknown, min: number, max: number): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Minuti di uno slot, anche con i secondi (7.5 = 7 minuti e 30, 14/11/2026); ai secondi interi. */
function minutesIn(x: unknown, min: number, max: number): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  const sec = n * 60;
  return Math.abs(sec - Math.round(sec)) < 1e-6 ? Math.round(sec) / 60 : null;
}

export function parseConfig(input: unknown, mode: ParseMode = "strict"): ParsedConfig {
  const errors: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);
  const base = emptyConfig("");
  if (!isObj(input)) return { config: { ...base, name: "Evento" }, errors: ["la configurazione deve essere un oggetto JSON"] };

  const name = cleanText(input.name);
  if (!name) err("name", "il nome dell'evento è obbligatorio");
  else if (name.length > LIMITS.name) err("name", `al massimo ${LIMITS.name} caratteri`);
  const tagline = cleanText(input.tagline, true);
  if (tagline.length > LIMITS.tagline) err("tagline", `al massimo ${LIMITS.tagline} caratteri`);

  const dates: Record<"startsAt" | "endsAt" | "redeemUntil", string | null> = { startsAt: null, endsAt: null, redeemUntil: null };
  for (const k of ["startsAt", "endsAt", "redeemUntil"] as const) {
    const r = isoOrNull(input[k]);
    if (!r.ok) err(k, "data non valida (usa il formato 2026-11-16T18:00:00+01:00)");
    dates[k] = r.value;
  }

  // talent
  const talent: Talent[] = [];
  const rawTalent = input.talent === undefined ? [] : input.talent;
  if (!Array.isArray(rawTalent)) err("talent", "deve essere un elenco");
  else {
    if (rawTalent.length > LIMITS.talent) err("talent", `al massimo ${LIMITS.talent}`);
    const ids = new Set<string>();
    rawTalent.slice(0, LIMITS.talent).forEach((raw, i) => {
      const p = `talent[${i}]`;
      const before = errors.length;
      if (!isObj(raw)) return void err(p, "deve essere un oggetto");
      const id = typeof raw.id === "string" ? raw.id.trim().toLowerCase() : "";
      if (!ID_PATTERN.test(id)) err(`${p}.id`, "solo minuscole, cifre e trattini (es. coachcrono)");
      else if (ids.has(id)) err(`${p}.id`, `"${id}" è già usato`);
      const tName = cleanText(raw.name);
      if (!tName || tName.length > LIMITS.name) err(`${p}.name`, `nome obbligatorio, al massimo ${LIMITS.name} caratteri`);
      const role = (typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "player") as TalentRole;
      if (!TALENT_ROLES.includes(role)) err(`${p}.role`, `uno fra ${TALENT_ROLES.join(", ")}`);
      const t: Talent = { id, name: tName, role };
      if (raw.twitch !== undefined && raw.twitch !== null && raw.twitch !== "") {
        const login = typeof raw.twitch === "string" ? twitchLogin(raw.twitch) : null;
        if (!login) err(`${p}.twitch`, "nome del canale Twitch non valido");
        else t.twitch = login;
      }
      if (raw.photo !== undefined && raw.photo !== null && raw.photo !== "") {
        const u = photoUrl(raw.photo);
        if (!u) err(`${p}.photo`, "deve essere un indirizzo https o un file in /media/events/");
        else t.photo = u;
      }
      const bio = cleanText(raw.bio, true);
      if (bio.length > LIMITS.bio) err(`${p}.bio`, `al massimo ${LIMITS.bio} caratteri`);
      else if (bio) t.bio = bio;
      if (raw.links !== undefined) {
        if (!Array.isArray(raw.links)) err(`${p}.links`, "deve essere un elenco");
        else {
          if (raw.links.length > LIMITS.links) err(`${p}.links`, `al massimo ${LIMITS.links}`);
          const links: TalentLink[] = [];
          raw.links.slice(0, LIMITS.links).forEach((l, j) => {
            const label = isObj(l) ? cleanText(l.label) : "";
            const url = isObj(l) ? httpsUrl(l.url) : null;
            if (!label || label.length > LIMITS.linkLabel || !url) err(`${p}.links[${j}]`, `serve { "label": "…", "url": "https://…" } (etichetta fino a ${LIMITS.linkLabel} caratteri)`);
            else links.push({ label, url });
          });
          if (links.length) t.links = links;
        }
      }
      const reveal = isoOrNull(raw.revealAt);
      if (!reveal.ok) err(`${p}.revealAt`, "data non valida");
      else if (reveal.value) t.revealAt = reveal.value;
      if (raw.user !== undefined && raw.user !== null && raw.user !== "") {
        const user = typeof raw.user === "string" ? raw.user.trim().toLowerCase().replace(/^@/, "") : "";
        if (!USERNAME_PATTERN.test(user)) err(`${p}.user`, "nome utente del sito non valido");
        else t.user = user;
      }
      if (errors.length === before) {
        ids.add(id);
        talent.push(t);
      } else if (mode === "lenient" && ID_PATTERN.test(id) && !ids.has(id) && tName && TALENT_ROLES.includes(role)) {
        // in lettura si tiene la parte buona della voce (i campi sbagliati sono già stati scartati)
        ids.add(id);
        talent.push(t);
      }
    });
  }

  // mazzi
  const decks: EventDeck[] = [];
  const rawDecks = input.decks === undefined ? [] : input.decks;
  if (!Array.isArray(rawDecks)) err("decks", "deve essere un elenco");
  else {
    if (rawDecks.length > LIMITS.decks) err("decks", `al massimo ${LIMITS.decks}`);
    const ids = new Set<string>();
    rawDecks.slice(0, LIMITS.decks).forEach((raw, i) => {
      const p = `decks[${i}]`;
      const before = errors.length;
      if (!isObj(raw)) return void err(p, "deve essere un oggetto");
      const id = typeof raw.id === "string" ? raw.id.trim().toLowerCase() : "";
      if (!ID_PATTERN.test(id)) err(`${p}.id`, "solo minuscole, cifre e trattini");
      else if (ids.has(id)) err(`${p}.id`, `"${id}" è già usato`);
      const dName = cleanText(raw.name);
      if (!dName || dName.length > LIMITS.name) err(`${p}.name`, `nome obbligatorio, al massimo ${LIMITS.name} caratteri`);
      const code = typeof raw.code === "string" ? raw.code.trim() : "";
      if (code.length > LIMITS.code || !GAME_CODE_PATTERN.test(code)) err(`${p}.code`, "serve il codice del gioco (KGBLDC…)");
      const color = typeof raw.color === "string" ? raw.color.trim().toLowerCase() : "";
      if (!COLOR_PATTERN.test(color)) err(`${p}.color`, "colore nella forma #rrggbb");
      const note = cleanText(raw.note);
      if (note.length > LIMITS.deckNote) err(`${p}.note`, `al massimo ${LIMITS.deckNote} caratteri`);
      if (errors.length === before) {
        ids.add(id);
        decks.push({ id, name: dName, code, color, ...(note ? { note } : {}) });
      }
    });
  }

  // coppie decise prima
  const players = new Set(talent.filter((t) => t.role === "player").map((t) => t.id));
  const pairs: [string, string][] = [];
  const rawPairs = input.pairs === undefined || input.pairs === null ? [] : input.pairs;
  if (!Array.isArray(rawPairs)) err("pairs", "deve essere un elenco di coppie");
  else {
    if (rawPairs.length > LIMITS.pairs) err("pairs", `al massimo ${LIMITS.pairs}`);
    const used = new Set<string>();
    rawPairs.slice(0, LIMITS.pairs).forEach((raw, i) => {
      const p = `pairs[${i}]`;
      if (!Array.isArray(raw) || raw.length !== 2 || raw.some((x) => typeof x !== "string")) return void err(p, 'serve ["id1", "id2"]');
      const [a, b] = (raw as string[]).map((x) => x.trim().toLowerCase());
      if (a === b) return void err(p, "due giocatori diversi");
      if (!players.has(a) || !players.has(b)) return void err(p, "gli id devono essere talent con ruolo player");
      if (used.has(a) || used.has(b)) return void err(p, "un giocatore sta in una coppia sola");
      used.add(a);
      used.add(b);
      pairs.push([a, b]);
    });
  }

  const mirror = (typeof input.mirror === "string" ? input.mirror : "avoid") as MirrorMode;
  if (!MIRROR_MODES.includes(mirror)) err("mirror", 'uno fra "avoid" e "allow"');

  let rounds: number | null = null;
  if (input.rounds !== undefined && input.rounds !== null && input.rounds !== "") {
    rounds = intIn(input.rounds, 1, LIMITS.rounds);
    if (rounds === null) err("rounds", `numero intero da 1 a ${LIMITS.rounds}`);
  }

  // slot del giveaway
  const slots: GiveawaySlot[] = [];
  const rawSlots = input.slots === undefined ? [] : input.slots;
  if (!Array.isArray(rawSlots)) err("slots", "deve essere un elenco");
  else {
    if (rawSlots.length > LIMITS.slots) err("slots", `al massimo ${LIMITS.slots}`);
    // canali del gruppo in corso (gli slot con `together` partono insieme a quello prima)
    let groupChannels = new Set<string>();
    rawSlots.slice(0, LIMITS.slots).forEach((raw, i) => {
      const p = `slots[${i}]`;
      const prev: GiveawaySlot | undefined = slots[slots.length - 1];
      if (!isObj(raw)) {
        err(p, "deve essere un oggetto");
        if (mode === "lenient") slots.push({ channel: "", packs: 0, minutes: 6 });
        return;
      }
      if (raw.together !== undefined && typeof raw.together !== "boolean") err(`${p}.together`, "true o false");
      const together = raw.together === true && i > 0;
      if (raw.together === true && i === 0) err(`${p}.together`, "il primo passaggio non può partire insieme a un altro");
      const channel = typeof raw.channel === "string" ? twitchLogin(raw.channel) : null;
      const packs = intIn(raw.packs, 1, LIMITS.packs);
      const minutes = minutesIn(raw.minutes ?? (together && prev ? prev.minutes : 6), 1, LIMITS.minutes);
      if (!channel) err(`${p}.channel`, "nome del canale Twitch non valido");
      if (packs === null) err(`${p}.packs`, `pacchetti da 1 a ${LIMITS.packs}`);
      if (minutes === null) err(`${p}.minutes`, `minuti da 1 a ${LIMITS.minutes}, anche con i secondi (7.5 = 7 minuti e 30)`);
      if (together && prev && minutes !== null && minutes !== prev.minutes) err(`${p}.minutes`, "uguali a quelli del passaggio con cui parte insieme");
      if (!together) groupChannels = new Set();
      if (channel && groupChannels.has(channel)) err(`${p}.channel`, "lo stesso canale due volte nello stesso passaggio");
      if (channel) groupChannels.add(channel);
      const extra = together ? { together: true } : {};
      if (channel && packs !== null && minutes !== null) slots.push({ channel, packs, minutes, ...extra });
      // in lettura lo slot resta al suo posto anche se è scritto male: l'orologio del giveaway conta gli slot per indice
      else if (mode === "lenient") slots.push({ channel: channel ?? "", packs: packs ?? 0, minutes: minutes ?? 6, ...extra });
    });
  }

  // estrazione dopo l'evento (14/11/2026, schema di Dav: 10 pacchetti fra tutti gli iscritti a OriginsMeta)
  let finalDraw: FinalDraw | null = null;
  if (input.finalDraw !== undefined && input.finalDraw !== null) {
    if (!isObj(input.finalDraw)) err("finalDraw", "deve essere un oggetto { packs, text }");
    else {
      const packs = intIn(input.finalDraw.packs, 1, LIMITS.packs);
      const text = cleanText(input.finalDraw.text);
      if (packs === null) err("finalDraw.packs", `pacchetti da 1 a ${LIMITS.packs}`);
      if (!text) err("finalDraw.text", "chi partecipa e come (una frase)");
      if (text.length > LIMITS.finalText) err("finalDraw.text", `al massimo ${LIMITS.finalText} caratteri`);
      if (packs !== null) finalDraw = { packs, text: text.slice(0, LIMITS.finalText) };
    }
  }

  let keyword = DEFAULT_KEYWORD;
  if (input.keyword !== undefined && input.keyword !== null && input.keyword !== "") {
    const k = typeof input.keyword === "string" ? input.keyword.trim().toLowerCase() : "";
    if (!KEYWORD_PATTERN.test(k)) err("keyword", 'comando come "!codice" (lettere, cifre e _)');
    else keyword = k;
  }

  let maxCodesPerUser = 1;
  if (input.maxCodesPerUser !== undefined && input.maxCodesPerUser !== null && input.maxCodesPerUser !== "") {
    const n = intIn(input.maxCodesPerUser, 1, LIMITS.maxCodesPerUser);
    if (n === null) err("maxCodesPerUser", `numero intero da 1 a ${LIMITS.maxCodesPerUser}`);
    else maxCodesPerUser = n;
  }

  // vincite per nome Twitch in tutto l'evento (11/11/2026: "ogni partecipante può vincere più pacchetti"); nello stesso
  // passaggio resta una sola
  let maxWinsPerViewer = 1;
  if (input.maxWinsPerViewer !== undefined && input.maxWinsPerViewer !== null && input.maxWinsPerViewer !== "") {
    const n = intIn(input.maxWinsPerViewer, 1, LIMITS.maxWinsPerViewer);
    if (n === null) err("maxWinsPerViewer", `numero intero da 1 a ${LIMITS.maxWinsPerViewer}`);
    else maxWinsPerViewer = n;
  }

  const pickup = cleanText(input.pickup, true);
  if (pickup.length > LIMITS.pickup) err("pickup", `al massimo ${LIMITS.pickup} caratteri`);

  const config: EventConfig = {
    name: (name || "Evento").slice(0, LIMITS.name),
    tagline: tagline.slice(0, LIMITS.tagline),
    startsAt: dates.startsAt,
    endsAt: dates.endsAt,
    talent,
    decks,
    pairs,
    mirror: MIRROR_MODES.includes(mirror) ? mirror : "avoid",
    rounds,
    slots,
    finalDraw,
    keyword,
    maxCodesPerUser,
    maxWinsPerViewer,
    redeemUntil: dates.redeemUntil,
    pickup: pickup.slice(0, LIMITS.pickup),
  };
  return { config, errors };
}

/** Somma dei pacchetti di tutti gli slot. */
export function totalPacks(slots: readonly GiveawaySlot[]): number {
  return slots.reduce((s, x) => s + x.packs, 0);
}

/** Tutti i pacchetti in palio: gli slot più l'estrazione dopo l'evento. */
export function eventPacks(config: Pick<EventConfig, "slots" | "finalDraw">): number {
  return totalPacks(config.slots) + (config.finalDraw?.packs ?? 0);
}

/** Minuti del giveaway: gli slot uno dopo l'altro (quelli con `together` non aggiungono tempo). */
export function totalMinutes(slots: readonly GiveawaySlot[]): number {
  return slots.reduce((s, x) => s + (x.together ? 0 : x.minutes), 0);
}

/**
 * Avvisi che non bloccano il salvataggio ma che la regia deve vedere: mazzi che non bastano per i giocatori, slot su
 * canali che non sono di nessun talent, pacchetti più dei codici, coppie che lasciano fuori qualcuno.
 */
export function configWarnings(config: EventConfig, codesTotal: number | null = null): string[] {
  const out: string[] = [];
  const players = config.talent.filter((t) => t.role === "player");
  if (players.length && config.decks.length && config.decks.length * 2 < players.length) {
    out.push(`${players.length} giocatori e ${config.decks.length} mazzi: con 2 giocatori per mazzo ne restano fuori ${players.length - config.decks.length * 2}.`);
  }
  if (config.pairs.length && config.pairs.length < Math.floor(players.length / 2)) {
    out.push(`Ci sono ${config.pairs.length} coppie decise e ${players.length} giocatori: gli altri la ruota li estrae a caso.`);
  }
  const channels = new Set(config.talent.map((t) => t.twitch).filter(Boolean));
  const strangers = [...new Set(config.slots.map((s) => s.channel).filter((c) => !channels.has(c)))];
  if (strangers.length) out.push(`Slot su canali che non sono di nessun talent: ${strangers.join(", ")}.`);
  const packs = eventPacks(config);
  if (codesTotal !== null && packs > codesTotal) out.push(`Il giveaway dà ${packs} pacchetti ma i codici sono ${codesTotal}: generane altri.`);
  if (config.maxWinsPerViewer > config.maxCodesPerUser) {
    out.push(`Uno spettatore può vincere ${config.maxWinsPerViewer} volte ma un account riscatta al massimo ${config.maxCodesPerUser} codici: alza maxCodesPerUser.`);
  }
  return out;
}
