/**
 * Eventi della community (10/11/2026): l'Attrix Showmatch dei creator italiani del 16/11/2026 (Pierluigi: "una royale
 * rumble tra i creators italiani con giveaway di oltre 125 pacchetti di carte di origins, noi gestiamo tutta la
 * infrastruttura"; note Granola "sito roadmap" del 10/11/2026). Tipi condivisi da motore, pagine e funzioni del
 * database (blocco "10/11/2026: EVENTI DELLA COMMUNITY" di supabase/schema.sql).
 *
 * Due documenti JSON per evento, tutti e due scritti solo dalla regia (chi ha il link della regia o lo staff):
 * - `EventConfig`: chi partecipa (talent con lo svelamento a orario), i mazzi, gli slot del giveaway, i testi;
 * - `EventState`: quello che succede durante l'evento (ruota dei mazzi, turni svizzeri, risultati, orologio del giveaway).
 * I nomi dei talent non ancora svelati non stanno nel repository (che è pubblico) né nella risposta pubblica: li ha solo
 * il database, che li nasconde fino a `revealAt`.
 */

export const TALENT_ROLES = ["player", "caster", "host", "guest"] as const;
/** player = gioca; caster = commenta; host = conduce (Atrix); guest = ospite che non gioca */
export type TalentRole = (typeof TALENT_ROLES)[number];

export type TalentLink = { label: string; url: string };

export type Talent = {
  /** identificativo stabile, minuscole, cifre e trattini */
  id: string;
  name: string;
  role: TalentRole;
  /** nome del canale Twitch (login, minuscolo) */
  twitch?: string;
  /** foto (https); senza, la foto del profilo Twitch */
  photo?: string;
  bio?: string;
  links?: TalentLink[];
  /** prima di questo istante il talent è sfocato (nome, foto e canale non escono dal database) */
  revealAt?: string;
  /** nome utente sul sito, per il link a /u/<nome> */
  user?: string;
};

/** Talent non ancora svelato, come lo restituisce la lettura pubblica (id opaco "hidden-<n>"). */
export type HiddenTalent = { id: string; role: TalentRole; hidden: true; revealAt?: string };
export type PublicTalent = Talent | HiddenTalent;

export function isHidden(t: PublicTalent): t is HiddenTalent {
  return (t as HiddenTalent).hidden === true;
}

export type EventDeck = {
  id: string;
  name: string;
  /** codice del gioco (KGBLDC…) */
  code: string;
  /** colore della ruota (#rrggbb) */
  color: string;
  note?: string;
};

/**
 * Un passaggio del giveaway: il canale dove la chat scrive il comando, quanti pacchetti, quanti minuti (anche con i
 * secondi: 7.5 = 7 minuti e 30). `together`: parte insieme al passaggio prima e dura quanto lui (14/11/2026, schema di
 * Dav: i due caster fanno il giveaway nello stesso blocco, ognuno sul suo canale e con i suoi pacchetti).
 */
export type GiveawaySlot = { channel: string; packs: number; minutes: number; together?: boolean };

/** Estrazione dopo l'evento (14/11/2026: 10 pacchetti fra tutti gli iscritti a OriginsMeta). La fa lo staff. */
export type FinalDraw = { packs: number; text: string };

export const MIRROR_MODES = ["avoid", "allow"] as const;
export type MirrorMode = (typeof MIRROR_MODES)[number];

export type EventConfig = {
  name: string;
  tagline: string;
  /** inizio e fine dell'evento (facoltativi finché non si sanno) */
  startsAt: string | null;
  endsAt: string | null;
  talent: Talent[];
  decks: EventDeck[];
  /** coppie di giocatori decise prima (id); vuoto = la ruota estrae anche le coppie */
  pairs: [string, string][];
  /** "avoid": gli abbinamenti evitano due giocatori con lo stesso mazzo quando si può */
  mirror: MirrorMode;
  /** turni svizzeri previsti (solo indicativo: la regia crea un turno alla volta) */
  rounds: number | null;
  slots: GiveawaySlot[];
  /** estrazione dopo l'evento, fuori dai passaggi (null = nessuna) */
  finalDraw: FinalDraw | null;
  /** comando che la chat scrive per partecipare al giveaway */
  keyword: string;
  /** codici che un account può riscattare */
  maxCodesPerUser: number;
  /** vincite per nome Twitch in tutto l'evento (nello stesso passaggio sempre una sola); 1 = si vince una volta */
  maxWinsPerViewer: number;
  /** fino a quando si riscatta (null = sempre) */
  redeemUntil: string | null;
  /** che cosa fare dopo il riscatto per avere il pacchetto */
  pickup: string;
};

