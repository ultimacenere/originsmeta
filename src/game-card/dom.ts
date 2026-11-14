/**
 * La carta del gioco nel DOM (app OriginsMeta Tracker ed estensione Twitch): l'albero di ./model.ts costruito con
 * createElement/textContent, mai innerHTML (regole di Twitch e CSP dell'app). Lo stile è in ./theme.css e ./card.css.
 */
import { gameCardRenderTree, gameCardTipsTree, gameCardTree, type GameCardInput, type GameCardLang, type GcNode } from "./model";

const SVG_NS = "http://www.w3.org/2000/svg";

function make(n: GcNode): Node {
  if (!n.tag) return document.createTextNode(n.text ?? "");
  const e = n.svg ? document.createElementNS(SVG_NS, n.tag) : document.createElement(n.tag);
  if (n.cls) e.setAttribute("class", n.cls);
  for (const [k, v] of Object.entries(n.attrs ?? {})) e.setAttribute(k, v);
  for (const [k, v] of Object.entries(n.style ?? {})) (e as HTMLElement).style.setProperty(k, v);
  if (n.text !== undefined) e.textContent = n.text;
  for (const k of n.kids ?? []) e.appendChild(make(k));
  return e;
}

function tipsHost(tips: GcNode): HTMLElement {
  const host = document.createElement("div");
  host.className = "omg-tips-host";
  host.setAttribute("aria-hidden", "true");
  host.appendChild(make(tips));
  return host;
}

/**
 * La carta "render + testo" (14/11/2026): il render di Koin, con accanto il testo dell'abilità (il render non lo ha) e,
 * con `tips`, le parole chiave. Finché il render non è arrivato si vede la carta disegnata; se non arriva resta lei, e il
 * testo dell'abilità esce dal riquadro (lo ha già la carta disegnata).
 */
function buildRender(c: GameCardInput, lang: GameCardLang, tree: GcNode, keywords: boolean): HTMLElement {
  const card = make(tree) as HTMLElement;
  const tips = gameCardTipsTree(c, lang, { ability: true, keywords });
  const host = tips ? tipsHost(tips) : null;
  if (host) card.appendChild(host);
  const fallback = card.querySelector(".omg-card");
  const img = card.querySelector<HTMLImageElement>(".omg-render img");
  const done = () => card.classList.remove("is-loading");
  img?.addEventListener("load", done);
  img?.addEventListener("error", () => {
    card.classList.add("is-failed");
    done();
    host?.querySelector(".omg-tip--ability")?.remove();
    if (host && !host.querySelector(".omg-tip")) host.remove();
  });
  if (img?.complete && img.naturalWidth) done();
  fallback?.querySelector(".omg-art img")?.addEventListener("error", (e) => (e.target as HTMLElement).parentElement?.classList.add("is-noimg"));
  if (fallback && typeof requestAnimationFrame === "function") requestAnimationFrame(() => fit(fallback));
  if (fallback && typeof document !== "undefined" && document.fonts) void document.fonts.ready.then(() => fit(fallback));
  return card;
}

/** Rimpicciolisce il testo dell'abilità finché ci sta nel suo riquadro (passi del 6%, non sotto 3,6 cqw). */
export function fit(card: Element) {
  const box = card.querySelector<HTMLElement>(".omg-text");
  if (!box || !box.isConnected || !box.clientHeight) return;
  box.style.fontSize = "";
  const w = (card as HTMLElement).clientWidth || 1;
  let size = (parseFloat(getComputedStyle(box).fontSize) / w) * 100;
  for (let i = 0; i < 12 && box.scrollHeight > box.clientHeight + 1 && size > 3.6; i++) {
    size *= 0.94;
    box.style.fontSize = `${size.toFixed(2)}cqw`;
  }
}

/**
 * La carta pronta da mettere nella pagina; il testo si adatta al primo fotogramma dopo l'inserimento. Con `tips` accanto
 * c'è il riquadro delle parole chiave del testo, come nel gioco (a destra; a sinistra con la classe `is-tips-left` su un
 * contenitore).
 */
export function build(c: GameCardInput, lang: GameCardLang, className = "", opts: { tips?: boolean; render?: boolean } = {}): HTMLElement {
  const rtree = opts.render ? gameCardRenderTree(c, lang, className) : null;
  if (rtree) return buildRender(c, lang, rtree, !!opts.tips);
  const card = make(gameCardTree(c, lang, className)) as HTMLElement;
  const tips = opts.tips ? gameCardTipsTree(c, lang) : null;
  if (tips) card.appendChild(tipsHost(tips));
  card.querySelector(".omg-art img")?.addEventListener("error", (e) => (e.target as HTMLElement).parentElement?.classList.add("is-noimg"));
  // e di nuovo quando il font è arrivato (prima del font il testo di riserva occupa meno spazio)
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => fit(card));
  if (typeof document !== "undefined" && document.fonts) void document.fonts.ready.then(() => fit(card));
  return card;
}
