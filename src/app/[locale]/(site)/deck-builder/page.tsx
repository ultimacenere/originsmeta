import type { Metadata } from "next";
import Link from "next/link";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { RULES } from "@/lib/deckrules";
import { builderLabels, builderPool } from "@/lib/builderLabels";
import { DeckBuilder } from "@/components/DeckBuilder";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { contactEmail } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/deck-builder", dict.builder.title, dict.builder.description);
}

export default async function DeckBuilderPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const pool = builderPool(locale, d);
  const b = d.builder;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{b.title}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{b.intro}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <section className="felt-panel p-4">
          <h2 className="kicker text-chalk-muted">{b.rulesTitle}</h2>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-chalk">
            {b.rules.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-chalk-muted/80">{b.rulesSource}</p>
        </section>
        <Link href={href(locale, "/decks")} className="btn btn-ghost self-center">
          {d.decks.title} →
        </Link>
      </div>

      <div className="mt-8">
        {/* posiziona l anteprima della carta, che nel pool sta in una lista con scorrimento */}
        <CardMentionEdges />
        <DeckBuilder
          pool={pool}
          contactEmail={contactEmail}
          shareBase={`${siteUrl}${href(locale, "/deck-builder")}`}
          publishHref={href(locale, "/decks/publish")}
          labels={builderLabels(d)}
        />
      </div>
      <p className="mt-6 text-xs text-chalk-muted/70">
        {RULES.deckSize} = {RULES.legendarySlots} + {RULES.distinctCards} × {RULES.copiesPerCard} · {d.common.notAffiliated}
      </p>
    </div>
  );
}
