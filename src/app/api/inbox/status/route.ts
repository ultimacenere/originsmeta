import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseEnabled } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";
import { readInboxStatus } from "@/lib/community/inboxQueries";

/**
 * Stato della casella messaggi di chi guarda (26/09/2026, pacchetto INBOX): numero delle conversazioni da leggere e,
 * per lo staff, quello della casella dello staff. Lo chiede il browser (`InboxIndicator`: menu dell'account
 * nell'header, link "Scrivi a questo utente" su /u/<nome>), perché l'header è lo stesso delle pagine statiche e il
 * layout non legge Supabase.
 *
 * GET → { loggedIn, unread, staff, staffUnread }. Privata e mai in cache (dipende dalla sessione nei cookie). Senza un
 * cookie di sessione Supabase (nomi che iniziano con sb-) risponde subito, senza chiamare Supabase. Con la migrazione
 * non ancora applicata (o un errore del database) 503: il menu semplicemente non mostra il numero.
 */
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store" };
const nobody = { loggedIn: false, unread: 0, staff: false, staffUnread: 0 };

export async function GET() {
  if (!supabaseEnabled) return NextResponse.json(nobody, { headers });
  const store = await cookies();
  if (!store.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.json(nobody, { headers });
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return NextResponse.json(nobody, { headers });
  const status = await readInboxStatus(supabase);
  if (!status.ok) return NextResponse.json({ error: status.error }, { status: 503, headers });
  return NextResponse.json({ loggedIn: true, ...status.data }, { headers });
}
