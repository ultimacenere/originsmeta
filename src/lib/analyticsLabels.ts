import type { Locale } from "./i18n";

/**
 * Testi della pagina /analytics (02/10/2026, Pierluigi: "togliamo la pagina del winrate, creiamo una pagina invece
 * […] in cui spieghiamo anche con screenshot che il tool esiste ed è pronto, ma con la nuova patch son stati rimossi
 * tutti i dati di gioco. poi al suo interno un bel tasto sia sopra che sotto, 'sei interessato al tool?', così
 * raccogliamo i numeri di chi vorrebbe il tool poi andrò da Kevin a mostrarglielo"). Un modulo solo nelle tre lingue,
 * l'inglese è il tipo di riferimento; spagnolo neutro col tú (docs/spagnolo.md).
 *
 * Solo fatti verificati: fino alla 0.6 il gioco salvava a fine partita un replay (mazzi, carte giocate, Leggendaria
 * avversaria); dalla 0.7 (29/09/2026) il replay non c'è più e sul PC restano pochi dati di una parte delle partite
 * (docs/tracker.md, "I file del gioco"). Nessuna intenzione attribuita a Koin Games, e sempre "non affiliato".
 * Regola del tracker: nessuna parola su bot o persone.
 */
const en = {
  meta: {
    /** titolo della SERP: contiene OriginsMeta, quindi `pageTitle` lo lascia com'è (entro 60 caratteri, test) */
    title: "OriginsMeta Analytics: the match tracker for Origins TCG",
    description: "OriginsMeta Analytics records your Origins TCG matches on its own: decks, results, an overlay for OBS. Paused since patch 0.7: tell us if you want it.",
  },
  kicker: "Our tool",
  h1: "OriginsMeta Analytics",
  lead: "A Windows app that records your Origins TCG matches on its own while you play: your deck, the result, the cards played round by round, the Legendary you faced. It's ready and it works, but with the demo's 0.7 update the game stopped saving on your PC the match data the tool read, so for now it's paused.",
  paused: "Paused since patch 0.7",
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
  what: {
    title: "What it does",
    items: [
      "Records every match on its own, without touching the game: it only reads the files Origins TCG saves on your PC.",
      "Shows the deck selected in the game with all its cards, today's matches and your win rate, deck by deck.",
      "For every match: your deck as cards, the game code to copy and, when the game saved it, the match round by round.",
      "An overlay above the game and a source for OBS, for streamers: deck, session and last match.",
      "Linked to your OriginsMeta account, it brings your matches to the site: your stats and, for everyone, anonymous win rates of Legendaries, decks and cards.",
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
  why: {
    title: "Why it's paused",
    paragraphs: [
      "The tool doesn't read the game's servers and never touches the game: it only reads the files Origins TCG saves on your PC. Up to patch 0.6, at the end of every match the game saved a replay with both decks, the cards played and the opposing Legendary.",
      "With the demo's 0.7 update (September 29, 2026) that replay is gone, and the PC only keeps a little data about some of the matches: too little for reliable stats. That's why the win rate pages are switched off.",
      "The tool stays ready: if match data becomes available again, it starts again right away.",
    ],
  },
  koin: {
    title: "We'll show it to Koin Games",
    text: "We want to present it to the Koin Games team and ask whether match data can be made available again for tools like this one. The more players ask, the more the request counts: if you're interested, press the button below.",
    unofficial: "OriginsMeta is an unofficial fan site, not affiliated with Koin Games.",
  },
};

export type AnalyticsLabels = typeof en;

export const analyticsLabels: Record<Locale, AnalyticsLabels> = {
  en,
  it: {
    meta: {
      title: "OriginsMeta Analytics: il tracker di partite per Origins TCG",
      description: "OriginsMeta Analytics registra da solo le tue partite di Origins TCG: mazzi, esiti, overlay per OBS. In pausa dalla patch 0.7: dicci se lo vuoi.",
    },
    kicker: "Il nostro tool",
    h1: "OriginsMeta Analytics",
    lead: "Un'app per Windows che registra da sola le tue partite di Origins TCG mentre giochi: il mazzo, l'esito, le carte giocate round per round, la Leggendaria che avevi di fronte. È pronta e funziona, ma con l'aggiornamento 0.7 della demo il gioco ha smesso di salvare sul PC i dati delle partite che il tool leggeva, quindi per ora è in pausa.",
    paused: "In pausa dalla patch 0.7",
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
    what: {
      title: "Che cosa fa",
      items: [
        "Registra da solo ogni partita, senza toccare il gioco: legge solo i file che Origins TCG salva sul tuo PC.",
        "Ti mostra il mazzo scelto nel gioco con tutte le carte, le partite di oggi e il tuo win rate, mazzo per mazzo.",
        "Per ogni partita: il tuo mazzo in carte, il codice del gioco da copiare e, quando il gioco la salvava, la partita round per round.",
        "Overlay sopra il gioco e sorgente per OBS, per chi fa dirette: mazzo, sessione e ultima partita.",
        "Collegato al tuo account OriginsMeta, porta le partite sul sito: le tue statistiche e, per tutti, i win rate anonimi di Leggendarie, mazzi e carte.",
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
    why: {
      title: "Perché è in pausa",
      paragraphs: [
        "Il tool non legge i server del gioco e non tocca mai il gioco: legge solo i file che Origins TCG salva sul tuo PC. Fino alla patch 0.6, a fine partita il gioco salvava un replay con i due mazzi, le carte giocate e la Leggendaria avversaria.",
        "Con l'aggiornamento 0.7 della demo (29 settembre 2026) quel replay non c'è più, e sul PC restano solo pochi dati di una parte delle partite: troppo poco per statistiche affidabili. Per questo le pagine dei win rate sono spente.",
        "Il tool resta pronto: se i dati delle partite tornano disponibili, riparte subito.",
      ],
    },
    koin: {
      title: "Lo mostreremo a Koin Games",
      text: "Vogliamo presentarlo al team di Koin Games e chiedere se i dati delle partite possono tornare disponibili per strumenti come questo. Più giocatori lo chiedono, più la richiesta pesa: se ti interessa, premi il tasto qui sotto.",
      unofficial: "OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.",
    },
  },
  es: {
    meta: {
      title: "OriginsMeta Analytics: tracker de partidas de Origins TCG",
      description: "OriginsMeta Analytics registra solo tus partidas de Origins TCG: mazos, resultados y overlay para OBS. En pausa desde el parche 0.7: dinos si lo quieres.",
    },
    kicker: "Nuestra herramienta",
    h1: "OriginsMeta Analytics",
    lead: "Una app para Windows que registra sola tus partidas de Origins TCG mientras juegas: tu mazo, el resultado, las cartas jugadas ronda a ronda, la Legendaria que tenías enfrente. Está lista y funciona, pero con la actualización 0.7 de la demo el juego dejó de guardar en tu PC los datos de las partidas que leía la herramienta, así que por ahora está en pausa.",
    paused: "En pausa desde el parche 0.7",
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
    what: {
      title: "Qué hace",
      items: [
        "Registra sola cada partida, sin tocar el juego: solo lee los archivos que Origins TCG guarda en tu PC.",
        "Te muestra el mazo elegido en el juego con todas sus cartas, las partidas de hoy y tu win rate, mazo por mazo.",
        "En cada partida: tu mazo en cartas, el código del juego para copiar y, cuando el juego la guardaba, la partida ronda a ronda.",
        "Overlay sobre el juego y fuente para OBS, para quien hace directos: mazo, sesión y última partida.",
        "Vinculada a tu cuenta de OriginsMeta, lleva tus partidas al sitio: tus estadísticas y, para todos, el win rate anónimo de Legendarias, mazos y cartas.",
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
    why: {
      title: "Por qué está en pausa",
      paragraphs: [
        "La herramienta no lee los servidores del juego y nunca toca el juego: solo lee los archivos que Origins TCG guarda en tu PC. Hasta el parche 0.6, al final de cada partida el juego guardaba una repetición con los dos mazos, las cartas jugadas y la Legendaria rival.",
        "Con la actualización 0.7 de la demo (29 de septiembre de 2026) esa repetición ya no existe, y en el PC solo quedan pocos datos de una parte de las partidas: demasiado poco para estadísticas fiables. Por eso las páginas de win rate están apagadas.",
        "La herramienta sigue lista: si los datos de las partidas vuelven a estar disponibles, arranca de nuevo enseguida.",
      ],
    },
    koin: {
      title: "Se la mostraremos a Koin Games",
      text: "Queremos presentársela al equipo de Koin Games y preguntar si los datos de las partidas pueden volver a estar disponibles para herramientas como esta. Cuantos más jugadores lo pidan, más pesa la petición: si te interesa, pulsa el botón de abajo.",
      unofficial: "OriginsMeta es un sitio fan no oficial, sin afiliación con Koin Games.",
    },
  },
};

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
};
