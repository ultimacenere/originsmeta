import type { Locale } from "./i18n";

/**
 * Testi della pagina dell'Harvest Bowl (/[lingua]/events/harvest-bowl, 19/11/2026). Solo fatti del post Steam di Koin
 * del 13/11/2026 e delle schede dei due tornei (src/lib/harvestBowl.ts). `en` è il tipo di riferimento. Spagnolo neutro
 * col tú, francese col vous e lo spazio insecabile prima di : ; ? !, portoghese del Brasile col você.
 * Segnaposto: {name} nome del torneo, {n} numero, {size} posti, {utc} {et} {cet} ore fisse.
 */

const en = {
  metaTitle: "Harvest Bowl 2026: schedule, format, prizes and sign-up",
  metaDescription:
    "Origins TCG Harvest Bowl, 28–29 November 2026: two 512-player qualifiers, a 128-player Swiss final day with Top 8, Bo3 with a 3-card sideboard. Sign-up here.",
  kicker: "Origins TCG tournament",
  title: "Harvest Bowl 2026",
  lead: "The Harvest Bowl is Koin Games' Origins TCG tournament of 28 and 29 November 2026, played on OriginsMeta: two double-elimination qualifiers of 512 players on Saturday, then the final day on Sunday with the best 128.",
  facts: { dates: "28–29 November 2026", where: "Online · Origins TCG on Steam", seats: "2 qualifiers × 512 players", entry: "Free to enter" },
  cta: { signup: "Sign up for {name}", waitlist: "Join the waitlist for {name}", rulebook: "Rulebook", faq: "FAQ", discord: "Official Discord" },
  schedule: {
    title: "Schedule",
    intro: "Times as announced by Koin Games. Under each date you'll find the time where you are.",
    yourTime: "Your time:",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "Qualifier 1", day: "Saturday 28 November", text: "Double elimination, 512 players. The top 64 go to Sunday: 32 from the winners bracket and 32 from the losers bracket." },
      q2: { name: "Qualifier 2", day: "Saturday 28 November", text: "Same format as Qualifier 1, with its own sign-up and check-in. The top 64 go to Sunday." },
      final: { name: "Final day", day: "Sunday 29 November", text: "The 128 qualified players play a seeded Swiss, then a Top 8 cut. It's a separate tournament: the link appears here as soon as the organizers create it." },
    },
    notCreated: "Not created yet",
    open: "Open the tournament",
    status: { open: "Sign-ups open", full: "Full · waitlist open", running: "In progress", finished: "Finished", cancelled: "Cancelled" },
    seats: "{n}/{size} registered",
    waitlist: "{n} on the waitlist",
    live: "Numbers update every few minutes.",
  },
  format: {
    title: "Format",
    items: [
      "Two qualifiers on Saturday, each a double-elimination bracket of 512 players.",
      "64 players from each qualifier make it to Sunday: 32 from the winners bracket and 32 from the losers bracket.",
      "On Sunday the 128 qualified players play a seeded Swiss, followed by a Top 8 cut.",
      "Every match is Best-of-3.",
      "Check-in is required before each tournament, and players who don't show up on time lose the match: the exact times are in the rulebook.",
    ],
    note: "Koin Games plans to use Swiss in the qualifiers starting with the December tournament.",
  },
  decks: {
    title: "Deck rules",
    items: [
      "One main deck plus a sideboard of 3 cards, with open decklists.",
      "Game 1 of every round is played with the main deck.",
      "In games 2 and 3 you can swap in any number of your sideboard cards.",
    ],
    patch: "The tournament is played on the balance patch of 17 November, the last update before the event unless a hotfix is needed.",
    patchLink: "What changed on 17 November",
    builder: "Build and test your list",
  },
  prizes: {
    title: "Prizes",
    items: ["Top 32: the next set of Tournament Promo cards.", "Everyone who reaches Day 2: a prize as well."],
    note: "Prizes are tournament-exclusive items, as announced by Koin Games.",
  },
  signup: {
    title: "How to sign up",
    steps: [
      "Sign in to OriginsMeta with Discord, Steam or email.",
      "Open Qualifier 1 or Qualifier 2 and press the sign-up button. When a qualifier is full you join the waitlist and move up if someone leaves.",
      "Submit your deck and your 3-card sideboard before the start.",
      "On Saturday, check in before the start and play your matches from the match room.",
    ],
    note: "Announcements from the organizers reach every registered player in the envelope at the top of the site.",
  },
  organizers: {
    title: "Organizers",
    koin: "The Harvest Bowl is an official tournament by Koin Games, the studio behind Origins TCG.",
    organizer: "Tournament organizer",
    judges: "Judges",
    platform: "OriginsMeta is a fan site made by players and hosts the tournament platform (sign-ups, check-in, brackets, match rooms). It is not an official Origins TCG site.",
  },
  faq: {
    title: "Questions",
    items: [
      { q: "When is the Harvest Bowl?", a: "On Saturday 28 November 2026 (Qualifier 1 at 15:00 UTC, Qualifier 2 at 21:00 UTC) and on Sunday 29 November (final day at 15:00 UTC)." },
      { q: "Where is it played?", a: "Online, in Origins TCG on Steam. Sign-ups, check-in, pairings and results are on OriginsMeta." },
      { q: "Does it cost anything?", a: "No: signing up for the qualifiers is free." },
      { q: "Where are the full rules?", a: "In Koin Games' rulebook and FAQ, linked at the top of this page. For anything else, ask on the official Discord." },
    ],
  },
  source: "Source: Koin Games' announcement on Steam, 13 November 2026.",
  sourceLink: "Read the announcement",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026: schedule, format and prizes",
};

export type HarvestBowlLabels = typeof en;

