import { formatDate, type Locale } from "./i18n";
import { activeCards, cardsVerified, officialTextLocales, patchLabel, patchOrder, patches, type Card, type Change, type PatchId } from "./data/cards";
import cardArt from "./data/card-art.json";
import type { RelCard } from "./cardSynergy";

/**
 * Testi della scheda carta costruiti dai dati, nelle sette lingue (Ondata 2 del piano SEO/GEO, 25/09/2026: CARDS-05,
 * GEO-07, SCHEDE-06, SCHEDE-07, SCHEDE-10, SCHEDE-11, CARDS-09, CARDS-14, CARDS-16; francese dal 07/10/2026, portoghese
 * del Brasile, tedesco e russo dal 20/10/2026).
 *
 * - `cardLead`: la frase d'attacco sotto l'H1, che dice che cos'è la carta (tipo, costo, statistiche, allineamento,
 *   stato, mazzi pubblicati) senza nessun giudizio; per le carte create la prima cosa è chi le genera, per quelle
 *   rimosse che non sono più nel gioco e quindi non entrano nel deck builder.
 * - `cardBrief`: il riquadro "In breve", 2–3 domande e risposte ricavate dai dati. Solo testo visibile: niente
 *   FAQPage, perché Google non mostra più i rich result FAQ dal 7 maggio 2026 (SCHEDE-10). Ogni risposta dice una cosa
 *   che la frase d'attacco non dice già (revisione del 25/09/2026, TECH-04: niente blocchi ripetuti a modello).
 * - `cardLabels`: le etichette nuove della scheda (sezioni, testi del gioco e traduzioni, alt dell'illustrazione…).
 *   Stanno qui e non nei dizionari, come `linkLabels.ts` e `tierLabels.ts`; `en` è il tipo di riferimento.
 *
 * Le frasi sono fatte di pezzi (`Part`): testo e riferimenti a carte o pagine, che la scheda rende come link.
 * Termini di gioco dal glossario ufficiale (docs/testi-di-gioco.md, docs/spagnolo.md, docs/francese.md): unità/magia/
 * carta generata, unidad/hechizo/carta creada, unité/sort/carte créée, Potenza/Salute, Poder/Salud, Puissance/Santé;
 * allineamenti Good/Evil/Neutral in inglese come sulla carta; nomi di carte in inglese. In francese si dà del "vous" e
 * c'è lo spazio insecabile prima di : ; ? !, scritto `\u00a0` nelle stringhe (il carattere nudo si perde negli editor).
 * In portoghese (docs/portoghese.md) si dà del "você", il tipo è quello del gioco (personagem/feitiço/carta criada,
 * Poder/Vida, Lendária) e il soggetto si sottintende ("Custa 5 de mana…"). In tedesco (docs/tedesco.md, dal 20/10/2026) si
 * dà del "du", il glossario è quello del gioco letto il 20/10/2026 (Charakter/Zauber/erschaffene Karte, Kraft/Leben,
 * Legendär), il pronome segue il tipo ("Er" per Charakter e Zauber, "Sie" per la carta creata) e i
 * verbi vanno in fondo alla subordinata (catene con l'apposizione "ihrerseits erschaffen von"). In russo (docs/russo.md, glossario
 * del gioco) si dà del "вы", il tipo è персонаж/заклинание/созданная карта (Сила/Здоровье, Легендарная), il soggetto si
 * sottintende o è "карта" (femminile) e i numeri stanno dove non declinano il nome ("Силу 5", "в патчах: 2"). Nessun dato nuovo: tutto viene da `cards.ts`, dai mazzi
 * pubblicati e dai testi.
 * Dove compare una patch si usa `patchLabel`, mai l'id (CLAUDE.md).
 * Funzioni pure (a parte `formatDate`, che usa Intl): test in `cardPage.test.ts`.
 */

/** Un pezzo di frase: testo, una carta (diventa il link alla sua scheda) o una pagina (percorso senza lingua). */
export type Part = string | { card: string; text: string } | { path: string; text: string };

/** Il testo di una frase fatta di pezzi, senza link: per i test, per il JSON-LD e per chi deve contare i caratteri. */
export function partsText(parts: readonly Part[]): string {
  return parts.map((p) => (typeof p === "string" ? p : p.text)).join("");
}

/** I campi della carta che servono alle frasi. */
export type LeadCard = Pick<Card, "slug" | "name" | "type" | "status" | "legendary" | "mana" | "power" | "health" | "alignment" | "formerName" | "history">;

/** Conto dei mazzi pubblicati: in quanti c'è la carta (`n`) su quanti (`total`). */
export type DeckCount = { n: number; total: number };

/** Una carta spesso nello stesso mazzo (`companions` di cardSynergy.ts), con nome e tipo per le frasi. */
export type BriefCompanion = { card: Pick<Card, "slug" | "name" | "legendary">; together: number };

/** I fatti che la scheda passa alle frasi, oltre alla carta. */
export type CardFacts = {
  /** assente se la lettura dei mazzi non è riuscita: allora le frasi non dicono niente sui mazzi, invece di dire zero */
  decks?: DeckCount;
  /** carte presenti in almeno 2 dei mazzi della carta (solo carte della collezione): la terza domanda di "In breve" */
  companions?: readonly BriefCompanion[];
  /** chi genera la carta, a ritroso (`creationChain`), solo per le carte create */
  createdBy: readonly RelCard[][];
  /** carte non più nel gioco che la generavano (`earlierCreators`) */
  createdByEarlier: readonly RelCard[];
  /** che cosa genera (`createdChain`) */
  creates: readonly RelCard[][];
};

// ---------- Aiuti di lingua ----------

const cardRef = (c: { slug: string; name: string }): Part => ({ card: c.slug, text: c.name });

/**
 * Elenco con virgole e congiunzione finale ("A, B and C"), fatto di pezzi. Un elemento può essere un gruppo di pezzi
 * ("Koschei (in 2 su 3)"): la congiunzione guarda il primo.
 */
function listParts(items: readonly (Part | readonly Part[])[], and: (next: string) => string): Part[] {
  const out: Part[] = [];
  items.forEach((item, i) => {
    const group = (Array.isArray(item) ? item : [item]) as readonly Part[];
    if (i > 0) out.push(i === items.length - 1 ? and(partsText(group.slice(0, 1))) : ", ");
    out.push(...group);
  });
  return out;
}

const andWord: Record<Locale, (next: string) => string> = {
  en: () => " and ",
  it: () => " e ",
  // "y" diventa "e" davanti a un suono "i" ("e Imhotep"), non davanti a "hie-" / "ya"
  es: (next) => (/^h?i(?![aeiouáéíóú])/i.test(next) ? " e " : " y "),
  fr: () => " et ",
  pt: () => " e ",
  de: () => " und ",
  ru: () => " и ",
};

const orWord: Record<Locale, (next: string) => string> = {
  en: () => " or ",
  it: () => " o ",
  // "o" diventa "u" davanti a un suono "o" ("u Old MacDonald")
  es: (next) => (/^h?o/i.test(next) ? " u " : " o "),
  fr: () => " ou ",
  pt: () => " ou ",
  de: () => " oder ",
  ru: () => " или ",
};

/** Le carte come pezzi, unite con "e": Animate Object and Sorcerer's Apprentice. */
export function cardList(cards: readonly { slug: string; name: string }[], locale: Locale, or = false): Part[] {
  return listParts(cards.map(cardRef), (or ? orWord : andWord)[locale]);
}

/**
 * Articolo determinativo plurale davanti a un numero in cifre: "dei 16", ma "degli 11" e "degli 8" (si legge undici,
 * otto). Vale per 8…, 11, 11.000 e così via: le cifre si leggono come parole.
 */
export function itDei(n: number): string {
  const s = String(n);
  return /^8/.test(s) || /^11(?:\d{3})*$/.test(s) ? "degli" : "dei";
}

/** Come `itDei`, con "in": "nei 16", "negli 8". */
export function itNei(n: number): string {
  return itDei(n) === "degli" ? "negli" : "nei";
}

/** Maiuscola alla prima lettera. */
function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Allineamento come sulla carta: Good, Evil, Neutral restano in inglese in tutte le lingue. */
const alignWord = { good: "Good", evil: "Evil", neutral: "Neutral" } as const;

/** In spagnolo "hechizo" è maschile: cambiano articolo, aggettivi e pronome. */
const esMasculine = (c: Pick<Card, "type">) => c.type === "spell";

/** In francese "unité" e "carte créée" sono femminili, "sort" è maschile: cambiano articolo, pronome e accordi. */
const frMasculine = (c: Pick<Card, "type">) => c.type === "spell";

/** Il pronome soggetto francese della carta: "elle" per unità e carte create, "il" per i sort. */
const frIl = (c: Pick<Card, "type">) => (frMasculine(c) ? "il" : "elle");

/** In portoghese "personagem" (come nel gioco: "um personagem Bom") e "feitiço" sono maschili, "carta criada" femminile. */
const ptMasculine = (c: Pick<Card, "type">) => c.type !== "token";

/** In tedesco "Charakter" e "Zauber" sono maschili ("er"), "erschaffene Karte" femminile ("sie"). */
const deMasculine = (c: Pick<Card, "type">) => c.type !== "token";

/** Il pronome soggetto tedesco della carta, minuscolo: "er" per Charakter e Zauber, "sie" per le carte create. */
const deEr = (c: Pick<Card, "type">) => (deMasculine(c) ? "er" : "sie");

/**
 * In russo il numero regge il caso: "из 16 опубликованных на OriginsMeta колод", ma "из 21 опубликованной на OriginsMeta
 * колоды" (1, 21, 31… tranne 11, 111…). Serve alla frase sui mazzi pubblicati.
 */
function ruPublishedDecks(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? `${n} опубликованной на OriginsMeta колоды` : `${n} опубликованных на OriginsMeta колод`;
}

/**
 * Il nome di una patch da mostrare: `patchLabel` quando la patch è fra quelle del sito ("Demo · 21 set" per
 * demo-0921), altrimenti il valore com'è (per esempio la patch dichiarata dall'import dei dati, se non la conosciamo).
 */
function patchName(id: string, locale: Locale): string {
  return (patchOrder as readonly string[]).includes(id) ? patchLabel(id as PatchId, locale) : id;
}

// ---------- Etichette ----------

