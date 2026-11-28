import type { PricePoint } from "./market";

/**
 * La scheda che racconta (28/11/2026, Pierluigi sulle cinque proposte del Mercato: "vorrei il tool composto dalla vetrina
 * e la scheda che racconta per ogni carta"). Funzioni pure sullo storico di un oggetto, senza import a runtime (i test le
 * caricano con Node): lo stato dell'oggetto a ogni lettura del raccoglitore, gli eventi (comparsa, ribasso, rialzo,
 * secondo venditore, sparizione), il prezzo tipico dei 7 giorni, l'affidabilità a parole, le note del diario e i tratti
 * del grafico a gradini.
 *
 * Due stati da non confondere (regola delle proposte del 28/11): "letto, nessuna offerta" e "non letto". La ricerca di
 * Steam dà solo gli oggetti con offerte, quindi un'ora senza la riga dell'oggetto vuol dire "nessuna offerta" solo se in
 * quell'ora il raccoglitore ha letto la fonte (`readHours`: le ore con almeno un oggetto della fonte). Fino al 25/11/2026
 * il raccoglitore leggeva Origins circa due volte al giorno, da allora ogni ora: fra due letture lontane non si sa che cosa
 * è successo, e il grafico lo disegna tratteggiato.
 */

export const HOUR_MS = 3600_000;
const DAY_MS = 24 * HOUR_MS;
/** Due letture più lontane di così non sono "di seguito": in mezzo ci sono ore non lette. */
export const READ_GAP_MS = 1.5 * HOUR_MS;

export type Reading = { t: number; listed: boolean; price: number | null; listings: number };

