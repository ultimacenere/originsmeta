# Tracker/overlay

Guida tecnica del tracker di OriginsMeta (stato, decisioni e storia anche nella KB, §1 punto 46). Nome deciso da
Pierluigi il 26/09/2026: il **tracker** registra le partite, l'**overlay** le mostra. **Dal 01/10/2026 il nome pubblico
è OriginsMeta Analytics** (Pierluigi: "chiamiamolo Analytics e non tracker"): app, finestra, menu dell'icona, overlay e
testi del sito. Nel codice, negli indirizzi (`/account/tracker`, `/api/tracker/*`), nelle tabelle (`tracker_*`) e in
questa guida resta "tracker".

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
| S4 | Mazzo probabile dell'avversario, magie, statistiche sul sito, accensione per tutti | da fare |

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
3. **Mai nomi né id** di giocatori o partite fuori dal lettore: dell'id della partita resta un'impronta salata con
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
  dell'ultima partita è nuova, aspetta il replay fino a un minuto e registra la partita con il lettore, con la coda dal
  nome del replay e da `BattleMode`; senza replay la registra con esito e mazzo. Al primo avvio registra l'ultima
  partita solo se il suo replay è ancora lì. Cartelle del gioco in `paths.ts`.
- `src/main/store.ts`: `%APPDATA%\OriginsMeta Analytics\matches.jsonl` (una partita per riga, v1 e v2) e `state.json`.
  Fino al 01/10/2026 la cartella era `OriginsMeta Tracker`: al primo avvio col nome nuovo `main.ts` ne copia i dati
  (`moveOldData`: storico, stato, invii, collegamento, overlay; la cartella vecchia resta).
- `src/main/account.ts`, `sync.ts`: collegamento e invio (sotto). `src/main/overlay.ts`: overlay (sotto).
- `src/main/main.ts`: icona nella barra (menu in EN/IT/ES), finestra che si nasconde invece di chiudersi, una sola
  copia, "Avvia con Windows" spento di default, sicurezza (contextIsolation, sandbox, nessuna navigazione, nessun
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
- Test: `npm test` in `tracker/` (27 test: watcher con la coda, storico con le v1, invio con una rete finta, token
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
  **Limiti noti**: le magie non restano sul tabellone e non si leggono (il riquadro grande a sinistra mostra anche le
  anteprime al passaggio del mouse, quindi non distingue le rivelazioni); una carta giocata e distrutta nello stesso
  round senza restare a schermo 2 fotogrammi non si vede; le carte dell'avversario evocate o generate da effetti non si
  distinguono da quelle giocate; posizioni misurate solo a 16:9 con l'interfaccia della demo 0.7.
- **Nell'app**: `npm run scan` (l'app con `--scan`) legge senza salvare niente; `npm run frames` legge e salva. La
  finestra nascosta manda al processo principale solo le letture (`readScanFrame` ne controlla la forma), che restano
  in memoria un'ora; quando il tracker chiude una partita senza replay, `scanFor` + `applyScan` la completano e la
  partita parte per il sito con le carte giocate dall'avversario (regola 4). Lo scanner **non legge** la scritta
  "Battaglia Boss" né il nome dell'avversario (regola 2, regola 3). Taratura fuori dall'app:
  `node scripts/scan-frames.mjs <cartella sessione> <uscita.jsonl>` (dalla cartella `tracker/`).
- **Da fare**: provarlo dentro l'app con una partita vera; mazzo probabile dell'avversario (le carte viste contro i
  mazzi pubblicati e le liste registrate); magie; poi S4, statistiche sul sito (win rate di mazzi e carte, win rate
  quando una carta viene giocata), e la decisione su quando accenderlo per tutti, con l'informativa aggiornata.

**Nome dell'avversario: decisione aperta.** Pierluigi (10/10/2026) vuole che chi gioca veda sul sito lo storico delle
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
