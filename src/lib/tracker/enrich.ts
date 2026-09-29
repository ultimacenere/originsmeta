/**
 * I due campi che il sito aggiunge a ogni partita prima di chiamare tracker_submit (tracker/overlay, 30/09/2026), perché
 * l'app non ha il calendario delle patch né le regole degli archetipi:
 * - `patch`: la patch in vigore alla fine della partita (`patchAt` di cards.ts; senza ora di fine, quella dell'invio);
 * - `archetype`: l'archetipo del mazzo (`suggestArchetype` di archetype.ts), solo per un mazzo di 13 carte tutte nel
 *   nostro database e con una Leggendaria sola.
 * Li legge il database per le statistiche anonime per patch e per archetipo (blocco TRACKER di supabase/schema.sql).
 * Solo lato server (rotta /api/tracker/sync): importa il database carte.
 *
 * Una patch nuova registrata in cards.ts qualche ora dopo il post ufficiale lascia le partite di quelle ore sulla patch
 * di prima: la correzione (una riga di SQL) è in docs/tracker.md, "Patch nuove".
 */
import { getCard, getCardByKey, patchAt } from "../data/cards";
import { suggestArchetype } from "../archetype";
import { ARCHETYPE_RE, PATCH_RE, type TrackerRow, type TrackerUpload } from "./upload";
import { LIST_SIZE } from "./stats";

export type EnrichDeps = {
  /** patch in vigore a quell'ora (ISO), null se prima della prima patch che conosciamo */
  patchOf: (iso: string) => string | null;
  /** archetipo delle 13 carte (chiavi del gioco), null se non si sa */
  archetypeOf: (keys: readonly string[]) => string | null;
};

export function enrichUpload(u: TrackerUpload, deps: EnrichDeps, now = Date.now()): TrackerRow {
  const patch = deps.patchOf(u.endedAt ?? new Date(now).toISOString());
  const archetype = u.deckCards.length === LIST_SIZE ? deps.archetypeOf(u.deckCards) : null;
  return { ...u, patch: patch && PATCH_RE.test(patch) ? patch : null, archetype: archetype && ARCHETYPE_RE.test(archetype) ? archetype : null };
}

/** Archetipo di un mazzo dalle chiavi delle sue 13 carte, con le regole del modulo di pubblicazione dei mazzi. */
export function archetypeOfKeys(keys: readonly string[]): string | null {
  if (keys.length !== LIST_SIZE) return null;
  const found = keys.map((k) => getCardByKey(k));
  if (found.some((c) => !c)) return null;
  const slugs = found.map((c) => c!.slug);
  const legendaries = slugs.filter((s) => getCard(s)?.legendary);
  if (legendaries.length !== 1) return null;
  return suggestArchetype({ name: "", legendary: legendaries[0], cards: slugs.filter((s) => s !== legendaries[0]), customCards: [] });
}

export const siteEnrichDeps: EnrichDeps = {
  patchOf: (iso) => patchAt(iso) ?? null,
  archetypeOf: archetypeOfKeys,
};
