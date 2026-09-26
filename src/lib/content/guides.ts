import type { Locale } from "../i18n";
import { modifiedIn } from "../data/news";
import { esText } from "./guides-es";
import type { GuideVideo } from "../videos";

export type GuideCategory = "game" | "decks" | "rank" | "archetypes" | "interviews" | "events" | "economy";

export type Guide = {
  slug: string;
  category: GuideCategory;
  /**
   * Collegamenti incrociati: slug dei mazzi editoriali (decks.ts), mazzi della community (slug della scheda
   * /decks/community/[slug] con il nome, così la guida resta statica) e carte trattati nella guida.
   */
  tags?: { decks?: string[]; communityDecks?: { slug: string; name: string }[]; cards?: string[] };
  /**
   * Lista del mazzo di cui parla la guida (solo guide ai mazzi): slug della Leggendaria per primo, poi le
   * 12 carte base. La pagina la mostra come fila di carte prima del testo, così il mazzo si vede a colpo
   * d'occhio. Resta un dato statico: la guida non legge Supabase.
   */
  deckList?: string[];
  title: string;
  /**
   * Titolo breve per la SERP: sostituisce `title` nei metadati della pagina quando il titolo esteso
   * verrebbe troncato dai motori di ricerca. Deve essere una frase vera, non un taglio del titolo
   * lungo, e il titolo reso da `pageTitle` non deve superare i 60 caratteri: con "Origins TCG" dentro
   * entro 60, senza entro 46 (la parola chiave la aggiunge `pageTitle`, " · Origins TCG").
   * Guide ai mazzi (25/09/2026): puntano alla ricerca della guida, con la Leggendaria, le preposizioni
   * ("Guida al mazzo di Mulan", "Guía del mazo de Mulan") e il nome del mazzo intero o nessuno; restano
   * diverse dal title della scheda del mazzo, che ha il nome del mazzo in testa (test in cardTitles.test.ts).
   */
  metaTitle?: string;
  excerpt: string;
  readTime: number;
  updated: string;
  /**
   * Data di prima pubblicazione (ISO), che non cambia con le revisioni: la aggiunge `getGuides` dalla tabella
   * `publishedOn`, uguale in tutte le lingue. È `updated` a non andare prima del 25/09/2026 nella versione spagnola.
   */
  published?: string;
  image?: string;
  /**
   * Video della guida (pacchetto VIDEO, 26/09/2026): YouTube (anche Shorts) o Twitch (VOD, clip), con il lettore a clic
   * che non contatta nessuno prima del clic. In cima di default, in fondo con `at: "end"`, oppure prima di un titolo con
   * `before` (l'ancora {#…} per lingua: lo spagnolo eredita i video dall'inglese ma ha ancore sue). Solo video ufficiali
   * o di creator citati, mai inventati; con titolo, miniatura salvata in public/media e data di caricamento veri diventa
   * anche VideoObject nei dati strutturati. Tipo e regole in src/lib/videos.ts (`GuideVideo`, test in videos.test.ts).
   */
  videos?: GuideVideo[];
  /** domande e risposte in fondo alla guida (anche come dati strutturati FAQPage) */
  faq?: { q: string; a: string }[];
  body: string; // markdown
};

export const guideSlugs = [
  "origins-tcg-legendaries",
  "origins-tcg-ranked",
  "origins-tcg-conquest",
  "origins-tcg-locations",
  "on-reveal-midrange-guide",
  "king-of-value-trade-guide",
  "dorothy-combo-guide",
  "trick-or-treat-legion-guide",
  "three-pigs-midrange-guide",
  "three-pigs-midrange-matchups",
  "healing-healsing-guide",
  "healing-healsing-matchups",
  "steam-next-fest-2026",
  "is-origins-tcg-pay-to-win",
  "play-the-demo",
  "origins-tcg-kickstarter",
  "origins-tcg-explained",
  "roadmap-and-dates",
  "collector-economy",
] as const;
export type GuideSlug = (typeof guideSlugs)[number];

/*
  Liste dei due mazzi pubblicati dallo staff, copiate identiche dal campo `cards` delle loro news in
  src/lib/data/news.ts ("davdas-3-pigs-mid-range" e "davdas-healing-healsing"), che a sua volta riporta la
  scheda /decks/community/[slug]: Leggendaria per prima, poi le 12 carte base. Se il mazzo cambia, vanno
  aggiornate insieme alla news.
*/
/*
  Liste dei quattro mazzi pubblicati da Davdas il 22/09/2026, copiate dal campo `cards` delle loro schede
  (/decks/community/<slug>): Leggendaria per prima, poi le 12 carte base. Se un mazzo cambia, vanno aggiornate.
*/
const onRevealMidRange = ["mulan", "bagheera", "baby-bear", "mary", "black-knight", "frog-prince", "ali-baba", "white-queen", "fairy-godmother", "mowgli", "ellen-trechend", "bullseye", "en-passant"];
const kingOfValueTrade = ["king-arthur", "bagheera", "musketeer", "roo", "shahrazad", "shield-maiden", "dark-omen", "cowardly-lion", "ali-baba", "spellbook", "lancelot", "fairy-godmother", "boitata"];
const dorothyCombo = ["dorothy", "twister-toss", "card-soldier", "roo", "basilisk", "pegasus", "flying-monkey", "wicked-witch-of-the-west", "kanga", "en-passant", "spellbook", "magic-carpet", "hare"];
const trickOrTreatLegion = ["legion-of-the-dead", "bullseye", "bagheera", "thumbelina", "morgiana", "mind-palace", "asanbosam", "golden-egg", "flying-monkey", "en-passant", "boogeyman", "white-queen", "impundulu"];
const threePigsMidRange = ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"];
const healingHealsing = ["van-helsing", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "phuong-hoang", "jekyll", "boitata", "tin-woodman", "spellbook", "searing-light", "forbidden-knowledge"];

