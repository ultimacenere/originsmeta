import { changePct } from "@/lib/market/market";

/**
 * Variazione di prezzo (tracker dei prezzi, 17/10/2026): freccia, segno e percentuale, mai il solo colore. Dal 28/11/2026
 * (scheda che racconta) celeste se sale e rosa se scende, grigio se fermo: la coppia si distingue anche senza vedere
 * rosso e verde (ricerca sui tracker: Bloomberg, Datawrapper, Binance). Senza un prezzo di prima un trattino.
 */
export function Change({ now, before, locale, className = "" }: { now: number | null; before: number | null; locale: string; className?: string }) {
  const pct = changePct(now, before);
  if (pct === null) return <span className={`text-pale-muted ${className}`}>—</span>;
  const flat = Math.abs(pct) < 0.05;
  const text = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: flat ? "never" : "always" }).format(pct / 100);
  const tone = flat ? "text-pale-muted" : pct > 0 ? "text-sky" : "text-pink";
  return (
    <span className={`font-mono tabular-nums ${tone} ${className}`}>
      <span aria-hidden="true">{flat ? "＝" : pct > 0 ? "▲" : "▼"} </span>
      {text}
    </span>
  );
}
