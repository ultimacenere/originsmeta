"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { turnstileEnabled } from "@/lib/turnstile";
import { Turnstile } from "@/components/Turnstile";
import {
  GUIDE_CODE_MAX,
  GUIDE_CODE_RE,
  GUIDE_DISCORD_MAX,
  GUIDE_DISCORD_RE,
  GUIDE_EMAIL_MAX,
  GUIDE_EMAIL_RE,
  GUIDE_LINK_MAX,
  GUIDE_NAME_MAX,
  GUIDE_NAME_MIN,
  GUIDE_STAFF_EMAIL,
  GUIDE_TEXT_MAX,
  GUIDE_TEXT_MIN,
  GUIDE_TITLE_MAX,
  GUIDE_TITLE_MIN,
  guideLink,
  type GuideApiError,
  type GuideSubmitLabels,
} from "@/lib/guideSubmitLabels";

/**
 * Modulo "Mandaci la tua guida" (/guides/submit; diretta Twitch del 23/09/2026, "modulo nel canale staff").
 * La guida va a `/api/guide-submission`, che la gira al canale Discord privato dello staff con il testo completo
 * in un file allegato; lo staff la legge e la pubblica a mano come le altre guide.
 *
 * - Bozza salvata da sola nel browser mentre si scrive (localStorage, chiave `originsmeta.guideDraft.v1`): una
 *   guida lunga non si perde chiudendo la scheda o per un errore di rete. Email e Discord non entrano nella bozza.
 *   Dopo l'invio riuscito la bozza si cancella.
 * - All'apertura chiede alla rotta se le guide arrivano davvero (webhook configurato): se no lo dice subito, con
 *   l'email dello staff come alternativa, invece di far scrivere una guida che non partirebbe.
 * - Gli stessi controlli della rotta, nello stesso ordine, prima di spedire: l'errore porta il focus sul campo.
 * - Accessibilità: ogni campo ha l'etichetta e il suggerimento collegati, errori in un contenitore `role="alert"`
 *   sempre presente, esito in un'area `aria-live`, focus sul titolo del ringraziamento dopo l'invio.
 */

const DRAFT_KEY = "originsmeta.guideDraft.v1";

type Draft = { title: string; text: string; link: string; code: string; name: string };
const EMPTY: Draft = { title: "", text: "", link: "", code: "", name: "" };
const DRAFT_FIELDS = Object.keys(EMPTY) as (keyof Draft)[];

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Record<string, unknown> | null;
    const draft = { ...EMPTY };
    for (const k of DRAFT_FIELDS) if (typeof saved?.[k] === "string") draft[k] = saved[k] as string;
    return DRAFT_FIELDS.some((k) => draft[k].trim()) ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  try {
    if (DRAFT_FIELDS.some((k) => draft[k].trim())) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage non disponibile: la bozza resta solo nella pagina */
  }
}

type Errore = keyof GuideSubmitLabels["errors"];
type Campo = keyof Draft | "email" | "discord" | "consent";

/** Campo di ogni errore di validazione: lì vanno il focus e il bordo rosso. */
const CAMPO_DI: Partial<Record<Errore, Campo>> = {
  titolo: "title",
  corto: "text",
  lungo: "text",
  link: "link",
  codice: "code",
  firma: "name",
  email: "email",
  discord: "discord",
  consenso: "consent",
};

/** Codici della rotta con un messaggio proprio; "richiesta", "invio" e l'imprevisto diventano "generico". */
const SERVER_ERRORS = [
  "titolo",
  "corto",
  "lungo",
  "link",
  "codice",
  "firma",
  "email",
  "discord",
  "consenso",
  "troppe",
  "captcha",
  "disattivato",
] as const satisfies readonly (GuideApiError & Errore)[];

function toErrore(code: unknown): Errore {
  return (SERVER_ERRORS as readonly unknown[]).includes(code) ? (code as Errore) : "generico";
}

/** Minimo e massimo per i messaggi che li citano ({min}, {max}). */
const LIMITI: Partial<Record<Errore, [number, number]>> = {
  titolo: [GUIDE_TITLE_MIN, GUIDE_TITLE_MAX],
  corto: [GUIDE_TEXT_MIN, GUIDE_TEXT_MAX],
  lungo: [GUIDE_TEXT_MIN, GUIDE_TEXT_MAX],
  firma: [GUIDE_NAME_MIN, GUIDE_NAME_MAX],
};

const fill = (s: string, [min, max]: [number, number]) => s.replace("{min}", String(min)).replace("{max}", String(max));

