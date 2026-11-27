import type { Locale } from "@/lib/i18n";

/**
 * Testi del replay della tier list (27/11/2026, scelto da Pierluigi fra i tre prototipi: «replay delle patch
 * assolutamente»; regola delle carte base approvata lo stesso giorno). Otto lingue, stessi segnaposto in tutte
 * (`tierReplayLabels.test.ts` li confronta). Passano interi al palco nel browser: solo stringhe, niente funzioni.
 * Glossario: fascia = tier (档 in cinese, тир in russo), come i dizionari; Leggendaria come `sections.legendaries`.
 */

export type ReplayLabels = {
  /** separatore degli elenchi di nomi */
  listSep: string;
  lane: { tier: string; unranked: string };
  /** la fascia dentro una frase: «da {a} a {b}», «non classificata» */
  unrankedWord: string;
  frame: {
    published: string;
    publishedTitle: string;
    publishedLead: string;
    patch: string;
    patchToday: string;
    shortToday: string;
    titleToday: string;
    leadToday: string;
    leadPatch: string;
    leadFirst: string;
    changesOne: string;
    changesMany: string;
  };
  when: { published: string; today: string; patch: string };
  headline: { noneLegendary: string; noneCard: string; jump: string; then: string; steady: string; steadyItem: string; steadyS: string };
  move: { in: string; out: string; change: string };
  kind: { buff: string; nerf: string; rework: string; deck: string };
  why: {
    changedFirst: string;
    crimson: string;
    finalistsOne: string;
    finalistsMany: string;
    ladder: string;
    unrankedFirst: string;
    changed: string;
    samePatch: string;
    meta: string;
    unranked: string;
    notPlayed: string;
    crimsonKept: string;
    notYet: string;
    cardRate: string;
  };
  noun: {
    legendary: { none: string; col: string; share: string };
    card: { none: string; col: string; share: string };
  };
  status: { published: string; applied: string };
  stage: {
    aria: string;
    games: string;
    moves: string;
    average: string;
    frame: string;
    patch: string;
    onlyMoves: string;
    noneMoving: string;
    star: string;
    newsPublished: string;
    newsPatch: string;
    play: string;
    pause: string;
    gamesOne: string;
    gamesMany: string;
    notPlayed: string;
  };
  story: {
    cardPage: string;
    now: string;
    nowNotPlayed: string;
    sparkAria: string;
    average: string;
    tableCaption: string;
    frame: string;
    tier: string;
    winrate: string;
    whyHere: string;
    whyMoved: string;
    whyStayed: string;
    community: string;
    votes: string;
    history: string;
  };
  table: { captionLegendary: string; captionCard: string; titleLegendary: string; titleCard: string };
  page: {
    /** sotto il titolo della sezione Leggendarie */
    legendaryLead: string;
    cardLead: string;
    /** «Come si calcola», in fondo alla sezione carte */
    cardMethodTitle: string;
    cardMethod: string[];
  };
};

const it: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Fascia {tier}", unranked: "Non classificate" },
  unrankedWord: "non classificata",
  frame: {
    published: "Pubblicata · {date}",
    publishedTitle: "Tier list del {date}",
    publishedLead: "Le fasce pubblicate il {date}, con {n} partite della patch del {day}.",
    patch: "Patch del {day}",
    patchToday: "Patch del {day} oggi",
    shortToday: "{day} oggi",
    titleToday: "Patch del {day}, con le partite di oggi",
    leadToday: "Stessa patch, più partite: {n} registrate fino a oggi invece di {m}.",
    leadPatch: "{changes} alle carte e {n} partite registrate.",
    leadFirst: "{n} partite registrate con la patch del {day}.",
    changesOne: "Una modifica",
    changesMany: "{n} modifiche",
  },
  when: { published: "la tier list pubblicata", today: "le partite di oggi della patch del {day}", patch: "la patch del {day}" },
  headline: {
    noneLegendary: "Nessuna Leggendaria ha cambiato fascia fra un fotogramma e l'altro.",
    noneCard: "Nessuna carta ha cambiato fascia fra una patch e l'altra.",
    jump: "Il salto più grosso: {card}, da {a} a {b} con {when}{then}.",
    then: ", poi {tier} con {when}",
    steady: "Sempre nella stessa fascia: {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "Sempre in fascia S, in tutte le {n} patch: {list}.",
  },
  move: { in: "entra in {b}", out: "esce da {a}", change: "da {a} a {b}" },
  kind: { buff: "Potenziata", nerf: "Indebolita", rework: "Rifatta", deck: "Modificata" },
  why: {
    changedFirst: "Modificata con la patch del {day}: {notes}",
    crimson: "Il ladder da solo la metteva in {tier}: la Crimson Cup l'ha alzata di una fascia (bandita nel {p} delle partite, {finalists}).",
    finalistsOne: "un finalista",
    finalistsMany: "{n} finalisti",
    ladder: "Fascia del ladder: win rate a due lati della patch del {day}.",
    unrankedFirst: "Non classificata: le sue partite non bastavano per una fascia.",
    changed: "Modificata da questa patch: {notes}",
    samePatch: "Stessa patch e nessuna modifica alla carta: contano solo le partite in più registrate dopo il {date}.",
    meta: "Nessuna modifica alla carta: è cambiato il meta intorno.",
    unranked: "Non classificata qui: le sue partite non bastano per una fascia.",
    notPlayed: "Non giocata in questa patch.",
    crimsonKept: "La regola conta ancora la Crimson Cup come il {date}: una fascia in più.",
    notYet: "Non era ancora nel gioco.",
    cardRate: "I mazzi che la contengono vincono il {r} delle partite, contro il {b} di tutte le partite registrate nella patch.",
  },
  noun: {
    legendary: { none: "Nessuna Leggendaria", col: "Leggendaria", share: "Quota" },
    card: { none: "Nessuna carta", col: "Carta", share: "Nei mazzi" },
  },
  status: { published: "Pubblicata", applied: "Regola applicata" },
  stage: {
    aria: "Replay delle patch",
    games: "Partite",
    moves: "Cambi di fascia",
    average: "Media",
    frame: "Fotogramma",
    patch: "Patch",
    onlyMoves: "Solo le carte che cambiano fascia",
    noneMoving: "Nessuna carta cambia fascia qui",
    star: "Leggendaria",
    newsPublished: "Come sono nate queste fasce",
    newsPatch: "Le patch notes della patch",
    play: "Fai partire il replay",
    pause: "Metti in pausa il replay",
    gamesOne: "1 partita",
    gamesMany: "{n} partite",
    notPlayed: "non giocata",
  },
  story: {
    cardPage: "Scheda della carta",
    now: "{frame}: {p} di vittorie",
    nowNotPlayed: "{frame}: non giocata",
    sparkAria: "Win rate di {card} patch dopo patch",
    average: "media",
    tableCaption: "Fascia, win rate e presenza di {card} patch dopo patch",
    frame: "Patch",
    tier: "Fascia",
    winrate: "Win rate",
    whyHere: "Perché sta qui",
    whyMoved: "Perché è passata da {a} a {b}",
    whyStayed: "Perché è rimasta",
    community: "Tier list della community",
    votes: "Voti: {n} su 10",
    history: "Modifiche alla carta",
  },
  table: {
    captionLegendary: "Fascia, win rate a due lati e partite di ogni Leggendaria, patch dopo patch",
    captionCard: "Fascia, win rate dei mazzi che la contengono e partite di ogni carta base, patch dopo patch",
    titleLegendary: "Le Leggendarie patch dopo patch",
    titleCard: "Le carte base patch dopo patch",
  },
  page: {
    legendaryLead:
      "Premi play e guarda il meta muoversi. Il primo fotogramma è la tier list pubblicata il {date}, con {n} partite della patch del {day}; gli altri applicano la stessa regola ai numeri del Tracker di ogni patch, aggiornati ogni pochi minuti.",
    cardLead:
      "Le fasce delle carte base nascono dai numeri del Tracker di ogni patch, aggiornati ogni pochi minuti, con la regola qui sotto. Tocca una carta per la sua storia.",
    cardMethodTitle: "Come nasce la fascia di una carta base",
    cardMethod: [
      "Per le carte il Tracker conosce bene solo il mazzo di chi registra: dell'avversario vede soltanto le carte giocate. Il win rate di una carta è quindi quello dei mazzi che la contengono, e si legge contro la media di tutte le partite registrate nella stessa patch ({bases}), non contro il 50%.",
      "La regola è quella delle Leggendarie con la media al posto del 50%: S se il bordo basso dell'intervallo al 95% sta sopra la media, A dalla media in su, B fino a 5 punti sotto, C fino a 10 punti sotto, D più in basso. Sotto le 100 partite: non classificata.",
      "Il numero dice quanto vincono i mazzi con quella carta, che dipende anche dalla Leggendaria e dalle altre carte: non è la forza della carta da sola. «Nei mazzi» è la parte delle partite registrate in cui la carta era nel mazzo.",
    ],
  },
};

