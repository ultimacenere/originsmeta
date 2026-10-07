import type { Locale } from "./i18n";

/**
 * Il riquadro "OriginsMeta Tracker" di /account si vede a tutti solo quando l'app si potrà scaricare (lancio, Fase 5 di
 * docs/tracker.md): fino ad allora solo a Staff e admin, perché l'app è in prova. La pagina /account/tracker funziona
 * comunque per chi ha il link (i tester). Da accendere al lancio, insieme al testo `beta` qui sotto.
 */
export const TRACKER_ACCOUNT_LINK_PUBLIC = false;

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
    title: "OriginsMeta Analytics",
    description: "Link the OriginsMeta Analytics app to your account, see the matches it recorded and your stats, unlink your PCs and delete your data.",
  },
  back: "Account",
  kicker: "Analytics",
  h1: "OriginsMeta Analytics",
  intro:
    "The Windows app that records your Origins TCG matches on its own: result, deck, cards played round by round. Here you link the app to your account and see your stats.",
  beta: "The app is being tested and can't be downloaded from the site yet.",
  unavailable: "OriginsMeta Analytics isn't available yet. Please try again later.",
  link: {
    title: "Link a PC",
    steps: [
      "Create a code below: it's valid for 10 minutes and works once.",
      "In the app, open “OriginsMeta account” and type the code.",
      "From then on the app sends your matches to your account, including the ones it had already recorded.",
    ],
    consent:
      "When you link the app, your matches always go into the site's anonymous stats too (win rates of Legendaries, decks and cards): only aggregate numbers, never who played. If you don't want that, don't link it: the app also works on your PC alone.",
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
    note: "Only you can see these numbers. The site's public stats use only anonymous totals, from at least 20 matches by at least 3 different players.",
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
    privacy: "Privacy policy: OriginsMeta Analytics",
  },
  account: {
    title: "OriginsMeta Analytics",
    intro: "The Windows app that records your Origins TCG matches: link it to your account, see your stats, manage your PCs and data.",
    open: "Open OriginsMeta Analytics",
  },
};

export type TrackerLabels = typeof en;

