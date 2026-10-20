# App Android di OriginsMeta

App nativa per Android, nata il 20/10/2026. Pierluigi ha scelto "App nativa Android" fra tre strade: app
installabile dal sito, app nativa Android, tutte e due. Secondo lui il gioco esce su mobile entro il 2026; le fonti
ufficiali dicono 2027 (`docs/tracker-mobile.md`). Pacchetto a sé, come `tracker/`: package.json, dipendenze e test
propri, niente dentro il sito. Il tracker per il telefono è solo progettato: `docs/tracker-mobile.md`.

## Come funziona

- **Il sito dentro l'app.** L'app è Capacitor 8 e carica `https://originsmeta.com` nella sua WebView (`server.url`
  di `capacitor.config.json`). Le pagine non si impacchettano nell'app perché il sito non è statico: ISR, pagine
  renderizzate sul server, account e Server Action. Ogni modifica al sito arriva nell'app senza aggiornarla.
  - Capacitor scrive che `server.url` "is not intended for use in production". Per Google Play va bene: è il nostro
    sito, come una TWA.
  - Per l'App Store (regola 4.2, niente siti reimpacchettati) servirà una funzione nativa vera: il tracker.
- **Navigazione.**
  - Restano nell'app solo originsmeta.com, Supabase (accesso) e Discord (accesso con Discord): `allowNavigation`.
    Il test `config.test.mjs` controlla che l'indirizzo di Supabase sia quello di `src/lib/supabase/env.ts`.
  - Steam, PayPal, Twitch, YouTube e ogni altro sito si aprono nel browser del telefono.
  - L'accesso con il codice dell'email resta tutto nell'app. Il link dell'email invece si apre nel browser, cioè in
    un'altra sessione: nell'app conviene il codice.
- **Parti native (`MainActivity.java`).**
  - Tasto Indietro: torna alla pagina prima; sulla prima pagina manda l'app in secondo piano.
  - App Links: le pagine di originsmeta.com aperte da fuori si aprono nell'app (`SiteLinks.java`, provato in
    `SiteLinksTest.java`). Restano fuori `/api`, `/auth`, `/overlay` e `/broadcast`.
- **Pagina offline.** `www/offline.html`, nelle cinque lingue del sito con la dicitura su Koin Games, senza file
  esterni (`server.errorPath`). Riprova al tocco e da sola quando torna la rete. Su Android lì i plugin non ci sono.
- **Riconoscere l'app dal sito.** Lo user agent finisce con `OriginsMetaApp/<versione>` (`appendUserAgent`): serve al
  sito e alle statistiche.
- **Aspetto.**
  - Icona: la carta del logo del sito (`src/app/icon.svg`) su verde, adattiva da Android 8. Rigenerata da
    `npm run icons` con Chrome headless, senza dipendenze; mai materiale Koin.
  - Avvio: la carta su un cerchio verde, sul fondo `felt` del sito.
  - Barre di sistema con testo chiaro; aree sicure al sito con `env(safe-area-inset-*)` (`SystemBars`,
    `insetsHandling: "css"`).
- **Sicurezza.**
  - `allowBackup="false"`: il backup di Android non copia cookie e sessione.
  - Niente traffico in chiaro, niente contenuti misti.
  - Debug della WebView solo nella build di debug (default di Capacitor).

## File

| File | Cosa |
|---|---|
| `capacitor.config.json` | nome, id `com.originsmeta.app` (definitivo una volta su Play), indirizzo, navigazione, avvio |
| `www/` | `offline.html` e un `index.html` che serve solo a Capacitor |
| `android/` | progetto nativo (generato da `cap add android` il 20/10/2026, poi modificato a mano: si tiene in git) |
| `android/app/src/main/java/com/originsmeta/app/` | `MainActivity` (Indietro, App Links), `SiteLinks` |
| `android/app/src/main/res/values/styles.xml` | colori e avvio |
| `scripts/icons.mjs` | icone dal logo, più `store/play-icon-512.png` per la scheda di Play |
| `scripts/apk.mjs` | `cap sync`, test Java e APK di prova in `out/` |
| `scripts/config.test.mjs` | controlli su configurazione, pagina offline, icone, colori, backup |

La versione è una sola, quella di `package.json`: Gradle ne ricava `versionName` e `versionCode`
(major·10000 + minor·100 + patch), il test la confronta con lo user agent. A ogni rilascio si alza in tutti e due i
posti: `package.json` e `appendUserAgent`.

## Comandi (dalla cartella `mobile/`)

```bash
npm ci            # dipendenze (Capacitor 8.5.3, versioni esatte)
npm test          # controlli della configurazione
npm run icons     # icone, dopo una modifica di src/app/icon.svg
npm run apk       # APK di prova firmato con la chiave di debug: out/OriginsMeta-<versione>-debug.apk
```

