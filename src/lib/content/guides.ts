import type { Locale } from "../i18n";

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: number;
  updated: string;
  image?: string;
  body: string; // markdown
};

export const guideSlugs = ["origins-tcg-explained", "roadmap-and-dates", "collector-economy"] as const;
export type GuideSlug = (typeof guideSlugs)[number];

const en: Record<GuideSlug, Guide> = {
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
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
};

const it: Record<GuideSlug, Guide> = {
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
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
};

const fr: Record<GuideSlug, Guide> = {
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    title: "Origins TCG expliqué en cinq minutes",
    excerpt: "Ce qu'est le jeu, comment se déroule une partie, ce que veut dire free-to-compete et comment jouer à la démo dès aujourd'hui.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/capsule-main.webp",
    body: `
## Ce que c'est

Origins TCG est un jeu de cartes à collectionner numérique de **Koin Games**, un studio de Tampa (Floride) fondé en 2021 par des vétérans du secteur. Ses personnages sont des légendes du domaine public réinventées dans un monde original : Robin des Bois, Mulan, la Reine de Cœur, Winnie l'ourson, le roi Arthur, Dracula et bien d'autres.

La promesse est le **free-to-compete** : chaque carte nécessaire pour jouer en compétition se gagne en jouant. L'argent n'achète que des versions de collection des cartes, qui peuvent être gradées, échangées et vendues. Les développeurs parlent de « zéro pay-to-win ».

## Comment se déroule une partie

- **Trois voies.** Vous et votre adversaire combattez sur trois plateaux à la fois. Chaque voie a son propre lieu, tiré d'un ensemble de plus de cent lieux qui tournent et changent les règles de ce plateau.
- **Tours simultanés.** Les deux joueurs agissent en même temps, donc personne n'attend. Une partie dure environ sept minutes.
- **Les cartes se battent.** Contrairement aux jeux qui ne comptent que les points par voie, les unités s'attaquent : la Puissance est ce que vous infligez, la Vie ce que vous encaissez.
- **Mots-clés.** Le playtest utilise On Reveal (se déclenche quand la carte est jouée), On Death, First Strike, Double Attack et Deathtouch.
- **Une Légendaire mène le deck.** Dans le playtest actuel, les decks font 25 cartes et chacun est construit autour d'une Légendaire à la capacité signature : Mulan répète les capacités On Reveal de vos alliés, la Reine de Cœur répète leurs On Death.

## Modes

La démo propose un tutoriel, des missions contre des boss dotés de leur propre IA et le jeu en ligne. Le patch 0.6.1 a ajouté le **ladder classé** avec des divisions jusqu'à Grandmaster, un classement mondial et des Points de Victoire.

## Comment jouer aujourd'hui

1. Installez la démo gratuite depuis la [page Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Les joueurs de la démo gagnent des objets de collection exclusifs, échangeables au lancement du jeu complet.
2. Rejoignez le [Discord officiel](https://discord.gg/originstcg) pour les playtests de la build « Démo 2.0 », les tournois et les AMA avec l'équipe.
3. Le jeu est en anglais, français, italien et allemand. Le mobile est prévu pour 2027.

## Où va le jeu

L'accès anticipé sur Steam est annoncé pour le quatrième trimestre 2026, avec une démo bien plus grande au Steam Next Fest (19–26 octobre 2026) et le plus grand tournoi du studio du 20 au 25 octobre. Voir la [feuille de route](/fr/guides/roadmap-and-dates).
`,
  },
  "roadmap-and-dates": {
    slug: "roadmap-and-dates",
    title: "Feuille de route et dates : de la démo à l'accès anticipé",
    excerpt: "Toutes les dates confirmées, du premier message Steam au tournoi du Next Fest, plus ce qui est annoncé pour 2027.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/hero-1200.webp",
    body: `
## Avant la démo

- **Août 2025.** Koin Games et Immutable annoncent « Project O », un TCG compétitif pensé pour le mobile avec une vraie propriété des cartes.
- **Novembre 2025.** Soft launch sur l'App Store dans certaines régions (version 0.1.0).
- **Début 2026.** Le studio déplace l'échange des cartes vers le marketplace Steam et abandonne le modèle on-chain autonome.
- **Mars 2026.** Le CEO est filmé avec des cartes physiques en métal. Ni produit ni date annoncés.

## 2026, mois par mois

| Date | Ce qui s'est passé |
| --- | --- |
| 6 mai | Page Steam en ligne, wishlist ouverte |
| 3 juin | Le Discord officiel s'ouvre à tous |
| 15–16 juillet | Démo gratuite sur Steam avec objets de collection exclusifs |
| 21 juillet | Premiers chiffres : 1 000+ joueurs, 13 000+ parties, temps de jeu médian 1 h 51 |
| 22 juillet | AMA avec le CEO Tim Jooste et le responsable du design Kevin Lambert |
| 24 juillet | Premier tournoi de la démo |
| 24–26 juillet | Origins au Card Party de Fort Lauderdale |
| 7 août | Premier playtest « Démo 2.0 » : 5 nouveaux decks, 70+ cartes, deckbuilding |
| 14 août | Patch 0.6.1 : ladder classé |
| 19 août | AMA sur le Creator Program |
| 21 août | Patch 0.6.2 : 23 cartes rééquilibrées |
| 27 août | Patch 0.6.3 |
| 28 août | Big Bob's Playtest Battle, premier tournoi Conquest, 130+ inscrits |
| 9 septembre | Annonce du tournoi du Next Fest |
| 10 septembre | AMA Kickstarter : vente finale des packs Alpha |

## La suite

- **19–26 octobre 2026.** Steam Next Fest avec la mise à jour Démo 2.0 : deckbuilding et beaucoup plus de cartes pour tout le monde.
- **20–25 octobre 2026.** Le tournoi du Steam Next Fest : qualifications régionales les 20, 21 et 22, puis playoffs et finales. Une dotation de 10 000 $ et une carte promo 1/1 exclusive.
- **T4 2026.** Accès anticipé sur Steam, selon la page du magasin.
- **2027.** Version mobile et ouverture de packs sur téléphone. Lors des AMA, l'équipe a décrit un lancement complet avec toutes les Légendaires, dont le roi Arthur, Dracula, Winnie l'ourson, Alice, Beowulf, Cendrillon, Sweeney Todd, Frankenstein et Sherlock Holmes.

Les dates viennent des messages officiels sur Steam et du Discord du studio. Nous mettons cette page à jour quand elles changent.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    title: "Deux façons de collectionner : comment fonctionne l'économie d'Origins",
    excerpt: "Les cartes compétitives sont gratuites. Les cartes de collection sont limitées, gradées et échangeables sur Steam. Voici ce qui est confirmé et ce qui ne l'est pas.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ls-two-ways.webp",
    body: `
## La séparation

Origins sépare deux choses que presque tous les jeux de cartes mélangent :

1. **Jouer.** Chaque carte compétitive se gagne en jeu. Rien de ce que vous achetez ne rend votre deck plus fort.
2. **Collectionner.** Des versions en édition limitée des cartes existent en tirages numérotés, arrivent **gradées numériquement** et peuvent être achetées, vendues et échangées avec d'autres joueurs.

Les écrans de chargement du studio parlent de « real collecting in digital » et de « two ways to collect ».

## Ce qui est confirmé

- **Cartes gradées.** Les versions de collection portent une note ; au Card Party de juillet, l'équipe offrait un Slab à qui tirait une **Alternate Art 10/10**. Des notes plus basses et des séries différentes existent, avec des valeurs différentes.
- **God packs.** Des packs rares où chaque carte est Légendaire ou mieux.
- **Alpha Edition.** La première édition de collection, « Myths & Legends: Alpha Edition », se vend uniquement en précommande : boosters de cinq cartes, boîtes de 24 boosters et cases de six boîtes, avec dix niveaux de rareté du commun au storybook. Une fois le tirage terminé, plus aucune boîte Alpha n'est produite. La vente finale a été annoncée lors de l'AMA Kickstarter du 10 septembre 2026.
- **Échange sur Steam.** Cartes et produits scellés s'échangeront sur le Steam Community Market et les marketplaces connectés au lancement du jeu complet. Les objets de la démo gagnés aujourd'hui deviendront échangeables à ce moment-là.
- **Mobile plus tard.** L'ouverture de packs sur téléphone est prévue pour 2027.

## Ce qui n'est pas encore confirmé

- Les prix en euros des boosters et boîtes hors précommande Alpha.
- Les frais de marketplace au-delà des frais standard de Steam.
- Si les cartes physiques en métal, montrées par le CEO en mars 2026, seront un jour vendues.

## Pourquoi c'est important pour le méta

Comme les cartes de collection sont cosmétiques, une tier list n'a à se soucier que de la carte, jamais de la version. OriginsMeta suivra les prix du Steam Market dès le premier jour où des objets seront listés, pour que la collection ait les mêmes données que le jeu.
`,
  },
};

const all: Record<Locale, Record<GuideSlug, Guide>> = { en, it, fr };

export function getGuides(locale: Locale): Guide[] {
  return guideSlugs.map((s) => all[locale][s]);
}

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return (guideSlugs as readonly string[]).includes(slug) ? all[locale][slug as GuideSlug] : undefined;
}
