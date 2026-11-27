import type { Locale } from "@/lib/i18n";

/*
  Testi della pagina pubblica di un iscritto, /u/<nome>, nella grafica «In onda» (27/11/2026: Pierluigi ha scelto questo
  dei tre prototipi, "procediamo con la versione in onda"). Solo i testi nuovi: memberSince, titoli dei mazzi e delle
  tier list, "Copia codice del gioco" e i link in fondo restano quelli dei dizionari. Otto lingue: una chiave nuova va in
  tutte e otto (lo controlla profileOnda.test.ts, con i segnaposto).

  Le parole del Tracker sono quelle di /analytics: "win rate prudente" (DE vorsichtige Win-Rate, RU осторожный винрейт,
  ZH 保守胜率), partite (EN games, DE Spiele, RU партии, ZH 对局). Mai il numero di giocatori.
*/

/** Forme del plurale per Intl.PluralRules: `other` sempre, `one`, `few`, `many` dove la lingua le usa. {n} = il numero */
export type Plural = { one?: string; few?: string; many?: string; other: string };

export type OndaLabels = {
  /** {date} = data d'iscrizione: neutra, senza genere ("sul sito dal") */
  memberSince: string;
  heartFavorite: string;
  heartMostUsed: string;
  legendary: string;
  score: {
    decks: string;
    games: string;
    winrate: string;
    /** sotto il win rate: {pct} = win rate prudente */
    prudent: string;
    votes: string;
    views: string;
    copies: string;
    /** sotto visite e codici copiati */
    estimates: string;
  };
  /** {patch} */
  scoreNote: string;
  /** {date} */
  statsNote: string;
  statsNoteNoDate: string;
  decks: {
    sortLabel: string;
    sortPrudent: string;
    sortGames: string;
    sortVotes: string;
    sortRecent: string;
    noGames: string;
    inForm: string;
    inFormNote: string;
    /** {name} = nome del mazzo */
    copyAria: string;
    /** {name} */
    cardsOf: string;
    /** {patch} */
    cardsPatch: string;
    /** {pct} */
    prudentShort: string;
    /** {wr} {lo} {games} */
    rowAria: string;
  };
  vs: {
    title: string;
    mine: string;
    others: string;
    /** {name} = la Leggendaria */
    better: string;
    worse: string;
    even: string;
    thin: string;
    /** {patch} {min} */
    note: string;
    /** {wr} {games} */
    mineAria: string;
    /** {name} {wr} {games} */
    othersAria: string;
    /** {n} = punti percentuali */
    points: string;
  };
  games: Plural;
  votes: Plural;
};

