"use client";

import { useState, useSyncExternalStore } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import type { AnalyticsLabels } from "@/lib/analyticsLabels";
import type { Locale } from "@/lib/i18n";

/**
 * Tasto "Sei interessato al tool?" della pagina /analytics (02/10/2026, Pierluigi: "un bel tasto sia sopra che sotto
 * […] così raccogliamo i numeri di chi vorrebbe il tool"). Le due copie sono legate: premuta una, anche l'altra dice
 * "ti abbiamo contato". Il numero degli interessati non si mostra (Pierluigi: "non voglio si vedano il numero di
 * interessati"): la funzione del database dice solo se la persona è nuova, i totali li legge lo staff.
 *
 * Il conteggio lo fa il database (`analytics_interest_add`, blocco INTERESSE ANALYTICS di schema.sql): una volta per
 * browser, con un numero a caso tenuto nel localStorage, e una volta per account se c'è l'accesso. Niente email, niente
 * IP. Prima della migrazione (funzione mancante) il tasto dice che il conteggio non è ancora attivo.
 */
const STORE = "originsmeta.analyticsInterest.v1";
const CHANGED = "originsmeta:analytics-interest";

type Status = "idle" | "sending" | "done" | "already" | "error" | "rateLimited" | "unavailable";
type Saved = { key: string; done?: boolean };

function readSaved(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "null") as Saved | null;
    return v && typeof v.key === "string" && /^[0-9a-f]{32}$/.test(v.key) ? v : null;
  } catch {
    return null;
  }
}
function writeSaved(s: Saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    // senza memoria del browser si conta lo stesso; al massimo la persona può ricontarsi da un'altra scheda
  }
}
function newKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGED, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener("storage", cb);
  };
};

export function AnalyticsInterest({
  locale,
  placement,
  labels,
  privacyHref,
}: {
  locale: Locale;
  placement: "top" | "bottom";
  labels: AnalyticsLabels["interest"];
  privacyHref: string;
}) {
  // già contato in questo browser (anche dall'altra copia del tasto): letto dal localStorage, mai durante il rendering sul server
  const counted = useSyncExternalStore(subscribe, () => Boolean(readSaved()?.done), () => false);
  const [status, setStatus] = useState<Status>("idle");

  async function send() {
    const sb = supabaseBrowser();
    if (!sb || status === "sending") return;
    const saved = readSaved();
    const key = saved?.key ?? newKey();
    if (!saved) writeSaved({ key });
    setStatus("sending");
    const { data, error } = await sb.rpc("analytics_interest_add", { p_client: key, p_locale: locale, p_source: placement });
    if (error || typeof data !== "boolean") {
      const missing = ["PGRST202", "42883", "42P01"].includes(error?.code ?? "");
      setStatus(missing ? "unavailable" : /rate_limited/.test(error?.message ?? "") ? "rateLimited" : "error");
      return;
    }
    writeSaved({ key, done: true });
    setStatus(data ? "done" : "already");
    window.dispatchEvent(new Event(CHANGED));
    trackEvent("analytics_interest", { placement, added: data ? "yes" : "no" });
  }

  const thanks = status === "done" ? labels.done : status === "already" || counted ? labels.already : null;
  const problem = status === "error" ? labels.error : status === "rateLimited" ? labels.rateLimited : status === "unavailable" ? labels.unavailable : null;
  return (
    <div className="felt-panel-mint p-5 sm:p-6">
      <p className="t-section text-chalk">{labels.question}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {thanks ? (
          <p className="font-bold text-mint" role="status">
            {thanks}
          </p>
        ) : (
          <button type="button" className="btn btn-primary" onClick={send} disabled={status === "sending"} aria-busy={status === "sending"}>
            {status === "sending" ? labels.sending : labels.button}
          </button>
        )}
      </div>
      {problem ? (
        <p className="mt-2 text-sm text-gold" role="alert">
          {problem}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-pale-muted">
        {labels.note}{" "}
        <a href={privacyHref} className="link-mint">
          {labels.privacyLink}
        </a>
      </p>
    </div>
  );
}
