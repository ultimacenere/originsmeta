/**
 * Indirizzi degli eventi della community (10/11/2026). La pagina esiste solo in italiano (/it/events/<slug>); il link
 * breve da mettere nei comandi dei bot di Twitch e a voce in diretta è originsmeta.com/rumble (redirect in
 * next.config.ts, che deve restare uguale a questa tabella).
 */
export const EVENT_LOCALE = "it" as const;

export const EVENT_SHORT_PATHS: Readonly<Record<string, string>> = { "royale-rumble": "/rumble" };

export function eventPath(slug: string, sub = ""): string {
  return `/${EVENT_LOCALE}/events/${slug}${sub}`;
}

/** "originsmeta.com/rumble" (senza https://), da scrivere in chat e nei messaggi ai vincitori. */
export function eventShortLink(slug: string): string {
  return `originsmeta.com${EVENT_SHORT_PATHS[slug] ?? eventPath(slug)}`;
}

export function overlayPath(slug: string): string {
  return `/overlay/event/${slug}`;
}
