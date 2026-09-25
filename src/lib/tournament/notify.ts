import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { siteUrl, type Locale } from "@/lib/i18n";
import { roundLabel, standings } from "./bracket";
import { tournamentShortLink } from "./types";

/**
 * Notifiche Discord del Tournament Organizer (UX-8, 21/09/2026).
 *
 * Il tabellone parte da solo dentro le RPC (tm_autostart, chiamata da join_tournament e
 * submit_tournament_decks, che ritornano void) e nessuno avvisava i giocatori. Questo modulo manda un
 * messaggio breve, in inglese e in italiano, al canale Discord del sito quando:
 *   - nasce un torneo pubblico (24/09/2026, Pierluigi: "quando pubblichiamo sul sito deve essere pubblicato live
 *     su Discord"): data, formato, posti e link per iscriversi;
 *   - il tabellone parte (da solo o avviato dall'organizzatore): abbinamenti del primo turno;
 *   - una partita ha un risultato confermato (referto doppio o risultato imposto): risultato e prossimo turno;
 *   - l'organizzatore chiude il torneo: vincitore e secondo posto.
 *
 * INTERRUTTORE: variabile d'ambiente DISCORD_WEBHOOK_URL (solo server, MAI con prefisso NEXT_PUBLIC_).
 *   Valore: l'URL del webhook del canale `#tournaments-feed` del nostro server (Discord → Impostazioni del canale → Integrazioni → Webhook →
 *   Nuovo webhook → Copia URL, nella forma https://discord.com/api/webhooks/<id>/<token>).
 *   Dove: Vercel → Project → Settings → Environment Variables (Production), poi un nuovo deploy.
 *   È un segreto: chi conosce l'URL può scrivere nel canale, quindi non va nel codice né nel repository.
 *   Se la variabile manca, ogni funzione qui ritorna subito e non fa nessuna lettura né chiamata.
 *
 * Garanzie:
 *   - non blocca mai l'azione: il lavoro è rimandato con `after()` a dopo la risposta al browser;
 *   - non lancia mai eccezioni: ogni errore finisce in console.error;
 *   - ogni chiamata di rete ha un timeout di 3 s (AbortSignal.timeout);
 *   - privacy: i dati si leggono con il client anonimo, quindi i tornei privati (invisibili all'anonimo
 *     per policy) non producono mai messaggi; le menzioni (@everyone, @here, utenti, ruoli) sono spente
 *     con `allowed_mentions` e i nomi scritti dagli utenti sono ripuliti dalla formattazione Discord.
 * Nessuna dipendenza: solo fetch.
 */

const TIMEOUT_MS = 3000;
/** Limite di Discord per il campo `content`. */
const DISCORD_MAX = 2000;
/** Abbinamenti mostrati al massimo nel messaggio di avvio (poi "+N"), per restare sotto il limite. */
const MAX_PAIRINGS = 16;

/**
 * Lingue dei messaggi del nostro Discord: italiano e inglese. Un torneo in spagnolo (dal 25/09/2026) scrive in
 * inglese per primo, come uno inglese; il link porta comunque alla sua pagina spagnola.
 */
type Lang = "en" | "it";

function webhookUrl(): string | null {
  const v = process.env.DISCORD_WEBHOOK_URL?.trim();
  return v && /^https:\/\//i.test(v) ? v : null;
}

/** Vero se le notifiche sono accese (variabile impostata e community attiva). */
export function notificationsEnabled(): boolean {
  return supabaseEnabled && webhookUrl() !== null;
}

/* ---------- lettura dei dati: client anonimo senza cache (le pagine ISR usano una cache di 60 s, qui serve lo stato appena scritto) ---------- */

function freshClient() {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
}
type Client = NonNullable<ReturnType<typeof freshClient>>;

type TInfo = { id: string; slug: string; tag: string; name: string; lang: Locale; status: string; visibility: string };
type MInfo = { id: string; tournament_id: string; round: number; position: number; player_a: string | null; player_b: string | null; winner: string | null; score_a: number | null; score_b: number | null; status: string; forfeit: boolean };

