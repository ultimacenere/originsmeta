import type { Locale } from "@/lib/i18n";
import type { GuideSlug } from "./guides";

/**
 * FAQ approvate: le risposte che restano. Sono testo scritto e riletto da noi, non generate al momento —
 * l'assistente della pagina serve per le domande nuove, queste sono quelle che valgono per tutti.
 *
 * Perché stanno qui e non in un database: sono contenuto editoriale come le guide, entrano nell'HTML statico
 * (quindi Google le legge) e finiscono nei dati strutturati FAQPage della pagina.
 *
 * Come cresce questo file: dalle domande che arrivano davvero. Quando una domanda torna spesso e la risposta
 * regge, si scrive qui in inglese, italiano e spagnolo e smette di costare una chiamata al modello.
 * `cards`, `guides` e `news` sono gli slug da collegare sotto la risposta: `news` (dal 25/09/2026) porta all'articolo
 * che fa da fonte o da pagina di riferimento, per esempio le regole della Crimson Cup.
 */
export type Faq = {
  id: string;
  q: string;
  a: string;
  cards?: string[];
  guides?: GuideSlug[];
  news?: string[];
};

const en: Faq[] = [
  {
    id: "deck-rules",
    q: "How many cards does a deck have in Origins TCG?",
    a: "Twenty-five: one Legendary and twelve different cards, each played in two copies. You pick the thirteen names, the game doubles the twelve base cards for you. The deck builder on this site enforces the rule and tells you what is missing.",
    guides: ["origins-tcg-explained"],
  },
  {
    id: "free-to-compete",
    q: "Is Origins TCG pay-to-win?",
    a: "No, and the design says so explicitly: every player gets every card for free, and what you buy are collectible versions — graded, limited, tradable on the Steam Market. Money changes what you own, not what you can play. The full argument, with what is still unconfirmed, is in our guide.",
    guides: ["is-origins-tcg-pay-to-win"],
  },
  {
    id: "conquest",
    q: "What is the Conquest format?",
    a: "You register more than one deck, each with a different Legendary, and the decks must differ from each other. Your opponent bans one of your decks, and you win the match by beating them with each of the decks that are left. At the Crimson Cup there are three decks with at least 8 unique cards between each pair, decklists stay hidden until the top 4 (in the ban you only see the Legendary), and best-of-five matches have no ban: you must win with all three. Koin first ran it at Big Bob's Playtest Battle, with at least nine cards of difference.",
    guides: ["steam-next-fest-2026"],
    news: ["crimson-cup-format-check-in"],
  },
  {
    id: "crimson-cup",
    q: "When is the Crimson Cup and what do you win?",
    a: "From 20 to 25 October 2026, during Steam Next Fest: three qualifiers of 512 spots each on the 20th, 21st and 22nd, playoffs on the 24th, finals on the 25th. Prizes worth $10,000 in total — an exclusive 1/1 tournament promo card, other promo cards, digital packs, Alpha booster boxes and cases, and cash; the exact prize pool was promised for the week after 24 September. Sign-ups are on Koin's official Discord, and check-in closes five minutes before each qualifier: miss it and you can't play.",
    guides: ["steam-next-fest-2026"],
    news: ["crimson-cup-format-check-in"],
  },
  {
    id: "kickstarter",
    q: "When does the Origins TCG Kickstarter start?",
    a: "On 25 September 2026 the demo's main menu showed the Kickstarter as “Coming soon – Oct 27”, next to “Preregister for 15% off”; Koin Games has not announced the date on Steam or on the official Discord yet. Pre-registration is open on founder.origins-tcg.com: a 1 dollar deposit, refundable before launch, gives VIP status with 15% off. Our Kickstarter guide keeps everything up to date.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: ["kickstarter-ama-pre-registration"],
  },
  {
    id: "where-cards",
    q: "Where do the card stats on this site come from?",
    a: "From the community database World of Origins, imported with a script and checked against the official patch notes on Steam. They are the numbers of the demo patch of 21 September 2026: costs, stats and texts of the 122 demo cards were checked one by one in the game on 22 September 2026, and on 25 September the Italian and Spanish texts too, which are the game's own. The illustrations are the official ones from Koin Games; the sagas and the notes on each legend are ours.",
    news: ["demo-patch-notes-0921"],
  },
];

