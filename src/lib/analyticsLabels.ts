import type { Locale } from "./i18n";

/**
 * Testi della pagina /tracker (fino al 12/10/2026 /analytics, che ora è la pagina delle statistiche), la pagina dell'app OriginsMeta Tracker. Un modulo solo nelle quattro lingue,
 * l'inglese è il tipo di riferimento; spagnolo neutro col tú (docs/spagnolo.md), francese col vous e la tipografia
 * francese (docs/francese.md).
 *
 * Storia. Nata il 02/10/2026 come pagina del tool "in pausa" (Pierluigi: "togliamo la pagina del winrate, creiamo una
 * pagina invece"), quando la patch 0.7 aveva tolto i replay, con il tasto "Sei interessato al tool?" sopra e sotto. Dal
 * 10/10/2026 l'app legge di nuovo le carte giocate dallo schermo (scanner) e la pagina è quella del download, con la
 * guida all'installazione passo per passo (Pierluigi: "la pagina del tracker e tutte le stat le avevamo nascoste, vanno
 * riaperte; inoltre nella pagina del tracker mettiamo un tutorial step by step per l'installazione"). Il tasto non c'è
 * più sulla pagina; restano qui i suoi testi (`interest`, `interestCount`) e l'informativa
 * (`analyticsInterestPrivacy`), perché il componente AnalyticsInterest, la tabella e le funzioni SQL restano.
 *
 * Solo fatti verificati sull'app (cartella tracker/ e docs/tracker.md): partita nello storico 15 secondi dopo la fine,
 * scanner che riprende solo la finestra del gioco, Deck tracker e overlay dal riquadro "Overlay", X che chiude tutto,
 * app in inglese, italiano e spagnolo (in francese i nomi dei tasti sono quelli inglesi). Nessuna intenzione attribuita a
 * Koin Games, sempre "non affiliato". Regola del tracker: nessuna parola su bot o persone.
 */

/**
 * Il nome del file che il browser scarica, citato nel passo 2 della guida. L'indirizzo dello zip su GitHub Releases non
 * sta qui (12/10/2026, Pierluigi: "solo i registrati al sito possono scaricare l'app"): lo conosce solo la rotta
 * /api/tracker/download (src/lib/trackerDownload.ts), che lo dà a chi ha fatto l'accesso, così non finisce né
 * nell'HTML né nel JavaScript del browser.
 */
export const TRACKER_DOWNLOAD_FILE = "OriginsMeta-Tracker-win-x64.zip";

/** Il tasto del download: la rotta che controlla l'accesso, con la lingua della pagina (per il ritorno dal login). */
export function trackerDownloadHref(locale: Locale): string {
  return `/api/tracker/download?lang=${locale}`;
}

/**
 * Un passo della guida all'installazione: `{file}` (passo 2) il nome dello zip, `{link}` (passo 5) il link a
 * /account/tracker; `hint` è la riga "Se ti blocchi qui" sotto il passo. Dal 12/10/2026 cinque passi brevi al posto di
 * nove (Pierluigi: "renderli easy"); dal 15/10/2026 sette, uno per ogni punto in cui si perde chi scarica (Pierluigi:
 * "chi scarica deve arrivare fino all'app collegata"): accesso, download, estrazione, avviso SmartScreen, collegamento,
 * scanner, prima partita. I testi dell'app citati fra virgolette sono quelli della 0.4.6 (tracker/src/renderer/app.ts):
 * se cambiano lì, vanno cambiati qui.
 */
type Step = { title: string; text: string; hint: string };

/** L'avviso SmartScreen di Windows disegnato nel passo 4 (schema, non uno screenshot): i testi di Windows nella lingua. */
type SmartScreen = { title: string; body: string; more: string; app: string; publisher: string; unknown: string; dontRun: string; run: string; first: string; second: string; caption: string };

const en = {
  meta: {
    /** titolo della SERP: contiene OriginsMeta, quindi `pageTitle` lo lascia com'è (entro 60 caratteri, test) */
    title: "OriginsMeta Tracker: the match tracker for Origins TCG",
    description: "Download OriginsMeta Tracker for Windows: it records your Origins TCG matches, tracks your deck live and adds an OBS overlay. Step-by-step install guide.",
  },
  kicker: "Our app",
  h1: "OriginsMeta Tracker",
  lead: "A Windows app that records your Origins TCG matches on its own while you play: result, deck, the cards played by you and by your opponent, the Legendary you faced. It shows your deck live next to the game, adds an overlay for streamers and, linked to your account, brings your matches to the site's win rates.",
  download: {
    button: "Download OriginsMeta Tracker",
    note: "For Windows 10 and 11 (64-bit) · zip file from GitHub",
    guide: "How to install it",
    /** il tasto per chi non ha fatto l'accesso (12/10/2026): porta al login e poi torna alla guida */
    signIn: "Sign in to download",
    account: "The app works only with an OriginsMeta account, which is free: sign in to download it, then link it to your account.",
  },
  what: {
    title: "What it does",
    items: [
      "Records every match on its own, 15 seconds after the end: result, deck, rounds. It never touches the game: it reads the files Origins TCG saves on your PC and watches only the game's window.",
      "Reads the cards from the screen: the cards played by you and by your opponent, round by round, and the opposing Legendary from the opening screen.",
      "Deck tracker: a panel next to the game with the deck selected in the game, updated live with the copies you've played and the cards your opponent has revealed.",
      "An overlay above the game and a source for OBS, for streamers: deck, session and last match.",
      "Linked to your OriginsMeta account, it brings your matches to the site: your stats in your account and, for everyone, the anonymous win rates of Legendaries, decks and cards.",
    ],
  },
  shots: {
    overview: {
      alt: "The OriginsMeta Tracker window: the deck selected in the game with its Legendary and 12 cards, recorded matches and win rate",
      caption: "The deck selected in the game, with its cards, and your numbers.",
    },
    matches: {
      alt: "Recorded matches: your decks with their win rate, opposing Legendaries and every match with your deck as cards",
      caption: "Your decks, the Legendaries you faced and every match with your deck as cards.",
    },
    overlay: {
      alt: "The OriginsMeta Tracker overlay: the deck's Legendary, the session, the deck's record and the last match",
      caption: "The overlay, above the game or as an OBS source.",
    },
  },
  install: {
    /** ancora della guida (/en/tracker#install): i link di /account e /account/tracker ci portano */
    anchor: "install",
    title: "From download to your first match in 7 steps",
    intro: "About five minutes. Most people who get stuck stop at steps 3 and 4: the box under each step tells you what to do.",
    /** requisiti, in una riga sopra i passi */
    needs: "You need: a Windows 10 or 11 PC (64-bit), the Origins TCG demo from Steam and a free OriginsMeta account.",
    /** testo del link del passo 5, verso /account/tracker */
    linkText: "the Tracker page of your account",
    /** il percorso in breve, sopra i passi: un'etichetta per passo, link ai passi */
    path: ["Sign in", "Download", "Extract", "Open", "Link", "Scanner", "Play"],
    /** passo 1: il tasto per chi non ha fatto l'accesso e la riga per chi l'ha fatto */
    signInCta: "Sign in or create your account",
    signedIn: "You're signed in: go on to step 2.",
    /** dopo il clic sul download: il passo dopo */
    started: "Download started. Now extract the zip: step 3 ↓",
    stuck: "If you're stuck here",
    shotAlt: "OriginsMeta Tracker on first launch: “Link the app to your OriginsMeta account”, with the three steps, the “Link code” field and the “Link” button",
    shotCaption: "What the app shows the first time you open it (version 0.4.6).",
    steps: [
      { title: "Sign in (it's free)", text: "The app works only with an OriginsMeta account. Sign in with Discord or with your email (we send you a link): if you don't have an account yet, it's created right there. Then come back to this page.", hint: "Using email? The message has a link and a code: if you read it on your phone, type the code on the PC instead. Nothing arrived? Check spam and Promotions." },
      { title: "Download the zip", text: "Press the button and save {file} (about 160 MB). It ends up in your Downloads folder.", hint: "If the browser asks whether to keep the file, choose “Keep”. The button sends you to sign in? Do step 1 first." },
      { title: "Extract the zip", text: "Open the Downloads folder, right-click the zip and choose “Extract All…”, then “Extract”. A new folder opens: the app is in there.", hint: "Don't open the app from inside the zip: it doesn't start or it complains about a missing .dll file. Always from the extracted folder." },
      { title: "Open the app", text: "In the extracted folder open “OriginsMeta Tracker-win32-x64” and double-click “OriginsMeta Tracker.exe”, the one with the OriginsMeta icon. The first time, Windows may show the blue warning below.", hint: "“Unknown publisher” is expected: the app isn't digitally signed yet. Click “More info”, check that the app is “OriginsMeta Tracker.exe”, then “Run anyway”." },
      { title: "Link your account", text: "The app opens on “Link the app to your OriginsMeta account”. Open {link}, press “Create a code”, type the code in the app and press “Link”.", hint: "The code lasts 10 minutes and works once: if it's expired, create a new one. Use the same OriginsMeta account you signed in with." },
      { title: "Keep the scanner on", text: "Once linked, a short tutorial opens (“Next”, or “Skip”). Then the app says “The screen scanner is on”: press “Got it”. The scanner reads the cards played from the game window.", hint: "Pressed “Turn it off”? Switch it back on in Setup → Screen scanner: without it, matches are saved with result and deck only." },
      { title: "Play a match", text: "Open Origins TCG and play: a few seconds after the end the match shows up in the app and then in your account. The Deck tracker and the overlay for OBS are in the app's Setup.", hint: "Can't see the panels above the game? Play in windowed or borderless mode: in exclusive fullscreen Windows hides them." },
    ] as Step[],
    /** l'avviso SmartScreen del passo 4: i testi che mostra Windows in inglese */
    smartscreen: {
      title: "Windows protected your PC",
      body: "Microsoft Defender SmartScreen prevented an unrecognized app from starting.",
      more: "More info",
      app: "App:",
      publisher: "Publisher:",
      unknown: "Unknown publisher",
      dontRun: "Don't run",
      run: "Run anyway",
      first: "1 · click",
      second: "2 · then",
      caption: "Simplified sketch of the Windows warning: first “More info”, then “Run anyway”.",
    } as SmartScreen,
    /** i problemi più comuni, sotto i passi */
    tips: {
      title: "Good to know",
      items: [
        "The X on the app's window closes it. To keep it running, minimize it: its icon stays next to the clock.",
        "Updates are automatic: when a new version is downloading, wait for the app to restart before opening the game.",
        "The screen scanner only looks at the game window, and no image leaves your PC: only the card ids reach the site.",
      ],
      discord: "Still stuck? Ask us on Discord",
    },
  },
  winrate: {
    title: "Win rates on the site",
    text: "The matches recorded with the app linked make up the site's anonymous win rates: Legendaries, community decks, archetypes, cards and matchups, patch by patch. Only totals, never who played.",
    link: "See the win rates",
  },
  privacy: {
    title: "Your data",
    text: "The app reads only the game's files and window, and no image leaves your PC. It works only linked to your OriginsMeta account: only match data and card identifiers reach the site, never names of players. You can unlink it and delete everything from your account.",
    link: "Privacy policy",
  },
  koin: {
    unofficial: "OriginsMeta is an unofficial fan site, not affiliated with Koin Games.",
  },
  /** il tasto "Sei interessato al tool?" (02–10/10/2026), non più sulla pagina: vedi in testa */
  interest: {
    question: "Interested in the tool?",
    button: "Yes, I want it",
    sending: "One moment…",
    done: "Thanks! You've been counted.",
    already: "You're already counted: thanks!",
    countOne: "So far 1 player wants it.",
    /** {n} */
    countMany: "So far {n} players want it.",
    error: "Your answer couldn't be saved. Please try again.",
    rateLimited: "Lots of answers at once: try again in a minute.",
    unavailable: "Counting isn't active yet: try again later.",
    note: "We count once per browser and, if you're signed in, once per account. No email, no other data.",
    privacyLink: "Details in the privacy policy",
  },
};

