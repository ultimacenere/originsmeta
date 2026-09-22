import type { Locale } from "../i18n";

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
   * lungo, contenere la parola chiave "Origins TCG" e stare entro 46 caratteri, perché `pageMeta`
   * aggiunge " · OriginsMeta" (14 caratteri) e il titolo reso non deve superare i 60.
   */
  metaTitle?: string;
  excerpt: string;
  readTime: number;
  updated: string;
  image?: string;
  /** domande e risposte in fondo alla guida (anche come dati strutturati FAQPage) */
  faq?: { q: string; a: string }[];
  body: string; // markdown
};

export const guideSlugs = [
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
const threePigsMidRange = ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"];
const healingHealsing = ["van-helsing", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "phuong-hoang", "jekyll", "boitata", "tin-woodman", "spellbook", "searing-light", "forbidden-knowledge"];

const en: Record<GuideSlug, Guide> = {
  "three-pigs-midrange-guide": {
    slug: "three-pigs-midrange-guide",
    category: "decks",
    deckList: threePigsMidRange,
    tags: {
      communityDecks: [{ slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" }],
      cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    },
    title: "3 Pigs Mid Range: how to play the Three Not So Little Pigs midrange deck",
    metaTitle: "3 Pigs Mid Range: Origins TCG deck guide",
    excerpt: "Game plan, mulligan and round-by-round play for 3 Pigs Mid Range, the midrange deck led by Three Not So Little Pigs, for ladder and competitive.",
    readTime: 6,
    updated: "2026-09-16",
    image: "/cards/cover/three-not-so-little-pigs.webp",
    faq: [
      { q: "Which Legendary leads 3 Pigs Mid Range?", a: "Three Not So Little Pigs, a 7-mana 3/3 with Trample: its On Reveal summons a Not So Little Pig with Trample at each other location, so one card puts a body in every lane." },
      { q: "What do you keep in the mulligan?", a: "Always look for Bagheera, Ali Baba, Big Bad Wolf and Rumple. Against decks with dangerous 4-Health cards such as Van Helsing or Glinda, keep Axe Throw too." },
      { q: "How does the deck close a game?", a: "With En Passant, which moves an ally and hits the character across from it; with Ellen Trechend, whose Trample pushes damage through into the barrier; and with the Lightning Strikes that Impundulu adds to your hand every time it attacks." },
      { q: "How do I try the deck?", a: "Open the deck page on OriginsMeta and press “Open in the deck builder”, or copy the OM code and import it. The builder checks the 1 Legendary + 12 cards × 2 rule." },
    ],
    body: `
## The deck in one paragraph

**3 Pigs Mid Range** is the second deck published on OriginsMeta by Davdas, a member of the site's staff, on 15 September 2026. It is a **midrange** list led by [Three Not So Little Pigs](/en/cards/three-not-so-little-pigs), tagged for **ladder** and **competitive** play. The idea is simple: win the board in the first rounds, get ahead in at least one location and then close with cards that punish an opponent who thinks they are safe behind a barrier. The full list, the composition charts and the OM code are on the [deck page](/en/decks/community/3-pigs-mid-range-6311); this guide explains how to pilot it. A second guide covers [matchups, key interactions and Conquest](/en/guides/three-pigs-midrange-matchups).

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

- The [deck page](/en/decks/community/3-pigs-mid-range-6311) has the list with mana curve, saga and keyword charts, the author's notes and the OM code to open it in the [deck builder](/en/deck-builder).
- [Matchups, key interactions and Conquest](/en/guides/three-pigs-midrange-matchups) is the second part of this guide.
- Card stats are those of playtest patch 0.6.3. Several cards in this list were touched in 0.6.2 and 0.6.3: check the balance history on each card page.
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
    metaTitle: "3 Pigs Mid Range matchups: Origins TCG",
    excerpt: "Part two of the 3 Pigs Mid Range guide: the interactions that win games, how to play the main matchups, the mistakes to avoid and Conquest.",
    readTime: 5,
    updated: "2026-09-16",
    image: "/media/ss-board-clash.webp",
    faq: [
      { q: "What does Ellen Trechend do against a wide board?", a: "She grows on reveal for every enemy card in her location and has Trample, so a lane the opponent has filled becomes her best target: the damage that exceeds the blocker's Health goes into the barrier." },
      { q: "How do you play against Van Helsing decks?", a: "Keep Axe Throw for Van Helsing, who has four Health, pressure early before Forbidden Knowledge comes online at eight mana, and aim Lightning Strikes at characters rather than barriers while Boitata is on the board." },
      { q: "Can 3 Pigs Mid Range and Healing Healsing be played together in Conquest?", a: "Yes. The two decks have different Legendaries and share a single card, Ali Baba, so they are eleven cards apart, more than the nine required at Big Bob's Playtest Battle." },
    ],
    body: `
## Before you start

This is the second part of the guide to **3 Pigs Mid Range**, the midrange deck led by [Three Not So Little Pigs](/en/cards/three-not-so-little-pigs) that Davdas, OriginsMeta staff, published on 15 September 2026. The [first part](/en/guides/three-pigs-midrange-guide) covers the list, the game plan, the mulligan and the round-by-round play. Here we look at the interactions that decide games, at the matchups and at the format the deck is tagged for. The author's notes are on the [deck page](/en/decks/community/3-pigs-mid-range-6311); the matchup reading below is OriginsMeta's, based on the card texts of patch 0.6.3.

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

The deck is tagged for both ladder and competitive play. In the Conquest format used at Big Bob's Playtest Battle, and expected for the Steam Next Fest tournament, you register several decks with different Legendaries and at least nine different cards between any two of them. 3 Pigs Mid Range pairs naturally with the same author's other list, [Healing Healsing](/en/decks/community/healing-healsing-9411): different Legendaries, and the only card they share is Ali Baba, so they are eleven cards apart. The [deck builder](/en/deck-builder) counts the difference for you in tournament mode.
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
    metaTitle: "Healing Healsing: Origins TCG deck guide",
    excerpt: "Game plan, mulligan and round-by-round play for Healing Healsing, the Van Helsing control deck that heals, draws and resets the board.",
    readTime: 6,
    updated: "2026-09-16",
    image: "/cards/cover/van-helsing.webp",
    faq: [
      { q: "Which Legendary leads Healing Healsing?", a: "Van Helsing, a 4-mana 3/4: before every combat he adds Van Helsing's Tools to your hand if you do not have it, a Choose One card that plays Holy Water, Silver Bullet, Garlic or Wooden Stake." },
      { q: "What do you keep in the mulligan?", a: "Keep Ali Baba, Baby Bear, Scarecrow, Van Helsing and Spellbook; against aggro keep Jill too. Shahrazad and Phuong Hoang are not what you want in the first rounds." },
      { q: "When do you cast Forbidden Knowledge?", a: "At eight mana, so from round eight or nine, ideally in a round where the opponent reveals first: they commit their cards, then the spell destroys every character on the board." },
      { q: "How does the deck win if it destroys its own board too?", a: "On card advantage: Spellbook, Scarecrow and Ali Baba keep the hand full, Baby Bear leaves Papa Bear behind when it dies, Jekyll turns into Hyde in hand, and the heals make Phuong Hoang grow until the opponent runs out of answers." },
    ],
    body: `
## The deck in one paragraph

**Healing Healsing** was the first deck published on OriginsMeta, on 15 September 2026, by Davdas, a member of the site's staff. It is a **control** list led by [Van Helsing](/en/cards/van-helsing), tagged for the **ladder**. The plan is to survive the early rounds while taking value, to heal through the damage while [Phuong Hoang](/en/cards/phuong-hoang) grows with every heal, and to reset the board with [Forbidden Knowledge](/en/cards/forbidden-knowledge) once you have eight mana. The full list, the composition charts and the OM code are on the [deck page](/en/decks/community/healing-healsing-9411); this guide explains how to pilot it. A second guide covers [matchups, key interactions and the mistakes to avoid](/en/guides/healing-healsing-matchups).

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

- The [deck page](/en/decks/community/healing-healsing-9411) has the list with mana curve and keyword charts, the author's notes and the OM code to open it in the [deck builder](/en/deck-builder).
- [Matchups, key interactions and mistakes to avoid](/en/guides/healing-healsing-matchups) is the second part of this guide.
- Card stats are those of playtest patch 0.6.3. Scarecrow, Van Helsing's Tools and other cards in this list were changed in 0.6.2 and 0.6.3: see the balance history on each card page.
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
    metaTitle: "Healing Healsing matchups: Origins TCG",
    excerpt: "Part two of the Healing Healsing guide: the healing and card-draw interactions, the main matchups, the mistakes that lose to aggro, Conquest.",
    readTime: 5,
    updated: "2026-09-16",
    image: "/media/ss-board-combat.webp",
    faq: [
      { q: "What is the strongest interaction in Healing Healsing?", a: "Shahrazad with Van Helsing and Spellbook: the Tools before every combat and the spell at the start of every round each heal 1 through Shahrazad, and every heal gives Phuong Hoang +1/+1." },
      { q: "How do you play against 3 Pigs Mid Range?", a: "Do not fill a lane: Ellen Trechend grows for every enemy card in her location. Keep Boitata for the Lightning Strikes, heal through the pigs' Trample damage and save Forbidden Knowledge for the round after the Pigs come down." },
      { q: "What loses games with this deck?", a: "Casting Forbidden Knowledge too early, letting Van Helsing's Tools sit in hand so he stops adding them, and playing Phuong Hoang before there is anything to heal." },
    ],
    body: `
## Before you start

This is the second part of the guide to **Healing Healsing**, the Van Helsing control deck that Davdas, OriginsMeta staff, published on 15 September 2026 as the first community deck of the site. The [first part](/en/guides/healing-healsing-guide) covers the list, the game plan, the mulligan and the round-by-round play. Here we look at the interactions that decide games, at the matchups and at the mistakes that cost the most. The author's notes are on the [deck page](/en/decks/community/healing-healsing-9411); the matchup reading below is OriginsMeta's, based on the card texts of patch 0.6.3.

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

The deck is tagged for the ladder only, but it fits a Conquest line-up: a different Legendary from 3 Pigs Mid Range and a single card in common, Ali Baba, so the two lists are eleven cards apart, more than the nine required at Big Bob's Playtest Battle. The [deck builder](/en/deck-builder) counts the difference in tournament mode.
`,
  },
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    category: "game",
    tags: { cards: ["mulan", "queen-of-hearts"] },
    title: "Origins TCG explained in five minutes",
    excerpt: "What Origins TCG is, how a match works across three lanes with simultaneous turns, what free-to-compete means and how to play the demo today.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/ss-board-locations.webp",
    faq: [
      { q: "What is Origins TCG?", a: "A digital trading card game by Koin Games, a studio based in Tampa, Florida and founded in 2021. Its cast is made of public-domain legends — Robin Hood, Mulan, the Queen of Hearts, Dracula and many more — reimagined in one original world." },
      { q: "How long does a match last?", a: "About seven minutes. Both players act at the same time across three lanes, so nobody waits for the opponent's turn." },
      { q: "How many cards are there in a deck?", a: "Twenty-five in the current playtest, built around one Legendary with a signature ability. Mulan repeats your allies' On Reveal abilities, the Queen of Hearts repeats their On Death abilities." },
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
    metaTitle: "Origins TCG roadmap and release dates",
    excerpt: "Every confirmed Origins TCG date, from the first Steam post to the Demo 2.0 update and the Crimson Cup at Next Fest, plus what is planned for 2027.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/art-the-club.webp",
    faq: [
      { q: "When does Origins TCG launch on Steam?", a: "Early access is listed for Q4 2026 on the store page. Before that, the Demo 2.0 update arrives at Steam Next Fest, 19–26 October 2026." },
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
| 10 September | Kickstarter AMA: final sale of the Alpha packs |

## What comes next

- **19–26 October 2026.** Steam Next Fest with the Demo 2.0 update: deckbuilding and many more cards for everyone.
- **20–25 October 2026.** The Crimson Cup, the Steam Next Fest tournament: regional qualifiers on the 20th, 21st and 22nd, then playoffs and finals. Prizes worth $10,000, including an exclusive 1/1 promo card.
- **Q4 2026.** Early access on Steam, according to the store page.
- **2027.** Mobile version and pack opening on phone. In the AMAs the team has described a full launch with the complete roster of Legendary cards, including King Arthur, Dracula, Winnie the Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein and Sherlock Holmes.

Dates come from the official Steam posts and the studio's Discord. We update this page when they change.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    category: "economy",
    title: "Two ways to collect: how the Origins economy works",
    metaTitle: "How the Origins TCG collector economy works",
    excerpt: "Competitive cards are free. Collector cards are limited, graded and tradeable on Steam. Here is what is confirmed and what is not.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ss-pack-opening.webp",
    faq: [
      { q: "Do collector cards make a deck stronger?", a: "No. Every competitive card is earned in game, and collector versions are limited editions of the same cards: they are numbered, digitally graded and tradeable, but they play exactly the same." },
      { q: "What is the Alpha Edition?", a: "Myths & Legends: Alpha Edition is the first collector edition, sold in pre-order only: booster packs of five cards, boxes of 24 packs and cases of six boxes, across ten rarity levels from common to storybook. Once the print run is finished, no more Alpha boxes are produced." },
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
    title: "Origins TCG at Steam Next Fest 2026: Demo 2.0, dates and the tournament",
    metaTitle: "Origins TCG at Steam Next Fest 2026: dates",
    excerpt: "Origins TCG at Steam Next Fest, 19–26 October 2026: the Demo 2.0 update, the Crimson Cup from 20 to 25 October, the prizes and how to sign up.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/keyart-queen-of-hearts.webp",
    faq: [
      { q: "When is Steam Next Fest October 2026?", a: "From Monday 19 October at 10:00 Pacific time (13:00 Eastern, 18:00 UK, 19:00 central Europe) to Monday 26 October 2026. Origins TCG takes part with the Demo 2.0 build." },
      { q: "When is the Origins TCG tournament?", a: "From 20 to 25 October 2026: three qualifiers on the 20th, 21st and 22nd (one per major region), then playoffs and finals." },
      { q: "Can I join a qualifier from Europe?", a: "Yes. Koin Games says you can join any of the qualifiers no matter where you live, but asks you to sign up only for the ones you can actually attend." },
      { q: "Does it cost anything?", a: "No. The demo is free on Steam and the tournament sign-up is on the official Discord. Origins TCG is free-to-compete: every competitive card is earned by playing." },
      { q: "What is the Conquest format?", a: "You submit several decks before the tournament, each led by a different Legendary and with at least nine different cards between any two decks, and you ban one of your opponent's decks before the match. Koin Games tested it at Big Bob's Playtest Battle on 28 August." },
    ],
    body: `
## The two dates to remember

- **Steam Next Fest, October 2026 edition: 19–26 October.** [Valve's festival of playable demos](https://store.steampowered.com/sale/nextfest) runs from Monday 19 October at 10:00 Pacific time (13:00 Eastern, 18:00 UK, 19:00 central Europe) to Monday 26 October. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) is in it with the big **Demo 2.0** update.
- **Origins TCG tournament: 20–25 October.** Koin Games calls it "our biggest tournament ever": a multi-day event that goes Qualification → Playoffs → Finals, entirely online and in-game.

## What Demo 2.0 brings

The build was tested in three closed playtests in August (patches [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) and [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), all tracked in our [MetaShifting](/en/tier-list)). Koin Games announced three things for it:

- **five new decks**, on top of the ones in the July demo;
- **more than 70 new cards**;
- **deckbuilding**: for the first time everyone can build their own 25-card deck (one Legendary plus twelve cards, each played as two copies) instead of choosing a preset list.

The playtests also introduced a ranked ladder with divisions up to Grandmaster and a world leaderboard. We will publish every change on the day it lands.

## The tournament, step by step

1. **Qualifiers, 20–22 October.** Three of them, 512 spots each: EMEA on the 20th at 7pm CEST (32 advance), AMER on the 21st at 7pm EST (64), APAC on the 22nd at 7pm SGT (32), plus 128 wild cards. In Koin's words, "you can join ANY of the qualifiers, no matter where you live": pick the one whose time suits you, and sign up only for the ones you will really play — you may enter more than one.
2. **Playoffs and finals, 24–25 October.** The playoff stage has 256 spots on the 24th (10am EST / 4pm CEST / 10pm SGT) and four players come out of it for the finals on the 25th at 10am EST (3pm CET / 10pm SGT). Mind the clocks: Europe goes off summer time during the night of the 24th while the United States stays on it until 1 November, so the same Eastern start time lands an hour earlier on European clocks on the Sunday. Content creators get wildcard invites straight into the playoffs (ask on Discord).
3. **Format.** Official, from the announcement: **best-of-3 matches, Conquest format, best-of-5 grand final**. The details of Conquest are not spelled out for this tournament: at Big Bob's Playtest Battle on 28 August Koin ran it with several decks, a different Legendary in each, at least nine cards of difference between decks, and the ban of one of your opponent's decks. Expect something close to that, and read the official rules when they are published.
4. **Prizes.** **Prizes worth $10,000**, in Koin's own words: an exclusive 1/1 tournament promo card, other promo cards, digital packs, Alpha booster boxes and cases, and cash prizes. It is not a cash pool: money is one of the four categories, and how it is split has not been announced. The tournament is called the **Crimson Cup** — the name is on Koin's own artwork, not a community nickname.

Sign-ups are on the [official Discord](https://discord.gg/originstcg).

## How to prepare in five moves

1. [Install the free demo on Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) and play the missions: they teach the three lanes and the simultaneous turns.
2. Read [Origins TCG explained in five minutes](/en/guides/origins-tcg-explained) and the [card database](/en/cards): the current stats are those of patch 0.6.3.
3. Build your three Conquest decks in our [deck builder](/en/deck-builder): it checks the different-Legendary rule and counts the cards that differ between decks.
4. Study the [decks published by the community](/en/decks): every list comes with its composition charts, the author's notes and an OM code you can open in the builder. Publish yours with a guide so other players can rate it.
5. Follow the [news](/en/news): every announcement is summarized within a day, with a link to the source.

## How OriginsMeta covers the week

A news item every day during the festival, tournament decks published with their composition charts the same day, and the first OriginsMeta tier list on 27 October, built on the tournament results and the top of the ladder. Sources: the official Steam posts of 4 August, 25 August and [9 September 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278), and the [Steam Next Fest schedule](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    slug: "is-origins-tcg-pay-to-win",
    category: "economy",
    title: "Is Origins TCG pay-to-win? Free-to-compete, explained",
    metaTitle: "Is Origins TCG pay-to-win? Free-to-compete",
    excerpt: "Koin Games sells Origins TCG as the first free-to-compete card game with zero pay-to-win. What money actually buys, and the honest caveats.",
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
    title: "How to download and play the Origins TCG demo on Steam",
    metaTitle: "How to play the Origins TCG demo on Steam",
    excerpt: "The free demo in five steps: requirements, download, language, first matches, what demo players unlock, and what changes with Demo 2.0 at Steam Next Fest.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ss-legendary-mulan.webp",
    faq: [
      { q: "Is the Origins TCG demo free?", a: "Yes. It has been free on Steam since 15 July 2026, for Windows and macOS." },
      { q: "What languages is the demo available in?", a: "Four: English, French, Italian and German, each with a translated interface and full voice-over. Subtitles are in English only." },
      { q: "What do I need to run it?", a: "At minimum Windows 10 64-bit with an Intel i3-6100 or AMD FX-6300, 8 GB of RAM, a GTX 750 Ti or R9 270X and 2 GB of space; on Mac, macOS 10.14 or later with an Apple M1 or a dual-core Intel i5 and a Metal-capable GPU." },
      { q: "Does the demo give anything for the full game?", a: "Koin Games announced that demo players earn exclusive collectibles that become tradeable when the full game launches." },
      { q: "When does the bigger demo arrive?", a: "Demo 2.0, with five new decks, over 70 new cards and deckbuilding, is expected at Steam Next Fest, 19–26 October 2026." },
    ],
    body: `
## What you get

The Origins TCG demo has been on Steam since **15 July 2026**, free, for Windows and macOS. As of 21 September 2026 it sits at "Very Positive": 98% of 167 reviews. Matches take about seven minutes: both players move at once across three locations, drawn from a pool of more than a hundred that rotate and change the rules of the board. The demo includes the tutorial, missions against bosses with their own AI and online play.

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
3. **Pick your language** if Steam did not: right-click the game in your library, Properties, Language. All four languages ship with full voice-over, not just translated menus.
4. **Play the tutorial**, then the missions: they teach the three lanes, the simultaneous turns and the keywords (On Reveal, On Death, First Strike, Double Attack, Deathtouch). Our [five-minute guide](/en/guides/origins-tcg-explained) covers the same ground in text.
5. **Go online** and try the preset decks. When you want more, read the [decks published by the community](/en/decks), rebuild them in the [deck builder](/en/deck-builder) and check the current card stats in the [card database](/en/cards) (patch 0.6.3).

## What demo players unlock

In the July launch post Koin Games said that demo players earn **exclusive collectibles** that will become tradeable when the full game launches. Wishlist the [main game](https://store.steampowered.com/app/4429430/Origins_TCG/) on Steam: early access is listed for Q4 2026.

## What changes with Demo 2.0

At Steam Next Fest (19–26 October 2026) the demo gets its big update, tested in August's closed playtests: five new decks, more than 70 new cards and, above all, deckbuilding. Everything about the dates, the tournament and how to prepare is in our [Steam Next Fest 2026 page](/en/guides/steam-next-fest-2026). Playtests of the bigger builds are announced on the [official Discord](https://discord.gg/originstcg), and so far anyone who wanted to join could.

Sources: the Origins TCG and Origins TCG Demo pages on Steam and the official Steam posts of 16 July and 4 August 2026.
`,
  },
  "origins-tcg-kickstarter": {
    slug: "origins-tcg-kickstarter",
    category: "economy",
    title: "Origins TCG Kickstarter: pre-registration, Alpha Edition and what we know",
    metaTitle: "Origins TCG Kickstarter: pre-registration",
    excerpt: "No campaign date yet, but the official pre-registration is open: 15% off at launch for a refundable 1 dollar deposit, plus preorder-only Alpha boxes.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/ls-collector-pack.webp",
    faq: [
      { q: "When does the Origins TCG Kickstarter start?", a: "Koin Games has not announced the date. A Kickstarter AMA was held on the official Discord on 10 September 2026 and the pre-registration page is live; we update this guide as soon as a date is published." },
      { q: "What does the 1 dollar deposit give you?", a: "VIP status with 15% off at launch. The official page states the deposit is fully refundable before launch." },
      { q: "What is the Alpha Edition?", a: "Origins Myths & Legends Alpha Edition: collector packs of 5 cards with at least one Rare or better guaranteed, booster boxes of 24 packs and cases of 6 boxes. Boxes and cases are preorder-only and the print run will not be repeated." },
      { q: "Do I need to back the Kickstarter to compete?", a: "No. Origins is free-to-compete: ranked play needs no purchase, and the Steam demo is free. The Kickstarter is about collecting, not power." },
      { q: "Where are the cards traded?", a: "On the Steam Community Market and its connected marketplaces, according to the official page. Mobile pack opening is planned for 2027." },
    ],
    body: `## What has been announced

Koin Games runs an official **Kickstarter Early Access** page at [founder.origins-tcg.com](https://founder.origins-tcg.com). On **10 September 2026** the team answered questions about the campaign in an AMA on the official Discord. The campaign date itself has not been published: the page only collects pre-registrations.

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
- 19–26 October 2026: Demo 2.0 at Steam Next Fest, with the Crimson Cup tournament.
- Q4 2026: full release on Steam.
- 2027: mobile.

## What to do now

1. Wishlist the game on Steam and play the demo.
2. If you want the launch discount, [pre-register on founder.origins-tcg.com](https://founder.origins-tcg.com) with the refundable deposit.
3. Follow the official Discord for the campaign date: we will publish it here and in the news the same day.

Sources: [official pre-registration page](https://founder.origins-tcg.com), [Steam page](https://store.steampowered.com/app/4429430/Origins_TCG/), Kickstarter AMA on the official Discord (10 September 2026, reported by World of Origins).`,
  },
};

const it: Record<GuideSlug, Guide> = {
  "three-pigs-midrange-guide": {
    slug: "three-pigs-midrange-guide",
    category: "decks",
    deckList: threePigsMidRange,
    tags: {
      communityDecks: [{ slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" }],
      cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    },
    title: "3 Pigs Mid Range: come si gioca il mazzo midrange dei Three Not So Little Pigs",
    metaTitle: "3 Pigs Mid Range, guida al mazzo Origins TCG",
    excerpt: "Piano di gioco, mulligan e round per round di 3 Pigs Mid Range, il mazzo midrange guidato dai Three Not So Little Pigs, per ladder e competitivo.",
    readTime: 6,
    updated: "2026-09-16",
    image: "/cards/cover/three-not-so-little-pigs.webp",
    faq: [
      { q: "Quale Leggendaria guida 3 Pigs Mid Range?", a: "Three Not So Little Pigs, un 3/3 da 7 mana con Trample: la sua On Reveal evoca un Not So Little Pig con Trample in ogni altro luogo, quindi una sola carta mette un corpo in ogni corsia." },
      { q: "Cosa si tiene nel mulligan?", a: "Cerca sempre Bagheera, Ali Baba, Big Bad Wolf e Rumple. Contro i mazzi con carte pericolose da 4 Salute, come Van Helsing o Glinda, tieni anche Axe Throw." },
      { q: "Come chiude la partita il mazzo?", a: "Con En Passant, che muove un alleato e colpisce il personaggio di fronte; con Ellen Trechend, il cui Trample spinge i danni fino alla barriera; e con i Lightning Strike che Impundulu aggiunge alla mano ogni volta che attacca." },
      { q: "Come provo il mazzo?", a: "Apri la scheda del mazzo su OriginsMeta e premi “Apri nel deck builder”, oppure copia il codice OM e importalo. Il builder controlla la regola 1 Leggendaria + 12 carte × 2." },
    ],
    body: `
## Il mazzo in un paragrafo

**3 Pigs Mid Range** è il secondo mazzo pubblicato su OriginsMeta da Davdas, membro dello staff del sito, il 15 settembre 2026. È una lista **midrange** guidata dai [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs), pensata per la **ladder** e per il gioco **competitivo**. L'idea è semplice: vincere il tabellone nei primi round, prendere vantaggio in almeno un luogo e poi chiudere con carte che puniscono l'avversario convinto di essere al sicuro dietro una barriera. La lista completa, i grafici di composizione e il codice OM sono nella [scheda del mazzo](/it/decks/community/3-pigs-mid-range-6311); questa guida spiega come pilotarlo. Una seconda guida copre [matchup, interazioni chiave e Conquest](/it/guides/three-pigs-midrange-matchups).

## La lista

Venticinque carte: la Leggendaria più dodici carte giocate in due copie ciascuna.

| Carta | Costo | Ruolo |
| --- | --- | --- |
| [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs) ★ | 7 | Leggendaria: Trample, e con l'On Reveal evoca un Not So Little Pig con Trample in ogni altro luogo |
| [Bagheera](/it/cards/bagheera) | 1 | Carta da un mana che cresce se giocata su una casella centrale |
| [Rumple](/it/cards/rumple) | 2 | 2/2 che ti dà +1 mana nel round successivo |
| [Axe Throw](/it/cards/axe-throw) | 2 | 4 danni a qualsiasi personaggio |
| [Mind Palace](/it/cards/mind-palace) | 2 | Pesca 2 carte |
| [Piglet](/it/cards/piglet) | 2 | On Reveal: potenzia gli altri alleati nel suo luogo |
| [Big Bad Wolf](/it/cards/big-bad-wolf) | 3 | 3/3 che ottiene +1/+1 dopo ogni combattimento |
| [Wicked Witch of the West](/it/cards/wicked-witch-of-the-west) | 3 | 1/5: quando sopravvive a un danno aggiunge una Flying Monkey alla tua mano e si sposta di una casella a sinistra |
| [En Passant](/it/cards/en-passant) | 3 | Muovi un alleato e infliggi danni pari alla sua Potenza al personaggio di fronte |
| [Ali Baba](/it/cards/ali-baba) | 3 | 2/3 che pesca una carta quando danneggia la barriera avversaria |
| [Frog Prince](/it/cards/frog-prince) | 3 | Scegli +3 Potenza o +3 Salute quando viene rivelato |
| [Impundulu](/it/cards/impundulu) | 5 | 3/6: ogni volta che attacca aggiunge un Lightning Strike alla tua mano |
| [Ellen Trechend](/it/cards/ellen-trechend) | 8 | Trample; con l'On Reveal cresce per ogni carta nemica nel suo luogo |

Nove unità e tre magie. Tutto tranne Impundulu, i Pigs ed Ellen Trechend costa tre mana o meno: per questo l'autore definisce la curva "molto solida", c'è sempre qualcosa da giocare dal round uno al quattro.

## Come vince il mazzo

Il piano, dalla scheda del mazzo: prendere il controllo del tabellone nei primi round, acquisire vantaggio su almeno un luogo e poi chiudere con tre carte.

- **En Passant** muove un alleato e infligge danni pari alla sua Potenza al personaggio di fronte: apre la strada a un tuo pezzo grosso, oppure trasforma un Big Bad Wolf cresciuto in una rimozione.
- **Ellen Trechend** ha Trample e quando viene rivelata cresce per ogni carta nemica nel suo luogo: più l'avversario ha investito in una corsia, più forte colpisce, e il Trample manda i danni in eccesso oltre il bloccante fino alla barriera. La scheda del mazzo la chiama "una chiusura al limite dell'illegale".
- **Impundulu**, se hai lavorato bene i primi round, ti ricompensa con un Lightning Strike a ogni attacco. Ogni Strike va usato prima del combattimento successivo o viene scartato: metti in conto due mana a round per lui.

La Leggendaria è il ponte tra le due fasi. A sette mana i Three Not So Little Pigs mettono un maialino con Trample in ciascuno degli altri due luoghi con una sola carta, oltre al proprio corpo 3/3 con Trample. Giocata in curva, riempie tutto il tabellone il round prima che Ellen Trechend entri in gioco.

## Mulligan

Cerca sempre **Bagheera, Ali Baba, Big Bad Wolf e Rumple**: regalano una buona partenza in curva e supportano i maialini già sul tabellone. Contro i mazzi con carte pericolose da 4 Salute, come Van Helsing o Glinda, tieni anche **Axe Throw**, che infligge esattamente quattro danni a qualsiasi personaggio. Ellen Trechend e Impundulu non sono ciò che vuoi nella mano iniziale: il mazzo li trova più tardi con Mind Palace e Ali Baba.

## Round per round

1. **Round 1–3: prendi il tabellone.** Bagheera su una casella centrale, poi Rumple o Piglet, poi una carta da tre. Rumple al round due significa quattro mana al round tre: un Wolf più Bagheera, o una Witch più una magia. La Wicked Witch of the West è il muro del mazzo: con cinque Salute sopravvive alla maggior parte dei colpi iniziali, e ogni volta che lo fa ricevi una Flying Monkey in mano e lei scivola di una casella a sinistra.
2. **Round 4–6: scegli una corsia e spingi.** Ali Baba vuole colpire una barriera: ogni volta che lo fa peschi. Frog Prince è un 5/2 che scambia al rialzo oppure un 2/5 che tiene la corsia: scegli dopo aver visto cosa ha rivelato l'avversario. Impundulu scende al round cinque e produce Lightning Strike dal primo attacco.
3. **Round 7–8: le chiusure.** I Pigs al sette (o al sei con un Rumple il round prima), Ellen Trechend all'otto nel luogo dove l'avversario ha più carte. Nello stesso round usa En Passant per spostare una minaccia dove non è attesa, o per togliere di mezzo l'unico bloccante.

## Restare in curva

La scheda del mazzo è chiara sul principale punto debole: "uscire fuori curva abbassa di molto il potenziale". La lista non ha rimozioni di massa e non cura le barriere, quindi ogni round saltato è un round regalato all'avversario. Due abitudini aiutano. Non tenere Rumple in attesa del turno "perfetto": il mana extra vale di più presto. E non tenere i Lightning Strike in mano sperando in un bersaglio migliore: uno Strike usato su una barriera resta tre danni che altrimenti perderesti.

## Dove andare adesso

- La [scheda del mazzo](/it/decks/community/3-pigs-mid-range-6311) ha la lista con i grafici di curva di mana, saghe e parole chiave, le note dell'autore e il codice OM per aprirla nel [deck builder](/it/deck-builder).
- [Matchup, interazioni chiave e Conquest](/it/guides/three-pigs-midrange-matchups) è la seconda parte di questa guida.
- Le statistiche delle carte sono quelle della patch 0.6.3 del playtest. Diverse carte di questa lista sono state ritoccate nelle patch 0.6.2 e 0.6.3: controlla lo storico dei bilanciamenti nella scheda di ogni carta.
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
    metaTitle: "3 Pigs Mid Range: matchup di Origins TCG",
    excerpt: "La seconda parte della guida a 3 Pigs Mid Range: le interazioni che vincono le partite, i matchup principali, gli errori da evitare e Conquest.",
    readTime: 5,
    updated: "2026-09-16",
    image: "/media/ss-board-clash.webp",
    faq: [
      { q: "Cosa fa Ellen Trechend contro un tabellone largo?", a: "Quando viene rivelata cresce per ogni carta nemica nel suo luogo e ha Trample: una corsia che l'avversario ha riempito diventa il suo bersaglio migliore, e i danni oltre la Salute del bloccante finiscono nella barriera." },
      { q: "Come si gioca contro i mazzi di Van Helsing?", a: "Tieni Axe Throw per Van Helsing, che ha quattro Salute, fai pressione presto prima che Forbidden Knowledge arrivi a otto mana, e indirizza i Lightning Strike sui personaggi invece che sulle barriere finché Boitata è sul tabellone." },
      { q: "3 Pigs Mid Range e Healing Healsing si possono giocare insieme in Conquest?", a: "Sì. I due mazzi hanno Leggendarie diverse e condividono una sola carta, Ali Baba, quindi differiscono per undici carte, più delle nove richieste al Big Bob's Playtest Battle." },
    ],
    body: `
## Prima di iniziare

Questa è la seconda parte della guida a **3 Pigs Mid Range**, il mazzo midrange guidato dai [Three Not So Little Pigs](/it/cards/three-not-so-little-pigs) che Davdas, staff di OriginsMeta, ha pubblicato il 15 settembre 2026. La [prima parte](/it/guides/three-pigs-midrange-guide) copre la lista, il piano di gioco, il mulligan e il round per round. Qui guardiamo alle interazioni che decidono le partite, ai matchup e al formato per cui il mazzo è stato pensato. Le note dell'autore sono nella [scheda del mazzo](/it/decks/community/3-pigs-mid-range-6311); la lettura dei matchup qui sotto è di OriginsMeta, basata sui testi delle carte della patch 0.6.3.

## Cinque interazioni da conoscere

1. **Rumple verso le chiusure.** Rumple ti dà +1 mana nel round successivo. Giocato al round cinque ti permette di rivelare i Three Not So Little Pigs al round sei, un round intero prima di quando l'avversario si aspetta una carta da sette; giocato al round sei mette Ellen Trechend sul tabellone al round sette.
2. **La Wicked Witch e la sua Flying Monkey.** La Witch è un 1/5: raramente muore per un solo colpo, e ogni volta che sopravvive a un danno ricevi una [Flying Monkey](/it/cards/flying-monkey) in mano e lei si sposta di una casella a sinistra. L'On Reveal della Monkey sposta qualsiasi altro personaggio, tuo o avversario, su una casella casuale nel suo luogo: usala per trascinare un bloccante nemico fuori dalla corsia in cui stai travolgendo, o per portare un Wolf dove si combatte.
3. **En Passant su un corpo cresciuto.** La magia muove un alleato e infligge danni pari alla sua Potenza al personaggio di fronte. Su un Big Bad Wolf che ha combattuto due volte sono cinque danni più uno spostamento; su Ellen Trechend è una rimozione che sposta anche il suo Trample dove la barriera è più debole. È anche la risposta a un bloccante parcheggiato davanti a uno dei tuoi maialini.
4. **I Lightning Strike di Impundulu.** Ogni attacco aggiunge un [Lightning Strike](/it/cards/lightning-strike), due mana per tre danni a qualsiasi personaggio o barriera, da usare prima del combattimento successivo. Sono tre danni mirati e ripetibili: bastano per la maggior parte delle carte iniziali del pool attuale, oppure vanno dritti in barriera quando il tabellone è già tuo.
5. **Piglet sui maialini.** L'On Reveal di Piglet potenzia gli altri alleati nel suo luogo. Il round dopo i Pigs, un Piglet accanto a un Not So Little Pig crea un corpo con Trample che colpisce più forte: la scheda del mazzo nota che le carte del mulligan "supportano i porcellini già in board".

## Matchup

I dati della classificata non sono ancora pubblici, quindi quella che segue è una lettura delle liste, non un win rate.

**Contro il controllo di Van Helsing, per esempio [Healing Healsing](/it/decks/community/healing-healsing-9411), dello stesso autore.** È il matchup che la nota sul mulligan ha in mente quando dice di tenere Axe Throw: Van Helsing è un 3/4 e quattro danni lo tolgono di mezzo prima che i suoi Tools inizino ad arrivare a ogni combattimento. Spingi i danni presto, perché il mazzo controllo vuole arrivare a otto mana per Forbidden Knowledge, che distrugge ogni personaggio sul tabellone, tuoi e suoi. Non calare i Pigs ed Ellen Trechend nella stessa finestra: tieni una chiusura per il round dopo la pulizia. Finché Boitata è in gioco, i danni delle magie alle sue barriere vengono inflitti alle tue, quindi indirizza i Lightning Strike sui personaggi finché non sparisce.

**Contro i tabelloni larghi (liste in stile Swarm, Mulan).** Più vanno larghi, più Ellen Trechend diventa grande: cresce per ogni carta nemica nel suo luogo. Tieni la Witch come muro nella corsia che stanno inondando, gioca Frog Prince come 2/5 invece che come 5/2 e conserva Axe Throw per la carta che potenzia le altre. [Mulan](/it/cards/mulan) ripete le abilità On Reveal dei suoi alleati: è lei il bersaglio prioritario.

**Contro gli altri mazzi midrange (King Arthur, Robin Hood).** Decide il tempo: chi esce di curva perde. Qui Rumple dà il meglio, e gli Strike di Impundulu fanno la differenza a tabellone pari. L'On Reveal di [Robin Hood](/it/cards/robin-hood) infligge 2 danni a tutti i nemici: uccide Bagheera, Piglet e un Rumple appena giocato, ma non la Witch né un Frog Prince giocato come 2/5. A otto mana, non sovraccaricare una corsia di unità piccole. [King Arthur](/it/cards/king-arthur) dà Shield ai personaggi Good: tieni Axe Throw per dopo che lo Shield è stato consumato.

## Errori da evitare

- **Giocare i Pigs come salvataggio.** La Leggendaria evoca i maialini su caselle casuali degli altri luoghi: rende al massimo quando in quelle corsie ci sono già un Wolf o una Witch con cui combattere, non quando è già tutto perso.
- **Tenere Rumple.** È un corpo 2/2 con un bonus, e il bonus vale di più tra il round due e il sei.
- **Sprecare i Lightning Strike.** Vengono scartati prima del combattimento successivo: uno Strike in barriera è meglio di uno Strike perso.
- **Dimenticare i punti deboli.** Li elenca la scheda del mazzo: nessuna rimozione di massa e nessuna cura per le barriere. Non correre contro un mazzo che cura se non sei già avanti sul tabellone.

## Conquest e il tag "competitivo"

Il mazzo è segnato sia per la ladder sia per il gioco competitivo. Nel formato Conquest usato al Big Bob's Playtest Battle, e atteso per il torneo dello Steam Next Fest, si registrano più mazzi con Leggendarie diverse e almeno nove carte differenti tra due mazzi qualsiasi. 3 Pigs Mid Range si abbina in modo naturale all'altra lista dello stesso autore, [Healing Healsing](/it/decks/community/healing-healsing-9411): Leggendarie diverse, e l'unica carta in comune è Ali Baba, quindi differiscono per undici carte. Il [deck builder](/it/deck-builder) conta la differenza per te nella modalità torneo.
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
    metaTitle: "Healing Healsing, guida al mazzo Origins TCG",
    excerpt: "Piano di gioco, mulligan e round per round di Healing Healsing, la lista controllo di Van Helsing che cura, pesca e azzera il tabellone.",
    readTime: 6,
    updated: "2026-09-16",
    image: "/cards/cover/van-helsing.webp",
    faq: [
      { q: "Quale Leggendaria guida Healing Healsing?", a: "Van Helsing, un 3/4 da 4 mana: prima di ogni combattimento aggiunge Van Helsing's Tools alla tua mano se non ce l'hai, una carta Scegli uno che gioca Holy Water, Silver Bullet, Garlic o Wooden Stake." },
      { q: "Cosa si tiene nel mulligan?", a: "Tieni Ali Baba, Baby Bear, Scarecrow, Van Helsing e Spellbook; contro l'aggro anche Jill. Shahrazad e Phuong Hoang non sono ciò che vuoi nei primi round." },
      { q: "Quando si lancia Forbidden Knowledge?", a: "A otto mana, quindi dal round otto o nove, idealmente in un round in cui l'avversario rivela per primo: lui cala le sue carte, poi la magia distrugge ogni personaggio sul tabellone." },
      { q: "Come vince il mazzo se distrugge anche il proprio tabellone?", a: "Con il vantaggio carte: Spellbook, Scarecrow e Ali Baba tengono la mano piena, Baby Bear lascia Papa Bear quando muore, Jekyll si trasforma in Hyde in mano, e le cure fanno crescere Phuong Hoang finché l'avversario resta senza risposte." },
    ],
    body: `
## Il mazzo in un paragrafo

**Healing Healsing** è stato il primo mazzo pubblicato su OriginsMeta, il 15 settembre 2026, da Davdas, membro dello staff del sito. È una lista **controllo** guidata da [Van Helsing](/it/cards/van-helsing), pensata per la **ladder**. Il piano è sopravvivere ai primi round prendendo valore, curare i danni mentre [Phuong Hoang](/it/cards/phuong-hoang) cresce a ogni cura, e azzerare il tabellone con [Forbidden Knowledge](/it/cards/forbidden-knowledge) una volta arrivati a otto mana. La lista completa, i grafici di composizione e il codice OM sono nella [scheda del mazzo](/it/decks/community/healing-healsing-9411); questa guida spiega come pilotarlo. Una seconda guida copre [matchup, interazioni chiave ed errori da evitare](/it/guides/healing-healsing-matchups).

## La lista

Venticinque carte: la Leggendaria più dodici carte giocate in due copie ciascuna.

| Carta | Costo | Ruolo |
| --- | --- | --- |
| [Van Helsing](/it/cards/van-helsing) ★ | 4 | Leggendaria: prima del combattimento aggiunge Van Helsing's Tools alla tua mano se non ce l'hai |
| [Baby Bear](/it/cards/baby-bear) | 2 | Colpisce i nemici che danneggiano la tua barriera; On Death aggiunge Papa Bear alla tua mano |
| [Scarecrow](/it/cards/scarecrow) | 2 | On Reveal: pesca una carta |
| [Shahrazad](/it/cards/shahrazad) | 2 | 1/4: cura 1 danno alla tua barriera ogni volta che una carta entra nella tua mano |
| [Ali Baba](/it/cards/ali-baba) | 3 | 2/3 che pesca una carta quando danneggia la barriera avversaria |
| [Jill](/it/cards/jill) | 3 | 2/4: cura 2 danni alla tua barriera ogni volta che subisce danni |
| [Spellbook](/it/cards/spellbook) | 3 | Per il resto della partita, una magia casuale in mano all'inizio di ogni round |
| [Phuong Hoang](/it/cards/phuong-hoang) | 4 | Rebirth, Move; ottiene +1/+1 ogni volta che un alleato o una barriera viene curato |
| [Jekyll](/it/cards/jekyll) | 4 | On Reveal cura 3; se resta in mano dopo il combattimento diventa Hyde, un 5/3 con Trample |
| [Searing Light](/it/cards/searing-light) | 4 | 4 danni a un nemico e 4 cure alla tua barriera in quel luogo |
| [Boitata](/it/cards/boitata) | 5 | 5/5: i danni di magie e abilità alle tue barriere vengono inflitti invece alla barriera avversaria |
| [Tin Woodman](/it/cards/tin-woodman) | 6 | On Reveal cura 8 a qualsiasi altro personaggio o barriera nel suo luogo |
| [Forbidden Knowledge](/it/cards/forbidden-knowledge) | 8 | Distruggi tutti i personaggi |

Nove unità e tre magie; quasi tutto costa tra due e quattro mana, con Boitata, Tin Woodman e Forbidden Knowledge in cima. Tre carte pescano, cinque curano, una pulisce il tabellone.

## Come vince il mazzo

Il piano dalla scheda del mazzo, in quattro passi:

1. **Controllare i primi round** prendendo rapidamente valore con Spellbook e Ali Baba.
2. **Arrivare al round otto o nove** e lanciare Forbidden Knowledge per prendere l'iniziativa. Cerca di usarla in un round in cui l'avversario è il primo a rivelare, così le sue carte sono sul tabellone quando la magia si risolve.
3. **Vincere di vantaggio carte e valore.** Il mazzo avversario dovrebbe finire le risorse mentre tu hai ancora abbastanza cure per far scalare i danni di Phuong Hoang.
4. **Mantenere il controllo.** Le carte in più ti permettono di tenere il tabellone a lungo.

Due motori fanno funzionare il tutto. Il primo sono le **carte che entrano in mano**: Van Helsing aggiunge i suoi Tools prima di ogni combattimento, Spellbook aggiunge una magia all'inizio di ogni round, Scarecrow e Ali Baba pescano, e ognuna di quelle carte cura 1 attraverso Shahrazad. Il secondo sono le **cure**: ogni cura, dal singolo punto di Shahrazad agli otto di Tin Woodman, dà +1/+1 a Phuong Hoang. Una Phuong che sta sul tabellone da qualche round è la vera minaccia del mazzo, e porta anche le parole chiave Rebirth e Move (vedi la sua scheda).

## Van Helsing's Tools

La Leggendaria in sé è un 3/4 da quattro mana. Quello che conta è la carta che aggiunge prima di ogni combattimento quando non ce l'hai già: [Van Helsing's Tools](/it/cards/van-helsings-tools), gratis dalla patch 0.6.2, ti fa scegliere uno di quattro effetti.

- [Holy Water](/it/cards/holy-water): rimuovi tutte le abilità da qualsiasi personaggio.
- [Silver Bullet](/it/cards/silver-bullet): danni a qualsiasi personaggio.
- [Garlic](/it/cards/garlic): Stun a qualsiasi personaggio.
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

- La [scheda del mazzo](/it/decks/community/healing-healsing-9411) ha la lista con i grafici di curva di mana e parole chiave, le note dell'autore e il codice OM per aprirla nel [deck builder](/it/deck-builder).
- [Matchup, interazioni chiave ed errori da evitare](/it/guides/healing-healsing-matchups) è la seconda parte di questa guida.
- Le statistiche delle carte sono quelle della patch 0.6.3 del playtest. Scarecrow, Van Helsing's Tools e altre carte di questa lista sono cambiate nelle patch 0.6.2 e 0.6.3: vedi lo storico dei bilanciamenti nella scheda di ogni carta.
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
    metaTitle: "Healing Healsing: matchup di Origins TCG",
    excerpt: "La seconda parte della guida a Healing Healsing: le interazioni di cura e pesca, i matchup principali, gli errori contro l'aggro e Conquest.",
    readTime: 5,
    updated: "2026-09-16",
    image: "/media/ss-board-combat.webp",
    faq: [
      { q: "Qual è l'interazione più forte di Healing Healsing?", a: "Shahrazad con Van Helsing e Spellbook: i Tools prima di ogni combattimento e la magia all'inizio di ogni round curano 1 ciascuno attraverso Shahrazad, e ogni cura dà +1/+1 a Phuong Hoang." },
      { q: "Come si gioca contro 3 Pigs Mid Range?", a: "Non riempire una corsia: Ellen Trechend cresce per ogni carta nemica nel suo luogo. Tieni Boitata per i Lightning Strike, cura i danni del Trample dei maialini e conserva Forbidden Knowledge per il round dopo la calata dei Pigs." },
      { q: "Cosa fa perdere le partite con questo mazzo?", a: "Lanciare Forbidden Knowledge troppo presto, lasciare Van Helsing's Tools in mano così che lui smetta di aggiungerli, e giocare Phuong Hoang prima che ci sia qualcosa da curare." },
    ],
    body: `
## Prima di iniziare

Questa è la seconda parte della guida a **Healing Healsing**, il mazzo controllo di Van Helsing che Davdas, staff di OriginsMeta, ha pubblicato il 15 settembre 2026 come primo mazzo della community del sito. La [prima parte](/it/guides/healing-healsing-guide) copre la lista, il piano di gioco, il mulligan e il round per round. Qui guardiamo alle interazioni che decidono le partite, ai matchup e agli errori che costano di più. Le note dell'autore sono nella [scheda del mazzo](/it/decks/community/healing-healsing-9411); la lettura dei matchup qui sotto è di OriginsMeta, basata sui testi delle carte della patch 0.6.3.

## Cinque interazioni da conoscere

1. **Shahrazad e tutto ciò che mette una carta in mano.** [Shahrazad](/it/cards/shahrazad) cura 1 danno alla tua barriera nel suo luogo ogni volta che una carta entra nella tua mano. Van Helsing aggiunge i suoi Tools prima di ogni combattimento, Spellbook aggiunge una magia all'inizio di ogni round, Scarecrow e Ali Baba pescano, la morte di Baby Bear aggiunge Papa Bear. Con Shahrazad e Van Helsing sul tabellone curi ogni singolo round senza spendere una carta.
2. **Ogni cura nutre Phuong Hoang.** [Phuong Hoang](/it/cards/phuong-hoang) ottiene +1/+1 ogni volta che un alleato o una barriera viene curato. L'On Reveal di Tin Woodman è una sola cura da otto punti, quindi un solo +1/+1; le tante piccole cure di Shahrazad valgono più per Phuong di una grande.
3. **Jekyll e Hyde.** L'On Reveal di [Jekyll](/it/cards/jekyll) cura 3 a qualsiasi altro personaggio o barriera nel suo luogo. Tenuto in mano dopo il combattimento diventa [Hyde](/it/cards/hyde), un 5/3 con Trample, e un Hyde tenuto in mano ridiventa Jekyll: la stessa carta è un curatore o una chiusura a seconda di quando la giochi.
4. **Boitata contro il burn.** Se una magia o un'abilità danneggerebbe una delle tue barriere, [Boitata](/it/cards/boitata) infligge invece quel danno alla barriera avversaria in quel luogo. Contro i mazzi che chiudono con Lightning Strike o Searing Light, Boitata trasforma la loro portata nella tua.
5. **La famiglia di Baby Bear.** [Baby Bear](/it/cards/baby-bear) colpisce ogni nemico che danneggia la tua barriera nel suo luogo e, quando muore, aggiunge [Papa Bear](/it/cards/papa-bear) alla tua mano; Papa Bear colpisce più forte e quando muore aggiunge [Mama Bear](/it/cards/mama-bear), che distrugge i nemici che danneggiano la tua barriera. Tre corpi per una sola carta da due mana, e la cosa migliore da avere sul tabellone quando Forbidden Knowledge si risolve.

## Matchup

I dati della classificata non sono ancora pubblici, quindi quella che segue è una lettura delle liste, non un win rate.

**Contro 3 Pigs Mid Range ([l'altro mazzo](/it/decks/community/3-pigs-mid-range-6311) dello stesso autore) e le altre liste midrange.** La loro chiusura, Ellen Trechend, cresce per ogni carta nemica nel suo luogo: distribuisci le unità invece di ammassarle in una corsia. I Lightning Strike di Impundulu sono esattamente ciò per cui esiste Boitata. Axe Throw infligge quattro danni, che sono esattamente la Salute di Van Helsing: aspettati che venga risposto, e non affidarti solo a lui per le rimozioni. I Pigs scendono a sette mana e riempiono ogni corsia di Trample: è il round per cui conservare Forbidden Knowledge, un round dopo.

**Contro i mazzi aggro e i tabelloni larghi.** È il matchup che la nota sul mulligan ha in mente quando dice di tenere Jill: ogni volta che subisce danni cura 2 alla tua barriera. Baby Bear punisce ogni attaccante che passa, Jekyll cura ciò che conta, gli otto punti di Tin Woodman rimettono in piedi una barriera. Non inseguire le loro unità con i Tools una per una: stabilizza la barriera, arriva a otto mana e lascia che Forbidden Knowledge si prenda tutto il tabellone.

**Contro gli altri mazzi controllo.** Decide il vantaggio carte, e questo mazzo pesca più di quasi tutti: Spellbook è la carta da proteggere e da giocare per prima. Tieni Hyde per una corsia rimasta vuota, e conserva Holy Water per una Leggendaria la cui abilità regge il mazzo avversario, come [Mulan](/it/cards/mulan), che ripete le On Reveal dei suoi alleati, o la [Queen of Hearts](/it/cards/queen-of-hearts), che ne ripete le On Death.

## Errori da evitare

- **Lanciare Forbidden Knowledge troppo presto.** Il consiglio della scheda del mazzo è aspettare un round in cui l'avversario rivela per primo, così le sue carte sono sul tabellone quando si risolve. Una pulizia su una corsia vuota sono otto mana buttati.
- **Lasciare i Tools in mano.** Van Helsing li aggiunge solo se non ce li hai. Usali a ogni combattimento, anche su un bersaglio piccolo.
- **Phuong Hoang prima delle cure.** Un 2/3 da quattro mana senza nulla da cui crescere è una carta debole; la stessa carta dopo che Shahrazad e Spellbook sono in gioco è la condizione di vittoria. La nota sul mulligan la mette, insieme a Shahrazad, tra le carte da non tenere nella mano iniziale.
- **Trattare la pesca come un lusso.** La scheda del mazzo avverte che "non trovare Forbidden Knowledge quando serve può essere molto doloroso": Scarecrow, Ali Baba e Spellbook sono il modo per trovarla, quindi giocali presto anche quando il tabellone non lo richiede.

## Conquest

Il mazzo è segnato solo per la ladder, ma si inserisce bene in una formazione Conquest: Leggendaria diversa da 3 Pigs Mid Range e una sola carta in comune, Ali Baba, quindi le due liste differiscono per undici carte, più delle nove richieste al Big Bob's Playtest Battle. Il [deck builder](/it/deck-builder) conta la differenza nella modalità torneo.
`,
  },
  "origins-tcg-explained": {
    slug: "origins-tcg-explained",
    category: "game",
    tags: { cards: ["mulan", "queen-of-hearts"] },
    title: "Origins TCG spiegato in cinque minuti",
    excerpt: "Cos'è Origins TCG, come funziona una partita sulle tre corsie a turni simultanei, cosa vuol dire free-to-compete e come provare la demo oggi.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/ss-board-locations.webp",
    faq: [
      { q: "Cos'è Origins TCG?", a: "Un gioco di carte collezionabili digitale di Koin Games, studio di Tampa (Florida) fondato nel 2021. I personaggi sono leggende di pubblico dominio — Robin Hood, Mulan, la Regina di Cuori, Dracula e molti altri — reinterpretate in un unico mondo originale." },
      { q: "Quanto dura una partita?", a: "Circa sette minuti. I due giocatori agiscono insieme su tre corsie, quindi non si aspetta mai il turno dell'avversario." },
      { q: "Da quante carte è fatto un mazzo?", a: "Venticinque nel playtest attuale, costruite intorno a una Leggendaria con un'abilità caratteristica. Mulan ripete le abilità On Reveal dei tuoi alleati, la Regina di Cuori ripete le loro On Death." },
      { q: "Si può giocare gratis a Origins TCG?", a: "Sì. La demo su Steam è gratuita e comprende il tutorial, le missioni contro boss con una propria IA e il gioco online. Ogni carta che serve per giocare a livello competitivo si guadagna giocando; i soldi comprano solo versioni da collezione delle carte." },
    ],
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
    metaTitle: "Origins TCG: roadmap e date di uscita",
    excerpt: "Tutte le date confermate di Origins TCG, dal primo post su Steam alla Demo 2.0 e alla Crimson Cup del Next Fest, più ciò che è previsto per il 2027.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/art-the-club.webp",
    faq: [
      { q: "Quando esce Origins TCG su Steam?", a: "L'early access è indicato per il quarto trimestre 2026 sulla pagina dello store. Prima arriva l'aggiornamento Demo 2.0 allo Steam Next Fest, dal 19 al 26 ottobre 2026." },
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
| 10 settembre | AMA Kickstarter: vendita finale dei pacchetti Alpha |

## Cosa viene dopo

- **19–26 ottobre 2026.** Steam Next Fest con l'aggiornamento Demo 2.0: deckbuilding e molte più carte per tutti.
- **20–25 ottobre 2026.** La Crimson Cup, il torneo dello Steam Next Fest: qualificazioni regionali il 20, 21 e 22, poi playoff e finali. Premi per un valore complessivo di 10.000 $, fra cui una carta promo 1/1 esclusiva.
- **Q4 2026.** Early access su Steam, secondo la pagina dello store.
- **2027.** Versione mobile e apertura dei pacchetti da telefono. Negli AMA il team ha descritto un lancio completo con tutte le Leggendarie, tra cui Re Artù, Dracula, Winnie the Pooh, Alice, Beowulf, Cenerentola, Sweeney Todd, Frankenstein e Sherlock Holmes.

Le date vengono dai post ufficiali su Steam e dal Discord dello studio. Aggiorniamo questa pagina quando cambiano.
`,
  },
  "collector-economy": {
    slug: "collector-economy",
    category: "economy",
    title: "Due modi di collezionare: come funziona l'economia di Origins",
    metaTitle: "L'economia da collezione di Origins TCG",
    excerpt: "Le carte competitive sono gratis. Quelle da collezione sono limitate, valutate e scambiabili su Steam. Ecco cosa è confermato e cosa no.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ss-pack-opening.webp",
    faq: [
      { q: "Le carte da collezione rendono il mazzo più forte?", a: "No. Ogni carta competitiva si guadagna in gioco e le versioni da collezione sono edizioni limitate delle stesse carte: sono numerate, valutate digitalmente e scambiabili, ma in partita si comportano esattamente allo stesso modo." },
      { q: "Cos'è l'Alpha Edition?", a: "Myths & Legends: Alpha Edition è la prima edizione da collezione e si vende solo in preordine: bustine da cinque carte, box da 24 bustine e case da sei box, con dieci livelli di rarità dal comune allo storybook. Finita la tiratura non si stampano altri box Alpha." },
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
    title: "Origins TCG allo Steam Next Fest 2026: Demo 2.0, date e torneo",
    metaTitle: "Origins TCG allo Steam Next Fest 2026: date",
    excerpt: "Origins TCG allo Steam Next Fest, dal 19 al 26 ottobre 2026: l'aggiornamento Demo 2.0, la Crimson Cup dal 20 al 25 ottobre, i premi e le iscrizioni.",
    readTime: 6,
    updated: "2026-09-15",
    image: "/media/keyart-queen-of-hearts.webp",
    faq: [
      { q: "Quando si svolge lo Steam Next Fest di ottobre 2026?", a: "Da lunedì 19 ottobre alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre 2026. Origins TCG partecipa con la build Demo 2.0." },
      { q: "Quando c'è il torneo di Origins TCG?", a: "Dal 20 al 25 ottobre 2026: tre qualificazioni il 20, 21 e 22 (una per macro-regione), poi playoff e finali." },
      { q: "Posso partecipare a una qualificazione dall'Italia?", a: "Sì. Koin Games dice che ci si può iscrivere a qualsiasi qualificazione a prescindere da dove si vive, ma chiede di iscriversi solo a quelle a cui si può davvero partecipare." },
      { q: "Costa qualcosa?", a: "No. La demo è gratuita su Steam e l'iscrizione al torneo si fa sul Discord ufficiale. Origins TCG è free-to-compete: ogni carta competitiva si guadagna giocando." },
      { q: "Cos'è il formato Conquest?", a: "Si registrano più mazzi prima del torneo, ognuno guidato da una Leggendaria diversa e con almeno nove carte di differenza tra due mazzi qualsiasi, e prima della partita si banna un mazzo dell'avversario. Koin Games lo ha provato a Big Bob's Playtest Battle il 28 agosto." },
    ],
    body: `
## Le due date da segnare

- **Steam Next Fest, edizione di ottobre 2026: 19–26 ottobre.** Il [festival delle demo giocabili di Valve](https://store.steampowered.com/sale/nextfest) va da lunedì 19 ottobre alle 10:00 ora del Pacifico (le 19:00 in Italia) a lunedì 26 ottobre. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) c'è con il grande aggiornamento **Demo 2.0**.
- **Torneo di Origins TCG: 20–25 ottobre.** Koin Games lo chiama "il nostro torneo più grande di sempre": un evento su più giorni, Qualificazioni → Playoff → Finali, tutto online e in gioco.

## Cosa porta la Demo 2.0

La build è stata provata in tre playtest chiusi ad agosto (patch [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) e [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), tutte tracciate nel nostro [MetaShifting](/it/tier-list)). Koin Games ha annunciato tre cose:

- **cinque nuovi mazzi**, oltre a quelli della demo di luglio;
- **più di 70 nuove carte**;
- **il deckbuilding**: per la prima volta tutti possono costruire il proprio mazzo da 25 carte (una Leggendaria più dodici carte, ognuna giocata in due copie) invece di scegliere una lista preimpostata.

I playtest hanno introdotto anche una classificata con divisioni fino a Grandmaster e una classifica mondiale. Pubblicheremo ogni cambiamento il giorno stesso in cui arriva.

## Il torneo, passo per passo

1. **Qualificazioni, 20–22 ottobre.** Tre, da 512 posti ciascuna: EMEA il 20 alle 19 CEST (32 passano), AMER il 21 alle 19 EST (64), APAC il 22 alle 19 SGT (32), più 128 wild card. Nelle parole di Koin, "puoi partecipare a QUALSIASI qualificazione, ovunque tu viva": scegli quella con l'orario che ti conviene e iscriviti solo a quelle che giocherai davvero — se ne può giocare più di una.
2. **Playoff e finali, 24–25 ottobre.** I playoff hanno 256 posti il 24 (le 10 EST, le 16 in Italia, le 22 SGT) e ne escono quattro giocatori per le finali del 25 alle 10 EST (le 15 in Italia, le 22 SGT). Attenzione all'ora: nella notte tra il 24 e il 25 ottobre in Europa finisce l'ora legale e l'Italia torna a UTC+1, mentre gli Stati Uniti restano in ora legale fino al 1° novembre; per questo lo stesso orario della costa est vale le 16 il sabato e le 15 la domenica. I content creator hanno inviti wildcard direttamente ai playoff (basta chiedere su Discord).
3. **Formato.** Ufficiale, dall'annuncio: **partite al meglio delle tre, formato Conquest, gran finale al meglio delle cinque**. I dettagli del Conquest per questo torneo non sono stati precisati: a Big Bob's Playtest Battle, il 28 agosto, Koin lo ha giocato con più mazzi, una Leggendaria diversa in ciascuno, almeno nove carte di differenza tra i mazzi e il ban di un mazzo dell'avversario. Aspettati qualcosa di simile e leggi il regolamento ufficiale quando uscirà.
4. **Premi.** **Premi per un valore complessivo di 10.000 $**, come li chiama Koin: una carta promo 1/1 esclusiva del torneo, altre carte promo, pacchetti digitali, booster box e case Alpha, premi in denaro. Non è un montepremi in contanti: il denaro è una delle quattro categorie, e come venga ripartito non è stato annunciato. Il torneo si chiama **Crimson Cup**: il nome è sulla grafica ufficiale di Koin, non un soprannome della community.

Le iscrizioni sono sul [Discord ufficiale](https://discord.gg/originstcg).

## Come prepararsi in cinque mosse

1. [Installa la demo gratuita su Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) e gioca le missioni: insegnano le tre corsie e i turni simultanei.
2. Leggi [Origins TCG spiegato in cinque minuti](/it/guides/origins-tcg-explained) e il [database carte](/it/cards): le statistiche attuali sono quelle della patch 0.6.3.
3. Costruisci i tuoi tre mazzi Conquest nel nostro [deck builder](/it/deck-builder): controlla la regola delle Leggendarie diverse e conta le carte che cambiano tra un mazzo e l'altro.
4. Studia i [mazzi pubblicati dalla community](/it/decks): ogni lista ha i grafici di composizione, le note dell'autore e un codice OM da aprire nel builder. Pubblica la tua con una guida, così gli altri possono votarla.
5. Segui le [news](/it/news): ogni annuncio è riassunto entro un giorno, con il link alla fonte.

## Come OriginsMeta seguirà la settimana

Una news al giorno durante il festival, i mazzi del torneo pubblicati il giorno stesso con i grafici di composizione, e la prima tier list di OriginsMeta il 27 ottobre, costruita sui risultati del torneo e sulla cima della classificata. Fonti: i post ufficiali su Steam del 4 agosto, 25 agosto e [9 settembre 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278) e il [calendario dello Steam Next Fest](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    slug: "is-origins-tcg-pay-to-win",
    category: "economy",
    title: "Origins TCG è pay to win? Il free-to-compete spiegato",
    metaTitle: "Origins TCG è pay to win? Il free-to-compete",
    excerpt: "Koin Games presenta Origins TCG come il primo gioco di carte free-to-compete, a zero pay to win. Cosa compra davvero il denaro e i dubbi che restano.",
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
    title: "Come scaricare e provare la demo di Origins TCG su Steam",
    metaTitle: "Come giocare la demo di Origins TCG su Steam",
    excerpt: "La demo gratuita in cinque passi: requisiti, download, lingua italiana, prime partite e cosa cambia con la Demo 2.0 allo Steam Next Fest.",
    readTime: 5,
    updated: "2026-09-15",
    image: "/media/ss-legendary-mulan.webp",
    faq: [
      { q: "La demo di Origins TCG è gratuita?", a: "Sì. È gratuita su Steam dal 15 luglio 2026, per Windows e macOS." },
      { q: "La demo è in italiano?", a: "Sì. Interfaccia e audio completo sono disponibili in inglese, francese, italiano e tedesco; i sottotitoli sono in inglese." },
      { q: "Cosa serve per farla girare?", a: "Al minimo Windows 10 a 64 bit con un Intel i3-6100 o AMD FX-6300, 8 GB di RAM, una GTX 750 Ti o R9 270X e 2 GB di spazio; su Mac, macOS 10.14 o successivo con un Apple M1 o un Intel i5 dual-core e una GPU compatibile Metal." },
      { q: "La demo dà qualcosa per il gioco completo?", a: "Koin Games ha annunciato che i giocatori della demo guadagnano collezionabili esclusivi che diventeranno scambiabili all'uscita del gioco completo." },
      { q: "Quando arriva la demo più grande?", a: "La Demo 2.0, con cinque nuovi mazzi, oltre 70 nuove carte e il deckbuilding, è attesa allo Steam Next Fest, dal 19 al 26 ottobre 2026." },
    ],
    body: `
## Cosa trovi

La demo di Origins TCG è su Steam dal **15 luglio 2026**, gratuita, per Windows e macOS. Al 21 settembre 2026 è "Molto positiva": il 98% di 167 recensioni. Una partita dura circa sette minuti: i due giocatori muovono insieme su tre luoghi, pescati da un mazzo di più di cento che ruotano e cambiano le regole del tavolo. La demo comprende il tutorial, le missioni contro boss con una IA propria e il gioco online.

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
5. **Vai online** e prova i mazzi preimpostati. Quando vuoi qualcosa di più, leggi i [mazzi pubblicati dalla community](/it/decks), ricostruiscili nel [deck builder](/it/deck-builder) e controlla le statistiche attuali delle carte nel [database carte](/it/cards) (patch 0.6.3).

## Cosa sbloccano i giocatori della demo

Nel post di lancio di luglio Koin Games ha detto che chi gioca la demo guadagna **collezionabili esclusivi** che diventeranno scambiabili all'uscita del gioco completo. Metti il [gioco principale](https://store.steampowered.com/app/4429430/Origins_TCG/) nella lista dei desideri su Steam: l'early access è indicato per il quarto trimestre 2026.

## Cosa cambia con la Demo 2.0

Allo Steam Next Fest (19–26 ottobre 2026) la demo riceve il grande aggiornamento provato nei playtest chiusi di agosto: cinque nuovi mazzi, più di 70 nuove carte e, soprattutto, il deckbuilding. Date, torneo e come prepararsi sono nella nostra [pagina sullo Steam Next Fest 2026](/it/guides/steam-next-fest-2026). I playtest delle build più grandi vengono annunciati sul [Discord ufficiale](https://discord.gg/originstcg) e finora poteva partecipare chiunque volesse.

Fonti: le pagine Steam di Origins TCG e della demo e i post ufficiali su Steam del 16 luglio e del 4 agosto 2026.
`,
  },
  "origins-tcg-kickstarter": {
    slug: "origins-tcg-kickstarter",
    category: "economy",
    title: "Kickstarter di Origins TCG: pre-registrazione, Alpha Edition e cosa sappiamo",
    metaTitle: "Kickstarter di Origins TCG: pre-registrazione",
    excerpt: "La data della campagna non c'è ancora, ma la pre-registrazione è aperta: 15% di sconto al lancio con un deposito rimborsabile di 1 dollaro.",
    readTime: 4,
    updated: "2026-09-15",
    image: "/media/ls-collector-pack.webp",
    faq: [
      { q: "Quando parte il Kickstarter di Origins TCG?", a: "Koin Games non ha annunciato la data. Il 10 settembre 2026 si è tenuta un'AMA sul Kickstarter nel Discord ufficiale e la pagina di pre-registrazione è attiva; aggiorniamo questa guida appena esce una data." },
      { q: "Cosa dà il deposito da 1 dollaro?", a: "Lo stato VIP con il 15% di sconto al lancio. La pagina ufficiale dichiara che il deposito è interamente rimborsabile prima del lancio." },
      { q: "Cos'è l'Alpha Edition?", a: "Origins Myths & Legends Alpha Edition: pacchetti collector da 5 carte con almeno una Rara o superiore garantita, box da 24 pacchetti e case da 6 box. Box e case sono solo in preordine e la tiratura non verrà ripetuta." },
      { q: "Devo sostenere il Kickstarter per competere?", a: "No. Origins è free-to-compete: la classificata non richiede acquisti e la demo su Steam è gratuita. Il Kickstarter riguarda il collezionismo, non la forza in partita." },
      { q: "Dove si scambiano le carte?", a: "Sul Mercato della Comunità di Steam e sui marketplace collegati, secondo la pagina ufficiale. L'apertura dei pacchetti su mobile è prevista per il 2027." },
    ],
    body: `## Cosa è stato annunciato

Koin Games ha una pagina ufficiale di **Kickstarter Early Access** su [founder.origins-tcg.com](https://founder.origins-tcg.com). Il **10 settembre 2026** il team ha risposto alle domande sulla campagna in un'AMA nel Discord ufficiale. La data della campagna non è stata pubblicata: la pagina raccoglie solo le pre-registrazioni.

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
- 19–26 ottobre 2026: Demo 2.0 allo Steam Next Fest, con il torneo Crimson Cup.
- Q4 2026: uscita completa su Steam.
- 2027: mobile.

## Cosa fare adesso

1. Metti il gioco in lista dei desideri su Steam e prova la demo.
2. Se vuoi lo sconto al lancio, [pre-registrati su founder.origins-tcg.com](https://founder.origins-tcg.com) con il deposito rimborsabile.
3. Segui il Discord ufficiale per la data della campagna: la pubblicheremo qui e nelle news lo stesso giorno.

Fonti: [pagina ufficiale di pre-registrazione](https://founder.origins-tcg.com), [pagina Steam](https://store.steampowered.com/app/4429430/Origins_TCG/), AMA sul Kickstarter nel Discord ufficiale (10 settembre 2026, riportata da World of Origins).`,
  },
};

const all: Record<Locale, Record<GuideSlug, Guide>> = { en, it };

export function getGuides(locale: Locale): Guide[] {
  return guideSlugs.map((s) => all[locale][s]);
}

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return (guideSlugs as readonly string[]).includes(slug) ? all[locale][slug as GuideSlug] : undefined;
}
