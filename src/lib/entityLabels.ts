import type { Locale } from "./i18n";
import { RULES } from "./deckrules";

/**
 * Testi del pacchetto "dati strutturati del sito" dell'Ondata 2 del piano SEO/GEO (25/09/2026: GEO-08, HOME-09,
 * TOOL-05, TOOL-09, TOOL-13): la pagina /about (description, come verifichiamo i dati, fonti, disclaimer), i link fra
 * pagina autore, indice degli autori e profilo della community, descrizione e funzioni del deck builder nei dati
 * strutturati. Stanno qui e non nei dizionari, come `linkLabels.ts`: un modulo solo, nelle tre lingue insieme; `en` è il
 * tipo di riferimento. Solo fatti già scritti nel CLAUDE.md e nei dati del sito (nessun giudizio sulle carte).
 */
const en = {
  about: {
    /**
     * Meta description di /about e description del nodo AboutPage (120-158 caratteri), al posto di `about.description`
     * del dizionario, che dava come fonti solo Steam, le patch notes e Discord: la pagina dice anche la verifica nel
     * gioco (TOOL-13), e la description deve dire la stessa cosa. Dal 25/09/2026 (decisione di Pierluigi) né la pagina
     * né la description nominano la fonte dei dati importati delle carte: dicono solo che cosa è verificato nel gioco.
     */
    description:
      "Who runs OriginsMeta, the independent Origins TCG fan site: official sources, demo cards checked one by one in the game, and how to reach us.",
    /**
     * Al posto di `about.p2` del dizionario, che citava solo Steam e Discord come fonti dei numeri: le carte della
     * Demo 2.0 sono verificate nel gioco (22/09/2026, testi italiani e spagnoli il 25/09/2026).
     */
    p2: "We are players, not the publisher. Dates, rules and events come only from official sources; the Demo 2.0 cards are checked one by one in the game; and every page says when it was last updated.",
    /** riga con il link alla guida "che cos'è Origins TCG" (mappa delle query, C01): {link} è il testo del link */
    newToGame: "New to the game? Start with {link}.",
    newToGameLink: "what Origins TCG is",
    /** sezione nuova (HOME-09): come verifichiamo i dati, ancora #how-we-check (la cita `publishingPrinciples`) */
    checkTitle: "How we check our data",
    /**
     * I paragrafi della sezione. Nel terzo {date} e {count} arrivano da `cardsVerified` (src/lib/data/cards.ts, l'ultima
     * verifica carta per carta, la stessa del disclaimer del deck builder) e {textsDate} da `OFFICIAL_TEXTS_READ` qui
     * sotto: niente numeri scritti a mano che alla verifica successiva contraddirebbero FAQ e schede.
     */
    check: [
      "Dates, rules, events and balance changes come only from official sources: the Steam page, the patch notes on Steam, the official Discord and Koin Games' announcements. When a detail is only on Discord, the article says so.",
      "The balance changes of each new patch are copied from the official patch notes onto the card pages, with the date and the link to the post.",
      "On {date} we compared all {count} cards of the demo with the game's collection, one by one: costs, stats and alignments matched, and the English texts that had fallen behind are now the game's. The Italian and Spanish card texts are the official ones too, read in the game on {textsDate}. We repeat the check after every patch, in all three languages.",
      "Created cards and removed cards are not in the game's collection, so they have not been checked in the game, and their pages say so; their Italian and Spanish texts are ours, written with the game's official glossary. The locations have not been checked one by one in the game yet either: the locations page will say when they are, and their Italian and Spanish effects are ours, with the same glossary. The sagas and the notes on each legend are ours too.",
    ],
    /** chiusura della sezione: {email} diventa il link mailto */
    checkErrors: "Found a mistake? Write to {email}: we fix it, and the page shows the new date.",
    /**
     * Al posto di `about.disclaimer` del dizionario, che parlava di "fair use" (una dottrina statunitense, per un uso che
     * in realtà Koin Games ha autorizzato). La non affiliazione resta, parola per parola, in testa. È la versione che si
     * pubblica finché Pierluigi non decide di rendere pubblico il permesso (`KOIN_PERMISSION_PUBLIC` qui sotto).
     */
    disclaimer:
      "OriginsMeta is not affiliated with, endorsed by or sponsored by Koin Games. Origins TCG is a trademark of its owner. Card names, artwork and game data belong to Koin Games; the official material on this site (card art, key art, screenshots) is used as content, to inform and comment, and never as OriginsMeta's own branding.",
    /**
     * La stessa frase con il permesso di Koin Games del 19/09/2026 (Kevin, CLAUDE.md): il rilievo HOME-09 la vuole solo
     * con l'OK di Pierluigi a renderlo pubblico. Pronta nelle tre lingue, si accende con `KOIN_PERMISSION_PUBLIC`.
     */
    disclaimerPermission:
      "OriginsMeta is not affiliated with, endorsed by or sponsored by Koin Games. Origins TCG is a trademark of its owner. Card names, artwork and game data belong to Koin Games; the official material on this site (card art, key art, screenshots) is used as content, with the permission Koin Games gave us on 19 September 2026, and never as OriginsMeta's own branding.",
  },
  author: {
    /** tasto dalla pagina autore al profilo pubblico /u/<username> (TOOL-09: i due profili si linkano) */
    communityProfile: "Community profile",
    /**
     * link all'indice /authors (TOOL-09: l'hub riceveva link quasi solo dalle pagine autore): su /about e, con le note di
     * integrazione del pacchetto, accanto alla firma in fondo a news e guide
     */
    allAuthors: "All authors",
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
};

export type EntityLabels = typeof en;

export const entityLabels: Record<Locale, EntityLabels> = {
  en,
  it: {
    about: {
      description:
        "Chi c'è dietro OriginsMeta, il sito fan indipendente su Origins TCG: fonti ufficiali, carte della demo verificate una per una nel gioco e contatti.",
      p2: "Siamo giocatori, non l'editore. Date, regole ed eventi arrivano solo da fonti ufficiali; le carte della Demo 2.0 sono verificate una per una nel gioco; e ogni pagina dice quando è stata aggiornata.",
      newToGame: "Non conosci il gioco? Parti da {link}.",
      newToGameLink: "che cos'è Origins TCG",
      checkTitle: "Come verifichiamo i dati",
      check: [
        "Date, regole, eventi e bilanciamenti arrivano solo da fonti ufficiali: la pagina Steam, le patch notes su Steam, il Discord ufficiale e i comunicati di Koin Games. Quando un dettaglio c'è solo sul Discord, l'articolo lo dice.",
        "Le modifiche di bilanciamento di ogni patch nuova si trascrivono dalle patch notes ufficiali sulle schede delle carte, con la data e il link al post.",
        "Il {date} abbiamo confrontato una per una tutte le {count} carte della demo con la collezione del gioco: costi, statistiche e allineamenti coincidevano, e i testi inglesi rimasti indietro ora sono quelli del gioco. Anche i testi italiani e spagnoli delle carte sono quelli ufficiali, letti nel gioco il {textsDate}. Rifacciamo la verifica dopo ogni patch, nelle tre lingue.",
        "Le carte generate e le carte rimosse non sono nella collezione del gioco, quindi non sono state verificate nel gioco, e le loro schede lo dicono; il loro testo italiano e spagnolo è nostro, scritto con il glossario ufficiale del gioco. Anche i luoghi non sono ancora stati verificati uno per uno nel gioco: la pagina dei luoghi dirà quando lo saranno, e i loro effetti in italiano e spagnolo sono nostri, con lo stesso glossario. Sono nostre anche le saghe e le note su ogni leggenda.",
      ],
      checkErrors: "Hai trovato un errore? Scrivi a {email}: lo correggiamo, e la pagina mostra la nuova data.",
      disclaimer:
        "OriginsMeta non è affiliato a Koin Games, né approvato o sponsorizzato da Koin Games. Origins TCG è un marchio del suo titolare. Nomi delle carte, illustrazioni e dati di gioco appartengono a Koin Games; il materiale ufficiale sul sito (illustrazioni delle carte, key art, screenshot) è usato come contenuto, per informare e commentare, e mai come identità di OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta non è affiliato a Koin Games, né approvato o sponsorizzato da Koin Games. Origins TCG è un marchio del suo titolare. Nomi delle carte, illustrazioni e dati di gioco appartengono a Koin Games; il materiale ufficiale sul sito (illustrazioni delle carte, key art, screenshot) è usato come contenuto, con il permesso che Koin Games ci ha dato il 19 settembre 2026, e mai come identità di OriginsMeta.",
    },
    author: {
      communityProfile: "Profilo nella community",
      allAuthors: "Tutti gli autori",
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
  },
  es: {
    about: {
      description:
        "Quién hace OriginsMeta, el sitio fan independiente de Origins TCG: fuentes oficiales, cartas de la demo comprobadas una por una en el juego y contacto.",
      p2: "Somos jugadores, no la editora del juego. Las fechas, las reglas y los eventos vienen solo de fuentes oficiales; las cartas de la Demo 2.0 se comprueban una por una en el juego; y cada página indica cuándo se actualizó por última vez.",
      newToGame: "¿No conoces el juego? Empieza por {link}.",
      newToGameLink: "qué es Origins TCG",
      checkTitle: "Cómo comprobamos los datos",
      check: [
        "Las fechas, las reglas, los eventos y los cambios de equilibrio vienen solo de fuentes oficiales: la página de Steam, las notas del parche en Steam, el Discord oficial y los comunicados de Koin Games. Cuando un detalle solo está en Discord, el artículo lo dice.",
        "Los cambios de equilibrio de cada parche nuevo se copian de las notas oficiales del parche en las fichas de las cartas, con la fecha y el enlace a la publicación.",
        "El {date} comparamos una por una las {count} cartas de la demo con la colección del juego: costes, estadísticas y alineamientos coincidían, y los textos en inglés que se habían quedado atrás ahora son los del juego. Los textos de las cartas en italiano y en español también son los oficiales, leídos en el juego el {textsDate}. Repetimos la comprobación después de cada parche, en los tres idiomas.",
        "Las cartas creadas y las cartas retiradas no están en la colección del juego, así que no se han verificado en el juego, y sus fichas lo dicen; su texto en italiano y en español es nuestro, escrito con el glosario oficial del juego. Las ubicaciones tampoco se han verificado todavía una por una en el juego: la página de ubicaciones lo indicará cuando lo estén, y sus efectos en italiano y en español son nuestros, con el mismo glosario. También son nuestras las sagas y las notas sobre cada leyenda.",
      ],
      checkErrors: "¿Has encontrado un error? Escribe a {email}: lo corregimos, y la página muestra la nueva fecha.",
      disclaimer:
        "OriginsMeta no está afiliado a Koin Games ni cuenta con su respaldo o patrocinio. Origins TCG es una marca de su titular. Los nombres de las cartas, las ilustraciones y los datos del juego pertenecen a Koin Games; el material oficial del sitio (ilustraciones de las cartas, key art, capturas de pantalla) se usa como contenido, para informar y comentar, y nunca como imagen de marca de OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta no está afiliado a Koin Games ni cuenta con su respaldo o patrocinio. Origins TCG es una marca de su titular. Los nombres de las cartas, las ilustraciones y los datos del juego pertenecen a Koin Games; el material oficial del sitio (ilustraciones de las cartas, key art, capturas de pantalla) se usa como contenido, con el permiso que Koin Games nos dio el 19 de septiembre de 2026, y nunca como imagen de marca de OriginsMeta.",
    },
    author: {
      communityProfile: "Perfil en la comunidad",
      allAuthors: "Todos los autores",
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
  },
};

/**
 * Il permesso di Koin Games del 19/09/2026 nel disclaimer di /about: spento finché Pierluigi non dà l'OK a renderlo
 * pubblico (rilievo HOME-09). Con `true` la pagina usa `disclaimerPermission` al posto di `disclaimer`, nelle tre lingue;
 * in tutte e due le versioni la non affiliazione resta in testa e il "fair use" non c'è più (lo controlla un test).
 */
export const KOIN_PERMISSION_PUBLIC = false;

/** Il disclaimer di /about nella lingua della pagina, secondo `KOIN_PERMISSION_PUBLIC`. */
export function aboutDisclaimer(locale: Locale): string {
  const a = entityLabels[locale].about;
  return KOIN_PERMISSION_PUBLIC ? a.disclaimerPermission : a.disclaimer;
}

/**
 * Giorno in cui abbiamo letto nel gioco i testi italiani e spagnoli delle carte e li abbiamo messi sul sito (CLAUDE.md:
 * "Dal 25/09/2026 anche `it` ed `es` sono i testi ufficiali letti nel gioco"). Da spostare accanto a `cardsVerified` in
 * src/lib/data/cards.ts quando quel file cambia per altro; qui perché il pacchetto non tocca i dati delle carte.
 */
export const OFFICIAL_TEXTS_READ = "2026-09-25";

/**
 * I paragrafi di "Come verifichiamo i dati" con i segnaposto riempiti: `date` e `textsDate` già formattati nella lingua
 * della pagina (`formatDate`), `count` il numero di carte confrontate. Un segnaposto sconosciuto resta com'è, così un
 * test lo vede.
 */
export function aboutChecks(locale: Locale, values: { date: string; count: number; textsDate: string }): string[] {
  const v: Record<string, string> = { date: values.date, count: String(values.count), textsDate: values.textsDate };
  return entityLabels[locale].about.check.map((p) => p.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m));
}

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