/** Le ore lette della fonte (inizio dell'ora, millisecondi), senza doppioni e in ordine. */
export function readHoursOf(hours: readonly string[]): number[] {
  const out = new Set<number>();
  for (const h of hours) {
    const t = Date.parse(h);
    if (Number.isFinite(t)) out.add(t);
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Lo stato dell'oggetto a ogni lettura, dalla prima in cui era in vendita. Con `readHours` le ore lette senza la riga
 * dell'oggetto sono "letto, nessuna offerta"; senza (`null`: fonte troppo grande per leggerle tutte) restano solo le ore
 * in cui l'oggetto era in vendita.
 */
export function readingsOf(hourly: readonly PricePoint[], readHours: readonly number[] | null): Reading[] {
  const seen = new Map<number, PricePoint>();
  for (const p of hourly) {
    const t = Date.parse(p.t);
    if (Number.isFinite(t)) seen.set(t, p);
  }
  if (!seen.size) return [];
  const first = Math.min(...seen.keys());
  const times = new Set<number>(seen.keys());
  if (readHours) for (const t of readHours) if (t >= first) times.add(t);
  return [...times]
    .sort((a, b) => a - b)
    .map((t) => {
      const p = seen.get(t);
      return p ? { t, listed: true, price: p.close, listings: p.listings } : { t, listed: false, price: null, listings: 0 };
    });
}

export type MarketEventKind = "first" | "back" | "gone" | "down" | "up" | "seller";
/**
 * Un fatto del mercato, visto alla lettura `t`; `from` è la lettura prima, quindi il fatto è avvenuto fra le due.
 * "seller": arriva un secondo venditore (da una offerta a più di una): con tante offerte (CS2) i cambi del numero non
 * sono fatti da raccontare.
 */
export type MarketEvent = { kind: MarketEventKind; t: number; from: number | null; price: number; before: number | null; listings: number };

export function eventsOf(readings: readonly Reading[]): MarketEvent[] {
  const out: MarketEvent[] = [];
  let prev: Reading | null = null;
  let everListed = false;
  for (const cur of readings) {
    if (cur.listed && cur.price !== null && (!prev || !prev.listed)) {
      out.push({ kind: everListed ? "back" : "first", t: cur.t, from: prev ? prev.t : null, price: cur.price, before: null, listings: cur.listings });
      everListed = true;
    } else if (prev && prev.listed && prev.price !== null && !cur.listed) {
      out.push({ kind: "gone", t: cur.t, from: prev.t, price: prev.price, before: null, listings: 0 });
    } else if (prev && prev.listed && cur.listed && prev.price !== null && cur.price !== null) {
      if (prev.listings === 1 && cur.listings > 1) out.push({ kind: "seller", t: cur.t, from: prev.t, price: cur.price, before: prev.price, listings: cur.listings });
      else if (cur.price !== prev.price) out.push({ kind: cur.price < prev.price ? "down" : "up", t: cur.t, from: prev.t, price: cur.price, before: prev.price, listings: cur.listings });
    }
    prev = cur;
  }
  return out;
}

export type Typical = { median: number; n: number; spread: number };

/** Prezzo tipico: la mediana delle letture con offerte negli ultimi `days` giorni, con quante sono e quanto si sparpagliano. */
export function typicalPrice(readings: readonly Reading[], now: number, days = 7): Typical | null {
  const prices = readings
    .filter((r) => r.listed && r.price !== null && r.t > now - days * DAY_MS && r.t <= now)
    .map((r) => r.price as number)
    .sort((a, b) => a - b);
  if (!prices.length) return null;
  const n = prices.length;
  const median = n % 2 ? prices[(n - 1) / 2] : (prices[n / 2 - 1] + prices[n / 2]) / 2;
  return { median, n, spread: prices[n - 1] / prices[0] - 1 };
}

/**
 * Affidabilità a parole, come la volatilità di TCGplayer e la fiducia di Card Ladder: soglie da tarare sui dati veri.
 * Senza offerte adesso non c'è nessun prezzo da giudicare.
 */
export const RELIABILITY = { minReadings: 6, wildSpread: 0.2 } as const;
export type Reliability = "steady" | "wild" | "thin";

export function reliabilityOf(onSale: boolean, typical: Typical | null): Reliability | null {
  if (!onSale) return null;
  if (!typical || typical.n < RELIABILITY.minReadings) return "thin";
  return typical.spread > RELIABILITY.wildSpread ? "wild" : "steady";
}

export type StoryNoteKind = "first" | "drop" | "rise" | "gone" | "back" | "seller";
/** Una nota del diario: dove metterla sul grafico (`t`, `price`) e che cosa dice. */
export type StoryNote = { kind: StoryNoteKind; t: number; price: number; before: number | null; from: number | null; to: number | null };

/** Soglie delle note: un ribasso conta da -10%, un rialzo da +3% (sotto è il centesimo fra due venditori). */
export const NOTE_DROP = 0.1;
export const NOTE_RISE = 0.03;

/**
 * Le note del diario, in ordine di tempo e al massimo `max`: la prima offerta, il ribasso e il rialzo più forti, le
 * sparizioni, i ritorni e l'arrivo del secondo venditore. Le frasi le scrivono i testi della lingua.
 */
export function storyNotes(events: readonly MarketEvent[], max = 6): StoryNote[] {
  const out: StoryNote[] = [];
  const first = events.find((e) => e.kind === "first");
  if (first) out.push({ kind: "first", t: first.t, price: first.price, before: null, from: null, to: null });
  const change = (e: MarketEvent) => (e.before ? (e.price - e.before) / e.before : 0);
  const drop = events.filter((e) => e.kind === "down").sort((a, b) => change(a) - change(b))[0];
  if (drop && -change(drop) >= NOTE_DROP) out.push({ kind: "drop", t: drop.t, price: drop.price, before: drop.before, from: drop.from, to: drop.t });
  const rise = events.filter((e) => e.kind === "up").sort((a, b) => change(b) - change(a))[0];
  if (rise && change(rise) >= NOTE_RISE) out.push({ kind: "rise", t: rise.t, price: rise.price, before: rise.before, from: rise.from, to: rise.t });
  for (const e of events) {
    if (e.kind === "gone" && e.from !== null) out.push({ kind: "gone", t: e.from, price: e.price, before: null, from: e.from, to: e.t });
    if (e.kind === "back") out.push({ kind: "back", t: e.t, price: e.price, before: null, from: e.from, to: e.t });
  }
  const seller = events.find((e) => e.kind === "seller");
  if (seller) out.push({ kind: "seller", t: seller.t, price: seller.price, before: seller.before, from: seller.from, to: seller.t });
  return out.sort((a, b) => a.t - b.t).slice(0, max);
}

/**
 * I tratti del grafico a gradini fra `t0` e `t1`:
 * - "solid": in vendita a due letture di seguito;
 * - "gap": in vendita a due letture lontane (in mezzo ore non lette: tratteggio);
 * - "trail": in vendita a una lettura e sparito alla successiva (non sappiamo quando: puntini);
 * - `bands`: fra due letture senza offerte ("letto, nessuna offerta").
 * Ogni tratto è orizzontale al prezzo di partenza; `next` è il prezzo della lettura dopo, per il gradino verticale.
 */
export type StepLine = { kind: "solid" | "gap" | "trail"; t0: number; t1: number; price: number; next: number | null };
export type StepBand = { t0: number; t1: number };

export function stepSegments(readings: readonly Reading[], t0: number, t1: number): { lines: StepLine[]; bands: StepBand[] } {
  const lines: StepLine[] = [];
  const bands: StepBand[] = [];
  const clip = (a: number, b: number) => [Math.max(a, t0), Math.min(b, t1)] as const;
  for (let i = 0; i < readings.length; i++) {
    const a = readings[i];
    const b = readings[i + 1];
    if (!a.listed || a.price === null) {
      if (b) {
        const [x0, x1] = clip(a.t, b.t);
        if (x1 > x0) bands.push({ t0: x0, t1: x1 });
      }
      continue;
    }
    if (!b) {
      const [x0, x1] = clip(a.t, Math.max(a.t, t1));
      if (x1 >= x0) lines.push({ kind: "solid", t0: x0, t1: x1, price: a.price, next: null });
      continue;
    }
    if (b.listed && b.price !== null) {
      const [x0, x1] = clip(a.t, b.t);
      if (x1 > x0) lines.push({ kind: b.t - a.t > READ_GAP_MS ? "gap" : "solid", t0: x0, t1: x1, price: a.price, next: b.t <= t1 ? b.price : null });
    } else {
      const stub = Math.min(a.t + HOUR_MS, b.t);
      const [s0, s1] = clip(a.t, stub);
      if (s1 > s0) lines.push({ kind: "solid", t0: s0, t1: s1, price: a.price, next: null });
      const [x0, x1] = clip(stub, b.t);
      if (x1 > x0) lines.push({ kind: "trail", t0: x0, t1: x1, price: a.price, next: null });
    }
  }
  return { lines, bands };
}

/** Lo stato a un'ora qualsiasi (per il dito sul grafico): l'ultima lettura prima, e se l'ora cade fra due letture lontane. */
export function stateAt(readings: readonly Reading[], t: number): { reading: Reading | null; unread: boolean } {
  let reading: Reading | null = null;
  let next: Reading | null = null;
  for (const r of readings) {
    if (r.t <= t) reading = r;
    else {
      next = r;
      break;
    }
  }
  const unread = Boolean(reading && next && next.t - reading.t > READ_GAP_MS && t >= reading.t + HOUR_MS);
  return { reading, unread };
}

/** Da quando l'oggetto è in vendita a ogni lettura senza interruzioni (null se all'ultima lettura non lo è). */
export function onSaleSince(readings: readonly Reading[]): number | null {
  if (!readings.length || !readings[readings.length - 1].listed) return null;
  let i = readings.length - 1;
  while (i > 0 && readings[i - 1].listed) i--;
  return readings[i].t;
}

/** Il prezzo dell'ultima lettura con offerte al più tardi `at` (per la variazione a 7 giorni e dal primo giorno). */
export function priceAt(readings: readonly Reading[], at: number): number | null {
  let p: number | null = null;
  for (const r of readings) {
    if (r.t > at) break;
    if (r.listed && r.price !== null) p = r.price;
  }
  return p;
}
