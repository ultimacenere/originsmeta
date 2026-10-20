import type { Locale } from "./i18n";
import type { MarketKind, MarketRange } from "./market/market";

/**
 * Testi del tracker dei prezzi del mercato di Steam (17/10/2026) nelle cinque lingue: pagine /market, /market/<oggetto>,
 * /market/demo (la controfigura) e il grafico. Funzioni pure, senza import a runtime: i test (market.test.ts)
 * controllano titoli e description con le regole di `pageTitle` e `cleanDescription` e gli stessi segnaposto in ogni
 * lingua. Nomi ufficiali del mercato: Steam Community Market / Mercato della Comunità di Steam / Mercado de la Comunidad
 * de Steam / Marché de la communauté Steam. Francese con lo spazio insecabile (U+00A0) prima di : ; ? ! (docs/francese.md).
 */

type Labels = {
  meta: { title: string; description: string; demoTitle: string; demoDescription: string; itemSuffix: string; itemDescription: string };
  h1: string;
  demoH1: string;
  /** pagina per chi non può ancora aprire il Mercato (prova riservata, 18/10/2026) */
  locked: { kicker: string; text: string; back: string };
  crumb: string;
  status: { closed: string; checking: string; lastCheck: string; neverChecked: string; unavailable: string; live: string; utc: string; sweep: string };
  soon: { title: string; points: string[]; when: string; sets: string; guide: string };
  demoLink: { title: string; text: string; cta: string };
  demo: { banner: string; back: string };
  currency: { label: string };
  board: {
    search: string;
    searchPlaceholder: string;
    kind: string;
    kinds: Record<"all" | MarketKind, string>;
    /** i tipi nella prova del motore (CS2): skin e casse al posto di carte e buste */
    demoKinds: Record<"all" | MarketKind, string>;
    sort: string;
    sorts: { name: string; price: string; change: string; listings: string };
    /** il verso dell'ordinamento (18/10/2026): nei tasti e nelle intestazioni della tabella */
    sortDirs: { az: string; za: string; high: string; low: string };
    columns: { item: string; price: string; change24h: string; change7d: string; listings: string };
    count: string;
    countOne: string;
    noResults: string;
    noOffers: string;
    variants: Record<string, string>;
  };
  movers: { title: string; up: string; down: string; none: string };
  item: {
    back: string;
    price: string;
    listings: string;
    change24h: string;
    change7d: string;
    change30d: string;
    firstSeen: string;
    lastSeen: string;
    onSteam: string;
    chartTitle: string;
    chartAria: string;
    ranges: Record<MarketRange, string>;
    noHistory: string;
    table: { show: string; time: string; low: string; high: string; close: string; listings: string };
    kind: string;
    variant: string;
  };
  notes: { title: string; points: string[] };
};