const it: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026: orari, formato, premi e iscrizione",
  metaDescription:
    "Harvest Bowl di Origins TCG, 28–29 novembre 2026: due qualificazioni da 512, finale svizzera da 128 con Top 8, al meglio di tre con riserva di 3 carte.",
  kicker: "Torneo di Origins TCG",
  title: "Harvest Bowl 2026",
  lead: "La Harvest Bowl è il torneo di Origins TCG di Koin Games del 28 e 29 novembre 2026, giocato su OriginsMeta: sabato due qualificazioni a doppia eliminazione da 512 giocatori, domenica la giornata finale con i migliori 128.",
  facts: { dates: "28–29 novembre 2026", where: "Online · Origins TCG su Steam", seats: "2 qualificazioni × 512 giocatori", entry: "Iscrizione gratuita" },
  cta: { signup: "Iscriviti a {name}", waitlist: "Lista d'attesa di {name}", rulebook: "Regolamento", faq: "FAQ", discord: "Discord ufficiale" },
  schedule: {
    title: "Programma",
    intro: "Orari annunciati da Koin Games. Sotto ogni data trovi l'ora dove ti trovi.",
    yourTime: "Da te:",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "Qualificazione 1", day: "Sabato 28 novembre", text: "Doppia eliminazione, 512 giocatori. I primi 64 vanno a domenica: 32 dal tabellone dei vincenti e 32 da quello dei perdenti." },
      q2: { name: "Qualificazione 2", day: "Sabato 28 novembre", text: "Stesso formato della Qualificazione 1, con iscrizione e check-in suoi. I primi 64 vanno a domenica." },
      final: { name: "Giornata finale", day: "Domenica 29 novembre", text: "I 128 qualificati giocano una svizzera con teste di serie, poi una Top 8. È un torneo a parte: il link compare qui appena gli organizzatori lo creano." },
    },
    notCreated: "Non ancora creato",
    open: "Apri il torneo",
    status: { open: "Iscrizioni aperte", full: "Pieno · lista d'attesa aperta", running: "In corso", finished: "Finito", cancelled: "Annullato" },
    seats: "{n}/{size} iscritti",
    waitlist: "{n} in lista d'attesa",
    live: "I numeri si aggiornano ogni pochi minuti.",
  },
  format: {
    title: "Formato",
    items: [
      "Sabato due qualificazioni, ognuna con un tabellone a doppia eliminazione da 512 giocatori.",
      "Da ogni qualificazione passano a domenica 64 giocatori: 32 dal tabellone dei vincenti e 32 da quello dei perdenti.",
      "Domenica i 128 qualificati giocano una svizzera con teste di serie, seguita da una Top 8.",
      "Tutte le partite sono al meglio di tre.",
      "Prima di ogni torneo serve il check-in, e chi non si presenta in tempo perde la partita: i tempi esatti sono nel regolamento.",
    ],
    note: "Koin Games conta di usare la svizzera nelle qualificazioni dal torneo di dicembre.",
  },
  decks: {
    title: "Regole dei mazzi",
    items: [
      "Un mazzo principale più una riserva di 3 carte, con liste pubbliche.",
      "La prima partita di ogni turno si gioca con il mazzo principale.",
      "Nella seconda e nella terza puoi inserire quante carte vuoi della riserva.",
    ],
    patch: "Il torneo si gioca sulla patch di bilanciamento del 17 novembre, l'ultimo aggiornamento prima dell'evento salvo correzioni urgenti.",
    patchLink: "Che cosa è cambiato il 17 novembre",
    builder: "Costruisci e prova la tua lista",
  },
  prizes: {
    title: "Premi",
    items: ["Top 32: il prossimo set di carte Tournament Promo.", "Chi arriva al secondo giorno: anche per loro un premio."],
    note: "I premi sono oggetti esclusivi del torneo, come li ha annunciati Koin Games.",
  },
  signup: {
    title: "Come iscriversi",
    steps: [
      "Entra in OriginsMeta con Discord, Steam o email.",
      "Apri la Qualificazione 1 o la Qualificazione 2 e premi il tasto per iscriverti. Se la qualificazione è piena entri in lista d'attesa e sali quando qualcuno si ritira.",
      "Consegna il mazzo e la riserva di 3 carte prima dell'inizio.",
      "Sabato fai il check-in prima dell'inizio e gioca le partite dalla stanza partita.",
    ],
    note: "Gli annunci degli organizzatori arrivano a ogni iscritto nella busta in cima al sito.",
  },
  organizers: {
    title: "Organizzatori",
    koin: "La Harvest Bowl è un torneo ufficiale di Koin Games, lo studio di Origins TCG.",
    organizer: "Organizzatore del torneo",
    judges: "Arbitri",
    platform: "OriginsMeta è un sito fan fatto da giocatori e ospita la piattaforma del torneo (iscrizioni, check-in, tabelloni, stanze partita). Non è un sito ufficiale di Origins TCG.",
  },
  faq: {
    title: "Domande",
    items: [
      { q: "Quando si gioca la Harvest Bowl?", a: "Sabato 28 novembre 2026 (Qualificazione 1 alle 16:00 italiane, Qualificazione 2 alle 22:00) e domenica 29 novembre (giornata finale alle 16:00)." },
      { q: "Dove si gioca?", a: "Online, in Origins TCG su Steam. Iscrizioni, check-in, abbinamenti e risultati sono su OriginsMeta." },
      { q: "Si paga qualcosa?", a: "No: l'iscrizione alle qualificazioni è gratuita." },
      { q: "Dove sono le regole complete?", a: "Nel regolamento e nelle FAQ di Koin Games, linkati in cima a questa pagina. Per tutto il resto si chiede sul Discord ufficiale." },
    ],
  },
  source: "Fonte: annuncio di Koin Games su Steam, 13 novembre 2026.",
  sourceLink: "Leggi l'annuncio",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026: programma, formato e premi",
};

