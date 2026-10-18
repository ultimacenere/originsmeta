/**
 * Lucchetto accanto a una voce di menu in prova riservata (18/10/2026, il Mercato: Pierluigi, "mettiamo nel menu la voce
 * Mercato ma chiusa con un lucchetto, solo io e Davdas possiamo vederla"). SVG nostro, colore del testo; il lettore di
 * schermo legge la parola ("riservato").
 */
export function LockMark({ label }: { label: string }) {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1.5 inline-block h-3 w-3 align-[-1px] opacity-80" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" stroke="none" />
        <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" strokeLinecap="round" />
      </svg>
      <span className="sr-only"> ({label})</span>
    </>
  );
}
