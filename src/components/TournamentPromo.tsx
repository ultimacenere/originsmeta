"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, PREFERENCES_EVENT, getConsent, type Consent } from "@/lib/consent";
import { trackEvent } from "@/lib/analytics";
import { isBusy, otherPanelOpen, setPanelOpen } from "@/lib/autoOpen";
import {
  PROMO_DELAY_MS,
  PROMO_SEEN_KEY,
  isPromoTournamentPath,
  promoActive,
  promoDate,
  promoListed,
  promoMoney,
  promoQuietPath,
  type TournamentPromoData,
} from "@/lib/tournamentPromo";
import type { TournamentPromoText } from "@/lib/tournamentPromoLabels";

/** Nome del popup fra i riquadri che si aprono da soli (src/lib/autoOpen.ts). */
const PANEL_ID = "tournament-promo";

type CloseMethod = "close" | "later" | "esc" | "backdrop";

/** Anche con lo storage bloccato (finestra privata rigida) il popup non si riapre a ogni pagina della scheda. */
let seenInTab = false;

function seen(slug: string): boolean {
  if (seenInTab) return true;
  try {
    return localStorage.getItem(PROMO_SEEN_KEY) === slug;
  } catch {
    return false;
  }
}

function markSeen(slug: string) {
  seenInTab = true;
  try {
    localStorage.setItem(PROMO_SEEN_KEY, slug);
  } catch {
    /* storage non disponibile: resta il ricordo della scheda */
  }
}

/** Il calendario del sito si chiede una volta per scheda (è lo stesso JSON della striscia, nella cache del browser). */
let listedCheck: Promise<boolean> | null = null;
function stillListed(slug: string): Promise<boolean> {
  listedCheck ??= fetch("/api/calendar")
    .then((r) => (r.ok ? r.json() : null))
    .then((json: unknown) => promoListed(json, slug))
    .catch(() => false);
  return listedCheck;
}

/* Consenso cookie come "store esterno", come nel riquadro dei feedback: sul server e nell'idratazione vale UNKNOWN. */
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
 * Popup di un torneo della community (05/11/2026): regole e dati in src/lib/tournamentPromo.ts. Montato nel layout della
 * lingua, quindi resta fra un cambio di pagina e l'altro; nell'HTML non c'è niente, tutto si decide nel browser.
 *
 * Accessibilità: <dialog> modale nativo (focus dentro alla comparsa, sul tasto ×, e di ritorno alla chiusura; Esc, il
 * tasto Indietro del telefono e un clic fuori lo chiudono), titolo e frase del torneo come nome e descrizione.
 * Al centro da 640 px con la copertina intera, sotto un foglio dal basso senza copertina, che lascia vedere la pagina
 * (senza copertina anche sugli schermi alti meno di 720 px).
 * L'entrata si spegne con "riduci animazioni".
 */
