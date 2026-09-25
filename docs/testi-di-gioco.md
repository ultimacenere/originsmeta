# Testi di gioco in italiano e spagnolo (dal 25/09/2026)

Il gioco è tradotto: nella Demo 2.0 le carte hanno un testo ufficiale anche in italiano e in spagnolo, con le parole
chiave tradotte. Il 25/09/2026 li abbiamo letti tutti nel gioco (122 carte, collezione con le carte non possedute) e
ora sono quelli del sito. Questo file dice cosa ne segue e come rifare la verifica.

## La regola

- **Testi di gioco** (testo delle carte, carte create e rimosse, effetti dei luoghi): in italiano e spagnolo si usa il
  **testo ufficiale del gioco** quando c'è (`it` ed `es` in `src/lib/data/card-lore.ts`), altrimenti una traduzione
  nostra scritta con il **glossario ufficiale** qui sotto (carte create e rimosse, che la collezione non mostra; luoghi,
  finché non li confrontiamo nel gioco).
- **Nomi** di carte, carte create, luoghi e mazzi: restano in inglese, come nel gioco ("Evoca una Broomstick",
  "Invoca a Tweedledee", "tre Pumpkins").
- **Testi editoriali** (guide, news, storico dei bilanciamenti, interfaccia, guide dei mazzi tradotte in automatico):
  per ora tengono le parole chiave in inglese (On Reveal, Trample…) e "casella" / "casilla". Allinearli al gioco è
  una scelta di Pierluigi, ancora da fare (KB §1): sono circa 160 parole chiave e 45 "casella" per lingua fra guide
  e news.

## Glossario ufficiale

Letto nei testi delle carte del gioco. Le parole chiave hanno la maiuscola anche a metà frase, come nel gioco.

| inglese | italiano | spagnolo |
|---|---|---|
| On Reveal: | Alla rivelazione: | Al revelar: |
| On Death: | Alla morte: | Al morir: |
| On Kill: | All'uccisione: | Al matar: |
| Shield | Scudo | Escudo |
| Trample | Travolgere | Arrollar |
| Deathtouch | Tocco letale | Toque mortal |
| Defender | Difensore | Defensor |
| Rebirth | Rinascita | Renacer |
| First Strike | Primo colpo | Primer golpe |
| Double Attack | Doppio attacco | Ataque doble |
| Snipe 2 | Tiro di precisione 2 | Disparo certero 2 |
| Move (parola chiave) | Muovere | Mover |
| Move an ally / I move | Muovi un alleato / mi muovo | Mueve a un aliado / me muevo |
| I can Move each round | Posso Muovermi ogni round | Puedo Moverme cada ronda |
| Stun ANY character | Stordisci QUALSIASI personaggio | Aturde a CUALQUIER personaje |
| space | spazio (maschile: "uno spazio casuale") | espacio ("un espacio aleatorio") |
| location | luogo | ubicación |
| barrier / opponent's barrier | barriera / barriera avversaria | barrera / barrera del oponente |
| graveyard, board | cimitero, tabellone | cementerio, tablero |
| a Good / Evil character (nel testo) | un personaggio Buono / i personaggi Malvagi | un personaje Bueno / los personajes Malvados |
| ANY, ALL | QUALSIASI, TUTTI / TUTTE | CUALQUIER, TODOS / TODAS |
| Choose one: … OR … | Scegline uno: … OPPURE … (anche "Scegli uno: … O …") | Elige una: … O … |
| deal 3 damage | Infliggi 3 danni ("1 danno") | Inflige 3 de daño |
| heal 3 damage from | Cura 3 danni a | Cura 3 de daño de |
| return … to its owner's hand | Riporta … nella mano del suo proprietario | Devuelve … a la mano de su dueño |
| permanently | in modo permanente / permanentemente | permanentemente |
| this round, each round, next round | in questo round, ogni round, nel prossimo round | esta ronda, cada ronda, la próxima ronda |
| +1 mana | +1 mana | +1 maná |
| Summon, Draw, Discard, Destroy | Evoca, Pesca, Scarta, Distruggi | Invoca, Roba, Descarta, Destruye |

Etichette sulla carta: **Good / Evil** restano in inglese anche nel gioco tradotto (è la fascia sotto il nome), mentre
nel testo delle regole il gioco scrive "Buono / Malvagi" e "Bueno / Malvados".

Stile del gioco da imitare nei testi nostri:
- **Italiano**: ⚔️ è femminile ("la mia ⚔️", "pari alla sua ⚔️", "la ⚔️ più bassa"); il personaggio parla al maschile
  anche quando è una donna ("Quando vengo scartato", Esmeralda); le abilità "avvengono" ("Quando avviene un'abilità
  Alla rivelazione", "Impedisci che TUTTE le abilità Alla rivelazione avvengano qui").
- **Spagnolo**: indicativo dopo "cuando" ("Cuando juegas", "Cuando recibo daño", "Cuando un enemigo daña") e dopo
  "después de que" ("Después de que un enemigo es jugado aquí"); congiuntivo solo dove la grammatica lo vuole ("el
  primer hechizo que juegues", "hasta que sea objetivo"); le abilità "ocurren"; "frente a mí" / "frente a él";
  personaggio al maschile ("Cuando soy descartado").

## Come si rifà la verifica (dopo ogni patch)

1. Nel gioco, lingua italiana o spagnola: "I miei deck" / "Mis mazos" → scheda Carte, filtro "Non posseduto" /
   "No poseído" acceso (le carte non possedute sono sbiadite, conviene ingrandirle), ordine per mana. Otto carte per
   schermata; tre scatti della rotella scorrono di una fila.
2. Si trascrive in `docs/testi-ufficiali/<lingua>.tsv`, una carta per riga ("Nome<TAB>testo", `\n` per gli a capo,
   statistiche come nel sito: `[5⚔️/3❤️]`). Il file com'è oggi è la lettura del 25/09/2026: basta correggere le righe
   che cambiano.
3. `node scripts/official-texts.mjs it` (o `es`) elenca le carte il cui testo nel sito è diverso dalla trascrizione e
   controlla che ci siano tutte le carte e gli stessi a capo dell'inglese; con `--apply` scrive in `card-lore.ts`.
4. Le carte nuove della patch prendono anche la riga `origin` e il resto della voce, come sempre.