const en: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Tier {tier}", unranked: "Unranked" },
  unrankedWord: "unranked",
  frame: {
    published: "Published · {date}",
    publishedTitle: "Tier list of {date}",
    publishedLead: "The tiers published on {date}, from {n} games of the {day} patch.",
    patch: "{day} patch",
    patchToday: "{day} patch today",
    shortToday: "{day} today",
    titleToday: "{day} patch, with today's games",
    leadToday: "Same patch, more games: {n} recorded so far instead of {m}.",
    leadPatch: "{changes} to cards and {n} games recorded.",
    leadFirst: "{n} games recorded on the {day} patch.",
    changesOne: "One change",
    changesMany: "{n} changes",
  },
  when: { published: "the published tier list", today: "today's games of the {day} patch", patch: "the {day} patch" },
  headline: {
    noneLegendary: "No Legendary changed tier from one frame to the next.",
    noneCard: "No card changed tier from one patch to the next.",
    jump: "The biggest jump: {card}, from {a} to {b} with {when}{then}.",
    then: ", then {tier} with {when}",
    steady: "Always in the same tier: {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "In tier S in all {n} patches: {list}.",
  },
  move: { in: "enters {b}", out: "leaves {a}", change: "{a} to {b}" },
  kind: { buff: "Buffed", nerf: "Nerfed", rework: "Reworked", deck: "Changed" },
  why: {
    changedFirst: "Changed with the {day} patch: {notes}",
    crimson: "The ladder alone put it in {tier}: the Crimson Cup raised it one tier (banned in {p} of its games, {finalists}).",
    finalistsOne: "one finalist",
    finalistsMany: "{n} finalists",
    ladder: "Ladder tier: two-sided win rate of the {day} patch.",
    unrankedFirst: "Unranked: not enough games for a tier.",
    changed: "Changed by this patch: {notes}",
    samePatch: "Same patch and no change to the card: only the extra games recorded after {date} count.",
    meta: "No change to the card: the meta around it moved.",
    unranked: "Unranked here: not enough games for a tier.",
    notPlayed: "Not played in this patch.",
    crimsonKept: "The rule still counts the Crimson Cup as on {date}: one tier up.",
    notYet: "Not in the game yet.",
    cardRate: "Decks with this card win {r} of their games, against {b} for all games recorded in the patch.",
  },
  noun: {
    legendary: { none: "No Legendary", col: "Legendary", share: "Share" },
    card: { none: "No card", col: "Card", share: "In decks" },
  },
  status: { published: "Published", applied: "Rule applied" },
  stage: {
    aria: "Patch replay",
    games: "Games",
    moves: "Tier changes",
    average: "Average",
    frame: "Frame",
    patch: "Patch",
    onlyMoves: "Only cards that change tier",
    noneMoving: "No card changes tier here",
    star: "Legendary",
    newsPublished: "How these tiers were made",
    newsPatch: "The patch notes",
    play: "Play the replay",
    pause: "Pause the replay",
    gamesOne: "1 game",
    gamesMany: "{n} games",
    notPlayed: "not played",
  },
  story: {
    cardPage: "Card page",
    now: "{frame}: {p} win rate",
    nowNotPlayed: "{frame}: not played",
    sparkAria: "Win rate of {card}, patch by patch",
    average: "avg",
    tableCaption: "Tier, win rate and presence of {card}, patch by patch",
    frame: "Patch",
    tier: "Tier",
    winrate: "Win rate",
    whyHere: "Why it is here",
    whyMoved: "Why it went from {a} to {b}",
    whyStayed: "Why it stayed",
    community: "Community tier list",
    votes: "Votes: {n} out of 10",
    history: "Changes to the card",
  },
  table: {
    captionLegendary: "Tier, two-sided win rate and games of each Legendary, patch by patch",
    captionCard: "Tier, win rate of the decks that run it and games of each base card, patch by patch",
    titleLegendary: "Legendaries, patch by patch",
    titleCard: "Base cards, patch by patch",
  },
  page: {
    legendaryLead:
      "Press play and watch the meta move. The first frame is the tier list published on {date}, from {n} games of the {day} patch; the others apply the same rule to the Tracker numbers of each patch, updated every few minutes.",
    cardLead:
      "Base card tiers come from the Tracker numbers of each patch, updated every few minutes, with the rule below. Tap a card to see its story.",
    cardMethodTitle: "How a base card gets its tier",
    cardMethod: [
      "For cards, the Tracker only knows the recorder's deck well: of the opponent it sees just the cards played. So a card's win rate is the win rate of the decks that run it, read against the average of all games recorded in the same patch ({bases}), not against 50%.",
      "The rule is the Legendary one with the average in place of 50%: S if the low end of the 95% interval is above the average, A from the average up, B down to 5 points below, C down to 10 points below, D further down. Under 100 games: unranked.",
      "The number says how often decks with that card win, which also depends on the Legendary and the other cards: it is not the strength of the card alone. \"In decks\" is the share of recorded games where the card was in the deck.",
    ],
  },
};

