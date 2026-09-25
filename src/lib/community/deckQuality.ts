import type { Locale } from "../i18n";
import type { Guide } from "./types";
import { guideLocales, guideText, type DeckTranslations } from "./deckTranslation";

/**
 * Qualità delle pagine della community: quando un mazzo o un profilo merita di stare in Google, quali mazzi collegare
 * da una scheda, title e description dei profili (Ondata 2 del piano SEO/GEO, pacchetto DECKS, 26/09/2026).
 *
 * Perché: con le traduzioni automatiche (25/09/2026) ogni mazzo è diventato tre pagine, e i mazzi con due righe di
 * guida sono diventati tre pagine sottili fatte quasi solo della lista e dei testi delle carte, gli stessi di /cards
 * (rilievi RIV-08 e DECKS-02: 7 mazzi con 11–56 parole di guida, 21 URL). Google tratta come contenuto di poco valore
 * le traduzioni automatiche senza nulla di proprio, proprio mentre serve credito per le schede carta. Un mazzo sotto la
 * soglia resta navigabile, votabile e presente in /decks e nel profilo dell'autore, ma è noindex in tutte le lingue,
 * fuori da hreflang, dalla sitemap e dall'ItemList di /decks.
 *
 * Funzioni pure con test (`deckQuality.test.ts`): le usano la scheda del mazzo, il profilo pubblico, le letture per la
 * sitemap (`listPublishedSlugs`, `listPublicProfiles`) e l'hub /decks. Il modulo importa a runtime solo
 * `deckTranslation.ts`, a sua volta senza import a runtime, così Node lo esegue nei test.
 */

// ——— Soglia dei mazzi ———

/**
 * Parole di guida (piano di gioco più sezioni, nella lingua dell'autore) sotto cui un mazzo non si indicizza.
 * Il piano dell'Ondata 2 dice "circa 80". Contate con `countWords` sui 19 mazzi pubblicati al 26/09/2026, le guide
 * sottili dei rilievi arrivano al massimo a 56 parole e le guide vere partono da 78: value-maxxing (78) e
 * face-is-the-place (81) sono due piani di gioco dello stesso autore, scritti allo stesso modo, e una soglia a 80 li
 * avrebbe divisi per due parole. Con 75 la divisione cade nel vuoto fra le due famiglie. Se si cambia, i test dicono
 * quali mazzi di esempio cambiano lato.
 */
export const GUIDE_MIN_WORDS = 75;

/** Una parola ha almeno una lettera: numeri da soli ("3/2", "5"), emoji e segni di elenco ("-", "•") non contano. */
const LETTER = /\p{L}/u;

/**
 * Separatori: spazi (anche quelli non divisibili), barre ("Swarm/Aggro" sono due parole) e l'apostrofo fra due
 * lettere, perché in italiano "dell'avversario" e "l'abilità" sono due parole (in inglese "don't" diventa "don" + "t":
 * sulla soglia non cambia niente). Il trattino non separa: "mid-range" e "Trick-or-Treat" restano una parola.
 */
