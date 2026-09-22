"use client";

import { useEffect, useRef, type RefObject } from "react";
import { turnstileAction, turnstileScript, turnstileSiteKey } from "@/lib/turnstile";

type RenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  language?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: () => void;
  "before-interactive-callback"?: () => void;
  "unsupported-callback"?: () => void;
};

type TurnstileApi = {
  render: (element: HTMLElement, options: RenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Perché il widget non ha funzionato: script bloccato, errore del widget, nessuna risposta in tempo, browser non supportato. */
export type TurnstileFailure = "script" | "widget" | "timeout" | "unsupported";

/** Lo script si carica una volta sola per pagina, anche se il widget viene montato più volte. */
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = turnstileScript;
      el.async = true;
      el.defer = true;
      el.addEventListener("load", () => resolve());
      el.addEventListener("error", () => {
        loading = null; // un blocco di rete non deve impedire un nuovo tentativo
        reject(new Error("Turnstile: script non caricato"));
      });
      document.head.appendChild(el);
    });
  }
  return loading;
}

function clearTimer(timer: RefObject<number | null>) {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
    timer.current = null;
  }
}

type Props = {
  /** Riceve il token da allegare alla richiesta, oppure null quando scade o va in errore. */
  onToken: (token: string | null) => void;
  /** Chiamata se lo script non si carica, il widget fallisce o non risponde entro `timeoutMs`: il modulo mostra un messaggio. */
  onError?: (reason: TurnstileFailure) => void;
  /** Cambiando questo numero il widget si azzera: il token è usa e getta, dopo ogni invio ne serve uno nuovo. */
  resetSignal?: number;
  /**
   * Dopo quanti millisecondi senza token e senza una sfida da risolvere il widget si considera bloccato (rilievo UX-12
   * del 21/09/2026: con Brave, Firefox in modalità rigida o una rete aziendale che blocca challenges.cloudflare.com
   * il widget non si disegna e non segnala nulla, e il tasto restava grigio per sempre). Predefinito 8 secondi.
   */
  timeoutMs?: number;
  locale?: string;
  className?: string;
};

/**
 * Widget Turnstile. Non disegna nulla finché NEXT_PUBLIC_TURNSTILE_SITE_KEY non è impostata
 * (vedi `src/lib/turnstile.ts`), così l'accesso resta identico a prima quando il CAPTCHA è spento.
 *
 * Il cronometro del guasto parte al montaggio e a ogni azzeramento, e si ferma appena arriva un token o appena
 * Cloudflare mostra una sfida da risolvere a mano (in quel caso il widget c'è: si aspetta la persona, non la rete).
 * Un token che arriva tardi resta valido: il modulo lo usa comunque.
 */
export function Turnstile({ onToken, onError, resetSignal = 0, timeoutMs = 8000, locale, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const timer = useRef<number | null>(null);
  // Le callback cambiano a ogni render del modulo: tenerle in un ref evita di rimontare il widget.
  const callbacks = useRef({ onToken, onError, timeoutMs });
  useEffect(() => {
    callbacks.current = { onToken, onError, timeoutMs };
  });

  useEffect(() => {
    if (!turnstileSiteKey) return;
    let annullato = false;
    const fail = (reason: TurnstileFailure) => {
      clearTimer(timer);
      if (annullato) return;
      callbacks.current.onToken(null);
      callbacks.current.onError?.(reason);
    };
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (!annullato) callbacks.current.onError?.("timeout");
    }, callbacks.current.timeoutMs);
    loadScript()
      .then(() => {
        if (annullato || !box.current || !window.turnstile) return;
        try {
          widgetId.current = window.turnstile.render(box.current, {
            sitekey: turnstileSiteKey,
            action: turnstileAction,
            theme: "dark",
            language: locale,
            callback: (token) => {
              clearTimer(timer);
              callbacks.current.onToken(token);
            },
            "expired-callback": () => callbacks.current.onToken(null),
            "timeout-callback": () => callbacks.current.onToken(null),
            // sfida da risolvere a mano: il widget si è disegnato, ora si aspetta la persona
            "before-interactive-callback": () => clearTimer(timer),
            "unsupported-callback": () => fail("unsupported"),
            "error-callback": () => fail("widget"),
          });
        } catch {
          fail("widget");
        }
      })
      .catch(() => fail("script"));
    return () => {
      annullato = true;
      clearTimer(timer);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [locale]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      // nuovo giro, nuovo cronometro: se il token nuovo non arriva, il modulo lo deve sapere
      clearTimer(timer);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        callbacks.current.onError?.("timeout");
      }, callbacks.current.timeoutMs);
    }
  }, [resetSignal]);

  if (!turnstileSiteKey) return null;
  return <div ref={box} className={className} />;
}
