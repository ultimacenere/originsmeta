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
    "How your published decks are doing: visits, game code copies (from the deck page and from the deck list), votes, link clicks and video plays over the last 7 and 30 days and in total. Your own visits while signed in don't count.",
  /** nota sotto il pannello: i numeri sono stime */
  estimate:
    "These are estimates: each browser tab counts once per deck and per type, and bots and staff traffic are left out. A visit counts after a few seconds on the page; a video counts at the first click on the player or on the video button. Days are in UTC.",
  /** {date} = primo giorno con un dato */
  since: "First day with data: {date}",
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
  chartTitle: "Visits and code copies per day, last 30 days",
  /** descrizione del grafico per i lettori di schermo; {views} e {copies} = totali dei 30 giorni */
  chartAria: "Chart: visits and code copies per day over the last 30 days. Visits: {views}; code copies: {copies}.",
  hidden: "Hidden",
  staffTitle: "Staff: most visited decks (30 days)",
  staffIntro: "Only admins and Staff can see this ranking: every community deck, with the same estimates.",
  staffEmpty: "No visits recorded in the last 30 days.",
  /** la classifica non ha letto tutte le righe (limite delle letture a pagine) */
  partial: "Partial ranking: there are too many rows to read them all.",
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
      "Come vanno i mazzi che hai pubblicato: visite, copie del codice del gioco (dalla scheda e dall'elenco dei mazzi), voti, clic sui link e video avviati, negli ultimi 7 e 30 giorni e in totale. Le visite ai tuoi mazzi fatte con l'accesso non contano.",
    estimate:
      "Sono stime: ogni scheda del browser conta una volta per mazzo e per tipo, e restano fuori i bot e il traffico dello staff. Una visita conta dopo qualche secondo sulla pagina, un video al primo clic sul lettore o sul tasto del video. Giorni in UTC.",
    since: "Primo giorno con dati: {date}",
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
    chartTitle: "Visite e copie del codice al giorno, ultimi 30 giorni",
    chartAria: "Grafico: visite e copie del codice al giorno negli ultimi 30 giorni. Visite: {views}; copie del codice: {copies}.",
    hidden: "Nascosto",
    staffTitle: "Staff: i mazzi più visti (30 giorni)",
    staffIntro: "La vedono solo gli admin e chi ha il tag Staff: tutti i mazzi della community, con le stesse stime.",
    staffEmpty: "Nessuna visita registrata negli ultimi 30 giorni.",
    partial: "Classifica parziale: le righe sono troppe per leggerle tutte.",
    notVisible: "mazzo non visibile",
    deck: "Mazzo",
    by: "di",
  },
  es: {
    title: "Tus estadísticas",
    intro:
      "Cómo van los mazos que publicaste: visitas, copias del código del juego (desde la ficha y desde la lista de mazos), votos, clics en los enlaces y videos iniciados, en los últimos 7 y 30 días y en total. Tus visitas con la sesión iniciada no cuentan.",
    estimate:
      "Son estimaciones: cada pestaña del navegador cuenta una vez por mazo y por tipo, y quedan fuera los bots y el tráfico del staff. Una visita cuenta después de unos segundos en la página; un video, con el primer clic en el reproductor o en el botón del video. Días en UTC.",
    since: "Primer día con datos: {date}",
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
    chartTitle: "Visitas y copias del código por día, últimos 30 días",
    chartAria: "Gráfico: visitas y copias del código por día en los últimos 30 días. Visitas: {views}; copias del código: {copies}.",
    hidden: "Oculto",
    staffTitle: "Staff: los mazos más vistos (30 días)",
    staffIntro: "Solo la ven los administradores y quien tiene la etiqueta Staff: todos los mazos de la comunidad, con las mismas estimaciones.",
    staffEmpty: "No hay visitas registradas en los últimos 30 días.",
    partial: "Clasificación parcial: hay demasiadas filas para leerlas todas.",
    notVisible: "mazo no visible",
    deck: "Mazo",
    by: "de",
  },
  fr: {
    title: "Vos statistiques",
    intro:
      "Comment se portent vos decks publiés : visites, copies du code du jeu (depuis la page du deck et depuis la liste des decks), votes, clics sur les liens et lectures de vidéos, sur les 7 et 30 derniers jours et au total. Vos propres visites avec la session ouverte ne comptent pas.",
    estimate:
      "Ce sont des estimations : chaque onglet du navigateur compte une fois par deck et par type, et les bots comme le trafic du staff sont exclus. Une visite compte après quelques secondes sur la page ; une vidéo, au premier clic sur le lecteur ou sur le bouton de la vidéo. Les jours sont en UTC.",
    since: "Premier jour avec des données : {date}",
    noData: "Pas encore de données : les chiffres apparaissent après les premières visites de vos decks.",
    unavailable: "Les statistiques ne sont pas encore disponibles. Réessayez plus tard.",
    d7: "7 jours",
    d30: "30 jours",
    total: "Total",
    metric: "Donnée",
    views: "Visites",
    codeCopies: "Copies du code",
    votes: "Votes",
    average: "Note moyenne",
    linkClicks: "Clics sur les liens",
    videoPlays: "Vidéos lancées",
    allDecks: "Tous vos decks",
    chartTitle: "Visites et copies du code par jour, 30 derniers jours",
    chartAria: "Graphique : visites et copies du code par jour sur les 30 derniers jours. Visites : {views} ; copies du code : {copies}.",
    hidden: "Masqué",
    staffTitle: "Staff : les decks les plus consultés (30 jours)",
    staffIntro: "Seuls les administrateurs et le Staff voient ce classement : tous les decks de la communauté, avec les mêmes estimations.",
    staffEmpty: "Aucune visite enregistrée sur les 30 derniers jours.",
    partial: "Classement partiel : il y a trop de lignes pour toutes les lire.",
    notVisible: "deck non visible",
    deck: "Deck",
    by: "par",
  },
  pt: {
    title: "Suas estatísticas",
    intro:
      "Como estão indo os seus decks publicados: visitas, cópias do código do jogo (da página do deck e da lista de decks), votos, cliques nos links e vídeos iniciados nos últimos 7 e 30 dias e no total. As suas próprias visitas com o login feito não contam.",
    estimate:
      "São estimativas: cada aba do navegador conta uma vez por deck e por tipo, e os bots e o tráfego do staff ficam de fora. Uma visita conta depois de alguns segundos na página; um vídeo conta no primeiro clique no player ou no botão do vídeo. Os dias estão em UTC.",
    since: "Primeiro dia com dados: {date}",
    noData: "Ainda não há dados: os números aparecem depois das primeiras visitas aos seus decks.",
    unavailable: "As estatísticas ainda não estão disponíveis. Tente de novo mais tarde.",
    d7: "7 dias",
    d30: "30 dias",
    total: "Total",
    metric: "Métrica",
    views: "Visitas",
    codeCopies: "Cópias do código",
    votes: "Votos",
    average: "Nota média",
    linkClicks: "Cliques nos links",
    videoPlays: "Vídeos iniciados",
    allDecks: "Todos os seus decks",
    chartTitle: "Visitas e cópias do código por dia, últimos 30 dias",
    chartAria: "Gráfico: visitas e cópias do código por dia nos últimos 30 dias. Visitas: {views}; cópias do código: {copies}.",
    hidden: "Oculto",
    staffTitle: "Staff: decks mais visitados (30 dias)",
    staffIntro: "Só os administradores e o Staff veem este ranking: todos os decks da comunidade, com as mesmas estimativas.",
    staffEmpty: "Nenhuma visita registrada nos últimos 30 dias.",
    partial: "Ranking parcial: há linhas demais para ler todas.",
    notVisible: "deck não visível",
    deck: "Deck",
    by: "de",
  },
  de: {
    title: "Deine Statistiken",
    intro:
      "Wie deine veröffentlichten Decks laufen: Besuche, Kopien des Spielcodes (von der Deckseite und aus der Deckliste), Bewertungen, Klicks auf Links und gestartete Videos in den letzten 7 und 30 Tagen und insgesamt. Deine eigenen Besuche mit Anmeldung zählen nicht.",
    estimate:
      "Das sind Schätzungen: Jeder Browser-Tab zählt einmal pro Deck und pro Art, Bots und Staff-Traffic bleiben außen vor. Ein Besuch zählt nach ein paar Sekunden auf der Seite; ein Video beim ersten Klick auf den Player oder auf die Video-Schaltfläche. Die Tage sind in UTC.",
    since: "Erster Tag mit Daten: {date}",
    noData: "Noch keine Daten: Die Zahlen erscheinen nach den ersten Besuchen deiner Decks.",
    unavailable: "Die Statistiken sind noch nicht verfügbar. Versuch es später noch einmal.",
    d7: "7 Tage",
    d30: "30 Tage",
    total: "Gesamt",
    metric: "Kennzahl",
    views: "Besuche",
    codeCopies: "Code-Kopien",
    votes: "Bewertungen",
    average: "Durchschnittsbewertung",
    linkClicks: "Link-Klicks",
    videoPlays: "Gestartete Videos",
    allDecks: "Alle deine Decks",
    chartTitle: "Besuche und Code-Kopien pro Tag, letzte 30 Tage",
    chartAria: "Diagramm: Besuche und Code-Kopien pro Tag in den letzten 30 Tagen. Besuche: {views}; Code-Kopien: {copies}.",
    hidden: "Ausgeblendet",
    staffTitle: "Staff: die meistbesuchten Decks (30 Tage)",
    staffIntro: "Dieses Ranking sehen nur Admins und der Staff: alle Community-Decks, mit denselben Schätzungen.",
    staffEmpty: "In den letzten 30 Tagen wurden keine Besuche erfasst.",
    partial: "Unvollständiges Ranking: Es gibt zu viele Zeilen, um alle zu lesen.",
    notVisible: "Deck nicht sichtbar",
    deck: "Deck",
    by: "von",
  },
};

