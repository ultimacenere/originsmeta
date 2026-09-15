"use client";

import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";

export type LoginLabels = {
  discord: string;
  or: string;
  email: string;
  emailPlaceholder: string;
  magicLink: string;
  sending: string;
  sent: string;
  error: string;
  providerError: string;
  rateLimited: string;
  disabled: string;
  backHint: string;
};

type Status = "idle" | "sending" | "sent" | "error" | "providerError" | "rateLimited";

function safePath(raw: string | null): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

/** Accesso con Discord (OAuth) o con link usa e getta via email. Dopo l'accesso si torna a `next`. */
export function LoginPanel({ next, labels }: { next: string; labels: LoginLabels }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const mounted = useMounted();
  const params = mounted ? new URLSearchParams(window.location.search) : null;
  const target = safePath(params?.get("next") ?? null) ?? next;
  const urlError = status === "idle" && Boolean(params?.get("error"));

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;

  const discord = async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    setStatus("sending");
    const { data, error } = await sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: redirectTo(), skipBrowserRedirect: true } });
    if (error || !data.url) {
      setStatus("providerError");
      return;
    }
    // Se il provider non è attivo su Supabase l'endpoint risponde 400 (JSON) invece di rimandare a Discord:
    // meglio dirlo qui che mostrare la pagina d'errore grezza. Un redirect (opaqueredirect) significa "tutto ok".
    try {
      const probe = await fetch(data.url, { redirect: "manual", credentials: "omit" });
      if (probe.status >= 400) {
        setStatus("providerError");
        return;
      }
    } catch {
      /* rete o CORS: si prova comunque */
    }
    window.location.assign(data.url);
  };

  const magic = async (e: FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    const address = email.trim();
    if (!sb || !address) return;
    setStatus("sending");
    const { error } = await sb.auth.signInWithOtp({ email: address, options: { emailRedirectTo: redirectTo(), shouldCreateUser: true } });
    // Supabase accetta una richiesta per indirizzo al minuto: meglio dirlo che mostrare un errore generico.
    setStatus(!error ? "sent" : error.status === 429 || error.code === "over_email_send_rate_limit" ? "rateLimited" : "error");
  };

  if (!supabaseEnabled) return <p className="card-ivory p-6 text-ink-muted">{labels.disabled}</p>;

  const busy = status === "sending";
  return (
    <div className="card-ivory p-6 sm:p-8">
      <button type="button" onClick={discord} disabled={busy} className="btn btn-ink w-full justify-center gap-2 py-3 text-base disabled:opacity-60">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a13 13 0 0 1 4.5 2.3 15.6 15.6 0 0 0-15.4 0 13 13 0 0 1 4.5-2.3L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.6 9 0 13.5.3 17.9a19.9 19.9 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 11.8 0l.5.4a12.7 12.7 0 0 1-2 1l1.3 2a19.9 19.9 0 0 0 6-3c.4-5.1-.7-9.5-3.4-13.5ZM8.5 15.2c-1.2 0-2.1-1.1-2.1-2.4s1-2.4 2.1-2.4c1.2 0 2.2 1.1 2.1 2.4 0 1.3-.9 2.4-2.1 2.4Zm7 0c-1.2 0-2.1-1.1-2.1-2.4s1-2.4 2.1-2.4c1.2 0 2.2 1.1 2.1 2.4 0 1.3-.9 2.4-2.1 2.4Z" />
        </svg>
        {labels.discord}
      </button>

      <p className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-muted">
        <span className="h-px flex-1 bg-ink/15" />
        {labels.or}
        <span className="h-px flex-1 bg-ink/15" />
      </p>

      <form onSubmit={magic} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="login-email" className="sr-only">
          {labels.email}
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.emailPlaceholder}
          className="flex-1 rounded-lg border border-ink/20 bg-ivory px-3 py-2.5 text-ink"
        />
        <button type="submit" disabled={busy || status === "sent"} className="btn btn-mint justify-center disabled:opacity-60">
          {busy ? labels.sending : labels.magicLink}
        </button>
      </form>

      {status === "sent" ? <p className="mt-4 rounded-lg bg-mint-soft px-3 py-2 text-sm text-ink" aria-live="polite">{labels.sent}</p> : null}
      {status === "error" || urlError ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson-deep" aria-live="polite">{labels.error}</p> : null}
      {status === "providerError" ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson-deep" aria-live="polite">{labels.providerError}</p> : null}
      {status === "rateLimited" ? <p className="mt-4 rounded-lg bg-gold/30 px-3 py-2 text-sm text-ink" aria-live="polite">{labels.rateLimited}</p> : null}
      <p className="mt-4 text-xs text-ink-muted">{labels.backHint}</p>
    </div>
  );
}
