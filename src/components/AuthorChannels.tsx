import type { Locale } from "@/lib/i18n";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getProfileShowcase } from "@/lib/community/creators";
import { isCreatorBadge, mainChannels, twitchLogin } from "@/lib/community/profileLinks";
import { creatorLabels } from "@/lib/creatorLabels";
import { ChannelLinks } from "./ChannelLinks";
import { LiveBadge } from "./LiveBadge";

/**
 * Accanto al nome dell'autore nella scheda di un mazzo della community (pacchetto CREATOR, 26/09/2026): il suo tag
 * autore (Autore, Influencer, Pro, Staff; "Community" non si mostra), il badge LIVE caricato nel browser se ha un
 * canale Twitch, e i suoi canali principali (i primi tre che ha scelto nel profilo). Solo per chi ha un tag autore,
 * come nell'elenco /decks: i canali di un account qualsiasi restano sulla sua pagina /u (meno spazio ai link di spam
 * accanto ai contenuti, e quello che dicono la privacy e il modulo di /account).
 *
 * Componente server che legge da solo il profilo (`getProfileShowcase`, cache dei dati di Next come le altre letture
 * pubbliche): nella pagina basta una riga. Come le altre letture della scheda, un errore del database lancia e l'ISR
 * tiene la versione precedente; con le colonne non ancora nel database resta il solo tag.
 */
export async function AuthorChannels({
  ownerId,
  username,
  name,
  badge,
  badgeLabel,
  locale,
}: {
  ownerId: string;
  username?: string | null;
  name: string;
  badge?: string | null;
  /** nome del tag nella lingua della pagina (dizionario: community.badges) */
  badgeLabel?: string;
  locale: Locale;
}) {
  if (!badge || !isCreatorBadge(badge)) return null;
  const showcase = await getProfileShowcase(ownerId);
  const L = creatorLabels[locale];
  const channels = showcase ? mainChannels(showcase.links) : [];
  const live = Boolean(username) && showcase !== null && twitchLogin(showcase.links) !== null;
  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
      {badgeLabel ? <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community}`}>{badgeLabel}</span> : null}
      {live && username ? <LiveBadge username={username} labels={L.live} placement="deck_page" /> : null}
      <ChannelLinks links={channels} labels={L.channels} ownerName={name} placement="deck_page" variant="compact" />
    </span>
  );
}
