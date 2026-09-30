import type { Locale } from "./i18n";

/**
 * Testi di "Salva" e "Di tendenza" (blocco PREFERITI E TENDENZA, 30/09/2026): tasto nella scheda del mazzo, ordini di
 * /decks e sezione "Mazzi salvati" di /account. Un modulo solo nelle tre lingue, come deckVersionLabels.ts; `en` è il
 * tipo di riferimento. Segnaposto: {n}. Nessun import a runtime: il test in favorites.test.ts lo carica con `node --test`.
 */
const en = {
  save: "Save",
  saved: "Saved",
  /** accanto al tasto: quante persone l'hanno salvato */
  countOne: "saved by 1 player",
  count: "saved by {n} players",
  countNone: "Save it to find it again in your profile",
  loginToSave: "Sign in to save",
  errors: {
    limit: "You have saved 500 decks, the maximum: remove some from your profile.",
    invalid: "This deck can't be saved.",
    unavailable: "Saving decks isn't available yet: try again in a few minutes.",
    db: "Something went wrong: try again.",
  },
  sortTrending: "Trending",
  sortSaved: "Most saved",
  /** sulle schede di /decks, accanto ai voti */
  favoritesShort: "☆ {n}",
  account: {
    title: "Saved decks",
    hint: "The decks you saved with “Save”. Only you can see this list.",
    empty: "No saved decks yet: open a deck and press “Save”.",
    remove: "Remove",
    unpublished: "No longer published",
  },
};

export type FavoriteLabels = typeof en;

const it: FavoriteLabels = {
  save: "Salva",
  saved: "Salvato",
  countOne: "salvato da 1 giocatore",
  count: "salvato da {n} giocatori",
  countNone: "Salvalo per ritrovarlo nel tuo profilo",
  loginToSave: "Accedi per salvare",
  errors: {
    limit: "Hai salvato 500 mazzi, il massimo: togline qualcuno dal profilo.",
    invalid: "Questo mazzo non si può salvare.",
    unavailable: "Il salvataggio dei mazzi non è ancora disponibile: riprova fra qualche minuto.",
    db: "Qualcosa è andato storto: riprova.",
  },
  sortTrending: "Di tendenza",
  sortSaved: "Più salvati",
  favoritesShort: "☆ {n}",
  account: {
    title: "Mazzi salvati",
    hint: "I mazzi che hai salvato con “Salva”. Questa lista la vedi solo tu.",
    empty: "Nessun mazzo salvato: apri un mazzo e premi “Salva”.",
    remove: "Togli",
    unpublished: "Non più pubblicato",
  },
};

const es: FavoriteLabels = {
  save: "Guardar",
  saved: "Guardado",
  countOne: "guardado por 1 jugador",
  count: "guardado por {n} jugadores",
  countNone: "Guárdalo para encontrarlo de nuevo en tu perfil",
  loginToSave: "Inicia sesión para guardar",
  errors: {
    limit: "Has guardado 500 mazos, el máximo: quita algunos desde tu perfil.",
    invalid: "Este mazo no se puede guardar.",
    unavailable: "Guardar mazos aún no está disponible: vuelve a intentarlo en unos minutos.",
    db: "Algo salió mal: inténtalo de nuevo.",
  },
  sortTrending: "Tendencia",
  sortSaved: "Más guardados",
  favoritesShort: "☆ {n}",
  account: {
    title: "Mazos guardados",
    hint: "Los mazos que guardaste con «Guardar». Solo tú ves esta lista.",
    empty: "Aún no has guardado mazos: abre un mazo y pulsa «Guardar».",
    remove: "Quitar",
    unpublished: "Ya no está publicado",
  },
};

export const favoriteLabels: Record<Locale, FavoriteLabels> = { en, it, es };
