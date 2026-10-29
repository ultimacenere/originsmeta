import type { Locale } from "./i18n";

/**
 * Testi del Theory craft (29/10/2026) nelle sette lingue: il deck builder con le carte che oggi non sono nel gioco
 * (/theory-craft), l'elenco dei mazzi costruiti così (/theory-craft/decks), la scheda di uno di quei mazzi, il modulo di
 * pubblicazione. Le voci del menu stanno nei dizionari (`nav.theoryCraft`, `nav.theoryDecks`), il resto della scheda e
 * dell'elenco è quello dei mazzi singoli. Segnaposto fra graffe; `theoryCraft.test.ts` controlla che le lingue abbiano le
 * stesse chiavi e gli stessi segnaposto. Le carte non ancora nel gioco sono le "rimosse" del database: i testi non dicono
 * quando torneranno, perché non lo sappiamo; dicono che i loro dati sono gli ultimi noti e possono cambiare.
 */
export type TheoryCraftLabels = {
  /** schede in cima alle due pagine */
  tabs: { builder: string; decks: string; aria: string };
  builder: {
    metaTitle: string;
    title: string;
    description: string;
    toDecks: string;
    toOfficial: string;
    intro: string;
    dataKicker: string;
    /** {n} carte, {legendaries} Leggendarie */
    dataNote: string;
    /** riga sotto "Carte disponibili": il pool non è solo quello del gioco */
    poolHint: string;
    /** pastiglia sulle carte non ancora nel gioco (pool, mazzo, anteprima del modulo) */
    pill: string;
    filter: string;
    filterAll: string;
    filterGame: string;
    filterTheory: string;
    /** nel pannello "Condividi": {n} carte senza ID del gioco */
    gameCodeMissing: string;
    rules: string;
  };
  decks: {
    metaTitle: string;
    title: string;
    description: string;
    cta: string;
    intro: string;
    note: string;
    legendariesTitle: string;
    /** {n} Leggendarie, {total} carte */
    legendariesText: string;
    inviteTitle: string;
    inviteText: string;
    inviteCta: string;
  };
  deck: {
    pill: string;
    noticeTitle: string;
    /** {cards} = nomi delle carte non ancora nel gioco */
    noticeText: string;
    gameCode: string;
  };
  /** modulo di pubblicazione e di modifica: {cards} = nomi delle carte non ancora nel gioco */
  publishNotice: string;
};