const en = {
  /** titolo delle sezioni dei mazzi: per le Leggendarie "guidati da" (SCHEDE-02, COMP-03) */
  decksLed: "Decks led by {name}",
  decksWith: "Decks with {name}",
  /** carte create: i mazzi con la carta che le genera */
  decksCreating: "Decks that create {name}",
  /** carte create: solo il conto, con il link alla sezione dei mazzi della carta che le genera */
  tokenDecksOne: "1 published deck includes {roots}.",
  tokenDecksMany: "{n} published decks include {roots}.",
  /** sotto il titolo della sezione dei mazzi: ordine e che cosa vuol dire il conto (il conto sta nella frase d'attacco) */
  decksNote: "Decks with votes first, by rating, then the newest. How often a card is played is popularity, not a win rate:",
  mostPlayed: "Most played cards",
  /** mazzi non linkati qui (pagina non indicizzabile in questa lingua, o oltre il tetto dell'elenco) */
  moreDecksOne: "1 more deck with this card is in the list of all decks.",
  moreDecksMany: "{n} more decks with this card are in the list of all decks.",
  allDecks: "All decks",
  together: "Often in the same deck",
  togetherIntroLed: "Cards found in at least {min} of the {n} decks led by {name}.",
  togetherIntro: "Cards found with {name} in at least {min} of its {n} published decks.",
  /** "{k} su {n}" accanto a ogni carta */
  togetherCount: "in {k} of {n}",
  creates: "Cards it creates",
  /** carte rimosse: al passato */
  createdPast: "Cards it created",
  createsIntro: "From its card text.",
  createsNextOne: "In turn, {name} creates",
  createsNextMany: "In turn, these create",
  howToGet: "How you get it",
  createdBy: "Created by",
  createdByNext: "which is created by",
  createdByEarlier: "In earlier builds, also by",
  noCreator: "No card text says which card creates it.",
  brief: "In brief",
  /** etichette dei testi della carta (SCHEDE-07, CARDS-14) */
  textOfficial: "Official game text",
  textEnglish: "English game text",
  /**
   * Carte create e rimosse: la collezione del gioco non le mostra, quindi il loro testo non è verificato nel gioco.
   * Dal 25/09/2026 (decisione di Pierluigi) l'etichetta dice solo questo, senza nominare da dove viene il testo.
   * `textEnglishWoo` sulle pagine italiane e spagnole (il testo inglese), `textWoo` sulla pagina inglese.
   */
  textEnglishWoo: "English text (not checked in the game)",
  textOurs: "OriginsMeta translation (game glossary)",
  textWoo: "Card text (not checked in the game)",
  textOutdated: "A later patch changed this text: see the balance history below.",
  /** riga sotto le statistiche, per le carte che la collezione del gioco non mostra (CARDS-09) */
  asOfToken: "Created card: it is not in the game's collection, so its text and stats have not been checked in the game. Balance notes come from the official patch notes.",
  asOfRemoved: "No longer in the game: last known data, as of patch {patch}; it cannot be checked in the game.",
  /** tier list della community sulla scheda (SCHEDE-11) */
  community: "Community tier list",
  communityScoreOne: "Tier {tier}: average {avg} out of 5 from 1 vote.",
  communityScore: "Tier {tier}: average {avg} out of 5 from {votes} votes.",
  communityUnranked: "No saved tier list has ranked it yet.",
  communityInvite: "Rank {name} in your own tier list: the community tier list starts at {min} lists",
  communitySoFar: " ({n} so far)",
  communityCta: "Make your tier list",
  communityOpen: "Open the community tier list",
  deckGuide: "Deck guide",
  sameSagaDemo: "Same saga in the game",
  /** carte create: al posto dell'invito al deck builder, che non le accetta (SCHEDE-04) */
  buildRoot: "Build a deck with {roots}",
  buildRootText: "{name} is a created card and cannot be added to a deck in the deck builder: to see it in a match, put {roots} in your deck.",
  legendaryPower: "Legendary power",
  /** alt della carta ufficiale (CARDS-16): nome, tipo, gioco, illustratore e diritti */
  alt: "{name}, {kind}: official Origins TCG card, art by {illus}, © Koin Games",
  altNoCredit: "{name}, {kind}: official Origins TCG card, © Koin Games",
  kind: { unit: "unit", spell: "spell", token: "created card", legendaryUnit: "Legendary unit", legendarySpell: "Legendary spell" },
  creditText: "Art by {illus} · © Koin Games",
};

export type CardLabels = typeof en;

