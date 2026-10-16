import type { BroadcastLang, PhaseLabels } from "./state";

/**
 * Testi dell'overlay di Broadcasting OM nelle quattro lingue del sito (la lingua la sceglie la regia: è quella della
 * diretta, non del browser di chi guarda). Francese con lo spazio insecabile prima di ! ? : ; (docs/francese.md).
 * La dicitura "non affiliato a Koin Games" c'è sempre, in ogni lingua.
 */
export type OverlayLabels = {
  score: string;
  /** "Mazzo {n}" */
  deck: string;
  showDeck: string;
  hideDeck: string;
  inPlay: string;
  copyDeck: string;
  copied: string;
  noCode: string;
  left: string;
  bestOf: string;
  wins: string;
  unofficial: string;
  phases: PhaseLabels;
};

const NB = " ";

export const overlayLabels: Record<BroadcastLang, OverlayLabels> = {
  en: {
    score: "Score",
    deck: "Deck {n}",
    showDeck: "Click for the deck",
    hideDeck: "Hide the deck",
    inPlay: "In play",
    copyDeck: "Copy deck",
    copied: "Copied!",
    noCode: "Code not available",
    left: "left",
    bestOf: "Bo{n}",
    wins: "{name} wins",
    unofficial: "OriginsMeta · not affiliated with Koin Games",
    phases: { final: "Final", semi: "Semifinal", quarter: "Quarterfinal", round: "Round {n}" },
  },
  it: {
    score: "Score",
    deck: "Mazzo {n}",
    showDeck: "Clicca per il mazzo",
    hideDeck: "Chiudi il mazzo",
    inPlay: "In campo",
    copyDeck: "Copia mazzo",
    copied: "Copiato!",
    noCode: "Codice non disponibile",
    left: "rimaste",
    bestOf: "Bo{n}",
    wins: "Vince {name}",
    unofficial: "OriginsMeta · non affiliato a Koin Games",
    phases: { final: "Finale", semi: "Semifinale", quarter: "Quarti di finale", round: "Turno {n}" },
  },
  es: {
    score: "Marcador",
    deck: "Mazo {n}",
    showDeck: "Haz clic para ver el mazo",
    hideDeck: "Cerrar el mazo",
    inPlay: "En juego",
    copyDeck: "Copiar mazo",
    copied: "¡Copiado!",
    noCode: "Código no disponible",
    left: "quedan",
    bestOf: "Bo{n}",
    wins: "Gana {name}",
    unofficial: "OriginsMeta · no afiliado a Koin Games",
    phases: { final: "Final", semi: "Semifinal", quarter: "Cuartos de final", round: "Ronda {n}" },
  },
  fr: {
    score: "Score",
    deck: "Deck {n}",
    showDeck: "Cliquez pour voir le deck",
    hideDeck: "Fermer le deck",
    inPlay: "En jeu",
    copyDeck: "Copier le deck",
    copied: `Copié${NB}!`,
    noCode: "Code non disponible",
    left: "restantes",
    bestOf: "Bo{n}",
    wins: `Victoire de ${"{name}"}`,
    unofficial: "OriginsMeta · non affilié à Koin Games",
    phases: { final: "Finale", semi: "Demi-finale", quarter: "Quart de finale", round: "Tour {n}" },
  },
};

export function fillLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/**
 * Testi della regia (/broadcast): italiano e inglese, perché è lo strumento di chi trasmette e il prototipo si mostra
 * anche a Koin Games. Le altre due lingue arrivano con il prodotto vero.
 */
export type RegiaLang = "it" | "en";

