import type { Locale } from "./i18n";
import type { DeckSetSection } from "./community/deckSets";

/**
 * Testi dei Mazzi torneo (04/10/2026) in inglese, italiano e spagnolo: menu, elenco /decks/tournament, scheda del trio,
 * modulo di pubblicazione e modifica, deck builder, /account e profilo /u. Le parti comuni ai mazzi singoli (voti,
 * traduzione automatica, codice del gioco, ruoli) restano nel dizionario (`dict.community`). Segnaposto fra graffe; un
 * test (`deckSets.test.ts`) controlla che le tre lingue abbiano le stesse chiavi e gli stessi segnaposto.
 */
export type DeckSetLabels = {
  /** voci del sottomenu "Mazzi" e schede in cima alle due pagine */
  nav: { single: string; tournament: string; tabs: string };
  list: {
    kicker: string;
    title: string;
    metaTitle: string;
    description: string;
    publishCta: string;
    intro: string;
    rules: string;
    empty: string;
    emptyText: string;
    filterLegendary: string;
    all: string;
    sortBy: string;
    sortNewest: string;
    sortRated: string;
    results: string;
    noResults: string;
    by: string;
    votesOne: string;
    votesMany: string;
    noVotes: string;
  };
  page: {
    kicker: string;
    deckLetter: string;
    decksTitle: string;
    role: string;
    summary: string;
    guide: string;
    sections: Record<Exclude<DeckSetSection, "deck_1" | "deck_2" | "deck_3">, string>;
    openSetInBuilder: string;
    openDeckInBuilder: string;
    conquestTitle: string;
    conquestOk: string;
    pairDiff: string;
    others: string;
    newTitle: string;
    newText: string;
    metaTail: string;
    titleTemplate: string;
    lead: string;
    report: string;
  };
  form: {
    publishTitle: string;
    publishIntro: string;
    editTitle: string;
    decksTitle: string;
    name: string;
    namePlaceholder: string;
    deckName: string;
    archetype: string;
    lang: string;
    langHint: string;
    summary: string;
    summaryHint: string;
    summaryPlaceholder: string;
    deckRole: string;
    deckRolePlaceholder: string;
    moreDetails: string;
    moreDetailsHint: string;
    strengths: string;
    weaknesses: string;
    matchups: string;
    notes: string;
    consent: string;
    submit: string;
    submitting: string;
    update: string;
    updating: string;
    noDecks: string;
    backToBuilder: string;
    loginFirst: string;
    pasteLabel: string;
    pasteHint: string;
    pasteSubmit: string;
    pasteError: string;
    fromBuilder: string;
    fromBuilderEmpty: string;
    fromBuilderDone: string;
    openInBuilder: string;
    words: { below: string; ok: string };
    issues: { count: string; legendaries: string; similar: string; incomplete: string };
    errors: Record<
      "disabled" | "notLoggedIn" | "invalidDeck" | "legendaries" | "similar" | "invalidName" | "summary" | "limit" | "limitAuthor" | "unavailable" | "forbidden" | "db",
      string
    >;
  };
  owner: { edit: string; hide: string; unhide: string; delete: string; confirmDelete: string; hidden: string };
  account: { title: string; intro: string; empty: string; cta: string; view: string; limit: string };
  profile: { title: string };
  builder: { publish: string; hint: string };
};

