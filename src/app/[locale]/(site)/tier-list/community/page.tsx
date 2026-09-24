import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { COMMUNITY_MIN_LISTS } from "@/lib/tierstats";
import { loadTierData } from "@/lib/tierData";
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

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list/community", dict.tier.community.title, dict.tier.community.description);
}

export default async function CommunityTierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.tier;
  const c = t.community;
  const data = await loadTierData(locale);
  const labels = tierExplorerLabels(d);
  const lists = Math.max(data.lists.legendaries, data.lists.cards);
  const state = tierSourceState(d, { lists, decks: data.decks.length });
  const kinds = [
    { id: "legendaries" as const, title: t.sections.legendaries.title, text: t.sections.legendaries.text, entries: data.cards.filter((x) => x.legendary), n: data.lists.legendaries },
    { id: "cards" as const, title: t.sections.cards.title, text: t.sections.cards.text, entries: data.cards.filter((x) => !x.legendary), n: data.lists.cards },
  ];
  const listsLabel = (n: number) => (n === 1 ? t.sourceCommunityOne : t.sourceCommunityMany.replace("{n}", String(n)));
  const fill = (s: string, n: number) => s.replace(/\{min\}/g, String(COMMUNITY_MIN_LISTS)).replace("{n}", String(n));
  const preview = (n: number) => fill(c.preview, n);

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
            name: c.title,
            description: c.description,
            items: kinds.map((k) => ({ name: k.title, path: `${href(locale, "/tier-list/community")}#${k.id}` })),
            about: videoGameId,
          }),
        ]}
      />
      <CardMentionEdges />
      <TierListHeader
        locale={locale}
        dict={d}
        current="community"
        title={c.h1}
        intro={c.intro}
        state={state}
        sections={lists ? kinds.map((k) => ({ id: k.id, label: k.title, count: k.entries.length })) : undefined}
      />
      <TierSourceLine
        items={[
          { label: t.lineSource, text: c.sourceText },
          { label: t.lineSample, text: `${listsLabel(lists)}${data.lists.updated ? `, ${c.updatedText.replace("{date}", data.lists.updated)}` : ""}` },
          ...(lists && lists < COMMUNITY_MIN_LISTS ? [{ label: c.previewBadge, text: fill(c.previewShort, lists), warn: true }] : []),
        ]}
      />

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
