import type { Metadata } from "next";
import Link from "next/link";
import { locale as rootLocale } from "next/root-params";
import { getDictionary, href, isLocale, defaultLocale } from "@/lib/i18n";
import { notFoundTitle } from "./[...rest]/notFoundHtml";

/**
 * Metadati delle 404 dentro le lingue (RIV-02, TOOL-10: Ondata 1 del 25/09/2026). Si applicano a ogni `notFound()`
 * del gruppo (site): una carta, una news, un mazzo o un profilo che non esistono. Vengono per ultimi e sostituiscono
 * quelli della home ereditati dal layout: titolo neutro nella lingua ("404 · Página no encontrada · OriginsMeta",
 * lo stesso della route `[...rest]`), descrizione nella lingua, nessun canonical né hreflang, nessuna anteprima
 * social della home e un solo meta robots: il `noindex` che Next aggiunge da sé a ogni risposta 404 (`robots: null`
 * toglie l'"index, follow" del layout, che prima conviveva con il noindex).
 * Limite noto di Next 16.3: per un notFound() lanciato da una pagina il server manda il guscio `__next_error__`
 * (senza lang né testo) e questo componente lo disegna solo il browser. Gli indirizzi che non esistono affatto non
 * passano di qui: li serve la route `[...rest]/route.ts`, con l'HTML completo.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const d = getDictionary(locale);
  return {
    title: { absolute: notFoundTitle(locale) },
    description: d.notFound.text,
    alternates: null,
    robots: null,
    openGraph: null,
    twitter: null,
  };
}

export default async function NotFound() {
  const raw = await rootLocale();
  const locale = typeof raw === "string" && isLocale(raw) ? raw : defaultLocale;
  const d = getDictionary(locale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="kicker text-mint">404</p>
      <h1 className="t-page mt-3">{d.notFound.title}</h1>
      <p className="mt-4 text-chalk-muted">{d.notFound.text}</p>
      <p className="mt-8 flex justify-center gap-3">
        <Link className="btn btn-primary" href={href(locale)}>{d.notFound.cta}</Link>
        <Link className="btn btn-ghost" href={href(locale, "/cards")}>{d.nav.cards}</Link>
      </p>
    </div>
  );
}