export const ondaLabels: Record<Locale, OndaLabels> = {
  en: {
    memberSince: "Member since {date}",
    heartFavorite: "Favourite Legendary",
    heartMostUsed: "Most used Legendary",
    legendary: "Legendary",
    score: {
      decks: "Published decks",
      games: "Games with their lists",
      winrate: "Win rate",
      prudent: "cautious {pct}",
      votes: "Votes received",
      views: "Deck visits",
      copies: "Codes copied",
      estimates: "estimates",
    },
    scoreNote: "Games recorded with OriginsMeta Tracker by whoever plays these exact lists, patch {patch}. Cautious: the lowest plausible value, with the 95% range.",
    statsNote: "Visits and copied codes are estimates, counted since {date}.",
    statsNoteNoDate: "Visits and copied codes are estimates.",
    decks: {
      sortLabel: "Sort the decks",
      sortPrudent: "Cautious win rate",
      sortGames: "Games",
      sortVotes: "Votes",
      sortRecent: "Newest",
      noGames: "No games recorded yet",
      inForm: "In form",
      inFormNote: "In form: even the cautious win rate is above 50%.",
      copyAria: "Copy the game code of {name}",
      cardsOf: "The cards of {name}",
      cardsPatch: "Cards from patch {patch}",
      prudentShort: "Cautious {pct}",
      rowAria: "Win rate {wr}, cautious {lo}, over {games}",
    },
    vs: {
      title: "Against the meta",
      mine: "Their lists",
      others: "Other lists",
      better: "Their {name} lists win more than the others.",
      worse: "Their {name} lists win less than the others.",
      even: "Their {name} lists are in line with the others.",
      thin: "Not enough games to compare yet.",
      note: "Both numbers count the games recorded with OriginsMeta Tracker, from the side of whoever plays, in patch {patch}. No verdict under {min} games per side.",
      mineAria: "Their lists: {wr} over {games}",
      othersAria: "Other {name} lists: {wr} over {games}",
      points: "{n} pts",
    },
    games: { one: "{n} game", other: "{n} games" },
    votes: { one: "{n} vote", other: "{n} votes" },
  },
  it: {
    memberSince: "Sul sito dal {date}",
    heartFavorite: "La Leggendaria del cuore",
    heartMostUsed: "La Leggendaria che usa di più",
    legendary: "Leggendaria",
    score: {
      decks: "Mazzi pubblicati",
      games: "Partite con le sue liste",
      winrate: "Win rate",
      prudent: "prudente {pct}",
      votes: "Voti ricevuti",
      views: "Visite ai mazzi",
      copies: "Codici copiati",
      estimates: "stime",
    },
    scoreNote: "Partite registrate con OriginsMeta Tracker da chi gioca queste liste esatte, patch {patch}. Prudente: il valore più basso plausibile, con l'intervallo al 95%.",
    statsNote: "Visite e codici copiati sono stime, contate dal {date}.",
    statsNoteNoDate: "Visite e codici copiati sono stime.",
    decks: {
      sortLabel: "Ordina i mazzi",
      sortPrudent: "Win rate prudente",
      sortGames: "Partite",
      sortVotes: "Voti",
      sortRecent: "Più recenti",
      noGames: "Ancora nessuna partita registrata",
      inForm: "In forma",
      inFormNote: "In forma: anche il win rate prudente supera il 50%.",
      copyAria: "Copia il codice del gioco di {name}",
      cardsOf: "Le carte di {name}",
      cardsPatch: "Carte della patch {patch}",
      prudentShort: "Prudente {pct}",
      rowAria: "Win rate {wr}, prudente {lo}, su {games}",
    },
    vs: {
      title: "Contro il meta",
      mine: "Le sue liste",
      others: "Le altre liste",
      better: "Le sue liste con {name} vincono più delle altre.",
      worse: "Le sue liste con {name} vincono meno delle altre.",
      even: "Le sue liste con {name} sono in linea con le altre.",
      thin: "Ancora poche partite per un confronto.",
      note: "Tutti e due i numeri contano le partite registrate con OriginsMeta Tracker, dal lato di chi gioca, nella patch {patch}. Sotto {min} partite per parte niente verdetto.",
      mineAria: "Le sue liste: {wr} su {games}",
      othersAria: "Le altre liste con {name}: {wr} su {games}",
      points: "{n} punti",
    },
    games: { one: "{n} partita", other: "{n} partite" },
    votes: { one: "{n} voto", other: "{n} voti" },
  },
  es: {
    memberSince: "En el sitio desde el {date}",
    heartFavorite: "La Legendaria favorita",
    heartMostUsed: "La Legendaria que más usa",
    legendary: "Legendaria",
    score: {
      decks: "Mazos publicados",
      games: "Partidas con sus listas",
      winrate: "Win rate",
      prudent: "prudente {pct}",
      votes: "Votos recibidos",
      views: "Visitas a los mazos",
      copies: "Códigos copiados",
      estimates: "estimaciones",
    },
    scoreNote: "Partidas registradas con OriginsMeta Tracker por quien juega estas listas exactas, parche {patch}. Prudente: el valor más bajo plausible, con el intervalo del 95 %.",
    statsNote: "Las visitas y los códigos copiados son estimaciones, contadas desde el {date}.",
    statsNoteNoDate: "Las visitas y los códigos copiados son estimaciones.",
    decks: {
      sortLabel: "Ordenar los mazos",
      sortPrudent: "Win rate prudente",
      sortGames: "Partidas",
      sortVotes: "Votos",
      sortRecent: "Más recientes",
      noGames: "Todavía ninguna partida registrada",
      inForm: "En forma",
      inFormNote: "En forma: incluso el win rate prudente supera el 50 %.",
      copyAria: "Copiar el código del juego de {name}",
      cardsOf: "Las cartas de {name}",
      cardsPatch: "Cartas del parche {patch}",
      prudentShort: "Prudente {pct}",
      rowAria: "Win rate {wr}, prudente {lo}, en {games}",
    },
    vs: {
      title: "Contra el meta",
      mine: "Sus listas",
      others: "Las otras listas",
      better: "Sus listas con {name} ganan más que las otras.",
      worse: "Sus listas con {name} ganan menos que las otras.",
      even: "Sus listas con {name} están en línea con las otras.",
      thin: "Todavía pocas partidas para comparar.",
      note: "Los dos números cuentan las partidas registradas con OriginsMeta Tracker, desde el lado de quien juega, en el parche {patch}. Por debajo de {min} partidas por lado, sin veredicto.",
      mineAria: "Sus listas: {wr} en {games}",
      othersAria: "Las otras listas con {name}: {wr} en {games}",
      points: "{n} puntos",
    },
    games: { one: "{n} partida", other: "{n} partidas" },
    votes: { one: "{n} voto", other: "{n} votos" },
  },
  fr: {
    memberSince: "Sur le site depuis le {date}",
    heartFavorite: "La Légendaire préférée",
    heartMostUsed: "La Légendaire la plus jouée",
    legendary: "Légendaire",
    score: {
      decks: "Decks publiés",
      games: "Parties avec ses listes",
      winrate: "Win rate",
      prudent: "prudent {pct}",
      votes: "Votes reçus",
      views: "Visites des decks",
      copies: "Codes copiés",
      estimates: "estimations",
    },
    scoreNote: "Parties enregistrées avec OriginsMeta Tracker par ceux qui jouent ces listes exactes, patch {patch}. Prudent : la valeur la plus basse plausible, avec l'intervalle à 95 %.",
    statsNote: "Les visites et les codes copiés sont des estimations, comptées depuis le {date}.",
    statsNoteNoDate: "Les visites et les codes copiés sont des estimations.",
    decks: {
      sortLabel: "Trier les decks",
      sortPrudent: "Win rate prudent",
      sortGames: "Parties",
      sortVotes: "Votes",
      sortRecent: "Plus récents",
      noGames: "Encore aucune partie enregistrée",
      inForm: "En forme",
      inFormNote: "En forme : même le win rate prudent dépasse 50 %.",
      copyAria: "Copier le code du jeu de {name}",
      cardsOf: "Les cartes de {name}",
      cardsPatch: "Cartes du patch {patch}",
      prudentShort: "Prudent {pct}",
      rowAria: "Win rate {wr}, prudent {lo}, sur {games}",
    },
    vs: {
      title: "Face au méta",
      mine: "Ses listes",
      others: "Les autres listes",
      better: "Ses listes avec {name} gagnent plus que les autres.",
      worse: "Ses listes avec {name} gagnent moins que les autres.",
      even: "Ses listes avec {name} sont dans la moyenne des autres.",
      thin: "Encore trop peu de parties pour comparer.",
      note: "Les deux chiffres comptent les parties enregistrées avec OriginsMeta Tracker, du côté de celui qui joue, dans le patch {patch}. En dessous de {min} parties de chaque côté, pas de verdict.",
      mineAria: "Ses listes : {wr} sur {games}",
      othersAria: "Les autres listes avec {name} : {wr} sur {games}",
      points: "{n} points",
    },
    games: { one: "{n} partie", other: "{n} parties" },
    votes: { one: "{n} vote", other: "{n} votes" },
  },
  pt: {
    memberSince: "No site desde {date}",
    heartFavorite: "A Lendária favorita",
    heartMostUsed: "A Lendária que mais usa",
    legendary: "Lendária",
    score: {
      decks: "Decks publicados",
      games: "Partidas com estas listas",
      winrate: "Win rate",
      prudent: "prudente {pct}",
      votes: "Votos recebidos",
      views: "Visitas aos decks",
      copies: "Códigos copiados",
      estimates: "estimativas",
    },
    scoreNote: "Partidas registradas com o OriginsMeta Tracker por quem joga estas listas exatas, patch {patch}. Prudente: o valor plausível mais baixo, com o intervalo de 95%.",
    statsNote: "Visitas e códigos copiados são estimativas, contadas desde {date}.",
    statsNoteNoDate: "Visitas e códigos copiados são estimativas.",
    decks: {
      sortLabel: "Ordenar os decks",
      sortPrudent: "Win rate prudente",
      sortGames: "Partidas",
      sortVotes: "Votos",
      sortRecent: "Mais recentes",
      noGames: "Ainda nenhuma partida registrada",
      inForm: "Em forma",
      inFormNote: "Em forma: até o win rate prudente passa de 50%.",
      copyAria: "Copiar o código do jogo de {name}",
      cardsOf: "As cartas de {name}",
      cardsPatch: "Cartas do patch {patch}",
      prudentShort: "Prudente {pct}",
      rowAria: "Win rate {wr}, prudente {lo}, em {games}",
    },
    vs: {
      title: "Contra o meta",
      mine: "As listas deste perfil",
      others: "As outras listas",
      better: "As listas com {name} deste perfil vencem mais que as outras.",
      worse: "As listas com {name} deste perfil vencem menos que as outras.",
      even: "As listas com {name} deste perfil estão em linha com as outras.",
      thin: "Ainda poucas partidas para comparar.",
      note: "Os dois números contam as partidas registradas com o OriginsMeta Tracker, do lado de quem joga, no patch {patch}. Abaixo de {min} partidas de cada lado, sem veredito.",
      mineAria: "As listas deste perfil: {wr} em {games}",
      othersAria: "As outras listas com {name}: {wr} em {games}",
      points: "{n} pontos",
    },
    games: { one: "{n} partida", other: "{n} partidas" },
    votes: { one: "{n} voto", other: "{n} votos" },
  },
  de: {
    memberSince: "Dabei seit {date}",
    heartFavorite: "Lieblings-Legendäre",
    heartMostUsed: "Am häufigsten genutzte Legendäre",
    legendary: "Legendäre",
    score: {
      decks: "Veröffentlichte Decks",
      games: "Spiele mit diesen Listen",
      winrate: "Win-Rate",
      prudent: "vorsichtig {pct}",
      votes: "Erhaltene Stimmen",
      views: "Deck-Besuche",
      copies: "Kopierte Codes",
      estimates: "Schätzungen",
    },
    scoreNote: "Spiele, die mit OriginsMeta Tracker von allen aufgezeichnet wurden, die genau diese Listen spielen, Patch {patch}. Vorsichtig: der niedrigste plausible Wert, mit dem 95-%-Bereich.",
    statsNote: "Besuche und kopierte Codes sind Schätzungen, gezählt seit {date}.",
    statsNoteNoDate: "Besuche und kopierte Codes sind Schätzungen.",
    decks: {
      sortLabel: "Decks sortieren",
      sortPrudent: "Vorsichtige Win-Rate",
      sortGames: "Spiele",
      sortVotes: "Stimmen",
      sortRecent: "Neueste",
      noGames: "Noch keine Spiele aufgezeichnet",
      inForm: "In Form",
      inFormNote: "In Form: Auch die vorsichtige Win-Rate liegt über 50 %.",
      copyAria: "Spielcode von {name} kopieren",
      cardsOf: "Die Karten von {name}",
      cardsPatch: "Karten aus Patch {patch}",
      prudentShort: "Vorsichtig {pct}",
      rowAria: "Win-Rate {wr}, vorsichtig {lo}, bei {games}",
    },
    vs: {
      title: "Gegen das Meta",
      mine: "Diese Listen",
      others: "Die anderen Listen",
      better: "Diese Listen mit {name} gewinnen öfter als die anderen.",
      worse: "Diese Listen mit {name} gewinnen seltener als die anderen.",
      even: "Diese Listen mit {name} liegen gleichauf mit den anderen.",
      thin: "Noch zu wenige Spiele für einen Vergleich.",
      note: "Beide Zahlen zählen die mit OriginsMeta Tracker aufgezeichneten Spiele, von der Seite der Spielenden, in Patch {patch}. Unter {min} Spielen pro Seite kein Urteil.",
      mineAria: "Diese Listen: {wr} bei {games}",
      othersAria: "Die anderen Listen mit {name}: {wr} bei {games}",
      points: "{n} Punkte",
    },
    games: { one: "{n} Spiel", other: "{n} Spiele" },
    votes: { one: "{n} Stimme", other: "{n} Stimmen" },
  },
  ru: {
    memberSince: "На сайте с {date}",
    heartFavorite: "Любимая Легендарная",
    heartMostUsed: "Самая частая Легендарная",
    legendary: "Легендарная",
    score: {
      decks: "Опубликованные колоды",
      games: "Партии с этими списками",
      winrate: "Винрейт",
      prudent: "осторожный {pct}",
      votes: "Полученные голоса",
      views: "Просмотры колод",
      copies: "Скопированные коды",
      estimates: "оценки",
    },
    scoreNote: "Партии, записанные OriginsMeta Tracker у всех, кто играет точно этими списками, патч {patch}. Осторожный: самое низкое правдоподобное значение, с диапазоном 95%.",
    statsNote: "Просмотры и скопированные коды — оценки, подсчёт с {date}.",
    statsNoteNoDate: "Просмотры и скопированные коды — оценки.",
    decks: {
      sortLabel: "Сортировать колоды",
      sortPrudent: "Осторожный винрейт",
      sortGames: "Партии",
      sortVotes: "Голоса",
      sortRecent: "Новые",
      noGames: "Пока нет записанных партий",
      inForm: "В форме",
      inFormNote: "В форме: даже осторожный винрейт выше 50%.",
      copyAria: "Копировать код игры колоды {name}",
      cardsOf: "Карты колоды {name}",
      cardsPatch: "Карты патча {patch}",
      prudentShort: "Осторожный {pct}",
      rowAria: "Винрейт {wr}, осторожный {lo}, за {games}",
    },
    vs: {
      title: "Против меты",
      mine: "Эти списки",
      others: "Другие списки",
      better: "Эти списки с {name} выигрывают чаще остальных.",
      worse: "Эти списки с {name} выигрывают реже остальных.",
      even: "Эти списки с {name} на уровне остальных.",
      thin: "Пока мало партий для сравнения.",
      note: "Оба числа считают партии, записанные OriginsMeta Tracker, со стороны играющего, в патче {patch}. Меньше {min} партий с каждой стороны — без вывода.",
      mineAria: "Эти списки: {wr} за {games}",
      othersAria: "Другие списки с {name}: {wr} за {games}",
      points: "{n} п. п.",
    },
    games: { one: "{n} партия", few: "{n} партии", many: "{n} партий", other: "{n} партии" },
    votes: { one: "{n} голос", few: "{n} голоса", many: "{n} голосов", other: "{n} голоса" },
  },
  "zh-cn": {
    memberSince: "{date} 加入",
    heartFavorite: "最爱的传说卡",
    heartMostUsed: "最常用的传说卡",
    legendary: "传说卡",
    score: {
      decks: "已发布卡组",
      games: "这些卡表的对局",
      winrate: "胜率",
      prudent: "保守 {pct}",
      votes: "收到的投票",
      views: "卡组访问",
      copies: "复制的代码",
      estimates: "估计值",
    },
    scoreNote: "所有使用完全相同卡表的玩家用 OriginsMeta Tracker 记录的对局，{patch} 补丁。保守：最低的合理值，取 95% 区间。",
    statsNote: "访问和复制的代码是估计值，自 {date} 起统计。",
    statsNoteNoDate: "访问和复制的代码是估计值。",
    decks: {
      sortLabel: "卡组排序",
      sortPrudent: "保守胜率",
      sortGames: "对局",
      sortVotes: "投票",
      sortRecent: "最新",
      noGames: "还没有记录的对局",
      inForm: "状态好",
      inFormNote: "状态好：连保守胜率也超过 50%。",
      copyAria: "复制 {name} 的游戏代码",
      cardsOf: "{name} 的卡牌",
      cardsPatch: "{patch} 补丁的卡牌",
      prudentShort: "保守 {pct}",
      rowAria: "胜率 {wr}，保守 {lo}，共 {games}",
    },
    vs: {
      title: "对比环境",
      mine: "这些卡表",
      others: "其他卡表",
      better: "这些 {name} 卡表比其他卡表赢得多。",
      worse: "这些 {name} 卡表比其他卡表赢得少。",
      even: "这些 {name} 卡表与其他卡表持平。",
      thin: "对局还太少，无法比较。",
      note: "两个数字都只统计用 OriginsMeta Tracker 记录的对局，从对局者一方计算，{patch} 补丁。每边少于 {min} 局不下结论。",
      mineAria: "这些卡表：{games} 中 {wr}",
      othersAria: "其他 {name} 卡表：{games} 中 {wr}",
      points: "{n} 个百分点",
    },
    games: { other: "{n} 局" },
    votes: { other: "{n} 票" },
  },
};

/** Un testo con i segnaposto {chiave}. */
export function fillOnda(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** La forma giusta del plurale per la lingua, con il numero già scritto nella lingua (`shown`). */
export function pluralOnda(locale: Locale, n: number, forms: Plural, shown?: string): string {
  const rule = new Intl.PluralRules(locale === "zh-cn" ? "zh-CN" : locale).select(n);
  const text = (rule === "one" || rule === "few" || rule === "many" ? forms[rule] : undefined) ?? forms.other;
  return text.replace("{n}", shown ?? String(n));
}
