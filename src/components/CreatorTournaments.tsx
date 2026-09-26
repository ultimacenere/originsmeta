import type { Dictionary, Locale } from "@/lib/i18n";
import { listOrganizedTournaments } from "@/lib/community/creators";
import { creatorLabels } from "@/lib/creatorLabels";
import { TournamentCard } from "./TournamentCard";

/**
 * "Tornei organizzati" nella vetrina di un creator su /u/<nome> (pacchetto CREATOR, 26/09/2026): i tornei pubblici che
 * ha organizzato su OriginsMeta, con le schede di sempre (`TournamentCard`). Mai i privati (filtro esplicito in
 * `listOrganizedTournaments`), niente annullati. Nessun torneo: nessuna sezione.
 */
export async function CreatorTournaments({ organizerId, locale, dict }: { organizerId: string; locale: Locale; dict: Dictionary }) {
  const tournaments = await listOrganizedTournaments(organizerId);
  if (!tournaments.length) return null;
  const L = creatorLabels[locale].profile;
  return (
    <section className="mt-12">
      <h2 className="t-section">{L.organizedTitle}</h2>
      <p className="mt-2 text-sm text-chalk-muted">{L.organizedIntro}</p>
      <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {tournaments.map((t) => (
          <li key={t.id}>
            <TournamentCard t={t} locale={locale} dict={dict} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
