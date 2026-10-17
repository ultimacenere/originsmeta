import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, type Locale } from "@/lib/i18n";
import { pageMeta, pageTitleWith } from "@/lib/page";
import { dropHreflang } from "@/lib/community/deckQuality";
import { getCard } from "@/lib/data/cards";
import { MARKET_CRON_MINUTES, MARKET_SOURCES, STEAM_PAGE_SIZE, iconUrl, listingUrl, type MarketSourceId } from "@/lib/market/market";
import { loadMarketBoard, loadMarketItem, type MarketStatus } from "@/lib/market/queries";
import { fillMarket, marketLabels } from "@/lib/marketLabels";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { LocalTime } from "@/components/LocalTime";
import { PageNotes } from "@/components/PageNotes";
import { Change } from "./Change";
import { MarketBoard } from "./MarketBoard";
import { MarketMoney } from "./currency";
import { PriceChart } from "./PriceChart";

/**
 * Pagine del tracker dei prezzi del mercato di Steam (17/10/2026): tabellone e scheda di un oggetto, per Origins TCG
 * (/market, /market/<oggetto>) e per la controfigura (/market/demo, /market/demo/<oggetto>: dal 18/10/2026 la
 * collezione Dreams & Nightmares di Counter-Strike 2, per provare il motore prima che apra il mercato di Origins). ISR (`revalidate` nelle rotte), letture in
 * src/lib/market/queries.ts. Indicizzazione: il tabellone di Origins solo con almeno un oggetto, le schede degli oggetti
 * e tutta la controfigura mai (noindex, fuori da hreflang e sitemap). Le schede si indicizzeranno quando vedremo gli
 * oggetti veri (fase 2, decisione di Pierluigi).
 */

/** Le schede degli oggetti di Origins si indicizzano? (fase 2: si decide con gli oggetti veri) */
export const MARKET_ITEMS_INDEXABLE = false;

const basePath = (source: MarketSourceId) => (source === "standin" ? "/market/demo" : "/market");
const latestFx = (fx: { usdPerEur: number }[]) => (fx.length ? fx[fx.length - 1].usdPerEur : null);

export async function marketBoardMeta(locale: Locale, source: MarketSourceId): Promise<Metadata> {
  const x = marketLabels[locale].meta;
  if (source === "standin") return dropHreflang(pageMeta(locale, basePath(source), x.demoTitle, x.demoDescription, undefined, { noindex: true }));
  const board = await loadMarketBoard(source);
  const indexable = Boolean(board?.items.length);
  const meta = pageMeta(locale, basePath(source), x.title, x.description, undefined, { noindex: !indexable });
  return indexable ? meta : dropHreflang(meta);
}

function StatusLine({ locale, status, live }: { locale: Locale; status: MarketStatus | null; live: boolean }) {
  const s = marketLabels[locale].status;
  const min = { min: MARKET_CRON_MINUTES };
  // con più pagine di quante ne legge un passaggio del cron (circa 30) un giro ne richiede più d'uno: lo si dice
  const rounds = status?.total ? Math.ceil(status.total / (STEAM_PAGE_SIZE * 30)) : 1;
  return (
    <div className="mt-4 max-w-3xl text-sm text-pale">
      <p>{live ? fillMarket(s.live, min) : `${s.closed} ${fillMarket(s.checking, min)}`}</p>
      {live && rounds > 1 ? <p className="mt-1 text-pale-muted">{fillMarket(s.sweep, { min: rounds * MARKET_CRON_MINUTES })}</p> : null}
      <p className="mt-1 text-pale-muted">
        {status?.lastPageAt ? (
          <>
            {s.lastCheck} <LocalTime iso={status.lastPageAt} locale={locale} utcLabel={s.utc} />
          </>
        ) : (
          s.neverChecked
        )}
      </p>
    </div>
  );
}

function Notes({ locale }: { locale: Locale }) {
  const l = marketLabels[locale];
  return (
    <PageNotes>
      <section aria-labelledby="market-notes" className="max-w-3xl">
        <h2 id="market-notes" className="t-section">
          {l.notes.title}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-pale">
          {l.notes.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-pale">
          {l.soon.when}{" "}
          <Link href={href(locale, "/news/origins-sets-alpha-edition-grading")} className="link-mint">
            {l.soon.sets}
          </Link>
          {" · "}
          <Link href={href(locale, "/guides/collector-economy")} className="link-mint">
            {l.soon.guide}
          </Link>
        </p>
      </section>
    </PageNotes>
  );
}

function DemoBanner({ locale }: { locale: Locale }) {
  const l = marketLabels[locale];
  return (
    <div className="felt-panel-mint mb-6 flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-pale">
      <p className="min-w-0 flex-1 basis-72">{l.demo.banner}</p>
      <Link href={href(locale, "/market")} className="btn btn-ghost text-xs">
        {l.demo.back}
      </Link>
    </div>
  );
}

export async function MarketBoardPage({ locale, source }: { locale: Locale; source: MarketSourceId }) {
  const l = marketLabels[locale];
  const board = await loadMarketBoard(source);
  const demo = source === "standin";
  const path = href(locale, basePath(source));
  const items = board?.items ?? [];
  const h1 = demo ? l.demoH1 : l.h1;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            ...(demo ? [{ name: l.h1, path: href(locale, "/market") }] : []),
            { name: h1, path },
          ]),
        ]}
      />
      {demo ? <DemoBanner locale={locale} /> : null}
      <h1 className="t-page">{h1}</h1>
      {!board ? <p className="felt-panel-mint mt-6 max-w-3xl p-6 text-pale">{l.status.unavailable}</p> : <StatusLine locale={locale} status={board.status} live={items.length > 0} />}

      {items.length ? (
        <div className="mt-8">
          <MarketBoard items={items} usdPerEur={latestFx(board!.fx)} locale={locale} labels={l} base={path} icons={MARKET_SOURCES[source].icons} demo={demo} />
        </div>
      ) : !demo ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section aria-labelledby="market-soon" className="card-night p-6">
            <h2 id="market-soon" className="t-section">
              {l.soon.title}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-pale">
              {l.soon.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="market-demo" className="card-night flex flex-col p-6">
            <h2 id="market-demo" className="t-section">
              {l.demoLink.title}
            </h2>
            <p className="mt-3 flex-1 text-pale">{l.demoLink.text}</p>
            <Link href={href(locale, "/market/demo")} className="btn btn-primary mt-4 self-start">
              {l.demoLink.cta}
            </Link>
          </section>
        </div>
      ) : null}

      <Notes locale={locale} />
    </div>
  );
}

