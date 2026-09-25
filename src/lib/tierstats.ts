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

/** Le parole della frase sul campione della tier list della community (chiavi di `tier` nei dizionari). */
export type SampleWords = {
  sourceCommunityPeopleOne: string;
  sourceCommunityPeopleMany: string;
  sourceCommunityOne: string;
  sourceCommunityMany: string;
  communitySampleOne: string;
  communitySampleMany: string;
};

/**
 * Quante persone hanno salvato una tier list e quante liste ci sono, per scheda. Ogni persona ne salva al massimo una
 * per scheda (Leggendarie e carte base), quindi 2 persone possono fare 4 liste: prima il sito diceva solo "2 liste"
 * (il massimo fra le due schede) e un contatore sulle righe della tabella ne vedeva 4 (Pierluigi, 25/09/2026).
 */
export function communitySample(w: SampleWords, n: { legendaries: number; cards: number; people: number }): string {
  const total = n.legendaries + n.cards;
  const people = n.people === 1 ? w.sourceCommunityPeopleOne : w.sourceCommunityPeopleMany.replace("{n}", String(n.people));
  const lists = total === 1 ? w.sourceCommunityOne : w.sourceCommunityMany.replace("{n}", String(total));
  return (total === 1 ? w.communitySampleOne : w.communitySampleMany)
    .replace("{people}", people)
    .replace("{lists}", lists)
    .replace("{legendaries}", String(n.legendaries))
    .replace("{cards}", String(n.cards));
}

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
 * Ordine di "Le più giocate": più mazzi, poi costo più basso (senza costo in fondo), poi nome. Un comparatore solo per
 * le righe visibili (`TierExplorer`, modo `usage`) e per l'ItemList dei dati strutturati di /tier-list/most-played
 * (Ondata 2, GEO-10), così la lista dichiarata è quella che si legge nella pagina.
 */
export function usageOrder(a: { used: number; mana?: number; name: string }, b: { used: number; mana?: number; name: string }): number {
  return b.used - a.used || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name);
}

/**
 * Ordine dentro una fascia della tier list della community: media più alta, poi più voti, poi costo e nome, come si
 * leggono le carte nel gioco. Lo usano le fasce visibili (`TierExplorer`) e l'ItemList di /tier-list/community.
 */