const MATCH_FIELDS = "id, tournament_id, round, position, player_a, player_b, winner, score_a, score_b, status, forfeit";

async function readTournament(sb: Client, id: string): Promise<TInfo | null> {
  const { data } = await sb.from("tournaments").select("id, slug, tag, name, lang, status, visibility").eq("id", id).maybeSingle();
  const t = data as TInfo | null;
  // difesa in profondità: l'anonimo non vede i privati, ma se una policy cambiasse non partirebbe comunque nulla
  return t && t.visibility === "public" ? t : null;
}

async function readMatches(sb: Client, tid: string): Promise<MInfo[]> {
  const { data } = await sb.from("tournament_matches").select(MATCH_FIELDS).eq("tournament_id", tid).order("round", { ascending: true }).order("position", { ascending: true });
  return (data ?? []) as unknown as MInfo[];
}

async function readNames(sb: Client, tid: string): Promise<Map<string, string>> {
  const { data } = await sb.from("tournament_players").select("user_id, profile:profiles!tournament_players_user_id_fkey(username, display_name)").eq("tournament_id", tid);
  const rows = (data ?? []) as unknown as { user_id: string; profile: { username: string | null; display_name: string | null } | null }[];
  return new Map(rows.map((r) => [r.user_id, clean((r.profile?.display_name || r.profile?.username || "player").trim())]));
}

/* ---------- testo ---------- */

