import type { Locale } from "../i18n";
import type { PatchId } from "./cards";

/**
 * I LUOGHI di Origins TCG (23/09/2026).
 *
 * Ogni partita si gioca su tre luoghi, estratti da un mazzo di luoghi che cambia il tabellone: la pagina Steam
 * ufficiale parla di "100+ rotating locations that reshape the board and demand a unique strategy". Nella Demo 2.0
 * quelli in rotazione sono i 44 qui sotto.
 *
 * DA DOVE VENGONO I DATI. Nome ed effetto sono trascritti dal database della community World of Origins
 * (worldoforigins.fun/locations, sezione "Demo v2 2026"), l'eccezione autorizzata da Pierluigi il 15/09/2026 per i
 * DATI delle carte: i luoghi non sono in `woo-cards.json` e `npm run import:woo` non li porta, quindi stanno qui,
 * scritti a mano. Nessuna immagine viene da lì.
 * `verified: false` finché non si confrontano uno per uno con il gioco, come è stato fatto per le carte il
 * 22/09/2026: quando succede, si aggiorna `locationsVerified` qui sotto e si mette `verified: true`.
 *
 * COME È FATTA UNA VOCE
 * - `slug`: chiave stabile, usata nell'indirizzo della pagina e nelle ancore.
 * - `name`: il nome ufficiale, in inglese come nel gioco (i nomi delle carte non si traducono).
 * - `effect`: il testo dell'effetto, in inglese e in italiano. Le parole chiave del gioco (On Reveal, Shield,
 *   Trample, Move, Deathtouch, Defender, Double Attack, On Death) restano in inglese anche in italiano, come nelle
 *   pastiglie del sito e nelle traduzioni delle carte in `card-lore.ts`.
 * - `tags`: come si comporta il luogo, per i filtri della pagina. Un luogo può averne più d'uno.
 * - `cards`: slug delle carte del nostro database citate dall'effetto, per i collegamenti incrociati.
 */

export type L10n = Record<Locale, string>;

/**
 * Famiglie di effetti, per filtrare l'elenco. Sono una classificazione nostra, come le saghe delle carte: il
 * gioco non le espone.
 */
export const locationTags = ["damage", "mana", "cards", "move", "summon", "buff", "destroy", "barrier", "keyword", "ability"] as const;
export type LocationTag = (typeof locationTags)[number];

export const locationTagLabels: Record<LocationTag, L10n> = {
  damage: { en: "Damage", it: "Danni" },
  mana: { en: "Mana and costs", it: "Mana e costi" },
  cards: { en: "Draw and discard", it: "Pesca e scarto" },
  move: { en: "Movement", it: "Movimento" },
  summon: { en: "Summons and copies", it: "Evocazioni e copie" },
  buff: { en: "Buffs and debuffs", it: "Potenziamenti" },
  destroy: { en: "Destruction", it: "Distruzione" },
  barrier: { en: "Barriers", it: "Barriere" },
  keyword: { en: "Granted keywords", it: "Parole chiave" },
  ability: { en: "Abilities", it: "Abilità" },
};

export type GameLocation = {
  slug: string;
  name: string;
  effect: L10n;
  tags: LocationTag[];
  cards?: string[];
};

/** Ultimo confronto dei luoghi con il gioco: data e numero. Finché è `null` i dati vengono solo da World of Origins. */
export const locationsVerified: { date: string; count: number } | null = null;

/** Versione del gioco a cui si riferisce questo elenco (etichetta `patchLabel` della patch corrispondente). */
export const locationsPatch: PatchId = "demo-0921";

