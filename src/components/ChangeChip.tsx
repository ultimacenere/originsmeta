import type { ChangeKind } from "@/lib/data/cards";

const styles: Record<ChangeKind, string> = {
  buff: "bg-felt text-chalk",
  nerf: "bg-crimson text-ivory",
  rework: "bg-gold text-ink",
  deck: "bg-ivory-3 text-ink",
};

export function ChangeChip({ kind, label }: { kind: ChangeKind; label: string }) {
  return <span className={`stat-pill font-semibold uppercase tracking-wider ${styles[kind]}`}>{label}</span>;
}

export function StatDelta({ from, to }: { from?: { mana?: number; power?: number; health?: number }; to?: { mana?: number; power?: number; health?: number } }) {
  if (!from || !to) return null;
  const fmt = (s: { mana?: number; power?: number; health?: number }) =>
    s.power === undefined ? `${s.mana ?? "?"}` : `${s.mana ?? "?"} · ${s.power}/${s.health}`;
  return (
    <span className="font-mono text-sm tabular">
      <span className="text-ink-muted line-through decoration-crimson/70">{fmt(from)}</span>
      <span className="mx-1.5 text-ink-muted">→</span>
      <span className="font-semibold">{fmt(to)}</span>
    </span>
  );
}