const en: Record<GuideSlug, Guide> = {
  /*
    Tre guide dell'Ondata 3 del piano SEO/GEO (25/09/2026), per le ricerche attese con lo Steam Next Fest: le 11
    Leggendarie (pagina primaria per l'elenco, mappa delle query C21), la classificata (C13) e la formazione Conquest
    (C12: le regole e le date restano nella news crimson-cup-format-check-in, qui si costruiscono i mazzi). Solo fatti:
    carte, testi e patch da cards.ts, card-lore.ts e card-history.ts; classificata dai post ufficiali su Steam (patch
    0.6.1, 0.6.2, 0.6.3 e aggiornamento della demo del 21/09, letti il 25/09) e dalle nostre news; conteggi dei mazzi
    sui 20 mazzi pubblicati entro le 20:00 del 25/09/2026 (liste lette con la chiave pubblica di Supabase, carte uniche
    con `differentCards` di deckrules.ts: il ventesimo, aggro-midrange-pigs-gm-6931, è delle 18:43). Che le Leggendarie
    dei tre mazzi debbano essere diverse gli annunci della Crimson Cup non lo dicono (era la regola di Big Bob's): le
    guide lo scrivono così e il deck builder segnala due mazzi con la stessa. Niente `communityDecks` nei tag: cardTitles.test.ts tratta come guida a un mazzo ogni guida che li
    ha (Leggendaria nel metaTitle); i mazzi sono linkati nel testo. Numeri da aggiornare a ogni patch e con i mazzi nuovi.
    Il sito non nomina World of Origins (regola del 25/09/2026): i dati non verificati nel gioco (carte generate, Leggendarie
    fuori dalla demo) si dicono "non verificati", senza fonte. Copertine: keyart di famiglie non usate da altre guide, news
    o dallo slider della home (niente hero-1200, che è la prima slide, né varianti di keyart già usate); scartati gli
    screenshot ss-board-sea/-death/-mill perché hanno le targhette con i nomi dei giocatori, da ritagliare.
  */
  "origins-tcg-legendaries": {
    slug: "origins-tcg-legendaries",
    category: "game",
    // Le 11 Leggendarie attive della Demo 2.0, nell'ordine della guida (costo, poi nome): la guida compare sulla scheda di ognuna.
    tags: { cards: ["dorothy", "dracula", "mulan", "queen-of-hearts", "van-helsing", "wicked-stepmother", "merlin", "king-arthur", "legion-of-the-dead", "three-not-so-little-pigs", "robin-hood"] },
    title: "The 11 Legendaries of Origins TCG: cards, stats, patches and decks",
    metaTitle: "Origins TCG Legendaries: all 11 and their decks",
    excerpt: "All 11 Legendary cards of the Origins TCG Demo 2.0: cost, stats, official text, the cards they create, patch changes and the decks that use them.",
    readTime: 9,
    updated: "2026-09-25",
    image: "/media/keyart-king-arthur.webp",
    faq: [
      { q: "How many Legendaries are there in Origins TCG?", a: "Eleven in the Demo 2.0 as of 25 September 2026: Dorothy, Dracula, Mulan, Queen of Hearts, Van Helsing, Wicked Stepmother, Merlin, King Arthur, Legion of the Dead, Three Not So Little Pigs and Robin Hood. The OriginsMeta database keeps nine more that are not in the demo." },
      { q: "How many Legendaries can a deck have?", a: "One. A deck is one Legendary plus twelve base cards played as two copies each, 25 cards in all. In Conquest you bring more than one deck: at Big Bob's Playtest Battle each needed a different Legendary; the Crimson Cup announcements don't say, and our deck builder flags two decks with the same one." },
      { q: "Which Legendary is in the most decks?", a: "On 25 September 2026, Three Not So Little Pigs, leading 4 of the 20 decks published on OriginsMeta; Van Helsing leads 3 and Wicked Stepmother none. It measures popularity on the site, not strength, and the live count is on the Most played page of the tier list." },
      { q: "Is there a Legendary spell?", a: "Yes, one in the Demo 2.0: Legion of the Dead, a 7-mana spell that fills your board with 2/2 Zombies." },
    ],
    body: `
## In brief {#in-brief}

- **Eleven Legendaries** are in the Demo 2.0, the build of Origins TCG you can play today: six cost 4 mana, one costs 5, three cost 7 and one costs 8.
- Ten are units and one is a spell, Legion of the Dead. Five are Good, three Evil and three Neutral.
- Four of them create other cards through their text: Dracula, Van Helsing, Legion of the Dead and Three Not So Little Pigs.
- Seven changed in the balance patches between August and 21 September 2026; Dracula, Van Helsing, Legion of the Dead and Robin Hood did not.
- The 20 decks published on OriginsMeta by 20:00 CEST on 25 September 2026 use ten of the eleven: Three Not So Little Pigs leads four, Van Helsing three, Wicked Stepmother none. Six Legendaries have an OriginsMeta guide to one of their decks.

The Legendaries below are in order of cost and, at the same cost, in alphabetical order. The guide describes what each card does, not how strong it is: our [Origins TCG tier list](/en/tier-list) will rank them from tournament results and the top of the [ranked ladder](/en/guides/origins-tcg-ranked), starting after the Crimson Cup.

## The 11 Legendaries at a glance {#at-a-glance}

| Legendary | Cost | Power/Health | Alignment | Decks |
| --- | --- | --- | --- | --- |
| [Dorothy](/en/cards/dorothy) | 4 | 1/1 | Good | 2 |
| [Dracula](/en/cards/dracula) | 4 | 3/2 | Evil | 2 |
| [Mulan](/en/cards/mulan) | 4 | 2/4 | Good | 1 |
| [Queen of Hearts](/en/cards/queen-of-hearts) | 4 | 3/3 | Evil | 2 |
| [Van Helsing](/en/cards/van-helsing) | 4 | 3/4 | Good | 3 |
| [Wicked Stepmother](/en/cards/wicked-stepmother) | 4 | 4/6 | Evil | 0 |
| [Merlin](/en/cards/merlin) | 5 | 5/5 | Neutral | 1 |
| [King Arthur](/en/cards/king-arthur) | 7 | 7/7 | Good | 2 |
| [Legion of the Dead](/en/cards/legion-of-the-dead) | 7 | spell | Neutral | 2 |
| [Three Not So Little Pigs](/en/cards/three-not-so-little-pigs) | 7 | 3/3 | Neutral | 4 |
| [Robin Hood](/en/cards/robin-hood) | 8 | 4/4 | Good | 1 |

The last column counts the decks each Legendary leads among the 20 published on OriginsMeta from 15 September to 20:00 CEST on 25 September 2026. It measures popularity on the site, not strength or win rate; the live count is on [Most played](/en/tier-list/most-played).

## What the Legendary does in a deck {#in-a-deck}

- **One per deck.** A deck is one Legendary plus twelve base cards, and the game adds a second copy of each base card: 25 cards in play, according to the Koin Games team AMA. The [deck builder](/en/deck-builder) checks the rule.
- **Your opponent sees it.** Patch 0.6.1 of the closed playtest (14 August 2026) added a preview of the opponent's Legendary during the mulligan, according to the [official patch notes](https://store.steampowered.com/news/app/4429430/view/1840944183780414).
- **In Conquest it names the deck.** At the Crimson Cup each player brings three decks, and when you ban one of your opponent's decks you only see its Legendary ([Crimson Cup rules](/en/news/crimson-cup-format-check-in)). The announcements don't say whether the three Legendaries must differ; at Big Bob's Playtest Battle they had to. How to put three decks together: our [Conquest guide](/en/guides/origins-tcg-conquest).

The card texts quoted below are the official ones, read in the game; costs and stats were checked card by card on 22 September 2026. Sagas and the notes on each legend are OriginsMeta's own. The patches are those tracked in [MetaShifting](/en/metashifting): playtest updates 0.6.1, 0.6.2 and 0.6.3 (August 2026) and the demo patch of 21 September 2026. The legendary power is not covered here: we have not transcribed it from the game yet, and each card page will show it when we do.

## Dorothy {#dorothy}

**4 mana · 1/1 · unit · Good** · Saga: Land of Oz

> I can Move each round.
>
> I have +1⚔️/+1❤️ for each time an ally moved this game.

- **The legend.** The Kansas girl carried to Oz by a tornado in L. Frank Baum's 1900 novel.
- **Patches.** Demo patch of 21 September 2026: mana 5 → 4 ([patch notes](/en/news/demo-patch-notes-0921)).
- **Decks on OriginsMeta, 25 September 2026.** Two: [Dorothy Combo](/en/decks/community/dorothy-combo-7503) and [Move/Combo](/en/decks/community/move-combo-075a).
- **Guide.** [Dorothy deck guide: Dorothy Combo](/en/guides/dorothy-combo-guide).
- **Card page.** [Dorothy, Legendary card: stats and text](/en/cards/dorothy).

## Dracula {#dracula}

**4 mana · 3/2 · unit · Evil** · Saga: Gothic horror

> When you discard, return me from your graveyard to hand.
>
> On Reveal: Summon Brides of Dracula [2⚔️/2❤️] on a random space here.

- **The legend.** The Transylvanian count of Bram Stoker's 1897 novel.
- **Cards it creates.** [Brides of Dracula](/en/cards/brides-of-dracula), a 2/2 that, according to its text, deals 1 damage to the opponent's barrier in its location and gains +1❤️ whenever you discard a card (created card: its text is not verified in the game).
- **Patches.** Dracula has not changed. Brides of Dracula went from 3 to 2 mana in patch 0.6.2 ([patch notes](/en/news/patch-0-6-2)).
- **Decks on OriginsMeta, 25 September 2026.** Two: [Discard](/en/decks/community/discard-8bff) and [Dracula SUPER FUN](/en/decks/community/dracula-super-fun-d936).
- **Guide.** None yet: [send us yours](/en/guides/submit).
- **Card page.** [Dracula, Legendary card: stats and text](/en/cards/dracula).

## Mulan {#mulan}

**4 mana · 2/4 · unit · Good** · Saga: Ballad of Mulan

> Double Attack
>
> When an ally On Reveal ability happens, repeat it.

- **The legend.** The warrior who takes her father's place in the army, from a 6th-century Chinese ballad.
- **Patches.** Patch 0.6.2: stats unchanged, she gains Double Attack on top of repeating allies' On Reveal abilities ([patch notes](/en/news/patch-0-6-2)).
- **Decks on OriginsMeta, 25 September 2026.** One: [On Reveal Mid Range](/en/decks/community/on-reveal-mid-range-772e).
- **Guide.** [Mulan deck guide: On Reveal Mid Range](/en/guides/on-reveal-midrange-guide).
- **Card page.** [Mulan, Legendary card: stats and text](/en/cards/mulan).

## Queen of Hearts {#queen-of-hearts}

**4 mana · 3/3 · unit · Evil** · Saga: Wonderland

> First Strike
>
> When an ally On Death ability happens, repeat it.

- **The legend.** The furious monarch of Wonderland whose answer to everything is "Off with their heads!".
- **Patches.** Patch 0.6.2: from 5 mana 3/5 to 4 mana 3/3, and she gains First Strike on top of repeating allies' On Death abilities ([patch notes](/en/news/patch-0-6-2)).
- **Decks on OriginsMeta, 25 September 2026.** Two: [Qoh](/en/decks/community/qoh-f876) and [Just f\\*\\*\\*in em](/en/decks/community/just-f-in-em-bdf2).
- **Guide.** None yet: [send us yours](/en/guides/submit).
- **Card page.** [Queen of Hearts, Legendary card: stats and text](/en/cards/queen-of-hearts).

## Van Helsing {#van-helsing}

**4 mana · 3/4 · unit · Good** · Saga: Gothic horror

> Before combat, add Van Helsing's Tools to your hand if it is not already there.

- **The legend.** Abraham Van Helsing, the Dutch professor who leads the hunt for Dracula.
- **Cards it creates.** [Van Helsing's Tools](/en/cards/van-helsings-tools), which lets you choose and play one of four created cards: [Holy Water](/en/cards/holy-water), [Silver Bullet](/en/cards/silver-bullet), [Garlic](/en/cards/garlic) or [Wooden Stake](/en/cards/wooden-stake) (created cards: their texts are not verified in the game, and the Silver Bullet page still shows its text from before patch 0.6.2; the changes are in its balance history).
- **Patches.** Van Helsing himself has not changed. In patch 0.6.2 Van Helsing's Tools became free (1 → 0 mana) and the Silver Bullet it creates went from 3 damage to 1 ([patch notes](/en/news/patch-0-6-2)); with the demo patch of 21 September 2026 Silver Bullet can also target barriers, and Wooden Stake can target characters at full Health, though it still fails if the target is not damaged when it reveals ([patch notes](/en/news/demo-patch-notes-0921)).
- **Decks on OriginsMeta, 25 September 2026.** Three: [Healing Healsing](/en/decks/community/healing-healsing-9411), [Cure Control](/en/decks/community/cure-control-b630) and [CONTROL](/en/decks/community/control-2c2b).
- **Guides.** [Van Helsing deck guide: Healing Healsing](/en/guides/healing-healsing-guide) and [its matchups](/en/guides/healing-healsing-matchups).
- **Card page.** [Van Helsing, Legendary card: stats and text](/en/cards/van-helsing).

## Wicked Stepmother {#wicked-stepmother}

**4 mana · 4/6 · unit · Evil** · Saga: Fairy tales

> Deathtouch
>
> On Reveal: Give your Evil characters Deathtouch.

- **The legend.** The cruel stepmother of the fairy tales, from Cinderella's household to Snow White's court.
- **Patches.** Demo patch of 21 September 2026: Power 3 → 4 ([patch notes](/en/news/demo-patch-notes-0921)).
- **Decks on OriginsMeta, 25 September 2026.** None of the 20 published so far: build one in the [deck builder](/en/deck-builder) and publish it with a guide.
- **Guide.** None yet: [send us yours](/en/guides/submit).
- **Card page.** [Wicked Stepmother, Legendary card: stats and text](/en/cards/wicked-stepmother).

## Merlin {#merlin}

**5 mana · 5/5 · unit · Neutral** · Saga: Arthurian legend

> Repeat the first spell you play each round.

- **The legend.** The wizard behind Arthur's birth and his rise to the throne, from Geoffrey of Monmouth to Malory.
- **Patches.** Patch 0.6.3: from 3/5 to 5/5, +2 Power ([patch notes](/en/news/patch-0-6-3)).
- **Decks on OriginsMeta, 25 September 2026.** One: [Spellcast](/en/decks/community/spellcast-250f).
- **Guide.** None yet: [send us yours](/en/guides/submit).
- **Card page.** [Merlin, Legendary card: stats and text](/en/cards/merlin).

## King Arthur {#king-arthur}

**7 mana · 7/7 · unit · Good** · Saga: Arthurian legend

> Shield
>
> On Reveal: Give your Good characters Shield.

- **The legend.** The once and future king of Britain, who drew the sword from the stone and gathered the Round Table.
- **Patches.** Patch 0.6.3: from 5/5 to 7/7 ([patch notes](/en/news/patch-0-6-3)).
- **Decks on OriginsMeta, 25 September 2026.** Two: [King of Value Trade](/en/decks/community/king-of-value-trade-fd14) and [Glinda Reborn](/en/decks/community/glinda-reborn-2d6d).
- **Guide.** [King Arthur deck guide: King of Value Trade](/en/guides/king-of-value-trade-guide).
- **Card page.** [King Arthur, Legendary card: stats and text](/en/cards/king-arthur).

## Legion of the Dead {#legion-of-the-dead}

**7 mana · spell · Neutral** · Saga: Gothic horror

> Fill your board with Zombies [2⚔️/2❤️].

- **The only Legendary spell** in the Demo 2.0.
- **The legend.** An army of the risen dead, the necromancer's last argument.
- **Cards it creates.** [Zombie](/en/cards/zombie), 2/2 created cards, as many as it takes to fill your board.
- **Patches.** No changes.
- **Decks on OriginsMeta, 25 September 2026.** Two: [The Trick-or-Treat Legion](/en/decks/community/the-trick-or-treat-legion-72c4) and [FACE IS THE PLACE](/en/decks/community/face-is-the-place-b049).
- **Guide.** [Legion of the Dead deck guide](/en/guides/trick-or-treat-legion-guide).
- **Card page.** [Legion of the Dead, Legendary card: stats and text](/en/cards/legion-of-the-dead).

## Three Not So Little Pigs {#three-not-so-little-pigs}

**7 mana · 3/3 · unit · Neutral** · Saga: Fairy tales

> Trample
>
> On Reveal: Summon a Not So Little Pig [3⚔️/3❤️] with Trample on a random space at each other location.

- **The legend.** The three pigs of straw, sticks and bricks, grown up and not so easy to blow down.
- **Cards it creates.** [Not So Little Pig](/en/cards/not-so-little-pig), a 3/3 with Trample, one at each of the other two locations.
- **Patches.** Patch 0.6.2: from 4/4 to 3/3, and the pigs it summons became 3/3 to match ([patch notes](/en/news/patch-0-6-2)).
- **Decks on OriginsMeta, 25 September 2026.** Four: [3 Pigs Mid Range](/en/decks/community/3-pigs-mid-range-6311), [Value Board](/en/decks/community/value-board-c44a), [VALUE MAXXING](/en/decks/community/value-maxxing-739d) and [AGGRO /MIDRANGE PIGS GM](/en/decks/community/aggro-midrange-pigs-gm-6931).
- **Guides.** [Three Not So Little Pigs deck guide](/en/guides/three-pigs-midrange-guide) and [its matchups](/en/guides/three-pigs-midrange-matchups).
- **Card page.** [Three Not So Little Pigs, Legendary card: stats and text](/en/cards/three-not-so-little-pigs).

## Robin Hood {#robin-hood}

**8 mana · 4/4 · unit · Good** · Saga: Sherwood

> Snipe 3
>
> On Reveal: Deal 2 damage to all enemies.

- **The only 8-mana Legendary** in the Demo 2.0.
- **The legend.** The outlaw archer of Sherwood Forest who robs the rich to feed the poor, sung in ballads since the 14th century.
- **Patches.** No changes.
- **Decks on OriginsMeta, 25 September 2026.** One: [Buff](/en/decks/community/buff-6f60).
- **Guide.** None yet: [send us yours](/en/guides/submit).
- **Card page.** [Robin Hood, Legendary card: stats and text](/en/cards/robin-hood).

## The Legendaries that are not in the Demo 2.0 {#not-in-the-demo}

Our database also keeps nine Legendaries that are not in the Demo 2.0: [Alice](/en/cards/alice), [Beowulf](/en/cards/beowulf), [Cinderella](/en/cards/cinderella), [Death](/en/cards/death), [Dr. Frank](/en/cards/dr-frank), [Mirror Mirror](/en/cards/mirror-mirror), [Red](/en/cards/red), [Winnie-the-Pooh](/en/cards/winnie-the-pooh) and [Wizard of Oz](/en/cards/wizard-of-oz). Their pages keep the last known data, which is not verified in the game. In its AMAs the team has described a full launch with the complete roster of Legendary cards: the dates we know are in the [roadmap](/en/guides/roadmap-and-dates).

## Where the numbers come from {#sources}

- **Cards:** the OriginsMeta [card database](/en/cards): costs, stats and English texts of the demo cards checked one by one in the game on 22 September 2026, Italian and Spanish texts read in the game on 25 September 2026.
- **Patches:** the official patch notes on Steam, card by card in [MetaShifting](/en/metashifting).
- **Decks:** the 20 decks published on OriginsMeta from 15 September to 20:00 CEST on 25 September 2026 ([all the Origins TCG decks](/en/decks)); the count after that is on [Most played](/en/tier-list/most-played).

We will update this guide whenever a patch changes a Legendary or the demo adds a new one.
`,
  },
  "origins-tcg-ranked": {
    slug: "origins-tcg-ranked",
    category: "rank",
    title: "Origins TCG ranked: what we know about the ladder before Steam Next Fest",
    metaTitle: "Origins TCG ranked: start date, Grandmaster, VP",
    excerpt: "Ranked mode opens in the Origins TCG demo with Steam Next Fest on 19 October 2026. What Koin has confirmed: divisions, Grandmaster, VP and rewards.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/keyart-puss-in-boots.webp",
    faq: [
      { q: "At what time does ranked open on 19 October?", a: "Koin Games' Steam post of 21 September 2026 only says \"with the start of Steam Next Fest\", with no time. The festival opens on Monday 19 October 2026 at 10:00 Pacific time: 13:00 Eastern, 18:00 in the UK, 19:00 in central Europe." },
      { q: "What is the highest rank in Origins TCG?", a: "Grandmaster, the top division of the ladder in the closed playtest, which has a world ranked leaderboard (official patch notes 0.6.1 and 0.6.3, August 2026)." },
      { q: "What are the ranked rewards?", a: "Koin Games has only said that ranked in the demo comes with exclusive ranked rewards; on 25 September 2026 the details had not been announced." },
      { q: "Can I play ranked before Steam Next Fest?", a: "Only in the closed playtest, where ranked has been on since patch 0.6.1 of 14 August 2026; instructions to access the playtest are on the official Discord." },
    ],
    body: `
## In brief {#in-brief}

- Ranked mode switches on in the free demo **with the start of Steam Next Fest**, on Monday 19 October 2026, "with exclusive ranked rewards" (Koin Games' Steam post of 21 September 2026).
- It is not new: the closed playtest has had a ranked ladder since patch 0.6.1 of 14 August 2026, and on 24 September it was still on there.
- What the official patch notes confirm: divisions, a top division called **Grandmaster** with a world leaderboard, and **Victory Points** (VP) won and lost in ranked matches: the notes speak of a +10 and −10 change, and since patch 0.6.2 room battles no longer award VP.
- What Koin has not said yet: the full list of divisions, whether the +10/−10 VP of the playtest stays the same in every division and in the demo, seasons and resets, what the rewards are.

We will update this guide when ranked opens in the demo.

## When ranked opens {#when}

On 21 September 2026, in the post about the [first big update to the demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611), Koin Games wrote that it will be "turning on ranked mode with the start of Steam Next Fest, which will come with exclusive ranked rewards". [Steam Next Fest](https://store.steampowered.com/sale/nextfest) runs from Monday 19 October 2026 at 10:00 Pacific time (13:00 Eastern, 18:00 UK, 19:00 central Europe) to Monday 26 October. The post gives no exact time for ranked: "with the start" of the festival is all it says.

On 24 September the Crimson Cup announcement on the official Discord said it again: the demo, which has the tournament card list, switches ranked on for Steam Next Fest, with new ranked rewards ([our article](/en/news/crimson-cup-format-check-in#demo-playtest)). Everything else about the festival is in our [Steam Next Fest guide](/en/guides/steam-next-fest-2026).

## What the playtest ladder tells us {#playtest-ladder}

Ranked has been live in the closed playtest since mid-August, and three sets of official patch notes describe it:

- **Patch 0.6.1, 14 August 2026.** The ranked ladder is the headline of the update, and "Grandmaster division has a world ranked leaderboard" ([patch notes](https://store.steampowered.com/news/app/4429430/view/1840944183780414)). A known bug of that build: the VP (Victory Point) display went wrong once a player reached Grandmaster.
- **Patch 0.6.2, 21 August 2026.** The Grandmaster League now shows each player's correct rank, VP and division, and room battles no longer award VP. Two known bugs of that build: VP were won and lost properly, but the +10 and −10 shown while the total changes had temporarily disappeared, and at the end of a Grandmaster match the VP change did not show, although the points were changing ([patch notes](https://store.steampowered.com/news/app/4429430/view/1841579228669961)).
- **Patch 0.6.3, 27 August 2026.** In the top division the results screen was showing placeholder values instead of the player's own; now division, VP total and VP change display correctly, the +10 and −10 no longer sit on top of the VP total as it changes, and outcome, Victory Points and rank should always appear at the end of a match ([patch notes](https://store.steampowered.com/news/app/4429430/view/1842212951301184)).

Put together: the ladder is made of divisions, **Grandmaster is the top one** (patch 0.6.3 calls it "the top division") and has a world leaderboard with a rank for each player, and ranked matches move your Victory Points, with a change of +10 or −10 in the playtest notes (room battles do not, since 0.6.2). The notes quote "Diamond IV" only as one of the placeholder values shown by mistake: they do not list the divisions below Grandmaster. Our summary of the first ranked patch is in [patch 0.6.1: ranked ladder and Grandmaster](/en/news/patch-0-6-1-ranked).

## Ranked and deck unlocks {#unlocks}

In the closed playtest, according to players on the Steam forum on 14 September 2026, a deck unlocked after three ranked wins plus a win against an AI boss; a developer answered that the team was considering making those unlock matches PvE only ([our article](/en/news/playtest-feedback-deck-unlock)). With the demo update of 21 September Koin confirmed that everyone keeps the progress of the demo or of the playtest, whichever is further ahead ([our article](/en/news/demo-first-big-update#progress)).

## Where to play before the festival {#before-the-festival}

- **The demo** is free on [Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) and has the Crimson Cup card list; ranked arrives there with the festival.
- **The closed playtest** already has ranked. Koin's Steam post of 25 August 2026 points to the [official Discord](https://discord.gg/originstcg) for the instructions to access it, and on 24 September the team said the playtest will get updates that the tournament build will not have.
- To prepare decks: the [deck builder](/en/deck-builder) and [all the Origins TCG decks](/en/decks) published by the community, each with the game code (KGBLDC…) to paste into Origins. The [11 Legendaries](/en/guides/origins-tcg-legendaries) that lead them are described one by one in our guide.
- If you are preparing the Crimson Cup, which is played with three decks in Conquest: [how to build the three decks](/en/guides/origins-tcg-conquest).

## What OriginsMeta will do with ranked {#originsmeta}

Our plan as of 25 September 2026: the first OriginsMeta [tier list](/en/tier-list) after the Crimson Cup finals of 25 October, built on the tournament results and on the top of the ranked ladder. Until then the tier list page shows the top-rated community decks and the most played cards, declared as previews.

## What we don't know yet {#unknowns}

- What the "exclusive ranked rewards" are and how you earn them.
- How many divisions there are, and their names below Grandmaster.
- Whether a win and a loss are always worth +10 and −10 VP, as in the playtest notes, in every division and in the demo.
- Whether ranked has seasons or resets, and whether it stays on in the demo after the festival ends on 26 October.
- Whether ranked progress carries over to the full game.

## Sources {#sources}

Koin Games' official posts on Steam: [patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414) (14 August 2026), [patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) (21 August), [patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) (27 August), [Big Bob's Playtest Battle](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (25 August) and the [first big update to the demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611) (21 September); the Crimson Cup announcement on the official Discord (24 September). All read on 25 September 2026.
`,
  },
  "origins-tcg-conquest": {
    slug: "origins-tcg-conquest",
    category: "decks",
    title: "Conquest in Origins TCG: how to build three decks that pass the unique-card rule",
    metaTitle: "Conquest in Origins TCG: building your three decks",
    excerpt: "How to build a Conquest line-up for Origins TCG: how unique cards are counted, the deck builder check and real community decks that pass the rule.",
    readTime: 7,
    updated: "2026-09-25",
    image: "/media/keyart-goldi.webp",
    faq: [
      { q: "How do I count the cards two Conquest decks share?", a: "Take the 13 different cards of each deck, the Legendary and the twelve base cards, each counted once whatever its copies: the unique cards between the two decks are 13 minus the cards they share. With a minimum of 8 unique cards, two decks can share at most 5. It is OriginsMeta's reading, since Koin Games has not spelled out how the count works; the rule itself is in our article on the Crimson Cup rules." },
      { q: "Can two of my Conquest decks use the same Legendary?", a: "At Big Bob's Playtest Battle in August, no: each deck needed a different Legendary. For the Crimson Cup the announcements of 9 and 24 September 2026 don't spell it out; since in the ban you only see the Legendary, our deck builder flags two decks with the same one." },
      { q: "Do the two copies of a card count as two cards?", a: "Not in OriginsMeta's reading: a card counts once whatever its copies, so every deck has 13 cards to compare, the Legendary and the twelve base cards." },
      { q: "How do I check my three decks?", a: "In the OriginsMeta deck builder, in Tournament (3 decks) mode: the Conquest check counts the unique cards between each pair of decks, lists the shared ones and flags two decks with the same Legendary." },
    ],
    body: `
## In brief {#in-brief}

- **Conquest** means bringing more than one deck, different enough from each other, and banning one of your opponent's decks (Koin Games, 25 August 2026); at Big Bob's Playtest Battle each deck also needed a different Legendary.
- At the **Crimson Cup** (20–25 October 2026) you bring three decks with at least 8 unique cards between each pair. Rules, dates, prizes and check-in are in [our article on the Crimson Cup rules](/en/news/crimson-cup-format-check-in): this guide is about building the three decks.
- Koin has not spelled out how unique cards are counted. OriginsMeta counts each card once, whatever its copies, Legendary included: two decks can then share at most 5 cards.
- The [deck builder](/en/deck-builder) checks all of it in its "Tournament (3 decks)" mode.
- Among the 20 decks published on OriginsMeta by 20:00 CEST on 25 September 2026, 174 of the 176 pairs with different Legendaries pass the rule; the two that fail, both with Buff, miss by one card.

## What Conquest asks for {#the-format}

Koin Games used Conquest for the first time at [Big Bob's Playtest Battle](/en/news/big-bobs-playtest-battle) on 28 August 2026. The [announcement on Steam](https://store.steampowered.com/news/app/4429430/view/1841579228677617) of 25 August describes it like this: "you have to submit multiple decks before the tournament starts that have to be different to each other and you get the chance to ban one deck from your opponent". That time every deck needed a different Legendary and at least nine cards of difference.

For the Crimson Cup, the announcements of 9 and 24 September 2026 set these rules:

- **three decks**; the announcements don't say whether the Legendaries must differ (at Big Bob's they had to, and in the ban you only see the Legendary);
- **at least 8 unique cards** between each pair of decks;
- decklists hidden until the top 4: when you ban one of your opponent's decks you only see its Legendary;
- best-of-three matches and a best-of-five grand final; in best-of-five there is no ban and you have to win with all three decks.

The tournament is played on the main demo, with its card list. The last balance patch arrives two weeks before Steam Next Fest: a line-up built today is worth checking again after it.

## How unique cards are counted {#counting}

Every deck has **13 different cards**: the Legendary and twelve base cards, whose second copy the game adds by itself (25 cards in play). The Crimson Cup announcement does not say how the 8 unique cards are counted. This is OriginsMeta's reading, the one our deck builder and our tournaments apply:

1. each card counts **once**, however many copies it has;
2. the **Legendary counts too**: two different Legendaries are always one card of difference;
3. the unique cards between deck A and deck B are the cards of A that B does not have: **13 minus the cards they share**.

So "at least 8 unique cards" means **at most 5 cards in common** between any two of your decks.

**A pair right at the limit.** [3 Pigs Mid Range](/en/decks/community/3-pigs-mid-range-6311) (Three Not So Little Pigs) and [On Reveal Mid Range](/en/decks/community/on-reveal-mid-range-772e) (Mulan) share five cards: En Passant, Ali Baba, Bagheera, Frog Prince and Ellen Trechend. In play those are ten of the 25 cards of each deck, but they count as five: 13 − 5 = **8 unique cards**, exactly the minimum. One more card in common and the pair would no longer pass.

**A pair one card short.** [Buff](/en/decks/community/buff-6f60) (Robin Hood) and [FACE IS THE PLACE](/en/decks/community/face-is-the-place-b049) (Legion of the Dead) share six cards: Musketeer, Defense Matrix, Bagheera, Three Blind Mice, Glinda and Galahad. 13 − 6 = **7**: to bring them together, one of the six has to leave one of the two decks.

If Koin counts differently, for example copy by copy, the numbers change: we will update this guide and the builder as soon as the rule is spelled out.

## Build the three decks in the deck builder {#deck-builder}

1. Open the [deck builder](/en/deck-builder) and switch from "Single deck" to **"Tournament (3 decks)"**.
2. Decks A, B and C each have their own tab. Build them from the card pool, or paste a game code (KGBLDC…) in **Import**: the import only changes the deck you are on.
3. On any community deck page, **"Open in the deck builder"** loads that list into the active deck and leaves the other two as they are: a quick way to try pairs of published decks.
4. The **"Conquest check"** box shows, for each pair, how many unique cards differ: green with ✓ from the minimum up, red with ✗ below it. Hovering a number lists the shared cards. The minimum is 8, the Crimson Cup value, and you can change it (Big Bob's Playtest Battle asked for 9). The check also flags two decks with the same Legendary.
5. When the three decks are legal and far enough apart, the box says **OK ✓**. Copy each deck with "Copy game code" and paste it into Origins.

The builder saves the three decks in your browser as you go. [Tournaments](/en/tournaments) created on OriginsMeta can use Conquest too, with 2 to 4 decks per player and a minimum chosen by the organiser, and each tournament's builder applies those rules. The Legendaries to choose from are all in [our guide to the 11 Legendaries](/en/guides/origins-tcg-legendaries).

The Crimson Cup is the tournament of Steam Next Fest, and ranked opens in the demo with the same festival: everything about the festival is in our [Steam Next Fest guide](/en/guides/steam-next-fest-2026), and [what is confirmed about ranked](/en/guides/origins-tcg-ranked) in its own guide.

## Community decks that pass, and two that don't {#community-pairs}

By 20:00 CEST on 25 September 2026 OriginsMeta has 20 published decks, led by 10 different Legendaries. That makes 190 possible pairs:

- 14 pairs share the Legendary: the deck builder flags them, and at Big Bob's Playtest Battle they could not have gone in the same line-up. They are often versions of one list, like [Healing Healsing](/en/decks/community/healing-healsing-9411), [Cure Control](/en/decks/community/cure-control-b630) and [CONTROL](/en/decks/community/control-2c2b), three Van Helsing decks that share 12 of their 13 cards;
- of the other 176, **174 pass** the 8-card rule, and 30 of them share no card at all;
- two fail, both at 7 and both with Buff: Buff and FACE IS THE PLACE, seen above, and Buff and [AGGRO /MIDRANGE PIGS GM](/en/decks/community/aggro-midrange-pigs-gm-6931) (Three Not So Little Pigs), which share Bagheera, Mind Palace, Three Blind Mice, Beast, Glinda and Galahad.

Some pairs with their real numbers:

| Pair | Legendaries | Cards in common | Unique cards of difference | 8 or more? |
| --- | --- | --- | --- | --- |
| [Dracula SUPER FUN](/en/decks/community/dracula-super-fun-d936) + [Qoh](/en/decks/community/qoh-f876) | Dracula, Queen of Hearts | none | 13 | yes |
| [3 Pigs Mid Range](/en/decks/community/3-pigs-mid-range-6311) + [Healing Healsing](/en/decks/community/healing-healsing-9411) | Three Not So Little Pigs, Van Helsing | 1: Ali Baba | 12 | yes |
| [Dorothy Combo](/en/decks/community/dorothy-combo-7503) + [On Reveal Mid Range](/en/decks/community/on-reveal-mid-range-772e) | Dorothy, Mulan | 1: En Passant | 12 | yes |
| [Spellcast](/en/decks/community/spellcast-250f) + [The Trick-or-Treat Legion](/en/decks/community/the-trick-or-treat-legion-72c4) | Merlin, Legion of the Dead | 2: Golden Egg, Impundulu | 11 | yes |
| [King of Value Trade](/en/decks/community/king-of-value-trade-fd14) + [Healing Healsing](/en/decks/community/healing-healsing-9411) | King Arthur, Van Helsing | 4: Shahrazad, Ali Baba, Boitata, Spellbook | 9 | yes |
| [Qoh](/en/decks/community/qoh-f876) + [Value Board](/en/decks/community/value-board-c44a) | Queen of Hearts, Three Not So Little Pigs | 5: Bagheera, Baby Bear, Mind Palace, Ellen Trechend, Cockatrice | 8 | yes, at the limit |
| [Buff](/en/decks/community/buff-6f60) + [FACE IS THE PLACE](/en/decks/community/face-is-the-place-b049) | Robin Hood, Legion of the Dead | 6 | 7 | no |

Nine pairs sit exactly at 8:

- [3 Pigs Mid Range](/en/decks/community/3-pigs-mid-range-6311) + [On Reveal Mid Range](/en/decks/community/on-reveal-mid-range-772e)
- [AGGRO /MIDRANGE PIGS GM](/en/decks/community/aggro-midrange-pigs-gm-6931) + [FACE IS THE PLACE](/en/decks/community/face-is-the-place-b049)
- [CONTROL](/en/decks/community/control-2c2b) + [Spellcast](/en/decks/community/spellcast-250f)
- [Cure Control](/en/decks/community/cure-control-b630) + [Glinda Reborn](/en/decks/community/glinda-reborn-2d6d)
- [Cure Control](/en/decks/community/cure-control-b630) + [Spellcast](/en/decks/community/spellcast-250f)
- [FACE IS THE PLACE](/en/decks/community/face-is-the-place-b049) + [Glinda Reborn](/en/decks/community/glinda-reborn-2d6d)
- [Healing Healsing](/en/decks/community/healing-healsing-9411) + [Spellcast](/en/decks/community/spellcast-250f)
- [Qoh](/en/decks/community/qoh-f876) + [Value Board](/en/decks/community/value-board-c44a)
- [Qoh](/en/decks/community/qoh-f876) + [VALUE MAXXING](/en/decks/community/value-maxxing-739d)

Of the 1,140 possible trios of published decks, 867 have three different Legendaries and pass the rule on all three pairs.

These are counts, not advice: they say which decks can stand together under the rule, not which line-up wins. How each deck plays is on its page, in its author's guide.

## What we don't know yet {#unknowns}

- How Koin counts the 8 unique cards: the announcement of 24 September does not say.
- Whether the three Crimson Cup decks must have different Legendaries: the announcements do not say.
- The final card list: the tentative list has been in the game since 21 September, and the last balance patch arrives two weeks before Steam Next Fest.

## Sources {#sources}

Koin Games' posts on Steam of [25 August](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (Big Bob's Playtest Battle) and [9 September 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278) (the tournament of Steam Next Fest), the Crimson Cup announcement on the official Discord (24 September) and the decks published on OriginsMeta by 20:00 CEST on 25 September 2026, counted with the same function the deck builder uses.
`,
  },
  "origins-tcg-locations": {
    slug: "origins-tcg-locations",
    category: "game",
    tags: { cards: ["christopher-robin", "merry-man", "bandersnatch", "ellen-trechend", "boogeyman", "dorothy", "king-arthur"] },
    title: "Origins TCG locations: how the three lanes change every game",
    metaTitle: "Origins TCG locations explained",
    excerpt: "Locations are the third player at the table: they double damage, change costs and move your characters. How they work, which ones decide games, and how to build with them in mind.",
    readTime: 7,
    updated: "2026-09-23",
    image: "/media/ss-board-locations.webp",
    faq: [
      { q: "How many locations are there in Origins TCG?", a: "The Demo 2.0 rotates 44 of them. The official Steam page says the full game draws from a pool of more than one hundred locations." },
      { q: "When do you see the locations of a game?", a: "One per round over the first three rounds: the first is known from the start, the second arrives in round two and the third in round three. From round four you play with the whole board in sight." },
      { q: "Does a location work for both players?", a: "Yes. A location is a rule of that lane, not a bonus for whoever gets there first: Amplifying Amphitheatre doubles your damage and theirs." },
      { q: "Where can I see the full list?", a: "On the OriginsMeta locations page, with search, filters by kind of effect and links to the cards some of them summon." },
    ],
    body: `
## Why locations matter more than they look

Origins TCG is played across **three locations**, and each one carries a rule that applies to that lane for the whole game. It is the part of the game that a decklist cannot control: two players can sit down with the same twenty-five cards and get two completely different games, because one board doubles damage and the other makes everything cost one less.

The Demo 2.0 rotates **44 locations**. The [official Steam page](https://store.steampowered.com/app/4429430/Origins_TCG/) says the full game will draw "from a pool of 100+ rotating locations that reshape the board and demand a unique strategy". The complete list with every effect is on the [locations page](/en/locations), searchable and filterable; this guide is about what to do with them.

## How they arrive

The three locations are revealed **one per round over the first three rounds**. The first is on the table from the start, the second appears in round two, the third in round three. From round four on, nothing more is hidden and you are playing a board you can see entirely.

That schedule is the reason the early rounds are not just about curve: on round one you are committing cards to a lane whose two neighbours you do not know yet. Holding a character for one round to see where it belongs is often worth more than playing it on curve into the wrong lane.

## The families of effects

On our list the locations are grouped by what they do to the game, and the groups are worth knowing because they ask for different answers.

- **Damage.** Amplifying Amphitheatre doubles all damage there, Burnturn Arena chips every character after combat, Soul Artillery hits both barriers whenever something dies. Small bodies stop being safe.
- **Mana and costs.** Gold Spinning Wheel takes one off everything, Castle in the Clouds only off cards that cost seven or more, Treasurer's Office adds one, Mana Battery lets you keep what you did not spend. These decide who gets ahead on tempo.
- **Draw and discard.** The Sultan's Court gives a card each round that you must spend, Knowledge Vault rewards whoever fills the lane first, Junkyard takes one from both players, Nostradamus' Call destroys both decks at the start of round six.
- **Movement.** Conveyor Belt slides everyone right after combat, Ballroom sends a random character back to hand, Open Meadow grants Move.
- **Summons and copies.** Cloning Lab fills your spaces with copies of what you just played, Reflecting Pool copies it in another location, Sherwood Forest keeps producing [Merry Men](/en/cards/merry-man), Hundred Acre Woods puts a [Christopher Robin](/en/cards/christopher-robin) on both sides.
- **Granted keywords.** Stomping Grounds gives Trample, The Colosseum Double Attack, Windmill Ridge Defender, Poison Grounds gives Deathtouch to Evil characters, Blessed Grounds gives Shield to Good ones.
- **Abilities.** Mirror Dimension repeats On Reveal, Burial Grounds repeats On Death, Anti-Magic Vault strips abilities entirely, Wonderland reverses the attack order.
- **Destruction and barriers.** The Gallows destroys the enemy across from anything that lands there, The Hill kills everything tied for the lowest power after combat, Wall of Dumpty eats the first character you play, Broken Gate makes barriers come back with 10 health instead of 40.

## The locations that decide games

A few of them are worth recognising the moment they turn up, because they change what you should do with your hand.

- **Cloning Lab.** Whatever you play there gets copied into your free spaces in that lane. A cheap body with a good On Reveal becomes three, and the lane is decided in one turn.
- **Mirror Dimension.** Every On Reveal happens twice. It does for a whole lane what [Mulan](/en/cards/mulan) does for a deck, and it stacks with her.
- **The Gallows.** Anything that enters play there destroys the enemy across from it. It turns your cheapest character into removal, and it punishes whoever commits first.
- **Anti-Magic Vault.** Characters lose all abilities. A deck built on triggers has nothing to do there; a deck of plain bodies is suddenly at home.
- **Amplifying Amphitheatre.** All damage doubled, both ways. A Trample finisher like [Ellen Trechend](/en/cards/ellen-trechend) ends the game through the barrier; so does theirs.
- **Nostradamus' Call.** Both decks are destroyed at the start of round six. Whatever your plan is, it has to be done by round five.

## Building with locations in mind

You cannot choose the board, but you can build a deck that is rarely helpless on it.

1. **Do not put everything on one trigger.** A deck that only works through On Reveal is a deck that loses a lane to Anti-Magic Vault. Keep a few cards that are good as plain bodies.
2. **Keep a reach card.** Locations that hit barriers (Overloaded Circuit, "Human" Cannon, Soul Artillery) reward decks that can finish a lane from a distance instead of grinding it.
3. **Cheap characters gain the most.** Every location that grants a keyword or copies a body pays more on a two-drop than on a seven-drop: the location is doing the expensive part.
4. **Watch the lanes that punish committing.** The Hill, Wall of Dumpty and The Gallows all punish the player who fills a lane first. Against an unknown board, the second card into a lane is often safer than the first.

## What we still want to check

This list matches the Demo 2.0 rotation. We have not yet gone through the locations one by one inside the game, as we did with the 122 cards on 22 September 2026: when we do, the [locations page](/en/locations) will say so, with the date and the count.
`,
  },
  "on-reveal-midrange-guide": {
    slug: "on-reveal-midrange-guide",
    category: "decks",
    deckList: onRevealMidRange,
    tags: {
      communityDecks: [{ slug: "on-reveal-mid-range-772e", name: "On Reveal Mid Range" }],
      cards: ["mulan", "bagheera", "baby-bear", "mary", "black-knight", "frog-prince", "ali-baba", "white-queen", "fairy-godmother", "mowgli", "ellen-trechend", "bullseye", "en-passant"],
    },
    title: "On Reveal Mid Range: how to play the Mulan midrange deck",
    metaTitle: "Mulan deck guide: On Reveal Mid Range",
    excerpt: "Game plan, mulligan and round-by-round play for On Reveal Mid Range, the Mulan deck that repeats every On Reveal ability, for ladder, competitive and tournaments.",
    readTime: 6,
    updated: "2026-09-23",
    image: "/cards/cover/mulan.webp",
    faq: [
      { q: "What does Mulan do in this deck?", a: "Mulan is a 4-mana 2/4 with Double Attack, and when an ally On Reveal ability happens she repeats it. Nine cards in the list have an On Reveal, so she turns each of them into two." },
      { q: "What do you keep in the mulligan?", a: "A curve that reaches Mulan on round four: Bagheera on a middle space, Baby Bear, then Black Knight or Frog Prince. Mary is worth keeping when you expect a long game." },
      { q: "Which On Reveal gains the most from Mulan?", a: "Mowgli, whose 6-mana On Reveal summons a 6/6 Baloo at another random location: repeated, it puts two Baloos on the board. Ellen Trechend and Fairy Godmother also double up." },
      { q: "How do I try the deck?", a: "Open the deck page on OriginsMeta and press “Open in the deck builder”, or “Copy game code” to paste the code (KGBLDC…) into Origins." },
    ],
    body: `
## The deck in one paragraph

**On Reveal Mid Range** is a **midrange** list led by [Mulan](/en/cards/mulan), published on OriginsMeta on 22 September 2026 by [Davdas](/en/authors/davdas), a member of the site's staff, and tagged for **ladder**, **competitive** and **tournament** play. The idea is the one the author states on the [deck page](/en/decks/community/on-reveal-mid-range-772e): Mulan "lets you use On Reveal abilities to the full", and the list is built to have one worth repeating in every round. It holds up against an aggressive deck and puts pressure on a control deck, because the same cards buy time and build a board.

## The list

Twenty-five cards: the Legendary plus twelve cards played as two copies each. Stats are those of the Demo 2.0, [checked card by card in the game](/en/deck-builder) on 22 September 2026.

| Card | Cost | What it does |
| --- | --- | --- |
| [Mulan](/en/cards/mulan) ★ | 4 | 2/4, Double Attack; when an ally On Reveal happens, it repeats |
| [Bagheera](/en/cards/bagheera) | 1 | 1/1; On Reveal on a middle space it gets +2⚔️/+2❤️ |
| [Baby Bear](/en/cards/baby-bear) | 2 | 1/1; hits back for 1 when an enemy damages your barrier here, and on death adds a 4/4 Papa Bear to your hand |
| [Mary](/en/cards/mary) | 3 | 1/1; On Reveal adds a Little Lamb to hand, on death your Lambs get +3⚔️/+3❤️ permanently |
| [Black Knight](/en/cards/black-knight) | 3 | 2/2; On Reveal deals 2 damage to the enemy across from it |
| [Frog Prince](/en/cards/frog-prince) | 3 | 2/2; On Reveal, +3⚔️ or +3❤️, your choice |
| [Ali Baba](/en/cards/ali-baba) | 3 | 2/3; draws a card whenever it damages an opponent's barrier |
| [White Queen](/en/cards/white-queen) | 4 | 3/3; On Reveal returns ANY character to its owner's hand |
| [Fairy Godmother](/en/cards/fairy-godmother) | 5 | 3/3; On Reveal gives another ally +3⚔️/+3❤️ |
| [Mowgli](/en/cards/mowgli) | 6 | 2/2; On Reveal summons Baloo (6/6) at another random location |
| [Ellen Trechend](/en/cards/ellen-trechend) | 8 | Trample; On Reveal it gets +3⚔️/+3❤️ for each enemy card in its location |
| [Bullseye](/en/cards/bullseye) | 1 | Spell: 3 damage to ANY character |
| [En Passant](/en/cards/en-passant) | 3 | Spell: move an ally and deal its Power to the character across from it |

Ten units and two spells, nine of which carry an On Reveal. That is the whole point of the deck: Mulan is not a finisher, she is a multiplier.

## How the deck wins

Mulan repeats the On Reveal of an ally, so every card played after her is worth twice. The three best copies:

- **Mowgli** costs six and summons a 6/6 Baloo at another random location. Repeated, it is two Baloos: a single card that fills two lanes you were not contesting.
- **Ellen Trechend** grows +3⚔️/+3❤️ for each enemy card in her location, and she has Trample. Into a busy lane she is already a threat on her own; repeated, the buff lands twice before combat.
- **Fairy Godmother** gives +3⚔️/+3❤️ to another ally. Two triggers can be aimed at the same body or split across two, depending on what the opponent can remove.

Mulan also has **Double Attack**, so her own 2/4 body trades better than it reads.

## Mulligan

Look for a curve that gets you to Mulan on round four without falling behind: **Bagheera** on a middle space (a 3/3 for one mana), then **Baby Bear**, then **Black Knight** or **Frog Prince**. Keep **Mary** when you expect a long game: the Lamb she adds to your hand is a cheap body, and if Mary dies the Lambs you have already played grow permanently.

## Round by round

1. **Rounds 1–3: take space without overcommitting.** Bagheera in the middle, Baby Bear where you expect the first attacks, Black Knight across from something you want dead. One card per lane is enough: the deck wants the board to be even, not crowded, when Mulan arrives.
2. **Round 4: Mulan.** From here on, the order of your plays matters more than the cards. Ask every round which On Reveal is worth doubling, and play it in Mulan's location.
3. **Rounds 5–6: the value cards.** Fairy Godmother, then Mowgli on six. White Queen is the answer card of the list: it returns ANY character to its owner's hand, so it can remove a finisher the round it lands, or pick up your own Mary to replay her.
4. **Rounds 7–8: closing.** Ellen Trechend into the lane the opponent has filled; En Passant to move an ally, hit what stands across from it, and open a path for the Trample damage.

## Playing the time-buying cards

The author calls **White Queen, Mary and En Passant** the cards "that buy you time", and they are what makes the deck able to survive an aggressive start. White Queen is not removal: the character comes back into the owner's hand and can be replayed, so use her on something expensive, or on a body already buffed. En Passant is removal and repositioning at the same time, and it is the answer to a blocker parked in front of your best card.

## Matchups

Ranked data is not public, so what follows is OriginsMeta's reading of the lists, not a win rate.

- **Against aggressive decks.** Baby Bear and Frog Prince played as a 2/5 hold the lanes; Bullseye takes care of three-Health bodies for one mana. Do not spend White Queen early: you will want it for the first large threat.
- **Against control decks.** Ali Baba is the card that keeps your hand full while you press a barrier. Do not commit everything to one location: a board wipe answered by a single Mowgli is a swing you can afford, an empty hand is not.
- **Against other midrange lists.** The deck plays the same game as [3 Pigs Mid Range](/en/decks/community/3-pigs-mid-range-6311) and [King of Value Trade](/en/decks/community/king-of-value-trade-fd14): whoever gets more out of each card wins. Doubling an On Reveal is exactly that, so protect Mulan and play the cheap On Reveals before her only when you must.

## The weaknesses, in the author's words

The deck page lists two: **a good curve is often essential**, and **you can run out of answers**. Both come from the same place — the deck has no mass removal and only two spells. If you have to choose between using a card now and saving it for a double later, use it now: Mulan repeats what you play, she does not bring anything back.

## Where to go next

- The [deck page](/en/decks/community/on-reveal-mid-range-772e) has the list with the mana curve and saga charts, the author's notes, “Open in the deck builder” and the game code to paste into Origins.
- The card stats are those of the Demo 2.0 with the [21 September patch](/en/news/demo-patch-notes-0921); every card page has its own balance history.
`,
  },
  "king-of-value-trade-guide": {
    slug: "king-of-value-trade-guide",
    category: "decks",
    deckList: kingOfValueTrade,
    tags: {
      communityDecks: [{ slug: "king-of-value-trade-fd14", name: "King of Value Trade" }],
      cards: ["king-arthur", "shield-maiden", "fairy-godmother", "dark-omen", "lancelot", "musketeer", "cowardly-lion", "roo", "shahrazad", "ali-baba", "spellbook", "boitata", "bagheera"],
    },
    title: "King of Value Trade: how to play the King Arthur midrange deck",
    metaTitle: "King Arthur deck guide: King of Value Trade",
    excerpt: "Game plan, mulligan and round-by-round play for King of Value Trade, the King Arthur midrange deck built to win every trade two cards for one.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/cards/cover/king-arthur.webp",
    faq: [
      { q: "What is a value trade in Origins TCG?", a: "Making one of your cards answer two of the opponent's, or trading a cheap card for an expensive one. This deck is built around that idea: Shield, First Strike and buffs make your characters survive the fight they win." },
      { q: "What do you keep in the mulligan?", a: "Bagheera and Roo, which are solid on curve, Musketeer and Shield Maiden for the early rounds. Against aggressive decks keep Cowardly Lion; against control, Ali Baba." },
      { q: "Why is Roo good after the 21 September patch?", a: "The Demo patch of 21 September 2026 took Roo from 2/3 to 2/4 (+1 Health) for two mana while keeping the Move keyword, so it survives most of the early exchanges instead of trading down." },
      { q: "Is Spellbook necessary?", a: "No. It adds a random spell each round for fuel and unpredictability, but the deck page says the list can win without it." },
    ],
    body: `
## The deck in one paragraph

**King of Value Trade** is a **midrange** list led by [King Arthur](/en/cards/king-arthur), published on OriginsMeta on 22 September 2026 by [Davdas](/en/authors/davdas), a member of the site's staff, and tagged for **ladder** play. The name says the plan: "almost every piece wants to go two for one", that is, to answer two of the opponent's cards with one of yours. Do that often enough and the board becomes yours on its own, without needing a single big finishing turn.

## The list

Twenty-five cards: the Legendary plus twelve cards played as two copies each.

| Card | Cost | What it does |
| --- | --- | --- |
| [King Arthur](/en/cards/king-arthur) ★ | 7 | 7/7 with Shield; On Reveal it gives Shield to your Good characters |
| [Bagheera](/en/cards/bagheera) | 1 | 1/1; On Reveal on a middle space it gets +2⚔️/+2❤️ |
| [Musketeer](/en/cards/musketeer) | 2 | 2/1 with First Strike |
| [Roo](/en/cards/roo) | 2 | 2/4 with Move |
| [Shahrazad](/en/cards/shahrazad) | 2 | 1/4; heals 1 damage from your barrier here whenever a card enters your hand |
| [Shield Maiden](/en/cards/shield-maiden) | 3 | 3/1 with Shield |
| [Dark Omen](/en/cards/dark-omen) | 3 | Spell: destroy ANY character |
| [Cowardly Lion](/en/cards/cowardly-lion) | 3 | 2/5 with Defender |
| [Ali Baba](/en/cards/ali-baba) | 3 | 2/3; draws a card whenever it damages an opponent's barrier |
| [Spellbook](/en/cards/spellbook) | 3 | Spell: from now on, a random spell in hand each round, discarded before combat |
| [Lancelot](/en/cards/lancelot) | 4 | 4/4; every Good character you play in its location gets +2⚔️/+2❤️ |
| [Fairy Godmother](/en/cards/fairy-godmother) | 5 | 3/3; On Reveal gives another ally +3⚔️/+3❤️ |
| [Boitata](/en/cards/boitata) | 5 | 5/5; spell and ability damage aimed at your barriers hits the opponent's barrier there instead |

Ten units and two spells, and ten of the thirteen cards are Good characters: that is not a coincidence, it is what makes the Legendary worth seven mana.

## How the deck wins

Three keywords do the work.

- **Shield** absorbs the first damage. King Arthur gives it to all your Good characters at once, and [Shield Maiden](/en/cards/shield-maiden) brings her own: a 3/1 with Shield trades with a 3/3 and stays on the board.
- **First Strike** on [Musketeer](/en/cards/musketeer) means the enemy takes the damage before it can answer: two mana that remove a bigger body.
- **The buffs** of [Lancelot](/en/cards/lancelot) and [Fairy Godmother](/en/cards/fairy-godmother) turn an even fight into a one-sided one. Lancelot buffs every Good character played in his location, so he rewards you for keeping the lane going instead of spreading thin.

[Ali Baba](/en/cards/ali-baba) is the engine: every time it damages a barrier you draw. [Shahrazad](/en/cards/shahrazad) is the other half of the same idea — she heals one damage from your barrier in her location each time a card enters your hand, so drawing keeps you alive as well as ahead.

## Mulligan

**Bagheera is a must-have**, and **Roo** is now worth keeping in every hand: the [Demo patch of 21 September](/en/news/demo-patch-notes-0921) made it a 2/4, so it survives the early exchanges. **Musketeer** and **Shield Maiden** put you ahead in rounds two and three. Against an aggressive deck keep **Cowardly Lion**, whose Defender holds the lane; against a control deck keep **Ali Baba**, which turns a free barrier hit into cards. If you expect a long game, keeping **Spellbook** is a fair call.

## Round by round

1. **Rounds 1–3: trade up.** Bagheera in the middle, Musketeer across from a 1- or 2-Health body, Roo where you may want to move later. Every fight you can win without losing the body is a card gained.
2. **Rounds 4–5: hold a lane.** Lancelot, then play the Good characters in his location: each arrives +2⚔️/+2❤️ bigger than it should be. Boitata on five is a 5/5 that also turns enemy spell damage aimed at your barriers back at theirs.
3. **Rounds 6–7: the Legendary.** King Arthur is a 7/7 with Shield, and his On Reveal gives Shield to everything Good you already have on the board. Do not play him into an empty board: the value is in the Shields, not in the body.
4. **Dark Omen, whenever it matters.** Three mana to destroy ANY character is the answer to the one card you cannot beat in a fight: a buffed body, a Defender in the wrong lane, an enemy Legendary.

## Two notes from the author

- **Fairy Godmother is not only a finisher.** The deck page points out that she can also protect Ali Baba, Shahrazad or Cowardly Lion: +3❤️ on the right body means the engine survives another round.
- **Dark Omen has to be precise.** With two copies and no other removal, spending one on the wrong target leaves the real threat alive.

## Matchups

Ranked data is not public, so this is OriginsMeta's reading of the lists, not a win rate.

- **Against aggressive decks.** Cowardly Lion and Shahrazad together are the safety net: the Defender takes the hits, the healing gives back the barrier damage that gets through. Do not trade Shield Maiden early for a 1-Health body if a bigger one is coming.
- **Against control decks.** Ali Baba, then a second one. The deck page is clear about it: the list wants to keep drawing while the opponent digs for answers. Keep Dark Omen for the card that closes their game, not for the first thing they play.
- **Against decks that damage your barriers with spells** ([Healing Healsing](/en/decks/community/healing-healsing-9411) and other lists with Boitata). Whoever lands Boitata first turns that damage around: with two copies in the list, it is worth holding one rather than losing both to the same fight.

## The weaknesses, in the author's words

The deck page lists three: **no area removal**, **Dark Omen must be used precisely**, and **you need to read the opponent's plan**. The first two follow from the list: apart from Dark Omen there is nothing that removes a character outright, so a board you let grow stays grown. The third is the honest part — this deck makes its value one exchange at a time, and each exchange is a decision.

## Where to go next

- The [deck page](/en/decks/community/king-of-value-trade-fd14) has the full list with the charts, the author's notes, “Open in the deck builder” and the game code (KGBLDC…).
- Card stats are those of the Demo 2.0 with the [21 September patch](/en/news/demo-patch-notes-0921).
`,
  },
  "dorothy-combo-guide": {
    slug: "dorothy-combo-guide",
    category: "decks",
    deckList: dorothyCombo,
    tags: {
      communityDecks: [{ slug: "dorothy-combo-7503", name: "Dorothy Combo" }],
      cards: ["dorothy", "flying-monkey", "pegasus", "card-soldier", "twister-toss", "wicked-witch-of-the-west", "kanga", "en-passant", "roo", "spellbook", "hare", "basilisk", "magic-carpet"],
    },
    title: "Dorothy Combo: how to play the move deck after the 21 September patch",
    metaTitle: "Dorothy deck guide: Dorothy Combo",
    excerpt: "The move deck rebuilt around the 21 September buffs: how Dorothy grows, which combos to look for, the mulligan and what the list still cannot do.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/cards/cover/dorothy.webp",
    faq: [
      { q: "How does Dorothy grow?", a: "Dorothy can Move each round and has +1⚔️/+1❤️ for each time an ally moved this game. The counter is the whole game, not the round, so every Move you make anywhere makes her bigger." },
      { q: "Which move combos does the deck look for?", a: "Card Soldier, which summons a copy of itself on its previous space after it moves; Pegasus, which doubles its Power after it moves; and Magic Carpet, which moves your other allies one space left or right on reveal." },
      { q: "Is the deck competitive?", a: "The author calls it a fun and ladder deck and says plainly that it is probably not at top-tier level yet, but that after the 21 September buffs something is moving." },
      { q: "How do I try the deck?", a: "Open the deck page on OriginsMeta and press “Open in the deck builder”, or copy the game code (KGBLDC…) into Origins." },
    ],
    body: `
## The deck in one paragraph

**Dorothy Combo** is a **combo** list led by [Dorothy](/en/cards/dorothy), published on OriginsMeta on 22 September 2026 by [Davdas](/en/authors/davdas), a member of the site's staff, and tagged for **ladder** and **fun** play. It is the move deck, rebuilt after the [Demo patch of 21 September 2026](/en/news/demo-patch-notes-0921), which buffed Dorothy, [Roo](/en/cards/roo) and [Magic Carpet](/en/cards/magic-carpet) among others. The author's assessment is on the [deck page](/en/decks/community/dorothy-combo-7503) and we keep it as it is: this is probably not a top-tier list yet, but something is moving.

## The list

Twenty-five cards: the Legendary plus twelve cards played as two copies each.

| Card | Cost | What it does |
| --- | --- | --- |
| [Dorothy](/en/cards/dorothy) ★ | 4 | 1/1; can Move each round, and gets +1⚔️/+1❤️ for each time an ally moved this game |
| [Twister Toss](/en/cards/twister-toss) | 1 | Spell: move an ally |
| [Card Soldier](/en/cards/card-soldier) | 2 | 3/1; after it moves, it summons a copy of itself on its previous space |
| [Roo](/en/cards/roo) | 2 | 2/4 with Move |
| [Basilisk](/en/cards/basilisk) | 2 | 1/2 with Deathtouch |
| [Pegasus](/en/cards/pegasus) | 3 | 2/4; after it moves, it doubles its Power |
| [Flying Monkey](/en/cards/flying-monkey) | 3 | 4/1; On Reveal moves ANY other character to a random space here |
| [Wicked Witch of the West](/en/cards/wicked-witch-of-the-west) | 3 | 1/5; when it survives damage it adds a Flying Monkey to your hand and moves one space to the left |
| [Kanga](/en/cards/kanga) | 3 | 2/3; before combat, allies that moved this round get +1⚔️/+1❤️ |
| [En Passant](/en/cards/en-passant) | 3 | Spell: move an ally and deal its Power to the character across from it |
| [Spellbook](/en/cards/spellbook) | 3 | Spell: from now on, a random spell in hand each round, discarded before combat |
| [Magic Carpet](/en/cards/magic-carpet) | 4 | 4/4; On Reveal moves your other allies one space left, or one space right |
| [Hare](/en/cards/hare) | 5 | 4/1 with First Strike and Move |

Nine units and three spells, and almost everything either moves or rewards a move.

## How the deck wins

Dorothy is a 1/1 that counts: **+1⚔️/+1❤️ for each time an ally moved this game**. The counter does not reset, and it counts moves anywhere on the board, so a cheap spell like [Twister Toss](/en/cards/twister-toss) is never wasted — it is one mana for a permanent point on your Legendary. Played on round five after a few moves, Dorothy lands as a real body and keeps growing every round afterwards, because she moves herself.

Three combos are the point of the list:

1. **Card Soldier plus any move.** A 3/1 for two mana that leaves a copy of itself behind every time it moves: with Twister Toss or Magic Carpet it fills a lane on its own.
2. **Pegasus plus any move.** After it moves it doubles its Power: 2/4 becomes 4/4, and with Kanga's +1⚔️ before combat it is a 5-Power body that the opponent priced at three mana.
3. **Magic Carpet as the engine.** It moves *all* your other allies one space, in the direction you choose: one card, several triggers — a Card Soldier copy, a doubled Pegasus, points on Dorothy, and Kanga's buff on everything that moved.

## Mulligan

There is no note from the author on the mulligan, so this is OriginsMeta's reading. Keep the cheap move enablers, **Twister Toss** and **Roo**, and one of the two bodies that pay you for moving, **Card Soldier** or **Pegasus**. Magic Carpet is the card you want on round four, not in the opening hand. With no cheap card at all, a hand that starts on round three is too slow for a deck that wants its counter running from the first round.

## Round by round

1. **Rounds 1–2: start the counter.** Card Soldier or Roo, then Twister Toss on it. Every move is a permanent point on Dorothy, even when the board looks quiet.
2. **Round 3: pick the lane.** Pegasus, the Witch or Kanga. [Wicked Witch of the West](/en/cards/wicked-witch-of-the-west) is the one that generates on her own: a 1/5 that survives most hits, and each time she does you get a Flying Monkey in hand and she moves one space left — another point for Dorothy.
3. **Round 4: Magic Carpet.** Choose the direction that pushes your Card Soldiers toward a free space and takes Pegasus into a fight it will now win.
4. **Round 5 onwards: Dorothy, then close.** She has cost 4 since the 21 September patch, but round four belongs to the Carpet, and a round later she lands with a higher counter. Hare has First Strike and Move: it hits before the answer and keeps the counter going. [Basilisk](/en/cards/basilisk) with Deathtouch is the cheap answer to a body too big to fight fairly, and En Passant turns a doubled Pegasus into removal.

## What the deck cannot do

The author lists two weaknesses, and they are the honest ones: **you can end up badly stuck with your cards**, and **some combos are not consistent**. Both come from the same place — [Flying Monkey](/en/cards/flying-monkey) moves a character to a *random* space, Card Soldier's copy goes on the space it left, and Magic Carpet moves everything, including allies you wanted where they were. Plan the direction before you play the Carpet, and do not count on a specific space being free.

## Matchups

Ranked data is not public: this is a reading of the lists, not a win rate.

- **Against aggressive decks.** The Witch and Roo hold the early lanes; Basilisk's Deathtouch answers the first big body. Dorothy can wait: she is better late, when the counter is high.
- **Against control decks.** This is the good matchup. Card Soldier copies and Flying Monkeys keep coming back, so a single wipe does not empty your board. Keep one Twister Toss in hand after a wipe to restart the counter.
- **Against other move decks.** Whoever moves more gets the bigger Dorothy, but Flying Monkey moves *any* character: use it to drag an enemy Pegasus out of the space where it was going to double.

## Where to go next

- The [deck page](/en/decks/community/dorothy-combo-7503) has the full list, the charts, the author's notes, “Open in the deck builder” and the game code.
- The buffs behind this list are in the [21 September patch notes](/en/news/demo-patch-notes-0921); MetaShifting tracks every change on [its own page](/en/metashifting).
`,
  },
  "trick-or-treat-legion-guide": {
    slug: "trick-or-treat-legion-guide",
    category: "decks",
    deckList: trickOrTreatLegion,
    tags: {
      communityDecks: [{ slug: "the-trick-or-treat-legion-72c4", name: "The Trick-or-Treat Legion" }],
      cards: ["legion-of-the-dead", "bullseye", "flying-monkey", "golden-egg", "en-passant", "white-queen", "asanbosam", "morgiana", "mind-palace", "thumbelina", "impundulu", "bagheera", "boogeyman"],
    },
    title: "The Trick-or-Treat Legion: how to play the Legion of the Dead deck",
    metaTitle: "Legion of the Dead deck guide",
    excerpt: "The Legion of the Dead list built to be unpredictable: how the Zombie board works, the Golden Egg and Boogeyman combo, the mulligan and the matchups.",
    readTime: 6,
    updated: "2026-09-23",
    image: "/cards/cover/legion-of-the-dead.webp",
    faq: [
      { q: "What does Legion of the Dead do?", a: "It is a 7-mana Legendary spell: it fills your board with Zombies (2⚔️/2❤️). One card, every free space taken." },
      { q: "What is the Golden Egg and Boogeyman combo?", a: "Boogeyman is a 4-mana 7/7 whose On Reveal destroys the ally in its location with the lowest Power, even itself. Golden Egg is a 0/1 that summons a 5/5 Golden Goose on its space when it dies: put the Egg down first, and Boogeyman's ability turns it into a Goose instead of killing your own body." },
      { q: "What do you keep in the mulligan?", a: "Bagheera and Thumbelina, ideally alongside Bullseye. The Golden Egg plus Boogeyman pair is worth keeping in the opening hand too." },
      { q: "Why is Mind Palace important?", a: "The deck empties its hand quickly: without the two cards Mind Palace draws, you run out of plays before the Legendary lands." },
    ],
    body: `
## The deck in one paragraph

**The Trick-or-Treat Legion** is an **evil** list led by [Legion of the Dead](/en/cards/legion-of-the-dead), published on OriginsMeta on 22 September 2026 by [Davdas](/en/authors/davdas), a member of the site's staff, and tagged for **ladder**, **competitive** and **tournament** play. Several versions of the Legion deck are going around; this one, in the author's words, wants to raise its unpredictability, putting together cards that "play a trick" on the opponent's board every round. The full list and the charts are on the [deck page](/en/decks/community/the-trick-or-treat-legion-72c4).

## The list

Twenty-five cards: the Legendary plus twelve cards played as two copies each.

| Card | Cost | What it does |
| --- | --- | --- |
| [Legion of the Dead](/en/cards/legion-of-the-dead) ★ | 7 | Legendary spell: fill your board with Zombies (2⚔️/2❤️) |
| [Bullseye](/en/cards/bullseye) | 1 | Spell: 3 damage to ANY character |
| [Bagheera](/en/cards/bagheera) | 1 | 1/1; On Reveal on a middle space it gets +2⚔️/+2❤️ |
| [Thumbelina](/en/cards/thumbelina) | 1 | 2/2, no ability |
| [Morgiana](/en/cards/morgiana) | 2 | 2/3; prevents ALL On Reveal abilities from happening in its location |
| [Mind Palace](/en/cards/mind-palace) | 2 | Spell: draw 2 cards |
| [Asanbosam](/en/cards/asanbosam) | 3 | 5/5; On Reveal discards a random even-cost card |
| [Golden Egg](/en/cards/golden-egg) | 3 | 0/1; On Death it summons a Golden Goose (5/5) on its space |
| [Flying Monkey](/en/cards/flying-monkey) | 3 | 4/1; On Reveal moves ANY other character to a random space here |
| [En Passant](/en/cards/en-passant) | 3 | Spell: move an ally and deal its Power to the character across from it |
| [Boogeyman](/en/cards/boogeyman) | 4 | 7/7; On Reveal destroys the ally here with the lowest Power, even itself |
| [White Queen](/en/cards/white-queen) | 4 | 3/3; On Reveal returns ANY character to its owner's hand |
| [Impundulu](/en/cards/impundulu) | 5 | 3/6; when it attacks it adds a Lightning Strike to your hand, discarded before combat next round |

Ten units and three spells. The three cheap cards are not filler: this deck needs the board to be its own before the Legendary arrives, because the Zombies only fill *free* spaces.

## How the deck wins

Three cards do the damage — **Boogeyman, Asanbosam and Impundulu** — and everything else exists to protect them or open the way.

- **Boogeyman** is a 7/7 for four mana, which is the best rate in the list, with a catch: on reveal it destroys the ally in its location with the lowest Power, itself included. Put it in an empty lane and it kills itself; put it next to a [Golden Egg](/en/cards/golden-egg) and the Egg dies, leaving a 5/5 Golden Goose on its space. That is the combo the author points at: two cards, a 7/7 and a 5/5.
- **Asanbosam** is a 5/5 for three, and it makes the opponent discard a random even-cost card on reveal.
- **Impundulu** turns every attack into a [Lightning Strike](/en/cards/lightning-strike) in your hand: repeatable damage, as long as you spend it before the next combat.

The **Legendary** closes the game rather than starting it: at seven mana, *Fill your board with Zombies* takes every free space at once. It is at its best the round after a trade has emptied your side, or into the two locations you were not contesting.

## The "tricks"

[En Passant](/en/cards/en-passant), [Flying Monkey](/en/cards/flying-monkey) and [White Queen](/en/cards/white-queen) are what the author means by playing a trick every round.

- **En Passant** moves an ally and deals its Power to the character across from it: on Boogeyman or a Golden Goose it is five to seven damage that also repositions.
- **Flying Monkey** moves ANY other character to a random space in its location: it drags an enemy blocker out of the lane, or brings your own body where the fight is. The space is random, so it is a trick, not a plan.
- **White Queen** returns ANY character to its owner's hand: an enemy finisher goes away for a round, or your own Golden Egg comes back to be replayed next to a second Boogeyman.

[Morgiana](/en/cards/morgiana) is the quiet one: in her location no On Reveal happens at all, for either side. Play her where the opponent's On Reveals hurt most — but remember she stops yours too, including Boogeyman's.

## Mulligan

The author's note is short and clear: **Bagheera and Thumbelina are perfect starts alongside Bullseye**, and **Golden Egg plus Boogeyman can decide the game even from the opening hand**. Bagheera on a middle space is a 3/3 for one mana; Thumbelina is a plain 2/2, which at one mana is board presence you do not have to think about.

## Round by round

1. **Rounds 1–2: take space cheaply.** Bagheera in the middle, Thumbelina wherever you expect to fight, Bullseye on anything with three Health.
2. **Round 3: the first threat.** Asanbosam as a 5/5, or the Golden Egg in the lane where Boogeyman is going next round.
3. **Round 4: Boogeyman.** Into the Egg if you have it, otherwise next to the smallest body you can afford to lose — and never into an empty lane.
4. **Rounds 5–6: pressure and cards.** Impundulu starts producing Strikes; Mind Palace refills the hand. The author is explicit about it: without Mind Palace the deck runs out of cards too early.
5. **Round 7: Legion of the Dead.** Every free space becomes a 2/2. Count the spaces before you play it: after a round where you traded a lot it is worth two or three bodies more.

## Matchups

Ranked data is not public, so this is OriginsMeta's reading of the lists.

- **Against go-wide decks.** The Zombies arrive on free spaces, so the wider the opponent is, the less the Legendary does for you. Use Bullseye and Boogeyman to open the board first, and keep Flying Monkey for the buffed body.
- **Against control decks.** Asanbosam's discard and Impundulu's Strikes are the pressure that does not depend on the board surviving. Hold one Boogeyman back after a wipe: a 7/7 for four is the fastest way to rebuild.
- **Against On Reveal decks** (for example [On Reveal Mid Range](/en/decks/community/on-reveal-mid-range-772e), which repeats every On Reveal with Mulan). This is where Morgiana earns her place: put her in the location where they are stacking abilities, accept that your own On Reveals stop there too, and fight the other two lanes normally.

## The weaknesses, in the author's words

Two, from the deck page: **Mind Palace is very important, so you do not run out of cards too early**, and **Boogeyman needs a valid target, or Morgiana**. The second is worth repeating: the 7/7 body is only good if something else in that location has less Power. The Golden Egg is the cheapest insurance, the Zombies from the Legendary are the late-game one.

## Where to go next

- The [deck page](/en/decks/community/the-trick-or-treat-legion-72c4) has the list with the charts, the author's notes, “Open in the deck builder” and the game code (KGBLDC…).
- Card stats are those of the Demo 2.0 with the [21 September patch](/en/news/demo-patch-notes-0921).
`,
  },
  "three-pigs-midrange-guide": {
    slug: "three-pigs-midrange-guide",
    category: "decks",
    deckList: threePigsMidRange,
    tags: {
      communityDecks: [{ slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" }],
      cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    },
    title: "3 Pigs Mid Range: how to play the Three Not So Little Pigs midrange deck",
    metaTitle: "Three Not So Little Pigs deck guide",
    excerpt: "Game plan, mulligan and round-by-round play for 3 Pigs Mid Range, the midrange deck led by Three Not So Little Pigs, for ladder and competitive.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/cards/cover/three-not-so-little-pigs.webp",
    faq: [
      { q: "Which Legendary leads 3 Pigs Mid Range?", a: "Three Not So Little Pigs, a 7-mana 3/3 with Trample: its On Reveal summons a Not So Little Pig with Trample at each other location, so one card puts a body in every lane." },
      { q: "What do you keep in the mulligan?", a: "Always look for Bagheera, Ali Baba, Big Bad Wolf and Rumple. Against decks with dangerous 4-Health cards such as Van Helsing or Glinda, keep Axe Throw too." },
      { q: "How does the deck close a game?", a: "With En Passant, which moves an ally and hits the character across from it; with Ellen Trechend, whose Trample pushes damage through into the barrier; and with the Lightning Strikes that Impundulu adds to your hand every time it attacks." },
      { q: "How do I try the deck?", a: "Open the deck page on OriginsMeta and press “Open in the deck builder”, or “Copy game code” to paste the game code (KGBLDC…) into Origins. The builder checks the 1 Legendary + 12 cards × 2 rule." },
    ],
    body: `
## The deck in one paragraph

**3 Pigs Mid Range** is the second deck published on OriginsMeta by [Davdas](/en/authors/davdas), a member of the site's staff, on 15 September 2026. It is a **midrange** list led by [Three Not So Little Pigs](/en/cards/three-not-so-little-pigs), tagged for **ladder** and **competitive** play. The idea is simple: win the board in the first rounds, get ahead in at least one location and then close with cards that punish an opponent who thinks they are safe behind a barrier. The full list, the composition charts and the game code are on the [deck page](/en/decks/community/3-pigs-mid-range-6311); this guide explains how to pilot it. A second guide covers [matchups, key interactions and Conquest](/en/guides/three-pigs-midrange-matchups).

## The list

Twenty-five cards: the Legendary plus twelve cards played as two copies each.

| Card | Cost | Role |
| --- | --- | --- |
| [Three Not So Little Pigs](/en/cards/three-not-so-little-pigs) ★ | 7 | Legendary: Trample, and On Reveal it summons a Not So Little Pig with Trample at each other location |
| [Bagheera](/en/cards/bagheera) | 1 | One-drop that grows when played on a middle space |
| [Rumple](/en/cards/rumple) | 2 | 2/2 that gives you +1 mana next round |
| [Axe Throw](/en/cards/axe-throw) | 2 | 4 damage to any character |
| [Mind Palace](/en/cards/mind-palace) | 2 | Draw 2 cards |
| [Piglet](/en/cards/piglet) | 2 | On Reveal buff to the other allies in its location |
| [Big Bad Wolf](/en/cards/big-bad-wolf) | 3 | 3/3 that gets +1/+1 after every combat |
| [Wicked Witch of the West](/en/cards/wicked-witch-of-the-west) | 3 | 1/5: when she survives damage she adds a Flying Monkey to your hand and moves one space to the left |
| [En Passant](/en/cards/en-passant) | 3 | Move an ally and deal its Power in damage to the character across from it |
| [Ali Baba](/en/cards/ali-baba) | 3 | 2/3 that draws a card when it damages the opponent's barrier |
| [Frog Prince](/en/cards/frog-prince) | 3 | Choose +3 Power or +3 Health on reveal |
| [Impundulu](/en/cards/impundulu) | 5 | 3/6: every time it attacks it adds a Lightning Strike to your hand |
| [Ellen Trechend](/en/cards/ellen-trechend) | 8 | Trample; On Reveal it grows for every enemy card in its location |

Nine units and three spells. Everything except Impundulu, the Pigs and Ellen Trechend costs three mana or less, which is why the author calls the curve "very solid": there is always something to play in rounds one to four.

## How the deck wins

The plan, from the deck page: take control of the board in the first rounds, get ahead in at least one location, then close with three cards.

- **En Passant** moves an ally and deals damage equal to its Power to the character across from it: it clears the way for one of your big bodies, or turns a grown Big Bad Wolf into removal.
- **Ellen Trechend** has Trample and grows on reveal for every enemy card in her location: the more the opponent has committed to a lane, the harder she hits, and Trample sends the excess damage through the blocker into the barrier. The deck page calls her "a closer on the edge of illegal".
- **Impundulu**, if you have played the early rounds well, rewards you with a Lightning Strike every time it attacks. Each Strike must be used before the next combat or it is discarded, so budget two mana each round for it.

The Legendary is the bridge between the two phases. At seven mana Three Not So Little Pigs puts a pig with Trample in each of the other two locations with a single card, on top of its own 3/3 Trample body. Played on curve it refills the whole board the round before Ellen Trechend comes online.

## Mulligan

Always look for **Bagheera, Ali Baba, Big Bad Wolf and Rumple**: they give a good start on curve and support the pigs already in play. Against decks with dangerous 4-Health cards, such as Van Helsing or Glinda, keep **Axe Throw** too: it deals exactly four damage to any character. Ellen Trechend and Impundulu are not what you want in the opening hand: the deck finds them later with Mind Palace and Ali Baba.

## Round by round

1. **Rounds 1–3: take the board.** Bagheera on a middle space, then Rumple or Piglet, then a three-drop. Rumple on round two means four mana on round three, which is a Wolf plus Bagheera or a Witch plus a spell. The Wicked Witch of the West is the wall of the deck: with five Health she survives most early hits, and every time she does you get a Flying Monkey in hand and she shifts one space to the left.
2. **Rounds 4–6: pick a lane and press it.** Ali Baba wants to hit a barrier: every time it does you draw. Frog Prince is either a 5/2 that trades up or a 2/5 that holds a lane; choose after you have seen what the opponent revealed. Impundulu comes down on five and starts producing Lightning Strikes from its first attack.
3. **Rounds 7–8: the finishers.** The Pigs on seven (or on six with a Rumple the round before), Ellen Trechend on eight into the location where the opponent has the most cards. Use En Passant the same round to move a threat where it is not expected, or to remove the one blocker in the way.

## Keeping the curve

The deck page is clear about the main weakness: "falling off curve lowers its potential a lot". The list has no board wipe and nothing that heals your barriers, so every round you skip is a round the opponent gets for free. Two habits help. Do not hold Rumple for a "perfect" turn: the extra mana is worth more early. And do not keep Lightning Strikes in hand hoping for a better target: a Strike used on a barrier is still three damage that you would otherwise lose.

## Where to go next

- The [deck page](/en/decks/community/3-pigs-mid-range-6311) has the list with mana curve, saga and keyword charts, the author's notes, the “Open in the deck builder” button for the [deck builder](/en/deck-builder) and the game code (KGBLDC…) to paste into Origins.
- [Matchups, key interactions and Conquest](/en/guides/three-pigs-midrange-matchups) is the second part of this guide.
- Card stats are those of the demo patch of 21 September 2026, checked in the game on 22 September. Several cards in this list were touched in 0.6.2 and 0.6.3, and on 21 September Frog Prince stopped clearing pre-existing buffs: check the balance history on each card page.
`,
  },
  "three-pigs-midrange-matchups": {
    slug: "three-pigs-midrange-matchups",
    category: "decks",
    deckList: threePigsMidRange,
    tags: {
      communityDecks: [
        { slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" },
        { slug: "healing-healsing-9411", name: "Healing Healsing" },
      ],
      cards: ["three-not-so-little-pigs", "rumple", "wicked-witch-of-the-west", "flying-monkey", "en-passant", "big-bad-wolf", "impundulu", "lightning-strike", "piglet", "ellen-trechend", "axe-throw", "frog-prince", "van-helsing", "boitata", "mulan", "robin-hood", "king-arthur"],
    },
    title: "3 Pigs Mid Range: matchups, key interactions and Conquest",
    metaTitle: "Three Not So Little Pigs deck matchups",
    excerpt: "Part two of the 3 Pigs Mid Range guide: the interactions that win games, how to play the main matchups, the mistakes to avoid and Conquest.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-board-clash.webp",
    faq: [
      { q: "What does Ellen Trechend do against a wide board?", a: "She grows on reveal for every enemy card in her location and has Trample, so a lane the opponent has filled becomes her best target: the damage that exceeds the blocker's Health goes into the barrier." },
      { q: "How do you play against Van Helsing decks?", a: "Keep Axe Throw for Van Helsing, who has four Health, pressure early before Forbidden Knowledge comes online at eight mana, and aim Lightning Strikes at characters rather than barriers while Boitata is on the board." },
      { q: "Can 3 Pigs Mid Range and Healing Healsing be played together in Conquest?", a: "Yes. The two decks have different Legendaries and share a single card, Ali Baba, so they are twelve unique cards apart, Legendary included: more than the 8 the Crimson Cup requires between each pair of decks." },
    ],
    body: `
## Before you start

This is the second part of the guide to **3 Pigs Mid Range**, the midrange deck led by [Three Not So Little Pigs](/en/cards/three-not-so-little-pigs) that [Davdas](/en/authors/davdas), OriginsMeta staff, published on 15 September 2026. The [first part](/en/guides/three-pigs-midrange-guide) covers the list, the game plan, the mulligan and the round-by-round play. Here we look at the interactions that decide games, at the matchups and at the format the deck is tagged for. The author's notes are on the [deck page](/en/decks/community/3-pigs-mid-range-6311); the matchup reading below is OriginsMeta's, based on the card texts of patch 0.6.3; the changes of the demo patch of 21 September are in [MetaShifting](/en/metashifting).

## Five interactions to know

1. **Rumple into the finishers.** Rumple gives you +1 mana next round. Played on round five it lets you reveal Three Not So Little Pigs on round six, a full round before the opponent expects a seven-drop; played on round six it puts Ellen Trechend on the board on round seven.
2. **The Wicked Witch and her Flying Monkey.** The Witch is a 1/5: she rarely dies to a single hit, and each time she survives damage you get a [Flying Monkey](/en/cards/flying-monkey) in hand and she moves one space to the left. The Monkey's On Reveal moves any other character, yours or theirs, to a random space in its location: use it to drag an enemy blocker out of the lane you are trampling through, or to bring a Wolf where the fight is.
3. **En Passant on a grown body.** The spell moves an ally and deals damage equal to its Power to the character across from it. On a Big Bad Wolf that has fought twice it is five damage plus a repositioning; on Ellen Trechend it is removal that also moves her Trample to where the barrier is weakest. It is also the answer to a blocker parked in front of one of your pigs.
4. **Impundulu's Lightning Strikes.** Every attack adds a [Lightning Strike](/en/cards/lightning-strike), two mana for three damage to any character or barrier, which must be used before the next combat. That is a repeatable, targeted three damage: enough for most early drops in the current card pool, or a direct hit on a barrier when the board is already yours.
5. **Piglet on the pigs.** Piglet's On Reveal buffs the other allies in its location. The round after the Pigs, a Piglet next to a Not So Little Pig makes a Trample body that hits harder: the deck page notes that the mulligan cards "support the pigs already on the board".

## Matchups

Ranked data is not public yet, so what follows is a reading of the lists, not a win rate.

**Against Van Helsing control, for example [Healing Healsing](/en/decks/community/healing-healsing-9411), by the same author.** This is the matchup the mulligan note has in mind when it says to keep Axe Throw: Van Helsing is a 3/4, and four damage removes him before his Tools start coming every combat. Push damage early, because the control deck wants to reach eight mana for Forbidden Knowledge, which destroys every character on the board, yours and theirs. Do not put the Pigs and Ellen Trechend down in the same window: hold one finisher for the round after the wipe. While Boitata is in play, spell damage to their barriers is dealt to yours instead, so aim Lightning Strikes at characters until it is gone.

**Against go-wide boards (Swarm-style lists, Mulan).** The wider they go, the bigger Ellen Trechend gets: she grows for every enemy card in her location. Keep the Witch as the wall on the lane they are flooding, play Frog Prince as a 2/5 rather than a 5/2, and save Axe Throw for the card that buffs the others. [Mulan](/en/cards/mulan) repeats the On Reveal abilities of her allies, so she is the priority target.

**Against other midrange decks (King Arthur, Robin Hood).** Tempo decides: whoever falls off curve loses. Rumple is at its best here, and Impundulu's Strikes are the difference on an even board. [Robin Hood](/en/cards/robin-hood)'s On Reveal deals 2 damage to all enemies, which kills Bagheera, Piglet and a fresh Rumple but not the Witch or a Frog Prince played as a 2/5: at eight mana, do not overload a lane with small units. [King Arthur](/en/cards/king-arthur) gives Shield to Good characters, so keep Axe Throw for after the Shield has been used.

## Mistakes to avoid

- **Playing the Pigs as a rescue.** The Legendary summons pigs on random spaces of the other locations: it is at its best when those lanes already have a Wolf or a Witch to fight alongside, not when everything is already lost.
- **Holding Rumple.** It is a 2/2 body with a bonus, and the bonus is worth the most in rounds two to six.
- **Wasting Lightning Strikes.** They are discarded before the next combat: a Strike into a barrier is better than a Strike lost.
- **Forgetting the weaknesses.** The deck page lists them: no mass removal and no healing for your barriers. Do not race a deck that heals unless you are already ahead on the board.

## Conquest and the "competitive" tag

The deck is tagged for both ladder and competitive play. Conquest, the format first used at Big Bob's Playtest Battle, is also the format of the [Crimson Cup](/en/news/crimson-cup-format-check-in) at the Steam Next Fest: you register three decks with different Legendaries, with at least 8 unique cards between each pair of decks (rules announced on 24 September 2026). 3 Pigs Mid Range pairs naturally with the same author's other list, [Healing Healsing](/en/decks/community/healing-healsing-9411): different Legendaries, and the only card they share is Ali Baba, so they are twelve unique cards apart, Legendary included. The [deck builder](/en/deck-builder) counts the difference for you in tournament mode.
`,
  },
  "healing-healsing-guide": {
    slug: "healing-healsing-guide",
    category: "decks",
    deckList: healingHealsing,
    tags: {
      communityDecks: [{ slug: "healing-healsing-9411", name: "Healing Healsing" }],
      cards: ["van-helsing", "van-helsings-tools", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "spellbook", "phuong-hoang", "jekyll", "searing-light", "boitata", "tin-woodman", "forbidden-knowledge"],
    },
    title: "Healing Healsing: how to play the Van Helsing control deck",
    metaTitle: "Van Helsing deck guide: Healing Healsing",
    excerpt: "Game plan, mulligan and round-by-round play for Healing Healsing, the Van Helsing control deck that heals, draws and resets the board.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/cards/cover/van-helsing.webp",
    faq: [
      { q: "Which Legendary leads Healing Healsing?", a: "Van Helsing, a 4-mana 3/4: before every combat he adds Van Helsing's Tools to your hand if you do not have it, a Choose One card that plays Holy Water, Silver Bullet, Garlic or Wooden Stake." },
      { q: "What do you keep in the mulligan?", a: "Keep Ali Baba, Baby Bear, Scarecrow, Van Helsing and Spellbook; against aggro keep Jill too. Shahrazad and Phuong Hoang are not what you want in the first rounds." },
      { q: "When do you cast Forbidden Knowledge?", a: "At eight mana, so from round eight or nine, ideally in a round where the opponent reveals first: they commit their cards, then the spell destroys every character on the board." },
      { q: "How does the deck win if it destroys its own board too?", a: "On card advantage: Spellbook, Scarecrow and Ali Baba keep the hand full, Baby Bear leaves Papa Bear behind when it dies, Jekyll turns into Hyde in hand, and the heals make Phuong Hoang grow until the opponent runs out of answers." },
    ],
    body: `
## The deck in one paragraph

**Healing Healsing** was the first deck published on OriginsMeta, on 15 September 2026, by [Davdas](/en/authors/davdas), a member of the site's staff. It is a **control** list led by [Van Helsing](/en/cards/van-helsing), tagged for the **ladder**. The plan is to survive the early rounds while taking value, to heal through the damage while [Phuong Hoang](/en/cards/phuong-hoang) grows with every heal, and to reset the board with [Forbidden Knowledge](/en/cards/forbidden-knowledge) once you have eight mana. The full list, the composition charts and the game code are on the [deck page](/en/decks/community/healing-healsing-9411); this guide explains how to pilot it. A second guide covers [matchups, key interactions and the mistakes to avoid](/en/guides/healing-healsing-matchups).

## The list

Twenty-five cards: the Legendary plus twelve cards played as two copies each.

| Card | Cost | Role |
| --- | --- | --- |
| [Van Helsing](/en/cards/van-helsing) ★ | 4 | Legendary: before combat he adds Van Helsing's Tools to your hand if you do not have it |
| [Baby Bear](/en/cards/baby-bear) | 2 | Pings enemies that damage your barrier; On Death adds Papa Bear to your hand |
| [Scarecrow](/en/cards/scarecrow) | 2 | On Reveal: draw a card |
| [Shahrazad](/en/cards/shahrazad) | 2 | 1/4: heals 1 damage from your barrier every time a card enters your hand |
| [Ali Baba](/en/cards/ali-baba) | 3 | 2/3 that draws a card when it damages the opponent's barrier |
| [Jill](/en/cards/jill) | 3 | 2/4: heals 2 damage from your barrier every time she takes damage |
| [Spellbook](/en/cards/spellbook) | 3 | For the rest of the game, a random spell in hand at the start of every round |
| [Phuong Hoang](/en/cards/phuong-hoang) | 4 | Rebirth, Move; gets +1/+1 every time an ally or barrier is healed |
| [Jekyll](/en/cards/jekyll) | 4 | On Reveal heals 3; if still in hand after combat he becomes Hyde, a 5/3 with Trample |
| [Searing Light](/en/cards/searing-light) | 4 | 4 damage to an enemy and 4 healing to your barrier there |
| [Boitata](/en/cards/boitata) | 5 | 5/5: spell and ability damage to your barriers is dealt to the opponent's barrier instead |
| [Tin Woodman](/en/cards/tin-woodman) | 6 | On Reveal heals 8 from any other character or barrier in its location |
| [Forbidden Knowledge](/en/cards/forbidden-knowledge) | 8 | Destroy all characters |

Nine units and three spells; almost everything costs between two and four, with Boitata, Tin Woodman and Forbidden Knowledge on top. Three cards draw, five heal, one wipes the board.

## How the deck wins

The plan from the deck page, in four steps:

1. **Control the first rounds** while taking value quickly with Spellbook and Ali Baba.
2. **Reach round eight or nine** and cast Forbidden Knowledge to take the initiative. Try to cast it in a round where the opponent is the first to reveal, so their cards are on the board when the spell resolves.
3. **Win on card advantage and value.** The opponent's deck should run out of resources while you still have enough healing to scale Phuong Hoang's damage.
4. **Keep control.** The extra cards let you hold the board for a long time.

Two engines make this work. The first is **cards entering your hand**: Van Helsing adds his Tools before every combat, Spellbook adds a spell at the start of every round, Scarecrow and Ali Baba draw, and each of those cards heals 1 through Shahrazad. The second is **healing**: every heal, from Shahrazad's single point to Tin Woodman's eight, gives Phuong Hoang +1/+1. A Phuong that has been on the board for a few rounds is the deck's real threat, and she also carries the Rebirth and Move keywords (see her card page).

## Van Helsing's Tools

The Legendary himself is a 3/4 for four mana. What matters is the card he adds before every combat when you do not already have it: [Van Helsing's Tools](/en/cards/van-helsings-tools), free since patch 0.6.2, lets you choose one of four effects.

- [Holy Water](/en/cards/holy-water): remove all abilities from any character.
- [Silver Bullet](/en/cards/silver-bullet): damage to any character.
- [Garlic](/en/cards/garlic): Stun any character.
- [Wooden Stake](/en/cards/wooden-stake): destroy any damaged character.

"If you do not have it" is the clause to remember: use the Tools every round, or Van Helsing stops adding them. Wooden Stake is the single-target removal the deck page says the list otherwise lacks: damage a character with Baby Bear's ping, Searing Light or the Silver Bullet, then stake it.

## Mulligan

Keep **Ali Baba, Baby Bear, Scarecrow, Van Helsing and Spellbook**. Against aggressive decks keep **Jill** too: she heals 2 from your barrier every time she takes damage. Shahrazad and Phuong Hoang are not useful in the first rounds: they are the payoff, not the setup, so send them back.

## Round by round

1. **Rounds 1–3: set up.** Scarecrow or Baby Bear on two, Spellbook or Ali Baba on three. Spellbook is the best round-three play: from then on you start every round with an extra spell, and Shahrazad turns each of them into a heal.
2. **Rounds 4–5: Van Helsing and the first heals.** Van Helsing on four, or Jekyll to heal a damaged unit or barrier. Phuong Hoang comes down once at least one heal source is on the board. Boitata on five: from then on, spell and ability damage to any of your barriers is dealt to the opponent's barrier in that location instead.
3. **Rounds 6–7: stabilise.** Tin Woodman's eight points of healing on the barrier under pressure, Searing Light on the biggest threat, Tools every combat.
4. **Round 8 or 9: Forbidden Knowledge.** Everything dies, on both sides. Your side loses less: Baby Bear leaves Papa Bear in your hand, a Jekyll kept in hand has already become Hyde, the Tools come back before the next combat, and you have been drawing more cards than the opponent all game.

## Where to go next

- The [deck page](/en/decks/community/healing-healsing-9411) has the list with mana curve and keyword charts, the author's notes, the “Open in the deck builder” button for the [deck builder](/en/deck-builder) and the game code (KGBLDC…) to paste into Origins.
- [Matchups, key interactions and mistakes to avoid](/en/guides/healing-healsing-matchups) is the second part of this guide.
- Card stats are those of the demo patch of 21 September 2026, checked in the game on 22 September. Scarecrow, Van Helsing's Tools and other cards in this list were changed in 0.6.2 and 0.6.3, and since 21 September Wooden Stake can also target full-health characters: see the balance history on each card page.
`,
  },
  "healing-healsing-matchups": {
    slug: "healing-healsing-matchups",
    category: "decks",
    deckList: healingHealsing,
    tags: {
      communityDecks: [
        { slug: "healing-healsing-9411", name: "Healing Healsing" },
        { slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" },
      ],
      cards: ["van-helsing", "shahrazad", "spellbook", "phuong-hoang", "jekyll", "hyde", "boitata", "baby-bear", "papa-bear", "mama-bear", "jill", "tin-woodman", "forbidden-knowledge", "holy-water", "ellen-trechend", "axe-throw", "mulan", "queen-of-hearts"],
    },
    title: "Healing Healsing: matchups, key interactions and mistakes to avoid",
    metaTitle: "Van Helsing deck matchups: Healing Healsing",
    excerpt: "Part two of the Healing Healsing guide: the healing and card-draw interactions, the main matchups, the mistakes that lose to aggro, Conquest.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-board-combat.webp",
    faq: [
      { q: "What is the strongest interaction in Healing Healsing?", a: "Shahrazad with Van Helsing and Spellbook: the Tools before every combat and the spell at the start of every round each heal 1 through Shahrazad, and every heal gives Phuong Hoang +1/+1." },
      { q: "How do you play against 3 Pigs Mid Range?", a: "Do not fill a lane: Ellen Trechend grows for every enemy card in her location. Keep Boitata for the Lightning Strikes, heal through the pigs' Trample damage and save Forbidden Knowledge for the round after the Pigs come down." },
      { q: "What loses games with this deck?", a: "Casting Forbidden Knowledge too early, letting Van Helsing's Tools sit in hand so he stops adding them, and playing Phuong Hoang before there is anything to heal." },
    ],
    body: `
## Before you start

This is the second part of the guide to **Healing Healsing**, the Van Helsing control deck that [Davdas](/en/authors/davdas), OriginsMeta staff, published on 15 September 2026 as the first community deck of the site. The [first part](/en/guides/healing-healsing-guide) covers the list, the game plan, the mulligan and the round-by-round play. Here we look at the interactions that decide games, at the matchups and at the mistakes that cost the most. The author's notes are on the [deck page](/en/decks/community/healing-healsing-9411); the matchup reading below is OriginsMeta's, based on the card texts of patch 0.6.3; the changes of the demo patch of 21 September are in [MetaShifting](/en/metashifting).

## Five interactions to know

1. **Shahrazad and everything that puts a card in your hand.** [Shahrazad](/en/cards/shahrazad) heals 1 damage from your barrier in her location whenever a card enters your hand. Van Helsing adds his Tools before every combat, Spellbook adds a spell at the start of every round, Scarecrow and Ali Baba draw, Baby Bear's death adds Papa Bear. With Shahrazad and Van Helsing on the board you heal every single round without spending a card.
2. **Every heal feeds Phuong Hoang.** [Phuong Hoang](/en/cards/phuong-hoang) gets +1/+1 whenever an ally or barrier is healed. Tin Woodman's On Reveal is one heal of eight points, so it is one +1/+1; Shahrazad's many small heals are worth more to Phuong than one big one.
3. **Jekyll and Hyde.** [Jekyll](/en/cards/jekyll)'s On Reveal heals 3 from any other character or barrier in his location. Kept in hand after combat he becomes [Hyde](/en/cards/hyde), a 5/3 with Trample, and a Hyde kept in hand becomes Jekyll again: the same card is a healer or a finisher depending on when you play it.
4. **Boitata against burn.** If a spell or ability would damage one of your barriers, [Boitata](/en/cards/boitata) deals that damage to the opponent's barrier in that location instead. Against decks that finish games with Lightning Strike or Searing Light, Boitata turns their reach into yours.
5. **Baby Bear's family.** [Baby Bear](/en/cards/baby-bear) pings any enemy that damages your barrier in its location and, when it dies, adds [Papa Bear](/en/cards/papa-bear) to your hand; Papa Bear pings harder and adds [Mama Bear](/en/cards/mama-bear) when it dies, and Mama Bear destroys enemies that damage your barrier. Three bodies for one two-mana card, and the ideal thing to have on the board when Forbidden Knowledge resolves.

## Matchups

Ranked data is not public yet, so what follows is a reading of the lists, not a win rate.

**Against 3 Pigs Mid Range (the same author's [other deck](/en/decks/community/3-pigs-mid-range-6311)) and other midrange lists.** Their finisher, Ellen Trechend, grows for every enemy card in her location: spread your units rather than stacking one lane. Impundulu's Lightning Strikes are exactly what Boitata is for. Axe Throw deals four damage, which is exactly Van Helsing's Health: expect him to be answered, and do not rely on him alone for removal. The Pigs come down at seven mana and fill every lane with Trample: that is the round to hold Forbidden Knowledge for, one round later.

**Against aggro and go-wide decks.** This is the matchup the mulligan note has in mind when it says to keep Jill: every time she takes damage she heals 2 from your barrier. Baby Bear punishes each attacker that gets through, Jekyll heals what matters, Tin Woodman's eight points reset a barrier. Do not chase their units with the Tools one by one; stabilise the barrier, reach eight mana and let Forbidden Knowledge take the whole board.

**Against other control decks.** Card advantage decides, and this deck has more draw than most: Spellbook is the card to protect and to play first. Keep Hyde for a lane that has been left empty, and save Holy Water for a Legendary whose ability carries the opposing deck, such as [Mulan](/en/cards/mulan), who repeats her allies' On Reveal abilities, or the [Queen of Hearts](/en/cards/queen-of-hearts), who repeats their On Death abilities.

## Mistakes to avoid

- **Casting Forbidden Knowledge too early.** The advice on the deck page is to wait for a round where the opponent reveals first, so their cards are on the board when it resolves. A wipe into an empty lane is a wasted eight mana.
- **Letting the Tools sit in hand.** Van Helsing only adds them if you do not have them. Use them every combat, even on a small target.
- **Phuong Hoang before the heals.** A 2/3 for four mana with nothing to grow from is a weak card; the same card after Shahrazad and Spellbook are set up is the win condition. The mulligan note puts her, with Shahrazad, among the cards not to keep in the opening hand.
- **Treating draw as a luxury.** The deck page warns that "not finding Forbidden Knowledge when you need it can be very painful": Scarecrow, Ali Baba and Spellbook are how you find it, so play them early even when the board does not require them.

## Conquest

The deck is tagged for the ladder only, but it fits a Conquest line-up: a different Legendary from 3 Pigs Mid Range and a single card in common, Ali Baba, so the two lists are twelve unique cards apart, Legendary included: more than the 8 the [Crimson Cup](/en/news/crimson-cup-format-check-in) requires between each pair of decks. The [deck builder](/en/deck-builder) counts the difference in tournament mode.
`,
  },
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    category: "game",
    tags: { cards: ["mulan", "queen-of-hearts"] },
    title: "Origins TCG explained in five minutes",
    excerpt: "What Origins TCG is, how a match works across three lanes with simultaneous turns, what free-to-compete means and how to play the demo today.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/media/ss-board-locations.webp",
    faq: [
      { q: "What is Origins TCG?", a: "A digital trading card game by Koin Games, a studio based in Tampa, Florida and founded in 2021. Its cast is made of public-domain legends — Robin Hood, Mulan, the Queen of Hearts, Dracula and many more — reimagined in one original world." },
      { q: "How long does a match last?", a: "About seven minutes. Both players act at the same time across three lanes, so nobody waits for the opponent's turn." },
      { q: "How many cards are there in a deck?", a: "Twenty-five in the current demo, built around one Legendary with a signature ability. Mulan repeats your allies' On Reveal abilities, the Queen of Hearts repeats their On Death abilities." },
      { q: "Can I play Origins TCG for free?", a: "Yes. The demo on Steam is free and includes the tutorial, missions against bosses with their own AI and online play. Every card you need to play competitively is earned by playing; money only buys collectible versions of cards." },
    ],
    body: `
## What it is

Origins TCG is a digital trading card game by **Koin Games**, a studio based in Tampa, Florida, founded in 2021 by industry veterans. Its cast is made of public-domain legends reimagined in one original world: Robin Hood, Mulan, the Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula and many more.

The pitch is **free-to-compete**: every card you need to play competitively is earned by playing. Money only buys collectible versions of cards, which can be graded, traded and sold. The developers call it "zero pay-to-win".

## How a match works

- **Three lanes.** You and your opponent fight on three boards at once. Each lane has its own location, drawn from a pool of more than a hundred that rotate and change the rules of that board.
- **Simultaneous turns.** Both players act at the same time, so there is no waiting. A match lasts about seven minutes.
- **Cards attack.** Unlike pure "lane counting" games, units fight each other: Power is what you hit for, Health is what you can take.
- **Keywords.** The demo uses On Reveal (triggers when the card is played), On Death, First Strike, Double Attack and Deathtouch, among others.
- **One Legendary leads the deck.** In the current demo decks are 25 cards and every deck is built around a Legendary card with a signature ability: Mulan repeats your allies' On Reveal abilities, the Queen of Hearts repeats their On Death abilities. The Demo 2.0 has eleven of them: [all 11 Legendaries, card by card](/en/guides/origins-tcg-legendaries).

## Modes

The demo has a tutorial, missions against bosses with their own AI, and online play. Patch 0.6.1 added a **ranked ladder** with divisions up to Grandmaster, a world leaderboard and Victory Points. It switches on in the demo with Steam Next Fest: what is confirmed so far is in our [Origins TCG ranked guide](/en/guides/origins-tcg-ranked).

## How to play today

1. Install the free demo from the [Steam page](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Demo players earn exclusive collectibles that will be tradeable when the full game launches.
2. Join the [official Discord](https://discord.gg/originstcg) for tournaments, AMAs with the team and the playtests of the next builds.
3. The Steam page lists English, French, Italian and German for the interface, with full audio in English only; on 25 September 2026 the demo also had its interface and card texts in Spanish, which Steam does not list yet (checked in the game). Mobile is planned for 2027.

## Where the game is going

The Steam page lists the release for Q4 2026, with no more precise date. The demo got its first big update on 21 September 2026, ranked mode switches on with Steam Next Fest (19–26 October 2026) and the studio's biggest tournament so far, the Crimson Cup, runs 20–25 October. On 25 September the demo's main menu showed the Kickstarter as "Coming soon – Oct 27". See the [roadmap](/en/guides/roadmap-and-dates) and our [Kickstarter guide](/en/guides/origins-tcg-kickstarter).
`,
  },
  "roadmap-and-dates": {
    slug: "roadmap-and-dates",
    category: "events",
    title: "Roadmap and dates: from the demo to launch",
    metaTitle: "Origins TCG roadmap and release dates",
    excerpt: "Every confirmed Origins TCG date, from the first Steam post to the Demo 2.0 update and the Crimson Cup at Next Fest, plus what is planned for 2027.",
    readTime: 4,
    updated: "2026-09-25",
    image: "/media/art-the-club.webp",
    faq: [
      { q: "When does Origins TCG launch on Steam?", a: "The Steam store page lists the release for Q4 2026, with no more precise date. The demo got its first big update on 21 September 2026, and ranked mode switches on with Steam Next Fest, 19–26 October 2026." },
      { q: "When is the Crimson Cup?", a: "From 20 to 25 October 2026, during Steam Next Fest: regional qualifiers on the 20th, 21st and 22nd, then playoffs and finals. Prizes are worth $10,000 and include an exclusive 1/1 promo card." },
      { q: "Is there a mobile version of Origins TCG?", a: "Not yet. The mobile version and pack opening on phone are announced for 2027. The game soft-launched on the App Store in selected regions in November 2025, before the studio moved card trading to Steam." },
      { q: "When did the free demo come out?", a: "On 15–16 July 2026, on Steam, with exclusive collectibles for demo players. The ranked ladder came later, with patch 0.6.1 on 14 August 2026." },
    ],
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
| 14 August | [Patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414): ranked ladder |
| 19 August | Creator Program AMA |
| 21 August | [Patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961): 23 cards rebalanced |
| 27 August | [Patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 28 August | Big Bob's Playtest Battle, first Conquest tournament, 130+ registered |
| 9 September | [Next Fest tournament announced](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 10 September | Kickstarter AMA on the official Discord: Alpha Edition, rarities, grading, trading, VIP discount |
| 21 September | [First big demo update](https://store.steampowered.com/news/app/4429430/view/1844115010502611): new interface and board, collectors tutorial, test packs, balance changes, tentative Crimson Cup card list |
| 24 September | [Crimson Cup rules](/en/news/crimson-cup-format-check-in): Conquest with three decks, check-in |

## What comes next

- **19–26 October 2026.** Steam Next Fest: ranked mode switches on in the demo, with exclusive ranked rewards. The last balance patch before the festival is due two weeks earlier.
- **20–25 October 2026.** The Crimson Cup, the Steam Next Fest tournament: regional qualifiers on the 20th, 21st and 22nd, then playoffs and finals. Prizes worth $10,000, including an exclusive 1/1 promo card.
- **27 October 2026.** The Kickstarter: on 25 September the demo's main menu showed it as "Coming soon – Oct 27". Koin Games has not announced the date on Steam or on the official Discord yet; our [Kickstarter guide](/en/guides/origins-tcg-kickstarter) will confirm it.
- **Q4 2026.** Release on Steam, according to the store page, which gives no more precise date.
- **2027.** Mobile version and pack opening on phone. In the AMAs the team has described a full launch with the complete roster of Legendary cards, including King Arthur, Dracula, Winnie-the-Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein and Sherlock Holmes.

Dates come from the official Steam posts, the studio's Discord and, for the Kickstarter, the demo's own menu. We update this page when they change.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    category: "economy",
    title: "Two ways to collect: how the Origins economy works",
    metaTitle: "How the Origins TCG collector economy works",
    excerpt: "Competitive cards are free. Collector cards are limited, graded and tradeable on Steam. Here is what is confirmed and what is not.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-pack-opening.webp",
    faq: [
      { q: "Do collector cards make a deck stronger?", a: "No. Every competitive card is earned in game, and collector versions are limited editions of the same cards: they are numbered, digitally graded and tradeable, but they play exactly the same." },
      { q: "What is the Alpha Edition?", a: "Myths & Legends: Alpha Edition is the first collector edition, sold in pre-order only: booster packs of five cards, boxes of 24 packs and cases of six boxes, across seven rarity tiers, from Collectible Card (in every pack) to Storybook (1 in 1,200 packs), according to the official pre-registration page. Once the print run is finished, no more Alpha boxes are produced." },
      { q: "Where can Origins cards be traded?", a: "On the Steam Community Market and connected marketplaces, once the full game launches. The collectibles you earn in the demo today become tradeable at that point." },
      { q: "What is a God pack?", a: "A rare pack in which every card is Legendary or better. Collector versions also carry a grade: at Card Party in July 2026 the team handed a Slab to anyone pulling a 10/10 Alternate Art." },
    ],
    body: `
## The split

Origins keeps two things apart that most card games mix:

1. **Playing.** Every competitive card is earned in game. Nothing you buy makes your deck stronger.
2. **Collecting.** Limited-edition versions of cards exist in numbered print runs, come **digitally graded** and can be bought, sold and traded with other players.

The studio's own loading screens call it "real collecting in digital" and "two ways to collect".

## What is confirmed

- **Graded cards.** Collector versions carry a grade; at Card Party in July the team gave a Slab to anyone pulling a **10/10 Alternate Art**. Lower grades and different series exist and are worth different amounts.
- **God packs.** Rare packs in which every card is Legendary or better.
- **Alpha Edition.** The first collector edition, "Myths & Legends: Alpha Edition", is sold in pre-order only: booster packs of five cards, boxes of 24 packs and cases of six boxes, with seven rarity tiers, from Collectible Card (in every pack) to Storybook (1 in 1,200 packs), according to the [official pre-registration page](https://founder.origins-tcg.com). When the print run is finished no more Alpha boxes are produced. The Alpha set was one of the topics of the Kickstarter AMA of 10 September 2026 on the official Discord.
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
    title: "Origins TCG at Steam Next Fest 2026: Demo 2.0, dates and the tournament",
    metaTitle: "Origins TCG at Steam Next Fest 2026: dates",
    excerpt: "Origins TCG at Steam Next Fest, 19–26 October 2026: ranked mode in the demo, the Crimson Cup from 20 to 25 October, the prizes and how to sign up.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/media/keyart-queen-of-hearts.webp",
    faq: [
      { q: "When is Steam Next Fest October 2026?", a: "From Monday 19 October at 10:00 Pacific time (13:00 Eastern, 18:00 UK, 19:00 central Europe) to Monday 26 October 2026. Origins TCG takes part with its free demo, updated on 21 September, and ranked mode switches on with the festival." },
      { q: "When is the Origins TCG tournament?", a: "From 20 to 25 October 2026: three qualifiers on the 20th, 21st and 22nd (one per major region), then playoffs and finals." },
      { q: "Can I join a qualifier from Europe?", a: "Yes. Koin Games says you can join any of the qualifiers no matter where you live, but asks you to sign up only for the ones you can actually attend." },
      { q: "Does it cost anything?", a: "No. The demo is free on Steam and the tournament sign-up is on the official Discord. Origins TCG is free-to-compete: every competitive card is earned by playing." },
      { q: "What is the Conquest format?", a: "At the Crimson Cup each player submits three decks, with at least 8 unique cards between any two of them. Decklists stay hidden until the top 4: when you ban one of your opponent's decks you only see its Legendary. In best-of-five matches there is no ban and you must win with all three decks. Koin Games first tested the format at Big Bob's Playtest Battle on 28 August." },
    ],
    body: `
## The two dates to remember

- **Steam Next Fest, October 2026 edition: 19–26 October.** [Valve's festival of playable demos](https://store.steampowered.com/sale/nextfest) runs from Monday 19 October at 10:00 Pacific time (13:00 Eastern, 18:00 UK, 19:00 central Europe) to Monday 26 October. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) is in it with its free demo, which got its first big update on 21 September: with the festival Koin switches on **ranked mode**, with exclusive ranked rewards.
- **Origins TCG tournament: 20–25 October.** Koin Games calls it "our biggest tournament ever": a multi-day event that goes Qualification → Playoffs → Finals, entirely online and in-game.

## What the demo brings to the festival

The big demo update tested in three closed playtests in August (patches [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) and [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), all tracked in our [MetaShifting](/en/metashifting)) landed early, on [21 September 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): a new interface and board, a collectors tutorial, test packs to open, new voice lines, balance changes and the tentative card list of the Crimson Cup, so you can already build decks for the tournament. Progress carries over from the demo or the playtest, whichever is further ahead.

The decks, cards and bosses of the playtests are now in the free demo, and so is deckbuilding: everyone builds their own 25-card deck (one Legendary plus twelve cards, each played as two copies). Our [card database](/en/cards) has the 122 cards checked in the game on 22 September.

With the start of Steam Next Fest Koin switches on **ranked mode**, "which will come with exclusive ranked rewards" (Steam post of 21 September). The playtests had divisions up to Grandmaster and a world leaderboard: what is confirmed so far is in our [Origins TCG ranked guide](/en/guides/origins-tcg-ranked). We will publish every change on the day it lands.

## The tournament, step by step

1. **Qualifiers, 20–22 October.** Three of them, 512 spots each: EMEA on the 20th at 7pm CEST (32 advance), AMER on the 21st at 7pm EST (64), APAC on the 22nd at 7pm SGT (32), plus 128 wild cards. In Koin's words, "you can join ANY of the qualifiers, no matter where you live": pick the one whose time suits you, and sign up only for the ones you will really play — you may enter more than one.
2. **Playoffs and finals, 24–25 October.** The playoff stage has 256 spots on the 24th (10am EST / 4pm CEST / 10pm SGT) and four players come out of it for the finals on the 25th at 10am EST (3pm CET / 10pm SGT). Mind the clocks: Europe goes off summer time during the night of the 24th while the United States stays on it until 1 November, so the same Eastern start time lands an hour earlier on European clocks on the Sunday. Content creators get wildcard invites straight into the playoffs (ask on Discord).
3. **Format.** Official, from the announcements of 9 and 24 September: **Conquest with three decks**, with at least 8 unique cards between each pair of decks; decklists stay hidden until the top 4, so when you ban one of your opponent's decks you only see its Legendary. **Best-of-3 matches, best-of-5 grand final**: in best-of-five there is no ban and you must win with all three decks. Details in [our article on the rules](/en/news/crimson-cup-format-check-in).
4. **Check-in.** It opens two hours before each qualifier and closes five minutes before the start, together with deck submission; then a short first-come window gives waitlisted players the free spots. Miss the check-in and you can't play: for the EMEA qualifier at 7pm CEST, check in between 5pm and 6:55pm.
5. **Which build.** The tournament is played on the main demo, with only the cards available there: practise on it. The playtest will get more updates and will differ from the tournament build. The last balance patch arrives two weeks before Steam Next Fest.
6. **Prizes.** **Prizes worth $10,000**, in Koin's own words: an exclusive 1/1 tournament promo card, other promo cards, digital packs, Alpha booster boxes and cases, and cash prizes. It is not a cash pool: money is one of the four categories, and Koin promised the exact prize pool for the week after 24 September. The tournament is called the **Crimson Cup** — the name is on Koin's own artwork, not a community nickname.

Sign-ups are on the [official Discord](https://discord.gg/originstcg).

## How to prepare in five moves

1. [Install the free demo on Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) and play the missions: they teach the three lanes and the simultaneous turns.
2. Read [Origins TCG explained in five minutes](/en/guides/origins-tcg-explained) and the [card database](/en/cards): the stats are those of the demo patch of 21 September, checked card by card in the game.
3. Build your three Conquest decks in our [deck builder](/en/deck-builder): it flags two decks with the same Legendary and counts the cards that differ between decks. Step by step, with real community decks: [how to build a Conquest line-up](/en/guides/origins-tcg-conquest).
4. Study the [decks published by the community](/en/decks): every list comes with its composition charts, the author's notes, a button that opens it in the builder and the game code to paste into Origins. Publish yours with a guide so other players can rate it.
5. Follow the [news](/en/news): every announcement is summarized within a day, with a link to the source.

## How OriginsMeta will cover the week

Our plan, as of 25 September 2026: we will publish a news item every day during the festival, the tournament decks with their composition charts as soon as the lists are public (from the top 4), and the first OriginsMeta tier list after the Crimson Cup finals of 25 October, built on the tournament results and the top of the ranked ladder. Sources: the official Steam posts of 4 August, 25 August, [9 September](https://store.steampowered.com/news/app/4429430/view/1843481262690278) and [21 September 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611), and the [Steam Next Fest schedule](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    slug: "is-origins-tcg-pay-to-win",
    category: "economy",
    title: "Is Origins TCG pay-to-win? Free-to-compete, explained",
    metaTitle: "Is Origins TCG pay-to-win? Free-to-compete",
    excerpt: "Koin Games sells Origins TCG as the first free-to-compete card game with zero pay-to-win. What money actually buys, and the honest caveats.",
    readTime: 5,
    updated: "2026-09-25",
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

So the pack you pay for is a collector product, not a power product. The first one, the "Myths & Legends: Alpha Edition", is sold in pre-order only, in five-card boosters, boxes of 24 packs and cases of six boxes, with seven rarity tiers; see [how the Origins economy works](/en/guides/collector-economy).

## How it compares

In Hearthstone or MTG Arena the packs you buy contain the cards you play with, so spending shortens the road to a full collection. In Origins the road to a competitive deck is playing; spending buys the collector shelf next to it. That is the difference the "zero pay-to-win" claim rests on.

## The honest caveats

- **Time is still a cost.** Free cards are earned by playing; how many matches it takes to complete a competitive deck is not published yet. Deckbuilding has been in the demo since the 21 September update: we will measure it during Steam Next Fest (19–26 October), when ranked mode opens, and publish the numbers.
- **Details still to come.** Prices outside the Alpha pre-order, marketplace fees beyond Steam's standard ones and any progression boosts are not announced. Nothing suggests a battle pass, but nothing rules one out either.
- **Marketplace value is not cash.** Selling on the Steam Community Market pays into your Steam Wallet. Whether connected marketplaces will allow real cash-out is not confirmed.
- **Packs are random.** Among its content descriptors the Steam page lists "In-game purchases" and "Chance based in-game purchases": what a collector pack contains is left to chance, even though it never changes the strength of a deck.

## Why it matters for the meta

Because collector versions are cosmetic, a tier list only has to judge the card, never the edition, and a deck published on OriginsMeta by a free player is as strong as anyone else's. We will keep this page updated with every official statement; sources: the Origins TCG Steam page, the official loading screens and the Koin Games AMAs of July and August 2026.
`,
  },
  "play-the-demo": {
    slug: "play-the-demo",
    category: "game",
    title: "How to download and play the Origins TCG demo on Steam",
    metaTitle: "How to play the Origins TCG demo on Steam",
    excerpt: "The free demo in five steps: requirements, download, language, first matches, what demo players unlock and what the 21 September update brought.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-legendary-mulan.webp",
    faq: [
      { q: "Is the Origins TCG demo free?", a: "Yes. It has been free on Steam since 15 July 2026, for Windows and macOS." },
      { q: "What languages is the demo available in?", a: "The Steam page lists four for the interface — English, French, Italian and German — with full audio in English only. On 25 September 2026 the demo also had its interface and card texts in Spanish, which Steam does not list yet (checked in the game)." },
      { q: "What do I need to run it?", a: "At minimum Windows 10 64-bit with an Intel i3-6100 or AMD FX-6300, 8 GB of RAM, a GTX 750 Ti or R9 270X and 2 GB of space; on Mac, macOS 10.14 or later with an Apple M1 or a dual-core Intel i5 and a Metal-capable GPU." },
      { q: "Does the demo give anything for the full game?", a: "Koin Games announced that demo players earn exclusive collectibles that become tradeable when the full game launches." },
      { q: "What did the 21 September update bring?", a: "The first big update of the demo: a new interface and board, a collectors tutorial, test packs, new voice lines, balance changes and the tentative Crimson Cup card list, with the decks, cards and deckbuilding tested in August's playtests. Ranked mode switches on with Steam Next Fest, 19–26 October 2026." },
    ],
    body: `
## What you get

The Origins TCG demo has been on Steam since **15 July 2026**, free, for Windows and macOS. On 25 September 2026 it sat at "Very Positive": 96% of 184 reviews. Matches take about seven minutes: both players move at once across three locations, drawn from a pool of more than a hundred that rotate and change the rules of the board. The demo includes the tutorial, missions against bosses with their own AI and online play.

Languages: the Steam page lists **English, French, Italian and German** for the interface, with full audio in **English only**. On 25 September 2026 the demo also had its interface and card texts in **Spanish**, which Steam does not list yet (checked in the game).

## Requirements

| | Minimum | Recommended |
| --- | --- | --- |
| Windows | Windows 10 64-bit, Intel i3-6100 or AMD FX-6300, 8 GB RAM, GTX 750 Ti or R9 270X | Windows 11 64-bit, Intel i5-8400, 16 GB RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 or Intel i5 dual-core 2.5 GHz, Metal-capable GPU | macOS 12 or later, Apple M1 Pro, 16 GB RAM |
| Space | 2 GB | 2 GB |

## Five steps

1. **Install Steam** and sign in (a free account is enough).
2. **Open the [Origins TCG Demo page](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** and press "Download Origins TCG Demo"; or search "Origins TCG" inside Steam and pick the Demo. Installing takes a couple of minutes.
3. **Pick your language** if Steam did not: right-click the game in your library, Properties, Language. The voice-over is in English; the other languages translate the interface and the texts.
4. **Play the tutorial**, then the missions: they teach the three lanes, the simultaneous turns and the keywords (On Reveal, On Death, First Strike, Double Attack, Deathtouch). Our [five-minute guide](/en/guides/origins-tcg-explained) covers the same ground in text.
5. **Go online** and try the preset decks. When you want more, read the [decks published by the community](/en/decks), rebuild them in the [deck builder](/en/deck-builder) and check the current card stats in the [card database](/en/cards) (demo patch of 21 September 2026).

## What demo players unlock

In the July launch post Koin Games said that demo players earn **exclusive collectibles** that will become tradeable when the full game launches. Wishlist the [main game](https://store.steampowered.com/app/4429430/Origins_TCG/) on Steam: the store page lists the release for Q4 2026.

## What the 21 September update changed

The demo got its first big update on [21 September 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): a new interface and board, a collectors tutorial, test packs, new voice lines, balance changes and the tentative Crimson Cup card list, together with the decks, cards and deckbuilding tested in August's closed playtests. Your progress from the demo or the playtest carries over, whichever is further ahead. Ranked mode switches on with Steam Next Fest (19–26 October 2026): everything about the dates, the tournament and how to prepare is in our [Steam Next Fest 2026 page](/en/guides/steam-next-fest-2026). Playtests of the bigger builds are announced on the [official Discord](https://discord.gg/originstcg), and so far anyone who wanted to join could.

Sources: the Origins TCG and Origins TCG Demo pages on Steam (read on 25 September 2026) and the official Steam posts of 16 July, 4 August and 21 September 2026.
`,
  },
  "origins-tcg-kickstarter": {
    slug: "origins-tcg-kickstarter",
    category: "economy",
    title: "Origins TCG Kickstarter: date, pre-registration, Alpha Edition and what we know",
    metaTitle: "Origins TCG Kickstarter: date, pre-registration, Alpha",
    excerpt: "The demo menu shows the Kickstarter as “Coming soon – Oct 27”. Pre-registration is open: 15% off for a refundable 1 dollar deposit, preorder-only Alpha boxes.",
    readTime: 4,
    updated: "2026-09-25",
    image: "/media/ls-collector-pack.webp",
    faq: [
      { q: "When does the Origins TCG Kickstarter start?", a: "On 25 September 2026 the demo's main menu showed the Kickstarter as “Coming soon – Oct 27”, next to “Preregister for 15% off”. Koin Games has not announced the date on Steam or on the official Discord yet: we will confirm it here as soon as they do." },
      { q: "What does the 1 dollar deposit give you?", a: "VIP status with 15% off at launch. The official page states the deposit is fully refundable before launch." },
      { q: "What is the Alpha Edition?", a: "Origins Myths & Legends Alpha Edition: collector packs of 5 cards with at least one Rare or better guaranteed, booster boxes of 24 packs and cases of 6 boxes. Boxes and cases are preorder-only and the print run will not be repeated." },
      { q: "Do I need to back the Kickstarter to compete?", a: "No. Origins is free-to-compete: ranked play needs no purchase, and the Steam demo is free. The Kickstarter is about collecting, not power." },
      { q: "Where are the cards traded?", a: "On the Steam Community Market and its connected marketplaces, according to the official page. Mobile pack opening is planned for 2027." },
    ],
    body: `## The date: 27 October, according to the demo {#date}

On **25 September 2026** the main menu of the Origins TCG demo showed the Kickstarter box with **"Coming soon – Oct 27"** and **"Preregister for 15% off"**, while the loading screen advertises the **Myths & Legends Alpha Edition**. It is the first date Koin Games has shown anywhere, but it is not an announcement yet: there is no post with the date on Steam or on the official Discord, and the [pre-registration page](https://founder.origins-tcg.com) does not mention it. We will update this guide the day Koin confirms it.

*Update of 25 September 2026: added the date shown in the demo, the topics of the AMA from the official announcement and the corrected timeline.*

## What has been announced

Koin Games runs an official **Kickstarter Early Access** page at [founder.origins-tcg.com](https://founder.origins-tcg.com). On **10 September 2026** the team answered questions about the campaign in an AMA on the official Discord; the announcement of the next day lists the topics: digital grading, card rarity, how trading works, error cards, God packs, tournament 1/1s, what the Alpha set is, the Kickstarter tiers and how to become a VIP with 15% off. Our [news on the AMA](/en/news/kickstarter-ama-pre-registration) sums it up.

## Pre-registration: 15% off for 1 dollar

- Becoming a **VIP** with a **1 dollar deposit** unlocks **15% off at launch**.
- The deposit is **fully refundable before launch**, as stated twice on the official page.
- Pre-registration does not commit you to a pledge: it only reserves the early-bird price.

## The Alpha Edition

The product line is called **Origins Myths & Legends Alpha Edition**:

| Product | Contents |
| --- | --- |
| Collector booster pack | 5 collectible cards, at least one Rare or better guaranteed |
| Booster box | 24 collector packs |
| Booster case | 6 booster boxes |

For the Alpha Edition, **boxes and cases are preorder only**: once that print run is finished, no additional Alpha boxes or cases will be produced. That is the same logic as a first-edition print run in physical card games, applied to a digital collection.

## Trading and ownership

Cards can be bought, sold and traded on the **Steam Community Market** and its connected marketplaces. Koin moved to the Steam marketplace earlier this year instead of an independent on-chain system. Mobile pack opening is planned for **2027**.

## Free-to-compete stays free

Backing the Kickstarter buys collectibles, not strength: ranked play in Origins needs no purchase and the demo on Steam is free. See [Is Origins TCG pay to win?](/en/guides/is-origins-tcg-pay-to-win) for how the competitive side and the collector side stay separate.

## Timeline

- 15 July 2026: free demo on Steam.
- 21 September 2026: first big update of the demo.
- 19–26 October 2026: Steam Next Fest, with ranked mode in the demo and the Crimson Cup (20–25 October).
- 27 October 2026: Kickstarter, "Coming soon" in the demo menu (not yet announced on Steam or Discord).
- Q4 2026: release on Steam, according to the store page.
- 2027: mobile.

## What to do now

1. Wishlist the game on Steam and play the demo.
2. If you want the launch discount, [pre-register on founder.origins-tcg.com](https://founder.origins-tcg.com) with the refundable deposit.
3. Follow the official Discord for the confirmation of the date: we will publish it here and in the news the same day.

Sources: [official pre-registration page](https://founder.origins-tcg.com), [Steam page](https://store.steampowered.com/app/4429430/Origins_TCG/), the AMA announcement on the official Discord (11 September 2026) and the main menu of the demo (read on 25 September 2026).`,
  },
};

const it: Record<GuideSlug, Guide> = {
  "origins-tcg-legendaries": {
    slug: "origins-tcg-legendaries",
    category: "game",
    tags: { cards: ["dorothy", "dracula", "mulan", "queen-of-hearts", "van-helsing", "wicked-stepmother", "merlin", "king-arthur", "legion-of-the-dead", "three-not-so-little-pigs", "robin-hood"] },
    title: "Le 11 Leggendarie di Origins TCG: carte, statistiche, patch e mazzi",
    metaTitle: "Le Leggendarie di Origins TCG: tutte e 11 e i mazzi",
    excerpt: "Le 11 Leggendarie della Demo 2.0 di Origins TCG: costo, statistiche, testo ufficiale, carte generate, modifiche delle patch e mazzi che le usano.",
    readTime: 9,
    updated: "2026-09-25",
    image: "/media/keyart-king-arthur.webp",
    faq: [
      { q: "Quante Leggendarie ci sono in Origins TCG?", a: "Undici nella Demo 2.0 al 25 settembre 2026: Dorothy, Dracula, Mulan, Queen of Hearts, Van Helsing, Wicked Stepmother, Merlin, King Arthur, Legion of the Dead, Three Not So Little Pigs e Robin Hood. Il database di OriginsMeta ne conserva altre nove che non sono nella demo." },
      { q: "Quante Leggendarie può avere un mazzo?", a: "Una. Un mazzo è una Leggendaria più dodici carte base giocate in due copie ciascuna, 25 carte in tutto. Nel Conquest si porta più di un mazzo: a Big Bob's Playtest Battle ognuno doveva avere una Leggendaria diversa; gli annunci della Crimson Cup non lo dicono, e il nostro deck builder segnala due mazzi con la stessa." },
      { q: "Qual è la Leggendaria nel maggior numero di mazzi?", a: "Al 25 settembre 2026 Three Not So Little Pigs, che guida 4 dei 20 mazzi pubblicati su OriginsMeta; Van Helsing ne guida 3 e Wicked Stepmother nessuno. È una misura di popolarità sul sito, non di forza, e il conteggio aggiornato è nella pagina Le più giocate della tier list." },
      { q: "Esiste una Leggendaria magia?", a: "Sì, una sola nella Demo 2.0: Legion of the Dead, una magia da 7 mana che riempie il tuo tabellone di Zombie 2/2." },
    ],
    body: `
## In breve {#in-breve}

- Nella Demo 2.0, la versione di Origins TCG che si gioca oggi, ci sono **undici Leggendarie**: sei costano 4 mana, una 5, tre 7 e una 8.
- Dieci sono unità e una è una magia, Legion of the Dead. Cinque sono Good, tre Evil e tre Neutral.
- Quattro generano altre carte con il loro testo: Dracula, Van Helsing, Legion of the Dead e Three Not So Little Pigs.
- Sette sono cambiate nelle patch di bilanciamento fra agosto e il 21 settembre 2026; Dracula, Van Helsing, Legion of the Dead e Robin Hood no.
- I 20 mazzi pubblicati su OriginsMeta entro le 20:00 del 25 settembre 2026 ne usano dieci su undici: Three Not So Little Pigs ne guida quattro, Van Helsing tre, Wicked Stepmother nessuno. Sei Leggendarie hanno una guida di OriginsMeta a uno dei loro mazzi.

Qui sotto le Leggendarie sono in ordine di costo e, a parità di costo, in ordine alfabetico. La guida descrive che cosa fa ogni carta, non quanto è forte: le classificherà la nostra [tier list di Origins TCG](/it/tier-list) sui risultati dei tornei e sulla cima della [classificata](/it/guides/origins-tcg-ranked), dopo la Crimson Cup.

## Le 11 Leggendarie in una tabella {#tabella}

| Leggendaria | Costo | Potenza/Salute | Allineamento | Mazzi |
| --- | --- | --- | --- | --- |
| [Dorothy](/it/cards/dorothy) | 4 | 1/1 | Good | 2 |
| [Dracula](/it/cards/dracula) | 4 | 3/2 | Evil | 2 |
| [Mulan](/it/cards/mulan) | 4 | 2/4 | Good | 1 |
| [Queen of Hearts](/it/cards/queen-of-hearts) | 4 | 3/3 | Evil | 2 |
| [Van Helsing](/it/cards/van-helsing) | 4 | 3/4 | Good | 3 |
| [Wicked Stepmother](/it/cards/wicked-stepmother) | 4 | 4/6 | Evil | 0 |
| [Merlin](/it/cards/merlin) | 5 | 5/5 | Neutral | 1 |
| [King Arthur](/it/cards/king-arthur) | 7 | 7/7 | Good | 2 |
| [Legion of the Dead](/it/cards/legion-of-the-dead) | 7 | magia | Neutral | 2 |
| [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs) | 7 | 3/3 | Neutral | 4 |
| [Robin Hood](/it/cards/robin-hood) | 8 | 4/4 | Good | 1 |

L'ultima colonna conta i mazzi che ogni Leggendaria guida fra i 20 pubblicati su OriginsMeta dal 15 settembre alle 20:00 del 25 settembre 2026. Misura la popolarità sul sito, non la forza né il win rate; il conteggio aggiornato è in [Le più giocate](/it/tier-list/most-played).

## Che cosa fa la Leggendaria in un mazzo {#nel-mazzo}

- **Una per mazzo.** Un mazzo è una Leggendaria più dodici carte base, e il gioco aggiunge una seconda copia di ogni carta base: 25 carte in gioco, secondo l'AMA del team di Koin Games. Il [deck builder](/it/deck-builder) controlla la regola.
- **L'avversario la vede.** La patch 0.6.1 del playtest chiuso (14 agosto 2026) ha aggiunto l'anteprima della Leggendaria avversaria durante il mulligan, secondo le [patch notes ufficiali](https://store.steampowered.com/news/app/4429430/view/1840944183780414).
- **Nel Conquest dà il nome al mazzo.** Alla Crimson Cup ogni giocatore porta tre mazzi, e quando si banna un mazzo dell'avversario se ne vede solo la Leggendaria ([regole della Crimson Cup](/it/news/crimson-cup-format-check-in)). Gli annunci non dicono se le tre Leggendarie devono essere diverse; a Big Bob's Playtest Battle dovevano esserlo. Come mettere insieme i tre mazzi: la nostra [guida al Conquest](/it/guides/origins-tcg-conquest).

I testi delle carte citati qui sotto sono quelli ufficiali del gioco, letti nel gioco in italiano; costi e statistiche sono stati verificati carta per carta il 22 settembre 2026. Le saghe e le note sulle leggende sono di OriginsMeta. Le patch sono quelle seguite nel [MetaShifting](/it/metashifting): gli aggiornamenti 0.6.1, 0.6.2 e 0.6.3 del playtest (agosto 2026) e la patch della demo del 21 settembre 2026. Il potere leggendario qui non c'è: non lo abbiamo ancora trascritto dal gioco, e lo mostrerà la scheda di ogni carta quando lo avremo fatto.

## Dorothy {#dorothy}

**4 mana · 1/1 · unità · Good** · Saga: Terra di Oz

> Posso Muovermi ogni round.
>
> Ho +1⚔️/+1❤️ per ogni volta che un alleato si è mosso in questa partita.

- **La leggenda.** La ragazza del Kansas portata a Oz da un tornado nel romanzo di L. Frank Baum del 1900.
- **Patch.** Patch della demo del 21 settembre 2026: mana da 5 a 4 ([patch notes](/it/news/demo-patch-notes-0921)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Due: [Dorothy Combo](/it/decks/community/dorothy-combo-7503) e [Move/Combo](/it/decks/community/move-combo-075a).
- **Guida.** [Guida al mazzo di Dorothy: Dorothy Combo](/it/guides/dorothy-combo-guide).
- **Scheda.** [Dorothy, carta Leggendaria: statistiche e testo](/it/cards/dorothy).

## Dracula {#dracula}

**4 mana · 3/2 · unità · Evil** · Saga: Horror gotico

> Quando scarti, torno dal tuo cimitero in mano.
>
> Alla rivelazione: Evoca Brides of Dracula [2⚔️/2❤️] su uno spazio casuale qui.

- **La leggenda.** Il conte transilvano del romanzo di Bram Stoker del 1897.
- **Carte che genera.** [Brides of Dracula](/it/cards/brides-of-dracula), una 2/2 che, secondo il suo testo, ogni volta che scarti una carta infligge 1 danno alla barriera avversaria nel suo luogo e ottiene +1❤️ (carta generata: testo non verificato nel gioco).
- **Patch.** Dracula non è cambiato. Brides of Dracula è scesa da 3 a 2 mana con la patch 0.6.2 ([patch notes](/it/news/patch-0-6-2)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Due: [Discard](/it/decks/community/discard-8bff) e [Dracula SUPER FUN](/it/decks/community/dracula-super-fun-d936).
- **Guida.** Non ancora: [mandaci la tua](/it/guides/submit).
- **Scheda.** [Dracula, carta Leggendaria: statistiche e testo](/it/cards/dracula).

## Mulan {#mulan}

**4 mana · 2/4 · unità · Good** · Saga: Ballata di Mulan

> Doppio attacco
>
> Quando avviene un'abilità Alla rivelazione di un alleato, ripetila.

- **La leggenda.** La guerriera che prende il posto del padre nell'esercito, da una ballata cinese del VI secolo.
- **Patch.** Patch 0.6.2: statistiche invariate, ottiene Doppio attacco oltre a ripetere le abilità Alla rivelazione degli alleati ([patch notes](/it/news/patch-0-6-2)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Uno: [On Reveal Mid Range](/it/decks/community/on-reveal-mid-range-772e).
- **Guida.** [Guida al mazzo di Mulan: On Reveal Mid Range](/it/guides/on-reveal-midrange-guide).
- **Scheda.** [Mulan, carta Leggendaria: statistiche e testo](/it/cards/mulan).

## Queen of Hearts {#queen-of-hearts}

**4 mana · 3/3 · unità · Evil** · Saga: Paese delle Meraviglie

> Primo colpo
>
> Quando avviene un'abilità Alla morte di un alleato, ripetila.

- **La leggenda.** La furiosa sovrana del Paese delle Meraviglie, la cui risposta a tutto è "Tagliategli la testa!".
- **Patch.** Patch 0.6.2: da 5 mana 3/5 a 4 mana 3/3, e ottiene Primo colpo oltre a ripetere le abilità Alla morte degli alleati ([patch notes](/it/news/patch-0-6-2)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Due: [Qoh](/it/decks/community/qoh-f876) e [Just f\\*\\*\\*in em](/it/decks/community/just-f-in-em-bdf2).
- **Guida.** Non ancora: [mandaci la tua](/it/guides/submit).
- **Scheda.** [Queen of Hearts, carta Leggendaria: statistiche e testo](/it/cards/queen-of-hearts).

## Van Helsing {#van-helsing}

**4 mana · 3/4 · unità · Good** · Saga: Horror gotico

> Prima del combattimento, aggiungi Van Helsing's Tools alla tua mano se non c'è già.

- **La leggenda.** Abraham Van Helsing, il professore olandese che guida la caccia a Dracula.
- **Carte che genera.** [Van Helsing's Tools](/it/cards/van-helsings-tools), che ti fa scegliere e giocare una di quattro carte generate: [Holy Water](/it/cards/holy-water), [Silver Bullet](/it/cards/silver-bullet), [Garlic](/it/cards/garlic) o [Wooden Stake](/it/cards/wooden-stake) (carte generate: testi non verificati nel gioco, e la scheda della Silver Bullet mostra ancora il testo di prima della patch 0.6.2; le modifiche sono nel suo storico dei bilanciamenti).
- **Patch.** Van Helsing non è cambiato. Con la patch 0.6.2 Van Helsing's Tools è diventata gratuita (da 1 a 0 mana) e la Silver Bullet che crea è passata da 3 danni a 1 ([patch notes](/it/news/patch-0-6-2)); con la patch della demo del 21 settembre 2026 la Silver Bullet può colpire anche le barriere, e la Wooden Stake può bersagliare personaggi con la Salute piena, ma fallisce comunque se il bersaglio non è danneggiato quando si rivela ([patch notes](/it/news/demo-patch-notes-0921)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Tre: [Healing Healsing](/it/decks/community/healing-healsing-9411), [Cure Control](/it/decks/community/cure-control-b630) e [CONTROL](/it/decks/community/control-2c2b).
- **Guide.** [Guida a Healing Healsing, mazzo di Van Helsing](/it/guides/healing-healsing-guide) e [i suoi matchup](/it/guides/healing-healsing-matchups).
- **Scheda.** [Van Helsing, carta Leggendaria: statistiche e testo](/it/cards/van-helsing).

## Wicked Stepmother {#wicked-stepmother}

**4 mana · 4/6 · unità · Evil** · Saga: Fiabe

> Tocco letale
>
> Alla rivelazione: Dai Tocco letale ai tuoi personaggi Malvagi.

- **La leggenda.** La matrigna crudele delle fiabe, dalla casa di Cenerentola alla corte di Biancaneve.
- **Patch.** Patch della demo del 21 settembre 2026: Potenza da 3 a 4 ([patch notes](/it/news/demo-patch-notes-0921)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Nessuno dei 20 pubblicati finora: costruiscine uno nel [deck builder](/it/deck-builder) e pubblicalo con una guida.
- **Guida.** Non ancora: [mandaci la tua](/it/guides/submit).
- **Scheda.** [Wicked Stepmother, carta Leggendaria: statistiche e testo](/it/cards/wicked-stepmother).

## Merlin {#merlin}

**5 mana · 5/5 · unità · Neutral** · Saga: Ciclo arturiano

> Ripeti la prima magia che giochi ogni round.

- **La leggenda.** Il mago dietro la nascita di Artù e la sua ascesa al trono, da Goffredo di Monmouth a Malory.
- **Patch.** Patch 0.6.3: da 3/5 a 5/5, +2 Potenza ([patch notes](/it/news/patch-0-6-3)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Uno: [Spellcast](/it/decks/community/spellcast-250f).
- **Guida.** Non ancora: [mandaci la tua](/it/guides/submit).
- **Scheda.** [Merlin, carta Leggendaria: statistiche e testo](/it/cards/merlin).

## King Arthur {#king-arthur}

**7 mana · 7/7 · unità · Good** · Saga: Ciclo arturiano

> Scudo
>
> Alla rivelazione: Dai Scudo ai tuoi personaggi Buoni.

- **La leggenda.** Il re di Britannia che estrasse la spada dalla roccia e riunì la Tavola Rotonda.
- **Patch.** Patch 0.6.3: da 5/5 a 7/7 ([patch notes](/it/news/patch-0-6-3)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Due: [King of Value Trade](/it/decks/community/king-of-value-trade-fd14) e [Glinda Reborn](/it/decks/community/glinda-reborn-2d6d).
- **Guida.** [Guida al King of Value Trade di King Arthur](/it/guides/king-of-value-trade-guide).
- **Scheda.** [King Arthur, carta Leggendaria: statistiche e testo](/it/cards/king-arthur).

## Legion of the Dead {#legion-of-the-dead}

**7 mana · magia · Neutral** · Saga: Horror gotico

> Riempi il tuo tabellone di Zombie [2⚔️/2❤️].

- **L'unica Leggendaria magia** della Demo 2.0.
- **La leggenda.** Un esercito di morti risorti, l'ultimo argomento del negromante.
- **Carte che genera.** [Zombie](/it/cards/zombie), carte generate 2/2, quante ne servono per riempire il tuo tabellone.
- **Patch.** Nessuna modifica.
- **Mazzi su OriginsMeta al 25 settembre 2026.** Due: [The Trick-or-Treat Legion](/it/decks/community/the-trick-or-treat-legion-72c4) e [FACE IS THE PLACE](/it/decks/community/face-is-the-place-b049).
- **Guida.** [Guida al mazzo di Legion of the Dead](/it/guides/trick-or-treat-legion-guide).
- **Scheda.** [Legion of the Dead, carta Leggendaria: statistiche e testo](/it/cards/legion-of-the-dead).

## Three Not So Little Pigs {#three-not-so-little-pigs}

**7 mana · 3/3 · unità · Neutral** · Saga: Fiabe

> Travolgere
>
> Alla rivelazione: Evoca un Not So Little Pig [3⚔️/3❤️] con Travolgere su uno spazio casuale di ogni altro luogo.

- **La leggenda.** I tre porcellini di paglia, legno e mattoni, cresciuti e non più così facili da soffiare via.
- **Carte che genera.** [Not So Little Pig](/it/cards/not-so-little-pig), un 3/3 con Travolgere, uno in ciascuno degli altri due luoghi.
- **Patch.** Patch 0.6.2: da 4/4 a 3/3, e i maialini che evoca sono diventati 3/3 anche loro ([patch notes](/it/news/patch-0-6-2)).
- **Mazzi su OriginsMeta al 25 settembre 2026.** Quattro: [3 Pigs Mid Range](/it/decks/community/3-pigs-mid-range-6311), [Value Board](/it/decks/community/value-board-c44a), [VALUE MAXXING](/it/decks/community/value-maxxing-739d) e [AGGRO /MIDRANGE PIGS GM](/it/decks/community/aggro-midrange-pigs-gm-6931).
- **Guide.** [Guida al mazzo dei Three Not So Little Pigs](/it/guides/three-pigs-midrange-guide) e [i suoi matchup](/it/guides/three-pigs-midrange-matchups).
- **Scheda.** [Three Not So Little Pigs, carta Leggendaria: statistiche e testo](/it/cards/three-not-so-little-pigs).

## Robin Hood {#robin-hood}

**8 mana · 4/4 · unità · Good** · Saga: Sherwood

> Tiro di precisione 3
>
> Alla rivelazione: Infliggi 2 danni a tutti i nemici.

- **L'unica Leggendaria da 8 mana** della Demo 2.0.
- **La leggenda.** L'arciere fuorilegge della foresta di Sherwood che ruba ai ricchi per dare ai poveri, cantato nelle ballate dal XIV secolo.
- **Patch.** Nessuna modifica.
- **Mazzi su OriginsMeta al 25 settembre 2026.** Uno: [Buff](/it/decks/community/buff-6f60).
- **Guida.** Non ancora: [mandaci la tua](/it/guides/submit).
- **Scheda.** [Robin Hood, carta Leggendaria: statistiche e testo](/it/cards/robin-hood).

## Le Leggendarie che non sono nella Demo 2.0 {#fuori-dalla-demo}

Il nostro database conserva anche nove Leggendarie che non sono nella Demo 2.0: [Alice](/it/cards/alice), [Beowulf](/it/cards/beowulf), [Cinderella](/it/cards/cinderella), [Death](/it/cards/death), [Dr. Frank](/it/cards/dr-frank), [Mirror Mirror](/it/cards/mirror-mirror), [Red](/it/cards/red), [Winnie-the-Pooh](/it/cards/winnie-the-pooh) e [Wizard of Oz](/it/cards/wizard-of-oz). Le loro schede tengono gli ultimi dati noti, non verificati nel gioco. Negli AMA il team ha descritto un lancio completo con tutto l'elenco delle Leggendarie: le date che conosciamo sono nella [roadmap](/it/guides/roadmap-and-dates).

## Da dove vengono i numeri {#fonti}

- **Carte:** il [database carte](/it/cards) di OriginsMeta: costi, statistiche e testi inglesi delle carte della demo verificati uno per uno nel gioco il 22 settembre 2026, testi italiani e spagnoli letti nel gioco il 25 settembre 2026.
- **Patch:** le patch notes ufficiali su Steam, carta per carta nel [MetaShifting](/it/metashifting).
- **Mazzi:** i 20 mazzi pubblicati su OriginsMeta dal 15 settembre alle 20:00 del 25 settembre 2026 ([tutti i mazzi di Origins TCG](/it/decks)); il conteggio successivo è in [Le più giocate](/it/tier-list/most-played).

Aggiorneremo questa guida ogni volta che una patch cambia una Leggendaria o la demo ne aggiunge una nuova.
`,
  },
  "origins-tcg-ranked": {
    slug: "origins-tcg-ranked",
    category: "rank",
    title: "La classificata di Origins TCG: cosa sappiamo della ladder prima dello Steam Next Fest",
    metaTitle: "Classificata di Origins TCG: quando parte e Grandmaster",
    excerpt: "La classificata apre nella demo di Origins TCG con lo Steam Next Fest, il 19 ottobre 2026. Cosa ha confermato Koin: divisioni, Grandmaster, ricompense.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/keyart-puss-in-boots.webp",
    faq: [
      { q: "A che ora apre la classificata il 19 ottobre?", a: "Il post di Koin Games su Steam del 21 settembre 2026 dice solo \"con l'inizio dello Steam Next Fest\", senza un orario. Il festival apre lunedì 19 ottobre 2026 alle 10:00 ora del Pacifico, le 19:00 in Italia." },
      { q: "Qual è il grado più alto della classificata di Origins TCG?", a: "Grandmaster, la divisione più alta della ladder del playtest chiuso, con una classifica mondiale (patch notes ufficiali 0.6.1 e 0.6.3, agosto 2026)." },
      { q: "Quali sono le ricompense della classificata?", a: "Koin Games ha detto solo che la classificata della demo arriva con ricompense esclusive; al 25 settembre 2026 i dettagli non erano stati annunciati." },
      { q: "Si può giocare in classificata prima dello Steam Next Fest?", a: "Solo nel playtest chiuso, dove la classificata è attiva dalla patch 0.6.1 del 14 agosto 2026; le istruzioni per accedere al playtest sono sul Discord ufficiale." },
    ],
    body: `
## In breve {#in-breve}

- La classificata si accende nella demo gratuita **con l'inizio dello Steam Next Fest**, lunedì 19 ottobre 2026, "con ricompense esclusive" (post di Koin Games su Steam del 21 settembre 2026).
- Non è una novità: il playtest chiuso ha una ladder classificata dalla patch 0.6.1 del 14 agosto 2026, e il 24 settembre lì era ancora attiva.
- Cosa confermano le patch notes ufficiali: le divisioni, una divisione più alta chiamata **Grandmaster** con una classifica mondiale e i **Punti Vittoria** (VP) che si vincono e si perdono nelle partite classificate: le note parlano di una variazione di +10 e −10, e dalla patch 0.6.2 le partite in stanza non danno VP.
- Cosa Koin non ha ancora detto: l'elenco completo delle divisioni, se i +10/−10 VP del playtest restano uguali in ogni divisione e nella demo, stagioni e reset, in cosa consistono le ricompense.

Aggiorneremo questa guida quando la classificata aprirà nella demo.

## Quando apre la classificata {#quando}

Il 21 settembre 2026, nel post sul [primo grande aggiornamento della demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611), Koin Games ha scritto che accenderà "la modalità classificata con l'inizio dello Steam Next Fest, che arriverà con ricompense esclusive per la classificata". Lo [Steam Next Fest](https://store.steampowered.com/sale/nextfest) va da lunedì 19 ottobre 2026 alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre. Il post non dà un orario preciso per la classificata: dice solo "con l'inizio" del festival.

Il 24 settembre l'annuncio della Crimson Cup sul Discord ufficiale lo ha ripetuto: la demo, che ha la lista carte del torneo, accende la classificata per lo Steam Next Fest, con nuove ricompense ([il nostro articolo](/it/news/crimson-cup-format-check-in#demo-playtest)). Tutto il resto sul festival è nella nostra [guida allo Steam Next Fest](/it/guides/steam-next-fest-2026).

## Cosa ci dice la ladder del playtest {#ladder-del-playtest}

La classificata è attiva nel playtest chiuso da metà agosto, e tre patch notes ufficiali la descrivono:

- **Patch 0.6.1, 14 agosto 2026.** La ladder classificata è la novità principale dell'aggiornamento, e "la divisione Grandmaster ha una classifica mondiale" ([patch notes](https://store.steampowered.com/news/app/4429430/view/1840944183780414)). Un bug noto di quella build: la visualizzazione dei VP (Punti Vittoria) andava in tilt appena si arrivava a Grandmaster.
- **Patch 0.6.2, 21 agosto 2026.** La Grandmaster League mostra ora grado, VP e divisione corretti di ogni giocatore, e le partite in stanza non danno più VP. Due bug noti di quella build: i VP si vincevano e si perdevano correttamente, ma il +10 e il −10 che accompagnano la variazione del totale erano spariti per il momento, e a fine partita in Grandmaster la variazione dei VP non si vedeva, anche se i punti cambiavano ([patch notes](https://store.steampowered.com/news/app/4429430/view/1841579228669961)).
- **Patch 0.6.3, 27 agosto 2026.** Nella divisione più alta la schermata dei risultati mostrava valori segnaposto invece di quelli del giocatore; ora divisione, totale dei VP e variazione dei VP si vedono correttamente, il +10 e il −10 non si sovrappongono più al totale dei VP mentre cambia, e a fine partita dovrebbero comparire sempre esito, Punti Vittoria e grado ([patch notes](https://store.steampowered.com/news/app/4429430/view/1842212951301184)).

Messe insieme: la ladder è fatta di divisioni, **Grandmaster è la più alta** (la patch 0.6.3 la chiama "la divisione più alta") e ha una classifica mondiale con un grado per ogni giocatore, e le partite classificate spostano i tuoi Punti Vittoria, con una variazione di +10 o −10 nelle note del playtest (le partite in stanza no, dalla 0.6.2). Le note citano "Diamond IV" solo fra i valori segnaposto mostrati per errore: non elencano le divisioni sotto Grandmaster. Il nostro riassunto della prima patch della classificata è in [patch 0.6.1: classificata e Grandmaster](/it/news/patch-0-6-1-ranked).

## Classificata e sblocco dei mazzi {#sblocchi}

Nel playtest chiuso, secondo i giocatori sul forum di Steam il 14 settembre 2026, un mazzo si sbloccava con tre vittorie in classificata più una vittoria contro un boss IA; uno sviluppatore ha risposto che il team valutava di rendere quelle partite di sblocco solo PvE ([il nostro articolo](/it/news/playtest-feedback-deck-unlock)). Con l'aggiornamento della demo del 21 settembre Koin ha confermato che tutti conservano i progressi della demo o del playtest, quelli più avanzati fra i due ([il nostro articolo](/it/news/demo-first-big-update#progressi)).

## Dove giocare prima del festival {#prima-del-festival}

- **La demo** è gratuita su [Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) e ha la lista carte della Crimson Cup; la classificata ci arriva con il festival.
- **Il playtest chiuso** ha già la classificata. Il post di Koin su Steam del 25 agosto 2026 rimanda al [Discord ufficiale](https://discord.gg/originstcg) per le istruzioni di accesso, e il 24 settembre il team ha detto che il playtest riceverà aggiornamenti che la build del torneo non avrà.
- Per preparare i mazzi: il [deck builder](/it/deck-builder) e [tutti i mazzi di Origins TCG](/it/decks) pubblicati dalla community, ognuno con il codice del gioco (KGBLDC…) da incollare in Origins. Le [11 Leggendarie](/it/guides/origins-tcg-legendaries) che li guidano sono descritte una per una nella nostra guida.
- Se prepari la Crimson Cup, che si gioca con tre mazzi in Conquest: [come costruire i tre mazzi](/it/guides/origins-tcg-conquest).

## Cosa farà OriginsMeta con la classificata {#originsmeta}

Il nostro piano al 25 settembre 2026: la prima [tier list](/it/tier-list) di OriginsMeta dopo le finali della Crimson Cup del 25 ottobre, costruita sui risultati del torneo e sulla cima della classificata. Fino ad allora la pagina della tier list mostra i mazzi della community più votati e le carte più giocate, dichiarati come anteprime.

## Cosa non sappiamo ancora {#da-sapere}

- In cosa consistono le "ricompense esclusive" della classificata e come si ottengono.
- Quante sono le divisioni e come si chiamano quelle sotto Grandmaster.
- Se una vittoria e una sconfitta valgono sempre +10 e −10 VP, come nelle note del playtest, in ogni divisione e nella demo.
- Se la classificata avrà stagioni o reset, e se resterà accesa nella demo dopo la fine del festival, il 26 ottobre.
- Se i progressi in classificata passeranno al gioco completo.

## Fonti {#fonti}

I post ufficiali di Koin Games su Steam: [patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414) (14 agosto 2026), [patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) (21 agosto), [patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) (27 agosto), [Big Bob's Playtest Battle](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (25 agosto) e il [primo grande aggiornamento della demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611) (21 settembre); l'annuncio della Crimson Cup sul Discord ufficiale (24 settembre). Tutti letti il 25 settembre 2026.
`,
  },
  "origins-tcg-conquest": {
    slug: "origins-tcg-conquest",
    category: "decks",
    title: "Il Conquest in Origins TCG: come costruire tre mazzi che rispettano la regola delle carte uniche",
    metaTitle: "Conquest in Origins TCG: come costruire i tre mazzi",
    excerpt: "Come costruire una formazione Conquest per Origins TCG: come si contano le carte uniche, il controllo del deck builder e mazzi veri che rispettano la regola.",
    readTime: 7,
    updated: "2026-09-25",
    image: "/media/keyart-goldi.webp",
    faq: [
      { q: "Come si contano le carte in comune fra due mazzi Conquest?", a: "Si prendono le 13 carte diverse di ogni mazzo, la Leggendaria e le dodici carte base, ognuna contata una volta a prescindere dalle copie: le carte uniche fra i due mazzi sono 13 meno le carte in comune. Con un minimo di 8 carte uniche, due mazzi possono averne in comune al massimo 5. È la lettura di OriginsMeta, perché Koin Games non ha spiegato come si fa il conteggio; la regola è nel nostro articolo sulle regole della Crimson Cup." },
      { q: "Due dei miei mazzi Conquest possono avere la stessa Leggendaria?", a: "A Big Bob's Playtest Battle, ad agosto, no: ogni mazzo doveva avere una Leggendaria diversa. Per la Crimson Cup gli annunci del 9 e del 24 settembre 2026 non lo dicono; siccome nel ban si vede solo la Leggendaria, il nostro deck builder segnala due mazzi con la stessa." },
      { q: "Le due copie di una carta contano come due carte?", a: "Non nella lettura di OriginsMeta: una carta conta una volta a prescindere dalle copie, quindi ogni mazzo ha 13 carte da confrontare, la Leggendaria e le dodici carte base." },
      { q: "Come controllo i miei tre mazzi?", a: "Nel deck builder di OriginsMeta, in modalità Torneo (3 mazzi): il Controllo Conquest conta le carte uniche fra ogni coppia di mazzi, elenca quelle in comune e segnala due mazzi con la stessa Leggendaria." },
    ],
    body: `
## In breve {#in-breve}

- **Conquest** vuol dire portare più di un mazzo, abbastanza diversi fra loro, e bannare un mazzo dell'avversario (Koin Games, 25 agosto 2026); a Big Bob's Playtest Battle ogni mazzo doveva avere anche una Leggendaria diversa.
- Alla **Crimson Cup** (20–25 ottobre 2026) si portano tre mazzi con almeno 8 carte uniche fra ogni coppia. Regole, date, premi e check-in sono nel [nostro articolo sulle regole della Crimson Cup](/it/news/crimson-cup-format-check-in): questa guida parla di come costruire i tre mazzi.
- Koin non ha spiegato come si contano le carte uniche. OriginsMeta conta ogni carta una volta, a prescindere dalle copie, Leggendaria compresa: così due mazzi possono avere in comune al massimo 5 carte.
- Il [deck builder](/it/deck-builder) controlla tutto nella modalità "Torneo (3 mazzi)".
- Fra i 20 mazzi pubblicati su OriginsMeta entro le 20:00 del 25 settembre 2026, 174 delle 176 coppie con Leggendarie diverse rispettano la regola; le due che non la rispettano, entrambe con Buff, mancano di una carta.

## Che cosa chiede il Conquest {#il-formato}

Koin Games ha usato il Conquest per la prima volta a [Big Bob's Playtest Battle](/it/news/big-bobs-playtest-battle) il 28 agosto 2026. L'[annuncio su Steam](https://store.steampowered.com/news/app/4429430/view/1841579228677617) del 25 agosto lo descrive così: "devi registrare più mazzi prima che il torneo cominci, diversi fra loro, e hai la possibilità di bannare un mazzo del tuo avversario". Quella volta ogni mazzo doveva avere una Leggendaria diversa e almeno nove carte di differenza.

Per la Crimson Cup gli annunci del 9 e del 24 settembre 2026 fissano queste regole:

- **tre mazzi**; gli annunci non dicono se le Leggendarie devono essere diverse (a Big Bob's dovevano esserlo, e nel ban si vede solo la Leggendaria);
- **almeno 8 carte uniche** fra ogni coppia di mazzi;
- liste segrete fino alla top 4: quando si banna un mazzo dell'avversario se ne vede solo la Leggendaria;
- partite al meglio delle tre e gran finale al meglio delle cinque; al meglio delle cinque non c'è ban e bisogna vincere con tutti e tre i mazzi.

Il torneo si gioca sulla demo principale, con la sua lista carte. L'ultima patch di bilanciamento arriva due settimane prima dello Steam Next Fest: una formazione costruita oggi va ricontrollata dopo.

## Come si contano le carte uniche {#conteggio}

Ogni mazzo ha **13 carte diverse**: la Leggendaria e dodici carte base, di cui il gioco aggiunge da solo la seconda copia (25 carte in gioco). L'annuncio della Crimson Cup non dice come si contano le 8 carte uniche. Questa è la lettura di OriginsMeta, quella che applicano il nostro deck builder e i nostri tornei:

1. ogni carta conta **una volta**, qualunque sia il numero di copie;
2. conta **anche la Leggendaria**: due Leggendarie diverse sono sempre una carta di differenza;
3. le carte uniche fra il mazzo A e il mazzo B sono le carte di A che B non ha: **13 meno le carte in comune**.

Quindi "almeno 8 carte uniche" vuol dire **al massimo 5 carte in comune** fra due qualsiasi dei tuoi mazzi.

**Una coppia proprio al limite.** [3 Pigs Mid Range](/it/decks/community/3-pigs-mid-range-6311) (Three Not So Little Pigs) e [On Reveal Mid Range](/it/decks/community/on-reveal-mid-range-772e) (Mulan) hanno in comune cinque carte: En Passant, Ali Baba, Bagheera, Frog Prince ed Ellen Trechend. In gioco sono dieci delle 25 carte di ciascun mazzo, ma contano cinque: 13 − 5 = **8 carte uniche**, esattamente il minimo. Una carta in comune in più e la coppia non passerebbe più.

**Una coppia a cui manca una carta.** [Buff](/it/decks/community/buff-6f60) (Robin Hood) e [FACE IS THE PLACE](/it/decks/community/face-is-the-place-b049) (Legion of the Dead) hanno in comune sei carte: Musketeer, Defense Matrix, Bagheera, Three Blind Mice, Glinda e Galahad. 13 − 6 = **7**: per portarli insieme, una delle sei deve uscire da uno dei due mazzi.

Se Koin conta in un altro modo, per esempio copia per copia, i numeri cambiano: aggiorneremo questa guida e il builder appena la regola sarà spiegata.

## Costruire i tre mazzi nel deck builder {#deck-builder}

1. Apri il [deck builder](/it/deck-builder) e passa da "Mazzo singolo" a **"Torneo (3 mazzi)"**.
2. I mazzi A, B e C hanno ciascuno la sua scheda. Costruiscili dalle carte disponibili, oppure incolla un codice del gioco (KGBLDC…) in **Importa**: l'importazione cambia solo il mazzo su cui ti trovi.
3. Dalla pagina di qualsiasi mazzo della community, **"Apri nel deck builder"** carica quella lista nel mazzo attivo e lascia com'erano gli altri due: un modo rapido per provare coppie di mazzi pubblicati.
4. Il riquadro **"Controllo Conquest"** mostra, per ogni coppia, quante carte uniche sono diverse: in verde con ✓ dal minimo in su, in rosso con ✗ sotto. Passando il mouse su un numero compaiono le carte in comune. Il minimo è 8, il valore della Crimson Cup, e si può cambiare (Big Bob's Playtest Battle ne chiedeva 9). Il controllo segnala anche due mazzi con la stessa Leggendaria.
5. Quando i tre mazzi sono legali e abbastanza diversi, il riquadro dice **OK ✓**. Copia ogni mazzo con "Copia codice del gioco" e incollalo in Origins.

Il builder salva i tre mazzi nel browser mentre lavori. Anche i [tornei](/it/tournaments) creati su OriginsMeta possono usare il Conquest, con 2–4 mazzi per giocatore e un minimo scelto da chi organizza, e il builder di ogni torneo applica quelle regole. Le Leggendarie fra cui scegliere sono tutte nella [nostra guida alle 11 Leggendarie](/it/guides/origins-tcg-legendaries).

La Crimson Cup è il torneo dello Steam Next Fest, e con lo stesso festival la classificata apre nella demo: tutto sul festival è nella nostra [guida allo Steam Next Fest](/it/guides/steam-next-fest-2026), e [quello che è confermato sulla classificata](/it/guides/origins-tcg-ranked) nella sua guida.

## Mazzi della community che passano, e due che non passano {#coppie-della-community}

Alle 20:00 del 25 settembre 2026 OriginsMeta ha 20 mazzi pubblicati, guidati da 10 Leggendarie diverse. Fanno 190 coppie possibili:

- 14 coppie hanno la stessa Leggendaria: il deck builder le segnala, e a Big Bob's Playtest Battle non avrebbero potuto stare nella stessa formazione. Spesso sono versioni di una stessa lista, come [Healing Healsing](/it/decks/community/healing-healsing-9411), [Cure Control](/it/decks/community/cure-control-b630) e [CONTROL](/it/decks/community/control-2c2b), tre mazzi di Van Helsing che hanno in comune 12 carte su 13;
- delle altre 176, **174 rispettano** la regola delle 8 carte, e 30 non hanno nessuna carta in comune;
- due non la rispettano, entrambe a 7 ed entrambe con Buff: Buff e FACE IS THE PLACE, visti sopra, e Buff e [AGGRO /MIDRANGE PIGS GM](/it/decks/community/aggro-midrange-pigs-gm-6931) (Three Not So Little Pigs), che hanno in comune Bagheera, Mind Palace, Three Blind Mice, Beast, Glinda e Galahad.

Alcune coppie con i numeri veri:

| Coppia | Leggendarie | Carte in comune | Carte uniche di differenza | Almeno 8? |
| --- | --- | --- | --- | --- |
| [Dracula SUPER FUN](/it/decks/community/dracula-super-fun-d936) + [Qoh](/it/decks/community/qoh-f876) | Dracula, Queen of Hearts | nessuna | 13 | sì |
| [3 Pigs Mid Range](/it/decks/community/3-pigs-mid-range-6311) + [Healing Healsing](/it/decks/community/healing-healsing-9411) | Three Not So Little Pigs, Van Helsing | 1: Ali Baba | 12 | sì |
| [Dorothy Combo](/it/decks/community/dorothy-combo-7503) + [On Reveal Mid Range](/it/decks/community/on-reveal-mid-range-772e) | Dorothy, Mulan | 1: En Passant | 12 | sì |
| [Spellcast](/it/decks/community/spellcast-250f) + [The Trick-or-Treat Legion](/it/decks/community/the-trick-or-treat-legion-72c4) | Merlin, Legion of the Dead | 2: Golden Egg, Impundulu | 11 | sì |
| [King of Value Trade](/it/decks/community/king-of-value-trade-fd14) + [Healing Healsing](/it/decks/community/healing-healsing-9411) | King Arthur, Van Helsing | 4: Shahrazad, Ali Baba, Boitata, Spellbook | 9 | sì |
| [Qoh](/it/decks/community/qoh-f876) + [Value Board](/it/decks/community/value-board-c44a) | Queen of Hearts, Three Not So Little Pigs | 5: Bagheera, Baby Bear, Mind Palace, Ellen Trechend, Cockatrice | 8 | sì, al limite |
| [Buff](/it/decks/community/buff-6f60) + [FACE IS THE PLACE](/it/decks/community/face-is-the-place-b049) | Robin Hood, Legion of the Dead | 6 | 7 | no |

Nove coppie stanno esattamente a 8:

- [3 Pigs Mid Range](/it/decks/community/3-pigs-mid-range-6311) + [On Reveal Mid Range](/it/decks/community/on-reveal-mid-range-772e)
- [AGGRO /MIDRANGE PIGS GM](/it/decks/community/aggro-midrange-pigs-gm-6931) + [FACE IS THE PLACE](/it/decks/community/face-is-the-place-b049)
- [CONTROL](/it/decks/community/control-2c2b) + [Spellcast](/it/decks/community/spellcast-250f)
- [Cure Control](/it/decks/community/cure-control-b630) + [Glinda Reborn](/it/decks/community/glinda-reborn-2d6d)
- [Cure Control](/it/decks/community/cure-control-b630) + [Spellcast](/it/decks/community/spellcast-250f)
- [FACE IS THE PLACE](/it/decks/community/face-is-the-place-b049) + [Glinda Reborn](/it/decks/community/glinda-reborn-2d6d)
- [Healing Healsing](/it/decks/community/healing-healsing-9411) + [Spellcast](/it/decks/community/spellcast-250f)
- [Qoh](/it/decks/community/qoh-f876) + [Value Board](/it/decks/community/value-board-c44a)
- [Qoh](/it/decks/community/qoh-f876) + [VALUE MAXXING](/it/decks/community/value-maxxing-739d)

Delle 1.140 terne possibili di mazzi pubblicati, 867 hanno tre Leggendarie diverse e rispettano la regola su tutte e tre le coppie.

Sono conteggi, non consigli: dicono quali mazzi possono stare insieme secondo la regola, non quale formazione vince. Come si gioca ogni mazzo è scritto sulla sua pagina, nella guida del suo autore.

## Cosa non sappiamo ancora {#da-sapere}

- Come Koin conta le 8 carte uniche: l'annuncio del 24 settembre non lo dice.
- Se i tre mazzi della Crimson Cup devono avere Leggendarie diverse: gli annunci non lo dicono.
- La lista carte definitiva: quella provvisoria è nel gioco dal 21 settembre, e l'ultima patch di bilanciamento arriva due settimane prima dello Steam Next Fest.

## Fonti {#fonti}

I post di Koin Games su Steam del [25 agosto](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (Big Bob's Playtest Battle) e del [9 settembre 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278) (il torneo dello Steam Next Fest), l'annuncio della Crimson Cup sul Discord ufficiale (24 settembre) e i mazzi pubblicati su OriginsMeta entro le 20:00 del 25 settembre 2026, contati con la stessa funzione che usa il deck builder.
`,
  },
  "origins-tcg-locations": {
    slug: "origins-tcg-locations",
    category: "game",
    tags: { cards: ["christopher-robin", "merry-man", "bandersnatch", "ellen-trechend", "boogeyman", "dorothy", "king-arthur"] },
    title: "I Luoghi di Origins TCG: come cambiano la partita",
    metaTitle: "I Luoghi di Origins TCG spiegati",
    excerpt: "I Luoghi sono il terzo giocatore al tavolo: raddoppiano i danni, cambiano i costi, muovono i personaggi. Come funzionano, quali decidono le partite e come tenerne conto quando costruisci.",
    readTime: 7,
    updated: "2026-09-23",
    image: "/media/ss-board-locations.webp",
    faq: [
      { q: "Quanti Luoghi ci sono in Origins TCG?", a: "Nella Demo 2.0 ne girano 44. La pagina Steam ufficiale dice che il gioco completo pesca da un insieme di oltre cento luoghi." },
      { q: "Quando si vedono i luoghi di una partita?", a: "Uno per round nei primi tre round: il primo si conosce da subito, il secondo arriva al secondo round e il terzo al terzo. Dal quarto si gioca vedendo tutto il tabellone." },
      { q: "L'effetto di un luogo vale per entrambi i giocatori?", a: "Sì. Un luogo è una regola di quella corsia, non un bonus per chi ci arriva prima: Amplifying Amphitheatre raddoppia i tuoi danni e anche i suoi." },
      { q: "Dove vedo l'elenco completo?", a: "Nella pagina dei Luoghi di OriginsMeta, con ricerca, filtri per tipo di effetto e collegamenti alle carte che alcuni luoghi evocano." },
    ],
    body: `
## Perché i Luoghi contano più di quanto sembri

Origins TCG si gioca su **tre luoghi**, e ognuno porta una regola che vale in quella corsia per tutta la partita. È la parte di gioco che una lista non può controllare: due giocatori possono sedersi con le stesse venticinque carte e ritrovarsi in due partite diverse, perché un tabellone raddoppia i danni e l'altro fa costare tutto uno in meno.

Nella Demo 2.0 ne girano **44**. La [pagina Steam ufficiale](https://store.steampowered.com/app/4429430/Origins_TCG/) dice che il gioco completo pescherà da un insieme di "100+ rotating locations that reshape the board and demand a unique strategy". L'elenco completo con tutti gli effetti sta nella [pagina dei Luoghi](/it/locations), con ricerca e filtri; questa guida serve a sapere che farsene.

## Come arrivano

I tre luoghi si scoprono **uno per round nei primi tre round**. Il primo è sul tavolo da subito, il secondo compare al secondo round, il terzo al terzo. Dal quarto in poi non c'è più niente di nascosto e si gioca su un tabellone che si vede tutto.

Questo calendario è il motivo per cui i primi round non sono solo una questione di curva: al primo round stai impegnando carte in una corsia di cui non conosci ancora le due vicine. Tenere un personaggio un round in più per capire dove serve vale spesso più che giocarlo sulla curva nella corsia sbagliata.

## Le famiglie di effetti

Nel nostro elenco i luoghi sono raggruppati per quello che fanno alla partita, e vale la pena conoscere i gruppi perché chiedono risposte diverse.

- **Danni.** Amplifying Amphitheatre raddoppia tutti i danni lì, Burnturn Arena rosicchia ogni personaggio dopo il combattimento, Soul Artillery colpisce entrambe le barriere ogni volta che qualcosa muore. I corpi piccoli smettono di essere al sicuro.
- **Mana e costi.** Gold Spinning Wheel toglie uno a tutto, Castle in the Clouds solo alle carte da sette o più, Treasurer's Office aggiunge uno, Mana Battery ti fa conservare quello che non hai speso. Sono i luoghi che decidono chi va avanti di tempo.
- **Pesca e scarto.** The Sultan's Court regala una carta ogni round che però va spesa, Knowledge Vault premia chi riempie per primo la corsia, Junkyard ne toglie una a entrambi, Nostradamus' Call distrugge i due mazzi all'inizio del sesto round.
- **Movimento.** Conveyor Belt muove tutti a destra dopo il combattimento, Ballroom rimanda in mano un personaggio a caso, Open Meadow regala Muovere (Move).
- **Evocazioni e copie.** Cloning Lab riempie i tuoi spazi di copie di quello che hai appena giocato, Reflecting Pool lo copia in un altro luogo, Sherwood Forest continua a produrre [Merry Man](/it/cards/merry-man), Hundred Acre Woods mette un [Christopher Robin](/it/cards/christopher-robin) da entrambe le parti.
- **Parole chiave.** Stomping Grounds dà Travolgere (Trample), The Colosseum Doppio attacco (Double Attack), Windmill Ridge Difensore (Defender), Poison Grounds dà Tocco letale (Deathtouch) ai personaggi Evil, Blessed Grounds dà Scudo (Shield) a quelli Good.
- **Abilità.** Mirror Dimension ripete le abilità Alla rivelazione (On Reveal), Burial Grounds quelle Alla morte (On Death), Anti-Magic Vault toglie le abilità a tutti, Wonderland inverte l'ordine di attacco.
- **Distruzione e barriere.** The Gallows distrugge il nemico di fronte a chi entra, The Hill uccide tutti quelli che hanno la potenza più bassa dopo il combattimento, Wall of Dumpty si mangia il primo personaggio che giochi, Broken Gate fa tornare le barriere con 10 salute invece di 40.

## I Luoghi che decidono le partite

Alcuni vanno riconosciuti appena compaiono, perché cambiano quello che devi fare con la mano che hai.

- **Cloning Lab.** Quello che giochi lì viene copiato nei tuoi spazi liberi di quella corsia. Un corpo economico con una buona abilità Alla rivelazione diventa tre, e la corsia è decisa in un turno.
- **Mirror Dimension.** Ogni abilità Alla rivelazione si attiva due volte. Fa per una corsia quello che [Mulan](/it/cards/mulan) fa per un mazzo intero, e con lei si somma.
- **The Gallows.** Tutto quello che entra in gioco lì distrugge il nemico di fronte. Trasforma il tuo personaggio più economico in una rimozione, e punisce chi si espone per primo.
- **Anti-Magic Vault.** I personaggi perdono tutte le abilità. Un mazzo costruito sulle attivazioni lì non ha niente da fare; un mazzo di corpi solidi è a casa sua.
- **Amplifying Amphitheatre.** Tutti i danni raddoppiati, da entrambe le parti. Una chiusura con Travolgere come [Ellen Trechend](/it/cards/ellen-trechend) finisce la partita passando dalla barriera; ma vale anche per la sua.
- **Nostradamus' Call.** I due mazzi vengono distrutti all'inizio del sesto round. Qualunque sia il tuo piano, deve essere finito al quinto.

## Costruire tenendo conto dei Luoghi

Il tabellone non lo scegli, ma puoi costruire un mazzo che quasi mai si trova senza risposte.

1. **Non mettere tutto su una sola attivazione.** Un mazzo che funziona solo con le abilità Alla rivelazione è un mazzo che perde una corsia contro Anti-Magic Vault. Tieni qualche carta che va bene anche come corpo e basta.
2. **Tieni una carta che arriva lontano.** I luoghi che colpiscono le barriere (Overloaded Circuit, "Human" Cannon, Soul Artillery) premiano i mazzi capaci di chiudere una corsia da lontano invece di consumarla.
3. **I personaggi economici guadagnano di più.** Ogni luogo che regala una parola chiave o copia un corpo rende molto di più su una carta da due che su una da sette: la parte costosa la fa il luogo.
4. **Attenzione alle corsie che puniscono chi si espone.** The Hill, Wall of Dumpty e The Gallows puniscono tutti chi riempie per primo. Su un tabellone che non conosci, la seconda carta in una corsia è spesso più sicura della prima.

## Che cosa ci resta da verificare

Questo elenco corrisponde alla rotazione della Demo 2.0. Non abbiamo ancora controllato i luoghi uno per uno dentro il gioco, come abbiamo fatto con le 122 carte il 22 settembre 2026: quando lo faremo, la [pagina dei Luoghi](/it/locations) lo dirà, con la data e il conteggio.
`,
  },
  "on-reveal-midrange-guide": {
    slug: "on-reveal-midrange-guide",
    category: "decks",
    deckList: onRevealMidRange,
    tags: {
      communityDecks: [{ slug: "on-reveal-mid-range-772e", name: "On Reveal Mid Range" }],
      cards: ["mulan", "bagheera", "baby-bear", "mary", "black-knight", "frog-prince", "ali-baba", "white-queen", "fairy-godmother", "mowgli", "ellen-trechend", "bullseye", "en-passant"],
    },
    title: "On Reveal Mid Range: come si gioca il mazzo midrange di Mulan",
    metaTitle: "Guida al mazzo di Mulan: On Reveal Mid Range",
    excerpt: "Piano di gioco, mulligan e round per round di On Reveal Mid Range, mazzo di Mulan che ripete le abilità Alla rivelazione: classificata, competitivo e tornei.",
    readTime: 6,
    updated: "2026-09-23",
    image: "/cards/cover/mulan.webp",
    faq: [
      { q: "Che cosa fa Mulan in questo mazzo?", a: "Mulan è una 2/4 da 4 mana con Doppio attacco e, quando si attiva l'abilità Alla rivelazione di un alleato, la ripete. Nella lista ci sono nove carte con un'abilità Alla rivelazione: lei le raddoppia." },
      { q: "Che cosa si tiene al mulligan?", a: "Una curva che arrivi a Mulan al quarto round: Bagheera su uno spazio centrale, Baby Bear, poi Black Knight o Frog Prince. Mary vale la pena tenerla quando ci si aspetta una partita lunga." },
      { q: "Quale abilità Alla rivelazione guadagna di più da Mulan?", a: "Mowgli, che a 6 mana evoca un Baloo 6/6 in un altro luogo casuale: ripetuto, mette due Baloo sul campo. Raddoppiano bene anche Ellen Trechend e Fairy Godmother." },
      { q: "Come si prova il mazzo?", a: "Dalla scheda del mazzo su OriginsMeta con “Apri nel deck builder”, oppure “Copia codice del gioco” per incollare il codice (KGBLDC…) in Origins." },
    ],
    body: `
## Il mazzo in un paragrafo

**On Reveal Mid Range** è una lista **midrange** guidata da [Mulan](/it/cards/mulan), pubblicata su OriginsMeta il 22 settembre 2026 da [Davdas](/it/authors/davdas), dello staff del sito, e dichiarata per **classificata**, **competitivo** e **tornei**. L'idea è quella che l'autore scrive nella [scheda del mazzo](/it/decks/community/on-reveal-mid-range-772e): Mulan permette "di sfruttare a pieno" le abilità Alla rivelazione, e la lista è costruita per averne una che valga la pena ripetere in ogni round. Regge contro un mazzo aggressivo e diventa opprimente contro un controllo, perché le stesse carte comprano tempo e costruiscono il campo.

## La lista

Venticinque carte: la Leggendaria più dodici carte in due copie ciascuna. Le statistiche sono quelle della Demo 2.0, verificate una per una nel gioco il 22 settembre 2026.

| Carta | Costo | Che cosa fa |
| --- | --- | --- |
| [Mulan](/it/cards/mulan) ★ | 4 | 2/4, Doppio attacco; quando si attiva un'abilità Alla rivelazione di un alleato, la ripete |
| [Bagheera](/it/cards/bagheera) | 1 | 1/1; Alla rivelazione su uno spazio centrale ottiene +2⚔️/+2❤️ |
| [Baby Bear](/it/cards/baby-bear) | 2 | 1/1; infligge 1 danno a chi colpisce la tua barriera qui e Alla morte aggiunge un Papa Bear 4/4 alla mano |
| [Mary](/it/cards/mary) | 3 | 1/1; Alla rivelazione aggiunge un Little Lamb alla mano, Alla morte i tuoi Lamb ottengono +3⚔️/+3❤️ per sempre |
| [Black Knight](/it/cards/black-knight) | 3 | 2/2; Alla rivelazione infligge 2 danni al nemico di fronte |
| [Frog Prince](/it/cards/frog-prince) | 3 | 2/2; Alla rivelazione +3⚔️ oppure +3❤️, a scelta |
| [Ali Baba](/it/cards/ali-baba) | 3 | 2/3; pesca una carta ogni volta che danneggia una barriera avversaria |
| [White Queen](/it/cards/white-queen) | 4 | 3/3; Alla rivelazione riporta QUALSIASI personaggio nella mano del proprietario |
| [Fairy Godmother](/it/cards/fairy-godmother) | 5 | 3/3; Alla rivelazione dà +3⚔️/+3❤️ a un altro alleato |
| [Mowgli](/it/cards/mowgli) | 6 | 2/2; Alla rivelazione evoca Baloo (6/6) in un altro luogo casuale |
| [Ellen Trechend](/it/cards/ellen-trechend) | 8 | Travolgere; Alla rivelazione ottiene +3⚔️/+3❤️ per ogni carta nemica nel suo luogo |
| [Bullseye](/it/cards/bullseye) | 1 | Magia: 3 danni a QUALSIASI personaggio |
| [En Passant](/it/cards/en-passant) | 3 | Magia: muovi un alleato e infliggi la sua ⚔️ al personaggio di fronte |

Dieci unità e due magie, nove delle quali con un'abilità Alla rivelazione. È tutto il senso del mazzo: Mulan non è una carta da chiusura, è un moltiplicatore.

## Come vince il mazzo

Mulan ripete l'abilità Alla rivelazione di un alleato, quindi ogni carta giocata dopo di lei vale il doppio. Le tre copie migliori:

- **Mowgli** costa sei ed evoca un Baloo 6/6 in un altro luogo casuale. Ripetuto sono due Baloo: una carta sola che riempie due corsie che non stavi contendendo.
- **Ellen Trechend** cresce di +3⚔️/+3❤️ per ogni carta nemica nel suo luogo e ha Travolgere. In una corsia affollata è già una minaccia da sola; ripetuta, il bonus si applica due volte prima del combattimento.
- **Fairy Godmother** dà +3⚔️/+3❤️ a un altro alleato. Le due attivazioni si possono concentrare sullo stesso corpo o dividere su due, a seconda di che cosa l'avversario riesce a rimuovere.

Mulan ha anche **Doppio attacco**, quindi il suo 2/4 scambia meglio di come si legge.

## Mulligan

Serve una curva che arrivi a Mulan al quarto round senza restare indietro: **Bagheera** su uno spazio centrale (un 3/3 da un mana), poi **Baby Bear**, poi **Black Knight** o **Frog Prince**. **Mary** si tiene quando ci si aspetta una partita lunga: il Lamb che aggiunge alla mano è un corpo a basso costo e, se Mary muore, i Lamb già giocati crescono in modo permanente.

## Round per round

1. **Round 1–3: prendere spazio senza esporsi.** Bagheera al centro, Baby Bear dove ti aspetti i primi attacchi, Black Knight di fronte a qualcosa che vuoi morto. Una carta per corsia basta: il mazzo vuole un campo pari, non affollato, quando arriva Mulan.
2. **Round 4: Mulan.** Da qui in poi conta più l'ordine delle giocate delle carte in mano. Ogni round chiediti quale abilità Alla rivelazione valga la pena raddoppiare, e gioca quella carta nel luogo di Mulan.
3. **Round 5–6: le carte di valore.** Fairy Godmother, poi Mowgli al sesto. White Queen è la carta risposta della lista: riporta QUALSIASI personaggio nella mano del proprietario, quindi toglie di mezzo una chiusura avversaria per un round, o raccoglie la tua Mary per rigiocarla.
4. **Round 7–8: chiusura.** Ellen Trechend nella corsia che l'avversario ha riempito; En Passant per muovere un alleato, colpire chi ha di fronte e aprire la strada al danno di Travolgere.

## Le carte che comprano tempo

L'autore chiama **White Queen, Mary ed En Passant** le giocate "che vi fanno guadagnare del tempo", ed è ciò che permette al mazzo di sopravvivere a una partenza aggressiva. White Queen non è una rimozione: il personaggio torna in mano e può essere rigiocato, quindi va usata su qualcosa di costoso, o su un corpo già potenziato. En Passant è rimozione e riposizionamento insieme, ed è la risposta al bloccante piazzato davanti alla tua carta migliore.

## Matchup

I dati della classificata non sono pubblici: quella che segue è una lettura di OriginsMeta sulle liste, non un win rate.

- **Contro i mazzi aggressivi.** Baby Bear e Frog Prince giocato come 2/5 tengono le corsie; Bullseye toglie di mezzo i corpi da tre salute per un mana. Non spendere White Queen presto: serve per la prima minaccia grossa.
- **Contro i mazzi controllo.** Ali Baba è la carta che tiene piena la mano mentre spingi su una barriera. Non impegnare tutto in un luogo: una pulizia del campo a cui rispondi con un solo Mowgli è uno scambio accettabile, una mano vuota no.
- **Contro gli altri midrange.** Il mazzo fa lo stesso gioco di [3 Pigs Mid Range](/it/decks/community/3-pigs-mid-range-6311) e [King of Value Trade](/it/decks/community/king-of-value-trade-fd14): vince chi tira fuori più valore da ogni carta. Raddoppiare un'abilità Alla rivelazione è esattamente questo, quindi proteggi Mulan e gioca le carte economiche con un'abilità Alla rivelazione prima di lei solo se sei costretto.

## I punti deboli, nelle parole dell'autore

La scheda ne elenca due: **una buona curva è spesso essenziale** e **si rischia di rimanere a corto di soluzioni**. Vengono dallo stesso posto: nel mazzo non c'è rimozione ad area e ci sono solo due magie. Se devi scegliere tra usare una carta adesso e conservarla per un raddoppio dopo, usala adesso: Mulan ripete quello che giochi, non riporta indietro nulla.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/on-reveal-mid-range-772e) ha la lista con i grafici di curva e saghe, le note dell'autore, "Apri nel deck builder" e il codice del gioco da incollare in Origins.
- Le statistiche sono quelle della Demo 2.0 con la [patch del 21 settembre](/it/news/demo-patch-notes-0921); ogni scheda carta ha il suo storico dei bilanciamenti.
`,
  },
  "king-of-value-trade-guide": {
    slug: "king-of-value-trade-guide",
    category: "decks",
    deckList: kingOfValueTrade,
    tags: {
      communityDecks: [{ slug: "king-of-value-trade-fd14", name: "King of Value Trade" }],
      cards: ["king-arthur", "shield-maiden", "fairy-godmother", "dark-omen", "lancelot", "musketeer", "cowardly-lion", "roo", "shahrazad", "ali-baba", "spellbook", "boitata", "bagheera"],
    },
    title: "King of Value Trade: come si gioca il midrange di King Arthur",
    metaTitle: "Guida al King of Value Trade di King Arthur",
    excerpt: "Piano di gioco, mulligan e round per round di King of Value Trade, il midrange di King Arthur costruito per vincere ogni scambio due carte contro una.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/cards/cover/king-arthur.webp",
    faq: [
      { q: "Che cos'è uno scambio di valore in Origins TCG?", a: "Far rispondere una tua carta a due dell'avversario, o scambiare una carta economica con una costosa. Questo mazzo è costruito su quell'idea: Scudo, Primo colpo e potenziamenti fanno sopravvivere i tuoi personaggi allo scontro che vincono." },
      { q: "Che cosa si tiene al mulligan?", a: "Bagheera e Roo, solidi sulla curva, Musketeer e Shield Maiden per i primi round. Contro i mazzi aggressivi si tiene Cowardly Lion, contro il controllo Ali Baba." },
      { q: "Perché Roo è forte dopo la patch del 21 settembre?", a: "La patch della Demo del 21 settembre 2026 ha portato Roo da 2/3 a 2/4 (+1 Salute) per due mana mantenendo Muovere, quindi sopravvive alla maggior parte degli scambi dei primi round invece di scambiare in perdita." },
      { q: "Spellbook è indispensabile?", a: "No. Aggiunge una magia casuale ogni round per avere benzina e imprevedibilità, ma la scheda del mazzo dice che la lista può vincere anche senza." },
    ],
    body: `
## Il mazzo in un paragrafo

**King of Value Trade** è una lista **midrange** guidata da [King Arthur](/it/cards/king-arthur), pubblicata su OriginsMeta il 22 settembre 2026 da [Davdas](/it/authors/davdas), dello staff del sito, e dichiarata per la **classificata**. Il nome dice il piano: "quasi tutti i pezzi vogliono fare 2 x 1", cioè rispondere a due carte avversarie con una tua. Ripetuto abbastanza volte, il campo diventa tuo da solo, senza bisogno di un unico grande turno di chiusura.

## La lista

Venticinque carte: la Leggendaria più dodici carte in due copie ciascuna.

| Carta | Costo | Che cosa fa |
| --- | --- | --- |
| [King Arthur](/it/cards/king-arthur) ★ | 7 | 7/7 con Scudo; Alla rivelazione dà Scudo ai tuoi personaggi Good |
| [Bagheera](/it/cards/bagheera) | 1 | 1/1; Alla rivelazione su uno spazio centrale ottiene +2⚔️/+2❤️ |
| [Musketeer](/it/cards/musketeer) | 2 | 2/1 con Primo colpo |
| [Roo](/it/cards/roo) | 2 | 2/4 con Muovere |
| [Shahrazad](/it/cards/shahrazad) | 2 | 1/4; cura 1 danno alla tua barriera qui ogni volta che una carta entra nella tua mano |
| [Shield Maiden](/it/cards/shield-maiden) | 3 | 3/1 con Scudo |
| [Dark Omen](/it/cards/dark-omen) | 3 | Magia: distruggi QUALSIASI personaggio |
| [Cowardly Lion](/it/cards/cowardly-lion) | 3 | 2/5 con Difensore |
| [Ali Baba](/it/cards/ali-baba) | 3 | 2/3; pesca una carta ogni volta che danneggia una barriera avversaria |
| [Spellbook](/it/cards/spellbook) | 3 | Magia: da ora in poi una magia casuale in mano a ogni round, scartata prima del combattimento |
| [Lancelot](/it/cards/lancelot) | 4 | 4/4; ogni personaggio Good giocato nel suo luogo ottiene +2⚔️/+2❤️ |
| [Fairy Godmother](/it/cards/fairy-godmother) | 5 | 3/3; Alla rivelazione dà +3⚔️/+3❤️ a un altro alleato |
| [Boitata](/it/cards/boitata) | 5 | 5/5; i danni di magie e abilità diretti alle tue barriere vanno invece su quelle avversarie |

Dieci unità e due magie, e dieci carte su tredici sono personaggi Good: non è un caso, è ciò che rende la Leggendaria degna dei suoi sette mana.

## Come vince il mazzo

Il lavoro lo fanno tre parole chiave.

- **Scudo** assorbe il primo danno. King Arthur lo dà a tutti i tuoi personaggi Good in una volta, e [Shield Maiden](/it/cards/shield-maiden) se lo porta da sola: un 3/1 con Scudo scambia con un 3/3 e resta sul campo.
- **Primo colpo** su [Musketeer](/it/cards/musketeer) fa incassare il danno al nemico prima che possa rispondere: due mana che tolgono di mezzo un corpo più grosso.
- **I potenziamenti** di [Lancelot](/it/cards/lancelot) e [Fairy Godmother](/it/cards/fairy-godmother) trasformano uno scontro pari in uno a senso unico. Lancelot potenzia ogni personaggio Good giocato nel suo luogo, quindi premia chi insiste su una corsia invece di spargersi.

[Ali Baba](/it/cards/ali-baba) è il motore: ogni volta che danneggia una barriera peschi. [Shahrazad](/it/cards/shahrazad) è l'altra metà della stessa idea — cura un danno alla tua barriera nel suo luogo ogni volta che una carta entra in mano, quindi pescare ti tiene in piedi oltre che in vantaggio.

## Mulligan

**Bagheera è un must have**, e **Roo** adesso si tiene in ogni mano: la [patch della Demo del 21 settembre](/it/news/demo-patch-notes-0921) lo ha portato a 2/4, quindi sopravvive agli scambi dei primi round. **Musketeer** e **Shield Maiden** ti mandano avanti al secondo e al terzo round. Contro un mazzo aggressivo tieni **Cowardly Lion**, il cui Difensore tiene la corsia; contro un controllo tieni **Ali Baba**, che trasforma una barriera scoperta in carte. Se immagini una partita lunga, tenere **Spellbook** è una scelta sensata.

## Round per round

1. **Round 1–3: scambiare in vantaggio.** Bagheera al centro, Musketeer di fronte a un corpo da una o due salute, Roo dove potresti voler muovere più tardi. Ogni scontro vinto senza perdere il corpo è una carta guadagnata.
2. **Round 4–5: tenere una corsia.** Lancelot, poi i personaggi Good nel suo luogo: ognuno arriva +2⚔️/+2❤️ più grosso di quanto dovrebbe. Boitata al quinto è un 5/5 che gira sull'avversario i danni da magia diretti alle tue barriere.
3. **Round 6–7: la Leggendaria.** King Arthur è un 7/7 con Scudo e la sua abilità Alla rivelazione dà Scudo a tutto il Good che hai già sul campo. Non giocarlo su un campo vuoto: il valore sta negli Scudi, non nel corpo.
4. **Dark Omen, quando conta.** Tre mana per distruggere QUALSIASI personaggio sono la risposta all'unica carta che non puoi battere in uno scontro: un corpo potenziato, un Difensore nella corsia sbagliata, una Leggendaria avversaria.

## Due note dell'autore

- **Fairy Godmother non è solo una carta da chiusura.** La scheda fa notare che può servire anche a proteggere Ali Baba, Shahrazad o Cowardly Lion: +3❤️ sul corpo giusto vuol dire che il motore sopravvive un altro round.
- **Dark Omen va usato con precisione.** Con due copie e nessun'altra rimozione, spenderne una sul bersaglio sbagliato lascia viva la minaccia vera.

## Matchup

I dati della classificata non sono pubblici: questa è una lettura di OriginsMeta sulle liste, non un win rate.

- **Contro i mazzi aggressivi.** Cowardly Lion e Shahrazad insieme sono la rete di sicurezza: il Difensore incassa, la cura restituisce i danni che passano. Non scambiare Shield Maiden presto con un corpo da una salute se ne sta arrivando uno più grosso.
- **Contro i mazzi controllo.** Ali Baba, poi il secondo. La scheda è chiara: la lista vuole continuare a pescare mentre l'avversario cerca le risposte. Tieni Dark Omen per la carta che chiude la loro partita, non per la prima che giocano.
- **Contro chi colpisce le tue barriere con le magie** ([Healing Healsing](/it/decks/community/healing-healsing-9411) e le altre liste con Boitata). Chi piazza Boitata per primo gira quel danno: con due copie in lista conviene tenerne una, invece di perderle entrambe nello stesso scontro.

## I punti deboli, nelle parole dell'autore

La scheda ne elenca tre: **nessuna rimozione ad area**, **l'utilizzo di Dark Omen estremamente preciso** e **capire la strategia del mazzo avversario**. I primi due derivano dalla lista: a parte Dark Omen non c'è nulla che rimuova un personaggio, quindi un campo che lasci crescere resta cresciuto. Il terzo è la parte onesta: questo mazzo costruisce il suo vantaggio uno scambio alla volta, e ogni scambio è una decisione.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/king-of-value-trade-fd14) ha la lista completa con i grafici, le note dell'autore, "Apri nel deck builder" e il codice del gioco (KGBLDC…).
- Le statistiche sono quelle della Demo 2.0 con la [patch del 21 settembre](/it/news/demo-patch-notes-0921).
`,
  },
  "dorothy-combo-guide": {
    slug: "dorothy-combo-guide",
    category: "decks",
    deckList: dorothyCombo,
    tags: {
      communityDecks: [{ slug: "dorothy-combo-7503", name: "Dorothy Combo" }],
      cards: ["dorothy", "flying-monkey", "pegasus", "card-soldier", "twister-toss", "wicked-witch-of-the-west", "kanga", "en-passant", "roo", "spellbook", "hare", "basilisk", "magic-carpet"],
    },
    title: "Dorothy Combo: come si gioca il mazzo move dopo la patch del 21 settembre",
    metaTitle: "Guida al mazzo di Dorothy: Dorothy Combo",
    excerpt: "Il mazzo move ricostruito sui potenziamenti del 21 settembre: come cresce Dorothy, quali combo cercare, il mulligan e quello che la lista ancora non sa fare.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/cards/cover/dorothy.webp",
    faq: [
      { q: "Come cresce Dorothy?", a: "Dorothy può muoversi ogni round e ha +1⚔️/+1❤️ per ogni volta che un alleato si è mosso nella partita. Il contatore vale per tutta la partita, non per il round: ogni movimento, ovunque, la fa crescere." },
      { q: "Quali combo cerca il mazzo?", a: "Card Soldier, che dopo essersi mosso evoca una copia di sé sullo spazio precedente; Pegasus, che dopo il movimento raddoppia la sua ⚔️; e Magic Carpet, che all'ingresso muove gli altri alleati di uno spazio a destra o a sinistra." },
      { q: "È un mazzo competitivo?", a: "L'autore lo dichiara per classificata e fun e dice apertamente che probabilmente non è ancora ai livelli dei top tier, ma che dopo i potenziamenti del 21 settembre qualcosa si sta muovendo." },
      { q: "Come si prova il mazzo?", a: "Dalla scheda del mazzo su OriginsMeta con “Apri nel deck builder”, oppure copiando il codice del gioco (KGBLDC…) in Origins." },
    ],
    body: `
## Il mazzo in un paragrafo

**Dorothy Combo** è una lista **combo** guidata da [Dorothy](/it/cards/dorothy), pubblicata su OriginsMeta il 22 settembre 2026 da [Davdas](/it/authors/davdas), dello staff del sito, e dichiarata per **classificata** e **fun**. È il mazzo move, ricostruito dopo la [patch della Demo del 21 settembre 2026](/it/news/demo-patch-notes-0921), che ha potenziato tra le altre Dorothy, [Roo](/it/cards/roo) e [Magic Carpet](/it/cards/magic-carpet). Il giudizio dell'autore sta nella [scheda del mazzo](/it/decks/community/dorothy-combo-7503) e lo riportiamo così com'è: probabilmente non siamo ancora ai livelli dei top tier, però qualcosa si sta muovendo.

## La lista

Venticinque carte: la Leggendaria più dodici carte in due copie ciascuna.

| Carta | Costo | Che cosa fa |
| --- | --- | --- |
| [Dorothy](/it/cards/dorothy) ★ | 4 | 1/1; può muoversi ogni round e ottiene +1⚔️/+1❤️ per ogni movimento di un alleato nella partita |
| [Twister Toss](/it/cards/twister-toss) | 1 | Magia: muovi un alleato |
| [Card Soldier](/it/cards/card-soldier) | 2 | 3/1; dopo che si muove evoca una copia di sé sullo spazio precedente |
| [Roo](/it/cards/roo) | 2 | 2/4 con Muovere |
| [Basilisk](/it/cards/basilisk) | 2 | 1/2 con Tocco letale |
| [Pegasus](/it/cards/pegasus) | 3 | 2/4; dopo che si muove raddoppia la sua ⚔️ |
| [Flying Monkey](/it/cards/flying-monkey) | 3 | 4/1; Alla rivelazione muove QUALSIASI altro personaggio su uno spazio casuale qui |
| [Wicked Witch of the West](/it/cards/wicked-witch-of-the-west) | 3 | 1/5; quando sopravvive a un danno aggiunge una Flying Monkey alla mano e si muove di uno spazio a sinistra |
| [Kanga](/it/cards/kanga) | 3 | 2/3; prima del combattimento dà +1⚔️/+1❤️ agli alleati che si sono mossi |
| [En Passant](/it/cards/en-passant) | 3 | Magia: muovi un alleato e infliggi la sua ⚔️ al personaggio di fronte |
| [Spellbook](/it/cards/spellbook) | 3 | Magia: da ora in poi una magia casuale in mano a ogni round, scartata prima del combattimento |
| [Magic Carpet](/it/cards/magic-carpet) | 4 | 4/4; Alla rivelazione muove gli altri alleati di uno spazio a sinistra oppure a destra |
| [Hare](/it/cards/hare) | 5 | 4/1 con Primo colpo e Muovere |

Nove unità e tre magie, e quasi tutto o si muove o premia un movimento.

## Come vince il mazzo

Dorothy è un 1/1 che conta: **+1⚔️/+1❤️ per ogni volta che un alleato si è mosso nella partita**. Il contatore non si azzera e conta i movimenti ovunque sul campo, quindi una magia da un mana come [Twister Toss](/it/cards/twister-toss) non è mai sprecata: è un punto permanente sulla tua Leggendaria. Giocata al quinto round dopo qualche movimento, Dorothy arriva come un corpo vero e continua a crescere, perché si muove da sola.

Le combo che danno senso alla lista sono tre:

1. **Card Soldier più un movimento qualsiasi.** Un 3/1 da due mana che lascia una copia di sé ogni volta che si muove: con Twister Toss o Magic Carpet riempie una corsia da solo.
2. **Pegasus più un movimento qualsiasi.** Dopo essersi mosso raddoppia la sua ⚔️: da 2/4 diventa 4/4, e con il +1⚔️ di Kanga prima del combattimento è un corpo da 5 di potenza che l'avversario aveva valutato tre mana.
3. **Magic Carpet come motore.** Muove *tutti* gli altri alleati di uno spazio, nella direzione che scegli: una carta, più attivazioni — una copia di Card Soldier, un Pegasus raddoppiato, punti su Dorothy e il bonus di Kanga su tutto ciò che si è mosso.

## Mulligan

Sul mulligan l'autore non lascia note, quindi questa è una lettura di OriginsMeta. Tieni i movimenti economici, **Twister Toss** e **Roo**, e uno dei due corpi che pagano il movimento, **Card Soldier** o **Pegasus**. Magic Carpet è la carta che vuoi al quarto round, non in apertura. Una mano che parte dal terzo round è troppo lenta per un mazzo che vuole il contatore acceso dal primo.

## Round per round

1. **Round 1–2: accendere il contatore.** Card Soldier o Roo, poi Twister Toss su di lui. Ogni movimento è un punto permanente su Dorothy, anche quando il campo sembra fermo.
2. **Round 3: scegliere la corsia.** Pegasus, la Witch o Kanga. [Wicked Witch of the West](/it/cards/wicked-witch-of-the-west) è quella che genera da sola: un 1/5 che sopravvive quasi sempre e, ogni volta che sopravvive, ti mette in mano una Flying Monkey e si muove di uno spazio a sinistra — un altro punto per Dorothy.
3. **Round 4: Magic Carpet.** Scegli la direzione che porta i Card Soldier verso uno spazio libero e Pegasus dentro uno scontro che adesso vince.
4. **Dal quinto round: Dorothy, poi chiudere.** Dalla patch del 21 settembre costa 4, ma il quarto round è di Magic Carpet, e un round dopo lei arriva con il contatore più alto. Hare ha Primo colpo e Muovere: colpisce prima della risposta e tiene acceso il contatore. [Basilisk](/it/cards/basilisk) con Tocco letale è la risposta economica al corpo troppo grosso per affrontarlo ad armi pari, ed En Passant trasforma un Pegasus raddoppiato in una rimozione.

## Quello che il mazzo non sa fare

L'autore elenca due punti deboli, e sono quelli onesti: **può capitare di trovarsi incastrati male con le carte** e **alcune combo potrebbero non essere consistenti**. Vengono dallo stesso posto: [Flying Monkey](/it/cards/flying-monkey) muove un personaggio su uno spazio *casuale*, la copia di Card Soldier va sullo spazio che ha lasciato e Magic Carpet muove tutto, compresi gli alleati che volevi dov'erano. Decidi la direzione prima di giocare Magic Carpet e non dare per scontato che uno spazio resti libero.

## Matchup

I dati della classificata non sono pubblici: questa è una lettura delle liste, non un win rate.

- **Contro i mazzi aggressivi.** La Witch e Roo tengono le prime corsie; il Tocco letale di Basilisk risponde al primo corpo grosso. Dorothy può aspettare: è migliore tardi, quando il contatore è alto.
- **Contro i mazzi controllo.** È il matchup buono. Le copie di Card Soldier e le Flying Monkey continuano a tornare, quindi una sola pulizia del campo non ti svuota. Dopo una pulizia tieni in mano un Twister Toss per riaccendere il contatore.
- **Contro gli altri mazzi move.** Vince chi muove di più, ma Flying Monkey muove *qualsiasi* personaggio: usala per trascinare un Pegasus avversario fuori dallo spazio dove stava per raddoppiare.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/dorothy-combo-7503) ha la lista completa, i grafici, le note dell'autore, "Apri nel deck builder" e il codice del gioco.
- I potenziamenti da cui nasce questa lista sono nelle [patch notes del 21 settembre](/it/news/demo-patch-notes-0921); MetaShifting segue ogni modifica nella [sua pagina](/it/metashifting).
`,
  },
  "trick-or-treat-legion-guide": {
    slug: "trick-or-treat-legion-guide",
    category: "decks",
    deckList: trickOrTreatLegion,
    tags: {
      communityDecks: [{ slug: "the-trick-or-treat-legion-72c4", name: "The Trick-or-Treat Legion" }],
      cards: ["legion-of-the-dead", "bullseye", "flying-monkey", "golden-egg", "en-passant", "white-queen", "asanbosam", "morgiana", "mind-palace", "thumbelina", "impundulu", "bagheera", "boogeyman"],
    },
    title: "The Trick-or-Treat Legion: come si gioca il mazzo di Legion of the Dead",
    metaTitle: "Guida al mazzo di Legion of the Dead",
    excerpt: "La lista di Legion of the Dead costruita per essere imprevedibile: come funziona il campo di Zombie, la combo Golden Egg e Boogeyman, il mulligan e i matchup.",
    readTime: 6,
    updated: "2026-09-23",
    image: "/cards/cover/legion-of-the-dead.webp",
    faq: [
      { q: "Che cosa fa Legion of the Dead?", a: "È una Leggendaria magia da 7 mana: riempie il tuo campo di Zombie (2⚔️/2❤️). Una carta, tutti gli spazi liberi occupati." },
      { q: "Qual è la combo tra Golden Egg e Boogeyman?", a: "Boogeyman è un 7/7 da 4 mana la cui abilità Alla rivelazione distrugge l'alleato con la ⚔️ più bassa nel suo luogo, anche sé stesso. Golden Egg è uno 0/1 che alla morte evoca una Golden Goose 5/5 sul suo spazio: giocando prima l'Uovo, l'abilità di Boogeyman lo trasforma in una Goose invece di uccidere un tuo corpo vero." },
      { q: "Che cosa si tiene al mulligan?", a: "Bagheera e Thumbelina, meglio se affiancate da Bullseye. Anche la coppia Golden Egg più Boogeyman vale la pena tenerla di prima mano." },
      { q: "Perché Mind Palace è importante?", a: "Il mazzo svuota la mano in fretta: senza le due carte che pesca Mind Palace si rimane senza giocate prima che arrivi la Leggendaria." },
    ],
    body: `
## Il mazzo in un paragrafo

**The Trick-or-Treat Legion** è una lista **evil** guidata da [Legion of the Dead](/it/cards/legion-of-the-dead), pubblicata su OriginsMeta il 22 settembre 2026 da [Davdas](/it/authors/davdas), dello staff del sito, e dichiarata per **classificata**, **competitivo** e **tornei**. Di mazzi Legione ne girano diverse versioni; questa, nelle parole dell'autore, vuole aumentare la propria imprevedibilità mettendo insieme carte pronte a fare "uno scherzetto" ogni turno sul campo avversario. La lista completa e i grafici stanno nella [scheda del mazzo](/it/decks/community/the-trick-or-treat-legion-72c4).

## La lista

Venticinque carte: la Leggendaria più dodici carte in due copie ciascuna.

| Carta | Costo | Che cosa fa |
| --- | --- | --- |
| [Legion of the Dead](/it/cards/legion-of-the-dead) ★ | 7 | Leggendaria magia: riempi il tuo campo di Zombie (2⚔️/2❤️) |
| [Bullseye](/it/cards/bullseye) | 1 | Magia: 3 danni a QUALSIASI personaggio |
| [Bagheera](/it/cards/bagheera) | 1 | 1/1; Alla rivelazione su uno spazio centrale ottiene +2⚔️/+2❤️ |
| [Thumbelina](/it/cards/thumbelina) | 1 | 2/2, senza abilità |
| [Morgiana](/it/cards/morgiana) | 2 | 2/3; impedisce a TUTTE le abilità Alla rivelazione di attivarsi nel suo luogo |
| [Mind Palace](/it/cards/mind-palace) | 2 | Magia: pesca 2 carte |
| [Asanbosam](/it/cards/asanbosam) | 3 | 5/5; Alla rivelazione fa scartare una carta casuale di costo pari |
| [Golden Egg](/it/cards/golden-egg) | 3 | 0/1; Alla morte evoca una Golden Goose (5/5) sul suo spazio |
| [Flying Monkey](/it/cards/flying-monkey) | 3 | 4/1; Alla rivelazione muove QUALSIASI altro personaggio su uno spazio casuale qui |
| [En Passant](/it/cards/en-passant) | 3 | Magia: muovi un alleato e infliggi la sua ⚔️ al personaggio di fronte |
| [Boogeyman](/it/cards/boogeyman) | 4 | 7/7; Alla rivelazione distrugge l'alleato con la ⚔️ più bassa qui, anche sé stesso |
| [White Queen](/it/cards/white-queen) | 4 | 3/3; Alla rivelazione riporta QUALSIASI personaggio nella mano del proprietario |
| [Impundulu](/it/cards/impundulu) | 5 | 3/6; quando attacca aggiunge un Lightning Strike alla mano, da scartare prima del combattimento successivo |

Dieci unità e tre magie. Le tre carte da un mana non sono riempitivo: questo mazzo ha bisogno che il campo sia suo prima che arrivi la Leggendaria, perché gli Zombie occupano solo gli spazi *liberi*.

## Come vince il mazzo

Il danno lo fanno tre carte — **Boogeyman, Asanbosam e Impundulu** — e tutto il resto serve a proteggerle o ad aprire loro la strada.

- **Boogeyman** è un 7/7 da quattro mana, il rapporto migliore della lista, con una controindicazione: all'ingresso distrugge l'alleato con la ⚔️ più bassa nel suo luogo, compreso sé stesso. In una corsia vuota si uccide da solo; accanto a un [Golden Egg](/it/cards/golden-egg) uccide l'Uovo, che lascia sul suo spazio una Golden Goose 5/5. È la combo che indica l'autore: due carte, un 7/7 e un 5/5.
- **Asanbosam** è un 5/5 da tre mana e all'ingresso fa scartare all'avversario una carta casuale di costo pari.
- **Impundulu** trasforma ogni attacco in un [Lightning Strike](/it/cards/lightning-strike) in mano: danno ripetibile, a patto di spenderlo prima del combattimento successivo.

La **Leggendaria** chiude la partita più di quanto la apra: a sette mana *riempi il tuo campo di Zombie* occupa in un colpo solo tutti gli spazi liberi. Rende di più il round dopo uno scambio che ti ha svuotato il campo, o sulle due corsie che non stavi contendendo.

## Gli "scherzetti"

[En Passant](/it/cards/en-passant), [Flying Monkey](/it/cards/flying-monkey) e [White Queen](/it/cards/white-queen) sono ciò che l'autore intende quando parla di fare uno scherzetto ogni turno.

- **En Passant** muove un alleato e infligge la sua ⚔️ al personaggio di fronte: su Boogeyman o su una Golden Goose sono cinque-sette danni più un riposizionamento.
- **Flying Monkey** muove QUALSIASI altro personaggio su uno spazio casuale del suo luogo: trascina fuori un bloccante avversario, o porta un tuo corpo dove si combatte. Lo spazio è casuale, quindi è uno scherzetto, non un piano.
- **White Queen** riporta QUALSIASI personaggio nella mano del proprietario: una chiusura avversaria sparisce per un round, oppure il tuo Golden Egg torna in mano per essere rigiocato accanto a un secondo Boogeyman.

[Morgiana](/it/cards/morgiana) è la carta silenziosa: nel suo luogo non si attiva nessuna abilità Alla rivelazione, per nessuno dei due. Va messa dove le abilità Alla rivelazione avversarie fanno più male, ricordando che blocca anche le tue, Boogeyman compreso.

## Mulligan

La nota dell'autore è breve e chiara: **Bagheera e Thumbelina sono partenze perfette da affiancare a Bullseye**, e **la combo Golden Egg più Boogeyman può svoltare la partita anche tenuta di prima mano**. Bagheera su uno spazio centrale è un 3/3 da un mana; Thumbelina è un semplice 2/2, che a un mana è presenza sul campo senza doverci pensare.

## Round per round

1. **Round 1–2: prendere spazio a poco prezzo.** Bagheera al centro, Thumbelina dove ti aspetti di combattere, Bullseye su qualsiasi cosa abbia tre salute.
2. **Round 3: la prima minaccia.** Asanbosam come 5/5, oppure il Golden Egg nella corsia dove il round dopo arriverà Boogeyman.
3. **Round 4: Boogeyman.** Sull'Uovo se ce l'hai, altrimenti accanto al corpo più piccolo che puoi permetterti di perdere — e mai in una corsia vuota.
4. **Round 5–6: pressione e carte.** Impundulu comincia a produrre Lightning Strike; Mind Palace ricarica la mano. L'autore è esplicito: senza Mind Palace si resta senza carte troppo presto.
5. **Round 7: Legion of the Dead.** Ogni spazio libero diventa un 2/2. Conta gli spazi prima di giocarla: dopo un round di scambi vale due o tre corpi in più.

## Matchup

I dati della classificata non sono pubblici: questa è una lettura di OriginsMeta sulle liste.

- **Contro i mazzi che riempiono il campo.** Gli Zombie arrivano sugli spazi liberi, quindi più l'avversario è largo, meno rende la Leggendaria. Apri prima il campo con Bullseye e Boogeyman, e tieni Flying Monkey per il corpo potenziato.
- **Contro i mazzi controllo.** Lo scarto di Asanbosam e i Lightning Strike di Impundulu sono pressione che non dipende dalla sopravvivenza del campo. Tieni un Boogeyman dopo una pulizia: un 7/7 da quattro mana è il modo più rapido per ricostruire.
- **Contro i mazzi basati sulle abilità Alla rivelazione** (per esempio [On Reveal Mid Range](/it/decks/community/on-reveal-mid-range-772e), che con Mulan ripete ogni abilità Alla rivelazione). È qui che Morgiana si guadagna il posto: mettila nel luogo dove stanno accumulando abilità, accetta che lì si fermino anche le tue e gioca normalmente le altre due corsie.

## I punti deboli, nelle parole dell'autore

Sono due, dalla scheda del mazzo: **Mind Palace è molto importante per non rimanere troppo presto senza carte** e **Boogeyman ha bisogno di un bersaglio valido oppure di Morgiana**. Il secondo vale la pena ripeterlo: quel 7/7 è buono solo se nel suo luogo c'è qualcos'altro con ⚔️ più bassa. Il Golden Egg è l'assicurazione economica, gli Zombie della Leggendaria quella per la fase finale.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/the-trick-or-treat-legion-72c4) ha la lista con i grafici, le note dell'autore, "Apri nel deck builder" e il codice del gioco (KGBLDC…).
- Le statistiche sono quelle della Demo 2.0 con la [patch del 21 settembre](/it/news/demo-patch-notes-0921).
`,
  },
  "three-pigs-midrange-guide": {
    slug: "three-pigs-midrange-guide",
    category: "decks",
    deckList: threePigsMidRange,
    tags: {
      communityDecks: [{ slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" }],
      cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    },
    title: "3 Pigs Mid Range: come si gioca il mazzo midrange dei Three Not So Little Pigs",
    metaTitle: "Guida al mazzo dei Three Not So Little Pigs",
    excerpt: "Piano di gioco, mulligan e round per round di 3 Pigs Mid Range, il mazzo midrange guidato dai Three Not So Little Pigs, per ladder e competitivo.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/cards/cover/three-not-so-little-pigs.webp",
    faq: [
      { q: "Quale Leggendaria guida 3 Pigs Mid Range?", a: "Three Not So Little Pigs, un 3/3 da 7 mana con Travolgere: la sua abilità Alla rivelazione evoca un Not So Little Pig con Travolgere in ogni altro luogo, quindi una sola carta mette un corpo in ogni corsia." },
      { q: "Cosa si tiene nel mulligan?", a: "Cerca sempre Bagheera, Ali Baba, Big Bad Wolf e Rumple. Contro i mazzi con carte pericolose da 4 Salute, come Van Helsing o Glinda, tieni anche Axe Throw." },
      { q: "Come chiude la partita il mazzo?", a: "Con En Passant, che muove un alleato e colpisce il personaggio di fronte; con Ellen Trechend, che grazie a Travolgere spinge i danni fino alla barriera; e con i Lightning Strike che Impundulu aggiunge alla mano ogni volta che attacca." },
      { q: "Come provo il mazzo?", a: "Apri la scheda del mazzo su OriginsMeta e premi “Apri nel deck builder”, oppure “Copia codice del gioco” per incollare il codice del gioco (KGBLDC…) in Origins. Il builder controlla la regola 1 Leggendaria + 12 carte × 2." },
    ],
    body: `
## Il mazzo in un paragrafo

**3 Pigs Mid Range** è il secondo mazzo pubblicato su OriginsMeta da [Davdas](/it/authors/davdas), membro dello staff del sito, il 15 settembre 2026. È una lista **midrange** guidata dai [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs), pensata per la **ladder** e per il gioco **competitivo**. L'idea è semplice: vincere il tabellone nei primi round, prendere vantaggio in almeno un luogo e poi chiudere con carte che puniscono l'avversario convinto di essere al sicuro dietro una barriera. La lista completa, i grafici di composizione e il codice del gioco sono nella [scheda del mazzo](/it/decks/community/3-pigs-mid-range-6311); questa guida spiega come pilotarlo. Una seconda guida copre [matchup, interazioni chiave e Conquest](/it/guides/three-pigs-midrange-matchups).

## La lista

Venticinque carte: la Leggendaria più dodici carte giocate in due copie ciascuna.

| Carta | Costo | Ruolo |
| --- | --- | --- |
| [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs) ★ | 7 | Leggendaria: Travolgere, e con l'abilità Alla rivelazione evoca un Not So Little Pig con Travolgere in ogni altro luogo |
| [Bagheera](/it/cards/bagheera) | 1 | Carta da un mana che cresce se giocata su uno spazio centrale |
| [Rumple](/it/cards/rumple) | 2 | 2/2 che ti dà +1 mana nel round successivo |
| [Axe Throw](/it/cards/axe-throw) | 2 | 4 danni a qualsiasi personaggio |
| [Mind Palace](/it/cards/mind-palace) | 2 | Pesca 2 carte |
| [Piglet](/it/cards/piglet) | 2 | Alla rivelazione: potenzia gli altri alleati nel suo luogo |
| [Big Bad Wolf](/it/cards/big-bad-wolf) | 3 | 3/3 che ottiene +1/+1 dopo ogni combattimento |
| [Wicked Witch of the West](/it/cards/wicked-witch-of-the-west) | 3 | 1/5: quando sopravvive a un danno aggiunge una Flying Monkey alla tua mano e si muove di uno spazio a sinistra |
| [En Passant](/it/cards/en-passant) | 3 | Muovi un alleato e infliggi danni pari alla sua Potenza al personaggio di fronte |
| [Ali Baba](/it/cards/ali-baba) | 3 | 2/3 che pesca una carta quando danneggia la barriera avversaria |
| [Frog Prince](/it/cards/frog-prince) | 3 | Scegli +3 Potenza o +3 Salute quando viene rivelato |
| [Impundulu](/it/cards/impundulu) | 5 | 3/6: ogni volta che attacca aggiunge un Lightning Strike alla tua mano |
| [Ellen Trechend](/it/cards/ellen-trechend) | 8 | Travolgere; con l'abilità Alla rivelazione cresce per ogni carta nemica nel suo luogo |

Nove unità e tre magie. Tutto tranne Impundulu, i Pigs ed Ellen Trechend costa tre mana o meno: per questo l'autore definisce la curva "molto solida", c'è sempre qualcosa da giocare dal round uno al quattro.

## Come vince il mazzo

Il piano, dalla scheda del mazzo: prendere il controllo del tabellone nei primi round, acquisire vantaggio su almeno un luogo e poi chiudere con tre carte.

- **En Passant** muove un alleato e infligge danni pari alla sua Potenza al personaggio di fronte: apre la strada a un tuo pezzo grosso, oppure trasforma un Big Bad Wolf cresciuto in una rimozione.
- **Ellen Trechend** ha Travolgere e quando viene rivelata cresce per ogni carta nemica nel suo luogo: più l'avversario ha investito in una corsia, più forte colpisce, e Travolgere manda i danni in eccesso oltre il bloccante fino alla barriera. La scheda del mazzo la chiama "una chiusura al limite dell'illegale".
- **Impundulu**, se hai lavorato bene i primi round, ti ricompensa con un Lightning Strike a ogni attacco. Ogni Strike va usato prima del combattimento successivo o viene scartato: metti in conto due mana a round per lui.

La Leggendaria è il ponte tra le due fasi. A sette mana i Three Not So Little Pigs mettono un maialino con Travolgere in ciascuno degli altri due luoghi con una sola carta, oltre al proprio corpo 3/3 con Travolgere. Giocata in curva, riempie tutto il tabellone il round prima che Ellen Trechend entri in gioco.

## Mulligan

Cerca sempre **Bagheera, Ali Baba, Big Bad Wolf e Rumple**: regalano una buona partenza in curva e supportano i maialini già sul tabellone. Contro i mazzi con carte pericolose da 4 Salute, come Van Helsing o Glinda, tieni anche **Axe Throw**, che infligge esattamente quattro danni a qualsiasi personaggio. Ellen Trechend e Impundulu non sono ciò che vuoi nella mano iniziale: il mazzo li trova più tardi con Mind Palace e Ali Baba.

## Round per round

1. **Round 1–3: prendi il tabellone.** Bagheera su uno spazio centrale, poi Rumple o Piglet, poi una carta da tre. Rumple al round due significa quattro mana al round tre: un Wolf più Bagheera, o una Witch più una magia. La Wicked Witch of the West è il muro del mazzo: con cinque Salute sopravvive alla maggior parte dei colpi iniziali, e ogni volta che lo fa ricevi una Flying Monkey in mano e lei scivola di uno spazio a sinistra.
2. **Round 4–6: scegli una corsia e spingi.** Ali Baba vuole colpire una barriera: ogni volta che lo fa peschi. Frog Prince è un 5/2 che scambia al rialzo oppure un 2/5 che tiene la corsia: scegli dopo aver visto cosa ha rivelato l'avversario. Impundulu scende al round cinque e produce Lightning Strike dal primo attacco.
3. **Round 7–8: le chiusure.** I Pigs al sette (o al sei con un Rumple il round prima), Ellen Trechend all'otto nel luogo dove l'avversario ha più carte. Nello stesso round usa En Passant per muovere una minaccia dove non è attesa, o per togliere di mezzo l'unico bloccante.

## Restare in curva

La scheda del mazzo è chiara sul principale punto debole: "uscire fuori curva abbassa di molto il potenziale". La lista non ha rimozioni di massa e non cura le barriere, quindi ogni round saltato è un round regalato all'avversario. Due abitudini aiutano. Non tenere Rumple in attesa del turno "perfetto": il mana extra vale di più presto. E non tenere i Lightning Strike in mano sperando in un bersaglio migliore: uno Strike usato su una barriera resta tre danni che altrimenti perderesti.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/3-pigs-mid-range-6311) ha la lista con i grafici di curva di mana, saghe e parole chiave, le note dell'autore, il tasto “Apri nel deck builder” per il [deck builder](/it/deck-builder) e il codice del gioco (KGBLDC…) da incollare in Origins.
- [Matchup, interazioni chiave e Conquest](/it/guides/three-pigs-midrange-matchups) è la seconda parte di questa guida.
- Le statistiche delle carte sono quelle della patch della demo del 21 settembre 2026, verificate nel gioco il 22 settembre. Diverse carte di questa lista sono state ritoccate nelle patch 0.6.2 e 0.6.3, e il 21 settembre Frog Prince ha smesso di cancellare i potenziamenti già presenti: controlla lo storico dei bilanciamenti nella scheda di ogni carta.
`,
  },
  "three-pigs-midrange-matchups": {
    slug: "three-pigs-midrange-matchups",
    category: "decks",
    deckList: threePigsMidRange,
    tags: {
      communityDecks: [
        { slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" },
        { slug: "healing-healsing-9411", name: "Healing Healsing" },
      ],
      cards: ["three-not-so-little-pigs", "rumple", "wicked-witch-of-the-west", "flying-monkey", "en-passant", "big-bad-wolf", "impundulu", "lightning-strike", "piglet", "ellen-trechend", "axe-throw", "frog-prince", "van-helsing", "boitata", "mulan", "robin-hood", "king-arthur"],
    },
    title: "3 Pigs Mid Range: matchup, interazioni chiave e Conquest",
    metaTitle: "Matchup del mazzo dei Three Not So Little Pigs",
    excerpt: "La seconda parte della guida a 3 Pigs Mid Range: le interazioni che vincono le partite, i matchup principali, gli errori da evitare e Conquest.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-board-clash.webp",
    faq: [
      { q: "Cosa fa Ellen Trechend contro un tabellone largo?", a: "Quando viene rivelata cresce per ogni carta nemica nel suo luogo e ha Travolgere: una corsia che l'avversario ha riempito diventa il suo bersaglio migliore, e i danni oltre la Salute del bloccante finiscono nella barriera." },
      { q: "Come si gioca contro i mazzi di Van Helsing?", a: "Tieni Axe Throw per Van Helsing, che ha quattro Salute, fai pressione presto prima che Forbidden Knowledge arrivi a otto mana, e indirizza i Lightning Strike sui personaggi invece che sulle barriere finché Boitata è sul tabellone." },
      { q: "3 Pigs Mid Range e Healing Healsing si possono giocare insieme in Conquest?", a: "Sì. I due mazzi hanno Leggendarie diverse e condividono una sola carta, Ali Baba, quindi differiscono per dodici carte uniche, Leggendaria compresa: più delle 8 che la Crimson Cup chiede fra ogni coppia di mazzi." },
    ],
    body: `
## Prima di iniziare

Questa è la seconda parte della guida a **3 Pigs Mid Range**, il mazzo midrange guidato dai [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs) che [Davdas](/it/authors/davdas), staff di OriginsMeta, ha pubblicato il 15 settembre 2026. La [prima parte](/it/guides/three-pigs-midrange-guide) copre la lista, il piano di gioco, il mulligan e il round per round. Qui guardiamo alle interazioni che decidono le partite, ai matchup e al formato per cui il mazzo è stato pensato. Le note dell'autore sono nella [scheda del mazzo](/it/decks/community/3-pigs-mid-range-6311); la lettura dei matchup qui sotto è di OriginsMeta, basata sui testi delle carte della patch 0.6.3; le modifiche della patch della demo del 21 settembre sono nel [MetaShifting](/it/metashifting).

## Cinque interazioni da conoscere

1. **Rumple verso le chiusure.** Rumple ti dà +1 mana nel round successivo. Giocato al round cinque ti permette di rivelare i Three Not So Little Pigs al round sei, un round intero prima di quando l'avversario si aspetta una carta da sette; giocato al round sei mette Ellen Trechend sul tabellone al round sette.
2. **La Wicked Witch e la sua Flying Monkey.** La Witch è un 1/5: raramente muore per un solo colpo, e ogni volta che sopravvive a un danno ricevi una [Flying Monkey](/it/cards/flying-monkey) in mano e lei si muove di uno spazio a sinistra. L'abilità Alla rivelazione della Monkey muove qualsiasi altro personaggio, tuo o avversario, su uno spazio casuale nel suo luogo: usala per trascinare un bloccante nemico fuori dalla corsia in cui stai travolgendo, o per portare un Wolf dove si combatte.
3. **En Passant su un corpo cresciuto.** La magia muove un alleato e infligge danni pari alla sua Potenza al personaggio di fronte. Su un Big Bad Wolf che ha combattuto due volte sono cinque danni più uno spostamento; su Ellen Trechend è una rimozione che sposta anche il suo Travolgere dove la barriera è più debole. È anche la risposta a un bloccante parcheggiato davanti a uno dei tuoi maialini.
4. **I Lightning Strike di Impundulu.** Ogni attacco aggiunge un [Lightning Strike](/it/cards/lightning-strike), due mana per tre danni a qualsiasi personaggio o barriera, da usare prima del combattimento successivo. Sono tre danni mirati e ripetibili: bastano per la maggior parte delle carte iniziali del pool attuale, oppure vanno dritti in barriera quando il tabellone è già tuo.
5. **Piglet sui maialini.** L'abilità Alla rivelazione di Piglet potenzia gli altri alleati nel suo luogo. Il round dopo i Pigs, un Piglet accanto a un Not So Little Pig crea un corpo con Travolgere che colpisce più forte: la scheda del mazzo nota che le carte del mulligan "supportano i porcellini già in board".

## Matchup

I dati della classificata non sono ancora pubblici, quindi quella che segue è una lettura delle liste, non un win rate.

**Contro il controllo di Van Helsing, per esempio [Healing Healsing](/it/decks/community/healing-healsing-9411), dello stesso autore.** È il matchup che la nota sul mulligan ha in mente quando dice di tenere Axe Throw: Van Helsing è un 3/4 e quattro danni lo tolgono di mezzo prima che i suoi Tools inizino ad arrivare a ogni combattimento. Spingi i danni presto, perché il mazzo controllo vuole arrivare a otto mana per Forbidden Knowledge, che distrugge ogni personaggio sul tabellone, tuoi e suoi. Non calare i Pigs ed Ellen Trechend nella stessa finestra: tieni una chiusura per il round dopo la pulizia. Finché Boitata è in gioco, i danni delle magie alle sue barriere vengono inflitti alle tue, quindi indirizza i Lightning Strike sui personaggi finché non sparisce.

**Contro i tabelloni larghi (liste in stile Swarm, Mulan).** Più vanno larghi, più Ellen Trechend diventa grande: cresce per ogni carta nemica nel suo luogo. Tieni la Witch come muro nella corsia che stanno inondando, gioca Frog Prince come 2/5 invece che come 5/2 e conserva Axe Throw per la carta che potenzia le altre. [Mulan](/it/cards/mulan) ripete le abilità Alla rivelazione dei suoi alleati: è lei il bersaglio prioritario.

**Contro gli altri mazzi midrange (King Arthur, Robin Hood).** Decide il tempo: chi esce di curva perde. Qui Rumple dà il meglio, e gli Strike di Impundulu fanno la differenza a tabellone pari. L'abilità Alla rivelazione di [Robin Hood](/it/cards/robin-hood) infligge 2 danni a tutti i nemici: uccide Bagheera, Piglet e un Rumple appena giocato, ma non la Witch né un Frog Prince giocato come 2/5. A otto mana, non sovraccaricare una corsia di unità piccole. [King Arthur](/it/cards/king-arthur) dà Scudo ai personaggi Good: tieni Axe Throw per dopo che lo Scudo è stato consumato.

## Errori da evitare

- **Giocare i Pigs come salvataggio.** La Leggendaria evoca i maialini su spazi casuali degli altri luoghi: rende al massimo quando in quelle corsie ci sono già un Wolf o una Witch con cui combattere, non quando è già tutto perso.
- **Tenere Rumple.** È un corpo 2/2 con un bonus, e il bonus vale di più tra il round due e il sei.
- **Sprecare i Lightning Strike.** Vengono scartati prima del combattimento successivo: uno Strike in barriera è meglio di uno Strike perso.
- **Dimenticare i punti deboli.** Li elenca la scheda del mazzo: nessuna rimozione di massa e nessuna cura per le barriere. Non correre contro un mazzo che cura se non sei già avanti sul tabellone.

## Conquest e il tag "competitivo"

Il mazzo è segnato sia per la ladder sia per il gioco competitivo. Il Conquest, provato la prima volta al Big Bob's Playtest Battle, è anche il formato della [Crimson Cup](/it/news/crimson-cup-format-check-in) dello Steam Next Fest: si registrano tre mazzi con Leggendarie diverse, con almeno 8 carte uniche fra ogni coppia di mazzi (regole annunciate il 24 settembre 2026). 3 Pigs Mid Range si abbina in modo naturale all'altra lista dello stesso autore, [Healing Healsing](/it/decks/community/healing-healsing-9411): Leggendarie diverse, e l'unica carta in comune è Ali Baba, quindi differiscono per dodici carte uniche, Leggendaria compresa. Il [deck builder](/it/deck-builder) conta la differenza per te nella modalità torneo.
`,
  },
  "healing-healsing-guide": {
    slug: "healing-healsing-guide",
    category: "decks",
    deckList: healingHealsing,
    tags: {
      communityDecks: [{ slug: "healing-healsing-9411", name: "Healing Healsing" }],
      cards: ["van-helsing", "van-helsings-tools", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "spellbook", "phuong-hoang", "jekyll", "searing-light", "boitata", "tin-woodman", "forbidden-knowledge"],
    },
    title: "Healing Healsing: come si gioca il mazzo controllo di Van Helsing",
    metaTitle: "Guida a Healing Healsing, mazzo di Van Helsing",
    excerpt: "Piano di gioco, mulligan e round per round di Healing Healsing, la lista controllo di Van Helsing che cura, pesca e azzera il tabellone.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/cards/cover/van-helsing.webp",
    faq: [
      { q: "Quale Leggendaria guida Healing Healsing?", a: "Van Helsing, un 3/4 da 4 mana: prima di ogni combattimento aggiunge Van Helsing's Tools alla tua mano se non ce l'hai, una carta Scegli uno che gioca Holy Water, Silver Bullet, Garlic o Wooden Stake." },
      { q: "Cosa si tiene nel mulligan?", a: "Tieni Ali Baba, Baby Bear, Scarecrow, Van Helsing e Spellbook; contro l'aggro anche Jill. Shahrazad e Phuong Hoang non sono ciò che vuoi nei primi round." },
      { q: "Quando si lancia Forbidden Knowledge?", a: "A otto mana, quindi dal round otto o nove, idealmente in un round in cui l'avversario rivela per primo: lui cala le sue carte, poi la magia distrugge ogni personaggio sul tabellone." },
      { q: "Come vince il mazzo se distrugge anche il proprio tabellone?", a: "Con il vantaggio carte: Spellbook, Scarecrow e Ali Baba tengono la mano piena, Baby Bear lascia Papa Bear quando muore, Jekyll si trasforma in Hyde in mano, e le cure fanno crescere Phuong Hoang finché l'avversario resta senza risposte." },
    ],
    body: `
## Il mazzo in un paragrafo

**Healing Healsing** è stato il primo mazzo pubblicato su OriginsMeta, il 15 settembre 2026, da [Davdas](/it/authors/davdas), membro dello staff del sito. È una lista **controllo** guidata da [Van Helsing](/it/cards/van-helsing), pensata per la **ladder**. Il piano è sopravvivere ai primi round prendendo valore, curare i danni mentre [Phuong Hoang](/it/cards/phuong-hoang) cresce a ogni cura, e azzerare il tabellone con [Forbidden Knowledge](/it/cards/forbidden-knowledge) una volta arrivati a otto mana. La lista completa, i grafici di composizione e il codice del gioco sono nella [scheda del mazzo](/it/decks/community/healing-healsing-9411); questa guida spiega come pilotarlo. Una seconda guida copre [matchup, interazioni chiave ed errori da evitare](/it/guides/healing-healsing-matchups).

## La lista

Venticinque carte: la Leggendaria più dodici carte giocate in due copie ciascuna.

| Carta | Costo | Ruolo |
| --- | --- | --- |
| [Van Helsing](/it/cards/van-helsing) ★ | 4 | Leggendaria: prima del combattimento aggiunge Van Helsing's Tools alla tua mano se non ce l'hai |
| [Baby Bear](/it/cards/baby-bear) | 2 | Colpisce i nemici che danneggiano la tua barriera; Alla morte aggiunge Papa Bear alla tua mano |
| [Scarecrow](/it/cards/scarecrow) | 2 | Alla rivelazione: pesca una carta |
| [Shahrazad](/it/cards/shahrazad) | 2 | 1/4: cura 1 danno alla tua barriera ogni volta che una carta entra nella tua mano |
| [Ali Baba](/it/cards/ali-baba) | 3 | 2/3 che pesca una carta quando danneggia la barriera avversaria |
| [Jill](/it/cards/jill) | 3 | 2/4: cura 2 danni alla tua barriera ogni volta che subisce danni |
| [Spellbook](/it/cards/spellbook) | 3 | Per il resto della partita, una magia casuale in mano all'inizio di ogni round |
| [Phuong Hoang](/it/cards/phuong-hoang) | 4 | Rinascita, Muovere; ottiene +1/+1 ogni volta che un alleato o una barriera viene curato |
| [Jekyll](/it/cards/jekyll) | 4 | Alla rivelazione cura 3; se resta in mano dopo il combattimento diventa Hyde, un 5/3 con Travolgere |
| [Searing Light](/it/cards/searing-light) | 4 | 4 danni a un nemico e 4 cure alla tua barriera in quel luogo |
| [Boitata](/it/cards/boitata) | 5 | 5/5: i danni di magie e abilità alle tue barriere vengono inflitti invece alla barriera avversaria |
| [Tin Woodman](/it/cards/tin-woodman) | 6 | Alla rivelazione cura 8 a qualsiasi altro personaggio o barriera nel suo luogo |
| [Forbidden Knowledge](/it/cards/forbidden-knowledge) | 8 | Distruggi tutti i personaggi |

Nove unità e tre magie; quasi tutto costa tra due e quattro mana, con Boitata, Tin Woodman e Forbidden Knowledge in cima. Tre carte pescano, cinque curano, una pulisce il tabellone.

## Come vince il mazzo

Il piano dalla scheda del mazzo, in quattro passi:

1. **Controllare i primi round** prendendo rapidamente valore con Spellbook e Ali Baba.
2. **Arrivare al round otto o nove** e lanciare Forbidden Knowledge per prendere l'iniziativa. Cerca di usarla in un round in cui l'avversario è il primo a rivelare, così le sue carte sono sul tabellone quando la magia si risolve.
3. **Vincere di vantaggio carte e valore.** Il mazzo avversario dovrebbe finire le risorse mentre tu hai ancora abbastanza cure per far scalare i danni di Phuong Hoang.
4. **Mantenere il controllo.** Le carte in più ti permettono di tenere il tabellone a lungo.

Due motori fanno funzionare il tutto. Il primo sono le **carte che entrano in mano**: Van Helsing aggiunge i suoi Tools prima di ogni combattimento, Spellbook aggiunge una magia all'inizio di ogni round, Scarecrow e Ali Baba pescano, e ognuna di quelle carte cura 1 attraverso Shahrazad. Il secondo sono le **cure**: ogni cura, dal singolo punto di Shahrazad agli otto di Tin Woodman, dà +1/+1 a Phuong Hoang. Una Phuong che sta sul tabellone da qualche round è la vera minaccia del mazzo, e porta anche le parole chiave Rinascita e Muovere (vedi la sua scheda).

## Van Helsing's Tools

La Leggendaria in sé è un 3/4 da quattro mana. Quello che conta è la carta che aggiunge prima di ogni combattimento quando non ce l'hai già: [Van Helsing's Tools](/it/cards/van-helsings-tools), gratis dalla patch 0.6.2, ti fa scegliere uno di quattro effetti.

- [Holy Water](/it/cards/holy-water): rimuovi tutte le abilità da qualsiasi personaggio.
- [Silver Bullet](/it/cards/silver-bullet): danni a qualsiasi personaggio.
- [Garlic](/it/cards/garlic): stordisci qualsiasi personaggio.
- [Wooden Stake](/it/cards/wooden-stake): distruggi qualsiasi personaggio danneggiato.

"Se non ce l'hai" è la clausola da ricordare: usa i Tools ogni round, altrimenti Van Helsing smette di aggiungerli. Wooden Stake è la rimozione su singolo bersaglio che, secondo la scheda del mazzo, altrimenti manca alla lista: danneggia un personaggio con il colpo di Baby Bear, con Searing Light o con il Silver Bullet, poi impalalo.

## Mulligan

Tieni **Ali Baba, Baby Bear, Scarecrow, Van Helsing e Spellbook**. Contro i mazzi aggressivi tieni anche **Jill**, che cura 2 alla tua barriera ogni volta che subisce danni. Shahrazad e Phuong Hoang non sono utili nei primi round: sono il premio, non la preparazione, quindi rimandale nel mazzo.

## Round per round

1. **Round 1–3: preparazione.** Scarecrow o Baby Bear al due, Spellbook o Ali Baba al tre. Spellbook è la miglior giocata del round tre: da lì in poi inizi ogni round con una magia in più, e Shahrazad trasforma ciascuna di esse in una cura.
2. **Round 4–5: Van Helsing e le prime cure.** Van Helsing al quattro, oppure Jekyll per curare un'unità o una barriera danneggiata. Phuong Hoang scende quando c'è almeno una fonte di cure sul tabellone. Boitata al cinque: da lì in poi i danni di magie e abilità a una qualsiasi delle tue barriere vengono inflitti invece alla barriera avversaria in quel luogo.
3. **Round 6–7: stabilizzare.** Gli otto punti di cura di Tin Woodman sulla barriera sotto pressione, Searing Light sulla minaccia più grande, i Tools a ogni combattimento.
4. **Round 8 o 9: Forbidden Knowledge.** Muore tutto, da entrambe le parti. La tua parte perde meno: Baby Bear ti lascia Papa Bear in mano, un Jekyll tenuto in mano è già diventato Hyde, i Tools tornano prima del combattimento successivo, e per tutta la partita hai pescato più carte dell'avversario.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/healing-healsing-9411) ha la lista con i grafici di curva di mana e parole chiave, le note dell'autore, il tasto “Apri nel deck builder” per il [deck builder](/it/deck-builder) e il codice del gioco (KGBLDC…) da incollare in Origins.
- [Matchup, interazioni chiave ed errori da evitare](/it/guides/healing-healsing-matchups) è la seconda parte di questa guida.
- Le statistiche delle carte sono quelle della patch della demo del 21 settembre 2026, verificate nel gioco il 22 settembre. Scarecrow, Van Helsing's Tools e altre carte di questa lista sono cambiate nelle patch 0.6.2 e 0.6.3, e dal 21 settembre Wooden Stake può scegliere anche i personaggi con la Salute piena: vedi lo storico dei bilanciamenti nella scheda di ogni carta.
`,
  },
  "healing-healsing-matchups": {
    slug: "healing-healsing-matchups",
    category: "decks",
    deckList: healingHealsing,
    tags: {
      communityDecks: [
        { slug: "healing-healsing-9411", name: "Healing Healsing" },
        { slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" },
      ],
      cards: ["van-helsing", "shahrazad", "spellbook", "phuong-hoang", "jekyll", "hyde", "boitata", "baby-bear", "papa-bear", "mama-bear", "jill", "tin-woodman", "forbidden-knowledge", "holy-water", "ellen-trechend", "axe-throw", "mulan", "queen-of-hearts"],
    },
    title: "Healing Healsing: matchup, interazioni chiave ed errori da evitare",
    metaTitle: "Van Helsing: matchup di Healing Healsing",
    excerpt: "La seconda parte della guida a Healing Healsing: le interazioni di cura e pesca, i matchup principali, gli errori contro l'aggro e Conquest.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-board-combat.webp",
    faq: [
      { q: "Qual è l'interazione più forte di Healing Healsing?", a: "Shahrazad con Van Helsing e Spellbook: i Tools prima di ogni combattimento e la magia all'inizio di ogni round curano 1 ciascuno attraverso Shahrazad, e ogni cura dà +1/+1 a Phuong Hoang." },
      { q: "Come si gioca contro 3 Pigs Mid Range?", a: "Non riempire una corsia: Ellen Trechend cresce per ogni carta nemica nel suo luogo. Tieni Boitata per i Lightning Strike, cura i danni dei maialini con Travolgere e conserva Forbidden Knowledge per il round dopo la calata dei Pigs." },
      { q: "Cosa fa perdere le partite con questo mazzo?", a: "Lanciare Forbidden Knowledge troppo presto, lasciare Van Helsing's Tools in mano così che lui smetta di aggiungerli, e giocare Phuong Hoang prima che ci sia qualcosa da curare." },
    ],
    body: `
## Prima di iniziare

Questa è la seconda parte della guida a **Healing Healsing**, il mazzo controllo di Van Helsing che [Davdas](/it/authors/davdas), staff di OriginsMeta, ha pubblicato il 15 settembre 2026 come primo mazzo della community del sito. La [prima parte](/it/guides/healing-healsing-guide) copre la lista, il piano di gioco, il mulligan e il round per round. Qui guardiamo alle interazioni che decidono le partite, ai matchup e agli errori che costano di più. Le note dell'autore sono nella [scheda del mazzo](/it/decks/community/healing-healsing-9411); la lettura dei matchup qui sotto è di OriginsMeta, basata sui testi delle carte della patch 0.6.3; le modifiche della patch della demo del 21 settembre sono nel [MetaShifting](/it/metashifting).

## Cinque interazioni da conoscere

1. **Shahrazad e tutto ciò che mette una carta in mano.** [Shahrazad](/it/cards/shahrazad) cura 1 danno alla tua barriera nel suo luogo ogni volta che una carta entra nella tua mano. Van Helsing aggiunge i suoi Tools prima di ogni combattimento, Spellbook aggiunge una magia all'inizio di ogni round, Scarecrow e Ali Baba pescano, la morte di Baby Bear aggiunge Papa Bear. Con Shahrazad e Van Helsing sul tabellone curi ogni singolo round senza spendere una carta.
2. **Ogni cura nutre Phuong Hoang.** [Phuong Hoang](/it/cards/phuong-hoang) ottiene +1/+1 ogni volta che un alleato o una barriera viene curato. L'abilità Alla rivelazione di Tin Woodman è una sola cura da otto punti, quindi un solo +1/+1; le tante piccole cure di Shahrazad valgono più per Phuong di una grande.
3. **Jekyll e Hyde.** L'abilità Alla rivelazione di [Jekyll](/it/cards/jekyll) cura 3 a qualsiasi altro personaggio o barriera nel suo luogo. Tenuto in mano dopo il combattimento diventa [Hyde](/it/cards/hyde), un 5/3 con Travolgere, e un Hyde tenuto in mano ridiventa Jekyll: la stessa carta è un curatore o una chiusura a seconda di quando la giochi.
4. **Boitata contro il burn.** Se una magia o un'abilità danneggerebbe una delle tue barriere, [Boitata](/it/cards/boitata) infligge invece quel danno alla barriera avversaria in quel luogo. Contro i mazzi che chiudono con Lightning Strike o Searing Light, Boitata trasforma la loro portata nella tua.
5. **La famiglia di Baby Bear.** [Baby Bear](/it/cards/baby-bear) colpisce ogni nemico che danneggia la tua barriera nel suo luogo e, quando muore, aggiunge [Papa Bear](/it/cards/papa-bear) alla tua mano; Papa Bear colpisce più forte e quando muore aggiunge [Mama Bear](/it/cards/mama-bear), che distrugge i nemici che danneggiano la tua barriera. Tre corpi per una sola carta da due mana, e la cosa migliore da avere sul tabellone quando Forbidden Knowledge si risolve.

## Matchup

I dati della classificata non sono ancora pubblici, quindi quella che segue è una lettura delle liste, non un win rate.

**Contro 3 Pigs Mid Range ([l'altro mazzo](/it/decks/community/3-pigs-mid-range-6311) dello stesso autore) e le altre liste midrange.** La loro chiusura, Ellen Trechend, cresce per ogni carta nemica nel suo luogo: distribuisci le unità invece di ammassarle in una corsia. I Lightning Strike di Impundulu sono esattamente ciò per cui esiste Boitata. Axe Throw infligge quattro danni, che sono esattamente la Salute di Van Helsing: aspettati che venga risposto, e non affidarti solo a lui per le rimozioni. I Pigs scendono a sette mana e riempiono ogni corsia di corpi con Travolgere: è il round per cui conservare Forbidden Knowledge, un round dopo.

**Contro i mazzi aggro e i tabelloni larghi.** È il matchup che la nota sul mulligan ha in mente quando dice di tenere Jill: ogni volta che subisce danni cura 2 alla tua barriera. Baby Bear punisce ogni attaccante che passa, Jekyll cura ciò che conta, gli otto punti di Tin Woodman rimettono in piedi una barriera. Non inseguire le loro unità con i Tools una per una: stabilizza la barriera, arriva a otto mana e lascia che Forbidden Knowledge si prenda tutto il tabellone.

**Contro gli altri mazzi controllo.** Decide il vantaggio carte, e questo mazzo pesca più di quasi tutti: Spellbook è la carta da proteggere e da giocare per prima. Tieni Hyde per una corsia rimasta vuota, e conserva Holy Water per una Leggendaria la cui abilità regge il mazzo avversario, come [Mulan](/it/cards/mulan), che ripete le abilità Alla rivelazione dei suoi alleati, o la [Queen of Hearts](/it/cards/queen-of-hearts), che ne ripete le abilità Alla morte.

## Errori da evitare

- **Lanciare Forbidden Knowledge troppo presto.** Il consiglio della scheda del mazzo è aspettare un round in cui l'avversario rivela per primo, così le sue carte sono sul tabellone quando si risolve. Una pulizia su una corsia vuota sono otto mana buttati.
- **Lasciare i Tools in mano.** Van Helsing li aggiunge solo se non ce li hai. Usali a ogni combattimento, anche su un bersaglio piccolo.
- **Phuong Hoang prima delle cure.** Un 2/3 da quattro mana senza nulla da cui crescere è una carta debole; la stessa carta dopo che Shahrazad e Spellbook sono in gioco è la condizione di vittoria. La nota sul mulligan la mette, insieme a Shahrazad, tra le carte da non tenere nella mano iniziale.
- **Trattare la pesca come un lusso.** La scheda del mazzo avverte che "non trovare Forbidden Knowledge quando serve può essere molto doloroso": Scarecrow, Ali Baba e Spellbook sono il modo per trovarla, quindi giocali presto anche quando il tabellone non lo richiede.

## Conquest

Il mazzo è segnato solo per la ladder, ma si inserisce bene in una formazione Conquest: Leggendaria diversa da 3 Pigs Mid Range e una sola carta in comune, Ali Baba, quindi le due liste differiscono per dodici carte uniche, Leggendaria compresa: più delle 8 che la [Crimson Cup](/it/news/crimson-cup-format-check-in) chiede fra ogni coppia di mazzi. Il [deck builder](/it/deck-builder) conta la differenza nella modalità torneo.
`,
  },
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    category: "game",
    tags: { cards: ["mulan", "queen-of-hearts"] },
    title: "Origins TCG spiegato in cinque minuti",
    excerpt: "Cos'è Origins TCG, come funziona una partita sulle tre corsie a turni simultanei, cosa vuol dire free-to-compete e come provare la demo oggi.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/media/ss-board-locations.webp",
    faq: [
      { q: "Cos'è Origins TCG?", a: "Un gioco di carte collezionabili digitale di Koin Games, studio di Tampa (Florida) fondato nel 2021. I personaggi sono leggende di pubblico dominio — Robin Hood, Mulan, Queen of Hearts, Dracula e molti altri — reinterpretate in un unico mondo originale." },
      { q: "Quanto dura una partita?", a: "Circa sette minuti. I due giocatori agiscono insieme su tre corsie, quindi non si aspetta mai il turno dell'avversario." },
      { q: "Da quante carte è fatto un mazzo?", a: "Venticinque nella demo attuale, costruite intorno a una Leggendaria con un'abilità caratteristica. Mulan ripete le abilità Alla rivelazione dei tuoi alleati, la Queen of Hearts ripete le loro abilità Alla morte." },
      { q: "Si può giocare gratis a Origins TCG?", a: "Sì. La demo su Steam è gratuita e comprende il tutorial, le missioni contro boss con una propria IA e il gioco online. Ogni carta che serve per giocare a livello competitivo si guadagna giocando; i soldi comprano solo versioni da collezione delle carte." },
    ],
    body: `
## Cos'è

Origins TCG è un gioco di carte collezionabili digitale di **Koin Games**, studio di Tampa (Florida) fondato nel 2021 da veterani del settore. I personaggi sono leggende di pubblico dominio reinterpretate in un unico mondo originale: Robin Hood, Mulan, Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula e molti altri.

La promessa è il **free-to-compete**: ogni carta che serve per giocare a livello competitivo si guadagna giocando. I soldi comprano solo versioni da collezione delle carte, che si possono far valutare, scambiare e vendere. Gli sviluppatori lo chiamano "zero pay-to-win".

## Come funziona una partita

- **Tre corsie.** Tu e l'avversario combattete su tre tavoli contemporaneamente. Ogni corsia ha un luogo, pescato da un gruppo di più di cento che ruotano e cambiano le regole di quel tavolo.
- **Turni simultanei.** I due giocatori agiscono insieme, quindi non si aspetta mai. Una partita dura circa sette minuti.
- **Le carte combattono.** A differenza dei giochi che contano solo i punti sulle corsie, le unità si attaccano: la Potenza è quanto colpisci, la Salute quanto incassi.
- **Parole chiave.** La demo usa, fra le altre, Alla rivelazione (On Reveal), che si attiva quando giochi la carta, Alla morte (On Death), Primo colpo (First Strike), Doppio attacco (Double Attack) e Tocco letale (Deathtouch).
- **Una Leggendaria guida il mazzo.** Nella demo attuale i mazzi sono da 25 carte e ognuno è costruito intorno a una Leggendaria con un'abilità caratteristica: Mulan ripete le abilità Alla rivelazione dei tuoi alleati, la Queen of Hearts ripete le loro abilità Alla morte. Nella Demo 2.0 sono undici: [tutte e 11 le Leggendarie, carta per carta](/it/guides/origins-tcg-legendaries).

## Modalità

La demo ha un tutorial, missioni contro boss con una propria IA e il gioco online. La patch 0.6.1 ha aggiunto la **ladder classificata** con divisioni fino a Grandmaster, una classifica mondiale e i Punti Vittoria. Nella demo si accende con lo Steam Next Fest: quello che è confermato finora è nella nostra [guida alla classificata di Origins TCG](/it/guides/origins-tcg-ranked).

## Come giocare oggi

1. Installa la demo gratuita dalla [pagina Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Chi gioca la demo guadagna collezionabili esclusivi che saranno scambiabili al lancio del gioco completo.
2. Entra nel [Discord ufficiale](https://discord.gg/originstcg) per i tornei, gli AMA con il team e i playtest delle prossime build.
3. Secondo la pagina Steam l'interfaccia è in inglese, francese, italiano e tedesco e l'audio completo solo in inglese; il 25 settembre 2026 la demo aveva anche interfaccia e testi delle carte in spagnolo, che Steam non elenca ancora (verificato nel gioco). Il mobile è previsto per il 2027.

## Dove sta andando

La pagina Steam indica l'uscita nel quarto trimestre 2026, senza una data più precisa. La demo ha avuto il suo primo grande aggiornamento il 21 settembre 2026, la classificata si accende con lo Steam Next Fest (19–26 ottobre 2026) e il torneo più grande dello studio, la Crimson Cup, si gioca dal 20 al 25 ottobre. Il 25 settembre il menu principale della demo mostrava il Kickstarter come "Coming soon – Oct 27". Vedi la [roadmap](/it/guides/roadmap-and-dates) e la nostra [guida al Kickstarter](/it/guides/origins-tcg-kickstarter).
`,
  },
  "roadmap-and-dates": {
    slug: "roadmap-and-dates",
    category: "events",
    title: "Roadmap e date: dalla demo al lancio",
    metaTitle: "Origins TCG: roadmap e date di uscita",
    excerpt: "Tutte le date confermate di Origins TCG, dal primo post su Steam alla Demo 2.0 e alla Crimson Cup del Next Fest, più ciò che è previsto per il 2027.",
    readTime: 4,
    updated: "2026-09-25",
    image: "/media/art-the-club.webp",
    faq: [
      { q: "Quando esce Origins TCG su Steam?", a: "La pagina dello store su Steam indica l'uscita nel quarto trimestre 2026, senza una data più precisa. La demo ha avuto il suo primo grande aggiornamento il 21 settembre 2026 e la classificata si accende con lo Steam Next Fest, dal 19 al 26 ottobre 2026." },
      { q: "Quando si gioca la Crimson Cup?", a: "Dal 20 al 25 ottobre 2026, durante lo Steam Next Fest: qualificazioni regionali il 20, il 21 e il 22, poi playoff e finali. I premi valgono complessivamente 10.000 $ e comprendono una carta promo 1/1 esclusiva." },
      { q: "Esiste una versione mobile di Origins TCG?", a: "Non ancora. La versione mobile e l'apertura dei pacchetti da telefono sono annunciate per il 2027. Nel novembre 2025 il gioco ha avuto un soft launch sull'App Store in alcune regioni, prima che lo studio spostasse lo scambio delle carte su Steam." },
      { q: "Quando è uscita la demo gratuita?", a: "Il 15 e 16 luglio 2026 su Steam, con collezionabili esclusivi per chi la gioca. La ladder classificata è arrivata dopo, con la patch 0.6.1 del 14 agosto 2026." },
    ],
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
| 14 agosto | [Patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414): ladder classificata |
| 19 agosto | AMA sul Creator Program |
| 21 agosto | [Patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961): 23 carte ribilanciate |
| 27 agosto | [Patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 28 agosto | Big Bob's Playtest Battle, primo torneo Conquest, oltre 130 iscritti |
| 9 settembre | [Annunciato il torneo del Next Fest](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 10 settembre | AMA sul Kickstarter nel Discord ufficiale: Alpha Edition, rarità, valutazione, scambi, sconto VIP |
| 21 settembre | [Primo grande aggiornamento della demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611): interfaccia e tabellone nuovi, tutorial per collezionisti, pacchetti di prova, bilanciamenti, lista provvisoria delle carte della Crimson Cup |
| 24 settembre | [Regole della Crimson Cup](/it/news/crimson-cup-format-check-in): Conquest a tre mazzi, check-in |

## Cosa viene dopo

- **19–26 ottobre 2026.** Steam Next Fest: nella demo si accende la classificata, con ricompense esclusive. L'ultima patch di bilanciamento prima del festival è attesa due settimane prima.
- **20–25 ottobre 2026.** La Crimson Cup, il torneo dello Steam Next Fest: qualificazioni regionali il 20, 21 e 22, poi playoff e finali. Premi per un valore complessivo di 10.000 $, fra cui una carta promo 1/1 esclusiva.
- **27 ottobre 2026.** Il Kickstarter: il 25 settembre il menu principale della demo lo mostrava come "Coming soon – Oct 27". Koin Games non ha ancora annunciato la data su Steam né sul Discord ufficiale; la nostra [guida al Kickstarter](/it/guides/origins-tcg-kickstarter) la confermerà.
- **Q4 2026.** Uscita su Steam, secondo la pagina dello store, che non dà una data più precisa.
- **2027.** Versione mobile e apertura dei pacchetti da telefono. Negli AMA il team ha descritto un lancio completo con tutte le Leggendarie, tra cui King Arthur, Dracula, Winnie-the-Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein e Sherlock Holmes.

Le date vengono dai post ufficiali su Steam, dal Discord dello studio e, per il Kickstarter, dal menu della demo. Aggiorniamo questa pagina quando cambiano.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    category: "economy",
    title: "Due modi di collezionare: come funziona l'economia di Origins",
    metaTitle: "L'economia da collezione di Origins TCG",
    excerpt: "Le carte competitive sono gratis. Quelle da collezione sono limitate, valutate e scambiabili su Steam. Ecco cosa è confermato e cosa no.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-pack-opening.webp",
    faq: [
      { q: "Le carte da collezione rendono il mazzo più forte?", a: "No. Ogni carta competitiva si guadagna in gioco e le versioni da collezione sono edizioni limitate delle stesse carte: sono numerate, valutate digitalmente e scambiabili, ma in partita si comportano esattamente allo stesso modo." },
      { q: "Cos'è l'Alpha Edition?", a: "Myths & Legends: Alpha Edition è la prima edizione da collezione e si vende solo in preordine: bustine da cinque carte, box da 24 bustine e case da sei box, con sette livelli di rarità, dalla Collectible Card (in ogni bustina) alla Storybook (1 bustina su 1.200), secondo la pagina ufficiale di pre-registrazione. Finita la tiratura non si stampano altri box Alpha." },
      { q: "Dove si scambiano le carte di Origins?", a: "Sullo Steam Community Market e sui marketplace collegati, al lancio del gioco completo. I collezionabili guadagnati oggi nella demo diventeranno scambiabili in quel momento." },
      { q: "Cos'è un God pack?", a: "Un pacchetto raro in cui ogni carta è Leggendaria o superiore. Anche le versioni da collezione hanno un grado: al Card Party di luglio 2026 il team regalava uno Slab a chi pescava un'Alternate Art 10/10." },
    ],
    body: `
## La separazione

Origins tiene separate due cose che quasi tutti i giochi di carte mescolano:

1. **Giocare.** Ogni carta competitiva si guadagna in gioco. Niente di ciò che compri rende il mazzo più forte.
2. **Collezionare.** Le versioni in edizione limitata delle carte esistono in tirature numerate, arrivano **valutate digitalmente** e si possono comprare, vendere e scambiare con altri giocatori.

Le schermate di caricamento dello studio lo chiamano "real collecting in digital" e "two ways to collect".

## Cosa è confermato

- **Carte valutate.** Le versioni da collezione hanno un grado; al Card Party di luglio il team regalava uno Slab a chi pescava un'**Alternate Art 10/10**. Esistono gradi più bassi e serie diverse, con valori diversi.
- **God pack.** Pacchetti rari in cui ogni carta è Leggendaria o superiore.
- **Alpha Edition.** La prima edizione da collezione, "Myths & Legends: Alpha Edition", si vende solo in preordine: bustine da cinque carte, box da 24 bustine e case da sei box, con sette livelli di rarità, dalla Collectible Card (in ogni bustina) alla Storybook (1 bustina su 1.200), secondo la [pagina ufficiale di pre-registrazione](https://founder.origins-tcg.com). Finita la tiratura non si stampano altri box Alpha. Il set Alpha è stato uno dei temi dell'AMA sul Kickstarter del 10 settembre 2026 nel Discord ufficiale.
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
    title: "Origins TCG allo Steam Next Fest 2026: Demo 2.0, date e torneo",
    metaTitle: "Origins TCG allo Steam Next Fest 2026: date",
    excerpt: "Origins TCG allo Steam Next Fest, dal 19 al 26 ottobre 2026: la classificata nella demo, la Crimson Cup dal 20 al 25 ottobre, i premi e le iscrizioni.",
    readTime: 6,
    updated: "2026-09-25",
    image: "/media/keyart-queen-of-hearts.webp",
    faq: [
      { q: "Quando si svolge lo Steam Next Fest di ottobre 2026?", a: "Da lunedì 19 ottobre alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre 2026. Origins TCG partecipa con la demo gratuita, aggiornata il 21 settembre, e con il festival si accende la classificata." },
      { q: "Quando c'è il torneo di Origins TCG?", a: "Dal 20 al 25 ottobre 2026: tre qualificazioni il 20, 21 e 22 (una per macro-regione), poi playoff e finali." },
      { q: "Posso partecipare a una qualificazione dall'Italia?", a: "Sì. Koin Games dice che ci si può iscrivere a qualsiasi qualificazione a prescindere da dove si vive, ma chiede di iscriversi solo a quelle a cui si può davvero partecipare." },
      { q: "Costa qualcosa?", a: "No. La demo è gratuita su Steam e l'iscrizione al torneo si fa sul Discord ufficiale. Origins TCG è free-to-compete: ogni carta competitiva si guadagna giocando." },
      { q: "Cos'è il formato Conquest?", a: "Alla Crimson Cup ogni giocatore registra tre mazzi, con almeno 8 carte uniche fra due mazzi qualsiasi. Le liste restano segrete fino alla top 4: quando si banna un mazzo dell'avversario se ne vede solo la Leggendaria. Al meglio delle cinque non c'è ban e si vince con tutti e tre i mazzi. Koin Games ha provato il formato la prima volta a Big Bob's Playtest Battle il 28 agosto." },
    ],
    body: `
## Le due date da segnare

- **Steam Next Fest, edizione di ottobre 2026: 19–26 ottobre.** Il [festival delle demo giocabili di Valve](https://store.steampowered.com/sale/nextfest) va da lunedì 19 ottobre alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) c'è con la demo gratuita, che ha avuto il suo primo grande aggiornamento il 21 settembre: con il festival Koin accende la **classificata**, con ricompense esclusive.
- **Torneo di Origins TCG: 20–25 ottobre.** Koin Games lo chiama "il nostro torneo più grande di sempre": un evento su più giorni, Qualificazioni → Playoff → Finali, tutto online e in gioco.

## Cosa porta la demo al festival

Il grande aggiornamento della demo provato in tre playtest chiusi ad agosto (patch [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) e [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), tutte tracciate nel nostro [MetaShifting](/it/metashifting)) è arrivato in anticipo, il [21 settembre 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): interfaccia e tabellone nuovi, un tutorial per collezionisti, pacchetti di prova da aprire, nuove voci, bilanciamenti e la lista provvisoria delle carte della Crimson Cup, così si possono già costruire i mazzi per il torneo. I progressi passano dalla demo o dal playtest, da quello più avanti.

I mazzi, le carte e i boss dei playtest ora sono nella demo gratuita, e con loro il deckbuilding: ognuno costruisce il proprio mazzo da 25 carte (una Leggendaria più dodici carte, ognuna giocata in due copie). Il nostro [database carte](/it/cards) ha le 122 carte verificate nel gioco il 22 settembre.

Con l'inizio dello Steam Next Fest Koin accende la **classificata**, "con ricompense esclusive" (post Steam del 21 settembre). I playtest avevano divisioni fino a Grandmaster e una classifica mondiale: quello che è confermato finora è nella nostra [guida alla classificata di Origins TCG](/it/guides/origins-tcg-ranked). Pubblicheremo ogni cambiamento il giorno stesso in cui arriva.

## Il torneo, passo per passo

1. **Qualificazioni, 20–22 ottobre.** Tre, da 512 posti ciascuna: EMEA il 20 alle 19 CEST (32 passano), AMER il 21 alle 19 EST (64), APAC il 22 alle 19 SGT (32), più 128 wild card. Nelle parole di Koin, "puoi partecipare a QUALSIASI qualificazione, ovunque tu viva": scegli quella con l'orario che ti conviene e iscriviti solo a quelle che giocherai davvero — se ne può giocare più di una.
2. **Playoff e finali, 24–25 ottobre.** I playoff hanno 256 posti il 24 (le 10 EST, le 16 in Italia, le 22 SGT) e ne escono quattro giocatori per le finali del 25 alle 10 EST (le 15 in Italia, le 22 SGT). Attenzione all'ora: nella notte tra il 24 e il 25 ottobre in Europa finisce l'ora legale e l'Italia torna a UTC+1, mentre gli Stati Uniti restano in ora legale fino al 1° novembre; per questo lo stesso orario della costa est vale le 16 il sabato e le 15 la domenica. I content creator hanno inviti wildcard direttamente ai playoff (basta chiedere su Discord).
3. **Formato.** Ufficiale, dagli annunci del 9 e del 24 settembre: **Conquest a tre mazzi**, con almeno 8 carte uniche fra ogni coppia di mazzi; le liste restano segrete fino alla top 4, quindi quando si banna un mazzo dell'avversario se ne vede solo la Leggendaria. **Partite al meglio delle tre, gran finale al meglio delle cinque**: al meglio delle cinque non c'è ban e si vince con tutti e tre i mazzi. I dettagli nel [nostro articolo sulle regole](/it/news/crimson-cup-format-check-in).
4. **Check-in.** Apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi; poi una breve finestra, in ordine di arrivo, assegna i posti liberi a chi è in lista d'attesa. Chi salta il check-in non gioca: per la qualificazione EMEA delle 19 il check-in va dalle 17 alle 18:55, ora italiana.
5. **Su quale build.** Il torneo si gioca sulla demo principale e solo con le carte che ci sono lì: allenati su quella. Il playtest riceverà altri aggiornamenti e sarà diverso dalla build del torneo. L'ultima patch di bilanciamento arriva due settimane prima dello Steam Next Fest.
6. **Premi.** **Premi per un valore complessivo di 10.000 $**, come li chiama Koin: una carta promo 1/1 esclusiva del torneo, altre carte promo, pacchetti digitali, booster box e case Alpha, premi in denaro. Non è un montepremi in contanti: il denaro è una delle quattro categorie, e Koin ha promesso la ripartizione esatta per la settimana dopo il 24 settembre. Il torneo si chiama **Crimson Cup**: il nome è sulla grafica ufficiale di Koin, non un soprannome della community.

Le iscrizioni sono sul [Discord ufficiale](https://discord.gg/originstcg).

## Come prepararsi in cinque mosse

1. [Installa la demo gratuita su Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) e gioca le missioni: insegnano le tre corsie e i turni simultanei.
2. Leggi [Origins TCG spiegato in cinque minuti](/it/guides/origins-tcg-explained) e il [database carte](/it/cards): le statistiche sono quelle della patch della demo del 21 settembre, verificate carta per carta nel gioco.
3. Costruisci i tuoi tre mazzi Conquest nel nostro [deck builder](/it/deck-builder): segnala due mazzi con la stessa Leggendaria e conta le carte che cambiano tra un mazzo e l'altro. Passo per passo, con mazzi veri della community: [come costruire una formazione Conquest](/it/guides/origins-tcg-conquest).
4. Studia i [mazzi pubblicati dalla community](/it/decks): ogni lista ha i grafici di composizione, le note dell'autore, un tasto per aprirla nel builder e il codice del gioco da incollare in Origins. Pubblica la tua con una guida, così gli altri possono votarla.
5. Segui le [news](/it/news): ogni annuncio è riassunto entro un giorno, con il link alla fonte.

## Come OriginsMeta seguirà la settimana

Il nostro piano al 25 settembre 2026: pubblicheremo una news al giorno durante il festival, i mazzi del torneo con i grafici di composizione appena le liste saranno pubbliche (dalla top 4) e la prima tier list di OriginsMeta dopo le finali della Crimson Cup del 25 ottobre, costruita sui risultati del torneo e sulla cima della classificata. Fonti: i post ufficiali su Steam del 4 agosto, 25 agosto, [9 settembre](https://store.steampowered.com/news/app/4429430/view/1843481262690278) e [21 settembre 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611) e il [calendario dello Steam Next Fest](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    slug: "is-origins-tcg-pay-to-win",
    category: "economy",
    title: "Origins TCG è pay to win? Il free-to-compete spiegato",
    metaTitle: "Origins TCG è pay to win? Il free-to-compete",
    excerpt: "Koin Games presenta Origins TCG come il primo gioco di carte free-to-compete, a zero pay to win. Cosa compra davvero il denaro e i dubbi che restano.",
    readTime: 5,
    updated: "2026-09-25",
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

Il pacchetto che paghi, quindi, è un prodotto da collezione, non un prodotto di potenza. Il primo, "Myths & Legends: Alpha Edition", si vende solo in prevendita, in buste da cinque carte, box da 24 buste e case da sei box, con sette livelli di rarità; vedi [come funziona l'economia di Origins](/it/guides/collector-economy).

## Il confronto con gli altri

In Hearthstone o MTG Arena i pacchetti che compri contengono le carte con cui giochi, quindi spendere accorcia la strada verso la collezione completa. In Origins la strada verso un mazzo competitivo è giocare; spendere compra la vetrina da collezione accanto. È su questa differenza che poggia il "zero pay to win".

## I dubbi onesti

- **Il tempo resta un costo.** Le carte gratuite si guadagnano giocando; quante partite servano per completare un mazzo competitivo non è ancora stato pubblicato. Il deckbuilding è nella demo dall'aggiornamento del 21 settembre: lo misureremo durante lo Steam Next Fest (19–26 ottobre), quando si apre la classificata, e pubblicheremo i numeri.
- **Dettagli ancora da annunciare.** Prezzi fuori dalla prevendita Alpha, commissioni del marketplace oltre a quelle standard di Steam ed eventuali spinte alla progressione non sono stati comunicati. Niente fa pensare a un battle pass, ma niente lo esclude.
- **Il valore di mercato non è contante.** Vendere sul Mercato della Comunità di Steam versa il ricavato nel Portafoglio Steam. Se i marketplace collegati permetteranno di incassare in denaro vero non è confermato.
- **I pacchetti sono casuali.** Fra i descrittori dei contenuti la pagina Steam indica "In-game purchases" e "Chance based in-game purchases": cosa contiene un pacchetto da collezione è affidato al caso, anche se non cambia mai la forza di un mazzo.

## Perché conta per il meta

Siccome le versioni da collezione sono cosmetiche, una tier list deve giudicare solo la carta, mai l'edizione, e un mazzo pubblicato su OriginsMeta da un giocatore che non ha speso nulla vale quanto quello di chiunque altro. Terremo aggiornata questa pagina a ogni dichiarazione ufficiale; fonti: la pagina Steam di Origins TCG, le schermate di caricamento ufficiali e gli AMA di Koin Games di luglio e agosto 2026.
`,
  },
  "play-the-demo": {
    slug: "play-the-demo",
    category: "game",
    title: "Come scaricare e provare la demo di Origins TCG su Steam",
    metaTitle: "Come giocare la demo di Origins TCG su Steam",
    excerpt: "La demo gratuita in cinque passi: requisiti, download, lingua italiana, prime partite e cosa portano l'aggiornamento del 21 settembre e lo Steam Next Fest.",
    readTime: 5,
    updated: "2026-09-25",
    image: "/media/ss-legendary-mulan.webp",
    faq: [
      { q: "La demo di Origins TCG è gratuita?", a: "Sì. È gratuita su Steam dal 15 luglio 2026, per Windows e macOS." },
      { q: "La demo è in italiano?", a: "Sì, l'interfaccia e i testi delle carte. La pagina Steam elenca inglese, francese, italiano e tedesco per l'interfaccia e l'audio completo solo in inglese; il 25 settembre 2026 la demo aveva anche lo spagnolo, che Steam non elenca ancora (verificato nel gioco)." },
      { q: "Cosa serve per farla girare?", a: "Al minimo Windows 10 a 64 bit con un Intel i3-6100 o AMD FX-6300, 8 GB di RAM, una GTX 750 Ti o R9 270X e 2 GB di spazio; su Mac, macOS 10.14 o successivo con un Apple M1 o un Intel i5 dual-core e una GPU compatibile Metal." },
      { q: "La demo dà qualcosa per il gioco completo?", a: "Koin Games ha annunciato che i giocatori della demo guadagnano collezionabili esclusivi che diventeranno scambiabili all'uscita del gioco completo." },
      { q: "Cosa ha portato l'aggiornamento del 21 settembre?", a: "Il primo grande aggiornamento della demo: interfaccia e tabellone nuovi, un tutorial per collezionisti, pacchetti di prova, nuove voci, bilanciamenti e la lista provvisoria delle carte della Crimson Cup, con i mazzi, le carte e il deckbuilding provati nei playtest di agosto. La classificata si accende con lo Steam Next Fest, dal 19 al 26 ottobre 2026." },
    ],
    body: `
## Cosa trovi

La demo di Origins TCG è su Steam dal **15 luglio 2026**, gratuita, per Windows e macOS. Al 25 settembre 2026 è "Molto positiva": il 96% di 184 recensioni. Una partita dura circa sette minuti: i due giocatori muovono insieme su tre luoghi, pescati da un mazzo di più di cento che ruotano e cambiano le regole del tavolo. La demo comprende il tutorial, le missioni contro boss con una IA propria e il gioco online.

Lingue: la pagina Steam elenca **inglese, francese, italiano e tedesco** per l'interfaccia e l'audio completo **solo in inglese**. Il 25 settembre 2026 la demo aveva anche interfaccia e testi delle carte in **spagnolo**, che Steam non elenca ancora (verificato nel gioco).

## Requisiti

| | Minimi | Consigliati |
| --- | --- | --- |
| Windows | Windows 10 64 bit, Intel i3-6100 o AMD FX-6300, 8 GB di RAM, GTX 750 Ti o R9 270X | Windows 11 64 bit, Intel i5-8400, 16 GB di RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 o Intel i5 dual-core 2,5 GHz, GPU compatibile Metal | macOS 12 o successivo, Apple M1 Pro, 16 GB di RAM |
| Spazio | 2 GB | 2 GB |

## Cinque passi

1. **Installa Steam** ed entra con un account (quello gratuito basta).
2. **Apri la [pagina della demo](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** e premi "Download Origins TCG Demo"; oppure cerca "Origins TCG" dentro Steam e scegli la Demo. L'installazione dura un paio di minuti.
3. **Scegli la lingua** se Steam non l'ha fatto: tasto destro sul gioco nella libreria, Proprietà, Lingua. L'italiano traduce interfaccia e testi; il doppiaggio è in inglese.
4. **Gioca il tutorial** e poi le missioni: insegnano le tre corsie, i turni simultanei e le parole chiave Alla rivelazione (On Reveal), Alla morte (On Death), Primo colpo (First Strike), Doppio attacco (Double Attack) e Tocco letale (Deathtouch). La nostra [guida in cinque minuti](/it/guides/origins-tcg-explained) copre le stesse cose per iscritto.
5. **Vai online** e prova i mazzi preimpostati. Quando vuoi qualcosa di più, leggi i [mazzi pubblicati dalla community](/it/decks), ricostruiscili nel [deck builder](/it/deck-builder) e controlla le statistiche attuali delle carte nel [database carte](/it/cards) (patch della demo del 21 settembre 2026).

## Cosa sbloccano i giocatori della demo

Nel post di lancio di luglio Koin Games ha detto che chi gioca la demo guadagna **collezionabili esclusivi** che diventeranno scambiabili all'uscita del gioco completo. Metti il [gioco principale](https://store.steampowered.com/app/4429430/Origins_TCG/) nella lista dei desideri su Steam: la pagina dello store indica l'uscita nel quarto trimestre 2026.

## Cosa ha cambiato l'aggiornamento del 21 settembre

La demo ha avuto il suo primo grande aggiornamento il [21 settembre 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): interfaccia e tabellone nuovi, un tutorial per collezionisti, pacchetti di prova, nuove voci, bilanciamenti e la lista provvisoria delle carte della Crimson Cup, insieme ai mazzi, alle carte e al deckbuilding provati nei playtest chiusi di agosto. I progressi della demo o del playtest restano, da quello più avanti. La classificata si accende con lo Steam Next Fest (19–26 ottobre 2026): date, torneo e come prepararsi sono nella nostra [pagina sullo Steam Next Fest 2026](/it/guides/steam-next-fest-2026). I playtest delle build più grandi vengono annunciati sul [Discord ufficiale](https://discord.gg/originstcg) e finora poteva partecipare chiunque volesse.

Fonti: le pagine Steam di Origins TCG e della demo (lette il 25 settembre 2026) e i post ufficiali su Steam del 16 luglio, del 4 agosto e del 21 settembre 2026.
`,
  },
  "origins-tcg-kickstarter": {
    slug: "origins-tcg-kickstarter",
    category: "economy",
    title: "Kickstarter di Origins TCG: data, pre-registrazione, Alpha Edition e cosa sappiamo",
    metaTitle: "Kickstarter di Origins TCG: data, pre-registrazione, Alpha",
    excerpt: "Nel menu della demo il Kickstarter è “Coming soon – Oct 27”. Pre-registrazione aperta: 15% di sconto con 1 dollaro rimborsabile, box Alpha solo in preordine.",
    readTime: 4,
    updated: "2026-09-25",
    image: "/media/ls-collector-pack.webp",
    faq: [
      { q: "Quando parte il Kickstarter di Origins TCG?", a: "Il 25 settembre 2026 il menu principale della demo mostrava il Kickstarter come “Coming soon – Oct 27”, accanto a “Preregister for 15% off”. Koin Games non ha ancora annunciato la data su Steam né sul Discord ufficiale: la confermeremo qui appena lo farà." },
      { q: "Cosa dà il deposito da 1 dollaro?", a: "Lo stato VIP con il 15% di sconto al lancio. La pagina ufficiale dichiara che il deposito è interamente rimborsabile prima del lancio." },
      { q: "Cos'è l'Alpha Edition?", a: "Origins Myths & Legends Alpha Edition: pacchetti collector da 5 carte con almeno una Rara o superiore garantita, box da 24 pacchetti e case da 6 box. Box e case sono solo in preordine e la tiratura non verrà ripetuta." },
      { q: "Devo sostenere il Kickstarter per competere?", a: "No. Origins è free-to-compete: la classificata non richiede acquisti e la demo su Steam è gratuita. Il Kickstarter riguarda il collezionismo, non la forza in partita." },
      { q: "Dove si scambiano le carte?", a: "Sul Mercato della Comunità di Steam e sui marketplace collegati, secondo la pagina ufficiale. L'apertura dei pacchetti su mobile è prevista per il 2027." },
    ],
    body: `## La data: 27 ottobre, secondo la demo {#data}

Il **25 settembre 2026** il menu principale della demo di Origins TCG mostrava il riquadro del Kickstarter con **"Coming soon – Oct 27"** e **"Preregister for 15% off"**, mentre la schermata di caricamento pubblicizza la **Myths & Legends Alpha Edition**. È la prima data che Koin Games mostra da qualche parte, ma non è ancora un annuncio: su Steam e sul Discord ufficiale non c'è un post con la data e la [pagina di pre-registrazione](https://founder.origins-tcg.com) non la cita. Aggiorneremo questa guida il giorno in cui Koin la conferma.

*Aggiornamento del 25 settembre 2026: aggiunti la data mostrata nella demo, i temi dell'AMA dall'annuncio ufficiale e le date corrette.*

## Cosa è stato annunciato

Koin Games ha una pagina ufficiale di **Kickstarter Early Access** su [founder.origins-tcg.com](https://founder.origins-tcg.com). Il **10 settembre 2026** il team ha risposto alle domande sulla campagna in un'AMA nel Discord ufficiale; l'annuncio del giorno dopo ne elenca i temi: valutazione digitale, rarità delle carte, come funzionano gli scambi, carte con errori, God pack, carte 1/1 dei tornei, cos'è il set Alpha, i livelli del Kickstarter e come diventare VIP con il 15% di sconto. La nostra [news sull'AMA](/it/news/kickstarter-ama-pre-registration) la riassume.

## Pre-registrazione: 15% di sconto per 1 dollaro

- Diventare **VIP** con un **deposito di 1 dollaro** sblocca il **15% di sconto al lancio**.
- Il deposito è **interamente rimborsabile prima del lancio**, come dichiara due volte la pagina ufficiale.
- La pre-registrazione non impegna a sostenere la campagna: riserva solo il prezzo early-bird.

## L'Alpha Edition

La linea si chiama **Origins Myths & Legends Alpha Edition**:

| Prodotto | Contenuto |
| --- | --- |
| Pacchetto collector | 5 carte collezionabili, almeno una Rara o superiore garantita |
| Booster box | 24 pacchetti collector |
| Case | 6 booster box |

Per l'Alpha Edition **box e case sono solo in preordine**: finita quella tiratura, non verranno prodotti altri box o case Alpha. È la logica della prima edizione dei giochi di carte fisici, applicata a una collezione digitale.

## Scambi e proprietà

Le carte si comprano, vendono e scambiano sul **Mercato della Comunità di Steam** e sui marketplace collegati. Koin è passata al marketplace di Steam a inizio anno al posto di un sistema on-chain indipendente. L'apertura dei pacchetti su mobile è prevista per il **2027**.

## Il free-to-compete resta gratuito

Sostenere il Kickstarter compra collezionabili, non forza in partita: la classificata di Origins non richiede acquisti e la demo su Steam è gratuita. Vedi [Origins TCG è pay to win?](/it/guides/is-origins-tcg-pay-to-win) per come il lato competitivo e quello collezionistico restano separati.

## Le date

- 15 luglio 2026: demo gratuita su Steam.
- 21 settembre 2026: primo grande aggiornamento della demo.
- 19–26 ottobre 2026: Steam Next Fest, con la classificata nella demo e la Crimson Cup (20–25 ottobre).
- 27 ottobre 2026: Kickstarter, "Coming soon" nel menu della demo (non ancora annunciato su Steam o su Discord).
- Q4 2026: uscita su Steam, secondo la pagina dello store.
- 2027: mobile.

## Cosa fare adesso

1. Metti il gioco in lista dei desideri su Steam e prova la demo.
2. Se vuoi lo sconto al lancio, [pre-registrati su founder.origins-tcg.com](https://founder.origins-tcg.com) con il deposito rimborsabile.
3. Segui il Discord ufficiale per la conferma della data: la pubblicheremo qui e nelle news lo stesso giorno.

Fonti: [pagina ufficiale di pre-registrazione](https://founder.origins-tcg.com), [pagina Steam](https://store.steampowered.com/app/4429430/Origins_TCG/), l'annuncio dell'AMA nel Discord ufficiale (11 settembre 2026) e il menu principale della demo (letto il 25 settembre 2026).`,
  },
};

/** I testi di una guida, senza i dati che non cambiano con la lingua: le traduzioni nuove (guides-es.ts) portano solo questi. */
export type GuideCopy = Pick<Guide, "title" | "excerpt" | "body"> & Partial<Pick<Guide, "metaTitle" | "faq">>;

/**
 * Spagnolo (25/09/2026): i testi di guides-es.ts sopra i dati della versione inglese (categoria, carte, lista del mazzo,
 * copertina, data, tempo di lettura), così quei dati restano scritti una volta sola.
 */
const es = Object.fromEntries(guideSlugs.map((s) => [s, { ...en[s], ...esText[s] }])) as Record<GuideSlug, Guide>;

const all: Record<Locale, Record<GuideSlug, Guide>> = { en, it, es };

/** Giorno di prima pubblicazione di ogni guida (il primo commit che la contiene). Una guida nuova si aggiunge qui. */
const publishedOn: Record<GuideSlug, string> = {
  "origins-tcg-legendaries": "2026-09-25",
  "origins-tcg-ranked": "2026-09-25",
  "origins-tcg-conquest": "2026-09-25",
  "origins-tcg-locations": "2026-09-23",
  "on-reveal-midrange-guide": "2026-09-23",
  "king-of-value-trade-guide": "2026-09-23",
  "dorothy-combo-guide": "2026-09-23",
  "trick-or-treat-legion-guide": "2026-09-23",
  "three-pigs-midrange-guide": "2026-09-16",
  "three-pigs-midrange-matchups": "2026-09-16",
  "healing-healsing-guide": "2026-09-16",
  "healing-healsing-matchups": "2026-09-16",
  "steam-next-fest-2026": "2026-09-15",
  "is-origins-tcg-pay-to-win": "2026-09-15",
  "play-the-demo": "2026-09-15",
  "origins-tcg-kickstarter": "2026-09-15",
  "origins-tcg-explained": "2026-09-15",
  "roadmap-and-dates": "2026-09-15",
  "collector-economy": "2026-09-15",
};

/**
 * Date di una guida nella sua lingua, con la regola delle news (`modifiedIn` in news.ts): la prima pubblicazione resta
 * quella originale in ogni lingua, l'aggiornamento di una versione nata dopo (lo spagnolo) non va prima della sua nascita.
 */
function withDates(locale: Locale, g: Guide): Guide {
  return { ...g, published: publishedOn[g.slug as GuideSlug], updated: modifiedIn(locale, g.updated) };
}

export function getGuides(locale: Locale): Guide[] {
  return guideSlugs.map((s) => withDates(locale, all[locale][s]));
}

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return (guideSlugs as readonly string[]).includes(slug) ? withDates(locale, all[locale][slug as GuideSlug]) : undefined;
}
