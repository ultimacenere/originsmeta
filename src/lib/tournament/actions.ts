"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { checkDeck } from "@/lib/community/util";
import { validateConquest, type DeckState } from "@/lib/deckrules";
import { isMissingColumn, newSlug, parseTournamentForm, splitCodes, usesStageOptions, withoutQualifierOff, withoutStageOptions } from "./util";
import { decksRequired } from "./types";
import { notifyIfStarted, notifyMatchResult, notifyTournamentCreated, notifyTournamentFinished } from "./notify";
import { STAGE_RPC_ERRORS } from "./stageLabels";
import { FORMAT_RPC_ERRORS } from "./formatLabels";
import { sideboardProblem, swapsProblem, type SideSwap } from "./formats";
import { getCard } from "@/lib/data/cards";

/**
 * Server Action del Tournament Organizer. Creazione e cancellazione passano dalle policy RLS della
 * tabella `tournaments`; iscrizione, ritiro e consegna dei mazzi passano dalle RPC `security definer`
 * (lock sulla riga del torneo, controllo di stato e capienza): il codice qui valida l'input e traduce
 * gli errori in chiavi del dizionario (`tournaments.errors`).
 *
 * Notifiche (UX-8): dopo iscrizione, consegna dei mazzi e avvio, dopo un risultato confermato e dopo la
 * chiusura, `./notify` manda un messaggio al canale Discord del sito se DISCORD_WEBHOOK_URL è impostata.
 * Le chiamate non aspettano Discord (lavoro rimandato con after()) e non lanciano mai eccezioni.
 */

export type TournamentActionState = { error?: string; ok?: boolean; href?: string };

