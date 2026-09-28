import type { Locale } from "@/lib/i18n";
import type { Showcase } from "@/lib/community/creators";
import { creatorLabels } from "@/lib/creatorLabels";
import { ChannelLinks } from "./ChannelLinks";

/**
 * La parte alta del profilo pubblico /u/<nome> (pacchetto CREATOR, 26/09/2026): bio, lingue dei contenuti e canali con
 * rel="me". Senza bio, lingue né canali non mostra nulla. La bio è testo semplice: React la scrive come testo (niente
 * HTML), gli a capo restano. Il badge LIVE dal 28/09/2026 non sta più qui, sulla riga delle lingue: è nella testata del
 * profilo accanto al ruolo, più grande (pagina /u).
 */
export function ProfileShowcase({ showcase, name, locale }: { showcase: Showcase | null; name: string; locale: Locale }) {
  if (!showcase) return null;
  const L = creatorLabels[locale];
  if (!showcase.bio && !showcase.links.length && !showcase.contentLangs.length) return null;
  return (
    <div className="mt-4 space-y-3">
      {showcase.bio ? <p className="max-w-2xl whitespace-pre-line break-words text-pale">{showcase.bio}</p> : null}
      {showcase.contentLangs.length ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-pale-muted">
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
        </p>
      ) : null}
      <ChannelLinks links={showcase.links} labels={L.channels} ownerName={name} placement="profile" me />
    </div>
  );
}
