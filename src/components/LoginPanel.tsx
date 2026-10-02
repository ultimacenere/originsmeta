"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { isCaptchaError, turnstileEnabled } from "@/lib/turnstile";
import { authErrorKind, cleanOtp, OTP_MAX_DIGITS, otpErrorKind, type AuthErrorKind, type LoginLabels, type OtpErrorKind } from "@/lib/loginLabels";
import { countsOnArrival, isNewAccount, navigationType, trackEvent, withAuthSignal, type AuthMethod } from "@/lib/analytics";
import { useMounted } from "@/lib/useMounted";
import { DiscordLogo } from "./DiscordButton";
import { Turnstile } from "./Turnstile";

export type { LoginLabels };

type Status = "idle" | "sent" | "error" | "providerError" | "rateLimited" | "captchaError";
type Via = "discord" | "email";
/** Esito del codice dell'email: quello di Supabase (`otpErrorKind`) più i due controlli fatti prima di chiamarlo. */
type CodeStatus = OtpErrorKind | "format" | "needsEmail" | null;

/** Tipi di errore del codice come parametro `kind` dell'evento login_error. */
const CODE_ERROR_KIND: Record<Exclude<CodeStatus, null>, string> = {
  invalid: "code_invalid",
  tooMany: "code_too_many",
  generic: "code_error",
  format: "code_format",
  needsEmail: "code_no_email",
};

/** Supabase accetta un link per indirizzo al minuto (README, "Configurazione Auth su Supabase"). */
const RESEND_AFTER_MS = 60_000;

/** Tipi di errore del ritorno come parametro `kind` dell'evento login_error (snake_case, come gli altri valori). */
const ERROR_KIND: Record<AuthErrorKind, string> = {
  expired: "expired",
  otherBrowser: "other_browser",
  discordCancelled: "discord_cancelled",
  discord: "discord",
  generic: "generic",
};

/** Misura (MIS-11): un errore mostrato dal pannello, mandato dal punto in cui il pannello lo mostra (un invio fallito due volte conta due volte). */
function reportLoginError(kind: string, method: AuthMethod | undefined) {
  trackEvent("login_error", { kind, method });
}

/** Solo percorsi interni, con le stesse regole del ritorno /auth/callback. */
function safePath(raw: string | null): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : null;
}

/**
 * Accesso con Discord (OAuth) o con link usa e getta via email. Dopo l'accesso si torna a `next`
 * (quello dell'indirizzo, se c'è: il tasto "Accedi" dell'header lo porta con sé).
 *
 * Il link via email è protetto dal CAPTCHA Turnstile quando è configurato (vedi `src/lib/turnstile.ts`):
 * senza chiave del sito il widget non compare e il modulo si comporta come prima. Discord non ne ha
 * bisogno, perché l'autenticazione avviene sul loro dominio. Se il widget non si disegna entro 8 secondi
 * (scudi del browser, reti che bloccano Cloudflare) il pannello lo dice e lascia comunque provare.
 *
 * Dopo l'invio: messaggio con l'indirizzo, spam e Promozioni, e "Invia di nuovo" che si sblocca dopo 60 secondi.
 * Gli errori che arrivano dal ritorno (`?error=<tipo>`, vedi `authErrorKind`) hanno ciascuno il suo messaggio.
 *
 * Codice dell'email (dal 02/10/2026, vedi `cleanOtp` in loginLabels.ts): dopo l'invio compare il campo per il codice
 * che arriva nella stessa email del link; prima, "Hai già il codice?" lo apre (chi torna alla pagina dopo che il
 * telefono l'ha ricaricata). Il codice si verifica qui, nel browser, con l'indirizzo scritto nel campo email: niente
 * PKCE, quindi entra questo browser qualunque sia il dispositivo su cui si legge la posta. Poi si va a `next` con una
 * navigazione completa e il segnale della misura, come dal ritorno /auth/callback.
 */
