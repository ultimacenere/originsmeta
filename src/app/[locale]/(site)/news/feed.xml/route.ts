import { isLocale, locales } from "@/lib/i18n";
import { newsFeedXml } from "@/lib/newsFeed";

/**
 * /<lingua>/news/feed.xml: il feed RSS delle news in quella lingua (src/lib/newsFeed.ts). Statico: le news cambiano
 * solo con un deploy, e alla build `public/` c'è per leggere misura e peso delle copertine. Il segmento `feed.xml`
 * vince su `[slug]`, quindi nessuna news può chiamarsi così.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }): Promise<Response> {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not Found", { status: 404 });
  return new Response(newsFeedXml(locale), { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
