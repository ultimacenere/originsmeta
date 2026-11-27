"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";
import type { Locale } from "@/lib/i18n";
import { fmtInt, pct } from "@/lib/tracker/snapshot";
import { encodeGameCode, encodeOmCode } from "@/lib/deckcode";
import { trackEvent } from "@/lib/analytics";
import { WrBar, fill } from "@/components/analytics/sections/parts";
import type { AnalyticsDecksCardsLabels } from "@/lib/analyticsDecksCardsLabels";
import type { AnalyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import "./decks.css";

/*
  Mazzi migliori da copiare (/analytics/decks, Analytics a sezioni del 27/11/2026). `DeckTop`: i primi tre in evidenza,
  con la Leggendaria come carta del gioco e le 12 carte in miniatura leggibili (4 per riga sul telefono). `DeckList`: tutte
  le altre liste, compatte, con le carte come nomi e gemma del mana; filtro per Leggendaria. Il codice del gioco si calcola
  al clic (la pagina resta leggera); deck builder con il formato OM1 nell'hash.
*/

export type DeckThumb = { slug: string; name: string; thumb: string | null; mana: number | null };
export type DeckLeg = { slug: string; name: string; art: string | null; input: GameCardInput };
export type DeckRow = {
  id: string;
  legendary: string;
  cards: string[];
  games: number;
  wins: number;
  r: number;
  lo: number;
  hi: number;
  name: string;
  published: { slug: string; name: string; author: string | null } | null;
  /** chiavi del gioco della Leggendaria e delle 12 carte: il codice si calcola al clic */
  keys: string[] | null;
};

/** Testi e indirizzi che servono nel browser (le funzioni di i18n restano sul server). */
export type DeckListText = {
  locale: Locale;
  L: AnalyticsDecksCardsLabels["decks"];
  C: Pick<AnalyticsSectionsLabels["common"], "games" | "gamesOne" | "copyCode" | "copied" | "openBuilder">;
  /** /<lingua>/cards, /<lingua>/decks/community, /<lingua>/deck-builder */
  cardsBase: string;
  decksBase: string;
  builderBase: string;
};

const PAGE = 12;

function textOf(t: DeckListText) {
  const games = (n: number) => (n === 1 ? t.C.gamesOne : fill(t.C.games, { n: fmtInt(n, t.locale) }));
  const P = (r: number) => pct(r, t.locale, 0);
  return { games, P };
}

function DeckName({ d, t }: { d: DeckRow; t: DeckListText }) {
  return d.published ? (
    <Link href={`${t.decksBase}/${d.published.slug}`} prefetch={false} className="hover:text-mint">
      {d.name}
    </Link>
  ) : (
    <>{d.name}</>
  );
}

function Actions({ d, t }: { d: DeckRow; t: DeckListText }) {
  const builder = `${t.builderBase}#${encodeOmCode({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: [] })}`;
  return (
    <div className="mz-actions">
      {d.keys ? <CopyCodeLazy keys={d.keys} label={t.C.copyCode} done={t.C.copied} /> : null}
      <Link href={builder} prefetch={false} className="btn btn-ghost text-xs">
        {t.C.openBuilder}
      </Link>
    </div>
  );
}

/** I primi tre mazzi in evidenza. */
export function DeckTop({ decks, legs, thumbs, t }: { decks: DeckRow[]; legs: Record<string, DeckLeg>; thumbs: Record<string, DeckThumb>; t: DeckListText }) {
  const { games, P } = textOf(t);
  return (
    <ol className="mz-top">
      {decks.map((d, i) => (
        <li key={d.id} className="an-panel mz-top-item">
          <span className="pen-num mz-top-rank" aria-hidden="true">
            {i + 1}
          </span>
          <div className="mz-top-head">
            <div className="mz-top-leg">{legs[d.legendary] ? <GameCardFace input={legs[d.legendary].input} lang={t.locale} /> : null}</div>
            <div className="min-w-0">
              <p className="mz-name">
                <DeckName d={d} t={t} />
              </p>
              {d.published?.author ? <p className="sez-note">{fill(t.L.by, { author: d.published.author })}</p> : null}
              <div className="an-big-wr">{P(d.r)}</div>
              <p className="sez-note">
                {games(d.games)}
                {d.games < 20 ? ` · ${t.L.thin}` : ""}
              </p>
              <p className="sez-note">{fill(t.L.worst, { lo: P(d.lo) })}</p>
            </div>
          </div>
          <WrBar n={d} locale={t.locale} />
          <ul className="mz-thumbs">
            {d.cards.map((s) => (
              <li key={s}>
                <Link href={`${t.cardsBase}/${s}`} prefetch={false} title={thumbs[s]?.name} className="mz-thumb">
                  {thumbs[s]?.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniatura ufficiale 160 px
                    <img src={thumbs[s].thumb!} alt={thumbs[s].name} loading="lazy" decoding="async" />
                  ) : (
                    <span>{thumbs[s]?.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <Actions d={d} t={t} />
        </li>
      ))}
    </ol>
  );
}

/** Tutte le altre liste, compatte, con il filtro per Leggendaria. Con «Tutte» salta le prime `skip` (già in evidenza). */
export function DeckList({
  decks,
  legs,
  legOrder,
  thumbs,
  skip,
  t,
}: {
  decks: DeckRow[];
  legs: Record<string, DeckLeg>;
  legOrder: string[];
  thumbs: Record<string, DeckThumb>;
  skip: number;
  t: DeckListText;
}) {
  const { games, P } = textOf(t);
  const [leg, setLeg] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => (leg ? decks.filter((d) => d.legendary === leg) : decks.slice(skip)), [decks, leg, skip]);
  const rankOf = useMemo(() => new Map(decks.map((d, i) => [d.id, i + 1])), [decks]);

  return (
    <div>
      <div className="mz-chips" role="group" aria-label={t.L.filter}>
        <button
          type="button"
          className={`mz-chip${leg === null ? " is-on" : ""}`}
          aria-pressed={leg === null}
          onClick={() => {
            setLeg(null);
            setShown(PAGE);
          }}
        >
          {t.L.all}
        </button>
        {legOrder.map((s) => (
          <button
            key={s}
            type="button"
            className={`mz-chip${leg === s ? " is-on" : ""}`}
            aria-pressed={leg === s}
            onClick={() => {
              setLeg(s);
              setShown(PAGE);
            }}
          >
            {legs[s]?.art ? (
              // eslint-disable-next-line @next/next/no-img-element -- ritratto tondo dall'arte della carta
              <img src={legs[s].art!} alt="" className="mz-chip-img" loading="lazy" decoding="async" />
            ) : null}
            {legs[s]?.name}
          </button>
        ))}
      </div>

      {list.length ? (
        <ol className="mz-list">
          {list.slice(0, shown).map((d) => (
            <li key={d.id} className={`mz-row${d.games < 20 ? " is-thin" : ""}`}>
              <div className="mz-row-head">
                <span className="mz-row-rank" aria-hidden="true">
                  {rankOf.get(d.id)}
                </span>
                {legs[d.legendary]?.art ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ritratto tondo dall'arte della Leggendaria
                  <img src={legs[d.legendary].art!} alt="" className="mz-row-img" loading="lazy" decoding="async" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="mz-name is-small">
                    <DeckName d={d} t={t} />
                  </p>
                  {d.published?.author ? <p className="sez-note truncate">{fill(t.L.by, { author: d.published.author })}</p> : null}
                </div>
                <div className="mz-wr">
                  <span className="sez-num text-xl">{P(d.r)}</span>
                  <span className="sez-note">{games(d.games)}</span>
                </div>
              </div>
              <WrBar n={d} locale={t.locale} />
              <ul className="mz-names">
                {d.cards.map((s) => (
                  <li key={s}>
                    <Link href={`${t.cardsBase}/${s}`} prefetch={false} className="mz-cardname">
                      <span className="mz-gem" aria-hidden="true">
                        {thumbs[s]?.mana ?? "–"}
                      </span>
                      <span className="truncate">{thumbs[s]?.name ?? s}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Actions d={d} t={t} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="sez-note mt-5">{t.L.noneLeg}</p>
      )}
      {list.length > shown ? (
        <button type="button" className="btn btn-ghost mt-4 text-sm" onClick={() => setShown((n) => n + PAGE)}>
          {fill(t.L.more, { n: Math.min(PAGE, list.length - shown) })}
        </button>
      ) : null}
    </div>
  );
}

/** Copia del codice del gioco, calcolato al clic dalle chiavi (evento ★ game_code_copy, placement analytics). */
function CopyCodeLazy({ keys, label, done }: { keys: string[]; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary text-xs"
      onClick={async () => {
        const code = await encodeGameCode(keys);
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          trackEvent("game_code_copy", { placement: "analytics" });
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt(label, code);
        }
      }}
    >
      {copied ? done : label}
    </button>
  );
}