const es: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Tier {tier}", unranked: "Sin clasificar" },
  unrankedWord: "sin clasificar",
  frame: {
    published: "Publicada · {date}",
    publishedTitle: "Tier list del {date}",
    publishedLead: "Los tiers publicados el {date}, con {n} partidas del parche del {day}.",
    patch: "Parche del {day}",
    patchToday: "Parche del {day} hoy",
    shortToday: "{day} hoy",
    titleToday: "Parche del {day}, con las partidas de hoy",
    leadToday: "Mismo parche, más partidas: {n} registradas hasta hoy en lugar de {m}.",
    leadPatch: "{changes} en las cartas y {n} partidas registradas.",
    leadFirst: "{n} partidas registradas con el parche del {day}.",
    changesOne: "Un cambio",
    changesMany: "{n} cambios",
  },
  when: { published: "la tier list publicada", today: "las partidas de hoy del parche del {day}", patch: "el parche del {day}" },
  headline: {
    noneLegendary: "Ninguna Legendaria cambió de tier entre un fotograma y otro.",
    noneCard: "Ninguna carta cambió de tier entre un parche y otro.",
    jump: "El salto más grande: {card}, de {a} a {b} con {when}{then}.",
    then: ", luego {tier} con {when}",
    steady: "Siempre en el mismo tier: {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "En tier S en los {n} parches: {list}.",
  },
  move: { in: "entra en {b}", out: "sale de {a}", change: "de {a} a {b}" },
  kind: { buff: "Mejorada", nerf: "Debilitada", rework: "Rehecha", deck: "Modificada" },
  why: {
    changedFirst: "Modificada con el parche del {day}: {notes}",
    crimson: "El ladder por sí solo la ponía en {tier}: la Crimson Cup la subió un tier (baneada en el {p} de sus partidas, {finalists}).",
    finalistsOne: "un finalista",
    finalistsMany: "{n} finalistas",
    ladder: "Tier del ladder: winrate de ambos lados del parche del {day}.",
    unrankedFirst: "Sin clasificar: sus partidas no bastaban para un tier.",
    changed: "Modificada por este parche: {notes}",
    samePatch: "Mismo parche y ningún cambio en la carta: solo cuentan las partidas registradas después del {date}.",
    meta: "Ningún cambio en la carta: cambió el meta a su alrededor.",
    unranked: "Sin clasificar aquí: sus partidas no bastan para un tier.",
    notPlayed: "No se jugó en este parche.",
    crimsonKept: "La regla sigue contando la Crimson Cup como el {date}: un tier más.",
    notYet: "Todavía no estaba en el juego.",
    cardRate: "Los mazos que la llevan ganan el {r} de sus partidas, frente al {b} de todas las partidas registradas en el parche.",
  },
  noun: {
    legendary: { none: "Ninguna Legendaria", col: "Legendaria", share: "Cuota" },
    card: { none: "Ninguna carta", col: "Carta", share: "En mazos" },
  },
  status: { published: "Publicada", applied: "Regla aplicada" },
  stage: {
    aria: "Repetición de los parches",
    games: "Partidas",
    moves: "Cambios de tier",
    average: "Media",
    frame: "Fotograma",
    patch: "Parche",
    onlyMoves: "Solo las cartas que cambian de tier",
    noneMoving: "Ninguna carta cambia de tier aquí",
    star: "Legendaria",
    newsPublished: "Cómo nacieron estos tiers",
    newsPatch: "Las notas del parche",
    play: "Reproducir",
    pause: "Pausar",
    gamesOne: "1 partida",
    gamesMany: "{n} partidas",
    notPlayed: "sin jugar",
  },
  story: {
    cardPage: "Ficha de la carta",
    now: "{frame}: {p} de victorias",
    nowNotPlayed: "{frame}: sin jugar",
    sparkAria: "Winrate de {card} parche a parche",
    average: "media",
    tableCaption: "Tier, winrate y presencia de {card} parche a parche",
    frame: "Parche",
    tier: "Tier",
    winrate: "Winrate",
    whyHere: "Por qué está aquí",
    whyMoved: "Por qué pasó de {a} a {b}",
    whyStayed: "Por qué se quedó",
    community: "Tier list de la comunidad",
    votes: "Votos: {n} de 10",
    history: "Cambios en la carta",
  },
  table: {
    captionLegendary: "Tier, winrate de ambos lados y partidas de cada Legendaria, parche a parche",
    captionCard: "Tier, winrate de los mazos que la llevan y partidas de cada carta base, parche a parche",
    titleLegendary: "Las Legendarias parche a parche",
    titleCard: "Las cartas base parche a parche",
  },
  page: {
    legendaryLead:
      "Pulsa play y mira cómo se mueve el meta. El primer fotograma es la tier list publicada el {date}, con {n} partidas del parche del {day}; los demás aplican la misma regla a los números del Tracker de cada parche, actualizados cada pocos minutos.",
    cardLead:
      "Los tiers de las cartas base salen de los números del Tracker de cada parche, actualizados cada pocos minutos, con la regla de abajo. Toca una carta para ver su historia.",
    cardMethodTitle: "Cómo nace el tier de una carta base",
    cardMethod: [
      "Con las cartas, el Tracker solo conoce bien el mazo de quien registra: del rival ve solo las cartas jugadas. Por eso el winrate de una carta es el de los mazos que la llevan, y se lee frente a la media de todas las partidas registradas en el mismo parche ({bases}), no frente al 50%.",
      "La regla es la de las Legendarias con la media en lugar del 50%: S si el extremo bajo del intervalo al 95% está por encima de la media, A desde la media, B hasta 5 puntos por debajo, C hasta 10 puntos por debajo, D más abajo. Con menos de 100 partidas: sin clasificar.",
      "El número dice cuánto ganan los mazos con esa carta, que también depende de la Legendaria y del resto de cartas: no es la fuerza de la carta sola. «En mazos» es la parte de las partidas registradas en las que la carta estaba en el mazo.",
    ],
  },
};

