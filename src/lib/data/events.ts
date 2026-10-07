import type { Locale } from "../i18n";
import type { GuideSlug } from "../content/guides";

type L10n = Record<Locale, string>;

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
   * la nostra news con le regole e il formato dell'evento (`news` = slug) e il testo del link nella scheda di
   * /tournaments, con il nome dell'evento dentro ("Crimson Cup rules"), come l'etichetta di `signup`. Dal 25/09/2026
   * (MQ-06): un link fisso verso l'articolo sulle regole della Crimson Cup, che prima riceveva link quasi solo dal
   * blocco "Altre news", a rotazione.
   */
  rules?: { news: string; label: L10n };
  /**
   * Dati strutturati dell'evento (schema.org Event, rilievo GEO-09 dell'Ondata 2, 25/09/2026), usati da
   * src/lib/jsonld/events.ts. Tutto facoltativo:
   * - `name`: il nome nei dati strutturati quando non è il titolo della scheda: il nome ufficiale ("Crimson Cup") o il
   *   nome del gioco davanti, perché l'evento non si confonda con il festival di Valve; senza, vale `title`;
   * - `alternateName`: un altro nome con cui l'evento si cerca;
   * - `startAt`: inizio con orario e fuso (ISO 8601), solo quando la fonte ufficiale lo dà; senza, vale il giorno `start`;
   * - `image`: immagine dell'evento dal materiale ufficiale in public/media (come contenuto), al posto di og.jpg;
   * - `free`: partecipare non costa nulla (isAccessibleForFree, e l'iscrizione diventa un'offerta a prezzo 0);
   * - `festival`: l'evento fa parte dello Steam Next Fest (`steamNextFest` qui sotto), che organizza Valve.
   */
  ld?: { name?: L10n; alternateName?: L10n; startAt?: string; image?: string; free?: boolean; festival?: boolean };
};

const n = (en: string, it: string, es: string, fr: string): L10n => ({ en, it, es, fr });

/**
 * Lo Steam Next Fest di ottobre 2026: il festival delle demo giocabili di Valve (non di Koin Games), di cui fa parte
 * l'evento `steam-next-fest` qui sotto. Inizio con orario e fuso dal calendario ufficiale di Steam, come lo riporta la
 * guida steam-next-fest-2026 (lunedì 19 ottobre alle 10:00 ora del Pacifico, cioè le 19:00 in Italia); la fine solo
 * come giorno, perché la guida non ne dà l'ora. Nei dati strutturati è il `superEvent`, con Valve come organizzatore.
 */
export const steamNextFest = {
  slug: "steam-next-fest-october-2026",
  name: "Steam Next Fest: October 2026 Edition",
  organizer: { name: "Valve", url: "https://www.valvesoftware.com/" },
  startAt: "2026-10-19T10:00:00-07:00",
  end: "2026-10-26",
  url: "https://store.steampowered.com/sale/nextfest",
} as const;

