import { IMAGE_HASH_RE, isLiveId, isLiveImageData } from "@/lib/broadcast/live";
import { publicBackend } from "@/lib/broadcast/liveServer";

/**
 * Broadcasting OM in diretta (05/11/2026): un'immagine di sponsor caricata dalla regia, per l'overlay di OBS.
 * GET /api/broadcast/live/image/<impronta sha256>?id=<id della diretta> → i byte dell'immagine (PNG, JPEG o WebP).
 * L'impronta è il contenuto: la stessa risposta vale per sempre (cache immutabile). 404 se non c'è.
 */
export const dynamic = "force-dynamic";

const MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" } as const;

export async function GET(request: Request, { params }: { params: Promise<{ hash: string }> }): Promise<Response> {
  const { hash } = await params;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!IMAGE_HASH_RE.test(hash) || !isLiveId(id)) return new Response("Not Found", { status: 404 });
  let data: string | null = null;
  try {
    data = await publicBackend().imageGet(id, hash);
  } catch {
    return new Response("Unavailable", { status: 503, headers: { "cache-control": "no-store" } });
  }
  if (!isLiveImageData(data)) return new Response("Not Found", { status: 404, headers: { "cache-control": "public, max-age=30" } });
  const m = /^data:image\/(png|jpeg|webp);base64,/.exec(data);
  const type = MIME[(m?.[1] ?? "png") as keyof typeof MIME];
  const bytes = Buffer.from(data.slice(data.indexOf(",") + 1), "base64");
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff", "access-control-allow-origin": "*" },
  });
}
