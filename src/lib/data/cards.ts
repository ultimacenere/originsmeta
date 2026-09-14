import type { Locale } from "../i18n";

export type L10n = Record<Locale, string>;
export type CardType = "unit" | "spell" | "token";
export type ChangeKind = "buff" | "nerf" | "rework" | "deck";
export type PatchId = "0.6.1" | "0.6.2" | "0.6.3";

export type SagaId =
  | "arthurian"
  | "wonderland"
  | "hundred-acre-wood"
  | "oz"
  | "sherwood"
  | "gothic"
  | "jungle-book"
  | "fairy-tale"
  | "nursery-rhyme"
  | "myth-folklore"
  | "ballad-of-mulan"
  | "arabian-nights"
  | "baker-street"
  | "other";

export const sagas: Record<SagaId, L10n> = {
  arthurian: { en: "Arthurian legend", it: "Ciclo arturiano", fr: "Légende arthurienne" },
  wonderland: { en: "Wonderland", it: "Paese delle Meraviglie", fr: "Pays des Merveilles" },
  "hundred-acre-wood": { en: "Hundred Acre Wood", it: "Bosco dei Cento Acri", fr: "Forêt des Rêves bleus" },
  oz: { en: "Land of Oz", it: "Terra di Oz", fr: "Pays d'Oz" },
  sherwood: { en: "Sherwood", it: "Sherwood", fr: "Sherwood" },
  gothic: { en: "Gothic horror", it: "Horror gotico", fr: "Horreur gothique" },
  "jungle-book": { en: "The Jungle Book", it: "Il libro della giungla", fr: "Le Livre de la jungle" },
  "fairy-tale": { en: "Fairy tales", it: "Fiabe", fr: "Contes de fées" },
  "nursery-rhyme": { en: "Nursery rhymes", it: "Filastrocche", fr: "Comptines" },
  "myth-folklore": { en: "Myth & folklore", it: "Miti e folclore", fr: "Mythes et folklore" },
  "ballad-of-mulan": { en: "Ballad of Mulan", it: "Ballata di Mulan", fr: "Ballade de Mulan" },
  "arabian-nights": { en: "Arabian Nights", it: "Le mille e una notte", fr: "Les Mille et Une Nuits" },
  "baker-street": { en: "Baker Street", it: "Baker Street", fr: "Baker Street" },
  other: { en: "Other", it: "Altro", fr: "Autre" },
};

export const patches: Record<PatchId, { date: string; url: string; title: string }> = {
  "0.6.1": {
    date: "2026-08-14",
    url: "https://steamcommunity.com/app/4429430/allnews/",
    title: "Closed Playtest Patch Notes - Update 0.6.1",
  },
  "0.6.2": {
    date: "2026-08-21",
    url: "https://steamcommunity.com/app/4429430/allnews/",
    title: "Closed Playtest Patch Notes - Update 0.6.2",
  },
  "0.6.3": {
    date: "2026-08-27",
    url: "https://steamcommunity.com/app/4429430/allnews/",
    title: "Closed Playtest Patch Notes - Update 0.6.3",
  },
};

export type Stats = { mana?: number; power?: number; health?: number };

export type Change = {
  patch: PatchId;
  kind: ChangeKind;
  from?: Stats;
  to?: Stats;
  note: L10n;
};

export type Card = {
  slug: string;
  name: string;
  type: CardType;
  legendary?: boolean;
  saga: SagaId;
  mana?: number;
  power?: number;
  health?: number;
  keywords?: string[];
  ability?: L10n;
  origin: L10n;
  status: "active" | "removed";
  history: Change[];
};

const n = (en: string, it: string, fr: string): L10n => ({ en, it, fr });

