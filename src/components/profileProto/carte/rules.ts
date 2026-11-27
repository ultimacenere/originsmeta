import type { ProtoData } from "@/lib/profileProto/load";
import { DEMO2_CUTOFF, TIER_LIST_MIN_CARDS, WELL_RATED, dayOf } from "@/lib/community/achievements";
import type { ArtId } from "./art";

/*
  Il mazzo dei traguardi (prototipo «carte», 27/11/2026). Regole PROVVISORIE, da decidere con Pierluigi: il profilo è un
  mazzo di Origins TCG, 1 Leggendaria (la carta dell'iscritto) + 12 carte × 2 copie = 25 carte, come la regola vera del
  deck builder. Ogni carta ha due copie con due soglie calcolate dai dati veri del profilo. Funzioni pure.
*/

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_NAME: Record<Rarity, string> = { common: "Comune", rare: "Rara", epic: "Epica", legendary: "Leggendaria" };

export const DECK_SIZE = 25;

/** "iscritto prima della prima settimana della community" (seconda copia del Pioniere): provvisorio */
const FIRST_WEEK_END = "2026-09-22T00:00:00Z";

export type Copy = {
  /** la condizione, per la carta e il dettaglio: "1 mazzo pubblicato" */
  rule: string;
  got: boolean;
  /** quando l'ha presa, se si sa: giorno 'YYYY-MM-DD' o mese 'YYYY-MM' */
  when: string | null;
  /** quanto manca, se non l'ha presa: "Ancora 3 mazzi" */
  missing: string | null;
  /** la copia non si può più prendere (Pioniere) */
  closed?: boolean;
};

