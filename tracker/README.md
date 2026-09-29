# OriginsMeta Tracker

App desktop per Windows che registra da sola le partite di Origins TCG leggendo, in sola lettura, i file che il gioco
salva sul PC. Guida completa (file del gioco, formato dei replay, regole, fasi): [`../docs/tracker.md`](../docs/tracker.md).

## Cosa fa (Fase 2)

- Icona accanto all'orologio; clic = finestra. Chiudere la finestra la nasconde: il tracker continua a registrare.
- Riconosce la fine di ogni partita (statistiche del profilo), aspetta il replay (fino a un minuto) e salva la partita:
  esito, mazzo con nome e codice del gioco, rank, Leggendaria dell'avversario, carte giocate round per round.
- Storico sul PC in `%APPDATA%\OriginsMeta Tracker\` (`matches.jsonl`, `state.json`); niente va in rete.
- Interfaccia in inglese, italiano e spagnolo secondo la lingua di Windows.
- "Avvia con Windows" è spento finché il giocatore non lo accende (nella finestra o nel menu dell'icona).

## Regole (da docs/tracker.md)

- Solo lettura, mai il processo del gioco, mai i token della cache.
- **Mai dire se l'avversario è un bot o una persona**: niente segnale bot, modalità "BotBattle" o rank dell'avversario
  in nessuna parte dell'app (test in `src/main/watcher.test.ts` e nel lettore).
- Mai nomi né id di giocatori o partite; dell'avversario la finestra mostra la Leggendaria e le carte che ha giocato,
  non il mazzo completo (decisione aperta: il dato resta solo nello storico sul PC).

## Comandi (dalla cartella `tracker/`)

```
npm install        # Electron ed esbuild (se il binario di Electron manca: node node_modules/electron/install.js)
npm start          # build + avvio dell'app
npm test           # test del tracker (cartelle finte del gioco in una cartella temporanea)
npm run typecheck  # tipi dell'app e del lettore
npm run capture    # screenshot della finestra in out/capture.png (verifiche)
```

- `npm run build` rigenera anche `src/cards.json` dal database carte del sito (`../src/lib/data/cards.ts`).
- Prove senza toccare lo storico vero: `ORIGINSMETA_TRACKER_DATA=<cartella>` (dati dell'app),
  `ORIGINSMETA_TRACKER_CACHE` e `ORIGINSMETA_TRACKER_REPLAYS` (cartelle del gioco finte, separate da `;`).
- Icona: `npx electron scripts/make-icon.cjs` la rigenera da `../src/app/icon.svg` (assets/icon.ico e icon.png).

## Struttura

- `src/main/main.ts`: processo principale (icona, finestra, avvio con Windows, IPC, sicurezza).
- `src/main/watcher.ts`: il tracker (file del gioco, attesa del replay, partite); `store.ts`: storico sul PC;
  `paths.ts`: cartelle del gioco.
- `src/preload/preload.ts`: le cinque funzioni che l'interfaccia può chiamare.
- `src/renderer/`: interfaccia (HTML, CSS, TypeScript senza librerie).
- Il lettore dei file è quello del sito, `../src/lib/tracker/` (con i suoi test in `npm test` del sito): esbuild lo
  mette nel pacchetto, non ce n'è una copia.

## Non ancora (fasi successive)

Collegamento all'account OriginsMeta e invio delle partite (Fase 3), overlay sopra il gioco e sorgente per OBS
(Fase 4), installer firmato e aggiornamenti automatici (Fase 5).

OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.