export const cardLabels: Record<Locale, CardLabels> = {
  en,
  it: {
    decksLed: "Mazzi guidati da {name}",
    decksWith: "Mazzi con {name}",
    decksCreating: "Mazzi che generano {name}",
    tokenDecksOne: "Un mazzo pubblicato contiene {roots}.",
    tokenDecksMany: "{n} mazzi pubblicati contengono {roots}.",
    decksNote: "Prima i mazzi votati, dal voto più alto, poi i più recenti. Quanto è giocata una carta dice la sua popolarità, non un win rate:",
    mostPlayed: "Le più giocate",
    moreDecksOne: "Un altro mazzo con questa carta è nell'elenco di tutti i mazzi.",
    moreDecksMany: "Altri {n} mazzi con questa carta sono nell'elenco di tutti i mazzi.",
    allDecks: "Tutti i mazzi",
    together: "Spesso nello stesso mazzo",
    togetherIntroLed: "Carte presenti in almeno {min} {dei} {n} mazzi guidati da {name}.",
    // davanti a "suoi" l'articolo è sempre "dei", qualunque sia il numero ("dei suoi 8 mazzi")
    togetherIntro: "Carte presenti insieme a {name} in almeno {min} dei suoi {n} mazzi pubblicati.",
    togetherCount: "in {k} su {n}",
    creates: "Carte che genera",
    createdPast: "Carte che generava",
    createsIntro: "Dal testo della carta.",
    createsNextOne: "A sua volta {name} genera",
    createsNextMany: "A loro volta queste generano",
    howToGet: "Come si ottiene",
    createdBy: "Generata da",
    createdByNext: "a sua volta generata da",
    createdByEarlier: "Nelle build precedenti anche da",
    noCreator: "Nessun testo di carta dice quale carta la genera.",
    brief: "In breve",
    textOfficial: "Testo ufficiale del gioco",
    textEnglish: "Testo inglese del gioco",
    textEnglishWoo: "Testo inglese (non verificato nel gioco)",
    textOurs: "Traduzione di OriginsMeta (glossario del gioco)",
    textWoo: "Testo della carta (non verificato nel gioco)",
    textOutdated: "Una patch successiva ha cambiato questo testo: vedi lo storico dei bilanciamenti qui sotto.",
    asOfToken:
      "Carta generata: non è nella collezione del gioco, quindi testo e statistiche non sono stati verificati nel gioco. Le note di bilanciamento vengono dalle patch notes ufficiali.",
    asOfRemoved: "Non più nel gioco: ultimi dati noti, alla patch {patch}; non si può verificare nel gioco.",
    community: "Tier list della community",
    communityScoreOne: "Fascia {tier}: media {avg} su 5 con 1 voto.",
    communityScore: "Fascia {tier}: media {avg} su 5 con {votes} voti.",
    communityUnranked: "Nessuna tier list salvata l'ha ancora classificata.",
    communityInvite: "Classifica {name} nella tua tier list: la tier list della community parte da {min} liste",
    communitySoFar: " (per ora {n})",
    communityCta: "Crea la tua tier list",
    communityOpen: "Apri la tier list della community",
    deckGuide: "Guida al mazzo",
    sameSagaDemo: "Stessa saga nel gioco",
    buildRoot: "Costruisci un mazzo con {roots}",
    buildRootText: "{name} è una carta generata e non si può mettere nel mazzo con il deck builder: per vederla in partita, metti {roots} nel tuo mazzo.",
    legendaryPower: "Potere leggendario",
    alt: "{name}, {kind}: carta ufficiale di Origins TCG, illustrazione di {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: carta ufficiale di Origins TCG, © Koin Games",
    kind: { unit: "unità", spell: "magia", token: "carta generata", legendaryUnit: "unità Leggendaria", legendarySpell: "magia Leggendaria" },
    creditText: "Illustrazione di {illus} · © Koin Games",
  },
  es: {
    decksLed: "Mazos liderados por {name}",
    decksWith: "Mazos con {name}",
    decksCreating: "Mazos que crean {name}",
    tokenDecksOne: "Un mazo publicado incluye {roots}.",
    tokenDecksMany: "{n} mazos publicados incluyen {roots}.",
    decksNote: "Primero los mazos votados, de mayor a menor valoración, y luego los más recientes. Cuánto se juega una carta indica su popularidad, no un win rate:",
    mostPlayed: "Las más jugadas",
    moreDecksOne: "Otro mazo con esta carta está en la lista de todos los mazos.",
    moreDecksMany: "Otros {n} mazos con esta carta están en la lista de todos los mazos.",
    allDecks: "Todos los mazos",
    together: "A menudo en el mismo mazo",
    togetherIntroLed: "Cartas que están en al menos {min} de los {n} mazos liderados por {name}.",
    togetherIntro: "Cartas que están con {name} en al menos {min} de sus {n} mazos publicados.",
    togetherCount: "en {k} de {n}",
    creates: "Cartas que crea",
    createdPast: "Cartas que creaba",
    createsIntro: "Según el texto de la carta.",
    createsNextOne: "A su vez, {name} crea",
    createsNextMany: "A su vez, estas crean",
    howToGet: "Cómo se obtiene",
    createdBy: "Creada por",
    createdByNext: "a su vez creada por",
    createdByEarlier: "En builds anteriores, también por",
    noCreator: "Ningún texto de carta dice qué carta la crea.",
    brief: "En resumen",
    textOfficial: "Texto oficial del juego",
    textEnglish: "Texto en inglés del juego",
    textEnglishWoo: "Texto en inglés (no verificado en el juego)",
    textOurs: "Traducción de OriginsMeta (glosario del juego)",
    textWoo: "Texto de la carta (no verificado en el juego)",
    textOutdated: "Un parche posterior cambió este texto: mira el historial de cambios de equilibrio más abajo.",
    asOfToken:
      "Carta creada: no está en la colección del juego, así que su texto y sus estadísticas no se han verificado en el juego. Los cambios de equilibrio vienen de las notas oficiales de los parches.",
    asOfRemoved: "Ya no está en el juego: últimos datos conocidos, del parche {patch}; no se puede verificar en el juego.",
    community: "Tier list de la comunidad",
    communityScoreOne: "Tier {tier}: promedio de {avg} sobre 5 con 1 voto.",
    communityScore: "Tier {tier}: promedio de {avg} sobre 5 con {votes} votos.",
    communityUnranked: "Ninguna tier list guardada la ha clasificado todavía.",
    communityInvite: "Clasifica {name} en tu tier list: la tier list de la comunidad empieza con {min} listas",
    communitySoFar: " ({n} por ahora)",
    communityCta: "Crea tu tier list",
    communityOpen: "Abre la tier list de la comunidad",
    deckGuide: "Guía del mazo",
    sameSagaDemo: "Misma saga en el juego",
    buildRoot: "Construye un mazo con {roots}",
    buildRootText: "{name} es una carta creada y no se puede añadir a un mazo en el deck builder: para verla en la partida, pon {roots} en tu mazo.",
    legendaryPower: "Poder legendario",
    alt: "{name}, {kind}: carta oficial de Origins TCG, ilustración de {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: carta oficial de Origins TCG, © Koin Games",
    kind: { unit: "unidad", spell: "hechizo", token: "carta creada", legendaryUnit: "unidad Legendaria", legendarySpell: "hechizo Legendario" },
    creditText: "Ilustración de {illus} · © Koin Games",
  },
  fr: {
    decksLed: "Decks menés par {name}",
    decksWith: "Decks avec {name}",
    decksCreating: "Decks qui créent {name}",
    tokenDecksOne: "Un deck publié contient {roots}.",
    tokenDecksMany: "{n} decks publiés contiennent {roots}.",
    decksNote: "D'abord les decks votés, de la meilleure note à la moins bonne, puis les plus récents. La fréquence à laquelle une carte est jouée mesure sa popularité, pas un win rate\u00a0:",
    mostPlayed: "Les plus jouées",
    moreDecksOne: "Un autre deck avec cette carte se trouve dans la liste de tous les decks.",
    moreDecksMany: "{n} autres decks avec cette carte se trouvent dans la liste de tous les decks.",
    allDecks: "Tous les decks",
    together: "Souvent dans le même deck",
    togetherIntroLed: "Cartes présentes dans au moins {min} des {n} decks menés par {name}.",
    togetherIntro: "Cartes présentes avec {name} dans au moins {min} de ses {n} decks publiés.",
    togetherCount: "dans {k} sur {n}",
    // il soggetto è "la carte", femminile qualunque sia il tipo
    creates: "Cartes qu'elle crée",
    createdPast: "Cartes qu'elle créait",
    createsIntro: "D'après le texte de la carte.",
    createsNextOne: "À son tour, {name} crée",
    createsNextMany: "À leur tour, celles-ci créent",
    howToGet: "Comment l'obtenir",
    createdBy: "Créée par",
    createdByNext: "elle-même créée par",
    createdByEarlier: "Dans les builds précédentes, aussi par",
    noCreator: "Aucun texte de carte ne dit quelle carte la crée.",
    brief: "En bref",
    textOfficial: "Texte officiel du jeu",
    textEnglish: "Texte anglais du jeu",
    textEnglishWoo: "Texte anglais (non vérifié dans le jeu)",
    textOurs: "Traduction d'OriginsMeta (glossaire du jeu)",
    textWoo: "Texte de la carte (non vérifié dans le jeu)",
    textOutdated: "Un patch ultérieur a modifié ce texte\u00a0: voir l'historique des équilibrages ci-dessous.",
    asOfToken:
      "Carte créée\u00a0: elle n'est pas dans la collection du jeu, donc son texte et ses statistiques n'ont pas été vérifiés dans le jeu. Les notes d'équilibrage viennent des notes de patch officielles.",
    asOfRemoved: "Retirée du jeu\u00a0: dernières données connues, au patch {patch}\u00a0; impossible à vérifier dans le jeu.",
    community: "Tier list de la communauté",
    communityScoreOne: "Tier {tier}\u00a0: moyenne de {avg} sur 5 avec 1 vote.",
    communityScore: "Tier {tier}\u00a0: moyenne de {avg} sur 5 avec {votes} votes.",
    communityUnranked: "Aucune tier list enregistrée ne l'a encore classée.",
    communityInvite: "Classez {name} dans votre tier list\u00a0: la tier list de la communauté démarre à {min} listes",
    communitySoFar: " ({n} pour l'instant)",
    communityCta: "Créez votre tier list",
    communityOpen: "Ouvrir la tier list de la communauté",
    deckGuide: "Guide du deck",
    sameSagaDemo: "Même saga dans le jeu",
    buildRoot: "Construisez un deck avec {roots}",
    buildRootText: "{name} est une carte créée et ne peut pas être ajoutée à un deck dans le deck builder\u00a0: pour la voir en jeu, mettez {roots} dans votre deck.",
    legendaryPower: "Pouvoir légendaire",
    alt: "{name}, {kind}\u00a0: carte officielle d'Origins TCG, illustration de {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}\u00a0: carte officielle d'Origins TCG, © Koin Games",
    kind: { unit: "unité", spell: "sort", token: "carte créée", legendaryUnit: "unité Légendaire", legendarySpell: "sort Légendaire" },
    creditText: "Illustration de {illus} · © Koin Games",
  },
  pt: {
    decksLed: "Decks liderados por {name}",
    decksWith: "Decks com {name}",
    decksCreating: "Decks que criam {name}",
    tokenDecksOne: "Um deck publicado inclui {roots}.",
    tokenDecksMany: "{n} decks publicados incluem {roots}.",
    decksNote: "Primeiro os decks votados, da nota mais alta para a mais baixa, depois os mais recentes. A frequência com que uma carta é jogada mostra a popularidade dela, não um win rate:",
    mostPlayed: "As mais jogadas",
    moreDecksOne: "Mais um deck com esta carta está na lista de todos os decks.",
    moreDecksMany: "Mais {n} decks com esta carta estão na lista de todos os decks.",
    allDecks: "Todos os decks",
    together: "Muitas vezes no mesmo deck",
    togetherIntroLed: "Cartas presentes em pelo menos {min} dos {n} decks liderados por {name}.",
    togetherIntro: "Cartas presentes com {name} em pelo menos {min} dos seus {n} decks publicados.",
    togetherCount: "em {k} de {n}",
    creates: "Cartas que cria",
    createdPast: "Cartas que criava",
    createsIntro: "Segundo o texto da carta.",
    createsNextOne: "Por sua vez, {name} cria",
    createsNextMany: "Por sua vez, estas criam",
    howToGet: "Como conseguir",
    createdBy: "Criada por",
    createdByNext: "por sua vez criada por",
    createdByEarlier: "Em builds anteriores, também por",
    noCreator: "Nenhum texto de carta diz qual carta a cria.",
    brief: "Em resumo",
    textOfficial: "Texto oficial do jogo",
    textEnglish: "Texto em inglês do jogo",
    textEnglishWoo: "Texto em inglês (não verificado no jogo)",
    textOurs: "Tradução do OriginsMeta (glossário do jogo)",
    textWoo: "Texto da carta (não verificado no jogo)",
    textOutdated: "Um patch posterior mudou este texto: veja o histórico de balanceamento abaixo.",
    asOfToken:
      "Carta criada: não está na coleção do jogo, então o texto e as estatísticas dela não foram verificados no jogo. As notas de balanceamento vêm das notas de patch oficiais.",
    asOfRemoved: "Não está mais no jogo: últimos dados conhecidos, do patch {patch}; não é possível verificar no jogo.",
    community: "Tier list da comunidade",
    communityScoreOne: "Tier {tier}: média de {avg} de 5 com 1 voto.",
    communityScore: "Tier {tier}: média de {avg} de 5 com {votes} votos.",
    communityUnranked: "Nenhuma tier list salva a classificou ainda.",
    communityInvite: "Classifique {name} na sua tier list: a tier list da comunidade começa com {min} listas",
    communitySoFar: " ({n} até agora)",
    communityCta: "Crie a sua tier list",
    communityOpen: "Abrir a tier list da comunidade",
    deckGuide: "Guia do deck",
    sameSagaDemo: "Mesma saga no jogo",
    buildRoot: "Monte um deck com {roots}",
    buildRootText: "{name} é uma carta criada e não pode ser adicionada a um deck no deck builder: para vê-la em uma partida, coloque {roots} no seu deck.",
    legendaryPower: "Poder lendário",
    alt: "{name}, {kind}: carta oficial de Origins TCG, ilustração de {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: carta oficial de Origins TCG, © Koin Games",
    kind: { unit: "personagem", spell: "feitiço", token: "carta criada", legendaryUnit: "personagem Lendário", legendarySpell: "feitiço Lendário" },
    creditText: "Ilustração de {illus} · © Koin Games",
  },
  // Tedesco (20/10/2026): glossario del gioco di docs/tedesco.md; "Deckbuilder" nel testo corrente. I testi delle carte
  // della collezione sono quelli del gioco (`de` è in `officialTextLocales` dal 20/10/2026); `textOurs` resta per carte
  // create e rimosse, come nelle altre lingue.
  de: {
    decksLed: "Von {name} angeführte Decks",
    decksWith: "Decks mit {name}",
    decksCreating: "Decks, die {name} erschaffen",
    tokenDecksOne: "1 veröffentlichtes Deck enthält {roots}.",
    tokenDecksMany: "{n} veröffentlichte Decks enthalten {roots}.",
    decksNote: "Zuerst die bewerteten Decks, nach Bewertung sortiert, dann die neuesten. Wie oft eine Karte gespielt wird, zeigt ihre Beliebtheit, keine Win-Rate:",
    mostPlayed: "Meistgespielt",
    moreDecksOne: "1 weiteres Deck mit dieser Karte steht in der Liste aller Decks.",
    moreDecksMany: "{n} weitere Decks mit dieser Karte stehen in der Liste aller Decks.",
    allDecks: "Alle Decks",
    together: "Oft im selben Deck",
    togetherIntroLed: "Karten in mindestens {min} der {n} von {name} angeführten Decks.",
    togetherIntro: "Karten, die in mindestens {min} der {n} veröffentlichten Decks mit {name} stecken.",
    togetherCount: "in {k} von {n}",
    // Subjekt ist „die Karte“, weiblich, egal welcher Typ
    creates: "Karten, die sie erschafft",
    createdPast: "Karten, die sie erschuf",
    createsIntro: "Laut Kartentext.",
    createsNextOne: "{name} erschafft wiederum",
    createsNextMany: "Diese erschaffen wiederum",
    howToGet: "So bekommst du sie",
    createdBy: "Erschaffen von",
    createdByNext: "ihrerseits erschaffen von",
    createdByEarlier: "In früheren Builds auch von",
    noCreator: "Kein Kartentext sagt, welche Karte sie erschafft.",
    brief: "Kurz gesagt",
    textOfficial: "Offizieller Spieltext",
    textEnglish: "Englischer Spieltext",
    textEnglishWoo: "Englischer Text (nicht im Spiel überprüft)",
    textOurs: "Übersetzung von OriginsMeta (Glossar des Spiels)",
    textWoo: "Kartentext (nicht im Spiel überprüft)",
    textOutdated: "Ein späterer Patch hat diesen Text geändert: siehe den Balance-Verlauf weiter unten.",
    asOfToken:
      "Erschaffene Karte: Sie ist nicht in der Sammlung des Spiels, deshalb wurden ihr Text und ihre Werte nicht im Spiel überprüft. Die Balance-Hinweise stammen aus den offiziellen Patchnotes.",
    asOfRemoved: "Nicht mehr im Spiel: zuletzt bekannte Daten, Stand Patch {patch}; im Spiel nicht überprüfbar.",
    community: "Tier-List der Community",
    communityScoreOne: "Tier {tier}: Durchschnitt {avg} von 5 aus 1 Stimme.",
    communityScore: "Tier {tier}: Durchschnitt {avg} von 5 aus {votes} Stimmen.",
    communityUnranked: "Noch keine gespeicherte Tier-List hat sie eingestuft.",
    communityInvite: "Stufe {name} in deiner eigenen Tier-List ein: Die Tier-List der Community startet ab {min} Listen",
    communitySoFar: " (bisher {n})",
    communityCta: "Erstelle deine Tier-List",
    communityOpen: "Tier-List der Community öffnen",
    deckGuide: "Deck-Guide",
    sameSagaDemo: "Gleiche Saga im Spiel",
    buildRoot: "Baue ein Deck mit {roots}",
    buildRootText: "{name} ist eine erschaffene Karte und lässt sich im Deckbuilder nicht in ein Deck aufnehmen: Um sie im Match zu sehen, nimm {roots} in dein Deck.",
    legendaryPower: "Legendäre Kraft",
    alt: "{name}, {kind}: offizielle Karte aus Origins TCG, Illustration von {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: offizielle Karte aus Origins TCG, © Koin Games",
    kind: { unit: "Charakter", spell: "Zauber", token: "erschaffene Karte", legendaryUnit: "Legendärer Charakter", legendarySpell: "Legendärer Zauber" },
    creditText: "Illustration von {illus} · © Koin Games",
  },
  // Russo (20/10/2026): glossario del gioco di docs/russo.md (персонаж/заклинание/созданная карта, Сила/Здоровье,
  // Легендарная), «вы» minuscolo, «конструктор колод». I testi delle carte della collezione sono quelli del gioco
  // (`ru` è in `officialTextLocales` dal 20/10/2026, letti la notte stessa); `textOurs` resta per carte create e
  // rimosse, come nelle altre lingue.
  ru: {
    decksLed: "Колоды во главе с {name}",
    decksWith: "Колоды с {name}",
    decksCreating: "Колоды, которые создают {name}",
    tokenDecksOne: "{roots} есть в 1 опубликованной колоде.",
    tokenDecksMany: "{roots} есть в опубликованных колодах: {n}.",
    decksNote: "Сначала колоды с оценками, от лучших к худшим, затем самые новые. Как часто играют карту, говорит о её популярности, а не о win rate:",
    mostPlayed: "Чаще всего играют",
    moreDecksOne: "Ещё 1 колода с этой картой есть в списке всех колод.",
    moreDecksMany: "Другие колоды с этой картой (ещё {n}) есть в списке всех колод.",
    allDecks: "Все колоды",
    together: "Часто в одной колоде",
    togetherIntroLed: "Карты, которые есть как минимум в {min} из {n} колод во главе с {name}.",
    togetherIntro: "Карты, которые есть вместе с {name} как минимум в {min} из {n} опубликованных колод.",
    togetherCount: "в {k} из {n}",
    // il soggetto è «карта», femminile, qualunque sia il tipo
    creates: "Карты, которые она создаёт",
    createdPast: "Карты, которые она создавала",
    createsIntro: "По тексту карты.",
    createsNextOne: "{name}, в свою очередь, создаёт",
    createsNextMany: "Они, в свою очередь, создают",
    howToGet: "Как её получить",
    createdBy: "Кто её создаёт",
    createdByNext: "которую, в свою очередь, создаёт",
    createdByEarlier: "В прежних сборках также",
    noCreator: "Ни один текст карты не говорит, какая карта её создаёт.",
    brief: "Коротко",
    textOfficial: "Официальный текст игры",
    textEnglish: "Английский текст игры",
    textEnglishWoo: "Английский текст (не проверен в игре)",
    textOurs: "Перевод OriginsMeta (глоссарий игры)",
    textWoo: "Текст карты (не проверен в игре)",
    textOutdated: "Более поздний патч изменил этот текст: см. историю баланса ниже.",
    asOfToken:
      "Созданная карта: её нет в коллекции игры, поэтому её текст и характеристики не проверены в игре. Изменения баланса взяты из официальных патчноутов.",
    asOfRemoved: "Больше нет в игре: последние известные данные, по патчу {patch}; проверить в игре нельзя.",
    community: "Тир-лист сообщества",
    communityScoreOne: "Тир {tier}: в среднем {avg} из 5, 1 голос.",
    communityScore: "Тир {tier}: в среднем {avg} из 5, голосов: {votes}.",
    communityUnranked: "Ни один сохранённый тир-лист её пока не оценил.",
    communityInvite: "Оцените {name} в своём тир-листе: тир-лист сообщества начинается с {min} списков",
    communitySoFar: " (пока {n})",
    communityCta: "Создайте свой тир-лист",
    communityOpen: "Открыть тир-лист сообщества",
    deckGuide: "Гайд по колоде",
    sameSagaDemo: "Та же сага в игре",
    buildRoot: "Соберите колоду с {roots}",
    buildRootText: "{name} — созданная карта, её нельзя добавить в колоду в конструкторе колод: чтобы увидеть её в матче, положите в колоду {roots}.",
    legendaryPower: "Легендарная сила",
    alt: "{name}, {kind}: официальная карта Origins TCG, иллюстрация: {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: официальная карта Origins TCG, © Koin Games",
    kind: { unit: "персонаж", spell: "заклинание", token: "созданная карта", legendaryUnit: "Легендарный персонаж", legendarySpell: "Легендарное заклинание" },
    creditText: "Иллюстрация: {illus} · © Koin Games",
  },
};