const fr: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Tier {tier}", unranked: "Non classées" },
  unrankedWord: "non classée",
  frame: {
    published: "Publiée · {date}",
    publishedTitle: "Tier list du {date}",
    publishedLead: "Les tiers publiés le {date}, avec {n} parties du patch du {day}.",
    patch: "Patch du {day}",
    patchToday: "Patch du {day} aujourd’hui",
    shortToday: "{day} auj.",
    titleToday: "Patch du {day}, avec les parties d’aujourd’hui",
    leadToday: "Même patch, plus de parties : {n} enregistrées à ce jour au lieu de {m}.",
    leadPatch: "{changes} aux cartes et {n} parties enregistrées.",
    leadFirst: "{n} parties enregistrées avec le patch du {day}.",
    changesOne: "Une modification",
    changesMany: "{n} modifications",
  },
  when: { published: "la tier list publiée", today: "les parties d’aujourd’hui du patch du {day}", patch: "le patch du {day}" },
  headline: {
    noneLegendary: "Aucune Légendaire n’a changé de tier d’une image à l’autre.",
    noneCard: "Aucune carte n’a changé de tier d’un patch à l’autre.",
    jump: "Le plus grand saut : {card}, de {a} à {b} avec {when}{then}.",
    then: ", puis {tier} avec {when}",
    steady: "Toujours dans le même tier : {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "En tier S dans les {n} patchs : {list}.",
  },
  move: { in: "entre en {b}", out: "sort de {a}", change: "de {a} à {b}" },
  kind: { buff: "Renforcée", nerf: "Affaiblie", rework: "Refaite", deck: "Modifiée" },
  why: {
    changedFirst: "Modifiée avec le patch du {day} : {notes}",
    crimson: "Le ladder seul la plaçait en {tier} : la Crimson Cup l’a montée d’un tier (bannie dans {p} de ses parties, {finalists}).",
    finalistsOne: "un finaliste",
    finalistsMany: "{n} finalistes",
    ladder: "Tier du ladder : win rate des deux côtés du patch du {day}.",
    unrankedFirst: "Non classée : ses parties ne suffisaient pas pour un tier.",
    changed: "Modifiée par ce patch : {notes}",
    samePatch: "Même patch et aucune modification de la carte : seules comptent les parties enregistrées après le {date}.",
    meta: "Aucune modification de la carte : c’est le méta autour qui a changé.",
    unranked: "Non classée ici : ses parties ne suffisent pas pour un tier.",
    notPlayed: "Pas jouée dans ce patch.",
    crimsonKept: "La règle compte toujours la Crimson Cup comme le {date} : un tier de plus.",
    notYet: "Pas encore dans le jeu.",
    cardRate: "Les decks qui la contiennent gagnent {r} de leurs parties, contre {b} pour toutes les parties enregistrées dans le patch.",
  },
  noun: {
    legendary: { none: "Aucune Légendaire", col: "Légendaire", share: "Part" },
    card: { none: "Aucune carte", col: "Carte", share: "Dans les decks" },
  },
  status: { published: "Publiée", applied: "Règle appliquée" },
  stage: {
    aria: "Replay des patchs",
    games: "Parties",
    moves: "Changements de tier",
    average: "Moyenne",
    frame: "Image",
    patch: "Patch",
    onlyMoves: "Seulement les cartes qui changent de tier",
    noneMoving: "Aucune carte ne change de tier ici",
    star: "Légendaire",
    newsPublished: "Comment ces tiers sont nés",
    newsPatch: "Les notes du patch",
    play: "Lancer le replay",
    pause: "Mettre le replay en pause",
    gamesOne: "1 partie",
    gamesMany: "{n} parties",
    notPlayed: "pas jouée",
  },
  story: {
    cardPage: "Fiche de la carte",
    now: "{frame} : {p} de victoires",
    nowNotPlayed: "{frame} : pas jouée",
    sparkAria: "Win rate de {card} patch après patch",
    average: "moy.",
    tableCaption: "Tier, win rate et présence de {card} patch après patch",
    frame: "Patch",
    tier: "Tier",
    winrate: "Win rate",
    whyHere: "Pourquoi elle est ici",
    whyMoved: "Pourquoi elle est passée de {a} à {b}",
    whyStayed: "Pourquoi elle est restée",
    community: "Tier list de la communauté",
    votes: "Votes : {n} sur 10",
    history: "Modifications de la carte",
  },
  table: {
    captionLegendary: "Tier, win rate des deux côtés et parties de chaque Légendaire, patch après patch",
    captionCard: "Tier, win rate des decks qui la contiennent et parties de chaque carte de base, patch après patch",
    titleLegendary: "Les Légendaires patch après patch",
    titleCard: "Les cartes de base patch après patch",
  },
  page: {
    legendaryLead:
      "Lancez le replay et regardez le méta bouger. La première image est la tier list publiée le {date}, avec {n} parties du patch du {day} ; les autres appliquent la même règle aux chiffres du Tracker de chaque patch, mis à jour toutes les quelques minutes.",
    cardLead:
      "Les tiers des cartes de base viennent des chiffres du Tracker de chaque patch, mis à jour toutes les quelques minutes, avec la règle ci-dessous. Touchez une carte pour voir son histoire.",
    cardMethodTitle: "Comment une carte de base obtient son tier",
    cardMethod: [
      "Pour les cartes, le Tracker ne connaît bien que le deck de celui qui enregistre : de l’adversaire, il ne voit que les cartes jouées. Le win rate d’une carte est donc celui des decks qui la contiennent, et se lit face à la moyenne de toutes les parties enregistrées dans le même patch ({bases}), pas face à 50 %.",
      "La règle est celle des Légendaires avec la moyenne à la place de 50 % : S si le bas de l’intervalle à 95 % est au-dessus de la moyenne, A à partir de la moyenne, B jusqu’à 5 points en dessous, C jusqu’à 10 points en dessous, D plus bas. Sous 100 parties : non classée.",
      "Le chiffre dit combien gagnent les decks avec cette carte, ce qui dépend aussi de la Légendaire et des autres cartes : ce n’est pas la force de la carte seule. « Dans les decks » est la part des parties enregistrées où la carte était dans le deck.",
    ],
  },
};

