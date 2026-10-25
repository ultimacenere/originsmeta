import type { Locale } from "./i18n";

/*
  Testi della pagina /analytics/crimson-cup/playoffs (25/10/2026), il tabellone dei playoff della Crimson Cup, nelle sette
  lingue. Nessun import a runtime: li legge anche il test (crimsonPlayoffs.test.ts), che controlla title e description nei
  limiti di Google, gli stessi segnaposto {…} in ogni lingua, la tipografia francese e che nessun testo dica quanti sono i
  giocatori (regola della Crimson Cup: mai il numero di iscritti).

  Parole: tabellone vincenti / perdenti (winners / losers bracket, cuadro de ganadores / perdedores, tableau des gagnants /
  des perdants, chave dos vencedores / perdedores, Winner- / Loser-Bracket, верхняя / нижняя сетка); "turno" come nella
  pagina della Crimson Cup (round, ronda, tour, rodada, Runde, раунд). Testi neutri: "contro {name}", mai "battuto da".
*/

export type PlayoffsLabels = {
  meta: { title: string; description: string };
  kicker: string;
  h1: string;
  back: string;
  source: string;
  howTo: string;
  status: { live: string; decided: string; finished: string };
  facts: { started: string; format: string; finals: string; read: string; snapshot: string };
  finals: { kicker: string; title: string; lead: string; fromWinners: string; fromLosers: string; tbd: string; sure: string };
  alive: { kicker: string; title: string; playing: string; waiting: string; unbeaten: string; oneLoss: string };
  open: { kicker: string; title: string; lead: string; none: string };
  stretch: { kicker: string; winnersTitle: string; losersTitle: string; waiting: string; tbd: string; scroll: string };
  explorer: {
    kicker: string;
    title: string;
    search: string;
    placeholder: string;
    noResults: string;
    sides: string;
    rounds: string;
    path: string;
    alive: string;
    out: string;
    finalist: string;
    clear: string;
    record: string;
    won: string;
    lost: string;
    pending: string;
    vs: string;
  };
  sides: { winners: string; losers: string; grand: string };
  rounds: {
    wbRound: string;
    wbR16: string;
    wbQuarter: string;
    wbSemi: string;
    wbFinal: string;
    lbRound: string;
    lbFinal: string;
    grand: string;
    grandReset: string;
  };
  om: { label: string; title: string };
  champion: { kicker: string; title: string; text: string; finals: string; post: string };
  notes: { title: string; format: string; finals: string; waiting: string; source: string; om: string; link: string };
  promo: string;
};