/** Sostituisce i segnaposto {chiave} di un'etichetta. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/**
 * Un'etichetta con segnaposto che diventano pezzi (carte, elenchi di carte): "Build a deck with {roots}" con i link.
 * I segnaposto di testo semplice si passano come stringhe.
 */
export function fillParts(template: string, values: Record<string, string | number | Part | readonly Part[]>): Part[] {
  const out: Part[] = [];
  let last = 0;
  for (const m of template.matchAll(/\{(\w+)\}/g)) {
    out.push(template.slice(last, m.index));
    const v = values[m[1]];
    if (v === undefined) out.push(m[0]);
    else if (Array.isArray(v)) out.push(...(v as Part[]));
    else out.push(typeof v === "number" ? String(v) : (v as Part));
    last = m.index + m[0].length;
  }
  out.push(template.slice(last));
  return out.filter((p) => p !== "");
}

/** Tipo della carta in parole, per l'alt e le frasi: "unità Leggendaria", "hechizo", "carta creada". */
export function kindWord(card: Pick<Card, "type" | "legendary">, locale: Locale): string {
  const k = cardLabels[locale].kind;
  if (card.type === "token") return k.token;
  if (card.legendary) return card.type === "spell" ? k.legendarySpell : k.legendaryUnit;
  return card.type === "spell" ? k.spell : k.unit;
}

/**
 * Alt della carta ufficiale (CARDS-16): "Merlin, unità Leggendaria: carta ufficiale di Origins TCG, illustrazione di
 * Don Flores, © Koin Games". L'illustratore è quello stampato sulla carta (`credit.illus`).
 */
export function cardImageAlt(card: Pick<Card, "name" | "type" | "legendary" | "credit">, locale: Locale): string {
  const l = cardLabels[locale];
  const illus = card.credit?.illus;
  return fill(illus ? l.alt : l.altNoCredit, { name: card.name, kind: kindWord(card, locale), illus: illus ?? "" });
}

/**
 * Misure della carta ufficiale intera (`/cards/<slug>.webp`), da `card-art.json`, che le ha scritte `npm run import:art`
 * convertendo i file (480×690, 480×660 o 480×650). Servono a og:image:width/height, che Discord usa per impaginare
 * l'anteprima, e all'ImageObject del JSON-LD. Prima si leggevano dal file con `imageSizeOf`: con la scheda in ISR la
 * rigenerazione gira su Vercel, dove la funzione non ha `public/`, e dopo la prima le misure sparivano.
 */
export function cardImageSize(card: Pick<Card, "key" | "image">): { width: number; height: number } | undefined {
  if (!card.key || !card.image) return undefined;
  const art = (cardArt.art as Record<string, { w?: number; h?: number }>)[card.key];
  return art?.w && art.h ? { width: art.w, height: art.h } : undefined;
}

// ---------- Frase d'attacco ----------

type Tense = "present" | "past";

/** "Costa 5 mana, ha 5 di Potenza e 5 di Salute ed è Neutral." (o al passato, per le carte rimosse). */
function statsClause(card: LeadCard, locale: Locale, tense: Tense): string {
  const { mana: m, power: p, health: h } = card;
  const align = card.alignment ? alignWord[card.alignment] : undefined;
  const past = tense === "past";
  const clauses: string[] = [];
  if (locale === "it") {
    if (m !== undefined) clauses.push(`${past ? "costava" : "costa"} ${m} mana`);
    if (p !== undefined) clauses.push(`${past ? "aveva" : "ha"} ${p} di Potenza e ${h ?? "?"} di Salute`);
    if (align) clauses.push(`${past ? "era" : "è"} ${align}`);
    // "e" davanti a "è" / "era" diventa "ed"
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} ${/^[eè]/.test(c) ? "ed" : "e"} ${c}` : `${acc}, ${c}`), "");
  }
  if (locale === "es") {
    if (m !== undefined) clauses.push(`${past ? "costaba" : "cuesta"} ${m} de maná`);
    if (p !== undefined) clauses.push(`${past ? "tenía" : "tiene"} ${p} de Poder y ${h ?? "?"} de Salud`);
    if (align) clauses.push(`${past ? "era" : "es"} ${align}`);
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} y ${c}` : `${acc}, ${c}`), "");
  }
  if (locale === "fr") {
    if (m !== undefined) clauses.push(`${past ? "coûtait" : "coûte"} ${m} mana`);
    if (p !== undefined) clauses.push(`${past ? "avait" : "a"} ${p} de Puissance et ${h ?? "?"} de Santé`);
    if (align) clauses.push(`${past ? "était" : "est"} ${align}`);
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} et ${c}` : `${acc}, ${c}`), "");
  }
  if (locale === "pt") {
    if (m !== undefined) clauses.push(`${past ? "custava" : "custa"} ${m} de mana`);
    if (p !== undefined) clauses.push(`${past ? "tinha" : "tem"} ${p} de Poder e ${h ?? "?"} de Vida`);
    if (align) clauses.push(`${past ? "era" : "é"} ${align}`);
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} e ${c}` : `${acc}, ${c}`), "");
  }
  if (locale === "de") {
    if (m !== undefined) clauses.push(`${past ? "kostete" : "kostet"} ${m} Mana`);
    if (p !== undefined) clauses.push(`${past ? "hatte" : "hat"} ${p} Kraft und ${h ?? "?"} Leben`);
    if (align) clauses.push(`${past ? "war" : "ist"} ${align}`);
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} und ${c}` : `${acc}, ${c}`), "");
  }
  if (locale === "ru") {
    // soggetto sottinteso «карта» (femminile: "стоила", "имела"); Сила e Здоровье prima del numero, così non si declinano
    if (m !== undefined) clauses.push(`${past ? "стоила" : "стоит"} ${m} ед. маны`);
    if (p !== undefined) clauses.push(`${past ? "имела" : "имеет"} Силу ${p} и Здоровье ${h ?? "?"}`);
    if (align) clauses.push(`мировоззрение — ${align}`);
    return clauses.join(", ");
  }
  if (m !== undefined) clauses.push(`${past ? "cost" : "costs"} ${m} mana`);
  if (p !== undefined) clauses.push(`${past ? "had" : "has"} ${p} Power and ${h ?? "?"} Health`);
  if (align) clauses.push(`${past ? "was" : "is"} ${align}`);
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc}, and ${c}` : `${acc}, ${c}`), "");
}

/**
 * Frase delle statistiche, con il soggetto: "It costs…", "Costa…", "Cuesta…", "Elle coûte…" (il francese vuole il
 * pronome, nel genere della carta); "" se la carta non ha statistiche.
 */
function statsSentence(card: LeadCard, locale: Locale): string {
  const c = statsClause(card, locale, "present");
  if (!c) return "";
  if (locale === "en") return `It ${c}.`;
  if (locale === "fr") return `${cap(frIl(card))} ${c}.`;
  if (locale === "de") return `${cap(deEr(card))} ${c}.`;
  return `${cap(c)}.`;
}

/** "unità Leggendaria" con l'articolo: "un'unità Leggendaria", "un hechizo Legendario", "un sort Légendaire", "a Legendary unit". */
function withArticle(card: Pick<Card, "type" | "legendary">, locale: Locale): string {
  const word = kindWord(card, locale);
  if (locale === "it") return card.type === "unit" ? `un'${word}` : `una ${word}`;
  if (locale === "es") return esMasculine(card) ? `un ${word}` : `una ${word}`;
  if (locale === "fr") return frMasculine(card) ? `un ${word}` : `une ${word}`;
  if (locale === "pt") return ptMasculine(card) ? `um ${word}` : `uma ${word}`;
  if (locale === "de") return deMasculine(card) ? `ein ${word}` : `eine ${word}`;
  // il russo non ha articoli
  if (locale === "ru") return word;
  return `${/^[aeio]/i.test(word) ? "an" : "a"} ${word}`;
}

const gameName: Record<Locale, string> = {
  en: "Origins TCG, the digital card game by Koin Games",
  it: "Origins TCG, il gioco di carte digitale di Koin Games",
  es: "Origins TCG, el juego de cartas digital de Koin Games",
  fr: "Origins TCG, le jeu de cartes numérique de Koin Games",
  pt: "Origins TCG, o jogo de cartas digital da Koin Games",
  // al dativo: si usa sempre dopo "aus" e "von"
  de: "Origins TCG, dem digitalen Kartenspiel von Koin Games",
  // al genitivo: si usa sempre dopo "из" e "сборок"
  ru: "Origins TCG, цифровой карточной игры от Koin Games",
};

