import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { Wordmark } from "./Wordmark";
import { navItems } from "./Header";

export const officialLinks = {
  steam: "https://store.steampowered.com/app/4429430/Origins_TCG/",
  demo: "https://store.steampowered.com/app/4756630/Origins_TCG_Demo/",
  discord: "https://discord.gg/originstcg",
  site: "https://origins-tcg.com/",
  x: "https://x.com/origins_tcg",
  youtube: "https://www.youtube.com/@origins_tcg",
  news: "https://steamcommunity.com/app/4429430/allnews/",
};

export const contactEmail = "staff@originsmeta.com";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="mt-20 border-t border-felt-line/70 bg-felt-deep/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark className="text-2xl" />
          <p className="mt-3 max-w-sm text-sm text-chalk-muted">{dict.footer.disclaimer}</p>
          <p className="mt-3 text-sm text-chalk-muted">
            {dict.common.contact}: <a className="link-mint" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
          <p className="mt-2 text-xs text-chalk-muted/70">{dict.common.imageCredit}</p>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{dict.footer.links}</h2>
          <ul className="space-y-1.5 text-sm">
            {navItems(dict).map((it) => (
              <li key={it.path}>
                <Link className="text-chalk-muted hover:text-chalk" href={href(locale, it.path)}>
                  {it.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-mint hover:text-chalk" href={href(locale, "/deck-builder")}>
                {dict.nav.builder}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{dict.footer.official}</h2>
          <ul className="space-y-1.5 text-sm">
            <li><a className="text-chalk-muted hover:text-chalk" href={officialLinks.steam} rel="noopener">Steam</a></li>
            <li><a className="text-chalk-muted hover:text-chalk" href={officialLinks.discord} rel="noopener">Discord</a></li>
            <li><a className="text-chalk-muted hover:text-chalk" href={officialLinks.site} rel="noopener">origins-tcg.com</a></li>
            <li><a className="text-chalk-muted hover:text-chalk" href={officialLinks.x} rel="noopener">X / Twitter</a></li>
            <li><a className="text-chalk-muted hover:text-chalk" href={officialLinks.youtube} rel="noopener">YouTube</a></li>
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-3 text-mint">{dict.footer.legal}</h2>
          <ul className="space-y-1.5 text-sm">
            <li><Link className="text-chalk-muted hover:text-chalk" href={href(locale, "/about")}>{dict.nav.about}</Link></li>
            <li><Link className="text-chalk-muted hover:text-chalk" href={href(locale, "/privacy")}>{dict.footer.privacy}</Link></li>
          </ul>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-chalk-muted/70">{dict.footer.built}</p>
        </div>
      </div>
    </footer>
  );
}