const es: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026: horarios, formato, premios e inscripción",
  metaDescription:
    "Harvest Bowl de Origins TCG, 28–29 de noviembre de 2026: dos clasificatorias de 512, final suizo de 128 con Top 8, al mejor de tres y banquillo de 3.",
  kicker: "Torneo de Origins TCG",
  title: "Harvest Bowl 2026",
  lead: "La Harvest Bowl es el torneo de Origins TCG de Koin Games del 28 y 29 de noviembre de 2026, jugado en OriginsMeta: el sábado, dos clasificatorias de doble eliminación de 512 jugadores; el domingo, la jornada final con los 128 mejores.",
  facts: { dates: "28–29 de noviembre de 2026", where: "Online · Origins TCG en Steam", seats: "2 clasificatorias × 512 jugadores", entry: "Inscripción gratuita" },
  cta: { signup: "Inscríbete en {name}", waitlist: "Lista de espera de {name}", rulebook: "Reglamento", faq: "FAQ", discord: "Discord oficial" },
  schedule: {
    title: "Calendario",
    intro: "Horarios anunciados por Koin Games. Debajo de cada fecha tienes la hora donde estás.",
    yourTime: "En tu zona:",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "Clasificatoria 1", day: "Sábado 28 de noviembre", text: "Doble eliminación, 512 jugadores. Los 64 mejores pasan al domingo: 32 del cuadro de ganadores y 32 del de perdedores." },
      q2: { name: "Clasificatoria 2", day: "Sábado 28 de noviembre", text: "Mismo formato que la Clasificatoria 1, con su propia inscripción y check-in. Los 64 mejores pasan al domingo." },
      final: { name: "Jornada final", day: "Domingo 29 de noviembre", text: "Los 128 clasificados juegan un suizo con cabezas de serie y después un Top 8. Es un torneo aparte: el enlace aparecerá aquí en cuanto los organizadores lo creen." },
    },
    notCreated: "Aún no creado",
    open: "Abrir el torneo",
    status: { open: "Inscripciones abiertas", full: "Lleno · lista de espera abierta", running: "En curso", finished: "Terminado", cancelled: "Cancelado" },
    seats: "{n}/{size} inscritos",
    waitlist: "{n} en lista de espera",
    live: "Las cifras se actualizan cada pocos minutos.",
  },
  format: {
    title: "Formato",
    items: [
      "El sábado, dos clasificatorias, cada una con un cuadro de doble eliminación de 512 jugadores.",
      "De cada clasificatoria pasan al domingo 64 jugadores: 32 del cuadro de ganadores y 32 del de perdedores.",
      "El domingo los 128 clasificados juegan un suizo con cabezas de serie, seguido de un Top 8.",
      "Todas las partidas son al mejor de tres.",
      "Antes de cada torneo hay que hacer el check-in, y quien no se presenta a tiempo pierde la partida: los tiempos exactos están en el reglamento.",
    ],
    note: "Koin Games prevé usar el suizo en las clasificatorias a partir del torneo de diciembre.",
  },
  decks: {
    title: "Reglas de los mazos",
    items: [
      "Un mazo principal y un banquillo de 3 cartas, con listas públicas.",
      "La primera partida de cada ronda se juega con el mazo principal.",
      "En la segunda y la tercera puedes meter todas las cartas del banquillo que quieras.",
    ],
    patch: "El torneo se juega con el parche de equilibrio del 17 de noviembre, la última actualización antes del evento salvo correcciones urgentes.",
    patchLink: "Qué cambió el 17 de noviembre",
    builder: "Construye y prueba tu lista",
  },
  prizes: {
    title: "Premios",
    items: ["Top 32: el próximo set de cartas Tournament Promo.", "Quien llegue al segundo día: también un premio."],
    note: "Los premios son objetos exclusivos del torneo, tal como los anunció Koin Games.",
  },
  signup: {
    title: "Cómo inscribirse",
    steps: [
      "Entra en OriginsMeta con Discord, Steam o correo.",
      "Abre la Clasificatoria 1 o la Clasificatoria 2 y pulsa el botón para inscribirte. Si está llena, entras en la lista de espera y subes cuando alguien se retira.",
      "Entrega tu mazo y tu banquillo de 3 cartas antes del inicio.",
      "El sábado, haz el check-in antes del inicio y juega tus partidas desde la sala de la partida.",
    ],
    note: "Los anuncios de los organizadores llegan a cada inscrito en el sobre de la parte superior del sitio.",
  },
  organizers: {
    title: "Organizadores",
    koin: "La Harvest Bowl es un torneo oficial de Koin Games, el estudio de Origins TCG.",
    organizer: "Organizador del torneo",
    judges: "Jueces",
    platform: "OriginsMeta es un sitio de fans hecho por jugadores y aloja la plataforma del torneo (inscripciones, check-in, cuadros, salas de partida). No es un sitio oficial de Origins TCG.",
  },
  faq: {
    title: "Preguntas",
    items: [
      { q: "¿Cuándo se juega la Harvest Bowl?", a: "El sábado 28 de noviembre de 2026 (Clasificatoria 1 a las 15:00 UTC, Clasificatoria 2 a las 21:00 UTC) y el domingo 29 de noviembre (jornada final a las 15:00 UTC)." },
      { q: "¿Dónde se juega?", a: "Online, en Origins TCG en Steam. Inscripciones, check-in, emparejamientos y resultados están en OriginsMeta." },
      { q: "¿Cuesta algo?", a: "No: la inscripción a las clasificatorias es gratuita." },
      { q: "¿Dónde están las reglas completas?", a: "En el reglamento y las FAQ de Koin Games, enlazados al principio de esta página. Para todo lo demás, pregunta en el Discord oficial." },
    ],
  },
  source: "Fuente: anuncio de Koin Games en Steam, 13 de noviembre de 2026.",
  sourceLink: "Leer el anuncio",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026: calendario, formato y premios",
};