/**
 * Una carta creata non si può aggiungere nel deck builder. Non si dice "non va mai in un mazzo": in partita alcune
 * finiscono proprio nel mazzo (Old MacDonald mescola le Pumpkin nel mazzo dell'avversario).
 */
const notInBuilder: Record<Locale, string> = {
  en: "it cannot be added to a deck in the deck builder",
  it: "non si può mettere nel mazzo con il deck builder",
  es: "no se puede añadir a un mazo en el deck builder",
  // "l'ajouter" non si accorda: vale per unità, sort e carte create
  fr: "impossible de l'ajouter à un deck dans le deck builder",
  // solo per le carte create: "adicionada" si accorda con "carta"
  pt: "não pode ser adicionada a um deck no deck builder",
  // frase intera con la maiuscola: sta dopo i due punti e, con `cap`, a inizio frase; "sie" è la carta creata
  de: "Im Deckbuilder lässt sie sich nicht in ein Deck aufnehmen",
  // solo per le carte create: "её" è la carta
  ru: "её нельзя добавить в колоду в конструкторе колод",
};

/**
 * Frase sui mazzi pubblicati: "Guida 1 dei 16 mazzi pubblicati su OriginsMeta.", "It appears in 9 of the 16 decks
 * published on OriginsMeta.", "Ninguno de los 16 mazos publicados en OriginsMeta la usa todavía.". Per una Leggendaria
 * conta i mazzi che guida, per una carta base quelli che la contengono, come "Le più giocate".
 */
export function deckSentence(card: Pick<Card, "type" | "legendary">, count: DeckCount, locale: Locale): string {
  const { n, total } = count;
  const leg = Boolean(card.legendary);
  if (locale === "it") {
    if (total === 0) return "Su OriginsMeta non ci sono ancora mazzi pubblicati.";
    if (total === 1 && n === 1) return leg ? "Guida l'unico mazzo pubblicato su OriginsMeta." : "È nell'unico mazzo pubblicato su OriginsMeta.";
    if (total === 1) return leg ? "L'unico mazzo pubblicato su OriginsMeta è guidato da un'altra Leggendaria." : "L'unico mazzo pubblicato su OriginsMeta non la usa.";
    if (n === 0) return `Nessuno ${itDei(total)} ${total} mazzi pubblicati su OriginsMeta la usa ancora${leg ? " come Leggendaria" : ""}.`;
    return `${leg ? "Guida" : "È in"} ${n} ${itDei(total)} ${total} mazzi pubblicati su OriginsMeta.`;
  }
  if (locale === "es") {
    const pron = esMasculine(card) ? "lo" : "la";
    if (total === 0) return "Todavía no hay mazos publicados en OriginsMeta.";
    if (total === 1 && n === 1) return leg ? "Lidera el único mazo publicado en OriginsMeta." : "Está en el único mazo publicado en OriginsMeta.";
    if (total === 1) return leg ? "El único mazo publicado en OriginsMeta lo lidera otra Legendaria." : `El único mazo publicado en OriginsMeta no ${pron} usa.`;
    if (n === 0) return `Ninguno de los ${total} mazos publicados en OriginsMeta ${pron} usa todavía${leg ? " como Legendaria" : ""}.`;
    return `${leg ? "Lidera" : "Está en"} ${n} de los ${total} mazos publicados en OriginsMeta.`;
  }
  if (locale === "fr") {
    // "l'utilise" non si accorda; il pronome soggetto sì ("Il mène" per un sort Légendaire)
    const pron = cap(frIl(card));
    if (total === 0) return "Il n'y a pas encore de deck publié sur OriginsMeta.";
    if (total === 1 && n === 1) return leg ? `${pron} mène le seul deck publié sur OriginsMeta.` : `${pron} est dans le seul deck publié sur OriginsMeta.`;
    if (total === 1) return leg ? "Le seul deck publié sur OriginsMeta est mené par une autre Légendaire." : "Le seul deck publié sur OriginsMeta ne l'utilise pas.";
    if (n === 0) return `Aucun des ${total} decks publiés sur OriginsMeta ne l'utilise encore${leg ? " comme Légendaire" : ""}.`;
    return `${pron} ${leg ? "mène" : "est dans"} ${n} des ${total} decks publiés sur OriginsMeta.`;
  }
  if (locale === "pt") {
    // soggetto sottinteso; "esta carta" invece del pronome, che cambierebbe con il tipo
    if (total === 0) return "Ainda não há decks publicados no OriginsMeta.";
    if (total === 1 && n === 1) return leg ? "Lidera o único deck publicado no OriginsMeta." : "Está no único deck publicado no OriginsMeta.";
    if (total === 1) return leg ? "O único deck publicado no OriginsMeta é liderado por outra Lendária." : "O único deck publicado no OriginsMeta não usa esta carta.";
    if (n === 0) return `Nenhum dos ${total} decks publicados no OriginsMeta usa esta carta${leg ? " como Lendária" : ""} ainda.`;
    return `${leg ? "Lidera" : "Está em"} ${n} dos ${total} decks publicados no OriginsMeta.`;
  }
  if (locale === "de") {
    const pron = cap(deEr(card));
    if (total === 0) return "Auf OriginsMeta wurden noch keine Decks veröffentlicht.";
    if (total === 1 && n === 1) return leg ? `${pron} führt das einzige auf OriginsMeta veröffentlichte Deck an.` : `${pron} steckt im einzigen auf OriginsMeta veröffentlichten Deck.`;
    if (total === 1) return leg ? "Das einzige auf OriginsMeta veröffentlichte Deck wird von einer anderen Legendären angeführt." : "Das einzige auf OriginsMeta veröffentlichte Deck nutzt diese Karte nicht.";
    if (n === 0) return `Keines der ${total} auf OriginsMeta veröffentlichten Decks nutzt diese Karte bisher${leg ? " als Legendäre" : ""}.`;
    return leg ? `${pron} führt ${n} der ${total} auf OriginsMeta veröffentlichten Decks an.` : `${pron} steckt in ${n} der ${total} auf OriginsMeta veröffentlichten Decks.`;
  }
  if (locale === "ru") {
    // soggetto sottinteso, come in portoghese: персонаж, заклинание e карта hanno generi diversi
    if (total === 0) return "На OriginsMeta пока нет опубликованных колод.";
    if (total === 1 && n === 1) return leg ? "Возглавляет единственную колоду, опубликованную на OriginsMeta." : "Есть в единственной колоде, опубликованной на OriginsMeta.";
    if (total === 1) return leg ? "Единственную колоду, опубликованную на OriginsMeta, возглавляет другая Легендарная карта." : "Единственная колода, опубликованная на OriginsMeta, не использует эту карту.";
    if (n === 0) return `Ни одна из ${ruPublishedDecks(total)} пока не использует эту карту${leg ? " как Легендарную" : ""}.`;
    return `${leg ? "Возглавляет" : "Есть в"} ${n} из ${ruPublishedDecks(total)}.`;
  }
  if (total === 0) return "No deck has been published on OriginsMeta yet.";
  if (total === 1 && n === 1) return leg ? "It leads the only deck published on OriginsMeta." : "It appears in the only deck published on OriginsMeta.";
  if (total === 1) return leg ? "The only deck published on OriginsMeta is led by another Legendary." : "The only deck published on OriginsMeta does not use it.";
  if (n === 0) return `None of the ${total} decks published on OriginsMeta uses it${leg ? " as its Legendary" : ""} yet.`;
  return `It ${leg ? "leads" : "appears in"} ${n} of the ${total} decks published on OriginsMeta.`;
}

/** "Nelle build precedenti si chiamava Puss in Boots.": il vecchio nome è anche una ricerca (CARDS-10). */
function formerSentence(card: LeadCard, locale: Locale): string {
  if (!card.formerName) return "";
  if (locale === "it") return `Nelle build precedenti si chiamava ${card.formerName}.`;
  if (locale === "es") return `En builds anteriores se llamaba ${card.formerName}.`;
  if (locale === "fr") return `Dans les builds précédentes, ${frIl(card)} s'appelait ${card.formerName}.`;
  if (locale === "pt") return `Em builds anteriores, se chamava ${card.formerName}.`;
  if (locale === "de") return `In früheren Builds hieß ${deEr(card)} ${card.formerName}.`;
  if (locale === "ru") return `В прежних сборках карта называлась ${card.formerName}.`;
  return `In earlier builds it was called ${card.formerName}.`;
}

/** La catena di chi genera una carta creata: "Van Helsing's Tools, a sua volta generata da Van Helsing". */
function chainParts(chain: readonly RelCard[][], locale: Locale): Part[] {
  const [first, second] = chain;
  const out: Part[] = cardList(first, locale);
  // il secondo passaggio solo se il primo è una carta sola: con più carte "a sua volta" non si capirebbe di chi.
  // In francese "elle-même" si accorda con la prima carta, che per avere a sua volta chi la genera è una carta creata.
  if (first.length === 1 && second?.length) {
    const next = { en: ", which is in turn created by ", it: ", a sua volta generata da ", es: ", a su vez creada por ", fr: ", elle-même créée par ", pt: ", por sua vez criada por ", de: ", ihrerseits erschaffen von ", ru: second.length > 1 ? ", которую, в свою очередь, создают " : ", которую, в свою очередь, создаёт " }[locale];
    out.push(next, ...cardList(second, locale));
  }
  return out;
}

/** Chi genera una carta creata, in una frase dopo i due punti: "in partita la genera Van Helsing's Tools, …". */
function tokenOrigin(facts: CardFacts, locale: Locale): Part[] {
  const [first] = facts.createdBy;
  if (first?.length) {
    const many = first.length > 1;
    const verb = {
      en: ", and during a match it is created by ",
      it: many ? ", in partita la generano " : ", in partita la genera ",
      es: many ? ", durante la partida la crean " : ", durante la partida la crea ",
      // al passivo vale per una o più carte ("pendant la partie", mai "en partie", che vuol dire "in parte")
      fr: ", et pendant la partie elle est créée par ",
      // al passivo, come il francese: vale per una o più carte
      pt: ", e durante a partida é criada por ",
      // "durch" vale per una o più carte e non manda il verbo in fondo alla frase
      de: "; im Match entsteht sie durch ",
      ru: many ? "; в матче её создают " : "; в матче её создаёт ",
    }[locale];
    return [verb, ...chainParts(facts.createdBy, locale), "."];
  }
  // Nessun testo la nomina: si dice solo questo. Fino al 25/09/2026 seguiva la carta a cui la collegava il database
  // da cui importiamo i dati (campo `related`); tolta la fonte dalle pagine, quel legame non aveva più una base.
  return [
    {
      en: ". No card text says which card creates it.",
      it: ". Nessun testo di carta dice quale carta la genera.",
      es: ". Ningún texto de carta dice qué carta la crea.",
      fr: ". Aucun texte de carte ne dit quelle carte la crée.",
      pt: ". Nenhum texto de carta diz qual carta a cria.",
      de: ". Kein Kartentext sagt, welche Karte sie erschafft.",
      ru: ". Ни один текст карты не говорит, какая карта её создаёт.",
    }[locale],
  ];
}

/**
 * Una carta creata arriva in partita da una carta della collezione del gioco? Vero quando nella catena di chi la genera
 * (dai testi) c'è una carta della collezione (Garlic ← Van Helsing's Tools ← Van Helsing). Falso per le carte create
 * che nessun testo delle carte della collezione nomina (Reflection, Little Pig, Off With Your Head!): che siano nel
 * gioco lo dicono solo i dati importati, che nel gioco non si possono verificare, quindi le frasi dicono che non si può
 * sapere con certezza. Il nome della funzione viene dai tempi della demo (fino al 27/10/2026) e resta.
 */
