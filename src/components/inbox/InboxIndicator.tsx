"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { badgeCount, badgeText, envelopeHref, envelopeLabel, fillInbox, parseInboxStatus, staffInboxPath, type InboxStatus } from "@/lib/community/messages";
import { navLabelsFor } from "@/lib/inboxNavLabels";

/**
 * Numero dei non letti della casella messaggi (26/09/2026, pacchetto INBOX) nel browser: l'header è lo stesso delle
 * pagine statiche e il layout non legge Supabase, quindi lo stato arriva da `/api/inbox/status`.
 *
 * Una sola lettura condivisa da tutti i componenti della pagina (busta e menu dell'account, link dello staff su /u): al
 * primo montaggio, al cambio di pagina e al ritorno sulla scheda (se l'ultima lettura ha più di `NAV_GAP_MS`: una raffica
 * di clic non fa una raffica di richieste) e, mentre la scheda è visibile, `POLL_MS` dopo l'ultima lettura, chiunque
 * l'abbia fatta (dal 27/09/2026, per la busta dell'header: il giro si riallinea all'ultima lettura, quindi chi resta
 * fermo su una pagina vede il numero aggiornarsi ogni minuto circa); subito dopo un messaggio mandato o letto
 * (`announceInboxChange`, evento `originsmeta:inbox`). Legata all'utente: se cambia account nella stessa scheda, il
 * numero di prima sparisce.
 */

const EVENT = "originsmeta:inbox";
/** Cambio di pagina o ritorno sulla scheda: si rilegge se l'ultima lettura ha più di 10 s. */
const NAV_GAP_MS = 10_000;
/** Mentre la scheda è visibile si rilegge un minuto dopo l'ultima lettura (busta dell'header, 27/09/2026). */
const POLL_MS = 60_000;
/** Margine del giro: un timer che scatta qualche ms prima del minuto non salta la lettura. */
const POLL_SLACK_MS = 1_000;
/** Il giro non scatta mai prima di così (per esempio mentre la prima lettura non è ancora partita). */
const POLL_MIN_DELAY_MS = 5_000;

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

/** Legge lo stato se l'ultima lettura ha più di `minGap` ms; `minGap` 0 = subito (messaggio mandato o letto). */
async function load(uid: string, minGap: number): Promise<void> {
  const force = minGap <= 0;
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
  if (!force && Date.now() - lastAt < minGap) return;
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
        void load(uid, 0);
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
    if (uid) void load(uid, NAV_GAP_MS);
  }, [uid, pathname]);
  useEffect(() => {
    if (!uid) return;
    const now = () => void load(uid, 0);
    const visible = () => {
      if (document.visibilityState === "visible") void load(uid, NAV_GAP_MS);
    };
    // Giro legato all'ultima lettura (anche a quella del cambio pagina), non un intervallo fisso: con setInterval una
    // lettura fatta poco prima del giro lo faceva saltare, e il numero poteva restare fermo quasi due minuti. Solo con la
    // scheda in primo piano: una scheda dimenticata aperta non interroga il server (al ritorno ci pensa `visible`).
    let timer = 0;
    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };
    const tick = () => {
      if (document.visibilityState !== "visible") return schedule(POLL_MS);
      void load(uid, POLL_MS - POLL_SLACK_MS);
      schedule(Math.max(POLL_MIN_DELAY_MS, lastAt + POLL_MS - Date.now()));
    };
    schedule(Math.max(POLL_MIN_DELAY_MS, lastAt + POLL_MS - Date.now()));
    window.addEventListener(EVENT, now);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(EVENT, now);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [uid]);
  return status;
}

/**
 * Busta dei messaggi nell'header, subito a sinistra dell'avatar (27/09/2026, richiesta di Pierluigi: "la posta deve essere
 * un tasto in alto a sinistra di fianco al nome giocatore, che se hanno un messaggio avranno una notifica… la classica
 * cassetta delle lettere o una lettera con una notifica rossa"). Solo per chi ha fatto l'accesso (la monta AccountMenu).
 * Porta alla casella (`envelopeHref`: per lo staff quella dello staff se le novità sono solo lì). Con messaggi da leggere,
 * un pallino rosso con il numero (1–9, poi "9+"): testo gesso su crimson scuro 6,1:1 (sul crimson pieno il gesso si
 * fermava a 4:1, troppo poco per 10 px, e il bianco pieno è vietato dalle regole del sito) con un anello crimson che lo
 * stacca dal fondo dell'header (3,5:1). Il nome per i lettori di schermo ha il numero intero ("Messaggi, 2 non letti").
 * Icona SVG disegnata qui, niente librerie.
 */
export function InboxEnvelope({ locale, status }: { locale: string; status: InboxStatus | null }) {
  const L = navLabelsFor(locale);
  const n = badgeCount(status);
  const text = badgeText(n);
  const label = envelopeLabel(L, n);
  return (
    <Link
      href={envelopeHref(status, locale)}
      prefetch={false}
      aria-label={label}
      title={label}
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-felt-line text-chalk transition hover:border-mint hover:text-mint"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5.5" width="18" height="13" rx="2" />
        <path d="m3.5 7 8.5 6.5L20.5 7" />
      </svg>
      {text ? (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-crimson-deep px-1 font-mono text-[10px] font-bold leading-none text-chalk ring-2 ring-crimson"
        >
          {text}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Pallino menta con il numero, nelle voci del menu dell'account (il numero intero lo dice l'`aria-label` della voce).
 * Accanto all'avatar non c'è più dal 27/09/2026: il numero lo porta la busta (`InboxEnvelope`), e due numeri uguali
 * a pochi pixel l'uno dall'altro sarebbero stati un doppione.
 */
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
      <Link href={`/${locale}/account/messages`} prefetch={false} className="nav-link nav-link-block flex items-center justify-between gap-2" aria-label={label(L.messages, mine)}>
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
 * decide nel browser. Porta al modulo "Nuovo messaggio a un utente" dell'area staff con il nome già scritto. Non compare
 * sul proprio profilo (`profileId` uguale a chi guarda): scrivere a se stessi finirebbe nell'errore `self`.
 */
export function StaffMessageLink({
  locale,
  username,
  profileId,
  className = "mt-3",
}: {
  locale: string;
  username: string | null | undefined;
  profileId?: string | null;
  className?: string;
}) {
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
  if (!username || !status?.staff || (profileId && uid === profileId)) return null;
  // il paragrafo (con il suo margine, `className`) c'è solo quando c'è il link: niente spazio vuoto per chi non è dello staff
  return (
    <p className={className}>
      <Link href={`${staffInboxPath(locale)}?to=${encodeURIComponent(username)}#new`} prefetch={false} className="btn btn-ink text-xs">
        {navLabelsFor(locale).writeToUser}
      </Link>
    </p>
  );
}
