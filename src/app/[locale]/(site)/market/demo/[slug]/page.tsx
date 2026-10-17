import type { Metadata } from "next";
import { resolveLocale } from "@/lib/page";
import { MarketItemPage, marketItemMeta } from "@/components/market/MarketPages";

/*
  Scheda di un oggetto della prova del motore (gli oggetti di Steam di Hades, tracker dei prezzi del 17/10/2026).
  ISR, noindex.
*/
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  return marketItemMeta(locale, "standin", slug);
}

export default async function MarketDemoItemRoute({ params }: { params: Params }) {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  return <MarketItemPage locale={locale} source="standin" slug={slug} />;
}
