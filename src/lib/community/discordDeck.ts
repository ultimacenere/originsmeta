import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { getCard } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { siteUrl } from "@/lib/i18n";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook, type DiscordWebhookPayload } from "@/lib/discordWebhook";

/**
 * Ogni mazzo pubblicato sul sito va in diretta nel canale `#community-decks` del nostro Discord (Pierluigi,
 * 24/09/2026: "quando pubblichiamo sul sito deve essere pubblicato live su Discord"). News, guide e patch non
 * passano da qui: le annuncia la GitHub Action dopo il push (`scripts/discord-announce.mjs`).
 *
 * INTERRUTTORE: DISCORD_WEBHOOK_DECKS (Vercel → Settings → Environment Variables, solo server, poi un deploy):
 * webhook del canale `#community-decks`. Senza, `announceDeck` non fa nulla.
 *
 * Garanzie, come le notifiche dei tornei (`src/lib/tournament/notify.ts`): la pubblicazione non aspetta Discord
 * (`after()`), nessuna eccezione, timeout di rete; il mazzo si rilegge con il client anonimo, quindi parte solo
 * se è davvero pubblico; nessuna menzione (`sendDiscordWebhook`) e il nome dell'autore è ripulito.
 */

const MINT = 0x31e3bd;
const TIMEOUT_MS = 3000;

export type AnnouncedDeck = { slug: string; name: string; legendary: string; archetype: string; author: string };

/** Messaggio del canale: italiano per primo, con il link alla pagina inglese; copertina della Leggendaria. */
export function deckPayload(d: AnnouncedDeck): DiscordWebhookPayload {
  const card = getCard(d.legendary);
  const legendary = card?.name ?? d.legendary;
  const arch = archetypeLabels[d.archetype];
  const image = card?.cover ?? card?.image;
  const author = escapeDiscord(d.author);
  return {
    content: "🃏 **Nuovo mazzo · New deck**",
    embeds: [
      {
        // il titolo di un embed non interpreta il Markdown: il nome resta com'è, solo accorciato
        title: d.name.slice(0, 256),
        url: `${siteUrl}/it/decks/community/${d.slug}`,
        description: [`**${legendary}**${arch ? ` · ${arch.it}` : ""} · di ${author}`, `${legendary}${arch ? ` · ${arch.en}` : ""} · by ${author}`].join("\n"),
        // stesso formato dei messaggi della GitHub Action: titolo inglese (qui il nome del mazzo) collegato alla pagina inglese
        fields: [{ name: "🇬🇧 English", value: `[${d.name.replace(/[[\]]/g, "").slice(0, 200)}](${siteUrl}/en/decks/community/${d.slug})` }],
        ...(image ? { image: { url: `${siteUrl}${image}` } } : {}),
        color: MINT,
        footer: { text: "originsmeta.com" },
      },
    ],
  };
}

/** Rilegge il mazzo appena pubblicato come lo vede chiunque (client anonimo, senza cache): niente se non è pubblico. */
async function readPublished(slug: string): Promise<AnnouncedDeck | null> {
  if (!supabaseEnabled) return null;
  const sb = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
  const { data } = await sb
    .from("community_decks")
    .select("slug, name, legendary, archetype, status, owner:profiles!community_decks_owner_fkey(username, display_name)")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as unknown as { slug: string; name: string; legendary: string; archetype: string; status: string; owner: { username: string | null; display_name: string | null } | null } | null;
  if (!row || row.status !== "published") return null;
  const author = (row.owner?.display_name || row.owner?.username || "?").replace(/[\r\n]+/g, " ").trim().slice(0, 60);
  return { slug: row.slug, name: row.name, legendary: row.legendary, archetype: row.archetype, author };
}

/** Da chiamare dopo la pubblicazione di un mazzo: annuncia nel canale dopo la risposta al browser. */
export function announceDeck(slug: string): void {
  const url = discordWebhookUrl("DISCORD_WEBHOOK_DECKS");
  if (!url || !supabaseEnabled) return;
  const job = async () => {
    try {
      const deck = await readPublished(slug);
      if (deck) await sendDiscordWebhook(url, deckPayload(deck), { timeoutMs: TIMEOUT_MS });
    } catch (e) {
      console.error("[decks] annuncio su Discord non riuscito:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}
