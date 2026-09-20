import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { faqs, suggerimenti } from "@/lib/content/faq";
import { getGuide } from "@/lib/content/guides";
import { getCard } from "@/lib/data/cards";
import { copertura } from "@/lib/faq/retrieve";
import { aiAttiva } from "@/lib/faq/ask";
import { AskBox } from "@/components/AskBox";
import { CardChipList } from "@/components/CardChip";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/**
 * Domande e risposte. Due metà: in alto si può chiedere qualunque cosa e risponde il nostro database
 * per bocca dell'assistente (`/api/ask`); sotto stanno le risposte approvate, che sono testo scritto da noi,
 * nell'HTML statico e nei dati strutturati FAQPage — quelle le legge anche Google.
 *
 * La pagina resta statica: la domanda libera è una chiamata dal browser, non un rendering sul server.
 */

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/faq", dict.faq.title, dict.faq.intro);
}

export default async function FaqPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const lista = faqs[locale];
  const stat = copertura();
  const attiva = aiAttiva();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.faq.title, path: href(locale, "/faq") },
          ]),
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: lista.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />

      <p className="kicker text-mint">{d.faq.kicker}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.faq.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.faq.intro}</p>

      <section className="mt-8">
        <h2 className="sr-only">{d.faq.askTitle}</h2>
        {attiva ? (
          <AskBox
            locale={locale}
            hrefPrefix={href(locale)}
            suggerimenti={suggerimenti[locale]}
            labels={{
              placeholder: d.faq.placeholder,
              send: d.faq.send,
              sending: d.faq.sending,
              suggestions: d.faq.suggestions,
              sources: d.faq.sources,
              disclaimer: d.faq.disclaimer,
              errors: d.faq.errors,
            }}
          />
        ) : (
          <p className="card-night p-5 text-pale-muted">{d.faq.offline}</p>
        )}
        <p className="mt-3 text-xs text-chalk-muted">
          {d.faq.coverage.replace("{cards}", String(stat.carte)).replace("{guides}", String(stat.guide)).replace("{patch}", stat.patch)}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-sky">{d.faq.approvedTitle}</h2>
        <p className="mt-2 text-chalk-muted">{d.faq.approvedIntro}</p>
        <div className="mt-6 space-y-4">
          {lista.map((f) => {
            const carte = (f.cards ?? []).filter((s) => getCard(s));
            const guide = (f.guides ?? []).map((s) => getGuide(locale, s)).filter((g) => g !== undefined);
            return (
              <article key={f.id} id={f.id} className="card-night p-5 sm:p-6">
                <h3 className="font-display text-lg font-extrabold leading-tight text-sky">{f.q}</h3>
                <p className="mt-3 text-pale">{f.a}</p>
                {carte.length ? <div className="mt-4">{<CardChipList slugs={carte} locale={locale} max={6} />}</div> : null}
                {guide.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {guide.map((g) => (
                      <li key={g.slug}>
                        <Link href={href(locale, `/guides/${g.slug}`)} className="btn btn-ghost text-xs">
                          {g.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-10 text-xs text-chalk-muted/70">{d.faq.footer}</p>
    </div>
  );
}
