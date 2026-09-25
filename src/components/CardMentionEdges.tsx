"use client";

import { useEffect } from "react";
import { buildDeckPeek, buildMentionPreview, mentionDescription, readPeek, type DeckPeek, type MentionPeek } from "@/lib/cardPeek";

/** Copie montate del componente e funzione che toglie gli eventi quando si smonta l'ultima. */
let hosts = 0;
let uninstall: (() => void) | null = null;
/** Numeratore degli id dei pannelli dei nomi di carta (per `aria-describedby`). */
let panels = 0;
/** Segnaposto di `CardPeek` già riempiti, con i dati usati: se React cambia la carta, il pannello si rifà. */
const filled = new WeakMap<Element, string>();
/** Menzioni con il pannello già creato e link già descritti, con l'indirizzo della carta: se cambia, si rifanno. */
const built = new WeakMap<Element, string>();
const described = new WeakMap<Element, string>();
/** Una sola passata delle descrizioni per render, anche con cento copie montate. */
let describing = false;

/**
 * Pannelli delle anteprime delle carte: li crea al primo passaggio del mouse (o al focus) e li tiene dentro la finestra.
 * - le anteprime dei nomi di carta nei testi (`CardMentions`, e il Markdown di news e guide), che si aprono in basso a
 *   destra del nome: `is-flip` le porta a sinistra, `is-up` sopra. Dentro una tabella (`.table-scroll`, che scorre di
 *   lato e quindi taglia ciò che ne esce) il pannello si posiziona rispetto alla finestra;
 * - le anteprime delle carte (`CardPeek`: chip, elenco dei mazzi, righe del deck builder), che si aprono sopra e
 *   centrate sulla carta: `is-left` / `is-right` le ancorano al bordo della carta, `is-down` le apre sotto.
 *   Il pannello non si sovrappone mai alla chip o alla riga da cui si apre, così il costo in mana resta scoperto
 *   (note del 22/09/2026).
 * Dal 25/09/2026 (GEO-01) il server manda solo il link o il segnaposto, con i dati in `data-peek`: il pannello nasce
 * qui, nello stesso punto e con le stesse classi di prima (src/lib/cardPeek.ts), così il testo della pagina letto
 * senza CSS (assistenti AI, estrattori) resta la frase dell'autore. Una volta creato, a mostrarlo e nasconderlo è il
 * CSS di sempre (:hover / :focus-within) e su touch non si vede, come prima.
 * Il nome nel testo apre il pannello anche col focus da tastiera, e allora il link riceve `aria-describedby`; prima
 * ancora, a ogni render, ogni nome di carta riceve la stessa descrizione in `aria-description` (un attributo, non
 * testo della pagina), così i lettori di schermo la leggono anche in modalità lettura e su touch, dove il focus non
 * si sposta. L'anteprima di `CardPeek` resta solo del mouse e nascosta ai lettori di schermo, come prima.
 * Senza JavaScript, o finché la pagina non è idratata, le anteprime non ci sono: resta il link alla scheda della carta.
 * I pannelli in `position: fixed` (in tabella e nel deck builder) hanno coordinate della finestra: se la pagina o la
 * lista scorrono col mouse fermo sul nome, si ricalcolano (evento scroll in cattura), così restano attaccati.
 *
 * Si può montare più volte (la pagina, `Markdown`, `CardMentions`, `CardPeek`): gli eventi delegati sul documento si
 * registrano una volta sola, finché resta montata almeno una copia. Pannelli e descrizioni si aggiungono solo a nodi
 * già idratati da React (`hydrated`): se un giorno le carte finissero in un `<Suspense>` che si idrata dopo il resto,
 * un figlio in più in un nodo non ancora idratato farebbe rifare a React tutto il blocco.
 */
export function CardMentionEdges() {
  useEffect(() => {
    if (hosts++ === 0) uninstall = install();
    return () => {
      if (--hosts === 0 && uninstall) {
        uninstall();
        uninstall = null;
      }
    };
  }, []);
  // dopo ogni render: i nomi di carta arrivati nel frattempo (navigazione lato client, testi cambiati) si descrivono
  useEffect(() => {
    if (describing) return;
    describing = true;
    queueMicrotask(() => {
      describing = false;
      describeMentions();
    });
  });
  return null;
}

/** Proprietà con cui React segna i nodi che ha idratato o creato (`__reactFiber$…`), letta una volta da <body>. */
let reactMark: string | null | undefined;

/**
 * Il nodo si può toccare: React l'ha già idratato, o è HTML del Markdown (che React non idrata nodo per nodo) dentro
 * un contenitore idratato. Se la proprietà non si trova nemmeno su <body> (interni di React cambiati), non si blocca
 * niente: meglio il rischio di prima che anteprime spente in tutto il sito.
 */
