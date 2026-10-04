import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { deckSetLabels } from "@/lib/deckSetLabels";

/**
 * Le due sezioni dei mazzi (04/10/2026, Pierluigi: "avremo mazzi singoli e mazzi tornei sotto il menu mazzi"): schede in
 * cima a /decks, /decks/tournament e alla scheda di un mazzo torneo, le stesse voci del sottomenu "Mazzi" dell'header.
 * Componente server, nessuno stato: la scheda attiva la dice la pagina.
 */
export function DeckSectionTabs({ locale, active }: { locale: Locale; active: "single" | "tournament" }) {
  const L = deckSetLabels[locale].nav;
  const tabs = [
    { id: "single", label: L.single, path: "/decks" },
    { id: "tournament", label: L.tournament, path: "/decks/tournament" },
  ] as const;
  return (
    <nav aria-label={L.tabs} className="mb-5 flex flex-wrap gap-1 rounded-full border-2 border-sky p-0.5 sm:w-fit">
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
