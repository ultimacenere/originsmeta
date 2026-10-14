import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { termsLabels } from "@/lib/termsLabels";

/**
 * Termini d'uso (14/10/2026): li chiede la scheda dell'estensione Twitch e valgono per sito, app ed estensione. Testi in
 * src/lib/termsLabels.ts; noindex e fuori dalla sitemap come /privacy, ancore uguali nelle quattro lingue.
 */
export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const t = termsLabels[locale];
  return { ...pageMeta(locale, "/terms", t.title, t.description), robots: { index: false, follow: true } };
}

export default async function TermsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = termsLabels[locale];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.footer.legal}</p>
      <h1 className="t-page mt-2">{t.title}</h1>
      <p className="mt-2 text-sm text-chalk-muted">{t.updated}</p>
      <article className="card-night mt-8 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{t.intro}</p>
        {t.sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-8 scroll-mt-24">
            <h2 className="t-section text-sky">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3">
                {p}
                {s.id === "privacy" ? (
                  <>
                    {" "}
                    <Link className="link-mint" href={href(locale, "/privacy")}>
                      {d.footer.privacy}
                    </Link>
                  </>
                ) : null}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
