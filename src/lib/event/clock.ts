import type { GiveawayRun, GiveawaySlot } from "./types";

/**
 * Orologio del giveaway (10/11/2026). Dalle note: "7 momenti di assegnazione da ~6 minuti ciascuno (120 min / 20 = 6)",
 * "chat scrive comando (es. !codice) per 6 minuti", "Countdown live in pagina: mostra canale attivo per il giveaway e
 * tempo rimanente". Gli slot si susseguono uno dopo l'altro: la regia preme "Avvia il giveaway" una volta e l'orologio
 * va avanti da solo; "Salta al prossimo", "Pausa" e "Riprendi" correggono i ritardi della diretta. Il database salva
 * solo `GiveawayRun` (tre campi): slot in corso, fine e prossimo canale li calcola chiunque da qui, con la stessa ora.
 * Funzioni pure.
 */

export type ClockStatus = "idle" | "running" | "paused" | "done";

export type GiveawayClock = {
  status: ClockStatus;
  /** slot in corso (o in pausa), null se fermo o finito; con più slot insieme, il primo */
  index: number | null;
  slot: GiveawaySlot | null;
  /** tutti gli slot in corso insieme (di solito uno solo); vuoto se fermo o finito */
  group: number[];
  /** inizio e fine dello slot in corso (ms); con la pausa la fine non si sa */
  startedAt: number | null;
  endsAt: number | null;
  /** millisecondi che restano dello slot in corso */
  remainingMs: number;
  /** il prossimo slot (con quelli che partono insieme a lui) e quando parte (null se l'orologio è fermo) */
  next: { index: number; slot: GiveawaySlot; group: number[]; startsAt: number | null } | null;
};

export const IDLE_RUN: GiveawayRun = { anchor: null, anchorIndex: 0, paused: null };

/** Durata di uno slot in millisecondi, al secondo (7.5 minuti = 450 secondi). */
const ms = (slot: GiveawaySlot) => Math.round(Math.max(1, slot.minutes) * 60) * 1000;

/**
 * Gli slot con `together` partono insieme a quello prima (14/11/2026: il blocco dei due caster) e formano un gruppo che
 * dura quanto il primo. L'orologio va di gruppo in gruppo; `leaderOf` dà il primo slot del gruppo di `i`.
 */
export function leaderOf(slots: readonly GiveawaySlot[], i: number): number {
  let k = Math.min(Math.max(0, i), slots.length - 1);
  while (k > 0 && slots[k].together) k--;
  return Math.max(0, k);
}

/** Gli slot del gruppo che parte con `leader` (lui compreso). */
export function groupOf(slots: readonly GiveawaySlot[], leader: number): number[] {
  if (leader < 0 || leader >= slots.length) return [];
  const out = [leader];
  for (let k = leader + 1; k < slots.length && slots[k].together; k++) out.push(k);
  return out;
}

/** Il primo slot del gruppo dopo quello di `leader` (slots.length se è l'ultimo). */
function nextLeader(slots: readonly GiveawaySlot[], leader: number): number {
  let k = leader + 1;
  while (k < slots.length && slots[k].together) k++;
  return k;
}

/** Il primo gruppo da contare dopo una partenza dallo slot `anchorIndex` (slots.length se non ce ne sono più). */
const firstLeader = (slots: readonly GiveawaySlot[], anchorIndex: number) => (anchorIndex < slots.length ? leaderOf(slots, anchorIndex) : slots.length);

/** I gruppi del giveaway, in ordine: i passaggi come li vede chi guarda. */
export function slotGroups(slots: readonly GiveawaySlot[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < slots.length; i = nextLeader(slots, i)) out.push(groupOf(slots, i));
  return out;
}

/** Durata di uno slot da leggere: "7 min", "7 min 30 s". */
export function formatSlotMinutes(minutes: number): string {
  const sec = Math.round(Math.max(0, minutes) * 60);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}
const time = (iso: string | null): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/** Normalizza un `GiveawayRun` letto dal database (campi mancanti o sbagliati = fermo). */
export function normalizeRun(x: unknown): GiveawayRun {
  if (!x || typeof x !== "object") return { ...IDLE_RUN };
  const r = x as Record<string, unknown>;
  const anchor = typeof r.anchor === "string" && time(r.anchor) !== null ? r.anchor : null;
  const anchorIndex = Number.isInteger(r.anchorIndex) && (r.anchorIndex as number) >= 0 ? (r.anchorIndex as number) : 0;
  const paused = anchor && typeof r.paused === "string" && time(r.paused) !== null ? r.paused : null;
  return { anchor, anchorIndex, paused };
}

