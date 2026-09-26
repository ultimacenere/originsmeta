import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { listOrganizedTournaments } from "@/lib/community/creators";
import { featuredTournaments } from "@/lib/community/achievements";
import { readTournamentWinners } from "@/lib/community/achievementQueries";
import { creatorLabels } from "@/lib/creatorLabels";
import { achievementLabels } from "@/lib/achievementLabels";
import { TournamentCard } from "./TournamentCard";

/**
 * "Tornei organizzati" nella vetrina di un profilo su /u (pacchetto CREATOR, 26/09/2026; tornei in evidenza dal
 * 27/09/2026, pacchetto TRAGUARDI): i tornei pubblici che ha organizzato su OriginsMeta. Prima quelli aperti o in corso,
 * con la copertina (`TournamentCard` intera, il più vicino per primo), poi i finiti più recenti in forma compatta, con
 * chi li ha vinti (`featuredTournaments`, `readTournamentWinners`). Mai i privati (filtro esplicito in
 * `listOrganizedTournaments` e policy `can_view_tournament`), niente annullati. Nessun torneo: nessuna sezione.
 */
export async function CreatorTournaments({ organizerId, locale, dict }: { organizerId: string; locale: Locale; dict: Dictionary }) {
  const tournaments = await listOrganizedTournaments(organizerId);
  const { upcoming, finished } = featuredTournaments(tournaments);
  if (!upcoming.length && !finished.length) return null;
  const winners = await readTournamentWinners(finished.map((t) => t.id));
  const L = creatorLabels[locale].profile;
  const T = achievementLabels[locale].tournaments;
  return (
    <section className="mt-12">
      <h2 className="t-section">{L.organizedTitle}</h2>
      <p className="mt-2 text-sm text-chalk-muted">{T.intro}</p>
      {upcoming.length ? (
        <>
          <h3 className="kicker mt-5 text-mint">{T.upcoming}</h3>
          <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((t) => (
              <li key={t.id}>
                <TournamentCard t={t} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {finished.length ? (
        <>
          <h3 className="kicker mt-6 text-pale-muted">{T.finished}</h3>
          <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {finished.map((t) => {
              const winner = winners.get(t.id);
              const [before, after = ""] = T.wonBy.split("{name}");
              return (
                <li key={t.id} className="flex flex-col gap-2">
                  <TournamentCard t={t} locale={locale} dict={dict} compact />
                  {winner ? (
                    <p className="px-1 text-sm text-pale">
                      {/* la stella oro del campione, come nel tabellone (Bracket) */}
                      <span aria-hidden="true" className="text-gold">
                        ★
                      </span>{" "}
                      {before}
                      {winner.username ? (
                        <Link href={href(locale, `/u/${winner.username}`)} className="link-mint font-bold">
                          {winner.name}
                        </Link>
                      ) : (
                        <span className="font-bold">{winner.name}</span>
                      )}
                      {after}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
