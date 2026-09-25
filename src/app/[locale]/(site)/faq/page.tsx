import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { faqs, suggerimenti } from "@/lib/content/faq";
import { getGuide } from "@/lib/content/guides";
import { activeCards, cards, getCard } from "@/lib/data/cards";
import { copertura } from "@/lib/faq/retrieve";
import { aiAttiva } from "@/lib/faq/ask";
import { AskBox } from "@/components/AskBox";
import { CardChipList } from "@/components/CardChip";
import { DiscordButton } from "@/components/DiscordButton";
import { officialLinks } from "@/components/Footer";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/**
 * Domande e risposte. Due metà: in alto si può chiedere qualunque cosa e risponde il nostro database
 * per bocca dell'assistente (`/api/ask`); sotto stanno le risposte approvate, che sono testo scritto da noi,
 * nell'HTML statico e nei dati strutturati FAQPage — quelle le legge anche Google.
 * Con l'assistente spento (piano SEO/GEO del 25/09/2026, GEO-12) la metà in alto sparisce: la pagina apre con le
 * risposte approvate e il riquadro "Non hai trovato la risposta?" (database carte e Discord) scende in fondo.
 *
 * La pagina resta statica: la domanda libera è una chiamata dal browser, non un rendering sul server.
 */

/**
 * ISR: se l'assistente è acceso lo decide `ANTHROPIC_API_KEY`, e una pagina solo statica lo decideva una volta per
 * tutte durante la build. Il 25/09/2026 la chiave messa su Vercel funzionava già nell'API ma la pagina, generata
 * in build, diceva ancora "spento": rigenerandosi sul server al massimo ogni 5 minuti, segue la chiave vera.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Titolo e H1 non promettono l'assistente, che può essere spento (piano SEO del 25/09/2026): in SERP gli argomenti
  // che le risposte approvate coprono, nell'H1 solo il nome della pagina ("Origins TCG FAQ")
  return pageMeta(locale, "/faq", dict.faq.metaTitle, dict.faq.description);
}

export default async function FaqPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const lista = faqs[locale];
  const stat = copertura();
  const attiva = aiAttiva();
  // Le carte che l'assistente legge, dette come le dice il resto del sito: le 122 della Demo 2.0 più le carte create
  // (prima un solo numero, 144, che le sommava e contraddiceva il "122" delle risposte)
  const create = cards.filter((c) => c.status === "active" && c.type === "token").length;

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
      <h1 className="t-page mt-2">{d.faq.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{attiva ? d.faq.intro : d.faq.introOffline}</p>

      {attiva ? (
        <section className="mt-8">
          <h2 className="sr-only">{d.faq.askTitle}</h2>
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
            exits={{ cardsLabel: d.faq.offlineCards, cardsHref: href(locale, "/cards"), discordLabel: d.faq.offlineDiscord, discordHref: officialLinks.discord }}
          />
          {/* Che cosa legge l'assistente */}
          <p className="mt-3 text-xs text-chalk-muted">
            {d.faq.coverage
              .replace("{cards}", String(activeCards.length))
              .replace("{created}", String(create))
              .replace("{guides}", String(stat.guide))
              .replace("{patch}", stat.patch)}
          </p>
        </section>
      ) : null}

      <section className={attiva ? "mt-12" : "mt-8"}>
        <h2 className="t-section">{d.faq.approvedTitle}</h2>
        {/* con l'assistente spento l'intro della pagina dice già che cosa sono queste risposte */}
        {attiva ? <p className="mt-2 text-chalk-muted">{d.faq.approvedIntro}</p> : null}
        <div className="mt-6 space-y-4">
          {lista.map((f) => {
            const carte = (f.cards ?? []).filter((s) => getCard(s));
            const guide = (f.guides ?? []).map((s) => getGuide(locale, s)).filter((g) => g !== undefined);
            return (
              <article key={f.id} id={f.id} className="card-night p-5 sm:p-6">
                <h3 className="t-item leading-tight">{f.q}</h3>
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

      {attiva ? null : (
        // Assistente spento: niente vicolo cieco, ma in fondo e senza parlare dell'assistente; due strade che rispondono
        // comunque (il database carte e il Discord ufficiale)
        <section className="card-night mt-10 p-5 sm:p-6" aria-labelledby="faq-more-title">
          <h2 id="faq-more-title" className="t-item">
            {d.faq.offlineTitle}
          </h2>
          <p className="mt-2 text-pale">{d.faq.offline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={href(locale, "/cards")} className="btn btn-primary">
              {d.faq.offlineCards} →
            </Link>
            <DiscordButton href={officialLinks.discord}>{d.faq.offlineDiscord}</DiscordButton>
          </div>
        </section>
      )}

      <p className="mt-10 text-xs text-chalk-muted/70">{d.faq.footer}</p>
    </div>
  );
}
