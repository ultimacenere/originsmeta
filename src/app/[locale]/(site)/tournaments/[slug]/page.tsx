import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { getTournament, listListedTournaments, listMatches, listPlayers, listVisibleDecks } from "@/lib/tournament/queries";
import { fill, tournamentShortLink, type TournamentPlayer } from "@/lib/tournament/types";
import { Bracket } from "@/components/Bracket";
import { authorHandle, authorName } from "@/lib/community/util";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { decodeOmCode } from "@/lib/deckcode";
import { getCard } from "@/lib/data/cards";
import { Avatar } from "@/components/AccountMenu";
import { CopyButton } from "@/components/CopyButton";
import { DiscordButton } from "@/components/DiscordButton";
import { JoinTournament } from "@/components/JoinTournament";
import { LocalTime } from "@/components/LocalTime";
import { TournamentCard } from "@/components/TournamentCard";
import { CardMentions } from "@/components/CardMentions";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { CardChip } from "@/components/CardChip";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Scheda pubblica del torneo: generata alla prima richiesta, rigenerata al massimo ogni minuto e dopo ogni
 * Server Action (iscrizioni, mazzi, avvio). Chi è loggato lo scopre il browser (JoinTournament).
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const t = await getTournament(slug);
  if (!t) return {};
  return pageMeta(locale, `/tournaments/${t.slug}`, `${t.name} · ${dict.tournaments.kicker}`, (t.description || dict.tournaments.sectionIntro).slice(0, 160), t.cover_url ?? undefined);
}

