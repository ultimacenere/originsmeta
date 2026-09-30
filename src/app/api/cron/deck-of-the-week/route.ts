import { NextResponse } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/env";
import { CRON_SECRET_MIN, cronAuthorized } from "@/lib/community/notifications";
import { listDeckPopularity, listPublishedDecks } from "@/lib/community/queries";
import { pickDeckOfWeek } from "@/lib/community/deckOfWeek";
import { deckOfWeekPayload, readAnnouncedDeck } from "@/lib/community/discordDeck";
import { discordWebhookUrl, sendDiscordWebhook } from "@/lib/discordWebhook";

/**
 * Mazzo della settimana su Discord (30/09/2026): il lunedì il cron di Vercel (vercel.json) sceglie il mazzo pubblicato
 * con il punteggio "Di tendenza" più alto degli ultimi 7 giorni (`pickDeckOfWeek`, la stessa scelta della striscia in
 * home) e lo annuncia nel canale #community-decks (DISCORD_WEBHOOK_DECKS, lo stesso dei mazzi nuovi). Stesse regole della
 * rotta /api/cron/live: `Authorization: Bearer <CRON_SECRET>`, senza segreto non fa nulla, 401 con il segreto sbagliato,
 * mai in cache. Senza il webhook, senza la migrazione PREFERITI E TENDENZA o con una settimana ferma (punteggio sotto
 * DECK_OF_WEEK_MIN_SCORE) risponde `skipped` e non manda niente. Il cron di Vercel non riprova: un annuncio a settimana.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const headers = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < CRON_SECRET_MIN) return NextResponse.json({ ok: false, skipped: "no_secret" }, { headers });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
  if (!supabaseEnabled) return NextResponse.json({ ok: false, skipped: "no_community" }, { headers });
  const url = discordWebhookUrl("DISCORD_WEBHOOK_DECKS");
  if (!url) return NextResponse.json({ ok: false, skipped: "no_webhook" }, { headers });

  try {
    const [decks, popularity] = await Promise.all([listPublishedDecks(), listDeckPopularity()]);
    if (!popularity) return NextResponse.json({ ok: false, skipped: "no_migration" }, { headers });
    const top = pickDeckOfWeek(decks.map((d) => ({ ...d, trend: popularity.get(d.id)?.trend ?? 0, favorites: popularity.get(d.id)?.favorites ?? 0 })));
    if (!top) return NextResponse.json({ ok: true, skipped: "quiet_week" }, { headers });
    const deck = await readAnnouncedDeck(top.slug);
    if (!deck) return NextResponse.json({ ok: false, skipped: "not_public" }, { headers });
    const sent = await sendDiscordWebhook(url, deckOfWeekPayload(deck), { timeoutMs: 5000 });
    return NextResponse.json({ ok: sent.ok, status: sent.status, deck: top.slug, score: top.trend }, { status: sent.ok ? 200 : 502, headers });
  } catch (error) {
    console.error("[cron/deck-of-the-week]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 502, headers });
  }
}
