/**
 * Testi francesi delle news (07/10/2026, francese quarta lingua del sito), per slug: `title` (H1, entro 110 caratteri),
 * `metaTitle` (titolo in SERP: con "Origins TCG" entro 60 caratteri), `description` (120–158), `summary`, `body` in
 * Markdown, `highlights` e `faq` quando l'articolo li ha nelle altre lingue. Inglese, italiano e spagnolo stanno in
 * news.ts, che unisce questo file (`withFrench`) e si rifiuta di compilare se a una news manca il francese o se il
 * francese ha un campo che l'articolo non ha (o viceversa). Regole, glossario e tipografia in docs/francese.md; i
 * controlli SEO sono quelli di newsMeta.test.ts (lunghezze, link con /fr/, ancore degli "In breve" presenti nel body,
 * paragrafo "Mise à jour du …" per gli articoli aggiornati).
 */

/** I testi di una news in una lingua, senza i dati che non cambiano con la lingua. */
export type NewsCopy = {
  title: string;
  metaTitle: string;
  description: string;
  summary: string;
  body?: string;
  highlights?: { label: string; text?: string; anchor: string }[];
  faq?: { q: string; a: string }[];
};

export const frText: Record<string, NewsCopy> = {
  "building-origins-ama-design-balance": {
    title: "AMA Building Origins : classé jusqu'au 4 décembre, 22 cartes en novembre et pourquoi Bagheera coûte plus",
    metaTitle: "AMA d'Origins TCG : classé, nouvelles cartes, équilibrage",
    description:
      "L'AMA Building Origins d'Origins TCG : classé du 19 octobre au 4 décembre, 22 cartes en novembre, collector pass à 20 dollars environ, le pourquoi du 0.7.",
    summary:
      "Lors de l'AMA Building Origins, diffusé en direct le 2 octobre et publié sur YouTube le 5 octobre, Koin Games a donné des dates « écrites au crayon » : le mode classé du 19 octobre au 4 décembre, le classement Grandmaster à partir du 27 octobre et au moins 22 nouvelles cartes en novembre. L'équipe de design a aussi expliqué pourquoi Bagheera, Mind Palace et Spellbook coûtent plus depuis le patch 0.7, pourquoi Christopher Robin est revenu à 5/4 et comment elle équilibre le jeu.",
    highlights: [
      { label: "Le classé du 19 octobre au 4 décembre", text: "le classement Grandmaster ouvre le 27 octobre, pour tout le monde en même temps", anchor: "classe" },
      { label: "Novembre", text: "un playtest de la monétisation, au moins 22 nouvelles cartes, des cartes et des lieux toutes les deux semaines", anchor: "novembre" },
      { label: "Les cartes à venir", text: "20 Légendaires, plus de 90 lieux conçus et une mécanique de nourriture", anchor: "premier-set" },
      { label: "Collector pass, capsules et commanders", text: "un achat unique d'environ 20 dollars, des commanders échangeables", anchor: "collection" },
      { label: "Spectateur, replays et plateaux", text: "le mode spectateur à la Crimson Cup pour des comptes approuvés seulement", anchor: "fonctions" },
      { label: "Pourquoi trois cartes coûtent plus", text: "Bagheera, Mind Palace et Spellbook ; aucun changement pour Ellen Trechend", anchor: "patch-0-7" },
      { label: "Christopher Robin et Axe Throw", text: "les raisons de l'aller-retour 5/4, 4/5, 5/4", anchor: "christopher-robin" },
      { label: "Comment Koin conçoit le jeu", text: "des bandes de puissance, les données plus le ressenti des joueurs, la « net positive joy »", anchor: "design" },
    ],
    body: `## Le classé : du 19 octobre au 4 décembre, Grandmaster à partir du 27 {#classe}

L'équipe a donné les dates avec un avertissement : elles sont « écrites au crayon », et celui qui les a lues a « beaucoup de correcteur ». La saison classée commence le 19 octobre, premier jour du Steam Next Fest, et dure jusqu'au 4 décembre. Le classement Grandmaster reste fermé pendant le festival et devrait ouvrir le mardi 27 octobre, pour que « tout le monde commence au même moment ».

Les meilleurs prix iront aux premiers de ce classement, y compris des récompenses exclusives « 1 sur 1 ou 1 sur 25 » que Mike, de l'équipe de Koin, a qualifiées de « probablement les meilleurs prix de tout le jeu ». Cette saison offre des récompenses en classé avant l'arrivée de la monétisation complète, « peut-être la seule fois », et les objets que l'on obtient aujourd'hui dans la démo ne seront plus disponibles au lancement. La suite dans notre [guide du classé](/fr/guides/origins-tcg-ranked).

## Novembre : un playtest de la monétisation et de nouvelles cartes toutes les deux semaines {#novembre}

Les builds de novembre sont des playtests de la monétisation. Si les plans tiennent, novembre apportera aussi « au moins 22 nouvelles cartes », avec de nouvelles cartes et de nouveaux lieux toutes les deux semaines pendant la saison classée. Plus loin, Mike a dit que l'équipe « vise un lancement du jeu l'année prochaine » et que l'interface, qui ressemble encore à celle d'un jeu mobile, aura un aspect « beaucoup plus PC » d'ici la fin de l'année ; Kevin a dit que la version mobile arrivera « bientôt », sans date. Les dates confirmées sont dans notre [feuille de route](/fr/guides/roadmap-and-dates).

## Les cartes à venir : 20 Légendaires, plus de 90 lieux et la nourriture {#premier-set}

La démo contient « la première moitié » du premier set ; la seconde ajoute des mots-clés et de nouveaux concepts. Ben, le lead card designer, a dit que 20 Légendaires sont prévues et que « plus de 90 » lieux sont conçus, contre la quarantaine que les joueurs ont vue. Beaucoup des lieux actuels favorisent les decks agressifs comme ceux de Three Not So Little Pigs ; cela s'équilibrera avec l'arrivée des autres.

La nouvelle mécanique qui l'enthousiasme est la **nourriture**, repoussée parce qu'elle est « un peu avancée » : un objet sur le plateau qui n'est pas un personnage. Le personnage joué dessus reçoit un bonus, « pour l'instant c'est +2/+2 », ce qui donne plus de poids au placement. Un autre sous-thème arrive aussi, « les cartes créées coûtent moins ». Aucune nouvelle carte n'a été nommée.

Les sets suivants visiteront d'autres mythologies : un set consacré à la mythologie grecque est prévu, et certaines de ses cartes sont déjà conçues. Koin a aussi promis des collaborations et a dit avoir été contacté par des studios « numéro un mondial dans leur catégorie », sans les nommer.

## Collector pass, capsules et commanders {#collection}

Origins reste free-to-compete : chaque joueur a toutes les cartes de jeu, personne ne doit se sentir « obligé de dépenser quoi que ce soit » et l'argent va aux variantes limitées, comme dans Counter-Strike. Les pièces :

- le **collector pass** (nom provisoire) : un achat unique d'« environ 20 dollars », pas un battle pass mensuel, qui donne en jouant environ deux objets de collection par semaine, jamais d'un type qui sort des boosters ;
- des **crédits de boutique** gagnés en jouant, pour d'autres objets de collection exclusifs ;
- les **capsules**, un second type d'objet : les boosters ne contiennent que des cartes, alors que les commanders sortent des capsules ;
- les **commanders**, échangeables et en quantité limitée ; en accès anticipé, chacun en reçoit quatre non échangeables, avec des emotes et des avatars, comme « dotation de départ ».

Koin étudie aussi des étuis à collectionner et personnalisables, et des classeurs pour parcourir les collections des autres joueurs. Les sets et la gradation sont expliqués dans notre [article sur les sets](/fr/news/origins-sets-alpha-edition-grading) et dans le [guide de l'économie de collection](/fr/guides/collector-economy) ; pour le Kickstarter, « les prix seront dévoilés bientôt ».

## Spectateur, replays et plateaux {#fonctions}

- Le **mode spectateur** existe mais « n'est pas terminé » : à la [Crimson Cup](/fr/news/crimson-cup-prizepool-qualifiers), seuls quelques comptes approuvés pour le streaming l'utiliseront.
- Les **replays** fonctionnent en interne mais ne sont pas prêts pour les joueurs ; un **historique tour par tour** est prévu.
- Voir combien de cartes votre adversaire a remplacées au mulligan, une idée de la communauté, figurait déjà dans la build interne : c'est arrivé avec le [playtest 0.7.1](/fr/news/playtest-patch-notes-0-7-1#mulligan-adverse).
- Le **plateau actuel est provisoire**, « trop science-fiction et fade » : des plateaux inspirés de chaque boss sont en préparation, et des plateaux cosmétiques arriveront.
- **Bots** : « aux heures de pointe, nous avons environ 200 joueurs connectés », a dit Mike, donc pour l'instant certaines parties classées se jouent contre des bots ; les missions sont clairement PvE.

## Pourquoi Bagheera, Mind Palace et Spellbook coûtent plus {#patch-0-7}

Le [patch 0.7](/fr/news/patch-0-7#couts) a augmenté les trois cartes de 1 mana. Ben a raconté que l'équipe ne comptait pas les modifier, mais les cartes que les joueurs ne cessaient de signaler « ont commencé à être plus jouées », jusqu'à ce que les chiffres ne soient plus sains. Il n'a pas donné les win rates : seulement qu'ils étaient « dans des fourchettes saines ».

- **Bagheera** est une carte « très importante à réussir » : elle donne le rythme du début de partie et apprend aux débutants où une menace va apparaître, « aux trois mêmes endroits », les cases centrales où sa capacité À la révélation la fait grandir. En 3/3 pour 1 mana, elle était dans trop de decks, surtout ceux de Three Not So Little Pigs. Koin veut en faire une carte pour Mulan, qui répète les capacités À la révélation : l'équipe a donc gardé le gros bonus et augmenté le coût. Un deck Mulan plus fort, a noté Ben, pourrait à son tour renforcer Ellen Trechend.
- **Spellbook** sera la carte qui changera le plus quand le nombre de cartes doublera, parce que ses sorts viennent de là. Kevin a compté environ 22 sorts aujourd'hui, donc une Legion of the Dead sort à peu près « une fois sur 22 », des chances qui « ne dureront pas longtemps ».
- **Ellen Trechend** : « aucune action », et rien à attendre « dans l'immédiat ».

Avant la Crimson Cup, Koin s'est « engagé » à laisser les cartes telles quelles ; en cas de problème « catastrophique », « nous bannirions simplement la carte plutôt que de la modifier ».

## Christopher Robin et Axe Throw {#christopher-robin}

Christopher Robin est passé de 5/4 à 4/5 parce qu'il était dans beaucoup de decks avec un bon win rate, et que dans les parties d'initiation les débutants se retrouvaient souvent avec Golden Egg en face, sans autre issue que l'échange ; en 4/5, un Galahad joué ensuite changeait les affrontements. L'équipe est revenue en arrière ([patch de la démo du 21 septembre](/fr/news/demo-patch-notes-0921#christopher-robin)) parce qu'elle pensait ramener Axe Throw « à cinq » dégâts, n'était pas prête à le faire, et voulait qu'Axe Throw, à 4 dégâts aujourd'hui, reste bonne contre les cartes les plus jouées. « Ce n'était pas seulement une question de puissance », a dit Ben. Le [rework de Twister Toss](/fr/news/patch-0-7#twister-toss) supprime lui aussi un moment maladroit : le déplacement n'échoue plus si une autre carte entre d'abord sur la case.

## Comment Koin conçoit le jeu {#design}

- **Des bandes, pas une puissance égale** : « nous ne cherchons pas à ce que chaque carte ait le même niveau de puissance », a dit Ben ; l'équipe intervient quand une carte sort des bandes saines.
- **Données et ressenti** : chiffres plus retours, parce que « le ressenti des joueurs, c'est aussi une donnée » (Kevin), et un objectif qu'ils appellent « net positive joy », la joie nette positive : le gagnant d'un échange est content sans que le perdant se sente très mal.
- **Peu de décisions, mais lourdes** : 12 cartes de base plus une Légendaire font « 13 décisions », donc un changement de coût pèse plus que dans les gros decks.
- **Tours simultanés, trois lieux et une Légendaire que « vous n'avez pas besoin de piocher »**, dans un jeu pensé pour être agréable à regarder « depuis le tout début ».
- **Des règles plus clémentes, exprès** : retirer un buff continu ne tue jamais un personnage, et Bouclier arrête complètement Piétinement.

## Ce que nous ne savons pas encore {#inconnues}

- Toutes les dates sont « écrites au crayon » et peuvent bouger.
- Quelles sont les récompenses du classé et les prix 1 sur 1 : Koin y travaille « encore ».
- Quand arriveront la nourriture, les autres Légendaires et le set grec, et avec quelles cartes.
- Les prix du Kickstarter, et combien de commanders et de capsules il y aura.

## D'où cela vient {#sources}

L'[enregistrement de l'AMA Building Origins](https://www.youtube.com/watch?v=bEb5RuwY7tg) sur la chaîne YouTube officielle d'Origins TCG, en direct le 2 octobre 2026 et publié le 5 octobre (2 heures et 22 minutes), avec Kevin Lambert, chief product officer et responsable du design de Koin Games, Ben « Benny Beatdowns », lead card designer et ancien de Wizards of the Coast sur Magic, et d'autres membres de l'équipe. Nous avons utilisé les sous-titres automatiques en anglais de YouTube, qui déforment certains noms (nous avons vérifié les noms des cartes dans notre base de données) : les citations sont transcrites et traduites par nous.`,
    faq: [
      {
        q: "Quand commence et quand se termine la saison classée d'Origins TCG ?",
        a: "Lors de l'AMA Building Origins, Koin Games a dit que la saison classée commence le 19 octobre 2026, premier jour du Steam Next Fest, et dure jusqu'au 4 décembre. Le classement Grandmaster devrait ouvrir le mardi 27 octobre, pour tout le monde en même temps. L'équipe a souligné que ces dates sont « écrites au crayon ».",
      },
      {
        q: "Pourquoi Bagheera, Mind Palace et Spellbook coûtent-elles 1 mana de plus ?",
        a: "Leur taux de jeu continuait de monter après les signalements des joueurs, jusqu'à ce que Koin juge les chiffres malsains et les augmente de 1 mana dans le patch 0.7. Bagheera, à 1 mana, était dans trop de decks, surtout ceux de Three Not So Little Pigs, alors que Koin veut en faire une carte pour Mulan. Les win rates n'ont pas été communiqués.",
      },
      {
        q: "Koin va-t-il modifier des cartes avant la Crimson Cup ?",
        a: "Non, sauf si quelque chose de catastrophique arrive : dans ce cas, a dit Koin, il bannirait la carte plutôt que de la modifier. Ben a aussi dit qu'aucune action n'est prévue sur Ellen Trechend dans l'immédiat.",
      },
      {
        q: "Qu'est-ce que la mécanique de nourriture d'Origins TCG ?",
        a: "Une des mécaniques à venir, décrite par le lead card designer Ben : un objet qui se pose sur le plateau sans être un personnage, et le personnage joué dessus reçoit un bonus, +2/+2 pour l'instant. Elle a été repoussée parce qu'elle est un peu avancée, et elle n'a pas encore de date.",
      },
    ],
  },
  "bot-deck-challenge-practice-tournaments": {
    title: "Vos decks pour les bots de la démo : le défi de Koin, et des tournois d'entraînement avant la Crimson Cup",
    metaTitle: "Origins TCG : vos decks pour les bots de la démo",
    description:
      "Koin Games demande aux joueurs d'Origins TCG des decks pour les bots de la démo, avec un prix secret. Aussi : tournois d'entraînement et chiffres de la démo.",
    summary:
      "Le 6 octobre, Koin Games a lancé un défi sur le Discord officiel : construisez des decks, envoyez-les avec un formulaire et les bots de la démo commencent à les jouer, avec un « prix super secret » pour les decks les plus performants. Les mêmes jours, Koin a organisé les deux premiers tournois d'entraînement hebdomadaires avant la Crimson Cup, invité les fans à organiser leurs propres tournois et partagé de nouveaux chiffres : plus de 20 000 téléchargements de la démo et plus de 300 000 parties jouées.",
    highlights: [
      { label: "Le défi des decks pour les bots", text: "des decks envoyés avec le formulaire de Koin, les bots de la démo les jouent, un prix secret pour les meilleurs", anchor: "defi-bots" },
      { label: "Comment participer", text: "autant de decks que vous voulez, aucune règle annoncée", anchor: "participer" },
      { label: "Tournois d'entraînement", text: "les deux premiers les 3 et 10 octobre ; la communauté préfère les soirs de semaine, heure européenne", anchor: "entrainement" },
      { label: "Organisez votre tournoi", text: "Koin propose son soutien aux tournois des fans, et OriginsMeta a un organisateur gratuit", anchor: "organiser" },
      { label: "L'enregistrement de l'AMA", text: "Building Origins, 2 heures et 22 minutes sur YouTube", anchor: "ama" },
      { label: "La démo en chiffres", text: "plus de 20 000 téléchargements et plus de 300 000 parties", anchor: "chiffres" },
    ],
    body: `## Koin veut de meilleurs decks pour ses bots {#defi-bots}

Le 6 octobre, à 18:17 UTC, l'équipe de Koin Games a publié « un petit défi » dans #announcements sur le [Discord officiel](https://discord.gg/originstcg) : « Nous voulons améliorer les decks qu'utilisent nos bots, alors faisons-en un petit jeu ». Cela fonctionne en quatre étapes :

1. construisez des decks ;
2. envoyez-les avec le [formulaire officiel](https://forms.gle/zY1WeRTPLQzKAEs26) ;
3. les bots commencent à les utiliser dans leurs parties ;
4. « les decks les plus performants gagnent un prix super secret ».

Vous pouvez envoyer plusieurs decks et, selon les mots de l'équipe, « il n'y a aucune règle » : le but est de « construire les meilleurs decks possibles ».

Pourquoi c'est important : dans le [post sur la Crimson Cup du 5 octobre](/fr/news/crimson-cup-prizepool-qualifiers#entrainement), Koin a écrit que la plupart des parties de la démo se jouent contre des bots. Les listes issues de ce défi sont celles que l'on rencontrera dans ces parties, dans les semaines qui précèdent la [Crimson Cup](/fr/guides/steam-next-fest-2026).

## Comment participer {#participer}

L'annonce ne demande rien d'autre que le formulaire : ni date limite, ni format, ni limite au nombre de decks. Si vous cherchez un point de départ :

- construisez et vérifiez votre liste dans notre [Deck builder](/fr/deck-builder), qui suit les règles des decks de la démo (une Légendaire plus 12 cartes de base en deux exemplaires, 25 cartes) et vous donne le code du jeu à copier ;
- cherchez des idées parmi les [decks publiés sur OriginsMeta](/fr/decks), chacun avec son guide et les votes de la communauté ;
- comme vous pouvez envoyer plusieurs listes, essayez des archétypes différents plutôt que de tout miser sur un seul deck.

## Des tournois d'entraînement chaque semaine {#entrainement}

Les tournois d'entraînement annoncés le 5 octobre ont commencé. Koin avait d'abord posé la question : dans un sondage du 30 septembre, 265 votants sur 293 (90 %) avaient dit oui à des tournois d'entraînement sans lots.

- **Tournoi d'entraînement n° 1**, samedi 3 octobre à 16:00 CEST, annoncé le 2 octobre, s'est joué avec les règles de la Crimson Cup, donc avec des decks à remettre avant le début ([le format](/fr/news/crimson-cup-format-check-in#format) et notre [guide du Conquest](/fr/guides/origins-tcg-conquest)).
- **Tournoi d'entraînement n° 2**, samedi 10 octobre à 16:00 CEST (14:00 UTC), annoncé dans #game-announcements le 6 octobre, a gardé le format du premier, cinq rondes suisses, des matchs au meilleur des trois manches et aucune élimination, mais sans Conquest : aucun deck à remettre et le libre choix de ce que vous jouez. Les inscriptions se faisaient dans #tournaments-to-join.

Le 6 octobre, Koin a aussi demandé quand les joueurs préfèrent jouer. L'option gagnante, avec 40 % des voix, était « Weekdays - evening EU time (7pm CEST, 1pm EST) », c'est-à-dire les soirs de semaine à l'heure européenne, à 19:00 CEST. Le jour et l'heure du prochain tournoi d'entraînement n'ont pas encore été annoncés, et les résultats du deuxième n'ont pas été publiés dans les canaux d'annonces.

## D'autres tournois, et organiser le vôtre {#organiser}

Le 8 octobre, Koin a signalé un tournoi d'Origins organisé le jour même à 16:30 CEST par le Collector Club, un site tiers, qui prévoit d'organiser des tournois chaque semaine sur son propre Discord, avec les inscriptions dans son canal d'annonces.

Dans le même message, l'équipe a ajouté une invitation ouverte : « Si vous êtes fan d'Origins et voulez organiser vos propres tournois, nous serions ravis de vous soutenir. N'hésitez pas à nous contacter pour que cela se fasse ! » Le message ne précise pas en quoi consiste ce soutien.

Si vous voulez commencer tout de suite, l'[organisateur de tournois](/fr/tournaments/new) d'OriginsMeta est gratuit pour toute personne connectée : tableau à élimination directe, Conquest ou deck libre, matchs au meilleur d'une, trois ou cinq manches, decks remis avant le début, check-in et listes cachées, tournoi public ou privé sur invitation, avec un lien court à partager. Il ne gère pas encore les rondes suisses.

## L'AMA Building Origins, sur YouTube {#ama}

L'enregistrement du premier événement Building Origins, l'AMA avec Kevin et Ben, présentés par Koin comme les têtes pensantes d'Origins, est sur la chaîne YouTube officielle d'Origins TCG : [« Building Origins AMA »](https://www.youtube.com/watch?v=bEb5RuwY7tg), publié le 5 octobre 2026, d'une durée de 2 heures et 22 minutes. Ce qui s'y est dit, des dates de la saison classée aux raisons des équilibrages de la 0.7, se trouve dans [notre article sur l'AMA](/fr/news/building-origins-ama-design-balance).

## La démo en chiffres {#chiffres}

- **Plus de 20 000 téléchargements.** Le compte X officiel a écrit le 7 octobre que la démo « a déjà été téléchargée plus de 20000 fois » ; le 24 septembre, il parlait de 15 000.
- **Plus de 300 000 parties.** Le 29 septembre, le fondateur et PDG de Koin Games, Tim Jooste, a écrit que plus de 300 000 parties avaient été terminées dans la démo en 11 semaines, avec près de 1 000 joueurs au-delà de 20 heures de jeu.
- **1 500 inscrits à la Crimson Cup.** Le 1er octobre, il a ajouté que 1 500 joueurs s'étaient inscrits à la Crimson Cup en trois semaines.

Ce sont les chiffres de Koin : nous n'avons aucun moyen de les vérifier.

## Ce que nous ne savons pas encore {#ce-que-nous-ne-savons-pas}

- Combien de temps dure le défi des decks pour les bots : l'annonce ne donne aucune date limite.
- Ce qu'est le « prix super secret », et combien de decks le gagnent.
- Comment se mesure « les plus performants » (victoires, win rate, nombre de parties) et si les résultats seront publiés.
- Quand les decks envoyés commencent à apparaître dans les parties, et dans quels modes.
- Si « il n'y a aucune règle » vaut aussi pour la construction des decks ou seulement pour le nombre de decks à envoyer.
- Le jour et l'heure du prochain tournoi d'entraînement, s'il passera aux soirs de semaine choisis par le sondage, et les résultats du deuxième.

## D'où viennent ces informations {#sources}

- Le [Discord officiel d'Origins TCG](https://discord.gg/originstcg) : le défi dans #announcements le 6 octobre 2026 ; les tournois d'entraînement dans #announcements (2 octobre) et #game-announcements (6 octobre), avec les deux sondages ; le tournoi du Collector Club et l'invitation à organiser des tournois dans #game-announcements (8 octobre) ; le premier événement Building Origins dans #announcements.
- L'[enregistrement de l'AMA](https://www.youtube.com/watch?v=bEb5RuwY7tg) sur la chaîne YouTube officielle.
- Les posts sur X d'[Origins TCG du 7 octobre](https://x.com/origins_tcg/status/2107853622897705015) et [du 24 septembre](https://x.com/origins_tcg/status/2103203061707477242), et de Tim Jooste du [29 septembre](https://x.com/TimothyJooste/status/2104979201707192617) et du [1er octobre](https://x.com/TimothyJooste/status/2105506219679264901).`,
    faq: [
      {
        q: "Comment envoyer un deck pour les bots de la démo d'Origins TCG ?",
        a: "Avec le formulaire indiqué dans l'annonce de Koin Games du 6 octobre 2026 sur le Discord officiel (forms.gle/zY1WeRTPLQzKAEs26). Vous pouvez envoyer autant de decks que vous voulez : les bots commencent à les utiliser dans leurs parties et les decks les plus performants gagnent un prix secret.",
      },
      {
        q: "Le défi des decks pour les bots a-t-il une date limite ou un prix connu ?",
        a: "Pas encore. L'annonce ne donne aucune date limite, ne dit pas ce qu'est le « prix super secret » et n'explique pas comment les decks les plus performants sont choisis.",
      },
      {
        q: "Quand ont lieu les tournois d'entraînement d'Origins TCG ?",
        a: "Ils sont hebdomadaires et annoncés sur le Discord officiel. Le premier s'est joué le 3 octobre 2026 avec les règles de la Crimson Cup, le deuxième le 10 octobre à 16:00 CEST sans Conquest. Dans un sondage du 6 octobre, la communauté a choisi les soirs de semaine, à l'heure européenne (19:00 CEST).",
      },
      {
        q: "Puis-je organiser mon propre tournoi d'Origins TCG ?",
        a: "Oui. Koin Games invite les fans qui veulent organiser des tournois à les contacter pour obtenir du soutien, et sur OriginsMeta toute personne connectée peut en créer un avec l'organisateur de tournois, avec Conquest ou deck libre et des matchs au meilleur d'une, trois ou cinq manches.",
      },
    ],
  },
  "origins-sets-alpha-edition-grading": {
    title: "Les sets d'Origins TCG : Alpha Edition, un set tous les 3 à 4 mois, gradation et cartes de jeu gratuites",
    metaTitle: "Sets d'Origins TCG : Alpha Edition, gradation, tirages",
    description:
      "Les sets d'Origins TCG : Alpha Edition réservée au Kickstarter, un set tous les 3 à 4 mois, boosters sur Steam, grades de 1 à 10 et cartes de jeu gratuites.",
    summary:
      "Dans trois posts sur X publiés entre le 29 septembre et le 9 octobre, Koin Games a expliqué comment fonctionneront les sets et la collection d'Origins TCG. Le premier set, Myths and Legends, compte 218 personnages ; son Alpha Edition ne sera vendue que via le Kickstarter et ne sera jamais réimprimée, et les sets suivants sont prévus tous les 3 à 4 mois, avec trois mois de vente, des cartes de collection gradées et des promos que l'on ne gagne qu'en tournoi. Les cartes de jeu restent gratuites pour tous : le système de collection, attendu après le Steam Next Fest, est facultatif.",
    highlights: [
      { label: "Deux systèmes de cartes", text: "cartes de jeu gratuites pour tous à chaque saison et non échangeables ; cartes de collection sous forme d'objets Steam à part, échangeables", anchor: "deux-systemes" },
      { label: "Alpha Edition", text: "la première édition de Myths and Legends (218 personnages) : uniquement sur Kickstarter, avec l'Alpha tag, jamais réimprimée", anchor: "alpha-edition" },
      { label: "Un set tous les 3 à 4 mois", text: "trois mois de vente, puis il ne reste que les exemplaires déjà détenus par les collectionneurs", anchor: "cycle-des-sets" },
      { label: "Produits scellés sur Steam", text: "boosters, boîtes et cases comme objets d'inventaire ; boîtes et cases uniquement en précommande", anchor: "scelles" },
      { label: "Rareté et gradation", text: "cinq couches de rareté, cartes avec erreur, grades de 1 à 10 avec demi-grades : le 2 octobre, Koin a écrit que le système est encore à l'étude", anchor: "rarete-gradation" },
      { label: "Cartes de tournoi", text: "jamais dans les boosters : le vainqueur de la Crimson Cup reçoit un Dracula 1/1", anchor: "cartes-de-tournoi" },
      { label: "La rareté n'est pas une valeur", text: "Koin cite les premières éditions de Pokémon et de Magic, puis écrit qu'elles ne sont pas une formule", anchor: "rarete" },
    ],
    body: `## Trois posts, un seul système {#trois-posts}

Entre le 29 septembre et le 9 octobre 2026, le compte officiel d'Origins TCG sur X a publié trois longs posts sur le fonctionnement des sets et de la collection. Koin Games dit s'inspirer avant tout des jeux de cartes physiques : produits scellés, tirages limités, périodes de sortie définies et boutiques de jeux locales.

Notre [guide de l'économie de collection](/fr/guides/collector-economy) présente déjà les formats de l'Alpha Edition et ses sept niveaux de rareté, d'après la page officielle de préinscription. Ce que ces posts ajoutent : la taille du premier set, l'Alpha tag, le rythme des sets suivants, les produits scellés sous forme d'objets Steam, les couches de rareté, le fonctionnement prévu de la gradation et les cartes de tournoi.

## Deux systèmes de cartes {#deux-systemes}

Origins a deux types de cartes qui partagent les personnages et les illustrations, mais pas l'accès, la propriété ni la disponibilité :

- **Les cartes de jeu.** Chaque carte de jeu de base sera gratuite pour tous les joueurs, à chaque saison. Elles ne s'échangent pas et servent à jouer. Selon Koin, « a player will never need to buy a pack or own a collectible version to build a competitive deck » : aucun joueur n'aura jamais besoin d'acheter un booster ni de posséder une version de collection pour construire un deck compétitif. Le studio appelle cela le free-to-compete.
- **Les cartes de collection.** Des objets à part de l'inventaire Steam, que vous possédez et pouvez échanger. Même la version de collection standard se distingue de la carte de jeu, avec un cadre et un affichage différents qui mettent l'illustration en valeur.

La rareté dont parle Koin ne concerne que la partie collection : éditions, traitements de l'illustration, grades, produits scellés et provenance des tournois. Elle ne limitera jamais l'accès aux cartes compétitives, et la fermeture d'une édition ne retire jamais une carte du jeu. Ce que l'argent achète, et ce qu'il n'achète pas, est expliqué dans notre [guide du free-to-compete](/fr/guides/is-origins-tcg-pay-to-win).

## Myths and Legends et l'Alpha Edition {#alpha-edition}

Le premier set est **Myths and Legends**, avec **218 personnages**. Sa première sortie de collection est l'**Alpha Edition**, disponible uniquement via le Kickstarter, le 27 octobre selon le CEO (les détails sont dans notre [guide du Kickstarter](/fr/guides/origins-tcg-kickstarter)). Chaque carte Alpha porte un **Alpha tag** sur sa face, pour que l'édition reste reconnaissable. Un personnage peut revenir dans un set ultérieur, mais pas dans sa version Alpha : une fois la fenêtre fermée, dit Koin, il n'y aura plus de cartes, de boosters, de boîtes ni de cases Alpha.

Le système de collection est prévu **après le Steam Next Fest** (du 19 au 26 octobre), et le post du 9 octobre indique que tout sera échangeable sur Steam dès le « day 1 », le premier jour.

## Un nouveau set tous les 3 à 4 mois {#cycle-des-sets}

Koin prévoit un nouveau set tous les 3 à 4 mois. Chaque set standard a une **fenêtre de vente de trois mois**, pendant laquelle les cartes de collection et les produits scellés sont vendus par Origins, les boutiques de jeux participantes (le [Digital LGS Program](/fr/news/digital-lgs-program) présenté le 6 octobre) et des partenaires en ligne agréés. Ensuite, il ne reste que les exemplaires déjà détenus par les collectionneurs, échangeables sur le Marché de la communauté Steam.

## Les produits scellés restent scellés {#scelles}

Les boosters, les boîtes et les cases seront des objets individuels de l'inventaire Steam : vous pourrez les ouvrir, les échanger ou les garder scellés. Les boîtes et les cases sont **uniquement en précommande** : une fois cette fenêtre fermée, aucune nouvelle unité ne s'ajoute. Pour Koin, le produit scellé reste ainsi une partie de la collection, au lieu d'être un écran d'achat qui disparaît après l'ouverture.

## Rareté, traitements et gradation {#rarete-gradation}

Une carte de collection peut varier sur cinq couches : édition, rareté, grade, état numérique et statut de promo. Aucune ne change ce que fait la carte en partie. Les boosters de collection peuvent contenir des cartes de collection standard, des variantes **alternate art**, des cartes **Storybook** animées et des **cartes numériques avec erreur**.

Sur la gradation, les deux posts n'ont pas le même ton. Le 29 septembre, Koin la décrit comme décidée : le contenu d'un booster est fixé avant son ouverture et, quand une carte de collection est révélée, « the system rolls its grade », le système tire son grade. La gradation est « automatic, instant, and free », automatique, instantanée et gratuite, selon le centrage, les coins, les bords et la surface, avec des défauts numériques visibles qui expliquent le résultat. Le 2 octobre, le ton est plus prudent : « We're exploring a digital grading system », un système dans lequel plusieurs paramètres forment le grade et où les défauts varient d'une carte à l'autre. L'échelle est la même dans les deux posts, **de 1 à 10 avec des demi-grades** ; le reste peut encore changer, et dans la mise à jour du playtest du 1er octobre, l'équipe demandait d'[ignorer pour l'instant l'écran « How Grading Works »](/fr/news/playtest-patch-notes-1001#gradation). Le grade est indépendant de la rareté et de l'illustration et, selon Koin, les grades bas peuvent aussi intéresser les collectionneurs, parce qu'ils rendent un exemplaire plus singulier.

## Cartes de tournoi : le Dracula 1/1 {#cartes-de-tournoi}

Certaines cartes de collection ne seront jamais dans les boosters ni en boutique : des promos de tournoi ultra rares, que l'on gagne seulement en compétition. Le premier exemple est la Crimson Cup : son vainqueur recevra une **carte promo Dracula 1/1** et sera, selon Koin, la seule personne à la posséder, pour toujours. Les autres prix sont dans notre [tableau des prix de la Crimson Cup](/fr/news/crimson-cup-prizepool-qualifiers#prix).

## Premières éditions et rareté, selon Koin {#rarete}

Le post du 9 octobre affirme que, dans les jeux de cartes physiques, le premier tirage devient rare parce qu'il est ouvert et joué avant que le public n'arrive. Il cite en exemple une boîte de Pokémon Base Set 1st Edition de 1999, vendue environ 100 à 120 dollars, dont des exemplaires scellés se seraient vendus entre environ 10 000 et plus de 250 000 dollars, et une boîte de Magic Alpha de 1993, environ 88 dollars en magasin, dont les boosters scellés s'échangeraient aujourd'hui entre 8 000 et 12 000 dollars. Ce sont les chiffres de Koin, pas les nôtres.

Koin ajoute lui-même que ces résultats ont pris des décennies, qu'ils dépendaient du fait que les deux jeux sont devenus énormes et qu'ils « are not a formula », ne sont pas une formule ; et le post du 29 septembre affirme qu'une offre limitée ne garantit ni la demande, ni la valeur de marché, ni la hausse des prix. Nous rapportons ce que dit le studio : rien de tout cela n'est une raison d'acheter. La collection est facultative, et vous pouvez jouer à Origins en compétition sans rien dépenser.

## Ce que nous ne savons pas encore {#inconnues}

- Les prix et la taille des tirages de l'Alpha Edition et des sets suivants.
- Si la gradation fonctionnera exactement comme décrit le 29 septembre, et en quoi l'« état numérique » diffère du grade.
- Quel jour est le « day 1 » des échanges sur Steam, et comment les objets de collection de la démo actuelle s'intègrent au nouveau système.
- Le nom et la date du deuxième set, et les probabilités des alternate art, des Storybook animées et des cartes avec erreur.
- Comment fonctionne la fenêtre de trois mois entre Origins, les boutiques et les partenaires en ligne.

## D'où vient l'information {#sources}

Trois posts du compte officiel d'Origins TCG sur X : [29 septembre](https://x.com/origins_tcg/status/2105048221139747258) (sets, Alpha Edition, gradation), [2 octobre](https://x.com/origins_tcg/status/2106087343895486639) (les deux systèmes de cartes et le système de collection) et [9 octobre 2026](https://x.com/origins_tcg/status/2108619922586898629) (premières éditions et offre). Au 11 octobre, il n'y a aucun post sur Steam sur ces sujets.`,
    faq: [
      {
        q: "Faut-il acheter des boosters pour être compétitif sur Origins TCG ?",
        a: "Non. Selon Koin Games, chaque carte de jeu de base sera gratuite pour tous les joueurs, à chaque saison, et personne n'aura jamais besoin d'acheter un booster ni de posséder une version de collection pour construire un deck compétitif. Les cartes de collection sont des objets Steam à part, échangeables, et les boosters sont facultatifs.",
      },
      {
        q: "Qu'est-ce que l'Alpha Edition d'Origins TCG ?",
        a: "La première sortie de collection de Myths and Legends, le premier set d'Origins, avec 218 personnages. Elle ne sera disponible que via le Kickstarter, chaque carte Alpha porte un Alpha tag sur sa face et, une fois la fenêtre fermée, selon Koin, il n'y aura plus de cartes, de boosters, de boîtes ni de cases Alpha.",
      },
      {
        q: "Comment fonctionnera la gradation des cartes sur Origins TCG ?",
        a: "Chaque carte de collection reçoit automatiquement un grade à son ouverture, sur une échelle de 1 à 10 avec des demi-grades. Le 29 septembre, Koin décrivait une gradation automatique, instantanée et gratuite, fondée sur le centrage, les coins, les bords et la surface ; le 2 octobre, il a écrit que le système est encore à l'étude, donc les détails peuvent changer.",
      },
      {
        q: "À quel rythme sortiront les sets d'Origins TCG ?",
        a: "Koin Games prévoit un nouveau set tous les 3 à 4 mois. Les sets standard sont en vente pendant trois mois via Origins, les boutiques de jeux participantes et des partenaires en ligne agréés ; ensuite, les exemplaires ne viennent plus que des collectionneurs, sur le Marché de la communauté Steam.",
      },
    ],
  },
  "playtest-patch-notes-0-7-1": {
    title: "Notes de patch du playtest 0.7.1 d'Origins TCG : le classé compte de nouveau pour les missions",
    metaTitle: "Playtest 0.7.1 d'Origins TCG : notes de patch",
    description:
      "Playtest 0.7.1 d'Origins TCG du 8 octobre : le classé compte de nouveau pour les missions, le mulligan adverse s'affiche et une vingtaine de bugs corrigés.",
    summary:
      "Le 8 octobre, Koin Games a mis à jour le playtest d'Origins TCG en version 0.7.1, une petite mise à jour faite de corrections et de confort de jeu. Les parties classées comptent de nouveau pour la progression des missions, vous voyez combien de cartes votre adversaire a remplacées au mulligan, et la recherche dans la collection, le choix des émotes et trois voix de personnages s'améliorent. Aucun changement d'équilibrage : les statistiques des cartes restent celles du patch 0.7.",
    highlights: [
      { label: "Le classé compte de nouveau pour les missions", text: "et les missions se jouent toujours en PvE si vous le voulez", anchor: "classe-missions" },
      { label: "Le mulligan de l'adversaire", text: "vous voyez combien de cartes il a remplacées", anchor: "mulligan-adverse" },
      { label: "Une recherche plus futée dans la collection", text: "phrases de plusieurs mots, et une carte invoquée trouve la carte qui l'invoque", anchor: "recherche-collection" },
      { label: "Émotes et voix", text: "emplacements d'émotes à vider, nouvelles voix pour Hansel and Gretel, Huck Finn et Christopher Robin", anchor: "emotes-voix" },
      { label: "Missions, écran d'accueil, plateau", text: "du confort de jeu et quelques éléments provisoires", anchor: "nouveautes" },
      { label: "Aucun changement d'équilibrage", text: "les statistiques des cartes sur OriginsMeta ne changent pas", anchor: "ce-qui-ne-change-pas" },
    ],
    body: `## Une petite mise à jour pour le playtest {#mise-a-jour}

Le 8 octobre, Koin Games a mis à jour en version 0.7.1 le playtest, la build à part de la Demo 2.0 à laquelle on accède par le Discord officiel. L'équipe a publié les notes dans le salon game-announcements du [Discord officiel](https://discord.gg/originstcg) à 16:54 UTC et a coupé la build pendant quelques heures pour installer la mise à jour. « Rien de majeur, juste quelques corrections et du confort de jeu », écrit l'équipe : il n'y a aucun changement d'équilibrage, mais plusieurs nouveautés sont des demandes des joueurs. Elle arrive une semaine après la [mise à jour du playtest du 1er octobre](/fr/news/playtest-patch-notes-1001), dont l'annonce n'avait pas de numéro de version.

## Les nouveautés {#nouveautes}

### Le mulligan de l'adversaire {#mulligan-adverse}

Pendant la phase de mulligan, vous voyez désormais combien de cartes votre adversaire a remplacées. Les joueurs l'avaient demandé sur Discord, et l'équipe dit que l'idée était si bonne qu'elle l'a mise en place dès le lendemain. Le [patch 0.6.1](/fr/news/patch-0-6-1-ranked) avait déjà ajouté un aperçu de la Légendaire adverse pendant le mulligan.

### Missions, écran d'accueil et le reste {#missions-accueil}

- **Missions, Boss et Récompenses** reçoivent quelques améliorations de confort, tout comme l'**écran d'accueil**. Les notes ne disent pas lesquelles.
- Les **Commanders**, comme les appellent les notes, disent désormais une réplique et affichent leur plaque de nom quand vous les examinez.
- **Effets sur le plateau :** cliquer sur le plateau déclenche des effets visuels et sonores. L'équipe précise que les deux sont provisoires et demande de ne pas les juger trop sévèrement.
- **Cinématique d'introduction :** une cinématique d'ouverture provisoire se lance, et l'équipe sait qu'elle est encore en plein chantier.

## Les améliorations {#ameliorations}

### Le classé compte de nouveau pour les missions {#classe-missions}

Avec la mise à jour du 1er octobre, les missions étaient devenues uniquement PvE, et dans cette build les missions de deck ne pouvaient pas être accomplies depuis le classé : l'équipe avait promis de les réactiver dans une build future ([notre article](/fr/news/playtest-patch-notes-1001#missions-classe)). Avec la 0.7.1, les parties classées PvP font de nouveau progresser les missions. Si vous préférez, vous pouvez toujours jouer les missions en PvE depuis la section Missions : à vous de choisir. Le fonctionnement du classé dans la démo est expliqué dans [notre guide du mode classé](/fr/guides/origins-tcg-ranked).

### La recherche dans la collection {#recherche-collection}

La recherche dans la collection accepte désormais des phrases de plusieurs mots, et chercher quelque chose qu'une carte invoque fait aussi apparaître la carte qui l'invoque. Sur OriginsMeta, la recherche dans les [Cartes](/fr/cards) et dans le [Deck builder](/fr/deck-builder) regarde déjà le nom et le texte des cartes.

### Émotes et voix {#emotes-voix}

- Dans le choix des émotes, vous pouvez désormais vider un emplacement, ce qui rend la composition de vos émotes un peu plus simple.
- Hansel and Gretel, Huck Finn et Christopher Robin ont de nouvelles voix. Les joueurs trouvaient qu'elles sonnaient bien trop vieilles pour les personnages, et l'équipe écrit qu'en interne tout le monde disait la même chose.

### Une vingtaine de bugs corrigés {#bugs-corriges}

D'après le décompte de l'équipe, une vingtaine de bugs sont corrigés. Les notes n'en donnent pas la liste, et l'équipe demande vos retours et ce qui lui aurait échappé sur Discord.

## Ce qui ne change pas {#ce-qui-ne-change-pas}

- **Aucun changement d'équilibrage.** Les statistiques des cartes restent celles du [patch 0.7](/fr/news/patch-0-7) du 29 septembre, le dernier patch d'équilibrage avant la Crimson Cup : les pages des cartes, le [Deck builder](/fr/deck-builder) et [MetaShifting](/fr/metashifting) ne changent pas.
- **Le playtest n'est pas la démo principale.** Ces changements sont dans la build du playtest ; la démo sur Steam, celle qu'explique [notre guide pour jouer à la démo](/fr/guides/play-the-demo), garde sa version tant que Koin ne la met pas à jour.

## Ce que nous ne savons pas encore {#inconnues}

- Quand les changements de la 0.7.1 arriveront dans la démo principale sur Steam.
- Quels bugs ont été corrigés : les notes ne donnent que le nombre, une vingtaine.
- Ce qui change exactement dans les Missions, les Boss, les Récompenses et sur l'écran d'accueil.
- Quand les effets du plateau et la cinématique d'introduction, provisoires pour l'instant, seront définitifs.

## La même semaine : le tournoi d'entraînement n° 2 {#tournoi-entrainement}

Dans le même salon, l'équipe a annoncé le deuxième tournoi d'entraînement pour le samedi 10 octobre à 14:00 UTC (16:00 CEST) : cinq rondes suisses au meilleur des trois manches, sans élimination et, contrairement au premier, sans Conquest, donc sans deck à remettre. Koin avait annoncé les tournois d'entraînement hebdomadaires le 5 octobre ([notre article](/fr/news/crimson-cup-prizepool-qualifiers#entrainement)).

## D'où viennent ces notes {#sources}

Les notes de patch de la 0.7.1 que l'équipe a publiées sur le [Discord officiel d'Origins TCG](https://discord.gg/originstcg) le 8 octobre 2026, dans le salon game-announcements. Au 11 octobre, aucune publication Steam ne parle de cette mise à jour : la dernière date du 5 octobre.`,
    faq: [
      {
        q: "Les parties classées comptent-elles pour les missions dans le playtest d'Origins TCG ?",
        a: "Oui, de nouveau, depuis le playtest 0.7.1 du 8 octobre 2026 : les parties classées PvP font progresser les missions. Les missions se jouent toujours en PvE depuis la section Missions. Dans la build du 1er octobre, les missions de deck ne pouvaient pas être accomplies depuis le classé.",
      },
      {
        q: "Le playtest 0.7.1 change-t-il les statistiques des cartes ?",
        a: "Non. Il n'a aucun changement d'équilibrage : les statistiques des cartes restent celles du patch 0.7 du 29 septembre 2026, le dernier patch d'équilibrage avant la Crimson Cup, et les pages des cartes d'OriginsMeta ne changent pas.",
      },
      {
        q: "Voit-on le mulligan de l'adversaire dans Origins TCG ?",
        a: "Dans le playtest, depuis la 0.7.1, vous voyez combien de cartes votre adversaire a remplacées pendant la phase de mulligan. Nous ne savons pas encore quand ce changement arrivera dans la démo principale sur Steam.",
      },
    ],
  },
  "upgrade-meta-1013": {
    title: "Upgrade Meta : merci pour les près de 200 parties, et OriginsMeta Tracker 0.4.1 vous laisse créer votre layout",
    metaTitle: "OriginsMeta Tracker 0.4.1 pour Origins TCG",
    description:
      "Merci pour vos retours et les près de 200 parties en une journée. OriginsMeta Tracker 0.4.1 pour Origins TCG apporte quatre layouts et Setup.",
    summary:
      "Merci : le 12 octobre, vous nous avez envoyé énormément de retours et vous avez enregistré près de 200 parties avec OriginsMeta Tracker, alors que les serveurs du jeu allaient et venaient une bonne partie de la journée. Ces parties sont déjà dans Analytics. La version 0.4.1 sort avec ce que vous nous avez demandé : quatre layouts des panneaux au choix, des panneaux seulement pendant la partie, une page Setup et les correctifs que vous nous avez signalés.",
    highlights: [
      { label: "Merci", text: "près de 200 parties enregistrées le 12 octobre", anchor: "merci" },
      { label: "Créez votre layout", text: "quatre styles pour les panneaux : Classic, Minimal, Structured et Custom", anchor: "layout" },
      { label: "Seulement pendant la partie", text: "des panneaux qui apparaissent au premier round et disparaissent à la fin", anchor: "en-partie" },
      { label: "Setup", text: "la page principale ne montre que votre jeu", anchor: "setup" },
      { label: "Correctifs", text: "plus de case vide dans le Deck tracker, decks modifiés lus tout de suite", anchor: "correctifs" },
    ],
    body: `## Merci {#merci}

En une journée, vous nous avez envoyé énormément de retours, sur notre Discord et depuis le site, et le 12 octobre vous avez enregistré **près de 200 parties** avec OriginsMeta Tracker, même avec les serveurs du jeu qui allaient et venaient une bonne partie de la journée. Chaque partie entre dans les win rates d'[Analytics](/fr/analytics) : Légendaires, decks de la communauté, archétypes et cartes, patch par patch, uniquement des totaux. Beaucoup des nouveautés ci-dessous viennent directement de vos messages.

## Créez votre layout {#layout}

Les panneaux au-dessus du jeu ont maintenant quatre styles, depuis le nouveau bouton **Create your layout** à côté du nom de votre deck (l'application est en anglais) :

- **Classic** : votre deck dans une colonne à gauche, avec la Légendaire en bandeau comme dans notre [deck builder](/fr/deck-builder) ; la Légendaire et les cartes révélées de l'adversaire dans un bandeau en haut à droite.
- **Minimal** : deux bandeaux, vos 12 cartes et la Légendaire en bas à gauche à côté de votre main, celles de l'adversaire en haut à droite.
- **Structured** : deux colonnes sur les côtés ; à droite, au-dessus du panneau de mana du jeu, les cartes de l'adversaire, celles qui restent dans son deck et le mana des deux joueurs avec la direction du combat.
- **Custom** : vous choisissez vertical ou horizontal, cartes illustrées ou seulement les noms en lignes, cartes par ligne, opacité du fond, si les cartes épuisées disparaissent et ce que montre chaque panneau.

Chaque style se souvient de l'endroit où vous placez ses panneaux, et la source OBS suit le style choisi.

## Panneaux seulement pendant la partie {#en-partie}

Une nouvelle option n'affiche les panneaux que pendant que vous jouez : ils apparaissent au premier round et disparaissent une trentaine de secondes après la fin, dans la source OBS aussi. Elle utilise le scanner d'écran : scanner désactivé, les panneaux restent visibles.

## Setup et une page principale plus nette {#setup}

La page principale de l'application ne montre plus que votre jeu : le deck choisi, vos chiffres, vos parties et leurs résultats. Le compte, le scanner d'écran, les panneaux et les options de l'application sont derrière le bouton **Setup**. Le tutoriel recommence une fois pour tout le monde, pour montrer où les choses ont changé de place.

## Correctifs et mises à jour {#correctifs}

- Plus de case vide en bas du Deck tracker : c'était un emplacement réservé que le jeu garde dans certains decks, pas une carte.
- Un deck que vous modifiez dans le jeu se met à jour tout de suite dans le tracker, sans attendre la partie suivante.
- Quand une nouvelle version sort, un avis bien visible vous demande d'attendre avant de lancer le jeu : l'application ne se met à jour que jeu fermé.

Le [guide d'installation](/fr/tracker#installation) de la page Tracker tient maintenant en cinq étapes courtes.

## Comment mettre à jour {#mettre-a-jour}

Si vous avez déjà OriginsMeta Tracker, il se met à jour tout seul en 0.4.1 jeu fermé. Si vous êtes nouveau, téléchargez-le depuis la [page Tracker](/fr/tracker) : le compte OriginsMeta est gratuit.

OriginsMeta est un site de fans non officiel, non affilié à Koin Games.`,
    faq: [
      { q: "Comment changer le style des panneaux d'OriginsMeta Tracker ?", a: "Appuyez sur Create your layout, à côté du nom de votre deck sur la page principale de l'application : il ouvre Setup sur les quatre styles (Classic, Minimal, Structured et Custom). Les panneaux ouverts se rouvrent dans le nouveau style." },
      { q: "Faut-il retélécharger OriginsMeta Tracker 0.4.1 ?", a: "Non : si vous l'avez déjà, l'application se met à jour toute seule en 0.4.1 jeu fermé. Les nouveaux venus la téléchargent depuis la page Tracker avec un compte OriginsMeta gratuit." },
    ],
  },
  "upgrade-meta-1012": {
    title: "Upgrade Meta : OriginsMeta Tracker 0.4.0 pour tous, les win rates ouverts dans Analytics et un nouveau menu",
    metaTitle: "OriginsMeta Tracker 0.4.0 pour Origins TCG",
    description:
      "OriginsMeta Tracker 0.4.0 est pour tous avec un compte gratuit : il enregistre vos parties d'Origins TCG, et ses win rates sont ouverts à tous dans Analytics.",
    summary:
      "OriginsMeta Tracker, notre application Windows qui enregistre vos parties d'Origins TCG, est désormais disponible pour tous avec un compte OriginsMeta gratuit : la version 0.4.0 se télécharge depuis la page Tracker. Les win rates qu'elle recueille sont ouverts à tous dans la nouvelle section Analytics, et le menu change : Guides, Cartes et Lieux se trouvent sous Database.",
    highlights: [
      { label: "OriginsMeta Tracker pour tous", text: "la version 0.4.0, le nouveau nom d'OriginsMeta Analytics, sur la page Tracker", anchor: "tracker" },
      { label: "Seulement avec un compte", text: "le compte est gratuit, et l'application ne fonctionne qu'associée", anchor: "compte" },
      { label: "Les win rates dans Analytics", text: "Légendaires, decks, archétypes et cartes, ouverts à tous", anchor: "analytics" },
      { label: "Un nouveau menu", text: "Database avec Guides, Cartes et Lieux ; Analytics avec le Tracker", anchor: "menu" },
    ],
    body: `## OriginsMeta Tracker pour tous {#tracker}

Jusqu'à hier, OriginsMeta Analytics, notre application Windows pour Origins TCG, était testée par les Creators, les Auteurs, les joueurs Pro et le Staff ([la version du 11 octobre](/fr/news/upgrade-meta-1011)). À partir d'aujourd'hui, elle s'appelle **OriginsMeta Tracker** et tout le monde peut la télécharger : la version 0.4.0 est sur la [page Tracker](/fr/tracker), avec le [guide d'installation pas à pas](/fr/tracker#installation).

Elle fait ce qu'elle faisait déjà : elle enregistre vos parties toute seule quelques secondes après la fin, lit les cartes jouées dans la fenêtre du jeu avec le scanner d'écran, affiche le Deck tracker en direct avec les cartes de l'adversaire et ajoute un overlay pour OBS. Elle ne touche jamais au jeu, et aucune image ne quitte votre PC.

## Seulement avec un compte OriginsMeta {#compte}

Pour télécharger l'application, vous vous connectez à OriginsMeta : le compte est gratuit. L'application ne fonctionne qu'associée à votre compte : après l'installation, créez un code sur la [page Tracker de votre compte](/fr/account/tracker) et saisissez-le dans l'application. Elle vérifie l'association au démarrage et toutes les 4 heures, en n'envoyant que son jeton.

Si vous avez déjà l'application, inutile de la télécharger de nouveau : elle se met à jour toute seule vers la version 0.4.0, puis vous demande d'associer votre compte si ce n'est pas encore fait.

## Les win rates, ouverts à tous dans Analytics {#analytics}

Les win rates calculés à partir des parties enregistrées avec l'application sont désormais ouverts à tous dans [Analytics](/fr/analytics) : Légendaires, decks de la communauté, archétypes, cartes, confrontations entre Légendaires et Légendaires que vous affrontez le plus, patch par patch. Seulement des totaux : jamais de noms, de parties isolées ni qui les a jouées. Les decks de la communauté affichent le win rate de leur liste exacte sur leur page et dans la [liste des decks](/fr/decks).

Jusqu'à hier, ces chiffres étaient l'onglet "Win rate" de la tier list : l'ancienne adresse mène maintenant à Analytics.

## Un nouveau menu {#menu}

Le menu du haut change pour faire de la place : **Database** réunit les [Guides](/fr/guides), les [Cartes](/fr/cards) et les [Lieux](/fr/locations), et **Analytics** contient les win rates et la page [Tracker](/fr/tracker). Sur téléphone, vous les trouvez dans le Menu.

OriginsMeta est un site de fans non officiel, non affilié à Koin Games.`,
    faq: [
      {
        q: "Comment télécharger OriginsMeta Tracker ?",
        a: "Connectez-vous à OriginsMeta (le compte est gratuit), ouvrez la page Tracker et appuyez sur le bouton de téléchargement. Le guide d'installation de la même page explique chaque étape, de l'extraction du zip à l'association de l'application à votre compte.",
      },
      {
        q: "Peut-on utiliser OriginsMeta Tracker sans compte ?",
        a: "Non : depuis la version 0.4.0, l'application ne fonctionne qu'associée à un compte OriginsMeta. Elle vérifie l'association au démarrage et toutes les 4 heures, en n'envoyant que son jeton.",
      },
      {
        q: "Où sont les win rates d'Origins TCG sur OriginsMeta ?",
        a: "Dans Analytics, dans le menu du haut : les win rates des Légendaires, des decks de la communauté, des archétypes et des cartes, patch par patch, d'après les parties enregistrées avec OriginsMeta Tracker.",
      },
    ],
  },
  "upgrade-meta-1011": {
    title: "Upgrade Meta : OriginsMeta Analytics 0.3.4, le tracker de parties d'Origins TCG avec un Deck tracker en direct",
    metaTitle: "OriginsMeta Analytics 0.3.4 : tracker Origins TCG",
    description:
      "OriginsMeta Analytics 0.3.4 : l'app Windows qui enregistre vos parties d'Origins TCG, avec Deck tracker en direct et cartes adverses. Bientôt pour tous.",
    summary:
      "OriginsMeta Analytics 0.3.4 est sortie, la version qui clôt cette semaine de travail sur notre app Windows pour Origins TCG. Elle enregistre vos parties toute seule pendant que vous jouez, lit les cartes dans la fenêtre du jeu et affiche un Deck tracker en direct : votre deck avec les cartes déjà piochées, les cartes restant dans le deck, la vie de votre héros et les cartes de l'adversaire au fur et à mesure. Aujourd'hui, elle est testée par les Creators, les Auteurs, les joueurs Pro et le Staff ; elle sera bientôt disponible pour tous.",
    highlights: [
      { label: "Vos parties, enregistrées", text: "résultat, deck, rounds, les cartes jouées des deux côtés et la Légendaire de l'adversaire, toutes seules, quelques secondes après la fin", anchor: "parties" },
      { label: "Deck tracker en direct", text: "vos 12 cartes qui s'assombrissent quand vous les piochez, la Légendaire, les cartes restant dans le deck et la vie de votre héros", anchor: "deck-tracker" },
      { label: "Les cartes de l'adversaire", text: "sa Légendaire, sa vie et les cartes qu'il révèle, une à une", anchor: "adversaire" },
      { label: "Plein écran ou fenêtre", text: "de n'importe quelle taille, démo et playtest, et elle se met à jour toute seule", anchor: "ecran" },
      { label: "Bientôt pour tous", text: "aujourd'hui, elle est testée par les Creators, les Auteurs, les joueurs Pro et le Staff", anchor: "pour-tous" },
    ],
    body: `## La version 0.3.4 {#version}

OriginsMeta Analytics est notre app Windows pour Origins TCG : elle enregistre vos parties pendant que vous jouez et vous montre en direct ce qui se passe dans votre deck. La version 0.3.4, publiée le 11 octobre 2026, clôt une semaine de travail pendant laquelle l'app a appris à lire les parties dans la fenêtre du jeu, car depuis le patch 0.7 le jeu n'enregistre plus les données des parties sur votre PC. C'est encore une version de test : la capture de couverture vient d'une vraie partie de la Demo 2.0, avec par-dessus les deux panneaux de l'app et ce qu'ils lisaient à ce moment-là (round 7), sans les noms des joueurs.

## Vos parties, enregistrées toutes seules {#parties}

Vous ouvrez l'app, vous jouez et, quelques secondes après la fin, la partie est dans votre historique : le résultat, le deck choisi dans le jeu, les rounds, les cartes jouées par vous et par votre adversaire round par round et la Légendaire de l'adversaire vue sur l'écran VS. Si vous reliez l'app à votre compte OriginsMeta, vos parties sont aussi sur le site.

Pour lire les cartes, l'app utilise le **scanner d'écran** : il ne regarde que la fenêtre d'Origins TCG, reconnaît les cartes sur votre PC et n'envoie aucune image. Seuls les identifiants des cartes arrivent sur le site, jamais les noms des joueurs. Le jeu n'est jamais modifié : aucun fichier écrit, aucune mémoire lue, rien qui change la façon de jouer.

## Le Deck tracker en direct {#deck-tracker}

Le nouveau Deck tracker, dessiné par Davdas pour être compris d'un coup d'œil, pas pour être lu : vos 12 cartes en grand, dans une grille 4 × 3 par coût. Une carte s'éteint un peu quand vous avez pioché l'une de ses deux copies (« 1/2 ») et devient sombre quand vous les avez piochées toutes les deux : l'app lit aussi les cartes de votre main. En dessous, votre Légendaire à part (elle s'assombrit, avec un zoom, au moment où vous la piochez), les cartes encore dans le deck et la vie de votre héros, les deux segments de l'anneau sous le héros.

![Le Deck tracker pendant une partie de la Demo 2.0 : cartes piochées assombries, 8 cartes dans le deck, 2 segments de vie](/media/analytics/deck-tracker-me.webp)

## Les cartes de l'adversaire {#adversaire}

Un second panneau, un peu plus petit, pour l'adversaire : sa Légendaire, sa vie et les cartes qu'il révèle, qui apparaissent une à une au fil de la partie. Il commence vide et n'affiche jamais de cases vides.

![Le panneau de l'adversaire : Dracula, un segment de vie restant, Quasimodo et Captain Ahab révélés](/media/analytics/deck-tracker-opp.webp)

Les deux panneaux restent au-dessus du jeu, sans le cadre de Windows : faites-les glisser où vous voulez, élargissez-les par les bords, vous n'aurez jamais à les faire défiler. Les mêmes panneaux sont aussi une source Navigateur pour OBS, pour celles et ceux qui streament.

## Plein écran ou fenêtre, démo et playtest {#ecran}

L'app fonctionne avec Origins TCG en plein écran ou dans une fenêtre de n'importe quelle taille et forme, quelle que soit la mise à l'échelle de Windows, avec la démo Steam et avec le playtest. Quand nous publions une nouvelle version, elle la télécharge et redémarre à jour toute seule, jamais pendant une partie.

## Bientôt pour tous {#pour-tous}

Aujourd'hui, OriginsMeta Analytics est testée par les Creators, les Auteurs, les joueurs Pro et le Staff du site : ils jouent avec chaque jour et nous disent ce qui ne va pas. Elle sera bientôt disponible au téléchargement pour tous, avec les pages de win rate qui utiliseront les parties de celles et ceux qui relient l'app (seulement des totaux, jamais qui a joué). Nous annoncerons la date ici et sur [notre Discord](https://discord.gg/RAG7nnrNGP).

OriginsMeta est un site de fans non officiel, non affilié à Koin Games.`,
    faq: [
      { q: "Quand OriginsMeta Analytics sera-t-elle disponible pour tous ?", a: "Bientôt : aujourd'hui, elle est testée par les Creators, les Auteurs, les joueurs Pro et le Staff. Nous annoncerons la date dans les actus et sur le Discord d'OriginsMeta." },
      { q: "OriginsMeta Analytics modifie-t-elle ou lit-elle le jeu ?", a: "Elle ne touche jamais au jeu : elle lit seulement l'image de la fenêtre d'Origins TCG et les fichiers que le jeu enregistre sur votre PC, sans rien écrire. Les images restent sur votre PC et seuls les identifiants des cartes arrivent sur le site, jamais les noms des joueurs." },
      { q: "Fonctionne-t-elle en plein écran et en fenêtre ?", a: "Oui, depuis la version 0.3.4 : plein écran ou fenêtre de n'importe quelle taille et forme, quelle que soit la mise à l'échelle de Windows, avec la démo Steam et avec le playtest." },
    ],
  },
  "upgrade-meta-1007": {
    title: "Upgrade Meta : OriginsMeta parle français, quatrième langue du site, avec toutes les cartes, guides et actus",
    metaTitle: "Upgrade Meta : OriginsMeta pour Origins TCG, en français",
    description:
      "OriginsMeta est en français : interface, actus, guides, 230 cartes, 44 lieux et Deck builder, avec les textes des cartes lus dans le jeu en français.",
    summary:
      "Depuis le 7 octobre 2026, OriginsMeta est aussi en français : l'interface, les actus, les 20 guides, les 230 cartes, les 44 lieux, la FAQ, les événements, MetaShifting, le Deck builder, les tier lists et les pages de la communauté, sur originsmeta.com/fr avec les mêmes adresses que les autres langues. Depuis le 8 octobre, les textes français des cartes sont les textes officiels du jeu, lus dans le jeu carte par carte. Les guides des decks, les guides de la communauté et les BD sont traduits en français automatiquement, et si vous lisez le français et trouvez une erreur, écrivez-nous.",
    highlights: [
      { label: "Le français est arrivé", text: "tout le site sur /fr : interface, actus, guides, cartes, lieux, FAQ, événements, MetaShifting, Deck builder, tier lists et communauté", anchor: "francais" },
      { label: "Les textes des cartes, désormais ceux du jeu", text: "depuis le 8 octobre, les pages des cartes en français affichent le texte officiel, lu dans le jeu, et tout le site utilise les mots-clés du jeu", anchor: "textes-des-cartes" },
      { label: "La communauté en français", text: "guides des decks, guides de la communauté et BD traduits automatiquement, tournois en français, Discord avec le lien français", anchor: "communaute" },
      { label: "Pourquoi le français", text: "le jeu est traduit en français et, après l'espagnol, c'est la quatrième langue du site", anchor: "pourquoi-le-francais" },
      { label: "Aidez-nous", text: "si vous lisez le français et trouvez une erreur, écrivez-nous : le bouton Votre avis ou notre Discord", anchor: "aidez-nous" },
    ],
    body: `## Le français est arrivé {#francais}

Depuis le 7 octobre 2026, OriginsMeta est aussi en français, la quatrième langue du site après l'anglais, l'italien et l'espagnol. Changez de langue avec EN · IT · ES · FR en haut de chaque page (sur téléphone, dans le Menu). Chaque page garde la même adresse que dans les autres langues, avec le préfixe /fr/ : originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. Si votre navigateur est en français, originsmeta.com vous amène directement à la version française, et hreflang et sitemap répertorient les quatre versions de chaque page.

Ce qui est en français : l'interface, les 32 actus déjà publiées, les 20 [guides](/fr/guides), les pages des 230 [cartes](/fr/cards) (texte de la carte et note d'origine), les 44 [lieux](/fr/locations), la [FAQ](/fr/faq), les [événements](/fr/tournaments), l'historique des équilibrages ([MetaShifting](/fr/metashifting)), le [Deck builder](/fr/deck-builder), les [tier lists](/fr/tier-list) et les pages de la communauté. Nous écrivons un français standard, lisible dans tous les pays francophones, et les noms des cartes restent en anglais, comme dans le jeu.

Le français était déjà apparu dans la première version du site, en septembre 2026, et avait été retiré le 15 septembre : il revient refait de zéro, avec les mêmes règles SEO que les autres langues (un seul H1 par page, un title et une description propres, des liens internes, des données structurées).

## Les textes des cartes en français : ceux du jeu, depuis le 8 octobre {#textes-des-cartes}

Mise à jour du 8 octobre : nous avons lu les cartes dans le jeu en français. Les 122 cartes de la collection de la Demo 2.0 affichent désormais sur leur page le texte officiel français, comme en italien et en espagnol, et tout le site (pages des cartes, étiquettes des mots-clés, guides, actus, Deck builder) utilise les mots-clés du jeu. Trois diffèrent du glossaire provisoire de départ : First Strike se dit « Première frappe » (et non « Initiative »), un emplacement du plateau est une « case » et les personnages Evil, dans le texte des règles, sont « Mauvais ». Les cartes créées et les cartes retirées, que la collection du jeu n'affiche pas, restent notre traduction, désormais avec le glossaire du jeu, et leurs pages le disent. Les 44 lieux n'ont encore été vérifiés dans le jeu dans aucune langue.

À l'arrivée du français, le 7 octobre, les textes des cartes étaient une traduction d'OriginsMeta, écrite avec un glossaire provisoire des mots-clés (On Reveal « À la révélation », Shield « Bouclier », Trample « Piétinement », Deathtouch « Contact mortel », Defender « Défenseur », First Strike « Initiative »), et chaque page de carte en français le disait.

## La communauté en français {#communaute}

Ce que publie la communauté est aussi traduit en français, automatiquement, après la publication, comme c'est déjà le cas entre l'anglais, l'italien et l'espagnol : les guides des decks publiés (decks individuels et decks de tournoi), les guides de la communauté et les BD des Creators. Les traductions de ce qui est déjà en ligne arrivent dans les prochains jours. Les tournois peuvent aussi être créés en français, et [notre Discord](https://discord.gg/RAG7nnrNGP) annonce les nouveautés avec, en plus, le lien vers la page française.

## Pourquoi le français {#pourquoi-le-francais}

Origins TCG est traduit en français : la page Steam du jeu compte le français parmi ses 13 langues, interface et audio compris. Après [l'espagnol, arrivé le 25 septembre](/fr/news/upgrade-meta-0925), le français est la quatrième langue d'OriginsMeta, pour la même raison : être lu dans les langues que parle le jeu.

## Aidez-nous à bien faire {#aidez-nous}

Si vous lisez le français et trouvez une erreur, une phrase maladroite ou un mot-clé qui ne correspond pas au jeu, dites-le-nous : avec le bouton Votre avis, sur chaque page, ou sur notre Discord. Nous lisons tout et corrigeons à la prochaine mise à jour.`,
    faq: [
      {
        q: "OriginsMeta est-il disponible en français ?",
        a: "Oui, depuis le 7 octobre 2026 : tout le site, avec les guides, les actus, les cartes, les lieux, les tier lists et le Deck builder. Changez de langue avec EN · IT · ES · FR en haut de la page ; les guides des decks de la communauté, les guides et les BD sont traduits automatiquement.",
      },
      {
        q: "Les textes français des cartes sont-ils officiels ?",
        a: "Oui, depuis le 8 octobre 2026 : nous avons lu dans le jeu en français les 122 cartes de la collection de la Demo 2.0, et leurs pages affichent le texte officiel, comme en italien et en espagnol (lus le 25 septembre). Les cartes créées et les cartes retirées, que la collection du jeu n'affiche pas, restent notre traduction avec le glossaire du jeu, et leurs pages le disent.",
      },
      {
        q: "Les decks et les guides de la communauté sont-ils traduits en français ?",
        a: "Oui, automatiquement après la publication : les guides des decks publiés, les guides de la communauté et les BD des Creators. Les traductions de ce qui est déjà en ligne arrivent dans les prochains jours, et les tournois peuvent aussi être créés en français.",
      },
    ],
  },
  "upgrade-meta-1005": {
    title: "Upgrade Meta : les decks de tournoi, trois decks Conquest publiés ensemble avec un seul guide",
    metaTitle: "Upgrade Meta : les decks de tournoi d'Origins TCG",
    description:
      "Nouveau sur OriginsMeta : les decks de tournoi, trois decks Conquest d'Origins TCG publiés ensemble avec un guide, règles de la Crimson Cup déjà vérifiées.",
    summary:
      "La section Decks a désormais deux parties : decks simples et decks de tournoi. Un deck de tournoi est un trio de decks Conquest publié avec un seul guide qui explique comment ils travaillent en équipe, et le site vérifie pour vous les règles de la Crimson Cup avant la publication.",
    highlights: [
      { label: "Decks de tournoi", text: "trois decks Conquest et un guide sur une seule page, dans Decks", anchor: "decks-de-tournoi" },
      { label: "Comment publier", text: "mode Tournoi dans le deck builder, puis « Publier les 3 decks »", anchor: "publier" },
      { label: "Règles Conquest", text: "trois Légendaires différentes et au moins 8 cartes différentes entre deux decks", anchor: "regles" },
      { label: "La page d'un trio", text: "le rôle de chaque deck, les trois codes du jeu, les votes et le guide traduit", anchor: "page-trio" },
      { label: "Pour les streamers", text: "lien court, commande de chat !deck, overlay pour OBS et image du trio", anchor: "streamers" },
    ],
    body: `## Decks de tournoi {#decks-de-tournoi}

Dans un tournoi Conquest comme la Crimson Cup, vous n'apportez pas un deck, vous en apportez trois. Jusqu'ici, OriginsMeta n'avait que des decks simples : un trio devait donc être publié en trois pages séparées, chacune avec son guide. Le menu [Decks](/fr/decks) a désormais deux parties : **Decks simples** et **[Decks de tournoi](/fr/decks/tournament)**.

Un deck de tournoi, ce sont trois decks publiés ensemble, avec **un seul guide** pour tout le trio : le plan de jeu des trois decks et le rôle de chacun (quand le choisir, quels matchups il couvre), plus les points forts, les points faibles, les matchups et des notes si vous voulez les ajouter.

## Comment publier un deck de tournoi {#publier}

1. Ouvrez le [deck builder](/fr/deck-builder) et passez en **Tournoi (3 decks)**. Le bouton « Publier un deck de tournoi » de la page [Decks de tournoi](/fr/decks/tournament) l'ouvre déjà dans ce mode.
2. Construisez les decks A, B et C. Le tableau sous les decks indique combien de cartes différentes compte chaque paire.
3. Quand les trois decks sont complets et respectent les règles, appuyez sur **Publier les 3 decks**.
4. Donnez un nom au trio, écrivez le plan de jeu et le rôle de chaque deck, puis publiez.

Vous devez être [connecté](/fr/login). Vos decks de tournoi sont dans [votre compte](/fr/account), où vous pouvez les modifier, les masquer ou les supprimer, et sur votre profil public. Chaque compte peut publier autant de decks de tournoi que de decks simples (5 pour les comptes de la communauté, 20 pour les Auteurs, sans limite pour les Creators, les joueurs Pro et le Staff), comptés à part.

## Les règles Conquest, vérifiées pour vous {#regles}

Chaque trio respecte les règles de la Crimson Cup, celles que le deck builder utilise déjà :

- **trois Légendaires différentes**, une par deck ;
- **au moins 8 cartes uniques différentes entre deux decks** : chaque carte compte une fois, Légendaire comprise, donc deux decks peuvent avoir au plus 5 cartes en commun.

Si un trio ne les respecte pas, le bouton reste désactivé et le deck builder vous dit ce qui ne va pas ; le site vérifie de nouveau au moment de publier. Notre [guide du Conquest](/fr/guides/origins-tcg-conquest) explique comment construire trois decks qui tiennent ensemble.

## La page d'un trio {#page-trio}

- Le plan de jeu en haut, puis **les trois decks** : pour chacun, son rôle dans le trio, les cartes entières, le **code du jeu** à coller dans Origins TCG et « Ouvrir dans le deck builder ».
- Un encadré avec les règles Conquest et les cartes différentes entre chaque paire de decks.
- Des **votes** de 1 à 5 étoiles, comme pour les decks simples (jamais sur votre propre trio).
- Le guide s'écrit dans une langue et se **traduit automatiquement** dans les autres langues du site.
- Quand vous publiez, le trio est annoncé en direct sur notre [Discord](https://discord.gg/RAG7nnrNGP), dans #community-decks, et vos abonnés reçoivent une notification si vous êtes Creator, Auteur, joueur Pro ou Staff.
- Dans votre compte, vous voyez les visites, les codes copiés et les clics de vos trios : ce sont des estimations, comme pour les decks simples.

## Pour les streamers {#streamers}

Chaque deck de tournoi a les mêmes outils que les decks simples, dans le menu « Pour les streamers » de sa page :

- un **lien court**, originsmeta.com/d/ suivi du code du trio, à dire en stream ;
- la **commande de chat !deck** pour Nightbot, StreamElements et Fossabot, qui écrit dans le chat le trio et ses trois Légendaires ;
- un **overlay pour OBS** avec les trois decks, vertical ou horizontal ;
- une **image** du trio à télécharger en 16:9 ou 9:16.

La commande et l'overlay ne sont proposés qu'à la personne qui a publié le trio. Le [guide du streaming](/fr/guides/streaming-tools) explique pas à pas comment les ajouter.

## Participez {#participer}

Construisez vos trois decks dans le [deck builder](/fr/deck-builder), publiez-les et envoyez le lien à votre équipe avant le tournoi. Soyez parmi les premiers à publier dans [Decks de tournoi](/fr/decks/tournament).`,
    faq: [
      {
        q: "Comment publier trois decks Conquest ensemble sur OriginsMeta ?",
        a: "Dans le deck builder, passez en mode Tournoi, construisez les decks A, B et C avec trois Légendaires différentes et au moins 8 cartes différentes entre deux decks, puis appuyez sur « Publier les 3 decks » et écrivez un seul guide pour le trio.",
      },
      {
        q: "Les decks de tournoi respectent-ils les règles de la Crimson Cup ?",
        a: "Oui. Chaque trio a trois Légendaires différentes et au moins 8 cartes uniques différentes entre deux decks, Légendaire comprise. Le deck builder et le site le vérifient avant la mise en ligne du trio.",
      },
    ],
  },
  "upgrade-meta-1003": {
    title: "Upgrade Meta : draft contre le Cerveau, versions des decks, decks enregistrés et nouveaux filtres de cartes",
    metaTitle: "Upgrade Meta : draft et versions des decks d'Origins TCG",
    description:
      "Nouveau sur OriginsMeta : draft d'Origins TCG contre notre bot ou un ami, decks à mettre à jour vers la 0.7, decks enregistrés et tendance, nouveaux filtres.",
    summary:
      "Ces derniers jours, OriginsMeta a reçu un draft d'Origins TCG gratuit, contre notre bot ou contre un ami, et vous pouvez désormais mettre à jour vos decks publiés vers le patch 0.7 sans perdre le nom, le guide et les votes. Vous pouvez aussi enregistrer les decks qui vous plaisent, trouver ceux qui sont en tendance, filtrer les cartes par coût, mot-clé, Puissance et Santé, et voir l'avant et l'après des cartes modifiées par chaque patch.",
    highlights: [
      { label: "Draft", text: "trois formats contre le Cerveau, notre bot, ou contre un ami dans un salon en ligne", anchor: "draft" },
      { label: "Versions des decks", text: "mettez à jour un deck publié vers le patch 0.7 en gardant son nom, son guide et son lien", anchor: "versions-des-decks" },
      { label: "Decks enregistrés et tendance", text: "le bouton Enregistrer, les tris Tendance et Les plus enregistrés, et le filtre par version du jeu", anchor: "decks-enregistres" },
      { label: "Cartes et MetaShifting", text: "filtres par coût, mot-clé, Puissance et Santé, et l'avant et l'après de chaque patch", anchor: "cartes" },
      { label: "OriginsMeta Analytics", text: "notre tracker de parties, en pause depuis le patch 0.7 : dites-nous s'il vous intéresse", anchor: "analytics" },
      { label: "Connexion et profil", text: "le code de l'e-mail à côté du lien et une page à part pour votre profil public", anchor: "compte" },
      { label: "Guides et BD", text: "le guide des outils de stream et les BD dessinées en plusieurs langues", anchor: "guides-bd" },
    ],
    body: `## Draft contre le Cerveau ou contre un ami {#draft}

Le [Draft](/fr/draft) est une façon gratuite de construire un deck d'Origins TCG avec des cartes choisies une par une. Vous choisissez votre Légendaire et vos cartes, puis vous construisez le deck avec les règles du jeu (1 Légendaire et 12 cartes, chacune comptant deux fois : 25 cartes). Il y a trois formats :

- **Échange** : vous voyez 3 cartes, vous en gardez une, vous en donnez une à votre adversaire et la troisième est brûlée.
- **Triple** : 3 cartes communes, un joueur choisit, puis l'autre, et la troisième est brûlée. Vous voyez tout ce que prend votre adversaire.
- **Boosters** : des boosters de 6 cartes que vous vous passez à tour de rôle, comme dans un TCG papier. Vous ne voyez pas les choix de votre adversaire.

**Contre le Cerveau**, vous jouez tout de suite, sans compte : le Cerveau est notre bot et il ne sait que ce qu'un joueur à sa place saurait. **Contre un ami**, vous créez un salon et envoyez le lien ou le code : le draft commence dès que votre ami arrive, avec un temps limité pour chaque choix (quand le temps est écoulé, le Cerveau choisit pour celui qui ne l'a pas fait). Vous devez tous les deux être connectés.

À la fin, le Cerveau donne son verdict sur les deux decks, d'Exceptionnel à Faible, selon la courbe, les suppressions et les synergies : c'est l'avis du bot, la vraie partie se joue dans le jeu. Vous pouvez copier le code du jeu, ouvrir le deck dans le [deck builder](/fr/deck-builder) ou défier un ami sur le même draft, avec les mêmes cartes dans le même ordre.

## Versions des decks {#versions-des-decks}

Après le [patch 0.7](/fr/news/patch-0-7), beaucoup de decks publiés avaient des cartes qui coûtent désormais plus cher. Vous pouvez maintenant **mettre à jour les cartes d'un deck publié** en gardant son nom, son guide, ses vidéos et son lien : sur la page de votre deck, ou dans [votre compte](/fr/account), appuyez sur « Mettre à jour vers la version 0.7 », changez les cartes dans le deck builder et enregistrez. Avant d'enregistrer, vous voyez ce qui entre et ce qui sort.

Les versions précédentes restent sur la page du deck, sous « Versions de ce deck », avec leurs changements et leur note. Les votes ne sont jamais supprimés : la note affichée est celle de la version en vigueur, et les votes plus anciens restent attachés à la version qui les a reçus.

## Decks enregistrés et tendance {#decks-enregistres}

- **Enregistrer** : sur la page de chaque deck, un bouton permet de l'enregistrer. Vous retrouvez vos decks enregistrés dans [votre compte](/fr/account), sous « Decks enregistrés ». La liste n'est visible que par vous.
- **Nouveaux tris** dans [Decks](/fr/decks) : **Tendance**, les decks qui ont attiré le plus d'attention cette semaine (vues, codes copiés, votes et enregistrements), et **Les plus enregistrés**.
- **Version du jeu** : le panneau de filtres de Decks a désormais la version du jeu, avec le nombre de decks de chacune. Chaque deck affiche le patch pour lequel il a été construit.

## Cartes et MetaShifting {#cartes}

- Dans [Cartes](/fr/cards), une rangée de filtres par coût (de 0 à 6, et 7+) reste toujours visible, et sous « Plus de filtres » se trouvent le mot-clé et les plages de Puissance et de Santé, plus un bouton pour tout effacer.
- Dans [MetaShifting](/fr/metashifting), chaque patch s'ouvre désormais sur « Avant et après » : chaque carte dont le coût, la Puissance ou la Santé a changé, côte à côte, avec les valeurs modifiées mises en évidence.

## OriginsMeta Analytics {#analytics}

OriginsMeta Analytics est notre application Windows qui enregistre toute seule vos parties d'Origins TCG pendant que vous jouez : le deck, le résultat, les Légendaires affrontées, avec un overlay au-dessus du jeu et pour OBS. Elle est prête et elle fonctionne, mais depuis le patch 0.7 le jeu n'enregistre plus sur votre PC les données de partie que l'application lisait : pour l'instant, elle est en pause, et les pages de win rate sont désactivées.

Nous voulons la montrer à l'équipe de Koin Games et demander si ces données peuvent redevenir disponibles. Si elle vous intéresse, appuyez sur **« Oui, ça m'intéresse »** sur la page : plus les joueurs le demandent, plus la demande pèse.

## Connexion et profil {#compte}

- **Code de l'e-mail** : l'e-mail de connexion contient désormais un code à côté du lien. Si le lien s'ouvre dans un autre navigateur (votre téléphone, l'application Gmail) ou ne fonctionne pas, saisissez le code dans le panneau de connexion, sous « Vous avez déjà le code de l'e-mail ? ».
- **Votre page publique** : dans votre compte, sous votre page publique, le bouton « Modifier ma page publique » mène à une page à part avec votre bio, vos chaînes, votre photo et, pour les Creators, les Auteurs, les joueurs Pro et le Staff, la vitrine.
- **Menu** : sur ordinateur, Tier list et Deck builder ouvrent un sous-menu, avec les pages de la tier list, Analytics et le Draft.

## Guides et BD {#guides-bd}

- Un nouveau guide : [streamer Origins TCG](/fr/guides/streaming-tools), avec l'overlay pour OBS, la commande de chat !deck, les liens courts et le badge LIVE, pas à pas.
- Les BD peuvent désormais avoir une version dessinée dans chaque langue : les lecteurs voient la version dessinée dans leur langue à la place de la traduction automatique.
- Les guides des decks publiés avant le patch 0.7 gardent leur stratégie telle qu'elle a été écrite, avec une note en haut : les tableaux de cartes affichent les nouveaux coûts.

## Participez {#participer}

[Inscrivez-vous](/fr/login) gratuitement avec Discord ou votre e-mail, essayez le [Draft](/fr/draft) et mettez vos decks à jour vers le patch 0.7. Et [rejoignez notre Discord](https://discord.gg/RAG7nnrNGP) : tout ce qui sort sur le site y est annoncé.`,
    faq: [
      {
        q: "Existe-t-il un mode draft pour Origins TCG ?",
        a: "Pas encore dans le jeu, mais OriginsMeta en propose un gratuit sur originsmeta.com/fr/draft : trois formats contre le Cerveau, notre bot, sans compte, ou contre un ami dans un salon en ligne. À la fin, vous pouvez copier le code du jeu de votre deck.",
      },
      {
        q: "Comment mettre à jour mon deck publié vers le patch 0.7 ?",
        a: "Sur la page de votre deck ou dans votre compte, appuyez sur « Mettre à jour vers la version 0.7 », changez les cartes dans le deck builder et enregistrez. Le nom, le guide, les vidéos et le lien ne changent pas, et la version précédente reste sur la page avec sa note.",
      },
      {
        q: "Pourquoi les win rates sont-ils désactivés ?",
        a: "Depuis le patch 0.7, le jeu n'enregistre plus sur votre PC les données de partie qu'OriginsMeta Analytics lisait. L'application est en pause : si elle vous intéresse, dites-le sur la page Analytics, et nous la montrerons à Koin Games.",
      },
    ],
  },
  "playtest-patch-notes-1001": {
    title: "Notes de patch du playtest d'Origins TCG : missions séparées du classé et deux nouveaux lieux",
    metaTitle: "Playtest d'Origins TCG : missions, classé, lieux",
    description:
      "Le playtest d'Origins TCG mis à jour le 1er octobre : missions PvE séparées du classé, filtres du deck builder, deux nouveaux lieux et pool de tournoi.",
    summary:
      "Koin Games a mis à jour la build du playtest de la Demo 2.0, sa plus grosse mise à jour depuis la 0.6.3. Les missions deviennent uniquement PvE et ne bloquent plus l'accès au classé, le deck builder gagne des filtres et deux lieux arrivent. Les dix changements d'équilibrage sont ceux que la démo principale a déjà.",
    highlights: [
      { label: "Missions et classé séparés", text: "missions uniquement PvE, matchmaking du classé quand vous voulez", anchor: "missions-classe" },
      { label: "Un deck builder avec plus de filtres", text: "mots-clés au survol, une ou deux copies bien indiquées", anchor: "deck-builder" },
      { label: "Rang mondial sur l'écran d'avant-match", text: "pour les joueurs Grandmaster", anchor: "grandmaster" },
      { label: "Animations plus rapides", text: "et un curseur séparé pour le volume des voix", anchor: "vitesse-audio" },
      { label: "Dix changements d'équilibrage", text: "tous déjà dans la démo principale et sur OriginsMeta", anchor: "equilibrage" },
      { label: "Cinq changements de cartes inédits dans ces notes", text: "En Passant, Étourdi, Contact mortel, Boitata, Reflection", anchor: "nouveaux-changements" },
      { label: "Deux nouveaux lieux, un retiré", text: "Ballroom et Tectonic Decay arrivent, Ashen Grove s'en va", anchor: "nouveaux-lieux" },
      { label: "Un pool de lieux pour les tournois", text: "les parties en salon l'utilisent aussi", anchor: "pool-tournois" },
    ],
    body: `## Le playtest rattrape la démo {#playtest}

Koin Games a mis à jour le playtest de la Demo 2.0, la build à part à laquelle on accède par le Discord officiel. « C'est notre plus grosse mise à jour depuis la 0.6.3 », écrit l'équipe, qui prévient que la build sort tout droit du développement : il y aura des bugs et des éléments provisoires. Beaucoup de ces changements, ajoute l'équipe, étaient déjà arrivés dans la démo principale avec [la mise à jour du 21 septembre](/fr/news/demo-patch-notes-0921) et le [patch 0.7](/fr/news/patch-0-7).

## Missions et classé séparés {#missions-classe}

Les missions et les boss sont désormais entièrement PvE : vous n'affrontez que des bots, et ils ne servent qu'à débloquer des decks. Ils ont leur propre bouton Jouer sur l'écran des Missions, si bien que le bouton Jouer de l'écran d'accueil ne sert plus qu'au vrai matchmaking, que vous pouvez utiliser quand vous voulez.

- Vous n'avez plus à terminer toutes les missions pour que le matchmaking du classé vous trouve un adversaire : il essaie de vous en trouver un adapté chaque fois que vous jouez en classé. L'équipe y travaille encore.
- **Dans ce playtest, les missions de deck ne peuvent pas être accomplies depuis le mode classé.** L'équipe les réactivera dans une build future. S'il vous reste des decks à débloquer, jouez les missions depuis la zone Missions.
- Le parcours de récompenses étale les gains sur davantage de missions, et l'écran des Missions permet de changer de deck.

Comment fonctionne le classé dans la démo, et ce que nous savons de la ladder, c'est dans [notre guide du mode classé](/fr/guides/origins-tcg-ranked).

**Mise à jour du 11 octobre :** avec la mise à jour 0.7.1 du playtest du 8 octobre, les parties classées comptent de nouveau pour les missions de deck, et les missions peuvent toujours se jouer en PvE depuis l'espace Missions ([les notes de patch de la 0.7.1](/fr/news/playtest-patch-notes-0-7-1#classe-missions)).

## Deck builder, fil d'actualités et Grandmaster {#interface}

### Un deck builder avec plus de filtres {#deck-builder}

Une nouvelle barre d'outils avec plus de filtres. Au survol d'une carte de la collection, ses mots-clés s'affichent. Le deck montre désormais clairement de quelles cartes vous avez deux copies et de quelles une seule : les nouveaux joueurs s'y perdaient.

### Un fil d'actualités dans le jeu {#actus-dans-le-jeu}

Le jeu a son propre fil d'actualités : si vous lisez les notes là, écrit l'équipe, vous l'avez déjà vu.

### Rang mondial sur l'écran d'avant-match {#grandmaster}

Les joueurs de la division Grandmaster, la plus haute, affichent désormais leur rang mondial sur l'écran qui précède la partie.

### Gradation des cartes : pas encore {#gradation}

Les visuels de la gradation des cartes ne sont pas dans cette mise à jour, et les informations « How Grading Works » que vous trouverez sont provisoires : l'équipe vous demande de les ignorer. Elle demande en revanche vos retours sur l'ouverture des boosters, sur Discord.

## Vitesse et audio {#vitesse-audio}

Les animations et les pauses entre elles sont plus rapides. « Il reste encore beaucoup de travail là-dessus », écrit l'équipe : la vitesse reste l'une de ses priorités les plus hautes. Les voix sont plus professionnelles et mieux mixées, et il y a un curseur séparé pour le volume des voix.

## Équilibrage des cartes : tout est déjà sur OriginsMeta {#equilibrage}

Les dix changements d'équilibrage des notes sont ceux que la démo principale a reçus avec la mise à jour du 21 septembre et avec le patch 0.7 : les pages des cartes, le [deck builder](/fr/deck-builder) et [MetaShifting](/fr/metashifting) les utilisent déjà. Format : mana · Puissance/Santé pour les personnages, mana seul pour les sorts.

| Carte | Avant | Après | Dans la démo depuis |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21 septembre |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21 septembre |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21 septembre |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21 septembre |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21 septembre |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21 septembre |
| Roo | 2 · 2/3 | 2 · 2/4 | 21 septembre |
| Bagheera | 1 · 1/1 | 2 · 1/1 | patch 0.7 |
| Spellbook | 3 | 4 | patch 0.7 |
| Mind Palace | 2 | 3 | patch 0.7 |

## Les cartes dont l'effet change {#effets}

### Inédits dans ces notes {#nouveaux-changements}

Cinq changements n'apparaissent pas dans les notes de patch de la démo du 21 et du 29 septembre :

- **En Passant** peut désormais cibler des cases occupées : si la case est occupée, votre allié reste où il est mais inflige quand même ses dégâts.
- **Étourdi** est désormais retiré à la fin du combat.
- **Contact mortel** ne détruit plus les personnages avec Bouclier.
- **Boitata** devrait mieux se comporter, surtout quand les deux joueurs en ont un.
- **Reflection** a un texte un peu plus clair ; l'équipe admet que la carte aura peut-être besoin d'une intervention plus profonde pour devenir plus intuitive.

Nous ne savons pas encore s'ils sont déjà dans la démo principale : nous vérifierons dans le jeu avant de changer les pages des cartes.

### Déjà dans la démo {#deja-dans-la-demo}

- Don Quixote a lui-même Défenseur, en plus de le donner aux ennemis de son lieu (21 septembre : les notes de la démo disaient seulement qu'il gagnait Défenseur).
- Twister Toss peut déplacer un allié vers une case occupée, et les deux échangent leur place (patch 0.7).
- Van Helsing's Tools : Silver Bullet peut toucher les barrières ; Wooden Stake peut cibler des personnages non blessés, mais ne fonctionne que si le personnage est blessé au moment où il se résout (21 septembre).
- Heroic Charge se cumule correctement quand il est lancé plus d'une fois (21 septembre).
- Spellbook et Humpty ne peuvent plus se générer eux-mêmes comme carte aléatoire (patch 0.7).
- Les personnages avec Choisissez peuvent choisir de nouveau s'ils reviennent dans votre main, et ils gardent leurs statistiques (21 septembre, pour Frog Prince et Magic Carpet).
- Les cartes gardent leurs statistiques dans le cimetière : une Mummy renforcée revient avec toute sa Puissance (21 septembre).

## Lieux {#lieux}

### Deux nouveaux, un retiré {#nouveaux-lieux}

- **Ballroom** (nouveau) : après le combat, pour les deux joueurs, un personnage aléatoire ici retourne dans la main de son propriétaire.
- **Tectonic Decay** (nouveau) : après le combat, infligez 1 dégât aux deux barrières ici.
- **Ashen Grove** (retiré) : quand vous jouiez un personnage ici, vous défaussiez votre carte la plus à droite, puis vous piochiez une carte.

Les notes comparent le playtest à sa build précédente. Notre page des [Lieux](/fr/locations), la liste de la Demo 2.0 au 21 septembre, a déjà Ballroom et a encore Ashen Grove, tandis que Tectonic Decay n'y est pas : nous la mettrons à jour quand nous aurons vu quels lieux sont dans la démo principale.

### Rareté et pool de tournoi {#pool-tournois}

La rareté des lieux est désormais une vraie rareté, commun, rare, très rare ou ultra rare, qui ne dépend plus du nombre de lieux dans le jeu : le même changement que la démo a reçu avec le patch 0.7.

Les tournois ont désormais leur propre pool de lieux, si bien qu'on peut inclure ou exclure des lieux des compétitions sans changer les parties de tous les jours. Le premier exemple est la [Crimson Cup](/fr/news/crimson-cup-format-check-in) : certains des lieux les plus capables de renverser une partie sont hors de son pool. L'équipe dit que la liste complète est dans sa dernière annonce ; nous la rapporterons dès que nous l'aurons lue.

**Mise à jour du 7 octobre :** la liste est arrivée avec le post Steam du 5 octobre : Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum et Nostradamus' Call sont hors du pool de la Crimson Cup ([notre article](/fr/news/crimson-cup-prizepool-qualifiers#lieux)).

Dans cette build, les parties en salon (Create/Join Room Battle) utilisent le pool de tournoi : c'est le moyen de s'entraîner avec les lieux de la Crimson Cup.

## Ce que nous ne savons pas encore {#inconnues}

- Si les cinq nouveaux changements de cartes, Tectonic Decay et le retrait d'Ashen Grove sont déjà dans la démo principale.
- Quels lieux sont hors du pool de la Crimson Cup : réponse arrivée le 5 octobre, voir la mise à jour ci-dessus.
- Le nouveau texte de Reflection.

## Ce qui change sur OriginsMeta {#sur-le-site}

- Les statistiques des cartes ne changent pas : les dix changements d'équilibrage sont dans la base de cartes, le deck builder et MetaShifting depuis le 21 et le 29 septembre.
- Les pages d'En Passant, de Boitata et de Reflection gardent leur texte actuel jusqu'à ce que nous lisions le nouveau dans le jeu.
- La page des [Lieux](/fr/locations) reste telle quelle jusqu'à ce que nous ayons vérifié les nouveaux lieux dans la démo principale.

## D'où viennent ces notes {#sources}

Les notes de patch que l'équipe a publiées sur le [Discord officiel d'Origins TCG](https://discord.gg/originstcg) le 1er octobre, avec la mise à jour du playtest ; comment rejoindre le playtest est expliqué dans le salon Discord demo-v2-playtest-instructions. Au 1er octobre, elles ne sont pas sur Steam.`,
    faq: [
      {
        q: "Faut-il terminer les missions pour jouer en classé dans le playtest d'Origins TCG ?",
        a: "Non. Depuis la mise à jour du playtest du 1er octobre 2026, les missions sont uniquement PvE et servent à débloquer des decks, et le matchmaking du classé vous trouve un adversaire chaque fois que vous jouez en classé. Dans ce playtest, toutefois, les missions de deck ne peuvent pas être accomplies depuis le classé : jouez-les depuis l'écran des Missions.",
      },
      {
        q: "La mise à jour du playtest change-t-elle les statistiques des cartes pour la Crimson Cup ?",
        a: "Non. Ses dix changements d'équilibrage, comme Dorothy à 4 mana et Bagheera à 2, sont ceux que la démo principale a déjà reçus les 21 et 29 septembre 2026 ; le patch 0.7 est le dernier patch d'équilibrage avant le tournoi.",
      },
      {
        q: "Comment s'entraîner avec les lieux de la Crimson Cup ?",
        a: "Dans la build du playtest, les parties en salon (Create/Join Room Battle) utilisent le pool de lieux des tournois, dont certains des lieux les plus capables de renverser une partie ont été retirés pour la Crimson Cup.",
      },
    ],
  },
  "patch-0-7": {
    title: "Patch 0.7, le dernier d'équilibrage avant la Crimson Cup : rework de Twister Toss, trois cartes plus chères",
    metaTitle: "Patch 0.7 d'Origins TCG : Twister Toss et trois nerfs",
    description:
      "Patch 0.7 d'Origins TCG, le dernier d'équilibrage avant la Crimson Cup : rework de Twister Toss, Bagheera, Mind Palace et Spellbook coûtent 1 de plus.",
    summary:
      "Le patch 0.7, deuxième mise à jour de la démo, est le dernier patch d'équilibrage avant la Crimson Cup. Twister Toss reçoit un rework, Bagheera, Mind Palace et Spellbook coûtent 1 mana de plus, et les lieux apparaissent désormais selon leur rareté. Il corrige aussi Humpty, Spellbook, Heroic Charge et les Défenseurs multiples, et porte le jeu à 13 langues.",
    highlights: [
      { label: "Le dernier patch d'équilibrage avant la Crimson Cup", text: "sorti le 29 septembre, trois semaines avant la première qualification", anchor: "crimson-cup" },
      { label: "Rework de Twister Toss", text: "le sort déplace un allié vers n'importe quelle case et l'échange avec la carte déjà présente", anchor: "twister-toss" },
      { label: "Trois cartes coûtent 1 de plus", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "couts" },
      { label: "Humpty et Spellbook ne se donnent plus eux-mêmes", anchor: "humpty-spellbook" },
      { label: "Main pleine", text: "une carte renvoyée brûle désormais au lieu de faire échouer la capacité", anchor: "main-pleine" },
      { label: "Heroic Charge et Défenseur corrigés", anchor: "bugs" },
      { label: "Les lieux ont une rareté", text: "commun, rare, très rare ou ultra rare", anchor: "lieux" },
      { label: "13 langues dans le jeu", anchor: "langues" },
      { label: "Boogeyman", text: "les notes disent qu'il change, pas comment", anchor: "boogeyman" },
    ],
    body: `## Le dernier patch d'équilibrage avant la Crimson Cup {#crimson-cup}

« C'est le DERNIER patch d'équilibrage avant le tournoi », écrit l'équipe. La Crimson Cup commence le 20 octobre avec la qualification EMEA, pendant le Steam Next Fest, et se joue en Conquest à trois decks ([les règles](/fr/news/crimson-cup-format-check-in)). Le 24 septembre, l'équipe avait dit que le dernier patch d'équilibrage arriverait deux semaines avant le festival : il est arrivé le 29 septembre, trois semaines avant. Si le programme tient, ce sont ces coûts et ces statistiques qui serviront pour le tournoi.

L'image officielle l'appelle Steam Demo Update #2, version 0.7 : c'est la deuxième mise à jour de la démo, après [celle du 21 septembre](/fr/news/demo-patch-notes-0921).

## Tous les changements d'équilibrage {#equilibrage}

Format : mana · Puissance/Santé pour les personnages, mana seul pour les sorts.

| Carte | Avant | Après | Ce qui change |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | coûte 1 de plus |
| Mind Palace | 2 | 3 | coûte 1 de plus |
| Spellbook | 3 | 4 | coûte 1 de plus ; ses sorts aléatoires ne peuvent plus être Spellbook |
| Twister Toss | 1 | 1 | rework : déplace un allié vers n'importe quelle case et l'échange avec la carte déjà présente |

Aucune Légendaire ne change de coût, de statistiques ni de capacité : Dorothy reçoit seulement une explication plus claire de ses mots-clés.

## Rework de Twister Toss {#twister-toss}

Jusqu'ici Twister Toss, un sort à 1 mana, ne faisait qu'une chose : déplacer un allié. Après le rework, il déplace un allié vers n'importe quelle case et, si une autre carte s'y trouve déjà, les deux échangent leur place.

Il peut aussi cibler des cases occupées. L'équipe donne deux exemples :

- éloigner un personnage puis le ramener à sa place dans la même manche ;
- détruire votre personnage avec Trash for Treasure et déplacer aussitôt un autre personnage sur sa case.

Sur OriginsMeta, Twister Toss est dans trois decks publiés, dont le [Dorothy Combo](/fr/guides/dorothy-combo-guide) : Dorothy grandit chaque fois qu'un allié se déplace. Les notes de patch ne donnent pas le nouveau texte de la carte : sa page affiche l'ancien, avec un avertissement, jusqu'à ce que nous lisions le nouveau dans le jeu.

## Trois cartes coûtent 1 de plus {#couts}

Parmi les 35 decks publiés sur OriginsMeta (décompte à 00:13 CEST le 30 septembre), Mind Palace est dans 22 et Spellbook dans 17 : ce sont les deux cartes les plus jouées du site. Bagheera est dans 13. Le classement complet est dans [les cartes les plus jouées](/fr/tier-list/most-played).

### Bagheera : 2 mana {#bagheera}

Bagheera reste un 1/1 dont la capacité À la révélation lui donne +2⚔️/+2❤️ sur une case centrale. À 1 mana, c'était un 3/3 dès la première manche ; désormais, il arrive au plus tôt à la deuxième manche.

### Mind Palace : 3 mana {#mind-palace}

Le sort qui pioche 2 cartes coûte désormais 3.

### Spellbook : 4 mana {#spellbook}

Pour le reste de la partie, Spellbook ajoute à votre main un sort aléatoire au début de chaque manche, à jouer avant le combat, sinon il est défaussé. La carte coûte désormais 4, et ses sorts aléatoires ne peuvent plus être Spellbook.

## Capacités modifiées et correctifs {#correctifs}

### Humpty et Spellbook ne se donnent plus eux-mêmes {#humpty-spellbook}

Ils ne peuvent plus se donner eux-mêmes comme carte aléatoire. La capacité À la mort de Humpty ajoute une carte aléatoire à votre main : ce ne peut plus être Humpty. Le sort aléatoire que Spellbook ajoute à chaque manche ne peut plus être Spellbook.

### Main pleine : la carte renvoyée brûle {#main-pleine}

Quand une carte est renvoyée dans une main déjà pleine, elle brûle désormais (elle est perdue) au lieu que la capacité échoue. Parmi les cartes de la Demo 2.0, cela concerne celles qui renvoient une carte en main : White Queen et Stroke of Midnight, qui renvoient N'IMPORTE QUEL personnage dans la main de son propriétaire, et Koschei et Dracula, qui se renvoient eux-mêmes.

### Freeze! et Dorothy : mots-clés expliqués {#mots-cles}

Au survol, ils expliquent désormais les mots-clés qu'ils utilisent, et ils apparaissent dans la recherche par mot-clé de la collection.

## Correctifs de bugs {#bugs}

### Heroic Charge {#heroic-charge}

Heroic Charge donne aux alliés +2⚔️ et Piétinement pour cette manche. Si un personnage qu'il a renforcé perd ses capacités, le +2⚔️ reste désormais ; Piétinement est toujours retiré.

### Plusieurs Défenseurs {#defenseurs}

Quand vous avez plusieurs Défenseurs dans un lieu et que l'un d'eux est étourdi, c'est désormais toujours l'autre qui défend à sa place.

## Les lieux ont désormais une rareté {#lieux}

Chaque lieu est désormais commun, rare, très rare ou ultra rare, et la rareté décide de sa fréquence d'apparition. L'équipe le dit ainsi : attendez-vous aux lieux familiers dans la plupart des parties, et à quelques-uns que vous ne verrez que « tous les trente-six du mois ». Les notes de patch ne disent pas quel lieu a quelle rareté : la page des [Lieux](/fr/locations) liste tous les lieux de la Demo 2.0 avec leurs effets, et nous ajouterons la rareté dès que nous la connaîtrons.

## 13 langues dans le jeu {#langues}

Le jeu prend désormais en charge 13 langues : anglais, français, italien, allemand, espagnol (Espagne), japonais, coréen, polonais, portugais (Brésil), portugais (Portugal), russe, chinois simplifié et espagnol (Amérique latine). Le 30 septembre, la page Steam liste les mêmes 13 pour l'interface, avec l'audio complet en anglais seulement.

## Boogeyman {#boogeyman}

Le résumé en tête des notes de patch dit que « Twister Toss, Heroic Charge et Boogeyman se comportent désormais différemment », mais aucune ligne des notes ne dit ce qui change pour Boogeyman. Sa capacité À la révélation détruit l'allié de son lieu qui a la Puissance la plus basse, y compris lui-même. Nous mettrons cet article à jour quand l'équipe l'expliquera.

## Ce que nous ne savons pas encore {#inconnues}

- Quel lieu a quelle rareté.
- Le nouveau texte de Twister Toss, et si un échange compte pour un ou deux déplacements pour Dorothy.
- Ce qui change pour Boogeyman.

## Ce qui change sur OriginsMeta {#sur-le-site}

- Les pages de Bagheera, Mind Palace et Spellbook affichent le nouveau coût, et chaque carte du patch a le changement dans son historique d'équilibrage, avec un lien vers le post Steam.
- La page de Twister Toss affiche encore l'ancien texte, avec un avertissement, jusqu'à ce que nous lisions le nouveau dans le jeu.
- [MetaShifting](/fr/metashifting) place le patch 0.7 en tête, et le [deck builder](/fr/deck-builder) utilise les nouveaux coûts : Bagheera compte désormais comme une carte à 2 dans la courbe de mana.
- Les decks publiés gardent leur liste, avec leur date de création et le patch en vigueur ce jour-là ; leur courbe de mana utilise les nouveaux coûts. Les guides des decks qui contiennent ces cartes sont mis à jour.

## D'où viennent ces notes {#sources}

- Le post officiel Steam du 29 septembre, « A small demo update is about to land! », publié avant l'arrêt des serveurs pour le patch.
- Le numéro 0.7 et le nom Steam Demo Update #2 viennent de l'image officielle de la mise à jour, la couverture de cet article. Certains créateurs de contenu avaient appelé « patch 0.7 » la mise à jour du 21 septembre : sur ce site, celle-ci reste « Démo · 21 sept. ».`,
    faq: [
      {
        q: "Qu'est-ce qui change avec le patch 0.7 d'Origins TCG ?",
        a: "Twister Toss reçoit un rework ; Bagheera (de 1 à 2 mana), Mind Palace (de 2 à 3) et Spellbook (de 3 à 4) coûtent 1 de plus ; les lieux ont désormais une rareté qui décide de leur fréquence d'apparition ; Humpty et Spellbook ne peuvent plus se donner eux-mêmes ; une carte renvoyée dans une main pleine brûle désormais ; Heroic Charge et les Défenseurs multiples sont corrigés ; le jeu prend en charge 13 langues.",
      },
      {
        q: "Le patch 0.7 est-il le dernier patch d'équilibrage avant la Crimson Cup ?",
        a: "Oui : l'équipe l'appelle le dernier patch d'équilibrage avant le tournoi. Il est sorti le 29 septembre 2026 ; la Crimson Cup commence le 20 octobre avec la qualification EMEA, pendant le Steam Next Fest.",
      },
      {
        q: "Comment fonctionne Twister Toss après le patch 0.7 ?",
        a: "Le sort coûte toujours 1 mana. Il déplace un allié vers n'importe quelle case et, si une autre carte s'y trouve déjà, les deux échangent leur place. Il peut aussi cibler des cases occupées : vous pouvez éloigner un personnage et le ramener dans la même manche, ou en détruire un avec Trash for Treasure et déplacer un autre sur sa case.",
      },
    ],
  },
  "upgrade-meta-0929": {
    title: "Upgrade Meta : outils pour les créateurs, abonnements et notifications, guides de la communauté et BD",
    metaTitle: "Upgrade Meta : les outils pour les créateurs",
    description:
      "Nouveau sur OriginsMeta : profils et annuaire des créateurs, !deck et overlay OBS en stream, abonnements, guides de la communauté et BD. Devenez Creator.",
    summary:
      "Cette semaine, OriginsMeta a ouvert toute une section pour ceux qui créent du contenu sur Origins TCG : profils vitrine, annuaire des créateurs, outils pour le stream, statistiques des decks, guides de la communauté et BD publiées directement sur le site. Vous pouvez désormais suivre vos joueurs préférés et recevoir une notification quand ils publient ou passent en direct. Vous voulez devenir Creator ? Écrivez à Pierluigi sur notre Discord.",
    highlights: [
      { label: "Profils des créateurs", text: "une page vitrine, le lien court originsmeta.com/@nom et l'annuaire des créateurs", anchor: "profils" },
      { label: "Outils pour le stream", text: "la commande !deck dans le chat, un overlay OBS, l'image du deck et le badge LIVE", anchor: "stream" },
      { label: "Publiez plus", text: "vidéos et liens sur les decks, statistiques, artwork de la Légendaire, guides, BD et tournois", anchor: "publier" },
      { label: "Devenez Creator", text: "écrivez à Pierluigi sur notre Discord", anchor: "devenir-creator" },
      { label: "Abonnements et notifications", text: "decks, guides, BD et streams des profils que vous suivez", anchor: "suivre" },
      { label: "Rôles et succès", text: "Staff, Creator, Auteur, Pro et Communauté, des succès sur chaque profil, des messages au staff", anchor: "roles" },
      { label: "Decks, tier lists et guides", text: "les meilleurs decks du moment, les tier lists signées, trois nouveaux guides et la date du Kickstarter", anchor: "decks-guides" },
    ],
    body: `## Profils des créateurs {#profils}

Si vous créez du contenu sur Origins TCG (streams, vidéos, guides, decks), OriginsMeta a désormais une place pour vous. Les profils avec le rôle Creator, Auteur, Pro ou Staff ont une **page vitrine** : une couverture (l'un des 8 fonds ou votre propre image), une photo plus grande, une couleur d'accent, une phrase courte, votre Légendaire préférée, un deck et une vidéo à la une, vos horaires de stream (affichés dans le fuseau horaire de chaque visiteur), plus votre bio, vos chaînes et les langues dans lesquelles vous créez. Tout le monde peut ajouter une photo de profil.

Chaque profil a aussi un **lien court** à partager : originsmeta.com/@votrenom. Et la page [Créateurs et auteurs](/fr/creators) rassemble tous ceux qui ont l'un de ces rôles et ont rempli une bio ou ajouté une chaîne, avec des filtres par rôle, langue et plateforme.

## Outils pour le stream {#stream}

- **La commande \`!deck\` dans le chat** : ajoutez-la à Nightbot, StreamElements ou Fossabot et votre chat reçoit votre dernier deck publié, avec sa Légendaire, le lien et le code du jeu.
- **Un overlay OBS** qui affiche votre deck en stream, en vertical ou en horizontal, et se met à jour tout seul quand vous en publiez un nouveau.
- **L'image du deck**, prête pour les réseaux sociaux, les miniatures 16:9 et les stories 9:16.
- **Le badge LIVE** : quand vous streamez Origins TCG sur Twitch, il apparaît à côté de votre nom sur les decks, les profils et dans l'annuaire. La page [Live](/fr/live) montre qui est en direct en ce moment, et le bandeau du calendrier en haut indique « En direct ».

Vous trouverez tout cela sous « Pour les streamers » sur la page de chacun de vos decks.

## Publiez plus {#publier}

- **Vidéos et liens sur les decks** : jusqu'à 3 vidéos YouTube ou Twitch et 5 liens sur chaque deck, avec un lecteur qui ne se charge qu'au clic.
- **Statistiques des decks** : dans votre compte, vous voyez les visites, les copies du code du jeu, les clics sur les liens et les lectures de vidéos de chacun de vos decks, sur 7 jours, 30 jours et au total. Vous et le staff êtes les seuls à les voir.
- **Artwork de la Légendaire** : les Creators peuvent mettre leur propre artwork de la Légendaire sur leurs decks. La carte officielle reste sur la page de la carte.
- **Guides de la communauté** : Auteurs, Creators, joueurs Pro et Staff publient leurs guides directement sur le site, traduits automatiquement dans les deux autres langues. Tous les autres peuvent toujours [nous envoyer un guide](/fr/guides/submit).
- **BD** : les Creators publient leurs BD parmi les actus, avec le texte traduit automatiquement.
- **Tournois** : Creators, joueurs Pro et Staff peuvent inscrire leurs tournois publics au calendrier, avec leur propre couverture.

## Devenez Creator {#devenir-creator}

Le rôle Creator est attribué par le staff d'OriginsMeta. Si vous créez du contenu sur Origins TCG et voulez devenir Creator, **écrivez à Pierluigi sur [notre Discord](https://discord.gg/RAG7nnrNGP)**.

## Abonnements et notifications {#suivre}

Avec un compte, vous pouvez **suivre** les profils qui ont le rôle Creator, Auteur, Pro ou Staff. Quand ils publient un deck, un guide ou une BD, ou passent en direct sur Twitch, vous recevez une notification dans l'enveloppe en haut du site. Vous retrouvez les profils que vous suivez dans [votre compte](/fr/account). Les notifications restent sur le site : pas d'e-mails.

## Rôles et succès {#roles}

- **Cinq rôles**, avec leur tag à côté du nom : Staff, Creator, Auteur, Pro et Communauté.
- **Des succès** sur chaque profil, comme Premier deck, Favori du public, Deck du mois et Tournoi gagné.
- **Messages au staff** : depuis votre compte, vous pouvez nous écrire et lire nos réponses, y compris à vos retours.

## Decks, tier lists et guides {#decks-guides}

- Dans [Decks](/fr/decks), les meilleurs decks d'Origins TCG du moment, classés par les votes de la communauté.
- Dans la [tier list de la communauté](/fr/tier-list/community), les tier lists signées par le Staff, les Creators, les Auteurs et les joueurs Pro.
- Les tier lists, les cartes, les decks et le Deck builder commencent désormais par le contenu, avec des titres plus compacts.
- Trois nouveaux guides : [les 11 Légendaires](/fr/guides/origins-tcg-legendaries), [le mode classé](/fr/guides/origins-tcg-ranked) et [le Conquest](/fr/guides/origins-tcg-conquest).
- Le [guide du Kickstarter](/fr/guides/origins-tcg-kickstarter) a la date confirmée par le PDG de Koin Games : le 27 octobre.

## Participez {#participer}

[Inscrivez-vous](/fr/login) gratuitement avec Discord ou votre e-mail, publiez vos decks et suivez les joueurs que vous aimez. Et [rejoignez notre Discord](https://discord.gg/RAG7nnrNGP) : tout ce qui sort sur le site y est publié aussi.`,
    faq: [
      {
        q: "Comment devenir Creator sur OriginsMeta ?",
        a: "Le rôle Creator est attribué par le staff : si vous créez du contenu sur Origins TCG, écrivez à Pierluigi sur le Discord d'OriginsMeta (discord.gg/RAG7nnrNGP).",
      },
      {
        q: "Comment afficher mon deck en stream ?",
        a: "Ouvrez la page de votre deck et allez dans « Pour les streamers » : vous y trouverez la commande !deck pour Nightbot, StreamElements ou Fossabot, l'overlay OBS et l'image du deck.",
      },
      {
        q: "Qui puis-je suivre sur OriginsMeta ?",
        a: "Avec un compte, vous pouvez suivre les profils qui ont le rôle Creator, Auteur, Pro ou Staff et recevoir une notification sur le site quand ils publient un deck, un guide ou une BD, ou passent en direct sur Twitch.",
      },
    ],
  },
  "upgrade-meta-0925": {
    title: "Upgrade Meta : OriginsMeta parle espagnol, toutes les cartes en trois langues et ce qui arrive",
    metaTitle: "Upgrade Meta : OriginsMeta pour Origins TCG, en espagnol",
    description:
      "OriginsMeta est aussi en espagnol, et chaque carte de la Demo 2.0 a le texte officiel du jeu en trois langues. Plus un aperçu de ce que nous préparons.",
    summary:
      "OriginsMeta parle désormais aussi espagnol, et chaque carte de la Demo 2.0 affiche le texte officiel du jeu en anglais, en italien et en espagnol. Nous travaillons aussi sur un overlay, un outil de jeu pour tous les joueurs, et sur des façons de récompenser ce que vous créez : la première idée est un deck de la semaine choisi par vos votes. Merci de votre soutien : à la fin de l'article, vous trouverez tout ce qu'il faut pour participer.",
    highlights: [
      { label: "L'espagnol est arrivé", text: "tout le site, guides et actus compris, et les guides des decks de la communauté traduits automatiquement", anchor: "espagnol" },
      { label: "Chaque carte en trois langues", text: "les textes officiels du jeu en italien et en espagnol, vérifiés sur les 122 cartes de la Demo 2.0", anchor: "cartes" },
      { label: "Un overlay pour tous", text: "un outil de jeu pour tous les joueurs, en préparation : nous le montrerons quand il sera prêt", anchor: "overlay" },
      { label: "Le deck de la semaine", text: "choisi par vos votes : notre première idée pour récompenser ce que vous créez", anchor: "deck-de-la-semaine" },
      { label: "Merci", text: "à tous ceux qui se sont inscrits, ont publié des decks, voté et nous ont écrit", anchor: "merci" },
      { label: "Participez", text: "inscrivez-vous, construisez un deck, créez votre tier list, rejoignez notre Discord", anchor: "participer" },
    ],
    body: `## L'espagnol est arrivé {#espagnol}

Depuis le 25 septembre 2026, OriginsMeta est aussi en espagnol : cartes, decks, guides, actus, tier lists, Deck builder et tournois. Changez de langue avec EN · IT · ES en haut de chaque page (sur téléphone, dans le Menu). Nous écrivons en espagnol neutre, pour les joueurs d'Espagne et d'Amérique latine, et les noms des cartes restent en anglais, comme dans le jeu.

Les decks de la communauté parlent aussi toutes les langues : l'auteur écrit son guide dans sa langue, le site le traduit dans les deux autres, le signale sur la page et renvoie vers l'original. Un deck publié en italien se lit désormais aussi en anglais et en espagnol.

## Chaque carte en trois langues {#cartes}

Le 25 septembre, nous avons ouvert la démo en espagnol et en italien et lu une par une les 122 cartes de la collection. Les textes italiens et espagnols que vous trouvez maintenant dans la [liste des cartes](/fr/cards) sont les textes officiels du jeu : 101 textes espagnols et 88 textes italiens étaient différents de nos traductions, et ils ont été remplacés.

Les mots-clés utilisent aussi les termes officiels du jeu : On Reveal se dit « Alla rivelazione » en italien et « Al revelar » en espagnol. Sur les pages italiennes et espagnoles, vous retrouverez les mêmes termes dans les étiquettes de mots-clés de chaque page de carte, dans les guides et dans les actus. Les cartes créées et les cartes retirées n'apparaissent pas dans la collection du jeu, et nous n'avons pas encore vérifié les [Lieux](/fr/locations) dans le jeu : leur texte italien et espagnol est le nôtre, écrit avec le glossaire du jeu.

## Un overlay pour tous {#overlay}

Nous travaillons sur un overlay : un outil de jeu pour tous les joueurs d'Origins TCG, pas seulement pour ceux qui streament. Nous préférons le montrer plutôt que le décrire : nous vous en dirons plus dès que nous aurons quelque chose qui vaut le coup d'œil.

## Le deck de la semaine {#deck-de-la-semaine}

Nous voulons récompenser ceux qui créent, et donner plus de visibilité à vos decks, vos guides et vos tier lists. La première idée est un deck de la semaine, choisi d'après vos notes en étoiles. En attendant, si vous essayez un deck de la communauté, notez-le : les decks les mieux notés apparaissent déjà dans la [tier list](/fr/tier-list).

## Merci {#merci}

OriginsMeta est en ligne depuis le 15 septembre. En dix jours, vous vous êtes inscrits, vous avez publié des decks, voté et nous avez écrit avec des idées et des corrections, et plusieurs changements récents sont nés de vos messages. Merci : ce site grandit avec vous.

## Participez {#participer}

- [Inscrivez-vous](/fr/login) : gratuit, avec Discord ou votre e-mail, sans mot de passe. Avec un compte, vous pouvez publier vos decks, voter et enregistrer vos tier lists.
- [Construisez un deck](/fr/deck-builder) : gratuit, même sans compte. Copiez le code du jeu ou, avec un compte, publiez le deck sur le site avec votre guide.
- [Créez votre tier list](/fr/tier-list/create) et consultez la [tier list de la communauté](/fr/tier-list/community), qui devient un vrai classement à partir de 5 listes enregistrées.
- [Rejoignez notre Discord](https://discord.gg/RAG7nnrNGP) : les nouveaux articles et guides y arrivent dès leur publication. Le [Discord officiel d'Origins TCG](https://discord.gg/originstcg) est le serveur de Koin Games, pour les annonces et les inscriptions aux tournois.`,
    faq: [
      {
        q: "OriginsMeta est-il disponible en espagnol ?",
        a: "Oui, depuis le 25 septembre 2026 : tout le site, avec les guides, les actus, les tier lists et le Deck builder. Changez de langue avec EN · IT · ES en haut de la page ; les guides des decks de la communauté sont traduits automatiquement.",
      },
      {
        q: "Les textes italiens et espagnols des cartes sont-ils officiels ?",
        a: "Oui, pour les 122 cartes de la Demo 2.0 : nous les avons lus dans le jeu le 25 septembre 2026. Les cartes créées et retirées ne sont pas dans la collection du jeu et les Lieux n'ont pas encore été vérifiés dans le jeu : leur texte italien et espagnol est notre traduction, avec le glossaire du jeu.",
      },
      {
        q: "Comment publier un deck sur OriginsMeta ?",
        a: "Construisez-le dans le Deck builder, connectez-vous avec Discord ou votre e-mail et appuyez sur Publier sur le site : un court plan de jeu est obligatoire, le reste du guide est facultatif.",
      },
    ],
  },
  "crimson-cup-format-check-in": {
    title: "Règles de la Crimson Cup : Conquest à trois decks, listes cachées jusqu'au top 4 et check-in obligatoire",
    metaTitle: "Crimson Cup d'Origins TCG : règles, dates, prix, check-in",
    description:
      "Crimson Cup d'Origins TCG : Conquest à trois decks, 8 cartes uniques entre les decks, qualifications du 19 au 22 octobre, 10 000 dollars de prix et check-in.",
    summary:
      "Après le sondage auprès des joueurs, Koin Games a fixé les règles de la Crimson Cup : Conquest à trois decks, au moins 8 cartes uniques entre chaque paire de decks, listes cachées jusqu'au top 4 et aucun ban dans les matchs au meilleur des cinq manches. Le check-in ouvre deux heures avant chaque qualification et ferme cinq minutes avant le début, en même temps que la remise des decks : si vous le ratez, vous ne jouez pas. Le tournoi se joue sur la démo, pas sur le playtest.",
    highlights: [
      { label: "Conquest à trois decks", text: "au moins 8 cartes uniques entre chaque paire de decks", anchor: "format" },
      { label: "Listes cachées jusqu'au top 4", text: "au moment du ban, vous ne voyez que la Légendaire", anchor: "listes" },
      { label: "Au meilleur des cinq manches sans ban", text: "il faut gagner avec les trois decks", anchor: "meilleur-des-cinq" },
      { label: "Check-in", text: "ouvre deux heures avant, ferme cinq minutes avant le début avec la remise des decks", anchor: "check-in" },
      { label: "Entraînez-vous sur la démo", text: "le playtest recevra des mises à jour que le tournoi n'aura pas", anchor: "demo-playtest" },
      { label: "Dernier patch d'équilibrage", text: "sorti le 29 septembre : le patch 0.7", anchor: "equilibrage" },
      { label: "Prix", text: "10 000 dollars ; la répartition complète est arrivée le 5 octobre", anchor: "prix" },
    ],
    body: `## Conquest à trois decks {#format}

Il y a quelques jours, Koin Games a mené un sondage auprès des joueurs, et cette annonce tranche la question du format : la Crimson Cup se joue en Conquest avec trois decks. Entre chaque paire de decks, il doit y avoir au moins 8 cartes uniques.

Chaque deck compte 13 cartes différentes : la Légendaire et douze cartes de base, dont le jeu ajoute lui-même la seconde copie. Notre lecture est que deux decks peuvent avoir au plus 5 cartes en commun, mais l'annonce ne précise pas comment les cartes uniques sont comptées. Lors du Big Bob's Playtest Battle, en août, la règle était d'au moins neuf cartes de différence.

## Listes cachées jusqu'au top 4 {#listes}

Les decks restent privés jusqu'au top 4. Quand vous bannissez l'un des decks de votre adversaire, vous ne voyez que sa Légendaire.

## Au meilleur des cinq manches : pas de ban, gagner avec les trois {#meilleur-des-cinq}

Les matchs au meilleur des cinq manches (BO5) se jouent sans ban : pour remporter le match, il faut gagner avec les trois decks. Dans la première annonce, le 9 septembre, le BO5 était réservé à la grande finale, avec des matchs au meilleur des trois manches (BO3) avant.

## Check-in : soyez à l'heure {#check-in}

Le programme prévu pour chaque qualification :

1. Le check-in ouvre deux heures avant le début du tournoi.
2. Le check-in et la remise des decks ferment cinq minutes avant le début officiel.
3. Une courte fenêtre permet aux joueurs en liste d'attente de prendre les places libres, premier arrivé, premier servi.
4. La présentation du tournoi.
5. Les matchs commencent dès la fin de la présentation.

Si vous ne faites pas le check-in, vous ne pouvez pas jouer. Pour la qualification EMEA du 20 octobre, qui commence à 19:00 CEST, cela veut dire faire le check-in entre 17:00 et 18:55 CEST. La qualification AMER a lieu le 21 et l'APAC le 22 : horaires et places sont dans notre [guide du Steam Next Fest](/fr/guides/steam-next-fest-2026).

**Mise à jour du 7 octobre :** il y a désormais cinq qualifications. Le 5 octobre, Koin a ajouté AMER le 19 octobre à 19:00 EST et EMEA le 22 octobre à 19:00 CEST, et son nouveau calendrier place la qualification AMER du 21 à 21:00 EST, avec 32 qualifiés au lieu de 64 et 96 wild cards au lieu de 128. Sept lieux sont aussi hors du pool du tournoi. Tout est dans [notre article sur la cagnotte et les nouvelles qualifications](/fr/news/crimson-cup-prizepool-qualifiers).

## Démo ou playtest : où s'entraîner {#demo-playtest}

- La **démo** a la liste des cartes du tournoi. Le mode classé s'y active pour le Steam Next Fest, avec de nouvelles récompenses de classé. C'est la version sur laquelle s'entraîner.
- Le **playtest** est aujourd'hui identique à la démo, avec le mode classé déjà actif et quelques changements mineurs. Il recevra d'autres mises à jour et sera différent de la version du tournoi.

Vous pouvez jouer aux deux, mais le tournoi se tient sur la démo principale et uniquement avec les cartes qui y sont disponibles.

## Le dernier patch d'équilibrage {#equilibrage}

Le dernier patch d'équilibrage arrivera deux semaines avant le Steam Next Fest, qui commence le 19 octobre. Nous le suivrons carte par carte dans [MetaShifting](/fr/metashifting).

**Mise à jour du 30 septembre :** le dernier patch d'équilibrage est sorti plus tôt qu'annoncé, le 29 septembre. C'est le [patch 0.7](/fr/news/patch-0-7), que l'équipe appelle le dernier patch d'équilibrage avant le tournoi : Twister Toss reçoit un rework, et Bagheera, Mind Palace et Spellbook coûtent 1 de plus.

## Les prix {#prix}

Le post officiel sur X parle d'une cagnotte de 10 000 dollars, et l'annonce sur Discord dit que la cagnotte exacte sera communiquée la semaine prochaine. En septembre, Koin décrivait des prix d'une valeur totale de 10 000 dollars, entre une carte promo 1/1 exclusive, d'autres cartes promo, des boosters numériques, des boîtes et des cases Alpha, et de l'argent ([notre article](/fr/news/biggest-tournament-ever)).

**Mise à jour du 7 octobre :** la répartition est arrivée le 5 octobre. Le vainqueur reçoit une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars en espèces ; les cartes promo vont jusqu'au top 32 et les boosters jusqu'au top 256. Le tableau complet est dans [notre article sur la cagnotte](/fr/news/crimson-cup-prizepool-qualifiers#prix).

## Ce que nous ne savons pas encore {#inconnues}

- La cagnotte exacte, attendue la semaine prochaine : elle est arrivée le 5 octobre, voir la mise à jour ci-dessus.
- Comment sont comptées les cartes uniques entre deux decks.

## D'où vient l'information {#sources}

- Le « Big Crimson Cup announcement » publié sur le Discord officiel d'Origins TCG le 24 septembre, qui renvoie aussi vers une nouvelle vidéo détaillant le tournoi.
- Le [post d'Origins TCG sur X](https://x.com/origins_tcg/status/2103111100321677670) du même jour, avec la cagnotte de 10 000 dollars.`,
    faq: [
      {
        q: "Combien de cartes uniques faut-il entre les decks de la Crimson Cup ?",
        a: "Au moins 8 cartes uniques entre chaque paire de decks, dit l'annonce du 24 septembre. Chaque deck compte 13 cartes différentes : notre lecture est que deux decks peuvent en partager au plus 5.",
      },
      {
        q: "Quand a lieu le check-in de la Crimson Cup ?",
        a: "Il ouvre deux heures avant chaque qualification et ferme cinq minutes avant le début, en même temps que la remise des decks. Si vous le ratez, vous ne pouvez pas jouer : pour la qualification EMEA de 19:00 CEST, faites le check-in entre 17:00 et 18:55 CEST.",
      },
      {
        q: "Sur quelle version se joue la Crimson Cup ?",
        a: "Sur la démo principale, uniquement avec les cartes qui y sont disponibles. Le playtest recevra d'autres mises à jour et sera différent de la version du tournoi.",
      },
    ],
  },
  "upgrade-meta-0924": {
    title: "Upgrade Meta : recherche dans le texte des cartes, tier list refaite, Lieux et notre propre Discord",
    metaTitle: "Upgrade Meta : nouveautés d'OriginsMeta pour Origins TCG",
    description:
      "En trois jours sur OriginsMeta : recherche dans le texte des cartes, tier list refaite, Lieux, profils publics et notre Discord. Merci, coachcronos.",
    summary:
      "OriginsMeta a beaucoup changé en trois jours : le Deck builder cherche désormais dans le texte des cartes, la tier list affiche trois sources côte à côte, et les Lieux, les profils publics et notre propre serveur Discord sont arrivés. Merci à coachcronos pour le stream et à tous ceux qui nous ont écrit : beaucoup de ces changements sont nés de vos demandes.",
    highlights: [
      { label: "Cherchez dans le texte des cartes", text: "dans le Deck builder et la base de cartes : tapez Reveal et il ne reste que les cartes avec une capacité À la révélation", anchor: "recherche" },
      { label: "Une tier list refaite", text: "OriginsMeta, Communauté et Les plus jouées côte à côte, MetaShifting sur sa propre page", anchor: "tier-list" },
      { label: "Les Lieux", text: "les 44 lieux de la Demo 2.0, avec recherche et filtres", anchor: "lieux" },
      { label: "Decks, guides et profils", text: "filtre par type d'auteur, date et patch sur chaque deck, profils publics, quatre nouveaux guides", anchor: "decks" },
      { label: "Cartes vérifiées dans le jeu", text: "les 122 cartes comparées une par une, plus le patch du 21 septembre", anchor: "cartes" },
      { label: "Un site plus lisible", text: "nouveau logo, cartes qui se retournent, calendrier qui défile", anchor: "apparence" },
      { label: "Notre propre Discord", text: "logo dans le menu, nouveaux articles et guides publiés automatiquement", anchor: "discord" },
      { label: "Merci, coachcronos", text: "pour le stream du 23 septembre", anchor: "merci-coachcronos" },
      { label: "Merci de nous écrire", text: "et dès aujourd'hui vous pouvez laisser votre nom dans le formulaire de feedback", anchor: "merci-feedback" },
    ],
    body: `## Cherchez dans le texte des cartes {#recherche}

Le premier message arrivé par le formulaire de feedback demandait quelque chose de précis : en construisant un deck autour de Mulan, la personne qui nous a écrit voulait ne voir que les cartes avec une capacité À la révélation (On Reveal) en tapant « Reveal » dans la recherche, comme on peut le faire dans le jeu. C'est désormais possible.

- La recherche du [Deck builder](/fr/deck-builder) regarde le nom, la saga et le **texte de la carte**. Tapez « Reveal » et il ne reste que les cartes avec une capacité À la révélation : il y en a 33 dans la démo actuelle.
- Les majuscules et les accents ne comptent pas, et avec plusieurs mots vous obtenez les cartes qui les contiennent tous, par exemple « reveal damage ».
- Sous les filtres, vous voyez combien de cartes restent, avec « Effacer les filtres » ; quand rien ne correspond, le Deck builder le dit au lieu d'afficher une liste vide.
- La même recherche fonctionne dans la [base de cartes](/fr/cards) et dans le champ « Rechercher une carte » en haut de chaque page. Sur le site italien, elle lit aussi le texte anglais du jeu, donc « draw » y fonctionne aussi.

## Une tier list refaite {#tier-list}

La [tier list](/fr/tier-list) affiche désormais trois sources côte à côte, chacune avec sa propre page :

- **OriginsMeta** : les tiers viennent uniquement des résultats des tournois, ils arriveront donc après la Crimson Cup ; en attendant, la page montre les decks les mieux notés et les cartes présentes dans le plus de decks.
- **[Communauté](/fr/tier-list/community)** : la moyenne des tier lists enregistrées par les membres, qui devient un classement à partir de 5 listes.
- **[Les plus jouées](/fr/tier-list/most-played)** : dans combien de decks publiés apparaît chaque carte. C'est de la popularité, pas du win rate.

Le suivi des équilibrages a sa propre page, [MetaShifting](/fr/metashifting), avec le patch le plus récent en premier. Dans l'outil [Créez votre tier list](/fr/tier-list/create), les cartes se déplacent vraiment par glisser-déposer ; sur téléphone, il y a la barre S A B C D, et avec un compte vous pouvez enregistrer votre liste, qui compte ensuite dans la tier list de la communauté.

## Les Lieux {#lieux}

Une nouvelle page [Lieux](/fr/locations) : les 44 lieux de la Demo 2.0, avec recherche par nom et par effet, des filtres par famille d'effets (dégâts, mana, déplacement et autres) et les cartes qu'ils mentionnent reliées à leur page. Pour voir comment ils changent une partie, lisez le [guide des Lieux](/fr/guides/origins-tcg-locations).

## Decks, guides et profils {#decks}

- Dans [Decks](/fr/decks), les filtres sont toujours visibles, avec un nouveau filtre par **type d'auteur** : Staff, Pro, Influencer, Communauté. Les decks sont triés du plus récent au plus ancien, et chacun affiche sa date de création et la version du jeu sur laquelle il a été construit.
- Chaque membre a une **page publique** avec ses decks publiés et ses tier lists enregistrées.
- Le Deck builder a quatre boutons : Publier sur le site, Enregistrer en privé (le deck reste dans votre profil et vous seul le voyez), Partager, Vider le deck. Le deck que vous construisez s'enregistre tout seul dans votre navigateur.
- Quatre nouveaux guides sur les decks publiés par Davdas : [On Reveal Mid Range](/fr/guides/on-reveal-midrange-guide) avec Mulan, [King of Value Trade](/fr/guides/king-of-value-trade-guide), [Dorothy Combo](/fr/guides/dorothy-combo-guide) et [The Trick-or-Treat Legion](/fr/guides/trick-or-treat-legion-guide).
- Vous avez écrit un guide ? [Envoyez-le-nous](/fr/guides/submit) : nous le lisons et, avec votre accord, nous le publions sous votre nom.

**Mise à jour du 27 septembre :** le filtre s'appelle désormais **Rôle**, et les rôles sont Staff, Creator, Auteur, Pro et Communauté : le tag Influencer n'existe plus. La personne qui a publié un deck se trouve sous **Publié par**.

## Cartes vérifiées dans le jeu {#cartes}

Le 22 septembre, nous avons comparé une par une les 122 cartes de la Demo 2.0 avec la collection du jeu : coûts, statistiques et alignements correspondaient tous, 16 textes non, et ils sont désormais ceux du jeu. La base contient aussi le [patch de la démo du 21 septembre](/fr/news/demo-patch-notes-0921) avec les 14 cartes qu'il modifie, et le haut du Deck builder indique à quelle version du jeu les cartes sont à jour. Aujourd'hui, nous avons aussi corrigé les mots-clés de Queen of Hearts et de Bagheera, qui étaient en retard sur leur texte.

## Un site plus lisible {#apparence}

Le logo est désormais un lettrage dessiné à la main. Sur les pages des decks, les cartes sont affichées entières et, à la souris, se retournent pour montrer leur texte ; l'aperçu des cartes ne garde que l'essentiel (nom, type, alignement et effet). Le calendrier sous le carrousel défile vraiment maintenant, lentement, et l'en-tête de la page d'accueil est plus court, pour que les actus tiennent sur le premier écran.

## Notre propre Discord {#discord}

OriginsMeta a son propre serveur Discord. Le logo Discord est dans le menu du haut (sur téléphone, dans « Menu ») et l'invitation est à la fin de chaque article. Les nouveaux articles et guides y sont publiés automatiquement dès leur mise en ligne sur le site. Le [Discord officiel d'Origins TCG](https://discord.gg/originstcg) reste le serveur de Koin Games, pour les annonces, les AMA et les inscriptions aux tournois.

## Merci, coachcronos {#merci-coachcronos}

Le 23 septembre, coachcronos nous a reçus en direct sur sa chaîne Twitch, avec Davdas et Pierluigi, pour parler du site et d'Origins TCG avec son chat. Merci du fond du cœur : pour la place qu'il nous a faite, pour l'enthousiasme qu'il met dans le jeu et pour nous avoir présentés à sa communauté. Plusieurs changements de cet article sont nés de ce stream : les filtres des decks toujours visibles, le filtre par type d'auteur et « Envoyez-nous votre guide ».

## Merci de nous écrire {#merci-feedback}

Le formulaire de feedback est ouvert depuis quelques jours et le staff lit chaque message. La recherche dans le texte des cartes est née ainsi, d'un message non signé : merci, qui que vous soyez. Dès aujourd'hui, le formulaire a aussi un champ pour votre nom ou pseudo, facultatif, pour que nous sachions qui remercier (nous ne le publions jamais sans vous le demander). Continuez à nous écrire : depuis le formulaire de feedback en bas à droite, avec [Envoyez-nous votre guide](/fr/guides/submit) ou sur notre Discord.`,
    faq: [
      {
        q: "Comment trouver les cartes avec une capacité À la révélation dans le Deck builder ?",
        a: "Tapez Reveal dans la recherche du Deck builder : il ne reste que les cartes avec une capacité À la révélation. La recherche regarde le nom, la saga et le texte de la carte, et fonctionne de la même façon dans la base de cartes.",
      },
      {
        q: "Comment rejoindre le Discord d'OriginsMeta ?",
        a: "Utilisez le logo Discord dans le menu du haut (sur téléphone, dans Menu) ou le bouton à la fin de chaque article. C'est le serveur d'OriginsMeta, distinct du Discord officiel d'Origins TCG géré par Koin Games.",
      },
      {
        q: "Comment suggérer un changement sur le site ?",
        a: "Utilisez le formulaire de feedback en bas à droite : une phrase suffit, le nom et l'e-mail sont facultatifs. Les guides passent par Envoyez-nous votre guide, dans la section Guides.",
      },
    ],
  },
  "demo-patch-notes-0921": {
    title: "Notes de patch de la démo du 21 septembre : Dorothy coûte 4, 14 cartes changent et The Gallows est corrigé",
    metaTitle: "Origins TCG : notes de patch de la démo du 21 septembre",
    description:
      "Le patch de la démo d'Origins TCG du 21 septembre : Dorothy à 4 mana, statistiques et textes de 14 cartes, deux règles du jeu et le lieu The Gallows.",
    summary:
      "Les changements d'équilibrage de la mise à jour de la démo du 21 septembre, comparés à la dernière version du playtest : Dorothy descend à 4 mana, huit cartes changent de statistiques, Itsy Bitsy Spider devient Evil, six cartes changent d'effet, et deux règles du jeu et The Gallows sont corrigés.",
    highlights: [
      { label: "Dorothy coûte 4", text: "un mana de moins pour la Légendaire qui grandit chaque fois qu'un allié se déplace", anchor: "dorothy" },
      { label: "Wicked Stepmother monte à 4 de Puissance", text: "la Légendaire avec Contact mortel passe de 3/6 à 4/6", anchor: "wicked-stepmother" },
      { label: "Christopher Robin revient à 5/4", text: "les statistiques qu'il avait avant le patch 0.6.3", anchor: "christopher-robin" },
      { label: "Cinq autres changements de statistiques", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet et Roo", anchor: "statistiques" },
      { label: "Itsy Bitsy Spider devient Evil", text: "auparavant Neutral, avec toutes les synergies des personnages Mauvais qui en découlent", anchor: "itsy-bitsy-spider" },
      { label: "Six cartes changent d'effet", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "effets" },
      { label: "Deux règles du jeu", text: "statistiques conservées au cimetière, Before combat avant les défausses Temporary", anchor: "regles" },
      { label: "The Gallows corrigé", text: "ne détruit plus dans le lieu où un personnage est déplacé", anchor: "the-gallows" },
    ],
    body: `## Tous les changements de statistiques {#statistiques}

Les chiffres sont comparés à la dernière version du playtest, la 0.6.3 : les mêmes statistiques que la base de cartes de ce site utilisait jusqu'à ce patch. Format : mana · Puissance/Santé ; ★ marque les Légendaires.

| Carte | Avant | Après | Ce qui change |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | coûte 1 de moins |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 Puissance |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | retour aux statistiques d'avant la 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 Puissance, +1 Santé |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 Puissance, −1 Santé |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 Puissance |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 Puissance, et une nouvelle règle sur ses buffs |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 Santé |
| Itsy Bitsy Spider | 0 · 1/1, Neutral | 0 · 1/1, Evil | change d'alignement |

## Les deux Légendaires {#legendaires}

### Dorothy coûte 4 {#dorothy}

Dorothy peut se Déplacer à chaque manche et a +1/+1 pour chaque fois qu'un allié s'est déplacé dans la partie. À 4 mana, elle arrive une manche plus tôt, avec une manche de plus pour grandir. Dans le même patch, Roo, un personnage à 2 mana avec Déplacer, gagne 1 de Santé.

### Wicked Stepmother monte à 4 de Puissance {#wicked-stepmother}

La Légendaire avec Contact mortel, dont la capacité À la révélation donne Contact mortel à vos personnages Mauvais, passe de 3/6 à 4/6.

## Christopher Robin revient à 5/4 {#christopher-robin}

Le patch 0.6.3 l'avait fait passer de 5/4 à 4/5, plus solide mais frappant moins fort. Le patch de la démo remet les anciennes statistiques. Cette ligne figure dans les notes de patch publiées sur le Discord officiel, pas dans le post Steam.

## Itsy Bitsy Spider devient Evil {#itsy-bitsy-spider}

La 1/1 à 0 mana passe de Neutral à Evil. Cela importe pour toutes les cartes qui comptent les personnages Mauvais : la capacité À la révélation de Wicked Stepmother, par exemple, lui donne désormais aussi Contact mortel.

## Six cartes changent d'effet {#effets}

### Silver Bullet {#silver-bullet}

Elle peut désormais cibler les barrières aussi bien que les personnages.

### Don Quixote {#don-quixote}

Il a gagné Défenseur : c'est tout ce que les notes de patch disent de lui.

### Heroic Charge {#heroic-charge}

Le sort donne aux alliés +2 de Puissance et Piétinement cette manche. Quand il est répété, le buff de +2 de Puissance s'applique désormais de nouveau.

### Frog Prince et Magic Carpet {#frog-prince-magic-carpet}

Les deux ont une capacité À la révélation à choix (« Choose One »). Les buffs qu'ils avaient déjà ne sont plus effacés quand ils sont joués, et s'ils reviennent en main, ils peuvent choisir de nouveau. Magic Carpet gagne aussi 1 de Puissance.

### Wooden Stake {#wooden-stake}

La carte peut désormais cibler des personnages à pleine Santé, mais elle échoue toujours si la cible n'est pas blessée au moment où elle se révèle.

## Deux règles du jeu {#regles}

### Les statistiques restent au cimetière {#cimetiere}

Les statistiques d'un personnage ne sont plus réinitialisées au cimetière. Un personnage buffé avec Renaissance revient sur le plateau encore buffé, mais avec 1 de Santé.

### Before combat, puis les défausses Temporary {#before-combat}

Les capacités « Before combat » se déclenchent désormais avant que les cartes Temporary ne soient défaussées.

## The Gallows {#the-gallows}

Le lieu détruit toujours l'ennemi en face de la case où un personnage est entré. Si une capacité À la révélation déplace ce personnage vers un autre lieu, The Gallows ne détruit plus le personnage adverse dans le nouveau lieu.

## D'où viennent ces notes {#sources}

- Le post officiel sur Steam du 21 septembre, celui qui annonce la mise à jour, liste les changements de statistiques et les six cartes qui changent d'effet, « par rapport à la dernière version du playtest ». Le post de l'équipe sur Reddit dit la même chose.
- La version publiée sur le Discord officiel ajoute Christopher Robin, les deux règles du jeu et The Gallows. Nous la rapportons en entier.

Le patch n'a pas de numéro de version : l'équipe l'appelle les notes de patch de la démo du 21 septembre. Certains créateurs l'ont appelé « patch 0.7 », mais ce numéro n'apparaît pas dans les posts officiels sur cette mise à jour. Sur ce site, il apparaît comme « Démo · 21 sept. ».

**Mise à jour du 25 septembre :** nous avons ajouté la note sur le nom « patch 0.7 », que certains créateurs utilisent pour cette mise à jour.

**Mise à jour du 30 septembre :** le numéro 0.7 appartient officiellement à la mise à jour suivante, la Steam Demo Update #2 du 29 septembre, le dernier patch d'équilibrage avant la Crimson Cup : tous ses changements sont dans [les notes du patch 0.7](/fr/news/patch-0-7). Les statistiques de cet article sont celles d'avant ce patch.

## Ce qui change sur OriginsMeta {#sur-le-site}

- Chaque page de carte affiche les nouvelles statistiques et le changement dans son historique d'équilibrage, avec un lien vers le post Steam.
- [MetaShifting](/fr/metashifting) liste le patch à côté de ceux du playtest.
- Le [Deck builder](/fr/deck-builder) utilise les nouveaux coûts : Dorothy compte désormais comme une carte à 4 dans la courbe de mana.
- Le texte officiel des six cartes qui changent d'effet sera mis à jour quand la base de cartes de la communauté importera le patch. D'ici là, l'historique d'équilibrage de chaque page de carte explique le changement.

Tout le reste de la mise à jour, de la nouvelle interface au mode classé pendant le Steam Next Fest, est dans [l'article sur la première grande mise à jour de la démo](/fr/news/demo-first-big-update).`,
    faq: [
      {
        q: "Qu'est-ce qui change avec le patch de la démo d'Origins TCG du 21 septembre ?",
        a: "Dorothy coûte 4 au lieu de 5 ; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet et Roo changent de statistiques ; Itsy Bitsy Spider devient Evil ; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet et Wooden Stake changent d'effet ; deux règles du jeu et le lieu The Gallows sont corrigés.",
      },
      {
        q: "Est-ce le patch 0.7 d'Origins TCG ?",
        a: "Non. Certains créateurs l'ont appelé patch 0.7, mais cette mise à jour n'a pas de numéro de version : l'équipe l'appelle les notes de patch de la démo du 21 septembre 2026, avec les changements comparés à la dernière version du playtest, la 0.6.3. Le patch 0.7 est la mise à jour suivante, la Steam Demo Update #2 du 29 septembre 2026.",
      },
      {
        q: "Dois-je construire mes decks pour la Crimson Cup sur ces statistiques ?",
        a: "Sur celles du patch 0.7, arrivé après : le 29 septembre 2026, l'équipe l'a publié comme dernier patch d'équilibrage avant le tournoi, avec un rework de Twister Toss et un coût de 1 de plus pour Bagheera, Mind Palace et Spellbook. La liste provisoire des cartes de la Crimson Cup est arrivée avec la mise à jour du 21 septembre ; le tournoi se joue du 20 au 25 octobre 2026.",
      },
    ],
  },
  "demo-first-big-update": {
    title: "Première grande mise à jour de la démo d'Origins TCG : boosters de test, mode classé et Crimson Cup",
    metaTitle: "Origins TCG met à jour la démo : interface et classé",
    description: "Démo d'Origins TCG, 21 septembre : nouvelle interface, boosters de test, liste de la Crimson Cup, progression conservée et mode classé au Next Fest.",
    summary: "Le 21 septembre, Koin Games a mis à jour la démo gratuite d'Origins TCG : nouvelle interface et nouveau plateau, un tutoriel pour collectionneurs, des boosters de test et la liste provisoire des cartes de la Crimson Cup, sans que personne ne perde sa progression. Le mode classé s'active avec le Steam Next Fest.",
    body: `## Ce qui change dans la démo {#ce-qui-change}

L'équipe parle de « la première grande mise à jour de la démo d'Origins », et ce *première* laisse entendre que d'autres suivront avant le festival.

### Une nouvelle interface et un nouveau plateau {#nouvelle-interface}

Les écrans autour de la partie ont été revus et le plateau de jeu a un nouveau look.

### Un tutoriel pour collectionneurs {#tutoriel-collectionneurs}

Il explique les points clés de la collection, le côté qui distingue Origins des autres jeux de cartes numériques : des cartes que l'on ouvre, que l'on possède et que l'on échange. Notre [guide de l'économie de collection](/fr/guides/collector-economy) détaille le modèle étape par étape.

### Des boosters de test {#boosters-de-test}

Des boosters à ouvrir dans la démo, pour essayer le côté collection du jeu avant la sortie complète.

### De nouvelles répliques vocales {#repliques}

La mise à jour ajoute de nouvelles répliques vocales ; l'annonce n'en dit pas plus.

### Les changements d'équilibrage {#equilibrage}

Le détail est sorti le soir même, dans le post Steam et sur Discord : Dorothy passe à 4 mana, huit cartes changent de statistiques, Itsy Bitsy Spider devient Evil, six cartes changent d'effet, et deux règles du jeu et le lieu The Gallows sont corrigés. Tout est dans [l'article sur les notes de patch](/fr/news/demo-patch-notes-0921), et déjà dans le [MetaShifting](/fr/metashifting) et dans l'historique d'équilibrage de chaque carte concernée.

## Le mode classé s'ouvre avec le Steam Next Fest {#classe}

L'équipe activera le mode classé « avec le début du Steam Next Fest », avec des récompenses classées exclusives dont les détails n'ont pas été annoncés. Le festival se tient du lundi 19 octobre 2026 à 10:00, heure du Pacifique, au lundi 26 octobre. Quand le ladder s'ouvrira à tous, la première vraie [tier list](/fr/tier-list) d'OriginsMeta démarrera aussi, construite sur les résultats.

## La liste de cartes de la Crimson Cup est dans le jeu {#crimson-cup}

La mise à jour embarque aussi la liste provisoire des cartes de la Crimson Cup, le plus grand tournoi organisé par Koin Games à ce jour, du 20 au 25 octobre : qualifications régionales les 20, 21 et 22, puis playoffs et finales, au format Conquest, au meilleur des trois manches, avec une grande finale au meilleur des cinq. Les lots valent 10 000 dollars en tout, entre argent, cartes promo, boosters et boîtes de l'Alpha Edition : ce n'est pas une cagnotte en espèces.

« Sauf patchs d'équilibrage à venir, vous pouvez commencer à préparer vos decks pour le tournoi », écrit l'équipe. Deux outils pour commencer :

- le [Deck builder](/fr/deck-builder), dont le mode tournoi vérifie les règles du Conquest pendant que vous construisez ;
- le [guide du Steam Next Fest](/fr/guides/steam-next-fest-2026), avec les dates, les horaires et la marche à suivre pour s'inscrire sur Discord.

**Mise à jour du 30 septembre :** le patch d'équilibrage est arrivé le 29 septembre. Le [patch 0.7](/fr/news/patch-0-7), que l'équipe présente comme le dernier patch d'équilibrage avant le tournoi, retravaille Twister Toss et fait coûter 1 de plus à Bagheera, Mind Palace et Spellbook.

## La progression : ce que vous gardez {#progression}

C'était la question restée ouverte. Le 16 septembre, un message du staff sur Discord avait confirmé que [les déblocages de decks et la progression contre les boss passeraient de la Demo 1 à la Demo 2](/fr/news/demo-2-progress-carryover), mais il ne disait rien du playtest fermé. L'équipe est maintenant explicite : qui a joué à la démo, au playtest ou aux deux garde la progression la plus avancée, « pour que personne n'ait à débloquer les cartes une nouvelle fois ».

Cela compte parce que débloquer est lent. Dans le playtest, chaque deck s'ouvre après trois victoires en classé plus une victoire contre un boss IA, le parcours que les joueurs avaient jugé punitif dans les [retours du 14 septembre](/fr/news/playtest-feedback-deck-unlock).

## Et le playtest ? {#playtest}

Qui joue au playtest fermé ne reçoit ni nouveaux decks, ni cartes, ni boss avec cette mise à jour. La partie finition arrive sur le playtest plus tard dans la semaine, avec d'autres changements que l'équipe veut tester avec les joueurs : qui enchaîne les parties classées là-bas devra patienter quelques jours.

## Ce que nous ne savons pas encore {#questions-ouvertes}

- En quoi consistent les récompenses classées exclusives.
- Si la construction de decks est déjà ouverte à tous dans la démo publique : l'annonce ne le dit pas.

**Mise à jour du 22 septembre :** deux réponses sont arrivées. Le détail de l'équilibrage est public (les [notes de patch](/fr/news/demo-patch-notes-0921)), et l'annonce est maintenant aussi sur Steam, où elle a été publiée le 21 septembre à 21:59 UTC.

## La rumeur qui avait vu juste {#rumeur}

La semaine dernière, une phrase circulait sur les réseaux sociaux à propos d'une « Demo Season 2 » prévue la semaine suivante, avec de nouveaux decks, de nouvelles récompenses et un premier aperçu de la collection. Nous l'avions [rapportée comme une rumeur](/fr/news/demo-2-animations-and-fixes), parce qu'aucun post officiel ne la confirmait. Le calendrier et la partie collection se sont révélés exacts.`,
    highlights: [
      { label: "Nouvelle interface et nouveau plateau", text: "les écrans autour de la partie et le plateau sont redessinés", anchor: "nouvelle-interface" },
      { label: "Tutoriel pour collectionneurs", text: "comment fonctionne la collection, expliqué dans le jeu", anchor: "tutoriel-collectionneurs" },
      { label: "Boosters de test", text: "des boosters à ouvrir dans la démo", anchor: "boosters-de-test" },
      { label: "Nouvelles répliques vocales", anchor: "repliques" },
      { label: "Changements d'équilibrage", text: "Dorothy coûte 4 et 14 cartes changent : les notes de patch complètes", anchor: "equilibrage" },
      { label: "Mode classé au Steam Next Fest", text: "dès le 19 octobre, avec des récompenses exclusives", anchor: "classe" },
      { label: "Liste de cartes de la Crimson Cup", text: "provisoire, les decks du tournoi peuvent déjà se construire", anchor: "crimson-cup" },
      { label: "Progression conservée", text: "la plus avancée entre démo et playtest", anchor: "progression" },
      { label: "Playtest", text: "pas de nouveau contenu, mise à jour de finition plus tard dans la semaine", anchor: "playtest" },
    ],
    faq: [
      { q: "Est-ce que je perds ma progression avec la mise à jour de la démo d'Origins TCG ?", a: "Non. Qui a joué à la démo, au playtest fermé ou aux deux garde la progression la plus avancée, donc aucune carte n'est à débloquer une nouvelle fois (annonce de l'équipe du 21 septembre 2026)." },
      { q: "Quand le mode classé démarre-t-il dans la démo d'Origins TCG ?", a: "Avec le début du Steam Next Fest, le lundi 19 octobre 2026, avec des récompenses classées exclusives dont les détails n'ont pas encore été annoncés." },
      { q: "Peut-on déjà construire des decks pour la Crimson Cup ?", a: "Oui : la liste provisoire des cartes du tournoi est dans le jeu depuis la mise à jour du 21 septembre, et le patch 0.7 du 29 septembre est le dernier patch d'équilibrage avant la Crimson Cup, qui se joue du 20 au 25 octobre 2026." },
      { q: "Qu'est-ce qui change pour les joueurs du playtest ?", a: "Ni nouveaux decks, ni cartes, ni boss pour l'instant : la mise à jour de finition arrive sur le playtest plus tard dans la semaine du 21 septembre, avec d'autres changements à tester." },
    ],
  },
  "forum-bugs-before-demo-2": {
    title: "Parties bloquées, l'œuf au Colosseum et un bouton de revanche : les signalements du week-end",
    metaTitle: "Bugs d'Origins TCG : parties bloquées et Golden Egg",
    description: "Trois signalements du forum Origins TCG, 19–20 septembre : partie bloquée sur waiting, Golden Egg au Colosseum et bouton de revanche en partie privée.",
    summary: "Trois nouveaux fils de discussion sur le forum Steam entre le 19 et le 20 septembre, encore sans réponse de l'équipe : une partie qui se fige après le combat, un Golden Egg qui se comporte bizarrement au Colosseum et la demande d'un bouton de revanche dans les parties privées.",
    body: `## Une partie bloquée sur « waiting » {#partie-bloquee}

Le 20 septembre, un joueur a signalé une partie figée après la phase de combat : l'écran est resté sur « waiting » bien au-delà du temps du tour, alors que tout le reste restait cliquable et que la partie pouvait encore être abandonnée.

Un autre joueur a répondu qu'il s'agit d'un bug connu lié à Spellbook et qu'il devrait être corrigé dans la « demo season 2 la semaine prochaine ». Cette réponse venait d'un joueur, pas de l'équipe, et à ce moment-là ce n'était pas une annonce.

**Mise à jour du 21 septembre :** la [première grande mise à jour de la démo](/fr/news/demo-first-big-update) est bien arrivée le lendemain. La liste des correctifs n'a pas encore été publiée, donc nous ne pouvons pas dire si ce bug en fait partie.

## Le Golden Egg au Colosseum {#golden-egg}

Le 19 septembre, un autre joueur a décrit un combat au lieu Colosseum :

1. son Golden Egg a été brisé par la capacité À la révélation de Black Knight, qui inflige 2 dégâts à l'ennemi en face ;
2. l'œuf a invoqué la Golden Goose, une 5/5, sur le même emplacement ;
3. au combat, la Goose n'a infligé aucun dégât : Black Knight, un 2/2, a survécu, et la Goose s'est retrouvée à 5/3.

Cela ressemble à la règle expliquée sur le forum par le développeur Fenchurch le 15 septembre : un personnage invoqué en plein combat, sur la case où il apparaît, n'attaque pas avant la manche suivante. Être invoqué ne le protège pas des dégâts, ce qui explique le 5/3. Ce que le Colosseum ajoute n'est pas encore clair : le fil n'a pas de réponse pour l'instant.

## Un bouton de revanche pour les parties privées {#revanche}

Le troisième fil est une demande : un bouton « rejouer » ou « revanche » à la fin d'une partie privée, et la possibilité de changer de deck sans quitter le salon privé.

## Ce qu'a dit l'équipe jusqu'ici {#equipe}

Les dernières réponses de l'équipe sur le forum datent du 16 septembre : [des animations plus rapides et le bug d'Off With Your Head!](/fr/news/demo-2-animations-and-fixes), et [le rework de l'IA des combats de boss](/fr/news/demo-2-boss-ai-rework).`,
    highlights: [
      { label: "Une partie bloquée sur « waiting »", text: "après le combat, signalée le 20 septembre ; un joueur la relie à Spellbook", anchor: "partie-bloquee" },
      { label: "Le Golden Egg au Colosseum", text: "la Golden Goose invoquée n'a infligé aucun dégât au combat", anchor: "golden-egg" },
      { label: "Un bouton de revanche", text: "demandé pour les parties privées, avec changement de deck dans le salon", anchor: "revanche" },
      { label: "Ce qu'a dit l'équipe", text: "ses dernières réponses sur le forum datent du 16 septembre", anchor: "equipe" },
    ],
  },
  "demo-2-progress-carryover": {
    title: "La Demo 2.0 conserve vos déblocages de decks et de boss de la Demo 1",
    metaTitle: "Origins TCG : la Demo 2.0 conserve vos déblocages",
    description: "Staff de Koin Games sur Discord, 16 septembre : déblocages de decks et progression contre les boss de la Demo 1 d'Origins TCG conservés dans la Demo 2.",
    summary: "Le 16 septembre, un membre du staff de Koin Games a écrit sur le Discord officiel que la Demo 2 conserve les déblocages de decks et la progression contre les boss obtenus dans la Demo 1. Le 21 septembre, l'équipe a étendu la promesse au playtest fermé.",
    body: `## Ce qu'a écrit le staff {#staff}

« Demo V2 deck will carry over your V1 deck unlock/boss progress », c'est-à-dire que la Demo 2 conserve les déblocages de decks et la progression contre les boss de la Demo 1 : c'est le message qu'un membre du staff d'Origins a publié sur le Discord officiel le soir du 16 septembre, en réponse aux joueurs qui demandaient si tout le monde devrait repartir de zéro. Une capture du message a été partagée sur Reddit le lendemain matin.

## Pourquoi cela comptait {#pourquoi}

Dans le playtest, chaque deck se débloque avec trois victoires en classé plus une victoire contre un boss IA, le parcours que les joueurs avaient jugé punitif dans les [retours du 14 septembre](/fr/news/playtest-feedback-deck-unlock). Devoir le refaire depuis le début avec la Demo 2 était la principale inquiétude. Jusqu'à ce message, la réponse qui circulait dans la communauté était l'inverse.

## Ce qui restait ouvert {#ouvert}

Le message ne parlait que de la Demo 1 et de la Demo 2. Aucun post officiel ne disait si la progression obtenue dans le playtest fermé compterait aussi, donc nous avions alors gardé les deux choses séparées.

## Mise à jour du 21 septembre {#mise-a-jour}

La question est close. En annonçant [la première grande mise à jour de la démo](/fr/news/demo-first-big-update), l'équipe a écrit que qui a joué à la démo, au playtest ou aux deux garde la progression la plus avancée, « pour que personne n'ait à débloquer les cartes une nouvelle fois ».`,
    highlights: [
      { label: "Les déblocages de la Demo 1 sont conservés", text: "decks et progression contre les boss, a écrit le staff sur Discord le 16 septembre", anchor: "staff" },
      { label: "Pourquoi cela comptait", text: "dans le playtest, chaque deck demande trois victoires en classé et une contre un boss", anchor: "pourquoi" },
      { label: "Le playtest compte aussi", text: "depuis le 21 septembre, vous gardez la progression la plus avancée", anchor: "mise-a-jour" },
    ],
  },
  "demo-2-boss-ai-rework": {
    title: "Koin va retravailler l'IA des combats de boss dans la Demo 2.0",
    metaTitle: "Origins TCG : Koin va revoir l'IA des boss dans la Demo 2.0",
    description: "Le développeur Fenchurch confirme sur le forum Steam un rework de l'IA des boss d'Origins TCG dans la Demo v2, après un signalement sur le boss Dracula.",
    summary: "Un joueur a décrit le boss Dracula des missions gagnant chaque tirage aléatoire. Fenchurch, développeur de Koin Games, a répondu sur le forum Steam que l'IA des combats de boss est en cours de rework pour la Demo v2, et que les boss et le déblocage des cartes continueront de changer.",
    body: `## Le signalement {#signalement}

Le 15 septembre, un joueur a publié sur le forum Steam le récit de quatre parties contre Dracula, le boss des missions de la démo. Les boss précédents, écrit-il, étaient forts mais corrects : tous battus du premier coup avec les decks préconstruits débloqués juste avant. Dracula, lui, semblait réussir chaque effet « aléatoire » :

- les citrouilles frappaient toujours la barrière avec le moins de Santé ;
- les sorts qui infligent 6 dégâts au hasard tombaient toujours sur le personnage le plus fort avec 6 de Santé ou moins ;
- les défausses aléatoires prenaient toujours la carte la plus dangereuse de la main ;
- les invocations aléatoires arrivaient toujours sur le meilleur emplacement.

## La réponse de l'équipe {#reponse}

Le développeur Fenchurch a répondu le 16 septembre : « Our boss fight AI will be getting a re-work in Demo v2 », c'est-à-dire que l'IA des combats de boss sera retravaillée dans la Demo v2. Il a ajouté que l'équipe continuera d'observer et de modifier le fonctionnement des combats de boss et du déblocage des cartes.

Ce n'est pas le premier changement apporté aux boss. Les notes de patch 0.6.3 du playtest, le 27 août, leur avaient déjà donné une « nouvelle intelligence de bot améliorée », en demandant aux joueurs s'ils étaient devenus plus malins ou plus bêtes.

## Pourquoi c'est important {#pourquoi}

Les boss font partie du parcours de déblocage : dans le playtest, un deck s'ouvre après trois victoires en classé et une victoire contre un boss IA. Un boss qui paraît injuste ralentit toute la collection. C'est la deuxième fois en une semaine que ce parcours revient dans les fils de retours, après [la réponse du 14 septembre](/fr/news/playtest-feedback-deck-unlock) sur l'idée de rendre ces parties uniquement PvE.

## Mise à jour du 21 septembre : ce qui a suivi {#suite}

Le 21 septembre, la [première grande mise à jour de la démo](/fr/news/demo-first-big-update) est arrivée. L'annonce ne mentionne pas les boss : on ne sait pas encore si la nouvelle IA en fait déjà partie.`,
    highlights: [
      { label: "Le signalement", text: "Dracula, le boss des missions, semblait gagner chaque tirage aléatoire", anchor: "signalement" },
      { label: "Rework de l'IA des boss promis pour la Demo v2", text: "confirmé par le développeur Fenchurch le 16 septembre", anchor: "reponse" },
      { label: "Pourquoi c'est important", text: "les boss font partie du parcours qui débloque les decks", anchor: "pourquoi" },
      { label: "Après la mise à jour du 21 septembre", text: "l'annonce ne mentionne pas les boss", anchor: "suite" },
    ],
  },
  "demo-2-animations-and-fixes": {
    title: "Avant la Demo 2.0 : animations plus rapides confirmées, le bug d'Off With Your Head! à corriger",
    metaTitle: "Origins TCG : animations rapides, bug d'Off With Your Head!",
    description: "Confirmé par l'équipe d'Origins TCG le 16 septembre : animations plus rapides, bug d'Off With Your Head! corrigé avec la Demo v2, l'audio et une rumeur.",
    summary: "Le 16 septembre, l'équipe a confirmé sur le forum Steam que les animations seront accélérées et que les copies invisibles d'Off With Your Head! sont un bug connu, corrigé avec la Demo v2. Pendant ce temps, une rumeur sur une « Demo Season 2 » circulait.",
    body: `## Des animations plus rapides {#animations}

« Les animations doivent être accélérées de 100 à 200 % » : le fil ouvert le 11 septembre a reçu surtout des réponses favorables, un joueur trouvant la vitesse correcte telle qu'elle est. Le 16 septembre, un membre du staff a répondu que l'équipe a pris acte du besoin d'accélérer les animations et que « ce sera corrigé dans une prochaine mise à jour ».

## Le bug d'Off With Your Head! {#off-with-your-head}

Un nouveau joueur a décrit des copies de Christopher Robin apparues sans illustration, avec seulement la Puissance et la Santé visibles. Le développeur Fenchurch a identifié la carte en cause : Off With Your Head!, qui détruit un allié et invoque une copie de base de celui-ci dans chaque autre lieu. Les copies semi-invisibles sont un bug connu, et « il sera corrigé quand nous sortirons la Demo v2 ici, très bientôt ».

## Audio {#audio}

À un joueur qui avait listé plusieurs bugs, Fenchurch a répondu que les signalements audio seraient transmis à l'équipe audio.

## La rumeur de la « Demo Season 2 » {#rumeur}

Les mêmes jours, une phrase circulait sur les réseaux sociaux : une « Demo Season 2 » prévue la semaine suivante, avec de nouveaux decks, de nouvelles récompenses et un premier aperçu de la collection. Aucun post officiel sur Steam, sur Discord ou sur origins-tcg.com ne la confirmait, donc nous l'avons rapportée comme une rumeur et nous nous en sommes tenus aux dates officielles, le Steam Next Fest du 19 au 26 octobre.

**Mise à jour du 21 septembre :** la rumeur avait vu juste sur le calendrier. La [première grande mise à jour de la démo](/fr/news/demo-first-big-update) est arrivée le 21 septembre avec un tutoriel pour collectionneurs et des boosters de test. La liste des correctifs n'a pas encore été publiée, donc nous ne pouvons pas dire si le bug d'Off With Your Head! en fait partie.`,
    highlights: [
      { label: "Des animations plus rapides", text: "le staff dit qu'elles seront accélérées dans une prochaine mise à jour", anchor: "animations" },
      { label: "Le bug d'Off With Your Head!", text: "des copies semi-invisibles, un bug connu à corriger avec la Demo v2", anchor: "off-with-your-head" },
      { label: "Audio", text: "les signalements sont transmis à l'équipe audio", anchor: "audio" },
      { label: "La rumeur de la « Demo Season 2 »", text: "elle avait vu juste sur le calendrier : la mise à jour de la démo est arrivée le 21 septembre", anchor: "rumeur" },
    ],
  },
  "davdas-3-pigs-mid-range": {
    title: "3 Pigs Mid Range : un deck midrange Three Not So Little Pigs pour le ladder et le jeu compétitif",
    metaTitle: "Nouveau deck du staff Origins TCG : 3 Pigs Mid Range",
    description: "Deck midrange d'Origins TCG mené par Three Not So Little Pigs, pour le ladder et le compétitif : prenez le plateau, gagnez un lieu, concluez avec En Passant.",
    summary: "Le deuxième deck de Davdas, membre du staff d'OriginsMeta, est une liste midrange menée par Three Not So Little Pigs, étiquetée pour le ladder et le jeu compétitif. Le plan : prendre le plateau dans les premières manches, gagner au moins un lieu, puis conclure avec En Passant, le Piétinement d'Ellen Trechend et les Lightning Strike générés par Impundulu. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de l'auteur, le code du jeu et le bouton pour l'ouvrir dans le Deck builder, et deux guides pour le jouer.",
  },
  "davdas-healing-healsing": {
    title: "Healing Healsing, le premier deck de la communauté : une liste contrôle Van Helsing pour le ladder",
    metaTitle: "Premier deck Origins TCG sur OriginsMeta : Van Helsing",
    description: "Premier deck publié sur OriginsMeta : une liste contrôle Van Helsing pour le ladder d'Origins TCG, qui soigne les dégâts et vide le plateau en fin de partie.",
    summary: "Le premier deck publié sur OriginsMeta est signé Davdas, membre du staff du site : une liste contrôle menée par Van Helsing pour le ladder classé. Le plan : prendre de la valeur tôt avec Spellbook et Ali Baba, encaisser les dégâts à coups de soins pendant que Phuong Hoang grandit à chaque soin, puis atteindre la manche 8 ou 9 et remettre le plateau à zéro avec Forbidden Knowledge. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de l'auteur, le code du jeu et le bouton pour l'ouvrir dans le Deck builder, et deux guides pour le jouer.",
  },
  "playtest-feedback-deck-unlock": {
    title: "Retours du playtest : Koin lit le forum Steam et pourrait passer les déblocages de decks en PvE",
    metaTitle: "Playtest d'Origins TCG : déblocages de decks en PvE ?",
    description: "Retours du playtest d'Origins TCG : un deck se débloque après trois victoires en classé et un boss ; Koin lit le forum et envisage de passer en PvE.",
    summary: "Dans le playtest actuel, un deck se débloque en gagnant trois parties classées puis en battant un boss IA ; les joueurs trouvent cela punitif quand ils affrontent des collections complètes avec un deck de départ. Le développeur Fenchurch a répondu que l'équipe lit chaque post du forum Steam et envisage de rendre les parties de déblocage uniquement PvE. Signalés aussi : les cartes qui génèrent des cartes aléatoires (Humpty, Spellbook) peuvent ajouter des Légendaires supplémentaires à un deck, des demandes de refonte de Spellbook, et la capacité À la révélation d'Asanbosam qui ne se répète pas au lieu Cloning Lab.",
  },
  "kickstarter-ama-pre-registration": {
    title: "AMA Kickstarter : préinscription ouverte, boîtes Alpha Edition en précommande uniquement",
    metaTitle: "AMA Kickstarter : boîtes Alpha en précommande",
    description: "AMA Kickstarter Origins TCG, 10 septembre : 15 % de réduction pour 1 dollar remboursable, boîtes Alpha en précommande seulement. Date et suite dans le guide.",
    summary: "Le 10 septembre, Koin Games a répondu sur le Discord officiel aux questions sur le Kickstarter à venir. La date de la campagne n'est pas encore annoncée ; la page officielle de préinscription offre 15 % de réduction au lancement pour un dépôt de 1 dollar, intégralement remboursable avant le lancement. L'Origins Myths & Legends Alpha Edition se compose de boosters collector de 5 cartes (au moins une Rare ou mieux garantie), de boîtes de 24 boosters et de cases de 6 boîtes ; boîtes et cases sont en précommande uniquement et le tirage ne sera pas réédité. Les cartes s'échangent sur le Marché de la communauté Steam ; l'ouverture de boosters sur mobile est prévue pour 2027.",
  },
  "gameplay-trailer": {
    title: "Bande-annonce de gameplay officielle publiée sur YouTube",
    metaTitle: "Bande-annonce de gameplay d'Origins TCG sur YouTube",
    description: "La première bande-annonce de gameplay d'Origins TCG est sur YouTube : le moyen le plus rapide de voir le rythme d'une partie et l'interface avant la Demo 2.0.",
    summary: "La première bande-annonce consacrée au gameplay est en ligne sur la chaîne YouTube officielle d'Origins TCG : le moyen le plus rapide de voir le rythme d'une partie et l'interface avant que la Demo 2.0 n'arrive au Steam Next Fest.",
  },
  "itzbolt-wins-conquest": {
    title: "itzBolt remporte le Big Bob's Playtest Battle, le premier tournoi Conquest",
    metaTitle: "Origins TCG : itzBolt remporte le premier tournoi Conquest",
    description: "itzBolt a remporté le Big Bob's Playtest Battle, le premier tournoi d'Origins TCG au format Conquest, joué sur le playtest 0.6.3 au meilleur des trois.",
    summary: "Le tournoi communautaire joué sur la build 0.6.3 du playtest, avec construction de decks complète et format Conquest (plusieurs decks aux Légendaires différentes, au meilleur des trois), a été remporté par itzBolt, selon les résultats partagés par la communauté (nous n'avons pas trouvé de post officiel avec le résultat). C'était le premier test public du format que Koin a ensuite choisi pour la Crimson Cup.",
  },
  "biggest-tournament-ever": {
    title: "La Crimson Cup annoncée : le plus grand tournoi jamais organisé pour le Steam Next Fest",
    metaTitle: "La Crimson Cup annoncée pour le Next Fest",
    description: "Crimson Cup d'Origins TCG, annoncée le 9 septembre : 20–25 octobre, qualifications régionales, 10 000 dollars de lots, et les règles finales.",
    summary: "Un événement sur plusieurs jours, du 20 au 25 octobre : des qualifications pour chacune des trois grandes régions les 20, 21 et 22, puis les playoffs et les finales. Des lots d'une valeur de 10 000 dollars : une carte promo 1/1 exclusive, d'autres cartes promo, des boosters numériques, des boîtes et des cases Alpha, et des prix en argent. Inscriptions sur Discord ; les créateurs de contenu peuvent demander une invitation wildcard directement pour les playoffs.",
    body: `Règles, format et check-in, fixés le 24 septembre : [règles de la Crimson Cup](/fr/news/crimson-cup-format-check-in).

## Ce que Koin a annoncé le 9 septembre {#dates}

Le 9 septembre, Koin Games a annoncé sur Steam son plus grand tournoi à ce jour : un événement sur plusieurs jours pendant le Steam Next Fest, du 20 au 25 octobre 2026.

1. **Des qualifications**, une pour chacune des trois grandes régions, les 20, 21 et 22 octobre.
2. **Les playoffs et les finales** après les qualifications.

## Les lots annoncés {#lots}

Les lots valent 10 000 dollars en tout et prennent plusieurs formes :

- une carte promo 1/1 exclusive ;
- d'autres cartes promo ;
- des boosters numériques ;
- des boîtes et des cases Alpha ;
- des prix en argent.

## Inscriptions et wildcards {#inscriptions}

Les inscriptions se font sur le [Discord officiel d'Origins TCG](https://discord.gg/originstcg). Les créateurs de contenu peuvent demander une invitation wildcard qui les envoie directement en playoffs.

## Mise à jour du 25 septembre 2026 {#mise-a-jour}

Cet article rapporte la première annonce, celle du 9 septembre. Le 24 septembre, après un sondage auprès des joueurs, Koin Games a fixé le format : Conquest à trois decks, au moins 8 cartes uniques entre chaque paire de decks, listes cachées jusqu'au top 4 et aucun ban dans les matchs au meilleur des cinq. Le check-in est obligatoire : il ouvre deux heures avant chaque qualification et ferme cinq minutes avant le début, en même temps que la remise des decks. Le tournoi se joue sur la démo principale, et la répartition exacte de la cagnotte a été promise pour la semaine suivante.

Les règles, les horaires du check-in et ce que nous ne savons pas encore sont dans [notre article sur les règles de la Crimson Cup](/fr/news/crimson-cup-format-check-in) ; les dates, les places par région et comment vous préparer, dans notre [guide du Steam Next Fest 2026](/fr/guides/steam-next-fest-2026).`,
    highlights: [
      { label: "Du 20 au 25 octobre", text: "qualifications pour les trois grandes régions les 20, 21 et 22, puis playoffs et finales", anchor: "dates" },
      { label: "Des lots d'une valeur de 10 000 dollars", text: "une carte promo 1/1, d'autres cartes promo, des boosters numériques, des boîtes et cases Alpha, de l'argent", anchor: "lots" },
      { label: "Inscriptions sur Discord", text: "les créateurs peuvent demander une wildcard directement pour les playoffs", anchor: "inscriptions" },
      { label: "Les règles définitives", text: "Conquest à trois decks et check-in obligatoire, fixés le 24 septembre", anchor: "mise-a-jour" },
    ],
  },
  "patch-0-6-3": {
    title: "Patch 0.6.3 du playtest : seize cartes ajustées, King Arthur à 7/7",
    metaTitle: "Patch 0.6.3 d'Origins TCG : King Arthur à 7/7, 16 cartes",
    description: "Patch 0.6.3 du playtest d'Origins TCG, 27 août : buffs de King Arthur, Merlin et Lancelot, nerfs de Bandersnatch et Bigfoot, trois reworks, boss plus malins.",
    summary: "Un patch d'ajustements et de correctifs, utilisé pour le tournoi de Big Bob deux jours plus tard. Buffs pour King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll et Blow the House Down ; nerfs pour Bandersnatch, Bigfoot, Scarecrow et Merlin's Prophecy ; Bagheera, Christopher Robin et Sandman retravaillés. Les boss ont une IA plus intelligente.",
  },
  "big-bobs-playtest-battle": {
    title: "Big Bob's Playtest Battle inaugure le format Conquest",
    metaTitle: "Big Bob's Playtest Battle : Conquest sur Origins TCG",
    description: "Big Bob's Playtest Battle, 28 août : premier tournoi Conquest d'Origins TCG, au meilleur des trois et à élimination directe, wildcards pour le Next Fest.",
    summary: "Tournoi le 28 août sur la build du playtest avec construction de decks complète. BO3, élimination directe et première utilisation du Conquest : vous soumettez plusieurs decks avec des Légendaires différentes et au moins neuf cartes différentes, et vous bannissez un des decks de votre adversaire. Lots : des wildcards pour le tournoi du Next Fest et des Collector Packs.",
  },
  "patch-0-6-2": {
    title: "Patch 0.6.2 du playtest : passe d'équilibrage sur 23 cartes",
    metaTitle: "Patch 0.6.2 d'Origins TCG : 23 cartes rééquilibrées",
    description: "Patch 0.6.2 du playtest d'Origins TCG, 21 août : Mulan gagne Double attaque, Queen of Hearts à 4 mana, Van Helsing's Tools gratuit. 23 cartes changent.",
    summary: "Huit cartes ont changé de capacité. Mulan gagne Double attaque, la Queen of Hearts passe à 4 Mana 3/3 avec Première frappe, Ellen Trechend devient un 3/3 à 8 Mana qui grandit de +3/+3 par ennemi. Van Helsing's Tools est gratuit mais la Silver Bullet inflige 1. La collection est désormais limitée aux dix decks du playtest.",
  },
  "patch-0-6-1-ranked": {
    title: "Patch 0.6.1 : ladder classé, classement Grandmaster, trois decks retouchés",
    metaTitle: "Patch 0.6.1 : mode classé et Grandmaster",
    description: "Patch 0.6.1 d'Origins TCG, 14 août : mode classé avec classement mondial pour la division Grandmaster, options de confort et Huntsman à 6 mana.",
    summary: "Le mode classé arrive avec un classement mondial pour la division Grandmaster, plus du confort de jeu : passer le tutoriel, voir la Légendaire adverse pendant le mulligan, couper les émotes. Huntsman passe à 6 Mana 6/6 ; Swarm, Evil et Discard échangent une carte chacun.",
  },
  "demo-2-playtest": {
    title: "Playtest de la Demo 2.0 : 5 nouveaux decks, plus de 70 nouvelles cartes, construction de decks",
    metaTitle: "Playtest de la Demo 2.0 d'Origins TCG : 5 decks, 70+ cartes",
    description: "Mise à jour d'Origins TCG pour le Next Fest en playtests dès le 7 août : 5 nouveaux decks, 70+ cartes et construction de decks, ouverts à tous sur Discord.",
    summary: "La mise à jour qui sortira pour le Steam Next Fest d'octobre part en playtests communautaires, à partir du vendredi 7 août à 21:00 UTC avec une game night. Ouvert à tous via Discord.",
  },
  "demo-stats-ama": {
    title: "Premiers chiffres de la démo : plus de 1 000 joueurs, 13 000 parties, médiane 1 h 51",
    metaTitle: "Démo d'Origins TCG : 1 000+ joueurs, 13 000+ parties",
    description: "Six jours après son lancement, la démo d'Origins TCG dépasse 1 000 joueurs et 13 000 parties, médiane 1 h 51. Et un AMA, un premier tournoi et la Card Party.",
    summary: "Six jours après le lancement, l'équipe partage les chiffres de la démo et annonce un AMA avec le CEO Tim Jooste et le responsable du game design Kevin Lambert (22 juillet), le premier tournoi de la démo (24 juillet) et un stand à la Card Party de Fort Lauderdale (24–26 juillet).",
  },
  "demo-live": {
    title: "La démo d'Origins TCG est disponible sur Steam",
    metaTitle: "La démo d'Origins TCG sort avec ses exclusivités",
    description: "La démo gratuite d'Origins TCG est sur Steam, avec des objets de collection exclusifs qui ne reviendront plus et seront échangeables à la sortie du jeu.",
    summary: "Démo gratuite avec des objets de collection exclusifs, qui ne seront plus disponibles ensuite et deviendront échangeables sur la place de marché Steam à la sortie du jeu complet. Soirée de lancement sur Discord le jour même.",
  },
  "creator-program": {
    title: "Creator Program annoncé, les détails dans un AMA sur Discord",
    metaTitle: "Creator Program d'Origins TCG annoncé, AMA sur Discord",
    description: "Koin Games ouvre le Creator Program d'Origins TCG avant le Next Fest : les détails dans l'AMA du 19 août, enregistré sur Discord. OriginsMeta a candidaté.",
    summary: "Koin Games ouvre un programme pour créateurs de contenu avant le Steam Next Fest. Les détails ont été donnés lors d'un AMA le 19 août à 20:00 UTC ; l'enregistrement est sur Discord. OriginsMeta a candidaté.",
  },
  "community-open": {
    title: "Le Discord officiel s'ouvre à tous",
    metaTitle: "Le Discord officiel d'Origins TCG s'ouvre à tous",
    description: "Le Discord officiel d'Origins TCG, qui réunissait les testeurs de l'alpha, s'ouvre à tous : démo annoncée et premier aperçu des objets de collection.",
    summary: "Le serveur qui accueillait les premiers testeurs de l'alpha s'ouvre à tous, avec une démo annoncée pour bientôt et un premier aperçu des objets de collection.",
  },
  "metal-cards-tease": {
    title: "Le CEO dévoile des cartes physiques en métal",
    metaTitle: "Cartes en métal d'Origins TCG : le teaser du CEO",
    description: "Le CEO de Koin Games, Tim Jooste, filmé avec des cartes de collection en métal d'Origins TCG. Ni produit ni date : pour l'instant, un signal d'intention.",
    summary: "Tim Jooste a été filmé avec des cartes de collection en métal basées sur l'univers du jeu. Ni produit ni date annoncés : un signal d'intention de la part d'un studio né dans le numérique.",
  },
  "steam-page-live": {
    title: "Page Steam en ligne : liste de souhaits ouverte, démo en route",
    metaTitle: "Page Steam d'Origins TCG : liste de souhaits ouverte",
    description: "Page Steam d'Origins TCG en ligne, liste de souhaits ouverte. Premier post de l'équipe : parties tactiques rapides et collection inspirée des TCG physiques.",
    summary: "Premier post Steam de l'équipe : un jeu de cartes à collectionner construit autour de parties tactiques rapides et d'un système de collection inspiré des TCG physiques.",
  },
  "digital-lgs-program": {
    title: "Digital LGS Program : Origins TCG veut des tournois hebdomadaires et ses sets dans les boutiques de jeux",
    metaTitle: "Origins TCG en boutique : Digital LGS Program",
    description:
      "Le fondateur de Koin Games présente le Digital LGS Program d'Origins TCG : tournois hebdomadaires, promos exclusives et précommandes de sets en boutique.",
    summary:
      "Le 6 octobre, Tim Jooste, fondateur et CEO de Koin Games, a présenté sur X le Digital LGS Program : les boutiques de jeux locales accueilleront des tournois hebdomadaires d'Origins, vendront des boosters et des promos réservés à la boutique et prendront les précommandes de sets de collection qui ne seront pas disponibles dans le jeu. Les événements en présentiel commencent début 2027 ; le Set 1 arrive sur Kickstarter le 27 octobre, avec les boutiques associées au lancement. Le 8 octobre, le compte officiel d'Origins a ajouté les conditions : les boutiques prennent les précommandes et reçoivent une part des revenus, sans frais ni stock puisque tout est un objet de l'inventaire Steam, et accueillent en échange des événements de jeu organisé.",
    highlights: [
      { label: "Le Digital LGS Program", text: "le fondateur de Koin Games le présente sur X : les sets d'Origins distribués par les boutiques de jeux locales", anchor: "programme" },
      { label: "Tournois, promos, précommandes", text: "tournois hebdomadaires en boutique, boosters et promos réservés aux joueurs sur place, précommandes de sets absents du jeu", anchor: "boutiques" },
      { label: "Comment ça marche pour les boutiques", text: "précommandes avec une part des revenus, ni frais ni stock, jeu organisé en échange (8 octobre)", anchor: "fonctionnement" },
      { label: "Début 2027, Kickstarter le 27 octobre", text: "les événements en présentiel commencent début 2027 ; le Set 1 arrive sur Kickstarter avec les boutiques à bord, plus de 30 déjà intéressées", anchor: "dates" },
      { label: "Les créateurs et un AMA", text: "les streamers et les créateurs ont un programme à eux ; AMA pour les boutiques et les créateurs le 12 octobre à 21:00 UTC", anchor: "createurs" },
      { label: "Ce que nous ne savons pas", text: "quelles boutiques et quels pays, la part des revenus, la fréquence des événements et leur date de départ", anchor: "inconnues" },
    ],
    body: `## Le Digital LGS Program {#programme}

Le 6 octobre 2026, **Tim Jooste**, fondateur et CEO de Koin Games, a publié sur X un long post accompagné d'une courte vidéo. Il y décrit une soirée dans votre boutique de jeux locale (LGS, local game store) avec, pour seul bagage, votre téléphone : une soirée de parties d'Origins contre les joueurs de votre ville, une promo exclusive à la boutique à aller décrocher et un booster du prochain set de collection à précommander. Le studio l'appelle le **Digital LGS Program** et, selon ses mots, il fait d'Origins « le 1er jeu de cartes numérique à distribuer ses sets par les boutiques de jeux locales du monde entier ».

C'est une affirmation du fondateur, pas quelque chose que nous pouvons vérifier. Ce que le post dit clairement, c'est la forme du programme : un jeu de cartes numérique avec un réseau physique de boutiques qui organisent ses événements et vendent ses sets.

**Mise à jour du 11 octobre :** le 8 octobre, le compte officiel d'Origins sur X a expliqué comment le programme fonctionne pour les boutiques. Elles prennent les précommandes et reçoivent une part des revenus, l'adhésion ne coûte rien et il n'y a pas de marchandise à stocker, car les cartes et les boosters sont des objets de l'inventaire Steam. En échange, les boutiques accueillent des événements de jeu organisé, le seul endroit où l'on gagne certaines promos et certains boosters spéciaux. Le compte a aussi annoncé un AMA pour les gérants de boutique et les créateurs le lundi 12 octobre à 21:00 UTC. Les détails sont dans les sections ci-dessous.

## Ce que reçoivent les boutiques et ce que reçoivent les joueurs {#boutiques}

Le post énumère quatre choses :

- **Des tournois hebdomadaires locaux**, joués en boutique.
- **Des boosters et des promos exclusifs, réservés aux joueurs sur place** : des cartes que l'on n'obtient qu'en se déplaçant.
- **Les précommandes des prochains sets de collection**, qui ne seront pas disponibles dans le jeu, avec des récompenses pour qui soutient sa boutique.
- Et, comme l'écrit le post, rencontrer de vraies personnes, jouer et se faire des amis en personne.

Les boutiques intéressées sont invitées à contacter Jooste directement : ses messages privés sur X sont ouverts, et il propose un appel.

## Comment ça marche pour les boutiques : les détails du 8 octobre {#fonctionnement}

Deux jours après le fondateur, le 8 octobre, le compte officiel d'Origins TCG sur X a expliqué le programme dans un post plus long. Son point de départ : dans les jeux de cartes traditionnels, ce sont les boutiques locales qui construisent la communauté, initient les nouveaux joueurs et organisent des événements réguliers, et les tournois locaux sont souvent l'endroit où l'on gagne les plus beaux lots. Origins est numérique par nature, dit le post, mais sa communauté mérite tout de même de vrais lieux où se retrouver. Les conditions :

- **Précommandes et part des revenus.** Les boutiques participantes peuvent prendre les précommandes des produits de collection d'Origins et reçoivent une part des revenus. Le post ne dit pas quelle est cette part.
- **Pas de stock.** Les cartes, les boosters, les boîtes et les cases existeront comme objets de l'inventaire Steam : les boutiques n'achètent pas de marchandise, ne gardent pas de stock, ne réservent pas de place en rayon et n'expédient pas de commandes.
- **Coût zéro.** Adhérer « costs literally $0 », ne coûte littéralement rien, dit le post, et les boutiques profitent des gains autant, sinon plus, qu'avec un jeu de cartes physique. La comparaison est celle de Koin.
- **Du jeu organisé en échange.** Les boutiques participantes accueillent des événements de jeu organisé. Origins orientera les joueurs vers ces boutiques et les soutiendra comme points de rendez-vous locaux du jeu.
- **Des récompenses réservées aux événements.** Des cartes promo uniques et des boosters spéciaux se gagnent en participant et en jouant dans les boutiques participantes. Origins ne vendra pas ces cartes de tournoi et ne les mettra pas dans les boosters normaux.
- **Un réseau qui peut grandir.** Le jeu organisé part d'événements locaux trimestriels et peut aller vers des compétitions plus fréquentes, des événements régionaux et, à terme, une structure avec un championnat du monde.

Un détail ne colle pas encore : le post du fondateur parlait de tournois hebdomadaires en boutique, alors que le post officiel décrit un réseau qui part d'événements locaux trimestriels. Aucun des deux n'explique comment les deux s'articulent.

## Les dates : début 2027, avec le Kickstarter le 27 octobre {#dates}

- Les **événements en présentiel commencent officiellement début 2027**. Les boutiques, dit le post, n'ont pas à attendre jusque-là.
- Le **Set 1 arrive sur Kickstarter le 27 octobre 2026** : la même date que le fondateur avait donnée le 17 septembre et que la démo affiche dans son menu (notre [guide du Kickstarter](/fr/guides/origins-tcg-kickstarter) rassemble tout ce qui est confirmé à ce jour). Contrairement à la plupart des campagnes de jeux de cartes, écrit Jooste, Koin travaille avec les boutiques locales sur le lancement lui-même.
- En **deux mois**, le studio a déjà parlé avec **plus de 30 boutiques** intéressées.

## Les créateurs ont une version à eux {#createurs}

Le post ajoute qu'une version du programme existe pour les streamers et les créateurs de contenu, sans détails. L'appel s'adresse aussi aux joueurs et aux collectionneurs : taguer sous le post sa boutique ou son créateur de TCG préféré.

Le 8 octobre, en réponse dans le même fil, le compte officiel a annoncé un **AMA sur le programme pour les gérants de boutique et les créateurs le lundi 12 octobre à 21:00 UTC**, sur son Discord des créateurs. Pour y participer, envoyez un message privé à @origins_tcg sur X.

## Pourquoi c'est important {#pourquoi}

Origins s'est toujours décrit comme free-to-compete, gratuit pour la compétition, et pensé pour les collectionneurs : le mode classé ne coûte rien et la collection repose sur [deux niveaux de cartes](/fr/guides/collector-economy), compétitives et de collection. Jusqu'ici, la partie collection n'avait été annoncée qu'en numérique : les boosters de l'Alpha Edition sur Kickstarter, les échanges sur le Marché de la communauté Steam ; le seul indice physique était les [cartes en métal](/fr/news/metal-cards-tease) filmées en mars. Un programme pour les boutiques lui donne un lieu physique : le tournoi du mardi soir, la promo que l'on ne gagne que là, le set que l'on précommande au comptoir. Et, d'après le post du 8 octobre, sans produits physiques : ce que la boutique vend reste dans l'inventaire Steam. Pour un jeu numérique, c'est aussi une façon de trouver des joueurs là où l'on joue déjà aux cartes.

Deux réserves. Les conditions viennent de deux posts sur X, celui du fondateur et celui du compte officiel, pas d'une page officielle avec un contrat et la liste des boutiques, et la part des revenus qui revient aux boutiques n'est pas indiquée. Et si vous voulez organiser des tournois avant 2027, vous n'avez pas besoin d'attendre le programme : notre [organisateur de tournois](/fr/tournaments) est gratuit et la communauté l'utilise déjà.

## Ce que nous ne savons pas encore {#inconnues}

- Quels pays et quelles boutiques participent, et s'il y aura une liste publique.
- Quelle est la part des revenus, et comment une précommande faite en boutique arrive dans l'inventaire Steam du joueur : un code, une liaison avec le compte ou autre chose.
- Ce que veut dire « sets non disponibles dans le jeu » pour la collection : le post officiel dit que les produits sont des objets de l'inventaire Steam et que les promos et les boosters spéciaux des tournois ne sont jamais vendus, mais pas si des sets entiers ne seront vendus que par les boutiques.
- À quelle fréquence on joue en boutique (le fondateur a écrit chaque semaine, le post officiel part d'événements locaux trimestriels), quand ont lieu les premiers événements et avec quelles règles : salons privés dans le jeu ou un mode dédié, et si les résultats comptent pour des événements régionaux ou un championnat du monde.
- Les prix, les récompenses pour une précommande en boutique et la façon dont les promos et les boosters spéciaux sont attribués lors des événements.
- Les conditions de la version pour les créateurs. L'AMA du 12 octobre pourrait répondre à certaines de ces questions.

## D'où vient l'information {#source}

Le [post de Tim Jooste sur X](https://x.com/TimothyJooste/status/2107532013687418943) du 6 octobre 2026, avec une vidéo de 15 secondes, et le [post du compte officiel d'Origins TCG](https://x.com/origins_tcg/status/2108281049721491549) du 8 octobre 2026, avec la [réponse qui annonce l'AMA](https://x.com/origins_tcg/status/2108281052212985975). Au 7 octobre, il n'y avait aucun post sur le programme sur la page Steam du jeu ; nous mettrons cet article à jour après l'AMA ou quand Koin Games publiera les conditions officielles.`,
    faq: [
      {
        q: "Qu'est-ce que le Digital LGS Program d'Origins TCG ?",
        a: "Un programme annoncé sur X par le fondateur et CEO de Koin Games, Tim Jooste, le 6 octobre 2026 : les boutiques de jeux locales accueillent des tournois hebdomadaires d'Origins, vendent des boosters et des promos exclusifs réservés aux joueurs sur place et prennent les précommandes des prochains sets de collection, qui ne seront pas disponibles dans le jeu. Le 8 octobre, le compte officiel d'Origins a ajouté les conditions pour les boutiques : précommandes avec une part des revenus, ni frais ni stock, des événements de jeu organisé en échange. Aucune page avec les conditions complètes n'a encore été publiée.",
      },
      {
        q: "Quand commencent les événements Origins TCG en boutique ?",
        a: "D'après le post, les événements en présentiel commencent officiellement début 2027, mais les boutiques peuvent rejoindre le programme avant : le Set 1 arrive sur Kickstarter le 27 octobre 2026 et Koin Games dit travailler avec les boutiques locales sur le lancement.",
      },
      {
        q: "Comment une boutique de jeux peut-elle rejoindre le programme d'Origins TCG ?",
        a: "En contactant directement Koin Games : Tim Jooste écrit que ses messages privés sur X sont ouverts et propose un appel, et le compte officiel demande aux gérants de boutique et aux créateurs de lui envoyer un message privé pour participer à l'AMA sur le programme, le lundi 12 octobre 2026 à 21:00 UTC. En deux mois, selon le fondateur, plus de 30 boutiques s'étaient déjà manifestées. Il existe aussi une version du programme pour les streamers et les créateurs de contenu.",
      },
      {
        q: "Combien coûte l'adhésion d'une boutique au programme d'Origins TCG ?",
        a: "Rien, d'après le compte officiel d'Origins (8 octobre 2026) : les cartes, les boosters, les boîtes et les cases sont des objets de l'inventaire Steam, donc les boutiques n'achètent pas de marchandise, ne gardent pas de stock et n'expédient pas de commandes. Elles prennent les précommandes et reçoivent une part des revenus, dont le montant n'a pas été publié, et accueillent en échange des événements de jeu organisé.",
      },
    ],
  },
  "crimson-cup-prizepool-qualifiers": {
    title: "Crimson Cup : la cagnotte dévoilée, deux qualifications de plus et sept lieux hors du tournoi",
    metaTitle: "Crimson Cup d'Origins TCG : cagnotte et qualifications",
    description:
      "Cagnotte de la Crimson Cup d'Origins TCG : carte promo Dracula 1/1 et 1 500 dollars au vainqueur, boosters jusqu'au top 256, deux qualifications de plus.",
    summary:
      "Le 5 octobre, Koin Games a publié la répartition des lots de la Crimson Cup : le vainqueur remporte une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars en espèces, et tous les joueurs du top 256 reçoivent au moins deux boosters. Le post ajoute aussi deux qualifications, AMER le 19 octobre à 19:00 EST et EMEA le 22 octobre à 19:00 CEST, retire du pool du tournoi sept lieux trop dépendants du hasard et annonce des tournois d'entraînement hebdomadaires.",
    highlights: [
      { label: "La cagnotte", text: "carte promo Dracula 1/1, deux cases et 1 500 dollars au vainqueur ; des boosters jusqu'au top 256", anchor: "prix" },
      { label: "Deux qualifications de plus", text: "AMER le 19 octobre à 19:00 EST et EMEA le 22 octobre à 19:00 CEST, 32 qualifiés dans chacune", anchor: "qualifications" },
      { label: "Ce qui change dans le calendrier", text: "AMER du 21 à 21:00 EST avec 32 qualifiés, 96 wild cards", anchor: "calendrier" },
      { label: "Sept lieux exclus", text: "Junkyard, Cloning Lab, Reflecting Pool et quatre autres, déjà retirés des parties en salon", anchor: "lieux" },
      { label: "Tournois d'entraînement", text: "chaque semaine, rien en jeu, le prochain cette semaine", anchor: "entrainement" },
    ],
    body: `## La cagnotte {#prix}

La cagnotte, selon les mots de l'équipe, « se compose d'une répartition entre prix en argent, objets de collection et cartes promo exclusives ». Tous les joueurs qui atteignent le top 256 ont droit à la première série de lots ; les cartes promo commencent au top 32. Le visuel des récompenses joint au post donne la répartition :

| Place | Carte promo | Produit | Argent |
|---|---|---|---|
| Vainqueur | carte promo Dracula 1/1 | 2 cases de boîtes de boosters | 1 500 dollars |
| 2e | carte promo Dracula 1/8 | 1 case de boîtes de boosters | 750 dollars |
| 3e et 4e | carte promo Dracula 1/8 | 2 boîtes de boosters | 350 dollars |
| Top 8 | carte promo Dracula 1/8 | 1 boîte de boosters | 125 dollars |
| Top 16 | carte Finalist Plus | 1 boîte de boosters | – |
| Top 32 | carte Finalist | 10 boosters | – |
| Top 64 | – | 8 boosters | – |
| Top 128 | – | 4 boosters | – |
| Top 256 | – | 2 boosters | – |

La carte promo du visuel est un Dracula doré portant la mention « Tournament Winner », Myths & Legends #209, présenté dans un boîtier de gradation. La ligne de l'annonce de septembre sur « des lots d'une valeur de 10 000 dollars » figure toujours sur le nouveau visuel du calendrier. Les playoffs ont 256 places : d'après les chiffres de Koin, quiconque passe une qualification ou entre avec une wild card repart déjà avec au moins deux boosters.

## Deux qualifications de plus {#qualifications}

« À la demande générale », Koin ajoute deux qualifications pendant le Steam Next Fest, une pour les fuseaux horaires des Amériques et une pour ceux de l'EMEA :

1. **AMER, lundi 19 octobre à 19:00 EST.**
2. **EMEA, jeudi 22 octobre à 19:00 CEST**, qui clôt les qualifications.

Chacune envoie 32 joueurs en playoffs, comme les trois autres. La demande de l'équipe est la même qu'en septembre : ne vous inscrivez qu'aux tournois auxquels vous pourrez vraiment participer, et laissez les places aux autres joueurs. Les inscriptions se font sur le [Discord officiel](https://discord.gg/originstcg). Le check-in fonctionne comme avant : il ouvre deux heures avant chaque qualification et ferme cinq minutes avant le début, en même temps que la remise des decks ([les règles](/fr/news/crimson-cup-format-check-in#check-in)).

## Ce qui change dans le calendrier {#calendrier}

Le post ne parle que des deux nouvelles qualifications, mais le visuel du calendrier qui l'accompagne change aussi d'autres chiffres. Les cinq qualifications, 512 places chacune et 32 qualifiés dans chacune :

- AMER, 19 octobre à 19:00 EST (nouvelle) ;
- EMEA, 20 octobre à 19:00 CEST ;
- AMER, 21 octobre à 21:00 EST : le visuel de septembre disait 19:00 EST et 64 qualifiés, désormais barrés ;
- APAC, 22 octobre à 19:00 SGT ;
- EMEA, 22 octobre à 19:00 CEST (nouvelle).

Les wild cards passent de 128 à 96 : cinq fois 32 plus 96 font 256, le nombre de places des playoffs. Playoffs et finales ne bougent pas : playoffs le 24 octobre à 10:00 EST (16:00 CEST, 22:00 SGT), quatre joueurs qualifiés pour les finales du 25 octobre à 10:00 EST. Le tournoi commence désormais le 19 octobre, premier jour du Steam Next Fest, au lieu du 20. Les dates et les horaires, comme toujours sur ce site, sont ceux du visuel officiel, sans conversion de notre part.

## Sept lieux hors du tournoi {#lieux}

« Il y a quelques lieux dans Origins qui dépendent très fortement du hasard », dit le post, et sept sont donc désactivés pour le tournoi : [Junkyard](/fr/locations#junkyard), [Cloning Lab](/fr/locations#cloning-lab), [Reflecting Pool](/fr/locations#reflecting-pool), [Amplifying Amphitheatre](/fr/locations#amplifying-amphitheatre), [Giant's Beacon](/fr/locations#giants-beacon), [The Colosseum](/fr/locations#the-colosseum) et [Nostradamus' Call](/fr/locations#nostradamus-call). Ce que fait chacun d'eux est sur notre page des [Lieux](/fr/locations).

Ce pool du tournoi est déjà actif dans la démo dans les parties en salon (Create/Join Room Battle) : c'est là que l'on s'entraîne avec les lieux de la Crimson Cup. Le pool avait été introduit par la [mise à jour du playtest du 1er octobre](/fr/news/playtest-patch-notes-1001#pool-tournois), qui ne disait pas encore quels lieux étaient exclus.

## Tournois d'entraînement {#entrainement}

Comme la plupart des parties de la démo se jouent contre des bots, Koin organise des tournois d'entraînement hebdomadaires : rien en jeu, juste un endroit où jouer contre de vraies personnes et tester vos decks. Le prochain a lieu cette semaine ; le jour et l'heure seront annoncés bientôt, et l'inscription se fait sur le même [Discord](https://discord.gg/originstcg). Si vous voulez organiser le vôtre avec les règles de la Crimson Cup, l'[organisateur de tournois](/fr/tournaments) d'OriginsMeta prend en charge le check-in, les listes cachées et les matchs au meilleur des trois manches.

## Ce que cela change pour les joueurs {#pour-les-joueurs}

- **Plus de places et plus de créneaux.** Cinq qualifications au lieu de trois, deux à des horaires européens et deux à des horaires américains : choisissez celle que vous jouerez vraiment.
- **Tout le monde en playoffs repart avec quelque chose.** Deux boosters à partir du top 256, une carte Finalist à partir du top 32, de l'argent à partir du top 8.
- **Construisez vos decks sans penser aux sept lieux.** Les copies de Cloning Lab et de Reflecting Pool ne seront pas là à la Crimson Cup. Notre [guide du Conquest](/fr/guides/origins-tcg-conquest) et le [deck builder](/fr/deck-builder) vous aident pour les trois decks.

## Ce que nous ne savons pas encore {#inconnues}

- Le jour et l'heure du tournoi d'entraînement de cette semaine.
- Si la ligne Top 8 du visuel des lots désigne les places 5 à 8, avec un lot chacune : c'est ainsi que nous la lisons.
- Pourquoi la qualification AMER du 21 octobre est à 21:00 EST sur le nouveau visuel et à 19:00 EST sur celui de septembre : le post ne le dit pas.
- Comment sont comptées les cartes uniques entre deux decks, question ouverte depuis les [règles du 24 septembre](/fr/news/crimson-cup-format-check-in#format).

## D'où vient l'information {#sources}

- Le [post officiel sur Steam](https://store.steampowered.com/news/app/4429430/view/1845383656394214) du 5 octobre 2026, « Prizepool announcement & key update to our biggest tournament ever », avec ses deux visuels : les récompenses et le calendrier mis à jour.
- L'[annonce du 9 septembre](/fr/news/biggest-tournament-ever) et les [règles du 24 septembre](/fr/news/crimson-cup-format-check-in), pour les chiffres qui ont changé.`,
    faq: [
      {
        q: "Que remporte le vainqueur de la Crimson Cup ?",
        a: "Une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars en espèces, d'après le visuel des récompenses publié par Koin Games le 5 octobre 2026. Le deuxième reçoit une carte promo Dracula 1/8, une case et 750 dollars ; les troisième et quatrième une carte promo 1/8, deux boîtes de boosters et 350 dollars.",
      },
      {
        q: "Quand ont lieu désormais les qualifications de la Crimson Cup ?",
        a: "Cinq qualifications de 512 places chacune : AMER le 19 octobre à 19:00 EST, EMEA le 20 octobre à 19:00 CEST, AMER le 21 octobre à 21:00 EST, APAC le 22 octobre à 19:00 SGT et EMEA le 22 octobre à 19:00 CEST. 32 joueurs se qualifient dans chacune, plus 96 wild cards, pour les playoffs du 24 octobre.",
      },
      {
        q: "Quels lieux sont exclus de la Crimson Cup ?",
        a: "Sept : Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum et Nostradamus' Call, désactivés parce qu'ils dépendent trop du hasard. Les parties en salon de la démo utilisent déjà le pool du tournoi.",
      },
    ],
  },
};
