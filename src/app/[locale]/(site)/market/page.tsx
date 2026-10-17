import type { Metadata } from "next";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { MarketBoardPage, marketBoardMeta } from "@/components/market/MarketPages";

/*
  Prezzi di Origins TCG sul Mercato della Comunità di Steam (tracker dei prezzi, 17/10/2026; Pierluigi: "il tool che
  risulterà un gamechanger è un tracker dei prezzi delle carte in tempo reale"). Finché il mercato di Origins è chiuso
  la pagina dice "in arrivo" e porta alla prova del motore (/market/demo); dal primo oggetto in vendita è il tabellone.
  ISR: il cron /api/cron/market scrive ogni 10 minuti, la pagina si rigenera al massimo ogni 5. Tutto in
  src/components/market/MarketPages.tsx.
*/
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return marketBoardMeta(locale, "origins");
}

export default async function MarketPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  return <MarketBoardPage locale={locale} source="origins" />;
}
