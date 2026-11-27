import type { GameCardInput } from "@/game-card/model";
import type { LabChange, LabData, LabPatch, LabTierOrNone } from "@/lib/tierLab/types";

/**
 * Prototipo 3 della tier list, «Il replay delle patch» (27/11/2026, branch claude/tierlist-lab): i fotogrammi del
 * replay costruiti da LabData. Funzioni pure, senza import del server: le usano la pagina (HTML e tabella) e il palco
 * nel browser. Testi in italiano solo per il prototipo.
 *
 * Fotogrammi: 0 = la tier list pubblicata il 9/11 (fasce ufficiali, patch ea-1104); 1 = la stessa patch con tutte le
 * partite registrate fino a oggi; 2, 3 = le patch dopo. Dal fotogramma 1 in poi la fascia è quella che darebbe la
 * regola del 9/11 a quei numeri (`ruleTier`), non una tier list pubblicata.
 */

export const LANES: LabTierOrNone[] = ["S", "A", "B", "C", "D", "unranked"];
const RANK: Record<LabTierOrNone, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, unranked: 0 };

export const laneName = (t: LabTierOrNone) => (t === "unranked" ? "Non classificate" : t);
/** la fascia in una parola, per le frasi («da B a S», «esce da D») */
export const tierWord = (t: LabTierOrNone) => (t === "unranked" ? "non classificata" : t);

export type ReplayEvent = LabPatch["events"][number];

export type ReplayFrame = {
  key: string;
  /** etichetta della barra del tempo */
  label: string;
  /** etichetta corta (grafico della carta) */
  short: string;
  /** la frase del fotogramma, nel tabellone in cima al palco */
  title: string;
  published: boolean;
  patch: string;
  /** partite contate nel fotogramma */
  games: number;
  /** il comunicato del fotogramma (una riga) */
  lead: string;
  events: ReplayEvent[];
  news?: string;
  /** true quando gli eventi sono quelli della patch nuova di questo fotogramma */
  newPatch: boolean;
  /** solo carte base: il win rate medio di chi registra nella patch, la riga da cui parte la regola di prova */
  baseline?: number;
};

export type ReplayCell = {
  tier: LabTierOrNone;
  /** win rate e intervallo; null se la Leggendaria non è stata giocata */
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
  changes: LabChange[];
  boosted: boolean;
  ladderTier: LabTierOrNone;
  crimson: { banRate: number; finalists: number } | null;
  /** solo carte base: fascia e media della tier list della community e dei voti 1–10 (mai quante persone) */
  community?: { tier: string; avg: number };
  votes?: { tier?: string; avg: number };
};

export type Replay = {
  locale: string;
  /** "legendary": le 12 Leggendarie, regola del 9/11; "card": le carte base, regola di prova (cardFrames.ts) */
  kind: "legendary" | "card";
  frames: ReplayFrame[];
  cards: ReplayCard[];
  headline: string;
  steady: string | null;
  /** la carta della riga in cima: quella aperta all'inizio */
  headlineSlug: string;
  officialNews: string;
  officialReadLabel: string;
  officialGames: number;
};

const dayMonth = (locale: string, iso: string, month: "short" | "numeric") => {
  const d = new Date(`${iso}T12:00:00Z`);
  if (month === "numeric") return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(d).replace(".", "");
};

export const fmtInt = (locale: string, n: number) => new Intl.NumberFormat(locale, { useGrouping: "always" }).format(n);
export const fmtPct = (locale: string, r: number | null) =>
  r === null ? "–" : `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r * 100)}%`;

