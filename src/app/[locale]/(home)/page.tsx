import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href, formatDate, formatDateShort } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { latestPatch, movers, patchLabel, patches } from "@/lib/data/cards";
import { tierList, tierIds } from "@/lib/data/tierlist";
import { getGuide, type Guide } from "@/lib/content/guides";
import { newsPath, sortedNews, type NewsItem } from "@/lib/data/news";
import { SectionHead } from "@/components/SectionHead";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardChipList } from "@/components/CardChip";
import { officialLinks } from "@/components/Footer";
import { SteamButton } from "@/components/SteamButton";
import { DiscordButton } from "@/components/DiscordButton";
import { HeroSlider, type Slide } from "@/components/HeroSlider";
import { EventTicker } from "@/components/EventTicker";
import { NewsCover } from "@/components/NewsCover";
import { NewsDeckButton, NewsGuideLinks, NewsSourceLink, isDeckNews, newsCardsLabel } from "@/components/NewsLinks";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Nessun `title` da sovrascrivere: `pageMeta` restituisce già il titolo finale come `absolute`
  // (homeTitle contiene sia "Origins TCG" sia "OriginsMeta", quindi resta esattamente com'è nel dizionario).
  return pageMeta(locale, "", dict.meta.homeTitle, dict.meta.description, "/media/og.jpg");
}

/**
 * Post-it delle news (prova del 21/09/2026, decisione C di Pierluigi, per ora SOLO sulle tre news in evidenza):
 * un foglietto colorato, leggermente ruotato, che dice che cos'è il contenuto prima di leggerlo. La categoria si
 * ricava dai dati, mai a mano:
 * - mazzo pubblicato sul sito (source "staff" o "community") → "Nuovo mazzo" (giallo);
 * - patch notes → "Patch" (rosa): slug che inizia per "patch" (le patch del playtest) oppure news collegata a una
 *   patch in `patches` di cards.ts (campo `news`: le patch senza numero, come `demo-patch-notes-0921`);
 * - tutto il resto → "News" (viola).
 * Colori, forma e rotazioni stanno nelle classi .postit di globals.css (testo ink su carta piena, contrasti misurati).
 */
type PostitKind = "deck" | "patch" | "news";
const PATCH_NEWS = new Set(Object.values(patches).flatMap((p) => (p.news ? [p.news] : [])));
function postitOf(item: NewsItem): PostitKind {
  if (isDeckNews(item)) return "deck";
  return item.slug.startsWith("patch") || PATCH_NEWS.has(item.slug) ? "patch" : "news";
}

/** Guide per chi arriva adesso: che cos'è il gioco, come si prova la demo, che cosa succede al Next Fest. */
const START_GUIDES = ["origins-tcg-explained", "play-the-demo", "steam-next-fest-2026"] as const;

/* Icone del blocco "Fai la tua mossa": tratti semplici in menta, decorative (il testo accanto dice tutto) */
const moveIcon = "h-7 w-7 shrink-0 fill-none stroke-mint stroke-[1.8]";
const MOVE_ICONS: Record<"build" | "publish" | "host", ReactNode> = {
  build: (
    <svg viewBox="0 0 24 24" className={moveIcon} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="11" height="14" rx="2" />
      <path d="M8 3.5h10.5A2 2 0 0 1 20.5 5.5V17" />
      <path d="M8.5 11v6M5.5 14h6" />
    </svg>
  ),
  publish: (
    <svg viewBox="0 0 24 24" className={moveIcon} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" />
    </svg>
  ),
  host: (
    <svg viewBox="0 0 24 24" className={moveIcon} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 16.5V21" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5.5h3V7a3 3 0 0 1-3 3M7 5.5H4V7a3 3 0 0 0 3 3" />
    </svg>
  ),
};

/**
 * Ordine della home (note 7.0 del 16/09/2026, rivisto il 21/09/2026): slider, calendario, titolo con le tre azioni
 * (deck builder per primo, poi Steam e Discord in misura ridotta), le prime tre news "aperte" con i post-it, il
 * blocco "Fai la tua mossa" (costruisci, pubblica, organizza), la tier list a striscia, MetaShifting a striscia
 * della stessa misura, poi la bacheca con le altre news (patch note comprese), tre guide per chi inizia e lo stato
 * del gioco. La sezione con i mazzi della community è stata tolta (ridondante).
 *
 * Scala dei titoli (21/09/2026): .t-page per l'H1, .t-section per i titoli di sezione (gesso, non più celesti),
 * .t-item per i nomi degli elementi (news, guide, carte), così sezione ed elemento non hanno più lo stesso colore.
 */