const SEPARATORS = /[\s  ]+|[/|]+|(?<=\p{L})['’](?=\p{L})/u;

/** Parole di un testo, uguali per inglese, italiano e spagnolo. */
export function countWords(text: string): number {
  let n = 0;
  for (const token of text.split(SEPARATORS)) if (token && LETTER.test(token)) n++;
  return n;
}

type WithGuide = { guide: Guide; translations?: DeckTranslations | null };

/**
 * Parole della guida originale: riassunto (il piano di gioco) più le sezioni scritte. Le traduzioni hanno la stessa
 * lunghezza, quindi si conta una volta sola, sull'originale, e il risultato vale per tutte le lingue.
 */
export function guideWordCount(deck: Pick<WithGuide, "guide">): number {
  return Object.values(guideText(deck.guide)).reduce((n, text) => n + countWords(text ?? ""), 0);
}

/** Il mazzo ha abbastanza guida per stare in Google (in ogni lingua in cui la guida si legge)? */
export function deckIndexable(deck: Pick<WithGuide, "guide">): boolean {
  return guideWordCount(deck) >= GUIDE_MIN_WORDS;
}

/**
 * Le lingue in cui la scheda del mazzo si indicizza: quelle in cui la guida si legge davvero (originale e traduzioni
 * aggiornate, `guideLocales`) se il mazzo supera la soglia, nessuna altrimenti. Decide robots, hreflang, sitemap e
 * ItemList di /decks: un unico criterio, così i quattro segnali non si contraddicono.
 */
export function indexableLocales(deck: WithGuide, all: readonly Locale[]): Locale[] {
  return deckIndexable(deck) ? guideLocales(deck, all) : [];
}

// ——— Profili pubblici (/u/<username>) ———

/**
 * Un profilo si indicizza se ha qualcosa di suo: almeno un mazzo pubblicato o una tier list salvata. Senza nessuno dei
 * due è una pagina vuota (avatar, nome, due riquadri "niente ancora"): noindex e fuori dalla sitemap.
 * Si contano i mazzi pubblicati, non solo quelli sopra la soglia: albeo_o, con quattro mazzi sotto soglia, è oggi un
 * risultato in SERP per "origins tcg koin games tier list decks", e togliere profili così lo decide Pierluigi (nota
 * del verificatore su DECKS-09). Il profilo resta l'unica pagina che raccoglie i mazzi di un autore.
 */
export function profileIndexable(counts: { decks: number; tierLists: number }): boolean {
  return counts.decks > 0 || counts.tierLists > 0;
}

/** Stessi limiti di `page.ts` (TITLE_MAX, DESCRIPTION_MAX) e della regola 120–158 delle description. */
export const PROFILE_TITLE_MAX = 60;
export const PROFILE_DESC_MIN = 120;
export const PROFILE_DESC_MAX = 158;

/** Che cosa c'è nel profilo: servono solo i numeri, le Leggendarie dei mazzi e i tipi di tier list. */
export type ProfileFacts = {
  name: string;
  decks: number;
  /** nomi delle Leggendarie dei mazzi, senza doppioni, dal mazzo più recente */
  legendaries: readonly string[];
  tierLists: number;
  /** tipi delle tier list salvate: una per tipo (indice unico owner,kind) */
  tierKinds: readonly ("legendaries" | "cards")[];
};

type ProfileWords = {
  title: { both: string; decks: string; deck: string; tiers: string; none: string; short: string };
  /** attacco della description con i mazzi: {name}, {n}, {list} (la lista arriva già fra parentesi, o vuota) */
  decks: (f: { name: string; n: number; list: string }) => string;
  /** coda sulle tier list, dopo i mazzi */
  plusTiers: (k: number) => string;
  /** description senza mazzi, con le sole tier list ({kinds} già unite): la versione lunga e quella corta */
  tiersOnly: (f: { name: string; k: number; kinds: string }) => readonly [string, string];
  none: (name: string) => string;
  kinds: { legendaries: string; cards: string };
  and: string;
  /** code per arrivare a 120 caratteri, dalla più lunga */
  tails: readonly string[];
};

/**
 * Title e description dei profili costruiti dai dati (DECKS-09): prima erano una frase fissa del dizionario ("The
 * decks and tier lists {name} has published…", 93–104 caratteri) che parlava di tier list anche a chi non ne ha.
 * I title contengono "Origins TCG" (quindi stanno da soli entro 60 caratteri, `pageTitle` aggiunge il marchio se ci
 * sta); la frase sulle tier list c'è solo se il profilo ne ha. Glossario spagnolo in docs/spagnolo.md.
 */
const profileWords: Record<Locale, ProfileWords> = {
  en: {
    title: {
      both: "{name}: Origins TCG decks and tier lists",
      decks: "{name}: Origins TCG decks",
      deck: "{name}: Origins TCG deck",
      tiers: "{name}: Origins TCG tier lists",
      none: "{name}: Origins TCG community profile",
      short: "{name}: Origins TCG",
    },
    decks: ({ name, n, list }) =>
      n === 1 ? `An Origins TCG deck by ${name}${list} with its game plan and full card list` : `${n} Origins TCG decks by ${name}${list} with game plans and full card lists`,
    plusTiers: (k) => (k === 1 ? ", plus a saved tier list" : `, plus ${k} saved tier lists`),
    tiersOnly: ({ name, k, kinds }) => {
      const head = `${k === 1 ? "An Origins TCG tier list" : `${k} Origins TCG tier lists`} by ${name} (${kinds}) ranked from S to D`;
      return [`${head}, ready to open in the tier list maker.`, `${head}.`];
    },
    none: (name) => `${name}'s profile on OriginsMeta, the Origins TCG community site: no published decks or tier lists yet.`,
    kinds: { legendaries: "Legendaries", cards: "base cards" },
    and: " and ",
    tails: ["A community profile on OriginsMeta, the unofficial Origins TCG fan site.", "A community profile on OriginsMeta.", "Community profile."],
  },
  it: {
    title: {
      both: "{name}: mazzi e tier list di Origins TCG",
      decks: "{name}: mazzi di Origins TCG",
      deck: "{name}: mazzo di Origins TCG",
      tiers: "{name}: tier list di Origins TCG",
      none: "{name}: profilo della community di Origins TCG",
      short: "{name}: Origins TCG",
    },
    decks: ({ name, n, list }) =>
      n === 1
        ? `Il mazzo di Origins TCG di ${name}${list} con piano di gioco e lista completa`
        : `I ${n} mazzi di Origins TCG di ${name}${list} con piano di gioco e lista completa`,
    plusTiers: (k) => (k === 1 ? ", più la sua tier list" : `, più le sue ${k} tier list`),
    tiersOnly: ({ name, k, kinds }) => {
      const head = `${k === 1 ? "La tier list" : `Le ${k} tier list`} di Origins TCG di ${name} (${kinds}), dalla fascia S alla D`;
      return [`${head}, da aprire nello strumento per creare la tua.`, `${head}.`];
    },
    none: (name) => `Il profilo di ${name} su OriginsMeta, il sito della community di Origins TCG: ancora nessun mazzo né tier list.`,
    kinds: { legendaries: "Leggendarie", cards: "carte base" },
    and: " e ",
    tails: ["Profilo della community su OriginsMeta, sito fan non ufficiale di Origins TCG.", "Profilo della community su OriginsMeta.", "Profilo della community."],
  },
  es: {
    title: {
      both: "{name}: mazos y tier lists de Origins TCG",
      decks: "{name}: mazos de Origins TCG",
      deck: "{name}: mazo de Origins TCG",
      tiers: "{name}: tier lists de Origins TCG",
      none: "{name}: perfil de la comunidad de Origins TCG",
      short: "{name}: Origins TCG",
    },
    decks: ({ name, n, list }) =>
      n === 1
        ? `El mazo de Origins TCG de ${name}${list} con plan de juego y lista completa`
        : `Los ${n} mazos de Origins TCG de ${name}${list} con plan de juego y lista completa`,
    plusTiers: (k) => (k === 1 ? ", y su tier list" : `, y sus ${k} tier lists`),
    tiersOnly: ({ name, k, kinds }) => {
      const head = `${k === 1 ? "La tier list" : `Las ${k} tier lists`} de Origins TCG de ${name} (${kinds}), de la S a la D`;
      return [`${head}, listas para abrir en Crea tu tier list.`, `${head}.`];
    },
    none: (name) => `El perfil de ${name} en OriginsMeta, el sitio de la comunidad de Origins TCG: todavía sin mazos ni tier lists.`,
    kinds: { legendaries: "Legendarias", cards: "cartas base" },
    and: " y ",
    tails: ["Perfil de la comunidad en OriginsMeta, sitio fan no oficial de Origins TCG.", "Perfil de la comunidad en OriginsMeta.", "Perfil de la comunidad."],
  },
};

/** Accorcia un nome all'ultima parola intera che ci sta, con l'ellissi (nomi utente lunghissimi). */
function cutName(name: string, max: number): string {
  if (name.length <= max) return name;
  const cut = name.slice(0, Math.max(1, max - 1));
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).trim()}…`;
}

/**
 * Title del profilo, senza marchio: "albeo_o: Origins TCG decks and tier lists", "albeo_o: mazzi di Origins TCG".
 * Con un nome troppo lungo si ripiega su "{name}: Origins TCG", poi si accorcia il nome.
 */
export function profileTitle(f: Pick<ProfileFacts, "name" | "decks" | "tierLists">, locale: Locale): string {
  const t = profileWords[locale].title;
  const model = f.decks > 0 ? (f.tierLists > 0 ? t.both : f.decks === 1 ? t.deck : t.decks) : f.tierLists > 0 ? t.tiers : t.none;
  const name = f.name.replace(/\s+/g, " ").trim();
  for (const m of [model, t.short]) {
    const title = m.replace("{name}", name);
    if (title.length <= PROFILE_TITLE_MAX) return title;
  }
  return t.short.replace("{name}", cutName(name, PROFILE_TITLE_MAX - t.short.replace("{name}", "").length));
}

/** Elenco con l'ultima congiunzione: "Dorothy, Merlin and Dracula". */
function joinList(items: readonly string[], and: string): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")}${and}${items[items.length - 1]}`;
}

