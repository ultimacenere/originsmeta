import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/IntentLink";
import { notFound } from "next/navigation";
import { formatDate, href, type Locale } from "@/lib/i18n";
import { pageMeta, pageTitleWith } from "@/lib/page";
import { dropHreflang } from "@/lib/community/deckQuality";
import { activeCards, getCard, patchLabel, patchOrder, patches } from "@/lib/data/cards";
import { MARKET_CRON_MINUTES, MARKET_SOURCES, STEAM_PAGE_SIZE, familyOf, iconUrl, listingUrl, piecePartsOf, searchText, type BoardItem, type MarketSourceId } from "@/lib/market/market";
import { loadMarketBoard, loadMarketItem, type MarketStatus } from "@/lib/market/queries";
import { marketAccess } from "@/lib/market/access";
import { MARKET_PUBLIC } from "@/lib/community/badges";
import { fillMarket, marketLabels } from "@/lib/marketLabels";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { LocalTime } from "@/components/LocalTime";
import { PageNotes } from "@/components/PageNotes";
import { ItemStory, type StoryContext, type StoryTwin } from "./ItemStory";
import { Showcase, type ShowcaseItem } from "./Showcase";

/**
 * Pagine del tracker dei prezzi del mercato di Steam (17/10/2026): la vetrina e la scheda di ogni pezzo, per Origins TCG
 * (/market, /market/<oggetto>) e per la controfigura (/market/demo, /market/demo/<oggetto>: dal 18/10/2026 la
 * collezione Dreams & Nightmares di Counter-Strike 2, per provare il motore). Dal 28/11/2026 (Pierluigi, sulle cinque
 * proposte del Mercato: "vorrei il tool composto dalla vetrina e la scheda che racconta per ogni carta, quindi vetrina
 * principale, con anche una ricerca carta magari, poi cliccando sulla carta si finisce in la scheda che racconta") il
 * tabellone a tabella è diventato la vetrina (Showcase.tsx) e la scheda racconta il pezzo (ItemStory.tsx). ISR
 * (`revalidate` nelle rotte), letture in src/lib/market/queries.ts. Indicizzazione: la vetrina di Origins solo con
 * almeno un oggetto, le schede e tutta la controfigura mai (noindex, fuori da hreflang e sitemap).
 */

/** Le schede degli oggetti di Origins si indicizzano? (fase 2: si decide con gli oggetti veri) */
export const MARKET_ITEMS_INDEXABLE = false;

/** Apertura degli scambi con l'Accesso anticipato, 0.8 (post Steam del 27/10/2026 alle 18:08 UTC, news origins-tcg-early-access-0-8). */
const EARLY_ACCESS_AT = "2026-10-27T18:08:00Z";

const basePath = (source: MarketSourceId) => (source === "standin" ? "/market/demo" : "/market");
const latestFx = (fx: { usdPerEur: number }[]) => (fx.length ? fx[fx.length - 1].usdPerEur : null);

export async function marketBoardMeta(locale: Locale, source: MarketSourceId): Promise<Metadata> {
  const x = marketLabels[locale].meta;
  if (source === "standin") return dropHreflang(pageMeta(locale, basePath(source), x.demoTitle, x.demoDescription, undefined, { noindex: true }));
  // in prova riservata (MARKET_PUBLIC spento) anche il tabellone di Origins è noindex, per tutti
  if (!MARKET_PUBLIC) return dropHreflang(pageMeta(locale, basePath(source), x.title, x.description, undefined, { noindex: true }));
  const board = await loadMarketBoard(source);
  const indexable = Boolean(board?.items.length);
  const meta = pageMeta(locale, basePath(source), x.title, x.description, undefined, { noindex: !indexable });
  return indexable ? meta : dropHreflang(meta);
}

/**
 * I pezzi come li mostra la vetrina (e i gemelli della scheda): per Origins nome della carta, collezione e livello dal
 * nome di Steam, rarità; per la controfigura la skin, con usura e StatTrak/Souvenir come etichetta.
 */
