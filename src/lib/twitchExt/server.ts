/**
 * Estensione Twitch "Deck tracker", lato server (13/10/2026, docs/twitch.md): configurazione, CORS per l'origine
 * dell'estensione e invio dello stato agli spettatori con l'Extension PubSub di Helix.
 *
 * Variabili d'ambiente (Vercel, SOLO server, mai con NEXT_PUBLIC_), dalla console dell'estensione su dev.twitch.tv:
 * TWITCH_EXT_CLIENT_ID (Client ID dell'estensione), TWITCH_EXT_SECRET (Extension Secret, in base64, così come lo dà la
 * console), TWITCH_EXT_OWNER_ID (l'id utente Twitch del proprietario dell'estensione, che firma i token "external").
 * Senza, l'estensione non si collega (503) e l'app non riceve canali: nessun errore altrove. Il collegamento del canale
 * usa anche CRON_SECRET (lo stesso del cron, registrato con scripts/set-cron-key.mjs).
 */
import { signExtJwt } from "./jwt";

export type ExtConfig = { clientId: string; secret: string; ownerId: string };

export function extConfig(): ExtConfig | null {
  const clientId = process.env.TWITCH_EXT_CLIENT_ID?.trim();
  const secret = process.env.TWITCH_EXT_SECRET?.trim();
  const ownerId = process.env.TWITCH_EXT_OWNER_ID?.trim();
  return clientId && secret && ownerId ? { clientId, secret, ownerId } : null;
}

/** Le pagine dell'estensione girano su https://<client id>.ext-twitch.tv: solo quell'origine può chiamare le rotte con il JWT. */
export function extCors(request: Request, cfg: ExtConfig | null): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const ok = cfg && origin === `https://${cfg.clientId}.ext-twitch.tv`;
  return ok
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "authorization, content-type", "access-control-max-age": "600", vary: "origin" }
    : { vary: "origin" };
}

const PUBSUB_URL = "https://api.twitch.tv/helix/extensions/pubsub";

/**
 * Manda un messaggio a tutti gli spettatori del canale (target "broadcast"). Il token "external" dura 2 minuti. Errori
 * solo nel log: l'estensione rilegge comunque lo stato con /api/twitch/state quando si apre.
 */
export async function sendBroadcast(cfg: ExtConfig, channelId: string, message: string): Promise<boolean> {
  const exp = Math.floor(Date.now() / 1000) + 120;
  const jwt = signExtJwt({ exp, user_id: cfg.ownerId, role: "external", channel_id: channelId, pubsub_perms: { send: ["broadcast"] } }, cfg.secret);
  try {
    const res = await fetch(PUBSUB_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${jwt}`, "client-id": cfg.clientId, "content-type": "application/json" },
      body: JSON.stringify({ target: ["broadcast"], broadcaster_id: channelId, message }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[twitch-ext] pubsub: HTTP ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error("[twitch-ext] pubsub:", e instanceof Error ? e.message : e);
    return false;
  }
}
