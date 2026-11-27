import type { GameCardInput } from "@/game-card/model";
import type { ReplayChange, ReplayData, ReplayPatch, ReplayTierOrNone } from "@/lib/tierReplay/types";
import { fill, type ReplayLabels } from "@/lib/tierReplayLabels";

/**
 * Il replay delle patch della tier list (27/11/2026, scelto da Pierluigi fra i tre prototipi): i fotogrammi costruiti
 * dai dati. Funzioni pure, senza import del server: le usano la pagina (HTML e tabella) e il palco nel browser. I testi
 * arrivano dentro il replay (`l`, tierReplayLabels.ts), così il palco non importa le otto lingue.
 *
 * Leggendarie: fotogramma 0 = la tier list pubblicata (fasce ufficiali di tierlist.ts, patch della lettura); 1 = la
 * stessa patch con tutte le partite registrate fino a oggi; poi una per patch. Dal fotogramma 1 la fascia è quella che
 * darebbe la regola a quei numeri (`ruleTier`), non una tier list pubblicata. Carte base: cardFrames.ts.
 */

export const LANES: ReplayTierOrNone[] = ["S", "A", "B", "C", "D", "unranked"];
export const RANK: Record<ReplayTierOrNone, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, unranked: 0 };

export type ReplayEvent = ReplayPatch["events"][number];

export type ReplayFrame = {
  key: string;
  /** etichetta della barra del tempo */
  label: string;
  /** etichetta corta (tabella della carta, telefono) */
  short: string;
  /** la frase del fotogramma, nel tabellone in cima al palco */
  title: string;
  /** il fotogramma dentro una frase: «con la patch del 17/11» */
  when: string;
  published: boolean;
  patch: string;
  /** il giorno della patch, già scritto nella lingua */
  day: string;
  /** partite contate nel fotogramma */
  games: number;
  /** il comunicato del fotogramma (una riga) */
  lead: string;
  events: ReplayEvent[];
  news?: string;
  /** true quando gli eventi sono quelli della patch nuova di questo fotogramma */
  newPatch: boolean;
  /** solo carte base: il win rate medio di chi registra nella patch, la riga da cui parte la regola */
  baseline?: number;
};

export type ReplayCell = {
  tier: ReplayTierOrNone;
  /** win rate e intervallo; null se la carta non è stata giocata */
  r: number | null;
  lo: number | null;
  hi: number | null;
  games: number;
  share: number | null;
  /** la carta non era ancora nel gioco in quella patch */
  notYet?: boolean;
};

export type ReplayCard = {
  slug: string;
  name: string;
  href: string;
  game: GameCardInput;
  cells: ReplayCell[];
  changes: ReplayChange[];
  boosted: boolean;
  ladderTier: ReplayTierOrNone;
  crimson: { banRate: number; finalists: number } | null;
  /** fascia e media della tier list della community e dei voti 1–10 (mai quante persone) */
  community?: { tier: string; avg: number };
  votes?: { tier?: string; avg: number };
};

export type Replay = {
  locale: string;
  /** "legendary": le Leggendarie con la regola del 9/11; "card": le carte base con la media della patch (cardFrames.ts) */
  kind: "legendary" | "card";
  l: ReplayLabels;
  frames: ReplayFrame[];
  cards: ReplayCard[];
  headline: string;
  steady: string | null;
  /** la carta aperta all'inizio: quella della riga in cima */
  headlineSlug: string;
  /** solo Leggendarie: la news della tier list e la data della lettura pubblicata */
  officialNews: string;
  officialReadLabel: string;
  officialGames: number;
};

/** il giorno e il mese in cifre nella lingua, senza zeri davanti né punto finale (le frasi hanno il loro): 4/11, 11/4, 4.11 */
export const dayMonth = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", timeZone: "UTC" })
    .format(new Date(`${iso}T12:00:00Z`))
    .replace(/(^|D)0(d)/g, "$1$2")
    .replace(/.$/, "");
const dayShortMonth = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

export const fmtInt = (locale: string, n: number) => new Intl.NumberFormat(locale, { useGrouping: "always" }).format(n);
export const fmtPct = (locale: string, r: number | null) =>
  r === null ? "–" : new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r);

export const laneName = (l: ReplayLabels, t: ReplayTierOrNone) => (t === "unranked" ? l.lane.unranked : fill(l.lane.tier, { tier: t }));
/** la fascia in una parola, per le frasi («da B a S») */
export const tierWord = (l: ReplayLabels, t: ReplayTierOrNone) => (t === "unranked" ? l.unrankedWord : t);
export const gamesText = (l: ReplayLabels, locale: string, n: number) => (n === 1 ? l.stage.gamesOne : fill(l.stage.gamesMany, { n: fmtInt(locale, n) }));
export const changesText = (l: ReplayLabels, n: number) => (n === 1 ? l.frame.changesOne : fill(l.frame.changesMany, { n }));

