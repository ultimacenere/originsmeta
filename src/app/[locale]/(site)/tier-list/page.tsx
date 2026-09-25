import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { latestPatch, movers, patchChanges, patchLabel } from "@/lib/data/cards";
import { tierIds, tierList } from "@/lib/data/tierlist";
import { tierTone } from "@/lib/tiercode";
import type { Tier } from "@/lib/tierstats";
import { loadTierData } from "@/lib/tierData";
import { tierExplorerLabels, tierSourceState } from "@/lib/tierLabels";
import type { TierCardEntry } from "@/lib/tierTypes";
import { TierListHeader, TierSourceLine } from "@/components/TierListHeader";
import { TierExplorer } from "@/components/TierExplorer";
import { TierDeckList } from "@/components/TierDecks";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardName, legendaryFirst } from "@/components/CardChip";
import { DiscordButton } from "@/components/DiscordButton";
import { contactEmail, officialLinks } from "@/components/Footer";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  Tier list di OriginsMeta (riprogettazione del 24/09/2026, §1 punto 32 della KB, decisioni di Pierluigi).
  La classifica arriva dai risultati dei tornei ufficiali: fino alla Crimson Cup (20–25 ottobre) le fasce sono
  vuote e la pagina non le finge. Prima occupava la prima schermata con stato, metodo e legenda e poi il 60%
  dell'altezza con il tracker delle patch (ora su /metashifting); adesso, per ogni sezione, una riga di stato e
  subito un contenuto vero: i mazzi più votati, le Leggendarie e le carte più presenti nei mazzi pubblicati, con i
  rimandi a "Le più giocate" e alla community. Quando le fasce ci saranno, le stesse sezioni le mostrano con le
  carte tutte uguali di TierExplorer. I dati arrivano da Supabase: la pagina è in ISR come /decks.
*/
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // In SERP "tier list and meta" (piano SEO del 25/09/2026: è la pagina primaria di quelle ricerche); l'H1 resta `title`
  return pageMeta(locale, "/tier-list", dict.tier.metaTitle, dict.tier.description);
}

const byUsed = (a: TierCardEntry, b: TierCardEntry) => b.used - a.used || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name);

