import type { Locale } from "../i18n";
import type { GuideSlug } from "../content/guides";

type L10n = Record<Locale, string> & { fr?: string };

export type Event = {
  slug: string;
  official: boolean;
  start: string; // ISO date
  end?: string;
  title: L10n;
  where: L10n;
  format?: L10n;
  prizes?: L10n;
  text: L10n;
  signup?: { label: L10n; url: string };
  /** fonte ufficiale dell'annuncio (post Steam, pagina del festival): resta il tasto "Fonte" della scheda */
  source?: string;
  /** slug della guida dedicata all'evento */
  guide?: GuideSlug;
  /**
   * slug della nostra news con le regole e il formato dell'evento: nella scheda di /tournaments diventa il link
   * "Regole e formato" (dal 25/09/2026, MQ-06: un link fisso verso l'articolo sulle regole della Crimson Cup,
   * che prima riceveva link quasi solo dal blocco "Altre news", a rotazione)
   */
  rules?: string;
};

const n = (en: string, it: string, es: string, fr?: string): L10n => (fr ? { en, it, es, fr } : { en, it, es });

export const events: Event[] = [
  {
    slug: "next-fest-tournament",
    official: true,
    guide: "steam-next-fest-2026",
    rules: "crimson-cup-format-check-in",
    start: "2026-10-20",
    end: "2026-10-25",
    title: n("Steam Next Fest Tournament (Crimson Cup)", "Torneo dello Steam Next Fest (Crimson Cup)", "Torneo del Steam Next Fest (Crimson Cup)", "Tournoi du Steam Next Fest (Crimson Cup)"),
    where: n("Online, in game; sign-ups on the official Discord", "Online, in gioco; iscrizioni sul Discord ufficiale", "Online, en el juego; inscripciones en el Discord oficial", "En ligne, en jeu ; inscriptions sur le Discord officiel"),
    // formato completato con l'annuncio sul Discord ufficiale del 24/09/2026 (news `crimson-cup-format-check-in`)
    format: n(
      "Three qualifiers of 512 spots each, open to everyone: EMEA on 20 October (32 advance), AMER on the 21st (64), APAC on the 22nd (32), plus 128 wild cards. Playoffs on the 24th with 256 spots, four of whom reach the finals on the 25th. Three-deck Conquest with at least 8 unique cards between each pair of decks, decklists hidden until the top 4 (in the ban you only see the Legendary). Best-of-3 matches, best-of-5 grand final: no ban there, you have to win with all three decks. You may enter more than one qualifier.",
      "Tre qualificazioni da 512 posti ciascuna, aperte a tutti: EMEA il 20 ottobre (32 passano), AMER il 21 (64), APAC il 22 (32), più 128 wild card. Playoff il 24 con 256 posti, quattro dei quali arrivano alle finali del 25. Conquest a tre mazzi con almeno 8 carte uniche fra ogni coppia, liste segrete fino alla top 4 (nel ban si vede solo la Leggendaria). Partite al meglio delle tre, gran finale al meglio delle cinque: lì niente ban, si vince con tutti e tre i mazzi. Ci si può iscrivere a più di una qualificazione.",
      "Tres clasificatorios de 512 plazas cada uno, abiertos a todos: EMEA el 20 de octubre (pasan 32), AMER el 21 (64), APAC el 22 (32), más 128 wild cards. Playoffs el 24 con 256 plazas; cuatro de sus jugadores llegan a las finales del 25. Conquest con tres mazos y al menos 8 cartas únicas entre cada par de mazos, listas ocultas hasta el top 4 (en el ban solo ves la Legendaria). Enfrentamientos al mejor de tres, gran final al mejor de cinco: ahí no hay ban, tienes que ganar con los tres mazos. Puedes inscribirte en más de un clasificatorio.",
    ),
    prizes: n(
      "Prizes worth $10,000: an exclusive 1/1 tournament promo card, other promo cards, digital packs, Alpha booster boxes and cases, and cash prizes.",
      "Premi per un valore complessivo di 10.000 $: una carta promo 1/1 esclusiva del torneo, altre carte promo, pacchetti digitali, booster box e case Alpha, premi in denaro.",
      "Premios por un valor de 10.000 dólares: una carta promo 1/1 exclusiva del torneo, otras cartas promo, sobres digitales, cajas y cases de sobres Alpha, y premios en efectivo.",
      "Des lots d'une valeur totale de 10 000 $ : une carte promo 1/1 exclusive du tournoi, d'autres cartes promo, des packs numériques, des boîtes et des cases de boosters Alpha, et des prix en argent.",
    ),
    text: n(
      "Koin Games' biggest event so far, run during Steam Next Fest. You can join any qualifier regardless of where you live, but the team asks you to sign up only for the ones you can actually attend. Content creators get wildcard invites straight into the playoffs. Check-in opens two hours before each qualifier and closes five minutes before the start, together with deck submission: miss it and you can't play. The tournament runs on the main demo, which has the tournament card list (the playtest will diverge); the last balance patch comes two weeks before Steam Next Fest.",
      "L'evento più grande di Koin Games finora, durante lo Steam Next Fest. Ci si può iscrivere a qualsiasi qualificazione a prescindere da dove si vive, ma il team chiede di iscriversi solo a quelle a cui si può davvero partecipare. I creator hanno inviti wildcard direttamente ai playoff. Il check-in apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi: chi lo salta non gioca. Il torneo si gioca sulla demo principale, che ha la lista carte del torneo (il playtest ne diventerà diverso); l'ultima patch di bilanciamento arriva due settimane prima dello Steam Next Fest.",
      "El mayor evento de Koin Games hasta ahora, que se celebra durante el Steam Next Fest. Puedes participar en cualquier clasificatorio, vivas donde vivas, pero el equipo pide que te inscribas solo en los que de verdad puedas jugar. Los creadores de contenido reciben invitaciones wildcard directas a los playoffs. El check-in abre dos horas antes de cada clasificatorio y cierra cinco minutos antes del inicio, junto con la entrega de mazos: si te lo pierdes, no puedes jugar. El torneo se juega en la demo principal, que tiene la lista de cartas del torneo (el playtest pasará a ser distinto); el último parche de equilibrio llega dos semanas antes del Steam Next Fest.",
    ),
    signup: { label: n("Sign up on Discord", "Iscriviti su Discord", "Inscríbete en Discord", "S'inscrire sur Discord"), url: "https://discord.gg/originstcg" },
    source: "https://store.steampowered.com/news/app/4429430/view/1843481262690278",
  },
  {
    slug: "steam-next-fest",
    official: true,
    guide: "steam-next-fest-2026",
    start: "2026-10-19",
    end: "2026-10-26",
    title: n("Steam Next Fest: ranked opens in the demo", "Steam Next Fest: nella demo parte la classificata", "Steam Next Fest: la clasificatoria se abre en la demo"),
    where: n("Steam", "Steam", "Steam", "Steam"),
    text: n(
      "Ranked mode switches on in the demo with the start of the festival, with exclusive ranked rewards. The team announced it on 21 September, the day the first big demo update landed (new UI, test packs, the tentative Crimson Cup card list, progress kept from demo and playtest). OriginsMeta's first tier list will follow the Crimson Cup, built on its results.",
      "Con l'inizio del festival nella demo si accende la classificata, con ricompense esclusive. Lo ha annunciato il team il 21 settembre, il giorno in cui è uscito il primo grande aggiornamento della demo (nuova interfaccia, pacchetti di prova, lista carte provvisoria della Crimson Cup, progressi salvi da demo e playtest). La prima tier list di OriginsMeta arriverà dopo la Crimson Cup, sui suoi risultati.",
      "La clasificatoria se activa en la demo con el inicio del festival y tiene recompensas exclusivas. El equipo lo anunció el 21 de septiembre, el día en que llegó la primera gran actualización de la demo (nueva interfaz, sobres de prueba, la lista provisional de cartas de la Crimson Cup, progreso conservado de la demo y del playtest). La primera tier list de OriginsMeta llegará después de la Crimson Cup, con sus resultados.",
    ),
    signup: { label: n("Steam page", "Pagina Steam", "Página de Steam", "Page Steam"), url: "https://store.steampowered.com/app/4429430/Origins_TCG/" },
    source: "https://store.steampowered.com/sale/nextfest",
  },
  {
    slug: "big-bobs-playtest-battle",
    official: true,
    // la news dell'annuncio racconta il formato (primo Conquest, al meglio delle tre, eliminazione diretta)
    rules: "big-bobs-playtest-battle",
    start: "2026-08-28",
    title: n("Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle"),
    where: n("Playtest build; brackets on Discord", "Build del playtest; tabelloni su Discord", "Versión del playtest; cuadros en Discord", "Build du playtest ; tableaux sur Discord"),
    format: n(
      "Best-of-3, single elimination. First ever use of the Conquest format: several decks, a different Legendary in each, at least nine cards of difference, one ban.",
      "Best-of-3, eliminazione diretta. Primo uso del formato Conquest: più mazzi, una Leggendaria diversa in ciascuno, almeno nove carte di differenza, un ban.",
      "Al mejor de tres, eliminación directa. Estreno del formato Conquest: varios mazos, una Legendaria distinta en cada uno, al menos nueve cartas de diferencia, un ban.",
      "Best-of-3, élimination directe. Première utilisation du format Conquest : plusieurs decks, une Légendaire différente dans chacun, au moins neuf cartes de différence, un ban.",
    ),
    prizes: n("Wildcard invite to the Next Fest tournament and Collector Packs.", "Invito wildcard al torneo del Next Fest e Collector Pack.", "Invitación wildcard al torneo del Next Fest y Collector Packs.", "Invitation wildcard au tournoi du Next Fest et Collector Packs."),
    text: n(
      "Over 130 players registered. Played on patch 0.6.3, released two days earlier.",
      "Oltre 130 iscritti. Giocato sulla patch 0.6.3, uscita due giorni prima.",
      "Más de 130 jugadores inscritos. Se jugó en el parche 0.6.3, publicado dos días antes.",
      "Plus de 130 inscrits. Joué sur le patch 0.6.3, sorti deux jours plus tôt.",
    ),
    source: "https://store.steampowered.com/news/app/4429430/view/1841579228677617",
  },
  {
    slug: "first-demo-tournament",
    official: true,
    start: "2026-07-24",
    title: n("First demo tournament", "Primo torneo della demo", "Primer torneo de la demo", "Premier tournoi de la démo"),
    where: n("Discord", "Discord", "Discord", "Discord"),
    format: n("For fun, demo decks.", "Amichevole, mazzi della demo.", "Amistoso, con mazos de la demo.", "Pour le plaisir, decks de la démo."),
    prizes: n("Wildcard invite to the Next Fest tournament and a secret prize.", "Invito wildcard al torneo del Next Fest e un premio segreto.", "Invitación wildcard al torneo del Next Fest y un premio secreto.", "Invitation wildcard au tournoi du Next Fest et un prix secret."),
    text: n(
      "Announced with the first demo stats: over 1,000 players and 13,000 matches in the first week, with a median play time of 1h51m.",
      "Annunciato insieme ai primi numeri della demo: oltre 1.000 giocatori e 13.000 partite nella prima settimana, con un tempo di gioco mediano di 1h51m.",
      "Anunciado junto con las primeras cifras de la demo: más de 1.000 jugadores y 13.000 partidas en la primera semana, con una mediana de tiempo de juego de 1 h 51 min.",
      "Annoncé avec les premiers chiffres de la démo : plus de 1 000 joueurs et 13 000 parties la première semaine, pour un temps de jeu médian de 1 h 51.",
    ),
    source: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
  },
  {
    slug: "card-party-fort-lauderdale",
    official: true,
    start: "2026-07-24",
    end: "2026-07-26",
    title: n("Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale"),
    where: n("Card show, Florida (USA)", "Fiera del collezionismo, Florida (USA)", "Feria de cartas coleccionables, Florida (EE. UU.)", "Salon de cartes, Floride (États-Unis)"),
    text: n(
      "Part of the team took Origins to collectors, with the first public pack openings and a Slab giveaway for anyone pulling a 10/10 Alternate Art.",
      "Parte del team ha portato Origins ai collezionisti, con le prime aperture pubbliche di pacchetti e uno Slab in regalo a chi pescava un'Alternate Art 10/10.",
      "Parte del equipo llevó Origins a los coleccionistas, con las primeras aperturas públicas de sobres y un Slab de regalo para quien sacara una Alternate Art 10/10.",
      "Une partie de l'équipe a présenté Origins aux collectionneurs, avec les premières ouvertures publiques de packs et un Slab offert à qui tirait une Alternate Art 10/10.",
    ),
    source: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
  },
];

export function upcomingEvents(today = new Date()): Event[] {
  const t = today.toISOString().slice(0, 10);
  return events.filter((e) => (e.end ?? e.start) >= t).sort((a, b) => a.start.localeCompare(b.start));
}

export function pastEvents(today = new Date()): Event[] {
  const t = today.toISOString().slice(0, 10);
  return events.filter((e) => (e.end ?? e.start) < t).sort((a, b) => b.start.localeCompare(a.start));
}
