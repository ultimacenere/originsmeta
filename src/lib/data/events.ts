import type { Locale } from "../i18n";
import type { GuideSlug } from "../content/guides";

type L10n = Record<Locale, string>;

export type Event = {
  slug: string;
  official: boolean;
  start: string; // ISO date
  end?: string;
  title: L10n;
  where: L10n;
  format?: L10n;
  prizes?: L10n;
  text: L10n;
  signup?: { label: L10n; url: string };
  /** fonte ufficiale dell'annuncio (post Steam, pagina del festival): resta il tasto "Fonte" della scheda */
  source?: string;
  /** slug della guida dedicata all'evento */
  guide?: GuideSlug;
  /**
   * la nostra news con le regole e il formato dell'evento (`news` = slug) e il testo del link nella scheda di
   * /tournaments, con il nome dell'evento dentro ("Crimson Cup rules"), come l'etichetta di `signup`. Dal 25/09/2026
   * (MQ-06): un link fisso verso l'articolo sulle regole della Crimson Cup, che prima riceveva link quasi solo dal
   * blocco "Altre news", a rotazione.
   */
  rules?: { news: string; label: L10n };
  /** i numeri dell'evento su una pagina del sito (percorso senza lingua) e il testo del link (dal 20/10/2026, Crimson Cup) */
  stats?: { path: string; label: L10n };
  /**
   * Dati strutturati dell'evento (schema.org Event, rilievo GEO-09 dell'Ondata 2, 25/09/2026), usati da
   * src/lib/jsonld/events.ts. Tutto facoltativo:
   * - `name`: il nome nei dati strutturati quando non è il titolo della scheda: il nome ufficiale ("Crimson Cup", "Crimson Cup") o il
   *   nome del gioco davanti, perché l'evento non si confonda con il festival di Valve; senza, vale `title`;
   * - `alternateName`: un altro nome con cui l'evento si cerca;
   * - `startAt`: inizio con orario e fuso (ISO 8601), solo quando la fonte ufficiale lo dà; senza, vale il giorno `start`;
   * - `image`: immagine dell'evento dal materiale ufficiale in public/media (come contenuto), al posto di og.jpg;
   * - `free`: partecipare non costa nulla (isAccessibleForFree, e l'iscrizione diventa un'offerta a prezzo 0);
   * - `festival`: l'evento fa parte dello Steam Next Fest (`steamNextFest` qui sotto), che organizza Valve.
   */
  ld?: { name?: L10n; alternateName?: L10n; startAt?: string; image?: string; free?: boolean; festival?: boolean };
};

const n = (en: string, it: string, es: string, fr: string, pt: string, de: string, ru: string): L10n => ({ en, it, es, fr, pt, de, ru });

/**
 * Lo Steam Next Fest di ottobre 2026: il festival delle demo giocabili di Valve (non di Koin Games), di cui fa parte
 * l'evento `steam-next-fest` qui sotto. Inizio con orario e fuso dal calendario ufficiale di Steam, come lo riporta la
 * guida steam-next-fest-2026 (lunedì 19 ottobre alle 10:00 ora del Pacifico, cioè le 19:00 in Italia); la fine solo
 * come giorno, perché la guida non ne dà l'ora. Nei dati strutturati è il `superEvent`, con Valve come organizzatore.
 */
export const steamNextFest = {
  slug: "steam-next-fest-october-2026",
  name: "Steam Next Fest: October 2026 Edition",
  organizer: { name: "Valve", url: "https://www.valvesoftware.com/" },
  startAt: "2026-10-19T10:00:00-07:00",
  end: "2026-10-26",
  url: "https://store.steampowered.com/sale/nextfest",
} as const;