Servono Java 21 e l'Android SDK con la piattaforma 36. Il 20/10/2026, con il via di Pierluigi e senza permessi di
amministratore, sono stati installati:

- **Java**: OpenJDK 21 di Microsoft in `%LOCALAPPDATA%\Programs\jdk-21`.
- **Android SDK**: strumenti da riga di comando di Google (build 16111833) in `%LOCALAPPDATA%\Android\Sdk`, più
  platform-tools, `platforms/android-36` e `build-tools/36.0.0`.

`apk.mjs` li trova da solo, oppure li legge da `JAVA_HOME` e `ANDROID_HOME`. Dal 2026 `sdkmanager` è sostituito
dalla "Android CLI": i pacchetti si installano con
`%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\android sdk install platforms/android-36` (nomi con `/`, non con
`;`) e le licenze non vanno più accettate a parte.

`npm audit` segnala `uuid` vecchio dentro `xcode`, una dipendenza di `@capacitor/cli` che serve solo ai progetti iOS:
non entra nell'app.

## Provarla sul telefono

L'APK di prova sta anche sul Drive, in `OriginsMeta/50_App_Android/`. Dal telefono:

1. aprirlo dall'app Google Drive e toccare "Installa";
2. consentire l'installazione da quella fonte;
3. alle versioni successive l'APK nuovo si installa sopra il vecchio, perché la chiave di debug è la stessa (quella
   di questo PC, `%USERPROFILE%\.android\debug.keystore`).

Un APK compilato su un altro PC ha un'altra chiave: va prima disinstallata l'app.

Da provare a ogni versione:

- accesso con Discord e con il codice dell'email;
- deck builder e "Copia codice del gioco";
- caricamento di una foto (profilo, copertina) e CAPTCHA;
- link esterni (Steam, PayPal, Twitch) nel browser;
- tasto Indietro;
- modalità aereo (pagina offline, poi "Riprova");
- link `originsmeta.com` da WhatsApp o Discord. Funziona solo dopo `assetlinks.json` (sotto), prima va acceso a mano
  in Impostazioni > App > OriginsMeta > Apri link supportati.

Da verificare (non provato il 20/10): i download dalla WebView (immagine del mazzo, zip del Tracker per Windows),
che nell'app potrebbero non partire.

## Prima di Google Play

1. **Permesso scritto di Koin Games** per un'app con il nome del gioco e le illustrazioni: regole di Play sulla
   proprietà intellettuale. Da unire a quello già da chiedere a Kevin (KB §1).
2. **Account sviluppatore** di Pierluigi: 25 $ una volta, documento d'identità, un dispositivo Android. Gli account
   personali fanno un test chiuso con 12 tester per 14 giorni prima della produzione (il nostro Discord).
3. **Chiave di rilascio.**
   - Keystore creato da Pierluigi e tenuto fuori dal repository e dal Drive condiviso.
   - Play App Signing: Google firma l'app, noi carichiamo con la chiave di caricamento.
   - Build `bundleRelease` (AAB) invece dell'APK di debug.
4. **`/.well-known/assetlinks.json` sul sito** con `com.originsmeta.app` e l'impronta SHA-256 della chiave di firma di
   Play (Play Console > Integrità dell'app). Da lì i link a originsmeta.com aprono l'app senza chiedere.
5. **Scheda.**
   - Nome e icona solo OriginsMeta; testi EN/IT/ES/FR/PT.
   - "App di fan non ufficiale, non affiliata a Koin Games".
   - Screenshot nostri.
   - Informativa (`/privacy`), modulo "Sicurezza dei dati" (account, mazzi, statistiche, Vercel Analytics, GA4 dopo
     il consenso).
6. **Regole di Play da sistemare sul sito.**
   - Cancellazione dell'account dall'app e da una pagina web: oggi si chiede per email.
   - Segnalazione e blocco per i contenuti degli utenti (mazzi, commenti, guide, fumetti).
   - Il tasto "Dona ora" di PayPal dentro l'app: Play vuole il suo sistema di pagamento per i contenuti digitali. Va
     verificato se una donazione volontaria è esente; altrimenti si nasconde nell'app riconoscendo lo user agent.

## Prossime funzioni native

- **Notifiche push**: Firebase Cloud Messaging con `@capacitor/push-notifications`. Serve un progetto Firebase di
  Pierluigi (`google-services.json`), una tabella delle iscrizioni con RLS e l'invio dagli avvisi che il database
  scrive già (Segui, dirette, messaggi dello staff, tornei).
- **Tracker delle partite** quando il gioco esce su Android: `docs/tracker-mobile.md`.
