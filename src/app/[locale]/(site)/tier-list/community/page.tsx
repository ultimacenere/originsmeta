import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { COMMUNITY_MIN_LISTS, TIER_ORDER, communityOrder, communitySample, communityStage } from "@/lib/tierstats";
import { loadTierData, type TierData } from "@/lib/tierData";
import { tierExplorerLabels, tierSourceState } from "@/lib/tierLabels";
import { TierListHeader, TierSourceLine } from "@/components/TierListHeader";
import { TierExplorer } from "@/components/TierExplorer";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  Tier list della community: la media delle tier list che gli iscritti salvano da /tier-list/create (S=5 … D=1).
  Riprogettazione del 24/09/2026 (§1 punto 32 della KB, decisioni di Pierluigi): si chiama "della community" solo
  da COMMUNITY_MIN_LISTS liste (5) in su; sotto è un'anteprima, detta in chiaro con il contatore verso la soglia
  (prima il titolo diceva "della community" su una lista sola, con "1 voto" ripetuto su 122 carte). Il numero
  di voti e la distribuzione per fascia di ogni carta stanno nel dettaglio che si apre al clic, non su ogni carta.
  Legge Supabase: ISR come /decks, e le Server Action delle tier list la rigenerano subito dopo ogni salvataggio.
*/
export const revalidate = 300;

/**
 * Una sola lettura di Supabase per metadati e pagina nella stessa generazione: il titolo in SERP dipende da quante
 * tier list sono state salvate (sotto COMMUNITY_MIN_LISTS è un'anteprima e lo dice, piano SEO del 25/09/2026).
 */
const loadData = cache(loadTierData);
/** Liste della scheda più salvata: lo stesso numero che l'invito della home confronta con la soglia (`communityStage`). */
const savedLists = (data: TierData) => communityStage(data.lists).lists;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  const c = dict.tier.community;
  const preview = savedLists(await loadData(locale)) < COMMUNITY_MIN_LISTS;
  return pageMeta(locale, "/tier-list/community", preview ? c.titlePreview : c.title, c.description);
}

