import type { Locale } from "./i18n";
import { creatorsOf, type TitleCard } from "./cardTitles";
import { lastmodFor, toDay, type Day } from "./lastmod";
import { weightedRating } from "./tierstats";

/**
 * Legami di una carta con i mazzi e con le altre carte, per la scheda carta (Ondata 2 del piano SEO/GEO, "schede
 * carta, Leggendarie e mazzi": SCHEDE-02, SCHEDE-06, SCHEDE-12, DECKS-04, COMP-03).
 *
 * Tutto viene dai dati, niente è scritto a mano:
 * - i mazzi che usano la carta e le carte "spesso nello stesso mazzo" dai mazzi pubblicati della community (letti da
 *   Supabase in `src/lib/community/decksByCard.ts`, una volta per tutte le schede, e passati qui già ridotti a
 *   `DeckRef`);
 * - le carte che una carta genera, e chi genera una carta creata, dai testi delle carte, con `creatorsOf` di
 *   `cardTitles.ts`. Il campo `related` di World of Origins non basta (su Garlic, Holy Water, Wooden Stake, Silver
 *   Bullet, Mama Bear e Pumpkin salta un passaggio o dimentica la carta della demo): resta come "collegata" solo dove
 *   nessun testo spiega il legame (Merlin → Merlin's Prophecy, Mulan → Reflection).
 *
 * Funzioni pure: `node --test src/lib/cardSynergy.test.ts` le prova con mazzi finti e con il database carte vero.
 * Gli import relativi senza estensione li risolve, nel test, lo stesso hook di `cardTitles.test.ts`.
 */

// ---------- Mazzi ----------

/**
 * Un mazzo pubblicato, ridotto a quello che serve alle schede carta: piccolo, perché la lettura di Supabase finisce
 * nella cache condivisa di Next (una voce sola per tutte le schede) e la guida intera non serve.
 */
export type DeckRef = {
  slug: string;
  name: string;
  /** slug della Leggendaria che guida il mazzo */
  legendary: string | null;
  /** slug delle 12 carte base */
  cards: string[];
  archetype: string;
  rating: { avg: number; votes: number };
  /** timestamp ISO di creazione e ultima modifica */
  created: string;
  updated: string;
  /** nome dell'autore, come lo mostra il sito (`authorName`) */
  author: string;
  /** tag autore: community, influencer, pro, staff */
  badge: string;
  /**
   * Lingue in cui la pagina del mazzo è indicizzabile: quella della guida più le traduzioni aggiornate
   * (`guideLocales` di `deckTranslation.ts`, la stessa regola di hreflang, sitemap e noindex della scheda del mazzo;
   * con il pacchetto DECKS, `indexableLocales` di `deckQuality.ts`, che toglie anche i mazzi con la guida troppo corta).
   */
  locales: Locale[];
};

/** Il mazzo contiene la carta: come Leggendaria che lo guida o fra le carte base. */
export function deckHasCard(deck: Pick<DeckRef, "legendary" | "cards">, slug: string): boolean {
  return deck.legendary === slug || deck.cards.includes(slug);
}

/**
 * Ordine dei mazzi, lo stesso dell'elenco dei mazzi e della tier list (`loadTierData`): prima quelli con voti, dal
 * voto pesato sul numero di voti (`weightedRating`), poi i più recenti.
 */
export function byRating(a: DeckRef, b: DeckRef): number {
  const score = (d: DeckRef) => weightedRating(d.rating.avg, d.rating.votes);
  return Number(b.rating.votes > 0) - Number(a.rating.votes > 0) || score(b) - score(a) || b.created.localeCompare(a.created);
}

/**
 * I mazzi pubblicati con una carta (o con una qualsiasi delle carte di `slugs`: le schede delle carte create
 * mostrano i mazzi con la carta che le genera). Per una Leggendaria sono i mazzi che guida, perché nel database una
 * Leggendaria non sta mai fra le carte base; per una carta base, i mazzi che la contengono. È lo stesso conto di
 * "Le più giocate" (`usageCounts` di `tierstats.ts`), così scheda carta e tier list dicono lo stesso numero.
 */
export function decksByCard(decks: readonly DeckRef[], slugs: string | readonly string[]): DeckRef[] {
  const wanted = typeof slugs === "string" ? [slugs] : slugs;
  return decks.filter((d) => wanted.some((s) => deckHasCard(d, s))).sort(byRating);
}