/**
 * Description del profilo dai dati, fra 120 e 158 caratteri quando il profilo si indicizza:
 * "4 Origins TCG decks by albeo_o (Dorothy, Merlin, Dracula and Robin Hood) with game plans and full card lists, plus a
 * saved tier list." Le Leggendarie si tolgono dalla coda se la frase non ci sta (poi tutta la parentesi);
 * sotto i 120 caratteri si aggiunge la coda più lunga che ci sta. Il profilo senza nulla (noindex) ha una frase onesta.
 */
export function profileDescription(f: ProfileFacts, locale: Locale): string {
  const w = profileWords[locale];
  const name = cutName(f.name.replace(/\s+/g, " ").trim(), 40);
  let base: string;
  if (f.decks > 0) {
    const tiers = f.tierLists > 0 ? w.plusTiers(f.tierLists) : "";
    const lists = [f.legendaries.length, ...Array.from({ length: f.legendaries.length }, (_, i) => f.legendaries.length - 1 - i)];
    base = "";
    for (const k of lists) {
      const shown = f.legendaries.slice(0, k);
      const list = shown.length ? ` (${k < f.legendaries.length ? `${shown.join(", ")}…` : joinList(shown, w.and)})` : "";
      base = `${w.decks({ name, n: f.decks, list })}${tiers}.`;
      if (base.length <= PROFILE_DESC_MAX) break;
    }
  } else if (f.tierLists > 0) {
    const kinds = joinList(
      (["legendaries", "cards"] as const).filter((k) => f.tierKinds.includes(k)).map((k) => w.kinds[k]),
      w.and,
    );
    const [long, short] = w.tiersOnly({ name, k: f.tierLists, kinds: kinds || w.kinds.cards });
    base = long.length <= PROFILE_DESC_MAX ? long : short;
  } else {
    base = w.none(name);
  }
  if (base.length >= PROFILE_DESC_MIN) return base;
  const tail = w.tails.find((t) => base.length + 1 + t.length <= PROFILE_DESC_MAX);
  return tail ? `${base} ${tail}` : base;
}

