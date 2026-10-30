/**
 * Le promo della Alpha Edition sulla landing /kickstarter e nella guida al Kickstarter (30/10/2026). Immagini dalla
 * cartella "Kickstarter Alpha Slabs" del media kit per i creator di Koin Games (Fenchurch, Discord "Origins Creator
 * Program", 30/10/2026), archiviata in 10_Materiale_Koin/2026-10-30_kickstarter-alpha-slabs sul Drive; Pierluigi: "fai la
 * sezione Promo Alpha sulla landing /kickstarter e nella guida, sette lingue, senza Morgan le Fay, Red e Tigger".
 *
 * Solo le promo che Koin mostra già in pubblico sulla pagina della campagna (letta il 30/10/2026): gli stretch goal della
 * Alpha Alt-Art Promo Box e le promo dei livelli. Morgan le Fay, Red e Tigger della stessa cartella non sono ancora
 * annunciate: non stanno qui né in public/ finché Koin non le pubblica. Le immagini sono intere, con i crediti impressi
 * (regola del materiale Koin): `artist` ripete l'illustratore stampato sulla carta.
 *
 * Questo modulo non importa niente a runtime, così lo carica anche `node --test`.
 */

export type KickstarterPromoGroup = "box" | "golden" | "oz" | "profile";

export type KickstarterPromo = {
  /** nome della carta come lo scrive Koin, in inglese in tutte le lingue */
  name: string;
  /** slug della carta nel database del sito */
  card: string;
  /** immagine in public/ (480 px di larghezza, WebP) */
  image: string;
  /** illustratore impresso sulla carta */
  artist: string;
  group: KickstarterPromoGroup;
  /** solo `box`: soglia dello stretch goal in dollari, 0 = nella scatola dal lancio */
  goal?: number;
  /** solo `profile`: la versione firmata dei livelli Legend */
  signed?: true;
};

/** Giorno in cui sono stati letti la pagina della campagna, gli stretch goal e i livelli. */
export const KICKSTARTER_PROMOS_READ = "2026-10-30";

/**
 * Stretch goal raggiunti alla lettura: tutti quelli fino a questa soglia compresa ("COMPLETED" sulla pagina il 30/10/2026,
 * fino a Mulan). Quando la campagna ne sblocca altri, si alzano questa soglia e `KICKSTARTER_PROMOS_READ`.
 */
export const KICKSTARTER_GOALS_REACHED_USD = 750_000;

/** "bringing the box to a total of 20 exclusive alt-art cards": l'ultimo stretch goal di carte, come lo scrive Koin. */
export const KICKSTARTER_BOX_TOTAL = { cards: 20, usd: 4_750_000 } as const;

const DIR = "/media/kickstarter/promos";
const box = (name: string, card: string, artist: string, goal: number): KickstarterPromo => ({ name, card, image: `${DIR}/box-${card}.webp`, artist, group: "box", goal });

