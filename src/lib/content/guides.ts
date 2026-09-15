import type { Locale } from "../i18n";

export type GuideCategory = "game" | "decks" | "rank" | "archetypes" | "interviews" | "events" | "economy";

export type Guide = {
  slug: string;
  category: GuideCategory;
  /** collegamenti incrociati: slug di mazzi e carte trattati nella guida */
  tags?: { decks?: string[]; cards?: string[] };
  title: string;
  excerpt: string;
  readTime: number;
  updated: string;
  image?: string;
  /** domande e risposte in fondo alla guida (anche come dati strutturati FAQPage) */
  faq?: { q: string; a: string }[];
  body: string; // markdown
};

export const guideSlugs = ["steam-next-fest-2026", "is-origins-tcg-pay-to-win", "play-the-demo", "origins-tcg-explained", "roadmap-and-dates", "collector-economy"] as const;
export type GuideSlug = (typeof guideSlugs)[number];

const en: Record<GuideSlug, Guide> = {
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    category: "game",
    tags: { cards: ["mulan", "queen-of-hearts"], decks: ["swarm", "evil", "discard"] },
    title: "Origins TCG explained in five minutes",
    excerpt: "What the game is, how a match works, what free-to-compete means and how to play the demo today.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/capsule-main.webp",
    body: `
## What it is

Origins TCG is a digital trading card game by **Koin Games**, a studio based in Tampa, Florida, founded in 2021 by industry veterans. Its cast is made of public-domain legends reimagined in one original world: Robin Hood, Mulan, the Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula and many more.

The pitch is **free-to-compete**: every card you need to play competitively is earned by playing. Money only buys collectible versions of cards, which can be graded, traded and sold. The developers call it "zero pay-to-win".

## How a match works

- **Three lanes.** You and your opponent fight on three boards at once. Each lane has its own location, drawn from a pool of more than a hundred that rotate and change the rules of that board.
- **Simultaneous turns.** Both players act at the same time, so there is no waiting. A match lasts about seven minutes.
- **Cards attack.** Unlike pure "lane counting" games, units fight each other: Power is what you hit for, Health is what you can take.
- **Keywords.** The playtest uses On Reveal (triggers when the card is played), On Death, First Strike, Double Attack and Deathtouch.
- **One Legendary leads the deck.** In the current playtest decks are 25 cards and every deck is built around a Legendary card with a signature ability: Mulan repeats your allies' On Reveal abilities, the Queen of Hearts repeats their On Death abilities.

## Modes

The demo has a tutorial, missions against bosses with their own AI, and online play. Patch 0.6.1 added a **ranked ladder** with divisions up to Grandmaster, a world leaderboard and Victory Points.

## How to play today

1. Install the free demo from the [Steam page](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Demo players earn exclusive collectibles that will be tradeable when the full game launches.
2. Join the [official Discord](https://discord.gg/originstcg) for playtests of the bigger "Demo 2.0" build, tournaments and AMAs with the team.
3. The game is in English, French, Italian and German. Mobile is planned for 2027.

## Where the game is going

Early access on Steam is listed for Q4 2026, with a much larger demo shown at Steam Next Fest (19–26 October 2026) and the studio's biggest tournament so far running 20–25 October. See the [roadmap](/en/guides/roadmap-and-dates).
`,
  },
  "roadmap-and-dates": {
    slug: "roadmap-and-dates",
    category: "events",
    title: "Roadmap and dates: from the demo to early access",
    excerpt: "Every confirmed date, from the first Steam post to the Next Fest tournament, plus what is announced for 2027.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/hero-1200.webp",
    body: `
## Before the demo

- **August 2025.** Koin Games and Immutable announce "Project O", a competitive TCG built for mobile with true ownership of cards.
- **November 2025.** Soft launch on the App Store in selected regions (version 0.1.0).
- **Early 2026.** The studio moves card trading to the Steam marketplace and drops the stand-alone on-chain model.
- **March 2026.** The CEO is filmed with physical metal cards. No product or date has been announced.

## 2026, month by month

| Date | What happened |
| --- | --- |
| 6 May | Steam page goes live, wishlist opens |
| 3 June | Official Discord opens to everyone |
| 15–16 July | Free demo on Steam with exclusive collectibles |
| 21 July | First numbers: 1,000+ players, 13,000+ matches, 1h51m median play time |
| 22 July | AMA with CEO Tim Jooste and head of design Kevin Lambert |
| 24 July | First demo tournament |
| 24–26 July | Origins at Card Party, Fort Lauderdale |
| 7 August | First "Demo 2.0" playtest: 5 new decks, 70+ cards, deckbuilding |
| 14 August | Patch 0.6.1: ranked ladder |
| 19 August | Creator Program AMA |
| 21 August | Patch 0.6.2: 23 cards rebalanced |
| 27 August | Patch 0.6.3 |
| 28 August | Big Bob's Playtest Battle, first Conquest tournament, 130+ registered |
| 9 September | Next Fest tournament announced |
| 10 September | Kickstarter AMA: final sale of the Alpha packs |

## What comes next

- **19–26 October 2026.** Steam Next Fest with the Demo 2.0 update: deckbuilding and many more cards for everyone.
- **20–25 October 2026.** The Steam Next Fest tournament: regional qualifiers on the 20th, 21st and 22nd, then playoffs and finals. A $10,000 prize pool and an exclusive 1/1 promo card.
- **Q4 2026.** Early access on Steam, according to the store page.
- **2027.** Mobile version and pack opening on phone. In the AMAs the team has described a full launch with the complete roster of Legendary cards, including King Arthur, Dracula, Winnie the Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein and Sherlock Holmes.

Dates come from the official Steam posts and the studio's Discord. We update this page when they change.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    category: "economy",
    title: "Two ways to collect: how the Origins economy works",
    excerpt: "Competitive cards are free. Collector cards are limited, graded and tradeable on Steam. Here is what is confirmed and what is not.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ls-two-ways.webp",
    body: `
## The split

Origins keeps two things apart that most card games mix:

1. **Playing.** Every competitive card is earned in game. Nothing you buy makes your deck stronger.
2. **Collecting.** Limited-edition versions of cards exist in numbered print runs, come **digitally graded** and can be bought, sold and traded with other players.

The studio's own loading screens call it "real collecting in digital" and "two ways to collect".

## What is confirmed

- **Graded cards.** Collector versions carry a grade; at Card Party in July the team gave a Slab to anyone pulling a **10/10 Alternate Art**. Lower grades and different series exist and are worth different amounts.
- **God packs.** Rare packs in which every card is Legendary or better.
- **Alpha Edition.** The first collector edition, "Myths & Legends: Alpha Edition", is sold in pre-order only: booster packs of five cards, boxes of 24 packs and cases of six boxes, with ten rarity levels from common to storybook. When the print run is finished no more Alpha boxes are produced. The final sale was announced in the Kickstarter AMA of 10 September 2026.
- **Trading on Steam.** Cards and sealed products will be traded on the Steam Community Market and connected marketplaces once the full game launches. Demo collectibles earned today become tradeable at that point.
- **Mobile later.** Pack opening on phone is planned for 2027.

## What is not confirmed yet

- Prices in euros for packs and boxes outside the Alpha pre-order.
- Marketplace fees beyond Steam's standard ones.
- Whether physical metal cards, shown by the CEO in March 2026, will ever be sold.

## Why it matters for the meta

Because collector cards are cosmetic, a tier list only has to care about the card itself, never about the version. OriginsMeta will track Steam Market prices from the first day items are listed, so that collecting has the same data as playing.
`,
  },
  "steam-next-fest-2026": {
    slug: "steam-next-fest-2026",
    category: "events",
    tags: { decks: ["swarm", "evil", "discard"] },
    title: "Origins TCG at Steam Next Fest 2026: Demo 2.0, dates and the tournament",
    excerpt: "Everything confirmed about Origins TCG at Steam Next Fest (19–26 October 2026): the Demo 2.0 update, the 20–25 October tournament with qualifiers, playoffs and finals, prizes, how to sign up and how to prepare.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/hero-1200.webp",
    faq: [
      { q: "When is Steam Next Fest October 2026?", a: "From Monday 19 October at 10:00 Pacific time (19:00 in Italy) to Monday 26 October 2026. Origins TCG takes part with the Demo 2.0 build." },
      { q: "When is the Origins TCG tournament?", a: "From 20 to 25 October 2026: three qualifiers on the 20th, 21st and 22nd (one per major region), then playoffs and finals." },
      { q: "Can I join a qualifier from Europe?", a: "Yes. Koin Games says you can join any of the qualifiers no matter where you live, but asks you to sign up only for the ones you can actually attend." },
      { q: "Does it cost anything?", a: "No. The demo is free on Steam and the tournament sign-up is on the official Discord. Origins TCG is free-to-compete: every competitive card is earned by playing." },
      { q: "What is the Conquest format?", a: "You submit several decks before the tournament, each led by a different Legendary and with at least nine different cards between any two decks, and you ban one of your opponent's decks before the match. Koin Games tested it at Big Bob's Playtest Battle on 28 August." },
    ],
    body: `
## The two dates to remember

- **Steam Next Fest, October 2026 edition: 19–26 October.** Valve's festival of playable demos runs from Monday 19 October at 10:00 Pacific time (19:00 in Italy) to Monday 26 October. Origins TCG is in it with the big **Demo 2.0** update.
- **Origins TCG tournament: 20–25 October.** Koin Games calls it "our biggest tournament ever": a multi-day event that goes Qualification → Playoffs → Finals, entirely online and in-game.

## What Demo 2.0 brings

The build was tested in three closed playtests in August (patches 0.6.1, 0.6.2 and 0.6.3, all tracked in our [MetaShift](/en/tier-list)). Koin Games announced three things for it:

- **five new decks**, on top of the ones in the July demo;
- **more than 70 new cards**;
- **deckbuilding**: for the first time everyone can build their own 25-card deck (one Legendary plus twelve cards, each played as two copies) instead of choosing a preset list.

The playtests also introduced a ranked ladder with divisions up to Grandmaster and a world leaderboard. We will publish every change on the day it lands.

## The tournament, step by step

1. **Qualifiers, 20–22 October.** Three of them, one per major region, on the 20th, 21st and 22nd. In Koin's words, "you can join ANY of the qualifiers, no matter where you live": pick the one whose time suits you, and sign up only for the ones you will really play.
2. **Playoffs and finals, up to 25 October.** The best players from the qualifiers meet in the playoff stage; content creators get wildcard invites straight into the playoffs (ask on Discord).
3. **Format.** The Steam announcement does not state it. At Big Bob's Playtest Battle on 28 August Koin trialed **Conquest**: best-of-3, single elimination, several decks with a different Legendary in each, at least nine cards of difference between decks, one ban. Expect something close to that and read the official rules when they are published.
4. **Prizes.** An exclusive 1/1 tournament promo card, digital packs, booster boxes and cases, and cash prizes. In the community the tournament goes by the name Crimson Cup with a 10,000-dollar pool; we will confirm the figures against the official rulebook.

Sign-ups are on the [official Discord](https://discord.gg/originstcg).

## How to prepare in five moves

1. [Install the free demo on Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) and play the missions: they teach the three lanes and the simultaneous turns.
2. Read [Origins TCG explained in five minutes](/en/guides/origins-tcg-explained) and the [card database](/en/cards): the current stats are those of patch 0.6.3.
3. Build your three Conquest decks in our [deck builder](/en/deck-builder): it checks the different-Legendary rule and counts the cards that differ between decks.
4. Study the [playtest decks](/en/decks) and the lists the community publishes; publish yours with a guide so others can rate it.
5. Follow the [news](/en/news): every announcement is summarized within a day, with a link to the source.

## How OriginsMeta covers the week

A news item every day during the festival, tournament decks published with their composition charts the same day, and the first OriginsMeta tier list on 27 October, built on the tournament results and the top of the ladder. Sources: the official Steam posts of 4 August, 25 August and 9 September 2026, and the Steam Next Fest schedule.
`,
  },
  "is-origins-tcg-pay-to-win": {
    slug: "is-origins-tcg-pay-to-win",
    category: "economy",
    title: "Is Origins TCG pay-to-win? Free-to-compete, explained",
    excerpt: "Koin Games sells Origins TCG as the first free-to-compete card game with zero pay-to-win. What that promise means, what money actually buys, and the honest caveats.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ls-zero-pay-to-win.webp",
    faq: [
      { q: "Is Origins TCG free?", a: "Yes. The demo is free on Steam since 15 July 2026 and the full game is presented as free-to-compete: every card you need to compete is earned by playing." },
      { q: "Do I have to buy packs to win?", a: "No. According to the official Steam page you compete on skill alone, with zero pay-to-win. Paid packs contain limited, digitally graded collector versions of cards, not extra power." },
      { q: "What do you pay for, then?", a: "Collector products: limited-edition, numbered and graded versions of cards, sold in packs, boxes and cases, which can be bought, sold and traded with other players." },
      { q: "Can I sell my cards?", a: "Koin Games says cards and sealed products will be tradeable on the Steam Community Market and connected marketplaces once the full game launches. On Steam, proceeds go to your Steam Wallet." },
      { q: "Is there a battle pass or paid progression boost?", a: "Nothing of the kind has been announced as of September 2026. We will update this page if that changes." },
    ],
    body: `
## The short answer

No, by design. On its Steam page Koin Games describes Origins TCG as "the first free-to-compete TCG" where you "compete on skill alone (zero pay-to-win) for limited digitally graded cards you can buy, sell, and trade". One of the official loading screens says it in two words: **zero pay-to-win**.

That is the promise. This page explains what it means in practice and where the honest doubts remain.

## What "free-to-compete" means

Origins keeps two things apart that most digital card games mix:

1. **Competing.** Every card you need to build a competitive deck is earned in game. The playtest decks and the [card database](/en/cards) contain nothing you can buy your way into.
2. **Collecting.** Limited-edition versions of the same cards exist in numbered print runs, come **digitally graded** and can be bought, sold and traded. They are cosmetic: a graded Mulan plays exactly like the Mulan you earned.

So the pack you pay for is a collector product, not a power product. The first one, the "Myths & Legends: Alpha Edition", is sold in pre-order only, in five-card boosters, boxes of 24 packs and cases of six boxes, with ten rarity levels; see [how the Origins economy works](/en/guides/collector-economy).

## How it compares

In Hearthstone or MTG Arena the packs you buy contain the cards you play with, so spending shortens the road to a full collection. In Origins the road to a competitive deck is playing; spending buys the collector shelf next to it. That is the difference the "zero pay-to-win" claim rests on.

## The honest caveats

- **Time is still a cost.** Free cards are earned by playing; how many matches it takes to complete a competitive deck is not published yet. When the Demo 2.0 deckbuilding opens at Steam Next Fest (19–26 October) we will measure it and publish the numbers.
- **Details still to come.** Prices outside the Alpha pre-order, marketplace fees beyond Steam's standard ones and any progression boosts are not announced. Nothing suggests a battle pass, but nothing rules one out either.
- **Marketplace value is not cash.** Selling on the Steam Community Market pays into your Steam Wallet. Whether connected marketplaces will allow real cash-out is not confirmed.

## Why it matters for the meta

Because collector versions are cosmetic, a tier list only has to judge the card, never the edition, and a deck published on OriginsMeta by a free player is as strong as anyone else's. We will keep this page updated with every official statement; sources: the Origins TCG Steam page, the official loading screens and the Koin Games AMAs of July and August 2026.
`,
  },
  "play-the-demo": {
    slug: "play-the-demo",
    category: "game",
    tags: { decks: ["swarm", "evil", "discard"] },
    title: "How to download and play the Origins TCG demo on Steam",
    excerpt: "The free demo in five steps: requirements, download, language, first matches, what demo players unlock, and what changes with Demo 2.0 at Steam Next Fest.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/capsule-main.webp",
    faq: [
      { q: "Is the Origins TCG demo free?", a: "Yes. It has been free on Steam since 15 July 2026, for Windows and macOS." },
      { q: "Is the demo in Italian?", a: "Yes. Interface and full audio are available in English, French, Italian and German; subtitles are in English." },
      { q: "What do I need to run it?", a: "At minimum Windows 10 64-bit with an Intel i3-6100 or AMD FX-6300, 8 GB of RAM, a GTX 750 Ti or R9 270X and 2 GB of space; on Mac, macOS 10.14 or later with an Apple M1 or a dual-core Intel i5 and a Metal-capable GPU." },
      { q: "Does the demo give anything for the full game?", a: "Koin Games announced that demo players earn exclusive collectibles that become tradeable when the full game launches." },
      { q: "When does the bigger demo arrive?", a: "Demo 2.0, with five new decks, over 70 new cards and deckbuilding, is expected at Steam Next Fest, 19–26 October 2026." },
    ],
    body: `
## What you get

The Origins TCG demo has been on Steam since **15 July 2026**, free, for Windows and macOS. At the time of writing it sits at "Very Positive" with 97% of 162 reviews. Matches take about seven minutes: both players move at once across three locations, drawn from a pool of more than a hundred that rotate and change the rules of the board. The demo includes the tutorial, missions against bosses with their own AI and online play.

Languages: **English, French, Italian and German**, both interface and full audio.

## Requirements

| | Minimum | Recommended |
| --- | --- | --- |
| Windows | Windows 10 64-bit, Intel i3-6100 or AMD FX-6300, 8 GB RAM, GTX 750 Ti or R9 270X | Windows 11 64-bit, Intel i5-8400, 16 GB RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 or Intel i5 dual-core 2.5 GHz, Metal-capable GPU | macOS 12 or later, Apple M1 Pro, 16 GB RAM |
| Space | 2 GB | 2 GB |

## Five steps

1. **Install Steam** and sign in (a free account is enough).
2. **Open the [Origins TCG Demo page](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** and press "Download Origins TCG Demo"; or search "Origins TCG" inside Steam and pick the Demo. Installing takes a couple of minutes.
3. **Pick your language** if Steam did not: right-click the game in your library, Properties, Language. Italian has full audio.
4. **Play the tutorial**, then the missions: they teach the three lanes, the simultaneous turns and the keywords (On Reveal, On Death, First Strike, Double Attack, Deathtouch). Our [five-minute guide](/en/guides/origins-tcg-explained) covers the same ground in text.
5. **Go online** and try the preset decks. Study them in the [deck database](/en/decks) and check the current card stats in the [card database](/en/cards) (patch 0.6.3).

## What demo players unlock

In the July launch post Koin Games said that demo players earn **exclusive collectibles** that will become tradeable when the full game launches. Wishlist the [main game](https://store.steampowered.com/app/4429430/Origins_TCG/) on Steam: early access is listed for Q4 2026.

## What changes with Demo 2.0

At Steam Next Fest (19–26 October 2026) the demo gets its big update, tested in August's closed playtests: five new decks, more than 70 new cards and, above all, deckbuilding. Everything about the dates, the tournament and how to prepare is in our [Steam Next Fest 2026 page](/en/guides/steam-next-fest-2026). Playtests of the bigger builds are announced on the [official Discord](https://discord.gg/originstcg), and so far anyone who wanted to join could.

Sources: the Origins TCG and Origins TCG Demo pages on Steam and the official Steam posts of 16 July and 4 August 2026.
`,
  },
};

const it: Record<GuideSlug, Guide> = {
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    category: "game",
    tags: { cards: ["mulan", "queen-of-hearts"], decks: ["swarm", "evil", "discard"] },
    title: "Origins TCG spiegato in cinque minuti",
    excerpt: "Cos'è il gioco, come funziona una partita, cosa vuol dire free-to-compete e come provare la demo oggi.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/capsule-main.webp",
    body: `
## Cos'è

Origins TCG è un gioco di carte collezionabili digitale di **Koin Games**, studio di Tampa (Florida) fondato nel 2021 da veterani del settore. I personaggi sono leggende di pubblico dominio reinterpretate in un unico mondo originale: Robin Hood, Mulan, la Regina di Cuori, Winnie-the-Pooh, Re Artù, Dracula e molti altri.

La promessa è il **free-to-compete**: ogni carta che serve per giocare a livello competitivo si guadagna giocando. I soldi comprano solo versioni da collezione delle carte, che si possono far valutare, scambiare e vendere. Gli sviluppatori lo chiamano "zero pay-to-win".

## Come funziona una partita

- **Tre corsie.** Tu e l'avversario combattete su tre tavoli contemporaneamente. Ogni corsia ha una location, pescata da un gruppo di più di cento che ruotano e cambiano le regole di quel tavolo.
- **Turni simultanei.** I due giocatori agiscono insieme, quindi non si aspetta mai. Una partita dura circa sette minuti.
- **Le carte combattono.** A differenza dei giochi che contano solo i punti sulle corsie, le unità si attaccano: la Potenza è quanto colpisci, la Salute quanto incassi.
- **Parole chiave.** Il playtest usa On Reveal (si attiva quando giochi la carta), On Death, First Strike, Double Attack e Deathtouch.
- **Una Leggendaria guida il mazzo.** Nel playtest attuale i mazzi sono da 25 carte e ognuno è costruito intorno a una Leggendaria con un'abilità caratteristica: Mulan ripete le abilità On Reveal dei tuoi alleati, la Regina di Cuori ripete le loro On Death.

## Modalità

La demo ha un tutorial, missioni contro boss con una propria IA e il gioco online. La patch 0.6.1 ha aggiunto la **ladder classificata** con divisioni fino a Grandmaster, una classifica mondiale e i Punti Vittoria.

## Come giocare oggi

1. Installa la demo gratuita dalla [pagina Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Chi gioca la demo guadagna collezionabili esclusivi che saranno scambiabili al lancio del gioco completo.
2. Entra nel [Discord ufficiale](https://discord.gg/originstcg) per i playtest della build "Demo 2.0", i tornei e gli AMA con il team.
3. Il gioco è in inglese, francese, italiano e tedesco. Il mobile è previsto per il 2027.

## Dove sta andando

L'early access su Steam è indicato per il quarto trimestre 2026, con una demo molto più grande allo Steam Next Fest (19–26 ottobre 2026) e il torneo più grande dello studio dal 20 al 25 ottobre. Vedi la [roadmap](/it/guides/roadmap-and-dates).
`,
  },
  "roadmap-and-dates": {
    slug: "roadmap-and-dates",
    category: "events",
    title: "Roadmap e date: dalla demo all'early access",
    excerpt: "Tutte le date confermate, dal primo post su Steam al torneo del Next Fest, più ciò che è annunciato per il 2027.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/hero-1200.webp",
    body: `
## Prima della demo

- **Agosto 2025.** Koin Games e Immutable annunciano "Project O", un TCG competitivo pensato per mobile con vera proprietà delle carte.
- **Novembre 2025.** Soft launch sull'App Store in alcune regioni (versione 0.1.0).
- **Inizio 2026.** Lo studio sposta lo scambio delle carte sul marketplace Steam e abbandona il modello on-chain autonomo.
- **Marzo 2026.** Il CEO viene filmato con carte fisiche in metallo. Nessun prodotto né data annunciati.

## Il 2026 mese per mese

| Data | Cosa è successo |
| --- | --- |
| 6 maggio | Pagina Steam online, wishlist aperta |
| 3 giugno | Il Discord ufficiale apre a tutti |
| 15–16 luglio | Demo gratuita su Steam con collezionabili esclusivi |
| 21 luglio | Primi numeri: oltre 1.000 giocatori, 13.000 partite, mediana di gioco 1h51m |
| 22 luglio | AMA con il CEO Tim Jooste e il capo del design Kevin Lambert |
| 24 luglio | Primo torneo della demo |
| 24–26 luglio | Origins al Card Party di Fort Lauderdale |
| 7 agosto | Primo playtest "Demo 2.0": 5 nuovi mazzi, 70+ carte, deckbuilding |
| 14 agosto | Patch 0.6.1: ladder classificata |
| 19 agosto | AMA sul Creator Program |
| 21 agosto | Patch 0.6.2: 23 carte ribilanciate |
| 27 agosto | Patch 0.6.3 |
| 28 agosto | Big Bob's Playtest Battle, primo torneo Conquest, oltre 130 iscritti |
| 9 settembre | Annunciato il torneo del Next Fest |
| 10 settembre | AMA Kickstarter: vendita finale dei pacchetti Alpha |

## Cosa viene dopo

- **19–26 ottobre 2026.** Steam Next Fest con l'aggiornamento Demo 2.0: deckbuilding e molte più carte per tutti.
- **20–25 ottobre 2026.** Il torneo dello Steam Next Fest: qualificazioni regionali il 20, 21 e 22, poi playoff e finali. Montepremi di 10.000 $ e una carta promo 1/1 esclusiva.
- **Q4 2026.** Early access su Steam, secondo la pagina dello store.
- **2027.** Versione mobile e apertura dei pacchetti da telefono. Negli AMA il team ha descritto un lancio completo con tutte le Leggendarie, tra cui Re Artù, Dracula, Winnie the Pooh, Alice, Beowulf, Cenerentola, Sweeney Todd, Frankenstein e Sherlock Holmes.

Le date vengono dai post ufficiali su Steam e dal Discord dello studio. Aggiorniamo questa pagina quando cambiano.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    category: "economy",
    title: "Due modi di collezionare: come funziona l'economia di Origins",
    excerpt: "Le carte competitive sono gratis. Quelle da collezione sono limitate, valutate e scambiabili su Steam. Ecco cosa è confermato e cosa no.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ls-two-ways.webp",
    body: `
## La separazione

Origins tiene separate due cose che quasi tutti i giochi di carte mescolano:

1. **Giocare.** Ogni carta competitiva si guadagna in gioco. Niente di ciò che compri rende il mazzo più forte.
2. **Collezionare.** Le versioni in edizione limitata delle carte esistono in tirature numerate, arrivano **valutate digitalmente** e si possono comprare, vendere e scambiare con altri giocatori.

Le schermate di caricamento dello studio lo chiamano "real collecting in digital" e "two ways to collect".

## Cosa è confermato

- **Carte valutate.** Le versioni da collezione hanno un grado; al Card Party di luglio il team regalava uno Slab a chi pescava un'**Alternate Art 10/10**. Esistono gradi più bassi e serie diverse, con valori diversi.
- **God pack.** Pacchetti rari in cui ogni carta è Leggendaria o superiore.
- **Alpha Edition.** La prima edizione da collezione, "Myths & Legends: Alpha Edition", si vende solo in preordine: bustine da cinque carte, box da 24 bustine e case da sei box, con dieci livelli di rarità dal comune allo storybook. Finita la tiratura non si stampano altri box Alpha. La vendita finale è stata annunciata nell'AMA Kickstarter del 10 settembre 2026.
- **Scambio su Steam.** Carte e prodotti sigillati si scambieranno sullo Steam Community Market e sui marketplace collegati al lancio del gioco completo. I collezionabili della demo guadagnati oggi diventeranno scambiabili in quel momento.
- **Mobile dopo.** L'apertura dei pacchetti da telefono è prevista per il 2027.

## Cosa non è ancora confermato

- I prezzi in euro di bustine e box fuori dal preordine Alpha.
- Le commissioni del marketplace oltre a quelle standard di Steam.
- Se le carte fisiche in metallo, mostrate dal CEO a marzo 2026, saranno mai vendute.

## Perché conta per il meta

Siccome le carte da collezione sono cosmetiche, una tier list deve occuparsi solo della carta, mai della versione. OriginsMeta seguirà i prezzi dello Steam Market dal primo giorno in cui ci saranno oggetti in vendita, perché il collezionismo abbia gli stessi dati del gioco.
`,
  },
  "steam-next-fest-2026": {
    slug: "steam-next-fest-2026",
    category: "events",
    tags: { decks: ["swarm", "evil", "discard"] },
    title: "Origins TCG allo Steam Next Fest 2026: Demo 2.0, date e torneo",
    excerpt: "Tutto ciò che è confermato su Origins TCG allo Steam Next Fest (19–26 ottobre 2026): l'aggiornamento Demo 2.0, il torneo dal 20 al 25 ottobre con qualificazioni, playoff e finali, i premi, come iscriversi e come prepararsi.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/hero-1200.webp",
    faq: [
      { q: "Quando si svolge lo Steam Next Fest di ottobre 2026?", a: "Da lunedì 19 ottobre alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre 2026. Origins TCG partecipa con la build Demo 2.0." },
      { q: "Quando c'è il torneo di Origins TCG?", a: "Dal 20 al 25 ottobre 2026: tre qualificazioni il 20, 21 e 22 (una per macro-regione), poi playoff e finali." },
      { q: "Posso partecipare a una qualificazione dall'Italia?", a: "Sì. Koin Games dice che ci si può iscrivere a qualsiasi qualificazione a prescindere da dove si vive, ma chiede di iscriversi solo a quelle a cui si può davvero partecipare." },
      { q: "Costa qualcosa?", a: "No. La demo è gratuita su Steam e l'iscrizione al torneo si fa sul Discord ufficiale. Origins TCG è free-to-compete: ogni carta competitiva si guadagna giocando." },
      { q: "Cos'è il formato Conquest?", a: "Si registrano più mazzi prima del torneo, ognuno guidato da una Leggendaria diversa e con almeno nove carte di differenza tra due mazzi qualsiasi, e prima della partita si banna un mazzo dell'avversario. Koin Games lo ha provato a Big Bob's Playtest Battle il 28 agosto." },
    ],
    body: `
## Le due date da segnare

- **Steam Next Fest, edizione di ottobre 2026: 19–26 ottobre.** Il festival delle demo giocabili di Valve va da lunedì 19 ottobre alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre. Origins TCG c'è con il grande aggiornamento **Demo 2.0**.
- **Torneo di Origins TCG: 20–25 ottobre.** Koin Games lo chiama "il nostro torneo più grande di sempre": un evento su più giorni, Qualificazioni → Playoff → Finali, tutto online e in gioco.

## Cosa porta la Demo 2.0

La build è stata provata in tre playtest chiusi ad agosto (patch 0.6.1, 0.6.2 e 0.6.3, tutte tracciate nel nostro [MetaShift](/it/tier-list)). Koin Games ha annunciato tre cose:

- **cinque nuovi mazzi**, oltre a quelli della demo di luglio;
- **più di 70 nuove carte**;
- **il deckbuilding**: per la prima volta tutti possono costruire il proprio mazzo da 25 carte (una Leggendaria più dodici carte, ognuna giocata in due copie) invece di scegliere una lista preimpostata.

I playtest hanno introdotto anche una classificata con divisioni fino a Grandmaster e una classifica mondiale. Pubblicheremo ogni cambiamento il giorno stesso in cui arriva.

## Il torneo, passo per passo

1. **Qualificazioni, 20–22 ottobre.** Tre, una per macro-regione, il 20, 21 e 22. Nelle parole di Koin, "puoi partecipare a QUALSIASI qualificazione, ovunque tu viva": scegli quella con l'orario che ti conviene e iscriviti solo a quelle che giocherai davvero.
2. **Playoff e finali, fino al 25 ottobre.** I migliori delle qualificazioni si incontrano nei playoff; i content creator hanno inviti wildcard direttamente ai playoff (basta chiedere su Discord).
3. **Formato.** L'annuncio su Steam non lo indica. A Big Bob's Playtest Battle, il 28 agosto, Koin ha provato il **Conquest**: best-of-3, eliminazione diretta, più mazzi con una Leggendaria diversa in ciascuno, almeno nove carte di differenza tra i mazzi, un ban. Aspettati qualcosa di simile e leggi il regolamento ufficiale quando uscirà.
4. **Premi.** Una carta promo 1/1 esclusiva del torneo, pacchetti digitali, booster box e case, premi in denaro. Nella community il torneo circola con il nome Crimson Cup e un montepremi da 10.000 dollari: confermeremo le cifre sul regolamento ufficiale.

Le iscrizioni sono sul [Discord ufficiale](https://discord.gg/originstcg).

## Come prepararsi in cinque mosse

1. [Installa la demo gratuita su Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) e gioca le missioni: insegnano le tre corsie e i turni simultanei.
2. Leggi [Origins TCG spiegato in cinque minuti](/it/guides/origins-tcg-explained) e il [database carte](/it/cards): le statistiche attuali sono quelle della patch 0.6.3.
3. Costruisci i tuoi tre mazzi Conquest nel nostro [deck builder](/it/deck-builder): controlla la regola delle Leggendarie diverse e conta le carte che cambiano tra un mazzo e l'altro.
4. Studia i [mazzi del playtest](/it/decks) e le liste pubblicate dalla community; pubblica la tua con una guida, così gli altri possono votarla.
5. Segui le [news](/it/news): ogni annuncio è riassunto entro un giorno, con il link alla fonte.

## Come OriginsMeta seguirà la settimana

Una news al giorno durante il festival, i mazzi del torneo pubblicati il giorno stesso con i grafici di composizione, e la prima tier list di OriginsMeta il 27 ottobre, costruita sui risultati del torneo e sulla cima della classificata. Fonti: i post ufficiali su Steam del 4 agosto, 25 agosto e 9 settembre 2026 e il calendario dello Steam Next Fest.
`,
  },
  "is-origins-tcg-pay-to-win": {
    slug: "is-origins-tcg-pay-to-win",
    category: "economy",
    title: "Origins TCG è pay to win? Il free-to-compete spiegato",
    excerpt: "Koin Games presenta Origins TCG come il primo gioco di carte free-to-compete, a zero pay to win. Cosa significa quella promessa, cosa compra davvero il denaro e i dubbi onesti che restano.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ls-zero-pay-to-win.webp",
    faq: [
      { q: "Origins TCG è gratis?", a: "Sì. La demo è gratuita su Steam dal 15 luglio 2026 e il gioco completo è presentato come free-to-compete: ogni carta che serve per competere si guadagna giocando." },
      { q: "Devo comprare pacchetti per vincere?", a: "No. Secondo la pagina Steam ufficiale si compete solo con l'abilità, a zero pay to win. I pacchetti a pagamento contengono versioni da collezione limitate e con valutazione digitale delle carte, non potenza in più." },
      { q: "Allora cosa si paga?", a: "I prodotti da collezione: versioni in edizione limitata, numerate e valutate delle carte, vendute in pacchetti, box e case, che si possono comprare, vendere e scambiare con altri giocatori." },
      { q: "Posso vendere le mie carte?", a: "Koin Games dice che carte e prodotti sigillati si potranno scambiare sul Mercato della Comunità di Steam e sui marketplace collegati quando uscirà il gioco completo. Su Steam il ricavato finisce nel Portafoglio Steam." },
      { q: "C'è un battle pass o una spinta a pagamento alla progressione?", a: "A settembre 2026 non è stato annunciato niente del genere. Aggiorneremo questa pagina se cambia." },
    ],
    body: `
## La risposta breve

No, per scelta di progetto. Sulla pagina Steam Koin Games descrive Origins TCG come "il primo TCG free-to-compete", dove si compete "solo con l'abilità (zero pay-to-win) per carte limitate con valutazione digitale che puoi comprare, vendere e scambiare". Una delle schermate di caricamento ufficiali lo dice in tre parole: **zero pay to win**.

Questa è la promessa. Qui spieghiamo cosa vuol dire in pratica e dove restano i dubbi onesti.

## Cosa significa "free-to-compete"

Origins tiene separate due cose che quasi tutti i giochi di carte digitali mescolano:

1. **Competere.** Ogni carta che serve per costruire un mazzo competitivo si guadagna in gioco. I mazzi del playtest e il [database carte](/it/cards) non contengono nulla che si possa comprare.
2. **Collezionare.** Delle stesse carte esistono versioni in edizione limitata, in tirature numerate, con **valutazione digitale**, che si possono comprare, vendere e scambiare. Sono cosmetiche: una Mulan valutata gioca esattamente come la Mulan che hai guadagnato.

Il pacchetto che paghi, quindi, è un prodotto da collezione, non un prodotto di potenza. Il primo, "Myths & Legends: Alpha Edition", si vende solo in prevendita, in buste da cinque carte, box da 24 buste e case da sei box, con dieci livelli di rarità; vedi [come funziona l'economia di Origins](/it/guides/collector-economy).

## Il confronto con gli altri

In Hearthstone o MTG Arena i pacchetti che compri contengono le carte con cui giochi, quindi spendere accorcia la strada verso la collezione completa. In Origins la strada verso un mazzo competitivo è giocare; spendere compra la vetrina da collezione accanto. È su questa differenza che poggia il "zero pay to win".

## I dubbi onesti

- **Il tempo resta un costo.** Le carte gratuite si guadagnano giocando; quante partite servano per completare un mazzo competitivo non è ancora stato pubblicato. Quando allo Steam Next Fest (19–26 ottobre) si aprirà il deckbuilding della Demo 2.0 lo misureremo e pubblicheremo i numeri.
- **Dettagli ancora da annunciare.** Prezzi fuori dalla prevendita Alpha, commissioni del marketplace oltre a quelle standard di Steam ed eventuali spinte alla progressione non sono stati comunicati. Niente fa pensare a un battle pass, ma niente lo esclude.
- **Il valore di mercato non è contante.** Vendere sul Mercato della Comunità di Steam versa il ricavato nel Portafoglio Steam. Se i marketplace collegati permetteranno di incassare in denaro vero non è confermato.

## Perché conta per il meta

Siccome le versioni da collezione sono cosmetiche, una tier list deve giudicare solo la carta, mai l'edizione, e un mazzo pubblicato su OriginsMeta da un giocatore che non ha speso nulla vale quanto quello di chiunque altro. Terremo aggiornata questa pagina a ogni dichiarazione ufficiale; fonti: la pagina Steam di Origins TCG, le schermate di caricamento ufficiali e gli AMA di Koin Games di luglio e agosto 2026.
`,
  },
  "play-the-demo": {
    slug: "play-the-demo",
    category: "game",
    tags: { decks: ["swarm", "evil", "discard"] },
    title: "Come scaricare e provare la demo di Origins TCG su Steam",
    excerpt: "La demo gratuita in cinque passi: requisiti, download, lingua italiana, prime partite, cosa sbloccano i giocatori della demo e cosa cambia con la Demo 2.0 allo Steam Next Fest.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/capsule-main.webp",
    faq: [
      { q: "La demo di Origins TCG è gratuita?", a: "Sì. È gratuita su Steam dal 15 luglio 2026, per Windows e macOS." },
      { q: "La demo è in italiano?", a: "Sì. Interfaccia e audio completo sono disponibili in inglese, francese, italiano e tedesco; i sottotitoli sono in inglese." },
      { q: "Cosa serve per farla girare?", a: "Al minimo Windows 10 a 64 bit con un Intel i3-6100 o AMD FX-6300, 8 GB di RAM, una GTX 750 Ti o R9 270X e 2 GB di spazio; su Mac, macOS 10.14 o successivo con un Apple M1 o un Intel i5 dual-core e una GPU compatibile Metal." },
      { q: "La demo dà qualcosa per il gioco completo?", a: "Koin Games ha annunciato che i giocatori della demo guadagnano collezionabili esclusivi che diventeranno scambiabili all'uscita del gioco completo." },
      { q: "Quando arriva la demo più grande?", a: "La Demo 2.0, con cinque nuovi mazzi, oltre 70 nuove carte e il deckbuilding, è attesa allo Steam Next Fest, dal 19 al 26 ottobre 2026." },
    ],
    body: `
## Cosa trovi

La demo di Origins TCG è su Steam dal **15 luglio 2026**, gratuita, per Windows e macOS. Mentre scriviamo è "Molto positiva" con il 97% di 162 recensioni. Una partita dura circa sette minuti: i due giocatori muovono insieme su tre luoghi, pescati da un mazzo di più di cento che ruotano e cambiano le regole del tavolo. La demo comprende il tutorial, le missioni contro boss con una IA propria e il gioco online.

Lingue: **inglese, francese, italiano e tedesco**, sia interfaccia sia audio completo.

## Requisiti

| | Minimi | Consigliati |
| --- | --- | --- |
| Windows | Windows 10 64 bit, Intel i3-6100 o AMD FX-6300, 8 GB di RAM, GTX 750 Ti o R9 270X | Windows 11 64 bit, Intel i5-8400, 16 GB di RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 o Intel i5 dual-core 2,5 GHz, GPU compatibile Metal | macOS 12 o successivo, Apple M1 Pro, 16 GB di RAM |
| Spazio | 2 GB | 2 GB |

## Cinque passi

1. **Installa Steam** ed entra con un account (quello gratuito basta).
2. **Apri la [pagina della demo](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** e premi "Download Origins TCG Demo"; oppure cerca "Origins TCG" dentro Steam e scegli la Demo. L'installazione dura un paio di minuti.
3. **Scegli la lingua** se Steam non l'ha fatto: tasto destro sul gioco nella libreria, Proprietà, Lingua. L'italiano ha l'audio completo.
4. **Gioca il tutorial** e poi le missioni: insegnano le tre corsie, i turni simultanei e le parole chiave (On Reveal, On Death, First Strike, Double Attack, Deathtouch). La nostra [guida in cinque minuti](/it/guides/origins-tcg-explained) copre le stesse cose per iscritto.
5. **Vai online** e prova i mazzi preimpostati. Studiali nel [database mazzi](/it/decks) e controlla le statistiche attuali delle carte nel [database carte](/it/cards) (patch 0.6.3).

## Cosa sbloccano i giocatori della demo

Nel post di lancio di luglio Koin Games ha detto che chi gioca la demo guadagna **collezionabili esclusivi** che diventeranno scambiabili all'uscita del gioco completo. Metti il [gioco principale](https://store.steampowered.com/app/4429430/Origins_TCG/) nella lista dei desideri su Steam: l'early access è indicato per il quarto trimestre 2026.

## Cosa cambia con la Demo 2.0

Allo Steam Next Fest (19–26 ottobre 2026) la demo riceve il grande aggiornamento provato nei playtest chiusi di agosto: cinque nuovi mazzi, più di 70 nuove carte e, soprattutto, il deckbuilding. Date, torneo e come prepararsi sono nella nostra [pagina sullo Steam Next Fest 2026](/it/guides/steam-next-fest-2026). I playtest delle build più grandi vengono annunciati sul [Discord ufficiale](https://discord.gg/originstcg) e finora poteva partecipare chiunque volesse.

Fonti: le pagine Steam di Origins TCG e della demo e i post ufficiali su Steam del 16 luglio e del 4 agosto 2026.
`,
  },
};

const all: Record<Locale, Record<GuideSlug, Guide>> = { en, it };

export function getGuides(locale: Locale): Guide[] {
  return guideSlugs.map((s) => all[locale][s]);
}

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return (guideSlugs as readonly string[]).includes(slug) ? all[locale][slug as GuideSlug] : undefined;
}
