# Tracker/overlay

Guida tecnica del tracker di OriginsMeta (stato, decisioni e storia anche nella KB, §1 punto 46). Nome deciso da
Pierluigi il 26/09/2026: il **tracker** registra le partite, l'**overlay** le mostra.

## Cos'è

Un'**app desktop per Windows** (Pierluigi, 29/09/2026: "perché non un'app? è più carina e vendibile che una roba sul
web") che, mentre il giocatore usa Origins TCG, legge in sola lettura i file che il gioco salva sul PC e registra da
sola ogni partita: esito, mazzo usato con il codice del gioco, mazzo dell'avversario, carte giocate turno per turno.
L'overlay mostra questi dati al giocatore (finestra sopra il gioco) e a chi fa dirette (sorgente per OBS); il sito
riceve dati anonimi per lo storico personale e, più avanti, per il meta.

Permesso: Kevin di Koin Games (Pierluigi, 29/09/2026: "il permesso lo abbiamo"; testo e data da archiviare in
`G:\Il mio Drive\OriginsMeta\10_Materiale_Koin\`, come quello del 19/09 sul materiale ufficiale).

## Fasi

| Fase | Cosa | Stato |
|---|---|---|
| 0 | Verifiche: permesso, termini d'uso, partite di prova, scelta fra app e pagina web | fatta il 29/09/2026 |
| 1 | Lettore dei file (cache + replay), funzioni pure con i test: `src/lib/tracker/` | fatta il 29/09/2026 |
| 2 | App base (Electron, consigliata): icona nella barra, avvio con Windows, partite registrate da sola, storico sul PC | da fare |
| 3 | Collegamento al sito: account OriginsMeta, tabella delle partite con RLS, pagina `/tracker`, pagina per scaricare l'app | da fare |
| 4 | Overlay: finestra separata sopra il gioco e sorgente per OBS (partendo da `/overlay/deck`, pacchetto STREAM) | da fare |
| 5 | Installer firmato (certificato o Microsoft Store), aggiornamenti automatici, prova con pochi giocatori, lancio | da fare |

Calendario proposto il 27/09: fasi 1–2 dal 3 al 6/10 (ricontrollo dei file dopo la patch di inizio ottobre), fasi 3–4
dal 7 al 12/10, prova dal 12 al 18/10, Next Fest dal 19/10.

## Regole

1. **Solo lettura.** Nessun blocco sui file (lettura condivisa, chiusura subito); mai il processo del gioco (memoria,
   iniezioni, rete); mai i token della cache per chiamare i server di Koin; overlay come finestra separata o sorgente
   di OBS, mai agganciato alla grafica del gioco. Nel gioco c'è l'Anti-Cheat Toolkit di CodeStage, che non controlla
   chi legge i file (verifica del 27/09): va rifatta a ogni patch.
2. **Mai dire se l'avversario è un bot o una persona** (Pierluigi, 29/09/2026): niente flag bot, niente modalità del
   nome del file ("BotBattle"), niente rank dell'avversario (quello dei bot è un "Master" finto), in nessuna parte:
   app, overlay, sito, file esportati, nomi delle copie dei replay. Il flag si legge solo dentro il lettore per
   riconoscere il giocatore (`pickMe`). Test: "mai dire se l'avversario è un bot o una persona" in `tracker.test.ts`.
3. **Mai nomi né id** di giocatori o partite fuori dal lettore: dell'id della partita resta un'impronta salata con
   l'id dell'account (`matchFingerprint`). I termini di Koin vietano di raccogliere dati di altri utenti senza
   consenso (Terms of Use, §2.3).
4. L'overlay non mostra durante la partita niente che il gioco nasconde (il replay arriva comunque a fine partita).
5. A ogni patch: rilanciare `npm test` sul PC con il gioco (il test "file veri del gioco su questo PC" legge replay e
   cache veri, se ci sono) e una partita di prova.

## I file del gioco

| File | Dove | Quando cambia | Cosa ci serve |
|---|---|---|---|
| Statistiche del profilo | `%USERPROFILE%\AppData\LocalLow\Koin Games\Origins TCG Demo\beamable\cache\<cid>\<realm>\<versione>\<impronta>.json` | pochi secondi dopo ogni partita; `ActiveUserDeckIndex` appena si sceglie il mazzo; all'avvio del gioco si riscrive senza cambiare valori | esito, ora e id dell'ultima partita, mazzo scelto, id dell'account (solo per riconoscere il giocatore) |
| Inventario | stessa cartella | circa 15 s dopo la partita | i mazzi: nome, 13 chiavi delle carte |
| Replay | `%USERPROFILE%\Documents\My Games\Origins TCG Demo\Replays\LatestMatch_<modalità>_<aaaa-mm-gg_hh-mm-ss>.replay` | a fine partita, **sovrascritto dalla successiva** | mazzi di tutti e due, rank, giocate |
| `Player.log` | cartella del gioco in LocalLow | sempre | niente: solo messaggi del motore |
| File dell'account | cache di Beamable (quelli con `email`) | al login | **mai letti né copiati** |

I nomi dei file della cache sono impronte che cambiano da un account all'altro: si riconoscono dal contenuto
(`readStatsFile`, `readInventoryFile`). La cartella Documenti può essere spostata da OneDrive: nell'app si usa la
cartella Documenti di Windows, non un percorso scritto a mano. Su Mac il nome del replay è
`LatestMatch_<nome>_vs_<nome>_<data>.replay` (con i nomi dei giocatori: `replayFileInfo` non li restituisce).

### Statistiche

`results[0].stats` è un elenco di coppie `k`/`v`; `results[0].id` è l'id dell'account. Chiavi usate:

- `lastMatchPlayedDateTime`: fine dell'ultima partita (UTC, 7 decimali);
- `onboardingResults`: esiti, **il più recente a sinistra** ("LWW…"); cresce a ogni partita (24 il 29/09/2026), anche
  con l'abbandono (una L);
- `onboardingLastMatchId`: `offline_<uuid>` in tutte le partite viste (29/09: tutte contro l'IA);
- `ActiveUserDeckIndex`: posizione del mazzo nell'ordine dell'inventario.

Non servono (significato ignoto o inaffidabile): `winWindow1/2`, `lossWindow1/2`, `BattleMode` (sempre 0),
`ChallengeChallengeCounter`.

### Inventario

`items` → gruppo `items.Deck.Web2Deck` → ogni mazzo ha `properties`: `Config` (JSON con `DisplayName` e `Cards`
[{`CardKey`, `CardId`}]) e `DeckPresetKey` (D00001… per i mazzi iniziali della demo). Chiavi delle carte come nel
database del sito e nel codice KGBLDC, con la variante: `C00176_MC_V00000`. Suffisso: prima lettera M unità / S magia,
seconda C Leggendaria / B carta base.

### Replay

Binario a campi con tag. Grammatica dal decodificatore pubblico github.com/bentodd1/origins-tracker (build 0.6.3,
Mac), più il tag `0x00` (valore vuoto) che la Demo 2.0 per Windows usa:

```
file   := u8 versione, poi (idCampo u8, valore)* fino alla fine
valore := tag u8 + contenuto
  00 vuoto · 01 bool (u8) · 02 u8 · 03 i8 · 04 i16le · 05 i32le · 07 u16le · 0e stringa (varint + utf8)
  0f array: tag degli elementi u8, numero u16le, elementi senza tag (11 = oggetti, ognuno preceduto da 0x10)
  10 oggetto: tipo u8, numero di campi u8, poi (idCampo u8, valore) per ogni campo
```

Campi (versione 5, confermati su 5 replay il 29/09/2026):

- in testa: `2` configurazione (`0` arena "03_Arena", `37` luoghi "Pool_0001"), `3` i due giocatori, `4` i record
  dei turni;
- giocatore: `0` id dell'account, `1` nome, `2` bot, `5.0` mazzo (13 carte più una voce "Tower…" che non è una
  carta), `6` titolo, `7` rank, `8` avatar, `11` eroe (`H00xx`, non la Leggendaria);
- record dei turni: `0` eventi. Evento `3` = giocata confermata (`2` giocatore, `50` istanza, `51` corsia, 255 per
  le magie, `53` posto); evento `1` nel record 2 = carta del mulligan (da confermare). Il record 2 è il mulligan, poi
  4 record per turno (record 4 = turno 1, 8 = turno 2…);
- istanze: ogni carta del mazzo ne ha due consecutive nell'ordine della lista, la Leggendaria una; il giocatore 0
  parte da 1, il giocatore 1 da 30; oltre il mazzo sono carte generate in partita. Su 5 replay: 0 giocate fuori
  regola (`ReplayMatch.unmapped`).

Il replay **non contiene l'esito**: sta nelle statistiche. Replay e statistiche arrivano a 1–2 secondi l'uno
dall'altro e si abbinano per ora (`replayBelongsTo`, finestra di 2 minuti).

## Codice (Fase 1)

- `src/lib/tracker/replay.ts`: `parseReplay` (albero grezzo, `ReplayFormatError` se il formato cambia), `readReplay`
  (giocatori, mazzi, giocate, mulligan; mai nomi né id), `replayFileInfo`.
- `src/lib/tracker/profile.ts`: `readStatsFile`, `readInventoryFile`, `detectMatchEnd` (esito dalla lettera aggiunta a
  sinistra; le lettere in più sono partite perse per strada, `missed`).
- `src/lib/tracker/match.ts`: `buildMatch` → `TrackedMatch` (il record che l'app salva: esito, mazzo con nome e codice
  del gioco, rank, mazzo dell'avversario, giocate), `matchFingerprint`, `pickMe`, `replayBelongsTo`.
- `src/lib/tracker/tracker.test.ts` (in `npm test`): replay finti costruiti nel test (nessun file del gioco nel repo),
  più i file veri del PC se ci sono.

Tutto è puro (niente file system): l'app della Fase 2 legge i file e passa il testo o i byte.

## Da decidere

- **Cosa arriva al sito** (Fase 3): il mazzo completo dell'avversario (il gioco non lo mostra) o solo le carte che ha
  giocato; se il segnale bot può servire, senza mai mostrarlo, a tenere fuori quelle partite dai dati pubblici.
- Firma e distribuzione dell'app (certificato annuale o Microsoft Store), dove pubblicare installer e aggiornamenti.
- Uso dei dati del client (poteri leggendari, luoghi): contengono anche carte non annunciate.
