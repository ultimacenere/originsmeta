import type { Locale } from "@/lib/i18n";

/**
 * FAQ approvate: le risposte che restano. Sono testo scritto e riletto da noi, non generate al momento —
 * l'assistente della pagina serve per le domande nuove, queste sono quelle che valgono per tutti.
 *
 * Perché stanno qui e non in un database: sono contenuto editoriale come le guide, entrano nell'HTML statico
 * (quindi Google le legge) e finiscono nei dati strutturati FAQPage della pagina.
 *
 * Come cresce questo file: dalle domande che arrivano davvero. Quando una domanda torna spesso e la risposta
 * regge, si scrive qui in inglese e in italiano e smette di costare una chiamata al modello.
 * `cards` e `guides` sono gli slug da collegare sotto la risposta.
 */
export type Faq = {
  id: string;
  q: string;
  a: string;
  cards?: string[];
  guides?: string[];
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
    a: "You register more than one deck, each with a different Legendary, and at least nine cards have to differ from deck to deck. Your opponent bans one of your decks, and you win the match by beating them with each of the decks that are left. Koin ran it at Big Bob's Playtest Battle and chose it for the Crimson Cup.",
    guides: ["steam-next-fest-2026"],
  },
  {
    id: "crimson-cup",
    q: "When is the Crimson Cup and what do you win?",
    a: "From 20 to 25 October 2026, during Steam Next Fest: three qualifiers of 512 spots each on the 20th, 21st and 22nd, playoffs on the 24th, finals on the 25th. Prizes worth $10,000 in total — an exclusive 1/1 tournament promo card, other promo cards, digital packs, Alpha booster boxes and cases, and cash. Sign-ups are on Koin's official Discord.",
    guides: ["steam-next-fest-2026"],
  },
  {
    id: "where-cards",
    q: "Where do the card stats on this site come from?",
    a: "From the community database World of Origins, imported with a script and checked against the official patch notes on Steam. They are the numbers of playtest patch 0.6.3, from 27 August 2026. The illustrations are the official ones from Koin Games; the sagas, the Italian translations and the notes on each legend are ours.",
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
    a: "Si registrano più mazzi, ognuno con una Leggendaria diversa, e fra un mazzo e l'altro devono cambiare almeno nove carte. L'avversario ne banna uno, e il match si vince battendolo con tutti i mazzi che restano. Koin lo ha provato a Big Bob's Playtest Battle e lo ha scelto per la Crimson Cup.",
    guides: ["steam-next-fest-2026"],
  },
  {
    id: "crimson-cup",
    q: "Quando è la Crimson Cup e che cosa si vince?",
    a: "Dal 20 al 25 ottobre 2026, durante lo Steam Next Fest: tre qualificazioni da 512 posti il 20, 21 e 22, playoff il 24, finali il 25. Premi per un valore complessivo di 10.000 $ — una carta promo 1/1 esclusiva del torneo, altre carte promo, pacchetti digitali, booster box e case Alpha, premi in denaro. Le iscrizioni sono sul Discord ufficiale di Koin.",
    guides: ["steam-next-fest-2026"],
  },
  {
    id: "where-cards",
    q: "Da dove arrivano le statistiche delle carte di questo sito?",
    a: "Dal database community World of Origins, importate con uno script e confrontate con le patch notes ufficiali su Steam. Sono i numeri della patch 0.6.3 del playtest, del 27 agosto 2026. Le illustrazioni sono quelle ufficiali di Koin Games; le saghe, le traduzioni italiane e le note sulle origini delle leggende sono nostre.",
  },
];

export const faqs: Record<Locale, Faq[]> = { en, it };

/** Domande pronte sotto il campo: non sostituiscono la domanda libera, la riempiono. */
export const suggerimenti: Record<Locale, string[]> = {
  en: [
    "What does Mulan do?",
    "Which cards work well with Van Helsing?",
    "How do I build a legal deck?",
    "What changed in patch 0.6.3?",
    "Which Legendaries are in the Demo 2.0?",
    "What is On Reveal?",
  ],
  it: [
    "Che cosa fa Mulan?",
    "Quali carte funzionano bene con Van Helsing?",
    "Come si costruisce un mazzo legale?",
    "Che cosa è cambiato nella patch 0.6.3?",
    "Quali Leggendarie ci sono nella Demo 2.0?",
    "Che cosa vuol dire On Reveal?",
  ],
};
