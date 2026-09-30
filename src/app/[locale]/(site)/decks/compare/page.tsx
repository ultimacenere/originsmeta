import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cards } from "@/lib/data/cards";
import { deckCompareLabels } from "@/lib/deckCompareLabels";
import { DeckCompare, type CompareCatalogCard } from "@/components/DeckCompare";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  Confronto fra due mazzi (30/09/2026, dal confronto con i siti concorrenti). Pagina statica: i due mazzi si leggono nel
  browser (DeckCompare), la pagina porta solo il catalogo delle carte (slug, ID ufficiale, nome, costo) per riconoscere
  i codici del gioco e mostrare i nomi. Anche le carte rimosse: un mazzo vecchio può ancora averle.
*/
export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = deckCompareLabels[locale];
  return pageMeta(locale, "/decks/compare", L.metaTitle, L.description);
}

export default async function DeckComparePage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = deckCompareLabels[locale];
  const catalog: CompareCatalogCard[] = cards
    .filter((c) => c.type !== "token")
    .map((c) => ({ slug: c.slug, key: c.key, legendary: Boolean(c.legendary), name: c.name, mana: c.mana }));
  const path = href(locale, "/decks/compare");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbs([
          { name: "OriginsMeta", path: href(locale) },
          { name: d.decks.title, path: href(locale, "/decks") },
          { name: L.title, path },
        ])}
      />
      <p className="text-sm">
        <Link href={href(locale, "/decks")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.decks.title}
        </Link>
      </p>
      <h1 className="t-page mt-4">{L.title}</h1>
      <p className="mt-3 max-w-3xl text-chalk-muted">{L.intro}</p>
      <div className="mt-6">
        <DeckCompare catalog={catalog} labels={L} locale={locale} />
      </div>
    </div>
  );
}
