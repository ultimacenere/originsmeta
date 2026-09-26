/**
 * Link breve dei creator, da dire in diretta e da mettere nei pannelli di Twitch e nelle descrizioni di YouTube
 * (pacchetto CREATOR, 26/09/2026): originsmeta.com/@coachcrono porta a /<lingua>/u/coachcrono nella lingua del
 * browser (la stessa scelta dei link brevi dei tornei, `preferredLocale` in src/app/t/locale.ts) e aggiunge
 * utm_source=creator, utm_medium=shortlink e utm_campaign=<nome>, così GA4 e Vercel dicono quante visite porta
 * ciascun creator. Gli UTM già presenti nel link (per esempio un creator che scrive ?utm_source=youtube nella
 * descrizione dei video) vincono su quelli di default; gli altri parametri non passano.
 *
 * Il redirect lo fa src/proxy.ts (matcher "/@:name"): una cartella di src/app non può chiamarsi "@…" (è la sintassi
 * delle rotte parallele) e il proxy è il posto che la guida di Next 16 indica per i redirect che dipendono dalla
 * richiesta (docs/01-app/02-guides/redirecting.md, "NextResponse.redirect in Proxy"). Il proxy non deve caricare i
 * dizionari (src/lib/i18n.ts li importa tutti): per questo le lingue sono ripetute qui e il test le confronta.
 * Funzioni pure: `node --test src/lib/community/shortLink.test.ts`.
 */

/** Le lingue del sito, come `locales` di src/lib/i18n.ts (il test controlla che coincidano). */
export const SHORT_LINK_LOCALES = ["en", "it", "es"] as const;
export type ShortLinkLocale = (typeof SHORT_LINK_LOCALES)[number];

/** UTM di default del link breve (utm_campaign è il nome utente). */
export const SHORT_LINK_UTM = { utm_source: "creator", utm_medium: "shortlink" } as const;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * Nome utente dal percorso ("CoachCrono", "coachcrono/", "%40coachcrono"): minuscolo, fatto di lettere, cifre e
 * trattini come quelli che assegna `handle_new_user` in supabase/schema.sql. null se non può essere un nome utente.
 */
export function shortLinkUsername(raw: string): string | null {
  let value: string;
  try {
    value = decodeURIComponent(String(raw ?? ""));
  } catch {
    return null;
  }
  const name = value.trim().replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(name) ? name : null;
}

/**
 * Dove porta il link breve: il profilo nella lingua scelta, con gli UTM; un nome impossibile porta alla directory
 * dei creator (un nome valido ma inesistente dà la 404 del profilo, nella lingua giusta).
 */
export function profileShortLinkTarget(rawName: string, locale: ShortLinkLocale, incoming: URLSearchParams): string {
  const name = shortLinkUsername(rawName);
  if (!name) return `/${locale}/creators`;
  const query = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const own = incoming.get(key)?.trim().slice(0, 100);
    if (own) query.set(key, own);
  }
  if (!query.has("utm_source")) query.set("utm_source", SHORT_LINK_UTM.utm_source);
  if (!query.has("utm_medium")) query.set("utm_medium", SHORT_LINK_UTM.utm_medium);
  if (!query.has("utm_campaign")) query.set("utm_campaign", name);
  return `/${locale}/u/${name}?${query.toString()}`;
}

/** Il link breve da mostrare e copiare: "originsmeta.com/@coachcrono" (senza https, come si dice a voce). */
export function shortLinkLabel(username: string, host: string = "originsmeta.com"): string {
  return `${host}/@${username}`;
}