const fr: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026 : horaires, format, lots et inscription",
  metaDescription:
    "Harvest Bowl d'Origins TCG, 28–29 novembre 2026 : deux qualifications de 512, finale en rondes suisses à 128 avec Top 8, BO3 et réserve de 3 cartes.",
  kicker: "Tournoi Origins TCG",
  title: "Harvest Bowl 2026",
  lead: "La Harvest Bowl est le tournoi Origins TCG de Koin Games des 28 et 29 novembre 2026, joué sur OriginsMeta : le samedi, deux qualifications en double élimination de 512 joueurs, puis le dimanche la journée finale avec les 128 meilleurs.",
  facts: { dates: "28–29 novembre 2026", where: "En ligne · Origins TCG sur Steam", seats: "2 qualifications × 512 joueurs", entry: "Inscription gratuite" },
  cta: { signup: "S'inscrire à {name}", waitlist: "Liste d'attente de {name}", rulebook: "Règlement", faq: "FAQ", discord: "Discord officiel" },
  schedule: {
    title: "Programme",
    intro: "Horaires annoncés par Koin Games. Sous chaque date, vous trouvez l'heure chez vous.",
    yourTime: "Chez vous :",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "Qualification 1", day: "Samedi 28 novembre", text: "Double élimination, 512 joueurs. Les 64 premiers passent au dimanche : 32 du tableau des gagnants et 32 de celui des perdants." },
      q2: { name: "Qualification 2", day: "Samedi 28 novembre", text: "Même format que la Qualification 1, avec sa propre inscription et son propre check-in. Les 64 premiers passent au dimanche." },
      final: { name: "Journée finale", day: "Dimanche 29 novembre", text: "Les 128 qualifiés jouent des rondes suisses avec têtes de série, puis un Top 8. C'est un tournoi à part : le lien apparaîtra ici dès que les organisateurs l'auront créé." },
    },
    notCreated: "Pas encore créé",
    open: "Ouvrir le tournoi",
    status: { open: "Inscriptions ouvertes", full: "Complet · liste d'attente ouverte", running: "En cours", finished: "Terminé", cancelled: "Annulé" },
    seats: "{n}/{size} inscrits",
    waitlist: "{n} en liste d'attente",
    live: "Les chiffres se mettent à jour toutes les quelques minutes.",
  },
  format: {
    title: "Format",
    items: [
      "Le samedi, deux qualifications, chacune en tableau à double élimination de 512 joueurs.",
      "64 joueurs de chaque qualification passent au dimanche : 32 du tableau des gagnants et 32 de celui des perdants.",
      "Le dimanche, les 128 qualifiés jouent des rondes suisses avec têtes de série, suivies d'un Top 8.",
      "Tous les matchs se jouent en deux manches gagnantes (Best-of-3).",
      "Le check-in est obligatoire avant chaque tournoi, et un joueur absent à l'heure perd le match : les délais exacts sont dans le règlement.",
    ],
    note: "Koin Games prévoit d'utiliser les rondes suisses dans les qualifications à partir du tournoi de décembre.",
  },
  decks: {
    title: "Règles des decks",
    items: [
      "Un deck principal et une réserve de 3 cartes, avec des listes publiques.",
      "La première manche de chaque ronde se joue avec le deck principal.",
      "Dans les manches 2 et 3, vous pouvez intégrer autant de cartes de votre réserve que vous voulez.",
    ],
    patch: "Le tournoi se joue sur le patch d'équilibrage du 17 novembre, la dernière mise à jour avant l'événement sauf correctif urgent.",
    patchLink: "Ce qui a changé le 17 novembre",
    builder: "Construisez et testez votre liste",
  },
  prizes: {
    title: "Récompenses",
    items: ["Top 32 : la prochaine série de cartes Tournament Promo.", "Tous ceux qui atteignent le deuxième jour : une récompense aussi."],
    note: "Les récompenses sont des objets exclusifs au tournoi, tels qu'annoncés par Koin Games.",
  },
  signup: {
    title: "Comment s'inscrire",
    steps: [
      "Connectez-vous à OriginsMeta avec Discord, Steam ou une adresse e-mail.",
      "Ouvrez la Qualification 1 ou la Qualification 2 et appuyez sur le bouton d'inscription. Si elle est complète, vous entrez en liste d'attente et montez quand quelqu'un se retire.",
      "Déposez votre deck et votre réserve de 3 cartes avant le début.",
      "Le samedi, faites le check-in avant le début et jouez vos matchs depuis le salon du match.",
    ],
    note: "Les annonces des organisateurs arrivent à chaque inscrit dans l'enveloppe en haut du site.",
  },
  organizers: {
    title: "Organisateurs",
    koin: "La Harvest Bowl est un tournoi officiel de Koin Games, le studio d'Origins TCG.",
    organizer: "Organisateur du tournoi",
    judges: "Arbitres",
    platform: "OriginsMeta est un site de fans fait par des joueurs et héberge la plateforme du tournoi (inscriptions, check-in, tableaux, salons de match). Ce n'est pas un site officiel d'Origins TCG.",
  },
  faq: {
    title: "Questions",
    items: [
      { q: "Quand se joue la Harvest Bowl ?", a: "Le samedi 28 novembre 2026 (Qualification 1 à 16 h, Qualification 2 à 22 h, heure de Paris) et le dimanche 29 novembre (journée finale à 16 h)." },
      { q: "Où se joue-t-elle ?", a: "En ligne, dans Origins TCG sur Steam. Inscriptions, check-in, appariements et résultats sont sur OriginsMeta." },
      { q: "Est-ce payant ?", a: "Non : l'inscription aux qualifications est gratuite." },
      { q: "Où sont les règles complètes ?", a: "Dans le règlement et la FAQ de Koin Games, en lien en haut de cette page. Pour le reste, posez vos questions sur le Discord officiel." },
    ],
  },
  source: "Source : annonce de Koin Games sur Steam, 13 novembre 2026.",
  sourceLink: "Lire l'annonce",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026 : programme, format et récompenses",
};

