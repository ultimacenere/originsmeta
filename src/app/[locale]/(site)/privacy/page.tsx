import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/privacy", dict.privacy.title, dict.privacy.body.slice(0, 150)), robots: { index: false, follow: true } };
}

export default async function PrivacyPage({ params }: { params: LocaleParams }) {
  const { dict: d } = await resolveLocale(params);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.footer.legal}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-mint">{d.privacy.title}</h1>
      <article className="card-night mt-8 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{d.privacy.body}</p>
        <p className="mt-6">{d.privacy.accounts}</p>
        <p className="mt-6">{d.privacy.cookies}</p>
      </article>
    </div>
  );
}