const en: DeckSetLabels = {
  nav: { single: "Single decks", tournament: "Tournament decks", tabs: "Deck sections" },
  list: {
    kicker: "Decks",
    title: "Tournament decks",
    metaTitle: "Origins TCG tournament decks: Conquest sets with guides",
    description: "Three-deck Conquest sets for Origins TCG tournaments like the Crimson Cup, published by players with a guide: three different Legendaries, game codes and votes.",
    publishCta: "Publish a tournament deck",
    intro:
      "A tournament deck is a set of three decks played together in a Conquest tournament, with one guide that explains how they work as a team. Every set here follows the Crimson Cup rules: three different Legendaries and at least {min} different unique cards between any two decks.",
    rules: "Build the three decks in the deck builder (Tournament mode), then publish them together with your guide. Each deck can be copied into the game with its own code.",
    empty: "No tournament decks yet",
    emptyText: "Be the first: build three Conquest decks in the deck builder and publish them with a guide.",
    filterLegendary: "Legendary",
    all: "All",
    sortBy: "Sort by",
    sortNewest: "Newest",
    sortRated: "Best rated",
    results: "{n} sets",
    noResults: "No sets match these filters.",
    by: "by {name}",
    votesOne: "1 vote",
    votesMany: "{n} votes",
    noVotes: "No votes yet",
  },
  page: {
    kicker: "Tournament deck",
    deckLetter: "Deck {letter}",
    decksTitle: "The three decks",
    role: "Role in the set",
    summary: "Game plan",
    guide: "Guide",
    sections: { strengths: "Strengths", weaknesses: "Weaknesses", matchups: "Matchups", notes: "Notes" },
    openSetInBuilder: "Open the three decks in the deck builder",
    openDeckInBuilder: "Open in the deck builder",
    conquestTitle: "Conquest rules",
    conquestOk: "Three different Legendaries and at least {min} different unique cards between any two decks, as in the Crimson Cup.",
    pairDiff: "{a} and {b}: {n} different cards",
    others: "Other tournament decks",
    newTitle: "Your tournament deck is online",
    newText: "Share the link: anyone can open the three decks, copy the game codes and vote.",
    metaTail: "Three Conquest decks with game codes, guide and votes on OriginsMeta.",
    titleTemplate: "{name}: {legendaries} tournament deck",
    lead: "Origins TCG tournament deck by {author}: {legendaries}.",
    report: "Report this tournament deck",
  },
  form: {
    publishTitle: "Publish a tournament deck",
    publishIntro: "Three Conquest decks published together, with one guide. The three decks come from the deck builder (Tournament mode) or from their codes.",
    editTitle: "Edit tournament deck",
    decksTitle: "The three decks",
    name: "Name of the set",
    namePlaceholder: "e.g. Crimson Cup control trio",
    deckName: "Deck name",
    archetype: "Archetype",
    lang: "Language of the guide",
    langHint: "Write in one language: the site translates the guide into the others.",
    summary: "Game plan for the three decks",
    summaryHint: "How the three decks work together: what each one covers, what you play first. 20 to 600 characters.",
    summaryPlaceholder: "Three different plans so the opponent can't prepare for one…",
    deckRole: "Role of {deck}",
    deckRolePlaceholder: "When you pick it, which matchups it wins, what to watch out for…",
    moreDetails: "More about the set",
    moreDetailsHint: "Strengths, weaknesses, matchups, notes, videos and links: optional.",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    matchups: "Matchups",
    notes: "Notes",
    consent: "By publishing you agree that the three decks and the guide are public with your username.",
    submit: "Publish tournament deck",
    submitting: "Publishing…",
    update: "Save changes",
    updating: "Saving…",
    noDecks:
      "No tournament decks found in this browser. Build three decks in the deck builder (Tournament mode) and press “Publish the 3 decks”, or paste their three codes here.",
    backToBuilder: "Back to the deck builder",
    loginFirst: "Sign in to publish these three decks. They stay saved in this browser and you'll find them here when you come back.",
    pasteLabel: "The three deck codes",
    pasteHint: "Three OriginsMeta codes or deck builder links, one per line.",
    pasteSubmit: "Use these decks",
    pasteError: "We need exactly three readable deck codes.",
    fromBuilder: "Take the three decks from the deck builder",
    fromBuilderEmpty: "The deck builder in this browser doesn't have three complete decks.",
    fromBuilderDone: "Decks taken from the deck builder: save to update the set.",
    openInBuilder: "Open these decks in the deck builder",
    words: {
      below: "{n} of {min} words. With at least {min} words of guide the page can appear on Google; shorter guides stay on the site only.",
      ok: "{n} words: complete guide, the page can appear on Google.",
    },
    issues: {
      count: "A tournament deck has exactly three decks.",
      legendaries: "The three decks need three different Legendaries.",
      similar: "Decks {a} and {b} have only {n} different cards: at least {min} are needed.",
      incomplete: "Each deck needs a Legendary and 12 base cards.",
    },
    errors: {
      disabled: "Publishing is not available right now.",
      notLoggedIn: "Sign in to publish.",
      invalidDeck: "One of the three decks is not valid: check it in the deck builder.",
      legendaries: "The three decks need three different Legendaries.",
      similar: "Two decks are too similar: at least {min} different cards are needed between any two decks.",
      invalidName: "The name needs 3 to 60 characters.",
      summary: "The game plan needs at least 20 characters.",
      limit: "You have reached the limit of tournament decks for your account (the same as for single decks). Hide or delete one to publish another.",
      limitAuthor: "You have reached the limit of 20 tournament decks for the Author role. Delete one to publish another.",
      unavailable: "Tournament decks are not available yet: try again in a few minutes.",
      forbidden: "You can't edit this tournament deck.",
      db: "Something went wrong while saving. Try again.",
    },
  },
  owner: {
    edit: "Edit",
    hide: "Hide",
    unhide: "Put back online",
    delete: "Delete",
    confirmDelete: "Delete this tournament deck and its votes?",
    hidden: "Hidden",
  },
  account: {
    title: "Your tournament decks",
    intro: "Sets of three Conquest decks published with a guide.",
    empty: "You haven't published any tournament decks yet.",
    cta: "Build three decks in the deck builder",
    view: "Open",
    limit: "{used} of {cap} published",
  },
  profile: { title: "Tournament decks" },
  builder: {
    publish: "Publish the 3 decks",
    hint: "To publish them as a tournament deck, complete the three decks and follow the Conquest rules.",
  },
};