export const locations: GameLocation[] = [
  {
    slug: "amplifying-amphitheatre",
    name: "Amplifying Amphitheatre",
    effect: { en: "ALL damage here is doubled.", it: "TUTTI i danni qui sono raddoppiati." },
    tags: ["damage"],
  },
  {
    slug: "anti-magic-vault",
    name: "Anti-Magic Vault",
    effect: { en: "Characters here lose all abilities.", it: "I personaggi qui perdono tutte le abilità." },
    tags: ["ability"],
  },
  {
    slug: "arcane-leyline",
    name: "Arcane Leyline",
    effect: { en: "Both players get +2 mana this round.", it: "Entrambi i giocatori ottengono +2 mana in questo round." },
    tags: ["mana"],
  },
  {
    slug: "ashen-grove",
    name: "Ashen Grove",
    effect: {
      en: "When you play a character here, discard your rightmost card then draw a card.",
      it: "Quando giochi un personaggio qui, scarta la carta più a destra e poi pesca una carta.",
    },
    tags: ["cards"],
  },
  {
    slug: "ballroom",
    name: "Ballroom",
    effect: {
      en: "After combat, return a random character here to it's owner's hand for both players.",
      it: "Dopo il combattimento, rimanda un personaggio casuale qui nella mano del suo proprietario, per entrambi i giocatori.",
    },
    tags: ["move"],
  },
  {
    slug: "bandersnatch-burrow",
    name: "Bandersnatch Burrow",
    effect: {
      en: "After you play a character here, there is a 10% chance it will transform into a Bandersnatch this round.",
      it: "Dopo che giochi un personaggio qui, c'è il 10% di probabilità che si trasformi in un Bandersnatch in questo round.",
    },
    tags: ["summon"],
    cards: ["bandersnatch"],
  },
  {
    slug: "blessed-grounds",
    name: "Blessed Grounds",
    effect: { en: "When a Good character is played here, it gets Shield.", it: "Quando un personaggio Good viene giocato qui, ottiene Shield." },
    tags: ["keyword"],
  },
  {
    slug: "broken-gate",
    name: "Broken Gate",
    effect: { en: "Barriers here regenerate with 10 health instead of 40 health.", it: "Le barriere qui si rigenerano con 10 salute invece di 40." },
    tags: ["barrier"],
  },
  {
    slug: "broom-closet",
    name: "Broom Closet",
    effect: { en: "When you play a spell, allies here get +1/+1.", it: "Quando giochi una magia, gli alleati qui ottengono +1/+1." },
    tags: ["buff"],
  },
  {
    slug: "burial-grounds",
    name: "Burial Grounds",
    effect: { en: "On Death abilities happen twice here.", it: "Le abilità On Death si attivano due volte qui." },
    tags: ["ability"],
  },
  {
    slug: "burnturn-arena",
    name: "Burnturn Arena",
    effect: { en: "After combat, deal 1 damage to ALL characters here.", it: "Dopo il combattimento, infliggi 1 danno a TUTTI i personaggi qui." },
    tags: ["damage"],
  },
  {
    slug: "castle-in-the-clouds",
    name: "Castle in the Clouds",
    effect: { en: "Cards that cost 7 or more cost 1 less to play.", it: "Le carte che costano 7 o più costano 1 in meno da giocare." },
    tags: ["mana"],
  },
  {
    slug: "cloning-lab",
    name: "Cloning Lab",
    effect: {
      en: "After you play a character here, fill your spaces here with copies of it.",
      it: "Dopo che giochi un personaggio qui, riempi le tue caselle qui con sue copie.",
    },
    tags: ["summon"],
  },
  {
    slug: "conveyor-belt",
    name: "Conveyor Belt",
    effect: { en: "After combat, move all characters here to the right one space.", it: "Dopo il combattimento, sposta tutti i personaggi qui di una casella a destra." },
    tags: ["move"],
  },
  {
    slug: "field-of-mice",
    name: "Field of Mice",
    effect: { en: "After a character enters play here, stun it.", it: "Dopo che un personaggio entra in gioco qui, stordiscilo." },
    tags: ["ability"],
  },
  {
    slug: "giants-beacon",
    name: "Giant's Beacon",
    effect: { en: "Draw your highest-cost card. Set its cost to 1.", it: "Pesca la tua carta dal costo più alto. Porta il suo costo a 1." },
    tags: ["cards", "mana"],
  },
  {
    slug: "gold-spinning-wheel",
    name: "Gold Spinning Wheel",
    effect: { en: "Cards cost 1 less to play.", it: "Le carte costano 1 in meno da giocare." },
    tags: ["mana"],
  },
  {
    slug: "hero-emerges",
    name: "Hero Emerges",
    effect: { en: "Draw your legendary card. If you can't, draw a card instead.", it: "Pesca la tua carta Leggendaria. Se non puoi, pesca una carta qualsiasi." },
    tags: ["cards"],
  },
  {
    slug: "human-cannon",
    name: '"Human" Cannon',
    effect: {
      en: "When you play a character here, destroy it and deal damage equal to its power to the opponent's barrier.",
      it: "Quando giochi un personaggio qui, distruggilo e infliggi danni pari alla sua potenza alla barriera avversaria.",
    },
    tags: ["destroy", "barrier", "damage"],
  },
  {
    slug: "hundred-acre-woods",
    name: "Hundred Acre Woods",
    effect: { en: "Summon Christopher Robin here for both players.", it: "Evoca Christopher Robin qui per entrambi i giocatori." },
    tags: ["summon"],
    cards: ["christopher-robin"],
  },
  {
    slug: "junkyard",
    name: "Junkyard",
    effect: { en: "Both players discard a random card.", it: "Entrambi i giocatori scartano una carta casuale." },
    tags: ["cards"],
  },
  {
    slug: "knowledge-vault",
    name: "Knowledge Vault",
    effect: { en: "The first player to fill this location draws a card.", it: "Il primo giocatore che riempie questo luogo pesca una carta." },
    tags: ["cards"],
  },
  {
    slug: "mana-battery",
    name: "Mana Battery",
    effect: { en: "Keep your leftover mana between rounds.", it: "Conservi il mana avanzato da un round all'altro." },
    tags: ["mana"],
  },
  {
    slug: "mirror-dimension",
    name: "Mirror Dimension",
    effect: { en: "On Reveal abilities happen twice here.", it: "Le abilità On Reveal si attivano due volte qui." },
    tags: ["ability"],
  },
  {
    slug: "nostradamus-call",
    name: "Nostradamus' Call",
    effect: { en: "At the start of round 6, destroy both players' decks.", it: "All'inizio del round 6, distruggi i mazzi di entrambi i giocatori." },
    tags: ["cards", "destroy"],
  },
  {
    slug: "open-meadow",
    name: "Open Meadow",
    effect: { en: "When a character enters play here, it gets Move.", it: "Quando un personaggio entra in gioco qui, ottiene Move." },
    tags: ["keyword", "move"],
  },
  {
    slug: "overloaded-circuit",
    name: "Overloaded Circuit",
    effect: {
      en: "The first player to fill this location deals 5 damage to the opponent's barrier here.",
      it: "Il primo giocatore che riempie questo luogo infligge 5 danni alla barriera avversaria qui.",
    },
    tags: ["barrier", "damage"],
  },
  {
    slug: "poison-grounds",
    name: "Poison Grounds",
    effect: { en: "Evil characters here have Deathtouch.", it: "I personaggi Evil qui hanno Deathtouch." },
    tags: ["keyword"],
  },
  {
    slug: "reflecting-pool",
    name: "Reflecting Pool",
    effect: { en: "After you play a character here, copy it in another location.", it: "Dopo che giochi un personaggio qui, copialo in un altro luogo." },
    tags: ["summon"],
  },
  {
    slug: "sherwood-forest",
    name: "Sherwood Forest",
    effect: { en: "Summon a Merry Man at a random location every turn.", it: "Evoca un Merry Man in un luogo casuale a ogni turno." },
    tags: ["summon"],
    cards: ["merry-man"],
  },
  {
    slug: "soul-artillery",
    name: "Soul Artillery",
    effect: { en: "After a character dies here, deal 1 damage to BOTH barriers.", it: "Dopo che un personaggio muore qui, infliggi 1 danno a ENTRAMBE le barriere." },
    tags: ["barrier", "damage"],
  },
  {
    slug: "stomping-grounds",
    name: "Stomping Grounds",
    effect: { en: "Characters here have Trample.", it: "I personaggi qui hanno Trample." },
    tags: ["keyword"],
  },
  {
    slug: "the-colosseum",
    name: "The Colosseum",
    effect: { en: "Characters here have Double Attack.", it: "I personaggi qui hanno Double Attack." },
    tags: ["keyword"],
  },
  {
    slug: "the-gallows",
    name: "The Gallows",
    effect: { en: "When a character enters play here, destroy the enemy across from it.", it: "Quando un personaggio entra in gioco qui, distruggi il nemico di fronte a lui." },
    tags: ["destroy"],
  },
  {
    slug: "the-hill",
    name: "The Hill",
    effect: {
      en: "After combat, if there is more than one character here, destroy ALL characters who share the lowest power.",
      it: "Dopo il combattimento, se qui c'è più di un personaggio, distruggi TUTTI i personaggi con la potenza più bassa.",
    },
    tags: ["destroy"],
  },
  {
    slug: "the-sultans-court",
    name: "The Sultan's Court",
    effect: {
      en: "At the start of each round, draw a card. Discard it before combat.",
      it: "All'inizio di ogni round, pesca una carta. Scartala prima del combattimento.",
    },
    tags: ["cards"],
  },
  {
    slug: "the-well",
    name: "The Well",
    effect: { en: "When you play a character here, heal 1 damage from your barrier here.", it: "Quando giochi un personaggio qui, cura 1 danno alla tua barriera qui." },
    tags: ["barrier"],
  },
  {
    slug: "tinkerers-toolbox",
    name: "Tinkerer's Toolbox",
    effect: { en: "Both players draw a random 1-cost card from their deck.", it: "Entrambi i giocatori pescano dal proprio mazzo una carta casuale da 1 di costo." },
    tags: ["cards"],
  },
  {
    slug: "training-dojo",
    name: "Training Dojo",
    effect: { en: "After combat, ALL characters here get +1 power.", it: "Dopo il combattimento, TUTTI i personaggi qui ottengono +1 potenza." },
    tags: ["buff"],
  },
  {
    slug: "treasurers-office",
    name: "Treasurer's Office",
    effect: { en: "Cards cost 1 more to play this round.", it: "Le carte costano 1 in più da giocare in questo round." },
    tags: ["mana"],
  },
  {
    slug: "vacant-armory",
    name: "Vacant Armory",
    effect: { en: "Characters here have +1 power.", it: "I personaggi qui hanno +1 potenza." },
    tags: ["buff"],
  },
  {
    slug: "wall-of-dumpty",
    name: "Wall of Dumpty",
    effect: { en: "Destroy the first character you play here.", it: "Distruggi il primo personaggio che giochi qui." },
    tags: ["destroy"],
  },
  {
    slug: "windmill-ridge",
    name: "Windmill Ridge",
    effect: { en: "Characters here have Defender.", it: "I personaggi qui hanno Defender." },
    tags: ["keyword"],
  },
  {
    slug: "wonderland",
    name: "Wonderland",
    effect: { en: "Reverse the attack order.", it: "Inverti l'ordine di attacco." },
    tags: ["ability"],
  },
];

/** I luoghi in ordine alfabetico: è l'ordine con cui si cerca un nome a colpo d'occhio. */
export const locationsByName = [...locations].sort((a, b) => a.name.localeCompare(b.name, "en"));

export function getLocation(slug: string): GameLocation | undefined {
  return locations.find((l) => l.slug === slug);
}

/** Quanti luoghi per ogni famiglia di effetti (per i filtri, che mostrano il conteggio). */
export function countByTag(): Record<LocationTag, number> {
  const out = Object.fromEntries(locationTags.map((t) => [t, 0])) as Record<LocationTag, number>;
  for (const l of locations) for (const t of l.tags) out[t] += 1;
  return out;
}
