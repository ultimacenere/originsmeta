"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { HARVEST_BOWL } from "@/lib/harvestBowl";
import { announcementErrorCode, parseAnnouncementInput, type AnnouncementError } from "./announcements";

/**
 * Server Action della bacheca degli annunci (19/11/2026). Il sito controlla la forma (`parseAnnouncementInput`), il
 * database tutto il resto: chi è staff di quali tornei, i limiti, il tetto di 20 annunci l'ora, gli avvisi agli iscritti
 * (funzioni `tournament_announcement_*`, security definer; la tabella non si scrive direttamente). Gli errori tornano come
 * codici di `ANNOUNCEMENT_ERRORS`, che la bacheca traduce.
 *
 * Dopo ogni scrittura si rigenera la pagina dell'evento in tutte le lingue (ISR); le schede dei tornei sono dinamiche.
 */

export type AnnouncementActionState = { ok?: boolean; error?: AnnouncementError; recipients?: number; at?: number };

function revalidateEvent(slugs: string[]) {
  for (const l of locales) {
    revalidatePath(`/${l}${HARVEST_BOWL.path}`);
    revalidatePath(`/${l}${HARVEST_BOWL.path}/board`);
    for (const s of slugs) if (/^[a-z0-9-]{1,90}$/.test(s)) revalidatePath(`/${l}/tournaments/${s}`);
  }
}

function slugsOf(fd: FormData): string[] {
  return fd.getAll("slug").map((v) => String(v)).slice(0, 8);
}

function inputOf(fd: FormData) {
  return parseAnnouncementInput({
    title: fd.get("title"),
    body: fd.get("body"),
    link: fd.get("link"),
    pinned: fd.get("pinned"),
    tournamentIds: fd.getAll("tid"),
  });
}

/** Pubblica un annuncio e manda l'avviso agli iscritti dei tornei scelti. */
export async function postAnnouncement(_prev: AnnouncementActionState, fd: FormData): Promise<AnnouncementActionState> {
  const input = inputOf(fd);
  if (!input) return { error: "invalid", at: Date.now() };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { error: "not_logged_in", at: Date.now() };
  const { data, error } = await supabase.rpc("tournament_announcement_post", {
    p_tids: input.tournamentIds,
    p_title: input.title,
    p_body: input.body,
    p_link: input.link,
    p_pinned: input.pinned,
  });
  if (error) {
    const code = announcementErrorCode(error);
    if (code === "generic") console.error("[announcements] pubblicazione:", error.code ?? "", error.message);
    return { error: code, at: Date.now() };
  }
  revalidateEvent(slugsOf(fd));
  const recipients = Number((data as { recipients?: unknown } | null)?.recipients ?? 0);
  return { ok: true, recipients: Number.isFinite(recipients) ? recipients : 0, at: Date.now() };
}

/** Corregge un annuncio (nessun nuovo avviso). I tornei a cui è rivolto non cambiano. */
export async function editAnnouncement(_prev: AnnouncementActionState, fd: FormData): Promise<AnnouncementActionState> {
  const id = Number(fd.get("id"));
  // i tornei non si cambiano: il controllo della forma vuole almeno un torneo, qui basta un segnaposto
  const input = parseAnnouncementInput({ title: fd.get("title"), body: fd.get("body"), link: fd.get("link"), pinned: fd.get("pinned"), tournamentIds: ["00000000-0000-0000-0000-000000000000"] });
  if (!Number.isSafeInteger(id) || id < 1 || !input) return { error: "invalid", at: Date.now() };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { error: "not_logged_in", at: Date.now() };
  const { error } = await supabase.rpc("tournament_announcement_edit", { p_id: id, p_title: input.title, p_body: input.body, p_link: input.link, p_pinned: input.pinned });
  if (error) {
    const code = announcementErrorCode(error);
    if (code === "generic") console.error("[announcements] modifica:", error.code ?? "", error.message);
    return { error: code, at: Date.now() };
  }
  revalidateEvent(slugsOf(fd));
  return { ok: true, at: Date.now() };
}

/** Cancella un annuncio e gli avvisi non ancora letti. */
export async function deleteAnnouncement(_prev: AnnouncementActionState, fd: FormData): Promise<AnnouncementActionState> {
  const id = Number(fd.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return { error: "invalid", at: Date.now() };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { error: "not_logged_in", at: Date.now() };
  const { error } = await supabase.rpc("tournament_announcement_delete", { p_id: id });
  if (error) {
    const code = announcementErrorCode(error);
    if (code === "generic") console.error("[announcements] cancellazione:", error.code ?? "", error.message);
    return { error: code, at: Date.now() };
  }
  revalidateEvent(slugsOf(fd));
  return { ok: true, at: Date.now() };
}