export function createdFromDemo(facts: Pick<CardFacts, "createdBy">): boolean {
  return facts.createdBy.some((level) => level.some((c) => c.type !== "token" && c.status === "active"));
}

/** Giorno della verifica sul gioco, scritto nella lingua della pagina ("22 settembre 2026"). */
function verifiedOn(locale: Locale): string {
  return formatDate(locale, cardsVerified.date);
}

/**
 * La frase d'attacco della scheda (CARDS-05, GEO-07): quello che un assistente copia per rispondere a "che cos'è
 * Merlin in Origins TCG". Tre modelli:
 * - carte della collezione del gioco (122): tipo, gioco, statistiche, "è nella collezione del gioco (verificata il …)"
 *   e il conto dei mazzi pubblicati, se la lettura è riuscita (dal 28/10/2026 non si dice più "Demo 2.0": la demo è
 *   finita il 27/10/2026 con l'Accesso anticipato, e la verifica del 22/09/2026 resta al passato);
 * - carte create: che non si aggiungono nel deck builder e chi le genera, con la catena (Garlic ← Van Helsing's Tools
 *   ← Van Helsing), oppure che nessun testo lo dice; poi costo e statistiche;
 * - carte rimosse: prima di tutto che non sono più nel gioco e quindi non entrano nel deck builder (CARDS-09), poi
 *   che cos'erano e le ultime statistiche note, al passato.
 * Il vecchio nome, quando c'è, chiude la frase.
 */
export function cardLead(card: LeadCard, facts: CardFacts, locale: Locale): Part[] {
  const name = cardRef(card);
  const out: Part[] = [];
  const sp = (s: string) => (s ? ` ${s}` : "");

  if (card.status === "removed") {
    const head = {
      en: " is no longer in the game, so it cannot be added in the deck builder.",
      it: " non è più nel gioco, quindi non si può aggiungere nel deck builder.",
      es: " ya no está en el juego, así que no se puede añadir en el deck builder.",
      fr: " n'est plus dans le jeu\u00a0: impossible de l'ajouter dans le deck builder.",
      // "entrar em um deck": non cambia con il genere della carta
      pt: " não está mais no jogo, então não pode entrar em um deck no deck builder.",
      de: " ist nicht mehr im Spiel und lässt sich daher im Deckbuilder nicht hinzufügen.",
      ru: " больше нет в игре, поэтому эту карту нельзя добавить в конструкторе колод.",
    }[locale];
    const was = {
      en: `It was ${withArticle(card, locale)} in earlier builds of ${gameName.en}.`,
      it: `Era ${withArticle(card, locale)} delle build precedenti di ${gameName.it}.`,
      es: `Era ${withArticle(card, locale)} de las builds anteriores de ${gameName.es}.`,
      fr: `C'était ${withArticle(card, locale)} des builds précédentes d'${gameName.fr}.`,
      pt: `Era ${withArticle(card, locale)} das builds anteriores de ${gameName.pt}.`,
      de: `${cap(deEr(card))} war ${withArticle(card, locale)} aus früheren Builds von ${gameName.de}.`,
      ru: `Это ${withArticle(card, locale)} из прежних сборок ${gameName.ru}.`,
    }[locale];
    const clause = statsClause(card, locale, "past");
    const stats = clause
      ? {
          en: `Last known stats: it ${clause}.`,
          it: `Ultime statistiche note: ${clause}.`,
          es: `Últimas estadísticas conocidas: ${clause}.`,
          fr: `Dernières statistiques connues\u00a0: ${frIl(card)} ${clause}.`,
          pt: `Últimas estatísticas conhecidas: ${clause}.`,
          de: `Zuletzt bekannte Werte: ${cap(deEr(card))} ${clause}.`,
          ru: `Последние известные характеристики: ${clause}.`,
        }[locale]
      : "";
    out.push(name, head, sp(was), sp(stats), sp(formerSentence(card, locale)));
    return out.filter((p) => p !== "");
  }

  if (card.type === "token") {
    const head = {
      en: ` is a created card in ${gameName.en}: ${notInBuilder.en}`,
      it: ` è una carta generata di ${gameName.it}: ${notInBuilder.it}`,
      es: ` es una carta creada de ${gameName.es}: ${notInBuilder.es}`,
      fr: ` est une carte créée d'${gameName.fr}\u00a0: ${notInBuilder.fr}`,
      pt: ` é uma carta criada de ${gameName.pt}: ${notInBuilder.pt}`,
      de: ` ist eine erschaffene Karte aus ${gameName.de}: ${notInBuilder.de}`,
      ru: ` — созданная карта из ${gameName.ru}: ${notInBuilder.ru}`,
    }[locale];
    out.push(name, head, ...tokenOrigin(facts, locale), sp(statsSentence(card, locale)));
    return out.filter((p) => p !== "");
  }

  const is = {
    en: ` is ${withArticle(card, locale)} in ${gameName.en}.`,
    it: ` è ${withArticle(card, locale)} di ${gameName.it}.`,
    es: ` es ${withArticle(card, locale)} de ${gameName.es}.`,
    fr: ` est ${withArticle(card, locale)} d'${gameName.fr}.`,
    pt: ` é ${withArticle(card, locale)} de ${gameName.pt}.`,
    de: ` ist ${withArticle(card, locale)} aus ${gameName.de}.`,
    ru: ` — ${withArticle(card, locale)} из ${gameName.ru}.`,
  }[locale];
  // Nella collezione del gioco, con il giorno della verifica (fatta nella demo, il 22/09/2026: resta al passato)
  const inGame = {
    en: `It is a playable card (checked in the game on ${verifiedOn(locale)}).`,
    it: `È nella collezione del gioco (verificata il ${verifiedOn(locale)}).`,
    es: `Está en la colección del juego (${esMasculine(card) ? "verificado" : "verificada"} el ${verifiedOn(locale)}).`,
    fr: `${cap(frIl(card))} est dans la collection du jeu (${frMasculine(card) ? "vérifié" : "vérifiée"} le ${verifiedOn(locale)}).`,
    pt: `Está na coleção do jogo (${ptMasculine(card) ? "verificado" : "verificada"} em ${verifiedOn(locale)}).`,
    de: `Die Karte ist in der Sammlung (am ${verifiedOn(locale)} im Spiel überprüft).`,
    ru: `Карта есть в коллекции (проверено в игре ${verifiedOn(locale)}).`,
  }[locale];
  out.push(name, is, sp(statsSentence(card, locale)), sp(inGame));
  if (facts.decks) out.push(sp(deckSentence(card, facts.decks, locale)));
  out.push(sp(formerSentence(card, locale)));
  return out.filter((p) => p !== "");
}

// ---------- In breve ----------

export type BriefItem = { q: string; a: Part[] };

/** Le modifiche vere della carta (statistiche, testo, allineamento): gli scambi nei mazzi del playtest non contano. */
function cardChanges(history: readonly Change[]): Change[] {
  return history.filter((h) => h.kind !== "deck");
}

/** "la Potenza da 3 a 5 e la Salute da 3 a 5", "il testo", "l'allineamento da Neutral a Evil". */
function changeWhat(ch: Change, locale: Locale): string {
  const stat = {
    en: { mana: "its cost", power: "its Power", health: "its Health" },
    it: { mana: "il costo", power: "la Potenza", health: "la Salute" },
    es: { mana: "su coste", power: "su Poder", health: "su Salud" },
    fr: { mana: "son coût", power: "sa Puissance", health: "sa Santé" },
    pt: { mana: "o custo", power: "o Poder", health: "a Vida" },
    // all'accusativo, dopo "änderte"
    de: { mana: "die Kosten", power: "die Kraft", health: "das Leben" },
    // all'accusativo, dopo "изменил"
    ru: { mana: "стоимость", power: "Силу", health: "Здоровье" },
  }[locale];
  const fromTo = {
    en: (a: number, b: number) => `from ${a} to ${b}`,
    it: (a: number, b: number) => `da ${a} a ${b}`,
    es: (a: number, b: number) => `de ${a} a ${b}`,
    fr: (a: number, b: number) => `de ${a} à ${b}`,
    pt: (a: number, b: number) => `de ${a} para ${b}`,
    de: (a: number, b: number) => `von ${a} auf ${b}`,
    ru: (a: number, b: number) => `с ${a} до ${b}`,
  }[locale];
  const bits: string[] = [];
  for (const k of ["mana", "power", "health"] as const) {
    const a = ch.from?.[k];
    const b = ch.to?.[k];
    if (a !== undefined && b !== undefined && a !== b) bits.push(`${stat[k]} ${fromTo(a, b)}`);
  }
  if (ch.alignment) {
    const [what, from, to] = { en: ["its alignment", "from", "to"], it: ["l'allineamento", "da", "a"], es: ["su alineamiento", "de", "a"], fr: ["son alignement", "de", "à"], pt: ["o alinhamento", "de", "para"], de: ["die Gesinnung", "von", "auf"], ru: ["мировоззрение", "с", "на"] }[locale];
    bits.push(`${what} ${from} ${alignWord[ch.alignment.from]} ${to} ${alignWord[ch.alignment.to]}`);
  }
  if (!bits.length) return { en: "its text", it: "il testo", es: "su texto", fr: "son texte", pt: "o texto", de: "den Text", ru: "текст" }[locale];
  const and = { en: " and ", it: " e ", es: " y ", fr: " et ", pt: " e ", de: " und ", ru: " и " }[locale];
  return bits.length === 1 ? bits[0] : `${bits.slice(0, -1).join(", ")}${and}${bits[bits.length - 1]}`;
}

