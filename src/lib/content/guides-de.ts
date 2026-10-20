import type { GuideCopy, GuideSlug } from "./guides";

/**
 * Guide in tedesco (20/10/2026, tedesco sesta lingua del sito): solo i testi, come spagnolo, francese e portoghese.
 * Categoria, carte, lista del mazzo, copertina, data e tempo di lettura vengono dalla versione inglese in guides.ts
 * (`getGuides`). Una guida nuova si scrive in tutte le lingue: il tipo pretende anche il tedesco. Regole: link interni
 * con /de/, ancore {#…} in tedesco senza umlaut né ß, nomi delle carte in inglese, "du" al lettore, parole chiave col
 * glossario PROVVISORIO di docs/tedesco.md finché il gioco non si legge in tedesco (poi si riallineano).
 */
export const deText: Record<GuideSlug, GuideCopy> = {
  "origins-tcg-legendaries": {
    title: "Die 11 Legendären von Origins TCG: Karten, Werte, Patches und Decks",
    metaTitle: "Origins TCG: alle 11 Legendären und ihre Decks",
    excerpt: "Alle 11 Legendären Karten der Demo 2.0 von Origins TCG: Kosten, Werte, Kartentext, erschaffene Karten, Patch-Änderungen und die Decks, die sie spielen.",
    faq: [
      {
        q: "Wie viele Legendäre gibt es in Origins TCG?",
        a: "Elf in der Demo 2.0, Stand 25. September 2026: Dorothy, Dracula, Mulan, Queen of Hearts, Van Helsing, Wicked Stepmother, Merlin, King Arthur, Legion of the Dead, Three Not So Little Pigs und Robin Hood. Die Datenbank von OriginsMeta führt neun weitere, die nicht in der Demo sind.",
      },
      {
        q: "Wie viele Legendäre darf ein Deck haben?",
        a: "Eine. Ein Deck besteht aus einer Legendären und zwölf Basiskarten, die du je zweimal spielst, insgesamt 25 Karten. Im Conquest bringst du mehr als ein Deck mit: Bei Big Bob's Playtest Battle brauchte jedes eine andere Legendäre; die Ankündigungen zur Crimson Cup sagen dazu nichts, und unser Deckbuilder markiert zwei Decks mit derselben.",
      },
      {
        q: "Welche Legendäre führt die meisten Decks an?",
        a: "Am 25. September 2026 Three Not So Little Pigs, an der Spitze von 4 der 20 auf OriginsMeta veröffentlichten Decks; Van Helsing führt 3 an, Wicked Stepmother keines. Das misst die Beliebtheit auf der Website, nicht die Stärke, und die aktuelle Zählung steht auf der Seite Meistgespielt der Tier-List.",
      },
      {
        q: "Gibt es einen legendären Zauber?",
        a: "Ja, einen in der Demo 2.0: Legion of the Dead, ein Zauber für 7 Mana, der dein Spielfeld mit 2/2-Zombies füllt.",
      },
    ],
    body: `
## Kurz gesagt {#kurz-gesagt}

- **Elf Legendäre** sind in der Demo 2.0, der Version von Origins TCG, die du heute spielen kannst: Sechs kosten 4 Mana, eine kostet 5, drei kosten 7 und eine kostet 8.
- Zehn sind Einheiten, eine ist ein Zauber: Legion of the Dead. Fünf sind Good, drei Evil und drei Neutral.
- Vier von ihnen erschaffen mit ihrem Text andere Karten: Dracula, Van Helsing, Legion of the Dead und Three Not So Little Pigs.
- Sieben haben sich in den Balance-Patches zwischen August und dem 21. September 2026 verändert, Dracula, Van Helsing, Legion of the Dead und Robin Hood nicht. [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 hat keine der elf neu ausbalanciert.
- Die 20 Decks, die bis 20:00 Uhr CEST am 25. September 2026 auf OriginsMeta veröffentlicht wurden, nutzen zehn der elf: Three Not So Little Pigs führt vier an, Van Helsing drei, Wicked Stepmother keines. Zu sechs Legendären gibt es einen OriginsMeta-Guide für eines ihrer Decks.

Die Legendären unten sind nach Kosten sortiert und bei gleichen Kosten alphabetisch. Der Guide beschreibt, was jede Karte tut, nicht wie stark sie ist: Unsere [Tier-List von Origins TCG](/de/tier-list) wird sie nach den Turnierergebnissen und der Spitze der [Ranglisten-Ladder](/de/guides/origins-tcg-ranked) einordnen, ab dem Ende der Crimson Cup.

## Die 11 Legendären im Überblick {#ueberblick}

| Legendäre | Kosten | Stärke/Leben | Ausrichtung | Decks |
| --- | --- | --- | --- | --- |
| [Dorothy](/de/cards/dorothy) | 4 | 1/1 | Good | 2 |
| [Dracula](/de/cards/dracula) | 4 | 3/2 | Evil | 2 |
| [Mulan](/de/cards/mulan) | 4 | 2/4 | Good | 1 |
| [Queen of Hearts](/de/cards/queen-of-hearts) | 4 | 3/3 | Evil | 2 |
| [Van Helsing](/de/cards/van-helsing) | 4 | 3/4 | Good | 3 |
| [Wicked Stepmother](/de/cards/wicked-stepmother) | 4 | 4/6 | Evil | 0 |
| [Merlin](/de/cards/merlin) | 5 | 5/5 | Neutral | 1 |
| [King Arthur](/de/cards/king-arthur) | 7 | 7/7 | Good | 2 |
| [Legion of the Dead](/de/cards/legion-of-the-dead) | 7 | Zauber | Neutral | 2 |
| [Three Not So Little Pigs](/de/cards/three-not-so-little-pigs) | 7 | 3/3 | Neutral | 4 |
| [Robin Hood](/de/cards/robin-hood) | 8 | 4/4 | Good | 1 |

Die letzte Spalte zählt die Decks, die jede Legendäre unter den 20 anführt, die vom 15. September bis 20:00 Uhr CEST am 25. September 2026 auf OriginsMeta veröffentlicht wurden. Sie misst die Beliebtheit auf der Website, nicht Stärke oder Win-Rate; die aktuelle Zählung steht unter [Meistgespielt](/de/tier-list/most-played).

## Was die Legendäre im Deck tut {#im-deck}

- **Eine pro Deck.** Ein Deck besteht aus einer Legendären und zwölf Basiskarten, und das Spiel fügt von jeder Basiskarte eine zweite Kopie hinzu: 25 Karten im Spiel, laut dem AMA des Teams von Koin Games. Der [Deckbuilder](/de/deck-builder) prüft die Regel.
- **Dein Gegner sieht sie.** Patch 0.6.1 des geschlossenen Playtests (14. August 2026) hat während des Mulligans eine Vorschau auf die Legendäre des Gegners eingeführt, laut den [offiziellen Patchnotes](https://store.steampowered.com/news/app/4429430/view/1840944183780414).
- **Im Conquest gibt sie dem Deck seinen Namen.** Bei der Crimson Cup bringt jeder Spieler drei Decks mit, und wenn du eines der Decks deines Gegners bannst, siehst du nur seine Legendäre ([Regeln der Crimson Cup](/de/news/crimson-cup-format-check-in)). Ob sich die drei Legendären unterscheiden müssen, sagen die Ankündigungen nicht; bei Big Bob's Playtest Battle mussten sie es. Wie du drei Decks zusammenstellst, erklärt unser [Conquest-Guide](/de/guides/origins-tcg-conquest).

Die zitierten Kartentexte sind unsere Übersetzung der offiziellen englischen Texte, die wir im Spiel gelesen haben: Die deutschen Texte des Spiels haben wir noch nicht abgeglichen. Kosten und Werte wurden am 22. September 2026 Karte für Karte geprüft. Die Sagas und die Notizen zu jeder Legende stammen von OriginsMeta. Die Patches sind die in [MetaShifting](/de/metashifting) erfassten: die Playtest-Updates 0.6.1, 0.6.2 und 0.6.3 (August 2026), der Demo-Patch vom 21. September 2026 und Patch 0.7 vom 29. September 2026, der keine Legendäre neu ausbalanciert hat. Die legendäre Kraft behandeln wir hier nicht: Wir haben sie noch nicht aus dem Spiel übertragen, und jede Kartenseite zeigt sie, sobald wir es tun.

## Dorothy {#dorothy}

**4 Mana · 1/1 · Einheit · Good** · Saga: Land Oz

> Ich kann mich jede Runde bewegen.
>
> Ich habe +1⚔️/+1❤️ für jede Bewegung eines Verbündeten in dieser Partie.

- **Die Legende.** Das Mädchen aus Kansas, das in L. Frank Baums Roman von 1900 von einem Tornado nach Oz getragen wird.
- **Patches.** Demo-Patch vom 21. September 2026: Mana 5 → 4 ([Patchnotes](/de/news/demo-patch-notes-0921)).
- **Decks auf OriginsMeta, 25. September 2026.** Zwei: [Dorothy Combo](/de/decks/community/dorothy-combo-7503) und [Move/Combo](/de/decks/community/move-combo-075a).
- **Guide.** [Guide zum Dorothy-Deck: Dorothy Combo](/de/guides/dorothy-combo-guide).
- **Kartenseite.** [Dorothy, Legendäre Karte: Werte und Text](/de/cards/dorothy).

## Dracula {#dracula}

**4 Mana · 3/2 · Einheit · Evil** · Saga: Gothic Horror

> Wenn du abwirfst, bringe mich aus deinem Friedhof auf die Hand zurück.
>
> Beim Aufdecken: Beschwöre Brides of Dracula [2⚔️/2❤️] auf einem zufälligen Feld hier.

- **Die Legende.** Der transsilvanische Graf aus Bram Stokers Roman von 1897.
- **Erschaffene Karten.** [Brides of Dracula](/de/cards/brides-of-dracula), eine 2/2, die laut ihrem Text der gegnerischen Barriere an ihrem Ort 1 Schaden zufügt und +1❤️ erhält, wann immer du eine Karte abwirfst (erschaffene Karte: Ihr Text ist im Spiel nicht verifiziert).
- **Patches.** Dracula hat sich nicht verändert. Brides of Dracula ging in Patch 0.6.2 von 3 auf 2 Mana ([Patchnotes](/de/news/patch-0-6-2)).
- **Decks auf OriginsMeta, 25. September 2026.** Zwei: [Discard](/de/decks/community/discard-8bff) und [Dracula SUPER FUN](/de/decks/community/dracula-super-fun-d936).
- **Guide.** Noch keiner: [Schick uns deinen](/de/guides/submit).
- **Kartenseite.** [Dracula, Legendäre Karte: Werte und Text](/de/cards/dracula).

## Mulan {#mulan}

**4 Mana · 2/4 · Einheit · Good** · Saga: Ballade von Mulan

> Doppelangriff
>
> Wenn die Fähigkeit Beim Aufdecken eines Verbündeten ausgelöst wird, wiederhole sie.

- **Die Legende.** Die Kriegerin, die den Platz ihres Vaters in der Armee einnimmt, aus einer chinesischen Ballade des 6. Jahrhunderts.
- **Patches.** Patch 0.6.2: Werte unverändert, sie erhält Doppelangriff zusätzlich dazu, dass sie die Beim-Aufdecken-Fähigkeiten ihrer Verbündeten wiederholt ([Patchnotes](/de/news/patch-0-6-2)).
- **Decks auf OriginsMeta, 25. September 2026.** Eines: [On Reveal Mid Range](/de/decks/community/on-reveal-mid-range-772e).
- **Guide.** [Guide zum Mulan-Deck: On Reveal Mid Range](/de/guides/on-reveal-midrange-guide).
- **Kartenseite.** [Mulan, Legendäre Karte: Werte und Text](/de/cards/mulan).

## Queen of Hearts {#queen-of-hearts}

**4 Mana · 3/3 · Einheit · Evil** · Saga: Wunderland

> Erstschlag
>
> Wenn die Fähigkeit Beim Tod eines Verbündeten ausgelöst wird, wiederhole sie.

- **Die Legende.** Die jähzornige Herrscherin des Wunderlands, deren Antwort auf alles „Kopf ab!“ lautet.
- **Patches.** Patch 0.6.2: von 5 Mana 3/5 auf 4 Mana 3/3, und sie erhält Erstschlag zusätzlich dazu, dass sie die Beim-Tod-Fähigkeiten ihrer Verbündeten wiederholt ([Patchnotes](/de/news/patch-0-6-2)).
- **Decks auf OriginsMeta, 25. September 2026.** Zwei: [Qoh](/de/decks/community/qoh-f876) und [Just f\\*\\*\\*in em](/de/decks/community/just-f-in-em-bdf2).
- **Guide.** Noch keiner: [Schick uns deinen](/de/guides/submit).
- **Kartenseite.** [Queen of Hearts, Legendäre Karte: Werte und Text](/de/cards/queen-of-hearts).

## Van Helsing {#van-helsing}

**4 Mana · 3/4 · Einheit · Good** · Saga: Gothic Horror

> Füge vor dem Kampf deiner Hand Van Helsing's Tools hinzu, falls die Karte nicht schon dort ist.

- **Die Legende.** Abraham Van Helsing, der niederländische Professor, der die Jagd auf Dracula anführt.
- **Erschaffene Karten.** [Van Helsing's Tools](/de/cards/van-helsings-tools), mit denen du eine von vier erschaffenen Karten wählst und spielst: [Holy Water](/de/cards/holy-water), [Silver Bullet](/de/cards/silver-bullet), [Garlic](/de/cards/garlic) oder [Wooden Stake](/de/cards/wooden-stake) (erschaffene Karten: Ihre Texte sind im Spiel nicht verifiziert, und die Seite von Silver Bullet zeigt noch den Text von vor Patch 0.6.2; die Änderungen stehen in ihrer Balance-Historie).
- **Patches.** Van Helsing selbst hat sich nicht verändert. In Patch 0.6.2 wurden Van Helsing's Tools kostenlos (1 → 0 Mana), und die Silver Bullet, die sie erschaffen, ging von 3 Schaden auf 1 ([Patchnotes](/de/news/patch-0-6-2)); seit dem Demo-Patch vom 21. September 2026 kann Silver Bullet auch Barrieren treffen, und Wooden Stake kann Charaktere mit vollem Leben anvisieren, scheitert aber weiterhin, wenn das Ziel beim Aufdecken nicht beschädigt ist ([Patchnotes](/de/news/demo-patch-notes-0921)).
- **Decks auf OriginsMeta, 25. September 2026.** Drei: [Healing Healsing](/de/decks/community/healing-healsing-9411), [Cure Control](/de/decks/community/cure-control-b630) und [CONTROL](/de/decks/community/control-2c2b).
- **Guides.** [Guide zum Van-Helsing-Deck: Healing Healsing](/de/guides/healing-healsing-guide) und [seine Matchups](/de/guides/healing-healsing-matchups).
- **Kartenseite.** [Van Helsing, Legendäre Karte: Werte und Text](/de/cards/van-helsing).

## Wicked Stepmother {#wicked-stepmother}

**4 Mana · 4/6 · Einheit · Evil** · Saga: Märchen

> Todesberührung
>
> Beim Aufdecken: Gib deinen bösen Charakteren Todesberührung.

- **Die Legende.** Die grausame Stiefmutter der Märchen, von Aschenputtels Haushalt bis an Schneewittchens Hof.
- **Patches.** Demo-Patch vom 21. September 2026: Stärke 3 → 4 ([Patchnotes](/de/news/demo-patch-notes-0921)).
- **Decks auf OriginsMeta, 25. September 2026.** Keines der 20 bisher veröffentlichten: Bau eines im [Deckbuilder](/de/deck-builder) und veröffentliche es mit einem Guide.
- **Guide.** Noch keiner: [Schick uns deinen](/de/guides/submit).
- **Kartenseite.** [Wicked Stepmother, Legendäre Karte: Werte und Text](/de/cards/wicked-stepmother).

## Merlin {#merlin}

**5 Mana · 5/5 · Einheit · Neutral** · Saga: Artussage

> Wiederhole den ersten Zauber, den du jede Runde ausspielst.

- **Die Legende.** Der Zauberer hinter Artus' Geburt und seinem Aufstieg auf den Thron, von Geoffrey of Monmouth bis Malory.
- **Patches.** Patch 0.6.3: von 3/5 auf 5/5, +2 Stärke ([Patchnotes](/de/news/patch-0-6-3)).
- **Decks auf OriginsMeta, 25. September 2026.** Eines: [Spellcast](/de/decks/community/spellcast-250f).
- **Guide.** Noch keiner: [Schick uns deinen](/de/guides/submit).
- **Kartenseite.** [Merlin, Legendäre Karte: Werte und Text](/de/cards/merlin).

## King Arthur {#king-arthur}

**7 Mana · 7/7 · Einheit · Good** · Saga: Artussage

> Schild
>
> Beim Aufdecken: Gib deinen guten Charakteren Schild.

- **Die Legende.** Der einstige und künftige König Britanniens, der das Schwert aus dem Stein zog und die Tafelrunde um sich versammelte.
- **Patches.** Patch 0.6.3: von 5/5 auf 7/7 ([Patchnotes](/de/news/patch-0-6-3)).
- **Decks auf OriginsMeta, 25. September 2026.** Zwei: [King of Value Trade](/de/decks/community/king-of-value-trade-fd14) und [Glinda Reborn](/de/decks/community/glinda-reborn-2d6d).
- **Guide.** [Guide zum King-Arthur-Deck: King of Value Trade](/de/guides/king-of-value-trade-guide).
- **Kartenseite.** [King Arthur, Legendäre Karte: Werte und Text](/de/cards/king-arthur).

## Legion of the Dead {#legion-of-the-dead}

**7 Mana · Zauber · Neutral** · Saga: Gothic Horror

> Fülle dein Spielfeld mit Zombies [2⚔️/2❤️].

- **Der einzige legendäre Zauber** in der Demo 2.0.
- **Die Legende.** Eine Armee auferstandener Toter, das letzte Argument des Nekromanten.
- **Erschaffene Karten.** [Zombie](/de/cards/zombie), erschaffene 2/2-Karten, so viele, wie nötig sind, um dein Spielfeld zu füllen.
- **Patches.** Keine Änderungen.
- **Decks auf OriginsMeta, 25. September 2026.** Zwei: [The Trick-or-Treat Legion](/de/decks/community/the-trick-or-treat-legion-72c4) und [FACE IS THE PLACE](/de/decks/community/face-is-the-place-b049).
- **Guide.** [Guide zum Legion-of-the-Dead-Deck](/de/guides/trick-or-treat-legion-guide).
- **Kartenseite.** [Legion of the Dead, Legendäre Karte: Werte und Text](/de/cards/legion-of-the-dead).

## Three Not So Little Pigs {#three-not-so-little-pigs}

**7 Mana · 3/3 · Einheit · Neutral** · Saga: Märchen

> Trampeln
>
> Beim Aufdecken: Beschwöre an jedem anderen Ort ein Not So Little Pig [3⚔️/3❤️] mit Trampeln auf einem zufälligen Feld.

- **Die Legende.** Die drei Schweinchen aus Stroh, Holz und Ziegeln, erwachsen geworden und nicht mehr so leicht umzupusten.
- **Erschaffene Karten.** [Not So Little Pig](/de/cards/not-so-little-pig), eine 3/3 mit Trampeln, je eine an den beiden anderen Orten.
- **Patches.** Patch 0.6.2: von 4/4 auf 3/3, und die beschworenen Schweine wurden passend dazu ebenfalls 3/3 ([Patchnotes](/de/news/patch-0-6-2)).
- **Decks auf OriginsMeta, 25. September 2026.** Vier: [3 Pigs Mid Range](/de/decks/community/3-pigs-mid-range-6311), [Value Board](/de/decks/community/value-board-c44a), [VALUE MAXXING](/de/decks/community/value-maxxing-739d) und [AGGRO /MIDRANGE PIGS GM](/de/decks/community/aggro-midrange-pigs-gm-6931).
- **Guides.** [Guide zum Three-Not-So-Little-Pigs-Deck](/de/guides/three-pigs-midrange-guide) und [seine Matchups](/de/guides/three-pigs-midrange-matchups).
- **Kartenseite.** [Three Not So Little Pigs, Legendäre Karte: Werte und Text](/de/cards/three-not-so-little-pigs).

## Robin Hood {#robin-hood}

**8 Mana · 4/4 · Einheit · Good** · Saga: Sherwood

> Präzisionsschuss 3
>
> Beim Aufdecken: Füge allen Feinden 2 Schaden zu.

- **Die einzige Legendäre für 8 Mana** in der Demo 2.0.
- **Die Legende.** Der geächtete Bogenschütze aus dem Sherwood Forest, der die Reichen bestiehlt, um die Armen zu ernähren, besungen in Balladen seit dem 14. Jahrhundert.
- **Patches.** Keine Änderungen.
- **Decks auf OriginsMeta, 25. September 2026.** Eines: [Buff](/de/decks/community/buff-6f60).
- **Guide.** Noch keiner: [Schick uns deinen](/de/guides/submit).
- **Kartenseite.** [Robin Hood, Legendäre Karte: Werte und Text](/de/cards/robin-hood).

## Die Legendären, die nicht in der Demo 2.0 sind {#nicht-in-der-demo}

Unsere Datenbank führt außerdem neun Legendäre, die nicht in der Demo 2.0 sind: [Alice](/de/cards/alice), [Beowulf](/de/cards/beowulf), [Cinderella](/de/cards/cinderella), [Death](/de/cards/death), [Dr. Frank](/de/cards/dr-frank), [Mirror Mirror](/de/cards/mirror-mirror), [Red](/de/cards/red), [Winnie-the-Pooh](/de/cards/winnie-the-pooh) und [Wizard of Oz](/de/cards/wizard-of-oz). Ihre Seiten zeigen die letzten bekannten Daten, die im Spiel nicht verifiziert sind. In seinen AMAs hat das Team einen vollständigen Launch mit dem kompletten Aufgebot an Legendären Karten beschrieben: Die Termine, die wir kennen, stehen in der [Roadmap](/de/guides/roadmap-and-dates).

## Woher die Zahlen kommen {#quellen}

- **Karten:** die [Kartendatenbank](/de/cards) von OriginsMeta: Kosten, Werte und englische Texte der Demo-Karten am 22. September 2026 einzeln im Spiel geprüft, italienische und spanische Texte am 25. September 2026 im Spiel gelesen. Die deutschen Kartentexte sind vorerst unsere Übersetzung.
- **Patches:** die offiziellen Patchnotes auf Steam, Karte für Karte in [MetaShifting](/de/metashifting).
- **Decks:** die 20 Decks, die vom 15. September bis 20:00 Uhr CEST am 25. September 2026 auf OriginsMeta veröffentlicht wurden ([alle Decks von Origins TCG](/de/decks)); die Zählung danach steht unter [Meistgespielt](/de/tier-list/most-played).

Wir aktualisieren diesen Guide, sobald ein Patch eine Legendäre verändert oder die Demo eine neue hinzufügt.
`,
  },
  "origins-tcg-ranked": {
    title: "Ranked in Origins TCG: was wir vor dem Steam Next Fest über die Ladder wissen",
    metaTitle: "Origins TCG Ranked: Starttermin, Grandmaster, VP",
    excerpt: "Der Ranglisten-Modus startet in der Demo von Origins TCG mit dem Steam Next Fest am 19. Oktober 2026. Bestätigt sind Divisionen, Grandmaster, VP, Belohnungen.",
    faq: [
      {
        q: "Um wie viel Uhr startet Ranked am 19. Oktober?",
        a: "Der Steam-Post von Koin Games vom 21. September 2026 sagt nur „mit dem Start des Steam Next Fest“, ohne Uhrzeit. Das Festival beginnt am Montag, 19. Oktober 2026, um 10:00 Uhr pazifischer Zeit: um 13:00 Uhr an der US-Ostküste, um 18:00 Uhr in Großbritannien und um 19:00 Uhr in Mitteleuropa.",
      },
      {
        q: "Was ist der höchste Rang in Origins TCG?",
        a: "Grandmaster, die oberste Division der Ladder im geschlossenen Playtest, mit einer weltweiten Ranglisten-Bestenliste (offizielle Patchnotes 0.6.1 und 0.6.3, August 2026).",
      },
      {
        q: "Welche Belohnungen gibt es im Ranked?",
        a: "Koin Games hat nur gesagt, dass Ranked in der Demo mit exklusiven Ranglisten-Belohnungen kommt; am 25. September 2026 waren die Details noch nicht angekündigt.",
      },
      {
        q: "Kann ich Ranked vor dem Steam Next Fest spielen?",
        a: "Nur im geschlossenen Playtest, wo Ranked seit Patch 0.6.1 vom 14. August 2026 aktiv ist; die Anleitung für den Zugang zum Playtest findest du auf dem offiziellen Discord.",
      },
    ],
    body: `
## Kurz gesagt {#kurz-gesagt}

- Der Ranglisten-Modus wird in der kostenlosen Demo **mit dem Start des Steam Next Fest** eingeschaltet, am Montag, 19. Oktober 2026, „mit exklusiven Ranglisten-Belohnungen“ (Steam-Post von Koin Games vom 21. September 2026).
- Neu ist er nicht: Der geschlossene Playtest hat seit Patch 0.6.1 vom 14. August 2026 eine Ranglisten-Ladder, und am 24. September war sie dort noch aktiv.
- Was die offiziellen Patchnotes bestätigen: Divisionen, eine oberste Division namens **Grandmaster** mit weltweiter Bestenliste und **Victory Points** (VP), die du in Ranglisten-Partien gewinnst und verlierst: Die Notes sprechen von einer Änderung um +10 und −10, und seit Patch 0.6.2 bringen Raum-Partien keine VP mehr.
- Was Koin noch nicht gesagt hat: die vollständige Liste der Divisionen, ob die +10/−10 VP des Playtests in jeder Division und in der Demo gleich bleiben, Seasons und Resets, und was die Belohnungen sind.

Wir aktualisieren diesen Guide, sobald Ranked in der Demo startet.

## Wann Ranked startet {#wann}

Am 21. September 2026 schrieb Koin Games im Post zum [ersten großen Update der Demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611), man werde „den Ranglisten-Modus mit dem Start des Steam Next Fest einschalten, mit exklusiven Ranglisten-Belohnungen“. Das [Steam Next Fest](https://store.steampowered.com/sale/nextfest) läuft von Montag, 19. Oktober 2026, 10:00 Uhr pazifischer Zeit (13:00 Uhr Ostküste, 18:00 Uhr Großbritannien, 19:00 Uhr Mitteleuropa) bis Montag, 26. Oktober. Eine genaue Uhrzeit für Ranked nennt der Post nicht: „mit dem Start“ des Festivals ist alles, was er sagt.

Am 24. September wiederholte es die Ankündigung der Crimson Cup auf dem offiziellen Discord: Die Demo, die die Kartenliste des Turniers hat, schaltet Ranked zum Steam Next Fest ein, mit neuen Ranglisten-Belohnungen ([unser Artikel](/de/news/crimson-cup-format-check-in#demo-playtest)). Alles andere zum Festival steht in unserem [Guide zum Steam Next Fest](/de/guides/steam-next-fest-2026).

## Was uns die Ladder des Playtests verrät {#playtest-ladder}

Ranked läuft im geschlossenen Playtest seit Mitte August, und drei offizielle Patchnotes beschreiben es:

- **Patch 0.6.1, 14. August 2026.** Die Ranglisten-Ladder ist das Hauptthema des Updates, und „die Grandmaster-Division hat eine weltweite Ranglisten-Bestenliste“ ([Patchnotes](https://store.steampowered.com/news/app/4429430/view/1840944183780414)). Ein bekannter Bug dieser Version: Die Anzeige der VP (Victory Points) war fehlerhaft, sobald ein Spieler Grandmaster erreicht hatte.
- **Patch 0.6.2, 21. August 2026.** Die Grandmaster League zeigt jetzt für jeden Spieler den richtigen Rang, die VP und die Division, und Raum-Partien bringen keine VP mehr. Zwei bekannte Bugs dieser Version: VP wurden korrekt gewonnen und verloren, aber die +10 und −10, die bei der Änderung der Summe angezeigt werden, waren vorübergehend verschwunden, und am Ende einer Grandmaster-Partie wurde die VP-Änderung nicht angezeigt, obwohl sich die Punkte änderten ([Patchnotes](https://store.steampowered.com/news/app/4429430/view/1841579228669961)).
- **Patch 0.6.3, 27. August 2026.** In der obersten Division zeigte der Ergebnisbildschirm Platzhalterwerte statt der eigenen Werte des Spielers; jetzt werden Division, VP-Summe und VP-Änderung korrekt angezeigt, die +10 und −10 liegen nicht mehr über der VP-Summe, während sie sich ändert, und Ergebnis, Victory Points und Rang sollten am Ende einer Partie immer erscheinen ([Patchnotes](https://store.steampowered.com/news/app/4429430/view/1842212951301184)).

Zusammengefasst: Die Ladder besteht aus Divisionen, **Grandmaster ist die oberste** (Patch 0.6.3 nennt sie „die oberste Division“) und hat eine weltweite Bestenliste mit einem Rang für jeden Spieler, und Ranglisten-Partien verändern deine Victory Points, laut den Notes des Playtests um +10 oder −10 (Raum-Partien seit 0.6.2 nicht mehr). Die Notes nennen „Diamond IV“ nur als einen der Platzhalterwerte, die versehentlich angezeigt wurden: Die Divisionen unterhalb von Grandmaster listen sie nicht auf. Unsere Zusammenfassung des ersten Ranked-Patches steht unter [Patch 0.6.1: Ranglisten-Ladder und Grandmaster](/de/news/patch-0-6-1-ranked).

## Ranked und freigeschaltete Decks {#freischaltungen}

Im geschlossenen Playtest wurde ein Deck laut Spielern im Steam-Forum am 14. September 2026 nach drei Ranglisten-Siegen und einem Sieg gegen einen KI-Boss freigeschaltet; ein Entwickler antwortete, das Team überlege, diese Freischalt-Partien nur noch gegen die KI auszutragen ([unser Artikel](/de/news/playtest-feedback-deck-unlock)). Mit dem Demo-Update vom 21. September bestätigte Koin, dass alle den Fortschritt aus der Demo oder aus dem Playtest behalten, je nachdem, welcher weiter ist ([unser Artikel](/de/news/demo-first-big-update#fortschritt)).

## Wo du vor dem Festival spielen kannst {#vor-dem-festival}

- **Die Demo** ist kostenlos auf [Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) und hat die Kartenliste der Crimson Cup; Ranked kommt dort mit dem Festival.
- **Der geschlossene Playtest** hat Ranked schon. Der Steam-Post von Koin vom 25. August 2026 verweist für die Zugangsanleitung auf den [offiziellen Discord](https://discord.gg/originstcg), und am 24. September sagte das Team, dass der Playtest Updates bekommt, die die Turnierversion nicht haben wird.
- Zum Vorbereiten von Decks: der [Deckbuilder](/de/deck-builder) und [alle Decks von Origins TCG](/de/decks), die die Community veröffentlicht hat, jedes mit dem Spielcode (KGBLDC…) zum Einfügen in Origins. Die [11 Legendären](/de/guides/origins-tcg-legendaries), die sie anführen, beschreibt unser Guide eine nach der anderen.
- Wenn du dich auf die Crimson Cup vorbereitest, die mit drei Decks im Conquest gespielt wird: [So baust du die drei Decks](/de/guides/origins-tcg-conquest).

## Was OriginsMeta mit Ranked vorhat {#originsmeta}

Unser Plan, Stand 25. September 2026: die erste [Tier-List](/de/tier-list) von OriginsMeta nach den Finals der Crimson Cup am 25. Oktober, aufgebaut auf den Turnierergebnissen und der Spitze der Ranglisten-Ladder. Bis dahin zeigt die Seite der Tier-List die bestbewerteten Decks der Community und die meistgespielten Karten, als Vorschau gekennzeichnet.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Was die „exklusiven Ranglisten-Belohnungen“ sind und wie du sie verdienst.
- Wie viele Divisionen es gibt und wie sie unterhalb von Grandmaster heißen.
- Ob ein Sieg und eine Niederlage immer +10 und −10 VP wert sind, wie in den Notes des Playtests, in jeder Division und in der Demo.
- Ob Ranked Seasons oder Resets hat und ob es in der Demo aktiv bleibt, wenn das Festival am 26. Oktober endet.
- Ob der Fortschritt im Ranked ins fertige Spiel übernommen wird.

## Quellen {#quellen}

Die offiziellen Posts von Koin Games auf Steam: [Patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414) (14. August 2026), [Patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) (21. August), [Patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) (27. August), [Big Bob's Playtest Battle](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (25. August) und das [erste große Update der Demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611) (21. September); dazu die Ankündigung der Crimson Cup auf dem offiziellen Discord (24. September). Alle am 25. September 2026 gelesen.
`,
  },
  "origins-tcg-conquest": {
    title: "Conquest in Origins TCG: drei Decks bauen, die die Regel der einzigartigen Karten erfüllen",
    metaTitle: "Conquest in Origins TCG: deine drei Decks bauen",
    excerpt: "So stellst du ein Conquest-Line-up für Origins TCG zusammen: wie einzigartige Karten gezählt werden, die Prüfung im Deckbuilder und echte Decks der Community.",
    faq: [
      {
        q: "Wie zähle ich die Karten, die zwei Conquest-Decks gemeinsam haben?",
        a: "Nimm die 13 verschiedenen Karten jedes Decks, die Legendäre und die zwölf Basiskarten, jede einmal gezählt, egal wie viele Kopien: Die einzigartigen Karten zwischen den beiden Decks sind 13 minus die Karten, die sie teilen. Bei mindestens 8 einzigartigen Karten dürfen zwei Decks höchstens 5 teilen. Das ist die Lesart von OriginsMeta, weil Koin Games nicht genau erklärt hat, wie gezählt wird; die Regel selbst steht in unserem Artikel zu den Regeln der Crimson Cup.",
      },
      {
        q: "Dürfen zwei meiner Conquest-Decks dieselbe Legendäre nutzen?",
        a: "Bei Big Bob's Playtest Battle im August nicht: Jedes Deck brauchte eine andere Legendäre. Für die Crimson Cup sagen die Ankündigungen vom 9. und 24. September 2026 nichts Ausdrückliches dazu; weil du beim Bann nur die Legendäre siehst, markiert unser Deckbuilder zwei Decks mit derselben.",
      },
      {
        q: "Zählen die zwei Kopien einer Karte als zwei Karten?",
        a: "Nicht in der Lesart von OriginsMeta: Eine Karte zählt einmal, egal wie viele Kopien, also hat jedes Deck 13 Karten zum Vergleichen, die Legendäre und die zwölf Basiskarten.",
      },
      {
        q: "Wie prüfe ich meine drei Decks?",
        a: "Im Deckbuilder von OriginsMeta, im Modus Turnier (3 Decks): Die Conquest-Prüfung zählt die einzigartigen Karten zwischen jedem Deckpaar, listet die gemeinsamen auf und markiert zwei Decks mit derselben Legendären.",
      },
    ],
    body: `
## Kurz gesagt {#kurz-gesagt}

- **Conquest** heißt: Du bringst mehr als ein Deck mit, die sich ausreichend voneinander unterscheiden, und bannst eines der Decks deines Gegners (Koin Games, 25. August 2026); bei Big Bob's Playtest Battle brauchte außerdem jedes Deck eine andere Legendäre.
- Bei der **Crimson Cup** (19.–25. Oktober 2026) bringst du drei Decks mit, mit mindestens 8 einzigartigen Karten zwischen jedem Paar. Regeln, Termine, Preise und Check-in stehen in [unserem Artikel zu den Regeln der Crimson Cup](/de/news/crimson-cup-format-check-in): In diesem Guide geht es darum, die drei Decks zu bauen.
- Koin hat nicht genau erklärt, wie einzigartige Karten gezählt werden. OriginsMeta zählt jede Karte einmal, egal wie viele Kopien, die Legendäre eingeschlossen: Zwei Decks dürfen dann höchstens 5 Karten teilen.
- Der [Deckbuilder](/de/deck-builder) prüft all das in seinem Modus „Turnier (3 Decks)“.
- Unter den 20 Decks, die bis 20:00 Uhr CEST am 25. September 2026 auf OriginsMeta veröffentlicht wurden, erfüllen 174 der 176 Paare mit verschiedenen Legendären die Regel; die beiden, die scheitern, beide mit Buff, verfehlen sie um eine Karte.

## Was Conquest verlangt {#das-format}

Koin Games hat Conquest zum ersten Mal bei [Big Bob's Playtest Battle](/de/news/big-bobs-playtest-battle) am 28. August 2026 eingesetzt. Die [Ankündigung auf Steam](https://store.steampowered.com/news/app/4429430/view/1841579228677617) vom 25. August beschreibt es so: „Du musst vor Turnierbeginn mehrere Decks einreichen, die sich voneinander unterscheiden müssen, und du bekommst die Chance, ein Deck deines Gegners zu bannen.“ Damals brauchte jedes Deck eine andere Legendäre und mindestens neun Karten Unterschied.

Für die Crimson Cup legen die Ankündigungen vom 9. und 24. September 2026 diese Regeln fest:

- **drei Decks**; ob sich die Legendären unterscheiden müssen, sagen die Ankündigungen nicht (bei Big Bob's mussten sie es, und beim Bann siehst du nur die Legendäre);
- **mindestens 8 einzigartige Karten** zwischen jedem Deckpaar;
- Decklists verborgen bis zu den Top 4: Wenn du eines der Decks deines Gegners bannst, siehst du nur seine Legendäre;
- Best-of-Three-Matches und ein Grand Final im Best-of-Five; im Best-of-Five gibt es keinen Bann, und du musst mit allen drei Decks gewinnen.

Das Turnier wird in der Haupt-Demo gespielt, mit ihrer Kartenliste. Am 29. September 2026 kam [Patch 0.7](/de/news/patch-0-7), den das Team den letzten Balance-Patch vor dem Turnier nennt: Bagheera, Mind Palace und Spellbook kosten jetzt eins mehr, und Twister Toss wurde überarbeitet, also lohnt es sich, ein vorher gebautes Line-up noch einmal zu prüfen.

## Wie einzigartige Karten gezählt werden {#zaehlung}

Jedes Deck hat **13 verschiedene Karten**: die Legendäre und zwölf Basiskarten, deren zweite Kopie das Spiel von selbst hinzufügt (25 Karten im Spiel). Die Ankündigung der Crimson Cup sagt nicht, wie die 8 einzigartigen Karten gezählt werden. Das ist die Lesart von OriginsMeta, die unser Deckbuilder und unsere Turniere anwenden:

1. Jede Karte zählt **einmal**, egal wie viele Kopien sie hat;
2. die **Legendäre zählt mit**: Zwei verschiedene Legendäre sind immer eine Karte Unterschied;
3. die einzigartigen Karten zwischen Deck A und Deck B sind die Karten von A, die B nicht hat: **13 minus die gemeinsamen Karten**.

„Mindestens 8 einzigartige Karten“ heißt also **höchstens 5 gemeinsame Karten** zwischen zwei beliebigen deiner Decks.

**Ein Paar genau an der Grenze.** [3 Pigs Mid Range](/de/decks/community/3-pigs-mid-range-6311) (Three Not So Little Pigs) und [On Reveal Mid Range](/de/decks/community/on-reveal-mid-range-772e) (Mulan) teilen fünf Karten: En Passant, Ali Baba, Bagheera, Frog Prince und Ellen Trechend. Im Spiel sind das zehn der 25 Karten jedes Decks, aber sie zählen als fünf: 13 − 5 = **8 einzigartige Karten**, genau das Minimum. Eine gemeinsame Karte mehr, und das Paar würde die Regel nicht mehr erfüllen.

**Ein Paar mit einer Karte zu wenig.** [Buff](/de/decks/community/buff-6f60) (Robin Hood) und [FACE IS THE PLACE](/de/decks/community/face-is-the-place-b049) (Legion of the Dead) teilen sechs Karten: Musketeer, Defense Matrix, Bagheera, Three Blind Mice, Glinda und Galahad. 13 − 6 = **7**: Um sie zusammen mitzubringen, muss eine der sechs aus einem der beiden Decks raus.

Wenn Koin anders zählt, zum Beispiel Kopie für Kopie, ändern sich die Zahlen: Wir aktualisieren diesen Guide und den Deckbuilder, sobald die Regel genau erklärt ist.

## Die drei Decks im Deckbuilder bauen {#deck-builder}

1. Öffne den [Deckbuilder](/de/deck-builder) und wechsle von „Einzeldeck“ zu **„Turnier (3 Decks)“**.
2. Deck A, B und C haben jeweils einen eigenen Tab. Bau sie aus dem Kartenpool oder füge unter **Import** einen Spielcode (KGBLDC…) ein: Der Import ändert nur das Deck, auf dem du gerade bist.
3. Auf jeder Deckseite der Community lädt **„Im Deck builder öffnen“** diese Liste in das aktive Deck und lässt die anderen beiden, wie sie sind: ein schneller Weg, Paare veröffentlichter Decks auszuprobieren.
4. Das Feld **„Conquest-Prüfung“** zeigt für jedes Paar, wie viele einzigartige Karten sich unterscheiden: grün mit ✓ ab dem Minimum, rot mit ✗ darunter. Fährst du mit der Maus über eine Zahl, siehst du die gemeinsamen Karten. Das Minimum ist 8, der Wert der Crimson Cup, und du kannst es ändern (Big Bob's Playtest Battle verlangte 9). Die Prüfung markiert auch zwei Decks mit derselben Legendären.
5. Wenn die drei Decks legal sind und sich genug unterscheiden, zeigt das Feld **OK ✓**. Kopiere jedes Deck mit „Spielcode kopieren“ und füge es in Origins ein.

Der Deckbuilder speichert die drei Decks unterwegs in deinem Browser. [Turniere](/de/tournaments), die auf OriginsMeta erstellt werden, können ebenfalls Conquest nutzen, mit 2 bis 4 Decks pro Spieler und einem Minimum, das der Veranstalter festlegt, und der Deckbuilder jedes Turniers wendet diese Regeln an. Die Legendären, aus denen du wählen kannst, stehen alle in [unserem Guide zu den 11 Legendären](/de/guides/origins-tcg-legendaries).

Die Crimson Cup ist das Turnier des Steam Next Fest, und Ranked startet in der Demo mit demselben Festival: Alles zum Festival steht in unserem [Guide zum Steam Next Fest](/de/guides/steam-next-fest-2026), und [was zu Ranked bestätigt ist](/de/guides/origins-tcg-ranked) in einem eigenen Guide.

## Decks der Community, die die Regel erfüllen, und zwei, die es nicht tun {#community-paare}

Bis 20:00 Uhr CEST am 25. September 2026 hat OriginsMeta 20 veröffentlichte Decks, angeführt von 10 verschiedenen Legendären. Das ergibt 190 mögliche Paare:

- 14 Paare teilen die Legendäre: Der Deckbuilder markiert sie, und bei Big Bob's Playtest Battle hätten sie nicht ins selbe Line-up gedurft. Oft sind es Versionen derselben Liste, wie [Healing Healsing](/de/decks/community/healing-healsing-9411), [Cure Control](/de/decks/community/cure-control-b630) und [CONTROL](/de/decks/community/control-2c2b), drei Van-Helsing-Decks, die 12 ihrer 13 Karten teilen;
- von den anderen 176 **erfüllen 174** die 8-Karten-Regel, und 30 davon teilen überhaupt keine Karte;
- zwei scheitern, beide bei 7 und beide mit Buff: Buff und FACE IS THE PLACE, siehe oben, sowie Buff und [AGGRO /MIDRANGE PIGS GM](/de/decks/community/aggro-midrange-pigs-gm-6931) (Three Not So Little Pigs), die Bagheera, Mind Palace, Three Blind Mice, Beast, Glinda und Galahad teilen.

Einige Paare mit ihren echten Zahlen:

| Paar | Legendäre | Gemeinsame Karten | Einzigartige Karten Unterschied | 8 oder mehr? |
| --- | --- | --- | --- | --- |
| [Dracula SUPER FUN](/de/decks/community/dracula-super-fun-d936) + [Qoh](/de/decks/community/qoh-f876) | Dracula, Queen of Hearts | keine | 13 | ja |
| [3 Pigs Mid Range](/de/decks/community/3-pigs-mid-range-6311) + [Healing Healsing](/de/decks/community/healing-healsing-9411) | Three Not So Little Pigs, Van Helsing | 1: Ali Baba | 12 | ja |
| [Dorothy Combo](/de/decks/community/dorothy-combo-7503) + [On Reveal Mid Range](/de/decks/community/on-reveal-mid-range-772e) | Dorothy, Mulan | 1: En Passant | 12 | ja |
| [Spellcast](/de/decks/community/spellcast-250f) + [The Trick-or-Treat Legion](/de/decks/community/the-trick-or-treat-legion-72c4) | Merlin, Legion of the Dead | 2: Golden Egg, Impundulu | 11 | ja |
| [King of Value Trade](/de/decks/community/king-of-value-trade-fd14) + [Healing Healsing](/de/decks/community/healing-healsing-9411) | King Arthur, Van Helsing | 4: Shahrazad, Ali Baba, Boitata, Spellbook | 9 | ja |
| [Qoh](/de/decks/community/qoh-f876) + [Value Board](/de/decks/community/value-board-c44a) | Queen of Hearts, Three Not So Little Pigs | 5: Bagheera, Baby Bear, Mind Palace, Ellen Trechend, Cockatrice | 8 | ja, an der Grenze |
| [Buff](/de/decks/community/buff-6f60) + [FACE IS THE PLACE](/de/decks/community/face-is-the-place-b049) | Robin Hood, Legion of the Dead | 6 | 7 | nein |

Neun Paare liegen genau bei 8:

- [3 Pigs Mid Range](/de/decks/community/3-pigs-mid-range-6311) + [On Reveal Mid Range](/de/decks/community/on-reveal-mid-range-772e)
- [AGGRO /MIDRANGE PIGS GM](/de/decks/community/aggro-midrange-pigs-gm-6931) + [FACE IS THE PLACE](/de/decks/community/face-is-the-place-b049)
- [CONTROL](/de/decks/community/control-2c2b) + [Spellcast](/de/decks/community/spellcast-250f)
- [Cure Control](/de/decks/community/cure-control-b630) + [Glinda Reborn](/de/decks/community/glinda-reborn-2d6d)
- [Cure Control](/de/decks/community/cure-control-b630) + [Spellcast](/de/decks/community/spellcast-250f)
- [FACE IS THE PLACE](/de/decks/community/face-is-the-place-b049) + [Glinda Reborn](/de/decks/community/glinda-reborn-2d6d)
- [Healing Healsing](/de/decks/community/healing-healsing-9411) + [Spellcast](/de/decks/community/spellcast-250f)
- [Qoh](/de/decks/community/qoh-f876) + [Value Board](/de/decks/community/value-board-c44a)
- [Qoh](/de/decks/community/qoh-f876) + [VALUE MAXXING](/de/decks/community/value-maxxing-739d)

Von den 1.140 möglichen Trios veröffentlichter Decks haben 867 drei verschiedene Legendäre und erfüllen die Regel bei allen drei Paaren.

Das sind Zählungen, keine Ratschläge: Sie sagen, welche Decks nach der Regel zusammen antreten können, nicht welches Line-up gewinnt. Wie sich jedes Deck spielt, steht auf seiner Seite, im Guide seines Autors.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Wie Koin die 8 einzigartigen Karten zählt: Die Ankündigung vom 24. September sagt es nicht.
- Ob die drei Decks der Crimson Cup verschiedene Legendäre haben müssen: Die Ankündigungen sagen es nicht.
- Die endgültige Kartenliste: Die vorläufige Liste ist seit dem 21. September im Spiel. Patch 0.7 vom 29. September ist nach den Worten des Teams der letzte Balance-Patch vor dem Turnier, aber seine Notes sagen nicht, ob die Kartenliste endgültig ist.

## Quellen {#quellen}

Die Posts von Koin Games auf Steam vom [25. August](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (Big Bob's Playtest Battle), [9. September 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278) (das Turnier des Steam Next Fest) und [29. September 2026](https://store.steampowered.com/news/app/4429430/view/1844751498235283) (Patch 0.7), die Ankündigung der Crimson Cup auf dem offiziellen Discord (24. September) und die Decks, die bis 20:00 Uhr CEST am 25. September 2026 auf OriginsMeta veröffentlicht wurden, gezählt mit derselben Funktion, die der Deckbuilder verwendet.
`,
  },
  "origins-tcg-locations": {
    title: "Die Orte von Origins TCG: wie die drei Lanes jede Partie verändern",
    metaTitle: "Die Orte von Origins TCG erklärt",
    excerpt: "Orte sind der dritte Spieler am Tisch: Sie verdoppeln Schaden, ändern Kosten und bewegen deine Charaktere. Wie sie wirken und wie du mit ihnen baust.",
    faq: [
      {
        q: "Wie viele Orte gibt es in Origins TCG?",
        a: "Die Demo 2.0 rotiert 44 davon. Laut der offiziellen Steam-Seite zieht das fertige Spiel aus einem Pool von mehr als hundert Orten.",
      },
      {
        q: "Wann siehst du die Orte einer Partie?",
        a: "Einen pro Runde in den ersten drei Runden: Der erste ist von Anfang an bekannt, der zweite kommt in Runde zwei und der dritte in Runde drei. Ab Runde vier spielst du mit dem ganzen Spielfeld im Blick.",
      },
      {
        q: "Wirkt ein Ort für beide Spieler?",
        a: "Ja. Ein Ort ist eine Regel dieser Lane, kein Bonus für den, der zuerst dort ist: Amplifying Amphitheatre verdoppelt deinen Schaden und den deines Gegners.",
      },
      {
        q: "Wo finde ich die vollständige Liste?",
        a: "Auf der Seite der Orte von OriginsMeta, mit Suche, Filtern nach Art des Effekts und Links zu den Karten, die manche von ihnen beschwören.",
      },
    ],
    body: `
## Warum Orte wichtiger sind, als sie aussehen

Origins TCG wird an **drei Orten** gespielt, und jeder trägt eine Regel, die die ganze Partie über für diese Lane gilt. Es ist der Teil des Spiels, den eine Decklist nicht kontrollieren kann: Zwei Spieler können sich mit denselben fünfundzwanzig Karten hinsetzen und zwei völlig verschiedene Partien bekommen, weil auf dem einen Spielfeld der Schaden verdoppelt wird und auf dem anderen alles eins weniger kostet.

Die Demo 2.0 rotiert **44 Orte**. Laut der [offiziellen Steam-Seite](https://store.steampowered.com/app/4429430/Origins_TCG/) wird das fertige Spiel „aus einem Pool von über 100 rotierenden Orten“ ziehen, „die das Spielfeld umgestalten und eine eigene Strategie verlangen“. Die vollständige Liste mit allen Effekten steht auf der [Seite der Orte](/de/locations), durchsuchbar und filterbar; in diesem Guide geht es darum, was du mit ihnen anfängst.

## Wie sie ins Spiel kommen

Die drei Orte werden **einer pro Runde in den ersten drei Runden** aufgedeckt. Der erste liegt von Anfang an auf dem Tisch, der zweite erscheint in Runde zwei, der dritte in Runde drei. Ab Runde vier ist nichts mehr verborgen, und du spielst auf einem Spielfeld, das du vollständig siehst.

Dieser Ablauf ist der Grund, warum es in den ersten Runden nicht nur um die Manakurve geht: In Runde eins legst du Karten in eine Lane, deren zwei Nachbarn du noch nicht kennst. Einen Charakter eine Runde zurückzuhalten, um zu sehen, wo er hingehört, ist oft mehr wert, als ihn auf Kurve in die falsche Lane zu spielen.

## Wie oft sie auftauchen

Seit [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 hat jeder Ort eine Seltenheit: gewöhnlich, selten, sehr selten oder ultraselten. Die Seltenheit entscheidet, wie oft ein Ort auftaucht. Das Team formuliert es so: Die bekannten erwartest du in den meisten Partien, ein paar wirst du nur „alle Jubeljahre“ sehen. Welcher Ort welche Seltenheit hat, sagen die Patchnotes nicht: Wir ergänzen es auf der [Seite der Orte](/de/locations), sobald wir es wissen.

## Die Familien der Effekte

In unserer Liste sind die Orte danach gruppiert, was sie mit dem Spiel machen, und es lohnt sich, die Gruppen zu kennen, weil sie verschiedene Antworten verlangen.

- **Schaden.** Amplifying Amphitheatre verdoppelt dort jeden Schaden, Burnturn Arena fügt nach dem Kampf jedem Charakter ein wenig Schaden zu, Soul Artillery trifft beide Barrieren, wann immer etwas stirbt. Kleine Körper sind nicht mehr sicher.
- **Mana und Kosten.** Gold Spinning Wheel senkt die Kosten von allem um eins, Castle in the Clouds nur die von Karten, die sieben oder mehr kosten, Treasurer's Office erhöht sie um eins, Mana Battery lässt dich behalten, was du nicht ausgegeben hast. Diese Orte entscheiden, wer beim Tempo vorne liegt.
- **Ziehen und Abwerfen.** The Sultan's Court gibt dir jede Runde eine Karte, die du ausgeben musst, Knowledge Vault belohnt den, der die Lane zuerst füllt, Junkyard nimmt beiden Spielern eine Karte weg, Nostradamus' Call zerstört zu Beginn von Runde sechs beide Decks.
- **Bewegung.** Conveyor Belt schiebt nach dem Kampf alle nach rechts, Ballroom schickt einen zufälligen Charakter auf die Hand zurück, Open Meadow verleiht Bewegen (Move).
- **Beschwörungen und Kopien.** Cloning Lab füllt deine Felder mit Kopien dessen, was du gerade gespielt hast, Reflecting Pool kopiert es an einen anderen Ort, Sherwood Forest bringt immer neue [Merry Men](/de/cards/merry-man) hervor, Hundred Acre Woods setzt einen [Christopher Robin](/de/cards/christopher-robin) auf beide Seiten.
- **Verliehene Schlüsselwörter.** Stomping Grounds verleiht Trampeln (Trample), The Colosseum Doppelangriff (Double Attack), Windmill Ridge Verteidiger (Defender), Poison Grounds gibt bösen Charakteren Todesberührung (Deathtouch), Blessed Grounds guten Charakteren Schild (Shield).
- **Fähigkeiten.** Mirror Dimension wiederholt Beim Aufdecken (On Reveal), Burial Grounds wiederholt Beim Tod (On Death), Anti-Magic Vault nimmt alle Fähigkeiten weg, Wonderland kehrt die Angriffsreihenfolge um.
- **Zerstörung und Barrieren.** The Gallows zerstört den Gegner gegenüber von allem, was dort landet, The Hill tötet nach dem Kampf alles, was mit der niedrigsten Stärke gleichauf liegt, Wall of Dumpty frisst den ersten Charakter, den du spielst, Broken Gate lässt Barrieren mit 10 Leben statt 40 zurückkehren.

## Die Orte, die Partien entscheiden

Einige davon solltest du erkennen, sobald sie auftauchen, weil sie ändern, was du mit deiner Hand tun solltest.

- **Cloning Lab.** Was du dort spielst, wird in deine freien Felder dieser Lane kopiert. Ein günstiger Körper mit einer guten Beim-Aufdecken-Fähigkeit wird zu dreien, und die Lane ist in einem Zug entschieden.
- **Mirror Dimension.** Jedes Beim Aufdecken wird zweimal ausgelöst. Für eine ganze Lane tut sie, was [Mulan](/de/cards/mulan) für ein Deck tut, und sie stapelt sich mit ihr.
- **The Gallows.** Alles, was dort ins Spiel kommt, zerstört den Gegner gegenüber. Der Ort macht deinen billigsten Charakter zu Removal und bestraft den, der sich zuerst festlegt.
- **Anti-Magic Vault.** Charaktere verlieren alle Fähigkeiten. Ein Deck, das auf Auslöser gebaut ist, hat dort nichts zu tun; ein Deck aus schlichten Körpern ist plötzlich in seinem Element.
- **Amplifying Amphitheatre.** Jeder Schaden wird verdoppelt, in beide Richtungen. Ein Finisher mit Trampeln wie [Ellen Trechend](/de/cards/ellen-trechend) beendet die Partie durch die Barriere hindurch; der des Gegners genauso.
- **Nostradamus' Call.** Beide Decks werden zu Beginn von Runde sechs zerstört. Was auch immer dein Plan ist, er muss bis Runde fünf aufgehen.

## Mit den Orten im Kopf bauen

Das Spielfeld kannst du nicht wählen, aber du kannst ein Deck bauen, das darauf selten hilflos ist.

1. **Setz nicht alles auf einen Auslöser.** Ein Deck, das nur über Beim Aufdecken funktioniert, verliert eine Lane an Anti-Magic Vault. Behalte ein paar Karten, die auch als schlichte Körper gut sind.
2. **Behalte eine Karte mit Reichweite.** Orte, die Barrieren treffen (Overloaded Circuit, "Human" Cannon, Soul Artillery), belohnen Decks, die eine Lane aus der Distanz beenden können, statt sie zu zermürben.
3. **Günstige Charaktere profitieren am meisten.** Jeder Ort, der ein Schlüsselwort verleiht oder einen Körper kopiert, bringt bei einer Karte für zwei Mana mehr als bei einer für sieben: Der Ort übernimmt den teuren Teil.
4. **Achte auf die Lanes, die das Festlegen bestrafen.** The Hill, Wall of Dumpty und The Gallows bestrafen alle den Spieler, der eine Lane zuerst füllt. Auf einem unbekannten Spielfeld ist die zweite Karte in einer Lane oft sicherer als die erste.

## Was wir noch prüfen wollen

Diese Liste entspricht der Rotation der Demo 2.0. Wir sind die Orte noch nicht einzeln im Spiel durchgegangen, wie wir es am 22. September 2026 mit den 122 Karten getan haben: Wenn wir es tun, sagt es die [Seite der Orte](/de/locations), mit Datum und Anzahl.
`,
  },
  "origins-tcg-explained": {
    title: "Origins TCG in fünf Minuten erklärt",
    excerpt: "Was Origins TCG ist, wie eine Partie über drei Lanes mit gleichzeitigen Zügen abläuft, was Free-to-Compete heißt und wie du die Demo heute schon spielst.",
    faq: [
      {
        q: "Was ist Origins TCG?",
        a: "Ein digitales Sammelkartenspiel von Koin Games, einem 2021 gegründeten Studio mit Sitz in Tampa, Florida. Seine Figuren sind gemeinfreie Legenden — Robin Hood, Mulan, die Queen of Hearts, Dracula und viele mehr —, neu erdacht in einer eigenen Welt.",
      },
      {
        q: "Wie lange dauert eine Partie?",
        a: "Etwa sieben Minuten. Beide Spieler handeln gleichzeitig auf drei Lanes, also wartet niemand auf den Zug des Gegners.",
      },
      {
        q: "Wie viele Karten hat ein Deck?",
        a: "In der aktuellen Demo fünfundzwanzig, aufgebaut um eine Legendäre mit einer eigenen Signaturfähigkeit. Mulan wiederholt die Beim-Aufdecken-Fähigkeiten (On Reveal) deiner Verbündeten, die Queen of Hearts ihre Beim-Tod-Fähigkeiten (On Death).",
      },
      {
        q: "Kann ich Origins TCG kostenlos spielen?",
        a: "Ja. Die Demo auf Steam ist kostenlos und enthält das Tutorial, Missionen gegen Bosse mit eigener KI und Online-Partien. Jede Karte, die du für kompetitives Spielen brauchst, verdienst du durch Spielen; mit Geld kaufst du nur Sammlerversionen von Karten.",
      },
    ],
    body: `
## Was es ist

Origins TCG ist ein digitales Sammelkartenspiel von **Koin Games**, einem Studio mit Sitz in Tampa, Florida, das 2021 von Branchenveteranen gegründet wurde. Seine Figuren sind gemeinfreie Legenden, neu erdacht in einer eigenen Welt: Robin Hood, Mulan, die Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula und viele mehr.

Das Versprechen heißt **Free-to-Compete**: Jede Karte, die du für kompetitives Spielen brauchst, verdienst du durch Spielen. Mit Geld kaufst du nur Sammlerversionen von Karten, die sich graden, tauschen und verkaufen lassen. Die Entwickler nennen es „null Pay-to-Win“.

## Wie eine Partie abläuft

- **Drei Lanes.** Du und dein Gegner kämpft auf drei Spielfeldern gleichzeitig. Jede Lane hat ihren eigenen Ort, gezogen aus einem Pool von mehr als hundert, die rotieren und die Regeln dieses Spielfelds ändern.
- **Gleichzeitige Züge.** Beide Spieler handeln zur selben Zeit, also gibt es kein Warten. Eine Partie dauert etwa sieben Minuten.
- **Karten greifen an.** Anders als in Spielen, in denen man nur Lanes auszählt, kämpfen die Einheiten gegeneinander: Stärke ist, wie viel Schaden du austeilst, Leben, wie viel du einstecken kannst.
- **Schlüsselwörter.** Die Demo nutzt unter anderem Beim Aufdecken (On Reveal: wird ausgelöst, wenn die Karte gespielt wird), Beim Tod (On Death), Erstschlag (First Strike), Doppelangriff (Double Attack) und Todesberührung (Deathtouch).
- **Eine Legendäre führt das Deck an.** In der aktuellen Demo haben Decks 25 Karten, und jedes Deck ist um eine Legendäre Karte mit einer eigenen Signaturfähigkeit gebaut: Mulan wiederholt die Beim-Aufdecken-Fähigkeiten deiner Verbündeten, die Queen of Hearts ihre Beim-Tod-Fähigkeiten. Die Demo 2.0 hat elf davon: [alle 11 Legendären, Karte für Karte](/de/guides/origins-tcg-legendaries).

## Modi

Die Demo hat ein Tutorial, Missionen gegen Bosse mit eigener KI und Online-Partien. Patch 0.6.1 hat eine **Ranglisten-Ladder** eingeführt, mit Divisionen bis Grandmaster, einer weltweiten Bestenliste und Victory Points. Sie wird in der Demo mit dem Steam Next Fest eingeschaltet: Was bisher bestätigt ist, steht in unserem [Ranked-Guide zu Origins TCG](/de/guides/origins-tcg-ranked).

## So spielst du heute

1. Installiere die kostenlose Demo über die [Steam-Seite](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Wer die Demo spielt, verdient exklusive Sammelobjekte, die handelbar werden, wenn das fertige Spiel erscheint.
2. Tritt dem [offiziellen Discord](https://discord.gg/originstcg) bei, für Turniere, AMAs mit dem Team und die Playtests der nächsten Versionen.
3. Seit [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 unterstützt das Spiel 13 Sprachen: Englisch, Französisch, Italienisch, Deutsch, Spanisch (Spanien), Japanisch, Koreanisch, Polnisch, Portugiesisch (Brasilien), Portugiesisch (Portugal), Russisch, vereinfachtes Chinesisch und Spanisch (Lateinamerika). Die Steam-Seite, gelesen am 30. September 2026, nennt dieselben 13 für die Oberfläche, mit vollständiger Sprachausgabe nur auf Englisch. Eine Mobile-Version ist für 2027 geplant.

## Wohin sich das Spiel entwickelt

Die Steam-Seite nennt als Release das vierte Quartal 2026, ohne genaueres Datum. Die Demo bekam am 21. September 2026 ihr erstes großes Update und am 29. September Patch 0.7, den letzten Balance-Patch vor dem Turnier; der Ranglisten-Modus startet mit dem Steam Next Fest (19.–26. Oktober 2026), und das bisher größte Turnier des Studios, die Crimson Cup, läuft vom 20. bis 25. Oktober. Am 25. September zeigte das Hauptmenü der Demo den Kickstarter als „Coming soon – Oct 27“. Mehr dazu in der [Roadmap](/de/guides/roadmap-and-dates) und in unserem [Kickstarter-Guide](/de/guides/origins-tcg-kickstarter).
`,
  },
  "on-reveal-midrange-guide": {
    title: "On Reveal Mid Range: so spielst du das Midrange-Deck mit Mulan",
    metaTitle: "Guide zum Mulan-Deck: On Reveal Mid Range",
    excerpt: "Spielplan, Mulligan und Runde für Runde zu On Reveal Mid Range, dem Mulan-Deck, das jedes Beim Aufdecken wiederholt: für Ladder, kompetitiv und Turniere.",
    faq: [
      {
        q: "Was macht Mulan in diesem Deck?",
        a: "Mulan ist eine 2/4 für 4 Mana mit Doppelangriff, und wenn die Beim-Aufdecken-Fähigkeit eines Verbündeten ausgelöst wird, wiederholt sie sie. Neun Karten der Liste haben ein Beim Aufdecken, also macht sie aus jeder davon zwei.",
      },
      {
        q: "Was behältst du im Mulligan?",
        a: "Eine Kurve, die dich in Runde vier zu Mulan bringt: Bagheera auf einem mittleren Feld, Baby Bear, dann Black Knight oder Frog Prince. Mary lohnt sich, wenn du eine lange Partie erwartest.",
      },
      {
        q: "Welches Beim Aufdecken profitiert am meisten von Mulan?",
        a: "Mowgli, dessen Beim Aufdecken für 6 Mana einen 6/6-Baloo an einem anderen zufälligen Ort beschwört: wiederholt, bringt es zwei Baloos aufs Spielfeld. Auch Ellen Trechend und Fairy Godmother wirken doppelt.",
      },
      {
        q: "Wie probiere ich das Deck aus?",
        a: "Öffne die Seite des Decks auf OriginsMeta und klicke auf „Im Deck builder öffnen“, oder auf „Spielcode kopieren“, um den Code (KGBLDC…) in Origins einzufügen.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Das Deck in einem Absatz

**On Reveal Mid Range** ist eine **Midrange**-Liste mit [Mulan](/de/cards/mulan) an der Spitze, am 22. September 2026 auf OriginsMeta veröffentlicht von [Davdas](/de/authors/davdas), einem Mitglied des Staffs der Website, und für **Ladder**, **kompetitives Spiel** und **Turniere** markiert. Die Idee ist die, die der Autor auf der [Seite des Decks](/de/decks/community/on-reveal-mid-range-772e) beschreibt: Mulan „lässt dich Beim-Aufdecken-Fähigkeiten voll ausnutzen“, und die Liste ist so gebaut, dass sie in jeder Runde eine hat, die sich zu wiederholen lohnt. Sie hält gegen ein aggressives Deck stand und setzt ein Control-Deck unter Druck, weil dieselben Karten Zeit gewinnen und ein Spielfeld aufbauen.

## Die Liste

Fünfundzwanzig Karten: die Legendäre und zwölf Karten, die je zweimal gespielt werden. Die Werte sind die der Demo 2.0, [Karte für Karte im Spiel geprüft](/de/deck-builder) am 22. September 2026, mit den neuen Kosten von Bagheera aus [Patch 0.7](/de/news/patch-0-7) vom 29. September.

| Karte | Kosten | Was sie tut |
| --- | --- | --- |
| [Mulan](/de/cards/mulan) ★ | 4 | 2/4, Doppelangriff; wenn ein Beim Aufdecken eines Verbündeten ausgelöst wird, wiederholt es sich |
| [Bagheera](/de/cards/bagheera) | 2 | 1/1; Beim Aufdecken auf einem mittleren Feld erhält er +2⚔️/+2❤️ |
| [Baby Bear](/de/cards/baby-bear) | 2 | 1/1; schlägt mit 1 Schaden zurück, wenn ein Gegner hier deiner Barriere Schaden zufügt, und fügt beim Tod deiner Hand einen 4/4-Papa Bear hinzu |
| [Mary](/de/cards/mary) | 3 | 1/1; Beim Aufdecken fügt sie deiner Hand ein Little Lamb hinzu, beim Tod erhalten deine Lambs dauerhaft +3⚔️/+3❤️ |
| [Black Knight](/de/cards/black-knight) | 3 | 2/2; Beim Aufdecken fügt er dem Gegner gegenüber 2 Schaden zu |
| [Frog Prince](/de/cards/frog-prince) | 3 | 2/2; Beim Aufdecken +3⚔️ oder +3❤️, nach deiner Wahl |
| [Ali Baba](/de/cards/ali-baba) | 3 | 2/3; zieht eine Karte, wann immer er der gegnerischen Barriere Schaden zufügt |
| [White Queen](/de/cards/white-queen) | 4 | 3/3; Beim Aufdecken schickt sie einen BELIEBIGEN Charakter auf die Hand seines Besitzers zurück |
| [Fairy Godmother](/de/cards/fairy-godmother) | 5 | 3/3; Beim Aufdecken gibt sie einem anderen Verbündeten +3⚔️/+3❤️ |
| [Mowgli](/de/cards/mowgli) | 6 | 2/2; Beim Aufdecken beschwört er Baloo (6/6) an einem anderen zufälligen Ort |
| [Ellen Trechend](/de/cards/ellen-trechend) | 8 | Trampeln; Beim Aufdecken erhält sie +3⚔️/+3❤️ für jede gegnerische Karte an ihrem Ort |
| [Bullseye](/de/cards/bullseye) | 1 | Zauber: Füge einem BELIEBIGEN Charakter 3 Schaden zu |
| [En Passant](/de/cards/en-passant) | 3 | Zauber: Bewege einen Verbündeten und füge dem Charakter gegenüber Schaden in Höhe seiner Stärke zu |

Zehn Einheiten und zwei Zauber, neun davon mit einem Beim Aufdecken. Das ist der ganze Sinn des Decks: Mulan ist kein Finisher, sie ist ein Multiplikator.

## Wie das Deck gewinnt

Mulan wiederholt das Beim Aufdecken eines Verbündeten, also zählt jede Karte, die nach ihr gespielt wird, doppelt. Die drei besten Doppelungen:

- **Mowgli** kostet sechs und beschwört einen 6/6-Baloo an einem anderen zufälligen Ort. Wiederholt sind es zwei Baloos: eine einzige Karte, die zwei Lanes füllt, um die du gar nicht gekämpft hast.
- **Ellen Trechend** wächst um +3⚔️/+3❤️ für jede gegnerische Karte an ihrem Ort, und sie hat Trampeln. In einer vollen Lane ist sie schon allein eine Bedrohung; wiederholt kommt der Buff vor dem Kampf zweimal.
- **Fairy Godmother** gibt einem anderen Verbündeten +3⚔️/+3❤️. Die zwei Auslösungen kannst du auf denselben Körper lenken oder auf zwei verteilen, je nachdem, was der Gegner entfernen kann.

Mulan hat außerdem **Doppelangriff**, also tauscht ihr eigener 2/4-Körper besser, als es aussieht.

## Mulligan

Such eine Kurve, die dich in Runde vier zu Mulan bringt, ohne zurückzufallen: **Bagheera** auf einem mittleren Feld (eine 3/3 für ein Mana), dann **Baby Bear**, dann **Black Knight** oder **Frog Prince**. Behalte **Mary**, wenn du eine lange Partie erwartest: Das Lamb, das sie deiner Hand hinzufügt, ist ein günstiger Körper, und wenn Mary stirbt, wachsen die Lambs, die du schon gespielt hast, dauerhaft.

## Runde für Runde

1. **Runden 1–3: Platz nehmen, ohne zu viel zu investieren.** Bagheera in die Mitte, Baby Bear dorthin, wo du die ersten Angriffe erwartest, Black Knight gegenüber von etwas, das weg soll. Eine Karte pro Lane reicht: Das Deck will, dass das Spielfeld ausgeglichen ist, nicht überfüllt, wenn Mulan kommt.
2. **Runde 4: Mulan.** Ab hier zählt die Reihenfolge deiner Züge mehr als die Karten. Frag dich jede Runde, welches Beim Aufdecken sich zu verdoppeln lohnt, und spiel es an Mulans Ort.
3. **Runden 5–6: die Value-Karten.** Fairy Godmother, dann Mowgli bei sechs Mana. White Queen ist die Antwortkarte der Liste: Sie schickt einen BELIEBIGEN Charakter auf die Hand seines Besitzers zurück, kann also einen Finisher in der Runde entfernen, in der er landet, oder deine eigene Mary aufnehmen, damit du sie erneut spielst.
4. **Runden 7–8: abschließen.** Ellen Trechend in die Lane, die der Gegner gefüllt hat; En Passant, um einen Verbündeten zu bewegen, das zu treffen, was ihm gegenübersteht, und dem Schaden mit Trampeln den Weg zu öffnen.

## Die Karten, die Zeit gewinnen

Der Autor nennt **White Queen, Mary und En Passant** die Karten, „die dir Zeit verschaffen“, und sie sind es, die das Deck einen aggressiven Start überleben lassen. White Queen ist kein Removal: Der Charakter kommt auf die Hand seines Besitzers zurück und kann erneut gespielt werden, also setz sie gegen etwas Teures ein oder gegen einen Körper, der schon gebufft ist. En Passant ist Removal und Neupositionierung zugleich, und es ist die Antwort auf einen Blocker, der vor deiner besten Karte geparkt ist.

## Matchups

Ranked-Daten sind nicht öffentlich, also ist das Folgende die Lesart der Listen durch OriginsMeta, keine Win-Rate.

- **Gegen aggressive Decks.** Baby Bear und Frog Prince als 2/5 gespielt halten die Lanes; Bullseye erledigt Körper mit drei Leben für ein Mana. Verbrauche White Queen nicht früh: Du wirst sie für die erste große Bedrohung brauchen.
- **Gegen Control-Decks.** Ali Baba ist die Karte, die deine Hand voll hält, während du Druck auf eine Barriere machst. Leg nicht alles an einen Ort: Einen Board-Wipe, den ein einziger Mowgli beantwortet, kannst du dir leisten, eine leere Hand nicht.
- **Gegen andere Midrange-Listen.** Das Deck spielt dasselbe Spiel wie [3 Pigs Mid Range](/de/decks/community/3-pigs-mid-range-6311) und [King of Value Trade](/de/decks/community/king-of-value-trade-fd14): Wer mehr aus jeder Karte herausholt, gewinnt. Ein Beim Aufdecken zu verdoppeln ist genau das, also schütze Mulan und spiel die günstigen Beim-Aufdecken-Karten nur dann vor ihr, wenn du musst.

## Die Schwächen, in den Worten des Autors

Die Seite des Decks nennt zwei: **Eine gute Kurve ist oft entscheidend**, und **dir können die Antworten ausgehen**. Beide haben dieselbe Ursache — das Deck hat kein Massen-Removal und nur zwei Zauber. Wenn du wählen musst, ob du eine Karte jetzt einsetzt oder sie für eine spätere Verdopplung aufhebst, setz sie jetzt ein: Mulan wiederholt, was du spielst, sie bringt nichts zurück.

## Wie es weitergeht

- Die [Seite des Decks](/de/decks/community/on-reveal-mid-range-772e) hat die Liste mit den Diagrammen zu Manakurve und Sagas, die Notizen des Autors, „Im Deck builder öffnen“ und den Spielcode zum Einfügen in Origins.
- Die Kartenwerte sind die der Demo 2.0 mit [Patch 0.7 vom 29. September 2026](/de/news/patch-0-7), der Bagheera von einem auf zwei Mana gebracht hat; jede Kartenseite hat ihre eigene Balance-Historie.
`,
  },
  "king-of-value-trade-guide": {
    title: "King of Value Trade: so spielst du das Midrange-Deck mit King Arthur",
    metaTitle: "Deck-Guide King Arthur: King of Value Trade",
    excerpt: "Spielplan, Mulligan und Runde für Runde zu King of Value Trade, dem Midrange-Deck mit King Arthur, das jeden Tausch zwei gegen eins gewinnen will.",
    faq: [
      {
        q: "Was ist ein Value-Trade in Origins TCG?",
        a: "Wenn eine deiner Karten zwei des Gegners beantwortet oder du eine günstige Karte gegen eine teure tauschst. Dieses Deck ist um diese Idee gebaut: Schild, Erstschlag und Buffs lassen deine Charaktere den Kampf überleben, den sie gewinnen.",
      },
      {
        q: "Was behältst du im Mulligan?",
        a: "Bagheera und Roo, die auf Kurve solide sind, Musketeer und Shield Maiden für die ersten Runden. Gegen aggressive Decks behältst du Cowardly Lion, gegen Control Ali Baba.",
      },
      {
        q: "Warum ist Roo nach dem Patch vom 21. September gut?",
        a: "Der Demo-Patch vom 21. September 2026 hat Roo von 2/3 auf 2/4 gebracht (+1 Leben), für zwei Mana und weiterhin mit dem Schlüsselwort Bewegen, also überlebt er die meisten frühen Schlagabtausche, statt nach unten zu tauschen.",
      },
      {
        q: "Ist Spellbook nötig?",
        a: "Nein. Es bringt jede Runde einen zufälligen Zauber als Nachschub und Unberechenbarkeit, aber laut der Seite des Decks kann die Liste auch ohne es gewinnen.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Das Deck in einem Absatz

**King of Value Trade** ist eine **Midrange**-Liste mit [King Arthur](/de/cards/king-arthur) an der Spitze, am 22. September 2026 auf OriginsMeta veröffentlicht von [Davdas](/de/authors/davdas), einem Mitglied des Staffs der Website, und für die **Ladder** markiert. Der Name verrät den Plan: „Fast jede Karte will zwei gegen eins tauschen“, also mit einer deiner Karten zwei des Gegners beantworten. Tust du das oft genug, gehört dir das Spielfeld von selbst, ohne dass du einen einzigen großen Abschlusszug brauchst.

## Die Liste

Fünfundzwanzig Karten: die Legendäre und zwölf Karten, die je zweimal gespielt werden.

| Karte | Kosten | Was sie tut |
| --- | --- | --- |
| [King Arthur](/de/cards/king-arthur) ★ | 7 | 7/7 mit Schild; Beim Aufdecken gibt er deinen guten Charakteren Schild |
| [Bagheera](/de/cards/bagheera) | 2 | 1/1; Beim Aufdecken auf einem mittleren Feld erhält er +2⚔️/+2❤️ |
| [Musketeer](/de/cards/musketeer) | 2 | 2/1 mit Erstschlag |
| [Roo](/de/cards/roo) | 2 | 2/4 mit Bewegen |
| [Shahrazad](/de/cards/shahrazad) | 2 | 1/4; heilt hier 1 Schaden an deiner Barriere, wann immer eine Karte auf deine Hand kommt |
| [Shield Maiden](/de/cards/shield-maiden) | 3 | 3/1 mit Schild |
| [Dark Omen](/de/cards/dark-omen) | 3 | Zauber: Zerstöre einen BELIEBIGEN Charakter |
| [Cowardly Lion](/de/cards/cowardly-lion) | 3 | 2/5 mit Verteidiger |
| [Ali Baba](/de/cards/ali-baba) | 3 | 2/3; zieht eine Karte, wann immer er der gegnerischen Barriere Schaden zufügt |
| [Spellbook](/de/cards/spellbook) | 4 | Zauber: Ab jetzt jede Runde ein zufälliger Zauber auf der Hand, der vor dem Kampf abgeworfen wird |
| [Lancelot](/de/cards/lancelot) | 4 | 4/4; jeder gute Charakter, den du an seinem Ort spielst, erhält +2⚔️/+2❤️ |
| [Fairy Godmother](/de/cards/fairy-godmother) | 5 | 3/3; Beim Aufdecken gibt sie einem anderen Verbündeten +3⚔️/+3❤️ |
| [Boitata](/de/cards/boitata) | 5 | 5/5; Schaden von Zaubern und Fähigkeiten gegen deine Barrieren trifft stattdessen die gegnerische Barriere dort |

Zehn Einheiten und zwei Zauber, und zehn der dreizehn Karten sind gute Charaktere: Das ist kein Zufall, sondern das, was die Legendäre ihre sieben Mana wert macht.

## Wie das Deck gewinnt

Drei Schlüsselwörter erledigen die Arbeit.

- **Schild** fängt den ersten Schaden ab. King Arthur gibt es allen deinen guten Charakteren auf einmal, und [Shield Maiden](/de/cards/shield-maiden) bringt ihr eigenes mit: Eine 3/1 mit Schild tauscht mit einer 3/3 und bleibt auf dem Spielfeld.
- **Erstschlag** auf [Musketeer](/de/cards/musketeer) heißt, dass der Gegner den Schaden nimmt, bevor er antworten kann: zwei Mana, die einen größeren Körper entfernen.
- **Die Buffs** von [Lancelot](/de/cards/lancelot) und [Fairy Godmother](/de/cards/fairy-godmother) machen aus einem ausgeglichenen Kampf einen einseitigen. Lancelot bufft jeden guten Charakter, der an seinem Ort gespielt wird, also belohnt er dich dafür, die Lane weiter auszubauen, statt dich zu verzetteln.

[Ali Baba](/de/cards/ali-baba) ist der Motor: Jedes Mal, wenn er einer Barriere Schaden zufügt, ziehst du. [Shahrazad](/de/cards/shahrazad) ist die andere Hälfte derselben Idee — sie heilt an ihrem Ort jedes Mal 1 Schaden an deiner Barriere, wenn eine Karte auf deine Hand kommt, also hält dich das Ziehen am Leben und zugleich vorne.

## Mulligan

**Bagheera ist Pflicht**, und **Roo** lohnt sich jetzt in jeder Hand: Der [Demo-Patch vom 21. September](/de/news/demo-patch-notes-0921) hat ihn zu einer 2/4 gemacht, also überlebt er die frühen Schlagabtausche. **Musketeer** und **Shield Maiden** bringen dich in den Runden zwei und drei nach vorne. Gegen ein aggressives Deck behältst du **Cowardly Lion**, dessen Verteidiger die Lane hält; gegen ein Control-Deck **Ali Baba**, der einen freien Treffer auf die Barriere in Karten verwandelt. Wenn du eine lange Partie erwartest, ist es vertretbar, **Spellbook** zu behalten.

## Runde für Runde

1. **Runden 1–3: nach oben tauschen.** Bagheera in die Mitte, Musketeer gegenüber von einem Körper mit 1 oder 2 Leben, Roo dorthin, wo du dich später vielleicht bewegen willst. Jeder Kampf, den du gewinnst, ohne den Körper zu verlieren, ist eine gewonnene Karte.
2. **Runden 4–5: eine Lane halten.** Lancelot, dann spielst du die guten Charaktere an seinem Ort: Jeder kommt um +2⚔️/+2❤️ größer an, als er sein sollte. Boitata bei fünf Mana ist eine 5/5, die außerdem gegnerischen Zauberschaden gegen deine Barrieren auf deren Barrieren umlenkt.
3. **Runden 6–7: die Legendäre.** King Arthur ist eine 7/7 mit Schild, und sein Beim Aufdecken gibt allem Guten, das du schon auf dem Spielfeld hast, Schild. Spiel ihn nicht auf ein leeres Spielfeld: Der Value steckt in den Schilden, nicht im Körper.
4. **Dark Omen, wann immer es darauf ankommt.** Drei Mana, um einen BELIEBIGEN Charakter zu zerstören, sind die Antwort auf die eine Karte, die du im Kampf nicht schlagen kannst: einen gebufften Körper, einen Verteidiger in der falschen Lane, eine gegnerische Legendäre.

## Zwei Hinweise des Autors

- **Fairy Godmother ist nicht nur ein Finisher.** Die Seite des Decks weist darauf hin, dass sie auch Ali Baba, Shahrazad oder Cowardly Lion schützen kann: +3❤️ auf dem richtigen Körper heißt, dass der Motor eine weitere Runde überlebt.
- **Dark Omen muss präzise sitzen.** Mit zwei Kopien und keinem anderen Removal lässt ein Exemplar, das auf das falsche Ziel geht, die echte Bedrohung am Leben.

## Matchups

Ranked-Daten sind nicht öffentlich, also ist das die Lesart der Listen durch OriginsMeta, keine Win-Rate.

- **Gegen aggressive Decks.** Cowardly Lion und Shahrazad zusammen sind das Sicherheitsnetz: Der Verteidiger fängt die Treffer ab, die Heilung gibt den Barriereschaden zurück, der durchkommt. Tausch Shield Maiden nicht früh gegen einen Körper mit 1 Leben, wenn ein größerer kommt.
- **Gegen Control-Decks.** Ali Baba, dann ein zweiter. Die Seite des Decks ist da eindeutig: Die Liste will weiterziehen, während der Gegner nach Antworten gräbt. Heb Dark Omen für die Karte auf, die ihre Partie entscheidet, nicht für das Erste, was sie spielen.
- **Gegen Decks, die deinen Barrieren mit Zaubern schaden** ([Healing Healsing](/de/decks/community/healing-healsing-9411) und andere Listen mit Boitata). Wer Boitata zuerst landet, dreht diesen Schaden um: Mit zwei Kopien in der Liste lohnt es sich, eine zurückzuhalten, statt beide im selben Kampf zu verlieren.

## Die Schwächen, in den Worten des Autors

Die Seite des Decks nennt drei: **kein Flächen-Removal**, **Dark Omen muss präzise eingesetzt werden** und **du musst den Plan des Gegners lesen**. Die ersten beiden ergeben sich aus der Liste: Außer Dark Omen gibt es nichts, was einen Charakter direkt entfernt, also bleibt ein Spielfeld, das du wachsen lässt, gewachsen. Die dritte ist der ehrliche Teil — dieses Deck holt seinen Value einen Tausch nach dem anderen, und jeder Tausch ist eine Entscheidung.

## Wie es weitergeht

- Die [Seite des Decks](/de/decks/community/king-of-value-trade-fd14) hat die vollständige Liste mit den Diagrammen, die Notizen des Autors, „Im Deck builder öffnen“ und den Spielcode (KGBLDC…).
- Die Kartenwerte sind die der Demo 2.0 mit [Patch 0.7 vom 29. September 2026](/de/news/patch-0-7), der Bagheera auf zwei Mana und Spellbook auf vier angehoben hat; die Zauber, die Spellbook hinzufügt, können nicht mehr Spellbook sein.
`,
  },
  "dorothy-combo-guide": {
    title: "Dorothy Combo: so spielst du das Move-Deck nach dem Patch vom 21. September",
    metaTitle: "Guide zum Dorothy-Deck: Dorothy Combo",
    excerpt: "Das Move-Deck, neu gebaut um die Buffs vom 21. September: wie Dorothy wächst, welche Combos du suchst, der Mulligan und was die Liste noch nicht kann.",
    faq: [
      {
        q: "Wie wächst Dorothy?",
        a: "Dorothy kann sich jede Runde bewegen und hat +1⚔️/+1❤️ für jede Bewegung eines Verbündeten in dieser Partie. Der Zähler gilt für die ganze Partie, nicht für die Runde, also macht jede Bewegung, egal wo, sie größer.",
      },
      {
        q: "Welche Move-Combos sucht das Deck?",
        a: "Card Soldier, der nach einer Bewegung eine Kopie von sich auf seinem vorherigen Feld beschwört; Pegasus, der nach einer Bewegung seine Stärke verdoppelt; und Magic Carpet, der Beim Aufdecken deine anderen Verbündeten ein Feld nach links oder rechts bewegt.",
      },
      {
        q: "Ist das Deck kompetitiv?",
        a: "Der Autor nennt es ein Deck für Spaß und Ladder und sagt offen, dass es wahrscheinlich noch nicht auf Top-Tier-Niveau ist, dass sich nach den Buffs vom 21. September aber etwas bewegt.",
      },
      {
        q: "Wie probiere ich das Deck aus?",
        a: "Öffne die Seite des Decks auf OriginsMeta und klicke auf „Im Deck builder öffnen“, oder kopiere den Spielcode (KGBLDC…) in Origins.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Das Deck in einem Absatz

**Dorothy Combo** ist eine **Combo**-Liste mit [Dorothy](/de/cards/dorothy) an der Spitze, am 22. September 2026 auf OriginsMeta veröffentlicht von [Davdas](/de/authors/davdas), einem Mitglied des Staffs der Website, und für **Ladder** und **Spaß** markiert. Es ist das Move-Deck, neu gebaut nach dem [Demo-Patch vom 21. September 2026](/de/news/demo-patch-notes-0921), der unter anderem Dorothy, [Roo](/de/cards/roo) und [Magic Carpet](/de/cards/magic-carpet) gebufft hat. Die Einschätzung des Autors steht auf der [Seite des Decks](/de/decks/community/dorothy-combo-7503), und wir übernehmen sie, wie sie ist: Das ist wahrscheinlich noch keine Top-Tier-Liste, aber es bewegt sich etwas.

## Die Liste

Fünfundzwanzig Karten: die Legendäre und zwölf Karten, die je zweimal gespielt werden.

| Karte | Kosten | Was sie tut |
| --- | --- | --- |
| [Dorothy](/de/cards/dorothy) ★ | 4 | 1/1; kann sich jede Runde bewegen und erhält +1⚔️/+1❤️ für jede Bewegung eines Verbündeten in dieser Partie |
| [Twister Toss](/de/cards/twister-toss) | 1 | Zauber: Bewege einen Verbündeten auf ein beliebiges Feld; steht dort schon eine andere Karte, tauschen die beiden die Plätze |
| [Card Soldier](/de/cards/card-soldier) | 2 | 3/1; nachdem er sich bewegt hat, beschwört er eine Kopie von sich auf seinem vorherigen Feld |
| [Roo](/de/cards/roo) | 2 | 2/4 mit Bewegen |
| [Basilisk](/de/cards/basilisk) | 2 | 1/2 mit Todesberührung |
| [Pegasus](/de/cards/pegasus) | 3 | 2/4; nachdem er sich bewegt hat, verdoppelt er seine Stärke |
| [Flying Monkey](/de/cards/flying-monkey) | 3 | 4/1; Beim Aufdecken bewegt er einen BELIEBIGEN anderen Charakter auf ein zufälliges Feld hier |
| [Wicked Witch of the West](/de/cards/wicked-witch-of-the-west) | 3 | 1/5; wenn sie Schaden überlebt, fügt sie deiner Hand einen Flying Monkey hinzu und bewegt sich ein Feld nach links |
| [Kanga](/de/cards/kanga) | 3 | 2/3; vor dem Kampf erhalten Verbündete, die sich in dieser Runde bewegt haben, +1⚔️/+1❤️ |
| [En Passant](/de/cards/en-passant) | 3 | Zauber: Bewege einen Verbündeten und füge dem Charakter gegenüber Schaden in Höhe seiner Stärke zu |
| [Spellbook](/de/cards/spellbook) | 4 | Zauber: Ab jetzt jede Runde ein zufälliger Zauber auf der Hand, der vor dem Kampf abgeworfen wird |
| [Magic Carpet](/de/cards/magic-carpet) | 4 | 4/4; Beim Aufdecken bewegt er deine anderen Verbündeten ein Feld nach links oder ein Feld nach rechts |
| [Hare](/de/cards/hare) | 5 | 4/1 mit Erstschlag und Bewegen |

Neun Einheiten und drei Zauber, und fast alles bewegt sich entweder oder belohnt eine Bewegung.

## Wie das Deck gewinnt

Dorothy ist eine 1/1, die mitzählt: **+1⚔️/+1❤️ für jede Bewegung eines Verbündeten in dieser Partie**. Der Zähler wird nicht zurückgesetzt und zählt Bewegungen überall auf dem Spielfeld, also ist ein günstiger Zauber wie [Twister Toss](/de/cards/twister-toss) nie verschwendet — er ist ein Mana für einen dauerhaften Punkt auf deiner Legendären. In Runde fünf nach ein paar Bewegungen gespielt, landet Dorothy als echter Körper und wächst danach jede Runde weiter, weil sie sich selbst bewegt.

Drei Combos sind der Sinn der Liste:

1. **Card Soldier plus eine beliebige Bewegung.** Eine 3/1 für zwei Mana, die bei jeder Bewegung eine Kopie von sich zurücklässt: Mit Twister Toss oder Magic Carpet füllt sie allein eine Lane.
2. **Pegasus plus eine beliebige Bewegung.** Nach einer Bewegung verdoppelt er seine Stärke: Aus 2/4 wird 4/4, und mit Kangas +1⚔️ vor dem Kampf ist er ein Körper mit 5 Stärke, den der Gegner mit drei Mana bewertet hat.
3. **Magic Carpet als Motor.** Er bewegt *alle* deine anderen Verbündeten um ein Feld, in die Richtung, die du wählst: eine Karte, mehrere Auslöser — eine Kopie von Card Soldier, ein verdoppelter Pegasus, Punkte auf Dorothy und Kangas Buff auf allem, was sich bewegt hat.

## Mulligan

Vom Autor gibt es keinen Hinweis zum Mulligan, also ist das die Lesart von OriginsMeta. Behalte die günstigen Karten, die Bewegung ermöglichen, **Twister Toss** und **Roo**, und einen der beiden Körper, die dich für Bewegung belohnen, **Card Soldier** oder **Pegasus**. Magic Carpet ist die Karte, die du in Runde vier willst, nicht auf der Starthand. Ganz ohne günstige Karte ist eine Hand, die erst in Runde drei loslegt, zu langsam für ein Deck, das seinen Zähler ab der ersten Runde laufen lassen will.

## Runde für Runde

1. **Runden 1–2: den Zähler starten.** Card Soldier oder Roo, dann Twister Toss darauf. Jede Bewegung ist ein dauerhafter Punkt auf Dorothy, auch wenn das Spielfeld ruhig aussieht.
2. **Runde 3: die Lane wählen.** Pegasus, die Witch oder Kanga. [Wicked Witch of the West](/de/cards/wicked-witch-of-the-west) ist diejenige, die von selbst Karten erzeugt: eine 1/5, die die meisten Treffer überlebt, und jedes Mal, wenn sie das tut, bekommst du einen Flying Monkey auf die Hand und sie bewegt sich ein Feld nach links — ein weiterer Punkt für Dorothy.
3. **Runde 4: Magic Carpet.** Wähle die Richtung, die deine Card Soldiers auf ein freies Feld schiebt und Pegasus in einen Kampf bringt, den er jetzt gewinnt.
4. **Ab Runde 5: Dorothy, dann abschließen.** Seit dem Patch vom 21. September kostet sie 4, aber Runde vier gehört dem Carpet, und eine Runde später landet sie mit einem höheren Zähler. Hare hat Erstschlag und Bewegen: Er trifft vor der Antwort und hält den Zähler am Laufen. [Basilisk](/de/cards/basilisk) mit Todesberührung ist die günstige Antwort auf einen Körper, der für einen fairen Kampf zu groß ist, und En Passant macht aus einem verdoppelten Pegasus Removal.

## Was das Deck nicht kann

Der Autor nennt zwei Schwächen, und es sind die ehrlichen: **Du kannst mit deinen Karten ziemlich festsitzen**, und **manche Combos sind nicht konstant**. Beide haben dieselbe Ursache — [Flying Monkey](/de/cards/flying-monkey) bewegt einen Charakter auf ein *zufälliges* Feld, die Kopie von Card Soldier landet auf dem Feld, das er verlassen hat, und Magic Carpet bewegt alles, auch Verbündete, die du dort haben wolltest, wo sie waren. Plane die Richtung, bevor du den Carpet spielst, und verlass dich nicht darauf, dass ein bestimmtes Feld frei ist.

## Matchups

Ranked-Daten sind nicht öffentlich: Das ist eine Lesart der Listen, keine Win-Rate.

- **Gegen aggressive Decks.** Die Witch und Roo halten die frühen Lanes; Basilisks Todesberührung beantwortet den ersten großen Körper. Dorothy kann warten: Sie ist spät besser, wenn der Zähler hoch ist.
- **Gegen Control-Decks.** Das ist das gute Matchup. Kopien von Card Soldier und Flying Monkeys kommen immer wieder, also leert ein einzelner Wipe dein Spielfeld nicht. Behalte nach einem Wipe ein Twister Toss auf der Hand, um den Zähler neu zu starten.
- **Gegen andere Move-Decks.** Wer sich mehr bewegt, bekommt die größere Dorothy, aber Flying Monkey bewegt *jeden* Charakter: Nutze ihn, um einen gegnerischen Pegasus von dem Feld zu ziehen, auf dem er sich verdoppeln wollte.

## Wie es weitergeht

- Die [Seite des Decks](/de/decks/community/dorothy-combo-7503) hat die vollständige Liste, die Diagramme, die Notizen des Autors, „Im Deck builder öffnen“ und den Spielcode.
- Die Buffs hinter dieser Liste stehen in den [Patchnotes vom 21. September](/de/news/demo-patch-notes-0921); MetaShifting erfasst jede Änderung auf [einer eigenen Seite](/de/metashifting).
- Die Kartenwerte sind die der Demo 2.0 mit [Patch 0.7 vom 29. September 2026](/de/news/patch-0-7), der Spellbook von drei auf vier Mana angehoben und Twister Toss überarbeitet hat. Die Tabelle beschreibt Twister Toss nach den Patchnotes: Den neuen Text haben wir im Spiel noch nicht gelesen.
`,
  },
  "trick-or-treat-legion-guide": {
    title: "The Trick-or-Treat Legion: so spielst du das Deck mit Legion of the Dead",
    metaTitle: "Guide zum Deck mit Legion of the Dead",
    excerpt: "Die Liste mit Legion of the Dead, gebaut, um unberechenbar zu sein: das Zombie-Spielfeld, die Combo aus Golden Egg und Boogeyman, Mulligan und Matchups.",
    faq: [
      {
        q: "Was macht Legion of the Dead?",
        a: "Sie ist ein legendärer Zauber für 7 Mana: Sie füllt dein Spielfeld mit Zombies (2⚔️/2❤️). Eine Karte, und jedes freie Feld ist besetzt.",
      },
      {
        q: "Was ist die Combo aus Golden Egg und Boogeyman?",
        a: "Boogeyman ist eine 7/7 für 4 Mana, deren Beim Aufdecken den Verbündeten mit der niedrigsten Stärke an ihrem Ort zerstört, notfalls sich selbst. Golden Egg ist eine 0/1, die beim Tod eine 5/5-Golden Goose auf ihrem Feld beschwört: Leg das Egg zuerst, und die Fähigkeit von Boogeyman macht daraus eine Goose, statt deinen eigenen Körper zu töten.",
      },
      {
        q: "Was behältst du im Mulligan?",
        a: "Bagheera und Thumbelina, am besten zusammen mit Bullseye. Auch das Paar Golden Egg und Boogeyman lohnt sich auf der Starthand.",
      },
      {
        q: "Warum ist Mind Palace wichtig?",
        a: "Das Deck leert seine Hand schnell: Ohne die zwei Karten, die Mind Palace zieht, gehen dir die Züge aus, bevor die Legendäre landet.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Das Deck in einem Absatz

**The Trick-or-Treat Legion** ist eine **Evil**-Liste mit [Legion of the Dead](/de/cards/legion-of-the-dead) an der Spitze, am 22. September 2026 auf OriginsMeta veröffentlicht von [Davdas](/de/authors/davdas), einem Mitglied des Staffs der Website, und für **Ladder**, **kompetitives Spiel** und **Turniere** markiert. Vom Legion-Deck sind mehrere Versionen im Umlauf; diese will nach den Worten des Autors ihre Unberechenbarkeit steigern und bringt Karten zusammen, die dem Spielfeld des Gegners jede Runde „einen Streich spielen“. Die vollständige Liste und die Diagramme stehen auf der [Seite des Decks](/de/decks/community/the-trick-or-treat-legion-72c4).

## Die Liste

Fünfundzwanzig Karten: die Legendäre und zwölf Karten, die je zweimal gespielt werden.

| Karte | Kosten | Was sie tut |
| --- | --- | --- |
| [Legion of the Dead](/de/cards/legion-of-the-dead) ★ | 7 | Legendärer Zauber: Fülle dein Spielfeld mit Zombies (2⚔️/2❤️) |
| [Bullseye](/de/cards/bullseye) | 1 | Zauber: Füge einem BELIEBIGEN Charakter 3 Schaden zu |
| [Thumbelina](/de/cards/thumbelina) | 1 | 2/2, keine Fähigkeit |
| [Bagheera](/de/cards/bagheera) | 2 | 1/1; Beim Aufdecken auf einem mittleren Feld erhält er +2⚔️/+2❤️ |
| [Morgiana](/de/cards/morgiana) | 2 | 2/3; verhindert, dass an ihrem Ort ALLE Beim-Aufdecken-Fähigkeiten ausgelöst werden |
| [Mind Palace](/de/cards/mind-palace) | 3 | Zauber: Ziehe 2 Karten |
| [Asanbosam](/de/cards/asanbosam) | 3 | 5/5; Beim Aufdecken wirft er eine zufällige Karte mit geraden Kosten ab |
| [Golden Egg](/de/cards/golden-egg) | 3 | 0/1; Beim Tod beschwört es eine Golden Goose (5/5) auf seinem Feld |
| [Flying Monkey](/de/cards/flying-monkey) | 3 | 4/1; Beim Aufdecken bewegt er einen BELIEBIGEN anderen Charakter auf ein zufälliges Feld hier |
| [En Passant](/de/cards/en-passant) | 3 | Zauber: Bewege einen Verbündeten und füge dem Charakter gegenüber Schaden in Höhe seiner Stärke zu |
| [Boogeyman](/de/cards/boogeyman) | 4 | 7/7; Beim Aufdecken zerstört er den Verbündeten hier mit der niedrigsten Stärke, notfalls sich selbst |
| [White Queen](/de/cards/white-queen) | 4 | 3/3; Beim Aufdecken schickt sie einen BELIEBIGEN Charakter auf die Hand seines Besitzers zurück |
| [Impundulu](/de/cards/impundulu) | 5 | 3/6; wenn er angreift, fügt er deiner Hand einen Lightning Strike hinzu, der in der nächsten Runde vor dem Kampf abgeworfen wird |

Zehn Einheiten und drei Zauber. Die drei günstigen Karten sind keine Lückenfüller: Dieses Deck braucht das Spielfeld für sich, bevor die Legendäre kommt, weil die Zombies nur *freie* Felder füllen.

## Wie das Deck gewinnt

Drei Karten machen den Schaden — **Boogeyman, Asanbosam und Impundulu** —, und alles andere ist dazu da, sie zu schützen oder ihnen den Weg zu öffnen.

- **Boogeyman** ist eine 7/7 für vier Mana, die beste Rate der Liste, mit einem Haken: Beim Aufdecken zerstört er den Verbündeten mit der niedrigsten Stärke an seinem Ort, sich selbst eingeschlossen. Stellst du ihn in eine leere Lane, tötet er sich selbst; stellst du ihn neben ein [Golden Egg](/de/cards/golden-egg), stirbt das Egg und hinterlässt eine 5/5-Golden Goose auf seinem Feld. Das ist die Combo, auf die der Autor hinweist: zwei Karten, eine 7/7 und eine 5/5.
- **Asanbosam** ist eine 5/5 für drei, und Beim Aufdecken lässt er den Gegner eine zufällige Karte mit geraden Kosten abwerfen.
- **Impundulu** macht aus jedem Angriff einen [Lightning Strike](/de/cards/lightning-strike) auf deiner Hand: wiederholbarer Schaden, solange du ihn vor dem nächsten Kampf ausgibst.

Die **Legendäre** beendet die Partie eher, als dass sie sie eröffnet: Für sieben Mana besetzt *Fülle dein Spielfeld mit Zombies* jedes freie Feld auf einmal. Am stärksten ist sie in der Runde nach einem Tausch, der deine Seite geleert hat, oder in den beiden Orten, um die du nicht gekämpft hast.

## Die „Streiche“

[En Passant](/de/cards/en-passant), [Flying Monkey](/de/cards/flying-monkey) und [White Queen](/de/cards/white-queen) meint der Autor, wenn er davon spricht, jede Runde einen Streich zu spielen.

- **En Passant** bewegt einen Verbündeten und fügt dem Charakter gegenüber Schaden in Höhe seiner Stärke zu: Auf Boogeyman oder einer Golden Goose sind das fünf bis sieben Schaden, die zugleich neu positionieren.
- **Flying Monkey** bewegt JEDEN anderen Charakter auf ein zufälliges Feld an seinem Ort: Er zieht einen gegnerischen Blocker aus der Lane oder bringt deinen eigenen Körper dorthin, wo gekämpft wird. Das Feld ist zufällig, also ist es ein Streich, kein Plan.
- **White Queen** schickt JEDEN Charakter auf die Hand seines Besitzers zurück: Ein gegnerischer Finisher verschwindet für eine Runde, oder dein eigenes Golden Egg kommt zurück, um neben einem zweiten Boogeyman erneut gespielt zu werden.

[Morgiana](/de/cards/morgiana) ist die Unauffällige: An ihrem Ort wird überhaupt kein Beim Aufdecken ausgelöst, für keine der beiden Seiten. Spiel sie dort, wo die Beim-Aufdecken-Fähigkeiten des Gegners am meisten wehtun — aber denk daran, dass sie auch deine stoppt, einschließlich der von Boogeyman.

## Mulligan

Der Hinweis des Autors ist kurz und klar: **Bagheera und Thumbelina sind zusammen mit Bullseye perfekte Starts**, und **Golden Egg plus Boogeyman kann die Partie schon von der Starthand aus entscheiden**. Bagheera auf einem mittleren Feld ist eine 3/3 für ein Mana; Thumbelina ist eine schlichte 2/2, für ein Mana Präsenz auf dem Spielfeld, über die du nicht nachdenken musst.

## Runde für Runde

1. **Runden 1–2: günstig Platz nehmen.** Bagheera in die Mitte, Thumbelina dorthin, wo du einen Kampf erwartest, Bullseye auf alles mit drei Leben.
2. **Runde 3: die erste Bedrohung.** Asanbosam als 5/5 oder das Golden Egg in die Lane, in die Boogeyman in der nächsten Runde kommt.
3. **Runde 4: Boogeyman.** Zum Egg, wenn du es hast, sonst neben den kleinsten Körper, den du verlieren kannst — und nie in eine leere Lane.
4. **Runden 5–6: Druck und Karten.** Impundulu beginnt, Strikes zu produzieren; Mind Palace füllt die Hand auf. Der Autor sagt es ausdrücklich: Ohne Mind Palace gehen dem Deck zu früh die Karten aus.
5. **Runde 7: Legion of the Dead.** Jedes freie Feld wird zu einer 2/2. Zähl die Felder, bevor du sie spielst: Nach einer Runde mit vielen Tauschen ist sie zwei oder drei Körper mehr wert.

## Matchups

Ranked-Daten sind nicht öffentlich, also ist das die Lesart der Listen durch OriginsMeta.

- **Gegen Go-wide-Decks.** Die Zombies kommen auf freie Felder, also bringt dir die Legendäre umso weniger, je breiter der Gegner steht. Nutze Bullseye und Boogeyman, um zuerst das Spielfeld zu öffnen, und heb Flying Monkey für den gebufften Körper auf.
- **Gegen Control-Decks.** Das Abwerfen von Asanbosam und die Strikes von Impundulu sind der Druck, der nicht davon abhängt, dass das Spielfeld überlebt. Halte nach einem Wipe einen Boogeyman zurück: Eine 7/7 für vier ist der schnellste Weg zum Wiederaufbau.
- **Gegen Beim-Aufdecken-Decks** (zum Beispiel [On Reveal Mid Range](/de/decks/community/on-reveal-mid-range-772e), das mit Mulan jedes Beim Aufdecken wiederholt). Hier verdient sich Morgiana ihren Platz: Stell sie an den Ort, an dem der Gegner Fähigkeiten stapelt, nimm hin, dass dort auch deine eigenen Beim-Aufdecken-Fähigkeiten aufhören, und kämpf in den anderen beiden Lanes normal.

## Die Schwächen, in den Worten des Autors

Zwei, von der Seite des Decks: **Mind Palace ist sehr wichtig, damit dir nicht zu früh die Karten ausgehen**, und **Boogeyman braucht ein gültiges Ziel, oder Morgiana**. Das Zweite lohnt sich zu wiederholen: Der 7/7-Körper ist nur gut, wenn an diesem Ort etwas anderes weniger Stärke hat. Das Golden Egg ist die günstigste Versicherung, die Zombies der Legendären die fürs späte Spiel.

## Wie es weitergeht

- Die [Seite des Decks](/de/decks/community/the-trick-or-treat-legion-72c4) hat die Liste mit den Diagrammen, die Notizen des Autors, „Im Deck builder öffnen“ und den Spielcode (KGBLDC…).
- Die Kartenwerte sind die der Demo 2.0 mit [Patch 0.7 vom 29. September 2026](/de/news/patch-0-7), der Bagheera von einem auf zwei Mana und Mind Palace von zwei auf drei angehoben hat.
`,
  },
  "three-pigs-midrange-guide": {
    title: "3 Pigs Mid Range: so spielst du das Midrange-Deck mit Three Not So Little Pigs",
    metaTitle: "Guide zum Deck mit Three Not So Little Pigs",
    excerpt: "Spielplan, Mulligan und Runde für Runde zu 3 Pigs Mid Range, dem Midrange-Deck mit Three Not So Little Pigs an der Spitze, für Ladder und kompetitives Spiel.",
    faq: [
      {
        q: "Welche Legendäre führt 3 Pigs Mid Range an?",
        a: "Three Not So Little Pigs, eine 3/3 für 7 Mana mit Trampeln: Ihr Beim Aufdecken beschwört an jedem anderen Ort ein Not So Little Pig mit Trampeln, also bringt eine Karte einen Körper in jede Lane.",
      },
      {
        q: "Was behältst du im Mulligan?",
        a: "Such immer Bagheera, Ali Baba, Big Bad Wolf und Rumple. Gegen Decks mit gefährlichen Karten mit 4 Leben wie Van Helsing oder Glinda behältst du auch Axe Throw.",
      },
      {
        q: "Wie beendet das Deck eine Partie?",
        a: "Mit En Passant, das einen Verbündeten bewegt und den Charakter gegenüber trifft; mit Ellen Trechend, deren Trampeln den Schaden bis in die Barriere durchdrückt; und mit den Lightning Strikes, die Impundulu bei jedem Angriff deiner Hand hinzufügt.",
      },
      {
        q: "Wie probiere ich das Deck aus?",
        a: "Öffne die Seite des Decks auf OriginsMeta und klicke auf „Im Deck builder öffnen“, oder auf „Spielcode kopieren“, um den Spielcode (KGBLDC…) in Origins einzufügen. Der Deckbuilder prüft die Regel 1 Legendäre + 12 Karten × 2.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Das Deck in einem Absatz

**3 Pigs Mid Range** ist das zweite Deck, das [Davdas](/de/authors/davdas), ein Mitglied des Staffs der Website, am 15. September 2026 auf OriginsMeta veröffentlicht hat. Es ist eine **Midrange**-Liste mit [Three Not So Little Pigs](/de/cards/three-not-so-little-pigs) an der Spitze, für **Ladder** und **kompetitives Spiel** markiert. Die Idee ist einfach: in den ersten Runden das Spielfeld gewinnen, an mindestens einem Ort vorne liegen und dann mit Karten abschließen, die einen Gegner bestrafen, der sich hinter seiner Barriere sicher fühlt. Die vollständige Liste, die Diagramme zur Zusammensetzung und der Spielcode stehen auf der [Seite des Decks](/de/decks/community/3-pigs-mid-range-6311); dieser Guide erklärt, wie du es steuerst. Ein zweiter Guide behandelt [Matchups, wichtige Interaktionen und Conquest](/de/guides/three-pigs-midrange-matchups).

## Die Liste

Fünfundzwanzig Karten: die Legendäre und zwölf Karten, die je zweimal gespielt werden.

| Karte | Kosten | Rolle |
| --- | --- | --- |
| [Three Not So Little Pigs](/de/cards/three-not-so-little-pigs) ★ | 7 | Legendäre: Trampeln, und Beim Aufdecken beschwört sie an jedem anderen Ort ein Not So Little Pig mit Trampeln |
| [Bagheera](/de/cards/bagheera) | 2 | Zwei-Mana-Karte, die wächst, wenn sie auf einem mittleren Feld gespielt wird |
| [Rumple](/de/cards/rumple) | 2 | 2/2, der dir in der nächsten Runde +1 Mana gibt |
| [Axe Throw](/de/cards/axe-throw) | 2 | 4 Schaden an einem beliebigen Charakter |
| [Piglet](/de/cards/piglet) | 2 | Buff Beim Aufdecken für die anderen Verbündeten an seinem Ort |
| [Mind Palace](/de/cards/mind-palace) | 3 | Ziehe 2 Karten |
| [Big Bad Wolf](/de/cards/big-bad-wolf) | 3 | 3/3, der nach jedem Kampf +1/+1 erhält |
| [Wicked Witch of the West](/de/cards/wicked-witch-of-the-west) | 3 | 1/5: Wenn sie Schaden überlebt, fügt sie deiner Hand einen Flying Monkey hinzu und bewegt sich ein Feld nach links |
| [En Passant](/de/cards/en-passant) | 3 | Bewege einen Verbündeten und füge dem Charakter gegenüber Schaden in Höhe seiner Stärke zu |
| [Ali Baba](/de/cards/ali-baba) | 3 | 2/3, der eine Karte zieht, wenn er der gegnerischen Barriere Schaden zufügt |
| [Frog Prince](/de/cards/frog-prince) | 3 | Wähle Beim Aufdecken +3 Stärke oder +3 Leben |
| [Impundulu](/de/cards/impundulu) | 5 | 3/6: Bei jedem Angriff fügt er deiner Hand einen Lightning Strike hinzu |
| [Ellen Trechend](/de/cards/ellen-trechend) | 8 | Trampeln; Beim Aufdecken wächst sie für jede gegnerische Karte an ihrem Ort |

Neun Einheiten und drei Zauber. Alles außer Impundulu, den Pigs und Ellen Trechend kostet drei Mana oder weniger, deshalb nennt der Autor die Kurve „sehr solide“: In den Runden eins bis vier gibt es immer etwas zu spielen.

## Wie das Deck gewinnt

Der Plan, laut der Seite des Decks: in den ersten Runden die Kontrolle über das Spielfeld übernehmen, an mindestens einem Ort vorne liegen und dann mit drei Karten abschließen.

- **En Passant** bewegt einen Verbündeten und fügt dem Charakter gegenüber Schaden in Höhe seiner Stärke zu: Es räumt einem deiner großen Körper den Weg frei oder macht aus einem gewachsenen Big Bad Wolf Removal.
- **Ellen Trechend** hat Trampeln und wächst Beim Aufdecken für jede gegnerische Karte an ihrem Ort: Je mehr der Gegner in eine Lane gesteckt hat, desto härter schlägt sie zu, und Trampeln schickt den überschüssigen Schaden durch den Blocker in die Barriere. Die Seite des Decks nennt sie „einen Finisher an der Grenze zum Verbotenen“.
- **Impundulu** belohnt dich, wenn du die ersten Runden gut gespielt hast, bei jedem Angriff mit einem Lightning Strike. Jeder Strike muss vor dem nächsten Kampf eingesetzt werden, sonst wird er abgeworfen, also plane jede Runde zwei Mana dafür ein.

Die Legendäre ist die Brücke zwischen den beiden Phasen. Für sieben Mana stellt Three Not So Little Pigs mit einer einzigen Karte an jedem der beiden anderen Orte ein Schwein mit Trampeln auf, zusätzlich zu ihrem eigenen 3/3-Körper mit Trampeln. Auf Kurve gespielt, füllt sie das ganze Spielfeld in der Runde, bevor Ellen Trechend ins Spiel kommt.

## Mulligan

Such immer **Bagheera, Ali Baba, Big Bad Wolf und Rumple**: Sie sorgen für einen guten Start auf Kurve und unterstützen die Pigs, die schon im Spiel sind. Gegen Decks mit gefährlichen Karten mit 4 Leben wie Van Helsing oder Glinda behältst du auch **Axe Throw**: Es fügt einem beliebigen Charakter genau vier Schaden zu. Ellen Trechend und Impundulu willst du nicht auf der Starthand: Das Deck findet sie später mit Mind Palace und Ali Baba.

## Runde für Runde

1. **Runden 1–3: das Spielfeld nehmen.** Bagheera auf ein mittleres Feld, dann Rumple oder Piglet, dann eine Karte für drei Mana. Rumple in Runde zwei heißt vier Mana in Runde drei, also ein Wolf plus Bagheera oder eine Witch plus ein Zauber. Die Wicked Witch of the West ist die Mauer des Decks: Mit fünf Leben überlebt sie die meisten frühen Treffer, und jedes Mal, wenn sie das tut, bekommst du einen Flying Monkey auf die Hand und sie rückt ein Feld nach links.
2. **Runden 4–6: eine Lane wählen und Druck machen.** Ali Baba will eine Barriere treffen: Jedes Mal, wenn er das tut, ziehst du. Frog Prince ist entweder eine 5/2, die nach oben tauscht, oder eine 2/5, die eine Lane hält; entscheide, nachdem du gesehen hast, was der Gegner aufgedeckt hat. Impundulu kommt bei fünf Mana und produziert ab seinem ersten Angriff Lightning Strikes.
3. **Runden 7–8: die Finisher.** Die Pigs bei sieben Mana (oder bei sechs mit einem Rumple in der Runde davor), Ellen Trechend bei acht an den Ort, an dem der Gegner die meisten Karten hat. Nutze En Passant in derselben Runde, um eine Bedrohung dorthin zu bewegen, wo sie niemand erwartet, oder um den einen Blocker im Weg zu entfernen.

## Die Kurve halten

Die Seite des Decks ist bei der Hauptschwäche deutlich: „Von der Kurve abzufallen, senkt sein Potenzial stark.“ Die Liste hat keinen Board-Wipe und nichts, was deine Barrieren heilt, also ist jede Runde, die du auslässt, eine Runde, die der Gegner geschenkt bekommt. Zwei Gewohnheiten helfen. Heb Rumple nicht für einen „perfekten“ Zug auf: Das zusätzliche Mana ist früh mehr wert. Und behalte keine Lightning Strikes auf der Hand in der Hoffnung auf ein besseres Ziel: Ein Strike auf eine Barriere sind immer noch drei Schaden, die du sonst verlieren würdest.

## Wie es weitergeht

- Die [Seite des Decks](/de/decks/community/3-pigs-mid-range-6311) hat die Liste mit den Diagrammen zu Manakurve, Sagas und Schlüsselwörtern, die Notizen des Autors, den Knopf „Im Deck builder öffnen“ für den [Deckbuilder](/de/deck-builder) und den Spielcode (KGBLDC…) zum Einfügen in Origins.
- [Matchups, wichtige Interaktionen und Conquest](/de/guides/three-pigs-midrange-matchups) ist der zweite Teil dieses Guides.
- Die Kartenwerte sind die des Demo-Patches vom 21. September 2026, am 22. September im Spiel geprüft, mit den Änderungen von [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026: Bagheera kostet jetzt zwei Mana und Mind Palace drei. Mehrere Karten dieser Liste wurden in 0.6.2 und 0.6.3 verändert, und seit dem 21. September entfernt Frog Prince keine schon bestehenden Buffs mehr: Sieh dir die Balance-Historie auf jeder Kartenseite an.
`,
  },
  "three-pigs-midrange-matchups": {
    title: "3 Pigs Mid Range: Matchups, wichtige Interaktionen und Conquest",
    metaTitle: "Three Not So Little Pigs Deck: die Matchups",
    excerpt: "Teil zwei des Guides zu 3 Pigs Mid Range: die Interaktionen, die Partien gewinnen, die wichtigsten Matchups, typische Fehler und das Conquest-Format.",
    faq: [
      {
        q: "Was macht Ellen Trechend gegen ein breites Spielfeld?",
        a: "Beim Aufdecken wächst sie für jede gegnerische Karte an ihrem Ort und hat Trampeln. Eine Lane, die der Gegner vollgestellt hat, wird so zu ihrem besten Ziel: Der Schaden, der über das Leben des Blockers hinausgeht, trifft die Barriere.",
      },
      {
        q: "Wie spielst du gegen Van-Helsing-Decks?",
        a: "Heb Axe Throw für Van Helsing auf, der vier Leben hat, mach früh Druck, bevor Forbidden Knowledge mit acht Mana kommt, und ziele mit den Lightning Strikes auf Charaktere statt auf Barrieren, solange Boitata auf dem Spielfeld ist.",
      },
      {
        q: "Kann man 3 Pigs Mid Range und Healing Healsing zusammen im Conquest spielen?",
        a: "Ja. Die beiden Decks haben verschiedene Legendäre und teilen nur eine Karte, Ali Baba. Damit unterscheiden sie sich in zwölf einzigartigen Karten, die Legendäre eingeschlossen: mehr als die 8, die die Crimson Cup zwischen je zwei Decks verlangt.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Bevor du anfängst

Dies ist der zweite Teil des Guides zu **3 Pigs Mid Range**, dem Midrange-Deck mit [Three Not So Little Pigs](/de/cards/three-not-so-little-pigs) als Anführer, das [Davdas](/de/authors/davdas) aus dem Staff-Team von OriginsMeta am 15. September 2026 veröffentlicht hat. Der [erste Teil](/de/guides/three-pigs-midrange-guide) behandelt die Liste, den Spielplan, den Mulligan und das Spiel Runde für Runde. Hier geht es um die Interaktionen, die Partien entscheiden, um die Matchups und um das Format, für das das Deck getaggt ist. Die Notizen des Autors stehen auf der [Deckseite](/de/decks/community/3-pigs-mid-range-6311); die Einschätzung der Matchups unten stammt von OriginsMeta und beruht auf den Kartentexten von Patch 0.6.3; die Änderungen des Demo-Patches vom 21. September und von [Patch 0.7](/de/news/patch-0-7) vom 29. September, der Bagheera auf zwei Mana und Mind Palace auf drei angehoben hat, findest du in [MetaShifting](/de/metashifting).

## Fünf Interaktionen, die du kennen solltest

1. **Rumple vor den Finishern.** Rumple gibt dir in der nächsten Runde +1 Mana. Spielst du ihn in Runde fünf, kannst du Three Not So Little Pigs schon in Runde sechs aufdecken, eine ganze Runde bevor der Gegner mit einer Sieben-Mana-Karte rechnet; spielst du ihn in Runde sechs, bringt er Ellen Trechend in Runde sieben aufs Spielfeld.
2. **Die Wicked Witch und ihr Flying Monkey.** Die Witch ist eine 1/5: Sie stirbt selten an einem einzigen Treffer, und jedes Mal, wenn sie Schaden überlebt, bekommst du einen [Flying Monkey](/de/cards/flying-monkey) auf die Hand und sie bewegt sich ein Feld nach links. Die Fähigkeit Beim Aufdecken des Monkey bewegt einen beliebigen anderen Charakter, deinen oder einen gegnerischen, auf ein zufälliges Feld an seinem Ort: Damit ziehst du einen gegnerischen Blocker aus der Lane, durch die du trampelst, oder holst einen Wolf dorthin, wo gekämpft wird.
3. **En Passant auf einem gewachsenen Charakter.** Der Zauber bewegt einen Verbündeten und fügt dem Charakter gegenüber Schaden in Höhe seiner Stärke zu. Auf einem Big Bad Wolf, der schon zweimal gekämpft hat, sind das fünf Schaden plus eine neue Position; auf Ellen Trechend ist es Removal, das ihr Trampeln zugleich dorthin bringt, wo die Barriere am schwächsten ist. Außerdem ist es die Antwort auf einen Blocker, der vor einem deiner Schweine steht.
4. **Die Lightning Strikes von Impundulu.** Jeder Angriff gibt dir einen [Lightning Strike](/de/cards/lightning-strike): zwei Mana für drei Schaden an einem beliebigen Charakter oder einer Barriere, einzusetzen vor dem nächsten Kampf. Das sind wiederholbare, gezielte drei Schaden: genug für die meisten frühen Karten im aktuellen Kartenpool oder ein direkter Treffer auf eine Barriere, wenn das Spielfeld schon dir gehört.
5. **Piglet bei den Schweinen.** Die Fähigkeit Beim Aufdecken von Piglet verstärkt die anderen Verbündeten an seinem Ort. In der Runde nach den Pigs macht ein Piglet neben einem Not So Little Pig einen Charakter mit Trampeln, der härter zuschlägt: Laut Deckseite „unterstützen“ die Mulligan-Karten „die Schweine, die schon auf dem Spielfeld sind“.

## Matchups

Ranked-Daten sind noch nicht öffentlich, daher ist das Folgende eine Lektüre der Listen, keine Win-Rate.

**Gegen Van-Helsing-Control, zum Beispiel [Healing Healsing](/de/decks/community/healing-healsing-9411) vom selben Autor.** An dieses Matchup denkt die Mulligan-Notiz, wenn sie rät, Axe Throw zu behalten: Van Helsing ist ein 3/4, und vier Schaden beseitigen ihn, bevor seine Tools in jedem Kampf kommen. Mach früh Schaden, denn das Control-Deck will acht Mana für Forbidden Knowledge erreichen, das alle Charaktere auf dem Spielfeld zerstört, deine und seine. Leg die Pigs und Ellen Trechend nicht im selben Zeitfenster hin: Heb einen Finisher für die Runde nach dem Wipe auf. Solange Boitata im Spiel ist, wird Zauberschaden an den gegnerischen Barrieren stattdessen deinen zugefügt, also ziele mit den Lightning Strikes auf Charaktere, bis Boitata weg ist.

**Gegen breite Spielfelder (Swarm-Listen, Mulan).** Je breiter der Gegner spielt, desto größer wird Ellen Trechend: Sie wächst für jede gegnerische Karte an ihrem Ort. Lass die Witch als Mauer auf der Lane stehen, die er überflutet, spiel Frog Prince als 2/5 statt als 5/2 und heb Axe Throw für die Karte auf, die die anderen verstärkt. [Mulan](/de/cards/mulan) wiederholt die Beim-Aufdecken-Fähigkeiten ihrer Verbündeten, also ist sie das wichtigste Ziel.

**Gegen andere Midrange-Decks (King Arthur, Robin Hood).** Tempo entscheidet: Wer von der Kurve fällt, verliert. Hier ist Rumple am stärksten, und die Strikes von Impundulu machen auf einem ausgeglichenen Spielfeld den Unterschied. Die Fähigkeit Beim Aufdecken von [Robin Hood](/de/cards/robin-hood) fügt allen Gegnern 2 Schaden zu; das tötet Bagheera, Piglet und einen frisch gespielten Rumple, aber nicht die Witch oder einen als 2/5 gespielten Frog Prince: Bei acht Mana solltest du eine Lane nicht mit kleinen Einheiten überladen. [King Arthur](/de/cards/king-arthur) gibt guten Charakteren Schild, also heb Axe Throw auf, bis der Schild verbraucht ist.

## Fehler, die du vermeiden solltest

- **Die Pigs als Rettung spielen.** Die Legendäre beschwört Schweine auf zufällige Felder der anderen Orte: Sie ist am stärksten, wenn auf diesen Lanes schon ein Wolf oder eine Witch mitkämpft, nicht wenn ohnehin alles verloren ist.
- **Rumple zurückhalten.** Er ist ein 2/2 mit einem Bonus, und der Bonus ist in den Runden zwei bis sechs am meisten wert.
- **Lightning Strikes verschwenden.** Sie werden vor dem nächsten Kampf abgeworfen: Ein Strike in eine Barriere ist besser als ein verlorener Strike.
- **Die Schwächen vergessen.** Die Deckseite nennt sie: kein Massen-Removal und keine Heilung für deine Barrieren. Lass dich nicht auf ein Wettrennen mit einem heilenden Deck ein, außer du liegst auf dem Spielfeld schon vorn.

## Conquest und der Tag „Kompetitiv“

Das Deck ist sowohl für die Ladder als auch für kompetitives Spiel getaggt. Conquest, das Format, das zum ersten Mal bei Big Bob's Playtest Battle gespielt wurde, ist auch das Format der [Crimson Cup](/de/news/crimson-cup-format-check-in) beim Steam Next Fest: Du meldest drei Decks mit verschiedenen Legendären an, mit mindestens 8 einzigartigen Karten Unterschied zwischen je zwei Decks (Regeln vom 24. September 2026). 3 Pigs Mid Range passt ganz natürlich zur anderen Liste desselben Autors, [Healing Healsing](/de/decks/community/healing-healsing-9411): verschiedene Legendäre, und die einzige gemeinsame Karte ist Ali Baba, also unterscheiden sich die beiden in zwölf einzigartigen Karten, die Legendäre eingeschlossen. Der [Deckbuilder](/de/deck-builder) zählt den Unterschied im Turniermodus für dich.
`,
  },
  "healing-healsing-guide": {
    title: "Healing Healsing: So spielst du das Van-Helsing-Control-Deck",
    metaTitle: "Van Helsing Deck-Guide: Healing Healsing",
    excerpt: "Spielplan, Mulligan und Spiel Runde für Runde für Healing Healsing, das Van-Helsing-Control-Deck, das heilt, Karten zieht und das Spielfeld leer räumt.",
    faq: [
      {
        q: "Welche Legendäre führt Healing Healsing an?",
        a: "Van Helsing, ein 3/4 für 4 Mana: Vor jedem Kampf gibt er dir Van Helsing's Tools auf die Hand, falls du die Karte nicht hast. Sie ist eine „Wähle eins“-Karte, die Holy Water, Silver Bullet, Garlic oder Wooden Stake spielt.",
      },
      {
        q: "Was behältst du im Mulligan?",
        a: "Behalte Ali Baba, Baby Bear, Scarecrow, Van Helsing und Spellbook; gegen Aggro auch Jill. Shahrazad und Phuong Hoang willst du in den ersten Runden nicht haben.",
      },
      {
        q: "Wann spielst du Forbidden Knowledge?",
        a: "Bei acht Mana, also ab Runde acht oder neun, am besten in einer Runde, in der der Gegner zuerst aufdeckt: Er legt seine Karten fest, dann zerstört der Zauber alle Charaktere auf dem Spielfeld.",
      },
      {
        q: "Wie gewinnt das Deck, wenn es auch das eigene Spielfeld zerstört?",
        a: "Über Kartenvorteil: Spellbook, Scarecrow und Ali Baba halten die Hand voll, Baby Bear hinterlässt bei seinem Tod Papa Bear, Jekyll wird auf der Hand zu Hyde, und die Heilungen lassen Phuong Hoang wachsen, bis dem Gegner die Antworten ausgehen.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Das Deck in einem Absatz

**Healing Healsing** war das erste auf OriginsMeta veröffentlichte Deck, am 15. September 2026, von [Davdas](/de/authors/davdas) aus dem Staff-Team der Website. Es ist eine **Control**-Liste mit [Van Helsing](/de/cards/van-helsing) als Anführer, getaggt für die **Ladder**. Der Plan: die frühen Runden überstehen und dabei Value sammeln, den Schaden wegheilen, während [Phuong Hoang](/de/cards/phuong-hoang) mit jeder Heilung wächst, und das Spielfeld mit [Forbidden Knowledge](/de/cards/forbidden-knowledge) leer räumen, sobald du acht Mana hast. Die vollständige Liste, die Diagramme zur Zusammensetzung und den Spielcode findest du auf der [Deckseite](/de/decks/community/healing-healsing-9411); dieser Guide erklärt, wie du es spielst. Ein zweiter Guide behandelt [Matchups, wichtige Interaktionen und die Fehler, die du vermeiden solltest](/de/guides/healing-healsing-matchups).

## Die Liste

Fünfundzwanzig Karten: die Legendäre plus zwölf Karten in je zwei Exemplaren.

| Karte | Kosten | Rolle |
| --- | --- | --- |
| [Van Helsing](/de/cards/van-helsing) ★ | 4 | Legendär: Vor dem Kampf gibt er dir Van Helsing's Tools auf die Hand, falls du die Karte nicht hast |
| [Baby Bear](/de/cards/baby-bear) | 2 | Fügt Gegnern Schaden zu, die deiner Barriere schaden; Beim Tod: Papa Bear auf deine Hand |
| [Scarecrow](/de/cards/scarecrow) | 2 | Beim Aufdecken: Ziehe eine Karte |
| [Shahrazad](/de/cards/shahrazad) | 2 | 1/4: heilt 1 Schaden an deiner Barriere, jedes Mal wenn eine Karte auf deine Hand kommt |
| [Ali Baba](/de/cards/ali-baba) | 3 | 2/3, der eine Karte zieht, wenn er der gegnerischen Barriere Schaden zufügt |
| [Jill](/de/cards/jill) | 3 | 2/4: heilt 2 Schaden an deiner Barriere, jedes Mal wenn sie Schaden erleidet |
| [Spellbook](/de/cards/spellbook) | 4 | Für den Rest der Partie zu Beginn jeder Runde ein zufälliger Zauber auf die Hand |
| [Phuong Hoang](/de/cards/phuong-hoang) | 4 | Wiedergeburt, Bewegen; erhält +1/+1, jedes Mal wenn ein Verbündeter oder eine Barriere geheilt wird |
| [Jekyll](/de/cards/jekyll) | 4 | Beim Aufdecken heilt er 3; ist er nach dem Kampf noch auf der Hand, wird er zu Hyde, einem 5/3 mit Trampeln |
| [Searing Light](/de/cards/searing-light) | 4 | 4 Schaden an einem Gegner und 4 Heilung für deine Barriere an diesem Ort |
| [Boitata](/de/cards/boitata) | 5 | 5/5: Schaden durch Zauber und Fähigkeiten an deinen Barrieren wird stattdessen der gegnerischen Barriere zugefügt |
| [Tin Woodman](/de/cards/tin-woodman) | 6 | Beim Aufdecken heilt er 8 an einem anderen Charakter oder einer Barriere an seinem Ort |
| [Forbidden Knowledge](/de/cards/forbidden-knowledge) | 8 | Zerstöre alle Charaktere |

Neun Einheiten und drei Zauber; fast alles kostet zwischen zwei und vier, darüber stehen Boitata, Tin Woodman und Forbidden Knowledge. Drei Karten ziehen, fünf heilen, eine räumt das Spielfeld leer.

## Wie das Deck gewinnt

Der Plan von der Deckseite in vier Schritten:

1. **Die ersten Runden kontrollieren** und dabei mit Spellbook und Ali Baba schnell Value sammeln.
2. **Runde acht oder neun erreichen** und Forbidden Knowledge spielen, um die Initiative zu übernehmen. Versuch, die Karte in einer Runde zu spielen, in der der Gegner zuerst aufdeckt, damit seine Karten auf dem Spielfeld liegen, wenn der Zauber abgehandelt wird.
3. **Über Kartenvorteil und Value gewinnen.** Dem gegnerischen Deck sollten die Ressourcen ausgehen, während du noch genug Heilung hast, um den Schaden von Phuong Hoang zu steigern.
4. **Die Kontrolle behalten.** Die zusätzlichen Karten erlauben dir, das Spielfeld lange zu halten.

Zwei Motoren lassen das funktionieren. Der erste sind **Karten, die auf deine Hand kommen**: Van Helsing gibt dir vor jedem Kampf seine Tools, Spellbook zu Beginn jeder Runde einen Zauber, Scarecrow und Ali Baba ziehen, und jede dieser Karten heilt dank Shahrazad 1. Der zweite ist die **Heilung**: Jede Heilung, vom einzelnen Punkt von Shahrazad bis zu den acht von Tin Woodman, gibt Phuong Hoang +1/+1. Eine Phuong, die schon ein paar Runden auf dem Spielfeld liegt, ist die eigentliche Bedrohung des Decks, und sie hat außerdem die Schlüsselwörter Wiedergeburt und Bewegen (siehe ihre Kartenseite).

## Van Helsing's Tools

Die Legendäre selbst ist ein 3/4 für vier Mana. Entscheidend ist die Karte, die er vor jedem Kampf hinzufügt, wenn du sie nicht schon hast: [Van Helsing's Tools](/de/cards/van-helsings-tools), seit Patch 0.6.2 kostenlos, lässt dich einen von vier Effekten wählen.

- [Holy Water](/de/cards/holy-water): Entferne alle Fähigkeiten von einem beliebigen Charakter.
- [Silver Bullet](/de/cards/silver-bullet): Schaden an einem beliebigen Charakter.
- [Garlic](/de/cards/garlic): Betäube einen beliebigen Charakter.
- [Wooden Stake](/de/cards/wooden-stake): Zerstöre einen beliebigen beschädigten Charakter.

„Falls du die Karte nicht hast“ ist die Klausel, die du dir merken musst: Setz die Tools in jeder Runde ein, sonst hört Van Helsing auf, sie dir zu geben. Wooden Stake ist das Einzelziel-Removal, das der Liste laut Deckseite sonst fehlt: Beschädige einen Charakter mit dem Schaden von Baby Bear, mit Searing Light oder mit der Silver Bullet und pfähle ihn dann.

## Mulligan

Behalte **Ali Baba, Baby Bear, Scarecrow, Van Helsing und Spellbook**. Gegen aggressive Decks behalte auch **Jill**: Sie heilt 2 Schaden an deiner Barriere, jedes Mal wenn sie Schaden erleidet. Shahrazad und Phuong Hoang helfen in den ersten Runden nicht: Sie sind die Belohnung, nicht der Aufbau, also schick sie zurück.

## Runde für Runde

1. **Runden 1–3: Aufbau.** Scarecrow oder Baby Bear in Runde zwei, Spellbook oder Ali Baba in Runde drei. Spellbook ist der beste Zug in Runde drei: Ab dann beginnst du jede Runde mit einem zusätzlichen Zauber, und Shahrazad macht aus jedem davon eine Heilung.
2. **Runden 4–5: Van Helsing und die ersten Heilungen.** Van Helsing in Runde vier oder Jekyll, um eine beschädigte Einheit oder Barriere zu heilen. Phuong Hoang kommt, sobald mindestens eine Heilquelle auf dem Spielfeld ist. Boitata in Runde fünf: Ab dann wird Schaden durch Zauber und Fähigkeiten an einer deiner Barrieren stattdessen der gegnerischen Barriere an diesem Ort zugefügt.
3. **Runden 6–7: stabilisieren.** Die acht Heilpunkte von Tin Woodman auf die Barriere unter Druck, Searing Light auf die größte Bedrohung, die Tools in jedem Kampf.
4. **Runde 8 oder 9: Forbidden Knowledge.** Alles stirbt, auf beiden Seiten. Deine Seite verliert weniger: Baby Bear hinterlässt Papa Bear auf deiner Hand, ein auf der Hand behaltener Jekyll ist schon zu Hyde geworden, die Tools kommen vor dem nächsten Kampf zurück, und du hast die ganze Partie über mehr Karten gezogen als der Gegner.

## Wie es weitergeht

- Die [Deckseite](/de/decks/community/healing-healsing-9411) hat die Liste mit den Diagrammen zur Manakurve und zu den Schlüsselwörtern, die Notizen des Autors, den Button „Im Deck builder öffnen“ für den [Deckbuilder](/de/deck-builder) und den Spielcode (KGBLDC…) zum Einfügen in Origins.
- [Matchups, wichtige Interaktionen und Fehler, die du vermeiden solltest](/de/guides/healing-healsing-matchups) ist der zweite Teil dieses Guides.
- Die Kartenwerte sind die des Demo-Patches vom 21. September 2026, am 22. September im Spiel geprüft, mit den Änderungen von [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026: Spellbook kostet jetzt vier Mana, und die Zauber, die es hinzufügt, können nicht mehr Spellbook sein. Scarecrow, Van Helsing's Tools und weitere Karten dieser Liste wurden in 0.6.2 und 0.6.3 geändert, und seit dem 21. September kann Wooden Stake auch Charaktere mit vollem Leben als Ziel wählen: Die Balance-Historie steht auf jeder Kartenseite.
`,
  },
  "healing-healsing-matchups": {
    title: "Healing Healsing: Matchups, wichtige Interaktionen und Fehler, die du vermeiden solltest",
    metaTitle: "Van Helsing Deck Healing Healsing: Matchups",
    excerpt: "Teil zwei des Guides zu Healing Healsing: Heil- und Zieh-Interaktionen, die wichtigsten Matchups, die Fehler, die gegen Aggro verlieren, und Conquest.",
    faq: [
      {
        q: "Was ist die stärkste Interaktion von Healing Healsing?",
        a: "Shahrazad mit Van Helsing und Spellbook: Die Tools vor jedem Kampf und der Zauber zu Beginn jeder Runde heilen dank Shahrazad jeweils 1, und jede Heilung gibt Phuong Hoang +1/+1.",
      },
      {
        q: "Wie spielst du gegen 3 Pigs Mid Range?",
        a: "Füll keine Lane auf: Ellen Trechend wächst für jede gegnerische Karte an ihrem Ort. Heb Boitata für die Lightning Strikes auf, heile den Trampel-Schaden der Schweine weg und spar dir Forbidden Knowledge für die Runde, nachdem die Pigs gekommen sind.",
      },
      {
        q: "Womit verlierst du mit diesem Deck Partien?",
        a: "Wenn du Forbidden Knowledge zu früh spielst, Van Helsing's Tools auf der Hand liegen lässt, sodass er keine neuen mehr gibt, und Phuong Hoang spielst, bevor es etwas zu heilen gibt.",
      },
    ],
    body: `
**Vor Patch 0.7 geschrieben.** Dieses Deck und dieser Guide wurden vor [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 veröffentlicht: Liste und Spielplan sind für 0.7 nicht maßgeblich. Die Kartentabellen zeigen die heutigen Kosten und Werte.

## Bevor du anfängst

Dies ist der zweite Teil des Guides zu **Healing Healsing**, dem Van-Helsing-Control-Deck, das [Davdas](/de/authors/davdas) aus dem Staff-Team von OriginsMeta am 15. September 2026 als erstes Community-Deck der Website veröffentlicht hat. Der [erste Teil](/de/guides/healing-healsing-guide) behandelt die Liste, den Spielplan, den Mulligan und das Spiel Runde für Runde. Hier geht es um die Interaktionen, die Partien entscheiden, um die Matchups und um die Fehler, die am meisten kosten. Die Notizen des Autors stehen auf der [Deckseite](/de/decks/community/healing-healsing-9411); die Einschätzung der Matchups unten stammt von OriginsMeta und beruht auf den Kartentexten von Patch 0.6.3; die Änderungen des Demo-Patches vom 21. September und von [Patch 0.7](/de/news/patch-0-7) vom 29. September, der Spellbook auf vier Mana angehoben hat, findest du in [MetaShifting](/de/metashifting).

## Fünf Interaktionen, die du kennen solltest

1. **Shahrazad und alles, was dir eine Karte auf die Hand gibt.** [Shahrazad](/de/cards/shahrazad) heilt 1 Schaden an deiner Barriere an ihrem Ort, sobald eine Karte auf deine Hand kommt. Van Helsing gibt dir vor jedem Kampf seine Tools, Spellbook zu Beginn jeder Runde einen Zauber, Scarecrow und Ali Baba ziehen, der Tod von Baby Bear bringt Papa Bear. Mit Shahrazad und Van Helsing auf dem Spielfeld heilst du in jeder einzelnen Runde, ohne eine Karte auszugeben.
2. **Jede Heilung füttert Phuong Hoang.** [Phuong Hoang](/de/cards/phuong-hoang) erhält +1/+1, sobald ein Verbündeter oder eine Barriere geheilt wird. Die Fähigkeit Beim Aufdecken von Tin Woodman ist eine einzige Heilung von acht Punkten, also ein +1/+1; die vielen kleinen Heilungen von Shahrazad sind für Phuong mehr wert als eine große.
3. **Jekyll und Hyde.** Die Fähigkeit Beim Aufdecken von [Jekyll](/de/cards/jekyll) heilt 3 an einem anderen Charakter oder einer Barriere an seinem Ort. Bleibt er nach dem Kampf auf der Hand, wird er zu [Hyde](/de/cards/hyde), einem 5/3 mit Trampeln, und ein Hyde auf der Hand wird wieder zu Jekyll: Dieselbe Karte ist Heiler oder Finisher, je nachdem, wann du sie spielst.
4. **Boitata gegen Burn.** Würde ein Zauber oder eine Fähigkeit einer deiner Barrieren Schaden zufügen, fügt [Boitata](/de/cards/boitata) diesen Schaden stattdessen der gegnerischen Barriere an diesem Ort zu. Gegen Decks, die Partien mit Lightning Strike oder Searing Light beenden, macht Boitata ihre Reichweite zu deiner.
5. **Die Familie von Baby Bear.** [Baby Bear](/de/cards/baby-bear) fügt jedem Gegner Schaden zu, der deiner Barriere an seinem Ort schadet, und gibt dir bei seinem Tod [Papa Bear](/de/cards/papa-bear) auf die Hand; Papa Bear trifft härter und bringt bei seinem Tod [Mama Bear](/de/cards/mama-bear), und Mama Bear zerstört Gegner, die deiner Barriere schaden. Drei Körper für eine Karte mit zwei Mana, und genau das, was du auf dem Spielfeld haben willst, wenn Forbidden Knowledge abgehandelt wird.

## Matchups

Ranked-Daten sind noch nicht öffentlich, daher ist das Folgende eine Lektüre der Listen, keine Win-Rate.

**Gegen 3 Pigs Mid Range (das [andere Deck](/de/decks/community/3-pigs-mid-range-6311) desselben Autors) und andere Midrange-Listen.** Ihr Finisher, Ellen Trechend, wächst für jede gegnerische Karte an ihrem Ort: Verteile deine Einheiten, statt eine Lane zu stapeln. Gegen die Lightning Strikes von Impundulu ist Boitata genau das richtige Mittel. Axe Throw fügt vier Schaden zu, genau das Leben von Van Helsing: Rechne damit, dass er beantwortet wird, und verlass dich beim Removal nicht nur auf ihn. Die Pigs kommen mit sieben Mana und füllen jede Lane mit Trampeln: Für diese Runde hebst du Forbidden Knowledge auf, eine Runde später.

**Gegen Aggro und breite Decks.** An dieses Matchup denkt die Mulligan-Notiz, wenn sie rät, Jill zu behalten: Jedes Mal, wenn sie Schaden erleidet, heilt sie 2 an deiner Barriere. Baby Bear bestraft jeden Angreifer, der durchkommt, Jekyll heilt, was zählt, die acht Punkte von Tin Woodman setzen eine Barriere zurück. Jag die gegnerischen Einheiten nicht einzeln mit den Tools; stabilisiere die Barriere, erreiche acht Mana und lass Forbidden Knowledge das ganze Spielfeld abräumen.

**Gegen andere Control-Decks.** Kartenvorteil entscheidet, und dieses Deck zieht mehr als die meisten: Spellbook ist die Karte, die du schützen und zuerst spielen solltest. Heb Hyde für eine Lane auf, die leer geblieben ist, und spar dir Holy Water für eine Legendäre auf, deren Fähigkeit das gegnerische Deck trägt, etwa [Mulan](/de/cards/mulan), die die Beim-Aufdecken-Fähigkeiten ihrer Verbündeten wiederholt, oder die [Queen of Hearts](/de/cards/queen-of-hearts), die ihre Beim-Tod-Fähigkeiten wiederholt.

## Fehler, die du vermeiden solltest

- **Forbidden Knowledge zu früh spielen.** Der Rat auf der Deckseite: Warte auf eine Runde, in der der Gegner zuerst aufdeckt, damit seine Karten auf dem Spielfeld liegen, wenn der Zauber abgehandelt wird. Ein Wipe in eine leere Lane sind acht verschwendete Mana.
- **Die Tools auf der Hand liegen lassen.** Van Helsing gibt sie dir nur, wenn du sie nicht hast. Setz sie in jedem Kampf ein, auch auf ein kleines Ziel.
- **Phuong Hoang vor den Heilungen.** Ein 2/3 für vier Mana, das nichts zum Wachsen hat, ist eine schwache Karte; dieselbe Karte ist, wenn Shahrazad und Spellbook schon liegen, die Siegbedingung. Die Mulligan-Notiz zählt sie zusammen mit Shahrazad zu den Karten, die du nicht in der Starthand behalten solltest.
- **Kartenziehen als Luxus behandeln.** Die Deckseite warnt, dass es „sehr schmerzhaft sein kann, Forbidden Knowledge nicht zu finden, wenn du es brauchst“: Mit Scarecrow, Ali Baba und Spellbook findest du es, also spiel sie früh, auch wenn das Spielfeld sie nicht verlangt.

## Conquest

Das Deck ist nur für die Ladder getaggt, passt aber in ein Conquest-Line-up: eine andere Legendäre als 3 Pigs Mid Range und nur eine gemeinsame Karte, Ali Baba, also unterscheiden sich die beiden Listen in zwölf einzigartigen Karten, die Legendäre eingeschlossen: mehr als die 8, die die [Crimson Cup](/de/news/crimson-cup-format-check-in) zwischen je zwei Decks verlangt. Der [Deckbuilder](/de/deck-builder) zählt den Unterschied im Turniermodus.
`,
  },
  "roadmap-and-dates": {
    title: "Roadmap und Termine: von der Demo bis zum Release",
    metaTitle: "Origins TCG: Roadmap und Release-Termine",
    excerpt: "Alle bestätigten Termine von Origins TCG, vom ersten Steam-Post über das Update zur Demo 2.0 bis zur Crimson Cup beim Next Fest, dazu die Pläne für 2027.",
    faq: [
      {
        q: "Wann erscheint Origins TCG auf Steam?",
        a: "Die Steam-Shopseite nennt Q4 2026 als Release, ohne genaueres Datum. Die Demo bekam ihr erstes großes Update am 21. September 2026, und der Ranglisten-Modus startet mit dem Steam Next Fest vom 19. bis 26. Oktober 2026.",
      },
      {
        q: "Wann ist die Crimson Cup?",
        a: "Vom 19. bis 25. Oktober 2026, während des Steam Next Fest: fünf regionale Qualifikationen vom 19. bis 22., dann die Playoffs am 24. und das Finale am 25. Die Preise sind 10.000 Dollar wert und enthalten eine exklusive 1/1-Promokarte.",
      },
      {
        q: "Gibt es eine Mobile-Version von Origins TCG?",
        a: "Noch nicht. Die Mobile-Version und das Öffnen von Packs auf dem Smartphone sind für 2027 angekündigt. Im November 2025 gab es einen Soft Launch im App Store in ausgewählten Regionen, bevor das Studio den Kartenhandel zu Steam verlegte.",
      },
      {
        q: "Wann ist die kostenlose Demo erschienen?",
        a: "Am 15. und 16. Juli 2026 auf Steam, mit exklusiven Sammelobjekten für Demo-Spieler. Die Ranked-Ladder kam später, mit Patch 0.6.1 am 14. August 2026.",
      },
    ],
    body: `
## Vor der Demo

- **August 2025.** Koin Games und Immutable kündigen „Project O“ an, ein kompetitives TCG für Mobilgeräte mit echtem Besitz der Karten.
- **November 2025.** Soft Launch im App Store in ausgewählten Regionen (Version 0.1.0).
- **Anfang 2026.** Das Studio verlegt den Kartenhandel auf den Steam-Marktplatz und gibt das eigenständige On-Chain-Modell auf.
- **März 2026.** Der CEO wird mit physischen Metallkarten gefilmt. Ein Produkt oder einen Termin gibt es dazu nicht.

## 2026, Monat für Monat

| Datum | Was passiert ist |
| --- | --- |
| 6. Mai | Die Steam-Seite geht online, die Wunschliste öffnet |
| 3. Juni | Der offizielle Discord öffnet für alle |
| 15.–16. Juli | Kostenlose Demo auf Steam mit exklusiven Sammelobjekten |
| 21. Juli | Erste Zahlen: über 1.000 Spieler, über 13.000 Partien, Median-Spielzeit 1 Std. 51 Min. |
| 22. Juli | AMA mit CEO Tim Jooste und Head of Design Kevin Lambert |
| 24. Juli | Erstes Turnier der Demo |
| 24.–26. Juli | Origins auf der Card Party in Fort Lauderdale |
| 7. August | Erster Playtest der „Demo 2.0“: 5 neue Decks, über 70 Karten, Deckbau |
| 14. August | [Patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414): Ranked-Ladder |
| 19. August | AMA zum Creator Program |
| 21. August | [Patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961): 23 Karten neu ausbalanciert |
| 27. August | [Patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 28. August | Big Bob's Playtest Battle, erstes Conquest-Turnier, über 130 Anmeldungen |
| 9. September | [Turnier zum Next Fest angekündigt](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 10. September | Kickstarter-AMA auf dem offiziellen Discord: Alpha Edition, Seltenheiten, Grading, Handel, VIP-Rabatt |
| 17. September | [Der CEO von Koin Games nennt den Kickstarter-Termin](https://x.com/TimothyJooste/status/2100700207285445011): Die Kampagne zur Alpha Edition startet am 27. Oktober |
| 21. September | [Erstes großes Demo-Update](https://store.steampowered.com/news/app/4429430/view/1844115010502611): neue Oberfläche und neues Spielfeld, Tutorial für Sammler, Test-Packs, Balance-Änderungen, vorläufige Kartenliste der Crimson Cup |
| 24. September | [Regeln der Crimson Cup](/de/news/crimson-cup-format-check-in): Conquest mit drei Decks, Check-in |
| 29. September | [Patch 0.7](/de/news/patch-0-7), der letzte Balance-Patch vor der Crimson Cup: Rework von Twister Toss, Bagheera, Mind Palace und Spellbook kosten eins mehr, Orte bekommen eine Seltenheit, 13 Sprachen |

## Wie es weitergeht

- **19.–26. Oktober 2026.** Steam Next Fest: Der Ranglisten-Modus startet in der Demo, mit exklusiven Ranked-Belohnungen.
- **19.–25. Oktober 2026.** Die Crimson Cup, das Turnier zum Steam Next Fest: fünf regionale Qualifikationen vom 19. bis 22., dann Playoffs und Finale. Preise im Wert von 10.000 Dollar, darunter eine exklusive 1/1-Promokarte.
- **27. Oktober 2026.** Der Kickstarter zur Alpha Edition, angekündigt vom CEO von Koin Games am 17. September; auch das Hauptmenü der Demo zeigt ihn als „Coming soon – Oct 27“. Alles dazu in unserem [Kickstarter-Guide](/de/guides/origins-tcg-kickstarter).
- **Q4 2026.** Release auf Steam laut Shopseite, die kein genaueres Datum nennt.
- **2027.** Mobile-Version und Öffnen von Packs auf dem Smartphone. In den AMAs hat das Team einen vollständigen Launch mit dem kompletten Aufgebot an Legendären Karten beschrieben, darunter King Arthur, Dracula, Winnie-the-Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein und Sherlock Holmes.

Die Termine stammen aus den offiziellen Steam-Posts, dem Discord des Studios und, beim Kickstarter, aus dem Post des CEO von Koin Games und dem Menü der Demo selbst. Wir aktualisieren diese Seite, wenn sie sich ändern.
`,
  },
  "collector-economy": {
    title: "Zwei Arten zu sammeln: So funktioniert die Wirtschaft von Origins",
    metaTitle: "Origins TCG: So funktioniert das Sammlersystem",
    excerpt: "Kompetitive Karten sind kostenlos. Sammlerkarten sind limitiert, gegradet und auf Steam handelbar. Hier steht, was bestätigt ist und was noch nicht.",
    faq: [
      {
        q: "Machen Sammlerkarten ein Deck stärker?",
        a: "Nein. Jede kompetitive Karte bekommst du im Spiel, und die Sammlerversionen sind limitierte Editionen derselben Karten: nummeriert, digital gegradet und handelbar, aber sie spielen sich genau gleich.",
      },
      {
        q: "Was ist die Alpha Edition?",
        a: "Myths & Legends: Alpha Edition ist die erste Sammleredition und nur im Vorverkauf erhältlich: Booster-Packs mit fünf Karten, Displays mit 24 Packs und Cases mit sechs Displays, in sieben Seltenheitsstufen, von Collectible Card (in jedem Pack) bis Storybook (1 von 1.200 Packs), laut der offiziellen Vorregistrierungsseite. Ist die Auflage verkauft, werden keine weiteren Alpha-Displays produziert.",
      },
      {
        q: "Wo kann man Origins-Karten handeln?",
        a: "Auf dem Steam-Community-Markt und angebundenen Marktplätzen, sobald das vollständige Spiel erscheint. Die Sammelobjekte, die du heute in der Demo verdienst, werden dann handelbar.",
      },
      {
        q: "Was ist ein God Pack?",
        a: "Ein seltenes Pack, in dem jede Karte Legendär oder besser ist. Sammlerversionen haben außerdem eine Note: Auf der Card Party im Juli 2026 gab das Team jedem, der eine Alternate Art 10/10 zog, einen Slab.",
      },
    ],
    body: `
## Die Trennung

Origins trennt zwei Dinge, die die meisten Kartenspiele vermischen:

1. **Spielen.** Jede kompetitive Karte bekommst du im Spiel. Nichts, was du kaufst, macht dein Deck stärker.
2. **Sammeln.** Limitierte Versionen der Karten gibt es in nummerierten Auflagen, sie sind **digital gegradet** und können mit anderen Spielern gekauft, verkauft und getauscht werden.

Die Ladebildschirme des Studios selbst sprechen von „real collecting in digital“ und „two ways to collect“.

## Was bestätigt ist

- **Gegradete Karten.** Sammlerversionen haben eine Note; auf der Card Party im Juli gab das Team jedem einen Slab, der eine **Alternate Art 10/10** zog. Es gibt niedrigere Noten und verschiedene Serien, die unterschiedlich viel wert sind.
- **God Packs.** Seltene Packs, in denen jede Karte Legendär oder besser ist.
- **Alpha Edition.** Die erste Sammleredition, „Myths & Legends: Alpha Edition“, ist nur im Vorverkauf erhältlich: Booster-Packs mit fünf Karten, Displays mit 24 Packs und Cases mit sechs Displays, mit sieben Seltenheitsstufen, von Collectible Card (in jedem Pack) bis Storybook (1 von 1.200 Packs), laut der [offiziellen Vorregistrierungsseite](https://founder.origins-tcg.com). Ist die Auflage verkauft, werden keine weiteren Alpha-Displays produziert. Das Alpha-Set war eines der Themen des Kickstarter-AMA vom 10. September 2026 auf dem offiziellen Discord.
- **Handel auf Steam.** Karten und versiegelte Produkte werden auf dem Steam-Community-Markt und angebundenen Marktplätzen gehandelt, sobald das vollständige Spiel erscheint. Die Sammelobjekte, die du heute in der Demo verdienst, werden dann handelbar.
- **Mobile später.** Das Öffnen von Packs auf dem Smartphone ist für 2027 geplant.

## Was noch nicht bestätigt ist

- Preise in Euro für Packs und Displays außerhalb des Alpha-Vorverkaufs.
- Marktplatzgebühren über die üblichen Gebühren von Steam hinaus.
- Ob die physischen Metallkarten, die der CEO im März 2026 gezeigt hat, je verkauft werden.

## Warum das für das Meta wichtig ist

Weil Sammlerkarten kosmetisch sind, muss sich eine Tier-List nur um die Karte selbst kümmern, nie um die Version. OriginsMeta wird die Preise auf dem Steam-Markt ab dem ersten Tag verfolgen, an dem dort Objekte gelistet sind, damit das Sammeln dieselben Daten hat wie das Spielen.
`,
  },
  "steam-next-fest-2026": {
    title: "Origins TCG beim Steam Next Fest 2026: Demo 2.0, Termine und das Turnier",
    metaTitle: "Origins TCG beim Steam Next Fest 2026: Termine",
    excerpt: "Origins TCG beim Steam Next Fest vom 19. bis 26. Oktober 2026: Ranked in der Demo, die Crimson Cup vom 19. bis 25. Oktober, die Preise und die Anmeldung.",
    faq: [
      {
        q: "Wann ist das Steam Next Fest im Oktober 2026?",
        a: "Von Montag, 19. Oktober, 10:00 Uhr pazifischer Zeit (13:00 Uhr an der US-Ostküste, 18:00 Uhr in Großbritannien, 19:00 Uhr in Mitteleuropa) bis Montag, 26. Oktober 2026. Origins TCG ist mit seiner kostenlosen Demo dabei, die am 21. und 29. September aktualisiert wurde, und mit dem Festival startet der Ranglisten-Modus.",
      },
      {
        q: "Wann ist das Turnier von Origins TCG?",
        a: "Vom 19. bis 25. Oktober 2026: fünf Qualifikationen mit je 512 Plätzen zwischen dem 19. und dem 22. (zwei AMER, zwei EMEA, eine APAC), dann die Playoffs am 24. und das Finale am 25.",
      },
      {
        q: "Kann ich von Europa aus an einer Qualifikation teilnehmen?",
        a: "Ja. Laut Koin Games kannst du an jeder Qualifikation teilnehmen, egal wo du wohnst, du sollst dich aber nur für die anmelden, an denen du wirklich spielen kannst.",
      },
      {
        q: "Kostet das etwas?",
        a: "Nein. Die Demo ist auf Steam kostenlos, und die Anmeldung zum Turnier läuft über den offiziellen Discord. Origins TCG ist free-to-compete: Jede kompetitive Karte verdienst du durchs Spielen.",
      },
      {
        q: "Was ist das Conquest-Format?",
        a: "Bei der Crimson Cup reicht jeder Spieler drei Decks ein, mit mindestens 8 einzigartigen Karten Unterschied zwischen je zwei davon. Die Decklists bleiben bis zu den Top 4 verborgen: Wenn du eines der Decks deines Gegners bannst, siehst du nur seine Legendäre. In Best-of-Five-Matches gibt es keinen Bann, und du musst mit allen drei Decks gewinnen. Koin Games hat das Format zum ersten Mal bei Big Bob's Playtest Battle am 28. August getestet.",
      },
    ],
    body: `
## Die zwei Termine, die du dir merken solltest

- **Steam Next Fest, Ausgabe Oktober 2026: 19.–26. Oktober.** [Valves Festival der spielbaren Demos](https://store.steampowered.com/sale/nextfest) läuft von Montag, 19. Oktober, 10:00 Uhr pazifischer Zeit (13:00 Uhr an der US-Ostküste, 18:00 Uhr in Großbritannien, 19:00 Uhr in Mitteleuropa) bis Montag, 26. Oktober. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) ist mit seiner kostenlosen Demo dabei, die am 21. September ihr erstes großes Update bekommen hat: Mit dem Festival schaltet Koin den **Ranglisten-Modus** frei, mit exklusiven Ranked-Belohnungen.
- **Turnier von Origins TCG: 19.–25. Oktober.** Koin Games nennt es „unser bisher größtes Turnier“: ein mehrtägiges Event in der Abfolge Qualifikation → Playoffs → Finale, komplett online und im Spiel.

## Was die Demo zum Festival mitbringt

Das große Demo-Update, das im August in drei geschlossenen Playtests getestet wurde (Patches [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) und [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), alle in unserem [MetaShifting](/de/metashifting) verfolgt), kam früher als erwartet, am [21. September 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): neue Oberfläche und neues Spielfeld, ein Tutorial für Sammler, Test-Packs zum Öffnen, neue Sprachaufnahmen, Balance-Änderungen und die vorläufige Kartenliste der Crimson Cup, sodass du schon Decks fürs Turnier bauen kannst. Der Fortschritt wird aus der Demo oder dem Playtest übernommen, je nachdem, wo du weiter bist.

Die Decks, Karten und Bosse der Playtests sind jetzt in der kostenlosen Demo, und der Deckbau auch: Jeder baut sein eigenes Deck aus 25 Karten (eine Legendäre plus zwölf Karten in je zwei Exemplaren). Unsere [Kartendatenbank](/de/cards) enthält die 122 Karten, die am 22. September im Spiel geprüft wurden.

Mit dem Start des Steam Next Fest schaltet Koin den **Ranglisten-Modus** frei, der „mit exklusiven Ranked-Belohnungen kommt“ (Steam-Post vom 21. September). Die Playtests hatten Divisionen bis Grandmaster und eine weltweite Rangliste: Was bisher bestätigt ist, steht in unserem [Ranked-Guide zu Origins TCG](/de/guides/origins-tcg-ranked). Jede Änderung veröffentlichen wir am Tag, an dem sie kommt.

## Das Turnier Schritt für Schritt

1. **Qualifikationen, 19.–22. Oktober.** Fünf Stück, mit je 512 Plätzen und jeweils 32 Weiterkommenden: AMER am 19. um 19:00 Uhr EST, EMEA am 20. um 19:00 Uhr CEST, AMER am 21. um 21:00 Uhr EST, APAC am 22. um 19:00 Uhr SGT und EMEA am 22. um 19:00 Uhr CEST, dazu 96 Wildcards. Die AMER-Qualifikation vom 19. und die EMEA-Qualifikation vom 22. kamen am 5. Oktober dazu, als die offizielle Kalendergrafik auch die AMER-Qualifikation vom 21. auf 21:00 Uhr EST verlegte, mit 32 statt 64 Weiterkommenden, und die Wildcards von 128 auf 96 senkte ([unser Artikel](/de/news/crimson-cup-prizepool-qualifiers)). In den Worten von Koin: „Du kannst an JEDER Qualifikation teilnehmen, egal wo du wohnst.“ Wähl die mit der Uhrzeit, die dir passt, und melde dich nur für die an, die du wirklich spielst; du kannst an mehr als einer teilnehmen.
2. **Playoffs und Finale, 24.–25. Oktober.** Die Playoff-Phase hat 256 Plätze am 24. (10:00 Uhr EST / 16:00 Uhr CEST / 22:00 Uhr SGT), und vier Spieler kommen daraus ins Finale am 25. um 10:00 Uhr EST (15:00 Uhr CET / 22:00 Uhr SGT). Achte auf die Uhren: Europa verlässt in der Nacht nach dem 24. die Sommerzeit, während die USA bis zum 1. November dabei bleiben, daher fällt dieselbe Startzeit der US-Ostküste am Sonntag auf europäischen Uhren eine Stunde früher. Content-Creator bekommen Wildcard-Einladungen direkt in die Playoffs (frag auf dem Discord).
3. **Format.** Offiziell, aus den Ankündigungen vom 9. und 24. September: **Conquest mit drei Decks**, mit mindestens 8 einzigartigen Karten Unterschied zwischen je zwei Decks; die Decklists bleiben bis zu den Top 4 verborgen, wenn du also eines der Decks deines Gegners bannst, siehst du nur seine Legendäre. **Matches im Best-of-Three (Bo3), großes Finale im Best-of-Five (Bo5)**: Im Best-of-Five gibt es keinen Bann, und du musst mit allen drei Decks gewinnen. Details in [unserem Artikel zu den Regeln](/de/news/crimson-cup-format-check-in).
4. **Check-in.** Er öffnet zwei Stunden vor jeder Qualifikation und schließt fünf Minuten vor dem Start, zusammen mit der Abgabe der Decks; danach vergibt ein kurzes Zeitfenster die freien Plätze an Spieler auf der Warteliste, nach dem Prinzip „wer zuerst kommt“. Ohne Check-in kannst du nicht spielen: Für die EMEA-Qualifikation um 19:00 Uhr CEST checkst du zwischen 17:00 und 18:55 Uhr ein.
5. **Welche Version.** Gespielt wird in der Haupt-Demo, nur mit den Karten, die es dort gibt: Übe dort. Der Playtest bekommt weitere Updates und wird sich von der Turnierversion unterscheiden. Der letzte Balance-Patch vor dem Turnier, [Patch 0.7](/de/news/patch-0-7), kam am 29. September 2026, drei Wochen vor der ersten Qualifikation.
6. **Preise.** **Preise im Wert von 10.000 Dollar**, in Koins eigenen Worten, aufgeteilt auf Geld, Sammelobjekte und exklusive Promokarten. Die Aufteilung kam am 5. Oktober: Der Sieger bekommt eine Dracula-Promokarte 1/1, zwei Cases mit Booster-Displays und 1.500 Dollar in bar; Platz 2 eine Dracula-Promokarte 1/8, ein Case und 750 Dollar; Platz 3 und 4 eine Promokarte 1/8, zwei Booster-Displays und 350 Dollar; die Top 8 ein Booster-Display, eine Promokarte 1/8 und 125 Dollar; die Top 16 ein Booster-Display und eine Finalist-Plus-Karte; die Top 32 zehn Packs und eine Finalist-Karte; danach 8, 4 und 2 Packs bis zu den Top 256 ([die vollständige Tabelle](/de/news/crimson-cup-prizepool-qualifiers#preise)). Das Turnier heißt **Crimson Cup**: Der Name steht auf Koins eigener Grafik, er ist kein Spitzname der Community.
7. **Pool der Orte.** Sieben Orte sind beim Turnier nicht dabei, in Koins Worten „sehr RNG-lastig“: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum und Nostradamus' Call. Die Raum-Partien der Demo verwenden diesen Pool schon: Übe dort. Was jeder Ort macht, steht auf unserer Seite [Orte](/de/locations).
8. **Trainingsturniere.** Koin veranstaltet wöchentliche Trainingsturniere ohne Einsatz, angekündigt auf Discord, damit du vor dem Cup gegen echte Menschen statt gegen Bots spielst.

Die Anmeldung läuft über den [offiziellen Discord](https://discord.gg/originstcg).

## So bereitest du dich in fünf Schritten vor

1. [Installiere die kostenlose Demo auf Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) und spiel die Missionen: Sie bringen dir die drei Lanes und die gleichzeitigen Züge bei.
2. Lies [Origins TCG in fünf Minuten erklärt](/de/guides/origins-tcg-explained) und die [Kartendatenbank](/de/cards): Die Werte sind die des Demo-Patches vom 21. September, Karte für Karte im Spiel geprüft, dazu die Änderungen von Patch 0.7 vom 29. September.
3. Bau deine drei Conquest-Decks in unserem [Deckbuilder](/de/deck-builder): Er warnt bei zwei Decks mit derselben Legendären und zählt die Karten, die sich zwischen den Decks unterscheiden. Schritt für Schritt, mit echten Community-Decks: [So baust du ein Conquest-Line-up](/de/guides/origins-tcg-conquest).
4. Schau dir die [von der Community veröffentlichten Decks](/de/decks) an: Jede Liste kommt mit Diagrammen zur Zusammensetzung, den Notizen des Autors, einem Button, der sie im Deckbuilder öffnet, und dem Spielcode zum Einfügen in Origins. Veröffentliche dein eigenes Deck mit einem Guide, damit andere Spieler es bewerten können.
5. Verfolge die [News](/de/news): Jede Ankündigung fassen wir innerhalb eines Tages zusammen, mit Link zur Quelle.

## So berichtet OriginsMeta über die Woche

Unser Plan, Stand 25. September 2026: Während des Festivals veröffentlichen wir jeden Tag eine News, die Turnierdecks mit ihren Diagrammen zur Zusammensetzung, sobald die Listen öffentlich sind (ab den Top 4), und nach dem Finale der Crimson Cup am 25. Oktober die erste Tier-List von OriginsMeta, gebaut auf den Turnierergebnissen und der Spitze der Ranked-Ladder. Quellen: die offiziellen Steam-Posts vom 4. August, 25. August, [9. September](https://store.steampowered.com/news/app/4429430/view/1843481262690278), [21. September](https://store.steampowered.com/news/app/4429430/view/1844115010502611), [29. September](https://store.steampowered.com/news/app/4429430/view/1844751498235283) und [5. Oktober 2026](https://store.steampowered.com/news/app/4429430/view/1845383656394214) sowie der [Zeitplan des Steam Next Fest](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    title: "Ist Origins TCG pay-to-win? Free-to-compete erklärt",
    metaTitle: "Ist Origins TCG pay-to-win? Free-to-compete",
    excerpt: "Koin Games bewirbt Origins TCG als erstes Free-to-compete-Kartenspiel mit null Pay-to-win. Was du für Geld wirklich bekommst, und die ehrlichen Haken.",
    faq: [
      {
        q: "Ist Origins TCG kostenlos?",
        a: "Ja. Die Demo ist seit dem 15. Juli 2026 kostenlos auf Steam, und das vollständige Spiel wird als free-to-compete vorgestellt: Jede Karte, die du zum Antreten brauchst, verdienst du durchs Spielen.",
      },
      {
        q: "Muss ich Packs kaufen, um zu gewinnen?",
        a: "Nein. Laut der offiziellen Steam-Seite trittst du allein mit deinem Können an, mit null Pay-to-win. Bezahlte Packs enthalten limitierte, digital gegradete Sammlerversionen der Karten, keine zusätzliche Stärke.",
      },
      {
        q: "Wofür bezahlt man dann?",
        a: "Für Sammlerprodukte: limitierte, nummerierte und gegradete Versionen der Karten, verkauft in Packs, Displays und Cases, die man mit anderen Spielern kaufen, verkaufen und tauschen kann.",
      },
      {
        q: "Kann ich meine Karten verkaufen?",
        a: "Laut Koin Games werden Karten und versiegelte Produkte auf dem Steam-Community-Markt und angebundenen Marktplätzen handelbar sein, sobald das vollständige Spiel erscheint. Auf Steam gehen die Erlöse auf dein Steam-Guthaben.",
      },
      {
        q: "Gibt es einen Battle Pass oder bezahlte Fortschritts-Boosts?",
        a: "Bis September 2026 wurde nichts dergleichen angekündigt. Wenn sich das ändert, aktualisieren wir diese Seite.",
      },
    ],
    body: `
## Die kurze Antwort

Nein, so ist es angelegt. Auf seiner Steam-Seite beschreibt Koin Games Origins TCG als „the first free-to-compete TCG“: Du trittst allein mit deinem Können an („compete on skill alone (zero pay-to-win)“) und spielst um limitierte, digital gegradete Karten, die du kaufen, verkaufen und tauschen kannst. Einer der offiziellen Ladebildschirme sagt es in zwei Wörtern: **zero pay-to-win**.

Das ist das Versprechen. Diese Seite erklärt, was es in der Praxis bedeutet und wo ehrliche Zweifel bleiben.

## Was „free-to-compete“ bedeutet

Origins trennt zwei Dinge, die die meisten digitalen Kartenspiele vermischen:

1. **Antreten.** Jede Karte, die du für ein kompetitives Deck brauchst, bekommst du im Spiel. Die Decks aus dem Playtest und die [Kartendatenbank](/de/cards) enthalten nichts, was du dir erkaufen kannst.
2. **Sammeln.** Limitierte Versionen derselben Karten gibt es in nummerierten Auflagen, sie sind **digital gegradet** und können gekauft, verkauft und getauscht werden. Sie sind kosmetisch: Eine gegradete Mulan spielt sich genau wie die Mulan, die du dir erspielt hast.

Das Pack, für das du bezahlst, ist also ein Sammlerprodukt, kein Stärkeprodukt. Das erste, die „Myths & Legends: Alpha Edition“, gibt es nur im Vorverkauf, als Booster mit fünf Karten, Displays mit 24 Packs und Cases mit sechs Displays, mit sieben Seltenheitsstufen; siehe [So funktioniert die Wirtschaft von Origins](/de/guides/collector-economy).

## Der Vergleich

In Hearthstone oder MTG Arena enthalten die Packs, die du kaufst, die Karten, mit denen du spielst, also verkürzt Geld den Weg zur vollständigen Sammlung. In Origins führt der Weg zu einem kompetitiven Deck übers Spielen; Geld kauft das Sammlerregal daneben. Auf diesem Unterschied beruht das Versprechen „zero pay-to-win“.

## Die ehrlichen Haken

- **Zeit kostet trotzdem.** Kostenlose Karten verdienst du durchs Spielen; wie viele Partien es braucht, um ein kompetitives Deck zu vervollständigen, ist noch nicht veröffentlicht. Den Deckbau gibt es in der Demo seit dem Update vom 21. September: Wir messen das während des Steam Next Fest (19.–26. Oktober), wenn der Ranglisten-Modus öffnet, und veröffentlichen die Zahlen.
- **Details stehen noch aus.** Preise außerhalb des Alpha-Vorverkaufs, Marktplatzgebühren über die üblichen Gebühren von Steam hinaus und mögliche Fortschritts-Boosts sind nicht angekündigt. Nichts deutet auf einen Battle Pass hin, aber nichts schließt ihn aus.
- **Marktwert ist kein Bargeld.** Verkäufe auf dem Steam-Community-Markt gehen auf dein Steam-Guthaben. Ob angebundene Marktplätze eine echte Auszahlung erlauben, ist nicht bestätigt.
- **Packs sind zufällig.** Unter den Inhaltsbeschreibungen nennt die Steam-Seite „In-game purchases“ und „Chance based in-game purchases“: Was ein Sammlerpack enthält, entscheidet der Zufall, auch wenn es nie die Stärke eines Decks verändert.

## Warum das für das Meta wichtig ist

Weil Sammlerversionen kosmetisch sind, muss eine Tier-List nur die Karte bewerten, nie die Edition, und ein Deck, das ein Spieler ohne Ausgaben auf OriginsMeta veröffentlicht, ist so stark wie das jedes anderen. Wir halten diese Seite mit jeder offiziellen Aussage aktuell; Quellen: die Steam-Seite von Origins TCG, die offiziellen Ladebildschirme und die AMAs von Koin Games im Juli und August 2026.
`,
  },
  "play-the-demo": {
    title: "So lädst du die Demo von Origins TCG auf Steam herunter und spielst sie",
    metaTitle: "So spielst du die Demo von Origins TCG auf Steam",
    excerpt: "Die kostenlose Demo in fünf Schritten: Anforderungen, Download, Sprache, erste Partien, Belohnungen für Demo-Spieler und das Update vom 21. September.",
    faq: [
      {
        q: "Ist die Demo von Origins TCG kostenlos?",
        a: "Ja. Sie ist seit dem 15. Juli 2026 kostenlos auf Steam, für Windows und macOS.",
      },
      {
        q: "In welchen Sprachen gibt es die Demo?",
        a: "In dreizehn seit Patch 0.7, dem Demo-Update vom 29. September 2026: Englisch, Französisch, Italienisch, Deutsch, Spanisch (Spanien), Japanisch, Koreanisch, Polnisch, Portugiesisch (Brasilien), Portugiesisch (Portugal), Russisch, vereinfachtes Chinesisch und Spanisch (Lateinamerika). Die Steam-Seite, gelesen am 30. September 2026, nennt dieselben 13 für die Oberfläche, mit vollständiger Sprachausgabe nur auf Englisch.",
      },
      {
        q: "Was brauche ich, um sie zu starten?",
        a: "Mindestens Windows 10 64-Bit mit Intel i3-6100 oder AMD FX-6300, 8 GB RAM, GTX 750 Ti oder R9 270X und 2 GB Speicherplatz; auf dem Mac macOS 10.14 oder neuer mit Apple M1 oder Intel i5 Dual-Core und einer Metal-fähigen GPU.",
      },
      {
        q: "Bringt die Demo etwas für das vollständige Spiel?",
        a: "Koin Games hat angekündigt, dass Demo-Spieler exklusive Sammelobjekte verdienen, die mit dem Release des vollständigen Spiels handelbar werden.",
      },
      {
        q: "Was brachte das Update vom 21. September?",
        a: "Das erste große Update der Demo: neue Oberfläche und neues Spielfeld, ein Tutorial für Sammler, Test-Packs, neue Sprachaufnahmen, Balance-Änderungen und die vorläufige Kartenliste der Crimson Cup, mit den Decks, Karten und dem Deckbau aus den Playtests im August. Der Ranglisten-Modus startet mit dem Steam Next Fest vom 19. bis 26. Oktober 2026.",
      },
    ],
    body: `
## Was du bekommst

Die Demo von Origins TCG ist seit dem **15. Juli 2026** auf Steam, kostenlos, für Windows und macOS. Am 25. September 2026 stand sie auf „Sehr positiv“: 96 % von 184 Rezensionen. Eine Partie dauert etwa sieben Minuten: Beide Spieler ziehen gleichzeitig an drei Orten, die aus einem Pool von über hundert Orten stammen, wechseln und die Regeln des Spielfelds verändern. Die Demo enthält das Tutorial, Missionen gegen Bosse mit eigener KI und Online-Partien.

Sprachen: Seit [Patch 0.7](/de/news/patch-0-7) vom 29. September 2026 unterstützt das Spiel **13 Sprachen**: Englisch, Französisch, Italienisch, Deutsch, Spanisch (Spanien), Japanisch, Koreanisch, Polnisch, Portugiesisch (Brasilien), Portugiesisch (Portugal), Russisch, vereinfachtes Chinesisch und Spanisch (Lateinamerika). Die Steam-Seite, gelesen am 30. September 2026, nennt dieselben 13 für die Oberfläche, mit vollständiger Sprachausgabe **nur auf Englisch**.

## Systemanforderungen

| | Minimum | Empfohlen |
| --- | --- | --- |
| Windows | Windows 10 64-Bit, Intel i3-6100 oder AMD FX-6300, 8 GB RAM, GTX 750 Ti oder R9 270X | Windows 11 64-Bit, Intel i5-8400, 16 GB RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 oder Intel i5 Dual-Core 2,5 GHz, Metal-fähige GPU | macOS 12 oder neuer, Apple M1 Pro, 16 GB RAM |
| Speicherplatz | 2 GB | 2 GB |

## Fünf Schritte

1. **Installiere Steam** und melde dich an (ein kostenloses Konto reicht).
2. **Öffne die [Seite der Origins TCG Demo](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** und klicke auf den Download-Button der Demo; oder such in Steam nach „Origins TCG“ und wähle die Demo. Die Installation dauert ein paar Minuten.
3. **Stell das Spiel auf Deutsch.** Öffne im Spiel die Einstellungen (im englischen Menü Settings → Change Language) und wähle „Deutsch“. Startet die Demo in einer anderen Sprache und findest du das Menü nicht, geht es auch über Steam: Rechtsklick auf das Spiel in der Bibliothek, Eigenschaften, Sprache. Die Sprachausgabe ist auf Englisch; die anderen Sprachen übersetzen die Oberfläche und die Texte.
4. **Spiel das Tutorial** und dann die Missionen: Sie bringen dir die drei Lanes, die gleichzeitigen Züge und die Schlüsselwörter bei: Beim Aufdecken (On Reveal), Beim Tod (On Death), Erstschlag (First Strike), Doppelangriff (Double Attack) und Todesberührung (Deathtouch). Unser [Fünf-Minuten-Guide](/de/guides/origins-tcg-explained) erklärt dasselbe als Text.
5. **Geh online** und probier die vorgefertigten Decks aus. Wenn du mehr willst, lies die [von der Community veröffentlichten Decks](/de/decks), bau sie im [Deckbuilder](/de/deck-builder) nach und prüf die aktuellen Kartenwerte in der [Kartendatenbank](/de/cards) (Demo 2.0 mit Patch 0.7 vom 29. September 2026).

## Was Demo-Spieler freischalten

Im Launch-Post vom Juli hat Koin Games gesagt, dass Demo-Spieler **exklusive Sammelobjekte** verdienen, die mit dem Release des vollständigen Spiels handelbar werden. Setz das [Hauptspiel](https://store.steampowered.com/app/4429430/Origins_TCG/) auf Steam auf deine Wunschliste: Die Shopseite nennt Q4 2026 als Release.

## Was das Update vom 21. September geändert hat

Die Demo bekam ihr erstes großes Update am [21. September 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): neue Oberfläche und neues Spielfeld, ein Tutorial für Sammler, Test-Packs, neue Sprachaufnahmen, Balance-Änderungen und die vorläufige Kartenliste der Crimson Cup, zusammen mit den Decks, Karten und dem Deckbau aus den geschlossenen Playtests im August. Dein Fortschritt aus der Demo oder dem Playtest wird übernommen, je nachdem, wo du weiter bist. Der Ranglisten-Modus startet mit dem Steam Next Fest (19.–26. Oktober 2026): Alles zu den Terminen, dem Turnier und der Vorbereitung steht auf unserer [Seite zum Steam Next Fest 2026](/de/guides/steam-next-fest-2026). Playtests der größeren Builds werden auf dem [offiziellen Discord](https://discord.gg/originstcg) angekündigt, und bisher konnte jeder mitmachen, der wollte.

Quellen: die Seiten von Origins TCG und Origins TCG Demo auf Steam (gelesen am 25. und 30. September 2026) und die offiziellen Steam-Posts vom 16. Juli, 4. August, 21. September und 29. September 2026.
`,
  },
  "origins-tcg-kickstarter": {
    title: "Kickstarter von Origins TCG: Termin, Vorregistrierung, Alpha Edition und was wir wissen",
    metaTitle: "Origins TCG Kickstarter: Termin, Vorregistrierung, Alpha",
    excerpt: "Kickstarter am 27. Oktober 2026, bestätigt vom CEO von Koin Games. Vorregistrierung offen: 15 % Rabatt für 1 Dollar Anzahlung, erstattbar; Alpha nur vorab.",
    faq: [
      {
        q: "Wann startet der Kickstarter von Origins TCG?",
        a: "Am 27. Oktober 2026. Der CEO von Koin Games, Tim Jooste, hat den Termin am 17. September 2026 auf X genannt („back the Alpha Edition Kickstarter (Oct 27th)“), und das Hauptmenü der Demo zeigt den Kickstarter als „Coming soon – Oct 27“, neben „Preregister for 15% off“. Keine der beiden Quellen nennt die Uhrzeit, zu der die Kampagne startet: Wir ergänzen sie hier, sobald Koin sie bekannt gibt.",
      },
      {
        q: "Was bringt die Anzahlung von 1 Dollar?",
        a: "Den VIP-Status mit 15 % Rabatt zum Start. Laut der offiziellen Seite ist die Anzahlung vor dem Start vollständig erstattbar.",
      },
      {
        q: "Was ist die Alpha Edition?",
        a: "Origins Myths & Legends Alpha Edition: Sammler-Packs mit 5 Karten und mindestens einer garantierten Rare oder besser, Booster-Displays mit 24 Packs und Cases mit 6 Displays. Displays und Cases gibt es nur im Vorverkauf, und die Auflage wird nicht wiederholt.",
      },
      {
        q: "Muss ich den Kickstarter unterstützen, um anzutreten?",
        a: "Nein. Origins ist free-to-compete: Ranked braucht keinen Kauf, und die Demo auf Steam ist kostenlos. Beim Kickstarter geht es ums Sammeln, nicht um Stärke.",
      },
      {
        q: "Wo werden die Karten gehandelt?",
        a: "Auf dem Steam-Community-Markt und den daran angebundenen Marktplätzen, laut der offiziellen Seite. Das Öffnen von Packs auf dem Smartphone ist für 2027 geplant.",
      },
    ],
    body: `## Der Termin: 27. Oktober, bestätigt von Koin Games {#datum}

Der Kickstarter zur **Myths & Legends Alpha Edition** startet am **27. Oktober 2026**. Der CEO von Koin Games, **Tim Jooste**, schrieb „back the Alpha Edition Kickstarter (Oct 27th)“ in einem [Post auf X vom 17. September 2026](https://x.com/TimothyJooste/status/2100700207285445011), den der Account des Studios geteilt hat. Die Demo sagt dasselbe: Am **25. September 2026** zeigte ihr Hauptmenü den Kickstarter-Kasten mit **„Coming soon – Oct 27“** und **„Preregister for 15% off“**, während der Ladebildschirm für die Alpha Edition wirbt. Keine der beiden Quellen nennt die Uhrzeit, zu der die Kampagne startet, und am 28. September 2026 erwähnte die [Vorregistrierungsseite](https://founder.origins-tcg.com) den Termin noch nicht: Uhrzeit und Link zur Kampagne ergänzen wir, sobald Koin sie veröffentlicht.

*Update vom 28. September 2026: Der Termin ist vom CEO von Koin Games bestätigt. Das Update vom 25. September hatte den in der Demo gezeigten Termin, die Themen des AMA aus der offiziellen Ankündigung und die korrigierte Zeitleiste ergänzt.*

## Was angekündigt wurde

Koin Games betreibt eine offizielle Seite **Kickstarter Early Access** unter [founder.origins-tcg.com](https://founder.origins-tcg.com). Am **10. September 2026** beantwortete das Team in einem AMA auf dem offiziellen Discord Fragen zur Kampagne; die Ankündigung vom nächsten Tag nennt die Themen: digitales Grading, Seltenheit der Karten, wie der Handel funktioniert, Fehldrucke, God Packs, 1/1-Karten aus Turnieren, was das Alpha-Set ist, die Stufen des Kickstarters und wie man mit 15 % Rabatt VIP wird. Unsere [News zum AMA](/de/news/kickstarter-ama-pre-registration) fasst alles zusammen.

## Vorregistrierung: 15 % Rabatt für 1 Dollar

- Wer mit einer **Anzahlung von 1 Dollar** **VIP** wird, bekommt **15 % Rabatt zum Start**.
- Die Anzahlung ist **vor dem Start vollständig erstattbar**, wie die offizielle Seite zweimal schreibt.
- Die Vorregistrierung verpflichtet dich zu keinem Pledge: Sie sichert dir nur den Early-Bird-Preis.

## Die Alpha Edition

Die Produktlinie heißt **Origins Myths & Legends Alpha Edition**:

| Produkt | Inhalt |
| --- | --- |
| Sammler-Boosterpack | 5 Sammelkarten, mindestens eine Rare oder besser garantiert |
| Booster-Display | 24 Sammler-Packs |
| Booster-Case | 6 Booster-Displays |

Für die Alpha Edition gilt: **Displays und Cases gibt es nur im Vorverkauf**. Ist diese Auflage verkauft, werden keine weiteren Alpha-Displays oder -Cases produziert. Das ist dieselbe Logik wie bei der Erstauflage eines physischen Kartenspiels, angewandt auf eine digitale Sammlung.

## Handel und Besitz

Karten können auf dem **Steam-Community-Markt** und den daran angebundenen Marktplätzen gekauft, verkauft und getauscht werden. Koin ist Anfang dieses Jahres auf den Steam-Marktplatz umgestiegen, statt auf ein unabhängiges On-Chain-System zu setzen. Das Öffnen von Packs auf dem Smartphone ist für **2027** geplant.

## Free-to-compete bleibt kostenlos

Wer den Kickstarter unterstützt, kauft Sammelobjekte, keine Stärke: Ranked in Origins braucht keinen Kauf, und die Demo auf Steam ist kostenlos. In [Ist Origins TCG pay-to-win?](/de/guides/is-origins-tcg-pay-to-win) steht, wie die kompetitive Seite und die Sammlerseite getrennt bleiben.

## Zeitleiste

- 15. Juli 2026: kostenlose Demo auf Steam.
- 21. September 2026: erstes großes Update der Demo.
- 19.–26. Oktober 2026: Steam Next Fest, mit dem Ranglisten-Modus in der Demo und der Crimson Cup (19.–25. Oktober).
- 27. Oktober 2026: Kickstarter zur Alpha Edition (Termin vom CEO von Koin Games am 17. September genannt und im Menü der Demo angezeigt).
- Q4 2026: Release auf Steam laut Shopseite.
- 2027: Mobile.

## Was du jetzt tun kannst

1. Setz das Spiel auf Steam auf deine Wunschliste und spiel die Demo.
2. Wenn du den Rabatt zum Start willst, [registriere dich auf founder.origins-tcg.com vor](https://founder.origins-tcg.com), mit der erstattbaren Anzahlung.
3. Verfolge den offiziellen Discord für die Uhrzeit des Starts und den Link zur Kampagne: Wir ergänzen beides hier am selben Tag.

Quellen: [offizielle Vorregistrierungsseite](https://founder.origins-tcg.com), [Steam-Seite](https://store.steampowered.com/app/4429430/Origins_TCG/), die Ankündigung des AMA auf dem offiziellen Discord (11. September 2026), der [Post des CEO von Koin Games auf X](https://x.com/TimothyJooste/status/2100700207285445011) (17. September 2026) und das Hauptmenü der Demo (gelesen am 25. September 2026).`,
  },
  "streaming-tools": {
    title: "Origins TCG streamen: OBS-Overlay und !deck-Befehl im Chat",
    metaTitle: "OBS-Overlay und !deck-Befehl für Origins TCG",
    excerpt: "Kostenlose Tools für Streamer von Origins TCG: OBS-Overlay mit deinem Deck, !deck-Befehl für den Twitch-Chat, Kurzlinks, Deckbilder und das LIVE-Badge.",
    faq: [
      {
        q: "Muss ich etwas installieren?",
        a: "Nein. Das Overlay ist eine Webseite, die du in OBS als Browserquelle hinzufügst, und der Chat-Befehl ist eine Zeile für deinen Twitch-Bot, die auf OriginsMeta verweist.",
      },
      {
        q: "Mit welchen Bots funktioniert der !deck-Befehl?",
        a: "Mit Nightbot, StreamElements und Fossabot. Dein OriginsMeta-Konto gibt dir für jeden die fertige Zeile, mit deinem Link schon drin.",
      },
      {
        q: "Wie groß sollte das Overlay in OBS sein?",
        a: "360 × 1000 Pixel für das vertikale Overlay und 1600 × 300 für das horizontale. Der Hintergrund ist transparent.",
      },
      {
        q: "Ändert sich das Overlay, wenn ich ein neues Deck veröffentliche?",
        a: "Ja, wenn du den Link aus deinem Konto verwendest: Es zeigt immer das Deck, das du zuletzt veröffentlicht hast, und lädt es jede Minute neu.",
      },
    ],
    body: `
## Was du bekommst

OriginsMeta hat kostenlose Tools für alle, die Origins TCG streamen oder Videos dazu machen. Sie funktionieren mit den Decks, die du auf der Website veröffentlichst, und du musst nichts installieren:

- ein **OBS-Overlay** mit deiner Decklist auf transparentem Hintergrund;
- einen **!deck-Befehl** für deinen Twitch-Chat, der mit deinem Deck antwortet;
- einen **Kurzlink** und ein **Deckbild** für Beschreibungen, Thumbnails und Stories;
- ein **LIVE-Badge** neben deinem Namen, während du Origins TCG streamst.

## Bevor du anfängst

1. Melde dich bei OriginsMeta an (Discord oder E-Mail, ohne Passwort) und veröffentliche ein Deck aus dem [Deckbuilder](/de/deck-builder).
2. Öffne [dein Konto](/de/account#stream-tools): Der Bereich „Stream-Tools“ enthält die Overlay-Links und den Chat-Befehl, schon mit deinem Benutzernamen ausgefüllt.

Die Links in deinem Konto folgen immer **dem Deck, das du zuletzt veröffentlicht hast**: Veröffentliche ein neues, und Overlay und Befehl wechseln innerhalb einer Minute dazu. Um ein bestimmtes Deck zu zeigen, öffne seine Seite und nutze das Menü „Für Streamer“: Bei deinen eigenen Decks enthält es Overlay und Befehl nur für dieses Deck.

## OBS-Overlay

1. Kopiere einen der beiden Overlay-Links aus deinem Konto: vertikal oder horizontal.
2. In OBS: Quellen → + → Browser, dann den Link einfügen.
3. Stell die Größe ein: **360 × 1000** für das vertikale Overlay, **1600 × 300** für das horizontale.

Der Hintergrund ist transparent, und das Overlay lädt das Deck jede Minute neu, sodass es aktuell bleibt, ohne dass du die Quelle anfassen musst. Es zeigt den Namen des Decks, deinen Namen, die Legendäre und die zwölf Karten mit ihren Kosten. Die Sprache ist die der Seite, von der du den Link kopiert hast: Um sie zu ändern, setz am Ende des Links lang= auf en, it, es, fr, pt oder de.

## Der !deck-Befehl im Chat

Dein Konto enthält die Zeile für jeden Bot, mit deinem Link schon drin:

- **Nightbot** und **StreamElements**: Gib die Zeile als Kanalinhaber oder Moderator in deinen Twitch-Chat ein;
- **Fossabot**: Leg in seinem Dashboard einen Befehl an und nutze die Zeile als Antwort.

Gibt es !deck auf deinem Kanal schon, schreib edit statt add. Ab dann antwortet !deck im Chat mit einer Zeile: Name des Decks, Legendäre, Kurzlink und Spielcode zum Einfügen in Origins TCG. Der Code fehlt nur, wenn eine Karte des Decks noch keine offizielle ID hat.

## Kurzlink und Deckbild

Jedes Deck hat einen Kurzlink, originsmeta.com/d/ gefolgt von der Adresse des Decks: Sag ihn im Stream oder setz ihn in die Videobeschreibung, und er öffnet das Deck in der Sprache der Zuschauer. Dein Profil hat auch einen, originsmeta.com/@ gefolgt von deinem Benutzernamen.

Im Menü „Für Streamer“ jedes Decks kannst du außerdem ein PNG-Bild mit der Legendären, den zwölf Karten mit ihren Kosten und dem Kurzlink herunterladen: 16:9 (1280 × 720) für Thumbnails, 9:16 (1080 × 1920) für Stories und Shorts.

## LIVE-Badge

Creator, Autoren, Pro-Spieler und Staff, die ihren Twitch-Kanal in ihr öffentliches Profil eintragen, bekommen auf der Website ein **LIVE-Badge** neben ihrem Namen, während sie Origins TCG streamen: in der Kategorie des Spiels auf Twitch oder mit einem Titel, der das Spiel nennt. Ihre Streams erscheinen außerdem auf der [Live-Seite](/de/live) und im Verzeichnis [Creator und Autoren](/de/creators). Die Rollen vergibt das Staff-Team von OriginsMeta: Wenn du regelmäßig Origins TCG streamst, schreib uns auf Discord.
`,
  },
};