export function giveawayClock(slots: readonly GiveawaySlot[], run: GiveawayRun, now: number): GiveawayClock {
  const anchor = time(run.anchor);
  if (anchor === null) {
    const first = firstLeader(slots, run.anchorIndex);
    return {
      status: first >= slots.length && slots.length > 0 && run.anchorIndex > 0 ? "done" : "idle",
      index: null,
      slot: null,
      group: [],
      startedAt: null,
      endsAt: null,
      remainingMs: 0,
      next: first < slots.length ? { index: first, slot: slots[first], group: groupOf(slots, first), startsAt: null } : null,
    };
  }
  const paused = time(run.paused);
  const t = paused ?? now;
  let start = anchor;
  for (let i = firstLeader(slots, run.anchorIndex); i < slots.length; i = nextLeader(slots, i)) {
    const end = start + ms(slots[i]);
    if (t < end) {
      const status: ClockStatus = paused !== null ? "paused" : "running";
      const remainingMs = Math.max(0, end - Math.max(t, start));
      const n = nextLeader(slots, i);
      const nextSlot = n < slots.length ? { index: n, slot: slots[n], group: groupOf(slots, n), startsAt: paused !== null ? null : end } : null;
      // uno slot che deve ancora partire (anchor nel futuro) conta come "prossimo"
      if (t < start) return { status: "idle", index: null, slot: null, group: [], startedAt: null, endsAt: null, remainingMs: 0, next: { index: i, slot: slots[i], group: groupOf(slots, i), startsAt: start } };
      return { status, index: i, slot: slots[i], group: groupOf(slots, i), startedAt: start, endsAt: paused !== null ? null : end, remainingMs, next: nextSlot };
    }
    start = end;
  }
  return { status: "done", index: null, slot: null, group: [], startedAt: null, endsAt: null, remainingMs: 0, next: null };
}

const iso = (t: number) => new Date(t).toISOString();

/**
 * Avvia il giveaway dallo slot `index` (di default il primo), adesso. Con gli slot (`slots`), uno slot che parte insieme
 * a quello prima fa ripartire tutto il suo gruppo.
 */
export function startRun(now: number, index = 0, slots?: readonly GiveawaySlot[]): GiveawayRun {
  const i = Math.max(0, index);
  return { anchor: iso(now), anchorIndex: slots && i < slots.length ? leaderOf(slots, i) : i, paused: null };
}

/** Chiude lo slot in corso (con quelli partiti insieme) e fa partire subito il prossimo (o chiude il giveaway se era l'ultimo). */
export function skipRun(slots: readonly GiveawaySlot[], run: GiveawayRun, now: number): GiveawayRun {
  const c = giveawayClock(slots, run, now);
  if (c.status === "idle") return startRun(now, c.next?.index ?? 0, slots);
  if (c.status === "done" || c.index === null) return run;
  return { anchor: iso(now), anchorIndex: nextLeader(slots, c.index), paused: null };
}

/** Ferma il tempo dello slot in corso. */
export function pauseRun(slots: readonly GiveawaySlot[], run: GiveawayRun, now: number): GiveawayRun {
  const c = giveawayClock(slots, run, now);
  return c.status === "running" ? { ...run, paused: iso(now) } : run;
}

/** Riparte da dove si era fermato: tutti gli orari si spostano della durata della pausa. */
export function resumeRun(run: GiveawayRun, now: number): GiveawayRun {
  const anchor = time(run.anchor);
  const paused = time(run.paused);
  if (anchor === null || paused === null) return run;
  return { anchor: iso(anchor + Math.max(0, now - paused)), anchorIndex: run.anchorIndex, paused: null };
}

/** Spegne il giveaway (l'orologio torna fermo, pronto a ripartire dal primo slot). */
export function stopRun(): GiveawayRun {
  return { ...IDLE_RUN };
}

/**
 * Inizio e fine previsti dello slot `i` (ms), contando i gruppi uno dopo l'altro dall'ultima partenza (uno slot con
 * `together` ha gli orari del suo gruppo); null se l'orologio è fermo o lo slot viene prima della partenza (saltato o già
 * passato). Con la pausa sono gli orari "come se non ci fosse": chi li mostra dice "in pausa".
 */
export function slotWindow(slots: readonly GiveawaySlot[], run: GiveawayRun, i: number): { start: number; end: number } | null {
  const anchor = time(run.anchor);
  if (anchor === null || i < 0 || i >= slots.length) return null;
  const from = firstLeader(slots, run.anchorIndex);
  const target = leaderOf(slots, i);
  if (target < from) return null;
  let start = anchor;
  for (let k = from; k < target; k = nextLeader(slots, k)) start += ms(slots[k]);
  return { start, end: start + ms(slots[target]) };
}

/** Gli indici degli slot di un canale. */
export function slotsOfChannel(slots: readonly GiveawaySlot[], channel: string): number[] {
  return slots.flatMap((s, i) => (s.channel === channel ? [i] : []));
}

const romeClock = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

/**
 * `startsAt` a mezzanotte (ora italiana) vuol dire "il giorno si sa, l'ora no" (11/11/2026: dell'Attrix Showmatch si
 * sapeva il 16 novembre ma non l'orario): la pagina mostra solo la data e il conto alla rovescia solo i giorni.
 */
export function startHasTime(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && romeClock.format(t) !== "00:00";
}

/** Giorni di calendario che mancano a un inizio senza ora (domani = 1). */
export function daysUntil(msLeft: number): number {
  return Math.max(1, Math.ceil(msLeft / 86_400_000));
}

/** "4:05", "12:00", "1:02:03" */
export function formatRemaining(msLeft: number): string {
  const total = Math.max(0, Math.ceil(msLeft / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
