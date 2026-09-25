import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { authors } from "@/lib/data/authors";
import { cardSource, cardsVerified } from "@/lib/data/cards";
import { OFFICIAL_TEXTS_READ, aboutChecks, aboutDisclaimer, entityLabels } from "@/lib/entityLabels";
import { contactEmail, officialLinks } from "@/components/Footer";
import { SteamButton, isSteamUrl, newTabProps } from "@/components/SteamButton";
import { DiscordButton, isDiscordUrl } from "@/components/DiscordButton";
import { JsonLd, aboutPage, breadcrumbs } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Descrizione scritta apposta per la SERP: `p1` è il primo paragrafo della pagina, più lungo del
  // limite, e verrebbe tagliato a metà frase. Il titolo lo compone `pageMeta`, marchio compreso.
  // Dall'Ondata 2 la description nomina le stesse fonti della pagina (World of Origins, verifica nel gioco: TOOL-13).
  return pageMeta(locale, "/about", dict.about.title, entityLabels[locale].about.description);
}

/**
 * Le pagine autore, prese da `authors`: i nomi delle persone si scrivono in un posto solo
 * (src/lib/data/authors.ts) e qui si leggono, così non possono diventare due versioni diverse.
 * Sono nomi propri, uguali nelle due lingue.
 */
const authorPages = authors.map((a) => ({ name: a.name, path: `/authors/${a.slug}` }));

/** Una frase con un segnaposto ({link}, {email}) che diventa un elemento: il testo resta tutto nel modulo delle etichette. */
function withSlot(template: string, slot: string, node: React.ReactNode) {
  const [before, after = ""] = template.split(`{${slot}}`);
  return (
    <>
      {before}
      {node}
      {after}
    </>
  );
}

/*
  Pagina "Chi siamo" come segnale di affidabilità (Ondata 2 del piano SEO/GEO, 25/09/2026: HOME-09, TOOL-13). Oltre al
  testo di sempre: come verifichiamo i dati (sezione #how-we-check, a cui rimanda `publishingPrinciples` del nodo
  Organization), World of Origins fra le fonti, un disclaimer senza "fair use" (il permesso di Koin Games del 19/09/2026
  è pronto ma spento finché Pierluigi non lo approva: `KOIN_PERMISSION_PUBLIC`), il link all'elenco degli autori e i dati
  strutturati AboutPage + BreadcrumbList. I testi nuovi stanno in entityLabels.ts.
*/
export default async function AboutPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const x = entityLabels[locale].about;
  const path = href(locale, "/about");
  // Data e numero dell'ultima verifica carta per carta dai dati (`cardsVerified`), come nel disclaimer del deck builder
  const checks = aboutChecks(locale, {
    date: formatDate(locale, cardsVerified.date),
    count: cardsVerified.count,
    textsDate: formatDate(locale, OFFICIAL_TEXTS_READ),
  });
  // Etichette dal dizionario: sulla pagina inglese non devono comparire scritte italiane.
  const sources: [string, string][] = [
    [d.about.sources.steam, officialLinks.steam],
    [d.about.sources.demo, officialLinks.demo],
    [d.about.sources.news, officialLinks.news],
    [d.about.sources.discord, officialLinks.discord],
    [d.about.sources.site, officialLinks.site],
    // Lo studio: solo link testuale, nessun logo né icona Koin (il materiale Koin non entra nell'identità del sito).
    [d.about.sources.koin, officialLinks.koin],
    // Il database della community da cui importiamo i dati delle carte (eccezione decisa da Pierluigi il 15/09/2026):
    // link seguito, è il credito che gli dobbiamo.
    [x.worldOfOrigins, cardSource.url],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.about.title, path },
          ]),
          aboutPage({ locale, path, name: d.about.title, description: x.description }),
        ]}
      />
      <p className="kicker text-mint">{d.nav.about}</p>
      <h1 className="t-page mt-2">{d.about.title}</h1>
      <div className="hero-art mt-8" style={{ transform: "none" }}>
        {/* Stessa immagine dello slider in home: riusiamo il suo testo alternativo, già tradotto, invece di scriverne uno in inglese su tutte e due le lingue. */}
        <Image src="/media/banner-rapunzel.webp" alt={d.home.slides.rapunzel.alt} width={1500} height={500} sizes="(max-width: 896px) 92vw, 860px" className="w-full" />
      </div>
      <article className="card-night mt-8 space-y-4 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{d.about.p1}</p>
        <p>
          {withSlot(
            x.newToGame,
            "link",
            <Link className="link-mint" href={href(locale, "/guides/origins-tcg-explained")}>
              {x.newToGameLink}
            </Link>,
          )}
        </p>
        <p>{x.p2}</p>
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
          {/* l'indice degli autori, che prima riceveva link quasi solo dalle pagine autore (TOOL-09) */}
          <li>
            <Link className="btn btn-ghost text-xs" href={href(locale, "/authors")}>
              {entityLabels[locale].author.allAuthors} →
            </Link>
          </li>
        </ul>
        <h2 className="t-section pt-4">{d.about.contactTitle}</h2>
        <p>
          {d.about.contactText}{" "}
          <a className="link-mint" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
        {/* Come verifichiamo i dati (HOME-09): le stesse regole del CLAUDE.md e della FAQ "Da dove vengono le statistiche",
            ora anche qui, così chi legge questa pagina trova la stessa versione */}
        <h2 id="how-we-check" className="t-section scroll-mt-24 pt-4">
          {x.checkTitle}
        </h2>
        {checks.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p>
          {withSlot(
            x.checkErrors,
            "email",
            <a className="link-mint" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>,
          )}
        </p>
        <h2 id="sources" className="t-section scroll-mt-24 pt-4">
          {d.about.sourcesTitle}
        </h2>
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
        {/* La non affiliazione resta in testa, parola per parola; niente più "fair use" (il permesso di Koin quando
            Pierluigi lo approva, `KOIN_PERMISSION_PUBLIC` in entityLabels.ts) */}
        <p className="text-base text-pale-muted">{aboutDisclaimer(locale)}</p>
      </article>
    </div>
  );
}