/** In ordine di stretch goal; Jekyll e Hyde stanno nello stesso ($2,25M), come le coppie degli ultimi tre. */
export const KICKSTARTER_PROMOS: readonly KickstarterPromo[] = [
  box("Van Helsing", "van-helsing", "Estevao D. Almeida", 0),
  box("Sherlock", "sherlock", "Lucas Machado", 100_000),
  box("Watson", "watson", "Lucas Machado", 250_000),
  box("Queen of Hearts", "queen-of-hearts", "Juan Salvador Almencion", 500_000),
  box("Mulan", "mulan", "Alina Kapustina", 750_000),
  box("Dracula", "dracula", "Estevao D. Almeida", 1_250_000),
  box("Sheriff of Nottingham", "sheriff-of-nottingham", "Lucas Machado", 1_500_000),
  box("Boogeyman", "boogeyman", "Juan Salvador Almencion", 1_750_000),
  box("Jekyll", "jekyll", "Juan Salvador Almencion", 2_250_000),
  box("Hyde", "hyde", "Juan Salvador Almencion", 2_250_000),
  box("Goldi", "goldi", "Estevao D. Almeida", 2_500_000),
  box("Sandman", "sandman", "Juan Salvador Almencion", 2_750_000),
  box("Moby", "moby", "Alina Kapustina", 3_250_000),
  box("Scarecrow", "scarecrow", "Lucas Machado", 3_500_000),
  box("Roo", "roo", "Lucas Machado", 3_750_000),
  box("Mary", "mary", "Juan Salvador Almencion", 4_250_000),
  box("Baby Bear", "baby-bear", "Alina Kapustina", 4_250_000),
  box("Three Blind Mice", "three-blind-mice", "Lucas Machado", 4_500_000),
  box("Bagheera", "bagheera", "Juan Salvador Almencion", 4_500_000),
  box("Shield Maiden", "shield-maiden", "Alina Kapustina", 4_750_000),
  box("Red Knight", "red-knight", "Juan Salvador Almencion", 4_750_000),
  // Golden Slab Promo: Van Helsing dal livello Hero, Van Helsing e Rapunzel da Champion
  { name: "Van Helsing", card: "van-helsing", image: `${DIR}/golden-van-helsing.webp`, artist: "Daniel Alberdi Lamela", group: "golden" },
  { name: "Rapunzel", card: "rapunzel", image: `${DIR}/golden-rapunzel.webp`, artist: "Daniel Alberdi Lamela", group: "golden" },
  // Guaranteed Premium Alternate Art Promo Set, dal livello Icon (le cinque carte della scheda del livello)
  { name: "Dorothy", card: "dorothy", image: `${DIR}/oz-dorothy.webp`, artist: "Daniel Alberdi Lamela", group: "oz" },
  { name: "Scarecrow", card: "scarecrow", image: `${DIR}/oz-scarecrow.webp`, artist: "Daniel Alberdi Lamela", group: "oz" },
  { name: "Tin Woodman", card: "tin-woodman", image: `${DIR}/oz-tin-woodman.webp`, artist: "Daniel Alberdi Lamela", group: "oz" },
  { name: "Cowardly Lion", card: "cowardly-lion", image: `${DIR}/oz-cowardly-lion.webp`, artist: "Daniel Alberdi Lamela", group: "oz" },
  { name: "Toto", card: "toto", image: `${DIR}/oz-toto.webp`, artist: "Daniel Alberdi Lamela", group: "oz" },
  // Serialized Character Profile Promo dei livelli Myth (uno per personaggio); la versione firmata è dei livelli Legend
  { name: "Winnie-the-Pooh", card: "winnie-the-pooh", image: `${DIR}/profile-winnie-the-pooh.webp`, artist: "Don Flores", group: "profile" },
  { name: "Death", card: "death", image: `${DIR}/profile-death.webp`, artist: "Don Flores", group: "profile" },
  { name: "Alice", card: "alice", image: `${DIR}/profile-alice.webp`, artist: "Don Flores", group: "profile" },
  { name: "Robin Hood", card: "robin-hood", image: `${DIR}/profile-robin-hood.webp`, artist: "Don Flores", group: "profile" },
  { name: "Queen of Hearts", card: "queen-of-hearts", image: `${DIR}/profile-queen-of-hearts.webp`, artist: "Don Flores", group: "profile" },
  { name: "Winnie-the-Pooh", card: "winnie-the-pooh", image: `${DIR}/signature-winnie-the-pooh.webp`, artist: "Justin Stewart", group: "profile", signed: true },
];

/** Misura comune delle immagini (480 × 775 circa: le custodie non sono tutte identiche al pixel). */
export const PROMO_IMAGE_SIZE = { width: 480, height: 775 } as const;

/** Le promo di un gruppo, nell'ordine dell'elenco. */
export function promosOf(group: KickstarterPromoGroup, promos: readonly KickstarterPromo[] = KICKSTARTER_PROMOS): KickstarterPromo[] {
  return promos.filter((p) => p.group === group);
}

/** Lo stretch goal della promo è raggiunto (alla lettura `KICKSTARTER_PROMOS_READ`). */
export function promoUnlocked(p: KickstarterPromo, reached: number = KICKSTARTER_GOALS_REACHED_USD): boolean {
  return p.group === "box" && p.goal !== undefined && p.goal <= reached;
}
