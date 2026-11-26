import { createElement, type ReactNode } from "react";
import { type Card, type L10n } from "@/lib/data/cards";
import { type Locale } from "@/lib/i18n";
import { gameCardTree, type GameCardInput, type GcNode } from "@/game-card/model";
import "@/game-card/theme.css";
import "@/game-card/card.css";

/**
 * La carta come la mostra il gioco (13/11/2026: via libera di Koin Games alla grafica del gioco; Pierluigi: "le carte
 * sul sito, sul tracker e sull'overlay devono risultare identiche a quelle in gioco"). Lo stesso modello dell'app
 * OriginsMeta Tracker e dell'estensione Twitch (src/game-card/model.ts), disegnato qui con React: cornice argento,
 * gemma del mana, finestra d'arte ufficiale, fascia dell'allineamento, testo con le parole chiave del gioco, forza e
 * salute. Font e colori in src/game-card/theme.css. La carta da collezione ufficiale, con la sua cornice e i crediti,
 * resta `CardArt`.
 */

const line = (t: L10n | undefined, locale: Locale) => (t ? t[locale] ?? t.en : "");

/** Gli attributi SVG con il trattino in React si scrivono in camelCase (stroke-width → strokeWidth). */
const camel = (k: string) => (k.startsWith("data-") || k.startsWith("aria-") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

function render(n: GcNode, key: number): ReactNode {
  if (!n.tag) return n.text ?? "";
  const props: Record<string, unknown> = { key };
  if (n.cls) props.className = n.cls;
  for (const [k, v] of Object.entries(n.attrs ?? {})) {
    if (k === "class") props.className = v;
    else if (k === "loading" || k === "decoding" || k === "draggable" || k === "alt" || k === "src" || k === "lang") props[k] = v;
    else props[n.svg ? camel(k) : k] = v;
  }
  if (n.style) props.style = Object.fromEntries(Object.entries(n.style).map(([k, v]) => [k.startsWith("--") ? k : camel(k), v]));
  const kids = n.text !== undefined ? [n.text] : (n.kids ?? []).map((k, i) => render(k, i));
  return createElement(n.tag, props, ...kids);
}

export function toGameCardInput(card: Card, locale: Locale): GameCardInput {
  return {
    slug: card.slug,
    name: card.name,
    type: card.type === "spell" ? "spell" : card.type === "token" ? "token" : "unit",
    cost: card.mana ?? null,
    power: card.power ?? null,
    health: card.health ?? null,
    legendary: !!card.legendary,
    alignment: card.alignment ?? null,
    text: line(card.ability, locale),
    art: card.art ?? null,
  };
}

/** La carta del gioco dai dati del modello: per i componenti che non hanno la `Card` intera (FlipCard, /cards). */
export function GameCardFace({ input, lang, className = "" }: { input: GameCardInput; lang: Locale; className?: string }) {
  return <div className={`omg-wrap${input.legendary ? " is-leg" : ""} ${className}`}>{render(gameCardTree(input, lang), 0)}</div>;
}

export function GameCard({ card, locale, className = "", priority = false }: { card: Card; locale: Locale; className?: string; priority?: boolean }) {
  const tree = gameCardTree(toGameCardInput(card, locale), locale);
  if (priority) {
    // l'arte della carta in cima alla scheda: subito, non "lazy"
    const img = tree.kids?.find((k) => k.cls === "omg-body")?.kids?.[0]?.kids?.[0];
    if (img?.attrs) {
      img.attrs.loading = "eager";
      img.attrs.fetchPriority = "high";
    }
  }
  // la gemma (e le ali delle Leggendarie) sporge in alto a sinistra come nel gioco: lo spazio lo lascia il contenitore
  return <div className={`omg-wrap${card.legendary ? " is-leg" : ""} ${className}`}>{render(tree, 0)}</div>;
}