/** Lunghezza di un campo di una riga come la conta la rotta: spazi e a capo di fila valgono uno spazio. */
const oneLine = (s: string) => Array.from(s.trim().replace(/\s+/g, " ")).length;

type Props = { locale: Locale; labels: GuideSubmitLabels; guidesHref: string };

export function GuideSubmitForm({ locale, labels, guidesHref }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [consent, setConsent] = useState(false);
  const [service, setService] = useState<"unknown" | "on" | "off">("unknown");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errore, setErrore] = useState<Errore | null>(null);
  const [sentWithContact, setSentWithContact] = useState(false);
  const [token, setToken] = useState("");
  const [captchaBroken, setCaptchaBroken] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  /** Vero dopo il ripristino della bozza: prima, i campi ancora vuoti non devono cancellare quella salvata. */
  const restored = useRef(false);
  const thanksRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const discordRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  /** Campi per nome: si leggono solo nei gestori di eventi (focus sul campo dell'errore). */
  const fieldRefs: Record<Campo, RefObject<HTMLInputElement | HTMLTextAreaElement | null>> = {
    title: titleRef,
    text: textRef,
    link: linkRef,
    code: codeRef,
    name: nameRef,
    email: emailRef,
    discord: discordRef,
    consent: consentRef,
  };

  const baseId = useId();
  const idOf = (k: string) => `${baseId}-${k}`;

  // Bozza e stato del servizio all'apertura. Lo stato si aggiorna nei callback (timer e risposta), non nel corpo
  // dell'effetto: è una sincronizzazione con l'esterno.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const saved = readDraft();
      if (saved) setDraft(saved);
      restored.current = true;
    }, 0);
    fetch("/api/guide-submission", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as { attivo?: boolean };
        if (!cancelled) setService(r.ok && d.attivo ? "on" : "off");
      })
      .catch(() => {
        /* rete assente: lo si scopre all'invio */
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Salvataggio della bozza un attimo dopo l'ultima battuta
  useEffect(() => {
    if (!restored.current) return;
    const timer = window.setTimeout(() => writeDraft(draft), 400);
    return () => window.clearTimeout(timer);
  }, [draft]);

  // Dopo l'invio il modulo lascia il posto al grazie: il focus va lì, non si perde sul fondo della pagina
  useEffect(() => {
    if (status === "sent") thanksRef.current?.focus();
  }, [status]);

  const update = (k: keyof Draft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft((d) => ({ ...d, [k]: value }));
    if (errore && CAMPO_DI[errore] === k) setErrore(null);
  };

  /** Stessi controlli della rotta, nello stesso ordine (quello dei campi). */
  function validate(): Errore | null {
    const titleLength = oneLine(draft.title);
    if (titleLength < GUIDE_TITLE_MIN || titleLength > GUIDE_TITLE_MAX) return "titolo";
    const textLength = Array.from(draft.text.trim()).length;
    if (textLength > GUIDE_TEXT_MAX) return "lungo";
    const link = draft.link.trim();
    if (!link && textLength < GUIDE_TEXT_MIN) return "corto";
    if (link && !guideLink(link)) return "link";
    const code = draft.code.trim();
    if (code && !GUIDE_CODE_RE.test(code)) return "codice";
    const nameLength = oneLine(draft.name);
    if (nameLength < GUIDE_NAME_MIN || nameLength > GUIDE_NAME_MAX) return "firma";
    const mail = email.trim();
    if (mail && (mail.length > GUIDE_EMAIL_MAX || !GUIDE_EMAIL_RE.test(mail))) return "email";
    const dc = discord.trim();
    if (dc && !GUIDE_DISCORD_RE.test(dc)) return "discord";
    if (!consent) return "consenso";
    return null;
  }

  const fail = (code: Errore) => {
    setErrore(code);
    const campo = CAMPO_DI[code];
    if (campo) fieldRefs[campo].current?.focus();
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending" || service === "off") return;
    const invalid = validate();
    if (invalid) return fail(invalid);
    if (turnstileEnabled && !token) return fail(captchaBroken ? "bloccato" : "attesa");

    setStatus("sending");
    setErrore(null);
    const mail = email.trim();
    const dc = discord.trim();
    try {
      const r = await fetch("/api/guide-submission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          text: draft.text,
          link: draft.link.trim() || undefined,
          code: draft.code.trim() || undefined,
          name: draft.name,
          email: mail || undefined,
          discord: dc || undefined,
          consent,
          locale,
          token: token || undefined,
        }),
      });
      if (r.ok) {
        writeDraft(EMPTY);
        setDraft(EMPTY);
        setEmail("");
        setDiscord("");
        setConsent(false);
        setToken("");
        setSentWithContact(Boolean(mail || dc));
        setStatus("sent");
        return;
      }
      const { errore: codice } = (await r.json().catch(() => ({}))) as { errore?: unknown };
      const code = toErrore(codice);
      // il testo resta nel modulo: il riquadro spiega che non arriverebbe e dà l'alternativa
      if (code === "disattivato") setService("off");
      else fail(code);
      if (turnstileEnabled) {
        setToken("");
        setResetSignal((n) => n + 1);
      }
    } catch {
      setErrore("generico");
    } finally {
      setStatus((s) => (s === "sending" ? "idle" : s));
    }
  }

  const hasText = DRAFT_FIELDS.some((k) => draft[k].trim());
  const showForm = status !== "sent" && (service !== "off" || hasText);
  const sending = status === "sending";
  const invalid = (k: Campo) => (errore !== null && CAMPO_DI[errore] === k ? true : undefined);
  const message = (code: Errore) => {
    const limits = LIMITI[code];
    return limits ? fill(labels.errors[code], limits) : labels.errors[code];
  };
  // Stessi campi del pop-up dei feedback: cornice gesso e segnaposto gesso pieno (contrasto WCAG 1.4.11 e 1.4.3)
  const fieldCls =
    "mt-1.5 w-full rounded-lg border border-chalk-muted bg-felt-deep px-3 py-2.5 text-base text-chalk placeholder:text-chalk-muted focus:border-mint aria-[invalid=true]:border-bad";
  const labelCls = "block text-sm font-bold text-pale";
  const hintCls = "mt-1 text-xs text-chalk-muted";

  const exits = (
    <div className="mt-3">
      <p className="text-xs font-bold text-pale">{labels.alternatives}</p>
      <p className="mt-2">
        <a href={`mailto:${GUIDE_STAFF_EMAIL}`} className="btn btn-ghost text-xs">
          {GUIDE_STAFF_EMAIL}
        </a>
      </p>
    </div>
  );

  return (
    <div className="card-night p-5 sm:p-8">
      {/* Esito: sempre presente, così i lettori di schermo annunciano il testo quando compare. */}
      <div aria-live="polite">
        {service === "off" ? (
          <div className="alert-bad text-sm">
            <p>{labels.errors.disattivato}</p>
            {hasText ? <p className="mt-2">{labels.keepText}</p> : null}
            {exits}
          </div>
        ) : null}
        {status === "sent" ? (
          <div className="alert-good">
            <h2 ref={thanksRef} tabIndex={-1} className="t-item outline-none">
              {labels.thanksTitle}
            </h2>
            <p className="mt-2 text-sm">
              {labels.thanksText}
              {sentWithContact ? ` ${labels.thanksContact}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ink cursor-pointer text-xs"
                onClick={() => {
                  setStatus("idle");
                  window.requestAnimationFrame(() => titleRef.current?.focus());
                }}
              >
                {labels.another}
              </button>
              <Link href={guidesHref} className="btn btn-ghost text-xs">
                {labels.back}
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={submit} noValidate className={service === "off" ? "mt-6" : undefined}>
          <label htmlFor={idOf("title")} className={labelCls}>
            {labels.titleLabel}
          </label>
          <input
            id={idOf("title")}
            ref={titleRef}
            type="text"
            value={draft.title}
            onChange={update("title")}
            maxLength={GUIDE_TITLE_MAX}
            required
            autoComplete="off"
            aria-invalid={invalid("title")}
            placeholder={labels.titlePlaceholder}
            className={fieldCls}
          />

          <label htmlFor={idOf("text")} className={`${labelCls} mt-6`}>
            {labels.textLabel}
          </label>
          <textarea
            id={idOf("text")}
            ref={textRef}
            value={draft.text}
            onChange={update("text")}
            rows={14}
            maxLength={GUIDE_TEXT_MAX}
            aria-describedby={`${idOf("text-hint")} ${idOf("draft-note")}`}
            aria-invalid={invalid("text")}
            placeholder={labels.textPlaceholder}
            className={`${fieldCls} resize-y`}
          />
          <p id={idOf("text-hint")} className={`${hintCls} flex justify-between gap-3`}>
            <span>{fill(labels.textHint, [GUIDE_TEXT_MIN, GUIDE_TEXT_MAX])}</span>
            <span className="shrink-0 font-mono tabular-nums" aria-hidden="true">
              {draft.text.length}/{GUIDE_TEXT_MAX}
            </span>
          </p>
          <p id={idOf("draft-note")} className={hintCls}>
            {labels.draftNote}
          </p>

          <label htmlFor={idOf("link")} className={`${labelCls} mt-6`}>
            {labels.linkLabel}
          </label>
          <input
            id={idOf("link")}
            ref={linkRef}
            type="url"
            inputMode="url"
            value={draft.link}
            onChange={update("link")}
            maxLength={GUIDE_LINK_MAX}
            autoComplete="off"
            aria-describedby={idOf("link-hint")}
            aria-invalid={invalid("link")}
            placeholder={labels.linkPlaceholder}
            className={fieldCls}
          />
          <p id={idOf("link-hint")} className={hintCls}>
            {labels.linkHint}
          </p>

          <label htmlFor={idOf("code")} className={`${labelCls} mt-6`}>
            {labels.codeLabel}
          </label>
          <input
            id={idOf("code")}
            ref={codeRef}
            type="text"
            value={draft.code}
            onChange={update("code")}
            maxLength={GUIDE_CODE_MAX}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby={idOf("code-hint")}
            aria-invalid={invalid("code")}
            placeholder={labels.codePlaceholder}
            className={`${fieldCls} font-mono`}
          />
          <p id={idOf("code-hint")} className={hintCls}>
            {labels.codeHint}
          </p>

          <label htmlFor={idOf("name")} className={`${labelCls} mt-6`}>
            {labels.nameLabel}
          </label>
          <input
            id={idOf("name")}
            ref={nameRef}
            type="text"
            value={draft.name}
            onChange={update("name")}
            maxLength={GUIDE_NAME_MAX}
            required
            autoComplete="nickname"
            aria-describedby={idOf("name-hint")}
            aria-invalid={invalid("name")}
            placeholder={labels.namePlaceholder}
            className={fieldCls}
          />
          <p id={idOf("name-hint")} className={hintCls}>
            {labels.nameHint}
          </p>

          <fieldset className="mt-6">
            <legend className={labelCls}>{labels.contactTitle}</legend>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor={idOf("email")} className="mt-2 block text-sm text-pale">
                  {labels.emailLabel}
                </label>
                <input
                  id={idOf("email")}
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errore === "email") setErrore(null);
                  }}
                  maxLength={GUIDE_EMAIL_MAX}
                  aria-describedby={idOf("contact-hint")}
                  aria-invalid={invalid("email")}
                  placeholder={labels.emailPlaceholder}
                  className={fieldCls}
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={idOf("discord")} className="mt-2 block text-sm text-pale">
                  {labels.discordLabel}
                </label>
                <input
                  id={idOf("discord")}
                  ref={discordRef}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={discord}
                  onChange={(e) => {
                    setDiscord(e.target.value);
                    if (errore === "discord") setErrore(null);
                  }}
                  maxLength={GUIDE_DISCORD_MAX}
                  aria-describedby={idOf("contact-hint")}
                  aria-invalid={invalid("discord")}
                  placeholder={labels.discordPlaceholder}
                  className={fieldCls}
                />
              </div>
            </div>
            <p id={idOf("contact-hint")} className={hintCls}>
              {labels.contactHint}
            </p>
          </fieldset>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-sky bg-night/60 p-3 text-sm text-pale">
            <input
              ref={consentRef}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errore === "consenso") setErrore(null);
              }}
              required
              aria-invalid={invalid("consent")}
              className="mt-1 h-4 w-4 shrink-0 accent-mint"
            />
            <span>{labels.consentLabel}</span>
          </label>

          {turnstileEnabled && service !== "off" ? (
            <Turnstile
              className="mt-5"
              locale={locale}
              resetSignal={resetSignal}
              onToken={(t) => {
                setToken(t ?? "");
                if (t) {
                  setCaptchaBroken(false);
                  setErrore((prev) => (prev === "attesa" || prev === "bloccato" ? null : prev));
                }
              }}
              onError={() => setCaptchaBroken(true)}
            />
          ) : null}

          {/* Errori: contenitore sempre presente nel modulo, il testo si aggiunge quando serve. */}
          <div role="alert">
            {errore ? (
              <div className="alert-bad mt-5 text-sm">
                <p>{message(errore)}</p>
                {errore === "generico" && hasText ? <p className="mt-2">{labels.keepText}</p> : null}
                {errore === "generico" || errore === "bloccato" ? exits : null}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={sending || service === "off"} aria-busy={sending} className="btn btn-primary cursor-pointer">
              {sending ? labels.sending : labels.send}
            </button>
          </div>
          <p className="mt-3 text-xs text-chalk-muted">
            {labels.pageNote}{" "}
            <Link href={`/${locale}/privacy#guide`} className="link-mint">
              {labels.privacyLink}
            </Link>
          </p>
        </form>
      ) : null}
    </div>
  );
}