export const trackerLabels: Record<Locale, TrackerLabels> = {
  en,
  it: {
    meta: {
      title: "OriginsMeta Analytics",
      description: "Collega l'app OriginsMeta Analytics al tuo account, guarda le partite registrate e le tue statistiche, scollega i PC e cancella i tuoi dati.",
    },
    back: "Account",
    kicker: "Analytics",
    h1: "OriginsMeta Analytics",
    intro:
      "L'app per Windows che registra da sola le tue partite di Origins TCG: esito, mazzo, carte giocate round per round. Qui colleghi l'app al tuo account e vedi le tue statistiche.",
    beta: "L'app è in prova e per ora non si scarica dal sito.",
    unavailable: "OriginsMeta Analytics non è ancora disponibile. Riprova più tardi.",
    link: {
      title: "Collega un PC",
      steps: [
        "Crea un codice qui sotto: vale 10 minuti e si usa una volta.",
        "Nell'app apri “Account OriginsMeta” e scrivi il codice.",
        "Da lì in poi l'app manda le partite al tuo account, anche quelle che aveva già registrato.",
      ],
      consent:
        "Collegando l'app, le tue partite entrano sempre anche nelle statistiche anonime del sito (win rate di Leggendarie, mazzi e carte): solo numeri aggregati, mai chi ha giocato. Se non vuoi, non collegarla: l'app funziona anche solo sul tuo PC.",
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
      note: "Questi numeri li vedi solo tu. Le statistiche pubbliche del sito usano solo totali anonimi, da almeno 20 partite di almeno 3 giocatori diversi.",
    },
    data: {
      title: "I tuoi dati",
      body:
        "Il sito tiene le partite arrivate dall'app e i PC collegati. Puoi cancellare tutte le tue partite quando vuoi: escono subito anche dalle statistiche anonime. I PC restano collegati: scollegali qui sopra.",
      forget: "Cancella tutte le mie partite",
      confirm: "Cancellare tutte le partite arrivate dall'app? Non si può annullare.",
      done: "Partite cancellate: {n}.",
      error: "Non è stato possibile cancellare le partite. Riprova.",
      privacy: "Informativa privacy: OriginsMeta Analytics",
    },
    account: {
      title: "OriginsMeta Analytics",
      intro: "L'app per Windows che registra le tue partite di Origins TCG: collegala al tuo account, guarda le tue statistiche, gestisci i PC e i dati.",
      open: "Apri OriginsMeta Analytics",
    },
  },
  es: {
    meta: {
      title: "OriginsMeta Analytics",
      description: "Vincula la app OriginsMeta Analytics a tu cuenta, mira las partidas registradas y tus estadísticas, desvincula tus PC y borra tus datos.",
    },
    back: "Cuenta",
    kicker: "Analytics",
    h1: "OriginsMeta Analytics",
    intro:
      "La app para Windows que registra sola tus partidas de Origins TCG: resultado, mazo, cartas jugadas ronda a ronda. Aquí vinculas la app a tu cuenta y ves tus estadísticas.",
    beta: "La app está en pruebas y por ahora no se descarga desde el sitio.",
    unavailable: "OriginsMeta Analytics todavía no está disponible. Vuelve a intentarlo más tarde.",
    link: {
      title: "Vincula un PC",
      steps: [
        "Crea un código aquí abajo: vale 10 minutos y se usa una sola vez.",
        "En la app, abre “Cuenta de OriginsMeta” y escribe el código.",
        "Desde entonces la app envía tus partidas a tu cuenta, también las que ya había registrado.",
      ],
      consent:
        "Al vincular la app, tus partidas entran siempre también en las estadísticas anónimas del sitio (win rate de Legendarias, mazos y cartas): solo números agregados, nunca quién jugó. Si no quieres, no la vincules: la app también funciona solo en tu PC.",
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
      note: "Estos números solo los ves tú. Las estadísticas públicas del sitio usan solo totales anónimos, de al menos 20 partidas de al menos 3 jugadores distintos.",
    },
    data: {
      title: "Tus datos",
      body:
        "El sitio guarda las partidas que llegaron desde la app y los PC vinculados. Puedes borrar todas tus partidas cuando quieras: también salen enseguida de las estadísticas anónimas. Tus PC siguen vinculados: desvincúlalos arriba.",
      forget: "Borrar todas mis partidas",
      confirm: "¿Borrar todas las partidas que llegaron desde la app? No se puede deshacer.",
      done: "Partidas borradas: {n}.",
      error: "No se pudieron borrar las partidas. Vuelve a intentarlo.",
      privacy: "Política de privacidad: OriginsMeta Analytics",
    },
    account: {
      title: "OriginsMeta Analytics",
      intro: "La app para Windows que registra tus partidas de Origins TCG: vincúlala a tu cuenta, mira tus estadísticas y gestiona tus PC y tus datos.",
      open: "Abrir OriginsMeta Analytics",
    },
  },
  // Francese dal 07/10/2026 (docs/francese.md): vous; "associer / dissocier un PC" per link/unlink, "manche" per round,
  // "file d'attente classée" per la coda classificata; "OriginsMeta Analytics" e "win rate" restano.
  fr: {
    meta: {
      title: "OriginsMeta Analytics",
      description: "Associez l'application OriginsMeta Analytics à votre compte, consultez les parties enregistrées et vos statistiques, dissociez vos PC et supprimez vos données.",
    },
    back: "Compte",
    kicker: "Analytics",
    h1: "OriginsMeta Analytics",
    intro:
      "L'application Windows qui enregistre seule vos parties d'Origins TCG : résultat, deck, cartes jouées manche par manche. Ici, vous associez l'application à votre compte et consultez vos statistiques.",
    beta: "L'application est en test et ne peut pas encore être téléchargée depuis le site.",
    unavailable: "OriginsMeta Analytics n'est pas encore disponible. Réessayez plus tard.",
    link: {
      title: "Associer un PC",
      steps: [
        "Créez un code ci-dessous : il est valable 10 minutes et ne sert qu'une fois.",
        "Dans l'application, ouvrez « Compte OriginsMeta » et saisissez le code.",
        "Dès lors, l'application envoie vos parties à votre compte, y compris celles qu'elle avait déjà enregistrées.",
      ],
      consent:
        "En associant l'application, vos parties entrent toujours aussi dans les statistiques anonymes du site (win rate des Légendaires, des decks et des cartes) : uniquement des chiffres agrégés, jamais qui a joué. Si vous ne le souhaitez pas, ne l'associez pas : l'application fonctionne aussi sur votre PC seul.",
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
      note: "Ces chiffres ne sont visibles que par vous. Les statistiques publiques du site n'utilisent que des totaux anonymes, issus d'au moins 20 parties d'au moins 3 joueurs différents.",
    },
    data: {
      title: "Vos données",
      body:
        "Le site conserve les parties reçues de l'application et les PC associés. Vous pouvez supprimer toutes vos parties quand vous le souhaitez : elles sortent aussitôt des statistiques anonymes. Vos PC restent associés : dissociez-les ci-dessus.",
      forget: "Supprimer toutes mes parties",
      confirm: "Supprimer toutes les parties reçues de l'application ? Cette action est irréversible.",
      done: "Parties supprimées : {n}.",
      error: "Impossible de supprimer les parties. Réessayez.",
      privacy: "Politique de confidentialité : OriginsMeta Analytics",
    },
    account: {
      title: "OriginsMeta Analytics",
      intro: "L'application Windows qui enregistre vos parties d'Origins TCG : associez-la à votre compte, consultez vos statistiques, gérez vos PC et vos données.",
      open: "Ouvrir OriginsMeta Analytics",
    },
  },
};