const it: Faq[] = [
  {
    id: "deck-rules",
    q: "Quante carte ha un mazzo di Origins TCG?",
    a: "Venticinque: una Leggendaria e dodici carte diverse, ognuna giocata in due copie. Tu scegli i tredici nomi, il gioco raddoppia da solo le dodici carte base. Il deck builder di questo sito applica la regola e ti dice che cosa manca.",
    guides: ["origins-tcg-explained"],
  },
  {
    id: "free-to-compete",
    q: "Origins TCG è pay-to-win?",
    a: "No, ed è una scelta dichiarata: tutte le carte si ottengono gratis, e quello che si compra sono le versioni da collezione — gradate, limitate, scambiabili sul Mercato Steam. I soldi cambiano quello che possiedi, non quello che puoi giocare. Il ragionamento completo, con quello che non è ancora confermato, è nella nostra guida.",
    guides: ["is-origins-tcg-pay-to-win"],
  },
  {
    id: "conquest",
    q: "Come funziona il formato Conquest?",
    a: "Si registrano più mazzi, ognuno con una Leggendaria diversa, e i mazzi devono essere diversi fra loro. L'avversario ne banna uno, e il match si vince battendolo con tutti i mazzi che restano. Alla Crimson Cup i mazzi sono tre, con almeno 8 carte uniche fra ogni coppia, le liste restano segrete fino alla top 4 (nel ban si vede solo la Leggendaria) e al meglio delle cinque non c'è ban: si vince con tutti e tre. Koin lo ha provato la prima volta a Big Bob's Playtest Battle, con almeno nove carte di differenza.",
    guides: ["steam-next-fest-2026"],
    news: ["crimson-cup-format-check-in"],
  },
  {
    id: "crimson-cup",
    q: "Quando è la Crimson Cup e che cosa si vince?",
    a: "Dal 20 al 25 ottobre 2026, durante lo Steam Next Fest: tre qualificazioni da 512 posti il 20, 21 e 22, playoff il 24, finali il 25. Premi per un valore complessivo di 10.000 $ — una carta promo 1/1 esclusiva del torneo, altre carte promo, pacchetti digitali, booster box e case Alpha, premi in denaro; la ripartizione esatta è promessa per la settimana dopo il 24 settembre. Le iscrizioni sono sul Discord ufficiale di Koin, e il check-in chiude cinque minuti prima di ogni qualificazione: chi lo salta non gioca.",
    guides: ["steam-next-fest-2026"],
    news: ["crimson-cup-format-check-in"],
  },
  {
    id: "kickstarter",
    q: "Quando parte il Kickstarter di Origins TCG?",
    a: "Il 25 settembre 2026 il menu principale della demo mostrava il Kickstarter come “Coming soon – Oct 27”, accanto a “Preregister for 15% off”; Koin Games non ha ancora annunciato la data su Steam né sul Discord ufficiale. La pre-registrazione è aperta su founder.origins-tcg.com: un deposito di 1 dollaro, rimborsabile prima del lancio, dà lo stato VIP con il 15% di sconto. La nostra guida al Kickstarter tiene tutto aggiornato.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: ["kickstarter-ama-pre-registration"],
  },
  {
    id: "where-cards",
    q: "Da dove arrivano le statistiche delle carte di questo sito?",
    a: "Dal database community World of Origins, importate con uno script e confrontate con le patch notes ufficiali su Steam. Sono i numeri della patch della demo del 21 settembre 2026: costi, statistiche e testi delle 122 carte della demo sono stati verificati uno per uno nel gioco il 22 settembre 2026, e il 25 settembre anche i testi in italiano e spagnolo, che sono quelli del gioco. Le illustrazioni sono quelle ufficiali di Koin Games; le saghe e le note sulle origini delle leggende sono nostre.",
    news: ["demo-patch-notes-0921"],
  },
];

