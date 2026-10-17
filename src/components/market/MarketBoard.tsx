"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MARKET_SORT_KEYS, defaultSortDir, iconUrl, movers, sortBoard, type BoardItem, type MarketKind, type MarketSortDir, type MarketSortKey } from "@/lib/market/market";
import { fillMarket, type MarketLabels } from "@/lib/marketLabels";
import { Change } from "./Change";
import { CurrencySwitch, MarketMoney } from "./currency";

/**
 * Tabellone del tracker dei prezzi (17/10/2026): tutti gli oggetti di una fonte con prezzo più basso, variazioni a 24 ore
 * e 7 giorni e offerte, più chi sale e chi scende di più. Dati già nell'HTML (la pagina è ISR): filtri, ordine e valuta si
 * cambiano nel browser. Le icone degli oggetti passano da /_next/image (nessuna richiesta del browser a Steam) e ci sono
 * per le fonti che le accendono (`icons`: Origins e la controfigura CS2).
 */

/** Icona di un oggetto in un riquadro 4:3 (le skin di CS2 sono larghe, le carte stanno dentro con `object-contain`). */
function Thumb({ it, size, icons }: { it: BoardItem; size: number; icons: boolean }) {
  if (!icons || !it.icon) return null;
  return <Image src={iconUrl(it.icon)} alt="" width={size} height={Math.round((size * 3) / 4)} className="shrink-0 rounded-md bg-night-3 object-contain p-0.5" />;
}

