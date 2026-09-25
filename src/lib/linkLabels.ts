import type { Locale } from "./i18n";

/**
 * Etichette dei link interni aggiunti con l'Ondata 1 del piano SEO/GEO (25/09/2026, "ogni ricerca alla sua pagina"):
 * la colonna "Esplora" del footer (MetaShifting, Luoghi, Le più giocate, tier list della community, Crea la tua,
 * Autori: pagine fuori dal menu che ricevevano 3-11 link interni), le news correlate e il blocco della patch nella
 * pagina di una news, le news collegate in fondo a una guida. Stanno qui e non nei dizionari, come `tierLabels.ts`:
 * un modulo solo per questi link, nelle tre lingue insieme. `en` è il tipo di riferimento, come per i dizionari.
 * I nomi delle sezioni sono quelli del sito (spagnolo: glossario in docs/spagnolo.md).
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
    /** {n} = carte toccate dalla patch */
    introOne: "1 card changes in this patch. Its name opens the card page with its full balance history.",
    introMany: "{n} cards change in this patch. Each name opens the card page with its full balance history.",
    /** solo nella versione con prima/dopo (patch notes senza testo) */
    numbers: "The numbers are mana · Power/Health, before and after.",
    metashifting: "Every balance change in MetaShifting",
  },
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
      introOne: "In questa patch cambia 1 carta. Il nome apre la scheda della carta con tutto il suo storico dei bilanciamenti.",
      introMany: "In questa patch cambiano {n} carte. Ogni nome apre la scheda della carta con tutto il suo storico dei bilanciamenti.",
      numbers: "I numeri sono mana · Potenza/Salute, prima e dopo.",
      metashifting: "Tutti i bilanciamenti in MetaShifting",
    },
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
      introOne: "En este parche cambia 1 carta. Su nombre abre la página de la carta con todo su historial de cambios de equilibrio.",
      introMany: "En este parche cambian {n} cartas. Cada nombre abre la página de la carta con todo su historial de cambios de equilibrio.",
      numbers: "Los números son maná · Poder/Salud, antes y después.",
      metashifting: "Todos los cambios de equilibrio en MetaShifting",
    },
    guideNews: "Noticias sobre este tema",
  },
};
