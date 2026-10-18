import type { Locale } from "./i18n";
import type { LiveUsers } from "./twitchLive";

/**
 * La diretta ufficiale di Origins TCG al posto dello slider della home (18/10/2026, Pierluigi: "quando da Twitch loro
 * vanno online, al posto del nostro slider in homepage deve apparire la loro diretta; finisce la diretta, torna tutto come
 * prima"). Il canale è quello del profilo OriginsTCG del sito (username `originstcg`, ruolo Creator, Twitch
 * twitch.tv/originstcg, scripts/create-originstcg.mjs): lo stato arriva da /api/live come per il bollino LIVE, con le
 * stesse regole (categoria Origins TCG o titolo che ne parla). Funzioni pure, senza import a runtime.
 */

/** Il nome utente del profilo OriginsTCG sul sito (chiave di /api/live). */
export const OFFICIAL_LIVE_USERNAME = "originstcg";
/** Ogni quanto la home ricontrolla la diretta a scheda visibile (la rotta tiene la risposta 90 secondi). */
export const OFFICIAL_LIVE_REFRESH_MS = 60_000;

export type OfficialLive = { channel: string; viewers: number; title: string | null };

/** Il canale di /api/live è l'indirizzo canonico (`https://www.twitch.tv/<login>`, come `CHANNEL_URL` di twitchLive.ts). */
const CHANNEL_URL = /^https:\/\/www\.twitch\.tv\/([a-z0-9_]{3,25})$/;

/** La diretta ufficiale, se è in corso, con il login di Twitch; null altrimenti (anche con un canale non canonico). */
export function officialLiveOf(users: LiveUsers | null | undefined): OfficialLive | null {
  const u = users?.[OFFICIAL_LIVE_USERNAME];
  const login = u && typeof u.channel === "string" ? CHANNEL_URL.exec(u.channel)?.[1] : undefined;
  if (!u || !login) return null;
  return { channel: login, viewers: Number.isFinite(u.viewers) && u.viewers > 0 ? Math.floor(u.viewers) : 0, title: u.title?.trim() || null };
}

export type OfficialLiveLabels = {
  kicker: string;
  heading: string;
  /** "{n} spettatori" */
  viewers: string;
  viewersOne: string;
  openTwitch: string;
  /** nome nel lettore e nel tasto */
  name: string;
};

export const officialLiveLabels: Record<Locale, OfficialLiveLabels> = {
  en: { kicker: "Live now", heading: "Origins TCG is live on Twitch", viewers: "{n} viewers", viewersOne: "1 viewer", openTwitch: "Open on Twitch", name: "Origins TCG" },
  it: { kicker: "In diretta ora", heading: "Origins TCG è in diretta su Twitch", viewers: "{n} spettatori", viewersOne: "1 spettatore", openTwitch: "Apri su Twitch", name: "Origins TCG" },
  es: { kicker: "En directo ahora", heading: "Origins TCG está en directo en Twitch", viewers: "{n} espectadores", viewersOne: "1 espectador", openTwitch: "Abrir en Twitch", name: "Origins TCG" },
  fr: { kicker: "En direct", heading: "Origins TCG est en direct sur Twitch", viewers: "{n} spectateurs", viewersOne: "1 spectateur", openTwitch: "Ouvrir sur Twitch", name: "Origins TCG" },
};

/** "{n} spettatori" con il numero nel formato della lingua; null senza spettatori. */
export function officialViewersText(labels: OfficialLiveLabels, viewers: number, locale: string): string | null {
  if (viewers <= 0) return null;
  return viewers === 1 ? labels.viewersOne : labels.viewers.replace("{n}", new Intl.NumberFormat(locale).format(viewers));
}
