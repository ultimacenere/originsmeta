"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { activeCards } from "@/lib/data/cards";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { COMMUNITY_TIER_LISTS_TAG } from "./decksByCard";
import { cleanTitle, decodeTierCode, encodeTierCode, rankedCount, TIER_KINDS, type TierKind } from "@/lib/tiercode";
import { boardEntries } from "./tierlists";
import { isUuid } from "./util";

/**
 * Tier list salvate nel profilo (23/09/2026, §1 punto 27.5 della KB: "mazzi e tier list create visibili nel
 * profilo di chi le ha create… tierlist una sola per utente").
 *
 * Una tier list per utente e per tipo (Leggendarie, carte base): salvarne un'altra sostituisce la propria, non
 * ne aggiunge una seconda — lo impone anche l'indice unico (owner, kind) dello schema. Chi non ha un account
 * continua a usare il tool come prima: salvataggio nel browser e link da condividere, senza registrarsi.
 *
 * Il server non si fida del codice che arriva: lo rilegge con `decodeTierCode` tenendo solo le carte attive del
 * tipo giusto, e riscrive lui il codice e le fasce salvate. Così nel database non può finire uno slug inventato,
 * e la vista `tier_card_scores` (la tier list della community) resta pulita.
 */

export type TierActionState = { error?: string; ok?: boolean; href?: string };

/** Slug ammessi per ogni scheda: le carte attive della Demo 2.0, Leggendarie da una parte e carte base dall'altra. */
function knownSlugs(): Record<TierKind, ReadonlySet<string>> {
  const playable = activeCards.filter((c) => c.type !== "token");
  return {
    legendaries: new Set(playable.filter((c) => c.legendary).map((c) => c.slug)),
    cards: new Set(playable.filter((c) => !c.legendary).map((c) => c.slug)),
  };
}

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/**
 * Pagine da rigenerare quando cambia una tier list salvata (salvata, nascosta, ripubblicata, eliminata). Dall'Ondata 2
 * anche il lastmod delle sitemap (/tier-list, /tier-list/community, /u/<nome>) e il punteggio della community sulle
 * schede carta (etichetta `community-tier-lists` di decksByCard.ts, profilo "max": la visita dopo riceve ancora la
 * scheda vecchia e ne fa partire una nuova); senza, si aggiornerebbero entro 5 minuti e entro un'ora.
 */
function revalidateTierPaths(username?: string | null) {
  for (const l of locales) {
    revalidatePath(`/${l}/tier-list/community`);
    revalidatePath(`/${l}/account`);
    if (username) revalidatePath(`/${l}/u/${username}`);
  }
  revalidateSitemaps();
  revalidateTag(COMMUNITY_TIER_LISTS_TAG, "max");
}

/**
 * Salva (o sostituisce) la tier list dell'utente per una scheda. Campi del modulo: `code` (TL1), `kind`,
 * `title` facoltativo, `locale`. Il tipo si legge dal codice, non dal campo: il codice porta già la sua lettera.
 */
export async function saveTierList(_prev: TierActionState, formData: FormData): Promise<TierActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(formData);
  const decoded = decodeTierCode(String(formData.get("code") ?? ""), knownSlugs());
  if (!decoded) return { error: "invalid" };
  const { kind, board } = decoded;
  if (!TIER_KINDS.includes(kind)) return { error: "invalid" };
  // una tier list senza nemmeno una carta in fascia non è una tier list: resterebbe una riga vuota nel profilo
  if (rankedCount(board) === 0) return { error: "empty" };
  const typed = cleanTitle(String(formData.get("title") ?? ""));
  const title = typed || cleanTitle(board.title);
  const row = { owner: user.id, kind, title, code: encodeTierCode(kind, { ...board, title }), entries: boardEntries(board) };

  // upsert sulla coppia (owner, kind): la propria tier list di quel tipo viene sostituita
  const { error } = await supabase.from("tier_lists").upsert(row, { onConflict: "owner,kind" });
  if (error) return { error: "db" };
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  revalidateTierPaths((profile as { username: string | null } | null)?.username);
  return { ok: true, href: `/${locale}/account#tierlists` };
}

/** Nasconde o ripubblica una tier list dell'utente (modulo nel profilo). */
export async function setTierListStatus(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "hidden" ? "hidden" : "published";
  if (isUuid(id)) {
    await supabase.from("tier_lists").update({ status }).eq("id", id).eq("owner", user.id);
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    revalidateTierPaths((profile as { username: string | null } | null)?.username);
  }
  redirect(`/${locale}/account#tierlists`);
}

/** Elimina una tier list dell'utente. */
export async function deleteTierList(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  if (isUuid(id)) {
    await supabase.from("tier_lists").delete().eq("id", id).eq("owner", user.id);
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    revalidateTierPaths((profile as { username: string | null } | null)?.username);
  }
  redirect(`/${locale}/account#tierlists`);
}
