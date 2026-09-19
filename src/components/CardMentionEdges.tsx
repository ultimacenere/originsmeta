"use client";

import { useEffect } from "react";

/**
 * Ritocco minimo per i due pannelli che si aprono al passaggio del mouse, così non finiscono fuori dalla finestra:
 * - le anteprime dei nomi di carta nei testi (`CardMentions`), che si aprono in basso a destra del nome:
 *   `is-flip` le porta a sinistra, `is-up` sopra;
 * - le carte dei mazzi nell'elenco (`DeckExplorer`), che si aprono sopra e centrate sulla carta:
 *   `is-left` / `is-right` le ancorano al bordo della carta, `is-down` le apre sotto.
 * Apertura e chiusura restano al CSS (:hover / :focus-within): senza JavaScript i pannelli funzionano comunque,
 * solo senza questa correzione ai bordi. Va renderizzato una volta per pagina; eventi delegati sul documento.
 */
export function CardMentionEdges() {
  useEffect(() => {
    const margin = 8;
    const place = (e: Event) => {
      if (!(e.target instanceof Element)) return;

      const mention = e.target.closest<HTMLElement>(".card-mention");
      if (mention) {
        const panel = mention.querySelector<HTMLElement>(".card-mention-preview");
        const link = mention.querySelector<HTMLElement>(".card-mention-link");
        if (!panel || !link) return;
        const r = link.getBoundingClientRect();
        const w = panel.offsetWidth || 280;
        const h = panel.offsetHeight || 240;
        mention.classList.toggle("is-flip", r.left + w > window.innerWidth - margin && r.right - w >= margin);
        mention.classList.toggle("is-up", r.bottom + h > window.innerHeight - margin && r.top - h >= margin);
        return;
      }

      const peek = e.target.closest<HTMLElement>(".deck-card-wrap");
      if (!peek) return;
      const panel = peek.querySelector<HTMLElement>(".deck-peek");
      if (!panel) return;
      const r = peek.getBoundingClientRect();
      const w = panel.offsetWidth || 300;
      const h = panel.offsetHeight || 200;
      const centro = r.left + r.width / 2;
      peek.classList.toggle("is-left", centro - w / 2 < margin);
      peek.classList.toggle("is-right", centro + w / 2 > window.innerWidth - margin);
      peek.classList.toggle("is-down", r.top - h < margin);
    };
    document.addEventListener("mouseover", place);
    document.addEventListener("focusin", place);
    return () => {
      document.removeEventListener("mouseover", place);
      document.removeEventListener("focusin", place);
    };
  }, []);
  return null;
}
