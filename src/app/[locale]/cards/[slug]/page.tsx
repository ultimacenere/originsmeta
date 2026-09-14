import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { cards, getCard, patches, sagas, statLine } from "@/lib/data/cards";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => cards.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) return {};
  const stats = statLine(card);
  const desc = `${card.name}${stats ? ` (${stats})` : ""} · ${sagas[card.saga][locale]} · ${card.ability?.[locale] ?? card.origin[locale]}`;
  return pageMeta(locale, `/cards/${card.slug}`, `${card.name} · ${dict.cards.title}`, desc);
}

export default async function CardPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) notFound();
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const related = cards.filter((c) => c.saga === card.saga && c.slug !== card.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/cards")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.cards.title}
        </Link>
      </p>

      <article className="card-ivory mt-6 grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_260px]">
        <div>
          <p className="kicker text-ink-muted">
            {d.cards.detailKicker} · {sagas[card.saga][locale]}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">{card.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="stat-pill bg-ink text-ivory">{typeLabel[card.type]}</span>
            {card.legendary ? <span className="stat-pill bg-gold text-ink font-bold">{d.common.legendary}</span> : null}
            {card.status === "removed" ? <span className="stat-pill bg-crimson text-ivory">{d.common.removed}</span> : null}
            {(card.keywords ?? []).map((k) => (
              <span key={k} className="stat-pill border border-ink/20 text-ink">
                {k}
              </span>
            ))}
          </div>
          {card.ability ? <p className="mt-6 text-lg text-ink">{card.ability[locale]}</p> : null}
          <h2 className="mt-8 text-xl font-extrabold text-ink">{d.cards.sagaTitle}</h2>
          <p className="mt-2 text-ink-muted">{card.origin[locale]}</p>
        </div>

        <aside className="felt-panel self-start p-5 text-chalk">
          <p className="kicker text-chalk-muted">{d.common.stats}</p>
          {card.mana === undefined && card.power === undefined ? (
            <p className="mt-2 text-sm text-chalk-muted">{d.common.unknownStats}</p>
          ) : (
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="kicker text-chalk-muted">{d.common.mana}</dt>
                <dd className="font-display text-3xl font-extrabold text-gold tabular">{card.mana ?? "–"}</dd>
              </div>
              <div>
                <dt className="kicker text-chalk-muted">{d.common.power}</dt>
                <dd className="font-display text-3xl font-extrabold text-chalk tabular">{card.type === "unit" ? (card.power ?? "–") : "–"}</dd>
              </div>
              <div>
                <dt className="kicker text-chalk-muted">{d.common.health}</dt>
                <dd className="font-display text-3xl font-extrabold text-chalk tabular">{card.type === "unit" ? (card.health ?? "–") : "–"}</dd>
              </div>
            </dl>
          )}
          <p className="mt-4 text-[11px] leading-snug text-chalk-muted/80">{d.common.asOf}</p>
        </aside>
      </article>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-chalk">{d.cards.changesTitle}</h2>
        <ol className="mt-4 space-y-3">
          {[...card.history].reverse().map((ch, i) => (
            <li key={i} className="card-ivory p-5">
              <div className="flex flex-wrap items-center gap-3">
                <ChangeChip kind={ch.kind} label={d.common[ch.kind === "deck" ? "rework" : ch.kind]} />
                <span className="font-mono text-sm text-ink-muted">
                  {d.common.patch} {ch.patch} · {formatDate(locale, patches[ch.patch].date)}
                </span>
                <a href={patches[ch.patch].url} rel="noopener" className="ml-auto text-xs text-crimson-deep hover:underline">
                  {d.common.steamNews} →
                </a>
              </div>
              <div className="mt-3">
                <StatDelta from={ch.from} to={ch.to} />
              </div>
              <p className="mt-2 text-ink">{ch.note[locale]}</p>
            </li>
          ))}
        </ol>
      </section>

      {related.length ? (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-chalk">
            {d.cards.relatedTitle}: {sagas[card.saga][locale]}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-ghost text-xs">
                  {c.name}
                  {statLine(c) ? <span className="font-mono text-chalk-muted">{statLine(c)}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
