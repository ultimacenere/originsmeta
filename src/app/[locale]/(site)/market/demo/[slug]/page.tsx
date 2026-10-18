import type { Metadata } from "next";
import { resolveLocale } from "@/lib/page";
import { MarketItemPage, marketItemMeta } from "@/components/market/MarketPages";

/*
  Scheda di un oggetto della prova del motore (collezione Dreams & Nightmares di Counter-Strike 2, tracker dei prezzi del 17/10/2026).
  ISR, noindex.
*/
// Niente generateStaticParams (18/10/2026): con il Mercato in prova riservata la pagina legge la sessione (marketAccess)
// e una rotta pre-generabile che legge i cookie in produzione risponde 500. Così è dinamica, come il tabellone; quando
// MARKET_PUBLIC si accende torna una pagina con la cache di `revalidate`.
export const revalidate = 300;

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