// ——— Altri mazzi collegati da una scheda ———

/** Quanti mazzi collega una scheda (prima erano gli 8 più recenti). */
export const RELATED_DECKS = 8;

type RelDeck = { slug: string; legendary: string | null; created_at: string };

/** Dal più recente; a parità di data vince lo slug, così l'ordine non dipende da come arrivano le righe. */
function newestFirst<T extends RelDeck>(a: T, b: T): number {
  return b.created_at.localeCompare(a.created_at) || a.slug.localeCompare(b.slug);
}

/**
 * I mazzi da collegare in fondo alla scheda (DECKS-11): prima gli altri mazzi con la stessa Leggendaria, poi, se sono
 * meno di `limit`, i mazzi più recenti con un'altra Leggendaria. Mai il mazzo stesso, sempre lo stesso risultato per
 * gli stessi dati. Prima erano gli 8 mazzi più recenti: i link seguivano la data e non l'argomento, e i mazzi vecchi
 * (compresi quelli con le guide più complete) ne perdevano uno a ogni pubblicazione.
 * Quando una Leggendaria ha più mazzi di quanti se ne mostrano, ogni scheda collega i suoi vicini in ordine di
 * pubblicazione (il successivo, il precedente, poi i due dopo…, in cerchio): così ogni mazzo del gruppo riceve link
 * dagli altri, invece di tutti verso gli stessi otto.
 */