/**
 * I mazzi da linkare nella lingua della pagina: solo quelli la cui pagina è indicizzabile in quella lingua (le altre
 * versioni sono noindex); `others` dice quanti restano fuori, perché la scheda lo dichiari invece di tacerlo.
 * `indexable` si può sostituire con la regola della scheda del mazzo, se ne arriva una più stretta.
 */
export function decksForLocale(
  decks: readonly DeckRef[],
  locale: Locale,
  indexable: (deck: DeckRef, locale: Locale) => boolean = (deck, l) => deck.locales.includes(l),
): { shown: DeckRef[]; others: number } {
  const shown = decks.filter((d) => indexable(d, locale));
  return { shown, others: decks.length - shown.length };
}

/** Una carta che compare insieme a un'altra: in quanti mazzi (`together`) sui mazzi della carta. */
export type Companion = { slug: string; together: number };

/**
 * "Spesso nello stesso mazzo" (SCHEDE-12): le carte presenti insieme a `slug` in almeno `min` mazzi pubblicati,
 * Leggendaria compresa, dalla più frequente; a parità, in ordine di slug (l'ordine dei nomi lo decide la pagina).
 * Con un solo mazzo non c'è co-presenza da dire: la soglia di 2 è quella del piano.
 */
export function companions(decks: readonly DeckRef[], slug: string, min = 2): Companion[] {
  const counts = new Map<string, number>();
  for (const d of decks) {
    if (!deckHasCard(d, slug)) continue;
    const others = new Set([...(d.legendary ? [d.legendary] : []), ...d.cards]);
    others.delete(slug);
    for (const s of others) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, n]) => n >= min)
    .map(([s, together]) => ({ slug: s, together }))
    .sort((a, b) => b.together - a.together || a.slug.localeCompare(b.slug));
}

/** Quanti mazzi elenca al massimo la scheda di una carta: oggi la carta più usata ne ha 9 su 16. */
export const MAX_DECKS = 12;

/**
 * I mazzi che la scheda di una carta della demo elenca nella lingua della pagina (`listed`: indicizzabili, nell'ordine
 * della tier list, al massimo `MAX_DECKS`) e quanti ne conta soltanto (`others`: pagina noindex in questa lingua o
 * oltre il tetto). Una sola funzione per l'elenco, il JSON-LD (`relatedLink` e ItemList) e le date, così i tre non
 * possono dire mazzi diversi.
 */
export function listedDecks(decks: readonly DeckRef[], slugs: string | readonly string[], locale: Locale): { listed: DeckRef[]; others: number } {
  const all = decksByCard(decks, slugs);
  const { shown } = decksForLocale(all, locale);
  const listed = shown.slice(0, MAX_DECKS);
  return { listed, others: all.length - listed.length };
}

/** I giorni di modifica di un elenco di mazzi, senza orario. */
export function deckDays(decks: readonly DeckRef[]): Day[] {
  return decks.map((d) => toDay(d.updated)).filter((d): d is Day => Boolean(d));
}

/**
 * I giorni dei mazzi che contengono una delle carte, in tutte le lingue: il conto generico. Per la data della scheda
 * si usa `cardPageDeckDays`, che guarda solo i mazzi che la pagina elenca.
 */
export function cardDeckDays(decks: readonly DeckRef[], slugs: string | readonly string[]): Day[] {
  return deckDays(decksByCard(decks, slugs));
}

/**
 * I giorni dei mazzi che la scheda carta ELENCA in quella lingua: la scheda li conta nel suo `dateModified` e la
 * sitemap nel `lastmod`, con questa stessa funzione, così le due date restano uguali (Ondata 2, 25/09/2026).
 * - Solo le carte della demo elencano mazzi: le carte create mostrano soltanto il conto dei mazzi con la carta che le
 *   genera e le rimosse nessun mazzo, quindi per loro nessun giorno (`decks` può anche essere `null`: lettura fallita).
 * - Solo i mazzi elencati (`listedDecks`): un mazzo noindex in quella lingua, o oltre il tetto, cambia solo il conto.
 * - Un mazzo nuovo senza la carta cambia solo il totale "{n} dei {N}" della frase d'attacco: non conta.
 * Limite dichiarato: i giorni sono quelli dei mazzi di oggi, quindi se un mazzo viene nascosto o eliminato la data può
 * tornare a un giorno precedente (una data della sparizione non c'è). Succede di rado e non inganna nessuno: la
 * pagina non ha più quel mazzo, e il giorno dichiarato resta quello di un contenuto vero.
 */