export default async function CommunityTierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.tier;
  const c = t.community;
  const data = await loadData(locale);
  const labels = tierExplorerLabels(d);
  const lists = savedLists(data);
  const state = tierSourceState(d, { lists, people: data.lists.people, decks: data.decks.length });
  const kinds = [
    { id: "legendaries" as const, title: t.sections.legendaries.title, text: t.sections.legendaries.text, entries: data.cards.filter((x) => x.legendary), n: data.lists.legendaries },
    { id: "cards" as const, title: t.sections.cards.title, text: t.sections.cards.text, entries: data.cards.filter((x) => !x.legendary), n: data.lists.cards },
  ];
  const listsLabel = (n: number) => (n === 1 ? t.sourceCommunityOne : t.sourceCommunityMany.replace("{n}", String(n)));
  // ItemList vera (Ondata 2, GEO-10) solo per le liste che non sono più un'anteprima (almeno COMMUNITY_MIN_LISTS
  // salvate di quel tipo): le carte fascia per fascia, nell'ordine delle fasce visibili (communityOrder, lo stesso di
  // TierExplorer). Altrimenti restano le ancore delle sezioni.
  const ranked = kinds
    .filter((k) => k.n >= COMMUNITY_MIN_LISTS)
    .flatMap((k) => TIER_ORDER.flatMap((tier) => k.entries.filter((e) => e.community?.tier === tier).sort(communityOrder)));
  const listItems = ranked.length
    ? ranked.map((e) => ({ name: e.name, path: e.href, description: `${e.community!.tier} · ${e.community!.avg.toFixed(1)} (${e.community!.votes})` }))
    : kinds.map((k) => ({ name: k.title, path: `${href(locale, "/tier-list/community")}#${k.id}` }));
  const fill = (s: string, n: number) => s.replace(/\{min\}/g, String(COMMUNITY_MIN_LISTS)).replace("{n}", String(n));
  const preview = (n: number) => fill(c.preview, n);
  // Tier list firmate (Ondata 3, TOOL-01): dalla stessa lettura di `loadTierData`, già raggruppate per autore
  const signed = data.signed;
  const sectionIndex = [
    ...(signed.length ? [{ id: "signed", label: c.signedTitle, count: signed.length }] : []),
    ...(lists ? kinds.map((k) => ({ id: k.id, label: k.title, count: k.entries.length })) : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: t.title, path: href(locale, "/tier-list") },
            { name: c.h1, path: href(locale, "/tier-list/community") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/tier-list/community"),
            name: lists < COMMUNITY_MIN_LISTS ? c.titlePreview : c.title,
            description: c.description,
            items: listItems,
            about: videoGameId,
          }),
        ]}
      />
      <CardMentionEdges />
      {/* Sotto la soglia anche l'H1 dice che è un'anteprima, come il titolo in SERP (decisione del 24/09/2026) */}
      <TierListHeader
        locale={locale}
        dict={d}
        current="community"
        title={lists < COMMUNITY_MIN_LISTS ? c.h1Preview : c.h1}
        intro={c.intro}
        state={state}
        sections={sectionIndex.length ? sectionIndex : undefined}
      />
      <TierSourceLine
        items={[
          { label: t.lineSource, text: c.sourceText },
          { label: t.lineSample, text: `${communitySample(t, data.lists)}${data.lists.updated ? `, ${c.updatedText.replace("{date}", data.lists.updated)}` : ""}` },
          ...(lists && lists < COMMUNITY_MIN_LISTS ? [{ label: c.previewBadge, text: fill(c.previewShort, lists), warn: true }] : []),
        ]}
      />
      {/* Link nel testo verso la tier list principale, con il suo nome come ancora (piano SEO del 25/09/2026): su
          "origins tcg tier list" deve uscire /tier-list, non questa pagina */}
      <p className="mt-3 text-sm text-chalk-muted">
        {t.mainText}{" "}
        <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
          {t.mainAnchor} →
        </Link>
      </p>

      {/*
        Tier list firmate (Ondata 3, TOOL-01): quelle salvate da Staff, Pro, Influencer e Autori, con nome, tag, data e
        link al profilo pubblico e al tool. Stanno prima della media perché, mentre la media è un'anteprima, sono il
        contenuto firmato della pagina; senza liste firmate la sezione non c'è.
      */}
      {signed.length ? (
        <section id="signed" className="mt-10 scroll-mt-32" aria-labelledby="signed-title">
          <h2 id="signed-title" className="t-section">
            {c.signedTitle}
          </h2>
          <p className="mt-1 max-w-3xl text-chalk-muted">{c.signedText}</p>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {signed.map((a) => (
              <li key={a.username} className="card-night flex min-w-0 flex-col p-5">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={href(locale, `/u/${a.username}`)} className="t-item min-w-0 break-words hover:text-mint">
                    {a.name}
                  </Link>
                  <span className={`${badgePill} ${badgeStyle[a.badge] ?? badgeStyle.community} !px-2 !py-0.5 !text-[10px]`}>
                    {d.community.badges[a.badge as keyof typeof d.community.badges] ?? a.badge}
                  </span>
                </p>
                <ul className="mt-3 space-y-3">
                  {a.lists.map((l) => (
                    <li key={l.kind} className="rounded-xl border-2 border-sky/50 bg-night-2/80 p-3">
                      <span className="stat-pill w-fit bg-sky text-[11px] font-semibold uppercase text-ink">
                        {l.kind === "legendaries" ? d.tierMaker.tabLegendaries : d.tierMaker.tabCards}
                      </span>
                      <p className="mt-2 break-words text-sm font-bold text-pale">{l.title || d.tierMaker.h1}</p>
                      <p className="mt-1 font-mono text-xs text-pale-muted">
                        {l.ranked} {d.community.account.rankedCards} · {d.common.updated} {formatDate(locale, l.updated)}
                      </p>
                      {l.code ? (
                        <p className="mt-2">
                          {/* il codice TL1 nell'hash apre questa lista nello strumento, senza account (come nel profilo) */}
                          <a href={`${href(locale, "/tier-list/create")}#${l.code}`} className="text-sm font-bold text-mint hover:underline">
                            {d.community.profile.openTierList} →
                          </a>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm">
                  <Link href={href(locale, `/u/${a.username}`)} className="link-mint font-bold">
                    {c.signedProfile}: @{a.username} →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lists === 0 ? (
        /* Nessuna tier list salvata: una pagina vuota non serve a nessuno, l'invito sì. */
        <div className="felt-panel-mint mt-8 flex max-w-3xl flex-wrap items-center gap-4 p-6">
          <p className="min-w-0 flex-1 basis-64 text-pale">{c.empty}</p>
          <Link href={href(locale, "/tier-list/create")} className="btn btn-primary max-sm:w-full">
            {c.emptyCta} →
          </Link>
        </div>
      ) : (
        kinds.map((k) => (
          <section key={k.id} id={k.id} className="mt-10 scroll-mt-32" aria-labelledby={`${k.id}-title`}>
            <h2 id={`${k.id}-title`} className="t-section">
              {k.title}
            </h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">
              {k.text} <span className="font-mono text-xs text-pale-muted">· {listsLabel(k.n)}</span>
            </p>
            {k.n > 0 && k.n < COMMUNITY_MIN_LISTS ? <p className="tier-ribbon">{preview(k.n)}</p> : null}
            <div className="mt-4">
              <TierExplorer locale={locale}
                id={`community-${k.id}`}
                mode="tiers"
                source="community"
                entries={k.entries}
                deckCount={data.decks.length}
                labels={labels}
                filters={k.id === "cards"}
                table={k.id === "cards"}
              />
            </div>
          </section>
        ))
      )}

      <p className="mt-10 max-w-3xl text-sm text-chalk-muted">{c.disclaimer}</p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
          {c.officialLink} →
        </Link>
        <Link href={href(locale, "/tier-list/create")} className="link-mint font-bold">
          {t.makerCta} →
        </Link>
      </div>
    </div>
  );
}
