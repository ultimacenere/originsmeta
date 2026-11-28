/**
 * Sezioni riservate agli iscritti (03/11/2026, Pierluigi: "il tracking del mercato rendilo aperto a tutti gli iscritti,
 * solo chi non è iscritto non potrà accedervi e vedrà tutto blurrato" e "come il mercato anche l'analytics"). Chi ha
 * fatto l'accesso vede la pagina vera; chi no riceve, allo stesso indirizzo, la pagina sfocata con l'invito a
 * registrarsi (src/app/[locale]/(site)/members-only/[section]). Lo scambio lo fa src/proxy.ts prima della cache: le
 * pagine vere restano statiche e ISR e nella pagina sfocata non c'è nessun dato vero, solo sagome.
 *
 * Il Mercato è riservato tutto (tabellone, schede degli oggetti, controfigura /market/demo); di Analytics la pagina
 * delle statistiche, /analytics, e dal 27/11/2026 le sue sezioni (`ANALYTICS_SECTIONS`): la Crimson Cup
 * (/analytics/crimson-cup) e la pagina dell'app (/tracker) restano aperte.
 * Per riaprire una sezione a tutti: il suo interruttore a false (e per il Mercato anche MARKET_PUBLIC in badges.ts).
 *
 * Il file non importa nulla: lo legge il proxy (che vede anche VERCEL_ENV).
 */
export const MARKET_MEMBERS_ONLY: boolean = true;
/**
 * Sulle anteprime dei branch il Mercato si vede senza accesso, come Analytics (28/11/2026, vetrina e scheda che
 * racconta): l'anteprima è già dietro il login di Vercel e lì l'accesso al sito non funziona, quindi si vedrebbe solo la
 * pagina sfocata. In produzione e in locale vale il muro di sempre (`MARKET_MEMBERS_ONLY`).
 */
export const MARKET_PREVIEW_OPEN: boolean = process.env.VERCEL_ENV === "preview";
/**
 * Sulle anteprime dei branch (Vercel Preview, già dietro il login di Vercel) Analytics è aperta: l'accesso al sito lì non
 * funziona e chi guarda l'anteprima vedrebbe solo la pagina sfocata (27/11/2026, Analytics a sezioni). In produzione e in
 * locale vale come sempre.
 */
export const ANALYTICS_MEMBERS_ONLY: boolean = process.env.VERCEL_ENV !== "preview";

export const MEMBERS_ONLY_SECTIONS = ["market", "analytics"] as const;
export type MembersOnlySection = (typeof MEMBERS_ONLY_SECTIONS)[number];

/**
 * Le sezioni di Analytics (27/11/2026, Analytics a sezioni): riservate come la Panoramica. Senza accesso mostrano la
 * stessa pagina sfocata di /analytics (canonical su /analytics). Uguali alle righe del matcher di src/proxy.ts (lo
 * controlla market.test.ts).
 */
export const ANALYTICS_SECTIONS = ["legendaries", "decks", "cards", "matchups", "trends", "match", "locations"] as const;
const ANALYTICS_SECTION_RE = new RegExp("^/(" + ANALYTICS_SECTIONS.join("|") + ")(/.*)?$");

/** Percorso della sezione, per il ritorno dopo l'accesso. */
export const membersOnlyPath: Record<MembersOnlySection, string> = { market: "/market", analytics: "/analytics" };

/** La pagina chiesta è riservata agli iscritti? Lingua e sezione, o `null`. */
export function membersOnlySection(pathname: string): { locale: string; section: MembersOnlySection } | null {
  const m = /^\/(en|it|es|fr|pt|de|ru|zh-cn)\/(market|analytics)(\/.*)?$/.exec(pathname);
  if (!m) return null;
  const [, locale, section, rest] = m;
  if (section === "market") return MARKET_MEMBERS_ONLY && !MARKET_PREVIEW_OPEN ? { locale, section } : null;
  return ANALYTICS_MEMBERS_ONLY && (!rest || rest === "/" || ANALYTICS_SECTION_RE.test(rest)) ? { locale, section: "analytics" } : null;
}
