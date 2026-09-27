import type { AchievementIcon as Icon } from "@/lib/community/achievements";

/**
 * I disegni delle medaglie dei traguardi (pacchetto TRAGUARDI, 27/09/2026): SVG in linea, a tratto, nel colore del
 * testo (`currentColor`), su una griglia di 24. Disegnati per il sito, con forme semplici (bandiera, carte, libro,
 * stella, calendario, fasce, spade, tabellone, coppa): niente emoji né icone di Koin Games. `mark` è il numero scritto
 * sulle carte dei traguardi dei mazzi (1, 5, 10).
 */
const PATHS: Record<Icon, string[]> = {
  // bandiera piantata: "c'ero dalla Demo 2.0"
  flag: ["M6 21V4", "M6 4h11l-2.5 4 2.5 4H6"],
  // due carte, quella davanti con il numero
  cards: ["M5 7.5v11.5a2 2 0 0 0 2 2h8", "M9 3h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"],
  // libro aperto
  book: ["M12 6.5C10 5 7 4.5 4 5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z", "M12 6.5v14"],
  // stella a cinque punte
  star: ["M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"],
  // calendario con una stella
  calendar: ["M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M3 10h18", "M8 3v4", "M16 3v4", "M12 12.5l1.2 2.3 2.5.4-1.8 1.7.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.7 2.5-.4z"],
  // le fasce di una tier list, dalla più lunga alla più corta
  tiers: ["M4 6h16", "M4 12h11", "M4 18h6"],
  // due spade incrociate
  swords: ["M4 4l11 11", "M4 4h3.5L17 13.5", "M13 17l4-4", "M15.5 15.5l4 4", "M20 4L9 15", "M20 4h-3.5L7 13.5", "M11 17l-4-4", "M8.5 15.5l-4 4"],
  // un tabellone a eliminazione diretta
  bracket: ["M3 5h5v6h5", "M3 17h5v-6", "M13 11h3", "M16 6h5", "M16 16h5", "M16 6v10"],
  // coppa del torneo vinto
  trophy: ["M8 4h8v6a4 4 0 0 1-8 0z", "M8 6H5.5a2.5 2.5 0 0 0 2.6 3.9", "M16 6h2.5a2.5 2.5 0 0 1-2.6 3.9", "M12 14v4", "M8 21h8", "M9.5 18h5v3h-5z"],
};

export function AchievementIcon({ icon, mark, className }: { icon: Icon; mark?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {PATHS[icon].map((d) => (
        <path key={d} d={d} />
      ))}
      {mark ? (
        <text x="13.5" y="14.5" textAnchor="middle" fontSize={mark.length > 1 ? 6.5 : 8} fontWeight={700} fill="currentColor" stroke="none" fontFamily="var(--font-mono, monospace)">
          {mark}
        </text>
      ) : null}
    </svg>
  );
}
