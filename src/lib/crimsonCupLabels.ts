import type { Locale } from "./i18n";

/*
  Testi della pagina /analytics/crimson-cup, del riquadro "Nella Crimson Cup" delle schede carta e della fascia di
  /analytics (20/10/2026), nelle cinque lingue. Nessun import a runtime: li legge anche il test (crimsonCup.test.ts), che
  controlla title e description nei limiti di Google e gli stessi segnaposto {…} in ogni lingua.

  Parole: "mazzi consegnati" / decks submitted / mazos entregados / decks remis / decks entregues (la consegna dei mazzi
  del check-in, come in events.ts); bandire / ban / banear / bannir / banir; "turno" del tabellone (round, ronda, tour,
  rodada); "ladder" resta in inglese (gergo, come nei glossari di docs/). Francese con lo spazio insecabile ( )
  prima di : ; ? ! e dentro « », come docs/francese.md. Mai il numero di iscritti o di giocatori.
*/

type Term = { term: string; text: string };

export type CrimsonLabels = {
  meta: { title: string; description: string };
  h1: string;
  kicker: string;
  back: string;
  howTo: string;
  rules: string;
  picker: { label: string; soon: string; data: string };
  index: { legendaries: string; cards: string; versus: string };
  snapshot: {
    title: string;
    plate: string;
    source: string;
    reached: string;
    reachedSub: string;
    bans: string;
    bansSub: string;
    mostBanned: string;
    mostBannedSub: string;
    mostSubmitted: string;
    mostSubmittedSub: string;
    topCard: string;
    topCardSub: string;
  };
  stories: {
    label: string;
    banned: { kicker: string; text: string };
    brought: { kicker: string; text: string };
    calm: { kicker: string; text: string; ladder: string };
    link: string;
  };
  legendaries: {
    kicker: string;
    title: string;
    meta: string;
    lead: string;
    bannedTitle: string;
    broughtTitle: string;
    broughtLead: string;
    rowBan: string;
    rowDecks: string;
    roundTitle: string;
    qualified: string;
    tableSummary: string;
    tableCaption: string;
    cols: { legendary: string; banRate: string; bannedSeen: string; submitted: string; share: string; played: string; deepest: string };
  };
  cards: { kicker: string; title: string; meta: string; lead: string; decks: string; position: string; tableSummary: string };
  versus: {
    kicker: string;
    title: string;
    meta: string;
    lead: string;
    legTitle: string;
    legend: { crimson: string; ladder: string };
    up: string;
    down: string;
    aria: string;
    cols: { legendary: string; crimson: string; ladder: string; diff: string; ladderWr: string; banRate: string };
    cardsTitle: string;
    cardsLead: string;
    cardCols: { card: string; crimson: string; ladder: string; diff: string };
    missing: string;
    none: string;
  };
  notes: {
    title: string;
    intro: string;
    sourceLabel: string;
    source: string;
    discord: string;
    ladderLabel: string;
    ladder: string;
    wordsTitle: string;
    glossary: Term[];
    dataTitle: string;
    list: string[];
    analyticsText: string;
    analyticsAnchor: string;
    rulesText: string;
    rulesAnchor: string;
    conquestText: string;
    conquestAnchor: string;
  };
  card: { title: string; legendary: string; reached: string; furthest: string; card: string; link: string; source: string };
  promo: { plate: string; title: string; text: string; cta: string; banned: string; brought: string; card: string };
};

