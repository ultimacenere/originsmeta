"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { CONSENT_EVENT, PREFERENCES_EVENT, getConsent, type Consent } from "@/lib/consent";
import { turnstileEnabled } from "@/lib/turnstile";
import { Turnstile } from "@/components/Turnstile";
import { trackEvent } from "@/lib/analytics";
import { supabaseBrowser } from "@/lib/supabase/client";
import { navLabelsFor } from "@/lib/inboxNavLabels";
import { useInboxStatus } from "@/components/inbox/InboxIndicator";
import {
  FEEDBACK_EMAIL_MAX,
  FEEDBACK_EMAIL_RE,
  FEEDBACK_MAX,
  FEEDBACK_MIN,
  FEEDBACK_NAME_MAX,
  FEEDBACK_STAFF_EMAIL,
  feedbackEnabled,
  type FeedbackApiError,
  type FeedbackLabels,
} from "@/lib/feedbackLabels";

/**
 * Pop-up dei feedback (richiesta del 22/09/2026: "raccogliere feedback degli utenti all'apertura del sito,
 * priorità alta nei primi giorni, da spegnere dopo il rodaggio"). Montato una volta nel layout radice, quindi
 * sopravvive alla navigazione: il testo scritto resta anche chiudendo il pannello o cambiando pagina.
 *
 * - Bottone fisso in basso a destra, disegnato SOLO se il servizio risponde "attivo" (revisione del 22/09/2026:
 *   senza DISCORD_FEEDBACK_WEBHOOK_URL il bottone portava a un vicolo cieco): lo stato si chiede una volta, appena
 *   il banner dei cookie non c'è più, e si ricorda per la scheda (sessionStorage). Sparisce anche finché il banner
 *   dei cookie è aperto (starebbero nello stesso angolo) e, sotto i 1024 px, sulle pagine del deck builder, dove in
 *   basso c'è la barra del mazzo.
 * - All'apertura del sito il pannello si apre da solo UNA VOLTA per visitatore (ricordato in localStorage),
 *   qualche secondo dopo la chiusura del banner dei cookie; mai mentre qualcuno scrive in un campo, naviga con la
 *   tastiera (un elemento ha il focus visibile) o ha la scheda in secondo piano, mai sul builder dal telefono (si
 *   aspetta la pagina dopo), e solo se il servizio risponde "attivo".
 * - Il messaggio va a `/api/feedback`, che lo gira al canale Discord privato dello staff. Se la rotta risulta
 *   spenta al momento dell'invio lo diciamo apertamente, con l'email dello staff come alternativa: niente finti
 *   "grazie". Il Discord ufficiale del gioco NON è un'alternativa: è il server di Koin Games, non il nostro.
 * - Nome o nickname facoltativo (24/09/2026: il primo feedback era anonimo). Resta nel campo dopo l'invio, così
 *   "Scrivine un altro" non lo fa riscrivere; l'email invece si svuota come prima.
 * - Accessibilità: dialog non modale (la pagina resta usabile) con titolo. Aperto dal bottone, il focus entra nel
 *   pannello e torna dov'era alla chiusura (X, Esc, "Chiudi"); aperto da solo, il focus NON si sposta (nessun
 *   cambio di contesto non chiesto) e un'area `aria-live` fuori dal pannello ne annuncia il titolo. Esc chiude il
 *   pannello solo se il focus è nel pannello, sul bottone o da nessuna parte (non ruba l'Esc a chi sta usando la
 *   pagina); un clic fuori lo chiude senza spostare il focus (lo decide il clic). Esito in un'area `aria-live`,
 *   errori in un contenitore `role="alert"`, entrambi sempre presenti nel pannello. L'animazione d'ingresso si
 *   spegne con "riduci animazioni".
 * - Interruttore: NEXT_PUBLIC_FEEDBACK=off (vedi `src/lib/feedbackLabels.ts`) e il componente non disegna nulla.
 * - Casella messaggi (26/09/2026, pacchetto INBOX): a chi ha fatto l'accesso, e solo se la casella risponde
 *   (/api/inbox/status), il pannello dice che il feedback sarà collegato all'account e che la risposta arriverà nella
 *   casella messaggi (la rotta salva il feedback anche lì); dopo l'invio porta alla casella, o dice che questa volta
 *   il salvataggio non è riuscito.
 */

