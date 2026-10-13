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

## Da fare per andare online

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
