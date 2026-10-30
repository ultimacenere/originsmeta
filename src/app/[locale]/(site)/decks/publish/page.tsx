import type { Metadata } from "next";
import { Suspense } from "react";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { PublishDeckForm, type PoolCard } from "@/components/PublishDeckForm";
import { loginLabels } from "@/lib/loginLabels";
import { videoFormLabels } from "@/lib/videoLabels";
import { deckArtFormLabels } from "@/lib/deckArtLabels";
import { publishPool } from "@/lib/builderLabels";
import { theoryCraftLabels } from "@/lib/theoryCraftLabels";

/**
 * Durata massima delle Server Action di questa pagina: dopo la pubblicazione la guida si traduce nelle altre
 * lingue dentro `after()` (src/lib/community/translate.ts), che vive quanto la funzione. Due traduzioni in
 * parallelo stanno di solito sotto il mezzo minuto; il margine copre le guide più lunghe.
 */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/decks/publish", dict.community.publishTitle, dict.community.publishIntro), robots: { index: false, follow: true } };
}

/**
 * Pagina statica: il mazzo lo legge il modulo nel browser (`?deck=`, hash, salvataggio locale o codice
 * incollato), così leggere la query sul server non rende la pagina dinamica. Il modulo legge ?deck e ?draft
 * con useSearchParams, che in una pagina statica richiede un confine <Suspense>.
 */
export default async function PublishPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // le carte del gioco più quelle del Theory craft (29/10/2026): un mazzo che ne usa una va fra i mazzi theory craft
  const pool: PoolCard[] = publishPool();
  const archetypes = Object.entries(archetypeLabels).map(([id, l]) => [id, l[locale]] as [string, string]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="t-page mt-2">{d.community.publishTitle}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{d.community.publishIntro}</p>
      <div className="mt-8">
        <Suspense
          fallback={
            <p className="card-night p-6 text-pale-muted" aria-busy="true">
              …
            </p>
          }
        >
          <PublishDeckForm
            locale={locale}
            mode="create"
            pool={pool}
            archetypes={archetypes}
            labels={d.community}
            mediaLabels={videoFormLabels(locale)}
            artLabels={deckArtFormLabels(locale)}
            builderHref={href(locale, "/deck-builder")}
            publishPath={href(locale, "/decks/publish")}
            loginLabels={loginLabels(d)}
            theoryNotice={theoryCraftLabels[locale].publishNotice}
          />
        </Suspense>
      </div>
    </div>
  );
}
