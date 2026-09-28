import type { Metadata } from "next";
import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { listCreators } from "@/lib/community/creators";
import { twitchLogin } from "@/lib/community/profileLinks";
import { authorName } from "@/lib/community/util";
import { dropHreflang } from "@/lib/community/deckQuality";
import { creatorLabels } from "@/lib/creatorLabels";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { Avatar } from "@/components/AccountMenu";
import { LiveNow, type LiveStreamer } from "@/components/LiveNow";

/*
  Pagina /live (28/09/2026, idea di Davdas ripresa da Pierluigi: "Ora live" nella striscia del calendario porta "a una
  pagina con i creator che sono live in quel momento"). In cima chi è in diretta su Origins TCG adesso, letto nel browser
  da /api/live (`LiveNow`, riletto ogni minuto), con il lettore di Twitch a clic; sotto l'elenco di chi ha il ruolo
  Creator, Autore, Pro o Staff e un canale Twitch nel profilo (le stesse regole del badge LIVE, `liveStatus` in
  src/lib/twitch.ts), che è la parte scritta nell'HTML. ISR come /creators: la lettura dei profili è quella della
  directory e di /api/live. Noindex e fuori da hreflang e sitemap: il contenuto cambia di minuto in minuto e l'elenco
  degli streamer è già nella directory /creators, che si indicizza.
*/
export const revalidate = 300;

async function loadStreamers(locale: Locale, badges: Record<string, string>): Promise<LiveStreamer[]> {
  const creators = await listCreators();
  return creators
    .flatMap((c) => {
      const login = twitchLogin(c.links);
      return login ? [{ c, login }] : [];
    })
    .map(({ c, login }) => ({
      username: c.username,
      name: authorName(c),
      avatar: c.avatar_url,
      badge: c.badge,
      badgeLabel: badges[c.badge] ?? c.badge,
      href: href(locale, `/u/${c.username}`),
      channel: `https://www.twitch.tv/${login}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = creatorLabels[locale].liveNow.page;
  return dropHreflang(pageMeta(locale, "/live", L.metaTitle, L.description, undefined, { noindex: true }));
}

export default async function LivePage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const C = creatorLabels[locale];
  const L = C.liveNow.page;
  const streamers = await loadStreamers(locale, d.community.badges);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="kicker flex items-center gap-2 text-crimson-soft">
        <span className="live-dot" aria-hidden="true" />
        {L.kicker}
      </p>
      <h1 className="t-page mt-2">{L.h1}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{L.intro}</p>

      <LiveNow
        streamers={streamers}
        labels={L}
        liveLabels={C.live}
        profileBase={href(locale, "/u/")}
        privacyHref={`${href(locale, "/privacy")}#video`}
      />

      <section aria-labelledby="live-streamers" className="mt-14">
        <h2 id="live-streamers" className="t-section">
          {L.streamersTitle}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-chalk-muted">{L.streamersIntro}</p>
        {streamers.length ? (
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {streamers.map((s) => (
              <li key={s.username} className="card-night flex min-w-0 items-center gap-3 p-4">
                <Avatar profile={{ username: s.username, display_name: s.name, avatar_url: s.avatar }} name={s.name} size={40} />
                <div className="min-w-0 flex-1">
                  <Link href={s.href} className="t-item block truncate leading-tight hover:text-mint">
                    {s.name}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`${badgePill} ${badgeStyle[s.badge]}`}>{s.badgeLabel}</span>
                    <a
                      href={s.channel}
                      target="_blank"
                      rel="ugc nofollow noopener"
                      className="text-xs font-semibold text-mint underline-offset-2 hover:underline"
                      data-om-event="creator_link_click"
                      data-om-kind="twitch"
                      data-om-placement="live_page"
                    >
                      {L.twitchChannel} ↗
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-night mt-5 p-5 text-sm text-pale-muted">{L.streamersEmpty}</p>
        )}
      </section>

      <section className="card-night mt-12 border-dashed p-5 sm:p-7">
        <p className="max-w-3xl text-sm text-pale">{L.howTo}</p>
        <p className="mt-4">
          <Link href={href(locale, "/creators")} className="link-mint font-bold">
            {L.allCreators} →
          </Link>
        </p>
      </section>
    </div>
  );
}
