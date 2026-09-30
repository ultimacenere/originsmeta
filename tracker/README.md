# OriginsMeta Analytics (cartella `tracker/`)

Fino al 01/10/2026 si chiamava OriginsMeta Tracker (Pierluigi: "chiamiamolo Analytics e non tracker"): il nome cambia
dove si vede, nel codice resta "tracker". App desktop per Windows che registra da sola le partite di Origins TCG leggendo, in sola lettura, i file che il gioco
salva sul PC. Guida completa (file del gioco, formato dei replay, regole, fasi, collegamento, statistiche, overlay):
[`../docs/tracker.md`](../docs/tracker.md).

## Cosa fa

- Icona accanto all'orologio; clic = finestra. Chiudere la finestra la nasconde: il tracker continua a registrare.
- Riconosce la fine di ogni partita (statistiche del profilo), aspetta il replay (fino a un minuto) e salva la partita:
  esito, coda (classificata o normale, non mostrata), mazzo con nome e codice del gioco, rank, Leggendaria
  dell'avversario, carte giocate round per round.
- Storico sul PC in `%APPDATA%\OriginsMeta Analytics\` (`matches.jsonl`, `state.json`; al primo avvio col nome nuovo
  copiati da `%APPDATA%\OriginsMeta Tracker\`).
- Grafica del sito (01/10/2026): font, logo e carte intere con le immagini di originsmeta.com (vedi docs/tracker.md).
- **Account OriginsMeta** (Fase 3): con il codice creato su originsmeta.com/account/tracker l'app si collega
  all'account (token cifrato con la protezione dei dati di Windows in `account.json`) e manda le partite al sito
  (`sync.json` tiene quelle già mandate): dell'avversario solo la Leggendaria e le carte che ha giocato. Le partite di
  chi collega l'app entrano sempre anche nelle statistiche anonime del sito: l'app lo dice prima del collegamento.
- **Overlay** (Fase 4): finestrella sopra il gioco (sempre in primo piano, lascia passare i clic finché non si sceglie
  "Sposta", posizione in `overlay.json`) e la stessa pagina come sorgente Browser per OBS su
  `http://127.0.0.1:47015/overlay/` (`?lang=`, `&layout=v`), solo su questo PC.
- Interfaccia e menu dell'icona in inglese, italiano e spagnolo secondo la lingua di Windows.
- "Avvia con Windows" è spento finché il giocatore non lo accende (nella finestra o nel menu dell'icona).

## Regole (da docs/tracker.md)

- Solo lettura, mai il processo del gioco, mai i token della cache.
- **Mai dire se l'avversario è un bot o una persona**: niente segnale bot, modalità "BotBattle" o rank dell'avversario
  in nessuna parte dell'app (test in `src/main/watcher.test.ts`, `sync.test.ts`, `overlay.test.ts` e nel lettore).
- Mai nomi né id di giocatori o partite; il mazzo completo dell'avversario resta sul PC.

## Comandi (dalla cartella `tracker/`)

```
npm install        # Electron ed esbuild (se il binario di Electron manca: node node_modules/electron/install.js)
npm start          # build + avvio dell'app
npm test           # test dell'app (cartelle finte del gioco, rete finta, server locale su 127.0.0.1)
npm run typecheck  # tipi dell'app e del lettore
npm run capture    # screenshot della finestra in out/capture.png (verifiche)
```

- `npm run build` rigenera anche `src/cards.json` dal database carte del sito (`../src/lib/data/cards.ts`).
- Prove senza toccare lo storico vero: `ORIGINSMETA_TRACKER_DATA=<cartella>` (dati dell'app),
  `ORIGINSMETA_TRACKER_CACHE` e `ORIGINSMETA_TRACKER_REPLAYS` (cartelle del gioco finte, separate da `;`),
  `ORIGINSMETA_TRACKER_SITE=<https://anteprima… o http://localhost:3000>` (sito a cui collegarsi).
- Icona: `npx electron scripts/make-icon.cjs` la rigenera da `../src/app/icon.svg` (assets/icon.ico e icon.png).
- Un'app già aperta (una sola copia) va chiusa dal menu dell'icona ("Esci") prima di avviare una build nuova; la
  modalità `--capture` non ne tiene conto e si può usare anche con l'app aperta.

## Struttura

- `src/main/main.ts`: processo principale (icona, finestre, avvio con Windows, collegamento, invio, overlay, IPC,
  sicurezza).
- `src/main/watcher.ts`: il tracker (file del gioco, attesa del replay, coda, partite); `store.ts`: storico sul PC;
  `paths.ts`: cartelle del gioco.
- `src/main/account.ts`: token cifrato; `sync.ts`: codice → token e coda di invio; `overlay.ts`: dati dell'overlay e
  server della sorgente per OBS.
- `src/preload/preload.ts` (le funzioni che l'interfaccia può chiamare) e `overlay-preload.ts` (la finestra
  dell'overlay può solo leggere i suoi dati).
- `src/renderer/`: interfaccia (HTML, CSS, TypeScript senza librerie); `src/overlay/`: la pagina dell'overlay.
- Il lettore dei file e la forma delle partite da mandare sono quelli del sito, `../src/lib/tracker/` (con i loro test
  in `npm test` del sito): esbuild li mette nel pacchetto, non ce n'è una copia.

## Non ancora (Fase 5)

Installer firmato, aggiornamenti automatici, pagina per scaricare l'app, prova con pochi giocatori e lancio.

OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.
