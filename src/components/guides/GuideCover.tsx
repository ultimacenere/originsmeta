import type { CSSProperties } from "react";
import type { GuideCoverPreset } from "@/lib/community/guides";

/**
 * Copertina di una guida della community (pacchetto GUIDE, 27/09/2026): un disegno del sito con la palette "ink & mint"
 * (fondo blu notte e viola inchiostro, un bagliore del colore scelto, un motivo SVG leggero e due sagome di carte
 * disegnate a tratto), mai materiale Koin: le regole del media kit non permettono illustrazioni come copertina o sfondo di
 * interfaccia. Niente bianco né nero pieni, niente animazioni. Componente server senza stato, usato dalla pagina della
 * guida, dagli elenchi e dal modulo di scrittura (anteprima e scelta della copertina).
 */

const svg = (body: string, w: number, h: number) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;

/** Due carte disegnate a tratto, a destra: il motivo comune a tutte le copertine. */
const cards = (stroke: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 140' preserveAspectRatio='xMaxYMid meet'><g fill='none' stroke='${stroke}' stroke-width='2' stroke-opacity='.45'><rect x='214' y='22' width='62' height='88' rx='8' transform='rotate(-8 245 66)'/><rect x='244' y='26' width='62' height='88' rx='8' transform='rotate(9 275 70)'/><circle cx='275' cy='52' r='9' transform='rotate(9 275 70)'/></g></svg>`,
  )}")`;

type Preset = { glow: string; glowAt: string; pattern: string; patternSize: string; stroke: string; base: string };

const PRESETS: Record<GuideCoverPreset, Preset> = {
  mint: {
    glow: "rgba(49,227,189,.55)",
    glowAt: "0% 0%",
    pattern: svg("<circle cx='2' cy='2' r='1.4' fill='#31e3bd' fill-opacity='.35'/>", 22, 22),
    patternSize: "22px 22px",
    stroke: "#31e3bd",
    base: "linear-gradient(135deg, #182238 0%, #150c2c 100%)",
  },
  sky: {
    glow: "rgba(63,196,232,.55)",
    glowAt: "100% 0%",
    pattern: svg("<path d='M28 0H0v28' fill='none' stroke='#3fc4e8' stroke-opacity='.22'/>", 28, 28),
    patternSize: "28px 28px",
    stroke: "#3fc4e8",
    base: "linear-gradient(160deg, #22304b 0%, #121a2c 100%)",
  },
  gold: {
    glow: "rgba(242,210,60,.42)",
    glowAt: "0% 100%",
    pattern: svg("<path d='M0 16L16 0' stroke='#f2d23c' stroke-opacity='.25' stroke-width='1.5'/>", 16, 16),
    patternSize: "16px 16px",
    stroke: "#f2d23c",
    base: "linear-gradient(135deg, #21143c 0%, #121a2c 100%)",
  },
  crimson: {
    glow: "rgba(200,30,122,.55)",
    glowAt: "0% 0%",
    pattern: svg("<path d='M0 8q10-8 20 0t20 0' fill='none' stroke='#ff3d9a' stroke-opacity='.3' stroke-width='1.5'/>", 40, 16),
    patternSize: "40px 16px",
    stroke: "#ff3d9a",
    base: "linear-gradient(135deg, #21143c 0%, #0e071f 100%)",
  },
  aurora: {
    glow: "rgba(63,196,232,.4)",
    glowAt: "50% 0%",
    pattern: "linear-gradient(115deg, rgba(49,227,189,.35) 0%, rgba(63,196,232,.18) 45%, rgba(200,30,122,.35) 100%)",
    patternSize: "100% 100%",
    stroke: "#bff5e8",
    base: "linear-gradient(135deg, #150c2c 0%, #182238 100%)",
  },
  night: {
    glow: "rgba(63,196,232,.25)",
    glowAt: "100% 100%",
    pattern: svg(
      "<circle cx='8' cy='12' r='1' fill='#c8d1dd' fill-opacity='.5'/><circle cx='38' cy='6' r='.8' fill='#c8d1dd' fill-opacity='.4'/><circle cx='50' cy='40' r='1.2' fill='#3fc4e8' fill-opacity='.5'/><circle cx='20' cy='48' r='.7' fill='#c8d1dd' fill-opacity='.4'/>",
      60,
      60,
    ),
    patternSize: "60px 60px",
    stroke: "#8e9bb1",
    base: "linear-gradient(180deg, #121a2c 0%, #0e071f 100%)",
  },
};

/** Lo stile di fondo di una copertina (esportato per le miniature del modulo). */
export function coverStyle(preset: GuideCoverPreset): CSSProperties {
  const p = PRESETS[preset] ?? PRESETS.mint;
  return {
    backgroundImage: [cards(p.stroke), `radial-gradient(120% 110% at ${p.glowAt}, ${p.glow} 0%, transparent 62%)`, p.pattern, p.base].join(", "),
    backgroundSize: ["auto 100%", "100% 100%", p.patternSize, "100% 100%"].join(", "),
    backgroundPosition: ["right center", "0 0", "0 0", "0 0"].join(", "),
    backgroundRepeat: ["no-repeat", "no-repeat", "repeat", "no-repeat"].join(", "),
  };
}

/**
 * La copertina: `label` (la categoria) in una pastiglia in basso a sinistra; `className` decide misura e proporzioni
 * (16:7 nella pagina, 16:9 negli elenchi). Decorativa: il titolo sta nell'H1 o nella scheda, qui niente testo da leggere
 * oltre la categoria.
 */
export function GuideCover({ preset, label, className = "aspect-[16/7]", framed = true }: { preset: GuideCoverPreset; label?: string; className?: string; framed?: boolean }) {
  // `framed`: cornice celeste da 3 px e angoli tondi (pagina della guida); senza, la cornice la dà la scheda che la contiene
  const frame = framed ? "rounded-xl border-[3px] border-sky" : "border-b-[3px] border-sky";
  return (
    <div className={`relative w-full overflow-hidden ${frame} ${className}`} style={coverStyle(preset)} aria-hidden={label ? undefined : true}>
      {label ? <span className="absolute bottom-3 left-3 stat-pill bg-night/90 text-[11px] font-semibold uppercase text-mint">{label}</span> : null}
    </div>
  );
}
