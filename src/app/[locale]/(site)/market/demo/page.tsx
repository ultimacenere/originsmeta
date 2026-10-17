import type { Metadata } from "next";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { MarketBoardPage, marketBoardMeta } from "@/components/market/MarketPages";

/*
  Prova del motore del tracker dei prezzi (17/10/2026) su un gioco già sul Mercato di Steam (dal 18/10/2026 la
  collezione Dreams & Nightmares di Counter-Strike 2, fonte `standin` di src/lib/market/market.ts), finché non apre quello di Origins TCG. Noindex, fuori da hreflang
  e sitemap; la pagina lo dice in cima.
*/
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return marketBoardMeta(locale, "standin");
}

export default async function MarketDemoPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  return <MarketBoardPage locale={locale} source="standin" />;
}
