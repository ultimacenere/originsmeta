import type { Locale } from "./i18n";
import { RULES } from "./deckrules";

/**
 * Testi del pacchetto "dati strutturati del sito" dell'Ondata 2 del piano SEO/GEO (25/09/2026: GEO-08, HOME-09,
 * TOOL-05, TOOL-09, TOOL-13): la pagina /about (come verifichiamo i dati, fonti, permesso di Koin Games), i link fra
 * pagina autore e profilo della community, descrizione e funzioni del deck builder nei dati strutturati e il titolo del
 * feed RSS. Stanno qui e non nei dizionari, come `linkLabels.ts`: un modulo solo, nelle tre lingue insieme; `en` è il
 * tipo di riferimento. Solo fatti già scritti nel CLAUDE.md e nei dati del sito (nessun giudizio sulle carte).
 */
const en = {
  about: {
    /**
     * Al posto di `about.p2` del dizionario, che citava solo Steam e Discord come fonti dei numeri: i dati delle carte
     * vengono da World of Origins (eccezione decisa da Pierluigi il 15/09/2026) e sono verificati nel gioco.
     */
    p2: "We are players, not the publisher. Dates, rules and events come only from official sources, card data from the World of Origins community database checked in the game, and every page says when it was last updated.",
    /** riga con il link alla guida "che cos'è Origins TCG" (mappa delle query, C01): {link} è il testo del link */
    newToGame: "New to the game? Start with {link}.",
    newToGameLink: "what Origins TCG is",
    allAuthors: "All authors",
    /** sezione nuova (HOME-09): come verifichiamo i dati, ancora #how-we-check (la cita `publishingPrinciples`) */
    checkTitle: "How we check our data",
    check: [
      "Dates, rules, events and balance changes come only from official sources: the Steam page, the patch notes on Steam, the official Discord and Koin Games' announcements. When a detail is only on Discord, the article says so.",
      "Card stats, texts, tags and official IDs are imported from World of Origins, the community card database. The balance changes of each new patch are applied from the official patch notes until the database has imported it.",
      "On 22 September 2026 we compared all 122 cards of Demo 2.0 with the game's collection, one by one: costs, stats and alignments matched, and the 16 texts that had fallen behind are now the game's. On 25 September we also read the Italian and Spanish card texts in the game: the ones on this site are the official ones. We repeat the check after every patch, in all three languages.",
      "Created cards and removed cards are not in the game's collection: their Italian and Spanish texts are ours, written with the game's official glossary. The sagas and the notes on each legend are ours too.",
    ],
    /** chiusura della sezione: {email} diventa il link mailto */
    checkErrors: "Found a mistake? Write to {email}: we fix it, and the page shows the new date.",
    /** etichetta della fonte nuova nell'elenco "Le fonti che usiamo" */
    worldOfOrigins: "World of Origins · card database",
    /**
     * Al posto di `about.disclaimer` del dizionario, che parlava di "fair use": il materiale ufficiale lo usiamo con il
     * permesso di Koin Games del 19/09/2026 (Kevin, CLAUDE.md), come contenuto e mai come identità del sito. La non
     * affiliazione resta, parola per parola, in testa.
     */
    disclaimer:
      "OriginsMeta is not affiliated with, endorsed by or sponsored by Koin Games. Origins TCG is a trademark of its owner. Card names, artwork and game data belong to Koin Games; the official material on this site (card art, key art, screenshots) is used as content, with the permission Koin Games gave us on 19 September 2026, and never as OriginsMeta's own branding.",
  },
  author: {
    /** tasto dalla pagina autore al profilo pubblico /u/<username> (TOOL-09: i due profili si linkano) */
    communityProfile: "Community profile",
    /** il ritorno: dal profilo /u/<username> di un autore alla sua pagina autore (lo usa u/[username]/page.tsx) */
    editorialPage: "OriginsMeta author page",
  },
  builder: {
    /** descrizione del WebApplication del deck builder: i numeri arrivano da RULES (deckrules.ts) */
    appDescription:
      "Free deck builder for Origins TCG, the digital card game by Koin Games: it checks the deck rules ({legendary} Legendary plus {cards} base cards, each played as {copies} copies: {size} cards), reads and writes the in-game deck codes and checks {decks} decks together for the Conquest format of the Crimson Cup.",
    /** `featureList`: solo funzioni che DeckBuilder.tsx fa davvero */
    features: [
      "Deck rules check: {legendary} Legendary plus {cards} base cards, each played as {copies} copies ({size} cards)",
      "Import and export of Origins TCG in-game deck codes",
      "Conquest mode: {decks} decks checked together, a different Legendary in each and at least {min} unique cards between each pair",
      "Import and export of text decklists",
      "Mana curve of the deck",
      "Share link and automatic saving in the browser",
      "Private saving and publishing with a guide, with a free account",
    ],
  },
  /** titolo del <link rel="alternate" type="application/rss+xml"> nel layout, quando il feed esiste */
  feedTitle: "OriginsMeta: Origins TCG news",
};

