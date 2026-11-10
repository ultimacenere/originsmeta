import "server-only";
import { supabaseAnon, supabasePublic } from "@/lib/supabase/public";
import { getCardByKey } from "@/lib/data/cards";
import { baseKey, decodeGameCode, encodeOmCode } from "@/lib/deckcode";
import { liveLogins, twitchAvatars } from "@/lib/twitch";
import { isHidden, type EventDeck, type PublicEvent } from "./types";
import { parsePublicEvent } from "./view";

/**
 * Letture degli eventi della community sul server (10/11/2026): la pagina dell'evento (ISR), la rotta
 * /api/events/<slug> che il browser rilegge ogni 10 secondi e l'overlay. Solo dati pubblici: la funzione del database
 * nasconde i talent da svelare, i codici e i link (blocco "10/11/2026: EVENTI DELLA COMMUNITY" di schema.sql).
 */

export const EVENT_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isEventSlug(x: string): boolean {
  return x.length >= 3 && x.length <= 60 && EVENT_SLUG_PATTERN.test(x);
}

/** Errore di una funzione che non c'è ancora (migrazione non fatta): l'evento "non esiste", nessun errore. */
export function isMissingFunction(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === "PGRST202" || error.code === "42883" || /could not find the function|does not exist/i.test(error.message ?? "");
}

export type PublicEventView = PublicEvent & {
  /** foto Twitch dei talent senza foto propria (login → immagine) */
  avatars: Record<string, string>;
  /** canali dell'evento in diretta adesso */
  live: string[];
};

/**
 * L'evento per la pagina e la rotta. `fresh`: senza la cache dei dati di Next (la rotta, che ha la sua cache sulla CDN);
 * altrimenti la lettura resta in cache al massimo 60 secondi (pagina ISR). Null se l'evento non c'è (o il blocco non è
 * ancora migrato); gli altri errori salgono (l'ISR tiene la pagina di prima).
 */
export async function readPublicEvent(slug: string, opts: { fresh?: boolean; twitch?: boolean } = {}): Promise<PublicEventView | null> {
  if (!isEventSlug(slug)) return null;
  const sb = opts.fresh ? supabaseAnon() : supabasePublic();
  if (!sb) return null;
  const { data, error } = await sb.rpc("community_event_public", { p_slug: slug });
  if (error) {
    if (isMissingFunction(error)) return null;
    throw new Error(`evento ${slug}: ${error.message}`);
  }
  const event = parsePublicEvent(data);
  if (!event) return null;
  if (opts.twitch === false) return { ...event, avatars: {}, live: [] };
  const visible = event.config.talent.filter((t) => !isHidden(t));
  const logins = visible.flatMap((t) => (!isHidden(t) && t.twitch ? [t.twitch] : []));
  const needPhoto = visible.flatMap((t) => (!isHidden(t) && t.twitch && !t.photo ? [t.twitch] : []));
  const [avatars, live] = await Promise.all([needPhoto.length ? twitchAvatars(needPhoto) : Promise.resolve({}), logins.length ? liveLogins(logins) : Promise.resolve([])]);
  return { ...event, avatars, live };
}

export type DeckCards = { legendary: string | null; cards: string[]; om: string | null };

/**
 * Le carte di un mazzo dell'evento dal codice del gioco: Leggendaria e carte base (slug del database), più il codice
 * OM1 per aprirlo nel deck builder. Chiavi che il database non conosce: si saltano (e il deck builder non si offre).
 */
export async function deckCards(deck: EventDeck): Promise<DeckCards> {
  const decoded = await decodeGameCode(deck.code);
  if (!("keys" in decoded)) return { legendary: null, cards: [], om: null };
  let legendary: string | null = null;
  const cards: string[] = [];
  let unknown = 0;
  for (const key of decoded.keys) {
    const card = getCardByKey(baseKey(key)) ?? getCardByKey(key);
    if (!card) {
      unknown++;
      continue;
    }
    if (card.legendary && !legendary) legendary = card.slug;
    else if (!cards.includes(card.slug)) cards.push(card.slug);
  }
  const om = !unknown && legendary ? encodeOmCode({ name: deck.name, legendary, cards, customCards: [] }) : null;
  return { legendary, cards, om };
}