export const crimsonPlayoffsLabels: Record<Locale, PlayoffsLabels> = {
  en: {
    meta: {
      title: "Origins TCG Crimson Cup playoffs: the live bracket",
      description: "The Crimson Cup playoff bracket, updated every minute: who is still in, the open matches, the road to the four finalists and every player's path.",
    },
    kicker: "Crimson Cup",
    h1: "Crimson Cup playoffs: the bracket",
    back: "Crimson Cup stats",
    source: "Official bracket on Tourney Bot",
    howTo: "How to read it",
    status: { live: "Live", decided: "Top 4 decided", finished: "Finished" },
    facts: {
      started: "Started: {date}",
      format: "Double elimination, best-of-{n} matches",
      finals: "the last four go to the finals on 25 October",
      read: "Read at {time}: the page refreshes every minute",
      snapshot: "Snapshot from {time}: Tourney Bot is not answering right now",
    },
    finals: {
      kicker: "Road to the finals",
      title: "The four who play the finals",
      lead: "The last four still standing go through: the two in the winners final and the two who win round {round} of the losers bracket.",
      fromWinners: "Winners final",
      fromLosers: "Losers round {round}",
      tbd: "To be decided",
      sure: "Into the finals",
    },
    alive: {
      kicker: "Still in",
      title: "Who can still reach the finals",
      playing: "Playing {name}",
      waiting: "Waiting for an opponent: {round}",
      unbeaten: "No losses",
      oneLoss: "One loss",
    },
    open: {
      kicker: "Right now",
      title: "Open matches",
      lead: "Both players are known and there is no result yet: being played or about to start.",
      none: "No open matches at the moment.",
    },
    stretch: {
      kicker: "The bracket",
      winnersTitle: "Winners bracket, from the round of 16",
      losersTitle: "Losers bracket, the last rounds",
      waiting: "Waiting",
      tbd: "To be decided",
      scroll: "scroll →",
    },
    explorer: {
      kicker: "The whole bracket",
      title: "Find a player or browse the rounds",
      search: "Find a player",
      placeholder: "Discord name",
      noResults: "No player with this name.",
      sides: "Bracket side",
      rounds: "Round",
      path: "{name}'s path",
      alive: "Still in",
      out: "Out · {round} · against {name}",
      finalist: "Into the finals",
      clear: "Close",
      record: "Wins: {w}, losses: {l}",
      won: "Won",
      lost: "Lost",
      pending: "To play",
      vs: "against {name}",
    },
    sides: { winners: "Winners", losers: "Losers", grand: "Grand final" },
    rounds: {
      wbRound: "Winners · round {n}",
      wbR16: "Winners · round of 16",
      wbQuarter: "Winners · quarter-finals",
      wbSemi: "Winners · semi-finals",
      wbFinal: "Winners final",
      lbRound: "Losers · round {n}",
      lbFinal: "Losers final",
      grand: "Grand final",
      grandReset: "Grand final reset",
    },
    om: { label: "OriginsMeta", title: "{name} on OriginsMeta: open the profile" },
    champion: {
      kicker: "The Crimson Cup has its champion",
      title: "{name} wins the Crimson Cup",
      text: "From the losers bracket to the grand final won against {runnerUp}, according to the Koin Games announcement and the official Origins TCG post: on Tourney Bot the grand final has no score.",
      finals: "The finals and the four line-ups",
      post: "The official post",
    },
    notes: {
      title: "How to read the bracket",
      format: "Double elimination: lose once and you drop to the losers bracket, lose twice and you are out. Matches are best of {n}.",
      finals: "Four players go to the finals on 25 October (official Crimson Cup schedule): the last four still standing, that is the two in the winners final and the two who win round {round} of the losers bracket.",
      waiting: "When only one player of a match is known we don't guess the pairing: we say who is waiting and in which round.",
      source: "Source: the official playoff bracket on Tourney Bot, the tournament bot of the official Origins TCG Discord. The page reads it again every minute; if Tourney Bot does not answer, the last successful read stays.",
      om: "The OriginsMeta tag next to a name marks a creator, author, pro or staff member of this site who uses the same Discord account as in the bracket: it links to their profile.",
      link: "Bracket on Tourney Bot",
    },
    promo: "Playoff bracket",
  },
  it: {
    meta: {
      title: "Playoff della Crimson Cup di Origins TCG: il tabellone",
      description: "Il tabellone dei playoff della Crimson Cup, aggiornato ogni minuto: chi è in corsa, le partite aperte, la strada verso le finali e il percorso di ognuno.",
    },
    kicker: "Crimson Cup",
    h1: "Playoff della Crimson Cup: il tabellone",
    back: "I numeri della Crimson Cup",
    source: "Tabellone ufficiale su Tourney Bot",
    howTo: "Come leggerlo",
    status: { live: "In corso", decided: "Top 4 decisa", finished: "Concluso" },
    facts: {
      started: "Inizio: {date}",
      format: "Doppia eliminazione, partite al meglio delle {n}",
      finals: "gli ultimi quattro vanno alle finali del 25 ottobre",
      read: "Dati letti alle {time}: la pagina si aggiorna ogni minuto",
      snapshot: "Fotografia delle {time}: Tourney Bot ora non risponde",
    },
    finals: {
      kicker: "Verso le finali",
      title: "I quattro che giocano le finali",
      lead: "Passano gli ultimi quattro rimasti in corsa: i due della finale dei vincenti e i due che vincono il turno {round} dei perdenti.",
      fromWinners: "Finale dei vincenti",
      fromLosers: "Perdenti · turno {round}",
      tbd: "Da decidere",
      sure: "Alle finali",
    },
    alive: {
      kicker: "Ancora in corsa",
      title: "Chi può ancora arrivare alle finali",
      playing: "Gioca contro {name}",
      waiting: "Aspetta l'avversario: {round}",
      unbeaten: "Nessuna sconfitta",
      oneLoss: "Una sconfitta",
    },
    open: {
      kicker: "Adesso",
      title: "Le partite aperte",
      lead: "Tutti e due i giocatori sono noti e il risultato non c'è ancora: si stanno giocando o stanno per cominciare.",
      none: "Nessuna partita aperta in questo momento.",
    },
    stretch: {
      kicker: "Il tabellone",
      winnersTitle: "Tabellone vincenti, dagli ottavi",
      losersTitle: "Tabellone perdenti, gli ultimi turni",
      waiting: "Aspettano",
      tbd: "Da definire",
      scroll: "scorri →",
    },
    explorer: {
      kicker: "Tutto il tabellone",
      title: "Cerca un giocatore o sfoglia i turni",
      search: "Cerca un giocatore",
      placeholder: "Nome su Discord",
      noResults: "Nessun giocatore con questo nome.",
      sides: "Lato del tabellone",
      rounds: "Turno",
      path: "Il percorso di {name}",
      alive: "Ancora in corsa",
      out: "Fuori · {round} · contro {name}",
      finalist: "Alle finali",
      clear: "Chiudi",
      record: "Vittorie: {w}, sconfitte: {l}",
      won: "Vinta",
      lost: "Persa",
      pending: "Da giocare",
      vs: "contro {name}",
    },
    sides: { winners: "Vincenti", losers: "Perdenti", grand: "Gran finale" },
    rounds: {
      wbRound: "Vincenti · turno {n}",
      wbR16: "Vincenti · ottavi",
      wbQuarter: "Vincenti · quarti",
      wbSemi: "Vincenti · semifinali",
      wbFinal: "Finale dei vincenti",
      lbRound: "Perdenti · turno {n}",
      lbFinal: "Finale dei perdenti",
      grand: "Gran finale",
      grandReset: "Gran finale, rivincita",
    },
    om: { label: "OriginsMeta", title: "{name} su OriginsMeta: apri il profilo" },
    champion: {
      kicker: "La Crimson Cup ha il suo campione",
      title: "{name} vince la Crimson Cup",
      text: "Dal tabellone dei perdenti alla gran finale vinta contro {runnerUp}, come dicono l'annuncio di Koin Games e il post ufficiale di Origins TCG: su Tourney Bot la gran finale è rimasta senza punteggio.",
      finals: "Le finali e le liste dei quattro",
      post: "Il post ufficiale",
    },
    notes: {
      title: "Come leggere il tabellone",
      format: "Doppia eliminazione: chi perde una volta scende nel tabellone dei perdenti, chi perde due volte è fuori. Le partite sono al meglio delle {n}.",
      finals: "Alle finali del 25 ottobre vanno in quattro (calendario ufficiale della Crimson Cup): gli ultimi rimasti in corsa, cioè i due della finale dei vincenti e i due che vincono il turno {round} dei perdenti.",
      waiting: "Quando di una partita si conosce un solo giocatore non indoviniamo l'abbinamento: diciamo chi aspetta e in quale turno.",
      source: "Fonte: il tabellone ufficiale dei playoff su Tourney Bot, il bot dei tornei del Discord ufficiale di Origins TCG. La pagina lo rilegge ogni minuto; se Tourney Bot non risponde, resta l'ultima lettura riuscita.",
      om: "Il segno OriginsMeta accanto a un nome indica un creator, un autore, un pro o lo staff del sito con lo stesso account Discord del tabellone: porta al suo profilo.",
      link: "Tabellone su Tourney Bot",
    },
    promo: "Tabellone dei playoff",
  },
  es: {
    meta: {
      title: "Playoffs de la Crimson Cup de Origins TCG: el cuadro",
      description: "El cuadro de los playoffs de la Crimson Cup, actualizado cada minuto: quién sigue en pie, las partidas abiertas, el camino a la final y cada recorrido.",
    },
    kicker: "Crimson Cup",
    h1: "Playoffs de la Crimson Cup: el cuadro",
    back: "Las cifras de la Crimson Cup",
    source: "Cuadro oficial en Tourney Bot",
    howTo: "Cómo leerlo",
    status: { live: "En curso", decided: "Top 4 decidido", finished: "Terminado" },
    facts: {
      started: "Inicio: {date}",
      format: "Doble eliminación, enfrentamientos al mejor de {n}",
      finals: "los cuatro últimos van a las finales del 25 de octubre",
      read: "Datos leídos a las {time}: la página se actualiza cada minuto",
      snapshot: "Foto de las {time}: Tourney Bot no responde ahora",
    },
    finals: {
      kicker: "Camino a las finales",
      title: "Los cuatro que juegan las finales",
      lead: "Pasan los cuatro últimos que siguen en pie: los dos de la final de ganadores y los dos que ganan la ronda {round} de perdedores.",
      fromWinners: "Final de ganadores",
      fromLosers: "Perdedores · ronda {round}",
      tbd: "Por decidir",
      sure: "En las finales",
    },
    alive: {
      kicker: "Siguen en pie",
      title: "Quién puede llegar todavía a las finales",
      playing: "Juega contra {name}",
      waiting: "Espera rival: {round}",
      unbeaten: "Sin derrotas",
      oneLoss: "Una derrota",
    },
    open: {
      kicker: "Ahora",
      title: "Partidas abiertas",
      lead: "Se conocen los dos jugadores y aún no hay resultado: se están jugando o están a punto de empezar.",
      none: "Ninguna partida abierta en este momento.",
    },
    stretch: {
      kicker: "El cuadro",
      winnersTitle: "Cuadro de ganadores, desde octavos",
      losersTitle: "Cuadro de perdedores, las últimas rondas",
      waiting: "Esperan",
      tbd: "Por definir",
      scroll: "desliza →",
    },
    explorer: {
      kicker: "Todo el cuadro",
      title: "Busca un jugador o recorre las rondas",
      search: "Busca un jugador",
      placeholder: "Nombre en Discord",
      noResults: "Ningún jugador con este nombre.",
      sides: "Lado del cuadro",
      rounds: "Ronda",
      path: "El recorrido de {name}",
      alive: "Sigue en pie",
      out: "Fuera · {round} · contra {name}",
      finalist: "En las finales",
      clear: "Cerrar",
      record: "Victorias: {w}, derrotas: {l}",
      won: "Ganada",
      lost: "Perdida",
      pending: "Por jugar",
      vs: "contra {name}",
    },
    sides: { winners: "Ganadores", losers: "Perdedores", grand: "Gran final" },
    rounds: {
      wbRound: "Ganadores · ronda {n}",
      wbR16: "Ganadores · octavos",
      wbQuarter: "Ganadores · cuartos",
      wbSemi: "Ganadores · semifinales",
      wbFinal: "Final de ganadores",
      lbRound: "Perdedores · ronda {n}",
      lbFinal: "Final de perdedores",
      grand: "Gran final",
      grandReset: "Gran final, revancha",
    },
    om: { label: "OriginsMeta", title: "{name} en OriginsMeta: abre el perfil" },
    champion: {
      kicker: "La Crimson Cup ya tiene campeón",
      title: "{name} gana la Crimson Cup",
      text: "Del cuadro de perdedores a la gran final ganada contra {runnerUp}, según el anuncio de Koin Games y la publicación oficial de Origins TCG: en Tourney Bot la gran final quedó sin resultado.",
      finals: "Las finales y las listas de los cuatro",
      post: "La publicación oficial",
    },
    notes: {
      title: "Cómo leer el cuadro",
      format: "Doble eliminación: si pierdes una vez bajas al cuadro de perdedores, si pierdes dos veces quedas fuera. Los enfrentamientos son al mejor de {n}.",
      finals: "A las finales del 25 de octubre van cuatro (calendario oficial de la Crimson Cup): los últimos que siguen en pie, es decir, los dos de la final de ganadores y los dos que ganan la ronda {round} de perdedores.",
      waiting: "Cuando de una partida solo se conoce un jugador no adivinamos el emparejamiento: decimos quién espera y en qué ronda.",
      source: "Fuente: el cuadro oficial de los playoffs en Tourney Bot, el bot de torneos del Discord oficial de Origins TCG. La página lo vuelve a leer cada minuto; si Tourney Bot no responde, queda la última lectura buena.",
      om: "La marca OriginsMeta junto a un nombre indica un creador, un autor, un pro o el staff del sitio con la misma cuenta de Discord del cuadro: lleva a su perfil.",
      link: "Cuadro en Tourney Bot",
    },
    promo: "Cuadro de los playoffs",
  },
  fr: {
    meta: {
      title: "Playoffs de la Crimson Cup d'Origins TCG\u00a0: le tableau",
      description: "Le tableau des playoffs de la Crimson Cup, mis à jour chaque minute\u00a0: qui est encore en lice, les matchs ouverts, la route des finales, chaque parcours.",
    },
    kicker: "Crimson Cup",
    h1: "Playoffs de la Crimson Cup\u00a0: le tableau",
    back: "Les chiffres de la Crimson Cup",
    source: "Tableau officiel sur Tourney Bot",
    howTo: "Comment le lire",
    status: { live: "En cours", decided: "Top 4 connu", finished: "Terminé" },
    facts: {
      started: "Début\u00a0: {date}",
      format: "Double élimination, matchs au meilleur des {n} manches",
      finals: "les quatre derniers vont aux finales du 25 octobre",
      read: "Données lues à {time}\u00a0: la page se met à jour chaque minute",
      snapshot: "Instantané de {time}\u00a0: Tourney Bot ne répond pas pour le moment",
    },
    finals: {
      kicker: "Vers les finales",
      title: "Les quatre qui jouent les finales",
      lead: "Passent les quatre derniers encore en lice\u00a0: les deux de la finale des gagnants et les deux qui remportent le tour {round} des perdants.",
      fromWinners: "Finale des gagnants",
      fromLosers: "Perdants · tour {round}",
      tbd: "À décider",
      sure: "Aux finales",
    },
    alive: {
      kicker: "Encore en lice",
      title: "Qui peut encore atteindre les finales",
      playing: "Joue contre {name}",
      waiting: "Attend un adversaire\u00a0: {round}",
      unbeaten: "Aucune défaite",
      oneLoss: "Une défaite",
    },
    open: {
      kicker: "En ce moment",
      title: "Les matchs ouverts",
      lead: "Les deux joueurs sont connus et le résultat n'est pas encore là\u00a0: le match se joue ou va commencer.",
      none: "Aucun match ouvert pour le moment.",
    },
    stretch: {
      kicker: "Le tableau",
      winnersTitle: "Tableau des gagnants, dès les huitièmes",
      losersTitle: "Tableau des perdants, les derniers tours",
      waiting: "En attente",
      tbd: "À définir",
      scroll: "faites défiler →",
    },
    explorer: {
      kicker: "Tout le tableau",
      title: "Cherchez un joueur ou parcourez les tours",
      search: "Chercher un joueur",
      placeholder: "Nom sur Discord",
      noResults: "Aucun joueur avec ce nom.",
      sides: "Côté du tableau",
      rounds: "Tour",
      path: "Le parcours de {name}",
      alive: "Encore en lice",
      out: "Hors course · {round} · contre {name}",
      finalist: "Aux finales",
      clear: "Fermer",
      record: "Victoires\u00a0: {w}, défaites\u00a0: {l}",
      won: "Gagné",
      lost: "Perdu",
      pending: "À jouer",
      vs: "contre {name}",
    },
    sides: { winners: "Gagnants", losers: "Perdants", grand: "Grande finale" },
    rounds: {
      wbRound: "Gagnants · tour {n}",
      wbR16: "Gagnants · huitièmes",
      wbQuarter: "Gagnants · quarts",
      wbSemi: "Gagnants · demi-finales",
      wbFinal: "Finale des gagnants",
      lbRound: "Perdants · tour {n}",
      lbFinal: "Finale des perdants",
      grand: "Grande finale",
      grandReset: "Grande finale, revanche",
    },
    om: { label: "OriginsMeta", title: "{name} sur OriginsMeta\u00a0: ouvrir le profil" },
    champion: {
      kicker: "La Crimson Cup a son champion",
      title: "{name} remporte la Crimson Cup",
      text: "Du tableau des perdants à la grande finale gagnée contre {runnerUp}, selon l'annonce de Koin Games et la publication officielle d'Origins TCG\u00a0: sur Tourney Bot, la grande finale n'a pas de score.",
      finals: "Les finales et les listes des quatre",
      post: "La publication officielle",
    },
    notes: {
      title: "Comment lire le tableau",
      format: "Double élimination\u00a0: une défaite vous envoie dans le tableau des perdants, deux défaites et c'est fini. Les matchs se jouent au meilleur des {n} manches.",
      finals: "Quatre joueurs vont aux finales du 25 octobre (calendrier officiel de la Crimson Cup)\u00a0: les derniers encore en lice, c'est-à-dire les deux de la finale des gagnants et les deux qui remportent le tour {round} des perdants.",
      waiting: "Quand un seul joueur d'un match est connu, nous ne devinons pas l'appariement\u00a0: nous indiquons qui attend et à quel tour.",
      source: "Source\u00a0: le tableau officiel des playoffs sur Tourney Bot, le bot de tournois du Discord officiel d'Origins TCG. La page le relit chaque minute\u00a0; si Tourney Bot ne répond pas, la dernière lecture réussie reste affichée.",
      om: "La mention OriginsMeta à côté d'un nom signale un créateur, un auteur, un pro ou un membre du staff du site qui utilise le même compte Discord que dans le tableau\u00a0: elle mène à son profil.",
      link: "Tableau sur Tourney Bot",
    },
    promo: "Tableau des playoffs",
  },
  pt: {
    meta: {
      title: "Playoffs da Crimson Cup de Origins TCG: a chave",
      description: "A chave dos playoffs da Crimson Cup, atualizada a cada minuto: quem segue na disputa, as partidas abertas, o caminho até as finais e a campanha de cada um.",
    },
    kicker: "Crimson Cup",
    h1: "Playoffs da Crimson Cup: a chave",
    back: "Os números da Crimson Cup",
    source: "Chave oficial no Tourney Bot",
    howTo: "Como ler",
    status: { live: "Ao vivo", decided: "Top 4 definido", finished: "Encerrado" },
    facts: {
      started: "Início: {date}",
      format: "Eliminação dupla, partidas em melhor de {n}",
      finals: "os quatro últimos vão às finais de 25 de outubro",
      read: "Dados lidos às {time}: a página se atualiza a cada minuto",
      snapshot: "Retrato das {time}: o Tourney Bot não está respondendo agora",
    },
    finals: {
      kicker: "Rumo às finais",
      title: "Os quatro que jogam as finais",
      lead: "Passam os quatro últimos que seguem na disputa: os dois da final dos vencedores e os dois que vencem a rodada {round} dos perdedores.",
      fromWinners: "Final dos vencedores",
      fromLosers: "Perdedores · rodada {round}",
      tbd: "A definir",
      sure: "Nas finais",
    },
    alive: {
      kicker: "Seguem na disputa",
      title: "Quem ainda pode chegar às finais",
      playing: "Joga contra {name}",
      waiting: "Espera o adversário: {round}",
      unbeaten: "Nenhuma derrota",
      oneLoss: "Uma derrota",
    },
    open: {
      kicker: "Agora",
      title: "Partidas abertas",
      lead: "Os dois jogadores são conhecidos e ainda não há resultado: estão jogando ou vão começar.",
      none: "Nenhuma partida aberta neste momento.",
    },
    stretch: {
      kicker: "A chave",
      winnersTitle: "Chave dos vencedores, das oitavas em diante",
      losersTitle: "Chave dos perdedores, as últimas rodadas",
      waiting: "Esperando",
      tbd: "A definir",
      scroll: "deslize →",
    },
    explorer: {
      kicker: "A chave inteira",
      title: "Procure um jogador ou percorra as rodadas",
      search: "Procure um jogador",
      placeholder: "Nome no Discord",
      noResults: "Nenhum jogador com este nome.",
      sides: "Lado da chave",
      rounds: "Rodada",
      path: "A campanha de {name}",
      alive: "Segue na disputa",
      out: "Fora · {round} · contra {name}",
      finalist: "Nas finais",
      clear: "Fechar",
      record: "Vitórias: {w}, derrotas: {l}",
      won: "Vitória",
      lost: "Derrota",
      pending: "A jogar",
      vs: "contra {name}",
    },
    sides: { winners: "Vencedores", losers: "Perdedores", grand: "Grande final" },
    rounds: {
      wbRound: "Vencedores · rodada {n}",
      wbR16: "Vencedores · oitavas",
      wbQuarter: "Vencedores · quartas",
      wbSemi: "Vencedores · semifinais",
      wbFinal: "Final dos vencedores",
      lbRound: "Perdedores · rodada {n}",
      lbFinal: "Final dos perdedores",
      grand: "Grande final",
      grandReset: "Grande final, revanche",
    },
    om: { label: "OriginsMeta", title: "{name} no OriginsMeta: abrir o perfil" },
    champion: {
      kicker: "A Crimson Cup tem seu campeão",
      title: "{name} vence a Crimson Cup",
      text: "Da chave dos perdedores à grande final vencida contra {runnerUp}, segundo o anúncio da Koin Games e a publicação oficial de Origins TCG: no Tourney Bot a grande final ficou sem placar.",
      finals: "As finais e as listas dos quatro",
      post: "A publicação oficial",
    },
    notes: {
      title: "Como ler a chave",
      format: "Eliminação dupla: quem perde uma vez cai para a chave dos perdedores, quem perde duas vezes está fora. As partidas são em melhor de {n}.",
      finals: "Quatro jogadores vão às finais de 25 de outubro (calendário oficial da Crimson Cup): os últimos que seguem na disputa, ou seja, os dois da final dos vencedores e os dois que vencem a rodada {round} dos perdedores.",
      waiting: "Quando só um jogador de uma partida é conhecido, não adivinhamos o confronto: dizemos quem espera e em qual rodada.",
      source: "Fonte: a chave oficial dos playoffs no Tourney Bot, o bot de torneios do Discord oficial de Origins TCG. A página a lê de novo a cada minuto; se o Tourney Bot não responder, fica a última leitura bem-sucedida.",
      om: "A marca OriginsMeta ao lado de um nome indica um criador, um autor, um pro ou alguém da equipe do site com a mesma conta do Discord da chave: ela leva ao perfil.",
      link: "Chave no Tourney Bot",
    },
    promo: "Chave dos playoffs",
  },
  de: {
    meta: {
      title: "Origins TCG Crimson Cup Playoffs: der Turnierbaum",
      description: "Der Turnierbaum der Crimson Cup Playoffs, jede Minute aktualisiert: wer noch dabei ist, offene Matches, der Weg ins Finale und der Weg jedes Spielers.",
    },
    kicker: "Crimson Cup",
    h1: "Crimson Cup Playoffs: der Turnierbaum",
    back: "Zahlen zum Crimson Cup",
    source: "Offizieller Turnierbaum auf Tourney Bot",
    howTo: "So liest du ihn",
    status: { live: "Läuft", decided: "Top 4 steht fest", finished: "Beendet" },
    facts: {
      started: "Start: {date}",
      format: "Double Elimination, Matches im Best-of-{n}",
      finals: "die letzten vier spielen die Finals am 25. Oktober",
      read: "Gelesen um {time}: die Seite aktualisiert sich jede Minute",
      snapshot: "Stand von {time}: Tourney Bot antwortet gerade nicht",
    },
    finals: {
      kicker: "Auf dem Weg ins Finale",
      title: "Die vier, die die Finals spielen",
      lead: "Weiter kommen die letzten vier, die noch dabei sind: die beiden aus dem Winner-Finale und die beiden Sieger der Loser-Runde {round}.",
      fromWinners: "Winner-Finale",
      fromLosers: "Loser · Runde {round}",
      tbd: "Noch offen",
      sure: "In den Finals",
    },
    alive: {
      kicker: "Noch dabei",
      title: "Wer die Finals noch erreichen kann",
      playing: "Spielt gegen {name}",
      waiting: "Wartet auf den Gegner: {round}",
      unbeaten: "Ungeschlagen",
      oneLoss: "Eine Niederlage",
    },
    open: {
      kicker: "Jetzt",
      title: "Offene Matches",
      lead: "Beide Spieler stehen fest, ein Ergebnis gibt es noch nicht: Das Match läuft oder beginnt gleich.",
      none: "Gerade gibt es kein offenes Match.",
    },
    stretch: {
      kicker: "Der Turnierbaum",
      winnersTitle: "Winner-Bracket ab dem Achtelfinale",
      losersTitle: "Loser-Bracket, die letzten Runden",
      waiting: "Warten",
      tbd: "Noch offen",
      scroll: "scrollen →",
    },
    explorer: {
      kicker: "Der ganze Turnierbaum",
      title: "Finde einen Spieler oder blättere durch die Runden",
      search: "Spieler suchen",
      placeholder: "Name auf Discord",
      noResults: "Kein Spieler mit diesem Namen.",
      sides: "Seite des Turnierbaums",
      rounds: "Runde",
      path: "Der Weg von {name}",
      alive: "Noch dabei",
      out: "Raus · {round} · gegen {name}",
      finalist: "In den Finals",
      clear: "Schließen",
      record: "Siege: {w}, Niederlagen: {l}",
      won: "Gewonnen",
      lost: "Verloren",
      pending: "Noch zu spielen",
      vs: "gegen {name}",
    },
    sides: { winners: "Winner", losers: "Loser", grand: "Großes Finale" },
    rounds: {
      wbRound: "Winner · Runde {n}",
      wbR16: "Winner · Achtelfinale",
      wbQuarter: "Winner · Viertelfinale",
      wbSemi: "Winner · Halbfinale",
      wbFinal: "Winner-Finale",
      lbRound: "Loser · Runde {n}",
      lbFinal: "Loser-Finale",
      grand: "Großes Finale",
      grandReset: "Großes Finale, Reset",
    },
    om: { label: "OriginsMeta", title: "{name} auf OriginsMeta: Profil öffnen" },
    champion: {
      kicker: "Der Crimson Cup hat seinen Champion",
      title: "{name} gewinnt den Crimson Cup",
      text: "Aus dem Loser-Bracket bis zum gewonnenen großen Finale gegen {runnerUp}, laut der Ankündigung von Koin Games und dem offiziellen Post von Origins TCG: Auf Tourney Bot hat das große Finale kein Ergebnis.",
      finals: "Die Finals und die Listen der vier",
      post: "Der offizielle Post",
    },
    notes: {
      title: "So liest du den Turnierbaum",
      format: "Double Elimination: Wer einmal verliert, rutscht ins Loser-Bracket, wer zweimal verliert, ist raus. Die Matches gehen über Best-of-{n}.",
      finals: "Vier Spieler erreichen die Finals am 25. Oktober (offizieller Zeitplan des Crimson Cup): die letzten vier, die noch dabei sind, also die beiden aus dem Winner-Finale und die beiden Sieger der Loser-Runde {round}.",
      waiting: "Steht bei einem Match erst ein Spieler fest, raten wir die Paarung nicht: Wir sagen, wer wartet und in welcher Runde.",
      source: "Quelle: der offizielle Turnierbaum der Playoffs auf Tourney Bot, dem Turnier-Bot des offiziellen Origins-TCG-Discords. Die Seite liest ihn jede Minute neu; antwortet Tourney Bot nicht, bleibt der letzte erfolgreiche Stand.",
      om: "Die Marke OriginsMeta neben einem Namen zeigt Creator, Autoren, Pros oder Staff dieser Seite mit demselben Discord-Konto wie im Turnierbaum: Sie führt zum Profil.",
      link: "Turnierbaum auf Tourney Bot",
    },
    promo: "Turnierbaum der Playoffs",
  },
  ru: {
    meta: {
      title: "Плей-офф Crimson Cup в Origins TCG: турнирная сетка",
      description: "Сетка плей-офф Crimson Cup с обновлением каждую минуту: кто ещё в борьбе, открытые матчи, путь к финалу и выступление каждого игрока.",
    },
    kicker: "Crimson Cup",
    h1: "Плей-офф Crimson Cup: турнирная сетка",
    back: "Цифры Crimson Cup",
    source: "Официальная сетка на Tourney Bot",
    howTo: "Как читать",
    status: { live: "Идёт", decided: "Топ-4 определён", finished: "Завершён" },
    facts: {
      started: "Начало: {date}",
      format: "Двойное выбывание, матчи в формате Bo{n}",
      finals: "последние четверо выходят в финалы 25 октября",
      read: "Данные прочитаны в {time}: страница обновляется каждую минуту",
      snapshot: "Снимок на {time}: Tourney Bot сейчас не отвечает",
    },
    finals: {
      kicker: "Путь к финалам",
      title: "Четверо, которые сыграют в финалах",
      lead: "Проходят последние четверо, кто ещё в борьбе: двое из финала верхней сетки и двое победителей раунда {round} нижней сетки.",
      fromWinners: "Финал верхней сетки",
      fromLosers: "Нижняя сетка · раунд {round}",
      tbd: "Ещё не известно",
      sure: "В финалах",
    },
    alive: {
      kicker: "Ещё в борьбе",
      title: "Кто ещё может выйти в финалы",
      playing: "Играет против {name}",
      waiting: "Ждёт соперника: {round}",
      unbeaten: "Без поражений",
      oneLoss: "Одно поражение",
    },
    open: {
      kicker: "Сейчас",
      title: "Открытые матчи",
      lead: "Оба игрока известны, а результата ещё нет: матч идёт или вот-вот начнётся.",
      none: "Сейчас открытых матчей нет.",
    },
    stretch: {
      kicker: "Сетка",
      winnersTitle: "Верхняя сетка, с 1/8 финала",
      losersTitle: "Нижняя сетка, последние раунды",
      waiting: "Ждут",
      tbd: "Ещё не известно",
      scroll: "листайте →",
    },
    explorer: {
      kicker: "Вся сетка",
      title: "Найдите игрока или пролистайте раунды",
      search: "Найти игрока",
      placeholder: "Имя в Discord",
      noResults: "Игрока с таким именем нет.",
      sides: "Часть сетки",
      rounds: "Раунд",
      path: "Путь игрока {name}",
      alive: "Ещё в борьбе",
      out: "Вне турнира · {round} · против {name}",
      finalist: "В финалах",
      clear: "Закрыть",
      record: "Победы: {w}, поражения: {l}",
      won: "Победа",
      lost: "Поражение",
      pending: "Ещё не сыгран",
      vs: "против {name}",
    },
    sides: { winners: "Верхняя сетка", losers: "Нижняя сетка", grand: "Гранд-финал" },
    rounds: {
      wbRound: "Верхняя сетка · раунд {n}",
      wbR16: "Верхняя сетка · 1/8 финала",
      wbQuarter: "Верхняя сетка · четвертьфинал",
      wbSemi: "Верхняя сетка · полуфинал",
      wbFinal: "Финал верхней сетки",
      lbRound: "Нижняя сетка · раунд {n}",
      lbFinal: "Финал нижней сетки",
      grand: "Гранд-финал",
      grandReset: "Гранд-финал, переигровка",
    },
    om: { label: "OriginsMeta", title: "{name} на OriginsMeta: открыть профиль" },
    champion: {
      kicker: "У Crimson Cup есть чемпион",
      title: "{name} выигрывает Crimson Cup",
      text: "Из нижней сетки до выигранного гранд-финала против {runnerUp}, по объявлению Koin Games и официальному посту Origins TCG: на Tourney Bot у гранд-финала нет счёта.",
      finals: "Финалы и списки четырёх игроков",
      post: "Официальный пост",
    },
    notes: {
      title: "Как читать сетку",
      format: "Двойное выбывание: после первого поражения игрок переходит в нижнюю сетку, после второго выбывает. Матчи идут в формате Bo{n}.",
      finals: "В финалы 25 октября выходят четверо (официальное расписание Crimson Cup): последние, кто ещё в борьбе, то есть двое из финала верхней сетки и двое победителей раунда {round} нижней сетки.",
      waiting: "Если известен только один игрок матча, мы не угадываем пару: мы пишем, кто ждёт и в каком раунде.",
      source: "Источник: официальная сетка плей-офф на Tourney Bot, турнирном боте официального Discord Origins TCG. Страница перечитывает её каждую минуту; если Tourney Bot не отвечает, остаётся последнее удачное чтение.",
      om: "Отметка OriginsMeta рядом с именем означает автора контента, автора, про-игрока или сотрудника сайта с тем же аккаунтом Discord, что и в сетке: она ведёт в его профиль.",
      link: "Сетка на Tourney Bot",
    },
    promo: "Сетка плей-офф",
  },
};

/** Riempie i segnaposto {…} di un testo. */
export const fillPo = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));

/** Nome di un turno: ottavi, quarti, semifinali e finale dei vincenti, finale dei perdenti, gran finale, poi "turno n". */
export function poRoundLabel(L: PlayoffsLabels, side: "winners" | "losers" | "grand", round: number, wbRounds: number, lbRounds: number): string {
  const r = L.rounds;
  if (side === "grand") return round > 1 ? r.grandReset : r.grand;
  if (side === "winners") {
    if (round === wbRounds) return r.wbFinal;
    if (round === wbRounds - 1) return r.wbSemi;
    if (round === wbRounds - 2) return r.wbQuarter;
    if (round === wbRounds - 3) return r.wbR16;
    return fillPo(r.wbRound, { n: round });
  }
  return round === lbRounds ? r.lbFinal : fillPo(r.lbRound, { n: round });
}
