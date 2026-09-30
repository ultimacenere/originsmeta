import type { Locale } from "./i18n";

/**
 * Testi del confronto fra due mazzi (/decks/compare, 30/09/2026). `en` è il tipo di riferimento; segnaposto fra graffe
 * ({n}, {min}). Nessun import a runtime: il test in deckCompare.test.ts lo carica con `node --test`.
 */
const en = {
  title: "Compare two decks",
  metaTitle: "Compare two Origins TCG decks",
  description: "Paste two Origins TCG decks and see the cards they share, the ones only one has, and how many different cards they have for Conquest.",
  intro: "Paste two decks: a community deck page link, a deck builder link or code, or the game code (KGBLDC…). Nothing is saved.",
  deckA: "First deck",
  deckB: "Second deck",
  placeholder: "Link of a deck, deck builder code or game code",
  compare: "Compare",
  swap: "Swap",
  loading: "Loading…",
  errors: {
    invalid: "This is not a deck link or code we can read.",
    notFound: "No published deck at this link.",
    unreadable: "The code can't be read: copy it again from the game or the deck builder.",
    network: "The deck couldn't be loaded: check your connection and try again.",
  },
  unknownCards: "{n} cards of the game code aren't in our database yet: they are left out.",
  legendary: "Legendary",
  sameLegendary: "Same Legendary",
  shared: "In common",
  onlyIn: "Only in {name}",
  none: "None",
  sharedCount: "{n} of 12 base cards in common",
  /** carte uniche (Leggendaria compresa) che un mazzo ha e l'altro no, contate come nel Conquest */
  different: "{name} has {n} cards the other deck doesn't",
  conquestOk: "Enough for a Conquest line-up: at least {min} different cards each way.",
  conquestNo: "Not enough for a Conquest line-up: at least {min} different cards each way are needed.",
  openBuilder: "Open in the deck builder",
  compareCta: "Compare with another deck",
  unnamed: "Deck",
};

export type DeckCompareLabels = typeof en;

const it: DeckCompareLabels = {
  title: "Confronta due mazzi",
  metaTitle: "Confronta due mazzi di Origins TCG",
  description: "Incolla due mazzi di Origins TCG e vedi le carte in comune, quelle che ha solo uno dei due e quante carte diverse hanno per il Conquest.",
  intro: "Incolla due mazzi: il link di un mazzo della community, il link o il codice del deck builder, oppure il codice del gioco (KGBLDC…). Non si salva niente.",
  deckA: "Primo mazzo",
  deckB: "Secondo mazzo",
  placeholder: "Link di un mazzo, codice del deck builder o codice del gioco",
  compare: "Confronta",
  swap: "Scambia",
  loading: "Caricamento…",
  errors: {
    invalid: "Non è un link o un codice di mazzo che sappiamo leggere.",
    notFound: "A questo link non c'è un mazzo pubblicato.",
    unreadable: "Il codice non si legge: copialo di nuovo dal gioco o dal deck builder.",
    network: "Il mazzo non si è caricato: controlla la connessione e riprova.",
  },
  unknownCards: "{n} carte del codice del gioco non sono ancora nel nostro database: restano fuori.",
  legendary: "Leggendaria",
  sameLegendary: "Stessa Leggendaria",
  shared: "In comune",
  onlyIn: "Solo in {name}",
  none: "Nessuna",
  sharedCount: "{n} carte base su 12 in comune",
  different: "{name} ha {n} carte che l'altro mazzo non ha",
  conquestOk: "Bastano per una formazione Conquest: almeno {min} carte diverse in tutti e due i sensi.",
  conquestNo: "Non bastano per una formazione Conquest: servono almeno {min} carte diverse in tutti e due i sensi.",
  openBuilder: "Apri nel deck builder",
  compareCta: "Confronta con un altro mazzo",
  unnamed: "Mazzo",
};

const es: DeckCompareLabels = {
  title: "Compara dos mazos",
  metaTitle: "Compara dos mazos de Origins TCG",
  description: "Pega dos mazos de Origins TCG y mira las cartas en común, las que solo tiene uno y cuántas cartas distintas tienen para Conquest.",
  intro: "Pega dos mazos: el enlace de un mazo de la comunidad, el enlace o el código del deck builder, o el código del juego (KGBLDC…). No se guarda nada.",
  deckA: "Primer mazo",
  deckB: "Segundo mazo",
  placeholder: "Enlace de un mazo, código del deck builder o código del juego",
  compare: "Comparar",
  swap: "Intercambiar",
  loading: "Cargando…",
  errors: {
    invalid: "No es un enlace o código de mazo que sepamos leer.",
    notFound: "En este enlace no hay un mazo publicado.",
    unreadable: "El código no se puede leer: cópialo de nuevo desde el juego o el deck builder.",
    network: "El mazo no se cargó: revisa tu conexión y vuelve a intentarlo.",
  },
  unknownCards: "{n} cartas del código del juego aún no están en nuestra base de datos: quedan fuera.",
  legendary: "Legendaria",
  sameLegendary: "Misma Legendaria",
  shared: "En común",
  onlyIn: "Solo en {name}",
  none: "Ninguna",
  sharedCount: "{n} de 12 cartas base en común",
  different: "{name} tiene {n} cartas que el otro mazo no tiene",
  conquestOk: "Suficientes para una formación de Conquest: al menos {min} cartas distintas en ambos sentidos.",
  conquestNo: "No bastan para una formación de Conquest: hacen falta al menos {min} cartas distintas en ambos sentidos.",
  openBuilder: "Abrir en el deck builder",
  compareCta: "Comparar con otro mazo",
  unnamed: "Mazo",
};

export const deckCompareLabels: Record<Locale, DeckCompareLabels> = { en, it, es };
