import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { Wordmark } from "./Wordmark";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items: { label: string; path: string }[] = [
    { label: dict.nav.cards, path: "/cards" },
    { label: dict.nav.decks, path: "/decks" },
    { label: dict.nav.tierList, path: "/tier-list" },
    { label: dict.nav.guides, path: "/guides" },
    { label: dict.nav.tournaments, path: "/tournaments" },
    { label: dict.nav.news, path: "/news" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-felt-line/70 bg-felt-deep/85 backdrop-blur supports-[backdrop-filter]:bg-felt-deep/70">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href={href(locale)} className="flex shrink-0 items-center gap-2" aria-label={dict.meta.siteName}>
          <Wordmark />
        </Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {items.map((it) => (
            <Link
              key={it.path}
              href={href(locale, it.path)}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-chalk-muted transition hover:bg-felt-soft hover:text-chalk"
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto lg:ml-3">
          <LocaleSwitcher locale={locale} label={dict.nav.language} />
        </div>
        <details className="relative lg:hidden">
          <summary
            className="btn btn-ghost cursor-pointer list-none px-3 py-1.5 text-xs [&::-webkit-details-marker]:hidden"
            aria-label={dict.nav.menu}
          >
            {dict.nav.menu}
          </summary>
          <nav className="absolute right-0 mt-2 w-56 rounded-xl border border-felt-line bg-felt-deep p-2 shadow-lift" aria-label="Mobile">
            {items.map((it) => (
              <Link key={it.path} href={href(locale, it.path)} className="block rounded-lg px-3 py-2 text-sm text-chalk hover:bg-felt-soft">
                {it.label}
              </Link>
            ))}
            <Link href={href(locale, "/about")} className="block rounded-lg px-3 py-2 text-sm text-chalk-muted hover:bg-felt-soft">
              {dict.nav.about}
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
