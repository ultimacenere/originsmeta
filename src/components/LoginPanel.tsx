"use client";

import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";
import { DiscordLogo } from "./DiscordButton";

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

  if (!supabaseEnabled) return <p className="card-night p-6 text-pale-muted">{labels.disabled}</p>;

  const busy = status === "sending";
  return (
    <div className="card-night p-6 sm:p-8">
      <button type="button" onClick={discord} disabled={busy} className="btn-discord w-full justify-center py-3.5 text-base disabled:opacity-60">
        <DiscordLogo className="h-5 w-5" />
        <span>{labels.discord}</span>
      </button>

      <p className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-pale-muted">
        <span className="h-px flex-1 bg-chalk/15" />
        {labels.or}
        <span className="h-px flex-1 bg-chalk/15" />
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
          className="flex-1 rounded-lg border border-sky bg-night px-3 py-2.5 text-pale"
        />
        <button type="submit" disabled={busy || status === "sent"} className="btn btn-mint justify-center disabled:opacity-60">
          {busy ? labels.sending : labels.magicLink}
        </button>
      </form>

      {status === "sent" ? <p className="mt-4 rounded-lg bg-mint-soft px-3 py-2 text-sm text-ink" aria-live="polite">{labels.sent}</p> : null}
      {status === "error" || urlError ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson" aria-live="polite">{labels.error}</p> : null}
      {status === "providerError" ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson" aria-live="polite">{labels.providerError}</p> : null}
      {status === "rateLimited" ? <p className="mt-4 rounded-lg bg-gold/30 px-3 py-2 text-sm text-pale" aria-live="polite">{labels.rateLimited}</p> : null}
      <p className="mt-4 text-xs text-pale-muted">{labels.backHint}</p>
    </div>
  );
}
