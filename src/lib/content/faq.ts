import type { Locale } from "@/lib/i18n";
import type { GuideSlug } from "./guides";

/**
 * FAQ approvate: le risposte che restano. Sono testo scritto e riletto da noi, non generate al momento —
 * l'assistente della pagina serve per le domande nuove, queste sono quelle che valgono per tutti.
 *
 * Perché stanno qui e non in un database: sono contenuto editoriale come le guide, entrano nell'HTML statico
 * (quindi Google le legge) e finiscono nei dati strutturati FAQPage della pagina.
 *
 * Come cresce questo file: dalle domande che arrivano davvero. Quando una domanda torna spesso e la risposta
 * regge, si scrive qui in inglese, italiano e spagnolo e smette di costare una chiamata al modello.
 * `cards` e `guides` sono gli slug da collegare sotto la risposta. `news` (dal 25/09/2026, MQ-06) porta all'articolo
 * che fa da fonte o da pagina di riferimento, con il testo del link scritto per quella lingua ("Crimson Cup rules",
 * dalla mappa delle query): le stesse news in ogni lingua, lo controlla `newsMeta.test.ts`.
 *
 * Da 6 a 15 risposte con l'Ondata 3 del piano SEO/GEO (25/09/2026, GEO-12, MQ-12): le domande che il picco dello
 * Steam Next Fest farà (data di uscita, lingue, mobile, Riftbound, progressi della demo, classificata, Leggendarie,
 * codici dei mazzi, elenco delle carte). Ogni risposta ha il link alla sua pagina primaria (mappa delle query) e
 * dice da dove viene ogni fatto, con la data in cui l'abbiamo letto. `links` (dalla stessa data) porta a una sezione
 * del sito quando la pagina primaria non è una guida né una news (il deck builder per i codici, il database carte):
 * `path` senza lingua, `label` scritta per quella lingua. I numeri che cambiano con una patch (le Leggendarie, le
 * carte della Demo 2.0) li controlla `faq.test.ts` sul database delle carte, così non restano indietro.
 * L'ordine è quello della pagina: prima le domande del festival sul gioco, poi demo ed eventi, poi i mazzi.
 *
 * Dati delle carte (decisione di Pierluigi del 25/09/2026, sera): le risposte non nominano la fonte dell'import
 * delle carte e non chiamano "ufficiali" gli ID delle carte; dicono che cosa è verificato nel gioco, che cosa viene
 * dalle patch notes e che le carte create e le rimosse non sono verificate. Lo controlla faq.test.ts.
 *
 * Le domande di questa pagina sono scritte in modo diverso da quelle delle FAQ delle guide (la guida alla roadmap
 * chiede "Is there a mobile version of Origins TCG?", qui "Is Origins TCG on Android or iOS?"): /faq è la pagina
 * ponte che risponde in breve e rimanda alla pagina primaria, e la stessa domanda con la stessa risposta non compare
 * in due FAQPage del sito.
 */
export type Faq = {
  id: string;
  q: string;
  a: string;
  cards?: string[];
  guides?: GuideSlug[];
  news?: { slug: string; label: string }[];
  links?: { path: string; label: string }[];
  /**
   * Altre parole e frasi con cui si fa la stessa domanda ("release date", "Android", "¿está en español?"): servono
   * solo alla ricerca dell'assistente (`risposteApprovate` in src/lib/faq/retrieve.ts), non vanno sulla pagina né nei
   * dati strutturati. Una parola vale come una parola della domanda; una frase, o una parola di tre lettere come
   * "ios", deve comparire intera nella domanda di chi scrive. Accenti e maiuscole non contano.
   */
  keywords?: string[];
};

/** Le 11 Leggendarie della Demo 2.0 (patch della demo del 21/09/2026), per le schede sotto la risposta. */
const legendaries = [
  "dorothy",
  "dracula",
  "king-arthur",
  "legion-of-the-dead",
  "merlin",
  "mulan",
  "queen-of-hearts",
  "robin-hood",
  "three-not-so-little-pigs",
  "van-helsing",
  "wicked-stepmother",
];

