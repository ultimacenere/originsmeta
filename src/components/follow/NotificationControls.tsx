"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { NotificationKind } from "@/lib/community/notifications";
import { trackEvent } from "@/lib/analytics";
import { announceInboxChange } from "@/components/inbox/InboxIndicator";

/**
 * Parti client della sezione "Notifiche" di /account/messages (pacchetto SEGUI, 27/09/2026). Si segna come letto con la
 * RPC security definer `notifications_mark_read`, chiamata dal browser con la sessione: una richiesta a parte, che non
 * ferma la navigazione verso la cosa notificata (una Server Action la farebbe aspettare). Dopo, la busta dell'header si
 * aggiorna subito (`announceInboxChange`).
 */

async function markRead(ids: number[] | null): Promise<boolean> {
  const sb = supabaseBrowser();
  if (!sb) return false;
  try {
    const { error } = await sb.rpc("notifications_mark_read", ids ? { p_ids: ids } : {});
    return !error;
  } catch {
    return false;
  }
}

/**
 * Un avviso: link alla cosa notificata. Il clic manda `notification_open` (tipo dell'avviso) e, se l'avviso era da
 * leggere, lo segna come letto.
 */
export function NotificationLink({ id, href, kind, unread, className, children }: { id: number; href: string; kind: NotificationKind; unread: boolean; className: string; children: ReactNode }) {
  const open = () => {
    trackEvent("notification_open", { kind });
    if (unread)
      void markRead([id]).then((ok) => {
        if (ok) announceInboxChange();
      });
  };
  return (
    <Link href={href} prefetch={false} onClick={open} className={className}>
      {children}
    </Link>
  );
}

/** "Segna tutte come lette": poi la pagina si ridisegna (dinamica) e la busta si aggiorna. */
export function MarkAllRead({ label, pendingLabel, errorLabel }: { label: string; pendingLabel: string; errorLabel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const run = () => {
    if (pending) return;
    setFailed(false);
    start(async () => {
      const ok = await markRead(null);
      if (!ok) {
        setFailed(true);
        return;
      }
      announceInboxChange();
      router.refresh();
    });
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" onClick={run} disabled={pending} aria-busy={pending} className="btn btn-ink text-xs">
        {pending ? pendingLabel : label}
      </button>
      {failed ? (
        <span role="alert" className="text-xs font-semibold text-bad">
          {errorLabel}
        </span>
      ) : null}
    </span>
  );
}