export const regiaLabels = {
  it: {
    title: "Regia",
    intro: "Qui prepari quello che il pubblico vede sopra la partita. Ogni modifica arriva subito all'overlay aperto in questo browser o nel dock di OBS.",
    demo: "Partita di prova",
    clear: "Svuota tutto",
    overlayLang: "Lingua dell'overlay",
    uiLang: "Lingua della regia",
    tournament: "Torneo",
    tag: "Tag del torneo (OM-XXXX)",
    load: "Carica",
    loading: "Carico…",
    pickMatch: "Scegli la partita",
    matchesNone: "Il tabellone non è ancora pronto.",
    decksHidden: "Le liste di questo torneo non sono visibili con il tuo accesso: incolla i codici dei mazzi qui sotto.",
    name: "Nome del torneo",
    number: "Numero",
    phase: "Fase",
    bestOf: "Formato",
    players: "Giocatori",
    top: "In alto nella schermata",
    bottom: "In basso nella schermata",
    swap: "Scambia i giocatori",
    playerName: "Nome",
    playerTitle: "Sotto il nome (facoltativo)",
    score: "Punteggio",
    inPlay: "Mazzo in campo",
    list: "Lista del mazzo",
    sides: { left: "A sinistra", right: "A destra", off: "Nascosta" },
    deck: "Mazzo {n}",
    deckName: "Nome del mazzo",
    pasteCode: "Incolla il codice del gioco (KGBLDC…)",
    deckSet: "Mazzo torneo del sito (link o slug)",
    addDeck: "Aggiungi un mazzo",
    removeDeck: "Togli",
    resetCopies: "Rimetti le copie",
    nextGame: "Nuova partita (rimetti tutte le copie)",
    resetSeries: "Azzera la serie",
    output: "Overlay per la diretta",
    outputText: "In OBS: sorgente browser 1920 × 1080 con questo indirizzo. Per gli aggiornamenti al volo apri questa regia come dock di OBS (Docks → Custom Browser Docks), oppure apri l'overlay in una finestra di questo browser e catturala.",
    copyLink: "Copia il link per OBS",
    linkCopied: "Link copiato",
    openWindow: "Apri l'overlay in una finestra",
    viewerDemo: "Vedi come il pubblico",
    preview: "Anteprima",
    previewHint: "Clic su una carta della lista: una copia giocata. Quando sono finite, il clic le rimette.",
    background: "Sfondo dell'anteprima",
    noBackground: "Nessuno",
    screen: "Partita {n}",
    errors: {
      code: "Codice non valido: copialo di nuovo dal gioco.",
      unknown: "{n} carte del codice non sono nel nostro database.",
      tag: "Tag non valido: è OM- e quattro caratteri.",
      missing: "Non trovato.",
      network: "Il sito non risponde: riprova fra poco.",
    },
    loaded: "Caricato.",
    cards: "{n} carte",
    empty: "vuoto",
  },
  en: {
    title: "Control room",
    intro: "Set up what the audience sees over the match. Every change reaches the overlay open in this browser or in the OBS dock right away.",
    demo: "Demo match",
    clear: "Clear all",
    overlayLang: "Overlay language",
    uiLang: "Control room language",
    tournament: "Tournament",
    tag: "Tournament tag (OM-XXXX)",
    load: "Load",
    loading: "Loading…",
    pickMatch: "Pick the match",
    matchesNone: "The bracket is not ready yet.",
    decksHidden: "This tournament's decklists are not visible with your access: paste the deck codes below.",
    name: "Tournament name",
    number: "Number",
    phase: "Stage",
    bestOf: "Format",
    players: "Players",
    top: "Top of the screen",
    bottom: "Bottom of the screen",
    swap: "Swap players",
    playerName: "Name",
    playerTitle: "Under the name (optional)",
    score: "Score",
    inPlay: "Deck in play",
    list: "Decklist",
    sides: { left: "Left", right: "Right", off: "Hidden" },
    deck: "Deck {n}",
    deckName: "Deck name",
    pasteCode: "Paste the game code (KGBLDC…)",
    deckSet: "Tournament deck from the site (link or slug)",
    addDeck: "Add a deck",
    removeDeck: "Remove",
    resetCopies: "Reset copies",
    nextGame: "Next game (reset all copies)",
    resetSeries: "Reset the series",
    output: "Overlay for the stream",
    outputText: "In OBS: a 1920 × 1080 browser source with this address. For live updates open this control room as an OBS dock (Docks → Custom Browser Docks), or open the overlay in a window of this browser and capture it.",
    copyLink: "Copy the OBS link",
    linkCopied: "Link copied",
    openWindow: "Open the overlay in a window",
    viewerDemo: "See it as the audience",
    preview: "Preview",
    previewHint: "Click a card in the list: one copy played. When they run out, a click puts them back.",
    background: "Preview background",
    noBackground: "None",
    screen: "Match {n}",
    errors: {
      code: "Invalid code: copy it again from the game.",
      unknown: "{n} cards in the code are not in our database.",
      tag: "Invalid tag: it is OM- and four characters.",
      missing: "Not found.",
      network: "The site is not answering: try again shortly.",
    },
    loaded: "Loaded.",
    cards: "{n} cards",
    empty: "empty",
  },
} as const;

export type RegiaLabels = (typeof regiaLabels)[RegiaLang];