/** il salto più grosso fra due fotogrammi vicini (tutte e due con una fascia), a pari salto la carta più giocata all'arrivo */
export function biggestJump(cards: ReplayCard[], frames: ReplayFrame[]): { card: ReplayCard; k: number } | null {
  let best: { card: ReplayCard; k: number; size: number; share: number } | null = null;
  for (const c of cards) {
    for (let k = 1; k < frames.length; k++) {
      const a = c.cells[k - 1].tier;
      const b = c.cells[k].tier;
      if (a === "unranked" || b === "unranked") continue;
      const size = Math.abs(RANK[a] - RANK[b]);
      const share = c.cells[k].share ?? 0;
      if (size > 0 && (!best || size > best.size || (size === best.size && share > best.share))) best = { card: c, k, size, share };
    }
  }
  return best;
}

/** la frase del salto più grosso, con i cambi successivi della stessa carta */
export function jumpText(l: ReplayLabels, frames: ReplayFrame[], card: ReplayCard, k: number): string {
  let then = "";
  for (let j = k + 1; j < frames.length; j++) {
    const t = card.cells[j].tier;
    const prev = card.cells[j - 1].tier;
    // entrare o uscire dalle non classificate dipende dalle partite, non è un cambio da raccontare
    if (t !== prev && t !== "unranked" && prev !== "unranked") then += fill(l.headline.then, { tier: tierWord(l, t), when: frames[j].when });
  }
  return fill(l.headline.jump, {
    card: card.name,
    a: tierWord(l, card.cells[k - 1].tier),
    b: tierWord(l, card.cells[k].tier),
    when: frames[k].when,
    then,
  });
}

export function buildReplay(data: ReplayData, l: ReplayLabels): Replay {
  const { locale } = data;
  // una patch senza partite (Tracker che non risponde, patch appena uscita) non diventa un fotogramma vuoto
  const patches = data.patches.filter((p) => p.games > 0);
  const first = patches.find((p) => p.id === data.officialPatch) ?? patches[0];
  const firstDay = first ? dayMonth(locale, first.date) : "";

  const frames: ReplayFrame[] = [
    {
      key: "published",
      label: fill(l.frame.published, { date: dayShortMonth(locale, data.officialRead) }),
      short: dayShortMonth(locale, data.officialRead),
      title: fill(l.frame.publishedTitle, { date: data.officialReadLabel }),
      when: l.when.published,
      published: true,
      patch: data.officialPatch,
      day: firstDay,
      games: data.officialGames,
      lead: fill(l.frame.publishedLead, { date: data.officialReadLabel, n: fmtInt(locale, data.officialGames), day: firstDay }),
      events: first?.events ?? [],
      news: data.officialNews,
      newPatch: true,
    },
    ...patches.map((p, i): ReplayFrame => {
      const day = dayMonth(locale, p.date);
      const same = p.id === data.officialPatch;
      return {
        key: p.id,
        label: fill(same ? l.frame.patchToday : l.frame.patch, { day }),
        short: same ? fill(l.frame.shortToday, { day }) : day,
        title: fill(same ? l.frame.titleToday : l.frame.patch, { day }),
        when: fill(same ? l.when.today : l.when.patch, { day }),
        published: false,
        patch: p.id,
        day,
        games: p.games,
        lead: same
          ? fill(l.frame.leadToday, { n: fmtInt(locale, p.games), m: fmtInt(locale, data.officialGames) })
          : fill(l.frame.leadPatch, { changes: changesText(l, p.changeCount), n: fmtInt(locale, p.games) }),
        events: same ? [] : p.events,
        news: p.news,
        newPatch: !same && i > 0,
      };
    }),
  ];

  const officialTotal = data.legendaries.reduce((s, x) => s + x.official.rate.games, 0) || 1;
  const cards: ReplayCard[] = data.legendaries.map((leg) => {
    const g = leg.official.rate.games;
    const cells: ReplayCell[] = [
      {
        tier: leg.official.tier,
        r: g ? leg.official.rate.r : null,
        lo: g ? leg.official.rate.lo : null,
        hi: g ? leg.official.rate.hi : null,
        games: g,
        share: g / officialTotal,
      },
      ...patches.map((p): ReplayCell => {
        const s = leg.patches[p.id];
        if (!s) return { tier: "unranked", r: null, lo: null, hi: null, games: 0, share: null };
        return { tier: s.ruleTier, r: s.r, lo: s.lo, hi: s.hi, games: s.games, share: s.share };
      }),
    ];
    return {
      slug: leg.slug,
      name: leg.name,
      href: leg.href,
      game: leg.game,
      cells,
      changes: leg.changes,
      boosted: leg.official.boosted,
      ladderTier: leg.official.ladderTier,
      crimson: leg.official.crimson,
      community: leg.community,
      votes: leg.votes,
    };
  });

  const best = biggestJump(cards, frames);
  const steadyCards = cards.filter((c) => c.cells[0].tier !== "unranked" && c.cells.every((x) => x.tier === c.cells[0].tier));
  return {
    locale,
    kind: "legendary",
    l,
    frames,
    cards,
    headline: best ? jumpText(l, frames, best.card, best.k) : l.headline.noneLegendary,
    steady: steadyCards.length
      ? fill(l.headline.steady, { list: steadyCards.map((c) => fill(l.headline.steadyItem, { name: c.name, tier: c.cells[0].tier })).join(l.listSep) })
      : null,
    headlineSlug: best?.card.slug ?? cards[0]?.slug ?? "",
    officialNews: data.officialNews,
    officialReadLabel: data.officialReadLabel,
    officialGames: data.officialGames,
  };
}