const en: Labels = {
  meta: {
    title: "Origins TCG card prices on the Steam Market",
    description: "Steam Community Market prices for every Origins TCG card, variant and item: lowest price, listings and price history in euros and dollars.",
    demoTitle: "Steam Market price tracker: engine test",
    demoDescription: "Our Steam Market price tracker at work on a game that is already on the market, before Origins TCG trading opens: lowest price, listings and price history.",
    itemSuffix: "Steam price",
    itemDescription: "{name}: lowest price on the Steam Community Market, number of listings and price history in euros and dollars, checked every 10 minutes.",
  },
  h1: "Origins TCG prices on the Steam Market",
  demoH1: "Price tracker: engine test",
  locked: { kicker: "Private test", text: "The Steam Community Market price tracker is in a private test with the OriginsMeta team. It opens to everyone when Origins TCG trading starts.", back: "Back to the home page" },
  crumb: "Market",
  status: {
    closed: "The Steam Community Market for Origins TCG is not open yet.",
    checking: "We check it every {min} minutes: from the first item on sale, the site records the price and the listings of every card, variant and item, and builds its own price history.",
    lastCheck: "Last check:",
    neverChecked: "First check coming soon.",
    unavailable: "The price tracker is not active yet.",
    live: "Prices from the Steam Community Market, checked every {min} minutes.",
    utc: "UTC",
    sweep: "With many items a full round takes more than one check: every item is updated at least every {min} minutes.",
  },
  soon: {
    title: "What you will find here",
    points: [
      "The lowest price on sale and the number of listings of every card, variant and item, in euros or dollars.",
      "A price chart for every item: last 24 hours, 7 days, 30 days and the whole history.",
      "The biggest risers and fallers of the last 24 hours.",
    ],
    when: "Koin Games has said that Origins TCG collectibles will be tradable on the Steam Community Market; the opening day is not official yet.",
    sets: "Sets, rarities and grading",
    guide: "The collector economy",
  },
  demoLink: {
    title: "See the engine at work",
    text: "Until Origins TCG trading opens, the tracker runs on a collection of Counter-Strike 2, the biggest market on Steam.",
    cta: "Open the engine test",
  },
  demo: {
    banner: "This is a test of the engine on the Dreams & Nightmares collection of Counter-Strike 2 (Valve), the biggest market on Steam: skins with rarities, wear and StatTrak versions, the way Origins TCG cards will have rarities, grades and variants. They are not Origins TCG cards.",
    back: "Back to Origins TCG prices",
  },
  currency: { label: "Currency" },
  board: {
    search: "Search",
    searchPlaceholder: "Item name…",
    kind: "Type",
    kinds: { all: "All", card: "Cards", pack: "Packs", other: "Other items" },
    demoKinds: { all: "All", card: "Skins", pack: "Cases", other: "Other items" },
    sort: "Sort by",
    sorts: { name: "Name", price: "Price", change: "24h change", listings: "Listings" },
    sortDirs: { az: "A to Z", za: "Z to A", high: "highest first", low: "lowest first" },
    columns: { item: "Item", price: "Lowest price", change24h: "24h", change7d: "7 days", listings: "Listings" },
    count: "{n} items",
    countOne: "1 item",
    noResults: "No item matches the filters.",
    noOffers: "No listings",
    variants: { normal: "Normal", foil: "Foil" },
  },
  movers: { title: "Last 24 hours", up: "Rising", down: "Falling", none: "No change to show yet: the comparison starts after 24 hours of history." },
  item: {
    back: "All prices",
    price: "Lowest price",
    listings: "Listings",
    change24h: "24 hours",
    change7d: "7 days",
    change30d: "30 days",
    firstSeen: "On the market since",
    lastSeen: "Last check",
    onSteam: "See it on Steam",
    chartTitle: "Lowest price on sale",
    chartAria: "Lowest price on sale of {name}, {range}",
    ranges: { "24h": "24h", "7d": "7 days", "30d": "30 days", all: "All" },
    noHistory: "The history starts now: the chart fills up at every check.",
    table: { show: "Show the data", time: "Time", low: "Low", high: "High", close: "Last", listings: "Listings" },
    kind: "Type",
    variant: "Variant",
  },
  notes: {
    title: "How we read prices",
    points: [
      "Source: the public pages of the Steam Community Market. For every item we record the lowest price on sale and the number of listings; Steam does not publish its sales history without an account, so the history on this page is built by OriginsMeta, check after check.",
      "Prices in dollars are Steam's; prices in euros are converted with the European Central Bank reference rate of the day, so they can differ by a few cents from what Steam shows in euros.",
      "The lowest price on sale is not the price of the last sale. Prices are for information only and are not financial advice.",
      "OriginsMeta is not affiliated with Koin Games or Valve.",
    ],
  },
};