export default async function Home({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // MetaShifting in home: le tre modifiche più importanti dell'ultima patch (non di sempre, che erano sempre quelle della 0.6.3)
  const top = movers(latestPatch).slice(0, 3);
  const startGuides = START_GUIDES.map((s) => getGuide(locale, s)).filter((g): g is Guide => g !== undefined);
  const economyGuide = getGuide(locale, "collector-economy");
  const featured = sortedNews.slice(0, 3);
  const board = sortedNews.filter((n) => !featured.includes(n)).slice(0, 6);
  const sectionTitle = { decks: d.tier.sections.decks.title, legendaries: d.tier.sections.legendaries.title, cards: d.tier.sections.cards.title } as const;
  const rankedIn = (s: (typeof tierList.sections)[number]) => tierIds.reduce((acc, t) => acc + s.tiers[t].length, 0);
  /* la promessa datata resta finché nessuna sezione ha una fascia: sparisce da sola alla prima classifica */
  const nothingRanked = tierList.sections.every((s) => rankedIn(s) === 0);
  const sl = d.home.slides;
  const mv = d.home.moves;
  // Testo alternativo delle slide: sta nel dizionario (campo `alt`), così segue la lingua della pagina.
  const slides: Slide[] = [
    { src: "/media/hero-1920.webp", ...sl.keyArt, href: officialLinks.demo, external: true },
    { src: "/media/banner-rapunzel.webp", ...sl.rapunzel, href: href(locale, "/cards") },
    { src: "/media/ls-zero-pay-to-win.webp", ...sl.zeroPay, href: href(locale, "/guides/is-origins-tcg-pay-to-win") },
    { src: "/media/ls-real-collecting.webp", ...sl.realCollecting, href: href(locale, "/guides/collector-economy") },
    { src: "/media/ls-collect-them-all.webp", ...sl.collectAll, href: href(locale, "/cards") },
  ];
  /* Le tre mosse che fanno crescere il sito: un verbo, una riga, un link (UX-1 del 21/09/2026) */
  const moves = [
    { id: "build", ...mv.build, cta: d.home.decksCta, to: "/deck-builder" },
    { id: "publish", ...mv.publish, to: "/decks" },
    { id: "host", ...mv.host, to: "/tournaments/new" },
  ] as const;

  /**
   * Indirizzo di una news dalla home: la pagina dell'articolo (regola del 21/09/2026, ogni news ha la sua).
   * Per le news sui mazzi pubblicati qui, la scheda del mazzo resta raggiungibile dal tasto "Apri il mazzo".
   */
  const newsHref = (item: NewsItem) => href(locale, newsPath(item));

  return (
    <>
      {/* Slider a tutta larghezza con le immagini ufficiali del media kit: fa da hero */}
      <HeroSlider slides={slides} labels={d.home.slider} interval={4500} />
      <EventTicker locale={locale} dict={d} />
      <main id="main" className="flex-1">
        {/*
          Titolo + tre azioni con gerarchia (21/09/2026): prima l'azione interna (deck builder, senza account), poi i
          tasti ufficiali di Steam e Discord in misura ridotta, con i loro colori (decisione di Pierluigi: non si tolgono).
        */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div className="max-w-3xl">
              <p className="kicker text-mint">{d.home.kicker}</p>
              <h1 className="t-page mt-2">{d.home.title}</h1>
              <p className="mt-2 max-w-2xl text-chalk-muted">{d.home.sub}</p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={href(locale, "/deck-builder")} className="btn btn-primary">
                  {d.home.ctaBuild} →
                </Link>
                <SteamButton href={officialLinks.demo} variant="green" size="sm">
                  {d.home.ctaDemo}
                </SteamButton>
                <DiscordButton href={officialLinks.discord} size="sm">
                  {d.home.ctaDiscord}
                </DiscordButton>
              </div>
              <p className="flex items-center gap-1.5 pl-3 text-xs text-pale-muted">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-mint stroke-2" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {d.home.ctaBuildNote}
              </p>
            </div>
          </div>

          {/* Le prime tre news "aperte" in cima (note 7.0), ciascuna con il suo post-it (prova del 21/09/2026) */}
          <section className="mt-8" aria-labelledby="home-featured">
            <h2 id="home-featured" className="sr-only">
              {d.home.featured}
            </h2>
            {/* `postit-row` dà a ogni riquadro una rotazione diversa, anche quando due post-it sono della stessa categoria */}
            <div className="postit-row grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-3">
              {featured.map((item, i) => {
                const kind = postitOf(item);
                const deck = isDeckNews(item);
                return (
                  <article key={item.slug} className="card-night relative flex flex-col p-6">
                    {/* figlio diretto della scheda (contratto di .postit in globals.css): a cavallo del bordo in alto a sinistra */}
                    <span className={`postit postit-${kind} postit-corner`}>{d.home.postit[kind]}</span>
                    <NewsCover src={item.image} className="mb-4" />
                    {/* UX-2: il mazzo si apre subito, sotto la copertina, non dopo tutte le carte (per le altre news non rende nulla) */}
                    <NewsDeckButton item={item} locale={locale} dict={d} className="mb-4 self-start text-xs" />
                    {/* "Ultima notizia" è sempre vera; "News del giorno" su una notizia di giorni prima non lo era */}
                    <p className="kicker text-mint">
                      {i === 0 ? d.home.latestNews : d.home.featured} · {formatDate(locale, item.date)}
                    </p>
                    <h3 className="t-item mt-2">
                      <Link href={newsHref(item)} className="hover:underline">
                        {item.title[locale]}
                      </Link>
                    </h3>
                    {/*
                      Sul telefono (una colonna) e sul tablet (tre colonne strette) le schede diventavano lunghissime:
                      riassunto accorciato e tre carte (con il "+N"); il resto è nell'articolo. Da lg in su la news resta "aperta".
                    */}
                    <p className="mt-3 line-clamp-4 text-sm text-pale md:line-clamp-6 lg:line-clamp-none">{item.summary[locale]}</p>
                    <p className="mt-3">
                      <Link href={newsHref(item)} className="text-sm font-bold text-mint hover:underline">
                        {d.news.readArticle} →
                      </Link>
                    </p>
                    {item.cards?.length ? (
                      <div className="mt-4">
                        <p className="kicker mb-2 text-pale-muted">{newsCardsLabel(item, d)}</p>
                        <div className="lg:hidden">
                          <CardChipList slugs={item.cards} locale={locale} max={3} />
                        </div>
                        <div className="hidden lg:block">
                          <CardChipList slugs={item.cards} locale={locale} max={6} />
                        </div>
                      </div>
                    ) : null}
                    <NewsGuideLinks item={item} locale={locale} dict={d} />
                    <p className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-4 text-sm">
                      {/* sui mazzi il tasto "Apri il mazzo" sta già in alto: qui resta solo la fonte delle altre news */}
                      {deck ? null : <NewsSourceLink item={item} locale={locale} dict={d} className="text-mint hover:underline" />}
                      <Link href={href(locale, "/news")} className="text-pale-muted hover:text-sky">
                        {d.common.viewAll} →
                      </Link>
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/*
            Fai la tua mossa (UX-1, 21/09/2026): la home non conteneva un solo invito a costruire, pubblicare o
            organizzare. Tre colonne (una sul telefono), ognuna con un verbo, una riga e un'azione.
          */}
          <section className="card-night mt-8 p-5 sm:p-7" aria-labelledby="home-moves">
            <p className="kicker text-mint">{mv.kicker}</p>
            <h2 id="home-moves" className="t-section mt-1">
              {mv.title}
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              {moves.map((m) => (
                <li key={m.id} className="flex flex-col rounded-xl border-2 border-sky/50 bg-night-2/80 p-4 md:p-5">
                  {/* icona accanto al verbo sul telefono (colonna più corta), sopra da md in su */}
                  <div className="flex items-center gap-3 md:block">
                    {MOVE_ICONS[m.id]}
                    <h3 className="t-item md:mt-3">{m.title}</h3>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-pale">{m.text}</p>
                  <Link href={href(locale, m.to)} className="btn btn-primary mt-4 self-start text-xs">
                    {m.cta} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/*
            Tier list: striscia a tutta larghezza sotto le news (note 7.0). Finché nessuna sezione ha una fascia, al
            posto di "0 · Non ancora classificato" c'è la promessa datata (Steam Next Fest, 19–26 ottobre).
          */}
          <section className="card-night mt-5 flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-[220px] flex-1">
              <h2 className="t-section">{d.home.tierTitle}</h2>
              <p className="mt-1 text-sm text-pale-muted">{d.home.tierSub}</p>
              {nothingRanked ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-chalk">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-none stroke-mint stroke-[1.6]" aria-hidden="true">
                    <rect x="2" y="3" width="12" height="11" rx="2" />
                    <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" strokeLinecap="round" />
                  </svg>
                  {d.home.tierStatus}
                </p>
              ) : null}
            </div>
            <ul className="flex flex-wrap gap-2">
              {tierList.sections.map((s) => {
                const ranked = rankedIn(s);
                return (
                  <li key={s.id}>
                    <Link href={href(locale, `/tier-list#${s.id}`)} className="block rounded-lg border-2 border-sky px-3 py-2 text-pale hover:bg-night-3 hover:text-chalk">
                      <span className="t-item block text-sm">{sectionTitle[s.id]}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">{ranked > 0 ? `${ranked} ${d.common.ranked}` : d.home.tierSoon}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={href(locale, "/tier-list")} className="btn btn-ghost text-xs">
              {d.common.viewAll} →
            </Link>
          </section>

          {/* MetaShifting: striscia della stessa misura e dello stesso stile della tier list (note 7.0); titolo di sezione come gli altri, non più menta */}
          <section className="card-night mt-5 flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-[220px] max-w-xs flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="t-section">{d.common.metashift}</h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-chalk-muted">
                  {d.common.patch} {patchLabel(latestPatch, locale)}
                </span>
              </div>
              <p className="mt-1 text-sm text-pale-muted">{d.home.metashiftSub}</p>
            </div>
            <ol className="flex flex-1 flex-wrap gap-2">
              {top.map(({ card, change }) => (
                <li key={`${card.slug}-${change.patch}`}>
                  <Link href={href(locale, `/cards/${card.slug}`)} className="flex items-center gap-2 rounded-lg border-2 border-sky px-2.5 py-1.5 text-xs hover:bg-night-3">
                    <span className="t-item text-xs">{card.name}</span>
                    <StatDelta from={change.from} to={change.to} />
                    <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
                  </Link>
                </li>
              ))}
            </ol>
            {/* Il tasto promette il tracker delle patch: porta direttamente a quella sezione, non in cima alla tier list */}
            <Link href={href(locale, "/tier-list#tracker")} className="btn btn-ghost text-xs">
              {d.tier.trackerTitle} →
            </Link>
          </section>
        </section>

        {/* Bacheca news (patch note comprese) */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <SectionHead title={d.home.newsBoardTitle} sub={d.home.newsBoardSub} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
          <ul className="felt-panel divide-y divide-felt-line">
            {board.map((nItem) => (
              <li key={nItem.slug} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[110px_140px_1fr]">
                <p className="font-mono text-sm tabular text-mint">{formatDateShort(locale, nItem.date)}</p>
                <NewsCover src={nItem.image} />
                <div>
                  {/* Il titolo porta all'articolo; la fonte (o la scheda del mazzo) resta il link piccolo sotto il riassunto */}
                  <h3 className="t-item text-base">
                    <Link href={newsHref(nItem)} className="hover:underline">
                      {nItem.title[locale]}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-chalk-muted">{nItem.summary[locale]}</p>
                  <NewsSourceLink item={nItem} locale={locale} dict={d} className="mt-1 inline-block text-xs text-mint hover:underline" />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Parti da qui: tre guide per chi arriva adesso, non tutte le undici (il 34% della pagina sul telefono) */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <SectionHead title={d.home.guidesTitle} sub={d.home.guidesStartSub} link={{ href: href(locale, "/guides"), label: d.common.viewAll }} />
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {startGuides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover flex h-full flex-col overflow-hidden">
                  {g.image ? (
                    <Image src={g.image} alt="" width={1200} height={675} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full object-cover" />
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="kicker text-pale-muted">
                      {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime}
                    </p>
                    <h3 className="t-item mt-1">{g.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-pale-muted">{g.excerpt}</p>
                    <span className="mt-4 font-display text-sm font-bold text-mint">{d.common.readMore} →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Stato del gioco + collezionismo */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <SectionHead title={d.home.statusTitle} />
              <dl className="grid grid-cols-2 gap-3">
                {(
                  [
                    [d.home.status.demo, d.home.status.demoValue],
                    [d.home.status.reviews, d.home.status.reviewsValue],
                    [d.home.status.matches, d.home.status.matchesValue],
                    [d.home.status.launch, d.home.status.launchValue],
                    [d.home.status.mobile, d.home.status.mobileValue],
                    [d.home.status.languages, d.home.status.languagesValue],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="felt-panel p-4">
                    <dt className="kicker text-chalk-muted">{k}</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-sky">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-chalk-muted/80">{d.home.statusNote}</p>
            </div>
            {economyGuide ? (
              <Link href={href(locale, "/guides/collector-economy")} className="card-night card-night-hover block overflow-hidden">
                {/* Copertina della scheda guida: decorativa, il titolo e il riassunto accanto dicono già tutto (come nella griglia delle guide) */}
                <Image src="/media/ls-two-ways.webp" alt="" width={1600} height={900} sizes="(max-width: 1024px) 90vw, 50vw" className="w-full" />
                <div className="p-5">
                  <p className="kicker text-pale-muted">{d.guides.title}</p>
                  <h3 className="t-item mt-1">{economyGuide.title}</h3>
                  <p className="mt-2 text-sm text-pale-muted">{economyGuide.excerpt}</p>
                </div>
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
