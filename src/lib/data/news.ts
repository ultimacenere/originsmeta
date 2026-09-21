import type { Locale } from "../i18n";

type L10n = Record<Locale, string> & { fr?: string };
const n = (en: string, it: string, fr?: string): L10n => (fr ? { en, it, fr } : { en, it });

/**
 * Una news è un articolo con una pagina propria, `/news/<slug>`, firmata come le guide (regola del
 * 21/09/2026: ogni articolo ha una pagina, una firma editoriale e i suoi parametri SEO). In /news e
 * in home compare come scheda con il riassunto; il testo completo sta nella pagina.
 */
export type NewsItem = {
  slug: string;
  /** data di pubblicazione (ISO): è la data dei fatti raccontati, non quella in cui li abbiamo scritti */
  date: string;
  /** data dell'ultima revisione (ISO), quando l'articolo è stato aggiornato dopo l'uscita; se manca vale `date` */
  updated?: string;
  /** titolo dell'articolo (H1 e scheda): entro 110 caratteri, il limite di Google per `headline` */
  title: L10n;
  /**
   * Titolo per la SERP quando `title` è più lungo: `pageTitle` ci aggiunge il marchio solo se manca,
   * quindi con "Origins TCG" dentro deve stare entro 60 caratteri, senza entro 46.
   */
  metaTitle?: L10n;
  /** riassunto di 2-3 frasi: scheda in /news e in home, attacco della pagina dell'articolo */
  summary: L10n;
  /** meta description scritta apposta (120-158 caratteri); se manca si usa il riassunto accorciato */
  description?: L10n;
  /**
   * Testo completo in Markdown, come le guide: sezioni `##`, elenchi, grassetti, link interni sempre con
   * il prefisso della lingua. I nomi delle carte diventano link da soli. Se manca, la pagina mostra il riassunto.
   */
  body?: L10n;
  /**
   * Le novità in sintesi, in cima all'articolo (richiesta di Pierluigi del 21/09/2026): ogni punto porta
   * alla sezione del testo che ne parla. `anchor` è l'ancora di un titolo del `body`, scritta nel Markdown
   * come `## Titolo {#ancora}` (vedi Markdown.tsx); `text` è la sintesi dopo i due punti, facoltativa.
   */
  highlights?: Record<Locale, { label: string; text?: string; anchor: string }[]>;
  /** domande e risposte in fondo all'articolo, anche come dati strutturati FAQPage */
  faq?: Record<Locale, { q: string; a: string }[]>;
  /** slug dell'autore che firma (src/lib/data/authors.ts); se manca firma chi risponde dei contenuti */
  author?: string;
  /** fonte: post ufficiale su Steam, stampa, oppure un mazzo pubblicato sul sito (url interno senza prefisso lingua) */
  url: string;
  /** "staff" per i mazzi pubblicati dallo staff di OriginsMeta: mostra il tag Staff e basta, mai anche "Community". */
  source: "steam" | "press" | "community" | "staff";
  /** copertina, sempre presente e diversa per ogni news: media kit ufficiale in /public/media, copertina di una carta o miniatura ufficiale YouTube */
  image: string;
  /** slug delle carte toccate dall'annuncio (o, per i mazzi della community, le carte del mazzo) */
  cards?: string[];
  /** slug delle guide del sito collegate alla news */
  guides?: string[];
};

