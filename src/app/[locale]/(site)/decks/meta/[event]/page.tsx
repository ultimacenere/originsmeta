import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { encodeOmCode } from "@/lib/deckcode";
import { eventDecklists, getEventDecklists } from "@/lib/data/eventDecklists";
import { EVENT_META_MIN_PLAYERS, eventMeta } from "@/lib/eventMeta";
import { eventMetaLabels } from "@/lib/eventMetaLabels";
import { fillLabel } from "@/lib/community/deckQuality";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  Meta di un torneo ufficiale (30/09/2026, preparata per la Crimson Cup del 20–25/10): Leggendarie, carte base e
  formazioni dalle liste trascritte con la fonte in src/lib/data/eventDecklists.ts. Statica; finché le liste sono meno
  di EVENT_META_MIN_PLAYERS giocatori dice quando arrivano ed è noindex (e fuori dalla sitemap).
*/
type Params = Promise<{ locale: string; event: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => eventDecklists.map((e) => ({ locale, event: e.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { event } = await params;
  const { locale } = await resolveLocale(params);
  const ev = getEventDecklists(event);
  if (!ev) return {};
  const L = eventMetaLabels[locale];
  return pageMeta(locale, `/decks/meta/${ev.slug}`, fillLabel(L.title, { event: ev.name }), fillLabel(L.description, { event: ev.name }), undefined, {
    noindex: ev.players.length < EVENT_META_MIN_PLAYERS,
  });
}

export default async function EventMetaPage({ params }: { params: Params }) {
  const { event } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const ev = getEventDecklists(event);
  if (!ev) notFound();
  const L = eventMetaLabels[locale];
  const m = eventMeta(ev.players);
  const ready = ev.players.length >= EVENT_META_MIN_PLAYERS;
  const name = (slug: string) => getCard(slug)?.name ?? slug;
  const path = href(locale, `/decks/meta/${ev.slug}`);
  const bar = (share: number) => <span className="block h-2 rounded-full bg-mint" style={{ width: `${Math.max(2, share)}%` }} aria-hidden="true" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbs([
          { name: "OriginsMeta", path: href(locale) },
          { name: d.decks.title, path: href(locale, "/decks") },
          { name: fillLabel(L.title, { event: ev.name }), path },
        ])}
      />
      <p className="text-sm">
        <Link href={href(locale, "/decks")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.decks.title}
        </Link>
      </p>
      <h1 className="t-page mt-4">{fillLabel(L.title, { event: ev.name })}</h1>
      <p className="mt-3 text-sm">
        <Link href={href(locale, "/news/crimson-cup-format-check-in")} className="link-mint font-semibold">
          {L.rules} →
        </Link>
      </p>

      {!ready ? (
        <p className="card-night mt-6 p-6 text-pale">
          {fillLabel(L.pending, { event: ev.name, from: formatDate(locale, ev.from), to: formatDate(locale, ev.to) })}
        </p>
      ) : (
        <>
          <p className="mt-4 font-display text-lg font-bold text-chalk">{fillLabel(L.summary, { n: String(m.players), decks: String(m.decks) })}</p>
          <p className="mt-1 text-sm text-pale-muted">{L.note}</p>

          <section className="mt-8" aria-labelledby="meta-legendaries">
            <h2 id="meta-legendaries" className="t-section">
              {L.legendaries}
            </h2>
            <ul className="mt-3 space-y-2">
              {m.legendaries.map((x) => (
                <li key={x.slug} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                  <Link href={href(locale, `/cards/${x.slug}`)} className="truncate text-sky hover:underline">
                    ★ {name(x.slug)}
                  </Link>
                  {bar(x.share)}
                  <span className="font-mono text-xs text-pale-muted">
                    {x.share}% · {fillLabel(L.inDecks, { n: String(x.decks) })}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8" aria-labelledby="meta-cards">
            <h2 id="meta-cards" className="t-section">
              {L.cards}
            </h2>
            <ul className="mt-3 space-y-2">
              {m.cards.slice(0, 20).map((x) => (
                <li key={x.slug} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                  <Link href={href(locale, `/cards/${x.slug}`)} className="truncate text-sky hover:underline">
                    {name(x.slug)}
                  </Link>
                  {bar(x.share)}
                  <span className="font-mono text-xs text-pale-muted">{x.share}%</span>
                </li>
              ))}
            </ul>
          </section>

          {m.lineups.length ? (
            <section className="mt-8" aria-labelledby="meta-lineups">
              <h2 id="meta-lineups" className="t-section">
                {L.lineups}
              </h2>
              <ul className="mt-3 space-y-1 text-sm text-pale">
                {m.lineups.map((l) => (
                  <li key={l.legendaries.join()}>
                    {l.legendaries.map(name).join(" · ")} <span className="font-mono text-xs text-pale-muted">×{l.players}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-8" aria-labelledby="meta-players">
            <h2 id="meta-players" className="t-section">
              {L.players}
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {ev.players.map((p) => (
                <li key={p.name} className="card-night p-4">
                  <p className="font-bold text-chalk">
                    <span className="font-mono text-xs text-mint">#{p.placing}</span> {p.name}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {p.decks.map((dk, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <span className="stat-pill bg-gold text-ink">★ {name(dk[0])}</span>
                        <a
                          href={`${href(locale, "/deck-builder")}#${encodeOmCode({ name: `${p.name} · ${ev.name}`, legendary: dk[0], cards: dk.slice(1), customCards: [] })}`}
                          className="text-xs text-pale-muted underline hover:text-sky"
                          rel="nofollow"
                        >
                          {L.openBuilder}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {ev.sources.length ? (
        <section className="mt-8 text-sm" aria-labelledby="meta-sources">
          <h2 id="meta-sources" className="kicker text-chalk-muted">
            {L.sources}
          </h2>
          <ul className="mt-2 space-y-1">
            {ev.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} className="text-pale-muted underline hover:text-pale" target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>{" "}
                <span className="font-mono text-xs text-pale-muted">({formatDate(locale, s.read)})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
