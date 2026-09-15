"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { badgePill, badgeStyle } from "@/lib/cardArt";

export type ExplorerDeck = {
  slug: string;
  name: string;
  href: string;
  tagline: string;
  legendary?: { slug: string; name: string };
  archetype: string;
  archetypeLabel: string;
  creator: string;
  source: string;
  sourceLabel: string;
  cardNames: string[];
  updated: string;
  /** media e numero dei voti (solo mazzi della community) */
  rating?: { avg: number; votes: number };
  /** tipo di mazzo e tag autore (solo mazzi della community) */
  deckTypeLabels?: string[];
  creatorBadge?: string;
  /** id del tag autore (community, influencer, pro, staff); "community" non si mostra */
  creatorBadgeId?: string;
};

type Labels = {
  legendary: string;
  archetype: string;
  creator: string;
  card: string;
  all: string;
  results: string;
  noResults: string;
  cardsInDeck: string;
  votes: string;
  vote: string;
};

export function DeckExplorer({ decks, labels }: { decks: ExplorerDeck[]; labels: Labels }) {
  const [legendary, setLegendary] = useState("all");
  const [archetype, setArchetype] = useState("all");
  const [creator, setCreator] = useState("all");
  const [card, setCard] = useState("");

  const legendaries = useMemo(() => Array.from(new Map(decks.filter((d) => d.legendary).map((d) => [d.legendary!.slug, d.legendary!.name])).entries()), [decks]);
  const archetypes = useMemo(() => Array.from(new Map(decks.map((d) => [d.archetype, d.archetypeLabel])).entries()), [decks]);
  const creators = useMemo(() => Array.from(new Set(decks.map((d) => d.creator))), [decks]);

  const list = useMemo(() => {
    const needle = card.trim().toLowerCase();
    return decks.filter((d) => {
      if (legendary !== "all" && d.legendary?.slug !== legendary) return false;
      if (archetype !== "all" && d.archetype !== archetype) return false;
      if (creator !== "all" && d.creator !== creator) return false;
      if (needle && !d.cardNames.some((c) => c.toLowerCase().includes(needle)) && !d.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [decks, legendary, archetype, creator, card]);

  const selectCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-mint";

  return (
    <div>
      <div className="felt-panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.legendary}</span>
          <select id="deck-legendary" value={legendary} onChange={(e) => setLegendary(e.target.value)} className={selectCls}>
            <option value="all">{labels.all}</option>
            {legendaries.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.archetype}</span>
          <select id="deck-archetype" value={archetype} onChange={(e) => setArchetype(e.target.value)} className={selectCls}>
            <option value="all">{labels.all}</option>
            {archetypes.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.creator}</span>
          <select id="deck-creator" value={creator} onChange={(e) => setCreator(e.target.value)} className={selectCls}>
            <option value="all">{labels.all}</option>
            {creators.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.card}</span>
          <input id="deck-card" type="search" value={card} onChange={(e) => setCard(e.target.value)} placeholder="Merlin…" className={selectCls} />
        </label>
      </div>

      <p className="kicker mb-4 text-chalk-muted">
        {list.length} {labels.results}
      </p>

      {list.length === 0 ? (
        <p className="card-night p-6 text-pale-muted">{labels.noResults}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => (
            <li key={d.slug}>
              <Link href={d.href} className="card-night card-night-hover flex h-full flex-col p-5">
                <span className="flex flex-wrap items-center gap-2">
                  {d.creatorBadgeId && d.creatorBadgeId !== "community" && d.creatorBadge ? (
                    <span className={`${badgePill} ${badgeStyle[d.creatorBadgeId] ?? badgeStyle.community}`}>{d.creatorBadge}</span>
                  ) : null}
                  {d.source === "community" && d.creatorBadgeId === "staff" ? null : (
                    <span className={`stat-pill text-[11px] font-semibold uppercase ${d.source === "community" ? "bg-mint-deep text-chalk" : "bg-night-3 text-chalk"}`}>{d.sourceLabel}</span>
                  )}
                  <span className="stat-pill border border-sky text-pale">{d.archetypeLabel}</span>
                  {d.deckTypeLabels?.map((t) => (
                    <span key={t} className="stat-pill bg-night-3 text-pale text-[11px]">
                      {t}
                    </span>
                  ))}
                  {d.legendary ? <span className="stat-pill bg-gold/50 text-pale">★ {d.legendary.name}</span> : null}
                  {d.rating && d.rating.votes > 0 ? (
                    <span className="stat-pill border border-mint-deep/40 font-mono text-[11px] text-mint">
                      ★ {d.rating.avg.toFixed(1)} · {d.rating.votes} {d.rating.votes === 1 ? labels.vote : labels.votes}
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 block font-display text-2xl font-extrabold leading-tight text-sky">{d.name}</span>
                <span className="mt-1 block text-sm text-pale-muted">{d.tagline}</span>
                <span className="mt-3 block text-xs text-pale-muted">
                  {labels.creator}: <strong className="text-pale">{d.creator}</strong>
                </span>
                <span className="mt-3 block border-t border-sky pt-3 text-xs text-pale-muted">
                  <span className="kicker">{labels.cardsInDeck}</span>
                  <span className="mt-1 block text-pale">{d.cardNames.join(" · ")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