export const events: Event[] = [
  {
    slug: "next-fest-tournament",
    official: true,
    guide: "steam-next-fest-2026",
    // testo del link dalla mappa delle query (C12): "Crimson Cup rules" / "regole della Crimson Cup" / "reglas de la Crimson Cup"
    rules: { news: "crimson-cup-format-check-in", label: n("Crimson Cup rules", "Regole della Crimson Cup", "Reglas de la Crimson Cup", "Règles de la Crimson Cup", "Regras da Crimson Cup", "Regeln des Crimson Cup", "Правила Crimson Cup") },
    // i numeri ufficiali di Koin qualificazione per qualificazione (20/10/2026), pagina /analytics/crimson-cup
    stats: { path: "/analytics/crimson-cup", label: n("Crimson Cup numbers", "Numeri della Crimson Cup", "Números de la Crimson Cup", "Chiffres de la Crimson Cup", "Números da Crimson Cup", "Zahlen zum Crimson Cup", "Цифры Crimson Cup") },
    start: "2026-10-19",
    end: "2026-10-25",
    // Titolo visibile invariato (striscia del calendario e schede): il nome ufficiale "Crimson Cup" sta in `ld.name`, nei
    // dati strutturati. Metterlo in testa anche qui è un cambio editoriale da far decidere a Pierluigi (Ondata 2, GEO-09).
    title: n("Steam Next Fest Tournament (Crimson Cup)", "Torneo dello Steam Next Fest (Crimson Cup)", "Torneo del Steam Next Fest (Crimson Cup)", "Tournoi du Steam Next Fest (Crimson Cup)", "Torneio do Steam Next Fest (Crimson Cup)", "Turnier zum Steam Next Fest (Crimson Cup)", "Турнир Steam Next Fest (Crimson Cup)"),
    where: n("Online, in game; sign-ups on the official Discord", "Online, in gioco; iscrizioni sul Discord ufficiale", "Online, en el juego; inscripciones en el Discord oficial", "En ligne, en jeu ; inscriptions sur le Discord officiel", "On-line, no jogo; inscrições no Discord oficial", "Online, im Spiel; Anmeldung im offiziellen Discord", "Онлайн, в игре; регистрация в официальном Discord"),
    // formato completato con l'annuncio sul Discord ufficiale del 24/09/2026 (news `crimson-cup-format-check-in`) e con il
    // post Steam del 05/10/2026 (news `crimson-cup-prizepool-qualifiers`: cinque qualificazioni, montepremi, sette luoghi
    // esclusi); orari e fusi come li scrive la grafica ufficiale del calendario allegata a quel post
    // (media/news-crimson-cup-prizepool.webp), senza conversioni nostre
    format: n(
      "Five qualifiers of 512 spots each, open to everyone, 32 advancing from each: AMER on 19 October at 7pm EST, EMEA on the 20th at 7pm CEST, AMER on the 21st at 9pm EST, APAC on the 22nd at 7pm SGT and EMEA on the 22nd at 7pm CEST, plus 96 wild cards. Playoffs on the 24th at 10am EST (4pm CEST) with 256 spots, four of whom reach the finals on the 25th at 10am EST. Three-deck Conquest with at least 8 unique cards between each pair of decks, decklists hidden until the top 4 (in the ban you only see the Legendary). Best-of-3 matches, best-of-5 grand final: no ban there, you have to win with all three decks. Seven locations are out of the tournament pool: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum and Nostradamus' Call. You may enter more than one qualifier.",
      "Cinque qualificazioni da 512 posti ciascuna, aperte a tutti, con 32 che passano da ognuna: AMER il 19 ottobre alle 19 EST, EMEA il 20 alle 19 CEST, AMER il 21 alle 21 EST, APAC il 22 alle 19 SGT ed EMEA il 22 alle 19 CEST, più 96 wild card. Playoff il 24 alle 10 EST (16 CEST) con 256 posti, quattro dei quali arrivano alle finali del 25 alle 10 EST. Conquest a tre mazzi con almeno 8 carte uniche fra ogni coppia, liste segrete fino alla top 4 (nel ban si vede solo la Leggendaria). Partite al meglio delle tre, gran finale al meglio delle cinque: lì niente ban, si vince con tutti e tre i mazzi. Sette luoghi sono fuori dal pool del torneo: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call. Ci si può iscrivere a più di una qualificazione.",
      "Cinco clasificatorios de 512 plazas cada uno, abiertos a todos, con 32 que pasan de cada uno: AMER el 19 de octubre a las 19:00 EST, EMEA el 20 a las 19:00 CEST, AMER el 21 a las 21:00 EST, APAC el 22 a las 19:00 SGT y EMEA el 22 a las 19:00 CEST, más 96 wild cards. Playoffs el 24 a las 10:00 EST (16:00 CEST) con 256 plazas; cuatro de sus jugadores llegan a las finales del 25, a las 10:00 EST. Conquest con tres mazos y al menos 8 cartas únicas entre cada par de mazos, listas ocultas hasta el top 4 (en el ban solo ves la Legendaria). Enfrentamientos al mejor de tres, gran final al mejor de cinco: ahí no hay ban, tienes que ganar con los tres mazos. Siete ubicaciones quedan fuera del pool del torneo: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum y Nostradamus' Call. Puedes inscribirte en más de un clasificatorio.",
      "Cinq qualifications de 512 places chacune, ouvertes à tous, avec 32 qualifiés dans chacune : AMER le 19 octobre à 19:00 EST, EMEA le 20 à 19:00 CEST, AMER le 21 à 21:00 EST, APAC le 22 à 19:00 SGT et EMEA le 22 à 19:00 CEST, plus 96 wild cards. Playoffs le 24 à 10:00 EST (16:00 CEST) avec 256 places, dont quatre joueurs atteignent les finales du 25 à 10:00 EST. Conquest à trois decks avec au moins 8 cartes uniques entre chaque paire de decks, listes cachées jusqu'au top 4 (lors du ban, vous ne voyez que la Légendaire). Matchs au meilleur des trois manches, grande finale au meilleur des cinq : pas de ban, il faut gagner avec les trois decks. Sept lieux sont hors du pool du tournoi : Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum et Nostradamus' Call. Vous pouvez vous inscrire à plus d'une qualification.",
      "Cinco classificatórias de 512 vagas cada, abertas a todos, com 32 classificados em cada uma: AMER em 19 de outubro às 19:00 EST, EMEA no dia 20 às 19:00 CEST, AMER no dia 21 às 21:00 EST, APAC no dia 22 às 19:00 SGT e EMEA no dia 22 às 19:00 CEST, mais 96 wild cards. Playoffs no dia 24 às 10:00 EST (16:00 CEST) com 256 vagas, das quais quatro chegam às finais do dia 25 às 10:00 EST. Conquest com três decks e pelo menos 8 cartas únicas entre cada par de decks, listas ocultas até o top 4 (no ban você só vê a Lendária). Partidas em melhor de três, grande final em melhor de cinco: ali não há ban, é preciso vencer com os três decks. Sete locais estão fora do pool do torneio: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call. Você pode se inscrever em mais de uma classificatória.",
      "Fünf Qualifikationen mit je 512 Plätzen, offen für alle, aus jeder kommen 32 weiter: AMER am 19. Oktober um 19:00 EST, EMEA am 20. um 19:00 CEST, AMER am 21. um 21:00 EST, APAC am 22. um 19:00 SGT und EMEA am 22. um 19:00 CEST, dazu 96 Wildcards. Playoffs am 24. um 10:00 EST (16:00 CEST) mit 256 Plätzen; vier Spieler davon erreichen die Finals am 25. um 10:00 EST. Conquest mit drei Decks und mindestens 8 einzigartigen Karten Unterschied zwischen je zwei Decks, Decklists verdeckt bis zu den Top 4 (beim Ban siehst du nur die Legendäre). Matches im Best-of-Three, großes Finale im Best-of-Five: Dort gibt es keinen Ban, du musst mit allen drei Decks gewinnen. Sieben Orte sind nicht im Pool des Turniers: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum und Nostradamus' Call. Du kannst dich für mehr als eine Qualifikation anmelden.",
      "Пять квалификаций по 512 мест каждая, открытых для всех, из каждой проходят 32 игрока: AMER 19 октября в 19:00 EST, EMEA 20-го в 19:00 CEST, AMER 21-го в 21:00 EST, APAC 22-го в 19:00 SGT и EMEA 22-го в 19:00 CEST, плюс 96 вайлд-кардов. Плей-офф 24-го в 10:00 EST (16:00 CEST) на 256 мест, четверо из этих игроков выходят в финалы 25-го в 10:00 EST. Conquest на три колоды, не меньше 8 уникальных карт разницы между каждой парой колод, списки скрыты до топ-4 (при бане видна только Легендарная). Матчи best-of-three, гранд-финал best-of-five: там бана нет, нужно выиграть всеми тремя колодами. Семь локаций исключены из пула турнира: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum и Nostradamus' Call. Записаться можно больше чем на одну квалификацию.",
    ),
    prizes: n(
      "Prizes worth $10,000, split between cash, collectibles and exclusive promo cards (breakdown of 5 October): the winner gets a 1/1 Dracula promo card, two booster box cases and $1,500; 2nd a 1/8 Dracula promo card, one case and $750; 3rd and 4th a 1/8 promo card, two booster boxes and $350; the top 8 a booster box, a 1/8 promo card and $125; the top 16 a booster box and a Finalist Plus card; the top 32 ten packs and a Finalist card; then 8, 4 and 2 packs down to the top 256.",
      "Premi per un valore complessivo di 10.000 $, divisi fra denaro, collezionabili e carte promo esclusive (ripartizione del 5 ottobre): chi vince prende una carta promo Dracula 1/1, due case di booster box e 1.500 $; il 2° una carta promo Dracula 1/8, un case e 750 $; 3° e 4° una promo 1/8, due booster box e 350 $; la top 8 un booster box, una promo 1/8 e 125 $; la top 16 un booster box e una carta Finalist Plus; la top 32 dieci pacchetti e una carta Finalist; poi 8, 4 e 2 pacchetti fino alla top 256.",
      "Premios por un valor de 10.000 dólares, repartidos entre dinero, coleccionables y cartas promo exclusivas (reparto del 5 de octubre): el ganador se lleva una carta promo Dracula 1/1, dos cases de cajas de sobres y 1.500 dólares; el 2.º, una carta promo Dracula 1/8, un case y 750 dólares; 3.º y 4.º, una promo 1/8, dos cajas de sobres y 350 dólares; el top 8, una caja de sobres, una promo 1/8 y 125 dólares; el top 16, una caja de sobres y una carta Finalist Plus; el top 32, diez sobres y una carta Finalist; después 8, 4 y 2 sobres hasta el top 256.",
      "Des lots d'une valeur totale de 10 000 dollars, répartis entre argent, objets de collection et cartes promo exclusives (répartition du 5 octobre) : le vainqueur reçoit une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars ; le 2e une carte promo Dracula 1/8, une case et 750 dollars ; les 3e et 4e une carte promo 1/8, deux boîtes de boosters et 350 dollars ; le top 8 une boîte de boosters, une carte promo 1/8 et 125 dollars ; le top 16 une boîte de boosters et une carte Finalist Plus ; le top 32 dix boosters et une carte Finalist ; puis 8, 4 et 2 boosters jusqu'au top 256.",
      "Prêmios no valor de 10.000 dólares, divididos entre dinheiro, colecionáveis e cartas promocionais exclusivas (divisão de 5 de outubro): o vencedor leva uma carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares; o 2º, uma carta promo Dracula 1/8, um case e 750 dólares; o 3º e o 4º, uma promo 1/8, duas caixas de boosters e 350 dólares; o top 8, uma caixa de boosters, uma promo 1/8 e 125 dólares; o top 16, uma caixa de boosters e uma carta Finalist Plus; o top 32, dez pacotes e uma carta Finalist; depois 8, 4 e 2 pacotes até o top 256.",
      "Preise im Wert von 10.000 Dollar, aufgeteilt in Geld, Sammelobjekte und exklusive Promokarten (Aufteilung vom 5. Oktober): Der Sieger bekommt eine Dracula-Promokarte 1/1, zwei Cases mit Booster-Displays und 1.500 Dollar; Platz 2 eine Dracula-Promokarte 1/8, ein Case und 750 Dollar; Platz 3 und 4 eine Promokarte 1/8, zwei Booster-Displays und 350 Dollar; die Top 8 ein Booster-Display, eine Promokarte 1/8 und 125 Dollar; die Top 16 ein Booster-Display und eine Finalist-Plus-Karte; die Top 32 zehn Packs und eine Finalist-Karte; danach 8, 4 und 2 Packs bis zu den Top 256.",
      "Призы общей стоимостью 10 000 долларов делятся на деньги, коллекционные предметы и эксклюзивные промокарты (распределение от 5 октября): победитель получает промокарту Dracula 1/1, два кейса бустер-боксов и 1500 долларов; 2-е место — промокарту Dracula 1/8, один кейс и 750 долларов; 3-е и 4-е места — промокарту 1/8, два бустер-бокса и 350 долларов; топ-8 — бустер-бокс, промокарту 1/8 и 125 долларов; топ-16 — бустер-бокс и карту Finalist Plus; топ-32 — десять паков и карту Finalist; дальше 8, 4 и 2 пака вплоть до топ-256.",
    ),
    text: n(
      "Koin Games' biggest event so far, run during Steam Next Fest. Players could join any qualifier regardless of where they lived, but the team asked them to sign up only for the ones they could actually attend. Content creators got wildcard invites straight into the playoffs. Check-in opened two hours before each qualifier and closed five minutes before the start, together with deck submission: whoever missed it could not play. The tournament was played on the main demo, with the tournament card list; patch 0.7 of 29 September was the last balance patch before it, and Koin hosted weekly no-stakes practice tournaments, announced on Discord. CoachCrono won it on 25 October 2026, from the losers bracket.",
      "L'evento più grande di Koin Games finora, durante lo Steam Next Fest. Ci si poteva iscrivere a qualsiasi qualificazione a prescindere da dove si vivesse, ma il team chiedeva di iscriversi solo a quelle a cui si poteva davvero partecipare. I creator avevano inviti wildcard direttamente ai playoff. Il check-in apriva due ore prima di ogni qualificazione e chiudeva cinque minuti prima dell'inizio, insieme alla consegna dei mazzi: chi lo saltava non giocava. Il torneo si è giocato sulla demo principale, con la lista carte del torneo; la patch 0.7 del 29 settembre è stata l'ultima patch di bilanciamento prima del torneo, e Koin organizzava tornei di prova settimanali senza niente in palio, annunciati su Discord. L'ha vinto CoachCrono il 25 ottobre 2026, risalendo dal tabellone dei perdenti.",
      "El mayor evento de Koin Games hasta ahora, celebrado durante el Steam Next Fest. Se podía participar en cualquier clasificatorio, se viviera donde se viviera, pero el equipo pedía inscribirse solo en los que de verdad se pudieran jugar. Los creadores de contenido recibieron invitaciones wildcard directas a los playoffs. El check-in abría dos horas antes de cada clasificatorio y cerraba cinco minutos antes del inicio, junto con la entrega de mazos: quien se lo perdía no podía jugar. El torneo se jugó en la demo principal, con la lista de cartas del torneo; el parche 0.7 del 29 de septiembre fue el último parche de equilibrio antes del torneo, y Koin organizaba torneos de práctica semanales sin nada en juego, anunciados en Discord. Lo ganó CoachCrono el 25 de octubre de 2026, remontando desde el cuadro de perdedores.",
      "Le plus grand événement de Koin Games à ce jour, organisé pendant le Steam Next Fest. On pouvait participer à n'importe quelle qualification, où que l'on vive, mais l'équipe demandait de ne s'inscrire qu'à celles auxquelles on pouvait vraiment participer. Les créateurs de contenu ont reçu des invitations wildcard directement pour les playoffs. Le check-in ouvrait deux heures avant chaque qualification et fermait cinq minutes avant le début, en même temps que la remise des decks : qui le manquait ne jouait pas. Le tournoi s'est joué sur la démo principale, avec la liste de cartes du tournoi ; le patch 0.7 du 29 septembre a été le dernier patch d'équilibrage avant le tournoi, et Koin organisait des tournois d'entraînement hebdomadaires sans enjeu, annoncés sur Discord. CoachCrono l'a remporté le 25 octobre 2026, en remontant depuis le tableau des perdants.",
      "O maior evento da Koin Games até agora, durante o Steam Next Fest. Dava para participar de qualquer classificatória, não importava onde a pessoa morasse, mas a equipe pedia que cada um se inscrevesse só naquelas de que realmente pudesse participar. Criadores de conteúdo receberam convites wildcard direto para os playoffs. O check-in abria duas horas antes de cada classificatória e fechava cinco minutos antes do início, junto com a entrega dos decks: quem perdia o check-in não jogava. O torneio foi jogado na demo principal, com a lista de cartas do torneio; o patch 0.7 de 29 de setembro foi o último patch de balanceamento antes do torneio, e a Koin organizava torneios de treino semanais sem nada em jogo, anunciados no Discord. CoachCrono venceu em 25 de outubro de 2026, vindo da chave dos perdedores.",
      "Das bisher größte Event von Koin Games, während des Steam Next Fest. Man konnte an jeder Qualifikation teilnehmen, egal wo man wohnte, aber das Team bat darum, sich nur für die anzumelden, an denen man wirklich teilnehmen konnte. Content Creator erhielten Wildcard-Einladungen direkt in die Playoffs. Der Check-in öffnete zwei Stunden vor jeder Qualifikation und schloss fünf Minuten vor dem Start, zusammen mit der Abgabe der Decks: Wer ihn verpasste, konnte nicht spielen. Das Turnier lief auf der Hauptdemo mit der Kartenliste des Turniers; Patch 0.7 vom 29. September war der letzte Balance-Patch davor, und Koin veranstaltete wöchentliche Trainingsturniere ohne Einsatz, die auf Discord angekündigt wurden. Gewonnen hat es CoachCrono am 25. Oktober 2026, aus dem Loser-Bracket.",
      "Крупнейшее на сегодня событие Koin Games, прошедшее во время Steam Next Fest. Участвовать можно было в любой квалификации, где бы игрок ни жил, но команда просила записываться только на те, в которых действительно получится сыграть. Контент-мейкеры получили вайлд-кард-приглашения сразу в плей-офф. Чек-ин открывался за два часа до каждой квалификации и закрывался за пять минут до старта вместе с подачей колод: кто его пропускал, сыграть не мог. Турнир прошёл на основной демоверсии со списком карт турнира; патч 0.7 от 29 сентября стал последним балансным патчем перед турниром, а Koin каждую неделю проводила тренировочные турниры без призов и объявляла их в Discord. Турнир выиграл CoachCrono 25 октября 2026 года, пройдя через нижнюю сетку.",
    ),
    signup: { label: n("Sign up on Discord", "Iscriviti su Discord", "Inscríbete en Discord", "S'inscrire sur Discord", "Inscreva-se no Discord", "Auf Discord anmelden", "Записаться в Discord"), url: "https://discord.gg/originstcg" },
    source: "https://store.steampowered.com/news/app/4429430/view/1843481262690278",
    // Inizio = qualificazione AMER aggiunta il 05/10/2026, 19 ottobre alle 19:00 "EST" della grafica ufficiale. Koin scrive
    // EST ma la sua stessa grafica fa coincidere le 10 EST con le 16 CEST, cioè l'ora legale della costa est (UTC-4, in vigore
    // fino al 1° novembre): quindi -04:00, le 23:00 UTC, l'1:00 del 20 ottobre in Italia (prima: EMEA del 20 alle 19:00 CEST).
    // La fine resta un giorno: la grafica dà l'ora d'inizio delle finali, non quella di chiusura.
    // Iscriversi è gratis (offerta a prezzo 0 verso il Discord ufficiale). È il torneo di Koin dello Steam Next Fest: il
    // festival è il `superEvent`, come per la classificata qui sotto, e l'organizzatore resta Koin Games.
    ld: {
      name: n("Crimson Cup", "Crimson Cup", "Crimson Cup", "Crimson Cup", "Crimson Cup", "Crimson Cup", "Crimson Cup"),
      alternateName: n("Origins TCG Steam Next Fest tournament", "Torneo dello Steam Next Fest di Origins TCG", "Torneo del Steam Next Fest de Origins TCG", "Tournoi du Steam Next Fest d'Origins TCG", "Torneio do Steam Next Fest de Origins TCG", "Origins TCG Turnier zum Steam Next Fest", "Турнир Origins TCG на Steam Next Fest"),
      startAt: "2026-10-19T19:00:00-04:00",
      image: "/media/news-crimson-cup.webp",
      free: true,
      festival: true,
    },
  },
  {
    slug: "steam-next-fest",
    official: true,
    // la guida della classificata (C13, Ondata 3): la guida al festival resta collegata alla Crimson Cup (next-fest-tournament)
    guide: "origins-tcg-ranked",
    start: "2026-10-19",
    end: "2026-10-26",
    title: n("Steam Next Fest: ranked in the demo", "Steam Next Fest: la classificata nella demo", "Steam Next Fest: la clasificatoria en la demo", "Steam Next Fest : le classé dans la démo", "Steam Next Fest: a ranqueada na demo", "Steam Next Fest: Ranked in der Demo", "Steam Next Fest: рейтинговый режим в демоверсии"),
    where: n("Steam", "Steam", "Steam", "Steam", "Steam", "Steam", "Steam"),
    text: n(
      "Origins TCG took part in the festival with its demo, where ranked mode had opened on 15 October with update 0.7.1, four days before the start (the team had announced ranked for the festival on 21 September, the day of the first big demo update). Koin's numbers of 27 October: over 20,000 Steam wishlists, 30,000 demo downloads, more than 300 people streaming the game and a peak of over 5,000 viewers during the Crimson Cup. The day after the festival, on 27 October 2026, the demo ended and Origins TCG went into Early Access on Steam with version 0.8.",
      "Origins TCG ha partecipato al festival con la sua demo, dove la classificata era partita il 15 ottobre con l'aggiornamento 0.7.1, quattro giorni prima dell'inizio (il team l'aveva annunciata per il festival il 21 settembre, il giorno del primo grande aggiornamento della demo). I numeri di Koin del 27 ottobre: oltre 20.000 wishlist su Steam, 30.000 download della demo, più di 300 persone che hanno trasmesso il gioco e un picco di oltre 5.000 spettatori durante la Crimson Cup. Il giorno dopo la fine del festival, il 27 ottobre 2026, la demo è finita e Origins TCG è entrato in Accesso anticipato su Steam con la versione 0.8.",
      "Origins TCG participó en el festival con su demo, donde la clasificatoria se había abierto el 15 de octubre con la actualización 0.7.1, cuatro días antes del inicio (el equipo la había anunciado para el festival el 21 de septiembre, el día de la primera gran actualización de la demo). Las cifras de Koin del 27 de octubre: más de 20.000 wishlists en Steam, 30.000 descargas de la demo, más de 300 personas que retransmitieron el juego y un pico de más de 5.000 espectadores durante la Crimson Cup. Al día siguiente del final del festival, el 27 de octubre de 2026, la demo terminó y Origins TCG entró en Acceso anticipado en Steam con la versión 0.8.",
      "Origins TCG a participé au festival avec sa démo, où le mode classé avait ouvert le 15 octobre avec la mise à jour 0.7.1, quatre jours avant le début (l'équipe l'avait annoncé pour le festival le 21 septembre, le jour de la première grande mise à jour de la démo). Les chiffres de Koin du 27 octobre : plus de 20 000 ajouts à la liste de souhaits sur Steam, 30 000 téléchargements de la démo, plus de 300 personnes qui ont diffusé le jeu en stream et un pic de plus de 5 000 spectateurs pendant la Crimson Cup. Le lendemain de la fin du festival, le 27 octobre 2026, la démo a pris fin et Origins TCG est passé en Accès anticipé sur Steam avec la version 0.8.",
      "Origins TCG participou do festival com a sua demo, onde a ranqueada tinha aberto em 15 de outubro com a atualização 0.7.1, quatro dias antes do início (a equipe a tinha anunciado para o festival em 21 de setembro, o dia da primeira grande atualização da demo). Os números da Koin de 27 de outubro: mais de 20.000 wishlists na Steam, 30.000 downloads da demo, mais de 300 pessoas transmitindo o jogo e um pico de mais de 5.000 espectadores durante a Crimson Cup. No dia seguinte ao fim do festival, 27 de outubro de 2026, a demo terminou e Origins TCG entrou em Acesso Antecipado na Steam com a versão 0.8.",
      "Origins TCG war mit seiner Demo beim Festival dabei; der Ranglisten-Modus war dort schon am 15. Oktober mit dem Update 0.7.1 gestartet, vier Tage vor Beginn (angekündigt hatte das Team ihn für das Festival am 21. September, dem Tag des ersten großen Demo-Updates). Die Zahlen von Koin vom 27. Oktober: über 20.000 Wunschlisten-Einträge auf Steam, 30.000 Downloads der Demo, mehr als 300 Leute, die das Spiel gestreamt haben, und ein Höchststand von über 5.000 Zuschauern während des Crimson Cup. Am Tag nach dem Festival, dem 27. Oktober 2026, endete die Demo, und Origins TCG ging mit Version 0.8 in den Early Access auf Steam.",
      "Origins TCG участвовала в фестивале со своей демоверсией, где рейтинговый режим открылся ещё 15 октября с обновлением 0.7.1, за четыре дня до начала (команда анонсировала его к фестивалю 21 сентября, в день первого крупного обновления демоверсии). Цифры Koin от 27 октября: больше 20 000 добавлений в список желаемого в Steam, 30 000 загрузок демоверсии, больше 300 человек, которые стримили игру, и пик более 5000 зрителей во время Crimson Cup. На следующий день после фестиваля, 27 октября 2026, демоверсия завершилась, и Origins TCG вышла в раннем доступе в Steam с версией 0.8.",
    ),
    signup: { label: n("Steam page", "Pagina Steam", "Página de Steam", "Page Steam", "Página da Steam", "Steam-Seite", "Страница в Steam"), url: "https://store.steampowered.com/app/4429430/Origins_TCG/" },
    source: "https://store.steampowered.com/sale/nextfest",
    // L'evento è di Koin (la classificata nella demo durante il festival: aperta il 15/10/2026 con la 0.7.1), dentro il
    // festival di Valve: nei dati strutturati il nome porta il gioco davanti e il festival diventa il `superEvent`.
    // Nessun orario: l'evento coincide con il festival. Dal 28/10/2026 il testo è al passato, con i numeri ufficiali del
    // post Steam del 27/10 e la fine della demo. Niente `free`: all'evento non ci si iscriveva, e un'offerta a prezzo 0
    // verso la pagina Steam del gioco direbbe che l'evento è il gioco.
    ld: {
      name: n(
        "Origins TCG at Steam Next Fest: ranked in the demo",
        "Origins TCG allo Steam Next Fest: la classificata nella demo",
        "Origins TCG en el Steam Next Fest: la clasificatoria en la demo",
        "Origins TCG au Steam Next Fest : le classé dans la démo",
        "Origins TCG no Steam Next Fest: a ranqueada na demo",
        "Origins TCG beim Steam Next Fest: Ranked in der Demo",
        "Origins TCG на Steam Next Fest: рейтинговый режим в демоверсии",
      ),
      image: "/media/keyart-queen-of-hearts.webp",
      festival: true,
    },
  },
  {
    slug: "big-bobs-playtest-battle",
    official: true,
    // la news dell'annuncio racconta il formato (primo Conquest, al meglio delle tre, eliminazione diretta)
    rules: { news: "big-bobs-playtest-battle", label: n("Big Bob's format", "Formato del Big Bob's", "Formato del Big Bob's", "Format du Big Bob's", "Formato do Big Bob's", "Format von Big Bob's", "Формат Big Bob's") },
    start: "2026-08-28",
    title: n("Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle"),
    where: n("Playtest build; brackets on Discord", "Build del playtest; tabelloni su Discord", "Versión del playtest; cuadros en Discord", "Build du playtest ; tableaux sur Discord", "Build do playtest; chaves no Discord", "Playtest-Build; Turnierbäume auf Discord", "Сборка плейтеста; сетки в Discord"),
    format: n(
      "Best-of-3, single elimination. First ever use of the Conquest format: several decks, a different Legendary in each, at least nine cards of difference, one ban.",
      "Best-of-3, eliminazione diretta. Primo uso del formato Conquest: più mazzi, una Leggendaria diversa in ciascuno, almeno nove carte di differenza, un ban.",
      "Al mejor de tres, eliminación directa. Estreno del formato Conquest: varios mazos, una Legendaria distinta en cada uno, al menos nueve cartas de diferencia, un ban.",
      "Au meilleur des trois manches, élimination directe. Première utilisation du format Conquest : plusieurs decks, une Légendaire différente dans chacun, au moins neuf cartes de différence, un ban.",
      "Melhor de três, eliminação simples. Primeiro uso do formato Conquest: vários decks, uma Lendária diferente em cada um, pelo menos nove cartas de diferença, um ban.",
      "Best-of-Three, K.-o.-System. Erster Einsatz des Conquest-Formats: mehrere Decks, in jedem eine andere Legendäre, mindestens neun Karten Unterschied, ein Ban.",
      "Best-of-three, на выбывание. Первое применение формата Conquest: несколько колод, в каждой своя Легендарная, не меньше девяти карт разницы, один бан.",
    ),
    prizes: n("Wildcard invite to the Next Fest tournament and Collector Packs.", "Invito wildcard al torneo del Next Fest e Collector Pack.", "Invitación wildcard al torneo del Next Fest y Collector Packs.", "Invitation wildcard au tournoi du Next Fest et Collector Packs.", "Convite wildcard para o torneio do Next Fest e Collector Packs.", "Wildcard-Einladung zum Turnier des Next Fest und Collector Packs.", "Вайлд-кард-приглашение на турнир Next Fest и Collector Packs."),
    text: n(
      "Over 130 players registered. Played on patch 0.6.3, released two days earlier.",
      "Oltre 130 iscritti. Giocato sulla patch 0.6.3, uscita due giorni prima.",
      "Más de 130 jugadores inscritos. Se jugó en el parche 0.6.3, publicado dos días antes.",
      "Plus de 130 inscrits. Joué sur le patch 0.6.3, sorti deux jours plus tôt.",
      "Mais de 130 jogadores inscritos. Jogado no patch 0.6.3, lançado dois dias antes.",
      "Über 130 Spieler angemeldet. Gespielt auf Patch 0.6.3, der zwei Tage vorher erschienen war.",
      "Зарегистрировались больше 130 игроков. Играли на патче 0.6.3, вышедшем за два дня до турнира.",
    ),
    source: "https://store.steampowered.com/news/app/4429430/view/1841579228677617",
  },
  {
    slug: "first-demo-tournament",
    official: true,
    start: "2026-07-24",
    title: n("First demo tournament", "Primo torneo della demo", "Primer torneo de la demo", "Premier tournoi de la démo", "Primeiro torneio da demo", "Erstes Turnier der Demo", "Первый турнир демоверсии"),
    where: n("Discord", "Discord", "Discord", "Discord", "Discord", "Discord", "Discord"),
    format: n("For fun, demo decks.", "Amichevole, mazzi della demo.", "Amistoso, con mazos de la demo.", "Amical, decks de la démo.", "Amistoso, com decks da demo.", "Zum Spaß, mit Decks der Demo.", "Для удовольствия, с колодами демоверсии."),
    prizes: n("Wildcard invite to the Next Fest tournament and a secret prize.", "Invito wildcard al torneo del Next Fest e un premio segreto.", "Invitación wildcard al torneo del Next Fest y un premio secreto.", "Invitation wildcard au tournoi du Next Fest et un prix secret.", "Convite wildcard para o torneio do Next Fest e um prêmio secreto.", "Wildcard-Einladung zum Turnier des Next Fest und ein geheimer Preis.", "Вайлд-кард-приглашение на турнир Next Fest и секретный приз."),
    text: n(
      "Announced with the first demo stats: over 1,000 players and 13,000 matches in the first week, with a median play time of 1h51m.",
      "Annunciato insieme ai primi numeri della demo: oltre 1.000 giocatori e 13.000 partite nella prima settimana, con un tempo di gioco mediano di 1h51m.",
      "Anunciado junto con las primeras cifras de la demo: más de 1.000 jugadores y 13.000 partidas en la primera semana, con una mediana de tiempo de juego de 1 h 51 min.",
      "Annoncé avec les premiers chiffres de la démo : plus de 1 000 joueurs et 13 000 parties la première semaine, pour un temps de jeu médian de 1 h 51 min.",
      "Anunciado junto com os primeiros números da demo: mais de 1.000 jogadores e 13.000 partidas na primeira semana, com tempo de jogo mediano de 1h51min.",
      "Angekündigt zusammen mit den ersten Zahlen der Demo: über 1.000 Spieler und 13.000 Partien in der ersten Woche, bei einer mittleren Spielzeit von 1 Std. 51 Min.",
      "Объявлен вместе с первыми цифрами демоверсии: больше 1000 игроков и 13 000 матчей за первую неделю при медианном игровом времени 1 ч 51 мин.",
    ),
    source: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
  },
  {
    slug: "card-party-fort-lauderdale",
    official: true,
    start: "2026-07-24",
    end: "2026-07-26",
    title: n("Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale"),
    where: n("Card show, Florida (USA)", "Fiera del collezionismo, Florida (USA)", "Feria de cartas coleccionables, Florida (EE. UU.)", "Salon de cartes, Floride (États-Unis)", "Feira de cartas colecionáveis, Flórida (EUA)", "Kartenmesse, Florida (USA)", "Выставка карт, Флорида (США)"),
    text: n(
      "Part of the team took Origins to collectors, with the first public pack openings and a Slab giveaway for anyone pulling a 10/10 Alternate Art.",
      "Parte del team ha portato Origins ai collezionisti, con le prime aperture pubbliche di pacchetti e uno Slab in regalo a chi pescava un'Alternate Art 10/10.",
      "Parte del equipo llevó Origins a los coleccionistas, con las primeras aperturas públicas de sobres y un Slab de regalo para quien sacara una Alternate Art 10/10.",
      "Une partie de l'équipe a présenté Origins aux collectionneurs, avec les premières ouvertures publiques de boosters et un Slab offert à qui tirait une Alternate Art 10/10.",
      "Parte da equipe levou Origins aos colecionadores, com as primeiras aberturas públicas de pacotes e um Slab de presente para quem tirasse uma Alternate Art 10/10.",
      "Ein Teil des Teams hat Origins zu den Sammlern gebracht, mit den ersten öffentlichen Pack-Openings und einem Slab als Geschenk für alle, die eine Alternate Art 10/10 gezogen haben.",
      "Часть команды представила Origins коллекционерам: первые публичные открытия паков и Slab в подарок тому, кто вытащит Alternate Art 10/10.",
    ),
    source: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
  },
];

export function upcomingEvents(today = new Date()): Event[] {
  const t = today.toISOString().slice(0, 10);
  return events.filter((e) => (e.end ?? e.start) >= t).sort((a, b) => a.start.localeCompare(b.start));
}

export function pastEvents(today = new Date()): Event[] {
  const t = today.toISOString().slice(0, 10);
  return events.filter((e) => (e.end ?? e.start) < t).sort((a, b) => b.start.localeCompare(a.start));
}
