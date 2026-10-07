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
 * regge, si scrive qui in inglese, italiano, spagnolo e francese e smette di costare una chiamata al modello.
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
    a: "Since patch 0.7 of 29 September 2026 the game supports 13 languages: English, French, Italian, German, Spanish (Spain), Spanish (Latin America), Portuguese (Brazil), Portuguese (Portugal), Japanese, Korean, Polish, Russian and Simplified Chinese (official patch notes). On 30 September 2026 the Steam page lists the same 13 for the interface, with full audio in English only. To change language, right-click the game in your Steam library, then Properties, Language. OriginsMeta is in English, Italian, Spanish and, since 7 October 2026, French, with the game's own card texts in Italian and Spanish; the French card texts are our translation until we read the game in French.",
    guides: ["play-the-demo"],
    news: [{ slug: "patch-0-7", label: "Patch 0.7 notes" }],
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
    a: "Yes: 27 October 2026. Koin Games' CEO, Tim Jooste, gave the date on X on 17 September 2026 (“back the Alpha Edition Kickstarter (Oct 27th)”), and the demo's main menu shows the Kickstarter as “Coming soon – Oct 27” (read on 25 September 2026); neither says at what time it opens. Pre-registration is open on founder.origins-tcg.com: a 1 dollar deposit, refundable before launch, gives VIP status with 15% off. Our Kickstarter guide keeps everything up to date.",
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
    a: "From 19 to 25 October 2026, during Steam Next Fest: five qualifiers of 512 spots each between the 19th and the 22nd (AMER on the 19th at 7pm EST, EMEA on the 20th at 7pm CEST, AMER on the 21st at 9pm EST, APAC and EMEA on the 22nd), playoffs on the 24th, finals on the 25th. Prizes worth $10,000 in total, split between cash, collectibles and promo cards: the winner gets a 1/1 Dracula promo card, two booster box cases and $1,500, promo cards go down to the top 32 and packs to the top 256. Sign-ups are on Koin's official Discord, and check-in closes five minutes before each qualifier: miss it and you can't play.",
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
    a: "There are 11 in the Demo 2.0, as of patch 0.7 of 29 September 2026: Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing and Wicked Stepmother. Every deck is led by exactly one of them; Legion of the Dead is the only spell, the other ten are units. Each has its own page in our card database, with the official text, the stats and the balance history.",
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
    a: "Costs, stats, alignments and texts of the 122 cards of the Demo 2.0 were checked one by one in the game on 22 September 2026, in English, and on 25 September in Italian and Spanish too, which are the game's own texts, on the demo patch of 21 September 2026. Patch 0.7 of 29 September changed the cost of Bagheera, Mind Palace and Spellbook and reworked Twister Toss: the site applies those changes from the official patch notes on Steam, and the new text of Twister Toss has not been read in the game yet. Created and removed cards are not in the game's collection, so they have not been checked in the game. The illustrations are the official ones from Koin Games; the sagas and the notes on each legend are ours.",
    news: [
      { slug: "patch-0-7", label: "Patch 0.7 notes" },
      { slug: "demo-patch-notes-0921", label: "Demo patch notes of 21 September" },
    ],
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
    a: "Dalla patch 0.7 del 29 settembre 2026 il gioco supporta 13 lingue: inglese, francese, italiano, tedesco, spagnolo (Spagna), spagnolo (America latina), portoghese (Brasile), portoghese (Portogallo), giapponese, coreano, polacco, russo e cinese semplificato (patch notes ufficiali). Il 30 settembre 2026 la pagina Steam elenca le stesse 13 per l'interfaccia, con l'audio completo solo in inglese. Per cambiare lingua: tasto destro sul gioco nella libreria di Steam, Proprietà, Lingua. OriginsMeta è in italiano, inglese, spagnolo e, dal 7 ottobre 2026, francese, con i testi delle carte del gioco in italiano e spagnolo; in francese i testi delle carte sono una nostra traduzione finché non leggiamo il gioco in francese.",
    guides: ["play-the-demo"],
    news: [{ slug: "patch-0-7", label: "Patch notes della 0.7" }],
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
    a: "Sì: il 27 ottobre 2026. L'ha scritto il CEO di Koin Games, Tim Jooste, su X il 17 settembre 2026 (“back the Alpha Edition Kickstarter (Oct 27th)”), e il menu principale della demo mostra il Kickstarter come “Coming soon – Oct 27” (letto il 25 settembre 2026); nessuno dei due dice a che ora apre. La pre-registrazione è aperta su founder.origins-tcg.com: un deposito di 1 dollaro, rimborsabile prima del lancio, dà lo stato VIP con il 15% di sconto. La nostra guida al Kickstarter tiene tutto aggiornato.",
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
    a: "Dal 19 al 25 ottobre 2026, durante lo Steam Next Fest: cinque qualificazioni da 512 posti fra il 19 e il 22 (AMER il 19 alle 19 EST, EMEA il 20 alle 19 CEST, AMER il 21 alle 21 EST, APAC ed EMEA il 22), playoff il 24, finali il 25. Premi per un valore complessivo di 10.000 $, divisi fra denaro, collezionabili e carte promo: chi vince prende una carta promo Dracula 1/1, due case di booster box e 1.500 $, le carte promo arrivano fino alla top 32 e i pacchetti fino alla top 256. Le iscrizioni sono sul Discord ufficiale di Koin, e il check-in chiude cinque minuti prima di ogni qualificazione: chi lo salta non gioca.",
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
    a: "Nella Demo 2.0 ce ne sono 11, con la patch 0.7 del 29 settembre 2026: Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing e Wicked Stepmother. Ogni mazzo ne ha una sola a guidarlo; Legion of the Dead è l'unica magia, le altre dieci sono unità. Ognuna ha la sua scheda nel nostro database carte, con il testo ufficiale, le statistiche e lo storico dei bilanciamenti.",
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
    a: "Costi, statistiche, allineamenti e testi delle 122 carte della Demo 2.0 sono stati verificati uno per uno nel gioco il 22 settembre 2026, in inglese, e il 25 settembre anche in italiano e spagnolo, che sono i testi del gioco, sulla patch della demo del 21 settembre 2026. La patch 0.7 del 29 settembre ha cambiato il costo di Bagheera, Mind Palace e Spellbook e l'effetto di Twister Toss: il sito applica queste modifiche dalle patch notes ufficiali su Steam, e il testo nuovo di Twister Toss non è ancora stato letto nel gioco. Le carte generate e le carte rimosse non sono nella collezione del gioco, quindi non sono state verificate nel gioco. Le illustrazioni sono quelle ufficiali di Koin Games; le saghe e le note sulle origini delle leggende sono nostre.",
    news: [
      { slug: "patch-0-7", label: "Patch notes della 0.7" },
      { slug: "demo-patch-notes-0921", label: "Patch notes della demo del 21 settembre" },
    ],
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
    a: "Sí: desde el parche 0.7 del 29 de septiembre de 2026 el juego admite 13 idiomas, entre ellos el español de España y el de Latinoamérica (notas oficiales del parche); ya el 25 de septiembre la demo tenía la interfaz y los textos de las cartas en español (comprobado en el juego). El 30 de septiembre de 2026 la página de Steam indica los mismos 13 idiomas para la interfaz (inglés, francés, italiano, alemán, español de España y de Latinoamérica, portugués de Brasil y de Portugal, japonés, coreano, polaco, ruso y chino simplificado), con audio completo solo en inglés. Para cambiar el idioma: clic derecho sobre el juego en tu biblioteca de Steam, Propiedades, Idioma. OriginsMeta está en español, inglés, italiano y, desde el 7 de octubre de 2026, francés, con los textos de las cartas del juego en español e italiano; en francés los textos de las cartas son una traducción nuestra hasta que leamos el juego en francés.",
    guides: ["play-the-demo"],
    news: [{ slug: "patch-0-7", label: "Notas del parche 0.7" }],
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
    a: "Sí: el 27 de octubre de 2026. Lo escribió el CEO de Koin Games, Tim Jooste, en X el 17 de septiembre de 2026 (“back the Alpha Edition Kickstarter (Oct 27th)”), y el menú principal de la demo muestra el Kickstarter como “Coming soon – Oct 27” (consultado el 25 de septiembre de 2026); ninguno de los dos dice a qué hora abre. El prerregistro está abierto en founder.origins-tcg.com: un depósito de 1 dólar, reembolsable antes del lanzamiento, da el estatus VIP con un 15 % de descuento. Nuestra guía del Kickstarter lo mantiene todo al día.",
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
    a: "Del 19 al 25 de octubre de 2026, durante el Steam Next Fest: cinco clasificatorios de 512 plazas cada uno entre el 19 y el 22 (AMER el 19 a las 19:00 EST, EMEA el 20 a las 19:00 CEST, AMER el 21 a las 21:00 EST, APAC y EMEA el 22), playoffs el 24 y finales el 25. Premios por un valor total de 10.000 dólares, repartidos entre dinero, coleccionables y cartas promo: el ganador se lleva una carta promo Dracula 1/1, dos cases de cajas de sobres y 1.500 dólares, las cartas promo llegan hasta el top 32 y los sobres hasta el top 256. Las inscripciones están en el Discord oficial de Koin, y el check-in cierra cinco minutos antes de cada clasificatorio: si te lo pierdes, no puedes jugar.",
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
    a: "En la Demo 2.0 hay 11, con el parche 0.7 del 29 de septiembre de 2026: Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing y Wicked Stepmother. Cada mazo lleva exactamente una; Legion of the Dead es el único hechizo, las otras diez son unidades. Cada una tiene su página en nuestra base de datos de cartas, con el texto oficial, las estadísticas y el historial de cambios.",
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
    a: "Los costes, las estadísticas, los alineamientos y los textos de las 122 cartas de la Demo 2.0 se comprobaron uno por uno en el juego el 22 de septiembre de 2026, en inglés, y el 25 de septiembre también en italiano y español, que son los textos del juego, sobre el parche de la demo del 21 de septiembre de 2026. El parche 0.7 del 29 de septiembre cambió el coste de Bagheera, Mind Palace y Spellbook e hizo un rework de Twister Toss: el sitio aplica esos cambios a partir de las notas oficiales del parche en Steam, y el nuevo texto de Twister Toss todavía no se ha leído en el juego. Las cartas creadas y las retiradas no están en la colección del juego, así que no se han comprobado en el juego. Las ilustraciones son las oficiales de Koin Games; las sagas y las notas sobre cada leyenda son nuestras.",
    news: [
      { slug: "patch-0-7", label: "Notas del parche 0.7" },
      { slug: "demo-patch-notes-0921", label: "Notas del parche de la demo del 21 de septiembre" },
    ],
    keywords: ["estadisticas", "fuente", "fuentes", "datos", "fiables", "verificadas", "comprobadas"],
  },
];

