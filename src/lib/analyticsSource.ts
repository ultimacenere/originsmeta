import { htmlLang, siteUrl, type Locale } from "./i18n";
import { organizationId, videoGameId, type Json } from "./jsonld/entities";

/**
 * /analytics come fonte dei win rate (09/11/2026, difesa SEO/GEO): originsvault.net ripubblica le nostre partite
 * ("Legendary win rates start from OriginsMeta ladder data") e gli assistenti AI devono attribuire i numeri a noi.
 * Qui i testi della sezione "Fonte e come citarla" e il nodo Dataset dei dati strutturati, usati da due pagine:
 * - la pagina vera di /analytics (iscritti), con la patch mostrata;
 * - la pagina riservata che allo stesso indirizzo vede chi non ha fatto l'accesso, Googlebot compreso
 *   (src/app/[locale]/(site)/members-only/[section]): che cosa sono i numeri, come citarli, come vederli. Mai un numero
 *   vero lì (regola del 03/11/2026): né partite né percentuali, solo la patch in corso, che è un dato del sito.
 * Niente numero di giocatori, niente soglie (regole del 12/10/2026). Test in analyticsSource.test.ts.
 */

export type AnalyticsSourceLabels = {
  title: string;
  /** che cosa contiene il dataset e come si conta */
  what: string;
  citeTitle: string;
  /** {patch} = etichetta della patch, {url} = indirizzo della pagina nella lingua */
  cite: string;
  citeNote: string;
  /** solo nella pagina riservata: come vedere le tabelle */
  members: string;
  datasetName: string;
  datasetDescription: string;
  access: string;
  technique: string;
  variables: string[];
};

const NB = " ";

