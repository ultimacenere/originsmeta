import { CRON_SECRET_MIN, cronAuthorized } from "@/lib/community/notifications";

/**
 * TEMPORANEA (20/10/2026): ponte verso l'API Anthropic per gli arretrati delle traduzioni di portoghese e tedesco
 * (`scripts/translate-decks.mjs` e `translate-guides.mjs` con `--via-site`). La chiave ANTHROPIC_API_KEY su Vercel è
 * "Sensitive" e non si può rileggere, quindi gli script dal PC passano da qui: l'SDK manda il segreto del cron come
 * chiave (`x-api-key`) e questa rotta inoltra la richiesta ad Anthropic con la chiave del server. Solo il segreto del cron
 * apre la porta (CRON_SECRET, almeno 32 caratteri). Da togliere finiti gli arretrati.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_TOKENS = 16000;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  if (secret.length < CRON_SECRET_MIN || !key) return Response.json({ error: "not_configured" }, { status: 503 });
  if (!cronAuthorized(`Bearer ${request.headers.get("x-api-key") ?? ""}`, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof body.max_tokens !== "number" || body.max_tokens > MAX_TOKENS) body.max_tokens = MAX_TOKENS;
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": request.headers.get("anthropic-version") ?? "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store" } });
}