export function TournamentPromoDialog({ promo, lang, href, labels }: { promo: TournamentPromoData; lang: string; href: string; labels: TournamentPromoText }) {
  const pathname = usePathname() ?? "";
  const onPromoPage = isPromoTournamentPath(pathname, promo.slug);
  const quiet = onPromoPage || promoQuietPath(pathname);

  const consent = useSyncExternalStore<Consent | null | typeof UNKNOWN>(subscribeConsent, getConsent, consentOnServer);
  const [bannerReopened, setBannerReopened] = useState(false);
  // scelta fatta in questa scheda: conta anche se lo storage è bloccato e getConsent() resta null
  const [decidedInTab, setDecidedInTab] = useState(false);
  const bannerOpen = consent === UNKNOWN || bannerReopened || (consent === null && !decidedInTab);

  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const pitchId = `${baseId}-pitch`;

  useEffect(() => {
    const reopened = () => setBannerReopened(true);
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

  // Chi apre la scheda del torneo l'ha trovato da solo: il popup non serve più, né ora né dopo.
  useEffect(() => {
    if (onPromoPage) markSeen(promo.slug);
  }, [onPromoPage, promo.slug]);

  // Apertura automatica: una volta per browser, PROMO_DELAY_MS dopo il banner dei cookie e dopo l'ultimo cambio di pagina.
  useEffect(() => {
    if (open || quiet || bannerOpen) return;
    if (seen(promo.slug) || !promoActive(Date.now(), promo)) return;
    let cancelled = false;
    let timer = 0;
    const tryOpen = async () => {
      if (cancelled) return;
      if (document.hidden || isBusy() || otherPanelOpen(PANEL_ID)) {
        timer = window.setTimeout(tryOpen, PROMO_DELAY_MS);
        return;
      }
      if (seen(promo.slug) || !promoActive(Date.now(), promo)) return;
      const listed = await stillListed(promo.slug);
      if (cancelled || !listed || seen(promo.slug) || otherPanelOpen(PANEL_ID)) return;
      setOpen(true);
    };
    timer = window.setTimeout(tryOpen, PROMO_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, quiet, bannerOpen, promo]);

  // Il dialog esiste solo da aperto: appena montato diventa modale, e il riquadro dei feedback aspetta.
  useEffect(() => {
    if (!open) return;
    setPanelOpen(PANEL_ID, true);
    const d = dialogRef.current;
    if (d && !d.open) {
      try {
        d.showModal();
      } catch {
        /* già aperto o non collegato */
      }
    }
    trackEvent("tournament_promo_view", { tournament: promo.tag });
    return () => setPanelOpen(PANEL_ID, false);
  }, [open, promo.tag]);

  if (!open) return null;

  const finish = (method?: CloseMethod) => {
    markSeen(promo.slug);
    if (method) trackEvent("tournament_promo_close", { tournament: promo.tag, method });
    const d = dialogRef.current;
    if (d?.open) d.close();
    setOpen(false);
  };

  const money = (n: number) => promoMoney(n, promo.prize.currency, lang);
  const prize = labels.prize
    .replace("{total}", money(promo.prize.total))
    .replace("{first}", money(promo.prize.first))
    .replace("{second}", money(promo.prize.second));

  return (
    <dialog
      ref={dialogRef}
      className="promo-dialog"
      aria-labelledby={titleId}
      aria-describedby={pitchId}
      onCancel={(e) => {
        e.preventDefault();
        finish("esc");
      }}
      onClose={() => {
        markSeen(promo.slug);
        setOpen(false);
      }}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // il dialog non ha margini interni: il suo bersaglio diretto è solo lo sfondo intorno alla scheda
        if (e.target === e.currentTarget && downOnBackdrop.current) finish("backdrop");
      }}
    >
      <div className="card-night promo-card">
        <button type="button" className="promo-close" onClick={() => finish("close")} aria-label={labels.close}>
          <span aria-hidden="true">×</span>
        </button>
        <div className="promo-cover">
          <Image src={promo.cover.src} width={promo.cover.width} height={promo.cover.height} sizes="28rem" alt="" className="block h-auto w-full" />
          <span className="stat-pill absolute bottom-3 left-3 bg-mint text-xs font-bold text-ink">{promo.tag}</span>
        </div>
        <div className="p-5 sm:p-6">
          {/* spazio a destra per la ×, che senza copertina (telefono, schermi bassi) sta sopra il testo */}
          <p className="kicker pr-10 text-mint">{labels.kicker}</p>
          <h2 id={titleId} className="t-page mt-1">
            {promo.name}
          </h2>
          <p className="mt-1 text-sm text-pale-muted">
            {labels.organizedBy} <strong className="text-pale">{promo.organizer}</strong>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-pale">
            <li className="flex gap-2.5">
              <CalendarIcon />
              <time dateTime={promo.startsAt} className="font-semibold text-chalk first-letter:uppercase">
                {promoDate(promo.startsAt, lang)}
              </time>
            </li>
            <li className="flex gap-2.5">
              <TrophyIcon />
              <span>{prize}</span>
            </li>
            <li className="flex gap-2.5">
              <DecksIcon />
              <span>{labels.format}</span>
            </li>
          </ul>
          <p id={pitchId} className="mt-3 text-sm text-pale-muted">
            {labels.pitch}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href={href}
              prefetch={false}
              className="btn btn-primary min-w-0 flex-1 basis-56"
              onClick={() => {
                trackEvent("tournament_promo_click", { tournament: promo.tag });
                finish();
              }}
            >
              {labels.cta} →
            </Link>
            <button type="button" className="btn btn-ghost flex-none" onClick={() => finish("later")}>
              {labels.later}
            </button>
          </div>
          <p className="mt-3 text-xs text-pale-muted">{labels.note}</p>
        </div>
      </div>
    </dialog>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none text-sky" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none text-sky" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h8v4a4 4 0 0 1-8 0V3Z" />
      <path d="M6 4.5H3.5a2.5 2.5 0 0 0 2.6 3.2M14 4.5h2.5a2.5 2.5 0 0 1-2.6 3.2M10 11v3M7 17h6M8 14h4v3H8z" />
    </svg>
  );
}

function DecksIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none text-sky" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="3" width="9" height="13" rx="1.6" transform="rotate(8 11 9.5)" />
      <rect x="4" y="4" width="9" height="13" rx="1.6" transform="rotate(-6 8.5 10.5)" />
    </svg>
  );
}
