import { cards, cardsVerified, latestPatch, patchLabel, patches, sagas, type Card } from "@/lib/data/cards";
import { getGuides } from "@/lib/content/guides";
import { events } from "@/lib/data/events";
import { RULES } from "@/lib/deckrules";
import type { Locale } from "@/lib/i18n";

/**
 * Raccolta dei fatti che rispondono a una domanda: carte, guide ed eventi del nostro database.
 * Solo server (importa l'intero database carte). È la parte che tiene la risposta ancorata ai dati:
 * il modello non risponde a memoria, riceve queste schede e può usare solo quelle.
 */

export type Fonte = { tipo: "card" | "guide" | "event"; slug: string; nome: string; href: string };
export type Contesto = { testo: string; fonti: Fonte[] };

/** Parole troppo comuni per dire qualcosa su quale carta cerchi chi scrive. */
const STOPWORDS = new Set([
  ...["il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "a", "da", "in", "con", "su", "per", "tra", "fra", "che", "chi", "cosa", "come", "quale", "quali", "quando", "dove", "perche", "perché", "e", "o", "ma", "se", "non", "mi", "si", "ci", "vi", "ne", "del", "della", "dei", "delle", "nel", "nella", "al", "alla", "ai", "alle", "dal", "dalla", "sul", "sulla", "più", "piu", "meno", "molto", "carta", "carte", "mazzo", "mazzi", "gioco", "meglio", "migliore", "forte", "buona", "usare", "uso", "gioca", "giocare", "contro", "posso", "devo", "fare", "faccio", "sono", "essere", "avere", "ho"],
  ...["the", "a", "an", "of", "to", "in", "on", "for", "with", "and", "or", "but", "if", "not", "is", "are", "was", "be", "do", "does", "did", "how", "what", "which", "when", "where", "why", "who", "can", "should", "would", "card", "cards", "deck", "decks", "game", "best", "better", "good", "strong", "play", "playing", "against", "use", "using", "my", "i", "you", "it", "this", "that"],
]);

const normalizza = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ");

/** Punteggio di pertinenza di una carta rispetto alla domanda. */
function punteggio(card: Card, domanda: string, parole: string[], locale: Locale): number {
  const nome = normalizza(card.name);
  let p = 0;
  // nome intero citato: è quasi certamente la carta di cui si parla
  if (nome.length > 3 && domanda.includes(nome)) p += 100;
  const paroleNome = nome.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  for (const w of paroleNome) if (parole.includes(w)) p += 25;
  // parole chiave del gioco (On Reveal, Trample…) e saga
  for (const k of card.keywords ?? []) if (parole.includes(normalizza(k).split(/\s+/)[0])) p += 8;
  if (parole.some((w) => normalizza(sagas[card.saga][locale]).includes(w))) p += 6;
  // termini del testo dell'abilità
  const testo = normalizza(`${card.ability?.[locale] ?? ""} ${card.ability?.en ?? ""}`);
  for (const w of parole) if (w.length > 4 && testo.includes(w)) p += 3;
  if (p > 0 && card.status === "removed") p -= 10; // le rimosse contano meno: non sono nella Demo 2.0
  if (p > 0 && card.legendary) p += 2;
  return p;
}

/** Scheda compatta di una carta: solo fatti del database, niente prosa. */
function schedaCarta(card: Card, locale: Locale): string {
  const parti = [
    `${card.name}${card.legendary ? " (Leggendaria)" : ""}`,
    `costo ${card.mana ?? "?"}`,
    card.power !== undefined ? `${card.power}/${card.health}` : undefined,
    card.type === "spell" ? "magia" : card.type === "token" ? "carta creata" : "unità",
    card.alignment,
    `saga: ${sagas[card.saga][locale]}`,
    card.status === "removed" ? "NON nella Demo 2.0" : undefined,
    card.keywords?.length ? `parole chiave: ${card.keywords.join(", ")}` : undefined,
    card.ability?.[locale] ? `testo: ${card.ability[locale].replace(/\s*\n\s*/g, " ")}` : undefined,
  ].filter(Boolean);
  const storia = card.history.length ? ` | bilanciamenti: ${card.history.map((h) => `${h.patch} ${h.kind}`).join(", ")}` : "";
  return `- ${parti.join(" · ")}${storia}`;
}

/**
 * Compone il contesto per una domanda: le carte, le guide e gli eventi più pertinenti.
 * Il numero di schede è limitato perché il contesto sia piccolo e la risposta economica.
 */
export function contestoPer(domanda: string, locale: Locale, max = { carte: 12, guide: 4 }): Contesto {
  const d = normalizza(domanda);
  const parole = d.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));
  const fonti: Fonte[] = [];

  const trovate = cards
    .map((c) => ({ c, p: punteggio(c, d, parole, locale) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)
    .slice(0, max.carte);

  const guideTutte = getGuides(locale)
    .map((g) => {
      const titolo = normalizza(g.title);
      const excerpt = normalizza(g.excerpt);
      let p = 0;
      for (const w of parole) {
        if (titolo.includes(w)) p += 10;
        if (excerpt.includes(w)) p += 3;
        if (w.length > 4 && normalizza(g.body).includes(w)) p += 1;
      }
      // una guida che parla di una carta trovata è pertinente
      if (trovate.some((t) => g.tags?.cards?.includes(t.c.slug))) p += 12;
      return { g, p };
    })
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p);

  // Le guide chiamate dal titolo o da una carta trovata valgono molto di più di quelle
  // prese per una parola capitata nel corpo: queste ultime entrano solo se non ce ne sono di forti,
  // così una domanda specifica non si porta dietro mezzo sito e una generica non resta senza niente.
  const forti = guideTutte.filter((x) => x.p >= 6);
  const guide = (forti.length >= 2 ? forti : [...forti, ...guideTutte.filter((x) => x.p < 6)]).slice(0, max.guide);

  const oggi = new Date().toISOString().slice(0, 10);
  const prossimi = events.filter((e) => (e.end ?? e.start) >= oggi).slice(0, 3);

  const blocchi: string[] = [
    // Conquest: la regola ufficiale della Crimson Cup è quella dell'annuncio del 24/09/2026 (8 carte uniche fra ogni
    // coppia di mazzi); il controllo del deck builder usa ancora la regola di Big Bob's (RULES.conquestMinDifferent),
    // in attesa della decisione di Pierluigi (KB §1 punto 34): l'assistente deve saperle distinguere.
    `REGOLE DEL MAZZO: ${RULES.legendarySlots} Leggendaria + ${RULES.distinctCards} carte diverse in ${RULES.copiesPerCard} copie = ${RULES.deckSize} carte. Formato Conquest della Crimson Cup (annunci ufficiali del 9 e del 24/09/2026): tre mazzi, ognuno con una Leggendaria diversa, con almeno 8 carte uniche fra ogni coppia di mazzi (l'annuncio non dice come si contano; la nostra lettura: due mazzi possono avere al massimo 5 carte in comune); liste segrete fino alla top 4, nel ban si vede solo la Leggendaria; partite al meglio delle tre, gran finale al meglio delle cinque, e al meglio delle cinque non c'è ban e si vince con tutti e tre i mazzi. Il controllo Conquest del deck builder di OriginsMeta è ancora quello di Big Bob's Playtest Battle: conta le copie (almeno ${RULES.conquestMinDifferent} copie di differenza fra un mazzo e l'altro) ed è più permissivo della regola della Crimson Cup, quindi non basta a dire che una lista è valida per il torneo.`,
  ];

  if (trovate.length) {
    blocchi.push(`CARTE DEL DATABASE — ${patchInfo()}:\n${trovate.map((t) => schedaCarta(t.c, locale)).join("\n")}`);
    for (const t of trovate) fonti.push({ tipo: "card", slug: t.c.slug, nome: t.c.name, href: `/cards/${t.c.slug}` });
  }
  if (guide.length) {
    blocchi.push(
      `GUIDE DEL SITO (estratti):\n${guide.map((x) => `- "${x.g.title}": ${x.g.excerpt}\n  ${x.g.body.replace(/[#*_>`]/g, "").replace(/\s*\n\s*/g, " ").slice(0, 900)}`).join("\n")}`,
    );
    for (const x of guide) fonti.push({ tipo: "guide", slug: x.g.slug, nome: x.g.title, href: `/guides/${x.g.slug}` });
  }
  if (prossimi.length) {
    blocchi.push(`EVENTI IN CALENDARIO:\n${prossimi.map((e) => `- ${e.title[locale]} (${e.start}–${e.end}): ${e.text[locale]}`).join("\n")}`);
    for (const e of prossimi) fonti.push({ tipo: "event", slug: e.slug, nome: e.title[locale], href: "/tournaments" });
  }

  return { testo: blocchi.join("\n\n"), fonti };
}

/**
 * Versione dei dati delle carte, letta da `cards.ts` (ultima patch e ultima verifica nel gioco): prima era scritta
 * a mano ("patch 0.6.3") ed era rimasta indietro di una patch. La usano i dati e le istruzioni dell'assistente.
 */
export function patchInfo(): string {
  const p = patches[latestPatch];
  const it = (iso: string) => iso.split("-").reverse().join("/");
  return `patch ${patchLabel(latestPatch, "it")} (${it(p.date)}), con le carte verificate nel gioco il ${it(cardsVerified.date)}`;
}

/** Statistiche usate dalla pagina per dire su che cosa può rispondere. */
export const copertura = () => ({
  carte: cards.filter((c) => c.status === "active").length,
  guide: getGuides("it").length,
  patch: patches[latestPatch].date.split("-").reverse().join("/"),
});
