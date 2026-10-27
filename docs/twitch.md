# Estensione Twitch "OriginsMeta Deck tracker"

Richiesta degli streamer riportata da Pierluigi il 13/10/2026: "l'integrazione con Twitch che permetta agli utenti di
interagire con il deck per leggersi le carte live". Scelta di Pierluigi lo stesso giorno: prima il mazzo interattivo; il
minigioco dei pacchetti (carte da "spacchettare" per i minuti guardati) aspetta la risposta di Kevin di Koin, perché
userebbe le carte di Origins come gioco e non come contenuto.

## Cosa fa

Un'estensione Twitch "video overlay": chi guarda la diretta apre il mazzo dello streamer sopra il video e passa il mouse
sulle carte per leggerle (immagine, statistiche, testo nella sua lingua). Durante la partita il mazzo si aggiorna dal
vivo: copie pescate e giocate, round, carte rimaste; e dell'avversario la Leggendaria e le carte rivelate, magie
comprese (dalla 0.4.2 dell'app). Fuori partita resta il mazzo scelto.

Mostra solo quello che lo streamer mostra già in diretta con il Deck tracker: mai nomi, rank o identificativi di
giocatori o partite, mai se l'avversario è un bot (regole del tracker, docs/tracker.md). Nell'estensione niente
pubblicità né "Dona ora" (linee guida di Twitch 4.4), sempre la dicitura "non affiliato a Koin Games".

## Come funziona

```
OriginsMeta Tracker (PC dello streamer)
  └─ POST /api/tracker/live {state}          ogni cambio, al massimo ogni 2 s, col token dell'app
        └─ tracker_live_push (blocco TWITCH)  salva l'ultimo stato solo se l'account ha un canale collegato
        └─ Extension PubSub di Helix          "broadcast" a tutti gli spettatori del canale (dopo la risposta)
Estensione (iframe su <client id>.ext-twitch.tv)
  ├─ GET /api/twitch/cards/<lingua>           carte: nome, tipo, statistiche, testo, immagine (statica)
  ├─ GET /api/twitch/state?channel=<id>       ultimo stato all'apertura (CDN 2 s, niente JWT)
  └─ Twitch.ext.listen("broadcast")           aggiornamenti dal vivo
Pagina di configurazione dell'estensione (streamer)
  └─ POST /api/twitch/link {code} + JWT       JWT di Twitch con ruolo broadcaster → canale collegato all'account
```

- **Stato dal vivo**: `src/lib/tracker/live.ts` (`liveStateOf` nell'app, `parseLiveState` sul sito, `pubsubMessage`
  sotto i 5 KB di Twitch), test in `src/lib/twitchExt/twitchExt.test.ts`. Nell'app `tracker/src/main/twitchLive.ts`
  (`LivePusher`: manda solo se lo stato cambia, ogni 2 s al massimo; con `linked: false` aspetta 5 minuti; senza
  account collegato non parte niente), test in `twitchLive.test.ts`.
- **JWT**: `src/lib/twitchExt/jwt.ts` (HS256 con il secret dell'estensione, niente librerie). Il sito verifica quello
  della pagina di configurazione (ruolo broadcaster, `channel_id`) e firma i token "external" per PubSub
  (`src/lib/twitchExt/server.ts`, 2 minuti).
- **Collegamento del canale**: lo streamer crea un codice su `/account/tracker`, riquadro "Estensione Twitch" (10
  minuti, una volta, 5 l'ora, come il codice dell'app), e lo scrive nella pagina di configurazione dell'estensione;
  `/api/twitch/link` verifica il JWT e chiama `twitch_link_claim` con il segreto del server (`CRON_SECRET`): senza il
  segreto nessuno può legare un canale che non ha dimostrato di avere a Twitch. Un canale sta con un solo account e un
  account con un solo canale; si scollega da `/account/tracker`.
- **Database** (blocco `-- ===== 13/10/2026: TWITCH =====` in fondo a `supabase/schema.sql`): `twitch_links`
  (proprietario, id del canale; il proprietario legge solo `channel_id` e `linked_at`), `twitch_link_codes` (impronte),
  `tracker_live` (ultimo stato, 4 KB al massimo, solo per chi ha un canale). Funzioni `twitch_link_code`,
  `twitch_link_claim` (segreto), `twitch_unlink`, `tracker_live_push` (token dell'app, al massimo due invii al
  secondo), `twitch_live_state` (anon, stato degli ultimi 6 ore). Nessuna lettura né scrittura diretta. Il sito regge
  senza migrazione: il riquadro di `/account/tracker` non compare, le rotte rispondono "unavailable" o stato vuoto.
- **Informativa**: `#tracker` (testo in `trackerPrivacy` di `src/lib/trackerLabels.ts`, quattro lingue).

## Modalità "come l'app" (14/10/2026)

Pierluigi, dopo la prima prova in diretta del 13/10: "non possiamo renderlo identico come visuale alla versione del
tracker scelto dall'utente?", poi "sì procedi, con la scelta nella configurazione".

- **Scelta dello streamer**: nella pagina di configurazione dell'estensione, "Come l'app" o "Linguetta", salvata nel
  Configuration Service di Twitch (segmento "broadcaster", versione 1, `{"view": "app" | "tab"}`; nella console:
  Funzionalità → "Servizio di configurazione dell'estensione"). Con "come l'app" lo streamer toglie i pannelli dell'app
  dalla scena di OBS, per non mostrarli due volte.
- **Dati**: dall'app 0.4.3 lo stato dal vivo porta anche `ui` (template, opzioni del personalizzato, pannelli nascosti
  fuori partita, scanner, misure dello schermo principale e posizione delle due finestre dei pannelli in punti di
  Windows) e in `live` vita, mana dei due e verso del combattimento (`liveStateOf`, `parseLiveState` di
  src/lib/tracker/live.ts; facoltativi, una forma sbagliata si lascia fuori; test in twitchExt.test.ts).
- **Disegno**: lo stesso codice dei pannelli dell'app. Il disegno è passato da `tracker/src/overlay/deck.ts` a
  `deckRender.ts` (deck.ts lo usa per la finestra e per OBS); `twitchPanels.ts` lo espone come `window.OMPanels` e
  `npm run twitch-panels` (cartella tracker/) lo compila, non minificato, in `twitch-extension/panels.js`, con
  `panels.css` (deck.css, variabili limitate a `.om-app`), i font e il logo. L'estensione mette i pannelli negli
  stessi punti in proporzione allo schermo dello streamer (il video sta nel player con le bande se ha un'altra forma),
  attaccati al bordo più vicino, rimpiccioliti se non ci stanno fra le fasce dei controlli del player (70 px in alto,
  90 in basso); il tasto "Nascondi i pannelli" li toglie per chi guarda; passando su una carta l'anteprima compare
  dall'altra parte del video. Senza `ui` (app 0.4.2) e sul telefono resta la linguetta.
- **Prova**: `twitch-extension/dev/mock.html?mode=app` con i tasti dei quattro stili e "Fuori partita".
- **Come l'estensione di Hearthstone** (14/10/2026, Pierluigi dopo aver visto la diretta di Lugozzi: "sì procedi con
  entrambe"): (1) i pannelli si trascinano dalla linguetta del logo, la posizione scelta da chi guarda resta nel suo
  browser per quel canale (doppio clic sulla linguetta: di nuovo al posto dello streamer); (2) sopra le carte in gioco
  nel video ci sono zone invisibili: chi guarda ci passa sopra e legge la carta. Le carte arrivano dallo scanner
  (`live.board`, 18 spazi, dall'app 0.4.5), le posizioni dalle stesse misure con cui lo scanner legge il tabellone
  (`boardRects` di twitchPanels.ts: `layoutFor` e `BOARD_SLOTS` di recognize.ts); valgono con il gioco a schermo
  intero nella ripresa. Provate su un fotogramma vero di una partita: le zone cadono sugli spazi.
- **Duplicati**: con l'opzione dell'app "Nascondi i pannelli dalla diretta" (0.4.4) OBS non riprende i pannelli.
- **Senza pannelli sul PC** (Pierluigi: "non si può scegliere di avere quelli di Twitch senza che noi a schermo abbiamo
  effettivamente i due tracker visibili?"): dalla 0.4.5 un pannello chiuso nell'app va comunque su Twitch, nella
  posizione salvata per lo stile in uso o in quella di partenza (`liveUi` di main.ts).
- **Carte in mano** (domanda di Davdas: "perché non anche le carte in mano?"; app 0.4.6): lo scanner manda anche le carte
  in mano con il bordo sinistro di ognuna (`readHandAt` di recognize.ts, `live.hand`), l'estensione ci mette le zone
  con la stessa geometria (`handRects`). Provate su un fotogramma vero.
- **Anteprima sempre a destra** (Pierluigi: "il puntatore del mouse è uno per persona, non ha senso sta divisione").

## Da fare per andare online

**Fatto**: versione 0.1.0 inviata in revisione il 14/10/2026, approvata da Twitch e pubblicata ("Rilasciata") il
27/10/2026; lo stesso giorno la news `upgrade-meta-1027`. Finché una versione è in revisione l'elenco degli account di
prova (scheda Accesso) non si salva: bisognerebbe riportarla in test locale, e la revisione ripartirebbe da capo.

1. **Migrazione**: prova a secco `node scripts/twitch-dry-run.mjs` (serve `CRON_SECRET` in `.env.local`), poi
   `node scripts/db-migrate.mjs` da un checkout aggiornato (README, "Migrazione del database"). Provato su PGlite il
   13/10/2026 (24 controlli).
2. **Estensione sulla console di dev.twitch.tv** (account di Pierluigi): crea l'estensione, tipo Video - Fullscreen
   (overlay), percorsi e allowlist come in `twitch-extension/README.md`; carica lo zip della cartella
   `twitch-extension/` (solo i file del pacchetto). Prova in Local Test e Hosted Test sul canale di Pierluigi, poi la
   revisione di Twitch. Attenzione: un'estensione **rifiutata** perde il Client ID per sempre, quindi in revisione solo
   quando è rifinita (servono canale di prova in diretta col gioco, guida, changelog, privacy policy e ToS, immagini:
   logo 100 × 100, discovery 300 × 200, screenshot 1024 × 768).
3. **Variabili su Vercel** (Production, solo server, mai `NEXT_PUBLIC_`): `TWITCH_EXT_CLIENT_ID`, `TWITCH_EXT_SECRET`
   (l'Extension Secret in base64, come lo dà la console), `TWITCH_EXT_OWNER_ID` (l'id utente Twitch del proprietario
   dell'estensione). `CRON_SECRET` c'è già.
4. **App 0.4.2** con l'invio dello stato dal vivo: release su GitHub (docs/tracker.md).
5. **Koin**: le immagini delle carte nell'estensione sono contenuto, coperte dal permesso di Kevin del 19/09/2026
   (decisione di Pierluigi del 13/10/2026: niente domanda a parte). A Kevin va chiesto solo del minigioco dei pacchetti.

## Punti aperti

- Twitch dà due limiti diversi per PubSub (1 messaggio al secondo per canale nella guida, 100 al minuto nell'API
  reference): l'app ne manda al massimo uno ogni 2 secondi, il database ne accetta due al secondo.
- Mobile: per ora solo la vista video su desktop; la vista mobile è da fare.
- Minigioco dei pacchetti: le linee guida ammettono collezionabili senza valore e senza acquisto (5.2, 5.3), niente
  NFT né loot box a pagamento; i punti per i minuti guardati non sono regolati esplicitamente e il tempo misurato nel
  browser si può falsificare; una collezione che resta richiede l'Identity Link dello spettatore.
