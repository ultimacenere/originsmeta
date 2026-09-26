import { supabaseBrowser } from "@/lib/supabase/client";
import { isInternalTraffic } from "@/lib/analytics";
import { SEEN_KEY, addSeen, isLikelyBot, parseSeen, rpcIsMissing, seenKey, type DeckStatKind } from "./deckStats";

/*
 * Invio dei contatori dei mazzi dal browser (pacchetto STATS, 26/09/2026): lo usano la scheda del mazzo
 * (DeckStatsBeacon) e il tasto di copia del codice nell'elenco /decks (CopyCode di DeckExplorer). Regole in
 * deckStats.ts e supabase/schema.sql, blocco STATS. Solo browser: sul server `supabaseBrowser()` è null e non parte nulla.
 * Il client Supabase è quello che l'header carica già su ogni pagina (AccountMenu), così la funzione SQL riconosce
 * l'autore con l'accesso fatto e non lo conta sul proprio mazzo.
 */

/** Contatori già mandati da questa scheda: basta questo quando sessionStorage è bloccato. */
const sentHere = new Set<string>();
/** La funzione non c'è (migrazione non applicata): non si chiama più fino al prossimo caricamento. */
let missing = false;
let bot: boolean | null = null;

function isBot(): boolean {
  if (bot === null) {
    try {
      bot = isLikelyBot(navigator.userAgent, navigator.webdriver === true);
    } catch {
      bot = true;
    }
  }
  return bot;
}

/** Primo invio di questo contatore nella scheda? Se sì lo segna (sessionStorage), così non riparte. */
function claim(key: string): boolean {
  if (sentHere.has(key)) return false;
  sentHere.add(key);
  try {
    const next = addSeen(parseSeen(sessionStorage.getItem(SEEN_KEY)), key);
    if (!next) return false;
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* storage bloccato: vale la memoria della pagina */
  }
  return true;
}

/**
 * +1 al contatore `kind` del mazzo `slug` per oggi: una volta per scheda del browser, per mazzo e per tipo; niente per
 * i bot e per i browser dello staff (solo un messaggio in console, come gli eventi di analytics.ts). Non lancia mai e
 * non aspetta: se la rete cade o la funzione manca, il dato si perde.
 */
export function bumpDeckStat(slug: string, kind: DeckStatKind): void {
  try {
    if (!slug || missing || isBot()) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    if (isInternalTraffic()) {
      console.info("[OriginsMeta · traffico interno] contatore del mazzo non inviato:", slug, kind);
      return;
    }
    if (!claim(seenKey(slug, kind))) return;
    void sb.rpc("bump_deck_stat", { p_slug: slug, p_kind: kind }).then(
      (res) => {
        if (rpcIsMissing(res)) missing = true;
      },
      () => undefined,
    );
  } catch {
    /* il contatore non deve mai rompere la pagina */
  }
}