const en: Faq[] = [
  {
    id: "release-date",
    q: "When does Origins TCG come out?",
    a: "The Steam store page lists the release for Q4 2026, with no more precise date (read on 25 September 2026). You can already play: the free demo has been on Steam since 15 July 2026, got its first big update on 21 September and switches on ranked mode with Steam Next Fest, 19–26 October 2026. Our roadmap keeps every confirmed date.",
    guides: ["roadmap-and-dates", "play-the-demo"],
    keywords: ["release", "released", "launch", "come out", "comes out", "release date", "launch date", "early access"],
  },
  {
    id: "languages",
    q: "What languages is Origins TCG in?",
    a: "The Steam page lists English, French, Italian and German for the interface, with full audio in English only (read on 25 September 2026). On 25 September 2026 the demo also had its interface and card texts in Spanish, which Steam does not list yet (checked in the game). To change language, right-click the game in your Steam library, then Properties, Language. OriginsMeta is in English, Italian and Spanish, with the game's own card texts in each.",
    guides: ["play-the-demo"],
    keywords: ["language", "english", "italian", "spanish", "french", "german", "translated", "translation", "subtitles", "voice", "espanol", "italiano"],
  },
  {
    id: "mobile",
    q: "Is Origins TCG on Android or iOS?",
    a: "Not yet. The Steam page lists Windows and macOS (read on 25 September 2026). On its pre-registration page Koin Games writes that mobile pack opening is coming: “We have our sights set on 2027 for Origins on Mobile.” Neither page says whether that means Android, iOS or both. The game had a soft launch on the App Store in selected regions in November 2025, before the studio moved card trading to Steam.",
    guides: ["roadmap-and-dates"],
    keywords: ["mobile", "phone", "smartphone", "tablet", "iphone", "ipad", "android", "ios", "app store", "google play", "mac", "macos"],
  },
  {
    id: "riftbound",
    q: "Is Origins TCG the same as Riftbound Origins?",
    a: "No. Origins TCG is the digital trading card game by Koin Games, on Steam, with a cast of public-domain legends such as Robin Hood, Mulan and Dracula. “Riftbound Origins” is a card set of Riftbound, the League of Legends trading card game (official Riftbound site, read on 25 September 2026): another game, not made by Koin Games. Searching for “Origins” decks or cards can bring up both.",
    guides: ["origins-tcg-explained"],
    keywords: ["riftbound", "league of legends", "riot"],
  },
  {
    id: "free-to-compete",
    q: "Is Origins TCG pay-to-win?",
    a: "Koin Games says no: every player gets every card for free, and what you buy are collectible versions — graded, limited, tradable on the Steam Market — so money changes what you own, not what you can play. The game is not out yet: what is still unconfirmed is in our guide.",
    guides: ["is-origins-tcg-pay-to-win"],
    keywords: ["pay to win", "p2w", "free-to-play", "free to play", "free-to-compete", "microtransactions"],
  },
  {
    id: "kickstarter",
    q: "Is there a date for the Origins TCG Kickstarter?",
    a: "On 25 September 2026 the demo's main menu showed the Kickstarter as “Coming soon – Oct 27”, next to “Preregister for 15% off”; Koin Games has not announced the date on Steam or on the official Discord yet. Pre-registration is open on founder.origins-tcg.com: a 1 dollar deposit, refundable before launch, gives VIP status with 15% off. Our Kickstarter guide keeps everything up to date.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: [{ slug: "kickstarter-ama-pre-registration", label: "Kickstarter AMA of 10 September" }],
    keywords: ["kickstarter", "crowdfunding", "pre-registration", "preregistration", "preregister", "deposit", "founder", "alpha"],
  },
  {
    id: "demo-progress",
    q: "Do I keep my progress from the Origins TCG demo?",
    a: "Within the demo, yes. On 16 September 2026 a Koin Games staff member wrote on the official Discord that deck unlocks and boss progress from Demo 1 carry over to Demo 2, and the Steam post of 21 September adds that whoever played the demo, the playtest or both keeps whichever progress is further ahead, “so no one will have to unlock cards again”. For the full game, the launch post of 16 July says the exclusive demo collectibles will be tradeable on the Steam marketplace; no official Steam post says yet whether deck unlocks carry over too.",
    guides: ["play-the-demo"],
    news: [
      { slug: "demo-first-big-update", label: "Demo update of 21 September" },
      { slug: "demo-2-progress-carryover", label: "Demo 1 unlocks carry over" },
    ],
    keywords: ["progress", "unlock", "unlocks", "carry over", "carries over", "transfer", "wipe", "reset"],
  },
  {
    id: "ranked",
    q: "When can I play ranked in Origins TCG?",
    a: "With the start of Steam Next Fest, on Monday 19 October 2026, according to the Steam post of 21 September, which promises exclusive ranked rewards without detailing them yet. Ranked already existed in the closed playtest, from patch 0.6.1 of 14 August 2026: a ladder of divisions up to Grandmaster, with a world leaderboard for the Grandmaster division.",
    guides: ["origins-tcg-ranked", "steam-next-fest-2026"],
    news: [
      { slug: "demo-first-big-update", label: "Ranked at Steam Next Fest" },
      { slug: "patch-0-6-1-ranked", label: "Patch 0.6.1: the ranked ladder" },
    ],
    keywords: ["ranked", "ladder", "grandmaster", "ranking", "leaderboard", "divisions"],
  },
  {
    id: "crimson-cup",
    q: "When is the Crimson Cup and what do you win?",
    a: "From 20 to 25 October 2026, during Steam Next Fest: three qualifiers of 512 spots each on the 20th, 21st and 22nd, playoffs on the 24th, finals on the 25th. Prizes worth $10,000 in total — an exclusive 1/1 tournament promo card, other promo cards, digital packs, Alpha booster boxes and cases, and cash; the exact prize pool was promised for the week after 24 September. Sign-ups are on Koin's official Discord, and check-in closes five minutes before each qualifier: miss it and you can't play.",
    guides: ["steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Crimson Cup rules" }],
    keywords: ["prize", "prizes", "prize pool", "qualifier", "qualifiers", "check-in", "check in", "playoffs"],
  },
  {
    id: "conquest",
    q: "How does the Conquest format work?",
    a: "You register more than one deck, and the decks must differ from each other. Your opponent bans one of your decks, and you win the match by beating them with each of the decks that are left. At the Crimson Cup there are three decks with at least 8 unique cards between each pair, decklists stay hidden until the top 4 (in the ban you only see the Legendary), and best-of-five matches have no ban: you must win with all three. Koin first ran it at Big Bob's Playtest Battle, where each deck needed a different Legendary and at least nine cards of difference.",
    guides: ["origins-tcg-conquest", "steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Crimson Cup rules" }],
    keywords: ["conquest", "three decks", "ban", "unique cards"],
  },
  {
    id: "deck-rules",
    q: "How many cards does a deck have in Origins TCG?",
    a: "Twenty-five: one Legendary and twelve different cards, each played in two copies. You pick the thirteen names, the game doubles the twelve base cards for you. The deck builder on this site enforces the rule and tells you what is missing.",
    guides: ["origins-tcg-explained"],
    keywords: ["how many cards", "deck size", "legal", "copies", "deck rules"],
  },
  {
    id: "legendaries",
    q: "Which Legendaries are in the Origins TCG demo?",
    a: "There are 11 in the Demo 2.0, as of the demo patch of 21 September 2026: Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing and Wicked Stepmother. Every deck is led by exactly one of them; Legion of the Dead is the only spell, the other ten are units. Each has its own page in our card database, with the official text, the stats and the balance history.",
    cards: legendaries,
    guides: ["origins-tcg-legendaries", "origins-tcg-explained"],
    links: [{ path: "/cards", label: "Card database" }],
    keywords: ["legendary", "legendaries"],
  },
  {
    id: "deck-code",
    q: "How do I import a deck code?",
    a: "To bring a deck from the game to this site, paste its code (it starts with KGBLDC) into the box at the top of our deck builder and press “Import”: the box also reads a share link or a text list, and names any card it cannot match. The other way round, a deck page on OriginsMeta has a “Copy game code” button when the site has the ID of every card in the deck; in the deck builder, on the same condition, the code is under “Share”. That is the code to paste into Origins.",
    links: [
      { path: "/deck-builder", label: "Deck builder" },
      { path: "/decks", label: "Community decks" },
    ],
    keywords: ["code", "codes", "import", "export", "kgbldc", "game code", "deck code"],
  },
  {
    id: "card-list",
    q: "Where can I see every Origins TCG card?",
    a: "In our card database: the 122 cards of the Demo 2.0 with their current stats, the official text in English, Italian and Spanish as it reads in the game and the balance history of each one, plus 22 created cards, the ones that exist only when another card makes them, whose texts have not been checked in the game. In the game, the collection is under My Decks → Cards: turn on the “Unowned” filter to see the cards you don't own yet as well.",
    links: [{ path: "/cards", label: "Card database" }],
    keywords: ["card list", "list of cards", "all cards", "all the cards", "every card", "card database", "database", "collection", "unowned"],
  },
  {
    id: "where-cards",
    q: "Where do the card stats on this site come from?",
    a: "Costs, stats, alignments and texts of the 122 cards of the Demo 2.0 were checked one by one in the game on 22 September 2026, in English, and on 25 September in Italian and Spanish too, which are the game's own texts. They are the numbers of the demo patch of 21 September 2026; balance changes come from the official patch notes on Steam. Created and removed cards are not in the game's collection, so they have not been checked in the game. The illustrations are the official ones from Koin Games; the sagas and the notes on each legend are ours.",
    news: [{ slug: "demo-patch-notes-0921", label: "Demo patch notes of 21 September" }],
    keywords: ["stats", "source", "sources", "data", "accurate", "verified", "checked"],
  },
];

