import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { authors } from "@/lib/data/authors";
import { contactEmail, officialLinks } from "@/components/Footer";
import { SteamButton, isSteamUrl, newTabProps } from "@/components/SteamButton";
import { DiscordButton, isDiscordUrl } from "@/components/DiscordButton";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Descrizione scritta apposta per la SERP: `p1` è il primo paragrafo della pagina, più lungo del
  // limite, e verrebbe tagliato a metà frase. Il titolo lo compone `pageMeta`, marchio compreso.
  return pageMeta(locale, "/about", dict.about.title, dict.about.description);
}

/**
 * Le pagine autore, prese da `authors`: i nomi delle persone si scrivono in un posto solo
 * (src/lib/data/authors.ts) e qui si leggono, così non possono diventare due versioni diverse.
 * Sono nomi propri, uguali nelle due lingue.
 */
const authorPages = authors.map((a) => ({ name: a.name, path: `/authors/${a.slug}` }));

export default async function AboutPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // Etichette dal dizionario: sulla pagina inglese non devono comparire scritte italiane.
  const sources: [string, string][] = [
    [d.about.sources.steam, officialLinks.steam],
    [d.about.sources.demo, officialLinks.demo],
    [d.about.sources.news, officialLinks.news],
    [d.about.sources.discord, officialLinks.discord],
    [d.about.sources.site, officialLinks.site],
    // Lo studio: solo link testuale, nessun logo né icona Koin (il materiale Koin non entra nell'identità del sito).
    [d.about.sources.koin, officialLinks.koin],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.about}</p>
      <h1 className="t-page mt-2">{d.about.title}</h1>
      <div className="hero-art mt-8" style={{ transform: "none" }}>
        {/* Stessa immagine dello slider in home: riusiamo il suo testo alternativo, già tradotto, invece di scriverne uno in inglese su tutte e due le lingue. */}
        <Image src="/media/banner-rapunzel.webp" alt={d.home.slides.rapunzel.alt} width={1500} height={500} sizes="(max-width: 896px) 92vw, 860px" className="w-full" />
      </div>
      <article className="card-night mt-8 space-y-4 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{d.about.p1}</p>
        <p>{d.about.p2}</p>
        <p>{d.about.p3}</p>
        <h2 className="t-section pt-4">{d.about.authorsTitle}</h2>
        <p>{d.about.authorsText}</p>
        <ul className="flex flex-wrap gap-2 text-base">
          {authorPages.map((a) => (
            <li key={a.path}>
              <Link className="btn btn-ink text-xs" href={href(locale, a.path)}>
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="t-section pt-4">{d.about.contactTitle}</h2>
        <p>
          {d.about.contactText}{" "}
          <a className="link-mint" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
        <h2 className="t-section pt-4">{d.about.sourcesTitle}</h2>
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
                // Nuova scheda con la regola unica dei link esterni (`newTabProps`, come i tasti Steam e Discord accanto).
                <a className="btn btn-ink text-xs" href={url} {...newTabProps}>
                  {label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <h2 className="t-section pt-4">{d.about.disclaimerTitle}</h2>
        <p className="text-base text-pale-muted">{d.about.disclaimer}</p>
      </article>
    </div>
  );
}