/**
 * Riga dell'informativa privacy (pagina /privacy, ancora #deck-stats): statistiche aggregate per mazzo, senza dati
 * personali. Dice anche della chiave di sessionStorage che evita di contare due volte, come l'informativa fa per la
 * chiave del sign_up.
 */
export const deckStatsPrivacy: Record<Locale, string> = {
  en: "Deck stats: on a community deck page, and when you copy a game code from the deck list, the site counts, for each deck and each day, visits, game code copies, clicks on links and video plays, and shows these totals only to whoever published the deck and to the OriginsMeta staff (apart from the overall totals of all the published decks together that a showcase profile chooses to show on its public page: see “Achievements and public numbers on profiles”). Only the daily totals are stored, on Supabase (Ireland, EU): no IP address, no account and no identifier. The request goes through Supabase's servers, which, like Vercel, keep the usual technical logs (IP address included) for a short time, never linked to the totals. So that the same visit isn't counted twice, the browser notes which decks it has already counted in the tab's session storage, which is cleared when you close the tab and is never sent. Bots, staff browsers and people viewing their own decks while signed in are not counted.",
  it: "Statistiche dei mazzi: nella pagina di un mazzo della community, e quando copi il codice del gioco dall'elenco dei mazzi, il sito conta, per ogni mazzo e ogni giorno, visite, copie del codice del gioco, clic sui link e video avviati, e mostra questi totali solo a chi ha pubblicato il mazzo e allo staff di OriginsMeta (a parte i totali di tutti i mazzi pubblicati insieme che un profilo vetrina sceglie di mostrare sulla sua pagina pubblica: vedi “Traguardi e numeri pubblici dei profili”). Si salvano solo i totali del giorno, su Supabase (Irlanda, UE): nessun indirizzo IP, nessun account, nessun identificativo. La richiesta passa dai server di Supabase, che come Vercel conservano per poco i normali log tecnici (indirizzo IP compreso), mai collegati ai totali. Perché la stessa visita non conti due volte, il browser annota i mazzi già contati nella memoria di sessione della scheda, che si cancella quando chiudi la scheda e non viene mai inviata. Non si contano i bot, i browser dello staff e chi guarda i propri mazzi con l'accesso fatto.",
  es: "Estadísticas de los mazos: en la página de un mazo de la comunidad, y cuando copias el código del juego desde la lista de mazos, el sitio cuenta, para cada mazo y cada día, las visitas, las copias del código del juego, los clics en los enlaces y los videos iniciados, y muestra estos totales solo a quien publicó el mazo y al staff de OriginsMeta (salvo los totales de todos los mazos publicados juntos que un perfil vitrina elige mostrar en su página pública: consulta “Logros y números públicos de los perfiles”). Solo se guardan los totales del día, en Supabase (Irlanda, UE): ninguna dirección IP, ninguna cuenta, ningún identificador. La solicitud pasa por los servidores de Supabase, que, como Vercel, conservan por poco tiempo los registros técnicos habituales (dirección IP incluida), nunca vinculados a los totales. Para que la misma visita no cuente dos veces, el navegador anota los mazos ya contados en la memoria de sesión de la pestaña, que se borra al cerrar la pestaña y nunca se envía. No se cuentan los bots, los navegadores del staff ni las visitas de quien ve sus propios mazos con la sesión iniciada.",
  fr: "Statistiques des decks : sur la page d'un deck de la communauté, et quand vous copiez un code du jeu depuis la liste des decks, le site compte, pour chaque deck et chaque jour, les visites, les copies du code du jeu, les clics sur les liens et les lectures de vidéos, et montre ces totaux uniquement à la personne qui a publié le deck et au staff d'OriginsMeta (à part les totaux de tous les decks publiés ensemble qu'un profil vitrine choisit d'afficher sur sa page publique : voir « Succès et chiffres publics des profils »). Seuls les totaux du jour sont enregistrés, sur Supabase (Irlande, UE) : aucune adresse IP, aucun compte, aucun identifiant. La requête passe par les serveurs de Supabase, qui, comme Vercel, conservent peu de temps les journaux techniques habituels (adresse IP comprise), jamais reliés aux totaux. Pour que la même visite ne compte pas deux fois, le navigateur note les decks déjà comptés dans la mémoire de session de l'onglet, effacée quand vous fermez l'onglet et jamais envoyée. Les bots, les navigateurs du staff et les personnes qui consultent leurs propres decks avec la session ouverte ne sont pas comptés.",
  pt: "Estatísticas dos decks: na página de um deck da comunidade, e quando você copia um código do jogo da lista de decks, o site conta, para cada deck e cada dia, as visitas, as cópias do código do jogo, os cliques nos links e os vídeos iniciados, e mostra esses totais só para quem publicou o deck e para o staff do OriginsMeta (fora os totais de todos os decks publicados juntos que um perfil vitrine escolhe mostrar na sua página pública: veja “Conquistas e números públicos dos perfis”). Só os totais do dia são salvos, no Supabase (Irlanda, UE): nenhum endereço IP, nenhuma conta, nenhum identificador. A solicitação passa pelos servidores do Supabase, que, como a Vercel, guardam por pouco tempo os registros técnicos habituais (endereço IP incluído), nunca ligados aos totais. Para que a mesma visita não conte duas vezes, o navegador anota os decks já contados na memória de sessão da aba, que é apagada quando você fecha a aba e nunca é enviada. Não são contados os bots, os navegadores do staff nem quem vê os próprios decks com o login feito.",
  de: "Deck-Statistiken: Auf der Seite eines Community-Decks und wenn du einen Spielcode aus der Deckliste kopierst, zählt die Website für jedes Deck und jeden Tag die Besuche, die Kopien des Spielcodes, die Klicks auf Links und die gestarteten Videos und zeigt diese Summen nur der Person, die das Deck veröffentlicht hat, und dem Staff von OriginsMeta (abgesehen von den Gesamtsummen aller veröffentlichten Decks zusammen, die ein Schaufenster-Profil auf seiner öffentlichen Seite zeigen kann: siehe „Erfolge und öffentliche Zahlen in Profilen“). Gespeichert werden nur die Tagessummen, bei Supabase (Irland, EU): keine IP-Adresse, kein Konto, keine Kennung. Die Anfrage läuft über die Server von Supabase, die wie Vercel die üblichen technischen Logs (einschließlich IP-Adresse) für kurze Zeit aufbewahren, nie mit den Summen verknüpft. Damit derselbe Besuch nicht doppelt zählt, merkt sich der Browser die bereits gezählten Decks im Sitzungsspeicher des Tabs, der beim Schließen des Tabs gelöscht und nie gesendet wird. Nicht gezählt werden Bots, Browser des Staffs und Personen, die mit Anmeldung ihre eigenen Decks ansehen.",
};

/** Riempie i segnaposto `{nome}` (senza interpretare i `$` di `replace`). */
export function fillStats(label: string, vars: Record<string, string | number>): string {
  return label.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
