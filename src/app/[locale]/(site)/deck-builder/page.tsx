import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { RULES } from "@/lib/deckrules";
import { cardsVerified, latestPatch, patches } from "@/lib/data/cards";
import { fill } from "@/lib/tournament/types";
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
      <h1 className="t-page mt-2">{b.title}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{b.intro}</p>

      {/* Disclaimer sui dati (richiesta di Pierluigi del 22/09/2026): a che versione del gioco sono aggiornate le carte */}
      <p className="felt-panel-mint mt-5 flex max-w-4xl flex-wrap items-baseline gap-x-3 gap-y-1 p-4 text-sm text-chalk">
        <span className="kicker text-mint">{b.dataKicker}</span>
        <span>
          {fill(b.dataNotice, {
            date: formatDate(locale, cardsVerified.date),
            count: String(cardsVerified.count),
            patchDate: formatDate(locale, patches[latestPatch].date),
          })}
        </span>
        {patches[latestPatch].news ? (
          <Link href={href(locale, `/news/${patches[latestPatch].news}`)} className="font-bold text-mint hover:underline">
            {d.tier.readPatchNotes} →
          </Link>
        ) : null}
      </p>

      {/* Gerarchia dei titoli: H1 della pagina, H2 per le regole e per le due colonne del builder (Il tuo mazzo,
          Carte), H3 dentro il mazzo. Prima le regole erano un occhiello da 11,8 px sotto H3 da 18 px. */}
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <section aria-labelledby="deck-rules-title" className="felt-panel p-4 sm:p-5">
          <h2 id="deck-rules-title" className="t-section">
            {b.rulesTitle}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-chalk">
            {b.rules.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-chalk-muted">{b.rulesSource}</p>
        </section>
        <Link href={href(locale, "/decks")} className="btn btn-ghost self-center justify-self-start md:justify-self-auto">
          {d.decks.title} →
        </Link>
      </div>

      <div className="mt-8">
        {/* posiziona l'anteprima della carta, anche sulle righe del mazzo e del pool (pannello in position: fixed) */}
        <CardMentionEdges />
        <DeckBuilder
          pool={pool}
          locale={locale}
          contactEmail={contactEmail}
          shareBase={`${siteUrl}${href(locale, "/deck-builder")}`}
          publishHref={href(locale, "/decks/publish")}
          labels={builderLabels(d)}
        />
      </div>
      <p className="mt-6 text-xs text-chalk-muted">
        {RULES.deckSize} = {RULES.legendarySlots} + {RULES.distinctCards} × {RULES.copiesPerCard} · {d.common.notAffiliated}
      </p>
    </div>
  );
}
