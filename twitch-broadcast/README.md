# Broadcasting OM: estensione Twitch

Estensione "video overlay" (05/11/2026, Pierluigi: "Estensione Twitch"): chi guarda una diretta con l'overlay di
Broadcasting OM in OBS apre i mazzi dei due giocatori sopra il video, legge le carte e copia il codice del gioco. È
un'estensione **nuova e separata** dal Deck tracker (`twitch-extension/`): Client ID, secret, rotte e tabelle suoi.

Il lato sito è in `src/lib/broadcast/live.ts` (forma dello stato, messaggio di PubSub), `liveServer.ts`,
`extCards.ts` e `src/app/api/broadcast/` (`live/`, `ext/`); architettura, database e migrazione in `docs/broadcasting.md`.

## File del pacchetto

Solo questi file vanno nello zip, alla radice (niente cartelle):

| File | Cosa fa |
| --- | --- |
| `video_overlay.html` | pagina di chi guarda, sopra il video (Video Viewer Path) |
| `config.html` | configurazione di chi ha il canale: tre passi e il collegamento con il codice della regia (Config Path e Live Config Path) |
| `common.js` | lingua e testi (en, it, es, fr, pt, de, ru, zh-cn), controlli sui dati della rete, DOM senza HTML, codice del gioco |
| `overlay.js` | linguetta, zone sulle targhette, pannello dei mazzi, anteprima della carta, dati (carte, stato, PubSub) |
| `config.js` | modulo del codice e chiamata a `/api/broadcast/ext/link` |
| `style.css` | grafica "ink & mint" del sito e dell'overlay di OBS |
| `config.css` | grafica della pagina di configurazione |

`dev/` (prove in locale), `README.md` e `.gitignore` restano fuori dallo zip.

Regole di Twitch rispettate (come il Deck tracker): l'helper `https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js`
è il primo script di ogni HTML; JS leggibile, niente bundler, niente `eval`, niente script remoti né iframe; font solo da
Google Fonts (con ripiego sui font di sistema); immagini e chiamate solo verso `https://originsmeta.com`; i dati della rete
passano dai controlli di `common.js` (`parseState` uguale a `parseExtState` di live.ts, lo controlla
`src/lib/broadcast/live.test.ts` caricando questo file) e il DOM si costruisce con `createElement`/`textContent`, mai
`innerHTML`; niente sotto i 500 × 340 px; il pannello fuori dalle fasce dei controlli del player (70 px in alto, 90 in
basso) e 75 px liberi a destra per la barra delle estensioni; niente pubblicità né donazioni; l'unico link esterno porta
alla scheda della carta su originsmeta.com, in una nuova scheda, con "↗" e il testo "apre originsmeta.com fuori da
Twitch"; tasti veri con focus visibile, tastiera (Tab, Invio, Esc), `aria-label` e `prefers-reduced-motion`. Le carte si
mostrano intere con i crediti stampati; in fondo al pannello c'è sempre "OriginsMeta · non affiliato a Koin Games" nella
lingua di chi guarda. Niente `color-scheme: dark` (lezione del Deck tracker: con uno schema diverso da quello del player
Chrome dipinge uno sfondo pieno e il video sparisce).

### Fare lo zip

Da PowerShell, nella cartella `twitch-broadcast`:

```powershell
Compress-Archive -Force -DestinationPath broadcasting-om-extension.zip -Path video_overlay.html, config.html, common.js, overlay.js, config.js, style.css, config.css
```

Lo zip deve avere i file alla radice (niente cartella `twitch-broadcast/` dentro) e resta fuori da git (`.gitignore`). Si
carica nella console in Files → Upload Version Assets.

## Console di dev.twitch.tv (account di Pierluigi)

- **Crea l'estensione**: nome "Broadcasting OM" (se è preso, "Broadcasting OM by OriginsMeta"), tipo **Video - Fullscreen**
  (overlay). Niente Mobile per ora.