const es: Faq[] = [
  {
    id: "deck-rules",
    q: "¿Cuántas cartas tiene un mazo de Origins TCG?",
    a: "Veinticinco: una Legendaria y doce cartas distintas, cada una en dos copias. Tú eliges los trece nombres y el juego duplica por ti las doce cartas base. El deck builder de este sitio aplica la regla y te dice qué falta.",
    guides: ["origins-tcg-explained"],
  },
  {
    id: "free-to-compete",
    q: "¿Origins TCG es pay-to-win?",
    a: "No, y el diseño lo dice explícitamente: todos los jugadores consiguen todas las cartas gratis, y lo que compras son versiones de colección —gradeadas, limitadas, intercambiables en el Mercado de Steam—. El dinero cambia lo que posees, no lo que puedes jugar. El razonamiento completo, con lo que aún no está confirmado, está en nuestra guía.",
    guides: ["is-origins-tcg-pay-to-win"],
  },
  {
    id: "conquest",
    q: "¿Qué es el formato Conquest?",
    a: "Registras más de un mazo, cada uno con una Legendaria distinta, y los mazos tienen que ser diferentes entre sí. Tu oponente banea uno de tus mazos, y ganas el enfrentamiento si lo vences con cada uno de los mazos que quedan. En la Crimson Cup hay tres mazos con al menos 8 cartas únicas entre cada par, las listas se mantienen ocultas hasta el top 4 (en el ban solo ves la Legendaria) y en los enfrentamientos al mejor de cinco no hay ban: tienes que ganar con los tres. Koin lo estrenó en Big Bob's Playtest Battle, con al menos nueve cartas de diferencia.",
    guides: ["steam-next-fest-2026"],
    news: ["crimson-cup-format-check-in"],
  },
  {
    id: "crimson-cup",
    q: "¿Cuándo es la Crimson Cup y qué se gana?",
    a: "Del 20 al 25 de octubre de 2026, durante el Steam Next Fest: tres clasificatorios de 512 plazas cada uno los días 20, 21 y 22, playoffs el 24 y finales el 25. Premios por un valor total de 10.000 dólares: una carta promo 1/1 exclusiva del torneo, otras cartas promo, sobres digitales, cajas y cases de sobres Alpha, y dinero en efectivo; el reparto exacto de la bolsa de premios se prometió para la semana siguiente al 24 de septiembre. Las inscripciones están en el Discord oficial de Koin, y el check-in cierra cinco minutos antes de cada clasificatorio: si te lo pierdes, no puedes jugar.",
    guides: ["steam-next-fest-2026"],
    news: ["crimson-cup-format-check-in"],
  },
  {
    id: "kickstarter",
    q: "¿Cuándo empieza el Kickstarter de Origins TCG?",
    a: "El 25 de septiembre de 2026 el menú principal de la demo mostraba el Kickstarter como “Coming soon – Oct 27”, junto a “Preregister for 15% off”; Koin Games aún no ha anunciado la fecha en Steam ni en el Discord oficial. El prerregistro está abierto en founder.origins-tcg.com: un depósito de 1 dólar, reembolsable antes del lanzamiento, da el estatus VIP con un 15 % de descuento. Nuestra guía del Kickstarter lo mantiene todo al día.",
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    news: ["kickstarter-ama-pre-registration"],
  },
  {
    id: "where-cards",
    q: "¿De dónde salen las estadísticas de las cartas de este sitio?",
    a: "De la base de datos de la comunidad World of Origins, importadas con un script y contrastadas con las notas oficiales de los parches en Steam. Son los números del parche de la demo del 21 de septiembre de 2026: los costes, las estadísticas y los textos de las 122 cartas de la demo se comprobaron uno por uno en el juego el 22 de septiembre de 2026, y el 25 de septiembre también los textos en italiano y español, que son los del juego. Las ilustraciones son las oficiales de Koin Games; las sagas y las notas sobre cada leyenda son nuestras.",
    news: ["demo-patch-notes-0921"],
  },
];

export const faqs: Record<Locale, Faq[]> = { en, it, es };

/** Domande pronte sotto il campo: non sostituiscono la domanda libera, la riempiono. */
export const suggerimenti: Record<Locale, string[]> = {
  en: [
    "What does Mulan do?",
    "Which cards work well with Van Helsing?",
    "How do I build a legal deck?",
    "What changed in the demo patch of 21 September?",
    "Which Legendaries are in the Demo 2.0?",
    "What is On Reveal?",
  ],
  it: [
    "Che cosa fa Mulan?",
    "Quali carte funzionano bene con Van Helsing?",
    "Come si costruisce un mazzo legale?",
    "Che cosa è cambiato nella patch della demo del 21 settembre?",
    "Quali Leggendarie ci sono nella Demo 2.0?",
    "Che cosa fa un'abilità Alla rivelazione?",
  ],
  es: [
    "¿Qué hace Mulan?",
    "¿Qué cartas funcionan bien con Van Helsing?",
    "¿Cómo construyo un mazo válido?",
    "¿Qué cambió en el parche de la demo del 21 de septiembre?",
    "¿Qué Legendarias hay en la Demo 2.0?",
    "¿Qué hace una habilidad Al revelar?",
  ],
};