function PlayerRow({ p, dict }: { p: TournamentPlayer; dict: Awaited<ReturnType<typeof resolveLocale>>["dict"] }) {
  const name = authorName(p.profile);
  const badge = p.profile?.badge && p.profile.badge !== "community" ? p.profile.badge : null;
  return (
    <li className="flex items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
      <Avatar profile={p.profile} name={name} size={24} />
      <span className={`truncate ${p.status === "registered" ? "text-pale" : "text-pale-muted line-through"}`}>{name}</span>
      {badge ? <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community} !px-2 !py-0.5 !text-[10px]`}>{dict.community.badges[badge as keyof typeof dict.community.badges] ?? badge}</span> : null}
      {p.decks_submitted ? <span className="ml-auto font-mono text-[11px] text-good">✓</span> : null}
    </li>
  );
}

export default async function TournamentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const t = await getTournament(slug);
  if (!t) notFound();

  const [players, matches, others, decks] = await Promise.all([listPlayers(t.id), listMatches(t.id), listListedTournaments(30), t.status === "finished" ? listVisibleDecks(t.id) : Promise.resolve([])]);
  const active = players.filter((p) => p.status === "registered");
  const registeredIds = active.map((p) => p.user_id);
  const submittedIds = active.filter((p) => p.decks_submitted).map((p) => p.user_id);
  const nameOf = new Map(players.map((p) => [p.user_id, authorName(p.profile)]));
  const organizer = authorName(t.profile);
  const handle = authorHandle(t.profile);
  const badge = t.profile?.badge && t.profile.badge !== "community" ? t.profile.badge : null;
  const path = href(locale, `/tournaments/${t.slug}`);
  const pageUrl = `${siteUrl}${path}`;
  const shortLink = tournamentShortLink(siteUrl, t.tag);

  const event: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: t.name,
    description: (t.description || x.sectionIntro).slice(0, 300),
    startDate: t.starts_at,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: t.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: pageUrl },
    organizer: { "@type": "Person", name: organizer },
    url: pageUrl,
    image: t.cover_url ? (t.cover_url.startsWith("/") ? `${siteUrl}${t.cover_url}` : t.cover_url) : `${siteUrl}/media/og.jpg`,
    isAccessibleForFree: true,
    maximumAttendeeCapacity: t.size,
    about: { "@type": "VideoGame", name: "Origins TCG", url: "https://origins-tcg.com/" },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={[event, breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.events.title, path: href(locale, "/tournaments") }, { name: t.name, path }])]} />
      <p className="text-sm">
        <Link href={href(locale, "/tournaments")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.events.title}
        </Link>
      </p>

      <article className="card-night mt-6 overflow-hidden">
        <div className="relative aspect-[16/6] w-full bg-night-2">
          {t.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.cover_url} alt="" className="h-full w-full object-cover" />
          ) : null}
          <span className="stat-pill absolute left-4 top-4 bg-night-3 text-[11px] font-semibold uppercase text-pale">{x.statuses[t.status]}</span>
          <span className="stat-pill absolute right-4 top-4 bg-mint text-sm font-bold text-ink">{t.tag}</span>
        </div>

        <div className="p-6 sm:p-8">
          <p className="kicker text-pale-muted">{x.kicker}</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-sky sm:text-5xl">{t.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-pale-muted">
            <Avatar profile={t.profile} name={organizer} size={32} />
            <span>
              {x.organizedBy} <strong className="text-pale">{organizer}</strong>
              {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
            </span>
            {badge ? <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community}`}>{d.community.badges[badge as keyof typeof d.community.badges] ?? badge}</span> : null}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="stat-pill border border-sky text-crimson">
              {x.startsAt}: <LocalTime iso={t.starts_at} locale={locale} utcLabel={x.utc} />
            </span>
            <span className="stat-pill bg-night-3 text-pale">{x.formats[t.format]}</span>
            <span className="stat-pill bg-night-3 text-pale">{x.deckModes[t.deck_mode]}</span>
            <span className="stat-pill bg-night-3 text-pale">{fill(x.bestOf, { n: t.best_of })}</span>
            <span className="stat-pill border border-sky font-mono text-pale">
              {active.length} {x.of} {t.size} {x.players}
            </span>
          </div>
          {t.deck_mode === "conquest" ? <p className="mt-2 text-sm text-pale-muted">{fill(x.conquestRule, { n: t.conquest_decks, min: t.conquest_min_different })}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <CopyButton text={t.tag} label={`${x.copyTag} ${t.tag}`} copied={x.copied} className="btn btn-ink text-xs" />
            <CopyButton text={shortLink} label={x.copyLink} copied={x.copied} className="btn border border-sky text-xs text-pale" />
            {t.discord_url ? (
              <DiscordButton href={t.discord_url} size="sm">
                {x.discord}
              </DiscordButton>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border-2 border-sky bg-night-2/80 p-5">
            <JoinTournament
              id={t.id}
              slug={t.slug}
              status={t.status}
              players={active.length}
              size={t.size}
              registeredIds={registeredIds}
              submittedIds={submittedIds}
              organizerId={t.organizer}
              loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
              deckHref={`${path}/deck`}
              manageHref={`${path}/manage`}
              labels={x}
            />
          </div>

          {t.description ? (
            <section className="mt-8">
              <h2 className="kicker text-mint">{x.about}</h2>
              <p className="mt-2 whitespace-pre-line text-pale">
                <CardMentions text={t.description} locale={locale} dict={d} id="tm-about" />
              </p>
            </section>
          ) : null}
          {t.rules ? (
            <section className="mt-6">
              <h2 className="kicker text-mint">{x.rules}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-pale">
                <CardMentions text={t.rules} locale={locale} dict={d} id="tm-rules" />
              </p>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-sky">
              {x.registered} <span className="font-mono text-sm font-normal text-pale-muted">{active.length}/{t.size}</span>
            </h2>
            {players.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((p) => (
                  <PlayerRow key={p.user_id} p={p} dict={d} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-pale-muted">{x.noPlayers}</p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-sky">{x.bracket}</h2>
            {t.status === "open" || !matches.length ? (
              <p className="mt-2 text-sm text-pale-muted">{x.bracketSoon}</p>
            ) : (
              <div className="mt-3">
                <Bracket matches={matches} names={nameOf} dict={d} />
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-sky">{x.decklists}</h2>
            {decks.length ? (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {decks.map((row) => (
                  <li key={row.user_id} className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
                    <p className="font-display text-sm font-bold text-sky">{nameOf.get(row.user_id) ?? "?"}</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {row.codes.map((code, i) => {
                        const deck = decodeOmCode(code);
                        const leg = deck?.legendary ? getCard(deck.legendary) : undefined;
                        return (
                          <li key={i} className="flex flex-wrap items-center gap-2">
                            {leg ? <CardChip slug={leg.slug} locale={locale} /> : null}
                            <Link href={`${href(locale, "/deck-builder")}#${code}`} className="btn btn-ink text-xs">
                              {d.community.openInBuilder}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-pale-muted">{x.decklistsHidden}</p>
            )}
          </section>

          {t.report ? (
            <section className="mt-8 rounded-xl border-2 border-gold bg-gold/10 p-5">
              <h2 className="kicker text-gold">{x.report}</h2>
              <p className="mt-2 whitespace-pre-line text-pale">
                <CardMentions text={t.report} locale={locale} dict={d} id="tm-report" />
              </p>
            </section>
          ) : null}
          <CardMentionEdges />
        </div>
      </article>

      {others.filter((o) => o.id !== t.id).length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{x.others}</h2>
          <ul className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {others
              .filter((o) => o.id !== t.id)
              .slice(0, 6)
              .map((o) => (
                <li key={o.id}>
                  <TournamentCard t={o} locale={locale} dict={d} compact />
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
