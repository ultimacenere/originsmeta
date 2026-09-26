"use client";

import { useEffect } from "react";
import { onTrackedEvent } from "@/lib/analytics";
import { VIEW_DELAY_MS, embedFocusIsPlay, isDeckStatKind, statKindForEvent, statKindForHref } from "@/lib/community/deckStats";
import { bumpDeckStat } from "@/lib/community/deckStatsClient";

/**
 * Contatori della scheda di un mazzo per il suo autore (pacchetto STATS, 26/09/2026; regole in
 * src/lib/community/deckStats.ts e supabase/creator-STATS.sql). Non disegna nulla e non cambia l'HTML della pagina,
 * che resta ISR: lavora solo nel browser e manda i contatori con `bumpDeckStat` (una volta per scheda, per mazzo e per
 * tipo; niente bot né browser dello staff; l'autore con l'accesso fatto non conta sul proprio mazzo). Sono stime.
 * - visita: dopo `VIEW_DELAY_MS` di pagina visibile (il tempo in una scheda nascosta non conta);
 * - copia del codice del gioco: l'evento `game_code_copy` della scheda, ricevuto da analytics.ts (`onTrackedEvent`);
 * - video: il clic su "riproduci" del lettore a clic (VideoEmbed, pacchetto VIDEO), cioè l'evento `video_play` della
 *   scheda, ricevuto allo stesso modo;
 * - clic su un link esterno dentro <main>: "video" per un video di YouTube o Twitch (anche "Apri su YouTube/Twitch"
 *   sotto il lettore), "link" per gli altri (risorse e canali); `data-om-deck-stat="video"|"link"` su un elemento o un
 *   contenitore decide da sé, "off" lo esclude;
 * - video incorporato: il primo clic dentro il lettore già aperto (la finestra perde il focus e l'elemento attivo è
 *   l'iframe), ma non quando ci si arriva col Tab. Un video conta comunque una volta sola per scheda.
 */
export function DeckStatsBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const bump = (kind: Parameters<typeof bumpDeckStat>[1]) => bumpDeckStat(slug, kind);

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

    // Copie del codice del gioco e clic su "riproduci": gli stessi eventi che vanno a Vercel e GA4.
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
    // al documento). Il controllo aspetta un giro, perché activeElement si aggiorna dopo l'evento blur. Col Tab il
    // focus entra nell'iframe allo stesso modo: l'ultimo Tab premuto nella pagina lo distingue.
    let tabAt: number | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") tabAt = performance.now();
    };
    document.addEventListener("keydown", onKey, true);
    let blurTimer: ReturnType<typeof setTimeout> | undefined;
    const onBlur = () => {
      clearTimeout(blurTimer);
      const since = tabAt === null ? null : performance.now() - tabAt;
      blurTimer = setTimeout(() => {
        try {
          const el = document.activeElement;
          if (el instanceof HTMLIFrameElement && el.closest("main") && embedFocusIsPlay(el.src, since)) bump("video");
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
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
      off();
    };
  }, [slug]);
  return null;
}
