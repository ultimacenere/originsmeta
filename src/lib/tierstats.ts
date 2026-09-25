/**
 * Numeri della sezione Tier list, in funzioni pure (niente import: `node --test` le esegue senza il resto del sito).
 * Riprogettazione del 24/09/2026 (§1 punto 32 della KB, decisioni di Pierluigi):
 * - la tier list della community è la media delle tier list salvate dagli iscritti (S=5 … D=1), con il numero di
 *   voti e la distribuzione per fascia di ogni carta; si chiama "della community" solo da `COMMUNITY_MIN_LISTS`
 *   liste in su, sotto è un'anteprima;
 * - "Le più giocate" conta in quanti mazzi pubblicati compare ogni carta (non è un win rate);
 * - i mazzi si ordinano per voto pesato sul numero di voti, mai per media semplice (con un voto solo un 5 stelle
 *   passerebbe davanti a un 4,3 con tre voti: Baymard, "Use Both Ratings Average and Number of Ratings");
 * - il paragrafo "In breve" di /decks e di /tier-list (`deckBrief`): stesse voci e stesse frasi sulle due pagine.
 */

export type Tier = "S" | "A" | "B" | "C" | "D";
export const TIER_ORDER: readonly Tier[] = ["S", "A", "B", "C", "D"];

/** Punti di ogni fascia nella media della community. */
export const TIER_POINTS: Record<Tier, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

/** Da quante tier list salvate la classifica si chiama "della community" (Pierluigi, 24/09/2026). Sotto è un'anteprima. */
export const COMMUNITY_MIN_LISTS = 5;

export type CardScore = { slug: string; avg: number; votes: number; dist: Record<Tier, number>; tier: Tier };

/** La fascia di una media: 4,5 e oltre è S, sotto 1,5 è D (le stesse soglie della vista SQL `tier_card_scores`). */
export function tierFromAverage(avg: number): Tier {
  if (avg >= 4.5) return "S";
  if (avg >= 3.5) return "A";
  if (avg >= 2.5) return "B";
  if (avg >= 1.5) return "C";
  return "D";
}

const emptyDist = (): Record<Tier, number> => ({ S: 0, A: 0, B: 0, C: 0, D: 0 });

/**
 * Media, voti e distribuzione per carta a partire dalle fasce salvate (`tier_lists.entries`, es. {"S":["dorothy"]}).
 * Si leggono solo le cinque fasce e solo stringhe; se in una lista la stessa carta compare due volte conta la
 * fascia più alta, una volta sola. Le carte lasciate fra le non classificate non ci sono, quindi non votano
 * (le classifiche a trascinamento non devono contare come classificato ciò che nessuno ha toccato).
 */
export function aggregateLists(lists: readonly { entries: unknown }[]): CardScore[] {
  const acc = new Map<string, { sum: number; votes: number; dist: Record<Tier, number> }>();
  for (const list of lists) {
    const entries = list.entries;
    if (!entries || typeof entries !== "object") continue;
    const seen = new Set<string>();
    for (const tier of TIER_ORDER) {
      const slugs = (entries as Record<string, unknown>)[tier];
      if (!Array.isArray(slugs)) continue;
      for (const slug of slugs) {
        if (typeof slug !== "string" || !slug || seen.has(slug)) continue;
        seen.add(slug);
        const row = acc.get(slug) ?? { sum: 0, votes: 0, dist: emptyDist() };
        row.sum += TIER_POINTS[tier];
        row.votes += 1;
        row.dist[tier] += 1;
        acc.set(slug, row);
      }
    }
  }
  return Array.from(acc, ([slug, r]) => {
    const avg = Math.round((r.sum / r.votes) * 100) / 100;
    return { slug, avg, votes: r.votes, dist: r.dist, tier: tierFromAverage(avg) };
  }).sort((a, b) => b.avg - a.avg || b.votes - a.votes || a.slug.localeCompare(b.slug));
}

/**
 * In quanti mazzi compare ogni carta: la Leggendaria a parte, le carte base una volta per mazzo anche se il mazzo
 * ne ha due copie. È la misura di "Le più giocate": popolarità fra i mazzi pubblicati, non forza.
 */
export function usageCounts(decks: readonly { legendary: string | null; cards: readonly string[] }[]): {
  legendaries: Record<string, number>;
  cards: Record<string, number>;
} {
  const legendaries: Record<string, number> = {};
  const cards: Record<string, number> = {};
  for (const deck of decks) {
    if (deck.legendary) legendaries[deck.legendary] = (legendaries[deck.legendary] ?? 0) + 1;
    for (const slug of new Set(deck.cards)) {
      if (slug === deck.legendary) continue;
      cards[slug] = (cards[slug] ?? 0) + 1;
    }
  }
  return { legendaries, cards };
}

