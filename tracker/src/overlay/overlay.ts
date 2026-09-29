/**
 * La pagina dell'overlay (Fase 4, 30/09/2026): la stessa nella finestra sopra il gioco (dati dal preload dell'overlay,
 * `window.overlayApi`) e nella sorgente per OBS (servita su 127.0.0.1 dall'app: dati da `state.json` ogni 2 secondi).
 * Parametri dell'indirizzo per OBS: `lang` (en, it, es) e `layout` (h orizzontale, v verticale).
 *
 * Mostra il mazzo scelto nel gioco, la sessione, il record del mazzo e l'ultima partita con la Leggendaria avversaria
 * (solo a partita finita). Mai bot o persona, mai il rank dell'avversario, mai nomi di giocatori. Sempre la dicitura
 * "non affiliato a Koin Games", come l'overlay per OBS del sito.
 */
import type { OverlayApi, OverlayView } from "../shared/types";

declare global {
  interface Window {
    overlayApi?: OverlayApi;
  }
}

type Lang = "en" | "it" | "es";
const params = new URLSearchParams(location.search);
const asked = params.get("lang");
const lang: Lang = asked === "en" || asked === "it" || asked === "es" ? asked : /^it\b/i.test(navigator.language) ? "it" : /^es\b/i.test(navigator.language) ? "es" : "en";
const layout = params.get("layout") === "v" ? "v" : "h";
document.documentElement.lang = lang;
document.body.classList.add(`layout-${layout}`, window.overlayApi ? "in-window" : "in-obs");

const LABELS = {
  en: { session: "Session", deck: "This deck", last: "Last", vs: "vs", choose: "Choose a deck in the game", win: "W", loss: "L", brand: "OriginsMeta Tracker · not affiliated with Koin Games" },
  it: { session: "Sessione", deck: "Questo mazzo", last: "Ultima", vs: "vs", choose: "Scegli un mazzo nel gioco", win: "V", loss: "S", brand: "OriginsMeta Tracker · non affiliato a Koin Games" },
  es: { session: "Sesión", deck: "Este mazo", last: "Última", vs: "vs", choose: "Elige un mazo en el juego", win: "V", loss: "D", brand: "OriginsMeta Tracker · sin afiliación con Koin Games" },
} as const;
const L = LABELS[lang];

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const pct = (w: number, n: number) => (n ? `${Math.round((100 * w) / n)}%` : "—");
const chip = (r: "W" | "L" | null) => (r === "W" ? `<span class="res W">${L.win}</span>` : r === "L" ? `<span class="res L">${L.loss}</span>` : `<span class="res X">?</span>`);

const root = document.getElementById("overlay")!;

function render(v: OverlayView, clickThrough: boolean) {
  document.body.classList.toggle("moving", !clickThrough);
  const deck = v.deck
    ? `<span class="star" aria-hidden="true">★</span><b>${esc(v.deck.name ?? v.deck.legendaryName ?? "?")}</b>${v.deck.name && v.deck.legendaryName ? `<span class="leg">${esc(v.deck.legendaryName)}</span>` : ""}`
    : `<span class="muted">${esc(L.choose)}</span>`;
  const rec = v.deckRecord;
  // ogni etichetta resta sulla riga del suo valore ("coppia"); in verticale le coppie vanno una sotto l'altra
  const last = v.last
    ? `<span class="pair"><span class="k">${esc(L.last)}</span>${chip(v.last.result)}${v.last.opponentName ? `<span class="muted">${esc(L.vs)}</span><span><span class="star" aria-hidden="true">★</span>${esc(v.last.opponentName)}</span>` : ""}</span>`
    : "";
  root.innerHTML = `
    <div class="deck">${deck}</div>
    <div class="row">
      <span class="pair"><span class="k">${esc(L.session)}</span><span class="v">${v.session.wins}–${v.session.losses}</span></span>
      ${rec ? `<span class="pair"><span class="k">${esc(L.deck)}</span><span class="v">${rec.wins}–${rec.losses}</span><span class="pct">${pct(rec.wins, rec.games)}</span></span>` : ""}
    </div>
    ${last ? `<div class="row last">${last}</div>` : ""}
    <div class="brand">${esc(L.brand)}</div>`;
}

if (window.overlayApi) {
  // finestra sopra il gioco: i dati arrivano dall'app appena cambiano
  window.overlayApi.onView((s) => render(s.view, s.clickThrough));
  void window.overlayApi.getView().then((s) => s && render(s.view, s.clickThrough));
} else {
  // sorgente per OBS: lo stato dal server locale dell'app
  const load = async () => {
    try {
      const res = await fetch("state.json", { cache: "no-store" });
      if (res.ok) render((await res.json()) as OverlayView, true);
    } catch {
      // app chiusa: resta l'ultimo stato
    }
  };
  void load();
  setInterval(load, 2000);
}
