"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

export function LocaleSwitcher({ locale, label, className = "flex" }: { locale: Locale; label: string; className?: string }) {
  const pathname = usePathname() || `/${locale}`;
  const prefix = new RegExp(`^/(${locales.join("|")})(?=/|$)`);
  const rest = pathname.replace(prefix, "");
  return (
    <nav aria-label={label} className={`${className} items-center gap-0.5 rounded-full border border-felt-line p-0.5`}>
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`/${l}${rest}`}
            hrefLang={l}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
              active ? "bg-mint text-ink" : "text-chalk-muted hover:text-chalk"
            }`}
          >
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