export type TrophyCard = {
  id: ArtId;
  name: string;
  rarity: Rarity;
  copies: [Copy, Copy];
  count: 0 | 1 | 2;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const left = (have: number, need: number, one: string, many: string) => (have >= need ? null : `Ancora ${plural(need - have, one, many)}`);
const days = (values: readonly (string | null | undefined)[]) => values.map((v) => dayOf(v)).filter((d): d is string => Boolean(d)).sort();
const nth = (list: readonly string[], n: number) => list[n - 1] ?? null;

/** Una carta a soglie numeriche: quante cose ha, le due soglie, le date (in ordine) se si sanno. */
function counted(
  id: ArtId,
  name: string,
  rarity: Rarity,
  have: number,
  [a, b]: [number, number],
  words: { rule: (n: number) => string; one: string; many: string },
  dates: readonly string[] | null,
): TrophyCard {
  const copy = (need: number): Copy => ({
    rule: words.rule(need),
    got: have >= need,
    when: have >= need && dates ? nth(dates, need) : null,
    missing: left(have, need, words.one, words.many),
  });
  return finish({ id, name, rarity, copies: [copy(a), copy(b)] });
}

function finish(c: Omit<TrophyCard, "count">): TrophyCard {
  const count = c.copies.filter((x) => x.got).length as 0 | 1 | 2;
  return { ...c, count };
}

export function trophyDeck(data: ProtoData): TrophyCard[] {
  const decks = data.decks;
  const deckDays = days(decks.map((d) => d.createdAt));
  const guideDays = days(decks.filter((d) => d.fullGuide).map((d) => d.createdAt));
  const communityGuides = days(data.guides.map((g) => g.createdAt));
  const rated = decks.filter((d) => d.rating.votes >= WELL_RATED.minVotes && d.rating.avg >= WELL_RATED.minAvg).length;
  const months = data.remote?.topMonths ?? [];
  const r = data.remote;
  const games = decks.reduce((s, d) => s + (d.winrate?.games ?? 0), 0);

  const lists = data.tierLists.filter((t) => t.ranked >= TIER_LIST_MIN_CARDS);
  const firstOf = (kind: string) => days(lists.filter((t) => t.kind === kind).map((t) => t.createdAt))[0] ?? null;
  const legLists = firstOf("legendaries");
  const cardLists = firstOf("cards");
  const anyList = days(lists.map((t) => t.createdAt))[0] ?? null;
  const both = legLists && cardLists ? (legLists > cardLists ? legLists : cardLists) : null;

  const joined = data.createdAt ? Date.parse(data.createdAt) : NaN;
  const joinedDay = dayOf(data.createdAt);
  const before = (iso: string) => Number.isFinite(joined) && joined < Date.parse(iso);

  const decksWords = { one: "mazzo", many: "mazzi" };
  return [
    counted("builder", "Costruttore", "common", decks.length, [1, 5], { ...decksWords, rule: (n) => (n === 1 ? "1 mazzo pubblicato" : `${n} mazzi pubblicati`) }, deckDays),
    counted("architect", "Architetto", "rare", decks.length, [10, 20], { ...decksWords, rule: (n) => `${n} mazzi pubblicati` }, deckDays),
    counted(
      "scholar",
      "Studioso",
      "common",
      guideDays.length,
      [1, 5],
      { one: "mazzo con guida completa", many: "mazzi con guida completa", rule: (n) => (n === 1 ? "1 mazzo con la guida completa" : `${n} mazzi con la guida completa`) },
      guideDays,
    ),
    counted("master", "Maestro", "rare", communityGuides.length, [1, 3], { one: "guida", many: "guide", rule: (n) => (n === 1 ? "1 guida della community" : `${n} guide della community`) }, communityGuides),
    counted(
      "favorite",
      "Il preferito",
      "epic",
      rated,
      [1, 3],
      { one: "mazzo con 5 voti e media 4,5", many: "mazzi con 5 voti e media 4,5", rule: (n) => (n === 1 ? "1 mazzo con almeno 5 voti e media 4,5" : `${n} mazzi con almeno 5 voti e media 4,5`) },
      null,
    ),
    counted("month", "Mazzo del mese", "epic", months.length, [1, 3], { one: "mese", many: "mesi", rule: (n) => (n === 1 ? "Mazzo del mese 1 volta" : `Mazzo del mese ${n} volte`) }, months),
    finish({
      id: "critic",
      name: "Critico",
      rarity: "common",
      copies: [
        { rule: "1 tier list salvata", got: Boolean(anyList), when: anyList, missing: anyList ? null : "Ancora 1 tier list" },
        {
          rule: "Le due tier list: Leggendarie e carte",
          got: Boolean(both),
          when: both,
          missing: both ? null : legLists ? "Manca la tier list delle carte" : cardLists ? "Manca la tier list delle Leggendarie" : "Ancora 2 tier list",
        },
      ],
    }),
    counted("challenger", "Sfidante", "common", r?.played.count ?? 0, [1, 5], { one: "torneo", many: "tornei", rule: (n) => (n === 1 ? "1 torneo giocato" : `${n} tornei giocati`) }, r?.played.first ? [dayOf(r.played.first)!] : null),
    counted("organizer", "Organizzatore", "rare", r?.organized.count ?? 0, [1, 3], { one: "torneo", many: "tornei", rule: (n) => (n === 1 ? "1 torneo organizzato" : `${n} tornei organizzati`) }, r?.organized.first ? [dayOf(r.organized.first)!] : null),
    counted("champion", "Campione", "legendary", r?.won.count ?? 0, [1, 3], { one: "torneo vinto", many: "tornei vinti", rule: (n) => (n === 1 ? "1 torneo vinto" : `${n} tornei vinti`) }, r?.won.first ? [dayOf(r.won.first)!] : null),
    finish({
      id: "pioneer",
      name: "Pioniere",
      rarity: "rare",
      copies: [
        { rule: "Iscritto prima del 19 ottobre 2026", got: before(DEMO2_CUTOFF), when: before(DEMO2_CUTOFF) ? joinedDay : null, missing: before(DEMO2_CUTOFF) ? null : "Non più disponibile", closed: !before(DEMO2_CUTOFF) },
        { rule: "Iscritto entro il 21 settembre 2026", got: before(FIRST_WEEK_END), when: before(FIRST_WEEK_END) ? joinedDay : null, missing: before(FIRST_WEEK_END) ? null : "Non più disponibile", closed: !before(FIRST_WEEK_END) },
      ],
    }),
    counted(
      "field",
      "In campo",
      "common",
      games,
      [1, 100],
      { one: "partita", many: "partite", rule: (n) => (n === 1 ? "1 partita registrata con una sua lista" : `${n} partite registrate con le sue liste`) },
      null,
    ),
  ];
}

/** Le carte nel mazzo: la Leggendaria (la carta dell'iscritto) più le copie prese. */
export function deckCount(cards: readonly TrophyCard[]): number {
  return 1 + cards.reduce((s, c) => s + c.count, 0);
}

/** La riga sotto la carta: che cosa manca alla prossima copia, o che è completa. */
export function nextStep(c: TrophyCard): string {
  const [a, b] = c.copies;
  if (!a.got) return a.missing ?? "";
  if (!b.got) return b.closed ? "Una copia sola" : (b.missing ?? "");
  return "Completa";
}
