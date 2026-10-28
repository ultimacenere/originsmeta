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
    /** tasto verso la scheda del trio dal riquadro delle liste di un articolo (NewsDecklists, 28/10/2026) */
    openSet: string;
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
    openSet: "Open the tournament deck page",
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
    openSet: "Apri la scheda del mazzo torneo",
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
    openSet: "Abrir la ficha del mazo de torneo",
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

/**
 * Francese (07/10/2026, docs/francese.md): "vous", "deck de tournoi" / "Decks de tournoi", "Decks simples", "Deck builder"
 * come nome dello strumento; spazio insecabile prima di : ; ? !
 */
const fr: DeckSetLabels = {
  nav: { single: "Decks simples", tournament: "Decks de tournoi", tabs: "Sections des decks" },
  list: {
    kicker: "Decks",
    title: "Decks de tournoi",
    metaTitle: "Decks de tournoi Origins TCG : trios Conquest avec guide",
    description: "Trios de decks Conquest pour les tournois Origins TCG comme la Crimson Cup, publiés avec un guide : trois Légendaires différentes, codes du jeu et votes.",
    publishCta: "Publier un deck de tournoi",
    intro:
      "Un deck de tournoi est un trio de decks joués ensemble dans un tournoi Conquest, avec un seul guide qui explique comment ils fonctionnent en équipe. Chaque trio ici respecte les règles de la Crimson Cup : trois Légendaires différentes et au moins {min} cartes uniques différentes entre deux decks.",
    rules: "Construisez les trois decks dans le Deck builder (mode Tournoi), puis publiez-les avec votre guide. Chaque deck se copie dans le jeu avec son propre code.",
    empty: "Pas encore de deck de tournoi",
    emptyText: "Lancez-vous : construisez trois decks Conquest dans le Deck builder et publiez-les avec un guide.",
    filterLegendary: "Légendaire",
    all: "Toutes",
    sortBy: "Trier par",
    sortNewest: "Plus récents",
    sortRated: "Mieux notés",
    results: "{n} trios",
    noResults: "Aucun trio ne correspond à ces filtres.",
    by: "par {name}",
    votesOne: "1 vote",
    votesMany: "{n} votes",
    noVotes: "Pas encore de vote",
  },
  page: {
    kicker: "Deck de tournoi",
    deckLetter: "Deck {letter}",
    decksTitle: "Les trois decks",
    role: "Rôle dans le trio",
    summary: "Plan de jeu",
    guide: "Guide",
    sections: { strengths: "Points forts", weaknesses: "Points faibles", matchups: "Matchups", notes: "Notes" },
    openSetInBuilder: "Ouvrir les trois decks dans le Deck builder",
    openDeckInBuilder: "Ouvrir dans le Deck builder",
    openSet: "Ouvrir la fiche du deck de tournoi",
    conquestTitle: "Règles Conquest",
    conquestOk: "Trois Légendaires différentes et au moins {min} cartes uniques différentes entre deux decks, comme à la Crimson Cup.",
    pairDiff: "{a} et {b} : {n} cartes différentes",
    others: "D'autres decks de tournoi",
    newTitle: "Votre deck de tournoi est en ligne",
    newText: "Partagez le lien : tout le monde peut ouvrir les trois decks, copier les codes du jeu et voter.",
    metaTail: "Trois decks Conquest avec codes du jeu, guide et votes sur OriginsMeta.",
    titleTemplate: "{name} : deck de tournoi avec {legendaries}",
    lead: "Deck de tournoi Origins TCG de {author} : {legendaries}.",
    report: "Signaler ce deck de tournoi",
  },
  form: {
    publishTitle: "Publier un deck de tournoi",
    publishIntro: "Trois decks Conquest publiés ensemble, avec un seul guide. Les trois decks viennent du Deck builder (mode Tournoi) ou de leurs codes.",
    editTitle: "Modifier le deck de tournoi",
    decksTitle: "Les trois decks",
    name: "Nom du trio",
    namePlaceholder: "ex. Trio control pour la Crimson Cup",
    deckName: "Nom du deck",
    archetype: "Archétype",
    lang: "Langue du guide",
    langHint: "Écrivez dans une seule langue : le site traduit le guide dans les autres.",
    summary: "Plan de jeu des trois decks",
    summaryHint: "Comment les trois decks fonctionnent ensemble : ce que couvre chacun, lequel vous jouez en premier. De 20 à 600 caractères.",
    summaryPlaceholder: "Trois plans différents pour que l'adversaire ne puisse pas se préparer à un seul…",
    deckRole: "Rôle du {deck}",
    deckRolePlaceholder: "Quand vous le choisissez, quels matchups il gagne, à quoi faire attention…",
    moreDetails: "Plus sur le trio",
    moreDetailsHint: "Points forts, points faibles, matchups, notes, vidéos et liens : facultatifs.",
    strengths: "Points forts",
    weaknesses: "Points faibles",
    matchups: "Matchups",
    notes: "Notes",
    consent: "En publiant, vous acceptez que les trois decks et le guide soient publics avec votre nom d'utilisateur.",
    submit: "Publier le deck de tournoi",
    submitting: "Publication…",
    update: "Enregistrer les modifications",
    updating: "Enregistrement…",
    noDecks:
      "Aucun deck de tournoi trouvé dans ce navigateur. Construisez trois decks dans le Deck builder (mode Tournoi) et appuyez sur « Publier les 3 decks », ou collez leurs trois codes ici.",
    backToBuilder: "Retour au Deck builder",
    loginFirst: "Connectez-vous pour publier ces trois decks. Ils restent enregistrés dans ce navigateur et vous les retrouverez ici à votre retour.",
    pasteLabel: "Les codes des trois decks",
    pasteHint: "Trois codes OriginsMeta ou liens du Deck builder, un par ligne.",
    pasteSubmit: "Utiliser ces decks",
    pasteError: "Il faut exactement trois codes de deck lisibles.",
    fromBuilder: "Reprendre les trois decks du Deck builder",
    fromBuilderEmpty: "Le Deck builder de ce navigateur n'a pas trois decks complets.",
    fromBuilderDone: "Decks repris du Deck builder : enregistrez pour mettre le trio à jour.",
    openInBuilder: "Ouvrir ces decks dans le Deck builder",
    words: {
      below: "{n} mots sur {min}. Avec au moins {min} mots de guide, la page peut apparaître sur Google ; en dessous, elle reste sur le site seulement.",
      ok: "{n} mots : guide complet, la page peut apparaître sur Google.",
    },
    issues: {
      count: "Un deck de tournoi compte exactement trois decks.",
      legendaries: "Les trois decks doivent avoir trois Légendaires différentes.",
      similar: "Les decks {a} et {b} n'ont que {n} cartes différentes : il en faut au moins {min}.",
      incomplete: "Chaque deck a besoin d'une Légendaire et de 12 cartes de base.",
    },
    errors: {
      disabled: "La publication n'est pas disponible pour le moment.",
      notLoggedIn: "Connectez-vous pour publier.",
      invalidDeck: "L'un des trois decks n'est pas valide : vérifiez-le dans le Deck builder.",
      legendaries: "Les trois decks doivent avoir trois Légendaires différentes.",
      similar: "Deux decks sont trop semblables : il faut au moins {min} cartes différentes entre deux decks.",
      invalidName: "Le nom doit compter de 3 à 60 caractères.",
      summary: "Le plan de jeu doit compter au moins 20 caractères.",
      limit: "Vous avez atteint la limite de decks de tournoi de votre compte (la même que pour les decks simples). Masquez-en ou supprimez-en un pour en publier un autre.",
      limitAuthor: "Vous avez atteint la limite de 20 decks de tournoi du rôle Auteur. Supprimez-en un pour en publier un autre.",
      unavailable: "Les decks de tournoi ne sont pas encore disponibles : réessayez dans quelques minutes.",
      forbidden: "Vous ne pouvez pas modifier ce deck de tournoi.",
      db: "Un problème est survenu à l'enregistrement. Réessayez.",
    },
  },
  owner: {
    edit: "Modifier",
    hide: "Masquer",
    unhide: "Remettre en ligne",
    delete: "Supprimer",
    confirmDelete: "Supprimer ce deck de tournoi et ses votes ?",
    hidden: "Masqué",
  },
  account: {
    title: "Vos decks de tournoi",
    intro: "Trios de decks Conquest publiés avec un guide.",
    empty: "Vous n'avez encore publié aucun deck de tournoi.",
    cta: "Construire trois decks dans le Deck builder",
    view: "Ouvrir",
    limit: "{used} sur {cap} publiés",
  },
  profile: { title: "Decks de tournoi" },
  builder: {
    publish: "Publier les 3 decks",
    hint: "Pour les publier comme deck de tournoi, complétez les trois decks et respectez les règles Conquest.",
  },
};

