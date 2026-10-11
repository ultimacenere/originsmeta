/**
 * Il pannello del mazzo, "Deck tracker" (10/10/2026; dati da main/deckTracker.ts): la stessa pagina nella finestra
 * accanto al gioco (dati dal suo preload, `window.deckApi`) e nella sorgente per OBS (/overlay/deck, dati da
 * `deck.json` ogni 2 secondi). Parametri dell'indirizzo per OBS: `lang` (en, it, es) e `view=opp`.
 *
 * Disegno di Davdas dell'11/10/2026 (note Granola "tracker": "colpo d'occhio immediato, non lettura"):
 * - il mio mazzo: le 12 carte grandi in una griglia 4 × 3 (per costo), che si scuriscono man mano che le peschi (metà
 *   delle copie: un po' scura; tutte: scura) con il contatore "1/2"; sotto, la Leggendaria a parte (si scurisce quando la
 *   peschi, con uno zoom) e un riquadro con le carte ancora nel mazzo e la vita dell'eroe;
 * - l'avversario (`view=opp`, finestra separata, un po' più piccola): Leggendaria e vita a sinistra, a destra le carte
 *   rivelate che compaiono una alla volta (si parte vuoti, mai caselle vuote).
 * Niente scorrimento: la finestra prende l'altezza del contenuto (`deckApi.fit`), la larghezza la sceglie il giocatore e
 * le carte la seguono. Le carte sono sempre intere (immagini di originsmeta.com, mai ritagliate: i crediti restano).
 * Sempre "non affiliato a Koin Games".
 */
import type { DeckApi, DeckCard, DeckTrackerView } from "../shared/types";

declare global {
  interface Window {
    deckApi?: DeckApi;
  }
}

type Lang = "en" | "it" | "es";
const params = new URLSearchParams(location.search);
const asked = params.get("lang");
/** `view=opp`: il pannello delle carte dell'avversario (11/10/2026, finestra separata); altrimenti il mio mazzo. */
const view: "me" | "opp" = params.get("view") === "opp" ? "opp" : "me";
const lang: Lang = asked === "en" || asked === "it" || asked === "es" ? asked : /^it\b/i.test(navigator.language) ? "it" : /^es\b/i.test(navigator.language) ? "es" : "en";
document.documentElement.lang = lang;
document.body.classList.add(window.deckApi ? "in-window" : "in-obs");
if (view === "opp") document.body.classList.add("is-opp");

const LABELS = {
  en: {
    choose: "Choose a deck in the game",
    round: (n: number) => `Round ${n}`,
    opponent: "Opponent",
    oppWaiting: "The opponent's cards show up here, one by one, during the match.",
    oppTitle: "OriginsMeta · Opponent",
    drawn: (d: number, c: number) => `${d} of ${c} drawn`,
    deckLeft: "In deck",
    life: "Life",
    seen: "Seen",
    noScanner: "Turn on the screen scanner in the app for live updates.",
    brand: "Analytics · not affiliated with Koin Games",
  },
  it: {
    choose: "Scegli un mazzo nel gioco",
    round: (n: number) => `Round ${n}`,
    opponent: "Avversario",
    oppWaiting: "Durante la partita qui compaiono, una alla volta, le carte dell'avversario.",
    oppTitle: "OriginsMeta · Avversario",
    drawn: (d: number, c: number) => `${d} pescate su ${c}`,
    deckLeft: "Nel mazzo",
    life: "Vita",
    seen: "Viste",
    noScanner: "Accendi lo scanner dello schermo nell'app per gli aggiornamenti dal vivo.",
    brand: "Analytics · non affiliato a Koin Games",
  },
  es: {
    choose: "Elige un mazo en el juego",
    round: (n: number) => `Ronda ${n}`,
    opponent: "Rival",
    oppWaiting: "Durante la partida aquí aparecen, una a una, las cartas del rival.",
    oppTitle: "OriginsMeta · Rival",
    drawn: (d: number, c: number) => `${d} robadas de ${c}`,
    deckLeft: "En el mazo",
    life: "Vida",
    seen: "Vistas",
    noScanner: "Activa el escáner de pantalla en la app para las actualizaciones en vivo.",
    brand: "Analytics · sin afiliación con Koin Games",
  },
} as const;
const L = LABELS[lang];
if (view === "opp") document.title = L.oppTitle;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Una carta intera con l'immagine del sito (senza rete resta la cornice con il nome). */
const cardImg = (c: DeckCard | null) =>
  c?.slug
    ? `<span class="cardimg${c.legendary ? " is-legendary" : ""}"><img src="https://originsmeta.com/cards/${esc(c.slug)}.webp" alt="${esc(c.name)}" draggable="false" /><span class="cname">${esc(c.name)}</span></span>`
    : `<span class="cardimg empty" aria-hidden="true"></span>`;