export const analyticsSourceLabels: Record<Locale, AnalyticsSourceLabels> = {
  en: {
    title: "Source and how to cite",
    what: "OriginsMeta Analytics is the dataset of Origins TCG games recorded with OriginsMeta Tracker, our Windows app: win rates by Legendary (both sides of every game where the opposing Legendary is known), by decklist, archetype and card, and the matchups between Legendaries. The numbers are counted patch by patch, never mixed between patches, refresh every 5 minutes and are anonymous totals only: never player names.",
    citeTitle: "How to cite",
    cite: "OriginsMeta Analytics, “Origins TCG win rates”, patch {patch}, {url}",
    citeNote: "Add the date you read the numbers: they change with every recorded game. If you republish them, link this page.",
    members: "The tables are free for members: sign up with Discord or your email, no password.",
    datasetName: "OriginsMeta Analytics: Origins TCG win rates",
    datasetDescription: "Win rates of Origins TCG (Koin Games) from the games recorded with the OriginsMeta Tracker app: by Legendary, decklist, archetype and card, plus the matchups between Legendaries, patch by patch. Anonymous totals only.",
    access: "Free OriginsMeta account (Discord or email)",
    technique: "Games recorded automatically by the OriginsMeta Tracker desktop app for Windows; win rates ordered by the lower bound of the 95% Wilson interval.",
    variables: ["Win rate by Legendary", "Win rate by decklist", "Win rate by archetype", "Win rate by card", "Matchups between Legendaries", "Games per patch"],
  },
  it: {
    title: "Fonte e come citarla",
    what: "OriginsMeta Analytics è l'insieme delle partite di Origins TCG registrate con OriginsMeta Tracker, la nostra app per Windows: win rate per Leggendaria (contando i due lati di ogni partita in cui la Leggendaria avversaria è nota), per lista, archetipo e carta, e gli scontri fra Leggendarie. I numeri si contano patch per patch, mai mescolando patch diverse, si aggiornano ogni 5 minuti e sono solo totali anonimi: mai i nomi dei giocatori.",
    citeTitle: "Come citarla",
    cite: "OriginsMeta Analytics, “Win rate di Origins TCG”, patch {patch}, {url}",
    citeNote: "Aggiungi la data in cui hai letto i numeri: cambiano a ogni partita registrata. Se li ripubblichi, linka questa pagina.",
    members: "Le tabelle sono gratis per gli iscritti: registrati con Discord o con la tua email, senza password.",
    datasetName: "OriginsMeta Analytics: win rate di Origins TCG",
    datasetDescription: "Win rate di Origins TCG (Koin Games) dalle partite registrate con l'app OriginsMeta Tracker: per Leggendaria, lista, archetipo e carta, più gli scontri fra Leggendarie, patch per patch. Solo totali anonimi.",
    access: "Account gratuito di OriginsMeta (Discord o email)",
    technique: "Partite registrate in automatico dall'app desktop OriginsMeta Tracker per Windows; win rate ordinati per il bordo basso dell'intervallo di Wilson al 95%.",
    variables: ["Win rate per Leggendaria", "Win rate per lista", "Win rate per archetipo", "Win rate per carta", "Scontri fra Leggendarie", "Partite per patch"],
  },
  es: {
    title: "Fuente y cómo citarla",
    what: "OriginsMeta Analytics es el conjunto de partidas de Origins TCG registradas con OriginsMeta Tracker, nuestra app para Windows: win rate por Legendaria (contando los dos lados de cada partida en la que se conoce la Legendaria rival), por lista, arquetipo y carta, y los enfrentamientos entre Legendarias. Las cifras se cuentan parche por parche, sin mezclar parches, se actualizan cada 5 minutos y son solo totales anónimos: nunca nombres de jugadores.",
    citeTitle: "Cómo citarla",
    cite: "OriginsMeta Analytics, “Win rate de Origins TCG”, parche {patch}, {url}",
    citeNote: "Añade la fecha en que leíste las cifras: cambian con cada partida registrada. Si las republicas, enlaza esta página.",
    members: "Las tablas son gratis para los miembros: regístrate con Discord o con tu email, sin contraseña.",
    datasetName: "OriginsMeta Analytics: win rate de Origins TCG",
    datasetDescription: "Win rate de Origins TCG (Koin Games) con las partidas registradas en la app OriginsMeta Tracker: por Legendaria, lista, arquetipo y carta, más los enfrentamientos entre Legendarias, por parche. Solo totales anónimos.",
    access: "Cuenta gratuita de OriginsMeta (Discord o email)",
    technique: `Partidas registradas automáticamente por la app de escritorio OriginsMeta Tracker para Windows; win rate ordenado por el extremo inferior del intervalo de Wilson al 95${NB}%.`,
    variables: ["Win rate por Legendaria", "Win rate por lista", "Win rate por arquetipo", "Win rate por carta", "Enfrentamientos entre Legendarias", "Partidas por parche"],
  },
  fr: {
    title: "Source et comment la citer",
    what: `OriginsMeta Analytics est l'ensemble des parties d'Origins TCG enregistrées avec OriginsMeta Tracker, notre app pour Windows${NB}: win rate par Légendaire (en comptant les deux côtés de chaque partie où la Légendaire adverse est connue), par liste, archétype et carte, et les affrontements entre Légendaires. Les chiffres sont comptés patch par patch, sans jamais mélanger les patchs, se mettent à jour toutes les 5${NB}minutes et ne sont que des totaux anonymes${NB}: jamais de noms de joueurs.`,
    citeTitle: "Comment la citer",
    cite: `OriginsMeta Analytics, «${NB}Win rate d'Origins TCG${NB}», patch {patch}, {url}`,
    citeNote: `Ajoutez la date à laquelle vous avez lu les chiffres${NB}: ils changent à chaque partie enregistrée. Si vous les republiez, mettez un lien vers cette page.`,
    members: `Les tableaux sont gratuits pour les membres${NB}: inscrivez-vous avec Discord ou votre e-mail, sans mot de passe.`,
    datasetName: `OriginsMeta Analytics${NB}: win rate d'Origins TCG`,
    datasetDescription: `Win rate d'Origins TCG (Koin Games) d'après les parties enregistrées avec l'app OriginsMeta Tracker${NB}: par Légendaire, liste, archétype et carte, plus les affrontements entre Légendaires, patch par patch. Totaux anonymes uniquement.`,
    access: "Compte OriginsMeta gratuit (Discord ou e-mail)",
    technique: `Parties enregistrées automatiquement par l'app de bureau OriginsMeta Tracker pour Windows${NB}; win rate classés selon la borne basse de l'intervalle de Wilson à 95${NB}%.`,
    variables: ["Win rate par Légendaire", "Win rate par liste", "Win rate par archétype", "Win rate par carte", "Affrontements entre Légendaires", "Parties par patch"],
  },
  pt: {
    title: "Fonte e como citar",
    what: "O OriginsMeta Analytics é o conjunto de partidas de Origins TCG registradas com o OriginsMeta Tracker, o nosso app para Windows: win rate por Lendária (contando os dois lados de cada partida em que a Lendária adversária é conhecida), por lista, arquétipo e carta, e os confrontos entre Lendárias. Os números são contados patch a patch, sem misturar patches, são atualizados a cada 5 minutos e são só totais anônimos: nunca nomes de jogadores.",
    citeTitle: "Como citar",
    cite: "OriginsMeta Analytics, “Win rate de Origins TCG”, patch {patch}, {url}",
    citeNote: "Inclua a data em que você leu os números: eles mudam a cada partida registrada. Se você republicar, coloque um link para esta página.",
    members: "As tabelas são grátis para membros: cadastre-se com o Discord ou com o seu e-mail, sem senha.",
    datasetName: "OriginsMeta Analytics: win rate de Origins TCG",
    datasetDescription: "Win rate de Origins TCG (Koin Games) a partir das partidas registradas com o app OriginsMeta Tracker: por Lendária, lista, arquétipo e carta, mais os confrontos entre Lendárias, patch a patch. Só totais anônimos.",
    access: "Conta gratuita do OriginsMeta (Discord ou e-mail)",
    technique: "Partidas registradas automaticamente pelo app de desktop OriginsMeta Tracker para Windows; win rate ordenado pelo limite inferior do intervalo de Wilson de 95%.",
    variables: ["Win rate por Lendária", "Win rate por lista", "Win rate por arquétipo", "Win rate por carta", "Confrontos entre Lendárias", "Partidas por patch"],
  },
  de: {
    title: "Quelle und Zitierweise",
    what: "OriginsMeta Analytics sind die Spiele von Origins TCG, die mit OriginsMeta Tracker, unserer Windows-App, aufgezeichnet werden: Win-Rates nach Legendärer (beide Seiten jedes Spiels, in dem die gegnerische Legendäre bekannt ist), nach Liste, Archetyp und Karte sowie die Matchups zwischen Legendären. Gezählt wird Patch für Patch, nie gemischt, aktualisiert alle 5 Minuten, und es sind nur anonyme Summen: nie Spielernamen.",
    citeTitle: "So zitierst du",
    cite: "OriginsMeta Analytics, „Win-Rates von Origins TCG“, Patch {patch}, {url}",
    citeNote: "Gib das Datum an, an dem du die Zahlen gelesen hast: Sie ändern sich mit jedem aufgezeichneten Spiel. Wenn du sie veröffentlichst, verlinke diese Seite.",
    members: "Die Tabellen sind für Mitglieder kostenlos: Registriere dich mit Discord oder deiner E-Mail, ohne Passwort.",
    datasetName: "OriginsMeta Analytics: Win-Rates von Origins TCG",
    datasetDescription: "Win-Rates von Origins TCG (Koin Games) aus den Spielen der App OriginsMeta Tracker: nach Legendärer, Liste, Archetyp und Karte, dazu die Matchups zwischen Legendären, Patch für Patch. Nur anonyme Summen.",
    access: "Kostenloses OriginsMeta-Konto (Discord oder E-Mail)",
    technique: "Spiele automatisch aufgezeichnet von der Desktop-App OriginsMeta Tracker für Windows; Win-Rates sortiert nach der unteren Grenze des 95-%-Wilson-Intervalls.",
    variables: ["Win-Rate nach Legendärer", "Win-Rate nach Liste", "Win-Rate nach Archetyp", "Win-Rate nach Karte", "Matchups zwischen Legendären", "Spiele pro Patch"],
  },
  ru: {
    title: "Источник и как ссылаться",
    what: "OriginsMeta Analytics — это партии Origins TCG, записанные в OriginsMeta Tracker, нашем приложении для Windows: винрейт по Легендарным (с обеих сторон каждой партии, где известна Легендарная соперника), по спискам, архетипам и картам, а также матчапы между Легендарными. Цифры считаются отдельно для каждого патча, без смешивания, обновляются каждые 5 минут и показывают только анонимные суммы: никаких имён игроков.",
    citeTitle: "Как ссылаться",
    cite: "OriginsMeta Analytics, «Винрейт Origins TCG», патч {patch}, {url}",
    citeNote: "Укажите дату, когда вы смотрели цифры: они меняются с каждой записанной партией. Если вы их публикуете, поставьте ссылку на эту страницу.",
    members: "Таблицы бесплатны для участников: зарегистрируйтесь через Discord или e-mail, без пароля.",
    datasetName: "OriginsMeta Analytics: винрейт Origins TCG",
    datasetDescription: "Винрейт Origins TCG (Koin Games) по партиям, записанным в приложении OriginsMeta Tracker: по Легендарным, спискам, архетипам и картам, плюс матчапы между Легендарными, патч за патчем. Только анонимные суммы.",
    access: "Бесплатный аккаунт OriginsMeta (Discord или e-mail)",
    technique: "Партии автоматически записывает настольное приложение OriginsMeta Tracker для Windows; винрейт упорядочен по нижней границе 95-процентного интервала Уилсона.",
    variables: ["Винрейт по Легендарным", "Винрейт по спискам", "Винрейт по архетипам", "Винрейт по картам", "Матчапы между Легендарными", "Партии за патч"],
  },
  "zh-cn": {
    title: "数据来源与引用方式",
    what: "OriginsMeta Analytics 是玩家用我们的 Windows 应用 OriginsMeta Tracker 记录的 Origins TCG 对局数据：按传说卡统计的胜率（在已知对手传说卡的对局中，双方都计入）、按卡表、流派和单卡统计的胜率，以及传说卡之间的对位。数据按补丁分别统计，绝不跨补丁混合，每 5 分钟更新一次，只显示匿名总数，从不显示玩家名字。",
    citeTitle: "如何引用",
    cite: "OriginsMeta Analytics，《Origins TCG 胜率》，补丁 {patch}，{url}",
    citeNote: "请注明你读取数据的日期：每记录一局，数据都会变化。如果转载这些数据，请链接到本页面。",
    members: "注册会员即可免费查看表格：用 Discord 或邮箱注册，无需密码。",
    datasetName: "OriginsMeta Analytics：Origins TCG 胜率",
    datasetDescription: "Origins TCG（Koin Games）胜率数据，来自 OriginsMeta Tracker 应用记录的对局：按传说卡、卡表、流派和单卡统计，以及传说卡之间的对位胜率，按补丁分别统计，只显示匿名总数。",
    access: "免费的 OriginsMeta 账户（Discord 或邮箱）",
    technique: "由 Windows 桌面应用 OriginsMeta Tracker 自动记录对局；胜率按 95% Wilson 区间的下限排序。",
    variables: ["按传说卡统计的胜率", "按卡表统计的胜率", "按流派统计的胜率", "按单卡统计的胜率", "传说卡之间的对位", "每个补丁的对局数"],
  },
};

