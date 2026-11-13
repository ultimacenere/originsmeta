/**
 * Ingresso per l'estensione Twitch: `window.OMGameCard` con `build(card, lang)` e `fit(card)`. Compilato (esbuild, non
 * minificato: Twitch vuole codice leggibile) in twitch-extension/game/card.js da tracker/scripts/twitch-panels.mjs,
 * insieme a theme.css, card.css e i font.
 */
import { build, fit } from "./dom";
import { gameCardLabel } from "./model";

declare global {
  interface Window {
    OMGameCard: { build: typeof build; fit: typeof fit; label: typeof gameCardLabel };
  }
}
window.OMGameCard = { build, fit, label: gameCardLabel };
