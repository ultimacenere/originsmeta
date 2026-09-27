import type { Db } from "@/lib/supabase/public";
import type { Profile } from "./types";
import { FOLLOW_MAX, followErrorCode, type FollowErrorCode } from "./follows";

/**
 * "Chi segui" (pacchetto SEGUI, 27/09/2026): i profili seguiti da un utente, per la sezione di /account (pagina privata
 * e dinamica, client con la sessione: la policy fa leggere a ciascuno solo i propri "segui"). Non lancia: un errore o la
 * migrazione non applicata diventano `{ ok: false }` e la sezione lo dice, il resto del profilo resta com'è.
 */

export type FollowedProfile = Profile & { id: string; since: string };

export type FollowingResult = { ok: true; data: FollowedProfile[] } | { ok: false; error: FollowErrorCode };

export async function listFollowing(client: Db, userId: string): Promise<FollowingResult> {
  const { data, error } = await client
    .from("follows")
    .select("followed, created_at, profile:profiles!follows_followed_fkey(id, username, display_name, avatar_url, badge)")
    .eq("follower", userId)
    .order("created_at", { ascending: false })
    .limit(FOLLOW_MAX);
  if (error) {
    const code = followErrorCode(error);
    if (code !== "unavailable") console.error("[follows] chi segui:", error.code ?? "", error.message);
    return { ok: false, error: code };
  }
  type Row = { followed: string; created_at: string; profile: (Profile & { id: string }) | null };
  const rows = (data ?? []) as unknown as Row[];
  return {
    ok: true,
    data: rows.flatMap((r) => (r.profile ? [{ ...r.profile, id: r.followed, since: r.created_at }] : [])),
  };
}
