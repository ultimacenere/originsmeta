"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/** Un mazzo torneo pronto per l'elenco, già nella lingua della pagina (lo prepara /decks/tournament sul server). */
export type ExplorerDeckSet = {
  slug: string;
  href: string;
  name: string;
  author: string;
  badge?: { label: string; className: string };
  created: string;
  createdLabel: string;
  patch?: string;
  summary: string;
  rating: { avg: number; votes: number };
  /** voto pesato sul numero di voti, per "Più votati" (lo stesso di /decks) */
  score: number;
  decks: { letter: string; name: string; archetype: string; legendary: { slug: string; name: string; thumb?: string; href?: string } }[];
};

export type DeckSetExplorerLabels = {
  filterLegendary: string;
  all: string;
  sortBy: string;
  sortNewest: string;
  sortRated: string;
  results: string;
  noResults: string;
  by: string;
  votesOne: string;
  votesMany: string;
  noVotes: string;
  patch: string;
  legendary: string;
};

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (Object.hasOwn(v, k) ? v[k] : m));

/**
 * Elenco dei mazzi torneo con il filtro per Leggendaria (un trio la contiene in uno dei tre mazzi) e l'ordine. I trii
 * sono già tutti nell'HTML: i filtri lavorano nel browser, senza richieste.
 */
export function DeckSetExplorer({ sets, legendaries, labels }: { sets: ExplorerDeckSet[]; legendaries: [string, string][]; labels: DeckSetExplorerLabels }) {
  const [legendary, setLegendary] = useState("");
  const [sort, setSort] = useState<"newest" | "rated">("newest");
  const shown = useMemo(() => {
    const list = sets.filter((s) => !legendary || s.decks.some((d) => d.legendary.slug === legendary));
    return sort === "rated" ? [...list].sort((a, b) => b.score - a.score || b.created.localeCompare(a.created)) : list;
  }, [sets, legendary, sort]);
  const field = "rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale";
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="kicker text-pale-muted">{labels.filterLegendary}</span>
          <select value={legendary} onChange={(e) => setLegendary(e.target.value)} className={`mt-1 block ${field}`}>
            <option value="">{labels.all}</option>
            {legendaries.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="kicker text-pale-muted">{labels.sortBy}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value === "rated" ? "rated" : "newest")} className={`mt-1 block ${field}`}>
            <option value="newest">{labels.sortNewest}</option>
            <option value="rated">{labels.sortRated}</option>
          </select>
        </label>
        <p className="pb-2 font-mono text-xs text-pale-muted" aria-live="polite">
          {fill(labels.results, { n: String(shown.length) })}
        </p>
      </div>
      {shown.length ? (
        <ul className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((s) => (
            <li key={s.slug} className="card-night card-night-hover flex min-w-0 flex-col p-5">
              <div className="flex items-start gap-1.5">
                {s.decks.map((d) =>
                  d.legendary.thumb ? (
                    // carta intera rimpicciolita, senza ritagli: i crediti impressi restano
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={d.letter} src={d.legendary.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" className="h-[84px] w-auto shrink-0 rounded" />
                  ) : (
                    <span key={d.letter} className="flex h-[84px] w-[58px] shrink-0 items-center justify-center rounded border-2 border-dashed border-gold text-gold" aria-hidden="true">
                      ★
                    </span>
                  ),
                )}
              </div>
              <Link href={s.href} className="t-item mt-3 block break-words leading-tight hover:text-mint">
                {s.name}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-pale-muted">
                <span>{fill(labels.by, { name: s.author })}</span>
                {s.badge ? <span className={`stat-pill px-1.5 py-0 text-[10px] font-extrabold uppercase ${s.badge.className}`}>{s.badge.label}</span> : null}
                <span>· {s.createdLabel}</span>
                {s.patch ? (
                  <span>
                    · {labels.patch} {s.patch}
                  </span>
                ) : null}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pale">
                {s.decks.map((d) => (
                  <li key={d.letter} className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-xs text-sky">{d.letter}</span>
                    <span className="text-gold">
                      <span aria-hidden="true">★ </span>
                      {d.legendary.name}
                      <span className="sr-only"> ({labels.legendary})</span>
                    </span>
                    <span className="min-w-0 truncate text-pale-muted">
                      · {d.name} · {d.archetype}
                    </span>
                  </li>
                ))}
              </ul>
              {s.summary ? <p className="mt-3 line-clamp-3 text-sm text-pale-muted">{s.summary}</p> : null}
              <p className="mt-auto pt-3 font-mono text-xs text-pale">
                <span className="text-gold" aria-hidden="true">
                  ★
                </span>{" "}
                {s.rating.votes ? `${s.rating.avg.toFixed(1)} · ${s.rating.votes === 1 ? labels.votesOne : fill(labels.votesMany, { n: String(s.rating.votes) })}` : labels.noVotes}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-pale-muted">{labels.noResults}</p>
      )}
    </div>
  );
}
