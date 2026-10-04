import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { getCard } from "@/lib/data/cards";
import { siteUrl } from "@/lib/i18n";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook, type DiscordWebhookPayload } from "@/lib/discordWebhook";
import { discordUtm } from "@/lib/analytics";

/**
 * Ogni mazzo torneo pubblicato va in diretta nel canale `#community-decks` del nostro Discord (04/10/2026), come i mazzi
 * singoli (discordDeck.ts): stesso webhook DISCORD_WEBHOOK_DECKS (senza, non fa nulla), dopo la risposta al browser,
 * nessuna eccezione, trio riletto con il client anonimo (parte solo se è davvero pubblico), nessuna menzione.
 */

const GOLD = 0xf2c94c;
const TIMEOUT_MS = 3000;
const UTM = discordUtm("deck_set", "community-decks");

export type AnnouncedDeckSet = { slug: string; name: string; legendaries: string[]; author: string };

/** Messaggio del canale: italiano per primo, con i link alle pagine inglese e spagnola; copertina della prima Leggendaria. */
export function deckSetPayload(d: AnnouncedDeckSet): DiscordWebhookPayload {
  const legs = d.legendaries.map((s) => getCard(s)?.name ?? s);
  const first = d.legendaries.map((s) => getCard(s)).find((c) => c?.cover ?? c?.image);
  const image = first?.cover ?? first?.image;
  const author = escapeDiscord(d.author);
  const name = d.name.replace(/[[\]]/g, "").slice(0, 200);
  const trio = legs.map((l) => `**${l}**`).join(" · ");
  return {
    content: "🏆 **Nuovo mazzo torneo · New tournament deck · Nuevo mazo de torneo**",
    embeds: [
      {
        title: d.name.slice(0, 256),
        url: `${siteUrl}/it/decks/tournament/${d.slug}?${UTM}`,
        description: [`${trio}`, `Conquest · di ${author}`, `Conquest · by ${author}`, `Conquest · de ${author}`].join("\n"),
        fields: [
          { name: "🇬🇧 English", value: `[${name}](${siteUrl}/en/decks/tournament/${d.slug}?${UTM})` },
          { name: "🇪🇸 Español", value: `[${name}](${siteUrl}/es/decks/tournament/${d.slug}?${UTM})` },
        ],
        ...(image ? { image: { url: `${siteUrl}${image}` } } : {}),
        color: GOLD,
        footer: { text: "originsmeta.com" },
      },
    ],
  };
}

async function readPublished(slug: string): Promise<AnnouncedDeckSet | null> {
  if (!supabaseEnabled) return null;
  const sb = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
  const { data } = await sb
    .from("community_deck_sets")
    .select("slug, name, legendaries, status, owner:profiles!community_deck_sets_owner_fkey(username, display_name)")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as unknown as { slug: string; name: string; legendaries: string[]; status: string; owner: { username: string | null; display_name: string | null } | null } | null;
  if (!row || row.status !== "published") return null;
  const author = (row.owner?.display_name || row.owner?.username || "?").replace(/[\r\n]+/g, " ").trim().slice(0, 60);
  return { slug: row.slug, name: row.name, legendaries: row.legendaries ?? [], author };
}

/** Da chiamare dopo la pubblicazione di un mazzo torneo: annuncia nel canale dopo la risposta al browser. */
export function announceDeckSet(slug: string): void {
  const url = discordWebhookUrl("DISCORD_WEBHOOK_DECKS");
  if (!url || !supabaseEnabled) return;
  const job = async () => {
    try {
      const set = await readPublished(slug);
      if (set) await sendDiscordWebhook(url, deckSetPayload(set), { timeoutMs: TIMEOUT_MS });
    } catch (e) {
      console.error("[deck-sets] annuncio su Discord non riuscito:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}
