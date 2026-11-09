"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, PREFERENCES_EVENT, getConsent, type Consent } from "@/lib/consent";
import { trackEvent } from "@/lib/analytics";
import { isBusy, otherPanelOpen, setPanelOpen } from "@/lib/autoOpen";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Db } from "@/lib/supabase/public";
import { promoQuietPath } from "@/lib/tournamentPromo";
import { parseSteamLinkStatus } from "@/lib/steam/link";
import { STEAM_PROMO_DELAY_MS, STEAM_PROMO_SEEN_KEY, addSteamPromoSeen, parseSteamPromoSeen, steamPromoActive, steamPromoSeenEntry } from "@/lib/steamPromo";
import type { SteamLabels } from "@/lib/steamLabels";
import { SteamLogo } from "./SteamButton";

/** Nome del popup fra i riquadri che si aprono da soli (src/lib/autoOpen.ts). */
const PANEL_ID = "steam-promo";

type CloseMethod = "close" | "later" | "esc" | "backdrop";

/** Anche con lo storage bloccato il popup non si riapre a ogni pagina della scheda. */
const seenInTab = new Set<string>();

function seen(entry: string): boolean {
  if (seenInTab.has(entry)) return true;
  try {
    return parseSteamPromoSeen(localStorage.getItem(STEAM_PROMO_SEEN_KEY)).includes(entry);
  } catch {
    return false;
  }
}

function markSeen(entry: string) {
  seenInTab.add(entry);
  try {
    const list = parseSteamPromoSeen(localStorage.getItem(STEAM_PROMO_SEEN_KEY));
    localStorage.setItem(STEAM_PROMO_SEEN_KEY, JSON.stringify(addSteamPromoSeen(list, entry)));
  } catch {
    /* storage non disponibile: resta il ricordo della scheda */
  }
}

type LinkState = "linked" | "unlinked" | "unknown";

/** Il collegamento con Steam si chiede una volta per scheda e per account (steam_link_status, solo le proprie righe). */
const linkChecks = new Map<string, Promise<LinkState>>();
function steamLinkState(sb: Db, userId: string): Promise<LinkState> {
  let check = linkChecks.get(userId);
  if (!check) {
    check = Promise.resolve(sb.rpc("steam_link_status")).then(
      ({ data, error }): LinkState => (error ? "unknown" : parseSteamLinkStatus(data) ? "linked" : "unlinked"),
      (): LinkState => "unknown",
    );
    linkChecks.set(userId, check);
  }
  return check;
}

/**
 * La voce della memoria del browser per chi ha fatto l'accesso e non ha Steam collegato; null per tutti gli altri:
 * niente accesso, popup già visto, Steam già collegato (e allora non si richiede più), lettura non riuscita.
 */
async function promoEntry(promoId: string): Promise<string | null> {
  const sb = supabaseBrowser();
  if (!sb) return null;
  let userId: string | undefined;
  try {
    userId = (await sb.auth.getSession()).data.session?.user.id;
  } catch {
    return null;
  }
  if (!userId) return null;
  const entry = steamPromoSeenEntry(promoId, userId);
  if (seen(entry)) return null;
  const state = await steamLinkState(sb, userId);
  if (state === "linked") markSeen(entry);
  return state === "unlinked" ? entry : null;
}

/* Consenso cookie come "store esterno", come nel popup dei tornei: sul server e nell'idratazione vale UNKNOWN. */
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
 * Popup "collega Steam" per gli iscritti (09/11/2026): regole in src/lib/steamPromo.ts. Montato nel layout della lingua,
 * nell'HTML non c'è niente: tutto si decide nel browser, dopo aver letto la sessione e il collegamento con Steam.
 * Stessa forma del popup dei tornei, senza copertina (stili `.promo-*` di globals.css): <dialog> modale nativo, focus
 * sul tasto × alla comparsa, Esc, tasto Indietro del telefono e clic fuori lo chiudono; al centro da 640 px, foglio dal
 * basso sotto. Il tasto porta a /account#steam, dove c'è "Collega Steam".
 */
