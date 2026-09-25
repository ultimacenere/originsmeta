"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { CardPeek, type PeekCard } from "./CardPeek";
import { tierTone } from "@/lib/tiercode";
import { TIER_ORDER, type Tier } from "@/lib/tierstats";
import type { TierCardEntry } from "@/lib/tierTypes";

/*
  Carte della sezione Tier list (riprogettazione del 24/09/2026, §1 punto 32 della KB). Un solo componente per le
  due viste delle carte, così griglia, filtri, tabella e dettaglio si comportano uguale ovunque:
  - `mode="tiers"`: le fasce S…D con carte tutte uguali (immagine intera, nome sotto), l'etichetta della fascia
    dice anche cosa significa ("S · Definisce il meta"); sul telefono la fascia diventa un'intestazione e le
    carte stanno 4 per riga (prima: una per riga, 16,7 schermate);
  - `mode="usage"`: "Le più giocate", righe con barra (in quanti mazzi pubblicati compare la carta), le prime 20
    e il resto a richiesta, le carte in nessun mazzo in fondo, chiuse.
  Filtri (tipo, costo, allineamento, nome) con il numero di carte accanto a ogni valore: niente combinazioni che
  finiscono a zero senza saperlo (Baymard). Vista tabella per confrontare le fonti (come Grades/Table su 17lands).
  Il clic su una carta apre il dettaglio in un <dialog> nativo (focus, Esc e ritorno del focus li gestisce il
  browser): pannello laterale su desktop, foglio dal basso sul telefono. Il passaggio del mouse apre l'anteprima
  di sempre (`CardPeek`), solo dove il mouse esiste.
  È un componente client ma viene pre-renderizzato sul server: le carte sono nell'HTML (la pagina resta indicizzabile).
  Dal 25/09/2026 (Ondata 1 del piano SEO/GEO, rilievi CARDS-07 e TOOL-02) ogni voce, in griglia, a righe e in
  tabella, è un vero link alla scheda della carta: prima erano bottoni e le pagine meglio posizionate del sito non
  passavano nessun link alle schede. Il clic semplice apre comunque il dettaglio; Ctrl/Cmd, Maiusc e il tasto
  centrale aprono la scheda come ogni link. Le righe oltre le prime 20 di "Le più giocate" stanno nell'HTML, nascoste
  finché non si chiede di vederle, così anche i loro link ci sono.
*/

export type TierExplorerLabels = {
  search: string;
  filters: string;
  type: string;
  unit: string;
  spell: string;
  cost: string;
  alignment: string;
  good: string;
  evil: string;
  neutral: string;
  clear: string;
  cardsOne: string;
  cardsMany: string;
  viewLabel: string;
  viewGrid: string;
  viewTable: string;
  tableCaption: string;
  colCard: string;
  colCost: string;
  colType: string;
  colCommunity: string;
  colDecks: string;
  none: string;
  emptyTier: string;
  close: string;
  communityTier: string;
  average: string;
  votesOne: string;
  votesMany: string;
  distribution: string;
  notRanked: string;
  officialPending: string;
  inDecks: string;
  decksTitle: string;
  noDecks: string;
  moreDecks: string;
  guidesTitle: string;
  cardPage: string;
  legendary: string;
  mana: string;
  power: string;
  health: string;
  showAll: string;
  unused: string;
  unranked: string;
  inDecksOne: string;
  inDecksMany: string;
  tiers: Record<Tier, string>;
};

type Source = "official" | "community" | "played";
type CostBand = "" | "0-2" | "3" | "4" | "5+";
type Filters = { q: string; type: "" | "unit" | "spell"; cost: CostBand; align: "" | "good" | "evil" | "neutral" };
type SortKey = "name" | "mana" | "community" | "used";

const USAGE_LIMIT = 20;
const DECKS_IN_DETAIL = 6;
const TIER_RANK: Record<Tier, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ""));

