import { formatDate, type Locale } from "@/lib/i18n";
import type { CommunityDeck } from "@/lib/community/types";
import { achievementLabels } from "@/lib/achievementLabels";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_LOOK,
  DECK_OF_MONTH_MIN_VOTES,
  WELL_RATED,
  earnedAchievements,
  fillAchievement,
  type Earned,
  type LocalFacts,
} from "@/lib/community/achievements";
import { readAchievementFacts, readPublicStats } from "@/lib/community/achievementQueries";
import { isShowcaseBadge } from "@/lib/community/badges";
import { GUIDE_MIN_WORDS, deckIndexable } from "@/lib/community/deckQuality";
import { countEntries } from "@/lib/community/tierlists";
import { AchievementMedals, type Medal } from "./AchievementMedals";

type TierListLike = { created_at: string; entries: Record<string, string[]> | null };

/** Il mese 'YYYY-MM' per esteso nella lingua della pagina ("settembre 2026"). */
function monthName(locale: Locale, month: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
}

/** Da un traguardo ottenuto alla medaglia da mostrare: testi, data e "×n" nella lingua della pagina. */
function toMedal(e: Earned, locale: Locale): Medal {
  const L = achievementLabels[locale].achievements;
  const look = ACHIEVEMENT_LOOK[e.id];
  const vars = {
    words: GUIDE_MIN_WORDS,
    votes: WELL_RATED.minVotes,
    avg: new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(WELL_RATED.minAvg),
    min: DECK_OF_MONTH_MIN_VOTES,
  };
  const meta: string[] = [];
  if (e.date) meta.push(fillAchievement(look.repeatable ? L.since : L.earnedOn, { date: formatDate(locale, e.date) }));
  if (look.repeatable && e.count > 1) meta.push(fillAchievement(L.times, { n: e.count }));
  if (e.months.length) meta.push(fillAchievement(L.months, { months: e.months.map((m) => monthName(locale, m)).join(", ") }));
  return {
    id: e.id,
    icon: look.icon,
    mark: look.mark,
    tone: look.tone,
    name: L.items[e.id].name,
    description: fillAchievement(L.items[e.id].description, vars),
    meta,
    times: look.repeatable && e.count > 1 ? `×${e.count}` : undefined,
  };
}

/**
 * Traguardi e numeri pubblici sul profilo /u (pacchetto TRAGUARDI, 27/09/2026), subito sotto la scheda del profilo.
 *
 * - Traguardi su OGNI profilo, solo quelli ottenuti: sulla vetrina (Creator, Autore, Pro, Staff) una sezione con titolo
 *   e medaglie grandi con il nome; sugli altri profili una fila più piccola. Nessun traguardo: niente sezione.
 * - "In numeri" solo sulla vetrina e solo se il profilo ha acceso "Mostra i numeri sulla vetrina" in /account
 *   (`profile_public_stats`): mazzi pubblicati, visite, copie del codice del gioco, voti ricevuti, con la nota "stime".
 *
 * Mazzi e tier list arrivano dalla pagina, che li ha già letti; tornei e "mazzo del mese" dalla funzione SQL
 * `profile_achievement_facts`. Se una delle due funzioni non c'è ancora o non risponde, la sua parte non compare.
 */
export async function ProfileHighlights({
  profileId,
  memberSince,
  badge,
  name,
  decks,
  tierLists,
  locale,
}: {
  profileId: string;
  memberSince: string | null;
  badge: string | null | undefined;
  name: string;
  decks: readonly CommunityDeck[];
  tierLists: readonly TierListLike[];
  locale: Locale;
}) {
  const showcase = isShowcaseBadge(badge);
  const [remote, stats] = await Promise.all([readAchievementFacts(profileId), showcase ? readPublicStats(profileId) : Promise.resolve(null)]);
  const local: LocalFacts = {
    memberSince,
    decks: decks.map((d) => ({ created_at: d.created_at, votes: d.rating?.votes ?? 0, avg: d.rating?.avg ?? 0, fullGuide: deckIndexable(d) })),
    tierLists: tierLists.map((t) => ({ created_at: t.created_at, ranked: countEntries(t.entries) })),
  };
  const earned = earnedAchievements(local, remote);
  const L = achievementLabels[locale];
  const medals = earned.map((e) => toMedal(e, locale));
  const counter = fillAchievement(L.achievements.count, { n: earned.length, total: ACHIEVEMENTS.length });
  const number = new Intl.NumberFormat(locale);

  return (
    <>
      {medals.length ? (
        showcase ? (
          <section className="mt-10" aria-labelledby="achievements-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="achievements-title" className="t-section">
                {L.achievements.title}
              </h2>
              <p className="font-mono text-xs text-pale-muted">{counter}</p>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.achievements.intro}</p>
            <div className="card-night mt-4 p-5">
              <AchievementMedals medals={medals} size="large" hint={L.achievements.hint} listLabel={fillAchievement(L.achievements.listOf, { name })} />
            </div>
          </section>
        ) : (
          <section className="mt-8" aria-labelledby="achievements-title">
            <h2 id="achievements-title" className="kicker text-pale-muted">
              {L.achievements.title} · <span className="font-mono">{counter}</span>
            </h2>
            <div className="mt-3">
              <AchievementMedals medals={medals} size="small" hint={L.achievements.hint} listLabel={fillAchievement(L.achievements.listOf, { name })} />
            </div>
          </section>
        )
      ) : null}

      {stats ? (
        <section className="mt-10" aria-labelledby="profile-stats-title">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="profile-stats-title" className="t-section">
              {L.stats.title}
            </h2>
            <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{L.stats.estimates}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [L.stats.decks, stats.decks],
                [L.stats.views, stats.views],
                [L.stats.codeCopies, stats.codeCopies],
                [L.stats.votes, stats.votes],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="card-night flex flex-col-reverse justify-end p-4">
                <dt className="mt-1 text-xs text-pale-muted">{label}</dt>
                <dd className="font-mono text-2xl font-bold text-sky">{number.format(value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 max-w-3xl text-xs text-pale-muted">
            {stats.since ? fillAchievement(L.stats.note, { name, date: formatDate(locale, stats.since) }) : fillAchievement(L.stats.noteNoDate, { name })}
          </p>
        </section>
      ) : null}
    </>
  );
}
