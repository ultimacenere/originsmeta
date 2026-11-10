"use client";

import { useEffect } from "react";

/*
  Tendine (<details>) e ancore della stessa pagina (10/11/2026, /for-creators; Pierluigi: le sezioni "devono essere
  nascoste, se poi uno clicca su una freccetta, si apre la sezione dedicata"). Un'ancora che porta a una tendina chiusa,
  o dentro una tendina chiusa, deve trovarla aperta: l'indice in cima alla pagina, le schede degli strumenti, un link da
  un'altra pagina (/for-creators#tracker).
  Il browser da solo non basta: apre i <details> chiusi che CONTENGONO il bersaglio (l'"ancestor revealing algorithm"
  dello standard HTML, vedi RemovedCardsArchive) solo in Chrome e Firefox, non in Safari, e mai il <details> che è lui
  stesso il bersaglio. Qui:
  - al clic su un link verso un'ancora di questa pagina, prima che il browser scorra, si aprono la tendina bersaglio (o
    quella subito dentro il bersaglio, quando l'ancora sta sulla <section>) e tutte quelle che la contengono; poi il
    browser scorre da sé fino al bersaglio, ormai visibile;
  - all'arrivo con un'ancora nell'indirizzo e a ogni cambio dell'ancora (indietro, avanti) si aprono le stesse tendine e
    si salta al bersaglio senza animazione (come fa il browser all'arrivo su una pagina), perché il browser ci ha già
    provato quando era chiuso.
  Senza JavaScript l'ancora porta alla tendina chiusa, che si apre con un clic. Il componente non disegna niente.
  Chi usa le tendine mette `suppressHydrationWarning` sui <details>: il browser può aprirli prima che React prenda la
  pagina (ancora nell'indirizzo, ricerca nella pagina, un clic), e React segnalerebbe l'attributo `open` in più.
*/

/** L'id del bersaglio da un'ancora ("#tracker" → "tracker"); stringa vuota se l'ancora non c'è o non si legge. */
function idOf(hash: string): string {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return "";
  }
}

/** Apre le tendine del bersaglio; restituisce il bersaglio se ne ha aperta almeno una. */
function reveal(id: string): HTMLElement | null {
  const target = id ? document.getElementById(id) : null;
  if (!target) return null;
  let opened = false;
  const own = target instanceof HTMLDetailsElement ? target : target.querySelector<HTMLDetailsElement>(":scope > details");
  if (own && !own.open) {
    own.open = true;
    opened = true;
  }
  for (let d = target.parentElement?.closest("details"); d; d = d.parentElement?.closest("details")) {
    if (!d.open) {
      d.open = true;
      opened = true;
    }
  }
  return opened ? target : null;
}

export function OpenDetailsOnHash() {
  useEffect(() => {
    const fromAddress = () => reveal(idOf(location.hash))?.scrollIntoView({ behavior: "instant" });
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      reveal(idOf(url.hash));
    };
    fromAddress();
    window.addEventListener("hashchange", fromAddress);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", fromAddress);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