function showcaseItems(items: readonly BoardItem[], source: MarketSourceId, locale: Locale): ShowcaseItem[] {
  const l = marketLabels[locale];
  const kinds = source === "standin" ? l.board.demoKinds : l.board.kinds;
  return items.map((it) => {
    const card = source === "origins" && it.card ? getCard(it.card) : undefined;
    const family = familyOf(source, it);
    const variant = it.variant ? (l.board.variants[it.variant] ?? it.variant) : null;
    let title: string;
    let tags: string[];
    let rarity: string | null = null;
    let group: string;
    if (source === "origins") {
      const parts = piecePartsOf(it.hash_name, card?.name ?? null);
      title = card?.name ?? it.name;
      const tag = parts.set && parts.tier ? `${parts.set} · ${parts.tier}` : (parts.set ?? parts.tier ?? variant);
      tags = tag ? [tag] : [];
      rarity = parts.rarity;
      group = parts.set ?? kinds[it.kind];
    } else {
      title = family.replace(/^[a-z]+:/, "");
      tags = it.kind === "card" && variant ? [variant] : [];
      group = kinds[it.kind];
    }
    return {
      slug: it.slug,
      hash: it.hash_name,
      title,
      tags,
      rarity,
      group,
      family,
      icon: MARKET_SOURCES[source].icons ? it.icon : null,
      fallback: card ? `/cards/${card.slug}.webp` : null,
      price: it.price,
      listings: it.listings,
      lastPrice: it.last_price,
      lastPriceAt: it.last_price_at,
      lastSeen: it.last_seen,
      haystack: searchText([title, it.name, ...tags, it.variant ?? "", it.item_type, rarity ?? ""].join(" ")),
    };
  });
}

