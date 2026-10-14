/**
 * Il pannello del mazzo, "Deck tracker" (10/10/2026; dati da main/deckTracker.ts): la stessa pagina nella finestra
 * accanto al gioco (dati dal suo preload, `window.deckApi`) e nella sorgente per OBS (/overlay/deck, dati da
 * `deck.json` ogni 2 secondi). Parametri dell'indirizzo per OBS: `lang` (en, it, es) e `view=opp`.
 *
 * Disegno di Davdas dell'11/10/2026 (note Granola "tracker": "colpo d'occhio immediato, non lettura"):
 * - il mio mazzo: le 12 carte grandi in una griglia per costo (4 × 3, dall'11/10 sera 3 per fila su 4 file), che si scuriscono man mano che le peschi (metà
 *   delle copie: un po' scura; tutte: scura) con il contatore "1/2"; sotto, la Leggendaria a parte (si scurisce quando la
 *   peschi, con uno zoom) e un riquadro con le carte ancora nel mazzo e la vita dell'eroe;
 * - l'avversario (`view=opp`, finestra separata, un po' più piccola): Leggendaria e vita a sinistra, a destra le carte
 *   rivelate che compaiono una alla volta (si parte vuoti, mai caselle vuote).
 * Niente scorrimento: la finestra prende l'altezza del contenuto (`deckApi.fit`), la larghezza la sceglie il giocatore e
 * le carte la seguono. Niente cornice di Windows né titolo (Pierluigi, 11/10: "togliere la barra di Windows e il titolo
 * del deck"): nella finestra il pannello si trascina da qualunque punto e ha una × che compare al passaggio del mouse. Le carte sono sempre intere (immagini di originsmeta.com, mai ritagliate: i crediti restano).
 *
 * Dal 13/10/2026 il Deck tracker a griglia e il pannello a L descritti qui sopra non ci sono più (Pierluigi: "al posto
 * della classica, crea un mix con il deck di sinistra come colonna ai lati mentre il deck avversario come fasce"): il
 * classico è il mio mazzo come nelle Colonne e l'avversario come nelle Fasce (`shape`).
 *
 * Template (0.4.1, 12/10/2026, disegni di Pierluigi; parametro `layout`, anche per OBS): `classic` è il misto qui
 * sopra; `strips` ("Fasce in alto") mette in una fila sola le 12 carte e la Leggendaria del mio mazzo, e la Leggendaria
 * e le carte rivelate dell'avversario ("no, solo le 12 carte e la leggendaria"); `columns` ("Colonne ai lati") ha a
 * sinistra il mio mazzo con le carte ancora nel mazzo e a destra Leggendaria e carte rivelate dell'avversario, le sue
 * carte rimanenti e il mana dei due con la freccia del combattimento (copre il pannello del mana del gioco); `custom`
 * ("Personalizzato") segue le opzioni scelte in Setup, che arrivano con i dati (`view.custom`) e cambiano il pannello
 * dal vivo: disposizione, carte disegnate o solo nomi, carte per fila, opacità del fondo, carte finite nascoste, cosa
 * mostrare.
 * La dicitura "non affiliato a Koin Games" resta solo nella sorgente per OBS, cioè quando il pannello va in onda: nelle
 * finestre accanto al gioco, che vede solo il giocatore, non c'è (Pierluigi, 11/10/2026: "togliamola dai due deck,
 * dobbiamo recuperare più spazio possibile"; la dicitura resta nella finestra principale dell'app).
 */
import type { DeckApi, DeckTrackerView, PanelTemplate } from "../shared/types";
import { createDeckRenderer, shapeOf } from "./deckRender";

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
const asked2 = params.get("layout");
const layout: PanelTemplate = asked2 === "strips" || asked2 === "columns" || asked2 === "custom" ? asked2 : "classic";
document.body.classList.add(`layout-${shapeOf(layout, view)}`);

// il disegno del pannello sta in deckRender.ts (dal 14/10/2026), condiviso con l'estensione Twitch
const { L, paint } = createDeckRenderer({ view, lang, inWindow: Boolean(window.deckApi) });
if (view === "opp") document.title = L.oppTitle;

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
  // dal fondo del pannello: sopra c'è anche la linguetta (margine in alto del pannello); nella fascia dell'avversario la
  // linguetta sta sotto, fuori dal pannello, e conta lei
  const tab = root.querySelector(".tab");
  window.deckApi.fit(Math.ceil(Math.max(root.getBoundingClientRect().bottom, tab ? tab.getBoundingClientRect().bottom : 0) + 8));
}
new ResizeObserver(fit).observe(root);
root.addEventListener("click", (e) => {
  if (e.target instanceof HTMLElement && e.target.id === "close") window.deckApi?.close();
});

// tutorial della finestra principale (12/10/2026): il pannello si illumina e dice come si chiama, per farsi trovare
root.dataset.spot = L.spot(view === "opp");
window.deckApi?.onSpot((on) => document.body.classList.toggle("spot", on));

// maniglia del Deck tracker (12/10/2026): la larghezza la cambia il processo principale finché il tasto è premuto
if (window.deckApi) {
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !(e.target instanceof Element) || e.target.id !== "grip") return;
    e.target.setPointerCapture(e.pointerId);
    window.deckApi?.resize(true);
  });
  const end = () => window.deckApi?.resize(false);
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}

let drawnKey = "";
/** La Leggendaria era già pescata al giro prima: lo zoom solo nel momento della pesca. */
let legendaryWasOut = false;
function render(v: DeckTrackerView) {
  const key = JSON.stringify({ ...v, updatedAt: null });
  if (key === drawnKey) return;
  drawnKey = key;
  // "solo durante la partita" e fuori partita: niente pannello (in OBS la sorgente resta vuota)
  // le finestre le nasconde già il processo principale: qui conta solo per OBS (13/10/2026: la pagina restava vuota
  // per un attimo nella finestra appena rimostrata, perché `hidden` arriva con un secondo di ritardo)
  document.body.classList.toggle("is-hidden", v.hidden === true && !window.deckApi);
  const leg = v.deck?.legendary ?? null;
  const legOut = Boolean(v.live && leg && leg.drawn >= 1);
  const zoom = view === "me" && legOut && !legendaryWasOut ? " just" : "";
  legendaryWasOut = legOut;
  // la radice della pagina (#deck, .dt) è il pannello
  paint(root, layout, v, zoom);
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
