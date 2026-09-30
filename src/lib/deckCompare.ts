/*
 * Confronto fra due mazzi (/decks/compare, 30/09/2026, dal confronto con i siti concorrenti: "carte in comune e
 * differenze"). Regole pure: che cosa ha incollato l'utente (link di un mazzo della community, link o codice del deck
 * builder, codice del gioco), come si trasformano le chiavi ufficiali in carte, e che cosa hanno in comune due mazzi.
 * Le carte diverse si contano come nel Conquest (`differentCards` di deckrules.ts: ogni carta una volta, Leggendaria
 * compresa), così il numero è lo stesso del deck builder in modalità torneo. Nessun import a runtime: lo esegue Node
 * nei test.
 */

/** Carta del catalogo che serve al confronto: slug, ID ufficiale (per il codice del gioco) e se è Leggendaria. */
export type CompareCard = { slug: string; key?: string; legendary: boolean };

/** Mazzo ridotto a Leggendaria e carte base (le copie non contano: nel mazzo ogni carta base è sempre in due copie). */
export type CompareDeck = { legendary: string | null; cards: string[] };

export type DeckInput =
  | { kind: "community"; slug: string }
  | { kind: "om"; code: string }
  | { kind: "game"; code: string }
  | { kind: "invalid" };

const OM = "OM1.";
const GAME = "KGBLDC";
/** Slug di un mazzo della community: nome, trattino e quattro cifre esadecimali (newSlug di community/util.ts). */
const COMMUNITY_SLUG = /^[a-z0-9][a-z0-9-]{0,80}-[0-9a-f]{4}$/;

/**
 * Che cosa ha incollato l'utente. Un link del deck builder porta il codice nell'hash (#OM1.…), uno di un mazzo della
 * community ha /decks/community/<slug>; va bene anche il solo slug (arriva così in ?a= dal tasto della scheda).
 */
export function deckInputKind(raw: string): DeckInput {
  const t = (raw ?? "").trim();
  if (!t) return { kind: "invalid" };
  const om = t.indexOf(OM);
  if (om >= 0) return { kind: "om", code: t.slice(om).split(/\s/)[0] };
  if (t.includes(GAME)) return { kind: "game", code: t.slice(t.indexOf(GAME)).split(/\s/)[0] };
  const m = t.match(/\/decks\/community\/([a-z0-9-]+)/);
  const slug = m ? m[1] : t.toLowerCase();
  return COMMUNITY_SLUG.test(slug) ? { kind: "community", slug } : { kind: "invalid" };
}

/** Chiave ufficiale senza variante cosmetica (_V…), come `baseKey` di deckcode.ts. */
const baseKey = (k: string) => k.replace(/_V\d+$/, "");

/** Chiavi del codice del gioco → mazzo: la prima Leggendaria riconosciuta e le carte base una volta sola. */
export function deckFromKeys(keys: readonly string[], pool: readonly CompareCard[]): { deck: CompareDeck; unknown: number } {
  const byKey = new Map<string, CompareCard>();
  for (const c of pool) if (c.key) byKey.set(baseKey(c.key), c);
  let legendary: string | null = null;
  const cards: string[] = [];
  const unknown = new Set<string>();
  for (const k of keys) {
    const c = byKey.get(baseKey(k));
    if (!c) unknown.add(baseKey(k));
    else if (c.legendary) legendary ??= c.slug;
    else if (!cards.includes(c.slug)) cards.push(c.slug);
  }
  return { deck: { legendary, cards }, unknown: unknown.size };
}

export type DeckComparison = {
  /** stessa Leggendaria nei due mazzi */
  sameLegendary: boolean;
  /** carte base in comune, nell'ordine del primo mazzo */
  shared: string[];
  onlyA: string[];
  onlyB: string[];
  /** carte uniche di A (Leggendaria compresa) che non sono in B, e viceversa: il conto del Conquest */
  differentA: number;
  differentB: number;
};

export function compareDecks(a: CompareDeck, b: CompareDeck): DeckComparison {
  const inB = new Set(b.cards);
  const inA = new Set(a.cards);
  const sameLegendary = Boolean(a.legendary) && a.legendary === b.legendary;
  const shared = a.cards.filter((s) => inB.has(s));
  const onlyA = a.cards.filter((s) => !inB.has(s));
  const onlyB = b.cards.filter((s) => !inA.has(s));
  const legA = a.legendary && a.legendary !== b.legendary ? 1 : 0;
  const legB = b.legendary && b.legendary !== a.legendary ? 1 : 0;
  return { sameLegendary, shared, onlyA, onlyB, differentA: onlyA.length + legA, differentB: onlyB.length + legB };
}
