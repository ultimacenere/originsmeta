# Tracker/overlay

Guida tecnica del tracker di OriginsMeta (stato, decisioni e storia anche nella KB, §1 punto 46). Nome deciso da
Pierluigi il 26/09/2026: il **tracker** registra le partite, l'**overlay** le mostra. **Dal 01/10/2026 il nome pubblico
è OriginsMeta Analytics** (Pierluigi: "chiamiamolo Analytics e non tracker"): app, finestra, menu dell'icona, overlay e
testi del sito. Nel codice, negli indirizzi (`/account/tracker`, `/api/tracker/*`), nelle tabelle (`tracker_*`) e in
questa guida resta "tracker". **Dal 12/10/2026 (app 0.4.0) l'app si chiama di nuovo OriginsMeta Tracker** (Pierluigi:
"l'app si chiama OriginsMeta Tracker"): "Analytics" è il nome della pagina delle statistiche sul sito
(originsmeta.com/analytics), la pagina dell'app con download e guida è originsmeta.com/tracker. Vedi "Nome: OriginsMeta
Tracker (0.4.0)".

## Cos'è

Un'**app desktop per Windows** (Pierluigi, 29/09/2026: "perché non un'app? è più carina e vendibile che una roba sul
web") che, mentre il giocatore usa Origins TCG, legge in sola lettura i file che il gioco salva sul PC e registra da
sola ogni partita: esito, mazzo usato con il codice del gioco, mazzo dell'avversario, carte giocate turno per turno.
Collegata all'account OriginsMeta, manda le partite al sito: storico e statistiche personali in `/account/tracker`, e
statistiche anonime (win rate di Leggendarie, mazzi, archetipi e carte) per tutti. L'overlay mostra i dati al
giocatore (finestra sopra il gioco) e a chi fa dirette (sorgente per OBS).