const fr: Faq[] = [
  {
    id: "release-date",
    q: "Quand sort Origins TCG ?",
    a: "La page Steam indique une sortie au quatrième trimestre 2026 (« Q4 2026 »), sans date plus précise (lue le 25 septembre 2026). En attendant, vous pouvez déjà jouer : la démo gratuite est sur Steam depuis le 15 juillet 2026, a reçu sa première grande mise à jour le 21 septembre et active le mode classé avec le Steam Next Fest, du 19 au 26 octobre 2026. Notre feuille de route réunit toutes les dates confirmées.",
    guides: ["roadmap-and-dates", "play-the-demo"],
    keywords: ["sortie", "sort", "sortir", "lancement", "date de sortie", "date de lancement", "early access", "acces anticipe", "release"],
  },
  {
    id: "languages",
    q: "Origins TCG est-il en français ?",
    a: "Oui. Depuis le patch 0.7 du 29 septembre 2026, le jeu prend en charge 13 langues (notes de patch officielles) : anglais, français, italien, allemand, espagnol (Espagne), espagnol (Amérique latine), portugais (Brésil), portugais (Portugal), japonais, coréen, polonais, russe et chinois simplifié. Le 30 septembre 2026, la page Steam indique les mêmes 13 langues pour l'interface, avec l'audio complet en anglais seulement. Pour changer de langue : clic droit sur le jeu dans votre bibliothèque Steam, puis Propriétés, Langue. OriginsMeta est en français, anglais, italien et espagnol ; les textes des cartes sont ceux du jeu en anglais, en italien et en espagnol, et en français une traduction d'OriginsMeta, pas encore vérifiée dans le jeu.",
    guides: ["play-the-demo"],
    news: [{ slug: "patch-0-7", label: "Notes du patch 0.7" }],
    keywords: ["langue", "langues", "francais", "anglais", "italien", "espagnol", "allemand", "traduit", "traduction", "sous-titres", "doublage"],
  },
  {
    id: "mobile",
    q: "Origins TCG est-il sur Android ou iOS ?",
    a: "Pas encore. La page Steam indique Windows et macOS (lue le 25 septembre 2026). Sur sa page de préinscription, Koin Games écrit que l'ouverture de boosters sur mobile arrive : « We have our sights set on 2027 for Origins on Mobile. » Aucune des deux pages ne dit s'il s'agira d'Android, d'iOS ou des deux. Le jeu a connu un soft launch sur l'App Store dans certaines régions en novembre 2025, avant que le studio ne déplace l'échange des cartes sur Steam.",
    guides: ["roadmap-and-dates"],
    keywords: ["mobile", "telephone", "portable", "smartphone", "tablette", "iphone", "ipad", "android", "ios", "app store", "google play", "mac", "macos"],
  },
  {
    id: "riftbound",
    q: "Origins TCG, est-ce la même chose que Riftbound Origins ?",
    a: "Non. Origins TCG est le jeu de cartes à collectionner numérique de Koin Games, sur Steam, avec un casting de légendes du domaine public comme Robin Hood, Mulan et Dracula. « Riftbound Origins » est un set de cartes de Riftbound, le jeu de cartes à collectionner de League of Legends (site officiel de Riftbound, lu le 25 septembre 2026) : un autre jeu, qui n'est pas de Koin Games. En cherchant des decks ou des cartes « Origins », vous pouvez tomber sur les deux.",
    guides: ["origins-tcg-explained"],
    keywords: ["riftbound", "league of legends", "riot"],
  },
  {
    id: "free-to-compete",
    q: "Origins TCG est-il pay-to-win ?",
    a: "Koin Games dit non : chaque joueur obtient toutes les cartes gratuitement, et ce que vous achetez, ce sont des versions de collection — gradées, limitées, échangeables sur le Marché Steam —, donc l'argent change ce que vous possédez, pas ce que vous pouvez jouer. Le jeu n'est pas encore sorti : ce qui n'est pas encore confirmé est dans notre guide.",
    guides: ["is-origins-tcg-pay-to-win"],
    keywords: ["pay to win", "p2w", "gratuit", "gratuite", "free-to-play", "free to play", "free-to-compete", "microtransactions"],
  },
  {
    id: "kickstarter",
    q: "Y a-t-il une date pour le Kickstarter d'Origins TCG ?",
    a: "Oui : le 27 octobre 2026. Le CEO de Koin Games, Tim Jooste, a donné la date sur X le 17 septembre 2026 (« back the Alpha Edition Kickstarter (Oct 27th) »), et le menu principal de la démo affiche le Kickstarter comme « Coming soon – Oct 27 » (lu le 25 septembre 2026) ; ni l'un ni l'autre ne dit à quelle heure il ouvre. La préinscription est ouverte sur founder.origins-tcg.com : un dépôt de 1 dollar, remboursable avant le lancement, donne le statut VIP avec 15 % de réduction. Notre guide du Kickstarter tient tout à jour.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: [{ slug: "kickstarter-ama-pre-registration", label: "AMA Kickstarter du 10 septembre" }],
    keywords: ["kickstarter", "crowdfunding", "financement participatif", "preinscription", "pre-inscription", "depot", "founder", "alpha"],
  },
  {
    id: "demo-progress",
    q: "Est-ce que je garde ma progression de la démo d'Origins TCG ?",
    a: "Dans la démo, oui. Le 16 septembre 2026, un membre du staff de Koin Games a écrit sur le Discord officiel que les déblocages de decks et la progression contre les boss de la Demo 1 passent à la Demo 2, et le post Steam du 21 septembre ajoute que celui qui a joué à la démo, au playtest ou aux deux garde la progression la plus avancée, « pour que personne n'ait à débloquer les cartes de nouveau ». Pour le jeu complet, le post de lancement du 16 juillet dit que les objets de collection exclusifs de la démo seront échangeables sur le marché Steam ; aucun post officiel sur Steam ne dit encore si les déblocages de decks passeront aussi.",
    guides: ["play-the-demo"],
    news: [
      { slug: "demo-first-big-update", label: "Mise à jour de la démo du 21 septembre" },
      { slug: "demo-2-progress-carryover", label: "Les déblocages de la Demo 1 sont conservés" },
    ],
    keywords: ["progression", "progres", "deblocage", "deblocages", "debloquer", "conserve", "conservee", "transfert", "perdu", "reinitialisation", "reset"],
  },
  {
    id: "ranked",
    q: "Quand peut-on jouer en classé dans Origins TCG ?",
    a: "Avec le début du Steam Next Fest, le lundi 19 octobre 2026, selon le post Steam du 21 septembre, qui promet des récompenses exclusives pour le mode classé sans encore les détailler. Le classé existait déjà dans le playtest fermé, depuis le patch 0.6.1 du 14 août 2026 : un ladder de divisions jusqu'à Grandmaster, avec un classement mondial pour la division Grandmaster.",
    guides: ["origins-tcg-ranked", "steam-next-fest-2026"],
    news: [
      { slug: "demo-first-big-update", label: "Le classé au Steam Next Fest" },
      { slug: "patch-0-6-1-ranked", label: "Patch 0.6.1 : le ladder classé" },
    ],
    keywords: ["classe", "classee", "ranked", "ladder", "grandmaster", "classement", "divisions"],
  },
  {
    id: "crimson-cup",
    q: "Quand a lieu la Crimson Cup et que gagne-t-on ?",
    a: "Du 19 au 25 octobre 2026, pendant le Steam Next Fest : cinq qualifications de 512 places chacune entre le 19 et le 22 (AMER le 19 à 19:00 EST, EMEA le 20 à 19:00 CEST, AMER le 21 à 21:00 EST, APAC et EMEA le 22), playoffs le 24, finales le 25. Des lots d'une valeur totale de 10 000 dollars, répartis entre argent, objets de collection et cartes promo : le vainqueur reçoit une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars, les cartes promo vont jusqu'au top 32 et les boosters jusqu'au top 256. Les inscriptions se font sur le Discord officiel de Koin, et le check-in ferme cinq minutes avant chaque qualification : si vous le manquez, vous ne jouez pas.",
    guides: ["steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Règles de la Crimson Cup" }],
    keywords: ["prix", "lots", "cagnotte", "qualification", "qualifications", "check-in", "check in", "playoffs"],
  },
  {
    id: "conquest",
    q: "Comment fonctionne le format Conquest ?",
    a: "Vous inscrivez plusieurs decks, qui doivent être différents les uns des autres. Votre adversaire en bannit un, et vous gagnez le match en le battant avec chacun des decks restants. À la Crimson Cup, il y a trois decks avec au moins 8 cartes uniques entre chaque paire, les listes restent cachées jusqu'au top 4 (lors du ban, vous ne voyez que la Légendaire) et les matchs au meilleur des cinq manches n'ont pas de ban : vous devez gagner avec les trois. Koin l'a utilisé pour la première fois à Big Bob's Playtest Battle, où chaque deck devait avoir une Légendaire différente et au moins neuf cartes de différence.",
    guides: ["origins-tcg-conquest", "steam-next-fest-2026"],
    news: [{ slug: "crimson-cup-format-check-in", label: "Règles de la Crimson Cup" }],
    keywords: ["conquest", "trois decks", "ban", "cartes uniques"],
  },
  {
    id: "deck-rules",
    q: "Combien de cartes contient un deck dans Origins TCG ?",
    a: "Vingt-cinq : une Légendaire et douze cartes différentes, chacune jouée en deux exemplaires. Vous choisissez les treize noms, le jeu double pour vous les douze cartes de base. Le Deck builder de ce site applique la règle et vous dit ce qui manque.",
    guides: ["origins-tcg-explained"],
    keywords: ["combien de cartes", "taille du deck", "legal", "valide", "exemplaires", "copies", "regles du deck"],
  },
  {
    id: "legendaries",
    q: "Quelles Légendaires y a-t-il dans la démo d'Origins TCG ?",
    a: "Il y en a 11 dans la Demo 2.0, avec le patch 0.7 du 29 septembre 2026 : Dorothy, Dracula, King Arthur, Legion of the Dead, Merlin, Mulan, Queen of Hearts, Robin Hood, Three Not So Little Pigs, Van Helsing et Wicked Stepmother. Chaque deck est mené par exactement l'une d'elles ; Legion of the Dead est le seul sort, les dix autres sont des unités. Chacune a sa page dans notre base de données des cartes, avec le texte officiel, les statistiques et l'historique des équilibrages.",
    cards: legendaries,
    guides: ["origins-tcg-legendaries", "origins-tcg-explained"],
    links: [{ path: "/cards", label: "Base de données des cartes" }],
    keywords: ["legendaire", "legendaires", "legendary"],
  },
  {
    id: "deck-code",
    q: "Comment importer le code d'un deck ?",
    a: "Pour amener un deck du jeu sur ce site, collez son code (il commence par KGBLDC) dans la case en haut de notre Deck builder et appuyez sur « Importer » : la case lit aussi un lien de partage ou une liste en texte, et signale les cartes qu'elle ne reconnaît pas. Dans l'autre sens, la page d'un deck sur OriginsMeta a un bouton « Copier le code du jeu » quand le site a l'ID de toutes les cartes du deck ; dans le Deck builder, à la même condition, le code se trouve sous « Partager ». C'est ce code qu'il faut coller dans Origins.",
    links: [
      { path: "/deck-builder", label: "Deck builder" },
      { path: "/decks", label: "Decks de la communauté" },
    ],
    keywords: ["code", "codes", "importer", "exporter", "kgbldc", "code du jeu", "code du deck"],
  },
  {
    id: "card-list",
    q: "Où voir toutes les cartes d'Origins TCG ?",
    a: "Dans notre base de données des cartes : les 122 cartes de la Demo 2.0 avec leurs statistiques actuelles, le texte officiel en anglais, en italien et en espagnol tel qu'il se lit dans le jeu (et notre traduction française, pas encore vérifiée dans le jeu) et l'historique des équilibrages de chacune, plus 22 cartes créées, celles qui n'existent que lorsqu'une autre carte les crée, dont les textes n'ont pas été vérifiés dans le jeu. Dans le jeu, la collection se trouve dans le menu des decks, onglet des cartes : activez le filtre des cartes non possédées (« Unowned » en anglais) pour voir aussi celles que vous n'avez pas encore.",
    links: [{ path: "/cards", label: "Base de données des cartes" }],
    keywords: ["liste des cartes", "toutes les cartes", "base de donnees", "collection", "non possedees", "unowned"],
  },
  {
    id: "where-cards",
    q: "D'où viennent les statistiques des cartes de ce site ?",
    a: "Les coûts, les statistiques, les alignements et les textes des 122 cartes de la Demo 2.0 ont été vérifiés un par un dans le jeu le 22 septembre 2026, en anglais, puis le 25 septembre aussi en italien et en espagnol, qui sont les textes du jeu, sur le patch de la démo du 21 septembre 2026 ; les textes français sont une traduction d'OriginsMeta, pas encore vérifiée dans le jeu. Le patch 0.7 du 29 septembre a changé le coût de Bagheera, Mind Palace et Spellbook et retravaillé Twister Toss : le site applique ces changements d'après les notes de patch officielles sur Steam, et le nouveau texte de Twister Toss n'a pas encore été lu dans le jeu. Les cartes créées et les cartes retirées ne sont pas dans la collection du jeu, donc elles n'ont pas été vérifiées dans le jeu. Les illustrations sont les illustrations officielles de Koin Games ; les sagas et les notes sur chaque légende sont les nôtres.",
    news: [
      { slug: "patch-0-7", label: "Notes du patch 0.7" },
      { slug: "demo-patch-notes-0921", label: "Notes de patch de la démo du 21 septembre" },
    ],
    keywords: ["statistiques", "stats", "source", "sources", "donnees", "fiables", "verifiees", "verifies"],
  },
];

export const faqs: Record<Locale, Faq[]> = { en, it, es, fr };

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
  ],  fr: [
    "Que fait Mulan ?",
    "Quelles cartes fonctionnent bien avec Van Helsing ?",
    "Comment construire un deck légal ?",
    "Qu'est-ce qui a changé dans le patch de la démo du 21 septembre ?",
    "Quelles Légendaires y a-t-il dans la Demo 2.0 ?",
    "Que fait une capacité À la révélation ?",
  ],
};