export type EntityLabels = typeof en;

export const entityLabels: Record<Locale, EntityLabels> = {
  en,
  it: {
    about: {
      p2: "Siamo giocatori, non l'editore. Date, regole ed eventi arrivano solo da fonti ufficiali, i dati delle carte dal database della community World of Origins verificato nel gioco, e ogni pagina dice quando è stata aggiornata.",
      newToGame: "Non conosci il gioco? Parti da {link}.",
      newToGameLink: "che cos'è Origins TCG",
      allAuthors: "Tutti gli autori",
      checkTitle: "Come verifichiamo i dati",
      check: [
        "Date, regole, eventi e bilanciamenti arrivano solo da fonti ufficiali: la pagina Steam, le patch notes su Steam, il Discord ufficiale e i comunicati di Koin Games. Quando un dettaglio c'è solo sul Discord, l'articolo lo dice.",
        "Statistiche, testi, tag e ID ufficiali delle carte si importano da World of Origins, il database delle carte della community. Le modifiche di ogni patch nuova si applicano dalle patch notes ufficiali finché il database non l'ha importata.",
        "Il 22 settembre 2026 abbiamo confrontato una per una tutte le 122 carte della Demo 2.0 con la collezione del gioco: costi, statistiche e allineamenti coincidevano, e i 16 testi rimasti indietro ora sono quelli del gioco. Il 25 settembre abbiamo letto nel gioco anche i testi italiani e spagnoli delle carte: quelli del sito sono gli ufficiali. Rifacciamo la verifica dopo ogni patch, nelle tre lingue.",
        "Le carte generate e le carte rimosse non sono nella collezione del gioco: il loro testo italiano e spagnolo è nostro, scritto con il glossario ufficiale del gioco. Sono nostre anche le saghe e le note su ogni leggenda.",
      ],
      checkErrors: "Hai trovato un errore? Scrivi a {email}: lo correggiamo, e la pagina mostra la nuova data.",
      worldOfOrigins: "World of Origins · database delle carte",
      disclaimer:
        "OriginsMeta non è affiliato, approvato o sponsorizzato da Koin Games. Origins TCG è un marchio del suo titolare. Nomi delle carte, illustrazioni e dati di gioco appartengono a Koin Games; il materiale ufficiale sul sito (illustrazioni delle carte, key art, screenshot) è usato come contenuto, con il permesso che Koin Games ci ha dato il 19 settembre 2026, e mai come identità di OriginsMeta.",
    },
    author: {
      communityProfile: "Profilo nella community",
      editorialPage: "Pagina autore su OriginsMeta",
    },
    builder: {
      appDescription:
        "Deck builder gratuito per Origins TCG, il gioco di carte digitale di Koin Games: controlla le regole del mazzo ({legendary} Leggendaria più {cards} carte base, ognuna in {copies} copie: {size} carte), legge e scrive i codici dei mazzi del gioco e controlla {decks} mazzi insieme per il formato Conquest della Crimson Cup.",
      features: [
        "Controllo delle regole del mazzo: {legendary} Leggendaria più {cards} carte base, ognuna in {copies} copie ({size} carte)",
        "Importazione ed esportazione dei codici dei mazzi del gioco",
        "Modalità Conquest: {decks} mazzi controllati insieme, una Leggendaria diversa in ciascuno e almeno {min} carte uniche fra ogni coppia",
        "Importazione ed esportazione delle liste in testo",
        "Curva di mana del mazzo",
        "Link da condividere e salvataggio automatico nel browser",
        "Salvataggio privato e pubblicazione con una guida, con un account gratuito",
      ],
    },
    feedTitle: "OriginsMeta: news di Origins TCG",
  },
  es: {
    about: {
      p2: "Somos jugadores, no la editora del juego. Las fechas, las reglas y los eventos vienen solo de fuentes oficiales; los datos de las cartas, de la base de datos de la comunidad World of Origins, comprobada en el juego; y cada página indica cuándo se actualizó por última vez.",
      newToGame: "¿No conoces el juego? Empieza por {link}.",
      newToGameLink: "qué es Origins TCG",
      allAuthors: "Todos los autores",
      checkTitle: "Cómo comprobamos los datos",
      check: [
        "Las fechas, las reglas, los eventos y los cambios de equilibrio vienen solo de fuentes oficiales: la página de Steam, las notas del parche en Steam, el Discord oficial y los comunicados de Koin Games. Cuando un detalle solo está en Discord, el artículo lo dice.",
        "Las estadísticas, los textos, las etiquetas y los ID oficiales de las cartas se importan de World of Origins, la base de datos de cartas de la comunidad. Los cambios de cada parche nuevo se aplican a partir de las notas oficiales hasta que la base de datos lo importa.",
        "El 22 de septiembre de 2026 comparamos una por una las 122 cartas de la Demo 2.0 con la colección del juego: costes, estadísticas y alineamientos coincidían, y los 16 textos que se habían quedado atrás ahora son los del juego. El 25 de septiembre también leímos en el juego los textos de las cartas en italiano y en español: los de este sitio son los oficiales. Repetimos la comprobación después de cada parche, en los tres idiomas.",
        "Las cartas creadas y las cartas retiradas no están en la colección del juego: su texto en italiano y en español es nuestro, escrito con el glosario oficial del juego. También son nuestras las sagas y las notas sobre cada leyenda.",
      ],
      checkErrors: "¿Has encontrado un error? Escribe a {email}: lo corregimos, y la página muestra la nueva fecha.",
      worldOfOrigins: "World of Origins · base de datos de cartas",
      disclaimer:
        "OriginsMeta no está afiliado a Koin Games ni cuenta con su respaldo o patrocinio. Origins TCG es una marca de su titular. Los nombres de las cartas, las ilustraciones y los datos del juego pertenecen a Koin Games; el material oficial del sitio (ilustraciones de las cartas, key art, capturas de pantalla) se usa como contenido, con el permiso que Koin Games nos dio el 19 de septiembre de 2026, y nunca como imagen de marca de OriginsMeta.",
    },
    author: {
      communityProfile: "Perfil en la comunidad",
      editorialPage: "Página de autor en OriginsMeta",
    },
    builder: {
      appDescription:
        "Deck builder gratuito para Origins TCG, el juego de cartas digital de Koin Games: comprueba las reglas del mazo ({legendary} Legendaria más {cards} cartas base, cada una en {copies} copias: {size} cartas), lee y escribe los códigos de mazo del juego y comprueba {decks} mazos a la vez para el formato Conquest de la Crimson Cup.",
      features: [
        "Comprobación de las reglas del mazo: {legendary} Legendaria más {cards} cartas base, cada una en {copies} copias ({size} cartas)",
        "Importación y exportación de los códigos de mazo del juego",
        "Modo Conquest: {decks} mazos comprobados a la vez, con una Legendaria distinta en cada uno y al menos {min} cartas únicas entre cada par",
        "Importación y exportación de listas en texto",
        "Curva de maná del mazo",
        "Enlace para compartir y guardado automático en el navegador",
        "Guardado privado y publicación con una guía, con una cuenta gratuita",
      ],
    },
    feedTitle: "OriginsMeta: noticias de Origins TCG",
  },
};

/** I numeri delle regole del mazzo, dai valori veri di RULES: così descrizione e funzioni non restano indietro. */
const ruleVars: Record<string, number> = {
  legendary: RULES.legendarySlots,
  cards: RULES.distinctCards,
  copies: RULES.copiesPerCard,
  size: RULES.deckSize,
  decks: RULES.conquestDecks,
  min: RULES.conquestMinDifferent,
};

const withRules = (template: string): string => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in ruleVars ? String(ruleVars[k]) : m));

/** Descrizione e funzioni del deck builder nei dati strutturati (WebApplication), nella lingua della pagina. */
export function deckBuilderApp(locale: Locale): { description: string; features: string[] } {
  const b = entityLabels[locale].builder;
  return { description: withRules(b.appDescription), features: b.features.map(withRules) };
}
