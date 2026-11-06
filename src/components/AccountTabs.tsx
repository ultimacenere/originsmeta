import Link from "next/link";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { accountLabels } from "@/lib/accountLabels";
import { analyticsAccess } from "@/lib/community/analyticsAccess";
import { AccountHashScroll } from "./AccountHashScroll";

export type AccountTab = "profile" | "public" | "messages" | "tracker" | "twitch";

/**
 * Le schede dell'area account (06/11/2026, Pierluigi: "dobbiamo sistemare un po di pagine, i profili personali"): una
 * barra sola in cima a /account, /account/profile, /account/messages, /account/tracker e /account/twitch, al posto dei
 * link "← Il mio profilo" e dei riquadri in fondo a /account che portavano a Tracker e dirette. Stessa forma di
 * `DeckSectionTabs`; sul telefono le schede vanno a capo e riempiono la riga, così si vedono tutte senza scorrere.
 * Con `ANALYTICS_PUBLIC` spento (prova del 10/10/2026) la scheda Tracker la vede solo chi può aprire la pagina.
 */
export async function AccountTabs({ locale, active }: { locale: Locale; active: AccountTab }) {
  const L = accountLabels[locale].tabs;
  const tracker = await analyticsAccess();
  const tabs: { id: AccountTab; label: string; path: string }[] = [
    { id: "profile", label: getDictionary(locale).nav.account, path: "/account" },
    { id: "public", label: L.public, path: "/account/profile" },
    { id: "messages", label: L.messages, path: "/account/messages" },
    ...(tracker ? [{ id: "tracker" as const, label: "Tracker", path: "/account/tracker" }] : []),
    { id: "twitch", label: "Twitch", path: "/account/twitch" },
  ];
  return (
    <nav aria-label={L.aria} className="mb-6 flex flex-wrap gap-1 rounded-2xl border-2 border-sky p-1 sm:w-fit">
      <AccountHashScroll />
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={href(locale, t.path)}
          prefetch={false}
          aria-current={active === t.id ? "page" : undefined}
          className={`flex-1 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-center font-display text-xs font-bold sm:flex-none ${active === t.id ? "bg-night-3 text-sky" : "text-pale-muted hover:text-sky"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
