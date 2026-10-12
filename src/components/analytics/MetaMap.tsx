import { metaMapLayout, type MapPoint } from "@/lib/tracker/snapshot";

/**
 * La mappa del meta (12/10/2026): quota di gioco in orizzontale, win rate in verticale, una Leggendaria per punto (tondo
 * verde sopra il 50%, rombo rosso sotto: il colore non è mai l'unica informazione). SVG disegnato sul server tre volte,
 * stretto (telefono), medio e largo, e il CSS mostra quello giusto: così i testi restano leggibili senza JavaScript. I numeri
 * stanno anche nella tabella sotto la mappa.
 */
export function MetaMap({
  points,
  titles,
  labels,
}: {
  points: MapPoint[];
  /** testo del <title> di ogni punto, per chiave */
  titles: Record<string, string>;
  labels: { aria: string; axis: string; unit: string; quadrants: readonly [string, string, string, string]; quadrantsShort: readonly [string, string, string, string] };
}) {
  const draw = (W: number, size: "narrow" | "mid" | "wide") => {
    const narrow = size === "narrow";
    const L = metaMapLayout(points, { W, narrow, quadrants: narrow ? labels.quadrantsShort : labels.quadrants });
    const { l, t, w, h } = L.box;
    return (
      <svg className={`an-map is-${size}`} viewBox={`0 0 ${L.W} ${L.H}`} role="img" aria-label={labels.aria}>
        {/* zone "forti e giocate" e "poco giocate, in difficoltà" appena tinte */}
        <rect x={L.avgX} y={t} width={Math.max(0, l + w - L.avgX)} height={Math.max(0, L.midY - t)} className="an-map-zone-up" />
        <rect x={l} y={L.midY} width={Math.max(0, L.avgX - l)} height={Math.max(0, t + h - L.midY)} className="an-map-zone-down" />
        {L.yTicks.map((tk) => (
          <g key={`y${tk.v}`}>
            <line x1={l} x2={l + w} y1={tk.y} y2={tk.y} className="an-map-grid" />
            <text x={l - 6} y={tk.y + 4} textAnchor="end" className="an-map-tick">
              {tk.v}{labels.unit}
            </text>
          </g>
        ))}
        {L.xTicks.map((tk) => (
          <text key={`x${tk.v}`} x={tk.x} y={t + h + 16} textAnchor="middle" className="an-map-tick">
            {tk.v}{labels.unit}
          </text>
        ))}
        <line x1={l} x2={l + w} y1={L.midY} y2={L.midY} className="an-map-mid" />
        <line x1={L.avgX} x2={L.avgX} y1={t} y2={t + h} className="an-map-avg" />
        <text x={l + w} y={t + h + 32} textAnchor="end" className="an-map-axis">
          {labels.axis}
        </text>
        {L.quadrants.map((q, i) => (
          <text key={i} x={q.x} y={q.y} textAnchor={q.anchor} className={q.good ? "an-map-q is-up" : "an-map-q is-down"}>
            {q.text}
          </text>
        ))}
        {L.dots.map((d) => (
          <g key={d.key}>
            <title>{titles[d.key]}</title>
            {d.dir === "down" ? (
              <rect x={d.x - 5} y={d.y - 5} width={10} height={10} transform={`rotate(45 ${d.x} ${d.y})`} className="an-map-dot is-down" />
            ) : (
              <circle cx={d.x} cy={d.y} r={6} className={`an-map-dot is-${d.dir}`} />
            )}
          </g>
        ))}
        {L.labels.map((lb) => (
          <text key={lb.key} x={lb.x} y={lb.y} textAnchor={lb.anchor} className="an-map-label">
            {lb.text}
          </text>
        ))}
      </svg>
    );
  };
  return (
    <>
      {draw(340, "narrow")}
      {draw(640, "mid")}
      {draw(1000, "wide")}
    </>
  );
}