/** Domanda e risposta sulle patch: quante l'hanno cambiata e che cosa ha fatto l'ultima, con il link alla sua news. */
function patchAnswer(card: LeadCard, locale: Locale): Part[] {
  const changes = cardChanges(card.history);
  const first = patchOrder[0];
  if (!changes.length) {
    const since = `${patchLabel(first, locale)} (${formatDate(locale, patches[first].date)})`;
    const deckOnly = [...new Set(card.history.filter((h) => h.kind === "deck").map((h) => patchLabel(h.patch, locale)))];
    const no = {
      en: `No: none of the patches since ${since} changed its stats or its text.`,
      it: `No: nessuna patch dalla ${since} ha cambiato le sue statistiche o il suo testo.`,
      es: `No: ningún parche desde el ${since} ha cambiado sus estadísticas ni su texto.`,
      fr: `Non\u00a0: aucun patch depuis la ${since} n'a modifié ses statistiques ni son texte.`,
      pt: `Não: nenhum patch desde o ${since} mudou as suas estatísticas ou o seu texto.`,
      de: `Nein: Seit ${since} hat kein Patch die Werte oder den Text dieser Karte geändert.`,
      ru: `Нет: начиная с ${since}, ни один патч не менял характеристики или текст этой карты.`,
    }[locale];
    const only = deckOnly.length
      ? {
          en: ` It only appears in the changes to the playtest's preset decks (${deckOnly.join(", ")}).`,
          it: ` Compare solo nelle modifiche ai mazzi preimpostati del playtest (${deckOnly.join(", ")}).`,
          es: ` Solo aparece en los cambios de los mazos predefinidos del playtest (${deckOnly.join(", ")}).`,
          fr: ` ${cap(frIl(card))} apparaît seulement dans les modifications des decks préconstruits du playtest (${deckOnly.join(", ")}).`,
          pt: ` Aparece apenas nas mudanças dos decks predefinidos do playtest (${deckOnly.join(", ")}).`,
          de: ` Sie taucht nur in den Änderungen an den vorgefertigten Decks des Playtests auf (${deckOnly.join(", ")}).`,
          ru: ` Карта упоминается только в изменениях готовых колод плейтеста (${deckOnly.join(", ")}).`,
        }[locale]
      : "";
    return [no + only];
  }
  const ids = [...new Set(changes.map((c) => c.patch))];
  const last = changes[changes.length - 1];
  const p = patches[last.patch];
  const label = patchLabel(last.patch, locale);
  const date = formatDate(locale, p.date);
  const patchPart: Part = p.news ? { path: `/news/${p.news}`, text: label } : label;
  const k = ids.length;
  const what = changeWhat(last, locale);
  // Una patch sola: la si dice direttamente, senza "in 1 patch. L'ultima è…"
  if (k === 1) {
    if (locale === "it") return ["Sì: la patch ", patchPart, ` del ${date} ha cambiato ${what}.`];
    if (locale === "es") return ["Sí: el parche ", patchPart, ` del ${date} cambió ${what}.`];
    if (locale === "fr") return ["Oui\u00a0: le patch ", patchPart, ` du ${date} a changé ${what}.`];
    if (locale === "pt") return ["Sim: o patch ", patchPart, ` de ${date} mudou ${what}.`];
    if (locale === "de") return ["Ja: Patch ", patchPart, ` vom ${date} änderte ${what}.`];
    if (locale === "ru") return ["Да: патч ", patchPart, ` от ${date} изменил ${what}.`];
    return ["Yes: patch ", patchPart, ` (${date}) changed ${what}.`];
  }
  // "patch" in italiano non cambia al plurale; in francese è maschile e fa "patchs"
  if (locale === "it") return [`Sì, in ${k} patch. L'ultima è la patch `, patchPart, ` del ${date}, che ha cambiato ${what}.`];
  if (locale === "es") return [`Sí, en ${k} parches. El último es el parche `, patchPart, ` del ${date}, que cambió ${what}.`];
  if (locale === "fr") return [`Oui, dans ${k} patchs. Le dernier est le patch `, patchPart, ` du ${date}, qui a changé ${what}.`];
  if (locale === "pt") return [`Sim, em ${k} patches. O último é o patch `, patchPart, ` de ${date}, que mudou ${what}.`];
  if (locale === "de") return [`Ja, in ${k} Patches. Der letzte ist Patch `, patchPart, ` vom ${date}, der ${what} änderte.`];
  // "в патчах: 2", così il numero non declina il nome
  if (locale === "ru") return [`Да, в патчах: ${k}. Последний — патч `, patchPart, ` от ${date}, который изменил ${what}.`];
  return [`Yes, in ${k} patches. The latest is patch `, patchPart, ` (${date}), which changed ${what}.`];
}

/** Chiude le risposte sui legami fra carte: vengono dai testi, non da una nostra lettura. */
const fromTexts: Record<Locale, string> = {
  en: " (from the card texts).",
  it: " (dai testi delle carte).",
  es: " (según los textos de las cartas).",
  fr: " (d'après les textes des cartes).",
  pt: " (segundo os textos das cartas).",
  de: " (laut den Kartentexten).",
  ru: " (по текстам карт).",
};

/**
 * Le carte generate in avanti, con il secondo passaggio: "Van Helsing genera Van Helsing's Tools, che a sua volta genera
 * Holy Water, …". Per le carte rimosse il primo verbo va al passato ("Headless Horseman generava Pumpkin"); il secondo
 * passaggio resta al presente, perché parla di carte create che esistono ancora.
 */
function createsParts(card: LeadCard, creates: readonly RelCard[][], locale: Locale): Part[] {
  const [first, second] = creates;
  const past = card.status === "removed";
  const verb = past ? { en: " created ", it: " generava ", es: " creaba ", fr: " créait ", pt: " criava ", de: " erschuf ", ru: " создавала " } : { en: " creates ", it: " genera ", es: " crea ", fr: " crée ", pt: " cria ", de: " erschafft ", ru: " создаёт " };
  const out: Part[] = [cardRef(card), verb[locale], ...cardList(first, locale)];
  if (second?.length) {
    const one = first.length === 1;
    const next = {
      en: one ? ", which in turn creates " : "; these in turn create ",
      it: one ? ", che a sua volta genera " : ", che a loro volta generano ",
      es: one ? ", que a su vez crea " : ", que a su vez crean ",
      fr: one ? ", qui crée à son tour " : ", qui créent à leur tour ",
      pt: one ? ", que por sua vez cria " : ", que por sua vez criam ",
      // frase principale dopo il punto e virgola: il verbo resta al secondo posto
      de: one ? "; diese erschafft wiederum " : "; diese erschaffen wiederum ",
      ru: one ? ", которая, в свою очередь, создаёт " : "; они, в свою очередь, создают ",
    }[locale];
    out.push(next, ...cardList(second, locale));
  }
  out.push(fromTexts[locale]);
  return out;
}

/**
 * Le carte più spesso nello stesso mazzo, le prime tre: dal numero di mazzi, a parità le Leggendarie e poi il nome.
 * "Koschei (in 2 su 3), Genie (in 2 su 3) e Captain Ahab (in 2 su 3)".
 */
function companionParts(list: readonly BriefCompanion[], decks: number, locale: Locale): Part[] {
  const top = [...list]
    .sort((a, b) => b.together - a.together || Number(Boolean(b.card.legendary)) - Number(Boolean(a.card.legendary)) || a.card.name.localeCompare(b.card.name))
    .slice(0, 3);
  const count = cardLabels[locale].togetherCount;
  return listParts(
    top.map((c) => [cardRef(c.card), ` (${fill(count, { k: c.together, n: decks })})`]),
    andWord[locale],
  );
}

/**
 * Il riquadro "In breve" (SCHEDE-10): 2–3 domande con le risposte dai dati, pensate per chi cerca e per gli
 * assistenti. Sempre: si può giocare? le patch l'hanno cambiata? Poi, in quest'ordine, la prima che vale: chi la genera
 * (carte create), che carte genera, quali carte stanno spesso nel suo stesso mazzo (carte della collezione in almeno due
 * mazzi). Il conto dei mazzi non si ripete: lo dice già la frase d'attacco (revisione del 25/09/2026).
 */
