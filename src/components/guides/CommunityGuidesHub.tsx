"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Una scheda della sezione, già pronta da mostrare: testi e classi li prepara la rotta /api/community-guides. */
export type HubGuide = {
  id: string;
  href: string;
  title: string;
  /** lingua del titolo quando non è quella della pagina (il titolo non si traduce) */
  titleLang?: string;
  summary: string;
  summaryLang?: string;
  /** categoria · minuti di lettura · data */
  kicker: string;
  /** "di {nome}" */
  by: string;
  role: { label: string; className: string } | null;
  cover: { src: string; width: number; height: number };
};

/** La risposta della rotta, per lingua: le prime guide indicizzabili in quella lingua e quante sono in tutto. */
export type HubGuides = Record<string, { total: number; guides: HubGuide[] }>;

/**
 * Sezione "Guide della community" di /guides (pacchetto GUIDE, 27/09/2026; revisione dello stesso giorno). /guides è una
 * pagina editoriale e resta statica (CLAUDE.md: "Le pagine editoriali restano statiche"): le ultime guide della community
 * le chiede il browser a /api/community-guides, come la striscia del calendario chiede /api/calendar e l'invito della
 * home /api/tier-list-counts. Niente se non ce ne sono, se la rotta non risponde o senza JavaScript: l'elenco completo e
 * indicizzato resta /guides/community (ISR, in sitemap), a cui la sezione porta.
 */
export function CommunityGuidesHub({
  locale,
  labels,
  allHref,
  url = "/api/community-guides",
}: {
  locale: string;
  labels: { title: string; intro: string; all: string; count: string };
  allHref: string;
  url?: string;
}) {
  const [data, setData] = useState<{ total: number; guides: HubGuide[] } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: HubGuides | null) => {
        const mine = json?.[locale];
        if (alive && mine && Array.isArray(mine.guides) && typeof mine.total === "number") setData(mine);
      })
      .catch(() => {
        /* niente sezione: resta la pagina statica */
      });
    return () => {
      alive = false;
    };
  }, [url, locale]);

  if (!data?.guides.length) return null;
  return (
    <section className="mt-12 scroll-mt-24" aria-labelledby="community-guides-title" id="community-guides">
      <h2 id="community-guides-title" className="t-section">
        {labels.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{labels.intro}</p>
      <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {data.guides.map((g) => (
          <li key={g.id} className="min-w-0">
            <Link href={g.href} className="card-night card-night-hover flex h-full min-w-0 flex-col overflow-hidden" prefetch={false}>
              {/* copertina del media kit, intera in 16:9 e senza nulla sopra (GuideCover) */}
              <div className="w-full overflow-hidden border-b-[3px] border-sky bg-night-2">
                <Image
                  src={g.cover.src}
                  alt=""
                  width={g.cover.width}
                  height={g.cover.height}
                  sizes="(max-width: 768px) 92vw, 30vw"
                  loading="lazy"
                  className="block aspect-[16/9] h-auto w-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <p className="kicker text-pale-muted">{g.kicker}</p>
                <h3 className="t-item mt-1 break-words leading-tight" lang={g.titleLang}>
                  {g.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 break-words text-sm text-pale-muted" lang={g.summaryLang}>
                  {g.summary}
                </p>
                <p className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs text-pale">
                  <span className="truncate">{g.by}</span>
                  {g.role ? <span className={`stat-pill px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${g.role.className}`}>{g.role.label}</span> : null}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href={allHref} className="font-display text-sm font-bold text-mint hover:underline">
          {labels.all} ({labels.count.replace("{n}", String(data.total))}) →
        </Link>
      </p>
    </section>
  );
}
