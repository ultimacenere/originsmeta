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
 * Un passo della guida all'installazione: `{file}` (passo 1) il nome dello zip, `{link}` (passo 4) il link a
 * /account/tracker. Dal 12/10/2026 cinque passi brevi al posto di nove (Pierluigi: "i testi delle istruzioni nella pagina
 * principale del dl dobbiamo rifarli completamente, renderli easy"): requisiti in una riga sopra, i problemi più comuni
 * in un riquadro sotto, le opzioni dell'app nel tasto Setup (0.4.1).
 */
type Step = { title: string; text: string };

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
    title: "Install it in 5 steps",
    intro: "A couple of minutes, from the download to your first recorded match.",
    /** requisiti, in una riga sopra i passi */
    needs: "You need: a Windows 10 or 11 PC (64-bit), the Origins TCG demo from Steam and a free OriginsMeta account.",
    /** testo del link del passo 4, verso /account/tracker */
    linkText: "the Tracker page of your account",
    steps: [
      { title: "Download it", text: "Press the button below and save the file {file}. The download needs an OriginsMeta account: if you aren't signed in, the button asks you to sign in first." },
      { title: "Extract the zip", text: "Right-click the zip and choose “Extract All…”, then “Extract”. Always open the app from the extracted folder, never from inside the zip." },
      { title: "Open the app", text: "Double-click “OriginsMeta Tracker.exe”. If Windows says “Windows protected your PC”, click “More info” and then “Run anyway”: it shows up because the app isn't signed yet." },
      { title: "Link your account", text: "The app asks for a code. Open {link}, press “Create a code”, type it in the app and press “Link”. Done: from now on it starts on its own, linked to your OriginsMeta account." },
      { title: "Play", text: "Open Origins TCG and play: every match is saved on its own a few seconds after the end. The Deck tracker, the overlay for OBS and the screen scanner are behind the app's Setup button." },
    ] as Step[],
    /** i tre problemi più comuni, sotto i passi */
    tips: {
      title: "If something doesn't work",
      items: [
        "Can't see the panels above the game? Play in windowed or borderless mode: in exclusive fullscreen Windows hides them.",
        "The app disappeared? The X on its window closes it. To keep it running, minimize it: its icon stays next to the clock.",
        "The screen scanner only looks at the game window, and no image leaves your PC. You can switch it off in Setup.",
      ],
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
      title: "Installala in 5 passi",
      intro: "Un paio di minuti, dal download alla prima partita registrata.",
      /** requisiti, in una riga sopra i passi */
      needs: "Ti servono: un PC con Windows 10 o 11 a 64 bit, la demo di Origins TCG da Steam e un account OriginsMeta gratuito.",
      /** testo del link del passo 4, verso /account/tracker */
      linkText: "la pagina Tracker del tuo account",
      steps: [
        { title: "Scaricala", text: "Premi il tasto qui sotto e salva il file {file}. Per scaricarla serve un account OriginsMeta: se non hai fatto l'accesso, il tasto te lo chiede prima." },
        { title: "Estrai lo zip", text: "Tasto destro sullo zip, «Estrai tutto…» e poi «Estrai». Apri sempre l'app dalla cartella estratta, mai da dentro lo zip." },
        { title: "Apri l'app", text: "Doppio clic su «OriginsMeta Tracker.exe». Se Windows dice «Windows ha protetto il PC», fai clic su «Ulteriori informazioni» e poi su «Esegui comunque»: compare perché l'app non è ancora firmata." },
        { title: "Collega il tuo account", text: "L'app ti chiede un codice. Apri {link}, premi «Crea un codice», scrivilo nell'app e premi «Collega». Fatto: da qui parte da sola, collegata al tuo account OriginsMeta." },
        { title: "Gioca", text: "Apri Origins TCG e gioca: ogni partita si salva da sola pochi secondi dopo la fine. Deck tracker, overlay per OBS e scanner dello schermo stanno nel tasto Setup dell'app." },
      ],
      /** i tre problemi più comuni, sotto i passi */
      tips: {
        title: "Se qualcosa non va",
        items: [
          "Non vedi i pannelli sopra il gioco? Gioca in finestra o in finestra senza bordi: a schermo intero esclusivo Windows li nasconde.",
          "L'app è sparita? La X della sua finestra la chiude. Per tenerla accesa riducila a icona: l'icona resta vicino all'orologio.",
          "Lo scanner dello schermo guarda solo la finestra del gioco e nessuna immagine esce dal tuo PC. Lo spegni da Setup.",
        ],
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
      title: "Instálala en 5 pasos",
      intro: "Un par de minutos, de la descarga a tu primera partida registrada.",
      /** requisiti, in una riga sopra i passi */
      needs: "Necesitas: un PC con Windows 10 u 11 de 64 bits, la demo de Origins TCG de Steam y una cuenta gratuita de OriginsMeta.",
      /** testo del link del passo 4, verso /account/tracker */
      linkText: "la página Tracker de tu cuenta",
      steps: [
        { title: "Descárgala", text: "Pulsa el botón de abajo y guarda el archivo {file}. Para descargarla hace falta una cuenta de OriginsMeta: si no has iniciado sesión, el botón te lo pide antes." },
        { title: "Extrae el zip", text: "Clic derecho en el zip, «Extraer todo…» y luego «Extraer». Abre siempre la app desde la carpeta extraída, nunca desde dentro del zip." },
        { title: "Abre la app", text: "Doble clic en «OriginsMeta Tracker.exe». Si Windows dice «Windows protegió su PC», haz clic en «Más información» y luego en «Ejecutar de todas formas»: aparece porque la app todavía no está firmada." },
        { title: "Vincula tu cuenta", text: "La app te pide un código. Abre {link}, pulsa «Crear un código», escríbelo en la app y pulsa «Vincular». Listo: desde aquí arranca sola, vinculada a tu cuenta de OriginsMeta." },
        { title: "Juega", text: "Abre Origins TCG y juega: cada partida se guarda sola unos segundos después del final. El Deck tracker, el overlay para OBS y el escáner de pantalla están en el botón Setup de la app." },
      ],
      /** i tre problemi più comuni, sotto i passi */
      tips: {
        title: "Si algo no funciona",
        items: [
          "¿No ves los paneles sobre el juego? Juega en modo ventana o ventana sin bordes: en pantalla completa exclusiva Windows los oculta.",
          "¿La app desapareció? La X de su ventana la cierra. Para que siga abierta, minimízala: su icono se queda junto al reloj.",
          "El escáner de pantalla solo mira la ventana del juego y ninguna imagen sale de tu PC. Lo apagas en Setup.",
        ],
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
      title: "L'installer en 5 étapes",
      intro: "Quelques minutes, du téléchargement à votre première partie enregistrée.",
      /** requisiti, in una riga sopra i passi */
      needs: "Il vous faut : un PC sous Windows 10 ou 11 (64 bits), la démo d'Origins TCG depuis Steam et un compte OriginsMeta gratuit.",
      /** testo del link del passo 4, verso /account/tracker */
      linkText: "la page Tracker de votre compte",
      steps: [
        { title: "Téléchargez-la", text: "Appuyez sur le bouton ci-dessous et enregistrez le fichier {file}. Le téléchargement demande un compte OriginsMeta : sans session ouverte, le bouton vous fait d'abord vous connecter." },
        { title: "Extrayez le zip", text: "Clic droit sur le zip, « Extraire tout… » puis « Extraire ». Ouvrez toujours l'application depuis le dossier extrait, jamais depuis le zip." },
        { title: "Ouvrez l'application", text: "Double-cliquez sur « OriginsMeta Tracker.exe ». Si Windows affiche « Windows a protégé votre ordinateur », cliquez sur « Informations complémentaires » puis sur « Exécuter quand même » : ce message apparaît parce que l'application n'est pas encore signée." },
        { title: "Associez votre compte", text: "L'application vous demande un code. Ouvrez {link}, appuyez sur « Créer un code », saisissez-le dans l'application et appuyez sur « Link » (l'application est en anglais). C'est fait : elle démarre désormais toute seule, associée à votre compte OriginsMeta." },
        { title: "Jouez", text: "Ouvrez Origins TCG et jouez : chaque partie s'enregistre toute seule quelques secondes après la fin. Le Deck tracker, l'overlay pour OBS et le scanner d'écran se trouvent derrière le bouton Setup de l'application." },
      ],
      /** i tre problemi più comuni, sotto i passi */
      tips: {
        title: "Si quelque chose ne marche pas",
        items: [
          "Vous ne voyez pas les panneaux au-dessus du jeu ? Jouez en mode fenêtré ou fenêtré sans bordure : en plein écran exclusif, Windows les masque.",
          "L'application a disparu ? La croix de sa fenêtre la ferme. Pour la garder ouverte, réduisez-la : son icône reste près de l'horloge.",
          "Le scanner d'écran regarde uniquement la fenêtre du jeu et aucune image ne quitte votre PC. Vous le désactivez dans Setup.",
        ],
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
};
