import type { Locale } from "./i18n";

/**
 * Testi della pagina /analytics, la pagina dell'app OriginsMeta Analytics. Un modulo solo nelle quattro lingue,
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

/** Lo zip dell'app su GitHub Releases: l'ultima versione pubblicata, sempre allo stesso indirizzo (unico posto). */
export const TRACKER_DOWNLOAD_URL = "https://github.com/ultimacenere/originsmeta/releases/latest/download/OriginsMeta-Analytics-win-x64.zip";
/** Il nome del file che il browser scarica, citato nel passo 2 della guida. */
export const TRACKER_DOWNLOAD_FILE = "OriginsMeta-Analytics-win-x64.zip";

/** Un passo della guida all'installazione: `{link}` (passo 6) diventa il link a /account/tracker, `{file}` il nome dello zip. */
type Step = { title: string; text: string };

const en = {
  meta: {
    /** titolo della SERP: contiene OriginsMeta, quindi `pageTitle` lo lascia com'è (entro 60 caratteri, test) */
    title: "OriginsMeta Analytics: the match tracker for Origins TCG",
    description: "Download OriginsMeta Analytics for Windows: it records your Origins TCG matches, tracks your deck live and adds an OBS overlay. Step-by-step install guide.",
  },
  kicker: "Our app",
  h1: "OriginsMeta Analytics",
  lead: "A Windows app that records your Origins TCG matches on its own while you play: result, deck, the cards played by you and by your opponent, the Legendary you faced. It shows your deck live next to the game, adds an overlay for streamers and, linked to your account, brings your matches to the site's win rates.",
  download: {
    button: "Download OriginsMeta Analytics",
    note: "For Windows 10 and 11 (64-bit) · zip file from GitHub",
    guide: "How to install it",
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
      alt: "The OriginsMeta Analytics window: the deck selected in the game with its Legendary and 12 cards, recorded matches and win rate",
      caption: "The deck selected in the game, with its cards, and your numbers.",
    },
    matches: {
      alt: "Recorded matches: your decks with their win rate, opposing Legendaries and every match with your deck as cards",
      caption: "Your decks, the Legendaries you faced and every match with your deck as cards.",
    },
    overlay: {
      alt: "The OriginsMeta Analytics overlay: the deck's Legendary, the session, the deck's record and the last match",
      caption: "The overlay, above the game or as an OBS source.",
    },
  },
  install: {
    /** ancora della guida (/en/analytics#install): i link di /account e /account/tracker ci portano */
    anchor: "install",
    title: "Install it step by step",
    intro: "Nine steps, from the download to your first recorded match.",
    /** testo del link del passo 6, verso /account/tracker */
    linkText: "the Analytics page of your account",
    steps: [
      { title: "What you need", text: "A PC with Windows 10 or 11 (64-bit) and the Origins TCG demo, installed from Steam." },
      { title: "Download the zip", text: "Press the button below: your browser downloads the file {file}, usually into the Downloads folder." },
      {
        title: "Extract it",
        text: "Right-click the zip → “Extract All…”, choose a folder (for example Documents) and press “Extract”. Don't open the app from inside the zip: extract it first.",
      },
      {
        title: "Open the app",
        text: "In the extracted folder, double-click “OriginsMeta Analytics.exe”. The app isn't signed yet, so Windows may show “Windows protected your PC”: click “More info”, then “Run anyway”.",
      },
      {
        title: "It stays next to the clock",
        text: "The app opens and also stays in its icon next to the clock (the notification area). The screen scanner is on: it captures only the game's window, never other windows, and no image leaves your PC. You can switch it off in the app.",
      },
      {
        title: "Link your account",
        text: "Signed in to OriginsMeta, open {link} and press “Create a code”. In the app, open “OriginsMeta account”, paste the code and press “Link”. From then on your matches reach your account and also the site's anonymous stats. It's optional: without an account the app works on your PC alone.",
      },
      {
        title: "Play",
        text: "Matches are recorded on their own, 15 seconds after the end. Switch on the Deck tracker and the overlay from the app's “Overlay” box; for OBS, copy the address shown in the same box and add it as a Browser source.",
      },
      {
        title: "Windowed or borderless",
        text: "To see the Deck tracker and the overlay above the game, play in windowed or borderless mode: in exclusive fullscreen Windows doesn't show them. Or keep them on a second screen.",
      },
      { title: "Closing the app", text: "The X of the window closes everything, the overlay and the Deck tracker too. To use it again, open “OriginsMeta Analytics.exe”." },
    ] as Step[],
  },
  winrate: {
    title: "Win rates on the site",
    text: "The matches recorded with the app linked make up the site's anonymous win rates: Legendaries, community decks, archetypes, cards and matchups, patch by patch. Only totals, never who played.",
    link: "See the win rates",
  },
  privacy: {
    title: "Your data",
    text: "The app reads only the game's files and window, and no image leaves your PC. Your matches stay on your PC until you link the app; then only match data and card identifiers reach the site, never names of players. You can unlink it and delete everything from your account.",
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
      title: "OriginsMeta Analytics: il tracker di partite per Origins TCG",
      description: "Scarica OriginsMeta Analytics per Windows: registra le tue partite di Origins TCG, segue il mazzo dal vivo e ha l'overlay per OBS. Guida passo per passo.",
    },
    kicker: "La nostra app",
    h1: "OriginsMeta Analytics",
    lead: "Un'app per Windows che registra da sola le tue partite di Origins TCG mentre giochi: esito, mazzo, le carte giocate da te e dall'avversario, la Leggendaria che avevi di fronte. Ti mostra il mazzo dal vivo accanto al gioco, ha l'overlay per chi fa dirette e, collegata al tuo account, porta le tue partite nei win rate del sito.",
    download: {
      button: "Scarica OriginsMeta Analytics",
      note: "Per Windows 10 e 11 a 64 bit · file zip da GitHub",
      guide: "Come installarla",
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
        alt: "La finestra di OriginsMeta Analytics: il mazzo scelto nel gioco con la sua Leggendaria e le 12 carte, le partite registrate e il win rate",
        caption: "Il mazzo scelto nel gioco, con le sue carte, e i tuoi numeri.",
      },
      matches: {
        alt: "Le partite registrate: i tuoi mazzi con il win rate, le Leggendarie avversarie e ogni partita con il mazzo in carte",
        caption: "I tuoi mazzi, le Leggendarie che hai incontrato e ogni partita con il tuo mazzo in carte.",
      },
      overlay: {
        alt: "L'overlay di OriginsMeta Analytics: la Leggendaria del mazzo, la sessione, il record del mazzo e l'ultima partita",
        caption: "L'overlay, sopra il gioco o come sorgente per OBS.",
      },
    },
    install: {
      anchor: "installazione",
      title: "Installarla passo per passo",
      intro: "Nove passi, dal download alla prima partita registrata.",
      linkText: "la pagina Analytics del tuo account",
      steps: [
        { title: "Cosa serve", text: "Un PC con Windows 10 o 11 a 64 bit e la demo di Origins TCG, installata da Steam." },
        { title: "Scarica lo zip", text: "Premi il tasto qui sotto: il browser scarica il file {file}, di solito nella cartella Download." },
        {
          title: "Estrai i file",
          text: "Tasto destro sullo zip → «Estrai tutto…», scegli una cartella (per esempio Documenti) e premi «Estrai». Non aprire l'app da dentro lo zip: prima estraila.",
        },
        {
          title: "Apri l'app",
          text: "Nella cartella estratta fai doppio clic su «OriginsMeta Analytics.exe». L'app non è ancora firmata, quindi Windows può mostrare «Windows ha protetto il PC»: fai clic su «Ulteriori informazioni» e poi su «Esegui comunque».",
        },
        {
          title: "Resta vicino all'orologio",
          text: "L'app si apre e resta anche nella sua icona vicino all'orologio (l'area di notifica). Lo scanner dello schermo è acceso: riprende solo la finestra del gioco, mai altre finestre, e nessuna immagine esce dal tuo PC. Puoi spegnerlo dall'app.",
        },
        {
          title: "Collega l'account",
          text: "Con l'accesso fatto su OriginsMeta, apri {link} e premi «Crea un codice». Nell'app apri «Account OriginsMeta», incolla il codice e premi «Collega». Da lì le partite arrivano al tuo account ed entrano anche nelle statistiche anonime del sito. È facoltativo: senza account l'app funziona anche solo sul tuo PC.",
        },
        {
          title: "Gioca",
          text: "Le partite si registrano da sole, 15 secondi dopo la fine. Deck tracker e overlay si accendono dal riquadro «Overlay» dell'app; per OBS copia l'indirizzo dallo stesso riquadro e aggiungilo come sorgente Browser.",
        },
        {
          title: "Finestra o senza bordi",
          text: "Per vedere Deck tracker e overlay sopra il gioco usa la modalità finestra o finestra senza bordi: a schermo intero esclusivo Windows non li mostra. Oppure tienili su un secondo schermo.",
        },
        { title: "Chiudere l'app", text: "La X della finestra chiude tutto, anche overlay e Deck tracker. Per riaprirla, apri di nuovo «OriginsMeta Analytics.exe»." },
      ],
    },
    winrate: {
      title: "I win rate sul sito",
      text: "Le partite registrate con l'app collegata formano i win rate anonimi del sito: Leggendarie, mazzi della community, archetipi, carte e scontri, patch per patch. Solo totali, mai chi ha giocato.",
      link: "Guarda i win rate",
    },
    privacy: {
      title: "I tuoi dati",
      text: "L'app legge solo i file e la finestra del gioco, e nessuna immagine esce dal tuo PC. Le partite restano sul PC finché non colleghi l'app; da lì al sito arrivano solo i dati delle partite e gli identificativi delle carte, mai nomi di giocatori. Puoi scollegarla e cancellare tutto dal tuo account.",
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
      title: "OriginsMeta Analytics: tracker de partidas de Origins TCG",
      description: "Descarga OriginsMeta Analytics para Windows: registra tus partidas de Origins TCG, sigue tu mazo en directo y añade un overlay para OBS. Guía paso a paso.",
    },
    kicker: "Nuestra app",
    h1: "OriginsMeta Analytics",
    lead: "Una app para Windows que registra sola tus partidas de Origins TCG mientras juegas: resultado, mazo, las cartas que jugaron tú y tu rival, la Legendaria que tenías enfrente. Te muestra tu mazo en directo junto al juego, añade un overlay para quien hace directos y, vinculada a tu cuenta, lleva tus partidas al win rate del sitio.",
    download: {
      button: "Descarga OriginsMeta Analytics",
      note: "Para Windows 10 y 11 de 64 bits · archivo zip de GitHub",
      guide: "Cómo instalarla",
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
        alt: "La ventana de OriginsMeta Analytics: el mazo elegido en el juego con su Legendaria y sus 12 cartas, las partidas registradas y el win rate",
        caption: "El mazo elegido en el juego, con sus cartas, y tus números.",
      },
      matches: {
        alt: "Las partidas registradas: tus mazos con su win rate, las Legendarias rivales y cada partida con tu mazo en cartas",
        caption: "Tus mazos, las Legendarias que enfrentaste y cada partida con tu mazo en cartas.",
      },
      overlay: {
        alt: "El overlay de OriginsMeta Analytics: la Legendaria del mazo, la sesión, el récord del mazo y la última partida",
        caption: "El overlay, sobre el juego o como fuente para OBS.",
      },
    },
    install: {
      anchor: "instalacion",
      title: "Instálala paso a paso",
      intro: "Nueve pasos, de la descarga a tu primera partida registrada.",
      linkText: "la página Analytics de tu cuenta",
      steps: [
        { title: "Qué necesitas", text: "Un PC con Windows 10 u 11 de 64 bits y la demo de Origins TCG, instalada desde Steam." },
        { title: "Descarga el zip", text: "Pulsa el botón de abajo: el navegador descarga el archivo {file}, normalmente en la carpeta Descargas." },
        {
          title: "Extrae los archivos",
          text: "Clic derecho en el zip → «Extraer todo…», elige una carpeta (por ejemplo Documentos) y pulsa «Extraer». No abras la app desde dentro del zip: extráela primero.",
        },
        {
          title: "Abre la app",
          text: "En la carpeta extraída, haz doble clic en «OriginsMeta Analytics.exe». La app todavía no está firmada, así que Windows puede mostrar «Windows protegió su PC»: haz clic en «Más información» y luego en «Ejecutar de todas formas».",
        },
        {
          title: "Se queda junto al reloj",
          text: "La app se abre y también se queda en su icono junto al reloj (el área de notificación). El escáner de pantalla está activado: captura solo la ventana del juego, nunca otras ventanas, y ninguna imagen sale de tu PC. Puedes desactivarlo desde la app.",
        },
        {
          title: "Vincula tu cuenta",
          text: "Con la sesión iniciada en OriginsMeta, abre {link} y pulsa «Crear un código». En la app, abre «Cuenta de OriginsMeta», pega el código y pulsa «Vincular». Desde entonces tus partidas llegan a tu cuenta y entran también en las estadísticas anónimas del sitio. Es opcional: sin cuenta, la app también funciona solo en tu PC.",
        },
        {
          title: "Juega",
          text: "Las partidas se registran solas, 15 segundos después del final. El Deck tracker y el overlay se activan desde el recuadro «Overlay» de la app; para OBS, copia la dirección del mismo recuadro y añádela como fuente de Navegador.",
        },
        {
          title: "Ventana o sin bordes",
          text: "Para ver el Deck tracker y el overlay encima del juego, usa el modo ventana o ventana sin bordes: en pantalla completa exclusiva Windows no los muestra. O tenlos en una segunda pantalla.",
        },
        { title: "Cerrar la app", text: "La X de la ventana lo cierra todo, también el overlay y el Deck tracker. Para volver a usarla, abre de nuevo «OriginsMeta Analytics.exe»." },
      ],
    },
    winrate: {
      title: "El win rate en el sitio",
      text: "Las partidas registradas con la app vinculada forman el win rate anónimo del sitio: Legendarias, mazos de la comunidad, arquetipos, cartas y enfrentamientos, parche a parche. Solo totales, nunca quién jugó.",
      link: "Ver el win rate",
    },
    privacy: {
      title: "Tus datos",
      text: "La app lee solo los archivos y la ventana del juego, y ninguna imagen sale de tu PC. Tus partidas se quedan en tu PC hasta que vinculas la app; desde entonces al sitio solo llegan los datos de las partidas y los identificadores de las cartas, nunca nombres de jugadores. Puedes desvincularla y borrarlo todo desde tu cuenta.",
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
      title: "OriginsMeta Analytics : tracker de parties d'Origins TCG",
      description: "Téléchargez OriginsMeta Analytics pour Windows : vos parties d'Origins TCG enregistrées, votre deck suivi en direct et un overlay OBS. Guide pas à pas.",
    },
    kicker: "Notre application",
    h1: "OriginsMeta Analytics",
    lead: "Une application Windows qui enregistre seule vos parties d'Origins TCG pendant que vous jouez : résultat, deck, les cartes jouées par vous et par votre adversaire, la Légendaire affrontée. Elle affiche votre deck en direct à côté du jeu, ajoute un overlay pour les streamers et, associée à votre compte, envoie vos parties vers les win rates du site.",
    download: {
      button: "Télécharger OriginsMeta Analytics",
      note: "Pour Windows 10 et 11 (64 bits) · fichier zip sur GitHub",
      guide: "Comment l'installer",
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
        alt: "La fenêtre d'OriginsMeta Analytics : le deck sélectionné dans le jeu avec sa Légendaire et ses 12 cartes, les parties enregistrées et le win rate",
        caption: "Le deck sélectionné dans le jeu, avec ses cartes, et vos chiffres.",
      },
      matches: {
        alt: "Les parties enregistrées : vos decks avec leur win rate, les Légendaires adverses et chaque partie avec votre deck en cartes",
        caption: "Vos decks, les Légendaires affrontées et chaque partie avec votre deck en cartes.",
      },
      overlay: {
        alt: "L'overlay d'OriginsMeta Analytics : la Légendaire du deck, la session, le bilan du deck et la dernière partie",
        caption: "L'overlay, au-dessus du jeu ou comme source OBS.",
      },
    },
    install: {
      anchor: "installation",
      title: "L'installer pas à pas",
      intro: "Neuf étapes, du téléchargement à votre première partie enregistrée.",
      linkText: "la page Analytics de votre compte",
      steps: [
        { title: "Ce qu'il vous faut", text: "Un PC sous Windows 10 ou 11 (64 bits) et la démo d'Origins TCG, installée depuis Steam." },
        { title: "Téléchargez le zip", text: "Appuyez sur le bouton ci-dessous : votre navigateur télécharge le fichier {file}, en général dans le dossier Téléchargements." },
        {
          title: "Extrayez les fichiers",
          text: "Clic droit sur le zip → « Extraire tout… », choisissez un dossier (par exemple Documents) et appuyez sur « Extraire ». N'ouvrez pas l'application depuis le zip : extrayez-la d'abord.",
        },
        {
          title: "Ouvrez l'application",
          text: "Dans le dossier extrait, double-cliquez sur « OriginsMeta Analytics.exe ». L'application n'est pas encore signée, donc Windows peut afficher « Windows a protégé votre ordinateur » : cliquez sur « Informations complémentaires », puis sur « Exécuter quand même ».",
        },
        {
          title: "Elle reste près de l'horloge",
          text: "L'application s'ouvre et reste aussi dans son icône près de l'horloge (la zone de notification). Pour l'instant elle est en anglais. Le scanner d'écran est activé : il capture uniquement la fenêtre du jeu, jamais d'autres fenêtres, et aucune image ne quitte votre PC. Vous pouvez le désactiver dans l'application.",
        },
        {
          title: "Associez votre compte",
          text: "Avec votre session ouverte sur OriginsMeta, ouvrez {link} et appuyez sur « Créer un code ». Dans l'application, ouvrez « OriginsMeta account », collez le code et appuyez sur « Link ». Vos parties arrivent alors sur votre compte et entrent aussi dans les statistiques anonymes du site. C'est facultatif : sans compte, l'application fonctionne aussi sur votre PC seul.",
        },
        {
          title: "Jouez",
          text: "Les parties s'enregistrent toutes seules, 15 secondes après la fin. Le Deck tracker et l'overlay s'activent depuis l'encadré « Overlay » de l'application ; pour OBS, copiez l'adresse affichée dans le même encadré et ajoutez-la comme source Navigateur.",
        },
        {
          title: "Fenêtré ou sans bordure",
          text: "Pour voir le Deck tracker et l'overlay au-dessus du jeu, jouez en mode fenêtré ou fenêtré sans bordure : en plein écran exclusif, Windows ne les affiche pas. Vous pouvez aussi les garder sur un second écran.",
        },
        { title: "Fermer l'application", text: "La croix de la fenêtre ferme tout, y compris l'overlay et le Deck tracker. Pour la réutiliser, ouvrez de nouveau « OriginsMeta Analytics.exe »." },
      ],
    },
    winrate: {
      title: "Les win rates sur le site",
      text: "Les parties enregistrées avec l'application associée forment les win rates anonymes du site : Légendaires, decks de la communauté, archétypes, cartes et matchups, patch par patch. Uniquement des totaux, jamais qui a joué.",
      link: "Voir les win rates",
    },
    privacy: {
      title: "Vos données",
      text: "L'application lit uniquement les fichiers et la fenêtre du jeu, et aucune image ne quitte votre PC. Vos parties restent sur votre PC jusqu'à ce que vous associiez l'application ; ensuite, seules les données des parties et les identifiants des cartes arrivent sur le site, jamais de noms de joueurs. Vous pouvez la dissocier et tout supprimer depuis votre compte.",
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

/** L'indirizzo della guida all'installazione nella lingua (/it/analytics#installazione), per /account e /account/tracker. */
export function analyticsInstallHref(locale: Locale): string {
  return `/${locale}/analytics#${analyticsLabels[locale].install.anchor}`;
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
  en: "Interest in OriginsMeta Analytics (/analytics): when you press “Yes, I want it”, the site saves a random number that your browser keeps so you aren't counted twice, the page language, which of the two buttons you pressed, the date and, if you're signed in, your account (so you're counted only once from other devices too). No email and no IP address. We use it only to know how many people want the tool and to show the total to Koin Games. It is stored on Supabase (Ireland, EU); to have it deleted, write to staff@originsmeta.com; if you delete your account, the row linked to it is deleted too.",
  it: "Interesse per OriginsMeta Analytics (/analytics): quando premi «Sì, mi interessa», il sito salva un numero a caso che il tuo browser tiene per non contarti due volte, la lingua della pagina, quale dei due tasti hai premuto, la data e, se hai fatto l'accesso, il tuo account (per contarti una volta sola anche da altri dispositivi). Niente email né indirizzo IP. Lo usiamo solo per sapere quante persone vogliono il tool e per mostrarne il totale a Koin Games. Si salva su Supabase (Irlanda, UE); per farlo cancellare scrivi a staff@originsmeta.com; se cancelli l'account, la riga legata all'account si cancella con lui.",
  es: "Interés en OriginsMeta Analytics (/analytics): cuando pulsas «Sí, la quiero», el sitio guarda un número al azar que tu navegador conserva para no contarte dos veces, el idioma de la página, cuál de los dos botones pulsaste, la fecha y, si iniciaste sesión, tu cuenta (para contarte una sola vez también desde otros dispositivos). Ni email ni dirección IP. Lo usamos solo para saber cuántas personas quieren la herramienta y para mostrar el total a Koin Games. Se guarda en Supabase (Irlanda, UE); para que lo borremos, escribe a staff@originsmeta.com; si borras tu cuenta, la fila vinculada a ella se borra también.",
  fr: "Intérêt pour OriginsMeta Analytics (/analytics) : quand vous appuyez sur « Oui, je le veux », le site enregistre un nombre aléatoire que votre navigateur conserve pour ne pas vous compter deux fois, la langue de la page, lequel des deux boutons vous avez pressé, la date et, si votre session est ouverte, votre compte (pour ne vous compter qu'une fois, même depuis d'autres appareils). Ni e-mail ni adresse IP. Nous l'utilisons uniquement pour savoir combien de personnes veulent l'outil et pour en montrer le total à Koin Games. Il est stocké sur Supabase (Irlande, UE) ; pour le faire supprimer, écrivez à staff@originsmeta.com ; si vous supprimez votre compte, la ligne liée au compte est supprimée aussi.",
};
