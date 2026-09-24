import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadTierData } from "@/lib/tierData";
import { tierExplorerLabels, tierSourceState } from "@/lib/tierLabels";
import { TierListHeader, TierSourceLine } from "@/components/TierListHeader";
import { TierExplorer } from "@/components/TierExplorer";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  Le più giocate (24/09/2026, decisione di Pierluigi sul nome, §1 punto 32 della KB): in quanti dei mazzi pubblicati
  su OriginsMeta compare ogni Leggendaria e ogni carta base, più gli archetipi dei mazzi. È il contenuto vero che la
  sezione può mostrare prima dei risultati della Crimson Cup, dichiarato per quello che è: popolarità fra i mazzi
  del sito, con il campione (quanti mazzi, da quando a quando), mai un win rate.
  Legge Supabase: ISR come /decks.
*/
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list/most-played", dict.tier.played.title, dict.tier.played.description);
}

export default async function MostPlayedPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.tier;
  const p = t.played;
  const data = await loadTierData(locale);
  const labels = tierExplorerLabels(d);
  const n = data.decks.length;
  const state = tierSourceState(d, { lists: Math.max(data.lists.legendaries, data.lists.cards), decks: n });
  const legendaries = data.cards.filter((c) => c.legendary);
  const base = data.cards.filter((c) => !c.legendary);

  // Archetipi dei mazzi pubblicati, dal più frequente
  const byArchetype = new Map<string, typeof data.decks>();
  for (const dk of data.decks) byArchetype.set(dk.archetypeLabel, [...(byArchetype.get(dk.archetypeLabel) ?? []), dk]);
  const archetypes = Array.from(byArchetype, ([label, decks]) => ({ label, decks })).sort((a, b) => b.decks.length - a.decks.length || a.label.localeCompare(b.label));

  const range = data.deckRange ? p.rangeText.replace("{from}", data.deckRange.from).replace("{to}", data.deckRange.to) : "";
  const sections = [
    { id: "decks", label: t.sections.decks.title, count: n },
    { id: "legendaries", label: t.sections.legendaries.title, count: legendaries.length },
    { id: "cards", label: t.sections.cards.title, count: base.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: t.title, path: href(locale, "/tier-list") },
            { name: p.h1, path: href(locale, "/tier-list/most-played") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/tier-list/most-played"),
            name: p.title,
            description: p.description,
            items: sections.map((s) => ({ name: s.label, path: `${href(locale, "/tier-list/most-played")}#${s.id}` })),
            about: videoGameId,
          }),
        ]}
      />
      <CardMentionEdges />
      <TierListHeader locale={locale} dict={d} current="played" title={p.h1} intro={p.intro} state={state} sections={n ? sections : undefined} />
      <TierSourceLine
        items={[
          {
            label: t.lineSource,
            text: `${p.sourceText.replace("{n}", String(n)).replace("{range}", range)}${data.deckPatches.length ? ` (${p.patchesText.replace("{patches}", data.deckPatches.join(", "))})` : ""}`,
          },
          { label: t.lineMeasure, text: p.measureText },
        ]}
      />

      {n === 0 ? (
        <div className="felt-panel-mint mt-8 flex max-w-3xl flex-wrap items-center gap-4 p-6">
          <p className="min-w-0 flex-1 basis-64 text-pale">{p.noDecks}</p>
          <Link href={href(locale, "/deck-builder")} className="btn btn-primary max-sm:w-full">
            {d.decks.inviteCta} →
          </Link>
        </div>
      ) : (
        <>
          <section id="decks" className="mt-10 scroll-mt-32" aria-labelledby="decks-title">
            <h2 id="decks-title" className="t-section">
              {t.sections.decks.title}
            </h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">
              {p.archetypesText} {p.variantsNote}
            </p>
            <ol className="mt-4 grid gap-1.5">
              {archetypes.map((a) => (
                <li key={a.label} className="tier-arch">
                  <span className="min-w-0">
                    <span className="block font-bold text-chalk">{a.label}</span>
                    <span className="block text-xs text-chalk-muted">
                      {a.decks.map((dk, i) => (
                        <span key={dk.slug}>
                          {i > 0 ? " · " : ""}
                          <Link href={dk.href} className="hover:text-sky hover:underline">
                            {dk.name}
                          </Link>
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="tier-usage-bar" aria-hidden="true">
                    <span style={{ width: `${Math.round((a.decks.length / n) * 100)}%` }} />
                  </span>
                  <span className="tier-usage-val">
                    {a.decks.length === 1 ? t.inDecksOne : t.inDecksMany.replace("{n}", String(a.decks.length))}
                    <span className="tier-usage-pct"> · {Math.round((a.decks.length / n) * 100)}%</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link href={href(locale, "/decks")} className="tier-more inline-block">
              {t.allDecks.replace("{n}", String(n))} →
            </Link>
          </section>

          <section id="legendaries" className="mt-12 scroll-mt-32" aria-labelledby="legendaries-title">
            <h2 id="legendaries-title" className="t-section">
              {t.sections.legendaries.title}
            </h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">{t.sections.legendaries.text}</p>
            <div className="mt-4">
              <TierExplorer locale={locale} id="played-legendaries" mode="usage" source="played" entries={legendaries} deckCount={n} labels={labels} />
            </div>
          </section>

          <section id="cards" className="mt-12 scroll-mt-32" aria-labelledby="cards-title">
            <h2 id="cards-title" className="t-section">
              {t.sections.cards.title}
            </h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">{t.sections.cards.text}</p>
            <TierExplorer locale={locale} id="played-cards" mode="usage" source="played" entries={base} deckCount={n} labels={labels} filters table />
          </section>
        </>
      )}
    </div>
  );
}
