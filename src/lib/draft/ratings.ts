/**
 * Quanto vale ogni carta per il bot del draft (02/10/2026). Sono **valutazioni nostre**, non dati del gioco: servono
 * solo al bot per scegliere e non si mostrano mai come numeri sulle pagine. Ricavate dal cervello di gioco (cartella
 * `knowledge/` del worktree game-player-knowledge-base, al 02/10/2026 non ancora nel repo: `21-card-roles.md`,
 * `30-synergies.md`, `40-archetypes.md`, `60-playbook.md`, scritti il 19-20/09/2026 con le regole confermate da Davdas)
 * e riviste sulle statistiche di oggi (patch 0.7: Spellbook a 4 mana, Dorothy a 4, Christopher Robin 5/4, Wicked
 * Stepmother 4/6…).
 *
 * Le idee che guidano i voti, dal cervello:
 * - due mana al primo round, +1 per round: un mazzo senza carte da 2 comincia guardando;
 * - il danno alla barriera che non si blocca (Snipe, Queen of the Night, Jack-in-the-Box, Lightning Strike) chiude;
 * - la rimozione economica (Bullseye, Axe Throw, Dark Omen) è il cuore di ogni lista;
 * - i pacchetti (scarti, magie, cure, movimento, Alla rivelazione, Alla morte, Buoni, Malvagi, molti corpi) valgono
 *   molto più delle carte sole: per questo ogni carta dice che cosa **dà** al mazzo e che cosa **vuole**.
 *
 * `r`: valore della carta da sola, da 0 a 10, in un mazzo qualunque. `gives` / `wants`: pacchetti. `roles`: ruoli che il
 * bot conta mentre costruisce (rimozioni, pescate, barriera, guardie, mana). Carta non in tabella (uscita con una patch
 * nuova): valore stimato da costo e statistiche (`fallbackRating`), così il bot non si rompe e un test lo segnala.
 */

export type Pkg = "discard" | "spell" | "heal" | "move" | "reveal" | "death" | "evil" | "good" | "wide" | "ally" | "power";
export type Role = "removal" | "sweeper" | "draw" | "barrier" | "defender" | "ramp" | "finisher";

export type CardRating = { r: number; gives?: Pkg[]; wants?: Pkg[]; roles?: Role[] };

