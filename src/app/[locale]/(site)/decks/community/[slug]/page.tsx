import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, siteUrl, type Dictionary, type Locale } from "@/lib/i18n";
import { cleanDescription, defaultOgImage, DESCRIPTION_MAX, pageMeta, pageTitleWith, resolveLocale, type PageMetaOptions } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getCard } from "@/lib/data/cards";
import { RULES } from "@/lib/deckrules";
import { getCommunityDeck, listPublishedDecks } from "@/lib/community/queries";
import { guideSections, type CommunityDeck } from "@/lib/community/types";
import { getGuides } from "@/lib/content/guides";
import { authorHandle, authorName, youtubeId } from "@/lib/community/util";
import { CardArt, CardChip, CardChipList } from "@/components/CardChip";
import { CardMentions } from "@/components/CardMentions";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { StarRating } from "@/components/StarRating";
import { CopyButton } from "@/components/CopyButton";
import { OwnerActions } from "@/components/OwnerActions";
import { Avatar } from "@/components/AccountMenu";
import { contactEmail } from "@/components/Footer";
import { DeckCharts } from "@/components/DeckCharts";
import { deckStats } from "@/lib/deckstats";
import { JsonLd, breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

/** Punti di forza in verde e punti deboli in rosso, su sfondo "lavagna" (richiesta di Davdas, 15/09/2026). */
const sectionStyle: Record<string, { box: string; title: string }> = {
  strengths: { box: "border-good bg-good/10", title: "text-good" },
  weaknesses: { box: "border-bad bg-bad/10", title: "text-bad" },
};

/**
 * Pagine generate alla prima richiesta e rigenerate al massimo ogni minuto (voti e modifiche).
 * generateStaticParams vuoto + dynamicParams: senza di esso Next renderizzerebbe la pagina a ogni richiesta.
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

/** Nome della Leggendaria del mazzo, anche quando è una carta fuori dal nostro database. */
function legendaryName(deck: CommunityDeck): string | undefined {
  return (deck.legendary ? getCard(deck.legendary)?.name : undefined) ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name;
}

/**
 * Descrizione del mazzo nella lingua della pagina. Prima era un taglio grezzo del testo dell'autore: su /en
 * usciva in italiano, spezzata a metà parola e a volte con un trattino di elenco in testa. Qui la costruiamo
 * con le etichette del dizionario e i dati del mazzo; il testo dell'autore si aggiunge in coda solo quando è
 * scritto nella lingua della pagina, perché il sito non traduce i testi della community.
 * La usano sia i metadati sia il JSON-LD, così dicono la stessa cosa.
 */
function deckDescription(deck: CommunityDeck, locale: Locale, dict: Dictionary, max: number = DESCRIPTION_MAX): string {
  const star = legendaryName(deck);
  const facts = [
    `${deck.name} · ${dict.community.kicker} ${dict.community.by} ${authorName(deck.profile)}`,
    star ? `${dict.common.legendary}: ${star}` : "",
    `${dict.common.archetype}: ${archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}`,
  ]
    .filter(Boolean)
    .join(". ");
  const own = deck.guide.lang === locale ? cleanDescription(deck.guide.summary, max) : "";
  const text = cleanDescription(own ? `${facts}. ${own}` : `${facts}.`, max);
  // Senza il testo dell'autore (guida scritta nell'altra lingua) restano i soli fatti, una novantina
  // di caratteri: troppo pochi per uno snippet. La coda dice che cosa si trova nella pagina.
  return text.length < 120 ? cleanDescription(`${text} ${dict.community.metaTail}`, max) : text;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const deck = await getCommunityDeck(slug);
  if (!deck) return {};
  // Copertina del mazzo: l'illustrazione della sua Leggendaria, senza che l'autore debba sceglierne una.
  const cover = deck.legendary ? getCard(deck.legendary)?.cover : undefined;
  const star = legendaryName(deck);
  // Le copertine in public/cards/cover sono 1200×675: lo dichiariamo perché l'anteprima social non venga ritagliata a caso.
  const art: PageMetaOptions = cover ? { imageSize: { width: 1200, height: 675 }, imageAlt: star ? `${star} · ${deck.name}` : deck.name } : {};
  return pageMeta(locale, `/decks/community/${deck.slug}`, pageTitleWith(deck.name, dict.community.kicker), deckDescription(deck, locale, dict), cover, art);
}

export default async function CommunityDeckPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const deck = await getCommunityDeck(slug);
  if (!deck) notFound();

  const legendary = deck.legendary ? getCard(deck.legendary) : undefined;
  const customLegendary = !legendary ? deck.custom_cards.find((x) => x.slug === deck.legendary) : undefined;
  const knownCards = deck.cards.filter((s) => getCard(s));
  const customCards = deck.cards.filter((s) => !getCard(s)).map((s) => deck.custom_cards.find((x) => x.slug === s)?.name ?? s);
  const yt = youtubeId(deck.video_url);
  const path = href(locale, `/decks/community/${deck.slug}`);
  const pageUrl = `${siteUrl}${path}`;
  const author = authorName(deck.profile);
  const handle = authorHandle(deck.profile);
  const others = (await listPublishedDecks(40)).filter((x) => x.slug !== deck.slug).slice(0, 8);
  const builderHref = `${href(locale, "/deck-builder")}#${deck.code_om ?? ""}`;
  const sections = guideSections.filter((k) => deck.guide[k]);
  // Guide editoriali che trattano questo mazzo (tags.communityDecks in src/lib/content/guides.ts)
  const guides = getGuides(locale).filter((g) => g.tags?.communityDecks?.some((x) => x.slug === deck.slug));

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: deck.name,
    description: deckDescription(deck, locale, d, 200),
    // Lingua del documento, non del testo dell'autore: la pagina /en resta una pagina inglese.
    inLanguage: locale,
    datePublished: deck.created_at,
    dateModified: deck.updated_at,
    // `image` è obbligatoria per i rich result: la copertina della Leggendaria, altrimenti l'immagine social del sito.
    image: legendary?.cover ? `${siteUrl}${legendary.cover}` : `${siteUrl}${defaultOgImage}`,
    author: { "@type": "Person", name: author },
    publisher: { "@id": organizationId },
    mainEntityOfPage: pageUrl,
    // Rimando all'entità unica del gioco, che il layout radice emette su ogni pagina: una copia
    // in linea creerebbe un secondo "Origins TCG" e dividerebbe il segnale fra due entità.
    about: { "@id": videoGameId },
  };
  // Sotto i 3 voti la media non dice niente (un 5/5 su un voto solo) e Google non genera comunque lo snippet per un Article.
  if ((deck.rating?.votes ?? 0) >= 3) article.aggregateRating = { "@type": "AggregateRating", ratingValue: deck.rating?.avg, ratingCount: deck.rating?.votes, bestRating: 5, worstRating: 1 };
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[article, breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.decks.title, path: href(locale, "/decks") }, { name: deck.name, path }])]}
      />
      <p className="text-sm">
        <Link href={href(locale, "/decks")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.decks.title}
        </Link>
      </p>

      <article className="card-night mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          {legendary ? (
            <Link href={href(locale, `/cards/${legendary.slug}`)} className="shrink-0" title={legendary.name}>
              <CardArt card={legendary} full className="!h-[168px] !w-[120px] text-2xl" />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1 basis-64">
            <p className="kicker text-pale-muted">
              {c.kicker} · {d.common.updated} {formatDate(locale, deck.updated_at.slice(0, 10))}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-sky sm:text-5xl">{deck.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-pale-muted">
              <Avatar profile={deck.profile} name={author} size={32} />
              <span>
                {c.by} <strong className="text-pale">{author}</strong>
                {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {deck.profile?.badge && deck.profile.badge !== "community" ? (
            <span className={`${badgePill} ${badgeStyle[deck.profile.badge] ?? badgeStyle.community}`}>{c.badges[deck.profile.badge as keyof typeof c.badges] ?? deck.profile.badge}</span>
          ) : null}
          {deck.profile?.badge === "staff" ? null : <span className="stat-pill bg-mint-deep text-chalk text-[11px] font-semibold uppercase">{d.common.community}</span>}
          <span className="stat-pill border border-sky text-pale">
            {d.common.archetype}: {archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}
          </span>
          {deck.deck_types.map((t) => (
            <span key={t} className="stat-pill bg-night-3 text-pale">
              {c.deckTypes[t as keyof typeof c.deckTypes] ?? t}
            </span>
          ))}
          {legendary || customLegendary ? <span className="stat-pill bg-gold/50 text-pale">★ {legendary?.name ?? customLegendary?.name}</span> : null}
          <span className="stat-pill bg-night-3 text-pale font-mono">{deck.guide.lang.toUpperCase()}</span>
        </div>

        {/* Testi della guida: i nomi ufficiali delle carte diventano link con anteprima (CardMentions, richiesta di Davdas) */}
        {deck.guide.lang !== locale ? (
          /* la guida è nella lingua dell'autore: il sito non traduce i testi della community (nota per chi cambia lingua) */
          <p className="mt-6 rounded-lg border-2 border-gold bg-gold/10 p-3 text-xs text-pale">{c.guideLangNote.replace("{lang}", c.langNames[deck.guide.lang] ?? deck.guide.lang)}</p>
        ) : null}
        <div className="mt-6 rounded-xl border-2 border-sky bg-night-2/80 p-5">
          <p className="kicker text-mint">{c.summary}</p>
          <p className="mt-2 whitespace-pre-line text-lg text-pale">
            <CardMentions text={deck.guide.summary} locale={locale} dict={d} id="cm-summary" />
          </p>
        </div>

        <div className="mt-6">
          <StarRating
            deckId={deck.id}
            ownerId={deck.owner}
            avg={deck.rating?.avg ?? 0}
            votes={deck.rating?.votes ?? 0}
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
          deckId={deck.id}
          ownerId={deck.owner}
          status={deck.status}
          locale={locale}
          editHref={`${path}/edit`}
          labels={{ edit: c.edit, hide: c.hide, unhide: c.unhide, delete: c.delete, confirmDelete: c.confirmDelete }}
        />

        {yt ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-sky bg-felt-deep" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${yt}`}
              title={deck.name}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : deck.video_url ? (
          <p className="mt-6">
            <a className="btn btn-ink text-xs" href={deck.video_url} rel="noopener nofollow" target="_blank">
              ▶ {d.common.video}
            </a>
          </p>
        ) : null}

        <h2 className="mt-8 text-xl font-extrabold text-sky">{d.common.legendary}</h2>
        {legendary ? (
          <div className="mt-2">
            <CardChip slug={legendary.slug} locale={locale} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-pale">★ {customLegendary?.name ?? deck.legendary} *</p>
        )}

        <h2 className="mt-8 text-xl font-extrabold text-sky">
          {d.builder.slots} <span className="font-mono text-sm font-normal text-pale-muted">{RULES.distinctCards} × {RULES.copiesPerCard}</span>
        </h2>
        {knownCards.length ? (
          <div className="mt-3">
            <CardChipList slugs={knownCards} locale={locale} />
          </div>
        ) : null}
        {customCards.length ? (
          <div className="mt-3">
            <p className="kicker text-pale-muted">{c.customCards}</p>
            <ul className="mt-1 flex flex-wrap gap-2 text-sm text-pale">
              {customCards.map((n) => (
                <li key={n} className="stat-pill border border-dashed border-sky">
                  {RULES.copiesPerCard}× {n} *
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DeckCharts stats={deckStats({ legendary: deck.legendary, cards: deck.cards }, locale)} labels={d.stats} />

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={builderHref} className="btn btn-ink text-xs">
            {c.openInBuilder}
          </Link>
          {deck.code_om ? <CopyButton text={deck.code_om} label={c.copyCode} copied={c.copied} className="btn border border-sky text-xs text-pale" /> : null}
          <a className="btn border border-sky text-xs text-pale-muted hover:text-crimson" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Report deck ${deck.slug}`)}&body=${encodeURIComponent(pageUrl)}`}>
            {c.report}
          </a>
        </div>

        {sections.length ? (
          <>
            <h2 className="mt-10 text-2xl font-extrabold text-sky">{c.guide}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {sections.map((k) => (
                <section key={k} className={`rounded-lg border-2 p-4 ${sectionStyle[k]?.box ?? "border-sky bg-night-2/70"} ${k === "matchups" || k === "notes" ? "md:col-span-2" : ""}`}>
                  <h3 className={`kicker ${sectionStyle[k]?.title ?? "text-mint"}`}>{c[k]}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-pale">
                    <CardMentions text={deck.guide[k] ?? ""} locale={locale} dict={d} id={`cm-${k}`} />
                  </p>
                </section>
              ))}
            </div>
          </>
        ) : null}
        <CardMentionEdges />
      </article>

      {guides.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{d.common.relatedGuides}</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover block p-5">
                  <p className="kicker text-pale-muted">{d.guides.categories[g.category]}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-sky">{g.title}</h3>
                  <p className="mt-1 text-sm text-pale-muted">{g.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {others.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{c.others}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((x) => (
              <li key={x.slug}>
                <Link href={href(locale, `/decks/community/${x.slug}`)} className="btn btn-ghost text-xs">
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
    </div>
  );
}