export function cardPageDeckDays(card: Pick<RelCard, "type" | "status" | "slug">, locale: Locale, decks: readonly DeckRef[] | null): Day[] {
  if (!decks || card.status !== "active" || card.type === "token") return [];
  return deckDays(listedDecks(decks, card.slug, locale).listed);
}

// ---------- Carte generate ----------

/** I campi che servono ai legami fra carte: quelli di `creatorsOf` più il campo `related` di World of Origins. */
export type RelCard = TitleCard & { related?: string[] };

function plain(text: string): string {
  return text.replace(/[’‘]/g, "'");
}

/**
 * Le carte create (token) che il testo di `card` nomina, cioè le carte che genera: Van Helsing → Van Helsing's Tools,
 * Old MacDonald → Pumpkin, Headless Horseman (fuori dalla demo) → Pumpkin. Stesso confronto di `creatorsOf`, fatto
 * sulla sola coppia: così non conta la regola "fra più fonti quelle nella demo", che serve a chi guarda dalla carta
 * creata e non a chi guarda dalla carta che la nomina. I nomi più lunghi che contengono quello della carta creata
 * ("Not So Little Pig" per Little Pig) restano nell'elenco senza testo, perché `creatorsOf` li veda e non li confonda.
 */
export function namedTokens<C extends RelCard>(card: C, all: readonly C[]): C[] {
  if (!card.ability) return [];
  return all.filter((t) => {
    if (t.type !== "token" || t.slug === card.slug) return false;
    const name = plain(t.name);
    const longer = all
      .filter((c) => c.slug !== t.slug && c.slug !== card.slug && plain(c.name).length > name.length && plain(c.name).includes(name))
      .map((c) => ({ ...c, ability: undefined }));
    return creatorsOf(t, [t, card, ...longer]).some((c) => c.slug === card.slug);
  });
}

/** Passaggi al massimo, per sicurezza: oggi la catena più lunga ne ha due (Garlic ← Van Helsing's Tools ← Van Helsing). */
const MAX_STEPS = 4;

function uniqueBySlug<C extends { slug: string }>(list: readonly C[]): C[] {
  const seen = new Set<string>();
  return list.filter((c) => (seen.has(c.slug) ? false : (seen.add(c.slug), true)));
}

/**
 * Chi genera una carta creata, a ritroso, un livello per passaggio: Garlic → [[Van Helsing's Tools], [Van Helsing]],
 * Mama Bear → [[Papa Bear], [Baby Bear]]. Il primo livello è `creatorsOf` (fra più fonti, quelle nella demo); si
 * risale solo finché la carta trovata è a sua volta una carta creata. Vuoto per le carte non create e per quelle che
 * nessun testo nomina (Reflection, Off With Your Head!, Little Pig).
 */
export function creationChain<C extends RelCard>(card: C, all: readonly C[]): C[][] {
  if (card.type !== "token") return [];
  const levels: C[][] = [];
  const seen = new Set([card.slug]);
  let current: C[] = [card];
  while (levels.length < MAX_STEPS) {
    const next = uniqueBySlug(current.filter((c) => c.type === "token").flatMap((c) => creatorsOf(c, all) as C[])).filter((c) => !seen.has(c.slug));
    if (!next.length) break;
    for (const c of next) seen.add(c.slug);
    levels.push(next);
    current = next;
  }
  return levels;
}

/**
 * Che cosa genera una carta, in avanti, un livello per passaggio: Van Helsing → [[Van Helsing's Tools], [Holy Water,
 * Silver Bullet, Garlic, Wooden Stake]], Baby Bear → [[Papa Bear], [Mama Bear]]. Si prosegue solo dalle carte create.
 */
export function createdChain<C extends RelCard>(card: C, all: readonly C[]): C[][] {
  const levels: C[][] = [];
  const seen = new Set([card.slug]);
  let current: C[] = [card];
  while (levels.length < MAX_STEPS) {
    const next = uniqueBySlug(current.filter((c) => c === card || c.type === "token").flatMap((c) => namedTokens(c, all))).filter((c) => !seen.has(c.slug));
    if (!next.length) break;
    for (const c of next) seen.add(c.slug);
    levels.push(next);
    current = next;
  }
  return levels;
}

