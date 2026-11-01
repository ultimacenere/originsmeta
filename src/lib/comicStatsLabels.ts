import type { Locale } from "./i18n";

/**
 * Etichette delle statistiche dei fumetti per chi li disegna (02/11/2026; Pierluigi: "aggiungi le statistiche di visita
 * dei fumetti nel pannello di Vega, come per i mazzi"): il pannello "Statistiche dei fumetti" in /account
 * (ComicStatsPanel) e la riga dell'informativa privacy. Un modulo solo per questo pacchetto, nelle sette lingue insieme
 * (l'inglese è il tipo di riferimento), come deckStatsLabels.ts; i segnaposto tra graffe li riempie `fillStats`.
 * Spagnolo neutro col tú, francese col vous, portoghese del Brasile col você, tedesco col du, russo col вы.
 */
const en = {
  title: "Comic stats",
  intro:
    "How your published comics are doing: visits and complete reads (the last page reached the screen), by page language, over the last 7 and 30 days and in total. Your own visits while signed in don't count.",
  /** nota sotto il pannello: i numeri sono stime */
  estimate:
    "These are estimates: each browser tab counts once per comic, language and type, and bots and staff traffic are left out. A visit counts after a few seconds on the page; a complete read when the last page comes into view. Days are in UTC.",
  /** {date} = primo giorno con un dato */
  since: "First day with data: {date}",
  noData: "No data yet: the numbers show up after the first visits to your comics.",
  unavailable: "Comic stats aren't available yet. Please try again later.",
  d7: "7 days",
  d30: "30 days",
  total: "Total",
  /** intestazione della prima colonna delle tabelle per fumetto */
  metric: "Metric",
  views: "Visits",
  reads: "Complete reads",
  /** quota di visite arrivate all'ultima tavola */
  readRate: "Read to the end",
  allComics: "All your comics",
  /** riga con i totali per lingua della pagina */
  byLang: "By page language",
  chartTitle: "Visits and complete reads per day, last 30 days",
  /** descrizione del grafico per i lettori di schermo; {views} e {reads} = totali dei 30 giorni */
  chartAria: "Chart: visits and complete reads per day over the last 30 days. Visits: {views}; complete reads: {reads}.",
  draft: "Draft",
  hidden: "Hidden",
  staffTitle: "Staff: most visited comics (30 days)",
  staffIntro: "Only admins and Staff can see this ranking: every published comic, with the same estimates.",
  staffEmpty: "No visits recorded in the last 30 days.",
  /** la classifica non ha letto tutte le righe (limite delle letture a pagine) */
  partial: "Partial ranking: there are too many rows to read them all.",
  /** un fumetto in classifica che chi guarda non può aprire */
  notVisible: "comic not visible",
  /** "di Vega" */
  by: "by",
};

export type ComicStatsLabels = typeof en;