const pt: DeckSetLabels = {
  nav: { single: "Decks individuais", tournament: "Decks de torneio", tabs: "Seções dos decks" },
  list: {
    kicker: "Decks",
    title: "Decks de torneio",
    metaTitle: "Decks de torneio de Origins TCG: trios Conquest com guia",
    description: "Trios de decks Conquest para os torneios de Origins TCG como a Crimson Cup, publicados com um guia: três Lendárias diferentes, códigos do jogo e votos.",
    publishCta: "Publicar um deck de torneio",
    intro:
      "Um deck de torneio é um trio de decks jogados juntos em um torneio Conquest, com um único guia que explica como eles funcionam em equipe. Cada trio aqui segue as regras da Crimson Cup: três Lendárias diferentes e pelo menos {min} cartas únicas diferentes entre quaisquer dois decks.",
    rules: "Monte os três decks no Deck builder (modo Torneio) e depois publique todos juntos com o seu guia. Cada deck pode ser copiado para o jogo com o próprio código.",
    empty: "Ainda não há decks de torneio",
    emptyText: "Seja o primeiro: monte três decks Conquest no Deck builder e publique com um guia.",
    filterLegendary: "Lendária",
    all: "Todas",
    sortBy: "Ordenar por",
    sortNewest: "Mais recentes",
    sortRated: "Mais bem avaliados",
    results: "{n} trios",
    noResults: "Nenhum trio corresponde a esses filtros.",
    by: "de {name}",
    votesOne: "1 voto",
    votesMany: "{n} votos",
    noVotes: "Nenhum voto ainda",
  },
  page: {
    kicker: "Deck de torneio",
    deckLetter: "Deck {letter}",
    decksTitle: "Os três decks",
    role: "Papel no trio",
    summary: "Plano de jogo",
    guide: "Guia",
    sections: { strengths: "Pontos fortes", weaknesses: "Pontos fracos", matchups: "Matchups", notes: "Notas" },
    openSetInBuilder: "Abrir os três decks no Deck builder",
    openDeckInBuilder: "Abrir no Deck builder",
    openSet: "Abrir a página do deck de torneio",
    conquestTitle: "Regras do Conquest",
    conquestOk: "Três Lendárias diferentes e pelo menos {min} cartas únicas diferentes entre quaisquer dois decks, como na Crimson Cup.",
    pairDiff: "{a} e {b}: {n} cartas diferentes",
    others: "Outros decks de torneio",
    newTitle: "Seu deck de torneio está no ar",
    newText: "Compartilhe o link: qualquer pessoa pode abrir os três decks, copiar os códigos do jogo e votar.",
    metaTail: "Três decks Conquest com códigos do jogo, guia e votos no OriginsMeta.",
    titleTemplate: "{name}: deck de torneio com {legendaries}",
    lead: "Deck de torneio de Origins TCG de {author}: {legendaries}.",
    report: "Denunciar este deck de torneio",
  },
  form: {
    publishTitle: "Publicar um deck de torneio",
    publishIntro: "Três decks Conquest publicados juntos, com um único guia. Os três decks vêm do Deck builder (modo Torneio) ou dos seus códigos.",
    editTitle: "Editar o deck de torneio",
    decksTitle: "Os três decks",
    name: "Nome do trio",
    namePlaceholder: "ex.: Trio control para a Crimson Cup",
    deckName: "Nome do deck",
    archetype: "Arquétipo",
    lang: "Idioma do guia",
    langHint: "Escreva em um só idioma: o site traduz o guia para os outros.",
    summary: "Plano de jogo dos três decks",
    summaryHint: "Como os três decks funcionam juntos: o que cada um cobre, qual você joga primeiro. De 20 a 600 caracteres.",
    summaryPlaceholder: "Três planos diferentes para o oponente não conseguir se preparar para um só…",
    deckRole: "Papel do {deck}",
    deckRolePlaceholder: "Quando escolher, quais matchups ele vence, com o que tomar cuidado…",
    moreDetails: "Mais sobre o trio",
    moreDetailsHint: "Pontos fortes, pontos fracos, matchups, notas, vídeos e links: opcionais.",
    strengths: "Pontos fortes",
    weaknesses: "Pontos fracos",
    matchups: "Matchups",
    notes: "Notas",
    consent: "Ao publicar, você concorda que os três decks e o guia fiquem públicos com o seu nome de usuário.",
    submit: "Publicar o deck de torneio",
    submitting: "Publicando…",
    update: "Salvar as alterações",
    updating: "Salvando…",
    noDecks:
      "Nenhum deck de torneio encontrado neste navegador. Monte três decks no Deck builder (modo Torneio) e aperte “Publicar os 3 decks”, ou cole os três códigos aqui.",
    backToBuilder: "Voltar ao Deck builder",
    loginFirst: "Entre para publicar estes três decks. Eles continuam salvos neste navegador e você vai encontrá-los aqui quando voltar.",
    pasteLabel: "Os códigos dos três decks",
    pasteHint: "Três códigos do OriginsMeta ou links do Deck builder, um por linha.",
    pasteSubmit: "Usar estes decks",
    pasteError: "Precisamos de exatamente três códigos de deck legíveis.",
    fromBuilder: "Pegar os três decks do Deck builder",
    fromBuilderEmpty: "O Deck builder deste navegador não tem três decks completos.",
    fromBuilderDone: "Decks pegos do Deck builder: salve para atualizar o trio.",
    openInBuilder: "Abrir estes decks no Deck builder",
    words: {
      below: "{n} de {min} palavras. Com pelo menos {min} palavras de guia a página pode aparecer no Google; abaixo disso, ela fica só no site.",
      ok: "{n} palavras: guia completo, a página pode aparecer no Google.",
    },
    issues: {
      count: "Um deck de torneio tem exatamente três decks.",
      legendaries: "Os três decks precisam de três Lendárias diferentes.",
      similar: "Os decks {a} e {b} têm só {n} cartas diferentes: são necessárias pelo menos {min}.",
      incomplete: "Cada deck precisa de uma Lendária e de 12 cartas base.",
    },
    errors: {
      disabled: "A publicação não está disponível agora.",
      notLoggedIn: "Entre para publicar.",
      invalidDeck: "Um dos três decks não é válido: confira no Deck builder.",
      legendaries: "Os três decks precisam de três Lendárias diferentes.",
      similar: "Dois decks são parecidos demais: são necessárias pelo menos {min} cartas diferentes entre quaisquer dois decks.",
      invalidName: "O nome precisa ter de 3 a 60 caracteres.",
      summary: "O plano de jogo precisa ter pelo menos 20 caracteres.",
      limit: "Você chegou ao limite de decks de torneio da sua conta (o mesmo dos decks individuais). Oculte ou exclua um para publicar outro.",
      limitAuthor: "Você chegou ao limite de 20 decks de torneio do papel Autor. Exclua um para publicar outro.",
      unavailable: "Os decks de torneio ainda não estão disponíveis: tente de novo em alguns minutos.",
      forbidden: "Você não pode editar este deck de torneio.",
      db: "Algo deu errado ao salvar. Tente de novo.",
    },
  },
  owner: {
    edit: "Editar",
    hide: "Ocultar",
    unhide: "Colocar de volta no ar",
    delete: "Excluir",
    confirmDelete: "Excluir este deck de torneio e os votos dele?",
    hidden: "Oculto",
  },
  account: {
    title: "Seus decks de torneio",
    intro: "Trios de decks Conquest publicados com um guia.",
    empty: "Você ainda não publicou nenhum deck de torneio.",
    cta: "Montar três decks no Deck builder",
    view: "Abrir",
    limit: "{used} de {cap} publicados",
  },
  profile: { title: "Decks de torneio" },
  builder: {
    publish: "Publicar os 3 decks",
    hint: "Para publicá-los como deck de torneio, complete os três decks e siga as regras do Conquest.",
  },
};

