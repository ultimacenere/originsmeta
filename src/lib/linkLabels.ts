import type { Locale } from "./i18n";
import type { Change, ChangeKind } from "./data/cards";

/**
 * Etichette dei link interni aggiunti con l'Ondata 1 del piano SEO/GEO (25/09/2026, "ogni ricerca alla sua pagina"):
 * la colonna "Esplora" del footer (MetaShifting, Luoghi, Le più giocate, tier list della community, Crea la tua,
 * Autori: pagine fuori dal menu che ricevevano 3-11 link interni), le news correlate e il blocco della patch nella
 * pagina di una news, le news collegate in fondo a una guida. Stanno qui e non nei dizionari, come `tierLabels.ts`:
 * un modulo solo per questi link, nelle tre lingue insieme. `en` è il tipo di riferimento, come per i dizionari.
 * I nomi delle sezioni sono quelli del sito (spagnolo: glossario in docs/spagnolo.md).
 * In fondo, le funzioni pure che scelgono etichetta e dettaglio di una modifica di bilanciamento, condivise da
 * MetaShifting, dalle schede carta e dal blocco della patch nelle news (test in linkLabels.test.ts).
 */
const en = {
  explore: {
    title: "Explore",
    /** ancora descrittiva: /metashifting è la pagina primaria per "Origins TCG patch notes" (mappa delle query, C25) */
    metashifting: "Patch notes (MetaShifting)",
    locations: "Locations",
    mostPlayed: "Most played",
    communityTierList: "Community tier list",
    makeTierList: "Make your tier list",
    authors: "Authors",
  },
  /** titolo del blocco in fondo a una news (prima era "More news", sempre le ultime tre) */
  relatedNews: "Related news",
  /** blocco automatico sulle news che sono le patch notes di una patch (campo `news` della patch in cards.ts) */
  patch: {
    title: "What changes in this patch",
    /** {n} = carte cambiate davvero (statistiche, testo, allineamento), senza gli scambi nei mazzi */
    introOne: "1 card changes in this patch.",
    introMany: "{n} cards change in this patch.",
    /** {n} = carte delle modifiche di tipo "deck": entrano o escono dai mazzi preimpostati del playtest, la carta non cambia */
    swapsOne: "1 card is involved in the swaps in the playtest's preset decks.",
    swapsMany: "{n} cards are involved in the swaps in the playtest's preset decks.",
    /** chiude l'attacco: "One" quando nel blocco c'è una carta sola */
    linksOne: "Its name opens the card page with its full balance history.",
    linksMany: "Each name opens the card page with its full balance history.",
    /** solo nella versione con prima/dopo (patch notes senza testo) */
    numbers: "The numbers are mana · Power/Health, before and after.",
    metashifting: "Every balance change in MetaShifting",
  },
  /**
   * Pastiglia delle modifiche di tipo "deck" (scambi nelle liste dei mazzi preimpostati del playtest, card-history.ts):
   * non sono rework né modifiche della carta. Buff, Nerf e Rework stanno nei dizionari (`common`).
   */
  deckChange: "Deck change",
  /** blocco in fondo a una guida: le news il cui campo `guides` la cita */
  guideNews: "News on this topic",
};

export type LinkLabels = typeof en;

