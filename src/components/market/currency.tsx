"use client";

import { useSyncExternalStore } from "react";
import { MARKET_CURRENCIES, convertCents, defaultCurrency, formatMoney, type MarketCurrency } from "@/lib/market/market";

/**
 * Valuta del tracker dei prezzi (17/10/2026): euro o dollari, scelta una volta e ricordata nel browser (localStorage,
 * comodità di chi guarda: senza, si riparte dalla valuta della lingua). L'HTML del server ha la valuta della lingua
 * (dollari in inglese, euro nelle altre), il browser passa a quella scelta dopo l'idratazione. Tutti i prezzi della
 * pagina cambiano insieme (evento `om-market-currency`).
 */

const KEY = "originsmeta.market.currency.v1";
const EVENT = "om-market-currency";

function stored(): MarketCurrency | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "EUR" || v === "USD" ? v : null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useMarketCurrency(locale: string): MarketCurrency {
  const fallback = defaultCurrency(locale);
  return useSyncExternalStore(subscribe, () => stored() ?? fallback, () => fallback);
}

function choose(c: MarketCurrency) {
  try {
    window.localStorage.setItem(KEY, c);
  } catch {
    /* senza localStorage la scelta vale solo fino al prossimo cambio pagina */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function CurrencySwitch({ locale, label }: { locale: string; label: string }) {
  const current = useMarketCurrency(locale);
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1.5">
      <span className="kicker text-chalk-muted">{label}</span>
      {MARKET_CURRENCIES.map((c) => (
        <button key={c} type="button" onClick={() => choose(c)} aria-pressed={current === c} className={`btn btn-choice px-3 py-1 text-xs ${current === c ? "is-on" : ""}`}>
          {c === "EUR" ? "€ EUR" : "$ USD"}
        </button>
      ))}
    </div>
  );
}

/** Un prezzo in centesimi di dollaro nella valuta scelta. */
export function MarketMoney({ cents, usdPerEur, locale, empty = "—" }: { cents: number | null; usdPerEur: number | null; locale: string; empty?: string }) {
  const currency = useMarketCurrency(locale);
  if (cents === null) return <>{empty}</>;
  return <>{formatMoney(convertCents(cents, currency, usdPerEur), currency, locale)}</>;
}
