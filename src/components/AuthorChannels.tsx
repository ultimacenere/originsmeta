import type { Locale } from "@/lib/i18n";
import { getProfileShowcase } from "@/lib/community/creators";
import { isCreatorBadge, mainChannels, twitchLogin } from "@/lib/community/profileLinks";
import { creatorLabels } from "@/lib/creatorLabels";
import { ChannelLinks } from "./ChannelLinks";
import { LiveBadge } from "./LiveBadge";

/**
 * Accanto al nome dell'autore nella scheda di un mazzo della community (pacchetto CREATOR, 26/09/2026): i suoi canali
 * principali (i primi tre che ha scelto nel profilo) e, se ha un tag autore e un canale Twitch, il badge LIVE caricato
 * nel browser. Il tag autore la scheda lo mostra già nella riga delle pastiglie, subito sotto.
 *
 * Componente server che legge da solo il profilo (`getProfileShowcase`, cache dei dati di Next da 60 s come le altre
 * letture pubbliche): nella pagina basta una riga. Come le altre letture della scheda, un errore del database lancia e
 * l'ISR tiene la versione precedente; con le colonne non ancora nel database non mostra nulla.
 */
export async function AuthorChannels({ ownerId, username, name, badge, locale }: { ownerId: string; username?: string | null; name: string; badge?: string | null; locale: Locale }) {
  const showcase = await getProfileShowcase(ownerId);
  if (!showcase) return null;
  const L = creatorLabels[locale];
  const channels = mainChannels(showcase.links);
  const live = Boolean(username) && isCreatorBadge(badge) && twitchLogin(showcase.links) !== null;
  if (!channels.length && !live) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {live && username ? <LiveBadge username={username} labels={L.live} placement="deck_page" /> : null}
      <ChannelLinks links={channels} labels={L.channels} ownerName={name} placement="deck_page" variant="compact" />
    </span>
  );
}
