import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import "./replay.css";

/** Le due versioni del replay: Leggendarie e carte base (in produzione: le schede della tier list). */
export function ReplayTabs({ locale, current }: { locale: Locale; current: "legendaries" | "cards" }) {
  const tabs = [
    { id: "legendaries", label: "Leggendarie", path: "/tier-list/lab/replay" },
    { id: "cards", label: "Carte base", path: "/tier-list/lab/replay/carte" },
  ] as const;
  return (
    <nav aria-label="Versioni del replay">
      <ul className="tlr-tabs">
        {tabs.map((t) => (
          <li key={t.id}>
            <Link href={href(locale, t.path)} aria-current={t.id === current ? "page" : undefined}>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