Permesso: Kevin di Koin Games (Pierluigi, 29/09/2026: "il permesso lo abbiamo"; testo e data da archiviare in
`G:\Il mio Drive\OriginsMeta\10_Materiale_Koin\`, come quello del 19/09 sul materiale ufficiale).

## Fasi

| Fase | Cosa | Stato |
|---|---|---|
| 0 | Verifiche: permesso, termini d'uso, partite di prova, scelta fra app e pagina web | fatta il 29/09/2026 |
| 1 | Lettore dei file (cache + replay), funzioni pure con i test: `src/lib/tracker/` | fatta il 29/09/2026 |
| 2 | App base in `tracker/` (Electron 44): icona nella barra, avvio con Windows, partite registrate da sola, storico sul PC | fatta il 29/09/2026 |
| 3 | Collegamento al sito: codice → token, invio delle partite, tabella con RLS, `/account/tracker`, statistiche anonime (win rate) | fatta il 30/09/2026, online e migrata la notte del 01/10/2026, collegamento provato con l'account di Pierluigi |
| 4 | Overlay: finestra sopra il gioco e sorgente per OBS (servita dall'app su 127.0.0.1) | fatta il 30/09/2026 |
| 5 | Installer firmato (certificato o Microsoft Store), aggiornamenti automatici, pagina per scaricare l'app, prova con pochi giocatori, lancio | da fare |
| S1 | Scanner dello schermo, modalità cattura: fotogrammi della finestra del gioco sul PC, per tarare il riconoscitore (vedi "Scanner dello schermo") | fatta il 10/10/2026, in attesa delle partite di prova |
| S2–S3 | Riconoscitore delle carte nei fotogrammi e partita ricostruita (giocate per round, Leggendaria e carte dell'avversario) dentro l'app | fatte il 10/10/2026, da provare con una partita vera nell'app (`npm run scan`) |
| S4 | Scanner acceso di default con avviso e interruttore (0.3.0), zip per GitHub Releases, win rate riaperti sul sito | fatta il 10/10/2026 |
| S5 | Mazzo probabile dell'avversario, magie, win rate per carta giocata | da fare |

Calendario proposto il 27/09: fasi 3–4 dal 7 al 12/10 (fatte prima), prova dal 12 al 18/10, Next Fest dal 19/10.

## Regole

1. **Solo lettura.** Nessun blocco sui file (lettura condivisa, chiusura subito); mai il processo del gioco (memoria,
   iniezioni, rete); mai i token della cache per chiamare i server di Koin; overlay come finestra separata o sorgente
   di OBS, mai agganciato alla grafica del gioco. Nel gioco c'è l'Anti-Cheat Toolkit di CodeStage, che non controlla
   chi legge i file (verifica del 27/09): va rifatta a ogni patch.
2. **Mai dire se l'avversario è un bot o una persona** (Pierluigi, 29/09/2026): niente flag bot, niente modalità del
   nome del file ("BotBattle"), niente rank dell'avversario (quello dei bot è un "Master" finto), in nessuna parte:
   app, overlay, sito, file esportati, nomi delle copie dei replay. Il flag si legge solo dentro il lettore per
   riconoscere il giocatore (`pickMe`). La coda (classificata o normale) è solo "ranked" o "normal" e non si mostra
   partita per partita (vedi "Coda"). Test: "mai dire se l'avversario è un bot o una persona" in `tracker.test.ts`,
   più quelli dell'app, dell'upload e dell'overlay.
   **Dal 14/10/2026 le partite contro i bot non si registrano** (Pierluigi: "devono non solo essere rimosse dalle
   statistiche ma anche non devono più essere registrate"; "devi fare in modo che il tracker legga i nomi"): vedi
   "Partite contro i bot". Il segnale bot resta dentro l'app (sì/no in memoria) e decide solo se la partita esiste:
   niente flag nei record, nello storico, nell'overlay o sul sito.
3. **Mai nomi né id** di giocatori o partite fuori dal lettore (dal 14/10/2026 lo scanner legge il nome dell'avversario
   della schermata VS, ma solo per riconoscere i bot: il testo non si salva, non si mostra e non esce dal PC): dell'id della partita resta un'impronta salata con
   l'id dell'account (`matchFingerprint`). I termini di Koin vietano di raccogliere dati di altri utenti senza
   consenso (Terms of Use, §2.3).
4. **Al sito, dell'avversario solo la Leggendaria e le carte che ha giocato** (Pierluigi, 30/09/2026): il suo mazzo
   completo, che il gioco non mostra, resta nello storico sul PC e non parte mai (`toUpload`, con un test).
5. **Statistiche anonime sempre** (Pierluigi, 30/09/2026): le partite di chi collega l'app entrano sempre nelle
   statistiche del sito, senza caselle; lo dicono l'app e `/account/tracker` prima del collegamento e l'informativa
   (`/privacy#tracker`). Solo aggregati sopra la soglia (vedi "Statistiche anonime").
6. L'overlay non mostra durante la partita niente che il gioco nasconde: la Leggendaria avversaria compare solo nella
   riga dell'ultima partita finita.
7. A ogni patch: rilanciare `npm test` sul PC con il gioco (il test "file veri del gioco su questo PC" legge replay e
   cache veri, se ci sono) e una partita di prova.

## I file del gioco

**Playtest (verificato l'11/10/2026)**: il ramo Steam `communityplaytest` (stessa app 4756630, password) scrive in
`LocalLow\Koin Games\Origins TCG Playtest\` (realm `DE_1929669118877841`, versione 0.7.1 il 03/10), con gli stessi file
della demo: il lettore li legge (statistiche e inventario provati sui file veri) e il watcher usa la cartella scritta
più di recente fra "Origins TCG Demo", "Origins TCG" e "Origins TCG Playtest" (`PRODUCTS` di `paths.ts`), quindi segue
da solo chi passa dall'una all'altro; la partita del 02/10 alle 23:10 UTC nello storico di Pierluigi viene dal playtest.
Lo scanner riprende la finestra "Origins TCG Playtest" (`GAME_WINDOWS`), provato dal vivo l'11/10 (build 25799961):
stesso tabellone, stesso pannello del mana, stesse carte; carte che esistono solo nel playtest non si riconoscerebbero
(niente immagine sul sito). **Nel playtest le partite online e classificate non lasciano niente nei file del PC**: le
statistiche (`onboardingResults`, `onboardingLastMatchId` "offline_…") contano solo le partite offline, quindi il
watcher non vede finire le altre. Dalla 0.3.1 le registra l'app dallo schermo (`readResult` e `finishFromScreen`, vedi
"Scanner dello schermo"). Al cambio di cartella (demo ↔ playtest) la prima lettura fa da punto di partenza (`rebase` di
watcher.ts): prima l'ultima partita dell'altra build diventava una partita nuova senza esito. **Le partite del playtest
vanno al sito come le altre** e entrano negli stessi win rate (Pierluigi, 11/10/2026: "mandiamole come le altre"): la
partita non dice da quale build viene.

**Patch 0.7 (verificato la notte del 01/10/2026 sul PC di Pierluigi)**: il gioco **non scrive più il replay**. A fine
partita cancella quello della partita prima e non ne crea uno nuovo (3 partite su 3 dal 30/09; cercato in Documenti,
LocalLow, cartella del gioco e in tutto il profilo; `Player.log` non ne parla; negli annunci Steam non c'è). Le partite si
registrano con esito, ora, coda e mazzo intero (bastano per i win rate di Leggendarie, liste, archetipi e carte nel
mazzo); mancano carte giocate, Leggendaria e carte dell'avversario, round e rank, cioè scontri, Leggendarie incontrate e
colonne "giocata" e "round medio". Pierluigi ne parla con Kevin di Koin; se i replay tornano l'app li rilegge da sola.
Ricontrollato il 10/10/2026: niente replay neanche con la build pubblica del 04/10 (25610387, uscita senza annuncio;
partita dell'08/10, cartella `Replays` ferma al 30/09) né sul ramo Steam `communityplaytest` (con password, aggiornato
il 01/10; partita giocata da Pierluigi).
Sempre con la 0.7 esito e id della partita arrivano nelle statistiche qualche secondo prima dell'ora di fine, che per un
attimo resta quella della partita precedente: `watcher.ts` usa intanto l'ora in cui il gioco ha scritto l'esito e prende
quella vera appena arriva (`refreshPending`, test in `watcher.test.ts`). Accanto al file delle statistiche la 0.7 ne
scrive uno con le statistiche vuote (48 byte) e un `stats<uuid>.json` con `offlineDataList`: l'app li ignora.

| File | Dove | Quando cambia | Cosa ci serve |
|---|---|---|---|
| Statistiche del profilo | `%USERPROFILE%\AppData\LocalLow\Koin Games\Origins TCG Demo\beamable\cache\<cid>\<realm>\<versione>\<impronta>.json` | pochi secondi dopo ogni partita; `ActiveUserDeckIndex` appena si sceglie il mazzo; all'avvio del gioco si riscrive senza cambiare valori | esito, ora e id dell'ultima partita, mazzo scelto, `BattleMode`, id dell'account (solo per riconoscere il giocatore) |
| Inventario | stessa cartella | circa 15 s dopo la partita | i mazzi: nome, 13 chiavi delle carte |
| Replay | `%USERPROFILE%\Documents\My Games\Origins TCG Demo\Replays\LatestMatch_<modalità>_<aaaa-mm-gg_hh-mm-ss>.replay` | a fine partita, **sovrascritto dalla successiva** | mazzi di tutti e due, rank, giocate; la modalità nel nome |
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
- `ActiveUserDeckIndex`: posizione del mazzo nell'ordine dell'inventario;
- `BattleMode`: sempre "0" nelle partite viste (serve alla coda, vedi sotto).

Non servono (significato ignoto o inaffidabile): `winWindow1/2`, `lossWindow1/2`, `ChallengeChallengeCounter`.

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

### Coda

Richiesta di Pierluigi del 30/09/2026: ogni partita porta la coda, "ranked" o "normal" (`matchQueue` di
`src/lib/tracker/queue.ts`, con i test), per poter tenere un giorno solo le classificate. Si ricava dalla modalità nel
nome del replay e da `BattleMode` delle statistiche: vale "ranked" se `BattleMode` è in `RANKED_BATTLE_MODES` (vuoto
finché non lo si vede) o se la modalità contiene "rank"; tutto il resto, "BotBattle" compreso, è "normal". Mai
"BotBattle", mai un segnale bot.

**Da verificare quando apre la classificata** (il 29/09 era chiusa): come si chiamano i replay della classificata e
che valore prende `BattleMode`, **sia contro una persona sia contro un bot**. Se nella classificata le partite contro i
bot avessero un nome diverso da quelle contro le persone (per esempio ancora "BotBattle"), la coda dovrà venire solo da
`BattleMode`, altrimenti "normal" dentro la classificata direbbe "bot". Per lo stesso motivo la coda non si mostra
partita per partita, né nell'app né in `/account/tracker`: serve solo a filtrare le statistiche anonime.

## Codice

Lettore e regole condivise, in `src/lib/tracker/` (puri, niente file system: girano nell'app, nel sito e nei test):

- `replay.ts`: `parseReplay` (albero grezzo, `ReplayFormatError` se il formato cambia), `readReplay` (giocatori, mazzi,
  giocate, mulligan; mai nomi né id), `replayFileInfo`.
- `profile.ts`: `readStatsFile`, `readInventoryFile`, `detectMatchEnd`, `resultsDelta`.
- `match.ts`: `buildMatch` → `TrackedMatch` v2 (il record che l'app salva: esito, coda, mazzo con nome e codice del
  gioco, rank, mazzo dell'avversario, giocate), `readTrackedMatch` (legge anche le v1 della Fase 2, coda "normal"),
  `matchFingerprint`, `pickMe`, `replayBelongsTo`.
- `queue.ts`: `matchQueue` (vedi "Coda").
- `upload.ts`: la partita che va al sito (`toUpload`, `isUpload`, `UPLOAD_LIMITS`, `SERVER_KEYS`), codice di
  collegamento (`normalizeLinkCode`, `LINK`), token, errori (`trackerErrorCode`, `trackerErrorStatus`). Stessi campi
  e limiti di `tracker_match_ok` nel database: `upload.test.ts` li confronta con l'SQL.
- `stats.ts`: soglie (`TRACKER_STATS`), "prime stime", lista esatta (`listKey`, `deckListKey`), lettura delle risposte
  delle statistiche anonime. `personal.ts`: statistiche personali di `/account/tracker`.
- Solo sito: `enrich.ts` (patch e archetipo aggiunti all'invio), `http.ts` (aiuti delle rotte).
- Test: `tracker.test.ts` (lettore, coda, lettura v1) e `upload.test.ts` (upload, statistiche, personali, patch e
  archetipo, confronto con il blocco SQL), in `npm test`: replay finti costruiti nel test (`testing.ts`), nessun file
  del gioco nel repo, più i file veri del PC se ci sono.

## L'app (`tracker/`)

Pacchetto a sé nella cartella `tracker/` del repo (package.json, tsconfig e test propri; il `tsconfig.json` del sito la
esclude e l'ESLint del sito ne controlla solo i sorgenti), istruzioni in `tracker/README.md`:

- `src/main/watcher.ts`: ogni 2 s una `stat` sul file delle statistiche; quando cambia lo rilegge e, se l'impronta
  dell'ultima partita è nuova, aspetta il replay fino a 15 secondi (un minuto fino al 10/10/2026) e registra la partita con il lettore, con la coda dal
  nome del replay e da `BattleMode`; senza replay la registra con esito e mazzo. Al primo avvio registra l'ultima
  partita solo se il suo replay è ancora lì. Cartelle del gioco in `paths.ts`.
- `src/main/store.ts`: `%APPDATA%\OriginsMeta Analytics\matches.jsonl` (una partita per riga, v1 e v2) e `state.json`.
  Fino al 01/10/2026 la cartella era `OriginsMeta Tracker`: al primo avvio col nome nuovo `main.ts` ne copia i dati
  (`moveOldData`: storico, stato, invii, collegamento, overlay; la cartella vecchia resta).
- `src/main/account.ts`, `sync.ts`: collegamento e invio (sotto). `src/main/overlay.ts`: overlay (sotto).
- `src/main/main.ts`: icona nella barra (menu in EN/IT/ES), finestra la cui X chiude tutta l'app con overlay e Deck tracker (dal 10/10/2026, prima la nascondeva), una sola
  copia, avvio automatico (sotto, "Avvio automatico e pannelli sopra il gioco"), sicurezza (contextIsolation, sandbox, nessuna navigazione, nessun
  permesso, link solo verso originsmeta.com, IPC solo dalla pagina dell'app), `--capture` per gli screenshot.
- `src/renderer/`: interfaccia EN/IT/ES con i pannelli "Account OriginsMeta" e "Overlay"; `src/overlay/`: la pagina
  dell'overlay; `src/preload/`: i due ponti (l'overlay può solo leggere i suoi dati).
- **Grafica del sito (01/10/2026**, Pierluigi: "portiamo nell'app i nostri logo, le palette, i font" e "anche le
  grafiche delle carte"): font Unbounded, Manrope e JetBrains Mono (`assets/fonts`, sottoinsieme latino preso dalla build
  del sito, licenza OFL in `assets/fonts/OFL.txt`), il logo disegnato, i token e i pannelli `.card-night`, il bottone
  primario col gradiente. Carte intere come `.card-tile` del sito: il mazzo scelto nel gioco in grande (Leggendaria
  intera, numeri, le altre 12 carte), miniature delle Leggendarie in tabelle e partite, "Il tuo mazzo" in carte dentro
  ogni partita; nell'overlay la Leggendaria del mazzo e, a partita finita, la miniatura di quella avversaria. Le
  immagini arrivano da `originsmeta.com/cards/<slug>.webp` (le stesse del sito, non copiate nell'app; CSP con
  `img-src` del sito; detto nel testo sulla privacy dell'app e nell'informativa), mai ritagliate: i crediti restano
  visibili, gemma e stella stanno negli angoli in alto. Senza rete resta il nome dentro la cornice. Il server locale
  dell'overlay serve anche logo e font (`overlayFile`).
- Test: `npm test` in `tracker/` (84 test dalla 0.4.0, fra cui "Solo con l'account" e il nome nuovo; prima 27: watcher con la coda, storico con le v1, invio con una rete finta, token
  cifrato, dati dell'overlay e server locale), `npm run typecheck`.

## Collegamento e invio (Fase 3)

1. In `/account/tracker` il giocatore crea un **codice monouso** (8 caratteri senza 0/O e 1/I, "ABCD-EFGH", 10
   minuti, al massimo 5 l'ora: `tracker_link_code`).
2. Nell'app lo scrive in "Account OriginsMeta" → `POST /api/tracker/link` {code, name} → `tracker_link_claim` →
   **token** "omt_" + 64 caratteri esadecimali, una volta sola. `name` è il nome del PC (lo vede solo il proprietario).
   Al massimo 10 PC collegati per utente.
3. L'app salva il token **cifrato** con `safeStorage` di Electron (DPAPI di Windows) in `account.json`; senza cifratura
   il token resta solo in memoria fino alla chiusura (mai in chiaro su disco). Il database tiene solo l'impronta.
4. **Coda di invio** (`sync.ts`): tutte le partite dello storico che il sito non ha ancora (`sync.json`), comprese quelle
   registrate prima del collegamento (l'app lo dice prima di collegare), a gruppi di 50 dalla più vecchia →
   `POST /api/tracker/sync` con `Authorization: Bearer <token>`. Parte 5 s dopo ogni partita, 10 s dopo l'avvio e ogni
   5 minuti se qualcosa resta indietro; "Invia ora" non aspetta.
5. Errori: rete assente o sito giù → riprova dopo 1, 2, 5, 15 minuti; 429 (500 partite nuove in 24 ore) → dopo un'ora;
   503 (funzioni non ancora nel database) → dopo 15 minuti; 401 → il PC è stato scollegato dal sito: l'app dimentica il
   token e lo dice; 400 → errore nostro, quelle partite non si riprovano.
6. Scollegare: dal sito (`/account/tracker`, `tracker_revoke`) o dall'app ("Scollega questo PC": `DELETE
   /api/tracker/link` → `tracker_device_unlink`). Dopo lo scollegamento l'app rimanderebbe tutto al prossimo account.

Per le prove: `ORIGINSMETA_TRACKER_SITE` (solo https o http://localhost) punta l'app a un'anteprima o al server di
sviluppo; `ORIGINSMETA_TRACKER_DATA` usa una cartella dati di prova.

## Solo con l'account (0.4.0, 12/10/2026)

Pierluigi, 12/10/2026: "ben inteso che solo i registrati al sito possono scaricare l'app e possono usarla, se non sono
registrati con il cazzo possono usarla!!". Regole in `tracker/src/main/access.ts` (funzioni pure, test in
`access.test.ts`), cablate in `main.ts`:

1. **Senza un collegamento verificato l'app non fa niente**: il "motore" (watcher dei file del gioco, scanner dello
   schermo, overlay, Deck tracker e carte dell'avversario, sorgente per OBS su 127.0.0.1, registrazione e invio delle
   partite) resta spento; la finestra mostra solo la schermata di collegamento (crea un account gratuito o accedi su
   `/login?next=/<lingua>/account/tracker`, crea il codice in `/account/tracker`, scrivilo qui) e "Chiudi l'app";
   l'icona vicino all'orologio ha solo "Apri" ed "Esci"; l'interfaccia non riceve partite né storico; le chiamate IPC
   che non sono collegamento, link, verifica, scollega o uscita sono rifiutate. Appena collegata parte tutto (le
   finestre aperte l'ultima volta si riaprono, lo scanner segue la sua preferenza). Resta acceso solo
   l'aggiornamento automatico, così anche un'app bloccata riceve le correzioni. Il mini tutorial della 0.3.8 e le
   tendine (Account, Overlay, Scanner) esistono solo ad app sbloccata: il tutorial parte al primo avvio dopo il primo
   collegamento verificato (sulla schermata di blocco resta in sospeso, senza segnarlo come visto) e l'IPC
   `tracker:spot-panels`, che apre i pannelli, è rifiutato ad app bloccata.
2. **Verifica del token**: all'avvio e poi ogni 4 ore l'app manda `POST /api/tracker/sync` con `matches: []` (la rotta
   fa già da controllo del token, nessun cambio al sito); vale come verifica anche ogni invio accettato. Esiti
   (`verifyOutcome`): 200 e 429 = valido (il tetto delle partite si controlla dopo il token); 401 = rifiutato (PC
   scollegato da `/account/tracker`, account eliminato: `tracker_devices` va via con il profilo) → l'app dimentica il
   token, ferma tutto e torna alla schermata di collegamento ("il sito ha scollegato questo PC"); tutto il resto (rete
   assente, 503, 5xx) = tolleranza.
3. **Tolleranza**: con il sito irraggiungibile l'app continua per **7 giorni dall'ultima verifica riuscita**, poi si
   blocca ("non riesce a verificare il collegamento dal …") e riprova da sola ogni 5 minuti (o con "Riprova"). L'ora
   dell'ultima verifica sta in `account.json` (`verified`), **cifrata** con safeStorage come il token: un'ora scritta a
   mano non vale, un'ora nel futuro oltre 10 minuti nemmeno (si verifica da capo). Il collegamento appena fatto vale
   come verifica. I collegamenti della 0.3.x non hanno l'ora: alla prima apertura della 0.4.0 l'app resta ferma i pochi
   secondi della prima verifica (senza rete, finché non la fa).
4. **Lo storico sul PC non si tocca mai**: bloccata, l'app non cancella `matches.jsonl` né le impostazioni; la schermata
   dice quante partite restano sul PC. Scollegare dall'app ("Scollega questo PC") ora vuol dire anche fermarla.
5. Con l'app solo nell'icona (avvio con Windows), se si blocca la finestra si apre da sola sulla schermata di
   collegamento; all'avvio con Windows si apre subito se è bloccata per un motivo diverso dalla prima verifica.
6. Prove: `--capture` fotografa la schermata di blocco (nessuna rete); `--capture-unlocked` fotografa l'app sbloccata,
   solo fuori dall'app impacchettata. Provato dal vivo il 12/10 con un server finto (token rifiutato, collegamento 0.3.x
   verificato, sito giù da 2 e da 8 giorni).

**Limiti**: il download da GitHub Releases resta pubblico (lo zip si scarica senza account), ma l'app senza account non
fa niente. Un utente che manomette l'app (sorgenti pubblici) può togliere il blocco sul suo PC: quello che conta è che
il sito accetta partite solo con un token valido.

## Nome: OriginsMeta Tracker (0.4.0)

Cambia solo il nome visibile (`tracker/src/main/appIdentity.ts`, test in `appIdentity.test.ts`): finestre, icona,
menu, testi en/it/es, `productName` del pacchetto, eseguibile `OriginsMeta Tracker.exe`, cartella
`OriginsMeta Tracker-win32-x64` e zip `OriginsMeta-Tracker-win-x64.zip` (il tasto di download del sito punta a
`https://github.com/ultimacenere/originsmeta/releases/latest/download/OriginsMeta-Tracker-win-x64.zip`). Restano fissi:

- **cartella dei dati** `%APPDATA%\OriginsMeta Analytics`: `main.ts` la imposta esplicitamente (`dataDir`), perché col
  nome nuovo Electron userebbe `%APPDATA%\OriginsMeta Tracker` (la cartella di prima del 01/10) e la chiave di
  safeStorage del suo `Local State` renderebbe illeggibile il token, come il 01/10;
- **AppUserModelId** `com.originsmeta.analytics`: è anche il nome della voce di avvio automatico nel registro. Chi la
  aveva accesa con `OriginsMeta Analytics.exe` passa da sé a `OriginsMeta Tracker.exe` al primo avvio di questo
  (`migrateLoginItem`, `staleLoginItem`: la voce vecchia si toglie, la nuova si mette con lo stesso stato
  abilitato/disabilitato);
- **release su GitHub**: tag `analytics-vX.Y.Z`. Le app 0.3.x cercano lo zip `OriginsMeta-Analytics-win-x64.zip` con
  dentro `OriginsMeta Analytics.exe`: `npm run package` lo fa (la stessa app con una copia dell'eseguibile col nome
  vecchio) e **va caricato nella stessa release** accanto a quello nuovo, almeno nella 0.4.0, che deve restare fra le
  ultime 20 release del repo (le 0.3.x scelgono la più nuova che lo porta). Dopo l'aggiornamento una 0.3.x gira con
  `OriginsMeta Analytics.exe` (codice nuovo); dalla release successiva l'aggiornamento riapre `OriginsMeta Tracker.exe`
  (`exeAfterUpdate`). Il vecchio eseguibile resta nella cartella, così i collegamenti fatti dal giocatore funzionano.

Link dell'app verso il sito: guida all'installazione `/en/tracker#install`, `/it/tracker#installazione`,
`/es/tracker#instalacion` (schermata di blocco, fondo della pagina, LEGGIMI), collegamento e statistiche personali
`/<lingua>/account/tracker`, win rate `/<lingua>/analytics` (pannello "Account OriginsMeta").

## Setup e correzioni (0.4.1, 12–13/10/2026, pubblicata il 13/10)

Richieste di Pierluigi del 12/10/2026 sera (bug dalla diretta di Robip, poi "nella main app, le opzioni devono essere
raggiungibili attraverso tasto setup, nella pagina principale solo i dati del gioco").

- **Carta fantasma nel Deck tracker**: nell'inventario del gioco un mazzo può avere una voce `{"CardKey": "Tower_V00000",
  "CardId": 0}`, che non è una carta (visto in un mazzo da 12 carte su questo PC). L'app la contava come tredicesima
  carta da 2 copie: casella vuota con il "2" in fondo alla griglia. `readInventoryFile` scarta le voci con `CardId: 0`.
- **Mazzo modificato nel gioco**: il watcher rileggeva il mazzo solo quando cambiava il file delle statistiche, quindi
  una carta cambiata (Lightning Strike → Stroke of Midnight) restava nel Deck tracker fino alla partita dopo. Ora
  guarda anche l'ora dell'inventario a ogni giro e prende l'inventario della **cartella delle statistiche** (stessa
  build e stesso account), non il più recente fra demo e playtest.
- **Setup**: la pagina principale ha solo mazzo scelto, numeri, mazzi, Leggendarie avversarie, partite ed esiti del
  gioco; il tasto Setup della testata apre account, scanner dello schermo, overlay e pannelli, opzioni dell'app (avvio
  con Windows, cartella dei dati, tutorial, guida, informativa); "Torna alle partite" riporta indietro. Le tendine non
  ci sono più. Un problema dell'account (sito irraggiungibile, invio fermo) resta anche nella pagina principale, con il
  link a Setup. Il tutorial apre Setup per i passi su account, scanner e pannelli e chiude sul tasto (chiave
  `originsmeta.tracker.tour.v2`: chi l'aveva visto lo rivede una volta). `--capture-setup` fotografa Setup.
- **Template dei pannelli** (disegni e prove sul gioco di Pierluigi, 12–13/10/2026; `src/main/panelLayout.ts` con i test):
  in Setup › Overlay, "Stile dei pannelli", quattro schede con lo schema dello schermo; dalla pagina principale ci porta
  "Crea il tuo layout", accanto al nome del mazzo. **Classico** (dal 13/10 un misto: il mio mazzo come nello
  Strutturato, l'avversario come nel Minimal; il vecchio Deck tracker a griglia e il pannello a L non ci sono più);
  **Minimal** (id `strips`: il mio mazzo in una fascia in basso a sinistra, l'avversario in una fascia in alto a
  destra, Leggendaria e carte rivelate); **Strutturato** (id `columns`: a sinistra il mio mazzo con la Leggendaria a
  fascia in stile deck builder e le carte ancora nel mazzo; a destra, sopra il pannello del mana del gioco, Leggendaria
  a fascia e carte dell'avversario, carte rimanenti, mana dei due); **Personalizzato** (disposizione verticale o
  orizzontale, carte disegnate o solo nomi in riga, carte per fila da 1 a 13, opacità del fondo, carte finite
  nascoste, cosa mostrare di ciascun pannello, "Ripristina"). Fasce e colonne sono chiuse su tutti i lati, con il logo
  e la × in una linguetta fuori dal corpo (× sul lato esterno). Le posizioni di partenza sono frazioni dello schermo
  principale misurate sui disegni (l'app non sa dove sta la finestra del gioco); ogni template ricorda la sua
  posizione (`spots`). Template e opzioni in `panel-template.json`, con "Mostra i pannelli solo durante la partita"
  (con lo scanner: compaiono al primo round e spariscono una trentina di secondi dopo la fine, anche in OBS). Le
  opzioni viaggiano con i dati dei pannelli (`view.custom`, `view.hidden`). Cambiare template riapre i pannelli.
- **Avviso dell'aggiornamento**: riquadro magenta in cima, "Aggiornamento in arrivo: aspetta a lanciare il gioco"
  (l'app si installa solo a gioco chiuso). `--capture-update=<versione>` per gli screenshot.
- Sul sito la guida di `/tracker` è in cinque passi brevi (requisiti in una riga, problemi comuni in un riquadro) e
  rimanda al tasto Setup: online dal 13/10, con la release 0.4.1.

## Magie, pannelli e Twitch (0.4.2, 13/10/2026, da pubblicare)

Richieste di Pierluigi del 13/10/2026: "dobbiamo leggere le spell e sappiamo che vengono visualizzate in alto a
sinistra e dobbiamo assolutamente leggerle"; "abbiamo un bug sulla funzione di nascondere l'interfaccia a partita
conclusa, a volte non ricompare l'interfaccia, a volte parte post turno uno a leggere le carte"; l'integrazione con
Twitch chiesta dagli streamer (docs/twitch.md).

- **Magie** (`readSpell` e `readPhase` di recognize.ts, `spellPlays` di reconstruct.ts, test in reconstruct.test.ts):
  le magie non restano sul tabellone, ma il gioco le mostra nel riquadro grande in alto a sinistra, con la cornice ad
  angoli tagliati, mentre si rivelano (le mie e quelle dell'avversario) e mentre scelgo il bersaglio di una mia.
  L'illustrazione lì è un'inquadratura più stretta di quella del sito: riferimenti a parte in `src/card-art-preview.json`
  (`ART_IN_PREVIEW`, 40,30–435,275 su 480 × 690, `npm run card-art`), cercati sulle partite salvate (Searing Light 0,91
  e Legion of the Dead 0,84, distacco 0,44–0,51 da ogni altra carta). Il riquadro entra scorrendo e sta più a sinistra
  nella demo che nel playtest: `SPELL_SHIFTS` prova 12 posizioni solo con le magie (chiavi `_SB`/`_SC`) e poi misura il
  distacco da tutte le carte (`SPELL_ACCEPT` 0,6 / 0,15). Su 33 sessioni del 10–12/10: 22 magie diverse, 0,61–0,90, nessuna
  carta scambiata. La fase del round viene dal tasto in basso a destra: "PRONTO" ha l'anello verde (0,04–0,16 di
  verde), "RIVELAZIONE" no (0 in 712 fotogrammi su 712). **Chi l'ha giocata**: in pianificazione il riquadro mostra
  solo le mie; in rivelazione una magia è mia fino al numero di copie che ho giocato in quel round (viste mentre
  sceglievo il bersaglio, anche un fotogramma solo, o uscite dalla mia mano entro la fine della pianificazione: il
  massimo prima meno l'ultima lettura, perché la carta può lasciare la mano già nell'animazione d'inizio round), mai se
  non è nel mazzo scelto (`CardInfo.myDeck`); le altre sono dell'avversario. Una stessa magia letta di nuovo entro 3 s
  è la stessa rivelazione (`SPELL_GAP_MS`), servono 2 fotogrammi. Le magie entrano nelle giocate (luogo 0), quindi nel
  Deck tracker (le mie si spengono, quelle dell'avversario fra le carte viste), nello storico e nelle statistiche
  delle carte. Le magie **lette sul tabellone** non contano più: erano altre carte scambiate (Searing Light in 53
  letture su 10 sessioni, tutte false). Verifica: `scripts/scan-frames.mjs` scrive anche `spell` e `phase`.
- **Pannelli "solo durante la partita"** (analisi sui fotogrammi del 10–12/10, 24 partite): (1) sparivano a partita in
  corso quando il mana non si leggeva per più di 30 s mentre il tabellone sì (round finali e combattimento, 9 partite
  su 24, fino a 78 s): ora "in partita" guarda anche il tabellone con carte fino a 2 minuti dopo l'ultimo mana e prima
  dello stendardo (`lastActivity`, `BOARD_GRACE_MS`); (2) in 2 partite su 23 il "2/2" del round 1 non si legge mai e la
  partita partiva dal round 2 (pannelli un minuto dopo la VS, carte del round 1 contate nel round 2): ora dopo la VS
  il primo tabellone con carte è il round 1 (`BOARD_START_FRAMES`), e dopo una partenza così il segnaposto "0/10" non
  vale; (3) la pagina del pannello restava vuota per un attimo nella finestra appena rimostrata (`hidden` arriva con un
  secondo di ritardo): `is-hidden` vale solo per OBS. Simulazione: pannelli nascosti a partita in corso da 9 partite
  (200 s) a 1 volta (1,5 s), partite dal round 2 da 2 a 0, pagina vuota da 8 volte a 0.
- **Estensione Twitch** (`src/main/twitchLive.ts`, test): durante la partita l'app manda a `/api/tracker/live` lo stato
  del Deck tracker (`liveStateOf` di src/lib/tracker/live.ts) quando cambia, al massimo ogni 2 secondi; il sito lo tiene
  solo se l'account ha collegato un canale Twitch, altrimenti risponde `linked: false` e l'app aspetta 5 minuti.
  Senza account collegato non parte niente. Dettagli in docs/twitch.md.
- **Avvisi dell'aggiornamento** (Pierluigi: "la gente non la tiene aperta a babbo morto, manda una notifica se c'è da
  aggiornare dicendo di tenere il gioco chiuso fino a fine aggiornamento"): fumetti di Windows dall'icona vicino
  all'orologio (`tray.displayBalloon`, niente collegamento nel menu Start), testi in `UPDATE_NOTICES` di updateRules.ts:
  versione trovata ("tieni chiuso Origins TCG finché l'app non si riapre da sola"), pronta col gioco aperto ("chiudi
  Origins TCG per installarla", una volta per versione) e, al primo avvio della versione nuova (`last-version.json`,
  `justUpdated`), "puoi aprire Origins TCG". La riga in cima all'app resta.

## Pannelli anche su Twitch (0.4.3 e 0.4.4, 14/10/2026)

- Lo stato dal vivo per l'estensione Twitch porta anche lo stile dei pannelli (template, opzioni, nascosti fuori
  partita, posizione delle finestre rispetto allo schermo principale: `liveUi` di main.ts) e vita, mana e verso del
  combattimento, così l'estensione in modalità "come l'app" disegna gli stessi pannelli sopra il video (docs/twitch.md).
- Il disegno dei pannelli è in `src/overlay/deckRender.ts`, condiviso fra la pagina del pannello (deck.ts: finestra e
  OBS) e l'estensione (`twitchPanels.ts`, `npm run twitch-panels`). Le carte hanno `data-key`.
- **0.4.4** (prova in diretta di Pierluigi: "sono duplicati e la posizione di quelli di Twitch non è la stessa"):
  opzione "Nascondi i pannelli dalla diretta" in Setup › Overlay (`hideFromStream` in panel-template.json): Windows
  esclude le finestre dei pannelli da ogni ripresa dello schermo (`setContentProtection`), così OBS a schermo intero non
  le mette in onda e chi guarda vede solo quelle dell'estensione. Nell'estensione i pannelli stanno negli stessi punti
  dello schermo dello streamer, senza più spostarsi fuori dalle fasce dei controlli del player.

## Il sito (Fase 3)

- **Rotte** (client anonimo senza cache, `supabaseAnon` di `src/lib/supabase/public.ts`; mai in cache; niente cookie):
  `src/app/api/tracker/link/route.ts` (POST codice → token, DELETE scollega) e `src/app/api/tracker/sync/route.ts`
  (POST partite: `isUpload`, poi patch e archetipo con `enrich.ts`, poi `tracker_submit`). Prima della migrazione
  rispondono 503 "unavailable" (verificato il 30/09 sul server locale).
- **Pagina** `/[locale]/account/tracker` (privata, dinamica, noindex, nel matcher di `src/proxy.ts`): codice
  (`TrackerCodeBox`), PC collegati con "Scollega", statistiche personali (totali, mazzi per lista esatta, contro le
  Leggendarie, ultime 20 partite con la patch), "Cancella tutte le mie partite". Azioni in
  `src/lib/community/trackerActions.ts`, letture in `trackerQueries.ts`, testi EN/IT/ES in `src/lib/trackerLabels.ts`.
- **In /account** il riquadro "OriginsMeta Tracker" si vede solo a Staff e admin finché l'app non si scarica
  (`TRACKER_ACCOUNT_LINK_PUBLIC` in `trackerLabels.ts`, da accendere al lancio insieme al testo `beta`).
- **Privacy**: paragrafo `#tracker` (EN/IT/ES, `trackerPrivacy`): cosa legge l'app, cosa manda e cosa mai, dove sta,
  chi lo vede, statistiche anonime sempre e come uscirne (non collegare, cancellare), token cifrato.
- **Database**: blocco `-- ===== 30/09/2026: TRACKER =====` in fondo a `supabase/schema.sql` (tabelle
  `tracker_devices`, `tracker_link_codes`, `tracked_matches` con RLS e nessuna scrittura diretta; funzioni del
  collegamento, dell'invio, della gestione e delle statistiche). Tipi in `src/lib/supabase/database.ts`.

## Statistiche anonime (win rate)

Richiesta di Pierluigi del 30/09/2026: i win rate di mazzi e carte "sono molto importanti e dobbiamo averli". Le
calcola il database, al momento, con funzioni `security definer` per anon che restituiscono **solo aggregati**.

**Soglia di prova dal 01/10/2026** (Pierluigi: "togli il limite delle 20 partite per il momento, voglio vedere le
statistiche sul sito, poi rimettiamo il limite"): 1 partita e 1 giocatore invece di 20 e 3, in `TRACKER_STATS` di
`stats.ts` e in `tracker_stats_ok` del blocco TRACKER, con il solo account di Pierluigi collegato. La pagina Win rate lo
dice (`testThresholds`, avviso "Soglia di prova"); l'informativa resta quella del lancio. La notte del 01/10, con
l'app anche a Davdas, Pierluigi ha deciso di tenerla ("niente soglia, restiamo liberi") per le prove dei giorni dopo:
**si rimette quando lo dice lui**, e comunque prima di collegare persone fuori dallo staff (l'informativa promette 20 e
3): `TRACKER_STATS` uguale a `TRACKER_STATS_LAUNCH` (20 e 3) e `tracker_stats_ok` con 20 e 3, poi migrazione; i test e
la prova a secco seguono la soglia scritta nello schema.

**Amichevoli: non si registrano** (verificato la notte del 01/10/2026 con un'amichevole fra Pierluigi e Davdas, tutti
e due con l'app). Il gioco non scrive niente di loro: statistiche del profilo ferme, nessun replay, nel log solo
messaggi del motore, nell'inventario (riscritto a fine partita) solo mazzi, carte, cosmetici, ricompense e valute.
Pierluigi le voleva "come le code normali, senza inventarsi roba in più": non si può, e la domanda dell'esito a fine
partita (contatore `MatchEndCounter` delle preferenze del gioco più finestrella) l'ha scartata. Quel lavoro sta sul branch
locale `wip/amichevoli-domanda`, non pubblicato. Se i replay tornano, forse tornano anche le amichevoli.

| Funzione | Numeri (per una patch) |
|---|---|
| `tracker_stats_overview` | partite, vittorie di chi traccia, giocatori, partite con la Leggendaria avversaria |
| `tracker_stats_legendaries` | win rate per Leggendaria del mazzo |
| `tracker_stats_lists` | win rate per lista esatta (13 carte): il sito la confronta con i mazzi della community (`deckListKey`) |
| `tracker_stats_archetypes` | win rate per archetipo (`suggestArchetype`, calcolato dal sito all'invio) |
| `tracker_stats_cards` | per carta: win rate quando è nel mazzo, win rate quando chi traccia la gioca, turno medio della prima giocata |
| `tracker_stats_matchups` | scontri fra Leggendarie (esito dal lato di chi traccia) |
| `tracker_stats_opponents` | Leggendarie più incontrate (la quota è partite / partite con la Leggendaria avversaria) |

- **Soglia di ogni numero**: almeno 20 partite di almeno 3 giocatori diversi (`tracker_stats_ok` = `TRACKER_STATS`);
  sotto soglia il numero non esce (null o riga assente). Si mostra appena la supera (decisione di Pierluigi). Sotto le
  100 partite porta l'etichetta **"prime stime"** (`isEarly`, soglia da confermare).
- **Per patch**: la patch in vigore alla fine della partita (`patchAt` di `cards.ts`, calcolata dal sito all'invio e
  salvata sulla riga). Niente somme di più patch né di più code: il totale meno una parte mostrata svelerebbe la parte
  sotto soglia. Le differenze fra tabelle diverse (per esempio una Leggendaria meno le sue liste mostrate) possono
  ancora rivelare la somma di gruppi piccoli: sono numeri di gioco senza nomi né id, rischio accettato.
- **Coda**: per ora tutte le partite (`tracker_stats_queue()` = null, `TRACKER_STATS.queue`); con molta più utenza solo
  la classificata: si cambiano insieme la funzione (una riga di SQL, migrazione) e la costante.
- **Solo i mazzi di chi traccia**, una volta per impronta: niente doppioni (la stessa partita da due account
  OriginsMeta con lo stesso account di gioco conta una volta), nessun collegamento fra utenti. Una partita fra due
  giocatori che tracciano conta due volte, una per lato, ognuna con il suo mazzo.
- Una partita cancellata (`tracker_forget`, account eliminato) esce subito dai numeri.
- Lettura dal sito: `src/lib/community/trackerStatsQueries.ts` (`readWinrate` per la pagina, `readWinrateGames` per lo
  stato della scheda, `readDeckWinrate` per il riquadro dei mazzi), che ricontrolla le risposte con `stats.ts`. Le
  chiamate sono POST (RPC): la data cache di Next le tiene solo con `cache: "force-cache"`, qui per 5 minuti, così le
  schede dei mazzi rigenerate nello stesso intervallo condividono una risposta. Patch mostrata: quella in corso, oppure
  la precedente finché quella in corso non ha numeri (la pagina lo dice).

**Patch nuove.** La patch si scrive sulla riga all'invio: se una patch esce prima che sia in `cards.ts`, le partite di
quelle ore restano sulla patch precedente. Dopo averla registrata (procedura "Patch nuove" di CLAUDE.md) si correggono
con una riga nel SQL Editor di Supabase (esempio per la 0.8 con l'ora del post):
`update public.tracked_matches set patch = '0.8' where ended_at >= '2026-10-20T18:00:00Z' and patch is distinct from '0.8';`

### Win rate sul sito

**Dal 02/10/2026 la pagina dei win rate e il riquadro nelle schede dei mazzi non ci sono più** (Pierluigi: "togliamo la
pagina del winrate, creiamo una pagina invece"): con la 0.7 i dati non bastano (vedi "I file del gioco"). Al loro posto
**`/analytics`** (`src/app/[locale]/(site)/analytics/page.tsx`, ISR, indicizzabile, in sitemap): che cosa fa il tool, con
gli screenshot dell'app e dell'overlay nelle tre lingue (`public/media/analytics/`, fatti con `--capture` su una copia
dei dati senza collegamento), perché è in pausa, che lo mostreremo a Koin Games, e il tasto **"Sei interessato al
tool?"** sopra e sotto (`AnalyticsInterest`): conta una volta per browser (numero a caso nel localStorage) e una per
account con la funzione `analytics_interest_add` (blocco `02/10/2026: INTERESSE ANALYTICS` di schema.sql, tetto di 30 al
minuto, la tabella non si legge direttamente; totali con `analytics_interest_count`), evento `analytics_interest`,
informativa `#analytics-interest`. Testi in `src/lib/analyticsLabels.ts` (test `analyticsLabels.test.ts`). Il vecchio
indirizzo porta lì con un 308 (next.config.ts) e la quarta scheda della tier list e la voce del sottomenu sono diventate
"Analytics · in pausa". Le funzioni `tracker_stats_*` restano nel database e `trackerStatsQueries.ts` resta nel codice,
per quando i dati torneranno. Quanti si sono iscritti: `select * from public.analytics_interest_count();` (browser e
account), oppure il numero sotto il tasto.

Proposta del 30/09/2026; Pierluigi: "fai 1 e 2". Fatti (tolti il 02/10/2026, vedi sopra):

1. **Pagina `/tier-list/win-rate`** (`src/app/[locale]/(site)/tier-list/win-rate/page.tsx`, ISR): quarta scheda della
   testata della tier list, "Win rate", con lo stato "in arrivo" o "N partite" (`tierSourceState`; sul telefono le
   schede stanno due per riga). Sezioni Leggendarie, Mazzi della community (lista esatta), Archetipi, Carte (nel
   mazzo, giocata, round medio della prima giocata), Scontri, Leggendarie più incontrate; "prime stime" sotto le 100
   partite; testi, fonte, campione e metodo in fondo (`PageNotes`). Senza numeri (o prima della migrazione) un riquadro
   spiega da dove arriveranno. **Noindex e fuori da hreflang finché la patch mostrata ha meno di 100 partite**; non è
   in sitemap: quando i numeri saranno solidi va aggiunta (`sitemapEntries.ts`, con la stessa condizione). Testi nei
   dizionari (`tier.winrate`, `tier.sourceWinrate*`), titolo e description controllati da `hubMeta.test.ts`.
2. **Riquadro nella scheda dei mazzi della community** (sotto il voto): "Win rate nelle partite registrate", con
   partite, patch e "prime stime", solo quando la lista esatta del mazzo supera la soglia; link alla sezione dei mazzi
   della pagina. Un errore o la migrazione mancante = niente riquadro, mai una scheda rotta.

Provati il 30/09 sul server locale: senza migrazione (stato vuoto, scheda "in arrivo", nessun riquadro, nessun errore)
e con dati d'esempio in memoria, solo locali e non committati (tutte le sezioni, il riquadro, EN/IT/ES, 375 px).

Restano da fare, quando Pierluigi vuole: 3. **scheda carta** ("Nelle partite registrate": win rate nel mazzo, quando
giocata, round medio; sulle Leggendarie gli scontri migliori e peggiori e quanto spesso si incontrano); 4. più avanti,
in home, una striscia "Win rate della patch" quando i numeri sono solidi.

## Overlay (Fase 4)

- **Finestra sopra il gioco** (`main.ts`, `src/overlay/`): piccola (380 × 136), trasparente, sempre in primo piano,
  fuori dalla barra delle applicazioni, aperta senza rubare il fuoco al gioco. Di base lascia passare i clic
  (`setIgnoreMouseEvents`); con "Sposta" si trascina e la posizione resta (`overlay.json`). Si accende dall'app o dal
  menu dell'icona. Con il gioco a schermo intero esclusivo Windows non la mostra: modalità finestra o senza bordi.
- **Sorgente per OBS**: l'app serve la stessa pagina su `http://127.0.0.1:47015/overlay/` (porte di riserva
  47016–47019), con `?lang=it|en|es` e `&layout=v` per la versione verticale; stato in `state.json` ogni 2 secondi.
  Solo 127.0.0.1, solo GET e HEAD, Host controllato (contro il DNS rebinding), niente cache.
- **Cosa mostra** (`overlayView`, con i test): mazzo scelto nel gioco con la Leggendaria, sessione (dall'avvio o da
  "Nuova sessione"), record del mazzo nello storico sul PC con la percentuale, ultima partita con la Leggendaria
  avversaria. Sempre "non affiliato a Koin Games". Niente bot o persona, rank, nomi.
- L'overlay per OBS del sito (`/overlay/deck`, pacchetto STREAM) resta per chi non usa l'app: mostra un mazzo
  pubblicato, non le partite.

## Deck tracker (dal 10/10/2026)

Pierluigi, 10/10/2026: "una seconda dashboard che fa vedere il deck in uso e se possibile aggiornarlo live, come un
tracker a tutti gli effetti". Un pannello verticale, sul modello della schermata del mazzo del gioco:

- **Cosa mostra** (`deckTrackerView` in `src/main/deckTracker.ts`, test `deckTracker.test.ts`): il mazzo scelto nel
  gioco (dai file, cambia appena lo si sceglie): il nome, con il round sulla stessa riga durante la partita, e le 13
  carte tutte uguali, la Leggendaria per prima con la stella e le altre per costo (Pierluigi, 10/10: "metti la
  leggendaria come le altre carte, il nome del deck e le carte tutte uguali, fine, meno spazio possibile"; il record
  del mazzo resta nei dati ma non si mostra), ognuna con miniatura intera (mai ritagliata), costo e pallini per le
  copie. Con lo
  scanner acceso (`--scan`/`--frames`) si aggiorna dal vivo: round, copie giocate spente (mai oltre le copie del mazzo),
  Leggendaria segnata "giocata", e sotto l'avversario con la Leggendaria della schermata VS e le carte che ha rivelato,
  con le copie viste. La partita resta nel pannello fino a 10 minuti dopo l'ultima lettura del mana (`LIVE_MS` di
  `frames.ts`, "Ultima partita"); "Round N" con il pallino verde finché il mana si legge (30 s). Solo quello che il gioco
  mostra: niente nomi, rank, bot o boss. Senza scanner il pannello mostra il mazzo e lo dice.
- **Finestra** (`main.ts`): accanto al gioco, sempre in primo piano, ridimensionabile, posizione e misure in
  `deck.json`; si accende dall'app (riquadro Overlay, "Mostra il deck tracker") o dal menu dell'icona, e torna aperta
  all'avvio se era aperta. Si aggiorna al massimo una volta al secondo. Con il gioco a schermo intero esclusivo
  Windows non la mostra sopra il gioco.
- **OBS**: la stessa pagina su `http://127.0.0.1:47015/overlay/deck?lang=it|en|es`, dati da `/overlay/deck.json`
  ogni 2 secondi (stesso server e stesse difese dell'overlay). Pagina in `src/overlay/deck.{html,ts,css}`.
- **Carte dell'avversario** (11/10/2026, Pierluigi: "il deck avversario crea un'altra tab dove si popola con le carte
  avversario", in una finestra separata): la stessa pagina con `view=opp`, in una seconda finestra a sinistra dello
  schermo (`opponent.json`), con la Leggendaria dell'avversario e le carte che rivela, che si riempiono man mano; per
  OBS `/overlay/deck?view=opp`. Il Deck tracker mostra solo il mio mazzo. In main.ts i due pannelli sono `panels.deck`
  e `panels.opp` (`openPanel`, `setPanel`). Dalla 0.3.7 è il **pannello a L** in alto a destra (vedi "Pannelli e
  scanner, 0.3.7").
- **Disegno di Davdas (0.3.4, 11/10/2026**; mockup e note Granola "tracker" dell'11/10: "colpo d'occhio immediato,
  non lettura"; scelte di Pierluigi: le carte si scuriscono quando si pescano, la vita è l'anello sotto l'eroe):
  - **il mio mazzo**: le 12 carte grandi in una griglia 4 × 3 per costo (dalla 0.3.7 3 per fila su 4 file), un po'
    scure quando è pescata una copia su due ("1/2"; dalla 0.3.7 il numero delle copie rimaste), scure quando sono
    pescate tutte; sotto, la Leggendaria a parte (scura quando pescata, con uno zoom al
    momento della pesca) e un riquadro con le carte ancora nel mazzo (25 meno le pescate, `DECK_SIZE`: la Leggendaria si
    pesca come le altre, lo dice il luogo "Emerge un eroe") e la vita dell'eroe (due segmenti);
  - **l'avversario**: più piccolo, Leggendaria, vita e numero di carte viste a sinistra, a destra le carte rivelate che
    compaiono una alla volta (si parte vuoti, mai caselle vuote). Le carte ancora nel suo mazzo non si sanno (le magie
    non restano sul tabellone): al loro posto le carte viste;
  - **niente scorrimento**: la finestra prende l'altezza del contenuto (`deckApi.fit`, IPC `deck:fit`), la larghezza la
    sceglie il giocatore (all'inizio 300 e 270 px) e le carte la seguono.
  - **niente cornice né titolo** (Pierluigi, 11/10: "togliere la barra di Windows e il titolo del deck"): finestre
    `frame: false`, si spostano trascinando il pannello (`-webkit-app-region: drag`), si allargano dai bordi, si chiudono
    con la × che compare al passaggio del mouse (IPC `deck:close`) o dall'app; niente nome del mazzo, "Avversario" né
    round. La dicitura "non affiliato a Koin Games" resta solo nella sorgente per OBS, quando il pannello va in onda
    (Pierluigi: "togliamola dai due deck, dobbiamo recuperare più spazio possibile"); resta nella finestra principale.
  - **Carte pescate** (`readHand` in `recognize.ts`): la mano in basso si legge scorrendo una finestra lungo la fascia,
    con la sola parte sinistra dell'illustrazione (ogni carta è coperta a destra dalla seguente; riferimenti in
    `src/card-art-hand.json`, generati da `npm run card-art`). Posizione e misura delle carte nelle tre forme di
    finestra (`HAND_SHAPE`): distanza dal fondo che segue l'altezza, larghezza che segue più o meno il tabellone. Prove
    dell'11/10: 6 su 6 a 2560 × 1440 (round 3), 3 su 3 nella finestra larga, 6 su 6 in quella 4:3, 80–104 ms a
    fotogramma. In `reconstruct.ts` le copie pescate di una carta sono il massimo di "in mano (stabili per 2 fotogrammi)
    più giocate nei round prima", mai meno delle giocate (`drawn`); sulla partita online dell'11/10: 19 carte pescate in
    9 round.
  - **Vita** (`readLife`): i due segmenti frontali dell'anello sotto la miniatura (Pierluigi: "sono 2 i segmenti della
    vita e sono quelli frontali, si scuriscono quando vengono colpiti"), parte del tabellone 3D (`LIFE_RINGS` in
    frazioni dell'area del tabellone, angoli 30–75° e 105–145°). Acceso: almeno 35% di punti luminosi e media ≥ 140
    (la miniatura può coprire un pezzo di arco); spento: ≤ 12% e media ≤ 120; i lampi bianchi non si leggono. Vale
    l'ultima lettura uguale per 2 fotogrammi di fila (`life` di `ScannedMatch`).
  - Mano e vita si leggono solo quando il mana si legge (tabellone a schermo). Anteprima della pagina con dati finti:
    uno script node che serve `dist/overlay` e un `deck.json` di esempio.
- **Da fare**: le carte ancora nel mazzo dell'avversario (le carte coperte in alto contano la sua mano, ma il dorso
  cambia con i cosmetici); le magie (vedi "Scanner dello schermo").

## Scanner dello schermo (dal 10/10/2026)

Il replay non c'è più (vedi "I file del gioco"), quindi carte giocate, Leggendaria e carte dell'avversario si
leggeranno dallo schermo (Pierluigi, 10/10/2026: "procediamo a svilupparla", senza chiedere a Kevin). Come OBS: l'app
riprende la finestra del gioco, mai il processo, la memoria o la rete (regola 1). Il riconoscimento gira sul PC, con le
immagini delle carte del sito, e al sito vanno solo gli id delle carte: nessun fotogramma lascia il PC.

- **S1, modalità cattura** (fatta): `npm run frames` nella cartella `tracker/` (cioè l'app con `--frames`), solo per lo
  staff, nessuna voce nell'interfaccia. `src/main/frames.ts` cerca ogni 5 s la finestra del gioco per titolo esatto
  (`GAME_WINDOWS` di `src/shared/frames.ts`, "Origins TCG Demo" dal file `app.info` del gioco); una finestra nascosta
  (`src/frames/`, sessione separata `frames`, unico permesso "media") la riprende a piena risoluzione e salva un JPEG
  ogni mezzo secondo, solo se lo schermo è cambiato (impronta 48 × 27 in grigi, `SAME_FRAME_DIFF`). File in
  `%APPDATA%\OriginsMeta Analytics\frames\<data_ora>\` con `events.jsonl` (inizio e fine della ripresa, mazzo scelto,
  partite registrate dal tracker con esito e mazzo) per etichettarli; tetto di 4 GB per sessione. Nel tooltip
  dell'icona "SCAN ● <fotogrammi>". Funziona anche a schermo intero (3 partite del 10/10 a 2560 × 1440). Prova
  senza il gioco: `ORIGINSMETA_FRAMES_WINDOW=<titolo esatto di un'altra finestra>`. **I fotogrammi contengono i nomi
  dei giocatori: restano sul PC.** In modalità cattura anche `scan.jsonl`, le letture dell'app fotogramma per fotogramma.
- **S2, riconoscitore** (fatto il 10/10, `src/shared/recognize.ts`, test `recognize.test.ts`): la zona
  dell'illustrazione ridotta a 20 × 20 colori medi, confrontata per correlazione con i riferimenti presi dalle immagini
  del sito (`src/card-art.json`, 220 carte su 230: le 10 senza immagine non si riconoscono; si rigenera con
  `npm run card-art` quando cambiano carte o immagini, con sharp che il sito ha già). Si accetta la carta con
  correlazione ≥ 0,5 e distacco ≥ 0,2 dalla seconda: sulle 3 partite carte vere 0,62–0,96 con la seconda sotto 0,57,
  spazi vuoti e dorsi scartati; la coppia più simile (Mama Bear e Papa Bear, 0,71) fallisce "non riconosciuta", mai
  scambiata. Legge i 18 spazi del tabellone (posizioni fisse in frazioni dell'area 16:9), le due Leggendarie della
  schermata VS (anche nella teca della carta gradata) e il mana del giocatore (cifre bianche con componenti connesse e
  modelli presi dai fotogrammi: indipendente dalla lingua del gioco). Il mana massimo è il round + 1 in tutte e 3 le
  partite (2 → 10, 9 round). 25 ms a fotogramma 2560 × 1440 compresa la decodifica del JPEG.
- **S3, partita ricostruita** (fatta il 10/10, `src/shared/reconstruct.ts`, test `reconstruct.test.ts`): divisione in
  partite (VS, mana che riparte, pause; una partita comincia con mana massimo ≤ 3, perché il tabellone d'apertura mostra
  "0/10"), letture del mana confermate da un'altra uguale entro 20 s, per round le copie di ogni carta per lato
  stabili per 2 fotogrammi contro il tabellone a fine del round prima: le copie in più sono giocate (regge sparizioni
  momentanee, carte spostate dagli effetti e le mie carte piazzate prima della rivelazione). Le carte create (tipo
  "token") non sono giocate. `applyScan` riempie la partita dello storico senza replay: Leggendaria e carte viste
  dell'avversario, round, giocate (mie solo le carte del mazzo: Christopher Robin evocato dal luogo, Ali Baba e Big
  Bad Wolf generati da effetti restano fuori; luoghi 0–2 come nel replay). Le partite del 10/10 ricostruite: io Queen of
  Hearts contro Merlin, Dracula e Three Not So Little Pigs, 9 round ciascuna, giocate di tutti e due i lati.
  **Limiti noti** (le magie si leggono dal 13/10/2026 dal riquadro in alto a sinistra: "Magie, pannelli e Twitch (0.4.2)"; prima: le magie non restano sul tabellone e non si leggevano, il riquadro grande a sinistra mostra anche le
  anteprime al passaggio del mouse, quindi non distingue le rivelazioni); una carta giocata e distrutta nello stesso
  round senza restare a schermo 2 fotogrammi non si vede; le carte dell'avversario evocate o generate da effetti non si
  distinguono da quelle giocate; il round è il mana
  massimo del giocatore meno uno, e gli effetti sul mana lo spostano (partita del 10/10 alle 15:44: "5/10" con un "-5" al
  round 10, l'avversario "11/11"). Ripresa cominciata a partita in corso (l'app avviata durante la partita): la partita
  si legge dal primo mana con carte sul tabellone, il Deck tracker la mostra, ma è incompleta (`complete`) e le sue
  giocate non entrano nello storico (dalla 0.3.6 ci entra comunque l'esito dello stendardo, vedi "Esito anche da una
  partita incompleta").
- **Finestre di qualunque forma (0.3.3, 11/10/2026**; Magic non registrava giocando in finestra, Pierluigi: "il gioco
  supporta solo schermo intero o in finestra, poi permette agli utenti di stirare lo schermo come vogliono"): il gioco
  non mette bande nere, riempie la finestra di qualunque forma (il minimo è circa 4:3). Misurato sul playtest con due
  partite contro il bot di Pierluigi, finestra 2042 × 853 (2,39:1) e 1160 × 869 (4:3), più le partite a schermo intero
  2560 × 1440: (1) la ripresa di una finestra comprende la **barra del titolo** di Windows (45 px al 150%) e un bordo di
  2 px: `windowContent` la riconosce come fascia uniforme in alto, ma solo se l'immagine non è grande come uno schermo
  (`screens`, le misure in pixel veri che il processo principale manda alla finestra nascosta); (2) **il tabellone è 3D**
  (spazi, carte e pannello del mana): resta centrato nell'area interna e cambia solo scala, con la larghezza dell'area
  16:9 "virtuale" S/H = 1,405 a 4:3, 16/9 a 16:9, 2,062 a 2,39:1 (`BOARD_SCALE`, interpolazione sui logaritmi; centro
  esatto: la ricerca ha dato scarto 0); (3) **l'interfaccia 2D** (scritte, stendardo) cresce con l'altezza:
  area 16:9 alta come la finestra e centrata (`layoutFor`, `ui`), che su una finestra stretta esce dai lati (lo stendardo
  conta solo le celle dentro l'immagine); (4) **la schermata VS** sta tutta dentro la finestra appoggiata in basso
  (`vs`: l'area 16:9 più grande che ci entra, allineata al fondo; partita online in finestra 4:3: Robin Hood contro
  Dracula, 0,92 e 0,78). Con lo schermo 16:9 le aree coincidono con l'immagine intera: la partita a
  schermo intero del 10/10 dà 8.614 carte lette contro le 8.613 dell'app. Nelle due finestre: 2.681 e 2.454 carte lette
  (prima 0), mana in 409 e 353 fotogrammi. Lo stendardo della sconfitta del playtest ha la parte alta viola: parte alta
  scura dal 60% (era 80%), riprovato su 5 sessioni senza falsi esiti. Gli allenamenti contro il bot non hanno la
  schermata VS; la VS in una finestra larga non è ancora verificata; i punti fuori da 4:3–2,39:1 (32:9) usano la pendenza degli estremi.
  Taratura: `scripts/fit-scale.mjs` (scala del tabellone), `scripts/fit-ui.mjs` (mana, VS, stendardo con aree diverse),
  `scan-frames.mjs --screen=<schermo>`.
- **Nell'app** (dalla 0.3.0 del 10/10/2026, Pierluigi: "acceso"): **acceso di default**, con un avviso al primo avvio
  (che cosa legge, che le immagini non escono dal PC, niente nomi; tasti "Ho capito" e "Spegnilo"), il riquadro
  "Scanner dello schermo" con l'interruttore e la voce nel menu dell'icona; preferenza in `scan.json` (`on`,
  `noticeSeen`), spento = ripresa ferma e letture in memoria cancellate. `--scan`/`--frames` lo accendono comunque,
  `--no-scan` lo spegne per le prove; `npm run frames` salva anche i fotogrammi. La finestra nascosta manda al processo principale solo le letture (`readScanFrame` ne controlla la forma), che restano
  in memoria un'ora; quando il tracker chiude una partita senza replay, `scanFor` + `applyScan` la completano e la
  partita parte per il sito con le carte giocate dall'avversario (regola 4). Lo scanner **non legge** la scritta
  "Battaglia Boss" né il nome dell'avversario (regola 2, regola 3). Taratura fuori dall'app:
  `node scripts/scan-frames.mjs <cartella sessione> <uscita.jsonl>` (dalla cartella `tracker/`).
- **Provato dentro l'app il 10/10**: letture uguali a quelle di `scan-frames.mjs` (tabellone 1.223 fotogrammi su
  1.224), partita intera nello storico con giocate e carte dell'avversario (Mulan contro Legion of the Dead).
- **Distribuzione (10/10/2026)**: `npm run package` fa lo zip della 0.3.0 e una copia con il nome fisso
  `OriginsMeta-Analytics-win-x64.zip`, da caricare su GitHub Releases del repo (il tasto di download di `/analytics`
  punta a `releases/latest/download/OriginsMeta-Analytics-win-x64.zip`; Discord no: i link degli allegati scadono e lo
  zip supera il limite senza Nitro). Pubblicare la release va confermato da Pierluigi. Soglia delle statistiche ancora
  quella di prova (Pierluigi, 10/10: "resta libera per ora").
- **Esito dallo schermo (0.3.1, 11/10/2026)**: lo stendardo di fine partita (testo bianco su fascia scura, parte alta
  scurita, pennellata menta per la vittoria e magenta per la sconfitta; uguale in demo e playtest e in ogni lingua) dà
  esito e ora della fine (`readResult`/`resultFromBanner` in recognize.ts, griglia 320 × 180; confermato da 2 fotogrammi,
  `RESULT_FRAMES` di reconstruct.ts). Taratura su 3.700 fotogrammi: 53 stendardi su 55, nessun esito sbagliato.
  `finishFromScreen` (main.ts): 30 s dopo lo stendardo, se il watcher non ha registrato una partita entro 3 minuti, la
  registra l'app con esito, mazzo scelto, giocate e carte dell'avversario (giocate e carte solo dalle partite viste
  intere; fino alla 0.3.5 anche l'esito, vedi la 0.3.6 qui sotto); se poi arriva
  quella del watcher si scarta. Provato dal vivo sul playtest l'11/10 (vittoria in 9 round, registrata da sola). Le 3
  partite della notte del 10/10 e la vittoria sul playtest dell'11/10 sono state completate o aggiunte nello storico di
  Pierluigi con uno script una tantum dai fotogrammi salvati: l'esito letto dallo schermo coincideva con quello dei file.
- **Aggiornamento automatico (0.3.2, 11/10/2026**, Pierluigi: "dobbiamo fare in modo che le app si aggiornino da sole
  quando rilasciamo una nuova versione"): `updater.ts` (solo nell'app impacchettata) chiede le release a GitHub 30 s
  dopo l'avvio e ogni 3 ore; `pickRelease` di `updateRules.ts` accetta solo tag `analytics-vX.Y.Z` pubblicati, non
  prerelease, con lo zip dal nome fisso all'indirizzo esatto del nostro repo e una dimensione plausibile; lo zip si
  scarica in `%TEMP%`, si controlla la dimensione, si scompatta con `tar.exe`; fuori dalle partite (scanner) l'app
  scrive uno script cmd (`Wait-Process` sull'app, `robocopy` della cartella nuova sopra quella vecchia, riavvio), lo
  lancia staccato e si chiude. Riga in cima all'app durante download e installazione. Provato l'11/10 su una copia con
  `ORIGINSMETA_UPDATE_FROM=0.3.0`: dalla 0.3.2 alla 0.3.1 scaricata da GitHub e riaperta da sola. La prima versione
  usava `tasklist | find`, che lanciato dall'app senza console restava bloccato su `find`. Chi ha la 0.3.0 o la 0.3.1
  aggiorna a mano una volta. Niente firma ancora (Fase 5): la difesa è l'indirizzo esatto su github.com via HTTPS e la
  dimensione dichiarata da GitHub. Tasto "Chiudi l'app" in alto a destra (Pierluigi, 11/10).
- **Niente zoom nei pannelli (0.3.5, 11/10/2026**; andrez2205 aveva ingrandito il Deck tracker con Ctrl + rotella e il
  pannello restava ingrandito): Chromium ricorda lo zoom di ogni pagina nel file `Preferences` dei dati dell'app
  (`%APPDATA%\OriginsMeta Analytics`), che la disinstallazione non tocca, quindi reinstallare non bastava. `lockZoom`
  (main.ts), applicata ai due pannelli (`openPanel`) e all'overlay (`openOverlay`): a ogni `zoom-changed` e a ogni
  `did-finish-load` rimette `setZoomFactor(1)`, blocca lo zoom a pizzico (`setVisualZoomLevelLimits(1, 1)`) e, se il
  doppio clic sulla zona trascinabile massimizza la finestra, la riporta subito com'era. Chi ha già un pannello
  ingrandito torna normale da solo con la 0.3.5; se no: chiudere l'app e cancellare `deck.json`, `opponent.json` e
  `Preferences` in `%APPDATA%\OriginsMeta Analytics`. La finestra principale lo zoom lo tiene.
- **Esito anche da una partita incompleta (0.3.6, 11/10/2026**; Magic gioca il playtest in finestra: pannelli giusti,
  ma vittorie e sconfitte mai registrate): fino alla 0.3.5 `finishFromScreen` registrava solo le partite viste dal
  round 1 (`complete`), e in una finestra piccola il mana si legge a tratti, quindi la partita risultava incompleta e
  si perdeva anche l'esito. Adesso l'esito vale comunque: se la partita ricostruita non ha l'esito, lo dà
  `resultAround` (reconstruct.ts: lo stendardo confermato da 2 fotogrammi, `RESULT_FRAMES`, da 5 s prima a 60 s dopo
  l'ora dello stendardo; un fotogramma solo o lontano non conta, test in `reconstruct.test.ts`), attraverso
  `FrameRecorder.resultNear` (frames.ts). La partita entra nello storico con esito, ora e mazzo scelto; giocate e
  carte dell'avversario solo se è completa (`applyScan`). In più le cifre del mana si leggono da 6 px di altezza
  (`whiteGlyphs` in recognize.ts, prima 10), così il mana si legge anche nelle finestre piccole. **Da provare dal
  vivo** con la partita online di Magic, poi controllo con `node scripts/tracker-usage-compare.mjs <ora ISO>`.
- **Pannelli e scanner (0.3.7, 11/10/2026 sera**, prova in partita con Pierluigi, screenshot dei pannelli sopra il
  gioco con `CopyFromScreen` di PowerShell: quelli di computer-use non mostrano le finestre sempre in primo piano):
  - **Deck tracker rifinito** (Pierluigi: "manteniamo come siamo, ma andiamo a disegnarlo meglio"): 3 carte per fila
    su 4 file, largo 230 px all'inizio, nella fascia libera a sinistra del tabellone ("facciamo 3 in 4 file, che si
    dovrebbe stringere"). Tre stati a colpo d'occhio: accesa (tutte le copie nel mazzo), spenta a metà con il numero
    grande delle copie **rimaste** in alto (prima "1/2" delle pescate, in basso, sopra i crediti della carta e quasi
    uguale a una carta accesa), scura (finita); bordo menta per una copia in mano non ancora giocata (`played` e `drawn`
    di `DeckCard`); il filtro sta solo sull'immagine, così numero e bordo restano pieni. Carte nel mazzo con "su 25" e
    una barra che si svuota (larghezza dal JavaScript: la CSP non ammette `style` nell'HTML), vita persa in magenta.
  - **Pannello a L dell'avversario** (disegno di Pierluigi sul tabellone: le due zone libere sono la fascia a sinistra e
    l'angolo in alto a destra con la colonna sul bordo destro; "pannello unico a L, e leggi anche la direzione"):
    finestra trasparente larga 400 punti appoggiata all'angolo in alto a destra (`OPP_L_WIDTH`, `panelBounds`). Il
    braccio in alto ha la Leggendaria dell'avversario (o un dorso "?" quando non si sa, come negli allenamenti senza
    schermata VS), la vita e le carte viste; la colonna sul bordo destro sta sopra il pannello "MANA DATA" del gioco e
    lo rimostra (mana dell'avversario con la tacca magenta, la freccia del combattimento, il mio mana con la tacca
    azzurra), poi le carte rivelate 3 per fila. L'angolo in basso a sinistra è vuoto: lì i clic vanno al gioco
    (`deckApi.hit` → IPC `deck:hit` → `setIgnoreMouseEvents(…, { forward: true })` finché il puntatore non è sopra il
    braccio o la colonna). Senza carte viste, al posto della griglia la frase d'attesa (prima riquadro tratteggiato e
    zeri). I pannelli partono dalle posizioni nuove solo se il giocatore non ne ha salvata un'altra.
  - **Mana dell'avversario e freccia** (recognize.ts): `OPP_MANA_TEXT` (stesso pannello, 182 punti più su del mio e un
    po' più largo per "10/10") e `readDirection` (pixel azzurri della freccia in `COMBAT_ARROW`: il verso è il lato del
    picco, la punta). Su 5 sessioni, a schermo intero e in finestra: mana dell'avversario letto nell'85% dei fotogrammi
    col tabellone, massimo sempre uguale al mio; freccia sempre verso destra. **Verso sinistra mai visto**: è la stessa
    misura specchiata, da verificare alla prima partita che lo mostra. Nelle letture (`ScanFrame.mana`,
    `ScanFrame.direction`) e nella partita ricostruita l'ultima lettura confermata da 2 fotogrammi (`stableLast`).
  - **Stendardo sopra un'animazione**: la sconfitta in classificata delle 17:37 arrivava dopo l'animazione della
    Leggendaria dell'avversario, con lo sfondo viola (parte alta scura al 16–20%, la soglia era 60%) e non si è
    registrata. Ora lo stendardo vale anche senza la parte alta scura se la scritta è piena (`BANNER.fullWhite` 45,
    `fullDark` 25): sugli 8.194 fotogrammi di 16 sessioni (uno su due) prende solo quei 29, nessun esito sbagliato.
    La partita è stata aggiunta allo storico di Pierluigi con uno script una tantum dai fotogrammi salvati.
  - **Aggiornamento automatico** (Magic, 11/10 alle 17:32: "ogni tanto succede questo, dura qualche secondo, si toglie
    e poi si bugga il tracker", con la console nera sopra il gioco, "e non mi ha contato la partita"): (1) Node su
    Windows ignora `windowsHide` con `detached: true`, quindi la console di `cmd.exe` dello script si vedeva: ora lo
    script parte da un VBScript (`launcherScript` in updateRules.ts, `wscript.exe //B`, `Run …, 0, False`), provato
    con una cartella con spazi; (2) l'app si installava appena lo scanner diceva "fuori partita", che in una finestra
    piccola sbaglia: si chiudeva in partita e la partita andava persa. Ora si installa **solo a gioco chiuso**
    (`canInstall` di main.ts: niente finestra del gioco fra quelle aperte), riprovando ogni 2 minuti. Chi ha la 0.3.6
    o prima vede la console un'ultima volta, quando installa la 0.3.7.
- **0.3.8 (12/10/2026**, sessione sul gioco con Pierluigi):
  - **Carte ALPHA**: illustrazioni diverse dal sito (a volte disegni nuovi, non solo inquadrature: le versioni
    "zoomate" delle immagini del sito non bastano). Riferimenti in più in `src/card-art-extra.json` (vettori 20 × 20 dai
    fotogrammi, nessuna immagine nel repo): Piglet, Big Bad Wolf, Wicked Stepsisters, Scarecrow, Huntsman,
    Bandersnatch, più Shield Maiden normale in una posa che sfuggiva; Merry Man tolto (rubava altre carte). `bestMatch`
    misura il distacco dalla migliore carta **diversa**. Si imparano partita per partita: fotogrammi raccolti con
    `npm run frames`, letture non riconosciute raggruppate, un nome per gruppo guardando un esemplare, controllo su
    tutte le sessioni che nessuna carta cambi nome. Zombie no: somiglia al dorso rosa del mazzo.
  - **Pannello a L**: largo 480, carte viste 4 per fila con il mana sotto; larghezza fissa e sempre dentro lo schermo;
    trascinamento fatto dall'app (`deck:drag`) con `setBounds`, perché con la scala al 150% `setPosition` allarga la
    finestra di un pixel a ogni passo. "Vita" diventa "Barriere" (glossario del gioco).
  - **Carte rimanenti dell'avversario** (al posto di "Viste"): stima dalla sua mano coperta in alto (`readOppHand`:
    fino a 4 carte la larghezza della fila, 123 + 148 punti a carta; da 5 il passo della ripetizione), pescate = prima
    lettura + aumenti dopo 6 letture uguali (`OPP_HAND_STABLE`); senza stima se la mano si legge in meno del 30% dei
    fotogrammi (`OPP_HAND_MIN_SHARE`: i dorsi bianchi e rossi del boss).
  - **Deck tracker**: numero delle copie rimaste da 2 (1 la Leggendaria) in basso al centro, sopra la cornice dei crediti;
    a zero la carta è scura. Linguetta stile cartella con il logo e la X (note Granola "pagina winrate" del 12/10);
    finestre trasparenti, quindi una maniglia in basso a destra per allargarlo (`deck:resize`).
  - **Vittoria contro un boss**: lo stendardo "BOSS SCONFITTO!" ha la pennellata gialla (`yellow` di
    `bannerFeatures`), che ora vale come la menta; prima un alone rosso nel passaggio la faceva leggere come sconfitta.
  - **Doppioni**: una partita dei file con lo stesso esito di una già nello storico a meno di 3 minuti è la stessa,
    anche dopo un riavvio. Correzioni sul sito con `scripts/tracker-fix-match.mjs` (il sito non sovrascrive).
  - **Finestra principale**: Account, Overlay e Scanner sono tendine con una riga di stato (dalla 0.4.1 in Setup); mini tutorial al primo
    avvio con il riflettore sulle parti della finestra e i pannelli che pulsano (`tracker:spot-panels`), da rivedere
    con il link in fondo.
- **Da fare**: mazzo probabile dell'avversario (le carte viste contro i mazzi pubblicati e le liste registrate); magie;
  statistiche per carta sul sito (win rate quando una carta viene giocata); carte in versione ALPHA e cosmetiche
  dell'avversario, che lo scanner non riconosce (11/10 sera: Piglet ALPHA letta in 2 fotogrammi su 701), con
  riferimenti presi dai fotogrammi sul PC come le cifre del mana; freccia del combattimento verso sinistra.

## Partite contro i bot (0.4.7, 14/10/2026)

Pierluigi, dopo una serie di 6 sconfitte con Mulan contro il bot: le partite contro i bot "devono non solo essere
rimosse dalle statistiche ma anche non devono più essere registrate", e il bot si riconosce dal nome ("devi fare in modo
che il tracker legga i nomi"). Il bot che ha visto è **Big Bob** (il manichino col bersaglio, titolo "La pratica rende
perfetti", comandante `H0001` nei dati del gioco); i boss della Battaglia Boss hanno "(BOT)" dopo il nome ("RED (BOT)").

- **Lettura**: nella schermata VS (Leggendarie di tutti e due riconosciute) la finestra nascosta ritaglia il nome in basso a
  destra (`VS_OPP_NAME` in recognize.ts, frazioni dell'area `vs`), lo raddrizza (è in corsivo, `VS_NAME_SHEAR`) e lo
  ingrandisce (`VS_NAME_SCALE`), fino a tre ritagli per schermata; il processo principale lo legge con l'**OCR di
  Windows** (Windows.Media.Ocr da PowerShell, `main/ocr.ts`: nessuna dipendenza nuova, niente rete; il PNG sta sul disco
  il tempo della lettura). Il TextDetector di Chromium in Electron 44 non c'è (provato con le opzioni sperimentali).
- **Decisione** (`shared/botNames.ts`, test `botNames.test.ts`): bot se il nome intero è in `bot-names.json` (lettere e
  cifre, maiuscole, 0/O, 1/I, 5/S, 8/B ripiegati) o finisce con "(BOT)". Resta solo `{ ms, bot }`, mai il nome. La
  partita è contro un bot se lo dice la schermata VS più recente prima della fine (`botMatch`, entro 40 minuti); una
  lettura non riuscita conta come "non bot", così una partita contro una persona non eredita la schermata di prima.
- **Effetto** (main.ts): la partita contro un bot non entra nello storico e non parte per il sito, né dallo schermo
  (`finishFromScreen`) né dai file del gioco (watcher; il segnaposto in `fromScreen` scarta anche le statistiche che
  arrivano in ritardo). Nella modalità cattura `events.jsonl` scrive `match-bot` (senza nome).
- **Limiti**: con lo scanner spento, o se la schermata VS non si vede (gioco ridotto a icona, allenamenti senza VS), la
  partita si registra come prima. Un nome nuovo di bot va aggiunto a `bot-names.json` (nuova versione dell'app).
- **Prova** sui 15 fotogrammi VS salvati dal 10 al 12/10: "BIG BOB" e "(BOT)" riconosciuti, gli altri 13 nomi no
  (`scripts/bot-names-check.ts`, istruzioni in testa al file).
- **Partite già sul sito**: il sito non ha i nomi, quindi non sa quali partite già arrivate erano contro un bot; si
  tolgono a mano con `scripts/tracker-fix-match.mjs <utente> <id> delete`.

**Nome dell'avversario: decisione aperta** (resta aperta per tutto quello che non è riconoscere i bot). Pierluigi (10/10/2026) vuole che chi gioca veda sul sito lo storico delle
sue partite con il nome dell'avversario, i mazzi e le statistiche della partita. Va contro la regola 3, che cita i
termini di Koin (Terms of Use §2.3: niente dati di altri utenti senza consenso), e contro la regola 2 (i nomi dei bot si
riconoscono). Finché Pierluigi non decide su questo punto, il nome non si legge; tutto il resto dello scanner non ne
dipende.

## Migrazione e prove

- Prova in memoria (nessun database vero): lo script `tracker-test.mjs` con PGlite nello scratchpad della sessione del
  30/09 applica il blocco due volte e prova collegamento, invio, permessi, cancellazione e soglie (59 controlli, tutti
  verdi il 30/09/2026). Non sta nel repo (PGlite non è una dipendenza).
- **Prova a secco sul database vero**, da lanciare a mano (transazione con rollback, nulla resta):
  `node scripts/tracker-dry-run.mjs` dalla radice del repo (legge `.env.local` della cartella corrente, altrimenti quello
  del checkout principale); usa i primi quattro profili iscritti solo dentro la transazione.
- **Migrazione**: `node scripts/db-migrate.mjs` da un checkout aggiornato con questo lavoro e con `.env.local` (di solito
  il checkout principale dopo il merge su main). Il codice regge la migrazione mancante: rotte 503, pagina "non ancora
  disponibile".
- Dopo la migrazione: rifare la prova completa con l'app (codice, invio, scollegamento) e con due o tre account per
  vedere le statistiche superare la soglia.

## Da decidere

- Win rate anche sulle schede carta e in home (punti 3 e 4 qui sopra); quando togliere il noindex e mettere la pagina in
  sitemap.
- Quando mostrare il riquadro in `/account` a tutti (`TRACKER_ACCOUNT_LINK_PUBLIC`) e togliere il testo "in prova".
- Soglia delle "prime stime" (100 partite) e quando passare alle sole classificate.
- Firma e distribuzione dell'app (certificato annuale o Microsoft Store), pagina per scaricarla, aggiornamenti.
- Uso dei dati del client (poteri leggendari, luoghi): contengono anche carte non annunciate.

## Avvio automatico e pannelli sopra il gioco (0.4.7, 16/10/2026)

- **Avvio con il gioco** (Pierluigi: "aggiungi avvio automatico con l'avvio del gioco ma senza aprire il builder, solo
  icona vicino all'orologio… a noi ci interessa il tracking delle sue partite principalmente"). `src/main/startup.ts`
  (test `startup.test.ts`): tre scelte, "Con il gioco" (di default), "Con Windows", "Mai", nella pagina Setup e nel
  menu dell'icona, salvate in `startup.json`. Windows non sa lanciare un programma quando ne parte un altro senza
  permessi da amministratore, quindi "con il gioco" è la stessa voce "Esegui all'avvio" di prima con
  `--hidden --wait-game`: l'app aspetta senza icona, finestre né letture e guarda ogni 10 secondi `tasklist`
  (`gameRunning`: `OriginsTCG*.exe`); quando vede il gioco parte solo nella barra e registra le partite. Avviata in
  automatico (con il gioco o con Windows) non apre la finestra né overlay e pannelli: quelli aperti l'ultima volta
  tornano quando il giocatore apre l'app (`layersDeferred`, `openSavedLayers`), e dal menu dell'icona si accendono
  uno per uno. Se il giocatore apre l'app mentre aspetta il gioco, parte subito con la finestra. Al primo avvio della
  0.4.7 (`initialStartMode`): chi aveva "Avvia con Windows" acceso lo tiene, chi l'aveva disattivato da Gestione
  attività resta spento, tutti gli altri passano a "Con il gioco". In sviluppo nessuna scelta automatica.
- **Pannelli che sparivano** (Pierluigi: "a volte scompaiono i layer anche con disattivato il flag… per rimetterli
  devo sflaggare e riflaggare"): per Electron una finestra minimizzata o coperta è ancora visibile, quindi
  `syncPanelVisibility` non faceva niente. Ora ogni 1,5 secondi `layerAction` (`src/main/panelVisibility.ts`, test
  `panelVisibility.test.ts`) rimostra le finestre minimizzate e riporta in primo piano pannelli e overlay
  (`setAlwaysOnTop` + `moveTop`, senza prendere il fuoco), mai mentre il giocatore li usa o li allarga. Causa non
  riprodotta dal vivo: da confermare sul gioco.