- **Asset Hosting**: Video Viewer Path `video_overlay.html`; Config Path `config.html`; Live Config Path `config.html`.
- **Capabilities**: niente Bits, niente chat, niente identity link (l'estensione non chiede chi guarda).
- **Allowlist for Image Domains**: `https://originsmeta.com`.
- **Allowlist for URL Fetching Domains**: `https://originsmeta.com`.
- **Allowlist for Panel/Config URL** (link esterni, se la console lo chiede): `https://originsmeta.com`.
- **Configuration Service**: None (il collegamento del canale lo tiene il sito). "Required Configurations" vuoto.
- **Testing Base URI** (Local Test): `https://localhost:8081/` se si prova con il Twitch vero da locale (serve HTTPS: vedi
  il README del Deck tracker per il certificato); più semplice caricare lo zip e usare **Hosted Test**.
- **Variabili su Vercel** (Production, solo server, mai `NEXT_PUBLIC_`), da Settings dell'estensione:
  - `TWITCH_BCAST_EXT_CLIENT_ID` = Client ID dell'estensione;
  - `TWITCH_BCAST_EXT_SECRET` = Extension Secret (in base64, così come lo dà la console, "Extension Secrets");
  - `TWITCH_BCAST_EXT_OWNER_ID`, facoltativa: l'id utente Twitch del proprietario; senza vale `TWITCH_EXT_OWNER_ID`
    (lo stesso account del Deck tracker).
  Il collegamento usa anche `CRON_SECRET`, già presente. Senza queste variabili `/api/broadcast/ext/link` risponde
  `unavailable` e la regia dice "L'estensione Twitch di Broadcasting OM non è ancora attiva sul sito"; la diretta per
  OBS funziona lo stesso.
- **Revisione**: solo a estensione rifinita, dopo l'Hosted Test con una partita vera. Un'estensione **rifiutata perde il
  Client ID per sempre**. Servono: canale di prova in diretta con il gioco, descrizione, changelog, privacy policy e ToS,
  immagini (logo 100 × 100, discovery 300 × 200, screenshot 1024 × 768). Va detto che l'estensione mostra solo quello
  che la regia del torneo manda già in onda (giocatori, mazzi, copie giocate), che il link esterno porta a
  originsmeta.com e che le immagini sono carte ufficiali di Koin Games usate con il loro permesso.

## Come funziona

1. La regia (`originsmeta.com/broadcast`, con l'accesso fatto) accende "In diretta dal sito": ogni modifica va a
   `POST /api/broadcast/live` (al massimo una al secondo), che salva lo stato e, dopo la risposta, lo manda con
   l'Extension PubSub (target "broadcast", `{t: "bc", id, v, at, s}`, 5 KB al massimo; se non ci sta `{…, r: 1}` e
   l'estensione rilegge) a ogni canale collegato.
2. Chi ha il canale installa l'estensione, la attiva come overlay e scrive nella configurazione il codice che la regia
   crea con "Collega un canale Twitch" (10 minuti, una volta, 5 l'ora): `config.js` lo manda a
   `POST /api/broadcast/ext/link` con il token di `Twitch.ext.onAuthorized` (il sito accetta solo il ruolo
   "broadcaster"). Una regia fino a 10 canali; un canale segue l'ultima regia che lo collega.
3. L'overlay scarica una volta le carte da `/api/broadcast/ext/cards/<lingua>` (nome, costo, tipo, statistiche,
   allineamento, testo, carta intera, illustrazione, chiave ufficiale; più le etichette dei dizionari del sito), legge lo
   stato da `/api/broadcast/ext/state?channel=<id>` alla prima autorizzazione e poi ascolta PubSub. Gli aggiornamenti si
   applicano dopo la latenza del video (`hlsLatencyBroadcaster` di `onContext`, al massimo 15 s), così una copia sparisce
   quando la si vede giocare; i messaggi più vecchi della stessa diretta si ignorano; ogni 5 minuti senza notizie lo stato
   si rilegge.
4. Linguetta "Mazzi" sul bordo sinistro del video e zone invisibili sopra le due targhette dell'overlay di OBS (stesse
   misure di `broadcast.css`, su un palco di 1920 × 1080 scalato al video 16:9): un clic apre il pannello con i due
   giocatori, Mazzo 1-4 (pallino su quello in campo), lista con le copie rimaste, anteprima della carta (passandoci sopra,
   con il fuoco o con un tocco, che la fissa) e "Copia mazzo" (codice del gioco calcolato qui come `encodeGameCode`; se
   gli appunti sono bloccati il codice compare in un campo da copiare a mano). Niente stato con dei mazzi: niente in vista.

Lingua: il parametro `language` che Twitch passa all'iframe (en, it, es, fr, pt, de, ru; zh-* in cinese semplificato;
ripiego en). Le carte arrivano nella stessa lingua; i nomi delle carte restano in inglese come nel sito.

## Prova in locale

Niente pacchetti da installare. Il sito in sviluppo con la diretta in memoria (niente database):

1. In `.env.development.local` (mai nel repo): `BROADCAST_LIVE_DEV=1`; per provare anche il collegamento,
   `CRON_SECRET=` qualunque, `TWITCH_BCAST_EXT_CLIENT_ID=devclient`, `TWITCH_BCAST_EXT_SECRET=` un base64 qualunque,
   `TWITCH_BCAST_EXT_OWNER_ID=1`.
2. `npm run dev -- -p 3010` (o la configurazione `broadcast-dev` di `.claude/launch.json`), poi la regia su
   `http://localhost:3010/broadcast?lang=it`: "Accendi la diretta" (l'utente finto "dev" non chiede l'accesso).
3. `node twitch-broadcast/dev/serve.mjs --site http://localhost:3010` (o `broadcast-ext-mock`): serve questa cartella su
   `http://localhost:8081` e inoltra al sito tutto il resto.

Pagine di prova (finto Twitch: PubSub simulato rileggendo lo stato ogni secondo e mezzo):

- `http://localhost:8081/dev/mock.html?language=it` (anche `&latency=5` per il ritardo del video): come "video" l'overlay
  di OBS della diretta di prova sopra una schermata della partita, sopra l'estensione; le fasce rosa sono quelle dei
  controlli di Twitch.
- `http://localhost:8081/dev/mock-config.html?language=it&channel=987654321&secret=<lo stesso base64 di
  TWITCH_BCAST_EXT_SECRET>`: il token è un JWT vero firmato con quel secret, quindi il codice creato dalla regia collega
  davvero il canale (poi "Aggiorna" nella regia lo mostra).

## Punti aperti

- Font di Google Fonts: da verificare in Hosted Test che la CSP dell'estensione li carichi (ripiego già nei CSS).
- Mobile: per ora solo la vista video su desktop.
- Le zone sulle targhette stanno in alto nel video, dove in alcune modalità del player (popout, embed) Twitch mette le
  sue informazioni: la linguetta a sinistra resta sempre raggiungibile.
