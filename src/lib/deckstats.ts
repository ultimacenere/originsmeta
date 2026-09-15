/**
 * Statistiche di composizione di un mazzo, calcolate dalla sola lista carte (niente dati di gioco).
 * Contano le carte fisiche: 2 copie per carta base, 1 per la Leggendaria (regole in deckrules.ts).
 * Le carte fuori database (custom:…) o senza statistiche pubblicate finiscono in `unknown`.
 */
import { getCard, sagas, type Card, type SagaId } from "@/lib/data/cards";
import { RULES } from "@/lib/deckrules";
import type { Locale } from "@/lib/i18n";

export type DeckStats = {
  /** carte fisiche totali considerate (note + sconosciute) */
  total: number;
  known: number;
  unknown: number;
  /** copie per costo di mana: indice 0..7, 8 = "8+" */
  curve: number[];
  avgCost: number | null;
  /** copie con costo ≤2, 3–4, ≥5 */
  bands: { early: number; mid: number; late: number };
  units: number;
  spells: number;
  /** somma di potenza e salute delle unità e media per unità */
  power: number;
  health: number;
  avgPower: number | null;
  avgHealth: number | null;
  /** copie per saga, dalla più rappresentata */
  bySaga: { saga: SagaId; label: string; count: number }[];
  /** parole chiave presenti (copie), dalla più frequente */
  keywords: { keyword: string; count: number }[];
  /** carta più costosa e più economica note */
  topEnd: { name: string; mana: number } | null;
  cheapest: { name: string; mana: number } | null;
  legendary: Card | null;
};

export type DeckInput = { legendary?: string | null; cards: string[] };

export function deckStats(deck: DeckInput, locale: Locale): DeckStats {
  const copies: { card: Card; n: number }[] = [];
  let unknown = 0;
  let total = 0;
  if (deck.legendary) {
    total += RULES.legendarySlots;
    const c = getCard(deck.legendary);
    if (c) copies.push({ card: c, n: RULES.legendarySlots });
    else unknown += RULES.legendarySlots;
  }
  for (const s of deck.cards) {
    total += RULES.copiesPerCard;
    const c = getCard(s);
    if (c) copies.push({ card: c, n: RULES.copiesPerCard });
    else unknown += RULES.copiesPerCard;
  }

  const curve = new Array(9).fill(0) as number[];
  let costSum = 0;
  let costN = 0;
  let units = 0;
  let spells = 0;
  let power = 0;
  let health = 0;
  let unitN = 0;
  const saga = new Map<SagaId, number>();
  const kw = new Map<string, number>();
  let topEnd: DeckStats["topEnd"] = null;
  let cheapest: DeckStats["cheapest"] = null;
  const bands = { early: 0, mid: 0, late: 0 };

  for (const { card, n } of copies) {
    if (card.mana !== undefined) {
      curve[Math.min(8, Math.max(0, card.mana))] += n;
      costSum += card.mana * n;
      costN += n;
      if (card.mana <= 2) bands.early += n;
      else if (card.mana <= 4) bands.mid += n;
      else bands.late += n;
      if (!topEnd || card.mana > topEnd.mana) topEnd = { name: card.name, mana: card.mana };
      if (!cheapest || card.mana < cheapest.mana) cheapest = { name: card.name, mana: card.mana };
    } else unknown += n;
    if (card.type === "unit") {
      units += n;
      if (card.power !== undefined && card.health !== undefined) {
        power += card.power * n;
        health += card.health * n;
        unitN += n;
      }
    } else if (card.type === "spell") spells += n;
    saga.set(card.saga, (saga.get(card.saga) ?? 0) + n);
    for (const k of card.keywords ?? []) kw.set(k, (kw.get(k) ?? 0) + n);
  }

  const legendary = deck.legendary ? (getCard(deck.legendary) ?? null) : null;
  return {
    total,
    known: total - unknown,
    unknown,
    curve,
    avgCost: costN ? Math.round((costSum / costN) * 10) / 10 : null,
    bands,
    units,
    spells,
    power,
    health,
    avgPower: unitN ? Math.round((power / unitN) * 10) / 10 : null,
    avgHealth: unitN ? Math.round((health / unitN) * 10) / 10 : null,
    bySaga: [...saga.entries()]
      .map(([id, count]) => ({ saga: id, label: sagas[id][locale], count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    keywords: [...kw.entries()]
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword)),
    topEnd,
    cheapest,
    legendary,
  };
}
