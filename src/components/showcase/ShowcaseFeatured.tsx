import Link from "next/link";
import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard, patchAt, patchLabel } from "@/lib/data/cards";
import { videoLabels } from "@/lib/videoLabels";
import { showcaseLabels } from "@/lib/showcaseLabels";
import { accentBorder, accentText, type Vetrina } from "@/lib/community/showcase";
import type { CommunityDeck } from "@/lib/community/types";
import { twitchLogin, type ProfileLink } from "@/lib/community/profileLinks";
import { CardArt } from "@/components/CardChip";
import { VideoEmbed } from "@/components/VideoEmbed";
import { ScheduleView } from "./ScheduleView";

/**
 * In cima alla vetrina /u, subito sotto la testata (pacchetto VETRINA, 27/09/2026): il mazzo in evidenza (uno dei suoi
 * mazzi pubblicati: si cerca fra quelli che la pagina ha già letto, quindi un mazzo nascosto o eliminato sparisce da
 * solo), gli orari delle dirette e il video in evidenza (lettore a clic `VideoEmbed`: nessuna richiesta a YouTube o
 * Twitch prima del clic). Senza nessuno dei tre non mostra nulla.
 */
export function ShowcaseFeatured({
  vetrina,
  decks,
  locale,
  dict,
  name,
  username,
  links,
}: {
  vetrina: Vetrina;
  decks: readonly CommunityDeck[];
  locale: Locale;
  dict: Dictionary;
  name: string;
  username: string;
  /** canali del profilo: con un canale Twitch gli orari mostrano "In diretta ora" (badge LIVE) */
  links: readonly ProfileLink[];
}) {
  const L = showcaseLabels[locale].view;
  const deck = vetrina.featuredDeck ? decks.find((d) => d.id === vetrina.featuredDeck && d.status === "published") : undefined;
  const video = vetrina.featuredVideo;
  const hasSchedule = vetrina.schedule.length > 0 && vetrina.scheduleTz !== null;
  if (!deck && !video && !hasSchedule) return null;
  const frame = accentBorder(vetrina.accent);
  const title = accentText(vetrina.accent);
  const live = twitchLogin(links) !== null;

  const deckCard = deck
    ? (() => {
        const legendary = deck.legendary ? getCard(deck.legendary) : undefined;
        const patch = patchAt(deck.created_at);
        return (
          <article className="card-night flex gap-4 p-5" style={frame}>
            {legendary ? (
              <Link href={href(locale, `/cards/${legendary.slug}`)} prefetch={false} className="shrink-0" title={legendary.name}>
                <CardArt card={legendary} full className="!h-[110px] !w-[78px] text-lg" />
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="kicker text-mint" style={title}>
                {L.featuredDeck}
              </h2>
              <Link href={href(locale, `/decks/community/${deck.slug}`)} className="t-item mt-1 block leading-tight hover:text-mint">
                {deck.name}
              </Link>
              <p className="mt-2 flex flex-wrap items-center gap-2">
                <span className="stat-pill bg-sky text-[11px] text-ink">{archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}</span>
                {patch ? (
                  <span className="stat-pill bg-night-3 text-[11px] text-pale">
                    {dict.common.patch} {patchLabel(patch, locale)}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 font-mono text-xs text-pale-muted">
                {dict.common.createdOn} {formatDate(locale, deck.created_at.slice(0, 10))}
                {deck.rating?.votes ? ` · ★ ${deck.rating.avg.toFixed(1)} (${deck.rating.votes})` : ""}
              </p>
            </div>
          </article>
        );
      })()
    : null;

  const schedule = hasSchedule ? (
    <div className="card-night p-5" style={frame}>
      <ScheduleView entries={vetrina.schedule} tz={vetrina.scheduleTz!} locale={locale} labels={L} username={username} live={live} titleStyle={title} />
    </div>
  ) : null;

  const player = video ? (
    <div className="card-night min-w-0 p-5" style={frame}>
      <h2 className="kicker mb-3 text-mint" style={title}>
        {L.featuredVideo}
      </h2>
      <VideoEmbed video={video} title={`${L.featuredVideo} · ${name}`} labels={videoLabels[locale].player} privacyHref={`${href(locale, "/privacy")}#video`} placement="profile" />
    </div>
  ) : null;

  // con il video: mazzo e orari in colonna a sinistra, il lettore a destra; il solo video non occupa tutta la riga
  const side = deckCard || schedule ? (
    <div className="min-w-0 space-y-4">
      {deckCard}
      {schedule}
    </div>
  ) : null;
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {player ? (
        side ? (
          <>
            {side}
            {player}
          </>
        ) : (
          <div className="min-w-0 md:col-span-2 md:max-w-3xl">{player}</div>
        )
      ) : (
        <>
          {deckCard}
          {schedule}
        </>
      )}
    </section>
  );
}
