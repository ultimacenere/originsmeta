"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { filterCreators, platformsInUse } from "@/lib/community/creatorDirectory";
import { CONTENT_LANGS, LINK_KINDS, LINK_KIND_NAMES, type ContentLang, type LinkKind, type ProfileLink } from "@/lib/community/profileLinks";
import { fillCreator, type ChannelLabels, type DirectoryLabels, type LiveLabels } from "@/lib/creatorLabels";
import { Avatar } from "./AccountMenu";
import { ChannelLinks } from "./ChannelLinks";
import { LiveBadge } from "./LiveBadge";

/**
 * Directory dei creator (/creators, pacchetto CREATOR, 26/09/2026): le schede sono già nell'HTML (la pagina è ISR e il
 * componente si pre-renderizza), qui ci sono solo i filtri per lingua dei contenuti e piattaforma, come in
 * LocationExplorer. L'ordine arriva già fatto dalla pagina (`orderCreators`, dichiarato nel testo della pagina).
 */

export type DirectoryEntry = {
  username: string;
  name: string;
  avatar: string | null;
  badge: string;
  badgeLabel: string;
  bio: string | null;
  links: ProfileLink[];
  langs: ContentLang[];
  /** piattaforme dei canali, per il filtro */
  kinds: LinkKind[];
  decks: number;
  href: string;
  /** solo con un canale Twitch: nome utente per il badge LIVE */
  liveUser?: string;
};

export function CreatorDirectory({
  entries,
  labels,
  channelLabels,
  liveLabels,
  langNames,
}: {
  entries: DirectoryEntry[];
  labels: DirectoryLabels;
  channelLabels: ChannelLabels;
  liveLabels: LiveLabels;
  langNames: Record<ContentLang, string>;
}) {
  const [lang, setLang] = useState("all");
  const [platform, setPlatform] = useState("all");
  const platforms = useMemo(() => platformsInUse(entries, LINK_KINDS), [entries]);
  const shown = useMemo(() => filterCreators(entries, lang, platform), [entries, lang, platform]);
  const selectCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-mint";
  const kindName = (k: LinkKind) => (k === "website" ? channelLabels.website : LINK_KIND_NAMES[k]);

  return (
    <div>
      <div className="felt-panel mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.lang}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className={selectCls}>
            <option value="all">{labels.allLangs}</option>
            {CONTENT_LANGS.map((l) => (
              <option key={l} value={l}>
                {langNames[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.platform}</span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectCls}>
            <option value="all">{labels.allPlatforms}</option>
            {platforms.map((k) => (
              <option key={k} value={k}>
                {kindName(k)}
              </option>
            ))}
          </select>
        </label>
        <p className="kicker self-end text-chalk-muted lg:text-right" aria-live="polite">
          {shown.length === 1 ? labels.resultsOne : fillCreator(labels.results, { n: shown.length })}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="card-night p-6 text-pale-muted">{labels.noResults}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shown.map((c) => (
            <li key={c.username} className="card-night flex flex-col p-5">
              <div className="flex items-start gap-4">
                <Avatar profile={{ username: c.username, display_name: c.name, avatar_url: c.avatar }} name={c.name} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={c.href} className="t-item leading-tight hover:text-mint">
                      {c.name}
                    </Link>
                    {c.liveUser ? <LiveBadge username={c.liveUser} labels={liveLabels} placement="creators" /> : null}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`${badgePill} ${badgeStyle[c.badge] ?? badgeStyle.community}`}>{c.badgeLabel}</span>
                    {/* codice della lingua a vista, nome per esteso (nella sua lingua) per i lettori di schermo */}
                    {c.langs.map((l) => (
                      <span key={l} className="stat-pill bg-night-3 font-mono text-[11px] uppercase text-pale" title={langNames[l]}>
                        <span aria-hidden="true">{l}</span>
                        <span className="sr-only" lang={l}>
                          {langNames[l]}
                        </span>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              {c.bio ? <p className="mt-3 line-clamp-4 whitespace-pre-line break-words text-sm text-pale">{c.bio}</p> : null}
              <ChannelLinks links={c.links} labels={channelLabels} ownerName={c.name} placement="creators" className="mt-3" />
              <p className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-pale-muted">
                <span className="font-mono">{c.decks === 0 ? labels.noDecks : c.decks === 1 ? labels.deckOne : fillCreator(labels.decksMany, { n: c.decks })}</span>
                <Link href={c.href} className="link-mint font-bold">
                  {labels.profile} →
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
