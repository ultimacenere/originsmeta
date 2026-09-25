import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { formatDate, href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import type { Dictionary } from "@/lib/i18n";
import { archetypeLabels, decks } from "@/lib/data/decks";
import type { Card } from "@/lib/data/cards";
import { activeCards, getCard, patchAt, patchLabel, statLine } from "@/lib/data/cards";
import { DeckExplorer, type ExplorerDeck } from "@/components/DeckExplorer";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { listPublishedDecks } from "@/lib/community/queries";
import { authorName } from "@/lib/community/util";
import { localizedGuide } from "@/lib/community/deckTranslation";
import { GUIDE_MIN_WORDS, fillLabel, indexableLocales } from "@/lib/community/deckQuality";
import { deckGameCode } from "@/lib/deckGameCode";
import { badgeStyle } from "@/lib/cardArt";
import { supabaseEnabled } from "@/lib/supabase/env";
import { bestDecks, deckBrief, excludedFromBest, fillParts, listParts, usageCounts, weightedRating, type BriefPart } from "@/lib/tierstats";
import { CardName } from "@/components/CardChip";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/** Taglio a `max` caratteri con l'ellissi, per le righe dell'elenco. */
const shorten = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s);

/** Quel poco che serve all'elenco: lo soddisfano sia le carte del database sia quelle inserite a mano. */
type CardLike = {
  name: string;
  type?: Card["type"];
  thumb?: string;
  image?: string;
  art?: string;
  mana?: number;
  power?: number;
  health?: number;
  legendary?: boolean;
  alignment?: Card["alignment"];
  ability?: Card["ability"] | string;
};

