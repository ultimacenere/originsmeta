import type { Locale } from "../i18n";

type L10n = Record<Locale, string> & { fr?: string };
const n = (en: string, it: string, fr: string): L10n => ({ en, it, fr });

export type NewsItem = {
  slug: string;
  date: string;
  title: L10n;
  summary: L10n;
  /** fonte: post ufficiale su Steam, stampa, oppure un mazzo della community (url interno senza prefisso lingua) */
  url: string;
  source: "steam" | "press" | "community";
  /** copertina, sempre presente: media kit ufficiale in /public/media o miniatura ufficiale YouTube */
  image: string;
  /** slug delle carte toccate dall'annuncio (o, per i mazzi della community, le carte del mazzo) */
  cards?: string[];
  /** slug delle guide del sito collegate alla news */
  guides?: string[];
};

export const news: NewsItem[] = [
  {
    slug: "davdas-3-pigs-mid-range",
    image: "/media/hero-1200.webp",
    cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    guides: ["three-pigs-midrange-guide", "three-pigs-midrange-matchups"],
    date: "2026-09-15",
    title: n(
      "Davdas publishes 3 Pigs Mid Range: a Three Not So Little Pigs deck for ladder and tournaments",
      "Davdas pubblica 3 Pigs Mid Range: un mazzo dei Three Not So Little Pigs per ladder e tornei",
      "Davdas publie 3 Pigs Mid Range : un deck Three Not So Little Pigs pour le ladder et les tournois",
    ),
    summary: n(
      "The second deck by Davdas, OriginsMeta staff, is a midrange list led by Three Not So Little Pigs, tagged for ladder and competitive play. The plan: take the board in the first rounds, win at least one location, then close with En Passant, Ellen Trechend's Trample and the Lightning Strikes that Impundulu generates. The deck page has the full list with composition charts, Davdas's mulligan notes, the OM code to open it in the deck builder and two guides on how to play it.",
      "Il secondo mazzo di Davdas, staff di OriginsMeta, è una lista midrange guidata dai Three Not So Little Pigs, segnata per la ladder e il gioco competitivo. Il piano: prendere il tabellone nei primi round, vincere almeno un luogo e chiudere con En Passant, il Trample di Ellen Trechend e i Lightning Strike generati da Impundulu. Nella scheda trovi la lista completa con i grafici di composizione, le note di mulligan di Davdas, il codice OM per aprirla nel deck builder e due guide su come giocarla.",
      "Le deuxième deck de Davdas, membre du staff d'OriginsMeta, est une liste midrange menée par Three Not So Little Pigs, prévue pour le ladder et le jeu compétitif. Le plan : prendre le plateau dans les premiers tours, gagner au moins un lieu, puis conclure avec En Passant, le Trample d'Ellen Trechend et les Lightning Strike générés par Impundulu. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de Davdas, le code OM pour l'ouvrir dans le deck builder et deux guides pour le jouer.",
    ),
    url: "/decks/community/3-pigs-mid-range-6311",
    source: "community",
  },
  {
    slug: "davdas-healing-healsing",
    image: "/media/capsule-library.webp",
    cards: ["van-helsing", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "phuong-hoang", "jekyll", "boitata", "tin-woodman", "spellbook", "searing-light", "forbidden-knowledge"],
    guides: ["healing-healsing-guide", "healing-healsing-matchups"],
    date: "2026-09-15",
    title: n(
      "Healing Healsing, the first community deck: Davdas's Van Helsing control list",
      "Healing Healsing, il primo mazzo della community: la lista controllo di Van Helsing di Davdas",
      "Healing Healsing, le premier deck de la communauté : la liste contrôle Van Helsing de Davdas",
    ),
    summary: n(
      "The first deck published on OriginsMeta is by Davdas, OriginsMeta staff: a control list led by Van Helsing for the ranked ladder. The plan: take early value with Spellbook and Ali Baba, heal through the damage while Phuong Hoang grows with every heal, then reach round 8 or 9 and reset the board with Forbidden Knowledge. The deck page has the full list with composition charts, Davdas's mulligan notes, the OM code for the deck builder and two guides on how to play it.",
      "Il primo mazzo pubblicato su OriginsMeta è di Davdas, staff del sito: una lista controllo guidata da Van Helsing per la ladder classificata. Il piano: prendere valore presto con Spellbook e Ali Baba, curare i danni mentre Phuong Hoang cresce a ogni cura, poi arrivare al round 8 o 9 e azzerare il tabellone con Forbidden Knowledge. Nella scheda trovi la lista completa con i grafici di composizione, le note di mulligan di Davdas, il codice OM per il deck builder e due guide su come giocarla.",
      "Le premier deck publié sur OriginsMeta est signé Davdas, membre du staff : une liste contrôle menée par Van Helsing pour le ladder classé. Le plan : prendre de la valeur tôt avec Spellbook et Ali Baba, soigner les dégâts pendant que Phuong Hoang grandit à chaque soin, puis atteindre le tour 8 ou 9 et remettre le plateau à zéro avec Forbidden Knowledge. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de Davdas, le code OM pour le deck builder et deux guides pour le jouer.",
    ),
    url: "/decks/community/healing-healsing-9411",
    source: "community",
  },
  {
    slug: "playtest-feedback-deck-unlock",
    image: "/media/capsule-library.webp",
    cards: ["humpty", "spellbook", "asanbosam"],
    date: "2026-09-14",
    title: n(
      "Playtest feedback: Koin reads the Steam forum and may move deck unlocks to PvE",
      "Feedback del playtest: Koin legge il forum Steam e valuta di spostare gli sblocchi dei mazzi nel PvE",
      "Retours du playtest : Koin lit le forum Steam et envisage de déplacer les déblocages de decks en PvE",
    ),
    summary: n(
      "In the current playtest you unlock a deck by winning three ranked matches and then beating an AI boss; players call it punishing when they meet full collections with a starter deck. Developer Fenchurch replied that the team reads every Steam forum post and is considering making deck-unlock matches PvE-only. Also reported: cards that generate random cards (Humpty, Spellbook) can add extra Legendaries to a deck, requests to redesign Spellbook, and Asanbosam's On Reveal not repeating at the Cloning Lab location.",
      "Nel playtest attuale un mazzo si sblocca vincendo tre partite classificate e poi battendo un boss IA; i giocatori lo trovano punitivo quando incontrano collezioni complete con un mazzo iniziale. Lo sviluppatore Fenchurch ha risposto che il team legge ogni post del forum Steam e valuta di rendere le partite di sblocco solo PvE. Segnalati anche: le carte che generano carte casuali (Humpty, Spellbook) possono aggiungere Leggendarie extra al mazzo, richieste di ridisegnare Spellbook e l'On Reveal di Asanbosam che non si ripete nel luogo Cloning Lab.",
      "Dans le playtest actuel, un deck se débloque en gagnant trois parties classées puis en battant un boss IA ; les joueurs trouvent cela punitif face à des collections complètes. Le développeur Fenchurch a répondu que l'équipe lit chaque post du forum Steam et envisage des parties de déblocage uniquement PvE. Signalés aussi : les cartes qui génèrent des cartes aléatoires (Humpty, Spellbook) peuvent ajouter des Légendaires, des demandes de refonte de Spellbook et l'On Reveal d'Asanbosam qui ne se répète pas au lieu Cloning Lab.",
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/617711086156647978/",
    source: "steam",
  },
  {
    slug: "kickstarter-ama-pre-registration",
    image: "/media/ls-collector-pack.webp",
    date: "2026-09-10",
    title: n(
      "Kickstarter AMA held: pre-registration open, Alpha Edition boxes preorder-only",
      "AMA sul Kickstarter: pre-registrazione aperta, box Alpha Edition solo in preordine",
      "AMA Kickstarter : préinscription ouverte, boîtes Alpha Edition en précommande uniquement",
    ),
    summary: n(
      "Koin Games answered questions about the upcoming Kickstarter on the official Discord on 10 September. The campaign date is still unannounced; the official pre-registration page offers 15% off at launch for a 1 dollar deposit, fully refundable before launch. The Origins Myths & Legends Alpha Edition comes as collector packs of 5 cards (at least one Rare or better guaranteed), boxes of 24 packs and cases of 6 boxes; boxes and cases are preorder-only and the print run will not be repeated. Cards trade on the Steam Community Market; mobile pack opening is planned for 2027.",
      "Il 10 settembre Koin Games ha risposto sul Discord ufficiale alle domande sul Kickstarter in arrivo. La data della campagna non è ancora annunciata; la pagina ufficiale di pre-registrazione offre il 15% di sconto al lancio con un deposito di 1 dollaro, rimborsabile prima del lancio. La Origins Myths & Legends Alpha Edition si compone di pacchetti collector da 5 carte (almeno una Rara o superiore garantita), box da 24 pacchetti e case da 6 box; box e case sono solo in preordine e la tiratura non verrà ripetuta. Le carte si scambiano sul Mercato della Comunità di Steam; l'apertura dei pacchetti su mobile è prevista per il 2027.",
      "Le 10 septembre, Koin Games a répondu sur le Discord officiel aux questions sur le Kickstarter à venir. La date de la campagne n'est pas annoncée ; la page officielle de préinscription offre 15 % de réduction au lancement pour un dépôt de 1 dollar, remboursable avant le lancement. L'Alpha Edition Origins Myths & Legends se compose de packs collector de 5 cartes (au moins une Rare ou mieux garantie), de boîtes de 24 packs et de caisses de 6 boîtes ; boîtes et caisses sont en précommande uniquement, sans réimpression. Les cartes s'échangent sur le Marché de la communauté Steam ; l'ouverture de packs sur mobile est prévue pour 2027.",
    ),
    url: "https://founder.origins-tcg.com/",
    source: "press",
  },
  {
    slug: "gameplay-trailer",
    image: "https://i.ytimg.com/vi/7EFg0DN9MnI/hqdefault.jpg",
    date: "2026-09-03",
    title: n("Official gameplay trailer released on YouTube", "Trailer di gameplay ufficiale su YouTube", "Bande-annonce de gameplay officielle sur YouTube"),
    summary: n(
      "The first trailer dedicated to gameplay is up on the official Origins TCG YouTube channel: the quickest way to see the pace of a match and the interface before Demo 2.0 arrives at Steam Next Fest.",
      "Il primo trailer dedicato al gameplay è sul canale YouTube ufficiale Origins TCG: il modo più rapido per vedere il ritmo di una partita e l'interfaccia prima che la Demo 2.0 arrivi allo Steam Next Fest.",
      "La première bande-annonce consacrée au gameplay est sur la chaîne YouTube officielle Origins TCG : le moyen le plus rapide de voir le rythme d'une partie et l'interface avant la Demo 2.0 au Steam Next Fest.",
    ),
    url: "https://www.youtube.com/watch?v=7EFg0DN9MnI",
    source: "press",
  },
  {
    slug: "itzbolt-wins-conquest",
    image: "/media/hero-1200.webp",
    date: "2026-08-28",
    title: n("itzBolt wins Big Bob's Playtest Battle, the first Conquest tournament", "itzBolt vince il Big Bob's Playtest Battle, primo torneo Conquest", "itzBolt remporte le Big Bob's Playtest Battle, premier tournoi Conquest"),
    summary: n(
      "The community tournament played on the 0.6.3 playtest build with full deckbuilding and the Conquest format (several decks with different Legendaries, best-of-3) was won by itzBolt, as reported by the World of Origins community site. It was the first public test of the format that Koin has since chosen for the Crimson Cup.",
      "Il torneo community giocato sulla build 0.6.3 del playtest con deckbuilding completo e formato Conquest (più mazzi con Leggendarie diverse, al meglio delle tre) è stato vinto da itzBolt, come riportato dal sito community World of Origins. È stato il primo test pubblico del formato che Koin ha poi scelto per la Crimson Cup.",
      "Le tournoi communautaire joué sur la build 0.6.3 du playtest, avec deckbuilding complet et format Conquest (plusieurs decks aux Légendaires différentes, au meilleur des trois), a été remporté par itzBolt, comme le rapporte le site communautaire World of Origins. Premier test public du format retenu ensuite par Koin pour la Crimson Cup.",
    ),
    url: "https://worldoforigins.fun/news",
    source: "press",
  },
  {
    slug: "biggest-tournament-ever",
    image: "/media/hero-1920.webp",
    date: "2026-09-09",
    title: n("Biggest tournament ever announced for Steam Next Fest", "Annunciato il torneo più grande di sempre per lo Steam Next Fest", "Le plus grand tournoi jamais organisé annoncé pour le Steam Next Fest"),
    summary: n(
      "A multi-day event from 20 to 25 October: qualifiers for each of the three major regions on the 20th, 21st and 22nd, then playoffs and finals. First online tournament with an exclusive 1/1 promo card, plus packs, boxes, cases and cash. Sign-ups on Discord; creators can request wildcard invites straight into the playoffs.",
      "Un evento su più giorni dal 20 al 25 ottobre: qualificazioni per le tre macro-regioni il 20, 21 e 22, poi playoff e finali. Primo torneo online con una carta promo 1/1 esclusiva, più pacchetti, box, case e denaro. Iscrizioni su Discord; i creator possono chiedere inviti wildcard diretti ai playoff.",
      "Un événement sur plusieurs jours du 20 au 25 octobre : qualifications pour les trois grandes régions les 20, 21 et 22, puis playoffs et finales. Premier tournoi en ligne avec une carte promo 1/1 exclusive, plus des packs, boîtes, cases et de l'argent. Inscriptions sur Discord ; les créateurs peuvent demander une invitation wildcard directe pour les playoffs.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "patch-0-6-3",
    image: "/media/ls-collect-them-all.webp",
    cards: ["king-arthur", "merlin", "lancelot", "old-macdonald", "bandersnatch", "bigfoot", "bagheera", "christopher-robin", "sandman", "scarecrow", "merlins-prophecy", "blow-the-house-down", "bridge-troll", "rumple", "thumbelina", "white-queen"],
    date: "2026-08-27",
    title: n("Playtest patch 0.6.3: sixteen cards tuned, King Arthur up to 7/7", "Patch 0.6.3 del playtest: sedici carte ritoccate, Re Artù a 7/7", "Patch 0.6.3 du playtest : seize cartes ajustées, le roi Arthur à 7/7"),
    summary: n(
      "A tuning-and-fixes patch, used for Big Bob's tournament two days later. Buffs to King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll and Blow the House Down; nerfs to Bandersnatch, Bigfoot, Scarecrow and Merlin's Prophecy; Bagheera, Christopher Robin and Sandman reworked. Bosses got smarter AI.",
      "Una patch di tuning e correzioni, usata per il torneo di Big Bob due giorni dopo. Buff a Re Artù, Merlino, Lancillotto, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll e Blow the House Down; nerf a Bandersnatch, Bigfoot, Scarecrow e Merlin's Prophecy; Bagheera, Christopher Robin e Sandman rivisti. I boss hanno un'IA più intelligente.",
      "Un patch d'ajustements et de correctifs, utilisé pour le tournoi de Big Bob deux jours plus tard. Buffs pour le roi Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll et Blow the House Down ; nerfs pour Bandersnatch, Bigfoot, Scarecrow et Merlin's Prophecy ; Bagheera, Christopher Robin et Sandman retravaillés. Les boss ont une IA plus maligne.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "big-bobs-playtest-battle",
    image: "/media/capsule-header.webp",
    date: "2026-08-25",
    title: n("Big Bob's Playtest Battle brings the Conquest format", "Big Bob's Playtest Battle porta il formato Conquest", "Big Bob's Playtest Battle inaugure le format Conquest"),
    summary: n(
      "Tournament on 28 August on the playtest build with full deckbuilding. Best-of-3, single elimination, and the first use of Conquest: submit several decks with different Legendaries and at least nine different cards, ban one of your opponent's. Prizes: wildcards for the Next Fest tournament and Collector Packs.",
      "Torneo il 28 agosto sulla build del playtest con deckbuilding completo. Best-of-3, eliminazione diretta e primo uso del Conquest: si registrano più mazzi con Leggendarie diverse e almeno nove carte differenti, si banna un mazzo avversario. Premi: wildcard per il torneo del Next Fest e Collector Pack.",
      "Tournoi le 28 août sur la build du playtest avec deckbuilding complet. Best-of-3, élimination directe et première utilisation du Conquest : plusieurs decks avec des Légendaires différentes et au moins neuf cartes différentes, un ban chez l'adversaire. Récompenses : wildcards pour le tournoi du Next Fest et Collector Packs.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "patch-0-6-2",
    image: "/media/banner-rapunzel.webp",
    cards: ["mulan", "queen-of-hearts", "ellen-trechend", "van-helsings-tools", "banshee", "piglet", "wicked-witch-of-the-west", "three-not-so-little-pigs", "bandersnatch", "basilisk", "brides-of-dracula", "card-soldier", "flying-monkey", "guy-of-gisborne", "humpty", "huntsman", "imhotep", "kanga", "little-lamb", "marian", "pegasus", "stroke-of-midnight"],
    date: "2026-08-21",
    title: n("Playtest patch 0.6.2: balance pass on 23 cards", "Patch 0.6.2 del playtest: bilanciamento di 23 carte", "Patch 0.6.2 du playtest : équilibrage de 23 cartes"),
    summary: n(
      "Eight cards changed what their ability does. Mulan gains Double Attack, the Queen of Hearts drops to 4 Mana 3/3 with First Strike, Ellen Trechend becomes an 8-Mana 3/3 that grows +3/+3 per enemy. Van Helsing's Tools is free but the Silver Bullet deals 1. The collection is now scoped to the ten playtest decks.",
      "Otto carte hanno cambiato abilità. Mulan ottiene Doppio Attacco, la Regina di Cuori scende a 4 Mana 3/3 con Primo Colpo, Ellen Trechend diventa un 3/3 da 8 Mana che cresce +3/+3 per nemico. Van Helsing's Tools è gratis ma il Proiettile d'Argento fa 1 danno. La collezione è ora limitata ai dieci mazzi del playtest.",
      "Huit cartes ont changé de capacité. Mulan gagne Double Attaque, la Reine de Cœur passe à 4 Mana 3/3 avec Initiative, Ellen Trechend devient un 3/3 à 8 Mana qui grandit de +3/+3 par ennemi. Van Helsing's Tools est gratuit mais la Balle d'argent inflige 1. La collection est désormais limitée aux dix decks du playtest.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "patch-0-6-1-ranked",
    image: "/media/ls-zero-pay-to-win.webp",
    cards: ["huntsman", "mowgli", "first-aid", "count-orlok", "bandersnatch", "genie", "mind-palace", "koschei"],
    date: "2026-08-14",
    title: n("Patch 0.6.1: ranked ladder, Grandmaster leaderboard, three decks retuned", "Patch 0.6.1: ladder classificata, classifica Grandmaster, tre mazzi ritoccati", "Patch 0.6.1 : ladder classé, classement Grandmaster, trois decks retouchés"),
    summary: n(
      "Ranked mode arrives with a world leaderboard for the Grandmaster division, plus quality of life: skip the tutorial, preview the opponent's Legendary during mulligan, mute emotes. Huntsman moves to 6 Mana 6/6; Swarm, Evil and Discard each swap one card.",
      "Arriva la modalità classificata con una classifica mondiale per la divisione Grandmaster, più comodità: salta il tutorial, anteprima della Leggendaria avversaria durante il mulligan, silenzia le emote. Huntsman passa a 6 Mana 6/6; Swarm, Evil e Discard cambiano una carta ciascuno.",
      "Le mode classé arrive avec un classement mondial pour la division Grandmaster, plus du confort : passer le tutoriel, aperçu de la Légendaire adverse pendant le mulligan, couper les émotes. Huntsman passe à 6 Mana 6/6 ; Swarm, Evil et Discard échangent une carte chacun.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "demo-2-playtest",
    image: "/media/capsule-main.webp",
    date: "2026-08-05",
    title: n("Demo 2.0 playtest: 5 new decks, 70+ new cards, deckbuilding", "Playtest della Demo 2.0: 5 nuovi mazzi, oltre 70 carte nuove, deckbuilding", "Playtest de la Démo 2.0 : 5 nouveaux decks, plus de 70 cartes, deckbuilding"),
    summary: n(
      "The update that will ship for Steam Next Fest in October goes to community playtests, starting Friday 7 August at 9pm UTC with a game night. Open to everyone through Discord.",
      "L'aggiornamento che uscirà per lo Steam Next Fest di ottobre va nei playtest della community, da venerdì 7 agosto alle 21 UTC con una game night. Aperto a tutti tramite Discord.",
      "La mise à jour prévue pour le Steam Next Fest d'octobre part en playtests communautaires, dès le vendredi 7 août à 21 h UTC avec une game night. Ouvert à tous via Discord.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "demo-stats-ama",
    image: "/media/ls-two-ways.webp",
    date: "2026-07-21",
    title: n("First demo numbers: 1,000+ players, 13,000+ matches, 1h51m median", "Primi numeri della demo: oltre 1.000 giocatori, 13.000 partite, mediana 1h51m", "Premiers chiffres de la démo : 1 000+ joueurs, 13 000+ parties, médiane 1 h 51"),
    summary: n(
      "Six days after launch the team shares the demo stats and lines up an AMA with CEO Tim Jooste and head of game design Kevin Lambert (22 July), the first demo tournament (24 July) and a booth at Card Party in Fort Lauderdale (24–26 July).",
      "Sei giorni dopo il lancio il team condivide i numeri della demo e annuncia un AMA con il CEO Tim Jooste e il capo del game design Kevin Lambert (22 luglio), il primo torneo della demo (24 luglio) e uno stand al Card Party di Fort Lauderdale (24–26 luglio).",
      "Six jours après le lancement, l'équipe partage les chiffres de la démo et annonce un AMA avec le CEO Tim Jooste et le responsable du game design Kevin Lambert (22 juillet), le premier tournoi de la démo (24 juillet) et un stand au Card Party de Fort Lauderdale (24–26 juillet).",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "demo-live",
    image: "/media/capsule-main.webp",
    date: "2026-07-16",
    title: n("The Origins TCG demo is live on Steam", "La demo di Origins TCG è disponibile su Steam", "La démo d'Origins TCG est disponible sur Steam"),
    summary: n(
      "Free demo with exclusive collectibles that will not be available later and will be tradeable on the Steam marketplace once the full game launches. Launch party on Discord the same day.",
      "Demo gratuita con collezionabili esclusivi che non saranno più disponibili in seguito e saranno scambiabili sul marketplace Steam al lancio del gioco completo. Festa di lancio su Discord lo stesso giorno.",
      "Démo gratuite avec des objets de collection exclusifs, indisponibles plus tard et échangeables sur le marketplace Steam au lancement du jeu complet. Soirée de lancement sur Discord le jour même.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "creator-program",
    image: "/media/boxart-rapunzel.webp",
    date: "2026-08-19",
    title: n("Creator Program announced, details in a Discord AMA", "Annunciato il Creator Program, dettagli in un AMA su Discord", "Creator Program annoncé, détails lors d'un AMA sur Discord"),
    summary: n(
      "Koin Games opens a creator program ahead of Steam Next Fest. Details were given in an AMA on 19 August at 8pm UTC; the recording is on Discord. OriginsMeta has applied.",
      "Koin Games apre un programma per creator in vista dello Steam Next Fest. I dettagli sono stati dati in un AMA il 19 agosto alle 20 UTC; la registrazione è su Discord. OriginsMeta ha fatto richiesta.",
      "Koin Games ouvre un programme pour créateurs avant le Steam Next Fest. Les détails ont été donnés lors d'un AMA le 19 août à 20 h UTC ; l'enregistrement est sur Discord. OriginsMeta a candidaté.",
    ),
    url: "https://egamers.io/origins-tcg-launches-creator-program-ama-set-for-aug-19/",
    source: "press",
  },
  {
    slug: "community-open",
    image: "/media/ls-real-collecting.webp",
    date: "2026-06-03",
    title: n("Official Discord opens to everyone", "Il Discord ufficiale apre a tutti", "Le Discord officiel s'ouvre à tous"),
    summary: n(
      "The server that hosted the early alpha testers opens up, with a demo announced as coming soon and a first look at the collectibles.",
      "Il server che ospitava i tester dell'alpha si apre a tutti, con una demo annunciata in arrivo e un primo sguardo ai collezionabili.",
      "Le serveur qui accueillait les testeurs de l'alpha s'ouvre à tous, avec une démo annoncée et un premier aperçu des objets de collection.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
  {
    slug: "metal-cards-tease",
    image: "/media/ls-collector-pack.webp",
    date: "2026-03-13",
    title: n("Physical metal cards teased by the CEO", "Il CEO mostra carte fisiche in metallo", "Le CEO dévoile des cartes physiques en métal"),
    summary: n(
      "Tim Jooste was filmed with metal collectible cards based on the game's IP. No product or date announced: a signal of intent from a digital-first studio.",
      "Tim Jooste è stato filmato con carte da collezione in metallo basate sull'IP del gioco. Nessun prodotto né data annunciati: un segnale di intenzione da uno studio nato digitale.",
      "Tim Jooste a été filmé avec des cartes de collection en métal basées sur l'univers du jeu. Ni produit ni date annoncés : un signal d'intention d'un studio né numérique.",
    ),
    url: "https://playtoearn.com/news/origins-tcg-teases-physical-metal-cards-as-koin-games-eyes-real-world-expansion",
    source: "press",
  },
  {
    slug: "steam-page-live",
    image: "/media/capsule-header.webp",
    date: "2026-05-06",
    title: n("Steam page live: wishlist open, demo on the way", "Pagina Steam online: wishlist aperta, demo in arrivo", "Page Steam en ligne : wishlist ouverte, démo en route"),
    summary: n(
      "First Steam post from the team: a trading card game built around fast tactical matches and a collectible system modelled on physical TCGs.",
      "Primo post su Steam del team: un gioco di carte costruito su partite tattiche veloci e un sistema da collezione modellato sui TCG fisici.",
      "Premier message Steam de l'équipe : un jeu de cartes construit autour de parties tactiques rapides et d'un système de collection inspiré des TCG physiques.",
    ),
    url: "https://steamcommunity.com/app/4429430/allnews/",
    source: "steam",
  },
];

export const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));
