"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isInternalTraffic, onTrackedEvent } from "@/lib/analytics";
import {
  SEEN_KEY,
  VIEW_DELAY_MS,
  addSeen,
  isDeckStatKind,
  isLikelyBot,
  isVideoEmbedSrc,
  parseSeen,
  seenKey,
  statKindForEvent,
  statKindForHref,
  type DeckStatKind,
} from "@/lib/community/deckStats";

/** Contatori già mandati da questa scheda del browser: basta questo quando sessionStorage è bloccato. */
const sentHere = new Set<string>();

/** Primo invio di questo contatore nella sessione? Se sì lo segna (sessionStorage), così non riparte. */
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
 * Contatori della scheda di un mazzo per il suo autore (pacchetto STATS, 26/09/2026; regole in
 * src/lib/community/deckStats.ts e supabase/creator-STATS.sql). Non disegna nulla e non cambia l'HTML della pagina,
 * che resta ISR: lavora solo nel browser e chiama la funzione `bump_deck_stat` di Supabase con il client che la scheda
 * carica già (StarRating), così un autore con l'accesso fatto non conta sul proprio mazzo.
 * - visita: dopo `VIEW_DELAY_MS` di pagina visibile (il tempo in una scheda nascosta non conta);
 * - copia del codice del gioco: l'evento `game_code_copy` della scheda, ricevuto da analytics.ts (`onTrackedEvent`);
 * - clic su un link esterno dentro <main>: "video" per un video di YouTube o Twitch, "link" per gli altri (risorse e
 *   canali); `data-om-deck-stat="video"|"link"` su un elemento o un contenitore decide da sé, "off" lo esclude;
 * - video incorporato: il primo clic dentro il lettore (la finestra perde il focus e l'elemento attivo è l'iframe).
 * Una volta per sessione, per mazzo e per tipo; niente bot né browser dello staff. Sono stime.
 */
export function DeckStatsBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !slug) return;
    try {
      if (isLikelyBot(navigator.userAgent, navigator.webdriver === true)) return;
    } catch {
      return;
    }

    const bump = (kind: DeckStatKind) => {
      try {
        if (isInternalTraffic()) {
          console.info("[OriginsMeta · traffico interno] contatore del mazzo non inviato:", slug, kind);
          return;
        }
        if (!claim(seenKey(slug, kind))) return;
        // niente riprova: se la funzione non c'è ancora (migrazione non applicata) o la rete cade, il dato si perde
        void sb.rpc("bump_deck_stat", { p_slug: slug, p_kind: kind }).then(
          () => undefined,
          () => undefined,
        );
      } catch {
        /* il contatore non deve mai rompere la pagina */
      }
    };

    // Visita: tempo di pagina visibile, sommato fra una scheda nascosta e l'altra.
    let visibleFor = 0;
    let visibleSince: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (visibleSince === null) visibleSince = performance.now();
        clearTimeout(timer);
        timer = setTimeout(() => bump("view"), Math.max(0, VIEW_DELAY_MS - visibleFor));
      } else {
        if (visibleSince !== null) visibleFor += performance.now() - visibleSince;
        visibleSince = null;
        clearTimeout(timer);
      }
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    // Copie del codice del gioco: lo stesso evento che va a Vercel e GA4.
    const off = onTrackedEvent((name, params) => {
      const kind = statKindForEvent(name, params);
      if (kind) bump(kind);
    });

    // Clic sui link (anche con la rotellina) dentro il contenuto della pagina.
    const onClick = (e: MouseEvent) => {
      try {
        if (e.type === "auxclick" && e.button !== 1) return;
        const target = e.target instanceof Element ? e.target : null;
        if (!target?.closest("main")) return;
        const declared = target.closest<HTMLElement>("[data-om-deck-stat]")?.dataset.omDeckStat;
        if (declared) {
          if (isDeckStatKind(declared)) bump(declared);
          return;
        }
        const link = target.closest<HTMLAnchorElement>("a[href]");
        const kind = link ? statKindForHref(link.href, window.location.origin) : null;
        if (kind) bump(kind);
      } catch {
        /* il clic va avanti comunque */
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);

    // Clic dentro un lettore incorporato: la pagina perde il focus a favore dell'iframe (un clic nell'iframe non arriva
    // al documento). Il controllo aspetta un giro, perché activeElement si aggiorna dopo l'evento blur.
    let blurTimer: ReturnType<typeof setTimeout> | undefined;
    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        try {
          const el = document.activeElement;
          if (el instanceof HTMLIFrameElement && el.closest("main") && isVideoEmbedSrc(el.src)) bump("video");
        } catch {
          /* niente */
        }
      }, 0);
    };
    window.addEventListener("blur", onBlur);

    return () => {
      clearTimeout(timer);
      clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
      window.removeEventListener("blur", onBlur);
      off();
    };
  }, [slug]);
  return null;
}
