/**
 * Simbolini degli archetipi (12/10/2026, design "Meta Snapshot v2.0" di /analytics): l'UNICO punto con icona e colore
 * d'accento di ogni archetipo. Le icone sono PNG trasparenti disegnati da Pierluigi, convertiti in WebP da 96 px con
 * `node scripts/archetype-icons.mjs` (public/media/archetypes/<id>.webp); si mostrano fra 16 e 40 px.
 *
 * Colori (nota "winrate 2.0" di Pierluigi: aggro rosso, control verde, tempo blu; gli altri presi dalle icone):
 * contrasto ≥ 4,5:1 come testo su night, night-2, night-3 e felt (lo controlla `archetypeIcons.test.ts`).
 *
 * "tempo" ha icona e colore (il blu) ma non è ancora un archetipo del sito: per mostrarlo servono anche il modulo di
 * pubblicazione, la regola che suggerisce l'archetipo (archetype.ts) e le etichette di `archetypeLabels` (decks.ts).
 *
 * Il modulo non importa dati: lo usano anche i client component (DeckExplorer). L'etichetta resta in `archetypeLabels`.
 */
export type ArchetypeIcon = { src: string; color: string };

export const ARCHETYPE_ICONS = {
  aggro: { src: "/media/archetypes/aggro.webp", color: "#ff6a55" },
  control: { src: "/media/archetypes/control.webp", color: "#4cd97b" },
  midrange: { src: "/media/archetypes/midrange.webp", color: "#f2b84b" },
  discard: { src: "/media/archetypes/discard.webp", color: "#b48cff" },
  swarm: { src: "/media/archetypes/swarm.webp", color: "#e2a368" },
  evil: { src: "/media/archetypes/evil.webp", color: "#8fd3ff" },
  combo: { src: "/media/archetypes/combo.webp", color: "#ff7ac8" },
  /* non ancora nei dati del sito (vedi sopra) */
  tempo: { src: "/media/archetypes/tempo.webp", color: "#5aa2ff" },
} as const satisfies Record<string, ArchetypeIcon>;

/** Icona e colore di un archetipo, o null per un archetipo che il sito non conosce. */
export function archetypeIcon(id: string): ArchetypeIcon | null {
  return Object.hasOwn(ARCHETYPE_ICONS, id) ? ARCHETYPE_ICONS[id as keyof typeof ARCHETYPE_ICONS] : null;
}

/** Rapporto di contrasto WCAG fra due colori #rrggbb (per il test dei colori d'accento). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
