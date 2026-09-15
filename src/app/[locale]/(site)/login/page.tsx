import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { LoginPanel } from "@/components/LoginPanel";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/login", dict.auth.title, dict.auth.intro), robots: { index: false, follow: true } };
}

export default async function LoginPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const a = d.auth;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.account}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{a.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{a.intro}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <LoginPanel
          next={href(locale, "/account")}
          labels={{
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
        <section className="felt-panel p-6">
          <h2 className="kicker text-mint">{a.whyTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-chalk">
            {a.why.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-chalk-muted">
            {a.privacyNote}{" "}
            <Link href={href(locale, "/privacy")} className="link-mint">
              {d.footer.privacy}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