/** Indirizzo assoluto di /analytics nella lingua. */
export const analyticsUrl = (locale: Locale): string => `${siteUrl}/${locale}/analytics`;

/** La riga da citare, con la patch e l'indirizzo della pagina. */
export function analyticsCitation(locale: Locale, patch: string): string {
  return analyticsSourceLabels[locale].cite.replace("{patch}", patch).replace("{url}", analyticsUrl(locale));
}

/**
 * Il nodo Dataset di /analytics. Un solo @id per lingua (la pagina della fonte e quella vera stanno allo stesso
 * indirizzo). Nessun valore dei dati: nome, descrizione, chi lo fa, come si misura, come si accede (account gratuito).
 */
export function analyticsDataset(locale: Locale): Json {
  const l = analyticsSourceLabels[locale];
  const url = analyticsUrl(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: l.datasetName,
    description: l.datasetDescription,
    url,
    inLanguage: htmlLang[locale],
    creator: { "@id": organizationId },
    publisher: { "@id": organizationId },
    about: { "@id": videoGameId },
    isAccessibleForFree: true,
    conditionsOfAccess: l.access,
    measurementTechnique: l.technique,
    variableMeasured: l.variables,
    keywords: ["Origins TCG", "Koin Games", "win rate", "meta", "Legendary", "tier list"],
    // le statistiche partono dalla patch 0.7 (29/09/2026), la prima con le partite registrate dall'app
    temporalCoverage: "2026-09-29/..",
  };
}
