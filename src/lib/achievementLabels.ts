import type { Locale } from "./i18n";
import type { AchievementId } from "./community/achievements";

/**
 * Etichette dei traguardi, dei numeri pubblici e dei tornei in evidenza sul profilo /u, della casella "Mostra i numeri
 * sulla vetrina" in /account e della riga dell'informativa privacy (pacchetto TRAGUARDI, 27/09/2026). Un modulo solo
 * per questo pacchetto, come creatorLabels.ts e deckStatsLabels.ts: l'inglese è il tipo di riferimento, italiano e
 * spagnolo si scrivono insieme. Spagnolo neutro con il tú (docs/spagnolo.md); nomi dei traguardi senza genere
 * ("Torneo vinto", non "Campione"). Il file importa solo tipi: si può passare ai componenti del browser.
 *
 * Segnaposto fra graffe, riempiti da `fillAchievement` (achievements.ts): {n} e {total} (traguardi), {name} (nome del
 * profilo), {date}, {months}, {votes} e {avg} (soglie del "mazzo apprezzato"), {min} e {stars} (voti positivi del
 * "mazzo del mese"), {words} (parole della guida).
 */

type AchievementText = { name: string; description: string };

const en = {
  achievements: {
    title: "Achievements",
    /** introduzione sulla vetrina (Creator, Autore, Pro, Staff) */
    intro: "Milestones reached on OriginsMeta, worked out from public data: decks, votes, tier lists and tournaments.",
    /** "3 of 11" */
    count: "{n} of {total}",
    /** nome dell'elenco per i lettori di schermo */
    listOf: "Achievements of {name}",
    hint: "Hover over a medal or tap it to see the details.",
    earnedOn: "Earned on {date}",
    since: "First time: {date}",
    times: "{n} times",
    months: "Months: {months}",
    items: {
      demo2: { name: "Demo 2.0 member", description: "Account created before Steam Next Fest (October 19, 2026), back in the Demo 2.0 days." },
      first_deck: { name: "First deck", description: "Published a first deck on OriginsMeta." },
      decks_5: { name: "Five decks", description: "Five published decks on OriginsMeta." },
      decks_10: { name: "Ten decks", description: "Ten published decks on OriginsMeta." },
      full_guide: { name: "Full guide", description: "A published deck with a guide of at least {words} words." },
      well_rated: { name: "Crowd favorite", description: "A published deck with at least {votes} votes and an average of {avg} stars or more." },
      deck_of_month: { name: "Deck of the month", description: "The deck with the most positive votes ({stars} or 5 stars) on the site in a calendar month, at least {min} that month." },
      tier_list: { name: "First tier list", description: "Saved a public tier list with the tier list maker." },
      tournament_played: { name: "Tournament played", description: "Played in the bracket of a public OriginsMeta tournament that reached its final." },
      tournament_organized: { name: "Tournament organized", description: "Organized a public tournament on OriginsMeta that was played to the final." },
      tournament_won: { name: "Tournament won", description: "Won the final of a public tournament on OriginsMeta." },
    } satisfies Record<AchievementId, AchievementText>,
  },
  stats: {
    title: "In numbers",
    /** pastiglia accanto al titolo: i numeri sono stime */
    estimates: "Estimates",
    decks: "Published decks",
    views: "Deck visits",
    codeCopies: "Game code copies",
    votes: "Votes received",
    /** nota sotto i numeri, con il primo giorno con un dato di visite e copie (mazzi e voti sono di sempre) */
    note: "Shown by choice of {name}: totals of all the published decks together. Visits and game code copies are counted from {date}: each browser tab counts once per deck, and bots and staff traffic are left out.",
    /** la stessa nota quando non c'è ancora un giorno con visite o copie */
    noteNoDate: "Shown by choice of {name}: totals of all the published decks together. Visits and game code copies: each browser tab counts once per deck, and bots and staff traffic are left out.",
  },
  tournaments: {
    intro: "Public tournaments organized on OriginsMeta: the ones coming up or in progress first, then the finished ones with their winner.",
    upcoming: "Coming up and in progress",
    finished: "Finished",
    /** {name} = chi ha vinto (link al suo profilo) */
    wonBy: "Won by {name}",
  },
  account: {
    title: "Numbers on your showcase",
    intro:
      "Your role has a showcase profile: you can show on your public page the totals of all your published decks together (decks, visits, game code copies, votes received). With a single published deck, the totals are that deck's numbers. The tables per day and per deck stay private, and you can hide the numbers again at any time.",
    checkbox: "Show my numbers on my profile showcase",
    save: "Save",
    saving: "Saving…",
    savedOn: "Saved: the numbers are visible on your public page.",
    savedOff: "Saved: the numbers are hidden.",
    missing: "This option isn't available yet. Please try again later.",
    readError: "We couldn't read your settings. Please try again later.",
    errors: {
      disabled: "Accounts are turned off on this site.",
      notLoggedIn: "Sign in again to change this setting.",
      notAllowed: "Only Creator, Author, Pro and Staff profiles can show their numbers.",
      missing: "This option isn't available yet. Please try again later.",
      db: "Saving failed. Please try again in a moment.",
    },
  },
  /** riga dell'informativa privacy (ancora #profile-stats) */
  privacy:
    "Achievements and public numbers on profiles: the achievements on every public profile are worked out from data that is already public on the site (sign-up date, published decks and their votes, public tier lists, public tournaments played to the final). People with the Creator, Author, Pro or Staff role can also choose, from their account page, to show on their public page the totals of all their published decks together (decks, visits, game code copies, votes received; with a single deck they match that deck's numbers). The tables per day and per deck stay private, and the numbers can be hidden again at any time.",
};

