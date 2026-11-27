"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";
import type { Locale } from "@/lib/i18n";
import type { Move, Num } from "@/lib/tracker/sections";
import { fmtDec, fmtInt, pct } from "@/lib/tracker/snapshot";
import { MoveTag, fill } from "@/components/analytics/sections/parts";
import type { AnalyticsDecksCardsLabels } from "@/lib/analyticsDecksCardsLabels";
import type { AnalyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import "./cards.css";

/*
  Carte di Analytics a sezioni (/analytics/cards, 27/11/2026): vista di partenza «Quando si gioca» (carte del gioco divise
  per round medio, al massimo 12 per gruppo) e tabella ordinabile con ricerca e le prime 25 righe; filtro per costo in mana
  come nel gioco.
*/

export type CardRow = {
  slug: string;
  name: string;
  mana: number | null;
  legendary: boolean;
  input: GameCardInput;
  share: number;
  deck: Num;
  played: Num | null;
  turn: number | null;
  shareMove: Move | null;
  wrMove: Move | null;
};

export type CardExplorerText = {
  locale: Locale;
  L: AnalyticsDecksCardsLabels["cards"];
  C: Pick<AnalyticsSectionsLabels["common"], "games" | "gamesOne" | "isNew" | "clearMove" | "unclearMove">;
  /** /<lingua>/cards */
  cardsBase: string;
  /** nome della patch precedente, se c'è */
  prevLabel: string | null;
};

type SortKey = "name" | "mana" | "share" | "deck" | "played" | "turn" | "move";
type Bucket = "early" | "mid" | "late" | "never";
const MANA = [0, 1, 2, 3, 4, 5, 6, 7] as const; // 7 = 7 o più
const PER_BUCKET = 12;
const TABLE_ROWS = 25;
const bucketOf = (t: number | null): Bucket => (t === null ? "never" : t <= 3 ? "early" : t <= 6 ? "mid" : "late");

export function CardExplorer({ rows, t }: { rows: CardRow[]; t: CardExplorerText }) {
  const { L, C, locale } = t;
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const P = (r: number, d = 0) => pct(r, locale, d);
  const dec = (n: number) => fmtDec(n, locale, 1);
  const [view, setView] = useState<"table" | "when">("when");
  const [q, setQ] = useState("");
  const [allRows, setAllRows] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [mana, setMana] = useState<number | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "share", desc: true });

  const filtered = useMemo(() => (mana === null ? rows : rows.filter((r) => (mana === 7 ? (r.mana ?? 0) >= 7 : r.mana === mana))), [rows, mana]);
  const sorted = useMemo(() => {
    const v = (r: CardRow): number | string => {
      switch (sort.key) {
        case "name":
          return r.name;
        case "mana":
          return r.mana ?? -1;
        case "share":
          return r.share;
        case "deck":
          return r.deck.r;
        case "played":
          return r.played?.r ?? -1;
        case "turn":
          return r.turn ?? 99;
        case "move":
          return r.shareMove?.points ?? -999;
      }
    };
    return [...filtered].sort((a, b) => {
      const x = v(a);
      const y = v(b);
      const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return (sort.desc ? -c : c) || b.share - a.share;
    });
  }, [filtered, sort]);
  const needle = q.trim().toLowerCase();
  const tableRows = needle ? sorted.filter((r) => r.name.toLowerCase().includes(needle)) : sorted;
  const visibleRows = allRows || needle ? tableRows : tableRows.slice(0, TABLE_ROWS);

  const th = (key: SortKey, label: string, cls = "") => (
    <th scope="col" className={cls} aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        className="ct-sort"
        aria-label={fill(L.sortBy, { col: label })}
        onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" && key !== "mana" && key !== "turn" }))}
      >
        {label}
        {sort.key === key ? <span aria-hidden="true">{sort.desc ? " ▾" : " ▴"}</span> : null}
      </button>
    </th>
  );

  const buckets: Record<Bucket, { title: string; sub: string }> = {
    early: { title: L.early, sub: L.earlySub },
    mid: { title: L.mid, sub: L.midSub },
    late: { title: L.late, sub: L.lateSub },
    never: { title: L.never, sub: L.neverSub },
  };

  return (
    <div className="mt-4">
      <div className="ct-bar">
        <div className="ct-views" role="group" aria-label={L.views}>
          {(["when", "table"] as const).map((k) => (
            <button key={k} type="button" className={`ct-view${view === k ? " is-on" : ""}`} aria-pressed={view === k} onClick={() => setView(k)}>
              {k === "table" ? L.table : L.when}
            </button>
          ))}
        </div>
        <div className="ct-mana" role="group" aria-label={L.mana}>
          <button type="button" className={`ct-gem is-all${mana === null ? " is-on" : ""}`} aria-pressed={mana === null} onClick={() => setMana(null)}>
            {L.manaAll}
          </button>
          {MANA.map((m) => (
            <button
              key={m}
              type="button"
              className={`ct-gem${mana === m ? " is-on" : ""}`}
              aria-pressed={mana === m}
              aria-label={`${L.cost} ${m === 7 ? "7+" : m}`}
              onClick={() => setMana(mana === m ? null : m)}
            >
              {m === 7 ? "7+" : m}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? <p className="sez-note mt-4">{L.none}</p> : null}

      {view === "table" && filtered.length ? (
        <>
          <label className="ct-search">
            <span className="sr-only">{L.search}</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search} autoComplete="off" />
          </label>
          {!tableRows.length ? <p className="sez-note mt-3">{L.noMatch}</p> : null}
          <div className="ct-table-wrap">
            <table className="ct-table">
              <thead>
                <tr>
                  {th("name", L.card, "ct-name-col")}
                  {th("mana", L.cost, "max-sm:hidden")}
                  {th("share", L.share)}
                  {th("deck", L.deck)}
                  {th("played", L.played, "max-sm:hidden")}
                  {th("turn", L.turn)}
                  {t.prevLabel ? th("move", fill(L.vsPrev, { patch: t.prevLabel }), "max-md:hidden") : null}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.slug} className={r.deck.games < 20 ? "sez-thin" : undefined}>
                    <th scope="row" className="ct-name-col">
                      <Link href={`${t.cardsBase}/${r.slug}`} prefetch={false} className="ct-name">
                        {r.legendary ? (
                          <span className="legendary-star" aria-hidden="true">
                            ★
                          </span>
                        ) : null}
                        {r.name}
                      </Link>
                    </th>
                    <td className="max-sm:hidden">
                      <span className="ct-cost">{r.mana ?? "–"}</span>
                    </td>
                    <td>
                      <span className="sez-num">{P(r.share, 1)}</span>
                      <span className="ct-sub">{games(r.deck.games)}</span>
                    </td>
                    <td>
                      <span className="sez-num">{P(r.deck.r)}</span>
                      <span className="ct-sub">{games(r.deck.games)}</span>
                    </td>
                    <td className="max-sm:hidden">
                      {r.played ? (
                        <>
                          <span className="sez-num">{P(r.played.r)}</span>
                          <span className="ct-sub">{games(r.played.games)}</span>
                        </>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td>
                      <span className="sez-num">{r.turn !== null ? dec(r.turn) : "–"}</span>
                    </td>
                    {t.prevLabel ? (
                      <td className="max-md:hidden">
                        <span className="ct-moves">
                          <span>
                            <span className="sr-only">{L.shareMoveSr}: </span>
                            <MoveTag m={r.shareMove} locale={locale} labels={C} />
                            <span className="ct-sub">{L.shareShort}</span>
                          </span>
                          <span>
                            <span className="sr-only">{L.wrMoveSr}: </span>
                            <MoveTag m={r.wrMove} locale={locale} labels={C} />
                            <span className="ct-sub">{L.winRate}</span>
                          </span>
                        </span>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleRows.length < tableRows.length ? (
            <button type="button" className="btn btn-ghost mt-4 text-sm" onClick={() => setAllRows(true)}>
              {fill(L.showAll, { n: tableRows.length })}
            </button>
          ) : null}
        </>
      ) : null}

      {view === "when" && filtered.length ? (
        <div className="mt-5 flex flex-col gap-8">
          {(["early", "mid", "late", "never"] as const).map((b) => {
            const list = filtered.filter((r) => bucketOf(r.turn) === b).sort((x, y) => y.share - x.share);
            if (!list.length) return null;
            return (
              <section key={b} aria-labelledby={`ct-b-${b}`}>
                <h3 id={`ct-b-${b}`} className="font-display text-lg font-bold text-chalk">
                  {buckets[b].title} <span className="sez-note font-normal">· {buckets[b].sub}</span>
                </h3>
                <ul className="ct-hand">
                  {(open[b] ? list : list.slice(0, PER_BUCKET)).map((r) => (
                    <li key={r.slug} className={r.deck.games < 20 ? "sez-thin" : undefined}>
                      <Link href={`${t.cardsBase}/${r.slug}`} prefetch={false} className="ct-card" aria-label={r.name}>
                        <GameCardFace input={r.input} lang={locale} />
                        {r.turn !== null ? <span className="pen-note ct-turn">{fill(L.round, { t: dec(r.turn) })}</span> : null}
                      </Link>
                      <p className="ct-cap">
                        {fill(L.inDecks, { p: P(r.share) })}
                        <br />
                        <span className="sez-num">{P(r.deck.r)}</span> · {games(r.deck.games)}
                      </p>
                    </li>
                  ))}
                </ul>
                {!open[b] && list.length > PER_BUCKET ? (
                  <button type="button" className="btn btn-ghost mt-4 text-sm" onClick={() => setOpen((o) => ({ ...o, [b]: true }))}>
                    {fill(L.showMore, { n: list.length - PER_BUCKET })}
                  </button>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