export const cards: Card[] = [
  {
    slug: "mulan",
    name: "Mulan",
    type: "unit",
    legendary: true,
    saga: "ballad-of-mulan",
    mana: 4,
    power: 2,
    health: 4,
    keywords: ["Double Attack", "On Reveal"],
    ability: n(
      "Double Attack. Repeats your allies' On Reveal abilities.",
      "Doppio Attacco. Ripete le abilità On Reveal dei tuoi alleati.",
      "Double Attaque. Répète les capacités On Reveal de vos alliés.",
    ),
    origin: n(
      "The warrior who takes her father's place in the army, from the 6th-century Chinese Ballad of Mulan.",
      "La guerriera che prende il posto del padre nell'esercito, dalla Ballata di Mulan (VI secolo).",
      "La guerrière qui remplace son père à l'armée, d'après la Ballade de Mulan (VIe siècle).",
    ),
    status: "active",
    history: [
      {
        patch: "0.6.2",
        kind: "buff",
        from: { mana: 4, power: 2, health: 4 },
        to: { mana: 4, power: 2, health: 4 },
        note: n(
          "Stats unchanged; gains Double Attack on top of repeating allies' On Reveal abilities.",
          "Statistiche invariate; ottiene Doppio Attacco oltre a ripetere le On Reveal degli alleati.",
          "Statistiques inchangées ; gagne Double Attaque en plus de répéter les On Reveal des alliés.",
        ),
      },
    ],
  },
  {
    slug: "queen-of-hearts",
    name: "Queen of Hearts",
    type: "unit",
    legendary: true,
    saga: "wonderland",
    mana: 4,
    power: 3,
    health: 3,
    keywords: ["First Strike", "On Death"],
    ability: n(
      "First Strike. Repeats your allies' On Death abilities.",
      "Primo Colpo. Ripete le abilità On Death dei tuoi alleati.",
      "Initiative. Répète les capacités On Death de vos alliés.",
    ),
    origin: n(
      "The card-suit tyrant of Lewis Carroll's Alice's Adventures in Wonderland (1865).",
      "La tiranna dei semi di carte di Alice nel Paese delle Meraviglie di Lewis Carroll (1865).",
      "La tyranne des cartes d'Alice au pays des merveilles de Lewis Carroll (1865).",
    ),
    status: "active",
    history: [
      {
        patch: "0.6.2",
        kind: "rework",
        from: { mana: 5, power: 3, health: 5 },
        to: { mana: 4, power: 3, health: 3 },
        note: n(
          "Cheaper and smaller; gains First Strike on top of repeating allies' On Death abilities.",
          "Più economica e più piccola; ottiene Primo Colpo oltre a ripetere le On Death degli alleati.",
          "Moins chère et plus petite ; gagne Initiative en plus de répéter les On Death des alliés.",
        ),
      },
    ],
  },
  {
    slug: "king-arthur",
    name: "King Arthur",
    type: "unit",
    saga: "arthurian",
    mana: 7,
    power: 7,
    health: 7,
    origin: n(
      "The once and future king of Britain, Excalibur in hand.",
      "Il re di Britannia che fu e che sarà, Excalibur in pugno.",
      "Le roi de Bretagne, Excalibur à la main.",
    ),
    status: "active",
    history: [
      {
        patch: "0.6.3",
        kind: "buff",
        from: { mana: 7, power: 5, health: 5 },
        to: { mana: 7, power: 7, health: 7 },
        note: n("+2/+2, the biggest single buff of the playtest.", "+2/+2, il buff singolo più grande del playtest.", "+2/+2, le plus gros buff du playtest."),
      },
    ],
  },
  {
    slug: "lancelot",
    name: "Lancelot",
    type: "unit",
    saga: "arthurian",
    mana: 4,
    power: 4,
    health: 4,
    origin: n("Arthur's greatest knight and his undoing.", "Il più grande cavaliere di Artù, e la sua rovina.", "Le plus grand chevalier d'Arthur, et sa perte."),
    status: "active",
    history: [
      { patch: "0.6.3", kind: "buff", from: { mana: 4, power: 3, health: 3 }, to: { mana: 4, power: 4, health: 4 }, note: n("+1/+1.", "+1/+1.", "+1/+1.") },
    ],
  },
  {
    slug: "merlin",
    name: "Merlin",
    type: "unit",
    saga: "arthurian",
    mana: 5,
    power: 5,
    health: 5,
    origin: n("The wizard who raised Arthur and sees what is to come.", "Il mago che allevò Artù e vede ciò che verrà.", "Le magicien qui éleva Arthur et voit ce qui vient."),
    status: "active",
    history: [
      { patch: "0.6.3", kind: "buff", from: { mana: 5, power: 3, health: 5 }, to: { mana: 5, power: 5, health: 5 }, note: n("+2 Power.", "+2 Potenza.", "+2 Puissance.") },
    ],
  },
  {
    slug: "merlins-prophecy",
    name: "Merlin's Prophecy",
    type: "spell",
    saga: "arthurian",
    mana: 2,
    origin: n("Merlin's foresight, turned into a spell.", "La preveggenza di Merlino, trasformata in magia.", "La clairvoyance de Merlin, transformée en sort."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "nerf", from: { mana: 1 }, to: { mana: 2 }, note: n("Costs 1 more.", "Costa 1 in più.", "Coûte 1 de plus.") }],
  },
  {
    slug: "bagheera",
    name: "Bagheera",
    type: "unit",
    saga: "jungle-book",
    mana: 1,
    power: 1,
    health: 1,
    keywords: ["On Reveal"],
    ability: n("On Reveal: +2/+2 on a middle space.", "On Reveal: +2/+2 su uno spazio centrale.", "On Reveal : +2/+2 sur une case centrale."),
    origin: n("The black panther who mentors Mowgli in Kipling's Jungle Book (1894).", "La pantera nera che fa da mentore a Mowgli nel Libro della giungla di Kipling (1894).", "La panthère noire qui guide Mowgli dans Le Livre de la jungle de Kipling (1894)."),
    status: "active",
    history: [
      { patch: "0.6.3", kind: "rework", from: { mana: 1, power: 1, health: 2 }, to: { mana: 1, power: 1, health: 1 }, note: n("Loses 1 Health; On Reveal bonus on a middle space rises from +1/+1 to +2/+2.", "Perde 1 Salute; il bonus On Reveal su spazio centrale sale da +1/+1 a +2/+2.", "Perd 1 Vie ; le bonus On Reveal sur case centrale passe de +1/+1 à +2/+2.") },
    ],
  },
  {
    slug: "mowgli",
    name: "Mowgli",
    type: "unit",
    saga: "jungle-book",
    origin: n("The man-cub raised by wolves.", "Il cucciolo d'uomo cresciuto dai lupi.", "Le petit d'homme élevé par les loups."),
    status: "active",
    history: [{ patch: "0.6.1", kind: "deck", note: n("Added to the Swarm deck in place of First Aid to strengthen the late game.", "Aggiunto al mazzo Swarm al posto di First Aid per rafforzare il finale di partita.", "Ajouté au deck Swarm à la place de First Aid pour renforcer la fin de partie.") }],
  },
  {
    slug: "bandersnatch",
    name: "Bandersnatch",
    type: "unit",
    saga: "wonderland",
    mana: 8,
    power: 7,
    health: 7,
    origin: n("The frumious beast of Carroll's Jabberwocky.", "La bestia frumiosa del Jabberwocky di Carroll.", "La bête frumieuse du Jabberwocky de Carroll."),
    status: "active",
    history: [
      { patch: "0.6.1", kind: "deck", note: n("Added to the Evil deck while Count Orlok is out.", "Aggiunto al mazzo Evil mentre il Conte Orlok è fuori.", "Ajouté au deck Evil pendant l'absence du comte Orlok.") },
      { patch: "0.6.2", kind: "nerf", from: { mana: 8, power: 9, health: 9 }, to: { mana: 8, power: 8, health: 8 }, note: n("-1/-1.", "-1/-1.", "-1/-1.") },
      { patch: "0.6.3", kind: "nerf", from: { mana: 8, power: 8, health: 8 }, to: { mana: 8, power: 7, health: 7 }, note: n("-1/-1 again.", "Ancora -1/-1.", "Encore -1/-1.") },
    ],
  },
  {
    slug: "white-queen",
    name: "White Queen",
    type: "unit",
    saga: "wonderland",
    mana: 4,
    power: 3,
    health: 3,
    origin: n("The gentle, scatterbrained queen of Through the Looking-Glass (1871).", "La regina gentile e svagata di Attraverso lo specchio (1871).", "La reine douce et distraite de De l'autre côté du miroir (1871)."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "buff", from: { mana: 4, power: 2, health: 3 }, to: { mana: 4, power: 3, health: 3 }, note: n("+1 Power.", "+1 Potenza.", "+1 Puissance.") }],
  },
  {
    slug: "card-soldier",
    name: "Card Soldier",
    type: "unit",
    saga: "wonderland",
    mana: 2,
    power: 3,
    health: 1,
    origin: n("A living playing card in the Queen's guard.", "Una carta da gioco vivente nella guardia della Regina.", "Une carte à jouer vivante de la garde de la Reine."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 2, power: 2, health: 1 }, to: { mana: 2, power: 3, health: 1 }, note: n("+1 Power.", "+1 Potenza.", "+1 Puissance.") }],
  },
  {
    slug: "christopher-robin",
    name: "Christopher Robin",
    type: "unit",
    saga: "hundred-acre-wood",
    mana: 4,
    power: 4,
    health: 5,
    origin: n("The boy whose toys came alive in A. A. Milne's stories (1926).", "Il bambino i cui giocattoli presero vita nei racconti di A. A. Milne (1926).", "Le garçon dont les jouets prennent vie dans les récits d'A. A. Milne (1926)."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "rework", from: { mana: 4, power: 5, health: 4 }, to: { mana: 4, power: 4, health: 5 }, note: n("Stats swapped: sturdier, hits softer.", "Statistiche invertite: più resistente, colpisce meno.", "Statistiques inversées : plus solide, frappe moins fort.") }],
  },
  {
    slug: "piglet",
    name: "Piglet",
    type: "unit",
    saga: "hundred-acre-wood",
    mana: 2,
    power: 2,
    health: 1,
    keywords: ["On Reveal"],
    ability: n("On Reveal: other allies here get +1 Power.", "On Reveal: gli altri alleati qui ottengono +1 Potenza.", "On Reveal : les autres alliés ici gagnent +1 Puissance."),
    origin: n("Pooh's very small, very brave friend.", "L'amico piccolissimo e coraggiosissimo di Pooh.", "Le tout petit et très courageux ami de Winnie."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "nerf", note: n("On Reveal now grants +1 Power only; it no longer grants Health.", "L'On Reveal dà solo +1 Potenza; non dà più Salute.", "L'On Reveal ne donne plus que +1 Puissance ; plus de Vie.") }],
  },
  {
    slug: "kanga",
    name: "Kanga",
    type: "unit",
    saga: "hundred-acre-wood",
    mana: 3,
    power: 2,
    health: 3,
    origin: n("The kangaroo mother of the Hundred Acre Wood.", "La mamma canguro del Bosco dei Cento Acri.", "La maman kangourou de la Forêt des Rêves bleus."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 4, power: 3, health: 4 }, to: { mana: 3, power: 2, health: 3 }, note: n("Cheaper and smaller.", "Più economica e più piccola.", "Moins chère et plus petite.") }],
  },
  {
    slug: "wicked-witch-of-the-west",
    name: "Wicked Witch of the West",
    type: "unit",
    saga: "oz",
    mana: 3,
    power: 1,
    health: 5,
    ability: n("Gives you Flying Monkeys (4/1).", "Ti dà Scimmie Volanti (4/1).", "Vous donne des Singes volants (4/1)."),
    origin: n("Dorothy's nemesis in Baum's Wonderful Wizard of Oz (1900).", "La nemesi di Dorothy nel Meraviglioso Mago di Oz di Baum (1900).", "La némésis de Dorothy dans Le Magicien d'Oz de Baum (1900)."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 3, power: 1, health: 4 }, to: { mana: 3, power: 1, health: 5 }, note: n("+1 Health; her Flying Monkeys are now 4/1, up from 2/3.", "+1 Salute; le sue Scimmie Volanti ora sono 4/1, da 2/3.", "+1 Vie ; ses Singes volants passent de 2/3 à 4/1.") }],
  },
  {
    slug: "flying-monkey",
    name: "Flying Monkey",
    type: "unit",
    saga: "oz",
    mana: 3,
    power: 4,
    health: 1,
    origin: n("The winged servants of the Wicked Witch.", "I servi alati della Strega Cattiva.", "Les serviteurs ailés de la Méchante Sorcière."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 4, power: 2, health: 3 }, to: { mana: 3, power: 4, health: 1 }, note: n("Cheaper glass cannon.", "Cannone di vetro più economico.", "Canon de verre moins cher.") }],
  },
  {
    slug: "scarecrow",
    name: "Scarecrow",
    type: "unit",
    saga: "oz",
    mana: 2,
    power: 1,
    health: 1,
    origin: n("The straw man in search of a brain.", "L'uomo di paglia in cerca di un cervello.", "L'homme de paille en quête d'un cerveau."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "nerf", from: { mana: 2, power: 1, health: 2 }, to: { mana: 2, power: 1, health: 1 }, note: n("-1 Health.", "-1 Salute.", "-1 Vie.") }],
  },
  {
    slug: "marian",
    name: "Marian",
    type: "unit",
    saga: "sherwood",
    mana: 4,
    power: 3,
    health: 3,
    origin: n("Maid Marian of the Robin Hood ballads.", "Lady Marian delle ballate di Robin Hood.", "Lady Marianne des ballades de Robin des Bois."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "nerf", from: { mana: 4, power: 3, health: 4 }, to: { mana: 4, power: 3, health: 3 }, note: n("-1 Health.", "-1 Salute.", "-1 Vie.") }],
  },
  {
    slug: "guy-of-gisborne",
    name: "Guy of Gisborne",
    type: "unit",
    saga: "sherwood",
    mana: 6,
    power: 3,
    health: 3,
    origin: n("The bounty hunter sent to kill Robin Hood.", "Il cacciatore di taglie mandato a uccidere Robin Hood.", "Le chasseur de primes envoyé tuer Robin des Bois."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 7, power: 3, health: 5 }, to: { mana: 6, power: 3, health: 3 }, note: n("Costs 1 less, -2 Health.", "Costa 1 in meno, -2 Salute.", "Coûte 1 de moins, -2 Vie.") }],
  },
  {
    slug: "brides-of-dracula",
    name: "Brides of Dracula",
    type: "unit",
    saga: "gothic",
    mana: 2,
    power: 2,
    health: 2,
    origin: n("The three vampire sisters of Stoker's Dracula (1897).", "Le tre sorelle vampire del Dracula di Stoker (1897).", "Les trois sœurs vampires du Dracula de Stoker (1897)."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 3, power: 2, health: 2 }, to: { mana: 2, power: 2, health: 2 }, note: n("Costs 1 less.", "Costa 1 in meno.", "Coûte 1 de moins.") }],
  },
  {
    slug: "van-helsings-tools",
    name: "Van Helsing's Tools",
    type: "spell",
    saga: "gothic",
    mana: 0,
    ability: n("Creates a Silver Bullet.", "Crea un Proiettile d'Argento.", "Crée une Balle d'argent."),
    origin: n("The vampire hunter's kit from Stoker's Dracula.", "L'attrezzatura del cacciatore di vampiri del Dracula di Stoker.", "La trousse du chasseur de vampires du Dracula de Stoker."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 1 }, to: { mana: 0 }, note: n("Now free; the Silver Bullet it creates deals 1 damage instead of 3.", "Ora gratis; il Proiettile d'Argento che crea infligge 1 danno invece di 3.", "Désormais gratuit ; la Balle d'argent créée inflige 1 dégât au lieu de 3.") }],
  },
  {
    slug: "silver-bullet",
    name: "Silver Bullet",
    type: "token",
    saga: "gothic",
    ability: n("Deals 1 damage.", "Infligge 1 danno.", "Inflige 1 dégât."),
    origin: n("Created by Van Helsing's Tools.", "Creata da Van Helsing's Tools.", "Créée par Van Helsing's Tools."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "nerf", note: n("Damage reduced from 3 to 1.", "Danno ridotto da 3 a 1.", "Dégâts réduits de 3 à 1.") }],
  },
  {
    slug: "count-orlok",
    name: "Count Orlok",
    type: "unit",
    saga: "gothic",
    origin: n("The vampire of Murnau's Nosferatu (1922).", "Il vampiro del Nosferatu di Murnau (1922).", "Le vampire du Nosferatu de Murnau (1922)."),
    status: "removed",
    history: [{ patch: "0.6.1", kind: "deck", note: n("Temporarily removed from the Evil deck and the game while an issue with his ability is fixed.", "Rimosso temporaneamente dal mazzo Evil e dal gioco mentre viene corretto un problema alla sua abilità.", "Retiré temporairement du deck Evil et du jeu le temps de corriger un problème de capacité.") }],
  },
  {
    slug: "huntsman",
    name: "Huntsman",
    type: "unit",
    saga: "fairy-tale",
    mana: 4,
    power: 4,
    health: 4,
    origin: n("The queen's huntsman who spares Snow White (Grimm, 1812).", "Il cacciatore della regina che risparmia Biancaneve (Grimm, 1812).", "Le chasseur de la reine qui épargne Blanche-Neige (Grimm, 1812)."),
    status: "active",
    history: [
      { patch: "0.6.1", kind: "rework", from: { mana: 4, power: 4, health: 4 }, to: { mana: 6, power: 6, health: 6 }, note: n("Moved up the curve to 6 Mana 6/6 while the team watches his performance.", "Spostato in alto nella curva a 6 Mana 6/6 mentre il team ne osserva le prestazioni.", "Déplacé à 6 Mana 6/6 le temps d'observer ses performances.") },
      { patch: "0.6.2", kind: "rework", from: { mana: 6, power: 6, health: 6 }, to: { mana: 4, power: 4, health: 4 }, note: n("Back to 4 Mana 4/4.", "Torna a 4 Mana 4/4.", "Retour à 4 Mana 4/4.") },
    ],
  },
  {
    slug: "three-not-so-little-pigs",
    name: "Three Not So Little Pigs",
    type: "unit",
    saga: "fairy-tale",
    mana: 7,
    power: 3,
    health: 3,
    ability: n("Summons pigs (3/3).", "Evoca maialini (3/3).", "Invoque des cochons (3/3)."),
    origin: n("The Three Little Pigs, all grown up.", "I Tre Porcellini, cresciuti.", "Les Trois Petits Cochons, devenus grands."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 7, power: 4, health: 4 }, to: { mana: 7, power: 3, health: 3 }, note: n("-1/-1; the pigs it summons are now 3/3 to match.", "-1/-1; i maialini evocati ora sono 3/3.", "-1/-1 ; les cochons invoqués passent à 3/3.") }],
  },
  {
    slug: "blow-the-house-down",
    name: "Blow the House Down",
    type: "spell",
    saga: "fairy-tale",
    mana: 4,
    origin: n("The Big Bad Wolf's signature move.", "La mossa preferita del Lupo Cattivo.", "La spécialité du Grand Méchant Loup."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "buff", from: { mana: 5 }, to: { mana: 4 }, note: n("Costs 1 less.", "Costa 1 in meno.", "Coûte 1 de moins.") }],
  },
  {
    slug: "bridge-troll",
    name: "Bridge Troll",
    type: "unit",
    saga: "fairy-tale",
    mana: 5,
    power: 5,
    health: 6,
    origin: n("The troll under the bridge of the Three Billy Goats Gruff.", "Il troll sotto il ponte dei Tre Capretti Furbetti.", "Le troll sous le pont des Trois Boucs Bourrus."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "buff", from: { mana: 5, power: 4, health: 6 }, to: { mana: 5, power: 5, health: 6 }, note: n("+1 Power.", "+1 Potenza.", "+1 Puissance.") }],
  },
  {
    slug: "rumple",
    name: "Rumple",
    type: "unit",
    saga: "fairy-tale",
    mana: 2,
    power: 2,
    health: 2,
    origin: n("Rumpelstiltskin, the imp who spins straw into gold (Grimm).", "Tremotino, il folletto che fila la paglia in oro (Grimm).", "Le nain Tracassin, qui file la paille en or (Grimm)."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "buff", from: { mana: 2, power: 1, health: 1 }, to: { mana: 2, power: 2, health: 2 }, note: n("+1/+1.", "+1/+1.", "+1/+1.") }],
  },
  {
    slug: "thumbelina",
    name: "Thumbelina",
    type: "unit",
    saga: "fairy-tale",
    mana: 1,
    power: 2,
    health: 2,
    origin: n("Andersen's thumb-sized heroine (1835).", "L'eroina alta un pollice di Andersen (1835).", "L'héroïne haute comme le pouce d'Andersen (1835)."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "buff", from: { mana: 1, power: 2, health: 1 }, to: { mana: 1, power: 2, health: 2 }, note: n("+1 Health.", "+1 Salute.", "+1 Vie.") }],
  },
  {
    slug: "stroke-of-midnight",
    name: "Stroke of Midnight",
    type: "spell",
    saga: "fairy-tale",
    mana: 1,
    origin: n("Cinderella's deadline.", "La scadenza di Cenerentola.", "L'heure fatidique de Cendrillon."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 2 }, to: { mana: 1 }, note: n("Costs 1 less.", "Costa 1 in meno.", "Coûte 1 de moins.") }],
  },
  {
    slug: "humpty",
    name: "Humpty",
    type: "unit",
    saga: "nursery-rhyme",
    mana: 3,
    power: 4,
    health: 1,
    origin: n("Humpty Dumpty, who sat on a wall.", "Humpty Dumpty, seduto sul muro.", "Humpty Dumpty, assis sur son mur."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 3, power: 3, health: 1 }, to: { mana: 3, power: 4, health: 1 }, note: n("+1 Power.", "+1 Potenza.", "+1 Puissance.") }],
  },
  {
    slug: "old-macdonald",
    name: "Old MacDonald",
    type: "unit",
    saga: "nursery-rhyme",
    mana: 4,
    power: 4,
    health: 4,
    origin: n("The farmer of the nursery rhyme, with a farm.", "Il contadino della filastrocca, con la sua fattoria.", "Le fermier de la comptine, et sa ferme."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "buff", from: { mana: 5, power: 3, health: 3 }, to: { mana: 4, power: 4, health: 4 }, note: n("Costs 1 less and +1/+1.", "Costa 1 in meno e +1/+1.", "Coûte 1 de moins et +1/+1.") }],
  },
  {
    slug: "little-lamb",
    name: "Little Lamb",
    type: "unit",
    saga: "nursery-rhyme",
    mana: 1,
    power: 1,
    health: 1,
    origin: n("Mary's little lamb, fleece as white as snow.", "L'agnellino di Mary, dal vello bianco come la neve.", "Le petit agneau de Mary, à la toison blanche comme neige."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 2, power: 1, health: 1 }, to: { mana: 1, power: 1, health: 1 }, note: n("Costs 1 less.", "Costa 1 in meno.", "Coûte 1 de moins.") }],
  },
  {
    slug: "bigfoot",
    name: "Bigfoot",
    type: "unit",
    saga: "myth-folklore",
    mana: 5,
    power: 6,
    health: 3,
    origin: n("The elusive giant of North American folklore.", "Il gigante inafferrabile del folclore nordamericano.", "Le géant insaisissable du folklore nord-américain."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "nerf", from: { mana: 5, power: 6, health: 4 }, to: { mana: 5, power: 6, health: 3 }, note: n("-1 Health.", "-1 Salute.", "-1 Vie.") }],
  },
  {
    slug: "sandman",
    name: "Sandman",
    type: "unit",
    saga: "myth-folklore",
    mana: 2,
    power: 1,
    health: 3,
    origin: n("The bringer of sleep from Northern European folklore.", "Il portatore di sonno del folclore nordeuropeo.", "Le marchand de sable du folklore d'Europe du Nord."),
    status: "active",
    history: [{ patch: "0.6.3", kind: "rework", from: { mana: 2, power: 2, health: 2 }, to: { mana: 2, power: 1, health: 3 }, note: n("-1 Power, +1 Health.", "-1 Potenza, +1 Salute.", "-1 Puissance, +1 Vie.") }],
  },
  {
    slug: "basilisk",
    name: "Basilisk",
    type: "unit",
    saga: "myth-folklore",
    mana: 2,
    power: 1,
    health: 2,
    origin: n("The serpent king whose gaze kills, from Pliny to the bestiaries.", "Il re dei serpenti dallo sguardo mortale, da Plinio ai bestiari.", "Le roi des serpents au regard mortel, de Pline aux bestiaires."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 4, power: 2, health: 4 }, to: { mana: 2, power: 1, health: 2 }, note: n("Halved: 2 Mana 1/2.", "Dimezzato: 2 Mana 1/2.", "Divisé par deux : 2 Mana 1/2.") }],
  },
  {
    slug: "pegasus",
    name: "Pegasus",
    type: "unit",
    saga: "myth-folklore",
    mana: 3,
    power: 2,
    health: 4,
    origin: n("The winged horse of Greek myth, born from Medusa.", "Il cavallo alato del mito greco, nato da Medusa.", "Le cheval ailé de la mythologie grecque, né de Méduse."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "buff", from: { mana: 4, power: 2, health: 4 }, to: { mana: 3, power: 2, health: 4 }, note: n("Costs 1 less.", "Costa 1 in meno.", "Coûte 1 de moins.") }],
  },
  {
    slug: "ellen-trechend",
    name: "Ellen Trechend",
    type: "unit",
    saga: "myth-folklore",
    mana: 8,
    power: 3,
    health: 3,
    keywords: ["On Reveal"],
    ability: n("On Reveal: +3/+3 for each enemy card here.", "On Reveal: +3/+3 per ogni carta nemica qui.", "On Reveal : +3/+3 par carte ennemie ici."),
    origin: n("The three-headed monster of Irish myth that laid Ireland waste.", "Il mostro a tre teste del mito irlandese che devastò l'Irlanda.", "Le monstre à trois têtes du mythe irlandais qui ravagea l'Irlande."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "rework", from: { mana: 9, power: 6, health: 6 }, to: { mana: 8, power: 3, health: 3 }, note: n("Cheaper, much smaller, but scales harder: +3/+3 per enemy here, up from +2/+2.", "Più economica, molto più piccola, ma scala di più: +3/+3 per nemico qui, da +2/+2.", "Moins chère, bien plus petite, mais grandit plus vite : +3/+3 par ennemi ici, contre +2/+2.") }],
  },
  {
    slug: "banshee",
    name: "Banshee",
    type: "unit",
    saga: "myth-folklore",
    mana: 2,
    power: 1,
    health: 1,
    keywords: ["On Death"],
    ability: n("On Death: allies get +1 Power.", "On Death: gli alleati ottengono +1 Potenza.", "On Death : les alliés gagnent +1 Puissance."),
    origin: n("The wailing spirit of Irish folklore who foretells a death.", "Lo spirito urlante del folclore irlandese che annuncia una morte.", "L'esprit hurlant du folklore irlandais qui annonce une mort."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "nerf", note: n("On Death now grants +1 Power only; it no longer grants Health.", "L'On Death dà solo +1 Potenza; non dà più Salute.", "L'On Death ne donne plus que +1 Puissance ; plus de Vie.") }],
  },
  {
    slug: "koschei",
    name: "Koschei",
    type: "unit",
    saga: "myth-folklore",
    origin: n("Koschei the Deathless of Slavic folklore, who hides his soul away.", "Koschei l'Immortale del folclore slavo, che nasconde la propria anima.", "Kochtcheï l'Immortel du folklore slave, qui cache son âme."),
    status: "active",
    history: [{ patch: "0.6.1", kind: "deck", note: n("The Discard deck is built around discarding him reliably; Genie was swapped for Mind Palace to help.", "Il mazzo Discard è costruito per scartarlo in modo affidabile; Genie è stato sostituito da Mind Palace per aiutare.", "Le deck Discard est construit pour le défausser de façon fiable ; Genie a été remplacé par Mind Palace.") }],
  },
  {
    slug: "imhotep",
    name: "Imhotep",
    type: "unit",
    saga: "myth-folklore",
    mana: 4,
    power: 2,
    health: 2,
    origin: n("The Egyptian architect later deified, and the mummy of the 1932 film.", "L'architetto egizio poi divinizzato, e la mummia del film del 1932.", "L'architecte égyptien divinisé, et la momie du film de 1932."),
    status: "active",
    history: [{ patch: "0.6.2", kind: "nerf", from: { mana: 4, power: 2, health: 3 }, to: { mana: 4, power: 2, health: 2 }, note: n("-1 Health.", "-1 Salute.", "-1 Vie.") }],
  },
  {
    slug: "genie",
    name: "Genie",
    type: "unit",
    saga: "arabian-nights",
    origin: n("The wish-granting spirit of the lamp.", "Lo spirito della lampada che esaudisce desideri.", "Le génie de la lampe qui exauce les vœux."),
    status: "active",
    history: [{ patch: "0.6.1", kind: "deck", note: n("Removed from the Discard deck: he got in the way of discarding Koschei.", "Rimosso dal mazzo Discard: intralciava lo scarto di Koschei.", "Retiré du deck Discard : il gênait la défausse de Koschei.") }],
  },
  {
    slug: "mind-palace",
    name: "Mind Palace",
    type: "spell",
    saga: "baker-street",
    ability: n("Cheap card draw.", "Pescata economica.", "Pioche bon marché."),
    origin: n("Sherlock Holmes's memory technique.", "La tecnica di memoria di Sherlock Holmes.", "La technique de mémoire de Sherlock Holmes."),
    status: "active",
    history: [{ patch: "0.6.1", kind: "deck", note: n("Added to the Discard deck in place of Genie.", "Aggiunto al mazzo Discard al posto di Genie.", "Ajouté au deck Discard à la place de Genie.") }],
  },
  {
    slug: "first-aid",
    name: "First Aid",
    type: "spell",
    saga: "other",
    origin: n("A cheap healing spell.", "Una magia di cura economica.", "Un sort de soin bon marché."),
    status: "active",
    history: [{ patch: "0.6.1", kind: "deck", note: n("Removed from the Swarm deck in favour of Mowgli.", "Rimosso dal mazzo Swarm a favore di Mowgli.", "Retiré du deck Swarm au profit de Mowgli.") }],
  },
];

