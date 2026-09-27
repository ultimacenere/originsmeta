import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseEnabled } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";
import { readInboxStatus } from "@/lib/community/inboxQueries";
import { unreadNotificationCount } from "@/lib/community/notificationQueries";

/**
 * Stato della casella messaggi di chi guarda (26/09/2026, pacchetto INBOX): numero delle conversazioni da leggere e,
 * per lo staff, quello della casella dello staff. Lo chiede il browser (`InboxIndicator`: menu dell'account
 * nell'header, link "Scrivi a questo utente" su /u/<nome>), perché l'header è lo stesso delle pagine statiche e il
 * layout non legge Supabase.
 *
 * GET → { loggedIn, unread, staff, staffUnread }. Privata e mai in cache (dipende dalla sessione nei cookie). Senza un
 * cookie di sessione Supabase (nomi che iniziano con sb-) risponde subito, senza chiamare Supabase. Con la migrazione
 * non ancora applicata (o un errore del database) 503: il menu semplicemente non mostra il numero.
 * `notifications` (pacchetto SEGUI, 27/09/2026): avvisi da leggere dei profili seguiti, che la busta somma ai messaggi;
 * 0 prima della migrazione del pacchetto o con un errore degli avvisi, senza cambiare il resto della risposta.
 * Quando invece non si legge la casella messaggi la rotta risponde 503 e la busta tace del tutto, avvisi compresi
 * (revisione del 27/09/2026, scelta voluta): il 200 è la prova che la casella funziona, e `FeedbackWidget` ci si basa per
 * promettere che la risposta dello staff arriverà lì. Un 200 con i soli avvisi farebbe una promessa falsa; il caso è
 * raro (casella già migrata e database giù solo per quella lettura) e gli avvisi restano in /account/messages.
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
  const [status, notifications] = await Promise.all([readInboxStatus(supabase), unreadNotificationCount(supabase, user.id)]);
  if (!status.ok) return NextResponse.json({ error: status.error }, { status: 503, headers });
  return NextResponse.json({ loggedIn: true, ...status.data, notifications }, { headers });
}
