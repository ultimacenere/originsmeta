# Tedesco: regole per scrivere e tradurre (dal 20/10/2026)

Dal 20 ottobre 2026 OriginsMeta è in sei lingue: inglese (riferimento), italiano, spagnolo, francese, portoghese del
Brasile e tedesco. Richiesta di Pierluigi del 20/10/2026 ("ora facciamo DE, per le carte testi provvisori finché non
apro il game e ti avviso"). Ogni contenuto nuovo si scrive nelle sei lingue nella stessa sessione, con la stessa cura
SEO. Questo file raccoglie le scelte fatte per il tedesco.

## Varietà, tono e lingua della pagina

- **Tedesco standard** (Germania, Austria, Svizzera: niente elvetismi né austriacismi; "ß" come in Germania).
- Si dà del **du** al lettore, minuscolo, come fanno le community e i siti di giochi di carte in tedesco (Hearthstone,
  Marvel Snap, MTG Arena). Frasi brevi, dirette; OriginsMeta parla al "wir".
- Indirizzo `/de`, `hreflang="de"`, `<html lang="de">`, `og:locale` `de_DE`, date con `Intl` in `de`.
- Titoli con la maiuscola solo dove la vuole la grammatica tedesca (i sostantivi), niente Title Case all'inglese.
- Tipografia: virgolette „…" nei testi editoriali; numeri "10.000", decimali "3,5", percentuali "98 %" (con lo spazio,
  come la norma DIN); date "25. September 2026"; orari "19:00 Uhr CEST" o "19:00 CEST" come nelle altre lingue.
  Importi "10.000 Dollar".

## Cosa non si traduce

- **Nomi delle carte, dei luoghi, dei mazzi, di prodotti ed eventi** in inglese, esattamente come nel database:
  Merlin, Queen of Hearts, Crimson Cup, Steam Next Fest, Demo 2.0, MetaShifting, Conquest, OriginsMeta Tracker.
- **Gergo** che i giocatori tedeschi usano in inglese: Deck (das Deck), Decklist, Tier-List, Meta, Midrange, Combo,
  Aggro, Control, Buff, Nerf, Rework, Win-Rate, Ladder, Mulligan. "Deck builder" è il nome dello strumento (nel testo
  "Deckbuilder"). Le etichette di allineamento sul sito restano **Good / Evil / Neutral**.
- Segnaposto `{n}`, `{name}`…, emoji e notazioni "+2⚔️/+2❤️", "[5⚔️/3❤️]".

## Testi di gioco: il glossario del gioco (letto il 20/10/2026)

Il gioco è tradotto in tedesco. Il sito è partito il pomeriggio del 20/10/2026 con una traduzione nostra e un glossario
provvisorio; la sera stessa abbiamo letto nel gioco in tedesco le 122 carte della collezione della Demo 2.0 (demo 0.7.1,
testi della patch 0.7, filtro "Nicht im Besitz" acceso): trascrizione in `docs/testi-ufficiali/de.tsv`, scritte in
`card-lore-de.ts` da `node scripts/official-texts.mjs de --apply`, `de` in `officialTextLocales` (`cards.ts`).
Rispetto al provvisorio cambiavano quattro parole: On Death è **Bei Tod** (non "Beim Tod"), On Kill **Bei Vernichtung**
(non "Beim Töten"), Trample **Überrennen** (non "Trampeln"), Power **Kraft** (non "Stärke"). Carte create e rimosse (la
collezione non le mostra) e i 44 luoghi restano una traduzione nostra, con questo glossario.

| inglese | tedesco (gioco) |
|---|---|
| On Reveal: | Beim Aufdecken: |
| On Death: | Bei Tod: |
| On Kill: | Bei Vernichtung: |
| Shield | Schild |
| Trample | Überrennen |
| Deathtouch | Todesberührung |
| Defender | Verteidiger |
| Rebirth | Wiedergeburt |
| First Strike | Erstschlag |
| Double Attack | Doppelangriff |
| Snipe 2 | Präzisionsschuss 2 |
| Move (parola chiave) | Bewegen ("Ich kann mich jede Runde Bewegen") |
| Move an ally / I move / After I move | Bewege einen Verbündeten / bewege ich mich / Nachdem ich mich bewege |
| Stun ANY character | Betäube EINEN BELIEBIGEN Charakter |
| ANY (corsivo maiuscolo) | EINEN / EINEM BELIEBIGEN (tutte e due le parole maiuscole); "if ANY player" = IRGENDEIN |
| ALL | ALLE / ALLEN ("Zerstöre ALLE Charaktere", "Er fügt ALLEN Gegnern …") |
| OR (nelle scelte) | ODER ("Wähle eins: … ODER …") |
| space | Feld ("auf einem zufälligen Feld", "auf einem mittleren Feld", "auf meinem vorherigen Feld") |
| location | Ort ("an einem anderen zufälligen Ort", "Verwüste diesen Ort") |
| barrier / opponent's barrier | Barriere / gegnerische Barriere ("die Barriere des Gegners") |
| graveyard, board, hand, top of your deck | Friedhof, Spielfeld, Hand, der oberste Charakter deines Decks |
| a Good / Evil character (nel testo) | einen guten Charakter / deinen guten Charakteren, deinen bösen Charakteren |
| deal 3 damage | Füge … 3 Schaden zu |
| heal 3 damage from | Heile 3 Schaden bei … |
| return … to its owner's hand | Bringe … auf die Hand seines Besitzers zurück |
| summon, draw, discard, destroy, give | Beschwöre, Ziehe, Wirf … ab, Zerstöre, Gib |
| add … to your hand | Füge deiner Hand … hinzu |
| random | zufällig |
| permanently | dauerhaft |
| this round / each round / next round / start of round | diese Runde / jede Runde / nächste Runde / zu Rundenbeginn |
| before / after combat | vor dem Kampf / nach dem Kampf ("Vor dem Kampf:" a inizio testo) |
| in front of me | gegenüber ("dem Gegner gegenüber", "dem Charakter ihm gegenüber") |
| ability happens, repeat it | Fähigkeit eintritt, wiederhole sie ("eine Beim Aufdecken-Fähigkeit") |
| +1 mana | +1 Mana |
| Ruin this location | Verwüste diesen Ort |
| Power, Health | Kraft, Leben |
| Rarity: Common, Rare, Epic, Legendary | Seltenheit: Gewöhnlich, Selten, Episch, Legendär |
| Type: unit, spell | Typ: Charakter, Zauber |
| Alignment: Good, Evil | Gesinnung: Gut, Böse |
| Ongoing | Ongoing (resta in inglese, come nelle altre lingue) |

