import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { movers, patches, sagas } from "@/lib/data/cards";
import { getDeck, archetypeLabels } from "@/lib/data/decks";
import { tierIds, tierList, type TierId, type TierSection } from "@/lib/data/tierlist";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardChip } from "@/components/CardChip";
import { contactEmail, officialLinks } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list", dict.tier.title, dict.tier.intro);
}

const tierTone: Record<TierId, string> = {
  S: "bg-gold text-ink",
  A: "bg-mint text-ink",
  B: "bg-ivory text-ink",
  C: "bg-ivory-3 text-ink",
  D: "bg-crimson text-ivory",
};

export default async function TierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const all = movers();

  const renderEntry = (section: TierSection, slug: string) => {
    if (section.id === "decks") {
      const deck = getDeck(slug);
      if (!deck) return null;
      return (
        <Link key={slug} href={href(locale, `/decks/${deck.slug}`)} className="card-chip !grid-cols-1">
          <span className="min-w-0">
            <span className="block font-display text-[0.85rem] font-bold leading-tight">{deck.name}</span>
            <span className="block font-mono text-[11px] text-ink-muted">{archetypeLabels[deck.archetype][locale]}</span>
          </span>
        </Link>
      );
    }
    return <CardChip key={slug} slug={slug} locale={locale} />;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.tierList}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.tier.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.tier.intro}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card-ivory p-6">
          <p className="kicker text-crimson-deep">
            {d.tier.statusKicker} · {d.common.updated} {formatDate(locale, tierList.updated)}
          </p>
          <p className="mt-2 text-lg font-bold text-ink">{d.tier.statusText}</p>
          <h2 className="mt-6 text-xl font-extrabold text-ink">{d.tier.methodTitle}</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink">
            {d.tier.method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-muted">
            {d.tier.ctaText}{" "}
            <a className="text-crimson-deep underline" href={officialLinks.discord} rel="noopener">
              Discord
            </a>{" "}
            · <a className="text-crimson-deep underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </section>
        <section className="felt-panel p-6">
          <ul className="space-y-2">
            {tierIds.map((t) => (
              <li key={t} className="flex items-center gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-lg font-extrabold ${tierTone[t]}`}>{t}</span>
                <span className="text-chalk-muted">{d.tier.tiers[t]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {tierList.sections.map((section) => {
        const meta = d.tier.sections[section.id];
        return (
          <section key={section.id} id={section.id} className="mt-14 scroll-mt-24">
            <h2 className="text-2xl font-extrabold text-chalk sm:text-3xl">{meta.title}</h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">{meta.text}</p>
            <div className="mt-5 overflow-hidden rounded-xl border border-felt-line">
              {tierIds.map((t) => (
                <div key={t} className="grid grid-cols-[64px_1fr] border-b border-felt-line/70 last:border-b-0">
                  <div className={`flex items-center justify-center font-display text-2xl font-extrabold ${tierTone[t]}`}>{t}</div>
                  <div className="flex min-h-16 flex-wrap items-center gap-2 bg-felt-deep/60 p-3">
                    {section.tiers[t].length ? section.tiers[t].map((slug) => renderEntry(section, slug)) : <span className="font-mono text-xs text-chalk-muted/60">—</span>}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[64px_1fr] border-t border-felt-line">
                <div className="flex items-center justify-center bg-felt-soft font-mono text-[10px] uppercase tracking-wider text-chalk-muted">n/d</div>
                <div className="flex min-h-16 flex-wrap items-center gap-2 bg-felt-deep/40 p-3">
                  <span className="kicker mr-2 text-chalk-muted">{d.common.unranked}</span>
                  {section.unranked.length ? (
                    section.unranked.map((slug) => renderEntry(section, slug))
                  ) : (
                    <Link href="#tracker" className="text-sm text-mint hover:underline">
                      {d.tier.trackerTitle} ↓
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section id="tracker" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-extrabold text-chalk sm:text-3xl">{d.tier.trackerTitle}</h2>
        <p className="mt-2 max-w-2xl text-chalk-muted">{d.tier.trackerSub}</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-felt-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-felt-deep text-left">
              <tr>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.nav.cards}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.saga}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.patch}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.stats}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.lastChange}</th>
              </tr>
            </thead>
            <tbody>
              {all.map(({ card, change }) => (
                <tr key={`${card.slug}-${change.patch}`} className="border-t border-felt-line/70 bg-ivory text-ink">
                  <td className="px-4 py-3 font-bold">
                    <Link href={href(locale, `/cards/${card.slug}`)} className="hover:underline">
                      {card.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{sagas[card.saga][locale]}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">
                    {change.patch}
                    <span className="block text-[11px]">{formatDate(locale, patches[change.patch].date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatDelta from={change.from} to={change.to} />
                  </td>
                  <td className="px-4 py-3">
                    <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
                    <span className="mt-1 block text-xs text-ink-muted">{change.note[locale]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