export function cardBrief(card: LeadCard, facts: CardFacts, locale: Locale): BriefItem[] {
  const n = card.name;
  const items: BriefItem[] = [];
  const legendaries = activeCards.filter((c) => c.legendary).length;
  const date = verifiedOn(locale);

  // 1. Si può giocare? (Fino al 27/10/2026: "È nella demo?") In francese la domanda dice "La carte …", così "elle"
  // vale per unità, sort e carte create.
  const q1 = {
    en: `Is ${n} playable in Origins TCG?`,
    it: `${n} si può giocare in Origins TCG?`,
    es: `¿Se puede jugar ${n} en Origins TCG?`,
    fr: `La carte ${n} est-elle jouable dans Origins TCG\u00a0?`,
    pt: `Dá para jogar com ${n} em Origins TCG?`,
    de: `Ist ${n} in Origins TCG spielbar?`,
    ru: `Можно ли играть картой ${n} в Origins TCG?`,
  }[locale];
  if (card.status === "removed") {
    items.push({
      q: q1,
      a: [
        {
          en: "No: it was in earlier builds of Origins TCG and is no longer in the game, so it cannot be added in the deck builder.",
          it: "No: era nelle build precedenti di Origins TCG e non è più nel gioco, quindi non si può aggiungere nel deck builder.",
          es: "No: estaba en builds anteriores de Origins TCG y ya no está en el juego, así que no se puede añadir en el deck builder.",
          fr: "Non\u00a0: elle était dans les builds précédentes d'Origins TCG et n'est plus dans le jeu, donc impossible de l'ajouter dans le deck builder.",
          pt: "Não: estava em builds anteriores de Origins TCG e não está mais no jogo, então não pode entrar em um deck no deck builder.",
          de: "Nein: Die Karte war in früheren Builds von Origins TCG und ist nicht mehr im Spiel, daher lässt sie sich im Deckbuilder nicht hinzufügen.",
          ru: "Нет: карта была в прежних сборках Origins TCG, но её больше нет в игре, поэтому её нельзя добавить в конструкторе колод.",
        }[locale],
      ],
    });
  } else if (card.type === "token") {
    // Chi la genera lo dice la terza domanda: qui solo lo stato. Se nessun testo della collezione la genera, non lo si può
    // dire con certezza: le carte generate non sono nella collezione del gioco, e i dati importati che la danno per
    // attuale nel gioco non si possono verificare (dal 25/09/2026 il sito non nomina la loro fonte).
    const a = createdFromDemo(facts)
      ? {
          en: `Yes, as a created card: ${notInBuilder.en}, but it comes into a match from a card in the game's collection.`,
          it: `Sì, come carta generata: ${notInBuilder.it}, ma in partita arriva da una carta della collezione del gioco.`,
          es: `Sí, como carta creada: ${notInBuilder.es}, pero llega a la partida desde una carta de la colección del juego.`,
          fr: `Oui, comme carte créée\u00a0: ${notInBuilder.fr}, mais elle entre en jeu grâce à une carte de la collection du jeu.`,
          pt: `Sim, como carta criada: ${notInBuilder.pt}, mas chega à partida por meio de uma carta da coleção do jogo.`,
          de: `Ja, als erschaffene Karte: ${notInBuilder.de}, aber sie kommt über eine Karte aus der Sammlung des Spiels ins Match.`,
          ru: `Да, как созданная карта: ${notInBuilder.ru}, но в матче она появляется благодаря карте из коллекции игры.`,
        }[locale]
      : {
          en: `We cannot say for sure: no card text in the game creates it, and created cards are not in the game's collection. ${cap(notInBuilder.en)}.`,
          it: `Non si può dire con certezza: nessun testo delle carte del gioco la genera, e le carte generate non sono nella collezione del gioco. ${cap(notInBuilder.it)}.`,
          es: `No se puede decir con certeza: ningún texto de las cartas del juego la crea, y las cartas creadas no están en la colección del juego. ${cap(notInBuilder.es)}.`,
          fr: `Impossible de l'affirmer\u00a0: aucun texte de carte du jeu ne la crée, et les cartes créées ne sont pas dans la collection du jeu. ${cap(notInBuilder.fr)}.`,
          pt: `Não dá para afirmar com certeza: nenhum texto das cartas do jogo a cria, e as cartas criadas não estão na coleção do jogo. ${cap(notInBuilder.pt)}.`,
          de: `Das lässt sich nicht sicher sagen: Kein Kartentext des Spiels erschafft sie, und erschaffene Karten sind nicht in der Sammlung des Spiels. ${cap(notInBuilder.de)}.`,
          ru: `Точно сказать нельзя: ни один текст карт игры её не создаёт, а созданных карт нет в коллекции игры. ${cap(notInBuilder.ru)}.`,
        }[locale];
    items.push({ q: q1, a: [a] });
  } else {
    const total = activeCards.length;
    const a = card.legendary
      ? {
          en: `Yes: it is one of the ${legendaries} Legendaries in the game's collection, checked on ${date}, so it can lead a deck in the deck builder.`,
          it: `Sì: è una delle ${legendaries} Leggendarie della collezione del gioco, verificate il ${date}, quindi può guidare un mazzo nel deck builder.`,
          es: `Sí: es una de las ${legendaries} Legendarias de la colección del juego, verificadas el ${date}, así que puede liderar un mazo en el deck builder.`,
          fr: `Oui\u00a0: c'est l'une des ${legendaries} Légendaires de la collection du jeu, vérifiées le ${date}, donc elle peut mener un deck dans le deck builder.`,
          pt: `Sim: é uma das ${legendaries} Lendárias da coleção do jogo, verificadas em ${date}, então pode liderar um deck no deck builder.`,
          de: `Ja: Die Karte ist eine der ${legendaries} Legendären aus der Sammlung des Spiels, am ${date} überprüft, und kann daher im Deckbuilder ein Deck anführen.`,
          ru: `Да: это одна из ${legendaries} Легендарных карт коллекции игры, проверенных ${date}, поэтому она может возглавить колоду в конструкторе колод.`,
        }[locale]
      : {
          en: `Yes: it is one of the ${total} cards in the game's collection, checked on ${date}, so you can put it in a deck in the deck builder.`,
          it: `Sì: è una delle ${total} carte della collezione del gioco, verificate il ${date}, quindi puoi metterla in un mazzo nel deck builder.`,
          es: `Sí: es una de las ${total} cartas de la colección del juego, verificadas el ${date}, así que puedes ponerla en un mazo en el deck builder.`,
          fr: `Oui\u00a0: c'est l'une des ${total} cartes de la collection du jeu, vérifiées le ${date}, donc vous pouvez la mettre dans un deck dans le deck builder.`,
          pt: `Sim: é uma das ${total} cartas da coleção do jogo, verificadas em ${date}, então você pode colocá-la em um deck no deck builder.`,
          de: `Ja: Die Karte ist eine der ${total} Karten aus der Sammlung des Spiels, am ${date} überprüft, du kannst sie also im Deckbuilder in ein Deck aufnehmen.`,
          ru: `Да: это одна из ${total} карт коллекции игры, проверенных ${date}, поэтому её можно положить в колоду в конструкторе колод.`,
        }[locale];
    items.push({ q: q1, a: [a] });
  }

  // 2. Le patch l'hanno cambiata?
  items.push({
    q: { en: `Has a patch changed ${n}?`, it: `Le patch hanno cambiato ${n}?`, es: `¿Algún parche ha cambiado ${n}?`, fr: `Un patch a-t-il changé ${n}\u00a0?`, pt: `Algum patch mudou ${n}?`, de: `Hat ein Patch ${n} verändert?`, ru: `Менял ли патч карту ${n}?` }[locale],
    a: patchAnswer(card, locale),
  });

  // 3. Chi la genera, che cosa genera o con quali carte sta
  if (card.type === "token") {
    const q = { en: `Which card creates ${n}?`, it: `Quale carta genera ${n}?`, es: `¿Qué carta crea ${n}?`, fr: `Quelle carte crée ${n}\u00a0?`, pt: `Qual carta cria ${n}?`, de: `Welche Karte erschafft ${n}?`, ru: `Какая карта создаёт ${n}?` }[locale];
    const [first] = facts.createdBy;
    const a: Part[] = [];
    if (first?.length) {
      const many = first.length > 1;
      a.push(
        { en: "It is created by ", it: many ? "La generano " : "La genera ", es: many ? "La crean " : "La crea ", fr: "Elle est créée par ", pt: "É criada por ", de: "Sie entsteht durch ", ru: many ? "Её создают " : "Её создаёт " }[locale],
        ...chainParts(facts.createdBy, locale),
        fromTexts[locale],
      );
    } else {
      a.push({ en: "No card text says so.", it: "Nessun testo di carta lo dice.", es: "Ningún texto de carta lo dice.", fr: "Aucun texte de carte ne le dit.", pt: "Nenhum texto de carta diz isso.", de: "Kein Kartentext sagt das.", ru: "Ни один текст карты об этом не говорит." }[locale]);
    }
    if (facts.createdByEarlier.length) {
      const many = facts.createdByEarlier.length > 1;
      a.push(
        {
          en: " In earlier builds it was also created by ",
          it: many ? " Nelle build precedenti la generavano anche " : " Nelle build precedenti la generava anche ",
          es: many ? " En builds anteriores también la creaban " : " En builds anteriores también la creaba ",
          fr: " Dans les builds précédentes, elle était aussi créée par ",
          pt: " Em builds anteriores, também era criada por ",
          de: " In früheren Builds entstand sie auch durch ",
          ru: many ? " В прежних сборках её также создавали " : " В прежних сборках её также создавала ",
        }[locale],
        ...cardList(facts.createdByEarlier, locale),
        ".",
      );
    }
    items.push({ q, a });
  } else if (facts.creates.length) {
    const past = card.status === "removed";
    // in francese l'inversione con il soggetto nominale: "Quelles cartes crée Merlin ?"
    items.push({
      q: past
        ? { en: `Which cards did ${n} create?`, it: `Quali carte generava ${n}?`, es: `¿Qué cartas creaba ${n}?`, fr: `Quelles cartes créait ${n}\u00a0?`, pt: `Quais cartas ${n} criava?`, de: `Welche Karten erschuf ${n}?`, ru: `Какие карты создавала ${n}?` }[locale]
        : { en: `Which cards does ${n} create?`, it: `Quali carte genera ${n}?`, es: `¿Qué cartas crea ${n}?`, fr: `Quelles cartes crée ${n}\u00a0?`, pt: `Quais cartas ${n} cria?`, de: `Welche Karten erschafft ${n}?`, ru: `Какие карты создаёт ${n}?` }[locale],
      a: createsParts(card, facts.creates, locale),
    });
  } else if (card.status === "active" && facts.decks && facts.companions?.length) {
    const d = facts.decks.n;
    const leg = Boolean(card.legendary);
    const q = {
      en: `Which cards are often in the same deck as ${n}?`,
      it: `Quali carte stanno spesso nello stesso mazzo di ${n}?`,
      es: `¿Qué cartas suelen ir en el mismo mazo que ${n}?`,
      fr: `Quelles cartes sont souvent dans le même deck que ${n}\u00a0?`,
      pt: `Quais cartas costumam estar no mesmo deck que ${n}?`,
      de: `Welche Karten sind oft im selben Deck wie ${n}?`,
      ru: `Какие карты часто бывают в одной колоде с ${n}?`,
    }[locale];
    const intro = {
      en: leg ? `The cards found most often in the ${d} decks it leads: ` : `The cards found most often in its ${d} published decks: `,
      it: leg ? `Le carte più presenti ${itNei(d)} ${d} mazzi che guida: ` : `Le carte più presenti nei suoi ${d} mazzi pubblicati: `,
      es: leg ? `Las cartas más presentes en los ${d} mazos que lidera: ` : `Las cartas más presentes en sus ${d} mazos publicados: `,
      fr: leg ? `Les cartes les plus présentes dans les ${d} decks qu'${frIl(card)} mène\u00a0: ` : `Les cartes les plus présentes dans ses ${d} decks publiés\u00a0: `,
      pt: leg ? `As cartas mais presentes nos ${d} decks que lidera: ` : `As cartas mais presentes nos seus ${d} decks publicados: `,
      de: leg ? `Die häufigsten Karten in den ${d} Decks, die ${deEr(card)} anführt: ` : `Die häufigsten Karten in den ${d} veröffentlichten Decks mit dieser Karte: `,
      // il numero fra parentesi, così non declina "колода"
      ru: leg ? `Чаще всего в колодах, которые возглавляет эта карта (всего ${d}): ` : `Чаще всего в опубликованных колодах с этой картой (всего ${d}): `,
    }[locale];
    items.push({ q, a: [intro, ...companionParts(facts.companions, d, locale), "."] });
  }
  return items;
}

// ---------- Stato nei dati strutturati ----------

/**
 * Stato della carta per `creativeWorkStatus` nel JSON-LD: uguale in tutte le lingue, perché la carta è una sola entità
 * per le tre pagine (`@id` comune, jsonld/card.ts); le frasi nella lingua della pagina stanno sulla pagina. Le carte
 * create che nessun testo della collezione genera non si dicono nel gioco: come in "In breve", non lo si può verificare.
 * Fino al 27/10/2026 gli stati dicevano "Demo 2.0"; dall'Accesso anticipato dicono "the game".
 */
export function cardStatusLd(card: Pick<Card, "type" | "status">, facts: Pick<CardFacts, "createdBy">): string {
  if (card.status === "removed") return "No longer in the game (earlier builds)";
  if (card.type !== "token") return "In the game";
  return createdFromDemo(facts) ? "Created card in the game" : "Created card, not verified in the game";
}

/**
 * I testi della carta da dichiarare nel JSON-LD, ciascuno con la sua lingua e su una riga: gli stessi su tutte e tre
 * le pagine, perché stanno sull'entità comune della carta. Solo testi del gioco (SCHEDE-07): per le carte della
 * collezione del gioco i testi letti nel gioco; per le carte create e rimosse il solo
 * inglese (quello dei dati importati), mai le nostre traduzioni. Nessun testo se una patch successiva lo ha superato
 * (`outdated`, `textOutdated` di cardTitles.ts), né una "traduzione" uguale all'inglese (testo locale mancante).
 */
export function cardLdTexts(card: Pick<Card, "type" | "status" | "ability">, outdated: boolean): { lang: Locale; text: string }[] {
  if (outdated || !card.ability?.en) return [];
  const one = (s: string) => s.replace(/\s+/g, " ").trim();
  const en = one(card.ability.en);
  const out: { lang: Locale; text: string }[] = [{ lang: "en", text: en }];
  if (card.status !== "active" || card.type === "token") return out;
  for (const l of officialTextLocales) {
    if (l === "en") continue;
    const t = card.ability[l] ? one(card.ability[l]) : "";
    if (t && t !== en) out.push({ lang: l, text: t });
  }
  return out;
}

// ---------- Righe delle fonti ----------

/**
 * Riga sotto le statistiche per le carte che la collezione del gioco non mostra (CARDS-09): carte create e rimosse
 * non sono state verificate nel gioco, e dirlo "verificata" sarebbe un dato falso. Per le 122 carte della collezione resta
 * la riga del dizionario (`common.asOf`): `undefined` qui. Dal 25/09/2026 (decisione di Pierluigi) le righe dicono
 * solo che cosa non è verificato nel gioco e che i bilanciamenti vengono dalle patch notes ufficiali: niente nome né
 * data dell'import da cui arrivano i dati. `source.patch` è la patch dei dati importati (`cardSource.patch`), che per
 * le carte rimosse è quella degli ultimi dati noti.
 * Fino a quel giorno c'era anche `sourceNote` (la data dell'import tra parentesi nella riga della fonte in fondo alla
 * scheda): tolta insieme al nome della fonte, la riga ora è `cards.sourceNote` del dizionario.
 */
export function asOfLine(card: Pick<Card, "type" | "status">, locale: Locale, source: { patch: string }): string | undefined {
  const l = cardLabels[locale];
  if (card.status === "removed") return fill(l.asOfRemoved, { patch: patchName(source.patch, locale) });
  if (card.type === "token") return l.asOfToken;
  return undefined;
}

// ---------- Potere leggendario ----------

/**
 * Potere leggendario delle 11 Leggendarie (SCHEDE-13), da leggere nel gioco ("Game Start: …") e trascrivere qui
 * nelle sei lingue, con il testo ufficiale del gioco: la scheda lo mostra in una sezione sua appena c'è. Resta vuoto
 * finché nessuno lo ha letto nel gioco: mai copiarlo da altri siti (CLAUDE.md, "niente dati inventati").
 */
export const legendaryPowers: Readonly<Partial<Record<string, Record<Locale, string>>>> = {};