export const events: Event[] = [
  {
    slug: "next-fest-tournament",
    official: true,
    guide: "steam-next-fest-2026",
    // testo del link dalla mappa delle query (C12): "Crimson Cup rules" / "regole della Crimson Cup" / "reglas de la Crimson Cup"
    rules: { news: "crimson-cup-format-check-in", label: n("Crimson Cup rules", "Regole della Crimson Cup", "Reglas de la Crimson Cup", "Règles de la Crimson Cup") },
    start: "2026-10-19",
    end: "2026-10-25",
    // Titolo visibile invariato (striscia del calendario e schede): il nome ufficiale "Crimson Cup" sta in `ld.name`, nei
    // dati strutturati. Metterlo in testa anche qui è un cambio editoriale da far decidere a Pierluigi (Ondata 2, GEO-09).
    title: n("Steam Next Fest Tournament (Crimson Cup)", "Torneo dello Steam Next Fest (Crimson Cup)", "Torneo del Steam Next Fest (Crimson Cup)", "Tournoi du Steam Next Fest (Crimson Cup)"),
    where: n("Online, in game; sign-ups on the official Discord", "Online, in gioco; iscrizioni sul Discord ufficiale", "Online, en el juego; inscripciones en el Discord oficial", "En ligne, en jeu ; inscriptions sur le Discord officiel"),
    // formato completato con l'annuncio sul Discord ufficiale del 24/09/2026 (news `crimson-cup-format-check-in`) e con il
    // post Steam del 05/10/2026 (news `crimson-cup-prizepool-qualifiers`: cinque qualificazioni, montepremi, sette luoghi
    // esclusi); orari e fusi come li scrive la grafica ufficiale del calendario allegata a quel post
    // (media/news-crimson-cup-prizepool.webp), senza conversioni nostre
    format: n(
      "Five qualifiers of 512 spots each, open to everyone, 32 advancing from each: AMER on 19 October at 7pm EST, EMEA on the 20th at 7pm CEST, AMER on the 21st at 9pm EST, APAC on the 22nd at 7pm SGT and EMEA on the 22nd at 7pm CEST, plus 96 wild cards. Playoffs on the 24th at 10am EST (4pm CEST) with 256 spots, four of whom reach the finals on the 25th at 10am EST. Three-deck Conquest with at least 8 unique cards between each pair of decks, decklists hidden until the top 4 (in the ban you only see the Legendary). Best-of-3 matches, best-of-5 grand final: no ban there, you have to win with all three decks. Seven locations are out of the tournament pool: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum and Nostradamus' Call. You may enter more than one qualifier.",
      "Cinque qualificazioni da 512 posti ciascuna, aperte a tutti, con 32 che passano da ognuna: AMER il 19 ottobre alle 19 EST, EMEA il 20 alle 19 CEST, AMER il 21 alle 21 EST, APAC il 22 alle 19 SGT ed EMEA il 22 alle 19 CEST, più 96 wild card. Playoff il 24 alle 10 EST (16 CEST) con 256 posti, quattro dei quali arrivano alle finali del 25 alle 10 EST. Conquest a tre mazzi con almeno 8 carte uniche fra ogni coppia, liste segrete fino alla top 4 (nel ban si vede solo la Leggendaria). Partite al meglio delle tre, gran finale al meglio delle cinque: lì niente ban, si vince con tutti e tre i mazzi. Sette luoghi sono fuori dal pool del torneo: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call. Ci si può iscrivere a più di una qualificazione.",
      "Cinco clasificatorios de 512 plazas cada uno, abiertos a todos, con 32 que pasan de cada uno: AMER el 19 de octubre a las 19:00 EST, EMEA el 20 a las 19:00 CEST, AMER el 21 a las 21:00 EST, APAC el 22 a las 19:00 SGT y EMEA el 22 a las 19:00 CEST, más 96 wild cards. Playoffs el 24 a las 10:00 EST (16:00 CEST) con 256 plazas; cuatro de sus jugadores llegan a las finales del 25, a las 10:00 EST. Conquest con tres mazos y al menos 8 cartas únicas entre cada par de mazos, listas ocultas hasta el top 4 (en el ban solo ves la Legendaria). Enfrentamientos al mejor de tres, gran final al mejor de cinco: ahí no hay ban, tienes que ganar con los tres mazos. Siete ubicaciones quedan fuera del pool del torneo: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum y Nostradamus' Call. Puedes inscribirte en más de un clasificatorio.",
      "Cinq qualifications de 512 places chacune, ouvertes à tous, avec 32 qualifiés dans chacune : AMER le 19 octobre à 19:00 EST, EMEA le 20 à 19:00 CEST, AMER le 21 à 21:00 EST, APAC le 22 à 19:00 SGT et EMEA le 22 à 19:00 CEST, plus 96 wild cards. Playoffs le 24 à 10:00 EST (16:00 CEST) avec 256 places, dont quatre joueurs atteignent les finales du 25 à 10:00 EST. Conquest à trois decks avec au moins 8 cartes uniques entre chaque paire de decks, listes cachées jusqu'au top 4 (lors du ban, vous ne voyez que la Légendaire). Matchs au meilleur des trois manches, grande finale au meilleur des cinq : pas de ban, il faut gagner avec les trois decks. Sept lieux sont hors du pool du tournoi : Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum et Nostradamus' Call. Vous pouvez vous inscrire à plus d'une qualification.",
    ),
    prizes: n(
      "Prizes worth $10,000, split between cash, collectibles and exclusive promo cards (breakdown of 5 October): the winner gets a 1/1 Dracula promo card, two booster box cases and $1,500; 2nd a 1/8 Dracula promo card, one case and $750; 3rd and 4th a 1/8 promo card, two booster boxes and $350; the top 8 a booster box, a 1/8 promo card and $125; the top 16 a booster box and a Finalist Plus card; the top 32 ten packs and a Finalist card; then 8, 4 and 2 packs down to the top 256.",
      "Premi per un valore complessivo di 10.000 $, divisi fra denaro, collezionabili e carte promo esclusive (ripartizione del 5 ottobre): chi vince prende una carta promo Dracula 1/1, due case di booster box e 1.500 $; il 2° una carta promo Dracula 1/8, un case e 750 $; 3° e 4° una promo 1/8, due booster box e 350 $; la top 8 un booster box, una promo 1/8 e 125 $; la top 16 un booster box e una carta Finalist Plus; la top 32 dieci pacchetti e una carta Finalist; poi 8, 4 e 2 pacchetti fino alla top 256.",
      "Premios por un valor de 10.000 dólares, repartidos entre dinero, coleccionables y cartas promo exclusivas (reparto del 5 de octubre): el ganador se lleva una carta promo Dracula 1/1, dos cases de cajas de sobres y 1.500 dólares; el 2.º, una carta promo Dracula 1/8, un case y 750 dólares; 3.º y 4.º, una promo 1/8, dos cajas de sobres y 350 dólares; el top 8, una caja de sobres, una promo 1/8 y 125 dólares; el top 16, una caja de sobres y una carta Finalist Plus; el top 32, diez sobres y una carta Finalist; después 8, 4 y 2 sobres hasta el top 256.",
      "Des lots d'une valeur totale de 10 000 dollars, répartis entre argent, objets de collection et cartes promo exclusives (répartition du 5 octobre) : le vainqueur reçoit une carte promo Dracula 1/1, deux cases de boîtes de boosters et 1 500 dollars ; le 2e une carte promo Dracula 1/8, une case et 750 dollars ; les 3e et 4e une carte promo 1/8, deux boîtes de boosters et 350 dollars ; le top 8 une boîte de boosters, une carte promo 1/8 et 125 dollars ; le top 16 une boîte de boosters et une carte Finalist Plus ; le top 32 dix boosters et une carte Finalist ; puis 8, 4 et 2 boosters jusqu'au top 256.",
    ),
    text: n(
      "Koin Games' biggest event so far, run during Steam Next Fest. You can join any qualifier regardless of where you live, but the team asks you to sign up only for the ones you can actually attend. Content creators get wildcard invites straight into the playoffs. Check-in opens two hours before each qualifier and closes five minutes before the start, together with deck submission: miss it and you can't play. The tournament runs on the main demo, which has the tournament card list (the playtest will diverge); patch 0.7 of 29 September is the last balance patch before it, and Koin hosts weekly no-stakes practice tournaments, announced on Discord.",
      "L'evento più grande di Koin Games finora, durante lo Steam Next Fest. Ci si può iscrivere a qualsiasi qualificazione a prescindere da dove si vive, ma il team chiede di iscriversi solo a quelle a cui si può davvero partecipare. I creator hanno inviti wildcard direttamente ai playoff. Il check-in apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi: chi lo salta non gioca. Il torneo si gioca sulla demo principale, che ha la lista carte del torneo (il playtest ne diventerà diverso); la patch 0.7 del 29 settembre è l'ultima patch di bilanciamento prima del torneo, e Koin organizza tornei di prova settimanali senza niente in palio, annunciati su Discord.",
      "El mayor evento de Koin Games hasta ahora, que se celebra durante el Steam Next Fest. Puedes participar en cualquier clasificatorio, vivas donde vivas, pero el equipo pide que te inscribas solo en los que de verdad puedas jugar. Los creadores de contenido reciben invitaciones wildcard directas a los playoffs. El check-in abre dos horas antes de cada clasificatorio y cierra cinco minutos antes del inicio, junto con la entrega de mazos: si te lo pierdes, no puedes jugar. El torneo se juega en la demo principal, que tiene la lista de cartas del torneo (el playtest pasará a ser distinto); el parche 0.7 del 29 de septiembre es el último parche de equilibrio antes del torneo, y Koin organiza torneos de práctica semanales sin nada en juego, anunciados en Discord.",
      "Le plus grand événement de Koin Games à ce jour, organisé pendant le Steam Next Fest. Vous pouvez participer à n'importe quelle qualification, où que vous viviez, mais l'équipe demande de ne vous inscrire qu'à celles auxquelles vous pouvez vraiment participer. Les créateurs de contenu reçoivent des invitations wildcard directement pour les playoffs. Le check-in ouvre deux heures avant chaque qualification et ferme cinq minutes avant le début, en même temps que la remise des decks : si vous le manquez, vous ne jouez pas. Le tournoi se joue sur la démo principale, qui a la liste de cartes du tournoi (le playtest va s'en écarter) ; le patch 0.7 du 29 septembre est le dernier patch d'équilibrage avant le tournoi, et Koin organise des tournois d'entraînement hebdomadaires sans enjeu, annoncés sur Discord.",
    ),
    signup: { label: n("Sign up on Discord", "Iscriviti su Discord", "Inscríbete en Discord", "S'inscrire sur Discord"), url: "https://discord.gg/originstcg" },
    source: "https://store.steampowered.com/news/app/4429430/view/1843481262690278",
    // Inizio = qualificazione AMER aggiunta il 05/10/2026, 19 ottobre alle 19:00 "EST" della grafica ufficiale. Koin scrive
    // EST ma la sua stessa grafica fa coincidere le 10 EST con le 16 CEST, cioè l'ora legale della costa est (UTC-4, in vigore
    // fino al 1° novembre): quindi -04:00, le 23:00 UTC, l'1:00 del 20 ottobre in Italia (prima: EMEA del 20 alle 19:00 CEST).
    // La fine resta un giorno: la grafica dà l'ora d'inizio delle finali, non quella di chiusura.
    // Iscriversi è gratis (offerta a prezzo 0 verso il Discord ufficiale). È il torneo di Koin dello Steam Next Fest: il
    // festival è il `superEvent`, come per la classificata qui sotto, e l'organizzatore resta Koin Games.
    ld: {
      name: n("Crimson Cup", "Crimson Cup", "Crimson Cup", "Crimson Cup"),
      alternateName: n("Origins TCG Steam Next Fest tournament", "Torneo dello Steam Next Fest di Origins TCG", "Torneo del Steam Next Fest de Origins TCG", "Tournoi du Steam Next Fest d'Origins TCG"),
      startAt: "2026-10-19T19:00:00-04:00",
      image: "/media/news-crimson-cup.webp",
      free: true,
      festival: true,
    },
  },
  {
    slug: "steam-next-fest",
    official: true,
    // la guida della classificata (C13, Ondata 3): la guida al festival resta collegata alla Crimson Cup (next-fest-tournament)
    guide: "origins-tcg-ranked",
    start: "2026-10-19",
    end: "2026-10-26",
    title: n("Steam Next Fest: ranked opens in the demo", "Steam Next Fest: nella demo parte la classificata", "Steam Next Fest: la clasificatoria se abre en la demo", "Steam Next Fest : le classé ouvre dans la démo"),
    where: n("Steam", "Steam", "Steam", "Steam"),
    text: n(
      "Ranked mode switches on in the demo with the start of the festival, with exclusive ranked rewards. The team announced it on 21 September, the day the first big demo update landed (new UI, test packs, the tentative Crimson Cup card list, progress kept from demo and playtest). OriginsMeta's first tier list will follow the Crimson Cup, built on its results.",
      "Con l'inizio del festival nella demo si accende la classificata, con ricompense esclusive. Lo ha annunciato il team il 21 settembre, il giorno in cui è uscito il primo grande aggiornamento della demo (nuova interfaccia, pacchetti di prova, lista carte provvisoria della Crimson Cup, progressi salvi da demo e playtest). La prima tier list di OriginsMeta arriverà dopo la Crimson Cup, sui suoi risultati.",
      "La clasificatoria se activa en la demo con el inicio del festival y tiene recompensas exclusivas. El equipo lo anunció el 21 de septiembre, el día en que llegó la primera gran actualización de la demo (nueva interfaz, sobres de prueba, la lista provisional de cartas de la Crimson Cup, progreso conservado de la demo y del playtest). La primera tier list de OriginsMeta llegará después de la Crimson Cup, con sus resultados.",
      "Le mode classé s'active dans la démo dès le début du festival, avec des récompenses exclusives. L'équipe l'a annoncé le 21 septembre, le jour de la première grande mise à jour de la démo (nouvelle interface, boosters d'essai, liste de cartes provisoire de la Crimson Cup, progression conservée de la démo et du playtest). La première tier list d'OriginsMeta suivra la Crimson Cup, construite sur ses résultats.",
    ),
    signup: { label: n("Steam page", "Pagina Steam", "Página de Steam", "Page Steam"), url: "https://store.steampowered.com/app/4429430/Origins_TCG/" },
    source: "https://store.steampowered.com/sale/nextfest",
    // L'evento è di Koin (la classificata nella demo), dentro il festival di Valve: nei dati strutturati il nome porta
    // il gioco davanti e il festival diventa il `superEvent`. Nessun orario: il post dice solo "con l'inizio" del festival.
    // Niente `free`: non c'è un'iscrizione, e un'offerta a prezzo 0 verso la pagina Steam del gioco completo (non ancora
    // uscito; la classificata è nella demo) si leggerebbe come "Origins TCG è gratis", che il sito non dice.
    ld: {
      name: n(
        "Origins TCG ranked opens in the demo (Steam Next Fest)",
        "Origins TCG: la classificata apre nella demo (Steam Next Fest)",
        "Origins TCG: la clasificatoria se abre en la demo (Steam Next Fest)",
        "Origins TCG : le classé ouvre dans la démo (Steam Next Fest)",
      ),
      image: "/media/keyart-queen-of-hearts.webp",
      festival: true,
    },
  },
  {
    slug: "big-bobs-playtest-battle",
    official: true,
    // la news dell'annuncio racconta il formato (primo Conquest, al meglio delle tre, eliminazione diretta)
    rules: { news: "big-bobs-playtest-battle", label: n("Big Bob's format", "Formato del Big Bob's", "Formato del Big Bob's", "Format du Big Bob's") },
    start: "2026-08-28",
    title: n("Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle"),
    where: n("Playtest build; brackets on Discord", "Build del playtest; tabelloni su Discord", "Versión del playtest; cuadros en Discord", "Build du playtest ; tableaux sur Discord"),
    format: n(
      "Best-of-3, single elimination. First ever use of the Conquest format: several decks, a different Legendary in each, at least nine cards of difference, one ban.",
      "Best-of-3, eliminazione diretta. Primo uso del formato Conquest: più mazzi, una Leggendaria diversa in ciascuno, almeno nove carte di differenza, un ban.",
      "Al mejor de tres, eliminación directa. Estreno del formato Conquest: varios mazos, una Legendaria distinta en cada uno, al menos nueve cartas de diferencia, un ban.",
      "Au meilleur des trois manches, élimination directe. Première utilisation du format Conquest : plusieurs decks, une Légendaire différente dans chacun, au moins neuf cartes de différence, un ban.",
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
    format: n("For fun, demo decks.", "Amichevole, mazzi della demo.", "Amistoso, con mazos de la demo.", "Amical, decks de la démo."),
    prizes: n("Wildcard invite to the Next Fest tournament and a secret prize.", "Invito wildcard al torneo del Next Fest e un premio segreto.", "Invitación wildcard al torneo del Next Fest y un premio secreto.", "Invitation wildcard au tournoi du Next Fest et un prix secret."),
    text: n(
      "Announced with the first demo stats: over 1,000 players and 13,000 matches in the first week, with a median play time of 1h51m.",
      "Annunciato insieme ai primi numeri della demo: oltre 1.000 giocatori e 13.000 partite nella prima settimana, con un tempo di gioco mediano di 1h51m.",
      "Anunciado junto con las primeras cifras de la demo: más de 1.000 jugadores y 13.000 partidas en la primera semana, con una mediana de tiempo de juego de 1 h 51 min.",
      "Annoncé avec les premiers chiffres de la démo : plus de 1 000 joueurs et 13 000 parties la première semaine, pour un temps de jeu médian de 1 h 51 min.",
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
      "Une partie de l'équipe a présenté Origins aux collectionneurs, avec les premières ouvertures publiques de boosters et un Slab offert à qui tirait une Alternate Art 10/10.",
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
