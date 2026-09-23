import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { Wordmark } from "./Wordmark";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { AccountMenu } from "./AccountMenu";
import { AutoCloseDetails } from "./AutoCloseDetails";
import { NavLink } from "./NavLink";

export function navItems(dict: Dictionary): { label: string; path: string }[] {
  return [
    { label: dict.nav.news, path: "/news" },
    { label: dict.nav.tierList, path: "/tier-list" },
    { label: dict.nav.guides, path: "/guides" },
    { label: dict.nav.cards, path: "/cards" },
    { label: dict.nav.decks, path: "/decks" },
    { label: dict.nav.builder, path: "/deck-builder" },
    { label: dict.nav.events, path: "/tournaments" },
    { label: dict.nav.faq, path: "/faq" },
  ];
}

/**
 * Header fisso. Sotto 640 px la riga deve stare nei 343 px di un telefono da 375: logo alla misura base del
 * Wordmark (1.15 rem, come in produzione), selettore lingua dentro il menu a tendina (torna nella riga da `sm`),
 * menu che si chiude da solo al cambio pagina (AutoCloseDetails: l'header sopravvive alla navigazione lato client).
 * L'header resta un server component statico: solo le voci di menu (NavLink) e lo stato di accesso (AccountMenu)
 * leggono il percorso nel browser, per segnare la pagina corrente e portare "Accedi" con il ritorno.
 */
export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = navItems(dict);
  return (
    // Fondo dello stesso colore della pagina (23/09/2026): con `felt-deep` la barra fissa era una fascia più scura
    // in cima, che non combaciava con lo sfondo sotto (riunione: "sfondo header e sfondo sotto non sincronizzati").
    <header className="sticky top-0 z-40 border-b border-felt-line/70 bg-felt/85 backdrop-blur supports-[backdrop-filter]:bg-felt/70">
      {/* tra 1280 e 1535 px la riga ospita menu completo, ricerca, Accedi e lingua: spazi e ricerca un po' più stretti;
          sotto i 360 px (telefoni da 320) margini, spazi e tasto Menu più stretti, altrimenti la riga sbordava di 18 px */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 max-[359px]:gap-1 max-[359px]:px-3 sm:gap-3 sm:px-6 xl:gap-2 2xl:gap-3">
        <Link href={href(locale)} className="flex shrink-0 items-center gap-2" aria-label={dict.meta.siteName}>
          <Wordmark />
        </Link>
        {/* voce della pagina corrente: aria-current="page"; aspetto (riposo, passaggio, attiva) tutto in .nav-link */}
        <nav className="ml-3 hidden shrink-0 items-center gap-0.5 xl:flex" aria-label={dict.nav.mainNav}>
          {items.map((it) => (
            <NavLink key={it.path} href={href(locale, it.path)}>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <form action={href(locale, "/cards")} method="get" role="search" className="ml-auto hidden items-center md:flex">
          <label htmlFor="header-card-search" className="sr-only">
            {dict.common.search}
          </label>
          <input
            id="header-card-search"
            name="q"
            type="search"
            placeholder={dict.nav.search}
            className="w-44 rounded-l-full border border-felt-line bg-felt px-4 py-2 text-sm text-chalk placeholder:text-chalk-muted/70 focus:border-mint xl:w-28 2xl:w-52"
          />
          <button type="submit" className="rounded-r-full border border-l-0 border-felt-line bg-felt-soft px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mint hover:bg-felt-line">
            {dict.nav.searchButton}
          </button>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <AccountMenu
            locale={locale}
            labels={{ login: dict.nav.login, account: dict.nav.account, builder: dict.nav.builder, logout: dict.nav.logout, player: dict.nav.playerFallback }}
          />
          <LocaleSwitcher locale={locale} label={dict.nav.language} className="hidden sm:flex" />
        </div>
        <AutoCloseDetails
          className="relative xl:hidden"
          summaryClassName="btn btn-ghost cursor-pointer list-none px-3 py-1.5 text-xs max-[359px]:px-2 [&::-webkit-details-marker]:hidden"
          summaryLabel={dict.nav.menu}
          summary={dict.nav.menu}
        >
          <nav className="absolute right-0 mt-2 w-60 rounded-xl border border-felt-line bg-felt-deep p-2 shadow-lift" aria-label={dict.nav.menu}>
            <form action={href(locale, "/cards")} method="get" role="search" className="mb-2 md:hidden">
              <input name="q" type="search" aria-label={dict.common.search} placeholder={dict.nav.search} className="w-full rounded-lg border border-felt-line bg-felt px-3 py-2 text-sm text-chalk" />
            </form>
            {/* nella tendina la pagina corrente ha la barra verticale di .nav-link-block */}
            {items.map((it) => (
              <NavLink key={it.path} href={href(locale, it.path)} className="nav-link-block">
                {it.label}
              </NavLink>
            ))}
            <NavLink href={href(locale, "/about")} className="nav-link-block">
              {dict.nav.about}
            </NavLink>
            {/* sotto 640 px il selettore lingua sta qui: nella riga dell'header non c'è spazio */}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-felt-line px-3 pt-3 sm:hidden">
              <span className="text-xs text-chalk-muted">{dict.nav.language}</span>
              <LocaleSwitcher locale={locale} label={dict.nav.language} />
            </div>
          </nav>
        </AutoCloseDetails>
      </div>
    </header>
  );
}
