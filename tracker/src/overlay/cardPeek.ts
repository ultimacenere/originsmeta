/**
 * La carta del gioco al passaggio del mouse nell'app (13/11/2026; Pierluigi: "le carte sul sito, sul tracker e
 * sull'overlay devono risultare identiche a quelle in gioco"): passando su un elemento con `data-key` (le carte dei
 * pannelli del mazzo, deckRender.ts) o `data-gc-key` (le carte della finestra principale, app.ts) compare accanto la
 * carta di dettaglio del gioco, costruita con lo stesso modello del sito e dell'estensione Twitch (../../../src/game-card/).
 * I dati vengono da cards.json (testo en/it/es, statistiche, allineamento: scripts/cards.mjs); l'arte dal sito.
 */
import cardsTable from "../cards.json";
import { build } from "../../../src/game-card/dom";
import type { GameCardInput } from "../../../src/game-card/model";

type Row = { n: string; s: string; m: number | null; t: string; l: 0 | 1; p?: number | null; h?: number | null; al?: "good" | "evil" | "neutral" | null; art?: 1; x?: { en: string; it: string; es: string } };
const CARDS = cardsTable as unknown as Record<string, Row>;
const KEY_RE = /^C\d{5}_[A-Z]{2}$/;

/** La voce della tabella nella forma del modello (null se la chiave non c'è). */
export function peekInput(key: string, lang: "en" | "it" | "es"): GameCardInput | null {
  const k = key.replace(/_V\d+$/, "");
  const r = CARDS[k];
  if (!r || !KEY_RE.test(k)) return null;
  return {
    slug: r.s,
    name: r.n,
    type: r.t === "spell" ? "spell" : r.t === "token" ? "token" : "unit",
    cost: r.m,
    power: r.p ?? null,
    health: r.h ?? null,
    legendary: r.l === 1,
    alignment: r.al ?? null,
    text: r.x?.[lang] ?? "",
    art: r.art ? `https://originsmeta.com/cards/art/${r.s}.webp` : null,
  };
}

/**
 * Attacca l'anteprima a `root`: la carta compare a destra dell'elemento (a sinistra se non ci sta), larga `width` px,
 * dentro la finestra. Non tocca il resto della pagina; `title` degli elementi resta per chi usa la tastiera.
 */
export function attachCardPeek(root: HTMLElement, lang: "en" | "it" | "es", width = 220) {
  const box = document.createElement("div");
  box.className = "omg-peek";
  box.hidden = true;
  document.body.appendChild(box);
  let shownKey = "";
  const targetOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-gc-key],[data-key]") : null);
  function show(el: HTMLElement) {
    const key = el.dataset.gcKey ?? el.dataset.key ?? "";
    const input = peekInput(key, lang);
    if (!input) return hide();
    if (key !== shownKey) {
      box.replaceChildren(build(input, lang));
      shownKey = key;
    }
    const r = el.getBoundingClientRect();
    const w = Math.min(width, window.innerWidth - 24);
    const h = w * 1.475;
    const gem = w * 0.09;
    let x = r.right + 12 + gem;
    if (x + w > window.innerWidth - 8) x = Math.max(8 + gem, r.left - 12 - w);
    const y = Math.max(8 + gem, Math.min(window.innerHeight - h - 8, r.top + r.height / 2 - h / 2));
    box.style.setProperty("--peek-w", `${Math.round(w)}px`);
    box.style.left = `${Math.round(x)}px`;
    box.style.top = `${Math.round(y)}px`;
    box.hidden = false;
  }
  function hide() {
    box.hidden = true;
  }
  root.addEventListener("pointerover", (e) => {
    const el = targetOf(e.target);
    if (el && root.contains(el)) show(el);
    else hide();
  });
  root.addEventListener("pointerleave", hide);
  window.addEventListener("blur", hide);
}
