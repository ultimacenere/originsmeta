import type { Tier } from "./tierstats";

/**
 * Voti alle carte da 1 (scarsa) a 10 (ottima) e tier list che ne deriva (richiesta di Pierluigi del 06/10/2026: "la
 * possibilità per gli utenti di votare le carte da 1 (scarsa) a 10 (ottima) e sulla base delle votazioni si generasse
 * una tierlist"). Funzioni pure, senza import a runtime (`node --test src/lib/cardVotes.test.ts`): le usano la pagina
 * /tier-list/votes, le schede carta, la Server Action `voteCard` e il widget nel browser.
 *
 * Numeri: il database tiene un voto per iscritto e per carta (tabella `card_votes`) e restituisce, per ogni carta, media,
 * numero di voti e distribuzione punteggio → quanti (funzione `card_ratings`, blocco VOTI ALLE CARTE di schema.sql).
 * La fascia la decide il sito, qui, dalla media (`tierFromScore`), e solo da `CARD_RANKED_MIN_VOTES` voti in su: sotto,
 * la media si vede nel dettaglio ma la carta resta fra le non classificate (un voto solo di 1 non manda una carta in D).
 * La pagina si chiama "tier list dei voti" da `CARD_VOTES_MIN_VOTERS` votanti distinti in su; sotto è un'anteprima
 * dichiarata, come la tier list della community sotto le 5 liste (`COMMUNITY_MIN_LISTS`). Le soglie stanno solo qui:
 * si cambiano senza migrazione.
 */

export const CARD_SCORE_MIN = 1;
export const CARD_SCORE_MAX = 10;
/** I dieci punteggi, nell'ordine dei tasti del widget. */
export const CARD_SCORES: readonly number[] = Array.from({ length: CARD_SCORE_MAX - CARD_SCORE_MIN + 1 }, (_, i) => CARD_SCORE_MIN + i);

/** Da quanti voti una carta ha una fascia (sotto: media nel dettaglio, carta non classificata). */
export const CARD_RANKED_MIN_VOTES = 3;
/** Da quanti votanti distinti la pagina non è più un'anteprima (la stessa soglia della community, 5). */
export const CARD_VOTES_MIN_VOTERS = 5;
/** Tetto di righe per iscritto nel trigger guard_card_vote di schema.sql (le carte votabili sono 122). */
export const CARD_VOTES_PER_USER_MAX = 300;

/**
 * Soglie delle fasce sulla media da 1 a 10: S da 8,5, A da 7, B da 5,5, C da 4, D sotto. Sono le soglie della tier list
 * della community (S da 4,5 su 5, cioè il 90% della scala…) riportate sulla scala 1–10 e arrotondate a mezzo punto.
 */
export const SCORE_TIERS: Readonly<Record<Exclude<Tier, "D">, number>> = { S: 8.5, A: 7, B: 5.5, C: 4 };

export function tierFromScore(avg: number): Tier {
  if (avg >= SCORE_TIERS.S) return "S";
  if (avg >= SCORE_TIERS.A) return "A";
  if (avg >= SCORE_TIERS.B) return "B";
  if (avg >= SCORE_TIERS.C) return "C";
  return "D";
}

/** Un punteggio valido: intero fra 1 e 10. */
export function isCardScore(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= CARD_SCORE_MIN && n <= CARD_SCORE_MAX;
}

/** Una riga di `card_ratings()` come arriva da Supabase (i numeri possono essere stringhe: `numeric` di Postgres). */
export type CardRatingRow = { card: string; avg_score: number | string; votes: number | string; dist: unknown };

/**
 * Voti di una carta: media (due decimali), numero di voti, distribuzione (indice 0 = punteggio 1 … indice 9 =
 * punteggio 10) e la fascia, solo da `CARD_RANKED_MIN_VOTES` voti in su.
 */
export type CardRating = { avg: number; votes: number; dist: number[]; tier?: Tier };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** La distribuzione in dieci numeri, dal JSON {"9": 1, "6": 1} della funzione; punteggi fuori scala ignorati. */
export function distributionFrom(raw: unknown): number[] {
  const dist = Array.from({ length: CARD_SCORES.length }, () => 0);
  if (!raw || typeof raw !== "object") return dist;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const score = Number(key);
    const n = Number(value);
    if (isCardScore(score) && Number.isFinite(n) && n > 0) dist[score - CARD_SCORE_MIN] = Math.round(n);
  }
  return dist;
}

/**
 * Le righe della funzione `card_ratings` ridotte a `CardRating` per slug: righe sporche (slug non valido, voti a zero,
 * media fuori scala) si ignorano. La fascia c'è solo con almeno `minVotes` voti.
 */
export function cardRatingsFrom(rows: readonly CardRatingRow[], minVotes: number = CARD_RANKED_MIN_VOTES): Record<string, CardRating> {
  const out: Record<string, CardRating> = {};
  for (const row of rows) {
    if (!row || typeof row.card !== "string" || !SLUG_RE.test(row.card)) continue;
    const votes = Math.round(Number(row.votes));
    const avg = Math.round(Number(row.avg_score) * 100) / 100;
    if (!Number.isFinite(votes) || votes <= 0 || !Number.isFinite(avg) || avg < CARD_SCORE_MIN || avg > CARD_SCORE_MAX) continue;
    const rating: CardRating = { avg, votes, dist: distributionFrom(row.dist) };
    if (votes >= minVotes) rating.tier = tierFromScore(avg);
    out[row.card] = rating;
  }
  return out;
}

/**
 * Ordine dentro una fascia della tier list dei voti (e della tabella): media più alta, poi più voti, poi costo e nome,
 * come `communityOrder` per la tier list della community.
 */
export function ratingOrder(
  a: { rating?: { avg: number; votes: number }; mana?: number; name: string },
  b: { rating?: { avg: number; votes: number }; mana?: number; name: string },
): number {
  return (
    (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0) ||
    (b.rating?.votes ?? 0) - (a.rating?.votes ?? 0) ||
    (a.mana ?? 99) - (b.mana ?? 99) ||
    a.name.localeCompare(b.name)
  );
}

/** A che punto è la tier list dei voti: nessun voto, anteprima sotto la soglia di votanti, oppure a regime. */
export function votesStage(voters: number, votes: number, min: number = CARD_VOTES_MIN_VOTERS): "empty" | "preview" | "live" {
  if (votes <= 0 || voters <= 0) return "empty";
  return voters < min ? "preview" : "live";
}

/** Riempie i segnaposto `{nome}` di una frase (senza `String.replace` sui valori: niente `$&`). */
export function fillVoteText(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}

/** "1 voto" / "{n} voti" con le parole della lingua. */
export function votesWord(words: { one: string; many: string }, n: number): string {
  return n === 1 ? words.one : fillVoteText(words.many, { n });
}
