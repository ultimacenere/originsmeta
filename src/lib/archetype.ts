import { getCard } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { RULES, type DeckState } from "@/lib/deckrules";

export type ArchetypeId = keyof typeof archetypeLabels;

/**
 * Archetipo suggerito dalla composizione del mazzo (regole semplici sui tag delle carte, nessuna chiamata
 * esterna). È solo un suggerimento: nel modulo di pubblicazione l'utente può cambiarlo.
 */
export function suggestArchetype(deck: DeckState): ArchetypeId {
  const tags = new Map<string, number>();
  let n = 0;
  let cost = 0;
  let spells = 0;
  let evil = 0;
  let cheap = 0;
  const add = (slug: string, copies: number) => {
    const c = getCard(slug);
    if (!c) return;
    n += copies;
    cost += (c.mana ?? 0) * copies;
    if (c.type === "spell") spells += copies;
    if (c.alignment === "evil") evil += copies;
    if ((c.mana ?? 0) <= 2) cheap += copies;
    for (const k of c.keywords ?? []) tags.set(k, (tags.get(k) ?? 0) + copies);
  };
  if (deck.legendary) add(deck.legendary, 1);
  for (const s of deck.cards) add(s, RULES.copiesPerCard);
  if (!n) return "midrange";
  const t = (k: string) => tags.get(k) ?? 0;
  const avg = cost / n;
  if (t("Discard") >= 5) return "discard";
  if ((deck.legendary === "mulan" || deck.legendary === "queen-of-hearts") && t("On Reveal") + t("On Death") >= 12) return "combo";
  if (spells >= 8 && t("Destroy") + t("Deal Damage") >= 6) return "control";
  if (avg <= 2.7 && cheap >= 12) return t("Summon") + t("Buff") >= 6 ? "swarm" : "aggro";
  if (evil >= 12) return "evil";
  return "midrange";
}
