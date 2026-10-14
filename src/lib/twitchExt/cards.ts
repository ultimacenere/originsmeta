/**
 * Le carte per l'estensione Twitch "Deck tracker" (13/10/2026, docs/twitch.md): per ogni chiave del gioco nome, scheda,
 * tipo, statistiche e testo nella lingua dello spettatore, più l'immagine (le carte da collezione ufficiali del sito,
 * contenuto e non interfaccia, come nelle schede carta). L'estensione la scarica una volta da /api/twitch/cards/<lingua>
 * e lo stato dal vivo porta solo chiavi e numeri.
 */
import { cards } from "@/lib/data/cards";
import type { Locale } from "@/lib/i18n";

/** [nome, slug, tipo, costo, forza, salute, leggendaria (0/1), testo, immagine 480 px o null] */
export type ExtCard = [string, string, "unit" | "spell" | "token", number | null, number | null, number | null, 0 | 1, string, string | null];

export function extCardTable(locale: Locale): Record<string, ExtCard> {
  const out: Record<string, ExtCard> = {};
  for (const c of cards) {
    if (!c.key) continue;
    const text = c.ability?.[locale] || c.ability?.en || "";
    out[c.key] = [c.name, c.slug, c.type, c.mana ?? null, c.power ?? null, c.health ?? null, c.legendary ? 1 : 0, text, c.image ?? null];
  }
  return out;
}
