import type { Metadata } from "next";
import Link from "next/link";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { activeCards, latestPatch, patchLabel } from "@/lib/data/cards";
import { draftLabels } from "@/lib/draftLabels";
import { DRAFT_FORMATS } from "@/lib/draft/engine";
import { draftPool } from "@/lib/draft/pool";
import { DraftTable, type DraftUiCard } from "@/components/draft/DraftTable";
import { PageNotes } from "@/components/PageNotes";
import { JsonLd, breadcrumbs, webApplication } from "@/components/JsonLd";
import { fill } from "@/lib/tournament/types";

/*
  Draft di OriginsMeta (02/10/2026, Pierluigi: "facciamo un draft da zero MIGLIORE del loro" e "abbiamo un cervello
  di gioco, usiamolo per fare un bot incazzato nero fortissimo"). Fase 1: tre formati contro il Cervello, tutto nel
  browser, senza account; a fine draft codice del gioco e deck builder. La pagina è statica: il pool delle carte arriva
  nell'HTML già ridotto a quello che serve al tavolo (niente database carte nel bundle del browser).
  Come le altre pagine degli strumenti (29/09/2026), sotto il titolo solo lo strumento e i testi in fondo.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const x = draftLabels[locale];
  return pageMeta(locale, "/draft", x.meta.title, x.meta.description);
}

export default async function DraftPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const x = draftLabels[locale];
  const path = href(locale, "/draft");
  const pool = draftPool();
  const bySlug = new Map(activeCards.map((c) => [c.slug, c]));
  const cards: DraftUiCard[] = pool.map((p) => {
    const c = bySlug.get(p.slug)!;
    return { ...p, name: c.name, key: c.key, image: c.image, thumb: c.thumb, ability: c.ability?.[locale] };
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.nav.builder, path: href(locale, "/deck-builder") },
            { name: x.meta.breadcrumb, path },
          ]),
          webApplication({ locale, path, name: x.h1, description: x.meta.description, features: DRAFT_FORMATS.map((f) => `${x.formats[f].name}: ${x.formats[f].tagline}`) }),
        ]}
      />
      <p className="kicker text-mint">{x.kicker}</p>
      <h1 className="t-page mt-2">{x.h1}</h1>
      <p className="mt-4">
        <Link href={href(locale, "/deck-builder")} className="btn btn-ghost">
          {d.nav.builder} →
        </Link>
      </p>

      <div className="mt-6">
        <DraftTable
          cards={cards}
          labels={x}
          builderHref={href(locale, "/deck-builder")}
          pageUrl={`${siteUrl}${path}`}
          roomBase={href(locale, "/draft/r")}
          loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
        />
      </div>

      <PageNotes>
        <p className="max-w-3xl text-chalk-muted">{x.notes.intro}</p>
        <section aria-labelledby="draft-formats" className="mt-8 max-w-4xl">
          <h2 id="draft-formats" className="t-section">
            {x.notes.formatsTitle}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {DRAFT_FORMATS.map((f) => (
              <div key={f} className="felt-panel p-4">
                <h3 className="t-panel text-sky">{x.formats[f].name}</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-chalk">
                  {x.formats[f].rules.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="draft-bot" className="mt-8 max-w-3xl">
          <h2 id="draft-bot" className="t-section">
            {x.notes.botTitle}
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-chalk">
            {x.notes.bot.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="draft-pool" className="mt-8 max-w-3xl">
          <h2 id="draft-pool" className="t-section">
            {x.notes.poolTitle}
          </h2>
          <p className="mt-3 text-sm text-chalk">{fill(x.notes.pool, { count: cards.length, patch: patchLabel(latestPatch, locale) })}</p>
          <h2 className="t-section mt-8">{x.notes.playTitle}</h2>
          <p className="mt-3 text-sm text-chalk">{x.notes.play}</p>
        </section>
        <p className="mt-6 text-xs text-chalk-muted">{d.common.notAffiliated}</p>
      </PageNotes>
    </div>
  );
}