const pt: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026: horários, formato, prêmios e inscrição",
  metaDescription:
    "Harvest Bowl de Origins TCG, 28–29 de novembro de 2026: duas classificatórias de 512, final suíço de 128 com Top 8, melhor de três e sideboard de 3.",
  kicker: "Torneio de Origins TCG",
  title: "Harvest Bowl 2026",
  lead: "A Harvest Bowl é o torneio de Origins TCG da Koin Games de 28 e 29 de novembro de 2026, jogado no OriginsMeta: no sábado, duas classificatórias em eliminação dupla com 512 jogadores; no domingo, o dia final com os 128 melhores.",
  facts: { dates: "28–29 de novembro de 2026", where: "Online · Origins TCG na Steam", seats: "2 classificatórias × 512 jogadores", entry: "Inscrição gratuita" },
  cta: { signup: "Inscreva-se na {name}", waitlist: "Lista de espera da {name}", rulebook: "Regulamento", faq: "FAQ", discord: "Discord oficial" },
  schedule: {
    title: "Programação",
    intro: "Horários anunciados pela Koin Games. Embaixo de cada data está o horário onde você está.",
    yourTime: "No seu fuso:",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "Classificatória 1", day: "Sábado, 28 de novembro", text: "Eliminação dupla, 512 jogadores. Os 64 melhores vão para o domingo: 32 da chave dos vencedores e 32 da chave dos perdedores." },
      q2: { name: "Classificatória 2", day: "Sábado, 28 de novembro", text: "Mesmo formato da Classificatória 1, com inscrição e check-in próprios. Os 64 melhores vão para o domingo." },
      final: { name: "Dia final", day: "Domingo, 29 de novembro", text: "Os 128 classificados jogam um suíço com cabeças de chave e depois um Top 8. É um torneio separado: o link aparece aqui assim que os organizadores o criarem." },
    },
    notCreated: "Ainda não criado",
    open: "Abrir o torneio",
    status: { open: "Inscrições abertas", full: "Lotado · lista de espera aberta", running: "Em andamento", finished: "Encerrado", cancelled: "Cancelado" },
    seats: "{n}/{size} inscritos",
    waitlist: "{n} na lista de espera",
    live: "Os números são atualizados a cada poucos minutos.",
  },
  format: {
    title: "Formato",
    items: [
      "No sábado, duas classificatórias, cada uma com uma chave de eliminação dupla de 512 jogadores.",
      "De cada classificatória, 64 jogadores vão para o domingo: 32 da chave dos vencedores e 32 da chave dos perdedores.",
      "No domingo os 128 classificados jogam um suíço com cabeças de chave, seguido de um Top 8.",
      "Todas as partidas são melhor de três.",
      "O check-in é obrigatório antes de cada torneio, e quem não aparece a tempo perde a partida: os prazos exatos estão no regulamento.",
    ],
    note: "A Koin Games pretende usar o suíço nas classificatórias a partir do torneio de dezembro.",
  },
  decks: {
    title: "Regras dos decks",
    items: [
      "Um deck principal e um sideboard de 3 cartas, com listas abertas.",
      "A primeira partida de cada rodada é jogada com o deck principal.",
      "Na segunda e na terceira você pode colocar quantas cartas do sideboard quiser.",
    ],
    patch: "O torneio é jogado no patch de balanceamento de 17 de novembro, a última atualização antes do evento, salvo correções urgentes.",
    patchLink: "O que mudou em 17 de novembro",
    builder: "Monte e teste a sua lista",
  },
  prizes: {
    title: "Prêmios",
    items: ["Top 32: o próximo conjunto de cartas Tournament Promo.", "Todos que chegarem ao segundo dia: também um prêmio."],
    note: "Os prêmios são itens exclusivos do torneio, como anunciado pela Koin Games.",
  },
  signup: {
    title: "Como se inscrever",
    steps: [
      "Entre no OriginsMeta com Discord, Steam ou e-mail.",
      "Abra a Classificatória 1 ou a Classificatória 2 e aperte o botão de inscrição. Se estiver lotada, você entra na lista de espera e sobe quando alguém sai.",
      "Envie o seu deck e o sideboard de 3 cartas antes do início.",
      "No sábado, faça o check-in antes do início e jogue as partidas pela sala da partida.",
    ],
    note: "Os anúncios dos organizadores chegam a cada inscrito no envelope no topo do site.",
  },
  organizers: {
    title: "Organizadores",
    koin: "A Harvest Bowl é um torneio oficial da Koin Games, o estúdio de Origins TCG.",
    organizer: "Organizador do torneio",
    judges: "Juízes",
    platform: "O OriginsMeta é um site de fãs feito por jogadores e hospeda a plataforma do torneio (inscrições, check-in, chaves, salas de partida). Não é um site oficial de Origins TCG.",
  },
  faq: {
    title: "Perguntas",
    items: [
      { q: "Quando é a Harvest Bowl?", a: "No sábado, 28 de novembro de 2026 (Classificatória 1 às 12:00 de Brasília, Classificatória 2 às 18:00) e no domingo, 29 de novembro (dia final às 12:00 de Brasília)." },
      { q: "Onde se joga?", a: "Online, em Origins TCG na Steam. Inscrições, check-in, emparelhamentos e resultados ficam no OriginsMeta." },
      { q: "Custa alguma coisa?", a: "Não: a inscrição nas classificatórias é gratuita." },
      { q: "Onde estão as regras completas?", a: "No regulamento e no FAQ da Koin Games, com link no topo desta página. Para o resto, pergunte no Discord oficial." },
    ],
  },
  source: "Fonte: anúncio da Koin Games na Steam, 13 de novembro de 2026.",
  sourceLink: "Ler o anúncio",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026: programação, formato e prêmios",
};

