/**
 * Il pannello del mazzo, "Deck tracker" (10/10/2026; dati da main/deckTracker.ts): la stessa pagina nella finestra
 * accanto al gioco (dati dal suo preload, `window.deckApi`) e nella sorgente per OBS (/overlay/deck, dati da
 * `deck.json` ogni 2 secondi). Parametro dell'indirizzo per OBS: `lang` (en, it, es).
 *
 * Il nome del mazzo (con il round durante la partita) e le 13 carte tutte uguali, la Leggendaria per prima, con le
 * copie (le giocate in questa partita si spengono). Con `view=opp` (11/10/2026, finestra separata e sorgente per OBS
 * /overlay/deck?view=opp) le stesse righe per l'avversario: Leggendaria e carte rivelate, che si riempiono man mano.
 * Il meno spazio possibile (Pierluigi, 10/10/2026: "metti la leggendaria come le altre carte, il nome del deck e le
 * carte tutte uguali, fine"). Le carte sono sempre intere (immagini di
 * originsmeta.com, mai ritagliate: i crediti restano). Sempre "non affiliato a Koin Games".
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

const LABELS = {
  en: {
    choose: "Choose a deck in the game",
    round: (n: number) => `Round ${n}`,
    opponent: "Opponent",
    oppWaiting: "The opponent's Legendary and cards show up here during the match.",
    oppTitle: "OriginsMeta · Opponent",
    played: (p: number, c: number) => `${p} of ${c} played`,
    noScanner: "Turn on the screen scanner in the app for live updates.",
    brand: "Analytics · not affiliated with Koin Games",
  },
  it: {
    choose: "Scegli un mazzo nel gioco",
    round: (n: number) => `Round ${n}`,
    opponent: "Avversario",
    oppWaiting: "Durante la partita qui compaiono la Leggendaria e le carte dell'avversario.",
    oppTitle: "OriginsMeta · Avversario",
    played: (p: number, c: number) => `${p} giocate su ${c}`,
    noScanner: "Accendi lo scanner dello schermo nell'app per gli aggiornamenti dal vivo.",
    brand: "Analytics · non affiliato a Koin Games",
  },
  es: {
    choose: "Elige un mazo en el juego",
    round: (n: number) => `Ronda ${n}`,
    opponent: "Rival",
    oppWaiting: "Durante la partida aquí aparecen la Legendaria y las cartas del rival.",
    oppTitle: "OriginsMeta · Rival",
    played: (p: number, c: number) => `${p} jugadas de ${c}`,
    noScanner: "Activa el escáner de pantalla en la app para las actualizaciones en vivo.",
    brand: "Analytics · sin afiliación con Koin Games",
  },
} as const;
const L = LABELS[lang];
if (view === "opp") document.title = L.oppTitle;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Una carta intera con l'immagine del sito (senza rete resta la cornice). */
const cardImg = (c: DeckCard | null, cls = "") =>
  c?.slug
    ? `<span class="cardimg${c.legendary ? " is-legendary" : ""} ${cls}"><img src="https://originsmeta.com/cards/${esc(c.slug)}.webp" alt="" draggable="false" /></span>`
    : `<span class="cardimg empty ${cls}" aria-hidden="true"></span>`;

/** Una riga del mazzo: miniatura, costo, nome, copie (pallini: pieni = ancora da giocare). */
function row(c: DeckCard, live: boolean) {
  const left = c.copies - c.played;
  const dots = Array.from({ length: c.copies }, (_, i) => `<i class="${i < left ? "on" : ""}"></i>`).join("");
  return `<li class="card${live && left === 0 ? " done" : ""}${c.spell ? " spell" : ""}" title="${esc(L.played(c.played, c.copies))}">
      ${cardImg(c, "mini")}
      <span class="mana">${c.mana ?? "–"}</span>
      <span class="name">${c.legendary ? `<span class="star" aria-hidden="true">★</span>` : ""}${esc(c.name)}</span>
      <span class="dots" aria-label="${esc(L.played(c.played, c.copies))}">${dots}</span>
    </li>`;
}

const root = document.getElementById("deck")!;
root.addEventListener(
  "error",
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.closest(".cardimg")?.classList.add("noimg");
  },
  true,
);

let drawn = "";
function render(v: DeckTrackerView) {
  const key = JSON.stringify({ ...v, updatedAt: null });
  if (key === drawn) return;
  drawn = key;
  const live = v.live;
  const inMatch = Boolean(live?.inMatch);
  // solo durante la partita, sulla riga del nome: niente righe in più (Pierluigi, 10/10: "meno spazio possibile")
  const round = inMatch && live?.round ? `<span class="round"><span class="dot" aria-hidden="true"></span>${esc(L.round(live.round))}</span>` : "";
  const mine = v.deck
    ? `<div class="dhead"><span class="dname">${esc(v.deck.name ?? v.deck.legendary?.name ?? "?")}</span>${round}</div>
      <ul class="list">${[...(v.deck.legendary ? [v.deck.legendary] : []), ...v.deck.cards].map((c) => row(c, Boolean(live))).join("")}</ul>`
    : `<p class="muted pad">${esc(L.choose)}</p>`;
  // le carte dell'avversario: Leggendaria e carte rivelate, con le copie viste; si riempie man mano
  const oppCards = live ? [...(live.opponent.legendary ? [{ ...live.opponent.legendary, copies: 1, played: 0 }] : []), ...live.opponent.seen.map((c) => ({ ...c, played: 0 }))] : [];
  const opp = `<div class="dhead"><span class="dname">${esc(L.opponent)}</span>${round}</div>
      ${oppCards.length ? `<ul class="list">${oppCards.map((c) => row(c, false)).join("")}</ul>` : `<p class="muted pad">${esc(L.oppWaiting)}</p>`}`;
  root.innerHTML = `${view === "opp" ? opp : mine}${v.scanner ? "" : `<p class="fine">${esc(L.noScanner)}</p>`}<footer class="brand">${esc(L.brand)}</footer>`;
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