Stile dei testi delle carte, come nel gioco: imperativo alla seconda singolare per il giocatore ("Ziehe eine Karte",
"Füge … zu", "Gib …"), il personaggio parla in prima persona ("Wenn ich abgeworfen werde", "erhalte ich +1⚔️"); ⚔️ e ❤️
restano come nelle altre lingue ("Schaden in Höhe seiner ⚔️"); la parola chiave ha la maiuscola anche a metà frase
("mit Überrennen"). Carte create col genere del gioco: "einen Merry Man", "eine Mouse", "ein Golden Goose", "ein Little
Lamb", "einen Broomstick", "einen Musketeer", "ein Not So Little Pig", "drei Pumpkins".

Altre parole dell'interfaccia del gioco (20/10/2026): Meine Decks, Deck hinzufügen, Karten, Kartenrückseiten, Nicht im
Besitz, Suchen, Marktplatz (Demnächst), Deck-Builder, Test-Packs, Missionen, Meine Liga, Mein Commander, Mein Deck, Deck
wechseln, Spielmodus: **Ranglisten** (la classificata), Crimson Cup (in tedesco il gioco la chiama così), Kickstarter
"Schau es dir an", Zurück.

Nelle guide introduttive la prima citazione di ogni parola chiave porta il nome inglese tra parentesi: "Beim Aufdecken
(On Reveal)". Quando la parola chiave sta per "l'abilità" si scrive "seine Beim Aufdecken-Fähigkeit".

## Glossario editoriale (EN → DE)

| inglese | tedesco |
|---|---|
| deck, decklist | Deck (das), Decklist |
| card, base card, created card | Karte, Basiskarte, erschaffene Karte |
| tier list, meta | Tier-List, Meta |
| patch, patch notes | Patch (der), Patchnotes |
| ranked | Ranglisten-Modus (nel gioco: Spielmodus "Ranglisten") |
| qualifier | Qualifikation |
| best-of-three | Best-of-Three (Bo3) |
| prize pool | Preisgeld |
| pack, booster box | Pack / Booster, Booster-Display |
| wishlist | Wunschliste |
| In brief | Kurz gesagt |
| sign in / sign out | Anmelden / Abmelden |
| published by | Veröffentlicht von |
| Creator, Author, Pro, Staff, Community (ruoli) | Creator, Autor, Pro, Staff, Community |
| comic | Comic (die Comics) |
| follow / followers | folgen / Follower |
| showcase | Schaufenster |
| achievement | Erfolg |
| most played | Meistgespielt |
| donate | Spenden |

Sezioni: News · Tier-List · Database (Guides, Karten, Orte, FAQ) · Analytics (Analytics, Tracker) · Decks · Deck
builder · Turniere und Events · Mercato ("Markt") · Über uns · Autoren · Creator · Comics · Draft.

## Dove sta il tedesco nel codice

Come il portoghese (vedi `docs/portoghese.md`), con la chiave `de`: dizionario `src/lib/dictionaries/de.ts`, news in
`src/lib/data/news-de.ts` (`deText`), guide in `src/lib/content/guides-de.ts` (`deText`), carte in
`src/lib/data/card-lore-de.ts` (`deLore`), storico `note.de`, chiave `de` accanto a `pt` in tutto il resto.

## SEO del tedesco

- `metaTitle` con "Origins TCG" entro 60 caratteri (meglio ≤46), description 120–158, H1 delle news entro 110.
- Link interni con `/de/…`; ancore `{#…}` in tedesco senza umlaut né ß ("kurz-gesagt", "was-sich-aendert": ä→ae,
  ö→oe, ü→ue, ß→ss), e ogni `highlights[].anchor` esiste nel `body` tedesco della stessa news.
- Paragrafo degli aggiornamenti: "Update vom 25. September" (`updateMarkers`).
- Data di modifica delle traduzioni mai prima del 20/10/2026 (`TRANSLATED_SINCE.de`); firma "Übersetzt am …".
- Parole che cercano i giocatori: "Origins TCG", "Deck", "Karten", "Guide", "Tier List", "Demo", "Turnier", "Patch",
  "Kartenspiel", "Meta", "beste Decks", "Koin Games".
