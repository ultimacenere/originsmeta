import { getDictionary, href, isLocale, localeNames, locales, type Locale } from "@/lib/i18n";
import { NOT_FOUND_TITLE, notFoundHtml, notFoundTitle, type NotFoundPage } from "./notFoundHtml";

/**
 * Indirizzi che non esistono dentro le lingue (/es/pagina-inesistente, /it/cards/a/b…): rispondono 404 con una
 * pagina HTML completa nella lingua dell'indirizzo (RIV-02, TOOL-10: Ondata 1 del 25/09/2026). Prima qui c'era una
 * page.tsx che chiamava notFound(), e il server mandava il guscio `__next_error__` senza lang né testo (il perché
 * sta in `notFoundHtml.ts`). Una route non passa dal layout: niente header e footer del sito, quindi la pagina porta
 * da sé una riga di navigazione e la dicitura del footer.
 * Le 404 delle pagine di dettaglio (una carta, una news, un mazzo che non esistono) passano ancora da notFound():
 * restano col guscio, ma con i metadati puliti di `../not-found.tsx` (limite noto di Next 16.3).
 * Una lingua sconosciuta (/xx/pagina) riceve il testo nelle tre lingue, come la 404 globale. Una sezione vera senza
 * lingua (/cards/merlin, /news/<slug>, /faq) qui non arriva: dal 25/09/2026 next.config.ts la porta alla stessa pagina
 * nella lingua del browser (`sectionRedirects`), prima di ogni rotta.
 */

function pageFor(locale: Locale): NotFoundPage {
  const d = getDictionary(locale);
  return {
    lang: locale,
    title: notFoundTitle(locale),
    description: d.notFound.text,
    blocks: [{ lang: locale, heading: d.notFound.title, text: d.notFound.text }],
    actions: [
      { href: href(locale), label: d.notFound.cta, primary: true },
      { href: href(locale, "/cards"), label: d.nav.cards },
    ],
    nav: [
      { href: href(locale, "/news"), label: d.nav.news },
      { href: href(locale, "/tier-list"), label: d.nav.tierList },
      { href: href(locale, "/guides"), label: d.nav.guides },
      { href: href(locale, "/decks"), label: d.nav.decks },
      { href: href(locale, "/deck-builder"), label: d.nav.builder },
    ],
    disclaimer: d.footer.disclaimer,
  };
}

function pageForUnknownLocale(): NotFoundPage {
  const en = getDictionary("en");
  return {
    lang: "en",
    title: "404 · OriginsMeta",
    description: locales.map((l) => NOT_FOUND_TITLE[l]).join(" · "),
    blocks: locales.map((l) => {
      const d = getDictionary(l);
      return { lang: l, heading: d.notFound.title, text: d.notFound.text };
    }),
    actions: locales.map((l, i) => ({ href: href(l), label: localeNames[l], primary: i === 0 })),
    nav: [],
    disclaimer: en.footer.disclaimer,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; rest: string[] }> }) {
  const { locale } = await params;
  const page = isLocale(locale) ? pageFor(locale) : pageForUnknownLocale();
  return new Response(notFoundHtml(page), {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