const it: DeckSetLabels = {
  nav: { single: "Mazzi singoli", tournament: "Mazzi torneo", tabs: "Sezioni dei mazzi" },
  list: {
    kicker: "Mazzi",
    title: "Mazzi torneo",
    metaTitle: "Mazzi torneo di Origins TCG: trii Conquest con guida",
    description: "Trii di mazzi Conquest per i tornei di Origins TCG come la Crimson Cup, pubblicati dai giocatori con una guida: tre Leggendarie diverse, codici del gioco e voti.",
    publishCta: "Pubblica un mazzo torneo",
    intro:
      "Un mazzo torneo è un trio di mazzi giocati insieme in un torneo Conquest, con una guida che spiega come lavorano in squadra. Ogni trio qui rispetta le regole della Crimson Cup: tre Leggendarie diverse e almeno {min} carte uniche diverse fra ogni coppia di mazzi.",
    rules: "Costruisci i tre mazzi nel deck builder (modalità Torneo) e pubblicali insieme alla tua guida. Ogni mazzo si copia nel gioco con il suo codice.",
    empty: "Ancora nessun mazzo torneo",
    emptyText: "Comincia tu: costruisci tre mazzi Conquest nel deck builder e pubblicali con una guida.",
    filterLegendary: "Leggendaria",
    all: "Tutte",
    sortBy: "Ordina per",
    sortNewest: "Più recenti",
    sortRated: "Più votati",
    results: "{n} trii",
    noResults: "Nessun trio con questi filtri.",
    by: "di {name}",
    votesOne: "1 voto",
    votesMany: "{n} voti",
    noVotes: "Ancora nessun voto",
  },
  page: {
    kicker: "Mazzo torneo",
    deckLetter: "Mazzo {letter}",
    decksTitle: "I tre mazzi",
    role: "Ruolo nel trio",
    summary: "Piano di gioco",
    guide: "Guida",
    sections: { strengths: "Punti di forza", weaknesses: "Punti deboli", matchups: "Scontri", notes: "Note" },
    openSetInBuilder: "Apri i tre mazzi nel deck builder",
    openDeckInBuilder: "Apri nel deck builder",
    conquestTitle: "Regole Conquest",
    conquestOk: "Tre Leggendarie diverse e almeno {min} carte uniche diverse fra ogni coppia di mazzi, come nella Crimson Cup.",
    pairDiff: "{a} e {b}: {n} carte diverse",
    others: "Altri mazzi torneo",
    newTitle: "Il tuo mazzo torneo è online",
    newText: "Condividi il link: chiunque può aprire i tre mazzi, copiare i codici del gioco e votare.",
    metaTail: "Tre mazzi Conquest con codici del gioco, guida e voti su OriginsMeta.",
    titleTemplate: "{name}: mazzo torneo con {legendaries}",
    lead: "Mazzo torneo di Origins TCG di {author}: {legendaries}.",
    report: "Segnala questo mazzo torneo",
  },
  form: {
    publishTitle: "Pubblica un mazzo torneo",
    publishIntro: "Tre mazzi Conquest pubblicati insieme, con una guida sola. I tre mazzi arrivano dal deck builder (modalità Torneo) o dai loro codici.",
    editTitle: "Modifica il mazzo torneo",
    decksTitle: "I tre mazzi",
    name: "Nome del trio",
    namePlaceholder: "per esempio Trio control per la Crimson Cup",
    deckName: "Nome del mazzo",
    archetype: "Archetipo",
    lang: "Lingua della guida",
    langHint: "Scrivi in una lingua sola: il sito traduce la guida nelle altre.",
    summary: "Piano di gioco dei tre mazzi",
    summaryHint: "Come lavorano insieme i tre mazzi: che cosa copre ognuno, quale giochi per primo. Da 20 a 600 caratteri.",
    summaryPlaceholder: "Tre piani diversi, così l'avversario non può prepararsi a uno solo…",
    deckRole: "Ruolo del {deck}",
    deckRolePlaceholder: "Quando lo scegli, quali scontri vince, a che cosa stare attenti…",
    moreDetails: "Altro sul trio",
    moreDetailsHint: "Punti di forza, punti deboli, scontri, note, video e link: facoltativi.",
    strengths: "Punti di forza",
    weaknesses: "Punti deboli",
    matchups: "Scontri",
    notes: "Note",
    consent: "Pubblicando accetti che i tre mazzi e la guida siano pubblici con il tuo nome utente.",
    submit: "Pubblica il mazzo torneo",
    submitting: "Pubblicazione…",
    update: "Salva le modifiche",
    updating: "Salvataggio…",
    noDecks:
      "In questo browser non c'è un mazzo torneo. Costruisci tre mazzi nel deck builder (modalità Torneo) e premi “Pubblica i 3 mazzi”, oppure incolla qui i loro tre codici.",
    backToBuilder: "Torna al deck builder",
    loginFirst: "Accedi per pubblicare questi tre mazzi. Restano salvati in questo browser e li ritrovi qui al ritorno.",
    pasteLabel: "I codici dei tre mazzi",
    pasteHint: "Tre codici OriginsMeta o link del deck builder, uno per riga.",
    pasteSubmit: "Usa questi mazzi",
    pasteError: "Servono esattamente tre codici di mazzo leggibili.",
    fromBuilder: "Prendi i tre mazzi dal deck builder",
    fromBuilderEmpty: "Il deck builder di questo browser non ha tre mazzi completi.",
    fromBuilderDone: "Mazzi presi dal deck builder: salva per aggiornare il trio.",
    openInBuilder: "Apri questi mazzi nel deck builder",
    words: {
      below: "{n} parole su {min}. Con almeno {min} parole di guida la pagina può comparire su Google; con meno resta solo sul sito.",
      ok: "{n} parole: guida completa, la pagina può comparire su Google.",
    },
    issues: {
      count: "Un mazzo torneo ha esattamente tre mazzi.",
      legendaries: "I tre mazzi devono avere tre Leggendarie diverse.",
      similar: "I mazzi {a} e {b} hanno solo {n} carte diverse: ne servono almeno {min}.",
      incomplete: "Ogni mazzo ha bisogno di una Leggendaria e di 12 carte base.",
    },
    errors: {
      disabled: "La pubblicazione non è disponibile in questo momento.",
      notLoggedIn: "Accedi per pubblicare.",
      invalidDeck: "Uno dei tre mazzi non è valido: controllalo nel deck builder.",
      legendaries: "I tre mazzi devono avere tre Leggendarie diverse.",
      similar: "Due mazzi sono troppo simili: fra ogni coppia servono almeno {min} carte diverse.",
      invalidName: "Il nome deve avere da 3 a 60 caratteri.",
      summary: "Il piano di gioco deve avere almeno 20 caratteri.",
      limit: "Hai raggiunto il tetto dei mazzi torneo del tuo account (lo stesso dei mazzi singoli). Nascondine o eliminane uno per pubblicarne un altro.",
      limitAuthor: "Hai raggiunto il tetto di 20 mazzi torneo del ruolo Autore. Eliminane uno per pubblicarne un altro.",
      unavailable: "I mazzi torneo non sono ancora disponibili: riprova fra qualche minuto.",
      forbidden: "Non puoi modificare questo mazzo torneo.",
      db: "Qualcosa è andato storto nel salvataggio. Riprova.",
    },
  },
  owner: {
    edit: "Modifica",
    hide: "Nascondi",
    unhide: "Rimetti online",
    delete: "Elimina",
    confirmDelete: "Eliminare questo mazzo torneo e i suoi voti?",
    hidden: "Nascosto",
  },
  account: {
    title: "I tuoi mazzi torneo",
    intro: "Trii di mazzi Conquest pubblicati con una guida.",
    empty: "Non hai ancora pubblicato mazzi torneo.",
    cta: "Costruisci tre mazzi nel deck builder",
    view: "Apri",
    limit: "{used} su {cap} pubblicati",
  },
  profile: { title: "Mazzi torneo" },
  builder: {
    publish: "Pubblica i 3 mazzi",
    hint: "Per pubblicarli come mazzo torneo completa i tre mazzi e rispetta le regole Conquest.",
  },
};

