import type { NextRequest } from "next/server";
import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { deckGameCode } from "@/lib/deckGameCode";
import { getStreamDeck, latestDeckOfUser, type StreamDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { chatLine, cleanDeckSlug, displayHost, fill, isDeckSlug, normalizeUsername, pickLang } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";

/**
 * Comando di chat per le dirette (pacchetto STREAM, 26/09/2026): una riga di testo semplice che Nightbot
 * (`$(urlfetch URL)`), StreamElements (`${customapi.URL}`) e Fossabot (`$(customapi URL)`) mettono in chat quando
 * qualcuno scrive !deck.
 *
 *   /api/chat/deck?u=<nome utente>[&lang=it]   l'ultimo mazzo pubblicato di quell'utente (anche ?user=, ?username=)
 *   /api/chat/deck?deck=<slug>[&lang=it]       un mazzo preciso
 *
 * Risposta: "Mazzo di coachcrono: Spellcast (Leggendaria: Merlin) → originsmeta.com/d/<slug> · Codice del gioco:
 * KGBLDC…", sotto i 400 caratteri (limite di Nightbot); il codice del gioco solo se ci sta (`chatLine`, che ripulisce
 * anche i testi degli utenti da link, menzioni e comandi: il bot è moderatore). Lingua da `lang` (en, it, es),
 * altrimenti inglese: i bot non mandano l'Accept-Language del pubblico. I nomi dei parametri valgono anche con le
 * maiuscole (?U=, ?Deck=).
 *
 * Ogni risposta è 200 con una frase da leggere, anche gli errori (utente o mazzo inesistente, niente mazzi, parametri
 * mancanti o scritti male, database irraggiungibile): con un altro stato i bot mostrano in chat un errore generico al
 * posto della frase che spiega come correggere il comando. Il database irraggiungibile non va in cache. Solo dati
 * pubblici (mazzi pubblicati, nome dell'autore). Lettura senza cache dei dati (solo una copia in memoria di 5 s,
 * `memoFetch` in streamDecks.ts) e 20 s di CDN, senza copie scadute: un mazzo appena pubblicato arriva in chat entro
 * mezzo minuto.
 */
const TEXT_HEADERS = { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex", "x-content-type-options": "nosniff" };
const CACHE_OK = "public, max-age=0, s-maxage=20";
const CACHE_USAGE = "public, max-age=300, s-maxage=300";

function reply(body: string, cache = CACHE_OK): Response {
  return new Response(body, { status: 200, headers: { ...TEXT_HEADERS, "cache-control": cache } });
}

async function line(deck: StreamDeck, lang: keyof typeof streamLabels): Promise<string> {
  const view = streamDeckView(deck);
  const { code } = await deckGameCode(deck);
  return chatLine({ name: view.name, author: view.author, slug: view.slug, legendary: view.legendary?.name, gameCode: code }, streamLabels[lang].chat, displayHost(siteUrl));
}

/** Il primo valore di ciascun parametro, con il nome in minuscolo (?U= e ?u= sono lo stesso parametro). */
function params(sp: URLSearchParams): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of sp) {
    const key = k.trim().toLowerCase();
    if (!out.has(key)) out.set(key, v);
  }
  return out;
}

export async function GET(req: NextRequest) {
  const q = params(req.nextUrl.searchParams);
  const lang = pickLang(q.get("lang"), locales, defaultLocale);
  const L = streamLabels[lang].chat;
  const deckParam = q.get("deck");
  const userParam = q.get("u") ?? q.get("user") ?? q.get("username");
  try {
    if (deckParam !== undefined) {
      const slug = cleanDeckSlug(deckParam);
      if (!slug) return reply(L.usage, CACHE_USAGE);
      const deck = isDeckSlug(slug) ? await getStreamDeck(slug, { fresh: true }) : null;
      return deck ? reply(await line(deck, lang)) : reply(L.noDeck);
    }
    if (userParam !== undefined) {
      const user = normalizeUsername(userParam);
      if (!user) return reply(L.usage, CACHE_USAGE);
      const found = await latestDeckOfUser(user);
      if (found.user === "missing") return reply(fill(L.noUser, { user }));
      return found.deck ? reply(await line(found.deck, lang)) : reply(fill(L.noDecks, { user }));
    }
    return reply(L.usage, CACHE_USAGE);
  } catch (e) {
    console.error("[stream] /api/chat/deck:", e instanceof Error ? e.message : e);
    return reply(L.unavailable, "no-store");
  }
}