const pt: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Tier {tier}", unranked: "Sem tier" },
  unrankedWord: "sem tier",
  frame: {
    published: "Publicada · {date}",
    publishedTitle: "Tier list de {date}",
    publishedLead: "Os tiers publicados em {date}, com {n} partidas do patch de {day}.",
    patch: "Patch de {day}",
    patchToday: "Patch de {day} hoje",
    shortToday: "{day} hoje",
    titleToday: "Patch de {day}, com as partidas de hoje",
    leadToday: "Mesmo patch, mais partidas: {n} registradas até hoje em vez de {m}.",
    leadPatch: "{changes} nas cartas e {n} partidas registradas.",
    leadFirst: "{n} partidas registradas com o patch de {day}.",
    changesOne: "Uma mudança",
    changesMany: "{n} mudanças",
  },
  when: { published: "a tier list publicada", today: "as partidas de hoje do patch de {day}", patch: "o patch de {day}" },
  headline: {
    noneLegendary: "Nenhuma Lendária mudou de tier de um quadro para o outro.",
    noneCard: "Nenhuma carta mudou de tier de um patch para o outro.",
    jump: "O maior salto: {card}, de {a} para {b} com {when}{then}.",
    then: ", depois {tier} com {when}",
    steady: "Sempre no mesmo tier: {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "No tier S em todos os {n} patches: {list}.",
  },
  move: { in: "entra em {b}", out: "sai de {a}", change: "de {a} para {b}" },
  kind: { buff: "Fortalecida", nerf: "Enfraquecida", rework: "Refeita", deck: "Modificada" },
  why: {
    changedFirst: "Modificada com o patch de {day}: {notes}",
    crimson: "Só o ladder a colocava em {tier}: a Copa Crimson a subiu um tier (banida em {p} das partidas, {finalists}).",
    finalistsOne: "um finalista",
    finalistsMany: "{n} finalistas",
    ladder: "Tier do ladder: win rate dos dois lados do patch de {day}.",
    unrankedFirst: "Sem tier: as partidas não bastavam para um tier.",
    changed: "Modificada por este patch: {notes}",
    samePatch: "Mesmo patch e nenhuma mudança na carta: contam só as partidas registradas depois de {date}.",
    meta: "Nenhuma mudança na carta: o meta ao redor mudou.",
    unranked: "Sem tier aqui: as partidas não bastam para um tier.",
    notPlayed: "Não jogada neste patch.",
    crimsonKept: "A regra ainda conta a Copa Crimson como em {date}: um tier a mais.",
    notYet: "Ainda não estava no jogo.",
    cardRate: "Os decks com esta carta vencem {r} das partidas, contra {b} de todas as partidas registradas no patch.",
  },
  noun: {
    legendary: { none: "Nenhuma Lendária", col: "Lendária", share: "Parcela" },
    card: { none: "Nenhuma carta", col: "Carta", share: "Nos decks" },
  },
  status: { published: "Publicada", applied: "Regra aplicada" },
  stage: {
    aria: "Replay dos patches",
    games: "Partidas",
    moves: "Mudanças de tier",
    average: "Média",
    frame: "Quadro",
    patch: "Patch",
    onlyMoves: "Só as cartas que mudam de tier",
    noneMoving: "Nenhuma carta muda de tier aqui",
    star: "Lendária",
    newsPublished: "Como estes tiers nasceram",
    newsPatch: "As notas do patch",
    play: "Iniciar o replay",
    pause: "Pausar o replay",
    gamesOne: "1 partida",
    gamesMany: "{n} partidas",
    notPlayed: "não jogada",
  },
  story: {
    cardPage: "Página da carta",
    now: "{frame}: {p} de vitórias",
    nowNotPlayed: "{frame}: não jogada",
    sparkAria: "Win rate de {card} patch a patch",
    average: "média",
    tableCaption: "Tier, win rate e presença de {card} patch a patch",
    frame: "Patch",
    tier: "Tier",
    winrate: "Win rate",
    whyHere: "Por que está aqui",
    whyMoved: "Por que passou de {a} para {b}",
    whyStayed: "Por que ficou",
    community: "Tier list da comunidade",
    votes: "Votos: {n} de 10",
    history: "Mudanças na carta",
  },
  table: {
    captionLegendary: "Tier, win rate dos dois lados e partidas de cada Lendária, patch a patch",
    captionCard: "Tier, win rate dos decks que a usam e partidas de cada carta base, patch a patch",
    titleLegendary: "As Lendárias patch a patch",
    titleCard: "As cartas base patch a patch",
  },
  page: {
    legendaryLead:
      "Aperte play e veja o meta se mover. O primeiro quadro é a tier list publicada em {date}, com {n} partidas do patch de {day}; os outros aplicam a mesma regra aos números do Tracker de cada patch, atualizados a cada poucos minutos.",
    cardLead:
      "Os tiers das cartas base vêm dos números do Tracker de cada patch, atualizados a cada poucos minutos, com a regra abaixo. Toque em uma carta para ver a história dela.",
    cardMethodTitle: "Como uma carta base ganha o seu tier",
    cardMethod: [
      "Nas cartas, o Tracker só conhece bem o deck de quem registra: do adversário vê apenas as cartas jogadas. Por isso o win rate de uma carta é o dos decks que a usam, e se lê contra a média de todas as partidas registradas no mesmo patch ({bases}), não contra 50%.",
      "A regra é a das Lendárias com a média no lugar de 50%: S se o limite inferior do intervalo de 95% fica acima da média, A a partir da média, B até 5 pontos abaixo, C até 10 pontos abaixo, D mais abaixo. Com menos de 100 partidas: sem tier.",
      "O número diz quanto vencem os decks com essa carta, o que também depende da Lendária e das outras cartas: não é a força da carta sozinha. \"Nos decks\" é a parcela das partidas registradas em que a carta estava no deck.",
    ],
  },
};

