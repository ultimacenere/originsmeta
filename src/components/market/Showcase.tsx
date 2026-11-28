"use client";

import Image from "next/image";
import Link from "@/components/IntentLink";
import { useMemo, useState } from "react";
import { iconUrl, searchText } from "@/lib/market/market";
import { fillMarket, type MarketLabels } from "@/lib/marketLabels";
import { useMounted } from "@/lib/useMounted";
import { CurrencySwitch, MarketMoney } from "./currency";
import "./market.css";

/**
 * La vetrina del Mercato (28/11/2026, Pierluigi: "vetrina principale, con anche una ricerca carta magari, poi cliccando
 * sulla carta si finisce in la scheda che racconta dedicata alla carta"). Ogni pezzo è la sua immagine di Steam intera
 * (per Origins la carta nella custodia gradata), accesa se oggi è in vendita e spenta se no, con il cartellino del
 * prezzo più basso richiesto. I pezzi della stessa carta stanno in una pila che si apre al tocco; con una ricerca i pezzi
 * si vedono uno per uno. Ogni pezzo porta alla sua scheda. Dati già nell'HTML (pagina ISR): ricerca, filtri, ordine e
 * valuta si cambiano nel browser; le immagini passano da /_next/image, il browser non chiama Steam.
 */

export type ShowcaseItem = {
  slug: string;
  hash: string;
  title: string;
  tags: string[];
  rarity: string | null;
  group: string;
  family: string;
  icon: string | null;
  fallback: string | null;
  price: number | null;
  listings: number;
  lastPrice: number | null;
  lastPriceAt: string | null;
  lastSeen: string;
  haystack: string;
};
export type ShowcaseCard = { slug: string; name: string };
type SortKey = "sale" | "price" | "recent" | "name";

const onSale = (it: ShowcaseItem) => it.price !== null;
const shownPrice = (it: ShowcaseItem) => it.price ?? it.lastPrice ?? 0;

function compare(key: SortKey, locale: string) {
  return (a: ShowcaseItem, b: ShowcaseItem) => {
    if (key === "name") return a.title.localeCompare(b.title, locale) || a.hash.localeCompare(b.hash);
    if (key === "price") return shownPrice(b) - shownPrice(a) || a.title.localeCompare(b.title, locale);
    if (key === "recent") return b.lastSeen.localeCompare(a.lastSeen) || a.title.localeCompare(b.title, locale);
    return Number(onSale(b)) - Number(onSale(a)) || b.lastSeen.localeCompare(a.lastSeen) || a.title.localeCompare(b.title, locale);
  };
}

/**
 * L'immagine del pezzo (o della pila: il primo davanti, il secondo dietro, storto), intera dentro lo scaffale. Per
 * Origins l'icona originale di Steam (200×200, senza il margine trasparente che Steam aggiunge alle misure più grandi):
 * la custodia sta fra il 21% e il 79% della larghezza, quindi lo scaffale in 3:5 toglie solo il fondo grigio ai lati.
 */
function Shelf({ items, open, wide }: { items: ShowcaseItem[]; open: boolean; wide: boolean }) {
  const front = items[0];
  const back = !open && items.length > 1 ? items[1] : null;
  const img = (it: ShowcaseItem) => (it.icon ? iconUrl(it.icon, wide ? 360 : 200) : it.fallback);
  const sizes = "(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw";
  return (
    <div className="mkt-shelf">
      {back && img(back) ? <Image src={img(back)!} alt="" fill sizes={sizes} className={`mkt-back ${back.icon ? "is-icon" : ""}`} /> : null}
      {img(front) ? <Image src={img(front)!} alt="" fill sizes={sizes} className={`mkt-front ${front.icon ? "is-icon" : ""}`} /> : null}
    </div>
  );
}

