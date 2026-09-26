import type { Locale } from "@/lib/i18n";
import type { Showcase } from "@/lib/community/creators";
import { isCreatorBadge, twitchLogin } from "@/lib/community/profileLinks";
import { creatorLabels } from "@/lib/creatorLabels";
import { ChannelLinks } from "./ChannelLinks";
import { LiveBadge } from "./LiveBadge";

/**
 * La parte alta del profilo pubblico /u/<nome> (pacchetto CREATOR, 26/09/2026): bio, lingue dei contenuti, canali con
 * rel="me" e, per chi ha un tag autore e un canale Twitch, il badge LIVE caricato nel browser. Senza bio, lingue né
 * canali non mostra nulla. La bio è testo semplice: React la scrive come testo (niente HTML), gli a capo restano.
 */
export function ProfileShowcase({ showcase, username, name, badge, locale }: { showcase: Showcase | null; username: string; name: string; badge?: string | null; locale: Locale }) {
  if (!showcase) return null;
  const L = creatorLabels[locale];
  const live = isCreatorBadge(badge) && twitchLogin(showcase.links) !== null;
  if (!showcase.bio && !showcase.links.length && !showcase.contentLangs.length && !live) return null;
  return (
    <div className="mt-4 space-y-3">
      {showcase.bio ? <p className="max-w-2xl whitespace-pre-line break-words text-pale">{showcase.bio}</p> : null}
      {showcase.contentLangs.length || live ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-pale-muted">
          {live ? <LiveBadge username={username} labels={L.live} placement="profile" /> : null}
          {showcase.contentLangs.length ? (
            <>
              <span>{L.profile.langs}</span>
              {/* codice della lingua a vista, nome per esteso (nella sua lingua) per i lettori di schermo */}
              {showcase.contentLangs.map((l) => (
                <span key={l} className="stat-pill bg-night-3 font-mono text-[11px] uppercase text-pale" title={L.langNames[l]}>
                  <span aria-hidden="true">{l}</span>
                  <span className="sr-only" lang={l}>
                    {L.langNames[l]}
                  </span>
                </span>
              ))}
            </>
          ) : null}
        </p>
      ) : null}
      <ChannelLinks links={showcase.links} labels={L.channels} ownerName={name} placement="profile" me />
    </div>
  );
}
