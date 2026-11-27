import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { Band, SecHead } from "@/components/analytics/sections/parts";
import { V2Note, V2Slots, type Slot } from "@/components/analytics/sections/V2Slots";

/* Sezione «Luoghi» di Analytics (27/11/2026): i luoghi in campo dal Tracker 2.0, in arrivo con la 0.9. Nessun sito lo fa. */

const SHAPES: Pick<Slot, "status" | "shape">[] = [
  { status: "certain", shape: "grid" },
  { status: "koin", shape: "bars" },
  { status: "certain", shape: "bars" },
  { status: "certain", shape: "grid" },
];

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const V = analyticsSectionsLabels[locale].v2;
  return dropHreflang(pageMeta(locale, "/analytics/locations", `${V.locationsTitle} · Analytics`, V.locationsLead, undefined, { noindex: true }));
}

export default async function LocationsPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const V = analyticsSectionsLabels[locale].v2;
  const [before, after] = V.locationsLink.split("{link}");
  return (
    <Band top tone="stage">
      <SecHead as="h1" title={V.locationsTitle} brief={[V.locationsLead]} />
      <V2Note labels={V} />
      <V2Slots labels={V} slots={V.locationsSlots.map((s, i) => ({ ...s, ...SHAPES[i] }))} />
      <p className="sez-note mt-4">
        {before}
        <Link href={href(locale, "/locations")} className="link-mint">
          {V.locationsLinkText}
        </Link>
        {after}
      </p>
    </Band>
  );
}
