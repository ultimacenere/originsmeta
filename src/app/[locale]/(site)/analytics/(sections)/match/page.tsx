import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { Band, SecHead } from "@/components/analytics/sections/parts";
import { V2Note, V2Slots, type Slot } from "@/components/analytics/sections/V2Slots";

/* Sezione «La partita» di Analytics (27/11/2026): i dati del Tracker 2.0 sul ritmo della partita, in arrivo con la 0.9. */

const SHAPES: Pick<Slot, "status" | "shape">[] = [
  { status: "certain", shape: "line" },
  { status: "certain", shape: "bars" },
  { status: "certain", shape: "bars" },
  { status: "koin", shape: "grid" },
  { status: "koin", shape: "split" },
  { status: "certain", shape: "bars" },
];

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const V = analyticsSectionsLabels[locale].v2;
  return dropHreflang(pageMeta(locale, "/analytics/match", `${V.matchTitle} · Analytics`, V.matchLead, undefined, { noindex: true }));
}

export default async function MatchPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const V = analyticsSectionsLabels[locale].v2;
  return (
    <Band top tone="stage">
      <SecHead as="h1" title={V.matchTitle} brief={[V.matchLead]} />
      <V2Note labels={V} />
      <V2Slots labels={V} slots={V.matchSlots.map((s, i) => ({ ...s, ...SHAPES[i] }))} />
    </Band>
  );
}
