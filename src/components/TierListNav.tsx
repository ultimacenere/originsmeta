import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { AutoCloseDetails } from "./AutoCloseDetails";

/**
 * Menu a tendina della sezione Tier list (Pierluigi, 23/09/2026: "in tier list abbiamo le tier list che si
 * generano dai dati dei tornei ufficiali di Origins, poi abbiamo le tier list che si generano dalle tier list
 * dei nostri utenti. Non possono vivere nella stessa pagina: propongo un menu a tendina in tierlist —
 * tier list ufficiali — tier list community").
 *
 * Sono due pagine diverse, con due fonti diverse, e questa tendina dice sempre dove ci si trova e come passare
 * all'altra. La terza voce è il tool per farsi la propria, che è ciò che alimenta la tier list della community.
 * Componente server: la tendina si chiude da sola al cambio pagina (AutoCloseDetails).
 */

export type TierListSection = "official" | "community" | "create";

export function TierListNav({ locale, dict, current }: { locale: Locale; dict: Dictionary; current: TierListSection }) {
  const items: { id: TierListSection; label: string; text: string; path: string }[] = [
    { id: "official", label: dict.tier.navOfficial, text: dict.tier.navOfficialText, path: "/tier-list" },
    { id: "community", label: dict.tier.navCommunity, text: dict.tier.navCommunityText, path: "/tier-list/community" },
    { id: "create", label: dict.tier.navCreate, text: dict.tier.navCreateText, path: "/tier-list/create" },
  ];
  const here = items.find((i) => i.id === current) ?? items[0];

  return (
    <AutoCloseDetails
      className="relative mt-4 inline-block"
      summaryClassName="btn btn-choice is-on cursor-pointer list-none px-4 [&::-webkit-details-marker]:hidden"
      summaryLabel={`${dict.tier.navLabel}: ${here.label}`}
      summary={
        <>
          {here.label}
          <span aria-hidden="true">▾</span>
        </>
      }
    >
      <nav aria-label={dict.tier.navLabel} className="absolute left-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border-2 border-sky bg-night p-2 shadow-lift">
        {items.map((it) => (
          <Link
            key={it.id}
            href={href(locale, it.path)}
            aria-current={it.id === current ? "page" : undefined}
            className={`block rounded-lg px-3 py-2 ${it.id === current ? "bg-night-3" : "hover:bg-night-3/70"}`}
          >
            <span className="block font-display text-sm font-bold text-sky">{it.label}</span>
            <span className="mt-0.5 block text-xs text-pale-muted">{it.text}</span>
          </Link>
        ))}
      </nav>
    </AutoCloseDetails>
  );
}