/** I segni sul grafico della scheda: l'apertura degli scambi e le patch di bilanciamento (solo Origins). */
function marketContext(locale: Locale): StoryContext[] {
  const out: StoryContext[] = [{ t: Date.parse(EARLY_ACCESS_AT), label: marketLabels[locale].story.earlyAccess, patch: false }];
  for (const id of patchOrder) {
    const p = patches[id];
    const t = Date.parse(p.at ?? `${p.date}T12:00:00Z`);
    if (Number.isFinite(t)) out.push({ t, label: patchLabel(id, locale), patch: true });
  }
  return out;
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

/** La riga sotto il titolo della vetrina: quanti pezzi in vendita adesso, quanti visti e da quando, ultima lettura. */
function ShowcaseStatus({ locale, items, status }: { locale: Locale; items: readonly BoardItem[]; status: MarketStatus | null }) {
  const l = marketLabels[locale];
  const onSale = items.filter((it) => it.price !== null).length;
  const first = items.map((it) => it.first_seen).filter(Boolean).sort()[0];
  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  return (
    <div className="mkt-status mt-3">
      <span className={onSale ? "mkt-live" : "font-display font-extrabold text-chalk-muted"}>
        {onSale ? <span className="mkt-dot" aria-hidden="true" /> : null}
        {fillMarket(l.showcase.onSale, { n: fmt(onSale) })}
      </span>
      {first ? <span>{fillMarket(items.length === 1 ? l.showcase.seenOne : l.showcase.seen, { n: fmt(items.length), day: formatDate(locale, first.slice(0, 10)) })}</span> : null}
      {status?.lastPageAt ? (
        <span className="text-pale-muted">
          {l.showcase.lastRead} <LocalTime iso={status.lastPageAt} locale={locale} utcLabel={l.status.utc} />
        </span>
      ) : null}
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

/** Pagina per chi non può ancora aprire il Mercato (prova riservata): titolo, lucchetto, due righe. */
function MarketLocked({ locale }: { locale: Locale }) {
  const l = marketLabels[locale];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="kicker flex items-center gap-2 text-gold">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" stroke="none" />
          <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" strokeLinecap="round" />
        </svg>
        {l.locked.kicker}
      </p>
      <h1 className="t-page mt-3">{l.h1}</h1>
      <p className="mt-4 text-pale">{l.locked.text}</p>
      <Link href={href(locale)} className="btn btn-ghost mt-6 inline-flex text-xs">
        {l.locked.back}
      </Link>
    </div>
  );
}

export async function MarketBoardPage({ locale, source }: { locale: Locale; source: MarketSourceId }) {
  const l = marketLabels[locale];
  if (!(await marketAccess())) return <MarketLocked locale={locale} />;
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
      {!board ? (
        <p className="felt-panel-mint mt-6 max-w-3xl p-6 text-pale">{l.status.unavailable}</p>
      ) : items.length ? (
        <ShowcaseStatus locale={locale} items={items} status={board.status} />
      ) : (
        <StatusLine locale={locale} status={board.status} live={false} />
      )}

      {items.length ? (
        <div className="mt-6">
          <Showcase
            items={showcaseItems(items, source, locale)}
            cards={source === "origins" ? activeCards.map((c) => ({ slug: c.slug, name: c.name })) : []}
            usdPerEur={latestFx(board!.fx)}
            locale={locale}
            labels={{ showcase: l.showcase, board: l.board, currency: l.currency }}
            base={path}
            cardBase={href(locale, "/cards")}
            wide={demo}
          />
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
  if (!(await marketAccess())) notFound();
  const data = await loadMarketItem(source, slug);
  if (!data) notFound();
  const x = marketLabels[locale].meta;
  const path = `${basePath(source)}/${data.item.slug}`;
  const indexable = source === "origins" && MARKET_ITEMS_INDEXABLE && MARKET_PUBLIC;
  const image = MARKET_SOURCES[source].icons && data.item.icon ? iconUrl(data.item.icon, 512) : undefined;
  const meta = pageMeta(locale, path, pageTitleWith(data.item.name, x.itemSuffix), fillMarket(x.itemDescription, { name: data.item.name }), image, { noindex: !indexable, imageAlt: data.item.name });
  return indexable ? meta : dropHreflang(meta);
}

export async function MarketItemPage({ locale, source, slug }: { locale: Locale; source: MarketSourceId; slug: string }) {
  const l = marketLabels[locale];
  // in prova riservata le schede degli oggetti, per chi non è admin, non esistono
  if (!(await marketAccess())) notFound();
  const data = await loadMarketItem(source, slug);
  if (!data) notFound();
  const { item } = data;
  const demo = source === "standin";
  const board = href(locale, basePath(source));
  const path = `${board}/${item.slug}`;
  const card = source === "origins" && item.card ? getCard(item.card) : undefined;
  const [self, ...others] = showcaseItems([item, ...data.siblings.map((s) => s.item)], source, locale);
  // per Origins l'icona originale di Steam (200×200): le misure più grandi aggiungono solo un margine trasparente
  const image = self.icon ? iconUrl(self.icon, demo ? 512 : 200) : self.fallback;
  const twins: StoryTwin[] = [
    { slug: self.slug, href: null, title: self.title, tags: self.tags, price: item.price, lastPrice: item.last_price, daily: data.daily, self: true },
    ...others.map((o, i) => ({ slug: o.slug, href: `${board}/${o.slug}`, title: o.title, tags: o.tags, price: o.price, lastPrice: o.lastPrice, daily: data.siblings[i].daily, self: false })),
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
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
        ← {l.story.back}
      </Link>
      <div className="mkt-hero mt-4">
        <div className={`mkt-hero-img ${demo ? "is-wide" : ""}`}>
          {image ? <Image src={image} alt={item.name} fill sizes="(min-width: 768px) 180px, 110px" priority className={self.icon ? "is-icon" : ""} /> : null}
        </div>
        <div className="min-w-0">
          <h1 className="t-page break-words">{self.title}</h1>
          {self.tags.length || self.rarity ? (
            <div className="mkt-tags mt-2">
              {self.tags.map((t) => (
                <span key={t} className="mkt-tag">
                  {t}
                </span>
              ))}
              {self.rarity ? <span className="mkt-tag is-rarity">{self.rarity}</span> : null}
            </div>
          ) : null}
          <p className="mt-2 break-words text-xs text-pale-muted">{item.name}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={listingUrl(MARKET_SOURCES[source], item.hash_name)} target="_blank" rel="nofollow noopener noreferrer" className="btn btn-ghost text-xs">
              {l.item.onSteam}
            </a>
            {card ? (
              <Link href={href(locale, `/cards/${card.slug}`)} className="btn btn-ghost text-xs">
                {l.story.cardPage}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ItemStory
          locale={locale}
          labels={{ story: l.story, ranges: l.item.ranges, table: l.item.table, currency: l.currency.label, noOffers: l.board.noOffers }}
          name={item.name}
          family={self.title}
          price={item.price}
          listings={item.listings}
          hourly={data.hourly}
          daily={data.daily}
          readHours={data.readHours}
          fx={data.fx}
          usdPerEur={latestFx(data.fx)}
          now={data.at}
          readAt={data.status?.lastPageAt ?? null}
          context={source === "origins" ? marketContext(locale) : []}
          twins={twins}
        />
      </div>

      <Notes locale={locale} />
    </div>
  );
}