export const theoryCraftLabels: Record<Locale, TheoryCraftLabels> = {
  en: {
    tabs: { builder: "Theory craft", decks: "Theory craft decks", aria: "Theory craft sections" },
    builder: {
      metaTitle: "Origins TCG theory craft: decks with unreleased cards",
      title: "Theory craft",
      description: "Build Origins TCG decks with the cards that are not in the game yet: the same rules as the deck builder, the last known costs and stats, a guide and a vote.",
      toDecks: "Theory craft decks",
      toOfficial: "Deck builder",
      intro:
        "The Theory craft is the deck builder with one more thing: next to the cards in the game you also find the ones that are not in it yet. Build your deck with the same rules, share it with a link, save it privately or publish it with a guide: it goes into the theory craft decks, which the community can vote on and discuss like any other deck.",
      dataKicker: "Cards not in the game yet",
      dataNote:
        "{n} cards ({legendaries} Legendaries) that are not in the game today, marked “Not in game”. Their cost, stats and text are the last known ones: they have not been checked in the game and may change when the cards arrive. A deck that uses them has no game code.",
      poolHint: "the cards of the game plus the ones not in it yet, with their last known costs and stats",
      pill: "Not in game",
      filter: "Cards",
      filterAll: "All",
      filterGame: "In the game",
      filterTheory: "Not in game",
      gameCodeMissing: "No game code: {n} cards in this deck are not in the game.",
      rules: "The rules are the game’s: one Legendary plus twelve different cards, two copies each (25 cards).",
    },
    decks: {
      metaTitle: "Origins TCG theory craft decks",
      title: "Theory craft decks",
      description: "Community Origins TCG decks built with cards that are not in the game yet: lists, guides and votes, with the last known stats of every card.",
      cta: "Build a theory craft deck",
      intro:
        "Decks from the community built with at least one card that is not in the game yet. They work like single decks: guide, vote, comments, versions and a link to the deck builder.",
      note:
        "These decks stay out of the single decks, the tier lists, the statistics and the card pages: they use cards that are not in the game today. When all their cards are in the game, they move to the single decks on their own, at the same address.",
      legendariesTitle: "Legendaries not in the game yet",
      legendariesText: "{n} of the {total} cards that are not in the game yet are Legendaries. Every name opens the card page with the last known data.",
      inviteTitle: "No theory craft decks yet",
      inviteText: "Build the first one with the cards that are not in the game yet and publish it with its guide.",
      inviteCta: "Open the Theory craft",
    },
    deck: {
      pill: "Theory craft",
      noticeTitle: "Theory craft deck",
      noticeText: "It uses cards that are not in the game today: {cards}. Their cost, stats and text are the last known ones and may change.",
      gameCode: "No game code until all the cards of this deck are in the game.",
    },
    publishNotice: "Theory craft deck: it uses cards that are not in the game today ({cards}), so it goes into the theory craft decks, not into the single decks.",
  },
  it: {
    tabs: { builder: "Theory craft", decks: "Mazzi theory craft", aria: "Sezioni del Theory craft" },
    builder: {
      metaTitle: "Theory craft di Origins TCG: mazzi con carte non uscite",
      title: "Theory craft",
      description: "Costruisci mazzi di Origins TCG con le carte che non sono ancora nel gioco: regole del deck builder, ultimi costi e statistiche noti, una guida e i voti.",
      toDecks: "Mazzi theory craft",
      toOfficial: "Deck builder",
      intro:
        "Il Theory craft è il deck builder con una cosa in più: accanto alle carte del gioco trovi anche quelle che non ci sono ancora. Costruisci il mazzo con le stesse regole, condividilo con un link, salvalo in privato o pubblicalo con una guida: va fra i mazzi theory craft, che la community vota e commenta come gli altri.",
      dataKicker: "Carte non ancora nel gioco",
      dataNote:
        "{n} carte ({legendaries} Leggendarie) che oggi non sono nel gioco, segnate con «Non nel gioco». Costo, statistiche e testo sono gli ultimi noti: non sono verificati nel gioco e possono cambiare quando le carte arrivano. Un mazzo che le usa non ha il codice del gioco.",
      poolHint: "le carte del gioco più quelle non ancora nel gioco, con gli ultimi costi e statistiche noti",
      pill: "Non nel gioco",
      filter: "Carte",
      filterAll: "Tutte",
      filterGame: "Nel gioco",
      filterTheory: "Non nel gioco",
      gameCodeMissing: "Niente codice del gioco: {n} carte di questo mazzo non sono nel gioco.",
      rules: "Le regole sono quelle del gioco: una Leggendaria più dodici carte diverse, ognuna in due copie (25 carte).",
    },
    decks: {
      metaTitle: "Mazzi theory craft di Origins TCG",
      title: "Mazzi theory craft",
      description: "Mazzi della community di Origins TCG costruiti con carte non ancora nel gioco: liste, guide e voti, con gli ultimi dati noti di ogni carta.",
      cta: "Crea un mazzo theory craft",
      intro:
        "I mazzi della community costruiti con almeno una carta che non è ancora nel gioco. Funzionano come i mazzi singoli: guida, voti, commenti, versioni e link al deck builder.",
      note:
        "Questi mazzi restano fuori dai mazzi singoli, dalle tier list, dalle statistiche e dalle schede delle carte: usano carte che oggi non sono nel gioco. Quando tutte le loro carte sono nel gioco passano da soli fra i mazzi singoli, con lo stesso indirizzo.",
      legendariesTitle: "Leggendarie non ancora nel gioco",
      legendariesText: "{n} delle {total} carte non ancora nel gioco sono Leggendarie. Ogni nome apre la scheda con gli ultimi dati noti.",
      inviteTitle: "Ancora nessun mazzo theory craft",
      inviteText: "Costruisci il primo con le carte che non sono ancora nel gioco e pubblicalo con la sua guida.",
      inviteCta: "Apri il Theory craft",
    },
    deck: {
      pill: "Theory craft",
      noticeTitle: "Mazzo theory craft",
      noticeText: "Usa carte che oggi non sono nel gioco: {cards}. Costo, statistiche e testo sono gli ultimi noti e possono cambiare.",
      gameCode: "Il codice del gioco non c'è finché tutte le carte del mazzo non sono nel gioco.",
    },
    publishNotice: "Mazzo theory craft: usa carte che oggi non sono nel gioco ({cards}), quindi va fra i mazzi theory craft e non fra i mazzi singoli.",
  },
  es: {
    tabs: { builder: "Theory craft", decks: "Mazos de theory craft", aria: "Secciones del Theory craft" },
    builder: {
      metaTitle: "Theory craft de Origins TCG: mazos con cartas no lanzadas",
      title: "Theory craft",
      description: "Crea mazos de Origins TCG con las cartas que aún no están en el juego: las reglas del deck builder, los últimos costes y estadísticas, una guía y votos.",
      toDecks: "Mazos de theory craft",
      toOfficial: "Deck builder",
      intro:
        "El Theory craft es el deck builder con algo más: junto a las cartas del juego encuentras también las que todavía no están. Crea tu mazo con las mismas reglas, compártelo con un enlace, guárdalo en privado o publícalo con una guía: va a los mazos de theory craft, que la comunidad vota y comenta como los demás.",
      dataKicker: "Cartas que aún no están en el juego",
      dataNote:
        "{n} cartas ({legendaries} Legendarias) que hoy no están en el juego, marcadas con «Fuera del juego». Su coste, sus estadísticas y su texto son los últimos conocidos: no se han verificado en el juego y pueden cambiar cuando lleguen las cartas. Un mazo que las usa no tiene código del juego.",
      poolHint: "las cartas del juego más las que aún no están en él, con los últimos costes y estadísticas conocidos",
      pill: "Fuera del juego",
      filter: "Cartas",
      filterAll: "Todas",
      filterGame: "En el juego",
      filterTheory: "Fuera del juego",
      gameCodeMissing: "Sin código del juego: {n} cartas de este mazo no están en el juego.",
      rules: "Las reglas son las del juego: una Legendaria más doce cartas distintas, dos copias de cada una (25 cartas).",
    },
    decks: {
      metaTitle: "Mazos de theory craft de Origins TCG",
      title: "Mazos de theory craft",
      description: "Mazos de la comunidad de Origins TCG creados con cartas que aún no están en el juego: listas, guías y votos, con los últimos datos de cada carta.",
      cta: "Crea un mazo de theory craft",
      intro:
        "Los mazos de la comunidad creados con al menos una carta que todavía no está en el juego. Funcionan como los mazos individuales: guía, votos, comentarios, versiones y enlace al deck builder.",
      note:
        "Estos mazos quedan fuera de los mazos individuales, de las tier lists, de las estadísticas y de las páginas de las cartas: usan cartas que hoy no están en el juego. Cuando todas sus cartas estén en el juego pasarán solos a los mazos individuales, con la misma dirección.",
      legendariesTitle: "Legendarias que aún no están en el juego",
      legendariesText: "{n} de las {total} cartas que aún no están en el juego son Legendarias. Cada nombre abre la página de la carta con los últimos datos conocidos.",
      inviteTitle: "Todavía no hay mazos de theory craft",
      inviteText: "Crea el primero con las cartas que aún no están en el juego y publícalo con su guía.",
      inviteCta: "Abrir el Theory craft",
    },
    deck: {
      pill: "Theory craft",
      noticeTitle: "Mazo de theory craft",
      noticeText: "Usa cartas que hoy no están en el juego: {cards}. Su coste, sus estadísticas y su texto son los últimos conocidos y pueden cambiar.",
      gameCode: "No hay código del juego hasta que todas las cartas del mazo estén en el juego.",
    },
    publishNotice: "Mazo de theory craft: usa cartas que hoy no están en el juego ({cards}), así que va a los mazos de theory craft y no a los mazos individuales.",
  },
  fr: {
    tabs: { builder: "Theorycraft", decks: "Decks theorycraft", aria: "Sections du Theorycraft" },
    builder: {
      metaTitle: "Theorycraft Origins TCG : decks avec cartes à venir",
      title: "Theorycraft",
      description: "Construisez des decks Origins TCG avec les cartes qui ne sont pas encore dans le jeu : règles du deck builder, derniers coûts et stats connus, guide et votes.",
      toDecks: "Decks theorycraft",
      toOfficial: "Deck builder",
      intro:
        "Le Theorycraft, c'est le deck builder avec un petit plus : à côté des cartes du jeu, vous trouvez aussi celles qui n'y sont pas encore. Construisez votre deck avec les mêmes règles, partagez-le avec un lien, enregistrez-le en privé ou publiez-le avec un guide : il rejoint les decks theorycraft, que la communauté vote et commente comme les autres.",
      dataKicker: "Cartes pas encore dans le jeu",
      dataNote:
        "{n} cartes ({legendaries} Légendaires) qui ne sont pas dans le jeu aujourd'hui, signalées par « Hors du jeu ». Leur coût, leurs stats et leur texte sont les derniers connus : ils n'ont pas été vérifiés dans le jeu et peuvent changer à l'arrivée des cartes. Un deck qui les utilise n'a pas de code du jeu.",
      poolHint: "les cartes du jeu plus celles qui n'y sont pas encore, avec leurs derniers coûts et stats connus",
      pill: "Hors du jeu",
      filter: "Cartes",
      filterAll: "Toutes",
      filterGame: "Dans le jeu",
      filterTheory: "Hors du jeu",
      gameCodeMissing: "Pas de code du jeu : {n} cartes de ce deck ne sont pas dans le jeu.",
      rules: "Les règles sont celles du jeu : une Légendaire plus douze cartes différentes, en deux exemplaires chacune (25 cartes).",
    },
    decks: {
      metaTitle: "Decks theorycraft d'Origins TCG",
      title: "Decks theorycraft",
      description: "Decks de la communauté Origins TCG construits avec des cartes pas encore dans le jeu : listes, guides et votes, avec les dernières stats de chaque carte.",
      cta: "Créer un deck theorycraft",
      intro:
        "Les decks de la communauté construits avec au moins une carte qui n'est pas encore dans le jeu. Ils fonctionnent comme les decks individuels : guide, votes, commentaires, versions et lien vers le deck builder.",
      note:
        "Ces decks restent en dehors des decks individuels, des tier lists, des statistiques et des pages des cartes : ils utilisent des cartes qui ne sont pas dans le jeu aujourd'hui. Quand toutes leurs cartes sont dans le jeu, ils passent d'eux-mêmes dans les decks individuels, à la même adresse.",
      legendariesTitle: "Légendaires pas encore dans le jeu",
      legendariesText: "{n} des {total} cartes pas encore dans le jeu sont des Légendaires. Chaque nom ouvre la page de la carte avec les dernières données connues.",
      inviteTitle: "Pas encore de deck theorycraft",
      inviteText: "Construisez le premier avec les cartes qui ne sont pas encore dans le jeu et publiez-le avec son guide.",
      inviteCta: "Ouvrir le Theorycraft",
    },
    deck: {
      pill: "Theorycraft",
      noticeTitle: "Deck theorycraft",
      noticeText: "Il utilise des cartes qui ne sont pas dans le jeu aujourd'hui : {cards}. Leur coût, leurs stats et leur texte sont les derniers connus et peuvent changer.",
      gameCode: "Pas de code du jeu tant que toutes les cartes du deck ne sont pas dans le jeu.",
    },
    publishNotice: "Deck theorycraft : il utilise des cartes qui ne sont pas dans le jeu aujourd'hui ({cards}), il rejoint donc les decks theorycraft et non les decks individuels.",
  },
  pt: {
    tabs: { builder: "Theory craft", decks: "Decks de theory craft", aria: "Seções do Theory craft" },
    builder: {
      metaTitle: "Theory craft de Origins TCG: decks com cartas não lançadas",
      title: "Theory craft",
      description: "Monte decks de Origins TCG com as cartas que ainda não estão no jogo: as regras do deck builder, os últimos custos e atributos, um guia e votos.",
      toDecks: "Decks de theory craft",
      toOfficial: "Deck builder",
      intro:
        "O Theory craft é o deck builder com uma coisa a mais: ao lado das cartas do jogo, você encontra também as que ainda não estão nele. Monte seu deck com as mesmas regras, compartilhe com um link, salve no privado ou publique com um guia: ele vai para os decks de theory craft, que a comunidade vota e comenta como os outros.",
      dataKicker: "Cartas que ainda não estão no jogo",
      dataNote:
        "{n} cartas ({legendaries} Lendárias) que hoje não estão no jogo, marcadas com “Fora do jogo”. Custo, atributos e texto são os últimos conhecidos: não foram verificados no jogo e podem mudar quando as cartas chegarem. Um deck que as usa não tem código do jogo.",
      poolHint: "as cartas do jogo mais as que ainda não estão nele, com os últimos custos e atributos conhecidos",
      pill: "Fora do jogo",
      filter: "Cartas",
      filterAll: "Todas",
      filterGame: "No jogo",
      filterTheory: "Fora do jogo",
      gameCodeMissing: "Sem código do jogo: {n} cartas deste deck não estão no jogo.",
      rules: "As regras são as do jogo: uma Lendária mais doze cartas diferentes, duas cópias de cada (25 cartas).",
    },
    decks: {
      metaTitle: "Decks de theory craft de Origins TCG",
      title: "Decks de theory craft",
      description: "Decks da comunidade de Origins TCG montados com cartas que ainda não estão no jogo: listas, guias e votos, com os últimos dados de cada carta.",
      cta: "Monte um deck de theory craft",
      intro:
        "Os decks da comunidade montados com pelo menos uma carta que ainda não está no jogo. Funcionam como os decks individuais: guia, votos, comentários, versões e link para o deck builder.",
      note:
        "Esses decks ficam fora dos decks individuais, das tier lists, das estatísticas e das páginas das cartas: usam cartas que hoje não estão no jogo. Quando todas as cartas deles estiverem no jogo, eles passam sozinhos para os decks individuais, no mesmo endereço.",
      legendariesTitle: "Lendárias que ainda não estão no jogo",
      legendariesText: "{n} das {total} cartas que ainda não estão no jogo são Lendárias. Cada nome abre a página da carta com os últimos dados conhecidos.",
      inviteTitle: "Ainda não há decks de theory craft",
      inviteText: "Monte o primeiro com as cartas que ainda não estão no jogo e publique com o guia dele.",
      inviteCta: "Abrir o Theory craft",
    },
    deck: {
      pill: "Theory craft",
      noticeTitle: "Deck de theory craft",
      noticeText: "Usa cartas que hoje não estão no jogo: {cards}. Custo, atributos e texto são os últimos conhecidos e podem mudar.",
      gameCode: "Não há código do jogo até que todas as cartas do deck estejam no jogo.",
    },
    publishNotice: "Deck de theory craft: usa cartas que hoje não estão no jogo ({cards}), então vai para os decks de theory craft e não para os decks individuais.",
  },
  de: {
    tabs: { builder: "Theory Craft", decks: "Theory-Craft-Decks", aria: "Bereiche des Theory Craft" },
    builder: {
      metaTitle: "Origins TCG Theory Craft: Decks mit kommenden Karten",
      title: "Theory Craft",
      description: "Baue Origins-TCG-Decks mit den Karten, die noch nicht im Spiel sind: die Regeln des Deckbuilders, die letzten bekannten Kosten und Werte, Guide und Votes.",
      toDecks: "Theory-Craft-Decks",
      toOfficial: "Deck builder",
      intro:
        "Der Theory Craft ist der Deckbuilder mit einem Extra: Neben den Karten aus dem Spiel findest du auch die, die noch nicht drin sind. Bau dein Deck nach denselben Regeln, teile es per Link, speichere es privat oder veröffentliche es mit einem Guide: Es landet bei den Theory-Craft-Decks, die die Community bewertet und kommentiert wie alle anderen.",
      dataKicker: "Karten, die noch nicht im Spiel sind",
      dataNote:
        "{n} Karten ({legendaries} Legendäre), die heute nicht im Spiel sind, markiert mit „Nicht im Spiel“. Kosten, Werte und Text sind die letzten bekannten: Sie wurden nicht im Spiel geprüft und können sich ändern, wenn die Karten kommen. Ein Deck mit diesen Karten hat keinen Spielcode.",
      poolHint: "die Karten aus dem Spiel plus die, die noch nicht drin sind, mit den letzten bekannten Kosten und Werten",
      pill: "Nicht im Spiel",
      filter: "Karten",
      filterAll: "Alle",
      filterGame: "Im Spiel",
      filterTheory: "Nicht im Spiel",
      gameCodeMissing: "Kein Spielcode: {n} Karten dieses Decks sind nicht im Spiel.",
      rules: "Es gelten die Regeln des Spiels: eine Legendäre plus zwölf verschiedene Karten, je zwei Exemplare (25 Karten).",
    },
    decks: {
      metaTitle: "Theory-Craft-Decks für Origins TCG",
      title: "Theory-Craft-Decks",
      description: "Community-Decks für Origins TCG mit Karten, die noch nicht im Spiel sind: Listen, Guides und Votes, mit den letzten bekannten Werten jeder Karte.",
      cta: "Theory-Craft-Deck bauen",
      intro:
        "Die Decks der Community mit mindestens einer Karte, die noch nicht im Spiel ist. Sie funktionieren wie Einzeldecks: Guide, Votes, Kommentare, Versionen und Link zum Deckbuilder.",
      note:
        "Diese Decks bleiben außerhalb der Einzeldecks, der Tier-Lists, der Statistiken und der Kartenseiten: Sie nutzen Karten, die heute nicht im Spiel sind. Sobald alle ihre Karten im Spiel sind, wechseln sie von selbst zu den Einzeldecks, unter derselben Adresse.",
      legendariesTitle: "Legendäre, die noch nicht im Spiel sind",
      legendariesText: "{n} der {total} Karten, die noch nicht im Spiel sind, sind Legendäre. Jeder Name öffnet die Kartenseite mit den letzten bekannten Daten.",
      inviteTitle: "Noch keine Theory-Craft-Decks",
      inviteText: "Bau das erste mit den Karten, die noch nicht im Spiel sind, und veröffentliche es mit seinem Guide.",
      inviteCta: "Theory Craft öffnen",
    },
    deck: {
      pill: "Theory Craft",
      noticeTitle: "Theory-Craft-Deck",
      noticeText: "Es nutzt Karten, die heute nicht im Spiel sind: {cards}. Kosten, Werte und Text sind die letzten bekannten und können sich ändern.",
      gameCode: "Kein Spielcode, bis alle Karten des Decks im Spiel sind.",
    },
    publishNotice: "Theory-Craft-Deck: Es nutzt Karten, die heute nicht im Spiel sind ({cards}), darum landet es bei den Theory-Craft-Decks und nicht bei den Einzeldecks.",
  },
  ru: {
    tabs: { builder: "Теорикрафт", decks: "Колоды теорикрафта", aria: "Разделы теорикрафта" },
    builder: {
      metaTitle: "Теорикрафт Origins TCG: колоды с ещё не вышедшими картами",
      title: "Теорикрафт",
      description: "Собирайте колоды Origins TCG с картами, которых ещё нет в игре: правила конструктора, последние известные стоимость и параметры, гайд и оценки.",
      toDecks: "Колоды теорикрафта",
      toOfficial: "Конструктор колод",
      intro:
        "Теорикрафт — это конструктор колод с одним дополнением: рядом с картами из игры вы найдёте и те, которых в ней ещё нет. Соберите колоду по тем же правилам, поделитесь ссылкой, сохраните её приватно или опубликуйте с гайдом: она попадёт в колоды теорикрафта, которые сообщество оценивает и обсуждает, как и все остальные.",
      dataKicker: "Карты, которых ещё нет в игре",
      dataNote:
        "{n} карт (из них легендарных: {legendaries}), которых сегодня нет в игре, с пометкой «Не в игре». Стоимость, параметры и текст — последние известные: они не проверены в игре и могут измениться, когда карты появятся. У колоды с такими картами нет кода игры.",
      poolHint: "карты из игры и карты, которых в ней ещё нет, с последними известными стоимостью и параметрами",
      pill: "Не в игре",
      filter: "Карты",
      filterAll: "Все",
      filterGame: "В игре",
      filterTheory: "Не в игре",
      gameCodeMissing: "Кода игры нет: карт этой колоды нет в игре ({n}).",
      rules: "Правила те же, что в игре: одна легендарная карта и двенадцать разных карт по две копии (25 карт).",
    },
    decks: {
      metaTitle: "Колоды теорикрафта Origins TCG",
      title: "Колоды теорикрафта",
      description: "Колоды сообщества Origins TCG с картами, которых ещё нет в игре: списки, гайды и оценки, с последними известными данными каждой карты.",
      cta: "Собрать колоду теорикрафта",
      intro:
        "Колоды сообщества, в которых есть хотя бы одна карта, которой ещё нет в игре. Они работают как одиночные колоды: гайд, оценки, комментарии, версии и ссылка в конструктор.",
      note:
        "Эти колоды не попадают в одиночные колоды, тир-листы, статистику и страницы карт: в них есть карты, которых сегодня нет в игре. Когда все их карты появятся в игре, они сами перейдут в одиночные колоды по тому же адресу.",
      legendariesTitle: "Легендарные карты, которых ещё нет в игре",
      legendariesText: "Легендарных среди карт, которых ещё нет в игре: {n} из {total}. Каждое название открывает страницу карты с последними известными данными.",
      inviteTitle: "Колод теорикрафта пока нет",
      inviteText: "Соберите первую из карт, которых ещё нет в игре, и опубликуйте её с гайдом.",
      inviteCta: "Открыть теорикрафт",
    },
    deck: {
      pill: "Теорикрафт",
      noticeTitle: "Колода теорикрафта",
      noticeText: "В ней есть карты, которых сегодня нет в игре: {cards}. Стоимость, параметры и текст — последние известные и могут измениться.",
      gameCode: "Кода игры не будет, пока все карты колоды не появятся в игре.",
    },
    publishNotice: "Колода теорикрафта: в ней есть карты, которых сегодня нет в игре ({cards}), поэтому она попадёт в колоды теорикрафта, а не в одиночные колоды.",
  },
};

/** Segnaposto fra graffe → valori. */
export function fillTheory(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
