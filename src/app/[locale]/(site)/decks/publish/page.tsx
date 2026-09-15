import type { Metadata } from "next";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cards } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { PublishDeckForm, type PoolCard } from "@/components/PublishDeckForm";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/decks/publish", dict.community.publishTitle, dict.community.publishIntro), robots: { index: false, follow: true } };
}

export default async function PublishPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const pool: PoolCard[] = cards.filter((c) => c.status === "active" && c.type !== "token").map((c) => ({ slug: c.slug, name: c.name, legendary: Boolean(c.legendary) }));
  const archetypes = Object.entries(archetypeLabels).map(([id, l]) => [id, l[locale]] as [string, string]);
  const a = d.auth;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.community.publishTitle}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{d.community.publishIntro}</p>
      <div className="mt-8">
        <PublishDeckForm
          locale={locale}
          mode="create"
          pool={pool}
          archetypes={archetypes}
          labels={d.community}
          builderHref={href(locale, "/deck-builder")}
          publishPath={href(locale, "/decks/publish")}
          loginLabels={{
            discord: a.discord,
            or: a.or,
            email: a.email,
            emailPlaceholder: a.emailPlaceholder,
            magicLink: a.magicLink,
            sending: a.sending,
            sent: a.sent,
            error: a.error,
            providerError: a.providerError,
            rateLimited: a.rateLimited,
            disabled: a.disabled,
            backHint: a.backHint,
          }}
        />
      </div>
    </div>
  );
}
