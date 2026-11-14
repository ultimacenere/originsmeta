import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { notFound } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { dropHreflang } from "@/lib/community/deckQuality";
import { MEMBERS_ONLY_SECTIONS, membersOnlyPath, type MembersOnlySection } from "@/lib/membersOnly";
import { membersOnlyLabels } from "@/lib/membersOnlyLabels";
import { latestPatch, patchLabel } from "@/lib/data/cards";
import { analyticsDataset } from "@/lib/analyticsSource";
import { AnalyticsSource } from "@/components/analytics/AnalyticsSource";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  Pagina sfocata delle sezioni riservate agli iscritti (03/11/2026, src/lib/membersOnly.ts): src/proxy.ts la mostra al
  posto di /market e /analytics a chi non ha fatto l'accesso, senza cambiare indirizzo. Sotto l'invito c'è solo una sagoma
  sfocata (riquadri e righe finte), mai i dati veri: chi non è iscritto non li riceve nemmeno nell'HTML. Statica.
  Il Mercato è noindex. Analytics dal 09/11/2026 no (difesa SEO/GEO): è l'indirizzo che altri siti citano come fonte dei
  win rate, e Googlebot vede questa pagina. Quindi title e description della pagina vera, hreflang, H1 della fonte, la
  sezione "Fonte e come citarla" e il nodo Dataset, sempre senza un numero vero (solo la patch in corso).
*/
type Params = Promise<{ locale: string; section: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return MEMBERS_ONLY_SECTIONS.map((section) => ({ section }));
}

const asSection = (s: string): MembersOnlySection | null => (MEMBERS_ONLY_SECTIONS as readonly string[]).includes(s) ? (s as MembersOnlySection) : null;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  const section = asSection((await params).section);
  if (!section) notFound();
  if (section === "analytics") return pageMeta(locale, "/analytics", dict.tier.winrate.title, dict.tier.winrate.description);
  return dropHreflang(pageMeta(locale, membersOnlyPath[section], dict.nav[section], membersOnlyLabels[locale].metaDescription, undefined, { noindex: true }));
}

/** Larghezze fisse delle righe finte: la sagoma è uguale per tutti e non cambia a ogni visita. */
const ROWS = [
  [62, 48, 30],
  [54, 40, 36],
  [70, 52, 26],
  [46, 44, 34],
  [58, 36, 30],
  [66, 50, 38],
  [50, 42, 28],
  [60, 46, 32],
];

function Silhouette() {
  return (
    <div aria-hidden="true" className="pointer-events-none select-none blur-[6px] opacity-70">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-night p-4">
            <div className="h-2.5 w-1/2 rounded bg-pale-muted/40" />
            <div className="mt-3 h-6 w-2/3 rounded bg-mint/50" />
          </div>
        ))}
      </div>
      <div className="card-night mt-6 p-4 sm:p-6">
        <div className="h-4 w-1/3 rounded bg-chalk/40" />
        <div className="mt-5 space-y-4">
          {ROWS.map(([a, b, c], i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-9 w-9 shrink-0 rounded-full bg-night-3" />
              <div className="min-w-0 flex-1">
                <div className="h-3 rounded bg-chalk/40" style={{ width: `${a}%` }} />
                <div className="mt-2 h-2 rounded bg-pale-muted/30" style={{ width: `${b}%` }} />
              </div>
              <div className="h-3 shrink-0 rounded bg-gold/50" style={{ width: `${c / 4}rem` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function MembersOnlyPage({ params }: { params: Params }) {
  const { locale, dict } = await resolveLocale(params);
  const section = asSection((await params).section);
  if (!section) notFound();
  const l = membersOnlyLabels[locale];
  const login = `${href(locale, "/login")}?next=${encodeURIComponent(href(locale, membersOnlyPath[section]))}`;
  const analytics = section === "analytics";
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {analytics ? (
        <JsonLd
          data={[
            breadcrumbs([
              { name: "OriginsMeta", path: href(locale) },
              { name: dict.tier.winrate.h1, path: href(locale, "/analytics") },
            ]),
            analyticsDataset(locale),
          ]}
        />
      ) : null}
      {analytics ? <p className="kicker text-mint">{dict.nav.analytics}</p> : null}
      <h1 className={analytics ? "t-page mt-2" : "t-page"}>{analytics ? dict.tier.winrate.h1 : dict.nav[section]}</h1>
      <div className="relative mt-8">
        <Silhouette />
        <div className="absolute inset-0 flex items-start justify-center pt-10 sm:pt-16">
          <section aria-labelledby="members-only-title" className="felt-panel-mint w-full max-w-md p-6 text-center shadow-2xl sm:p-8">
            <p className="kicker flex items-center justify-center gap-2 text-gold">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" stroke="none" />
                <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" strokeLinecap="round" />
              </svg>
              {l.kicker}
            </p>
            <h2 id="members-only-title" className="t-section mt-3">
              {l.title}
            </h2>
            <p className="mt-3 text-sm text-pale">{l.text}</p>
            <Link href={login} className="btn btn-primary mt-6 inline-flex">
              {l.cta}
            </Link>
          </section>
        </div>
      </div>
      {analytics ? (
        <>
          <AnalyticsSource locale={locale} patch={patchLabel(latestPatch, locale)} members className="mt-12" />
          <p className="mt-6 text-sm">
            {dict.tier.winrate.app.notesText}{" "}
            <Link href={href(locale, "/tracker")} className="link-mint font-bold">
              {dict.tier.winrate.app.notesAnchor} →
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