const de: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Tier {tier}", unranked: "Nicht eingestuft" },
  unrankedWord: "nicht eingestuft",
  frame: {
    published: "Veröffentlicht · {date}",
    publishedTitle: "Tier-List vom {date}",
    publishedLead: "Die am {date} veröffentlichten Tiers, aus {n} Spielen des Patches vom {day}.",
    patch: "Patch vom {day}",
    patchToday: "Patch vom {day} heute",
    shortToday: "{day} heute",
    titleToday: "Patch vom {day}, mit den Spielen von heute",
    leadToday: "Gleicher Patch, mehr Spiele: {n} bis heute aufgezeichnet statt {m}.",
    leadPatch: "{changes} an Karten und {n} aufgezeichnete Spiele.",
    leadFirst: "{n} aufgezeichnete Spiele im Patch vom {day}.",
    changesOne: "Eine Änderung",
    changesMany: "{n} Änderungen",
  },
  when: { published: "der veröffentlichten Tier-List", today: "den heutigen Spielen des Patches vom {day}", patch: "dem Patch vom {day}" },
  headline: {
    noneLegendary: "Keine Legendäre hat von einem Bild zum nächsten das Tier gewechselt.",
    noneCard: "Keine Karte hat von einem Patch zum nächsten das Tier gewechselt.",
    jump: "Der größte Sprung: {card}, von {a} auf {b} mit {when}{then}.",
    then: ", dann {tier} mit {when}",
    steady: "Immer im selben Tier: {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "In allen {n} Patches in Tier S: {list}.",
  },
  move: { in: "steigt in {b} ein", out: "fällt aus {a}", change: "von {a} auf {b}" },
  kind: { buff: "Verstärkt", nerf: "Abgeschwächt", rework: "Überarbeitet", deck: "Geändert" },
  why: {
    changedFirst: "Geändert mit dem Patch vom {day}: {notes}",
    crimson: "Die Rangliste allein setzte sie auf {tier}: Der Crimson Cup hob sie um ein Tier (in {p} ihrer Spiele gebannt, {finalists}).",
    finalistsOne: "ein Finalist",
    finalistsMany: "{n} Finalisten",
    ladder: "Tier der Rangliste: Win-Rate beider Seiten im Patch vom {day}.",
    unrankedFirst: "Nicht eingestuft: Ihre Spiele reichten nicht für ein Tier.",
    changed: "Geändert durch diesen Patch: {notes}",
    samePatch: "Gleicher Patch und keine Änderung an der Karte: Es zählen nur die nach dem {date} aufgezeichneten Spiele.",
    meta: "Keine Änderung an der Karte: Das Meta um sie herum hat sich bewegt.",
    unranked: "Hier nicht eingestuft: Ihre Spiele reichen nicht für ein Tier.",
    notPlayed: "In diesem Patch nicht gespielt.",
    crimsonKept: "Die Regel zählt den Crimson Cup weiter wie am {date}: ein Tier mehr.",
    notYet: "Noch nicht im Spiel.",
    cardRate: "Decks mit dieser Karte gewinnen {r} ihrer Spiele, gegenüber {b} aller im Patch aufgezeichneten Spiele.",
  },
  noun: {
    legendary: { none: "Keine Legendäre", col: "Legendäre", share: "Anteil" },
    card: { none: "Keine Karte", col: "Karte", share: "In Decks" },
  },
  status: { published: "Veröffentlicht", applied: "Regel angewandt" },
  stage: {
    aria: "Replay der Patches",
    games: "Spiele",
    moves: "Tier-Wechsel",
    average: "Schnitt",
    frame: "Bild",
    patch: "Patch",
    onlyMoves: "Nur Karten, die das Tier wechseln",
    noneMoving: "Hier wechselt keine Karte das Tier",
    star: "Legendär",
    newsPublished: "Wie diese Tiers entstanden sind",
    newsPatch: "Die Patchnotes",
    play: "Replay starten",
    pause: "Replay anhalten",
    gamesOne: "1 Spiel",
    gamesMany: "{n} Spiele",
    notPlayed: "nicht gespielt",
  },
  story: {
    cardPage: "Kartenseite",
    now: "{frame}: {p} Siege",
    nowNotPlayed: "{frame}: nicht gespielt",
    sparkAria: "Win-Rate von {card}, Patch für Patch",
    average: "Schnitt",
    tableCaption: "Tier, Win-Rate und Anteil von {card}, Patch für Patch",
    frame: "Patch",
    tier: "Tier",
    winrate: "Win-Rate",
    whyHere: "Warum sie hier steht",
    whyMoved: "Warum sie von {a} auf {b} ging",
    whyStayed: "Warum sie blieb",
    community: "Tier-List der Community",
    votes: "Stimmen: {n} von 10",
    history: "Änderungen an der Karte",
  },
  table: {
    captionLegendary: "Tier, Win-Rate beider Seiten und Spiele jeder Legendären, Patch für Patch",
    captionCard: "Tier, Win-Rate der Decks mit der Karte und Spiele jeder Basiskarte, Patch für Patch",
    titleLegendary: "Die Legendären Patch für Patch",
    titleCard: "Die Basiskarten Patch für Patch",
  },
  page: {
    legendaryLead:
      "Drück auf Play und sieh zu, wie sich das Meta bewegt. Das erste Bild ist die am {date} veröffentlichte Tier-List, aus {n} Spielen des Patches vom {day}; die anderen wenden dieselbe Regel auf die Tracker-Zahlen jedes Patches an, alle paar Minuten aktualisiert.",
    cardLead:
      "Die Tiers der Basiskarten entstehen aus den Tracker-Zahlen jedes Patches, alle paar Minuten aktualisiert, mit der Regel unten. Tippe auf eine Karte, um ihre Geschichte zu sehen.",
    cardMethodTitle: "Wie eine Basiskarte ihr Tier bekommt",
    cardMethod: [
      "Bei Karten kennt der Tracker nur das Deck der aufzeichnenden Person gut: Vom Gegner sieht er nur die gespielten Karten. Die Win-Rate einer Karte ist daher die der Decks, die sie enthalten, und wird mit dem Schnitt aller im selben Patch aufgezeichneten Spiele verglichen ({bases}), nicht mit 50 %.",
      "Die Regel ist die der Legendären, mit dem Schnitt statt 50 %: S, wenn die untere Grenze des 95-%-Intervalls über dem Schnitt liegt, A ab dem Schnitt, B bis 5 Punkte darunter, C bis 10 Punkte darunter, D noch tiefer. Unter 100 Spielen: nicht eingestuft.",
      "Die Zahl sagt, wie oft Decks mit dieser Karte gewinnen, was auch von der Legendären und den anderen Karten abhängt: Sie ist nicht die Stärke der Karte allein. „In Decks“ ist der Anteil der aufgezeichneten Spiele, in denen die Karte im Deck war.",
    ],
  },
};