/**
 * Voto pesato sul numero di voti (media bayesiana): parte da `prior` con il peso di `weight` voti immaginari, così
 * un solo 5 stelle non vale più di tre 4,3. Con zero voti restituisce `prior`: chi ordina mette in fondo i mazzi
 * senza voti prima di guardare questo numero.
 */
export function weightedRating(avg: number, votes: number, prior = 3, weight = 2): number {
  if (votes <= 0) return prior;
  return (prior * weight + avg * votes) / (weight + votes);
}

/*
 * "In breve" di /decks e di /tier-list (piano SEO/GEO del 25/09/2026). La revisione dell'Ondata 1 ha trovato le due
 * pagine in disaccordo sugli stessi dati: sei Leggendarie a pari merito con 2 mazzi, e ognuna ne citava tre diverse
 * (una spareggiava per nome, l'altra per costo). Da qui una regola sola, con le stesse frasi: le due pagine passano le
 * loro voci a `deckBrief`, che sceglie chi citare (`pickBrief`) e scrive le frasi con i nomi linkati alle schede.
 */

/** Una voce citabile: il nome, il link alla sua scheda e il numero che la ordina (mazzi in cui compare, o voto pesato). */
export type BriefItem = { name: string; href: string; value: number };

/**
 * Chi citare: `top` le prime voci, ognuna col suo numero; `tie` un pari merito in testa troppo lungo per la frase
 * normale, citato per intero con il numero comune; `none` niente da dire (la frase si omette).
 */
export type BriefPick<T extends BriefItem> = { kind: "top"; items: T[] } | { kind: "tie"; items: T[]; value: number } | { kind: "none" };

/** Quante voci cita una frase (3), fin dove un pari merito sul taglio si cita per intero (5 nomi) e fin dove si dice "sei a pari merito" (8). */
export const BRIEF_LIMITS = { limit: 3, maxNames: 5, maxTied: 8 } as const;

/** Due numeri uguali anche se arrivano da conti diversi: il voto pesato è una frazione (5 con 1 voto = 4 con 4 voti). */
const sameValue = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** L'ordine unico delle voci: numero decrescente, poi nome, poi link (due mazzi possono avere lo stesso nome). */
export function briefOrder(a: BriefItem, b: BriefItem): number {
  if (!sameValue(a.value, b.value)) return b.value - a.value;
  return a.name.localeCompare(b.name, "en") || (a.href < b.href ? -1 : a.href > b.href ? 1 : 0);
}

/**
 * Le voci da citare, nell'ordine di `briefOrder`. Un pari merito sul taglio non si spezza mai:
 * - se l'ultima voce del taglio non ha pari merito dopo di sé, le prime `limit`;
 * - se ce l'ha, tutte le voci pari all'ultima, quando in tutto restano entro `maxNames`;
 * - oltre, se sopra il pari merito c'è qualcuno il taglio sale fin lì (A con 5 mazzi, B con 3, poi sei a 2: A e B);
 * - se il pari merito è in testa, `tie` con tutte le voci, fino a `maxTied`; più ancora, `none`.
 * Le voci a zero non si citano.
 */
export function pickBrief<T extends BriefItem>(
  entries: readonly T[],
  { limit, maxNames, maxTied }: { limit: number; maxNames: number; maxTied: number } = BRIEF_LIMITS,
): BriefPick<T> {
  const sorted = entries.filter((e) => e.value > 0).sort(briefOrder);
  if (!sorted.length) return { kind: "none" };
  if (sorted.length <= limit) return { kind: "top", items: sorted };
  const cut = sorted[limit - 1].value;
  if (!sameValue(sorted[limit].value, cut)) return { kind: "top", items: sorted.slice(0, limit) };
  let end = limit;
  while (end < sorted.length && sameValue(sorted[end].value, cut)) end++;
  if (end <= maxNames) return { kind: "top", items: sorted.slice(0, end) };
  let start = limit - 1;
  while (start > 0 && sameValue(sorted[start - 1].value, cut)) start--;
  if (start > 0) return { kind: "top", items: sorted.slice(0, start) };
  return end <= maxTied ? { kind: "tie", items: sorted.slice(0, end), value: cut } : { kind: "none" };
}

/** Un pezzo di frase: testo, oppure un nome con il link alla sua scheda (le pagine lo rendono con `<Link>`). */
export type BriefPart = string | { text: string; href: string };

/**
 * Riempie i segnaposto `{nome}` di una frase del dizionario con dei pezzi. Niente `String.replace` con i valori: i nomi
 * dei mazzi li scrivono gli utenti, e un "$&" dentro un nome deve restare com'è.
 */
