import Link from "next/link";
import { formatDateShort, formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import type { Event } from "@/lib/data/events";
import { NEW_TAB_REL, NewTabIcon, SteamButton, isSteamUrl } from "./SteamButton";
import { DiscordButton, isDiscordUrl } from "./DiscordButton";

export function EventCard({ event, locale, dict, compact = false }: { event: Event; locale: Locale; dict: Dictionary; compact?: boolean }) {
  const range = event.end
    ? `${formatDateShort(locale, event.start)} – ${formatDateShort(locale, event.end)} ${event.end.slice(0, 4)}`
    : formatDate(locale, event.start);
  // Iscrizioni e fonti portano fuori dal sito: nuova scheda, con l'avviso per i lettori di schermo nel nome del link
  // (Steam e Discord lo fanno da soli, vedi SteamButton.tsx).
  const newTab = (
    <>
      <NewTabIcon className="h-3 w-3" />
      <span className="sr-only"> {dict.footer.newTab}</span>
    </>
  );
  return (
    <article className="card-night flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        {/* rosa tenue: il crimson sul blu notte fa 3:1 e il rosa pieno, sotto il velo menta in cima alla scheda, 4,1:1;
            crimson-soft fa 8,9:1 lì e 10,4:1 sul night */}
        <p className="font-mono text-sm tabular text-crimson-soft">{range}</p>
        <span className={`stat-pill text-[11px] font-semibold uppercase ${event.official ? "bg-night-3 text-chalk" : "bg-night-3 text-pale"}`}>
          {event.official ? dict.events.officialBadge : dict.events.communityBadge}
        </span>
      </div>
      <h3 className="t-item mt-2">{event.title[locale]}</h3>
      <p className="mt-1 text-sm text-pale-muted">{event.where[locale]}</p>
      <p className="mt-3 text-sm text-pale">{event.text[locale]}</p>
      {!compact && event.format ? (
        <p className="mt-3 text-sm">
          <span className="kicker text-pale-muted">{dict.common.format}</span>
          <br />
          {event.format[locale]}
        </p>
      ) : null}
      {!compact && event.prizes ? (
        <p className="mt-3 text-sm">
          <span className="kicker text-pale-muted">{dict.common.prize}</span>
          <br />
          {event.prizes[locale]}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {event.guide ? (
          <Link href={href(locale, `/guides/${event.guide}`)} className="btn btn-primary text-xs">
            {dict.events.guideCta}
          </Link>
        ) : null}
        {event.signup ? (
          isSteamUrl(event.signup.url) ? (
            <SteamButton href={event.signup.url} size="sm">
              {event.signup.label[locale]}
            </SteamButton>
          ) : isDiscordUrl(event.signup.url) ? (
            <DiscordButton href={event.signup.url} size="sm">
              {event.signup.label[locale]}
            </DiscordButton>
          ) : (
            <a className="btn btn-ink text-xs" href={event.signup.url} target="_blank" rel={NEW_TAB_REL}>
              {event.signup.label[locale]}
              {newTab}
            </a>
          )
        ) : null}
        {event.source ? (
          isSteamUrl(event.source) ? (
            <SteamButton href={event.source} variant="dark" size="sm">
              {dict.common.source}
            </SteamButton>
          ) : (
            <a className="btn btn-ink text-xs" href={event.source} target="_blank" rel={NEW_TAB_REL}>
              {dict.common.source}
              {newTab}
            </a>
          )
        ) : null}
      </div>
    </article>
  );
}