const ru: ReplayLabels = {
  listSep: ", ",
  lane: { tier: "Тир {tier}", unranked: "Без тира" },
  unrankedWord: "без тира",
  frame: {
    published: "Опубликован · {date}",
    publishedTitle: "Тир-лист от {date}",
    publishedLead: "Тиры, опубликованные {date}, по {n} партиям патча от {day}.",
    patch: "Патч от {day}",
    patchToday: "Патч от {day} сегодня",
    shortToday: "{day} сегодня",
    titleToday: "Патч от {day} с сегодняшними партиями",
    leadToday: "Тот же патч, больше партий: {n} записано на сегодня вместо {m}.",
    leadPatch: "Изменений карт: {changes}; записано партий: {n}.",
    leadFirst: "Записано партий в патче от {day}: {n}.",
    changesOne: "1",
    changesMany: "{n}",
  },
  when: { published: "опубликованном тир-листе", today: "сегодняшних партиях патча от {day}", patch: "патче от {day}" },
  headline: {
    noneLegendary: "Ни одна Легендарная не сменила тир между кадрами.",
    noneCard: "Ни одна карта не сменила тир между патчами.",
    jump: "Самый большой скачок: {card}, с {a} на {b} в {when}{then}.",
    then: ", затем {tier} в {when}",
    steady: "Всегда в одном тире: {list}.",
    steadyItem: "{name} ({tier})",
    steadyS: "В тире S во всех патчах ({n}): {list}.",
  },
  move: { in: "входит в {b}", out: "выходит из {a}", change: "с {a} на {b}" },
  kind: { buff: "Усилена", nerf: "Ослаблена", rework: "Переделана", deck: "Изменена" },
  why: {
    changedFirst: "Изменена в патче от {day}: {notes}",
    crimson: "Рейтинговый режим сам по себе ставил её в {tier}: Crimson Cup поднял её на один тир (бан в {p} её партий, {finalists}).",
    finalistsOne: "один финалист",
    finalistsMany: "финалистов: {n}",
    ladder: "Тир рейтингового режима: винрейт с обеих сторон патча от {day}.",
    unrankedFirst: "Без тира: её партий не хватало для тира.",
    changed: "Изменена этим патчем: {notes}",
    samePatch: "Тот же патч и карта не менялась: учитываются только партии, записанные после {date}.",
    meta: "Карта не менялась: изменилась мета вокруг неё.",
    unranked: "Здесь без тира: её партий не хватает для тира.",
    notPlayed: "В этом патче не играли.",
    crimsonKept: "Правило по-прежнему учитывает Crimson Cup, как {date}: на один тир выше.",
    notYet: "Её ещё не было в игре.",
    cardRate: "Колоды с этой картой выигрывают {r} партий против {b} у всех партий, записанных в патче.",
  },
  noun: {
    legendary: { none: "Нет Легендарных", col: "Легендарная", share: "Доля" },
    card: { none: "Нет карт", col: "Карта", share: "В колодах" },
  },
  status: { published: "Опубликован", applied: "Правило применено" },
  stage: {
    aria: "Повтор патчей",
    games: "Партии",
    moves: "Смены тира",
    average: "Среднее",
    frame: "Кадр",
    patch: "Патч",
    onlyMoves: "Только карты, сменившие тир",
    noneMoving: "Здесь ни одна карта не сменила тир",
    star: "Легендарная",
    newsPublished: "Как появились эти тиры",
    newsPatch: "Описание патча",
    play: "Запустить повтор",
    pause: "Поставить повтор на паузу",
    gamesOne: "1 партия",
    gamesMany: "партий: {n}",
    notPlayed: "не играли",
  },
  story: {
    cardPage: "Страница карты",
    now: "{frame}: {p} побед",
    nowNotPlayed: "{frame}: не играли",
    sparkAria: "Винрейт карты {card} от патча к патчу",
    average: "среднее",
    tableCaption: "Тир, винрейт и доля карты {card} от патча к патчу",
    frame: "Патч",
    tier: "Тир",
    winrate: "Винрейт",
    whyHere: "Почему она здесь",
    whyMoved: "Почему она перешла с {a} на {b}",
    whyStayed: "Почему она осталась",
    community: "Тир-лист сообщества",
    votes: "Оценки: {n} из 10",
    history: "Изменения карты",
  },
  table: {
    captionLegendary: "Тир, винрейт с обеих сторон и партии каждой Легендарной от патча к патчу",
    captionCard: "Тир, винрейт колод с картой и партии каждой базовой карты от патча к патчу",
    titleLegendary: "Легендарные от патча к патчу",
    titleCard: "Базовые карты от патча к патчу",
  },
  page: {
    legendaryLead:
      "Нажмите «плей» и смотрите, как движется мета. Первый кадр — тир-лист, опубликованный {date}, по {n} партиям патча от {day}; остальные применяют то же правило к цифрам Tracker в каждом патче, они обновляются каждые несколько минут.",
    cardLead:
      "Тиры базовых карт получаются из цифр Tracker в каждом патче, которые обновляются каждые несколько минут, по правилу ниже. Нажмите на карту, чтобы увидеть её историю.",
    cardMethodTitle: "Как базовая карта получает тир",
    cardMethod: [
      "Для карт Tracker хорошо знает только колоду того, кто записывает: у соперника он видит лишь сыгранные карты. Поэтому винрейт карты — это винрейт колод с ней, и его сравнивают со средним по всем партиям того же патча ({bases}), а не с 50%.",
      "Правило то же, что у Легендарных, но вместо 50% — среднее: S, если нижняя граница 95-процентного интервала выше среднего; A — от среднего; B — до 5 пунктов ниже; C — до 10 пунктов ниже; D — ещё ниже. Меньше 100 партий — без тира.",
      "Число показывает, как часто выигрывают колоды с этой картой, а это зависит и от Легендарной, и от других карт: это не сила карты самой по себе. «В колодах» — доля записанных партий, в которых карта была в колоде.",
    ],
  },
};

