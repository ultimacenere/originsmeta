"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { checkDeck } from "@/lib/community/util";
import { validateConquest, type DeckState } from "@/lib/deckrules";
import { newSlug, parseTournamentForm, splitCodes } from "./util";
import { decksRequired } from "./types";

/**
 * Server Action del Tournament Organizer. Creazione e cancellazione passano dalle policy RLS della
 * tabella `tournaments`; iscrizione, ritiro e consegna dei mazzi passano dalle RPC `security definer`
 * (lock sulla riga del torneo, controllo di stato e capienza): il codice qui valida l'input e traduce
 * gli errori in chiavi del dizionario (`tournaments.errors`).
 */

export type TournamentActionState = { error?: string; ok?: boolean; href?: string };

function revalidateTournamentPaths(slug?: string) {
  for (const l of locales) {
    revalidatePath(`/${l}/tournaments`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}/tournaments/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Le RPC segnalano gli errori con `raise exception 'codice'`: qui il codice diventa una chiave del dizionario. */
const RPC_ERRORS = ["not_logged_in", "not_found", "not_open", "already_joined", "full", "not_registered", "decks_count", "listing_not_allowed"];
function rpcError(e: { message?: string } | null | undefined): string {
  const m = e?.message ?? "";
  return RPC_ERRORS.find((k) => m.includes(k)) ?? "db";
}

const UUID = /^[0-9a-f-]{36}$/i;

async function organizerContext() {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" } as const;
  if (!user) return { error: "notLoggedIn" } as const;
  const { data } = await supabase.from("profiles").select("badge, role").eq("id", user.id).maybeSingle();
  return { supabase, user, profile: (data as { badge: string; role: string } | null) ?? null };
}

/** Crea un torneo (aperto alle iscrizioni). Restituisce il link della sua pagina. */
export async function createTournament(_prev: TournamentActionState, formData: FormData): Promise<TournamentActionState> {
  const ctx = await organizerContext();
  if ("error" in ctx) return { error: ctx.error };
  const locale = localeOf(formData);
  const parsed = parseTournamentForm(formData, { userId: ctx.user.id, profile: ctx.profile });
  if (!parsed.ok) return { error: parsed.error };
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = newSlug(parsed.row.name);
    const { data, error } = await ctx.supabase
      .from("tournaments")
      .insert({ ...parsed.row, slug, organizer: ctx.user.id })
      .select("slug")
      .single();
    if (!error && data) {
      const s = (data as { slug: string }).slug;
      revalidateTournamentPaths(s);
      return { ok: true, href: `/${locale}/tournaments/${s}` };
    }
    // 23505 = slug o tag già usati: si riprova con valori nuovi (il tag ha un default casuale nel database)
    if (error?.code === "23505") continue;
    return { error: error?.message.includes("listing_not_allowed") ? "listing" : "db" };
  }
  return { error: "db" };
}

/** Iscrizione dalla pagina del torneo (bottone client). */
export async function joinTournament(id: string, slug: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  if (!UUID.test(id)) return { error: "not_found" };
  const { error } = await supabase.rpc("join_tournament", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true };
}

/** Ritiro finché le iscrizioni sono aperte (cancella anche i mazzi consegnati). */
export async function leaveTournament(id: string, slug: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  if (!UUID.test(id)) return { error: "not_found" };
  const { error } = await supabase.rpc("leave_tournament", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true };
}

/**
 * Consegna dei mazzi: codici OriginsMeta (OM1…), uno per mazzo. Ogni mazzo è rivalidato contro il database
 * carte (`checkDeck`); nel Conquest si controllano anche Leggendarie diverse e carte diverse tra i mazzi.
 */
export async function submitDecks(_prev: TournamentActionState, formData: FormData): Promise<TournamentActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(formData);
  const id = String(formData.get("tournament_id") ?? "");
  if (!UUID.test(id)) return { error: "not_found" };
  const { data: t } = await supabase.from("tournaments").select("slug, status, deck_mode, conquest_decks, conquest_min_different").eq("id", id).maybeSingle();
  const tournament = t as { slug: string; status: string; deck_mode: "free" | "conquest"; conquest_decks: number; conquest_min_different: number } | null;
  if (!tournament) return { error: "not_found" };
  if (tournament.status !== "open") return { error: "not_open" };

  const required = decksRequired(tournament);
  const raw = splitCodes(String(formData.get("codes") ?? ""));
  if (raw.length !== required) return { error: "decks_count" };
  const decks: DeckState[] = [];
  const codes: string[] = [];
  for (const code of raw) {
    const decoded = decodeOmCode(code);
    if (!decoded) return { error: "decks_invalid" };
    const checked = checkDeck(decoded);
    if (!checked.ok) return { error: "decks_invalid" };
    const clean: DeckState = { name: decoded.name.slice(0, 60), legendary: checked.deck.legendary, cards: checked.deck.cards, customCards: checked.deck.customCards };
    decks.push(clean);
    codes.push(encodeOmCode(clean));
  }
  if (tournament.deck_mode === "conquest" && validateConquest(decks, tournament.conquest_min_different).length) return { error: "conquest_invalid" };

  const { error } = await supabase.rpc("submit_tournament_decks", { tid: id, codes });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(tournament.slug);
  return { ok: true, href: `/${locale}/tournaments/${tournament.slug}` };
}

/** Cancella un torneo ancora aperto (form nel profilo): le policy RLS bloccano i tornei altrui o già avviati. */
export async function deleteTournament(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  if (UUID.test(id)) {
    const { data } = await supabase.from("tournaments").delete().eq("id", id).select("slug").maybeSingle();
    revalidateTournamentPaths((data as { slug: string } | null)?.slug);
  }
  redirect(`/${locale}/account`);
}