export default async function TierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.tier;
  const data = await loadTierData(locale);
  const labels = tierExplorerLabels(d);

  // Fasce di OriginsMeta: vuote fino ai risultati della Crimson Cup (tierlist.ts). Una mappa slug → fascia per sezione.
  const officialOf = (id: "decks" | "legendaries" | "cards") => {
    const section = tierList.sections.find((s) => s.id === id);
    const map: Record<string, Tier> = {};
    if (section) for (const tier of tierIds) for (const slug of section.tiers[tier]) map[slug] = tier;
    return map;
  };
  const official = { decks: officialOf("decks"), legendaries: officialOf("legendaries"), cards: officialOf("cards") };
  const ranked = Object.values(official).some((m) => Object.keys(m).length > 0);

  const legendaries = data.cards.filter((c) => c.legendary);
  const base = data.cards.filter((c) => !c.legendary);
  const lists = Math.max(data.lists.legendaries, data.lists.cards);
  const state = tierSourceState(d, { lists, decks: data.decks.length, officialUpdated: ranked ? formatDate(locale, tierList.updated) : undefined });

  // Anteprime mentre le fasce sono vuote: dati veri, dichiarati per quello che sono
  const topDecks = data.decks.filter((dk) => dk.rating.votes > 0).slice(0, 4);
  const topLegendaries = legendaries.filter((c) => c.used > 0).sort(byUsed).slice(0, 4);
  const topCards = base.filter((c) => c.used > 0).sort(byUsed).slice(0, 8);

  // In breve (piano SEO/GEO del 25/09/2026, TOOL-03): la risposta subito, in testo, con i dati già caricati qui sopra.
  // Il gioco con Koin Games fra parentesi (le ricerche generiche sono piene di Riftbound: Origins), le carte presenti
  // in più mazzi con il loro numero (così i pari merito si vedono), il mazzo più votato e la data dell'ultimo mazzo.
  // I nomi dei mazzi li scrivono gli utenti: si inseriscono con una funzione, perché "$&" e simili non vengano letti.
  const br = d.decks.brief;
  const put = (s: string, key: string, value: string) => s.replace(`{${key}}`, () => value);
  const listOf = (items: string[]) => new Intl.ListFormat(locale, { type: "conjunction" }).format(items);
  const inDecks = (n: number) => (n === 1 ? t.inDecksOne : put(t.inDecksMany, "n", String(n)));
  const oneDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const bestDeck = topDecks[0];
  const brief = data.deckRange
    ? [
        put(put(data.decks.length === 1 ? br.countOne : br.count, "n", String(data.decks.length)), "date", data.deckRange.to),
        topLegendaries.length ? put(br.legendaries, "list", listOf(topLegendaries.slice(0, 3).map((c) => `${c.name} (${inDecks(c.used)})`))) : "",
        topCards.length ? put(br.cards, "list", listOf(topCards.slice(0, 3).map((c) => `${c.name} (${inDecks(c.used)})`))) : "",
        bestDeck
          ? put(
              br.ratedOne,
              "list",
              `${bestDeck.name} (${put(
                put(br.rating, "avg", oneDecimal.format(bestDeck.rating.avg)),
                "votes",
                bestDeck.rating.votes === 1 ? t.explorer.votesOne : put(t.explorer.votesMany, "n", String(bestDeck.rating.votes)),
              )})`,
            )
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  // Riquadro dell'ultima patch (l'ancora #tracker resta per i link già pubblicati in news e guide)
  const latest = legendaryFirst(movers(latestPatch).slice(0, 3), (m) => Boolean(m.card.legendary));
  const latestCount = patchChanges().find((g) => g.patch === latestPatch)?.items.length ?? 0;

  const sectionIds = ["decks", "legendaries", "cards"] as const;
  const counts = { decks: data.decks.length, legendaries: legendaries.length, cards: base.length };
  const listed = sectionIds.map((id) => ({ name: t.sections[id].title, path: `${href(locale, "/tier-list")}#${id}` }));

  const emptyLine = (
    <p className="tier-empty-line">
      <span className="tier-dots" aria-hidden="true">
        {tierIds.map((tier) => (
          <span key={tier} className={`tier-letter is-small ${tierTone[tier]}`}>
            {tier}
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1 basis-60">{t.officialEmpty}</span>
    </p>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: t.title, path: href(locale, "/tier-list") },
          ]),
          collectionPage({ locale, path: href(locale, "/tier-list"), name: t.title, description: t.description, items: listed, about: videoGameId }),
        ]}
      />
      {/* Anteprima delle carte al passaggio del mouse: la tiene dentro la finestra ai bordi. */}
      <CardMentionEdges />
      <TierListHeader
        locale={locale}
        dict={d}
        current="official"
        title={t.title}
        intro={t.intro}
        state={state}
        sections={sectionIds.map((id) => ({ id, label: t.sections[id].title, count: counts[id] }))}
      />
      {brief ? (
        <p className="mt-4 max-w-3xl break-words text-sm leading-relaxed text-pale">
          <span className="kicker mr-2 text-mint">{d.news.inBrief}</span>
          {brief}
        </p>
      ) : null}
      <TierSourceLine
        items={[
          { label: t.lineSource, text: t.officialSourceText },
          ranked ? { label: d.common.updated, text: formatDate(locale, tierList.updated) } : { label: t.lineStatus, text: t.officialStatusText },
        ]}
      />
      {ranked ? null : <div className="mt-5">{emptyLine}</div>}

      {/* Mazzi */}
      <section id="decks" className="mt-10 scroll-mt-32" aria-labelledby="decks-title">
        <h2 id="decks-title" className="t-section">
          {t.sections.decks.title}
        </h2>
        <p className="mt-1 max-w-2xl text-chalk-muted">{t.sections.decks.text}</p>
        {ranked && Object.keys(official.decks).length ? (
          <div className="tier-board mt-4">
            {tierIds.map((tier) => {
              const items = data.decks.filter((dk) => official.decks[dk.slug] === tier);
              return (
                <section key={tier} className="tier-band" aria-labelledby={`decks-band-${tier}`}>
                  <h3 id={`decks-band-${tier}`} className={`tier-band-label ${tierTone[tier]}`}>
                    <span className="tier-band-letter">{tier}</span>
                    <span className="tier-band-mean">{t.tiers[tier]}</span>
                    <span className="tier-band-count">{items.length}</span>
                  </h3>
                  <div className="p-3">{items.length ? <TierDeckList decks={items} dict={d} locale={locale} /> : <p className="tier-band-empty">{t.explorer.emptyTier}</p>}</div>
                </section>
              );
            })}
          </div>
        ) : topDecks.length ? (
          <div className="tier-preview">
            <p className="kicker text-mint">{t.meanwhileDecks}</p>
            <div className="mt-3">
              <TierDeckList decks={topDecks} dict={d} locale={locale} />
            </div>
            <Link href={href(locale, "/decks")} className="tier-more inline-block">
              {t.allDecks.replace("{n}", String(data.decks.length))} →
            </Link>
          </div>
        ) : (
          <p className="tier-preview text-pale">
            {t.noDecksYet}{" "}
            <Link href={href(locale, "/deck-builder")} className="link-mint font-bold">
              {d.decks.inviteCta} →
            </Link>
          </p>
        )}
      </section>

      {/* Leggendarie e carte base */}
      {(["legendaries", "cards"] as const).map((id) => {
        const entries = id === "legendaries" ? legendaries : base;
        const top = id === "legendaries" ? topLegendaries : topCards;
        const hasOfficial = Object.keys(official[id]).length > 0;
        return (
          <section key={id} id={id} className="mt-12 scroll-mt-32" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`} className="t-section">
              {t.sections[id].title}
            </h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">{t.sections[id].text}</p>
            {hasOfficial ? (
              <div className="mt-4">
                <TierExplorer locale={locale}
                  id={`official-${id}`}
                  mode="tiers"
                  source="official"
                  official={official[id]}
                  entries={entries}
                  deckCount={data.decks.length}
                  labels={labels}
                  filters={id === "cards"}
                />
              </div>
            ) : top.length ? (
              <div className="tier-preview">
                <p className="kicker text-mint">{id === "legendaries" ? t.meanwhileLegendaries : t.meanwhileCards}</p>
                <TierExplorer locale={locale} id={`preview-${id}`} mode="strip" source="played" entries={top} deckCount={data.decks.length} labels={labels} />
                <Link href={`${href(locale, "/tier-list/most-played")}#${id}`} className="tier-more inline-block">
                  {t.allPlayed} →
                </Link>
              </div>
            ) : null}
          </section>
        );
      })}

      {/* Le altre due fonti, sempre raggiungibili anche dal fondo della pagina */}
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href={href(locale, "/tier-list/most-played")} className="tier-go">
          <b>{t.goPlayed.title}</b>
          {t.goPlayed.text.replace("{n}", String(data.decks.length))}
        </Link>
        <Link href={href(locale, "/tier-list/community")} className="tier-go">
          <b>{t.goCommunity.title}</b>
          {t.goCommunity.text}
        </Link>
      </div>

      {/* Ultima patch: le tre modifiche più grandi, il resto su /metashifting */}
      <section id="tracker" className="card-night mt-10 scroll-mt-32 p-5" aria-labelledby="tracker-title">
        <h2 id="tracker-title" className="kicker text-mint">
          {t.patchBox.replace("{patch}", patchLabel(latestPatch, locale))}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {latest.map(({ card, change }) => (
            <li key={`${card.slug}-${change.patch}`}>
              <Link href={href(locale, `/cards/${card.slug}`)} className="flex items-center gap-2 rounded-lg border-2 border-sky px-2.5 py-1.5 text-xs hover:bg-night-3">
                <span className="t-item text-xs">
                  <CardName name={card.name} legendary={card.legendary} legendaryLabel={d.common.legendary} />
                </span>
                <StatDelta from={change.from} to={change.to} />
                <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
              </Link>
            </li>
          ))}
        </ul>
        <Link href={href(locale, "/metashifting")} className="btn btn-primary mt-4 text-xs">
          {t.patchBoxLink.replace("{n}", String(latestCount))} →
        </Link>
      </section>

      {/* Come classifichiamo: resta a portata, chiuso, senza occupare la prima schermata */}
      <details className="card-night mt-6 p-5">
        <summary className="t-item cursor-pointer">{t.methodTitle}</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-pale">
          {t.method.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tierIds.map((tier) => (
            <li key={tier} className="flex items-center gap-3">
              <span className={`tier-letter ${tierTone[tier]}`}>{tier}</span>
              <span className="text-chalk-muted">{t.tiers[tier]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-pale-muted">
          {t.ctaText}{" "}
          <DiscordButton href={officialLinks.discord} size="sm" className="align-middle">
            Discord
          </DiscordButton>{" "}
          · <a className="link-mint" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </details>
    </div>
  );
}
