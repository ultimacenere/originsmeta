/*
  Le sezioni del Tracker 2.0 nel prototipo a sezioni (27/11/2026): dove andranno i dati che il registro della partita della
  0.9 scrive e che oggi restano sul PC. Nessun numero: i riquadri sono vuoti finché i dati non arrivano al sito (serve la
  0.9, il Tracker 2.0 e una migrazione col sì di Pierluigi). Lo stato di ogni dato viene dall'analisi del 26/11.
*/

export type Slot = { title: string; text: string; status: "certo" | "koin"; shape: "line" | "bars" | "grid" | "split" };

const STATUS = { certo: "Nel registro della 0.9", koin: "Da confermare con Koin" };

export function V2Intro({ title, lead }: { title: string; lead: string }) {
  return (
    <div>
      <h2 className="sez-h2">{title}</h2>
      <p className="sez-lead">{lead}</p>
      <p className="mt-3 inline-block rounded-lg border-2 border-dashed border-gold/60 px-3 py-2 text-sm text-pale">
        <b className="text-gold">Arriva con la 0.9.</b> Qui non ci sono ancora numeri: il Tracker 2.0 legge questi dati dal registro della partita, ma oggi restano sul PC di chi gioca.
      </p>
    </div>
  );
}

export function V2Slots({ slots }: { slots: Slot[] }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {slots.map((s) => (
        <li key={s.title} className="sez-panel flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-chalk">{s.title}</h3>
            <span className={`rounded-full border-2 px-2 py-0.5 text-xs ${s.status === "certo" ? "border-good/60 text-good" : "border-gold/60 text-gold"}`}>{STATUS[s.status]}</span>
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
