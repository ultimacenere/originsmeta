import { NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { applySteamPending, readSteamPending } from "@/lib/steam/session";
import { browserLocale, localeFromPath, requestOrigin } from "@/lib/steam/routes";

const noStore = { "cache-control": "no-store" };

/**
 * Lo Steam in sospeso del primo accesso (18/11/2026, firstLogin.ts e pending.ts):
 * - GET: la pagina di accesso chiede se il cookie firmato c'è ancora (meno di 10 minuti) e il nome del profilo Steam da
 *   proporre. Mai lo SteamID: al browser basta sapere che la scelta è aperta.
 * - POST: dopo l'accesso con il codice dell'email (verificato nel browser, quindi senza passare da /auth/callback), collega
 *   lo Steam in sospeso all'iscritto della sessione e dice l'esito. Solo dalla stessa origine.
 */
export async function GET() {
  const pending = await readSteamPending();
  return NextResponse.json({ pending: Boolean(pending), name: pending?.name ?? null }, { headers: noStore });
}

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const from = request.headers.get("origin");
  if (from && from !== origin) return NextResponse.json({ outcome: "error" }, { status: 403, headers: noStore });
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return NextResponse.json({ outcome: "error" }, { status: 401, headers: noStore });
  // la lingua della pagina di accesso da cui arriva la richiesta (`{ page: "/it/login" }`), per la pagina del profilo
  const body = (await request.json().catch(() => null)) as { page?: unknown } | null;
  const locale = localeFromPath(typeof body?.page === "string" ? body.page : null) ?? browserLocale(request);
  const applied = await applySteamPending(supabase, locale, origin.startsWith("https:"));
  if (!applied) return NextResponse.json({ outcome: "expired" }, { headers: noStore });
  return NextResponse.json({ outcome: applied.outcome, path: applied.path }, { headers: noStore });
}
