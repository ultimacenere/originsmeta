import { LINK_KIND_NAMES, linkHandle, type LinkKind, type ProfileLink } from "@/lib/community/profileLinks";
import { fillCreator, type ChannelLabels } from "@/lib/creatorLabels";

/**
 * Canali di un iscritto (pacchetto CREATOR, 26/09/2026): profilo /u (`full`, tutti, con il nome del canale), accanto
 * al nome dell'autore nella scheda del mazzo e in /decks (`compact` o, nella riga stretta della vista elenco, `icon`:
 * i canali principali), directory /creators. Un dominio lungo si taglia con i puntini, l'indirizzo intero sta nel title.
 * Nessun hook: va bene nei componenti server e in quelli del browser (DeckExplorer).
 *
 * Icone semplici e generiche (diretta, video, @, chat, globo), mai i loghi delle piattaforme: sono marchi di terzi e
 * accanto alla nostra interfaccia sembrerebbero parte del sito. Il nome della piattaforma è scritto per esteso; per il
 * sito web si vede sempre il dominio, così chi clicca sa dove va (difesa dal phishing insieme all'elenco degli host).
 * Link esterni degli utenti: nuova scheda e rel="ugc nofollow noopener"; `me` solo sulla pagina del profilo, dove il
 * link dice "questo canale è di questa persona" (rel="me"). Il clic si misura con creator_link_click (analytics.ts).
 */

type Glyph = "live" | "video" | "at" | "chat" | "globe";

const GLYPH: Record<LinkKind, Glyph> = {
  twitch: "live",
  kick: "live",
  youtube: "video",
  tiktok: "video",
  x: "at",
  instagram: "at",
  bluesky: "at",
  discord: "chat",
  website: "globe",
};

function ChannelIcon({ kind, className = "h-3.5 w-3.5" }: { kind: LinkKind; className?: string }) {
  const common = { className, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (GLYPH[kind]) {
    case "live":
      return (
        <svg {...common}>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
          <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <rect x="1.5" y="3" width="13" height="10" rx="2.5" />
          <path d="M6.5 5.8v4.4L10.2 8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "at":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.4" />
          <path d="M10.4 8v1.1a1.8 1.8 0 0 0 3.6 0V8a6 6 0 1 0-2.4 4.8" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M2.5 3.5h11v7h-6.5l-3 2.5v-2.5h-1.5z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M1.8 8h12.4M8 1.8c1.8 1.9 2.6 4 2.6 6.2S9.8 12.3 8 14.2M8 1.8C6.2 3.7 5.4 5.8 5.4 8s.8 4.3 2.6 6.2" />
        </svg>
      );
  }
}

/** Nome visibile: la piattaforma, oppure per il sito web il dominio. */
export function channelName(link: ProfileLink): string {
  return link.kind === "website" ? linkHandle(link) : LINK_KIND_NAMES[link.kind];
}

export function ChannelLinks({
  links,
  labels,
  ownerName,
  placement,
  variant = "full",
  me = false,
  className = "",
}: {
  links: readonly ProfileLink[];
  labels: ChannelLabels;
  /** per il nome dell'elenco ("Canali di coachcrono") */
  ownerName: string;
  /** `data-om-placement` della misura: profile, deck_page, decks_list, creators */
  placement: string;
  /**
   * `full`: icona, piattaforma e nome del canale (profilo, directory); `compact`: icona e piattaforma, dentro una riga
   * di testo (scheda del mazzo, griglia di /decks); `icon`: la sola icona, con piattaforma e canale nel `title` e per i
   * lettori di schermo (riga stretta della vista elenco di /decks).
   */
  variant?: "full" | "compact" | "icon";
  /** rel="me": solo sulla pagina del profilo */
  me?: boolean;
  className?: string;
}) {
  if (!links.length) return null;
  const rel = me ? "me ugc nofollow noopener" : "ugc nofollow noopener";
  const inline = variant !== "full";
  // Le versioni compatte stanno dentro una riga di testo (<p> dell'autore): elenco fatto di <span> con i ruoli ARIA,
  // perché un <ul> dentro un <p> è HTML non valido (il browser chiuderebbe il paragrafo e l'idratazione fallirebbe).
  const List = inline ? "span" : "ul";
  const Item = inline ? "span" : "li";
  const chip =
    variant === "full"
      ? "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border-2 border-sky bg-night-2 px-2.5 py-1 text-xs font-semibold text-pale hover:border-mint hover:text-mint"
      : variant === "compact"
        ? "inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border-2 border-sky px-1.5 py-0.5 text-[11px] font-semibold text-pale hover:border-mint hover:text-mint"
        : "inline-flex items-center rounded-md border-2 border-sky p-1 text-pale hover:border-mint hover:text-mint";
  return (
    <List
      role={inline ? "list" : undefined}
      aria-label={fillCreator(labels.listOf, { name: ownerName })}
      className={`${inline ? "inline-flex min-w-0 max-w-full" : "flex"} flex-wrap items-center ${inline ? "gap-1" : "gap-2"} ${className}`}
    >
      {links.map((link) => {
        const name = channelName(link);
        const handle = link.kind === "website" ? "" : linkHandle(link);
        // nel title l'indirizzo completo del sito (il dominio visibile può essere tagliato) o il nome del canale
        const title = link.kind === "website" ? link.url : variant === "full" ? undefined : `${name}: ${handle}`;
        return (
          <Item key={link.url} role={inline ? "listitem" : undefined} className="min-w-0 max-w-full">
            <a
              href={link.url}
              target="_blank"
              rel={rel}
              data-om-event="creator_link_click"
              data-om-kind={link.kind}
              data-om-placement={placement}
              title={title}
              className={chip}
            >
              <ChannelIcon kind={link.kind} className={variant === "full" ? "h-3.5 w-3.5 shrink-0" : "h-3 w-3 shrink-0"} />
              {variant === "icon" ? <span className="sr-only">{handle ? `${name}: ${handle}` : name}</span> : <span className="min-w-0 truncate">{name}</span>}
              {variant === "full" && handle ? <span className="min-w-0 truncate font-mono font-normal text-pale-muted">{handle}</span> : null}
              <span className="sr-only"> {labels.newTab}</span>
            </a>
          </Item>
        );
      })}
    </List>
  );
}