const de: DeckSetLabels = {
  nav: { single: "Einzeldecks", tournament: "Turnierdecks", tabs: "Deck-Bereiche" },
  list: {
    kicker: "Decks",
    title: "Turnierdecks",
    metaTitle: "Origins TCG Turnierdecks: Conquest-Sets mit Guide",
    description: "Conquest-Sets aus drei Decks für Turniere von Origins TCG wie den Crimson Cup, mit Guide veröffentlicht: drei verschiedene Legendäre, Codes und Bewertungen.",
    publishCta: "Ein Turnierdeck veröffentlichen",
    intro:
      "Ein Turnierdeck ist ein Set aus drei Decks, die zusammen in einem Conquest-Turnier gespielt werden, mit einem einzigen Guide, der erklärt, wie sie als Team funktionieren. Jedes Set hier folgt den Regeln des Crimson Cup: drei verschiedene Legendäre und mindestens {min} verschiedene einzigartige Karten zwischen je zwei Decks.",
    rules: "Baue die drei Decks im Deck builder (Turniermodus) und veröffentliche sie dann zusammen mit deinem Guide. Jedes Deck lässt sich mit seinem eigenen Code ins Spiel kopieren.",
    empty: "Noch keine Turnierdecks",
    emptyText: "Sei die erste Person: Baue drei Conquest-Decks im Deck builder und veröffentliche sie mit einem Guide.",
    filterLegendary: "Legendäre",
    all: "Alle",
    sortBy: "Sortieren nach",
    sortNewest: "Neueste",
    sortRated: "Am besten bewertet",
    results: "{n} Sets",
    noResults: "Kein Set passt zu diesen Filtern.",
    by: "von {name}",
    votesOne: "1 Bewertung",
    votesMany: "{n} Bewertungen",
    noVotes: "Noch keine Bewertungen",
  },
  page: {
    kicker: "Turnierdeck",
    deckLetter: "Deck {letter}",
    decksTitle: "Die drei Decks",
    role: "Rolle im Set",
    summary: "Spielplan",
    guide: "Guide",
    sections: { strengths: "Stärken", weaknesses: "Schwächen", matchups: "Matchups", notes: "Notizen" },
    openSetInBuilder: "Die drei Decks im Deck builder öffnen",
    openDeckInBuilder: "Im Deck builder öffnen",
    openSet: "Seite des Turnierdecks öffnen",
    conquestTitle: "Conquest-Regeln",
    conquestOk: "Drei verschiedene Legendäre und mindestens {min} verschiedene einzigartige Karten zwischen je zwei Decks, wie beim Crimson Cup.",
    pairDiff: "{a} und {b}: {n} verschiedene Karten",
    others: "Weitere Turnierdecks",
    newTitle: "Dein Turnierdeck ist online",
    newText: "Teile den Link: Alle können die drei Decks öffnen, die Spielcodes kopieren und bewerten.",
    metaTail: "Drei Conquest-Decks mit Spielcodes, Guide und Bewertungen auf OriginsMeta.",
    titleTemplate: "{name}: Turnierdeck mit {legendaries}",
    lead: "Turnierdeck für Origins TCG von {author}: {legendaries}.",
    report: "Dieses Turnierdeck melden",
  },
  form: {
    publishTitle: "Ein Turnierdeck veröffentlichen",
    publishIntro: "Drei Conquest-Decks, zusammen veröffentlicht, mit einem einzigen Guide. Die drei Decks kommen aus dem Deck builder (Turniermodus) oder aus ihren Codes.",
    editTitle: "Turnierdeck bearbeiten",
    decksTitle: "Die drei Decks",
    name: "Name des Sets",
    namePlaceholder: "z. B. Control-Trio für den Crimson Cup",
    deckName: "Name des Decks",
    archetype: "Archetyp",
    lang: "Sprache des Guides",
    langHint: "Schreib in einer Sprache: Die Website übersetzt den Guide in die anderen.",
    summary: "Spielplan der drei Decks",
    summaryHint: "Wie die drei Decks zusammen funktionieren: was jedes abdeckt, welches du zuerst spielst. 20 bis 600 Zeichen.",
    summaryPlaceholder: "Drei verschiedene Pläne, damit sich der Gegner nicht auf einen einstellen kann …",
    deckRole: "Rolle von {deck}",
    deckRolePlaceholder: "Wann du es wählst, welche Matchups es gewinnt, worauf du achten musst …",
    moreDetails: "Mehr über das Set",
    moreDetailsHint: "Stärken, Schwächen, Matchups, Notizen, Videos und Links: optional.",
    strengths: "Stärken",
    weaknesses: "Schwächen",
    matchups: "Matchups",
    notes: "Notizen",
    consent: "Mit der Veröffentlichung bist du einverstanden, dass die drei Decks und der Guide mit deinem Nutzernamen öffentlich sind.",
    submit: "Turnierdeck veröffentlichen",
    submitting: "Wird veröffentlicht …",
    update: "Änderungen speichern",
    updating: "Wird gespeichert …",
    noDecks:
      "In diesem Browser wurden keine Turnierdecks gefunden. Baue drei Decks im Deck builder (Turniermodus) und drück auf „Die 3 Decks veröffentlichen“ oder füge hier ihre drei Codes ein.",
    backToBuilder: "Zurück zum Deck builder",
    loginFirst: "Melde dich an, um diese drei Decks zu veröffentlichen. Sie bleiben in diesem Browser gespeichert und du findest sie hier, wenn du zurückkommst.",
    pasteLabel: "Die Codes der drei Decks",
    pasteHint: "Drei OriginsMeta-Codes oder Links aus dem Deck builder, einer pro Zeile.",
    pasteSubmit: "Diese Decks verwenden",
    pasteError: "Wir brauchen genau drei lesbare Deckcodes.",
    fromBuilder: "Die drei Decks aus dem Deck builder übernehmen",
    fromBuilderEmpty: "Der Deck builder in diesem Browser hat keine drei vollständigen Decks.",
    fromBuilderDone: "Decks aus dem Deck builder übernommen: Speichere, um das Set zu aktualisieren.",
    openInBuilder: "Diese Decks im Deck builder öffnen",
    words: {
      below: "{n} von {min} Wörtern. Mit mindestens {min} Wörtern Guide kann die Seite bei Google erscheinen; kürzere Guides bleiben nur auf der Website.",
      ok: "{n} Wörter: kompletter Guide, die Seite kann bei Google erscheinen.",
    },
    issues: {
      count: "Ein Turnierdeck hat genau drei Decks.",
      legendaries: "Die drei Decks brauchen drei verschiedene Legendäre.",
      similar: "Die Decks {a} und {b} haben nur {n} verschiedene Karten: Mindestens {min} sind nötig.",
      incomplete: "Jedes Deck braucht eine Legendäre und 12 Basiskarten.",
    },
    errors: {
      disabled: "Veröffentlichen ist gerade nicht möglich.",
      notLoggedIn: "Melde dich an, um zu veröffentlichen.",
      invalidDeck: "Eines der drei Decks ist nicht gültig: Prüfe es im Deck builder.",
      legendaries: "Die drei Decks brauchen drei verschiedene Legendäre.",
      similar: "Zwei Decks sind sich zu ähnlich: Zwischen je zwei Decks sind mindestens {min} verschiedene Karten nötig.",
      invalidName: "Der Name braucht 3 bis 60 Zeichen.",
      summary: "Der Spielplan braucht mindestens 20 Zeichen.",
      limit: "Du hast die Höchstzahl an Turnierdecks für dein Konto erreicht (dieselbe wie bei Einzeldecks). Blende eines aus oder lösche es, um ein weiteres zu veröffentlichen.",
      limitAuthor: "Du hast die Höchstzahl von 20 Turnierdecks für die Rolle Autor erreicht. Lösche eines, um ein weiteres zu veröffentlichen.",
      unavailable: "Turnierdecks sind noch nicht verfügbar: Versuch es in ein paar Minuten noch einmal.",
      forbidden: "Du kannst dieses Turnierdeck nicht bearbeiten.",
      db: "Beim Speichern ist etwas schiefgelaufen. Versuch es noch einmal.",
    },
  },
  owner: {
    edit: "Bearbeiten",
    hide: "Ausblenden",
    unhide: "Wieder online stellen",
    delete: "Löschen",
    confirmDelete: "Dieses Turnierdeck und seine Bewertungen löschen?",
    hidden: "Ausgeblendet",
  },
  account: {
    title: "Deine Turnierdecks",
    intro: "Sets aus drei Conquest-Decks, mit einem Guide veröffentlicht.",
    empty: "Du hast noch keine Turnierdecks veröffentlicht.",
    cta: "Drei Decks im Deck builder bauen",
    view: "Öffnen",
    limit: "{used} von {cap} veröffentlicht",
  },
  profile: { title: "Turnierdecks" },
  builder: {
    publish: "Die 3 Decks veröffentlichen",
    hint: "Um sie als Turnierdeck zu veröffentlichen, vervollständige die drei Decks und halte dich an die Conquest-Regeln.",
  },
};