export async function marketItemMeta(locale: Locale, source: MarketSourceId, slug: string): Promise<Metadata> {
  const data = await loadMarketItem(source, slug);
  if (!data) notFound();
  const x = marketLabels[locale].meta;
  const path = `${basePath(source)}/${data.item.slug}`;
  const indexable = source === "origins" && MARKET_ITEMS_INDEXABLE;
  const image = MARKET_SOURCES[source].icons && data.item.icon ? iconUrl(data.item.icon, 512) : undefined;
  const meta = pageMeta(locale, path, pageTitleWith(data.item.name, x.itemSuffix), fillMarket(x.itemDescription, { name: data.item.name }), image, { noindex: !indexable, imageAlt: data.item.name });
  return indexable ? meta : dropHreflang(meta);
}

export async function MarketItemPage({ locale, source, slug }: { locale: Locale; source: MarketSourceId; slug: string }) {
  const l = marketLabels[locale];
  const data = await loadMarketItem(source, slug);
  if (!data) notFound();
  const { item } = data;
  const demo = source === "standin";
  const board = href(locale, basePath(source));
  const path = `${board}/${item.slug}`;
  const rate = latestFx(data.fx);
  const card = item.card ? getCard(item.card) : undefined;
  const variant = item.variant ? (l.board.variants[item.variant] ?? item.variant) : null;
  const icons = MARKET_SOURCES[source].icons;
  const tiles = [
    { label: l.item.change24h, before: item.price_24h },
    { label: l.item.change7d, before: item.price_7d },
    { label: l.item.change30d, before: item.price_30d },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: demo ? l.demoH1 : l.h1, path: board },
            { name: item.name, path },
          ]),
        ]}
      />
      {demo ? <DemoBanner locale={locale} /> : null}
      <Link href={board} className="link-mint text-sm">
        ← {l.item.back}
      </Link>
      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-4">
        {icons && item.icon ? <Image src={iconUrl(item.icon)} alt={item.name} width={200} height={150} className="shrink-0 rounded-lg bg-night-3 object-contain p-2" priority /> : null}
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="t-page break-words">{item.name}</h1>
          <p className="mt-1 text-sm text-pale-muted">{[variant, item.item_type, (demo ? l.board.demoKinds : l.board.kinds)[item.kind]].filter(Boolean).join(" · ")}</p>
          {card ? (
            <p className="mt-1 text-sm">
              <Link href={href(locale, `/cards/${card.slug}`)} className="link-mint">
                {card.name}
              </Link>
            </p>
          ) : null}
        </div>
        <a href={listingUrl(MARKET_SOURCES[source], item.hash_name)} target="_blank" rel="nofollow noopener noreferrer" className="btn btn-ghost text-xs">
          {l.item.onSteam} ↗
        </a>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="card-night col-span-2 p-4 sm:col-span-1">
          <dt className="kicker text-chalk-muted">{l.item.price}</dt>
          <dd className="mt-1 font-mono text-xl text-chalk tabular-nums">
            <MarketMoney cents={item.price} usdPerEur={rate} locale={locale} empty={l.board.noOffers} />
          </dd>
        </div>
        {tiles.map((t) => (
          <div key={t.label} className="card-night p-4">
            <dt className="kicker text-chalk-muted">{t.label}</dt>
            <dd className="mt-1 text-lg">
              <Change now={item.price} before={t.before} locale={locale} />
            </dd>
          </div>
        ))}
        <div className="card-night p-4">
          <dt className="kicker text-chalk-muted">{l.item.listings}</dt>
          <dd className="mt-1 font-mono text-lg text-chalk tabular-nums">{new Intl.NumberFormat(locale).format(item.listings)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-pale-muted">
        {item.first_seen ? `${l.item.firstSeen} ${formatDate(locale, item.first_seen.slice(0, 10))}` : null}
        {data.status?.lastPageAt ? (
          <>
            {" · "}
            {l.item.lastSeen}: <LocalTime iso={data.status.lastPageAt} locale={locale} utcLabel={l.status.utc} />
          </>
        ) : null}
      </p>

      <section aria-labelledby="market-chart" className="card-night mt-8 p-4 sm:p-6">
        <h2 id="market-chart" className="t-section mb-4">
          {l.item.chartTitle}
        </h2>
        <PriceChart hourly={data.hourly} daily={data.daily} fx={data.fx} usdPerEur={rate} locale={locale} name={item.name} labels={l.item} currencyLabel={l.currency.label} now={data.at} />
      </section>

      <Notes locale={locale} />
    </div>
  );
}