/**
 * Le carte fuori dalla demo il cui testo genera una carta creata che nella demo ha già chi la genera: Pumpkin →
 * Headless Horseman e Pumpkin Patch, Zombie → Necromancer. La scheda le dice a parte ("nelle build precedenti").
 */
export function earlierCreators<C extends RelCard>(card: C, all: readonly C[], chain: readonly C[][] = creationChain(card, all)): C[] {
  if (card.type !== "token") return [];
  const first = new Set((chain[0] ?? []).map((c) => c.slug));
  return all.filter((c) => c.status === "removed" && !first.has(c.slug) && namedTokens(c, all).some((t) => t.slug === card.slug));
}

/**
 * Le carte che World of Origins collega a questa (campo `related`, nei due versi) e che nessun testo spiega: tolte
 * quelle già nella catena di chi la genera o di ciò che genera. Merlin ↔ Merlin's Prophecy, Mulan ↔ Reflection,
 * Queen of Hearts ↔ Off With Your Head!, Three Not So Little Pigs ↔ Little Pig. Non si dice "genera": il legame
 * può venire dal potere leggendario, che non abbiamo ancora letto nel gioco (SCHEDE-13).
 */
export function linkedCards<C extends RelCard>(card: C, all: readonly C[], explained: readonly C[] = []): C[] {
  const skip = new Set([card.slug, ...explained.map((c) => c.slug)]);
  const slugs = new Set([...(card.related ?? []), ...all.filter((c) => c.related?.includes(card.slug)).map((c) => c.slug)]);
  return all.filter((c) => slugs.has(c.slug) && !skip.has(c.slug));
}

/** Tutti i legami di una carta, calcolati una volta per la scheda. */
export type CardRelations<C extends RelCard> = {
  /** chi la genera, a ritroso (solo carte create) */
  createdBy: C[][];
  /** carte fuori dalla demo che la generavano (solo carte create) */
  createdByEarlier: C[];
  /** che cosa genera, in avanti */
  creates: C[][];
  /** collegate da World of Origins senza un testo che lo spieghi */
  linked: C[];
};

export function cardRelations<C extends RelCard>(card: C, all: readonly C[]): CardRelations<C> {
  const createdBy = creationChain(card, all);
  const createdByEarlier = earlierCreators(card, all, createdBy);
  const creates = createdChain(card, all);
  const linked = linkedCards(card, all, [...createdBy.flat(), ...createdByEarlier, ...creates.flat()]);
  return { createdBy, createdByEarlier, creates, linked };
}

/**
 * Le carte da cui passano i mazzi di una carta creata: le carte non create della catena (Garlic → Van Helsing,
 * Mama Bear → Baby Bear, Pumpkin → Old MacDonald). Una carta creata non entra in un mazzo: la scheda mostra i mazzi
 * con la carta che la genera.
 */
export function deckRoots<C extends RelCard>(chain: readonly C[][]): C[] {
  return uniqueBySlug(chain.flat().filter((c) => c.type !== "token" && c.status === "active"));
}

/**
 * Le carte i cui mazzi conta la scheda: la carta stessa; per una carta creata, le carte della demo che la generano
 * (`deckRoots`: la scheda dice in quanti mazzi sono e rimanda alla loro sezione dei mazzi); nessuna per le carte
 * rimosse, che non mostrano mazzi.
 */
export function cardDeckSlugs<C extends RelCard>(card: C, all: readonly C[]): string[] {
  if (card.status === "removed") return [];
  if (card.type === "token") return deckRoots(creationChain(card, all)).map((c) => c.slug);
  return [card.slug];
}

/**
 * Il giorno dell'ultima modifica di una scheda carta con i mazzi: quello di `cardLastmod` (patch, verifica sul gioco,
 * testi letti nel gioco, guide) più i giorni dei mazzi che la scheda elenca (`cardPageDeckDays`). È il `dateModified`
 * della pagina e deve essere anche il `lastmod` della sitemap, calcolato con le stesse due funzioni: le stesse regole
 * di `lastmodFor` (nascita della lingua, mai nel futuro).
 */
export function cardPageLastmod(base: Day, locale: Locale, deckDays: Iterable<Day>, today: Day): Day {
  return lastmodFor(locale, [base, ...deckDays], today);
}
