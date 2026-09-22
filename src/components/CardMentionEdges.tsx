"use client";

import { useEffect } from "react";

/**
 * Ritocco minimo per i due pannelli che si aprono al passaggio del mouse, così non finiscono fuori dalla finestra:
 * - le anteprime dei nomi di carta nei testi (`CardMentions`, e il Markdown di news e guide), che si aprono in basso a
 *   destra del nome: `is-flip` le porta a sinistra, `is-up` sopra. Dentro una tabella (`.table-scroll`, che scorre di
 *   lato e quindi taglia ciò che ne esce) il pannello si posiziona rispetto alla finestra;
 * - le anteprime delle carte (`CardPeek`: chip, elenco dei mazzi, righe del deck builder), che si aprono sopra e
 *   centrate sulla carta: `is-left` / `is-right` le ancorano al bordo della carta, `is-down` le apre sotto.
 *   Il pannello non si sovrappone mai alla chip o alla riga da cui si apre, così il costo in mana resta scoperto
 *   (note del 22/09/2026).
 * Apertura e chiusura restano al CSS (:hover / :focus-within): senza JavaScript i pannelli funzionano comunque,
 * solo senza questa correzione ai bordi. Va renderizzato una volta per pagina; eventi delegati sul documento.
 * I pannelli in `position: fixed` (in tabella e nel deck builder) hanno coordinate della finestra: se la pagina o la
 * lista scorrono col mouse fermo sul nome, si ricalcolano (evento scroll in cattura), così restano attaccati.
 */
export function CardMentionEdges() {
  useEffect(() => {
    const margin = 8;
    // Misure di ripiego: finché il pannello è `display: none` non ha dimensioni. Larghezza come nel CSS (330 px, al
    // massimo il 78% della finestra); altezza di una carta intera a metà pannello, per non sottostimarla.
    const peekWidth = () => Math.min(330, window.innerWidth * 0.78);
    const place = (e: Event) => {
      if (e.target instanceof Element) placeFrom(e.target);
    };
    const placeFrom = (target: Element) => {
      const mention = target.closest<HTMLElement>(".card-mention");
      if (mention) {
        const panel = mention.querySelector<HTMLElement>(".card-mention-preview");
        const link = mention.querySelector<HTMLElement>(".card-mention-link");
        if (!panel || !link) return;
        const r = link.getBoundingClientRect();
        const w = panel.offsetWidth || Math.min(330, window.innerWidth - 32);
        const h = panel.offsetHeight || 260;

        if (mention.closest(".table-scroll")) {
          // In tabella: coordinate della finestra (`position: fixed`), sotto il nome se c'è posto, altrimenti sopra.
          const below = window.innerHeight - r.bottom;
          const up = below < h + margin && r.top > below;
          mention.classList.remove("is-flip");
          mention.classList.toggle("is-up", up);
          panel.style.position = "fixed";
          panel.style.left = `${Math.min(Math.max(margin, r.left), window.innerWidth - w - margin)}px`;
          panel.style.right = "auto";
          panel.style.top = up ? "auto" : `${r.bottom}px`;
          panel.style.bottom = up ? `${window.innerHeight - r.top}px` : "auto";
          return;
        }

        mention.classList.toggle("is-flip", r.left + w > window.innerWidth - margin && r.right - w >= margin);
        mention.classList.toggle("is-up", r.bottom + h > window.innerHeight - margin && r.top - h >= margin);
        return;
      }

      const peek = target.closest<HTMLElement>(".deck-card-wrap");
      if (!peek) return;
      const panel = peek.querySelector<HTMLElement>(".deck-peek");
      if (!panel) return;
      const r = peek.getBoundingClientRect();
      const w = panel.offsetWidth || peekWidth();
      const h = panel.offsetHeight || 260;

      // Nel deck builder la riga sta dentro una lista che scorre: un pannello in `absolute` verrebbe tagliato
      // dal contenitore, quindi lì si posiziona rispetto alla finestra. Sopra la riga si ancora con `bottom`,
      // sotto con `top`: il bordo del pannello resta a 6 px dalla riga qualunque sia la sua altezza, e la riga
      // (con il suo costo) non viene mai coperta. Se non c'è posto né sopra né sotto vince il lato più ampio.
      if (peek.classList.contains("builder-row")) {
        const spaceAbove = r.top - 6 - margin;
        const spaceBelow = window.innerHeight - r.bottom - 6 - margin;
        const above = h <= spaceAbove || (h > spaceBelow && spaceAbove > spaceBelow);
        panel.style.left = `${Math.min(Math.max(margin, r.left + r.width / 2 - w / 2), window.innerWidth - w - margin)}px`;
        panel.style.top = above ? "auto" : `${r.bottom + 6}px`;
        panel.style.bottom = above ? `${window.innerHeight - r.top + 6}px` : "auto";
        return;
      }

      const centro = r.left + r.width / 2;
      peek.classList.toggle("is-left", centro - w / 2 < margin);
      peek.classList.toggle("is-right", centro + w / 2 > window.innerWidth - margin);
      peek.classList.toggle("is-down", r.top - h < margin);
    };
    // Scorrimento con un pannello fisso aperto: si ricalcola una volta per fotogramma, solo per quelli aperti
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        document
          .querySelectorAll<HTMLElement>(".table-scroll .card-mention:is(:hover, :focus-within), .deck-card-wrap.builder-row:is(:hover, :focus-within)")
          .forEach((el) => placeFrom(el));
      });
    };
    document.addEventListener("mouseover", place);
    document.addEventListener("focusin", place);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("mouseover", place);
      document.removeEventListener("focusin", place);
      window.removeEventListener("scroll", onScroll, { capture: true });
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