export type AchievementLabels = typeof en;

export const achievementLabels: Record<Locale, AchievementLabels> = {
  en,
  it: {
    achievements: {
      title: "Traguardi",
      intro: "Le tappe raggiunte su OriginsMeta, calcolate dai dati pubblici: mazzi, voti, tier list e tornei.",
      count: "{n} su {total}",
      listOf: "Traguardi di {name}",
      hint: "Passa sopra una medaglia o toccala per vedere il dettaglio.",
      earnedOn: "Ottenuto il {date}",
      since: "La prima volta: {date}",
      times: "{n} volte",
      months: "Mesi: {months}",
      items: {
        demo2: { name: "Dalla Demo 2.0", description: "Account creato prima dello Steam Next Fest (19 ottobre 2026), ai tempi della Demo 2.0." },
        first_deck: { name: "Primo mazzo", description: "Ha pubblicato il primo mazzo su OriginsMeta." },
        decks_5: { name: "Cinque mazzi", description: "Cinque mazzi pubblicati su OriginsMeta." },
        decks_10: { name: "Dieci mazzi", description: "Dieci mazzi pubblicati su OriginsMeta." },
        full_guide: { name: "Guida completa", description: "Un mazzo pubblicato con una guida di almeno {words} parole." },
        well_rated: { name: "Mazzo apprezzato", description: "Un mazzo pubblicato con almeno {votes} voti e una media di {avg} stelle o più." },
        deck_of_month: { name: "Mazzo del mese", description: "Il mazzo con più voti positivi ({stars} o 5 stelle) del sito in un mese, almeno {min} in quel mese." },
        tier_list: { name: "Prima tier list", description: "Ha salvato una tier list pubblica con lo strumento delle tier list." },
        tournament_played: { name: "Torneo giocato", description: "Ha giocato nel tabellone di un torneo pubblico di OriginsMeta arrivato alla finale." },
        tournament_organized: { name: "Torneo organizzato", description: "Ha organizzato su OriginsMeta un torneo pubblico giocato fino alla finale." },
        tournament_won: { name: "Torneo vinto", description: "Ha vinto la finale di un torneo pubblico su OriginsMeta." },
      },
    },
    stats: {
      title: "In numeri",
      estimates: "Stime",
      decks: "Mazzi pubblicati",
      views: "Visite ai mazzi",
      codeCopies: "Copie del codice del gioco",
      votes: "Voti ricevuti",
      note: "Mostrati per scelta di {name}: totali di tutti i mazzi pubblicati insieme. Visite e copie del codice del gioco contano dal {date}: ogni scheda del browser conta una volta per mazzo, e restano fuori i bot e il traffico dello staff.",
      noteNoDate: "Mostrati per scelta di {name}: totali di tutti i mazzi pubblicati insieme. Visite e copie del codice del gioco: ogni scheda del browser conta una volta per mazzo, e restano fuori i bot e il traffico dello staff.",
    },
    tournaments: {
      intro: "I tornei pubblici organizzati su OriginsMeta: prima quelli in arrivo o in corso, poi i conclusi con chi li ha vinti.",
      upcoming: "In arrivo e in corso",
      finished: "Conclusi",
      wonBy: "Ha vinto {name}",
    },
    account: {
      title: "I numeri sulla vetrina",
      intro:
        "Il tuo ruolo ha un profilo vetrina: puoi mostrare sulla tua pagina pubblica i totali di tutti i mazzi che hai pubblicato, insieme (mazzi, visite, copie del codice del gioco, voti ricevuti). Con un solo mazzo pubblicato i totali sono i numeri di quel mazzo. Le tabelle per giorno e per mazzo restano private, e puoi nascondere di nuovo i numeri quando vuoi.",
      checkbox: "Mostra i numeri sulla vetrina del profilo",
      save: "Salva",
      saving: "Salvataggio…",
      savedOn: "Salvato: i numeri si vedono sulla tua pagina pubblica.",
      savedOff: "Salvato: i numeri sono nascosti.",
      missing: "Questa opzione non è ancora disponibile. Riprova più tardi.",
      readError: "Non siamo riusciti a leggere le tue impostazioni. Riprova più tardi.",
      errors: {
        disabled: "Gli account sono spenti su questo sito.",
        notLoggedIn: "Rifai l'accesso per cambiare questa impostazione.",
        notAllowed: "Solo i profili Creator, Autore, Pro e Staff possono mostrare i propri numeri.",
        missing: "Questa opzione non è ancora disponibile. Riprova più tardi.",
        db: "Salvataggio non riuscito. Riprova tra poco.",
      },
    },
    privacy:
      "Traguardi e numeri pubblici dei profili: i traguardi di ogni profilo pubblico si calcolano da dati già pubblici sul sito (data d'iscrizione, mazzi pubblicati e i loro voti, tier list pubbliche, tornei pubblici giocati fino alla finale). Chi ha il ruolo Creator, Autore, Pro o Staff può anche scegliere, dalla pagina del proprio account, di mostrare sulla sua pagina pubblica i totali di tutti i suoi mazzi pubblicati insieme (mazzi, visite, copie del codice del gioco, voti ricevuti; con un solo mazzo coincidono con i numeri di quel mazzo). Le tabelle per giorno e per mazzo restano private, e i numeri si possono nascondere di nuovo quando si vuole.",
  },
  es: {
    achievements: {
      title: "Logros",
      intro: "Las metas alcanzadas en OriginsMeta, calculadas a partir de los datos públicos: mazos, votos, tier lists y torneos.",
      count: "{n} de {total}",
      listOf: "Logros de {name}",
      hint: "Pasa el cursor sobre una medalla o tócala para ver el detalle.",
      earnedOn: "Obtenido el {date}",
      since: "La primera vez: {date}",
      times: "{n} veces",
      months: "Meses: {months}",
      items: {
        demo2: { name: "Desde la Demo 2.0", description: "Cuenta creada antes del Steam Next Fest (19 de octubre de 2026), en los tiempos de la Demo 2.0." },
        first_deck: { name: "Primer mazo", description: "Publicó su primer mazo en OriginsMeta." },
        decks_5: { name: "Cinco mazos", description: "Cinco mazos publicados en OriginsMeta." },
        decks_10: { name: "Diez mazos", description: "Diez mazos publicados en OriginsMeta." },
        full_guide: { name: "Guía completa", description: "Un mazo publicado con una guía de al menos {words} palabras." },
        well_rated: { name: "Mazo favorito", description: "Un mazo publicado con al menos {votes} votos y una media de {avg} estrellas o más." },
        deck_of_month: { name: "Mazo del mes", description: "El mazo con más votos positivos ({stars} o 5 estrellas) del sitio en un mes, al menos {min} ese mes." },
        tier_list: { name: "Primera tier list", description: "Guardó una tier list pública con la herramienta de tier lists." },
        tournament_played: { name: "Torneo jugado", description: "Jugó en el cuadro de un torneo público de OriginsMeta que llegó a la final." },
        tournament_organized: { name: "Torneo organizado", description: "Organizó en OriginsMeta un torneo público que se jugó hasta la final." },
        tournament_won: { name: "Torneo ganado", description: "Ganó la final de un torneo público en OriginsMeta." },
      },
    },
    stats: {
      title: "En números",
      estimates: "Estimaciones",
      decks: "Mazos publicados",
      views: "Visitas a los mazos",
      codeCopies: "Copias del código del juego",
      votes: "Votos recibidos",
      note: "Se muestran por decisión de {name}: totales de todos los mazos publicados juntos. Las visitas y las copias del código del juego se cuentan desde el {date}: cada pestaña del navegador cuenta una vez por mazo, y quedan fuera los bots y el tráfico del staff.",
      noteNoDate: "Se muestran por decisión de {name}: totales de todos los mazos publicados juntos. Visitas y copias del código del juego: cada pestaña del navegador cuenta una vez por mazo, y quedan fuera los bots y el tráfico del staff.",
    },
    tournaments: {
      intro: "Los torneos públicos organizados en OriginsMeta: primero los próximos o en curso, luego los terminados con quien los ganó.",
      upcoming: "Próximos y en curso",
      finished: "Terminados",
      wonBy: "Ganó {name}",
    },
    account: {
      title: "Los números en tu vitrina",
      intro:
        "Tu rol tiene un perfil vitrina: puedes mostrar en tu página pública los totales de todos los mazos que publicaste, juntos (mazos, visitas, copias del código del juego, votos recibidos). Con un solo mazo publicado, los totales son los números de ese mazo. Las tablas por día y por mazo siguen siendo privadas, y puedes ocultar de nuevo los números cuando quieras.",
      checkbox: "Mostrar mis números en la vitrina del perfil",
      save: "Guardar",
      saving: "Guardando…",
      savedOn: "Guardado: los números se ven en tu página pública.",
      savedOff: "Guardado: los números están ocultos.",
      missing: "Esta opción todavía no está disponible. Vuelve a intentarlo más tarde.",
      readError: "No pudimos leer tu configuración. Vuelve a intentarlo más tarde.",
      errors: {
        disabled: "Las cuentas están desactivadas en este sitio.",
        notLoggedIn: "Vuelve a iniciar sesión para cambiar esta opción.",
        notAllowed: "Solo los perfiles Creator, Autor, Pro y Staff pueden mostrar sus números.",
        missing: "Esta opción todavía no está disponible. Vuelve a intentarlo más tarde.",
        db: "No se pudo guardar. Vuelve a intentarlo en un momento.",
      },
    },
    privacy:
      "Logros y números públicos de los perfiles: los logros de cada perfil público se calculan con datos que ya son públicos en el sitio (fecha de registro, mazos publicados y sus votos, tier lists públicas, torneos públicos jugados hasta la final). Quien tiene el rol Creator, Autor, Pro o Staff también puede elegir, desde la página de su cuenta, mostrar en su página pública los totales de todos sus mazos publicados juntos (mazos, visitas, copias del código del juego, votos recibidos; con un solo mazo coinciden con los números de ese mazo). Las tablas por día y por mazo siguen siendo privadas, y los números se pueden ocultar de nuevo cuando se quiera.",
  },
};
