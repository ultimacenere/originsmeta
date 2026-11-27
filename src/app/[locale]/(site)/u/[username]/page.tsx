import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { formatDate, href, siteUrl, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getCard, getCardByKey, patchAt, patchLabel, type Card } from "@/lib/data/cards";
import { authors } from "@/lib/data/authors";
import { getProfileByUsername, listDecksByOwner, profileMovedTo } from "@/lib/community/queries";
import { countEntries, listPublicTierLists } from "@/lib/community/tierlists";
import {
  communityPageLabels,
  dropHreflang,
  editorialAuthor,
  fillLabel,
  profileDescription,
  profileIndexable,
  profileTitle,
  type ProfileFacts,
} from "@/lib/community/deckQuality";
import { authorName } from "@/lib/community/util";
import { communityPerson, communityProfilePage } from "@/lib/jsonld/deck";
import { Avatar } from "@/components/AccountMenu";
import { FollowButton } from "@/components/follow/FollowButton";
import { GameCard } from "@/components/GameCard";
import { ProfileDeckSets } from "@/components/ProfileDeckSets";
import { deckArtUrl } from "@/lib/community/deckArt";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { getProfileShowcase } from "@/lib/community/creators";
import { isShowcaseBadge, normalizeBadge } from "@/lib/community/badges";
import { creatorLabels } from "@/lib/creatorLabels";
import { ProfileShowcase } from "@/components/ProfileShowcase";
import { LiveBadge } from "@/components/LiveBadge";
import { twitchLogin } from "@/lib/community/profileLinks";
import { CreatorTournaments } from "@/components/CreatorTournaments";
import { StaffMessageLink } from "@/components/inbox/InboxIndicator";
// vetrina dei profili (pacchetto VETRINA, 27/09/2026): copertina, colore d'accento, frase, Leggendaria del cuore, mazzo e video in evidenza, orari
import { getProfileVetrina } from "@/lib/community/showcaseQueries";
import { ACCENT_HEX } from "@/lib/community/showcase";
import { ProfileCover } from "@/components/showcase/ProfileCover";
import { ProfileBackground } from "@/components/showcase/ProfileBackground";
import { favoriteLegendaryCard } from "@/components/showcase/FavoriteLegendary";
import { ShowcaseFeatured } from "@/components/showcase/ShowcaseFeatured";
import { ProfileHighlights } from "@/components/achievements/ProfileHighlights";
import { readPublicStats } from "@/lib/community/achievementQueries";
import { UserGuides } from "@/components/guides/AccountGuides";
import { listGuidesByOwner } from "@/lib/community/guideQueries";
import { listComicsByOwner } from "@/lib/community/comicQueries";
import { comicFeedCards } from "@/lib/community/comics";
import { UserComics } from "@/components/comics/UserComics";
import { safeAvatarUrl } from "@/lib/community/profileMedia";
import { supabaseUrl } from "@/lib/supabase/env";
import { deckCardsDate, deckCardsUpdated } from "@/lib/community/deckVersions";
import { isTheoryDeck } from "@/lib/theoryCraft";
import { theoryCraftLabels } from "@/lib/theoryCraftLabels";
import { deckGameCode } from "@/lib/deckGameCode";
import { readWinrate } from "@/lib/community/trackerStatsQueries";
import { deckListKey } from "@/lib/tracker/stats";
import { axisFor, fmtInt, pct, rated } from "@/lib/tracker/snapshot";
import { CardArt, Interval, Star } from "@/components/analytics/parts";
import { listTotals, mostUsedLegendary, vsMeta, VS_MIN_GAMES } from "@/lib/profileOnda";
import { fillOnda, ondaLabels, pluralOnda } from "@/lib/profileOndaLabels";
import { ProfileDeckBoard, type BoardRow } from "@/components/profile/ProfileDeckBoard";
import "@/components/profile/onda.css";

type Params = Promise<{ locale: string; username: string }>;

