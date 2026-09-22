import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { LoginPanel } from "@/components/LoginPanel";
import { loginLabels } from "@/lib/loginLabels";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/login", dict.auth.title, dict.auth.intro), robots: { index: false, follow: true } };
}

/**
 * Pagina di accesso. Il ritorno dopo l'accesso lo decide `next` nell'indirizzo (il tasto "Accedi" dell'header lo
 * porta con sé); senza, si va al profilo. L'elenco "cosa puoi fare con un account" copre le cinque cose che l'account
 * sblocca oggi (21/09/2026): mazzi pubblicati con guida, mazzi salvati in privato (novità), voti, tornei da giocare
 * e tornei da organizzare.
 */
export default async function LoginPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const a = d.auth;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{a.kicker}</p>
      <h1 className="t-page mt-2">{a.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{a.intro}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <LoginPanel next={href(locale, "/account")} labels={loginLabels(d)} locale={locale} />
        <section className="felt-panel p-6" aria-labelledby="login-why">
          <h2 id="login-why" className="kicker text-mint">
            {a.whyTitle}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-chalk">
            {a.benefits.map((b) => (
              <li key={b.text} className="flex gap-3">
                <span aria-hidden="true" className="mt-px font-display font-bold text-mint">
                  ✓
                </span>
                <span>
                  {b.text}
                  {b.isNew ? (
                    <span className="ml-2 inline-block rounded-full bg-mint px-2 py-0.5 align-middle font-mono text-[10px] font-medium uppercase tracking-wider text-ink">
                      {a.newTag}
                    </span>
                  ) : null}
                </span>
              </li>
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
