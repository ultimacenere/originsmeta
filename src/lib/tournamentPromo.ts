import type { Locale } from "./i18n";

/**
 * Popup di un torneo della community (05/11/2026, Pierluigi: "mi fai un popup per chi entra nel sito che promuova
 * questo torneo e cliccando rimanda alla pagina di iscrizione?"). Il primo è EndGame First Blood di 7keys (OM-BTGP,
 * /tournaments/endgame-first-blood-602f): inizio, formato e check-in dalla sua scheda, montepremi e "No Bans" dalla
 * descrizione e dal regolamento scritti dall'organizzatore (letti il 05/11/2026). Funzioni pure, senza import a runtime:
 * le legge anche il test (tournamentPromo.test.ts).
 *
 * Regole (componente TournamentPromo.tsx, montato nel layout della lingua):
 * - si apre da solo una volta per browser, PROMO_DELAY_MS dopo che il banner dei cookie non c'è più: senza una scelta sui
 *   cookie non si apre (niente due riquadri uno sopra l'altro, e i crawler, che non scelgono, non lo vedono); mai insieme
 *   al riquadro dei feedback e mai mentre si scrive in un campo (`src/lib/autoOpen.ts`);
 * - non si apre nelle pagine del torneo (chi le apre l'ha già trovato: da lì non si apre più) né in accesso, account,
 *   strumenti e moduli (`promoQuietPath`);
 * - solo finché ci si può iscrivere per giocare (`until`, la chiusura del check-in) e finché il torneo è nel calendario
 *   del sito (/api/calendar: un torneo annullato, reso privato o già partito sparisce da lì);
 * - il tasto porta alla scheda del torneo, sul riquadro dell'iscrizione (#join); chi non ha fatto l'accesso lì trova
 *   "Accedi per iscriverti", che torna alla scheda.
 *
 * Per il prossimo torneo si cambia TOURNAMENT_PROMO (uno slug nuovo lo fa ricomparire anche a chi ha chiuso questo);
 * `null` lo spegne.
 */
export type TournamentPromo = {
  slug: string;
  tag: string;
  name: string;
  /** nome mostrato dell'organizzatore, come nella scheda */
  organizer: string;
  /** inizio (ISO, come starts_at nel database) */
  startsAt: string;
  /** fine del popup (ISO): la chiusura del check-in, 5 minuti prima dell'inizio (`checkinWindow` di tournament/rules.ts) */
  until: string;
  /** copertina della scheda del torneo: si mostra intera, senza ritagli */
  cover: { src: string; width: number; height: number };
  /** Conquest: quanti mazzi porta ogni giocatore */
  decks: number;
  bestOf: number;
  /** montepremi dichiarato dall'organizzatore nella descrizione del torneo */
  prize: { currency: string; total: number; first: number; second: number };
  /** la frase del torneo, nella lingua della pagina */
  pitch: Record<Locale, string>;
};

/** I dati che arrivano al browser: la frase va già nella lingua della pagina, fra le etichette. */
export type TournamentPromoData = Omit<TournamentPromo, "pitch">;

export const TOURNAMENT_PROMO: TournamentPromo | null = {
  slug: "endgame-first-blood-602f",
  tag: "OM-BTGP",
  name: "EndGame First Blood",
  organizer: "7keys",
  // sabato 7 novembre 2026: le 18:00 in Italia, le 14:00 in Brasile (la descrizione dice "14:00 BRT (17:00 UTC-3)")
  startsAt: "2026-11-07T17:00:00Z",
  until: "2026-11-07T16:55:00Z",
  // la copertina scelta dall'organizzatore: la key art del media kit, come in calendario e nella scheda
  cover: { src: "/media/hero-1920.webp", width: 1920, height: 1080 },
  decks: 2,
  bestOf: 3,
  // "$50.00 USD Prize Pool: 1st Place: $35.00 USD, 2nd Place: $15.00 USD"
  prize: { currency: "USD", total: 50, first: 35, second: 15 },
  // "No-Ban Meta Format: 2 Decks - No Bans!" e il regolamento: "Each player has 2 decks and must win with both to advance"
  pitch: {
    en: "Two decks and no bans: to move on, you have to win with both.",
    it: "Due mazzi e nessun ban: per passare il turno devi vincere con tutti e due.",
    es: "Dos mazos y sin baneos: para pasar de ronda tienes que ganar con los dos.",
    fr: "Deux decks et aucun ban : pour passer au tour suivant, vous devez gagner avec les deux.",
    pt: "Dois decks e nenhum banimento: para passar de rodada, você precisa vencer com os dois.",
    de: "Zwei Decks und keine Bans: Um weiterzukommen, musst du mit beiden gewinnen.",
    ru: "Две колоды и никаких банов: чтобы пройти дальше, нужно победить обеими.",
    "zh-cn": "两套卡组，没有禁用：两套都赢下才能晋级。",
  },
};

