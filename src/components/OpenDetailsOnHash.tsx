"use client";

import { useEffect } from "react";

/*
  Apre i <details> chiusi a cui porta un'ancora (10/11/2026, pagina per i creator semplificata: guide, vantaggi e idee
  chiusi all'inizio; Pierluigi: "i creator vanno in panico con pagine lunghe"). Si apre il <details> che ha l'id
  dell'ancora oppure quello (o quelli, se annidati) che contiene l'elemento con quell'id:
  - all'arrivo sulla pagina (/for-creators#tracker) e a ogni cambio di hash (indietro e avanti, indirizzo scritto a
    mano): se c'era qualcosa di chiuso, poi si scorre fino all'ancora (scroll-margin compreso);
  - al clic su un link verso un'ancora della stessa pagina, prima che ci scorrano il browser o il router di Next:
    serve quando l'hash è già quello dell'indirizzo (il browser allora non manda hashchange) e con i <Link> di Next,
    che cambiano l'indirizzo con pushState (niente hashchange).
  Non disegna niente e basta uno per pagina: la pagina resta un server component e il testo dei <details> chiusi resta
  nell'HTML (serve alla SEO; Chrome li apre già da solo quando l'ancora è dentro, questo copre gli altri casi).
*/

/** L'elemento di un'ancora ("#tracker"), o null. */
function targetOf(hash: string): HTMLElement | null {
  let id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return null;
  try {
    id = decodeURIComponent(id);
  } catch {
    // una % che non si decodifica: si cerca l'id così com'è
  }
  return document.getElementById(id);
}

/** Apre il <details> dell'elemento (lui stesso o quello che lo contiene) e quelli più esterni; true se ne ha aperto uno. */
function openAround(el: HTMLElement): boolean {
  let opened = false;
  for (let d = el.closest("details"); d; d = d.parentElement?.closest("details") ?? null) {
    if (!d.open) {
      d.open = true;
      opened = true;
    }
  }
  return opened;
}

export function OpenDetailsOnHash() {
  useEffect(() => {
    // Si scorre sempre, anche quando il <details> era già aperto: Chrome lo apre da solo all'arrivo, prima di questo
    // effetto, ma dopo l'idratazione la pagina resta in cima (prova del 10/11/2026 con /it/for-creators#twitch). Il
    // timer lascia finire l'impaginazione della riga appena aperta.
    const fromLocation = () => {
      const el = targetOf(window.location.hash);
      if (!el) return;
      openAround(el);
      setTimeout(() => el.scrollIntoView({ block: "start" }), 0);
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || !a.hash || (a.target && a.target !== "_self")) return;
      const here = window.location;
      if (a.origin !== here.origin || a.pathname !== here.pathname || a.search !== here.search) return;
      const el = targetOf(a.hash);
      if (el) openAround(el);
    };
    fromLocation();
    window.addEventListener("hashchange", fromLocation);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", fromLocation);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
