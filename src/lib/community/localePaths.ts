import { locales } from "@/lib/i18n";

/**
 * La stessa pagina in tutte le lingue del sito, da un percorso con la lingua in testa ("/it/decks/community/x" →
 * "/en/decks/community/x", "/it/decks/community/x"…). `null` se il percorso non comincia con una lingua del sito o
 * contiene caratteri che un nostro percorso non ha: allora chi chiama rinnova al massimo quel percorso così com'è.
 *
 * Perché (14/11/2026, piano costi): i voti (`voteDeck`, `voteDeckSet`) rinnovavano solo la pagina della lingua da cui
 * si votava. Con la rigenerazione ogni minuto non si vedeva; con 12 ore le altre lingue avrebbero mostrato il voto
 * vecchio fino a mezza giornata.
 */
export function pathInAllLocales(path: string): string[] | null {
  const m = /^\/([a-z]{2}(?:-[a-z]{2})?)(\/[a-z0-9\-/]*)?$/.exec(path);
  if (!m || !(locales as readonly string[]).includes(m[1])) return null;
  const rest = m[2] ?? "";
  return locales.map((l) => `/${l}${rest}`);
}
