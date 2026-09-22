import { getCard } from "./data/cards";
import { encodeGameCode } from "./deckcode";
import type { BuilderCard } from "./deckrules";

/**
 * Codice del gioco (KGBLDC…) di un mazzo salvato, calcolato sul server: è quello che si incolla nel gioco,
 * "quello giusto" secondo Pierluigi (note del 22/09/2026); il codice OriginsMeta (OM1.) dall'interfaccia sparisce.
 *
 * Stessa regola del deck builder: servono le chiavi ufficiali di TUTTE le carte (Leggendaria compresa), dal database
 * (`key`, importata da World of Origins) o dalla carta inserita a mano quando arriva da un codice del gioco. Se ne
 * manca anche una il codice non si genera: meglio dire "non disponibile" che copiare un codice sbagliato.
 * Ogni carta compare una volta sola, come nei codici reali verificati (vedi `deckcode.ts` e il README).
 * Solo lato server: legge il database carte. Il checksum usa Web Crypto, globale in Node come nel browser.
 */
export type DeckGameCode = { code: string | null; missing: number };

export async function deckGameCode(deck: { legendary: string | null; cards: string[]; custom_cards?: BuilderCard[] }): Promise<DeckGameCode> {
  const slugs = [deck.legendary, ...deck.cards].filter((s): s is string => Boolean(s));
  if (!slugs.length) return { code: null, missing: 0 };
  const keys = slugs.map((s) => getCard(s)?.key ?? deck.custom_cards?.find((x) => x.slug === s)?.key);
  const missing = keys.filter((k) => !k).length;
  if (missing) return { code: null, missing };
  try {
    return { code: await encodeGameCode(keys as string[]), missing: 0 };
  } catch {
    return { code: null, missing: 0 };
  }
}