/** Carte del mazzo per l'elenco: nome, miniatura, costo e testo dell'abilità, ordinate per costo come nel gioco. */
function deckArt(slugs: string[], lookup: (slug: string) => CardLike | undefined, locale: Locale, d: Dictionary) {
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  return slugs
    .map((s) => {
      const c = lookup(s);
      return {
        name: c?.name ?? s,
        thumb: c?.thumb,
        image: c?.image,
        art: c?.art,
        mana: c?.mana,
        power: c?.power,
        health: c?.health,
        legendary: Boolean(c?.legendary),
        typeLabel: c?.type ? typeLabel[c.type] : undefined,
        alignment: c?.alignment,
        alignmentLabel: c?.alignment ? alignLabel[c.alignment] : undefined,
        // le carte del database hanno il testo nelle due lingue, quelle inserite a mano non ce l'hanno affatto
        ability: typeof c?.ability === "string" ? c.ability : c?.ability?.[locale],
      };
    })
    .sort((a, b) => (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
}


/** I mazzi della community arrivano da Supabase: la pagina si rigenera al massimo ogni 5 minuti (e subito dopo ogni pubblicazione). */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // In SERP "decklists and guides" (piano SEO del 25/09/2026; "codes" è di /deck-builder dalla revisione dell'Ondata 1);
  // l'H1 resta `title`, più leggibile sulla pagina
  return pageMeta(locale, "/decks", dict.decks.metaTitle, dict.decks.description);
}

export default async function DecksPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // Solo le Leggendarie giocabili nella demo (le rimosse del playtest restano nel database carte)
  const legendaries = activeCards.filter((c) => c.legendary);
  const community = await listPublishedDecks();
  // Codice del gioco (KGBLDC…) di ogni mazzo, da copiare senza aprire la scheda: il codice OriginsMeta dall'interfaccia
  // è sparito (note del 22/09/2026). Se una carta non ha l'ID ufficiale il tasto non compare.
  const gameCodes = new Map(await Promise.all(community.map(async (deck) => [deck.slug, (await deckGameCode(deck)).code] as const)));
  // L'ordine lo decide l'elenco nel browser (di partenza: dal più recente, Pierluigi 23/09/2026); qui basta
  // una lista stabile, la stessa dei dati strutturati.
  const newestFirst = community.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const communityList: ExplorerDeck[] = newestFirst
    .map((deck) => {
      const leg = deck.legendary ? getCard(deck.legendary) : undefined;
      const legCustom = !leg ? deck.custom_cards.find((x) => x.slug === deck.legendary) : undefined;
      return {
        slug: `community-${deck.slug}`,
        name: deck.name,
        href: href(locale, `/decks/community/${deck.slug}`),
        // riassunto nella lingua della pagina quando la traduzione del sito c'è (25/09/2026), altrimenti quello dell'autore
        tagline: shorten(localizedGuide(deck, locale).text.summary, 140),
        legendary: leg
          ? { slug: leg.slug, name: leg.name, href: href(locale, `/cards/${leg.slug}`), cover: leg.cover, thumb: leg.thumb, image: leg.image, mana: leg.mana }
          : legCustom
            ? { slug: legCustom.slug, name: legCustom.name }
            : undefined,
        archetype: deck.archetype,
        archetypeLabel: archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype,
        creator: authorName(deck.profile),
        source: "community",
        sourceLabel: d.common.community,
        cardNames: deck.cards.map((s) => getCard(s)?.name ?? deck.custom_cards.find((x) => x.slug === s)?.name ?? s),
        cardArt: deckArt(deck.cards, (s) => getCard(s) ?? deck.custom_cards.find((x) => x.slug === s), locale, d),
        code: gameCodes.get(deck.slug) ?? undefined,
        updated: deck.updated_at.slice(0, 10),
        // data di creazione e versione del gioco di quel giorno (richiesta di Pierluigi del 23/09/2026)
        created: deck.created_at.slice(0, 10),
        createdLabel: formatDate(locale, deck.created_at.slice(0, 10)),
        patchId: patchAt(deck.created_at),
        patchLabel: patchAt(deck.created_at) ? patchLabel(patchAt(deck.created_at)!, locale) : undefined,
        rating: deck.rating,
        // voto pesato per l'ordine "Più votati" dell'elenco (`ExplorerDeck.score`), lo stesso della classifica dei migliori
        // mazzi (Ondata 3): con la media semplice un solo voto da 5 stelle passava davanti al #1 della classifica
        score: deck.rating?.votes ? weightedRating(deck.rating.avg, deck.rating.votes) : 0,
        deckTypeLabels: deck.deck_types.map((t) => d.community.deckTypes[t as keyof typeof d.community.deckTypes] ?? t),
        creatorBadge: d.community.badges[(deck.profile?.badge ?? "community") as keyof typeof d.community.badges] ?? deck.profile?.badge ?? undefined,
        creatorBadgeId: deck.profile?.badge ?? "community",
      };
    });
  const list: ExplorerDeck[] = decks.map((deck) => {
    const leg = deck.legendary ? getCard(deck.legendary) : undefined;
    return {
      slug: deck.slug,
      name: deck.name,
      href: href(locale, `/decks/${deck.slug}`),
      tagline: deck.tagline[locale],
      legendary: leg ? { slug: leg.slug, name: leg.name, href: href(locale, `/cards/${leg.slug}`), cover: leg.cover, thumb: leg.thumb, image: leg.image, mana: leg.mana } : undefined,
      archetype: deck.archetype,
      archetypeLabel: archetypeLabels[deck.archetype][locale],
      creator: deck.creator.name,
      source: deck.source,
      sourceLabel: d.common[deck.source],
      cardNames: deck.cards.map((s) => getCard(s)?.name ?? s),
      cardArt: deckArt(deck.cards, getCard, locale, d),
      updated: deck.updated,
    };
  });

  // In breve (piano SEO/GEO del 25/09/2026, DECKS-05): quanti mazzi, le Leggendarie più giocate e i mazzi più votati,
  // calcolati qui a ogni rigenerazione (ISR), mai scritti a mano. Voci, regola dei pari merito e frasi sono quelle di
  // /tier-list (`deckBrief` in tierstats.ts, revisione dell'Ondata 1): le Leggendarie della demo contate come in
  // "Le più giocate" (`usageCounts`), i mazzi col voto pesato sul numero di voti. /tier-list aggiunge le carte base.
  // I mazzi votati sono gli stessi della classifica dei migliori mazzi qui sotto (Ondata 3): solo quelli con la scheda
  // indicizzabile nella lingua della pagina, così "In breve" e classifica non danno due risposte diverse.
  const votedItem = (deck: (typeof community)[number]) => {
    const rating = deck.rating ?? { avg: 0, votes: 0 };
    return { name: deck.name, href: href(locale, `/decks/community/${deck.slug}`), value: weightedRating(rating.avg, rating.votes), rating, deck };
  };
  const rated = community.filter((deck) => (deck.rating?.votes ?? 0) > 0);
  const rankedItems = rated.filter((deck) => indexableLocales(deck, [locale]).length > 0).map(votedItem);
  const excludedItems = rated.filter((deck) => indexableLocales(deck, [locale]).length === 0).map(votedItem);
  const lastDeck = community.map((deck) => deck.created_at.slice(0, 10)).sort().at(-1);
  const usage = usageCounts(community);
  const brief = lastDeck
    ? deckBrief({
        locale,
        t: d.decks.brief,
        decks: community.length,
        lastDate: formatDate(locale, lastDeck),
        legendaries: legendaries.map((c) => ({ name: c.name, href: href(locale, `/cards/${c.slug}`), value: usage.legendaries[c.slug] ?? 0 })),
        rated: rankedItems,
        inDecks: (n) => (n === 1 ? d.tier.inDecksOne : d.tier.inDecksMany.replace("{n}", String(n))),
        votes: (n) => (n === 1 ? d.tier.explorer.votesOne : d.tier.explorer.votesMany.replace("{n}", String(n))),
      })
    : [];

  // I migliori mazzi di Origins TCG adesso (Ondata 3 del piano SEO/GEO, mappa delle query C18: la pagina primaria di
  // "best decks" è questa). È la classifica dei voti, non un giudizio nostro: stesso voto pesato, stesso ordine e stesse
  // voci di "In breve" (`bestDecks` usa `pickPreview`, che non spezza un pari merito sul taglio), ricalcolata a ogni
  // rigenerazione ISR. Entrano solo i mazzi con voti che si indicizzano nella lingua della pagina (`indexableLocales`,
  // lo stesso criterio dell'ItemList qui sotto): una classifica pensata per chi cerca "best decks" non manda a schede
  // noindex. La riga del metodo nomina i mazzi rimasti fuori che col loro voto sarebbero in classifica
  // (`excludedFromBest`) e conta gli altri, così chi li vede nell'elenco completo sa perché non ci sono.
  const best = bestDecks(rankedItems);
  const excludedAbove = excludedFromBest(rankedItems, excludedItems);
  const bestLabels = d.decks.best;
  const oneDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const twoDecimals = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const votesLabel = (n: number) => (n === 1 ? d.tier.explorer.votesOne : d.tier.explorer.votesMany.replace("{n}", String(n)));
  // data della classifica: quella della rigenerazione che l'ha calcolata (la pagina è ISR)
  const rankingDate = formatDate(locale, new Date().toISOString().slice(0, 10));
  const minWords = String(GUIDE_MIN_WORDS);
  const excludedRest = excludedItems.length - excludedAbove.length;
  // chi resta fuori: prima per nome quelli che sarebbero in classifica (col voto pesato accanto), poi il conto degli altri
  const excludedParts: BriefPart[] = excludedAbove.length
    ? [
        ...fillParts(excludedAbove.length === 1 ? bestLabels.excludedAboveOne : bestLabels.excludedAboveMany, {
          list: listParts(
            locale,
            excludedAbove.map((x) => [{ text: x.name, href: x.href }, ` (${twoDecimals.format(x.value)})`]),
          ),
          min: [minWords],
        }),
        ...(excludedRest > 0 ? [" ", excludedRest === 1 ? bestLabels.excludedRestOne : fillLabel(bestLabels.excludedRestMany, { n: String(excludedRest) })] : []),
      ]
    : excludedItems.length
      ? [excludedItems.length === 1 ? fillLabel(bestLabels.excludedOne, { min: minWords }) : fillLabel(bestLabels.excludedMany, { n: String(excludedItems.length), min: minWords })]
      : [];
  // dopo la classifica: i mazzi a pari merito con l'ultimo che il tetto di 10 lascia fuori, poi gli altri votati
  const lastRank = String(best.ranked.at(-1)?.rank ?? 1);
  const moreRest = best.more - best.tied;
  const afterRanking = [
    best.tied > 0 ? (best.tied === 1 ? fillLabel(bestLabels.tiedOne, { rank: lastRank }) : fillLabel(bestLabels.tiedMany, { n: String(best.tied), rank: lastRank })) : "",
    moreRest > 0 ? (moreRest === 1 ? bestLabels.moreOne : fillLabel(bestLabels.moreMany, { n: String(moreRest) })) : "",
  ]
    .filter(Boolean)
    .join(" ");
  /** Pezzi di frase con i nomi linkati alle schede (In breve e riga del metodo). */
  const renderParts = (parts: BriefPart[]) =>
    parts.map((part, i) =>
      typeof part === "string" ? (
        <Fragment key={i}>{part}</Fragment>
      ) : (
        <Link key={i} href={part.href} className="link-mint">
          {part.text}
        </Link>
      ),
    );

  // Voci del filtro per tag autore, dal tag dello staff al più comune: i nomi sono quelli dei tag sui mazzi
  const authorTypes = (["staff", "pro", "influencer", "creator", "community"] as const).map((id): [string, string] => [id, d.community.badges[id]]);

  // Lista per i dati strutturati: i mazzi editoriali statici (oggi nessuno) e quelli della community che la pagina
  // mostra, dal più recente, ma solo dove la scheda si indicizza in questa lingua: la guida originale o una traduzione
  // aggiornata, e solo se la guida supera la soglia di parole (`indexableLocales`, lo stesso criterio di robots, hreflang
  // e sitemap). Senza voci l'ItemList non si dichiara:
  // una lista vuota su una pagina piena di mazzi sarebbe falsa (revisione dell'Ondata 1).
  const listed = [
    ...decks.map((deck) => ({ name: deck.name, path: href(locale, `/decks/${deck.slug}`) })),
    ...newestFirst.filter((deck) => indexableLocales(deck, [locale]).length > 0).map((deck) => ({ name: deck.name, path: href(locale, `/decks/community/${deck.slug}`) })),
  ];
  const collection = collectionPage({
    locale,
    path: href(locale, "/decks"),
    name: d.decks.title,
    description: d.decks.description,
    items: listed,
    about: videoGameId,
  });
  if (!listed.length) delete collection.mainEntity;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
          ]),
          collection,
        ]}
      />
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="t-page mt-2">{d.decks.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.decks.intro}</p>
      {brief.length ? (
        <p className="mt-4 max-w-3xl break-words text-sm leading-relaxed text-pale">
          <span className="kicker mr-2 text-mint">{d.news.inBrief}</span>
          {renderParts(brief)}
        </p>
      ) : null}

      {/* UX-13: l'invito a pubblicare sta subito sotto l'intro (prima era in fondo alla pagina, dopo tutto il resto) */}
      <section className="card-night mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1 basis-72">
          <h2 className="t-item">{d.decks.submitTitle}</h2>
          <p className="mt-1 text-pale-muted">{d.decks.submitText}</p>
        </div>
        <Link className="btn btn-primary shrink-0" href={href(locale, "/deck-builder")}>
          {d.decks.submitCta} →
        </Link>
      </section>

      {/*
        I migliori mazzi adesso (Ondata 3, C18): la classifica dei voti, con l'ancora tradotta per lingua
        (#best-decks, #migliori-mazzi, #mejores-mazos) per i link dalle altre pagine. Posizione "da classifica": i pari
        merito hanno lo stesso numero. Ogni riga porta alla scheda del mazzo e a quella della sua Leggendaria.
      */}
      {/* con la community spenta (NEXT_PUBLIC_COMMUNITY=off) non si vota: niente classifica, come l'invito della home */}
      {supabaseEnabled ? (
        <section id={bestLabels.anchor} aria-labelledby="best-decks-title" className="card-night mt-6 scroll-mt-28 p-5 sm:p-6" data-om-placement="decks_best">
          <p className="kicker text-mint">{bestLabels.kicker}</p>
          <h2 id="best-decks-title" className="t-section mt-1">
            {bestLabels.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-pale">{fillLabel(bestLabels.lead, { date: rankingDate })}</p>
          {best.ranked.length ? (
            <ol className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {best.ranked.map(({ item, rank }) => {
                const deck = item.deck;
                const leg = deck.legendary ? getCard(deck.legendary) : undefined;
                const legName = leg?.name ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name;
                const badge = deck.profile?.badge ?? "community";
                return (
                  <li key={deck.slug} className="flex min-w-0 items-center gap-2.5 rounded-xl border-2 border-sky/50 bg-night-2/80 p-3 sm:gap-3">
                    <span className="w-8 shrink-0 text-center font-display text-lg font-bold text-sky tabular sm:w-11 sm:text-xl">#{rank}</span>
                    {leg?.thumb ? (
                      // carta intera rimpicciolita, senza ritagli: i crediti impressi restano
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={leg.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" className="h-[60px] w-auto shrink-0 rounded sm:h-[72px]" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {/* il nome va a capo invece di tagliarsi: sul telefono è la cosa da leggere */}
                      <Link href={item.href} className="t-item block break-words leading-tight hover:text-mint">
                        {deck.name}
                      </Link>
                      <p className="mt-1 text-xs text-pale-muted">
                        {/* Leggendaria con la stella gialla davanti al nome (`CardName`: stella decorativa, "(Leggendaria)" per i lettori di schermo) */}
                        {leg ? (
                          <Link href={href(locale, `/cards/${leg.slug}`)} className="link-mint">
                            <CardName name={leg.name} legendary legendaryLabel={d.common.legendary} />
                          </Link>
                        ) : legName ? (
                          <CardName name={legName} legendary legendaryLabel={d.common.legendary} />
                        ) : null}
                        {legName ? " · " : ""}
                        {archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype} · {fillLabel(bestLabels.by, { name: authorName(deck.profile) })}
                        {badge !== "community" ? (
                          <span className={`stat-pill ml-1.5 px-1.5 py-0 text-[10px] font-extrabold uppercase ${badgeStyle[badge] ?? ""}`}>
                            {d.community.badges[badge as keyof typeof d.community.badges] ?? badge}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 font-mono text-xs text-pale">
                        <span className="text-gold" aria-hidden="true">
                          ★
                        </span>{" "}
                        {fillLabel(d.decks.brief.rating, { avg: oneDecimal.format(item.rating.avg), votes: votesLabel(item.rating.votes) })} ·{" "}
                        {fillLabel(bestLabels.score, { score: twoDecimals.format(item.value) })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 max-w-3xl text-pale-muted">{bestLabels.empty}</p>
          )}
          {afterRanking ? <p className="mt-3 text-sm text-pale-muted">{afterRanking}</p> : null}
          <p className="mt-4 max-w-4xl break-words text-xs leading-relaxed text-chalk-muted">
            {fillLabel(bestLabels.method, { min: minWords })}
            {excludedParts.length ? <> {renderParts(excludedParts)}</> : null}
          </p>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-chalk-muted">{bestLabels.vote}</p>
        </section>
      ) : null}

      <div className="mt-8">
        {/* sposta l'anteprima della carta quando uscirebbe dai bordi della finestra */}
        <CardMentionEdges />
        <DeckExplorer
          decks={[...list, ...communityList]}
          labels={{
            legendary: d.common.filterLegendary,
            archetype: d.common.filterArchetype,
            creator: d.common.filterCreator,
            authorType: d.common.filterAuthorType,
            authorTypes,
            clear: d.common.clearFilters,
            card: d.common.filterCard,
            all: d.common.all,
            allMasculine: d.common.allMasculine,
            results: d.common.results,
            noResults: d.common.noDecks,
            votes: d.community.votes,
            vote: d.community.vote,
            viewBlocks: d.common.viewBlocks,
            viewList: d.common.viewList,
            copyCode: d.common.copyCode,
            copied: d.common.copied,
            firstDecks: d.decks.firstDecks,
            patch: d.common.patch,
            patchFilter: d.common.filterPatch,
            sortBy: d.common.sortBy,
            sortNewest: d.common.sortNewest,
            sortRated: d.common.sortRated,
            createdOn: d.common.createdOn,
          }}
          invite={{ href: href(locale, "/deck-builder"), title: d.decks.inviteTitle, text: d.decks.inviteText, cta: d.decks.inviteCta }}
        />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="felt-panel p-6">
          <h2 className="t-section">{d.decks.legendariesTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.legendariesText.replace("{n}", String(legendaries.length))}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {legendaries.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-gold text-xs">
                  ★ {c.name} <span className="font-mono font-normal">{statLine(c)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="felt-panel p-6">
          <h2 className="t-section">{d.decks.conquestTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.conquestText}</p>
        </section>
      </div>
    </div>
  );
}
