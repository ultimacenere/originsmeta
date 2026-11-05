# Broadcasting OM in diretta dal sito ed estensione Twitch (05/11/2026)

Pierluigi, ripresa del tool per lo streaming dei tornei: "Estensione Twitch", poi "vorrei capire come si usa, mi puoi fare
una guida?" (guida d'uso: https://claude.ai/artifact/NW59uHpGVJefej77Dwk4pY). Il prototipo del 16/10 (README,
"Broadcasting OM") teneva lo stato solo nel browser; da qui la regia lo salva sul sito.

## Perché

- **OBS**: il pannello (dock) della regia e la fonte browser dell'overlay non si parlano. OBS tiene i dati dei pannelli in
  un profilo del browser suo (`%APPDATA%\obs-studio\plugin_config\obs-browser\obs_profile_cookies\<id>\`, con il suo
  `Local Storage`) e quelli delle fonti nella radice di `obs-browser` (verificato il 05/11/2026 su OBS 32.2.2 di questo
  PC): BroadcastChannel e localStorage del prototipo non passano. Il prototipo lo dava per "atteso ma non verificato".
- **Twitch**: chi guarda è su un altro computer; l'estensione ha bisogno dello stato su un server.

## Da dove viene la partita

In onda va una **registrazione** (Pierluigi, 06/11/2026: "il broadcasting è di partite registrate dagli utenti che
condividono con chi gestisce il torneo"). Non abbiamo accesso alla partita in diretta né API del gioco: nomi, mazzi,
punteggio e copie giocate li scrive chi fa regia. Il file lo trascina in OBS chi trasmette, sotto la fonte Browser
(scelta di Pierluigi del 06/11: il video non passa dalla regia né dal sito; ospitarlo sul sito chiederebbe Supabase Pro,
perché il piano Free ha 50 MB a file e 1 GB in tutto). Il replay del gioco non c'è: dalla 0.7 il gioco non lo salva
(0 file `.replay` sul PC di Pierluigi il 06/11) e per Koin non è ancora pronto per i giocatori (AMA del 05/10). La
modalità spettatore è una promessa di Tim per il broadcast di dicembre, l'API un'offerta per quando ci sarà il loro sito
dei tornei.

**Prova in OBS vero** (06/11/2026): OBS 32.2.2 in una copia in una cartella temporanea con `--portable` (l'OBS di
Pierluigi non è stato toccato), scena con `ffmpeg_source` e `browser_source` sopra, `--startrecording`, diretta in
memoria con `BROADCAST_LIVE_DEV=1`. Nella registrazione l'overlay è trasparente sopra il video, c'è l'audio del file, il
punteggio cambiato dalla regia arriva in circa 1-2 secondi e lo sponsor si alterna. Non provati: il trascinamento del
file a mano, Ctrl+F, i tasti sotto l'anteprima e la diretta sul sito vero (migrazione da lanciare).

## Come gira

```
Regia /broadcast (accesso fatto, "In diretta dal sito" acceso)
  ├─ POST /api/broadcast/live/image {data}     immagine di uno sponsor caricata (una volta) → impronta sha256
  └─ POST /api/broadcast/live {state}          al massimo 1 al secondo; immagini come "om:<impronta>"
        └─ broadcast_live_save                 salva (8 KB, 400 ms fra due salvataggi), torna id, versione, canali
        └─ Extension PubSub (after)            {t:"bc", id, v, at, s} a ogni canale collegato (5 KB)
Overlay di OBS /broadcast/live?id=<id>         rilegge /api/broadcast/live/state?id= ogni 1,5 s (CDN 1 s)
  └─ /api/broadcast/live/image/<impronta>?id=  immagini degli sponsor (cache immutabile)
Estensione Twitch (twitch-broadcast/)
  ├─ GET /api/broadcast/ext/cards/<lingua>     carte ed etichette (statica)
  ├─ GET /api/broadcast/ext/state?channel=     stato all'apertura (CDN 2 s)
  ├─ Twitch.ext.listen("broadcast")            aggiornamenti, applicati con la latenza del video
  └─ POST /api/broadcast/ext/link {code} + JWT dalla configurazione: collega il canale alla regia
Regia: POST /api/broadcast/live/link → codice (10 minuti) · DELETE ?channel= → scollega · GET /api/broadcast/live → stato
```

- **Codice**: regole pure in `src/lib/broadcast/live.ts` (test `live.test.ts`, che carica anche
  `twitch-broadcast/common.js` in una sandbox e confronta controlli, messaggio e codice del gioco); server in
  `liveServer.ts` (configurazione dell'estensione, pulizia con `sanitizeState`, invio a PubSub, accesso al database),
  errori e forme in `liveTypes.ts`, memoria per le prove in `liveDev.ts`, tabella delle carte in `extCards.ts`; regia in
  `src/components/broadcast/BroadcastLiveBox.tsx` (motore dei salvataggi `LiveSync`), overlay in `BroadcastLive.tsx`
  (`?id=`); testi della regia in `labels.ts` (`live`, it/en).
- **Regole**: una diretta per account; l'id pubblico (12 caratteri) sta nell'indirizzo di OBS e non cambia; chi conosce
  l'id legge lo stato (è quello che va in onda); dopo 18 ore senza salvataggi lo stato non si legge più; "Spegni la
  diretta" lo cancella. La regia accesa riprende lo stato del sito dopo un ricaricamento e quello di un'altra regia dello
  stesso account entro 5 secondi (vince l'ultima modifica). Immagini: PNG, JPEG, WebP fino a 200.000 caratteri di data
  URL, 12 per account e 12 nuove l'ora, mai SVG. Canali: una regia fino a 10, un canale segue l'ultima regia che lo
  collega; il nome del canale lo chiede il sito a Twitch (`twitchLoginOf`), solo per mostrarlo nella regia.

## Database

Blocco `-- ===== 05/11/2026: BROADCASTING IN DIRETTA =====` in fondo a `supabase/schema.sql`: tabelle
`broadcast_lives`, `broadcast_images`, `broadcast_twitch_links`, `broadcast_link_codes` con RLS e nessuna lettura né
scrittura diretta; funzioni `broadcast_live_info`, `broadcast_live_save`, `broadcast_live_clear`, `broadcast_image_put`,
`broadcast_link_code`, `broadcast_unlink` (con l'accesso fatto), `broadcast_live_state`, `broadcast_channel_state`,
`broadcast_image_get` (anon), `broadcast_link_claim` (anon con il segreto del server). Tutto si cancella con l'account.

**Il sito regge senza migrazione**: le rotte rispondono `unavailable` e la regia dice "La diretta dal sito non è ancora
attiva" (regia e overlay nello stesso browser funzionano come prima). Provato su PGlite il 05/11/2026 (45 controlli).

**Migrazione da lanciare** (Pierluigi, dal worktree o da un checkout aggiornato, con `.env.local` copiato dal checkout
principale):

```powershell
node scripts/broadcast-live-dry-run.mjs
node scripts/db-migrate.mjs
```

La prova a secco fa tutto in una transazione e chiude sempre con il rollback; deve dire "TUTTO OK".

## Variabili d'ambiente

Vercel, Production, solo server: `TWITCH_BCAST_EXT_CLIENT_ID`, `TWITCH_BCAST_EXT_SECRET` (base64 della console),
facoltativa `TWITCH_BCAST_EXT_OWNER_ID` (senza: `TWITCH_EXT_OWNER_ID`). Già presenti: `CRON_SECRET` (collegamento),
`TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` (nome del canale). Prove in locale: `BROADCAST_LIVE_DEV=1` in
`.env.development.local` (solo `next dev`), istruzioni in `twitch-broadcast/README.md`.

## Da fare

1. Migrazione (sopra).
2. Estensione nella console di dev.twitch.tv, variabili su Vercel, zip e Hosted Test sul canale originsmeta
   (`twitch-broadcast/README.md`).
3. Revisione di Twitch solo a estensione provata con una partita vera.
4. La news `crimson-cup-qualifiers-where-to-watch` (19/10) dice ancora di usare la regia come pannello di OBS: da
   aggiornare con un paragrafo "Aggiornamento del …" se Pierluigi vuole.
