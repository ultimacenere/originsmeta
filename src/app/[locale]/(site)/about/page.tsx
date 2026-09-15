import type { Metadata } from "next";
import Image from "next/image";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { contactEmail, officialLinks } from "@/components/Footer";
import { SteamButton, isSteamUrl } from "@/components/SteamButton";
import { DiscordButton, isDiscordUrl } from "@/components/DiscordButton";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/about", dict.about.title, dict.about.p1);
}

export default async function AboutPage({ params }: { params: LocaleParams }) {
  const { dict: d } = await resolveLocale(params);
  const sources = [
    ["Steam · Origins TCG", officialLinks.steam],
    ["Steam · Origins TCG Demo", officialLinks.demo],
    ["Steam · news e patch notes", officialLinks.news],
    ["Discord ufficiale", officialLinks.discord],
    ["origins-tcg.com", officialLinks.site],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.about}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.about.title}</h1>
      <div className="hero-art mt-8" style={{ transform: "none" }}>
        <Image src="/media/banner-rapunzel.webp" alt="Origins TCG official banner" width={1500} height={500} sizes="(max-width: 896px) 92vw, 860px" className="w-full" />
      </div>
      <article className="card-night mt-8 space-y-4 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{d.about.p1}</p>
        <p>{d.about.p2}</p>
        <p>{d.about.p3}</p>
        <h2 className="pt-4 text-2xl font-extrabold">{d.about.contactTitle}</h2>
        <p>
          {d.about.contactText}{" "}
          <a className="text-crimson underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
        <h2 className="pt-4 text-2xl font-extrabold">{d.about.sourcesTitle}</h2>
        <ul className="flex flex-wrap gap-2 text-base">
          {sources.map(([label, url]) => (
            <li key={url}>
              {isSteamUrl(url) ? (
                <SteamButton href={url} variant={url === officialLinks.news ? "dark" : "blue"}>
                  {label}
                </SteamButton>
              ) : isDiscordUrl(url) ? (
                <DiscordButton href={url}>{label}</DiscordButton>
              ) : (
                <a className="btn btn-ink text-xs" href={url} rel="noopener">
                  {label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <h2 className="pt-4 text-2xl font-extrabold">{d.about.disclaimerTitle}</h2>
        <p className="text-base text-pale-muted">{d.about.disclaimer}</p>
      </article>
    </div>
  );
}