/** Toglie la formattazione Discord dai testi scritti dagli utenti (nomi di tornei e giocatori). */
function clean(s: string): string {
  return s
    .replace(/[\r\n]+/g, " ")
    .slice(0, 80)
    .replace(/[\\*_~`|>#[\]()<:-]/g, "\\$&")
    .replace(/@/g, "@​");
}

const ROUNDS: Record<Lang, { final: string; semifinal: string; quarterfinal: string; of: string; round: string }> = {
  en: { final: "Final", semifinal: "Semifinals", quarterfinal: "Quarterfinals", of: "Round of {n}", round: "Round {n}" },
  it: { final: "Finale", semifinal: "Semifinali", quarterfinal: "Quarti di finale", of: "Turno dei {n}", round: "Turno {n}" },
};

function roundName(lang: Lang, round: number, size: number): string {
  const r = ROUNDS[lang];
  try {
    const l = roundLabel(round, size);
    return typeof l === "string" ? r[l] : r.of.replace("{n}", String(l.of));
  } catch {
    return r.round.replace("{n}", String(round));
  }
}

function pageUrl(t: TInfo): string {
  return `${siteUrl}/${t.lang}/tournaments/${t.slug}`;
}

/** Le due lingue, prima quella del torneo. */
function bilingual(lang: Locale, en: string, it: string): string[] {
  return lang === "it" ? [`IT · ${it}`, `EN · ${en}`] : [`EN · ${en}`, `IT · ${it}`];
}

function header(t: TInfo, extra?: string): string {
  return `**${clean(t.name)}** · ${t.tag}${extra ? ` · ${extra}` : ""}`;
}

function links(t: TInfo): string[] {
  // il link breve apre la scheda nella lingua di chi clicca; il tabellone va all'ancora #bracket (senza anteprima)
  return [`Tournament / Torneo: ${tournamentShortLink(siteUrl, t.tag)}`, `Bracket / Tabellone: <${pageUrl(t)}#bracket>`];
}

function nameOf(names: Map<string, string>, id: string | null, fallback = "?"): string {
  return id ? names.get(id) ?? fallback : fallback;
}

type CreatedInfo = TInfo & { starts_at: string; size: number; deck_mode: string; conquest_decks: number; best_of: number; listed: boolean };

async function createdMessage(sb: Client, tid: string): Promise<string | null> {
  const { data } = await sb.from("tournaments").select("id, slug, tag, name, lang, status, visibility, starts_at, size, deck_mode, conquest_decks, best_of, listed").eq("id", tid).maybeSingle();
  const t = data as unknown as CreatedInfo | null;
  // come readTournament: mai un torneo privato, e solo finché è aperto alle iscrizioni
  if (!t || t.visibility !== "public" || t.status !== "open") return null;
  // <t:…:F> è la data nel formato di Discord: ognuno la vede nel proprio fuso orario
  const when = `<t:${Math.floor(Date.parse(t.starts_at) / 1000)}:F>`;
  const mode = t.deck_mode === "conquest" ? { en: `Conquest, ${t.conquest_decks} decks`, it: `Conquest, ${t.conquest_decks} mazzi` } : { en: "one deck", it: "un mazzo" };
  return [
    header(t),
    ...bilingual(t.lang, `New tournament, sign-ups are open: ${when} · ${mode.en} · Bo${t.best_of} · ${t.size} players.`, `Nuovo torneo, iscrizioni aperte: ${when} · ${mode.it} · Bo${t.best_of} · ${t.size} giocatori.`),
    ...links(t),
  ].join("\n");
}

async function startedMessage(sb: Client, tid: string, before: string | undefined): Promise<string | null> {
  const t = await readTournament(sb, tid);
  // confronto con lo stato di prima: si annuncia solo il passaggio a "running" appena avvenuto
  if (!t || t.status !== "running" || before === "running") return null;
  const [matches, names] = await Promise.all([readMatches(sb, tid), readNames(sb, tid)]);
  const first = matches.filter((m) => m.round === 1);
  if (!first.length) return null;
  const pairings = first.slice(0, MAX_PAIRINGS).map((m) => (m.status === "bye" || !m.player_b ? `• ${nameOf(names, m.player_a)} (bye)` : `• ${nameOf(names, m.player_a)} vs ${nameOf(names, m.player_b)}`));
  if (first.length > MAX_PAIRINGS) pairings.push(`• … +${first.length - MAX_PAIRINGS}`);
  return [
    header(t),
    ...bilingual(t.lang, "The bracket has started! Round 1 pairings:", "Il tabellone è partito! Ecco gli abbinamenti del primo turno:"),
    ...pairings,
    ...bilingual(t.lang, "Open your match room from the tournament page to chat with your opponent and report the result.", "Apri la stanza della tua partita dalla pagina del torneo per scrivere all'avversario e refertare il risultato."),
    ...links(t),
  ].join("\n");
}

async function resultMessage(sb: Client, mid: string): Promise<string | null> {
  const { data } = await sb.from("tournament_matches").select(MATCH_FIELDS).eq("id", mid).maybeSingle();
  const m = data as unknown as MInfo | null;
  // il primo referto lascia la partita "reported": si annuncia solo il risultato confermato
  if (!m || m.status !== "confirmed" || !m.winner || m.score_a === null || m.score_b === null) return null;
  const t = await readTournament(sb, m.tournament_id);
  if (!t || t.status !== "running") return null;
  const [matches, names] = await Promise.all([readMatches(sb, t.id), readNames(sb, t.id)]);
  const size = matches.filter((x) => x.round === 1).length * 2;
  const loser = m.winner === m.player_a ? m.player_b : m.player_a;
  const w = nameOf(names, m.winner);
  const l = nameOf(names, loser);
  const score = `${Math.max(m.score_a, m.score_b)}–${Math.min(m.score_a, m.score_b)}`;
  const forfeit = m.forfeit ? { en: " (forfeit)", it: " (per forfait)" } : { en: "", it: "" };
  const next = matches.find((x) => x.round === m.round + 1 && x.position === Math.floor(m.position / 2));
  let en: string;
  let it: string;
  if (!next) {
    en = `Final: ${w} beat ${l} ${score}${forfeit.en}.`;
    it = `Finale: ${w} batte ${l} ${score}${forfeit.it}.`;
  } else {
    const opp = next.player_a === m.winner ? next.player_b : next.player_a;
    const nextRound = { en: roundName("en", next.round, size), it: roundName("it", next.round, size) };
    en = `${w} beat ${l} ${score}${forfeit.en}. ${nextRound.en}: ${opp ? `${w} vs ${nameOf(names, opp)}` : `${w} waits for the next opponent`}.`;
    it = `${w} batte ${l} ${score}${forfeit.it}. ${nextRound.it}: ${opp ? `${w} contro ${nameOf(names, opp)}` : `${w} aspetta il prossimo avversario`}.`;
  }
  const where = t.lang === "it" ? roundName("it", m.round, size) : roundName("en", m.round, size);
  return [header(t, where), ...bilingual(t.lang, en, it), `Bracket / Tabellone: <${pageUrl(t)}#bracket>`].join("\n");
}

async function finishedMessage(sb: Client, tid: string): Promise<string | null> {
  const t = await readTournament(sb, tid);
  if (!t || t.status !== "finished") return null;
  const [matches, names] = await Promise.all([readMatches(sb, tid), readNames(sb, tid)]);
  const size = matches.filter((m) => m.round === 1).length * 2;
  if (!size) return null;
  const podium = (() => {
    try {
      return standings(matches, size);
    } catch {
      return null;
    }
  })();
  if (!podium?.winner) return null;
  const w = nameOf(names, podium.winner);
  const second = podium.runnerUp ? nameOf(names, podium.runnerUp) : null;
  return [
    header(t),
    ...bilingual(t.lang, `Tournament over: ${w} is the champion!${second ? ` Runner-up: ${second}.` : ""}`, `Torneo concluso: vince ${w}!${second ? ` Secondo posto: ${second}.` : ""}`),
    ...bilingual(t.lang, "Bracket, results and decklists are now public on the tournament page.", "Tabellone, risultati e liste dei mazzi ora sono pubblici nella pagina del torneo."),
    ...links(t),
  ].join("\n");
}

/* ---------- invio ---------- */

async function post(url: string, content: string): Promise<void> {
  const body = content.length > DISCORD_MAX ? `${content.slice(0, DISCORD_MAX - 1)}…` : content;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: body, allowed_mentions: { parse: [] } }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) console.error("[tournaments] notify: Discord ha risposto", res.status);
}

