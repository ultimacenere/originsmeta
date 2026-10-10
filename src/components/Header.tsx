import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { Wordmark } from "./Wordmark";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { AccountMenu } from "./AccountMenu";
import { AutoCloseDetails } from "./AutoCloseDetails";
import { NavLink } from "./NavLink";
import { DiscordButton, DiscordIconLink } from "./DiscordButton";
import { PayPalButton } from "./PayPalButton";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { AnalyticsNavLink } from "./AnalyticsOnly";

/**
 * `mobile`: le voci del sottomenu che vanno anche nella tendina del telefono e nel footer (oltre a quella principale).
 * `testOnly`: voce di OriginsMeta Analytics in prova, mostrata nel browser solo ai ruoli ammessi (`AnalyticsOnly`).
 */
type NavItem = { label: string; path: string; sub?: { label: string; path: string; mobile?: boolean; testOnly?: boolean }[] };

export function navItems(dict: Dictionary): NavItem[] {
  const t = dict.tier;
  return [
    {
      label: dict.nav.news,
      path: "/news",
      // sottomenu (04/10/2026, Pierluigi): l'elenco dei fumetti dei creator, anche nella tendina del telefono e nel footer
      sub: [
        { label: dict.nav.news, path: "/news" },
        { label: dict.nav.comics, path: "/news/comics", mobile: true },
      ],
    },
    {
      label: dict.nav.tierList,
      path: "/tier-list",
      // sottomenu del menu desktop (01/10/2026, Pierluigi): le quattro tier list, come le schede di TierListHeader
      sub: [
        { label: t.sourceOfficial, path: "/tier-list" },
        { label: t.sourceCommunity, path: "/tier-list/community" },
        // voti alle carte da 1 a 10 (06/10/2026): la tier list costruita dai voti degli iscritti
        { label: t.sourceVotes, path: "/tier-list/votes" },
        { label: t.sourcePlayed, path: "/tier-list/most-played" },
        // win rate dalle partite registrate con OriginsMeta Analytics: "Analytics · in pausa" dal 02/10, riaperti il 10/10/2026
        // ma in prova (solo Creator, Autore, Pro, Staff e admin): finché ANALYTICS_PUBLIC è spento la voce la vede nel
        // browser solo chi ha il ruolo (Pierluigi, 10/10: "la vedo sotto tierlist ma non c'è un percorso sul menu")
        // (l'indirizzo della voce in prova lo costruisce AnalyticsNavLink nel browser: qui non deve finire nell'HTML)
        ANALYTICS_PUBLIC ? { label: t.sourceWinrate, path: "/tier-list/win-rate" } : { label: t.sourceWinrate, path: "#winrate", testOnly: true },
      ],
    },
    { label: dict.nav.guides, path: "/guides" },
    { label: dict.nav.cards, path: "/cards" },
    {
      label: dict.nav.decks,
      path: "/decks",
      // sottomenu (04/10/2026, Pierluigi: "avremo mazzi singoli e mazzi tornei sotto il menu mazzi"): i mazzi singoli della
      // community e i Mazzi torneo, tre mazzi Conquest pubblicati insieme con una guida
      sub: [
        { label: dict.nav.decksSingle, path: "/decks" },
        { label: dict.nav.decksTournament, path: "/decks/tournament", mobile: true },
      ],
    },
    {
      label: dict.nav.builder,
      path: "/deck-builder",
      // sottomenu del menu desktop (02/10/2026): il draft contro il Cervello sta accanto al deck builder
      sub: [
        { label: dict.nav.builder, path: "/deck-builder" },
        { label: dict.nav.draft, path: "/draft", mobile: true },
      ],
    },
    { label: dict.nav.events, path: "/tournaments" },
    { label: dict.nav.faq, path: "/faq" },
  ];
}