/*
  Pagina pubblica di un iscritto (23/09/2026, §1 punto 27.5 della KB: "mazzi e tier list create visibili nel
  profilo di chi le ha create… il profilo deve avere una sua utilità"). /account resta il pannello privato,
  che vede solo il proprietario; questa è la pagina che si può mandare a qualcuno.

  Dal 27/11/2026 nella grafica «In onda» (Pierluigi, fra tre prototipi veri: "procediamo con la versione in onda! poi
  implementeremo la gamification al suo interno"): il linguaggio di /analytics, a fasce. In testa il sottopancia da
  diretta (foto, nome, ruolo, LIVE, Segui, canali), la Leggendaria del cuore come carta del gioco e il tabellone dei
  numeri; poi i suoi mazzi come classifica da diretta, con il win rate della lista esatta dal Tracker (aggregato
  pubblico, mai le partite personali né il numero di giocatori); poi le sue liste contro le altre della stessa
  Leggendaria (profileOnda.ts); in fondo tutto il resto di prima (vetrina, traguardi, tornei, mazzi torneo, tier list,
  guide, fumetti). Testi nuovi in profileOndaLabels.ts, otto lingue.

  Non è la pagina autore editoriale (/authors), che resta per chi firma news e guide del sito.
  ISR come le schede dei mazzi: si rigenera al massimo ogni 5 minuti e subito dopo ogni pubblicazione.
*/
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

/**
 * Profilo, mazzi e tier list di un iscritto, e i fatti che ne derivano: li usano sia i metadati sia la pagina.
 * Le letture passano dalla cache dei dati di Next, quindi chiamarla due volte non raddoppia le query.
 * Un errore del database si lancia (queries.ts, DECKS-12): la rigenerazione fallisce e resta la pagina di prima.
 */
