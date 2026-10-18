"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { AutoCloseDetails } from "./AutoCloseDetails";

/** La stessa pagina nelle altre lingue: il percorso senza il prefisso della lingua. */
function useRest(locale: Locale): string {
  const pathname = usePathname() || `/${locale}`;
  return pathname.replace(new RegExp(`^/(${locales.join("|")})(?=/|$)`), "");
}

/**
 * Selettore della lingua. Nell'header, da 640 px, è una piccola tendina (18/10/2026, Pierluigi: "mettiamo il selettore
 * lingua con un mini menu a tendina e non come sono ora"): un tasto con la lingua corrente e, aperto, le quattro lingue
 * con il loro nome; si chiude da solo al cambio pagina, al clic fuori e con Esc (AutoCloseDetails). Dentro il menu del
 * telefono, che è già una tendina, resta la fila delle quattro pastiglie (`variant="pills"`).
 */
export function LocaleSwitcher({ locale, label, className = "", variant = "dropdown" }: { locale: Locale; label: string; className?: string; variant?: "dropdown" | "pills" }) {
  const rest = useRest(locale);
  if (variant === "pills") {
    return (
      <nav aria-label={label} className={`${className} flex items-center gap-0.5 rounded-full border border-felt-line p-0.5`}>
        {locales.map((l) => {
          const active = l === locale;
          return (
            <Link
              key={l}
              href={`/${l}${rest}`}
              hrefLang={l}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition ${active ? "bg-mint text-ink" : "text-chalk-muted hover:text-chalk"}`}
            >
              {l}
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <AutoCloseDetails
      className={`relative shrink-0 ${className}`}
      summaryClassName="flex cursor-pointer list-none items-center gap-1 rounded-full border border-felt-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-chalk transition hover:border-mint hover:text-mint [&::-webkit-details-marker]:hidden"
      summaryLabel={`${label}: ${localeNames[locale]}`}
      summary={
        <>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="8" cy="8" r="6.3" />
            <path d="M1.7 8h12.6M8 1.7c1.8 1.9 2.6 4 2.6 6.3S9.8 12.4 8 14.3M8 1.7C6.2 3.6 5.4 5.7 5.4 8s.8 4.4 2.6 6.3" />
          </svg>
          {locale}
          <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2 w-2" fill="currentColor">
            <path d="M1 3h8L5 8z" />
          </svg>
        </>
      }
    >
      <nav aria-label={label} className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-felt-line bg-felt-deep p-1.5 shadow-lift">
        {locales.map((l) => {
          const active = l === locale;
          return (
            <Link
              key={l}
              href={`/${l}${rest}`}
              hrefLang={l}
              lang={l}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-night-3 text-mint" : "text-chalk hover:bg-night-2 hover:text-mint"}`}
            >
              <span>{localeNames[l]}</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-chalk-muted">{l}</span>
            </Link>
          );
        })}
      </nav>
    </AutoCloseDetails>
  );
}