export const comicStatsLabels: Record<Locale, ComicStatsLabels> = {
  en,
  it: {
    title: "Statistiche dei fumetti",
    intro:
      "Come vanno i fumetti che hai pubblicato: visite e letture complete (l'ultima tavola arrivata sullo schermo), per lingua della pagina, negli ultimi 7 e 30 giorni e in totale. Le visite ai tuoi fumetti fatte con l'accesso non contano.",
    estimate:
      "Sono stime: ogni scheda del browser conta una volta per fumetto, lingua e tipo, e restano fuori i bot e il traffico dello staff. Una visita conta dopo qualche secondo sulla pagina, una lettura completa quando l'ultima tavola entra nello schermo. Giorni in UTC.",
    since: "Primo giorno con dati: {date}",
    noData: "Ancora nessun dato: i numeri compaiono dopo le prime visite ai tuoi fumetti.",
    unavailable: "Le statistiche dei fumetti non sono ancora disponibili. Riprova più tardi.",
    d7: "7 giorni",
    d30: "30 giorni",
    total: "Totale",
    metric: "Dato",
    views: "Visite",
    reads: "Letture complete",
    readRate: "Letti fino in fondo",
    allComics: "Tutti i tuoi fumetti",
    byLang: "Per lingua della pagina",
    chartTitle: "Visite e letture complete al giorno, ultimi 30 giorni",
    chartAria: "Grafico: visite e letture complete al giorno negli ultimi 30 giorni. Visite: {views}; letture complete: {reads}.",
    draft: "Bozza",
    hidden: "Nascosto",
    staffTitle: "Staff: i fumetti più visti (30 giorni)",
    staffIntro: "La vedono solo gli admin e chi ha il tag Staff: tutti i fumetti pubblicati, con le stesse stime.",
    staffEmpty: "Nessuna visita registrata negli ultimi 30 giorni.",
    partial: "Classifica parziale: le righe sono troppe per leggerle tutte.",
    notVisible: "fumetto non visibile",
    by: "di",
  },
  es: {
    title: "Estadísticas de los cómics",
    intro:
      "Cómo van los cómics que publicaste: visitas y lecturas completas (la última página llegó a la pantalla), por idioma de la página, en los últimos 7 y 30 días y en total. Tus visitas con la sesión iniciada no cuentan.",
    estimate:
      "Son estimaciones: cada pestaña del navegador cuenta una vez por cómic, idioma y tipo, y quedan fuera los bots y el tráfico del staff. Una visita cuenta después de unos segundos en la página; una lectura completa, cuando la última página entra en la pantalla. Días en UTC.",
    since: "Primer día con datos: {date}",
    noData: "Todavía no hay datos: los números aparecen tras las primeras visitas a tus cómics.",
    unavailable: "Las estadísticas de los cómics todavía no están disponibles. Vuelve a intentarlo más tarde.",
    d7: "7 días",
    d30: "30 días",
    total: "Total",
    metric: "Dato",
    views: "Visitas",
    reads: "Lecturas completas",
    readRate: "Leídos hasta el final",
    allComics: "Todos tus cómics",
    byLang: "Por idioma de la página",
    chartTitle: "Visitas y lecturas completas por día, últimos 30 días",
    chartAria: "Gráfico: visitas y lecturas completas por día en los últimos 30 días. Visitas: {views}; lecturas completas: {reads}.",
    draft: "Borrador",
    hidden: "Oculto",
    staffTitle: "Staff: los cómics más vistos (30 días)",
    staffIntro: "Solo la ven los administradores y quien tiene la etiqueta Staff: todos los cómics publicados, con las mismas estimaciones.",
    staffEmpty: "No hay visitas registradas en los últimos 30 días.",
    partial: "Clasificación parcial: hay demasiadas filas para leerlas todas.",
    notVisible: "cómic no visible",
    by: "de",
  },
  fr: {
    title: "Statistiques des BD",
    intro:
      "Comment se portent vos BD publiées : visites et lectures complètes (la dernière planche est arrivée à l'écran), par langue de la page, sur les 7 et 30 derniers jours et au total. Vos propres visites avec la session ouverte ne comptent pas.",
    estimate:
      "Ce sont des estimations : chaque onglet du navigateur compte une fois par BD, langue et type, et les bots comme le trafic du staff sont exclus. Une visite compte après quelques secondes sur la page ; une lecture complète, quand la dernière planche entre dans l'écran. Les jours sont en UTC.",
    since: "Premier jour avec des données : {date}",
    noData: "Pas encore de données : les chiffres apparaissent après les premières visites de vos BD.",
    unavailable: "Les statistiques des BD ne sont pas encore disponibles. Réessayez plus tard.",
    d7: "7 jours",
    d30: "30 jours",
    total: "Total",
    metric: "Donnée",
    views: "Visites",
    reads: "Lectures complètes",
    readRate: "Lues jusqu'au bout",
    allComics: "Toutes vos BD",
    byLang: "Par langue de la page",
    chartTitle: "Visites et lectures complètes par jour, 30 derniers jours",
    chartAria: "Graphique : visites et lectures complètes par jour sur les 30 derniers jours. Visites : {views} ; lectures complètes : {reads}.",
    draft: "Brouillon",
    hidden: "Masquée",
    staffTitle: "Staff : les BD les plus consultées (30 jours)",
    staffIntro: "Seuls les administrateurs et le Staff voient ce classement : toutes les BD publiées, avec les mêmes estimations.",
    staffEmpty: "Aucune visite enregistrée sur les 30 derniers jours.",
    partial: "Classement partiel : il y a trop de lignes pour toutes les lire.",
    notVisible: "BD non visible",
    by: "par",
  },
  pt: {
    title: "Estatísticas dos quadrinhos",
    intro:
      "Como estão indo os quadrinhos que você publicou: visitas e leituras completas (a última página chegou à tela), por idioma da página, nos últimos 7 e 30 dias e no total. As suas próprias visitas com o login feito não contam.",
    estimate:
      "São estimativas: cada aba do navegador conta uma vez por quadrinho, idioma e tipo, e os bots e o tráfego do staff ficam de fora. Uma visita conta depois de alguns segundos na página; uma leitura completa, quando a última página entra na tela. Os dias estão em UTC.",
    since: "Primeiro dia com dados: {date}",
    noData: "Ainda não há dados: os números aparecem depois das primeiras visitas aos seus quadrinhos.",
    unavailable: "As estatísticas dos quadrinhos ainda não estão disponíveis. Tente de novo mais tarde.",
    d7: "7 dias",
    d30: "30 dias",
    total: "Total",
    metric: "Métrica",
    views: "Visitas",
    reads: "Leituras completas",
    readRate: "Lidos até o fim",
    allComics: "Todos os seus quadrinhos",
    byLang: "Por idioma da página",
    chartTitle: "Visitas e leituras completas por dia, últimos 30 dias",
    chartAria: "Gráfico: visitas e leituras completas por dia nos últimos 30 dias. Visitas: {views}; leituras completas: {reads}.",
    draft: "Rascunho",
    hidden: "Oculto",
    staffTitle: "Staff: quadrinhos mais visitados (30 dias)",
    staffIntro: "Só os administradores e o Staff veem este ranking: todos os quadrinhos publicados, com as mesmas estimativas.",
    staffEmpty: "Nenhuma visita registrada nos últimos 30 dias.",
    partial: "Ranking parcial: há linhas demais para ler todas.",
    notVisible: "quadrinho não visível",
    by: "de",
  },
  de: {
    title: "Comic-Statistiken",
    intro:
      "Wie deine veröffentlichten Comics laufen: Besuche und vollständige Lesungen (die letzte Seite ist auf dem Bildschirm angekommen), nach Sprache der Seite, in den letzten 7 und 30 Tagen und insgesamt. Deine eigenen Besuche mit Anmeldung zählen nicht.",
    estimate:
      "Das sind Schätzungen: Jeder Browser-Tab zählt einmal pro Comic, Sprache und Art, Bots und Staff-Traffic bleiben außen vor. Ein Besuch zählt nach ein paar Sekunden auf der Seite; eine vollständige Lesung, wenn die letzte Seite ins Bild kommt. Die Tage sind in UTC.",
    since: "Erster Tag mit Daten: {date}",
    noData: "Noch keine Daten: Die Zahlen erscheinen nach den ersten Besuchen deiner Comics.",
    unavailable: "Die Comic-Statistiken sind noch nicht verfügbar. Versuch es später noch einmal.",
    d7: "7 Tage",
    d30: "30 Tage",
    total: "Gesamt",
    metric: "Kennzahl",
    views: "Besuche",
    reads: "Vollständige Lesungen",
    readRate: "Bis zum Ende gelesen",
    allComics: "Alle deine Comics",
    byLang: "Nach Sprache der Seite",
    chartTitle: "Besuche und vollständige Lesungen pro Tag, letzte 30 Tage",
    chartAria: "Diagramm: Besuche und vollständige Lesungen pro Tag in den letzten 30 Tagen. Besuche: {views}; vollständige Lesungen: {reads}.",
    draft: "Entwurf",
    hidden: "Ausgeblendet",
    staffTitle: "Staff: die meistbesuchten Comics (30 Tage)",
    staffIntro: "Dieses Ranking sehen nur Admins und der Staff: alle veröffentlichten Comics, mit denselben Schätzungen.",
    staffEmpty: "In den letzten 30 Tagen wurden keine Besuche erfasst.",
    partial: "Unvollständiges Ranking: Es gibt zu viele Zeilen, um alle zu lesen.",
    notVisible: "Comic nicht sichtbar",
    by: "von",
  },
  ru: {
    title: "Статистика комиксов",
    intro:
      "Как идут дела у ваших опубликованных комиксов: посещения и полные прочтения (последняя страница появилась на экране), по языку страницы, за последние 7 и 30 дней и за всё время. Ваши собственные посещения после входа не учитываются.",
    estimate:
      "Это оценки: каждая вкладка браузера учитывается один раз на комикс, язык и тип, а боты и трафик команды Staff исключаются. Посещение засчитывается после нескольких секунд на странице; полное прочтение — когда последняя страница появляется на экране. Дни считаются по UTC.",
    since: "Первый день с данными: {date}",
    noData: "Данных пока нет: числа появятся после первых посещений ваших комиксов.",
    unavailable: "Статистика комиксов пока недоступна. Попробуйте позже.",
    d7: "7 дней",
    d30: "30 дней",
    total: "Всего",
    metric: "Показатель",
    views: "Посещения",
    reads: "Полные прочтения",
    readRate: "Прочитаны до конца",
    allComics: "Все ваши комиксы",
    byLang: "По языку страницы",
    chartTitle: "Посещения и полные прочтения по дням, последние 30 дней",
    chartAria: "График: посещения и полные прочтения по дням за последние 30 дней. Посещения: {views}; полные прочтения: {reads}.",
    draft: "Черновик",
    hidden: "Скрыт",
    staffTitle: "Staff: самые посещаемые комиксы (30 дней)",
    staffIntro: "Этот рейтинг видят только админы и Staff: все опубликованные комиксы, с теми же оценками.",
    staffEmpty: "За последние 30 дней посещений не зафиксировано.",
    partial: "Неполный рейтинг: строк слишком много, чтобы прочитать все.",
    notVisible: "комикс не виден",
    by: "автор:",
  },
};

