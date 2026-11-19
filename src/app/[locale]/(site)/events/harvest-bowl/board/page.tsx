import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { HARVEST_BOWL, isHarvestTournament } from "@/lib/harvestBowl";
import { TOURNAMENT_SELECT } from "@/lib/tournament/queries";
import { listAnnouncements } from "@/lib/tournament/announcementQueries";
import { announcementLabels } from "@/lib/tournament/announcementLabels";
import { AnnouncementBoard } from "@/components/announcements/AnnouncementBoard";
import type { AnnouncementTarget } from "@/components/announcements/AnnouncementControls";

/*
  La bacheca degli annunci dell'Harvest Bowl per lo staff (19/11/2026): organizzatore (apix), arbitri e admin del sito
  scrivono un annuncio a tutti gli iscritti dei tornei dell'evento con un modulo solo. Dinamica (sessione di chi guarda) e
  noindex; chi non è staff legge gli annunci e un avviso. Il database decide chi può scrivere (tournament_announcement_post).
*/

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return { title: `${announcementLabels[locale].board.title} · Harvest Bowl`, robots: { index: false, follow: false } };
}

type Row = { id: string; slug: string; name: string; status: string; starts_at: string; profile: { username: string | null } | null };

export default async function HarvestBoardPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const L = announcementLabels[locale];
  const { supabase, user } = await currentUser();
  const eventHref = href(locale, HARVEST_BOWL.path);

  // con la sessione: anche i tornei dell'evento ancora privati, se chi guarda li può vedere
  const res = supabase
    ? await supabase.from("tournaments").select(TOURNAMENT_SELECT).like("slug", `${HARVEST_BOWL.tournamentPrefix}%`).neq("status", "cancelled").order("starts_at", { ascending: true }).limit(10)
    : null;
  const rows = ((res?.data ?? []) as unknown as Row[]).filter((t) => isHarvestTournament(t));
  const tournaments = rows.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));
  // di quali tornei chi guarda è staff (organizzatore, arbitro, admin): stessa funzione delle policy
  const staffOf = supabase && user ? await Promise.all(rows.map(async (t) => (await supabase.rpc("is_tournament_staff", { tid: t.id })).data === true)) : rows.map(() => false);
  const staff: AnnouncementTarget[] = rows.filter((_, i) => staffOf[i]).map((t) => ({ id: t.id, slug: t.slug, name: t.name, checked: t.status !== "finished" }));
  const result = await listAnnouncements(supabase, tournaments.map((t) => t.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs text-pale-muted">
        <Link href={eventHref} className="hover:text-mint">
          ← {L.board.back}
        </Link>
      </p>
      <h1 className="t-page mt-3">{L.board.title}</h1>
      <p className="mt-3 text-chalk-muted">{L.board.intro}</p>
      {!user ? (
        <p className="mt-4">
          <Link href={`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, `${HARVEST_BOWL.path}/board`))}`} className="btn btn-primary text-sm">
            {L.board.signIn}
          </Link>
        </p>
      ) : !staff.length ? (
        <p className="mt-4 rounded-lg border border-sky p-3 text-sm text-pale">{L.board.notStaff}</p>
      ) : null}
      {res?.error ? <p className="mt-4 text-sm text-bad">{L.board.noTournaments}</p> : null}
      <div className="mt-6">
        <AnnouncementBoard locale={locale} result={result} tournaments={tournaments} staff={staff.length ? staff : null} showFor composerOpen headingLevel={2} />
      </div>
    </div>
  );
}
