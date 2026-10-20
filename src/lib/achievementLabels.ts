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
  // Francese dal 07/10/2026 (docs/francese.md): vous, "succès" per i traguardi, "vitrine" per la vetrina, "tableau" per
  // il tabellone del torneo; nomi dei traguardi senza genere ("Tournoi gagné"), descrizioni entro 160 caratteri (test).
  fr: {
    achievements: {
      title: "Succès",
      intro: "Les étapes franchies sur OriginsMeta, calculées à partir des données publiques : decks, votes, tier lists et tournois.",
      count: "{n} sur {total}",
      listOf: "Succès de {name}",
      hint: "Survolez une médaille ou touchez-la pour voir le détail.",
      earnedOn: "Obtenu le {date}",
      since: "Première fois : {date}",
      times: "{n} fois",
      months: "Mois : {months}",
      items: {
        demo2: { name: "Depuis la Demo 2.0", description: "Compte créé avant le Steam Next Fest (19 octobre 2026), à l'époque de la Demo 2.0." },
        first_deck: { name: "Premier deck", description: "A publié un premier deck sur OriginsMeta." },
        decks_5: { name: "Cinq decks", description: "Cinq decks publiés sur OriginsMeta." },
        decks_10: { name: "Dix decks", description: "Dix decks publiés sur OriginsMeta." },
        full_guide: { name: "Guide complet", description: "Un deck publié avec un guide d'au moins {words} mots." },
        well_rated: { name: "Deck apprécié", description: "Un deck publié avec au moins {votes} votes et une moyenne de {avg} étoiles ou plus." },
        deck_of_month: { name: "Deck du mois", description: "Le deck avec le plus de votes positifs ({stars} ou 5 étoiles) du site sur un mois, au moins {min} ce mois-là." },
        tier_list: { name: "Première tier list", description: "A enregistré une tier list publique avec l'outil de tier list." },
        tournament_played: { name: "Tournoi joué", description: "A joué dans le tableau d'un tournoi public d'OriginsMeta arrivé jusqu'à sa finale." },
        tournament_organized: { name: "Tournoi organisé", description: "A organisé sur OriginsMeta un tournoi public joué jusqu'à la finale." },
        tournament_won: { name: "Tournoi gagné", description: "A gagné la finale d'un tournoi public sur OriginsMeta." },
      },
    },
    stats: {
      title: "En chiffres",
      estimates: "Estimations",
      decks: "Decks publiés",
      views: "Visites des decks",
      codeCopies: "Copies du code du jeu",
      votes: "Votes reçus",
      note: "Affichés au choix de {name} : totaux de tous les decks publiés réunis. Les visites et les copies du code du jeu sont comptées depuis le {date} : chaque onglet du navigateur compte une fois par deck, et les bots et le trafic du staff sont exclus.",
      noteNoDate: "Affichés au choix de {name} : totaux de tous les decks publiés réunis. Visites et copies du code du jeu : chaque onglet du navigateur compte une fois par deck, et les bots et le trafic du staff sont exclus.",
    },
    tournaments: {
      intro: "Les tournois publics organisés sur OriginsMeta : d'abord ceux à venir ou en cours, puis les tournois terminés avec leur vainqueur.",
      upcoming: "À venir et en cours",
      finished: "Terminés",
      wonBy: "Remporté par {name}",
    },
    account: {
      title: "Les chiffres sur votre vitrine",
      intro:
        "Votre rôle a un profil vitrine : vous pouvez afficher sur votre page publique les totaux de tous vos decks publiés réunis (decks, visites, copies du code du jeu, votes reçus). Avec un seul deck publié, les totaux sont les chiffres de ce deck. Les tableaux par jour et par deck restent privés, et vous pouvez masquer à nouveau les chiffres à tout moment.",
      checkbox: "Afficher mes chiffres sur la vitrine de mon profil",
      save: "Enregistrer",
      saving: "Enregistrement…",
      savedOn: "Enregistré : les chiffres sont visibles sur votre page publique.",
      savedOff: "Enregistré : les chiffres sont masqués.",
      missing: "Cette option n'est pas encore disponible. Réessayez plus tard.",
      readError: "Nous n'avons pas pu lire vos réglages. Réessayez plus tard.",
      errors: {
        disabled: "Les comptes sont désactivés sur ce site.",
        notLoggedIn: "Reconnectez-vous pour modifier ce réglage.",
        notAllowed: "Seuls les profils Creator, Auteur, Pro et Staff peuvent afficher leurs chiffres.",
        missing: "Cette option n'est pas encore disponible. Réessayez plus tard.",
        db: "L'enregistrement a échoué. Réessayez dans un instant.",
      },
    },
    privacy:
      "Succès et chiffres publics des profils : les succès de chaque profil public sont calculés à partir de données déjà publiques sur le site (date d'inscription, decks publiés et leurs votes, tier lists publiques, tournois publics joués jusqu'à la finale). Les personnes ayant le rôle Creator, Auteur, Pro ou Staff peuvent aussi choisir, depuis la page de leur compte, d'afficher sur leur page publique les totaux de tous leurs decks publiés réunis (decks, visites, copies du code du jeu, votes reçus ; avec un seul deck, ils correspondent aux chiffres de ce deck). Les tableaux par jour et par deck restent privés, et les chiffres peuvent être masqués à nouveau à tout moment.",
  },
  pt: {
    achievements: {
      title: "Conquistas",
      intro: "Marcos alcançados no OriginsMeta, calculados a partir de dados públicos: decks, votos, tier lists e torneios.",
      count: "{n} de {total}",
      listOf: "Conquistas de {name}",
      hint: "Passe o mouse sobre uma medalha ou toque nela para ver os detalhes.",
      earnedOn: "Conquistada em {date}",
      since: "Primeira vez: {date}",
      times: "{n} vezes",
      months: "Meses: {months}",
      items: {
        demo2: { name: "Desde a Demo 2.0", description: "Conta criada antes do Steam Next Fest (19 de outubro de 2026), nos tempos da Demo 2.0." },
        first_deck: { name: "Primeiro deck", description: "Publicou um primeiro deck no OriginsMeta." },
        decks_5: { name: "Cinco decks", description: "Cinco decks publicados no OriginsMeta." },
        decks_10: { name: "Dez decks", description: "Dez decks publicados no OriginsMeta." },
        full_guide: { name: "Guia completo", description: "Um deck publicado com um guia de pelo menos {words} palavras." },
        well_rated: { name: "Deck querido", description: "Um deck publicado com pelo menos {votes} votos e média de {avg} estrelas ou mais." },
        deck_of_month: { name: "Deck do mês", description: "O deck com mais votos positivos ({stars} ou 5 estrelas) do site em um mês do calendário, pelo menos {min} naquele mês." },
        tier_list: { name: "Primeira tier list", description: "Salvou uma tier list pública com o criador de tier lists." },
        tournament_played: { name: "Torneio jogado", description: "Jogou na chave de um torneio público do OriginsMeta que chegou à final." },
        tournament_organized: { name: "Torneio organizado", description: "Organizou no OriginsMeta um torneio público jogado até a final." },
        tournament_won: { name: "Torneio vencido", description: "Venceu a final de um torneio público no OriginsMeta." },
      },
    },
    stats: {
      title: "Em números",
      estimates: "Estimativas",
      decks: "Decks publicados",
      views: "Visitas aos decks",
      codeCopies: "Cópias do código do jogo",
      votes: "Votos recebidos",
      note: "Exibidos por escolha de {name}: totais de todos os decks publicados juntos. As visitas e as cópias do código do jogo são contadas desde {date}: cada aba do navegador conta uma vez por deck, e os bots e o tráfego do staff ficam de fora.",
      noteNoDate: "Exibidos por escolha de {name}: totais de todos os decks publicados juntos. Visitas e cópias do código do jogo: cada aba do navegador conta uma vez por deck, e os bots e o tráfego do staff ficam de fora.",
    },
    tournaments: {
      intro: "Os torneios públicos organizados no OriginsMeta: primeiro os que estão por vir ou em andamento, depois os encerrados com o vencedor.",
      upcoming: "Por vir e em andamento",
      finished: "Encerrados",
      wonBy: "Vencido por {name}",
    },
    account: {
      title: "Números na sua vitrine",
      intro:
        "O seu papel tem um perfil vitrine: você pode mostrar na sua página pública os totais de todos os seus decks publicados juntos (decks, visitas, cópias do código do jogo, votos recebidos). Com um só deck publicado, os totais são os números desse deck. As tabelas por dia e por deck continuam privadas, e você pode ocultar os números de novo a qualquer momento.",
      checkbox: "Mostrar os meus números na vitrine do meu perfil",
      save: "Salvar",
      saving: "Salvando…",
      savedOn: "Salvo: os números estão visíveis na sua página pública.",
      savedOff: "Salvo: os números estão ocultos.",
      missing: "Esta opção ainda não está disponível. Tente de novo mais tarde.",
      readError: "Não conseguimos ler as suas configurações. Tente de novo mais tarde.",
      errors: {
        disabled: "As contas estão desativadas neste site.",
        notLoggedIn: "Entre de novo para mudar esta configuração.",
        notAllowed: "Só os perfis Creator, Autor, Pro e Staff podem mostrar os seus números.",
        missing: "Esta opção ainda não está disponível. Tente de novo mais tarde.",
        db: "Não foi possível salvar. Tente de novo daqui a pouco.",
      },
    },
    privacy:
      "Conquistas e números públicos dos perfis: as conquistas de cada perfil público são calculadas a partir de dados que já são públicos no site (data de cadastro, decks publicados e seus votos, tier lists públicas, torneios públicos jogados até a final). Quem tem o papel Creator, Autor, Pro ou Staff também pode escolher, na página da sua conta, mostrar na sua página pública os totais de todos os seus decks publicados juntos (decks, visitas, cópias do código do jogo, votos recebidos; com um só deck, eles coincidem com os números desse deck). As tabelas por dia e por deck continuam privadas, e os números podem ser ocultados de novo a qualquer momento.",
  },
  de: {
    achievements: {
      title: "Erfolge",
      intro: "Meilensteine auf OriginsMeta, berechnet aus öffentlichen Daten: Decks, Bewertungen, Tier-Lists und Turniere.",
      count: "{n} von {total}",
      listOf: "Erfolge von {name}",
      hint: "Fahre mit der Maus über eine Medaille oder tippe darauf, um die Details zu sehen.",
      earnedOn: "Erreicht am {date}",
      since: "Zum ersten Mal: {date}",
      times: "{n}-mal",
      months: "Monate: {months}",
      items: {
        demo2: { name: "Seit der Demo 2.0", description: "Konto vor dem Steam Next Fest (19. Oktober 2026) erstellt, noch zu Zeiten der Demo 2.0." },
        first_deck: { name: "Erstes Deck", description: "Ein erstes Deck auf OriginsMeta veröffentlicht." },
        decks_5: { name: "Fünf Decks", description: "Fünf veröffentlichte Decks auf OriginsMeta." },
        decks_10: { name: "Zehn Decks", description: "Zehn veröffentlichte Decks auf OriginsMeta." },
        full_guide: { name: "Kompletter Guide", description: "Ein veröffentlichtes Deck mit einem Guide von mindestens {words} Wörtern." },
        well_rated: { name: "Publikumsliebling", description: "Ein veröffentlichtes Deck mit mindestens {votes} Bewertungen und einem Schnitt von {avg} Sternen oder mehr." },
        deck_of_month: { name: "Deck des Monats", description: "Das Deck mit den meisten positiven Bewertungen ({stars} oder 5 Sterne) auf der Website in einem Kalendermonat, mindestens {min} in diesem Monat." },
        tier_list: { name: "Erste Tier-List", description: "Eine öffentliche Tier-List mit dem Tier-List-Tool gespeichert." },
        tournament_played: { name: "Turnier gespielt", description: "Im Turnierbaum eines öffentlichen OriginsMeta-Turniers gespielt, das bis zum Finale kam." },
        tournament_organized: { name: "Turnier organisiert", description: "Auf OriginsMeta ein öffentliches Turnier organisiert, das bis zum Finale gespielt wurde." },
        tournament_won: { name: "Turnier gewonnen", description: "Das Finale eines öffentlichen Turniers auf OriginsMeta gewonnen." },
      },
    },
    stats: {
      title: "In Zahlen",
      estimates: "Schätzungen",
      decks: "Veröffentlichte Decks",
      views: "Deck-Besuche",
      codeCopies: "Kopien des Spielcodes",
      votes: "Erhaltene Bewertungen",
      note: "Angezeigt nach Wahl von {name}: Summen aller veröffentlichten Decks zusammen. Besuche und Kopien des Spielcodes werden seit {date} gezählt: Jeder Browser-Tab zählt einmal pro Deck, Bots und Staff-Traffic bleiben außen vor.",
      noteNoDate: "Angezeigt nach Wahl von {name}: Summen aller veröffentlichten Decks zusammen. Besuche und Kopien des Spielcodes: Jeder Browser-Tab zählt einmal pro Deck, Bots und Staff-Traffic bleiben außen vor.",
    },
    tournaments: {
      intro: "Öffentliche Turniere, die auf OriginsMeta organisiert wurden: zuerst die kommenden und laufenden, dann die beendeten mit ihrem Sieger.",
      upcoming: "Kommend und laufend",
      finished: "Beendet",
      wonBy: "Gewonnen von {name}",
    },
    account: {
      title: "Zahlen in deinem Schaufenster",
      intro:
        "Deine Rolle hat ein Schaufenster-Profil: Du kannst auf deiner öffentlichen Seite die Summen aller deiner veröffentlichten Decks zusammen zeigen (Decks, Besuche, Kopien des Spielcodes, erhaltene Bewertungen). Mit nur einem veröffentlichten Deck sind die Summen die Zahlen dieses Decks. Die Tabellen pro Tag und pro Deck bleiben privat, und du kannst die Zahlen jederzeit wieder ausblenden.",
      checkbox: "Meine Zahlen im Schaufenster meines Profils zeigen",
      save: "Speichern",
      saving: "Wird gespeichert …",
      savedOn: "Gespeichert: Die Zahlen sind auf deiner öffentlichen Seite sichtbar.",
      savedOff: "Gespeichert: Die Zahlen sind ausgeblendet.",
      missing: "Diese Option ist noch nicht verfügbar. Versuch es später noch einmal.",
      readError: "Wir konnten deine Einstellungen nicht lesen. Versuch es später noch einmal.",
      errors: {
        disabled: "Konten sind auf dieser Website deaktiviert.",
        notLoggedIn: "Melde dich erneut an, um diese Einstellung zu ändern.",
        notAllowed: "Nur Profile mit der Rolle Creator, Autor, Pro und Staff können ihre Zahlen zeigen.",
        missing: "Diese Option ist noch nicht verfügbar. Versuch es später noch einmal.",
        db: "Speichern fehlgeschlagen. Versuch es gleich noch einmal.",
      },
    },
    privacy:
      "Erfolge und öffentliche Zahlen in Profilen: Die Erfolge jedes öffentlichen Profils werden aus Daten berechnet, die auf der Website bereits öffentlich sind (Registrierungsdatum, veröffentlichte Decks und ihre Bewertungen, öffentliche Tier-Lists, öffentliche Turniere, die bis zum Finale gespielt wurden). Personen mit der Rolle Creator, Autor, Pro oder Staff können außerdem auf ihrer Kontoseite wählen, auf ihrer öffentlichen Seite die Summen aller ihrer veröffentlichten Decks zusammen zu zeigen (Decks, Besuche, Kopien des Spielcodes, erhaltene Bewertungen; bei nur einem Deck entsprechen sie den Zahlen dieses Decks). Die Tabellen pro Tag und pro Deck bleiben privat, und die Zahlen lassen sich jederzeit wieder ausblenden.",
  },
  ru: {
    achievements: {
      title: "Достижения",
      intro: "Вехи на OriginsMeta, рассчитанные по публичным данным: колоды, оценки, тир-листы и турниры.",
      count: "{n} из {total}",
      listOf: "Достижения: {name}",
      hint: "Наведите курсор на медаль или нажмите на неё, чтобы увидеть подробности.",
      earnedOn: "Получено {date}",
      since: "Впервые: {date}",
      times: "Раз: {n}",
      months: "Месяцы: {months}",
      items: {
        demo2: { name: "Со времён Demo 2.0", description: "Аккаунт создан до Steam Next Fest (19 октября 2026), ещё во времена Demo 2.0." },
        first_deck: { name: "Первая колода", description: "Опубликована первая колода на OriginsMeta." },
        decks_5: { name: "Пять колод", description: "Пять опубликованных колод на OriginsMeta." },
        decks_10: { name: "Десять колод", description: "Десять опубликованных колод на OriginsMeta." },
        full_guide: { name: "Полный гайд", description: "Опубликованная колода с гайдом не короче {words} слов." },
        well_rated: { name: "Любимица публики", description: "Опубликованная колода с не менее чем {votes} оценками и средней оценкой от {avg} звёзд." },
        deck_of_month: { name: "Колода месяца", description: "Колода с наибольшим числом положительных оценок ({stars} или 5 звёзд) на сайте за календарный месяц, не меньше {min} за этот месяц." },
        tier_list: { name: "Первый тир-лист", description: "Сохранён публичный тир-лист в конструкторе тир-листов." },
        tournament_played: { name: "Турнир сыгран", description: "Участие в сетке публичного турнира OriginsMeta, дошедшего до финала." },
        tournament_organized: { name: "Турнир организован", description: "Организован публичный турнир на OriginsMeta, сыгранный до финала." },
        tournament_won: { name: "Турнир выигран", description: "Победа в финале публичного турнира на OriginsMeta." },
      },
    },
    stats: {
      title: "В цифрах",
      estimates: "Оценочные данные",
      decks: "Опубликованные колоды",
      views: "Посещения колод",
      codeCopies: "Копирования кода игры",
      votes: "Полученные оценки",
      note: "Показано по выбору {name}: итоги всех опубликованных колод вместе. Посещения и копирования кода игры учитываются с {date}: каждая вкладка браузера считается один раз на колоду, боты и трафик команды Staff исключаются.",
      noteNoDate: "Показано по выбору {name}: итоги всех опубликованных колод вместе. Посещения и копирования кода игры: каждая вкладка браузера считается один раз на колоду, боты и трафик команды Staff исключаются.",
    },
    tournaments: {
      intro: "Публичные турниры, организованные на OriginsMeta: сначала предстоящие и текущие, затем завершённые с их победителем.",
      upcoming: "Предстоящие и текущие",
      finished: "Завершённые",
      wonBy: "Победитель: {name}",
    },
    account: {
      title: "Числа на вашей витрине",
      intro:
        "У вашей роли есть профиль с витриной: на своей публичной странице вы можете показать итоги всех ваших опубликованных колод вместе (колоды, посещения, копирования кода игры, полученные оценки). Если опубликованная колода одна, итоги — это её числа. Таблицы по дням и по колодам остаются приватными, а числа можно снова скрыть в любой момент.",
      checkbox: "Показывать мои числа на витрине профиля",
      save: "Сохранить",
      saving: "Сохраняем…",
      savedOn: "Сохранено: числа видны на вашей публичной странице.",
      savedOff: "Сохранено: числа скрыты.",
      missing: "Эта настройка пока недоступна. Попробуйте позже.",
      readError: "Не удалось прочитать ваши настройки. Попробуйте позже.",
      errors: {
        disabled: "Аккаунты на этом сайте отключены.",
        notLoggedIn: "Войдите снова, чтобы изменить эту настройку.",
        notAllowed: "Показывать свои числа могут только профили с ролями Creator, Автор, Pro и Staff.",
        missing: "Эта настройка пока недоступна. Попробуйте позже.",
        db: "Сохранить не удалось. Попробуйте ещё раз через минуту.",
      },
    },
    privacy:
      "Достижения и публичные числа в профилях: достижения в каждом публичном профиле рассчитываются по данным, которые уже публичны на сайте (дата регистрации, опубликованные колоды и их оценки, публичные тир-листы, публичные турниры, сыгранные до финала). Пользователи с ролями Creator, Автор, Pro или Staff также могут на странице своего аккаунта решить показывать на публичной странице итоги всех своих опубликованных колод вместе (колоды, посещения, копирования кода игры, полученные оценки; если колода одна, они совпадают с её числами). Таблицы по дням и по колодам остаются приватными, а числа можно снова скрыть в любой момент.",
  },
};
