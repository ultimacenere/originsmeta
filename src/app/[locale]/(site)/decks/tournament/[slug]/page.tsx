import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales, siteUrl, type Locale } from "@/lib/i18n";
import { TITLE_MAX, cleanDescription, defaultOgImage, DESCRIPTION_MAX, pageMeta, pageTitle, pageTitleWith, resolveLocale } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard, patchAt, patchLabel } from "@/lib/data/cards";
import { differentCards } from "@/lib/deckrules";
import { deckGameCode } from "@/lib/deckGameCode";
import { getDeckSet, listPublishedDeckSets } from "@/lib/community/deckSetQueries";
import {
  DECK_SET_GUIDE_SECTIONS,
  DECK_SET_MIN_DIFFERENT,
  deckSetIndexableLocales,
  localizedSetGuide,
  setCodesOf,
  type CommunityDeckSet,
  type DeckSetDeck,
} from "@/lib/community/deckSets";
import { deckLetter, deckSetLabels } from "@/lib/deckSetLabels";
import { normalizeBadge } from "@/lib/community/badges";
import { dropHreflang, fillLabel } from "@/lib/community/deckQuality";
import { communityPerson, deckArticle } from "@/lib/jsonld/deck";
import { authorHandle, authorName } from "@/lib/community/util";
import { deckResources, deckVideos } from "@/lib/videos";
import { DeckResources, DeckVideos } from "@/components/DeckMedia";
import { CardName, DeckCardGrid } from "@/components/CardChip";
import { CardMentions } from "@/components/CardMentions";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { StarRating } from "@/components/StarRating";
import { CopyButton } from "@/components/CopyButton";
import { OwnerActions } from "@/components/OwnerActions";
import { Avatar } from "@/components/AccountMenu";
import { AuthorChannels } from "@/components/AuthorChannels";
import { FollowButton } from "@/components/follow/FollowButton";
import { contactEmail, officialLinks } from "@/components/Footer";
import { NewDeckBanner } from "@/components/NewDeckBanner";
import { DeckSectionTabs } from "@/components/DeckSectionTabs";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { DeckStatsBeacon } from "@/components/DeckStatsBeacon";
import { DeckStreamTools } from "@/components/stream/StreamTools";
import { deckSetImageAlt, deckSetOgImage } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";

type Params = Promise<{ locale: string; slug: string }>;

/** Pagine generate alla prima richiesta e rigenerate al massimo ogni minuto (voti e modifiche), come i mazzi singoli. */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

/** Punti di forza in verde e punti deboli in rosso, come nella scheda dei mazzi singoli. */
const sectionStyle: Record<string, { box: string; title: string }> = {
  strengths: { box: "border-good bg-good/10", title: "text-good" },
  weaknesses: { box: "border-bad bg-bad/10", title: "text-bad" },
};

/** Nome di una carta del trio, anche quando è una carta scritta a mano. */
function cardName(slug: string, deck: Pick<DeckSetDeck, "custom_cards">): string {
  return getCard(slug)?.name ?? deck.custom_cards?.find((c) => c.slug === slug)?.name ?? slug;
}

const legendaryNames = (set: CommunityDeckSet) => set.decks.map((d) => cardName(d.legendary, d));

/** Title della SERP: "{nome}: mazzo torneo con A, B, C" se ci sta, altrimenti il nome con "Mazzo torneo", poi il nome. */
function setTitle(set: CommunityDeckSet, locale: Locale): string {
  const L = deckSetLabels[locale].page;
  const full = fillLabel(L.titleTemplate, { name: set.name, legendaries: legendaryNames(set).join(", ") });
  return pageTitle(full).length <= TITLE_MAX ? full : pageTitleWith(set.name, L.kicker);
}