export function LoginPanel({ next, labels, locale }: { next: string; labels: LoginLabels; locale?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pending, setPending] = useState<Via | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaBroken, setCaptchaBroken] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [code, setCode] = useState("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeStatus, setCodeStatus] = useState<CodeStatus>(null);
  const [verifying, setVerifying] = useState(false);
  const mounted = useMounted();
  // serve per gli errori `?error=`, che arrivano sempre con una navigazione completa da /auth/callback
  const params = mounted ? new URLSearchParams(window.location.search) : null;

  // Errore dal ritorno: il tipo è già nella query; se Supabase ha lasciato i dettagli nel frammento (#error=…), valgono quelli.
  const hash = mounted ? new URLSearchParams(window.location.hash.replace(/^#/, "")) : null;
  const fromQuery = authErrorKind(params?.get("error"));
  const fromHash = authErrorKind(hash?.get("error"), hash?.get("error_code"), params?.get("via"));
  const urlError: AuthErrorKind | null = status === "idle" && !pending ? ((fromQuery === "generic" ? fromHash : null) ?? fromQuery ?? fromHash) : null;

  /* Misura del percorso di accesso (MIS-11): l'errore arrivato dal ritorno (/auth/callback, sempre con `via`) si conta
     una volta sola per pagina, anche se ricompare tornando indietro dalla cache del browser (pageshow), e solo
     all'arrivo: `?error=` resta nell'indirizzo (il messaggio deve restare mentre si scrive l'email), quindi un
     ricaricamento o un ritorno con avanti/indietro lo rimostrano ma non lo ricontano (`countsOnArrival`, revisione
     dell'integrazione dell'Ondata 2). Gli errori di questa pagina li manda `reportLoginError` dove il pannello
     imposta lo stato. */
  const urlVia = params?.get("via");
  const urlErrorCounted = useRef(false);
  useEffect(() => {
    if (!urlError || urlErrorCounted.current) return;
    urlErrorCounted.current = true;
    if (!countsOnArrival(navigationType())) return;
    reportLoginError(ERROR_KIND[urlError], urlVia === "discord" || urlVia === "email" ? urlVia : undefined);
  }, [urlError, urlVia]);

  // Conto alla rovescia per "Invia di nuovo": orologio a parete, così resta giusto anche con la scheda in secondo piano.
  useEffect(() => {
    if (!resendAt) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now >= resendAt) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, [resendAt]);

  // Tornando indietro da Discord la pagina può essere ripresa dalla cache del browser con i tasti ancora bloccati.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Il ritorno si calcola al clic, non nel render: arrivando a /login con un <Link> (tasto Accedi dell'header,
  // "Accedi per votare"…) il primo render vede ancora l'indirizzo della pagina di prima, senza ?next.
  const backPath = () => safePath(new URLSearchParams(window.location.search).get("next")) ?? next;
  const redirectTo = (via: Via) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(backPath())}&via=${via}`;
  // Se il widget non si carica (rete bloccata, estensione) non si tiene l'utente fuori: si lascia provare.
  const needsCaptcha = turnstileEnabled && !captchaBroken;
  const waitSeconds = resendAt ? Math.max(0, Math.ceil((resendAt - clock) / 1000)) : 0;
  const sameAddress = sentTo !== "" && email.trim().toLowerCase() === sentTo.toLowerCase();
  const afterSend = (status === "sent" || status === "rateLimited") && sameAddress;
  const coolingDown = afterSend && waitSeconds > 0;

  const startCooldown = () => {
    const now = Date.now();
    setClock(now);
    setResendAt(now + RESEND_AFTER_MS);
  };

  const discord = async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    trackEvent("login_start", { method: "discord" });
    setPending("discord");
    setStatus("idle");
    const { data, error } = await sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: redirectTo("discord"), skipBrowserRedirect: true } });
    if (error || !data.url) {
      setPending(null);
      setStatus("providerError");
      reportLoginError("discord_start", "discord");
      return;
    }
    // Se il provider non è attivo su Supabase l'endpoint risponde 400 (JSON) invece di rimandare a Discord:
    // meglio dirlo qui che mostrare la pagina d'errore grezza. Un redirect (opaqueredirect) significa "tutto ok".
    try {
      const probe = await fetch(data.url, { redirect: "manual", credentials: "omit" });
      if (probe.status >= 400) {
        setPending(null);
        setStatus("providerError");
        reportLoginError("discord_start", "discord");
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
    if (!sb || !address || coolingDown) return;
    if (needsCaptcha && !captchaToken) {
      setStatus("captchaError");
      reportLoginError("captcha", "email");
      return;
    }
    setPending("email");
    setCodeStatus(null);
    const { error } = await sb.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: redirectTo("email"), shouldCreateUser: true, ...(captchaToken ? { captchaToken } : {}) },
    });
    setPending(null);
    // Il token Turnstile vale una volta sola: dopo ogni tentativo il widget riparte da capo.
    if (turnstileEnabled) {
      setCaptchaToken(null);
      setResetSignal((n) => n + 1);
    }
    if (!error) {
      // misura: per l'email l'accesso "parte" quando il link è spedito (l'indirizzo non va mai nei parametri)
      trackEvent("login_start", { method: "email" });
      setSentTo(address);
      setStatus("sent");
      // un link nuovo porta un codice nuovo: quello scritto prima non vale più
      setCode("");
      setCodeStatus(null);
      startCooldown();
      return;
    }
    // Supabase accetta una richiesta per indirizzo al minuto: meglio dirlo che mostrare un errore generico.
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      setSentTo(address);
      setStatus("rateLimited");
      startCooldown();
      reportLoginError("rate_limited", "email");
      return;
    }
    const captchaFailed = isCaptchaError(error);
    setStatus(captchaFailed ? "captchaError" : "error");
    reportLoginError(captchaFailed ? "captcha" : "email_send", "email");
  };

  const codeFailed = (kind: Exclude<CodeStatus, null>) => {
    setCodeStatus(kind);
    reportLoginError(CODE_ERROR_KIND[kind], "email");
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb || verifying) return;
    const address = email.trim();
    if (!address) return codeFailed("needsEmail");
    const token = cleanOtp(code);
    if (!token) return codeFailed("format");
    setVerifying(true);
    setCodeStatus(null);
    const { data, error } = await sb.auth.verifyOtp({ email: address, token, type: "email" });
    if (error || !data.user) {
      setVerifying(false);
      codeFailed(otpErrorKind(error));
      return;
    }
    // Navigazione completa, come dal ritorno /auth/callback: le pagine renderizzate sul server leggono i cookie appena
    // scritti dal client, e il segnale ?om_auth= fa contare sign_up o login all'arrivo (`consumeAuthSignal`).
    // `verifying` resta acceso fino al cambio di pagina.
    window.location.assign(withAuthSignal(backPath(), isNewAccount(data.user, "email") ? "sign_up" : "login", "email"));
  };

  if (!supabaseEnabled) return <p className="card-night p-6 text-pale-muted">{labels.disabled}</p>;

  const busy = pending !== null;
  const submitLabel = pending === "email" ? labels.sending : afterSend ? labels.resend : labels.magicLink;
  const waitingForCaptcha = turnstileEnabled && !captchaBroken && !captchaToken && !coolingDown && !busy;
  // Il conto alla rovescia sta in una riga sotto il tasto e non dentro: un tasto disabilitato è volutamente sbiadito.
  const hintIds = [coolingDown ? "login-resend-hint" : "", waitingForCaptcha ? "login-captcha-hint" : ""].filter(Boolean).join(" ");

  const urlErrorText: Record<AuthErrorKind, string> = {
    expired: labels.errorExpired,
    otherBrowser: labels.errorOtherBrowser,
    discordCancelled: labels.errorDiscordCancelled,
    discord: labels.providerError,
    generic: labels.error,
  };

  // Messaggi: errori con .alert-bad (leggibili, non più magenta su blu a 2,7:1), avvisi in giallo, conferma con .alert-good.
  let message: ReactNode = null;
  if (status === "sent") message = <Note tone="good">{labels.sentTo.replace("{email}", sentTo)}</Note>;
  else if (status === "rateLimited") message = <Note tone="warn">{labels.rateLimited}</Note>;
  else if (status === "captchaError") message = captchaBroken ? <Note tone="bad">{labels.captchaRequired}</Note> : <Note tone="bad">{labels.captchaError}</Note>;
  else if (status === "providerError") message = <Note tone="bad">{labels.providerError}</Note>;
  else if (status === "error") message = <Note tone="bad">{labels.error}</Note>;
  else if (urlError) message = <Note tone={urlError === "discordCancelled" ? "warn" : "bad"}>{urlErrorText[urlError]}</Note>;
  // Il CAPTCHA che non si disegna si segnala finché il link non è partito (dopo, non serve più allarmare).
  const brokenNotice = captchaBroken && status !== "sent" && status !== "captchaError" ? <Note tone="warn">{labels.captchaBroken}</Note> : null;

  // Il campo del codice si apre da solo dopo un invio (anche "link già partito"), altrimenti con "Hai già il codice?".
  const showCode = codeOpen || sentTo !== "";
  const codeErrorText: Record<Exclude<CodeStatus, null>, string> = {
    invalid: labels.codeInvalid,
    tooMany: labels.codeTooMany,
    generic: labels.error,
    format: labels.codeFormat,
    needsEmail: labels.codeNeedsEmail,
  };
  // l'esito del codice è la cosa più recente che l'utente ha fatto: prende il posto degli altri messaggi
  if (codeStatus) message = <Note tone={codeStatus === "tooMany" ? "warn" : "bad"}>{codeErrorText[codeStatus]}</Note>;

  return (
    <div className="card-night p-6 sm:p-8">
      <button
        type="button"
        onClick={discord}
        disabled={busy}
        aria-busy={pending === "discord"}
        className="btn-discord w-full justify-center py-3.5 text-base disabled:opacity-60"
      >
        <DiscordLogo className="h-5 w-5" />
        <span>{pending === "discord" ? labels.redirecting : labels.discord}</span>
      </button>

      <p className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-pale-muted">
        <span className="h-px flex-1 bg-chalk/15" />
        {labels.or}
        <span className="h-px flex-1 bg-chalk/15" />
      </p>

      <form onSubmit={magic} className="flex flex-col gap-3" aria-busy={pending === "email"}>
        {/* campo e tasto uno sotto l'altro, a tutta larghezza come Discord: affiancati il testo del tasto andava a capo */}
        <div className="flex flex-col gap-2">
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
          <button
            type="submit"
            disabled={busy || coolingDown || (needsCaptcha && !captchaToken)}
            aria-busy={pending === "email"}
            aria-describedby={hintIds || undefined}
            className="btn btn-primary"
          >
            {submitLabel}
          </button>
        </div>
        {coolingDown ? (
          <p id="login-resend-hint" className="text-xs tabular-nums text-pale-muted">
            {labels.resendIn.replace("{s}", String(waitSeconds))}
          </p>
        ) : null}
        <Turnstile
          onToken={(token) => {
            setCaptchaToken(token);
            // un token arrivato in ritardo vuol dire che il widget funziona: via l'avviso
            if (token) setCaptchaBroken(false);
          }}
          onError={() => setCaptchaBroken(true)}
          resetSignal={resetSignal}
          locale={locale}
          className="[&>iframe]:max-w-full"
        />
        {waitingForCaptcha ? (
          <p id="login-captcha-hint" className="text-xs text-pale-muted">
            {labels.captchaWaiting}
          </p>
        ) : null}
      </form>

      {showCode ? (
        <form onSubmit={verifyCode} className="mt-4 flex flex-col gap-2" aria-busy={verifying}>
          <label htmlFor="login-code" className="text-sm font-semibold text-pale">
            {labels.codeLabel}
          </label>
          <input
            id="login-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            spellCheck={false}
            // spazi e trattini incollati con il codice si tolgono al controllo (`cleanOtp`)
            maxLength={OTP_MAX_DIGITS + 10}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (codeStatus) setCodeStatus(null);
            }}
            aria-describedby="login-code-hint"
            aria-invalid={codeStatus !== null || undefined}
            className="rounded-lg border border-sky bg-night px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-pale"
          />
          <p id="login-code-hint" className="text-xs text-pale-muted">
            {labels.codeHint}
          </p>
          <button type="submit" disabled={verifying || code.trim() === ""} aria-busy={verifying} className="btn btn-primary">
            {verifying ? labels.codeChecking : labels.codeSubmit}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCodeOpen(true)}
          className="mt-3 text-sm font-semibold text-mint underline underline-offset-2 hover:text-sky"
        >
          {labels.codeToggle}
        </button>
      )}

      {/* regione sempre presente (vuota non occupa spazio): i messaggi inseriti dopo vengono letti dagli screen reader */}
      <div className="space-y-3 [&:not(:empty)]:mt-4" aria-live="polite">
        {message}
        {brokenNotice}
      </div>
      <p className="mt-4 text-xs text-pale-muted">{labels.backHint}</p>
    </div>
  );
}

/**
 * Riquadro di messaggio: errori e conferme con .alert-bad / .alert-good del design system (testo gesso, 10:1),
 * avvisi (link già partito, Discord annullato, CAPTCHA che non si carica) con la stessa forma ma in celeste:
 * fondo sky al 12% e testo gesso (8,9:1 su night, misurato), cornice da 2 px come gli altri due. Non più in
 * oro: la palette riserva l'oro alle Leggendarie e all'evento evidenziato, e un avviso non deve somigliarci.
 */
function Note({ tone, children }: { tone: "good" | "warn" | "bad"; children: ReactNode }) {
  if (tone === "bad") return <p className="alert-bad">{children}</p>;
  if (tone === "good") return <p className="alert-good">{children}</p>;
  return <p className="rounded-[10px] border-2 border-sky/60 bg-sky/[0.12] px-3.5 py-2.5 text-sm font-semibold leading-snug text-chalk">{children}</p>;
}
