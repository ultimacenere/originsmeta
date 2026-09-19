"use client";

import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { isCaptchaError, turnstileEnabled } from "@/lib/turnstile";
import type { LoginLabels } from "@/lib/loginLabels";
import { useMounted } from "@/lib/useMounted";
import { DiscordLogo } from "./DiscordButton";
import { Turnstile } from "./Turnstile";

export type { LoginLabels };

type Status = "idle" | "sending" | "sent" | "error" | "providerError" | "rateLimited" | "captchaError";

function safePath(raw: string | null): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

/**
 * Accesso con Discord (OAuth) o con link usa e getta via email. Dopo l'accesso si torna a `next`.
 *
 * Il link via email è protetto dal CAPTCHA Turnstile quando è configurato (vedi `src/lib/turnstile.ts`):
 * senza chiave del sito il widget non compare e il modulo si comporta come prima. Discord non ne ha
 * bisogno, perché l'autenticazione avviene sul loro dominio.
 */
export function LoginPanel({ next, labels, locale }: { next: string; labels: LoginLabels; locale?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaBroken, setCaptchaBroken] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const mounted = useMounted();
  const params = mounted ? new URLSearchParams(window.location.search) : null;
  const target = safePath(params?.get("next") ?? null) ?? next;
  const urlError = status === "idle" && Boolean(params?.get("error"));

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;
  // Se il widget non si carica (rete bloccata, estensione) non si tiene l'utente fuori: si lascia provare.
  const needsCaptcha = turnstileEnabled && !captchaBroken;

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
    if (needsCaptcha && !captchaToken) {
      setStatus("captchaError");
      return;
    }
    setStatus("sending");
    const { error } = await sb.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true, ...(captchaToken ? { captchaToken } : {}) },
    });
    // Il token Turnstile vale una volta sola: dopo ogni tentativo il widget riparte da capo.
    if (turnstileEnabled) {
      setCaptchaToken(null);
      setResetSignal((n) => n + 1);
    }
    // Supabase accetta una richiesta per indirizzo al minuto: meglio dirlo che mostrare un errore generico.
    setStatus(!error ? "sent" : isCaptchaError(error) ? "captchaError" : error.status === 429 || error.code === "over_email_send_rate_limit" ? "rateLimited" : "error");
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

      <form onSubmit={magic} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
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
          <button type="submit" disabled={busy || status === "sent" || (needsCaptcha && !captchaToken)} className="btn btn-mint justify-center disabled:opacity-60">
            {busy ? labels.sending : labels.magicLink}
          </button>
        </div>
        <Turnstile
          onToken={setCaptchaToken}
          onError={() => setCaptchaBroken(true)}
          resetSignal={resetSignal}
          locale={locale}
          className="[&>iframe]:max-w-full"
        />
      </form>

      {status === "sent" ? <p className="mt-4 rounded-lg bg-mint-soft px-3 py-2 text-sm text-ink" aria-live="polite">{labels.sent}</p> : null}
      {status === "error" || urlError ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson" aria-live="polite">{labels.error}</p> : null}
      {status === "providerError" ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson" aria-live="polite">{labels.providerError}</p> : null}
      {status === "captchaError" ? <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson" aria-live="polite">{labels.captchaError}</p> : null}
      {status === "rateLimited" ? <p className="mt-4 rounded-lg bg-gold/30 px-3 py-2 text-sm text-pale" aria-live="polite">{labels.rateLimited}</p> : null}
      <p className="mt-4 text-xs text-pale-muted">{labels.backHint}</p>
    </div>
  );
}
