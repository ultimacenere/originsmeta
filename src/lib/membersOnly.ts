/**
 * Sezioni riservate agli iscritti (03/11/2026, Pierluigi: "il tracking del mercato rendilo aperto a tutti gli iscritti,
 * solo chi non è iscritto non potrà accedervi e vedrà tutto blurrato" e "come il mercato anche l'analytics"). Chi ha
 * fatto l'accesso vede la pagina vera; chi no riceve, allo stesso indirizzo, la pagina sfocata con l'invito a
 * registrarsi (src/app/[locale]/(site)/members-only/[section]). Lo scambio lo fa src/proxy.ts prima della cache: le
 * pagine vere restano statiche e ISR e nella pagina sfocata non c'è nessun dato vero, solo sagome.
 *
 * Il Mercato è riservato tutto (tabellone, schede degli oggetti, controfigura /market/demo); di Analytics solo la pagina
 * delle statistiche, /analytics: la Crimson Cup (/analytics/crimson-cup) e la pagina dell'app (/tracker) restano aperte.
 * Per riaprire una sezione a tutti: il suo interruttore a false (e per il Mercato anche MARKET_PUBLIC in badges.ts).
 *
 * Il file non importa nulla: lo legge il proxy.
 */
export const MARKET_MEMBERS_ONLY: boolean = true;
export const ANALYTICS_MEMBERS_ONLY: boolean = true;

export const MEMBERS_ONLY_SECTIONS = ["market", "analytics"] as const;
export type MembersOnlySection = (typeof MEMBERS_ONLY_SECTIONS)[number];

/** Percorso della sezione, per il ritorno dopo l'accesso. */
export const membersOnlyPath: Record<MembersOnlySection, string> = { market: "/market", analytics: "/analytics" };

/** La pagina chiesta è riservata agli iscritti? Lingua e sezione, o `null`. */
export function membersOnlySection(pathname: string): { locale: string; section: MembersOnlySection } | null {
  const m = /^\/(en|it|es|fr|pt|de|ru)\/(market|analytics)(\/.*)?$/.exec(pathname);
  if (!m) return null;
  const [, locale, section, rest] = m;
  if (section === "market") return MARKET_MEMBERS_ONLY ? { locale, section } : null;
  return ANALYTICS_MEMBERS_ONLY && (!rest || rest === "/") ? { locale, section: "analytics" } : null;
}