export function getCard(slug: string): Card | undefined {
  return cards.find((c) => c.slug === slug);
}

export function statLine(card: Pick<Card, "mana" | "power" | "health" | "type">): string {
  if (card.mana === undefined && card.power === undefined) return "";
  if (card.type === "spell" || card.type === "token") return card.mana !== undefined ? `${card.mana}` : "";
  return `${card.mana ?? "?"} · ${card.power ?? "?"}/${card.health ?? "?"}`;
}

/** Ultima patch che ha toccato la carta. */
export function lastChange(card: Card): Change | undefined {
  return card.history[card.history.length - 1];
}

const kindOrder: Record<ChangeKind, number> = { buff: 0, nerf: 1, rework: 2, deck: 3 };

/** Movers: carte con variazioni di statistiche, ordinate per impatto. */
export function movers(): { card: Card; change: Change; delta: number }[] {
  const out: { card: Card; change: Change; delta: number }[] = [];
  for (const card of cards) {
    for (const ch of card.history) {
      if (!ch.from || !ch.to) continue;
      const dp = (ch.to.power ?? 0) - (ch.from.power ?? 0);
      const dh = (ch.to.health ?? 0) - (ch.from.health ?? 0);
      const dm = (ch.to.mana ?? 0) - (ch.from.mana ?? 0);
      const delta = dp + dh - dm;
      out.push({ card, change: ch, delta });
    }
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || kindOrder[a.change.kind] - kindOrder[b.change.kind]);
}
