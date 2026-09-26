/**
 * Stato "in diretta" dei creator su Twitch (pacchetto CREATOR, 26/09/2026): le parti pure, senza rete e senza import,
 * così si provano con `node --test src/lib/twitchLive.test.ts`. Le chiamate a Twitch stanno in src/lib/twitch.ts, la
 * rotta in src/app/api/live/route.ts, il badge nel browser in src/components/LiveBadge.tsx.
 *
 * Si guarda solo chi ha un tag autore e un canale Twitch nel profilo. Una diretta conta se è su Origins TCG: la
 * categoria del gioco su Twitch oppure il titolo che lo nomina ("Origins TCG", "#originstcg", "OriginsMeta"). Chi è in
 * diretta su un altro gioco non riceve il badge: il sito parla di Origins, e il badge promette una diretta di Origins.
 */

/** Una diretta come la restituisce Helix, GET /helix/streams (solo i campi che servono). */
export type TwitchStream = { user_login: string; game_id?: string; game_name?: string; title?: string; viewer_count?: number; type?: string };

/** Un creator da controllare: il suo nome utente su OriginsMeta e il suo canale Twitch. */
export type LiveCandidate = { username: string; login: string };

/** Chi è in diretta, per nome utente di OriginsMeta: indirizzo del canale e spettatori. */
export type LiveUsers = Record<string, { channel: string; viewers: number }>;

/** Il corpo della risposta di /api/live: `enabled` false senza le chiavi di Twitch (nessun badge, nessun errore). */
export type LiveResponse = { enabled: boolean; users: LiveUsers };

/** Quanti canali per richiesta a Helix (limite di Twitch per `user_login`). */
export const HELIX_BATCH = 100;

/** Nomi della categoria del gioco su Twitch, ridotti a lettere e cifre minuscole. */
const ORIGINS_GAMES = new Set(["originstcg", "originstradingcardgame"]);

/** Un titolo che parla di Origins TCG: il nome del gioco, l'hashtag o il nostro sito. */
const ORIGINS_TITLE = /\borigins[\s_-]*tcg\b|#originstcg\b|\boriginsmeta\b/i;

/** La diretta è su Origins TCG? Categoria del gioco o titolo che lo nomina; con `gameId` basta l'id della categoria. */
export function isOriginsStream(stream: Pick<TwitchStream, "game_id" | "game_name" | "title" | "type">, gameId?: string): boolean {
  if (stream.type && stream.type !== "live") return false;
  if (gameId && stream.game_id === gameId) return true;
  const game = (stream.game_name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ORIGINS_GAMES.has(game) || ORIGINS_TITLE.test(stream.title ?? "");
}

/** Divide un elenco in gruppi di `size` (le richieste a Helix accettano al massimo 100 canali). */
export function chunk<T>(items: readonly T[], size: number = HELIX_BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += Math.max(1, size)) out.push(items.slice(i, i + Math.max(1, size)));
  return out;
}

/** Canali da chiedere a Twitch: nomi validi, minuscoli, senza doppioni. */
export function loginsToCheck(candidates: readonly LiveCandidate[]): string[] {
  return [...new Set(candidates.map((c) => c.login.toLowerCase()).filter((l) => /^[a-z0-9_]{3,25}$/.test(l)))];
}

/**
 * Chi è in diretta su Origins TCG, per nome utente di OriginsMeta. Più profili possono puntare allo stesso canale
 * (un doppio account, uno staff che mette il canale del team): il badge va a tutti, perché il canale è in diretta.
 */
export function liveUsers(candidates: readonly LiveCandidate[], streams: readonly TwitchStream[], gameId?: string): LiveUsers {
  const live = new Map<string, TwitchStream>();
  for (const s of streams) if (s.user_login && isOriginsStream(s, gameId)) live.set(s.user_login.toLowerCase(), s);
  const out: LiveUsers = {};
  for (const c of candidates) {
    const s = live.get(c.login.toLowerCase());
    if (s) out[c.username] = { channel: `https://www.twitch.tv/${c.login.toLowerCase()}`, viewers: Math.max(0, Math.round(Number(s.viewer_count) || 0)) };
  }
  return out;
}
