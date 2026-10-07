# Francese: regole per scrivere e tradurre (dal 07/10/2026)

Dal 7 ottobre 2026 OriginsMeta è in quattro lingue: inglese (riferimento), italiano, spagnolo e francese. Ogni
contenuto nuovo (news, guide, carte, luoghi, eventi, testi dell'interfaccia) si scrive nelle quattro lingue nella stessa
sessione, con la stessa cura SEO. Questo file raccoglie le scelte fatte per il francese, perché restino uguali da una
sessione all'altra. Il francese era già stato pubblicato nel primo sito (settembre 2026) e ritirato il 15/09/2026: i
pochi testi rimasti nei dati (storico dei bilanciamenti, saghe, eventi) sono stati riletti con queste regole.

## Varietà e tono

- **Francese standard**, leggibile in Francia, Belgio, Svizzera, Québec e Africa francofona: niente regionalismi
  ("courriel" no, "e-mail"/"mail" sì; "chandail" no), niente anglicismi evitabili fuori dal gergo del gioco.
- Si dà del **vous** al lettore, come fanno i siti e i giochi di carte in francese (MTG, Hearthstone, Marvel Snap).
  Mai "tu" nell'interfaccia e nei testi editoriali. Nei testi delle carte si usa l'imperativo alla seconda plurale
  ("Infligez 3 dégâts", "Piochez une carte") finché il gioco in francese non si legge: vedi "Testi di gioco".
- Stessa voce dell'inglese e dell'italiano: diretta, concreta, frasi brevi, niente enfasi. OriginsMeta parla al "nous".
- Titoli e intestazioni con la sola iniziale maiuscola ("Les 11 Légendaires d'Origins TCG").
- **Tipografia francese**: spazio insecabile (U+00A0) prima di `:` `;` `?` `!` e dentro le virgolette « … »;
  apostrofo dritto `'` come negli altri file del sito; puntini di sospensione `…`. Nelle chiavi dei dizionari che
  finiscono con "…" ("Rechercher une carte…") niente spazio prima dei puntini.
- Numeri: migliaia con lo spazio insecabile ("10 000"), decimali con la virgola ("3,5"), percentuali "98 %" (spazio
  insecabile). Date "25 septembre 2026" (mesi minuscoli, niente "de"), anche nelle description: mai "le 9/9"; orari
  "19:00 CEST" come nelle altre lingue. Importi in dollari con la parola: "10 000 dollars".
- Maiuscole: "Origins TCG", "Koin Games", "Steam", "Discord" come i marchi; i nomi dei giorni e dei mesi minuscoli.

## Cosa non si traduce

- **Nomi delle carte, dei luoghi, dei mazzi della community, di prodotti ed eventi**: Merlin, Queen of Hearts,
  Van Helsing's Tools, Wonderland, "Healing Healsing", Steam Next Fest, Crimson Cup, Demo 2.0, MetaShifting, Conquest.
  Il sito trasforma da solo i nomi delle carte in link: vanno scritti esattamente come nel database.
- **Gergo** che i giocatori francesi usano in inglese: deck, decklist (ma anche "liste du deck"), tier list, meta,
  midrange, combo, buff, nerf, rework, win rate, ladder, "deck move" (l'archetipo Move/Combo). "Deck builder" è il nome
  dello strumento. Le etichette di allineamento restano **Good / Evil / Neutral** come sulla carta del gioco; nel testo
  si scrive "un personnage Bon", "les personnages Maléfiques".
- Segnaposto tra graffe ({n}, {lang}, {from}…), emoji e notazioni delle statistiche ("+2⚔️/+2❤️", "[5⚔️/3❤️]").

## Testi di gioco: glossario provvisorio, da verificare nel gioco

Il gioco **è tradotto in francese** (pagina Steam: interfaccia e audio in francese), quindi vale la stessa regola di
italiano e spagnolo: carte, carte create, luoghi, guide, news e interfaccia usano i nomi francesi delle parole chiave.
Il 07/10/2026 però nessuno ha ancora letto le carte nel gioco in francese: il glossario qui sotto è **nostro e
provvisorio**, scelto sul modello degli altri giochi di carte in francese, e le schede carta lo dicono ("Traduction
d'OriginsMeta, non vérifiée dans le jeu"). **Da fare**: aprire il gioco in francese, trascrivere le 122 carte in
`docs/testi-ufficiali/fr.tsv` (procedura in `docs/testi-di-gioco.md`), `node scripts/official-texts.mjs fr --apply`,
poi allineare glossario, `keywordLabels.ts`, `GAME_KEYWORDS` di `deckTranslation.ts`, `GameCard.tsx`, guide, news e
interfaccia alle parole del gioco, e aggiungere `fr` a `officialTextLocales` in `src/lib/data/cards.ts`.

| inglese | francese (provvisorio) |
|---|---|
| On Reveal: | À la révélation : |
| On Death: | À la mort : |
| On Kill: | À l'élimination : |
| Shield | Bouclier |
| Trample | Piétinement |
| Deathtouch | Contact mortel |
| Defender | Défenseur |
| Rebirth | Renaissance |
| First Strike | Initiative |
| Double Attack | Double attaque |
| Snipe 2 | Tir de précision 2 |
| Move (parola chiave) | Déplacer |
| Move an ally / I move | Déplacez un allié / je me déplace |
| I can Move each round | Je peux me Déplacer à chaque manche |
| Stun ANY character | Étourdissez N'IMPORTE QUEL personnage |
| space | emplacement ("un emplacement aléatoire", "l'emplacement central") |
| location | lieu |
| barrier / opponent's barrier | barrière / barrière de l'adversaire |
| graveyard, board | cimetière, plateau |
| a Good / Evil character (nel testo) | un personnage Bon / les personnages Maléfiques |
| ANY, ALL | N'IMPORTE QUEL / N'IMPORTE QUELLE, TOUS / TOUTES |
| Choose one: … OR … | Choisissez : … OU … |
| deal 3 damage | Infligez 3 dégâts ("1 dégât") |
| heal 3 damage from | Soignez 3 dégâts à |
| return … to its owner's hand | Renvoyez … dans la main de son propriétaire |
| permanently | de façon permanente |
| this round, each round, next round | cette manche, chaque manche, la manche suivante |
| +1 mana | +1 mana |
| Summon, Draw, Discard, Destroy | Invoquez, Piochez, Défaussez, Détruisez |
| Power, Health | Puissance, Santé |
| Ongoing | Ongoing (resta in inglese, come in italiano e spagnolo) |

Stile dei testi delle carte: il personaggio parla in prima persona al maschile ("Quand je suis défaussé"); ⚔️ e ❤️
restano come nelle altre lingue ("+2⚔️/+2❤️"); le abilità "se déclenchent" ("Quand une capacité À la révélation se
déclenche ici"); la parola chiave ha la maiuscola anche a metà frase, come nel gioco ("avec Piétinement").

Nelle tre guide introduttive (`origins-tcg-explained`, `play-the-demo`, `origins-tcg-locations`) la prima citazione di
ogni parola chiave porta il nome inglese tra parentesi: "À la révélation (On Reveal)". Quando la parola chiave sta per
"l'abilità" si scrive "sa capacité À la révélation", mai "son On Reveal".

## Glossario editoriale (EN → FR)

| inglese | francese | nota |
|---|---|---|
| deck, decklist | deck, liste du deck | "deck" è maschile; mai "paquet" |
| deck builder | Deck builder (nome dello strumento) | |
| card, base card | carte, carte de base | |
| Legendary | Légendaire (maiuscola, come "Leggendaria"); "une Légendaire" | plurale Légendaires |
| created card (token) | carte créée | IT "carta generata", ES "carta creada" |
| unit, spell | unité, sort | |
| character, ally, enemy | personnage, allié, ennemi | |
| barrier | barrière | |
| location | lieu | sezione "Lieux" |
| lane, space | ligne, emplacement | mai "case" nei testi di gioco |
| mana, cost | mana, coût | |
| Power, Health | Puissance, Santé | |
| round, turn, combat | manche, tour, combat | |
| hand, graveyard | main, cimetière | |
| draw, discard, summon, destroy, heal | piocher, défausser, invoquer, détruire, soigner | |
| deal X damage | infliger X dégâts | la carta di gioco evidenzia "X dégâts" |
| ANY / OR (maiuscolo nei testi delle carte) | N'IMPORTE QUEL / OU | |
| patch, patch notes | patch (maschile: "le patch 0.7"), notes de patch | |
| balance change, buff, nerf, rework | changement d'équilibrage, buff, nerf, rework | |
| ranked | classé ("le mode classé", "la partie classée") | |
| qualifier | qualification ("la qualification EMEA") | |
| best-of-three / five | au meilleur des trois / cinq manches (BO3, BO5) | |
| prize pool | cagnotte ("10 000 dollars de cagnotte") | |
| boss | boss | |
| pack, box | booster, boîte | |
| wishlist (Steam) | liste de souhaits | |
| In brief (riquadro "In breve") | En bref | |
| sign in (tasto dell'header) | Connexion | nel testo "se connecter" |
| sign out | Se déconnecter | |
| published by | Publié par | mai Créateur né Auteur |
| Creator (ruolo) | Creator | nome del ruolo uguale in tutte le lingue |
| Author (ruolo) | Auteur | |
| Staff, Pro, Community (ruoli) | Staff, Pro, Communauté | |
| comic (fumetto dei creator) | BD (bande dessinée) | sezione "BD" |
| follow / followers | suivre / abonnés | |
| inbox, message | messagerie, message | |
| showcase (vetrina del profilo) | vitrine | |
| achievement (traguardo) | succès | |
| most played | les plus jouées | |
| featured | à la une | |
| demo | démo | |
| free-to-compete | free-to-compete (gergo del gioco) | |
| win rate | win rate | |

Sezioni: Actus · Tier list · Guides · Cartes · Decks · Deck builder · Tournois et événements · FAQ · À propos ·
Lieux · Les plus jouées · Créez votre tier list · Rédaction · Créateurs · BD · Draft · Analytics.

## Dove sta il francese nel codice

- Interfaccia: `src/lib/dictionaries/fr.ts` (tipo `Dictionary` = struttura di `en.ts`: il compilatore segnala le chiavi mancanti).
- News: solo i testi in `src/lib/data/news-fr.ts` (`frText`, per slug: `title`, `metaTitle`, `description`, `summary`,
  `body`, `highlights`, `faq`), come le guide spagnole; `news.ts` li unisce (`getNews`, `news`) e la build fallisce se
  manca una news. Il quarto argomento di `n(en, it, es)` non esiste più.
- Guide: solo i testi in `src/lib/content/guides-fr.ts` (`frText`: `title`, `metaTitle`, `excerpt`, `faq`, `body`);
  categoria, carte, lista del mazzo, copertina, data e tempo di lettura vengono dalla versione inglese in `guides.ts`.
- Carte: `src/lib/data/card-lore-fr.ts` (`origin` e `text` per slug, uniti da `cards.ts`); saghe in `cards.ts`; storico
  in `card-history.ts` (`note.fr`). I testi francesi delle carte sono **nostri, con il glossario provvisorio**: finché
  `fr` non è in `officialTextLocales` (`cards.ts`) le schede li etichettano come traduzione non verificata e il
  JSON-LD non li dichiara.
- Luoghi (`locations.ts`), eventi (`events.ts`), autori (`authorsCore.ts`), archetipi (`decks.ts`), FAQ approvate e
  domande suggerite (`src/lib/content/faq.ts`), etichette (`src/lib/*Labels.ts`, `cardPage.ts`, `cardTitles.ts`):
  chiave `fr` accanto a `es`.
- Messaggi Discord dei tornei (`src/lib/tournament/notify.ts`): i tornei in francese hanno anche il francese, in testa
  (ordine FR, EN, IT), come lo spagnolo.
- Pastiglie delle parole chiave (`src/lib/keywordLabels.ts`) e glossario del traduttore dei mazzi (`GAME_KEYWORDS` in
  `deckTranslation.ts`): colonna `fr` con il glossario provvisorio, un test li tiene uguali.

## SEO del francese

- Stesse regole delle altre lingue: `metaTitle` con "Origins TCG" entro 60 caratteri (meglio entro 46, così ci sta
  " · OriginsMeta"), description 120–158, H1 delle news entro 110, un solo H1 per pagina.
- Link interni sempre con `/fr/…`; ancore `{#…}` tradotte in slug francesi (senza accenti né apostrofi: "en-bref",
  "ce-qui-change"), e ogni `highlights[].anchor` deve esistere nel `body` francese della stessa news.
- hreflang, sitemap e `og:locale` (`fr_FR`) si generano da soli da `locales` in `src/lib/i18n.ts`; la radice `/` manda
  a `/fr` i browser in francese (`next.config.ts`).
- Date di news e guide tradotte (una regola sola, `modifiedIn` in `src/lib/data/news.ts`): la pubblicazione resta
  quella dell'articolo originale, la modifica della versione francese non va mai prima del 07/10/2026, il giorno in
  cui è nata (`TRANSLATED_SINCE.fr` = `LOCALE_SINCE.fr`); nella firma si legge "Traduit le 7 octobre 2026". Il paragrafo
  degli aggiornamenti veri si apre con "Mise à jour du 25 septembre" (`updateMarkers` in `newsMeta.ts`).
- Parole che cercano i giocatori: "Origins TCG", "deck", "cartes", "guide", "tier list", "démo", "tournoi", "patch",
  "jeu de cartes", "meta", "Koin Games".