const it: Faq[] = [
  {
    id: "release-date",
    q: "Quando esce Origins TCG?",
    a: "La pagina Steam indica l'uscita nel quarto trimestre 2026 (“Q4 2026”), senza una data più precisa (letta il 25 settembre 2026). Intanto si gioca già: la demo gratuita è su Steam dal 15 luglio 2026, ha avuto il primo grande aggiornamento il 21 settembre e accende la classificata con lo Steam Next Fest, dal 19 al 26 ottobre 2026. La nostra roadmap raccoglie tutte le date confermate.",
    guides: ["roadmap-and-dates", "play-the-demo"],
    keywords: ["esce", "uscita", "lancio", "data di uscita", "early access", "accesso anticipato", "release"],
  },
  {
    id: "languages",
    q: "In che lingue è Origins TCG?",
    a: "Secondo la pagina Steam l'interfaccia è in inglese, francese, italiano e tedesco e l'audio completo solo in inglese (letta il 25 settembre 2026). Il 25 settembre 2026 la demo aveva anche interfaccia e testi delle carte in spagnolo, che Steam non elenca ancora (verificato nel gioco). Per cambiare lingua: tasto destro sul gioco nella libreria di Steam, Proprietà, Lingua. OriginsMeta è in italiano, inglese e spagnolo, con i testi delle carte del gioco in ogni lingua.",
    guides: ["play-the-demo"],
    keywords: ["lingua", "lingue", "italiano", "inglese", "spagnolo", "francese", "tedesco", "tradotto", "traduzione", "sottotitoli", "doppiaggio", "ita"],
  },
  {
    id: "mobile",
    q: "Origins TCG c'è su Android o iOS?",
    a: "Non ancora. La pagina Steam elenca Windows e macOS (letta il 25 settembre 2026). Sulla sua pagina di pre-registrazione Koin Games scrive che l'apertura dei pacchetti su mobile è in arrivo e che l'obiettivo è il 2027: “We have our sights set on 2027 for Origins on Mobile.” Nessuna delle due pagine dice se si tratta di Android, di iOS o di entrambi. Nel novembre 2025 il gioco ha avuto un soft launch sull'App Store in alcune regioni, prima che lo studio spostasse lo scambio delle carte su Steam.",
    guides: ["roadmap-and-dates"],
    keywords: ["mobile", "telefono", "cellulare", "smartphone", "tablet", "iphone", "ipad", "android", "ios", "app store", "google play", "mac", "macos"],
  },
  {
    id: "riftbound",
    q: "Origins TCG è la stessa cosa di Riftbound Origins?",
    a: "No. Origins TCG è il gioco di carte collezionabili digitale di Koin Games, su Steam, con un cast di leggende di pubblico dominio come Robin Hood, Mulan e Dracula. “Riftbound Origins” è un set di carte di Riftbound, il gioco di carte collezionabili di League of Legends (sito ufficiale di Riftbound, letto il 25 settembre 2026): un altro gioco, che non è di Koin Games. Cercando mazzi o carte di “Origins” può capitare di trovarli tutti e due.",
    guides: ["origins-tcg-explained"],
    keywords: ["riftbound", "league of legends", "riot"],
  },
  {
    id: "free-to-compete",
    q: "Origins TCG è pay-to-win?",
    a: "Koin Games dice di no: tutte le carte si ottengono gratis, e quello che si compra sono le versioni da collezione — gradate, limitate, scambiabili sul Mercato Steam — quindi i soldi cambiano quello che possiedi, non quello che puoi giocare. Il gioco non è ancora uscito: quello che non è ancora confermato è nella nostra guida.",
    guides: ["is-origins-tcg-pay-to-win"],
    keywords: ["pay to win", "p2w", "gratis", "gratuito", "free-to-play", "free to play", "free-to-compete", "microtransazioni"],
  },
  {
    id: "kickstarter",
    q: "C'è una data per il Kickstarter di Origins TCG?",
    a: "Il 25 settembre 2026 il menu principale della demo mostrava il Kickstarter come “Coming soon – Oct 27”, accanto a “Preregister for 15% off”; Koin Games non ha ancora annunciato la data su Steam né sul Discord ufficiale. La pre-registrazione è aperta su founder.origins-tcg.com: un deposito di 1 dollaro, rimborsabile prima del lancio, dà lo stato VIP con il 15% di sconto. La nostra guida al Kickstarter tiene tutto aggiornato.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: [{ slug: "kickstarter-ama-pre-registration", label: "AMA sul Kickstarter del 10 settembre" }],
    keywords: ["kickstarter", "crowdfunding", "pre-registrazione", "preregistrazione", "preregistrarsi", "deposito", "founder", "alpha"],
  },
  {
    id: "demo-progress",
    q: "I progressi della demo di Origins TCG restano?",
    a: "Dentro la demo sì. Il 16 settembre 2026 un membro dello staff di Koin Games ha scritto sul Discord ufficiale che gli sblocchi dei mazzi e i progressi contro i boss della Demo 1 passano alla Demo 2, e il post su Steam del 21 settembre aggiunge che chi ha giocato la demo, il playtest o entrambi conserva i progressi del percorso più avanzato, “così nessuno dovrà sbloccare di nuovo le carte”. Per il gioco completo, il post di lancio del 16 luglio dice che i collezionabili esclusivi della demo saranno scambiabili sul marketplace di Steam; nessun post ufficiale su Steam dice ancora se passeranno anche gli sblocchi dei mazzi.",
    guides: ["play-the-demo"],
    news: [
      { slug: "demo-first-big-update", label: "Aggiornamento della demo del 21 settembre" },
      { slug: "demo-2-progress-carryover", label: "Gli sblocchi della Demo 1 restano" },
    ],
    keywords: ["progressi", "sblocchi", "sbloccare", "salvataggio", "si perdono", "reset"],
  },
  {
    id: "ranked",
    q: "Quando si può giocare la classificata di Origins TCG?",
    a: "Con l'inizio dello Steam Next Fest, lunedì 19 ottobre 2026, secondo il post su Steam del 21 settembre, che promette ricompense esclusive per la classificata senza ancora dire quali. La classificata c'era già nel playtest chiuso, dalla patch 0.6.1 del 14 agosto 2026: una ladder a divisioni fino a Grandmaster, con una classifica mondiale per la divisione Grandmaster.",
    guides: ["origins-tcg-ranked", "steam-next-fest-2026"],
    news: [
      { slug: "demo-first-big-update", label: "Classificata allo Steam Next Fest" },
      { slug: "patch-0-6-1-ranked", label: "Patch 0.6.1: la classificata" },
    ],
    keywords: ["classificata", "ranked", "ladder", "grandmaster", "divisioni"],
  },
  {
    id: "crimson-cup",
    q: "Quando è la Crimson Cup e che cosa si vince?",
    a: "Dal 20 al 25 ottobre 2026, durante lo Steam Next Fest: tre qualificazioni da 512 posti il 20, 21 e 22, playoff il 24, finali il 25. Premi per un valore complessivo di 10.000 $ — una carta promo 1/1 esclusiva del torneo, altre carte promo, pacchetti digitali, booster box e case Alpha, premi in denaro; la ripartizione esatta è promessa per la settimana dopo il 24 settembre. Le iscrizioni sono sul Discord ufficiale di Koin, e il check-in chiude cinque minuti prima di ogni qualificazione: chi lo salta non gioca.",
    guides: ["steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Regole della Crimson Cup" }],
    keywords: ["premi", "premio", "montepremi", "qualificazioni", "qualificazione", "check-in", "check in", "playoff"],
  },
  {
    id: "conquest",
    q: "Come funziona il formato Conquest?",
    a: "Si registrano più mazzi, e i mazzi devono essere diversi fra loro. L'avversario ne banna uno, e il match si vince battendolo con tutti i mazzi che restano. Alla Crimson Cup i mazzi sono tre, con almeno 8 carte uniche fra ogni coppia, le liste restano segrete fino alla top 4 (nel ban si vede solo la Leggendaria) e al meglio delle cinque non c'è ban: si vince con tutti e tre. Koin lo ha provato la prima volta a Big Bob's Playtest Battle, dove ogni mazzo doveva avere una Leggendaria diversa e almeno nove carte di differenza.",
    guides: ["origins-tcg-conquest", "steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Regole della Crimson Cup" }],
    keywords: ["conquest", "tre mazzi", "ban", "carte uniche"],
  },
  {
    id: "deck-rules",
    q: "Quante carte ha un mazzo di Origins TCG?",
    a: "Venticinque: una Leggendaria e dodici carte diverse, ognuna giocata in due copie. Tu scegli i tredici nomi, il gioco raddoppia da solo le dodici carte base. Il deck builder di questo sito applica la regola e ti dice che cosa manca.",
    guides: ["origins-tcg-explained"],
    keywords: ["quante carte", "legale", "copie", "regole del mazzo"],
  },
  {
    id: "legendaries",
    q: "Quali Leggendarie ci sono nella demo di Origins TCG?",
    a: "Nella Demo 2.0 ce ne sono 11, con la patch della demo del 21 settembre 2026: Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing e Wicked Stepmother. Ogni mazzo ne ha una sola a guidarlo; Legion of the Dead è l'unica magia, le altre dieci sono unità. Ognuna ha la sua scheda nel nostro database carte, con il testo ufficiale, le statistiche e lo storico dei bilanciamenti.",
    cards: legendaries,
    guides: ["origins-tcg-legendaries", "origins-tcg-explained"],
    links: [{ path: "/cards", label: "Database carte" }],
    keywords: ["leggendaria", "leggendarie", "legendary"],
  },
  {
    id: "deck-code",
    q: "Come si importa il codice di un mazzo?",
    a: "Per portare un mazzo dal gioco a questo sito, incolla il suo codice (comincia con KGBLDC) nella casella in cima al nostro deck builder e premi “Importa”: la casella legge anche un link di condivisione o una lista in testo, e indica le carte che non riesce ad abbinare. Per la strada opposta, una scheda mazzo di OriginsMeta ha il tasto “Copia codice del gioco” quando il sito ha l'ID di tutte le carte del mazzo; nel deck builder, alla stessa condizione, il codice sta in “Condividi”. È quello da incollare in Origins.",
    links: [
      { path: "/deck-builder", label: "Deck builder" },
      { path: "/decks", label: "Mazzi della community" },
    ],
    keywords: ["codice", "codici", "importare", "esportare", "kgbldc", "codice del gioco"],
  },
  {
    id: "card-list",
    q: "Dove si vedono tutte le carte di Origins TCG?",
    a: "Nel nostro database carte: le 122 carte della Demo 2.0 con le statistiche attuali, il testo ufficiale in inglese, italiano e spagnolo come nel gioco e lo storico dei bilanciamenti di ognuna, più 22 carte generate, quelle che esistono solo quando un'altra carta le crea, con testi non verificati nel gioco. Nel gioco la collezione sta in I miei deck → Carte: attiva il filtro “Non posseduto” per vedere anche le carte che non hai ancora.",
    links: [{ path: "/cards", label: "Database carte" }],
    keywords: ["lista delle carte", "lista carte", "elenco delle carte", "tutte le carte", "database", "collezione", "non posseduto"],
  },
  {
    id: "where-cards",
    q: "Da dove arrivano le statistiche delle carte di questo sito?",
    a: "Costi, statistiche, allineamenti e testi delle 122 carte della Demo 2.0 sono stati verificati uno per uno nel gioco il 22 settembre 2026, in inglese, e il 25 settembre anche in italiano e spagnolo, che sono i testi del gioco. Sono i numeri della patch della demo del 21 settembre 2026; i bilanciamenti vengono dalle patch notes ufficiali su Steam. Le carte generate e le carte rimosse non sono nella collezione del gioco, quindi non sono state verificate nel gioco. Le illustrazioni sono quelle ufficiali di Koin Games; le saghe e le note sulle origini delle leggende sono nostre.",
    news: [{ slug: "demo-patch-notes-0921", label: "Patch notes della demo del 21 settembre" }],
    keywords: ["statistiche", "fonte", "fonti", "dati", "affidabili", "verificate", "verificati"],
  },
];