export function buildReplay(data: LabData): Replay {
  const { locale } = data;
  const patches = data.patches;
  const first = patches.find((p) => p.id === data.officialPatch) ?? patches[0];
  const firstDay = first ? dayMonth(locale, first.date, "numeric") : "";
  const readShort = dayMonth(locale, data.officialRead, "short");

  const frames: ReplayFrame[] = [
    {
      key: "published",
      label: `Pubblicata · ${readShort}`,
      short: readShort,
      title: `Tier list del ${data.officialReadLabel}`,
      published: true,
      patch: data.officialPatch,
      games: data.officialGames,
      lead: `Le fasce pubblicate il ${data.officialReadLabel}, con ${fmtInt(locale, data.officialGames)} partite della patch del ${firstDay}.`,
      events: first?.events ?? [],
      news: data.officialNews,
      newPatch: true,
    },
    ...patches.map((p, i): ReplayFrame => {
      const day = dayMonth(locale, p.date, "numeric");
      const same = p.id === data.officialPatch;
      return {
        key: p.id,
        label: same ? `Patch del ${day} oggi` : `Patch del ${day}`,
        short: same ? `${day} oggi` : day,
        title: same ? `Patch del ${day}, con le partite di oggi` : `Patch del ${day}`,
        published: false,
        patch: p.id,
        games: p.games,
        lead: same
          ? `Stessa patch, più partite: ${fmtInt(locale, p.games)} registrate fino a oggi invece di ${fmtInt(locale, data.officialGames)}.`
          : `${p.changeCount === 1 ? "Una modifica" : `${p.changeCount} modifiche`} alle carte e ${fmtInt(locale, p.games)} partite registrate.`,
        events: same ? [] : p.events,
        news: p.news,
        newPatch: !same && i > 0,
      };
    }),
  ];

  const cards: ReplayCard[] = data.legendaries.map((l) => {
    const officialTotal = data.legendaries.reduce((s, x) => s + x.official.rate.games, 0) || 1;
    const cells: ReplayCell[] = [
      {
        tier: l.official.tier,
        r: l.official.rate.games ? l.official.rate.r : null,
        lo: l.official.rate.games ? l.official.rate.lo : null,
        hi: l.official.rate.games ? l.official.rate.hi : null,
        games: l.official.rate.games,
        share: l.official.rate.games / officialTotal,
      },
      ...patches.map((p): ReplayCell => {
        const s = l.patches[p.id];
        if (!s) return { tier: "unranked", r: null, lo: null, hi: null, games: 0, share: null };
        return { tier: s.ruleTier, r: s.r, lo: s.lo, hi: s.hi, games: s.games, share: s.share };
      }),
    ];
    return {
      slug: l.slug,
      name: l.name,
      href: l.href,
      game: l.game,
      cells,
      changes: l.changes,
      boosted: l.official.boosted,
      ladderTier: l.official.ladderTier,
      crimson: l.official.crimson,
    };
  });

  // il movimento più grosso: il salto di fasce più ampio fra due fotogrammi vicini (tutte e due classificate),
  // a pari salto quello della carta più giocata all'arrivo
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
  let headline = "Nessuna Leggendaria ha cambiato fascia fra un fotogramma e l'altro.";
  let headlineSlug = cards[0]?.slug ?? "";
  if (best) {
    const { card, k } = best;
    const parts = [`${card.name}, da ${tierWord(card.cells[k - 1].tier)} a ${tierWord(card.cells[k].tier)} con ${frameWhen(frames[k])}`];
    for (let j = k + 1; j < frames.length; j++) {
      const t = card.cells[j].tier;
      if (t !== card.cells[j - 1].tier) parts.push(`poi ${tierWord(t)} con ${frameWhen(frames[j])}`);
    }
    headline = `Il salto più grosso: ${parts.join(", ")}.`;
    headlineSlug = card.slug;
  }
  const steadyCards = cards.filter((c) => c.cells[0].tier !== "unranked" && c.cells.every((x) => x.tier === c.cells[0].tier));
  const steady = steadyCards.length
    ? `Sempre nella stessa fascia: ${steadyCards.map((c) => `${c.name} (${c.cells[0].tier})`).join(", ")}.`
    : null;

  return {
    locale,
    kind: "legendary",
    frames,
    cards,
    headline,
    steady,
    headlineSlug,
    officialNews: data.officialNews,
    officialReadLabel: data.officialReadLabel,
    officialGames: data.officialGames,
  };
}

/** «la patch del 17/11», «i numeri di oggi della patch del 4/11» */
export function frameWhen(f: ReplayFrame): string {
  if (f.published) return "la tier list pubblicata";
  if (!f.newPatch) return `le partite di oggi della ${f.label.replace(/ oggi$/, "").replace(/^Patch/, "patch")}`;
  return f.label.replace(/^Patch/, "la patch");
}

export type Move = { dir: "up" | "down" | "in" | "out"; text: string } | null;

/** il movimento della carta arrivando al fotogramma k */
export function moveAt(card: ReplayCard, k: number): Move {
  if (k <= 0) return null;
  const a = card.cells[k - 1].tier;
  const b = card.cells[k].tier;
  if (a === b) return null;
  if (a === "unranked") return { dir: "in", text: `entra in ${b}` };
  if (b === "unranked") return { dir: "out", text: `esce da ${a}` };
  return RANK[b] > RANK[a] ? { dir: "up", text: `da ${a} a ${b}` } : { dir: "down", text: `da ${a} a ${b}` };
}

