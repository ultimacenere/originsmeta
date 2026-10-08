import type { GuideCopy, GuideSlug } from "./guides";

/**
 * Guide in francese (07/10/2026, francese quarta lingua del sito): solo i testi. Categoria, carte, lista del mazzo,
 * copertina, data e tempo di lettura vengono dalla versione inglese in guides.ts (`getGuides`), come per lo spagnolo
 * (guides-es.ts). Una guida nuova si scrive nelle quattro lingue: inglese e italiano in guides.ts, spagnolo in
 * guides-es.ts, francese qui (il tipo lo pretende). Stesse regole delle altre lingue: link interni con /fr/, ancore
 * {#…} in francese senza accenti, nomi delle carte in inglese, "vous" al lettore e tipografia francese
 * (docs/francese.md). Le parole chiave del gioco usano i nomi francesi del gioco, letti l'08/10/2026.
 */
export const frText: Record<GuideSlug, GuideCopy> = {
  "origins-tcg-legendaries": {
    title: "Les 11 Légendaires d'Origins TCG : cartes, statistiques, patchs et decks",
    metaTitle: "Légendaires d'Origins TCG : les 11 et leurs decks",
    excerpt: "Les 11 cartes Légendaires de la Demo 2.0 d'Origins TCG : coût, statistiques, texte officiel, cartes créées, changements de patch et decks qui les utilisent.",
    faq: [
      {
        q: "Combien de Légendaires y a-t-il dans Origins TCG ?",
        a: "Onze dans la Demo 2.0 au 25 septembre 2026 : Dorothy, Dracula, Mulan, Queen of Hearts, Van Helsing, Wicked Stepmother, Merlin, King Arthur, Legion of the Dead, Three Not So Little Pigs et Robin Hood. La base de données d'OriginsMeta en conserve neuf autres qui ne sont pas dans la démo.",
      },
      {
        q: "Combien de Légendaires un deck peut-il avoir ?",
        a: "Une seule. Un deck, c'est une Légendaire plus douze cartes de base jouées en deux exemplaires chacune, 25 cartes en tout. En Conquest, vous apportez plus d'un deck : à Big Bob's Playtest Battle, chacun devait avoir une Légendaire différente ; les annonces de la Crimson Cup ne le disent pas, et notre deck builder signale deux decks avec la même.",
      },
      {
        q: "Quelle Légendaire est dans le plus de decks ?",
        a: "Au 25 septembre 2026, Three Not So Little Pigs, qui mène 4 des 20 decks publiés sur OriginsMeta ; Van Helsing en mène 3 et Wicked Stepmother aucun. C'est une mesure de popularité sur le site, pas de force, et le décompte à jour est sur la page Les plus jouées de la tier list.",
      },
      {
        q: "Existe-t-il une Légendaire qui soit un sort ?",
        a: "Oui, une seule dans la Demo 2.0 : Legion of the Dead, un sort à 7 mana qui remplit votre plateau de Zombies 2/2.",
      },
    ],
    body: `
## En bref {#en-bref}

- **Onze Légendaires** sont dans la Demo 2.0, la version d'Origins TCG à laquelle vous pouvez jouer aujourd'hui : six coûtent 4 mana, une 5, trois 7 et une 8.
- Dix sont des unités et une est un sort, Legion of the Dead. Cinq sont Good, trois Evil et trois Neutral.
- Quatre d'entre elles créent d'autres cartes par leur texte : Dracula, Van Helsing, Legion of the Dead et Three Not So Little Pigs.
- Sept ont changé dans les patchs d'équilibrage entre août et le 21 septembre 2026 ; Dracula, Van Helsing, Legion of the Dead et Robin Hood non. Le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 n'en a rééquilibré aucune.
- Les 20 decks publiés sur OriginsMeta à 20:00 CEST le 25 septembre 2026 en utilisent dix sur onze : Three Not So Little Pigs en mène quatre, Van Helsing trois, Wicked Stepmother aucun. Six Légendaires ont un guide OriginsMeta consacré à l'un de leurs decks.

Les Légendaires ci-dessous sont classées par coût et, à coût égal, par ordre alphabétique. Le guide décrit ce que fait chaque carte, pas sa force : notre [tier list d'Origins TCG](/fr/tier-list) les classera d'après les résultats des tournois et le sommet du [mode classé](/fr/guides/origins-tcg-ranked), après la Crimson Cup.

## Les 11 Légendaires en un tableau {#tableau}

| Légendaire | Coût | Puissance/Santé | Alignement | Decks |
| --- | --- | --- | --- | --- |
| [Dorothy](/fr/cards/dorothy) | 4 | 1/1 | Good | 2 |
| [Dracula](/fr/cards/dracula) | 4 | 3/2 | Evil | 2 |
| [Mulan](/fr/cards/mulan) | 4 | 2/4 | Good | 1 |
| [Queen of Hearts](/fr/cards/queen-of-hearts) | 4 | 3/3 | Evil | 2 |
| [Van Helsing](/fr/cards/van-helsing) | 4 | 3/4 | Good | 3 |
| [Wicked Stepmother](/fr/cards/wicked-stepmother) | 4 | 4/6 | Evil | 0 |
| [Merlin](/fr/cards/merlin) | 5 | 5/5 | Neutral | 1 |
| [King Arthur](/fr/cards/king-arthur) | 7 | 7/7 | Good | 2 |
| [Legion of the Dead](/fr/cards/legion-of-the-dead) | 7 | sort | Neutral | 2 |
| [Three Not So Little Pigs](/fr/cards/three-not-so-little-pigs) | 7 | 3/3 | Neutral | 4 |
| [Robin Hood](/fr/cards/robin-hood) | 8 | 4/4 | Good | 1 |

La dernière colonne compte les decks que chaque Légendaire mène parmi les 20 publiés sur OriginsMeta du 15 septembre à 20:00 CEST le 25 septembre 2026. Elle mesure la popularité sur le site, pas la force ni le win rate ; le décompte à jour est sur [Les plus jouées](/fr/tier-list/most-played).

## Ce que fait la Légendaire dans un deck {#dans-un-deck}

- **Une par deck.** Un deck, c'est une Légendaire plus douze cartes de base, et le jeu ajoute un second exemplaire de chaque carte de base : 25 cartes en jeu, d'après l'AMA de l'équipe de Koin Games. Le [deck builder](/fr/deck-builder) vérifie la règle.
- **Votre adversaire la voit.** Le patch 0.6.1 du playtest fermé (14 août 2026) a ajouté un aperçu de la Légendaire adverse pendant le mulligan, d'après les [notes de patch officielles](https://store.steampowered.com/news/app/4429430/view/1840944183780414).
- **En Conquest, elle donne son nom au deck.** À la Crimson Cup, chaque joueur apporte trois decks, et quand vous bannissez un deck de votre adversaire, vous n'en voyez que la Légendaire ([règles de la Crimson Cup](/fr/news/crimson-cup-format-check-in)). Les annonces ne disent pas si les trois Légendaires doivent être différentes ; à Big Bob's Playtest Battle, elles devaient l'être. Comment assembler les trois decks : notre [guide du Conquest](/fr/guides/origins-tcg-conquest).

Les textes de cartes cités ci-dessous sont les textes officiels du jeu, lus dans le jeu en français le 8 octobre 2026. Coûts et statistiques ont été vérifiés carte par carte le 22 septembre 2026. Les sagas et les notes sur chaque légende sont d'OriginsMeta. Les patchs sont ceux suivis dans [MetaShifting](/fr/metashifting) : les mises à jour 0.6.1, 0.6.2 et 0.6.3 du playtest (août 2026), le patch de la démo du 21 septembre 2026 et le patch 0.7 du 29 septembre 2026, qui n'a rééquilibré aucune Légendaire. Le pouvoir légendaire n'est pas traité ici : nous ne l'avons pas encore transcrit du jeu, et la fiche de chaque carte le montrera quand ce sera fait.

## Dorothy {#dorothy}

**4 mana · 1/1 · unité · Good** · Saga : Pays d'Oz

> Je peux me Déplacer chaque manche.
>
> J'ai +1⚔️/+1❤️ pour chaque déplacement d'un allié cette partie.

- **La légende.** La fillette du Kansas emportée à Oz par une tornade dans le roman de L. Frank Baum de 1900.
- **Patchs.** Patch de la démo du 21 septembre 2026 : mana 5 → 4 ([notes de patch](/fr/news/demo-patch-notes-0921)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Deux : [Dorothy Combo](/fr/decks/community/dorothy-combo-7503) et [Move/Combo](/fr/decks/community/move-combo-075a).
- **Guide.** [Guide du deck de Dorothy : Dorothy Combo](/fr/guides/dorothy-combo-guide).
- **Fiche.** [Dorothy, carte Légendaire : statistiques et texte](/fr/cards/dorothy).

## Dracula {#dracula}

**4 mana · 3/2 · unité · Evil** · Saga : Horreur gothique

> Quand vous défaussez, je reviens de votre cimetière dans votre main.
>
> À la révélation : Invoquez Brides of Dracula [2⚔️/2❤️] sur une case aléatoire ici.

- **La légende.** Le comte transylvain du roman de Bram Stoker de 1897.
- **Cartes créées.** [Brides of Dracula](/fr/cards/brides-of-dracula), une 2/2 qui, d'après son texte, inflige 1 dégât à la barrière de l'adversaire dans son lieu et gagne +1❤️ chaque fois que vous défaussez une carte (carte créée : texte non vérifié dans le jeu).
- **Patchs.** Dracula n'a pas changé. Brides of Dracula est passée de 3 à 2 mana avec le patch 0.6.2 ([notes de patch](/fr/news/patch-0-6-2)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Deux : [Discard](/fr/decks/community/discard-8bff) et [Dracula SUPER FUN](/fr/decks/community/dracula-super-fun-d936).
- **Guide.** Pas encore : [envoyez-nous le vôtre](/fr/guides/submit).
- **Fiche.** [Dracula, carte Légendaire : statistiques et texte](/fr/cards/dracula).

## Mulan {#mulan}

**4 mana · 2/4 · unité · Good** · Saga : Ballade de Mulan

> Double attaque
>
> Quand une capacité À la révélation d'un allié se produit, répétez-la.

- **La légende.** La guerrière qui prend la place de son père dans l'armée, d'après une ballade chinoise du VIe siècle.
- **Patchs.** Patch 0.6.2 : statistiques inchangées, elle gagne Double attaque en plus de répéter les capacités À la révélation des alliés ([notes de patch](/fr/news/patch-0-6-2)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Un : [On Reveal Mid Range](/fr/decks/community/on-reveal-mid-range-772e).
- **Guide.** [Guide du deck de Mulan : On Reveal Mid Range](/fr/guides/on-reveal-midrange-guide).
- **Fiche.** [Mulan, carte Légendaire : statistiques et texte](/fr/cards/mulan).

## Queen of Hearts {#queen-of-hearts}

**4 mana · 3/3 · unité · Evil** · Saga : Pays des Merveilles

> Première frappe
>
> Quand une capacité À la mort d'un allié se produit, répétez-la.

- **La légende.** La souveraine furieuse du Pays des Merveilles, dont la réponse à tout est « Qu'on leur coupe la tête ! ».
- **Patchs.** Patch 0.6.2 : de 5 mana 3/5 à 4 mana 3/3, et elle gagne Première frappe en plus de répéter les capacités À la mort des alliés ([notes de patch](/fr/news/patch-0-6-2)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Deux : [Qoh](/fr/decks/community/qoh-f876) et [Just f\\*\\*\\*in em](/fr/decks/community/just-f-in-em-bdf2).
- **Guide.** Pas encore : [envoyez-nous le vôtre](/fr/guides/submit).
- **Fiche.** [Queen of Hearts, carte Légendaire : statistiques et texte](/fr/cards/queen-of-hearts).

## Van Helsing {#van-helsing}

**4 mana · 3/4 · unité · Good** · Saga : Horreur gothique

> Avant le combat, ajoutez Van Helsing's Tools à votre main s'il n'y est pas déjà.

- **La légende.** Abraham Van Helsing, le professeur néerlandais qui mène la chasse à Dracula.
- **Cartes créées.** [Van Helsing's Tools](/fr/cards/van-helsings-tools), qui vous fait choisir et jouer l'une de quatre cartes créées : [Holy Water](/fr/cards/holy-water), [Silver Bullet](/fr/cards/silver-bullet), [Garlic](/fr/cards/garlic) ou [Wooden Stake](/fr/cards/wooden-stake) (cartes créées : textes non vérifiés dans le jeu, et la fiche de Silver Bullet montre encore son texte d'avant le patch 0.6.2 ; les changements sont dans son historique d'équilibrage).
- **Patchs.** Van Helsing lui-même n'a pas changé. Avec le patch 0.6.2, Van Helsing's Tools est devenue gratuite (1 → 0 mana) et la Silver Bullet qu'elle crée est passée de 3 dégâts à 1 ([notes de patch](/fr/news/patch-0-6-2)) ; avec le patch de la démo du 21 septembre 2026, Silver Bullet peut aussi cibler les barrières, et Wooden Stake peut cibler des personnages à pleine Santé, mais échoue toujours si la cible n'est pas blessée quand elle se révèle ([notes de patch](/fr/news/demo-patch-notes-0921)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Trois : [Healing Healsing](/fr/decks/community/healing-healsing-9411), [Cure Control](/fr/decks/community/cure-control-b630) et [CONTROL](/fr/decks/community/control-2c2b).
- **Guides.** [Guide du deck de Van Helsing : Healing Healsing](/fr/guides/healing-healsing-guide) et [ses matchups](/fr/guides/healing-healsing-matchups).
- **Fiche.** [Van Helsing, carte Légendaire : statistiques et texte](/fr/cards/van-helsing).

## Wicked Stepmother {#wicked-stepmother}

**4 mana · 4/6 · unité · Evil** · Saga : Contes de fées

> Contact mortel
>
> À la révélation : Donne Contact mortel à vos personnages Mauvais.

- **La légende.** La belle-mère cruelle des contes de fées, de la maison de Cendrillon à la cour de Blanche-Neige.
- **Patchs.** Patch de la démo du 21 septembre 2026 : Puissance 3 → 4 ([notes de patch](/fr/news/demo-patch-notes-0921)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Aucun des 20 publiés jusqu'ici : construisez-en un dans le [deck builder](/fr/deck-builder) et publiez-le avec un guide.
- **Guide.** Pas encore : [envoyez-nous le vôtre](/fr/guides/submit).
- **Fiche.** [Wicked Stepmother, carte Légendaire : statistiques et texte](/fr/cards/wicked-stepmother).

## Merlin {#merlin}

**5 mana · 5/5 · unité · Neutral** · Saga : Légende arthurienne

> Répétez le premier sort que vous jouez chaque manche.

- **La légende.** Le magicien derrière la naissance d'Arthur et son accession au trône, de Geoffroy de Monmouth à Malory.
- **Patchs.** Patch 0.6.3 : de 3/5 à 5/5, +2 Puissance ([notes de patch](/fr/news/patch-0-6-3)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Un : [Spellcast](/fr/decks/community/spellcast-250f).
- **Guide.** Pas encore : [envoyez-nous le vôtre](/fr/guides/submit).
- **Fiche.** [Merlin, carte Légendaire : statistiques et texte](/fr/cards/merlin).

## King Arthur {#king-arthur}

**7 mana · 7/7 · unité · Good** · Saga : Légende arthurienne

> Bouclier
>
> À la révélation : Donne Bouclier à vos personnages Bons.

- **La légende.** Le roi passé et futur de Bretagne, qui tira l'épée du rocher et réunit la Table ronde.
- **Patchs.** Patch 0.6.3 : de 5/5 à 7/7 ([notes de patch](/fr/news/patch-0-6-3)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Deux : [King of Value Trade](/fr/decks/community/king-of-value-trade-fd14) et [Glinda Reborn](/fr/decks/community/glinda-reborn-2d6d).
- **Guide.** [Guide du deck de King Arthur : King of Value Trade](/fr/guides/king-of-value-trade-guide).
- **Fiche.** [King Arthur, carte Légendaire : statistiques et texte](/fr/cards/king-arthur).

## Legion of the Dead {#legion-of-the-dead}

**7 mana · sort · Neutral** · Saga : Horreur gothique

> Remplissez votre plateau de Zombies [2⚔️/2❤️].

- **Le seul sort Légendaire** de la Demo 2.0.
- **La légende.** Une armée de morts relevés, le dernier argument du nécromancien.
- **Cartes créées.** [Zombie](/fr/cards/zombie), des cartes créées 2/2, autant qu'il en faut pour remplir votre plateau.
- **Patchs.** Aucun changement.
- **Decks sur OriginsMeta au 25 septembre 2026.** Deux : [The Trick-or-Treat Legion](/fr/decks/community/the-trick-or-treat-legion-72c4) et [FACE IS THE PLACE](/fr/decks/community/face-is-the-place-b049).
- **Guide.** [Guide du deck de Legion of the Dead](/fr/guides/trick-or-treat-legion-guide).
- **Fiche.** [Legion of the Dead, carte Légendaire : statistiques et texte](/fr/cards/legion-of-the-dead).

## Three Not So Little Pigs {#three-not-so-little-pigs}

**7 mana · 3/3 · unité · Neutral** · Saga : Contes de fées

> Piétinement
>
> À la révélation : Invoquez un Not So Little Pig [3⚔️/3❤️] avec Piétinement sur une case aléatoire de chaque autre lieu.

- **La légende.** Les trois cochons de paille, de bois et de briques, devenus grands et plus si faciles à renverser d'un souffle.
- **Cartes créées.** [Not So Little Pig](/fr/cards/not-so-little-pig), un 3/3 avec Piétinement, un dans chacun des deux autres lieux.
- **Patchs.** Patch 0.6.2 : de 4/4 à 3/3, et les cochons que la carte invoque sont devenus 3/3 eux aussi ([notes de patch](/fr/news/patch-0-6-2)).
- **Decks sur OriginsMeta au 25 septembre 2026.** Quatre : [3 Pigs Mid Range](/fr/decks/community/3-pigs-mid-range-6311), [Value Board](/fr/decks/community/value-board-c44a), [VALUE MAXXING](/fr/decks/community/value-maxxing-739d) et [AGGRO /MIDRANGE PIGS GM](/fr/decks/community/aggro-midrange-pigs-gm-6931).
- **Guides.** [Guide du deck de Three Not So Little Pigs](/fr/guides/three-pigs-midrange-guide) et [ses matchups](/fr/guides/three-pigs-midrange-matchups).
- **Fiche.** [Three Not So Little Pigs, carte Légendaire : statistiques et texte](/fr/cards/three-not-so-little-pigs).

## Robin Hood {#robin-hood}

**8 mana · 4/4 · unité · Good** · Saga : Sherwood

> Tir de précision 3
>
> À la révélation : Inflige 2 dégâts à tous les ennemis.

- **La seule Légendaire à 8 mana** de la Demo 2.0.
- **La légende.** L'archer hors-la-loi de la forêt de Sherwood qui vole aux riches pour nourrir les pauvres, chanté dans les ballades depuis le XIVe siècle.
- **Patchs.** Aucun changement.
- **Decks sur OriginsMeta au 25 septembre 2026.** Un : [Buff](/fr/decks/community/buff-6f60).
- **Guide.** Pas encore : [envoyez-nous le vôtre](/fr/guides/submit).
- **Fiche.** [Robin Hood, carte Légendaire : statistiques et texte](/fr/cards/robin-hood).

## Les Légendaires qui ne sont pas dans la Demo 2.0 {#hors-de-la-demo}

Notre base de données conserve aussi neuf Légendaires qui ne sont pas dans la Demo 2.0 : [Alice](/fr/cards/alice), [Beowulf](/fr/cards/beowulf), [Cinderella](/fr/cards/cinderella), [Death](/fr/cards/death), [Dr. Frank](/fr/cards/dr-frank), [Mirror Mirror](/fr/cards/mirror-mirror), [Red](/fr/cards/red), [Winnie-the-Pooh](/fr/cards/winnie-the-pooh) et [Wizard of Oz](/fr/cards/wizard-of-oz). Leurs fiches gardent les dernières données connues, non vérifiées dans le jeu. Dans ses AMA, l'équipe a décrit un lancement complet avec la liste entière des cartes Légendaires : les dates que nous connaissons sont dans la [roadmap](/fr/guides/roadmap-and-dates).

## D'où viennent les chiffres {#sources}

- **Cartes :** la [base de données des cartes](/fr/cards) d'OriginsMeta : coûts, statistiques et textes anglais des cartes de la démo vérifiés un par un dans le jeu le 22 septembre 2026, textes italiens et espagnols lus dans le jeu le 25 septembre 2026 ; les textes français sont une traduction d'OriginsMeta, pas encore vérifiée dans le jeu.
- **Patchs :** les notes de patch officielles sur Steam, carte par carte dans [MetaShifting](/fr/metashifting).
- **Decks :** les 20 decks publiés sur OriginsMeta du 15 septembre à 20:00 CEST le 25 septembre 2026 ([tous les decks d'Origins TCG](/fr/decks)) ; le décompte suivant est sur [Les plus jouées](/fr/tier-list/most-played).

Nous mettrons ce guide à jour chaque fois qu'un patch changera une Légendaire ou que la démo en ajoutera une nouvelle.
`,
  },
  "origins-tcg-ranked": {
    title: "Le mode classé d'Origins TCG : ce que nous savons de la ladder avant le Steam Next Fest",
    metaTitle: "Mode classé d'Origins TCG : date, Grandmaster, VP",
    excerpt: "Le mode classé arrive dans la démo d'Origins TCG avec le Steam Next Fest, le 19 octobre 2026. Confirmé par Koin : divisions, Grandmaster, VP et récompenses.",
    faq: [
      {
        q: "À quelle heure le mode classé ouvre-t-il le 19 octobre ?",
        a: "Le post Steam de Koin Games du 21 septembre 2026 dit seulement « avec le début du Steam Next Fest », sans heure. Le festival ouvre le lundi 19 octobre 2026 à 10:00, heure du Pacifique : 13:00 heure de l'Est, 18:00 au Royaume-Uni, 19:00 en Europe centrale.",
      },
      {
        q: "Quel est le rang le plus élevé d'Origins TCG ?",
        a: "Grandmaster, la division la plus haute de la ladder du playtest fermé, qui a un classement mondial (notes de patch officielles 0.6.1 et 0.6.3, août 2026).",
      },
      {
        q: "Quelles sont les récompenses du mode classé ?",
        a: "Koin Games a seulement dit que le mode classé de la démo arrive avec des récompenses classées exclusives ; au 25 septembre 2026, les détails n'avaient pas été annoncés.",
      },
      {
        q: "Peut-on jouer en classé avant le Steam Next Fest ?",
        a: "Seulement dans le playtest fermé, où le mode classé est actif depuis le patch 0.6.1 du 14 août 2026 ; les instructions pour accéder au playtest sont sur le Discord officiel.",
      },
    ],
    body: `
## En bref {#en-bref}

- Le mode classé s'active dans la démo gratuite **avec le début du Steam Next Fest**, le lundi 19 octobre 2026, « avec des récompenses classées exclusives » (post Steam de Koin Games du 21 septembre 2026).
- Ce n'est pas une nouveauté : le playtest fermé a une ladder classée depuis le patch 0.6.1 du 14 août 2026, et le 24 septembre elle y était encore active.
- Ce que confirment les notes de patch officielles : des divisions, une division supérieure appelée **Grandmaster** avec un classement mondial, et des **Points de Victoire** (VP) gagnés et perdus dans les parties classées : les notes parlent d'une variation de +10 et −10, et depuis le patch 0.6.2 les parties en salon ne rapportent plus de VP.
- Ce que Koin n'a pas encore dit : la liste complète des divisions, si les +10/−10 VP du playtest restent les mêmes dans chaque division et dans la démo, les saisons et les remises à zéro, en quoi consistent les récompenses.

Nous mettrons ce guide à jour quand le mode classé ouvrira dans la démo.

## Quand le mode classé ouvre {#quand}

Le 21 septembre 2026, dans le post sur la [première grande mise à jour de la démo](https://store.steampowered.com/news/app/4429430/view/1844115010502611), Koin Games a écrit qu'il allait « activer le mode classé avec le début du Steam Next Fest, qui arrivera avec des récompenses classées exclusives ». Le [Steam Next Fest](https://store.steampowered.com/sale/nextfest) va du lundi 19 octobre 2026 à 10:00, heure du Pacifique (13:00 heure de l'Est, 18:00 au Royaume-Uni, 19:00 en Europe centrale), au lundi 26 octobre. Le post ne donne pas d'heure exacte pour le mode classé : « avec le début » du festival, c'est tout ce qu'il dit.

Le 24 septembre, l'annonce de la Crimson Cup sur le Discord officiel l'a répété : la démo, qui a la liste de cartes du tournoi, active le mode classé pour le Steam Next Fest, avec de nouvelles récompenses classées ([notre article](/fr/news/crimson-cup-format-check-in#demo-playtest)). Tout le reste sur le festival est dans notre [guide du Steam Next Fest](/fr/guides/steam-next-fest-2026).

## Ce que nous apprend la ladder du playtest {#ladder-du-playtest}

Le mode classé est actif dans le playtest fermé depuis la mi-août, et trois notes de patch officielles le décrivent :

- **Patch 0.6.1, 14 août 2026.** La ladder classée est la grande nouveauté de la mise à jour, et « la division Grandmaster a un classement mondial » ([notes de patch](https://store.steampowered.com/news/app/4429430/view/1840944183780414)). Un bug connu de cette build : l'affichage des VP (Points de Victoire) se dérèglait dès qu'un joueur atteignait Grandmaster.
- **Patch 0.6.2, 21 août 2026.** La Grandmaster League affiche désormais le rang, les VP et la division corrects de chaque joueur, et les parties en salon ne rapportent plus de VP. Deux bugs connus de cette build : les VP étaient bien gagnés et perdus, mais le +10 et le −10 affichés pendant que le total change avaient temporairement disparu, et à la fin d'une partie en Grandmaster la variation des VP ne s'affichait pas, alors que les points changeaient ([notes de patch](https://store.steampowered.com/news/app/4429430/view/1841579228669961)).
- **Patch 0.6.3, 27 août 2026.** Dans la division supérieure, l'écran de résultats montrait des valeurs de remplissage au lieu de celles du joueur ; désormais la division, le total de VP et la variation de VP s'affichent correctement, le +10 et le −10 ne se superposent plus au total de VP pendant qu'il change, et le résultat, les Points de Victoire et le rang devraient toujours apparaître à la fin d'une partie ([notes de patch](https://store.steampowered.com/news/app/4429430/view/1842212951301184)).

Mis bout à bout : la ladder est faite de divisions, **Grandmaster est la plus haute** (le patch 0.6.3 l'appelle « la division supérieure ») et a un classement mondial avec un rang pour chaque joueur, et les parties classées font bouger vos Points de Victoire, avec une variation de +10 ou −10 dans les notes du playtest (les parties en salon non, depuis la 0.6.2). Les notes citent « Diamond IV » seulement comme l'une des valeurs de remplissage affichées par erreur : elles ne listent pas les divisions sous Grandmaster. Notre résumé du premier patch du mode classé est dans [patch 0.6.1 : ladder classée et Grandmaster](/fr/news/patch-0-6-1-ranked).

## Mode classé et déblocage des decks {#deblocages}

Dans le playtest fermé, d'après des joueurs sur le forum Steam le 14 septembre 2026, un deck se débloquait après trois victoires en classé plus une victoire contre un boss IA ; un développeur a répondu que l'équipe envisageait de rendre ces parties de déblocage uniquement PvE ([notre article](/fr/news/playtest-feedback-deck-unlock)). Avec la mise à jour de la démo du 21 septembre, Koin a confirmé que chacun conserve la progression de la démo ou du playtest, la plus avancée des deux ([notre article](/fr/news/demo-first-big-update#progression)).

## Où jouer avant le festival {#avant-le-festival}

- **La démo** est gratuite sur [Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) et a la liste de cartes de la Crimson Cup ; le mode classé y arrive avec le festival.
- **Le playtest fermé** a déjà le mode classé. Le post Steam de Koin du 25 août 2026 renvoie au [Discord officiel](https://discord.gg/originstcg) pour les instructions d'accès, et le 24 septembre l'équipe a dit que le playtest recevra des mises à jour que la build du tournoi n'aura pas.
- Pour préparer des decks : le [deck builder](/fr/deck-builder) et [tous les decks d'Origins TCG](/fr/decks) publiés par la communauté, chacun avec le code du jeu (KGBLDC…) à coller dans Origins. Les [11 Légendaires](/fr/guides/origins-tcg-legendaries) qui les mènent sont décrites une par une dans notre guide.
- Si vous préparez la Crimson Cup, qui se joue avec trois decks en Conquest : [comment construire les trois decks](/fr/guides/origins-tcg-conquest).

## Ce qu'OriginsMeta fera du mode classé {#originsmeta}

Notre plan au 25 septembre 2026 : la première [tier list](/fr/tier-list) d'OriginsMeta après les finales de la Crimson Cup du 25 octobre, construite sur les résultats du tournoi et sur le sommet de la ladder classée. Jusque-là, la page de la tier list montre les decks de la communauté les mieux notés et les cartes les plus jouées, présentés comme des aperçus.

## Ce que nous ne savons pas encore {#inconnues}

- En quoi consistent les « récompenses classées exclusives » et comment on les obtient.
- Combien il y a de divisions, et leurs noms sous Grandmaster.
- Si une victoire et une défaite valent toujours +10 et −10 VP, comme dans les notes du playtest, dans chaque division et dans la démo.
- Si le mode classé a des saisons ou des remises à zéro, et s'il reste actif dans la démo après la fin du festival, le 26 octobre.
- Si la progression en classé est reportée dans le jeu complet.

## Sources {#sources}

Les posts officiels de Koin Games sur Steam : [patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414) (14 août 2026), [patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) (21 août), [patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) (27 août), [Big Bob's Playtest Battle](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (25 août) et la [première grande mise à jour de la démo](https://store.steampowered.com/news/app/4429430/view/1844115010502611) (21 septembre) ; l'annonce de la Crimson Cup sur le Discord officiel (24 septembre). Tous lus le 25 septembre 2026.
`,
  },
  "origins-tcg-conquest": {
    title: "Le Conquest dans Origins TCG : comment construire trois decks qui respectent la règle des cartes uniques",
    metaTitle: "Conquest dans Origins TCG : construire vos trois decks",
    excerpt: "Construire une formation Conquest pour Origins TCG : comptage des cartes uniques, contrôle du deck builder et decks de la communauté qui respectent la règle.",
    faq: [
      {
        q: "Comment compte-t-on les cartes que deux decks Conquest ont en commun ?",
        a: "On prend les 13 cartes différentes de chaque deck, la Légendaire et les douze cartes de base, chacune comptée une fois quel que soit son nombre d'exemplaires : les cartes uniques entre les deux decks sont 13 moins les cartes en commun. Avec un minimum de 8 cartes uniques, deux decks peuvent en partager au plus 5. C'est la lecture d'OriginsMeta, puisque Koin Games n'a pas précisé comment se fait le décompte ; la règle elle-même est dans notre article sur les règles de la Crimson Cup.",
      },
      {
        q: "Deux de mes decks Conquest peuvent-ils avoir la même Légendaire ?",
        a: "À Big Bob's Playtest Battle, en août, non : chaque deck devait avoir une Légendaire différente. Pour la Crimson Cup, les annonces du 9 et du 24 septembre 2026 ne le précisent pas ; comme dans le ban on ne voit que la Légendaire, notre deck builder signale deux decks avec la même.",
      },
      {
        q: "Les deux exemplaires d'une carte comptent-ils comme deux cartes ?",
        a: "Pas dans la lecture d'OriginsMeta : une carte compte une fois quel que soit son nombre d'exemplaires, donc chaque deck a 13 cartes à comparer, la Légendaire et les douze cartes de base.",
      },
      {
        q: "Comment vérifier mes trois decks ?",
        a: "Dans le deck builder d'OriginsMeta, en mode Tournoi (3 decks) : le contrôle Conquest compte les cartes uniques entre chaque paire de decks, liste celles en commun et signale deux decks avec la même Légendaire.",
      },
    ],
    body: `
## En bref {#en-bref}

- **Conquest** veut dire apporter plus d'un deck, assez différents les uns des autres, et bannir un deck de votre adversaire (Koin Games, 25 août 2026) ; à Big Bob's Playtest Battle, chaque deck devait aussi avoir une Légendaire différente.
- À la **Crimson Cup** (19–25 octobre 2026), vous apportez trois decks avec au moins 8 cartes uniques entre chaque paire. Règles, dates, prix et check-in sont dans [notre article sur les règles de la Crimson Cup](/fr/news/crimson-cup-format-check-in) : ce guide explique comment construire les trois decks.
- Koin n'a pas précisé comment les cartes uniques sont comptées. OriginsMeta compte chaque carte une fois, quel que soit son nombre d'exemplaires, Légendaire comprise : deux decks peuvent alors partager au plus 5 cartes.
- Le [deck builder](/fr/deck-builder) vérifie tout cela dans son mode « Tournoi (3 decks) ».
- Parmi les 20 decks publiés sur OriginsMeta à 20:00 CEST le 25 septembre 2026, 174 des 176 paires avec des Légendaires différentes respectent la règle ; les deux qui échouent, toutes deux avec Buff, la manquent d'une carte.

## Ce que demande le Conquest {#le-format}

Koin Games a utilisé le Conquest pour la première fois à [Big Bob's Playtest Battle](/fr/news/big-bobs-playtest-battle) le 28 août 2026. L'[annonce sur Steam](https://store.steampowered.com/news/app/4429430/view/1841579228677617) du 25 août le décrit ainsi : « vous devez soumettre plusieurs decks avant le début du tournoi, qui doivent être différents les uns des autres, et vous avez la possibilité de bannir un deck de votre adversaire ». Cette fois-là, chaque deck devait avoir une Légendaire différente et au moins neuf cartes de différence.

Pour la Crimson Cup, les annonces du 9 et du 24 septembre 2026 fixent ces règles :

- **trois decks** ; les annonces ne disent pas si les Légendaires doivent être différentes (à Big Bob's elles devaient l'être, et dans le ban on ne voit que la Légendaire) ;
- **au moins 8 cartes uniques** entre chaque paire de decks ;
- listes cachées jusqu'au top 4 : quand vous bannissez un deck de votre adversaire, vous n'en voyez que la Légendaire ;
- matchs au meilleur des trois manches et grande finale au meilleur des cinq ; au meilleur des cinq, pas de ban, et il faut gagner avec les trois decks.

Le tournoi se joue sur la démo principale, avec sa liste de cartes. Le 29 septembre 2026 est arrivé le [patch 0.7](/fr/news/patch-0-7), que l'équipe appelle le dernier patch d'équilibrage avant le tournoi : Bagheera, Mind Palace et Spellbook coûtent désormais un de plus et Twister Toss a eu un rework, donc une formation construite avant mérite d'être revérifiée.

## Comment on compte les cartes uniques {#comptage}

Chaque deck a **13 cartes différentes** : la Légendaire et douze cartes de base, dont le jeu ajoute lui-même le second exemplaire (25 cartes en jeu). L'annonce de la Crimson Cup ne dit pas comment les 8 cartes uniques sont comptées. Voici la lecture d'OriginsMeta, celle qu'appliquent notre deck builder et nos tournois :

1. chaque carte compte **une fois**, quel que soit son nombre d'exemplaires ;
2. **la Légendaire compte aussi** : deux Légendaires différentes font toujours une carte de différence ;
3. les cartes uniques entre le deck A et le deck B sont les cartes de A que B n'a pas : **13 moins les cartes en commun**.

Donc « au moins 8 cartes uniques » veut dire **au plus 5 cartes en commun** entre deux quelconques de vos decks.

**Une paire juste à la limite.** [3 Pigs Mid Range](/fr/decks/community/3-pigs-mid-range-6311) (Three Not So Little Pigs) et [On Reveal Mid Range](/fr/decks/community/on-reveal-mid-range-772e) (Mulan) partagent cinq cartes : En Passant, Ali Baba, Bagheera, Frog Prince et Ellen Trechend. En jeu, ce sont dix des 25 cartes de chaque deck, mais elles comptent pour cinq : 13 − 5 = **8 cartes uniques**, exactement le minimum. Une carte de plus en commun et la paire ne passerait plus.

**Une paire à une carte près.** [Buff](/fr/decks/community/buff-6f60) (Robin Hood) et [FACE IS THE PLACE](/fr/decks/community/face-is-the-place-b049) (Legion of the Dead) partagent six cartes : Musketeer, Defense Matrix, Bagheera, Three Blind Mice, Glinda et Galahad. 13 − 6 = **7** : pour les apporter ensemble, l'une des six doit sortir de l'un des deux decks.

Si Koin compte autrement, par exemple exemplaire par exemplaire, les chiffres changent : nous mettrons ce guide et le deck builder à jour dès que la règle sera précisée.

## Construire les trois decks dans le deck builder {#deck-builder}

1. Ouvrez le [deck builder](/fr/deck-builder) et passez de « Deck unique » à **« Tournoi (3 decks) »**.
2. Les decks A, B et C ont chacun leur onglet. Construisez-les à partir du pool de cartes, ou collez un code du jeu (KGBLDC…) dans **Importer** : l'import ne change que le deck sur lequel vous êtes.
3. Sur la page de n'importe quel deck de la communauté, **« Ouvrir dans le deck builder »** charge cette liste dans le deck actif et laisse les deux autres tels quels : un moyen rapide d'essayer des paires de decks publiés.
4. L'encadré **« Contrôle Conquest »** montre, pour chaque paire, combien de cartes uniques diffèrent : en vert avec ✓ à partir du minimum, en rouge avec ✗ en dessous. Survoler un chiffre liste les cartes en commun. Le minimum est 8, la valeur de la Crimson Cup, et vous pouvez le changer (Big Bob's Playtest Battle en demandait 9). Le contrôle signale aussi deux decks avec la même Légendaire.
5. Quand les trois decks sont légaux et assez éloignés, l'encadré dit **OK ✓**. Copiez chaque deck avec « Copier le code du jeu » et collez-le dans Origins.

Le deck builder enregistre les trois decks dans votre navigateur au fil du travail. Les [tournois](/fr/tournaments) créés sur OriginsMeta peuvent aussi utiliser le Conquest, avec 2 à 4 decks par joueur et un minimum choisi par l'organisateur, et le deck builder de chaque tournoi applique ces règles. Les Légendaires parmi lesquelles choisir sont toutes dans [notre guide des 11 Légendaires](/fr/guides/origins-tcg-legendaries).

La Crimson Cup est le tournoi du Steam Next Fest, et le mode classé ouvre dans la démo avec le même festival : tout sur le festival est dans notre [guide du Steam Next Fest](/fr/guides/steam-next-fest-2026), et [ce qui est confirmé sur le mode classé](/fr/guides/origins-tcg-ranked) dans son propre guide.

## Des decks de la communauté qui respectent la règle, et deux qui ne la respectent pas {#paires-de-la-communaute}

À 20:00 CEST le 25 septembre 2026, OriginsMeta compte 20 decks publiés, menés par 10 Légendaires différentes. Cela fait 190 paires possibles :

- 14 paires partagent la Légendaire : le deck builder les signale, et à Big Bob's Playtest Battle elles n'auraient pas pu entrer dans la même formation. Ce sont souvent des versions d'une même liste, comme [Healing Healsing](/fr/decks/community/healing-healsing-9411), [Cure Control](/fr/decks/community/cure-control-b630) et [CONTROL](/fr/decks/community/control-2c2b), trois decks de Van Helsing qui partagent 12 de leurs 13 cartes ;
- sur les 176 autres, **174 respectent** la règle des 8 cartes, et 30 d'entre elles ne partagent aucune carte ;
- deux échouent, toutes deux à 7 et toutes deux avec Buff : Buff et FACE IS THE PLACE, vus plus haut, et Buff et [AGGRO /MIDRANGE PIGS GM](/fr/decks/community/aggro-midrange-pigs-gm-6931) (Three Not So Little Pigs), qui partagent Bagheera, Mind Palace, Three Blind Mice, Beast, Glinda et Galahad.

Quelques paires avec leurs chiffres réels :

| Paire | Légendaires | Cartes en commun | Cartes uniques de différence | 8 ou plus ? |
| --- | --- | --- | --- | --- |
| [Dracula SUPER FUN](/fr/decks/community/dracula-super-fun-d936) + [Qoh](/fr/decks/community/qoh-f876) | Dracula, Queen of Hearts | aucune | 13 | oui |
| [3 Pigs Mid Range](/fr/decks/community/3-pigs-mid-range-6311) + [Healing Healsing](/fr/decks/community/healing-healsing-9411) | Three Not So Little Pigs, Van Helsing | 1 : Ali Baba | 12 | oui |
| [Dorothy Combo](/fr/decks/community/dorothy-combo-7503) + [On Reveal Mid Range](/fr/decks/community/on-reveal-mid-range-772e) | Dorothy, Mulan | 1 : En Passant | 12 | oui |
| [Spellcast](/fr/decks/community/spellcast-250f) + [The Trick-or-Treat Legion](/fr/decks/community/the-trick-or-treat-legion-72c4) | Merlin, Legion of the Dead | 2 : Golden Egg, Impundulu | 11 | oui |
| [King of Value Trade](/fr/decks/community/king-of-value-trade-fd14) + [Healing Healsing](/fr/decks/community/healing-healsing-9411) | King Arthur, Van Helsing | 4 : Shahrazad, Ali Baba, Boitata, Spellbook | 9 | oui |
| [Qoh](/fr/decks/community/qoh-f876) + [Value Board](/fr/decks/community/value-board-c44a) | Queen of Hearts, Three Not So Little Pigs | 5 : Bagheera, Baby Bear, Mind Palace, Ellen Trechend, Cockatrice | 8 | oui, à la limite |
| [Buff](/fr/decks/community/buff-6f60) + [FACE IS THE PLACE](/fr/decks/community/face-is-the-place-b049) | Robin Hood, Legion of the Dead | 6 | 7 | non |

Neuf paires sont exactement à 8 :

- [3 Pigs Mid Range](/fr/decks/community/3-pigs-mid-range-6311) + [On Reveal Mid Range](/fr/decks/community/on-reveal-mid-range-772e)
- [AGGRO /MIDRANGE PIGS GM](/fr/decks/community/aggro-midrange-pigs-gm-6931) + [FACE IS THE PLACE](/fr/decks/community/face-is-the-place-b049)
- [CONTROL](/fr/decks/community/control-2c2b) + [Spellcast](/fr/decks/community/spellcast-250f)
- [Cure Control](/fr/decks/community/cure-control-b630) + [Glinda Reborn](/fr/decks/community/glinda-reborn-2d6d)
- [Cure Control](/fr/decks/community/cure-control-b630) + [Spellcast](/fr/decks/community/spellcast-250f)
- [FACE IS THE PLACE](/fr/decks/community/face-is-the-place-b049) + [Glinda Reborn](/fr/decks/community/glinda-reborn-2d6d)
- [Healing Healsing](/fr/decks/community/healing-healsing-9411) + [Spellcast](/fr/decks/community/spellcast-250f)
- [Qoh](/fr/decks/community/qoh-f876) + [Value Board](/fr/decks/community/value-board-c44a)
- [Qoh](/fr/decks/community/qoh-f876) + [VALUE MAXXING](/fr/decks/community/value-maxxing-739d)

Sur les 1 140 trios possibles de decks publiés, 867 ont trois Légendaires différentes et respectent la règle sur les trois paires.

Ce sont des décomptes, pas des conseils : ils disent quels decks peuvent aller ensemble selon la règle, pas quelle formation gagne. Comment se joue chaque deck, c'est écrit sur sa page, dans le guide de son auteur.

## Ce que nous ne savons pas encore {#inconnues}

- Comment Koin compte les 8 cartes uniques : l'annonce du 24 septembre ne le dit pas.
- Si les trois decks de la Crimson Cup doivent avoir des Légendaires différentes : les annonces ne le disent pas.
- La liste de cartes définitive : la liste provisoire est dans le jeu depuis le 21 septembre. Le patch 0.7 du 29 septembre est, selon les mots de l'équipe, le dernier patch d'équilibrage avant le tournoi, mais ses notes ne disent pas si la liste de cartes est définitive.

## Sources {#sources}

Les posts de Koin Games sur Steam du [25 août](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (Big Bob's Playtest Battle), du [9 septembre 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278) (le tournoi du Steam Next Fest) et du [29 septembre 2026](https://store.steampowered.com/news/app/4429430/view/1844751498235283) (le patch 0.7), l'annonce de la Crimson Cup sur le Discord officiel (24 septembre) et les decks publiés sur OriginsMeta à 20:00 CEST le 25 septembre 2026, comptés avec la même fonction que celle du deck builder.
`,
  },
  "origins-tcg-locations": {
    title: "Les lieux d'Origins TCG : comment les trois lignes changent chaque partie",
    metaTitle: "Les lieux d'Origins TCG expliqués",
    excerpt: "Les lieux sont le troisième joueur à la table : dégâts doublés, coûts changés, personnages déplacés. Lesquels décident des parties, comment construire avec.",
    faq: [
      {
        q: "Combien y a-t-il de lieux dans Origins TCG ?",
        a: "La Demo 2.0 en fait tourner 44. La page Steam officielle dit que le jeu complet puise dans une réserve de plus de cent lieux.",
      },
      {
        q: "Quand voit-on les lieux d'une partie ?",
        a: "Un par manche pendant les trois premières manches : le premier est connu dès le début, le deuxième arrive à la deuxième manche et le troisième à la troisième. À partir de la quatrième manche, vous jouez avec tout le plateau en vue.",
      },
      {
        q: "Un lieu agit-il pour les deux joueurs ?",
        a: "Oui. Un lieu est une règle de cette ligne, pas un bonus pour celui qui y arrive le premier : Amplifying Amphitheatre double vos dégâts et les siens.",
      },
      {
        q: "Où puis-je voir la liste complète ?",
        a: "Sur la page des lieux d'OriginsMeta, avec la recherche, des filtres par type d'effet et des liens vers les cartes que certains d'entre eux invoquent.",
      },
    ],
    body: `
## Pourquoi les lieux comptent plus qu'il n'y paraît

Origins TCG se joue sur **trois lieux**, et chacun porte une règle qui s'applique à cette ligne pendant toute la partie. C'est la partie du jeu qu'une liste de deck ne peut pas contrôler : deux joueurs peuvent s'asseoir avec les mêmes vingt-cinq cartes et vivre deux parties complètement différentes, parce qu'un plateau double les dégâts et que l'autre fait tout coûter un de moins.

La Demo 2.0 fait tourner **44 lieux**. La [page Steam officielle](https://store.steampowered.com/app/4429430/Origins_TCG/) dit que le jeu complet puisera « from a pool of 100+ rotating locations that reshape the board and demand a unique strategy ». La liste complète avec chaque effet est sur la [page des lieux](/fr/locations), avec recherche et filtres ; ce guide explique quoi en faire.

## Comment ils arrivent

Les trois lieux se révèlent **un par manche pendant les trois premières manches**. Le premier est sur la table dès le début, le deuxième apparaît à la deuxième manche, le troisième à la troisième. À partir de la quatrième manche, plus rien n'est caché et vous jouez sur un plateau que vous voyez en entier.

Ce calendrier est la raison pour laquelle les premières manches ne sont pas qu'une question de courbe : à la première manche, vous engagez des cartes dans une ligne dont vous ne connaissez pas encore les deux voisines. Garder un personnage une manche pour voir où il va vaut souvent plus que le jouer sur la courbe dans la mauvaise ligne.

## À quelle fréquence ils apparaissent

Depuis le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026, chaque lieu a une rareté : commun, rare, très rare ou ultra rare. La rareté décide de la fréquence à laquelle un lieu apparaît. L'équipe le dit ainsi : attendez-vous aux lieux familiers dans la plupart des parties, et à quelques-uns que vous ne verrez que « tous les trente-six du mois ». Les notes de patch ne disent pas quel lieu a quelle rareté : nous l'ajouterons à la [page des lieux](/fr/locations) dès que nous la connaîtrons.

## Les familles d'effets

Dans notre liste, les lieux sont groupés d'après ce qu'ils font à la partie, et les groupes valent la peine d'être connus parce qu'ils demandent des réponses différentes.

- **Dégâts.** Amplifying Amphitheatre y double tous les dégâts, Burnturn Arena entame chaque personnage après le combat, Soul Artillery frappe les deux barrières chaque fois que quelque chose meurt. Les petits corps cessent d'être en sécurité.
- **Mana et coûts.** Gold Spinning Wheel retire un à tout, Castle in the Clouds seulement aux cartes qui coûtent sept ou plus, Treasurer's Office ajoute un, Mana Battery vous laisse garder ce que vous n'avez pas dépensé. Ce sont eux qui décident qui prend l'avantage au tempo.
- **Pioche et défausse.** The Sultan's Court donne chaque manche une carte qu'il faut dépenser, Knowledge Vault récompense celui qui remplit la ligne le premier, Junkyard en retire une aux deux joueurs, Nostradamus' Call détruit les deux decks au début de la sixième manche.
- **Déplacement.** Conveyor Belt fait glisser tout le monde vers la droite après le combat, Ballroom renvoie un personnage aléatoire dans la main, Open Meadow accorde Déplacer (Move).
- **Invocations et copies.** Cloning Lab remplit vos cases de copies de ce que vous venez de jouer, Reflecting Pool le copie dans un autre lieu, Sherwood Forest produit sans arrêt des [Merry Man](/fr/cards/merry-man), Hundred Acre Woods met un [Christopher Robin](/fr/cards/christopher-robin) des deux côtés.
- **Mots-clés accordés.** Stomping Grounds donne Piétinement (Trample), The Colosseum Double attaque (Double Attack), Windmill Ridge Défenseur (Defender), Poison Grounds donne Contact mortel (Deathtouch) aux personnages Evil, Blessed Grounds donne Bouclier (Shield) aux personnages Good.
- **Capacités.** Mirror Dimension répète les capacités À la révélation (On Reveal), Burial Grounds répète les capacités À la mort (On Death), Anti-Magic Vault retire entièrement les capacités, Wonderland inverse l'ordre d'attaque.
- **Destruction et barrières.** The Gallows détruit l'ennemi en face de tout ce qui y arrive, The Hill tue après le combat tout ce qui est à égalité à la Puissance la plus basse, Wall of Dumpty avale le premier personnage que vous jouez, Broken Gate fait revenir les barrières avec 10 de Santé au lieu de 40.

## Les lieux qui décident des parties

Quelques-uns valent la peine d'être reconnus dès qu'ils apparaissent, parce qu'ils changent ce que vous devez faire de votre main.

- **Cloning Lab.** Tout ce que vous y jouez est copié dans vos cases libres de cette ligne. Un corps bon marché avec une bonne capacité À la révélation devient trois, et la ligne se décide en un tour.
- **Mirror Dimension.** Chaque capacité À la révélation se produit deux fois. Il fait pour une ligne entière ce que [Mulan](/fr/cards/mulan) fait pour un deck, et il se cumule avec elle.
- **The Gallows.** Tout ce qui y entre en jeu détruit l'ennemi en face. Il transforme votre personnage le moins cher en élimination, et il punit celui qui s'engage le premier.
- **Anti-Magic Vault.** Les personnages perdent toutes leurs capacités. Un deck bâti sur les déclencheurs n'a rien à y faire ; un deck de simples corps s'y retrouve soudain chez lui.
- **Amplifying Amphitheatre.** Tous les dégâts doublés, dans les deux sens. Un finisseur avec Piétinement comme [Ellen Trechend](/fr/cards/ellen-trechend) termine la partie à travers la barrière ; le leur aussi.
- **Nostradamus' Call.** Les deux decks sont détruits au début de la sixième manche. Quel que soit votre plan, il doit être bouclé à la cinquième.

## Construire en pensant aux lieux

Vous ne pouvez pas choisir le plateau, mais vous pouvez construire un deck qui y est rarement désarmé.

1. **Ne misez pas tout sur un seul déclencheur.** Un deck qui ne fonctionne que par les capacités À la révélation est un deck qui perd une ligne face à Anti-Magic Vault. Gardez quelques cartes qui sont bonnes comme simples corps.
2. **Gardez une carte de portée.** Les lieux qui frappent les barrières (Overloaded Circuit, "Human" Cannon, Soul Artillery) récompensent les decks capables de finir une ligne à distance au lieu de l'user à la longue.
3. **Les personnages bon marché gagnent le plus.** Chaque lieu qui accorde un mot-clé ou copie un corps rapporte plus sur une carte à deux mana que sur une carte à sept : c'est le lieu qui fait la partie coûteuse.
4. **Méfiez-vous des lignes qui punissent l'engagement.** The Hill, Wall of Dumpty et The Gallows punissent tous le joueur qui remplit une ligne le premier. Face à un plateau inconnu, la deuxième carte dans une ligne est souvent plus sûre que la première.

## Ce qu'il nous reste à vérifier

Cette liste correspond à la rotation de la Demo 2.0. Nous n'avons pas encore passé les lieux un par un dans le jeu, comme nous l'avons fait avec les 122 cartes le 22 septembre 2026 : quand ce sera fait, la [page des lieux](/fr/locations) le dira, avec la date et le décompte.
`,
  },
  "origins-tcg-explained": {
    title: "Origins TCG expliqué en cinq minutes",
    excerpt: "Ce qu'est Origins TCG, comment se joue une partie sur trois lignes à tours simultanés, ce que signifie free-to-compete et comment tester la démo aujourd'hui.",
    faq: [
      {
        q: "Qu'est-ce qu'Origins TCG ?",
        a: "Un jeu de cartes à collectionner numérique de Koin Games, un studio basé à Tampa, en Floride, fondé en 2021. Ses personnages sont des légendes du domaine public — Robin Hood, Mulan, Queen of Hearts, Dracula et bien d'autres — réinventées dans un seul monde original.",
      },
      {
        q: "Combien de temps dure une partie ?",
        a: "Environ sept minutes. Les deux joueurs agissent en même temps sur trois lignes, donc personne n'attend le tour de l'adversaire.",
      },
      {
        q: "Combien de cartes y a-t-il dans un deck ?",
        a: "Vingt-cinq dans la démo actuelle, construites autour d'une Légendaire dotée d'une capacité signature. Mulan répète les capacités À la révélation de vos alliés, la Queen of Hearts répète leurs capacités À la mort.",
      },
      {
        q: "Peut-on jouer gratuitement à Origins TCG ?",
        a: "Oui. La démo sur Steam est gratuite et comprend le tutoriel, des missions contre des boss dotés de leur propre IA et le jeu en ligne. Chaque carte nécessaire pour jouer en compétition se gagne en jouant ; l'argent n'achète que des versions de collection des cartes.",
      },
    ],
    body: `
## Ce que c'est

Origins TCG est un jeu de cartes à collectionner numérique de **Koin Games**, un studio basé à Tampa, en Floride, fondé en 2021 par des vétérans du secteur. Ses personnages sont des légendes du domaine public réinventées dans un seul monde original : Robin Hood, Mulan, Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula et bien d'autres.

La promesse, c'est le **free-to-compete** : chaque carte nécessaire pour jouer en compétition se gagne en jouant. L'argent n'achète que des versions de collection des cartes, qui peuvent être gradées, échangées et vendues. Les développeurs parlent de « zero pay-to-win ».

## Comment se déroule une partie

- **Trois lignes.** Vous et votre adversaire combattez sur trois plateaux à la fois. Chaque ligne a son propre lieu, tiré d'une réserve de plus d'une centaine qui tournent et changent les règles de ce plateau.
- **Tours simultanés.** Les deux joueurs agissent en même temps, donc pas d'attente. Une partie dure environ sept minutes.
- **Les cartes attaquent.** Contrairement aux jeux de pur « comptage de lignes », les unités se battent entre elles : la Puissance est ce que vous infligez, la Santé ce que vous encaissez.
- **Mots-clés.** La démo utilise, entre autres, À la révélation (On Reveal), qui se produit quand la carte est jouée, À la mort (On Death), Première frappe (First Strike), Double attaque (Double Attack) et Contact mortel (Deathtouch).
- **Une Légendaire mène le deck.** Dans la démo actuelle, les decks font 25 cartes et chacun est construit autour d'une carte Légendaire dotée d'une capacité signature : Mulan répète les capacités À la révélation de vos alliés, la Queen of Hearts répète leurs capacités À la mort. La Demo 2.0 en compte onze : [les 11 Légendaires, carte par carte](/fr/guides/origins-tcg-legendaries).

## Modes

La démo a un tutoriel, des missions contre des boss dotés de leur propre IA et le jeu en ligne. Le patch 0.6.1 a ajouté une **ladder classée** avec des divisions jusqu'à Grandmaster, un classement mondial et des Points de Victoire. Elle s'active dans la démo avec le Steam Next Fest : ce qui est confirmé jusqu'ici est dans notre [guide du mode classé d'Origins TCG](/fr/guides/origins-tcg-ranked).

## Comment jouer aujourd'hui

1. Installez la démo gratuite depuis la [page Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Les joueurs de la démo gagnent des objets de collection exclusifs qui seront échangeables au lancement du jeu complet.
2. Rejoignez le [Discord officiel](https://discord.gg/originstcg) pour les tournois, les AMA avec l'équipe et les playtests des prochaines builds.
3. Depuis le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026, le jeu prend en charge 13 langues : anglais, français, italien, allemand, espagnol (Espagne), japonais, coréen, polonais, portugais (Brésil), portugais (Portugal), russe, chinois simplifié et espagnol (Amérique latine). La page Steam, lue le 30 septembre 2026, liste les mêmes 13 pour l'interface, avec l'audio complet en anglais seulement. Le mobile est prévu pour 2027.

## Où va le jeu

La page Steam indique la sortie pour le quatrième trimestre 2026, sans date plus précise. La démo a reçu sa première grande mise à jour le 21 septembre 2026 et le patch 0.7, le dernier patch d'équilibrage avant le tournoi, le 29 septembre ; le mode classé s'active avec le Steam Next Fest (19–26 octobre 2026) et le plus grand tournoi du studio à ce jour, la Crimson Cup, se joue du 20 au 25 octobre. Le 25 septembre, le menu principal de la démo affichait le Kickstarter comme « Coming soon – Oct 27 ». Voir la [roadmap](/fr/guides/roadmap-and-dates) et notre [guide du Kickstarter](/fr/guides/origins-tcg-kickstarter).
`,
  },
  "on-reveal-midrange-guide": {
    title: "On Reveal Mid Range : comment jouer le deck midrange de Mulan",
    metaTitle: "Guide du deck de Mulan : On Reveal Mid Range",
    excerpt: "Plan de jeu, mulligan et manche par manche d'On Reveal Mid Range, le deck de Mulan qui répète les capacités À la révélation : ladder, compétitif et tournois.",
    faq: [
      {
        q: "Que fait Mulan dans ce deck ?",
        a: "Mulan est une 2/4 à 4 mana avec Double attaque et, quand la capacité À la révélation d'un allié se produit, elle la répète. Neuf cartes de la liste ont une capacité À la révélation : elle transforme chacune d'elles en deux.",
      },
      {
        q: "Que garder au mulligan ?",
        a: "Une courbe qui arrive à Mulan à la quatrième manche : Bagheera sur une case centrale, Baby Bear, puis Black Knight ou Frog Prince. Mary vaut la peine d'être gardée quand vous attendez une partie longue.",
      },
      {
        q: "Quelle capacité À la révélation gagne le plus avec Mulan ?",
        a: "Mowgli, dont la capacité À la révélation à 6 mana invoque un Baloo 6/6 dans un autre lieu aléatoire : répétée, elle met deux Baloo sur le plateau. Ellen Trechend et Fairy Godmother doublent bien aussi.",
      },
      {
        q: "Comment essayer le deck ?",
        a: "Ouvrez la page du deck sur OriginsMeta et appuyez sur « Ouvrir dans le Deck builder », ou « Copier le code du jeu » pour coller le code (KGBLDC…) dans Origins.",
      },
    ],
    body: `
**Rédigé avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Le deck en un paragraphe

**On Reveal Mid Range** est une liste **midrange** menée par [Mulan](/fr/cards/mulan), publiée sur OriginsMeta le 22 septembre 2026 par [Davdas](/fr/authors/davdas), membre du staff du site, et déclarée pour la **ladder**, le **compétitif** et les **tournois**. L'idée est celle que l'auteur écrit sur la [page du deck](/fr/decks/community/on-reveal-mid-range-772e) : Mulan « permet d'exploiter à fond » les capacités À la révélation, et la liste est construite pour en avoir une qui vaille la peine d'être répétée à chaque manche. Elle tient face à un deck agressif et met la pression sur un deck contrôle, parce que les mêmes cartes font gagner du temps et construisent le plateau.

## La liste

Vingt-cinq cartes : la Légendaire plus douze cartes jouées en deux exemplaires chacune. Les statistiques sont celles de la Demo 2.0, [vérifiées carte par carte dans le jeu](/fr/deck-builder) le 22 septembre 2026, avec le nouveau coût de Bagheera du [patch 0.7](/fr/news/patch-0-7) du 29 septembre.

| Carte | Coût | Ce qu'elle fait |
| --- | --- | --- |
| [Mulan](/fr/cards/mulan) ★ | 4 | 2/4, Double attaque ; quand une capacité À la révélation d'un allié se produit, elle la répète |
| [Bagheera](/fr/cards/bagheera) | 2 | 1/1 ; À la révélation sur une case centrale, il gagne +2⚔️/+2❤️ |
| [Baby Bear](/fr/cards/baby-bear) | 2 | 1/1 ; riposte pour 1 quand un ennemi endommage votre barrière ici, et À la mort ajoute un Papa Bear 4/4 à votre main |
| [Mary](/fr/cards/mary) | 3 | 1/1 ; À la révélation ajoute un Little Lamb à votre main, À la mort vos Lambs gagnent +3⚔️/+3❤️ de façon permanente |
| [Black Knight](/fr/cards/black-knight) | 3 | 2/2 ; À la révélation inflige 2 dégâts à l'ennemi en face |
| [Frog Prince](/fr/cards/frog-prince) | 3 | 2/2 ; À la révélation, +3⚔️ ou +3❤️, à votre choix |
| [Ali Baba](/fr/cards/ali-baba) | 3 | 2/3 ; pioche une carte chaque fois qu'il endommage une barrière adverse |
| [White Queen](/fr/cards/white-queen) | 4 | 3/3 ; À la révélation renvoie N'IMPORTE QUEL personnage dans la main de son propriétaire |
| [Fairy Godmother](/fr/cards/fairy-godmother) | 5 | 3/3 ; À la révélation donne +3⚔️/+3❤️ à un autre allié |
| [Mowgli](/fr/cards/mowgli) | 6 | 2/2 ; À la révélation invoque Baloo (6/6) dans un autre lieu aléatoire |
| [Ellen Trechend](/fr/cards/ellen-trechend) | 8 | Piétinement ; À la révélation elle gagne +3⚔️/+3❤️ pour chaque carte ennemie dans son lieu |
| [Bullseye](/fr/cards/bullseye) | 1 | Sort : 3 dégâts à N'IMPORTE QUEL personnage |
| [En Passant](/fr/cards/en-passant) | 3 | Sort : déplacez un allié et infligez sa Puissance au personnage en face |

Dix unités et deux sorts, dont neuf portent une capacité À la révélation. C'est tout le sens du deck : Mulan n'est pas un finisseur, c'est un multiplicateur.

## Comment le deck gagne

Mulan répète la capacité À la révélation d'un allié, donc chaque carte jouée après elle vaut double. Les trois meilleures répétitions :

- **Mowgli** coûte six et invoque un Baloo 6/6 dans un autre lieu aléatoire. Répété, cela fait deux Baloo : une seule carte qui remplit deux lignes que vous ne disputiez pas.
- **Ellen Trechend** grandit de +3⚔️/+3❤️ pour chaque carte ennemie dans son lieu, et elle a Piétinement. Dans une ligne chargée, elle est déjà une menace à elle seule ; répétée, le bonus s'applique deux fois avant le combat.
- **Fairy Godmother** donne +3⚔️/+3❤️ à un autre allié. Les deux déclenchements peuvent viser le même corps ou se répartir sur deux, selon ce que l'adversaire peut éliminer.

Mulan a aussi **Double attaque**, donc son propre corps de 2/4 échange mieux qu'il n'y paraît.

## Mulligan

Cherchez une courbe qui vous amène à Mulan à la quatrième manche sans prendre de retard : **Bagheera** sur une case centrale (un 3/3 pour un mana), puis **Baby Bear**, puis **Black Knight** ou **Frog Prince**. Gardez **Mary** quand vous attendez une partie longue : le Lamb qu'elle ajoute à votre main est un corps bon marché et, si Mary meurt, les Lambs que vous avez déjà joués grandissent de façon permanente.

## Manche par manche

1. **Manches 1–3 : prendre de l'espace sans trop s'engager.** Bagheera au centre, Baby Bear là où vous attendez les premières attaques, Black Knight en face de quelque chose que vous voulez voir mourir. Une carte par ligne suffit : le deck veut un plateau équilibré, pas encombré, quand Mulan arrive.
2. **Manche 4 : Mulan.** À partir de là, l'ordre de vos jeux compte plus que les cartes. Demandez-vous à chaque manche quelle capacité À la révélation vaut la peine d'être doublée, et jouez cette carte dans le lieu de Mulan.
3. **Manches 5–6 : les cartes de valeur.** Fairy Godmother, puis Mowgli à six. White Queen est la carte-réponse de la liste : elle renvoie N'IMPORTE QUEL personnage dans la main de son propriétaire, donc elle peut écarter un finisseur la manche où il arrive, ou reprendre votre propre Mary pour la rejouer.
4. **Manches 7–8 : la fin de partie.** Ellen Trechend dans la ligne que l'adversaire a remplie ; En Passant pour déplacer un allié, frapper ce qui lui fait face et ouvrir la voie aux dégâts de Piétinement.

## Jouer les cartes qui font gagner du temps

L'auteur appelle **White Queen, Mary et En Passant** les cartes « qui vous font gagner du temps », et ce sont elles qui permettent au deck de survivre à un départ agressif. White Queen n'est pas une élimination : le personnage retourne dans la main de son propriétaire et peut être rejoué, donc utilisez-la sur quelque chose de cher, ou sur un corps déjà renforcé. En Passant est à la fois élimination et repositionnement, et c'est la réponse à un bloqueur garé devant votre meilleure carte.

## Matchups

Les données du mode classé ne sont pas publiques : ce qui suit est la lecture qu'OriginsMeta fait des listes, pas un win rate.

- **Contre les decks agressifs.** Baby Bear et Frog Prince joué en 2/5 tiennent les lignes ; Bullseye s'occupe des corps à trois de Santé pour un mana. Ne dépensez pas White Queen trop tôt : vous la voudrez pour la première grosse menace.
- **Contre les decks contrôle.** Ali Baba est la carte qui garde votre main pleine pendant que vous pressez une barrière. N'engagez pas tout dans un seul lieu : un nettoyage de plateau auquel vous répondez d'un seul Mowgli est un revers que vous pouvez vous permettre, une main vide non.
- **Contre les autres listes midrange.** Le deck joue le même jeu que [3 Pigs Mid Range](/fr/decks/community/3-pigs-mid-range-6311) et [King of Value Trade](/fr/decks/community/king-of-value-trade-fd14) : celui qui tire le plus de chaque carte gagne. Doubler une capacité À la révélation, c'est exactement cela, donc protégez Mulan et ne jouez les capacités À la révélation bon marché avant elle que si vous y êtes obligé.

## Les faiblesses, dans les mots de l'auteur

La page du deck en liste deux : **une bonne courbe est souvent essentielle** et **on peut se retrouver à court de réponses**. Les deux viennent du même endroit : le deck n'a aucune élimination de masse et seulement deux sorts. Si vous devez choisir entre utiliser une carte maintenant et la garder pour un doublement plus tard, utilisez-la maintenant : Mulan répète ce que vous jouez, elle ne ramène rien.

## Pour aller plus loin

- La [page du deck](/fr/decks/community/on-reveal-mid-range-772e) a la liste avec les graphiques de courbe de mana et de sagas, les notes de l'auteur, « Ouvrir dans le Deck builder » et le code du jeu à coller dans Origins.
- Les statistiques des cartes sont celles de la Demo 2.0 avec le [patch 0.7 du 29 septembre 2026](/fr/news/patch-0-7), qui a fait passer Bagheera d'un à deux mana ; chaque page de carte a son propre historique d'équilibrage.
`,
  },
  "king-of-value-trade-guide": {
    title: "King of Value Trade : comment jouer le deck midrange de King Arthur",
    metaTitle: "Guide du King of Value Trade de King Arthur",
    excerpt: "Plan de jeu, mulligan et manche par manche de King of Value Trade, le deck midrange de King Arthur bâti pour gagner chaque échange deux cartes contre une.",
    faq: [
      {
        q: "Qu'est-ce qu'un échange de valeur dans Origins TCG ?",
        a: "Faire répondre une de vos cartes à deux cartes de l'adversaire, ou échanger une carte bon marché contre une carte chère. Ce deck est construit autour de cette idée : Bouclier, Première frappe et les buffs font survivre vos personnages au combat qu'ils gagnent.",
      },
      {
        q: "Que garder au mulligan ?",
        a: "Bagheera et Roo, solides sur la courbe, Musketeer et Shield Maiden pour les premières manches. Contre les decks agressifs, gardez Cowardly Lion ; contre le contrôle, Ali Baba.",
      },
      {
        q: "Pourquoi Roo est-il bon après le patch du 21 septembre ?",
        a: "Le patch de la démo du 21 septembre 2026 a fait passer Roo de 2/3 à 2/4 (+1 Santé) pour deux mana en gardant le mot-clé Déplacer, donc il survit à la plupart des échanges des premières manches au lieu de perdre à l'échange.",
      },
      {
        q: "Spellbook est-il indispensable ?",
        a: "Non. Il ajoute un sort aléatoire à chaque manche pour du carburant et de l'imprévisibilité, mais la page du deck dit que la liste peut gagner sans lui.",
      },
    ],
    body: `
**Rédigé avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Le deck en un paragraphe

**King of Value Trade** est une liste **midrange** menée par [King Arthur](/fr/cards/king-arthur), publiée sur OriginsMeta le 22 septembre 2026 par [Davdas](/fr/authors/davdas), membre du staff du site, et déclarée pour la **ladder**. Le nom dit le plan : « presque chaque pièce veut faire du deux pour un », c'est-à-dire répondre à deux cartes de l'adversaire avec une des vôtres. Faites-le assez souvent et le plateau devient le vôtre tout seul, sans avoir besoin d'un seul grand tour de fin de partie.

## La liste

Vingt-cinq cartes : la Légendaire plus douze cartes jouées en deux exemplaires chacune.

| Carte | Coût | Ce qu'elle fait |
| --- | --- | --- |
| [King Arthur](/fr/cards/king-arthur) ★ | 7 | 7/7 avec Bouclier ; À la révélation il donne Bouclier à vos personnages Good |
| [Bagheera](/fr/cards/bagheera) | 2 | 1/1 ; À la révélation sur une case centrale, il gagne +2⚔️/+2❤️ |
| [Musketeer](/fr/cards/musketeer) | 2 | 2/1 avec Première frappe |
| [Roo](/fr/cards/roo) | 2 | 2/4 avec Déplacer |
| [Shahrazad](/fr/cards/shahrazad) | 2 | 1/4 ; soigne 1 dégât à votre barrière ici chaque fois qu'une carte entre dans votre main |
| [Shield Maiden](/fr/cards/shield-maiden) | 3 | 3/1 avec Bouclier |
| [Dark Omen](/fr/cards/dark-omen) | 3 | Sort : détruisez N'IMPORTE QUEL personnage |
| [Cowardly Lion](/fr/cards/cowardly-lion) | 3 | 2/5 avec Défenseur |
| [Ali Baba](/fr/cards/ali-baba) | 3 | 2/3 ; pioche une carte chaque fois qu'il endommage une barrière adverse |
| [Spellbook](/fr/cards/spellbook) | 4 | Sort : désormais, un sort aléatoire en main à chaque manche, défaussé avant le combat |
| [Lancelot](/fr/cards/lancelot) | 4 | 4/4 ; chaque personnage Good que vous jouez dans son lieu gagne +2⚔️/+2❤️ |
| [Fairy Godmother](/fr/cards/fairy-godmother) | 5 | 3/3 ; À la révélation donne +3⚔️/+3❤️ à un autre allié |
| [Boitata](/fr/cards/boitata) | 5 | 5/5 ; les dégâts de sorts et de capacités visant vos barrières frappent à la place la barrière adverse de ce lieu |

Dix unités et deux sorts, et dix des treize cartes sont des personnages Good : ce n'est pas un hasard, c'est ce qui fait que la Légendaire vaut ses sept mana.

## Comment le deck gagne

Trois mots-clés font le travail.

- **Bouclier** absorbe les premiers dégâts. King Arthur le donne à tous vos personnages Good d'un coup, et [Shield Maiden](/fr/cards/shield-maiden) apporte le sien : un 3/1 avec Bouclier échange avec un 3/3 et reste sur le plateau.
- **Première frappe** sur [Musketeer](/fr/cards/musketeer) signifie que l'ennemi subit les dégâts avant de pouvoir répondre : deux mana qui éliminent un corps plus gros.
- **Les buffs** de [Lancelot](/fr/cards/lancelot) et de [Fairy Godmother](/fr/cards/fairy-godmother) transforment un combat équilibré en un combat à sens unique. Lancelot renforce chaque personnage Good joué dans son lieu, donc il vous récompense de continuer sur la même ligne au lieu de vous disperser.

[Ali Baba](/fr/cards/ali-baba) est le moteur : chaque fois qu'il endommage une barrière, vous piochez. [Shahrazad](/fr/cards/shahrazad) est l'autre moitié de la même idée : elle soigne un dégât à votre barrière dans son lieu chaque fois qu'une carte entre dans votre main, donc piocher vous garde en vie autant qu'en avance.

## Mulligan

**Bagheera est indispensable**, et **Roo** vaut désormais la peine d'être gardé dans chaque main : le [patch de la démo du 21 septembre](/fr/news/demo-patch-notes-0921) en a fait un 2/4, donc il survit aux échanges des premières manches. **Musketeer** et **Shield Maiden** vous mettent devant aux manches deux et trois. Contre un deck agressif, gardez **Cowardly Lion**, dont le Défenseur tient la ligne ; contre un deck contrôle, gardez **Ali Baba**, qui transforme un coup gratuit sur une barrière en cartes. Si vous attendez une partie longue, garder **Spellbook** est un choix raisonnable.

## Manche par manche

1. **Manches 1–3 : échanger à votre avantage.** Bagheera au centre, Musketeer en face d'un corps à 1 ou 2 de Santé, Roo là où vous pourriez vouloir le déplacer plus tard. Chaque combat que vous pouvez gagner sans perdre le corps est une carte gagnée.
2. **Manches 4–5 : tenir une ligne.** Lancelot, puis jouez les personnages Good dans son lieu : chacun arrive +2⚔️/+2❤️ plus gros qu'il ne devrait. Boitata à cinq est un 5/5 qui renvoie aussi contre les barrières adverses les dégâts de sorts ennemis visant les vôtres.
3. **Manches 6–7 : la Légendaire.** King Arthur est un 7/7 avec Bouclier, et sa capacité À la révélation donne Bouclier à tout ce que vous avez déjà de Good sur le plateau. Ne le jouez pas sur un plateau vide : la valeur est dans les Boucliers, pas dans le corps.
4. **Dark Omen, quand ça compte.** Trois mana pour détruire N'IMPORTE QUEL personnage, c'est la réponse à la seule carte que vous ne pouvez pas battre au combat : un corps renforcé, un Défenseur dans la mauvaise ligne, une Légendaire ennemie.

## Deux notes de l'auteur

- **Fairy Godmother n'est pas seulement un finisseur.** La page du deck fait remarquer qu'elle peut aussi protéger Ali Baba, Shahrazad ou Cowardly Lion : +3❤️ sur le bon corps signifie que le moteur survit une manche de plus.
- **Dark Omen doit être précis.** Avec deux exemplaires et aucune autre élimination, en dépenser un sur la mauvaise cible laisse la vraie menace en vie.

## Matchups

Les données du mode classé ne sont pas publiques : ceci est la lecture qu'OriginsMeta fait des listes, pas un win rate.

- **Contre les decks agressifs.** Cowardly Lion et Shahrazad ensemble sont le filet de sécurité : le Défenseur encaisse les coups, le soin rend les dégâts qui passent sur la barrière. N'échangez pas Shield Maiden trop tôt contre un corps à 1 de Santé si un plus gros arrive.
- **Contre les decks contrôle.** Ali Baba, puis un deuxième. La page du deck est claire là-dessus : la liste veut continuer à piocher pendant que l'adversaire cherche ses réponses. Gardez Dark Omen pour la carte qui clôt leur partie, pas pour la première chose qu'ils jouent.
- **Contre les decks qui endommagent vos barrières avec des sorts** ([Healing Healsing](/fr/decks/community/healing-healsing-9411) et les autres listes avec Boitata). Celui qui pose Boitata en premier retourne ces dégâts : avec deux exemplaires dans la liste, il vaut mieux en garder un que de perdre les deux dans le même combat.

## Les faiblesses, dans les mots de l'auteur

La page du deck en liste trois : **aucune élimination de zone**, **Dark Omen doit être utilisé avec précision** et **il faut lire le plan de l'adversaire**. Les deux premières découlent de la liste : à part Dark Omen, rien n'élimine un personnage directement, donc un plateau que vous laissez grandir reste grand. La troisième est la partie honnête : ce deck construit sa valeur un échange à la fois, et chaque échange est une décision.

## Pour aller plus loin

- La [page du deck](/fr/decks/community/king-of-value-trade-fd14) a la liste complète avec les graphiques, les notes de l'auteur, « Ouvrir dans le Deck builder » et le code du jeu (KGBLDC…).
- Les statistiques des cartes sont celles de la Demo 2.0 avec le [patch 0.7 du 29 septembre 2026](/fr/news/patch-0-7), qui a fait passer Bagheera à deux mana et Spellbook à quatre ; les sorts que Spellbook ajoute ne peuvent plus être Spellbook.
`,
  },
  "dorothy-combo-guide": {
    title: "Dorothy Combo : comment jouer le deck move après le patch du 21 septembre",
    metaTitle: "Guide du deck de Dorothy : Dorothy Combo",
    excerpt: "Le deck move rebâti sur les buffs du 21 septembre : comment Dorothy grandit, quels combos chercher, le mulligan et ce que la liste ne sait pas encore faire.",
    faq: [
      {
        q: "Comment Dorothy grandit-elle ?",
        a: "Dorothy peut se Déplacer à chaque manche et a +1⚔️/+1❤️ pour chaque fois qu'un allié s'est déplacé dans cette partie. Le compteur porte sur toute la partie, pas sur la manche, donc chaque déplacement que vous faites, où que ce soit, la rend plus grosse.",
      },
      {
        q: "Quels combos de déplacement le deck cherche-t-il ?",
        a: "Card Soldier, qui invoque une copie de lui-même sur sa case précédent après s'être déplacé ; Pegasus, qui double sa Puissance après s'être déplacé ; et Magic Carpet, qui à la révélation déplace vos autres alliés d'une case vers la gauche ou vers la droite.",
      },
      {
        q: "Le deck est-il compétitif ?",
        a: "L'auteur le présente comme un deck fun et de ladder et dit clairement qu'il n'est probablement pas encore au niveau des top tier, mais qu'après les buffs du 21 septembre quelque chose bouge.",
      },
      {
        q: "Comment essayer le deck ?",
        a: "Ouvrez la page du deck sur OriginsMeta et appuyez sur « Ouvrir dans le Deck builder », ou copiez le code du jeu (KGBLDC…) dans Origins.",
      },
    ],
    body: `
**Rédigé avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Le deck en un paragraphe

**Dorothy Combo** est une liste **combo** menée par [Dorothy](/fr/cards/dorothy), publiée sur OriginsMeta le 22 septembre 2026 par [Davdas](/fr/authors/davdas), membre du staff du site, et déclarée pour la **ladder** et le **fun**. C'est le deck move, reconstruit après le [patch de la démo du 21 septembre 2026](/fr/news/demo-patch-notes-0921), qui a renforcé entre autres Dorothy, [Roo](/fr/cards/roo) et [Magic Carpet](/fr/cards/magic-carpet). Le jugement de l'auteur est sur la [page du deck](/fr/decks/community/dorothy-combo-7503) et nous le gardons tel quel : ce n'est probablement pas encore une liste top tier, mais quelque chose bouge.

## La liste

Vingt-cinq cartes : la Légendaire plus douze cartes jouées en deux exemplaires chacune.

| Carte | Coût | Ce qu'elle fait |
| --- | --- | --- |
| [Dorothy](/fr/cards/dorothy) ★ | 4 | 1/1 ; peut se Déplacer à chaque manche et gagne +1⚔️/+1❤️ pour chaque fois qu'un allié s'est déplacé dans cette partie |
| [Twister Toss](/fr/cards/twister-toss) | 1 | Sort : déplacez un allié vers n'importe quelle case ; si une autre carte s'y trouve déjà, les deux échangent leur place |
| [Card Soldier](/fr/cards/card-soldier) | 2 | 3/1 ; après s'être déplacé, il invoque une copie de lui-même sur sa case précédent |
| [Roo](/fr/cards/roo) | 2 | 2/4 avec Déplacer |
| [Basilisk](/fr/cards/basilisk) | 2 | 1/2 avec Contact mortel |
| [Pegasus](/fr/cards/pegasus) | 3 | 2/4 ; après s'être déplacé, il double sa Puissance |
| [Flying Monkey](/fr/cards/flying-monkey) | 3 | 4/1 ; À la révélation déplace N'IMPORTE QUEL autre personnage vers un emplacement aléatoire ici |
| [Wicked Witch of the West](/fr/cards/wicked-witch-of-the-west) | 3 | 1/5 ; quand elle survit à des dégâts, elle ajoute un Flying Monkey à votre main et se déplace d'une case vers la gauche |
| [Kanga](/fr/cards/kanga) | 3 | 2/3 ; avant le combat, les alliés qui se sont déplacés cette manche gagnent +1⚔️/+1❤️ |
| [En Passant](/fr/cards/en-passant) | 3 | Sort : déplacez un allié et infligez sa Puissance au personnage en face |
| [Spellbook](/fr/cards/spellbook) | 4 | Sort : désormais, un sort aléatoire en main à chaque manche, défaussé avant le combat |
| [Magic Carpet](/fr/cards/magic-carpet) | 4 | 4/4 ; À la révélation déplace vos autres alliés d'une case vers la gauche, ou d'une case vers la droite |
| [Hare](/fr/cards/hare) | 5 | 4/1 avec Première frappe et Déplacer |

Neuf unités et trois sorts, et presque tout se déplace ou récompense un déplacement.

## Comment le deck gagne

Dorothy est un 1/1 qui compte : **+1⚔️/+1❤️ pour chaque fois qu'un allié s'est déplacé dans cette partie**. Le compteur ne se remet pas à zéro et il compte les déplacements partout sur le plateau, donc un sort bon marché comme [Twister Toss](/fr/cards/twister-toss) n'est jamais gaspillé : c'est un mana pour un point permanent sur votre Légendaire. Jouée à la cinquième manche après quelques déplacements, Dorothy arrive comme un vrai corps et continue de grandir à chaque manche suivante, parce qu'elle se déplace elle-même.

Trois combos font le sens de la liste :

1. **Card Soldier plus n'importe quel déplacement.** Un 3/1 pour deux mana qui laisse une copie de lui-même derrière lui chaque fois qu'il se déplace : avec Twister Toss ou Magic Carpet, il remplit une ligne à lui seul.
2. **Pegasus plus n'importe quel déplacement.** Après s'être déplacé, il double sa Puissance : le 2/4 devient 4/4, et avec le +1⚔️ de Kanga avant le combat c'est un corps de 5 de Puissance que l'adversaire avait évalué à trois mana.
3. **Magic Carpet comme moteur.** Il déplace *tous* vos autres alliés d'une case, dans la direction que vous choisissez : une carte, plusieurs déclenchements — une copie de Card Soldier, un Pegasus doublé, des points sur Dorothy et le buff de Kanga sur tout ce qui s'est déplacé.

## Mulligan

L'auteur ne laisse aucune note sur le mulligan, donc ceci est la lecture d'OriginsMeta. Gardez les déplacements bon marché, **Twister Toss** et **Roo**, et l'un des deux corps qui vous paient pour vous déplacer, **Card Soldier** ou **Pegasus**. Magic Carpet est la carte que vous voulez à la quatrième manche, pas dans la main de départ. Sans aucune carte bon marché, une main qui démarre à la troisième manche est trop lente pour un deck qui veut son compteur en marche dès la première.

## Manche par manche

1. **Manches 1–2 : lancer le compteur.** Card Soldier ou Roo, puis Twister Toss sur lui. Chaque déplacement est un point permanent sur Dorothy, même quand le plateau semble calme.
2. **Manche 3 : choisir la ligne.** Pegasus, la Witch ou Kanga. [Wicked Witch of the West](/fr/cards/wicked-witch-of-the-west) est celle qui génère toute seule : un 1/5 qui survit à la plupart des coups et, chaque fois qu'elle survit, vous obtenez un Flying Monkey en main et elle se déplace d'une case vers la gauche — un point de plus pour Dorothy.
3. **Manche 4 : Magic Carpet.** Choisissez la direction qui pousse vos Card Soldiers vers une case libre et emmène Pegasus dans un combat qu'il va maintenant gagner.
4. **À partir de la manche 5 : Dorothy, puis conclure.** Elle coûte 4 depuis le patch du 21 septembre, mais la quatrième manche appartient à Magic Carpet, et une manche plus tard elle arrive avec un compteur plus haut. Hare a Première frappe et Déplacer : il frappe avant la réponse et fait tourner le compteur. [Basilisk](/fr/cards/basilisk) avec Contact mortel est la réponse bon marché à un corps trop gros pour être affronté à la loyale, et En Passant transforme un Pegasus doublé en élimination.

## Ce que le deck ne sait pas faire

L'auteur liste deux faiblesses, et elles sont honnêtes : **on peut se retrouver très mal coincé avec ses cartes** et **certains combos ne sont pas constants**. Les deux viennent du même endroit : [Flying Monkey](/fr/cards/flying-monkey) déplace un personnage vers une case *aléatoire*, la copie de Card Soldier va sur la case qu'il a quittée et Magic Carpet déplace tout, y compris les alliés que vous vouliez là où ils étaient. Décidez la direction avant de jouer Magic Carpet, et ne comptez pas sur un emplacement précis pour rester libre.

## Matchups

Les données du mode classé ne sont pas publiques : ceci est une lecture des listes, pas un win rate.

- **Contre les decks agressifs.** La Witch et Roo tiennent les premières lignes ; le Contact mortel de Basilisk répond au premier gros corps. Dorothy peut attendre : elle est meilleure tard, quand le compteur est haut.
- **Contre les decks contrôle.** C'est le bon matchup. Les copies de Card Soldier et les Flying Monkeys reviennent sans cesse, donc un seul nettoyage ne vide pas votre plateau. Gardez un Twister Toss en main après un nettoyage pour relancer le compteur.
- **Contre les autres decks move.** Celui qui se déplace le plus a la plus grosse Dorothy, mais Flying Monkey déplace *n'importe quel* personnage : utilisez-le pour tirer un Pegasus ennemi hors de l'emplacement où il allait doubler.

## Pour aller plus loin

- La [page du deck](/fr/decks/community/dorothy-combo-7503) a la liste complète, les graphiques, les notes de l'auteur, « Ouvrir dans le Deck builder » et le code du jeu.
- Les buffs derrière cette liste sont dans les [notes de patch du 21 septembre](/fr/news/demo-patch-notes-0921) ; MetaShifting suit chaque changement sur [sa propre page](/fr/metashifting).
- Les statistiques des cartes sont celles de la Demo 2.0 avec le [patch 0.7 du 29 septembre 2026](/fr/news/patch-0-7), qui a fait passer Spellbook de trois à quatre mana et a retravaillé Twister Toss. Le tableau décrit Twister Toss d'après les notes de patch : nous n'avons pas encore lu son nouveau texte dans le jeu.
`,
  },
  "trick-or-treat-legion-guide": {
    title: "The Trick-or-Treat Legion : comment jouer le deck de Legion of the Dead",
    metaTitle: "Guide du deck de Legion of the Dead",
    excerpt: "La liste de Legion of the Dead construite pour être imprévisible : le plateau de Zombies, le combo Golden Egg et Boogeyman, le mulligan et les matchups.",
    faq: [
      {
        q: "Que fait Legion of the Dead ?",
        a: "C'est un sort Légendaire à 7 mana : il remplit votre plateau de Zombies (2⚔️/2❤️). Une carte, et toutes les cases libres sont pris.",
      },
      {
        q: "Quel est le combo Golden Egg et Boogeyman ?",
        a: "Boogeyman est un 7/7 à 4 mana dont la capacité À la révélation détruit l'allié de son lieu avec la Puissance la plus basse, même lui-même. Golden Egg est un 0/1 qui invoque une Golden Goose 5/5 sur sa case quand il meurt : posez l'Œuf d'abord, et la capacité de Boogeyman le transforme en Goose au lieu de tuer un de vos propres corps.",
      },
      {
        q: "Que garder au mulligan ?",
        a: "Bagheera et Thumbelina, idéalement aux côtés de Bullseye. La paire Golden Egg plus Boogeyman vaut aussi la peine d'être gardée dans la main de départ.",
      },
      {
        q: "Pourquoi Mind Palace est-il important ?",
        a: "Le deck vide sa main vite : sans les deux cartes que Mind Palace pioche, vous êtes à court de jeux avant que la Légendaire arrive.",
      },
    ],
    body: `
**Rédigé avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Le deck en un paragraphe

**The Trick-or-Treat Legion** est une liste **evil** menée par [Legion of the Dead](/fr/cards/legion-of-the-dead), publiée sur OriginsMeta le 22 septembre 2026 par [Davdas](/fr/authors/davdas), membre du staff du site, et déclarée pour la **ladder**, le **compétitif** et les **tournois**. Plusieurs versions du deck Legion circulent ; celle-ci, dans les mots de l'auteur, veut augmenter son imprévisibilité en réunissant des cartes qui jouent « une farce » au plateau adverse à chaque manche. La liste complète et les graphiques sont sur la [page du deck](/fr/decks/community/the-trick-or-treat-legion-72c4).

## La liste

Vingt-cinq cartes : la Légendaire plus douze cartes jouées en deux exemplaires chacune.

| Carte | Coût | Ce qu'elle fait |
| --- | --- | --- |
| [Legion of the Dead](/fr/cards/legion-of-the-dead) ★ | 7 | Sort Légendaire : remplissez votre plateau de Zombies (2⚔️/2❤️) |
| [Bullseye](/fr/cards/bullseye) | 1 | Sort : 3 dégâts à N'IMPORTE QUEL personnage |
| [Thumbelina](/fr/cards/thumbelina) | 1 | 2/2, sans capacité |
| [Bagheera](/fr/cards/bagheera) | 2 | 1/1 ; À la révélation sur une case centrale, il gagne +2⚔️/+2❤️ |
| [Morgiana](/fr/cards/morgiana) | 2 | 2/3 ; empêche TOUTES les capacités À la révélation de se déclencher dans son lieu |
| [Mind Palace](/fr/cards/mind-palace) | 3 | Sort : piochez 2 cartes |
| [Asanbosam](/fr/cards/asanbosam) | 3 | 5/5 ; À la révélation défausse une carte aléatoire de coût pair |
| [Golden Egg](/fr/cards/golden-egg) | 3 | 0/1 ; À la mort il invoque une Golden Goose (5/5) sur sa case |
| [Flying Monkey](/fr/cards/flying-monkey) | 3 | 4/1 ; À la révélation déplace N'IMPORTE QUEL autre personnage vers un emplacement aléatoire ici |
| [En Passant](/fr/cards/en-passant) | 3 | Sort : déplacez un allié et infligez sa Puissance au personnage en face |
| [Boogeyman](/fr/cards/boogeyman) | 4 | 7/7 ; À la révélation détruit l'allié ici avec la Puissance la plus basse, même lui-même |
| [White Queen](/fr/cards/white-queen) | 4 | 3/3 ; À la révélation renvoie N'IMPORTE QUEL personnage dans la main de son propriétaire |
| [Impundulu](/fr/cards/impundulu) | 5 | 3/6 ; quand il attaque, il ajoute un Lightning Strike à votre main, défaussé avant le combat de la manche suivante |

Dix unités et trois sorts. Les trois cartes bon marché ne sont pas du remplissage : ce deck a besoin que le plateau soit le sien avant l'arrivée de la Légendaire, parce que les Zombies ne remplissent que les emplacements *libres*.

## Comment le deck gagne

Trois cartes font les dégâts — **Boogeyman, Asanbosam et Impundulu** — et tout le reste existe pour les protéger ou leur ouvrir la voie.

- **Boogeyman** est un 7/7 pour quatre mana, le meilleur rapport de la liste, avec un piège : à la révélation, il détruit l'allié de son lieu avec la Puissance la plus basse, lui compris. Posez-le dans une ligne vide et il se tue lui-même ; posez-le à côté d'un [Golden Egg](/fr/cards/golden-egg) et c'est l'Œuf qui meurt, laissant une Golden Goose 5/5 sur sa case. C'est le combo que l'auteur désigne : deux cartes, un 7/7 et un 5/5.
- **Asanbosam** est un 5/5 pour trois, et à la révélation il fait défausser à l'adversaire une carte aléatoire de coût pair.
- **Impundulu** transforme chaque attaque en un [Lightning Strike](/fr/cards/lightning-strike) dans votre main : des dégâts répétables, à condition de les dépenser avant le combat suivant.

La **Légendaire** clôt la partie plus qu'elle ne l'ouvre : à sept mana, *Remplissez votre plateau de Zombies* prend toutes les cases libres d'un coup. Elle est à son meilleur la manche qui suit un échange qui a vidé votre côté, ou dans les deux lieux que vous ne disputiez pas.

## Les « farces »

[En Passant](/fr/cards/en-passant), [Flying Monkey](/fr/cards/flying-monkey) et [White Queen](/fr/cards/white-queen) sont ce que l'auteur entend par jouer une farce à chaque manche.

- **En Passant** déplace un allié et inflige sa Puissance au personnage en face : sur Boogeyman ou une Golden Goose, ce sont cinq à sept dégâts qui repositionnent en même temps.
- **Flying Monkey** déplace N'IMPORTE QUEL autre personnage vers une case aléatoire de son lieu : il tire un bloqueur ennemi hors de la ligne, ou amène votre propre corps là où se joue le combat. La case est aléatoire, donc c'est une farce, pas un plan.
- **White Queen** renvoie N'IMPORTE QUEL personnage dans la main de son propriétaire : un finisseur ennemi disparaît pour une manche, ou votre propre Golden Egg revient pour être rejoué à côté d'un deuxième Boogeyman.

[Morgiana](/fr/cards/morgiana) est la discrète : dans son lieu, aucune capacité À la révélation ne se produit, pour aucun des deux camps. Jouez-la là où les capacités À la révélation de l'adversaire font le plus mal — mais rappelez-vous qu'elle arrête aussi les vôtres, y compris celle de Boogeyman.

## Mulligan

La note de l'auteur est courte et claire : **Bagheera et Thumbelina sont des départs parfaits aux côtés de Bullseye**, et **Golden Egg plus Boogeyman peuvent décider la partie même depuis la main de départ**. Bagheera sur une case centrale est un 3/3 pour un mana ; Thumbelina est un simple 2/2, ce qui, pour un mana, est une présence sur le plateau à laquelle vous n'avez pas à réfléchir.

## Manche par manche

1. **Manches 1–2 : prendre de l'espace à bas prix.** Bagheera au centre, Thumbelina là où vous vous attendez à combattre, Bullseye sur tout ce qui a trois de Santé.
2. **Manche 3 : la première menace.** Asanbosam en 5/5, ou le Golden Egg dans la ligne où Boogeyman arrivera la manche suivante.
3. **Manche 4 : Boogeyman.** Sur l'Œuf si vous l'avez, sinon à côté du plus petit corps que vous pouvez vous permettre de perdre — et jamais dans une ligne vide.
4. **Manches 5–6 : pression et cartes.** Impundulu commence à produire des Strikes ; Mind Palace recharge la main. L'auteur est explicite là-dessus : sans Mind Palace, le deck se retrouve sans cartes trop tôt.
5. **Manche 7 : Legion of the Dead.** Chaque case libre devient un 2/2. Comptez les cases avant de la jouer : après une manche où vous avez beaucoup échangé, elle vaut deux ou trois corps de plus.

## Matchups

Les données du mode classé ne sont pas publiques : ceci est la lecture qu'OriginsMeta fait des listes.

- **Contre les decks qui remplissent le plateau.** Les Zombies arrivent sur les cases libres, donc plus l'adversaire s'étale, moins la Légendaire fait pour vous. Utilisez d'abord Bullseye et Boogeyman pour ouvrir le plateau, et gardez Flying Monkey pour le corps renforcé.
- **Contre les decks contrôle.** La défausse d'Asanbosam et les Strikes d'Impundulu sont la pression qui ne dépend pas de la survie du plateau. Gardez un Boogeyman en réserve après un nettoyage : un 7/7 pour quatre est la façon la plus rapide de reconstruire.
- **Contre les decks basés sur les capacités À la révélation** (par exemple [On Reveal Mid Range](/fr/decks/community/on-reveal-mid-range-772e), qui répète chaque capacité À la révélation avec Mulan). C'est ici que Morgiana gagne sa place : mettez-la dans le lieu où ils empilent les capacités, acceptez que vos propres capacités À la révélation s'arrêtent là aussi, et combattez normalement sur les deux autres lignes.

## Les faiblesses, dans les mots de l'auteur

Deux, d'après la page du deck : **Mind Palace est très important, pour ne pas se retrouver sans cartes trop tôt**, et **Boogeyman a besoin d'une cible valable, ou de Morgiana**. La seconde mérite d'être répétée : le corps de 7/7 n'est bon que si quelque chose d'autre dans ce lieu a moins de Puissance. Le Golden Egg est l'assurance la moins chère, les Zombies de la Légendaire celle de la fin de partie.

## Pour aller plus loin

- La [page du deck](/fr/decks/community/the-trick-or-treat-legion-72c4) a la liste avec les graphiques, les notes de l'auteur, « Ouvrir dans le Deck builder » et le code du jeu (KGBLDC…).
- Les statistiques des cartes sont celles de la Demo 2.0 avec le [patch 0.7 du 29 septembre 2026](/fr/news/patch-0-7), qui a fait passer Bagheera d'un à deux mana et Mind Palace de deux à trois.
`,
  },
  "three-pigs-midrange-guide": {
    title: "3 Pigs Mid Range : comment jouer le deck midrange des Three Not So Little Pigs",
    metaTitle: "Guide du deck des Three Not So Little Pigs",
    excerpt: "Plan de jeu, mulligan et manche par manche de 3 Pigs Mid Range, le deck midrange mené par Three Not So Little Pigs, pour la ladder et le compétitif.",
    faq: [
      {
        q: "Quelle Légendaire mène 3 Pigs Mid Range ?",
        a: "Three Not So Little Pigs, un 3/3 à 7 mana avec Piétinement : sa capacité À la révélation invoque un Not So Little Pig avec Piétinement dans chaque autre lieu, donc une seule carte met un corps dans chaque ligne.",
      },
      {
        q: "Que garder au mulligan ?",
        a: "Cherchez toujours Bagheera, Ali Baba, Big Bad Wolf et Rumple. Contre les decks avec des cartes dangereuses à 4 de Santé, comme Van Helsing ou Glinda, gardez aussi Axe Throw.",
      },
      {
        q: "Comment le deck conclut-il une partie ?",
        a: "Avec En Passant, qui déplace un allié et frappe le personnage en face ; avec Ellen Trechend, dont le Piétinement pousse les dégâts jusqu'à la barrière ; et avec les Lightning Strikes qu'Impundulu ajoute à votre main chaque fois qu'il attaque.",
      },
      {
        q: "Comment essayer le deck ?",
        a: "Ouvrez la page du deck sur OriginsMeta et appuyez sur « Ouvrir dans le Deck builder », ou « Copier le code du jeu » pour coller le code du jeu (KGBLDC…) dans Origins. Le Deck builder vérifie la règle 1 Légendaire + 12 cartes × 2.",
      },
    ],
    body: `
**Rédigé avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Le deck en un paragraphe

**3 Pigs Mid Range** est le deuxième deck publié sur OriginsMeta par [Davdas](/fr/authors/davdas), membre du staff du site, le 15 septembre 2026. C'est une liste **midrange** menée par [Three Not So Little Pigs](/fr/cards/three-not-so-little-pigs), déclarée pour la **ladder** et le **compétitif**. L'idée est simple : gagner le plateau dans les premières manches, prendre l'avantage dans au moins un lieu, puis conclure avec des cartes qui punissent un adversaire qui se croit à l'abri derrière une barrière. La liste complète, les graphiques de composition et le code du jeu sont sur la [page du deck](/fr/decks/community/3-pigs-mid-range-6311) ; ce guide explique comment le piloter. Un second guide couvre les [matchups, les interactions clés et Conquest](/fr/guides/three-pigs-midrange-matchups).

## La liste

Vingt-cinq cartes : la Légendaire plus douze cartes jouées en deux exemplaires chacune.

| Carte | Coût | Rôle |
| --- | --- | --- |
| [Three Not So Little Pigs](/fr/cards/three-not-so-little-pigs) ★ | 7 | Légendaire : Piétinement, et À la révélation elle invoque un Not So Little Pig avec Piétinement dans chaque autre lieu |
| [Bagheera](/fr/cards/bagheera) | 2 | Carte à deux mana qui grandit quand elle est jouée sur une case centrale |
| [Rumple](/fr/cards/rumple) | 2 | 2/2 qui vous donne +1 mana la manche suivante |
| [Axe Throw](/fr/cards/axe-throw) | 2 | 4 dégâts à n'importe quel personnage |
| [Piglet](/fr/cards/piglet) | 2 | À la révélation : buff aux autres alliés de son lieu |
| [Mind Palace](/fr/cards/mind-palace) | 3 | Piochez 2 cartes |
| [Big Bad Wolf](/fr/cards/big-bad-wolf) | 3 | 3/3 qui gagne +1/+1 après chaque combat |
| [Wicked Witch of the West](/fr/cards/wicked-witch-of-the-west) | 3 | 1/5 : quand elle survit à des dégâts, elle ajoute un Flying Monkey à votre main et se déplace d'une case vers la gauche |
| [En Passant](/fr/cards/en-passant) | 3 | Déplacez un allié et infligez des dégâts égaux à sa Puissance au personnage en face |
| [Ali Baba](/fr/cards/ali-baba) | 3 | 2/3 qui pioche une carte quand il endommage la barrière adverse |
| [Frog Prince](/fr/cards/frog-prince) | 3 | Choisissez +3 Puissance ou +3 Santé à la révélation |
| [Impundulu](/fr/cards/impundulu) | 5 | 3/6 : chaque fois qu'il attaque, il ajoute un Lightning Strike à votre main |
| [Ellen Trechend](/fr/cards/ellen-trechend) | 8 | Piétinement ; À la révélation elle grandit pour chaque carte ennemie dans son lieu |

Neuf unités et trois sorts. Tout sauf Impundulu, les Pigs et Ellen Trechend coûte trois mana ou moins, et c'est pourquoi l'auteur qualifie la courbe de « très solide » : il y a toujours quelque chose à jouer de la manche un à la manche quatre.

## Comment le deck gagne

Le plan, d'après la page du deck : prendre le contrôle du plateau dans les premières manches, prendre l'avantage dans au moins un lieu, puis conclure avec trois cartes.

- **En Passant** déplace un allié et inflige des dégâts égaux à sa Puissance au personnage en face : il dégage la voie à l'un de vos gros corps, ou transforme un Big Bad Wolf qui a grandi en élimination.
- **Ellen Trechend** a Piétinement et grandit à la révélation pour chaque carte ennemie dans son lieu : plus l'adversaire s'est engagé dans une ligne, plus elle frappe fort, et Piétinement envoie les dégâts en excès à travers le bloqueur jusqu'à la barrière. La page du deck l'appelle « un finisseur à la limite de l'illégal ».
- **Impundulu**, si vous avez bien joué les premières manches, vous récompense d'un Lightning Strike à chaque attaque. Chaque Strike doit être utilisé avant le combat suivant, sinon il est défaussé : prévoyez deux mana par manche pour lui.

La Légendaire est le pont entre les deux phases. À sept mana, Three Not So Little Pigs met un cochon avec Piétinement dans chacun des deux autres lieux avec une seule carte, en plus de son propre corps 3/3 avec Piétinement. Jouée sur la courbe, elle remplit tout le plateau la manche avant qu'Ellen Trechend entre en jeu.

## Mulligan

Cherchez toujours **Bagheera, Ali Baba, Big Bad Wolf et Rumple** : ils donnent un bon départ sur la courbe et soutiennent les cochons déjà en jeu. Contre les decks avec des cartes dangereuses à 4 de Santé, comme Van Helsing ou Glinda, gardez aussi **Axe Throw** : il inflige exactement quatre dégâts à n'importe quel personnage. Ellen Trechend et Impundulu ne sont pas ce que vous voulez dans la main de départ : le deck les trouve plus tard avec Mind Palace et Ali Baba.

## Manche par manche

1. **Manches 1–3 : prendre le plateau.** Bagheera sur une case centrale, puis Rumple ou Piglet, puis une carte à trois. Rumple à la manche deux signifie quatre mana à la manche trois, soit un Wolf plus Bagheera, ou une Witch plus un sort. La Wicked Witch of the West est le mur du deck : avec cinq de Santé, elle survit à la plupart des premiers coups, et chaque fois qu'elle le fait vous obtenez un Flying Monkey en main et elle glisse d'une case vers la gauche.
2. **Manches 4–6 : choisir une ligne et presser.** Ali Baba veut frapper une barrière : chaque fois qu'il le fait, vous piochez. Frog Prince est soit un 5/2 qui échange à son avantage, soit un 2/5 qui tient une ligne ; choisissez après avoir vu ce que l'adversaire a révélé. Impundulu descend à cinq et commence à produire des Lightning Strikes dès sa première attaque.
3. **Manches 7–8 : les finisseurs.** Les Pigs à sept (ou à six avec un Rumple la manche d'avant), Ellen Trechend à huit dans le lieu où l'adversaire a le plus de cartes. Utilisez En Passant la même manche pour déplacer une menace là où on ne l'attend pas, ou pour éliminer le seul bloqueur qui gêne.

## Rester sur la courbe

La page du deck est claire sur la principale faiblesse : « sortir de la courbe réduit beaucoup son potentiel ». La liste n'a aucun nettoyage de plateau et rien qui soigne vos barrières, donc chaque manche que vous sautez est une manche que l'adversaire reçoit gratuitement. Deux habitudes aident. Ne gardez pas Rumple pour un tour « parfait » : le mana supplémentaire vaut plus tôt dans la partie. Et ne gardez pas les Lightning Strikes en main en espérant une meilleure cible : un Strike utilisé sur une barrière reste trois dégâts que vous perdriez autrement.

## Pour aller plus loin

- La [page du deck](/fr/decks/community/3-pigs-mid-range-6311) a la liste avec les graphiques de courbe de mana, de sagas et de mots-clés, les notes de l'auteur, le bouton « Ouvrir dans le Deck builder » vers le [Deck builder](/fr/deck-builder) et le code du jeu (KGBLDC…) à coller dans Origins.
- [Matchups, interactions clés et Conquest](/fr/guides/three-pigs-midrange-matchups) est la seconde partie de ce guide.
- Les statistiques des cartes sont celles du patch de la démo du 21 septembre 2026, vérifiées dans le jeu le 22 septembre, avec les changements du [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : Bagheera coûte désormais deux mana et Mind Palace trois. Plusieurs cartes de cette liste ont été retouchées dans les patchs 0.6.2 et 0.6.3, et le 21 septembre Frog Prince a cessé d'effacer les buffs déjà présents : consultez l'historique d'équilibrage sur la page de chaque carte.
`,
  },
  "three-pigs-midrange-matchups": {
    title: "3 Pigs Mid Range : matchups, interactions clés et Conquest",
    metaTitle: "Matchups du deck des Three Not So Little Pigs",
    excerpt: "Deuxième partie du guide de 3 Pigs Mid Range : les interactions qui gagnent les parties, les principaux matchups, les erreurs à éviter et Conquest.",
    faq: [
      {
        q: "Que fait Ellen Trechend contre un plateau large ?",
        a: "Elle grandit à la révélation pour chaque carte ennemie dans son lieu et a Piétinement, donc une ligne que l'adversaire a remplie devient sa meilleure cible : les dégâts qui dépassent la Santé du bloqueur vont dans la barrière.",
      },
      {
        q: "Comment jouer contre les decks Van Helsing ?",
        a: "Gardez Axe Throw pour Van Helsing, qui a quatre de Santé, mettez la pression tôt avant que Forbidden Knowledge arrive à huit mana, et visez les personnages plutôt que les barrières avec les Lightning Strikes tant que Boitata est sur le plateau.",
      },
      {
        q: "Peut-on jouer 3 Pigs Mid Range et Healing Healsing ensemble en Conquest ?",
        a: "Oui. Les deux decks ont des Légendaires différentes et ne partagent qu'une seule carte, Ali Baba, donc ils diffèrent de douze cartes uniques, Légendaire comprise : plus que les 8 que la Crimson Cup exige entre chaque paire de decks.",
      },
    ],
    body: `
**Rédigé avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Avant de commencer

Ceci est la seconde partie du guide de **3 Pigs Mid Range**, le deck midrange mené par [Three Not So Little Pigs](/fr/cards/three-not-so-little-pigs) que [Davdas](/fr/authors/davdas), du staff d'OriginsMeta, a publié le 15 septembre 2026. La [première partie](/fr/guides/three-pigs-midrange-guide) couvre la liste, le plan de jeu, le mulligan et le manche par manche. Ici, nous regardons les interactions qui décident des parties, les matchups et le format pour lequel le deck est déclaré. Les notes de l'auteur sont sur la [page du deck](/fr/decks/community/3-pigs-mid-range-6311) ; la lecture des matchups ci-dessous est celle d'OriginsMeta, fondée sur les textes des cartes du patch 0.6.3 ; les changements du patch de la démo du 21 septembre et du [patch 0.7](/fr/news/patch-0-7) du 29 septembre, qui a fait passer Bagheera à deux mana et Mind Palace à trois, sont dans [MetaShifting](/fr/metashifting).

## Cinq interactions à connaître

1. **Rumple vers les finisseurs.** Rumple vous donne +1 mana la manche suivante. Joué à la manche cinq, il vous permet de révéler Three Not So Little Pigs à la manche six, une manche entière avant que l'adversaire attende une carte à sept ; joué à la manche six, il met Ellen Trechend sur le plateau à la manche sept.
2. **La Wicked Witch et son Flying Monkey.** La Witch est un 1/5 : elle meurt rarement d'un seul coup, et chaque fois qu'elle survit à des dégâts vous obtenez un [Flying Monkey](/fr/cards/flying-monkey) en main et elle se déplace d'une case vers la gauche. La capacité À la révélation du Monkey déplace n'importe quel autre personnage, le vôtre ou le leur, vers une case aléatoire de son lieu : utilisez-la pour tirer un bloqueur ennemi hors de la ligne où vous piétinez, ou pour amener un Wolf là où se joue le combat.
3. **En Passant sur un corps qui a grandi.** Le sort déplace un allié et inflige des dégâts égaux à sa Puissance au personnage en face. Sur un Big Bad Wolf qui a combattu deux fois, ce sont cinq dégâts plus un repositionnement ; sur Ellen Trechend, c'est une élimination qui déplace aussi son Piétinement là où la barrière est la plus faible. C'est aussi la réponse à un bloqueur garé devant l'un de vos cochons.
4. **Les Lightning Strikes d'Impundulu.** Chaque attaque ajoute un [Lightning Strike](/fr/cards/lightning-strike), deux mana pour trois dégâts à n'importe quel personnage ou barrière, à utiliser avant le combat suivant. Ce sont trois dégâts ciblés et répétables : assez pour la plupart des cartes de début de partie du pool actuel, ou un coup direct sur une barrière quand le plateau est déjà à vous.
5. **Piglet sur les cochons.** La capacité À la révélation de Piglet renforce les autres alliés de son lieu. La manche après les Pigs, un Piglet à côté d'un Not So Little Pig fait un corps avec Piétinement qui frappe plus fort : la page du deck note que les cartes du mulligan « soutiennent les cochons déjà sur le plateau ».

## Matchups

Les données du mode classé ne sont pas encore publiques : ce qui suit est une lecture des listes, pas un win rate.

**Contre le contrôle Van Helsing, par exemple [Healing Healsing](/fr/decks/community/healing-healsing-9411), du même auteur.** C'est le matchup que la note sur le mulligan a en tête quand elle dit de garder Axe Throw : Van Helsing est un 3/4, et quatre dégâts l'éliminent avant que ses Tools commencent à arriver à chaque combat. Poussez les dégâts tôt, parce que le deck contrôle veut atteindre huit mana pour Forbidden Knowledge, qui détruit tous les personnages du plateau, les vôtres et les leurs. Ne posez pas les Pigs et Ellen Trechend dans la même fenêtre : gardez un finisseur pour la manche après le nettoyage. Tant que Boitata est en jeu, les dégâts de sorts visant leurs barrières sont infligés aux vôtres à la place, donc visez les personnages avec les Lightning Strikes jusqu'à ce qu'il disparaisse.

**Contre les plateaux larges (listes de style Swarm, Mulan).** Plus ils s'étalent, plus Ellen Trechend grandit : elle gagne pour chaque carte ennemie dans son lieu. Gardez la Witch comme mur sur la ligne qu'ils inondent, jouez Frog Prince en 2/5 plutôt qu'en 5/2, et réservez Axe Throw à la carte qui renforce les autres. [Mulan](/fr/cards/mulan) répète les capacités À la révélation de ses alliés : c'est elle la cible prioritaire.

**Contre les autres decks midrange (King Arthur, Robin Hood).** Le tempo décide : celui qui sort de la courbe perd. Rumple est ici à son meilleur, et les Strikes d'Impundulu font la différence sur un plateau équilibré. La capacité À la révélation de [Robin Hood](/fr/cards/robin-hood) inflige 2 dégâts à tous les ennemis, ce qui tue Bagheera, Piglet et un Rumple tout frais, mais pas la Witch ni un Frog Prince joué en 2/5 : à huit mana, ne surchargez pas une ligne de petites unités. [King Arthur](/fr/cards/king-arthur) donne Bouclier aux personnages Good, donc gardez Axe Throw pour après que le Bouclier a été consommé.

## Les erreurs à éviter

- **Jouer les Pigs en sauvetage.** La Légendaire invoque des cochons sur des cases aléatoires des autres lieux : elle est à son meilleur quand ces lignes ont déjà un Wolf ou une Witch avec qui combattre, pas quand tout est déjà perdu.
- **Garder Rumple.** C'est un corps 2/2 avec un bonus, et le bonus vaut le plus entre les manches deux et six.
- **Gaspiller les Lightning Strikes.** Ils sont défaussés avant le combat suivant : un Strike dans une barrière vaut mieux qu'un Strike perdu.
- **Oublier les faiblesses.** La page du deck les liste : aucune élimination de masse et aucun soin pour vos barrières. Ne faites pas la course contre un deck qui soigne si vous n'êtes pas déjà devant sur le plateau.

## Conquest et le tag « compétitif »

Le deck est déclaré à la fois pour la ladder et pour le jeu compétitif. Le Conquest, format utilisé pour la première fois au Big Bob's Playtest Battle, est aussi le format de la [Crimson Cup](/fr/news/crimson-cup-format-check-in) au Steam Next Fest : vous inscrivez trois decks avec des Légendaires différentes, avec au moins 8 cartes uniques entre chaque paire de decks (règles annoncées le 24 septembre 2026). 3 Pigs Mid Range se marie naturellement avec l'autre liste du même auteur, [Healing Healsing](/fr/decks/community/healing-healsing-9411) : des Légendaires différentes, et la seule carte qu'ils partagent est Ali Baba, donc ils diffèrent de douze cartes uniques, Légendaire comprise. Le [Deck builder](/fr/deck-builder) compte la différence pour vous en mode tournoi.
`,
  },
  "healing-healsing-guide": {
    title: "Healing Healsing : comment jouer le deck contrôle de Van Helsing",
    metaTitle: "Guide du deck Van Helsing : Healing Healsing",
    excerpt: "Plan de jeu, mulligan et déroulé manche par manche de Healing Healsing, le deck contrôle de Van Helsing qui soigne, pioche et remet le plateau à zéro.",
    faq: [
      {
        q: "Quelle Légendaire mène Healing Healsing ?",
        a: "Van Helsing, un 3/4 à 4 mana : avant chaque combat, il ajoute Van Helsing's Tools à votre main si vous ne l'avez pas, une carte « Choisissez » qui joue Holy Water, Silver Bullet, Garlic ou Wooden Stake.",
      },
      {
        q: "Que gardez-vous au mulligan ?",
        a: "Gardez Ali Baba, Baby Bear, Scarecrow, Van Helsing et Spellbook ; contre l'aggro, gardez aussi Jill. Shahrazad et Phuong Hoang ne sont pas ce que vous voulez dans les premières manches.",
      },
      {
        q: "Quand lancer Forbidden Knowledge ?",
        a: "À huit mana, donc à partir de la manche huit ou neuf, idéalement dans une manche où l'adversaire révèle en premier : il engage ses cartes, puis le sort détruit tous les personnages du plateau.",
      },
      {
        q: "Comment le deck gagne-t-il s'il détruit aussi son propre plateau ?",
        a: "Grâce à l'avantage de cartes : Spellbook, Scarecrow et Ali Baba gardent la main pleine, Baby Bear laisse Papa Bear derrière lui quand il meurt, Jekyll devient Hyde en main, et les soins font grandir Phuong Hoang jusqu'à ce que l'adversaire n'ait plus de réponses.",
      },
    ],
    body: `
**Rédigée avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Le deck en un paragraphe

**Healing Healsing** a été le premier deck publié sur OriginsMeta, le 15 septembre 2026, par [Davdas](/fr/authors/davdas), membre du staff du site. C'est une liste **contrôle** menée par [Van Helsing](/fr/cards/van-helsing), étiquetée pour le **ladder**. Le plan : survivre aux premières manches en prenant de la valeur, soigner les dégâts pendant que [Phuong Hoang](/fr/cards/phuong-hoang) grandit à chaque soin, et remettre le plateau à zéro avec [Forbidden Knowledge](/fr/cards/forbidden-knowledge) une fois à huit mana. La liste complète, les graphiques de composition et le code du jeu sont sur la [page du deck](/fr/decks/community/healing-healsing-9411) ; ce guide explique comment le piloter. Un second guide couvre [les matchups, les interactions clés et les erreurs à éviter](/fr/guides/healing-healsing-matchups).

## La liste

Vingt-cinq cartes : la Légendaire plus douze cartes jouées en deux exemplaires chacune.

| Carte | Coût | Rôle |
| --- | --- | --- |
| [Van Helsing](/fr/cards/van-helsing) ★ | 4 | Légendaire : avant le combat, il ajoute Van Helsing's Tools à votre main si vous ne l'avez pas |
| [Baby Bear](/fr/cards/baby-bear) | 2 | Frappe les ennemis qui endommagent votre barrière ; À la mort, ajoute Papa Bear à votre main |
| [Scarecrow](/fr/cards/scarecrow) | 2 | À la révélation : piochez une carte |
| [Shahrazad](/fr/cards/shahrazad) | 2 | 1/4 : soigne 1 dégât à votre barrière chaque fois qu'une carte entre dans votre main |
| [Ali Baba](/fr/cards/ali-baba) | 3 | 2/3 qui pioche une carte quand il endommage la barrière de l'adversaire |
| [Jill](/fr/cards/jill) | 3 | 2/4 : soigne 2 dégâts à votre barrière chaque fois qu'elle subit des dégâts |
| [Spellbook](/fr/cards/spellbook) | 4 | Pour le reste de la partie, un sort aléatoire en main au début de chaque manche |
| [Phuong Hoang](/fr/cards/phuong-hoang) | 4 | Renaissance, Déplacer ; gagne +1/+1 chaque fois qu'un allié ou une barrière est soigné |
| [Jekyll](/fr/cards/jekyll) | 4 | À la révélation, soigne 3 ; s'il est encore en main après le combat, il devient Hyde, un 5/3 avec Piétinement |
| [Searing Light](/fr/cards/searing-light) | 4 | 4 dégâts à un ennemi et 4 soins à votre barrière dans ce lieu |
| [Boitata](/fr/cards/boitata) | 5 | 5/5 : les dégâts des sorts et des capacités à vos barrières sont infligés à la place à la barrière de l'adversaire |
| [Tin Woodman](/fr/cards/tin-woodman) | 6 | À la révélation, soigne 8 à n'importe quel autre personnage ou barrière de son lieu |
| [Forbidden Knowledge](/fr/cards/forbidden-knowledge) | 8 | Détruisez tous les personnages |

Neuf unités et trois sorts ; presque tout coûte entre deux et quatre, avec Boitata, Tin Woodman et Forbidden Knowledge au sommet. Trois cartes piochent, cinq soignent, une nettoie le plateau.

## Comment le deck gagne

Le plan de la page du deck, en quatre étapes :

1. **Contrôler les premières manches** en prenant rapidement de la valeur avec Spellbook et Ali Baba.
2. **Atteindre la manche huit ou neuf** et lancer Forbidden Knowledge pour prendre l'initiative. Essayez de le lancer dans une manche où l'adversaire révèle en premier, pour que ses cartes soient sur le plateau quand le sort se résout.
3. **Gagner à l'avantage de cartes et à la valeur.** Le deck adverse devrait s'épuiser pendant que vous avez encore assez de soins pour faire monter les dégâts de Phuong Hoang.
4. **Garder le contrôle.** Les cartes supplémentaires vous permettent de tenir le plateau longtemps.

Deux moteurs font tourner le tout. Le premier, ce sont les **cartes qui entrent dans votre main** : Van Helsing ajoute ses Tools avant chaque combat, Spellbook ajoute un sort au début de chaque manche, Scarecrow et Ali Baba piochent, et chacune de ces cartes soigne 1 grâce à Shahrazad. Le second, ce sont les **soins** : chaque soin, du point unique de Shahrazad aux huit de Tin Woodman, donne +1/+1 à Phuong Hoang. Une Phuong présente sur le plateau depuis quelques manches est la vraie menace du deck, et elle porte aussi les mots-clés Renaissance et Déplacer (voir sa page).

## Van Helsing's Tools

La Légendaire elle-même est un 3/4 pour quatre mana. Ce qui compte, c'est la carte que Van Helsing ajoute avant chaque combat quand vous ne l'avez pas déjà : [Van Helsing's Tools](/fr/cards/van-helsings-tools), gratuite depuis le patch 0.6.2, vous laisse choisir un effet parmi quatre.

- [Holy Water](/fr/cards/holy-water) : retirez toutes les capacités à n'importe quel personnage.
- [Silver Bullet](/fr/cards/silver-bullet) : des dégâts à n'importe quel personnage.
- [Garlic](/fr/cards/garlic) : Étourdissez n'importe quel personnage.
- [Wooden Stake](/fr/cards/wooden-stake) : détruisez n'importe quel personnage blessé.

« Si vous ne l'avez pas » est la clause à retenir : utilisez les Tools à chaque manche, sinon Van Helsing cesse de les ajouter. Wooden Stake est la suppression ciblée qui, selon la page du deck, manque autrement à la liste : blessez un personnage avec la frappe de Baby Bear, Searing Light ou la Silver Bullet, puis plantez-lui le pieu.

## Mulligan

Gardez **Ali Baba, Baby Bear, Scarecrow, Van Helsing et Spellbook**. Contre les decks agressifs, gardez aussi **Jill** : elle soigne 2 dégâts à votre barrière chaque fois qu'elle subit des dégâts. Shahrazad et Phuong Hoang ne servent à rien dans les premières manches : elles sont la récompense, pas la mise en place, alors renvoyez-les dans le deck.

## Manche par manche

1. **Manches 1–3 : mise en place.** Scarecrow ou Baby Bear à deux, Spellbook ou Ali Baba à trois. Spellbook est le meilleur coup de la manche trois : à partir de là, vous commencez chaque manche avec un sort de plus, et Shahrazad transforme chacun d'eux en soin.
2. **Manches 4–5 : Van Helsing et les premiers soins.** Van Helsing à quatre, ou Jekyll pour soigner une unité ou une barrière endommagée. Phuong Hoang arrive dès qu'au moins une source de soins est sur le plateau. Boitata à cinq : à partir de là, les dégâts des sorts et des capacités à l'une de vos barrières sont infligés à la place à la barrière de l'adversaire dans ce lieu.
3. **Manches 6–7 : stabiliser.** Les huit points de soin de Tin Woodman sur la barrière sous pression, Searing Light sur la plus grosse menace, les Tools à chaque combat.
4. **Manche 8 ou 9 : Forbidden Knowledge.** Tout meurt, des deux côtés. Votre côté perd moins : Baby Bear vous laisse Papa Bear en main, un Jekyll gardé en main est déjà devenu Hyde, les Tools reviennent avant le combat suivant, et vous avez pioché plus de cartes que l'adversaire pendant toute la partie.

## Pour aller plus loin

- La [page du deck](/fr/decks/community/healing-healsing-9411) a la liste avec les graphiques de courbe de mana et de mots-clés, les notes de l'auteur, le bouton « Ouvrir dans le Deck builder » vers le [Deck builder](/fr/deck-builder) et le code du jeu (KGBLDC…) à coller dans Origins.
- [Matchups, interactions clés et erreurs à éviter](/fr/guides/healing-healsing-matchups) est la seconde partie de ce guide.
- Les statistiques des cartes sont celles du patch de la démo du 21 septembre 2026, vérifiées dans le jeu le 22 septembre, avec les changements du [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : Spellbook coûte désormais quatre mana, et les sorts qu'il ajoute ne peuvent plus être Spellbook. Scarecrow, Van Helsing's Tools et d'autres cartes de cette liste ont changé dans les patchs 0.6.2 et 0.6.3, et depuis le 21 septembre Wooden Stake peut aussi cibler des personnages à pleine Santé : voir l'historique d'équilibrage sur la page de chaque carte.
`,
  },
  "healing-healsing-matchups": {
    title: "Healing Healsing : matchups, interactions clés et erreurs à éviter",
    metaTitle: "Matchups de Healing Healsing, deck Van Helsing",
    excerpt: "Seconde partie du guide Healing Healsing : les interactions de soin et de pioche, les principaux matchups, les erreurs qui perdent contre l'aggro, Conquest.",
    faq: [
      {
        q: "Quelle est l'interaction la plus forte de Healing Healsing ?",
        a: "Shahrazad avec Van Helsing et Spellbook : les Tools avant chaque combat et le sort au début de chaque manche soignent 1 chacun grâce à Shahrazad, et chaque soin donne +1/+1 à Phuong Hoang.",
      },
      {
        q: "Comment jouer contre 3 Pigs Mid Range ?",
        a: "Ne remplissez pas une ligne : Ellen Trechend grandit pour chaque carte ennemie dans son lieu. Gardez Boitata pour les Lightning Strike, soignez les dégâts de Piétinement des cochons et réservez Forbidden Knowledge pour la manche qui suit l'arrivée des Pigs.",
      },
      {
        q: "Qu'est-ce qui fait perdre des parties avec ce deck ?",
        a: "Lancer Forbidden Knowledge trop tôt, laisser Van Helsing's Tools en main de sorte qu'il cesse de les ajouter, et jouer Phuong Hoang avant qu'il y ait quelque chose à soigner.",
      },
    ],
    body: `
**Rédigée avant le patch 0.7.** Ce deck et ce guide ont été publiés avant le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026 : la liste et le plan de jeu ne sont pas canoniques pour la 0.7. Les tableaux de cartes montrent les coûts et les statistiques d'aujourd'hui.

## Avant de commencer

Voici la seconde partie du guide de **Healing Healsing**, le deck contrôle de Van Helsing que [Davdas](/fr/authors/davdas), du staff d'OriginsMeta, a publié le 15 septembre 2026 comme premier deck de la communauté du site. La [première partie](/fr/guides/healing-healsing-guide) couvre la liste, le plan de jeu, le mulligan et le déroulé manche par manche. Ici, nous regardons les interactions qui décident des parties, les matchups et les erreurs qui coûtent le plus cher. Les notes de l'auteur sont sur la [page du deck](/fr/decks/community/healing-healsing-9411) ; la lecture des matchups ci-dessous est celle d'OriginsMeta, fondée sur les textes des cartes du patch 0.6.3 ; les changements du patch de la démo du 21 septembre et du [patch 0.7](/fr/news/patch-0-7) du 29 septembre, qui a porté Spellbook à quatre mana, sont dans [MetaShifting](/fr/metashifting).

## Cinq interactions à connaître

1. **Shahrazad et tout ce qui met une carte dans votre main.** [Shahrazad](/fr/cards/shahrazad) soigne 1 dégât à votre barrière dans son lieu chaque fois qu'une carte entre dans votre main. Van Helsing ajoute ses Tools avant chaque combat, Spellbook ajoute un sort au début de chaque manche, Scarecrow et Ali Baba piochent, la mort de Baby Bear ajoute Papa Bear. Avec Shahrazad et Van Helsing sur le plateau, vous soignez à chaque manche sans dépenser une carte.
2. **Chaque soin nourrit Phuong Hoang.** [Phuong Hoang](/fr/cards/phuong-hoang) gagne +1/+1 chaque fois qu'un allié ou une barrière est soigné. La capacité À la révélation de Tin Woodman est un seul soin de huit points, donc un seul +1/+1 ; les nombreux petits soins de Shahrazad valent plus pour Phuong qu'un seul gros.
3. **Jekyll et Hyde.** La capacité À la révélation de [Jekyll](/fr/cards/jekyll) soigne 3 à n'importe quel autre personnage ou barrière de son lieu. Gardé en main après le combat, il devient [Hyde](/fr/cards/hyde), un 5/3 avec Piétinement, et un Hyde gardé en main redevient Jekyll : la même carte est un soigneur ou un finisseur selon le moment où vous la jouez.
4. **Boitata contre le burn.** Si un sort ou une capacité devait endommager l'une de vos barrières, [Boitata](/fr/cards/boitata) inflige ces dégâts à la place à la barrière de l'adversaire dans ce lieu. Contre les decks qui finissent les parties avec Lightning Strike ou Searing Light, Boitata fait de leur portée la vôtre.
5. **La famille de Baby Bear.** [Baby Bear](/fr/cards/baby-bear) frappe tout ennemi qui endommage votre barrière dans son lieu et, quand il meurt, ajoute [Papa Bear](/fr/cards/papa-bear) à votre main ; Papa Bear frappe plus fort et ajoute [Mama Bear](/fr/cards/mama-bear) quand il meurt, et Mama Bear détruit les ennemis qui endommagent votre barrière. Trois corps pour une seule carte à deux mana, et la meilleure chose à avoir sur le plateau quand Forbidden Knowledge se résout.

## Matchups

Les données du mode classé ne sont pas encore publiques : ce qui suit est une lecture des listes, pas un win rate.

**Contre 3 Pigs Mid Range ([l'autre deck](/fr/decks/community/3-pigs-mid-range-6311) du même auteur) et les autres listes midrange.** Leur finisseur, Ellen Trechend, grandit pour chaque carte ennemie dans son lieu : répartissez vos unités au lieu d'empiler une ligne. Les Lightning Strike d'Impundulu sont exactement ce pour quoi Boitata existe. Axe Throw inflige quatre dégâts, soit exactement la Santé de Van Helsing : attendez-vous à ce qu'on lui trouve une réponse, et ne comptez pas sur lui seul pour la suppression. Les Pigs arrivent à sept mana et remplissent chaque ligne de Piétinement : c'est la manche pour laquelle garder Forbidden Knowledge, une manche plus tard.

**Contre les decks aggro et les decks qui s'étalent.** C'est le matchup que la note sur le mulligan a en tête quand elle dit de garder Jill : chaque fois qu'elle subit des dégâts, elle soigne 2 à votre barrière. Baby Bear punit chaque attaquant qui passe, Jekyll soigne ce qui compte, les huit points de Tin Woodman remettent une barrière à neuf. Ne chassez pas leurs unités une par une avec les Tools ; stabilisez la barrière, atteignez huit mana et laissez Forbidden Knowledge emporter tout le plateau.

**Contre les autres decks contrôle.** L'avantage de cartes décide, et ce deck pioche plus que la plupart : Spellbook est la carte à protéger et à jouer en premier. Gardez Hyde pour une ligne laissée vide, et réservez Holy Water à une Légendaire dont la capacité porte le deck adverse, comme [Mulan](/fr/cards/mulan), qui répète les capacités À la révélation de ses alliés, ou la [Queen of Hearts](/fr/cards/queen-of-hearts), qui répète leurs capacités À la mort.

## Erreurs à éviter

- **Lancer Forbidden Knowledge trop tôt.** Le conseil de la page du deck est d'attendre une manche où l'adversaire révèle en premier, pour que ses cartes soient sur le plateau quand il se résout. Un nettoyage sur une ligne vide, ce sont huit mana gaspillés.
- **Laisser les Tools en main.** Van Helsing ne les ajoute que si vous ne les avez pas. Utilisez-les à chaque combat, même sur une petite cible.
- **Phuong Hoang avant les soins.** Un 2/3 pour quatre mana sans rien pour grandir est une carte faible ; la même carte, une fois Shahrazad et Spellbook en place, est la condition de victoire. La note sur le mulligan la range, avec Shahrazad, parmi les cartes à ne pas garder dans la main de départ.
- **Traiter la pioche comme un luxe.** La page du deck prévient que « ne pas trouver Forbidden Knowledge quand vous en avez besoin peut être très douloureux » : Scarecrow, Ali Baba et Spellbook sont le moyen de le trouver, alors jouez-les tôt même quand le plateau ne l'exige pas.

## Conquest

Le deck n'est étiqueté que pour le ladder, mais il s'intègre dans une sélection Conquest : une Légendaire différente de celle de 3 Pigs Mid Range et une seule carte en commun, Ali Baba, donc les deux listes diffèrent de douze cartes uniques, Légendaire comprise : plus que les 8 que la [Crimson Cup](/fr/news/crimson-cup-format-check-in) exige entre chaque paire de decks. Le [Deck builder](/fr/deck-builder) compte la différence en mode tournoi.
`,
  },
  "roadmap-and-dates": {
    title: "Roadmap et dates : de la démo au lancement",
    metaTitle: "Origins TCG : roadmap et dates de sortie",
    excerpt: "Toutes les dates confirmées d'Origins TCG, du premier post Steam à la mise à jour Demo 2.0 et à la Crimson Cup du Next Fest, plus ce qui est prévu pour 2027.",
    faq: [
      {
        q: "Quand Origins TCG sort-il sur Steam ?",
        a: "La page de la boutique Steam indique la sortie pour le quatrième trimestre 2026, sans date plus précise. La démo a reçu sa première grosse mise à jour le 21 septembre 2026, et le mode classé s'active avec le Steam Next Fest, du 19 au 26 octobre 2026.",
      },
      {
        q: "Quand a lieu la Crimson Cup ?",
        a: "Du 19 au 25 octobre 2026, pendant le Steam Next Fest : cinq qualifications régionales du 19 au 22, puis playoffs le 24 et finales le 25. Les prix valent 10 000 dollars et comprennent une carte promo 1/1 exclusive.",
      },
      {
        q: "Existe-t-il une version mobile d'Origins TCG ?",
        a: "Pas encore. La version mobile et l'ouverture de boosters sur téléphone sont annoncées pour 2027. Le jeu a connu un soft launch sur l'App Store dans certaines régions en novembre 2025, avant que le studio ne déplace l'échange de cartes sur Steam.",
      },
      {
        q: "Quand la démo gratuite est-elle sortie ?",
        a: "Les 15 et 16 juillet 2026, sur Steam, avec des objets de collection exclusifs pour les joueurs de la démo. Le ladder classé est arrivé plus tard, avec le patch 0.6.1 du 14 août 2026.",
      },
    ],
    body: `
## Avant la démo

- **Août 2025.** Koin Games et Immutable annoncent « Project O », un TCG compétitif conçu pour le mobile avec une vraie propriété des cartes.
- **Novembre 2025.** Soft launch sur l'App Store dans certaines régions (version 0.1.0).
- **Début 2026.** Le studio déplace l'échange de cartes sur le marché Steam et abandonne le modèle on-chain autonome.
- **Mars 2026.** Le CEO est filmé avec des cartes physiques en métal. Aucun produit ni aucune date n'ont été annoncés.

## 2026, mois par mois

| Date | Ce qui s'est passé |
| --- | --- |
| 6 mai | La page Steam est en ligne, la liste de souhaits ouvre |
| 3 juin | Le Discord officiel ouvre à tous |
| 15–16 juillet | Démo gratuite sur Steam avec des objets de collection exclusifs |
| 21 juillet | Premiers chiffres : plus de 1 000 joueurs, plus de 13 000 parties, 1 h 51 min de temps de jeu médian |
| 22 juillet | AMA avec le CEO Tim Jooste et le directeur du design Kevin Lambert |
| 24 juillet | Premier tournoi de la démo |
| 24–26 juillet | Origins à la Card Party de Fort Lauderdale |
| 7 août | Premier playtest « Demo 2.0 » : 5 nouveaux decks, plus de 70 cartes, construction de decks |
| 14 août | [Patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414) : ladder classé |
| 19 août | AMA sur le Creator Program |
| 21 août | [Patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) : 23 cartes rééquilibrées |
| 27 août | [Patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 28 août | Big Bob's Playtest Battle, premier tournoi Conquest, plus de 130 inscrits |
| 9 septembre | [Le tournoi du Next Fest est annoncé](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 10 septembre | AMA sur le Kickstarter sur le Discord officiel : Alpha Edition, raretés, gradation, échanges, remise VIP |
| 17 septembre | [Le CEO de Koin Games donne la date du Kickstarter](https://x.com/TimothyJooste/status/2100700207285445011) : la campagne de l'Alpha Edition ouvre le 27 octobre |
| 21 septembre | [Première grosse mise à jour de la démo](https://store.steampowered.com/news/app/4429430/view/1844115010502611) : nouvelle interface et nouveau plateau, tutoriel pour collectionneurs, boosters d'essai, changements d'équilibrage, liste provisoire des cartes de la Crimson Cup |
| 24 septembre | [Règles de la Crimson Cup](/fr/news/crimson-cup-format-check-in) : Conquest à trois decks, check-in |
| 29 septembre | [Patch 0.7](/fr/news/patch-0-7), le dernier patch d'équilibrage avant la Crimson Cup : rework de Twister Toss, Bagheera, Mind Palace et Spellbook coûtent un de plus, les lieux ont une rareté, 13 langues |

## Ce qui vient ensuite

- **19–26 octobre 2026.** Steam Next Fest : le mode classé s'active dans la démo, avec des récompenses classées exclusives.
- **19–25 octobre 2026.** La Crimson Cup, le tournoi du Steam Next Fest : cinq qualifications régionales du 19 au 22, puis playoffs et finales. Des prix d'une valeur de 10 000 dollars, dont une carte promo 1/1 exclusive.
- **27 octobre 2026.** Le Kickstarter de l'Alpha Edition, annoncé par le CEO de Koin Games le 17 septembre ; le menu principal de la démo l'affiche aussi comme « Coming soon – Oct 27 ». Tout ce qu'il faut savoir dans notre [guide du Kickstarter](/fr/guides/origins-tcg-kickstarter).
- **Quatrième trimestre 2026.** Sortie sur Steam, selon la page de la boutique, qui ne donne pas de date plus précise.
- **2027.** Version mobile et ouverture de boosters sur téléphone. Dans les AMA, l'équipe a décrit un lancement complet avec l'ensemble des Légendaires, dont King Arthur, Dracula, Winnie-the-Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein et Sherlock Holmes.

Les dates viennent des posts officiels sur Steam, du Discord du studio et, pour le Kickstarter, du post du CEO de Koin Games et du menu de la démo. Nous mettons cette page à jour quand elles changent.
`,
  },
  "collector-economy": {
    title: "Deux façons de collectionner : comment fonctionne l'économie d'Origins",
    metaTitle: "Origins TCG : l'économie de collection",
    excerpt: "Les cartes compétitives sont gratuites. Celles de collection sont limitées, gradées et échangeables sur Steam. Ce qui est confirmé, et ce qui ne l'est pas.",
    faq: [
      {
        q: "Les cartes de collection rendent-elles un deck plus fort ?",
        a: "Non. Chaque carte compétitive se gagne en jeu, et les versions de collection sont des éditions limitées des mêmes cartes : numérotées, gradées numériquement et échangeables, mais elles se jouent exactement de la même façon.",
      },
      {
        q: "Qu'est-ce que l'Alpha Edition ?",
        a: "Myths & Legends: Alpha Edition est la première édition de collection, vendue uniquement en précommande : boosters de cinq cartes, boîtes de 24 boosters et cases de six boîtes, sur sept niveaux de rareté, de la Collectible Card (dans chaque booster) à la Storybook (1 booster sur 1 200), selon la page officielle de préinscription. Une fois le tirage terminé, plus aucune boîte Alpha n'est produite.",
      },
      {
        q: "Où peut-on échanger les cartes d'Origins ?",
        a: "Sur le Marché de la communauté Steam et les places de marché connectées, une fois le jeu complet sorti. Les objets de collection que vous gagnez aujourd'hui dans la démo deviendront échangeables à ce moment-là.",
      },
      {
        q: "Qu'est-ce qu'un God pack ?",
        a: "Un booster rare dans lequel chaque carte est Légendaire ou mieux. Les versions de collection portent aussi un grade : à la Card Party de juillet 2026, l'équipe remettait un Slab à quiconque tirait une Alternate Art 10/10.",
      },
    ],
    body: `
## La séparation

Origins sépare deux choses que la plupart des jeux de cartes mélangent :

1. **Jouer.** Chaque carte compétitive se gagne en jeu. Rien de ce que vous achetez ne rend votre deck plus fort.
2. **Collectionner.** Des versions en édition limitée des cartes existent en tirages numérotés, arrivent **gradées numériquement** et peuvent être achetées, vendues et échangées avec d'autres joueurs.

Les écrans de chargement du studio parlent eux-mêmes de « real collecting in digital » et de « two ways to collect ».

## Ce qui est confirmé

- **Cartes gradées.** Les versions de collection portent un grade ; à la Card Party de juillet, l'équipe a remis un Slab à quiconque tirait une **Alternate Art 10/10**. Des grades plus bas et des séries différentes existent et valent des montants différents.
- **God packs.** Des boosters rares dans lesquels chaque carte est Légendaire ou mieux.
- **Alpha Edition.** La première édition de collection, « Myths & Legends: Alpha Edition », est vendue uniquement en précommande : boosters de cinq cartes, boîtes de 24 boosters et cases de six boîtes, avec sept niveaux de rareté, de la Collectible Card (dans chaque booster) à la Storybook (1 booster sur 1 200), selon la [page officielle de préinscription](https://founder.origins-tcg.com). Une fois le tirage terminé, plus aucune boîte Alpha n'est produite. Le set Alpha a été l'un des sujets de l'AMA sur le Kickstarter du 10 septembre 2026 sur le Discord officiel.
- **Échanges sur Steam.** Les cartes et les produits scellés s'échangeront sur le Marché de la communauté Steam et les places de marché connectées une fois le jeu complet sorti. Les objets de collection de la démo gagnés aujourd'hui deviendront échangeables à ce moment-là.
- **Mobile plus tard.** L'ouverture de boosters sur téléphone est prévue pour 2027.

## Ce qui n'est pas encore confirmé

- Les prix en euros des boosters et des boîtes hors de la précommande Alpha.
- Les frais de place de marché au-delà de ceux, standard, de Steam.
- Si les cartes physiques en métal, montrées par le CEO en mars 2026, seront un jour vendues.

## Pourquoi c'est important pour la meta

Comme les cartes de collection sont cosmétiques, une tier list n'a à se soucier que de la carte elle-même, jamais de la version. OriginsMeta suivra les prix du Marché Steam dès le premier jour où des objets seront mis en vente, pour que la collection ait les mêmes données que le jeu.
`,
  },
  "steam-next-fest-2026": {
    title: "Origins TCG au Steam Next Fest 2026 : Demo 2.0, dates et tournoi",
    metaTitle: "Origins TCG au Steam Next Fest 2026 : dates",
    excerpt: "Origins TCG au Steam Next Fest, du 19 au 26 octobre 2026 : le mode classé dans la démo, la Crimson Cup du 19 au 25 octobre, les prix et comment s'inscrire.",
    faq: [
      {
        q: "Quand a lieu le Steam Next Fest d'octobre 2026 ?",
        a: "Du lundi 19 octobre à 10:00, heure du Pacifique (13:00 heure de l'Est, 18:00 au Royaume-Uni, 19:00 en Europe centrale), au lundi 26 octobre 2026. Origins TCG y participe avec sa démo gratuite, mise à jour les 21 et 29 septembre, et le mode classé s'active avec le festival.",
      },
      {
        q: "Quand a lieu le tournoi d'Origins TCG ?",
        a: "Du 19 au 25 octobre 2026 : cinq qualifications de 512 places entre le 19 et le 22 (deux AMER, deux EMEA, une APAC), puis playoffs le 24 et finales le 25.",
      },
      {
        q: "Puis-je participer à une qualification depuis l'Europe ?",
        a: "Oui. Koin Games dit que vous pouvez rejoindre n'importe laquelle des qualifications, où que vous habitiez, mais demande de ne vous inscrire qu'à celles auxquelles vous pouvez vraiment participer.",
      },
      {
        q: "Est-ce payant ?",
        a: "Non. La démo est gratuite sur Steam et l'inscription au tournoi se fait sur le Discord officiel. Origins TCG est free-to-compete : chaque carte compétitive se gagne en jouant.",
      },
      {
        q: "Qu'est-ce que le format Conquest ?",
        a: "À la Crimson Cup, chaque joueur soumet trois decks, avec au moins 8 cartes uniques entre deux d'entre eux. Les listes restent cachées jusqu'au top 4 : quand vous bannissez un des decks de votre adversaire, vous n'en voyez que la Légendaire. Dans les matchs au meilleur des cinq manches, il n'y a pas de ban et vous devez gagner avec les trois decks. Koin Games a testé le format pour la première fois à Big Bob's Playtest Battle, le 28 août.",
      },
    ],
    body: `
## Les deux dates à retenir

- **Steam Next Fest, édition d'octobre 2026 : 19–26 octobre.** Le [festival de démos jouables de Valve](https://store.steampowered.com/sale/nextfest) va du lundi 19 octobre à 10:00, heure du Pacifique (13:00 heure de l'Est, 18:00 au Royaume-Uni, 19:00 en Europe centrale), au lundi 26 octobre. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) y participe avec sa démo gratuite, qui a reçu sa première grosse mise à jour le 21 septembre : avec le festival, Koin active le **mode classé**, avec des récompenses classées exclusives.
- **Tournoi d'Origins TCG : 19–25 octobre.** Koin Games l'appelle « notre plus grand tournoi à ce jour » : un événement sur plusieurs jours qui enchaîne Qualification → Playoffs → Finales, entièrement en ligne et dans le jeu.

## Ce que la démo apporte au festival

La grosse mise à jour de la démo testée dans trois playtests fermés en août (patchs [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) et [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), tous suivis dans notre [MetaShifting](/fr/metashifting)) est arrivée en avance, le [21 septembre 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611) : nouvelle interface et nouveau plateau, un tutoriel pour collectionneurs, des boosters d'essai à ouvrir, de nouvelles répliques vocales, des changements d'équilibrage et la liste provisoire des cartes de la Crimson Cup, pour que vous puissiez déjà construire des decks pour le tournoi. La progression est reprise de la démo ou du playtest, selon celle qui est la plus avancée.

Les decks, les cartes et les boss des playtests sont maintenant dans la démo gratuite, et la construction de decks aussi : chacun construit son propre deck de 25 cartes (une Légendaire plus douze cartes, chacune jouée en deux exemplaires). Notre [base de données des cartes](/fr/cards) a les 122 cartes vérifiées dans le jeu le 22 septembre.

Avec le début du Steam Next Fest, Koin active le **mode classé**, « qui viendra avec des récompenses classées exclusives » (post Steam du 21 septembre). Les playtests avaient des divisions jusqu'à Grandmaster et un classement mondial : ce qui est confirmé à ce jour est dans notre [guide du mode classé d'Origins TCG](/fr/guides/origins-tcg-ranked). Nous publierons chaque changement le jour où il arrive.

## Le tournoi, étape par étape

1. **Qualifications, 19–22 octobre.** Cinq, de 512 places chacune et avec 32 qualifiés dans chacune : AMER le 19 à 19:00 EST, EMEA le 20 à 19:00 CEST, AMER le 21 à 21:00 EST, APAC le 22 à 19:00 SGT et EMEA le 22 à 19:00 CEST, plus 96 wild cards. La qualification AMER du 19 et l'EMEA du 22 ont été ajoutées le 5 octobre, quand le calendrier officiel a aussi déplacé l'AMER du 21 à 21:00 EST avec 32 qualifiés au lieu de 64, et les wild cards de 128 à 96 ([notre article](/fr/news/crimson-cup-prizepool-qualifiers)). Dans les mots de Koin, « vous pouvez rejoindre N'IMPORTE LAQUELLE des qualifications, où que vous habitiez » : choisissez celle dont l'horaire vous convient, et ne vous inscrivez qu'à celles que vous jouerez vraiment ; vous pouvez en jouer plus d'une.
2. **Playoffs et finales, 24–25 octobre.** La phase de playoffs a 256 places le 24 (10:00 EST / 16:00 CEST / 22:00 SGT) et quatre joueurs en sortent pour les finales du 25 à 10:00 EST (15:00 CET / 22:00 SGT). Attention aux horloges : l'Europe quitte l'heure d'été dans la nuit du 24 tandis que les États-Unis la gardent jusqu'au 1er novembre, donc le même horaire de départ de la côte Est tombe une heure plus tôt sur les horloges européennes le dimanche. Les créateurs de contenu reçoivent des invitations wildcard directement pour les playoffs (demandez sur Discord).
3. **Format.** Officiel, d'après les annonces des 9 et 24 septembre : **Conquest à trois decks**, avec au moins 8 cartes uniques entre chaque paire de decks ; les listes restent cachées jusqu'au top 4, donc quand vous bannissez un des decks de votre adversaire, vous n'en voyez que la Légendaire. **Matchs au meilleur des trois manches, grande finale au meilleur des cinq** : au meilleur des cinq, il n'y a pas de ban et vous devez gagner avec les trois decks. Les détails dans [notre article sur les règles](/fr/news/crimson-cup-format-check-in).
4. **Check-in.** Il ouvre deux heures avant chaque qualification et ferme cinq minutes avant le début, en même temps que la soumission des decks ; puis une courte fenêtre « premier arrivé, premier servi » donne les places libres aux joueurs en liste d'attente. Sans check-in, vous ne jouez pas : pour la qualification EMEA de 19:00 CEST, faites le check-in entre 17:00 et 18:55.
5. **Quelle version.** Le tournoi se joue sur la démo principale, avec les seules cartes disponibles là : entraînez-vous dessus. Le playtest recevra d'autres mises à jour et sera différent de la version du tournoi. Le dernier patch d'équilibrage avant le tournoi, le [patch 0.7](/fr/news/patch-0-7), est arrivé le 29 septembre 2026, trois semaines avant la première qualification.
6. **Prix.** **Des prix d'une valeur de 10 000 dollars**, dans les mots de Koin, répartis entre argent, objets de collection et cartes promo exclusives. La répartition est arrivée le 5 octobre : le vainqueur reçoit une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars en espèces ; le 2e une carte promo Dracula 1/8, une case et 750 dollars ; les 3e et 4e une carte promo 1/8, deux boîtes de boosters et 350 dollars ; le top 8 une boîte de boosters, une carte promo 1/8 et 125 dollars ; le top 16 une boîte de boosters et une carte Finalist Plus ; le top 32 dix boosters et une carte Finalist ; puis 8, 4 et 2 boosters jusqu'au top 256 ([le tableau complet](/fr/news/crimson-cup-prizepool-qualifiers#prix)). Le tournoi s'appelle la **Crimson Cup** : le nom figure sur l'illustration officielle de Koin, ce n'est pas un surnom de la communauté.
7. **Pool de lieux.** Sept lieux sont exclus du tournoi, « très dépendants du hasard » dans les mots de Koin : Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum et Nostradamus' Call. Les parties en salon de la démo utilisent déjà ce pool : entraînez-vous là. Ce que fait chaque lieu est sur notre page des [Lieux](/fr/locations).
8. **Tournois d'entraînement.** Koin organise des tournois d'entraînement hebdomadaires sans enjeu, annoncés sur Discord, pour jouer contre de vraies personnes plutôt que contre des bots avant la Cup.

Les inscriptions se font sur le [Discord officiel](https://discord.gg/originstcg).

## Comment se préparer en cinq coups

1. [Installez la démo gratuite sur Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) et jouez les missions : elles enseignent les trois lignes et les tours simultanés.
2. Lisez [Origins TCG expliqué en cinq minutes](/fr/guides/origins-tcg-explained) et la [base de données des cartes](/fr/cards) : les statistiques sont celles du patch de la démo du 21 septembre, vérifiées carte par carte dans le jeu, avec par-dessus les changements du patch 0.7 du 29 septembre.
3. Construisez vos trois decks Conquest dans notre [Deck builder](/fr/deck-builder) : il signale deux decks avec la même Légendaire et compte les cartes qui diffèrent entre les decks. Étape par étape, avec de vrais decks de la communauté : [comment construire une sélection Conquest](/fr/guides/origins-tcg-conquest).
4. Étudiez les [decks publiés par la communauté](/fr/decks) : chaque liste vient avec ses graphiques de composition, les notes de l'auteur, un bouton qui l'ouvre dans le Deck builder et le code du jeu à coller dans Origins. Publiez le vôtre avec un guide pour que les autres joueurs puissent le noter.
5. Suivez les [actus](/fr/news) : chaque annonce est résumée dans la journée, avec un lien vers la source.

## Comment OriginsMeta couvrira la semaine

Notre plan, au 25 septembre 2026 : nous publierons une actu par jour pendant le festival, les decks du tournoi avec leurs graphiques de composition dès que les listes seront publiques (à partir du top 4), et la première tier list d'OriginsMeta après les finales de la Crimson Cup du 25 octobre, construite sur les résultats du tournoi et le haut du ladder classé. Sources : les posts officiels sur Steam des 4 août, 25 août, [9 septembre](https://store.steampowered.com/news/app/4429430/view/1843481262690278), [21 septembre](https://store.steampowered.com/news/app/4429430/view/1844115010502611), [29 septembre](https://store.steampowered.com/news/app/4429430/view/1844751498235283) et [5 octobre 2026](https://store.steampowered.com/news/app/4429430/view/1845383656394214), et le [calendrier du Steam Next Fest](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    title: "Origins TCG est-il pay-to-win ? Le free-to-compete expliqué",
    metaTitle: "Origins TCG : pay-to-win ou free-to-compete ?",
    excerpt: "Koin Games présente Origins TCG comme le premier jeu de cartes free-to-compete, à zéro pay-to-win. Ce que l'argent achète vraiment, et les réserves honnêtes.",
    faq: [
      {
        q: "Origins TCG est-il gratuit ?",
        a: "Oui. La démo est gratuite sur Steam depuis le 15 juillet 2026 et le jeu complet est présenté comme free-to-compete : chaque carte dont vous avez besoin pour rivaliser se gagne en jouant.",
      },
      {
        q: "Dois-je acheter des boosters pour gagner ?",
        a: "Non. Selon la page Steam officielle, vous ne rivalisez que par le talent, à zéro pay-to-win. Les boosters payants contiennent des versions de collection des cartes, limitées et gradées numériquement, pas de puissance en plus.",
      },
      {
        q: "Alors, que paie-t-on ?",
        a: "Des produits de collection : des versions en édition limitée, numérotées et gradées des cartes, vendues en boosters, boîtes et cases, qui peuvent être achetées, vendues et échangées avec d'autres joueurs.",
      },
      {
        q: "Puis-je vendre mes cartes ?",
        a: "Koin Games dit que les cartes et les produits scellés seront échangeables sur le Marché de la communauté Steam et les places de marché connectées une fois le jeu complet sorti. Sur Steam, le produit des ventes va dans votre porte-monnaie Steam.",
      },
      {
        q: "Y a-t-il un battle pass ou un boost de progression payant ?",
        a: "Rien de ce genre n'a été annoncé en septembre 2026. Nous mettrons cette page à jour si cela change.",
      },
    ],
    body: `
## La réponse courte

Non, par conception. Sur sa page Steam, Koin Games décrit Origins TCG comme « le premier TCG free-to-compete » où vous « rivalisez par le seul talent (zéro pay-to-win) pour des cartes limitées gradées numériquement que vous pouvez acheter, vendre et échanger ». L'un des écrans de chargement officiels le dit en deux mots : **zero pay-to-win**.

C'est la promesse. Cette page explique ce qu'elle veut dire en pratique et où les doutes honnêtes subsistent.

## Ce que « free-to-compete » veut dire

Origins sépare deux choses que la plupart des jeux de cartes numériques mélangent :

1. **Rivaliser.** Chaque carte dont vous avez besoin pour construire un deck compétitif se gagne en jeu. Les decks du playtest et la [base de données des cartes](/fr/cards) ne contiennent rien que vous puissiez acheter.
2. **Collectionner.** Des versions en édition limitée des mêmes cartes existent en tirages numérotés, arrivent **gradées numériquement** et peuvent être achetées, vendues et échangées. Elles sont cosmétiques : une Mulan gradée se joue exactement comme la Mulan que vous avez gagnée.

Le booster que vous payez est donc un produit de collection, pas un produit de puissance. Le premier, la « Myths & Legends: Alpha Edition », est vendu uniquement en précommande, en boosters de cinq cartes, boîtes de 24 boosters et cases de six boîtes, avec sept niveaux de rareté ; voir [comment fonctionne l'économie d'Origins](/fr/guides/collector-economy).

## La comparaison

Dans Hearthstone ou MTG Arena, les boosters que vous achetez contiennent les cartes avec lesquelles vous jouez, donc dépenser raccourcit le chemin vers la collection complète. Dans Origins, le chemin vers un deck compétitif, c'est jouer ; dépenser achète l'étagère de collection à côté. C'est sur cette différence que repose l'affirmation « zéro pay-to-win ».

## Les réserves honnêtes

- **Le temps reste un coût.** Les cartes gratuites se gagnent en jouant ; combien de parties il faut pour compléter un deck compétitif n'est pas encore publié. La construction de decks est dans la démo depuis la mise à jour du 21 septembre : nous le mesurerons pendant le Steam Next Fest (19–26 octobre), quand le mode classé ouvrira, et publierons les chiffres.
- **Des détails encore à venir.** Les prix hors de la précommande Alpha, les frais de place de marché au-delà de ceux, standard, de Steam et d'éventuels boosts de progression ne sont pas annoncés. Rien ne laisse penser à un battle pass, mais rien ne l'exclut non plus.
- **La valeur sur le marché n'est pas de l'argent.** Vendre sur le Marché de la communauté Steam alimente votre porte-monnaie Steam. Que les places de marché connectées permettent un vrai retrait en espèces n'est pas confirmé.
- **Les boosters sont aléatoires.** Parmi ses descripteurs de contenu, la page Steam liste « In-game purchases » et « Chance based in-game purchases » : ce que contient un booster de collection est laissé au hasard, même si cela ne change jamais la force d'un deck.

## Pourquoi c'est important pour la meta

Comme les versions de collection sont cosmétiques, une tier list n'a à juger que la carte, jamais l'édition, et un deck publié sur OriginsMeta par un joueur qui n'a rien dépensé est aussi fort que celui de n'importe qui. Nous tiendrons cette page à jour à chaque déclaration officielle ; sources : la page Steam d'Origins TCG, les écrans de chargement officiels et les AMA de Koin Games de juillet et août 2026.
`,
  },
  "play-the-demo": {
    title: "Comment télécharger et jouer à la démo d'Origins TCG sur Steam",
    metaTitle: "Jouer à la démo d'Origins TCG sur Steam",
    excerpt: "La démo gratuite en cinq étapes : configuration, téléchargement, langue, premières parties, ce que débloquent les joueurs et la mise à jour du 21 septembre.",
    faq: [
      {
        q: "La démo d'Origins TCG est-elle gratuite ?",
        a: "Oui. Elle est gratuite sur Steam depuis le 15 juillet 2026, pour Windows et macOS.",
      },
      {
        q: "Dans quelles langues la démo est-elle disponible ?",
        a: "Treize depuis le patch 0.7, la mise à jour de la démo du 29 septembre 2026 : anglais, français, italien, allemand, espagnol (Espagne), japonais, coréen, polonais, portugais (Brésil), portugais (Portugal), russe, chinois simplifié et espagnol (Amérique latine). La page Steam, lue le 30 septembre 2026, liste les mêmes 13 pour l'interface, avec l'audio complet en anglais seulement.",
      },
      {
        q: "De quoi ai-je besoin pour la faire tourner ?",
        a: "Au minimum Windows 10 64 bits avec un Intel i3-6100 ou un AMD FX-6300, 8 Go de RAM, une GTX 750 Ti ou une R9 270X et 2 Go d'espace ; sur Mac, macOS 10.14 ou plus récent avec un Apple M1 ou un Intel i5 double cœur et un GPU compatible Metal.",
      },
      {
        q: "La démo donne-t-elle quelque chose pour le jeu complet ?",
        a: "Koin Games a annoncé que les joueurs de la démo gagnent des objets de collection exclusifs qui deviennent échangeables au lancement du jeu complet.",
      },
      {
        q: "Qu'a apporté la mise à jour du 21 septembre ?",
        a: "La première grosse mise à jour de la démo : nouvelle interface et nouveau plateau, un tutoriel pour collectionneurs, des boosters d'essai, de nouvelles répliques vocales, des changements d'équilibrage et la liste provisoire des cartes de la Crimson Cup, avec les decks, les cartes et la construction de decks testés dans les playtests d'août. Le mode classé s'active avec le Steam Next Fest, du 19 au 26 octobre 2026.",
      },
    ],
    body: `
## Ce que vous obtenez

La démo d'Origins TCG est sur Steam depuis le **15 juillet 2026**, gratuite, pour Windows et macOS. Le 25 septembre 2026, elle affichait « Très positives » : 96 % de 184 évaluations. Les parties durent environ sept minutes : les deux joueurs agissent en même temps sur trois lieux, tirés d'un ensemble de plus de cent qui tournent et changent les règles du plateau. La démo comprend le tutoriel, des missions contre des boss dotés de leur propre IA et le jeu en ligne.

Langues : depuis le [patch 0.7](/fr/news/patch-0-7) du 29 septembre 2026, le jeu prend en charge **13 langues** : anglais, français, italien, allemand, espagnol (Espagne), japonais, coréen, polonais, portugais (Brésil), portugais (Portugal), russe, chinois simplifié et espagnol (Amérique latine). La page Steam, lue le 30 septembre 2026, liste les mêmes 13 pour l'interface, avec l'audio complet **en anglais seulement**.

## Configuration requise

| | Minimale | Recommandée |
| --- | --- | --- |
| Windows | Windows 10 64 bits, Intel i3-6100 ou AMD FX-6300, 8 Go de RAM, GTX 750 Ti ou R9 270X | Windows 11 64 bits, Intel i5-8400, 16 Go de RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 ou Intel i5 double cœur 2,5 GHz, GPU compatible Metal | macOS 12 ou plus récent, Apple M1 Pro, 16 Go de RAM |
| Espace | 2 Go | 2 Go |

## Cinq étapes

1. **Installez Steam** et connectez-vous (un compte gratuit suffit).
2. **Ouvrez la [page d'Origins TCG Demo](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** et cliquez sur « Download Origins TCG Demo » ; ou cherchez « Origins TCG » dans Steam et choisissez la Demo. L'installation prend deux ou trois minutes.
3. **Choisissez votre langue** si Steam ne l'a pas fait : clic droit sur le jeu dans votre bibliothèque, Propriétés, Langue. Les voix sont en anglais ; les autres langues traduisent l'interface et les textes.
4. **Jouez le tutoriel**, puis les missions : ils enseignent les trois lignes, les tours simultanés et les mots-clés À la révélation (On Reveal), À la mort (On Death), Première frappe (First Strike), Double attaque (Double Attack) et Contact mortel (Deathtouch). Notre [guide en cinq minutes](/fr/guides/origins-tcg-explained) couvre le même terrain par écrit.
5. **Passez en ligne** et essayez les decks préconstruits. Quand vous en voulez plus, lisez les [decks publiés par la communauté](/fr/decks), reconstruisez-les dans le [Deck builder](/fr/deck-builder) et vérifiez les statistiques actuelles des cartes dans la [base de données des cartes](/fr/cards) (Demo 2.0 avec le patch 0.7 du 29 septembre 2026).

## Ce que les joueurs de la démo débloquent

Dans le post de lancement de juillet, Koin Games a dit que les joueurs de la démo gagnent des **objets de collection exclusifs** qui deviendront échangeables au lancement du jeu complet. Ajoutez le [jeu principal](https://store.steampowered.com/app/4429430/Origins_TCG/) à votre liste de souhaits sur Steam : la page de la boutique indique la sortie pour le quatrième trimestre 2026.

## Ce que la mise à jour du 21 septembre a changé

La démo a reçu sa première grosse mise à jour le [21 septembre 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611) : nouvelle interface et nouveau plateau, un tutoriel pour collectionneurs, des boosters d'essai, de nouvelles répliques vocales, des changements d'équilibrage et la liste provisoire des cartes de la Crimson Cup, avec les decks, les cartes et la construction de decks testés dans les playtests fermés d'août. Votre progression de la démo ou du playtest est conservée, selon celle qui est la plus avancée. Le mode classé s'active avec le Steam Next Fest (19–26 octobre 2026) : tout sur les dates, le tournoi et la préparation est dans notre [page sur le Steam Next Fest 2026](/fr/guides/steam-next-fest-2026). Les playtests des versions plus grandes sont annoncés sur le [Discord officiel](https://discord.gg/originstcg), et jusqu'ici tous ceux qui voulaient participer ont pu le faire.

Sources : les pages Origins TCG et Origins TCG Demo sur Steam (lues les 25 et 30 septembre 2026) et les posts officiels sur Steam des 16 juillet, 4 août, 21 septembre et 29 septembre 2026.
`,
  },
  "origins-tcg-kickstarter": {
    title: "Kickstarter d'Origins TCG : date, préinscription, Alpha Edition et ce que nous savons",
    metaTitle: "Kickstarter d'Origins TCG : date, préinscription, Alpha",
    excerpt: "Kickstarter le 27 octobre 2026, confirmé par Koin Games. Préinscription ouverte : 15 % de remise pour 1 dollar remboursable, boîtes Alpha en précommande.",
    faq: [
      {
        q: "Quand commence le Kickstarter d'Origins TCG ?",
        a: "Le 27 octobre 2026. Le CEO de Koin Games, Tim Jooste, a donné la date sur X le 17 septembre 2026 (« back the Alpha Edition Kickstarter (Oct 27th) »), et le menu principal de la démo affiche le Kickstarter comme « Coming soon – Oct 27 », à côté de « Preregister for 15% off ». Ni l'un ni l'autre ne dit à quelle heure la campagne ouvre : nous l'ajouterons ici dès que Koin le fera.",
      },
      {
        q: "Que donne le dépôt de 1 dollar ?",
        a: "Le statut VIP avec 15 % de remise au lancement. La page officielle précise que le dépôt est intégralement remboursable avant le lancement.",
      },
      {
        q: "Qu'est-ce que l'Alpha Edition ?",
        a: "Origins Myths & Legends Alpha Edition : des boosters de collection de 5 cartes avec au moins une Rare ou mieux garantie, des boîtes de 24 boosters et des cases de 6 boîtes. Les boîtes et les cases sont vendues uniquement en précommande et le tirage ne sera pas répété.",
      },
      {
        q: "Dois-je soutenir le Kickstarter pour rivaliser ?",
        a: "Non. Origins est free-to-compete : le mode classé ne demande aucun achat, et la démo Steam est gratuite. Le Kickstarter concerne la collection, pas la puissance.",
      },
      {
        q: "Où les cartes s'échangent-elles ?",
        a: "Sur le Marché de la communauté Steam et ses places de marché connectées, selon la page officielle. L'ouverture de boosters sur mobile est prévue pour 2027.",
      },
    ],
    body: `## La date : 27 octobre, confirmée par Koin Games {#date}

Le Kickstarter de la **Myths & Legends Alpha Edition** ouvre le **27 octobre 2026**. Le CEO de Koin Games, **Tim Jooste**, a écrit « back the Alpha Edition Kickstarter (Oct 27th) » dans un [post sur X du 17 septembre 2026](https://x.com/TimothyJooste/status/2100700207285445011), que le compte du studio a partagé. La démo dit la même chose : le **25 septembre 2026**, son menu principal affichait l'encart du Kickstarter avec **« Coming soon – Oct 27 »** et **« Preregister for 15% off »**, tandis que l'écran de chargement fait la publicité de l'Alpha Edition. Ni l'un ni l'autre ne dit à quelle heure la campagne ouvre, et le 28 septembre 2026 la [page de préinscription](https://founder.origins-tcg.com) ne mentionnait pas encore la date : nous ajouterons l'heure et le lien vers la campagne dès que Koin les publiera.

*Mise à jour du 28 septembre 2026 : la date est confirmée par le CEO de Koin Games. La mise à jour du 25 septembre avait ajouté la date affichée dans la démo, les sujets de l'AMA d'après l'annonce officielle et la chronologie corrigée.*

## Ce qui a été annoncé

Koin Games tient une page officielle **Kickstarter Early Access** sur [founder.origins-tcg.com](https://founder.origins-tcg.com). Le **10 septembre 2026**, l'équipe a répondu aux questions sur la campagne lors d'un AMA sur le Discord officiel ; l'annonce du lendemain en liste les sujets : gradation numérique, rareté des cartes, fonctionnement des échanges, cartes avec erreurs, God packs, 1/1 de tournoi, ce qu'est le set Alpha, les paliers du Kickstarter et comment devenir VIP avec 15 % de remise. Notre [actu sur l'AMA](/fr/news/kickstarter-ama-pre-registration) le résume.

## Préinscription : 15 % de remise pour 1 dollar

- Devenir **VIP** avec un **dépôt de 1 dollar** débloque **15 % de remise au lancement**.
- Le dépôt est **intégralement remboursable avant le lancement**, comme l'indique deux fois la page officielle.
- La préinscription n'engage à aucune contribution : elle réserve seulement le prix early bird.

## L'Alpha Edition

La gamme s'appelle **Origins Myths & Legends Alpha Edition** :

| Produit | Contenu |
| --- | --- |
| Booster de collection | 5 cartes de collection, au moins une Rare ou mieux garantie |
| Boîte de boosters | 24 boosters de collection |
| Case de boosters | 6 boîtes de boosters |

Pour l'Alpha Edition, **les boîtes et les cases sont vendues uniquement en précommande** : une fois ce tirage terminé, aucune boîte ni case Alpha supplémentaire ne sera produite. C'est la logique d'un tirage de première édition dans les jeux de cartes physiques, appliquée à une collection numérique.

## Échanges et propriété

Les cartes peuvent être achetées, vendues et échangées sur le **Marché de la communauté Steam** et ses places de marché connectées. Koin est passé au marché Steam plus tôt cette année, plutôt qu'à un système on-chain indépendant. L'ouverture de boosters sur mobile est prévue pour **2027**.

## Le free-to-compete reste gratuit

Soutenir le Kickstarter achète des objets de collection, pas de la force : le mode classé d'Origins ne demande aucun achat et la démo sur Steam est gratuite. Voir [Origins TCG est-il pay-to-win ?](/fr/guides/is-origins-tcg-pay-to-win) pour la façon dont le côté compétitif et le côté collection restent séparés.

## Chronologie

- 15 juillet 2026 : démo gratuite sur Steam.
- 21 septembre 2026 : première grosse mise à jour de la démo.
- 19–26 octobre 2026 : Steam Next Fest, avec le mode classé dans la démo et la Crimson Cup (19–25 octobre).
- 27 octobre 2026 : Kickstarter de l'Alpha Edition (date donnée par le CEO de Koin Games le 17 septembre et affichée dans le menu de la démo).
- Quatrième trimestre 2026 : sortie sur Steam, selon la page de la boutique.
- 2027 : mobile.

## Que faire maintenant

1. Ajoutez le jeu à votre liste de souhaits sur Steam et jouez à la démo.
2. Si vous voulez la remise de lancement, [préinscrivez-vous sur founder.origins-tcg.com](https://founder.origins-tcg.com) avec le dépôt remboursable.
3. Suivez le Discord officiel pour l'heure du lancement et le lien vers la campagne : nous les ajouterons ici le jour même.

Sources : [page officielle de préinscription](https://founder.origins-tcg.com), [page Steam](https://store.steampowered.com/app/4429430/Origins_TCG/), l'annonce de l'AMA sur le Discord officiel (11 septembre 2026), le [post du CEO de Koin Games sur X](https://x.com/TimothyJooste/status/2100700207285445011) (17 septembre 2026) et le menu principal de la démo (lu le 25 septembre 2026).`,
  },
  "streaming-tools": {
    title: "Streamer Origins TCG : overlay OBS et commande !deck pour le chat",
    metaTitle: "Overlay OBS et commande !deck pour Origins TCG",
    excerpt: "Outils gratuits pour streamer Origins TCG : overlay OBS avec votre deck, commande !deck pour le chat Twitch, liens courts, images de deck et badge LIVE.",
    faq: [
      {
        q: "Dois-je installer quelque chose ?",
        a: "Non. L'overlay est une page web que vous ajoutez à OBS comme source navigateur, et la commande de chat est une ligne pour le bot de votre chaîne Twitch qui pointe vers OriginsMeta.",
      },
      {
        q: "Avec quels bots la commande !deck fonctionne-t-elle ?",
        a: "Nightbot, StreamElements et Fossabot. Votre compte OriginsMeta vous donne la ligne prête pour chacun, avec votre lien déjà dedans.",
      },
      {
        q: "Quelle taille doit avoir l'overlay dans OBS ?",
        a: "360 × 1000 pixels pour l'overlay vertical et 1600 × 300 pour l'horizontal. Le fond est transparent.",
      },
      {
        q: "L'overlay change-t-il quand je publie un nouveau deck ?",
        a: "Oui, si vous utilisez le lien de votre compte : il affiche toujours le deck que vous avez publié le plus récemment et le recharge toutes les minutes.",
      },
    ],
    body: `
## Ce que vous obtenez

OriginsMeta a des outils gratuits pour quiconque streame ou fait des vidéos sur Origins TCG. Ils fonctionnent avec les decks que vous publiez sur le site, et il n'y a rien à installer :

- un **overlay OBS** avec la liste de votre deck sur fond transparent ;
- une **commande !deck** pour votre chat Twitch qui répond avec votre deck ;
- un **lien court** et une **image du deck** pour les descriptions, les miniatures et les stories ;
- un **badge LIVE** à côté de votre nom pendant que vous streamez Origins TCG.

## Avant de commencer

1. Connectez-vous à OriginsMeta (Discord ou e-mail, sans mot de passe) et publiez un deck depuis le [Deck builder](/fr/deck-builder).
2. Ouvrez [votre compte](/fr/account#stream-tools) : le panneau « Outils pour le stream » a les liens de l'overlay et la commande de chat, déjà remplis avec votre nom d'utilisateur.

Les liens de votre compte suivent toujours **le deck que vous avez publié le plus récemment** : publiez-en un nouveau et l'overlay et la commande passent dessus en moins d'une minute. Pour afficher un deck en particulier, ouvrez sa page et utilisez le menu « Pour les streamers » : sur vos propres decks, il a l'overlay et la commande pour ce deck seulement.

## Overlay OBS

1. Copiez l'un des deux liens d'overlay depuis votre compte : vertical ou horizontal.
2. Dans OBS : Sources → + → Navigateur, puis collez le lien.
3. Réglez la taille : **360 × 1000** pour l'overlay vertical, **1600 × 300** pour l'horizontal.

Le fond est transparent et l'overlay recharge le deck toutes les minutes, donc il reste à jour sans toucher à la source. Il affiche le nom du deck, votre nom, la Légendaire et les douze cartes avec leur coût. La langue est celle de la page depuis laquelle vous l'avez copié : pour la changer, mettez lang= à la fin du lien avec en, it ou es.

## La commande !deck pour le chat

Votre compte a la ligne à utiliser pour chaque bot, avec votre lien déjà dedans :

- **Nightbot** et **StreamElements** : tapez la ligne dans votre chat Twitch en tant que propriétaire de la chaîne ou modérateur ;
- **Fossabot** : créez une commande dans son tableau de bord et utilisez la ligne comme réponse.

Si !deck existe déjà sur votre chaîne, écrivez edit au lieu de add. À partir de là, !deck répond dans le chat en une ligne : le nom du deck, la Légendaire, le lien court et le code du jeu à coller dans Origins TCG. Le code n'est omis que lorsqu'une carte du deck n'a pas encore d'ID officiel.

## Lien court et image du deck

Chaque deck a un lien court, originsmeta.com/d/ suivi de l'adresse du deck : dites-le en stream ou mettez-le dans la description de la vidéo, et il ouvre le deck dans la langue du spectateur. Votre profil en a un aussi, originsmeta.com/@ suivi de votre nom d'utilisateur.

Depuis le menu « Pour les streamers » de n'importe quel deck, vous pouvez aussi télécharger une image PNG avec la Légendaire, les douze cartes avec leur coût et le lien court : 16:9 (1280 × 720) pour les miniatures, 9:16 (1080 × 1920) pour les stories et les shorts.

## Badge LIVE

Les Creator, Auteurs, joueurs Pro et Staff qui ajoutent leur chaîne Twitch à leur profil public ont un **badge LIVE** à côté de leur nom sur le site pendant qu'ils streament Origins TCG : la catégorie du jeu sur Twitch, ou un titre qui nomme le jeu. Leurs streams apparaissent aussi sur la [page des lives](/fr/live) et dans l'[annuaire des créateurs](/fr/creators). Les rôles sont attribués par le staff d'OriginsMeta : si vous streamez Origins TCG régulièrement, écrivez-nous sur Discord.
`,
  },
};
