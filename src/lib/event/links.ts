/**
 * Indirizzi degli eventi della community (10/11/2026). La pagina esiste solo in italiano (/it/events/<slug>); il link
 * breve da mettere nei comandi dei bot di Twitch e a voce in diretta è originsmeta.com/showmatch (redirect in
 * next.config.ts, che deve restare uguale a questa tabella).
 */
export const EVENT_LOCALE = "it" as const;

export const EVENT_SHORT_PATHS: Readonly<Record<string, string>> = { "attrix-showmatch": "/showmatch" };

/**
 * Eventi annunciati (12/11/2026). Un evento può essere online senza essere annunciato (Pierluigi: "metti online queste
 * pagine, ovviamente non linkarle ai menu ma manteniamole non visibili"): finché il suo slug non è qui la pagina è
 * noindex e nessun menu, calendario, sitemap, news, popup o informativa la linka o la nomina; chi ha l'indirizzo (o il
 * link breve) la apre lo stesso. Per annunciarlo si aggiunge lo slug, nello stesso commit che lo linka dal sito.
 */
export const EVENT_ANNOUNCED: ReadonlySet<string> = new Set<string>([]);

export function eventAnnounced(slug: string): boolean {
  return EVENT_ANNOUNCED.has(slug);
}

export function eventPath(slug: string, sub = ""): string {
  return `/${EVENT_LOCALE}/events/${slug}${sub}`;
}

/** "originsmeta.com/showmatch" (senza https://), da scrivere in chat e nei messaggi ai vincitori. */
export function eventShortLink(slug: string): string {
  return `originsmeta.com${EVENT_SHORT_PATHS[slug] ?? eventPath(slug)}`;
}

export function overlayPath(slug: string): string {
  return `/overlay/event/${slug}`;
}