/** le modifiche ufficiali alla carta uscite con la patch del fotogramma (solo i fotogrammi che aprono una patch) */
export function changesAt(card: ReplayCard, frame: ReplayFrame): LabChange[] {
  if (!frame.newPatch) return [];
  return card.changes.filter((c) => c.patch === frame.patch);
}

const KIND: Record<LabChange["kind"], string> = { buff: "Potenziata", nerf: "Indebolita", rework: "Rifatta", deck: "Modificata" };
export const kindWord = (k: LabChange["kind"]) => KIND[k];

/** perché la carta sta dove sta nel fotogramma k: una o due frasi, solo dai dati */
export function whyAt(r: Replay, card: ReplayCard, k: number): string[] {
  const f = r.frames[k];
  const cell = card.cells[k];
  const out: string[] = [];
  const mod = changesAt(card, f);
  if (r.kind === "card") {
    if (cell.notYet) return ["Non era ancora nel gioco."];
    if (mod.length) out.push(`Modificata da questa patch: ${mod.map((m) => m.note).join(" ")}`);
    else if (k > 0) out.push("Nessuna modifica alla carta: è cambiato il meta intorno.");
    if (cell.r === null) out.push("Non giocata in questa patch.");
    else if (cell.tier === "unranked") out.push("Non classificata qui: le sue partite non bastano per una fascia.");
    if (cell.r !== null && f.baseline !== undefined)
      out.push(
        `I mazzi che la contengono vincono il ${fmtPct(r.locale, cell.r)} delle partite, contro il ${fmtPct(r.locale, f.baseline)} di tutte le partite registrate nella patch.`,
      );
    return out;
  }
  if (k === 0) {
    if (mod.length) out.push(`Modificata con la patch del 4/11: ${mod.map((m) => m.note).join(" ")}`);
    if (card.boosted && card.crimson)
      out.push(
        `Il ladder da solo la metteva in ${tierWord(card.ladderTier)}: la Crimson Cup l'ha alzata di una fascia (bandita nel ${fmtPct(r.locale, card.crimson.banRate)} delle partite, ${card.crimson.finalists === 1 ? "un finalista" : `${card.crimson.finalists} finalisti`}).`,
      );
    else if (cell.tier !== "unranked") out.push("Fascia del ladder: win rate a due lati della patch del 4/11.");
    if (cell.tier === "unranked") out.push("Non classificata: le sue partite non bastavano per una fascia.");
    return out;
  }
  if (mod.length) out.push(`Modificata da questa patch: ${mod.map((m) => m.note).join(" ")}`);
  else if (!f.newPatch) out.push("Stessa patch e nessuna modifica alla carta: contano solo le partite in più registrate dopo il 9/11.");
  else out.push("Nessuna modifica alla carta: è cambiato il meta intorno.");
  if (cell.tier === "unranked") out.push(cell.games ? "Non classificata qui: le sue partite non bastano per una fascia." : "Non giocata in questa patch.");
  else if (card.boosted) out.push("La regola conta ancora la Crimson Cup come il 9/11: una fascia in più.");
  return out;
}

/** le carte di una corsia nel fotogramma k, dalla migliore (bordo basso, poi partite) */
export function laneCards(r: Replay, lane: LabTierOrNone, k: number): ReplayCard[] {
  return r.cards
    .filter((c) => c.cells[k].tier === lane)
    .sort((a, b) => (b.cells[k].lo ?? -1) - (a.cells[k].lo ?? -1) || b.cells[k].games - a.cells[k].games);
}

/** le parole del replay: Leggendarie o carte base */
export function noun(r: Replay) {
  return r.kind === "card"
    ? { one: "carta", many: "carte", none: "Nessuna carta", col: "Carta", share: "Nei mazzi", status: "Regola di prova" }
    : { one: "Leggendaria", many: "Leggendarie", none: "Nessuna Leggendaria", col: "Leggendaria", share: "Quota", status: "Regola applicata" };
}

/** quante Leggendarie cambiano fascia arrivando al fotogramma k */
export function movesCount(r: Replay, k: number): number {
  return r.cards.filter((c) => moveAt(c, k)).length;
}