export type AnalyticsLabels = typeof en;

export const analyticsLabels: Record<Locale, AnalyticsLabels> = {
  en,
  it: {
    meta: {
      title: "OriginsMeta Tracker: il tracker di partite per Origins TCG",
      description: "Scarica OriginsMeta Tracker per Windows: registra le tue partite di Origins TCG, segue il mazzo dal vivo e ha l'overlay per OBS. Guida passo per passo.",
    },
    kicker: "La nostra app",
    h1: "OriginsMeta Tracker",
    lead: "Un'app per Windows che registra da sola le tue partite di Origins TCG mentre giochi: esito, mazzo, le carte giocate da te e dall'avversario, la Leggendaria che avevi di fronte. Ti mostra il mazzo dal vivo accanto al gioco, ha l'overlay per chi fa dirette e, collegata al tuo account, porta le tue partite nei win rate del sito.",
    download: {
      button: "Scarica OriginsMeta Tracker",
      note: "Per Windows 10 e 11 a 64 bit · file zip da GitHub",
      guide: "Come installarla",
      signIn: "Accedi per scaricarla",
      account: "L'app funziona solo con un account OriginsMeta, che è gratuito: accedi per scaricarla, poi collegala al tuo account.",
    },
    what: {
      title: "Che cosa fa",
      items: [
        "Registra da sola ogni partita, 15 secondi dopo la fine: esito, mazzo, round. Non tocca mai il gioco: legge i file che Origins TCG salva sul tuo PC e guarda solo la finestra del gioco.",
        "Legge le carte dallo schermo: quelle giocate da te e dall'avversario, round per round, e la Leggendaria avversaria dalla schermata iniziale.",
        "Deck tracker: un pannello accanto al gioco con il mazzo scelto nel gioco, aggiornato dal vivo con le copie che hai giocato e le carte che l'avversario ha rivelato.",
        "Overlay sopra il gioco e sorgente per OBS, per chi fa dirette: mazzo, sessione e ultima partita.",
        "Collegata al tuo account OriginsMeta, porta le partite sul sito: le tue statistiche nel tuo account e, per tutti, i win rate anonimi di Leggendarie, mazzi e carte.",
      ],
    },
    shots: {
      overview: {
        alt: "La finestra di OriginsMeta Tracker: il mazzo scelto nel gioco con la sua Leggendaria e le 12 carte, le partite registrate e il win rate",
        caption: "Il mazzo scelto nel gioco, con le sue carte, e i tuoi numeri.",
      },
      matches: {
        alt: "Le partite registrate: i tuoi mazzi con il win rate, le Leggendarie avversarie e ogni partita con il mazzo in carte",
        caption: "I tuoi mazzi, le Leggendarie che hai incontrato e ogni partita con il tuo mazzo in carte.",
      },
      overlay: {
        alt: "L'overlay di OriginsMeta Tracker: la Leggendaria del mazzo, la sessione, il record del mazzo e l'ultima partita",
        caption: "L'overlay, sopra il gioco o come sorgente per OBS.",
      },
    },
    install: {
      anchor: "installazione",
      title: "Dal download alla prima partita in 7 passi",
      intro: "Circa cinque minuti. Chi si blocca, di solito si ferma ai passi 3 e 4: il riquadro sotto ogni passo ti dice che cosa fare.",
      /** requisiti, in una riga sopra i passi */
      needs: "Ti servono: un PC con Windows 10 o 11 a 64 bit, la demo di Origins TCG da Steam e un account OriginsMeta gratuito.",
      /** testo del link del passo 5, verso /account/tracker */
      linkText: "la pagina Tracker del tuo account",
      path: ["Accedi", "Scarica", "Estrai", "Apri", "Collega", "Scanner", "Gioca"],
      signInCta: "Accedi o crea l'account",
      signedIn: "Hai già fatto l'accesso: vai al passo 2.",
      started: "Download partito. Ora estrai lo zip: passo 3 ↓",
      stuck: "Se ti blocchi qui",
      shotAlt: "OriginsMeta Tracker al primo avvio: «Collega l'app al tuo account OriginsMeta», con i tre passi, il campo «Codice di collegamento» e il tasto «Collega»",
      shotCaption: "Che cosa mostra l'app la prima volta che la apri (versione 0.4.6).",
      steps: [
        { title: "Accedi (è gratis)", text: "L'app funziona solo con un account OriginsMeta. Accedi con Discord o con la tua email (ti mandiamo un link): se non hai ancora un account, si crea in quel momento. Poi torna su questa pagina.", hint: "Con l'email? Il messaggio ha un link e un codice: se lo leggi dal telefono, scrivi il codice sul PC. Non arriva? Guarda in spam e Promozioni." },
        { title: "Scarica lo zip", text: "Premi il tasto e salva {file} (circa 160 MB). Finisce nella cartella Download.", hint: "Se il browser ti chiede se tenere il file, scegli «Mantieni». Il tasto ti manda alla pagina di accesso? Prima fai il passo 1." },
        { title: "Estrai lo zip", text: "Apri la cartella Download, tasto destro sullo zip, «Estrai tutto…» e poi «Estrai». Si apre una cartella nuova: l'app è lì dentro.", hint: "Non aprire l'app da dentro lo zip: non parte o si lamenta di un file .dll mancante. Sempre dalla cartella estratta." },
        { title: "Apri l'app", text: "Nella cartella estratta apri «OriginsMeta Tracker-win32-x64» e fai doppio clic su «OriginsMeta Tracker.exe», quello con l'icona di OriginsMeta. La prima volta Windows può mostrare l'avviso blu qui sotto.", hint: "«Autore sconosciuto» è normale: l'app non ha ancora la firma digitale. Fai clic su «Ulteriori informazioni», controlla che l'app sia «OriginsMeta Tracker.exe» e poi su «Esegui comunque»." },
        { title: "Collega il tuo account", text: "L'app si apre su «Collega l'app al tuo account OriginsMeta». Apri {link}, premi «Crea un codice», scrivi il codice nell'app e premi «Collega».", hint: "Il codice vale 10 minuti e si usa una volta: se è scaduto, creane uno nuovo. Usa lo stesso account OriginsMeta con cui hai fatto l'accesso." },
        { title: "Tieni acceso lo scanner", text: "Appena collegata, parte un breve tutorial («Avanti», oppure «Salta»). Poi l'app dice «Lo scanner dello schermo è acceso»: premi «Ho capito». Lo scanner legge le carte giocate dalla finestra del gioco.", hint: "Hai premuto «Spegnilo»? Lo riaccendi da Setup → Scanner dello schermo: senza, le partite si salvano solo con esito e mazzo." },
        { title: "Gioca una partita", text: "Apri Origins TCG e gioca: pochi secondi dopo la fine la partita compare nell'app e poi nel tuo account. Deck tracker e overlay per OBS stanno nel Setup dell'app.", hint: "Non vedi i pannelli sopra il gioco? Gioca in finestra o in finestra senza bordi: a schermo intero esclusivo Windows li nasconde." },
      ],
      smartscreen: {
        title: "Windows ha protetto il PC",
        body: "Microsoft Defender SmartScreen ha impedito l'avvio di un'app non riconosciuta.",
        more: "Ulteriori informazioni",
        app: "App:",
        publisher: "Autore:",
        unknown: "Autore sconosciuto",
        dontRun: "Non eseguire",
        run: "Esegui comunque",
        first: "1 · clic qui",
        second: "2 · poi qui",
        caption: "Schema semplificato dell'avviso di Windows: prima «Ulteriori informazioni», poi «Esegui comunque».",
      },
      tips: {
        title: "Buono a sapersi",
        items: [
          "La X della finestra dell'app la chiude. Per tenerla accesa riducila a icona: l'icona resta vicino all'orologio.",
          "Gli aggiornamenti sono automatici: quando sta scaricando una versione nuova, aspetta che l'app si riavvii prima di aprire il gioco.",
          "Lo scanner dello schermo guarda solo la finestra del gioco e nessuna immagine esce dal tuo PC: al sito arrivano solo gli id delle carte.",
        ],
        discord: "Non riesci ancora? Chiedici su Discord",
      },
    },
    winrate: {
      title: "I win rate sul sito",
      text: "Le partite registrate con l'app collegata formano i win rate anonimi del sito: Leggendarie, mazzi della community, archetipi, carte e scontri, patch per patch. Solo totali, mai chi ha giocato.",
      link: "Guarda i win rate",
    },
    privacy: {
      title: "I tuoi dati",
      text: "L'app legge solo i file e la finestra del gioco, e nessuna immagine esce dal tuo PC. Funziona solo collegata al tuo account OriginsMeta: al sito arrivano solo i dati delle partite e gli identificativi delle carte, mai nomi di giocatori. Puoi scollegarla e cancellare tutto dal tuo account.",
      link: "Informativa privacy",
    },
    koin: {
      unofficial: "OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.",
    },
    interest: {
      question: "Sei interessato al tool?",
      button: "Sì, mi interessa",
      sending: "Un attimo…",
      done: "Grazie! Ti abbiamo contato.",
      already: "Ti abbiamo già contato: grazie!",
      countOne: "Finora 1 giocatore lo vuole.",
      countMany: "Finora {n} giocatori lo vogliono.",
      error: "Non è stato possibile registrare la risposta. Riprova.",
      rateLimited: "Tante risposte tutte insieme: riprova fra un minuto.",
      unavailable: "Il conteggio non è ancora attivo: riprova più tardi.",
      note: "Contiamo una volta per browser e, se hai fatto l'accesso, una volta per account. Niente email né altri dati.",
      privacyLink: "Dettagli nell'informativa",
    },
  },
  es: {
    meta: {
      title: "OriginsMeta Tracker: tracker de partidas de Origins TCG",
      description: "Descarga OriginsMeta Tracker para Windows: registra tus partidas de Origins TCG, sigue tu mazo en directo y añade un overlay para OBS. Guía paso a paso.",
    },
    kicker: "Nuestra app",
    h1: "OriginsMeta Tracker",
    lead: "Una app para Windows que registra sola tus partidas de Origins TCG mientras juegas: resultado, mazo, las cartas que jugaron tú y tu rival, la Legendaria que tenías enfrente. Te muestra tu mazo en directo junto al juego, añade un overlay para quien hace directos y, vinculada a tu cuenta, lleva tus partidas al win rate del sitio.",
    download: {
      button: "Descarga OriginsMeta Tracker",
      note: "Para Windows 10 y 11 de 64 bits · archivo zip de GitHub",
      guide: "Cómo instalarla",
      signIn: "Inicia sesión para descargarla",
      account: "La app solo funciona con una cuenta de OriginsMeta, que es gratuita: inicia sesión para descargarla y luego vincúlala a tu cuenta.",
    },
    what: {
      title: "Qué hace",
      items: [
        "Registra sola cada partida, 15 segundos después del final: resultado, mazo, rondas. Nunca toca el juego: lee los archivos que Origins TCG guarda en tu PC y mira solo la ventana del juego.",
        "Lee las cartas de la pantalla: las que jugaron tú y tu rival, ronda a ronda, y la Legendaria rival de la pantalla inicial.",
        "Deck tracker: un panel junto al juego con el mazo elegido en el juego, actualizado en directo con las copias que jugaste y las cartas que reveló tu rival.",
        "Overlay sobre el juego y fuente para OBS, para quien hace directos: mazo, sesión y última partida.",
        "Vinculada a tu cuenta de OriginsMeta, lleva tus partidas al sitio: tus estadísticas en tu cuenta y, para todos, el win rate anónimo de Legendarias, mazos y cartas.",
      ],
    },
    shots: {
      overview: {
        alt: "La ventana de OriginsMeta Tracker: el mazo elegido en el juego con su Legendaria y sus 12 cartas, las partidas registradas y el win rate",
        caption: "El mazo elegido en el juego, con sus cartas, y tus números.",
      },
      matches: {
        alt: "Las partidas registradas: tus mazos con su win rate, las Legendarias rivales y cada partida con tu mazo en cartas",
        caption: "Tus mazos, las Legendarias que enfrentaste y cada partida con tu mazo en cartas.",
      },
      overlay: {
        alt: "El overlay de OriginsMeta Tracker: la Legendaria del mazo, la sesión, el récord del mazo y la última partida",
        caption: "El overlay, sobre el juego o como fuente para OBS.",
      },
    },
    install: {
      anchor: "instalacion",
      title: "De la descarga a tu primera partida en 7 pasos",
      intro: "Unos cinco minutos. Quien se atasca suele quedarse en los pasos 3 y 4: el recuadro bajo cada paso te dice qué hacer.",
      /** requisiti, in una riga sopra i passi */
      needs: "Necesitas: un PC con Windows 10 u 11 de 64 bits, la demo de Origins TCG de Steam y una cuenta gratuita de OriginsMeta.",
      /** testo del link del passo 5, verso /account/tracker */
      linkText: "la página Tracker de tu cuenta",
      path: ["Inicia sesión", "Descarga", "Extrae", "Abre", "Vincula", "Escáner", "Juega"],
      signInCta: "Inicia sesión o crea tu cuenta",
      signedIn: "Ya iniciaste sesión: pasa al paso 2.",
      started: "Descarga iniciada. Ahora extrae el zip: paso 3 ↓",
      stuck: "Si te atascas aquí",
      shotAlt: "OriginsMeta Tracker al abrirla por primera vez: «Vincula la app a tu cuenta de OriginsMeta», con los tres pasos, el campo «Código de vinculación» y el botón «Vincular»",
      shotCaption: "Lo que muestra la app la primera vez que la abres (versión 0.4.6).",
      steps: [
        { title: "Inicia sesión (es gratis)", text: "La app solo funciona con una cuenta de OriginsMeta. Inicia sesión con Discord o con tu email (te enviamos un enlace): si aún no tienes cuenta, se crea en ese momento. Luego vuelve a esta página.", hint: "¿Con email? El mensaje trae un enlace y un código: si lo lees en el móvil, escribe el código en el PC. ¿No llega? Mira en spam y Promociones." },
        { title: "Descarga el zip", text: "Pulsa el botón y guarda {file} (unos 160 MB). Acaba en tu carpeta Descargas.", hint: "Si el navegador te pregunta si conservar el archivo, elige «Conservar». ¿El botón te lleva a iniciar sesión? Haz primero el paso 1." },
        { title: "Extrae el zip", text: "Abre la carpeta Descargas, clic derecho en el zip, «Extraer todo…» y luego «Extraer». Se abre una carpeta nueva: la app está dentro.", hint: "No abras la app desde dentro del zip: no arranca o se queja de un archivo .dll que falta. Siempre desde la carpeta extraída." },
        { title: "Abre la app", text: "En la carpeta extraída abre «OriginsMeta Tracker-win32-x64» y haz doble clic en «OriginsMeta Tracker.exe», el que tiene el icono de OriginsMeta. La primera vez Windows puede mostrar el aviso azul de abajo.", hint: "«Editor desconocido» es normal: la app todavía no tiene firma digital. Haz clic en «Más información», comprueba que la app sea «OriginsMeta Tracker.exe» y luego en «Ejecutar de todas formas»." },
        { title: "Vincula tu cuenta", text: "La app se abre en «Vincula la app a tu cuenta de OriginsMeta». Abre {link}, pulsa «Crear un código», escribe el código en la app y pulsa «Vincular».", hint: "El código vale 10 minutos y se usa una sola vez: si caducó, crea otro. Usa la misma cuenta de OriginsMeta con la que iniciaste sesión." },
        { title: "Deja el escáner activado", text: "Una vez vinculada, empieza un breve tutorial («Siguiente», o «Saltar»). Luego la app dice «El escáner de pantalla está activado»: pulsa «Entendido». El escáner lee las cartas jugadas de la ventana del juego.", hint: "¿Pulsaste «Desactivarlo»? Lo vuelves a activar en Setup → Escáner de pantalla: sin él, las partidas se guardan solo con resultado y mazo." },
        { title: "Juega una partida", text: "Abre Origins TCG y juega: unos segundos después del final la partida aparece en la app y luego en tu cuenta. El Deck tracker y el overlay para OBS están en el Setup de la app.", hint: "¿No ves los paneles sobre el juego? Juega en modo ventana o ventana sin bordes: en pantalla completa exclusiva Windows los oculta." },
      ],
      smartscreen: {
        title: "Windows protegió su PC",
        body: "Microsoft Defender SmartScreen impidió el inicio de una aplicación no reconocida.",
        more: "Más información",
        app: "Aplicación:",
        publisher: "Editor:",
        unknown: "Editor desconocido",
        dontRun: "No ejecutar",
        run: "Ejecutar de todas formas",
        first: "1 · clic aquí",
        second: "2 · luego aquí",
        caption: "Esquema simplificado del aviso de Windows: primero «Más información», luego «Ejecutar de todas formas».",
      },
      tips: {
        title: "Conviene saberlo",
        items: [
          "La X de la ventana de la app la cierra. Para que siga abierta, minimízala: su icono se queda junto al reloj.",
          "Las actualizaciones son automáticas: cuando se está descargando una versión nueva, espera a que la app se reinicie antes de abrir el juego.",
          "El escáner de pantalla solo mira la ventana del juego y ninguna imagen sale de tu PC: al sitio solo llegan los id de las cartas.",
        ],
        discord: "¿Todavía no funciona? Pregúntanos en Discord",
      },
    },
    winrate: {
      title: "El win rate en el sitio",
      text: "Las partidas registradas con la app vinculada forman el win rate anónimo del sitio: Legendarias, mazos de la comunidad, arquetipos, cartas y enfrentamientos, parche a parche. Solo totales, nunca quién jugó.",
      link: "Ver el win rate",
    },
    privacy: {
      title: "Tus datos",
      text: "La app lee solo los archivos y la ventana del juego, y ninguna imagen sale de tu PC. Solo funciona vinculada a tu cuenta de OriginsMeta: al sitio solo llegan los datos de las partidas y los identificadores de las cartas, nunca nombres de jugadores. Puedes desvincularla y borrarlo todo desde tu cuenta.",
      link: "Política de privacidad",
    },
    koin: {
      unofficial: "OriginsMeta es un sitio fan no oficial, sin afiliación con Koin Games.",
    },
    interest: {
      question: "¿Te interesa la herramienta?",
      button: "Sí, la quiero",
      sending: "Un momento…",
      done: "¡Gracias! Ya te contamos.",
      already: "Ya te contamos: ¡gracias!",
      countOne: "Por ahora 1 jugador la quiere.",
      countMany: "Por ahora {n} jugadores la quieren.",
      error: "No se pudo guardar tu respuesta. Vuelve a intentarlo.",
      rateLimited: "Muchas respuestas a la vez: vuelve a intentarlo en un minuto.",
      unavailable: "El conteo todavía no está activo: vuelve a intentarlo más tarde.",
      note: "Contamos una vez por navegador y, si iniciaste sesión, una vez por cuenta. Sin email ni otros datos.",
      privacyLink: "Detalles en la política de privacidad",
    },
  },
  // Francese (docs/francese.md): vous, "l'application" (femminile: "elle"), frasi senza genere; l'app non ha il francese
  // (inglese, italiano, spagnolo: in francese parte in inglese), quindi i nomi dei tasti dell'app sono quelli inglesi.
  // Regola del tracker: niente parole su bot o persone.
  fr: {
    meta: {
      title: "OriginsMeta Tracker : tracker de parties d'Origins TCG",
      description: "Téléchargez OriginsMeta Tracker pour Windows : vos parties d'Origins TCG enregistrées, votre deck suivi en direct et un overlay OBS. Guide pas à pas.",
    },
    kicker: "Notre application",
    h1: "OriginsMeta Tracker",
    lead: "Une application Windows qui enregistre seule vos parties d'Origins TCG pendant que vous jouez : résultat, deck, les cartes jouées par vous et par votre adversaire, la Légendaire affrontée. Elle affiche votre deck en direct à côté du jeu, ajoute un overlay pour les streamers et, associée à votre compte, envoie vos parties vers les win rates du site.",
    download: {
      button: "Télécharger OriginsMeta Tracker",
      note: "Pour Windows 10 et 11 (64 bits) · fichier zip sur GitHub",
      guide: "Comment l'installer",
      signIn: "Connectez-vous pour la télécharger",
      account: "L'application fonctionne uniquement avec un compte OriginsMeta, qui est gratuit : connectez-vous pour la télécharger, puis associez-la à votre compte.",
    },
    what: {
      title: "Ce qu'elle fait",
      items: [
        "Elle enregistre chaque partie toute seule, 15 secondes après la fin : résultat, deck, manches. Elle ne touche jamais au jeu : elle lit les fichiers qu'Origins TCG enregistre sur votre PC et ne regarde que la fenêtre du jeu.",
        "Elle lit les cartes à l'écran : celles jouées par vous et par votre adversaire, manche par manche, et la Légendaire adverse sur l'écran d'ouverture.",
        "Deck tracker : un panneau à côté du jeu avec le deck sélectionné dans le jeu, mis à jour en direct avec les copies que vous avez jouées et les cartes révélées par l'adversaire.",
        "Un overlay au-dessus du jeu et une source pour OBS, pour les streamers : deck, session et dernière partie.",
        "Associée à votre compte OriginsMeta, elle envoie vos parties sur le site : vos statistiques dans votre compte et, pour tout le monde, les win rates anonymes des Légendaires, des decks et des cartes.",
      ],
    },
    shots: {
      overview: {
        alt: "La fenêtre d'OriginsMeta Tracker : le deck sélectionné dans le jeu avec sa Légendaire et ses 12 cartes, les parties enregistrées et le win rate",
        caption: "Le deck sélectionné dans le jeu, avec ses cartes, et vos chiffres.",
      },
      matches: {
        alt: "Les parties enregistrées : vos decks avec leur win rate, les Légendaires adverses et chaque partie avec votre deck en cartes",
        caption: "Vos decks, les Légendaires affrontées et chaque partie avec votre deck en cartes.",
      },
      overlay: {
        alt: "L'overlay d'OriginsMeta Tracker : la Légendaire du deck, la session, le bilan du deck et la dernière partie",
        caption: "L'overlay, au-dessus du jeu ou comme source OBS.",
      },
    },
    install: {
      anchor: "installation",
      title: "Du téléchargement à votre première partie en 7 étapes",
      intro: "Environ cinq minutes. Quand ça bloque, c'est en général aux étapes 3 et 4 : l'encadré sous chaque étape vous dit quoi faire.",
      /** requisiti, in una riga sopra i passi */
      needs: "Il vous faut : un PC sous Windows 10 ou 11 (64 bits), la démo d'Origins TCG depuis Steam et un compte OriginsMeta gratuit.",
      /** testo del link del passo 5, verso /account/tracker */
      linkText: "la page Tracker de votre compte",
      path: ["Connexion", "Téléchargement", "Extraction", "Ouverture", "Association", "Scanner", "Partie"],
      signInCta: "Connectez-vous ou créez votre compte",
      signedIn: "Votre session est ouverte : passez à l'étape 2.",
      started: "Téléchargement lancé. Extrayez maintenant le zip : étape 3 ↓",
      stuck: "Si ça bloque ici",
      shotAlt: "OriginsMeta Tracker au premier lancement : « Link the app to your OriginsMeta account », avec les trois étapes, le champ « Link code » et le bouton « Link »",
      shotCaption: "Ce qu'affiche l'application la première fois que vous l'ouvrez (version 0.4.6, en anglais).",
      steps: [
        { title: "Connectez-vous (c'est gratuit)", text: "L'application fonctionne uniquement avec un compte OriginsMeta. Connectez-vous avec Discord ou avec votre e-mail (nous vous envoyons un lien) : sans compte, il se crée à ce moment-là. Revenez ensuite sur cette page.", hint: "Par e-mail ? Le message contient un lien et un code : si vous le lisez sur votre téléphone, saisissez le code sur le PC. Rien reçu ? Regardez dans les spams et Promotions." },
        { title: "Téléchargez le zip", text: "Appuyez sur le bouton et enregistrez {file} (environ 160 Mo). Il arrive dans votre dossier Téléchargements.", hint: "Si le navigateur demande s'il faut conserver le fichier, choisissez « Conserver ». Le bouton vous envoie vers la connexion ? Faites d'abord l'étape 1." },
        { title: "Extrayez le zip", text: "Ouvrez le dossier Téléchargements, clic droit sur le zip, « Extraire tout… » puis « Extraire ». Un nouveau dossier s'ouvre : l'application est dedans.", hint: "N'ouvrez pas l'application depuis l'intérieur du zip : elle ne démarre pas ou signale un fichier .dll manquant. Toujours depuis le dossier extrait." },
        { title: "Ouvrez l'application", text: "Dans le dossier extrait, ouvrez « OriginsMeta Tracker-win32-x64 » et double-cliquez sur « OriginsMeta Tracker.exe », celui avec l'icône d'OriginsMeta. La première fois, Windows peut afficher l'avertissement bleu ci-dessous.", hint: "« Éditeur inconnu » est normal : l'application n'a pas encore de signature numérique. Cliquez sur « Informations complémentaires », vérifiez qu'il s'agit d'« OriginsMeta Tracker.exe », puis sur « Exécuter quand même »." },
        { title: "Associez votre compte", text: "L'application s'ouvre sur « Link the app to your OriginsMeta account » (elle est en anglais). Ouvrez {link}, appuyez sur « Créer un code », saisissez le code dans l'application et appuyez sur « Link ».", hint: "Le code est valable 10 minutes et une seule fois : s'il a expiré, créez-en un autre. Utilisez le même compte OriginsMeta que pour la connexion." },
        { title: "Gardez le scanner activé", text: "Une fois l'application associée, un court tutoriel s'ouvre (« Next », ou « Skip »). Ensuite, elle affiche « The screen scanner is on » : appuyez sur « Got it ». Le scanner lit les cartes jouées dans la fenêtre du jeu.", hint: "Vous avez appuyé sur « Turn it off » ? Réactivez-le dans Setup → Screen scanner : sans lui, les parties s'enregistrent seulement avec le résultat et le deck." },
        { title: "Jouez une partie", text: "Ouvrez Origins TCG et jouez : quelques secondes après la fin, la partie apparaît dans l'application, puis dans votre compte. Le Deck tracker et l'overlay pour OBS se trouvent dans le Setup de l'application.", hint: "Vous ne voyez pas les panneaux au-dessus du jeu ? Jouez en mode fenêtré ou fenêtré sans bordure : en plein écran exclusif, Windows les masque." },
      ],
      smartscreen: {
        title: "Windows a protégé votre ordinateur",
        body: "Microsoft Defender SmartScreen a empêché le démarrage d'une application non reconnue.",
        more: "Informations complémentaires",
        app: "Application :",
        publisher: "Éditeur :",
        unknown: "Éditeur inconnu",
        dontRun: "Ne pas exécuter",
        run: "Exécuter quand même",
        first: "1 · cliquez ici",
        second: "2 · puis ici",
        caption: "Schéma simplifié de l'avertissement de Windows : d'abord « Informations complémentaires », puis « Exécuter quand même ».",
      },
      tips: {
        title: "Bon à savoir",
        items: [
          "La croix de la fenêtre de l'application la ferme. Pour la garder ouverte, réduisez-la : son icône reste près de l'horloge.",
          "Les mises à jour sont automatiques : quand une nouvelle version se télécharge, attendez que l'application redémarre avant d'ouvrir le jeu.",
          "Le scanner d'écran regarde uniquement la fenêtre du jeu et aucune image ne quitte votre PC : seuls les identifiants des cartes arrivent sur le site.",
        ],
        discord: "Ça ne marche toujours pas ? Posez-nous la question sur Discord",
      },
    },
    winrate: {
      title: "Les win rates sur le site",
      text: "Les parties enregistrées avec l'application associée forment les win rates anonymes du site : Légendaires, decks de la communauté, archétypes, cartes et matchups, patch par patch. Uniquement des totaux, jamais qui a joué.",
      link: "Voir les win rates",
    },
    privacy: {
      title: "Vos données",
      text: "L'application lit uniquement les fichiers et la fenêtre du jeu, et aucune image ne quitte votre PC. Elle fonctionne uniquement associée à votre compte OriginsMeta : seules les données des parties et les identifiants des cartes arrivent sur le site, jamais de noms de joueurs. Vous pouvez la dissocier et tout supprimer depuis votre compte.",
      link: "Politique de confidentialité",
    },
    koin: {
      unofficial: "OriginsMeta est un site de fans non officiel, non affilié à Koin Games.",
    },
    interest: {
      question: "L'outil vous intéresse ?",
      button: "Oui, je le veux",
      sending: "Un instant…",
      done: "Merci ! Votre réponse est comptée.",
      already: "Votre réponse est déjà comptée : merci !",
      countOne: "Pour l'instant, 1 joueur le veut.",
      countMany: "Pour l'instant, {n} joueurs le veulent.",
      error: "Votre réponse n'a pas pu être enregistrée. Réessayez.",
      rateLimited: "Beaucoup de réponses en même temps : réessayez dans une minute.",
      unavailable: "Le comptage n'est pas encore actif : réessayez plus tard.",
      note: "Nous comptons une fois par navigateur et, avec une session ouverte, une fois par compte. Ni e-mail ni autre donnée.",
      privacyLink: "Détails dans la politique de confidentialité",
    },
  },
  pt: {
    meta: {
      title: "OriginsMeta Tracker: o tracker de partidas de Origins TCG",
      description: "Baixe o OriginsMeta Tracker para Windows: registra suas partidas de Origins TCG, acompanha o seu deck ao vivo e tem overlay para OBS. Guia passo a passo.",
    },
    kicker: "Nosso app",
    h1: "OriginsMeta Tracker",
    lead: "Um app para Windows que registra sozinho as suas partidas de Origins TCG enquanto você joga: resultado, deck, as cartas jogadas por você e pelo oponente, a Lendária que você enfrentou. Mostra o seu deck ao vivo ao lado do jogo, tem um overlay para streamers e, vinculado à sua conta, leva as suas partidas para os win rates do site.",
    download: {
      button: "Baixar o OriginsMeta Tracker",
      note: "Para Windows 10 e 11 (64 bits) · arquivo zip no GitHub",
      guide: "Como instalar",
      signIn: "Entre para baixar",
      account: "O app só funciona com uma conta do OriginsMeta, que é gratuita: entre para baixar e depois vincule o app à sua conta.",
    },
    what: {
      title: "O que ele faz",
      items: [
        "Registra cada partida sozinho, 15 segundos depois do fim: resultado, deck, rodadas. Nunca mexe no jogo: lê os arquivos que o Origins TCG salva no seu PC e observa só a janela do jogo.",
        "Lê as cartas na tela: as cartas jogadas por você e pelo oponente, rodada a rodada, e a Lendária do oponente na tela de abertura.",
        "Deck tracker: um painel ao lado do jogo com o deck selecionado no jogo, atualizado ao vivo com as cópias que você jogou e as cartas que o oponente revelou.",
        "Um overlay em cima do jogo e uma fonte para o OBS, para streamers: deck, sessão e última partida.",
        "Vinculado à sua conta do OriginsMeta, leva as suas partidas para o site: as suas estatísticas na sua conta e, para todo mundo, os win rates anônimos de Lendárias, decks e cartas.",
      ],
    },
    shots: {
      overview: {
        alt: "A janela do OriginsMeta Tracker: o deck selecionado no jogo com a Lendária e as 12 cartas, as partidas registradas e o win rate",
        caption: "O deck selecionado no jogo, com as cartas, e os seus números.",
      },
      matches: {
        alt: "As partidas registradas: os seus decks com o win rate, as Lendárias enfrentadas e cada partida com o seu deck em cartas",
        caption: "Os seus decks, as Lendárias que você enfrentou e cada partida com o seu deck em cartas.",
      },
      overlay: {
        alt: "O overlay do OriginsMeta Tracker: a Lendária do deck, a sessão, o retrospecto do deck e a última partida",
        caption: "O overlay, em cima do jogo ou como fonte do OBS.",
      },
    },
    install: {
      anchor: "instalacao",
      title: "Do download à sua primeira partida em 7 passos",
      intro: "Cerca de cinco minutos. Quem trava costuma parar nos passos 3 e 4: o quadro embaixo de cada passo diz o que fazer.",
      needs: "Você precisa de: um PC com Windows 10 ou 11 (64 bits), a demo de Origins TCG na Steam e uma conta gratuita do OriginsMeta.",
      linkText: "a página Tracker da sua conta",
      path: ["Entrar", "Baixar", "Extrair", "Abrir", "Vincular", "Scanner", "Jogar"],
      signInCta: "Entre ou crie a sua conta",
      signedIn: "Você já entrou: siga para o passo 2.",
      started: "Download iniciado. Agora extraia o zip: passo 3 ↓",
      stuck: "Se você travar aqui",
      shotAlt: "OriginsMeta Tracker na primeira abertura: “Link the app to your OriginsMeta account”, com os três passos, o campo “Link code” e o botão “Link”",
      shotCaption: "O que o app mostra na primeira vez que você o abre (versão 0.4.6, em inglês).",
      steps: [
        { title: "Entre (é grátis)", text: "O app só funciona com uma conta do OriginsMeta. Entre com o Discord ou com o seu e-mail (mandamos um link): se você ainda não tem conta, ela é criada ali mesmo. Depois volte a esta página.", hint: "Pelo e-mail? A mensagem tem um link e um código: se você a lê no celular, digite o código no PC. Não chegou nada? Veja no spam e em Promoções." },
        { title: "Baixe o zip", text: "Aperte o botão e salve {file} (cerca de 160 MB). Ele vai para a sua pasta Downloads.", hint: "Se o navegador perguntar se deve manter o arquivo, escolha “Manter”. O botão manda você entrar? Faça primeiro o passo 1." },
        { title: "Extraia o zip", text: "Abra a pasta Downloads, clique com o botão direito no zip e escolha “Extrair Tudo…”, depois “Extrair”. Uma pasta nova se abre: o app está lá dentro.", hint: "Não abra o app de dentro do zip: ele não inicia ou reclama de um arquivo .dll que falta. Sempre da pasta extraída." },
        { title: "Abra o app", text: "Na pasta extraída, abra “OriginsMeta Tracker-win32-x64” e dê dois cliques em “OriginsMeta Tracker.exe”, o que tem o ícone do OriginsMeta. Na primeira vez, o Windows pode mostrar o aviso azul abaixo.", hint: "“Editor desconhecido” é normal: o app ainda não tem assinatura digital. Clique em “Mais informações”, confira que o app é “OriginsMeta Tracker.exe” e depois em “Executar assim mesmo”." },
        { title: "Vincule a sua conta", text: "O app abre em “Link the app to your OriginsMeta account” (ele está em inglês). Abra {link}, aperte “Criar um código”, digite o código no app e aperte “Link”.", hint: "O código vale 10 minutos e funciona uma vez só: se tiver expirado, crie outro. Use a mesma conta do OriginsMeta com que você entrou." },
        { title: "Deixe o scanner ligado", text: "Depois de vincular, abre um tutorial curto (“Next”, ou “Skip”). Em seguida o app diz “The screen scanner is on”: aperte “Got it”. O scanner lê as cartas jogadas na janela do jogo.", hint: "Apertou “Turn it off”? Ligue de novo em Setup → Screen scanner: sem ele, as partidas são salvas só com resultado e deck." },
        { title: "Jogue uma partida", text: "Abra o Origins TCG e jogue: alguns segundos depois do fim, a partida aparece no app e depois na sua conta. O Deck tracker e o overlay para o OBS estão no Setup do app.", hint: "Não vê os painéis em cima do jogo? Jogue em modo janela ou janela sem bordas: em tela cheia exclusiva, o Windows os esconde." },
      ],
      smartscreen: {
        title: "O Windows protegeu o computador",
        body: "O Microsoft Defender SmartScreen impediu a inicialização de um aplicativo não reconhecido.",
        more: "Mais informações",
        app: "Aplicativo:",
        publisher: "Editor:",
        unknown: "Editor desconhecido",
        dontRun: "Não executar",
        run: "Executar assim mesmo",
        first: "1 · clique",
        second: "2 · depois",
        caption: "Esquema simplificado do aviso do Windows: primeiro “Mais informações”, depois “Executar assim mesmo”.",
      },
      tips: {
        title: "É bom saber",
        items: [
          "O X da janela do app fecha o app. Para deixá-lo rodando, minimize: o ícone dele fica perto do relógio.",
          "As atualizações são automáticas: quando uma versão nova estiver baixando, espere o app reiniciar antes de abrir o jogo.",
          "O scanner de tela olha só a janela do jogo, e nenhuma imagem sai do seu PC: só os ids das cartas chegam ao site.",
        ],
        discord: "Ainda travado? Pergunte para nós no Discord",
      },
    },
    winrate: {
      title: "Os win rates no site",
      text: "As partidas registradas com o app vinculado formam os win rates anônimos do site: Lendárias, decks da comunidade, arquétipos, cartas e matchups, patch a patch. Só totais, nunca quem jogou.",
      link: "Ver os win rates",
    },
    privacy: {
      title: "Os seus dados",
      text: "O app lê só os arquivos e a janela do jogo, e nenhuma imagem sai do seu PC. Ele só funciona vinculado à sua conta do OriginsMeta: só os dados das partidas e os identificadores das cartas chegam ao site, nunca nomes de jogadores. Você pode desvincular o app e apagar tudo na sua conta.",
      link: "Política de privacidade",
    },
    koin: {
      unofficial: "OriginsMeta é um site de fãs não oficial, não afiliado à Koin Games.",
    },
    interest: {
      question: "Tem interesse na ferramenta?",
      button: "Sim, eu quero",
      sending: "Um momento…",
      done: "Obrigado! Você foi contado.",
      already: "Você já foi contado: obrigado!",
      countOne: "Até agora, 1 jogador quer.",
      countMany: "Até agora, {n} jogadores querem.",
      error: "Não foi possível salvar a sua resposta. Tente de novo.",
      rateLimited: "Muitas respostas ao mesmo tempo: tente de novo em um minuto.",
      unavailable: "A contagem ainda não está ativa: tente de novo mais tarde.",
      note: "Contamos uma vez por navegador e, se você tiver entrado, uma vez por conta. Nenhum e-mail, nenhum outro dado.",
      privacyLink: "Detalhes na política de privacidade",
    },
  },
  de: {
    meta: {
      title: "OriginsMeta Tracker: der Match-Tracker für Origins TCG",
      description: "Hol dir OriginsMeta Tracker für Windows: Er erfasst deine Matches in Origins TCG, zeigt dein Deck live und hat ein OBS-Overlay. Anleitung Schritt für Schritt.",
    },
    kicker: "Unsere App",
    h1: "OriginsMeta Tracker",
    lead: "Eine Windows-App, die deine Matches in Origins TCG beim Spielen von selbst erfasst: Ergebnis, Deck, die von dir und deinem Gegner gespielten Karten, die Legendäre, gegen die du gespielt hast. Sie zeigt dein Deck live neben dem Spiel, hat ein Overlay für Streamer und bringt deine Matches, mit deinem Konto verknüpft, in die Win-Rates der Website.",
    download: {
      button: "OriginsMeta Tracker herunterladen",
      note: "Für Windows 10 und 11 (64 Bit) · ZIP-Datei von GitHub",
      guide: "So installierst du sie",
      signIn: "Zum Herunterladen anmelden",
      account: "Die App funktioniert nur mit einem OriginsMeta-Konto, das kostenlos ist: Melde dich zum Herunterladen an und verknüpfe sie dann mit deinem Konto.",
    },
    what: {
      title: "Was sie macht",
      items: [
        "Erfasst jedes Match von selbst, 15 Sekunden nach dem Ende: Ergebnis, Deck, Runden. Sie greift nie in das Spiel ein: Sie liest die Dateien, die Origins TCG auf deinem PC speichert, und schaut nur auf das Fenster des Spiels.",
        "Liest die Karten vom Bildschirm: die von dir und deinem Gegner gespielten Karten, Runde für Runde, und die gegnerische Legendäre vom Startbildschirm.",
        "Deck tracker: ein Panel neben dem Spiel mit dem im Spiel gewählten Deck, live aktualisiert mit den Kopien, die du gespielt hast, und den Karten, die dein Gegner aufgedeckt hat.",
        "Ein Overlay über dem Spiel und eine Quelle für OBS, für Streamer: Deck, Session und letztes Match.",
        "Mit deinem OriginsMeta-Konto verknüpft, bringt sie deine Matches auf die Website: deine Statistiken in deinem Konto und, für alle, die anonymen Win-Rates von Legendären, Decks und Karten.",
      ],
    },
    shots: {
      overview: {
        alt: "Das Fenster von OriginsMeta Tracker: das im Spiel gewählte Deck mit seiner Legendären und 12 Karten, erfasste Matches und Win-Rate",
        caption: "Das im Spiel gewählte Deck mit seinen Karten und deinen Zahlen.",
      },
      matches: {
        alt: "Erfasste Matches: deine Decks mit ihrer Win-Rate, gegnerische Legendäre und jedes Match mit deinem Deck als Karten",
        caption: "Deine Decks, die Legendären, gegen die du gespielt hast, und jedes Match mit deinem Deck als Karten.",
      },
      overlay: {
        alt: "Das Overlay von OriginsMeta Tracker: die Legendäre des Decks, die Session, die Bilanz des Decks und das letzte Match",
        caption: "Das Overlay, über dem Spiel oder als OBS-Quelle.",
      },
    },
    install: {
      anchor: "installation",
      title: "Vom Download zum ersten Match in 7 Schritten",
      intro: "Etwa fünf Minuten. Wer hängen bleibt, bleibt meist bei den Schritten 3 und 4 stehen: Der Kasten unter jedem Schritt sagt dir, was zu tun ist.",
      needs: "Du brauchst: einen PC mit Windows 10 oder 11 (64 Bit), die Demo von Origins TCG auf Steam und ein kostenloses OriginsMeta-Konto.",
      linkText: "die Tracker-Seite deines Kontos",
      path: ["Anmelden", "Herunterladen", "Entpacken", "Öffnen", "Verknüpfen", "Scanner", "Spielen"],
      signInCta: "Anmelden oder Konto erstellen",
      signedIn: "Du bist angemeldet: Weiter mit Schritt 2.",
      started: "Download gestartet. Jetzt das ZIP entpacken: Schritt 3 ↓",
      stuck: "Wenn du hier hängst",
      shotAlt: "OriginsMeta Tracker beim ersten Start: „Link the app to your OriginsMeta account“, mit den drei Schritten, dem Feld „Link code“ und der Schaltfläche „Link“",
      shotCaption: "Was die App beim ersten Öffnen zeigt (Version 0.4.6, auf Englisch).",
      steps: [
        { title: "Anmelden (kostenlos)", text: "Die App funktioniert nur mit einem OriginsMeta-Konto. Melde dich mit Discord oder mit deiner E-Mail an (wir schicken dir einen Link): Wenn du noch kein Konto hast, wird es dabei erstellt. Komm dann auf diese Seite zurück.", hint: "Per E-Mail? Die Nachricht enthält einen Link und einen Code: Wenn du sie auf dem Handy liest, gib den Code am PC ein. Nichts angekommen? Schau im Spam und unter Werbung nach." },
        { title: "ZIP herunterladen", text: "Drück auf die Schaltfläche und speichere {file} (etwa 160 MB). Die Datei landet in deinem Ordner Downloads.", hint: "Wenn der Browser fragt, ob er die Datei behalten soll, wähle „Behalten“. Die Schaltfläche schickt dich zur Anmeldung? Mach zuerst Schritt 1." },
        { title: "ZIP entpacken", text: "Öffne den Ordner Downloads, klick mit der rechten Maustaste auf das ZIP und wähle „Alle extrahieren…“, dann „Extrahieren“. Ein neuer Ordner öffnet sich: Darin ist die App.", hint: "Öffne die App nicht direkt in der .zip-Datei: Sie startet nicht oder meldet eine fehlende .dll-Datei. Immer aus dem entpackten Ordner." },
        { title: "App öffnen", text: "Öffne im entpackten Ordner „OriginsMeta Tracker-win32-x64“ und doppelklicke auf „OriginsMeta Tracker.exe“, die mit dem OriginsMeta-Symbol. Beim ersten Mal zeigt Windows eventuell den blauen Hinweis unten.", hint: "„Unbekannter Herausgeber“ ist normal: Die App ist noch nicht digital signiert. Klick auf „Weitere Informationen“, prüfe, dass die App „OriginsMeta Tracker.exe“ ist, dann „Trotzdem ausführen“." },
        { title: "Konto verknüpfen", text: "Die App öffnet sich mit „Link the app to your OriginsMeta account“ (sie ist auf Englisch). Öffne {link}, drück auf „Code erstellen“, gib den Code in der App ein und drück auf „Link“.", hint: "Der Code gilt 10 Minuten und funktioniert einmal: Wenn er abgelaufen ist, erstelle einen neuen. Verwende dasselbe OriginsMeta-Konto, mit dem du angemeldet bist." },
        { title: "Scanner eingeschaltet lassen", text: "Nach dem Verknüpfen öffnet sich ein kurzes Tutorial („Next“ oder „Skip“). Dann meldet die App „The screen scanner is on“: Drück auf „Got it“. Der Scanner liest die gespielten Karten aus dem Fenster des Spiels.", hint: "Auf „Turn it off“ gedrückt? Schalte ihn unter Setup → Screen scanner wieder ein: Ohne ihn werden Matches nur mit Ergebnis und Deck gespeichert." },
        { title: "Ein Match spielen", text: "Öffne Origins TCG und spiel: Ein paar Sekunden nach dem Ende erscheint das Match in der App und dann in deinem Konto. Den Deck tracker und das Overlay für OBS findest du im Setup der App.", hint: "Du siehst die Panels über dem Spiel nicht? Spiel im Fenstermodus oder randlos: Im exklusiven Vollbild blendet Windows sie aus." },
      ],
      smartscreen: {
        title: "Der Computer wurde durch Windows geschützt",
        body: "Von Microsoft Defender SmartScreen wurde der Start einer unbekannten App verhindert.",
        more: "Weitere Informationen",
        app: "App:",
        publisher: "Herausgeber:",
        unknown: "Unbekannter Herausgeber",
        dontRun: "Nicht ausführen",
        run: "Trotzdem ausführen",
        first: "1 · klicken",
        second: "2 · dann",
        caption: "Vereinfachte Skizze des Windows-Hinweises: zuerst „Weitere Informationen“, dann „Trotzdem ausführen“.",
      },
      tips: {
        title: "Gut zu wissen",
        items: [
          "Das X am Fenster der App schließt sie. Damit sie weiterläuft, minimiere sie: Ihr Symbol bleibt neben der Uhr.",
          "Updates kommen automatisch: Wenn eine neue Version heruntergeladen wird, warte, bis die App neu startet, bevor du das Spiel öffnest.",
          "Der Bildschirm-Scanner schaut nur auf das Fenster des Spiels, und kein Bild verlässt deinen PC: Nur die IDs der Karten erreichen die Website.",
        ],
        discord: "Hängst du immer noch? Frag uns auf Discord",
      },
    },
    winrate: {
      title: "Win-Rates auf der Website",
      text: "Die Matches, die mit verknüpfter App erfasst werden, ergeben die anonymen Win-Rates der Website: Legendäre, Community-Decks, Archetypen, Karten und Matchups, Patch für Patch. Nur Summen, nie, wer gespielt hat.",
      link: "Win-Rates ansehen",
    },
    privacy: {
      title: "Deine Daten",
      text: "Die App liest nur die Dateien und das Fenster des Spiels, und kein Bild verlässt deinen PC. Sie funktioniert nur mit deinem OriginsMeta-Konto verknüpft: Nur Matchdaten und Kennungen der Karten erreichen die Website, nie Namen von Spielern. Du kannst sie trennen und in deinem Konto alles löschen.",
      link: "Datenschutzerklärung",
    },
    koin: {
      unofficial: "OriginsMeta ist eine inoffizielle Fanseite und nicht mit Koin Games verbunden.",
    },
    interest: {
      question: "Interesse am Tool?",
      button: "Ja, ich will es",
      sending: "Einen Moment …",
      done: "Danke! Du wurdest gezählt.",
      already: "Du bist schon gezählt: danke!",
      countOne: "Bisher will es 1 Spieler.",
      countMany: "Bisher wollen es {n} Spieler.",
      error: "Deine Antwort konnte nicht gespeichert werden. Versuch es noch einmal.",
      rateLimited: "Viele Antworten auf einmal: Versuch es in einer Minute noch einmal.",
      unavailable: "Das Zählen ist noch nicht aktiv: Versuch es später noch einmal.",
      note: "Wir zählen einmal pro Browser und, wenn du angemeldet bist, einmal pro Konto. Keine E-Mail, keine anderen Daten.",
      privacyLink: "Details in der Datenschutzerklärung",
    },
  },
  ru: {
    meta: {
      title: "OriginsMeta Tracker: трекер партий для Origins TCG",
      description: "Скачайте OriginsMeta Tracker для Windows: он записывает партии в Origins TCG, показывает колоду вживую и даёт оверлей для OBS. Пошаговая установка.",
    },
    kicker: "Наше приложение",
    h1: "OriginsMeta Tracker",
    lead: "Приложение для Windows, которое само записывает ваши партии в Origins TCG, пока вы играете: результат, колоду, карты, сыгранные вами и соперником, Легендарную карту, против которой вы играли. Оно показывает вашу колоду вживую рядом с игрой, даёт оверлей для стримеров и, в связке с вашим аккаунтом, добавляет ваши партии в винрейты сайта.",
    download: {
      button: "Скачать OriginsMeta Tracker",
      note: "Для Windows 10 и 11 (64 бит) · zip-файл с GitHub",
      guide: "Как установить",
      signIn: "Войдите, чтобы скачать",
      account: "Приложение работает только с аккаунтом OriginsMeta, он бесплатный: войдите, чтобы скачать приложение, а затем привяжите его к аккаунту.",
    },
    what: {
      title: "Что оно делает",
      items: [
        "Само записывает каждую партию через 15 секунд после её окончания: результат, колоду, раунды. Оно никогда не вмешивается в игру: читает файлы, которые Origins TCG сохраняет на вашем ПК, и смотрит только на окно игры.",
        "Читает карты с экрана: карты, сыгранные вами и соперником, раунд за раундом, и Легендарную карту соперника на стартовом экране.",
        "Deck tracker: панель рядом с игрой с колодой, выбранной в игре, которая обновляется вживую: копии, которые вы сыграли, и карты, раскрытые соперником.",
        "Оверлей поверх игры и источник для OBS, для стримеров: колода, сессия и последняя партия.",
        "В связке с вашим аккаунтом OriginsMeta оно отправляет ваши партии на сайт: ваша статистика — в вашем аккаунте, а для всех — анонимные винрейты Легендарных карт, колод и карт.",
      ],
    },
    shots: {
      overview: {
        alt: "Окно OriginsMeta Tracker: колода, выбранная в игре, с Легендарной картой и 12 картами, записанные партии и винрейт",
        caption: "Колода, выбранная в игре, с её картами и вашими числами.",
      },
      matches: {
        alt: "Записанные партии: ваши колоды с их винрейтом, Легендарные карты соперников и каждая партия с вашей колодой в виде карт",
        caption: "Ваши колоды, Легендарные карты, против которых вы играли, и каждая партия с вашей колодой в виде карт.",
      },
      overlay: {
        alt: "Оверлей OriginsMeta Tracker: Легендарная карта колоды, сессия, результаты колоды и последняя партия",
        caption: "Оверлей поверх игры или как источник OBS.",
      },
    },
    install: {
      anchor: "ustanovka",
      title: "От скачивания до первой партии за 7 шагов",
      intro: "Около пяти минут. Чаще всего застревают на шагах 3 и 4: в блоке под каждым шагом написано, что делать.",
      needs: "Вам нужны: ПК с Windows 10 или 11 (64 бит), демо Origins TCG в Steam и бесплатный аккаунт OriginsMeta.",
      linkText: "страницу Tracker в вашем аккаунте",
      path: ["Вход", "Скачивание", "Распаковка", "Запуск", "Привязка", "Сканер", "Игра"],
      signInCta: "Войдите или создайте аккаунт",
      signedIn: "Вы вошли: переходите к шагу 2.",
      started: "Скачивание началось. Теперь распакуйте zip: шаг 3 ↓",
      stuck: "Если вы застряли здесь",
      shotAlt: "OriginsMeta Tracker при первом запуске: «Link the app to your OriginsMeta account», три шага, поле «Link code» и кнопка «Link»",
      shotCaption: "Что приложение показывает при первом запуске (версия 0.4.6, на английском).",
      steps: [
        { title: "Войдите (это бесплатно)", text: "Приложение работает только с аккаунтом OriginsMeta. Войдите через Discord или по email (мы пришлём ссылку): если аккаунта ещё нет, он создастся тут же. Затем вернитесь на эту страницу.", hint: "Входите по email? В письме есть ссылка и код: если читаете его с телефона, введите код на ПК. Письмо не пришло? Проверьте «Спам» и «Промоакции»." },
        { title: "Скачайте zip", text: "Нажмите кнопку и сохраните {file} (около 160 МБ). Файл окажется в папке «Загрузки».", hint: "Если браузер спросит, сохранить ли файл, выберите «Сохранить». Кнопка отправляет вас на вход? Сначала выполните шаг 1." },
        { title: "Распакуйте zip", text: "Откройте папку «Загрузки», щёлкните zip правой кнопкой мыши и выберите «Извлечь все…», затем «Извлечь». Откроется новая папка: в ней приложение.", hint: "Не открывайте приложение прямо из zip: оно не запустится или пожалуется на отсутствующий файл .dll. Всегда из распакованной папки." },
        { title: "Запустите приложение", text: "В распакованной папке откройте «OriginsMeta Tracker-win32-x64» и дважды щёлкните «OriginsMeta Tracker.exe» — файл со значком OriginsMeta. В первый раз Windows может показать синее предупреждение ниже.", hint: "«Неизвестный издатель» — это нормально: у приложения пока нет цифровой подписи. Нажмите «Подробнее», проверьте, что это «OriginsMeta Tracker.exe», затем «Выполнить в любом случае»." },
        { title: "Привяжите аккаунт", text: "Приложение откроется на экране «Link the app to your OriginsMeta account» (оно на английском). Откройте {link}, нажмите «Создать код», введите код в приложении и нажмите «Link».", hint: "Код действует 10 минут и срабатывает один раз: если он истёк, создайте новый. Используйте тот же аккаунт OriginsMeta, под которым вы вошли." },
        { title: "Не выключайте сканер", text: "После привязки откроется короткое обучение («Next» или «Skip»). Затем приложение сообщит «The screen scanner is on»: нажмите «Got it». Сканер читает сыгранные карты из окна игры.", hint: "Нажали «Turn it off»? Включите его снова в Setup → Screen scanner: без него партии сохраняются только с результатом и колодой." },
        { title: "Сыграйте партию", text: "Откройте Origins TCG и играйте: через несколько секунд после окончания партия появится в приложении, а затем в вашем аккаунте. Deck tracker и оверлей для OBS находятся в разделе Setup приложения.", hint: "Не видите панели поверх игры? Играйте в оконном режиме или без рамки: в эксклюзивном полноэкранном режиме Windows их скрывает." },
      ],
      smartscreen: {
        title: "Система Windows защитила ваш компьютер",
        body: "Фильтр SmartScreen в Microsoft Defender предотвратил запуск неопознанного приложения.",
        more: "Подробнее",
        app: "Приложение:",
        publisher: "Издатель:",
        unknown: "Неизвестный издатель",
        dontRun: "Не выполнять",
        run: "Выполнить в любом случае",
        first: "1 · нажмите",
        second: "2 · затем",
        caption: "Упрощённая схема предупреждения Windows: сначала «Подробнее», затем «Выполнить в любом случае».",
      },
      tips: {
        title: "Полезно знать",
        items: [
          "Крестик X в окне приложения закрывает его. Чтобы оно продолжало работать, сверните его: его значок останется рядом с часами.",
          "Обновления устанавливаются автоматически: когда скачивается новая версия, дождитесь перезапуска приложения, прежде чем открывать игру.",
          "Сканер экрана смотрит только на окно игры, и ни одно изображение не покидает ваш ПК: на сайт попадают только id карт.",
        ],
        discord: "Всё ещё не получается? Спросите нас в Discord",
      },
    },
    winrate: {
      title: "Винрейты на сайте",
      text: "Партии, записанные с привязанным приложением, складываются в анонимные винрейты сайта: Легендарные карты, колоды сообщества, архетипы, карты и матчапы, патч за патчем. Только итоги, никогда — кто играл.",
      link: "Смотреть винрейты",
    },
    privacy: {
      title: "Ваши данные",
      text: "Приложение читает только файлы и окно игры, и ни одно изображение не покидает ваш ПК. Оно работает только в связке с вашим аккаунтом OriginsMeta: на сайт попадают только данные партий и идентификаторы карт, никогда имена игроков. Вы можете отвязать его и удалить всё в своём аккаунте.",
      link: "Политика конфиденциальности",
    },
    koin: {
      unofficial: "OriginsMeta — неофициальный фан-сайт, не связанный с Koin Games.",
    },
    interest: {
      question: "Вам интересен этот инструмент?",
      button: "Да, хочу",
      sending: "Секунду…",
      done: "Спасибо! Ваш голос учтён.",
      already: "Ваш голос уже учтён: спасибо!",
      countOne: "Пока его хочет 1 игрок.",
      countMany: "Пока его хотят игроков: {n}.",
      error: "Не удалось сохранить ваш ответ. Попробуйте ещё раз.",
      rateLimited: "Слишком много ответов сразу: попробуйте через минуту.",
      unavailable: "Подсчёт пока не включён: попробуйте позже.",
      note: "Мы считаем один раз на браузер и, если вы вошли, один раз на аккаунт. Без email и других данных.",
      privacyLink: "Подробности в политике конфиденциальности",
    },
  },
};