const it: Labels = {
  meta: {
    title: "Prezzi delle carte di Origins TCG sul Mercato di Steam",
    description: "Prezzi del Mercato della Comunità di Steam per ogni carta, variante e oggetto di Origins TCG: prezzo più basso, offerte e storico in euro e dollari.",
    demoTitle: "Tracker dei prezzi di Steam: prova del motore",
    demoDescription: "Il nostro tracker dei prezzi del Mercato di Steam al lavoro su un gioco già sul mercato, prima che apra quello di Origins TCG: prezzo, offerte e storico.",
    itemSuffix: "prezzo su Steam",
    itemDescription: "{name}: prezzo più basso sul Mercato della Comunità di Steam, numero di offerte e storico dei prezzi in euro e dollari, controllati ogni 10 minuti.",
  },
  h1: "Prezzi di Origins TCG sul Mercato di Steam",
  demoH1: "Tracker dei prezzi: prova del motore",
  locked: { kicker: "Prova riservata", text: "Il tracker dei prezzi del Mercato della Comunità di Steam è in prova riservata con lo staff di OriginsMeta. Si apre a tutti quando partono gli scambi di Origins TCG.", back: "Torna alla home" },
  crumb: "Mercato",
  status: {
    closed: "Il Mercato della Comunità di Steam per Origins TCG non è ancora aperto.",
    checking: "Lo controlliamo ogni {min} minuti: dal primo oggetto in vendita il sito registra il prezzo e le offerte di ogni carta, variante e oggetto, e costruisce il suo storico dei prezzi.",
    lastCheck: "Ultimo controllo:",
    neverChecked: "Il primo controllo arriva a breve.",
    unavailable: "Il tracker dei prezzi non è ancora attivo.",
    live: "Prezzi dal Mercato della Comunità di Steam, controllati ogni {min} minuti.",
    utc: "UTC",
    sweep: "Con molti oggetti un giro completo richiede più di un controllo: ogni oggetto si aggiorna almeno ogni {min} minuti.",
  },
  soon: {
    title: "Che cosa troverai qui",
    points: [
      "Il prezzo più basso in vendita e il numero di offerte di ogni carta, variante e oggetto, in euro o in dollari.",
      "Il grafico del prezzo di ogni oggetto: ultime 24 ore, 7 giorni, 30 giorni e tutto lo storico.",
      "Gli oggetti che salgono e scendono di più nelle ultime 24 ore.",
    ],
    when: "Koin Games ha detto che i collezionabili di Origins TCG saranno scambiabili sul Mercato della Comunità di Steam; il giorno dell'apertura non è ancora ufficiale.",
    sets: "Set, rarità e gradazione",
    guide: "L'economia da collezione",
  },
  demoLink: {
    title: "Guarda il motore al lavoro",
    text: "Finché non aprono gli scambi di Origins TCG, il tracker gira su una collezione di Counter-Strike 2, il mercato più grande di Steam.",
    cta: "Apri la prova del motore",
  },
  demo: {
    banner: "Questa è una prova del motore con la collezione Dreams & Nightmares di Counter-Strike 2 (Valve), il mercato più grande di Steam: skin con rarità, usura e versioni StatTrak, come le carte di Origins TCG avranno rarità, gradazione e varianti. Non sono carte di Origins TCG.",
    back: "Torna ai prezzi di Origins TCG",
  },
  currency: { label: "Valuta" },
  board: {
    search: "Cerca",
    searchPlaceholder: "Nome dell'oggetto…",
    kind: "Tipo",
    kinds: { all: "Tutti", card: "Carte", pack: "Buste", other: "Altri oggetti" },
    demoKinds: { all: "Tutti", card: "Skin", pack: "Casse", other: "Altri oggetti" },
    sort: "Ordina per",
    sorts: { name: "Nome", price: "Prezzo", change: "Variazione 24 ore", listings: "Offerte" },
    sortDirs: { az: "dalla A alla Z", za: "dalla Z alla A", high: "dal più alto", low: "dal più basso" },
    columns: { item: "Oggetto", price: "Prezzo più basso", change24h: "24 ore", change7d: "7 giorni", listings: "Offerte" },
    count: "{n} oggetti",
    countOne: "1 oggetto",
    noResults: "Nessun oggetto con questi filtri.",
    noOffers: "Nessuna offerta",
    variants: { normal: "Normale", foil: "Foil" },
  },
  movers: { title: "Ultime 24 ore", up: "In salita", down: "In discesa", none: "Ancora nessuna variazione da mostrare: il confronto parte dopo 24 ore di storico." },
  item: {
    back: "Tutti i prezzi",
    price: "Prezzo più basso",
    listings: "Offerte",
    change24h: "24 ore",
    change7d: "7 giorni",
    change30d: "30 giorni",
    firstSeen: "Sul mercato dal",
    lastSeen: "Ultimo controllo",
    onSteam: "Vedi su Steam",
    chartTitle: "Prezzo più basso in vendita",
    chartAria: "Prezzo più basso in vendita di {name}, {range}",
    ranges: { "24h": "24 ore", "7d": "7 giorni", "30d": "30 giorni", all: "Tutto" },
    noHistory: "Lo storico comincia adesso: il grafico si riempie a ogni controllo.",
    table: { show: "Mostra i dati", time: "Ora", low: "Minimo", high: "Massimo", close: "Ultimo", listings: "Offerte" },
    kind: "Tipo",
    variant: "Variante",
  },
  notes: {
    title: "Come leggiamo i prezzi",
    points: [
      "Fonte: le pagine pubbliche del Mercato della Comunità di Steam. Per ogni oggetto registriamo il prezzo più basso in vendita e il numero di offerte; Steam non pubblica lo storico delle vendite senza un account, quindi lo storico di questa pagina lo costruisce OriginsMeta, controllo dopo controllo.",
      "I prezzi in dollari sono quelli di Steam; quelli in euro sono convertiti con il cambio di riferimento della Banca centrale europea del giorno, quindi possono differire di qualche centesimo da quelli che Steam mostra in euro.",
      "Il prezzo più basso in vendita non è il prezzo dell'ultima vendita. I prezzi sono informativi e non sono un consiglio finanziario.",
      "OriginsMeta non è affiliato a Koin Games né a Valve.",
    ],
  },
};

