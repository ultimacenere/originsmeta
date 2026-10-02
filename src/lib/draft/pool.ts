import { activeCards } from "@/lib/data/cards";
import type { BotCard } from "./bot";

/**
 * Il pool del draft: le carte giocabili della demo (attive, non create da altre carte), come per il deck builder.
 * Solo lato server: legge il database carte. La pagina lo passa al tavolo del draft già ridotto a quello che serve.
 */
export function draftPool(): BotCard[] {
  return activeCards.map((c) => ({
    slug: c.slug,
    legendary: Boolean(c.legendary),
    rarity: c.rarity,
    mana: c.mana,
    spell: c.type === "spell",
    power: c.power,
    health: c.health,
    alignment: c.alignment,
  }));
}
