import Link from "next/link";
import { formatDate, getDictionary, href, locales, siteUrl, type Locale } from "@/lib/i18n";
import { pageTitle, pageTitleWith } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { authors } from "@/lib/data/authors";
import { listPublishedGuides } from "@/lib/community/guideQueries";
import { communityGuideIndexing, communityGuideWords, guideCover, guideShapeIndexing, localizedCommunityGuide, readMinutes, type CommunityGuide } from "@/lib/community/guides";
import { editorialAuthor, fillLabel } from "@/lib/community/deckQuality";
import { normalizeBadge } from "@/lib/community/badges";
import { authorName, authorHandle } from "@/lib/community/util";
import { communityPerson } from "@/lib/jsonld/deck";
import { communityGuideArticle } from "@/lib/jsonld/communityGuide";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { deckLinks, deckVideos } from "@/lib/videos";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import { JsonLd, breadcrumbs } from "../JsonLd";
import { Avatar } from "../AccountMenu";
import { AuthorChannels } from "../AuthorChannels";
import { FollowButton } from "../follow/FollowButton";
import { CardChipList } from "../CardChip";
import { CardMentions } from "../CardMentions";
import { CardMentionEdges } from "../CardMentionEdges";
import { NewDeckBanner } from "../NewDeckBanner";
import { GuideCover } from "./GuideCover";
import { CommunityGuideResources, CommunityGuideVideos } from "./CommunityGuideMedia";
import { CommunityGuideActions } from "./CommunityGuideActions";
import { GuideReportForm } from "./GuideReportForm";
import { CommunityGuideCard } from "./CommunityGuideList";

/** Description nella lingua della pagina: il riassunto quando si legge in questa lingua, altrimenti una frase coi fatti. */
export function guideDescription(g: CommunityGuide, locale: Locale): string {
  const view = localizedCommunityGuide(g, locale);
  if (view.lang === locale) return view.text.summary;
  const L = communityGuideLabels[locale];
  const lang = getDictionary(locale).community.langNames[g.lang] ?? g.lang;
  return fillLabel(L.page.metaFallback, { title: g.title, author: authorName(g.profile), lang });
}

/**
 * Il contenuto della pagina di una guida della community (pacchetto GUIDE, 27/09/2026), separato dalla rotta
 * /guides/community/[slug] che la legge: dati strutturati, copertina, firma con ruolo e canali, nota sulla traduzione,
 * riassunto, video, sezioni, carte, risorse, comandi dell'autore e dello staff, altre guide e segnalazione.
 * Componente server: i nomi delle carte diventano link con `CardMentions` (database carte solo sul server).
 */