function hydrated(node: Element): boolean {
  if (reactMark === undefined) reactMark = Object.keys(document.body).find((k) => k.startsWith("__reactFiber$")) ?? null;
  if (!reactMark || reactMark in node) return true;
  const markdown = node.closest(".prose-night");
  return Boolean(markdown && reactMark in markdown);
}

/**
 * Dati delle anteprime dei nomi di carta per indirizzo della scheda. Solo la prima menzione di una carta in un testo
 * li porta: le altre li prendono dalla menzione con lo stesso link, che sta nello stesso testo e quindi nella pagina.
 */
function peeksByHref(): Map<string, string> {
  const map = new Map<string, string>();
  for (const mention of document.querySelectorAll<HTMLElement>(".card-mention[data-peek]")) {
    const target = mention.querySelector(".card-mention-link")?.getAttribute("href");
    if (target && !map.has(target)) map.set(target, mention.getAttribute("data-peek") ?? "");
  }
  return map;
}

/** Dati dell'anteprima di un nome di carta: i suoi, o quelli della menzione con lo stesso link. */
function mentionData(mention: HTMLElement, target: string, byHref?: Map<string, string>): MentionPeek | null {
  return readPeek<MentionPeek>(mention.getAttribute("data-peek") || (byHref ?? peeksByHref()).get(target));
}

/** `aria-description` su ogni nome di carta che non ha ancora il pannello (quello porta `aria-describedby`). */
function describeMentions() {
  let byHref: Map<string, string> | undefined;
  for (const link of document.querySelectorAll<HTMLElement>(".card-mention > .card-mention-link")) {
    const target = link.getAttribute("href") ?? "";
    if (described.get(link) === target || link.hasAttribute("aria-describedby")) continue;
    const mention = link.parentElement;
    if (!mention || !hydrated(mention)) continue;
    byHref ??= peeksByHref();
    const data = mentionData(mention, target, byHref);
    if (data) link.setAttribute("aria-description", mentionDescription(data));
    else link.removeAttribute("aria-description");
    described.set(link, target);
  }
}

/** Pannello del nome di carta: quello già creato per la stessa carta, o uno nuovo dai dati di `data-peek`. */
function mentionPanel(mention: HTMLElement, link: HTMLElement): HTMLElement | null {
  const target = link.getAttribute("href") ?? "";
  const existing = mention.querySelector<HTMLElement>(":scope > .card-mention-preview");
  if (existing && built.get(mention) === target) return existing;
  if (!hydrated(mention)) return null;
  const data = mentionData(mention, target);
  if (!data) return null;
  const id = `card-peek-${++panels}`;
  const panel = buildMentionPreview(document, data, id);
  if (existing) existing.replaceWith(panel);
  else mention.append(panel);
  built.set(mention, target);
  // il pannello è la descrizione: `aria-describedby` prende il posto di `aria-description`
  link.setAttribute("aria-describedby", id);
  link.removeAttribute("aria-description");
  return panel;
}

/** Dati del segnaposto di `CardPeek`: i suoi, o quelli della prima copia della stessa carta (`data-peek-ref`). */
function peekData(slot: HTMLElement): string | null {
  const own = slot.getAttribute("data-peek");
  if (own) return own;
  const ref = slot.getAttribute("data-peek-ref");
  if (!ref) return null;
  for (const source of document.querySelectorAll<HTMLElement>(".deck-peek[data-peek-key]")) {
    if (source.getAttribute("data-peek-key") === ref) return source.getAttribute("data-peek");
  }
  return null;
}

/** Riempie il segnaposto di `CardPeek` (vuoto nell'HTML) con il pannello, o lo rifà se i dati sono cambiati. */
function fillPeek(slot: HTMLElement) {
  const raw = peekData(slot);
  if (!raw || filled.get(slot) === raw || !hydrated(slot)) return;
  const data = readPeek<DeckPeek>(raw);
  if (!data) return;
  slot.replaceChildren(buildDeckPeek(document, data));
  filled.set(slot, raw);
}

function install(): () => void {
  const margin = 8;
  // Misure di ripiego: finché il pannello è `display: none` non ha dimensioni. Larghezza come nel CSS (330 px, al
  // massimo il 78% della finestra); altezza di una carta intera a metà pannello, per non sottostimarla.
  const peekWidth = () => Math.min(330, window.innerWidth * 0.78);
  const place = (e: Event) => {
    if (e.target instanceof Element) placeFrom(e.target, e.type === "mouseover");
  };
  /** `hover`: si arriva col mouse. L'anteprima di `CardPeek` si apre solo al passaggio: col focus non si crea. */
  const placeFrom = (target: Element, hover: boolean) => {
    const mention = target.closest<HTMLElement>(".card-mention");
    if (mention) {
      const link = mention.querySelector<HTMLElement>(".card-mention-link");
      const panel = link ? mentionPanel(mention, link) : null;
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
    if (hover) fillPeek(panel);
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
        .forEach((el) => placeFrom(el, el.matches(":hover")));
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
}
