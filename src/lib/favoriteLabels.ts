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

/* "Favoris" per i preferiti (docs/francese.md): il tasto porta già la stella, il testo dice l'azione. */
const fr: FavoriteLabels = {
  save: "Ajouter aux favoris",
  saved: "Dans vos favoris",
  countOne: "dans les favoris de 1 joueur",
  count: "dans les favoris de {n} joueurs",
  countNone: "Ajoutez-le à vos favoris pour le retrouver dans votre profil",
  loginToSave: "Connectez-vous pour l'ajouter aux favoris",
  errors: {
    limit: "Vous avez 500 decks en favoris, le maximum : retirez-en quelques-uns depuis votre profil.",
    invalid: "Ce deck ne peut pas être ajouté aux favoris.",
    unavailable: "Les favoris ne sont pas encore disponibles : réessayez dans quelques minutes.",
    db: "Une erreur s'est produite : réessayez.",
  },
  sortTrending: "Tendances",
  sortSaved: "Les plus mis en favoris",
  favoritesShort: "☆ {n}",
  account: {
    title: "Favoris",
    hint: "Les decks que vous avez ajoutés à vos favoris. Vous êtes la seule personne à voir cette liste.",
    empty: "Aucun favori pour le moment : ouvrez un deck et appuyez sur « Ajouter aux favoris ».",
    remove: "Retirer",
    unpublished: "N'est plus publié",
  },
};

const pt: FavoriteLabels = {
  save: "Salvar",
  saved: "Salvo",
  countOne: "salvo por 1 jogador",
  count: "salvo por {n} jogadores",
  countNone: "Salve para encontrá-lo de novo no seu perfil",
  loginToSave: "Entre para salvar",
  errors: {
    limit: "Você salvou 500 decks, o máximo: remova alguns pelo seu perfil.",
    invalid: "Este deck não pode ser salvo.",
    unavailable: "Salvar decks ainda não está disponível: tente de novo em alguns minutos.",
    db: "Algo deu errado: tente de novo.",
  },
  sortTrending: "Em alta",
  sortSaved: "Mais salvos",
  favoritesShort: "☆ {n}",
  account: {
    title: "Decks salvos",
    hint: "Os decks que você salvou com “Salvar”. Só você vê esta lista.",
    empty: "Nenhum deck salvo ainda: abra um deck e toque em “Salvar”.",
    remove: "Remover",
    unpublished: "Não está mais publicado",
  },
};

const de: FavoriteLabels = {
  save: "Speichern",
  saved: "Gespeichert",
  countOne: "von 1 Spieler gespeichert",
  count: "von {n} Spielern gespeichert",
  countNone: "Speichere es, um es in deinem Profil wiederzufinden",
  loginToSave: "Melde dich an, um zu speichern",
  errors: {
    limit: "Du hast 500 Decks gespeichert, das Maximum: entferne einige über dein Profil.",
    invalid: "Dieses Deck kann nicht gespeichert werden.",
    unavailable: "Das Speichern von Decks ist noch nicht verfügbar: versuch es in ein paar Minuten noch einmal.",
    db: "Etwas ist schiefgelaufen: versuch es noch einmal.",
  },
  sortTrending: "Im Trend",
  sortSaved: "Am meisten gespeichert",
  favoritesShort: "☆ {n}",
  account: {
    title: "Gespeicherte Decks",
    hint: "Die Decks, die du mit „Speichern“ gespeichert hast. Nur du siehst diese Liste.",
    empty: "Noch keine gespeicherten Decks: öffne ein Deck und drücke auf „Speichern“.",
    remove: "Entfernen",
    unpublished: "Nicht mehr veröffentlicht",
  },
};

const ru: FavoriteLabels = {
  save: "Сохранить",
  saved: "Сохранено",
  countOne: "сохранили: 1 игрок",
  count: "сохранили игроков: {n}",
  countNone: "Сохраните колоду, чтобы найти её в своём профиле",
  loginToSave: "Войдите, чтобы сохранить",
  errors: {
    limit: "Вы сохранили 500 колод — это максимум: уберите несколько в своём профиле.",
    invalid: "Эту колоду нельзя сохранить.",
    unavailable: "Сохранение колод пока недоступно: попробуйте ещё раз через несколько минут.",
    db: "Что-то пошло не так: попробуйте ещё раз.",
  },
  sortTrending: "В тренде",
  sortSaved: "Чаще сохраняют",
  favoritesShort: "☆ {n}",
  account: {
    title: "Сохранённые колоды",
    hint: "Колоды, которые вы сохранили кнопкой «Сохранить». Этот список видите только вы.",
    empty: "Сохранённых колод пока нет: откройте колоду и нажмите «Сохранить».",
    remove: "Убрать",
    unpublished: "Больше не опубликована",
  },
};

export const favoriteLabels: Record<Locale, FavoriteLabels> = { en, it, es, fr, pt, de, ru };
