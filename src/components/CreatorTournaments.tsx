import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { safeCover } from "@/lib/community/achievements";
import { readFeaturedTournaments } from "@/lib/community/achievementQueries";
import { COVER_PRESETS, DEFAULT_COVER, type Tournament } from "@/lib/tournament/types";
import { coverPublicUrl } from "@/lib/tournament/util";
import { creatorLabels } from "@/lib/creatorLabels";
import { achievementLabels } from "@/lib/achievementLabels";
import { TournamentCard } from "./TournamentCard";

/** La copertina solo se è del media kit o caricata dall'organizzatore nella sua cartella (`safeCover`). */
function withSafeCover(t: Tournament): Tournament {
  return { ...t, cover_url: safeCover(t.cover_url, COVER_PRESETS, coverPublicUrl(`${t.organizer}/`), DEFAULT_COVER) };
}

/**
 * "Tornei organizzati" nella vetrina di un profilo su /u (pacchetto CREATOR, 26/09/2026; tornei in evidenza dal
 * 27/09/2026, pacchetto TRAGUARDI): i tornei pubblici che ha organizzato su OriginsMeta. Prima quelli in corso e in
 * arrivo, con la copertina (`TournamentCard` intera, il più vicino per primo; gli aperti rimasti indietro di più di una
 * settimana no), poi i finiti più recenti in forma compatta, con chi li ha vinti: solo quelli con una finale giocata e
 * senza i bot di prova (`readFeaturedTournaments`). Mai i privati né gli annullati. Nessun torneo: nessuna sezione.
 * I due gruppi hanno un'etichetta, non un titolo: il nome di ogni torneo nella scheda è già un `<h3>`.
 */
export async function CreatorTournaments({ organizerId, locale, dict }: { organizerId: string; locale: Locale; dict: Dictionary }) {
  const { upcoming, finished, winners } = await readFeaturedTournaments(organizerId);
  if (!upcoming.length && !finished.length) return null;
  const L = creatorLabels[locale].profile;
  const T = achievementLabels[locale].tournaments;
  const [before, after = ""] = T.wonBy.split("{name}");
  return (
    <section className="mt-12" aria-labelledby="organized-title">
      <h2 id="organized-title" className="t-section">
        {L.organizedTitle}
      </h2>
      <p className="mt-2 text-sm text-chalk-muted">{T.intro}</p>
      {upcoming.length ? (
        <>
          <p id="organized-upcoming" className="kicker mt-5 text-mint">
            {T.upcoming}
          </p>
          <ul aria-labelledby="organized-upcoming" className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((t) => (
              <li key={t.id}>
                <TournamentCard t={withSafeCover(t)} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {finished.length ? (
        <>
          <p id="organized-finished" className="kicker mt-6 text-pale-muted">
            {T.finished}
          </p>
          <ul aria-labelledby="organized-finished" className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {finished.map((t) => {
              const winner = winners.get(t.id);
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
