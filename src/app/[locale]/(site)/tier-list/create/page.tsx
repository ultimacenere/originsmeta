import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cardsVerified } from "@/lib/data/cards";
import { builderPool } from "@/lib/builderLabels";
import { TierListMaker, type TierCard, type TierMakerLabels } from "@/components/TierListMaker";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { JsonLd, breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";

/*
  Tier list personalizzabile (richiesta di Pierluigi e Davdas del 22/09/2026). Pagina statica: niente Supabase e
  niente searchParams sul server; la lista condivisa arriva nell'hash (#TL1…), che il browser non manda al server e
  che il componente legge dopo il montaggio. Nessun account, come il deck builder.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list/create", dict.tierMaker.title, dict.tierMaker.description);
}

export default async function TierMakerPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const m = d.tierMaker;
  const path = href(locale, "/tier-list/create");
  const url = `${siteUrl}${path}`;

  // Carte attive della Demo 2.0, niente carte create (lo stesso elenco del deck builder). Solo i campi che servono a
  // miniatura e anteprima: il resto del database non passa al browser.
  const toTier = (c: ReturnType<typeof builderPool>[number]): TierCard => ({
    slug: c.slug,
    name: c.name,
    legendary: c.legendary,
    mana: c.mana,
    power: c.power,
    health: c.health,
    thumb: c.thumb,
    image: c.image,
    ability: c.ability,
    alignment: c.alignment,
    alignmentLabel: c.alignmentLabel,
    typeLabel: c.typeLabel,
  });
  const pool = builderPool(locale, d);
  // Leggendarie in ordine di nome; carte base per costo e poi per nome, come nel deck builder.
  const legendaries = pool
    .filter((c) => c.legendary)
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .map(toTier);
  const cards = pool
    .filter((c) => !c.legendary)
    .sort((a, b) => (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name, "en"))
    .map(toTier);
  // Gli archetipi dei mazzi (terza scheda, "in futuro" nelle note del 22/09) si aggiungeranno qui, accanto a queste
  // due liste, con il loro tipo in tiercode.ts (`TierKind`).

  const labels: TierMakerLabels = {
    tabsLabel: m.tabsLabel,
    tabLegendaries: m.tabLegendaries,
    tabCards: m.tabCards,
    rankedOf: m.rankedOf,
    titleLabel: m.titleLabel,
    titlePlaceholder: m.titlePlaceholder,
    help: m.help,
    tierRow: m.tierRow,
    unranked: m.unranked,
    emptyTier: m.emptyTier,
    allRanked: m.allRanked,
    searchPool: m.searchPool,
    noMatch: m.noMatch,
    legendary: d.common.legendary,
    mana: d.common.mana,
    picked: m.picked,
    movedTo: m.movedTo,
    movedOut: m.movedOut,
    cancelled: m.cancelled,
    barLabel: m.barLabel,
    moveTo: m.moveTo,
    cancel: m.cancel,
    actions: m.actions,
    copyLink: m.copyLink,
    copyText: m.copyText,
    linkCopied: m.linkCopied,
    textCopied: m.textCopied,
    copyFallback: m.copyFallback,
    shareHint: m.shareHint,
    reset: m.reset,
    resetConfirm: m.resetConfirm,
    resetYes: m.resetYes,
    resetDone: m.resetDone,
    autosaved: m.autosaved,
    storageBlocked: m.storageBlocked,
    sharedOpened: m.sharedOpened,
    restoreMine: m.restoreMine,
    keepThis: m.keepThis,
    restored: m.restored,
    textHeading: m.textHeading,
    textFooter: m.textFooter,
  };

  // Dati strutturati: uno strumento gratuito nel browser, dentro il sito, sul gioco (entità uniche per @id).
  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: m.title,
    description: m.description,
    url,
    inLanguage: locale,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    isPartOf: { "@id": `${siteUrl}/${locale}#website` },
    publisher: { "@id": organizationId },
    about: { "@id": videoGameId },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.tier.title, path: href(locale, "/tier-list") },
            { name: m.h1, path },
          ]),
          webApplication,
        ]}
      />
      {/* Anteprima delle carte al passaggio del mouse: la tiene dentro la finestra ai bordi. */}
      <CardMentionEdges />
      <p className="kicker text-mint">{d.nav.tierList}</p>
      <h1 className="t-page mt-2">{m.h1}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{m.intro}</p>
      <p className="mt-3 text-sm">
        <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
          {m.officialLink} →
        </Link>
      </p>

      <div className="mt-8">
        <TierListMaker legendaries={legendaries} cards={cards} shareBase={url} labels={labels} />
      </div>

      <p className="mt-8 text-xs text-chalk-muted">
        {m.dataNote
          .replace("{legendaries}", String(legendaries.length))
          .replace("{cards}", String(cards.length))
          .replace("{date}", formatDate(locale, cardsVerified.date))}{" "}
        {d.common.notAffiliated}
      </p>
    </div>
  );
}
