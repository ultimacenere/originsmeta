import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { authorName } from "@/lib/community/util";
import { bestOfLabel, type Tournament } from "@/lib/tournament/types";
import { LocalTime } from "./LocalTime";

/** Scheda di un torneo della community nelle liste (/tournaments, profilo): copertina, stato, tag, data, regole in pillole. */
export function TournamentCard({ t, locale, dict, compact = false }: { t: Tournament; locale: Locale; dict: Dictionary; compact?: boolean }) {
  const x = dict.tournaments;
  const link = href(locale, `/tournaments/${t.slug}`);
  return (
    <article className="card-night card-night-hover flex h-full flex-col overflow-hidden">
      {!compact ? (
        <Link href={link} className="relative block aspect-[16/7] w-full overflow-hidden bg-night-2" tabIndex={-1} aria-hidden="true">
          {t.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : null}
          <span className="stat-pill absolute left-3 top-3 bg-night-3 text-[11px] font-semibold uppercase text-pale">{x.statuses[t.status]}</span>
          <span className="stat-pill absolute right-3 top-3 bg-mint text-[11px] font-bold text-ink">{t.tag}</span>
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        {/* data in pale: il crimson di prima su night non era leggibile (2,96:1) */}
        <p className="font-mono text-sm text-pale">
          <LocalTime iso={t.starts_at} locale={locale} utcLabel={x.utc} />
        </p>
        <h3 className="t-item mt-2">
          <Link href={link} className="hover:text-mint">
            {t.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-pale-muted">
          {x.organizedBy} <span className="text-pale">{authorName(t.profile)}</span>
          {compact ? <span className="font-mono"> · {t.tag}</span> : null}
        </p>
        <p className="mt-3 flex flex-wrap gap-2 text-xs">
          {compact ? <span className="stat-pill bg-night-3 text-pale">{x.statuses[t.status]}</span> : null}
          <span className="stat-pill bg-night-3 text-pale">{x.deckModes[t.deck_mode]}</span>
          <span className="stat-pill bg-night-3 text-pale">{bestOfLabel(x, t.best_of)}</span>
          <span className="stat-pill border border-sky font-mono text-pale">
            {t.players ?? 0} {x.of} {t.size} {x.players}
          </span>
        </p>
      </div>
    </article>
  );
}