export type Move = { dir: "up" | "down" | "in" | "out"; text: string } | null;

/** il movimento della carta arrivando al fotogramma k */
export function moveAt(r: Replay, card: ReplayCard, k: number): Move {
  if (k <= 0) return null;
  const a = card.cells[k - 1].tier;
  const b = card.cells[k].tier;
  if (a === b) return null;
  if (a === "unranked") return { dir: "in", text: fill(r.l.move.in, { b }) };
  if (b === "unranked") return { dir: "out", text: fill(r.l.move.out, { a }) };
  return { dir: RANK[b] > RANK[a] ? "up" : "down", text: fill(r.l.move.change, { a, b }) };
}

/** un passaggio fra due fasce (non l'entrata o l'uscita dalle non classificate, che dipende dalle partite) */
export function isShift(r: Replay, card: ReplayCard, k: number): boolean {
  const m = moveAt(r, card, k);
  return !!m && (m.dir === "up" || m.dir === "down");
}

/** le modifiche ufficiali alla carta uscite con la patch del fotogramma (solo i fotogrammi che aprono una patch) */
export function changesAt(card: ReplayCard, frame: ReplayFrame): ReplayChange[] {
  if (!frame.newPatch) return [];
  return card.changes.filter((c) => c.patch === frame.patch);
}

export const kindWord = (l: ReplayLabels, k: ReplayChange["kind"]) => l.kind[k];

/** perché la carta sta dove sta nel fotogramma k: una o due frasi, solo dai dati */
export function whyAt(r: Replay, card: ReplayCard, k: number): string[] {
  const { l } = r;
  const f = r.frames[k];
  const cell = card.cells[k];
  const out: string[] = [];
  const notes = (m: ReplayChange[]) => m.map((x) => x.note).join(" ");
  const mod = changesAt(card, f);

  if (r.kind === "card") {
    if (cell.notYet) return [l.why.notYet];
    if (mod.length) out.push(fill(l.why.changed, { notes: notes(mod) }));
    else if (k > 0) out.push(l.why.meta);
    if (cell.r === null) out.push(l.why.notPlayed);
    else if (cell.tier === "unranked") out.push(l.why.unranked);
    if (cell.r !== null && f.baseline !== undefined) out.push(fill(l.why.cardRate, { r: fmtPct(r.locale, cell.r), b: fmtPct(r.locale, f.baseline) }));
    return out;
  }

  if (k === 0) {
    if (mod.length) out.push(fill(l.why.changedFirst, { day: f.day, notes: notes(mod) }));
    if (card.boosted && card.crimson)
      out.push(
        fill(l.why.crimson, {
          tier: tierWord(l, card.ladderTier),
          p: fmtPct(r.locale, card.crimson.banRate),
          finalists: card.crimson.finalists === 1 ? l.why.finalistsOne : fill(l.why.finalistsMany, { n: card.crimson.finalists }),
        }),
      );
    else if (cell.tier !== "unranked") out.push(fill(l.why.ladder, { day: f.day }));
    if (cell.tier === "unranked") out.push(l.why.unrankedFirst);
    return out;
  }
  if (mod.length) out.push(fill(l.why.changed, { notes: notes(mod) }));
  else if (!f.newPatch) out.push(fill(l.why.samePatch, { date: r.officialReadLabel }));
  else out.push(l.why.meta);
  if (cell.tier === "unranked") out.push(cell.games ? l.why.unranked : l.why.notPlayed);
  else if (card.boosted) out.push(fill(l.why.crimsonKept, { date: r.officialReadLabel }));
  return out;
}

/** le carte di una corsia nel fotogramma k, dalla migliore (bordo basso, poi partite) */
export function laneCards(r: Replay, lane: ReplayTierOrNone, k: number): ReplayCard[] {
  return r.cards
    .filter((c) => c.cells[k].tier === lane)
    .sort((a, b) => (b.cells[k].lo ?? -1) - (a.cells[k].lo ?? -1) || b.cells[k].games - a.cells[k].games);
}

/** quante carte cambiano fascia arrivando al fotogramma k (per le carte base solo i passaggi fra due fasce) */
export function movesCount(r: Replay, k: number): number {
  return r.cards.filter((c) => (r.kind === "card" ? isShift(r, c, k) : moveAt(r, c, k))).length;
}

/** le parole del replay: Leggendarie o carte base */
export const noun = (r: Replay) => (r.kind === "card" ? r.l.noun.card : r.l.noun.legendary);
