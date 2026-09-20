/**
 * Regole di costruzione del mazzo di Origins TCG (playtest 2026).
 * Fonte: AMA del team Koin Games (recap pubblico): "deck construction is 13 cards, so that's 12 cards and one
 * legendary. And the 12 cards automatically get two copies... only one copy of the legendary" → 25 carte in gioco.
 * Il formato Conquest (torneo del Next Fest): più mazzi con Leggendarie diverse e "at least 9 cards have to differ
 * from deck to deck" (post Steam del 25/08/2026). Il modo esatto di contare le carte diverse va confermato con
 * il regolamento del torneo: qui si contano le carte fisiche (2 copie per carta base, 1 per la Leggendaria).
 */
export const RULES = {
  legendarySlots: 1,
  distinctCards: 12,
  copiesPerCard: 2,
  get deckSize() {
    return this.legendarySlots + this.distinctCards * this.copiesPerCard;
  },
  conquestMinDifferent: 9,
  conquestDecks: 3,
} as const;

export type BuilderCard = {
  slug: string;
  name: string;
  type: "unit" | "spell" | "token";
  legendary: boolean;
  mana?: number;
  power?: number;
  health?: number;
  sagaLabel: string;
  key?: string;
  /** miniatura della carta ufficiale (160 px), assente sulle carte che il materiale non copre */
  thumb?: string;
  /** carta ufficiale intera (480 px): l anteprima al passaggio del mouse la mostra a metà pannello */
  image?: string;
  /** sola finestra d illustrazione: nei riquadri piccoli si legge molto meglio della carta intera */
  art?: string;
  /** testo dell abilità nella lingua della pagina e allineamento: servono all anteprima al passaggio del mouse */
  ability?: string;
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
  typeLabel?: string;
  /** carta inserita a mano dall'utente, non presente nel database */
  custom?: boolean;
};

export type DeckState = {
  name: string;
  legendary: string | null; // slug
  cards: string[]; // slug delle 12 carte base (ognuna vale 2 copie)
  /** carte personalizzate (fuori database) referenziate dagli slug custom:<nome> */
  customCards: BuilderCard[];
};

export const emptyDeck = (name = ""): DeckState => ({ name, legendary: null, cards: [], customCards: [] });

export type Issue = { level: "error" | "warn"; code: string };

export function validateDeck(deck: DeckState): Issue[] {
  const issues: Issue[] = [];
  if (!deck.legendary) issues.push({ level: "error", code: "missingLegendary" });
  if (deck.cards.length < RULES.distinctCards) issues.push({ level: "error", code: "tooFewCards" });
  if (deck.cards.length > RULES.distinctCards) issues.push({ level: "error", code: "tooManyCards" });
  if (new Set(deck.cards).size !== deck.cards.length) issues.push({ level: "error", code: "duplicateCard" });
  if (deck.cards.some((s) => s.startsWith("custom:"))) issues.push({ level: "warn", code: "hasCustom" });
  return issues;
}

export function isComplete(deck: DeckState): boolean {
  return validateDeck(deck).every((i) => i.level !== "error");
}

/** Multiset delle carte fisiche di un mazzo: slug -> copie. */
export function physicalCards(deck: DeckState): Map<string, number> {
  const m = new Map<string, number>();
  if (deck.legendary) m.set(deck.legendary, 1);
  for (const s of deck.cards) m.set(s, (m.get(s) ?? 0) + RULES.copiesPerCard);
  return m;
}

/** Numero di carte fisiche di A che non compaiono in B (con le stesse copie). */
export function differentCards(a: DeckState, b: DeckState): number {
  const pa = physicalCards(a);
  const pb = physicalCards(b);
  let diff = 0;
  for (const [slug, n] of pa) diff += Math.max(0, n - (pb.get(slug) ?? 0));
  return diff;
}

export function sharedCards(a: DeckState, b: DeckState): string[] {
  const pb = new Set(physicalCards(b).keys());
  return [...physicalCards(a).keys()].filter((s) => pb.has(s));
}

export type ConquestIssue = { code: string; decks?: [number, number]; value?: number };

export function validateConquest(decks: DeckState[], minDifferent: number = RULES.conquestMinDifferent): ConquestIssue[] {
  const issues: ConquestIssue[] = [];
  const legendaries = decks.map((d) => d.legendary).filter(Boolean) as string[];
  if (new Set(legendaries).size !== legendaries.length) issues.push({ code: "duplicateLegendary" });
  for (let i = 0; i < decks.length; i++) {
    for (let j = i + 1; j < decks.length; j++) {
      const diff = differentCards(decks[i], decks[j]);
      if (diff < minDifferent) issues.push({ code: "tooSimilar", decks: [i, j], value: diff });
    }
  }
  return issues;
}

/** Curva di mana: numero di carte fisiche per costo (0..7, 8 = "8+"). */
export function manaCurve(deck: DeckState, lookup: (slug: string) => BuilderCard | undefined): number[] {
  const curve = new Array(9).fill(0) as number[];
  for (const [slug, n] of physicalCards(deck)) {
    const c = lookup(slug);
    if (!c || c.mana === undefined) continue;
    curve[Math.min(8, Math.max(0, c.mana))] += n;
  }
  return curve;
}