/**
 * Header fisso. Sotto 640 px la riga deve stare nei 343 px di un telefono da 375: logo alla misura base del
 * Wordmark (1.15 rem, come in produzione), Accedi (con l'accesso fatto: busta dei messaggi e avatar, dal 27/09/2026) e
 * Menu, selettore lingua dentro il menu a tendina (torna nella riga da `sm`),
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
      {/* da 1280 px la riga ospita menu completo, Discord, Accedi, lingua e "Dona ora": spazi più stretti, anche sopra i
          1536 px (il contenitore resta di 1280); sotto i 360 px (telefoni da 320) margini, spazi e tasto Menu più stretti,
          altrimenti la riga sbordava di 18 px. La ricerca delle carte, che stava qui dal 15/09/2026 (fra 768 e 1279 px da
          160 px, oltre da 112), è stata tolta il 07/10/2026 per fare posto al tasto PayPal: si cerca da /cards. */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 max-[359px]:gap-1 max-[359px]:px-3 sm:gap-3 sm:px-6 xl:gap-2">
        <Link href={href(locale)} className="flex shrink-0 items-center gap-2" aria-label={dict.meta.siteName}>
          {/* il nome del sito lo dice l'aria-label del link qui sopra: l'immagine resta muta */}
          <Wordmark height={30} className="max-[359px]:!h-6" />
        </Link>
        {/* voce della pagina corrente: aria-current="page"; aspetto (riposo, passaggio, attiva) tutto in .nav-link */}
        <nav className="ml-1 hidden shrink-0 items-center gap-0.5 xl:flex" aria-label={dict.nav.mainNav}>
          {items.map((it) =>
            it.sub ? (
              // sottomenu al passaggio del mouse e col fuoco da tastiera, solo CSS (.nav-drop): l'header resta statico
              <div key={it.path} className="nav-drop">
                <NavLink href={href(locale, it.path)}>{it.label}</NavLink>
                <div className="nav-drop-panel">
                  <div className="nav-drop-box" role="group" aria-label={it.label}>
                    {it.sub.map((s) =>
                      s.testOnly ? (
                        <AnalyticsNavLink key={s.path} locale={locale} page="winrate" label={s.label} exact className="nav-link-block" />
                      ) : (
                        <NavLink key={s.path} href={href(locale, s.path)} exact className="nav-link-block">
                          {s.label}
                        </NavLink>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={it.path} href={href(locale, it.path)}>
                {it.label}
              </NavLink>
            ),
          )}
        </nav>
        {/* La ricerca delle carte non sta più nell'header dal 07/10/2026 (Pierluigi: "il tasto paypal ci manda in conflitto
            quindi recuperiamo spazio rimuovendo la searchbar che oggi la ritengo abbastanza inutile"): si cerca da /cards.
            min-w-0 (27/09/2026, busta dei messaggi accanto all'avatar): quando la riga è piena si accorcia il nome
            dell'account, che si tronca, invece di far sforare la riga */}
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {/* Loghino del NOSTRO Discord (Pierluigi, 24/09/2026); sotto 640 px la riga è piena e il tasto sta nel menu */}
          <DiscordIconLink href={ORIGINSMETA_DISCORD} label={dict.nav.discord} className="max-sm:!hidden" />
          <AccountMenu
            locale={locale}
            labels={{ login: dict.nav.login, account: dict.nav.account, builder: dict.nav.builder, logout: dict.nav.logout, player: dict.nav.playerFallback }}
          />
          <LocaleSwitcher locale={locale} label={dict.nav.language} className="hidden sm:flex" />
          {/* "Dona ora" verso PayPal (Pierluigi, 06/10/2026: "in alto sul menu dopo i selettori"); sotto 640 px sta nel menu.
              Da 640 a 1535 px la riga è piena e il tasto si accorcia per fasce (vedi PayPalButton.tsx): solo il testo,
              testo e marchio, e fra 1280 e 1535 px il tondo col monogramma, come il loghino Discord. */}
          <PayPalButton label={dict.nav.donateAria} placement="header" size="sm" className="hidden shrink-0 sm:inline-flex">
            {dict.nav.donate}
          </PayPalButton>
        </div>
        <AutoCloseDetails
          className="relative xl:hidden"
          summaryClassName="btn btn-ghost cursor-pointer list-none px-3 py-1.5 text-xs max-[359px]:px-2 [&::-webkit-details-marker]:hidden"
          summaryLabel={dict.nav.menu}
          summary={dict.nav.menu}
        >
          <nav className="absolute right-0 mt-2 w-60 rounded-xl border border-felt-line bg-felt-deep p-2 shadow-lift" aria-label={dict.nav.menu}>
            {/* nella tendina la pagina corrente ha la barra verticale di .nav-link-block */}
            {items.flatMap((it) => [
              <NavLink key={it.path} href={href(locale, it.path)} className="nav-link-block">
                {it.label}
              </NavLink>,
              ...(it.sub ?? [])
                .filter((s) => s.mobile)
                .map((s) => (
                  <NavLink key={s.path} href={href(locale, s.path)} className="nav-link-block pl-6">
                    {s.label}
                  </NavLink>
                )),
            ])}
            <NavLink href={href(locale, "/about")} className="nav-link-block">
              {dict.nav.about}
            </NavLink>
            {/* sotto 640 px il selettore lingua e il Discord stanno qui: nella riga dell'header non c'è spazio */}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-felt-line px-3 pt-3 sm:hidden">
              <span className="text-xs text-chalk-muted">{dict.nav.language}</span>
              <LocaleSwitcher locale={locale} label={dict.nav.language} />
            </div>
            <div className="mt-3 flex flex-col gap-2 px-3 pb-1 sm:hidden">
              <DiscordButton href={ORIGINSMETA_DISCORD} size="sm" className="w-full justify-center">
                {dict.nav.discordJoin}
              </DiscordButton>
              <PayPalButton label={dict.nav.donateAria} placement="menu" size="sm" className="w-full justify-center">
                {dict.nav.donate}
              </PayPalButton>
            </div>
          </nav>
        </AutoCloseDetails>
      </div>
    </header>
  );
}