const de: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026: Zeitplan, Format, Preise und Anmeldung",
  metaDescription:
    "Harvest Bowl von Origins TCG, 28.–29. November 2026: zwei Qualifier mit je 512 Spielern, Finaltag im Schweizer System mit 128 und Top 8, Bo3, Sideboard 3.",
  kicker: "Origins-TCG-Turnier",
  title: "Harvest Bowl 2026",
  lead: "Der Harvest Bowl ist das Origins-TCG-Turnier von Koin Games am 28. und 29. November 2026, gespielt auf OriginsMeta: am Samstag zwei Double-Elimination-Qualifier mit je 512 Spielern, am Sonntag der Finaltag mit den besten 128.",
  facts: { dates: "28.–29. November 2026", where: "Online · Origins TCG auf Steam", seats: "2 Qualifier × 512 Spieler", entry: "Teilnahme kostenlos" },
  cta: { signup: "Für {name} anmelden", waitlist: "Warteliste für {name}", rulebook: "Regelwerk", faq: "FAQ", discord: "Offizieller Discord" },
  schedule: {
    title: "Zeitplan",
    intro: "Zeiten laut Koin Games. Unter jedem Datum steht die Uhrzeit bei dir.",
    yourTime: "Bei dir:",
    fixed: "{utc} UTC · {et} ET · {cet} MEZ",
    stages: {
      q1: { name: "Qualifier 1", day: "Samstag, 28. November", text: "Double Elimination, 512 Spieler. Die besten 64 kommen in den Sonntag: 32 aus dem Winner- und 32 aus dem Loser-Bracket." },
      q2: { name: "Qualifier 2", day: "Samstag, 28. November", text: "Gleiches Format wie Qualifier 1, mit eigener Anmeldung und eigenem Check-in. Die besten 64 kommen in den Sonntag." },
      final: { name: "Finaltag", day: "Sonntag, 29. November", text: "Die 128 Qualifizierten spielen ein gesetztes Schweizer System, danach einen Top-8-Cut. Es ist ein eigenes Turnier: Der Link erscheint hier, sobald die Organisatoren es anlegen." },
    },
    notCreated: "Noch nicht angelegt",
    open: "Turnier öffnen",
    status: { open: "Anmeldung offen", full: "Voll · Warteliste offen", running: "Läuft", finished: "Beendet", cancelled: "Abgesagt" },
    seats: "{n}/{size} angemeldet",
    waitlist: "{n} auf der Warteliste",
    live: "Die Zahlen werden alle paar Minuten aktualisiert.",
  },
  format: {
    title: "Format",
    items: [
      "Am Samstag zwei Qualifier, jeder ein Double-Elimination-Bracket mit 512 Spielern.",
      "Aus jedem Qualifier kommen 64 Spieler in den Sonntag: 32 aus dem Winner- und 32 aus dem Loser-Bracket.",
      "Am Sonntag spielen die 128 Qualifizierten ein gesetztes Schweizer System mit anschließendem Top-8-Cut.",
      "Alle Matches sind Best-of-3.",
      "Vor jedem Turnier ist ein Check-in nötig, und wer nicht rechtzeitig erscheint, verliert das Match: Die genauen Zeiten stehen im Regelwerk.",
    ],
    note: "Koin Games will das Schweizer System ab dem Dezember-Turnier auch in den Qualifiern einsetzen.",
  },
  decks: {
    title: "Deckregeln",
    items: [
      "Ein Hauptdeck plus ein Sideboard aus 3 Karten, mit offenen Decklisten.",
      "Spiel 1 jeder Runde wird mit dem Hauptdeck gespielt.",
      "In Spiel 2 und 3 darfst du beliebig viele Karten aus dem Sideboard hineinnehmen.",
    ],
    patch: "Gespielt wird auf dem Balance-Patch vom 17. November, dem letzten Update vor dem Event, sofern kein Hotfix nötig ist.",
    patchLink: "Was sich am 17. November geändert hat",
    builder: "Liste bauen und testen",
  },
  prizes: {
    title: "Preise",
    items: ["Top 32: das nächste Set Tournament-Promo-Karten.", "Alle, die Tag 2 erreichen: ebenfalls ein Preis."],
    note: "Die Preise sind turnierexklusive Items, wie von Koin Games angekündigt.",
  },
  signup: {
    title: "So meldest du dich an",
    steps: [
      "Melde dich bei OriginsMeta mit Discord, Steam oder E-Mail an.",
      "Öffne Qualifier 1 oder Qualifier 2 und drück den Anmeldeknopf. Ist der Qualifier voll, kommst du auf die Warteliste und rückst nach, wenn jemand abspringt.",
      "Reiche dein Deck und dein 3-Karten-Sideboard vor dem Start ein.",
      "Am Samstag checkst du vor dem Start ein und spielst deine Matches über den Matchraum.",
    ],
    note: "Ankündigungen der Organisatoren erreichen alle Angemeldeten im Umschlag oben auf der Seite.",
  },
  organizers: {
    title: "Organisatoren",
    koin: "Der Harvest Bowl ist ein offizielles Turnier von Koin Games, dem Studio hinter Origins TCG.",
    organizer: "Turnierorganisator",
    judges: "Schiedsrichter",
    platform: "OriginsMeta ist eine Fanseite von Spielern und stellt die Turnierplattform (Anmeldung, Check-in, Brackets, Matchräume). Es ist keine offizielle Seite von Origins TCG.",
  },
  faq: {
    title: "Fragen",
    items: [
      { q: "Wann findet der Harvest Bowl statt?", a: "Am Samstag, 28. November 2026 (Qualifier 1 um 16:00 Uhr, Qualifier 2 um 22:00 Uhr MEZ) und am Sonntag, 29. November (Finaltag um 16:00 Uhr MEZ)." },
      { q: "Wo wird gespielt?", a: "Online, in Origins TCG auf Steam. Anmeldung, Check-in, Paarungen und Ergebnisse laufen über OriginsMeta." },
      { q: "Kostet die Teilnahme etwas?", a: "Nein: Die Anmeldung zu den Qualifiern ist kostenlos." },
      { q: "Wo stehen die vollständigen Regeln?", a: "Im Regelwerk und in der FAQ von Koin Games, verlinkt oben auf dieser Seite. Alles andere fragst du im offiziellen Discord." },
    ],
  },
  source: "Quelle: Ankündigung von Koin Games auf Steam, 13. November 2026.",
  sourceLink: "Ankündigung lesen",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026: Zeitplan, Format und Preise",
};

