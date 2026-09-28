/**
 * Ruoli (tag) dei profili e i permessi che ne dipendono: UN solo posto nel codice (27/09/2026).
 *
 * Decisioni di Pierluigi del 27/09/2026: "Ti ripeto i ruoli e tag: 1) Staff → tag Staff; 2) Creator → tag Creator;
 * 3) Autore → tag Autore; 4) Community → tag Community"; "Pro rimane, Influencer scompare"; l'Autore ha "più deck
 * pubblicabili e se vuole può creare guide"; il Creator ha il gradiente stile Instagram con la scritta bianca (quello
 * che era dell'Influencer). Prima c'era un pasticcio: dal 25/09 il tag con id `creator` si chiamava "Autore" sul sito
 * e l'Influencer era un tag a parte. Ora gli id sono cinque e dicono quello che mostrano:
 *
 *   id          etichetta (en / it / es)          tetto ai mazzi pubblicati   calendario e copertina propria   vetrina e directory
 *   staff       Staff                             nessuno                     sì                               sì
 *   creator     Creator                           nessuno                     sì                               sì
 *   pro         Pro                               nessuno                     sì                               sì
 *   author      Author / Autore / Autor           AUTHOR_DECK_LIMIT (20)      no                               sì
 *   community   Community (non si mostra)         COMMUNITY_DECK_LIMIT (5)    no                               no
 *
 * Dal 29/09/2026 Creator e Staff sostituiscono anche l'artwork della Leggendaria sui propri mazzi (`canUseDeckArt`).
 *
 * Un admin (`profiles.role = 'admin'`) ha i permessi dello Staff qualunque sia il suo tag. Il tag lo assegna solo lo
 * staff (scripts/set-badge.mjs, trigger protect_profile_badge), mai l'utente.
 *
 * Un valore che il codice non conosce (per esempio `influencer` letto dal database prima della migrazione del
 * 27/09/2026, che lo trasforma in `creator`) vale `community`: nessun permesso in più, nessun tag mostrato, niente
 * errori (`normalizeBadge`).
 *
 * Le stesse regole stanno nel database (supabase/schema.sql): vincolo `profiles_badge_check`, funzioni
 * `max_published_decks` e `protect_tournament_listing`, policy delle copertine dei tornei. Il test
 * `badges.test.ts` controlla che i due elenchi coincidano. Funzioni pure, senza import: `node --test` le esegue.
 */

/** I cinque tag, nell'ordine del vincolo del database. */
export const BADGES = ["community", "creator", "author", "pro", "staff"] as const;
export type Badge = (typeof BADGES)[number];

/** Ordine in cui i tag si elencano nell'interfaccia (filtro Ruolo di /decks, pagina /style): dallo Staff alla Community. */
export const BADGE_ORDER: readonly Badge[] = ["staff", "creator", "author", "pro", "community"];

/** Tetto ai mazzi pubblicati (compresi i nascosti) di un account della community (Pierluigi, 23/09/2026). */
export const COMMUNITY_DECK_LIMIT = 5;
/** Tetto ai mazzi pubblicati di un Autore (27/09/2026: "più deck pubblicabili"). Uguale in `max_published_decks`. */
export const AUTHOR_DECK_LIMIT = 20;

/** Tag senza tetto ai mazzi pubblicati (con gli admin). */
export const UNLIMITED_BADGES: readonly Badge[] = ["creator", "pro", "staff"];

/** Tag che pubblicano i tornei sul calendario del sito e caricano una copertina propria (con gli admin). */
export const LISTING_BADGES: readonly Badge[] = ["creator", "pro", "staff"];

/**
 * Tag con il profilo "vetrina": scheda nella directory /creators (se il profilo è compilato), tag, canali principali e
 * badge LIVE accanto al nome nei mazzi, `sameAs` della Person, tier list firmate.
 */
export const SHOWCASE_BADGES: readonly Badge[] = ["creator", "author", "pro", "staff"];

