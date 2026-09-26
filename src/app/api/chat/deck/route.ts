import type { NextRequest } from "next/server";
import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { deckGameCode } from "@/lib/deckGameCode";
import { getStreamDeck, latestDeckOfUser, type StreamDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { chatLine, displayHost, fill, isDeckSlug, normalizeUsername, pickLang } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";

/**
 * Comando di chat per le dirette (pacchetto STREAM, 26/09/2026): una riga di testo semplice che Nightbot
 * (`$(urlfetch URL)`), StreamElements (`${customapi.URL}`) e Fossabot (`$(customapi URL)`) mettono in chat quando
 * qualcuno scrive !deck.
 *
 *   /api/chat/deck?u=<nome utente>[&lang=it]   l'ultimo mazzo pubblicato di quell'utente
 *   /api/chat/deck?deck=<slug>[&lang=it]       un mazzo preciso
 *
 * Risposta: "Mazzo di coachcrono: Spellcast (Leggendaria: Merlin) → originsmeta.com/d/<slug> · Codice del gioco:
 * KGBLDC…", sotto i 400 caratteri (limite di Nightbot); il codice del gioco solo se ci sta (`chatLine`). Lingua da
 * `lang` (en, it, es), altrimenti inglese: i bot non mandano l'Accept-Language del pubblico.
 *
 * I messaggi che lo streamer e la chat devono leggere (utente o mazzo inesistente, niente mazzi, database
 * irraggiungibile) rispondono 200 con la frase: con un altro stato i bot mostrano un errore generico al posto del
 * testo. Il database irraggiungibile non va in cache. Parametri mancanti: 400 (lo vede solo chi prova il link nel
 * browser). Solo dati pubblici (mazzi pubblicati, nome dell'autore). Cache breve in CDN (un minuto): un bot
 * interroga a ogni !deck, e un mazzo appena aggiornato arriva in chat entro un paio di minuti.
 */
const TEXT_HEADERS = { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex", "x-content-type-options": "nosniff" };
const CACHE_OK = "public, max-age=30, s-maxage=60, stale-while-revalidate=300";

function reply(body: string, status = 200, cache = CACHE_OK): Response {
  return new Response(body, { status, headers: { ...TEXT_HEADERS, "cache-control": cache } });
}

async function line(deck: StreamDeck, lang: keyof typeof streamLabels): Promise<string> {
  const view = streamDeckView(deck);
  const { code } = await deckGameCode(deck);
  return chatLine({ name: view.name, author: view.author, slug: view.slug, legendary: view.legendary?.name, gameCode: code }, streamLabels[lang].chat, displayHost(siteUrl));
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lang = pickLang(sp.get("lang"), locales, defaultLocale);
  const L = streamLabels[lang].chat;
  const deckParam = sp.get("deck");
  const userParam = sp.get("u") ?? sp.get("user");
  try {
    if (deckParam !== null) {
      const slug = deckParam.trim().toLowerCase();
      const deck = isDeckSlug(slug) ? await getStreamDeck(slug) : null;
      return deck ? reply(await line(deck, lang)) : reply(L.noDeck);
    }
    if (userParam !== null) {
      const user = normalizeUsername(userParam);
      if (!user) return reply(fill(L.noUser, { user: "?" }));
      const found = await latestDeckOfUser(user);
      if (found.user === "missing") return reply(fill(L.noUser, { user }));
      return found.deck ? reply(await line(found.deck, lang)) : reply(fill(L.noDecks, { user }));
    }
    return reply(L.usage, 400, "public, max-age=3600");
  } catch (e) {
    console.error("[stream] /api/chat/deck:", e instanceof Error ? e.message : e);
    return reply(L.unavailable, 200, "no-store");
  }
}
