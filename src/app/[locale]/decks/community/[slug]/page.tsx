import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { RULES } from "@/lib/deckrules";
import { getCommunityDeck, listPublishedDecks } from "@/lib/community/queries";
import { guideSections } from "@/lib/community/types";
import { authorHandle, authorName, youtubeId } from "@/lib/community/util";
import { CardChip, CardChipList } from "@/components/CardChip";
import { StarRating } from "@/components/StarRating";
import { CopyButton } from "@/components/CopyButton";
import { OwnerActions } from "@/components/OwnerActions";
import { Avatar } from "@/components/AccountMenu";
import { contactEmail } from "@/components/Footer";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Pagine generate alla prima richiesta e rigenerate al massimo ogni minuto (voti e modifiche).
 * generateStaticParams vuoto + dynamicParams: senza di esso Next renderizzerebbe la pagina a ogni richiesta.
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const deck = await getCommunityDeck(slug);
  if (!deck) return {};
  return pageMeta(locale, `/decks/community/${deck.slug}`, `${deck.name} · ${dict.community.kicker}`, deck.guide.summary.slice(0, 160));
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/decks")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.decks.title}
        </Link>
      </p>

      <article className="card-ivory mt-6 p-6 sm:p-8">
        <p className="kicker text-ink-muted">
          {c.kicker} · {d.common.updated} {formatDate(locale, deck.updated_at.slice(0, 10))}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">{deck.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-ink-muted">
          <Avatar profile={deck.profile} name={author} size={32} />
          <span>
            {c.by} <strong className="text-ink">{author}</strong>
            {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="stat-pill bg-mint-deep text-ivory text-[11px] font-semibold uppercase">{d.common.community}</span>
          <span className="stat-pill border border-ink/20 text-ink">
            {d.common.archetype}: {archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}
          </span>
          {legendary || customLegendary ? <span className="stat-pill bg-gold/50 text-ink">★ {legendary?.name ?? customLegendary?.name}</span> : null}
          <span className="stat-pill bg-ivory-3 text-ink font-mono">{deck.guide.lang.toUpperCase()}</span>
        </div>

        <p className="mt-6 whitespace-pre-line text-lg text-ink">{deck.guide.summary}</p>

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
          <div className="mt-8 overflow-hidden rounded-xl border border-ink/15 bg-ink" style={{ aspectRatio: "16 / 9" }}>
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

        <h2 className="mt-8 text-xl font-extrabold text-ink">{d.common.legendary}</h2>
        {legendary ? (
          <div className="mt-2">
            <CardChip slug={legendary.slug} locale={locale} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink">★ {customLegendary?.name ?? deck.legendary} *</p>
        )}

        <h2 className="mt-8 text-xl font-extrabold text-ink">
          {d.builder.slots} <span className="font-mono text-sm font-normal text-ink-muted">{RULES.distinctCards} × {RULES.copiesPerCard}</span>
        </h2>
        {knownCards.length ? (
          <div className="mt-3">
            <CardChipList slugs={knownCards} locale={locale} />
          </div>
        ) : null}
        {customCards.length ? (
          <div className="mt-3">
            <p className="kicker text-ink-muted">{c.customCards}</p>
            <ul className="mt-1 flex flex-wrap gap-2 text-sm text-ink">
              {customCards.map((n) => (
                <li key={n} className="stat-pill border border-dashed border-ink/30">
                  {RULES.copiesPerCard}× {n} *
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={builderHref} className="btn btn-ink text-xs">
            {c.openInBuilder}
          </Link>
          {deck.code_om ? <CopyButton text={deck.code_om} label={c.copyCode} copied={c.copied} className="btn border border-ink/30 text-xs text-ink" /> : null}
          <a className="btn border border-ink/20 text-xs text-ink-muted hover:text-crimson-deep" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Report deck ${deck.slug}`)}&body=${encodeURIComponent(pageUrl)}`}>
            {c.report}
          </a>
        </div>

        {sections.length ? (
          <>
            <h2 className="mt-10 text-2xl font-extrabold text-ink">{c.guide}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {sections.map((k) => (
                <section key={k} className={`rounded-lg border border-ink/15 p-4 ${k === "matchups" || k === "notes" ? "md:col-span-2" : ""}`}>
                  <h3 className="kicker text-mint-deep">{c[k]}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink">{deck.guide[k]}</p>
                </section>
              ))}
            </div>
          </>
        ) : null}
      </article>

      {others.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-chalk">{c.others}</h2>
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
