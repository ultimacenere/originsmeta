"use client";

import { useState } from "react";
import { useMounted } from "@/lib/useMounted";
import type { Locale } from "@/lib/i18n";
import { SERVICE_NOTICE, serviceNoticeActive, serviceNoticeKey } from "@/lib/serviceNotice";

/**
 * Riga di avviso sotto l'header (07/10/2026): compare solo nella finestra di `SERVICE_NOTICE`, si chiude con la ×
 * e resta chiusa sullo stesso browser. Montata dopo l'idratazione (`useMounted`), quindi assente dall'HTML del
 * server: niente testo in più per Google e nessuno sfarfallio fra server e client. `data-nosnippet` per sicurezza.
 * Non è un dialog e non prende il focus: è un `status`, chi naviga da tastiera la incontra al suo posto.
 */
export function ServiceNotice({ locale }: { locale: Locale }) {
  const mounted = useMounted();
  const [closed, setClosed] = useState(false);
  if (!mounted || closed || !serviceNoticeActive(new Date())) return null;
  const key = serviceNoticeKey();
  try {
    if (window.localStorage.getItem(key) === "1") return null;
  } catch {
    // storage non disponibile (navigazione privata o bloccato): l'avviso si mostra lo stesso
  }
  const t = SERVICE_NOTICE.text[locale];
  const close = () => {
    setClosed(true);
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // senza storage la chiusura vale solo per questa pagina
    }
  };
  return (
    <div role="status" aria-live="polite" data-nosnippet className="border-b border-felt-line/70 bg-felt">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 sm:px-6">
        <p className="min-w-0 flex-1 text-sm leading-snug text-pale">
          <span className="kicker mr-2 text-pale-muted">{t.kicker}</span>
          {t.text} <span className="whitespace-nowrap text-pale-muted">({t.date})</span>
        </p>
        <button
          type="button"
          onClick={close}
          aria-label={t.close}
          title={t.close}
          className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg leading-none text-pale-muted hover:bg-night-3 hover:text-pale"
        >
          ×
        </button>
      </div>
    </div>
  );
}