/** Stesso annuncio due volte dalla stessa istanza (due azioni quasi simultanee): il secondo si scarta. */
const recent = new Map<string, number>();
function seenRecently(key: string): boolean {
  const now = Date.now();
  for (const [k, at] of recent) if (now - at > 10 * 60_000) recent.delete(k);
  if (recent.has(key)) return true;
  recent.set(key, now);
  return false;
}

function schedule(key: string | null, build: (sb: Client) => Promise<string | null>): void {
  const url = webhookUrl();
  if (!url || !supabaseEnabled) return;
  const job = async () => {
    try {
      const sb = freshClient();
      if (!sb) return;
      const content = await build(sb);
      if (!content || (key && seenRecently(key))) return;
      await post(url, content);
    } catch (e) {
      console.error("[tournaments] notify:", e instanceof Error ? e.message : e);
    }
  };
  try {
    // dopo la risposta: l'azione dell'utente non aspetta Discord
    after(job);
  } catch {
    // fuori da una richiesta (per esempio uno script): si parte subito, senza attendere
    void job();
  }
}

/** Da chiamare dopo la creazione di un torneo: parte solo se è pubblico (i privati non escono mai). */
export function notifyTournamentCreated(tournamentId: string): void {
  schedule(`created:${tournamentId}`, (sb) => createdMessage(sb, tournamentId));
}

/**
 * Da chiamare dopo iscrizione, consegna dei mazzi o avvio manuale. `before` è lo stato letto prima
 * dell'azione: se ora il torneo è "running" (e prima no) il tabellone è appena partito.
 */
export function notifyIfStarted(tournamentId: string, before: string | undefined): void {
  if (before === "running") return;
  schedule(`started:${tournamentId}`, (sb) => startedMessage(sb, tournamentId, before));
}

/** Da chiamare dopo un referto o un risultato imposto: parte solo se la partita risulta confermata. */
export function notifyMatchResult(matchId: string): void {
  schedule(null, (sb) => resultMessage(sb, matchId));
}

/** Da chiamare dopo la chiusura del torneo. */
export function notifyTournamentFinished(tournamentId: string): void {
  schedule(`finished:${tournamentId}`, (sb) => finishedMessage(sb, tournamentId));
}
