import type { Metadata } from "next";
import Link from "next/link";
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
import { deckGameCode } from "@/lib/deckGameCode";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

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
  return pageMeta(locale, "/decks", dict.decks.title, dict.decks.description);
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
  // una lista stabile.
  const communityList: ExplorerDeck[] = community
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((deck) => {
      const leg = deck.legendary ? getCard(deck.legendary) : undefined;
      const legCustom = !leg ? deck.custom_cards.find((x) => x.slug === deck.legendary) : undefined;
      return {
        slug: `community-${deck.slug}`,
        name: deck.name,
        href: href(locale, `/decks/community/${deck.slug}`),
        tagline: deck.guide.summary.length > 140 ? `${deck.guide.summary.slice(0, 140).trimEnd()}…` : deck.guide.summary,
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

  // Lista per i dati strutturati: solo i mazzi editoriali statici (oggi `decks` è vuoto, quindi l'ItemList
  // resta senza voci). I mazzi della community non ci vanno: arrivano da Supabase e cambiano a ogni
  // pubblicazione, e ognuno ha già la sua scheda indicizzabile in /decks/community/[slug].
  const listed = decks.map((deck) => ({ name: deck.name, path: href(locale, `/decks/${deck.slug}`) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/decks"),
            name: d.decks.title,
            description: d.decks.description,
            items: listed,
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="t-page mt-2">{d.decks.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.decks.intro}</p>

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
            card: d.common.filterCard,
            all: d.common.all,
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