export function communityOrder(
  a: { community?: { avg: number; votes: number }; mana?: number; name: string },
  b: { community?: { avg: number; votes: number }; mana?: number; name: string },
): number {
  return (
    (b.community?.avg ?? 0) - (a.community?.avg ?? 0) ||
    (b.community?.votes ?? 0) - (a.community?.votes ?? 0) ||
    (a.mana ?? 99) - (b.mana ?? 99) ||
    a.name.localeCompare(b.name)
  );
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
 * Le anteprime a striscia di /tier-list seguono lo stesso ordine e lo stesso divieto di spezzare un pari merito
 * (`pickPreview`), così la pagina non dà due risposte.
 */

/** Una voce citabile: il nome, il link alla sua scheda e il numero che la ordina (mazzi in cui compare, o voto pesato). */
export type BriefItem = { name: string; href: string; value: number };

/**
 * Chi citare: `top` le prime voci, ognuna col suo numero; `tie` un pari merito in testa troppo lungo per la frase
 * normale, citato per intero con il numero comune; `none` niente da dire (la frase si omette).
 */
export type BriefPick<T extends BriefItem> = { kind: "top"; items: T[] } | { kind: "tie"; items: T[]; value: number } | { kind: "none" };

/**
 * Quante voci cita una frase (3) e fin dove un pari merito sul taglio si cita per intero, ognuno col suo numero (5 nomi
 * in tutto). Oltre i 5 il mandato del 25/09/2026 lasciava due strade, dirlo elencandoli tutti oppure omettere la frase;
 * la regola scelta (revisione dell'Ondata 1): se il pari merito è in testa la frase lo dice ("sei Leggendarie sono a
 * pari merito…") e li elenca tutti fino a 8 nomi (`maxTied`: un elenco più lungo non è più un "in breve"); se non è in
 * testa, o supera gli 8 nomi, la frase si omette. Il taglio non sale mai a chi sta sopra un pari merito lungo.
 */
export const BRIEF_LIMITS = { limit: 3, maxNames: 5, maxTied: 8 } as const;

/** Due numeri uguali anche se arrivano da conti diversi: il voto pesato è una frazione (5 con 1 voto = 4 con 4 voti). */
const sameValue = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** L'ordine unico delle voci: numero decrescente, poi nome, poi link (due mazzi possono avere lo stesso nome). */
export function briefOrder(a: BriefItem, b: BriefItem): number {
  if (!sameValue(a.value, b.value)) return b.value - a.value;
  return a.name.localeCompare(b.name, "en") || (a.href < b.href ? -1 : a.href > b.href ? 1 : 0);
}

/** Le voci citabili nell'ordine unico: solo quelle sopra zero, per `briefOrder`. */
const briefSorted = <T extends BriefItem>(entries: readonly T[]): T[] => entries.filter((e) => e.value > 0).sort(briefOrder);

/**
 * Il pari merito che un taglio a `limit` voci spezzerebbe: `start` è la prima voce pari all'ultima del taglio, `end` la
 * prima dopo il pari merito. `undefined` se il taglio non spezza niente (o le voci non arrivano al taglio).
 */
function tieAtCut(sorted: readonly BriefItem[], limit: number): { start: number; end: number } | undefined {
  if (sorted.length <= limit || !sameValue(sorted[limit].value, sorted[limit - 1].value)) return undefined;
  const cut = sorted[limit - 1].value;
  let start = limit - 1;
  while (start > 0 && sameValue(sorted[start - 1].value, cut)) start--;
  let end = limit;
  while (end < sorted.length && sameValue(sorted[end].value, cut)) end++;
  return { start, end };
}

/**
 * Le voci da citare, nell'ordine di `briefOrder`. Un pari merito sul taglio non si spezza mai (regola in `BRIEF_LIMITS`):
 * - se l'ultima voce del taglio non ha pari merito dopo di sé, le prime `limit`;
 * - se ce l'ha, tutte le voci fino alla fine del pari merito, quando in tutto restano entro `maxNames`;
 * - oltre, se il pari merito è in testa, `tie` con tutte le voci, fino a `maxTied`;
 * - altrimenti `none` (A con 5 mazzi, B con 3, poi sei a 2: la frase si omette).
 * Le voci a zero non si citano.
 */
export function pickBrief<T extends BriefItem>(
  entries: readonly T[],
  { limit, maxNames, maxTied }: { limit: number; maxNames: number; maxTied: number } = BRIEF_LIMITS,
): BriefPick<T> {
  const sorted = briefSorted(entries);
  if (!sorted.length) return { kind: "none" };
  const tie = tieAtCut(sorted, limit);
  if (!tie) return { kind: "top", items: sorted.slice(0, limit) };
  if (tie.end <= maxNames) return { kind: "top", items: sorted.slice(0, tie.end) };
  if (tie.start === 0 && tie.end <= maxTied) return { kind: "tie", items: sorted.slice(0, tie.end), value: sorted[0].value };
  return { kind: "none" };
}

/**
 * Le anteprime a striscia di /tier-list (i mazzi più votati, le Leggendarie e le carte base nei mazzi più pubblicati):
 * stesso ordine di "In breve" e stesso divieto di spezzare un pari merito. La revisione dell'Ondata 1 le ha trovate a
 * contraddire la frase sopra: quattro delle sei Leggendarie a pari merito, spareggiate per costo. Una striscia va a capo
 * e non deve sparire, quindi niente `none`: il pari merito sul taglio si mostra per intero se in tutto restano entro
 * `max` voci, altrimenti la striscia si ferma a chi sta sopra; se il pari merito lungo è in testa si mostra tutto.
 */
export function pickPreview<T extends BriefItem>(entries: readonly T[], { limit, max }: { limit: number; max: number }): T[] {
  const sorted = briefSorted(entries);
  const tie = tieAtCut(sorted, limit);
  if (!tie) return sorted.slice(0, limit);
  return sorted.slice(0, tie.end <= max || tie.start === 0 ? tie.end : tie.start);
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
