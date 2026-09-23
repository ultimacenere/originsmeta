import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { GuideSubmitForm } from "@/components/GuideSubmitForm";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // pagina di servizio: fuori dall'indice e dalla sitemap, come /decks/publish
  return { ...pageMeta(locale, "/guides/submit", dict.guideSubmit.title, dict.guideSubmit.description), robots: { index: false, follow: true } };
}

/**
 * "Mandaci la tua guida" (diretta Twitch del 23/09/2026): pagina statica, il modulo lavora nel browser e manda la
 * guida al canale Discord privato dello staff (`src/components/GuideSubmitForm.tsx`, `/api/guide-submission`).
 */
export default async function GuideSubmitPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">
        <Link href={href(locale, "/guides")} className="hover:underline">
          {d.nav.guides}
        </Link>
      </p>
      <h1 className="t-page mt-2">{d.guideSubmit.title}</h1>
      <p className="mt-4 text-chalk-muted">{d.guideSubmit.intro}</p>
      <div className="mt-8">
        <GuideSubmitForm locale={locale} labels={d.guideSubmit.form} guidesHref={href(locale, "/guides")} />
      </div>
    </div>
  );
}