const ru: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026: расписание, формат, призы и регистрация",
  metaDescription:
    "Harvest Bowl по Origins TCG, 28–29 ноября 2026: две квалификации по 512 игроков, финал по швейцарке на 128 с Top 8, матчи до двух побед, сайдборд 3.",
  kicker: "Турнир по Origins TCG",
  title: "Harvest Bowl 2026",
  lead: "Harvest Bowl — турнир Koin Games по Origins TCG 28 и 29 ноября 2026 года, который проходит на OriginsMeta: в субботу две квалификации на выбывание после двух поражений по 512 игроков, в воскресенье — финальный день для лучших 128.",
  facts: { dates: "28–29 ноября 2026", where: "Онлайн · Origins TCG в Steam", seats: "2 квалификации × 512 игроков", entry: "Участие бесплатное" },
  cta: { signup: "Записаться: {name}", waitlist: "Лист ожидания: {name}", rulebook: "Регламент", faq: "FAQ", discord: "Официальный Discord" },
  schedule: {
    title: "Расписание",
    intro: "Время объявлено Koin Games. Под каждой датой указано время в вашем часовом поясе.",
    yourTime: "У вас:",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "Квалификация 1", day: "Суббота, 28 ноября", text: "Выбывание после двух поражений, 512 игроков. Лучшие 64 проходят в воскресенье: 32 из сетки победителей и 32 из сетки проигравших." },
      q2: { name: "Квалификация 2", day: "Суббота, 28 ноября", text: "Тот же формат, что и в квалификации 1, со своей регистрацией и своим check-in. Лучшие 64 проходят в воскресенье." },
      final: { name: "Финальный день", day: "Воскресенье, 29 ноября", text: "128 прошедших играют швейцарскую систему с посевом, затем Top 8. Это отдельный турнир: ссылка появится здесь, как только организаторы его создадут." },
    },
    notCreated: "Ещё не создан",
    open: "Открыть турнир",
    status: { open: "Регистрация открыта", full: "Мест нет · открыт лист ожидания", running: "Идёт", finished: "Завершён", cancelled: "Отменён" },
    seats: "Зарегистрировано: {n}/{size}",
    waitlist: "В листе ожидания: {n}",
    live: "Цифры обновляются каждые несколько минут.",
  },
  format: {
    title: "Формат",
    items: [
      "В субботу две квалификации, каждая — сетка на выбывание после двух поражений на 512 игроков.",
      "Из каждой квалификации в воскресенье проходят 64 игрока: 32 из сетки победителей и 32 из сетки проигравших.",
      "В воскресенье 128 прошедших играют швейцарскую систему с посевом, затем Top 8.",
      "Все матчи идут до двух побед (Best-of-3).",
      "Перед каждым турниром обязателен check-in, а не явившийся вовремя игрок проигрывает матч: точное время — в регламенте.",
    ],
    note: "Koin Games планирует перейти на швейцарскую систему в квалификациях с декабрьского турнира.",
  },
  decks: {
    title: "Правила колод",
    items: [
      "Одна основная колода и сайдборд из 3 карт, списки открытые.",
      "Первая игра каждого раунда играется основной колодой.",
      "Во второй и третьей играх можно ввести сколько угодно карт из сайдборда.",
    ],
    patch: "Турнир играется на балансном патче от 17 ноября — последнем обновлении перед событием, если не понадобится срочное исправление.",
    patchLink: "Что изменилось 17 ноября",
    builder: "Соберите и проверьте свой список",
  },
  prizes: {
    title: "Призы",
    items: ["Top 32: следующий набор карт Tournament Promo.", "Все, кто дойдёт до второго дня, тоже получат приз."],
    note: "Призы — эксклюзивные турнирные предметы, как их объявила Koin Games.",
  },
  signup: {
    title: "Как записаться",
    steps: [
      "Войдите на OriginsMeta через Discord, Steam или почту.",
      "Откройте квалификацию 1 или 2 и нажмите кнопку записи. Если мест нет, вы попадёте в лист ожидания и подниметесь, когда кто-то выйдет.",
      "Сдайте колоду и сайдборд из 3 карт до начала.",
      "В субботу пройдите check-in до начала и играйте матчи из комнаты матча.",
    ],
    note: "Объявления организаторов приходят каждому зарегистрированному в конверт в шапке сайта.",
  },
  organizers: {
    title: "Организаторы",
    koin: "Harvest Bowl — официальный турнир Koin Games, студии, которая делает Origins TCG.",
    organizer: "Организатор турнира",
    judges: "Судьи",
    platform: "OriginsMeta — фанатский сайт, сделанный игроками; он предоставляет платформу турнира (регистрация, check-in, сетки, комнаты матчей). Это не официальный сайт Origins TCG.",
  },
  faq: {
    title: "Вопросы",
    items: [
      { q: "Когда проходит Harvest Bowl?", a: "В субботу, 28 ноября 2026 года (квалификация 1 в 18:00 по Москве, квалификация 2 в 00:00 по Москве в ночь на воскресенье) и в воскресенье, 29 ноября (финальный день в 18:00 по Москве)." },
      { q: "Где играют?", a: "Онлайн, в Origins TCG в Steam. Регистрация, check-in, пары и результаты — на OriginsMeta." },
      { q: "Участие платное?", a: "Нет: запись на квалификации бесплатная." },
      { q: "Где полные правила?", a: "В регламенте и FAQ от Koin Games, ссылки в начале этой страницы. Остальное спрашивайте в официальном Discord." },
    ],
  },
  source: "Источник: объявление Koin Games в Steam от 13 ноября 2026 года.",
  sourceLink: "Читать объявление",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026: расписание, формат и призы",
};