/** Description: autore e Leggendarie, poi il piano di gioco quando si legge nella lingua della pagina, poi la coda. */
function setDescription(set: CommunityDeckSet, locale: Locale, max: number = DESCRIPTION_MAX): string {
  const L = deckSetLabels[locale].page;
  const lead = fillLabel(L.lead, { author: authorName(set.profile), legendaries: legendaryNames(set).join(", ") });
  const view = localizedSetGuide(set, locale);
  const own = view.lang === locale ? cleanDescription(view.text.summary, max) : "";
  const text = cleanDescription(own ? `${lead} ${own}` : lead, max);
  if (text.length >= 120 || text.length + 1 + L.metaTail.length > max) return text;
  return `${text} ${L.metaTail}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const set = await getDeckSet(slug);
  if (!set) return {};
  // Immagine social: i tre mazzi disegnati da /api/deck-set-image (strumenti per le dirette, 04/10/2026), 1200×630 con la
  // versione dalla data di modifica, come la scheda dei mazzi singoli (`deckOgImage`); prima era la copertina della prima
  // Leggendaria, che resta l'immagine dei dati strutturati (`deckArticle` qui sotto).
  const og = deckSetOgImage(set.slug, set.updated_at, locale);
  // come i mazzi singoli: hreflang solo verso le lingue in cui la guida si legge davvero, e nessuna sotto la soglia di parole
  const languages = deckSetIndexableLocales(set, locales);
  const meta = pageMeta(locale, `/decks/tournament/${set.slug}`, setTitle(set, locale), setDescription(set, locale), og.url, {
    languages,
    noindex: !languages.includes(locale),
    imageSize: { width: og.width, height: og.height },
    imageAlt: deckSetImageAlt(streamLabels[locale].image, { set: set.name, author: authorName(set.profile), legendaries: legendaryNames(set) }),
  });
  return languages.length ? meta : dropHreflang(meta);
}

export default async function DeckSetPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const S = deckSetLabels[locale];
  const set = await getDeckSet(slug);
  if (!set) notFound();

  const path = href(locale, `/decks/tournament/${set.slug}`);
  const pageUrl = `${siteUrl}${path}`;
  const author = authorName(set.profile);
  const handle = authorHandle(set.profile);
  const patch = patchAt(set.created_at);
  const view = localizedSetGuide(set, locale);
  // `langNames` e `langFrom` dei dizionari non hanno ancora tutte le lingue del sito (il francese dal 07/10/2026): il
  // codice della lingua fa da ripiego, come già faceva, e il tipo lo dice
  const langNames: Partial<Record<Locale, string>> = c.langNames;
  const langFrom: Partial<Record<Locale, string>> = c.langFrom;
  const langName = langNames[set.guide.lang] ?? set.guide.lang;
  const builderAll = `${href(locale, "/deck-builder")}#${setCodesOf(set.decks)}`;
  const gameCodes = await Promise.all(set.decks.map((deck) => deckGameCode(deck)));
  const states = set.decks.map((deck) => ({ name: deck.name, legendary: deck.legendary, cards: deck.cards, customCards: deck.custom_cards ?? [] }));
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ].map(([a, b]) => ({ a, b, n: differentCards(states[a], states[b]) }));
  const sections = DECK_SET_GUIDE_SECTIONS.filter((k) => !k.startsWith("deck_") && view.text[k]) as Exclude<(typeof DECK_SET_GUIDE_SECTIONS)[number], "deck_1" | "deck_2" | "deck_3">[];
  const videos = deckVideos(set);
  const others = (await listPublishedDeckSets()).filter((x) => x.id !== set.id).slice(0, 8);
  const legendaries = set.decks.map((deck) => getCard(deck.legendary));

  const article = deckArticle({
    locale,
    pageUrl,
    headline: pageTitle(setTitle(set, locale)),
    description: setDescription(set, locale, 200),
    published: set.created_at,
    modified: set.updated_at,
    image: legendaries[0]?.cover ? `${siteUrl}${legendaries[0].cover}` : `${siteUrl}${defaultOgImage}`,
    author: communityPerson({ locale, username: set.profile?.username, name: author }),
    legendary: legendaries[0] ? { slug: legendaries[0].slug, key: legendaries[0].key, name: legendaries[0].name } : undefined,
    cards: [...legendaries.slice(1), ...set.decks.flatMap((deck) => deck.cards.map((s) => getCard(s)))].flatMap((card) => (card ? [{ slug: card.slug, key: card.key, name: card.name }] : [])),
  }) as Record<string, unknown>;
  // la scheda fa parte dei mazzi torneo, non dell'elenco dei mazzi singoli
  article.isPartOf = { "@id": `${siteUrl}${href(locale, "/decks/tournament")}#collection` };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          article,
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
            { name: S.list.title, path: href(locale, "/decks/tournament") },
            { name: set.name, path },
          ]),
        ]}
      />
      <DeckSectionTabs locale={locale} active="tournament" />

      <NewDeckBanner
        ownerId={set.owner}
        url={pageUrl}
        discordHref={officialLinks.discord}
        labels={{ title: S.page.newTitle, text: S.page.newText, copyLink: c.copyLink, copied: c.copied, discord: d.common.discord, close: c.newDeckClose }}
      />

      <article className="card-night mt-6 p-6 sm:p-8">
        <p className="kicker text-mint">
          {S.page.kicker} · Conquest · {d.common.createdOn} {formatDate(locale, set.created_at.slice(0, 10))}
          {patch ? ` · ${d.common.patch} ${patchLabel(patch, locale)}` : ""}
          {set.updated_at.slice(0, 10) !== set.created_at.slice(0, 10) ? ` · ${d.common.updated} ${formatDate(locale, set.updated_at.slice(0, 10))}` : ""}
        </p>
        <h1 className="t-page mt-2 leading-tight">{set.name}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-pale-muted">
          <Avatar profile={set.profile} name={author} size={32} />
          <span>
            {c.by}{" "}
            {set.profile?.username ? (
              <Link href={href(locale, `/u/${set.profile.username}`)} className="font-bold text-pale hover:text-mint hover:underline">
                {author}
              </Link>
            ) : (
              <strong className="text-pale">{author}</strong>
            )}
            {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
          </span>
          <AuthorChannels ownerId={set.owner} username={set.profile?.username} name={author} badge={set.profile?.badge} badgeLabel={c.badges[normalizeBadge(set.profile?.badge)]} locale={locale} />
          <FollowButton profileId={set.owner} name={author} badge={set.profile?.badge} locale={locale} placement="deck_page" compact />
        </p>

        {/* le tre Leggendarie, nell'ordine dei mazzi: portano alle schede delle carte */}
        <div className="mt-4 flex flex-wrap gap-2">
          {set.decks.map((deck, i) => {
            const card = legendaries[i];
            const label = `${deckLetter(i)} · ★ ${cardName(deck.legendary, deck)}`;
            return card ? (
              <Link key={i} href={href(locale, `/cards/${card.slug}`)} className="stat-pill bg-gold text-ink hover:underline">
                {label}
              </Link>
            ) : (
              <span key={i} className="stat-pill bg-gold text-ink">
                {label}
              </span>
            );
          })}
          <span className="stat-pill bg-night-3 font-mono text-pale">{view.translated ? `${set.guide.lang.toUpperCase()} → ${locale.toUpperCase()}` : set.guide.lang.toUpperCase()}</span>
        </div>

        {/* traduzione automatica o guida nella lingua dell'autore: stesse note dei mazzi singoli */}
        {view.translated ? (
          <p className="mt-6 rounded-lg border-2 border-sky bg-sky/10 p-3 text-xs text-pale">
            {c.translatedNote.replace("{from}", langFrom[set.guide.lang] ?? set.guide.lang)}{" "}
            <Link href={href(set.guide.lang, `/decks/tournament/${set.slug}`)} hrefLang={set.guide.lang} className="font-semibold text-mint underline-offset-2 hover:underline">
              {c.originalText.replace("{lang}", langName)} →
            </Link>
          </p>
        ) : set.guide.lang !== locale ? (
          <p className="mt-6 rounded-lg border-2 border-gold bg-gold/10 p-3 text-xs text-pale">{c.guideLangNote.replace("{lang}", langName)}</p>
        ) : null}

        <div className="mt-6 rounded-xl border-2 border-sky bg-night-2/80 p-5">
          <p className="kicker text-mint">{S.page.summary}</p>
          <p className="mt-2 whitespace-pre-line text-lg text-pale" lang={view.lang}>
            <CardMentions text={view.text.summary} locale={locale} dict={d} id="cm-set-summary" />
          </p>
        </div>

        <div className="mt-6">
          <StarRating
            kind="set"
            deckId={set.id}
            ownerId={set.owner}
            avg={set.rating?.avg ?? 0}
            votes={set.rating?.votes ?? 0}
            path={path}
            loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
            labels={{
              rating: c.rating,
              votes: c.votes,
              vote: c.vote,
              noVotes: c.noVotes,
              yourVote: c.yourVote,
              rate: c.rate,
              loginToVote: c.loginToVote,
              ownDeck: c.ownDeck,
              voted: c.voted,
              voteError: c.voteError,
            }}
          />
        </div>

        <OwnerActions
          kind="set"
          deckId={set.id}
          ownerId={set.owner}
          status={set.status}
          locale={locale}
          editHref={`${path}/edit`}
          labels={{ edit: S.owner.edit, hide: S.owner.hide, unhide: S.owner.unhide, delete: S.owner.delete, confirmDelete: S.owner.confirmDelete }}
        />

        <DeckVideos videos={videos} deckName={set.name} locale={locale} />

        <p className="mt-6">
          <Link href={builderAll} className="btn btn-ink text-xs" data-om-event="deck_open_builder" data-om-placement="deck_set_page">
            {S.page.openSetInBuilder}
          </Link>
        </p>

        {/* strumenti per le dirette (04/10/2026, come i mazzi singoli): link breve e immagini per tutti, comando e overlay al proprietario */}
        <DeckStreamTools target="set" slug={set.slug} ownerId={set.owner} updatedAt={set.updated_at} locale={locale} site={siteUrl} labels={streamLabels[locale].tools} />
      </article>

      {/* I tre mazzi: per ognuno ruolo nel trio, carte intere (la Leggendaria per prima), codice del gioco e deck builder */}
      <section aria-labelledby="set-decks-title" className="mt-10">
        <h2 id="set-decks-title" className="t-section">
          {S.page.decksTitle}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6">
          {set.decks.map((deck, i) => {
            const role = view.text[`deck_${i + 1}` as "deck_1" | "deck_2" | "deck_3"];
            const known = deck.cards.filter((s) => getCard(s));
            const custom = deck.cards.filter((s) => !getCard(s)).map((s) => cardName(s, deck));
            const code = gameCodes[i];
            return (
              <article key={i} id={`deck-${deckLetter(i).toLowerCase()}`} className="card-night scroll-mt-28 p-5 sm:p-6">
                <p className="kicker text-mint">
                  {fillLabel(S.page.deckLetter, { letter: deckLetter(i) })} · {archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}
                </p>
                <h3 className="t-item mt-1">
                  {deck.name} ·{" "}
                  <span className="text-gold">
                    <CardName name={cardName(deck.legendary, deck)} legendary legendaryLabel={d.common.legendary} />
                  </span>
                </h3>
                {role ? (
                  <div className="mt-3 rounded-lg border-2 border-sky bg-night-2/70 p-4">
                    <p className="kicker text-mint">{S.page.role}</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-pale" lang={view.lang}>
                      <CardMentions text={role} locale={locale} dict={d} id={`cm-set-deck-${i}`} />
                    </p>
                  </div>
                ) : null}
                <div className="mt-4">
                  <DeckCardGrid slugs={[...(getCard(deck.legendary) ? [deck.legendary] : []), ...known]} locale={locale} />
                </div>
                {custom.length || !getCard(deck.legendary) ? (
                  <ul className="mt-3 flex flex-wrap gap-2 text-sm text-pale">
                    {!getCard(deck.legendary) ? <li className="stat-pill border border-dashed border-gold">★ {cardName(deck.legendary, deck)} *</li> : null}
                    {custom.map((n) => (
                      <li key={n} className="stat-pill border border-dashed border-sky">
                        2× {n} *
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`${href(locale, "/deck-builder")}#${deck.code_om}`} className="btn btn-ink text-xs" data-om-event="deck_open_builder" data-om-placement="deck_set_page">
                    {S.page.openDeckInBuilder}
                  </Link>
                  {code.code ? (
                    <CopyButton text={code.code} label={c.copyGameCode} copied={c.copied} className="btn btn-ink text-xs" event={{ name: "game_code_copy", params: { placement: "deck_set_page" } }} />
                  ) : (
                    <p className="text-xs text-pale-muted">{c.gameCodeMissing}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* le regole Conquest che il trio rispetta: Leggendarie diverse e carte diverse fra ogni coppia */}
      <section className="felt-panel mt-8 p-5 sm:p-6">
        <h2 className="t-section">{S.page.conquestTitle}</h2>
        <p className="mt-2 text-sm text-chalk-muted">{fillLabel(S.page.conquestOk, { min: String(DECK_SET_MIN_DIFFERENT) })}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {pairs.map((p) => (
            <li key={`${p.a}${p.b}`} className="stat-pill bg-night-3 font-mono text-xs text-mint">
              {fillLabel(S.page.pairDiff, { a: deckLetter(p.a), b: deckLetter(p.b), n: String(p.n) })}
            </li>
          ))}
        </ul>
      </section>

      {sections.length ? (
        <section className="mt-10">
          <h2 className="t-section">{S.page.guide}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {sections.map((k) => (
              <section key={k} className={`rounded-lg border-2 p-4 ${sectionStyle[k]?.box ?? "border-sky bg-night-2/70"} ${k === "matchups" || k === "notes" ? "md:col-span-2" : ""}`}>
                <h3 className={`kicker ${sectionStyle[k]?.title ?? "text-mint"}`}>{S.page.sections[k]}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-pale" lang={view.lang}>
                  <CardMentions text={view.text[k] ?? ""} locale={locale} dict={d} id={`cm-set-${k}`} />
                </p>
              </section>
            ))}
          </div>
        </section>
      ) : null}
      <DeckResources links={deckResources(set, d.common.video)} locale={locale} />
      <CardMentionEdges />
      {/* statistiche per l'autore (come i mazzi singoli): visite, copie del codice, clic e video, solo nel browser */}
      <DeckStatsBeacon slug={set.slug} target="set" />

      {others.length ? (
        <section className="mt-10">
          <h2 className="t-section">{S.page.others}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((x) => (
              <li key={x.slug}>
                <Link href={href(locale, `/decks/tournament/${x.slug}`)} className="btn btn-ghost text-xs">
                  {x.name}
                  <span className="font-mono font-normal text-chalk-muted">
                    {x.rating?.votes ? ` ★ ${x.rating.avg.toFixed(1)}` : ""} · {authorName(x.profile)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 text-right text-xs text-pale-muted">
        <a className="underline underline-offset-2 hover:text-pale" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Report tournament deck ${set.slug}`)}&body=${encodeURIComponent(pageUrl)}`}>
          {S.page.report}
        </a>
      </p>
    </div>
  );
}
