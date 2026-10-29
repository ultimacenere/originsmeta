import type { Metadata } from "next";
import Link from "next/link";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { RULES } from "@/lib/deckrules";
import { builderLabels, builderPool } from "@/lib/builderLabels";
import { DeckBuilder } from "@/components/DeckBuilder";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { PageNotes } from "@/components/PageNotes";
import { TheoryCraftTabs } from "@/components/TheoryCraftTabs";
import { contactEmail } from "@/components/Footer";
import { JsonLd, breadcrumbs, webApplication } from "@/components/JsonLd";
import { deckVersionLabels } from "@/lib/deckVersionLabels";
import { THEORY_DECKS_PATH, THEORY_PATH, theoryCards } from "@/lib/theoryCraft";
import { fillTheory, theoryCraftLabels } from "@/lib/theoryCraftLabels";

/**
 * Theory craft (29/10/2026, Pierluigi: "creiamo sotto deck builder la nuova sezione Theory craft dove le persone potranno
 * creare dei deck con anche le carte che non sono ancora uscite"): il deck builder di sempre con il pool allargato alle
 * carte che oggi non sono nel gioco (`builderPool(…, { theory: true })`), segnate con una pastiglia e filtrabili, e con il
 * salvataggio del browser a parte. Pubblicare porta allo stesso modulo dei mazzi singoli: il mazzo che usa una di quelle
 * carte va fra i mazzi theory craft (/theory-craft/decks). Pagina statica come /deck-builder.
 */
export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const t = theoryCraftLabels[locale].builder;
  return pageMeta(locale, THEORY_PATH, t.metaTitle, t.description);
}

export default async function TheoryCraftPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const T = theoryCraftLabels[locale];
  const t = T.builder;
  const pool = builderPool(locale, d, { theory: true });
  const path = href(locale, THEORY_PATH);
  const legendaries = theoryCards.filter((c) => c.legendary).length;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.builder.title, path: href(locale, "/deck-builder") },
            { name: t.title, path },
          ]),
          webApplication({ locale, path, name: t.title, description: t.description, features: [t.rules] }),
        ]}
      />
      <TheoryCraftTabs locale={locale} active="builder" />
      <p className="kicker text-mint">{d.nav.builder}</p>
      <h1 className="t-page mt-2">{t.title}</h1>
      {/* sotto il titolo solo i tasti, come /deck-builder: introduzione e note sui dati stanno sotto lo strumento */}
      <p className="mt-4 flex flex-wrap gap-3">
        <Link href={href(locale, THEORY_DECKS_PATH)} className="btn btn-ghost">
          {t.toDecks} →
        </Link>
        <Link href={href(locale, "/deck-builder")} className="btn btn-ghost">
          {t.toOfficial} →
        </Link>
      </p>

      <div className="mt-6">
        {/* posiziona l'anteprima della carta, anche sulle righe del mazzo e del pool (pannello in position: fixed) */}
        <CardMentionEdges />
        <DeckBuilder
          pool={pool}
          locale={locale}
          contactEmail={contactEmail}
          shareBase={`${siteUrl}${path}`}
          publishHref={href(locale, "/decks/publish")}
          labels={{ ...builderLabels(d), poolHint: t.poolHint, exportGameMissing: t.gameCodeMissing }}
          updateLabels={deckVersionLabels[locale].builder}
          theory={{ pill: t.pill, filter: t.filter, filterAll: t.filterAll, filterGame: t.filterGame, filterTheory: t.filterTheory }}
        />
      </div>

      <PageNotes>
        <p className="max-w-3xl text-chalk-muted">{t.intro}</p>
        <p className="felt-panel-mint mt-5 flex max-w-4xl flex-wrap items-baseline gap-x-3 gap-y-1 p-4 text-sm text-chalk">
          <span className="kicker text-mint">{t.dataKicker}</span>
          <span>{fillTheory(t.dataNote, { n: theoryCards.length, legendaries })}</span>
        </p>
        <section aria-labelledby="theory-rules-title" className="felt-panel mt-4 max-w-4xl p-4 sm:p-5">
          <h2 id="theory-rules-title" className="t-section">
            {d.builder.rulesTitle}
          </h2>
          <p className="mt-3 text-sm text-chalk">{t.rules}</p>
          <p className="mt-2 text-xs text-chalk-muted">{d.builder.rulesSource}</p>
        </section>
        <p className="mt-6 text-xs text-chalk-muted">
          {RULES.deckSize} = {RULES.legendarySlots} + {RULES.distinctCards} × {RULES.copiesPerCard} · {d.common.notAffiliated}
        </p>
      </PageNotes>
    </div>
  );
}