export const news: NewsItem[] = [
  {
    slug: "demo-first-big-update",
    image: "/media/news-play-collect-trade.webp",
    guides: ["play-the-demo", "steam-next-fest-2026", "collector-economy"],
    date: "2026-09-21",
    title: n(
      "Origins TCG's first big demo update: new UI, test packs, ranked at Next Fest and the Crimson Cup card list",
      "Il primo grande aggiornamento della demo di Origins TCG: pacchetti di prova, classificata e Crimson Cup",
    ),
    metaTitle: n("Origins TCG demo update: ranked, test packs, Crimson Cup", "Aggiornamento demo Origins TCG: classificata e Crimson Cup"),
    description: n(
      "Origins TCG demo update of 21 September: new UI, test packs, the Crimson Cup card list, progress kept from demo and playtest, ranked at Next Fest.",
      "Aggiornamento della demo di Origins TCG del 21/9: nuova interfaccia, pacchetti di prova, lista carte Crimson Cup, progressi salvi e classificata al Next Fest.",
    ),
    summary: n(
      "Koin Games updated the free Origins TCG demo on 21 September: a new interface and board, a collectors tutorial, test packs and the tentative Crimson Cup card list, with everyone's progress kept. Ranked mode switches on with Steam Next Fest.",
      "Il 21 settembre Koin Games ha aggiornato la demo gratuita di Origins TCG: interfaccia e tabellone nuovi, un tutorial per collezionisti, pacchetti di prova e la lista carte provvisoria della Crimson Cup, con i progressi di tutti salvi. La classificata parte con lo Steam Next Fest.",
    ),
    highlights: {
      en: [
        { label: "New interface and board", text: "the screens around the match and the board are redrawn", anchor: "new-interface" },
        { label: "Collectors tutorial", text: "how collecting works, explained in the game", anchor: "collectors-tutorial" },
        { label: "Test packs", text: "packs to open inside the demo", anchor: "test-packs" },
        { label: "New voice lines", anchor: "voice-lines" },
        { label: "Balance changes", text: "details coming on Discord and Reddit", anchor: "balance" },
        { label: "Ranked at Steam Next Fest", text: "from 19 October, with exclusive rewards", anchor: "ranked" },
        { label: "Crimson Cup card list", text: "tentative, tournament decks can be built now", anchor: "crimson-cup" },
        { label: "Progress kept", text: "whichever is further ahead between demo and playtest", anchor: "progress" },
        { label: "Playtest", text: "no new content, polish update later in the week", anchor: "playtest" },
      ],
      it: [
        { label: "Interfaccia e tabellone nuovi", text: "schermate della partita e tabellone ridisegnati", anchor: "interfaccia" },
        { label: "Tutorial per collezionisti", text: "come funziona il collezionare, spiegato nel gioco", anchor: "tutorial-collezionisti" },
        { label: "Pacchetti di prova", text: "da aprire dentro la demo", anchor: "pacchetti-di-prova" },
        { label: "Nuove voci", anchor: "nuove-voci" },
        { label: "Modifiche di bilanciamento", text: "dettagli in arrivo su Discord e Reddit", anchor: "bilanciamento" },
        { label: "Classificata allo Steam Next Fest", text: "dal 19 ottobre, con ricompense esclusive", anchor: "classificata" },
        { label: "Lista carte della Crimson Cup", text: "provvisoria, i mazzi per il torneo si preparano già", anchor: "crimson-cup" },
        { label: "Progressi salvi", text: "vale il percorso più avanzato tra demo e playtest", anchor: "progressi" },
        { label: "Playtest", text: "niente contenuti nuovi, rifinitura più avanti in settimana", anchor: "playtest" },
      ],
    },
    body: n(
      `## What changes in the demo {#demo-changes}

The team calls it "the first big update to the Origins demo", and the word *first* suggests more will follow before the festival.

### A new interface and board {#new-interface}

The screens around the match have been upgraded and the game board has a new look.

### A collectors tutorial {#collectors-tutorial}

It explains the key aspects of collecting, the side that sets Origins apart from other digital card games: cards you open, own and trade. Our [collector economy guide](/en/guides/collector-economy) goes through the model step by step.

### Test packs {#test-packs}

Packs to open inside the demo, to try the collecting side of the game before the full launch.

### New voice lines {#voice-lines}

The update adds new voice lines; the announcement says nothing more about them.

### Balance changes {#balance}

The details have not been published yet: the team will post them on Discord and Reddit. As soon as they are out they go into [MetaShifting](/en/tier-list#tracker) and into the balance history of every card they touch.

## Ranked mode opens with Steam Next Fest {#ranked}

The team will turn ranked mode on "with the start of Steam Next Fest", with exclusive ranked rewards whose details have not been announced. The festival runs from Monday 19 October 2026 at 10:00 Pacific time to Monday 26 October. When the ladder opens to everyone, OriginsMeta's first real [tier list](/en/tier-list) starts too, built on the results.

## The Crimson Cup card list is in the game {#crimson-cup}

The update also carries the tentative card list of the Crimson Cup, the biggest tournament Koin Games has run so far, from 20 to 25 October: regional qualifiers on the 20th, 21st and 22nd, then playoffs and finals, in the Conquest format, best of three, with a best-of-five grand final. The prizes are worth 10,000 dollars in total, between cash, promo cards, packs and Alpha Edition boxes: it is not a cash prize pool.

"Barring upcoming balance patches, you can start cooking decks for the tournament", the team writes. Two tools to start with:

- the [deck builder](/en/deck-builder), whose tournament mode checks the Conquest rules while you build;
- the [Steam Next Fest guide](/en/guides/steam-next-fest-2026), with dates, times and how to sign up on Discord.

## Progress: what you keep {#progress}

This was the question left open. On 16 September a staff message on Discord had confirmed that [deck unlocks and boss progress would move from Demo 1 to Demo 2](/en/news/demo-2-progress-carryover), but it said nothing about the closed playtest. Now the team is explicit: whoever played the demo, the playtest or both keeps the progress of whichever is further ahead, "so no one will have to unlock cards again".

It matters because unlocking is slow. In the playtest every deck opens after three ranked wins plus a win against an AI boss, the path players had called punishing in the [feedback of 14 September](/en/news/playtest-feedback-deck-unlock).

## And the playtest? {#playtest}

Whoever plays the closed playtest gets no new decks, cards or bosses with this update. The polish part reaches the playtest later this week, together with other changes the team wants to test with players: anyone grinding ranked matches there will have to wait a few days.

## What we don't know yet {#open-questions}

- The details of the balance changes.
- What the exclusive ranked rewards are.
- Whether deckbuilding is already open to everyone in the public demo: the announcement does not say.
- The post on Steam: for now the announcement is on Reddit and Discord only.

We will update this article as the answers arrive.

## The rumour that got it right {#rumour}

Last week a line went around on social media about a "Demo Season 2" coming the following week, with new decks, new rewards and a first taste of collecting. We [reported it as a rumour](/en/news/demo-2-animations-and-fixes), because no official post confirmed it. The timing and the collecting part turned out to be right.`,
      `## Cosa cambia nella demo {#cosa-cambia}

Il team lo chiama "il primo grande aggiornamento della demo di Origins", e quel *primo* lascia intendere che altri seguiranno prima del festival.

### Interfaccia e tabellone nuovi {#interfaccia}

Le schermate intorno alla partita sono state rinnovate e il tabellone ha un aspetto nuovo.

### Un tutorial per collezionisti {#tutorial-collezionisti}

Spiega gli aspetti chiave del collezionare, la parte che distingue Origins dagli altri giochi di carte digitali: carte che si aprono, si possiedono e si scambiano. La nostra [guida all'economia da collezione](/it/guides/collector-economy) spiega il modello passo per passo.

### Pacchetti di prova {#pacchetti-di-prova}

Pacchetti da aprire dentro la demo, per provare il lato collezionistico del gioco prima dell'uscita completa.

### Nuove voci {#nuove-voci}

L'aggiornamento aggiunge nuove voci al gioco; l'annuncio non dice altro.

### Modifiche di bilanciamento {#bilanciamento}

I dettagli non sono ancora pubblici: il team li pubblicherà su Discord e Reddit. Appena escono finiscono nel [MetaShifting](/it/tier-list#tracker) e nello storico di ogni carta che toccano.

## La classificata parte con lo Steam Next Fest {#classificata}

Il team accenderà la modalità classificata "con l'inizio dello Steam Next Fest", con ricompense esclusive i cui dettagli non sono ancora stati annunciati. Il festival va da lunedì 19 ottobre 2026 alle 19:00 italiane a lunedì 26 ottobre. Quando la ladder si apre a tutti parte anche la prima vera [tier list](/it/tier-list) di OriginsMeta, costruita sui risultati.

## La lista carte della Crimson Cup è nel gioco {#crimson-cup}

L'aggiornamento contiene anche la lista carte provvisoria della Crimson Cup, il torneo più grande organizzato finora da Koin Games, dal 20 al 25 ottobre: qualificazioni regionali il 20, 21 e 22, poi playoff e finali, in formato Conquest al meglio delle tre partite, con la finalissima al meglio delle cinque. I premi valgono 10.000 dollari in tutto, tra denaro, carte promo, pacchetti e box dell'Alpha Edition: non è un montepremi in contanti.

"Salvo le prossime patch di bilanciamento, potete iniziare a preparare i mazzi per il torneo", scrive il team. Due strumenti per cominciare:

- il [deck builder](/it/deck-builder), che in modalità torneo controlla le regole del Conquest mentre costruisci;
- la [guida allo Steam Next Fest](/it/guides/steam-next-fest-2026), con date, orari e come iscriversi su Discord.

## I progressi: cosa si conserva {#progressi}

Era la domanda rimasta aperta. Il 16 settembre un messaggio dello staff su Discord aveva confermato che [gli sblocchi dei mazzi e i progressi contro i boss sarebbero passati dalla Demo 1 alla Demo 2](/it/news/demo-2-progress-carryover), ma del playtest chiuso non diceva nulla. Ora il team è esplicito: chi ha giocato la demo, il playtest o entrambi conserva i progressi del percorso più avanzato, "così nessuno dovrà sbloccare di nuovo le carte".

Conta perché sbloccare è lento. Nel playtest ogni mazzo si apre dopo tre vittorie in classificata più una vittoria contro un boss IA, il percorso che i giocatori avevano definito punitivo nel [feedback del 14 settembre](/it/news/playtest-feedback-deck-unlock).

## E il playtest? {#playtest}

Chi gioca il playtest chiuso non riceve nuovi mazzi, carte o boss con questo aggiornamento. La parte di rifinitura arriva sul playtest più avanti in settimana, insieme ad altre novità che il team vuole provare con i giocatori: chi macina partite classificate lì dovrà pazientare qualche giorno.

## Cosa non sappiamo ancora {#domande-aperte}

- Il dettaglio delle modifiche di bilanciamento.
- In cosa consistono le ricompense esclusive della classificata.
- Se il deck builder è già aperto a tutti nella demo pubblica: l'annuncio non lo dice.
- Il post su Steam: per ora l'annuncio c'è solo su Reddit e su Discord.

Aggiorneremo questo articolo man mano che arrivano le risposte.

## Il rumor che ci aveva preso {#rumor}

La settimana scorsa girava sui social una frase su una "Demo Season 2" in arrivo la settimana successiva, con nuovi mazzi, nuove ricompense e un primo assaggio del collezionare. L'avevamo [riportata come rumor](/it/news/demo-2-animations-and-fixes), perché nessun post ufficiale la confermava. I tempi e la parte sul collezionismo si sono rivelati giusti.`,
    ),
    faq: {
      en: [
        { q: "Do I lose my progress with the Origins TCG demo update?", a: "No. Whoever played the demo, the closed playtest or both keeps the progress of whichever is further ahead, so no cards have to be unlocked again (team announcement of 21 September 2026)." },
        { q: "When does ranked mode start in the Origins TCG demo?", a: "With the start of Steam Next Fest, on Monday 19 October 2026, with exclusive ranked rewards whose details have not been announced yet." },
        { q: "Can I already build decks for the Crimson Cup?", a: "Yes: the tentative card list of the tournament has been in the game since the update of 21 September. Balance patches can still change it before the Crimson Cup, which runs from 20 to 25 October 2026." },
        { q: "What changes for playtest players?", a: "No new decks, cards or bosses for now: the polish update reaches the playtest later in the week of 21 September, together with other changes to test." },
      ],
      it: [
        { q: "Con l'aggiornamento della demo di Origins TCG perdo i progressi?", a: "No. Chi ha giocato la demo, il playtest chiuso o entrambi conserva i progressi del percorso più avanzato, quindi nessuna carta va sbloccata di nuovo (annuncio del team del 21 settembre 2026)." },
        { q: "Quando parte la classificata nella demo di Origins TCG?", a: "Con l'inizio dello Steam Next Fest, lunedì 19 ottobre 2026, con ricompense esclusive i cui dettagli non sono ancora stati annunciati." },
        { q: "Si possono già preparare i mazzi per la Crimson Cup?", a: "Sì: la lista carte provvisoria del torneo è nel gioco dall'aggiornamento del 21 settembre. Le patch di bilanciamento possono ancora cambiarla prima della Crimson Cup, dal 20 al 25 ottobre 2026." },
        { q: "Cosa cambia per chi gioca il playtest?", a: "Per ora nessun nuovo mazzo, carta o boss: l'aggiornamento di rifinitura arriva sul playtest più avanti nella settimana del 21 settembre, insieme ad altre novità da provare." },
      ],
    },
    url: "https://www.reddit.com/r/OriginsTCG/comments/1wmobte/the_first_big_update_to_the_origins_demo_just/",
    source: "press",
  },
  {
    slug: "forum-bugs-before-demo-2",
    image: "/media/ss-board-mill.webp",
    cards: ["spellbook", "golden-egg", "golden-goose", "black-knight"],
    date: "2026-09-20",
    updated: "2026-09-21",
    title: n(
      "Stuck matches, the egg at the Colosseum and a rematch button: the weekend's reports",
      "Partite bloccate, l'uovo al Colosseum e il tasto rivincita: le segnalazioni del fine settimana",
    ),
    metaTitle: n("Origins TCG bugs: stuck matches, Colosseum, Golden Egg", "Bug di Origins TCG: partite bloccate e uovo al Colosseum"),
    description: n(
      "Three Origins TCG forum reports of 19–20 September: a match stuck on waiting, the Golden Egg at the Colosseum and a rematch button for private matches.",
      "Tre segnalazioni del 19–20 settembre sul forum di Origins TCG: partita bloccata su waiting, il Golden Egg al Colosseum e il tasto rivincita nelle private.",
    ),
    summary: n(
      "Three new threads on the Steam forum between 19 and 20 September, none answered by the team yet: a match that freezes after combat, a Golden Egg that behaves oddly at the Colosseum and a request for a rematch button in private matches.",
      "Tre nuovi thread sul forum Steam tra il 19 e il 20 settembre, ancora senza risposta del team: una partita che si blocca dopo il combattimento, un Golden Egg che al Colosseum si comporta in modo strano e la richiesta di un tasto rivincita nelle partite private.",
    ),
    body: n(
      `## A match stuck on "waiting"

On 20 September a player reported a match that froze after the combat phase: the screen stayed on "waiting" well past the timer, while everything else was still clickable and the match could still be conceded.

Another player replied that it is a known bug tied to Spellbook and that it should be fixed in "demo season 2 next week". That answer came from a player, not from the team, and at the time it was not an announcement.

**Update, 21 September:** the [first big demo update](/en/news/demo-first-big-update) did arrive the following day. The list of fixes has not been published yet, so we cannot say whether this bug is among them.

## The Golden Egg at the Colosseum

On 19 September another player described a combat at the Colosseum location:

1. their Golden Egg was broken by Black Knight's On Reveal, which deals 2 damage to the enemy across from it;
2. the egg summoned the Golden Goose, a 5/5, in the same space;
3. in combat the Goose dealt no damage: Black Knight, a 2/2, survived, and the Goose was left at 5/3.

It looks like the rule developer Fenchurch explained on the forum on 15 September: a character summoned halfway through combat, in the space it lands on, does not attack until the next round. Being summoned does not protect it from damage, which accounts for the 5/3. What the Colosseum adds is not clear yet: the thread has no answer so far.

## A rematch button for private matches

The third thread is a request: a "play again" or "rematch" button at the end of a private match, and the option to change decks without leaving the private lobby.

## What the team has said so far

The last replies from the team on the forum date back to 16 September: [faster animations and the Off With Your Head! bug](/en/news/demo-2-animations-and-fixes), and [the rework of the boss fight AI](/en/news/demo-2-boss-ai-rework).`,
      `## Una partita bloccata su "waiting"

Il 20 settembre un giocatore ha segnalato una partita che si è fermata dopo la fase di combattimento: lo schermo è rimasto su "waiting" ben oltre il tempo del turno, mentre tutto il resto era ancora cliccabile e la partita si poteva ancora abbandonare.

Un altro giocatore ha risposto che è un bug noto legato a Spellbook e che dovrebbe essere corretto nella "demo season 2 la settimana prossima". La risposta veniva da un giocatore, non dal team, e in quel momento non era un annuncio.

**Aggiornamento del 21 settembre:** il [primo grande aggiornamento della demo](/it/news/demo-first-big-update) è arrivato davvero il giorno dopo. L'elenco delle correzioni non è ancora stato pubblicato, quindi non possiamo dire se questo bug sia tra quelli sistemati.

## Il Golden Egg al Colosseum

Il 19 settembre un altro giocatore ha descritto un combattimento al luogo Colosseum:

1. il suo Golden Egg è stato rotto dall'On Reveal del Black Knight, che infligge 2 danni al nemico di fronte;
2. l'uovo ha evocato la Golden Goose, una 5/5, nella stessa casella;
3. in combattimento la Goose non ha inflitto danni: il Black Knight, un 2/2, è sopravvissuto e la Goose è rimasta 5/3.

Somiglia alla regola spiegata sul forum dallo sviluppatore Fenchurch il 15 settembre: un personaggio evocato a metà combattimento, nella casella in cui compare, non attacca fino al round successivo. L'evocazione però non lo mette al riparo dai danni, e questo spiega il 5/3. Cosa aggiunga il Colosseum non è ancora chiaro: il thread per ora non ha risposte.

## Un tasto rivincita per le partite private

Il terzo thread è una richiesta: un tasto "gioca ancora" o "rivincita" alla fine di una partita privata, e la possibilità di cambiare mazzo senza uscire dalla stanza privata.

## Cosa ha detto il team finora

Le ultime risposte del team sul forum risalgono al 16 settembre: [animazioni più veloci e il bug di Off With Your Head!](/it/news/demo-2-animations-and-fixes), e [il rework dell'IA delle boss fight](/it/news/demo-2-boss-ai-rework).`,
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/570423638738992342/",
    source: "steam",
  },
  {
    slug: "demo-2-progress-carryover",
    image: "/media/ss-legendary-winnie.webp",
    date: "2026-09-16",
    updated: "2026-09-21",
    title: n(
      "Demo 2.0 keeps your Demo 1 deck and boss unlocks",
      "La Demo 2.0 mantiene gli sblocchi di mazzi e boss della Demo 1",
    ),
    metaTitle: n("Origins TCG Demo 2.0 keeps your Demo 1 unlocks", "Demo 2.0 di Origins TCG: sblocchi della Demo 1 salvi"),
    description: n(
      "A Koin Games staff message on Discord, 16 September: deck unlocks and boss progress from the Origins TCG Demo 1 carry over to Demo 2.",
      "Messaggio dello staff Koin su Discord del 16 settembre: gli sblocchi dei mazzi e i progressi contro i boss della Demo 1 di Origins TCG passano alla Demo 2.",
    ),
    summary: n(
      "On 16 September a Koin Games staff member wrote on the official Discord that Demo 2 carries over the deck unlocks and boss progress earned in Demo 1. On 21 September the team extended the promise to the closed playtest.",
      "Il 16 settembre un membro dello staff di Koin Games ha scritto sul Discord ufficiale che la Demo 2 mantiene gli sblocchi dei mazzi e i progressi contro i boss ottenuti nella Demo 1. Il 21 settembre il team ha esteso la promessa al playtest chiuso.",
    ),
    body: n(
      `## What the staff wrote

"Demo V2 deck will carry over your V1 deck unlock/boss progress": this is the message a member of the Origins staff posted on the official Discord in the evening of 16 September, replying to players who asked whether everyone would have to start over. A screenshot of the message was shared on Reddit the next morning.

## Why it mattered

In the playtest every deck is unlocked with three ranked wins plus a win against an AI boss, the path players had called punishing in the [feedback of 14 September](/en/news/playtest-feedback-deck-unlock). Having to repeat it from zero with Demo 2 was the main worry. Until that message, the answer going around in the community was the opposite one.

## What was still open

The message spoke of Demo 1 and Demo 2 only. Whether the progress earned in the closed playtest would count as well was not written in any official post, so at the time we kept the two apart.

## Update, 21 September

The question is closed. Announcing [the first big demo update](/en/news/demo-first-big-update), the team wrote that whoever played the demo, the playtest or both keeps the progress of whichever is further ahead, "so no one will have to unlock cards again".`,
      `## Cosa ha scritto lo staff

"Demo V2 deck will carry over your V1 deck unlock/boss progress", cioè la Demo 2 mantiene gli sblocchi dei mazzi e i progressi contro i boss della Demo 1: è il messaggio che un membro dello staff di Origins ha pubblicato sul Discord ufficiale la sera del 16 settembre, rispondendo ai giocatori che chiedevano se si sarebbe ricominciato da zero. Lo screenshot del messaggio è stato condiviso su Reddit la mattina dopo.

## Perché contava

Nel playtest ogni mazzo si sblocca con tre vittorie in classificata più una vittoria contro un boss IA, il percorso che i giocatori avevano definito punitivo nel [feedback del 14 settembre](/it/news/playtest-feedback-deck-unlock). Doverlo rifare da capo con la Demo 2 era il timore principale. Fino a quel messaggio, nella community circolava la risposta opposta.

## Cosa restava aperto

Il messaggio parlava solo di Demo 1 e Demo 2. Se contassero anche i progressi fatti nel playtest chiuso non era scritto in nessun post ufficiale, quindi allora abbiamo tenuto le due cose separate.

## Aggiornamento del 21 settembre

La questione è chiusa. Annunciando [il primo grande aggiornamento della demo](/it/news/demo-first-big-update), il team ha scritto che chi ha giocato la demo, il playtest o entrambi conserva i progressi del percorso più avanzato, "così nessuno dovrà sbloccare di nuovo le carte".`,
    ),
    url: "https://discord.gg/originstcg",
    source: "press",
  },
  {
    slug: "demo-2-boss-ai-rework",
    image: "/cards/cover/dracula.webp",
    date: "2026-09-16",
    updated: "2026-09-21",
    title: n(
      "Koin will rework the boss fight AI in Demo 2.0",
      "Koin rifarà l'IA delle boss fight nella Demo 2.0",
    ),
    metaTitle: n("Origins TCG: Koin reworks the boss AI for Demo 2.0", "Origins TCG: Koin rifà l'IA dei boss nella Demo 2.0"),
    description: n(
      "Developer Fenchurch confirms on the Steam forum a rework of the Origins TCG boss fight AI in Demo v2, after a report on the Dracula mission boss.",
      "Lo sviluppatore Fenchurch conferma sul forum Steam il rework dell'IA delle boss fight di Origins TCG nella Demo v2, dopo una segnalazione sul boss Dracula.",
    ),
    summary: n(
      "A player described the Dracula mission boss winning every random roll. Koin Games developer Fenchurch replied on the Steam forum that the boss fight AI is being reworked for Demo v2, and that bosses and card unlocking will keep changing.",
      "Un giocatore ha raccontato un boss Dracula delle missioni che vince ogni tiro casuale. Lo sviluppatore di Koin Games Fenchurch ha risposto sul forum Steam che l'IA delle boss fight verrà rifatta per la Demo v2, e che boss e sblocco delle carte continueranno a cambiare.",
    ),
    body: n(
      `## The report

On 15 September a player posted on the Steam forum an account of four games against Dracula, the boss of the demo missions. The earlier bosses, they wrote, were strong but fair: all beaten at the first try with the premade decks unlocked just before them. Dracula, instead, seemed to get every "random" effect right:

- pumpkins always hitting the barrier with the least health;
- spells that deal 6 damage at random always landing on the strongest minion with 6 Health or less;
- random discards always taking the most dangerous card in hand;
- random summons always in the best space.

## The team's answer

Developer Fenchurch replied on 16 September: "Our boss fight AI will be getting a re-work in Demo v2". He added that the team will keep watching and changing how boss fights and card unlocking work.

It is not the first change to the bosses. The playtest patch notes 0.6.3 of 27 August had already given them "new upgraded bot intelligence", asking players whether they had become smarter or dumber.

## Why it matters

Bosses are part of the unlock path: in the playtest a deck opens after three ranked wins and a win against an AI boss. A boss that feels unfair slows down the whole collection. It is the second time in a week that this path comes back from the feedback threads, after [the reply of 14 September](/en/news/playtest-feedback-deck-unlock) about making those matches PvE only.

## What came next

On 21 September the [first big demo update](/en/news/demo-first-big-update) arrived. The announcement does not mention the bosses: whether the new AI is already in it is not known yet.`,
      `## La segnalazione

Il 15 settembre un giocatore ha raccontato sul forum Steam quattro partite contro Dracula, il boss delle missioni della demo. I boss precedenti, ha scritto, erano forti ma corretti: tutti battuti al primo tentativo con i mazzi pronti sbloccati poco prima. Dracula invece sembrava azzeccare ogni effetto "casuale":

- le zucche colpivano sempre la barriera con meno vita;
- le magie che infliggono 6 danni a caso finivano sempre sul personaggio più forte con 6 di vita o meno;
- gli scarti casuali prendevano sempre la carta più pericolosa in mano;
- le evocazioni casuali comparivano sempre nella casella migliore.

## La risposta del team

Lo sviluppatore Fenchurch ha risposto il 16 settembre: "Our boss fight AI will be getting a re-work in Demo v2", cioè l'IA delle boss fight verrà rifatta nella Demo v2. Ha aggiunto che il team continuerà a osservare e a cambiare il funzionamento dei boss e dello sblocco delle carte.

Non è il primo intervento sui boss. Le patch notes del playtest 0.6.3, del 27 agosto, avevano già dato ai boss una "nuova intelligenza potenziata", chiedendo ai giocatori se fossero diventati più svegli o più tonti.

## Perché conta

I boss fanno parte del percorso di sblocco: nel playtest un mazzo si apre dopo tre vittorie in classificata e una vittoria contro un boss IA. Un boss che sembra scorretto rallenta tutta la collezione. È la seconda volta in una settimana che questo percorso torna dai thread di feedback, dopo [la risposta del 14 settembre](/it/news/playtest-feedback-deck-unlock) sull'idea di rendere quelle partite solo PvE.

## Cosa è successo dopo

Il 21 settembre è arrivato il [primo grande aggiornamento della demo](/it/news/demo-first-big-update). L'annuncio non parla dei boss: se la nuova IA ci sia già non si sa ancora.`,
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/617711086156930951/",
    source: "steam",
  },
  {
    slug: "demo-2-animations-and-fixes",
    image: "/media/ss-board-draw.webp",
    cards: ["off-with-your-head", "christopher-robin"],
    date: "2026-09-16",
    updated: "2026-09-21",
    title: n(
      "Before Demo 2.0: faster animations confirmed, Off With Your Head! bug on the fix list",
      "Prima della Demo 2.0: animazioni più rapide confermate, il bug di Off With Your Head! da correggere",
    ),
    metaTitle: n("Origins TCG: faster animations, Off With Your Head! fix", "Origins TCG: animazioni rapide, bug di Off With Your Head!"),
    description: n(
      "What the Origins TCG team confirmed on 16 September: faster animations, the Off With Your Head! bug fixed with Demo v2, audio reports, and a rumour.",
      "Cosa ha confermato il team di Origins TCG il 16 settembre: animazioni più veloci, il bug di Off With Your Head! corretto con la Demo v2, l'audio e un rumor.",
    ),
    summary: n(
      "On 16 September the team confirmed on the Steam forum that animations will be sped up and that the invisible copies of Off With Your Head! are a known bug, fixed with Demo v2. Meanwhile a rumour about a \"Demo Season 2\" was going around.",
      "Il 16 settembre il team ha confermato sul forum Steam che le animazioni verranno velocizzate e che le copie invisibili di Off With Your Head! sono un bug noto, corretto con la Demo v2. Intanto sui social girava un rumor su una \"Demo Season 2\".",
    ),
    body: n(
      `## Faster animations

"Animations need to be sped up 100–200%": the thread opened on 11 September got mostly agreeing replies, with one player saying the speed is fine as it is. On 16 September a member of the staff answered that the team has acknowledged the need to speed up animations and that "it'll be amended in an upcoming update".

## The Off With Your Head! bug

A new player described copies of Christopher Robin appearing without artwork, with only Power and Health visible. Developer Fenchurch identified the card behind it: Off With Your Head!, which destroys an ally and summons a basic copy of it in every other location. The semi-invisible copies are a known bug, and "it will be fixed when we release Demo v2 here really soon".

## Audio

To a player who had listed several bugs, Fenchurch replied that the audio reports would be passed on to the audio team.

## The "Demo Season 2" rumour

In the same days a line went around on social media: a "Demo Season 2" coming the following week, with new decks, new rewards and a first taste of collecting. No official post on Steam, on Discord or on origins-tcg.com confirmed it, so we reported it as a rumour and kept to the official dates, Steam Next Fest from 19 to 26 October.

**Update, 21 September:** the rumour had the timing right. The [first big demo update](/en/news/demo-first-big-update) arrived on 21 September with a collectors tutorial and test packs. The list of fixes has not been published yet, so we cannot say whether the Off With Your Head! bug is among them.`,
      `## Animazioni più veloci

"Le animazioni vanno accelerate del 100–200%": il thread aperto l'11 settembre ha raccolto quasi solo risposte d'accordo, con un giocatore che trova la velocità giusta così. Il 16 settembre un membro dello staff ha risposto che il team ha preso atto della richiesta e che le animazioni saranno velocizzate "in un aggiornamento in arrivo".

## Il bug di Off With Your Head!

Un giocatore alle prime armi ha descritto copie di Christopher Robin comparse senza illustrazione, con visibili solo attacco e vita. Lo sviluppatore Fenchurch ha individuato la carta responsabile: Off With Your Head!, che distrugge un alleato ed evoca una sua copia base in ogni altro luogo. Le copie semi-invisibili sono un bug noto, che "verrà corretto con l'uscita della Demo v2, molto presto".

## Audio

A un giocatore che aveva elencato diversi bug, Fenchurch ha risposto che le segnalazioni sull'audio sarebbero passate al team audio.

## Il rumor della "Demo Season 2"

Negli stessi giorni girava sui social una frase: una "Demo Season 2" in arrivo la settimana successiva, con nuovi mazzi, nuove ricompense e un primo assaggio del collezionare. Nessun post ufficiale su Steam, su Discord o su origins-tcg.com la confermava, quindi l'abbiamo riportata come rumor e siamo rimasti alle date ufficiali, lo Steam Next Fest dal 19 al 26 ottobre.

**Aggiornamento del 21 settembre:** il rumor ci aveva preso sui tempi. Il [primo grande aggiornamento della demo](/it/news/demo-first-big-update) è arrivato il 21 settembre, con un tutorial per collezionisti e pacchetti di prova. L'elenco delle correzioni non è ancora stato pubblicato, quindi non possiamo dire se il bug di Off With Your Head! sia tra quelli sistemati.`,
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/617710833111225236/",
    source: "steam",
  },
  {
    slug: "davdas-3-pigs-mid-range",
    image: "/cards/cover/three-not-so-little-pigs.webp",
    cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    guides: ["three-pigs-midrange-guide", "three-pigs-midrange-matchups"],
    date: "2026-09-15",
    title: n(
      "3 Pigs Mid Range: a Three Not So Little Pigs midrange deck for ladder and tournaments",
      "3 Pigs Mid Range: un mazzo midrange dei Three Not So Little Pigs per ladder e tornei",
      "3 Pigs Mid Range : un deck midrange Three Not So Little Pigs pour le ladder et les tournois",
    ),
    summary: n(
      "The second deck by Davdas, OriginsMeta staff, is a midrange list led by Three Not So Little Pigs, tagged for ladder and competitive play. The plan: take the board in the first rounds, win at least one location, then close with En Passant, Ellen Trechend's Trample and the Lightning Strikes that Impundulu generates. The deck page has the full list with composition charts, the author's mulligan notes, the OM code to open it in the deck builder and two guides on how to play it.",
      "Il secondo mazzo di Davdas, staff di OriginsMeta, è una lista midrange guidata dai Three Not So Little Pigs, segnata per la ladder e il gioco competitivo. Il piano: prendere il tabellone nei primi round, vincere almeno un luogo e chiudere con En Passant, il Trample di Ellen Trechend e i Lightning Strike generati da Impundulu. Nella scheda trovi la lista completa con i grafici di composizione, le note di mulligan dell'autore, il codice OM per aprirla nel deck builder e due guide su come giocarla.",
      "Le deuxième deck de Davdas, membre du staff d'OriginsMeta, est une liste midrange menée par Three Not So Little Pigs, prévue pour le ladder et le jeu compétitif. Le plan : prendre le plateau dans les premiers tours, gagner au moins un lieu, puis conclure avec En Passant, le Trample d'Ellen Trechend et les Lightning Strike générés par Impundulu. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de l'auteur, le code OM pour l'ouvrir dans le deck builder et deux guides pour le jouer.",
    ),
    url: "/decks/community/3-pigs-mid-range-6311",
    source: "staff",
  },
  {
    slug: "davdas-healing-healsing",
    image: "/cards/cover/van-helsing.webp",
    cards: ["van-helsing", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "phuong-hoang", "jekyll", "boitata", "tin-woodman", "spellbook", "searing-light", "forbidden-knowledge"],
    guides: ["healing-healsing-guide", "healing-healsing-matchups"],
    date: "2026-09-15",
    title: n(
      "Healing Healsing, the first community deck: a Van Helsing control list for the ladder",
      "Healing Healsing, il primo mazzo della community: una lista controllo di Van Helsing per la ladder",
      "Healing Healsing, le premier deck de la communauté : une liste contrôle Van Helsing pour le ladder",
    ),
    summary: n(
      "The first deck published on OriginsMeta is by Davdas, OriginsMeta staff: a control list led by Van Helsing for the ranked ladder. The plan: take early value with Spellbook and Ali Baba, heal through the damage while Phuong Hoang grows with every heal, then reach round 8 or 9 and reset the board with Forbidden Knowledge. The deck page has the full list with composition charts, the author's mulligan notes, the OM code for the deck builder and two guides on how to play it.",
      "Il primo mazzo pubblicato su OriginsMeta è di Davdas, staff del sito: una lista controllo guidata da Van Helsing per la ladder classificata. Il piano: prendere valore presto con Spellbook e Ali Baba, curare i danni mentre Phuong Hoang cresce a ogni cura, poi arrivare al round 8 o 9 e azzerare il tabellone con Forbidden Knowledge. Nella scheda trovi la lista completa con i grafici di composizione, le note di mulligan dell'autore, il codice OM per il deck builder e due guide su come giocarla.",
      "Le premier deck publié sur OriginsMeta est signé Davdas, membre du staff : une liste contrôle menée par Van Helsing pour le ladder classé. Le plan : prendre de la valeur tôt avec Spellbook et Ali Baba, soigner les dégâts pendant que Phuong Hoang grandit à chaque soin, puis atteindre le tour 8 ou 9 et remettre le plateau à zéro avec Forbidden Knowledge. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de l'auteur, le code OM pour le deck builder et deux guides pour le jouer.",
    ),
    url: "/decks/community/healing-healsing-9411",
    source: "staff",
  },
  {
    slug: "playtest-feedback-deck-unlock",
    image: "/media/ss-collection.webp",
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
    image: "/media/ls-two-ways.webp",
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
    image: "/media/news-trailer.webp",
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
    image: "/media/ss-board-hand-full.webp",
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
    image: "/media/news-crimson-cup.webp",
    date: "2026-09-09",
    title: n("Crimson Cup announced: the biggest tournament ever for Steam Next Fest", "Annunciata la Crimson Cup: il torneo più grande di sempre per lo Steam Next Fest", "La Crimson Cup annoncée : le plus grand tournoi jamais organisé pour le Steam Next Fest"),
    summary: n(
      "A multi-day event from 20 to 25 October: qualifiers for each of the three major regions on the 20th, 21st and 22nd, then playoffs and finals. Prizes worth $10,000: an exclusive 1/1 promo card, other promo cards, digital packs, Alpha boxes and cases, and cash prizes. Sign-ups on Discord; creators can request wildcard invites straight into the playoffs.",
      "Un evento su più giorni dal 20 al 25 ottobre: qualificazioni per le tre macro-regioni il 20, 21 e 22, poi playoff e finali. Premi per un valore complessivo di 10.000 $: una carta promo 1/1 esclusiva, altre carte promo, pacchetti digitali, box e case Alpha, premi in denaro. Iscrizioni su Discord; i creator possono chiedere inviti wildcard diretti ai playoff.",
      "Un événement sur plusieurs jours du 20 au 25 octobre : qualifications pour les trois grandes régions les 20, 21 et 22, puis playoffs et finales. Des lots d'une valeur totale de 10 000 $ : une carte promo 1/1 exclusive, d'autres cartes promo, des packs numériques, des boîtes et cases Alpha, et des prix en argent. Inscriptions sur Discord ; les créateurs peuvent demander une invitation wildcard directe pour les playoffs.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1843481262690278",
    source: "steam",
  },
  {
    slug: "patch-0-6-3",
    image: "/media/ss-board-ley-line.webp",
    cards: ["king-arthur", "merlin", "lancelot", "old-macdonald", "bandersnatch", "bigfoot", "bagheera", "christopher-robin", "sandman", "scarecrow", "merlins-prophecy", "blow-the-house-down", "bridge-troll", "rumple", "thumbelina", "white-queen"],
    date: "2026-08-27",
    title: n("Playtest patch 0.6.3: sixteen cards tuned, King Arthur up to 7/7", "Patch 0.6.3 del playtest: sedici carte ritoccate, Re Artù a 7/7", "Patch 0.6.3 du playtest : seize cartes ajustées, le roi Arthur à 7/7"),
    summary: n(
      "A tuning-and-fixes patch, used for Big Bob's tournament two days later. Buffs to King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll and Blow the House Down; nerfs to Bandersnatch, Bigfoot, Scarecrow and Merlin's Prophecy; Bagheera, Christopher Robin and Sandman reworked. Bosses got smarter AI.",
      "Una patch di tuning e correzioni, usata per il torneo di Big Bob due giorni dopo. Buff a Re Artù, Merlino, Lancillotto, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll e Blow the House Down; nerf a Bandersnatch, Bigfoot, Scarecrow e Merlin's Prophecy; Bagheera, Christopher Robin e Sandman rivisti. I boss hanno un'IA più intelligente.",
      "Un patch d'ajustements et de correctifs, utilisé pour le tournoi de Big Bob deux jours plus tard. Buffs pour le roi Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll et Blow the House Down ; nerfs pour Bandersnatch, Bigfoot, Scarecrow et Merlin's Prophecy ; Bagheera, Christopher Robin et Sandman retravaillés. Les boss ont une IA plus maligne.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1842212951301184",
    source: "steam",
  },
  {
    slug: "big-bobs-playtest-battle",
    image: "/media/ss-versus.webp",
    date: "2026-08-25",
    title: n("Big Bob's Playtest Battle brings the Conquest format", "Big Bob's Playtest Battle porta il formato Conquest", "Big Bob's Playtest Battle inaugure le format Conquest"),
    summary: n(
      "Tournament on 28 August on the playtest build with full deckbuilding. Best-of-3, single elimination, and the first use of Conquest: submit several decks with different Legendaries and at least nine different cards, ban one of your opponent's. Prizes: wildcards for the Next Fest tournament and Collector Packs.",
      "Torneo il 28 agosto sulla build del playtest con deckbuilding completo. Best-of-3, eliminazione diretta e primo uso del Conquest: si registrano più mazzi con Leggendarie diverse e almeno nove carte differenti, si banna un mazzo avversario. Premi: wildcard per il torneo del Next Fest e Collector Pack.",
      "Tournoi le 28 août sur la build du playtest avec deckbuilding complet. Best-of-3, élimination directe et première utilisation du Conquest : plusieurs decks avec des Légendaires différentes et au moins neuf cartes différentes, un ban chez l'adversaire. Récompenses : wildcards pour le tournoi du Next Fest et Collector Packs.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1841579228677617",
    source: "steam",
  },
  {
    slug: "patch-0-6-2",
    image: "/media/ss-board-reveals.webp",
    cards: ["mulan", "queen-of-hearts", "ellen-trechend", "van-helsings-tools", "banshee", "piglet", "wicked-witch-of-the-west", "three-not-so-little-pigs", "bandersnatch", "basilisk", "brides-of-dracula", "card-soldier", "flying-monkey", "guy-of-gisborne", "humpty", "huntsman", "imhotep", "kanga", "little-lamb", "marian", "pegasus", "stroke-of-midnight"],
    date: "2026-08-21",
    title: n("Playtest patch 0.6.2: balance pass on 23 cards", "Patch 0.6.2 del playtest: bilanciamento di 23 carte", "Patch 0.6.2 du playtest : équilibrage de 23 cartes"),
    summary: n(
      "Eight cards changed what their ability does. Mulan gains Double Attack, the Queen of Hearts drops to 4 Mana 3/3 with First Strike, Ellen Trechend becomes an 8-Mana 3/3 that grows +3/+3 per enemy. Van Helsing's Tools is free but the Silver Bullet deals 1. The collection is now scoped to the ten playtest decks.",
      "Otto carte hanno cambiato abilità. Mulan ottiene Doppio Attacco, la Regina di Cuori scende a 4 Mana 3/3 con Primo Colpo, Ellen Trechend diventa un 3/3 da 8 Mana che cresce +3/+3 per nemico. Van Helsing's Tools è gratis ma il Proiettile d'Argento fa 1 danno. La collezione è ora limitata ai dieci mazzi del playtest.",
      "Huit cartes ont changé de capacité. Mulan gagne Double Attaque, la Reine de Cœur passe à 4 Mana 3/3 avec Initiative, Ellen Trechend devient un 3/3 à 8 Mana qui grandit de +3/+3 par ennemi. Van Helsing's Tools est gratuit mais la Balle d'argent inflige 1. La collection est désormais limitée aux dix decks du playtest.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1841579228669961",
    source: "steam",
  },
  {
    slug: "patch-0-6-1-ranked",
    image: "/media/news-patch-061.webp",
    cards: ["huntsman", "mowgli", "first-aid", "count-orlok", "bandersnatch", "genie", "mind-palace", "koschei"],
    date: "2026-08-14",
    title: n("Patch 0.6.1: ranked ladder, Grandmaster leaderboard, three decks retuned", "Patch 0.6.1: ladder classificata, classifica Grandmaster, tre mazzi ritoccati", "Patch 0.6.1 : ladder classé, classement Grandmaster, trois decks retouchés"),
    summary: n(
      "Ranked mode arrives with a world leaderboard for the Grandmaster division, plus quality of life: skip the tutorial, preview the opponent's Legendary during mulligan, mute emotes. Huntsman moves to 6 Mana 6/6; Swarm, Evil and Discard each swap one card.",
      "Arriva la modalità classificata con una classifica mondiale per la divisione Grandmaster, più comodità: salta il tutorial, anteprima della Leggendaria avversaria durante il mulligan, silenzia le emote. Huntsman passa a 6 Mana 6/6; Swarm, Evil e Discard cambiano una carta ciascuno.",
      "Le mode classé arrive avec un classement mondial pour la division Grandmaster, plus du confort : passer le tutoriel, aperçu de la Légendaire adverse pendant le mulligan, couper les émotes. Huntsman passe à 6 Mana 6/6 ; Swarm, Evil et Discard échangent une carte chacun.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1840944183780414",
    source: "steam",
  },
  {
    slug: "demo-2-playtest",
    image: "/media/news-demo2-playtest.webp",
    date: "2026-08-05",
    title: n("Demo 2.0 playtest: 5 new decks, 70+ new cards, deckbuilding", "Playtest della Demo 2.0: 5 nuovi mazzi, oltre 70 carte nuove, deckbuilding", "Playtest de la Démo 2.0 : 5 nouveaux decks, plus de 70 cartes, deckbuilding"),
    summary: n(
      "The update that will ship for Steam Next Fest in October goes to community playtests, starting Friday 7 August at 9pm UTC with a game night. Open to everyone through Discord.",
      "L'aggiornamento che uscirà per lo Steam Next Fest di ottobre va nei playtest della community, da venerdì 7 agosto alle 21 UTC con una game night. Aperto a tutti tramite Discord.",
      "La mise à jour prévue pour le Steam Next Fest d'octobre part en playtests communautaires, dès le vendredi 7 août à 21 h UTC avec une game night. Ouvert à tous via Discord.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1840310314338383",
    source: "steam",
  },
  {
    slug: "demo-stats-ama",
    image: "/media/news-card-party.webp",
    date: "2026-07-21",
    title: n("First demo numbers: 1,000+ players, 13,000+ matches, 1h51m median", "Primi numeri della demo: oltre 1.000 giocatori, 13.000 partite, mediana 1h51m", "Premiers chiffres de la démo : 1 000+ joueurs, 13 000+ parties, médiane 1 h 51"),
    summary: n(
      "Six days after launch the team shares the demo stats and lines up an AMA with CEO Tim Jooste and head of game design Kevin Lambert (22 July), the first demo tournament (24 July) and a booth at Card Party in Fort Lauderdale (24–26 July).",
      "Sei giorni dopo il lancio il team condivide i numeri della demo e annuncia un AMA con il CEO Tim Jooste e il capo del game design Kevin Lambert (22 luglio), il primo torneo della demo (24 luglio) e uno stand al Card Party di Fort Lauderdale (24–26 luglio).",
      "Six jours après le lancement, l'équipe partage les chiffres de la démo et annonce un AMA avec le CEO Tim Jooste et le responsable du game design Kevin Lambert (22 juillet), le premier tournoi de la démo (24 juillet) et un stand au Card Party de Fort Lauderdale (24–26 juillet).",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
    source: "steam",
  },
  {
    slug: "demo-live",
    image: "/media/news-demo-live.webp",
    date: "2026-07-16",
    title: n("The Origins TCG demo is live on Steam", "La demo di Origins TCG è disponibile su Steam", "La démo d'Origins TCG est disponible sur Steam"),
    summary: n(
      "Free demo with exclusive collectibles that will not be available later and will be tradeable on the Steam marketplace once the full game launches. Launch party on Discord the same day.",
      "Demo gratuita con collezionabili esclusivi che non saranno più disponibili in seguito e saranno scambiabili sul marketplace Steam al lancio del gioco completo. Festa di lancio su Discord lo stesso giorno.",
      "Démo gratuite avec des objets de collection exclusifs, indisponibles plus tard et échangeables sur le marketplace Steam au lancement du jeu complet. Soirée de lancement sur Discord le jour même.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1838407329257018",
    source: "steam",
  },
  {
    slug: "creator-program",
    image: "/media/keyart-robin-hood.webp",
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
    image: "/media/news-community-open.webp",
    date: "2026-06-03",
    title: n("Official Discord opens to everyone", "Il Discord ufficiale apre a tutti", "Le Discord officiel s'ouvre à tous"),
    summary: n(
      "The server that hosted the early alpha testers opens up, with a demo announced as coming soon and a first look at the collectibles.",
      "Il server che ospitava i tester dell'alpha si apre a tutti, con una demo annunciata in arrivo e un primo sguardo ai collezionabili.",
      "Le serveur qui accueillait les testeurs de l'alpha s'ouvre à tous, avec une démo annoncée et un premier aperçu des objets de collection.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1834602721185275",
    source: "steam",
  },
  {
    slug: "metal-cards-tease",
    image: "/media/ls-real-collecting.webp",
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
    image: "/media/news-steam-page.webp",
    date: "2026-05-06",
    title: n("Steam page live: wishlist open, demo on the way", "Pagina Steam online: wishlist aperta, demo in arrivo", "Page Steam en ligne : wishlist ouverte, démo en route"),
    summary: n(
      "First Steam post from the team: a trading card game built around fast tactical matches and a collectible system modelled on physical TCGs.",
      "Primo post su Steam del team: un gioco di carte costruito su partite tattiche veloci e un sistema da collezione modellato sui TCG fisici.",
      "Premier message Steam de l'équipe : un jeu de cartes construit autour de parties tactiques rapides et d'un système de collection inspiré des TCG physiques.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1832065502808213",
    source: "steam",
  },
];

export const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));

export function getNews(slug: string): NewsItem | undefined {
  return news.find((item) => item.slug === slug);
}

/** Percorso della pagina dell'articolo, senza prefisso lingua (lo aggiunge `href`). */
export function newsPath(item: NewsItem): string {
  return `/news/${item.slug}`;
}

/** Minuti di lettura dell'articolo (riassunto + testo), a 200 parole al minuto, mai meno di uno. */
export function newsReadTime(item: NewsItem, locale: Locale): number {
  const words = `${item.summary[locale]} ${item.body?.[locale] ?? ""}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
