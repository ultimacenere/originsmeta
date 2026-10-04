import type { Metadata } from "next";
import { Suspense } from "react";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cards } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { deckSetLabels } from "@/lib/deckSetLabels";
import { loginLabels } from "@/lib/loginLabels";
import { videoFormLabels } from "@/lib/videoLabels";
import { DeckSetForm, type SetPoolCard } from "@/components/DeckSetForm";
import { DeckSectionTabs } from "@/components/DeckSectionTabs";

/** Dopo la pubblicazione la guida si traduce dentro `after()`, come /decks/publish: la funzione deve vivere abbastanza. */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = deckSetLabels[locale].form;
  return { ...pageMeta(locale, "/decks/tournament/publish", L.publishTitle, L.publishIntro), robots: { index: false, follow: true } };
}

/**
 * Pubblicazione di un mazzo torneo (04/10/2026). Pagina statica: i tre mazzi li legge il modulo nel browser (hash del
 * deck builder, `?decks=` dopo l'accesso, trio in attesa o modalità Torneo del deck builder), dentro un <Suspense>
 * perché usa useSearchParams.
 */
export default async function PublishDeckSetPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const S = deckSetLabels[locale];
  const pool: SetPoolCard[] = cards.filter((c) => c.type !== "token").map((c) => ({ slug: c.slug, name: c.name }));
  const archetypes = Object.entries(archetypeLabels).map(([id, l]) => [id, l[locale]] as [string, string]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <DeckSectionTabs locale={locale} active="tournament" />
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="t-page mt-2">{S.form.publishTitle}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{S.form.publishIntro}</p>
      <div className="mt-8">
        <Suspense
          fallback={
            <p className="card-night p-6 text-pale-muted" aria-busy="true">
              …
            </p>
          }
        >
          <DeckSetForm
            locale={locale}
            mode="create"
            pool={pool}
            archetypes={archetypes}
            labels={S.form}
            deckLetterLabel={S.page.deckLetter}
            mediaLabels={videoFormLabels(locale)}
            loginLabels={loginLabels(d)}
            builderHref={href(locale, "/deck-builder")}
            publishPath={href(locale, "/decks/tournament/publish")}
          />
        </Suspense>
      </div>
    </div>
  );
}
