import type { Db } from "@/lib/supabase/public";
import type { Profile } from "@/lib/community/types";
import { ANNOUNCEMENTS_SHOWN, ANNOUNCEMENT_COLUMNS, announcementErrorCode, sortAnnouncements, toAnnouncement, type Announcement } from "./announcements";

/**
 * Letture degli annunci dei tornei (19/11/2026). Con il client anonimo (pagina dell'evento, ISR) si vedono gli annunci dei
 * tornei pubblici; con il client della sessione (scheda del torneo, dinamica) anche quelli dei tornei privati che chi guarda
 * può vedere (policy `announcements read with tournament`). Non lanciano mai: prima della migrazione rispondono
 * `unavailable` e la bacheca lo dice allo staff, ai giocatori non mostra niente.
 */

export type AnnouncementAuthor = Pick<Profile, "username" | "display_name" | "avatar_url" | "badge">;
export type AnnouncementItem = Announcement & { authorProfile: AnnouncementAuthor | null };
export type AnnouncementsResult = { ok: true; items: AnnouncementItem[] } | { ok: false; error: "unavailable" | "generic" };

/** Gli annunci rivolti ad almeno uno dei tornei `tids`, in evidenza prima e poi dal più recente. */
export async function listAnnouncements(client: Db | null, tids: readonly string[]): Promise<AnnouncementsResult> {
  if (!client || tids.length === 0) return { ok: true, items: [] };
  const res = await client
    .from("tournament_announcements")
    .select(`${ANNOUNCEMENT_COLUMNS}, profile:profiles!tournament_announcements_author_fkey(username, display_name, avatar_url, badge)`)
    .overlaps("tournament_ids", [...tids])
    .order("created_at", { ascending: false })
    .limit(ANNOUNCEMENTS_SHOWN);
  if (res.error) {
    const code = announcementErrorCode(res.error);
    if (code !== "unavailable") console.error("[announcements] lettura:", res.error.code ?? "", res.error.message);
    return { ok: false, error: code === "unavailable" ? "unavailable" : "generic" };
  }
  const rows = (res.data ?? []) as unknown as (Record<string, unknown> & { profile?: AnnouncementAuthor | null })[];
  const items = rows.flatMap((r) => {
    const a = toAnnouncement(r);
    return a ? [{ ...a, authorProfile: r.profile ?? null }] : [];
  });
  return { ok: true, items: sortAnnouncements(items) };
}
