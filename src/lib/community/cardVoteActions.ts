"use server";

import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { activeCards } from "@/lib/data/cards";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { cardRatingsFrom, isCardScore, type CardRatingRow } from "@/lib/cardVotes";
import { CARD_VOTES_TAG, cardVotesMissing } from "./cardVotes";
import { CRON_SECRET_MIN } from "./notifications";

/** Esito del voto: media e numero di voti aggiornati della carta, oppure un codice d'errore per il widget. */
export type CardVoteResult = { avg?: number; votes?: number; error?: "disabled" | "notLoggedIn" | "invalid" | "unavailable" | "limit" | "db" };

/** Le carte votabili: attive nel gioco e non create, le stesse del tool /tier-list/create e del deck builder. */
function votable(): ReadonlySet<string> {
  return new Set(activeCards.filter((c) => c.type !== "token").map((c) => c.slug));
}

/*
  Voto senza account (04/11/2026, Pierluigi: "il voto deve essere libero, senza iscrizione"). Il browser riceve al primo
  voto un codice anonimo casuale (cookie httpOnly, un anno); al database arrivano solo l'impronta sha256 del codice e
  quella della connessione (con il segreto del server), e solo attraverso le funzioni del blocco VOTI ALLE CARTE SENZA
  ACCOUNT di schema.sql, che chiedono il segreto del server (CRON_SECRET, già registrato per il cron del badge LIVE).
  Senza segreto (per esempio in locale senza .env.local) chi non ha l'account riceve "non ancora attivi".
*/
const VOTER_COOKIE = "om_card_voter";
const VOTER_RE = /^[0-9a-f-]{36}$/;
const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

function serverKey(): string | null {
  const key = process.env.CRON_SECRET?.trim() ?? "";
  return key.length >= CRON_SECRET_MIN ? key : null;
}

/** Impronta del codice anonimo di questo browser; con `create` lo crea se manca. */
async function guestVoter(create: boolean): Promise<string | null> {
  const jar = await cookies();
  let id = jar.get(VOTER_COOKIE)?.value ?? "";
  if (!VOTER_RE.test(id)) {
    if (!create) return null;
    id = randomUUID();
    jar.set(VOTER_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return sha256(id);
}

async function connectionHash(key: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anonimo";
  return sha256(`${key}|card-votes|${ip}`);
}

/**
 * Vota una carta da 1 a 10 (06/10/2026): un voto per persona e per carta, che sostituisce quello di prima. Con
 * l'account il voto va in `card_votes` (il database controlla forma, punteggio, proprietà della riga e tetto, blocco
 * VOTI ALLE CARTE di schema.sql), e un eventuale voto anonimo dello stesso browser alla stessa carta si toglie; senza
 * account (dal 4/11/2026) va in `card_votes_guest` col codice anonimo del browser. Qui si accettano solo gli slug delle
 * carte votabili. Rigenera la pagina /tier-list/votes in tutte le lingue e segna vecchia la lettura condivisa delle
 * schede carta (`revalidateTag` con il profilo "max": ogni scheda si rigenera in background alla visita successiva, non
 * tutte insieme; dal 7/10/2026, perché ricaricando la scheda dopo il voto la media diceva ancora "nessun voto" accanto a
 * "Il tuo voto: 10/10"). Il widget mostra subito i numeri di questa risposta.
 */
export async function voteCard(slug: string, score: number): Promise<CardVoteResult> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  const n = Math.round(Number(score));
  if (typeof slug !== "string" || !votable().has(slug) || !isCardScore(n)) return { error: "invalid" };
  const key = serverKey();
  if (user) {
    const { error } = await supabase.from("card_votes").upsert({ card: slug, user_id: user.id, score: n }, { onConflict: "card,user_id" });
    if (error) {
      if (cardVotesMissing(error)) return { error: "unavailable" };
      if (error.code === "23514") return { error: "limit" };
      console.error("[community] voteCard:", error.message);
      return { error: "db" };
    }
    const voter = key ? await guestVoter(false) : null;
    if (key && voter) await supabase.rpc("card_vote_guest_forget", { p_key: key, p_voter: voter, p_card: slug });
  } else {
    if (!key) return { error: "unavailable" };
    const voter = await guestVoter(true);
    if (!voter) return { error: "unavailable" };
    const { data, error } = await supabase.rpc("card_vote_guest", { p_key: key, p_voter: voter, p_ip: await connectionHash(key), p_card: slug, p_score: n });
    if (error) {
      if (cardVotesMissing(error) || /card_vote_guest/.test(error.message ?? "")) return { error: "unavailable" };
      console.error("[community] voteCard (senza account):", error.message);
      return { error: "db" };
    }
    if (data === "limit") return { error: "limit" };
    if (data !== "ok") {
      // 'denied': il segreto del server non è registrato in notify_keys
      console.error("[community] voteCard (senza account):", data);
      return { error: data === "invalid" ? "invalid" : "unavailable" };
    }
  }
  const { data } = await supabase.rpc("card_ratings", { p_card: slug });
  const rating = cardRatingsFrom((data ?? []) as CardRatingRow[])[slug];
  for (const l of locales) revalidatePath(`/${l}/tier-list/votes`);
  revalidateTag(CARD_VOTES_TAG, "max");
  return { avg: rating?.avg ?? n, votes: rating?.votes ?? 1 };
}

/**
 * I voti di chi guarda la pagina, carta → punteggio: con l'account i suoi (`card_votes`, RLS), senza quelli del codice
 * anonimo del browser. Senza cookie né account non tocca il database. Le pagine sono in ISR: si chiede dal browser.
 */
export async function myCardVotes(): Promise<Record<string, number>> {
  const { supabase, user } = await currentUser();
  if (!supabase) return {};
  if (user) {
    const { data } = await supabase.from("card_votes").select("card, score").eq("user_id", user.id);
    return Object.fromEntries(((data ?? []) as { card: string; score: number }[]).map((r) => [r.card, r.score]));
  }
  const key = serverKey();
  const voter = key ? await guestVoter(false) : null;
  if (!key || !voter) return {};
  const { data } = await supabase.rpc("card_votes_guest_mine", { p_key: key, p_voter: voter });
  return Object.fromEntries((data ?? []).map((r) => [r.card, r.score]));
}
