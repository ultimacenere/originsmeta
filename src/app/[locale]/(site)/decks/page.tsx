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
import { guideLocales, localizedGuide } from "@/lib/community/deckTranslation";
import { deckGameCode } from "@/lib/deckGameCode";
import { deckBrief, usageCounts, weightedRating } from "@/lib/tierstats";
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
  const lastDeck = community.map((deck) => deck.created_at.slice(0, 10)).sort().at(-1);
  const usage = usageCounts(community);
  const brief = lastDeck
    ? deckBrief({
        locale,
        t: d.decks.brief,
        decks: community.length,
        lastDate: formatDate(locale, lastDeck),
        legendaries: legendaries.map((c) => ({ name: c.name, href: href(locale, `/cards/${c.slug}`), value: usage.legendaries[c.slug] ?? 0 })),
        rated: community.flatMap((deck) =>
          deck.rating && deck.rating.votes > 0
            ? [{ name: deck.name, href: href(locale, `/decks/community/${deck.slug}`), value: weightedRating(deck.rating.avg, deck.rating.votes), rating: deck.rating }]
            : [],
        ),
        inDecks: (n) => (n === 1 ? d.tier.inDecksOne : d.tier.inDecksMany.replace("{n}", String(n))),
        votes: (n) => (n === 1 ? d.tier.explorer.votesOne : d.tier.explorer.votesMany.replace("{n}", String(n))),
      })
    : [];

  // Voci del filtro per tag autore, dal tag dello staff al più comune: i nomi sono quelli dei tag sui mazzi
  const authorTypes = (["staff", "pro", "influencer", "community"] as const).map((id): [string, string] => [id, d.community.badges[id]]);

  // Lista per i dati strutturati: i mazzi editoriali statici (oggi nessuno) e quelli della community che la pagina
  // mostra, dal più recente, ma solo dove la scheda si indicizza in questa lingua: la guida originale o una traduzione
  // aggiornata (`guideLocales`, lo stesso criterio di hreflang e sitemap). Senza voci l'ItemList non si dichiara:
  // una lista vuota su una pagina piena di mazzi sarebbe falsa (revisione dell'Ondata 1).
  const listed = [
    ...decks.map((deck) => ({ name: deck.name, path: href(locale, `/decks/${deck.slug}`) })),
    ...newestFirst.filter((deck) => guideLocales(deck, [locale]).length > 0).map((deck) => ({ name: deck.name, path: href(locale, `/decks/community/${deck.slug}`) })),
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
          {brief.map((part, i) =>
            typeof part === "string" ? (
              <Fragment key={i}>{part}</Fragment>
            ) : (
              <Link key={i} href={part.href} className="link-mint">
                {part.text}
              </Link>
            ),
          )}
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