/**
 * Paragrafo dell'informativa privacy (/privacy, ancora #tracker): cosa legge l'app, cosa manda quando è collegata e
 * cosa mai, dove sta, chi lo vede, le statistiche anonime a cui chi collega l'app partecipa sempre (decisione di
 * Pierluigi del 30/09/2026, nessuna casella), come scollegare e cancellare.
 */
export const trackerPrivacy: Record<Locale, string> = {
  en: "OriginsMeta Analytics: the Windows app only reads the files Origins TCG saves on your PC (profile stats, deck inventory and the replay of the last match) and never touches the game. To show the cards, it loads their images from originsmeta.com. The match history stays on your PC, in the app's data folder, until you link the app to your account. If you link it (with a one-time code created in /account/tracker), for each match it sends the site: a fingerprint of the match computed on the PC (never the game's identifier), end time, result, queue (ranked or normal), your deck (name, cards, game code), your rank, the rounds and the cards played round by round; of the opponent, only their Legendary and the cards they played. It never sends names or identifiers of players or matches, the opponent's rank, their full deck, or whether the opponent is a bot or a person. The site adds the patch in force and the deck's archetype. Matches are stored on Supabase (Ireland, EU) and only you can see them, in /account/tracker, together with the name of your linked PCs and the time of their last sync; for the link, the database keeps only a fingerprint of the token, which on the PC is encrypted with Windows data protection. The app's requests go through the servers of the site (Vercel) and of Supabase, which keep the usual technical logs (IP address included) for a short time. Anonymous stats: the matches of everyone who links the app always go into the site's stats (win rates of Legendaries, decks, archetypes and cards, Legendary matchups), which show only aggregate numbers per patch, and each number only if it comes from at least 20 matches by at least 3 different players: never single matches or who played them. Linking the app means accepting this; if you don't want it, don't link it: the app also works on your PC alone. You can unlink a PC and delete all your matches from /account/tracker at any time: they also leave the stats at once, because they are computed on the fly. Deleting your account deletes everything.",
  it: "OriginsMeta Analytics: l'app per Windows legge in sola lettura i file che Origins TCG salva sul tuo PC (statistiche del profilo, mazzi dell'inventario e replay dell'ultima partita) e non tocca mai il gioco. Per mostrare le carte ne carica le immagini da originsmeta.com. Lo storico delle partite resta sul PC, nella cartella dei dati dell'app, finché non colleghi l'app al tuo account. Se la colleghi (con un codice monouso creato in /account/tracker), per ogni partita manda al sito: un'impronta della partita calcolata sul PC (mai l'identificativo del gioco), ora di fine, esito, coda (classificata o normale), il tuo mazzo (nome, carte, codice del gioco), il tuo rank, i round e le carte giocate round per round; dell'avversario solo la Leggendaria e le carte che ha giocato. Non manda mai nomi né identificativi di giocatori o partite, il rank dell'avversario, il suo mazzo completo né se l'avversario è un bot o una persona. Il sito aggiunge la patch in vigore e l'archetipo del mazzo. Le partite si salvano su Supabase (Irlanda, UE) e le vedi solo tu, in /account/tracker, insieme al nome dei PC collegati e all'ora del loro ultimo invio; del collegamento il database tiene solo un'impronta del token, che sul PC è cifrato con la protezione dei dati di Windows. Le richieste dell'app passano dai server del sito (Vercel) e di Supabase, che conservano per poco i normali log tecnici (indirizzo IP compreso). Statistiche anonime: le partite di chi collega l'app entrano sempre nelle statistiche del sito (win rate di Leggendarie, mazzi, archetipi e carte, scontri fra Leggendarie), che mostrano solo numeri aggregati per patch, e ogni numero solo se viene da almeno 20 partite di almeno 3 giocatori diversi: mai le singole partite né chi le ha giocate. Collegare l'app vuol dire accettarlo; se non vuoi, non collegarla: l'app funziona anche solo sul tuo PC. Puoi scollegare un PC e cancellare tutte le tue partite da /account/tracker in qualsiasi momento: escono subito anche dalle statistiche, perché si calcolano al momento. Cancellando l'account si cancella tutto.",
  es: "OriginsMeta Analytics: la app para Windows solo lee los archivos que Origins TCG guarda en tu PC (estadísticas del perfil, mazos del inventario y la repetición de la última partida) y nunca toca el juego. Para mostrar las cartas, carga sus imágenes desde originsmeta.com. El historial de partidas se queda en tu PC, en la carpeta de datos de la app, hasta que vinculas la app a tu cuenta. Si la vinculas (con un código de un solo uso creado en /account/tracker), por cada partida envía al sitio: una huella de la partida calculada en el PC (nunca el identificador del juego), hora de fin, resultado, cola (clasificatoria o normal), tu mazo (nombre, cartas, código del juego), tu rango, las rondas y las cartas jugadas ronda a ronda; del rival, solo su Legendaria y las cartas que jugó. Nunca envía nombres ni identificadores de jugadores o partidas, el rango del rival, su mazo completo ni si el rival es un bot o una persona. El sitio añade el parche vigente y el arquetipo del mazo. Las partidas se guardan en Supabase (Irlanda, UE) y solo las ves tú, en /account/tracker, junto con el nombre de tus PC vinculados y la hora de su último envío; de la vinculación, la base de datos guarda solo una huella del token, que en el PC está cifrado con la protección de datos de Windows. Las solicitudes de la app pasan por los servidores del sitio (Vercel) y de Supabase, que conservan por poco tiempo los registros técnicos habituales (dirección IP incluida). Estadísticas anónimas: las partidas de quien vincula la app entran siempre en las estadísticas del sitio (win rate de Legendarias, mazos, arquetipos y cartas, enfrentamientos entre Legendarias), que muestran solo números agregados por parche, y cada número solo si viene de al menos 20 partidas de al menos 3 jugadores distintos: nunca partidas sueltas ni quién las jugó. Vincular la app significa aceptarlo; si no quieres, no la vincules: la app también funciona solo en tu PC. Puedes desvincular un PC y borrar todas tus partidas desde /account/tracker en cualquier momento: también salen enseguida de las estadísticas, porque se calculan en el momento. Si borras tu cuenta, se borra todo.",
  fr: "OriginsMeta Analytics : l'application Windows lit uniquement les fichiers qu'Origins TCG enregistre sur votre PC (statistiques du profil, decks de l'inventaire et replay de la dernière partie) et ne touche jamais au jeu. Pour afficher les cartes, elle charge leurs images depuis originsmeta.com. L'historique des parties reste sur votre PC, dans le dossier de données de l'application, jusqu'à ce que vous l'associiez à votre compte. Si vous l'associez (avec un code à usage unique créé dans /account/tracker), elle envoie au site, pour chaque partie : une empreinte de la partie calculée sur le PC (jamais l'identifiant du jeu), l'heure de fin, le résultat, la file d'attente (classée ou normale), votre deck (nom, cartes, code du jeu), votre rang, les manches et les cartes jouées manche par manche ; de l'adversaire, uniquement sa Légendaire et les cartes qu'il a jouées. Elle n'envoie jamais de noms ni d'identifiants de joueurs ou de parties, ni le rang de l'adversaire, ni son deck complet, ni si l'adversaire est un bot ou une personne. Le site ajoute le patch en vigueur et l'archétype du deck. Les parties sont stockées sur Supabase (Irlande, UE) et vous êtes la seule personne à pouvoir les voir, dans /account/tracker, avec le nom de vos PC associés et l'heure de leur dernier envoi ; de l'association, la base de données ne garde qu'une empreinte du jeton, qui est chiffré sur le PC avec la protection des données de Windows. Les requêtes de l'application passent par les serveurs du site (Vercel) et de Supabase, qui conservent brièvement les journaux techniques habituels (adresse IP comprise). Statistiques anonymes : les parties de toute personne qui associe l'application entrent toujours dans les statistiques du site (win rate des Légendaires, des decks, des archétypes et des cartes, confrontations entre Légendaires), qui n'affichent que des chiffres agrégés par patch, et chaque chiffre seulement s'il provient d'au moins 20 parties d'au moins 3 joueurs différents : jamais de parties isolées ni qui les a jouées. Associer l'application, c'est l'accepter ; si vous ne le souhaitez pas, ne l'associez pas : l'application fonctionne aussi sur votre PC seul. Vous pouvez dissocier un PC et supprimer toutes vos parties depuis /account/tracker à tout moment : elles sortent aussitôt des statistiques, parce qu'elles sont calculées à la volée. Supprimer votre compte supprime tout.",
};

/** Riempie i segnaposto `{nome}` (senza interpretare i `$` di `replace`). */
export function fillTracker(label: string, vars: Record<string, string | number>): string {
  return label.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
