import type { NewsCopy } from "./news-fr";

/**
 * Testi tedeschi delle news (20/10/2026, tedesco sesta lingua del sito), per slug, con gli stessi campi del francese
 * (`NewsCopy` di news-fr.ts): `title` (H1, entro 110 caratteri), `metaTitle` (con "Origins TCG" entro 60),
 * `description` (120–158), `summary`, `body` in Markdown, `highlights` e `faq` quando l'articolo li ha nelle altre
 * lingue. news.ts li unisce (`withTranslations`) e si rifiuta di compilare se a una news manca il tedesco o se il
 * tedesco ha un campo che l'articolo non ha. Regole, glossario (quello del gioco, letto il 20/10/2026) e SEO in
 * docs/tedesco.md; controlli in newsMeta.test.ts (lunghezze, link con /de/, ancore, paragrafo "Update vom …").
 */
export const deText: Record<string, NewsCopy> = {
  "soul-crimson-cup-interview": {
    title: "Gespräch mit SouL, Finalist des Crimson Cup: die Aufstellung gegen Van Helsing und die Zukunft von Origins TCG",
    metaTitle: "SouL im Interview: Finalist des Crimson Cup von Origins TCG",
    description:
      "SouL, Zweiter beim Crimson Cup von Origins TCG, über seine Aufstellung aus Pigs, Mulan und Merlin gegen Van Helsing und seine drei Listen zum Kopieren.",
    summary:
      "SouL ist beim Crimson Cup Zweiter geworden, gestoppt erst im großen Finale von CoachCrono. In diesem Gespräch erzählt er von der Aufstellung, die er mit Nimer und Lord Von gebaut hat, um Van Helsing zu schlagen, warum Merlin seiner Meinung nach einen Nerf braucht und warum Origins TCG alles hat, um zu wachsen. Seine drei Listen sind jetzt ein Turnierdeck, mit den Spielcodes zum Kopieren.",
    body: `SouL ist einer der **drei Italiener, die die Finals des [Crimson Cup](/de/analytics/crimson-cup) erreicht haben**, des bisher größten Turniers von Origins TCG: Er ist ungeschlagen durch das Winner-Bracket gegangen und wurde erst im großen Finale gestoppt, von [CoachCrono](/de/news/crimson-cup-coachcrono-wins). Auf OriginsMeta hat er die Rolle Pro: Seine Kanäle und Decks findest du auf [seinem Profil](/de/u/soulontwitch).

Wir kennen uns seit Jahren, aus anderen kompetitiven Spielen, und das hier ist weniger ein Interview als ein Gespräch unter Fans, aufgenommen in den Tagen direkt nach dem Finale, an dem Tag, an dem der [Kickstarter der Alpha Edition](/de/kickstarter) startete. Die Fragen stellt Luigi „[Davdas](/de/authors/davdas)“ Ragoni.

Die drei Listen von SouL, die Koin Games am Tag der Finals veröffentlicht hat, sind jetzt ein [Turnierdeck](/de/decks/tournament/soul-crimson-cup-lineup): **Du findest sie weiter unten, mit den Spielcodes zum Kopieren**.

## Das Turnier, noch ganz frisch {#turnier}

**Davdas:** Hallo SouL, ich freue mich riesig, dich wiederzusehen, nach all den Malen, die sich unsere Wege in der Gaming-Welt gekreuzt haben, und dich nach so einem großen Ergebnis hier zu haben: Du hast das Finale des ersten Turniers eines neuen Spiels erreicht. Wie war's?

**SouL:** Hallo Luigi! Es war ein bisschen eine Rückkehr zu den alten Spielen, bei denen wir uns oft über den Weg gelaufen sind, denn das waren auch kompetitive digitale Spiele.

Inzwischen bin ich mehr zu den Papierkarten gewechselt, aber **Origins hat mich in die Zeit zurückgebracht, in der man in Online-Titeln kompetitiv gespielt hat**.

**Davdas:** Wir werden deine Listen und deine Entscheidungen analysieren und auch ein bisschen über das Spiel reden, denn der Vorhang ist erst halb offen: Ich würde gern dahinter schauen und mir vorstellen, was daraus werden könnte, aus unserer Sicht und aus deiner. Aber zuerst, solange es noch frisch ist, wenige Stunden nach dem Ende: Wie war das Turnier? Das Event, seine Dauer, die Partien?

**SouL:** Sehr schön, finde ich, für das erste Turnier einer Firma, die neu in der Branche ist und genau heute, an dem Tag, an dem wir aufnehmen, ihren richtigen Kickstarter startet: Wir stehen ganz am Anfang eines Spiels, das schon großen Erfolg hat, bevor es überhaupt erschienen ist.

Abgesehen von ein paar kleinen technischen Problemen, die alle Teilnehmer kennen, einer Verlangsamung des Bots, weil so viele Leute und so viele Partien unterwegs waren, war es wirklich schön. Es gab sehr interessante Namen, bekannte internationale Spieler, Hearthstone-Streamer vom Kaliber eines Thijs und einen guten harten Kern italienischer Kartenspieler.

Und das können wir gleich sagen: **Wir Italiener haben drei der vier Plätze in der Top 4 belegt**. Das war extrem schön. Da waren Leute, die ich kannte, Leute, die ich für stark hielt, und mit meinem Ergebnis würde ich sagen, dass es sehr gut gelaufen ist.

[![Die offizielle Grafik des Crimson Cup von Koin Games: Qualifikationen, Playoffs, Finals und Preise im Wert von 10.000 Dollar](/media/news-crimson-cup.webp)](/de/analytics/crimson-cup)

## Origins TCG in Italien {#italiener}

**Davdas:** Das ist ein großer Erfolg für unser Land: Es schweißt zusammen und stärkt die Idee von Origins, das sich gerade jetzt auf die Märkte im Ausland zubewegt, in die verschiedenen Länder der Welt. Was erwartest du vom italienischen Markt bei so einem Spiel? Können die Italiener daraus ein Spitzenspiel machen?

**SouL:** Ich glaube schon. Paradoxerweise waren wir immer **eine der aktivsten Communitys in Europa**, zumindest bei Online-Kartenspielen.

Bis heute haben wir eine der größten Communitys auf Magic: The Gathering Online, und auch bei Hearthstone war die italienische immer eine der größten, mit großen Talenten, großen Spielern, die wir über die Jahre hervorgebracht haben, ich zähle sie jetzt nicht alle auf, aber auch wichtigen Content Creators. Es gibt kein einziges digitales Kartenspiel, das bei uns nicht eingeschlagen hat.

Origins hat meiner Meinung nach alle Chancen: **Es muss sich vor einem Hearthstone aus der goldenen Zeit nicht verstecken**, wenn man so will. Die Zeiten haben sich geändert, klar, aber ich bin sicher, dass es einer Menge Leute gefallen kann. Im Gegenteil, es ist offensichtlich: Es gefällt schon einer Menge Leute. Da braucht man nicht drum herumzureden.

## Die Aufstellung: Pigs, Mulan und Merlin {#aufstellung}

> „In 6 von 7 Runden habe ich Spieler getroffen, die Van Helsing dabeihatten: Indem ich es einfach nicht gebannt habe, bin ich jedes Mal über sie hinweggerollt.“

**Davdas:** Hoffen wir's. Wie du weißt, habe ich eine besondere Geschichte mit Blizzard, gerade bei Hearthstone, und ich sehe einige Ähnlichkeiten. Sagen wir es unseren Lesern: Das hier ist eher ein Gespräch unter Freunden als ein Interview.

Aber den Teil über das Turnier will ich mir nicht entgehen lassen: Bleiben wir bei den Listen, danach kommen wir darauf zurück, was Origins werden wird und was wir erwarten. Du hast eine wichtige Entscheidung getroffen, denn du hast Three Not So Little Pigs, Mulan und Merlin mitgebracht, drei sehr unterschiedliche Decks: ein Aggro, ein Midrange und ein Control. Nach allem, was du in diesen Wochen durchdacht und getestet hast: Warum genau diese drei Listen?

**SouL:** Genau. Ich sage gleich die Wahrheit: Für die Idee der Aufstellung nehme ich wenig Verdienst in Anspruch, denn eigentlich haben sie zwei Freunde von mir getestet. Sie haben zusammen trainiert, zwei italienische Spieler, die beide ein gutes Ergebnis geholt haben: **Nimer und Lord Von**.

Wir haben diese Decks gewählt, weil sie, wie du gesagt hast, von ihrer Identität her ein Aggro, ein Midrange und ein Control sind, aber **wir haben sie mit der klaren Absicht umgebaut, Combo-Decks daraus zu machen**. Unser Ziel war **Van Helsing Healing, für uns das Top-Tier-Deck des Metas**, und übrigens auch das Deck, mit dem ich mich in der Qualifikation qualifiziert habe, die mich dann ins Invitational am Samstag gebracht hat.

Ich hatte eine Aufstellung nur aus Control und Heilung mitgebracht, mit Van Helsing und dann Decks, die so taten, als wären sie etwas anderes, aber eigentlich Van-Helsing-Healing-Decks ohne Van Helsing waren. Also habe ich mir gesagt: Die Leute werden sich an dem orientieren, was ich gemacht habe, und ich war nicht der Einzige mit dieser Theorie, also wird das Turnier voller Van Helsing sein. Und wir lagen mit dem Call richtig.

[![Van Helsing, das Deck, das es beim Crimson Cup zu schlagen galt: Die Aufstellung von SouL wurde gebaut, um darüber hinwegzurollen](/cards/cover/van-helsing.webp)](/de/cards/van-helsing)

### Merlin: mehr anhaltender Schaden und weniger Verlass auf Obliterate {#merlin}

Die ursprüngliche Idee war von Nimer. Als ich davon erfahren habe, habe ich ihm gesagt: Ich glaube, du hast völlig recht, zeig mir deine Ideen. Ich habe mir seine Decks angeschaut und ein paar Änderungen gemacht.

Merlin zum Beispiel war so, wie er es gebaut hatte, ein bisschen „brickig“, sagen wir mal: Es fehlte die Möglichkeit, etwas mehr Schaden zu machen, und **es verließ sich nur darauf, zwei Obliterate nacheinander zu spielen**. So etwas mag ich nicht, denn wenn deine zwei Obliterate ganz unten im Deck liegen … verlierst du die Partie!

Also **habe ich Puck, Jekyll und First Aid reingenommen**, um die Heilungen zu haben, die dir beim Kontrollieren helfen, aber in Kombination mit Puck den Gegner treffen und dir helfen, die Partien zu beenden.

### Pigs: Glinda und Sandman für ein monströses Board {#pigs}

Three Not So Little Pigs ist das Deck mit dem wenigsten Combo-Anteil, weil es ziemlich aggro spielt, aber das Ziel des Decks, vor allem gegen Van Helsing, ist es, **die Ressourcen auf der Hand zu halten, um Glinda und Sandman beim Aufdecken des Gegners zu legen**.

Dann füllst du das Spielfeld in einer einzigen Runde, vielleicht mit zwei Reinforcements plus weiteren Zaubern für 1 Mana, von denen das Deck voll ist, um **Glinda innerhalb von ein paar Runden fünf-, sechs-, siebenmal auszulösen** und ein monströses Board aufzubauen. Normalerweise machst du das, wenn der Gegner nur 7 Mana hat, damit er natürlich nicht mit Forbidden Knowledge antworten kann.

Die Entscheidung war hervorragend: In 6 von 7 Runden habe ich Spieler getroffen, die Van Helsing dabeihatten, also bin ich einfach, indem ich es nicht gebannt habe, jedes Mal über sie hinweggerollt. Ich habe alle Runden 2-0 gewonnen außer einer, die ich 2-1 gewonnen habe, weil der Gegner kein Van Helsing hatte: Das war die einzige ausgeglichene Best-of-Three-Serie, die ich gespielt habe. Alle anderen habe ich zerlegt.

## Die drei Listen von SouL {#listen}

{{decklists}}

## Das beste Deck und das, was er ändern würde {#decks}

> „Dieser Merlin kann nicht verlieren: Der braucht unbedingt einen Nerf.“

**Davdas:** Abgesehen von den Statistiken, die immer nur bis zu einem gewissen Punkt zählen, und von dem, was man mit den Karten in der Hand spürt, verzeih mir den Vergleich: Welches Deck hat am besten funktioniert, und welches der drei hättest du gern geändert?

**SouL:** Die Wahrheit ist, dass **alle drei sehr gut funktioniert haben**. Keines der drei hat gehakt, nicht einmal im Finale, das ich dann gegen Crono verloren habe.

Die schwere Niederlage hat Mulan kassiert, das gegen den Van Helsing von Crono verloren hat, und das hätte nicht passieren dürfen: Wir wollten Van Helsing schlagen, und in der letzten Swiss-Runde war ich sogar gegen Crono und habe ihn 2-0 geschlagen, über seinen Van Helsing hinweg. Im Finale verliere ich die erste Partie der Best-of-Five-Serie ausgerechnet gegen Van Helsing, weil eine für meine Aufstellung sehr unglückliche Kombination von Orten kam.

Keines der drei Decks ist hinter den Erwartungen geblieben. Das einzige, das ich vielleicht nicht gewollt hätte, ist Mulan: Die Pigs haben sie mir oft gebannt, Merlin haben sie mir oft gebannt, **Mulan nie**. Also war es wahrscheinlich das schwächste der drei, das aber den Kreis der Combo-Aufstellung geschlossen hat.

**Das beste Deck ist zwangsläufig Merlin**: Abgesehen davon, dass es mein Lieblingsdeck im Spiel ist, war es sicher das solideste von allen. Dieser Merlin kann nicht verlieren, der braucht für mich unbedingt einen Nerf: Der ist völlig durchgeknallt.

[![Merlin, das Lieblingsdeck von SouL und seiner Meinung nach das solideste der Aufstellung](/cards/cover/merlin.webp)](/de/cards/merlin)

## Das Finale gegen CoachCrono {#finale}

**Davdas:** Wie lief das Finale gegen den Coach? In mancher Hinsicht ein fast freundschaftliches Finale, trotz allem, was auf dem Spiel stand, und dem Willen, es bis zum Schluss auszuspielen: Man hat die Rivalität gespürt, aber ihr wart super fair zueinander. Ihr kennt euch, ihr unterstützt euch, da ist auch das Gemeinschaftsgefühl, weil ihr beide Streamer seid, und dann ein rein italienisches Finale. Was ist schiefgelaufen?

**SouL:** Erst ein paar Worte zu Crono, denn er hat mich sehr zum Lachen gebracht. Crono und ich kennen uns seit Ewigkeiten: Wir haben zur Zeit von Teamfight Tactics zusammen mit dem Streamen angefangen. Wir sind keine Freunde, die sich aus anderen Gründen melden, aber wegen Spielen, Kollaborationen und Raids auf Twitch waren wir immer in Kontakt, und im Finale waren wir sehr entspannt.

Vor dem Finale bin ich auf seinen Discord gegangen, um mit ihm und seinem Chat zu quatschen, weil **Crono sich weigerte, ein Delay auf seinen Stream zu legen**. Er hat das ganze Turnier „snipebar“ gespielt, und das ist schrecklich, denn Origins ist eines dieser Spiele, bei denen es eine Katastrophe ist, wenn du gesnipet wirst und der Gegner alle deine Spielzüge vorhersieht. Aber das war ihm egal.

Als wir uns im Finale gegenüberstanden, habe ich zu ihm gesagt: „Crono, bitte, kannst du ein Delay einstellen? Kannst du wenigstens einen schwarzen Balken über deine Hand legen? Ich snipe dich nicht, aber uns kennen alle: Weißt du, wie viele Leute mir Infos zustecken könnten? Ich schließe mich ein, gehe offline, aber die Brieftauben kommen trotzdem durchs Fenster!“ Und er: **„Nein, ist mir völlig egal, ich vertraue dir.“** Das war sehr lustig.

### Die erste Partie, die Orte und das 2-2 {#serie}

Eigentlich gibt es nicht viel zu sagen: **Crono hat sehr gut gespielt**. Die Orte der ersten Partie waren sicher sehr glücklich für ihn, das hat er auch live zugegeben, aber es war offensichtlich, denn meine Aufstellung war dafür gebaut, seine zu zerstören.

Ich war objektiv im Vorteil, und er konnte es nach Hause holen, weil er vor allem die erste Partie gut gespielt hat: Er hat alle seine Chancen auf diese Orte gesetzt, unglücklich für mich und glücklich für ihn. Er ist mit einem Nachteil gestartet, war sehr konzentriert, wusste, dass er im Finalrennen auf dem schwächeren Pferd saß, aber er hat sich daran festgeklammert und es geschafft, den Sieg gleich in der allerersten Partie zu stehlen.

Diese Partie hat die Chancen komplett umgedreht, denn in dem Moment, in dem mein Gegner seinen Van Helsing durchbekommen hat, **lag plötzlich ich hinten**. Dann habe ich mich gut verteidigt, zwei Partien geholt, und wir haben die Show **bis zum 2-2** verlängert.

In der entscheidenden Partie hat er mit seinem Aggro-Deck eine spektakuläre Kurve gefunden und mich zerlegt: Die war einfach nicht zu gewinnen, und so hat er den berühmten goldenen Dracula mit nach Hause genommen.

[![Die offizielle Grafik von Koin Games für CoachCrono, den Sieger des Crimson Cup: die 1/1-Promokarte Dracula, zwei Cases mit Booster-Displays und 1.500 Dollar](/media/news-crimson-cup-winner.webp)](/de/news/crimson-cup-coachcrono-wins)

## Warum Origins es schaffen kann {#warum-origins}

> „Es ist ein Spiel, das geboren wurde, um kompetitiv zu sein. Ich gebe ihm sechs Monate, bis es explodiert.“

**Davdas:** Erst einmal noch einmal Glückwunsch zum Match, zur Sportlichkeit und zum Ergebnis, dir und Crono, den wir bald zu Gast haben werden. Was sind heute die Stärken von Origins? Was macht es zu einem möglichen Anwärter auf dem Markt und zu etwas Besonderem in den Händen der Spieler?

**SouL:** Online-Kartenspiele gibt es und gibt es nicht, denn von den Spielen, die wirklich auf den Wettbewerb setzen, ist, wie ich es sehe, vielleicht nur noch Hearthstone übrig. Und das ist ein sehr altes Spiel, das viele Leute ausprobiert haben: Viele haben von seiner Competitive-Szene genug bekommen, viele sind zurückgekommen.

Aber in einer Landschaft, in der es praktisch nur Hearthstone gibt, **ist absolut Platz für ein zweites Spiel**, und die Idee, auf der Origins aufbaut, ist eine völlig andere. Deshalb ist das Umfeld meiner Meinung nach da, damit es mit seinen Ideen funktioniert.

### Free to compete {#free-to-compete}

Wenn ich von meinem persönlichen Geschmack spreche: Das Spiel ist komplett **„free to compete“**, wie sie es nennen. **Sie schenken dir alle Karten, und du kannst alle Decks spielen**: Nach buchstäblich zwei Stunden Tutorial hast du alles freigeschaltet, du kommst gar nicht dazu, alle Karten zu lesen, da hast du sie schon in der Hand.

Du kannst auf höchstem Niveau antreten, von zu Hause aus ein Turnier wie den Crimson Cup spielen, das nichts kostet, und einen Preis wie den von Crono gewinnen, **eine Karte mit Seriennummer, 1 von 1**. Okay, sie ist digital, aber dieselben Seriennummern bei physischen Karten sind 30, 40, 50, sogar 100.000 Dollar wert.

Wenn diese Karte auch nur ein Zehntel der wertvollsten Karten überhaupt wert wird und Crono sie an einen Sammler verkauft, oder sie behält, ich weiß nicht, was er vorhat, aber wenn ihr Wert 10.000 Dollar erreicht, dann **hat er diesen Preis gewonnen, während er bei sich zu Hause saß**. Das ist unbezahlbar, und eine Menge Leute, vor allem junge, werden Zugang dazu haben wollen.

[![Die Grafik „Zero pay to win“ von Koin Games: Jeder Spieler bekommt alle Karten, indem er Partien gewinnt, ohne Geld auszugeben](/media/ls-zero-pay-to-win.webp)](/de/kickstarter)

### Der positive Kreislauf des Sammelns {#sammeln}

Ich spiele viel physische Kartenspiele, trete in diesen Titeln an und reise viel, aber Reisen kostet und physische Karten kosten: Nicht jeder kann sich diesen Luxus leisten.

**Online-Spiele sind ein frischer Wind**: Ich kann jederzeit spielen, auf dem Handy, mit Freunden auf Discord, ohne mich mit jemandem persönlich treffen zu müssen, auch mit Freunden, die weit weg sind, denn Origins setzt mir keine Grenzen.

Es ist kostenlos, es ist ein Videospiel und dahinter stehen Leute mit dem Know-how, es voranzubringen, mit einer Sammlerseite, die, wie wir wissen, inzwischen das ist, was den Wettbewerb am Leben hält, denn Preisgeld auszuzahlen ist für alle immer ein Problem, für Firmen mit physischen wie mit digitalen Spielen.

Aber wenn ich einzigartige Karten mit Seriennummer vergeben, unglaubliche Illustrationen machen, einen großartigen Künstler für eine einzigartige Illustration von Winnie-the-Pooh oder Merlin bezahlen kann, in dem Wissen, dass sie eines Tages in einem Turnier von Leuten gespielt wird, die sich für den Wettbewerb interessieren, und von Sammlern gekauft wird, die sich für diese Art von Produkt interessieren, dann **schaffen wir den positiven Kreislauf, von dem auch die physischen Kartenspiele seit Jahren leben**.

[![Die Grafik von Koin Games zu den Collector Packs: alternative Illustrationen, Frame Broken und Storybook mit ihren Wahrscheinlichkeiten](/media/ls-collector-pack.webp)](/de/kickstarter)

Ich glaube, es sind alle Voraussetzungen da, damit dieses Spiel entsteht, wächst und ein langes kompetitives Leben hat, und genau das wollen ihm seine Macher geben. Was mir an Origins am meisten gefällt, ist genau das: Es ist ein Spiel, das geboren wurde, um kompetitiv zu sein.

Wie Timothy, der Schöpfer, immer sagt: Wir wollen das beste kompetitive Online-Kartenspiel machen, weil es keins gibt. Ich gebe ihm sechs Monate, bis es explodiert.

## Der Rat an Koin Games {#ratschlag}

**Davdas:** Was rätst du Origins heute? Von seiner Natur her schöpft das Spiel aus Spielen, die wir schon kennen, aber es macht das sehr gut: Es verwebt Spielbarkeit, Wiederspielwert, Kontinuität und Spaß und nimmt das Beste, oder zumindest die besten Ideen, aus anderen Titeln. Auf den ersten Blick habe ich an Hearthstone gedacht, das du erwähnt hast, an Artifact, an Snap, an Spiele, die ihren großen Moment auf dem Markt hatten, manche länger, manche mit mehr Spielern, jedes mit seiner eigenen Geschichte.

Origins gefällt uns sehr, und wir verlieben uns in seine Ideen, aber es ist noch nicht erschienen: Da draußen wissen ganz viele Spieler nicht einmal, dass es existiert, wir haben ein Set, das kein echtes erstes Set ist, und wir spielen Turniere mit etwas, das sich bei einigen Karten und einigen Mechaniken noch unvollständig anfühlt. Trotzdem hat es schon eine sehr starke Identität. Wenn du Origins die nächsten Schritte raten könntest, welche wären das?

**SouL:** Ich gehe wieder nach meinem ganz persönlichen Geschmack, denn alles, was du gesagt hast, ist völlig richtig. Ich glaube, sie sind in einer Übergangsphase, und dieser Übergang passiert genau heute, mit dem Start des Kickstarters.

Mein Rat an ein solches Spiel ist, **sich niemals zu ändern**, denn einer der großen Fehler, die viele Spiele meiner Meinung nach gemacht haben, war genau, sich zu ändern. Sie müssen sich ihr eigenes Publikum aufbauen, und ihr Publikum ist ein anderes: **ein Publikum aus Competitive-Spielern und Sammlern**. Wenn sie ab jetzt ihre Vision niemals ändern, haben sie meiner Meinung nach eine rosige Zukunft.

Vielleicht kein explosives Wachstum, wie sie es hätten, wenn sie sich ein bisschen mehr dem verkaufen würden, was der Markt kurzfristig verlangt, aber wenn sie ihrer Identität treu bleiben, können sie sich **einen harten Kern aufbauen, der potenziell nie aufhören wird zu spielen**.

Am Ende reden wir von einem Spiel, das Wettbewerb und Sammeln will, also braucht es Zeit, viel Zeit: um die Illustrationen zu produzieren, um die kompetitive Community aufzubauen, um Turniere zu veranstalten, um die kompetitiven Spieler anzuziehen, die es auf der Welt gibt, auch die, die heute kein Origins spielen, aber mit ihrer Meinung andere bewegen können, indem sie sagen: „Dieses Spiel ist cool, kommt und probiert ein Turnier aus, ihr spielt von zu Hause, es ist komplett kostenlos.“ Das müssen sie als Identität ihres Produkts verbreiten, und ich glaube, sie können es schaffen, wenn sie sich niemals ändern.

Der Kickstarter, von dem SouL spricht, ist der der Alpha Edition: Belohnungen, Wahrscheinlichkeiten und Termine findest du auf unserer [Seite zum Kickstarter](/de/kickstarter).

## Was ein Spieler auf einer Seite wie OriginsMeta sucht {#originsmeta}

**Davdas:** Danke, dass du bei uns auf OriginsMeta warst. Für mich ist es eine Freude und eine Ehre, dich wiederzusehen und nach einiger Zeit wieder mit dir zu plaudern, und ich hoffe, dass das öfter passiert.

**SouL:** Sobald ich wieder bei einem Turnier Zweiter werde, komme ich wieder! *(lacht)*

**Davdas:** Wir laden dich noch zu viel mehr ein, glaub mir. OriginsMeta, die Seite, auf der wir gerade sind, ist ein Hub, der diesem Spiel volle Unterstützung geben will. Wir stehen in direktem Kontakt mit den Leuten von Koin Games, die es vertreiben und der Welt davon erzählen, und wir tun alles, um das Spiel mit Tools und Community zu unterstützen. Was hoffst du aus deiner Sicht auf einer Seite zu finden, die ein Spiel, das du magst, so gründlich behandelt? Was würdest du dir wünschen, außer einer Komfortzone, in der du die Kartenliste nachschlagen kannst?

**SouL:** Ich klinge vielleicht parteiisch, aber ich will dir die Wahrheit sagen: **Ihr habt es schon**. Ich habe eure Seite für das Turnier genutzt, für die Statistiken. Ich habe Ingenieurwesen studiert, aber abgesehen davon habe ich Statistiken immer geliebt: **Für mich sind Statistiken alles**.

Meine Aufstellung ist genau daraus entstanden, dass Van Helsing offensichtlich das stärkste Deck von allen war, also wollte ich eine Aufstellung, die es schlägt. Und das habe ich herausgefunden, indem ich mir die Statistiken der anderen Turniere und der Rangliste angeschaut habe, **mit den Daten, die eure Seite gesammelt hat**. Das ist also für mich das, was nie fehlen darf.

Ein kompetitives Spiel braucht Statistiken und Leute, die sie lesen können, und eine Unterstützung, die ihr den Spielern geben könnt, ist nicht nur, die Statistiken zu präsentieren, sondern auch **eine Lesart davon, mit Artikeln wie diesem**, indem ihr Leute einladet, die ihre Lesart des Metas geben. Für mich ist das der unglaubliche Mehrwert, der in einem Spiel, an dem ich teilnehme, nicht fehlen darf.

[![Die Bannrate der Legendären in den vier Qualifikationen des Crimson Cup, von der Seite von OriginsMeta: Van Helsing ist in jeder am häufigsten gebannt](/media/news-soul-ban-rate-de.webp)](/de/analytics/crimson-cup#across)

Die Zahlen, von denen SouL spricht, stehen auf unserer [Seite zum Crimson Cup](/de/analytics/crimson-cup#across): In den vier Qualifikationen mit offiziellen Tabellen von Koin **war Van Helsing immer die am häufigsten gebannte Legendäre**, Merlin insgesamt die zweite, Mulan weit dahinter. Die Statistiken der Ladder, aus den mit OriginsMeta Tracker aufgezeichneten Partien, findest du in [Analytics](/de/analytics).

**Davdas:** Danke, SouL, vielen Dank für deine Worte und deine Ratschläge, und vor allem noch einmal Glückwunsch zu deinem tollen Ergebnis.

**SouL:** Danke dir und danke an OriginsMeta.`,
    faq: [
      { q: "Mit welchen Decks hat SouL den Crimson Cup gespielt?", a: "Three Not So Little Pigs, Mulan und Merlin, im Conquest-Format. Die drei Listen, die Koin Games am Tag der Finals veröffentlicht hat, stehen auf OriginsMeta als Turnierdeck, mit den Spielcodes zum Kopieren." },
      { q: "Warum hat SouL Pigs, Mulan und Merlin gewählt?", a: "Um Van Helsing zu schlagen, für ihn das Top-Tier-Deck des Metas: ein Aggro, ein Midrange und ein Control, umgebaut, um als Combo zu spielen. Die Idee stammt von Nimer, getestet mit Lord Von und von SouL verfeinert." },
      { q: "Welches Deck seiner Aufstellung hält SouL für das stärkste?", a: "Merlin: das solideste der drei und sein Lieblingsdeck, eines, das „unbedingt einen Nerf braucht“. Das schwächste war für ihn Mulan, das ihm im Turnier nie gebannt wurde." },
    ],
  },
  "kickstarter-alpha-edition-reward-tiers": {
    title: "Kickstarter von Origins TCG: die acht Belohnungsstufen der Alpha Edition, von 24 $ bis 9.999 $",
    metaTitle: "Origins TCG Kickstarter: alle acht Belohnungsstufen",
    description:
      "Alle acht Kickstarter-Stufen der Origins TCG Alpha Edition, von 24 $ bis 9.999 $: versiegelte Packs, Displays und Cases, Big Bob Commander und Golden Slabs.",
    summary:
      "Der Kickstarter zur Alpha Edition hat acht Belohnungsstufen, von Worthy für 24 $ bis Legend: Winnie-the-Pooh für 9.999 $. Jede Stufe enthält den Alpha Supporter Title und den dauerhaften Collector Pass; ab Aspirant (99 $) kommen versiegelte Booster-Displays und Cases, der Kickstarter-exklusive Big Bob Commander und, weiter oben, die Golden-Slab-Promos dazu. Alle Belohnungen sind digital.",
    highlights: [
      { label: "Acht Stufen, von 24 $ bis 9.999 $", text: "vom Bundle mit 6 Packs bis zu 30 versiegelten Cases", anchor: "stufen" },
      { label: "In jeder Stufe", text: "der Alpha Supporter Title und der dauerhafte Collector Pass", anchor: "in-jeder-stufe" },
      { label: "Exklusiv auf Kickstarter", text: "Big Bob Commander ab Aspirant, Golden Big Bob ab Apprentice", anchor: "exklusiv" },
      { label: "Promos und Slabs", text: "Alt Art Promo Box, Golden Slabs von Van Helsing und Rapunzel, Winnie-the-Pooh an der Spitze", anchor: "promos" },
      { label: "Alles digital", text: "Koin schreibt es auf jede Stufe: Die Belohnungen sind digitale Produkte", anchor: "digital" },
      { label: "Noch offen", text: "das Ende der Kampagne und mögliche Limits bei den Stufen", anchor: "noch-offen" },
    ],
    body: `## Acht Stufen, von 24 $ bis 9.999 $ {#stufen}

Der Kickstarter von Koin Games zur **Alpha Edition von Myths and Legends** hat acht Belohnungsstufen. Von der günstigsten bis zur teuersten:

| Stufe | Preis | Versiegeltes Produkt | Packs |
| --- | --- | --- | --- |
| Worthy | 24 $ | 1 Alpha Booster Bundle | 6 |
| Aspirant | 99 $ | 1 Alpha Booster Box | 24 |
| Apprentice | 199 $ | 2 Alpha Booster Boxes | 48 |
| Hero | 499 $ | 1 Alpha Booster Box Case | 144 |
| Champion | 999 $ | 2 Alpha Booster Box Cases | 288 |
| Icon | 2.499 $ | 6 Alpha Booster Box Cases | 864 |
| Myth: Winnie-the-Pooh | 4.999 $ | 30 Alpha Booster Box Case | 4.320 |
| Legend: Winnie-the-Pooh | 9.999 $ | 30 Alpha Booster Box Cases | 4.320 |

Die Preise sind in US-Dollar. Die Grafiken unten sind die offiziellen Übersichten von Koin Games zu jeder Stufe. Die Namen der Stufen und der Belohnungen bleiben auf Englisch, so wie Koin sie schreibt.

### Worthy, 24 $ {#worthy}

![Grafik von Koin Games zur Stufe Worthy, 24 $: ein versiegeltes Alpha Booster Bundle mit 6 Packs und der Collector Pass](/media/kickstarter/worthy.webp)

Der Einstieg: ein versiegeltes **Alpha Booster Bundle** mit 6 Packs, der **Alpha Supporter Title** und der **dauerhafte Collector Pass** von Origins TCG.

### Aspirant, 99 $ {#aspirant}

![Grafik von Koin Games zur Stufe Aspirant, 99 $: ein versiegeltes Alpha-Booster-Display, die Emotes von Big Bob, der Collector Pass, die Founder-Kapsel und Big Bob Commander](/media/kickstarter/aspirant.webp)

Eine versiegelte **Alpha Booster Box** mit 24 Packs. Gegenüber Worthy kommen die **Founder Collector Capsule** (Avatar, Kartenrückseite, ein Founder-Emote und ein Founder-Slab), der Kickstarter-exklusive **Big Bob Commander** und das **Big Bob Emote Pack** mit 3 Emotes dazu.

### Apprentice, 199 $ {#apprentice}

![Grafik von Koin Games zur Stufe Apprentice, 199 $: zwei versiegelte Alpha-Booster-Displays, Big Bob Commander, die Alpha Alt Art Promo Box, der Collector Pass und Golden Big Bob Commander](/media/kickstarter/apprentice.webp)

Zwei versiegelte Displays, 48 Packs. Dazu kommen der Kickstarter-exklusive **Golden Big Bob Commander**, das **Golden Big Bob Emote Pack** und die **Alpha Alt Art Promo Box**.

### Hero, 499 $ {#hero}

![Grafik von Koin Games zur Stufe Hero, 499 $: ein versiegeltes Case mit Booster-Displays, die Alpha Alt Art Promo Box, das Alpha Gameboard, beide Big Bob Commander und die Golden-Slab-Promo von Van Helsing](/media/kickstarter/hero.webp)

Ein versiegeltes **Alpha Booster Box Case**, 144 Packs. Dazu kommen das **Alpha Gameboard** und die **Van Helsing Golden Slab Promo**.

### Champion, 999 $ {#champion}

![Grafik von Koin Games zur Stufe Champion, 999 $: zwei versiegelte Cases und die Golden-Slab-Promos von Van Helsing und Rapunzel](/media/kickstarter/champion.webp)

Zwei versiegelte Cases, 288 Packs, mit den **Golden Slab Promos von Van Helsing und Rapunzel**.

### Icon, 2.499 $ {#icon}

![Grafik von Koin Games zur Stufe Icon, 2.499 $: sechs versiegelte Cases, die Slabs von Van Helsing und Rapunzel und ein Set aus Alternate-Art-Promo-Slabs](/media/kickstarter/icon.webp)

Sechs versiegelte Cases, 864 Packs. Dazu kommt das **Guaranteed Premium Alternate Art Promo Set**.

### Myth: Winnie-the-Pooh, 4.999 $ {#myth}

![Grafik von Koin Games zur Stufe Myth: Winnie-the-Pooh, 4.999 $: versiegelte Cases, das Alternate-Art-Promo-Set und ein Promo-Slab von Winnie-the-Pooh mit seinem goldenen Emote](/media/kickstarter/myth.webp)

Die erste Stufe, die nach einem Charakter benannt ist. Zusätzlich zu allem aus Icon kommen die **Golden Commander Skin**, ein **Golden Emote** und die **Serialized Character Profile Promo** dazu. Laut der Belohnungsliste auf ihrer Grafik enthält sie 30 versiegelte Cases, 4.320 Packs.

### Legend: Winnie-the-Pooh, 9.999 $ {#legend}

![Grafik von Koin Games zur Stufe Legend: Winnie-the-Pooh, 9.999 $: dreißig versiegelte Cases und zwei Promo-Slabs von Winnie-the-Pooh, eines davon golden](/media/kickstarter/legend.webp)

Die höchste Stufe: 30 versiegelte Cases, 4.320 Packs, alles aus Myth und die **Serialized Signature Character Profile Promo**.

## Was jede Stufe enthält {#in-jeder-stufe}

- **Jede Stufe**, Worthy eingeschlossen: der **Alpha Supporter Title** und der **dauerhafte Collector Pass** von Origins TCG.
- **Ab Aspirant**: die **Founder Collector Capsule** (Avatar, Kartenrückseite, ein Founder-Emote, ein Founder-Slab), der **Big Bob Commander** und sein Emote-Pack.
- **Ab Apprentice**: der **Golden Big Bob Commander**, sein Emote-Pack und die **Alpha Alt Art Promo Box**.
- **Ab Hero**: das **Alpha Gameboard**.

## Exklusiv auf Kickstarter {#exklusiv}

Koin kennzeichnet zwei Belohnungen als **Kickstarter Exclusive**: den **Big Bob Commander**, in jeder Stufe ab Aspirant, und den **Golden Big Bob Commander**, ab Apprentice. Zu jedem gehört ein eigenes Emote-Pack mit 3 Emotes.

## Promos und Slabs {#promos}

Die höheren Stufen bringen Promos, die du nicht aus Packs ziehen kannst: die **Alpha Alt Art Promo Box** ab Apprentice, das **Golden Slab von Van Helsing** ab Hero, **Van Helsing und Rapunzel** ab Champion, das **Guaranteed Premium Alternate Art Promo Set** ab Icon und die nummerierten Promos von **Winnie-the-Pooh** in Myth und Legend.

## Alle Belohnungen sind digital {#digital}

Jede Grafik trägt denselben Satz von Koin: „All Kickstarter rewards are a digital product“, also: Alle Belohnungen des Kickstarters sind digitale Produkte. Packs, Displays und Cases sind Gegenstände im Steam-Inventar, die du öffnen, versiegelt behalten oder tauschen kannst, laut der offiziellen Seite von Koin, und die Alpha Edition wird nie nachgedruckt. Die offiziellen Pull-Rates jeder Seltenheit stehen auf unserer [Kickstarter-Seite](/de/kickstarter), und alles zur Kampagne, mit Terminen und Quellen, in unserem [Kickstarter-Guide](/de/guides/origins-tcg-kickstarter).

## So unterstützt du die Kampagne {#unterstuetzen}

Unsere [Kickstarter-Seite](/de/kickstarter) fasst die Alpha Edition zusammen, und ihr Button führt dich mit unserem Empfehlungslink zur Kampagne: Wenn du von dort aus unterstützt, zahlt Koin Games OriginsMeta eine Provision, und dein Preis bleibt gleich. Wenn du dich als VIP vorregistriert hast, nimm den VIP-Link, den Koin dir geschickt hat: Dein Rabatt von 15 % ist an diesen Link gebunden.

## Was wir noch nicht wissen {#noch-offen}

- Wann die Kampagne endet und ob eine Stufe nur eine begrenzte Zahl an Unterstützern hat.
- Wann die Belohnungen in deinem Steam-Inventar ankommen.`,
    faq: [
      {
        q: "Was kostet die günstigste Kickstarter-Stufe von Origins TCG?",
        a: "Worthy, für 24 $: ein versiegeltes Alpha Booster Bundle mit 6 Packs, der Alpha Supporter Title und der dauerhafte Collector Pass von Origins TCG.",
      },
      {
        q: "Welche Stufen enthalten ein versiegeltes Booster-Display oder Case?",
        a: "Aspirant (99 $) hat ein Display mit 24 Packs, Apprentice (199 $) zwei. Ab Hero (499 $) gibt es versiegelte Cases: eines in Hero, zwei in Champion, sechs in Icon und dreißig in Legend.",
      },
      {
        q: "Sind die Kickstarter-Belohnungen physisch?",
        a: "Nein. Auf jeder Grafik der Stufen schreibt Koin Games, dass alle Kickstarter-Belohnungen digitale Produkte sind.",
      },
    ],
  },
  "crimson-cup-coachcrono-wins": {
    title: "CoachCrono gewinnt den Crimson Cup von Origins TCG: drei Italiener unter den vier Finalisten",
    metaTitle: "CoachCrono gewinnt den Crimson Cup von Origins TCG",
    description:
      "CoachCrono gewinnt den Crimson Cup von Origins TCG aus dem Loser-Bracket: drei Italiener unter den vier Finalisten, ihre Decks und das Turnier im Rückblick.",
    summary:
      "CoachCrono hat den Crimson Cup gewonnen, das bisher größte Turnier von Origins TCG: Er kam aus dem Loser-Bracket zurück, schlug SouL im großen Finale und nimmt die 1/1-Promokarte Dracula mit nach Hause. Drei der vier Finalisten sind Italiener: CoachCrono, SouL und Felixnxx. Hier findest du seinen Weg, die Decks der Finals und den Rückblick auf eine Woche Turnier.",
    highlights: [
      { label: "CoachCrono ist der Champion", text: "aus dem Loser-Bracket, 9-3 am Finaltag laut dem offiziellen Post", anchor: "sieg" },
      { label: "Drei Italiener unter vier", text: "CoachCrono, SouL und Felixnxx; der vierte Finalist ist OrdinaryHarry", anchor: "italiener" },
      { label: "Nur eine Niederlage vor dem großen Finale", text: "gegen SouL, den er danach im Kampf um den Titel geschlagen hat", anchor: "weg" },
      { label: "Pigs in jeder Aufstellung", text: "Three Not So Little Pigs bei allen vier, Van Helsing bei drei", anchor: "decks" },
      { label: "Eine Woche Turnier", text: "fünf Qualifikationen, Playoffs im Double-Elimination-Format und die Finals live", anchor: "turnier" },
      { label: "Was noch fehlt", text: "das Ergebnis des großen Finales und Koins Tabellen zu Playoffs und Finals", anchor: "noch-offen" },
    ],
    body: `## CoachCrono ist der Champion des Crimson Cup {#sieg}

Glückwunsch, Coach. Am Sonntag, dem 25. Oktober, hat [CoachCrono](/de/u/coachcrono) den Crimson Cup gewonnen, das Turnier, mit dem Koin Games die Woche des Steam Next Fest abgeschlossen hat. apix von Koin Games hat es auf dem offiziellen Discord verkündet („Congrats to @CoachCrono for winning our Origins Crimson Cup“), und der offizielle Post von Origins TCG auf X fasst es so zusammen: Er kam aus dem Loser-Bracket, mit einem 9-3 an diesem Tag („going 9-3 today“).

Der Preis ist der aus der offiziellen Grafik des Siegers: die 1/1-Promokarte Dracula, zwei Cases mit Booster-Displays und 1.500 Dollar. CoachCrono ist außerdem Creator auf OriginsMeta: Seine Kanäle und Decks findest du auf seinem Profil.

## Drei Italiener unter den vier Finalisten {#italiener}

Vier Spieler haben die Finals erreicht, und drei davon sind Italiener: CoachCrono, SouL und Felixnxx. Der vierte ist OrdinaryHarry. In einem Turnier, das allen offenstand, mit Qualifikationen in Amerika, Europa und Asien, ist das ein riesiger Erfolg für die italienische Szene von Origins TCG.

Die Endplatzierungen, laut dem Turnierbaum der Playoffs auf Tourney Bot und der Ankündigung von Koin:

1. CoachCrono
2. SouL
3. Felixnxx
4. OrdinaryHarry

## Sein Weg zum Titel {#weg}

Die Playoffs am Samstag, dem 24. Oktober, liefen im Double-Elimination-Format, die Matches im Best-of-Three: Wer einmal verliert, rutscht ins Loser-Bracket, wer zweimal verliert, ist raus. CoachCrono hat seine ersten sechs Matches im Winner-Bracket gewonnen, eines davon gegen agraveinstream, einen weiteren Creator von OriginsMeta, und ist im Halbfinale an SouL gescheitert, 0-2. Danach hat er nicht mehr verloren: 2-1 gegen eotboltyou für den Einzug unter die letzten vier, dann in den Finals 2-0 gegen OrdinaryHarry, 2-0 gegen Felixnxx und der Sieg im großen Finale gegen SouL, der bis dahin kein Match verloren hatte.

Auf der anderen Seite ist SouL ungeschlagen durch das Winner-Bracket gegangen, mit einem 2-1 gegen Felixnxx im Winner-Finale. Felixnxx hatte OrdinaryHarry im anderen Halbfinale 2-1 geschlagen. Den ganzen Weg, Match für Match, findest du in unserem [Turnierbaum der Playoffs](/de/analytics/crimson-cup/playoffs).

## Die Decks der Finals {#decks}

Koin hat die Listen der vier Finalisten am Tag der Finals veröffentlicht: Ab der Top 4 werden die Decklists öffentlich, so steht es in den Regeln. Die Siegeraufstellung von CoachCrono:

- [Three Not So Little Pigs](/de/cards/three-not-so-little-pigs): Bullseye, Glinda, Golden Egg, Guy of Gisborne, Mind Palace, Mummy, Obliterate, Reinforcements, Sandman, Stroke of Midnight, Three Blind Mice, Trash for Treasure;
- [Van Helsing](/de/cards/van-helsing): Ali Baba, Baby Bear, Bridge Troll, Dark Omen, First Aid, Forbidden Knowledge, Phuong Hoang, Puck, Searing Light, Shahrazad, Spellbook, Tin Woodman;
- [Legion of the Dead](/de/cards/legion-of-the-dead): Asanbosam, Baby Bear, Boogeyman, Bridge Troll, Dark Omen, En Passant, Golden Egg, Morgiana, Mummy, Obliterate, Paul Bunyan, Trash for Treasure.

Die Aufstellungen der anderen: SouL hat Merlin, Mulan und Three Not So Little Pigs mitgebracht, Felixnxx Van Helsing, Legion of the Dead und Three Not So Little Pigs, OrdinaryHarry Mulan, Van Helsing und Three Not So Little Pigs.

Ein paar Zahlen aus den 12 Listen. Three Not So Little Pigs steckt in allen vier Aufstellungen, Van Helsing in drei, Legion of the Dead und [Mulan](/de/cards/mulan) in zwei, [Merlin](/de/cards/merlin) in einer: Die anderen sechs Legendären haben die Finals nicht erreicht. [Baby Bear](/de/cards/baby-bear) ist die häufigste Karte (7 von 12 Decks), danach kommen Golden Egg, Mind Palace, Obliterate und Tin Woodman (6). Die vollständigen Listen, mit dem Spielcode und dem Link zum Deckbuilder, findest du auf unserer [Seite zum Crimson Cup](/de/analytics/crimson-cup#finals).

## Das Turnier im Überblick {#turnier}

Der Crimson Cup war das bisher größte Turnier von Koin Games, wie apix ihn genannt hat: fünf Qualifikationen, offen für alle, zwischen dem 19. und 22. Oktober (AMER #1, EMEA #1, AMER #2, APAC und EMEA #2), aus jeder 32 Qualifizierte plus 96 Wildcards, Playoffs mit 256 Plätzen am 24. Oktober und die Finals am 25. Oktober, alles live. Gespielt wurde im Conquest-Format: drei Decks mit mindestens 8 verschiedenen einzigartigen Karten zwischen je zwei Decks, eine Bannphase und Decklists, die bis zur Top 4 verborgen bleiben. Preise im Gesamtwert von 10.000 Dollar. Die Regeln im Detail stehen in unserem Artikel zu den [Regeln des Crimson Cup](/de/news/crimson-cup-format-check-in).

In den vier Qualifikationen mit offiziellen Tabellen von Koin war Van Helsing immer die am häufigsten gebannte Legendäre (von 44,4 % in AMER #1 bis 55,1 % in EMEA #2), Three Not So Little Pigs die am häufigsten mitgebrachte und Baby Bear die meistgespielte Karte. Die Finals haben dasselbe Meta gezeigt: Pigs in jeder Aufstellung, Van Helsing in drei, Baby Bear in sieben von zwölf Decks. Alle Zahlen der Qualifikationen findest du auf unserer [Seite zum Crimson Cup](/de/analytics/crimson-cup).

## Was wir noch nicht wissen {#noch-offen}

- Das Ergebnis des großen Finales: Auf Tourney Bot fehlt es, und Koin hat es nicht genannt; der offizielle Post nennt nur das 9-3 des Tages.
- Die Tabellen der Playoffs und der Finals (Bans, mitgebrachte Decks, meistgespielte Karten): Nach den Qualifikationen hat Koin sie auf dem offiziellen Discord veröffentlicht, für Playoffs und Finals noch nicht. Sobald sie erscheinen, kommen sie auf unsere Seite zum Crimson Cup.`,
    faq: [
      {
        q: "Wer hat den Crimson Cup von Origins TCG gewonnen?",
        a: "CoachCrono, am 25. Oktober 2026: Er kam aus dem Loser-Bracket zurück und schlug SouL im großen Finale. Verkündet haben es Koin Games auf dem offiziellen Discord und Origins TCG auf X.",
      },
      {
        q: "Mit welchen Decks hat CoachCrono den Crimson Cup gewonnen?",
        a: "Three Not So Little Pigs, Van Helsing und Legion of the Dead, im Conquest-Format. Die drei vollständigen Listen, mit dem Spielcode, stehen auf der Seite zum Crimson Cup von OriginsMeta.",
      },
      {
        q: "Wer waren die Finalisten des Crimson Cup?",
        a: "CoachCrono (Erster), SouL (Zweiter), Felixnxx (Dritter) und OrdinaryHarry (Vierter). Drei der vier sind Italiener: CoachCrono, SouL und Felixnxx.",
      },
      {
        q: "Was hat CoachCrono gewonnen?",
        a: "Die 1/1-Promokarte Dracula, zwei Cases mit Booster-Displays und 1.500 Dollar, laut der offiziellen Grafik des Siegers.",
      },
    ],
  },
  "crimson-cup-meta-report-emea-1-amer-2": {
    title: "Meta Report der Crimson Cup: Van Helsing bleibt am häufigsten gebannt, King Arthur trennt Europa und Amerika",
    metaTitle: "Origins TCG Crimson Cup: Zahlen von EMEA #1 und AMER #2",
    description:
      "Crimson Cup von Origins TCG, EMEA #1 und AMER #2 in Koins Zahlen: Van Helsing zu 51,1 % und 48,4 % gebannt, King Arthur 6,3 % in Europa, 24 % in Amerika.",
    summary:
      "Koin Games hat die offiziellen Zahlen zweier weiterer Qualifikationen der Crimson Cup veröffentlicht, EMEA #1 und AMER #2. Van Helsing ist wieder die am häufigsten gebannte Legendäre (51,1 % und 48,4 %), Three Not So Little Pigs wieder die am häufigsten mitgebrachte und Baby Bear wieder die meistgespielte Karte. Neu ist King Arthur: in Europa in 6,3 % der Fälle gebannt, in Amerika in 24 %. Unsere Seite zur Crimson Cup stellt jetzt alle Qualifikationen nebeneinander.",
    highlights: [
      { label: "Van Helsing, überall gebannt", text: "in allen drei Qualifikationen am häufigsten gebannt, 51,1 % in EMEA #1 und 48,4 % in AMER #2", anchor: "bans" },
      { label: "King Arthur trennt die Regionen", text: "in Europa zu 6,3 % gebannt, in den beiden Qualifikationen in Amerika zu 22,7 % und 24 %", anchor: "king-arthur" },
      { label: "Robin Hood wird jetzt gefürchtet", text: "von 11,8 % in AMER #1 auf fast jedes fünfte Mal gebannt", anchor: "robin-hood" },
      { label: "Pigs, wieder am häufigsten mitgebracht", text: "in etwa jedem vierten Deck, und jedes Mal ein wenig öfter gebannt", anchor: "mitgebracht" },
      { label: "Baby Bear in allen drei vorn", text: "50,1 % und 46,1 %; Bagheera und Stroke of Midnight kommen in die Top 20", anchor: "karten" },
      { label: "Alle Qualifikationen im Vergleich", text: "ein neuer Abschnitt unserer Seite zur Crimson Cup", anchor: "seite" },
    ],
    body: `## Zwei weitere Qualifikationen, dieselben Tabellen {#zahlen}

Nach EMEA #1 (20. Oktober) und AMER #2 (21. Oktober) hat Koin Games auf seinem offiziellen Discord dieselben zwei Tabellen veröffentlicht wie nach der ersten Qualifikation: die Bannphase jeder Legendären und die 20 meistgespielten Karten in den eingereichten Decks. Mit drei von fünf Qualifikationen lassen sich die Zahlen jetzt vergleichen: was von einer Qualifikation zur nächsten gleich bleibt und was sich zwischen Europa und Amerika ändert. Zur ersten, AMER #1, gibt es unseren [Meta Report vom 20. Oktober](/de/news/crimson-cup-meta-report-amer-1).

## Van Helsing vorn, Merlin dahinter, dreimal in Folge {#bans}

Die Ban-Rate gibt an, wie oft eine Legendäre gebannt wurde, gemessen an den Malen, in denen ein Gegner sie beim Bann vor sich hatte (die Decklists bleiben bis zur Top 4 verborgen, beim Bann siehst du also nur die Legendären: [die Regeln](/de/news/crimson-cup-format-check-in#decklisten)).

| Legendäre | AMER #1 | EMEA #1 | AMER #2 |
|---|---|---|---|
| Van Helsing | 44,4 % | 51,1 % | 48,4 % |
| Merlin | 42,2 % | 48,6 % | 47,5 % |
| Three Not So Little Pigs | 32,8 % | 34,9 % | 36,1 % |
| Dorothy | 23,1 % | 10,0 % | 33,3 % |
| King Arthur | 22,7 % | 6,3 % | 24,0 % |
| Robin Hood | 11,8 % | 19,6 % | 18,6 % |
| Mulan | 20,3 % | 15,3 % | 14,0 % |
| Legion of the Dead | 19,2 % | 15,4 % | 10,6 % |
| Queen of Hearts | 21,0 % | 8,0 % | 12,0 % |
| Dracula | 14,1 % | 14,5 % | 9,2 % |
| Wicked Stepmother | 11,1 % | 0 % | 8,3 % |

Van Helsing wurde in EMEA #1 139-mal bei 272 Gelegenheiten gebannt und in AMER #2 90-mal bei 186: in Europa öfter als jedes zweite Mal. Merlin steht in allen drei Qualifikationen auf Platz zwei, obwohl sie in weniger als jedem zehnten Deck steckt. Dorothy und Wicked Stepmother wurden pro Qualifikation weniger als 30-mal beim Bann gesehen (Dorothy in AMER #2: 9-mal): Ihre Zahlen schwanken stark und sagen wenig.

## King Arthur: in Amerika gebannt, in Europa fast nie {#king-arthur}

Der größte Unterschied zwischen den Qualifikationen ist King Arthur: gebannt 15-mal bei 66 in AMER #1 (22,7 %), 4-mal bei 63 in EMEA #1 (6,3 %) und 18-mal bei 75 in AMER #2 (24,0 %). Die Stichproben sind ähnlich groß, es ist also kein Zufall: In den beiden Qualifikationen in Amerika haben die Spieler sie etwa jedes vierte Mal gebannt, in Europa fast nie. Queen of Hearts zeigt einen kleineren Unterschied in dieselbe Richtung (21,0 % und 12,0 % in Amerika, 8,0 % in Europa). Unsere Lesart: In Amerika fürchtet man das Deck von King Arthur mehr; EMEA #2 wird zeigen, ob Europa es anders sieht.

## Robin Hood ist nicht mehr die am wenigsten gefürchtete {#robin-hood}

Nach AMER #1 war Robin Hood unter den mindestens 30-mal gesehenen Legendären die am seltensten gebannte (11,8 %). In den beiden folgenden Qualifikationen wurde sie fast jedes fünfte Mal gebannt: 20-mal bei 102 in EMEA #1 und 8-mal bei 43 in AMER #2. Jetzt sind andere am wenigsten gefürchtet: King Arthur in Europa (6,3 %), Dracula (9,2 %) und Legion of the Dead (10,6 %) in AMER #2. Legion wird jedes Mal seltener gebannt (19,2 %, 15,4 %, 10,6 %), steckt aber weiterhin in etwa jedem zehnten Deck.

## Pigs, am häufigsten mitgebracht und jedes Mal etwas öfter gebannt {#mitgebracht}

Anteil der Decks in Koins Tabelle mit jeder Legendären:

| Legendäre | AMER #1 | EMEA #1 | AMER #2 |
|---|---|---|---|
| Three Not So Little Pigs | 23,3 % | 23,4 % | 24,0 % |
| Van Helsing | 18,7 % | 19,7 % | 20,1 % |
| Legion of the Dead | 9,3 % | 9,7 % | 9,8 % |
| Merlin | 9,8 % | 9,7 % | 9,0 % |
| Dracula | 7,4 % | 5,8 % | 7,2 % |
| Mulan | 6,7 % | 8,3 % | 7,0 % |
| King Arthur | 6,4 % | 5,7 % | 6,5 % |
| Robin Hood | 7,2 % | 7,7 % | 6,5 % |
| Queen of Hearts | 6,5 % | 6,7 % | 6,5 % |
| Dorothy | 3,2 % | 2,3 % | 2,2 % |
| Wicked Stepmother | 1,5 % | 0,9 % | 1,2 % |

Three Not So Little Pigs steckt in jeder Qualifikation in fast jedem vierten Deck (216 Decks in EMEA #1, 214 in AMER #2), und ihre Ban-Rate steigt jedes Mal: 32,8 %, 34,9 %, 36,1 %. Pigs und Van Helsing zusammen stecken in mehr als vier von zehn Decks. Die Reihenfolge der anderen bewegt sich kaum: Das Meta des Turniers ist stabil.

## Die Karten: Baby Bear vorn, 15 Karten immer in den Top 20 {#karten}

Anteil aller eingereichten Decks, die die Karte enthalten, so wie Koin ihn veröffentlicht, in der Reihenfolge von AMER #2. Ein Strich heißt, dass die Karte nicht in den Top 20 dieser Qualifikation steht: Das ist nicht null, und wir schätzen es nicht.

| # | Karte | AMER #2 | EMEA #1 | AMER #1 |
|---|---|---|---|---|
| 1 | Baby Bear | 46,1 % | 50,1 % | 47,2 % |
| 2 | Mind Palace | 33,8 % | 33,0 % | 31,7 % |
| 3 | Spellbook | 32,5 % | 32,5 % | 32,4 % |
| 4 | Roo | 31,3 % | 32,6 % | 33,7 % |
| 5 | Trash for Treasure | 29,0 % | 31,0 % | 29,9 % |
| 6 | Golden Egg | 27,9 % | 29,3 % | 30,2 % |
| 7 | Ali Baba | 26,9 % | 28,8 % | 28,2 % |
| 8 | Scarecrow | 25,9 % | 25,6 % | 22,1 % |
| 9 | Dark Omen | 25,7 % | 28,7 % | 27,4 % |
| 10 | Impundulu | 24,7 % | 21,1 % | 22,3 % |
| 11 | Bagheera | 23,5 % | 22,7 % | — |
| 12 | Tin Woodman | 23,3 % | 25,4 % | 21,6 % |
| 13 | Sandman | 23,2 % | 22,8 % | 23,9 % |
| 14 | Mummy | 22,2 % | 26,6 % | 24,9 % |
| 15 | Bullseye | 21,8 % | — | 21,6 % |
| 16 | Defense Matrix | 21,2 % | — | 22,1 % |
| 17 | Forbidden Knowledge | 21,1 % | 23,2 % | 22,3 % |
| 18 | En Passant | 21,0 % | 23,5 % | 21,7 % |
| 19 | Shahrazad | 20,8 % | — | 20,3 % |
| 20 | Stroke of Midnight | 20,5 % | 23,1 % | — |

Baby Bear ist in allen drei Qualifikationen die meistgespielte Karte, in Europa in der Hälfte der Decks (50,1 %). Spellbook bewegt sich nicht (32,4 %, 32,5 %, 32,5 %). Fünfzehn Karten stehen in jeder Qualifikation in den Top 20. Bagheera und Stroke of Midnight sind in EMEA #1 dazugekommen und in AMER #2 geblieben; in EMEA #1 standen in den Top 20 außerdem Obliterate (23,8 %), Jekyll (21,2 %) und Reinforcements (21,0 %), die in der Tabelle von AMER #2 fehlen.

## Was das für APAC und EMEA #2 bedeutet {#naechste}

Die letzten beiden Qualifikationen, APAC und EMEA #2, werden am 22. Oktober gespielt. Unsere Lesart:

- Van Helsing und Merlin werden überall fast jedes zweite Mal gebannt: Wer sie mitbringt, sollte damit rechnen, mit den anderen beiden Decks zu spielen;
- Pigs ist die am häufigsten mitgebrachte Legendäre und die, die jedes Mal öfter gebannt wird: Je öfter sie mitgebracht wird, desto mehr zieht sie den Bann auf sich;
- in Europa wurde King Arthur bisher fast nie gebannt: Bestätigt EMEA #2 das, ist sie dort die Legendäre, die am ehesten auf dem Tisch bleibt.

## Alle Qualifikationen im Vergleich {#seite}

Unsere [Seite zur Crimson Cup](/de/analytics/crimson-cup) hat einen neuen Abschnitt, [die Qualifikationen im Vergleich](/de/analytics/crimson-cup#across): Ban-Rate, mitgebrachte Decks und meistgespielte Karten mit einer Spalte pro Qualifikation, der Spalte „Zusammen“ für alle gemeinsam und der Veränderung von einer Qualifikation zur nächsten. Die Seite jeder Qualifikation bleibt, wie sie war, mit dem Vergleich zur Ladder; die Kartenseiten, etwa [King Arthur](/de/cards/king-arthur) und [Baby Bear](/de/cards/baby-bear), zeigen die Zahlen der jüngsten Qualifikation.

## Woher das kommt {#quellen}

- Die Tabellen, die Koin Games nach EMEA #1 (gelesen am 21. Oktober 2026) und nach AMER #2 (gelesen am 22. Oktober 2026) auf dem [offiziellen Discord](https://discord.gg/originstcg) veröffentlicht hat.
- Für AMER #1 die am 20. Oktober 2026 gelesenen Tabellen, in unserem [ersten Meta Report](/de/news/crimson-cup-meta-report-amer-1).`,
    faq: [
      {
        q: "Welche Legendäre wird in der Crimson Cup am häufigsten gebannt?",
        a: "Van Helsing, in allen drei Qualifikationen mit offiziellen Zahlen: 44,4 % in AMER #1, 51,1 % in EMEA #1 und 48,4 % in AMER #2, laut Koin Games. Merlin liegt jedes Mal auf Platz zwei (42,2 %, 48,6 %, 47,5 %).",
      },
      {
        q: "Ist das Meta der Crimson Cup in Europa anders als in Amerika?",
        a: "Größtenteils nicht: Gebannt und mitgebracht werden dieselben Legendären, und Baby Bear ist überall die meistgespielte Karte. Die Ausnahme ist King Arthur, in EMEA #1 in 6,3 % der Fälle gebannt, gegenüber 22,7 % und 24,0 % in den beiden Qualifikationen in Amerika.",
      },
      {
        q: "Wo sehe ich die Zahlen jeder Qualifikation der Crimson Cup?",
        a: "Auf unserer Seite zur Crimson Cup in Analytics: ein Tab pro Qualifikation, mit Koins Tabellen und dem Vergleich mit der Ladder, und ein Abschnitt, der alle Qualifikationen nebeneinanderstellt.",
      },
    ],
  },
  "crimson-cup-meta-report-amer-1": {
    title: "Meta Report der Crimson Cup: Van Helsing am häufigsten gebannt, Pigs am häufigsten mitgebracht in AMER #1",
    metaTitle: "Origins TCG Crimson Cup Meta Report: AMER #1",
    description:
      "Crimson Cup von Origins TCG, AMER #1 in Koins offiziellen Zahlen: Van Helsing zu 44,4 % gebannt, Pigs in 168 Decks, Baby Bear in 47,2 % und die Ladder.",
    summary:
      "Koin Games hat die ersten offiziellen Zahlen der Crimson Cup veröffentlicht, aus der Qualifikation AMER #1: welche Legendären gebannt wurden, welche die Spieler mitgebracht haben und welche Karten am meisten gespielt wurden. Van Helsing ist am häufigsten gebannt (44,4 %), Three Not So Little Pigs am häufigsten mitgebracht (168 Decks), und Baby Bear steckt in 47,2 % der Decks. Alle Zahlen, Qualifikation für Qualifikation und neben der Ladder, findest du auf unserer neuen Seite zur Crimson Cup.",
    highlights: [
      { label: "Van Helsing, die man bannt", text: "gebannt in 44,4 % der Fälle, in denen sie gesehen wurde, Merlin knapp dahinter mit 42,2 %", anchor: "bans" },
      { label: "Pigs, am häufigsten mitgebracht", text: "168 Decks, 23,3 % der eingereichten, und trotzdem zu 32,8 % gebannt", anchor: "mitgebracht" },
      { label: "Robin Hood, die am wenigsten gefürchtete", text: "nur zu 11,8 % gebannt und trotzdem unter den stärksten in der Ladder", anchor: "robin-hood" },
      { label: "Baby Bear in fast jedem zweiten Deck", text: "47,2 %, danach Roo, Spellbook und Mind Palace", anchor: "karten" },
      { label: "Turnier gegen Ladder", text: "Pigs und Van Helsing öfter mitgebracht als gespielt, bei Legion umgekehrt", anchor: "ladder" },
      { label: "Eine Seite für die Crimson Cup", text: "Koins Zahlen Qualifikation für Qualifikation, in Analytics und auf den Kartenseiten", anchor: "seite" },
    ],
    body: `## Die Zahlen, die Koin veröffentlicht hat {#zahlen}

Nach der ersten Qualifikation der Crimson Cup, AMER #1 am 19. Oktober, hat Koin Games auf seinem offiziellen Discord zwei Tabellen veröffentlicht: die Bannphase jeder Legendären und die meistgespielten Karten in den eingereichten Decks. Es sind Summen: Die Decklists bleiben bis zur Top 4 verborgen ([die Regeln](/de/news/crimson-cup-format-check-in#decklisten)), deshalb zeigen sie keine einzelnen Listen, aber sie verraten, was die Spieler gefürchtet haben und worauf sie sich verlassen haben. Wir haben sie neben der Ladder auf einer neuen Seite gesammelt: [die Zahlen der Crimson Cup](/de/analytics/crimson-cup).

## Der Bann: zuerst Van Helsing, knapp dahinter Merlin {#bans}

In der Crimson Cup siehst du vom Gegner nur die drei Legendären, dann bannst du eines seiner Decks. Die Ban-Rate gibt an, wie oft eine Legendäre gebannt wurde, gemessen an den Malen, in denen ein Gegner sie beim Bann vor sich hatte.

| Legendäre | Ban-Rate | Gebannt / gesehen | Decks | Weiteste Runde |
|---|---|---|---|---|
| Van Helsing | 44,4 % | 96/216 | 135 | 4 |
| Merlin | 42,2 % | 38/90 | 71 | 4 |
| Three Not So Little Pigs | 32,8 % | 86/262 | 168 | 4 |
| Dorothy | 23,1 % | 6/26 | 23 | 4 |
| King Arthur | 22,7 % | 15/66 | 46 | 4 |
| Queen of Hearts | 21,0 % | 13/62 | 47 | 4 |
| Mulan | 20,3 % | 13/64 | 48 | 4 |
| Legion of the Dead | 19,2 % | 19/99 | 67 | 4 |
| Dracula | 14,1 % | 9/64 | 53 | 4 |
| Robin Hood | 11,8 % | 8/68 | 52 | 4 |
| Wicked Stepmother | 11,1 % | 1/9 | 11 | 3 |

Van Helsing wurde fast jedes zweite Mal gebannt. Die Überraschung ist Merlin: viel seltener mitgebracht (71 Decks), aber wenn sie da war, wurde sie in 42,2 % der Fälle gebannt, obwohl sie in der Ladder nur 48,1 % gewinnt. Zehn von elf Legendären hatten ein Deck in Runde 4, der Runde der 32 Qualifizierten: Nur Wicked Stepmother war in Runde 3 Schluss.

## Pigs, am häufigsten mitgebracht {#mitgebracht}

Three Not So Little Pigs steckt in 168 Decks, 23,3 % der in Koins Tabelle gezählten: fast jedes vierte Deck, mehr als bei jeder anderen Legendären. Trotzdem wird sie in 32,8 % der Fälle gebannt, wer sie mitbringt, muss also oft mit den anderen beiden gewinnen. Dahinter folgt Van Helsing mit 135 Decks (18,7 %), dann Merlin (71) und Legion of the Dead (67); ganz unten Dorothy (23) und Wicked Stepmother (11).

## Robin Hood, die am wenigsten gefürchtete {#robin-hood}

Robin Hood ist die am seltensten gebannte unter den Legendären, die mindestens 30-mal gesehen wurden: 8 Banns bei 68, 11,8 %. Dabei gehört sie in der Ladder zu den drei stärksten: Sie gewinnt 60,6 %, neben Pigs (60,7 %) und Van Helsing (59,8 %), und in unserem [Meta Report vom 19. Oktober](/de/news/meta-report-2026-10-19#dreieck) war sie diejenige, die Van Helsing schlägt. Im Turnier wurde sie seltener mitgebracht (52 Decks, 7,2 %) und fast nie gebannt. Unsere Lesart: Im Moment ist sie die Legendäre, die am häufigsten auf dem Tisch bleibt.

## Die Karten in fast jedem zweiten Deck {#karten}

Anteil aller eingereichten Decks, die die Karte enthalten, so wie Koin ihn veröffentlicht hat: Gezählt werden alle Angemeldeten, nicht nur diejenigen, die ein Match gespielt haben.

| # | Karte | Anteil der Decks | Decks |
|---|---|---|---|
| 1 | Baby Bear | 47,2 % | 341 |
| 2 | Roo | 33,7 % | 244 |
| 3 | Spellbook | 32,4 % | 234 |
| 4 | Mind Palace | 31,7 % | 229 |
| 5 | Golden Egg | 30,2 % | 218 |
| 6 | Trash for Treasure | 29,9 % | 216 |
| 7 | Ali Baba | 28,2 % | 204 |
| 8 | Dark Omen | 27,4 % | 198 |
| 9 | Mummy | 24,9 % | 180 |
| 10 | Sandman | 23,9 % | 173 |
| 11 | Impundulu | 22,3 % | 161 |
| 12 | Forbidden Knowledge | 22,3 % | 161 |
| 13 | Scarecrow | 22,1 % | 160 |
| 14 | Defense Matrix | 22,1 % | 160 |
| 15 | En Passant | 21,7 % | 157 |
| 16 | Bullseye | 21,6 % | 156 |
| 17 | Tin Woodman | 21,6 % | 156 |
| 18 | Reinforcements | 21,3 % | 154 |
| 19 | Obliterate | 20,9 % | 151 |
| 20 | Shahrazad | 20,3 % | 147 |

Baby Bear war schon in der Ladder die meistgespielte Karte von Patch 0.7, und im Turnier steckt sie in fast jedem zweiten Deck. Koin veröffentlicht die Top 20: Die übrigen Karten stehen nicht in der Tabelle, und wir schätzen sie nicht.

## Turnier gegen Ladder {#ladder}

Neben der Ladder, also den Matches, die mit OriginsMeta Tracker auf Patch 0.7 aufgezeichnet wurden (Stand 20. Oktober), zeigen die Unterschiede, worauf sich die Spieler verlassen, wenn es zählt:

- **Pigs und Van Helsing** werden öfter zum Turnier mitgebracht, als sie in der Ladder gespielt werden: 23,3 % der Decks gegenüber 17,4 % der Auftritte in der Ladder, und 18,7 % gegenüber 13,2 %.
- **Legion of the Dead** geht den umgekehrten Weg: 15,3 % in der Ladder, 9,3 % der Turnierdecks; Dracula 10,6 % gegenüber 7,4 %.
- Bei den Karten fallen **Obliterate** (34,9 % in der Ladder, 20,9 % im Turnier), **Golden Egg** und **Mummy** am stärksten ab; **Shahrazad** und **Scarecrow** steigen. Die beiden Messungen sind verschieden (eingereichte Decks, aufgezeichnete Partien), vergleiche die Karten also eher untereinander als jeden einzelnen Unterschied.

## Was das für die nächsten Qualifikationen bedeutet {#naechste}

Unsere Lesart für EMEA #1, AMER #2, APAC und EMEA #2:

- Wer Van Helsing oder Pigs mitbringt, muss mit einem Bann rechnen, bei Van Helsing fast jedes zweite Mal: Das dritte Deck zählt so viel wie die ersten beiden;
- Robin Hood wird selten gebannt und schlägt in der Ladder Van Helsing: Sie ist die Legendäre, die am ehesten auf dem Tisch bleibt;
- Merlin zieht Banns weit über ihre Ergebnisse in der Ladder hinaus an: In einem Trio kann sie den Bann von deinen anderen beiden Decks ablenken.

## Eine Seite für die Crimson Cup {#seite}

Ab heute hat Analytics eine [Seite zur Crimson Cup](/de/analytics/crimson-cup) mit Koins offiziellen Zahlen, Qualifikation für Qualifikation: Ban-Rate, Decks, meistgespielte Karten und der Vergleich mit der Ladder. Auch die Seiten der Legendären und der meistgespielten Karten zeigen ihre Zahlen aus der Crimson Cup, etwa [Van Helsing](/de/cards/van-helsing) und [Baby Bear](/de/cards/baby-bear). Wir ergänzen jede Qualifikation, sobald Koin ihre Zahlen veröffentlicht.

## Woher das kommt {#quellen}

- Die Tabellen, die Koin Games nach der Qualifikation AMER #1 auf dem [offiziellen Discord](https://discord.gg/originstcg) veröffentlicht hat, gelesen am 20. Oktober 2026.
- Die Ladder: mit OriginsMeta Tracker auf Patch 0.7 aufgezeichnete Matches, normale und Ranked zusammen, gelesen auf unserer [Seite zur Crimson Cup](/de/analytics/crimson-cup) am 20. Oktober 2026.`,
    faq: [
      {
        q: "Welche Legendäre wurde in der Crimson Cup am häufigsten gebannt?",
        a: "Van Helsing: In der Qualifikation AMER #1 am 19. Oktober 2026 haben die Gegner sie 96-mal bei 216 Gelegenheiten gebannt (44,4 %), laut den offiziellen Zahlen von Koin Games. Dahinter folgen Merlin mit 42,2 % und Three Not So Little Pigs mit 32,8 %.",
      },
      {
        q: "Welche Karten werden in der Crimson Cup am meisten gespielt?",
        a: "Baby Bear, in 47,2 % der für AMER #1 eingereichten Decks, danach Roo (33,7 %), Spellbook (32,4 %), Mind Palace (31,7 %) und Golden Egg (30,2 %). Koin veröffentlicht die Top 20.",
      },
      {
        q: "Sind die Decklists der Crimson Cup öffentlich?",
        a: "Noch nicht: Sie bleiben bis zur Top 4 verborgen. Koin veröffentlicht Summen (Banns, Legendäre und meistgespielte Karten), die wir Qualifikation für Qualifikation auf unserer Seite zur Crimson Cup in Analytics sammeln.",
      },
    ],
  },
  "meta-report-2026-10-19": {
    title: "Meta Report, 19. Oktober: Pigs, Van Helsing und Robin Hood vorn in Patch 0.7 zum Start der Crimson Cup",
    metaTitle: "Origins TCG Meta Report, 19. Oktober: Meta 0.7",
    description:
      "Meta von Origins TCG am 19. Oktober aus 2.478 Matches: das Dreieck Pigs, Van Helsing, Robin Hood, Top-Archetypen und -Karten und was es für Conquest heißt.",
    summary:
      "Unser erster Meta Report, der ab jetzt jeden Montag erscheint: der Stand von Patch 0.7 aus den 2.478 Matches, die mit OriginsMeta Tracker aufgezeichnet wurden, am Tag, an dem die Qualifikationen der Crimson Cup beginnen. Drei Legendäre gewinnen rund 60 % und schlagen sich im Kreis, Control ist der meistgespielte Archetyp und Discard der, der am meisten gewinnt, und vor dem Turnier kommt kein Balance-Patch mehr.",
    highlights: [
      { label: "Drei Legendäre an der Spitze", text: "Pigs 61,2 %, Van Helsing 61,0 %, Robin Hood 59,9 %", anchor: "legendaere" },
      { label: "Ein Dreieck, kein König", text: "Van Helsing schlägt Pigs, Pigs schlägt Robin Hood, Robin Hood schlägt Van Helsing", anchor: "dreieck" },
      { label: "Dracula und Legion, zwei Messungen", text: "unter 50 %, wenn man beide Seiten zählt, weit höher bei denen, die sie aufzeichnen", anchor: "zwei-messungen" },
      { label: "Archetypen und Karten", text: "Control am meisten gespielt, Discard und Swarm gewinnen am meisten, Obliterate beendet Partien", anchor: "archetypen" },
      { label: "Kein Patch vor der Crimson Cup", text: "und was die Zahlen für deine drei Conquest-Decks bedeuten", anchor: "crimson-cup" },
    ],
    body: `## Was der Meta Report ist {#meta-report}

Ab heute schauen wir jeden Montag, wie sich das Meta von Origins TCG bewegt: welche Legendären gewinnen, welche Archetypen und Karten im Kommen sind und was die Patches ändern. Die Zahlen stammen von unserer [Analytics-Seite](/de/analytics), die auf den Matches beruht, die Spieler mit [OriginsMeta Tracker](/de/tracker) aufzeichnen; die Deutungen sind unsere eigenen, geschrieben mit dem, was wir über das Spiel wissen.

Das ist die Ausgabe null, der Ausgangspunkt: Patch 0.7, mit **2.478 aufgezeichneten Matches**, normale und Ranked zusammen. Nächsten Montag vergleichen wir mit diesen Zahlen.

## Drei Legendäre an der Spitze {#legendaere}

| Legendäre | Win-Rate | Matches |
|---|---|---|
| Three Not So Little Pigs | 61,2 % | 709 |
| Van Helsing | 61,0 % | 575 |
| Robin Hood | 59,9 % | 362 |
| Queen of Hearts | 50,3 % | 306 |
| Merlin | 45,9 % | 368 |
| Legion of the Dead | 43,6 % | 617 |
| Dracula | 43,3 % | 436 |
| Mulan | 42,3 % | 293 |
| King Arthur | 36,5 % | 197 |
| Wicked Stepmother | 28,6 % | 105 |
| Dorothy | 20,0 % | 85 |

Hier zählen beide Seiten jedes Matches, der Durchschnitt liegt also bei 50 %. Pigs, Van Helsing und Robin Hood bleiben selbst am unteren Rand ihres wahrscheinlichen Bereichs über 50 %; Queen of Hearts liegt genau auf der Linie. Ganz unten reichen die beiden Karten, die Koin am 21. September gebufft hat, Wicked Stepmother und Dorothy, noch immer nicht, damit ihre Decks funktionieren. Alles über jede Legendäre steht in unserem [Guide zu den Legendären](/de/guides/origins-tcg-legendaries).

## Ein Dreieck, kein König {#dreieck}

Die drei an der Spitze dominieren sich nicht gegenseitig, sie schlagen sich im Kreis:

- **Van Helsing schlägt Pigs**, 56 % der Matches zwischen den beiden;
- **Pigs schlägt Robin Hood**, 54 % (28–33 aus Sicht von Robin Hood bei 61 Matches);
- **Robin Hood schlägt Van Helsing**, 55 %.

Robin Hood hat außerdem das einseitigste Matchup des Patches: **26 Siege bei 30 Matches gegen Dracula**. Unsere Deutung: Es gibt nicht das eine beste Deck zum Kopieren, sondern einen Kreis, aus dem man wählt, und das zählt in einem Format mit drei Decks sehr viel.

## Dracula und Legion: zwei Messungen, die nicht übereinstimmen {#zwei-messungen}

Dracula (43,3 %) und Legion of the Dead (43,6 %) gehören zu den meistgespielten und liegen, wenn man beide Seiten zählt, unter 50 %. Schauen wir aber nur auf die Decks derer, die ihre Matches aufzeichnen, gewinnen dieselben beiden Legendären weit mehr: Am 18. Oktober lag Dracula von dieser Seite bei 75,9 % und Legion bei 74,0 %. Bis zur Version 0.4.7 vom 14. Oktober hat der Tracker auch Matches gegen Bots aufgezeichnet, und Dracula ist der Boss der Demo-Missionen: Ein Teil dieser „Dracula-Niederlagen“ waren wahrscheinlich Bots. Bis wir die Stichprobe bereinigt haben, lässt sich keine der beiden Messungen allein lesen, und wir nennen diese beiden Decks nicht schwach.

## Archetypen und Karten {#archetypen}

Archetypen und Karten zählen nur die Decks derer, die aufzeichnen, und die gewinnen 66,0 % ihrer Matches: Man liest sie im Vergleich untereinander, nicht im Vergleich zu 50 %.

- **Control** ist der meistgespielte Archetyp (38 % der Matches) und gewinnt 66,7 %, genau im Durchschnitt.
- **Discard** (75,7 %, 210 Matches) und **Swarm** (75,6 %, 127) gewinnen am meisten; **Midrange** (63,1 %, 33 % der Matches) und **Combo** (61,4 %) liegen darunter.
- **Baby Bear** steckt in 53 % der aufgezeichneten Decks: die meistgespielte Karte des Patches.
- **Obliterate** gewinnt, wenn sie gespielt wird, in 87,3 % der Fälle, um Runde 8 herum: Sie ist die Karte, die Partien beendet.
- **Wicked Stepsisters** steigt von 26,7 % im Deck auf 64,5 %, wenn sie gespielt wird: eine Situationskarte, die gewinnt, wenn sie ihren Moment findet, keine schwache Karte.

## Patches: nichts Neues vor der Crimson Cup {#patch}

Patch 0.7 vom 29. September ist der letzte Balance-Patch vor dem Turnier, und die [Demo 0.7.1 vom 15. Oktober](/de/news/demo-patch-notes-0-7-1) hat Ranked gebracht, aber keine Balance-Änderungen, deshalb zählen ihre Matches als 0.7. In seinem AMA vom 2. Oktober hat Koin gesagt, dass die Karten vor der Crimson Cup nicht angefasst werden: Wenn etwas Ernstes auftaucht, wird es gebannt. Das Meta, das wir hier beschreiben, ist also das des Turniers.

## Was das für die Crimson Cup bedeutet {#crimson-cup}

Unsere Deutung für alle, die drei Decks zu [Conquest](/de/guides/origins-tcg-conquest) mitbringen, wo der Gegner eines bannt:

- zwei aus dem Dreieck sind eine solide Basis, aber welches Paar du auch mitbringst, eine der drei schlägt eines deiner Decks;
- das dritte Deck stopft dieses Loch: gegen Pigs Van Helsing, gegen Van Helsing Robin Hood;
- der Bann ist die Entscheidung, die am meisten wiegt: Such das Deck des Gegners, das zwei deiner Decks schlägt, nicht das absolut stärkste.

Den Zeitplan der Qualifikationen und wo du sie sehen kannst, findest du im [heutigen Artikel](/de/news/crimson-cup-qualifiers-where-to-watch).

## Wie wir die Zahlen lesen {#methode}

- Quelle: mit OriginsMeta Tracker auf Patch 0.7 aufgezeichnete Matches, normale und Ranked zusammen; gelesen am 19. Oktober 2026.
- Legendäre und Matchups zählen beide Spieler; Decks, Archetypen und Karten nur die, die aufzeichnen.
- Die Ranglisten verwenden die vorsichtige Win-Rate, den unteren Rand des wahrscheinlichen Bereichs, damit 300 Matches mehr zählen als 30.
- Jede Zahl steht auf der [Analytics-Seite](/de/analytics), die alle fünf Minuten aktualisiert wird. Wenn du spielst, zeichne deine Matches auf: Je mehr es sind, desto genauer wird der Report am nächsten Montag.`,
    faq: [
      {
        q: "Welche Legendäre ist in Origins TCG gerade die stärkste?",
        a: "Am 19. Oktober 2026, auf Patch 0.7, gewinnen drei Legendäre rund 60 %, wenn man beide Seiten jedes Matches zählt: Three Not So Little Pigs (61,2 %), Van Helsing (61,0 %) und Robin Hood (59,9 %). Sie schlagen sich im Kreis, keine von ihnen ist also gegen alles die beste.",
      },
      {
        q: "Woher kommen die Zahlen des Meta Reports?",
        a: "Aus den Matches, die Spieler mit OriginsMeta Tracker aufzeichnen, unserer Windows-App, und die auf der Seite OriginsMeta Analytics zu sehen sind. Legendäre und Matchups zählen beide Spieler; Decks, Archetypen und Karten nur die, die aufzeichnen.",
      },
      {
        q: "Gibt es vor der Crimson Cup einen Balance-Patch?",
        a: "Nein. Patch 0.7 vom 29. September 2026 ist der letzte Balance-Patch vor dem Turnier, und Koin hat gesagt, dass die Karten vor der Crimson Cup nicht angefasst werden: Eine Karte mit einem ernsten Problem würde stattdessen gebannt.",
      },
    ],
  },
  "crimson-cup-qualifiers-where-to-watch": {
    title: "Qualifikationen der Crimson Cup: Termine, Uhrzeiten, wo du sie sehen kannst, und Broadcasting OM für Streamer",
    metaTitle: "Origins TCG Crimson Cup: Qualifikationen live sehen",
    description:
      "Qualifikationen der Crimson Cup von Origins TCG, 19. bis 22. Oktober: Termine, Uhrzeiten, Check-in, Twitch und Broadcasting OM, unser kostenloses Overlay.",
    summary:
      "Die Crimson Cup beginnt heute Abend, am 19. Oktober, mit der AMER-Qualifikation um 19:00 EST: fünf Qualifikationen bis zum 22. Oktober, dann die Playoffs am 24. und das Finale am 25. Koin Games überträgt jedes Event auf seinem offiziellen Twitch-Kanal, der während der Übertragung auch auf der Startseite von OriginsMeta erscheint, und jeder darf co-streamen. Für alle, die das tun, haben wir Broadcasting OM gebaut: ein kostenloses Overlay für OBS mit Namen, Spielstand, den drei Decks und den Karten, die in jeder Liste noch übrig sind.",
    highlights: [
      { label: "Fünf Qualifikationen, 19. bis 22. Oktober", text: "die erste ist AMER heute Abend um 19:00 EST, die letzte EMEA am Donnerstag um 19:00 CEST", anchor: "zeitplan" },
      { label: "Check-in und Anmeldung", text: "der Check-in öffnet zwei Stunden vorher und schließt fünf Minuten vor dem Start, zusammen mit deinen Decks", anchor: "check-in" },
      { label: "Wo du zusehen kannst", text: "Koins offizieller Twitch-Kanal, während der Übertragung auf unserer Startseite, und die Co-Streams der Creator", anchor: "wo-zuschauen" },
      { label: "Broadcasting OM", text: "unser kostenloses Overlay, um ein Match zu streamen: Namen, Spielstand, drei Decks, übrige Karten, Sponsoren", anchor: "broadcasting-om" },
      { label: "Einrichtung in OBS", text: "ein Steuerpult und eine Browserquelle, in fünf Minuten", anchor: "obs" },
    ],
    body: `## Termine und Uhrzeiten der Qualifikationen {#zeitplan}

Die Crimson Cup, das Turnier von Koin Games zum Steam Next Fest, beginnt heute Abend. Es gibt fünf Qualifikationen mit je 512 Plätzen, offen für alle, egal wo sie wohnen, und aus jeder kommen 32 Spieler weiter:

| Tag | Offizielle Uhrzeit | Region |
|---|---|---|
| Montag, 19. Oktober | 19:00 EST | AMER (am 5. Oktober hinzugefügt) |
| Dienstag, 20. Oktober | 19:00 CEST | EMEA |
| Mittwoch, 21. Oktober | 21:00 EST | AMER |
| Donnerstag, 22. Oktober | 19:00 SGT | APAC |
| Donnerstag, 22. Oktober | 19:00 CEST | EMEA (am 5. Oktober hinzugefügt, schließt die Qualifikationen ab) |

Zu den 160 Qualifizierten kommen 96 Wildcards: 256 Spieler in den **Playoffs am Samstag, 24. Oktober, um 10:00 EST** (16:00 CEST, 22:00 SGT), und vier von ihnen erreichen das **Finale am Sonntag, 25. Oktober, um 10:00 EST**. Die Uhrzeiten sind die der offiziellen Grafik von Koin, ohne Umrechnungen von uns. Das Preisgeld mit der Promo-Karte Dracula 1/1 steht in unserem [Artikel zu Preisen und Qualifikationen](/de/news/crimson-cup-prizepool-qualifiers#preise).

## Check-in, Anmeldung und Format {#check-in}

- Die **Anmeldung** läuft über den [offiziellen Discord](https://discord.gg/originstcg). Du kannst an mehr als einer Qualifikation teilnehmen, aber Koin bittet dich, dich nur für die anzumelden, an denen du wirklich teilnehmen kannst.
- Der **Check-in** öffnet zwei Stunden vor jeder Qualifikation und schließt fünf Minuten vor dem Start, zusammen mit der Abgabe der Decks: Verpasst du ihn, spielst du nicht ([die Regeln](/de/news/crimson-cup-format-check-in#check-in)).
- **Format**: [Conquest](/de/guides/origins-tcg-conquest) mit drei Decks, Matches im Best-of-Three, Decklists bis zur Top 4 verborgen (beim Bann siehst du nur die Legendäre), großes Finale im Best-of-Five. Sieben Orte sind aus dem Pool genommen: Die Liste steht im [Artikel zum Preisgeld](/de/news/crimson-cup-prizepool-qualifiers#orte).
- Seite 8 des Regelwerks behandelt technische Probleme und das Deck-Tracking: Lies sie vor deinem ersten Match ([was sich am 14. Oktober geändert hat](/de/news/playtest-closing-crimson-cup-twitch#regelwerk)).

Wenn du deine drei Decks noch auswählst, fang bei den [Turnierdecks](/de/decks/tournament) und beim [Deckbuilder](/de/deck-builder) an, der die Conquest-Regel für dich prüft.

## Wo du die Matches sehen kannst {#wo-zuschauen}

- **Koins offizieller Twitch-Kanal**, [twitch.tv/originstcg](https://www.twitch.tv/originstcg): Koin hat am 14. Oktober angekündigt, dort jedes Event der Crimson Cup zu übertragen.
- **Die [Startseite](/de) von OriginsMeta**: Solange der offizielle Kanal mit Origins TCG live ist, nimmt der offizielle Stream den Platz unseres Sliders ein, und der Slider kommt zurück, wenn der Stream endet.
- **Die Co-Streams der Creator**: Koin erlaubt allen, die Crimson Cup zu co-streamen oder ihre eigenen Matches zu streamen. Auf unserer [Live-Seite](/de/live) findest du die Creator, die gerade mit Origins TCG live sind, mit ihrem Player.

## Broadcasting OM: unser Overlay, um ein Match zu streamen {#broadcasting-om}

Wenn du die Crimson Cup co-streamen oder ein eigenes Turnier kommentieren willst, gibt dir OriginsMeta ein kostenloses grafisches Overlay, das du über das Spiel legst: **Broadcasting OM**. Es besteht aus zwei Seiten:

- dem **Steuerpult**, [originsmeta.com/broadcast](https://originsmeta.com/broadcast), wo du das Match einträgst;
- dem **Overlay**, [originsmeta.com/broadcast/live](https://originsmeta.com/broadcast/live), mit transparentem Hintergrund, gemacht für eine OBS-Browserquelle in 1920 × 1080.

Was es im Stream zeigt:

- die **Namensschilder der beiden Spieler**, mit Deck 1, 2 und 3 und einem Punkt beim Deck, das gerade gespielt wird;
- den **Spielstand der Serie**, mit dem Namen des Turniers, der Phase (Qualifikation, Playoffs, Finale) und dem Format (Bo1, Bo3, Bo5);
- die **Decklists**, links, rechts oder ausgeblendet, mit den **übrigen Exemplaren** jeder Karte: Im Steuerpult markiert ein Klick auf eine Karte ein Exemplar als gespielt, und „Next game“ legt alle zurück;
- die **ganze Karte beim Darüberfahren**, mit Kosten, Kraft, Leben, Typ und Text in der Sprache des Overlays (Englisch, Italienisch, Spanisch oder Französisch), und einen Button **Copy deck** mit dem Spielcode;
- einen optionalen **Sponsorplatz**, der sich mit dem Spielstand abwechselt (standardmäßig 20 Sekunden Spielstand und 7 Sponsor, beides einstellbar), mit bis zu drei Logos oder Bannern zum Hochladen;
- die Zeile „not affiliated with Koin Games“, immer im Bild.

Das Match lässt sich auf vier Arten eintragen: mit dem Tag eines Turniers im [Turnierorganisator von OriginsMeta](/de/tournaments) (OM-XXXX), mit dem Link eines auf der Website veröffentlichten [Turnierdecks](/de/decks/tournament), indem du den Deckcode des Spiels einfügst, oder von Hand. „Demo match“ lädt ein Beispiel zum Ausprobieren.

**Eine Regel der Crimson Cup, die du beachten musst**: Die Decklists sind bis zur Top 4 verborgen. Bis dahin lässt du die Listen ausgeblendet und nutzt nur Namensschilder und Spielstand; ab der Top 4 kannst du sie zeigen.

## So richtest du es in OBS ein {#obs}

1. Öffne [originsmeta.com/broadcast](https://originsmeta.com/broadcast) als Dock in OBS: Docks → Custom Browser Docks, Adresse einfügen.
2. Füge das Overlay als Quelle hinzu: Quellen → + → Browser, Adresse [originsmeta.com/broadcast/live](https://originsmeta.com/broadcast/live), Breite 1920, Höhe 1080, über der Spielaufnahme.
3. Trag das Match im Dock ein: Das Overlay aktualisiert sich sofort, weil beide im selben OBS laufen.

Läuft das Overlay woanders (auf einem anderen PC, bei einem Co-Caster), kopiere die Adresse des Overlays aus dem Steuerpult: Sie trägt den Stand dieses Moments, kopiere sie also nach jeder Änderung neu. Für die Decks in deinen eigenen Matches gibt es außerdem den Chatbefehl !deck und das Deck-Overlay, erklärt in unserem [Guide für Streamer](/de/guides/streaming-tools).

## Noch im Test: was fehlt {#im-test}

Broadcasting OM ist eine erste Version, rechtzeitig zur Crimson Cup fertig. Auf unseren Servern wird nichts gespeichert: Der Stand, Sponsorbilder eingeschlossen, lebt in deinem Browser. Zuschauer auf Twitch können noch nicht auf das Overlay klicken (dafür braucht es eine Twitch-Erweiterung, die später kommt), und Spielstand und Exemplare werden von Hand im Steuerpult aktualisiert. Wenn du es während der Qualifikationen benutzt, sag uns auf [unserem Discord](https://discord.gg/54EctHTZzM), was fehlt.

## Woher das kommt {#quellen}

- Der Steam-Post von Koin Games vom 5. Oktober 2026, [„Prizepool announcement & key update to our biggest tournament ever“](https://store.steampowered.com/news/app/4429430/view/1845383656394214), und seine offizielle Kalendergrafik.
- Die am 24. September auf dem [offiziellen Discord](https://discord.gg/originstcg) angekündigten Regeln und die Twitch-Ankündigung vom 14. Oktober 2026.
- Broadcasting OM ist ein Werkzeug von OriginsMeta, nicht von Koin Games.`,
    faq: [
      {
        q: "Wann sind die Qualifikationen der Crimson Cup?",
        a: "Fünf Qualifikationen vom 19. bis 22. Oktober 2026: AMER am Montag, 19., um 19:00 EST, EMEA am Dienstag, 20., um 19:00 CEST, AMER am Mittwoch, 21., um 21:00 EST, APAC am Donnerstag, 22., um 19:00 SGT und EMEA am Donnerstag, 22., um 19:00 CEST. Playoffs am 24. Oktober und Finale am 25. Oktober, jeweils um 10:00 EST.",
      },
      {
        q: "Wo kann ich die Crimson Cup sehen?",
        a: "Auf dem offiziellen Twitch-Kanal von Koin Games, twitch.tv/originstcg, der jedes Event überträgt; während er live ist, erscheint der Stream auch auf der Startseite von OriginsMeta. Creator dürfen ihn co-streamen, und die Live-Seite von OriginsMeta listet alle, die gerade mit Origins TCG live sind.",
      },
      {
        q: "Was ist Broadcasting OM?",
        a: "Ein kostenloses Overlay von OriginsMeta, um ein Match von Origins TCG in OBS zu streamen: Namen, Spielstand der Serie, die drei Decks mit den übrigen Karten, Kartenvorschau, Deckcode und Sponsorplatz. Du füllst es auf originsmeta.com/broadcast aus und fügst originsmeta.com/broadcast/live als Browserquelle hinzu. Es ist kein Werkzeug von Koin Games.",
      },
    ],
  },
  "demo-patch-notes-0-7-1": {
    title: "Demo 0.7.1 von Origins TCG: Ranked ist vor dem Steam Next Fest live, und rund 100 Bugs sind behoben",
    metaTitle: "Origins TCG Demo 0.7.1 Patchnotes: Ranked ist live",
    description:
      "Demo 0.7.1 von Origins TCG vom 15. Oktober: Ranked öffnet vier Tage vor dem Steam Next Fest, du siehst den Mulligan des Gegners, rund 100 Bugs behoben.",
    summary:
      "Am 15. Oktober hat Koin Games die Demo von Origins TCG auf Steam auf Version 0.7.1 aktualisiert, an dem Tag, an dem der Playtest geschlossen hat. Die große Neuigkeit ist der Ranked-Modus, vier Tage vor dem Steam Next Fest: Vorerst endet die Ladder bei Grandmaster. Das Update bringt außerdem einen neuen Startbildschirm und neue Spielmatten, zeigt, wie viele Karten dein Gegner beim Mulligan ausgetauscht hat, und behebt rund 100 Bugs. Balance-Änderungen gibt es keine: Die Werte der Karten bleiben die von Patch 0.7.",
    highlights: [
      { label: "Der Ranked-Modus ist live", text: "vier Tage vor dem Steam Next Fest; vorerst endet die Ladder bei Grandmaster", anchor: "ranked" },
      { label: "Missionen in Ranked oder PvE", text: "du entscheidest, wo du sie erledigst", anchor: "missionen" },
      { label: "Der Mulligan des Gegners", text: "du siehst, wie viele Karten er ausgetauscht hat", anchor: "mulligan-des-gegners" },
      { label: "Neuer Startbildschirm und Spielmatten", text: "noch in Arbeit, mit einer Andeutung für die Zukunft", anchor: "startbildschirm-spielmatten" },
      { label: "Deine Sprache, schnellere Bots, rund 100 Fixes", text: "dazu eine schlauere Suche in der Sammlung und neue Stimmen", anchor: "verbesserungen" },
      { label: "Bekannte Probleme", text: "Spieltempo, Grading-Grafik noch nicht da, Übersetzungen noch in Arbeit", anchor: "bekannte-probleme" },
      { label: "Keine Balance-Änderungen", text: "die Werte der Karten auf OriginsMeta ändern sich nicht", anchor: "was-sich-nicht-aendert" },
    ],
    body: `## Ein kleines Update vor dem Steam Next Fest {#update}

Am 15. Oktober hat Koin Games die Hauptdemo von Origins TCG auf Steam auf Version 0.7.1 aktualisiert. Der Post auf Steam mit dem Titel „Ranked is here!“ ist um 20:52 UTC erschienen; die Versionsnummer steht auf dem offiziellen Bild des Updates, „Steam Demo Update 0.7.1“. „Dieses Update ist klein“, schreibt das Team, aber es wollte vor dem Steam Next Fest, das am 19. Oktober beginnt, noch ein paar Komfortverbesserungen und Funktionen in die Demo packen.

Es kommt am selben Tag, an dem der Playtest geschlossen hat ([unser Artikel](/de/news/playtest-closing-crimson-cup-twitch)): Ab jetzt ist die Demo die einzige spielbare Build, und sie ist auch die Build der Crimson Cup ([unser Guide zum Next Fest und zum Turnier](/de/guides/steam-next-fest-2026)). Mehrere Änderungen sind die, die der Playtest mit [Version 0.7.1 vom 8. Oktober](/de/news/playtest-patch-notes-0-7-1) bekommen hat; neu sind Ranked, der neue Startbildschirm, die Spielmatten und die Sprache beim Start.

## Der Ranked-Modus ist live {#ranked}

„It's been 84 years... but Ranked Mode is finally here!“, schreibt das Team. Du kletterst die Ladder hinauf und verdienst Preise, zusammen mit der „ernüchternden Erkenntnis, dass alle über dir dieses Spiel irgendwie besser spielen“. Vorerst endet die Ladder bei Grandmaster, der höchsten Division, und Koin sagt, es werde „diese Türen bald öffnen“.

Am 21. September hatte Koin geschrieben, dass Ranked mit dem Start des Steam Next Fest freigeschaltet würde: Es ist vier Tage früher gekommen. Im AMA vom 2. Oktober hatte das Team Termine „mit Bleistift“ genannt: eine Saison vom 19. Oktober bis zum 4. Dezember und eine Grandmaster-Rangliste, die während des Festivals geschlossen ist und ab dem 27. Oktober öffnet, damit alle gleichzeitig starten ([unser Artikel](/de/news/building-origins-ama-design-balance#ranked)). Die Patchnotes bestätigen, dass Grandmaster vorerst geschlossen ist, sagen aber nicht, ob die Saison ab heute zählt oder am 19. Oktober beginnt. Wie Ranked funktioniert, Divisionen und Victory Points eingeschlossen, steht in [unserem Ranked-Guide](/de/guides/origins-tcg-ranked).

### Missionen in Ranked oder PvE {#missionen}

Missionen lassen sich jetzt als PvE im Bereich Missionen oder als PvP in Ranked erledigen: Du entscheidest. Es ist dieselbe Wahl, die der Playtest am 8. Oktober bekommen hat, nachdem die Build vom 1. Oktober die Missionen nur noch als PvE erlaubt hatte.

## Die Neuerungen {#neuerungen}

### Der Mulligan des Gegners {#mulligan-des-gegners}

In der Mulligan-Phase siehst du jetzt, wie viele Karten dein Gegner ausgetauscht hat. Die Spieler haben sich das auf Discord gewünscht, und das Team sagt, die Idee sei so gut gewesen, dass es sie gleich am nächsten Tag umgesetzt hat.

### Neuer Startbildschirm und Spielmatten {#startbildschirm-spielmatten}

- **Startbildschirm:** „ziemlich viele“ Verbesserungen der Oberfläche. Das Team nennt ihn noch in Arbeit.
- **Spielmatten:** Startbildschirm und Match haben eine neue Spielmatte. „Oh whatever could this imply down the road?“, fügt das Team hinzu und sagt nichts weiter.

### Commanders, Spielfeld und Intro {#commanders-spielfeld}

- Die **Commanders**, wie die Notes sie nennen, sagen jetzt einen Sprachsatz und zeigen ihr Namensschild, wenn du sie dir genauer ansiehst.
- **Effekte auf dem Spielfeld:** Klicks auf dem Spielfeld lösen visuelle Effekte und Soundeffekte aus. Beides sind Platzhalter, und das Team bittet die Spieler, sie „nur mittelmäßig streng zu beurteilen“.
- **Intro-Film:** Ein Intro läuft einmal ab. Es braucht noch Feinschliff, und das Team möchte Meinungen auf Discord.

## Die Verbesserungen {#verbesserungen}

### Die Suche in der Sammlung {#sammlungssuche}

Die Suche in der Sammlung akzeptiert Ausdrücke aus mehreren Wörtern, und wer nach etwas sucht, das eine Karte beschwört, findet auch die Karte, die es beschwört. Auf OriginsMeta durchsucht die Suche in [Karten](/de/cards) und im [Deckbuilder](/de/deck-builder) schon Kartennamen und Kartentext.

### Emotes und Stimmen {#emotes-stimmen}

- In der Emote-Auswahl kannst du jetzt einen Platz leeren, so wird das Zusammenstellen deiner Emotes etwas einfacher.
- Huck Finn und Christopher Robin haben neue Stimmen: Sie klingen „nicht mehr wie unheimliche Männer mittleren Alters“. Die Spieler hatten das gesagt, und das Team schreibt, dass intern alle dasselbe sagten.

### Das Spiel startet in deiner Sprache {#sprache}

Das Spiel sollte jetzt in deiner eigenen Sprache starten, wenn dein System auf eine Sprache eingestellt ist, die das Spiel unterstützt. Patch 0.7 hatte das Spiel in 13 Sprachen gebracht ([unser Artikel](/de/news/patch-0-7)).

### Schnellere Bots {#bots}

Die vom Computer gesteuerten Gegner spielen nicht mehr ganz so langsam. Das Team sagt, es gebe noch mehr zu tun, hofft aber, dass man den Unterschied merkt.

### Rund 100 Bugs behoben {#behobene-bugs}

Nach der Zählung des Teams behebt das Update rund 100 Bugs. Die Notes listen sie nicht auf.

## Bekannte Probleme {#bekannte-probleme}

- **Spieltempo und Animationen.** Manches ist schneller, aber es gibt „noch SEHR viel zu tun“: Es bleibt eine der höchsten Prioritäten des Teams.
- **Grading-Grafik.** Sie hat es nicht in dieses Update geschafft; Koin sagt, es sollte „sehr bald“ etwas zu zeigen haben. Was Grading ist, mit den Sets und der Alpha Edition, steht in [unserem Artikel](/de/news/origins-sets-alpha-edition-grading).
- **Andere Sprachen.** Wenn du in einer anderen Sprache als Englisch spielst, sind die Übersetzungen noch in Arbeit, und es gibt viel Platzhaltertext.

## Was sich nicht ändert {#was-sich-nicht-aendert}

- **Keine Balance-Änderungen.** Die Werte der Karten bleiben die von [Patch 0.7](/de/news/patch-0-7) vom 29. September, dem letzten Balance-Patch vor der Crimson Cup: Kartenseiten, der [Deckbuilder](/de/deck-builder) und [MetaShifting](/de/metashifting) ändern sich nicht, und veröffentlichte Decks müssen nicht aktualisiert werden.
- **Wie man die Demo spielt**, bleibt gleich: unser [Guide zum Spielen der Demo](/de/guides/play-the-demo).

## Was wir noch nicht wissen {#was-wir-noch-nicht-wissen}

- Ob die Ranked-Saison ab dem 15. Oktober zählt oder am 19. Oktober mit dem Steam Next Fest neu beginnt.
- Welche Preise Ranked vergibt und wann genau sich die Türen von Grandmaster öffnen: Im AMA hieß es 27. Oktober, mit Bleistift.
- Was die neuen Spielmatten andeuten.
- Wann die Grading-Grafik kommt und welche Bugs behoben wurden.

## Woher diese Notes kommen {#quellen}

Der Post „Ranked is here!“, den Koin Games am 15. Oktober 2026 auf der [Steam-Seite von Origins TCG](https://store.steampowered.com/news/app/4429430/view/1846651706679257) veröffentlicht hat, und sein offizielles Bild, das die Versionsnummer 0.7.1 nennt.`,
    faq: [
      {
        q: "Gibt es den Ranked-Modus in der Demo von Origins TCG?",
        a: "Ja, seit der Demo 0.7.1 vom 15. Oktober 2026, vier Tage vor dem Steam Next Fest. Vorerst endet die Ladder bei Grandmaster: Koin sagt, es werde diese Division bald öffnen, und im AMA vom 2. Oktober hatte das Team den 27. Oktober mit Bleistift notiert.",
      },
      {
        q: "Ändert die Demo 0.7.1 die Werte der Karten?",
        a: "Nein. Sie hat keine Balance-Änderungen: Die Werte der Karten bleiben die von Patch 0.7 vom 29. September 2026, dem letzten Balance-Patch vor der Crimson Cup, und die Kartenseiten auf OriginsMeta ändern sich nicht.",
      },
      {
        q: "Zählen Ranked-Partien in der Demo von Origins TCG für die Missionen?",
        a: "Ja. Seit der Demo 0.7.1 kannst du Missionen als PvP in Ranked oder als PvE im Bereich Missionen erledigen.",
      },
    ],
  },
  "originsmeta-one-month": {
    title: "Vor einem Monat, um ein Uhr nachts: OriginsMeta wird dreißig Tage alt",
    metaTitle: "Origins TCG: OriginsMeta wird einen Monat alt, danke",
    description:
      "OriginsMeta, die Fanseite zu Origins TCG, wird einen Monat alt: 6.800 Besucher, 1.900 kopierte Deckcodes, vier Sprachen und was als Nächstes kommt. Danke.",
    summary:
      "Am 15. September, um ein Uhr nachts, haben wir OriginsMeta online gestellt. Wir dachten, wir hätten eine Kartendatenbank mit einem Deckbuilder gebaut. Einen Monat später haben wir Tausende Menschen, die vorbeigeschaut haben, vier Sprachen, eine App, die Matches aufzeichnet, und eine Crimson Cup vor der Tür. Das ist unser Dankeschön, mit ein paar Zahlen und ein paar Versprechen.",
    highlights: [
      { label: "Eine Nacht im September", text: "eine Idee am 14. September, die Website um ein Uhr nachts online, am Nachmittag das erste Community-Deck", anchor: "anfang" },
      { label: "Eure Zahlen", text: "über 6.800 Menschen, 47.000 Seiten, 1.900 kopierte Deckcodes, 850 aufgezeichnete Matches", anchor: "zahlen" },
      { label: "Was wir gebaut haben", text: "die Hälfte davon entstand aus einer Discord-Nachricht oder einem Feedback", anchor: "werkzeuge" },
      { label: "Wie es weitergeht", text: "Steam Next Fest, die Crimson Cup, die erste Tier-List von OriginsMeta, die Kickstarter-Kampagne und eine Twitch-Erweiterung", anchor: "wie-es-weitergeht" },
      { label: "Danke", anchor: "danke" },
    ],
    body: `## Eine Nacht im September {#anfang}

OriginsMeta ist aus einer Notiz auf einem Handy entstanden, am Abend des 14. September: „Idee für eine Website“. Die Domain haben wir noch in derselben Nacht gekauft. Um ein Uhr nachts war die erste Version online, um halb neun gab es den Deckbuilder, und am Nachmittag war die Kartendatenbank vollständig.

Um 17:30 Uhr ist etwas passiert, das uns denken ließ, dass wir vielleicht das Richtige getan hatten: Luigi „[Davdas](/de/authors/davdas)“ Ragoni hat das erste Community-Deck veröffentlicht, Healing Healsing. Eine Deck-Website ohne Decks ist ein leeres Schaufenster, aber von diesem Moment an hat unsere Website funktioniert: Das Schaufenster sollte nie wieder leer sein.

## Was ihr uns in dreißig Tagen gegeben habt {#zahlen}

Mit diesen Zahlen haben wir nicht gerechnet. Wir wollen euch nicht sagen, ob sie viel oder wenig sind: Wir wollen euch sagen, dass es „unsere“ Zahlen sind, die der ganzen Community.

- Mehr als 6.800 Menschen haben vorbeigeschaut, und bisher wurden mehr als 47.000 Seiten geöffnet. An den besten Tagen haben mehr als 350 einzelne Nutzer die Website besucht.
- 1.900-mal habt ihr einen Deckcode kopiert, um ihn ins Spiel mitzunehmen. Das ist die Zahl, die uns am meisten bedeutet: Sie heißt, dass die Website den Spielern beim Spielen hilft.
- Ihr lest uns vor allem aus Italien (45 %), aber auch aus den Vereinigten Staaten (14 %), Spanien (6 %), Frankreich (5 %), Deutschland (4 %), Singapur (4 %) und Brasilien (2 %), und jeden Tag kommen Menschen aus anderen Ländern dazu.

Deshalb kam Ende September Spanisch und am 8. Oktober Französisch.

In der Datenbank stehen mehr als 60 [Decks](/de/decks), und mit [OriginsMeta Tracker](/de/tracker) habt ihr mehr als 850 Matches aufgezeichnet, die heute alle Daten in unserem [Analytics](/de/analytics) prägen.

Hinter allem stecken außerdem mehr als 400 Updates der Website, 122 Karten, die wir eine nach der anderen im Spiel geprüft haben, und so manche schlaflose Nacht.

## Was wir gebaut haben {#werkzeuge}

Wenn wir die Notizen dieses Monats noch einmal lesen, fällt auf, dass die Hälfte der Funktionen der Website, der Tracker, Analytics und viele andere Ideen, aus einer Nachricht auf Discord oder einem Feedback entstanden sind. Dafür können wir euch nie genug danken! Macht weiter so!

## Wie geht es weiter? {#wie-es-weitergeht}

Die nächsten zwei Wochen sind die wichtigsten, seit es Origins gibt, und wir wollen dabei sein.

- Ab dem 19. Oktober läuft das Steam Next Fest, mit Ranked und der Crimson Cup. Wir begleiten das Turnier Tag für Tag: Den Kalender findest du in unserem [Guide zum Next Fest](/de/guides/steam-next-fest-2026).
- Nach der Crimson Cup erscheint die erste [Tier-List](/de/tier-list) von OriginsMeta, gebaut auf den Ergebnissen des Turniers und nicht auf unseren Meinungen.
- Am 27. Oktober startet die [Kickstarter-Kampagne der Alpha Edition](/de/guides/origins-tcg-kickstarter), und wir erzählen euch hier davon.
- Ein kleiner Spoiler: Wir arbeiten Tag und Nacht an unserem ersten Overlay für Twitch, einer Erweiterung, mit der ihr Deck und Karten eures Lieblingsstreamers sehen könnt, wann immer ihr wollt, live während seiner Matches.
- Weiter in der Zukunft, ohne Termine, weil wir nichts versprechen wollen, von dem wir noch nicht wissen, ob wir es liefern können: eine Website, die sich auf Handy und Tablet leichter bedienen lässt, vielleicht eine eigene App? Lasst uns kochen!

## Danke, wirklich {#danke}

An alle, die ein Deck veröffentlicht haben, an alle, die abgestimmt haben, an alle, die uns zu jeder Tages- und Nachtzeit „das hier funktioniert nicht“ geschrieben haben, an alle, die eine App von ein paar Unbekannten installiert haben, um uns beim Zählen der Matches zu helfen: OriginsMeta gehört auch, und vor allem, euch. Sagt uns weiter auf [unserem Discord](https://discord.gg/RAG7nnrNGP), was fehlt. Die To-do-Liste für den zweiten Monat ist schon lang… und so gefällt es uns!

*Luigi, Pierluigi und das ganze Team von OriginsMeta*`,
  },
  "playtest-closing-crimson-cup-twitch": {
    title: "Der Playtest von Origins TCG endet am 15. Oktober: Crimson Cup auf Twitch, Co-Streaming und Regelwerk-Update",
    metaTitle: "Origins TCG: Playtest endet, Crimson Cup auf Twitch",
    description:
      "Der Playtest von Origins TCG schließt am 15. Oktober nach über 100.000 Matches. Koin eröffnet einen Twitch-Kanal für die Crimson Cup, Co-Streaming für alle.",
    summary:
      "Am 14. Oktober hat Koin Games auf dem offiziellen Discord angekündigt, dass der Playtest von Origins TCG am nächsten Tag schließt, nach mehr als 100.000 Matches, und dass ein Update für die Hauptdemo unterwegs ist. Alle Events der Crimson Cup werden auf einem neuen offiziellen Twitch-Kanal übertragen, alle dürfen sie co-streamen, und Seite 8 des Regelwerks erklärt jetzt, wie man mit technischen Problemen und dem Deck-Tracking umgeht.",
    highlights: [
      { label: "Der Playtest schließt am 15. Oktober", text: "über 100.000 gespielte Matches, und ein Update für die Hauptdemo kommt", anchor: "playtest" },
      { label: "Ein Twitch-Kanal für die Crimson Cup", text: "jedes Event wird übertragen, dazu eine Vorschauseite des Kickstarters zum Folgen", anchor: "twitch" },
      { label: "Co-Streaming ist für alle offen", text: "die offizielle Übertragung weiterstreamen oder anderen Streamern zuschauen, und Koin über sein Formular Bescheid geben", anchor: "co-streaming" },
      { label: "Regelwerk, Seite 8", text: "neue Hinweise zu technischen Problemen und zum Deck-Tracking", anchor: "regelwerk" },
    ],
    body: `## Der Playtest schließt am 15. Oktober {#playtest}

Am 14. Oktober hat das Team von Koin Games seine Ankündigung auf dem [offiziellen Discord](https://discord.gg/originstcg) mit einer traurigen Nachricht eröffnet: Der Playtest „verlässt uns morgen“, die Playtest-Build schließt also am 15. Oktober. In seinen Worten haben die Spieler darauf „über 100k Matches gespielt“ und „uns sehr geholfen“. Das [Update 0.7.1 vom 8. Oktober](/de/news/playtest-patch-notes-0-7-1) waren seine letzten Patchnotes.

Mit dem Ende des Playtests kommt ein Update für die Hauptdemo, die kostenlose auf Steam, um die es in unserem [Guide zur Demo](/de/guides/play-the-demo) geht. Koin sagt, es „sollte die meisten von euch sehr glücklich machen“, verrät aber nicht, was drin ist, also raten wir nicht: Wir berichten, sobald die Patchnotes da sind.

Koin hat außerdem angekündigt, dass „das GROSSE WOCHEN für Origins sind“, mit weiteren Ankündigungen. Den Kalender findest du in unserem [Guide zum Steam Next Fest](/de/guides/steam-next-fest-2026): Ranked und die Crimson Cup starten mit dem Festival am 19. Oktober, und die [Kickstarter-Kampagne der Alpha Edition](/de/guides/origins-tcg-kickstarter) ist für den 27. Oktober angesetzt.

## Ein Twitch-Kanal für die Crimson Cup und die Kickstarter-Seite {#twitch}

Koin hat einen neuen offiziellen Twitch-Kanal eröffnet, auf dem es „ALLE Events der Crimson Cup übertragen wird“, und bittet die Spieler, der Vorschauseite des Kickstarters zu folgen, bevor die Kampagne startet. Beide Links stehen in der Ankündigung auf dem [offiziellen Discord](https://discord.gg/originstcg). Die Termine der Qualifikationen und das Preisgeld findest du in unserem [Artikel zur Crimson Cup](/de/news/crimson-cup-prizepool-qualifiers).

## Co-Streaming der Crimson Cup {#co-streaming}

Alle dürfen die Crimson Cup co-streamen oder ihre eigenen Matches streamen. Neben der offiziellen Übertragung jedes Events gibt es zwei Wege, selbst zu kommentieren:

- die offizielle Übertragung von Koin weiterstreamen;
- anderen Streamern direkt zuschauen.

Koin möchte mit einigen Twitch-Streamern zusammenarbeiten, um mehr Menschen zu erreichen, und bittet alle, die ein Event der Crimson Cup streamen wollen, Bescheid zu geben, über das in der Ankündigung verlinkte Formular, damit es sich abstimmen kann.

Wenn du mit einem Turnierdeck streamst, hat OriginsMeta kostenlose Werkzeuge dafür: einen Kurzlink, den du im Stream nennen kannst, den Chatbefehl !deck und ein OBS-Overlay mit deinen drei Decks, alles erklärt in unserem [Guide für Streamer](/de/guides/streaming-tools).

## Das Update des Regelwerks: technische Probleme und Deck-Tracking {#regelwerk}

Koin hat dem Regelwerk der Crimson Cup auf Seite 8 einen kurzen Abschnitt hinzugefügt, mit klareren Hinweisen dazu, wie man mit technischen Problemen und dem Deck-Tracking umgeht. Die Ankündigung fasst ihn nicht zusammen: Wenn du eine Qualifikation spielst, lies diese Seite vor deinen Matches. Das Format mit drei Decks und Conquest steht in unserem Artikel zu [den Regeln der Crimson Cup](/de/news/crimson-cup-format-check-in).

## Was wir noch nicht wissen {#was-wir-noch-nicht-wissen}

- Was das Update der Hauptdemo enthält und wann es kommt.
- Den genauen Wortlaut des neuen Abschnitts im Regelwerk.
- Mit welchen Streamern Koin bei den Übertragungen zusammenarbeiten wird.

## Woher das kommt {#quellen}

- Die Ankündigung des Teams von Koin Games auf dem [offiziellen Discord von Origins TCG](https://discord.gg/originstcg) vom 14. Oktober 2026, mit den Links zum Twitch-Kanal, zur Vorschauseite des Kickstarters, zum Formular für das Co-Streaming und zum Regelwerk.`,
    faq: [
      {
        q: "Wann schließt der Playtest von Origins TCG?",
        a: "Am 15. Oktober 2026. Koin Games hat es am Tag davor auf dem offiziellen Discord angekündigt, nach mehr als 100.000 auf der Playtest-Build gespielten Matches, und gesagt, dass ein Update für die Hauptdemo kommt.",
      },
      {
        q: "Wo kann ich die Crimson Cup sehen?",
        a: "Auf dem neuen offiziellen Twitch-Kanal von Koin Games, der jedes Event der Crimson Cup überträgt. Der Link steht in der Ankündigung vom 14. Oktober 2026 auf dem offiziellen Discord von Origins TCG.",
      },
      {
        q: "Darf ich die Crimson Cup streamen oder co-streamen?",
        a: "Ja. Alle dürfen die Crimson Cup co-streamen oder ihre eigenen Matches streamen, indem sie die offizielle Übertragung weiterstreamen oder anderen Streamern zuschauen. Koin bittet die Streamer, über das Formular in seiner Ankündigung Bescheid zu geben, damit es sich abstimmen kann.",
      },
    ],
  },
  "building-origins-ama-design-balance": {
    title: "AMA Building Origins: Ranked bis 4. Dezember, 22 neue Karten im November und warum Bagheera mehr kostet",
    metaTitle: "Origins TCG AMA: Ranked-Termine, neue Karten, Balance",
    description:
      "Origins TCG im AMA Building Origins: Ranked vom 19. Oktober bis 4. Dezember, 22 neue Karten im November, Collector Pass für rund 20 $, höhere Kosten in 0.7.",
    summary:
      "Im AMA Building Origins, live übertragen am 2. Oktober und am 5. Oktober auf YouTube veröffentlicht, hat Koin Games Termine genannt, die es „mit Bleistift geschrieben“ nannte: Ranked vom 19. Oktober bis zum 4. Dezember, die Grandmaster-Rangliste ab dem 27. Oktober und mindestens 22 neue Karten im November. Das Designteam hat außerdem erklärt, warum Bagheera, Mind Palace und Spellbook seit Patch 0.7 mehr kosten, warum Christopher Robin auf 5/4 zurückgekehrt ist und wie es das Spiel ausbalanciert.",
    highlights: [
      { label: "Ranked vom 19. Oktober bis 4. Dezember", text: "die Grandmaster-Rangliste öffnet am 27. Oktober, für alle gleichzeitig", anchor: "ranked" },
      { label: "November", text: "ein Playtest der Monetarisierung, mindestens 22 neue Karten, alle zwei Wochen neue Karten und Orte", anchor: "november" },
      { label: "Kommende Karten", text: "20 Legendäre, über 90 entworfene Orte und eine Mechanik mit Essen", anchor: "erstes-set" },
      { label: "Collector Pass, Kapseln und Commanders", text: "ein einmaliger Kauf für rund 20 $, handelbare Commanders", anchor: "sammelobjekte" },
      { label: "Zuschauen, Replays und Spielfelder", text: "Zuschauermodus bei der Crimson Cup nur für freigegebene Accounts", anchor: "funktionen" },
      { label: "Warum drei Karten mehr kosten", text: "Bagheera, Mind Palace und Spellbook; keine Änderungen für Ellen Trechend", anchor: "patch-0-7" },
      { label: "Christopher Robin und Axe Throw", text: "die Gründe für das Hin und Her zwischen 5/4, 4/5 und 5/4", anchor: "christopher-robin" },
      { label: "Wie Koin designt", text: "Leistungsbänder, Daten plus Stimmung der Spieler, „net positive joy“", anchor: "design" },
    ],
    body: `## Ranked: 19. Oktober bis 4. Dezember, Grandmaster ab dem 27. {#ranked}

Das Team hat die Termine mit einer Warnung genannt: „they're written in pencil and I carry a lot of white out“, sie sind also mit Bleistift geschrieben, und Tipp-Ex ist reichlich da. Die Ranked-Saison beginnt am 19. Oktober, dem ersten Tag des Steam Next Fest, und läuft bis zum 4. Dezember. Die Grandmaster-Rangliste bleibt während des Festivals geschlossen und soll am Dienstag, 27. Oktober, öffnen, damit „alle gleichzeitig starten“.

Die besten Preise gehen an die Spitze dieser Rangliste, darunter „one of one or one of 25 exclusive rewards“, die Mike aus dem Team von Koin „wahrscheinlich die besten Preise im ganzen Spiel“ nannte. Diese Saison hat Ranked-Belohnungen, bevor die vollständige Monetarisierung kommt, „vielleicht das einzige Mal überhaupt“, und die Gegenstände, die du jetzt in der Demo verdienst, werden zum Launch nicht mehr erhältlich sein. Mehr in unserem [Ranked-Guide](/de/guides/origins-tcg-ranked).

## November: ein Playtest der Monetarisierung und alle zwei Wochen neue Karten {#november}

Die Builds im November sind Playtests der Monetarisierung. Wenn die Pläne halten, bringt der November außerdem „mindestens 22 neue Karten“, mit neuen Karten und Orten alle zwei Wochen während der Ladder-Saison. Weiter in der Zukunft sagte Mike, das Team sei „auf dem Weg, das Spiel nächstes Jahr zu veröffentlichen“, und die Oberfläche, die noch nach Mobile aussieht, werde bis Jahresende „viel mehr nach PC“ aussehen; Kevin sagte, Mobile komme „bald“, ohne Termin. Die bestätigten Termine stehen in unserer [Roadmap](/de/guides/roadmap-and-dates).

## Kommende Karten: 20 Legendäre, über 90 Orte und Essen {#erstes-set}

Die Demo enthält „die erste Hälfte“ des ersten Sets; die zweite Hälfte bringt Schlüsselwörter und neue Konzepte. Ben, der Lead Card Designer, sagte, dass 20 Legendäre geplant und „über 90“ Orte entworfen sind, gegenüber den rund 40, die die Spieler gesehen haben. Viele der aktuellen Orte begünstigen aggressive Decks wie Three Not So Little Pigs; das sollte sich ausgleichen, wenn mehr dazukommen.

Die neue Mechanik, auf die er sich „ziemlich freut“, ist **Essen**, verschoben, weil sie „ein bisschen fortgeschritten“ ist: ein Gegenstand auf dem Spielfeld, der kein Charakter ist. Ein Charakter, der darauf gespielt wird, bekommt einen Bonus, „im Moment ist es plus zwei plus zwei“, damit zählt die Positionierung mehr. Ein weiteres Unterthema kommt, „erschaffene Karten kosten weniger“. Eine neue Karte wurde nicht genannt.

Spätere Sets besuchen andere Mythologien: Ein Set zur griechischen Mythologie ist geplant, einige Karten sind schon entworfen. Koin hat außerdem Kooperationen versprochen und gesagt, dass Studios, die „in ihren jeweiligen Kategorien die Nummer eins der Welt“ sind, auf es zugekommen sind, ohne sie zu nennen.

## Collector Pass, Kapseln und Commanders {#sammelobjekte}

Origins bleibt free-to-compete: Alle Spieler bekommen alle spielbaren Karten, niemand soll sich „gezwungen fühlen, etwas auszugeben“, und das Geld fließt in limitierte Varianten, wie bei Counter-Strike. Die Bausteine:

- der **Collector Pass** (ein Arbeitstitel): ein einmaliger Kauf für „rund 20 Dollar“, kein monatlicher Battle Pass, der durch Spielen etwa zwei Sammelobjekte pro Woche gibt, nie von einer Art, die in Packs zu finden ist;
- **Shop-Guthaben**, durch Spielen verdient, für andere exklusive Sammelobjekte;
- **Kapseln**, eine zweite Art von Gegenstand: Packs enthalten nur Karten, Commanders kommen aus Kapseln;
- **Commanders**, handelbar und in begrenzter Menge; im Early Access bekommen alle vier nicht handelbare, mit Emotes und Avataren, als „Startausstattung“.

Koin prüft außerdem sammelbare, anpassbare Hüllen und Binder, um in den Sammlungen anderer Spieler zu blättern. Sets und Grading stehen in unserem [Artikel zu den Sets](/de/news/origins-sets-alpha-edition-grading) und im [Guide zur Sammlerökonomie](/de/guides/collector-economy); zum Kickstarter heißt es: „the pricing is going to be revealed soon“, die Preise werden bald bekannt gegeben.

## Zuschauen, Replays und Spielfelder {#funktionen}

- Der **Zuschauermodus** existiert, ist aber „nicht fertig“: Bei der [Crimson Cup](/de/news/crimson-cup-prizepool-qualifiers) nutzen ihn nur einige fürs Streaming freigegebene Accounts.
- **Replays** funktionieren intern, sind aber noch nicht bereit für die Spieler; ein **Verlauf Zug für Zug** ist geplant.
- Zu sehen, wie viele Karten dein Gegner beim Mulligan ausgetauscht hat, eine Idee der Community, war schon in der internen Build: Es kam mit dem [Playtest 0.7.1](/de/news/playtest-patch-notes-0-7-1#mulligan-des-gegners).
- Das aktuelle **Spielfeld ist ein Platzhalter**, „zu Sci-Fi und fade“: Spielfelder, die von den einzelnen Bossen inspiriert sind, sind in Arbeit, und kosmetische Spielfelder kommen.
- **Bots**: „at peak, we have about 200 concurrent players“, sagte Mike, zur Spitzenzeit sind also rund 200 Spieler gleichzeitig online, deshalb sind manche Ranked-Matches vorerst gegen Bots; Missionen sind ausdrücklich PvE.

## Warum Bagheera, Mind Palace und Spellbook mehr kosten {#patch-0-7}

[Patch 0.7](/de/news/patch-0-7#kosten) hat alle drei um 1 Mana verteuert. Ben sagte, das Team habe keine Änderungen geplant, dann hätten die Karten, die die Spieler immer wieder gemeldet hatten, „bessere Spielraten bekommen“, bis die Zahlen nicht mehr gesund waren. Win-Rates hat er nicht genannt, nur, dass sie „in gesunden Bereichen“ gelegen hatten.

- **Bagheera** ist eine Karte, die „für uns sehr wichtig ist, richtig hinzubekommen“: Sie gibt das Tempo zu Beginn vor und zeigt neuen Spielern, wo eine Bedrohung auftauchen wird, „an denselben drei Stellen“, den mittleren Feldern, auf denen ihre Beim Aufdecken-Fähigkeit sie wachsen lässt. Als 3/3 für 1 Mana steckte sie in zu vielen Decks, vor allem in Three Not So Little Pigs. Koin will, dass sie eine Karte für Mulan ist, die Beim Aufdecken-Fähigkeiten wiederholt, deshalb hat es den großen Bonus behalten und die Kosten erhöht. Ein stärkeres Mulan-Deck, merkte Ben an, könnte wiederum Ellen Trechend stärker machen.
- **Spellbook** wird sich am stärksten verändern, wenn sich der Kartenpool verdoppelt, weil ihre Zauber aus diesem Pool kommen. Kevin hat heute rund 22 Zauber gezählt, eine Legion of the Dead kommt also ungefähr „einmal von 22“, eine Quote, die „nicht sehr lange halten wird“.
- **Ellen Trechend**: „keine Maßnahme“, und „in nächster Zeit“ ist nichts zu erwarten.

Vor der Crimson Cup hat sich Koin „verpflichtet“, die Karten so zu lassen, wie sie sind; in einem „katastrophalen“ Fall „würden wir die Karte einfach bannen, statt sie zu ändern“.

## Christopher Robin und Axe Throw {#christopher-robin}

Christopher Robin ging von 5/4 auf 4/5, weil er in vielen Decks mit einer guten Win-Rate steckte und neue Spieler in den Einführungspartien immer wieder Golden Egg gegenüber trafen, ohne andere Möglichkeit als zu tauschen; als 4/5 veränderte ein danach gespielter Galahad die Kämpfe. Das Team hat ihn zurückgesetzt ([Demo-Patch vom 21. September](/de/news/demo-patch-notes-0921#christopher-robin)), weil es überlegte, Axe Throw „wieder auf fünf“ Schaden anzuheben, dazu noch nicht bereit war und wollte, dass Axe Throw, heute 4 Schaden, gegen die meistgespielten Karten gut bleibt. „It wasn't necessarily just purely a power level concern“, es ging also nicht nur um die Stärke, sagte Ben. Der [Rework von Twister Toss](/de/news/patch-0-7#twister-toss) beseitigt außerdem einen holprigen Moment: Die Bewegung scheitert nicht mehr, wenn zuerst eine andere Karte das Feld betritt.

## Wie Koin das Spiel designt {#design}

- **Bänder statt gleicher Stärke**: „we're not really focused on making sure every card is the equal power level“, sagte Ben, es geht nicht darum, dass jede Karte gleich stark ist; das Team greift ein, wenn eine Karte die gesunden Bänder verlässt.
- **Daten und Gefühle**: Zahlen plus Feedback, denn „the player sentiment is actually data too“ (Kevin), auch die Stimmung der Spieler ist ein Datum, und ein Ziel, das sie „net positive joy“ nennen: Wer eine Interaktion gewinnt, fühlt sich gut, ohne dass sich der Verlierer schrecklich fühlt.
- **Wenige, gewichtige Entscheidungen**: 12 Basiskarten plus eine Legendäre ergeben „13 Entscheidungen“, deshalb wiegt eine Änderung der Manakosten mehr als in größeren Decks.
- **Gleichzeitige Züge, drei Orte und eine Legendäre, die du „nicht ziehen musst“**, in einem Spiel, das „von Anfang an“ unterhaltsam zum Zuschauen sein sollte.
- **Absichtlich freundlichere Regeln**: Das Entfernen eines laufenden Buffs tötet nie einen Charakter, und Schild stoppt Überrennen vollständig.

## Was wir noch nicht wissen {#was-wir-noch-nicht-wissen}

- Jeder Termin ist „mit Bleistift geschrieben“ und kann sich verschieben.
- Was die Belohnungen der Ladder und die 1-von-1-Preise sind: Koin ist „noch in der Küche“.
- Wann Essen, die anderen Legendären und das griechische Set kommen, und mit welchen Karten.
- Die Preise des Kickstarters, und wie viele Commanders und Kapseln es geben wird.

## Woher das kommt {#quellen}

Die [Aufzeichnung des AMA Building Origins](https://www.youtube.com/watch?v=bEb5RuwY7tg) auf dem offiziellen YouTube-Kanal von Origins TCG, live am 2. Oktober 2026 und veröffentlicht am 5. Oktober (2 Stunden und 22 Minuten), mit Kevin Lambert, Chief Product Officer und Head of Design bei Koin Games, Ben „Benny Beatdowns“, Lead Card Designer und früher bei Wizards of the Coast an Magic, und weiteren Mitgliedern des Teams. Wir haben die automatischen englischen Untertitel von YouTube verwendet, die manche Namen verstümmeln (die Kartennamen haben wir mit unserer Datenbank abgeglichen): Die Zitate sind unsere eigene Transkription, ins Deutsche übertragen von uns.`,
    faq: [
      {
        q: "Wann beginnt und endet die Ranked-Saison von Origins TCG?",
        a: "Im AMA Building Origins hat Koin Games gesagt, dass die Ranked-Saison am 19. Oktober 2026 beginnt, dem ersten Tag des Steam Next Fest, und bis zum 4. Dezember läuft. Die Grandmaster-Rangliste soll am Dienstag, 27. Oktober, öffnen, für alle gleichzeitig. Das Team hat betont, dass diese Termine „mit Bleistift geschrieben“ sind.",
      },
      {
        q: "Warum kosten Bagheera, Mind Palace und Spellbook 1 Mana mehr?",
        a: "Ihre Spielraten sind weiter gestiegen, nachdem die Spieler sie gemeldet hatten, bis Koin die Zahlen für ungesund hielt und sie in Patch 0.7 um 1 Mana erhöhte. Bagheera steckte für 1 Mana in zu vielen Decks, vor allem in Three Not So Little Pigs, während Koin will, dass sie eine Karte für Mulan ist. Die Win-Rates wurden nicht genannt.",
      },
      {
        q: "Ändert Koin vor der Crimson Cup Karten?",
        a: "Nein, außer es passiert etwas Katastrophales: In diesem Fall, sagte Koin, würde es die Karte bannen, statt sie zu ändern. Ben sagte außerdem, dass in nächster Zeit keine Maßnahme bei Ellen Trechend geplant ist.",
      },
      {
        q: "Was ist die Mechanik mit Essen in Origins TCG?",
        a: "Eine Mechanik, die Lead Card Designer Ben unter den kommenden beschrieben hat: ein Gegenstand, der aufs Spielfeld kommt, ohne ein Charakter zu sein, und ein Charakter, der darauf gespielt wird, bekommt einen Bonus, vorerst +2/+2. Sie wurde verschoben, weil sie ein bisschen fortgeschritten ist, und einen Termin gibt es nicht.",
      },
    ],
  },
  "bot-deck-challenge-practice-tournaments": {
    title: "Koin will deine Decks für die Bots der Demo, dazu wöchentliche Trainingsturniere vor der Crimson Cup",
    metaTitle: "Origins TCG: deine Decks für die Bots der Demo",
    description:
      "Koin Games bittet die Spieler von Origins TCG um Decks für die Bots der Demo, mit einem geheimen Preis für die besten. Dazu Trainingsturniere und Demo-Zahlen.",
    summary:
      "Am 6. Oktober hat Koin Games auf dem offiziellen Discord eine Challenge gestartet: Decks bauen, über ein Formular einreichen, und die Bots der Demo fangen an, sie zu spielen, mit einem „super secret prize“ für die Decks, die am besten abschneiden. In denselben Tagen hat Koin die ersten beiden wöchentlichen Trainingsturniere vor der Crimson Cup ausgetragen, Fans eingeladen, eigene Turniere zu veranstalten, und neue Zahlen geteilt: über 20.000 Downloads der Demo und über 300.000 gespielte Matches.",
    highlights: [
      { label: "Die Bot-Deck-Challenge", text: "Decks über Koins Formular einreichen, die Bots der Demo spielen sie, ein geheimer Preis für die besten", anchor: "bot-challenge" },
      { label: "So machst du mit", text: "so viele Decks, wie du willst, keine angekündigten Regeln", anchor: "mitmachen" },
      { label: "Trainingsturniere", text: "die ersten beiden am 3. und 10. Oktober; die Community bevorzugt Abende unter der Woche, europäische Zeit", anchor: "trainingsturniere" },
      { label: "Veranstalte dein eigenes", text: "Koin bietet Fan-Turnieren Unterstützung an, und OriginsMeta hat einen kostenlosen Turnierorganisator", anchor: "eigenes-turnier" },
      { label: "Die Aufzeichnung des AMA", text: "Building Origins, 2 Stunden und 22 Minuten auf YouTube", anchor: "ama" },
      { label: "Die Demo in Zahlen", text: "über 20.000 Downloads und über 300.000 Matches", anchor: "zahlen" },
    ],
    body: `## Koin will bessere Decks für seine Bots {#bot-challenge}

Am 6. Oktober um 18:17 UTC hat das Team von Koin Games in #announcements auf dem [offiziellen Discord](https://discord.gg/originstcg) „a little challenge“ gepostet, eine kleine Challenge: „Wir wollen die Decks verbessern, die unsere Bots verwenden, also machen wir ein kleines Spiel daraus“. Sie funktioniert in vier Schritten:

1. Decks bauen;
2. sie über das [offizielle Formular](https://forms.gle/zY1WeRTPLQzKAEs26) einreichen;
3. die Bots fangen an, sie in Matches zu verwenden;
4. „die Decks, die am besten abschneiden, gewinnen einen super secret prize“.

Du kannst mehr als ein Deck schicken, und in den Worten des Teams „there aren't any rules“, es gibt keine Regeln: Das Ziel ist, „die bestmöglichen Decks zu bauen“.

Warum das wichtig ist: Im [Post zur Crimson Cup vom 5. Oktober](/de/news/crimson-cup-prizepool-qualifiers#training) hat Koin geschrieben, dass die meisten Matches in der Demo gegen Bots laufen. Die Listen, die aus dieser Challenge hervorgehen, sind die, auf die die Spieler in diesen Matches treffen werden, in den Wochen vor der [Crimson Cup](/de/guides/steam-next-fest-2026).

## So machst du mit {#mitmachen}

Die Ankündigung verlangt nichts außer dem Formular: keine Frist, kein Format, keine Begrenzung der Anzahl der Decks. Wenn du einen Ausgangspunkt willst:

- bau und prüf deine Liste in unserem [Deckbuilder](/de/deck-builder), der den Deckregeln der Demo folgt (eine Legendäre plus 12 Basiskarten je zweimal, 25 Karten) und dir den Spielcode zum Kopieren gibt;
- such Ideen unter den [auf OriginsMeta veröffentlichten Decks](/de/decks), jedes mit seinem Guide und den Bewertungen der Community;
- da du mehr als eine Liste schicken kannst, probier verschiedene Archetypen aus, statt alles auf ein einziges Deck zu setzen.

## Wöchentliche Trainingsturniere {#trainingsturniere}

Die am 5. Oktober angekündigten Trainingsturniere haben begonnen. Koin hatte vorher gefragt: In einer Umfrage am 30. September haben 265 von 293 Abstimmenden (90 %) Ja zu Trainingsturnieren ohne Preise gesagt.

- **Trainingsturnier #1**, Samstag, 3. Oktober, um 16:00 CEST, angekündigt am 2. Oktober, wurde mit den Regeln der Crimson Cup gespielt, die Decks mussten also vor dem Start eingereicht werden ([das Format](/de/news/crimson-cup-format-check-in#format) und unser [Conquest-Guide](/de/guides/origins-tcg-conquest)).
- **Trainingsturnier #2**, Samstag, 10. Oktober, um 16:00 CEST (14:00 UTC), angekündigt in #game-announcements am 6. Oktober, behielt das Format des ersten bei, fünf Schweizer Runden, Matches im Best-of-Three und kein Ausscheiden, aber ohne Conquest: keine Decks einzureichen und freie Wahl, was man spielt. Die Anmeldung lief in #tournaments-to-join.

Am 6. Oktober hat Koin außerdem gefragt, wann die Spieler lieber spielen würden. Die Gewinneroption mit 40 % der Stimmen war „Weekdays - evening EU time (7pm CEST, 1pm EST)“, also Abende unter der Woche, europäische Zeit. Tag und Uhrzeit des nächsten Trainingsturniers sind noch nicht angekündigt, und die Ergebnisse des zweiten wurden in den Ankündigungskanälen nicht veröffentlicht.

## Andere Turniere und dein eigenes veranstalten {#eigenes-turnier}

Am 8. Oktober hat Koin die Spieler auf ein Turnier zu Origins hingewiesen, das am selben Tag um 16:30 CEST vom Collector Club veranstaltet wurde, einer Website von Dritten, die wöchentliche Turniere auf ihrem eigenen Discord plant, mit Anmeldung in ihrem Ankündigungskanal.

In derselben Nachricht hat das Team eine offene Einladung hinzugefügt: „Wenn du ein Fan von Origins bist und deine eigenen Turniere veranstalten willst, würden wir dich gern unterstützen. Melde dich einfach, damit wir es möglich machen!“ Was diese Unterstützung umfasst, sagt die Nachricht nicht.

Wenn du gleich loslegen willst: Der [Turnierorganisator](/de/tournaments/new) von OriginsMeta ist für alle Angemeldeten kostenlos: Turnierbaum mit einfachem K.-o.-System, Conquest oder freie Deckwahl, Best-of-One, -Three oder -Five, Decks vor dem Start eingereicht, Check-in und verborgene Decklists, öffentlich oder privat auf Einladung, mit einem Kurzlink zum Teilen. Schweizer Runden kann er noch nicht.

## Das AMA Building Origins auf YouTube {#ama}

Die Aufzeichnung des ersten Events Building Origins, des AMA mit Kevin und Ben, die Koin als die Köpfe hinter Origins vorgestellt hat, ist auf dem offiziellen YouTube-Kanal von Origins TCG: [„Building Origins AMA“](https://www.youtube.com/watch?v=bEb5RuwY7tg), veröffentlicht am 5. Oktober 2026, 2 Stunden und 22 Minuten lang. Was gesagt wurde, von den Terminen der Ranked-Saison bis zu den Gründen für die Balance-Änderungen von 0.7, steht in [unserem Artikel zum AMA](/de/news/building-origins-ama-design-balance).

## Die Demo in Zahlen {#zahlen}

- **Über 20.000 Downloads.** Der offizielle X-Account schrieb am 7. Oktober, dass die Demo „schon über 20000-mal heruntergeladen wurde“; am 24. September waren es 15.000.
- **Über 300.000 Matches.** Am 29. September schrieb Tim Jooste, Gründer und CEO von Koin Games, dass in der Demo in 11 Wochen über 300.000 Matches gespielt wurden, mit fast 1.000 Spielern über 20 Stunden Spielzeit.
- **1.500 Anmeldungen zur Crimson Cup.** Am 1. Oktober fügte er hinzu, dass sich in drei Wochen 1.500 Spieler für die Crimson Cup angemeldet hatten.

Das sind die Zahlen von Koin: Wir haben keine Möglichkeit, sie zu überprüfen.

## Was wir noch nicht wissen {#was-wir-noch-nicht-wissen}

- Wie lange die Bot-Deck-Challenge läuft: Die Ankündigung nennt keine Frist.
- Was der „super secret prize“ ist und wie viele Decks ihn gewinnen.
- Wie „am besten abschneiden“ gemessen wird (Siege, Win-Rate, Anzahl der Matches) und ob die Ergebnisse veröffentlicht werden.
- Wann die eingereichten Decks in Matches auftauchen und in welchen Modi.
- Ob „there aren't any rules“ auch für den Deckbau gilt oder nur dafür, wie viele Decks du schicken kannst.
- Tag und Uhrzeit des nächsten Trainingsturniers, ob es auf den Abendtermin unter der Woche wechselt, den die Umfrage gewählt hat, und die Ergebnisse des zweiten.

## Woher das kommt {#quellen}

- Der [offizielle Discord von Origins TCG](https://discord.gg/originstcg): die Challenge in #announcements am 6. Oktober 2026; die Trainingsturniere in #announcements (2. Oktober) und #game-announcements (6. Oktober), mit den beiden Umfragen; das Turnier des Collector Club und die Einladung, Turniere zu veranstalten, in #game-announcements (8. Oktober); das erste Event Building Origins in #announcements.
- Die [Aufzeichnung des AMA](https://www.youtube.com/watch?v=bEb5RuwY7tg) auf dem offiziellen YouTube-Kanal.
- Die Posts auf X von [Origins TCG am 7. Oktober](https://x.com/origins_tcg/status/2107853622897705015) und [am 24. September](https://x.com/origins_tcg/status/2103203061707477242) sowie von Tim Jooste am [29. September](https://x.com/TimothyJooste/status/2104979201707192617) und [1. Oktober](https://x.com/TimothyJooste/status/2105506219679264901).`,
    faq: [
      {
        q: "Wie reiche ich ein Deck für die Bots der Demo von Origins TCG ein?",
        a: "Über das Formular, das in der Ankündigung von Koin Games vom 6. Oktober 2026 auf dem offiziellen Discord verlinkt ist (forms.gle/zY1WeRTPLQzKAEs26). Du kannst so viele Decks schicken, wie du willst: Die Bots fangen an, sie in Matches zu verwenden, und die Decks, die am besten abschneiden, gewinnen einen geheimen Preis.",
      },
      {
        q: "Gibt es eine Frist oder einen bekannten Preis für die Bot-Deck-Challenge?",
        a: "Noch nicht. Die Ankündigung nennt keine Frist, sagt nicht, was der „super secret prize“ ist, und erklärt nicht, wie die Decks ausgewählt werden, die am besten abschneiden.",
      },
      {
        q: "Wann finden die Trainingsturniere von Origins TCG statt?",
        a: "Sie sind wöchentlich und werden auf dem offiziellen Discord angekündigt. Das erste fand am 3. Oktober 2026 mit den Regeln der Crimson Cup statt, das zweite am 10. Oktober um 16:00 CEST ohne Conquest. In einer Umfrage am 6. Oktober hat die Community Abende unter der Woche gewählt, europäische Zeit (19:00 CEST).",
      },
      {
        q: "Kann ich mein eigenes Turnier zu Origins TCG veranstalten?",
        a: "Ja. Koin Games lädt Fans, die Turniere veranstalten wollen, ein, sich für Unterstützung zu melden, und auf OriginsMeta kann jeder Angemeldete mit dem Turnierorganisator eines erstellen, mit Conquest oder freien Decks und Matches im Best-of-One, -Three oder -Five.",
      },
    ],
  },
  "origins-sets-alpha-edition-grading": {
    title: "Sets von Origins TCG: Alpha Edition, alle 3 bis 4 Monate ein neues Set, Grading und kostenlose Spielkarten",
    metaTitle: "Origins TCG Sets: Alpha Edition, Grading, Auflage",
    description:
      "Sets von Origins TCG: Alpha Edition nur auf Kickstarter, ein Set alle 3–4 Monate, versiegelte Packs auf Steam, Grades von 1 bis 10, Spielkarten gratis.",
    summary:
      "In drei Posts auf X zwischen dem 29. September und dem 9. Oktober hat Koin Games erklärt, wie Sets und Sammeln in Origins TCG funktionieren werden. Das erste Set, Myths and Legends, hat 218 Charaktere; seine Alpha Edition wird nur über Kickstarter verkauft und nie nachgedruckt, und neue Sets sind alle 3 bis 4 Monate geplant, mit einem Verkaufsfenster von 3 Monaten, gegradeten Sammelkarten und Promos, die es nur bei Turnieren gibt. Die Spielkarten bleiben für alle kostenlos: Das Sammlersystem, das nach dem Steam Next Fest kommen soll, ist optional.",
    highlights: [
      { label: "Zwei Kartensysteme", text: "Spielkarten jede Saison für alle kostenlos und nicht handelbar; Sammelkarten sind eigene Steam-Gegenstände, die du handeln kannst", anchor: "zwei-systeme" },
      { label: "Alpha Edition", text: "die erste Edition von Myths and Legends (218 Charaktere): nur auf Kickstarter, mit einem Alpha-Tag, nie nachgedruckt", anchor: "alpha-edition" },
      { label: "Alle 3 bis 4 Monate ein Set", text: "ein Verkaufsfenster von 3 Monaten, danach nur die Exemplare, die Sammler schon besitzen", anchor: "set-zyklus" },
      { label: "Versiegelte Produkte auf Steam", text: "Packs, Booster-Displays und Cases als Inventargegenstände; Displays und Cases nur auf Vorbestellung", anchor: "versiegelt" },
      { label: "Seltenheit und Grading", text: "fünf Ebenen der Seltenheit, Fehlkarten, Grades von 1 bis 10 mit halben Stufen: Am 2. Oktober sagte Koin, es prüfe das System noch", anchor: "seltenheit-grading" },
      { label: "Turnierkarten", text: "nie in Packs: Der Gewinner der Crimson Cup bekommt einen Dracula 1/1", anchor: "turnierkarten" },
      { label: "Knappheit ist kein Wert", text: "Koin zitiert Erstausgaben von Pokémon und Magic und sagt dann, sie seien keine Formel", anchor: "knappheit" },
    ],
    body: `## Drei Posts, ein System {#drei-posts}

Zwischen dem 29. September und dem 9. Oktober 2026 hat der offizielle Account von Origins TCG auf X drei lange Posts dazu veröffentlicht, wie Sets und Sammeln funktionieren werden. Koin Games sagt, es übernehme sein Modell vor allem von physischen Kartenspielen: versiegelte Produkte, begrenzte Auflagen, festgelegte Erscheinungszeiträume und lokale Spieleläden.

Unser [Guide zur Sammlerökonomie](/de/guides/collector-economy) behandelt bereits die Formate der Alpha Edition und ihre sieben Seltenheitsstufen, von der offiziellen Vorregistrierungsseite. Was diese Posts hinzufügen: die Größe des ersten Sets, das Alpha-Tag, den Rhythmus der späteren Sets, versiegelte Produkte als Steam-Gegenstände, die Ebenen der Seltenheit, wie das Grading funktionieren soll und die Turnierkarten.

## Zwei Kartensysteme {#zwei-systeme}

Origins hat zwei Arten von Karten, die sich Charaktere und Designs teilen, aber nicht Zugang, Besitz oder Auflage:

- **Spielkarten.** Jede Basis-Spielkarte wird jede Saison für alle Spieler kostenlos sein. Sie lassen sich nicht handeln und sind zum Spielen da. In den Worten von Koin wird „ein Spieler nie ein Pack kaufen oder eine Sammelversion besitzen müssen, um ein kompetitives Deck zu bauen“: Das Studio nennt das free-to-compete.
- **Sammelkarten.** Eigene Gegenstände im Steam-Inventar, die dir gehören und die du handeln kannst. Selbst die Standard-Sammelversion sieht anders aus als die Spielkarte, mit einem anderen Rahmen und einer Kartenansicht, die die Illustration in den Vordergrund stellt.

Die Knappheit, die Koin beschreibt, gilt nur für die Sammelseite: Editionen, Art-Behandlungen, Grades, versiegelte Produkte und Turnierherkunft. Sie „wird nie den Zugang zum kompetitiven Kartenpool einschränken“, und wenn eine Edition schließt, verschwindet nie eine Karte aus dem Spiel. Was man mit Geld kaufen kann und was nicht, steht in [unserem Guide zu free-to-compete](/de/guides/is-origins-tcg-pay-to-win).

## Myths and Legends und die Alpha Edition {#alpha-edition}

Das erste Set ist **Myths and Legends**, mit **218 Charakteren**. Seine erste Sammelveröffentlichung ist die **Alpha Edition**, die es nur über Kickstarter geben wird, laut dem CEO am 27. Oktober (die Details stehen in unserem [Guide zum Kickstarter](/de/guides/origins-tcg-kickstarter)). Jede Alpha-Karte trägt ein **Alpha-Tag** auf der Vorderseite, damit die Edition erkennbar bleibt. Ein Charakter kann in einem späteren Set zurückkehren, aber nicht in seiner Alpha-Version: Sobald das Fenster schließt, will Koin keine Alpha-Karten, Packs, Booster-Displays oder Cases mehr herausgeben.

Das Sammlersystem soll **nach dem Steam Next Fest** (19.–26. Oktober) starten, und der Post vom 9. Oktober sagt, dass alles davon ab „day 1“ über Steam handelbar sein wird.

## Alle 3 bis 4 Monate ein neues Set {#set-zyklus}

Koin plant alle 3 bis 4 Monate ein neues Set. Jedes Standardset hat ein **Verkaufsfenster von 3 Monaten**, in dem Sammelkarten und versiegelte Produkte über Origins, teilnehmende lokale Spieleläden (das am 6. Oktober vorgestellte [Digital LGS Program](/de/news/digital-lgs-program)) und zugelassene Online-Partner verkauft werden. Danach bleiben nur die Exemplare, die Sammler schon besitzen, handelbar auf dem Steam-Community-Markt.

## Versiegelte Produkte bleiben versiegelt {#versiegelt}

Packs, Booster-Displays und Cases werden einzelne Gegenstände im Steam-Inventar sein: Du kannst sie öffnen, handeln oder versiegelt behalten. Booster-Displays und Cases gibt es **nur auf Vorbestellung**, nach dem Ende dieses Fensters kommen also keine neuen versiegelten Einheiten hinzu. In den Worten von Koin bleibt ein versiegeltes Produkt Teil der Sammlung, „statt zu einem vorübergehenden Kaufbildschirm zu werden, der nach dem Öffnen verschwindet“.

## Seltenheit, Behandlungen und Grading {#seltenheit-grading}

Eine Sammelkarte kann sich auf fünf Ebenen unterscheiden: Edition, Seltenheit, Grade, digitaler Zustand und Promo-Status. Keine davon ändert, was die Karte im Match tut. Sammlerpacks können Standard-Sammelkarten, Varianten mit **Alternate Art**, animierte **Storybook**-Karten und digitale **Fehlkarten** enthalten.

Beim Grading klingen die beiden Posts nicht gleich. Am 29. September beschreibt Koin es als beschlossen: Der Inhalt eines Packs steht fest, bevor es geöffnet wird, und wenn eine Sammelkarte aufgedeckt wird, „würfelt das System ihren Grade“. Das Grading ist „automatisch, sofort und kostenlos“, nach Zentrierung, Ecken, Kanten und Oberfläche, mit sichtbaren digitalen Mängeln, die das Ergebnis erklären. Am 2. Oktober ist der Ton vorsichtiger: „Wir prüfen ein digitales Grading-System“, in dem mehrere Parameter den Grade ergeben und die Mängel von Karte zu Karte verschieden sind. Beide Posts nennen dieselbe Skala, **von 1 bis 10 mit halben Stufen**; der Rest kann sich noch ändern, und im Playtest-Update vom 1. Oktober hat das Team die Spieler gebeten, den Bildschirm [„How Grading Works“ vorerst zu ignorieren](/de/news/playtest-patch-notes-1001#grading). Der Grade ist von Seltenheit und Art getrennt, und laut Koin können auch niedrige Grades sammelwürdig sein, weil sie ein Exemplar einzigartiger machen.

## Turnierkarten: der Dracula 1/1 {#turnierkarten}

Manche Sammelkarten wird es nie in Packs oder Läden geben: ultraseltene Turnier-Promos, die man nur durch Wettkampf bekommt. Das erste Beispiel ist die Crimson Cup, deren Gewinner eine **Promo-Karte Dracula 1/1** bekommt und, in den Worten von Koin, für immer die einzige Person sein wird, die sie besitzt. Die anderen Preise stehen in unserer [Preistabelle der Crimson Cup](/de/news/crimson-cup-prizepool-qualifiers#preise).

## Erstausgaben und Knappheit, laut Koin {#knappheit}

Der Post vom 9. Oktober argumentiert, dass bei physischen Kartenspielen die erste Auflage knapp wird, weil sie geöffnet und gespielt wird, bevor das Publikum kommt. Als Beispiele nennt er ein Booster-Display von Pokémon Base Set 1st Edition aus dem Jahr 1999, das im Handel rund 100 bis 120 Dollar kostete und dessen versiegelte Exemplare Berichten zufolge für rund 10.000 bis über 250.000 Dollar verkauft wurden, und ein Booster-Display von Magic Alpha aus dem Jahr 1993, im Handel rund 88 Dollar, dessen versiegelte Packs Berichten zufolge für 8.000 bis 12.000 Dollar gehandelt werden. Das sind die Zahlen von Koin, nicht unsere.

Koin selbst fügt hinzu, dass diese Entwicklungen Jahrzehnte gedauert haben, davon abhingen, dass beide Spiele riesig wurden, und „keine Formel sind“, und der Post vom 29. September stellt fest, dass eine begrenzte Auflage „weder Nachfrage noch Marktwert noch Wertsteigerung garantiert“. Wir geben wieder, was das Studio sagt: Nichts hier ist ein Grund zu kaufen. Sammeln ist optional, und du kannst Origins kompetitiv spielen, ohne etwas auszugeben.

## Was wir noch nicht wissen {#was-wir-noch-nicht-wissen}

- Preise und Auflagen der Alpha Edition und der späteren Sets.
- Ob das Grading genau so funktionieren wird wie am 29. September beschrieben, und wie sich der „digitale Zustand“ vom Grade unterscheidet.
- Welcher Tag „day 1“ des Handels auf Steam ist und wie die heutigen Sammelobjekte der Demo in das neue System passen.
- Name und Termin des zweiten Sets und die Wahrscheinlichkeiten für Alternate Arts, animierte Storybooks und Fehlkarten.
- Wie das Fenster von 3 Monaten zwischen Origins, Läden und Online-Partnern funktioniert.

## Woher das kommt {#quellen}

Drei Posts des offiziellen Accounts von Origins TCG auf X: [29. September](https://x.com/origins_tcg/status/2105048221139747258) (Sets, Alpha Edition, Grading), [2. Oktober](https://x.com/origins_tcg/status/2106087343895486639) (die beiden Kartensysteme und das Sammlersystem) und [9. Oktober 2026](https://x.com/origins_tcg/status/2108619922586898629) (Erstausgaben und Auflage). Stand 11. Oktober gibt es zu diesen Themen keinen Post auf Steam.`,
    faq: [
      {
        q: "Muss ich Packs kaufen, um in Origins TCG kompetitiv zu spielen?",
        a: "Nein. Laut Koin Games wird jede Basis-Spielkarte jede Saison für alle Spieler kostenlos sein, und ein Spieler wird nie ein Pack kaufen oder eine Sammelversion besitzen müssen, um ein kompetitives Deck zu bauen. Sammelkarten sind eigene, handelbare Steam-Gegenstände, und Packs sind optional.",
      },
      {
        q: "Was ist die Alpha Edition von Origins TCG?",
        a: "Die erste Sammelveröffentlichung von Myths and Legends, dem ersten Set von Origins, mit 218 Charakteren. Es wird sie nur über Kickstarter geben, jede Alpha-Karte trägt ein Alpha-Tag auf der Vorderseite, und sobald das Fenster schließt, will Koin keine Alpha-Karten, Packs, Booster-Displays oder Cases mehr herausgeben.",
      },
      {
        q: "Wie wird das Grading der Karten in Origins TCG funktionieren?",
        a: "Jede Sammelkarte wird beim Öffnen automatisch gegradet, auf einer Skala von 1 bis 10 mit halben Stufen. Am 29. September beschrieb Koin das Grading als automatisch, sofort und kostenlos, nach Zentrierung, Ecken, Kanten und Oberfläche; am 2. Oktober sagte es, es prüfe das System noch, die Details können sich also ändern.",
      },
      {
        q: "Wie oft wird Origins TCG neue Sets veröffentlichen?",
        a: "Koin Games plant alle 3 bis 4 Monate ein neues Set. Standardsets haben ein Verkaufsfenster von 3 Monaten über Origins, teilnehmende Spieleläden und zugelassene Online-Partner; danach kommen Exemplare nur noch von Sammlern über den Steam-Community-Markt.",
      },
    ],
  },
  "playtest-patch-notes-0-7-1": {
    title: "Playtest 0.7.1 von Origins TCG: Ranked zählt wieder für Missionen, Mulligan des Gegners sichtbar",
    metaTitle: "Origins TCG Playtest 0.7.1: die Patchnotes",
    description:
      "Playtest 0.7.1 von Origins TCG vom 8. Oktober: Ranked-Partien zählen wieder für die Missionen, der Mulligan des Gegners wird angezeigt, rund 20 Bugs behoben.",
    summary:
      "Am 8. Oktober hat Koin Games den Playtest von Origins TCG auf Version 0.7.1 aktualisiert, ein kleines Update aus Fehlerbehebungen und Komfortverbesserungen. Ranked-Partien zählen wieder für den Fortschritt der Missionen, du siehst, wie viele Karten dein Gegner beim Mulligan ausgetauscht hat, und die Suche in der Sammlung, die Emote-Auswahl und drei Charakterstimmen werden besser. Balance-Änderungen gibt es keine: Die Werte der Karten bleiben die von Patch 0.7.",
    highlights: [
      { label: "Ranked zählt wieder für Missionen", text: "und du kannst die Missionen weiterhin als PvE spielen", anchor: "missionen-ranked" },
      { label: "Der Mulligan des Gegners", text: "du siehst, wie viele Karten er ausgetauscht hat", anchor: "mulligan-des-gegners" },
      { label: "Eine schlauere Suche in der Sammlung", text: "Ausdrücke aus mehreren Wörtern, und eine beschworene Karte findet die Karte, die sie beschwört", anchor: "sammlungssuche" },
      { label: "Emotes und Stimmen", text: "Emote-Plätze, die sich leeren lassen, neue Stimmen für Hansel and Gretel, Huck Finn und Christopher Robin", anchor: "emotes-stimmen" },
      { label: "Missionen, Startbildschirm, Spielfeld", text: "Komfortverbesserungen und ein paar Platzhalter", anchor: "neuerungen" },
      { label: "Keine Balance-Änderungen", text: "die Werte der Karten auf OriginsMeta ändern sich nicht", anchor: "was-sich-nicht-aendert" },
    ],
    body: `## Ein kleines Update für den Playtest {#update}

Am 8. Oktober hat Koin Games den Playtest, die separate Build der Demo 2.0, in die du über den offiziellen Discord kommst, auf Version 0.7.1 aktualisiert. Das Team hat die Notes um 16:54 UTC im Kanal game-announcements des [offiziellen Discord](https://discord.gg/originstcg) gepostet und die Build für ein paar Stunden offline genommen, um das Update aufzuspielen. „Nichts Großes, nur ein paar Fixes und QOL-Verbesserungen“, schreibt das Team: Balance-Änderungen gibt es keine, aber mehrere der Änderungen sind Dinge, die sich die Spieler gewünscht hatten. Es kommt eine Woche nach dem [Playtest-Update vom 1. Oktober](/de/news/playtest-patch-notes-1001), dessen Ankündigung keine Versionsnummer hatte.

## Die Neuerungen {#neuerungen}

### Der Mulligan des Gegners {#mulligan-des-gegners}

In der Mulligan-Phase siehst du jetzt, wie viele Karten dein Gegner ausgetauscht hat. Die Spieler haben sich das auf Discord gewünscht, und das Team sagt, die Idee sei so gut gewesen, dass es sie gleich am nächsten Tag umgesetzt hat. [Patch 0.6.1](/de/news/patch-0-6-1-ranked) hatte bereits eine Vorschau auf die Legendäre des Gegners während des Mulligans eingeführt.

### Missionen, Startbildschirm und der Rest {#missionen-startbildschirm}

- **Missionen, Bosse und Belohnungen** bekommen ein paar Komfortverbesserungen, ebenso der **Startbildschirm**. Welche, sagen die Notes nicht.
- Die **Commanders**, wie die Notes sie nennen, sagen jetzt einen Sprachsatz und zeigen ihr Namensschild, wenn du sie dir genauer ansiehst.
- **Effekte auf dem Spielfeld:** Klicks auf dem Spielfeld lösen jetzt visuelle Effekte und Soundeffekte aus. Das Team sagt, beides seien Platzhalter, und bittet die Spieler, sie nicht zu streng zu beurteilen.
- **Intro-Film:** Ein vorläufiges Intro läuft ab, und das Team weiß, dass es noch sehr in Arbeit ist.

## Die Verbesserungen {#verbesserungen}

### Ranked zählt wieder für die Missionen {#missionen-ranked}

Mit dem Update vom 1. Oktober wurden die Missionen reines PvE, und in dieser Build ließen sich Deck-Missionen nicht über Ranked erledigen: Das Team hatte versprochen, das in einer künftigen Build wieder einzuschalten ([unser Artikel](/de/news/playtest-patch-notes-1001#missionen-ranked)). Mit 0.7.1 zählen Ranked-Partien im PvP wieder für den Fortschritt der Missionen. Wenn du lieber willst, kannst du die Missionen weiterhin als PvE im Bereich Missionen spielen: Die Wahl liegt bei dir. Wie Ranked in der Demo funktioniert, steht in [unserem Ranked-Guide](/de/guides/origins-tcg-ranked).

### Die Suche in der Sammlung {#sammlungssuche}

Die Suche in der Sammlung akzeptiert jetzt Ausdrücke aus mehreren Wörtern, und wer nach etwas sucht, das eine Karte beschwört, findet auch die Karte, die es beschwört. Auf OriginsMeta durchsucht die Suche in [Karten](/de/cards) und im [Deckbuilder](/de/deck-builder) schon Kartennamen und Kartentext.

### Emotes und Stimmen {#emotes-stimmen}

- In der Emote-Auswahl kannst du jetzt einen Platz leeren, so wird das Einrichten deiner Emotes etwas einfacher.
- Hansel and Gretel, Huck Finn und Christopher Robin haben neue Stimmen. Die Spieler hatten gesagt, sie klängen viel zu alt für die Charaktere, und das Team schreibt, dass intern alle dasselbe sagten.

### Rund 20 Bugs behoben {#behobene-bugs}

Nach der Zählung des Teams sind rund 20 Bugs behoben. Die Notes listen sie nicht auf, und das Team bittet auf Discord um Feedback und um alles, was ihm entgangen ist.

## Was sich nicht ändert {#was-sich-nicht-aendert}

- **Keine Balance-Änderungen.** Die Werte der Karten bleiben die von [Patch 0.7](/de/news/patch-0-7) vom 29. September, dem letzten Balance-Patch vor der Crimson Cup: Kartenseiten, der [Deckbuilder](/de/deck-builder) und [MetaShifting](/de/metashifting) ändern sich nicht.
- **Der Playtest ist nicht die Hauptdemo.** Diese Änderungen stecken in der Playtest-Build; die Demo auf Steam, die wir in [unserem Guide zum Spielen der Demo](/de/guides/play-the-demo) erklären, behält ihre eigene Version, bis Koin sie aktualisiert.

## Was wir noch nicht wissen {#was-wir-noch-nicht-wissen}

- Wann die Änderungen von 0.7.1 die Hauptdemo auf Steam erreichen.
- Welche Bugs behoben wurden: Die Notes nennen nur die Anzahl, rund 20.
- Was sich bei Missionen, Bossen, Belohnungen und auf dem Startbildschirm genau ändert.
- Wann die Effekte auf dem Spielfeld und der Intro-Film, beides vorerst Platzhalter, endgültig werden.

## Außerdem in dieser Woche: Trainingsturnier #2 {#trainingsturnier}

Im selben Kanal hat das Team das zweite Trainingsturnier für Samstag, 10. Oktober, um 14:00 UTC (16:00 CEST) angekündigt: fünf Schweizer Runden, Best-of-Three, niemand scheidet aus und, anders als beim ersten, kein Conquest, also keine Decks einzureichen. Koin hat die wöchentlichen Trainingsturniere am 5. Oktober angekündigt ([unser Artikel](/de/news/crimson-cup-prizepool-qualifiers#training)).

## Woher diese Notes kommen {#quellen}

Die Patchnotes 0.7.1, die das Team am 8. Oktober 2026 auf dem [offiziellen Discord von Origins TCG](https://discord.gg/originstcg) im Kanal game-announcements gepostet hat. Stand 11. Oktober gibt es auf Steam keinen Post zu diesem Update: Der neueste ist vom 5. Oktober.`,
    faq: [
      {
        q: "Zählen Ranked-Partien im Playtest von Origins TCG für die Missionen?",
        a: "Ja, wieder, seit dem Playtest 0.7.1 vom 8. Oktober 2026: Ranked-Partien im PvP bringen die Missionen voran. Du kannst die Missionen weiterhin als PvE im Bereich Missionen spielen. In der Build vom 1. Oktober ließen sich Deck-Missionen nicht über Ranked erledigen.",
      },
      {
        q: "Ändert der Playtest 0.7.1 die Werte der Karten?",
        a: "Nein. Er hat keine Balance-Änderungen: Die Werte der Karten bleiben die von Patch 0.7 vom 29. September 2026, dem letzten Balance-Patch vor der Crimson Cup, und die Kartenseiten auf OriginsMeta ändern sich nicht.",
      },
      {
        q: "Kann man in Origins TCG den Mulligan des Gegners sehen?",
        a: "Im Playtest siehst du seit 0.7.1, wie viele Karten dein Gegner in der Mulligan-Phase ausgetauscht hat. Wann die Änderung die Hauptdemo auf Steam erreicht, wissen wir noch nicht.",
      },
    ],
  },
  "upgrade-meta-1013": {
    title: "Upgrade Meta: danke für fast 200 Matches, und mit OriginsMeta Tracker 0.4.1 erstellst du dein eigenes Layout",
    metaTitle: "OriginsMeta Tracker 0.4.1 für Origins TCG",
    description:
      "Danke für euer Feedback und fast 200 Matches an einem Tag. OriginsMeta Tracker 0.4.1 für Origins TCG bringt vier Panel-Layouts, Setup und Fehlerbehebungen.",
    summary:
      "Danke: Am 12. Oktober habt ihr uns jede Menge Feedback geschickt und mit OriginsMeta Tracker fast 200 Matches aufgezeichnet, obwohl die Server des Spiels einen Großteil des Tages kamen und gingen. Diese Matches sind schon in Analytics. Version 0.4.1 ist da, mit dem, was ihr euch gewünscht habt: vier Panel-Layouts zur Auswahl, Panels nur während eines Matches, eine Setup-Seite und die Fehlerbehebungen, die ihr gemeldet habt.",
    highlights: [
      { label: "Danke", text: "fast 200 Matches am 12. Oktober aufgezeichnet", anchor: "danke" },
      { label: "Erstelle dein Layout", text: "vier Stile für die Panels: Classic, Minimal, Structured und Custom", anchor: "layout" },
      { label: "Nur während des Matches", text: "Panels, die in der ersten Runde erscheinen und am Ende verschwinden", anchor: "im-match" },
      { label: "Setup", text: "die Hauptseite zeigt nur dein Spiel", anchor: "setup" },
      { label: "Korrekturen", text: "kein leeres Kästchen mehr im Deck tracker, Deckänderungen sofort erkannt", anchor: "korrekturen" },
    ],
    body: `## Danke {#danke}

An einem einzigen Tag habt ihr uns jede Menge Feedback geschickt, auf unserem Discord und über die Website, und am 12. Oktober habt ihr mit OriginsMeta Tracker **fast 200 Matches** aufgezeichnet, obwohl die Server des Spiels einen Großteil des Tages immer wieder weg waren. Jedes Match fließt in die Win-Rates in [Analytics](/de/analytics) ein: Legendäre, Community-Decks, Archetypen und Karten, Patch für Patch, nur Gesamtwerte. Viele der Neuerungen hier unten kommen direkt aus euren Nachrichten.

## Erstelle dein Layout {#layout}

Die Panels über dem Spiel gibt es jetzt in vier Stilen, über den neuen Button **Create your layout** neben dem Namen deines Decks:

- **Classic**: dein Deck in einer Spalte links, mit der Legendären als Band wie in unserem [Deckbuilder](/de/deck-builder); die Legendäre und die aufgedeckten Karten des Gegners in einem Streifen oben rechts.
- **Minimal**: zwei Streifen, deine 12 Karten und die Legendäre unten links neben deiner Hand, die des Gegners oben rechts.
- **Structured**: zwei Spalten an den Seiten; rechts, über dem Mana-Panel des Spiels, die Karten des Gegners, die Karten, die noch in seinem Deck sind, und das Mana beider Spieler mit der Kampfrichtung.
- **Custom**: Du wählst vertikal oder horizontal, gezeichnete Karten oder nur die Namen in Reihen, Karten pro Reihe, die Deckkraft des Hintergrunds, ob verbrauchte Karten verschwinden und was jedes Panel zeigt.

Jeder Stil merkt sich, wo du seine Panels platziert hast, und die OBS-Quelle folgt dem Stil, den du wählst.

## Panels nur während des Matches {#im-match}

Eine neue Option zeigt die Panels nur, während du spielst: Sie erscheinen in der ersten Runde und verschwinden etwa 30 Sekunden nach dem Ende, auch in der OBS-Quelle. Dafür braucht es den Bildschirmscanner: Ist der Scanner aus, bleiben die Panels sichtbar.

## Setup und eine aufgeräumte Hauptseite {#setup}

Die Hauptseite der App zeigt jetzt nur dein Spiel: das Deck, das du gewählt hast, deine Zahlen, deine Matches und Ergebnisse. Dein Konto, der Bildschirmscanner, die Panels und die Optionen der App liegen hinter dem Button **Setup**. Das Tutorial startet für alle noch einmal, damit ihr seht, wohin die Dinge umgezogen sind.

## Korrekturen und Updates {#korrekturen}

- Kein leeres Kästchen mehr unten im Deck tracker: Es war ein Platzhalter, den das Spiel in manchen Decks speichert, keine Karte.
- Ein Deck, das du im Spiel änderst, wird im Tracker sofort aktualisiert, ohne auf das nächste Match zu warten.
- Wenn eine neue Version erscheint, bittet dich ein hervorgehobener Hinweis, mit dem Start des Spiels zu warten: Die App aktualisiert sich nur bei geschlossenem Spiel.

Die [Installationsanleitung](/de/tracker#installation) auf der Tracker-Seite besteht jetzt aus fünf kurzen Schritten.

## So aktualisierst du {#aktualisieren}

Wenn du OriginsMeta Tracker schon hast, aktualisiert er sich bei geschlossenem Spiel von selbst auf 0.4.1. Wenn du neu bist, lade ihn von der [Tracker-Seite](/de/tracker) herunter: Das OriginsMeta-Konto ist kostenlos.

OriginsMeta ist eine inoffizielle Fanseite und nicht mit Koin Games verbunden.`,
    faq: [
      { q: "Wie ändere ich den Stil der Panels von OriginsMeta Tracker?", a: "Drück auf Create your layout neben dem Namen deines Decks auf der Hauptseite der App: Es öffnet Setup mit den vier Stilen (Classic, Minimal, Structured und Custom). Die offenen Panels öffnen sich im neuen Stil neu." },
      { q: "Muss ich OriginsMeta Tracker 0.4.1 neu herunterladen?", a: "Nein: Wenn du ihn schon hast, aktualisiert sich die App bei geschlossenem Spiel von selbst auf 0.4.1. Neue Spieler laden sie mit einem kostenlosen OriginsMeta-Konto von der Tracker-Seite herunter." },
    ],
  },
  "upgrade-meta-1012": {
    title: "Upgrade Meta: OriginsMeta Tracker 0.4.0 für alle, Win-Rates offen in Analytics und ein neues Menü",
    metaTitle: "OriginsMeta Tracker 0.4.0 für Origins TCG",
    description:
      "OriginsMeta Tracker 0.4.0 ist für alle mit Gratis-Konto da: Er zeichnet deine Matches in Origins TCG auf, seine Win-Rates sind in Analytics für alle offen.",
    summary:
      "OriginsMeta Tracker, unsere Windows-App, die deine Matches in Origins TCG aufzeichnet, steht jetzt allen mit einem kostenlosen OriginsMeta-Konto zur Verfügung: Version 0.4.0 lädst du auf der Tracker-Seite herunter. Die Win-Rates, die sie sammelt, sind im neuen Bereich Analytics für alle offen, und das Menü ändert sich: Guides, Karten und Orte liegen jetzt unter Database.",
    highlights: [
      { label: "OriginsMeta Tracker für alle", text: "Version 0.4.0, der neue Name von OriginsMeta Analytics, auf der Tracker-Seite", anchor: "tracker" },
      { label: "Nur mit Konto", text: "das Konto ist kostenlos, und die App funktioniert nur damit verknüpft", anchor: "konto" },
      { label: "Win-Rates in Analytics", text: "Legendäre, Decks, Archetypen und Karten, für alle offen", anchor: "analytics" },
      { label: "Ein neues Menü", text: "Database mit Guides, Karten und Orten; Analytics mit dem Tracker", anchor: "menue" },
    ],
    body: `## OriginsMeta Tracker für alle {#tracker}

Bis gestern haben Creator, Autoren, Pro-Spieler und der Staff OriginsMeta Analytics getestet, unsere Windows-App für Origins TCG ([das Release vom 11. Oktober](/de/news/upgrade-meta-1011)). Ab heute heißt sie **OriginsMeta Tracker**, und alle können sie herunterladen: Version 0.4.0 liegt auf der [Tracker-Seite](/de/tracker), mit der [Installationsanleitung Schritt für Schritt](/de/tracker#installation).

Sie macht, was sie schon konnte: Sie zeichnet deine Matches ein paar Sekunden nach dem Ende von selbst auf, liest mit dem Bildschirmscanner die gespielten Karten aus dem Spielfenster, zeigt den Deck tracker live mit den Karten des Gegners und bringt ein Overlay für OBS mit. Sie greift nie ins Spiel ein, und kein Bild verlässt deinen PC.

## Nur mit einem OriginsMeta-Konto {#konto}

Um die App herunterzuladen, meldest du dich bei OriginsMeta an: Das Konto ist kostenlos. Die App funktioniert nur, wenn sie mit deinem Konto verknüpft ist: Erstelle nach der Installation einen Code auf der [Tracker-Seite deines Kontos](/de/account/tracker) und gib ihn in der App ein. Die App prüft die Verknüpfung beim Start und alle 4 Stunden und sendet dabei nur ihren Token.

Wenn du die App schon hast, musst du sie nicht neu herunterladen: Sie aktualisiert sich von selbst auf Version 0.4.0 und bittet dich dann, dein Konto zu verknüpfen, falls du das noch nicht getan hast.

## Win-Rates, für alle offen in Analytics {#analytics}

Die Win-Rates aus den Matches, die mit der App aufgezeichnet werden, sind jetzt für alle in [Analytics](/de/analytics) offen: Legendäre, Community-Decks, Archetypen, Karten, Matchups zwischen Legendären und die Legendären, auf die du am häufigsten triffst, Patch für Patch. Nur Gesamtwerte: nie Namen, einzelne Matches oder wer sie gespielt hat. Die Community-Decks zeigen die Win-Rate ihrer exakten Liste auf ihrer Seite und in der [Deckliste](/de/decks).

Bis gestern waren diese Zahlen der Tab „Win-Rate“ der Tier-List: Die alte Adresse führt jetzt zu Analytics.

## Ein neues Menü {#menue}

Das Menü oben ändert sich, um Platz zu schaffen: **Database** fasst [Guides](/de/guides), [Karten](/de/cards) und [Orte](/de/locations) zusammen, und **Analytics** enthält die Win-Rates und die Seite [Tracker](/de/tracker). Auf dem Handy findest du sie im Menü.

OriginsMeta ist eine inoffizielle Fanseite und nicht mit Koin Games verbunden.`,
    faq: [
      { q: "Wie lade ich OriginsMeta Tracker herunter?", a: "Melde dich bei OriginsMeta an (das Konto ist kostenlos), öffne die Tracker-Seite und drück auf den Download-Button. Die Installationsanleitung auf derselben Seite erklärt jeden Schritt, vom Entpacken der ZIP-Datei bis zur Verknüpfung der App mit deinem Konto." },
      { q: "Kann ich OriginsMeta Tracker ohne Konto nutzen?", a: "Nein: Ab Version 0.4.0 funktioniert die App nur, wenn sie mit einem OriginsMeta-Konto verknüpft ist. Sie prüft die Verknüpfung beim Start und alle 4 Stunden und sendet dabei nur ihren Token." },
      { q: "Wo finde ich die Win-Rates von Origins TCG auf OriginsMeta?", a: "In Analytics, im Menü oben: die Win-Rates von Legendären, Community-Decks, Archetypen und Karten, Patch für Patch, aus den Matches, die mit OriginsMeta Tracker aufgezeichnet wurden." },
    ],
  },
  "upgrade-meta-1011": {
    title: "Upgrade Meta: OriginsMeta Analytics 0.3.4, der Match-Tracker für Origins TCG mit Deck tracker in Echtzeit",
    metaTitle: "OriginsMeta Analytics 0.3.4: Tracker für Origins TCG",
    description:
      "OriginsMeta Analytics 0.3.4: die Windows-App, die deine Matches in Origins TCG aufzeichnet, mit Deck tracker in Echtzeit und Gegnerkarten. Bald für alle.",
    summary:
      "OriginsMeta Analytics 0.3.4 ist da, das Release, das diese Arbeitswoche an unserer Windows-App für Origins TCG abschließt. Sie zeichnet deine Matches beim Spielen von selbst auf, liest die Karten aus dem Spielfenster und zeigt einen Deck tracker in Echtzeit: dein Deck mit den gezogenen Karten, die Karten, die noch im Deck sind, das Leben deines Helden und die Karten des Gegners, sobald sie auftauchen. Heute testen sie Creator, Autoren, Pro-Spieler und Staff; bald steht sie allen zur Verfügung.",
    highlights: [
      { label: "Deine Matches, aufgezeichnet", text: "Ergebnis, Deck, Runden, die Karten beider Seiten und die Legendäre des Gegners, von selbst, ein paar Sekunden nach dem Ende", anchor: "matches" },
      { label: "Deck tracker in Echtzeit", text: "deine 12 Karten, die beim Ziehen dunkler werden, die Legendäre, die Karten, die noch im Deck sind, und das Leben deines Helden", anchor: "deck-tracker" },
      { label: "Die Karten des Gegners", text: "seine Legendäre, sein Leben und die Karten, die er aufdeckt, eine nach der anderen", anchor: "gegner" },
      { label: "Vollbild oder Fenster", text: "jede Größe, Demo und Playtest, und sie aktualisiert sich selbst", anchor: "bildschirm" },
      { label: "Bald für alle", text: "heute testen sie Creator, Autoren, Pro-Spieler und Staff", anchor: "fuer-alle" },
    ],
    body: `## Version 0.3.4 {#version}

OriginsMeta Analytics ist unsere Windows-App für Origins TCG: Sie zeichnet deine Matches beim Spielen auf und zeigt dir live, was in deinem Deck passiert. Version 0.3.4, erschienen am 11. Oktober 2026, schließt eine Arbeitswoche ab, in der die App gelernt hat, die Matches aus dem Spielfenster zu lesen, denn seit Patch 0.7 speichert das Spiel die Matchdaten nicht mehr auf deinem PC. Es ist noch eine Testversion: Der Screenshot im Titelbild stammt aus einem echten Match der Demo 2.0, mit den beiden Panels der App darüber, die zeigen, was sie in diesem Moment (Runde 7) gelesen haben, und ohne die Namen der Spieler.

## Deine Matches, von selbst aufgezeichnet {#matches}

Du öffnest die App, spielst, und ein paar Sekunden nach dem Ende ist das Match in deinem Verlauf: das Ergebnis, das Deck, das du im Spiel gewählt hast, die Runden, die Karten, die du und dein Gegner Runde für Runde gespielt habt, und die Legendäre des Gegners aus dem VS-Bildschirm. Wenn du die App mit deinem OriginsMeta-Konto verknüpfst, sind deine Matches auch auf der Website.

Um die Karten zu lesen, nutzt die App den **Bildschirmscanner**: Er beobachtet nur das Fenster von Origins TCG, erkennt die Karten auf deinem PC und schickt nie Bilder irgendwohin. Nur die IDs der Karten erreichen die Website, nie die Namen der Spieler. Die App greift nie ins Spiel ein: keine geschriebenen Dateien, kein ausgelesener Speicher, nichts, was am Spiel etwas verändert.

## Der Deck tracker in Echtzeit {#deck-tracker}

Der neue Deck tracker, von Davdas für einen schnellen Blick statt zum Lesen gestaltet: deine 12 Karten in groß, in einem 4 × 3-Raster nach Kosten. Eine Karte wird blasser, wenn du eine ihrer zwei Kopien gezogen hast („1/2“), und dunkel, wenn du beide gezogen hast: Die App liest auch die Karten in deiner Hand. Darunter deine Legendäre für sich (sie wird mit einem Zoom dunkel, sobald du sie ziehst), die Karten, die noch in deinem Deck sind, und das Leben deines Helden, die zwei Segmente des Rings unter deinem Helden.

![Der Deck tracker während eines Matches der Demo 2.0: gezogene Karten abgedunkelt, noch 8 Karten im Deck, 2 Lebenssegmente](/media/analytics/deck-tracker-me.webp)

## Die Karten des Gegners {#gegner}

Ein zweites, etwas kleineres Panel für den Gegner: seine Legendäre, sein Leben und die Karten, die er aufdeckt und die im Lauf des Matches eine nach der anderen erscheinen. Es startet leer und zeigt nie leere Kästchen.

![Das Panel des Gegners: Dracula, noch ein Lebenssegment, Quasimodo und Captain Ahab aufgedeckt](/media/analytics/deck-tracker-opp.webp)

Die beiden Panels bleiben über dem Spiel, ohne Windows-Rahmen: Zieh sie, wohin du willst, mach sie an den Rändern breiter, und sie müssen nie gescrollt werden. Dieselben Panels gibt es auch als Browserquelle für OBS, für alle, die streamen.

## Vollbild oder Fenster, Demo und Playtest {#bildschirm}

Die App funktioniert mit Origins TCG im Vollbild oder in einem Fenster jeder Größe und Form, bei jeder Windows-Skalierung, mit der Steam-Demo und mit dem Playtest. Wenn wir eine neue Version veröffentlichen, lädt sie sie herunter und startet von selbst aktualisiert neu, nie während eines Matches.

## Bald für alle {#fuer-alle}

Heute testen Creator, Autoren, Pro-Spieler und der Staff der Website OriginsMeta Analytics: Sie spielen jeden Tag damit und sagen uns, was nicht funktioniert. Bald kann sie jeder herunterladen, zusammen mit den Win-Rate-Seiten, die die Matches derjenigen nutzen, die die App verknüpfen (nur Gesamtwerte, nie wer gespielt hat). Das Datum kündigen wir hier und auf [unserem Discord](https://discord.gg/RAG7nnrNGP) an.

OriginsMeta ist eine inoffizielle Fanseite und nicht mit Koin Games verbunden.`,
    faq: [
      { q: "Wann ist OriginsMeta Analytics für alle verfügbar?", a: "Bald: Heute testen sie Creator, Autoren, Pro-Spieler und Staff. Das Datum kündigen wir in den News und auf dem Discord von OriginsMeta an." },
      { q: "Verändert oder liest OriginsMeta Analytics das Spiel?", a: "Die App greift nie ins Spiel ein: Sie liest nur das Bild des Fensters von Origins TCG und die Dateien, die das Spiel auf deinem PC speichert, ohne etwas zu schreiben. Die Bilder bleiben auf deinem PC, und nur die IDs der Karten erreichen die Website, nie die Namen der Spieler." },
      { q: "Funktioniert sie im Vollbild und im Fenster?", a: "Ja, ab Version 0.3.4: im Vollbild oder in einem Fenster jeder Größe und Form, bei jeder Windows-Skalierung, mit der Steam-Demo und mit dem Playtest." },
    ],
  },
  "upgrade-meta-1007": {
    title: "Upgrade Meta: OriginsMeta spricht Französisch, die vierte Sprache der Seite, mit allen Karten, Guides und News",
    metaTitle: "Upgrade Meta: OriginsMeta für Origins TCG auf Französisch",
    description:
      "OriginsMeta gibt es jetzt auf Französisch: Oberfläche, News, Guides, 230 Karten, 44 Orte, Deckbuilder und Tier-Lists, mit den im Spiel gelesenen Kartentexten.",
    summary:
      "Seit dem 7. Oktober 2026 gibt es OriginsMeta auch auf Französisch: Oberfläche, News, die 20 Guides, die 230 Karten, die 44 Orte, FAQ, Events, MetaShifting, Deckbuilder, Tier-Lists und Community-Seiten, unter originsmeta.com/fr mit denselben Adressen wie in den anderen Sprachen. Seit dem 8. Oktober sind die französischen Kartentexte die offiziellen des Spiels, Karte für Karte im Spiel gelesen. Deck-Guides, Community-Guides und Comics werden automatisch ins Französische übersetzt, und wenn du Französisch liest und einen Fehler findest, schreib uns.",
    highlights: [
      { label: "Französisch ist da", text: "die ganze Website unter /fr: Oberfläche, News, Guides, Karten, Orte, FAQ, Events, MetaShifting, Deckbuilder, Tier-Lists und Community", anchor: "franzoesisch" },
      { label: "Kartentexte, jetzt die des Spiels", text: "seit dem 8. Oktober zeigen die französischen Kartenseiten den offiziellen, im Spiel gelesenen Text, und die ganze Website nutzt die Schlüsselwörter des Spiels", anchor: "kartentexte" },
      { label: "Community auf Französisch", text: "Deck-Guides, Community-Guides und Comics automatisch übersetzt, Turniere auf Französisch, Discord mit dem französischen Link", anchor: "community" },
      { label: "Warum Französisch", text: "das Spiel ist ins Französische übersetzt, und nach Spanisch ist es die vierte Sprache der Website", anchor: "warum-franzoesisch" },
      { label: "Hilf uns", text: "wenn du Französisch liest und einen Fehler findest, schreib uns: über den Feedback-Button oder unseren Discord", anchor: "hilfe" },
    ],
    body: `## Französisch ist da {#franzoesisch}

Seit dem 7. Oktober 2026 gibt es OriginsMeta auch auf Französisch, der vierten Sprache der Website nach Englisch, Italienisch und Spanisch. Die Sprache wechselst du mit EN · IT · ES · FR oben auf jeder Seite (auf dem Handy im Menü). Jede Seite behält dieselbe Adresse wie in den anderen Sprachen, mit dem Präfix /fr/: originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. Ist dein Browser auf Französisch eingestellt, führt dich originsmeta.com direkt zur französischen Version, und hreflang und Sitemap führen die vier Versionen jeder Seite auf.

Was es auf Französisch gibt: die Oberfläche, die 32 bisher veröffentlichten News, die 20 [Guides](/de/guides), die Seiten der 230 [Karten](/de/cards) (Kartentext und Herkunftsnotiz), die 44 [Orte](/de/locations), die [FAQ](/de/faq), die [Events](/de/tournaments), den Balance-Verlauf ([MetaShifting](/de/metashifting)), den [Deckbuilder](/de/deck-builder), die [Tier-Lists](/de/tier-list) und die Community-Seiten. Wir schreiben Standardfranzösisch, das in allen französischsprachigen Ländern lesbar ist, und die Kartennamen bleiben auf Englisch, wie im Spiel.

Französisch war schon in der ersten Version der Website im September 2026 dabei und wurde am 15. September zurückgezogen: Es kommt von Grund auf neu gebaut zurück, mit denselben SEO-Regeln wie die anderen Sprachen (ein H1 pro Seite, eigener Title und eigene Description, interne Links, strukturierte Daten).

## Kartentexte auf Französisch: die des Spiels, seit dem 8. Oktober {#kartentexte}

Update vom 8. Oktober: Wir haben die Karten im Spiel auf Französisch gelesen. Die 122 Karten der Sammlung der Demo 2.0 zeigen auf ihren Seiten jetzt den offiziellen französischen Text, wie auf Italienisch und Spanisch, und die ganze Website (Kartenseiten, Schlüsselwort-Tags, Guides, News, Deckbuilder) nutzt die Schlüsselwörter des Spiels. Drei weichen vom vorläufigen Glossar ab, mit dem wir gestartet waren: First Strike heißt „Première frappe“ (nicht „Initiative“), ein Feld auf dem Spielfeld ist eine „case“, und Evil-Charaktere heißen im Regeltext „Mauvais“. Die erschaffenen und die entfernten Karten, die die Sammlung des Spiels nicht zeigt, sind weiterhin unsere Übersetzung, jetzt mit dem Glossar des Spiels, und ihre Seiten sagen das. Die 44 Orte wurden noch in keiner Sprache im Spiel überprüft.

Als Französisch am 7. Oktober kam, waren die Kartentexte eine Übersetzung von OriginsMeta, geschrieben mit einem vorläufigen Glossar der Schlüsselwörter (On Reveal „À la révélation“, Shield „Bouclier“, Trample „Piétinement“, Deathtouch „Contact mortel“, Defender „Défenseur“, First Strike „Initiative“), und jede französische Kartenseite sagte das.

## Die Community auf Französisch {#community}

Was die Community veröffentlicht, wird ebenfalls automatisch ins Französische übersetzt, nach der Veröffentlichung, wie es schon zwischen Englisch, Italienisch und Spanisch geschieht: die Guides der veröffentlichten Decks (Einzeldecks und Turnierdecks), die Community-Guides und die Comics der Creator. Die Übersetzungen dessen, was schon online ist, kommen in den nächsten Tagen. Turniere können auch auf Französisch erstellt werden, und [unser Discord](https://discord.gg/RAG7nnrNGP) kündigt neue Inhalte auch mit dem Link zur französischen Seite an.

## Warum Französisch {#warum-franzoesisch}

Origins TCG ist ins Französische übersetzt: Die Steam-Seite des Spiels führt Französisch unter ihren 13 Sprachen für die Oberfläche (die vollständige Sprachausgabe gibt es nur auf Englisch). Nach [Spanisch, das am 25. September kam](/de/news/upgrade-meta-0925), ist Französisch die vierte Sprache von OriginsMeta, aus demselben Grund: in den Sprachen gelesen zu werden, die das Spiel spricht.

## Hilf uns, es richtig zu machen {#hilfe}

Wenn du Französisch liest und einen Fehler findest, einen holprigen Satz oder ein Schlüsselwort, das nicht zum Spiel passt, sag es uns: mit dem Feedback-Button auf jeder Seite oder auf unserem Discord. Wir lesen alles und korrigieren es im nächsten Update.`,
    faq: [
      { q: "Gibt es OriginsMeta auf Französisch?", a: "Ja, seit dem 7. Oktober 2026: die ganze Website, mit Guides, News, Karten, Orten, Tier-Lists und dem Deckbuilder. Die Sprache wechselst du mit EN · IT · ES · FR oben auf der Seite; die Guides der Community-Decks, die Guides und die Comics werden automatisch übersetzt." },
      { q: "Sind die französischen Kartentexte offiziell?", a: "Ja, seit dem 8. Oktober 2026: Wir haben die 122 Karten der Sammlung der Demo 2.0 im Spiel auf Französisch gelesen, und ihre Seiten zeigen den offiziellen Text, wie auf Italienisch und Spanisch (gelesen am 25. September). Erschaffene und entfernte Karten, die die Sammlung des Spiels nicht zeigt, sind weiterhin unsere Übersetzung mit dem Glossar des Spiels, und ihre Seiten sagen das." },
      { q: "Werden Community-Decks und -Guides ins Französische übersetzt?", a: "Ja, automatisch nach der Veröffentlichung: die Guides der veröffentlichten Decks, die Community-Guides und die Comics der Creator. Die Übersetzungen dessen, was schon online ist, kommen in den nächsten Tagen, und Turniere können auch auf Französisch erstellt werden." },
    ],
  },
  "upgrade-meta-1005": {
    title: "Upgrade Meta: Turnierdecks, drei Conquest-Decks zusammen veröffentlicht mit einem einzigen Guide",
    metaTitle: "Upgrade Meta: Turnierdecks für Origins TCG",
    description:
      "Neu auf OriginsMeta: Turnierdecks, drei Conquest-Decks für Origins TCG zusammen mit einem Guide veröffentlicht, die Regeln des Crimson Cup für dich geprüft.",
    summary:
      "Der Bereich Decks hat jetzt zwei Teile: Einzeldecks und Turnierdecks. Ein Turnierdeck ist ein Set aus drei Conquest-Decks, die zusammen mit einem einzigen Guide veröffentlicht werden, der erklärt, wie sie als Team funktionieren, und die Website prüft vor der Veröffentlichung die Regeln des Crimson Cup für dich.",
    highlights: [
      { label: "Turnierdecks", text: "drei Conquest-Decks und ein Guide auf einer einzigen Seite, unter Decks", anchor: "turnierdecks" },
      { label: "So veröffentlichst du", text: "Turniermodus im Deckbuilder, dann „Die 3 Decks veröffentlichen“", anchor: "veroeffentlichen" },
      { label: "Conquest-Regeln", text: "drei verschiedene Legendäre und mindestens 8 verschiedene Karten zwischen je zwei Decks", anchor: "regeln" },
      { label: "Die Seite eines Sets", text: "die Rolle jedes Decks, die drei Spielcodes, Bewertungen und übersetzter Guide", anchor: "seite-des-sets" },
      { label: "Für Streamer", text: "Kurzlink, Chat-Befehl !deck, OBS-Overlay und Bild für dein Set", anchor: "streamer" },
    ],
    body: `## Turnierdecks {#turnierdecks}

In einem Conquest-Turnier wie dem Crimson Cup bringst du nicht ein Deck mit, sondern drei. Bisher hatte OriginsMeta nur Einzeldecks, also musste ein Set aus drei Decks als drei getrennte Seiten veröffentlicht werden, jede mit eigenem Guide. Jetzt hat das Menü [Decks](/de/decks) zwei Teile: **Einzeldecks** und **[Turnierdecks](/de/decks/tournament)**.

Ein Turnierdeck sind drei Decks, die zusammen veröffentlicht werden, mit **einem einzigen Guide** für das ganze Set: der Spielplan für die drei Decks und die Rolle jedes einzelnen (wann du es wählst, welche Matchups es abdeckt), dazu Stärken, Schwächen, Matchups und Notizen, wenn du sie ergänzen willst.

## So veröffentlichst du ein Turnierdeck {#veroeffentlichen}

1. Öffne den [Deckbuilder](/de/deck-builder) und wechsle zu **Turnier (3 Decks)**. Der Button „Ein Turnierdeck veröffentlichen“ auf der Seite [Turnierdecks](/de/decks/tournament) öffnet ihn direkt in diesem Modus.
2. Baue die Decks A, B und C. Die Tabelle unter den Decks zeigt, wie viele verschiedene Karten jedes Paar hat.
3. Wenn die drei Decks vollständig sind und den Regeln entsprechen, drück auf **Die 3 Decks veröffentlichen**.
4. Gib dem Set einen Namen, schreib den Spielplan und die Rolle jedes Decks und veröffentliche es.

Du musst [angemeldet](/de/login) sein. Deine Turnierdecks findest du in [deinem Konto](/de/account), wo du sie bearbeiten, verbergen oder löschen kannst, und auf deinem öffentlichen Profil. Jedes Konto kann so viele Turnierdecks veröffentlichen wie Einzeldecks (5 für Community-Konten, 20 für Autoren, keine Grenze für Creator, Pro-Spieler und Staff), getrennt gezählt.

## Die Conquest-Regeln, für dich geprüft {#regeln}

Jedes Set folgt den Regeln des Crimson Cup, denselben, die der Deckbuilder schon verwendet:

- **drei verschiedene Legendäre**, eine pro Deck;
- **mindestens 8 verschiedene einzigartige Karten zwischen je zwei Decks**: Jede Karte zählt einmal, die Legendäre eingeschlossen, also können zwei Decks höchstens 5 Karten gemeinsam haben.

Hält sich ein Set nicht daran, bleibt der Button aus, und der Deckbuilder sagt dir, was nicht stimmt; beim Veröffentlichen prüft die Website noch einmal. Unser [Conquest-Guide](/de/guides/origins-tcg-conquest) erklärt, wie du drei Decks baust, die zusammenhalten.

## Die Seite eines Sets {#seite-des-sets}

- Oben der Spielplan, dann **die drei Decks**: für jedes seine Rolle im Set, die vollständigen Karten, der **Spielcode** zum Einfügen in Origins TCG und „Im Deck builder öffnen“.
- Ein Kasten mit den Conquest-Regeln und den verschiedenen Karten zwischen je zwei Decks.
- **Bewertungen** von 1 bis 5 Sternen, wie bei Einzeldecks (nie für dein eigenes Set).
- Der Guide wird in einer Sprache geschrieben und **automatisch** in die anderen beiden **übersetzt**.
- Beim Veröffentlichen wird das Set live auf unserem [Discord](https://discord.gg/RAG7nnrNGP) gepostet, in #community-decks, und wer dir folgt, bekommt eine Benachrichtigung, wenn du Creator, Autor, Pro-Spieler oder Staff bist.
- In deinem Konto siehst du die Aufrufe, die kopierten Codes und die Klicks deiner Sets: Es sind Schätzungen, wie die für Einzeldecks.

## Für Streamer {#streamer}

Jedes Turnierdeck hat dieselben Tools wie die Einzeldecks, im Menü „Für Streamer“ seiner Seite:

- einen **Kurzlink**, originsmeta.com/d/ gefolgt vom Code des Sets, zum Ansagen im Stream;
- den **Chat-Befehl !deck** für Nightbot, StreamElements und Fossabot, der das Set und seine drei Legendären in den Chat schreibt;
- ein **Overlay für OBS** mit den drei Decks, vertikal oder horizontal;
- ein **Bild** des Sets zum Herunterladen in 16:9 oder 9:16.

Befehl und Overlay sieht nur, wer das Set veröffentlicht hat. Der [Streaming-Guide](/de/guides/streaming-tools) erklärt Schritt für Schritt, wie du sie einbindest.

## Mach mit {#mach-mit}

Baue deine drei Decks im [Deckbuilder](/de/deck-builder), veröffentliche sie und schick den Link vor dem Turnier an dein Team. Sei unter den Ersten, die in [Turnierdecks](/de/decks/tournament) veröffentlichen.`,
    faq: [
      { q: "Wie veröffentliche ich drei Conquest-Decks zusammen auf OriginsMeta?", a: "Wechsle im Deckbuilder in den Turniermodus, baue die Decks A, B und C mit drei verschiedenen Legendären und mindestens 8 verschiedenen Karten zwischen je zwei Decks, drück dann auf „Die 3 Decks veröffentlichen“ und schreib einen einzigen Guide für das Set." },
      { q: "Folgen Turnierdecks den Regeln des Crimson Cup?", a: "Ja. Jedes Set hat drei verschiedene Legendäre und mindestens 8 verschiedene einzigartige Karten zwischen je zwei Decks, die Legendäre eingeschlossen. Der Deckbuilder und die Website prüfen das, bevor das Set online geht." },
    ],
  },
  "upgrade-meta-1003": {
    title: "Upgrade Meta: Draft gegen das Gehirn, Deck-Versionen, gespeicherte Decks und neue Kartenfilter",
    metaTitle: "Upgrade Meta: Draft und Deck-Versionen in Origins TCG",
    description:
      "Neu auf OriginsMeta: ein Draft für Origins TCG gegen unseren Bot oder einen Freund, Deck-Updates für Patch 0.7, gespeicherte Decks, Trends, neue Kartenfilter.",
    summary:
      "In den letzten Tagen hat OriginsMeta einen kostenlosen Draft für Origins TCG bekommen, gegen unseren Bot oder gegen einen Freund, und du kannst deine veröffentlichten Decks jetzt auf Patch 0.7 aktualisieren, ohne Name, Guide und Bewertungen zu verlieren. Außerdem kannst du Decks speichern, die dir gefallen, die angesagten finden, Karten nach Kosten, Schlüsselwort, Kraft und Leben filtern und die Karten sehen, die jeder Patch verändert hat, vorher und nachher.",
    highlights: [
      { label: "Draft", text: "drei Formate gegen das Gehirn, unseren Bot, oder gegen einen Freund in einem Online-Raum", anchor: "draft" },
      { label: "Deck-Versionen", text: "ein veröffentlichtes Deck auf Patch 0.7 aktualisieren und Name, Guide und Link behalten", anchor: "deck-versionen" },
      { label: "Gespeicherte und angesagte Decks", text: "der Button Speichern, die Sortierungen Im Trend und Am meisten gespeichert und der Filter nach Spielversion", anchor: "gespeicherte-decks" },
      { label: "Karten und MetaShifting", text: "Filter nach Kosten, Schlüsselwort, Kraft und Leben, und jeder Patch vorher und nachher", anchor: "karten" },
      { label: "OriginsMeta Analytics", text: "unser Match-Tracker, seit Patch 0.7 pausiert: sag uns, ob du ihn willst", anchor: "analytics" },
      { label: "Anmeldung und Profil", text: "der Code aus der E-Mail neben dem Link und eine eigene Seite für dein öffentliches Profil", anchor: "konto" },
      { label: "Guides und Comics", text: "der Guide zu den Streaming-Tools und Comics, die in mehr als einer Sprache gezeichnet sind", anchor: "guides-comics" },
    ],
    body: `## Draft gegen das Gehirn oder einen Freund {#draft}

Der [Draft](/de/draft) ist eine kostenlose Möglichkeit, ein Deck für Origins TCG aus Karten zu bauen, die du eine nach der anderen auswählst. Du wählst deine Legendäre und deine Karten und baust dann ein Deck nach den Regeln des Spiels (1 Legendäre und 12 Karten, die jeweils doppelt zählen: 25 Karten). Es gibt drei Formate:

- **Tausch**: Du siehst 3 Karten, behältst eine, gibst eine deinem Gegner, und die dritte wird verbrannt.
- **Trio**: 3 gemeinsame Karten, ein Spieler wählt, dann der andere, und die dritte wird verbrannt. Du siehst alles, was dein Gegner nimmt.
- **Packs**: Packs aus 6 Karten, die ihr hin und her reicht, wie bei einem TCG aus Papier. Die Picks deines Gegners siehst du nicht.

**Gegen das Gehirn** spielst du sofort, ohne Konto: Das Gehirn ist unser Bot und weiß nur, was ein Spieler auf seinem Platz wissen würde. **Gegen einen Freund** erstellst du einen Raum und schickst den Link oder den Code: Der Draft beginnt, sobald dein Freund beitritt, mit einem Timer für jeden Pick (läuft die Zeit ab, wählt das Gehirn für den, der sich nicht entschieden hat). Ihr müsst beide angemeldet sein.

Am Ende gibt das Gehirn sein Urteil über beide Decks ab, von Herausragend bis Schwach, nach Kurve, Removal und Synergien: Das ist die Meinung des Bots, das echte Match wird im Spiel gespielt. Du kannst den Spielcode kopieren, das Deck im [Deckbuilder](/de/deck-builder) öffnen oder einen Freund auf denselben Draft herausfordern, mit denselben Karten in derselben Reihenfolge.

## Deck-Versionen {#deck-versionen}

Nach [Patch 0.7](/de/news/patch-0-7) hatten viele veröffentlichte Decks Karten, die jetzt mehr kosten. Jetzt kannst du **die Karten eines veröffentlichten Decks aktualisieren** und Name, Guide, Videos und Link behalten: Drück auf der Seite deines Decks oder in [deinem Konto](/de/account) auf „Auf Version 0.7 aktualisieren“, ändere die Karten im Deckbuilder und speichere. Vor dem Speichern siehst du, was reinkommt und was rausgeht.

Die früheren Versionen bleiben auf der Seite des Decks, unter „Versionen dieses Decks“, mit ihren Änderungen und ihrer Bewertung. Bewertungen werden nie gelöscht: Die angezeigte Bewertung ist die der aktuellen Version, während ältere Bewertungen bei der Version bleiben, für die sie abgegeben wurden.

## Gespeicherte und angesagte Decks {#gespeicherte-decks}

- **Speichern**: Auf der Seite jedes Decks gibt es einen Button, um es zu speichern. Deine gespeicherten Decks findest du in [deinem Konto](/de/account) unter „Gespeicherte Decks“. Nur du siehst die Liste.
- **Neue Sortierungen** in [Decks](/de/decks): **Im Trend**, die Decks, die diese Woche die meiste Aufmerksamkeit bekommen haben (Aufrufe, kopierte Codes, Bewertungen und Speicherungen), und **Am meisten gespeichert**.
- **Spielversion**: Das Filterpanel von Decks hat jetzt die Spielversion, mit der Zahl der Decks für jede. Jedes Deck zeigt den Patch, für den es gebaut wurde.

## Karten und MetaShifting {#karten}

- In [Karten](/de/cards) gibt es eine Reihe von Kostenfiltern (0 bis 6 und 7+), die immer sichtbar ist, und unter „Weitere Filter“ das Schlüsselwort und die Bereiche für Kraft und Leben, dazu einen Button, um alle zurückzusetzen.
- In [MetaShifting](/de/metashifting) beginnt jeder Patch jetzt mit „Vorher und nachher“: jede Karte, deren Kosten, Kraft oder Leben sich geändert haben, nebeneinander, mit den geänderten Werten hervorgehoben.

## OriginsMeta Analytics {#analytics}

OriginsMeta Analytics ist unsere Windows-App, die deine Matches in Origins TCG beim Spielen von selbst aufzeichnet: das Deck, das Ergebnis, die Legendären, gegen die du gespielt hast, mit einem Overlay über dem Spiel und für OBS. Sie ist fertig und funktioniert, aber seit Patch 0.7 speichert das Spiel die Matchdaten, die die App gelesen hat, nicht mehr auf deinem PC, deshalb ist sie vorerst pausiert, und die Win-Rate-Seiten sind abgeschaltet.

Wir wollen sie dem Team von Koin Games zeigen und fragen, ob diese Daten wieder verfügbar gemacht werden können. Wenn du Interesse hast, drück auf der Seite auf **„Ja, ich will sie“**: Je mehr Spieler fragen, desto mehr zählt die Anfrage.

## Anmeldung und Profil {#konto}

- **Code aus der E-Mail**: Die Anmelde-E-Mail enthält jetzt neben dem Link einen Code. Wenn sich der Link in einem anderen Browser öffnet (auf deinem Handy, in der Gmail-App) oder nicht funktioniert, gib den Code im Anmeldefeld ein, unter „Hast du schon den Code aus der E-Mail?“.
- **Deine öffentliche Seite**: In deinem Konto führt dich unter „Deine öffentliche Seite“ der Button „Meine öffentliche Seite bearbeiten“ zu einer eigenen Seite mit deiner Bio, deinen Kanälen, deinem Foto und, für Creator, Autoren, Pro-Spieler und Staff, dem Schaufenster.
- **Menü**: Am Computer öffnen Tier-List und Deck builder ein Untermenü, mit den Seiten der Tier-List, Analytics und dem Draft.

## Guides und Comics {#guides-comics}

- Ein neuer Guide: [Origins TCG streamen](/de/guides/streaming-tools), mit dem OBS-Overlay, dem Chat-Befehl !deck, den Kurzlinks und dem LIVE-Badge, Schritt für Schritt.
- Comics können jetzt Versionen haben, die in jeder Sprache gezeichnet sind: Die Leser sehen die in ihrer Sprache gezeichnete Version statt der automatischen Übersetzung.
- Die Guides zu den Decks, die vor Patch 0.7 veröffentlicht wurden, behalten ihre Strategie so, wie sie geschrieben wurde, mit einem Hinweis oben: Die Kartentabellen zeigen die neuen Kosten.

## Mach mit {#mach-mit}

[Registrier dich](/de/login) kostenlos mit Discord oder deiner E-Mail, probier den [Draft](/de/draft) aus und aktualisiere deine Decks auf Patch 0.7. Und [komm auf unseren Discord](https://discord.gg/RAG7nnrNGP): Alles, was auf der Website online geht, wird dort gepostet.`,
    faq: [
      { q: "Gibt es einen Draft-Modus für Origins TCG?", a: "Im Spiel noch nicht, aber OriginsMeta hat einen kostenlosen unter originsmeta.com/de/draft: drei Formate gegen das Gehirn, unseren Bot, ohne Konto, oder gegen einen Freund in einem Online-Raum. Am Ende kannst du den Spielcode deines Decks kopieren." },
      { q: "Wie aktualisiere ich mein veröffentlichtes Deck auf Patch 0.7?", a: "Drück auf der Seite deines Decks oder in deinem Konto auf „Auf Version 0.7 aktualisieren“, ändere die Karten im Deckbuilder und speichere. Name, Guide, Videos und Link bleiben gleich, und die vorherige Version bleibt mit ihrer Bewertung auf der Seite." },
      { q: "Warum sind die Win-Rates abgeschaltet?", a: "Seit Patch 0.7 speichert das Spiel die Matchdaten, die OriginsMeta Analytics gelesen hat, nicht mehr auf deinem PC. Die App ist pausiert: Wenn du sie willst, sag es auf der Seite von Analytics, und wir zeigen sie Koin Games." },
    ],
  },
  "playtest-patch-notes-1001": {
    title: "Patchnotes zum Playtest von Origins TCG: Missionen getrennt vom Ranked, zwei neue Orte, schnellere Animationen",
    metaTitle: "Playtest-Patchnotes zu Origins TCG: Missionen und Ranked",
    description:
      "Playtest-Update von Origins TCG vom 1. Oktober: PvE-Missionen getrennt vom Ranked, Filter im Deckbuilder, zwei neue Orte, ein Turnierpool, neue Kartenfixes.",
    summary:
      "Koin Games hat den Playtest-Build der Demo 2.0 aktualisiert, mit dem größten Update seit 0.6.3. Missionen werden reines PvE und stehen nicht mehr zwischen dir und dem Ranked, der Deckbuilder bekommt mehr Filter, und zwei Orte kommen dazu. Die zehn Balance-Änderungen sind die, die die Hauptdemo schon hat.",
    highlights: [
      { label: "Missionen und Ranked sind getrennt", text: "Missionen nur noch PvE, Ranked-Matchmaking, wann immer du willst", anchor: "missionen-ranked" },
      { label: "Ein Deckbuilder mit mehr Filtern", text: "Schlüsselwörter beim Darüberfahren, eine oder zwei Kopien klar erkennbar", anchor: "deck-builder" },
      { label: "Weltrang auf dem VS-Bildschirm", text: "für Spieler in Grandmaster", anchor: "grandmaster" },
      { label: "Schnellere Animationen", text: "und ein eigener Regler für die Lautstärke der Stimmen", anchor: "tempo-audio" },
      { label: "Zehn Balance-Änderungen", text: "alle schon in der Hauptdemo und auf OriginsMeta", anchor: "balance" },
      { label: "Fünf Kartenänderungen, neu in diesen Notes", text: "En Passant, Betäubt, Todesberührung, Boitata, Reflection", anchor: "neue-aenderungen" },
      { label: "Zwei neue Orte, einer entfernt", text: "Ballroom und Tectonic Decay neu, Ashen Grove raus", anchor: "neue-orte" },
      { label: "Ein Orte-Pool für Turniere", text: "auch Raumkämpfe nutzen ihn", anchor: "turnierpool" },
    ],
    body: `## Der Playtest holt die Demo ein {#playtest}

Koin Games hat den Playtest der Demo 2.0 aktualisiert, den separaten Build, dem du über den offiziellen Discord beitrittst. „Das ist unser größtes Update seit 0.6.3“, schreibt das Team, und es warnt, dass der Build frisch aus der Entwicklung kommt: Es wird Bugs und Platzhalter geben. Viele der Änderungen, fügt das Team hinzu, waren schon mit [dem Update vom 21. September](/de/news/demo-patch-notes-0921) und mit [Patch 0.7](/de/news/patch-0-7) in der Hauptdemo angekommen.

## Missionen und Ranked sind getrennt {#missionen-ranked}

Missionen und Bosse sind jetzt komplett PvE: Du triffst nur auf Bots, und sie dienen nur dazu, Decks freizuschalten. Sie haben einen eigenen Spielen-Button auf dem Missionen-Bildschirm, also ist der Spielen-Button auf dem Startbildschirm jetzt nur noch für echtes Matchmaking da, das du nutzen kannst, wann immer du willst.

- Du musst nicht mehr alle Missionen abschließen, bevor dich das Ranked-Matchmaking einem Gegner zuteilt: Es versucht jedes Mal, wenn du Ranked spielst, einen passenden Gegner für dich zu finden. Das Team arbeitet noch daran.
- **In diesem Playtest können Deck-Missionen nicht im Ranglisten-Modus abgeschlossen werden.** Das Team schaltet das in einem künftigen Build wieder ein. Wenn du noch Decks freischalten musst, spiel die Missionen im Missionen-Bereich.
- Die Belohnungsleiste verteilt die Preise auf mehr Missionen, und der Missionen-Bildschirm hat einen Deckwechsel, um dein Deck zu tauschen.

Wie Ranked in der Demo funktioniert und was wir über die Ladder wissen, steht in [unserem Ranked-Guide](/de/guides/origins-tcg-ranked).

**Update vom 11. Oktober:** Mit dem Playtest-Update 0.7.1 vom 8. Oktober zählen Ranked-Matches wieder für die Deck-Missionen, und die Missionen lassen sich weiterhin als PvE im Missionen-Bereich spielen ([die Patchnotes 0.7.1](/de/news/playtest-patch-notes-0-7-1#missionen-ranked)).

## Deckbuilder, News-Feed und Grandmaster {#oberflaeche}

### Ein Deckbuilder mit mehr Filtern {#deck-builder}

Eine neue Werkzeugleiste mit mehr Filtern. Fährst du mit der Maus über eine Karte der Sammlung, siehst du ihre Schlüsselwörter. Das Deck zeigt jetzt klar, von welchen Karten du zwei Kopien hast und von welchen nur eine: Neue Spieler taten sich damit schwer.

### Ein News-Feed im Spiel {#news-feed}

Das Spiel hat einen eigenen News-Feed: Wenn du die Notes dort liest, schreibt das Team, hast du ihn schon gesehen.

### Weltrang auf dem VS-Bildschirm {#grandmaster}

Spieler in der Division Grandmaster, der höchsten, zeigen jetzt ihren Weltrang auf dem VS-Bildschirm.

### Grading der Karten: noch nicht {#grading}

Die Grafiken für das Grading der Karten sind nicht in diesem Update, und die Infos unter „How Grading Works“, die du finden wirst, sind Platzhalter: Das Team bittet dich, sie zu ignorieren. Feedback zum Öffnen der Packs wünscht es sich dagegen sehr, auf Discord.

## Tempo und Audio {#tempo-audio}

Animationen und die Pausen dazwischen sind schneller. „Daran muss noch viel gearbeitet werden“, schreibt das Team: Das Tempo bleibt eine seiner höchsten Prioritäten. Die Stimmen sind professioneller und besser abgemischt, und es gibt einen eigenen Regler für die Lautstärke der Stimmen.

## Kartenbalance: alles schon auf OriginsMeta {#balance}

Die zehn Balance-Änderungen in den Notes sind die, die die Hauptdemo mit dem Update vom 21. September und mit Patch 0.7 bekommen hat: Kartenseiten, [Deckbuilder](/de/deck-builder) und [MetaShifting](/de/metashifting) nutzen sie schon. Format: Mana · Kraft/Leben für Charaktere, nur Mana für Zauber.

| Karte | Vorher | Nachher | In der Demo seit |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21. September |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21. September |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21. September |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21. September |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21. September |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21. September |
| Roo | 2 · 2/3 | 2 · 2/4 | 21. September |
| Bagheera | 1 · 1/1 | 2 · 1/1 | Patch 0.7 |
| Spellbook | 3 | 4 | Patch 0.7 |
| Mind Palace | 2 | 3 | Patch 0.7 |

## Karten, die anders funktionieren {#kartenaenderungen}

### Neu in diesen Notes {#neue-aenderungen}

Fünf Änderungen stehen nicht in den Patchnotes der Demo vom 21. und 29. September:

- **En Passant** kann jetzt besetzte Felder anvisieren: Ist das Feld besetzt, bleibt dein Verbündeter, wo er ist, verursacht aber trotzdem seinen Schaden.
- **Betäubt** wird jetzt am Ende des Kampfes entfernt.
- **Todesberührung** zerstört keine Charaktere mit Schild mehr.
- **Boitata** sollte sich besser verhalten, vor allem wenn beide Spieler eine haben.
- **Reflection** hat einen etwas klareren Text; das Team gibt zu, dass die Karte vielleicht einen Eingriff braucht, um intuitiver zu werden.

Wir wissen noch nicht, ob sie schon in der Hauptdemo sind: Wir prüfen das im Spiel, bevor wir die Kartenseiten ändern.

### Schon in der Demo {#schon-in-der-demo}

- Don Quixote hat selbst Verteidiger und gibt es außerdem den Gegnern an seinem Ort (21. September: Die Patchnotes der Demo sagten nur, dass er Verteidiger erhält).
- Twister Toss kann einen Verbündeten auf ein besetztes Feld bewegen, und die beiden tauschen die Plätze (Patch 0.7).
- Van Helsing's Tools: Silver Bullet kann Barrieren treffen; Wooden Stake kann unverletzte Charaktere anvisieren, wirkt aber nur, wenn der Charakter beim Auflösen verletzt ist (21. September).
- Heroic Charge stapelt sich korrekt, wenn sie mehr als einmal gewirkt wird (21. September).
- Spellbook und Humpty können sich nicht mehr selbst als zufällige Karte erzeugen (Patch 0.7).
- Charaktere mit „Wähle eins“ können erneut wählen, wenn sie auf deine Hand zurückkehren, und behalten ihre Werte (21. September, für Frog Prince und Magic Carpet).
- Karten behalten ihre Werte im Friedhof: Eine gebuffte Mummy kommt mit ihrer ganzen Kraft zurück (21. September).

## Orte {#orte}

### Zwei neue, einer entfernt {#neue-orte}

- **Ballroom** (neu): Nach dem Kampf kehrt für beide Spieler ein zufälliger Charakter hier auf die Hand seines Besitzers zurück.
- **Tectonic Decay** (neu): Nach dem Kampf: Füge beiden Barrieren hier 1 Schaden zu.
- **Ashen Grove** (entfernt): Wenn du hier einen Charakter gespielt hast, hast du deine Karte ganz rechts abgeworfen und dann eine Karte gezogen.

Die Notes vergleichen den Playtest mit seinem vorherigen Build. Unsere [Seite der Orte](/de/locations), die Liste der Demo 2.0 mit Stand 21. September, hat Ballroom schon und Ashen Grove noch, während Tectonic Decay fehlt: Wir aktualisieren sie, sobald wir gesehen haben, welche Orte in der Hauptdemo sind.

### Seltenheit und ein Turnierpool {#turnierpool}

Die Seltenheit der Orte ist jetzt eine echte Seltenheit, gewöhnlich, selten, sehr selten oder ultraselten, die nicht mehr davon abhängt, wie viele Orte es im Spiel gibt: dieselbe Änderung, die die Demo mit Patch 0.7 bekommen hat.

Turniere haben jetzt einen eigenen Orte-Pool, sodass Orte in Wettbewerbe aufgenommen oder aus ihnen herausgenommen werden können, ohne die alltäglichen Matches zu verändern. Das erste Beispiel ist der [Crimson Cup](/de/news/crimson-cup-format-check-in): Einige der unberechenbarsten Orte sind nicht in seinem Pool. Laut Team steht die vollständige Liste in seiner letzten Ankündigung; wir berichten darüber, sobald wir sie gelesen haben.

**Update vom 7. Oktober:** Die Liste kam mit dem Steam-Post vom 5. Oktober: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum und Nostradamus' Call sind nicht im Pool des Crimson Cup ([unser Artikel](/de/news/crimson-cup-prizepool-qualifiers#orte)).

In diesem Build nutzen Raumkämpfe (Create/Join Room Battle) den Turnierpool: Mit ihnen kannst du mit den Orten des Crimson Cup üben.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Ob die fünf neuen Kartenänderungen, Tectonic Decay und das Entfernen von Ashen Grove schon in der Hauptdemo sind.
- Welche Orte nicht im Pool des Crimson Cup sind: am 5. Oktober beantwortet, siehe das Update oben.
- Der neue Text von Reflection.

## Was sich auf OriginsMeta ändert {#auf-der-website}

- Die Kartenwerte ändern sich nicht: Alle zehn Balance-Änderungen sind seit dem 21. und 29. September in der Kartendatenbank, im Deckbuilder und in MetaShifting.
- Die Seiten von En Passant, Boitata und Reflection behalten ihren aktuellen Text, bis wir den neuen im Spiel lesen.
- Die Seite [Orte](/de/locations) bleibt, wie sie ist, bis wir die neuen Orte in der Hauptdemo überprüft haben.

## Woher diese Notes stammen {#quellen}

Die Patchnotes, die das Team am 1. Oktober mit dem Playtest-Update auf dem offiziellen [Discord von Origins TCG](https://discord.gg/originstcg) gepostet hat; wie du dem Playtest beitrittst, erklärt der Discord-Kanal demo-v2-playtest-instructions. Am 1. Oktober stehen sie nicht auf Steam.`,
    faq: [
      { q: "Muss man im Playtest von Origins TCG die Missionen abschließen, um Ranked zu spielen?", a: "Nein. Seit dem Playtest-Update vom 1. Oktober 2026 sind Missionen reines PvE und dienen zum Freischalten von Decks, und das Ranked-Matchmaking teilt dir jedes Mal einen Gegner zu, wenn du Ranked spielst. In diesem Playtest können Deck-Missionen aber nicht im Ranked abgeschlossen werden: Spiel sie über den Missionen-Bildschirm." },
      { q: "Ändert das Playtest-Update die Kartenwerte für den Crimson Cup?", a: "Nein. Seine zehn Balance-Änderungen, etwa Dorothy für 4 Mana und Bagheera für 2, sind die, die die Hauptdemo schon am 21. und 29. September 2026 bekommen hat; Patch 0.7 ist der letzte Balance-Patch vor dem Turnier." },
      { q: "Wie kann man mit den Orten des Crimson Cup üben?", a: "Im Playtest-Build nutzen Raumkämpfe (Create/Join Room Battle) den Orte-Pool des Turniers, aus dem für den Crimson Cup einige der unberechenbarsten Orte entfernt wurden." },
    ],
  },
  "patch-0-7": {
    title: "Patch 0.7, der letzte Balance-Patch vor dem Crimson Cup: Rework von Twister Toss, drei Karten werden teurer",
    metaTitle: "Patchnotes 0.7 zu Origins TCG: Twister Toss und drei Nerfs",
    description:
      "Patch 0.7 von Origins TCG, der letzte Balance-Patch vor dem Crimson Cup: Rework von Twister Toss, Bagheera, Mind Palace und Spellbook kosten 1 Mana mehr.",
    summary:
      "Patch 0.7, das zweite Update der Demo, ist der letzte Balance-Patch vor dem Crimson Cup. Twister Toss bekommt ein Rework, Bagheera, Mind Palace und Spellbook kosten 1 Mana mehr, und Orte erscheinen jetzt nach Seltenheit. Außerdem behebt er Fehler bei Humpty, Spellbook, Heroic Charge und mehreren Verteidigern und bringt das Spiel auf 13 Sprachen.",
    highlights: [
      { label: "Der letzte Balance-Patch vor dem Crimson Cup", text: "erschienen am 29. September, drei Wochen vor der ersten Qualifikation", anchor: "crimson-cup" },
      { label: "Rework von Twister Toss", text: "bewegt einen Verbündeten auf ein beliebiges Feld und tauscht ihn mit der Karte, die schon dort ist", anchor: "twister-toss" },
      { label: "Drei Karten kosten 1 mehr", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "kosten" },
      { label: "Humpty und Spellbook geben sich nicht mehr selbst", anchor: "humpty-spellbook" },
      { label: "Volle Hand", text: "eine zurückgegebene Karte wird jetzt verbrannt, statt dass die Fähigkeit verpufft", anchor: "volle-hand" },
      { label: "Heroic Charge und Verteidiger korrigiert", anchor: "bugfixes" },
      { label: "Orte haben eine Seltenheit", text: "gewöhnlich, selten, sehr selten oder ultraselten", anchor: "orte" },
      { label: "13 Sprachen im Spiel", anchor: "sprachen" },
      { label: "Boogeyman", text: "die Notes sagen, dass er sich ändert, nicht wie", anchor: "boogeyman" },
    ],
    body: `## Der letzte Balance-Patch vor dem Crimson Cup {#crimson-cup}

„Das ist der FINALE Balance-Patch vor dem Turnier“, schreibt das Team. Der Crimson Cup beginnt am 20. Oktober mit der EMEA-Qualifikation, während des Steam Next Fest, und wird im Conquest mit drei Decks gespielt ([die Regeln](/de/news/crimson-cup-format-check-in)). Am 24. September hatte das Team gesagt, der letzte Balance-Patch komme zwei Wochen vor dem Festival: Er kam am 29. September, drei Wochen vorher. Wenn der Plan hält, sind das die Kosten und Werte, mit denen das Turnier gespielt wird.

Das offizielle Bild nennt ihn Steam Demo Update #2, Version 0.7: Es ist das zweite Update der Demo, nach [dem vom 21. September](/de/news/demo-patch-notes-0921).

## Alle Balance-Änderungen {#balance}

Format: Mana · Kraft/Leben für Charaktere, nur Mana für Zauber.

| Karte | Vorher | Nachher | Was sich ändert |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | kostet 1 mehr |
| Mind Palace | 2 | 3 | kostet 1 mehr |
| Spellbook | 3 | 4 | kostet 1 mehr; seine zufälligen Zauber können nicht mehr Spellbook sein |
| Twister Toss | 1 | 1 | Rework: bewegt einen Verbündeten auf ein beliebiges Feld und tauscht ihn mit der Karte, die schon dort ist |

Keine Legendäre ändert Kosten, Werte oder Fähigkeit: Dorothy bekommt nur eine klarere Erklärung ihrer Schlüsselwörter.

## Rework von Twister Toss {#twister-toss}

Bisher tat Twister Toss, ein Zauber für 1 Mana, eine einzige Sache: einen Verbündeten bewegen. Nach dem Rework bewegt er einen Verbündeten auf ein beliebiges Feld, und wenn dort schon eine andere Karte ist, tauschen die beiden die Plätze.

Er kann auch besetzte Felder anvisieren. Das Team nennt zwei Beispiele:

- einen Charakter wegbewegen und in derselben Runde gleich wieder zurück;
- deinen Charakter mit Trash for Treasure zerstören und sofort einen anderen Charakter auf sein Feld bewegen.

Auf OriginsMeta ist Twister Toss in drei veröffentlichten Decks, darunter die [Dorothy Combo](/de/guides/dorothy-combo-guide): Dorothy wächst jedes Mal, wenn sich ein Verbündeter bewegt. Die Patchnotes nennen den neuen Text der Karte nicht: Ihre Seite zeigt den alten, mit einem Hinweis, bis wir den neuen im Spiel lesen.

## Drei Karten kosten 1 mehr {#kosten}

Unter den 35 auf OriginsMeta veröffentlichten Decks (Stand: 00:13 Uhr CEST am 30. September) ist Mind Palace in 22 und Spellbook in 17: Es sind die beiden meistgespielten Karten der Website. Bagheera ist in 13. Die vollständige Rangliste findest du bei den [meistgespielten Karten](/de/tier-list/most-played).

### Bagheera: 2 Mana {#bagheera}

Bagheera bleibt eine 1/1, deren Fähigkeit Beim Aufdecken ihr auf einem mittleren Feld +2⚔️/+2❤️ gibt. Für 1 Mana war sie ab der ersten Runde eine 3/3; jetzt kommt sie frühestens in der zweiten Runde.

### Mind Palace: 3 Mana {#mind-palace}

Der Zauber, mit dem du 2 Karten ziehst, kostet jetzt 3.

### Spellbook: 4 Mana {#spellbook}

Für den Rest des Spiels fügt Spellbook zu Beginn jeder Runde einen zufälligen Zauber zu deiner Hand hinzu, der vor dem Kampf gespielt werden muss, sonst wird er abgeworfen. Es kostet jetzt 4, und seine zufälligen Zauber können nicht mehr Spellbook sein.

## Fähigkeitsänderungen und Korrekturen {#korrekturen}

### Humpty und Spellbook geben sich nicht mehr selbst {#humpty-spellbook}

Die zufälligen Karten, die sie dir geben, können nicht mehr sie selbst sein. Humptys Fähigkeit Bei Tod fügt deiner Hand eine zufällige Karte hinzu: Sie kann nicht mehr Humpty sein. Der zufällige Zauber, den Spellbook jede Runde hinzufügt, kann nicht mehr Spellbook sein.

### Volle Hand: Eine zurückgegebene Karte wird verbrannt {#volle-hand}

Wenn eine Karte auf eine Hand zurückkehrt, die schon voll ist, wird sie jetzt verbrannt (sie geht verloren), statt dass die Fähigkeit verpufft. Unter den Karten der Demo 2.0 betrifft das die, die eine Karte auf die Hand zurückbringen: White Queen und Stroke of Midnight, die EINEN BELIEBIGEN Charakter auf die Hand seines Besitzers zurückbringen, sowie Koschei und Dracula, die sich selbst zurückbringen.

### Freeze! und Dorothy: Schlüsselwörter erklärt {#schluesselwoerter}

Fährst du mit der Maus darüber, erklären sie jetzt die Schlüsselwörter, die sie verwenden, und sie tauchen in der Schlüsselwortsuche der Sammlung auf.

## Bugfixes {#bugfixes}

### Heroic Charge {#heroic-charge}

Heroic Charge gibt Verbündeten in dieser Runde +2⚔️ und Überrennen. Verliert ein Charakter, den sie verstärkt hat, seine Fähigkeiten, bleiben die +2⚔️ jetzt erhalten; Überrennen wird weiterhin entfernt.

### Mehr als ein Verteidiger {#verteidiger}

Wenn du mehr als einen Verteidiger an einem Ort hast und einer davon betäubt ist, verteidigt jetzt immer der andere an seiner Stelle.

## Orte haben jetzt eine Seltenheit {#orte}

Jeder Ort ist jetzt gewöhnlich, selten, sehr selten oder ultraselten, und die Seltenheit entscheidet, wie oft er auftaucht. Das Team sagt es so: Rechne in den meisten Matches mit den bekannten, und mit ein paar, die du nur „alle Jubeljahre“ siehst. Die Patchnotes sagen nicht, welcher Ort welche Seltenheit hat: Die Seite [Orte](/de/locations) listet alle Orte der Demo 2.0 mit ihren Effekten auf, und wir ergänzen die Seltenheit, sobald wir sie kennen.

## 13 Sprachen im Spiel {#sprachen}

Das Spiel unterstützt jetzt 13 Sprachen: Englisch, Französisch, Italienisch, Deutsch, Spanisch (Spanien), Japanisch, Koreanisch, Polnisch, Portugiesisch (Brasilien), Portugiesisch (Portugal), Russisch, vereinfachtes Chinesisch und Spanisch (Lateinamerika). Am 30. September führt die Steam-Seite dieselben 13 für die Oberfläche, mit vollständiger Sprachausgabe nur auf Englisch.

## Boogeyman {#boogeyman}

Die Zusammenfassung oben in den Patchnotes sagt, dass sich „Twister Toss, Heroic Charge und Boogeyman jetzt anders verhalten“, aber keine Zeile der Notes sagt, was sich bei Boogeyman ändert. Seine Fähigkeit Beim Aufdecken zerstört den Verbündeten an seinem Ort mit der niedrigsten Kraft, auch ihn selbst. Wir aktualisieren diesen Artikel, sobald das Team es erklärt.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Welcher Ort welche Seltenheit hat.
- Der neue Text von Twister Toss und ob ein Tausch für Dorothy als eine Bewegung oder als zwei zählt.
- Was sich bei Boogeyman ändert.

## Was sich auf OriginsMeta ändert {#auf-der-website}

- Die Seiten von Bagheera, Mind Palace und Spellbook zeigen die neuen Kosten, und jede Karte des Patches hat die Änderung in ihrem Balance-Verlauf, mit einem Link zum Steam-Post.
- Die Seite von Twister Toss zeigt noch den alten Text, mit einem Hinweis, bis wir den neuen im Spiel lesen.
- [MetaShifting](/de/metashifting) führt Patch 0.7 ganz oben, und der [Deckbuilder](/de/deck-builder) nutzt die neuen Kosten: Bagheera ist jetzt ein 2-Drop in der Manakurve.
- Veröffentlichte Decks behalten ihre Liste, mit dem Erstellungsdatum und dem Patch, der an diesem Tag galt; ihre Manakurve nutzt die neuen Kosten. Die Deck-Guides mit diesen Karten sind aktualisiert.

## Woher diese Notes stammen {#quellen}

- Der offizielle Steam-Post vom 29. September, „A small demo update is about to land!“, veröffentlicht, bevor die Server für den Patch heruntergefahren wurden.
- Die Nummer 0.7 und der Name Steam Demo Update #2 stammen aus dem offiziellen Bild des Updates, dem Titelbild dieses Artikels. Einige Creator hatten das Update vom 21. September „Patch 0.7“ genannt: Auf dieser Website bleibt es „Demo · 21. Sept.“.`,
    faq: [
      { q: "Was hat sich in Patch 0.7 von Origins TCG geändert?", a: "Twister Toss bekommt ein Rework; Bagheera (1 → 2 Mana), Mind Palace (2 → 3) und Spellbook (3 → 4) kosten 1 mehr; Orte haben jetzt eine Seltenheit, die entscheidet, wie oft sie auftauchen; Humpty und Spellbook können sich nicht mehr selbst geben; eine Karte, die auf eine volle Hand zurückkehrt, wird jetzt verbrannt; Heroic Charge und mehrere Verteidiger sind korrigiert; das Spiel unterstützt 13 Sprachen." },
      { q: "Ist Patch 0.7 der letzte Balance-Patch vor dem Crimson Cup?", a: "Ja: Das Team nennt ihn den finalen Balance-Patch vor dem Turnier. Er ist am 29. September 2026 erschienen; der Crimson Cup beginnt am 20. Oktober mit der EMEA-Qualifikation, während des Steam Next Fest." },
      { q: "Wie funktioniert Twister Toss nach Patch 0.7?", a: "Er kostet weiterhin 1 Mana. Er bewegt einen Verbündeten auf ein beliebiges Feld, und wenn dort schon eine andere Karte ist, tauschen die beiden die Plätze. Er kann auch besetzte Felder anvisieren: Du kannst einen Charakter in derselben Runde weg- und wieder zurückbewegen oder einen mit Trash for Treasure zerstören und einen anderen auf sein Feld bewegen." },
    ],
  },
  "upgrade-meta-0929": {
    title: "Upgrade Meta: Tools für Creator, Folgen und Benachrichtigungen, Community-Guides und Comics",
    metaTitle: "Upgrade Meta: Tools für Creator von Origins TCG",
    description:
      "Neu auf OriginsMeta: Profile und Verzeichnis der Creator, Stream-Tools mit !deck und OBS-Overlay, Folgen, Community-Guides und Comics. Werde Creator.",
    summary:
      "Diese Woche hat OriginsMeta einen ganzen Bereich für alle bekommen, die Inhalte über Origins TCG machen: Schaufenster-Profile, das Verzeichnis der Creator, Tools für Streams, Deck-Statistiken, Community-Guides und Comics, die direkt auf der Website veröffentlicht werden. Du kannst jetzt deinen Lieblingsspielern folgen und wirst benachrichtigt, wenn sie etwas veröffentlichen oder live gehen. Du willst Creator werden? Schreib Pierluigi auf unserem Discord.",
    highlights: [
      { label: "Creator-Profile", text: "eine Schaufenster-Seite, der Kurzlink originsmeta.com/@name und das Verzeichnis der Creator", anchor: "profile" },
      { label: "Stream-Tools", text: "der Chat-Befehl !deck, ein OBS-Overlay, das Deckbild und das LIVE-Badge", anchor: "streams" },
      { label: "Veröffentliche mehr", text: "Videos und Links bei Decks, Deck-Statistiken, Artwork der Legendären, Guides, Comics und Turniere", anchor: "veroeffentliche" },
      { label: "Werde Creator", text: "schreib Pierluigi auf unserem Discord", anchor: "werde-creator" },
      { label: "Folgen und Benachrichtigungen", text: "Decks, Guides, Comics und Streams der Profile, denen du folgst", anchor: "folgen" },
      { label: "Rollen und Erfolge", text: "Staff, Creator, Autor, Pro und Community, Erfolge auf jedem Profil, Nachrichten an den Staff", anchor: "rollen" },
      { label: "Decks, Tier-Lists und Guides", text: "die besten Decks gerade jetzt, signierte Tier-Lists, drei neue Guides und das Datum des Kickstarters", anchor: "decks-guides" },
    ],
    body: `## Creator-Profile {#profile}

Wenn du Inhalte über Origins TCG machst (Streams, Videos, Guides, Decks), hat OriginsMeta jetzt einen Platz für dich. Profile mit der Rolle Creator, Autor, Pro oder Staff bekommen eine **Schaufenster-Seite**: ein Titelbild (einer von 8 Hintergründen oder dein eigenes Bild), ein größeres Foto, eine Akzentfarbe, einen kurzen Slogan, deine Lieblings-Legendäre, ein hervorgehobenes Deck und ein hervorgehobenes Video, deinen Stream-Plan (in der Zeitzone jedes Besuchers angezeigt), dazu deine Bio, deine Kanäle und die Sprachen, in denen du Inhalte machst. Alle können ein Profilfoto hochladen.

Jedes Profil hat außerdem einen **Kurzlink** zum Teilen: originsmeta.com/@deinname. Und die Seite [Creator und Autoren](/de/creators) versammelt alle mit einer dieser Rollen, die eine Bio oder einen Kanal eingetragen haben, mit Filtern nach Rolle, Sprache und Plattform.

## Stream-Tools {#streams}

- **Der Chat-Befehl \`!deck\`**: Füge ihn zu Nightbot, StreamElements oder Fossabot hinzu, und dein Chat bekommt dein zuletzt veröffentlichtes Deck, mit seiner Legendären, dem Link und dem Spielcode.
- **Ein OBS-Overlay**, das dein Deck im Stream zeigt, vertikal oder horizontal, und sich von selbst aktualisiert, wenn du ein neues veröffentlichst.
- **Das Deckbild**, bereit für Social-Media-Posts, Thumbnails in 16:9 und Stories in 9:16.
- **Das LIVE-Badge**: Wenn du Origins TCG auf Twitch streamst, erscheint es neben deinem Namen bei Decks, auf Profilen und im Verzeichnis. Die Seite [Live](/de/live) zeigt, wer gerade streamt, und der Kalenderstreifen oben sagt „Jetzt live“.

Alles findest du unter „Für Streamer“ auf der Seite jedes deiner Decks.

## Veröffentliche mehr {#veroeffentliche}

- **Videos und Links bei Decks**: bis zu 3 Videos von YouTube oder Twitch und 5 Links bei jedem Deck, mit einem Player, der erst beim Klick lädt.
- **Deck-Statistiken**: In deinem Konto siehst du für jedes deiner Decks Aufrufe, Kopien des Spielcodes, Klicks auf Links und gestartete Videos, über 7 Tage, 30 Tage und insgesamt. Nur du und der Staff sehen sie.
- **Artwork der Legendären**: Creator können ihr eigenes Artwork der Legendären auf ihre Decks setzen. Die offizielle Karte bleibt auf der Kartenseite.
- **Community-Guides**: Autoren, Creator, Pro-Spieler und Staff veröffentlichen Guides direkt auf der Website, automatisch in die anderen beiden Sprachen übersetzt. Alle anderen können uns weiterhin [einen Guide schicken](/de/guides/submit).
- **Comics**: Creator veröffentlichen ihre Comics zwischen den News, mit automatisch übersetztem Text.
- **Turniere**: Creator, Pro-Spieler und Staff können ihre öffentlichen Turniere in den Kalender stellen, mit eigenem Titelbild.

## Werde Creator {#werde-creator}

Die Rolle Creator vergibt der Staff von OriginsMeta. Wenn du Inhalte über Origins TCG machst und Creator werden willst, **schreib Pierluigi auf [unserem Discord](https://discord.gg/RAG7nnrNGP)**.

## Folgen und Benachrichtigungen {#folgen}

Mit einem Konto kannst du den Profilen mit der Rolle Creator, Autor, Pro oder Staff **folgen**. Wenn sie ein Deck, einen Guide oder einen Comic veröffentlichen oder auf Twitch live gehen, bekommst du eine Benachrichtigung im Briefumschlag oben auf der Website. Die Profile, denen du folgst, findest du in [deinem Konto](/de/account). Die Benachrichtigungen bleiben auf der Website: keine E-Mails.

## Rollen und Erfolge {#rollen}

- **Fünf Rollen**, mit ihrem Tag neben dem Namen: Staff, Creator, Autor, Pro und Community.
- **Erfolge** auf jedem Profil, etwa Erstes Deck, Publikumsliebling, Deck des Monats und Turnier gewonnen.
- **Nachrichten an den Staff**: Aus deinem Konto kannst du uns schreiben und unsere Antworten lesen, Feedback eingeschlossen.

## Decks, Tier-Lists und Guides {#decks-guides}

- In [Decks](/de/decks) die besten Decks von Origins TCG gerade jetzt, nach den Bewertungen der Community gereiht.
- In der [Tier-List der Community](/de/tier-list/community) die Tier-Lists, die Staff, Creator, Autoren und Pro-Spieler signiert haben.
- Tier-Lists, Karten, Decks und der Deckbuilder beginnen jetzt mit dem Inhalt, mit kompakteren Titeln.
- Drei neue Guides: [die 11 Legendären](/de/guides/origins-tcg-legendaries), [Ranked](/de/guides/origins-tcg-ranked) und [Conquest](/de/guides/origins-tcg-conquest).
- Der [Kickstarter-Guide](/de/guides/origins-tcg-kickstarter) hat das vom CEO von Koin Games bestätigte Datum: 27. Oktober.

## Mach mit {#mach-mit}

[Registrier dich](/de/login) kostenlos mit Discord oder deiner E-Mail, veröffentliche deine Decks und folge den Spielern, die dir gefallen. Und [komm auf unseren Discord](https://discord.gg/RAG7nnrNGP): Alles, was auf der Website online geht, wird dort gepostet.`,
    faq: [
      { q: "Wie werde ich Creator auf OriginsMeta?", a: "Die Rolle Creator vergibt der Staff: Wenn du Inhalte über Origins TCG machst, schreib Pierluigi auf dem Discord von OriginsMeta (discord.gg/RAG7nnrNGP)." },
      { q: "Wie zeige ich mein Deck im Stream?", a: "Öffne die Seite deines Decks und geh zu „Für Streamer“: Dort findest du den Chat-Befehl !deck für Nightbot, StreamElements oder Fossabot, das OBS-Overlay und das Deckbild." },
      { q: "Wem kann ich auf OriginsMeta folgen?", a: "Mit einem Konto kannst du den Profilen mit der Rolle Creator, Autor, Pro oder Staff folgen und bekommst auf der Website eine Benachrichtigung, wenn sie ein Deck, einen Guide oder einen Comic veröffentlichen oder auf Twitch live gehen." },
    ],
  },
  "upgrade-meta-0925": {
    title: "Upgrade Meta: OriginsMeta spricht Spanisch, jede Karte in drei Sprachen und was als Nächstes kommt",
    metaTitle: "Upgrade Meta: OriginsMeta für Origins TCG auf Spanisch",
    description:
      "OriginsMeta gibt es jetzt auch auf Spanisch, und jede Karte der Demo 2.0 hat den offiziellen Spieltext in drei Sprachen. Dazu: was wir als Nächstes bauen.",
    summary:
      "OriginsMeta spricht jetzt auch Spanisch, und jede Karte der Demo 2.0 zeigt den offiziellen Text des Spiels auf Englisch, Italienisch und Spanisch. Außerdem arbeiten wir an einem Overlay, einem Spiel-Tool für alle Spieler, und an Wegen, das zu belohnen, was ihr erschafft: Die erste Idee ist ein Deck der Woche, gewählt durch eure Bewertungen. Danke für eure Unterstützung: Am Ende des Artikels findest du alles, was du zum Mitmachen brauchst.",
    highlights: [
      { label: "Spanisch ist da", text: "die ganze Website, mit Guides und News, und die Guides der Community-Decks automatisch übersetzt", anchor: "spanisch" },
      { label: "Jede Karte, drei Sprachen", text: "der offizielle italienische und spanische Text des Spiels, geprüft an allen 122 Karten der Demo 2.0", anchor: "karten" },
      { label: "Ein Overlay für alle", text: "ein Spiel-Tool für alle Spieler, in Arbeit: Wir zeigen es, wenn es fertig ist", anchor: "overlay" },
      { label: "Deck der Woche", text: "gewählt durch eure Bewertungen: unsere erste Idee, um zu belohnen, was ihr erschafft", anchor: "deck-der-woche" },
      { label: "Danke", text: "an alle, die sich registriert, Decks veröffentlicht, bewertet und uns geschrieben haben", anchor: "danke" },
      { label: "Mach mit", text: "registrier dich, bau ein Deck, erstelle deine Tier-List, komm auf unseren Discord", anchor: "mach-mit" },
    ],
    body: `## Spanisch ist da {#spanisch}

Seit dem 25. September 2026 gibt es OriginsMeta auch auf Spanisch: Karten, Decks, Guides, News, Tier-Lists, der Deckbuilder und Turniere. Die Sprache wechselst du mit EN · IT · ES oben auf jeder Seite (auf dem Handy im Menü). Wir schreiben neutrales Spanisch, für Spieler in Spanien und Lateinamerika, und die Kartennamen bleiben auf Englisch, wie im Spiel.

Auch die Community-Decks sprechen jede Sprache: Der Autor schreibt den Guide in seiner eigenen Sprache, die Website übersetzt ihn in die anderen beiden, sagt das auf der Seite und verlinkt das Original. Ein auf Italienisch veröffentlichtes Deck kann jetzt auch auf Englisch und Spanisch gelesen werden.

## Jede Karte, drei Sprachen {#karten}

Am 25. September haben wir die Demo auf Spanisch und auf Italienisch geöffnet und die 122 Karten der Sammlung eine nach der anderen gelesen. Die italienischen und spanischen Texte, die du jetzt in der [Kartenliste](/de/cards) findest, sind die offiziellen des Spiels: 101 spanische und 88 italienische Texte wichen von unseren Übersetzungen ab und wurden ersetzt.

Auch die Schlüsselwörter verwenden die offiziellen Begriffe des Spiels: On Reveal heißt auf Italienisch „Alla rivelazione“ und auf Spanisch „Al revelar“. Auf den italienischen und spanischen Seiten findest du dieselben Begriffe in den Schlüsselwort-Tags auf der Seite jeder Karte, in den Guides und in den News. Erschaffene und entfernte Karten erscheinen nicht in der Sammlung des Spiels, und die [Orte](/de/locations) haben wir noch nicht im Spiel überprüft: Ihr italienischer und spanischer Text ist von uns, geschrieben mit dem Glossar des Spiels.

## Ein Overlay für alle {#overlay}

Wir arbeiten an einem Overlay: einem Spiel-Tool für alle Spieler von Origins TCG, nicht nur für die, die streamen. Wir zeigen es lieber, als es zu beschreiben: Wir erzählen euch mehr, sobald wir etwas haben, das sich sehen lassen kann.

## Deck der Woche {#deck-der-woche}

Wir wollen die belohnen, die etwas erschaffen, und euren Decks, Guides und Tier-Lists mehr Sichtbarkeit geben. Die erste Idee ist ein Deck der Woche, gewählt durch eure Sternebewertungen. Bis dahin gilt: Wenn du ein Community-Deck ausprobierst, bewerte es. Die bestbewerteten Decks erscheinen schon in der [Tier-List](/de/tier-list).

## Danke {#danke}

OriginsMeta ist am 15. September online gegangen. In zehn Tagen habt ihr euch registriert, Decks veröffentlicht, bewertet und uns mit Ideen und Korrekturen geschrieben, und mehrere der jüngsten Änderungen haben mit euren Nachrichten angefangen. Danke: Diese Website wächst mit euch.

## Mach mit {#mach-mit}

- [Registrier dich](/de/login): kostenlos, mit Discord oder mit deiner E-Mail, ohne Passwort. Mit einem Konto kannst du deine Decks veröffentlichen, bewerten und deine Tier-Lists speichern.
- [Bau ein Deck](/de/deck-builder): kostenlos, auch ohne Konto. Kopiere den Spielcode oder veröffentliche das Deck mit einem Konto auf der Website, mit deinem Guide.
- [Erstelle deine Tier-List](/de/tier-list/create) und sieh dir die [Tier-List der Community](/de/tier-list/community) an, die zu einer echten Rangliste wird, sobald 5 Listen gespeichert sind.
- [Komm auf unseren Discord](https://discord.gg/RAG7nnrNGP): Neue Artikel und Guides landen dort, sobald sie online gehen. Der [offizielle Discord von Origins TCG](https://discord.gg/originstcg) ist der Server von Koin Games, für Ankündigungen und Turnieranmeldungen.`,
    faq: [
      { q: "Gibt es OriginsMeta auf Spanisch?", a: "Ja, seit dem 25. September 2026: die ganze Website, mit Guides, News, Tier-Lists und dem Deckbuilder. Die Sprache wechselst du mit EN · IT · ES oben auf der Seite; die Guides der Community-Decks werden automatisch übersetzt." },
      { q: "Sind die italienischen und spanischen Kartentexte offiziell?", a: "Ja, für die 122 Karten der Demo 2.0: Wir haben sie am 25. September 2026 im Spiel gelesen. Erschaffene und entfernte Karten sind nicht in der Sammlung des Spiels, und die Orte wurden noch nicht im Spiel überprüft, deshalb ist ihr italienischer und spanischer Text unsere Übersetzung mit dem Glossar des Spiels." },
      { q: "Wie veröffentliche ich ein Deck auf OriginsMeta?", a: "Bau es im Deckbuilder, melde dich mit Discord oder deiner E-Mail an und drück auf „Auf der Website veröffentlichen“: Ein kurzer Spielplan ist Pflicht, der Rest des Guides ist optional." },
    ],
  },
  "crimson-cup-format-check-in": {
    title: "Regeln der Crimson Cup: Conquest mit drei Decks, geheime Decklisten bis zur Top 4, Check-in ist Pflicht",
    metaTitle: "Origins TCG Crimson Cup: Regeln, Termine, Preise, Check-in",
    description:
      "Crimson Cup von Origins TCG: Conquest mit 3 Decks, 8 einzigartige Karten zwischen den Decks, Qualifikationen vom 19.–22. Oktober, Preise für 10.000 Dollar.",
    summary:
      "Nach der Umfrage unter den Spielern hat Koin Games die Regeln der Crimson Cup festgelegt: Conquest mit drei Decks, mindestens 8 einzigartige Karten zwischen jedem Paar von Decks, geheime Decklisten bis zur Top 4 und kein Ban in Best-of-Five-Matches. Der Check-in öffnet zwei Stunden vor jeder Qualifikation und schließt fünf Minuten vor dem Start, zusammen mit der Deckabgabe: Wer ihn verpasst, spielt nicht. Das Turnier läuft auf der Demo, nicht auf dem Playtest.",
    highlights: [
      { label: "Conquest mit drei Decks", text: "mindestens 8 einzigartige Karten zwischen jedem Paar von Decks", anchor: "format" },
      { label: "Decklisten geheim bis zur Top 4", text: "beim Ban siehst du nur die Legendäre", anchor: "decklisten" },
      { label: "Best-of-Five ohne Ban", text: "du musst mit allen drei Decks gewinnen", anchor: "best-of-five" },
      { label: "Check-in", text: "öffnet zwei Stunden vorher und schließt fünf Minuten vor dem Start, mit der Deckabgabe", anchor: "check-in" },
      { label: "Trainiere auf der Demo", text: "der Playtest bekommt Updates, die das Turnier nicht haben wird", anchor: "demo-playtest" },
      { label: "Letzter Balance-Patch", text: "erschienen am 29. September: Patch 0.7", anchor: "balancing" },
      { label: "Preise", text: "10.000 Dollar; die vollständige Aufteilung kam am 5. Oktober", anchor: "preise" },
    ],
    body: `## Conquest mit drei Decks {#format}

Vor ein paar Tagen hat Koin Games eine Umfrage unter den Spielern gemacht, und diese Ankündigung klärt das Format: Die Crimson Cup wird im Conquest-Format mit drei Decks gespielt. Zwischen jedem Paar von Decks müssen mindestens 8 einzigartige Karten liegen.

Jedes Deck hat 13 verschiedene Karten: die Legendäre und zwölf Basiskarten, deren zweite Kopie das Spiel selbst hinzufügt. Wir lesen das so, dass zwei Decks höchstens 5 Karten gemeinsam haben dürfen, aber die Ankündigung erklärt nicht, wie die einzigartigen Karten gezählt werden. Bei Big Bob's Playtest Battle im August lautete die Regel: mindestens neun Karten Unterschied.

## Decklisten geheim bis zur Top 4 {#decklisten}

Die Decks bleiben bis zur Top 4 privat. Wenn du eines der Decks deines Gegners bannst, siehst du nur seine Legendäre.

## Best-of-Five: kein Ban, du gewinnst mit allen drei {#best-of-five}

Best-of-Five-Matches haben keinen Ban: Um das Match zu holen, musst du mit allen drei Decks gewinnen. In der ersten Ankündigung vom 9. September war Best-of-Five dem großen Finale vorbehalten, davor wurden Best-of-Three-Matches gespielt.

## Check-in: sei pünktlich {#check-in}

Der geplante Ablauf jeder Qualifikation:

1. Der Check-in öffnet zwei Stunden vor Turnierbeginn.
2. Check-in und Deckabgabe schließen fünf Minuten vor dem offiziellen Start.
3. In einem kurzen Zeitfenster können Spieler auf der Warteliste die freien Plätze übernehmen, nach der Reihenfolge ihres Eintreffens.
4. Die Vorstellung des Turniers.
5. Die Matches beginnen, sobald die Vorstellung vorbei ist.

Ohne Check-in kannst du nicht spielen. Für die EMEA-Qualifikation am 20. Oktober, die um 19:00 Uhr CEST beginnt, heißt das: Check-in zwischen 17:00 und 18:55 Uhr CEST. Die AMER-Qualifikation ist am 21., die APAC-Qualifikation am 22.: Uhrzeiten und Plätze stehen in unserem [Guide zum Steam Next Fest](/de/guides/steam-next-fest-2026).

**Update vom 7. Oktober:** Es gibt jetzt fünf Qualifikationen. Am 5. Oktober hat Koin AMER am 19. Oktober um 19:00 Uhr EST und EMEA am 22. Oktober um 19:00 Uhr CEST hinzugefügt, und die neue Kalendergrafik legt die AMER-Qualifikation vom 21. auf 21:00 Uhr EST, mit 32 statt 64 Spielern, die weiterkommen, und 96 statt 128 Wildcards. Außerdem sind sieben Orte aus dem Turnierpool genommen. Alles steht in [unserem Artikel über das Preisgeld und die neuen Qualifikationen](/de/news/crimson-cup-prizepool-qualifiers).

## Demo oder Playtest: wo du trainierst {#demo-playtest}

- Die **Demo** hat die Kartenliste des Turniers. Dort wird der Ranked-Modus zum Steam Next Fest freigeschaltet, mit neuen Ranked-Belohnungen. Das ist der Build zum Trainieren.
- Der **Playtest** entspricht heute der Demo, mit bereits aktivem Ranked-Modus und ein paar kleinen Änderungen. Er bekommt weitere Updates und wird sich vom Turnier-Build unterscheiden.

Du kannst beide spielen, aber das Turnier findet auf der Hauptdemo statt, und nur mit den Karten, die es dort gibt.

## Der letzte Balance-Patch {#balancing}

Der letzte Balance-Patch kommt zwei Wochen vor dem Steam Next Fest, das am 19. Oktober beginnt. Wir verfolgen ihn Karte für Karte in [MetaShifting](/de/metashifting).

**Update vom 30. September:** Der letzte Balance-Patch kam früher als angekündigt, am 29. September. Es ist [Patch 0.7](/de/news/patch-0-7), den das Team den letzten Balance-Patch vor dem Turnier nennt: Twister Toss bekommt einen Rework, und Bagheera, Mind Palace und Spellbook kosten 1 mehr.

## Preise {#preise}

Der offizielle Post auf X spricht von einem Preisgeld von 10.000 Dollar, und die Ankündigung auf Discord sagt, dass die genaue Aufteilung nächste Woche bekannt gegeben wird. Im September hatte Koin Preise im Gesamtwert von 10.000 Dollar beschrieben: eine exklusive 1/1-Promokarte, weitere Promokarten, digitale Packs, Alpha-Booster-Displays und -Cases sowie Geldpreise ([unser Artikel](/de/news/biggest-tournament-ever)).

**Update vom 7. Oktober:** Die Aufteilung kam am 5. Oktober. Der Sieger bekommt eine 1/1-Promokarte von Dracula, zwei Cases mit Booster-Displays und 1.500 Dollar in bar; Promokarten gibt es bis zur Top 32, Packs bis zur Top 256. Die vollständige Tabelle steht in [unserem Artikel über das Preisgeld](/de/news/crimson-cup-prizepool-qualifiers#preise).

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Die genaue Aufteilung des Preisgelds, für nächste Woche erwartet: Sie kam am 5. Oktober, siehe das Update oben.
- Wie die einzigartigen Karten zwischen zwei Decks gezählt werden.

## Woher das kommt {#quellen}

- Die „Big Crimson Cup announcement“, am 24. September im offiziellen Discord von Origins TCG gepostet, die auch auf ein neues Video mit den Details des Turniers verweist.
- Der [Post von Origins TCG auf X](https://x.com/origins_tcg/status/2103111100321677670) vom selben Tag, mit dem Preisgeld von 10.000 Dollar.`,
    faq: [
      {
        q: "Wie viele einzigartige Karten brauchen die Decks der Crimson Cup?",
        a: "Mindestens 8 einzigartige Karten zwischen jedem Paar von Decks, sagt die Ankündigung vom 24. September. Jedes Deck hat 13 verschiedene Karten: Wir lesen das so, dass zwei Decks höchstens 5 davon gemeinsam haben dürfen.",
      },
      {
        q: "Wann ist der Check-in der Crimson Cup?",
        a: "Er öffnet zwei Stunden vor jeder Qualifikation und schließt fünf Minuten vor dem Start, zusammen mit der Deckabgabe. Wer ihn verpasst, kann nicht spielen: Für die EMEA-Qualifikation um 19:00 Uhr CEST läuft der Check-in von 17:00 bis 18:55 Uhr CEST.",
      },
      {
        q: "Auf welchem Build wird die Crimson Cup gespielt?",
        a: "Auf der Hauptdemo, nur mit den Karten, die es dort gibt. Der Playtest bekommt weitere Updates und wird sich vom Turnier-Build unterscheiden.",
      },
    ],
  },
  "upgrade-meta-0924": {
    title: "Upgrade Meta: Suche im Kartentext, eine neu gebaute Tier-List, Orte und unser eigener Discord",
    metaTitle: "Upgrade Meta: Neues auf OriginsMeta für Origins TCG",
    description:
      "Drei Tage Updates auf OriginsMeta: Suche im Kartentext, eine neu gebaute Tier-List, Orte, öffentliche Profile und unser eigener Discord. Danke, coachcronos.",
    summary:
      "OriginsMeta hat sich in drei Tagen stark verändert: Der Deck builder durchsucht jetzt den Kartentext, die Tier-List zeigt drei Quellen nebeneinander, und Orte, öffentliche Profile und unser eigener Discord-Server sind da. Danke an coachcronos für den Stream und an alle, die uns geschrieben haben: Viele dieser Änderungen haben als eure Wünsche angefangen.",
    highlights: [
      { label: "Suche im Kartentext", text: "im Deck builder und in der Kartendatenbank: Tippe Reveal, und es bleiben die Karten mit Beim Aufdecken", anchor: "suche" },
      { label: "Eine neu gebaute Tier-List", text: "OriginsMeta, Community und Meistgespielt nebeneinander, MetaShifting auf eigener Seite", anchor: "tier-list" },
      { label: "Orte", text: "die 44 Orte der Demo 2.0, durchsuchbar und filterbar", anchor: "orte" },
      { label: "Decks, Guides und Profile", text: "Filter nach Autorentyp, Datum und Patch bei jedem Deck, öffentliche Profile, vier neue Guides", anchor: "decks" },
      { label: "Im Spiel geprüfte Karten", text: "alle 122 Karten einzeln verglichen, dazu der Patch vom 21. September", anchor: "karten" },
      { label: "Eine Website, die sich leichter liest", text: "neues Logo, Karten, die sich umdrehen, ein Kalender, der läuft", anchor: "optik" },
      { label: "Unser eigener Discord", text: "Logo im Menü, neue Artikel und Guides werden automatisch gepostet", anchor: "discord" },
      { label: "Danke, coachcronos", text: "für den Stream vom 23. September", anchor: "danke-coachcronos" },
      { label: "Danke, dass ihr uns schreibt", text: "und ab heute kannst du im Feedback-Fenster deinen Namen hinterlassen", anchor: "danke-feedback" },
    ],
    body: `## Suche im Kartentext {#suche}

Die erste Nachricht, die uns über das Feedback-Fenster erreicht hat, wünschte sich etwas ganz Konkretes: Beim Bau eines Decks um Mulan wollte die Person, die uns geschrieben hat, nur die Karten mit Beim Aufdecken sehen, indem sie „Reveal“ in die Suche tippt, so wie im Spiel. Jetzt geht das.

- Die Suche im [Deck builder](/de/deck-builder) durchsucht Name, Saga und den **Kartentext**. Tippe „Reveal“, und es bleiben die Karten mit Beim Aufdecken: In der aktuellen Demo sind es 33.
- Groß- und Kleinschreibung und Akzente spielen keine Rolle, und bei mehreren Wörtern bekommst du die Karten, die alle davon enthalten, zum Beispiel „reveal damage“.
- Unter den Filtern siehst du, wie viele Karten übrig sind, mit „Filter zurücksetzen“; wenn nichts passt, sagt der Builder das, statt eine leere Liste zu zeigen.
- Dieselbe Suche funktioniert in der [Kartendatenbank](/de/cards) und im Feld „Karte suchen“ oben auf jeder Seite. Auf der italienischen Website liest sie auch den englischen Text des Spiels, also funktioniert dort auch „draw“.

## Eine neu gebaute Tier-List {#tier-list}

Die [Tier-List](/de/tier-list) zeigt jetzt drei Quellen nebeneinander, jede mit eigener Seite:

- **OriginsMeta**: Die Tiers kommen nur aus Turnierergebnissen, also erst nach der Crimson Cup; bis dahin zeigt die Seite die am besten bewerteten Decks und die Karten, die in den meisten Decks stecken.
- **[Community](/de/tier-list/community)**: der Durchschnitt der Tier-Lists, die Mitglieder gespeichert haben, ab 5 Listen ein echtes Ranking.
- **[Meistgespielt](/de/tier-list/most-played)**: in wie vielen veröffentlichten Decks jede Karte vorkommt. Das ist Beliebtheit, keine Win-Rate.

Der Balance-Tracker hat eine eigene Seite, [MetaShifting](/de/metashifting), mit dem neuesten Patch zuerst. Im [Tier-List-Maker](/de/tier-list/create) lassen sich die Karten jetzt wirklich ziehen; auf dem Handy gibt es die Leiste S A B C D, und mit einem Konto kannst du deine Liste speichern, die dann in der Community-Tier-List zählt.

## Orte {#orte}

Eine neue Seite [Orte](/de/locations): die 44 Orte der Demo 2.0, mit Suche nach Name und Effekt, Filtern nach Effektfamilie (Schaden, Mana, Bewegung und mehr) und den genannten Karten, die auf ihre Seiten verlinken. Wie sie ein Match verändern, liest du im [Guide zu den Orten](/de/guides/origins-tcg-locations).

## Decks, Guides und Profile {#decks}

- In [Decks](/de/decks) sind die Filter immer sichtbar, mit einem neuen Filter für den **Autorentyp**: Staff, Pro, Influencer, Community. Die Decks sind nach Datum sortiert, das neueste zuerst, und jedes zeigt sein Erstellungsdatum und die Spielversion, auf der es gebaut wurde.
- Jedes Mitglied hat eine **öffentliche Seite** mit seinen veröffentlichten Decks und gespeicherten Tier-Lists.
- Der Deck builder hat vier Tasten: Auf der Website veröffentlichen, Privat speichern (das Deck bleibt in deinem Profil und nur du siehst es), Teilen, Deck leeren. Das Deck, an dem du baust, speichert sich selbst in deinem Browser.
- Vier neue Guides zu den Decks, die Davdas veröffentlicht hat: [On Reveal Mid Range](/de/guides/on-reveal-midrange-guide) mit Mulan, [King of Value Trade](/de/guides/king-of-value-trade-guide), [Dorothy Combo](/de/guides/dorothy-combo-guide) und [The Trick-or-Treat Legion](/de/guides/trick-or-treat-legion-guide).
- Du hast selbst einen Guide geschrieben? [Schick ihn uns](/de/guides/submit): Wir lesen ihn und veröffentlichen ihn mit deiner Erlaubnis unter deinem Namen.

**Update vom 27. September:** Der Filter heißt jetzt **Rolle**, und die Rollen sind Staff, Creator, Autor, Pro und Community: Den Tag Influencer gibt es nicht mehr. Wer ein Deck veröffentlicht hat, steht unter **Veröffentlicht von**.

## Im Spiel geprüfte Karten {#karten}

Am 22. September haben wir alle 122 Karten der Demo 2.0 einzeln mit der Sammlung im Spiel verglichen: Kosten, Werte und Gesinnungen stimmten alle, 16 Texte nicht, und jetzt sind es die des Spiels. Die Datenbank enthält außerdem den [Demo-Patch vom 21. September](/de/news/demo-patch-notes-0921) mit den 14 Karten, die er ändert, und oben im Deck builder steht, auf welchem Spielstand die Karten sind. Heute haben wir außerdem die Schlüsselwörter von Queen of Hearts und Bagheera korrigiert, die hinter ihrem Text zurückgeblieben waren.

## Eine Website, die sich leichter liest {#optik}

Das Logo ist jetzt ein handgezeichneter Schriftzug. Auf den Deckseiten werden die Karten ganz gezeigt und drehen sich mit der Maus um, damit du ihren Text siehst; die Kartenvorschau zeigt nur noch das Nötige (Name, Typ, Gesinnung und Effekt). Der Kalender unter dem Slider läuft jetzt wirklich, langsam, und der Kopf der Startseite ist kürzer, damit die News auf den ersten Bildschirm passen.

## Unser eigener Discord {#discord}

OriginsMeta hat einen eigenen Discord-Server. Das Discord-Logo ist im Menü oben (auf dem Handy im „Menü“), und die Einladung steht am Ende jedes Artikels. Neue Artikel und Guides werden dort automatisch gepostet, sobald sie auf der Website online gehen. Der [offizielle Discord von Origins TCG](https://discord.gg/originstcg) bleibt der Server von Koin Games, für Ankündigungen, AMAs und Turnieranmeldungen.

## Danke, coachcronos {#danke-coachcronos}

Am 23. September hat uns coachcronos auf seinem Twitch-Kanal live empfangen, mit Davdas und Pierluigi, um mit seinem Chat über die Website und Origins TCG zu sprechen. Danke von Herzen: für den Raum, für die Begeisterung, die er ins Spiel bringt, und dafür, dass er uns seiner Community vorgestellt hat. Mehrere Änderungen in diesem Artikel sind in diesem Stream entstanden: die immer sichtbaren Deckfilter, der Filter für den Autorentyp und „Schick uns deinen Guide“.

## Danke, dass ihr uns schreibt {#danke-feedback}

Das Feedback-Fenster ist seit ein paar Tagen offen, und unser Staff liest jede Nachricht. Die Suche im Kartentext ist genau so entstanden, aus einer Nachricht ohne Namen: Danke, wer auch immer du bist. Ab heute hat das Fenster auch ein Feld für deinen Namen oder Nickname, freiwillig, damit wir wissen, wem wir danken (wir veröffentlichen ihn nie, ohne dich zu fragen). Schreib uns weiter: über das Feedback-Fenster unten rechts, mit [Schick uns deinen Guide](/de/guides/submit) oder auf unserem Discord.`,
    faq: [
      {
        q: "Wie finde ich die Karten mit Beim Aufdecken im Deck builder?",
        a: "Tippe Reveal in die Suche des Deck builders: Es bleiben die Karten mit Beim Aufdecken im Text. Die Suche durchsucht Name, Saga und Kartentext und funktioniert in der Kartendatenbank genauso.",
      },
      {
        q: "Wie trete ich dem Discord von OriginsMeta bei?",
        a: "Über das Discord-Logo im Menü oben (auf dem Handy im Menü) oder über die Taste am Ende jedes Artikels. Es ist der Server von OriginsMeta, getrennt vom offiziellen Discord von Origins TCG, den Koin Games betreibt.",
      },
      {
        q: "Wie kann ich eine Änderung an der Website vorschlagen?",
        a: "Über das Feedback-Fenster unten rechts: Ein Satz reicht, Name und E-Mail sind freiwillig. Guides laufen über „Schick uns deinen Guide“ im Bereich Guides.",
      },
    ],
  },
  "demo-patch-notes-0921": {
    title: "Origins TCG Demo-Patchnotes vom 21. September: Dorothy kostet 4, 14 Karten ändern sich, The Gallows repariert",
    metaTitle: "Origins TCG: Demo-Patchnotes vom 21. September",
    description:
      "Der Demo-Patch von Origins TCG vom 21. September: Dorothy sinkt auf 4 Mana, Werte- und Textänderungen bei 14 Karten, zwei Spielregeln und der Ort The Gallows.",
    summary:
      "Die Balance-Änderungen des Demo-Updates vom 21. September, verglichen mit dem letzten Playtest-Build: Dorothy sinkt auf 4 Mana, acht Karten ändern ihre Werte, Itsy Bitsy Spider wird Evil, sechs Karten ändern, was sie tun, und zwei Spielregeln sowie The Gallows werden korrigiert.",
    highlights: [
      { label: "Dorothy kostet 4", text: "ein Mana weniger für die Legendäre, die jedes Mal wächst, wenn sich ein Verbündeter bewegt", anchor: "dorothy" },
      { label: "Wicked Stepmother auf 4 Kraft", text: "die Legendäre mit Todesberührung geht von 3/6 auf 4/6", anchor: "wicked-stepmother" },
      { label: "Christopher Robin wieder 5/4", text: "die Werte, die er vor Patch 0.6.3 hatte", anchor: "christopher-robin" },
      { label: "Fünf weitere Werteänderungen", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet und Roo", anchor: "werte" },
      { label: "Itsy Bitsy Spider wird Evil", text: "statt Neutral, mit allen Evil-Synergien, die daraus folgen", anchor: "itsy-bitsy-spider" },
      { label: "Sechs Karten ändern, was sie tun", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "textaenderungen" },
      { label: "Zwei Spielregeln", text: "Werte bleiben im Friedhof erhalten, Vor dem Kampf vor dem Abwerfen der Temporär-Karten", anchor: "regeln" },
      { label: "The Gallows repariert", text: "kein Zerstören mehr am Ort, an den ein Charakter bewegt wird", anchor: "the-gallows" },
    ],
    body: `## Alle Werteänderungen {#werte}

Die Zahlen sind mit dem letzten Playtest-Build verglichen, 0.6.3: dieselben Werte, die die Kartendatenbank dieser Website bis zu diesem Patch verwendet hat. Format: Mana · Kraft/Leben; ★ markiert die Legendären.

| Karte | Vorher | Nachher | Was sich ändert |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | kostet 1 weniger |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 Kraft |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | zurück zu den Werten vor 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 Kraft, +1 Leben |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 Kraft, −1 Leben |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 Kraft |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 Kraft und eine neue Regel für seine Buffs |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 Leben |
| Itsy Bitsy Spider | 0 · 1/1, Neutral | 0 · 1/1, Evil | wechselt die Gesinnung |

## Die zwei Legendären {#legendaere}

### Dorothy kostet 4 {#dorothy}

Dorothy kann sich jede Runde bewegen und hat +1/+1 für jedes Mal, das sich in diesem Spiel ein Verbündeter bewegt hat. Mit 4 Mana kommt sie eine Runde früher aufs Spielfeld und hat eine Runde mehr zum Wachsen. Im selben Patch bekommt Roo, ein Charakter für 2 Mana mit Bewegen, 1 Leben dazu.

### Wicked Stepmother auf 4 Kraft {#wicked-stepmother}

Die Legendäre mit Todesberührung, deren Beim Aufdecken deinen bösen Charakteren Todesberührung gibt, geht von 3/6 auf 4/6.

## Christopher Robin wieder 5/4 {#christopher-robin}

Patch 0.6.3 hatte ihn von 5/4 auf 4/5 gesetzt, robuster, aber mit schwächerem Schlag. Der Demo-Patch bringt die alten Werte zurück. Diese Zeile steht in den Patchnotes im offiziellen Discord, nicht im Steam-Post.

## Itsy Bitsy Spider wird Evil {#itsy-bitsy-spider}

Die 1/1 für 0 Mana wechselt von Neutral zu Evil. Das zählt für jede Karte, die böse Charaktere zählt: Das Beim Aufdecken von Wicked Stepmother zum Beispiel gibt jetzt auch ihr Todesberührung.

## Sechs Karten ändern, was sie tun {#textaenderungen}

### Silver Bullet {#silver-bullet}

Sie kann jetzt neben Charakteren auch Barrieren als Ziel wählen.

### Don Quixote {#don-quixote}

Er hat Verteidiger bekommen: Mehr sagen die Patchnotes über ihn nicht.

### Heroic Charge {#heroic-charge}

Der Zauber gibt Verbündeten in dieser Runde +2 Kraft und Überrennen. Wenn er wiederholt wird, gilt der Buff von +2 Kraft jetzt erneut.

### Frog Prince und Magic Carpet {#frog-prince-magic-carpet}

Beide haben ein Beim Aufdecken mit „Wähle eins“. Buffs, die sie schon hatten, werden beim Ausspielen nicht mehr gelöscht, und wenn sie auf die Hand zurückkehren, können sie erneut wählen. Magic Carpet bekommt außerdem 1 Kraft dazu.

### Wooden Stake {#wooden-stake}

Er kann jetzt auch Charaktere mit vollem Leben als Ziel wählen, scheitert aber weiterhin, wenn das Ziel beim Aufdecken nicht beschädigt ist.

## Zwei Spielregeln {#regeln}

### Werte bleiben im Friedhof erhalten {#friedhof}

Die Werte eines Charakters werden im Friedhof nicht mehr zurückgesetzt. Ein gebuffter Charakter mit Wiedergeburt kehrt weiterhin gebufft aufs Spielfeld zurück, allerdings mit 1 Leben.

### Vor dem Kampf, dann das Abwerfen der Temporär-Karten {#vor-dem-kampf}

Fähigkeiten mit „Vor dem Kampf“ lösen jetzt aus, bevor Temporär-Karten abgeworfen werden.

## The Gallows {#the-gallows}

Der Ort zerstört immer den Gegner gegenüber dem Feld, das ein Charakter betreten hat. Wenn eine Beim Aufdecken-Fähigkeit diesen Charakter an einen anderen Ort bewegt, zerstört The Gallows den gegnerischen Charakter am neuen Ort nicht mehr.

## Woher diese Patchnotes kommen {#quellen}

- Der offizielle Steam-Post vom 21. September, der das Update ankündigt, listet die Werteänderungen und die sechs Karten, die ändern, was sie tun, „verglichen mit dem letzten Playtest-Build“. Der Reddit-Post des Teams sagt dasselbe.
- Die im offiziellen Discord gepostete Version ergänzt Christopher Robin, die zwei Spielregeln und The Gallows. Wir geben sie vollständig wieder.

Der Patch hat keine Versionsnummer: Das Team nennt ihn die Demo-Patchnotes vom 21. September. Einige Creator haben ihn „Patch 0.7“ genannt, aber diese Nummer steht in keinem offiziellen Post zu diesem Update. Auf dieser Website erscheint er als „Demo · 21. Sept.“.

**Update vom 25. September:** Wir haben den Hinweis zum Namen „Patch 0.7“ ergänzt, den einige Creator für dieses Update verwenden.

**Update vom 30. September:** Die Nummer 0.7 gehört offiziell zum nächsten Update, Steam Demo Update #2 vom 29. September, dem letzten Balance-Patch vor der Crimson Cup: Alle seine Änderungen stehen in [den Patchnotes zu 0.7](/de/news/patch-0-7). Die Werte in diesem Artikel sind die vor diesem Patch.

## Was sich auf OriginsMeta ändert {#auf-der-website}

- Jede Kartenseite zeigt die neuen Werte und die Änderung in ihrer Balance-Historie, mit einem Link zum Steam-Post.
- [MetaShifting](/de/metashifting) führt den Patch neben denen des Playtests.
- Der [Deck builder](/de/deck-builder) verwendet die neuen Kosten: Dorothy zählt in der Manakurve jetzt als 4-Drop.
- Der offizielle Text der sechs Karten, die ändern, was sie tun, wird aktualisiert, sobald die Kartendatenbank der Community den Patch importiert. Bis dahin erklärt die Balance-Historie auf jeder Kartenseite die Änderung.

Alles andere des Updates, von der neuen Oberfläche bis zum Ranked-Modus beim Steam Next Fest, steht im [Artikel über das erste große Demo-Update](/de/news/demo-first-big-update).`,
    faq: [
      {
        q: "Was hat sich mit dem Demo-Patch von Origins TCG vom 21. September geändert?",
        a: "Dorothy kostet 4 statt 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet und Roo ändern ihre Werte; Itsy Bitsy Spider wird Evil; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet und Wooden Stake ändern, was sie tun; zwei Spielregeln und der Ort The Gallows werden korrigiert.",
      },
      {
        q: "Ist das Patch 0.7 von Origins TCG?",
        a: "Nein. Einige Creator haben ihn Patch 0.7 genannt, aber dieses Update hat keine Versionsnummer: Das Team nennt es die Demo-Patchnotes vom 21. September 2026, mit den Änderungen gegenüber dem letzten Playtest-Build, 0.6.3. Patch 0.7 ist das nächste Update, Steam Demo Update #2 vom 29. September 2026.",
      },
      {
        q: "Soll ich meine Decks für die Crimson Cup auf diesen Werten bauen?",
        a: "Auf denen von Patch 0.7, der nach diesem kam: Am 29. September 2026 hat das Team ihn als letzten Balance-Patch vor dem Turnier veröffentlicht, mit einem Rework von Twister Toss, und Bagheera, Mind Palace und Spellbook kosten 1 mehr. Die vorläufige Kartenliste der Crimson Cup kam mit dem Update vom 21. September; das Turnier läuft vom 20. bis 25. Oktober 2026.",
      },
    ],
  },
  "demo-first-big-update": {
    title: "Erstes großes Demo-Update von Origins TCG: neue UI, Test-Packs, Ranked zum Next Fest und Crimson-Cup-Karten",
    metaTitle: "Origins TCG Demo-Update: neue UI, Test-Packs, Ranked",
    description:
      "Demo-Update von Origins TCG, 21. September: neue UI, Test-Packs, Kartenliste der Crimson Cup, Fortschritt aus Demo und Playtest bleibt, Ranked zum Next Fest.",
    summary:
      "Koin Games hat die kostenlose Demo von Origins TCG am 21. September aktualisiert: eine neue Oberfläche und ein neues Spielfeld, ein Sammler-Tutorial, Test-Packs und die vorläufige Kartenliste der Crimson Cup, wobei der Fortschritt aller erhalten bleibt. Der Ranked-Modus startet mit dem Steam Next Fest.",
    highlights: [
      { label: "Neue Oberfläche und neues Spielfeld", text: "die Bildschirme rund um das Match und das Spielfeld sind neu gezeichnet", anchor: "neue-oberflaeche" },
      { label: "Sammler-Tutorial", text: "wie das Sammeln funktioniert, im Spiel erklärt", anchor: "sammler-tutorial" },
      { label: "Test-Packs", text: "Packs zum Öffnen in der Demo", anchor: "test-packs" },
      { label: "Neue Sprachzeilen", anchor: "neue-sprachzeilen" },
      { label: "Balance-Änderungen", text: "Dorothy kostet 4 und 14 Karten ändern sich: die vollständigen Patchnotes", anchor: "balancing" },
      { label: "Ranked zum Steam Next Fest", text: "ab 19. Oktober, mit exklusiven Belohnungen", anchor: "ranked" },
      { label: "Kartenliste der Crimson Cup", text: "vorläufig, Turnierdecks lassen sich schon bauen", anchor: "crimson-cup" },
      { label: "Fortschritt bleibt", text: "von dem, was weiter ist, Demo oder Playtest", anchor: "fortschritt" },
      { label: "Playtest", text: "keine neuen Inhalte, das Feinschliff-Update kommt später in der Woche", anchor: "playtest" },
    ],
    body: `## Was sich in der Demo ändert {#was-sich-aendert}

Das Team nennt es „das erste große Update der Origins-Demo“, und das Wort *erste* lässt vermuten, dass vor dem Festival noch mehr kommt.

### Eine neue Oberfläche und ein neues Spielfeld {#neue-oberflaeche}

Die Bildschirme rund um das Match wurden überarbeitet, und das Spielfeld hat einen neuen Look.

### Ein Sammler-Tutorial {#sammler-tutorial}

Es erklärt die wichtigsten Seiten des Sammelns, also das, was Origins von anderen digitalen Kartenspielen unterscheidet: Karten, die du öffnest, besitzt und tauschst. Unser [Guide zur Sammler-Ökonomie](/de/guides/collector-economy) geht das Modell Schritt für Schritt durch.

### Test-Packs {#test-packs}

Packs zum Öffnen in der Demo, um die Sammelseite des Spiels vor dem vollen Launch auszuprobieren.

### Neue Sprachzeilen {#neue-sprachzeilen}

Das Update bringt neue Sprachzeilen; mehr sagt die Ankündigung dazu nicht.

### Balance-Änderungen {#balancing}

Die Details kamen am selben Abend, im Steam-Post und auf Discord: Dorothy sinkt auf 4 Mana, acht Karten ändern ihre Werte, Itsy Bitsy Spider wird Evil, sechs Karten ändern, was sie tun, und zwei Spielregeln sowie der Ort The Gallows werden korrigiert. Alles steht im [Artikel zu den Patchnotes](/de/news/demo-patch-notes-0921) und schon in [MetaShifting](/de/metashifting) und in der Balance-Historie jeder betroffenen Karte.

## Der Ranked-Modus startet mit dem Steam Next Fest {#ranked}

Das Team schaltet den Ranked-Modus „mit dem Start des Steam Next Fest“ frei, mit exklusiven Ranked-Belohnungen, deren Details noch nicht angekündigt sind. Das Festival läuft von Montag, 19. Oktober 2026, 10:00 Uhr pazifischer Zeit bis Montag, 26. Oktober. Wenn die Ladder für alle öffnet, startet auch die erste echte [Tier-List](/de/tier-list) von OriginsMeta, gebaut auf den Ergebnissen.

## Die Kartenliste der Crimson Cup ist im Spiel {#crimson-cup}

Das Update bringt auch die vorläufige Kartenliste der Crimson Cup mit, des bisher größten Turniers von Koin Games, vom 20. bis 25. Oktober: regionale Qualifikationen am 20., 21. und 22., dann Playoffs und Finale, im Conquest-Format, Best-of-Three, mit einem großen Finale im Best-of-Five. Die Preise haben einen Gesamtwert von 10.000 Dollar, zwischen Geld, Promokarten, Packs und Displays der Alpha Edition: Es ist kein reines Preisgeld in bar.

„Vorbehaltlich kommender Balance-Patches könnt ihr anfangen, Decks für das Turnier zu tüfteln“, schreibt das Team. Zwei Werkzeuge für den Anfang:

- der [Deck builder](/de/deck-builder), dessen Turniermodus die Conquest-Regeln prüft, während du baust;
- der [Guide zum Steam Next Fest](/de/guides/steam-next-fest-2026), mit Daten, Uhrzeiten und der Anmeldung auf Discord.

**Update vom 30. September:** Der Balance-Patch kam am 29. September. [Patch 0.7](/de/news/patch-0-7), den das Team den letzten Balance-Patch vor dem Turnier nennt, überarbeitet Twister Toss und lässt Bagheera, Mind Palace und Spellbook 1 mehr kosten.

## Fortschritt: was du behältst {#fortschritt}

Das war die offene Frage. Am 16. September hatte eine Nachricht des Staffs auf Discord bestätigt, dass [Deck-Freischaltungen und Boss-Fortschritt von Demo 1 in Demo 2 übernommen werden](/de/news/demo-2-progress-carryover), zum geschlossenen Playtest aber nichts gesagt. Jetzt ist das Team deutlich: Wer die Demo, den Playtest oder beides gespielt hat, behält den Fortschritt von dem, was weiter ist, „damit niemand Karten noch einmal freischalten muss“.

Das zählt, weil das Freischalten langsam ist. Im Playtest öffnet sich jedes Deck nach drei Ranked-Siegen plus einem Sieg gegen einen KI-Boss, ein Weg, den die Spieler im [Feedback vom 14. September](/de/news/playtest-feedback-deck-unlock) als zermürbend bezeichnet hatten.

## Und der Playtest? {#playtest}

Wer den geschlossenen Playtest spielt, bekommt mit diesem Update keine neuen Decks, Karten oder Bosse. Der Feinschliff erreicht den Playtest später in dieser Woche, zusammen mit anderen Änderungen, die das Team mit den Spielern testen will: Wer dort Ranked-Matches grindet, muss ein paar Tage warten.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Was die exklusiven Ranked-Belohnungen sind.
- Ob das Deckbauen in der öffentlichen Demo schon für alle offen ist: Die Ankündigung sagt es nicht.

**Update vom 22. September:** Zwei Fragen sind beantwortet. Die Balance-Details sind da ([Patchnotes](/de/news/demo-patch-notes-0921)), und die Ankündigung steht jetzt auch auf Steam, wo sie am 21. September um 21:59 UTC veröffentlicht wurde.

## Das Gerücht, das recht hatte {#geruecht}

Letzte Woche kursierte in den sozialen Medien ein Satz über eine „Demo Season 2“, die in der folgenden Woche kommen sollte, mit neuen Decks, neuen Belohnungen und einem ersten Vorgeschmack auf das Sammeln. Wir haben [es als Gerücht gemeldet](/de/news/demo-2-animations-and-fixes), weil kein offizieller Post es bestätigt hat. Der Zeitpunkt und das Sammeln haben sich als richtig erwiesen.`,
    faq: [
      {
        q: "Verliere ich mit dem Demo-Update von Origins TCG meinen Fortschritt?",
        a: "Nein. Wer die Demo, den geschlossenen Playtest oder beides gespielt hat, behält den Fortschritt von dem, was weiter ist, also muss keine Karte noch einmal freigeschaltet werden (Ankündigung des Teams vom 21. September 2026).",
      },
      {
        q: "Wann startet der Ranked-Modus in der Demo von Origins TCG?",
        a: "Mit dem Start des Steam Next Fest, am Montag, 19. Oktober 2026, mit exklusiven Ranked-Belohnungen, deren Details noch nicht angekündigt sind.",
      },
      {
        q: "Kann ich schon Decks für die Crimson Cup bauen?",
        a: "Ja: Die vorläufige Kartenliste des Turniers ist seit dem Update vom 21. September im Spiel, und Patch 0.7 vom 29. September ist der letzte Balance-Patch vor der Crimson Cup, die vom 20. bis 25. Oktober 2026 läuft.",
      },
      {
        q: "Was ändert sich für die Spieler des Playtests?",
        a: "Vorerst keine neuen Decks, Karten oder Bosse: Das Feinschliff-Update erreicht den Playtest später in der Woche vom 21. September, zusammen mit anderen Änderungen zum Testen.",
      },
    ],
  },
  "forum-bugs-before-demo-2": {
    title: "Hängende Matches, das Ei im Colosseum und eine Revanche-Taste: die Meldungen des Wochenendes",
    metaTitle: "Origins TCG Bugs: hängende Matches, Colosseum, Golden Egg",
    description:
      "Drei Meldungen im Forum von Origins TCG vom 19. und 20. September: ein Match, das auf „waiting“ hängt, das Golden Egg im Colosseum und eine Revanche-Taste.",
    summary:
      "Drei neue Threads im Steam-Forum zwischen dem 19. und 20. September, auf die das Team noch nicht geantwortet hat: ein Match, das nach dem Kampf einfriert, ein Golden Egg, das sich im Colosseum seltsam verhält, und der Wunsch nach einer Revanche-Taste in privaten Matches.",
    highlights: [
      { label: "Ein Match hängt auf „waiting“", text: "nach dem Kampf, gemeldet am 20. September; ein Spieler bringt es mit Spellbook in Verbindung", anchor: "haengendes-match" },
      { label: "Das Golden Egg im Colosseum", text: "die beschworene Golden Goose hat im Kampf keinen Schaden zugefügt", anchor: "golden-egg" },
      { label: "Eine Revanche-Taste", text: "gewünscht für private Matches, mit Deckwechsel in der Lobby", anchor: "revanche" },
      { label: "Was das Team gesagt hat", text: "seine letzten Antworten im Forum stammen vom 16. September", anchor: "team" },
    ],
    body: `## Ein Match hängt auf „waiting“ {#haengendes-match}

Am 20. September hat ein Spieler ein Match gemeldet, das nach der Kampfphase einfror: Der Bildschirm blieb weit über den Timer hinaus auf „waiting“ stehen, während alles andere noch anklickbar war und das Match noch aufgegeben werden konnte.

Ein anderer Spieler antwortete, es sei ein bekannter Bug im Zusammenhang mit Spellbook, der mit der „Demo Season 2 nächste Woche“ behoben werden sollte. Diese Antwort kam von einem Spieler, nicht vom Team, und war damals keine Ankündigung.

**Update vom 21. September:** Das [erste große Demo-Update](/de/news/demo-first-big-update) kam tatsächlich am Tag darauf. Die Liste der Fixes ist noch nicht veröffentlicht, also können wir nicht sagen, ob dieser Bug dabei ist.

## Das Golden Egg im Colosseum {#golden-egg}

Am 19. September beschrieb ein anderer Spieler einen Kampf am Ort The Colosseum:

1. Sein Golden Egg wurde vom Beim Aufdecken von Black Knight zerbrochen, das dem Gegner gegenüber 2 Schaden zufügt;
2. das Ei beschwor das Golden Goose, eine 5/5, auf demselben Feld;
3. im Kampf fügte die Goose keinen Schaden zu: Black Knight, eine 2/2, überlebte, und die Goose blieb bei 5/3.

Es sieht nach der Regel aus, die Entwickler Fenchurch am 15. September im Forum erklärt hat: Ein Charakter, der mitten im Kampf beschworen wird, greift auf dem Feld, auf dem er landet, erst in der nächsten Runde an. Beschworen zu werden schützt ihn nicht vor Schaden, was die 5/3 erklärt. Was das Colosseum hinzufügt, ist noch nicht klar: Der Thread hat bisher keine Antwort.

## Eine Revanche-Taste für private Matches {#revanche}

Der dritte Thread ist ein Wunsch: eine Taste „Nochmal spielen“ oder „Revanche“ am Ende eines privaten Matches und die Möglichkeit, das Deck zu wechseln, ohne die private Lobby zu verlassen.

## Was das Team bisher gesagt hat {#team}

Die letzten Antworten des Teams im Forum stammen vom 16. September: [schnellere Animationen und der Bug von Off With Your Head!](/de/news/demo-2-animations-and-fixes) sowie [der Rework der KI in den Bosskämpfen](/de/news/demo-2-boss-ai-rework).`,
  },
  "demo-2-progress-carryover": {
    title: "Demo 2.0 übernimmt deine Deck- und Boss-Freischaltungen aus Demo 1",
    metaTitle: "Origins TCG Demo 2.0 übernimmt Freischaltungen aus Demo 1",
    description:
      "Nachricht des Staffs von Koin Games auf Discord, 16. September: Deck-Freischaltungen und Boss-Fortschritt aus Demo 1 von Origins TCG gehen in Demo 2 über.",
    summary:
      "Am 16. September schrieb ein Staff-Mitglied von Koin Games im offiziellen Discord, dass Demo 2 die in Demo 1 erspielten Deck-Freischaltungen und den Boss-Fortschritt übernimmt. Am 21. September hat das Team das Versprechen auf den geschlossenen Playtest ausgeweitet.",
    highlights: [
      { label: "Freischaltungen aus Demo 1 bleiben", text: "Deck-Freischaltungen und Boss-Fortschritt, schrieb ein Staff-Mitglied am 16. September auf Discord", anchor: "staff" },
      { label: "Warum es wichtig war", text: "im Playtest kostet jedes Deck drei Ranked-Siege und einen Sieg gegen einen Boss", anchor: "warum-es-wichtig-war" },
      { label: "Auch der Playtest zählt", text: "seit dem 21. September behältst du den Fortschritt von dem, was weiter ist", anchor: "update" },
    ],
    body: `## Was das Staff geschrieben hat {#staff}

„Das Demo-V2-Deck übernimmt deine Deck-Freischaltungen und deinen Boss-Fortschritt aus V1“: Das ist die Nachricht, die ein Mitglied des Origins-Staffs am Abend des 16. September im offiziellen Discord gepostet hat, als Antwort auf Spieler, die fragten, ob alle von vorn anfangen müssten. Ein Screenshot der Nachricht wurde am nächsten Morgen auf Reddit geteilt.

## Warum es wichtig war {#warum-es-wichtig-war}

Im Playtest wird jedes Deck mit drei Ranked-Siegen plus einem Sieg gegen einen KI-Boss freigeschaltet, ein Weg, den die Spieler im [Feedback vom 14. September](/de/news/playtest-feedback-deck-unlock) als zermürbend bezeichnet hatten. Ihn mit Demo 2 von null an zu wiederholen, war die größte Sorge. Bis zu dieser Nachricht lautete die Antwort, die in der Community kursierte, genau andersherum.

## Was noch offen war {#offen}

Die Nachricht sprach nur von Demo 1 und Demo 2. Ob auch der im geschlossenen Playtest erspielte Fortschritt zählt, stand in keinem offiziellen Post, also haben wir die beiden damals getrennt gehalten.

## Update vom 21. September {#update}

Die Frage ist geklärt. Bei der Ankündigung [des ersten großen Demo-Updates](/de/news/demo-first-big-update) schrieb das Team, dass jeder, der die Demo, den Playtest oder beides gespielt hat, den Fortschritt von dem behält, was weiter ist, „damit niemand Karten noch einmal freischalten muss“.`,
  },
  "demo-2-boss-ai-rework": {
    title: "Koin überarbeitet die KI der Bosskämpfe in Demo 2.0",
    metaTitle: "Origins TCG: Koin überarbeitet die Boss-KI für Demo 2.0",
    description:
      "Entwickler Fenchurch bestätigt im Steam-Forum einen Rework der KI in den Bosskämpfen von Origins TCG für Demo v2, nach einer Meldung über den Dracula-Boss.",
    summary:
      "Ein Spieler beschrieb, wie der Dracula-Boss der Missionen jeden Zufallswurf gewann. Fenchurch, Entwickler bei Koin Games, antwortete im Steam-Forum, dass die KI der Bosskämpfe für Demo v2 überarbeitet wird und dass sich Bosse und das Freischalten von Karten weiter ändern werden.",
    highlights: [
      { label: "Die Meldung", text: "Dracula, der Boss der Missionen, schien jeden Zufallswurf zu gewinnen", anchor: "meldung" },
      { label: "Rework der Boss-KI für Demo v2 versprochen", text: "bestätigt von Entwickler Fenchurch am 16. September", anchor: "antwort" },
      { label: "Warum es wichtig ist", text: "Bosse sind Teil des Wegs, der Decks freischaltet", anchor: "warum-es-wichtig-ist" },
      { label: "Nach dem Update vom 21. September", text: "die Ankündigung erwähnt die Bosse nicht", anchor: "danach" },
    ],
    body: `## Die Meldung {#meldung}

Am 15. September hat ein Spieler im Steam-Forum von vier Partien gegen Dracula berichtet, den Boss der Demo-Missionen. Die früheren Bosse, schrieb er, seien stark, aber fair gewesen: alle im ersten Versuch geschlagen, mit den vorgefertigten Decks, die kurz davor freigeschaltet wurden. Dracula dagegen schien bei jedem „zufälligen“ Effekt richtig zu liegen:

- Kürbisse trafen immer die Barriere mit dem wenigsten Leben;
- Zauber, die zufällig 6 Schaden zufügen, landeten immer auf dem stärksten Diener mit 6 Leben oder weniger;
- zufälliges Abwerfen nahm immer die gefährlichste Karte auf der Hand;
- zufällige Beschwörungen landeten immer auf dem besten Feld.

## Die Antwort des Teams {#antwort}

Entwickler Fenchurch antwortete am 16. September: „Die KI unserer Bosskämpfe bekommt in Demo v2 einen Rework“. Er fügte hinzu, dass das Team weiter beobachten und ändern wird, wie Bosskämpfe und das Freischalten von Karten funktionieren.

Es ist nicht die erste Änderung an den Bossen. Die Playtest-Patchnotes 0.6.3 vom 27. August hatten ihnen schon eine „neue, verbesserte Bot-Intelligenz“ gegeben, mit der Frage an die Spieler, ob sie dadurch klüger oder dümmer geworden seien.

## Warum es wichtig ist {#warum-es-wichtig-ist}

Bosse sind Teil des Freischaltwegs: Im Playtest öffnet sich ein Deck nach drei Ranked-Siegen und einem Sieg gegen einen KI-Boss. Ein Boss, der sich unfair anfühlt, bremst die ganze Sammlung. Es ist das zweite Mal in einer Woche, dass dieser Weg in den Feedback-Threads auftaucht, nach [der Antwort vom 14. September](/de/news/playtest-feedback-deck-unlock) zur Idee, diese Matches nur noch als PvE zu spielen.

## Update vom 21. September: wie es weiterging {#danach}

Am 21. September kam das [erste große Demo-Update](/de/news/demo-first-big-update). Die Ankündigung erwähnt die Bosse nicht: Ob die neue KI schon drin ist, ist noch nicht bekannt.`,
  },
  "demo-2-animations-and-fixes": {
    title: "Vor Demo 2.0: schnellere Animationen bestätigt, der Bug von Off With Your Head! auf der Fix-Liste",
    metaTitle: "Origins TCG: schnellere Animationen, Off With Your Head!-Fix",
    description:
      "Was das Team von Origins TCG am 16. September bestätigt hat: schnellere Animationen, Fix für Off With Your Head! mit Demo v2, Audio und ein Gerücht.",
    summary:
      "Am 16. September hat das Team im Steam-Forum bestätigt, dass die Animationen beschleunigt werden und dass die unsichtbaren Kopien von Off With Your Head! ein bekannter Bug sind, der mit Demo v2 behoben wird. Gleichzeitig kursierte ein Gerücht über eine „Demo Season 2“.",
    highlights: [
      { label: "Schnellere Animationen", text: "laut Staff werden sie in einem kommenden Update beschleunigt", anchor: "animationen" },
      { label: "Der Bug von Off With Your Head!", text: "halb unsichtbare Kopien, ein bekannter Bug, der mit Demo v2 behoben wird", anchor: "off-with-your-head" },
      { label: "Audio", text: "die Meldungen gehen an das Audio-Team", anchor: "audio" },
      { label: "Das Gerücht der „Demo Season 2“", text: "der Zeitpunkt stimmte: Das Demo-Update kam am 21. September", anchor: "geruecht" },
    ],
    body: `## Schnellere Animationen {#animationen}

„Die Animationen müssen um 100–200 % schneller werden“: Der am 11. September eröffnete Thread bekam überwiegend zustimmende Antworten, nur ein Spieler fand das Tempo so in Ordnung, wie es ist. Am 16. September antwortete ein Mitglied des Staffs, dass das Team erkannt hat, dass die Animationen schneller werden müssen, und dass das „in einem kommenden Update angepasst wird“.

## Der Bug von Off With Your Head! {#off-with-your-head}

Ein neuer Spieler beschrieb Kopien von Christopher Robin, die ohne Artwork erschienen, nur mit sichtbarer Kraft und sichtbarem Leben. Entwickler Fenchurch fand die Karte dahinter: Off With Your Head!, die einen Verbündeten zerstört und an jedem anderen Ort eine einfache Kopie davon beschwört. Die halb unsichtbaren Kopien sind ein bekannter Bug, und er „wird behoben, wenn wir hier sehr bald Demo v2 veröffentlichen“.

## Audio {#audio}

Einem Spieler, der mehrere Bugs aufgelistet hatte, antwortete Fenchurch, dass die Audio-Meldungen an das Audio-Team weitergegeben werden.

## Das Gerücht der „Demo Season 2“ {#geruecht}

In denselben Tagen kursierte in den sozialen Medien ein Satz: eine „Demo Season 2“ in der folgenden Woche, mit neuen Decks, neuen Belohnungen und einem ersten Vorgeschmack auf das Sammeln. Kein offizieller Post auf Steam, auf Discord oder auf origins-tcg.com hat das bestätigt, also haben wir es als Gerücht gemeldet und uns an die offiziellen Daten gehalten, das Steam Next Fest vom 19. bis 26. Oktober.

**Update vom 21. September:** Das Gerücht hatte beim Zeitpunkt recht. Das [erste große Demo-Update](/de/news/demo-first-big-update) kam am 21. September mit einem Sammler-Tutorial und Test-Packs. Die Liste der Fixes ist noch nicht veröffentlicht, also können wir nicht sagen, ob der Bug von Off With Your Head! dabei ist.`,
  },
  "davdas-3-pigs-mid-range": {
    title: "3 Pigs Mid Range: ein Midrange-Deck mit Three Not So Little Pigs für Ladder und Competitive",
    metaTitle: "Neues Staff-Deck für Origins TCG: 3 Pigs Mid Range",
    description:
      "Midrange-Deck für Origins TCG mit Three Not So Little Pigs, für Ladder und Competitive: früh das Feld nehmen, einen Ort gewinnen, mit En Passant schließen.",
    summary:
      "Das zweite Deck von Davdas, Staff von OriginsMeta, ist eine Midrange-Liste mit Three Not So Little Pigs, markiert für Ladder und Competitive. Der Plan: in den ersten Runden das Spielfeld nehmen, mindestens einen Ort gewinnen und dann mit En Passant, dem Überrennen von Ellen Trechend und den Lightning Strikes abschließen, die Impundulu erzeugt. Die Deckseite hat die vollständige Liste mit Diagrammen zur Zusammensetzung, die Mulligan-Notizen des Autors, den Spielcode und die Taste, um es im Deck builder zu öffnen, dazu zwei Guides, wie man es spielt.",
  },
  "davdas-healing-healsing": {
    title: "Healing Healsing, das erste Community-Deck: eine Control-Liste mit Van Helsing für die Ladder",
    metaTitle: "Erstes Origins TCG Deck auf OriginsMeta: Van Helsing Control",
    description:
      "Das erste Deck auf OriginsMeta: eine Control-Liste mit Van Helsing für die Ladder von Origins TCG, die Schaden weg heilt und spät das Spielfeld räumt.",
    summary:
      "Das erste auf OriginsMeta veröffentlichte Deck stammt von Davdas, Staff von OriginsMeta: eine Control-Liste mit Van Helsing für die Ranked-Ladder. Der Plan: früh Value mit Spellbook und Ali Baba holen, den Schaden weg heilen, während Phuong Hoang mit jeder Heilung wächst, dann Runde 8 oder 9 erreichen und das Spielfeld mit Forbidden Knowledge räumen. Die Deckseite hat die vollständige Liste mit Diagrammen zur Zusammensetzung, die Mulligan-Notizen des Autors, den Spielcode und die Taste, um es im Deck builder zu öffnen, dazu zwei Guides, wie man es spielt.",
  },
  "playtest-feedback-deck-unlock": {
    title: "Feedback zum Playtest: Koin liest das Steam-Forum und könnte Deck-Freischaltungen auf PvE verlegen",
    metaTitle: "Origins TCG Playtest: Deck-Freischaltungen bald im PvE?",
    description:
      "Feedback zum Playtest von Origins TCG: Deck-Freischaltungen kosten drei Ranked-Siege und einen Boss; laut Fenchurch liest Koin das Forum und erwägt nur PvE.",
    summary:
      "Im aktuellen Playtest schaltest du ein Deck frei, indem du drei Ranked-Matches gewinnst und dann einen KI-Boss besiegst; die Spieler nennen das zermürbend, wenn sie mit einem Starterdeck auf komplette Sammlungen treffen. Entwickler Fenchurch antwortete, dass das Team jeden Post im Steam-Forum liest und erwägt, die Matches zum Freischalten von Decks nur als PvE zu gestalten. Außerdem gemeldet: Karten, die zufällige Karten erzeugen (Humpty, Spellbook), können einem Deck zusätzliche Legendäre hinzufügen, Wünsche nach einem Redesign von Spellbook und das Beim Aufdecken von Asanbosam, das sich am Ort Cloning Lab nicht wiederholt.",
  },
  "kickstarter-ama-pre-registration": {
    title: "Kickstarter-AMA gelaufen: Vorregistrierung offen, Displays der Alpha Edition nur per Vorbestellung",
    metaTitle: "Origins TCG Kickstarter-AMA: Displays nur vorbestellbar",
    description:
      "Kickstarter-AMA von Origins TCG, 10. September: 15 % Rabatt für 1 Dollar erstattbare Anzahlung, Alpha-Displays nur vorbestellbar. Datum und Updates im Guide.",
    summary:
      "Koin Games hat am 10. September im offiziellen Discord Fragen zum kommenden Kickstarter beantwortet. Das Datum der Kampagne ist noch nicht angekündigt; die offizielle Seite zur Vorregistrierung bietet 15 % Rabatt zum Start für eine Anzahlung von 1 Dollar, die vor dem Start vollständig erstattet werden kann. Die Origins Myths & Legends Alpha Edition kommt als Sammler-Packs mit 5 Karten (mindestens eine Rare oder besser garantiert), Displays mit 24 Packs und Cases mit 6 Displays; Displays und Cases gibt es nur per Vorbestellung, und die Auflage wird nicht wiederholt. Die Karten werden auf dem Steam-Community-Markt gehandelt; das Öffnen von Packs auf dem Handy ist für 2027 geplant.",
  },
  "gameplay-trailer": {
    title: "Offizieller Gameplay-Trailer auf YouTube veröffentlicht",
    metaTitle: "Offizieller Gameplay-Trailer von Origins TCG auf YouTube",
    description:
      "Der erste offizielle Gameplay-Trailer von Origins TCG ist auf YouTube: So siehst du am schnellsten Tempo und Oberfläche eines Matches vor der Demo 2.0.",
    summary:
      "Der erste Trailer, der ganz dem Gameplay gewidmet ist, ist auf dem offiziellen YouTube-Kanal von Origins TCG online: der schnellste Weg, das Tempo eines Matches und die Oberfläche zu sehen, bevor die Demo 2.0 zum Steam Next Fest kommt.",
  },
  "itzbolt-wins-conquest": {
    title: "itzBolt gewinnt Big Bob's Playtest Battle, das erste Conquest-Turnier",
    metaTitle: "Origins TCG: itzBolt gewinnt das erste Conquest-Turnier",
    description:
      "itzBolt gewinnt Big Bob's Playtest Battle, das erste Turnier von Origins TCG im Conquest-Format, gespielt auf dem Playtest 0.6.3 mit Best-of-Three-Matches.",
    summary:
      "Das Community-Turnier, gespielt auf dem Playtest-Build 0.6.3 mit freiem Deckbau und im Conquest-Format (mehrere Decks mit verschiedenen Legendären, Best-of-3), hat itzBolt gewonnen, laut den Ergebnissen, die die Community geteilt hat (einen offiziellen Post mit dem Ergebnis haben wir nicht gefunden). Es war der erste öffentliche Test des Formats, das Koin inzwischen für die Crimson Cup gewählt hat.",
  },
  "biggest-tournament-ever": {
    title: "Crimson Cup angekündigt: das größte Turnier aller Zeiten zum Steam Next Fest",
    metaTitle: "Origins TCG: Crimson Cup zum Steam Next Fest angekündigt",
    description:
      "Koin Games kündigt am 9. September die Crimson Cup von Origins TCG an: 20.–25. Oktober, regionale Qualis, 10.000 Dollar an Preisen. Mit den finalen Regeln.",
    summary:
      "Ein mehrtägiges Event vom 20. bis 25. Oktober: Qualifikationen für jede der drei großen Regionen am 20., 21. und 22., dann Playoffs und Finale. Preise im Wert von 10.000 Dollar: eine exklusive 1/1-Promokarte, weitere Promokarten, digitale Packs, Alpha-Displays und -Cases sowie Geldpreise. Anmeldung auf Discord; Creator können Wildcard-Einladungen direkt in die Playoffs anfragen.",
    highlights: [
      { label: "20.–25. Oktober", text: "Qualifikationen für die drei großen Regionen am 20., 21. und 22., dann Playoffs und Finale", anchor: "termine" },
      { label: "Preise für 10.000 Dollar", text: "eine 1/1-Promokarte, weitere Promokarten, digitale Packs, Alpha-Displays und -Cases, Geld", anchor: "preise" },
      { label: "Anmeldung auf Discord", text: "Creator können eine Wildcard direkt in die Playoffs anfragen", anchor: "anmeldung" },
      { label: "Die finalen Regeln", text: "Conquest mit drei Decks und Pflicht-Check-in, festgelegt am 24. September", anchor: "update" },
    ],
    body: `Regeln, Format und Check-in, wie am 24. September festgelegt: [Regeln der Crimson Cup](/de/news/crimson-cup-format-check-in).

## Was Koin am 9. September angekündigt hat {#termine}

Am 9. September hat Koin Games auf Steam sein bisher größtes Turnier angekündigt: ein mehrtägiges Event während des Steam Next Fest, vom 20. bis 25. Oktober 2026.

1. **Qualifikationen**, eine für jede der drei großen Regionen, am 20., 21. und 22. Oktober.
2. **Playoffs und Finale** nach den Qualifikationen.

## Die angekündigten Preise {#preise}

Die Preise haben einen Gesamtwert von 10.000 Dollar und kommen in mehreren Formen:

- eine exklusive 1/1-Promokarte;
- weitere Promokarten;
- digitale Packs;
- Alpha-Displays und -Cases;
- Geldpreise.

## Anmeldung und Wildcards {#anmeldung}

Die Anmeldung läuft über den [offiziellen Discord von Origins TCG](https://discord.gg/originstcg). Content Creator können eine Wildcard-Einladung anfragen, die sie direkt in die Playoffs bringt.

## Update vom 25. September 2026 {#update}

Dieser Artikel gibt die erste Ankündigung vom 9. September wieder. Am 24. September hat Koin Games nach einer Umfrage unter den Spielern das Format festgelegt: Conquest mit drei Decks, mindestens 8 einzigartige Karten zwischen jedem Paar von Decks, geheime Decklisten bis zur Top 4 und kein Ban in Best-of-Five-Matches. Der Check-in ist Pflicht: Er öffnet zwei Stunden vor jeder Qualifikation und schließt fünf Minuten vor dem Start, zusammen mit der Deckabgabe. Das Turnier wird auf der Hauptdemo gespielt, und die genaue Aufteilung des Preisgelds wurde für die folgende Woche versprochen.

Die Regeln, die Check-in-Zeiten und was wir noch nicht wissen, stehen in [unserem Artikel über die Regeln der Crimson Cup](/de/news/crimson-cup-format-check-in); Daten, Plätze pro Region und wie du dich vorbereitest, in unserem [Guide zum Steam Next Fest 2026](/de/guides/steam-next-fest-2026).`,
  },
  "patch-0-6-3": {
    title: "Playtest-Patch 0.6.3: sechzehn Karten angepasst, King Arthur auf 7/7",
    metaTitle: "Origins TCG Patch 0.6.3: King Arthur auf 7/7, 16 Karten",
    description:
      "Playtest-Patch 0.6.3 von Origins TCG, 27. August: Buffs für King Arthur, Merlin und Lancelot, Nerfs für Bandersnatch und Bigfoot, drei Reworks, klügere Bosse.",
    summary:
      "Ein Patch mit Feinschliff und Fixes, der zwei Tage später für das Turnier von Big Bob genutzt wurde. Buffs für King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll und Blow the House Down; Nerfs für Bandersnatch, Bigfoot, Scarecrow und Merlin's Prophecy; Rework für Bagheera, Christopher Robin und Sandman. Die Bosse bekamen eine klügere KI.",
  },
  "big-bobs-playtest-battle": {
    title: "Big Bob's Playtest Battle bringt das Conquest-Format",
    metaTitle: "Big Bob's Playtest Battle bringt Conquest zu Origins TCG",
    description:
      "Big Bob's Playtest Battle, 28. August: das erste Turnier von Origins TCG im Conquest-Format, Best-of-Three im K.-o.-System, mit Wildcards fürs Next Fest.",
    summary:
      "Turnier am 28. August auf dem Playtest-Build mit freiem Deckbau. Best-of-3, einfaches K.-o.-System und der erste Einsatz von Conquest: Du reichst mehrere Decks mit verschiedenen Legendären und mindestens neun unterschiedlichen Karten ein und bannst eines deines Gegners. Preise: Wildcards für das Turnier zum Next Fest und Collector Packs.",
  },
  "patch-0-6-2": {
    title: "Playtest-Patch 0.6.2: Balance-Runde für 23 Karten",
    metaTitle: "Origins TCG Patch 0.6.2: 23 Karten neu ausbalanciert",
    description:
      "Playtest-Patch 0.6.2 von Origins TCG, 21. August: Mulan erhält Doppelangriff, Queen of Hearts kostet 4 Mana, Van Helsing's Tools ist gratis. 23 Karten neu.",
    summary:
      "Acht Karten haben geändert, was ihre Fähigkeit tut. Mulan bekommt Doppelangriff, Queen of Hearts sinkt auf 4 Mana 3/3 mit Erstschlag, Ellen Trechend wird eine 3/3 für 8 Mana, die pro Gegner um +3/+3 wächst. Van Helsing's Tools ist gratis, aber Silver Bullet fügt nur 1 Schaden zu. Die Sammlung ist jetzt auf die zehn Decks des Playtests beschränkt.",
  },
  "patch-0-6-1-ranked": {
    title: "Patch 0.6.1: Ranked-Ladder, Grandmaster-Rangliste, drei Decks angepasst",
    metaTitle: "Origins TCG Patch 0.6.1: Ranked-Ladder und Grandmaster",
    description:
      "Patch 0.6.1 von Origins TCG, 14. August: Ranked-Modus mit weltweiter Rangliste für die Grandmaster-Division, Komfortoptionen und Huntsman auf 6 Mana.",
    summary:
      "Der Ranked-Modus kommt mit einer weltweiten Rangliste für die Grandmaster-Division, dazu Komfortfunktionen: Tutorial überspringen, die Legendäre des Gegners beim Mulligan sehen, Emotes stummschalten. Huntsman wird zu 6 Mana 6/6; Swarm, Evil und Discard tauschen jeweils eine Karte.",
  },
  "demo-2-playtest": {
    title: "Playtest der Demo 2.0: 5 neue Decks, über 70 neue Karten, Deckbau",
    metaTitle: "Origins TCG Demo 2.0 Playtest: 5 Decks, 70+ Karten",
    description:
      "Das Update von Origins TCG fürs Next Fest geht ab 7. August in den Community-Playtest: 5 neue Decks, 70+ neue Karten und Deckbau, offen für alle via Discord.",
    summary:
      "Das Update, das im Oktober zum Steam Next Fest erscheint, geht in die Community-Playtests, ab Freitag, 7. August, um 21:00 Uhr UTC mit einem Spieleabend. Offen für alle über Discord.",
  },
  "demo-stats-ama": {
    title: "Erste Zahlen der Demo: über 1.000 Spieler, über 13.000 Matches, Median 1h51m",
    metaTitle: "Origins TCG Demo: über 1.000 Spieler, 13.000+ Matches",
    description:
      "Sechs Tage nach dem Start hat die Demo von Origins TCG 1.000 Spieler und 13.000 Matches überschritten, Median 1h51m. Dazu ein AMA, ein Turnier, Card Party.",
    summary:
      "Sechs Tage nach dem Start teilt das Team die Zahlen der Demo und kündigt an: ein AMA mit CEO Tim Jooste und Head of Game Design Kevin Lambert (22. Juli), das erste Turnier der Demo (24. Juli) und einen Stand auf der Card Party in Fort Lauderdale (24.–26. Juli).",
  },
  "demo-live": {
    title: "Die Demo von Origins TCG ist auf Steam verfügbar",
    metaTitle: "Demo von Origins TCG startet mit exklusiven Sammelobjekten",
    description:
      "Die kostenlose Demo von Origins TCG ist auf Steam, mit exklusiven Sammelobjekten, die es später nicht mehr gibt und die zum Launch handelbar werden.",
    summary:
      "Kostenlose Demo mit exklusiven Sammelobjekten, die es später nicht mehr geben wird und die nach dem Launch des vollen Spiels auf dem Steam-Marktplatz handelbar sind. Launch-Party auf Discord am selben Tag.",
  },
  "creator-program": {
    title: "Creator Program angekündigt, Details in einem AMA auf Discord",
    metaTitle: "Origins TCG Creator Program angekündigt, AMA auf Discord",
    description:
      "Koin Games öffnet vor dem Next Fest das Creator Program von Origins TCG. Details im AMA vom 19. August, Aufzeichnung auf Discord. OriginsMeta bewarb sich.",
    summary:
      "Koin Games öffnet vor dem Steam Next Fest ein Creator Program. Die Details gab es in einem AMA am 19. August um 20:00 Uhr UTC; die Aufzeichnung ist auf Discord. OriginsMeta hat sich beworben.",
  },
  "community-open": {
    title: "Offizieller Discord öffnet für alle",
    metaTitle: "Offizieller Discord von Origins TCG öffnet für alle",
    description:
      "Der offizielle Discord von Origins TCG, Heimat der ersten Alpha-Tester, öffnet für alle, mit einer bald erwarteten Demo und einem Blick auf die Sammelobjekte.",
    summary:
      "Der Server, auf dem die ersten Alpha-Tester spielten, öffnet sich für alle, mit einer Demo, die bald kommen soll, und einem ersten Blick auf die Sammelobjekte.",
  },
  "metal-cards-tease": {
    title: "Physische Metallkarten vom CEO angeteasert",
    metaTitle: "Origins TCG: physische Metallkarten vom CEO angeteasert",
    description:
      "Koin-Games-CEO Tim Jooste wurde mit Sammelkarten aus Metall zu Origins TCG gefilmt. Kein Produkt, kein Datum: ein Signal der Absicht, mehr noch nicht.",
    summary:
      "Tim Jooste wurde mit Sammelkarten aus Metall gefilmt, die auf der Marke des Spiels basieren. Kein Produkt und kein Datum angekündigt: ein Signal der Absicht von einem Studio, das zuerst digital denkt.",
  },
  "steam-page-live": {
    title: "Steam-Seite online: Wunschliste offen, die Demo kommt",
    metaTitle: "Steam-Seite von Origins TCG online: Wunschliste offen",
    description:
      "Die Steam-Seite von Origins TCG ist online, die Wunschliste offen, mit dem ersten Post des Teams: schnelle taktische Matches, Sammeln wie bei physischen TCGs.",
    summary:
      "Erster Steam-Post des Teams: ein Sammelkartenspiel rund um schnelle taktische Matches und ein Sammelsystem nach dem Vorbild physischer TCGs.",
  },
  "digital-lgs-program": {
    title: "Digital LGS Program: Origins TCG will lokale Spieleläden für wöchentliche Turniere und den Verkauf seiner Sets",
    metaTitle: "Origins TCG Digital LGS Program: Spieleläden",
    description:
      "Der Gründer von Koin Games stellt das Digital LGS Program für Origins TCG vor: wöchentliche Turniere, Promos nur vor Ort, Set-Vorbestellungen in Spieleläden.",
    summary:
      "Am 6. Oktober hat Tim Jooste, Gründer und CEO von Koin Games, auf X das Digital LGS Program vorgestellt: Lokale Spieleläden richten wöchentliche Origins-Turniere aus, verkaufen Packs und Promos, die es nur im Laden gibt, und nehmen Vorbestellungen von Sammel-Sets an, die im Spiel nicht erhältlich sein werden. Die Events vor Ort starten Anfang 2027; Set 1 geht am 27. Oktober auf Kickstarter, mit den Läden beim Launch an Bord. Am 8. Oktober hat der offizielle Origins-Account die Bedingungen ergänzt: Die Läden nehmen Vorbestellungen gegen einen Anteil am Umsatz an, ohne Kosten und ohne Lagerbestand, weil alles ein Steam-Inventargegenstand ist, und richten im Gegenzug Organized-Play-Events aus.",
    highlights: [
      { label: "Das Digital LGS Program", text: "der Gründer von Koin Games stellt es auf X vor: Sets von Origins, vertrieben über lokale Spieleläden", anchor: "programm" },
      { label: "Turniere, Promos, Vorbestellungen", text: "wöchentliche Turniere im Laden, Packs und Promos nur vor Ort, Vorbestellungen von Sets, die es im Spiel nicht gibt", anchor: "laeden" },
      { label: "Wie es für die Läden funktioniert", text: "Vorbestellungen mit Umsatzanteil, ohne Kosten und ohne Lager, im Gegenzug Organized Play (8. Oktober)", anchor: "bedingungen" },
      { label: "Anfang 2027, Kickstarter am 27. Oktober", text: "Events vor Ort ab Anfang 2027; Set 1 startet auf Kickstarter mit den Läden an Bord, schon über 30 interessiert", anchor: "termine" },
      { label: "Creator und ein AMA", text: "Streamer und Creator bekommen ein eigenes Programm; AMA für Läden und Creator am 12. Oktober um 21:00 Uhr UTC", anchor: "creator" },
      { label: "Was wir nicht wissen", text: "welche Läden und Länder, der Umsatzanteil, wie oft Events stattfinden und wann sie starten", anchor: "was-wir-nicht-wissen" },
    ],
    body: `## Das Digital LGS Program {#programm}

Am 6. Oktober 2026 hat **Tim Jooste**, Gründer und CEO von Koin Games, auf X einen langen Post mit einem kurzen Video veröffentlicht. Er beschreibt einen Abend in deinem lokalen Spieleladen (LGS, local game store), nur mit deinem Handy: ein Abend mit Origins-Matches gegen die Spieler deiner Stadt, eine Promo exklusiv für den Laden, um die du spielst, und ein Booster des nächsten Sammel-Sets zum Vorbestellen. Das Studio nennt es das **Digital LGS Program**, und nach seinen Worten macht es Origins zum „ersten digitalen Kartenspiel, das Sets über lokale Spieleläden auf der ganzen Welt vertreibt“.

Das ist die Behauptung des Gründers, nichts, was wir prüfen können. Was der Post klar sagt, ist die Form des Programms: ein digitales Kartenspiel mit einem physischen Netz von Läden, die seine Events ausrichten und seine Sets verkaufen.

**Update vom 11. Oktober:** Am 8. Oktober hat der offizielle Origins-Account auf X erklärt, wie das Programm für die Läden funktioniert. Sie nehmen Vorbestellungen an und bekommen einen Anteil am Umsatz, die Teilnahme kostet nichts und es gibt keinen Lagerbestand, weil Karten und Packs Steam-Inventargegenstände sind. Im Gegenzug richten die Läden Organized-Play-Events aus, der einzige Ort, an dem man manche Promos und Spezial-Packs bekommen kann. Der Account hat außerdem ein AMA für Ladenbesitzer und Creator am Montag, 12. Oktober, um 21:00 Uhr UTC angekündigt. Die Details stehen in den Abschnitten unten.

## Was die Läden bekommen und was die Spieler bekommen {#laeden}

Der Post nennt vier Dinge:

- **Lokale wöchentliche Turniere**, gespielt im Laden.
- **Exklusive Packs und Promos nur vor Ort**: Karten, die du nur bekommst, wenn du hingehst.
- **Vorbestellungen der kommenden Sammel-Sets**, die im Spiel nicht erhältlich sein werden, mit Belohnungen dafür, dass du deinen Laden unterstützt.
- Und, wie der Post es formuliert, echte Menschen treffen, spielen und vor Ort Freunde finden.

Läden, die mitmachen wollen, sollen sich direkt an Jooste wenden: Seine Direktnachrichten auf X sind offen, und er bietet ein Gespräch an.

## Wie es für die Läden funktioniert: die Details vom 8. Oktober {#bedingungen}

Zwei Tage nach dem Gründer, am 8. Oktober, hat der offizielle Account von Origins TCG auf X das Programm in einem längeren Post erklärt. Der Ausgangspunkt: Bei klassischen Kartenspielen bauen lokale Läden die Community auf, bringen neuen Spielern das Spiel bei und richten regelmäßige Events aus, und bei lokalen Turnieren werden oft die besten Preise gewonnen. Origins ist von Grund auf digital, sagt der Post, aber seine Community verdient trotzdem echte Orte, um sich zu treffen. Die Bedingungen:

- **Vorbestellungen und ein Anteil am Umsatz.** Teilnehmende Läden können Vorbestellungen für Sammelprodukte von Origins annehmen und bekommen einen Anteil am Umsatz. Wie groß der Anteil ist, sagt der Post nicht.
- **Kein Lagerbestand.** Karten, Packs, Displays und Cases existieren als Steam-Inventargegenstände, also kaufen die Läden keine Ware ein, halten kein Lager, opfern keine Regalfläche und verschicken keine Bestellungen.
- **Null Kosten.** Die Teilnahme „kostet buchstäblich 0 Dollar“, sagt der Post, während die Läden genauso stark, wenn nicht stärker am Erfolg beteiligt sind wie bei einem physischen Kartenspiel. Dieser Vergleich stammt von Koin.
- **Organized Play im Gegenzug.** Teilnehmende Läden richten Organized-Play-Events aus. Origins schickt die Spieler zu diesen Läden und unterstützt sie als lokale Treffpunkte für das Spiel.
- **Belohnungen, die es nur bei Events gibt.** Einzigartige Promokarten und Spezial-Packs gibt es nur für die Teilnahme und das Spielen in teilnehmenden Läden. Origins wird diese Turnierkarten nicht verkaufen und nicht in normale Packs legen.
- **Ein Netz, das wachsen kann.** Organized Play beginnt mit vierteljährlichen lokalen Events und kann sich zu häufigeren Wettbewerben, regionalen Events und irgendwann zu einer Struktur mit Weltmeisterschaft entwickeln.

Ein Detail passt noch nicht zusammen: Der Post des Gründers sprach von wöchentlichen Turnieren in den Läden, der offizielle Post lässt das Netz mit vierteljährlichen lokalen Events beginnen. Keiner der beiden Posts erklärt, wie das zusammengeht.

## Termine: Anfang 2027, mit dem Kickstarter am 27. Oktober {#termine}

- Die **Events vor Ort starten offiziell Anfang 2027**. Die Läden, sagt der Post, müssen nicht bis dahin warten.
- **Set 1 geht am 27. Oktober 2026 auf Kickstarter**: dasselbe Datum, das der Gründer am 17. September genannt hat und das die Demo in ihrem Menü zeigt (unser [Guide zum Kickstarter](/de/guides/origins-tcg-kickstarter) sammelt alles, was bisher bestätigt ist). Anders als bei den meisten Kampagnen von Kartenspielen, schreibt Jooste, arbeitet Koin schon beim Launch selbst mit lokalen Läden zusammen.
- In **zwei Monaten** hat das Studio bereits mit **mehr als 30 Läden** gesprochen, die mitmachen wollen.

## Creator haben eine eigene Version {#creator}

Der Post ergänzt, dass es eine Version des Programms für Streamer und Content Creator gibt, ohne Details. Der Aufruf richtet sich auch an Spieler und Sammler: Markiere deinen Lieblingsladen oder deinen liebsten TCG-Creator unter dem Post.

Am 8. Oktober hat der offizielle Account im selben Thread ein **AMA zum Programm für Ladenbesitzer und Creator am Montag, 12. Oktober, um 21:00 Uhr UTC** angekündigt, in seinem Discord für Creator. Wer teilnehmen will, schickt @origins_tcg auf X eine Direktnachricht.

## Warum es wichtig ist {#warum-es-wichtig-ist}

Origins hat sich immer als kostenlos im Wettbewerb und für Sammler gebaut beschrieben: Ranked kostet nichts, und die Sammlung lebt auf [zwei Ebenen von Karten](/de/guides/collector-economy), kompetitiv und sammelbar. Bisher war die Sammelseite nur in digitaler Form angekündigt: die Packs der Alpha Edition auf Kickstarter, der Handel auf dem Steam-Community-Markt; der einzige physische Hinweis waren die im März gefilmten [Metallkarten](/de/news/metal-cards-tease). Ein Programm für Läden gibt ihr einen physischen Ort: das Turnier am Dienstagabend, die Promo, die du nur dort gewinnen kannst, das Set, das du an der Theke vorbestellst. Und, laut dem Post vom 8. Oktober, ohne physische Produkte: Was der Laden verkauft, bleibt im Steam-Inventar. Für ein digitales Spiel ist es auch ein Weg, Spieler dort zu finden, wo Kartenspiele schon gespielt werden.

Zwei Einschränkungen. Die Bedingungen kommen aus zwei Posts auf X, dem des Gründers und dem des offiziellen Accounts, nicht von einer offiziellen Seite mit Vertrag und Liste der Läden, und der Anteil am Umsatz, der an die Läden geht, wird nicht genannt. Und wenn du schon vor 2027 Turniere ausrichten willst, musst du nicht auf das Programm warten: Unser [Turnier-Organizer](/de/tournaments) ist kostenlos, und die Community nutzt ihn schon.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Welche Länder und Läden mitmachen und ob es eine öffentliche Liste geben wird.
- Wie groß der Umsatzanteil ist und wie eine im Laden gemachte Vorbestellung ins Steam-Inventar des Spielers kommt: ein Code, eine Verknüpfung mit dem Konto oder etwas anderes.
- Was „Sets, die im Spiel nicht erhältlich sind“ für die Sammlung bedeutet: Der offizielle Post sagt, dass die Produkte Steam-Inventargegenstände sind und dass die Turnier-Promos und Spezial-Packs nie verkauft werden, aber nicht, ob ganze Sets nur über Läden verkauft werden.
- Wie oft die Events in den Läden stattfinden (der Gründer schrieb wöchentlich, der offizielle Post beginnt mit vierteljährlichen lokalen Events), wann die ersten stattfinden und welche Regeln sie haben: private Räume im Spiel oder ein eigener Modus, und ob die Ergebnisse für regionale Events oder eine Weltmeisterschaft zählen.
- Die Preise, die Belohnungen für Vorbestellungen über einen Laden und wie Promos und Spezial-Packs bei Events vergeben werden.
- Die Bedingungen der Creator-Version. Das AMA vom 12. Oktober könnte einige dieser Fragen beantworten.

## Woher das kommt {#quelle}

Der [Post von Tim Jooste auf X](https://x.com/TimothyJooste/status/2107532013687418943) vom 6. Oktober 2026, mit einem 15-sekündigen Video, und der [Post des offiziellen Accounts von Origins TCG](https://x.com/origins_tcg/status/2108281049721491549) vom 8. Oktober 2026, mit der [Antwort, die das AMA ankündigt](https://x.com/origins_tcg/status/2108281052212985975). Am 7. Oktober gab es auf der Steam-Seite des Spiels noch keinen Post zum Programm; wir aktualisieren diesen Artikel nach dem AMA oder wenn Koin Games die offiziellen Bedingungen veröffentlicht.`,
    faq: [
      {
        q: "Was ist das Digital LGS Program von Origins TCG?",
        a: "Ein Programm, das Tim Jooste, Gründer und CEO von Koin Games, am 6. Oktober 2026 auf X angekündigt hat: Lokale Spieleläden richten wöchentliche Origins-Turniere aus, verkaufen exklusive Packs und Promos, die es nur vor Ort gibt, und nehmen Vorbestellungen der kommenden Sammel-Sets an, die im Spiel nicht erhältlich sein werden. Am 8. Oktober hat der offizielle Origins-Account die Bedingungen für die Läden ergänzt: Vorbestellungen mit Umsatzanteil, ohne Kosten und ohne Lager, im Gegenzug Organized-Play-Events. Eine Seite mit den vollständigen Bedingungen ist noch nicht veröffentlicht.",
      },
      {
        q: "Wann starten die Events von Origins TCG in den Läden?",
        a: "Laut dem Post starten die Events vor Ort offiziell Anfang 2027, aber Läden können schon vorher einsteigen: Set 1 geht am 27. Oktober 2026 auf Kickstarter, und Koin Games sagt, dass es beim Launch mit lokalen Läden zusammenarbeitet.",
      },
      {
        q: "Wie kann ein Spieleladen beim Programm von Origins TCG mitmachen?",
        a: "Indem er sich direkt an Koin Games wendet: Tim Jooste sagt, dass seine Direktnachrichten auf X offen sind, und bietet ein Gespräch an, und der offizielle Account bittet Ladenbesitzer und Creator um eine Direktnachricht, um am AMA zum Programm teilzunehmen, am Montag, 12. Oktober 2026, um 21:00 Uhr UTC. In zwei Monaten hatten sich laut dem Gründer schon mehr als 30 Läden gemeldet. Es gibt auch eine Version des Programms für Streamer und Content Creator.",
      },
      {
        q: "Was kostet einen Laden die Teilnahme am Programm von Origins TCG?",
        a: "Nichts, laut dem offiziellen Origins-Account (8. Oktober 2026): Karten, Packs, Displays und Cases sind Steam-Inventargegenstände, also kaufen die Läden keine Ware ein, halten kein Lager und verschicken keine Bestellungen. Sie nehmen Vorbestellungen an und bekommen einen Anteil am Umsatz, dessen Höhe nicht veröffentlicht ist, und richten im Gegenzug Organized-Play-Events aus.",
      },
    ],
  },
  "crimson-cup-prizepool-qualifiers": {
    title: "Crimson Cup: das Preisgeld enthüllt, zwei weitere Qualifikationen und sieben Orte aus dem Turnier genommen",
    metaTitle: "Origins TCG Crimson Cup: Preisgeld und neue Qualifikationen",
    description:
      "Das Preisgeld der Crimson Cup von Origins TCG: 1/1-Promokarte Dracula und 1.500 Dollar für den Sieger, Packs bis zur Top 256, zwei neue Qualifikationen.",
    summary:
      "Am 5. Oktober hat Koin Games die Aufteilung der Preise der Crimson Cup veröffentlicht: Der Sieger bekommt eine 1/1-Promokarte von Dracula, zwei Cases mit Booster-Displays und 1.500 Dollar in bar, und alle in der Top 256 bekommen mindestens zwei Packs. Der Post fügt außerdem zwei Qualifikationen hinzu, AMER am 19. Oktober um 19:00 Uhr EST und EMEA am 22. Oktober um 19:00 Uhr CEST, nimmt sieben stark zufallsabhängige Orte aus dem Turnierpool und kündigt wöchentliche Übungsturniere an.",
    highlights: [
      { label: "Das Preisgeld", text: "1/1-Promokarte Dracula, zwei Cases und 1.500 Dollar für den Sieger; Packs bis zur Top 256", anchor: "preise" },
      { label: "Zwei weitere Qualifikationen", text: "AMER am 19. Oktober um 19:00 Uhr EST und EMEA am 22. Oktober um 19:00 Uhr CEST, aus jeder kommen 32 weiter", anchor: "qualifikationen" },
      { label: "Was sich im Zeitplan ändert", text: "AMER am 21. um 21:00 Uhr EST mit 32 Weiterkommenden, 96 Wildcards", anchor: "zeitplan" },
      { label: "Sieben Orte raus", text: "Junkyard, Cloning Lab, Reflecting Pool und vier weitere, in den Raumkämpfen schon abgeschaltet", anchor: "orte" },
      { label: "Übungsturniere", text: "wöchentlich, ohne Einsatz, das nächste noch diese Woche", anchor: "training" },
    ],
    body: `## Das Preisgeld {#preise}

Das Preisgeld besteht, in den Worten des Teams, „aus einer Aufteilung zwischen Geldpreisen, Sammelobjekten und exklusiven Promokarten“. Alle, die die Top 256 erreichen, haben Anspruch auf die erste Stufe der Preise; Promokarten gibt es ab der Top 32. Die Grafik mit den Belohnungen, die dem Post beiliegt, zeigt die Aufteilung:

| Platz | Promokarte | Produkt | Geld |
|---|---|---|---|
| Sieger | 1/1-Promokarte Dracula | 2 Cases mit Booster-Displays | 1.500 $ |
| 2. | 1/8-Promokarte Dracula | 1 Case mit Booster-Displays | 750 $ |
| 3. und 4. | 1/8-Promokarte Dracula | 2 Booster-Displays | 350 $ |
| Top 8 | 1/8-Promokarte Dracula | 1 Booster-Display | 125 $ |
| Top 16 | Karte Finalist Plus | 1 Booster-Display | – |
| Top 32 | Karte Finalist | 10 Packs | – |
| Top 64 | – | 8 Packs | – |
| Top 128 | – | 4 Packs | – |
| Top 256 | – | 2 Packs | – |

Die Promokarte auf der Grafik ist ein goldener Dracula mit der Aufschrift „Tournament Winner“, Myths & Legends #209, gezeigt in einem Grading-Slab. Die Zeile „Prizes worth $10,000“ aus der Ankündigung vom September steht noch auf der neuen Kalendergrafik. Die Playoffs haben 256 Plätze, also nimmt nach Koins eigenen Zahlen jeder, der eine Qualifikation übersteht oder mit einer Wildcard einsteigt, schon mindestens zwei Packs mit nach Hause.

## Zwei weitere Qualifikationen {#qualifikationen}

„Aufgrund der großen Nachfrage“ fügt Koin während des Steam Next Fest zwei Qualifikationen hinzu, eine für Amerika und eine für die Zeitzonen von EMEA:

1. **AMER, Montag, 19. Oktober, um 19:00 Uhr EST.**
2. **EMEA, Donnerstag, 22. Oktober, um 19:00 Uhr CEST**, die die Qualifikationen abschließt.

Jede schickt 32 Spieler in die Playoffs, wie die anderen drei. Die Bitte des Teams ist dieselbe wie im September: Melde dich nur für die Turniere an, an denen du wirklich teilnehmen kannst, und lass die Plätze den anderen Spielern. Die Anmeldung läuft über den [offiziellen Discord](https://discord.gg/originstcg). Der Check-in funktioniert wie bisher: Er öffnet zwei Stunden vor jeder Qualifikation und schließt fünf Minuten vor dem Start, zusammen mit der Deckabgabe ([die Regeln](/de/news/crimson-cup-format-check-in#check-in)).

## Was sich im Zeitplan ändert {#zeitplan}

Der Post spricht nur über die zwei neuen Qualifikationen, aber die beigefügte Kalendergrafik ändert auch andere Zahlen. Die fünf Qualifikationen, mit je 512 Plätzen und je 32 Weiterkommenden:

- AMER, 19. Oktober, 19:00 Uhr EST (neu);
- EMEA, 20. Oktober, 19:00 Uhr CEST;
- AMER, 21. Oktober, 21:00 Uhr EST: Die Grafik vom September sagte 19:00 Uhr EST und 64 Weiterkommende, jetzt durchgestrichen;
- APAC, 22. Oktober, 19:00 Uhr SGT;
- EMEA, 22. Oktober, 19:00 Uhr CEST (neu).

Die Wildcards sinken von 128 auf 96: fünfmal 32 plus 96 ergibt 256, das Feld der Playoffs. Playoffs und Finale verschieben sich nicht: Playoffs am 24. Oktober um 10:00 Uhr EST (16:00 Uhr CEST, 22:00 Uhr SGT), vier Spieler kommen ins Finale am 25. Oktober um 10:00 Uhr EST. Das Turnier beginnt jetzt am 19. Oktober, dem ersten Tag des Steam Next Fest, statt am 20. Daten und Uhrzeiten sind, wie immer auf dieser Website, die der offiziellen Grafik, ohne eigene Umrechnungen.

## Sieben Orte aus dem Turnier genommen {#orte}

„Es gibt ein paar ausgewählte Orte in Origins, die sehr stark vom Zufall abhängen“, sagt der Post, deshalb sind sieben für das Turnier abgeschaltet: [Junkyard](/de/locations#junkyard), [Cloning Lab](/de/locations#cloning-lab), [Reflecting Pool](/de/locations#reflecting-pool), [Amplifying Amphitheatre](/de/locations#amplifying-amphitheatre), [Giant's Beacon](/de/locations#giants-beacon), [The Colosseum](/de/locations#the-colosseum) und [Nostradamus' Call](/de/locations#nostradamus-call). Was jeder davon tut, steht auf unserer [Seite der Orte](/de/locations).

Dieser Turnierpool ist in der Demo schon aktiv, wenn du Raumkämpfe spielst (Create/Join Room Battle): Dort trainierst du mit den Orten der Crimson Cup. Den Pool hat das [Playtest-Update vom 1. Oktober](/de/news/playtest-patch-notes-1001#turnierpool) eingeführt, das noch nicht gesagt hatte, welche Orte rausfallen.

## Übungsturniere {#training}

Da die meisten Matches der Demo gegen Bots laufen, richtet Koin wöchentliche Übungsturniere aus: ohne Einsatz, einfach ein Ort, um gegen echte Menschen zu spielen und deine Decks zu testen. Das nächste ist noch diese Woche; Tag und Uhrzeit werden bald bekanntgegeben, und die Anmeldung läuft über denselben [Discord](https://discord.gg/originstcg). Wenn du selbst eines mit den Regeln der Crimson Cup ausrichten willst, unterstützt der [Turnier-Organizer](/de/tournaments) von OriginsMeta Check-in, geheime Decklisten und Best-of-Three-Matches.

## Was es für die Spieler bedeutet {#was-es-bedeutet}

- **Mehr Plätze und mehr Zeitfenster.** Fünf Qualifikationen statt drei, zwei in europäischen und zwei in amerikanischen Zeitfenstern: Wähl die, die du wirklich spielst.
- **Alle in den Playoffs bekommen etwas.** Zwei Packs ab der Top 256, eine Karte Finalist ab der Top 32, Geld ab der Top 8.
- **Bau deine Decks ohne die sieben Orte.** Die Kopien von Cloning Lab und Reflecting Pool gibt es bei der Crimson Cup nicht. Unser [Guide zu Conquest](/de/guides/origins-tcg-conquest) und der [Deck builder](/de/deck-builder) helfen bei den drei Decks.

## Was wir noch nicht wissen {#was-wir-nicht-wissen}

- Tag und Uhrzeit des Übungsturniers dieser Woche.
- Ob die Zeile Top 8 der Preisgrafik die Plätze 5 bis 8 meint, mit je einem Preispaket: So lesen wir sie.
- Warum die AMER-Qualifikation vom 21. Oktober auf der neuen Grafik um 21:00 Uhr EST und auf der vom September um 19:00 Uhr EST liegt: Der Post sagt es nicht.
- Wie die einzigartigen Karten zwischen zwei Decks gezählt werden, seit den [Regeln vom 24. September](/de/news/crimson-cup-format-check-in#format) noch offen.

## Woher das kommt {#quellen}

- Der [offizielle Steam-Post](https://store.steampowered.com/news/app/4429430/view/1845383656394214) vom 5. Oktober 2026, „Prizepool announcement & key update to our biggest tournament ever“, mit seinen zwei Grafiken: den Belohnungen und dem aktualisierten Kalender.
- Die [Ankündigung vom 9. September](/de/news/biggest-tournament-ever) und die [Regeln vom 24. September](/de/news/crimson-cup-format-check-in), für die Zahlen, die sich geändert haben.`,
    faq: [
      {
        q: "Was bekommt der Sieger der Crimson Cup?",
        a: "Eine 1/1-Promokarte von Dracula, zwei Cases mit Booster-Displays und 1.500 Dollar in bar, laut der Grafik mit den Belohnungen, die Koin Games am 5. Oktober 2026 veröffentlicht hat. Der Zweite bekommt eine 1/8-Promokarte von Dracula, ein Case und 750 Dollar; der Dritte und der Vierte eine 1/8-Promokarte, zwei Booster-Displays und 350 Dollar.",
      },
      {
        q: "Wann sind die Qualifikationen der Crimson Cup jetzt?",
        a: "Fünf Qualifikationen mit je 512 Plätzen: AMER am 19. Oktober um 19:00 Uhr EST, EMEA am 20. Oktober um 19:00 Uhr CEST, AMER am 21. Oktober um 21:00 Uhr EST, APAC am 22. Oktober um 19:00 Uhr SGT und EMEA am 22. Oktober um 19:00 Uhr CEST. Aus jeder kommen 32 Spieler weiter, dazu 96 Wildcards, in die Playoffs vom 24. Oktober.",
      },
      {
        q: "Welche Orte sind bei der Crimson Cup raus?",
        a: "Sieben: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum und Nostradamus' Call, abgeschaltet, weil sie zu stark vom Glück abhängen. Die Raumkämpfe in der Demo verwenden schon den Turnierpool.",
      },
    ],
  },
};
