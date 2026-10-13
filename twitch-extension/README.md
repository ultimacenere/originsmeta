# OriginsMeta Deck tracker: estensione Twitch

Estensione "video overlay" (13/10/2026): gli spettatori aprono il mazzo dello streamer sopra il video e leggono le
carte dal vivo (richiesta degli streamer: "interagire con il deck per leggersi le carte live"). Mostra solo quello che
il Deck tracker di OriginsMeta Tracker mostra già in diretta: il mazzo con le copie rimaste, il turno, la Leggendaria
dell'avversario e le carte che ha rivelato. Mai nomi, rank o identificativi delle partite.

Il lato sito è in `src/lib/tracker/live.ts` (forma dello stato), `src/lib/twitchExt/` e `src/app/api/twitch/`
(carte, stato, collegamento).

## File del pacchetto

Solo questi file vanno nello zip, alla radice (niente cartelle):

| File | Cosa fa |
| --- | --- |
| `video_overlay.html` | pagina dello spettatore sopra il video (Video Viewer Path) |
| `mobile.html` | elenco a tutta larghezza per l'app di Twitch sul telefono (Mobile Path, facoltativa) |
| `config.html` | configurazione dello streamer: tre passi e il collegamento con il codice (Config Path e Live Config Path) |
| `common.js` | lingua e testi (en/it/es/fr), controlli sui dati della rete, costruzione del DOM senza HTML |
| `overlay.js` | linguetta, pannello del mazzo, anteprima della carta, dati (carte, stato, PubSub) |
| `config.js` | modulo del codice e chiamata a `/api/twitch/link` |
| `style.css` | grafica "ink & mint" del sito e del Deck tracker dell'app |
| `config.css` | grafica della pagina di configurazione |

`dev/` (prove in locale), `README.md` e `.gitignore` restano fuori dallo zip.

Regole di Twitch rispettate: l'helper `https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js` è il primo
script di ogni HTML; JS leggibile, niente bundler, niente `eval`, niente script remoti né iframe; font solo da Google
Fonts (Unbounded e Manrope, con ripiego sui font di sistema); immagini e chiamate solo verso `https://originsmeta.com`;
i dati della rete passano dai controlli di `common.js` (chiavi `/^C\d{5}_[A-Z]{2}$/`, tipi e limiti uguali a
`parseLiveState`) e il DOM si costruisce con `createElement`/`textContent`, mai `innerHTML`; fasce libere di 70 px in
alto e 90 px in basso per i controlli del player; niente sotto i 500 × 340 px; niente pubblicità né donazioni; l'unico
link esterno porta alla scheda della carta su originsmeta.com, in una nuova scheda, con "↗" e il testo "apre
originsmeta.com fuori da Twitch"; tasti veri con focus visibile, tastiera (Tab, Invio, Esc), `aria-label` e
`prefers-reduced-motion`. Le carte si mostrano intere con i crediti stampati, mai ritagliate né coperte; in fondo al
pannello c'è sempre "OriginsMeta · non affiliato a Koin Games" nella lingua dello spettatore.

### Fare lo zip

Da PowerShell, nella cartella `twitch-extension`:

```powershell
Compress-Archive -Force -DestinationPath ..\originsmeta-deck-tracker.zip -Path video_overlay.html, mobile.html, config.html, common.js, overlay.js, config.js, style.css, config.css
```

Lo zip deve avere i file alla radice (niente cartella `twitch-extension/` dentro). Si carica nella console in
Files → Upload Version Assets.

## Console di dev.twitch.tv

- **Tipo**: Video - Fullscreen (overlay). Facoltativo: Mobile.
- **Asset Hosting**: Video Viewer Path `video_overlay.html`; Config Path `config.html`; Live Config Path
  `config.html`; Mobile Path `mobile.html` (se si attiva il mobile).