export function relatedDecks<T extends RelDeck>(current: RelDeck, all: readonly T[], limit: number = RELATED_DECKS): { sameLegendary: T[]; recent: T[] } {
  const others = all.filter((d) => d.slug !== current.slug);
  const same = current.legendary ? others.filter((d) => d.legendary === current.legendary) : [];
  let sameLegendary: T[];
  if (same.length <= limit) {
    sameLegendary = [...same].sort(newestFirst);
  } else {
    // Cerchio in ordine di pubblicazione, con il mazzo corrente al suo posto
    const ring = [...same, current as T].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.slug.localeCompare(b.slug));
    const at = ring.findIndex((d) => d.slug === current.slug);
    const picked: T[] = [];
    for (let step = 1; picked.length < limit && step < ring.length; step++) {
      for (const i of [at + step, at - step]) {
        const d = ring[((i % ring.length) + ring.length) % ring.length];
        if (picked.length < limit && d.slug !== current.slug && !picked.includes(d)) picked.push(d);
      }
    }
    sameLegendary = picked.sort(newestFirst);
  }
  const recent = others
    .filter((d) => !current.legendary || d.legendary !== current.legendary)
    .sort(newestFirst)
    .slice(0, Math.max(0, limit - sameLegendary.length));
  return { sameLegendary, recent };
}

// ——— Autore editoriale dietro un account della community ———

/**
 * L'autore editoriale (pagina /authors/<slug>) che ha pubblicato questi mazzi, se `src/lib/data/authors.ts` lo
 * dichiara: `communityDecks` elenca i mazzi pubblicati da quella persona con il suo account (Davdas: account
 * luigidavdasragoni). Basta un mazzo dell'account nell'elenco: il proprietario del mazzo è una persona sola. Nessun
 * legame che i dati non dicano: senza mazzi dichiarati, nessun autore.
 * Se un giorno authors.ts dichiarerà anche il nome utente (`communityUsername`, campo facoltativo che oggi non c'è),
 * vale anche quello, e il legame regge pure per un autore che non ha ancora pubblicato mazzi.
 */
export function editorialAuthor<A extends { slug: string; communityDecks?: readonly { slug: string }[]; communityUsername?: string }>(
  authors: readonly A[],
  deckSlugs: readonly string[],
  username?: string | null,
): A | undefined {
  return authors.find((a) => (username && a.communityUsername === username) || a.communityDecks?.some((d) => deckSlugs.includes(d.slug)));
}

// ——— Etichette ———

/**
 * Etichette nuove della scheda mazzo e del profilo, nelle tre lingue (non stanno nei dizionari: un modulo solo per
 * questo pacchetto, come `linkLabels.ts` e `tierLabels.ts`). Nomi delle sezioni del sito come in docs/spagnolo.md.
 */
const en = {
  /** blocco in fondo alla scheda: gli altri mazzi con la stessa Leggendaria ({legendary}) */
  sameLegendary: "More {legendary} decks",
  /** il riempitivo dopo quel blocco, quando c'è (senza, resta "More Origins decks" del dizionario) */
  recentAfter: "Other recent decks",
  /** riquadro in alto quando una guida di OriginsMeta tratta questo mazzo (tags.communityDecks in guides.ts) */
  guideCallout: "OriginsMeta guide to this deck",
  /** profilo di un autore editoriale: link alla sua pagina /authors ({name} = nome completo) */
  authorPage: "Author page on OriginsMeta: {name}",
  /** link dal profilo alla tier list principale, con l'ancora che la mappa delle query assegna a /tier-list (C14) */
  tierList: "Origins TCG tier list",
  /** per la pagina /authors/<slug> (file di un altro pacchetto): link al profilo della community ({username}) */
  communityProfile: "Community profile: @{username}",
};

export type CommunityPageLabels = typeof en;

export const communityPageLabels: Record<Locale, CommunityPageLabels> = {
  en,
  it: {
    sameLegendary: "Altri mazzi con {legendary}",
    recentAfter: "Altri mazzi recenti",
    guideCallout: "La guida di OriginsMeta a questo mazzo",
    authorPage: "Pagina autore su OriginsMeta: {name}",
    tierList: "Tier list di Origins TCG",
    communityProfile: "Profilo nella community: @{username}",
  },
  es: {
    sameLegendary: "Más mazos de {legendary}",
    recentAfter: "Otros mazos recientes",
    guideCallout: "La guía de OriginsMeta sobre este mazo",
    authorPage: "Página de autor en OriginsMeta: {name}",
    tierList: "Tier list de Origins TCG",
    communityProfile: "Perfil en la comunidad: @{username}",
  },
};