function matches(e: TierCardEntry, f: Filters): boolean {
  if (f.q && !e.name.toLowerCase().includes(f.q.trim().toLowerCase())) return false;
  if (f.type && (f.type === "spell") !== e.spell) return false;
  const m = e.mana ?? 0;
  if (f.cost === "0-2" && m > 2) return false;
  if ((f.cost === "3" || f.cost === "4") && m !== Number(f.cost)) return false;
  if (f.cost === "5+" && m < 5) return false;
  if (f.align && e.alignment !== f.align) return false;
  return true;
}

/** Dentro la fascia: media più alta, poi più voti, poi costo e nome, come si leggono le carte nel gioco. */
function byCommunity(a: TierCardEntry, b: TierCardEntry): number {
  return (b.community?.avg ?? 0) - (a.community?.avg ?? 0) || (b.community?.votes ?? 0) - (a.community?.votes ?? 0) || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name);
}

function track(name: string, params: Record<string, string>) {
  window.gtag?.("event", name, params);
}

export function TierExplorer({
  id,
  mode,
  source,
  entries,
  deckCount,
  labels: l,
  filters: withFilters = false,
  table: withTable = false,
  official,
  locale,
}: {
  /** lingua della pagina: serve alla virgola dei decimali (4,3 in italiano, 4.3 in inglese) */
  locale: string;
  /** prefisso degli id nella pagina (una pagina ha più esploratori: Leggendarie e carte) */
  id: string;
  /** fasce, "Le più giocate" a righe, o una striscia di anteprima (le carte nell'ordine ricevuto, col numero di mazzi) */
  mode: "tiers" | "usage" | "strip";
  source: Source;
  entries: TierCardEntry[];
  deckCount: number;
  labels: TierExplorerLabels;
  filters?: boolean;
  table?: boolean;
  /** fasce della tier list di OriginsMeta (slug → fascia): quando ci sono, `mode="tiers"` usa queste e non la media della community */
  official?: Record<string, Tier>;
}) {
  const [f, setF] = useState<Filters>({ q: "", type: "", cost: "", align: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: source === "community" ? "community" : "used", dir: -1 });
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const pool = useMemo(() => entries.filter((e) => matches(e, f)), [entries, f]);
  const active = (f.q ? 1 : 0) + (f.type ? 1 : 0) + (f.cost ? 1 : 0) + (f.align ? 1 : 0);
  const countWith = (key: keyof Filters, value: string) => entries.filter((e) => matches(e, { ...f, [key]: value } as Filters)).length;
  const cardsLabel = (n: number) => (n === 1 ? l.cardsOne : fmt(l.cardsMany, { n }));
  const decksLabel = (n: number) => (n === 1 ? l.inDecksOne : fmt(l.inDecksMany, { n }));
  const pct = (n: number) => (deckCount ? Math.round((n / deckCount) * 100) : 0);
  const oneDecimal = (n: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

  // il dettaglio si apre dopo il render che gli dà il contenuto
  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) el.showModal();
  }, [open]);

  const openCard = (slug: string) => {
    setOpen(slug);
    track("tier_entry_open", { tier_source: source, card: slug });
  };
  /**
   * Proprietà di ogni voce: un link alla scheda (`e.href`) che al clic semplice apre il dettaglio nel <dialog>.
   * Con un tasto modificatore o col tasto centrale non si ferma niente: il browser apre la scheda e l'evento GA4
   * `tier_entry_click` lo registra come un'uscita verso la carta, come il tasto nel dettaglio.
   */
  const entryProps = (e: TierCardEntry) => ({
    href: e.href,
    "aria-haspopup": "dialog" as const,
    onClick: (ev: MouseEvent<HTMLAnchorElement>) => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) {
        track("tier_entry_click", { tier_source: source, target: "card" });
        return;
      }
      ev.preventDefault();
      openCard(e.slug);
    },
    onAuxClick: (ev: MouseEvent<HTMLAnchorElement>) => {
      if (ev.button === 1) track("tier_entry_click", { tier_source: source, target: "card" });
    },
    // come i bottoni di prima: anche la barra spaziatrice apre il dettaglio (Invio passa già dal clic)
    onKeyDown: (ev: KeyboardEvent<HTMLAnchorElement>) => {
      if (ev.key !== " ") return;
      ev.preventDefault();
      openCard(e.slug);
    },
  });
  const current = open ? entries.find((e) => e.slug === open) : undefined;
  const onDialogClick = (ev: MouseEvent<HTMLDialogElement>) => {
    // clic sul fondo scuro (fuori dal pannello): chiude
    if (ev.target === ev.currentTarget) ev.currentTarget.close();
  };

  /* ---------- pezzi ---------- */

  const star = (e: TierCardEntry) =>
    e.legendary ? (
      <>
        <span className="legendary-star" aria-hidden="true">
          ★
        </span>
      </>
    ) : null;

  const peekOf = (e: TierCardEntry): PeekCard => ({
    name: e.name,
    legendary: e.legendary,
    mana: e.mana,
    power: e.power,
    health: e.health,
    image: e.image,
    thumb: e.thumb,
    ability: e.ability,
    typeLabel: e.typeLabel,
    alignment: e.alignment,
    alignmentLabel: e.alignmentLabel,
  });

  const tile = (e: TierCardEntry, caption?: string) => (
    <li key={e.slug} className="min-w-0">
      <span className="deck-card-wrap has-peek tier-tile-wrap">
        <a {...entryProps(e)} className={`tier-tile${e.legendary ? " is-legendary" : ""}`}>
          {e.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" />
          ) : (
            <span className="tier-tile-noart" aria-hidden="true">
              {e.name.slice(0, 2)}
            </span>
          )}
          <span className="tier-tile-name">
            {star(e)}
            {e.name}
            {e.legendary ? <span className="sr-only"> ({l.legendary})</span> : null}
          </span>
          {caption ? <span className="tier-tile-cap">{caption}</span> : null}
        </a>
        <CardPeek card={peekOf(e)} />
      </span>
    </li>
  );

  const chip = (key: "type" | "cost" | "align", value: string, label: string) => {
    const on = f[key] === value;
    const n = countWith(key, value);
    return (
      <button
        key={value}
        type="button"
        className="tier-chip-filter"
        aria-pressed={on}
        disabled={!on && n === 0}
        onClick={() => setF((prev) => ({ ...prev, [key]: on ? "" : value }))}
      >
        {label} <span className="tier-chip-n">{n}</span>
      </button>
    );
  };

  const toolbar =
    withFilters || withTable ? (
      <div className={`tier-tools${filtersOpen ? " is-open" : ""}`}>
        <div className="tier-tools-row">
          {withTable ? (
            <div role="group" aria-label={l.viewLabel} className="tier-seg">
              <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                {l.viewGrid}
              </button>
              <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>
                {l.viewTable}
              </button>
            </div>
          ) : null}
          <label className="tier-search">
            <span className="sr-only">{l.search}</span>
            <input id={`${id}-q`} type="search" value={f.q} placeholder={l.search} autoComplete="off" onChange={(ev) => setF((prev) => ({ ...prev, q: ev.target.value }))} />
          </label>
          {withFilters ? (
            <button type="button" className="tier-ftoggle" aria-expanded={filtersOpen} aria-controls={`${id}-filters`} onClick={() => setFiltersOpen((o) => !o)}>
              {l.filters}
              {active ? ` · ${active}` : ""}
            </button>
          ) : null}
          <span className="tier-count" aria-live="polite">
            {cardsLabel(pool.length)}
          </span>
          {active ? (
            <button type="button" className="tier-reset" onClick={() => setF({ q: "", type: "", cost: "", align: "" })}>
              {l.clear}
            </button>
          ) : null}
        </div>
        {withFilters ? (
          <div id={`${id}-filters`} className="tier-filters">
            <span className="tier-flabel">{l.type}</span>
            {chip("type", "unit", l.unit)}
            {chip("type", "spell", l.spell)}
            <span className="tier-flabel">{l.cost}</span>
            {chip("cost", "0-2", "0–2")}
            {chip("cost", "3", "3")}
            {chip("cost", "4", "4")}
            {chip("cost", "5+", "5+")}
            <span className="tier-flabel">{l.alignment}</span>
            {chip("align", "good", l.good)}
            {chip("align", "evil", l.evil)}
            {chip("align", "neutral", l.neutral)}
          </div>
        ) : null}
      </div>
    ) : null;

  const nothing = (
    <p className="tier-none">
      {l.none}{" "}
      {active ? (
        <button type="button" className="tier-reset" onClick={() => setF({ q: "", type: "", cost: "", align: "" })}>
          {l.clear}
        </button>
      ) : null}
    </p>
  );

  /* ---------- fasce ---------- */
  const tierOfEntry = (e: TierCardEntry): Tier | undefined => (official ? official[e.slug] : e.community?.tier);
  const bands = () => {
    if (!pool.length) return nothing;
    // le fasce di OriginsMeta tengono l'ordine scritto dalla redazione; quelle della community l'ordine della media
    const ranked = (t: Tier) =>
      official
        ? pool.filter((e) => official[e.slug] === t).sort((a, b) => Object.keys(official).indexOf(a.slug) - Object.keys(official).indexOf(b.slug))
        : pool.filter((e) => e.community?.tier === t).sort(byCommunity);
    const unranked = pool.filter((e) => !tierOfEntry(e));
    return (
      <div className="tier-board">
        {TIER_ORDER.map((t) => {
          const items = ranked(t);
          return (
            <section key={t} className="tier-band" aria-labelledby={`${id}-band-${t}`}>
              <h3 id={`${id}-band-${t}`} className={`tier-band-label ${tierTone[t]}`}>
                <span className="tier-band-letter">{t}</span>
                <span className="tier-band-mean">{l.tiers[t]}</span>
                <span className="tier-band-count">{items.length}</span>
              </h3>
              {items.length ? <ul className="tier-tiles">{items.map((e) => tile(e))}</ul> : <p className="tier-band-empty">{l.emptyTier}</p>}
            </section>
          );
        })}
        {unranked.length ? (
          <details className="tier-unused">
            <summary>
              {l.unranked} · {unranked.length}
            </summary>
            <ul className="tier-tiles">{unranked.map((e) => tile(e))}</ul>
          </details>
        ) : null}
      </div>
    );
  };

  /* ---------- le più giocate ---------- */
  const usage = () => {
    if (!pool.length) return nothing;
    const sorted = pool.slice().sort((a, b) => b.used - a.used || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
    const used = sorted.filter((e) => e.used > 0);
    const unused = sorted.filter((e) => e.used === 0);
    const hidden = showAll ? 0 : Math.max(0, used.length - USAGE_LIMIT);
    return (
      <>
        {used.length ? (
          <ol className="tier-usage">
            {used.map((e, i) => (
              // oltre le prime 20 la riga c'è (con il suo link) ma resta nascosta finché non si apre l'elenco intero
              <li key={e.slug} hidden={hidden > 0 && i >= USAGE_LIMIT}>
                <a {...entryProps(e)} className="tier-usage-row">
                  <span className="tier-usage-rank">{i + 1}</span>
                  {e.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={`tier-usage-art${e.legendary ? " is-legendary" : ""}`} src={e.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" />
                  ) : (
                    <span className="tier-usage-art" aria-hidden="true" />
                  )}
                  <span className="tier-usage-name">
                    <span className="tier-usage-title">
                      {star(e)}
                      {e.name}
                      {e.legendary ? <span className="sr-only"> ({l.legendary})</span> : null}
                    </span>
                    <span className="tier-usage-sub">
                      {e.typeLabel} · {l.mana} {e.mana ?? "—"}
                    </span>
                  </span>
                  <span className="tier-usage-bar" aria-hidden="true">
                    <span style={{ width: `${pct(e.used)}%` }} />
                  </span>
                  <span className="tier-usage-val">
                    {decksLabel(e.used)}
                    <span className="tier-usage-pct"> · {pct(e.used)}%</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        ) : null}
        {hidden ? (
          <button type="button" className="tier-more" onClick={() => setShowAll(true)}>
            {fmt(l.showAll, { n: hidden })} ↓
          </button>
        ) : null}
        {unused.length ? (
          <details className="tier-unused">
            <summary>
              {l.unused} · {unused.length}
            </summary>
            <ul className="tier-tiles">{unused.map((e) => tile(e))}</ul>
          </details>
        ) : null}
      </>
    );
  };

  /* ---------- tabella ---------- */
  const tableView = () => {
    if (!pool.length) return nothing;
    const val = (e: TierCardEntry, k: SortKey): number | string =>
      k === "name" ? e.name : k === "mana" ? (e.mana ?? 99) : k === "community" ? (e.community ? TIER_RANK[e.community.tier] * 10 + e.community.avg : 0) : e.used;
    const rows = pool.slice().sort((a, b) => {
      const va = val(a, sort.key);
      const vb = val(b, sort.key);
      const c = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
      return sort.dir * c || a.name.localeCompare(b.name);
    });
    const th = (k: SortKey, label: string, cls = "") => {
      const on = sort.key === k;
      return (
        <th scope="col" className={cls} aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
          <button
            type="button"
            onClick={() => setSort((s) => (s.key === k ? { key: k, dir: s.dir === 1 ? -1 : 1 } : { key: k, dir: k === "name" || k === "mana" ? 1 : -1 }))}
          >
            {label}
            <span aria-hidden="true">{on ? (sort.dir === 1 ? " ▲" : " ▼") : " ↕"}</span>
          </button>
        </th>
      );
    };
    return (
      <div className="tier-table-wrap">
        <table className="tier-table">
          <caption className="sr-only">{l.tableCaption}</caption>
          <thead>
            <tr>
              {th("name", l.colCard)}
              {th("mana", l.colCost, "is-num tier-hide-sm")}
              <th scope="col" className="tier-hide-sm">
                {l.colType}
              </th>
              {th("community", l.colCommunity)}
              {th("used", l.colDecks, "is-num")}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.slug}>
                <th scope="row">
                  <a {...entryProps(e)} className="tier-table-card">
                    {e.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" />
                    ) : null}
                    <span>
                      {star(e)}
                      {e.name}
                    </span>
                  </a>
                </th>
                <td className="is-num tier-hide-sm">{e.mana ?? "—"}</td>
                <td className="tier-hide-sm">{e.typeLabel}</td>
                <td>{e.community ? <span className={`tier-letter ${tierTone[e.community.tier]}`}>{e.community.tier}</span> : "—"}</td>
                <td className="is-num">
                  {e.used}
                  <span className="text-chalk-muted"> / {deckCount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /* ---------- dettaglio ---------- */
  const detail = (e: TierCardEntry) => {
    const c = e.community;
    const maxDist = c ? Math.max(...TIER_ORDER.map((t) => c.dist[t])) : 0;
    const decks = e.decks.slice(0, DECKS_IN_DETAIL);
    return (
      <div className="tier-dialog-body">
        <div className="tier-dialog-head">
          <form method="dialog">
            <button type="submit" className="tier-dialog-close" autoFocus>
              {l.close} <span aria-hidden="true">✕</span>
            </button>
          </form>
        </div>
        <div className="tier-dialog-card">
          {e.image || e.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.image ?? e.thumb} alt="" width={480} height={690} decoding="async" />
          ) : null}
          <div className="min-w-0">
            <h2 id={`${id}-dialog-title`} className="t-item text-lg">
              {star(e)}
              {e.name}
              {e.legendary ? <span className="sr-only"> ({l.legendary})</span> : null}
            </h2>
            <p className="mt-1 text-sm text-chalk-muted">
              {e.typeLabel}
              {e.alignmentLabel ? ` · ${e.alignmentLabel}` : ""} · {e.saga}
            </p>
            <p className="mt-2 font-mono text-sm text-pale">
              {l.mana} <b className="text-chalk">{e.mana ?? "—"}</b>
              {e.power !== undefined ? (
                <>
                  {" "}
                  · {l.power} <b className="text-chalk">{e.power}</b> · {l.health} <b className="text-chalk">{e.health ?? "?"}</b>
                </>
              ) : null}
            </p>
          </div>
        </div>
        {e.ability ? <p className="tier-dialog-text">{e.ability}</p> : null}

        <div className="tier-dialog-box">
          {source === "community" ? (
            c ? (
              <>
                <p className="flex flex-wrap items-center gap-2">
                  <span className={`tier-letter ${tierTone[c.tier]}`}>{c.tier}</span>
                  <b className="text-chalk">{fmt(l.communityTier, { tier: c.tier })}</b>
                  <span className="text-chalk-muted">
                    {fmt(l.average, { avg: oneDecimal(c.avg) })} · {c.votes === 1 ? l.votesOne : fmt(l.votesMany, { n: c.votes })}
                  </span>
                </p>
                <p className="kicker mt-3 text-chalk-muted">{l.distribution}</p>
                <ul className="tier-dist">
                  {TIER_ORDER.map((t) => (
                    <li key={t}>
                      <span className={`tier-letter is-small ${tierTone[t]}`}>{t}</span>
                      <span className="tier-dist-bar" aria-hidden="true">
                        <span style={{ width: `${maxDist ? (c.dist[t] / maxDist) * 100 : 0}%` }} />
                      </span>
                      <span className="tier-dist-n">{c.dist[t]}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>{l.notRanked}</p>
            )
          ) : source === "played" ? (
            <p>
              <b className="text-chalk">{fmt(l.inDecks, { n: e.used, total: deckCount, pct: pct(e.used) })}</b>
            </p>
          ) : official?.[e.slug] ? (
            <p className="flex flex-wrap items-center gap-2">
              <span className={`tier-letter ${tierTone[official[e.slug]]}`}>{official[e.slug]}</span>
              <b className="text-chalk">{l.tiers[official[e.slug]]}</b>
            </p>
          ) : (
            <p>{l.officialPending}</p>
          )}
        </div>

        <h3 className="kicker mt-5 text-mint">{l.decksTitle}</h3>
        {decks.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {decks.map((dk) => (
              <li key={dk.href}>
                <Link href={dk.href} className="link-mint" onClick={() => track("tier_entry_click", { tier_source: source, target: "deck" })}>
                  {dk.name}
                </Link>
              </li>
            ))}
            {e.decks.length > decks.length ? <li className="text-chalk-muted">{fmt(l.moreDecks, { n: e.decks.length - decks.length })}</li> : null}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-chalk-muted">{l.noDecks}</p>
        )}
        {e.guides.length ? (
          <>
            <h3 className="kicker mt-5 text-mint">{l.guidesTitle}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {e.guides.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className="link-mint" onClick={() => track("tier_entry_click", { tier_source: source, target: "guide" })}>
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="mt-6">
          <Link href={e.href} className="btn btn-primary" onClick={() => track("tier_entry_click", { tier_source: source, target: "card" })}>
            {l.cardPage} →
          </Link>
        </p>
      </div>
    );
  };

  /* ---------- striscia di anteprima ---------- */
  const strip = () => <ul className="tier-tiles">{entries.map((e) => tile(e, decksLabel(e.used)))}</ul>;

  return (
    <div className="tier-explorer">
      {toolbar}
      {mode === "strip" ? strip() : view === "table" && withTable ? tableView() : mode === "tiers" ? bands() : usage()}
      <dialog ref={dialog} className="tier-dialog" aria-labelledby={`${id}-dialog-title`} onClose={() => setOpen(null)} onClick={onDialogClick}>
        {current ? detail(current) : null}
      </dialog>
    </div>
  );
}