export async function CommunityGuideView({ guide, locale }: { guide: CommunityGuide; locale: Locale }) {
  const d = getDictionary(locale);
  const L = communityGuideLabels[locale];
  const c = d.community;
  const path = href(locale, `/guides/community/${guide.slug}`);
  const pageUrl = `${siteUrl}${path}`;
  const view = localizedCommunityGuide(guide, locale);
  const words = communityGuideWords(guide);
  const author = authorName(guide.profile);
  const handle = authorHandle(guide.profile);
  const langName = c.langNames[guide.lang] ?? guide.lang;
  const published = guide.published_at ?? guide.created_at;
  const category = d.guides.categories[guide.category];
  const cards = guide.cards.filter((s) => getCard(s));
  const videos = deckVideos(guide);
  const links = deckLinks(guide);
  // Altre guide della community: prima quelle che si leggono in questa lingua e della stessa categoria (link a pagine
  // indicizzabili), poi le più recenti. Stessa lettura leggera della sezione di /guides (cache dei dati di Next, 60 s).
  const others = (await listPublishedGuides())
    .filter((g) => g.id !== guide.id)
    .map((g) => ({ g, score: (guideShapeIndexing(g, locales, locale).noindex ? 0 : 2) + (g.category === guide.category ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || (b.g.published_at ?? "").localeCompare(a.g.published_at ?? ""))
    .slice(0, 4)
    .map((x) => x.g);
  const editorial = editorialAuthor(authors, [], guide.profile?.username);
  const cover = guideCover(guide.cover_preset);
  // l'elenco /guides/community nelle briciole solo quando questa versione è indicizzabile (allora l'elenco la contiene)
  const listed = !communityGuideIndexing(guide, locales, locale).noindex;

  const article = communityGuideArticle({
    locale,
    pageUrl,
    headline: pageTitle(pageTitleWith(guide.title, L.page.metaSuffix)),
    description: guideDescription(guide, locale).slice(0, 300),
    published,
    modified: guide.updated_at,
    // `image` è obbligatoria per i rich result: la copertina della guida (media kit, la stessa dell'og:image)
    image: `${siteUrl}${cover.src}`,
    author: communityPerson({ locale, username: guide.profile?.username, name: author, editorial }),
    cards: cards.flatMap((s) => {
      const card = getCard(s);
      return card ? [{ slug: card.slug, key: card.key, name: card.name }] : [];
    }),
    words,
    section: category,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          article,
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.guides.title, path: href(locale, "/guides") },
            ...(listed ? [{ name: L.listPage.title, path: href(locale, "/guides/community") }] : []),
            { name: guide.title, path },
          ]),
        ]}
      />
      <p className="text-sm">
        <Link href={href(locale, "/guides")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.guides.title}
        </Link>
      </p>

      {/* Subito dopo la prima pubblicazione (?new=1, solo per l'autore): link da copiare e il nostro Discord */}
      <NewDeckBanner
        ownerId={guide.owner}
        url={pageUrl}
        discordHref={ORIGINSMETA_DISCORD}
        labels={{ title: L.page.newTitle, text: L.page.newText, copyLink: c.copyLink, copied: c.copied, discord: d.nav.discord, close: c.newDeckClose }}
      />

      <article className="mt-6 min-w-0">
        <GuideCover preset={guide.cover_preset} eager />
        <p className="kicker mt-6 text-mint">
          {L.page.kicker} · {category} · {fillLabel(L.page.published, { date: formatDate(locale, published.slice(0, 10)) })}
          {guide.updated_at.slice(0, 10) !== published.slice(0, 10) ? ` · ${fillLabel(L.page.updated, { date: formatDate(locale, guide.updated_at.slice(0, 10)) })}` : ""}
          {` · ${fillLabel(L.page.readTime, { n: String(readMinutes(words)) })}`}
        </p>
        {/* il titolo non si traduce (come il nome di un mazzo): resta nella lingua dell'autore. break-words (anche sotto):
            una parola lunghissima scritta dall'autore (un link, un codice del gioco) va a capo invece di allargare la pagina */}
        <h1 className="t-page mt-2 break-words leading-tight" lang={guide.lang === locale ? undefined : guide.lang}>
          {guide.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-pale-muted">
          <Avatar profile={guide.profile} name={author} size={32} />
          <span>
            {L.page.by}{" "}
            {guide.profile?.username ? (
              <Link href={href(locale, `/u/${guide.profile.username}`)} className="font-bold text-pale hover:text-mint hover:underline">
                {author}
              </Link>
            ) : (
              <strong className="text-pale">{author}</strong>
            )}
            {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
          </span>
          {/* ruolo, badge LIVE e canali principali accanto al nome, come nei mazzi (pacchetto CREATOR) */}
          <AuthorChannels ownerId={guide.owner} username={guide.profile?.username} name={author} badge={guide.profile?.badge} badgeLabel={c.badges[normalizeBadge(guide.profile?.badge)]} locale={locale} />
          {/* "Segui" (pacchetto SEGUI, collegato all'integrazione del 27/09/2026) accanto al nome, come nella scheda del mazzo:
              solo per i ruoli con vetrina, stato letto nel browser (la pagina è ISR) */}
          <FollowButton profileId={guide.owner} name={author} badge={guide.profile?.badge} locale={locale} placement="guide_page" compact />
          <span className="stat-pill bg-night-3 font-mono text-pale">{view.translated ? `${guide.lang.toUpperCase()} → ${locale.toUpperCase()}` : guide.lang.toUpperCase()}</span>
        </div>

        <CommunityGuideActions guideId={guide.id} ownerId={guide.owner} locale={locale} editHref={`${path}/edit`} backHref={`${path}/edit`} labels={L.owner} />

        {/* Una sola lingua per pagina: la traduzione del sito dice che è automatica e porta all'originale, che sta nella
            versione della pagina nella lingua dell'autore (le stesse regole delle guide dei mazzi). */}
        {view.translated ? (
          <p className="mt-6 rounded-lg border-2 border-sky bg-sky/10 p-3 text-xs text-pale">
            {c.translatedNote.replace("{from}", c.langFrom[guide.lang] ?? guide.lang)}{" "}
            <Link href={href(guide.lang, `/guides/community/${guide.slug}`)} hrefLang={guide.lang} className="font-semibold text-mint underline-offset-2 hover:underline">
              {c.originalText.replace("{lang}", langName)} →
            </Link>
          </p>
        ) : guide.lang !== locale ? (
          <p className="mt-6 rounded-lg border-2 border-gold bg-gold/10 p-3 text-xs text-pale">{fillLabel(L.page.langNote, { lang: langName })}</p>
        ) : null}

        <div className="mt-6 rounded-xl border-2 border-sky bg-night-2/80 p-5">
          <p className="whitespace-pre-line break-words text-lg text-pale" lang={view.lang}>
            <CardMentions text={view.text.summary} locale={locale} dict={d} />
          </p>
        </div>

        <CommunityGuideVideos videos={videos} title={guide.title} locale={locale} />

        {view.text.sections.map((s, i) => (
          <section key={i} className="mt-10 min-w-0" lang={view.lang}>
            <h2 className="t-section break-words">{s.heading}</h2>
            <p className="mt-3 whitespace-pre-line break-words leading-relaxed text-pale">
              <CardMentions text={s.body} locale={locale} dict={d} />
            </p>
          </section>
        ))}

        {cards.length ? (
          <section className="mt-10" aria-labelledby="guide-cards">
            <h2 id="guide-cards" className="t-section">
              {L.page.cardsTitle}
            </h2>
            <div className="mt-3">
              <CardChipList slugs={cards} locale={locale} />
            </div>
          </section>
        ) : null}

        <CommunityGuideResources links={links} locale={locale} />
        <p className="mt-8 border-t-2 border-night-3 pt-4 text-xs text-pale-muted">{fillLabel(L.page.authorNote, { name: author })}</p>
        <CardMentionEdges />
      </article>

      {others.length ? (
        <section className="mt-12">
          <h2 className="t-section">{L.page.moreGuides}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {others.map((g) => (
              <li key={g.id}>
                <CommunityGuideCard guide={g} locale={locale} categoryLabel={d.guides.categories[g.category]} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* La segnalazione resta in fondo e in piccolo, come nei mazzi */}
      <div className="mt-12 flex justify-end">
        <GuideReportForm guideId={guide.id} ownerId={guide.owner} loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`} labels={L.report} />
      </div>
    </div>
  );
}
