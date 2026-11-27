import type { AnalyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";

/*
  Le sezioni del Tracker 2.0 in Analytics (27/11/2026): dove andranno i dati che il registro della partita della 0.9 scrive e
  che oggi restano sul PC. Nessun numero: i riquadri sono vuoti finché i dati non arrivano al sito (servono la 0.9, il
  Tracker 2.0 e una migrazione col sì di Pierluigi). Lo stato di ogni dato viene dall'analisi del 26/11.
*/

export type Slot = { title: string; text: string; status: "certain" | "koin"; shape: "line" | "bars" | "grid" | "split" };

export function V2Note({ labels }: { labels: AnalyticsSectionsLabels["v2"] }) {
  return (
    <p className="mt-1 inline-block rounded-lg border-2 border-dashed border-gold/60 px-3 py-2 text-sm text-pale">
      <b className="text-gold">{labels.soon}</b> {labels.soonText}
    </p>
  );
}

export function V2Slots({ slots, labels }: { slots: Slot[]; labels: AnalyticsSectionsLabels["v2"] }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {slots.map((s) => (
        <li key={s.title} className="sez-panel flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-chalk">{s.title}</h2>
            <span className={`rounded-full border-2 px-2 py-0.5 text-xs ${s.status === "certain" ? "border-good/60 text-good" : "border-gold/60 text-gold"}`}>
              {s.status === "certain" ? labels.certain : labels.koin}
            </span>
          </div>
          <p className="text-pale">{s.text}</p>
          <Ghost shape={s.shape} />
        </li>
      ))}
    </ul>
  );
}

/** Il disegno vuoto del grafico che arriverà: tratteggiato, senza valori. */
function Ghost({ shape }: { shape: Slot["shape"] }) {
  const stroke = "rgba(242,210,60,.45)";
  return (
    <svg viewBox="0 0 300 90" className="h-24 w-full" aria-hidden="true">
      <rect x="1" y="1" width="298" height="88" rx="10" fill="none" stroke={stroke} strokeDasharray="5 5" />
      {shape === "line" ? <polyline points="16,70 70,60 124,48 178,40 232,26 284,20" fill="none" stroke={stroke} strokeWidth="3" strokeDasharray="6 6" /> : null}
      {shape === "bars" ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={20 + i * 34} y={70 - ((i * 13) % 50) - 8} width="20" height={((i * 13) % 50) + 8} rx="3" fill="none" stroke={stroke} strokeDasharray="4 4" />) : null}
      {shape === "grid"
        ? [0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4, 5].map((c) => <rect key={`${r}-${c}`} x={18 + c * 45} y={12 + r * 24} width="38" height="18" rx="3" fill="none" stroke={stroke} strokeDasharray="4 4" />))
        : null}
      {shape === "split" ? (
        <>
          <rect x="20" y="30" width="125" height="30" rx="8" fill="none" stroke={stroke} strokeDasharray="5 5" />
          <rect x="155" y="30" width="125" height="30" rx="8" fill="none" stroke={stroke} strokeDasharray="5 5" />
        </>
      ) : null}
    </svg>
  );
}