export function MarketBoard({
  items,
  usdPerEur,
  locale,
  labels,
  base,
  icons,
  demo = false,
}: {
  items: BoardItem[];
  usdPerEur: number | null;
  locale: string;
  labels: Pick<MarketLabels, "board" | "movers" | "currency">;
  base: string;
  icons: boolean;
  /** prova del motore (CS2): i tipi si chiamano skin e casse */
  demo?: boolean;
}) {
  const b = labels.board;
  const kindLabels = demo ? b.demoKinds : b.kinds;
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | MarketKind>("all");
  // ordinamento (18/10/2026, Pierluigi: "metti gli ordinamenti per prezzo, dalla A alla Z, per offerte"): un clic sceglie,
  // un secondo clic sullo stesso inverte il verso; tasti sopra la tabella e intestazioni delle colonne fanno lo stesso
  const [sort, setSort] = useState<{ key: MarketSortKey; dir: MarketSortDir }>({ key: "name", dir: "asc" });
  const chooseSort = (key: MarketSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: defaultSortDir(key) }));
  const dirOf = (key: MarketSortKey) => (sort.key === key ? sort.dir : defaultSortDir(key));
  const dirText = (key: MarketSortKey, dir: MarketSortDir) => (key === "name" ? (dir === "asc" ? b.sortDirs.az : b.sortDirs.za) : dir === "desc" ? b.sortDirs.high : b.sortDirs.low);
  const sortLabel = (key: MarketSortKey) => {
    const dir = dirOf(key);
    return key === "name" ? (dir === "asc" ? "A → Z" : "Z → A") : `${b.sorts[key]} ${dir === "desc" ? "↓" : "↑"}`;
  };
  const ariaSort = (key: MarketSortKey) => (sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none");

  const kinds = useMemo(() => {
    const count = { all: items.length, card: 0, pack: 0, other: 0 } as Record<"all" | MarketKind, number>;
    for (const it of items) count[it.kind] += 1;
    return (["all", "card", "pack", "other"] as const).filter((k) => k === "all" || count[k] > 0).map((k) => ({ id: k, count: count[k] }));
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((it) => (kind === "all" || it.kind === kind) && (!q || `${it.name} ${it.item_type} ${it.variant ?? ""}`.toLowerCase().includes(q)));
    return sortBoard(list, sort.key, sort.dir, locale);
  }, [items, query, kind, sort, locale]);

  const move = useMemo(() => movers(items, 3), [items]);
  const variant = (it: BoardItem) => (it.variant ? (b.variants[it.variant] ?? it.variant) : null);
  const countText = shown.length === 1 ? b.countOne : fillMarket(b.count, { n: new Intl.NumberFormat(locale).format(shown.length) });


  return (
    <div>
      <section aria-labelledby="market-movers" className="mb-8">
        <h2 id="market-movers" className="t-section">
          {labels.movers.title}
        </h2>
        {move.up.length === 0 && move.down.length === 0 ? (
          <p className="mt-3 text-sm text-pale-muted">{labels.movers.none}</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {(
              [
                ["up", labels.movers.up, move.up],
                ["down", labels.movers.down, move.down],
              ] as const
            ).map(([id, title, list]) => (
              <div key={id} className="card-night p-4">
                <h3 className="kicker text-chalk-muted">{title}</h3>
                <ul className="mt-2 grid grid-cols-1 gap-2">
                  {list.map((it) => (
                    <li key={it.hash_name} className="flex min-w-0 items-center gap-3">
                      <Thumb it={it} size={56} icons={icons} />
                      <Link href={`${base}/${it.slug}`} className="link-mint min-w-0 flex-1 truncate">
                        {it.name}
                        {variant(it) ? <span className="text-pale-muted"> · {variant(it)}</span> : null}
                      </Link>
                      <span className="font-mono text-sm text-chalk tabular-nums">
                        <MarketMoney cents={it.price} usdPerEur={usdPerEur} locale={locale} />
                      </span>
                      <Change now={it.price} before={it.price_24h} locale={locale} className="w-20 text-right text-sm" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="felt-panel mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
          <span className="kicker text-chalk-muted">{b.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={b.searchPlaceholder}
            className="w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-chalk placeholder:text-chalk-muted"
          />
        </label>
        <CurrencySwitch locale={locale} label={labels.currency.label} />
        <div role="group" aria-label={b.sort} className="flex basis-full flex-wrap items-center gap-1.5">
          <span className="kicker mr-1 text-chalk-muted">{b.sort}</span>
          {MARKET_SORT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => chooseSort(key)}
              aria-pressed={sort.key === key}
              aria-label={`${b.sorts[key]}, ${dirText(key, dirOf(key))}`}
              title={dirText(key, dirOf(key))}
              className={`btn btn-choice px-3 py-1 text-xs ${sort.key === key ? "is-on" : ""}`}
            >
              {sortLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {kinds.length > 2 ? (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={b.kind}>
          {kinds.map((k) => (
            <button key={k.id} type="button" onClick={() => setKind(k.id)} aria-pressed={kind === k.id} className={`btn btn-choice px-3 py-1.5 text-xs ${kind === k.id ? "is-on" : ""}`}>
              {kindLabels[k.id]} <span className="font-mono font-normal">{k.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="kicker mb-3 text-chalk-muted" aria-live="polite">
        {countText}
      </p>

      {shown.length === 0 ? (
        <p className="card-night p-6 text-pale-muted">{b.noResults}</p>
      ) : (
        <div className="card-night overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-chalk-muted">
              <tr className="border-b-2 border-night-3">
                {(
                  [
                    ["name", b.columns.item, "w-1/2 text-left"],
                    ["price", b.columns.price, "text-right"],
                    ["change", b.columns.change24h, "text-right"],
                    [null, b.columns.change7d, "hidden text-right sm:table-cell"],
                    ["listings", b.columns.listings, "hidden text-right sm:table-cell"],
                  ] as const
                ).map(([key, title, cls]) => (
                  <th key={title} scope="col" aria-sort={key ? ariaSort(key) : undefined} className={`px-3 py-2 font-semibold ${cls}`}>
                    {key ? (
                      <button type="button" onClick={() => chooseSort(key)} title={dirText(key, dirOf(key))} className={`inline-flex items-center gap-1 hover:text-mint ${sort.key === key ? "text-mint" : ""}`}>
                        {title}
                        <span aria-hidden="true" className={sort.key === key ? "" : "opacity-40"}>
                          {dirOf(key) === "asc" ? "↑" : "↓"}
                        </span>
                      </button>
                    ) : (
                      title
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((it) => (
                <tr key={it.hash_name} className="border-b border-night-3 last:border-0">
                  <td className="max-w-0 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumb it={it} size={72} icons={icons} />
                      <div className="min-w-0">
                        <Link href={`${base}/${it.slug}`} className="link-mint block truncate font-semibold">
                          {it.name}
                        </Link>
                        <span className="block truncate text-xs text-pale-muted">{[variant(it), it.item_type].filter(Boolean).join(" · ")}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-chalk tabular-nums">
                    {it.price === null ? <span className="font-sans text-xs text-pale-muted">{b.noOffers}</span> : <MarketMoney cents={it.price} usdPerEur={usdPerEur} locale={locale} />}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <Change now={it.price} before={it.price_24h} locale={locale} />
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-right sm:table-cell">
                    <Change now={it.price} before={it.price_7d} locale={locale} />
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-right font-mono text-pale tabular-nums sm:table-cell">{new Intl.NumberFormat(locale).format(it.listings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