/** Memoria del browser: lo slug dell'ultimo popup chiuso, o del torneo di cui si è aperta la scheda. */
export const PROMO_SEEN_KEY = "originsmeta.tournamentPromo.v1";

/** Attesa dopo il banner dei cookie, e fra un tentativo e l'altro se la scheda è nascosta o si sta scrivendo. */
export const PROMO_DELAY_MS = 3000;

/** Il popup è ancora in tempo (fino alla chiusura del check-in, esclusa). */
export function promoActive(now: number, promo: Pick<TournamentPromo, "until"> | null): boolean {
  if (!promo) return false;
  const end = Date.parse(promo.until);
  return Number.isFinite(end) && now < end;
}

/** Le lingue del sito in testa al percorso, come `langOf` di analytics.ts. */
const LOCALE_PREFIX = /^\/(?:en|it|es|fr|pt|de|ru|zh-cn)(?=\/|$)/;

/** Il percorso senza la lingua: "/it/news" → "/news", "/it" → "/". */
export function pathWithoutLocale(pathname: string): string {
  const rest = pathname.replace(LOCALE_PREFIX, "");
  return rest === "" ? "/" : rest;
}

/** Le pagine del torneo promosso: la scheda e le sue sottopagine (mazzi, gestione, partite). */
export function isPromoTournamentPath(pathname: string, slug: string): boolean {
  const rest = pathWithoutLocale(pathname);
  return rest === `/tournaments/${slug}` || rest.startsWith(`/tournaments/${slug}/`);
}

/*
 * Pagine in cui non si interrompe: accesso e account, la landing del Kickstarter (ha il suo tasto), gli strumenti (deck
 * builder, Theory craft, draft, tier list personalizzabile) e i moduli (pubblicazione, modifica, gestione dei tornei,
 * stanze delle partite).
 */
const QUIET_PREFIX = /^\/(?:login|account|kickstarter|deck-builder|draft)(?:\/|$)/;
const QUIET_EXACT = /^\/(?:theory-craft|tier-list\/create|guides\/new|guides\/submit|decks\/publish|decks\/tournament\/publish|news\/comics\/new|tournaments\/new)\/?$/;
const QUIET_SEGMENT = /\/(?:edit|manage|deck|match)(?:\/|$)/;

export function promoQuietPath(pathname: string): boolean {
  const rest = pathWithoutLocale(pathname);
  return QUIET_PREFIX.test(rest) || QUIET_EXACT.test(rest) || QUIET_SEGMENT.test(rest);
}

/** Il torneo è ancora nel calendario del sito: la risposta di /api/calendar ha, per ogni lingua, le voci `t-<slug>`. */
export function promoListed(calendar: unknown, slug: string): boolean {
  if (!calendar || typeof calendar !== "object") return false;
  const key = `t-${slug}`;
  return Object.values(calendar as Record<string, unknown>).some(
    (list) => Array.isArray(list) && list.some((x) => typeof x === "object" && x !== null && (x as { key?: unknown }).key === key),
  );
}

/** Una cifra del montepremi nella lingua, senza decimali: "$50", "50 USD", "US$ 50"… */
export function promoMoney(amount: number, currency: string, lang: string): string {
  try {
    return new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** Giorno e ora dell'inizio nell'ora di chi guarda (il fuso si passa solo nei test). */
export function promoDate(iso: string, lang: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso));
}