const es: Labels = {
  meta: {
    title: "Precios de las cartas de Origins TCG en el Mercado de Steam",
    description: "Precios del Mercado de la Comunidad de Steam de cada carta, variante y objeto de Origins TCG: precio más bajo, ofertas e historial en euros y dólares.",
    demoTitle: "Precios de Steam: prueba del motor",
    demoDescription: "Nuestro rastreador de precios del Mercado de Steam con un juego que ya está en el mercado, antes de que abra el de Origins TCG: precio, ofertas e historial.",
    itemSuffix: "precio en Steam",
    itemDescription: "{name}: precio más bajo en el Mercado de la Comunidad de Steam, número de ofertas e historial de precios en euros y dólares, revisados cada 10 minutos.",
  },
  h1: "Precios de Origins TCG en el Mercado de Steam",
  demoH1: "Rastreador de precios: prueba del motor",
  locked: { kicker: "Prueba privada", text: "El rastreador de precios del Mercado de la Comunidad de Steam está en prueba privada con el equipo de OriginsMeta. Se abrirá a todos cuando empiecen los intercambios de Origins TCG.", back: "Volver al inicio" },
  crumb: "Mercado",
  status: {
    closed: "El Mercado de la Comunidad de Steam de Origins TCG todavía no está abierto.",
    checking: "Lo revisamos cada {min} minutos: desde el primer objeto a la venta, el sitio registra el precio y las ofertas de cada carta, variante y objeto, y construye su propio historial de precios.",
    lastCheck: "Última revisión:",
    neverChecked: "La primera revisión llega pronto.",
    unavailable: "El rastreador de precios todavía no está activo.",
    live: "Precios del Mercado de la Comunidad de Steam, revisados cada {min} minutos.",
    utc: "UTC",
    sweep: "Con muchos objetos una vuelta completa necesita más de una revisión: cada objeto se actualiza al menos cada {min} minutos.",
  },
  soon: {
    title: "Qué encontrarás aquí",
    points: [
      "El precio más bajo a la venta y el número de ofertas de cada carta, variante y objeto, en euros o en dólares.",
      "El gráfico del precio de cada objeto: últimas 24 horas, 7 días, 30 días y todo el historial.",
      "Los objetos que más suben y más bajan en las últimas 24 horas.",
    ],
    when: "Koin Games ha dicho que los coleccionables de Origins TCG se podrán intercambiar en el Mercado de la Comunidad de Steam; el día de apertura todavía no es oficial.",
    sets: "Sets, rarezas y graduación",
    guide: "La economía de colección",
  },
  demoLink: {
    title: "Mira el motor en marcha",
    text: "Hasta que se abran los intercambios de Origins TCG, el rastreador funciona con una colección de Counter-Strike 2, el mercado más grande de Steam.",
    cta: "Abre la prueba del motor",
  },
  demo: {
    banner: "Esto es una prueba del motor con la colección Dreams & Nightmares de Counter-Strike 2 (Valve), el mercado más grande de Steam: skins con rarezas, desgaste y versiones StatTrak, como las cartas de Origins TCG tendrán rarezas, graduación y variantes. No son cartas de Origins TCG.",
    back: "Volver a los precios de Origins TCG",
  },
  currency: { label: "Moneda" },
  board: {
    search: "Buscar",
    searchPlaceholder: "Nombre del objeto…",
    kind: "Tipo",
    kinds: { all: "Todos", card: "Cartas", pack: "Sobres", other: "Otros objetos" },
    demoKinds: { all: "Todos", card: "Skins", pack: "Cajas", other: "Otros objetos" },
    sort: "Ordenar por",
    sorts: { name: "Nombre", price: "Precio", change: "Variación 24 horas", listings: "Ofertas" },
    sortDirs: { az: "de la A a la Z", za: "de la Z a la A", high: "de mayor a menor", low: "de menor a mayor" },
    columns: { item: "Objeto", price: "Precio más bajo", change24h: "24 horas", change7d: "7 días", listings: "Ofertas" },
    count: "{n} objetos",
    countOne: "1 objeto",
    noResults: "Ningún objeto con estos filtros.",
    noOffers: "Sin ofertas",
    variants: { normal: "Normal", foil: "Foil" },
  },
  movers: { title: "Últimas 24 horas", up: "Suben", down: "Bajan", none: "Todavía no hay variaciones que mostrar: la comparación empieza tras 24 horas de historial." },
  item: {
    back: "Todos los precios",
    price: "Precio más bajo",
    listings: "Ofertas",
    change24h: "24 horas",
    change7d: "7 días",
    change30d: "30 días",
    firstSeen: "En el mercado desde",
    lastSeen: "Última revisión",
    onSteam: "Ver en Steam",
    chartTitle: "Precio más bajo a la venta",
    chartAria: "Precio más bajo a la venta de {name}, {range}",
    ranges: { "24h": "24 horas", "7d": "7 días", "30d": "30 días", all: "Todo" },
    noHistory: "El historial empieza ahora: el gráfico se llena con cada revisión.",
    table: { show: "Mostrar los datos", time: "Hora", low: "Mínimo", high: "Máximo", close: "Último", listings: "Ofertas" },
    kind: "Tipo",
    variant: "Variante",
  },
  notes: {
    title: "Cómo leemos los precios",
    points: [
      "Fuente: las páginas públicas del Mercado de la Comunidad de Steam. De cada objeto registramos el precio más bajo a la venta y el número de ofertas; Steam no publica el historial de ventas sin una cuenta, así que el historial de esta página lo construye OriginsMeta, revisión tras revisión.",
      "Los precios en dólares son los de Steam; los de euros se convierten con el tipo de cambio de referencia del Banco Central Europeo del día, así que pueden diferir unos céntimos de los que Steam muestra en euros.",
      "El precio más bajo a la venta no es el precio de la última venta. Los precios son informativos y no son un consejo financiero.",
      "OriginsMeta no está afiliado a Koin Games ni a Valve.",
    ],
  },
};

