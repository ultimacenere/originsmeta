import type { Locale } from "./i18n";
import { ANALYTICS_PUBLIC } from "./community/badges";

/**
 * Il riquadro "OriginsMeta Tracker" di /account a tutti: segue `ANALYTICS_PUBLIC` di badges.ts, l'interruttore unico
 * dell'apertura (spento: in prova dal 10/10/2026, Pierluigi: "visibile solo ai creators e top players"). Finché è spento
 * il riquadro, con il link al download, lo vedono solo Creator, Autore, Pro, Staff e admin (`canSeeAnalytics`).
 */
export const TRACKER_ACCOUNT_LINK_PUBLIC = ANALYTICS_PUBLIC;

/**
 * Testi del tracker sul sito (tracker/overlay, Fase 3, 30/09/2026): la pagina privata /account/tracker, il riquadro in
 * /account e il paragrafo dell'informativa (/privacy#tracker). Un modulo solo, nelle tre lingue insieme, come
 * `deckStatsLabels.ts`: l'inglese è il tipo di riferimento. Spagnolo neutro col tú (docs/spagnolo.md: ronda, rival,
 * clasificatoria). Segnaposto fra graffe, riempiti da `fillTracker`.
 *
 * Regole del tracker nei testi: mai una parola su bot o persone, mai il rank dell'avversario; la coda (classificata o
 * normale) non si mostra partita per partita. Il consenso alle statistiche anonime non ha caselle (decisione di
 * Pierluigi del 30/09/2026): chi collega l'app ci entra sempre, e i testi lo dicono prima del collegamento.
 */
const en = {
  meta: {
    title: "OriginsMeta Tracker",
    description: "Link the OriginsMeta Tracker app to your account, see the matches it recorded and your stats, unlink your PCs and delete your data.",
  },
  back: "Account",
  kicker: "Tracker",
  h1: "OriginsMeta Tracker",
  intro:
    "The Windows app that records your Origins TCG matches on its own: result, deck, cards played round by round. Here you link the app to your account and see your stats.",
  /** al posto del vecchio testo "in prova" (10/10/2026): verso la guida all'installazione di /tracker */
  install: "Don't have the app yet?",
  installLink: "Download it and follow the installation guide",
  unavailable: "OriginsMeta Tracker isn't available yet. Please try again later.",
  link: {
    title: "Link a PC",
    steps: [
      "Create a code below: it's valid for 10 minutes and works once.",
      "Open the app: it asks for the code. Type it and press “Link”.",
      "From then on the app sends your matches to your account, including the ones it had already recorded.",
    ],
    consent:
      "When you link the app, your matches always go into the site's anonymous stats too (win rates of Legendaries, decks and cards): only aggregate numbers, never who played. If you don't want that, don't use the app: it works only linked to your account.",
    consentLink: "Details in the privacy policy",
    create: "Create a code",
    creating: "Creating…",
    yourCode: "Your code",
    /** {time} = ora di scadenza */
    expires: "Valid until {time}, once.",
    expired: "This code has expired: create a new one.",
    copy: "Copy",
    copied: "Copied",
    errors: {
      too_many_codes: "You've created too many codes in the last hour: try again in a while.",
      unavailable: "Linking isn't available yet. Please try again later.",
      not_authenticated: "Sign in again to create a code.",
      error: "Couldn't create the code. Please try again.",
    },
  },
  twitch: {
    title: "Twitch extension",
    intro: "With the OriginsMeta Deck tracker extension, your viewers open your deck on top of the stream and read the cards live: your list with the copies left, and the opponent's Legendary and revealed cards.",
    steps: [
      "Install the “OriginsMeta Deck tracker” extension on your channel and activate it as an overlay.",
      "Create a code below: it's valid for 10 minutes and works once.",
      "In the extension's configuration page on Twitch, type the code and press “Link”.",
      "Play with OriginsMeta Tracker on: during the match the app sends the site what the Deck tracker shows, and the extension shows it to your viewers.",
    ],
    privacy: "Only what you already show on stream with the Deck tracker goes to your viewers: your deck, the round, the opponent's Legendary and the cards they reveal. Never names, ranks or match identifiers.",
    privacyLink: "Details in the privacy policy",
    create: "Create a code for Twitch",
    creating: "Creating…",
    yourCode: "Your code for Twitch",
    /** {time} = ora di scadenza */
    expires: "Valid until {time}, once.",
    expired: "This code has expired: create a new one.",
    copy: "Copy",
    copied: "Copied",
    errors: {
      too_many_codes: "You've created too many codes in the last hour: try again in a while.",
      unavailable: "The Twitch extension isn't available yet. Please try again later.",
      not_authenticated: "Sign in again to create a code.",
      error: "Couldn't create the code. Please try again.",
    },
    /** {id} = id del canale Twitch; seguito da data e ora */
    linked: "Linked Twitch channel (id {id}) since",
    none: "No Twitch channel linked.",
    unlink: "Unlink the channel",
    confirm: "Unlink the Twitch channel? The extension will stop showing your deck.",
    done: "Twitch channel unlinked.",
    error: "Couldn't unlink the channel. Please try again.",
  },
  devices: {
    title: "Linked PCs",
    empty: "No PC linked.",
    /** seguito da data e ora */
    linked: "linked on",
    /** seguito da data e ora */
    lastSync: "last sync",
    never: "no sync yet",
    unlink: "Unlink",
    confirm: "Unlink this PC? The app stops sending matches until you link it again with a new code.",
    done: "PC unlinked.",
    error: "Couldn't unlink the PC. Please try again.",
  },
  stats: {
    title: "Your matches",
    empty: "No match has arrived yet: play with the app linked and they show up here.",
    games: "Matches",
    record: "Wins–losses",
    winRate: "Win rate",
    last: "Last match",
    /** {n} */
    unknown: "{n} matches without a certain result, left out of the count.",
    decksTitle: "Your decks",
    decksNote: "One row per exact list (the same 13 cards); matches without a replay are grouped by Legendary.",
    deck: "Deck",
    opponentsTitle: "Against the Legendaries",
    opponentsNote: "Your result against each opponent's Legendary.",
    legendary: "Legendary",
    matches: "Matches",
    wl: "W–L",
    recentTitle: "Latest matches",
    when: "When",
    result: "Result",
    opponent: "Opponent",
    rounds: "Rounds",
    win: "W",
    loss: "L",
    winLong: "win",
    lossLong: "loss",
    unknownResult: "?",
    /** {patch} */
    patch: "patch {patch}",
    unknownDeck: "Unknown deck",
    note: "Only you can see these numbers. The site's public stats use only anonymous totals, without names or accounts.",
  },
  data: {
    title: "Your data",
    body:
      "The site keeps the matches that arrived from the app and the linked PCs. You can delete all your matches whenever you want: they also leave the anonymous stats at once. Your PCs stay linked: unlink them above.",
    forget: "Delete all my matches",
    confirm: "Delete all the matches that arrived from the app? This can't be undone.",
    /** {n} */
    done: "Matches deleted: {n}.",
    error: "Couldn't delete the matches. Please try again.",
    privacy: "Privacy policy: OriginsMeta Tracker",
  },
  account: {
    title: "OriginsMeta Tracker",
    intro: "The Windows app that records your Origins TCG matches: link it to your account, see your stats, manage your PCs and data.",
    open: "Open OriginsMeta Tracker",
    download: "Download the app",
  },
};

