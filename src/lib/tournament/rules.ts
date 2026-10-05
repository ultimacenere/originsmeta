/**
 * Regole del torneo con check-in, liste segrete, finale lunga e tempo di assenza (05/10/2026, il torneo di OriginsMeta di
 * metà ottobre "con le regole esatte della Crimson Cup"; decisioni di Pierluigi e Davdas: tetto di 64 con lista
 * d'attesa, al meglio delle tre con un'ora a turno, sconfitta a tavolino dopo 15 minuti di assenza, arbitri).
 *
 * Funzioni pure, senza import: le usano pagine e componenti per mostrare quello che il database decide (blocco
 * "05/10/2026: TORNEO CRIMSON" di supabase/schema.sql), e i test (`rules.test.ts`) confrontano i numeri con l'SQL.
 * Il database resta l'unico giudice: qui si calcola solo cosa mostrare (finestre, conti alla rovescia, anteprime).
 */

/** Il check-in apre 2 ore prima dell'inizio (`check_in`: interval '2 hours'). */
export const CHECKIN_OPENS_MINUTES = 120;
/** …e chiude 5 minuti prima, insieme alla consegna dei mazzi (interval '5 minutes'). */
export const CHECKIN_CLOSES_MINUTES = 5;
/** Minuti di assenza ammessi (vincolo tournaments_no_show_minutes_check); 15 è la scelta del torneo di ottobre. */
export const NO_SHOW_RANGE = { min: 5, max: 60, default: 15 } as const;
/** Arbitri per torneo al massimo (add_judge). */
export const MAX_JUDGES = 10;
/** Un referto senza conferma da più di tanti minuti finisce nella coda "Da sistemare". */
export const STALE_REPORT_MINUTES = 10;
/** Una partita pronta da più di tanti minuti senza risultato finisce nella coda (un turno dura circa un'ora). */
export const LONG_MATCH_MINUTES = 75;

/** Le regole della Crimson Cup in un clic nel modulo del torneo (annuncio di Koin del 24/09/2026). */
export const CRIMSON_PRESET = {
  deck_mode: "conquest",
  conquest_decks: 3,
  conquest_min_different: 8,
  best_of: 3,
  final_best_of: 5,
  checkin: true,
  hidden_decklists: true,
  no_show_minutes: NO_SHOW_RANGE.default,
} as const;

const MIN = 60_000;

export type CheckinWindow = { opensAt: number; closesAt: number };

export function checkinWindow(startsAt: string | number): CheckinWindow {
  const start = typeof startsAt === "number" ? startsAt : Date.parse(startsAt);
  return { opensAt: start - CHECKIN_OPENS_MINUTES * MIN, closesAt: start - CHECKIN_CLOSES_MINUTES * MIN };
}

/**
 * Fase del check-in: prima dell'apertura; aperto; chiuso per gli iscritti ma ancora aperto per la lista d'attesa (fino
 * all'avvio, che lo staff può fare da quel momento).
 */
export type CheckinPhase = "before" | "open" | "late";

export function checkinPhase(startsAt: string | number, now: number): CheckinPhase {
  const w = checkinWindow(startsAt);
  if (now < w.opensAt) return "before";
  if (now <= w.closesAt) return "open";
  return "late";
}

/** Lunghezza di una partita: la finale (ultimo turno) può averne una sua. */
export function matchBestOf(bestOf: number, finalBestOf: number | null | undefined, round: number, totalRounds: number): number {
  return finalBestOf && round === totalRounds ? finalBestOf : bestOf;
}

/** Vittorie che servono (come tm_need nel database). */
export function matchNeed(bestOf: number, finalBestOf: number | null | undefined, round: number, totalRounds: number): number {
  return Math.floor((matchBestOf(bestOf, finalBestOf, round, totalRounds) + 1) / 2);
}

/** Punteggio valido per una partita che si vince a `need`: chi vince ne ha esattamente need, l'altro meno. */
export function validNeedScore(need: number, a: number, b: number): boolean {
  return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a !== b && Math.max(a, b) === need && Math.min(a, b) < need;
}

/** Da quando si può chiedere la vittoria a tavolino (ms), oppure null se il torneo non ha il tempo o la partita non è pronta. */
export function noShowAt(readyAt: string | null | undefined, minutes: number | null | undefined): number | null {
  if (!readyAt || !minutes) return null;
  const t = Date.parse(readyAt);
  return Number.isNaN(t) ? null : t + minutes * MIN;
}

export type QueueMatch = {
  id: string;
  round: number;
  position: number;
  player_a: string | null;
  player_b: string | null;
  status: string;
  ready_at?: string | null;
  seen_a?: string | null;
  seen_b?: string | null;
  reported_at?: string | null;
};

