import type { Locale } from "./i18n";

/**
 * Etichette delle statistiche dei mazzi per gli autori (pacchetto STATS, 26/09/2026): il pannello "Le tue statistiche"
 * in /account (DeckStatsPanel) e la riga dell'informativa privacy. Stanno qui e non nei dizionari, come
 * `feedbackLabels.ts` e `communityPageLabels`: un modulo solo per questo pacchetto, nelle tre lingue insieme (l'inglese
 * è il tipo di riferimento). Spagnolo neutro col tú (docs/spagnolo.md). Segnaposto tra graffe, riempiti da `fillStats`.
 */
const en = {
  title: "Your stats",
  intro:
    "How your published decks are doing: visits, game code copies, votes, link clicks and video plays over the last 7 and 30 days and in total. Your own visits to your decks don't count.",
  /** nota sotto il pannello: i numeri sono stime */
  estimate:
    "These are estimates: each browser counts once per session, per deck and per type, and bots and staff traffic are left out. A visit counts after a few seconds on the page. Days are in UTC.",
  /** {date} = primo giorno con un dato */
  since: "Data since {date}",
  noData: "No data yet: the numbers show up after the first visits to your decks.",
  unavailable: "Stats aren't available yet. Please try again later.",
  d7: "7 days",
  d30: "30 days",
  total: "Total",
  /** intestazione della prima colonna delle tabelle per mazzo */
  metric: "Metric",
  views: "Visits",
  codeCopies: "Code copies",
  votes: "Votes",
  average: "Average rating",
  linkClicks: "Link clicks",
  videoPlays: "Video plays",
  allDecks: "All your decks",
  chartTitle: "Visits per day, last 30 days",
  /** descrizione del grafico per i lettori di schermo; {views} e {copies} = totali dei 30 giorni */
  chartAria: "Chart: visits and code copies per day over the last 30 days. Visits: {views}; code copies: {copies}.",
  hidden: "Hidden",
  staffTitle: "Staff: most visited decks (30 days)",
  staffIntro: "Only admins and Staff can see this ranking: every community deck, with the same estimates.",
  staffEmpty: "No visits recorded in the last 30 days.",
  /** un mazzo in classifica che chi guarda non può aprire (nascosto, e chi guarda non è admin) */
  notVisible: "deck not visible",
  deck: "Deck",
  /** "di coachcrono" */
  by: "by",
};

export type DeckStatsLabels = typeof en;

