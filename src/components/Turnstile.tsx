"use client";

import { useEffect, useRef } from "react";
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

type Props = {
  /** Riceve il token da allegare alla richiesta, oppure null quando scade o va in errore. */
  onToken: (token: string | null) => void;
  /** Chiamata se lo script non si carica o il widget fallisce: il modulo mostra un messaggio. */
  onError?: () => void;
  /** Cambiando questo numero il widget si azzera: il token è usa e getta, dopo ogni invio ne serve uno nuovo. */
  resetSignal?: number;
  locale?: string;
  className?: string;
};

/**
 * Widget Turnstile. Non disegna nulla finché NEXT_PUBLIC_TURNSTILE_SITE_KEY non è impostata
 * (vedi `src/lib/turnstile.ts`), così l'accesso resta identico a prima quando il CAPTCHA è spento.
 */
export function Turnstile({ onToken, onError, resetSignal = 0, locale, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Le callback cambiano a ogni render del modulo: tenerle in un ref evita di rimontare il widget.
  const callbacks = useRef({ onToken, onError });
  useEffect(() => {
    callbacks.current = { onToken, onError };
  });

  useEffect(() => {
    if (!turnstileSiteKey) return;
    let annullato = false;
    loadScript()
      .then(() => {
        if (annullato || !box.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(box.current, {
          sitekey: turnstileSiteKey,
          action: turnstileAction,
          theme: "dark",
          language: locale,
          callback: (token) => callbacks.current.onToken(token),
          "expired-callback": () => callbacks.current.onToken(null),
          "timeout-callback": () => callbacks.current.onToken(null),
          "error-callback": () => {
            callbacks.current.onToken(null);
            callbacks.current.onError?.();
          },
        });
      })
      .catch(() => {
        if (!annullato) callbacks.current.onError?.();
      });
    return () => {
      annullato = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [locale]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [resetSignal]);

  if (!turnstileSiteKey) return null;
  return <div ref={box} className={className} />;
}
