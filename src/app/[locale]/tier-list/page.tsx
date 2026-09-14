import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { movers, patches, sagas } from "@/lib/data/cards";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { contactEmail, officialLinks } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list", dict.tier.title, dict.tier.intro);
}

const tierTone: Record<string, string> = {
  S: "bg-gold text-ink",
  A: "bg-mint text-ink",
  B: "bg-ivory text-ink",
  C: "bg-ivory-3 text-ink",
  D: "bg-crimson text-ivory",
};

export default async function TierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const all = movers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.tierList}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.tier.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.tier.intro}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card-ivory p-6">
          <p className="kicker text-crimson-deep">{d.tier.statusKicker}</p>
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
          <h2 className="text-xl font-extrabold text-chalk">{d.tier.tiersTitle}</h2>
          <ul className="mt-4 space-y-2">
            {(["S", "A", "B", "C", "D"] as const).map((t) => (
              <li key={t} className="flex items-center gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-lg font-extrabold ${tierTone[t]}`}>{t}</span>
                <span className="text-chalk-muted">{d.tier.tiers[t]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold text-chalk sm:text-3xl">{d.tier.moversTitle}</h2>
        <p className="mt-2 max-w-2xl text-chalk-muted">{d.tier.moversSub}</p>
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
