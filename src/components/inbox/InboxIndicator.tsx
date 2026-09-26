"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { badgeCount, badgeText, fillInbox, parseInboxStatus, staffInboxPath, type InboxStatus } from "@/lib/community/messages";
import { navLabelsFor } from "@/lib/inboxNavLabels";

/**
 * Numero dei non letti della casella messaggi (26/09/2026, pacchetto INBOX) nel browser: l'header è lo stesso delle
 * pagine statiche e il layout non legge Supabase, quindi lo stato arriva da `/api/inbox/status`.
 *
 * Una sola lettura condivisa da tutti i componenti della pagina (menu dell'account, link dello staff su /u): al primo
 * montaggio, al cambio di pagina e al ritorno sulla scheda, al massimo una volta al minuto; subito dopo un messaggio
 * mandato o letto (`announceInboxChange`, evento `originsmeta:inbox`). Legata all'utente: se cambia account nella
 * stessa scheda, il numero di prima sparisce.
 */

const EVENT = "originsmeta:inbox";
const MIN_GAP_MS = 60_000;

let owner: string | null = null;
let current: InboxStatus | null = null;
let lastAt = 0;
let inflight: Promise<void> | null = null;
let again = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

async function load(uid: string, force: boolean): Promise<void> {
  if (owner !== uid) {
    owner = uid;
    current = null;
    lastAt = 0;
    emit();
  }
  if (inflight) {
    // un messaggio letto o mandato mentre una lettura è in corso: si rilegge appena finisce
    if (force) again = true;
    return inflight;
  }
  if (!force && Date.now() - lastAt < MIN_GAP_MS) return;
  lastAt = Date.now();
  inflight = (async () => {
    try {
      const r = await fetch("/api/inbox/status", { cache: "no-store", credentials: "same-origin" });
      if (!r.ok) return; // migrazione non applicata o database giù: niente numero, niente errore
      const json = (await r.json()) as { loggedIn?: boolean };
      if (owner === uid) {
        current = json.loggedIn ? parseInboxStatus(json) : null;
        emit();
      }
    } catch {
      /* rete assente: resta il numero di prima */
    } finally {
      inflight = null;
      if (again) {
        again = false;
        void load(uid, true);
      }
    }
  })();
  return inflight;
}

/** Da chiamare dopo un messaggio mandato o una conversazione letta: il numero si aggiorna subito. */
export function announceInboxChange() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* fuori dal browser: niente da aggiornare */
  }
}

/** Stato della casella dell'utente `uid` (null finché non si sa, o senza accesso). */
export function useInboxStatus(uid: string | null | undefined): InboxStatus | null {
  const pathname = usePathname();
  const status = useSyncExternalStore(
    subscribe,
    () => (uid && owner === uid ? current : null),
    () => null,
  );
  useEffect(() => {
    if (uid) void load(uid, false);
  }, [uid, pathname]);
  useEffect(() => {
    if (!uid) return;
    const now = () => void load(uid, true);
    const visible = () => {
      if (document.visibilityState === "visible") void load(uid, false);
    };
    window.addEventListener(EVENT, now);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener(EVENT, now);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [uid]);
  return status;
}

/** Testo per i lettori di schermo: ", 2 conversazioni da leggere", oppure niente. */
export function inboxAriaSuffix(status: InboxStatus | null, locale: string): string {
  const n = badgeCount(status);
  if (n < 1) return "";
  const L = navLabelsFor(locale);
  return `, ${n === 1 ? L.unreadOne : fillInbox(L.unreadMany, { n })}`;
}

/** Pallino menta con il numero, accanto all'avatar (il numero intero lo legge `inboxAriaSuffix`). */
export function InboxCount({ status, className = "" }: { status: InboxStatus | null; className?: string }) {
  const text = badgeText(badgeCount(status));
  if (!text) return null;
  return (
    <span aria-hidden="true" className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-mint px-1 font-mono text-[10px] font-bold leading-none text-ink ${className}`}>
      {text}
    </span>
  );
}

/** Voci del menu dell'account: "Messaggi" (con il numero) e, per lo staff, "Messaggi dello staff". */
export function InboxMenuLinks({ locale, status }: { locale: string; status: InboxStatus | null }) {
  const L = navLabelsFor(locale);
  const mine = status?.unread ?? 0;
  const staff = status?.staff ? status.staffUnread : 0;
  const label = (text: string, n: number) => (n > 0 ? `${text}, ${n === 1 ? L.unreadOne : fillInbox(L.unreadMany, { n })}` : undefined);
  return (
    <>
      <Link href={`/${locale}/account#messages`} prefetch={false} className="nav-link nav-link-block flex items-center justify-between gap-2" aria-label={label(L.messages, mine)}>
        <span>{L.messages}</span>
        <InboxCount status={mine ? { unread: mine, staff: false, staffUnread: 0 } : null} />
      </Link>
      {status?.staff ? (
        <Link href={staffInboxPath(locale)} prefetch={false} className="nav-link nav-link-block flex items-center justify-between gap-2" aria-label={label(L.staffInbox, staff)}>
          <span>{L.staffInbox}</span>
          <InboxCount status={staff ? { unread: staff, staff: false, staffUnread: 0 } : null} />
        </Link>
      ) : null}
    </>
  );
}

/**
 * "Scrivi a questo utente" sulla pagina pubblica di un iscritto (/u/<nome>, ISR): compare solo allo staff, quindi si
 * decide nel browser. Porta al modulo "Nuovo messaggio a un utente" dell'area staff con il nome già scritto.
 */
export function StaffMessageLink({ locale, username, className = "mt-3" }: { locale: string; username: string | null | undefined; className?: string }) {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setUid(data.session?.user.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);
  const status = useInboxStatus(uid);
  if (!username || !status?.staff) return null;
  // il paragrafo (con il suo margine, `className`) c'è solo quando c'è il link: niente spazio vuoto per chi non è dello staff
  return (
    <p className={className}>
      <Link href={`${staffInboxPath(locale)}?to=${encodeURIComponent(username)}#new`} prefetch={false} className="btn btn-ink text-xs">
        {navLabelsFor(locale).writeToUser}
      </Link>
    </p>
  );
}