const es: DeckSetLabels = {
  nav: { single: "Mazos individuales", tournament: "Mazos de torneo", tabs: "Secciones de mazos" },
  list: {
    kicker: "Mazos",
    title: "Mazos de torneo",
    metaTitle: "Mazos de torneo de Origins TCG: tríos Conquest con guía",
    description: "Tríos de mazos Conquest para los torneos de Origins TCG como la Crimson Cup, publicados por los jugadores con una guía: tres Legendarias distintas, códigos del juego y votos.",
    publishCta: "Publica un mazo de torneo",
    intro:
      "Un mazo de torneo es un trío de mazos que se juegan juntos en un torneo Conquest, con una guía que explica cómo trabajan en equipo. Cada trío de esta sección sigue las reglas de la Crimson Cup: tres Legendarias distintas y al menos {min} cartas únicas distintas entre cada par de mazos.",
    rules: "Construye los tres mazos en el deck builder (modo Torneo) y publícalos juntos con tu guía. Cada mazo se copia en el juego con su propio código.",
    empty: "Todavía no hay mazos de torneo",
    emptyText: "Empieza tú: construye tres mazos Conquest en el deck builder y publícalos con una guía.",
    filterLegendary: "Legendaria",
    all: "Todas",
    sortBy: "Ordenar por",
    sortNewest: "Más recientes",
    sortRated: "Mejor valorados",
    results: "{n} tríos",
    noResults: "Ningún trío con estos filtros.",
    by: "de {name}",
    votesOne: "1 voto",
    votesMany: "{n} votos",
    noVotes: "Todavía sin votos",
  },
  page: {
    kicker: "Mazo de torneo",
    deckLetter: "Mazo {letter}",
    decksTitle: "Los tres mazos",
    role: "Papel en el trío",
    summary: "Plan de juego",
    guide: "Guía",
    sections: { strengths: "Puntos fuertes", weaknesses: "Puntos débiles", matchups: "Enfrentamientos", notes: "Notas" },
    openSetInBuilder: "Abrir los tres mazos en el deck builder",
    openDeckInBuilder: "Abrir en el deck builder",
    conquestTitle: "Reglas Conquest",
    conquestOk: "Tres Legendarias distintas y al menos {min} cartas únicas distintas entre cada par de mazos, como en la Crimson Cup.",
    pairDiff: "{a} y {b}: {n} cartas distintas",
    others: "Otros mazos de torneo",
    newTitle: "Tu mazo de torneo está en línea",
    newText: "Comparte el enlace: cualquiera puede abrir los tres mazos, copiar los códigos del juego y votar.",
    metaTail: "Tres mazos Conquest con códigos del juego, guía y votos en OriginsMeta.",
    titleTemplate: "{name}: mazo de torneo con {legendaries}",
    lead: "Mazo de torneo de Origins TCG de {author}: {legendaries}.",
    report: "Denunciar este mazo de torneo",
  },
  form: {
    publishTitle: "Publica un mazo de torneo",
    publishIntro: "Tres mazos Conquest publicados juntos, con una sola guía. Los tres mazos llegan del deck builder (modo Torneo) o de sus códigos.",
    editTitle: "Editar el mazo de torneo",
    decksTitle: "Los tres mazos",
    name: "Nombre del trío",
    namePlaceholder: "por ejemplo, Trío control para la Crimson Cup",
    deckName: "Nombre del mazo",
    archetype: "Arquetipo",
    lang: "Idioma de la guía",
    langHint: "Escribe en un solo idioma: el sitio traduce la guía a los demás.",
    summary: "Plan de juego de los tres mazos",
    summaryHint: "Cómo trabajan juntos los tres mazos: qué cubre cada uno, cuál juegas primero. De 20 a 600 caracteres.",
    summaryPlaceholder: "Tres planes distintos para que el rival no pueda prepararse para uno solo…",
    deckRole: "Papel del {deck}",
    deckRolePlaceholder: "Cuándo lo eliges, qué enfrentamientos gana, a qué prestar atención…",
    moreDetails: "Más sobre el trío",
    moreDetailsHint: "Puntos fuertes, puntos débiles, enfrentamientos, notas, vídeos y enlaces: opcionales.",
    strengths: "Puntos fuertes",
    weaknesses: "Puntos débiles",
    matchups: "Enfrentamientos",
    notes: "Notas",
    consent: "Al publicar aceptas que los tres mazos y la guía sean públicos con tu nombre de usuario.",
    submit: "Publicar el mazo de torneo",
    submitting: "Publicando…",
    update: "Guardar los cambios",
    updating: "Guardando…",
    noDecks:
      "En este navegador no hay un mazo de torneo. Construye tres mazos en el deck builder (modo Torneo) y pulsa “Publicar los 3 mazos”, o pega aquí sus tres códigos.",
    backToBuilder: "Volver al deck builder",
    loginFirst: "Inicia sesión para publicar estos tres mazos. Se quedan guardados en este navegador y los encontrarás aquí cuando vuelvas.",
    pasteLabel: "Los códigos de los tres mazos",
    pasteHint: "Tres códigos de OriginsMeta o enlaces del deck builder, uno por línea.",
    pasteSubmit: "Usar estos mazos",
    pasteError: "Hacen falta exactamente tres códigos de mazo legibles.",
    fromBuilder: "Tomar los tres mazos del deck builder",
    fromBuilderEmpty: "El deck builder de este navegador no tiene tres mazos completos.",
    fromBuilderDone: "Mazos tomados del deck builder: guarda para actualizar el trío.",
    openInBuilder: "Abrir estos mazos en el deck builder",
    words: {
      below: "{n} de {min} palabras. Con al menos {min} palabras de guía, la página puede aparecer en Google; con menos, se queda solo en el sitio.",
      ok: "{n} palabras: guía completa, la página puede aparecer en Google.",
    },
    issues: {
      count: "Un mazo de torneo tiene exactamente tres mazos.",
      legendaries: "Los tres mazos necesitan tres Legendarias distintas.",
      similar: "Los mazos {a} y {b} solo tienen {n} cartas distintas: hacen falta al menos {min}.",
      incomplete: "Cada mazo necesita una Legendaria y 12 cartas base.",
    },
    errors: {
      disabled: "La publicación no está disponible en este momento.",
      notLoggedIn: "Inicia sesión para publicar.",
      invalidDeck: "Uno de los tres mazos no es válido: revísalo en el deck builder.",
      legendaries: "Los tres mazos necesitan tres Legendarias distintas.",
      similar: "Dos mazos se parecen demasiado: entre cada par hacen falta al menos {min} cartas distintas.",
      invalidName: "El nombre debe tener de 3 a 60 caracteres.",
      summary: "El plan de juego debe tener al menos 20 caracteres.",
      limit: "Has llegado al límite de mazos de torneo de tu cuenta (el mismo que el de los mazos individuales). Oculta o elimina uno para publicar otro.",
      limitAuthor: "Has llegado al límite de 20 mazos de torneo del rol Autor. Elimina uno para publicar otro.",
      unavailable: "Los mazos de torneo todavía no están disponibles: vuelve a intentarlo en unos minutos.",
      forbidden: "No puedes editar este mazo de torneo.",
      db: "Algo salió mal al guardar. Vuelve a intentarlo.",
    },
  },
  owner: {
    edit: "Editar",
    hide: "Ocultar",
    unhide: "Volver a publicar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar este mazo de torneo y sus votos?",
    hidden: "Oculto",
  },
  account: {
    title: "Tus mazos de torneo",
    intro: "Tríos de mazos Conquest publicados con una guía.",
    empty: "Todavía no has publicado mazos de torneo.",
    cta: "Construye tres mazos en el deck builder",
    view: "Abrir",
    limit: "{used} de {cap} publicados",
  },
  profile: { title: "Mazos de torneo" },
  builder: {
    publish: "Publicar los 3 mazos",
    hint: "Para publicarlos como mazo de torneo, completa los tres mazos y respeta las reglas Conquest.",
  },
};

export const deckSetLabels: Record<Locale, DeckSetLabels> = { en, it, es };

/** Lettera di un mazzo del trio: A, B, C. */
export const deckLetter = (i: number) => String.fromCharCode(65 + i);