export const linkLabels: Record<Locale, LinkLabels> = {
  en,
  it: {
    explore: {
      title: "Esplora",
      metashifting: "Patch notes (MetaShifting)",
      locations: "Luoghi",
      mostPlayed: "Le più giocate",
      communityTierList: "Tier list della community",
      makeTierList: "Crea la tua tier list",
      authors: "Autori",
    },
    relatedNews: "News correlate",
    patch: {
      title: "Cosa cambia in questa patch",
      introOne: "In questa patch cambia 1 carta.",
      introMany: "In questa patch cambiano {n} carte.",
      swapsOne: "1 carta è coinvolta negli scambi dei mazzi preimpostati del playtest.",
      swapsMany: "{n} carte sono coinvolte negli scambi dei mazzi preimpostati del playtest.",
      linksOne: "Il nome apre la scheda della carta con tutto il suo storico dei bilanciamenti.",
      linksMany: "Ogni nome apre la scheda della carta con tutto il suo storico dei bilanciamenti.",
      numbers: "I numeri sono mana · Potenza/Salute, prima e dopo.",
      metashifting: "Tutti i bilanciamenti in MetaShifting",
    },
    deckChange: "Cambio di mazzo",
    guideNews: "News su questo argomento",
  },
  es: {
    explore: {
      title: "Explorar",
      metashifting: "Notas del parche (MetaShifting)",
      locations: "Ubicaciones",
      mostPlayed: "Las más jugadas",
      communityTierList: "Tier list de la comunidad",
      makeTierList: "Crea tu tier list",
      authors: "Autores",
    },
    relatedNews: "Noticias relacionadas",
    patch: {
      title: "Qué cambia en este parche",
      introOne: "En este parche cambia 1 carta.",
      introMany: "En este parche cambian {n} cartas.",
      swapsOne: "1 carta participa en los intercambios de los mazos predefinidos del playtest.",
      swapsMany: "{n} cartas participan en los intercambios de los mazos predefinidos del playtest.",
      linksOne: "Su nombre abre la página de la carta con todo su historial de cambios de equilibrio.",
      linksMany: "Cada nombre abre la página de la carta con todo su historial de cambios de equilibrio.",
      numbers: "Los números son maná · Poder/Salud, antes y después.",
      metashifting: "Todos los cambios de equilibrio en MetaShifting",
    },
    deckChange: "Cambio de mazo",
    guideNews: "Noticias sobre este tema",
  },
};

// ---------- Modifiche di bilanciamento ----------

/**
 * Etichetta della pastiglia di una modifica: "Buff", "Nerf" e "Rework" dal dizionario (`common`), "Cambio di mazzo"
 * da qui. Prima le modifiche di tipo "deck" (una carta che entra o esce da un mazzo preimpostato del playtest, come
 * Mowgli al posto di First Aid nello Swarm della 0.6.1) si leggevano come "Rework": sembrava che la carta fosse
 * stata rifatta, e non è vero.
 */
export function changeLabel(kind: ChangeKind, locale: Locale, common: Readonly<Record<Exclude<ChangeKind, "deck">, string>>): string {
  return kind === "deck" ? linkLabels[locale].deckChange : common[kind];
}

/**
 * Che cosa mostrare accanto alla pastiglia: il prima/dopo delle statistiche, il cambio di allineamento, la parola
 * "abilità" per le modifiche del solo testo, oppure niente per gli scambi nei mazzi (la carta non cambia: resta la
 * nota, che dice in quale mazzo entra o da quale esce).
 */
export function changeDetail(change: Pick<Change, "kind" | "from" | "to" | "alignment">): "stats" | "alignment" | "text" | "none" {
  if (change.kind === "deck") return "none";
  if (change.from && change.to) return "stats";
  return change.alignment ? "alignment" : "text";
}

/**
 * Attacco del blocco "Cosa cambia in questa patch" (news delle patch notes): le carte cambiate davvero e quelle degli
 * scambi nei mazzi si contano a parte, così la 0.6.1 dice "cambia 1 carta" (Huntsman) e "7 carte sono coinvolte negli
 * scambi", come il riassunto della news ("Swarm, Evil e Discard cambiano una carta ciascuno"), e non "cambiano 8
 * carte". Una carta con più modifiche nella stessa patch conta una volta per gruppo.
 */
export function patchIntro(items: readonly { card: { slug: string }; change: { kind: ChangeKind } }[], locale: Locale): string {
  const l = linkLabels[locale].patch;
  const changed = new Set(items.filter((m) => m.change.kind !== "deck").map((m) => m.card.slug));
  const swapped = new Set(items.filter((m) => m.change.kind === "deck").map((m) => m.card.slug));
  const count = (n: number, one: string, many: string) => (n === 0 ? "" : n === 1 ? one : many.replace("{n}", String(n)));
  const names = new Set([...changed, ...swapped]).size;
  return [count(changed.size, l.introOne, l.introMany), count(swapped.size, l.swapsOne, l.swapsMany), count(names, l.linksOne, l.linksMany)].filter(Boolean).join(" ");
}
