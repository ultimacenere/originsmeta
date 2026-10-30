import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { patchLabel, patchOrder, statLine, type PatchId } from "@/lib/data/cards";
import { DeckExplorer } from "@/components/DeckExplorer";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { PageNotes } from "@/components/PageNotes";
import { TheoryCraftTabs } from "@/components/TheoryCraftTabs";
import { listDeckPopularity, listPublishedDecks } from "@/lib/community/queries";
import { favoriteLabels } from "@/lib/favoriteLabels";
import { creatorIndex, listCreators } from "@/lib/community/creators";
import { creatorLabels } from "@/lib/creatorLabels";
import { indexableLocales } from "@/lib/community/deckQuality";
import { BADGE_ORDER } from "@/lib/community/badges";
import { communityExplorerDecks } from "@/lib/community/explorerDecks";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";
import { THEORY_DECKS_PATH, THEORY_PATH, splitTheory, theoryCards } from "@/lib/theoryCraft";
import { fillTheory, theoryCraftLabels } from "@/lib/theoryCraftLabels";

/**
 * Mazzi theory craft (29/10/2026, Pierluigi: "una sottosezione con tutti i deck theory craftati esattamente uguale alla
 * sezione ufficiale dei deck"): i mazzi della community con almeno una carta che oggi non è nel gioco (`splitTheory`), con
 * lo stesso elenco di /decks (`DeckExplorer`, righe da `communityExplorerDecks`: filtri, ordini, voti, viste). Senza
 * codice del gioco (il gioco non ha quelle carte) e senza win rate (nessuno le gioca). La scheda di ogni mazzo resta
 * /decks/community/<slug>, così l'indirizzo non cambia quando le carte arrivano nel gioco e il mazzo passa fra i mazzi
 * singoli. In ISR come /decks; noindex finché è vuota.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const t = theoryCraftLabels[locale].decks;
  const { theory } = splitTheory(await listPublishedDecks());
  return pageMeta(locale, THEORY_DECKS_PATH, t.metaTitle, t.description, undefined, { noindex: theory.length === 0 });
}

export default async function TheoryDecksPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const T = theoryCraftLabels[locale];
  const t = T.decks;
  const { theory } = splitTheory(await listPublishedDecks());
  const popularity = await listDeckPopularity();
  const creators = creatorIndex(await listCreators());
  const newestFirst = theory.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  // niente codice del gioco (le carte non ci sono) e niente win rate (nessuno gioca questi mazzi)
  const list = communityExplorerDecks({ decks: newestFirst, locale, d, gameCodes: new Map(), popularity, creators, winrates: null });
  const legendaries = theoryCards.filter((c) => c.legendary);

  const roles = BADGE_ORDER.map((id): [string, string] => [id, d.community.badges[id]]);
  // versioni del gioco del filtro: dalla prima usata da un mazzo theory craft all'ultima uscita, dalla più recente
  const firstVersion = Math.min(...list.map((deck) => (deck.patchId ? patchOrder.indexOf(deck.patchId as PatchId) : Infinity)));
  const versions = patchOrder
    .slice(Number.isFinite(firstVersion) && firstVersion >= 0 ? firstVersion : patchOrder.length - 1)
    .map((id): [string, string] => [id, patchLabel(id, locale)])
    .reverse();

  // dati strutturati: solo le schede che si indicizzano nella lingua della pagina, come /decks
  const listed = newestFirst
    .filter((deck) => indexableLocales(deck, [locale]).length > 0)
    .map((deck) => ({ name: deck.name, path: href(locale, `/decks/community/${deck.slug}`) }));
  const collection = collectionPage({ locale, path: href(locale, THEORY_DECKS_PATH), name: t.title, description: t.description, items: listed, about: videoGameId });
  if (!listed.length) delete collection.mainEntity;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: T.builder.title, path: href(locale, THEORY_PATH) },
            { name: t.title, path: href(locale, THEORY_DECKS_PATH) },
          ]),
          collection,
        ]}
      />
      <TheoryCraftTabs locale={locale} active="decks" />
      <p className="kicker text-mint">{d.nav.builder}</p>
      <h1 className="t-page mt-2">{t.title}</h1>
      <p className="mt-4 flex flex-wrap gap-3">
        <Link className="btn btn-primary" href={href(locale, THEORY_PATH)}>
          {t.cta} →
        </Link>
        <Link className="btn btn-ghost" href={href(locale, "/decks")}>
          {d.nav.decksSingle} →
        </Link>
      </p>

      <div className="mt-6">
        <CardMentionEdges />
        <DeckExplorer
          decks={list}
          labels={{
            legendary: d.common.filterLegendary,
            archetype: d.common.filterArchetype,
            publishedBy: d.common.publishedBy,
            role: d.common.filterRole,
            roles,
            clear: d.common.clearFilters,
            card: d.common.filterCard,
            all: d.common.all,
            allMasculine: d.common.allMasculine,
            results: d.common.results,
            noResults: d.common.noDecks,
            votes: d.community.votes,
            vote: d.community.vote,
            winrate: { games: d.tier.winrate.games, gamesOne: d.tier.winrate.gamesOne, title: d.tier.winrate.deckBox.title },
            viewBlocks: d.common.viewBlocks,
            viewList: d.common.viewList,
            copyCode: d.common.copyCode,
            copied: d.common.copied,
            firstDecks: t.title,
            patch: d.common.patch,
            patchFilter: d.common.filterPatch,
            versions,
            sortBy: d.common.sortBy,
            sortNewest: d.common.sortNewest,
            sortRated: d.common.sortRated,
            ...(popularity ? { sortTrending: favoriteLabels[locale].sortTrending, sortSaved: favoriteLabels[locale].sortSaved } : {}),
            createdOn: d.common.createdOn,
            channels: creatorLabels[locale].channels,
            live: creatorLabels[locale].live,
          }}
          invite={{ href: href(locale, THEORY_PATH), title: t.inviteTitle, text: t.inviteText, cta: t.inviteCta }}
        />
      </div>

      {/* le Leggendarie che il Theory craft aggiunge, come il riquadro delle Leggendarie di /decks */}
      <section className="felt-panel mt-12 p-6">
        <h2 className="t-section">{t.legendariesTitle}</h2>
        <p className="mt-3 text-chalk-muted">{fillTheory(t.legendariesText, { n: legendaries.length, total: theoryCards.length })}</p>
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

      <PageNotes>
        <p className="max-w-2xl text-chalk-muted">{t.intro}</p>
        <p className="mt-4 max-w-3xl text-sm text-pale">{t.note}</p>
      </PageNotes>
    </div>
  );
}
