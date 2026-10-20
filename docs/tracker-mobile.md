# Tracker sul telefono (progetto)

Come registrare le partite di Origins TCG quando il gioco esce su mobile. **Solo progetto, nessun codice**:
Pierluigi, 20/10/2026, alla domanda "per il tracker sul telefono, da dove partiamo?" ha scelto "Solo progetto per
ora". Lo stesso giorno è nata l'app Android di OriginsMeta (`mobile/README.md`), che è il contenitore dove il
tracker andrà. Il tracker per Windows è in `docs/tracker.md`: regole, lettore e riconoscitore valgono anche qui
dove non è scritto il contrario.

## Quando esce il gioco su mobile

- **Pierluigi (20/10/2026)**: entro il 2026, da quello che sa lui. Non c'è un annuncio pubblico.
- **Fonti ufficiali lette il 20/10/2026**:
  - la FAQ del sito di Koin (preview.origins-tcg.com) dice "We have our sights set on 2027 for Origins on Mobile";
  - la FAQ su Steam di apix [developer], modificata il 16/10/2026, dice "Mobile will come once that's solid", cioè
    dopo Steam;
  - nelle 60 news Steam dell'app 4429430 non ci sono mobile, iOS né Android.
- **Cosa esiste già**: "Origins TCG" di Koin Games Inc. sull'App Store malese (id6754609014): versione 0.1.1 del
  05/12/2025, 279,7 MB, iOS 15+. È la prova di "Project O", annunciato con Immutable il 19/08/2025 come TCG per il
  telefono. Su Google Play non è stata trovata nessuna scheda.
- **Non si sa**: se l'account è lo stesso di Steam, se partite e progressi passano fra PC e telefono, se il gioco su
  telefono è in verticale o in orizzontale.

## Cosa non si porta dal PC

- **I file del gioco.** Il tracker per Windows legge la cache di Beamable. Su Android quei file starebbero in
  `Android/data/<pacchetto>/files` (cartella standard di Unity), che da Android 11 nessun'altra app può leggere,
  nemmeno con il selettore delle cartelle. Su iPhone ogni app è chiusa nella sua. Strada esclusa.