const SEEN_KEY = "originsmeta.feedback.v1";
/** Attesa prima dell'apertura automatica, contata da quando il banner dei cookie non c'è più. */
const AUTO_DELAY_MS = 5000;
/** Sotto questa larghezza il deck builder ha la barra del mazzo fissa in basso (`lg:hidden` nel builder). */
const SMALL_SCREEN = "(max-width: 1023.98px)";
/** Deck builder e builder dei mazzi di un torneo (stesso componente, stessa barra). */
const BUILDER_PATH = /\/(?:deck-builder|tournaments\/[^/]+\/deck)\/?$/;

/** Anche con lo storage bloccato (finestra privata rigida) il pannello non si riapre da solo a ogni pagina. */
let seenInThisTab = false;

function alreadySeen(): boolean {
  if (seenInThisTab) return true;
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function markSeen() {
  seenInThisTab = true;
  try {
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    /* storage non disponibile: resta il ricordo della scheda */
  }
}

/* Consenso cookie letto come "store esterno": sul server e durante l'idratazione vale UNKNOWN, così il bottone
   compare solo nel browser e non c'è differenza fra HTML statico e primo render. */
const UNKNOWN = "unknown" as const;
function subscribeConsent(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CONSENT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
const consentOnServer = (): typeof UNKNOWN => UNKNOWN;

/**
 * Chi sta scrivendo in un campo (ricerca, deck builder, modulo) o sta navigando con la tastiera (un elemento ha il
 * focus visibile, per esempio una carta in mano nella tier list personalizzabile) non va interrotto. Il focus
 * lasciato su un link o un bottone da un clic del mouse non conta: lì `:focus-visible` è falso.
 */
function isBusy(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el === document.body) return false;
  if (el.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true;
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

type Errore = keyof FeedbackLabels["errors"];
type Servizio = "unknown" | "on" | "off";

/** Stato del servizio ricordato per la scheda: una sola richiesta a /api/feedback per visita, non una per pagina. */
const SERVICE_KEY = "originsmeta.feedback.service";

function readCachedService(): Servizio {
  try {
    const v = sessionStorage.getItem(SERVICE_KEY);
    return v === "on" || v === "off" ? v : "unknown";
  } catch {
    return "unknown";
  }
}

function cacheService(s: Servizio) {
  try {
    sessionStorage.setItem(SERVICE_KEY, s);
  } catch {
    /* storage non disponibile: si richiede alla prossima pagina caricata */
  }
}

/** Codici della rotta che hanno un messaggio proprio; "richiesta", "invio" e l'imprevisto diventano "generico". */
const SERVER_ERRORS = ["corto", "lungo", "email", "troppe", "captcha", "disattivato"] as const satisfies readonly (FeedbackApiError & Errore)[];

function toErrore(code: unknown): Errore {
  return (SERVER_ERRORS as readonly unknown[]).includes(code) ? (code as Errore) : "generico";
}

type Props = { locale: Locale; labels: FeedbackLabels };

export function FeedbackWidget(props: Props) {
  if (!feedbackEnabled) return null;
  return <Widget {...props} />;
}

function Widget({ locale, labels }: Props) {
  const pathname = usePathname() ?? "";
  const onBuilder = BUILDER_PATH.test(pathname);
  const consent = useSyncExternalStore<Consent | null | typeof UNKNOWN>(subscribeConsent, getConsent, consentOnServer);
  const [bannerReopened, setBannerReopened] = useState(false);
  // scelta fatta in questa scheda: conta anche se lo storage è bloccato e getConsent() resta null
  const [decidedInTab, setDecidedInTab] = useState(false);
  const hydrated = consent !== UNKNOWN;
  const bannerOpen = !hydrated || bannerReopened || (consent === null && !decidedInTab);

  const [open, setOpen] = useState(false);
  const [service, setService] = useState<Servizio>("unknown");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errore, setErrore] = useState<Errore | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sentWithEmail, setSentWithEmail] = useState(false);
  /* casella messaggi (pacchetto INBOX): chi ha fatto l'accesso riceve la risposta nel suo profilo */
  const [uid, setUid] = useState<string | null>(null);
  const [savedToInbox, setSavedToInbox] = useState(false);
  /* la nota "ti risponderemo nella tua casella" era visibile al momento dell'invio */
  const [promisedInbox, setPromisedInbox] = useState(false);
  const [token, setToken] = useState("");
  const [captchaBroken, setCaptchaBroken] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  /** annuncio per i lettori di schermo quando il pannello si apre da solo (il focus lì non si sposta) */
  const [notice, setNotice] = useState("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);
  const openedBy = useRef<"auto" | "manual">("manual");
  const returnFocus = useRef<HTMLElement | null>(null);
  const serviceRef = useRef<Servizio>("unknown");

  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const titleId = `${baseId}-title`;
  const introId = `${baseId}-intro`;
  const msgId = `${baseId}-msg`;
  const hintId = `${baseId}-hint`;
  const nameId = `${baseId}-name`;
  const nameHintId = `${baseId}-name-hint`;
  const emailId = `${baseId}-email`;
  const emailHintId = `${baseId}-email-hint`;

  /**
   * Chiede alla rotta se i messaggi arrivano davvero (webhook configurato). Una volta per scheda: l'esito resta in
   * sessionStorage. Senza risposta (rete assente) non si decide nulla e il bottone resta nascosto.
   */
  const checkService = useCallback(async (): Promise<boolean> => {
    if (serviceRef.current !== "unknown") return serviceRef.current === "on";
    let s = readCachedService();
    if (s === "unknown") {
      try {
        const r = await fetch("/api/feedback", { cache: "no-store" });
        const d = (await r.json().catch(() => ({}))) as { attivo?: boolean };
        s = r.ok && d.attivo ? "on" : "off";
        cacheService(s);
      } catch {
        return false;
      }
    }
    serviceRef.current = s;
    setService(s);
    return s === "on";
  }, []);

  const openPanel = useCallback(
    (by: "auto" | "manual") => {
      const active = document.activeElement;
      returnFocus.current = by === "manual" ? buttonRef.current : active instanceof HTMLElement && active !== document.body ? active : null;
      openedBy.current = by;
      markSeen();
      setOpen(true);
      setNotice(by === "auto" ? `${labels.kicker}: ${labels.title}` : "");
      if (by === "manual") void checkService();
    },
    [checkService, labels.kicker, labels.title],
  );

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setNotice("");
    setErrore(null);
    setStatus((s) => (s === "sent" ? "idle" : s));
    // il token Turnstile è usa e getta e il widget si smonta: alla prossima apertura ne arriva uno nuovo
    setToken("");
    setCaptchaBroken(false);
    // il focus si sposta solo se stava nel pannello (che ora si nasconde): torna da dove era partito, oppure
    // sul bottone se il pannello si era aperto da solo mentre il focus non era su nulla
    const back = returnFocus.current?.isConnected ? returnFocus.current : buttonRef.current;
    returnFocus.current = null;
    if (restoreFocus && panelRef.current?.contains(document.activeElement)) back?.focus({ preventScroll: true });
  }, []);

  // Il banner dei cookie riaperto dal footer ha la precedenza: il pannello si chiude e il bottone si nasconde.
  useEffect(() => {
    const reopened = () => {
      setBannerReopened(true);
      setOpen(false);
    };
    const decided = () => {
      setBannerReopened(false);
      setDecidedInTab(true);
    };
    window.addEventListener(PREFERENCES_EVENT, reopened);
    window.addEventListener(CONSENT_EVENT, decided);
    return () => {
      window.removeEventListener(PREFERENCES_EVENT, reopened);
      window.removeEventListener(CONSENT_EVENT, decided);
    };
  }, []);

  // Stato del servizio appena il banner dei cookie non c'è più: il bottone si disegna solo se i messaggi arrivano.
  // In un timer e non nel corpo dell'effetto: lo stato si aggiorna nella risposta, come ogni sincronizzazione esterna.
  useEffect(() => {
    if (bannerOpen) return;
    const timer = window.setTimeout(() => void checkService(), 0);
    return () => window.clearTimeout(timer);
  }, [bannerOpen, checkService]);

  // Apertura automatica, una volta per visitatore, dopo il banner dei cookie.
  useEffect(() => {
    if (bannerOpen || open || alreadySeen()) return;
    let cancelled = false;
    let timer = 0;
    const tryOpen = async () => {
      if (cancelled) return;
      // sul builder dal telefono il pannello coprirebbe la barra del mazzo: si riprova alla prossima pagina
      if (onBuilder && window.matchMedia(SMALL_SCREEN).matches) return;
      if (document.hidden || isBusy()) {
        timer = window.setTimeout(tryOpen, AUTO_DELAY_MS);
        return;
      }
      const on = await checkService();
      if (!cancelled && on && !alreadySeen()) openPanel("auto");
    };
    timer = window.setTimeout(tryOpen, AUTO_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [bannerOpen, open, onBuilder, checkService, openPanel]);

  // Focus all'apertura, solo se l'ha chiesta la persona (bottone): va sul campo di testo. Aperto da solo, il
  // pannello non prende il focus: niente cambio di contesto e niente tastiera del telefono che si apre.
  useEffect(() => {
    if (!open || openedBy.current !== "manual") return;
    const id = window.requestAnimationFrame(() => {
      (fieldRef.current ?? panelRef.current)?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Servizio spento scoperto dopo l'apertura dal bottone: se il campo col focus è sparito, il focus va sul pannello.
  useEffect(() => {
    if (!open || service !== "off" || openedBy.current !== "manual") return;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
  }, [open, service]);

  // Dopo l'invio il modulo lascia il posto al grazie: il focus va lì, non si perde sul fondo della pagina.
  useEffect(() => {
    if (status === "sent") thanksRef.current?.focus({ preventScroll: true });
  }, [status]);

  // Esc e clic fuori chiudono il pannello. Esc solo se il focus è nel pannello, sul bottone o da nessuna parte:
  // con il focus nella pagina (una carta in mano nella tier list, un menu) l'Esc è di chi sta usando la pagina.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const el = document.activeElement;
      const ours = !el || el === document.body || el === buttonRef.current || Boolean(panelRef.current?.contains(el));
      if (ours) close(true);
    };
    const onClick = (e: MouseEvent) => {
      // composedPath è fissato al momento del clic: vale anche se nel frattempo React ha tolto dal DOM il bersaglio
      const path = e.composedPath();
      if ((panelRef.current && path.includes(panelRef.current)) || (buttonRef.current && path.includes(buttonRef.current))) return;
      close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open, close]);

  // Chi ha fatto l'accesso legge che la risposta arriverà nella sua casella messaggi: /api/feedback salva il feedback
  // anche lì (pacchetto INBOX). La nota compare solo se la casella risponde davvero (/api/inbox/status in 200, stato
  // condiviso con il menu dell'account, quindi di solito nessuna richiesta in più): senza la migrazione o con il
  // database giù la rotta non potrebbe salvarlo, e la promessa sarebbe falsa.
  useEffect(() => {
    if (!open) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setUid(data.session?.user.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, [open]);
  const inboxStatus = useInboxStatus(open ? uid : null);

  const fail = (code: Errore, focus?: HTMLElement | null) => {
    setErrore(code);
    focus?.focus();
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending" || service === "off") return;
    const text = message.trim();
    const len = Array.from(text).length;
    if (len < FEEDBACK_MIN) return fail("corto", fieldRef.current);
    if (len > FEEDBACK_MAX) return fail("lungo", fieldRef.current);
    const mail = email.trim();
    if (mail && (mail.length > FEEDBACK_EMAIL_MAX || !FEEDBACK_EMAIL_RE.test(mail))) return fail("email", emailRef.current);
    if (turnstileEnabled && !token) return fail(captchaBroken ? "bloccato" : "attesa");

    setStatus("sending");
    setErrore(null);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, name: name.trim() || undefined, email: mail || undefined, page: pathname, locale, token: token || undefined }),
      });
      if (r.ok) {
        const esito = (await r.json().catch(() => ({}))) as { inbox?: boolean };
        setSavedToInbox(esito.inbox === true);
        setPromisedInbox(Boolean(inboxStatus));
        setSentWithEmail(Boolean(mail));
        setMessage("");
        setEmail("");
        setToken("");
        setStatus("sent");
        trackEvent("feedback_submit", {}); // misura: nessun parametro, il testo non esce mai
        return;
      }
      const { errore: codice } = (await r.json().catch(() => ({}))) as { errore?: unknown };
      const code = toErrore(codice);
      if (code === "disattivato") {
        // il testo resta nel riquadro: il pannello spiega che non arriverebbe e dà l'alternativa (il bottone
        // resta finché il pannello è aperto, poi sparisce: la scheda ricorda che il servizio è spento)
        serviceRef.current = "off";
        cacheService("off");
        setService("off");
      } else {
        setErrore(code);
        if (code === "corto" || code === "lungo") fieldRef.current?.focus();
        if (code === "email") emailRef.current?.focus();
      }
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

  if (!hydrated) return null;

  const fill = (s: string) => s.replace("{min}", String(FEEDBACK_MIN)).replace("{max}", String(FEEDBACK_MAX));
  const inbox = navLabelsFor(locale);
  const hasText = message.trim().length > 0;
  const showForm = status !== "sent" && (service !== "off" || hasText);
  const withExits = errore === "generico" || errore === "bloccato";
  const sending = status === "sending";
  // Cornice gesso (6,8:1 su night-2) e segnaposto gesso pieno (7,7:1 sul fondo del campo): prima felt-line a 1,3:1
  // e segnaposto al 70% sotto i 4,5:1 (WCAG 1.4.11 e 1.4.3).
  const fieldCls = "mt-1.5 w-full rounded-lg border border-chalk-muted bg-felt-deep px-3 py-2.5 text-base text-chalk placeholder:text-chalk-muted focus:border-mint aria-[invalid=true]:border-bad";
  // Il bottone c'è solo se i messaggi arrivano; resta finché il pannello è aperto (chiusura e ritorno del focus)
  const showButton = !bannerOpen && (service === "on" || open);

  // Unica alternativa: l'email dello staff. Il Discord ufficiale del gioco è il server di Koin Games, non il posto
  // per i commenti su un sito fan non affiliato.
  const exits = (
    <div className="mt-3">
      <p className="text-xs font-bold text-pale">{labels.alternatives}</p>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <a href={`mailto:${FEEDBACK_STAFF_EMAIL}`} className="btn btn-ghost text-xs">
          {FEEDBACK_STAFF_EMAIL}
        </a>
      </p>
    </div>
  );

  return (
    <>
      {/* Annuncio dell'apertura automatica: fuori dal pannello, così esiste già quando il testo cambia */}
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
      {showButton ? (
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close(true) : openPanel("manual"))}
          className={`btn btn-ink fixed right-4 z-40 text-xs shadow-lift print:hidden ${onBuilder ? "max-lg:hidden" : ""}`}
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0 fill-current">
            <path d="M4 3h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5.6l-3.7 2.9A.75.75 0 0 1 5.5 16.3V14H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
          </svg>
          {labels.button}
        </button>
      ) : null}

      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={introId}
        tabIndex={-1}
        hidden={!open}
        className="card-night fixed inset-x-4 z-[45] overflow-y-auto overscroll-contain p-5 outline-none transition-[opacity,translate] duration-200 ease-out starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none sm:left-auto sm:w-[23rem] print:hidden"
        style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))", maxHeight: "calc(100dvh - 5.5rem - env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker text-mint">{labels.kicker}</p>
            <h2 id={titleId} className="t-item mt-1">
              {labels.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => close(true)}
            aria-label={labels.close}
            title={labels.close}
            className="-mr-1.5 -mt-1.5 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-pale-muted transition-colors hover:text-mint motion-reduce:transition-none"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </div>
        <p id={introId} className="mt-2 text-sm text-pale-muted">
          {labels.intro}
        </p>

        {/* Esito: sempre presente, così i lettori di schermo annunciano il testo quando compare. */}
        <div aria-live="polite">
          {service === "off" ? (
            <div className="alert-bad mt-4 text-sm">
              <p>{labels.errors.disattivato}</p>
              {hasText ? <p className="mt-2">{labels.keepText}</p> : null}
              {exits}
            </div>
          ) : null}
          {status === "sent" ? (
            <div className="alert-good mt-4">
              <h3 ref={thanksRef} tabIndex={-1} className="t-item outline-none">
                {labels.thanksTitle}
              </h3>
              <p className="mt-2 text-sm">
                {labels.thanksText}
                {sentWithEmail ? ` ${labels.thanksEmail}` : ""}
              </p>
              {savedToInbox ? (
                <p className="mt-2 text-sm">
                  {inbox.feedbackSaved}{" "}
                  <Link href={`/${locale}/account#messages`} onClick={() => close(false)} className="link-mint font-bold">
                    {inbox.openInbox}
                  </Link>
                </p>
              ) : promisedInbox ? (
                // la nota prometteva la casella, ma il salvataggio non è riuscito (limite giornaliero, database)
                <p className="mt-2 text-sm">
                  {inbox.feedbackNotSaved}{" "}
                  <Link href={`/${locale}/account#messages`} onClick={() => close(false)} className="link-mint font-bold">
                    {inbox.openInbox}
                  </Link>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ink cursor-pointer text-xs"
                  onClick={() => {
                    setStatus("idle");
                    openedBy.current = "manual";
                    window.requestAnimationFrame(() => fieldRef.current?.focus({ preventScroll: true }));
                  }}
                >
                  {labels.another}
                </button>
                <button type="button" className="btn btn-ghost cursor-pointer text-xs" onClick={() => close(true)}>
                  {labels.close}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {showForm ? (
          <form onSubmit={submit} noValidate className="mt-4">
            <label htmlFor={msgId} className="block text-base font-bold leading-snug text-chalk">
              {labels.question}
            </label>
            <textarea
              id={msgId}
              ref={fieldRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errore === "corto" || errore === "lungo") setErrore(null);
              }}
              rows={4}
              maxLength={FEEDBACK_MAX}
              required
              aria-describedby={hintId}
              aria-invalid={errore === "corto" || errore === "lungo" ? true : undefined}
              placeholder={labels.messagePlaceholder}
              className={`${fieldCls} resize-y`}
            />
            <p id={hintId} className="mt-1 flex justify-between gap-3 text-xs text-chalk-muted">
              <span>{fill(labels.lengthHint)}</span>
              <span className="font-mono tabular-nums" aria-hidden="true">
                {message.length}/{FEEDBACK_MAX}
              </span>
            </p>

            <label htmlFor={nameId} className="mt-4 block text-sm font-bold text-pale">
              {labels.nameLabel}
            </label>
            <input
              id={nameId}
              type="text"
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={FEEDBACK_NAME_MAX}
              aria-describedby={nameHintId}
              placeholder={labels.namePlaceholder}
              className={fieldCls}
            />
            <p id={nameHintId} className="mt-1 text-xs text-chalk-muted">
              {labels.nameHint}
            </p>

            <label htmlFor={emailId} className="mt-4 block text-sm font-bold text-pale">
              {labels.emailLabel}
            </label>
            <input
              id={emailId}
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errore === "email") setErrore(null);
              }}
              maxLength={FEEDBACK_EMAIL_MAX}
              aria-describedby={emailHintId}
              aria-invalid={errore === "email" ? true : undefined}
              placeholder={labels.emailPlaceholder}
              className={fieldCls}
            />
            <p id={emailHintId} className="mt-1 text-xs text-chalk-muted">
              {labels.emailHint}
            </p>
            {inboxStatus ? <p className="mt-3 text-xs font-bold text-mint">{inbox.feedbackNote}</p> : null}

            {turnstileEnabled && open && service !== "off" ? (
              <Turnstile
                className="mt-4"
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
                <div className="alert-bad mt-4 text-sm">
                  <p>{fill(labels.errors[errore])}</p>
                  {errore === "generico" && hasText ? <p className="mt-2">{labels.keepText}</p> : null}
                  {withExits ? exits : null}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={sending || service === "off"} aria-busy={sending} className="btn btn-primary cursor-pointer">
                {sending ? labels.sending : labels.send}
              </button>
            </div>
            <p className="mt-3 text-xs text-chalk-muted">
              {labels.pageNote}{" "}
              <Link href={`/${locale}/privacy#feedback`} onClick={() => close(false)} className="link-mint">
                {labels.privacyLink}
              </Link>
            </p>
          </form>
        ) : null}
      </div>
    </>
  );
}
