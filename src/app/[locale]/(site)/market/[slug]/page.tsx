import type { Metadata } from "next";
import { resolveLocale } from "@/lib/page";
import { MarketItemPage, marketItemMeta } from "@/components/market/MarketPages";

/*
  Scheda di un oggetto di Origins TCG sul Mercato di Steam (tracker dei prezzi, 17/10/2026): prezzo, variazioni,
  offerte e grafico dello storico costruito dal sito. ISR, nessuna scheda pregenerata; noindex finché
  MARKET_ITEMS_INDEXABLE è spento (fase 2).
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
  return marketItemMeta(locale, "origins", slug);
}

export default async function MarketItemRoute({ params }: { params: Params }) {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  return <MarketItemPage locale={locale} source="origins" slug={slug} />;
}
