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

## Testi di gioco: glossario PROVVISORIO (20/10/2026)

Il gioco è tradotto in tedesco (pagina Steam, patch 0.7), ma i testi tedeschi **non sono ancora stati letti nel
gioco**: Pierluigi aprirà la demo e lo dirà. Fino ad allora i testi delle carte, delle carte create e dei luoghi sono
una **traduzione nostra** con il glossario qui sotto, e le schede lo dicono ("non verificato nel gioco": `de` NON è in
`officialTextLocales`). Quando si legge il gioco: trascrizione in `docs/testi-ufficiali/de.tsv`,
`node scripts/official-texts.mjs de --apply`, `de` in `officialTextLocales`, e si allineano glossario, pastiglie,
`GAME_KEYWORDS`, luoghi, guide, news e storico (come il francese l'08/10).

| inglese | tedesco (provvisorio) |
|---|---|
| On Reveal: | Beim Aufdecken: |
| On Death: | Beim Tod: |
| On Kill: | Beim Töten: |
| Shield | Schild |
| Trample | Trampeln |
| Deathtouch | Todesberührung |
| Defender | Verteidiger |
| Rebirth | Wiedergeburt |
| First Strike | Erstschlag |
| Double Attack | Doppelangriff |
| Snipe 2 | Präzisionsschuss 2 |
| Move (parola chiave) | Bewegen |
| Move an ally / I move | Bewege einen Verbündeten / ich bewege mich |
| Stun ANY character | Betäube einen BELIEBIGEN Charakter |
| space | Feld ("ein zufälliges Feld") |
| location | Ort |
| barrier / opponent's barrier | Barriere / gegnerische Barriere |
| graveyard, board, hand | Friedhof, Spielfeld, Hand |
| ANY, ALL | einen / einem BELIEBIGEN (Charakter…), ALLE — mai "JEDEN", che in tedesco vuol dire "ogni" |
| deal 3 damage | Füge 3 Schaden zu |
| heal 3 damage | Heile 3 Schaden |
| draw, discard, summon, destroy | ziehe, wirf ab, beschwöre, zerstöre |
| random | zufällig |
| this round / next round | in dieser Runde / in der nächsten Runde |
| Power, Health | Stärke, Leben |
| Legendary | Legendär (die Legendäre / Legendäre Karte) |
| unit, spell | Charakter (Einheit), Zauber |
| Good / Evil character (nel testo) | ein guter Charakter / deine bösen Charaktere |

Stile dei testi delle carte (provvisorio): imperativo alla seconda singolare ("Ziehe eine Karte", "Füge 3 Schaden
zu"), il personaggio parla in prima persona ("Wenn ich abgeworfen werde"); parola chiave con la maiuscola.

## Glossario editoriale (EN → DE)

| inglese | tedesco |
|---|---|
| deck, decklist | Deck (das), Decklist |
| card, base card, created card | Karte, Basiskarte, erschaffene Karte |
| tier list, meta | Tier-List, Meta |
| patch, patch notes | Patch (der), Patchnotes |
| ranked | Ranglisten-Modus / Ranked |
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