export type TrackerLabels = typeof en;

export const trackerLabels: Record<Locale, TrackerLabels> = {
  en,
  it: {
    meta: {
      title: "OriginsMeta Tracker",
      description: "Collega l'app OriginsMeta Tracker al tuo account, guarda le partite registrate e le tue statistiche, scollega i PC e cancella i tuoi dati.",
    },
    back: "Account",
    kicker: "Tracker",
    h1: "OriginsMeta Tracker",
    intro:
      "L'app per Windows che registra da sola le tue partite di Origins TCG: esito, mazzo, carte giocate round per round. Qui colleghi l'app al tuo account e vedi le tue statistiche.",
    install: "Non hai ancora l'app?",
    installLink: "Scaricala e segui la guida all'installazione",
    unavailable: "OriginsMeta Tracker non è ancora disponibile. Riprova più tardi.",
    link: {
      title: "Collega un PC",
      steps: [
        "Crea un codice qui sotto: vale 10 minuti e si usa una volta.",
        "Apri l'app: ti chiede il codice. Scrivilo e premi “Collega”.",
        "Da lì in poi l'app manda le partite al tuo account, anche quelle che aveva già registrato.",
      ],
      consent:
        "Collegando l'app, le tue partite entrano sempre anche nelle statistiche anonime del sito (win rate di Leggendarie, mazzi e carte): solo numeri aggregati, mai chi ha giocato. Se non vuoi, non usare l'app: funziona solo collegata al tuo account.",
      consentLink: "Dettagli nell'informativa privacy",
      create: "Crea un codice",
      creating: "Creo il codice…",
      yourCode: "Il tuo codice",
      expires: "Vale fino alle {time}, una volta.",
      expired: "Questo codice è scaduto: creane uno nuovo.",
      copy: "Copia",
      copied: "Copiato",
      errors: {
        too_many_codes: "Hai creato troppi codici nell'ultima ora: riprova fra un po'.",
        unavailable: "Il collegamento non è ancora disponibile. Riprova più tardi.",
        not_authenticated: "Accedi di nuovo per creare un codice.",
        error: "Non è stato possibile creare il codice. Riprova.",
      },
    },
    twitch: {
      title: "Estensione Twitch",
      intro: "Con l'estensione OriginsMeta Deck tracker chi guarda la tua diretta apre il tuo mazzo sopra il video e legge le carte dal vivo: la tua lista con le copie rimaste, la Leggendaria e le carte rivelate dall'avversario.",
      steps: [
        "Installa l'estensione “OriginsMeta Deck tracker” sul tuo canale e attivala come overlay.",
        "Crea un codice qui sotto: vale 10 minuti e si usa una volta.",
        "Nella pagina di configurazione dell'estensione su Twitch scrivi il codice e premi “Collega”.",
        "Gioca con OriginsMeta Tracker acceso: durante la partita l'app manda al sito quello che mostra il Deck tracker e l'estensione lo mostra a chi guarda.",
      ],
      privacy: "A chi guarda arriva solo quello che mostri già in diretta con il Deck tracker: il tuo mazzo, il round, la Leggendaria dell'avversario e le carte che rivela. Mai nomi, rank o identificativi delle partite.",
      privacyLink: "Dettagli nell'informativa privacy",
      create: "Crea un codice per Twitch",
      creating: "Creo il codice…",
      yourCode: "Il tuo codice per Twitch",
      /** {time} = ora di scadenza */
      expires: "Vale fino alle {time}, una volta.",
      expired: "Il codice è scaduto: creane uno nuovo.",
      copy: "Copia",
      copied: "Copiato",
      errors: {
        too_many_codes: "Hai creato troppi codici nell'ultima ora: riprova fra un po'.",
        unavailable: "L'estensione Twitch non è ancora disponibile. Riprova più tardi.",
        not_authenticated: "Rifai l'accesso per creare un codice.",
        error: "Non è stato possibile creare il codice. Riprova.",
      },
      /** {id} = id del canale Twitch; seguito da data e ora */
      linked: "Canale Twitch collegato (id {id}) dal",
      none: "Nessun canale Twitch collegato.",
      unlink: "Scollega il canale",
      confirm: "Scollegare il canale Twitch? L'estensione smetterà di mostrare il tuo mazzo.",
      done: "Canale Twitch scollegato.",
      error: "Non è stato possibile scollegare il canale. Riprova.",
    },
    devices: {
      title: "PC collegati",
      empty: "Nessun PC collegato.",
      linked: "collegato il",
      lastSync: "ultimo invio",
      never: "nessun invio per ora",
      unlink: "Scollega",
      confirm: "Scollegare questo PC? L'app smette di mandare le partite finché non la ricolleghi con un codice nuovo.",
      done: "PC scollegato.",
      error: "Non è stato possibile scollegare il PC. Riprova.",
    },
    stats: {
      title: "Le tue partite",
      empty: "Nessuna partita arrivata per ora: gioca con l'app collegata e compaiono qui.",
      games: "Partite",
      record: "Vittorie–sconfitte",
      winRate: "Win rate",
      last: "Ultima partita",
      unknown: "{n} partite senza esito certo, fuori dal conto.",
      decksTitle: "I tuoi mazzi",
      decksNote: "Una riga per lista esatta (le stesse 13 carte); le partite senza replay stanno insieme per Leggendaria.",
      deck: "Mazzo",
      opponentsTitle: "Contro le Leggendarie",
      opponentsNote: "Il tuo risultato contro ogni Leggendaria avversaria.",
      legendary: "Leggendaria",
      matches: "Partite",
      wl: "V–S",
      recentTitle: "Ultime partite",
      when: "Quando",
      result: "Esito",
      opponent: "Avversario",
      rounds: "Round",
      win: "V",
      loss: "S",
      winLong: "vittoria",
      lossLong: "sconfitta",
      unknownResult: "?",
      patch: "patch {patch}",
      unknownDeck: "Mazzo sconosciuto",
      note: "Questi numeri li vedi solo tu. Le statistiche pubbliche del sito usano solo totali anonimi, senza nomi né account.",
    },
    data: {
      title: "I tuoi dati",
      body:
        "Il sito tiene le partite arrivate dall'app e i PC collegati. Puoi cancellare tutte le tue partite quando vuoi: escono subito anche dalle statistiche anonime. I PC restano collegati: scollegali qui sopra.",
      forget: "Cancella tutte le mie partite",
      confirm: "Cancellare tutte le partite arrivate dall'app? Non si può annullare.",
      done: "Partite cancellate: {n}.",
      error: "Non è stato possibile cancellare le partite. Riprova.",
      privacy: "Informativa privacy: OriginsMeta Tracker",
    },
    account: {
      title: "OriginsMeta Tracker",
      intro: "L'app per Windows che registra le tue partite di Origins TCG: collegala al tuo account, guarda le tue statistiche, gestisci i PC e i dati.",
      open: "Apri OriginsMeta Tracker",
      download: "Scarica l'app",
    },
  },
  es: {
    meta: {
      title: "OriginsMeta Tracker",
      description: "Vincula la app OriginsMeta Tracker a tu cuenta, mira las partidas registradas y tus estadísticas, desvincula tus PC y borra tus datos.",
    },
    back: "Cuenta",
    kicker: "Tracker",
    h1: "OriginsMeta Tracker",
    intro:
      "La app para Windows que registra sola tus partidas de Origins TCG: resultado, mazo, cartas jugadas ronda a ronda. Aquí vinculas la app a tu cuenta y ves tus estadísticas.",
    install: "¿Todavía no tienes la app?",
    installLink: "Descárgala y sigue la guía de instalación",
    unavailable: "OriginsMeta Tracker todavía no está disponible. Vuelve a intentarlo más tarde.",
    link: {
      title: "Vincula un PC",
      steps: [
        "Crea un código aquí abajo: vale 10 minutos y se usa una sola vez.",
        "Abre la app: te pide el código. Escríbelo y pulsa “Vincular”.",
        "Desde entonces la app envía tus partidas a tu cuenta, también las que ya había registrado.",
      ],
      consent:
        "Al vincular la app, tus partidas entran siempre también en las estadísticas anónimas del sitio (win rate de Legendarias, mazos y cartas): solo números agregados, nunca quién jugó. Si no quieres, no uses la app: solo funciona vinculada a tu cuenta.",
      consentLink: "Detalles en la política de privacidad",
      create: "Crear un código",
      creating: "Creando el código…",
      yourCode: "Tu código",
      expires: "Vale hasta las {time}, una sola vez.",
      expired: "Este código caducó: crea uno nuevo.",
      copy: "Copiar",
      copied: "Copiado",
      errors: {
        too_many_codes: "Creaste demasiados códigos en la última hora: vuelve a intentarlo dentro de un rato.",
        unavailable: "La vinculación todavía no está disponible. Vuelve a intentarlo más tarde.",
        not_authenticated: "Vuelve a iniciar sesión para crear un código.",
        error: "No se pudo crear el código. Vuelve a intentarlo.",
      },
    },
    twitch: {
      title: "Extensión de Twitch",
      intro: "Con la extensión OriginsMeta Deck tracker, quien ve tu directo abre tu mazo sobre el vídeo y lee las cartas en vivo: tu lista con las copias que quedan, la Legendaria del rival y las cartas que revela.",
      steps: [
        "Instala la extensión “OriginsMeta Deck tracker” en tu canal y actívala como superposición.",
        "Crea un código aquí abajo: vale 10 minutos y se usa una vez.",
        "En la página de configuración de la extensión en Twitch, escribe el código y pulsa “Vincular”.",
        "Juega con OriginsMeta Tracker encendido: durante la partida la app envía al sitio lo que muestra el Deck tracker y la extensión se lo muestra a tu público.",
      ],
      privacy: "A tu público solo le llega lo que ya muestras en directo con el Deck tracker: tu mazo, la ronda, la Legendaria del rival y las cartas que revela. Nunca nombres, rangos ni identificadores de partidas.",
      privacyLink: "Detalles en la política de privacidad",
      create: "Crear un código para Twitch",
      creating: "Creando…",
      yourCode: "Tu código para Twitch",
      /** {time} = ora di scadenza */
      expires: "Vale hasta las {time}, una vez.",
      expired: "El código ha caducado: crea uno nuevo.",
      copy: "Copiar",
      copied: "Copiado",
      errors: {
        too_many_codes: "Has creado demasiados códigos en la última hora: vuelve a intentarlo dentro de un rato.",
        unavailable: "La extensión de Twitch todavía no está disponible. Vuelve a intentarlo más tarde.",
        not_authenticated: "Vuelve a iniciar sesión para crear un código.",
        error: "No se ha podido crear el código. Vuelve a intentarlo.",
      },
      /** {id} = id del canale Twitch; seguito da data e ora */
      linked: "Canal de Twitch vinculado (id {id}) desde el",
      none: "Ningún canal de Twitch vinculado.",
      unlink: "Desvincular el canal",
      confirm: "¿Desvincular el canal de Twitch? La extensión dejará de mostrar tu mazo.",
      done: "Canal de Twitch desvinculado.",
      error: "No se ha podido desvincular el canal. Vuelve a intentarlo.",
    },
    devices: {
      title: "PC vinculados",
      empty: "Ningún PC vinculado.",
      linked: "vinculado el",
      lastSync: "último envío",
      never: "ningún envío todavía",
      unlink: "Desvincular",
      confirm: "¿Desvincular este PC? La app deja de enviar las partidas hasta que la vuelvas a vincular con un código nuevo.",
      done: "PC desvinculado.",
      error: "No se pudo desvincular el PC. Vuelve a intentarlo.",
    },
    stats: {
      title: "Tus partidas",
      empty: "Todavía no llegó ninguna partida: juega con la app vinculada y aparecerán aquí.",
      games: "Partidas",
      record: "Victorias–derrotas",
      winRate: "Win rate",
      last: "Última partida",
      unknown: "{n} partidas sin un resultado seguro, fuera de la cuenta.",
      decksTitle: "Tus mazos",
      decksNote: "Una fila por lista exacta (las mismas 13 cartas); las partidas sin repetición se agrupan por Legendaria.",
      deck: "Mazo",
      opponentsTitle: "Contra las Legendarias",
      opponentsNote: "Tu resultado contra cada Legendaria rival.",
      legendary: "Legendaria",
      matches: "Partidas",
      wl: "V–D",
      recentTitle: "Últimas partidas",
      when: "Cuándo",
      result: "Resultado",
      opponent: "Rival",
      rounds: "Rondas",
      win: "V",
      loss: "D",
      winLong: "victoria",
      lossLong: "derrota",
      unknownResult: "?",
      patch: "parche {patch}",
      unknownDeck: "Mazo desconocido",
      note: "Estos números solo los ves tú. Las estadísticas públicas del sitio usan solo totales anónimos, sin nombres ni cuentas.",
    },
    data: {
      title: "Tus datos",
      body:
        "El sitio guarda las partidas que llegaron desde la app y los PC vinculados. Puedes borrar todas tus partidas cuando quieras: también salen enseguida de las estadísticas anónimas. Tus PC siguen vinculados: desvincúlalos arriba.",
      forget: "Borrar todas mis partidas",
      confirm: "¿Borrar todas las partidas que llegaron desde la app? No se puede deshacer.",
      done: "Partidas borradas: {n}.",
      error: "No se pudieron borrar las partidas. Vuelve a intentarlo.",
      privacy: "Política de privacidad: OriginsMeta Tracker",
    },
    account: {
      title: "OriginsMeta Tracker",
      intro: "La app para Windows que registra tus partidas de Origins TCG: vincúlala a tu cuenta, mira tus estadísticas y gestiona tus PC y tus datos.",
      open: "Abrir OriginsMeta Tracker",
      download: "Descarga la app",
    },
  },
  // Francese dal 07/10/2026 (docs/francese.md): vous; "associer / dissocier un PC" per link/unlink, "manche" per round,
  // "file d'attente classée" per la coda classificata; "OriginsMeta Tracker" e "win rate" restano.
  fr: {
    meta: {
      title: "OriginsMeta Tracker",
      description: "Associez l'application OriginsMeta Tracker à votre compte, consultez les parties enregistrées et vos statistiques, dissociez vos PC et supprimez vos données.",
    },
    back: "Compte",
    kicker: "Tracker",
    h1: "OriginsMeta Tracker",
    intro:
      "L'application Windows qui enregistre seule vos parties d'Origins TCG : résultat, deck, cartes jouées manche par manche. Ici, vous associez l'application à votre compte et consultez vos statistiques.",
    install: "Vous n'avez pas encore l'application ?",
    installLink: "Téléchargez-la et suivez le guide d'installation",
    unavailable: "OriginsMeta Tracker n'est pas encore disponible. Réessayez plus tard.",
    link: {
      title: "Associer un PC",
      steps: [
        "Créez un code ci-dessous : il est valable 10 minutes et ne sert qu'une fois.",
        "Ouvrez l'application : elle vous demande le code. Saisissez-le et appuyez sur « Link ».",
        "Dès lors, l'application envoie vos parties à votre compte, y compris celles qu'elle avait déjà enregistrées.",
      ],
      consent:
        "En associant l'application, vos parties entrent toujours aussi dans les statistiques anonymes du site (win rate des Légendaires, des decks et des cartes) : uniquement des chiffres agrégés, jamais qui a joué. Si vous ne le souhaitez pas, n'utilisez pas l'application : elle fonctionne uniquement associée à votre compte.",
      consentLink: "Détails dans la politique de confidentialité",
      create: "Créer un code",
      creating: "Création…",
      yourCode: "Votre code",
      expires: "Valable jusqu'à {time}, une seule fois.",
      expired: "Ce code a expiré : créez-en un nouveau.",
      copy: "Copier",
      copied: "Copié",
      errors: {
        too_many_codes: "Vous avez créé trop de codes cette dernière heure : réessayez dans un moment.",
        unavailable: "L'association n'est pas encore disponible. Réessayez plus tard.",
        not_authenticated: "Reconnectez-vous pour créer un code.",
        error: "Impossible de créer le code. Réessayez.",
      },
    },
    twitch: {
      title: "Extension Twitch",
      intro: "Avec l'extension OriginsMeta Deck tracker, les personnes qui regardent votre live ouvrent votre deck par-dessus la vidéo et lisent les cartes en direct : votre liste avec les copies restantes, la Légendaire de l'adversaire et les cartes qu'il révèle.",
      steps: [
        "Installez l'extension « OriginsMeta Deck tracker » sur votre chaîne et activez-la en superposition.",
        "Créez un code ci-dessous : il est valable 10 minutes et une seule fois.",
        "Dans la page de configuration de l'extension sur Twitch, saisissez le code et appuyez sur « Associer ».",
        "Jouez avec OriginsMeta Tracker allumé : pendant la partie, l'application envoie au site ce qu'affiche le Deck tracker, et l'extension le montre à votre public.",
      ],
      privacy: "Votre public ne reçoit que ce que vous montrez déjà en live avec le Deck tracker : votre deck, la manche, la Légendaire de l'adversaire et les cartes qu'il révèle. Jamais de noms, de rangs ni d'identifiants de parties.",
      privacyLink: "Détails dans la politique de confidentialité",
      create: "Créer un code pour Twitch",
      creating: "Création…",
      yourCode: "Votre code pour Twitch",
      /** {time} = ora di scadenza */
      expires: "Valable jusqu'à {time}, une seule fois.",
      expired: "Ce code a expiré : créez-en un nouveau.",
      copy: "Copier",
      copied: "Copié",
      errors: {
        too_many_codes: "Vous avez créé trop de codes au cours de la dernière heure : réessayez dans un moment.",
        unavailable: "L'extension Twitch n'est pas encore disponible. Réessayez plus tard.",
        not_authenticated: "Reconnectez-vous pour créer un code.",
        error: "Impossible de créer le code. Réessayez.",
      },
      /** {id} = id del canale Twitch; seguito da data e ora */
      linked: "Chaîne Twitch associée (id {id}) depuis le",
      none: "Aucune chaîne Twitch associée.",
      unlink: "Dissocier la chaîne",
      confirm: "Dissocier la chaîne Twitch ? L'extension n'affichera plus votre deck.",
      done: "Chaîne Twitch dissociée.",
      error: "Impossible de dissocier la chaîne. Réessayez.",
    },
    devices: {
      title: "PC associés",
      empty: "Aucun PC associé.",
      linked: "associé le",
      lastSync: "dernier envoi",
      never: "aucun envoi pour l'instant",
      unlink: "Dissocier",
      confirm: "Dissocier ce PC ? L'application cesse d'envoyer les parties jusqu'à ce que vous l'associiez de nouveau avec un nouveau code.",
      done: "PC dissocié.",
      error: "Impossible de dissocier le PC. Réessayez.",
    },
    stats: {
      title: "Vos parties",
      empty: "Aucune partie reçue pour l'instant : jouez avec l'application associée et elles apparaîtront ici.",
      games: "Parties",
      record: "Victoires–défaites",
      winRate: "Win rate",
      last: "Dernière partie",
      unknown: "{n} parties sans résultat certain, hors du décompte.",
      decksTitle: "Vos decks",
      decksNote: "Une ligne par liste exacte (les mêmes 13 cartes) ; les parties sans replay sont regroupées par Légendaire.",
      deck: "Deck",
      opponentsTitle: "Contre les Légendaires",
      opponentsNote: "Votre résultat contre chaque Légendaire adverse.",
      legendary: "Légendaire",
      matches: "Parties",
      wl: "V–D",
      recentTitle: "Dernières parties",
      when: "Quand",
      result: "Résultat",
      opponent: "Adversaire",
      rounds: "Manches",
      win: "V",
      loss: "D",
      winLong: "victoire",
      lossLong: "défaite",
      unknownResult: "?",
      patch: "patch {patch}",
      unknownDeck: "Deck inconnu",
      note: "Ces chiffres ne sont visibles que par vous. Les statistiques publiques du site n'utilisent que des totaux anonymes, sans noms ni comptes.",
    },
    data: {
      title: "Vos données",
      body:
        "Le site conserve les parties reçues de l'application et les PC associés. Vous pouvez supprimer toutes vos parties quand vous le souhaitez : elles sortent aussitôt des statistiques anonymes. Vos PC restent associés : dissociez-les ci-dessus.",
      forget: "Supprimer toutes mes parties",
      confirm: "Supprimer toutes les parties reçues de l'application ? Cette action est irréversible.",
      done: "Parties supprimées : {n}.",
      error: "Impossible de supprimer les parties. Réessayez.",
      privacy: "Politique de confidentialité : OriginsMeta Tracker",
    },
    account: {
      title: "OriginsMeta Tracker",
      intro: "L'application Windows qui enregistre vos parties d'Origins TCG : associez-la à votre compte, consultez vos statistiques, gérez vos PC et vos données.",
      open: "Ouvrir OriginsMeta Tracker",
      download: "Télécharger l'application",
    },
  },
};

