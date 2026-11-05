/**
 * Le carte che il cimitero tratta in modo particolare (05/11/2026, cimiteri nei pannelli: Pierluigi, "dobbiamo
 * aggiungere l'opzione di mostrare il graveyard del proprio deck e quello avversario, il nuovo mazzo gioca su quello",
 * cioè il mazzo Relentless di Cyber Queen con Dr. Frank, patch del 4/11). Le regole vengono dai testi del gioco
 * completo (tabelle dei testi inglesi e italiani, lette il 05/11/2026):
 * - Rinascita (Rebirth): "The first time this is destroyed, return it to play with 1 health" (Mummy, Phuong Hoang,
 *   Frank's Monster, Franken Bride, Headless Horseman);
 * - Dr. Frank: "Before combat, summon a random character from your graveyard on a random space" (ogni round in cui è
 *   in campo); It's Alive, magia: "Summon a random character from your graveyard to a random space";
 * - Koschei: "On Death OR when I'm discarded: I return to your hand"; Aladdin: "After combat, I return to your hand
 *   from the graveyard" (dopo la morte non restano nel cimitero);
 * - Dracula: "When you discard, return me from your graveyard to hand";
 * - trasformazioni (Ugly Duckling, Doppelganger): la carta cambia, non muore.
 * La tabella la scrive scripts/cards.mjs in cards.json (campo `g`) e la legge reconstruct.ts (`CardInfo.grave`).
 */
export type GraveRole =
  /** torna in campo la prima volta che muore */
  | "rebirth"
  /** si trasforma in un'altra carta (Ugly Duckling, Doppelganger) */
  | "transform"
  /** dopo la morte torna nella mano di chi l'ha giocata (Koschei, Aladdin) */
  | "hand"
  /** torna dal cimitero in mano quando il suo proprietario scarta (Dracula) */
  | "recall"
  /** in campo, ogni round evoca un personaggio dal cimitero (Dr. Frank) */
  | "reviver"
  /** magia che evoca un personaggio dal cimitero (It's Alive) */
  | "revive";

export const GRAVE_ROLES: readonly GraveRole[] = ["rebirth", "transform", "hand", "recall", "reviver", "revive"];

/** Le carte con un comportamento scritto nel testo e non nelle parole chiave, per slug del sito. */
export const GRAVE_ROLE_BY_SLUG: Readonly<Record<string, GraveRole>> = {
  "dr-frank": "reviver",
  "its-alive": "revive",
  koschei: "hand",
  aladdin: "hand",
  dracula: "recall",
};

/** Il ruolo di una carta per il cimitero: la tabella qui sopra, poi le parole chiave (Rebirth, Transform); null se nessuno. */
export function graveRoleOf(c: { slug: string; keywords?: readonly string[] }): GraveRole | null {
  const bySlug = GRAVE_ROLE_BY_SLUG[c.slug];
  if (bySlug) return bySlug;
  const kw = c.keywords ?? [];
  if (kw.includes("Rebirth")) return "rebirth";
  if (kw.includes("Transform")) return "transform";
  return null;
}
