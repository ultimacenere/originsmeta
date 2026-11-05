import { activeCards } from "@/lib/data/cards";
import { getDictionary, type Locale } from "@/lib/i18n";

/**
 * Le carte per l'estensione Twitch di Broadcasting OM (05/11/2026, twitch-broadcast/README.md): per ogni slug quello
 * che serve a disegnare la riga della lista (costo, nome, magia o unità, Leggendaria, illustrazione sfumata) e
 * l'anteprima (carta intera con i crediti stampati, potenza e salute, allineamento, testo nella lingua di chi guarda),
 * più la chiave ufficiale per il codice del gioco ("Copia mazzo"). Solo carte attive: le altre non stanno in un mazzo.
 * L'estensione la scarica una volta da /api/broadcast/ext/cards/<lingua>; lo stato dal vivo porta solo gli slug.
 */
/** [nome, costo, magia (0/1), Leggendaria (0/1), potenza, salute, allineamento, testo, carta intera, illustrazione, chiave] */
export type BcastExtCard = [string, number | null, 0 | 1, 0 | 1, number | null, number | null, "good" | "evil" | "neutral" | "", string, string | null, string | null, string | null];

export function bcastExtCardTable(locale: Locale): Record<string, BcastExtCard> {
  const out: Record<string, BcastExtCard> = {};
  for (const c of activeCards) {
    out[c.slug] = [
      c.name,
      c.mana ?? null,
      c.type === "spell" ? 1 : 0,
      c.legendary ? 1 : 0,
      c.power ?? null,
      c.health ?? null,
      c.alignment ?? "",
      c.ability?.[locale] || c.ability?.en || "",
      c.image ?? null,
      c.art ?? null,
      c.key ?? null,
    ];
  }
  return out;
}

/** Le etichette dell'anteprima nella lingua di chi guarda, dai dizionari del sito (stesso glossario delle schede carta). */
export function bcastExtLabels(locale: Locale): { unit: string; spell: string; good: string; evil: string; neutral: string } {
  const c = getDictionary(locale).common;
  return { unit: c.unit, spell: c.spell, good: c.good, evil: c.evil, neutral: c.neutral };
}
