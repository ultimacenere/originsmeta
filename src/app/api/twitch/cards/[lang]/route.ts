import { isLocale, locales } from "@/lib/i18n";
import { extCardTable } from "@/lib/twitchExt/cards";

/**
 * /api/twitch/cards/<lingua>: le carte per l'estensione Twitch "Deck tracker" (13/10/2026, src/lib/twitchExt/cards.ts).
 * Statica: le carte cambiano solo con un deploy. Pubblica e senza dati personali, quindi leggibile da qualunque origine
 * (l'estensione gira su https://<client id>.ext-twitch.tv).
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }): Promise<Response> {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response("Not Found", { status: 404 });
  return Response.json(extCardTable(lang), {
    headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
