"use server";

import { revalidatePath } from "next/cache";
import { activeCards } from "@/lib/data/cards";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { cardRatingsFrom, isCardScore, type CardRatingRow } from "@/lib/cardVotes";
import { cardVotesMissing } from "./cardVotes";

/** Esito del voto: media e numero di voti aggiornati della carta, oppure un codice d'errore per il widget. */
export type CardVoteResult = { avg?: number; votes?: number; error?: "disabled" | "notLoggedIn" | "invalid" | "unavailable" | "limit" | "db" };

/** Le carte votabili: attive nella Demo 2.0 e non create, le stesse del tool /tier-list/create e del deck builder. */
function votable(): ReadonlySet<string> {
  return new Set(activeCards.filter((c) => c.type !== "token").map((c) => c.slug));
}

/**
 * Vota una carta da 1 a 10 (06/10/2026): un voto per iscritto e per carta, l'upsert sostituisce quello di prima. Il
 * database controlla forma, punteggio, proprietà della riga e tetto (blocco VOTI ALLE CARTE di schema.sql); qui si
 * accettano solo gli slug delle carte votabili. Rigenera la pagina /tier-list/votes nelle tre lingue (la scheda carta
 * no: prende i numeri entro un'ora dalla cache condivisa, e il widget mostra subito quelli di questa risposta).
 */
export async function voteCard(slug: string, score: number): Promise<CardVoteResult> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const n = Math.round(Number(score));
  if (typeof slug !== "string" || !votable().has(slug) || !isCardScore(n)) return { error: "invalid" };
  const { error } = await supabase.from("card_votes").upsert({ card: slug, user_id: user.id, score: n }, { onConflict: "card,user_id" });
  if (error) {
    if (cardVotesMissing(error)) return { error: "unavailable" };
    if (error.code === "23514") return { error: "limit" };
    console.error("[community] voteCard:", error.message);
    return { error: "db" };
  }
  const { data } = await supabase.rpc("card_ratings", { p_card: slug });
  const rating = cardRatingsFrom((data ?? []) as CardRatingRow[])[slug];
  for (const l of locales) revalidatePath(`/${l}/tier-list/votes`);
  return { avg: rating?.avg ?? n, votes: rating?.votes ?? 1 };
}
