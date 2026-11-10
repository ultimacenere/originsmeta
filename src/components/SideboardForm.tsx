"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSideboard } from "@/lib/tournament/actions";
import { fill } from "@/lib/tournament/types";
import type { FormatLabels } from "@/lib/tournament/formatLabels";

export type PoolCard = { slug: string; name: string };

/**
 * Sideboard di un torneo (09/11/2026, opzione `sideboard` del blocco SVIZZERA, GIRONI E SIDEBOARD): fino a `max` carte
 * base che non sono nei mazzi consegnati, scelte cercandole per nome. La Server Action `submitSideboard` la ricontrolla
 * contro il database carte, la RPC contro i mazzi.
 */
export function SideboardForm({ tournamentId, max, initial, pool, inDecks, labels, errors, hasDecks }: { tournamentId: string; max: number; initial: string[]; pool: PoolCard[]; inDecks: string[]; labels: FormatLabels; errors: Record<string, string>; hasDecks: boolean }) {
  const fl = labels;
  const router = useRouter();
  const [side, setSide] = useState<string[]>(initial);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const nameOf = useMemo(() => new Map(pool.map((c) => [c.slug, c.name])), [pool]);
  const blocked = useMemo(() => new Set(inDecks), [inDecks]);
  const q = query.trim().toLowerCase();
  const found = q ? pool.filter((c) => !blocked.has(c.slug) && !side.includes(c.slug) && c.name.toLowerCase().includes(q)).slice(0, 8) : [];

  if (!hasDecks) return <p className="text-sm text-gold">{fl.sideFormFirst}</p>;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-pale-muted">{fl.sideFormHint}</p>
      <p className="font-mono text-xs text-pale">{fill(fl.sideFormCount, { n: side.length, total: max })}</p>
      {side.length ? (
        <ul className="flex flex-wrap gap-2">
          {side.map((s) => (
            <li key={s} className="flex items-center gap-2 rounded-lg border-2 border-sky bg-night-2/70 px-2 py-1 text-sm text-pale">
              {nameOf.get(s) ?? s}
              <button
                type="button"
                onClick={() => {
                  setSaved(false);
                  setSide(side.filter((x) => x !== s));
                }}
                className="btn btn-ghost !px-1.5 !py-0 text-[11px]"
                aria-label={`${fl.sideRemove} ${nameOf.get(s) ?? s}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {side.length < max ? (
        <label className="block text-sm">
          <span className="kicker text-mint">{fl.sideFormSearch}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={40} autoComplete="off" className="mt-1 block w-full max-w-sm rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale focus:border-mint" />
        </label>
      ) : null}
      {found.length ? (
        <ul className="flex flex-wrap gap-2">
          {found.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => {
                  setSaved(false);
                  setSide([...side, c.slug].slice(0, max));
                  setQuery("");
                }}
                className="btn btn-ink text-xs"
              >
                + {c.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="alert-bad">
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p role="status" className="alert-good">
          {fl.sideFormSaved}
        </p>
      ) : null}
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await submitSideboard(tournamentId, side);
              if (r.error) {
                setError(errors[r.error] ?? errors.db ?? r.error);
                return;
              }
              setSaved(true);
              router.refresh();
            })
          }
          className="btn btn-primary text-xs"
        >
          {fl.sideFormSave}
        </button>
      </div>
    </div>
  );
}