export function SteamPromoDialog({ promoId, until, href, labels }: { promoId: string; until: string | null; href: string; labels: SteamLabels["promo"] }) {
  const pathname = usePathname() ?? "";
  const quiet = promoQuietPath(pathname);

  const consent = useSyncExternalStore<Consent | null | typeof UNKNOWN>(subscribeConsent, getConsent, consentOnServer);
  const [bannerReopened, setBannerReopened] = useState(false);
  // scelta fatta in questa scheda: conta anche se lo storage è bloccato e getConsent() resta null
  const [decidedInTab, setDecidedInTab] = useState(false);
  const bannerOpen = consent === UNKNOWN || bannerReopened || (consent === null && !decidedInTab);

  const [entry, setEntry] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const textId = `${baseId}-text`;

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

  // Apertura automatica: STEAM_PROMO_DELAY_MS dopo il banner dei cookie e dopo l'ultimo cambio di pagina, una volta per
  // browser e per account, solo a chi ha fatto l'accesso e non ha Steam collegato.
  useEffect(() => {
    if (entry || quiet || bannerOpen) return;
    // le pagine statiche possono essere più vecchie della fine del popup: si ricontrolla nel browser
    const active = () => steamPromoActive(Date.now(), { id: promoId, until });
    if (!active()) return;
    let cancelled = false;
    let timer = 0;
    const tryOpen = async () => {
      if (cancelled) return;
      if (document.hidden || isBusy() || otherPanelOpen(PANEL_ID)) {
        timer = window.setTimeout(tryOpen, STEAM_PROMO_DELAY_MS);
        return;
      }
      const next = await promoEntry(promoId);
      if (cancelled || !next || !active() || otherPanelOpen(PANEL_ID)) return;
      setEntry(next);
    };
    timer = window.setTimeout(tryOpen, STEAM_PROMO_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [entry, quiet, bannerOpen, promoId, until]);

  // Il dialog esiste solo da aperto: appena montato diventa modale, e gli altri riquadri aspettano.
  useEffect(() => {
    if (!entry) return;
    setPanelOpen(PANEL_ID, true);
    const d = dialogRef.current;
    if (d && !d.open) {
      try {
        d.showModal();
      } catch {
        /* già aperto o non collegato */
      }
    }
    trackEvent("steam_promo_view", { promo: promoId });
    return () => setPanelOpen(PANEL_ID, false);
  }, [entry, promoId]);

  if (!entry) return null;

  const finish = (method?: CloseMethod) => {
    markSeen(entry);
    if (method) trackEvent("steam_promo_close", { promo: promoId, method });
    const d = dialogRef.current;
    if (d?.open) d.close();
    setEntry(null);
  };

  return (
    <dialog
      ref={dialogRef}
      className="promo-dialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(e) => {
        e.preventDefault();
        finish("esc");
      }}
      onClose={() => {
        markSeen(entry);
        setEntry(null);
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
        <div className="p-5 sm:p-6">
          {/* spazio a destra per la × */}
          <p className="kicker flex items-center gap-2 pr-10 text-mint">
            <SteamLogo className="h-4 w-4 flex-none" />
            {labels.kicker}
          </p>
          <h2 id={titleId} className="t-page mt-2 pr-8">
            {labels.title}
          </h2>
          <p id={textId} className="mt-3 text-pale">
            {labels.text}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href={href}
              prefetch={false}
              className="btn btn-primary min-w-0 flex-1 basis-56"
              onClick={() => {
                trackEvent("steam_promo_click", { promo: promoId });
                finish();
              }}
            >
              {labels.cta} →
            </Link>
            <button type="button" className="btn btn-ghost flex-none" onClick={() => finish("later")}>
              {labels.later}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
