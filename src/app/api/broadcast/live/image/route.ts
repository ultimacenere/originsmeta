import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/tracker/http";
import { isLiveImageData, LIVE_IMAGE_MAX } from "@/lib/broadcast/live";
import { LIVE_ERROR_STATUS, LiveError, userBackend } from "@/lib/broadcast/liveServer";

/**
 * Broadcasting OM in diretta (05/11/2026): l'immagine di uno sponsor caricata dalla regia (logo o bannerino, già
 * ricodificato nel browser alle misure scritte). POST {data: data URL di PNG, JPEG o WebP} → {hash} (sha256). Nello
 * stato della diretta l'immagine resta "om:<impronta>" e l'overlay la prende da /api/broadcast/live/image/<impronta>.
 * Con l'accesso fatto; al massimo 12 immagini l'ora (lo dice il database). Mai in cache.
 */
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "no-store" } as const;

export async function POST(request: Request) {
  try {
    const user = await userBackend();
    const body = await readJsonBody(request, LIVE_IMAGE_MAX + 200);
    const data = body.ok && body.value && typeof body.value === "object" ? (body.value as { data?: unknown }).data : undefined;
    if (!isLiveImageData(data)) throw new LiveError("invalid");
    return NextResponse.json({ hash: await user.imagePut(data) }, { headers: HEADERS });
  } catch (e) {
    const code = e instanceof LiveError ? e.code : "error";
    if (!(e instanceof LiveError)) console.error("[broadcast-live] image:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: code }, { status: LIVE_ERROR_STATUS[code], headers: HEADERS });
  }
}