const zh: HarvestBowlLabels = {
  metaTitle: "Harvest Bowl 2026：赛程、赛制、奖励与报名",
  metaDescription:
    "Origins TCG 的 Harvest Bowl 于 2026 年 11 月 28 日和 29 日举行：两场各 512 名玩家的资格赛，决赛日为 128 人瑞士轮加八强淘汰，单套卡组加 3 张备牌，三局两胜。按你的时区显示时间，附报名和公告。",
  kicker: "Origins TCG 锦标赛",
  title: "Harvest Bowl 2026",
  lead: "Harvest Bowl 是 Koin Games 于 2026 年 11 月 28 日和 29 日举办的 Origins TCG 锦标赛，在 OriginsMeta 上进行：周六进行两场各 512 名玩家的双败淘汰资格赛，周日由最强的 128 名玩家进行决赛日。",
  facts: { dates: "2026年11月28–29日", where: "线上 · Steam 上的 Origins TCG", seats: "2 场资格赛 × 512 名玩家", entry: "免费参赛" },
  cta: { signup: "报名{name}", waitlist: "加入{name}候补", rulebook: "规则手册", faq: "常见问题", discord: "官方 Discord" },
  schedule: {
    title: "赛程",
    intro: "时间以 Koin Games 公布的为准。每个日期下方显示你所在时区的时间。",
    yourTime: "你的时间：",
    fixed: "{utc} UTC · {et} ET · {cet} CET",
    stages: {
      q1: { name: "资格赛 1", day: "11月28日（周六）", text: "双败淘汰，512 名玩家。前 64 名进入周日：胜者组 32 名，败者组 32 名。" },
      q2: { name: "资格赛 2", day: "11月28日（周六）", text: "赛制与资格赛 1 相同，单独报名、单独签到。前 64 名进入周日。" },
      final: { name: "决赛日", day: "11月29日（周日）", text: "128 名晋级玩家进行有种子排位的瑞士轮，之后进行八强淘汰。这是一场单独的锦标赛：主办方创建后，链接会显示在这里。" },
    },
    notCreated: "尚未创建",
    open: "打开锦标赛",
    status: { open: "报名中", full: "已满 · 候补名单开放", running: "进行中", finished: "已结束", cancelled: "已取消" },
    seats: "已报名 {n}/{size}",
    waitlist: "候补 {n} 人",
    live: "数字每隔几分钟更新一次。",
  },
  format: {
    title: "赛制",
    items: [
      "周六进行两场资格赛，每场都是 512 人的双败淘汰。",
      "每场资格赛有 64 名玩家进入周日：胜者组 32 名，败者组 32 名。",
      "周日 128 名晋级玩家进行有种子排位的瑞士轮，之后是八强淘汰。",
      "所有对局均为三局两胜。",
      "每场锦标赛开始前必须签到，未按时到场的玩家判负：具体时限见规则手册。",
    ],
    note: "Koin Games 计划从 12 月的锦标赛开始在资格赛中使用瑞士轮。",
  },
  decks: {
    title: "卡组规则",
    items: ["一套主卡组加 3 张备牌，卡组列表公开。", "每轮第一局使用主卡组。", "第二局和第三局可以换入任意数量的备牌。"],
    patch: "本次锦标赛使用 11 月 17 日的平衡补丁，这是赛前最后一次更新（除非需要紧急修复）。",
    patchLink: "11月17日的改动",
    builder: "组建并测试你的卡组",
  },
  prizes: {
    title: "奖励",
    items: ["前 32 名：下一套 Tournament Promo 卡牌。", "所有进入第二天的玩家：同样有奖励。"],
    note: "奖励为锦标赛专属物品，以 Koin Games 公布的为准。",
  },
  signup: {
    title: "如何报名",
    steps: [
      "使用 Discord、Steam 或邮箱登录 OriginsMeta。",
      "打开资格赛 1 或资格赛 2，点击报名按钮。名额已满时会进入候补名单，有人退出时依次递补。",
      "在开赛前提交你的卡组和 3 张备牌。",
      "周六开赛前完成签到，并在对局房间中进行比赛。",
    ],
    note: "主办方的公告会发送到每位报名玩家网站顶部的信封里。",
  },
  organizers: {
    title: "主办方",
    koin: "Harvest Bowl 是 Origins TCG 开发商 Koin Games 的官方锦标赛。",
    organizer: "锦标赛主办者",
    judges: "裁判",
    platform: "OriginsMeta 是由玩家制作的粉丝网站，提供锦标赛平台（报名、签到、对阵表、对局房间），并非 Origins TCG 官方网站。",
  },
  faq: {
    title: "常见问题",
    items: [
      { q: "Harvest Bowl 什么时候举行？", a: "2026 年 11 月 28 日周六（资格赛 1 在北京时间 23:00，资格赛 2 在北京时间 29 日 05:00）和 11 月 29 日周日（决赛日在北京时间 23:00）。" },
      { q: "在哪里比赛？", a: "线上，在 Steam 上的 Origins TCG 中进行。报名、签到、配对和结果都在 OriginsMeta 上。" },
      { q: "需要付费吗？", a: "不需要：资格赛报名免费。" },
      { q: "完整规则在哪里？", a: "在 Koin Games 的规则手册和常见问题中，链接见本页顶部。其他问题请在官方 Discord 提问。" },
    ],
  },
  source: "来源：Koin Games 于 2026 年 11 月 13 日在 Steam 发布的公告。",
  sourceLink: "阅读公告",
  /** link dalla scheda di un torneo dell'evento alla pagina dell'evento */
  eventLink: "Harvest Bowl 2026：赛程、赛制与奖励",
};

export const harvestBowlLabels: Record<Locale, HarvestBowlLabels> = { en, it, es, fr, pt, de, ru, "zh-cn": zh };

export function fillHarvest(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