function revalidateTournamentPaths(slug?: string) {
  for (const l of locales) {
    revalidatePath(`/${l}/tournaments`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}/tournaments/${slug}`);
  }
  // l'indice e tutte le sitemap divise (Ondata 2): revalidatePath("/sitemap.xml") rinfrescava solo l'indice
  revalidateSitemaps();
}

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Le RPC segnalano gli errori con `raise exception 'codice'`: qui il codice diventa una chiave del dizionario. */
const RPC_ERRORS = [
  "not_logged_in",
  "not_found",
  "not_open",
  "already_joined",
  "full",
  "not_registered",
  "decks_count",
  "listing_not_allowed",
  "forbidden",
  "not_running",
  "too_few_players",
  "too_many_players",
  "bad_seeding",
  "already_started",
  "not_pending",
  "bad_swap",
  "not_ready",
  "already_confirmed",
  "bad_score",
  "next_match_started",
  "no_opponent_yet",
  "final_not_played",
  "empty_message",
  "too_many_messages",
  "invite_required",
  "bad_invite",
  "user_not_found",
  "private_not_listed",
  // 05/10/2026, blocco TORNEO CRIMSON
  "checkin_off",
  "checkin_not_open",
  "checkin_closed",
  "checkin_still_open",
  "decks_missing",
  "decks_closed",
  "no_show_off",
  "no_show_too_early",
  "opponent_present",
  "already_staff",
  "judge_is_player",
  "too_many_judges",
  // 08/11/2026, blocco BRACKET E TOP CUT: fase finale in pausa e ban dei mazzi
  ...STAGE_RPC_ERRORS,
  // 09/11/2026, blocco SVIZZERA, GIRONI E SIDEBOARD (dopo gli altri: "bad_side_swap" non contiene "bad_swap")
  ...FORMAT_RPC_ERRORS,
];
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
    // 05/10/2026: niente .select() sull'insert. Con "insert … returning" Postgres controlla la riga nuova anche con la
    // policy di lettura (can_view_tournament), che dentro la stessa istruzione non la vede ancora: l'inserimento veniva
    // rifiutato ("new row violates row-level security policy", provato su PGlite). Si inserisce e poi si rilegge.
    const row = { ...parsed.row, slug, organizer: ctx.user.id };
    let { error } = await ctx.supabase.from("tournaments").insert(row);
    // database senza il blocco QUALIFICAZIONE SENZA FASE FINALE (11/11/2026): una doppia eliminazione con la fase finale si crea lo stesso
    const plain = error && isMissingColumn(error) ? withoutQualifierOff(row) : null;
    if (plain) ({ error } = await ctx.supabase.from("tournaments").insert(plain));
    // database non ancora migrato (blocco BRACKET E TOP CUT, 08/11/2026): un torneo che non usa le opzioni nuove si crea lo stesso
    if (error && isMissingColumn(error) && !usesStageOptions(row)) ({ error } = await ctx.supabase.from("tournaments").insert(withoutStageOptions(row)));
    const { data } = error ? { data: null } : await ctx.supabase.from("tournaments").select("id, slug").eq("slug", slug).maybeSingle();
    if (!error && data) {
      const { id, slug: s } = data as { id: string; slug: string };
      revalidateTournamentPaths(s);
      // in diretta nel canale dei tornei del nostro Discord, solo se il torneo è pubblico
      notifyTournamentCreated(id);
      // ?new=1: la scheda apre in cima il pannello "Torneo creato" con il link da incollare su Discord (UX-9)
      return { ok: true, href: `/${locale}/tournaments/${s}?new=1` };
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
  // la RPC riesce solo su un torneo "open": se ora è "running", l'ultima iscrizione ha fatto partire il tabellone
  notifyIfStarted(id, "open");
  return { ok: true };
}

/** Ritiro finché le iscrizioni sono aperte (cancella anche i mazzi consegnati). */
export async function leaveTournament(id: string, slug: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  if (!UUID.test(id)) return { error: "not_found" };
  const { data: before } = await supabase.from("tournaments").select("status").eq("id", id).maybeSingle();
  const { error } = await supabase.rpc("leave_tournament", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  // a torneo in corso è un ritiro vero: la partita persa a tavolino va su Discord come le altre
  if ((before as { status: string } | null)?.status === "running") await notifyDropResult(supabase, id, user.id);
  return { ok: true };
}

/**
 * Consegna dei mazzi: codici OriginsMeta (OM1…), uno per mazzo. Ogni mazzo è rivalidato contro il database
 * carte (`checkDeck`); nel Conquest si controllano anche Leggendarie diverse e carte diverse tra i mazzi.
 */
async function storeDecks(id: string, raw: string[]): Promise<{ error?: string; slug?: string }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  if (!UUID.test(id)) return { error: "not_found" };
  const { data: t } = await supabase.from("tournaments").select("slug, status, deck_mode, conquest_decks, conquest_min_different").eq("id", id).maybeSingle();
  const tournament = t as { slug: string; status: string; deck_mode: "free" | "conquest"; conquest_decks: number; conquest_min_different: number } | null;
  if (!tournament) return { error: "not_found" };
  if (tournament.status !== "open") return { error: "not_open" };

  const required = decksRequired(tournament);
  if (raw.length !== required) return { error: "decks_count" };
  const decks: DeckState[] = [];
  const codes: string[] = [];
  for (const code of raw) {
    const decoded = decodeOmCode(code);
    if (!decoded) return { error: "decks_invalid" };
    const checked = checkDeck(decoded);
    if (!checked.ok) return { error: "decks_invalid" };
    // le carte inventate del deck builder vanno bene nei mazzi della community, mai in un torneo (05/10/2026)
    if (checked.deck.customCards.length) return { error: "decks_custom" };
    const clean: DeckState = { name: decoded.name.slice(0, 60), legendary: checked.deck.legendary, cards: checked.deck.cards, customCards: checked.deck.customCards };
    decks.push(clean);
    codes.push(encodeOmCode(clean));
  }
  if (tournament.deck_mode === "conquest" && validateConquest(decks, tournament.conquest_min_different).length) return { error: "conquest_invalid" };

  const { error } = await supabase.rpc("submit_tournament_decks", { tid: id, codes });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(tournament.slug);
  // stato di prima letto sopra ("open"): se dopo la consegna il torneo è "running", è scattato tm_autostart
  notifyIfStarted(id, tournament.status);
  return { slug: tournament.slug };
}

/** Consegna dal modulo con i codici incollati (fase 1). */
export async function submitDecks(_prev: TournamentActionState, formData: FormData): Promise<TournamentActionState> {
  const locale = localeOf(formData);
  const r = await storeDecks(String(formData.get("tournament_id") ?? ""), splitCodes(String(formData.get("codes") ?? "")));
  if (r.error) return { error: r.error };
  return { ok: true, href: `/${locale}/tournaments/${r.slug}` };
}

/** Consegna dal deck builder dedicato al torneo (fase 4): riceve i codici già pronti. */
export async function submitDeckCodes(tournamentId: string, codes: string[]): Promise<Simple> {
  if (!Array.isArray(codes) || codes.some((c) => typeof c !== "string" || c.length > 4000)) return { error: "decks_invalid" };
  const r = await storeDecks(tournamentId, codes.map((c) => c.trim()).filter(Boolean));
  return r.error ? { error: r.error } : { ok: true };
}

/* ---------- fase 2: gestione del torneo (organizzatore o admin; controlli e lock dentro le RPC) ---------- */

type Simple = { error?: string; ok?: boolean };
type Client = NonNullable<Awaited<ReturnType<typeof currentUser>>["supabase"]>;

async function organizerRpc(slug: string, call: (sb: Client) => PromiseLike<{ error: { message?: string } | null }>): Promise<Simple> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { error } = await call(supabase);
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true };
}

/** Avvio con l'ordine dei seed deciso dall'organizzatore (casuale o manuale): la RPC crea il tabellone con i bye. */
export async function startTournament(id: string, slug: string, seeded: string[]): Promise<Simple> {
  if (!UUID.test(id) || !Array.isArray(seeded) || seeded.some((s) => !UUID.test(s))) return { error: "bad_seeding" };
  const r = await organizerRpc(slug, (sb) => sb.rpc("start_tournament", { tid: id, seeded }));
  // start_tournament accetta solo tornei "open": se è riuscita, il tabellone è appena partito
  if (r.ok) notifyIfStarted(id, "open");
  return r;
}

export async function swapPlayers(id: string, slug: string, u1: string, u2: string): Promise<Simple> {
  if (!UUID.test(id) || !UUID.test(u1) || !UUID.test(u2)) return { error: "bad_swap" };
  return organizerRpc(slug, (sb) => sb.rpc("swap_players", { tid: id, u1, u2 }));
}

export async function setMatchResult(matchId: string, slug: string, a: number, b: number, forfeit: boolean): Promise<Simple> {
  if (!UUID.test(matchId) || !Number.isInteger(a) || !Number.isInteger(b)) return { error: "bad_score" };
  const r = await organizerRpc(slug, (sb) => sb.rpc("set_match_result", { mid: matchId, a, b, forfeit: Boolean(forfeit) }));
  if (r.ok) notifyMatchResult(matchId);
  return r;
}

/** Referto di un giocatore (fase 3): il secondo referto uguale conferma, diverso contesta. */
export async function reportMatchResult(matchId: string, slug: string, a: number, b: number): Promise<Simple> {
  if (!UUID.test(matchId) || !Number.isInteger(a) || !Number.isInteger(b)) return { error: "bad_score" };
  const r = await organizerRpc(slug, (sb) => sb.rpc("report_match_result", { mid: matchId, a, b }));
  // notify rilegge la partita e annuncia solo se è "confirmed" (il primo referto la lascia "reported")
  if (r.ok) notifyMatchResult(matchId);
  return r;
}

/** Messaggio nella chat della partita (fase 3): solo le parti, 500 caratteri, 20 al minuto (controlli nella RPC). Non rigenera pagine. */
export async function sendMessage(matchId: string, body: string): Promise<Simple> {
  if (!UUID.test(matchId)) return { error: "not_found" };
  const clean = String(body ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
  if (!clean) return { error: "empty_message" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { error } = await supabase.rpc("send_message", { mid: matchId, body: clean });
  if (error) return { error: rpcError(error) };
  return { ok: true };
}

/* ---------- tornei privati a invito ---------- */

/** Invito per nome utente (organizzatore o admin): l'invitato vede il torneo privato e può iscriversi. */
export async function invitePlayer(id: string, slug: string, username: string): Promise<Simple> {
  if (!UUID.test(id)) return { error: "not_found" };
  const uname = String(username ?? "")
    .trim()
    .replace(/^@/, "")
    .slice(0, 60);
  if (!uname) return { error: "user_not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("invite_player", { tid: id, uname }));
}

export async function revokeInvite(id: string, slug: string, uid: string): Promise<Simple> {
  if (!UUID.test(id) || !UUID.test(uid)) return { error: "not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("revoke_invite", { tid: id, uid }));
}

/** Nuovo link d'invito: il precedente smette di funzionare. */
export async function rotateInviteCode(id: string, slug: string): Promise<Simple & { code?: string }> {
  if (!UUID.test(id)) return { error: "not_found" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { data, error } = await supabase.rpc("rotate_invite_code", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true, code: typeof data === "string" ? data : undefined };
}

export async function dropPlayer(id: string, slug: string, uid: string): Promise<Simple> {
  if (!UUID.test(id) || !UUID.test(uid)) return { error: "not_found" };
  const r = await organizerRpc(slug, (sb) => sb.rpc("drop_player", { tid: id, uid }));
  if (r.ok) {
    const { supabase } = await currentUser();
    if (supabase) await notifyDropResult(supabase, id, uid);
  }
  return r;
}

/** Dopo un ritiro a torneo in corso: annuncia la partita persa a tavolino (se c'era già l'avversario). */
async function notifyDropResult(sb: Client, tid: string, uid: string): Promise<void> {
  const { data } = await sb
    .from("tournament_matches")
    .select("id")
    .eq("tournament_id", tid)
    .eq("note", "drop")
    .or(`player_a.eq.${uid},player_b.eq.${uid}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const mid = (data as { id: string } | null)?.id;
  if (mid) notifyMatchResult(mid);
}

/* ---------- 05/10/2026: check-in, presenza, tavolino, arbitri (blocco TORNEO CRIMSON di schema.sql) ---------- */

/** Check-in del giocatore (dalle 2 ore prima; gli iscritti fino a 5 minuti prima, la lista d'attesa fino all'avvio). */
export async function checkIn(id: string, slug: string): Promise<Simple> {
  if (!UUID.test(id)) return { error: "not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("check_in", { tid: id }));
}

/** Check-in fatto (o tolto) dallo staff per un giocatore, a qualsiasi ora prima dell'avvio. */
export async function staffCheckIn(id: string, slug: string, uid: string, undo = false): Promise<Simple> {
  if (!UUID.test(id) || !UUID.test(uid)) return { error: "not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("staff_check_in", { tid: id, uid, undo: Boolean(undo) }));
}

/**
 * Chi gioca ha aperto la stanza partita: da qui risulta presente (conta per la vittoria a tavolino). La chiama il browser
 * quando la stanza si apre davvero, mai il server durante il rendering (un prefetch segnerebbe presente chi non c'è).
 */
export async function markMatchSeen(matchId: string): Promise<{ ok: boolean }> {
  if (!UUID.test(matchId)) return { ok: false };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false };
  const { data, error } = await supabase.rpc("mark_match_seen", { mid: matchId });
  return { ok: !error && data === true };
}

/** Vittoria a tavolino: passato il tempo di assenza, se l'avversario non è mai entrato nella stanza. */
export async function claimNoShow(matchId: string, slug: string): Promise<Simple> {
  if (!UUID.test(matchId)) return { error: "not_found" };
  const r = await organizerRpc(slug, (sb) => sb.rpc("claim_no_show", { mid: matchId }));
  if (r.ok) notifyMatchResult(matchId);
  return r;
}

/* ---------- 08/11/2026: ban dei mazzi e avvio della fase finale (blocco BRACKET E TOP CUT di schema.sql) ---------- */

/** Ban del mazzo numero `idx` (da 0) dell'avversario: si cambia finché l'avversario non ha bannato. Non rigenera pagine. */
export async function banDeck(matchId: string, idx: number): Promise<Simple> {
  if (!UUID.test(matchId) || !Number.isInteger(idx) || idx < 0 || idx > 3) return { error: "bad_ban" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { error } = await supabase.rpc("ban_deck", { mid: matchId, idx });
  if (error) return { error: rpcError(error) };
  return { ok: true };
}

/** Avvio della fase finale in pausa (staff): le sue partite con i due giocatori diventano pronte, con l'avviso. */
export async function releaseTopCut(id: string, slug: string): Promise<Simple & { count?: number }> {
  if (!UUID.test(id)) return { error: "not_found" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { data, error } = await supabase.rpc("release_top_cut", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true, count: typeof data === "number" ? data : undefined };
}

/** Arbitro per nome utente (solo organizzatore e admin, al massimo 10). */
export async function addJudge(id: string, slug: string, username: string): Promise<Simple> {
  if (!UUID.test(id)) return { error: "not_found" };
  const uname = String(username ?? "")
    .trim()
    .replace(/^@/, "")
    .slice(0, 60);
  if (!uname) return { error: "user_not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("add_judge", { tid: id, uname }));
}

export async function removeJudge(id: string, slug: string, uid: string): Promise<Simple> {
  if (!UUID.test(id) || !UUID.test(uid)) return { error: "not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("remove_judge", { tid: id, uid }));
}

export async function finishTournament(id: string, slug: string, report: string): Promise<Simple> {
  if (!UUID.test(id)) return { error: "not_found" };
  const clean = String(report ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 2000);
  const r = await organizerRpc(slug, (sb) => sb.rpc("finish_tournament", { tid: id, report: clean || null }));
  if (r.ok) notifyTournamentFinished(id);
  return r;
}

export async function cancelTournament(id: string, slug: string): Promise<Simple> {
  if (!UUID.test(id)) return { error: "not_found" };
  return organizerRpc(slug, (sb) => sb.rpc("cancel_tournament", { tid: id }));
}

/**
 * Modifica dei dettagli (stesso modulo della creazione). Finché le iscrizioni sono aperte si cambia tutto
 * (i posti non possono scendere sotto gli iscritti); dopo, solo nome, copertina, testi, Discord e calendario.
 */
export async function updateTournament(_prev: TournamentActionState, formData: FormData): Promise<TournamentActionState> {
  const ctx = await organizerContext();
  if ("error" in ctx) return { error: ctx.error };
  const locale = localeOf(formData);
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { error: "not_found" };
  const { data: cur } = await ctx.supabase.from("tournaments").select("slug, status, organizer, cover_url").eq("id", id).maybeSingle();
  const current = cur as { slug: string; status: string; organizer: string; cover_url: string | null } | null;
  if (!current) return { error: "not_found" };
  // la copertina già salvata resta valida anche per chi non può più caricarne (per esempio un Creator diventato Autore)
  const parsed = parseTournamentForm(formData, { userId: ctx.user.id, profile: ctx.profile, allowPast: true, currentCover: current.cover_url });
  if (!parsed.ok) return { error: parsed.error };
  // solo gli iscritti veri: chi è in lista d'attesa (05/10/2026) non occupa un posto
  const { count } = await ctx.supabase.from("tournament_players").select("user_id", { count: "exact", head: true }).eq("tournament_id", id).eq("status", "registered");
  const registered = Number(count ?? 0);
  const { name, cover_url, description, rules, discord_url, listed, lang, visibility } = parsed.row;
  const patch =
    current.status === "open"
      ? (() => {
          if (parsed.row.size < registered) return null;
          return { ...parsed.row, lang };
        })()
      : { name, cover_url, description, rules, discord_url, listed, lang, visibility };
  if (!patch) return { error: "sizeTooSmall" };
  let { data, error } = await ctx.supabase.from("tournaments").update(patch).eq("id", id).select("slug").maybeSingle();
  // database senza il blocco QUALIFICAZIONE SENZA FASE FINALE (11/11/2026): la modifica passa senza la colonna spenta
  const plain = error && isMissingColumn(error) ? withoutQualifierOff(patch) : null;
  if (plain) ({ data, error } = await ctx.supabase.from("tournaments").update(plain).eq("id", id).select("slug").maybeSingle());
  // database non ancora migrato (08/11/2026): senza le opzioni nuove la modifica passa lo stesso
  if (error && isMissingColumn(error) && !usesStageOptions(patch)) ({ data, error } = await ctx.supabase.from("tournaments").update(withoutStageOptions(patch)).eq("id", id).select("slug").maybeSingle());
  if (error) return { error: error.message.includes("listing_not_allowed") ? "listing" : error.message.includes("private_not_listed") ? "private_not_listed" : "db" };
  if (!data) return { error: "forbidden" };
  const s = (data as { slug: string }).slug;
  revalidateTournamentPaths(s);
  return { ok: true, href: `/${locale}/tournaments/${s}/manage` };
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

/* ---------- 09/11/2026: svizzera, gironi e sideboard (blocco SVIZZERA, GIRONI E SIDEBOARD di schema.sql) ---------- */

/** "Genera il turno successivo" (staff): la RPC abbina per punteggio, con il bye e senza rivincite quando si può. */
export async function swissNextRound(id: string, slug: string): Promise<Simple & { round?: number }> {
  if (!UUID.test(id)) return { error: "not_found" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { data, error } = await supabase.rpc("swiss_next_round", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true, round: typeof data === "number" ? data : undefined };
}

/** "Chiudi la svizzera e avvia la Top" / "Chiudi i gironi e avvia la fase finale" (staff): crea il tabellone dalla classifica. */
export async function startFinalStage(id: string, slug: string): Promise<Simple & { count?: number }> {
  if (!UUID.test(id)) return { error: "not_found" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { data, error } = await supabase.rpc("start_final_stage", { tid: id });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(slug);
  return { ok: true, count: typeof data === "number" ? data : undefined };
}

const SLUG = /^[a-z0-9-]{1,80}$/;
/** Carta base vera del database carte (niente Leggendarie, pedine o carte tolte dal gioco). */
const isBaseCard = (slug: string) => {
  const c = getCard(slug);
  return Boolean(c && !c.legendary && c.type !== "token" && c.status === "active");
};

/** Consegna della sideboard: carte base vere, al massimo quante ne prevede il torneo, nessuna già nei mazzi. */
export async function submitSideboard(id: string, cards: string[]): Promise<Simple> {
  if (!UUID.test(id) || !Array.isArray(cards) || cards.length > 12 || cards.some((c) => typeof c !== "string" || !SLUG.test(c))) return { error: "side_invalid" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const [{ data: t }, { data: d }] = await Promise.all([
    supabase.from("tournaments").select("slug, sideboard").eq("id", id).maybeSingle(),
    supabase.from("tournament_decks").select("codes").eq("tournament_id", id).eq("user_id", user.id).maybeSingle(),
  ]);
  const tournament = t as { slug: string; sideboard: number | null } | null;
  if (!tournament) return { error: "not_found" };
  if (!tournament.sideboard) return { error: "sideboard_off" };
  const codes = ((d as { codes: unknown } | null)?.codes ?? null) as unknown;
  if (!Array.isArray(codes)) return { error: "decks_missing" };
  const decks = codes.map((c) => decodeOmCode(String(c))).map((x) => ({ legendary: x?.legendary ?? null, cards: x?.cards ?? [] }));
  const problem = sideboardProblem(cards, decks, tournament.sideboard, isBaseCard);
  if (problem) return { error: problem };
  const { error } = await supabase.rpc("submit_tournament_sideboard", { tid: id, cards });
  if (error) return { error: rpcError(error) };
  revalidateTournamentPaths(tournament.slug);
  return { ok: true };
}

/**
 * Scambi con la sideboard prima della partita `game` (2..5) di un incontro, sul mazzo `deck` (da 0; 0 fuori dal
 * Conquest): sempre rispetto al mazzo consegnato. Lista vuota = nessuno scambio. Non rigenera pagine.
 */
export async function declareSideSwaps(matchId: string, game: number, deck: number, swaps: SideSwap[]): Promise<Simple> {
  if (!UUID.test(matchId) || !Number.isInteger(game) || !Number.isInteger(deck) || !Array.isArray(swaps) || swaps.length > 12) return { error: "bad_side_swap" };
  const list = swaps.map((x) => ({ out: String(x?.out ?? ""), in: String(x?.in ?? "") }));
  if (list.some((x) => !SLUG.test(x.out) || !SLUG.test(x.in))) return { error: "bad_side_swap" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const { data: m } = await supabase.from("tournament_matches").select("tournament_id").eq("id", matchId).maybeSingle();
  const tid = (m as { tournament_id: string } | null)?.tournament_id;
  if (!tid) return { error: "not_found" };
  const [{ data: t }, { data: d }] = await Promise.all([
    supabase.from("tournaments").select("sideboard").eq("id", tid).maybeSingle(),
    supabase.from("tournament_decks").select("codes, sideboard").eq("tournament_id", tid).eq("user_id", user.id).maybeSingle(),
  ]);
  const max = (t as { sideboard: number | null } | null)?.sideboard ?? null;
  if (!max) return { error: "sideboard_off" };
  const row = d as { codes: unknown; sideboard: unknown } | null;
  if (!row || !Array.isArray(row.codes)) return { error: "decks_missing" };
  const deckCards = decodeOmCode(String(row.codes[deck] ?? ""))?.cards ?? [];
  const side = Array.isArray(row.sideboard) ? row.sideboard.map(String) : [];
  const problem = swapsProblem(list, deckCards, side, max);
  if (problem) return { error: problem };
  const { error } = await supabase.rpc("declare_side_swaps", { mid: matchId, game_no: game, deck_no: deck, list });
  if (error) return { error: rpcError(error) };
  return { ok: true };
}
