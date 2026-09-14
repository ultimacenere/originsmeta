import type { Locale } from "../i18n";

type L10n = Record<Locale, string>;
const n = (en: string, it: string, fr: string): L10n => ({ en, it, fr });

export type Archetype = {
  slug: string;
  name: string;
  tagline: L10n;
  text: L10n;
  changes: { patch: string; removed?: string; added?: string; why: L10n }[];
  cards: string[]; // slugs di carte note nel mazzo
};

export const archetypes: Archetype[] = [
  {
    slug: "swarm",
    name: "Swarm",
    tagline: n("Go wide, buff the board", "Vai largo, potenzia il campo", "Jouer large, renforcer le plateau"),
    text: n(
      "Cheap bodies on every lane and effects that pump the whole board. Mowgli replaced a cheap spell in 0.6.1 because the deck ran out of gas in the mid-to-late game.",
      "Corpi economici su ogni corsia ed effetti che pompano tutto il campo. Mowgli ha sostituito una magia economica nella 0.6.1 perché il mazzo restava a secco a metà e fine partita.",
      "Des corps bon marché sur chaque voie et des effets qui renforcent tout le plateau. Mowgli a remplacé un sort bon marché en 0.6.1 parce que le deck s'essoufflait en milieu et fin de partie.",
    ),
    changes: [
      {
        patch: "0.6.1",
        removed: "First Aid",
        added: "Mowgli",
        why: n("Swarm felt thin in the mid-to-late game; a body instead of a cheap spell builds toward a stronger late-game hand.", "Swarm sembrava povero a metà e fine partita; un corpo al posto di una magia economica costruisce una mano finale più forte.", "Swarm manquait de souffle en milieu et fin de partie ; un corps à la place d'un sort bon marché prépare une meilleure main de fin de partie."),
      },
    ],
    cards: ["mowgli", "piglet", "little-lamb", "card-soldier"],
  },
  {
    slug: "evil",
    name: "Evil",
    tagline: n("Villains and big bodies", "Cattivi e grossi corpi", "Vilains et gros gabarits"),
    text: n(
      "The villains' deck. Count Orlok was pulled from the game in 0.6.1 while his ability is fixed, and Bandersnatch took his slot; the beast has since been nerfed twice.",
      "Il mazzo dei cattivi. Il Conte Orlok è stato tolto dal gioco nella 0.6.1 mentre viene sistemata la sua abilità, e Bandersnatch ha preso il suo posto; da allora la bestia è stata indebolita due volte.",
      "Le deck des vilains. Le comte Orlok a été retiré du jeu en 0.6.1 le temps de corriger sa capacité, et Bandersnatch a pris sa place ; la bête a depuis été affaiblie deux fois.",
    ),
    changes: [
      {
        patch: "0.6.1",
        removed: "Count Orlok",
        added: "Bandersnatch",
        why: n("Count Orlok temporarily swapped out while an issue with his ability is addressed.", "Il Conte Orlok è stato sostituito temporaneamente mentre si risolve un problema alla sua abilità.", "Le comte Orlok est remplacé temporairement le temps de corriger un problème de capacité."),
      },
    ],
    cards: ["bandersnatch", "count-orlok", "queen-of-hearts", "brides-of-dracula", "wicked-witch-of-the-west"],
  },
  {
    slug: "discard",
    name: "Discard",
    tagline: n("Throw away, get paid", "Scarta e incassa", "Défausser et encaisser"),
    text: n(
      "Built around discarding Koschei on purpose. Genie got in the way, so 0.6.1 swapped him for Mind Palace, a cheaper draw spell. The team noted the deck was underperforming.",
      "Costruito per scartare Koschei di proposito. Genie intralciava, così la 0.6.1 lo ha sostituito con Mind Palace, una pescata più economica. Il team ha notato che il mazzo rendeva meno degli altri.",
      "Construit pour défausser Koschei volontairement. Genie gênait, donc la 0.6.1 l'a remplacé par Mind Palace, une pioche moins chère. L'équipe a noté que le deck sous-performait.",
    ),
    changes: [
      {
        patch: "0.6.1",
        removed: "Genie",
        added: "Mind Palace",
        why: n("Discard was underperforming; Genie prevented reliably discarding Koschei.", "Discard rendeva meno; Genie impediva di scartare Koschei in modo affidabile.", "Discard sous-performait ; Genie empêchait de défausser Koschei de façon fiable."),
      },
    ],
    cards: ["koschei", "mind-palace", "genie"],
  },
];