/** Numero d'ordine nella lingua: 1st / 1ª / 1.ª / 1re / 1ª (Leggendaria e carta sono femminili dove serve). */
export function crimsonOrdinal(n: number, locale: Locale): string {
  if (locale === "it" || locale === "pt") return `${n}ª`;
  if (locale === "es") return `${n}.ª`;
  if (locale === "fr") return n === 1 ? "1re" : `${n}e`;
  const mod100 = n % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

export const crimsonCupLabels: Record<Locale, CrimsonLabels> = {
  en: {
    meta: {
      title: "Origins TCG Crimson Cup stats: bans and top cards",
      description: "Crimson Cup stats from Koin Games' official tables: ban rate of every Legendary, decks submitted, the most played cards and the tournament against the ladder.",
    },
    h1: "Crimson Cup: the tournament meta",
    kicker: "Analytics",
    back: "Analytics",
    howTo: "How to read the numbers",
    rules: "Crimson Cup rules",
    picker: { label: "Qualifiers", soon: "numbers not out yet", data: "official numbers" },
    index: { legendaries: "Legendaries", cards: "Most played cards", versus: "Tournament vs ladder" },
    snapshot: {
      title: "The qualifier at a glance",
      plate: "Crimson Cup",
      source: "Official Koin Games numbers",
      reached: "Legendaries in the top 32",
      reachedSub: "with a deck in round {round}, the round of the qualified",
      bans: "Bans",
      bansSub: "Legendaries banned in the bracket",
      mostBanned: "Most banned",
      mostBannedSub: "{b} bans out of {s} times seen",
      mostSubmitted: "Most brought",
      mostSubmittedSub: "{n} decks · {p} of those submitted",
      topCard: "Most played card",
      topCardSub: "in {n} of the decks submitted",
    },
    stories: {
      label: "The qualifier in three facts",
      banned: { kicker: "The one to ban", text: "{name} is the Legendary opponents feared most: banned {p} of the times they found it in front of them at the ban." },
      brought: { kicker: "The most brought", text: "{name} is in {n} decks, {p} of those submitted, more than any other Legendary, and it still gets banned {ban} of the time." },
      calm: { kicker: "The least feared", text: "{name} is the least banned of the Legendaries seen at least {min} times: {p}.", ladder: " In the ladder it wins {wr}." },
      link: "Tournament vs ladder",
    },
    legendaries: {
      kicker: "Ban phase",
      title: "Ban rate of the Legendaries",
      meta: "{n} Legendaries · {b} bans",
      lead: "In the Crimson Cup you only see your opponent's three Legendaries, then you ban one of their decks. The ban rate is how many times a Legendary was banned out of the times an opponent found it at the ban.",
      bannedTitle: "The most banned",
      broughtTitle: "The most brought",
      broughtLead: "Decks submitted with each Legendary, and their share of the decks in Koin's table.",
      rowBan: "{b} of {s}",
      rowDecks: "{n} decks",
      roundTitle: "Furthest round: {n}",
      qualified: "reached the round of the qualified",
      tableSummary: "Koin's full table",
      tableCaption: "{name}: the Legendaries in Koin's table, from the most banned",
      cols: { legendary: "Legendary", banRate: "Ban rate", bannedSeen: "Banned / seen", submitted: "Decks", share: "Share", played: "Played", deepest: "Furthest round" },
    },
    cards: {
      kicker: "Decklists",
      title: "The most played cards",
      meta: "Top {n} of Koin's table",
      lead: "Share of all the decks submitted that contain the card: it covers everyone who entered, not only those who played a match.",
      decks: "{n} decks",
      position: "Position {n}",
      tableSummary: "The table",
    },
    versus: {
      kicker: "Tournament vs ladder",
      title: "The tournament next to the ladder",
      meta: "Ladder: {games} on patch {patch}",
      lead: "The tournament counts the decks players submitted, the ladder the matches recorded with OriginsMeta Tracker. A Legendary brought to the tournament more than it is played in the ladder is a deck players trust when it counts.",
      legTitle: "Legendaries: share of decks in the tournament, share of games in the ladder",
      legend: { crimson: "Crimson Cup", ladder: "Ladder" },
      up: "{name} is brought to the tournament more ({c}) than it is played in the ladder ({l}).",
      down: "{name} is played in the ladder more ({l}) than it was brought to the tournament ({c}).",
      aria: "{name}: {c} of the decks in the tournament, {l} of the games in the ladder",
      cols: { legendary: "Legendary", crimson: "Tournament", ladder: "Ladder", diff: "Difference", ladderWr: "Ladder win rate", banRate: "Ban rate" },
      cardsTitle: "The most played cards, in the tournament and in the ladder",
      cardsLead: "For the cards the ladder counts the recorded games with the card in the deck of the player who records: the two measures differ, so compare the cards with each other more than the single gap.",
      cardCols: { card: "Card", crimson: "Tournament", ladder: "Ladder", diff: "Difference" },
      missing: "The ladder numbers are not available right now: the comparison comes back on its own.",
      none: "not recorded",
    },
    notes: {
      title: "How to read these numbers",
      intro: "These are the official numbers of the Crimson Cup, published by Koin Games on its Discord after each qualifier: we put them in order and set them next to the ladder. They are totals: decklists stay hidden until the top 4, so the single lists are not known.",
      sourceLabel: "Source",
      source: "the tables Koin Games published on its official Discord after {name} ({date}), read on {read}.",
      discord: "Official Discord",
      ladderLabel: "Ladder",
      ladder: "the matches recorded with OriginsMeta Tracker on patch {patch}, normal and ranked together.",
      wordsTitle: "The words",
      glossary: [
        { term: "Ban rate", text: "banned / seen: out of the times an opponent found the Legendary in front of them at the ban, how many times they banned it." },
        { term: "Decks", text: "how many of the decks submitted for the qualifier have that Legendary. The share is out of the decks counted in Koin's table." },
        { term: "Played", text: "the Played column of Koin's table, as Koin counts it." },
        { term: "Furthest round", text: "the furthest round of the bracket reached by a deck with that Legendary: round {round} is the round of the 32 qualified." },
        { term: "Share of decks (cards)", text: "the share of all the decks submitted that contain the card, as Koin publishes it." },
        { term: "Ladder", text: "for the Legendaries the share of appearances in the recorded games, counting both players; for the cards the share of recorded games with the card in the deck of the player who records." },
      ],
      dataTitle: "What we know and what we don't",
      list: [
        "Koin publishes the 20 most played cards: the others are not in the table and we don't estimate them.",
        "Tournament and ladder measure different things (decks submitted, games played): the comparison shows the gaps, it is not a win rate.",
        "Each qualifier is added here when Koin publishes its numbers.",
      ],
      analyticsText: "The ladder numbers of the patch, Legendary by Legendary:",
      analyticsAnchor: "Analytics",
      rulesText: "Format, ban and hidden lists of the tournament:",
      rulesAnchor: "Crimson Cup rules",
      conquestText: "How to build three decks for Conquest:",
      conquestAnchor: "Conquest guide",
    },
    card: {
      title: "In the Crimson Cup",
      legendary: "{q}: banned {p} of the times it was seen at the ban ({b} of {s}), {rank} of {count}; in {share} of the decks submitted ({n}).",
      reached: " A deck with it reached round {round}, the round of the qualified.",
      furthest: " Furthest round: {round}.",
      card: "{q}: in {p} of the decks submitted ({n}), {rank} of the {count} most played cards.",
      link: "All the Crimson Cup numbers",
      source: "Official Koin Games numbers",
    },
    promo: {
      plate: "Crimson Cup",
      title: "The tournament numbers",
      text: "Koin Games' official tables after {q}: who gets banned, who gets brought and the most played cards, next to the ladder.",
      cta: "Open the Crimson Cup numbers",
      banned: "Most banned",
      brought: "Most brought",
      card: "Most played card",
    },
  },
  it: {
    meta: {
      title: "Statistiche della Crimson Cup di Origins TCG: ban e carte",
      description: "Statistiche della Crimson Cup dalle tabelle ufficiali di Koin Games: ban rate di ogni Leggendaria, mazzi consegnati, carte più giocate e torneo contro ladder.",
    },
    h1: "Crimson Cup: il meta del torneo",
    kicker: "Analytics",
    back: "Analytics",
    howTo: "Come leggere i numeri",
    rules: "Regole della Crimson Cup",
    picker: { label: "Qualificazioni", soon: "numeri non ancora usciti", data: "numeri ufficiali" },
    index: { legendaries: "Leggendarie", cards: "Carte più giocate", versus: "Torneo contro ladder" },
    snapshot: {
      title: "La qualificazione in sintesi",
      plate: "Crimson Cup",
      source: "Numeri ufficiali di Koin Games",
      reached: "Leggendarie nella top 32",
      reachedSub: "con un mazzo al turno {round}, quello dei qualificati",
      bans: "Ban",
      bansSub: "Leggendarie bandite nel tabellone",
      mostBanned: "La più bandita",
      mostBannedSub: "{b} ban su {s} volte vista",
      mostSubmitted: "La più portata",
      mostSubmittedSub: "{n} mazzi · {p} dei consegnati",
      topCard: "La carta più giocata",
      topCardSub: "in {n} dei mazzi consegnati",
    },
    stories: {
      label: "La qualificazione in tre fatti",
      banned: { kicker: "Quella da bandire", text: "{name} è la Leggendaria che gli avversari hanno temuto di più: bandita il {p} delle volte in cui se la sono trovata davanti al ban." },
      brought: { kicker: "La più portata", text: "{name} è in {n} mazzi, il {p} dei consegnati, più di qualsiasi altra Leggendaria, e viene bandita comunque il {ban} delle volte." },
      calm: { kicker: "La meno temuta", text: "{name} è la meno bandita fra le Leggendarie viste almeno {min} volte: {p}.", ladder: " In ladder vince il {wr}." },
      link: "Torneo contro ladder",
    },
    legendaries: {
      kicker: "Fase di ban",
      title: "Il ban rate delle Leggendarie",
      meta: "{n} Leggendarie · {b} ban",
      lead: "Nella Crimson Cup dell'avversario vedi solo le tre Leggendarie, poi ne bandisci un mazzo. Il ban rate dice quante volte una Leggendaria è stata bandita sulle volte in cui un avversario se l'è trovata davanti al ban.",
      bannedTitle: "Le più bandite",
      broughtTitle: "Le più portate",
      broughtLead: "I mazzi consegnati con ogni Leggendaria e la loro quota sui mazzi della tabella di Koin.",
      rowBan: "{b} su {s}",
      rowDecks: "{n} mazzi",
      roundTitle: "Turno più avanzato: {n}",
      qualified: "arrivata al turno dei qualificati",
      tableSummary: "La tabella completa di Koin",
      tableCaption: "{name}: le Leggendarie nella tabella di Koin, dalla più bandita",
      cols: { legendary: "Leggendaria", banRate: "Ban rate", bannedSeen: "Bandita / vista", submitted: "Mazzi", share: "Quota", played: "Played", deepest: "Turno più avanzato" },
    },
    cards: {
      kicker: "Liste",
      title: "Le carte più giocate",
      meta: "Le prime {n} della tabella di Koin",
      lead: "Quota di tutti i mazzi consegnati che contengono la carta: conta tutti gli iscritti, non solo chi ha giocato una partita.",
      decks: "{n} mazzi",
      position: "Posizione {n}",
      tableSummary: "La tabella",
    },
    versus: {
      kicker: "Torneo contro ladder",
      title: "Il torneo accanto al ladder",
      meta: "Ladder: {games} sulla patch {patch}",
      lead: "Il torneo conta i mazzi che i giocatori hanno consegnato, il ladder le partite registrate con OriginsMeta Tracker. Una Leggendaria portata al torneo più di quanto si giochi in ladder è un mazzo di cui i giocatori si fidano quando conta.",
      legTitle: "Leggendarie: quota dei mazzi nel torneo, quota delle partite in ladder",
      legend: { crimson: "Crimson Cup", ladder: "Ladder" },
      up: "{name} è portata al torneo più ({c}) di quanto si giochi in ladder ({l}).",
      down: "{name} si gioca in ladder più ({l}) di quanto sia stata portata al torneo ({c}).",
      aria: "{name}: {c} dei mazzi nel torneo, {l} delle partite in ladder",
      cols: { legendary: "Leggendaria", crimson: "Torneo", ladder: "Ladder", diff: "Differenza", ladderWr: "Win rate in ladder", banRate: "Ban rate" },
      cardsTitle: "Le carte più giocate, nel torneo e in ladder",
      cardsLead: "Per le carte il ladder conta le partite registrate con la carta nel mazzo di chi registra: le due misure sono diverse, quindi conta il confronto fra una carta e l'altra più della singola differenza.",
      cardCols: { card: "Carta", crimson: "Torneo", ladder: "Ladder", diff: "Differenza" },
      missing: "I numeri del ladder adesso non sono disponibili: il confronto torna da solo.",
      none: "non registrata",
    },
    notes: {
      title: "Come leggere questi numeri",
      intro: "Sono i numeri ufficiali della Crimson Cup, pubblicati da Koin Games sul suo Discord dopo ogni qualificazione: noi li mettiamo in ordine e li affianchiamo al ladder. Sono totali: le liste restano segrete fino alla top 4, quindi le singole liste non si conoscono.",
      sourceLabel: "Fonte",
      source: "le tabelle pubblicate da Koin Games sul suo Discord ufficiale dopo la {name} ({date}), lette il {read}.",
      discord: "Discord ufficiale",
      ladderLabel: "Ladder",
      ladder: "le partite registrate con OriginsMeta Tracker sulla patch {patch}, normali e classificate insieme.",
      wordsTitle: "Le parole",
      glossary: [
        { term: "Ban rate", text: "bandita / vista: sulle volte in cui un avversario si è trovato davanti la Leggendaria al ban, quante volte l'ha bandita." },
        { term: "Mazzi", text: "quanti dei mazzi consegnati per la qualificazione hanno quella Leggendaria. La quota è sui mazzi contati nella tabella di Koin." },
        { term: "Played", text: "la colonna Played della tabella di Koin, come la conta Koin." },
        { term: "Turno più avanzato", text: "il turno più avanzato del tabellone raggiunto da un mazzo con quella Leggendaria: il turno {round} è quello dei 32 qualificati." },
        { term: "Quota dei mazzi (carte)", text: "la quota di tutti i mazzi consegnati che contengono la carta, come la pubblica Koin." },
        { term: "Ladder", text: "per le Leggendarie la quota delle presenze nelle partite registrate, contando tutti e due i giocatori; per le carte la quota delle partite registrate con la carta nel mazzo di chi registra." },
      ],
      dataTitle: "Che cosa sappiamo e che cosa no",
      list: [
        "Koin pubblica le 20 carte più giocate: le altre non sono nella tabella e non le stimiamo.",
        "Torneo e ladder misurano cose diverse (mazzi consegnati, partite giocate): il confronto mostra le differenze, non è un win rate.",
        "Ogni qualificazione si aggiunge qui quando Koin ne pubblica i numeri.",
      ],
      analyticsText: "I numeri del ladder della patch, Leggendaria per Leggendaria:",
      analyticsAnchor: "Analytics",
      rulesText: "Formato, ban e liste segrete del torneo:",
      rulesAnchor: "Regole della Crimson Cup",
      conquestText: "Come costruire tre mazzi per il Conquest:",
      conquestAnchor: "Guida al Conquest",
    },
    card: {
      title: "Nella Crimson Cup",
      legendary: "{q}: bandita il {p} delle volte in cui è stata vista al ban ({b} su {s}), {rank} su {count}; nel {share} dei mazzi consegnati ({n}).",
      reached: " Un mazzo con lei è arrivato al turno {round}, quello dei qualificati.",
      furthest: " Turno più avanzato: {round}.",
      card: "{q}: nel {p} dei mazzi consegnati ({n}), {rank} fra le {count} carte più giocate.",
      link: "Tutti i numeri della Crimson Cup",
      source: "Numeri ufficiali di Koin Games",
    },
    promo: {
      plate: "Crimson Cup",
      title: "I numeri del torneo",
      text: "Le tabelle ufficiali di Koin Games dopo la {q}: chi viene bandita, chi viene portata e le carte più giocate, accanto al ladder.",
      cta: "Apri i numeri della Crimson Cup",
      banned: "La più bandita",
      brought: "La più portata",
      card: "La carta più giocata",
    },
  },
  es: {
    meta: {
      title: "Crimson Cup de Origins TCG: bans y cartas más usadas",
      description: "Estadísticas de la Crimson Cup en las tablas oficiales de Koin Games: ban rate de cada Legendaria, mazos entregados, cartas más usadas y torneo contra ladder.",
    },
    h1: "Crimson Cup: el meta del torneo",
    kicker: "Analytics",
    back: "Analytics",
    howTo: "Cómo leer los números",
    rules: "Reglas de la Crimson Cup",
    picker: { label: "Clasificatorios", soon: "números aún no publicados", data: "números oficiales" },
    index: { legendaries: "Legendarias", cards: "Cartas más usadas", versus: "Torneo frente a ladder" },
    snapshot: {
      title: "El clasificatorio de un vistazo",
      plate: "Crimson Cup",
      source: "Números oficiales de Koin Games",
      reached: "Legendarias en el top 32",
      reachedSub: "con un mazo en la ronda {round}, la de los clasificados",
      bans: "Bans",
      bansSub: "Legendarias baneadas en el cuadro",
      mostBanned: "La más baneada",
      mostBannedSub: "{b} bans de {s} veces vista",
      mostSubmitted: "La más llevada",
      mostSubmittedSub: "{n} mazos · {p} de los entregados",
      topCard: "La carta más usada",
      topCardSub: "en {n} de los mazos entregados",
    },
    stories: {
      label: "El clasificatorio en tres datos",
      banned: { kicker: "La que hay que banear", text: "{name} es la Legendaria que más temieron los rivales: baneada el {p} de las veces que se la encontraron delante en el ban." },
      brought: { kicker: "La más llevada", text: "{name} está en {n} mazos, el {p} de los entregados, más que cualquier otra Legendaria, y aun así la banean el {ban} de las veces." },
      calm: { kicker: "La menos temida", text: "{name} es la menos baneada de las Legendarias vistas al menos {min} veces: {p}.", ladder: " En ladder gana el {wr}." },
      link: "Torneo frente a ladder",
    },
    legendaries: {
      kicker: "Fase de ban",
      title: "El ban rate de las Legendarias",
      meta: "{n} Legendarias · {b} bans",
      lead: "En la Crimson Cup del rival solo ves las tres Legendarias y luego baneas uno de sus mazos. El ban rate dice cuántas veces se baneó una Legendaria de las veces que un rival se la encontró en el ban.",
      bannedTitle: "Las más baneadas",
      broughtTitle: "Las más llevadas",
      broughtLead: "Los mazos entregados con cada Legendaria y su cuota sobre los mazos de la tabla de Koin.",
      rowBan: "{b} de {s}",
      rowDecks: "{n} mazos",
      roundTitle: "Ronda más avanzada: {n}",
      qualified: "llegó a la ronda de los clasificados",
      tableSummary: "La tabla completa de Koin",
      tableCaption: "{name}: las Legendarias de la tabla de Koin, de la más baneada",
      cols: { legendary: "Legendaria", banRate: "Ban rate", bannedSeen: "Baneada / vista", submitted: "Mazos", share: "Cuota", played: "Played", deepest: "Ronda más avanzada" },
    },
    cards: {
      kicker: "Listas",
      title: "Las cartas más usadas",
      meta: "Las {n} primeras de la tabla de Koin",
      lead: "Cuota de todos los mazos entregados que contienen la carta: cuenta a todos los inscritos, no solo a quienes jugaron una partida.",
      decks: "{n} mazos",
      position: "Posición {n}",
      tableSummary: "La tabla",
    },
    versus: {
      kicker: "Torneo frente a ladder",
      title: "El torneo junto al ladder",
      meta: "Ladder: {games} en el parche {patch}",
      lead: "El torneo cuenta los mazos que entregaron los jugadores; el ladder, las partidas registradas con OriginsMeta Tracker. Una Legendaria que se lleva al torneo más de lo que se juega en ladder es un mazo en el que los jugadores confían cuando importa.",
      legTitle: "Legendarias: cuota de mazos en el torneo, cuota de partidas en ladder",
      legend: { crimson: "Crimson Cup", ladder: "Ladder" },
      up: "{name} se lleva al torneo más ({c}) de lo que se juega en ladder ({l}).",
      down: "{name} se juega en ladder más ({l}) de lo que se llevó al torneo ({c}).",
      aria: "{name}: {c} de los mazos en el torneo, {l} de las partidas en ladder",
      cols: { legendary: "Legendaria", crimson: "Torneo", ladder: "Ladder", diff: "Diferencia", ladderWr: "Win rate en ladder", banRate: "Ban rate" },
      cardsTitle: "Las cartas más usadas, en el torneo y en ladder",
      cardsLead: "Para las cartas, el ladder cuenta las partidas registradas con la carta en el mazo de quien registra: las dos medidas son distintas, así que cuenta más la comparación entre cartas que cada diferencia por separado.",
      cardCols: { card: "Carta", crimson: "Torneo", ladder: "Ladder", diff: "Diferencia" },
      missing: "Los números del ladder no están disponibles ahora mismo: la comparación vuelve sola.",
      none: "no registrada",
    },
    notes: {
      title: "Cómo leer estos números",
      intro: "Son los números oficiales de la Crimson Cup, publicados por Koin Games en su Discord después de cada clasificatorio: nosotros los ordenamos y los ponemos junto al ladder. Son totales: las listas siguen ocultas hasta el top 4, así que no se conocen las listas concretas.",
      sourceLabel: "Fuente",
      source: "las tablas que Koin Games publicó en su Discord oficial después del {name} ({date}), consultadas el {read}.",
      discord: "Discord oficial",
      ladderLabel: "Ladder",
      ladder: "las partidas registradas con OriginsMeta Tracker en el parche {patch}, normales y clasificatorias juntas.",
      wordsTitle: "Las palabras",
      glossary: [
        { term: "Ban rate", text: "baneada / vista: de las veces que un rival se encontró la Legendaria en el ban, cuántas veces la baneó." },
        { term: "Mazos", text: "cuántos de los mazos entregados para el clasificatorio llevan esa Legendaria. La cuota es sobre los mazos contados en la tabla de Koin." },
        { term: "Played", text: "la columna Played de la tabla de Koin, tal como la cuenta Koin." },
        { term: "Ronda más avanzada", text: "la ronda más avanzada del cuadro a la que llegó un mazo con esa Legendaria: la ronda {round} es la de los 32 clasificados." },
        { term: "Cuota de mazos (cartas)", text: "la cuota de todos los mazos entregados que contienen la carta, tal como la publica Koin." },
        { term: "Ladder", text: "para las Legendarias, la cuota de apariciones en las partidas registradas contando a los dos jugadores; para las cartas, la cuota de partidas registradas con la carta en el mazo de quien registra." },
      ],
      dataTitle: "Qué sabemos y qué no",
      list: [
        "Koin publica las 20 cartas más usadas: las demás no están en la tabla y no las estimamos.",
        "Torneo y ladder miden cosas distintas (mazos entregados, partidas jugadas): la comparación muestra las diferencias, no es un win rate.",
        "Cada clasificatorio se añade aquí cuando Koin publica sus números.",
      ],
      analyticsText: "Los números del ladder del parche, Legendaria por Legendaria:",
      analyticsAnchor: "Analytics",
      rulesText: "Formato, ban y listas ocultas del torneo:",
      rulesAnchor: "Reglas de la Crimson Cup",
      conquestText: "Cómo construir tres mazos para el Conquest:",
      conquestAnchor: "Guía del Conquest",
    },
    card: {
      title: "En la Crimson Cup",
      legendary: "{q}: baneada el {p} de las veces que se vio en el ban ({b} de {s}), {rank} de {count}; en el {share} de los mazos entregados ({n}).",
      reached: " Un mazo con ella llegó a la ronda {round}, la de los clasificados.",
      furthest: " Ronda más avanzada: {round}.",
      card: "{q}: en el {p} de los mazos entregados ({n}), {rank} de las {count} cartas más usadas.",
      link: "Todos los números de la Crimson Cup",
      source: "Números oficiales de Koin Games",
    },
    promo: {
      plate: "Crimson Cup",
      title: "Los números del torneo",
      text: "Las tablas oficiales de Koin Games tras el {q}: quién se banea, quién se lleva y las cartas más usadas, junto al ladder.",
      cta: "Abrir los números de la Crimson Cup",
      banned: "La más baneada",
      brought: "La más llevada",
      card: "La carta más usada",
    },
  },
  fr: {
    meta: {
      title: "Crimson Cup d'Origins TCG : bans et cartes clés",
      description: "Statistiques de la Crimson Cup selon les tableaux officiels de Koin Games : ban rate des Légendaires, decks remis, cartes les plus jouées, tournoi et ladder.",
    },
    h1: "Crimson Cup : le méta du tournoi",
    kicker: "Analytics",
    back: "Analytics",
    howTo: "Comment lire les chiffres",
    rules: "Règles de la Crimson Cup",
    picker: { label: "Qualifications", soon: "chiffres pas encore publiés", data: "chiffres officiels" },
    index: { legendaries: "Légendaires", cards: "Cartes les plus jouées", versus: "Tournoi et ladder" },
    snapshot: {
      title: "La qualification en un coup d'œil",
      plate: "Crimson Cup",
      source: "Chiffres officiels de Koin Games",
      reached: "Légendaires dans le top 32",
      reachedSub: "avec un deck au tour {round}, celui des qualifiés",
      bans: "Bans",
      bansSub: "Légendaires bannies dans le tableau",
      mostBanned: "La plus bannie",
      mostBannedSub: "{b} bans sur {s} fois vue",
      mostSubmitted: "La plus apportée",
      mostSubmittedSub: "{n} decks · {p} des decks remis",
      topCard: "La carte la plus jouée",
      topCardSub: "dans {n} des decks remis",
    },
    stories: {
      label: "La qualification en trois faits",
      banned: { kicker: "Celle à bannir", text: "{name} est la Légendaire que les adversaires ont le plus redoutée : bannie {p} des fois où ils l'ont trouvée face à eux au ban." },
      brought: { kicker: "La plus apportée", text: "{name} est dans {n} decks, {p} des decks remis, plus que toute autre Légendaire, et elle est quand même bannie {ban} des fois." },
      calm: { kicker: "La moins redoutée", text: "{name} est la moins bannie des Légendaires vues au moins {min} fois : {p}.", ladder: " En ladder, elle gagne {wr}." },
      link: "Tournoi et ladder",
    },
    legendaries: {
      kicker: "Phase de ban",
      title: "Le ban rate des Légendaires",
      meta: "{n} Légendaires · {b} bans",
      lead: "Dans la Crimson Cup, vous ne voyez que les trois Légendaires de l'adversaire, puis vous bannissez un de ses decks. Le ban rate indique combien de fois une Légendaire a été bannie sur les fois où un adversaire l'a trouvée au ban.",
      bannedTitle: "Les plus bannies",
      broughtTitle: "Les plus apportées",
      broughtLead: "Les decks remis avec chaque Légendaire et leur part des decks du tableau de Koin.",
      rowBan: "{b} sur {s}",
      rowDecks: "{n} decks",
      roundTitle: "Tour le plus avancé : {n}",
      qualified: "a atteint le tour des qualifiés",
      tableSummary: "Le tableau complet de Koin",
      tableCaption: "{name} : les Légendaires du tableau de Koin, de la plus bannie",
      cols: { legendary: "Légendaire", banRate: "Ban rate", bannedSeen: "Bannie / vue", submitted: "Decks", share: "Part", played: "Played", deepest: "Tour le plus avancé" },
    },
    cards: {
      kicker: "Listes",
      title: "Les cartes les plus jouées",
      meta: "Les {n} premières du tableau de Koin",
      lead: "Part de tous les decks remis qui contiennent la carte : elle compte tous les inscrits, pas seulement ceux qui ont joué un match.",
      decks: "{n} decks",
      position: "Position {n}",
      tableSummary: "Le tableau",
    },
    versus: {
      kicker: "Tournoi et ladder",
      title: "Le tournoi à côté du ladder",
      meta: "Ladder : {games} sur le patch {patch}",
      lead: "Le tournoi compte les decks remis par les joueurs, le ladder les parties enregistrées avec OriginsMeta Tracker. Une Légendaire apportée au tournoi plus qu'elle n'est jouée en ladder est un deck auquel les joueurs font confiance quand ça compte.",
      legTitle: "Légendaires : part des decks dans le tournoi, part des parties en ladder",
      legend: { crimson: "Crimson Cup", ladder: "Ladder" },
      up: "{name} est plus apportée au tournoi ({c}) qu'elle n'est jouée en ladder ({l}).",
      down: "{name} est plus jouée en ladder ({l}) qu'elle n'a été apportée au tournoi ({c}).",
      aria: "{name} : {c} des decks dans le tournoi, {l} des parties en ladder",
      cols: { legendary: "Légendaire", crimson: "Tournoi", ladder: "Ladder", diff: "Écart", ladderWr: "Win rate en ladder", banRate: "Ban rate" },
      cardsTitle: "Les cartes les plus jouées, dans le tournoi et en ladder",
      cardsLead: "Pour les cartes, le ladder compte les parties enregistrées avec la carte dans le deck du joueur qui enregistre : les deux mesures sont différentes, comparez donc les cartes entre elles plutôt que chaque écart isolé.",
      cardCols: { card: "Carte", crimson: "Tournoi", ladder: "Ladder", diff: "Écart" },
      missing: "Les chiffres du ladder ne sont pas disponibles pour le moment : la comparaison reviendra d'elle-même.",
      none: "non enregistrée",
    },
    notes: {
      title: "Comment lire ces chiffres",
      intro: "Ce sont les chiffres officiels de la Crimson Cup, publiés par Koin Games sur son Discord après chaque qualification : nous les mettons en ordre et les plaçons à côté du ladder. Ce sont des totaux : les listes restent cachées jusqu'au top 4, on ne connaît donc pas les listes une par une.",
      sourceLabel: "Source",
      source: "les tableaux publiés par Koin Games sur son Discord officiel après la qualification {name} ({date}), lus le {read}.",
      discord: "Discord officiel",
      ladderLabel: "Ladder",
      ladder: "les parties enregistrées avec OriginsMeta Tracker sur le patch {patch}, normales et classées ensemble.",
      wordsTitle: "Les mots",
      glossary: [
        { term: "Ban rate", text: "bannie / vue : sur les fois où un adversaire a trouvé la Légendaire face à lui au ban, combien de fois il l'a bannie." },
        { term: "Decks", text: "combien des decks remis pour la qualification ont cette Légendaire. La part est calculée sur les decks comptés dans le tableau de Koin." },
        { term: "Played", text: "la colonne Played du tableau de Koin, telle que Koin la compte." },
        { term: "Tour le plus avancé", text: "le tour le plus avancé du tableau atteint par un deck avec cette Légendaire : le tour {round} est celui des 32 qualifiés." },
        { term: "Part des decks (cartes)", text: "la part de tous les decks remis qui contiennent la carte, telle que Koin la publie." },
        { term: "Ladder", text: "pour les Légendaires, la part des apparitions dans les parties enregistrées en comptant les deux joueurs ; pour les cartes, la part des parties enregistrées avec la carte dans le deck du joueur qui enregistre." },
      ],
      dataTitle: "Ce que nous savons et ce que nous ne savons pas",
      list: [
        "Koin publie les 20 cartes les plus jouées : les autres ne sont pas dans le tableau et nous ne les estimons pas.",
        "Tournoi et ladder mesurent des choses différentes (decks remis, parties jouées) : la comparaison montre les écarts, ce n'est pas un win rate.",
        "Chaque qualification est ajoutée ici quand Koin publie ses chiffres.",
      ],
      analyticsText: "Les chiffres du ladder du patch, Légendaire par Légendaire :",
      analyticsAnchor: "Analytics",
      rulesText: "Format, ban et listes cachées du tournoi :",
      rulesAnchor: "Règles de la Crimson Cup",
      conquestText: "Comment construire trois decks pour le Conquest :",
      conquestAnchor: "Guide du Conquest",
    },
    card: {
      title: "Dans la Crimson Cup",
      legendary: "{q} : bannie {p} des fois où elle a été vue au ban ({b} sur {s}), {rank} sur {count} ; dans {share} des decks remis ({n}).",
      reached: " Un deck avec elle a atteint le tour {round}, celui des qualifiés.",
      furthest: " Tour le plus avancé : {round}.",
      card: "{q} : dans {p} des decks remis ({n}), {rank} des {count} cartes les plus jouées.",
      link: "Tous les chiffres de la Crimson Cup",
      source: "Chiffres officiels de Koin Games",
    },
    promo: {
      plate: "Crimson Cup",
      title: "Les chiffres du tournoi",
      text: "Les tableaux officiels de Koin Games après la qualification {q} : qui est bannie, qui est apportée et les cartes les plus jouées, à côté du ladder.",
      cta: "Ouvrir les chiffres de la Crimson Cup",
      banned: "La plus bannie",
      brought: "La plus apportée",
      card: "La carte la plus jouée",
    },
  },
  pt: {
    meta: {
      title: "Crimson Cup de Origins TCG: bans e cartas mais usadas",
      description: "Estatísticas da Crimson Cup pelas tabelas oficiais da Koin Games: ban rate de cada Lendária, decks entregues, cartas mais usadas e o torneio contra a ladder.",
    },
    h1: "Crimson Cup: o meta do torneio",
    kicker: "Analytics",
    back: "Analytics",
    howTo: "Como ler os números",
    rules: "Regras da Crimson Cup",
    picker: { label: "Classificatórias", soon: "números ainda não publicados", data: "números oficiais" },
    index: { legendaries: "Lendárias", cards: "Cartas mais usadas", versus: "Torneio contra ladder" },
    snapshot: {
      title: "A classificatória em resumo",
      plate: "Crimson Cup",
      source: "Números oficiais da Koin Games",
      reached: "Lendárias no top 32",
      reachedSub: "com um deck na rodada {round}, a dos classificados",
      bans: "Bans",
      bansSub: "Lendárias banidas na chave",
      mostBanned: "A mais banida",
      mostBannedSub: "{b} bans em {s} vezes vista",
      mostSubmitted: "A mais levada",
      mostSubmittedSub: "{n} decks · {p} dos entregues",
      topCard: "A carta mais usada",
      topCardSub: "em {n} dos decks entregues",
    },
    stories: {
      label: "A classificatória em três fatos",
      banned: { kicker: "A que se bane", text: "{name} é a Lendária que os adversários mais temeram: banida em {p} das vezes em que a encontraram na frente no ban." },
      brought: { kicker: "A mais levada", text: "{name} está em {n} decks, {p} dos entregues, mais do que qualquer outra Lendária, e mesmo assim é banida em {ban} das vezes." },
      calm: { kicker: "A menos temida", text: "{name} é a menos banida entre as Lendárias vistas pelo menos {min} vezes: {p}.", ladder: " Na ladder ela vence {wr}." },
      link: "Torneio contra ladder",
    },
    legendaries: {
      kicker: "Fase de ban",
      title: "O ban rate das Lendárias",
      meta: "{n} Lendárias · {b} bans",
      lead: "Na Crimson Cup você só vê as três Lendárias do adversário e depois bane um dos decks dele. O ban rate diz quantas vezes uma Lendária foi banida nas vezes em que um adversário a encontrou no ban.",
      bannedTitle: "As mais banidas",
      broughtTitle: "As mais levadas",
      broughtLead: "Os decks entregues com cada Lendária e a sua parcela dos decks da tabela da Koin.",
      rowBan: "{b} de {s}",
      rowDecks: "{n} decks",
      roundTitle: "Rodada mais avançada: {n}",
      qualified: "chegou à rodada dos classificados",
      tableSummary: "A tabela completa da Koin",
      tableCaption: "{name}: as Lendárias da tabela da Koin, da mais banida",
      cols: { legendary: "Lendária", banRate: "Ban rate", bannedSeen: "Banida / vista", submitted: "Decks", share: "Parcela", played: "Played", deepest: "Rodada mais avançada" },
    },
    cards: {
      kicker: "Listas",
      title: "As cartas mais usadas",
      meta: "As {n} primeiras da tabela da Koin",
      lead: "Parcela de todos os decks entregues que têm a carta: conta todos os inscritos, não só quem jogou uma partida.",
      decks: "{n} decks",
      position: "Posição {n}",
      tableSummary: "A tabela",
    },
    versus: {
      kicker: "Torneio contra ladder",
      title: "O torneio ao lado da ladder",
      meta: "Ladder: {games} no patch {patch}",
      lead: "O torneio conta os decks que os jogadores entregaram; a ladder, as partidas registradas com o OriginsMeta Tracker. Uma Lendária levada ao torneio mais do que é jogada na ladder é um deck em que os jogadores confiam quando importa.",
      legTitle: "Lendárias: parcela dos decks no torneio, parcela das partidas na ladder",
      legend: { crimson: "Crimson Cup", ladder: "Ladder" },
      up: "{name} é levada ao torneio mais ({c}) do que é jogada na ladder ({l}).",
      down: "{name} é jogada na ladder mais ({l}) do que foi levada ao torneio ({c}).",
      aria: "{name}: {c} dos decks no torneio, {l} das partidas na ladder",
      cols: { legendary: "Lendária", crimson: "Torneio", ladder: "Ladder", diff: "Diferença", ladderWr: "Win rate na ladder", banRate: "Ban rate" },
      cardsTitle: "As cartas mais usadas, no torneio e na ladder",
      cardsLead: "Para as cartas, a ladder conta as partidas registradas com a carta no deck de quem registra: as duas medidas são diferentes, então vale mais comparar as cartas entre si do que cada diferença isolada.",
      cardCols: { card: "Carta", crimson: "Torneio", ladder: "Ladder", diff: "Diferença" },
      missing: "Os números da ladder não estão disponíveis agora: a comparação volta sozinha.",
      none: "não registrada",
    },
    notes: {
      title: "Como ler estes números",
      intro: "São os números oficiais da Crimson Cup, publicados pela Koin Games no seu Discord depois de cada classificatória: nós os colocamos em ordem e ao lado da ladder. São totais: as listas ficam ocultas até o top 4, então as listas individuais não são conhecidas.",
      sourceLabel: "Fonte",
      source: "as tabelas que a Koin Games publicou no seu Discord oficial depois da {name} ({date}), lidas em {read}.",
      discord: "Discord oficial",
      ladderLabel: "Ladder",
      ladder: "as partidas registradas com o OriginsMeta Tracker no patch {patch}, normais e ranqueadas juntas.",
      wordsTitle: "As palavras",
      glossary: [
        { term: "Ban rate", text: "banida / vista: das vezes em que um adversário encontrou a Lendária na frente no ban, quantas vezes ele a baniu." },
        { term: "Decks", text: "quantos dos decks entregues para a classificatória têm essa Lendária. A parcela é sobre os decks contados na tabela da Koin." },
        { term: "Played", text: "a coluna Played da tabela da Koin, como a Koin a conta." },
        { term: "Rodada mais avançada", text: "a rodada mais avançada da chave que um deck com essa Lendária alcançou: a rodada {round} é a dos 32 classificados." },
        { term: "Parcela dos decks (cartas)", text: "a parcela de todos os decks entregues que têm a carta, como a Koin a publica." },
        { term: "Ladder", text: "para as Lendárias, a parcela das aparições nas partidas registradas contando os dois jogadores; para as cartas, a parcela das partidas registradas com a carta no deck de quem registra." },
      ],
      dataTitle: "O que sabemos e o que não sabemos",
      list: [
        "A Koin publica as 20 cartas mais usadas: as outras não estão na tabela e não as estimamos.",
        "Torneio e ladder medem coisas diferentes (decks entregues, partidas jogadas): a comparação mostra as diferenças, não é um win rate.",
        "Cada classificatória entra aqui quando a Koin publica os números dela.",
      ],
      analyticsText: "Os números da ladder do patch, Lendária por Lendária:",
      analyticsAnchor: "Analytics",
      rulesText: "Formato, ban e listas ocultas do torneio:",
      rulesAnchor: "Regras da Crimson Cup",
      conquestText: "Como montar três decks para o Conquest:",
      conquestAnchor: "Guia do Conquest",
    },
    card: {
      title: "Na Crimson Cup",
      legendary: "{q}: banida em {p} das vezes em que foi vista no ban ({b} de {s}), {rank} de {count}; em {share} dos decks entregues ({n}).",
      reached: " Um deck com ela chegou à rodada {round}, a dos classificados.",
      furthest: " Rodada mais avançada: {round}.",
      card: "{q}: em {p} dos decks entregues ({n}), {rank} entre as {count} cartas mais usadas.",
      link: "Todos os números da Crimson Cup",
      source: "Números oficiais da Koin Games",
    },
    promo: {
      plate: "Crimson Cup",
      title: "Os números do torneio",
      text: "As tabelas oficiais da Koin Games depois da {q}: quem é banida, quem é levada e as cartas mais usadas, ao lado da ladder.",
      cta: "Abrir os números da Crimson Cup",
      banned: "A mais banida",
      brought: "A mais levada",
      card: "A carta mais usada",
    },
  },
};
