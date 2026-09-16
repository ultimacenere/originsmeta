"use client";

import { useEffect } from "react";

/**
 * Ritocco minimo per le anteprime dei nomi di carta (`CardMentions`): quando il pannello sfonderebbe il bordo destro
 * o inferiore della finestra, aggiunge `is-flip` / `is-up` al contenitore e il CSS lo apre a sinistra o sopra.
 * Apertura e chiusura restano al CSS (:hover / :focus-within): senza JavaScript l'anteprima funziona comunque.
 * Va renderizzato una volta per pagina; ascolta gli eventi delegati sul documento, nessuna libreria.
 */
export function CardMentionEdges() {
  useEffect(() => {
    const margin = 8;
    const place = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      const box = e.target.closest<HTMLElement>(".card-mention");
      if (!box) return;
      const panel = box.querySelector<HTMLElement>(".card-mention-preview");
      const link = box.querySelector<HTMLElement>(".card-mention-link");
      if (!panel || !link) return;
      const r = link.getBoundingClientRect();
      const w = panel.offsetWidth || 280;
      const h = panel.offsetHeight || 240;
      box.classList.toggle("is-flip", r.left + w > window.innerWidth - margin && r.right - w >= margin);
      box.classList.toggle("is-up", r.bottom + h > window.innerHeight - margin && r.top - h >= margin);
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