export function fillParts(template: string, values: Record<string, BriefPart[]>): BriefPart[] {
  return template.split(/(\{\w+\})/).flatMap((chunk): BriefPart[] => {
    const key = /^\{(\w+)\}$/.exec(chunk)?.[1];
    if (key && key in values) return values[key];
    return chunk ? [chunk] : [];
  });
}

/** Elenco con le virgole e la congiunzione della lingua ("A, B, and C", "A, B e C", "A, B y C"), fatto di pezzi. */
export function listParts(locale: string, items: BriefPart[][]): BriefPart[] {
  return new Intl.ListFormat(locale, { type: "conjunction" })
    .formatToParts(items.map((_, i) => String(i)))
    .flatMap((p) => (p.type === "element" ? items[Number(p.value)] : [p.value]));
}

/** Le tre forme di una frase: più voci, una voce sola, un pari merito in testa (`{count}` quante sono, `{n}` il numero comune). */
export type BriefForms = { many: string; one: string; tie: string };

/**
 * Una frase di "In breve" per le voci scelte da `pickBrief`. Nella forma normale ogni nome ha accanto il suo numero
 * (`note`); nel pari merito il numero comune si scrive una volta sola (`tieAmount`), e senza `tieAmount` (i mazzi:
 * lo stesso voto pesato può venire da medie e voti diversi) ogni nome tiene il suo.
 */
export function briefSentence<T extends BriefItem>(
  pick: BriefPick<T>,
  forms: BriefForms,
  o: { locale: string; note: (item: T) => string; tieAmount?: (value: number) => string; countWord: (n: number) => string },
): BriefPart[] {
  if (pick.kind === "none") return [];
  const common = pick.kind === "tie" && o.tieAmount ? o.tieAmount(pick.value) : undefined;
  const names = pick.items.map((it): BriefPart[] => (common ? [{ text: it.name, href: it.href }] : [{ text: it.name, href: it.href }, ` (${o.note(it)})`]));
  const template = pick.kind === "tie" ? forms.tie : pick.items.length === 1 ? forms.one : forms.many;
  return fillParts(template, { list: listParts(o.locale, names), count: [o.countWord(pick.items.length)], n: common ? [common] : [] });
}

/** Le frasi di `decks.brief` nei dizionari (en è il tipo di riferimento, qui basta la forma). */
export type BriefDict = {
  count: string;
  countOne: string;
  legendaries: string;
  legendariesOne: string;
  legendariesTie: string;
  cards: string;
  cardsOne: string;
  cardsTie: string;
  rated: string;
  ratedOne: string;
  ratedTie: string;
  rating: string;
  /** i numeri in lettere, con la maiuscola perché aprono la frase del pari merito (servono dal 6 in su) */
  numbers: readonly string[];
};

/**
 * Il paragrafo "In breve" di /decks e di /tier-list, in pezzi: quanti mazzi e la data dell'ultimo, le Leggendarie più
 * giocate, le carte base più giocate (solo se la pagina le passa: /tier-list) e i mazzi più votati (per voto pesato).
 * Le voci sono tutte quelle disponibili: la scelta la fa `pickBrief`, uguale per le due pagine.
 */
export function deckBrief(o: {
  locale: string;
  t: BriefDict;
  decks: number;
  /** data dell'ultimo mazzo pubblicato, già scritta nella lingua della pagina */
  lastDate: string;
  legendaries: readonly BriefItem[];
  cards?: readonly BriefItem[];
  rated: readonly (BriefItem & { rating: { avg: number; votes: number } })[];
  /** "1 deck" / "2 decks" e "1 vote" / "3 votes" nella lingua della pagina */
  inDecks: (n: number) => string;
  votes: (n: number) => string;
}): BriefPart[] {
  const { t, locale } = o;
  const countWord = (n: number) => t.numbers[n] ?? String(n);
  const used = { locale, countWord, note: (it: BriefItem) => o.inDecks(it.value), tieAmount: o.inDecks };
  const oneDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const sentences: BriefPart[][] = [
    fillParts(o.decks === 1 ? t.countOne : t.count, { n: [String(o.decks)], date: [o.lastDate] }),
    briefSentence(pickBrief(o.legendaries), { many: t.legendaries, one: t.legendariesOne, tie: t.legendariesTie }, used),
    o.cards ? briefSentence(pickBrief(o.cards), { many: t.cards, one: t.cardsOne, tie: t.cardsTie }, used) : [],
    briefSentence(
      pickBrief(o.rated),
      { many: t.rated, one: t.ratedOne, tie: t.ratedTie },
      {
        locale,
        countWord,
        note: (it) => fillParts(t.rating, { avg: [oneDecimal.format(it.rating.avg)], votes: [o.votes(it.rating.votes)] }).join(""),
      },
    ),
  ];
  return sentences.filter((s) => s.length).flatMap((s, i) => (i ? [" ", ...s] : s));
}