const loadProfile = cache(async (username: string) => {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  // Tutte le altre letture partono insieme (17/10/2026, Pierluigi: "fastidioso delay"): prima fumetti, canali e vetrina
  // si leggevano uno dopo l'altro nella pagina, dopo queste tre, e la prima visita di un profilo aspettava ~2 s.
  const showcaseRole = isShowcaseBadge(normalizeBadge(profile.badge));
  const extras = Promise.all([
    listComicsByOwner(profile.id, 24),
    getProfileShowcase(profile.id),
    // Vetrina (pacchetto VETRINA): solo per Creator, Autore, Pro e Staff; null prima della migrazione (la pagina resta com'era)
    showcaseRole ? getProfileVetrina(profile.id) : Promise.resolve(null),
    // "Mostra i numeri" (pacchetto TRAGUARDI): dal 27/11/2026 nel tabellone in testa, non più nel riquadro "In numeri"
    showcaseRole ? readPublicStats(profile.id) : Promise.resolve(null),
    // numeri del Tracker della patch (In onda, 27/11/2026): facoltativi, un errore non deve far cadere il profilo
    readWinrate().catch(() => null),
  ]);
  // `extras` si aspetta anche se le letture qui sotto lanciano: niente promesse rifiutate senza nessuno che le ascolti
  extras.catch(() => undefined);
  // Le due letture lanciano con un errore (DECKS-12, `rowsOrThrow`): un profilo "senza mazzi" o "senza tier list" per
  // un guasto di rete non finisce in cache. Le guide della community pubblicate (pacchetto GUIDE) contano per
  // l'indicizzazione del profilo, come mazzi e tier list.
  const [decks, tierLists, guides] = await Promise.all([listDecksByOwner(profile.id), listPublicTierLists(profile.id), listGuidesByOwner(profile.id, 24)]);
  const tierKinds = [...new Set(tierLists.map((t) => t.kind))];
  const name = authorName(profile);
  // Le Leggendarie dei mazzi, dal più recente e senza doppioni (anche quelle scritte a mano, fuori dal database)
  const legendaries = [
    ...new Set(decks.flatMap((deck) => (deck.legendary ? [getCard(deck.legendary)?.name ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name ?? ""] : [])).filter(Boolean)),
  ];
  const facts: ProfileFacts = { name, decks: decks.length, legendaries, tierLists: tierKinds.length, tierKinds, guides: guides.length };
  // L'autore editoriale dietro l'account, se authors.ts lo dichiara (nome utente o mazzi: Davdas è luigidavdasragoni)
  const editorial = editorialAuthor(
    authors,
    decks.map((deck) => deck.slug),
    profile.username,
  );
  const [comics, showcase, vetrina, publicStats, winrate] = await extras;
  const stats = winrate && winrate.status === "ok" ? winrate.data : null;
  return { profile, decks, tierLists, guides, name, facts, editorial, comics, showcase, showcaseRole, vetrina, publicStats, stats };
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params;
  const { locale } = await resolveLocale(params);
  const data = await loadProfile(username);
  if (!data) return {};
  // Title e description dai dati (DECKS-09, 25/09/2026). Un profilo senza mazzi, tier list né guide è una pagina vuota:
  // noindex e senza hreflang (`dropHreflang`), e resta fuori dalla sitemap (`listPublicProfiles`).
  const indexable = profileIndexable(data.facts);
  const meta = pageMeta(locale, `/u/${data.profile.username}`, profileTitle(data.facts, locale), profileDescription(data.facts, locale), undefined, {
    noindex: !indexable,
  });
  return indexable ? meta : dropHreflang(meta);
}

/**
 * Avatar per i dati strutturati: solo una foto di Discord o una caricata nel bucket del sito (`safeAvatarUrl`,
 * revisione del 27/09/2026: prima bastava un indirizzo http(s) qualsiasi, anche uno arrivato dai metadati del magic link).
 */
function avatarUrl(url: string | null | undefined): string | undefined {
  return safeAvatarUrl(url, supabaseUrl) ?? undefined;
}

/** Il nome corto dell'archetipo ("Swarm", "Midrange"): la parte prima della barra. */
const archShort = (id: string, locale: Locale) => (archetypeLabels[id]?.[locale] ?? archetypeLabels[id]?.en ?? id).split(" / ")[0];

/** Testata di una fascia, come quelle di /analytics: numero, titolo, patch a destra. */
function SecHead({ num, id, title, meta }: { num: number; id: string; title: string; meta?: string }) {
  return (
    <div className="an-sec-head">
      <span className="an-sec-num" aria-hidden="true">
        {String(num).padStart(2, "0")}
      </span>
      <h2 id={id} className="an-h2 onda-h2">
        {title}
      </h2>
      {meta ? <span className="an-sec-meta">{meta}</span> : null}
    </div>
  );
}

/*
  Niente scheletro di caricamento qui (17/10/2026, provato e tolto): né loading.tsx né <Suspense>. Con tutti e due la
  pagina salvata nella cache ISR ha lo scheletro in vista e il contenuto in un <div hidden> che solo uno script mostra
  (male per chi legge l'HTML senza JavaScript: crawler e LLM), e con loading.tsx un nome sbagliato diventa un 200 invece
  di un 404. Il ritardo della prima visita si accorcia con le letture in parallelo di `loadProfile`.
*/
export default async function PublicProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const p = c.profile;
  const data = await loadProfile(username);
  if (!data) {
    // un nome utente cambiato dal profilo (23/10/2026): i link di prima (mazzi, Discord, avvisi, motori) portano lì
    const moved = await profileMovedTo(username);
    if (moved) permanentRedirect(href(locale, `/u/${moved}`));
    notFound();
  }
  const { profile, decks, tierLists, guides, name, editorial, showcase, showcaseRole, vetrina, publicStats, stats } = data;
  const O = ondaLabels[locale];
  // fumetti pubblicati (pacchetto FUMETTI, 29/09/2026): solo mostrati, non contano per l'indicizzazione del profilo
  const comics = comicFeedCards(data.comics, locale, supabaseUrl, authorName);
  const L = communityPageLabels[locale];
  // ruolo del profilo (27/09/2026): un tag che il codice non conosce, come `influencer` prima della migrazione, vale community e non si mostra
  const role = normalizeBadge(profile.badge);
  const badge = role !== "community" ? role : null;
  const path = href(locale, `/u/${profile.username}`);
  const pageUrl = `${siteUrl}${path}`;
  // Stessa Person della firma dei suoi mazzi (src/lib/jsonld/deck.ts); qui con nome utente, avatar e il nome mostrato
  // nella pagina quando è diverso da quello della Person.
  const personName = editorial?.name ?? name;
  const alternateNames = [...new Set([profile.username, name])].filter((n): n is string => Boolean(n) && n !== personName);
  const image = avatarUrl(profile.avatar_url);
  // badge LIVE nella testata: solo i ruoli con vetrina e un canale Twitch nel profilo (le regole di /api/live). Per il
  // ruolo Creator, Autore, Pro o Staff i canali sono i sameAs della Person, non per un autore editoriale (authors.ts).
  const liveHeader = showcaseRole && Boolean(profile.username) && showcase !== null && twitchLogin(showcase.links) !== null;
  const sameAs = showcaseRole && !editorial && showcase?.links.length ? showcase.links.map((l) => l.url) : [];
  const person = communityPerson({
    locale,
    username: profile.username,
    name,
    editorial,
    extra: {
      ...(profile.username ? { identifier: profile.username } : {}),
      ...(alternateNames.length ? { alternateName: alternateNames.length === 1 ? alternateNames[0] : alternateNames } : {}),
      ...(image ? { image } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
  });

  // ---------- numeri del Tracker ----------
  const keyOf = (slug: string) => getCard(slug)?.key;
  const lists = new Map((stats?.lists ?? []).map((l) => [l.list, { games: l.games, wins: l.wins }]));
  const patch = stats ? patchLabel(stats.patch, locale) : null;
  const gamesText = (n: number) => pluralOnda(locale, n, O.games, fmtInt(n, locale));
  // ogni mazzo con la lista in chiavi del gioco (per il Tracker) e il win rate della sua lista esatta
  const tracked = decks.map((deck) => {
    const key = deckListKey({ legendary: deck.legendary, cards: deck.cards }, keyOf);
    return {
      deck,
      legendary: deck.legendary ? (keyOf(deck.legendary) ?? deck.legendary) : null,
      cards: deck.cards.map((s) => keyOf(s) ?? s),
      winrate: key ? (lists.get(key) ?? null) : null,
    };
  });
  const totals = listTotals(tracked);
  const totalRated = totals.games > 0 ? rated(totals) : null;
  const votes = decks.reduce((s, x) => s + (x.rating?.votes ?? 0), 0);

  // ---------- la carta della testata: la Leggendaria del cuore, altrimenti quella che usa di più ----------
  const heart = vetrina ? (favoriteLegendaryCard(vetrina.favoriteLegendary) ?? null) : null;
  const mostUsed = mostUsedLegendary(decks.map((x) => ({ legendary: x.legendary && getCard(x.legendary)?.legendary ? x.legendary : null })));
  const heroCard: Card | null = heart ?? (mostUsed ? (getCard(mostUsed) ?? null) : null);
  const heroCaption = heart ? O.heartFavorite : O.heartMostUsed;

  // ---------- tabellone ----------
  type Cell = { key: string; label: string; value: string; sub?: string };
  const cells: Cell[] = [{ key: "decks", label: O.score.decks, value: fmtInt(decks.length, locale) }];
  if (totalRated) {
    cells.push({ key: "games", label: O.score.games, value: fmtInt(totalRated.games, locale) });
    cells.push({ key: "wr", label: O.score.winrate, value: pct(totalRated.r, locale), sub: fillOnda(O.score.prudent, { pct: pct(totalRated.lo, locale) }) });
  }
  if (votes > 0) cells.push({ key: "votes", label: O.score.votes, value: fmtInt(votes, locale) });
  if (publicStats?.views) cells.push({ key: "views", label: O.score.views, value: fmtInt(publicStats.views, locale), sub: O.score.estimates });
  if (publicStats?.codeCopies) cells.push({ key: "copies", label: O.score.copies, value: fmtInt(publicStats.codeCopies, locale), sub: O.score.estimates });
  const estimates = Boolean(publicStats?.views || publicStats?.codeCopies);

  // ---------- classifica dei mazzi ----------
  const codes = await Promise.all(decks.map((x) => deckGameCode({ legendary: x.legendary, cards: x.cards, custom_cards: x.custom_cards }).catch(() => ({ code: null }))));
  const theoryPill = theoryCraftLabels[locale].deck.pill;
  const rows: BoardRow[] = tracked.map(({ deck, winrate }, i) => {
    const legendary = deck.legendary ? getCard(deck.legendary) : undefined;
    const art = deckArtUrl(deck, supabaseUrl);
    const thumbSrc = art ?? legendary?.thumb ?? legendary?.image ?? null;
    const r = winrate && winrate.games > 0 ? rated(winrate) : null;
    const cardsPatch = patchAt(deckCardsDate(deck));
    const updated = deckCardsUpdated(deck);
    const theory = isTheoryDeck(deck);
    return {
      id: deck.id,
      name: deck.name,
      href: href(locale, `/decks/community/${deck.slug}`),
      thumb: thumbSrc ? { src: thumbSrc, art: Boolean(art) } : null,
      legendaryName: legendary?.name ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name ?? null,
      archetype: { id: deck.archetype, label: archShort(deck.archetype, locale) },
      theory: theory ? theoryPill : null,
      stats: r
        ? {
            games: r.games,
            lo: r.lo,
            hi: r.hi,
            r: r.r,
            wrText: pct(r.r, locale),
            gamesText: gamesText(r.games),
            // «In forma»: anche il bordo prudente (il caso peggiore dell'intervallo al 95%) sta sopra il 50%
            inForm: r.lo > 0.5,
            aria: fillOnda(O.decks.rowAria, { wr: pct(r.r, locale), lo: pct(r.lo, locale), games: gamesText(r.games) }),
            prudentText: fillOnda(O.decks.prudentShort, { pct: pct(r.lo, locale) }),
          }
        : null,
      votes: deck.rating?.votes ?? 0,
      votesText: deck.rating?.votes ? `${deck.rating.avg.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} · ${pluralOnda(locale, deck.rating.votes, O.votes)}` : null,
      recentAt: Date.parse(deckCardsDate(deck)) || 0,
      dateText: updated ? `${d.common.updated} ${formatDate(locale, updated.slice(0, 10))}` : `${d.common.createdOn} ${formatDate(locale, deck.created_at.slice(0, 10))}`,
      patchText: cardsPatch ? fillOnda(O.decks.cardsPatch, { patch: patchLabel(cardsPatch, locale) }) : null,
      code: theory ? null : (codes[i]?.code ?? null),
      copyAria: fillOnda(O.decks.copyAria, { name: deck.name }),
      cardsLabel: fillOnda(O.decks.cardsOf, { name: deck.name }),
      cards: deck.cards.flatMap((slug) => {
        const card = getCard(slug);
        const custom = card ? undefined : deck.custom_cards.find((x) => x.slug === slug);
        const cardName = card?.name ?? custom?.name;
        if (!cardName) return [];
        return [{ slug, name: cardName, src: card?.thumb ?? card?.image ?? null, href: href(locale, `/cards/${slug}`) }];
      }),
    };
  });
  const played = rows.filter((r) => r.stats);
  const axis = axisFor(played.flatMap((r) => [r.stats!.lo, r.stats!.hi]));
  const anyForm = played.some((r) => r.stats!.inForm);

  // ---------- contro il meta ----------
  const vs = stats
    ? vsMeta(
        tracked.filter((t) => !isTheoryDeck(t.deck)),
        stats.legendaries,
      ).flatMap((v) => {
        const card = getCardByKey(v.legendary);
        return card ? [{ ...v, card, mineR: rated(v.mine), othersR: rated(v.others) }] : [];
      })
    : [];
  const vsAxis = axisFor(vs.flatMap((v) => [v.mineR.lo, v.mineR.hi, v.othersR.lo, v.othersR.hi]));

  const accent = vetrina?.accent ? ACCENT_HEX[vetrina.accent] : null;
  const hasBg = Boolean(vetrina && (vetrina.backgroundPath || vetrina.backgroundPreset));
  const pageStyle = accent ? ({ "--onda-accent": accent } as CSSProperties) : undefined;
  let sec = 0;

  return (
    <div className={`an-page onda${hasBg ? " has-bg" : ""}`} style={pageStyle}>
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
            { name, path },
          ]),
          communityProfilePage({ locale, pageUrl, name, person, created: profile.created_at, decks: decks.length }),
        ]}
      />
      {vetrina ? <ProfileBackground vetrina={vetrina} /> : null}

      {/* ---------- 1. sottopancia e tabellone ---------- */}
      <section className="an-band an-band--stage is-top onda-hero" aria-labelledby="profile-name">
        <div className="an-wrap">
          {vetrina ? (
            <div className="onda-cover">
              <ProfileCover vetrina={vetrina} />
            </div>
          ) : null}
          <div className={`onda-hero-grid${heroCard ? "" : " is-solo"}`}>
            <div className="onda-hero-main">
              <div className="onda-lt">
                <span className="onda-lt-photo">
                  {/* sulla vetrina prima la foto caricata dal sito */}
                  <Avatar profile={vetrina ? { ...profile, avatar_path: vetrina.avatarPath } : profile} name={name} size={84} />
                </span>
                <div className="onda-lt-text">
                  <h1 id="profile-name" className="onda-lt-name">
                    {name}
                  </h1>
                  <p className="onda-lt-strip">
                    {profile.username ? <span>@{profile.username}</span> : null}
                    {profile.created_at ? <span>{fillOnda(O.memberSince, { date: formatDate(locale, profile.created_at.slice(0, 10)) })}</span> : null}
                  </p>
                </div>
              </div>
              {vetrina?.tagline ? <p className="onda-blurb">{vetrina.tagline}</p> : null}
              <div className="onda-hero-tags">
                {badge ? <span className={`${badgePill} ${badgeStyle[badge]}`}>{c.badges[badge]}</span> : null}
                {/* badge LIVE accanto al ruolo, grande e con gli spettatori; caricato nel browser, la pagina resta ISR */}
                {liveHeader ? <LiveBadge username={profile.username ?? ""} labels={creatorLabels[locale].live} placement="profile" size="lg" /> : null}
                {/* "Segui" (pacchetto SEGUI): solo i ruoli con vetrina; stato e follower letti nel browser */}
                <FollowButton profileId={profile.id} name={name} badge={profile.badge} locale={locale} placement="profile" />
              </div>
              {/* Chi pubblica mazzi ed è anche un autore del sito (DECKS-10 e MQ-13): link alla sua pagina /authors */}
              {editorial ? (
                <p className="mt-3 text-sm">
                  <Link href={href(locale, `/authors/${editorial.slug}`)} className="link-mint font-bold">
                    {fillLabel(L.authorPage, { name: editorial.name })}
                  </Link>
                </p>
              ) : null}
              <ProfileShowcase showcase={showcase} name={name} locale={locale} />
              {/* "Scrivi a questo utente": solo per lo staff, deciso nel browser (la pagina è ISR) */}
              <StaffMessageLink locale={locale} username={profile.username} profileId={profile.id} />
            </div>
            {heroCard ? (
              <figure className="onda-heart">
                <Link href={href(locale, `/cards/${heroCard.slug}`)} prefetch={false} aria-label={`${heroCaption}: ${heroCard.name}`}>
                  <GameCard card={heroCard} locale={locale} className="onda-heart-card" priority />
                </Link>
                <figcaption className="pen-note is-quiet">{heroCaption}</figcaption>
              </figure>
            ) : null}
          </div>

          {cells.length > 1 ? (
            <div className="an-panel an-snapshot onda-score">
              {patch && totalRated ? (
                <div className="an-snap-top">
                  <span className="an-snap-patch">
                    {d.common.patch} {patch}
                  </span>
                  <span className="onda-score-src">OriginsMeta Tracker</span>
                </div>
              ) : null}
              <div className="an-snap-grid">
                {cells.map((cell, i) => (
                  <div key={cell.key} className={`an-cell-slot${cells.length % 2 === 1 && i === cells.length - 1 ? " is-full" : ""}`}>
                    <div className="an-cell">
                      <span className="an-cell-label onda-cell-label">{cell.label}</span>
                      <span className="an-cell-value">{cell.value}</span>
                      {cell.sub ? <span className="an-cell-sub">{cell.sub}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {totalRated && patch ? <p className="an-quiet onda-note">{fillOnda(O.scoreNote, { patch })}</p> : null}
          {estimates ? (
            <p className="an-quiet onda-note">{publicStats?.since ? fillOnda(O.statsNote, { date: formatDate(locale, publicStats.since) }) : O.statsNoteNoDate}</p>
          ) : null}
          {decks.length === 0 ? <p className="onda-empty">{p.noDecks}</p> : null}

          {/* Vetrina: mazzo e video in evidenza, orari delle dirette nel fuso di chi guarda */}
          {vetrina ? (
            <div className="onda-featured">
              <ShowcaseFeatured vetrina={vetrina} decks={decks} ownerId={profile.id} locale={locale} dict={d} name={name} />
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------- 2. i suoi mazzi, dal Tracker quando ci sono partite ---------- */}
      {rows.length ? (
        <section className="an-band an-band--deep" aria-labelledby="profile-decks">
          <div className="an-wrap">
            <SecHead num={++sec} id="profile-decks" title={p.decksTitle} meta={patch && played.length ? `${d.common.patch} ${patch}` : undefined} />
            <div className="mt-6">
              <ProfileDeckBoard
                rows={rows}
                axis={axis}
                labels={{
                  sortLabel: O.decks.sortLabel,
                  sortPrudent: O.decks.sortPrudent,
                  sortGames: O.decks.sortGames,
                  sortVotes: O.decks.sortVotes,
                  sortRecent: O.decks.sortRecent,
                  noGames: O.decks.noGames,
                  inForm: O.decks.inForm,
                  copy: d.common.copyCode,
                  copied: d.common.copied,
                  open: d.common.openDeck,
                }}
              />
              {anyForm ? <p className="an-hint">{O.decks.inFormNote}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- 3. le sue liste contro le altre della stessa Leggendaria ---------- */}
      {vs.length && patch ? (
        <section className="an-band an-band--felt" aria-labelledby="profile-vs">
          <div className="an-wrap">
            <SecHead num={++sec} id="profile-vs" title={O.vs.title} meta={`${d.common.patch} ${patch}`} />
            <ul className="onda-vs">
              {vs.map((v) => {
                const cardName = v.card.name;
                const line = fillOnda(O.vs[v.verdict], { name: cardName });
                return (
                  <li key={v.card.slug} className="onda-vs-row">
                    <Link href={href(locale, `/cards/${v.card.slug}`)} prefetch={false} className="onda-vs-card" aria-label={cardName}>
                      <CardArt src={v.card.image} thumb={v.card.thumb} name={cardName} width={64} />
                    </Link>
                    <div className="onda-vs-body">
                      <h3 className="an-h3">
                        <Star label={O.legendary} />
                        {cardName}
                      </h3>
                      <div className="onda-vs-bars">
                        <span className="onda-vs-lbl">{O.vs.mine}</span>
                        <Interval
                          lo={v.mineR.lo}
                          hi={v.mineR.hi}
                          r={v.mineR.r}
                          axis={vsAxis}
                          label={fillOnda(O.vs.mineAria, { wr: pct(v.mineR.r, locale), games: gamesText(v.mine.games) })}
                        />
                        <span className="onda-vs-num">
                          <b>{pct(v.mineR.r, locale)}</b> {gamesText(v.mine.games)}
                        </span>
                        <span className="onda-vs-lbl">{O.vs.others}</span>
                        <Interval
                          lo={v.othersR.lo}
                          hi={v.othersR.hi}
                          r={v.othersR.r}
                          axis={vsAxis}
                          label={fillOnda(O.vs.othersAria, { name: cardName, wr: pct(v.othersR.r, locale), games: gamesText(v.others.games) })}
                        />
                        <span className="onda-vs-num">
                          <b>{pct(v.othersR.r, locale)}</b> {gamesText(v.others.games)}
                        </span>
                      </div>
                      <p className="onda-vs-line">
                        {v.verdict === "thin" ? null : (
                          <span className={`onda-vs-diff is-${v.diff > 0 ? "up" : v.diff < 0 ? "down" : "even"}`}>
                            {v.diff > 0 ? "+" : v.diff < 0 ? "−" : ""}
                            {fillOnda(O.vs.points, { n: Math.abs(v.diff).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                          </span>
                        )}
                        {line}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="an-hint">{fillOnda(O.vs.note, { patch, min: VS_MIN_GAMES })}</p>
          </div>
        </section>
      ) : null}

      {/* ---------- 4. tutto il resto del profilo ---------- */}
      <section className="an-band an-band--deep onda-rest" aria-label={name}>
        <div className="an-wrap onda-more">
          {/* Traguardi (ogni profilo, pacchetto TRAGUARDI); i numeri della vetrina stanno nel tabellone in testa */}
          <ProfileHighlights
            profileId={profile.id}
            memberSince={profile.created_at}
            badge={profile.badge}
            name={name}
            decks={decks}
            tierLists={tierLists}
            locale={locale}
            withStats={false}
          />
          {showcaseRole ? <CreatorTournaments organizerId={profile.id} locale={locale} dict={d} /> : null}
          {/* I mazzi torneo pubblicati (04/10/2026): tre mazzi Conquest con una guida */}
          <ProfileDeckSets ownerId={profile.id} locale={locale} dict={d} />

          {/* Le tier list salvate: una per tipo, aperte nello strumento con il loro codice. Senza tier list niente sezione. */}
          {tierLists.length ? (
            <section className="card-night mt-2.5 p-4 sm:p-5">
              <h2 className="t-panel">{p.tierListsTitle}</h2>
              <ul className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {tierLists.map((tl) => (
                  <li key={tl.id} className="card-inset flex flex-col p-4">
                    <span className="stat-pill w-fit bg-sky text-[11px] font-semibold uppercase text-ink">
                      {tl.kind === "legendaries" ? d.tierMaker.tabLegendaries : d.tierMaker.tabCards}
                    </span>
                    <p className="t-item mt-3 leading-tight">{tl.title || d.tierMaker.h1}</p>
                    <p className="mt-1 font-mono text-xs text-pale-muted">
                      {countEntries(tl.entries)} {c.account.rankedCards} · {d.common.updated} {formatDate(locale, tl.updated_at.slice(0, 10))}
                    </p>
                    <p className="mt-4">
                      {/* il codice TL1 nell'hash apre questa lista nello strumento, senza account */}
                      <a href={`${href(locale, "/tier-list/create")}#${tl.code}`} className="btn btn-ink text-xs">
                        {p.openTierList}
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Guide e fumetti pubblicati dall'iscritto (pacchetti GUIDE e FUMETTI): niente se non ne ha */}
          <UserGuides locale={locale} guides={guides} />
          <UserComics locale={locale} comics={comics} />

          <nav className="onda-links" aria-label="OriginsMeta">
            {showcaseRole ? (
              <Link href={href(locale, "/creators")} className="link-mint font-bold">
                {creatorLabels[locale].profile.directoryLink}
              </Link>
            ) : null}
            <Link href={href(locale, "/decks")} className="link-mint font-bold">
              {d.tier.decksCta}
            </Link>
            {/* la tier list principale, con l'ancora che la mappa delle query le assegna ("Origins TCG tier list", C14) */}
            <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
              {L.tierList}
            </Link>
            <Link href={href(locale, "/tier-list/community")} className="link-mint font-bold">
              {d.tier.navCommunity}
            </Link>
          </nav>
        </div>
      </section>
    </div>
  );
}