/** L'indirizzo della guida all'installazione nella lingua (/it/tracker#installazione), per /account, /account/tracker e la
 * pagina delle statistiche. */
export function trackerInstallHref(locale: Locale): string {
  return `/${locale}/tracker#${analyticsLabels[locale].install.anchor}`;
}

/** Il numero di interessati in una frase (singolare per 1). */
export function interestCount(l: AnalyticsLabels["interest"], n: number): string {
  return n === 1 ? l.countOne : l.countMany.replace("{n}", String(n));
}

/**
 * Paragrafo dell'informativa (/privacy, ancora #analytics-interest): che cosa si salva quando si preme "Sì, mi
 * interessa" sulla pagina /analytics, perché e come si cancella.
 */
export const analyticsInterestPrivacy: Record<Locale, string> = {
  en: "Interest in OriginsMeta Tracker (/analytics): when you press “Yes, I want it”, the site saves a random number that your browser keeps so you aren't counted twice, the page language, which of the two buttons you pressed, the date and, if you're signed in, your account (so you're counted only once from other devices too). No email and no IP address. We use it only to know how many people want the tool and to show the total to Koin Games. It is stored on Supabase (Ireland, EU); to have it deleted, write to staff@originsmeta.com; if you delete your account, the row linked to it is deleted too.",
  it: "Interesse per OriginsMeta Tracker (/analytics): quando premi «Sì, mi interessa», il sito salva un numero a caso che il tuo browser tiene per non contarti due volte, la lingua della pagina, quale dei due tasti hai premuto, la data e, se hai fatto l'accesso, il tuo account (per contarti una volta sola anche da altri dispositivi). Niente email né indirizzo IP. Lo usiamo solo per sapere quante persone vogliono il tool e per mostrarne il totale a Koin Games. Si salva su Supabase (Irlanda, UE); per farlo cancellare scrivi a staff@originsmeta.com; se cancelli l'account, la riga legata all'account si cancella con lui.",
  es: "Interés en OriginsMeta Tracker (/analytics): cuando pulsas «Sí, la quiero», el sitio guarda un número al azar que tu navegador conserva para no contarte dos veces, el idioma de la página, cuál de los dos botones pulsaste, la fecha y, si iniciaste sesión, tu cuenta (para contarte una sola vez también desde otros dispositivos). Ni email ni dirección IP. Lo usamos solo para saber cuántas personas quieren la herramienta y para mostrar el total a Koin Games. Se guarda en Supabase (Irlanda, UE); para que lo borremos, escribe a staff@originsmeta.com; si borras tu cuenta, la fila vinculada a ella se borra también.",
  fr: "Intérêt pour OriginsMeta Tracker (/analytics) : quand vous appuyez sur « Oui, je le veux », le site enregistre un nombre aléatoire que votre navigateur conserve pour ne pas vous compter deux fois, la langue de la page, lequel des deux boutons vous avez pressé, la date et, si votre session est ouverte, votre compte (pour ne vous compter qu'une fois, même depuis d'autres appareils). Ni e-mail ni adresse IP. Nous l'utilisons uniquement pour savoir combien de personnes veulent l'outil et pour en montrer le total à Koin Games. Il est stocké sur Supabase (Irlande, UE) ; pour le faire supprimer, écrivez à staff@originsmeta.com ; si vous supprimez votre compte, la ligne liée au compte est supprimée aussi.",
  pt: "Interesse no OriginsMeta Tracker (/analytics): quando você aperta “Sim, eu quero”, o site salva um número aleatório que o seu navegador guarda para não contar você duas vezes, o idioma da página, qual dos dois botões você apertou, a data e, se você tiver entrado, a sua conta (para contar você uma vez só, também de outros dispositivos). Nenhum e-mail e nenhum endereço IP. Usamos isso só para saber quantas pessoas querem a ferramenta e para mostrar o total à Koin Games. Fica salvo no Supabase (Irlanda, UE); para apagar, escreva para staff@originsmeta.com; se você excluir a sua conta, a linha ligada a ela também é apagada.",
  de: "Interesse an OriginsMeta Tracker (/analytics): Wenn du auf „Ja, ich will es“ drückst, speichert die Website eine Zufallszahl, die dein Browser aufbewahrt, damit du nicht doppelt gezählt wirst, die Sprache der Seite, welche der beiden Schaltflächen du gedrückt hast, das Datum und, wenn du angemeldet bist, dein Konto (damit du auch von anderen Geräten aus nur einmal gezählt wirst). Keine E-Mail und keine IP-Adresse. Wir verwenden das nur, um zu wissen, wie viele Leute das Tool wollen, und um Koin Games die Gesamtzahl zu zeigen. Gespeichert wird es bei Supabase (Irland, EU); wenn du es löschen lassen möchtest, schreib an staff@originsmeta.com; wenn du dein Konto löschst, wird die damit verknüpfte Zeile ebenfalls gelöscht.",
  ru: "Интерес к OriginsMeta Tracker (/analytics): когда вы нажимаете «Да, хочу», сайт сохраняет случайное число, которое хранит ваш браузер, чтобы не учитывать вас дважды, язык страницы, какую из двух кнопок вы нажали, дату и, если вы вошли, ваш аккаунт (чтобы учитывать вас один раз и с других устройств). Без email и без IP-адреса. Мы используем это только для того, чтобы знать, сколько людей хотят этот инструмент, и показать итог Koin Games. Данные хранятся в Supabase (Ирландия, ЕС); чтобы их удалили, напишите на staff@originsmeta.com; если вы удалите аккаунт, связанная с ним строка тоже удаляется.",
};