/**
 * Riga dell'informativa privacy (pagina /privacy, ancora #comic-stats): statistiche aggregate per fumetto, giorno e
 * lingua della pagina, senza dati personali; la stessa memoria di sessione dei mazzi evita di contare due volte.
 */
export const comicStatsPrivacy: Record<Locale, string> = {
  en: "Comic stats: on the page of a creator's comic, the site counts, for each comic, each day and each page language, visits and complete reads (the last page reached the screen), and shows these totals only to whoever drew the comic and to the OriginsMeta staff. Only the daily totals are stored, on Supabase (Ireland, EU): no IP address, no account and no identifier. The request goes through Supabase's servers, which, like Vercel, keep the usual technical logs (IP address included) for a short time, never linked to the totals. So that the same visit isn't counted twice, the browser notes which comics it has already counted in the tab's session storage, which is cleared when you close the tab and is never sent. Bots, staff browsers and people viewing their own comics while signed in are not counted.",
  it: "Statistiche dei fumetti: nella pagina del fumetto di un creator il sito conta, per ogni fumetto, ogni giorno e ogni lingua della pagina, le visite e le letture complete (l'ultima tavola arrivata sullo schermo), e mostra questi totali solo a chi ha disegnato il fumetto e allo staff di OriginsMeta. Si salvano solo i totali del giorno, su Supabase (Irlanda, UE): nessun indirizzo IP, nessun account, nessun identificativo. La richiesta passa dai server di Supabase, che come Vercel conservano per poco i normali log tecnici (indirizzo IP compreso), mai collegati ai totali. Perché la stessa visita non conti due volte, il browser annota i fumetti già contati nella memoria di sessione della scheda, che si cancella quando chiudi la scheda e non viene mai inviata. Non si contano i bot, i browser dello staff e chi guarda i propri fumetti con l'accesso fatto.",
  es: "Estadísticas de los cómics: en la página del cómic de un creador, el sitio cuenta, para cada cómic, cada día y cada idioma de la página, las visitas y las lecturas completas (la última página llegó a la pantalla), y muestra estos totales solo a quien dibujó el cómic y al staff de OriginsMeta. Solo se guardan los totales del día, en Supabase (Irlanda, UE): ninguna dirección IP, ninguna cuenta, ningún identificador. La solicitud pasa por los servidores de Supabase, que, como Vercel, conservan por poco tiempo los registros técnicos habituales (dirección IP incluida), nunca vinculados a los totales. Para que la misma visita no cuente dos veces, el navegador anota los cómics ya contados en la memoria de sesión de la pestaña, que se borra al cerrar la pestaña y nunca se envía. No se cuentan los bots, los navegadores del staff ni las visitas de quien ve sus propios cómics con la sesión iniciada.",
  fr: "Statistiques des BD : sur la page de la BD d'un créateur, le site compte, pour chaque BD, chaque jour et chaque langue de la page, les visites et les lectures complètes (la dernière planche est arrivée à l'écran), et montre ces totaux uniquement à la personne qui a dessiné la BD et au staff d'OriginsMeta. Seuls les totaux du jour sont enregistrés, sur Supabase (Irlande, UE) : aucune adresse IP, aucun compte, aucun identifiant. La requête passe par les serveurs de Supabase, qui, comme Vercel, conservent peu de temps les journaux techniques habituels (adresse IP comprise), jamais reliés aux totaux. Pour que la même visite ne compte pas deux fois, le navigateur note les BD déjà comptées dans la mémoire de session de l'onglet, effacée quand vous fermez l'onglet et jamais envoyée. Les bots, les navigateurs du staff et les personnes qui consultent leurs propres BD avec la session ouverte ne sont pas comptés.",
  pt: "Estatísticas dos quadrinhos: na página do quadrinho de um creator, o site conta, para cada quadrinho, cada dia e cada idioma da página, as visitas e as leituras completas (a última página chegou à tela), e mostra esses totais só para quem desenhou o quadrinho e para o staff do OriginsMeta. Só os totais do dia são salvos, no Supabase (Irlanda, UE): nenhum endereço IP, nenhuma conta, nenhum identificador. A solicitação passa pelos servidores do Supabase, que, como a Vercel, guardam por pouco tempo os registros técnicos habituais (endereço IP incluído), nunca ligados aos totais. Para que a mesma visita não conte duas vezes, o navegador anota os quadrinhos já contados na memória de sessão da aba, que é apagada quando você fecha a aba e nunca é enviada. Não são contados os bots, os navegadores do staff nem quem vê os próprios quadrinhos com o login feito.",
  de: "Comic-Statistiken: Auf der Seite des Comics eines Creators zählt die Website für jeden Comic, jeden Tag und jede Sprache der Seite die Besuche und die vollständigen Lesungen (die letzte Seite ist auf dem Bildschirm angekommen) und zeigt diese Summen nur der Person, die den Comic gezeichnet hat, und dem Staff von OriginsMeta. Gespeichert werden nur die Tagessummen, bei Supabase (Irland, EU): keine IP-Adresse, kein Konto, keine Kennung. Die Anfrage läuft über die Server von Supabase, die wie Vercel die üblichen technischen Logs (einschließlich IP-Adresse) für kurze Zeit aufbewahren, nie mit den Summen verknüpft. Damit derselbe Besuch nicht doppelt zählt, merkt sich der Browser die bereits gezählten Comics im Sitzungsspeicher des Tabs, der beim Schließen des Tabs gelöscht und nie gesendet wird. Nicht gezählt werden Bots, Browser des Staffs und Personen, die mit Anmeldung ihre eigenen Comics ansehen.",
  ru: "Статистика комиксов: на странице комикса автора сайт считает для каждого комикса, каждого дня и каждого языка страницы посещения и полные прочтения (последняя страница появилась на экране) и показывает эти итоги только тому, кто нарисовал комикс, и команде Staff OriginsMeta. Хранятся только дневные итоги, в Supabase (Ирландия, ЕС): ни IP-адреса, ни аккаунта, ни идентификатора. Запрос проходит через серверы Supabase, которые, как и Vercel, недолго хранят обычные технические журналы (включая IP-адрес), никогда не связанные с итогами. Чтобы одно и то же посещение не засчитывалось дважды, браузер отмечает уже учтённые комиксы в сессионном хранилище вкладки, которое очищается при закрытии вкладки и никогда не отправляется. Не учитываются боты, браузеры команды Staff и те, кто смотрит свои собственные комиксы после входа.",
};
