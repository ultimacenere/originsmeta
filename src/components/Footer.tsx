import type { ReactNode } from "react";
import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { linkLabels } from "@/lib/linkLabels";
import { Wordmark } from "./Wordmark";
import { navItems } from "./Header";
import { NEW_TAB_HINT_ID, NEW_TAB_REL, NewTabIcon, SteamLogo } from "./SteamButton";
import { DiscordButton, DiscordLogo } from "./DiscordButton";
import { CookiePreferencesButton } from "./CookieBanner";
import { HideOnPath } from "./HideOnPath";

export const officialLinks = {
  steam: "https://store.steampowered.com/app/4429430/Origins_TCG/",
  demo: "https://store.steampowered.com/app/4756630/Origins_TCG_Demo/",
  discord: "https://discord.gg/originstcg",
  site: "https://origins-tcg.com/",
  x: "https://x.com/origins_tcg",
  youtube: "https://www.youtube.com/@origins_tcg",
  news: "https://steamcommunity.com/app/4429430/allnews/",
  // Sito dello studio: solo link testuale, nessun logo o icona Koin (stessa URL dei dati strutturati in JsonLd.tsx).
  koin: "https://koingames.io",
};

export const contactEmail = "staff@originsmeta.com";

/** Link del footer come quelli dell'header: a riposo chalk, al passaggio menta. */
const linkCls = "text-chalk transition-colors hover:text-mint";

/**
 * Colonna "Esplora" (Ondata 1 del piano SEO/GEO, 25/09/2026, rilievi TOOL-06 e TECH-16): le pagine che non stanno nel
 * menu e ricevevano 3-11 link interni (MetaShifting, Luoghi, le due tier list dei dati, il tool, gli autori). Il menu
 * dell'header non cambia: MetaShifting e Luoghi restano fuori finché Pierluigi non decide (decisione 7 del 25/09).
 */
function exploreItems(locale: Locale): { label: string; path: string }[] {
  const x = linkLabels[locale].explore;
  return [
    { label: x.metashifting, path: "/metashifting" },
    { label: x.locations, path: "/locations" },
    { label: x.mostPlayed, path: "/tier-list/most-played" },
    { label: x.communityTierList, path: "/tier-list/community" },
    { label: x.makeTierList, path: "/tier-list/create" },
    { label: x.authors, path: "/authors" },
  ];
}

/** Link ufficiale esterno: nuova scheda, freccia visibile e avviso per i lettori di schermo nel nome del link. */
function OfficialLink({ url, newTab, children }: { url: string; newTab: string; children: ReactNode }) {
  return (
    <a className={`inline-flex items-center gap-1.5 ${linkCls}`} href={url} target="_blank" rel={NEW_TAB_REL}>
      {children}
      <NewTabIcon className="h-3 w-3" />
      <span className="sr-only"> {newTab}</span>
    </a>
  );
}

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="mt-20 border-t border-felt-line/70 bg-felt-deep/60">
      {/* Chi arriva in fondo a una pagina lunga è il visitatore più interessato: prima dei link, un invito
          a pubblicare il proprio mazzo o a entrare nel Discord ufficiale. Sul deck builder no: il tasto
          porterebbe alla pagina stessa. */}
      <HideOnPath suffix="/deck-builder">
        <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <section aria-labelledby="footer-cta-title" className="card-night flex flex-wrap items-center gap-x-8 gap-y-5 p-5 sm:p-7">
            <div className="min-w-0 flex-1 basis-72">
              <p className="kicker text-mint">{dict.footer.ctaKicker}</p>
              <h2 id="footer-cta-title" className="t-section mt-2">
                {dict.footer.ctaTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-pale">{dict.footer.ctaText}</p>
            </div>
            {/* items-stretch: il bottone del sito e quello Discord (misure ufficiali diverse) restano alti uguali */}
            <div className="flex flex-wrap items-stretch gap-3">
              <Link href={href(locale, "/deck-builder")} className="btn btn-primary justify-center">
                {dict.footer.ctaPublish}
              </Link>
              <DiscordButton href={officialLinks.discord} className="justify-center">
                {dict.footer.ctaDiscord}
              </DiscordButton>
            </div>
          </section>
        </div>
      </HideOnPath>
      {/* Cinque colonne da 1024 px; sotto, il logo sta su una riga sua e i quattro elenchi di link si dividono la
          larghezza (quattro da 768 px, due per riga da 640), sul telefono uno sotto l'altro come prima. */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
          {/* nel footer il logo è più grande e porta il nome del sito per chi non vede l'immagine */}
          <Wordmark height={38} alt="OriginsMeta" />
          <p className="mt-3 max-w-sm text-sm text-chalk-muted">{dict.footer.disclaimer}</p>
          <p className="mt-3 text-sm text-chalk-muted">
            {dict.common.contact}: <a className="link-mint" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
          <p className="mt-2 text-xs text-chalk-muted">{dict.common.imageCredit}</p>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{dict.footer.links}</h2>
          <ul className="space-y-1.5 text-sm">
            {navItems(dict).map((it) => (
              <li key={it.path}>
                <Link className={linkCls} href={href(locale, it.path)}>
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{linkLabels[locale].explore.title}</h2>
          <ul className="space-y-1.5 text-sm">
            {exploreItems(locale).map((it) => (
              <li key={it.path}>
                <Link className={linkCls} href={href(locale, it.path)}>
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{dict.footer.official}</h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <OfficialLink url={officialLinks.steam} newTab={dict.footer.newTab}>
                <SteamLogo className="h-3.5 w-3.5" />
                Steam
              </OfficialLink>
            </li>
            <li>
              <OfficialLink url={officialLinks.demo} newTab={dict.footer.newTab}>
                <SteamLogo className="h-3.5 w-3.5" />
                Demo
              </OfficialLink>
            </li>
            <li>
              <OfficialLink url={officialLinks.discord} newTab={dict.footer.newTab}>
                <DiscordLogo className="h-3.5 w-3.5" />
                Discord
              </OfficialLink>
            </li>
            <li>
              <OfficialLink url={officialLinks.site} newTab={dict.footer.newTab}>
                origins-tcg.com
              </OfficialLink>
            </li>
            <li>
              <OfficialLink url={officialLinks.x} newTab={dict.footer.newTab}>
                X / Twitter
              </OfficialLink>
            </li>
            <li>
              <OfficialLink url={officialLinks.youtube} newTab={dict.footer.newTab}>
                YouTube
              </OfficialLink>
            </li>
            <li>
              <OfficialLink url={officialLinks.koin} newTab={dict.footer.newTab}>
                Koin Games
              </OfficialLink>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{dict.footer.legal}</h2>
          <ul className="space-y-1.5 text-sm">
            <li><Link className={linkCls} href={href(locale, "/about")}>{dict.nav.about}</Link></li>
            <li><Link className={linkCls} href={href(locale, "/privacy")}>{dict.footer.privacy}</Link></li>
            <li>
              <CookiePreferencesButton label={dict.cookies.manage} className={`cursor-pointer ${linkCls}`} />
            </li>
          </ul>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-chalk-muted">{dict.footer.built}</p>
        </div>
      </div>
      {/* Avviso richiamato con aria-describedby dai tasti Steam e Discord di tutto il sito (vedi SteamButton.tsx):
          il footer sta in ogni pagina, quindi il testo localizzato c'è sempre. */}
      <span id={NEW_TAB_HINT_ID} hidden>
        {dict.footer.newTab}
      </span>
    </footer>
  );
}
