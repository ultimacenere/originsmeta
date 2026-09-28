"use client";

import Link from "next/link";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import type { Badge } from "@/lib/community/badges";
import { useLiveUsers } from "@/lib/liveClient";
import { channelLogin, liveOrder } from "@/lib/twitchLive";
import { fillCreator, type LiveLabels, type LivePageLabels } from "@/lib/creatorLabels";
import { Avatar } from "./AccountMenu";
import { LiveBadge } from "./LiveBadge";
import { LivePlayer } from "./LivePlayer";

/** Un profilo con un canale Twitch (ruolo con vetrina), come lo prepara la pagina /live sul server. */
export type LiveStreamer = {
  username: string;
  name: string;
  avatar: string | null;
  badge: Badge;
  badgeLabel: string;
  href: string;
  /** https://www.twitch.tv/<canale>, dal profilo */
  channel: string;
};

/**
 * Chi è in diretta adesso, nella pagina /live (28/09/2026): una scheda per creator con foto, nome, ruolo, badge LIVE,
 * titolo della diretta, il lettore a clic (`LivePlayer`) e i link al canale e al profilo. Lo stato arriva nel browser da
 * /api/live e si rilegge ogni minuto a scheda visibile (`useLiveUsers`): la pagina resta ISR, nell'HTML ci sono solo il
 * titolo, l'elenco degli streamer e il messaggio di attesa. Chi è in diretta ma non è nell'elenco della pagina (un
 * canale aggiunto dopo l'ultima rigenerazione) compare con il solo nome utente.
 */
export function LiveNow({
  streamers,
  labels,
  liveLabels,
  profileBase,
  privacyHref,
}: {
  streamers: LiveStreamer[];
  labels: LivePageLabels;
  liveLabels: LiveLabels;
  /** percorso dei profili nella lingua della pagina, senza il nome utente ("/it/u/") */
  profileBase: string;
  privacyHref: string;
}) {
  const state = useLiveUsers(60_000);
  if (!state) return <p className="card-night mt-8 p-6 text-pale-muted">{labels.loading}</p>;
  if (!state.enabled) return <p className="card-night mt-8 p-6 text-pale-muted">{labels.off}</p>;
  const names = liveOrder(state.users);
  if (!names.length) return <p className="card-night mt-8 p-6 text-pale">{labels.none}</p>;
  const byUser = new Map(streamers.map((s) => [s.username, s]));

  return (
    <ul className="mt-8 grid grid-cols-1 gap-6">
      {names.map((username) => {
        const live = state.users[username];
        const login = channelLogin(live.channel);
        const s = byUser.get(username);
        const name = s?.name ?? username;
        const profile = s?.href ?? `${profileBase}${username}`;
        return (
          <li key={username} className="card-night min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar profile={{ username, display_name: name, avatar_url: s?.avatar ?? null }} name={name} size={56} />
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={profile} className="t-item break-words leading-tight hover:text-mint">
                    {name}
                  </Link>
                  {s ? <span className={`${badgePill} ${badgeStyle[s.badge]}`}>{s.badgeLabel}</span> : null}
                  <LiveBadge username={username} labels={liveLabels} placement="live_page" />
                </p>
                {live.title ? <p className="mt-2 break-words text-sm text-pale">{live.title}</p> : null}
                <p className="mt-1 font-mono text-xs text-pale-muted">{fillCreator(labels.viewers, { viewers: live.viewers })}</p>
              </div>
            </div>
            {login ? <LivePlayer login={login} name={name} labels={labels} privacyHref={privacyHref} /> : null}
            <p className="mt-3 flex flex-wrap gap-2">
              <a
                href={live.channel}
                target="_blank"
                rel="ugc nofollow noopener"
                className="btn btn-ink text-xs"
                data-om-event="creator_link_click"
                data-om-kind="twitch_live"
                data-om-placement="live_page"
              >
                {labels.openTwitch} ↗
              </a>
              <Link href={profile} className="btn btn-ink text-xs">
                {labels.profile}
              </Link>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