export function Showcase({
  items,
  cards,
  usdPerEur,
  locale,
  labels,
  base,
  cardBase,
  wide = false,
}: {
  items: ShowcaseItem[];
  /** carte del database, per dire "questa carta non ha ancora pezzi" quando la ricerca non trova niente (solo Origins) */
  cards: ShowcaseCard[];
  usdPerEur: number | null;
  locale: string;
  labels: Pick<MarketLabels, "showcase" | "board" | "currency">;
  /** indirizzo della vetrina: i pezzi stanno in `${base}/<slug>` */
  base: string;
  /** indirizzo delle schede carta (`${cardBase}/<slug>`) */
  cardBase: string;
  /** immagini larghe (le skin della controfigura CS2) invece che in formato carta */
  wide?: boolean;
}) {
  const l = labels.showcase;
  const mounted = useMounted();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("sale");
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const groups = useMemo(() => {
    const count = new Map<string, number>();
    for (const it of items) count.set(it.group, (count.get(it.group) ?? 0) + 1);
    return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale));
  }, [items, locale]);

  const q = searchText(query);
  const shown = useMemo(() => {
    const list = items.filter((it) => (filter === "all" || (filter === "sale" ? onSale(it) : it.group === filter)) && (!q || it.haystack.includes(q)));
    return list.sort(compare(sort, locale));
  }, [items, filter, q, sort, locale]);

  // con una ricerca i pezzi si vedono uno per uno; senza, i pezzi della stessa famiglia stanno in una pila
  const units = useMemo((): { key: string; items: ShowcaseItem[]; stack?: boolean }[] => {
    if (q) return shown.map((it) => ({ key: it.slug, items: [it] }));
    const fam = new Map<string, ShowcaseItem[]>();
    for (const it of shown) {
      if (!fam.has(it.family)) fam.set(it.family, []);
      fam.get(it.family)!.push(it);
    }
    const out: { key: string; items: ShowcaseItem[]; stack?: boolean }[] = [];
    const seen = new Set<string>();
    for (const it of shown) {
      if (seen.has(it.family)) continue;
      seen.add(it.family);
      const members = fam.get(it.family)!;
      if (members.length > 1 && !open.has(it.family)) out.push({ key: `stack:${it.family}`, items: members, stack: true });
      else for (const m of members) out.push({ key: m.slug, items: [m] });
    }
    return out;
  }, [shown, q, open]);

  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", ...(mounted ? {} : { timeZone: "UTC" }) }).format(new Date(iso));
  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  const cardHint = q && !shown.length ? cards.find((c) => searchText(c.name).includes(q)) : undefined;

  const ticket = (it: ShowcaseItem, stack?: ShowcaseItem[]) => {
    const on = stack ? stack.filter(onSale) : onSale(it) ? [it] : [];
    const cheapest = on.length ? on.reduce((a, b) => ((a.price ?? Infinity) <= (b.price ?? Infinity) ? a : b)) : null;
    // in una pila le etichette dei pezzi solo se sono poche (i due Dracula sì, le 11 versioni di una skin no: c'è il numero)
    const stackTags = stack ? [...new Set(stack.flatMap((s) => s.tags))] : [];
    const tags = stack ? (stackTags.length <= 3 ? stackTags : []) : it.tags;
    return (
      <div className="mkt-ticket">
        <div className="mkt-name">{it.title}</div>
        {tags.length || it.rarity ? (
          <div className="mkt-tags">
            {tags.map((t) => (
              <span key={t} className="mkt-tag">
                {t}
              </span>
            ))}
            {it.rarity ? <span className="mkt-tag is-rarity">{it.rarity}</span> : null}
          </div>
        ) : null}
        {cheapest ? (
          <>
            <div className="mkt-price">
              <MarketMoney cents={cheapest.price} usdPerEur={usdPerEur} locale={locale} />
            </div>
            <div className="mkt-sub">
              <span className="mkt-live">
                <span className="mkt-dot" aria-hidden="true" />
                {stack
                  ? fillMarket(l.stackOnSale, { on: fmt(on.length), n: fmt(stack.length) })
                  : cheapest.listings === 1
                    ? l.offersOne
                    : fillMarket(l.offers, { n: fmt(cheapest.listings) })}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="mkt-price">{labels.board.noOffers}</div>
            <div className="mkt-sub">
              {it.lastPrice !== null && it.lastPriceAt ? (
                <>
                  {fillMarket(l.lastSeenAt, { day: day(it.lastPriceAt) })}
                  {" · "}
                  <span className="font-mono tabular-nums">
                    <MarketMoney cents={it.lastPrice} usdPerEur={usdPerEur} locale={locale} />
                  </span>
                </>
              ) : null}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mkt-tools">
        <label className="mkt-search">
          <span className="sr-only">{l.search}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={l.searchPlaceholder} aria-label={l.search} />
        </label>
        <select className="mkt-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label={l.sortLabel}>
          {(["sale", "price", "recent", "name"] as const).map((k) => (
            <option key={k} value={k}>
              {l.sorts[k]}
            </option>
          ))}
        </select>
        <CurrencySwitch locale={locale} label={labels.currency.label} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={l.chipsLabel}>
        {[
          ["all", l.all, items.length] as const,
          ["sale", l.onSaleChip, items.filter(onSale).length] as const,
          ...groups.filter(() => groups.length > 1).map(([g, n]) => [g, g, n] as const),
        ].map(([id, label, n]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={`btn btn-choice px-3 py-1 text-xs ${filter === id ? "is-on" : ""}`}>
            {label} <span className="font-mono font-normal">{fmt(n)}</span>
          </button>
        ))}
      </div>

      {units.length === 0 ? (
        <div className="card-night mt-6 p-5 text-pale">
          {cardHint ? (
            <p>
              {fillMarket(l.cardNoItems, { name: cardHint.name })}{" "}
              <Link href={`${cardBase}/${cardHint.slug}`} className="link-mint">
                {l.cardPage}
              </Link>
            </p>
          ) : (
            <p>{q ? fillMarket(l.noMatch, { q: query.trim() }) : labels.board.noResults}</p>
          )}
        </div>
      ) : (
        <div className={`mkt-grid mt-7 ${wide ? "is-wide" : ""}`}>
          {units.map((u) => {
            const lead = u.items[0];
            const lit = u.items.some(onSale);
            if (u.stack) {
              const family = lead.family;
              return (
                <button
                  key={u.key}
                  type="button"
                  className={`mkt-case ${lit ? "is-on" : "is-off"}`}
                  aria-label={fillMarket(l.openStack, { name: lead.title, n: fmt(u.items.length) })}
                  onClick={() => setOpen((s) => new Set(s).add(family))}
                >
                  <div className="relative">
                    <span className="mkt-count">{fillMarket(l.pieces, { n: fmt(u.items.length) })}</span>
                    <Shelf items={u.items} open={false} wide={wide} />
                  </div>
                  {ticket(lead, u.items)}
                </button>
              );
            }
            return (
              <Link key={u.key} href={`${base}/${lead.slug}`} className={`mkt-case ${onSale(lead) ? "is-on" : "is-off"}`} aria-label={fillMarket(l.openItem, { name: [lead.title, ...lead.tags].join(" · ") })}>
                <Shelf items={[lead]} open wide={wide} />
                {ticket(lead)}
              </Link>
            );
          })}
        </div>
      )}

      {open.size > 0 && !q ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {[...open].map((f) => {
            const name = items.find((it) => it.family === f)?.title ?? f;
            return (
              <button key={f} type="button" className="btn btn-ghost px-3 py-1 text-xs" onClick={() => setOpen((s) => { const n = new Set(s); n.delete(f); return n; })}>
                {fillMarket(l.closeStack, { name })}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className="pen-note is-quiet">{l.penNote}</span>
        <span className="text-sm text-pale-muted">{l.footText}</span>
      </div>
    </div>
  );
}