const ru: DeckSetLabels = {
  nav: { single: "Одиночные колоды", tournament: "Турнирные колоды", tabs: "Разделы колод" },
  list: {
    kicker: "Колоды",
    title: "Турнирные колоды",
    metaTitle: "Турнирные колоды Origins TCG: наборы Conquest с гайдами",
    description: "Наборы из трёх колод Conquest для турниров Origins TCG вроде Crimson Cup, опубликованные игроками с гайдом: три разные Легендарные карты, коды игры и оценки.",
    publishCta: "Опубликовать турнирную колоду",
    intro:
      "Турнирная колода — это набор из трёх колод, которые играют вместе в турнире Conquest, с одним гайдом о том, как они работают в команде. Каждый набор здесь соответствует правилам Crimson Cup: три разные Легендарные карты и не меньше {min} разных уникальных карт между любыми двумя колодами.",
    rules: "Соберите три колоды в конструкторе колод (турнирный режим), затем опубликуйте их вместе с гайдом. Каждую колоду можно скопировать в игру по её собственному коду.",
    empty: "Турнирных колод пока нет",
    emptyText: "Будьте первыми: соберите три колоды Conquest в конструкторе колод и опубликуйте их с гайдом.",
    filterLegendary: "Легендарная карта",
    all: "Все",
    sortBy: "Сортировка",
    sortNewest: "Новые",
    sortRated: "Лучшие по оценкам",
    results: "Наборов: {n}",
    noResults: "Нет наборов, подходящих под эти фильтры.",
    by: "автор: {name}",
    votesOne: "1 оценка",
    votesMany: "Оценок: {n}",
    noVotes: "Оценок пока нет",
  },
  page: {
    kicker: "Турнирная колода",
    deckLetter: "Колода {letter}",
    decksTitle: "Три колоды",
    role: "Роль в наборе",
    summary: "План игры",
    guide: "Гайд",
    sections: { strengths: "Сильные стороны", weaknesses: "Слабые стороны", matchups: "Матчапы", notes: "Заметки" },
    openSetInBuilder: "Открыть три колоды в конструкторе колод",
    openDeckInBuilder: "Открыть в конструкторе колод",
    openSet: "Открыть страницу турнирной колоды",
    conquestTitle: "Правила Conquest",
    conquestOk: "Три разные Легендарные карты и не меньше {min} разных уникальных карт между любыми двумя колодами, как в Crimson Cup.",
    pairDiff: "{a} и {b}: разных карт — {n}",
    others: "Другие турнирные колоды",
    newTitle: "Ваша турнирная колода опубликована",
    newText: "Поделитесь ссылкой: любой может открыть три колоды, скопировать коды игры и поставить оценку.",
    metaTail: "Три колоды Conquest с кодами игры, гайдом и оценками на OriginsMeta.",
    titleTemplate: "{name}: турнирная колода с {legendaries}",
    lead: "Турнирная колода Origins TCG, автор {author}: {legendaries}.",
    report: "Пожаловаться на эту турнирную колоду",
  },
  form: {
    publishTitle: "Опубликовать турнирную колоду",
    publishIntro: "Три колоды Conquest, опубликованные вместе, с одним гайдом. Три колоды берутся из конструктора колод (турнирный режим) или из их кодов.",
    editTitle: "Редактировать турнирную колоду",
    decksTitle: "Три колоды",
    name: "Название набора",
    namePlaceholder: "например, контроль-трио для Crimson Cup",
    deckName: "Название колоды",
    archetype: "Архетип",
    lang: "Язык гайда",
    langHint: "Пишите на одном языке: сайт сам переведёт гайд на остальные.",
    summary: "План игры для трёх колод",
    summaryHint: "Как три колоды работают вместе: что закрывает каждая, что вы играете первым. От 20 до 600 символов.",
    summaryPlaceholder: "Три разных плана, чтобы соперник не мог подготовиться к одному…",
    deckRole: "Роль колоды {deck}",
    deckRolePlaceholder: "Когда её выбирать, какие матчапы она выигрывает, чего опасаться…",
    moreDetails: "Подробнее о наборе",
    moreDetailsHint: "Сильные и слабые стороны, матчапы, заметки, видео и ссылки: по желанию.",
    strengths: "Сильные стороны",
    weaknesses: "Слабые стороны",
    matchups: "Матчапы",
    notes: "Заметки",
    consent: "Публикуя, вы соглашаетесь, что три колоды и гайд будут общедоступны вместе с вашим именем пользователя.",
    submit: "Опубликовать турнирную колоду",
    submitting: "Публикуем…",
    update: "Сохранить изменения",
    updating: "Сохраняем…",
    noDecks:
      "В этом браузере не найдено турнирных колод. Соберите три колоды в конструкторе колод (турнирный режим) и нажмите «Опубликовать 3 колоды» или вставьте сюда их три кода.",
    backToBuilder: "Назад в конструктор колод",
    loginFirst: "Войдите, чтобы опубликовать эти три колоды. Они сохранены в этом браузере, и вы найдёте их здесь, когда вернётесь.",
    pasteLabel: "Три кода колод",
    pasteHint: "Три кода OriginsMeta или ссылки из конструктора колод, по одному в строке.",
    pasteSubmit: "Использовать эти колоды",
    pasteError: "Нужно ровно три читаемых кода колод.",
    fromBuilder: "Взять три колоды из конструктора колод",
    fromBuilderEmpty: "В конструкторе колод в этом браузере нет трёх полных колод.",
    fromBuilderDone: "Колоды взяты из конструктора колод: сохраните, чтобы обновить набор.",
    openInBuilder: "Открыть эти колоды в конструкторе колод",
    words: {
      below: "Слов: {n} из {min}. Если в гайде не меньше {min} слов, страница может появиться в Google; более короткие гайды остаются только на сайте.",
      ok: "Слов: {n}. Гайд полный, страница может появиться в Google.",
    },
    issues: {
      count: "В турнирной колоде ровно три колоды.",
      legendaries: "Трём колодам нужны три разные Легендарные карты.",
      similar: "В колодах {a} и {b} разных карт только {n}: нужно не меньше {min}.",
      incomplete: "Каждой колоде нужны Легендарная карта и 12 базовых карт.",
    },
    errors: {
      disabled: "Публикация сейчас недоступна.",
      notLoggedIn: "Войдите, чтобы опубликовать.",
      invalidDeck: "Одна из трёх колод недействительна: проверьте её в конструкторе колод.",
      legendaries: "Трём колодам нужны три разные Легендарные карты.",
      similar: "Две колоды слишком похожи: между любыми двумя колодами нужно не меньше {min} разных карт.",
      invalidName: "В названии должно быть от 3 до 60 символов.",
      summary: "В плане игры должно быть не меньше 20 символов.",
      limit: "Вы достигли лимита турнирных колод для вашего аккаунта (такого же, как для одиночных колод). Скройте или удалите одну, чтобы опубликовать другую.",
      limitAuthor: "Вы достигли лимита в 20 турнирных колод для роли Автор. Удалите одну, чтобы опубликовать другую.",
      unavailable: "Турнирные колоды пока недоступны: попробуйте через несколько минут.",
      forbidden: "Вы не можете редактировать эту турнирную колоду.",
      db: "При сохранении что-то пошло не так. Попробуйте ещё раз.",
    },
  },
  owner: {
    edit: "Редактировать",
    hide: "Скрыть",
    unhide: "Вернуть на сайт",
    delete: "Удалить",
    confirmDelete: "Удалить эту турнирную колоду и её оценки?",
    hidden: "Скрыта",
  },
  account: {
    title: "Ваши турнирные колоды",
    intro: "Наборы из трёх колод Conquest, опубликованные с гайдом.",
    empty: "Вы ещё не опубликовали ни одной турнирной колоды.",
    cta: "Собрать три колоды в конструкторе колод",
    view: "Открыть",
    limit: "Опубликовано: {used} из {cap}",
  },
  profile: { title: "Турнирные колоды" },
  builder: {
    publish: "Опубликовать 3 колоды",
    hint: "Чтобы опубликовать их как турнирную колоду, заполните три колоды и соблюдайте правила Conquest.",
  },
};

export const deckSetLabels: Record<Locale, DeckSetLabels> = { en, it, es, fr, pt, de, ru };

/** Lettera di un mazzo del trio: A, B, C. */
export const deckLetter = (i: number) => String.fromCharCode(65 + i);