export const RATINGS: Record<string, CardRating> = {
  // --- Leggendarie: valgono come la direzione che danno al mazzo
  "van-helsing": { r: 8.2, gives: ["spell", "good"], roles: ["draw", "removal"] },
  "wicked-stepmother": { r: 8, gives: ["evil"], wants: ["evil"] },
  merlin: { r: 7.6, wants: ["spell"] },
  dracula: { r: 7.4, gives: ["evil", "wide"], wants: ["discard"] },
  "three-not-so-little-pigs": { r: 7.6, gives: ["wide", "power"], roles: ["finisher", "barrier"] },
  "robin-hood": { r: 7.5, gives: ["good"], roles: ["sweeper", "barrier", "finisher"] },
  "legion-of-the-dead": { r: 7.2, gives: ["wide", "spell"], roles: ["finisher"] },
  mulan: { r: 7.2, gives: ["good"], wants: ["reveal"] },
  "queen-of-hearts": { r: 7, gives: ["evil"], wants: ["death"] },
  "king-arthur": { r: 7, gives: ["good", "power"], wants: ["good"], roles: ["finisher"] },
  dorothy: { r: 6.3, gives: ["good"], wants: ["move"] },

  // --- 0-1 mana
  "itsy-bitsy-spider": { r: 2.2, gives: ["evil"] },
  bullseye: { r: 8, roles: ["removal"] },
  "defense-matrix": { r: 4.3 },
  freeze: { r: 5.8, roles: ["removal"] },
  mummy: { r: 4.2, gives: ["death", "evil"] },
  "poison-apple": { r: 5.4, roles: ["removal"] },
  reinforcements: { r: 4.8, gives: ["wide"], wants: ["power"] },
  "stroke-of-midnight": { r: 5.3, wants: ["reveal"] },
  thumbelina: { r: 5, gives: ["good"] },
  toto: { r: 3.4, gives: ["good", "move"] },
  "trash-for-treasure": { r: 3.6, roles: ["draw"], wants: ["death"] },
  "twister-toss": { r: 3.8, gives: ["move"] },

  // --- 2 mana
  "animate-object": { r: 4, gives: ["wide"] },
  "axe-throw": { r: 7.6, roles: ["removal"] },
  "baby-bear": { r: 6.4, gives: ["death"] },
  bagheera: { r: 5.4, gives: ["good", "reveal"] },
  banshee: { r: 4.6, gives: ["death", "evil"], wants: ["wide"] },
  basilisk: { r: 6, gives: ["evil"] },
  billy: { r: 5.6, gives: ["death", "evil"], roles: ["removal"] },
  "card-soldier": { r: 4.6, gives: ["wide"], wants: ["move"] },
  "don-quixote": { r: 5, gives: ["good"], roles: ["defender"] },
  esmeralda: { r: 4.4, wants: ["discard"] },
  "first-aid": { r: 4.4, gives: ["heal"] },
  "huck-finn": { r: 5.6, gives: ["good"] },
  "jack-in-the-box": { r: 6.1, gives: ["death", "evil"], roles: ["barrier"] },
  "lady-of-the-lake": { r: 4.6, gives: ["good"], wants: ["good"], roles: ["defender"] },
  "lightning-strike": { r: 7.1, roles: ["removal", "barrier"] },
  "merlins-prophecy": { r: 3, wants: ["spell"] },
  morgiana: { r: 4.6, gives: ["good"] },
  musketeer: { r: 5.6, gives: ["good"] },
  piglet: { r: 4.8, gives: ["good", "reveal"], wants: ["wide"] },
  roo: { r: 5.7, gives: ["good", "move"] },
  rumple: { r: 5.1, gives: ["evil", "reveal"], roles: ["ramp"] },
  sandman: { r: 3.8, wants: ["spell"] },
  scarecrow: { r: 5.6, gives: ["good", "reveal"], roles: ["draw"] },
  shahrazad: { r: 5, gives: ["good", "heal"], wants: ["discard"] },
  "three-blind-mice": { r: 5, gives: ["wide", "death"] },
  "ugly-duckling": { r: 4, wants: ["discard"] },

  // --- 3 mana
  aladdin: { r: 5.6, gives: ["good"], wants: ["discard"] },
  "ali-baba": { r: 5.5, gives: ["good"], roles: ["draw"] },
  asanbosam: { r: 6.9, gives: ["evil", "discard", "reveal"] },
  beast: { r: 5.4, gives: ["evil"], wants: ["ally", "wide"] },
  "big-bad-wolf": { r: 6.5, gives: ["evil"] },
  "black-knight": { r: 6.1, gives: ["reveal"], roles: ["removal"] },
  "cowardly-lion": { r: 5.6, gives: ["good"], roles: ["defender"] },
  "dark-omen": { r: 8, roles: ["removal"] },
  "davy-crockett": { r: 5, gives: ["death"], roles: ["defender"] },
  "en-passant": { r: 5.4, gives: ["move"], roles: ["removal"] },
  "flying-monkey": { r: 5, gives: ["evil", "reveal"] },
  "frog-prince": { r: 5.6, gives: ["reveal"] },
  "golden-egg": { r: 5.5, gives: ["death"] },
  humpty: { r: 5.5, gives: ["death", "evil"], roles: ["draw"] },
  jack: { r: 5, gives: ["reveal"] },
  jill: { r: 5, gives: ["heal"] },
  kanga: { r: 4.1, gives: ["good"], wants: ["move"] },
  "king-shahryar": { r: 5.2, gives: ["evil", "discard"], roles: ["draw"] },
  mary: { r: 4.4, gives: ["reveal", "death"] },
  "mind-palace": { r: 5, roles: ["draw"] },
  pegasus: { r: 5, gives: ["good"], wants: ["move"] },
  "piggy-bank": { r: 4.4, roles: ["ramp"] },
  quasimodo: { r: 6.1, gives: ["good", "discard", "reveal"], roles: ["draw"] },
  "queen-of-the-night": { r: 6, gives: ["evil"], wants: ["spell"], roles: ["barrier"] },
  "shield-maiden": { r: 5, gives: ["good"] },
  "wicked-stepsisters": { r: 6, gives: ["evil"] },
  "wicked-witch-of-the-west": { r: 5.6, gives: ["evil"] },

  // --- 4 mana
  beauty: { r: 5.1, gives: ["good"], wants: ["ally", "wide"], roles: ["draw"] },
  "blow-the-house-down": { r: 5.9, wants: ["power"], roles: ["sweeper"] },
  boogeyman: { r: 5.8, gives: ["evil", "reveal", "power"], wants: ["wide"] },
  "christopher-robin": { r: 6.5, gives: ["good"] },
  glinda: { r: 4.6, gives: ["good"], wants: ["spell", "wide"] },
  huntsman: { r: 6, gives: ["good"] },
  imhotep: { r: 6, gives: ["death", "evil"], roles: ["sweeper"] },
  jekyll: { r: 6.1, gives: ["good", "heal", "reveal"] },
  lancelot: { r: 5.6, gives: ["good"], wants: ["good"] },
  "little-john": { r: 6, gives: ["good", "reveal"] },
  "magic-carpet": { r: 5.2, gives: ["good", "move", "reveal"] },
  marian: { r: 7.6, gives: ["good"], roles: ["barrier"] },
  mothman: { r: 5, gives: ["evil", "reveal"] },
  "old-macdonald": { r: 5, wants: ["discard"] },
  "phuong-hoang": { r: 5, gives: ["move", "death"], wants: ["heal"] },
  puck: { r: 4, roles: ["defender"] },
  "searing-light": { r: 6.6, gives: ["heal"], roles: ["removal"] },
  spellbook: { r: 4.6, gives: ["spell", "discard"], roles: ["draw"] },
  tweedledum: { r: 5.4, gives: ["wide", "reveal"] },
  "underworld-flare": { r: 6.5, wants: ["discard"], roles: ["removal"] },
  "white-queen": { r: 5.9, gives: ["reveal"], roles: ["removal"] },

  // --- 5 mana
  baloo: { r: 6.5, gives: ["good", "power"] },
  bigfoot: { r: 6.4, gives: ["power"], roles: ["barrier"] },
  boitata: { r: 5, gives: ["good"] },
  "bridge-troll": { r: 6.4, gives: ["evil"], roles: ["defender"] },
  "captain-ahab": { r: 5.4, gives: ["discard", "reveal"], roles: ["removal"] },
  "fairy-godmother": { r: 6, gives: ["good", "reveal"] },
  galahad: { r: 6.4, gives: ["good", "reveal"], wants: ["wide"] },
  hare: { r: 4.6, gives: ["move"] },
  impundulu: { r: 6, gives: ["evil", "discard"], roles: ["removal", "barrier"] },
  "rain-of-arrows": { r: 6.4, roles: ["sweeper"] },
  "sorcerers-apprentice": { r: 4.6, gives: ["wide"], wants: ["spell"] },
  "the-green-knight": { r: 6, gives: ["power"] },
  "three-musketeers": { r: 6.4, gives: ["good", "wide", "reveal"] },

  // --- 6+ mana
  cockatrice: { r: 7, gives: ["evil", "death"], roles: ["removal", "finisher"] },
  genie: { r: 4.4, gives: ["discard", "spell", "reveal"] },
  "guy-of-gisborne": { r: 6.5, gives: ["evil"], roles: ["barrier"] },
  "heroic-charge": { r: 5.6, wants: ["wide"], roles: ["finisher", "barrier"] },
  koschei: { r: 6, gives: ["evil", "death"], wants: ["discard"] },
  mowgli: { r: 6.5, gives: ["good", "wide", "reveal", "power"] },
  "tin-woodman": { r: 4.6, gives: ["good", "heal", "reveal"] },
  "paul-bunyan": { r: 6.5, gives: ["power"], roles: ["finisher"] },
  bandersnatch: { r: 6, gives: ["evil", "power"], roles: ["finisher", "barrier"] },
  "ellen-trechend": { r: 5.4, gives: ["evil", "reveal"], roles: ["finisher", "barrier"] },
  "forbidden-knowledge": { r: 5, roles: ["sweeper"] },
  obliterate: { r: 5.6, roles: ["removal", "barrier", "finisher"] },
};

/** Valore di una carta che la tabella non conosce: costo e statistiche, prudente. */
export function fallbackRating(card: { mana?: number; power?: number; health?: number; spell?: boolean }): CardRating {
  if (card.spell || card.power === undefined || card.health === undefined) return { r: 4.5 };
  const mana = Math.max(1, card.mana ?? 3);
  const body = (card.power + card.health) / (2 * mana + 2);
  return { r: Math.max(2, Math.min(6.5, 2 + body * 4)) };
}

export function ratingOf(slug: string, card?: { mana?: number; power?: number; health?: number; spell?: boolean }): CardRating {
  return RATINGS[slug] ?? fallbackRating(card ?? {});
}