/**
 * Paragrafo dell'informativa privacy (/privacy, ancora #tracker): cosa legge l'app, cosa manda quando è collegata e
 * cosa mai, dove sta, chi lo vede, le statistiche anonime a cui chi collega l'app partecipa sempre (decisione di
 * Pierluigi del 30/09/2026, nessuna casella), come scollegare e cancellare. Dal 10/10/2026 anche lo scanner dello
 * schermo (docs/tracker.md, "Scanner dello schermo"): solo la finestra del gioco, riconoscimento sul PC, nessuna
 * immagine inviata, al sito solo gli id delle carte; si spegne dall'app.
 */
export const trackerPrivacy: Record<Locale, string> = {
  en: "OriginsMeta Tracker: the Windows app only reads the files Origins TCG saves on your PC (profile stats, deck inventory and, when the game saves one, the replay of the last match) and never touches the game. Screen scanner: while the game is open, the app captures only the game's window, never other windows, and recognizes on your PC the cards on the board, the Legendaries on the opening screen and the mana; the images stay in memory on your PC and are never sent. Of what it sees, only the identifiers of the cards reach the site (the cards played by you and by your opponent, the opponent's Legendary), never names of players. On the opening screen it also reads the opponent's name, only on your PC and only to recognize matches against bots, which are not recorded: the name is never saved and never leaves your PCYou can switch the scanner off in the app. To show the cards, it loads their images from originsmeta.com. The app works only linked to an OriginsMeta account (with a one-time code created in /account/tracker): without the link it doesn't work. It checks the link when it starts and every 4 hours, sending only its token, no other data; if the site doesn't answer, it keeps working for 7 days from the last successful check. The matches it records are also kept on your PC, in the app's data folder. For each match it sends the site: a fingerprint of the match computed on the PC (never the game's identifier), end time, result, queue (ranked or normal), your deck (name, cards, game code), your rank, the rounds and the cards played round by round; of the opponent, only their Legendary and the cards they played. It never sends names or identifiers of players or matches, the opponent's rank, their full deck, or whether the opponent is a bot or a person. The site adds the patch in force and the deck's archetype. Matches are stored on Supabase (Ireland, EU) and only you can see them, in /account/tracker, together with the name of your linked PCs and the time of their last sync; for the link, the database keeps only a fingerprint of the token, which on the PC is encrypted with Windows data protection. The app's requests go through the servers of the site (Vercel) and of Supabase, which keep the usual technical logs (IP address included) for a short time. Anonymous stats: the matches of everyone who links the app always go into the site's stats (win rates of Legendaries, decks, archetypes and cards, Legendary matchups), which show only aggregate numbers per patch: never single matches or who played them. Linking the app, which is required to use it, means accepting this; if you don't want it, don't use the app. You can unlink a PC and delete all your matches from /account/tracker at any time: they also leave the stats at once, because they are computed on the fly. Download: when you click the download button on /tracker, the site records the click with your account (if you are signed in), the language of the page and the time, to know how many people download the app; never the IP address. If you delete your account the click stays without a name. Twitch extension (optional): if you link a Twitch channel in /account/tracker, during the match the app also sends the site what the Deck tracker shows (your deck with the copies drawn and played, the round, the opponent's Legendary and the cards they revealed, including spells); the site keeps only the latest version and passes it, through Twitch, to the viewers of your channel. Of the channel, the site keeps only its identifier. Never names, ranks or identifiers of players or matches. You can unlink the channel in /account/tracker. Deleting your account deletes everything else.",
  it: "OriginsMeta Tracker: l'app per Windows legge in sola lettura i file che Origins TCG salva sul tuo PC (statistiche del profilo, mazzi dell'inventario e, quando il gioco lo salva, il replay dell'ultima partita) e non tocca mai il gioco. Scanner dello schermo: quando il gioco è aperto, l'app riprende solo la finestra del gioco, mai altre finestre, e riconosce sul tuo PC le carte sul tabellone, le Leggendarie della schermata iniziale e il mana; le immagini restano in memoria sul PC e non vengono mai inviate. Di quello che vede, al sito arrivano solo gli identificativi delle carte (le carte giocate da te e dall'avversario, la Leggendaria dell'avversario), mai nomi di giocatori. Nella schermata iniziale legge anche il nome dell'avversario, solo sul PC e solo per riconoscere le partite contro i bot, che non vengono registrate: il nome non si salva e non esce dal PCLo scanner si può spegnere dall'app. Per mostrare le carte ne carica le immagini da originsmeta.com. L'app funziona solo collegata a un account OriginsMeta (con un codice monouso creato in /account/tracker): senza collegamento non funziona. Controlla il collegamento all'avvio e ogni 4 ore, mandando al sito solo il suo token, nessun altro dato; se il sito non risponde, continua a funzionare per 7 giorni dall'ultimo controllo riuscito. Le partite registrate restano anche sul PC, nella cartella dei dati dell'app. Per ogni partita manda al sito: un'impronta della partita calcolata sul PC (mai l'identificativo del gioco), ora di fine, esito, coda (classificata o normale), il tuo mazzo (nome, carte, codice del gioco), il tuo rank, i round e le carte giocate round per round; dell'avversario solo la Leggendaria e le carte che ha giocato. Non manda mai nomi né identificativi di giocatori o partite, il rank dell'avversario, il suo mazzo completo né se l'avversario è un bot o una persona. Il sito aggiunge la patch in vigore e l'archetipo del mazzo. Le partite si salvano su Supabase (Irlanda, UE) e le vedi solo tu, in /account/tracker, insieme al nome dei PC collegati e all'ora del loro ultimo invio; del collegamento il database tiene solo un'impronta del token, che sul PC è cifrato con la protezione dei dati di Windows. Le richieste dell'app passano dai server del sito (Vercel) e di Supabase, che conservano per poco i normali log tecnici (indirizzo IP compreso). Statistiche anonime: le partite di chi collega l'app entrano sempre nelle statistiche del sito (win rate di Leggendarie, mazzi, archetipi e carte, scontri fra Leggendarie), che mostrano solo numeri aggregati per patch: mai le singole partite né chi le ha giocate. Collegare l'app, che serve per usarla, vuol dire accettarlo; se non vuoi, non usare l'app. Puoi scollegare un PC e cancellare tutte le tue partite da /account/tracker in qualsiasi momento: escono subito anche dalle statistiche, perché si calcolano al momento. Download: quando clicchi il tasto di download di /tracker, il sito registra il clic con il tuo account (se hai fatto l'accesso), la lingua della pagina e l'ora, per sapere quante persone scaricano l'app; mai l'indirizzo IP. Se cancelli l'account il clic resta senza nome. Estensione Twitch (facoltativa): se colleghi un canale Twitch da /account/tracker, durante la partita l'app manda al sito anche quello che mostra il Deck tracker (il tuo mazzo con le copie pescate e giocate, il round, la Leggendaria dell'avversario e le carte che ha rivelato, magie comprese); il sito ne tiene solo l'ultima versione e la passa, attraverso Twitch, a chi guarda il tuo canale. Del canale il sito tiene solo l'identificativo. Mai nomi, rank o identificativi di giocatori o partite. Il canale si scollega da /account/tracker. Cancellando l'account si cancella tutto il resto.",
  es: "OriginsMeta Tracker: la app para Windows solo lee los archivos que Origins TCG guarda en tu PC (estadísticas del perfil, mazos del inventario y, cuando el juego la guarda, la repetición de la última partida) y nunca toca el juego. Escáner de pantalla: cuando el juego está abierto, la app captura solo la ventana del juego, nunca otras ventanas, y reconoce en tu PC las cartas del tablero, las Legendarias de la pantalla inicial y el maná; las imágenes se quedan en la memoria de tu PC y nunca se envían. De lo que ve, al sitio solo llegan los identificadores de las cartas (las cartas que jugaron tú y tu rival, la Legendaria del rival), nunca nombres de jugadores. En la pantalla inicial también lee el nombre del rival, solo en tu PC y solo para reconocer las partidas contra bots, que no se registran: el nombre nunca se guarda ni sale de tu PCPuedes apagar el escáner desde la app. Para mostrar las cartas, carga sus imágenes desde originsmeta.com. La app solo funciona vinculada a una cuenta de OriginsMeta (con un código de un solo uso creado en /account/tracker): sin la vinculación no funciona. Comprueba la vinculación al arrancar y cada 4 horas, enviando al sitio solo su token, ningún otro dato; si el sitio no responde, sigue funcionando durante 7 días desde la última comprobación correcta. Las partidas registradas también se guardan en tu PC, en la carpeta de datos de la app. Por cada partida envía al sitio: una huella de la partida calculada en el PC (nunca el identificador del juego), hora de fin, resultado, cola (clasificatoria o normal), tu mazo (nombre, cartas, código del juego), tu rango, las rondas y las cartas jugadas ronda a ronda; del rival, solo su Legendaria y las cartas que jugó. Nunca envía nombres ni identificadores de jugadores o partidas, el rango del rival, su mazo completo ni si el rival es un bot o una persona. El sitio añade el parche vigente y el arquetipo del mazo. Las partidas se guardan en Supabase (Irlanda, UE) y solo las ves tú, en /account/tracker, junto con el nombre de tus PC vinculados y la hora de su último envío; de la vinculación, la base de datos guarda solo una huella del token, que en el PC está cifrado con la protección de datos de Windows. Las solicitudes de la app pasan por los servidores del sitio (Vercel) y de Supabase, que conservan por poco tiempo los registros técnicos habituales (dirección IP incluida). Estadísticas anónimas: las partidas de quien vincula la app entran siempre en las estadísticas del sitio (win rate de Legendarias, mazos, arquetipos y cartas, enfrentamientos entre Legendarias), que muestran solo números agregados por parche: nunca partidas sueltas ni quién las jugó. Vincular la app, que es necesario para usarla, significa aceptarlo; si no quieres, no uses la app. Puedes desvincular un PC y borrar todas tus partidas desde /account/tracker en cualquier momento: también salen enseguida de las estadísticas, porque se calculan en el momento. Descarga: cuando haces clic en el botón de descarga de /tracker, el sitio registra el clic con tu cuenta (si has iniciado sesión), el idioma de la página y la hora, para saber cuántas personas descargan la app; nunca la dirección IP. Si borras tu cuenta, el clic se queda sin nombre. Extensión de Twitch (opcional): si vinculas un canal de Twitch en /account/tracker, durante la partida la app también envía al sitio lo que muestra el Deck tracker (tu mazo con las copias robadas y jugadas, la ronda, la Legendaria del rival y las cartas que reveló, hechizos incluidos); el sitio guarda solo la última versión y la pasa, a través de Twitch, a quien ve tu canal. Del canal, el sitio guarda solo su identificador. Nunca nombres, rangos ni identificadores de jugadores o partidas. Puedes desvincular el canal en /account/tracker. Si borras tu cuenta, se borra todo lo demás.",
  fr: "OriginsMeta Tracker : l'application Windows lit uniquement les fichiers qu'Origins TCG enregistre sur votre PC (statistiques du profil, decks de l'inventaire et, quand le jeu en enregistre un, le replay de la dernière partie) et ne touche jamais au jeu. Scanner d'écran : quand le jeu est ouvert, l'application capture uniquement la fenêtre du jeu, jamais d'autres fenêtres, et reconnaît sur votre PC les cartes du plateau, les Légendaires de l'écran d'ouverture et le mana ; les images restent en mémoire sur votre PC et ne sont jamais envoyées. De ce qu'elle voit, seuls les identifiants des cartes arrivent sur le site (les cartes jouées par vous et par votre adversaire, la Légendaire de l'adversaire), jamais de noms de joueurs. Sur l'écran d'ouverture, elle lit aussi le nom de l'adversaire, uniquement sur votre PC et seulement pour reconnaître les parties contre des bots, qui ne sont pas enregistrées : le nom n'est jamais conservé et ne quitte jamais votre PCVous pouvez désactiver le scanner dans l'application. Pour afficher les cartes, elle charge leurs images depuis originsmeta.com. L'application fonctionne uniquement associée à un compte OriginsMeta (avec un code à usage unique créé dans /account/tracker) : sans association, elle ne fonctionne pas. Elle vérifie l'association au démarrage et toutes les 4 heures, en n'envoyant au site que son jeton, aucune autre donnée ; si le site ne répond pas, elle continue de fonctionner pendant 7 jours après la dernière vérification réussie. Les parties enregistrées sont aussi conservées sur votre PC, dans le dossier de données de l'application. Pour chaque partie, elle envoie au site : une empreinte de la partie calculée sur le PC (jamais l'identifiant du jeu), l'heure de fin, le résultat, la file d'attente (classée ou normale), votre deck (nom, cartes, code du jeu), votre rang, les manches et les cartes jouées manche par manche ; de l'adversaire, uniquement sa Légendaire et les cartes qu'il a jouées. Elle n'envoie jamais de noms ni d'identifiants de joueurs ou de parties, ni le rang de l'adversaire, ni son deck complet, ni si l'adversaire est un bot ou une personne. Le site ajoute le patch en vigueur et l'archétype du deck. Les parties sont stockées sur Supabase (Irlande, UE) et vous êtes la seule personne à pouvoir les voir, dans /account/tracker, avec le nom de vos PC associés et l'heure de leur dernier envoi ; de l'association, la base de données ne garde qu'une empreinte du jeton, qui est chiffré sur le PC avec la protection des données de Windows. Les requêtes de l'application passent par les serveurs du site (Vercel) et de Supabase, qui conservent brièvement les journaux techniques habituels (adresse IP comprise). Statistiques anonymes : les parties de toute personne qui associe l'application entrent toujours dans les statistiques du site (win rate des Légendaires, des decks, des archétypes et des cartes, confrontations entre Légendaires), qui n'affichent que des chiffres agrégés par patch : jamais de parties isolées ni qui les a jouées. Associer l'application, ce qui est nécessaire pour l'utiliser, c'est l'accepter ; si vous ne le souhaitez pas, n'utilisez pas l'application. Vous pouvez dissocier un PC et supprimer toutes vos parties depuis /account/tracker à tout moment : elles sortent aussitôt des statistiques, parce qu'elles sont calculées à la volée. Téléchargement : quand vous cliquez sur le bouton de téléchargement de /tracker, le site enregistre le clic avec votre compte (si vous avez ouvert une session), la langue de la page et l'heure, pour savoir combien de personnes téléchargent l'application ; jamais l'adresse IP. Si vous supprimez votre compte, le clic reste sans nom. Extension Twitch (facultative) : si vous associez une chaîne Twitch dans /account/tracker, pendant la partie l'application envoie aussi au site ce qu'affiche le Deck tracker (votre deck avec les copies piochées et jouées, la manche, la Légendaire de l'adversaire et les cartes qu'il a révélées, sorts compris) ; le site n'en garde que la dernière version et la transmet, via Twitch, aux personnes qui regardent votre chaîne. De la chaîne, le site ne garde que son identifiant. Jamais de noms, de rangs ni d'identifiants de joueurs ou de parties. Vous pouvez dissocier la chaîne dans /account/tracker. Supprimer votre compte supprime tout le reste.",
};

/** Riempie i segnaposto `{nome}` (senza interpretare i `$` di `replace`). */
export function fillTracker(label: string, vars: Record<string, string | number>): string {
  return label.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