const fr: Labels = {
  meta: {
    title: "Prix des cartes Origins TCG sur le Marché Steam",
    description: "Prix du Marché de la communauté Steam pour chaque carte, variante et objet d'Origins TCG : prix le plus bas, offres et historique en euros et dollars.",
    demoTitle: "Suivi des prix Steam : test du moteur",
    demoDescription: "Notre suivi des prix du Marché Steam à l'œuvre sur un jeu déjà présent sur le marché, avant l'ouverture de celui d'Origins TCG : prix, offres et historique.",
    itemSuffix: "prix sur Steam",
    itemDescription: "{name} : prix le plus bas sur le Marché de la communauté Steam, nombre d'offres et historique des prix en euros et dollars, vérifiés toutes les 10 minutes.",
  },
  h1: "Prix d'Origins TCG sur le Marché Steam",
  demoH1: "Suivi des prix : test du moteur",
  locked: { kicker: "Test privé", text: "Le suivi des prix du Marché de la communauté Steam est en test privé avec l'équipe d'OriginsMeta. Il s'ouvrira à tous au début des échanges d'Origins TCG.", back: "Retour à l'accueil" },
  crumb: "Marché",
  status: {
    closed: "Le Marché de la communauté Steam d'Origins TCG n'est pas encore ouvert.",
    checking: "Nous le vérifions toutes les {min} minutes : dès le premier objet en vente, le site enregistre le prix et les offres de chaque carte, variante et objet, et construit son propre historique des prix.",
    lastCheck: "Dernière vérification :",
    neverChecked: "La première vérification arrive bientôt.",
    unavailable: "Le suivi des prix n'est pas encore actif.",
    live: "Prix du Marché de la communauté Steam, vérifiés toutes les {min} minutes.",
    utc: "UTC",
    sweep: "Avec beaucoup d'objets, un tour complet demande plus d'une vérification : chaque objet est mis à jour au moins toutes les {min} minutes.",
  },
  soon: {
    title: "Ce que vous trouverez ici",
    points: [
      "Le prix le plus bas en vente et le nombre d'offres de chaque carte, variante et objet, en euros ou en dollars.",
      "Le graphique du prix de chaque objet : dernières 24 heures, 7 jours, 30 jours et tout l'historique.",
      "Les objets qui montent et qui baissent le plus sur les dernières 24 heures.",
    ],
    when: "Koin Games a indiqué que les objets de collection d'Origins TCG seront échangeables sur le Marché de la communauté Steam ; le jour d'ouverture n'est pas encore officiel.",
    sets: "Sets, raretés et gradation",
    guide: "L'économie de collection",
  },
  demoLink: {
    title: "Voir le moteur à l'œuvre",
    text: "En attendant l'ouverture des échanges d'Origins TCG, le suivi tourne sur une collection de Counter-Strike 2, le plus grand marché de Steam.",
    cta: "Ouvrir le test du moteur",
  },
  demo: {
    banner: "Ceci est un test du moteur avec la collection Dreams & Nightmares de Counter-Strike 2 (Valve), le plus grand marché de Steam : des skins avec raretés, usure et versions StatTrak, comme les cartes d'Origins TCG auront raretés, gradation et variantes. Ce ne sont pas des cartes d'Origins TCG.",
    back: "Retour aux prix d'Origins TCG",
  },
  currency: { label: "Devise" },
  board: {
    search: "Rechercher",
    searchPlaceholder: "Nom de l'objet…",
    kind: "Type",
    kinds: { all: "Tous", card: "Cartes", pack: "Boosters", other: "Autres objets" },
    demoKinds: { all: "Tous", card: "Skins", pack: "Caisses", other: "Autres objets" },
    sort: "Trier par",
    sorts: { name: "Nom", price: "Prix", change: "Variation 24 heures", listings: "Offres" },
    sortDirs: { az: "de A à Z", za: "de Z à A", high: "du plus élevé au plus bas", low: "du plus bas au plus élevé" },
    columns: { item: "Objet", price: "Prix le plus bas", change24h: "24 heures", change7d: "7 jours", listings: "Offres" },
    count: "{n} objets",
    countOne: "1 objet",
    noResults: "Aucun objet avec ces filtres.",
    noOffers: "Aucune offre",
    variants: { normal: "Normale", foil: "Foil" },
  },
  movers: { title: "Dernières 24 heures", up: "En hausse", down: "En baisse", none: "Aucune variation à afficher pour l'instant : la comparaison commence après 24 heures d'historique." },
  item: {
    back: "Tous les prix",
    price: "Prix le plus bas",
    listings: "Offres",
    change24h: "24 heures",
    change7d: "7 jours",
    change30d: "30 jours",
    firstSeen: "Sur le marché depuis le",
    lastSeen: "Dernière vérification",
    onSteam: "Voir sur Steam",
    chartTitle: "Prix le plus bas en vente",
    chartAria: "Prix le plus bas en vente de {name}, {range}",
    ranges: { "24h": "24 heures", "7d": "7 jours", "30d": "30 jours", all: "Tout" },
    noHistory: "L'historique commence maintenant : le graphique se remplit à chaque vérification.",
    table: { show: "Afficher les données", time: "Heure", low: "Minimum", high: "Maximum", close: "Dernier", listings: "Offres" },
    kind: "Type",
    variant: "Variante",
  },
  notes: {
    title: "Comment nous lisons les prix",
    points: [
      "Source : les pages publiques du Marché de la communauté Steam. Pour chaque objet, nous enregistrons le prix le plus bas en vente et le nombre d'offres ; Steam ne publie pas l'historique des ventes sans compte, donc l'historique de cette page est construit par OriginsMeta, vérification après vérification.",
      "Les prix en dollars sont ceux de Steam ; les prix en euros sont convertis au taux de référence du jour de la Banque centrale européenne et peuvent donc différer de quelques centimes de ceux que Steam affiche en euros.",
      "Le prix le plus bas en vente n'est pas le prix de la dernière vente. Les prix sont donnés à titre indicatif et ne constituent pas un conseil financier.",
      "OriginsMeta n'est affilié ni à Koin Games ni à Valve.",
    ],
  },
};