export const deckStatsLabels: Record<Locale, DeckStatsLabels> = {
  en,
  it: {
    title: "Le tue statistiche",
    intro:
      "Come vanno i mazzi che hai pubblicato: visite, copie del codice del gioco, voti, clic sui link e video avviati, negli ultimi 7 e 30 giorni e in totale. Le visite che fai ai tuoi mazzi non contano.",
    estimate:
      "Sono stime: ogni browser conta una volta per sessione, per mazzo e per tipo, e restano fuori i bot e il traffico dello staff. Una visita conta dopo qualche secondo sulla pagina. Giorni in UTC.",
    since: "Dati dal {date}",
    noData: "Ancora nessun dato: i numeri compaiono dopo le prime visite ai tuoi mazzi.",
    unavailable: "Le statistiche non sono ancora disponibili. Riprova più tardi.",
    d7: "7 giorni",
    d30: "30 giorni",
    total: "Totale",
    metric: "Dato",
    views: "Visite",
    codeCopies: "Copie del codice",
    votes: "Voti",
    average: "Media voti",
    linkClicks: "Clic sui link",
    videoPlays: "Video avviati",
    allDecks: "Tutti i tuoi mazzi",
    chartTitle: "Visite al giorno, ultimi 30 giorni",
    chartAria: "Grafico: visite e copie del codice al giorno negli ultimi 30 giorni. Visite: {views}; copie del codice: {copies}.",
    hidden: "Nascosto",
    staffTitle: "Staff: i mazzi più visti (30 giorni)",
    staffIntro: "La vedono solo gli admin e chi ha il tag Staff: tutti i mazzi della community, con le stesse stime.",
    staffEmpty: "Nessuna visita registrata negli ultimi 30 giorni.",
    notVisible: "mazzo non visibile",
    deck: "Mazzo",
    by: "di",
  },
  es: {
    title: "Tus estadísticas",
    intro:
      "Cómo van los mazos que publicaste: visitas, copias del código del juego, votos, clics en los enlaces y videos iniciados, en los últimos 7 y 30 días y en total. Tus propias visitas a tus mazos no cuentan.",
    estimate:
      "Son estimaciones: cada navegador cuenta una vez por sesión, por mazo y por tipo, y quedan fuera los bots y el tráfico del staff. Una visita cuenta después de unos segundos en la página. Días en UTC.",
    since: "Datos desde el {date}",
    noData: "Todavía no hay datos: los números aparecen tras las primeras visitas a tus mazos.",
    unavailable: "Las estadísticas todavía no están disponibles. Vuelve a intentarlo más tarde.",
    d7: "7 días",
    d30: "30 días",
    total: "Total",
    metric: "Dato",
    views: "Visitas",
    codeCopies: "Copias del código",
    votes: "Votos",
    average: "Valoración media",
    linkClicks: "Clics en enlaces",
    videoPlays: "Videos iniciados",
    allDecks: "Todos tus mazos",
    chartTitle: "Visitas por día, últimos 30 días",
    chartAria: "Gráfico: visitas y copias del código por día en los últimos 30 días. Visitas: {views}; copias del código: {copies}.",
    hidden: "Oculto",
    staffTitle: "Staff: los mazos más vistos (30 días)",
    staffIntro: "Solo la ven los administradores y quien tiene la etiqueta Staff: todos los mazos de la comunidad, con las mismas estimaciones.",
    staffEmpty: "No hay visitas registradas en los últimos 30 días.",
    notVisible: "mazo no visible",
    deck: "Mazo",
    by: "de",
  },
};

/**
 * Riga dell'informativa privacy (pagina /privacy, ancora #deck-stats): statistiche aggregate per mazzo, senza dati
 * personali. Dice anche della chiave di sessionStorage che evita di contare due volte, come l'informativa fa per la
 * chiave del sign_up.
 */
export const deckStatsPrivacy: Record<Locale, string> = {
  en: "Deck stats: on a community deck page the site counts, for each deck and each day, visits, game code copies, clicks on links and video plays, and shows these totals only to the deck's author and to the OriginsMeta staff. Only the daily totals are stored, on Supabase (Ireland, EU): no IP address, no account and no identifier. So that the same visit isn't counted twice, the browser notes which decks it has already counted in its session storage, which is cleared when you close the tab and is never sent. Bots, staff browsers and authors viewing their own decks are not counted.",
  it: "Statistiche dei mazzi: nella pagina di un mazzo della community il sito conta, per ogni mazzo e ogni giorno, visite, copie del codice del gioco, clic sui link e video avviati, e mostra questi totali solo all'autore del mazzo e allo staff di OriginsMeta. Si salvano solo i totali del giorno, su Supabase (Irlanda, UE): nessun indirizzo IP, nessun account, nessun identificativo. Perché la stessa visita non conti due volte, il browser annota i mazzi già contati nella memoria della sessione, che si cancella quando chiudi la scheda e non viene mai inviata. Non si contano i bot, i browser dello staff e gli autori che guardano i propri mazzi.",
  es: "Estadísticas de los mazos: en la página de un mazo de la comunidad, el sitio cuenta, para cada mazo y cada día, las visitas, las copias del código del juego, los clics en los enlaces y los videos iniciados, y muestra estos totales solo al autor del mazo y al staff de OriginsMeta. Solo se guardan los totales del día, en Supabase (Irlanda, UE): ninguna dirección IP, ninguna cuenta, ningún identificador. Para que la misma visita no cuente dos veces, el navegador anota los mazos ya contados en la memoria de la sesión, que se borra al cerrar la pestaña y nunca se envía. No se cuentan los bots, los navegadores del staff ni los autores que ven sus propios mazos.",
};

/** Riempie i segnaposto `{nome}` (senza interpretare i `$` di `replace`). */
export function fillStats(label: string, vars: Record<string, string | number>): string {
  return label.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
