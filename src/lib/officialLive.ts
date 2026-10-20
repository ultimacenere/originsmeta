import type { Locale } from "./i18n";
import type { LiveUsers } from "./twitchLive";

/**
 * La diretta al posto dello slider della home (18/10/2026, Pierluigi: "quando da Twitch loro vanno online, al posto del
 * nostro slider in homepage deve apparire la loro diretta; finisce la diretta, torna tutto come prima"). Di base è il
 * canale ufficiale di Origins TCG (profilo OriginsTCG del sito, username `originstcg`, twitch.tv/originstcg, creato con
 * scripts/create-originstcg.mjs). Per la Crimson Cup, sulle pagine italiane, prima c'è il cast in italiano di CoachCrono
 * (Pierluigi: "il coach farà il cast della Crimson tra il 19 e il 21, possiamo mettere lui live solo per il pubblico
 * italiano in sostituzione di quello ufficiale di Origins? se il coach non sta castando ritorna quello ufficiale").
 *
 * Le dirette in `HERO_STREAMS` sono in ordine di priorità: vince la prima in diretta che vale per la lingua della pagina e
 * per il momento; nessuna = lo slider. Lo stato arriva da /api/live come per il bollino LIVE (stesse regole: categoria
 * Origins TCG o titolo che ne parla). Funzioni pure, senza import a runtime.
 */

export type HeroStreamId = "official" | "coachcrono";

export type HeroStream = {
  id: HeroStreamId;
  /** il nome utente del profilo sul sito (chiave di /api/live) */
  username: string;
  /** nome nel lettore e nel tasto */
  name: string;
  /** solo per queste lingue (assente = tutte) */
  locales?: readonly Locale[];
  /** solo in questo periodo (ISO con fuso), estremi compresi */
  from?: string;
  to?: string;
};

/**
 * In ordine di priorità. CoachCrono: dal 19 al 21 ottobre 2026 compresi, ora italiana (CEST, UTC+2), solo /it: le
 * giornate della Crimson Cup che casta in italiano. Fuori dal periodo, o se non è in diretta, vale il canale ufficiale.
 */
export const HERO_STREAMS: readonly HeroStream[] = [
  { id: "coachcrono", username: "coachcrono", name: "CoachCrono", locales: ["it"], from: "2026-10-19T00:00:00+02:00", to: "2026-10-21T23:59:59+02:00" },
  { id: "official", username: "originstcg", name: "Origins TCG" },
];

/** Il nome utente del profilo OriginsTCG sul sito. */
export const OFFICIAL_LIVE_USERNAME = "originstcg";
/** Ogni quanto la home ricontrolla la diretta a scheda visibile (la rotta tiene la risposta 90 secondi). */
export const OFFICIAL_LIVE_REFRESH_MS = 60_000;

export type HeroLive = { id: HeroStreamId; name: string; channel: string; viewers: number; title: string | null };

/** Il canale di /api/live è l'indirizzo canonico (`https://www.twitch.tv/<login>`, come `CHANNEL_URL` di twitchLive.ts). */
const CHANNEL_URL = /^https:\/\/www\.twitch\.tv\/([a-z0-9_]{3,25})$/;

/** Vale per questa lingua e in questo momento? */
export function streamApplies(stream: HeroStream, locale: string, now: number): boolean {
  if (stream.locales && !(stream.locales as readonly string[]).includes(locale)) return false;
  if (stream.from && now < Date.parse(stream.from)) return false;
  if (stream.to && now > Date.parse(stream.to)) return false;
  return true;
}

/** La diretta da mostrare in home: la prima di `streams` in diretta che vale per la lingua e il momento; null = lo slider. */
export function heroLiveOf(users: LiveUsers | null | undefined, locale: string, now: number, streams: readonly HeroStream[] = HERO_STREAMS): HeroLive | null {
  for (const s of streams) {
    if (!streamApplies(s, locale, now)) continue;
    const u = users?.[s.username];
    const login = u && typeof u.channel === "string" ? CHANNEL_URL.exec(u.channel)?.[1] : undefined;
    if (!u || !login) continue;
    return { id: s.id, name: s.name, channel: login, viewers: Number.isFinite(u.viewers) && u.viewers > 0 ? Math.floor(u.viewers) : 0, title: u.title?.trim() || null };
  }
  return null;
}

export type OfficialLiveLabels = {
  kicker: string;
  /** titolo del riquadro per la diretta ufficiale */
  heading: string;
  /** titolo del riquadro per il cast della Crimson Cup ({name}); compare solo in italiano, le altre lingue lo hanno per completezza */
  castHeading: string;
  /** "{n} spettatori" */
  viewers: string;
  viewersOne: string;
  openTwitch: string;
};

export const officialLiveLabels: Record<Locale, OfficialLiveLabels> = {
  en: { kicker: "Live now", heading: "Origins TCG is live on Twitch", castHeading: "The Crimson Cup live with {name}", viewers: "{n} viewers", viewersOne: "1 viewer", openTwitch: "Open on Twitch" },
  it: { kicker: "In diretta ora", heading: "Origins TCG è in diretta su Twitch", castHeading: "La Crimson Cup in diretta in italiano con {name}", viewers: "{n} spettatori", viewersOne: "1 spettatore", openTwitch: "Apri su Twitch" },
  es: { kicker: "En directo ahora", heading: "Origins TCG está en directo en Twitch", castHeading: "La Crimson Cup en directo con {name}", viewers: "{n} espectadores", viewersOne: "1 espectador", openTwitch: "Abrir en Twitch" },
  fr: { kicker: "En direct", heading: "Origins TCG est en direct sur Twitch", castHeading: "La Crimson Cup en direct avec {name}", viewers: "{n} spectateurs", viewersOne: "1 spectateur", openTwitch: "Ouvrir sur Twitch" },
  pt: { kicker: "Ao vivo agora", heading: "Origins TCG está ao vivo na Twitch", castHeading: "A Crimson Cup ao vivo com {name}", viewers: "{n} espectadores", viewersOne: "1 espectador", openTwitch: "Abrir na Twitch" },
};

/** Il titolo del riquadro per una diretta. */
export function heroHeading(labels: OfficialLiveLabels, live: Pick<HeroLive, "id" | "name">): string {
  return live.id === "official" ? labels.heading : labels.castHeading.replace("{name}", live.name);
}

/** "{n} spettatori" con il numero nel formato della lingua; null senza spettatori. */
export function officialViewersText(labels: OfficialLiveLabels, viewers: number, locale: string): string | null {
  if (viewers <= 0) return null;
  return viewers === 1 ? labels.viewersOne : labels.viewers.replace("{n}", new Intl.NumberFormat(locale).format(viewers));
}
