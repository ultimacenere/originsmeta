"use client";

import { useEffect } from "react";

/**
 * Il movimento d'ingresso di /analytics (12/10/2026, "sensazione da diretta"): le parti `.an-reveal` sotto la piega
 * entrano quando arrivano nello schermo (forbici e barre che crescono, podio che sale, celle dello scoreboard a tendina,
 * tutto in CSS). Quelle già visibili all'apertura non si toccano, così non lampeggiano; senza JavaScript, con "riduci
 * animazioni" o senza IntersectionObserver la pagina resta ferma e tutta visibile. In più accende nell'indice la sezione
 * che si sta leggendo (`data-an-link`).
 */
export function AnalyticsReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observers: IntersectionObserver[] = [];

    const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-an-link]")];
    if (links.length) {
      const spy = new IntersectionObserver(
        (entries) => {
          for (const en of entries) if (en.isIntersecting) links.forEach((a) => a.classList.toggle("is-on", a.dataset.anLink === en.target.id));
        },
        { rootMargin: "-40% 0px -55% 0px" },
      );
      links.forEach((a) => {
        const sec = a.dataset.anLink ? document.getElementById(a.dataset.anLink) : null;
        if (sec) spy.observe(sec);
      });
      observers.push(spy);
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue;
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      for (const el of document.querySelectorAll<HTMLElement>(".an-reveal")) {
        if (el.getBoundingClientRect().top < window.innerHeight) continue;
        el.classList.add("is-pending");
        io.observe(el);
      }
      observers.push(io);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);
  return null;
}
