"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";
import { VIEW_DELAY_MS } from "@/lib/community/deckStats";
import { COMIC_LAST_PAGE_ATTR } from "@/lib/community/comicStats";
import { bumpComicStat } from "@/lib/community/deckStatsClient";

/**
 * Contatori della pagina di un fumetto per chi l'ha disegnato (02/11/2026; regole in src/lib/community/comicStats.ts e
 * supabase/schema.sql, blocco STATISTICHE DEI FUMETTI). Non disegna nulla e non cambia l'HTML della pagina, che resta
 * ISR: lavora solo nel browser e manda i contatori con `bumpComicStat` (una volta per scheda, per fumetto, lingua e
 * tipo; niente bot né browser dello staff; l'autore con l'accesso fatto non conta sul proprio fumetto). Sono stime.
 * - visita: dopo `VIEW_DELAY_MS` di pagina visibile, come i mazzi (il tempo in una scheda nascosta non conta);
 * - lettura completa: l'ultima tavola della striscia (`data-om-comic-last`, ComicStrip) entra nello schermo con la
 *   pagina visibile; con la scheda nascosta aspetta che torni visibile. Con una tavola sola conta subito.
 * `lang` è la lingua della pagina: dice quale versione (disegnata o tradotta) si legge.
 */
export function ComicStatsBeacon({ slug, lang }: { slug: string; lang: Locale }) {
  useEffect(() => {
    if (!slug) return;

    // Visita: tempo di pagina visibile, sommato fra una scheda nascosta e l'altra.
    let visibleFor = 0;
    let visibleSince: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Lettura: l'ultima tavola è entrata nello schermo mentre la scheda era nascosta
    let pendingRead = false;
    let readSent = false;
    const sendRead = () => {
      if (readSent) return;
      readSent = true;
      bumpComicStat(slug, lang, "read");
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (visibleSince === null) visibleSince = performance.now();
        clearTimeout(timer);
        timer = setTimeout(() => bumpComicStat(slug, lang, "view"), Math.max(0, VIEW_DELAY_MS - visibleFor));
        if (pendingRead) sendRead();
      } else {
        if (visibleSince !== null) visibleFor += performance.now() - visibleSince;
        visibleSince = null;
        clearTimeout(timer);
      }
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    let observer: IntersectionObserver | undefined;
    try {
      const last = document.querySelector(`[${COMIC_LAST_PAGE_ATTR}]`);
      if (last && "IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            observer?.disconnect();
            if (document.visibilityState === "visible") sendRead();
            else pendingRead = true;
          },
          { threshold: 0.2 },
        );
        observer.observe(last);
      }
    } catch {
      /* il contatore non deve mai rompere la pagina */
    }

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug, lang]);
  return null;
}
