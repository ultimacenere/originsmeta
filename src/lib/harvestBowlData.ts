import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";
import type { Profile } from "@/lib/community/types";
import { TOURNAMENT_SELECT } from "@/lib/tournament/queries";
import { listAnnouncements, type AnnouncementsResult } from "@/lib/tournament/announcementQueries";
import { HARVEST_BOWL, isHarvestTournament, stageOf, type HarvestStageKey } from "./harvestBowl";

/**
 * Le letture della pagina dell'Harvest Bowl (19/11/2026), anonime e dentro `unstable_cache`: il giorno del torneo la
 * pagina la aprono in tanti insieme, e la scheda del torneo (dinamica, ~11 letture a visita) non è fatta per questo.
 * Qui le letture sono al massimo una ogni `HARVEST_REVALIDATE` secondi per tutte le lingue (la voce è una sola), più le
 * rigenerazioni su richiesta dopo ogni annuncio (announcementActions.ts). Dentro `unstable_cache` la fetch a 60 secondi di
 * `supabasePublic()` non abbassa la scadenza della pagina (trappola del 14/11/2026, KB).
 *
 * Non lancia: con il database giù la pagina esce con i soli fatti fissi (orari, formato, premi) e senza numeri.
 */

export const HARVEST_REVALIDATE = 120;
/** DA AGGIORNARE (v2…) quando cambia la forma dei dati restituiti. */
const KEY = "harvest-bowl-page-v1";

export type HarvestTournament = {
  id: string;
  slug: string;
  tag: string;
  name: string;
  startsAt: string;
  status: "open" | "running" | "finished" | "cancelled";
  size: number;
  registered: number;
  waitlist: number;
  stage: HarvestStageKey;
  coverUrl: string | null;
  organizer: Profile | null;
  judges: Profile[];
};

export type HarvestData = { ok: boolean; tournaments: HarvestTournament[]; announcements: AnnouncementsResult; readAt: string };

type Raw = { id: string; slug: string; tag: string; name: string; starts_at: string; status: HarvestTournament["status"]; size: number; cover_url: string | null; profile: (Profile & { role?: string | null }) | null };

async function count(tid: string, status: "registered" | "waitlist"): Promise<number> {
  const client = supabasePublic();
  if (!client) return 0;
  const { count: n, error } = await client.from("tournament_players").select("user_id", { count: "exact", head: true }).eq("tournament_id", tid).eq("status", status);
  if (error) console.error("[harvest-bowl] iscritti:", error.message);
  return typeof n === "number" ? n : 0;
}

/** I tornei dell'evento (anche quelli già finiti), in ordine di inizio. Lancia con un errore di lettura. */
export async function readHarvestTournaments(): Promise<HarvestTournament[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await client.from("tournaments").select(TOURNAMENT_SELECT).like("slug", `${HARVEST_BOWL.tournamentPrefix}%`).eq("visibility", "public").neq("status", "cancelled").order("starts_at", { ascending: true }).limit(10);
  if (error) throw new Error(`harvest-bowl tornei: ${error.message}`);
  const rows = ((data ?? []) as unknown as Raw[]).filter((t) => isHarvestTournament(t));
  const ids = rows.map((t) => t.id);
  const [counts, judges] = await Promise.all([
    Promise.all(rows.map(async (t) => [await count(t.id, "registered"), await count(t.id, "waitlist")] as const)),
    ids.length
      ? client.from("tournament_judges").select("tournament_id, created_at, profile:profiles!tournament_judges_user_id_fkey(username, display_name, avatar_url, badge)").in("tournament_id", ids).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (judges.error) console.error("[harvest-bowl] arbitri:", judges.error.message);
  const byT = new Map<string, Profile[]>();
  for (const j of (judges.data ?? []) as unknown as { tournament_id: string; profile: Profile | null }[]) {
    if (!j.profile) continue;
    byT.set(j.tournament_id, [...(byT.get(j.tournament_id) ?? []), j.profile]);
  }
  return rows.map((t, i) => ({
    id: t.id,
    slug: t.slug,
    tag: t.tag,
    name: t.name,
    startsAt: t.starts_at,
    status: t.status,
    size: t.size,
    registered: counts[i][0],
    waitlist: counts[i][1],
    stage: stageOf(t.slug),
    coverUrl: t.cover_url,
    organizer: t.profile ? { username: t.profile.username, display_name: t.profile.display_name, avatar_url: t.profile.avatar_url, badge: t.profile.badge } : null,
    judges: byT.get(t.id) ?? [],
  }));
}

const cached = unstable_cache(
  async (): Promise<HarvestData> => {
    const readAt = new Date().toISOString();
    try {
      const tournaments = await readHarvestTournaments();
      const announcements = await listAnnouncements(supabasePublic(), tournaments.map((t) => t.id));
      return { ok: true, tournaments, announcements, readAt };
    } catch (e) {
      console.error("[harvest-bowl]", e instanceof Error ? e.message : e);
      return { ok: false, tournaments: [], announcements: { ok: false, error: "generic" }, readAt };
    }
  },
  [KEY],
  { revalidate: HARVEST_REVALIDATE, tags: ["harvest-bowl"] },
);

/** Tornei, numeri e annunci della pagina dell'evento (una voce di cache per tutte le lingue). */
export function harvestPageData(): Promise<HarvestData> {
  return cached();
}
