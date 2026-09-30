/**
 * Overlay del tracker (Fase 4, 30/09/2026; docs/tracker.md, "Overlay"): i dati che mostra la finestra sopra il gioco e
 * la sorgente per OBS, e il piccolo server locale che serve quest'ultima.
 *
 * Che cosa mostra: il mazzo scelto nel gioco (il gioco lo mostra già al giocatore), vittorie e sconfitte della sessione
 * (dall'avvio dell'app o da "Nuova sessione"), il record del mazzo nello storico sul PC e l'ultima partita finita con la
 * Leggendaria avversaria. Regole del tracker: niente durante la partita che il gioco nasconde (la Leggendaria avversaria
 * compare solo a partita finita), mai bot o persona, mai il rank dell'avversario, mai nomi.
 *
 * Il server ascolta solo su 127.0.0.1 (lo raggiunge solo questo PC, per esempio OBS), risponde solo a GET e HEAD e solo
 * con l'intestazione Host giusta (contro il DNS rebinding): la pagina dell'overlay e il suo stato in JSON.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import type { ActiveDeck, OverlayView } from "../shared/types";

/** `slug`: la carta sul sito, per l'immagine (originsmeta.com/cards/<slug>.webp). */
export type CardInfo = { name: string; legendary: boolean; slug: string };
export type CardLookup = (key: string) => CardInfo | undefined;

const sortedKey = (cards: readonly string[]) => [...cards].sort().join(",");

/** I dati dell'overlay (funzione pura, con i test in overlay.test.ts). `matches`: storico sul PC, dalla più vecchia. */
export function overlayView(input: { matches: readonly TrackedMatch[]; activeDeck: ActiveDeck; sessionStart: number; card: CardLookup; now?: number }): OverlayView {
  const { matches, activeDeck, sessionStart, card } = input;
  const at = (m: TrackedMatch) => Date.parse(m.endedAt ?? "") || 0;
  const session = matches.filter((m) => at(m) >= sessionStart);
  const deckKey = activeDeck && activeDeck.cards.length ? sortedKey(activeDeck.cards) : null;
  const ofDeck = deckKey ? matches.filter((m) => m.deck.cards.length && sortedKey(m.deck.cards) === deckKey) : [];
  const last = matches.length ? [...matches].sort((a, b) => at(b) - at(a))[0] : null;
  const count = (list: readonly TrackedMatch[]) => ({ wins: list.filter((m) => m.result === "W").length, losses: list.filter((m) => m.result === "L").length });
  const deckRecord = count(ofDeck);
  const legendary = activeDeck?.legendary ? card(activeDeck.legendary) : undefined;
  const opponent = last?.opponent?.legendary ? card(last.opponent.legendary) : undefined;
  return {
    deck: activeDeck ? { name: activeDeck.name, legendary: activeDeck.legendary, legendaryName: legendary?.name ?? null, legendarySlug: legendary?.slug ?? null } : null,
    session: count(session),
    deckRecord: deckKey ? { ...deckRecord, games: deckRecord.wins + deckRecord.losses } : null,
    last: last ? { result: last.result, opponentLegendary: last.opponent?.legendary ?? null, opponentName: opponent?.name ?? null, opponentSlug: opponent?.slug ?? null } : null,
    updatedAt: new Date(input.now ?? Date.now()).toISOString(),
  };
}

/** La richiesta arriva davvero per il server locale (Host 127.0.0.1:porta o localhost:porta)? */
export function hostAllowed(host: string | undefined, port: number): boolean {
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

/** Porta della sorgente per OBS, con quattro di riserva se è occupata. */
export const OVERLAY_PORTS = [47015, 47016, 47017, 47018, 47019] as const;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
};

/**
 * Il file della cartella `dir` per un indirizzo, o null: solo la pagina, il suo stile e il suo script, il logo e i font
 * del sito (01/10/2026). Nomi fissi o minuscole, cifre e trattini: niente `..` né altre cartelle.
 */
export function overlayFile(pathname: string): string | null {
  if (pathname === "/overlay/" || pathname === "/overlay") return "overlay.html";
  return /^\/overlay\/(overlay\.(?:css|js)|logo-originsmeta(?:-sm)?\.webp|fonts\/[a-z0-9-]+\.woff2)$/.exec(pathname)?.[1] ?? null;
}

/**
 * Avvia il server della sorgente per OBS: /overlay/ (la pagina), stile, script, logo e font (dalla cartella `dir`,
 * `overlayFile`), /overlay/state.json (i dati di adesso). Prova le porte in ordine; null se sono tutte occupate.
 */
export async function startOverlayServer(opts: { dir: string; view: () => OverlayView; ports?: readonly number[] }): Promise<{ port: number; url: string; close: () => void } | null> {
  for (const port of opts.ports ?? OVERLAY_PORTS) {
    const server = http.createServer((req, res) => {
      const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
      if (!hostAllowed(req.headers.host, port) || (req.method !== "GET" && req.method !== "HEAD")) {
        res.writeHead(403, headers).end();
        return;
      }
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      const send = (status: number, type: string, body: string | Buffer) => {
        res.writeHead(status, { ...headers, "content-type": type });
        res.end(req.method === "HEAD" ? undefined : body);
      };
      if (url.pathname === "/overlay/state.json") return send(200, "application/json; charset=utf-8", JSON.stringify(opts.view()));
      const file = overlayFile(url.pathname);
      if (!file) return send(404, "text/plain; charset=utf-8", "404");
      try {
        send(200, TYPES[path.extname(file)], fs.readFileSync(path.join(opts.dir, file)));
      } catch {
        send(404, "text/plain; charset=utf-8", "404");
      }
    });
    const ok = await new Promise<boolean>((resolve) => {
      server.once("error", () => resolve(false));
      server.listen(port, "127.0.0.1", () => resolve(true));
    });
    if (ok) return { port, url: `http://127.0.0.1:${port}/overlay/`, close: () => server.close() };
  }
  return null;
}