// Portoghese del Brasile dal 20/10/2026 (docs/portoghese.md): nome del mercato in pt-BR "Mercado da Comunidade Steam".
const pt: Labels = {
  meta: {
    title: "Preços das cartas de Origins TCG no Mercado da Steam",
    description: "Preços no Mercado da Comunidade Steam de cada carta, variante e item de Origins TCG: menor preço, ofertas e histórico de preços em euros e dólares.",
    demoTitle: "Rastreador de preços da Steam: teste do motor",
    demoDescription: "O nosso rastreador de preços do Mercado da Steam em um jogo que já está no mercado, antes da abertura do de Origins TCG: preço, ofertas e histórico.",
    itemSuffix: "preço na Steam",
    itemDescription: "{name}: menor preço no Mercado da Comunidade Steam, número de ofertas e histórico de preços em euros e dólares, verificados a cada 10 minutos.",
  },
  h1: "Preços de Origins TCG no Mercado da Steam",
  demoH1: "Rastreador de preços: teste do motor",
  locked: { kicker: "Teste privado", text: "O rastreador de preços do Mercado da Comunidade Steam está em teste privado com a equipe do OriginsMeta. Ele abre para todos quando as trocas de Origins TCG começarem.", back: "Voltar para a página inicial" },
  crumb: "Mercado",
  status: {
    closed: "O Mercado da Comunidade Steam de Origins TCG ainda não abriu.",
    checking: "Nós o verificamos a cada {min} minutos: a partir do primeiro item à venda, o site registra o preço e as ofertas de cada carta, variante e item e monta o seu próprio histórico de preços.",
    lastCheck: "Última verificação:",
    neverChecked: "Primeira verificação em breve.",
    unavailable: "O rastreador de preços ainda não está ativo.",
    live: "Preços do Mercado da Comunidade Steam, verificados a cada {min} minutos.",
    utc: "UTC",
    sweep: "Com muitos itens, uma rodada completa leva mais de uma verificação: cada item é atualizado pelo menos a cada {min} minutos.",
  },
  soon: {
    title: "O que você vai encontrar aqui",
    points: [
      "O menor preço à venda e o número de ofertas de cada carta, variante e item, em euros ou dólares.",
      "Um gráfico de preços para cada item: últimas 24 horas, 7 dias, 30 dias e todo o histórico.",
      "As maiores altas e quedas das últimas 24 horas.",
    ],
    when: "A Koin Games disse que os colecionáveis de Origins TCG poderão ser negociados no Mercado da Comunidade Steam; a data de abertura ainda não é oficial.",
    sets: "Coleções, raridades e graduação",
    guide: "A economia dos colecionadores",
  },
  demoLink: {
    title: "Veja o motor funcionando",
    text: "Até as trocas de Origins TCG abrirem, o rastreador funciona com uma coleção de Counter-Strike 2, o maior mercado da Steam.",
    cta: "Abrir o teste do motor",
  },
  demo: {
    banner: "Este é um teste do motor com a coleção Dreams & Nightmares de Counter-Strike 2 (Valve), o maior mercado da Steam: skins com raridades, desgaste e versões StatTrak, do mesmo jeito que as cartas de Origins TCG terão raridades, graus e variantes. Não são cartas de Origins TCG.",
    back: "Voltar para os preços de Origins TCG",
  },
  currency: { label: "Moeda" },
  board: {
    search: "Buscar",
    searchPlaceholder: "Nome do item…",
    kind: "Tipo",
    kinds: { all: "Todos", card: "Cartas", pack: "Pacotes", other: "Outros itens" },
    demoKinds: { all: "Todos", card: "Skins", pack: "Caixas", other: "Outros itens" },
    sort: "Ordenar por",
    sorts: { name: "Nome", price: "Preço", change: "Variação em 24h", listings: "Ofertas" },
    sortDirs: { az: "de A a Z", za: "de Z a A", high: "maiores primeiro", low: "menores primeiro" },
    columns: { item: "Item", price: "Menor preço", change24h: "24h", change7d: "7 dias", listings: "Ofertas" },
    count: "{n} itens",
    countOne: "1 item",
    noResults: "Nenhum item corresponde aos filtros.",
    noOffers: "Sem ofertas",
    variants: { normal: "Normal", foil: "Foil" },
  },
  movers: { title: "Últimas 24 horas", up: "Em alta", down: "Em queda", none: "Ainda não há variações para mostrar: a comparação começa depois de 24 horas de histórico." },
  item: {
    back: "Todos os preços",
    price: "Menor preço",
    listings: "Ofertas",
    change24h: "24 horas",
    change7d: "7 dias",
    change30d: "30 dias",
    firstSeen: "No mercado desde",
    lastSeen: "Última verificação",
    onSteam: "Ver na Steam",
    chartTitle: "Menor preço à venda",
    chartAria: "Menor preço à venda de {name}, {range}",
    ranges: { "24h": "24h", "7d": "7 dias", "30d": "30 dias", all: "Tudo" },
    noHistory: "O histórico começa agora: o gráfico se preenche a cada verificação.",
    table: { show: "Mostrar os dados", time: "Hora", low: "Mínimo", high: "Máximo", close: "Último", listings: "Ofertas" },
    kind: "Tipo",
    variant: "Variante",
  },
  notes: {
    title: "Como lemos os preços",
    points: [
      "Fonte: as páginas públicas do Mercado da Comunidade Steam. Para cada item registramos o menor preço à venda e o número de ofertas; a Steam não publica o histórico de vendas sem uma conta, por isso o histórico desta página é montado pelo OriginsMeta, verificação após verificação.",
      "Os preços em dólares são os da Steam; os preços em euros são convertidos com a taxa de referência do dia do Banco Central Europeu, por isso podem diferir em alguns centavos dos que a Steam mostra em euros.",
      "O menor preço à venda não é o preço da última venda. Os preços são apenas informativos e não são recomendação financeira.",
      "OriginsMeta não é afiliado à Koin Games nem à Valve.",
    ],
  },
};

export const marketLabels: Record<Locale, Labels> = { en, it, es, fr, pt };
export type MarketLabels = Labels;

/** Riempie i segnaposto {nome} di un testo. */
export function fillMarket(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