/**
 * Tag che pubblicano le guide direttamente (27/09/2026: l'Autore "se vuole può creare guide"; pacchetto GUIDE dello
 * stesso giorno: /guides/new, src/lib/community/guides.ts). Gli altri usano il modulo "Mandaci la tua guida". Nel database
 * la stessa regola sta in `can_publish_guides` (blocco GUIDE di supabase/schema.sql): guides.test.ts controlla che coincidano.
 */
export const GUIDE_BADGES: readonly Badge[] = ["author", "creator", "pro", "staff"];

/**
 * Tag che sostituiscono l'artwork della Leggendaria sui propri mazzi (29/09/2026, Pierluigi: "solo per i creator"; lo
 * Staff, come per gli altri permessi, e gli admin). Nel database la stessa regola sta nel trigger `guard_deck_art` e nella
 * policy di caricamento del bucket (blocco IMMAGINI di supabase/schema.sql): deckArt.test.ts controlla che coincidano.
 */
export const DECK_ART_BADGES: readonly Badge[] = ["creator", "staff"];

type Who = { badge?: string | null; role?: string | null } | null | undefined;

export function isBadge(value: unknown): value is Badge {
  return typeof value === "string" && (BADGES as readonly string[]).includes(value);
}

/** Il tag letto dal database o da un modulo: uno dei cinque, e qualsiasi altro valore (anche `influencer`) vale `community`. */
export function normalizeBadge(raw: unknown): Badge {
  return isBadge(raw) ? raw : "community";
}

/** Il ruolo da mostrare accanto a un nome: null per la community e per un tag sconosciuto (che vale community). */
export function shownBadge(raw: unknown): Exclude<Badge, "community"> | null {
  const badge = normalizeBadge(raw);
  return badge === "community" ? null : badge;
}

const isAdmin = (who: Who) => who?.role === "admin";
const has = (list: readonly Badge[], badge: unknown) => list.includes(normalizeBadge(badge));

/** Profilo vetrina (directory /creators, canali e LIVE accanto al nome, `sameAs`): Creator, Autore, Pro, Staff. */
export function isShowcaseBadge(badge: string | null | undefined): boolean {
  return has(SHOWCASE_BADGES, badge);
}

/** Pubblica i tornei sul calendario e carica una copertina propria: Creator, Pro, Staff e admin (non l'Autore). */
export function canListTournaments(who: Who): boolean {
  if (!who) return false;
  return isAdmin(who) || has(LISTING_BADGES, who.badge);
}

/**
 * Quanti mazzi pubblicati (compresi i nascosti) può avere un profilo: `Infinity` per Creator, Pro, Staff e admin,
 * `AUTHOR_DECK_LIMIT` per l'Autore, `COMMUNITY_DECK_LIMIT` per tutti gli altri (anche un profilo che non si è letto).
 */
export function publishedDeckCap(who: Who): number {
  if (isAdmin(who) || has(UNLIMITED_BADGES, who?.badge)) return Infinity;
  return normalizeBadge(who?.badge) === "author" ? AUTHOR_DECK_LIMIT : COMMUNITY_DECK_LIMIT;
}

/** Pubblica direttamente le guide della community (pacchetto GUIDE): Autore, Creator, Pro, Staff e admin. */
export function canPublishGuides(badge: string | null | undefined, role?: string | null): boolean {
  return role === "admin" || has(GUIDE_BADGES, badge);
}

/**
 * Carica l'artwork della Leggendaria di un proprio mazzo (29/09/2026): Creator, Staff e admin. Le letture pubbliche dei
 * mazzi portano solo il tag di chi ha pubblicato, non il ruolo: lì l'artwork si mostra per Creator e Staff.
 */
export function canUseDeckArt(badge: string | null | undefined, role?: string | null): boolean {
  return role === "admin" || has(DECK_ART_BADGES, badge);
}
