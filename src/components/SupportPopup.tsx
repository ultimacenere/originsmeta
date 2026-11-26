"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, PREFERENCES_EVENT, getConsent, type Consent } from "@/lib/consent";
import { isBusy, otherPanelOpen, setPanelOpen } from "@/lib/autoOpen";
import { promoQuietPath } from "@/lib/tournamentPromo";
import type { Locale } from "@/lib/i18n";
import { PayPalButton } from "./PayPalButton";

/** Nome del popup fra i riquadri che si aprono da soli (src/lib/autoOpen.ts). */
const PANEL_ID = "support-popup";

/** Un secondo dopo il popup del torneo (3 s), così non partono insieme. */
const SUPPORT_DELAY_MS = 4000;

type SupportText = { title: string; pitch: string; close: string };

/** Testi del popup (Pierluigi, 25/11/2026: "SOSTIENI ORIGINSMETA — se ti piace il nostro lavoro sostienici!"). */
export const supportText: Record<Locale, SupportText> = {
  en: { title: "Support OriginsMeta", pitch: "If you like our work, support us!", close: "Close" },
  it: { title: "Sostieni OriginsMeta", pitch: "Se ti piace il nostro lavoro, sostienici!", close: "Chiudi" },
  es: { title: "Apoya OriginsMeta", pitch: "¡Si te gusta nuestro trabajo, apóyanos!", close: "Cerrar" },
  fr: { title: "Soutenez OriginsMeta", pitch: "Si vous aimez notre travail, soutenez-nous !", close: "Fermer" },
  pt: { title: "Apoie o OriginsMeta", pitch: "Se você gosta do nosso trabalho, apoie a gente!", close: "Fechar" },
  de: { title: "Unterstütze OriginsMeta", pitch: "Wenn dir unsere Arbeit gefällt, unterstütze uns!", close: "Schließen" },
  ru: { title: "Поддержите OriginsMeta", pitch: "Если вам нравится наша работа, поддержите нас!", close: "Закрыть" },
  "zh-cn": { title: "支持 OriginsMeta", pitch: "如果你喜欢我们的工作，请支持我们！", close: "关闭" },
};

/* Consenso cookie come "store esterno", come nel popup del torneo: sul server e nell'idratazione vale UNKNOWN. */
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
 * Popup "Sostieni OriginsMeta" con il tasto "Dona ora" verso PayPal (Pierluigi, 25/11/2026: "popup visibile a tutti anche
 * se lo hanno già visto"). Non si ricorda chi l'ha chiuso: si apre a ogni visita, cioè a ogni caricamento del sito in
 * una scheda; montato nel layout della lingua, non si riapre a ogni cambio di pagina della stessa visita.
 *
 * Stesse regole di convivenza del popup del torneo: aspetta la scelta sui cookie (niente due riquadri uno sopra l'altro),
 * non si apre mentre si scrive in un campo, mai insieme a un altro riquadro (src/lib/autoOpen.ts), non nelle pagine di
 * accesso, account, strumenti e moduli (`promoQuietPath`): lì aspetta la pagina successiva.
 * Stessa cornice (classi .promo-*): al centro da 640 px, sotto un foglio dal basso. Il clic su "Dona ora" lo conta
 * `donate_click` con placement "popup".
 */
export function SupportPopup({ locale, donateLabel, donateAria }: { locale: Locale; donateLabel: string; donateAria: string }) {
  const text = supportText[locale] ?? supportText.en;
  const pathname = usePathname() ?? "";
  const quiet = promoQuietPath(pathname);

  const consent = useSyncExternalStore<Consent | null | typeof UNKNOWN>(subscribeConsent, getConsent, consentOnServer);
  const [bannerReopened, setBannerReopened] = useState(false);
  const [decidedInTab, setDecidedInTab] = useState(false);
  const bannerOpen = consent === UNKNOWN || bannerReopened || (consent === null && !decidedInTab);

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
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

  // Apertura automatica: una volta per visita, SUPPORT_DELAY_MS dopo il banner dei cookie e dopo l'ultimo cambio di pagina.
  useEffect(() => {
    if (open || done || quiet || bannerOpen) return;
    let timer = 0;
    const tryOpen = () => {
      if (document.hidden || isBusy() || otherPanelOpen(PANEL_ID)) {
        timer = window.setTimeout(tryOpen, SUPPORT_DELAY_MS);
        return;
      }
      setOpen(true);
    };
    timer = window.setTimeout(tryOpen, SUPPORT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open, done, quiet, bannerOpen]);

  // Il dialog esiste solo da aperto: appena montato diventa modale, e gli altri riquadri aspettano.
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
    return () => setPanelOpen(PANEL_ID, false);
  }, [open]);

  if (!open) return null;

  const finish = () => {
    setDone(true);
    const d = dialogRef.current;
    if (d?.open) d.close();
    setOpen(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className="promo-dialog"
      aria-labelledby={titleId}
      aria-describedby={pitchId}
      onCancel={(e) => {
        e.preventDefault();
        finish();
      }}
      onClose={() => {
        setDone(true);
        setOpen(false);
      }}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnBackdrop.current) finish();
      }}
    >
      <div className="card-night promo-card relative">
        <button type="button" className="promo-close" onClick={finish} aria-label={text.close}>
          <span aria-hidden="true">×</span>
        </button>
        <div className="p-6 pt-7 text-center sm:p-8">
          <h2 id={titleId} className="t-page px-8 uppercase">
            {text.title}
          </h2>
          <p id={pitchId} className="mt-3 text-base text-pale">
            {text.pitch}
          </p>
          <div className="mt-6 flex justify-center" onClick={finish}>
            <PayPalButton label={donateAria} placement="popup">
              {donateLabel}
            </PayPalButton>
          </div>
        </div>
      </div>
    </dialog>
  );
}
