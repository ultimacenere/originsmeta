import { Suspense, type ReactNode } from "react";
import { href } from "@/lib/i18n";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { fmtInt } from "@/lib/tracker/snapshot";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { loadAllPatches, patchName } from "@/lib/community/analyticsSections";
import { SectionNav } from "@/components/analytics/sections/SectionNav";
import { fill } from "@/components/analytics/sections/parts";
import "@/components/analytics/sections/sections.css";

/*
  Analytics a sezioni (27/11/2026, Pierluigi: "Pagina di oggi, ma meglio", "sotto analytics diverse sezioni, in cui
  inseriamo le analisi"; scelto e rifinito sui prototipi, poi "Sì, portala"). Le pagine di /analytics in un gruppo di rotte:
  Panoramica (/analytics), Leggendarie, Mazzi, Carte, Scontri, Chi sale e chi scende, La partita e Luoghi (i posti per i
  dati del Tracker 2.0). La Crimson Cup (/analytics/crimson-cup) resta fuori dal gruppo e aperta a tutti. Grafica di
  /analytics di sempre (`.an-page`, fasce `.an-band`): sottomenu e patch fermi in alto, poi le fasce di ogni sezione.
  Riservate agli iscritti come la Panoramica (ANALYTICS_SECTIONS in src/lib/membersOnly.ts e matcher di src/proxy.ts).
*/

export default async function SectionsLayout({ children, params }: { children: ReactNode; params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const L = analyticsSectionsLabels[locale];
  const all = await loadAllPatches();
  const patches = all.map((p) => ({ patch: p.patch, label: patchName(p.patch, locale), games: fill(L.nav.patchGames, { n: fmtInt(p.games, locale) }) }));
  return (
    <div className="an-page sez-page">
      <Suspense fallback={<div className="sez-nav" />}>
        <SectionNav base={href(locale, "/analytics")} labels={L.nav} patches={patches} />
      </Suspense>
      {children}
    </div>
  );
}
