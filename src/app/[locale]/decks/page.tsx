import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypes } from "@/lib/data/decks";
import { cards, getCard, statLine } from "@/lib/data/cards";
import { contactEmail } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/decks", dict.decks.title, dict.decks.intro);
}

export default async function DecksPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const legendaries = cards.filter((c) => c.legendary);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.decks.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.decks.intro}</p>

      <h2 className="mt-12 text-2xl font-extrabold text-chalk">{d.decks.archetypes}</h2>
      <ul className="mt-5 grid gap-5 lg:grid-cols-3">
        {archetypes.map((a) => (
          <li key={a.slug} className="card-ivory flex flex-col p-6">
            <p className="kicker text-ink-muted">{a.tagline[locale]}</p>
            <h3 className="mt-1 text-3xl font-extrabold text-ink">{a.name}</h3>
            <p className="mt-3 text-sm text-ink">{a.text[locale]}</p>
            <div className="mt-4 rounded-lg border border-ink/15 p-3 text-sm">
              <p className="kicker text-ink-muted">{d.decks.changes}</p>
              {a.changes.map((c, i) => (
                <p key={i} className="mt-2">
                  <span className="font-mono">
                    <span className="text-crimson-deep">− {c.removed}</span> · <span className="text-mint-deep">+ {c.added}</span>
                  </span>
                  <br />
                  <span className="text-ink-muted">{c.why[locale]}</span>
                </p>
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {a.cards.map((slug) => {
                const c = getCard(slug);
                if (!c) return null;
                return (
                  <li key={slug}>
                    <Link href={href(locale, `/cards/${slug}`)} className="stat-pill border border-ink/20 text-ink hover:bg-ink hover:text-ivory">
                      {c.name} {statLine(c) ? <span className="text-ink-muted">· {statLine(c)}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="felt-panel p-6">
          <h2 className="text-2xl font-extrabold text-chalk">{d.decks.legendariesTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.legendariesText}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {legendaries.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-gold text-xs">
                  {c.name} <span className="font-mono font-normal">{statLine(c)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="felt-panel p-6">
          <h2 className="text-2xl font-extrabold text-chalk">{d.decks.conquestTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.conquestText}</p>
        </section>
      </div>

      <section className="card-ivory mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">{d.decks.submitTitle}</h2>
          <p className="mt-1 text-ink-muted">{d.decks.submitText}</p>
        </div>
        <a className="btn btn-ink" href={`mailto:${contactEmail}?subject=Deck%20OriginsMeta`}>
          {d.decks.submitCta}
        </a>
      </section>
    </div>
  );
}
