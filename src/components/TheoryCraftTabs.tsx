import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { theoryCraftLabels } from "@/lib/theoryCraftLabels";
import { THEORY_DECKS_PATH, THEORY_PATH } from "@/lib/theoryCraftPaths";

/**
 * Le due pagine del Theory craft (29/10/2026): il deck builder con le carte non ancora nel gioco e l'elenco dei mazzi
 * costruiti così, come le schede di /decks (`DeckSectionTabs`). Componente server, nessuno stato: la scheda attiva la dice
 * la pagina.
 */
export function TheoryCraftTabs({ locale, active }: { locale: Locale; active: "builder" | "decks" }) {
  const L = theoryCraftLabels[locale].tabs;
  const tabs = [
    { id: "builder", label: L.builder, path: THEORY_PATH },
    { id: "decks", label: L.decks, path: THEORY_DECKS_PATH },
  ] as const;
  return (
    <nav aria-label={L.aria} className="mb-5 flex flex-wrap gap-1 rounded-full border-2 border-sky p-0.5 sm:w-fit">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={href(locale, t.path)}
          aria-current={active === t.id ? "page" : undefined}
          className={`flex-1 rounded-full px-4 py-1.5 text-center font-display text-xs font-bold sm:flex-none ${active === t.id ? "bg-night-3 text-sky" : "text-pale-muted hover:text-sky"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