export type EventMatch = {
  /** "r<turno>-t<tavolo>" */
  id: string;
  round: number;
  table: number;
  a: string;
  /** null = bye (vittoria a tavolino di `a`) */
  b: string | null;
  winner: string | null;
};

/**
 * Un giro della ruota: il mazzo estratto e i giocatori che lo ricevono. `draw` è il numero dell'estrazione (1 = la prima;
 * manca nei giri salvati prima del 12/11/2026) e `afterRound` il turno più alto che esisteva in quel momento (serve ad
 * annullare un giro solo finché non è nato un turno dopo).
 */
export type Assignment = { deck: string; players: string[]; at: string; draw?: number; afterRound?: number };

/**
 * Orologio del giveaway: lo slot `anchorIndex` è partito in `anchor` e gli altri lo seguono uno dopo l'altro, ognuno con
 * i suoi minuti (gli slot con `together` insieme a quello prima). `paused` ferma il tempo. Tutto il resto (slot in corso, minuti che restano, prossimo canale) si calcola
 * da qui (clock.ts), quindi il database cambia solo quando la regia preme un tasto.
 */
export type GiveawayRun = { anchor: string | null; anchorIndex: number; paused: string | null };

export type EventState = {
  assignments: Assignment[];
  matches: EventMatch[];
  giveaway: GiveawayRun;
  /** estrazione in corso, dalla seconda in poi (assente = la prima): la ruota ridà un mazzo a tutti, mai uno già avuto */
  draw?: number;
};

/** Conteggio dei codici del giveaway (pubblico: nessun codice, nessun nome). */
export type CodeStats = { codes: number; assigned: number; redeemed: number };

/** Risposta della lettura pubblica (funzione community_event_public e rotta /api/events/<slug>). */
export type PublicEvent = {
  slug: string;
  config: Omit<EventConfig, "talent" | "pairs"> & { talent: PublicTalent[] };
  state: EventState;
  version: number;
  stats: CodeStats;
  /** ora del database, per correggere l'orologio del browser */
  now: string;
};

export type ModLink = { channel: string; token: string };
export type SlotCodes = { slot: number; assigned: number; redeemed: number };
export type Redeemer = { username: string | null; display: string | null; at: string; slot: number | null; isNew: boolean };

/** Quello che vede la regia (funzione community_event_control). */
export type ControlEvent = {
  slug: string;
  config: EventConfig;
  state: EventState;
  version: number;
  now: string;
  /** link della regia (solo per lo staff, che entra senza link) */
  controlToken: string | null;
  mods: ModLink[];
  codes: { total: number; assigned: number; redeemed: number };
  slotCodes: SlotCodes[];
  redeemers: Redeemer[];
};

export type ModCode = { code: string; slot: number; assignedAt: string; redeemed: boolean };

/** Quello che vede il mod di un canale (funzione community_event_mod_view). */
export type ModEvent = {
  slug: string;
  channel: string;
  name: string;
  keyword: string;
  slots: GiveawaySlot[];
  giveaway: GiveawayRun;
  codes: ModCode[];
  now: string;
};

/** Esito dell'assegnazione di un codice a un vincitore. */
export type AssignStatus = "ok" | "dup" | "full" | "none" | "invalid";
export type AssignResult = { login: string; status: AssignStatus; code?: string; redeemed?: boolean };

export type RedeemStatus = "ok" | "mine" | "taken" | "invalid" | "limit" | "too_many" | "closed" | "not_logged_in" | "unavailable";