export type QueueKind = "disputed" | "bothAbsent" | "staleReport" | "long";
export type QueueItem = { match: QueueMatch; kind: QueueKind; since: number };

const QUEUE_ORDER: Record<QueueKind, number> = { disputed: 0, bothAbsent: 1, staleReport: 2, long: 3 };

/**
 * La coda "Da sistemare" degli arbitri: contestate; partite oltre il tempo di assenza con nessuno dei due presente (il
 * tavolino non lo può chiedere nessuno); referti non confermati da più di STALE_REPORT_MINUTES; partite pronte da più di
 * LONG_MATCH_MINUTES. Una partita compare una volta sola, con il motivo più urgente; dentro lo stesso motivo, la più vecchia prima.
 */
export function staffQueue(matches: QueueMatch[], opts: { now: number; noShowMinutes?: number | null }): QueueItem[] {
  const out: QueueItem[] = [];
  for (const m of matches) {
    if (!m.player_a || !m.player_b) continue;
    const ready = m.ready_at ? Date.parse(m.ready_at) : NaN;
    if (m.status === "disputed") {
      out.push({ match: m, kind: "disputed", since: Number.isNaN(ready) ? opts.now : ready });
      continue;
    }
    if (m.status !== "pending" && m.status !== "reported") continue;
    const deadline = noShowAt(m.ready_at, opts.noShowMinutes);
    if (m.status === "pending" && deadline !== null && opts.now >= deadline && !m.seen_a && !m.seen_b) {
      out.push({ match: m, kind: "bothAbsent", since: deadline });
      continue;
    }
    const reported = m.reported_at ? Date.parse(m.reported_at) : NaN;
    if (m.status === "reported" && !Number.isNaN(reported) && opts.now - reported >= STALE_REPORT_MINUTES * MIN) {
      out.push({ match: m, kind: "staleReport", since: reported });
      continue;
    }
    if (!Number.isNaN(ready) && opts.now - ready >= LONG_MATCH_MINUTES * MIN) out.push({ match: m, kind: "long", since: ready });
  }
  return out.sort((x, y) => QUEUE_ORDER[x.kind] - QUEUE_ORDER[y.kind] || x.since - y.since || x.match.round - y.match.round || x.match.position - y.match.position);
}

export type SeatPlayer = { user_id: string; status: string; checked_in_at: string | null; decks_submitted: boolean; created_at: string };
export type SeatPlan = {
  /** iscritti con check-in e mazzi: entrano */
  registeredIn: string[];
  /** iscritti senza check-in (o senza mazzi): restano fuori */
  registeredOut: string[];
  /** in lista d'attesa con check-in, nell'ordine in cui entrerebbero (i primi `free`) */
  waitlistQueue: string[];
  /** posti lasciati liberi dagli iscritti senza check-in */
  free: number;
  /** chi entra davvero dalla lista (i primi `free` della coda) */
  waitlistIn: string[];
};

/**
 * Chi entrerebbe nel tabellone se si avviasse ora (come start_tournament con il check-in): gli iscritti con check-in e
 * mazzi, poi chi è in lista d'attesa e ha fatto il check-in, in ordine di arrivo, fino ai posti.
 */
export function seatPlan(players: SeatPlayer[], size: number): SeatPlan {
  const reg = players.filter((p) => p.status === "registered");
  const registeredIn = reg.filter((p) => p.checked_in_at && p.decks_submitted).map((p) => p.user_id);
  const registeredOut = reg.filter((p) => !(p.checked_in_at && p.decks_submitted)).map((p) => p.user_id);
  const waitlistQueue = players
    .filter((p) => p.status === "waitlist" && p.checked_in_at && p.decks_submitted)
    .sort((a, b) => Date.parse(a.checked_in_at as string) - Date.parse(b.checked_in_at as string) || Date.parse(a.created_at) - Date.parse(b.created_at))
    .map((p) => p.user_id);
  const free = Math.max(0, size - registeredIn.length);
  return { registeredIn, registeredOut, waitlistQueue, free, waitlistIn: waitlistQueue.slice(0, free) };
}

/** Posizione (1, 2, …) di un giocatore nella lista d'attesa, in ordine di iscrizione; null se non c'è. */
export function waitlistPosition(players: SeatPlayer[], userId: string): number | null {
  const list = players.filter((p) => p.status === "waitlist").sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.user_id.localeCompare(b.user_id));
  const i = list.findIndex((p) => p.user_id === userId);
  return i < 0 ? null : i + 1;
}

/** Minuti e secondi "mm:ss" (o "h:mm:ss") di una durata in ms, per i conti alla rovescia; mai negativa. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