- **Il pannello sopra il gioco su iPhone.** iOS non lascia disegnare sopra un'altra app. Le alternative sono una
  Live Activity (Dynamic Island e schermata di blocco: pochi dati, aggiornati dall'app in secondo piano o con le push)
  o il Picture in Picture, che App Review non accetta per forza con contenuti che non sono video.
- **La ripresa dello schermo "di nascosto".** Su tutti e due i telefoni la ripresa la avvia il giocatore e il
  sistema la mostra sempre (notifica, pastiglia rossa).

Il **riconoscitore** invece si porta: `tracker/src/shared/recognize.ts` e `reconstruct.ts` lavorano su un'immagine
qualsiasi (`Img`: pixel RGBA, larghezza, altezza) con i riferimenti delle carte presi dalle immagini del sito. Vanno
rifatte solo le posizioni (tabellone, mana, schermata VS, stendardo), tarate oggi sulla versione per PC 16:9.

## Come fanno gli altri (ricerca del 20/10/2026)

| Gioco e strumento | Metodo | iPhone | Android | Pannello sopra il gioco |
|---|---|---|---|---|
| Marvel Snap, Untapped.gg | "Mobile Sync": collegamento all'account del gioco una volta sola, poi partite e collezione dai server del gioco | sì | sì | solo Android (app con i permessi di overlay; "doesn't interact with the game client") |
| Pokémon TCG Pocket, Pocket Tracker | a mano: mazzo, archetipo dell'avversario, esito | sì | sì | no |
| Hearthstone (HearthSim) | nessun tracker su telefono; Arcane Tracker per Android leggeva i log, tolto da Play nel 2020 e reso impossibile da Android 11 | no | no | no |
| Legends of Runeterra | API ufficiale di Riot con lo storico delle partite sui loro server, senza informazioni nascoste sull'avversario | — | — | — |
| MTG Arena, GWENT | nessun tracker su telefono | no | no | no |

L'unico tracker automatico che funziona su tutti e due i telefoni è quello di Untapped, e passa dall'account del
gioco, non dallo schermo.

## Vincoli dei sistemi e degli store (2026)

**Android.**

- **Ripresa con MediaProjection.**
  - Consenso del giocatore a ogni sessione (da Android 14 un consenso vale per una ripresa sola).
  - Servizio in primo piano di tipo `mediaProjection` con notifica fissa, da dichiarare anche in Play Console.
  - Ripresa della sola app del gioco, di default da Android 14 QPR2.
  - Si ferma quando lo schermo si blocca, e da Android 15 QPR1 dalla pastiglia nella barra di stato.
- **Il gioco può accorgersene.** Da Android 15 un'app sa di essere ripresa (`addScreenRecordingCallback`). Se Koin
  protegge lo schermo (`FLAG_SECURE`) la ripresa è nera, e aggirarla è vietato dalle regole di Play.
- **Pannello sopra il gioco.** Permesso `SYSTEM_ALERT_WINDOW`. Da Android 12 un pannello di un'altra app con
  opacità oltre 0,8 blocca i tocchi che lo attraversano.
- **Regole di Play.**
  - API di accessibilità: non adatte a questo uso, e vietate le azioni automatiche.
  - Proprietà intellettuale: serve il permesso scritto per nome e illustrazioni del gioco.

**iPhone.**

- **Fino a iOS 26**: ReplayKit con una Broadcast Upload Extension. La trasmissione la avvia il giocatore dal Centro di
  controllo o da un tasto nell'app. Gli sviluppatori riportano un limite di circa 50 MB di memoria, e il
  riconoscimento dovrebbe starci dentro.
- **Da iOS 27 (uscito il 14/09/2026)**: ScreenCaptureKit anche su iPhone (`SCContentSharingPicker`), con il
  background mode `screen-capture`. Che funzioni davvero in secondo piano mentre si gioca non è confermato.
- **App Review.**
  - 2.5.14: consenso e indicatore visibile.
  - 5.2: permesso per materiale di terzi.
  - 4.2: l'app non può essere solo il sito.
  - Se Apple accetti l'analisi automatica dello schermo di un altro gioco è una domanda aperta: nessuna app così
    trovata sull'App Store (Poke Genie analizza screenshot e registrazioni di Pokémon GO, non in diretta).
- **Strumenti**: per l'iPhone servono un Mac con Xcode e l'Apple Developer Program (99 $ l'anno).

## Le strade

| Strada | iPhone | Android | Automatica | Rischi | Lavoro |
|---|---|---|---|---|---|
| A. Collegamento ufficiale con Koin (storico partite dell'account, come Untapped o l'API di Riot) | sì | sì | sì | bassi, con l'accordo scritto | medio, dipende da Koin |
| B. Ripresa della sola app del gioco + riconoscitore sul telefono + pannello | no | sì | sì, consenso a ogni sessione | schermo protetto, il gioco vede la ripresa, regole di Play | alto |
| C. Trasmissione (iOS ≤ 26) o ScreenCaptureKit (iOS 27+) + riconoscitore | sì | no | sì, avvio a mano | App Review, memoria, non provata | alto |
| D. A mano, più riconoscimento di uno screenshot sul telefono | sì | sì | no | bassi | basso |
| Lettura dei file del gioco | no | no | — | — | esclusa |

## Proposta

1. **Prima Koin (strada A).** Nello stesso messaggio del permesso scritto già in programma (KB §1), quattro domande:
   - si può avere lo storico delle partite di un account, con il consenso del giocatore? Collegamento dell'account
     o API, come Riot per Legends of Runeterra. La regola 1 di `docs/tracker.md` vieta di usare i token della cache
     per chiamare i server di Koin: questa strada esiste solo con il loro sì scritto;
   - il gioco su telefono proteggerà lo schermo (`FLAG_SECURE`)? È d'accordo che un'app nostra lo riprenda per
     riconoscere le carte?
   - una build di prova per tarare il riconoscitore prima dell'uscita: orientamento e schermate (VS, tabellone,
     stendardo di fine partita);
   - l'account sarà lo stesso di Steam? Le partite giocate sul telefono le vedrebbe anche il tracker per Windows?
2. **Android automatico (strada B), appena c'è una build del gioco per Android.** Un modulo nativo dentro l'app
   (plugin Capacitor in Kotlin, `OriginsTracker`):
   - **Ripresa**: MediaProjection della sola app del gioco, servizio in primo piano con notifica, fotogrammi ridotti
     (lato lungo ~1280 px) solo quando lo schermo cambia, un paio al secondo come sul PC. Nessun fotogramma lascia
     il telefono, nessun file salvato fuori dalla modalità di taratura per lo staff.
   - **Riconoscitore**: le funzioni pure di `recognize.ts` e `reconstruct.ts` portate in Kotlin, con le stesse soglie
     e gli stessi riferimenti (`card-art.json`). Test "dorati": gli stessi fotogrammi danno le stesse letture in
     TypeScript e in Kotlin. Farlo girare in JavaScript dentro una WebView nascosta non regge con l'app in secondo
     piano.
   - **Posizioni**: tarate sui fotogrammi del gioco su telefono, con una modalità cattura per lo staff come
     `npm run frames`. Telefoni con proporzioni diverse vanno provati uno per uno (tagli dello schermo, barre).
   - **Mazzo del giocatore**: sul PC arriva dall'inventario, che sul telefono non si legge. Il giocatore sceglie il
     mazzo attivo nell'app (uno dei suoi mazzi del sito o il codice del gioco incollato); la Leggendaria della
     schermata VS lo conferma.
   - **Esito**: dallo stendardo di fine partita, come la 0.3.1 per Windows.
   - **Pannello**: una bolla piccola sopra il gioco che si apre nel Deck tracker (carte rimaste, carte viste
     dell'avversario). Opacità entro 0,8, mai sopra i comandi del gioco, si sposta e si chiude.
   - **Bot**: stessa regola del PC (le partite contro i bot non si registrano, mai dire bot o persona). Il nome della
     schermata VS si legge sul telefono solo per riconoscere i bot e non si salva (testo con ML Kit sul dispositivo,
     o il segnale che il gioco su telefono darà).
   - **Invio**: lo stesso collegamento del PC (codice di `/account/tracker` → token, `/api/tracker/link`) e la stessa
     partita (`TrackedMatch`, `/api/tracker/sync`), quindi gli stessi win rate. Se servirà sapere la piattaforma,
     campo nuovo in `upload.ts` e in `tracker_match_ok` con una migrazione, mai mostrato partita per partita.
   - **Prima di pubblicarlo**: informativa `#tracker` aggiornata in cinque lingue, dichiarazioni di Play (servizio
     in primo piano, overlay), test chiuso.
3. **iPhone (strada C), solo se Koin esce anche su iOS e dopo la prova su Android**: Mac, account Apple, estensione
   di trasmissione o ScreenCaptureKit con il riconoscitore in Swift, Live Activity al posto del pannello.
4. **Riserva per tutti (strada D)**: "Registra partita" a mano nell'app (mazzo, Leggendaria avversaria, esito) e il
   riconoscimento di uno screenshot della schermata finale fatto sul telefono, nello storico personale e fuori dai
   win rate, perché non sono partite lette dal gioco.

## Fasi e cosa serve

| Fase | Cosa | Chi | Quando |
|---|---|---|---|
| M0 | App Android 0.1.0: il sito nell'app, avvio, Indietro, App Links, pagina offline | Claude | fatta il 20/10/2026 |
| M1 | Messaggio a Kevin con le quattro domande | Pierluigi | con il permesso scritto, entro la call del 26/10 |
| M2 | Giornata di verifica sulla prima build del gioco per Android (anche beta o soft launch): schermo protetto, orientamento, schermate, account, cosa salva il gioco | Pierluigi + Claude | appena c'è la build |
| M3 | Modulo `OriginsTracker` per Android: ripresa, riconoscitore in Kotlin con i test dorati, mazzo attivo, esito, invio | Claude | dopo M2, se lo schermo non è protetto |
| M4 | Bolla con il Deck tracker, informativa, test chiuso su Play | Claude + tester | dopo M3 |
| M5 | iPhone | da decidere | dopo M4, se il gioco esce su iOS |

Da Pierluigi:

- il messaggio a Koin (M1);
- un telefono Android per le prove (il suo, 20/10/2026);
- l'account Google Play (25 $);
- la build del gioco per Android appena esiste.

## Fonti (lette il 20/10/2026)

- Koin: preview.origins-tcg.com (FAQ, senza data); steamcommunity.com/app/4429430/discussions/0/837249693974091820/
  (FAQ, modificata il 16/10/2026); news Steam dell'app 4429430 (ISteamNews); apps.apple.com/my/app/origins-tcg/id6754609014;
  blockchaingamer.biz/?p=40049 (Project O, 19/08/2025).
- Altri tracker: help.hearthsim.net (Marvel Snap Mobile Sync 22/11/2024, app Android 03/11/2025, niente tracker per
  iPhone e per MTG Arena su telefono); snap.untapped.gg/en/android-tracker; pocket-tracker.com;
  articles.hsreplay.net/2020/07/22/update-on-arcane-tracker/; riotgames.com/en/DevRel/legends-of-runeterra-match-history.
- Android: developer.android.com (media-projection, tipi di servizio in primo piano aggiornati al 16/10/2026, novità
  e cambi di Android 12, 15 e 11 sullo storage); regole di Play 9888379, 10964491, 9888072.
- iOS: developer.apple.com (SCContentSharingPicker, background modes, Live Activities, linee guida di App Review);
  forum Apple 840821, 818940, 846114; 9to5mac.com (uscita di iOS 27, 09/09/2026); Poke Genie sull'App Store.
- Framework: capacitorjs.com/docs/config; expo.dev/changelog/sdk-58.