- **Capabilities**: niente Bits, niente chat, niente identity link (l'estensione non chiede chi è lo spettatore).
- **Allowlist for Image Domains**: `https://originsmeta.com`.
- **Allowlist for URL Fetching Domains**: `https://originsmeta.com`.
- **Allowlist for Panel/Config URL** (link esterni, se la console lo chiede): `https://originsmeta.com`.
- **Configuration Service**: None (il collegamento del canale lo tiene il sito, non il servizio di Twitch). "Required
  Configurations" vuoto.
- **Testing Base URI** (Local Test): `https://localhost:8080/` (vedi sotto).
- Le chiavi da copiare su Vercel (Production, solo server, mai `NEXT_PUBLIC_`), da Settings dell'estensione:
  - `TWITCH_EXT_CLIENT_ID` = Client ID dell'estensione;
  - `TWITCH_EXT_SECRET` = Extension Secret (in base64, così come lo dà la console, sezione "Extension Secrets");
  - `TWITCH_EXT_OWNER_ID` = l'id utente Twitch del proprietario dell'estensione (firma i token "external" con cui il
    sito manda lo stato agli spettatori con l'Extension PubSub).
  Il collegamento usa anche `CRON_SECRET`, già presente. Senza queste variabili `/api/twitch/link` risponde
  `unavailable` e la pagina di configurazione lo dice.

## Come funziona

1. Lo streamer collega OriginsMeta Tracker al suo account, crea un codice su
   `https://originsmeta.com/<lingua>/account/tracker` (riquadro "Estensione Twitch", 10 minuti, una volta) e lo scrive
   nella pagina di configurazione dell'estensione: `config.js` lo manda a `POST /api/twitch/link` con il token di
   `Twitch.ext.onAuthorized` (il sito accetta solo il ruolo "broadcaster").
2. Durante la partita l'app manda al sito lo stato del Deck tracker; il sito lo salva e lo inoltra con l'Extension
   PubSub (target "broadcast", `{t: "state", at, s}`).
3. L'overlay scarica una volta le carte da `/api/twitch/cards/<lingua>` (nome, tipo, statistiche, testo, immagine),
   legge l'ultimo stato da `/api/twitch/state?channel=<id>` alla prima autorizzazione e poi ascolta PubSub. I messaggi
   più vecchi dell'ultimo (`at`) si ignorano; se in partita non arriva niente per 10 minuti lo stato si rilegge.
4. La linguetta compare solo quando c'è uno stato con un mazzo (canale collegato e app accesa). Fuori partita il
   pannello mostra solo il mazzo; in partita anche turno, carte rimaste e la sezione dell'avversario.

Lingua: il parametro `language` che Twitch passa all'iframe (en, it, es, fr; ripiego en). Le carte arrivano nella
stessa lingua; i nomi delle carte restano in inglese come nel sito.

## Prova in locale

Niente pacchetti da installare: in `dev/` c'è un piccolo server Node e un finto `window.Twitch`.

```bash
node twitch-extension/dev/make-cards.mjs     # crea dev/cards-en.json dai dati del repo (solo per il finto Twitch)
node twitch-extension/dev/serve.mjs          # http://localhost:8080
```

Pagine di prova (finto Twitch, PubSub simulato con la barra in basso a destra: pesca, gioca, turno, carte
dell'avversario, fine partita, messaggi vecchi o rotti, niente mazzo):

- `http://localhost:8080/dev/mock.html?language=it` (overlay; prova anche `en`, `es`, `fr`)
- `http://localhost:8080/dev/mock-mobile.html?language=it`
- `http://localhost:8080/dev/mock-config.html?language=it` (codici: `ABCD-EFGH` riesce, `NOPE-NOPE` = solo lo
  streamer, `DOWN-DOWN` = servizio non disponibile, il resto = codice sbagliato)

Le immagini delle carte arrivano davvero da originsmeta.com; le chiamate a `/api/twitch/*` le risponde il finto Twitch.

### Local Test della console (Twitch vero)

Il Local Test di Twitch carica i file da `https://localhost:8080/`, quindi serve HTTPS. Certificato self-signed, una
volta, con l'`openssl` di Git per Windows:

```bash
mkdir -p twitch-extension/dev/certs
# in Git Bash MSYS_NO_PATHCONV=1 evita che "/CN=localhost" diventi un percorso di Windows
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" \
  -keyout twitch-extension/dev/certs/localhost-key.pem -out twitch-extension/dev/certs/localhost.pem
node twitch-extension/dev/serve.mjs --https   # https://localhost:8080
```

Poi si apre una volta `https://localhost:8080/video_overlay.html` nel browser e si accetta il certificato, altrimenti
l'iframe di Twitch resta vuoto. Se HTTPS è un problema, si può caricare direttamente lo zip e usare **Hosted Test**
(consigliato per la prova vera).

Attenzione: nel Local Test l'origine delle pagine è `https://localhost:8080`, mentre `/api/twitch/link` accetta solo
`https://<client id>.ext-twitch.tv` (CORS). Il collegamento del canale quindi si prova in Hosted Test; carte e stato
rispondono a qualunque origine e funzionano anche in Local Test.

## Punti aperti

- Font di Google Fonts: Twitch li ammette, ma va verificato in Hosted Test che la CSP dell'estensione li carichi; se no
  restano i font di sistema (ripiego già nei CSS).
- "Allowlist for Panel/Config URL": nella console attuale si chiama così l'elenco dei link esterni; verificare il nome
  esatto al momento della revisione.
- Revisione di Twitch: va descritto che l'estensione mostra solo dati già in onda (Deck tracker), che il link esterno
  porta a originsmeta.com e che le immagini sono carte ufficiali di Koin Games usate con il loro permesso.