/** Una carta del mio mazzo: scura man mano che la peschi, con il contatore delle copie pescate durante la partita. */
function myCard(c: DeckCard, live: boolean, cls = "") {
  const state = !live || c.drawn === 0 ? "" : c.drawn >= c.copies ? " out" : " half";
  const tip = live ? L.drawn(c.drawn, c.copies) : c.name;
  const count = live && c.drawn > 0 && c.copies > 1 ? `<span class="cnt">${c.drawn}/${c.copies}</span>` : "";
  return `<li class="gc${state}${cls}" title="${esc(tip)}">${cardImg(c)}${count}</li>`;
}

/** I due segmenti della vita dell'eroe (accesi: ancora da colpire). */
const lifePips = (n: number | null) =>
  `<span class="pips" aria-label="${esc(L.life)} ${n ?? "?"}/2">${[0, 1].map((i) => `<i class="${n === null ? "unk" : i < n ? "on" : ""}"></i>`).join("")}</span>`;

const stat = (value: string, label: string) => `<div class="stat"><b>${value}</b><span>${esc(label)}</span></div>`;

const root = document.getElementById("deck")!;
root.addEventListener(
  "error",
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.closest(".cardimg")?.classList.add("noimg");
  },
  true,
);

/** La finestra alta come il contenuto (niente barra di scorrimento); in OBS non serve. */
function fit() {
  if (!window.deckApi) return;
  window.deckApi.fit(Math.ceil(root.getBoundingClientRect().height + 8));
}
new ResizeObserver(fit).observe(root);

let drawnKey = "";
/** La Leggendaria era già pescata al giro prima: lo zoom solo nel momento della pesca. */
let legendaryWasOut = false;
function render(v: DeckTrackerView) {
  const key = JSON.stringify({ ...v, updatedAt: null });
  if (key === drawnKey) return;
  drawnKey = key;
  const live = v.live;
  const inMatch = Boolean(live?.inMatch);
  const round = inMatch && live?.round ? `<span class="round"><span class="dot" aria-hidden="true"></span>${esc(L.round(live.round))}</span>` : "";
  let body: string;
  if (view === "opp") {
    // si riempie man mano: solo le carte viste, mai caselle vuote
    const seen = live?.opponent.seen ?? [];
    const leg = live?.opponent.legendary ?? null;
    body = live
      ? `<div class="dhead"><span class="dname">${esc(L.opponent)}</span>${round}</div>
        <div class="oppwrap">
          <div class="side">
            ${leg ? `<div class="gc">${cardImg(leg)}</div>` : `<div class="gc">${cardImg(null)}</div>`}
            <div class="stats">${stat(lifePips(live.life.opp), L.life)}${stat(String(seen.length), L.seen)}</div>
          </div>
          <ul class="grid">${seen.map((c) => `<li class="gc" title="${esc(c.name)}">${cardImg(c)}${c.copies > 1 ? `<span class="cnt">×${c.copies}</span>` : ""}</li>`).join("")}</ul>
        </div>`
      : `<div class="dhead"><span class="dname">${esc(L.opponent)}</span></div><p class="muted pad">${esc(L.oppWaiting)}</p>`;
  } else if (v.deck) {
    const leg = v.deck.legendary;
    const legOut = Boolean(live && leg && leg.drawn >= 1);
    const zoom = legOut && !legendaryWasOut ? " just" : "";
    legendaryWasOut = legOut;
    body = `<div class="dhead"><span class="dname">${esc(v.deck.name ?? leg?.name ?? "?")}</span>${round}</div>
      <ul class="grid">${v.deck.cards.map((c) => myCard(c, Boolean(live))).join("")}</ul>
      <div class="foot">
        <ul class="legcol">${leg ? myCard(leg, Boolean(live), zoom) : `<li class="gc">${cardImg(null)}</li>`}</ul>
        <div class="stats">${stat(live?.deckLeft !== null && live?.deckLeft !== undefined ? String(live.deckLeft) : "–", L.deckLeft)}${stat(lifePips(live ? live.life.me : null), L.life)}</div>
      </div>`;
  } else body = `<p class="muted pad">${esc(L.choose)}</p>`;
  root.innerHTML = `${body}${v.scanner ? "" : `<p class="fine">${esc(L.noScanner)}</p>`}<footer class="brand">${esc(L.brand)}</footer>`;
  fit();
}

if (window.deckApi) {
  window.deckApi.onView(render);
  void window.deckApi.getView().then((v) => v && render(v));
} else {
  const load = async () => {
    try {
      const res = await fetch("deck.json", { cache: "no-store" });
      if (res.ok) render((await res.json()) as DeckTrackerView);
    } catch {
      // app chiusa: resta l'ultimo stato
    }
  };
  void load();
  setInterval(load, 2000);
}