const zh: ReplayLabels = {
  listSep: "、",
  lane: { tier: "{tier} 档", unranked: "不分档" },
  unrankedWord: "不分档",
  frame: {
    published: "已发布 · {date}",
    publishedTitle: "{date} 的强度榜",
    publishedLead: "{date} 发布的档位，依据 {day} 补丁的 {n} 局对局。",
    patch: "{day} 补丁",
    patchToday: "{day} 补丁（今日）",
    shortToday: "{day} 今日",
    titleToday: "{day} 补丁，含今天的对局",
    leadToday: "同一补丁，更多对局：截至今天记录了 {n} 局，之前是 {m} 局。",
    leadPatch: "{changes}卡牌改动，记录了 {n} 局对局。",
    leadFirst: "{day} 补丁记录了 {n} 局对局。",
    changesOne: "1 处",
    changesMany: "{n} 处",
  },
  when: { published: "已发布的强度榜", today: "{day} 补丁今天的对局", patch: "{day} 补丁" },
  headline: {
    noneLegendary: "没有传说卡在两帧之间换档。",
    noneCard: "没有卡牌在两个补丁之间换档。",
    jump: "最大的跳跃：{card}，在 {when}从 {a} 变为 {b}{then}。",
    then: "，随后在 {when}变为 {tier}",
    steady: "始终在同一档：{list}。",
    steadyItem: "{name}（{tier}）",
    steadyS: "在全部 {n} 个补丁中都是 S 档：{list}。",
  },
  move: { in: "进入 {b}", out: "离开 {a}", change: "{a} → {b}" },
  kind: { buff: "加强", nerf: "削弱", rework: "重做", deck: "改动" },
  why: {
    changedFirst: "{day} 补丁改动：{notes}",
    crimson: "仅凭天梯它在 {tier} 档：Crimson Cup 将它上调一档（在 {p} 的对局中被禁用，{finalists}）。",
    finalistsOne: "1 名决赛选手",
    finalistsMany: "{n} 名决赛选手",
    ladder: "天梯档位：{day} 补丁双方计入的胜率。",
    unrankedFirst: "不分档：对局不足以分档。",
    changed: "本补丁改动：{notes}",
    samePatch: "同一补丁，卡牌没有改动：只多计入了 {date} 之后记录的对局。",
    meta: "卡牌没有改动：是周围的环境变了。",
    unranked: "此处不分档：对局不足以分档。",
    notPlayed: "本补丁中没有对局。",
    crimsonKept: "规则仍像 {date} 一样计入 Crimson Cup：上调一档。",
    notYet: "当时还不在游戏中。",
    cardRate: "带这张卡的卡组胜率为 {r}，本补丁所有记录对局为 {b}。",
  },
  noun: {
    legendary: { none: "没有传说卡", col: "传说卡", share: "占比" },
    card: { none: "没有卡牌", col: "卡牌", share: "卡组占比" },
  },
  status: { published: "已发布", applied: "按规则计算" },
  stage: {
    aria: "补丁回放",
    games: "对局",
    moves: "换档",
    average: "平均",
    frame: "帧",
    patch: "补丁",
    onlyMoves: "只看换档的卡牌",
    noneMoving: "这里没有卡牌换档",
    star: "传说卡",
    newsPublished: "这些档位是怎么来的",
    newsPatch: "补丁说明",
    play: "播放回放",
    pause: "暂停回放",
    gamesOne: "1 局",
    gamesMany: "{n} 局",
    notPlayed: "无对局",
  },
  story: {
    cardPage: "卡牌页面",
    now: "{frame}：胜率 {p}",
    nowNotPlayed: "{frame}：无对局",
    sparkAria: "{card} 各补丁的胜率",
    average: "平均",
    tableCaption: "{card} 各补丁的档位、胜率和占比",
    frame: "补丁",
    tier: "档位",
    winrate: "胜率",
    whyHere: "为什么在这里",
    whyMoved: "为什么从 {a} 变为 {b}",
    whyStayed: "为什么没变",
    community: "社区强度榜",
    votes: "评分：{n} / 10",
    history: "卡牌改动",
  },
  table: {
    captionLegendary: "每张传说卡各补丁的档位、双方计入的胜率和对局数",
    captionCard: "每张基础卡各补丁的档位、带这张卡的卡组胜率和对局数",
    titleLegendary: "传说卡各补丁一览",
    titleCard: "基础卡各补丁一览",
  },
  page: {
    legendaryLead:
      "点击播放，看环境如何变化。第一帧是 {date} 发布的强度榜，依据 {day} 补丁的 {n} 局对局；其余各帧把同一规则用于每个补丁的 Tracker 数据，每隔几分钟更新一次。",
    cardLead: "基础卡的档位来自每个补丁的 Tracker 数据，每隔几分钟更新一次，规则见下方。点击一张卡查看它的变化。",
    cardMethodTitle: "基础卡如何分档",
    cardMethod: [
      "对卡牌来说，Tracker 只清楚记录者自己的卡组：对手那边只能看到打出的卡。所以一张卡的胜率是带这张卡的卡组的胜率，要和同一补丁所有记录对局的平均胜率（{bases}）比较，而不是和 50% 比较。",
      "规则与传说卡相同，只是用平均胜率代替 50%：95% 区间的下限高于平均为 S，达到平均为 A，低于平均 5 个百分点以内为 B，10 个百分点以内为 C，更低为 D。不足 100 局：不分档。",
      "这个数字说明带这张卡的卡组赢得多不多，也取决于传说卡和其他卡牌：并不是这张卡单独的强度。「卡组占比」是这张卡在卡组里的对局占全部记录对局的比例。",
    ],
  },
};

export const tierReplayLabels: Record<Locale, ReplayLabels> = { en, it, es, fr, pt, de, ru, "zh-cn": zh };

/** Riempie i segnaposto {nome} di un testo. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