const es: Faq[] = [
  {
    id: "release-date",
    q: "¿Cuándo sale Origins TCG?",
    a: "La página de Steam indica el lanzamiento para el cuarto trimestre de 2026 (“Q4 2026”), sin una fecha más precisa (consultada el 25 de septiembre de 2026). Mientras tanto ya puedes jugar: la demo gratuita está en Steam desde el 15 de julio de 2026, recibió su primera gran actualización el 21 de septiembre y activa la clasificatoria con el Steam Next Fest, del 19 al 26 de octubre de 2026. Nuestra hoja de ruta reúne todas las fechas confirmadas.",
    guides: ["roadmap-and-dates", "play-the-demo"],
    keywords: ["sale", "salida", "lanzamiento", "fecha de lanzamiento", "fecha de salida", "early access", "acceso anticipado", "release"],
  },
  {
    id: "languages",
    q: "¿Origins TCG está en español?",
    a: "La demo, sí: el 25 de septiembre de 2026 tenía la interfaz y los textos de las cartas en español (comprobado en el juego), aunque la página de Steam todavía no lo indica. Steam indica inglés, francés, italiano y alemán para la interfaz, con audio completo solo en inglés (consultada el 25 de septiembre de 2026). Para cambiar el idioma: clic derecho sobre el juego en tu biblioteca de Steam, Propiedades, Idioma. OriginsMeta está en español, inglés e italiano, con los textos de las cartas del juego en cada idioma.",
    guides: ["play-the-demo"],
    keywords: ["idioma", "idiomas", "espanol", "castellano", "ingles", "italiano", "frances", "aleman", "traducido", "traduccion", "subtitulos", "doblaje"],
  },
  {
    id: "mobile",
    q: "¿Origins TCG está en Android o iOS?",
    a: "Todavía no. La página de Steam indica Windows y macOS (consultada el 25 de septiembre de 2026). En su página de prerregistro, Koin Games escribe que la apertura de sobres en dispositivos móviles está en camino y que el objetivo es 2027: “We have our sights set on 2027 for Origins on Mobile.” Ninguna de las dos páginas dice si será en Android, en iOS o en ambos. El juego tuvo un soft launch en el App Store en algunas regiones en noviembre de 2025, antes de que el estudio llevara el intercambio de cartas a Steam.",
    guides: ["roadmap-and-dates"],
    keywords: ["movil", "moviles", "telefono", "celular", "smartphone", "tablet", "iphone", "ipad", "android", "ios", "app store", "google play", "mac", "macos"],
  },
  {
    id: "riftbound",
    q: "¿Origins TCG es lo mismo que Riftbound Origins?",
    a: "No. Origins TCG es el juego de cartas coleccionables digital de Koin Games, en Steam, con un elenco de leyendas de dominio público como Robin Hood, Mulan y Dracula. “Riftbound Origins” es un set de cartas de Riftbound, el juego de cartas coleccionables de League of Legends (sitio oficial de Riftbound, consultado el 25 de septiembre de 2026): otro juego, que no es de Koin Games. Si buscas mazos o cartas de “Origins”, puedes encontrar los dos.",
    guides: ["origins-tcg-explained"],
    keywords: ["riftbound", "league of legends", "riot"],
  },
  {
    id: "free-to-compete",
    q: "¿Origins TCG es pay-to-win?",
    a: "Koin Games dice que no: todos los jugadores consiguen todas las cartas gratis, y lo que compras son versiones de colección —gradeadas, limitadas, intercambiables en el Mercado de Steam—, así que el dinero cambia lo que posees, no lo que puedes jugar. El juego aún no ha salido: lo que todavía no está confirmado está en nuestra guía.",
    guides: ["is-origins-tcg-pay-to-win"],
    keywords: ["pay to win", "p2w", "gratis", "gratuito", "free-to-play", "free to play", "free-to-compete", "microtransacciones"],
  },
  {
    id: "kickstarter",
    q: "¿Hay fecha para el Kickstarter de Origins TCG?",
    a: "El 25 de septiembre de 2026 el menú principal de la demo mostraba el Kickstarter como “Coming soon – Oct 27”, junto a “Preregister for 15% off”; Koin Games aún no ha anunciado la fecha en Steam ni en el Discord oficial. El prerregistro está abierto en founder.origins-tcg.com: un depósito de 1 dólar, reembolsable antes del lanzamiento, da el estatus VIP con un 15 % de descuento. Nuestra guía del Kickstarter lo mantiene todo al día.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: [{ slug: "kickstarter-ama-pre-registration", label: "AMA del Kickstarter del 10 de septiembre" }],
    keywords: ["kickstarter", "crowdfunding", "prerregistro", "preregistro", "prerregistrarse", "deposito", "founder", "alpha"],
  },
  {
    id: "demo-progress",
    q: "¿Conservo mi progreso de la demo de Origins TCG?",
    a: "Dentro de la demo, sí. El 16 de septiembre de 2026 un miembro del staff de Koin Games escribió en el Discord oficial que los desbloqueos de mazos y el progreso contra los jefes de la Demo 1 pasan a la Demo 2, y la publicación de Steam del 21 de septiembre añade que quien haya jugado a la demo, al playtest o a ambos conserva el progreso del que esté más avanzado, “para que nadie tenga que volver a desbloquear cartas”. Para el juego completo, la publicación de lanzamiento del 16 de julio dice que los coleccionables exclusivos de la demo se podrán intercambiar en el mercado de Steam; ninguna publicación oficial en Steam dice todavía si también pasarán los desbloqueos de mazos.",
    guides: ["play-the-demo"],
    news: [
      { slug: "demo-first-big-update", label: "Actualización de la demo del 21 de septiembre" },
      { slug: "demo-2-progress-carryover", label: "Los desbloqueos de la Demo 1 se conservan" },
    ],
    keywords: ["progreso", "desbloqueos", "desbloquear", "conservo", "se pierde", "reinicio"],
  },
  {
    id: "ranked",
    q: "¿Cuándo se puede jugar la clasificatoria de Origins TCG?",
    a: "Con el inicio del Steam Next Fest, el lunes 19 de octubre de 2026, según la publicación de Steam del 21 de septiembre, que promete recompensas exclusivas de clasificatoria sin detallarlas todavía. La clasificatoria ya existía en el playtest cerrado desde el parche 0.6.1 del 14 de agosto de 2026: una ladder con divisiones hasta Grandmaster y un ranking mundial para la división Grandmaster.",
    guides: ["origins-tcg-ranked", "steam-next-fest-2026"],
    news: [
      { slug: "demo-first-big-update", label: "Clasificatoria en el Steam Next Fest" },
      { slug: "patch-0-6-1-ranked", label: "Parche 0.6.1: la clasificatoria" },
    ],
    keywords: ["clasificatoria", "ranked", "ladder", "grandmaster", "ranking", "divisiones"],
  },
  {
    id: "crimson-cup",
    q: "¿Cuándo es la Crimson Cup y qué se gana?",
    a: "Del 20 al 25 de octubre de 2026, durante el Steam Next Fest: tres clasificatorios de 512 plazas cada uno los días 20, 21 y 22, playoffs el 24 y finales el 25. Premios por un valor total de 10.000 dólares: una carta promo 1/1 exclusiva del torneo, otras cartas promo, sobres digitales, cajas y cases de sobres Alpha, y dinero en efectivo; el reparto exacto de la bolsa de premios se prometió para la semana siguiente al 24 de septiembre. Las inscripciones están en el Discord oficial de Koin, y el check-in cierra cinco minutos antes de cada clasificatorio: si te lo pierdes, no puedes jugar.",
    guides: ["steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Reglas de la Crimson Cup" }],
    keywords: ["premios", "premio", "bolsa de premios", "check-in", "check in", "playoffs"],
  },
  {
    id: "conquest",
    q: "¿Cómo funciona el formato Conquest?",
    a: "Registras más de un mazo, y los mazos tienen que ser diferentes entre sí. Tu oponente banea uno de tus mazos, y ganas el enfrentamiento si lo vences con cada uno de los mazos que quedan. En la Crimson Cup hay tres mazos con al menos 8 cartas únicas entre cada par, las listas se mantienen ocultas hasta el top 4 (en el ban solo ves la Legendaria) y en los enfrentamientos al mejor de cinco no hay ban: tienes que ganar con los tres. Koin lo estrenó en Big Bob's Playtest Battle, donde cada mazo necesitaba una Legendaria distinta y al menos nueve cartas de diferencia.",
    guides: ["origins-tcg-conquest", "steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Reglas de la Crimson Cup" }],
    keywords: ["conquest", "tres mazos", "ban", "cartas unicas"],
  },
  {
    id: "deck-rules",
    q: "¿Cuántas cartas tiene un mazo de Origins TCG?",
    a: "Veinticinco: una Legendaria y doce cartas distintas, cada una en dos copias. Tú eliges los trece nombres y el juego duplica por ti las doce cartas base. El deck builder de este sitio aplica la regla y te dice qué falta.",
    guides: ["origins-tcg-explained"],
    keywords: ["cuantas cartas", "valido", "legal", "copias", "reglas del mazo"],
  },
  {
    id: "legendaries",
    q: "¿Qué Legendarias hay en la demo de Origins TCG?",
    a: "En la Demo 2.0 hay 11, con el parche de la demo del 21 de septiembre de 2026: Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing y Wicked Stepmother. Cada mazo lleva exactamente una; Legion of the Dead es el único hechizo, las otras diez son unidades. Cada una tiene su página en nuestra base de datos de cartas, con el texto oficial, las estadísticas y el historial de cambios.",
    cards: legendaries,
    guides: ["origins-tcg-legendaries", "origins-tcg-explained"],
    links: [{ path: "/cards", label: "Base de datos de cartas" }],
    keywords: ["legendaria", "legendarias", "legendary"],
  },
  {
    id: "deck-code",
    q: "¿Cómo se importa el código de un mazo?",
    a: "Para llevar un mazo del juego a este sitio, pega su código (empieza por KGBLDC) en el cuadro de la parte superior de nuestro deck builder y pulsa “Importar”: el cuadro también lee un enlace para compartir o una lista en texto, e indica las cartas que no consigue identificar. Para el camino inverso, una página de mazo de OriginsMeta tiene el botón “Copiar código del juego” cuando el sitio tiene el ID de todas las cartas del mazo; en el deck builder, con la misma condición, el código está en “Compartir”. Es el que se pega en Origins.",
    links: [
      { path: "/deck-builder", label: "Deck builder" },
      { path: "/decks", label: "Mazos de la comunidad" },
    ],
    keywords: ["codigo", "codigos", "importar", "exportar", "kgbldc", "codigo del juego"],
  },
  {
    id: "card-list",
    q: "¿Dónde puedo ver todas las cartas de Origins TCG?",
    a: "En nuestra base de datos de cartas: las 122 cartas de la Demo 2.0 con sus estadísticas actuales, el texto oficial en inglés, italiano y español tal como aparece en el juego y el historial de cambios de cada una, además de 22 cartas creadas, las que solo existen cuando otra carta las crea, con textos sin comprobar en el juego. En el juego, la colección está en Mis mazos, en la pestaña de las cartas: activa el filtro “No poseído” para ver también las cartas que aún no tienes.",
    links: [{ path: "/cards", label: "Base de datos de cartas" }],
    keywords: ["lista de cartas", "todas las cartas", "base de datos", "coleccion", "no poseido"],
  },
  {
    id: "where-cards",
    q: "¿De dónde salen las estadísticas de las cartas de este sitio?",
    a: "Los costes, las estadísticas, los alineamientos y los textos de las 122 cartas de la Demo 2.0 se comprobaron uno por uno en el juego el 22 de septiembre de 2026, en inglés, y el 25 de septiembre también en italiano y español, que son los textos del juego. Son los números del parche de la demo del 21 de septiembre de 2026; los cambios de equilibrio vienen de las notas oficiales de los parches en Steam. Las cartas creadas y las retiradas no están en la colección del juego, así que no se han comprobado en el juego. Las ilustraciones son las oficiales de Koin Games; las sagas y las notas sobre cada leyenda son nuestras.",
    news: [{ slug: "demo-patch-notes-0921", label: "Notas del parche de la demo del 21 de septiembre" }],
    keywords: ["estadisticas", "fuente", "fuentes", "datos", "fiables", "verificadas", "comprobadas"],
  },
];

export const faqs: Record<Locale, Faq[]> = { en, it, es };

/** Domande pronte sotto il campo: non sostituiscono la domanda libera, la riempiono. */
export const suggerimenti: Record<Locale, string[]> = {
  en: [
    "What does Mulan do?",
    "Which cards work well with Van Helsing?",
    "How do I build a legal deck?",
    "What changed in the demo patch of 21 September?",
    "Which Legendaries are in the Demo 2.0?",
    "What is On Reveal?",
  ],
  it: [
    "Che cosa fa Mulan?",
    "Quali carte funzionano bene con Van Helsing?",
    "Come si costruisce un mazzo legale?",
    "Che cosa è cambiato nella patch della demo del 21 settembre?",
    "Quali Leggendarie ci sono nella Demo 2.0?",
    "Che cosa fa un'abilità Alla rivelazione?",
  ],
  es: [
    "¿Qué hace Mulan?",
    "¿Qué cartas funcionan bien con Van Helsing?",
    "¿Cómo construyo un mazo válido?",
    "¿Qué cambió en el parche de la demo del 21 de septiembre?",
    "¿Qué Legendarias hay en la Demo 2.0?",
    "¿Qué hace una habilidad Al revelar?",
  ],
};
