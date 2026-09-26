"use server";

import { currentUser } from "@/lib/supabase/server";
import { isUuid } from "./util";
import { alreadyFollowing, followErrorCode, parseFollowState, type FollowErrorCode, type FollowState } from "./follows";

/**
 * Server Action del tasto "Segui" (pacchetto SEGUI, 27/09/2026): pagina /u, scheda di un mazzo, elenco "Chi segui" di
 * /account. Scrive con la sessione di chi preme (policy "follows insert own" / "follows delete own" e trigger
 * `guard_follow` di supabase/wave2-SEGUI.sql: si seguono solo i profili vetrina, mai se stessi, al massimo 500), poi
 * rilegge lo stato con `follow_state` per il numero dei follower. Nessuna pagina da rigenerare: il tasto e il numero
 * si leggono nel browser, e /account è dinamica.
 *
 * Esito: `state` (stato nuovo; assente se la rilettura non riesce, e allora il tasto tiene il suo) oppure `error`.
 */
export type FollowResult = { state?: FollowState; error?: FollowErrorCode };

export async function setFollow(profileId: string, follow: boolean): Promise<FollowResult> {
  if (!isUuid(profileId) || typeof follow !== "boolean") return { error: "db" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "unavailable" };
  if (!user) return { error: "notLoggedIn" };
  if (user.id === profileId) return { error: "self" };
  if (follow) {
    const { error } = await supabase.from("follows").insert({ follower: user.id, followed: profileId });
    if (error && !alreadyFollowing(error)) return { error: followErrorCode(error) };
  } else {
    const { error } = await supabase.from("follows").delete().eq("follower", user.id).eq("followed", profileId);
    if (error) return { error: followErrorCode(error) };
  }
  const { data, error } = await supabase.rpc("follow_state", { p_profile: profileId });
  const state = error ? null : parseFollowState(data);
  return state ? { state } : {};
}
