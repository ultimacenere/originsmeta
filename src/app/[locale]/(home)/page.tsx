import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href, formatDate, formatDateShort, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { latestPatch, movers, patchLabel, patches, type ChangeKind } from "@/lib/data/cards";
import { tierList, tierIds } from "@/lib/data/tierlist";
import { tierTone } from "@/lib/tiercode";
import { getGuide, type Guide } from "@/lib/content/guides";
import { newsInLocale, newsPath, type NewsItem } from "@/lib/data/news";
import { StatDelta } from "@/components/ChangeChip";
import { CardHand, CardName, legendaryFirst } from "@/components/CardChip";
import { officialLinks } from "@/components/Footer";
import { HeroSlider, type Slide } from "@/components/HeroSlider";
import { OfficialLiveHero } from "@/components/OfficialLiveHero";
import { officialLiveLabels } from "@/lib/officialLive";
import { creatorLabels } from "@/lib/creatorLabels";
import { EventTicker } from "@/components/EventTicker";
import { NewsCover } from "@/components/NewsCover";
import { Postit, type PostitKind } from "@/components/Postit";
import { NewsDeckButton, NewsSourceLink, isDeckNews, newsCardsLabel } from "@/components/NewsLinks";
import { changeLabel } from "@/lib/linkLabels";
import { supabaseEnabled } from "@/lib/supabase/env";
import { COMMUNITY_MIN_LISTS } from "@/lib/tierstats";
import { TierInvite } from "@/components/TierInvite";
import { listPublishedComics } from "@/lib/community/comicQueries";
import { comicFeedCards, mergeFeed, splitHomeFeed, type ComicFeedCard } from "@/lib/community/comics";
import { fillLabel } from "@/lib/community/deckQuality";
import { authorName } from "@/lib/community/util";
import { supabaseUrl } from "@/lib/supabase/env";
import { comicLabels } from "@/lib/comicLabels";
import { loadCreatorVideos } from "@/lib/community/creatorVideoQueries";
import { creatorVideoLabels } from "@/lib/creatorVideoLabels";
import { videoLabels } from "@/lib/videoLabels";
import { CreatorVideoRail, type RailVideo } from "@/components/CreatorVideoRail";
import { kickstarterPromoActive, kickstarterSliderPinned } from "@/lib/kickstarter";
import { kickstarterLabels } from "@/lib/kickstarterLabels";
import { KickstarterBar } from "@/components/KickstarterBar";

/**
 * Dal 29/09/2026 (pacchetto FUMETTI, Pierluigi: i fumetti di Vega "come news") le news in evidenza e la bacheca mostrano
 * anche i fumetti dei creator, che stanno nel database: la home è in ISR (ogni 5 minuti, e le Server Action dei fumetti
 * la rinnovano subito). Un errore del database lancia e resta la pagina di prima; con la community spenta o la tabella
 * che non c'è, solo le news del sito come prima.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Nessun `title` da sovrascrivere: `pageMeta` restituisce già il titolo finale come `absolute`
  // (homeTitle contiene sia "Origins TCG" sia "OriginsMeta", quindi resta esattamente com'è nel dizionario).
  // Dal 25/09/2026 il titolo punta al marchio e a Koin Games (piano SEO): tier list, mazzi e carte hanno le loro pagine.
  // Niente immagine passata a mano: è già quella di riserva, e così il testo alternativo resta quello che descrive
  // l'immagine (`defaultOgAlt`) e non il titolo della pagina.
  return pageMeta(locale, "", dict.meta.homeTitle, dict.meta.description);
}

/**
 * Post-it delle news (prova del 21/09/2026, decisione C di Pierluigi, SOLO sulle tre news in evidenza): un
 * foglietto colorato e storto che dice che cos'è il contenuto prima di leggerlo. La categoria si ricava dai dati,
 * mai a mano:
 * - mazzo pubblicato sul sito (source "staff" o "community") → "Nuovo mazzo" (giallo);
 * - patch notes → "Patch" (rosa): slug che inizia per "patch" (le patch del playtest) oppure news collegata a una
 *   patch in `patches` di cards.ts (campo `news`: le patch senza numero, come `demo-patch-notes-0921`);
 * - intervista (news con `speakers`, dal 28/10/2026) → "Intervista" (corallo);
 * - tutto il resto → "News" (viola).
 * Colori, forma e animazioni stanno nelle classi .postit di globals.css (testo ink su carta piena, contrasti
 * misurati); il componente `Postit` sceglie misura, rotazione e, dalla data, se la news è fresca (72 ore).
 */
type NewsPostit = Extract<PostitKind, "deck" | "patch" | "news" | "interview">;
const PATCH_NEWS = new Set(Object.values(patches).flatMap((p) => (p.news ? [p.news] : [])));
function postitOf(item: NewsItem): NewsPostit {
  if (isDeckNews(item)) return "deck";
  if (item.speakers?.length) return "interview";
  return item.slug.startsWith("patch") || PATCH_NEWS.has(item.slug) ? "patch" : "news";
}

/**
 * Guide per chi arriva adesso: che cos'è il gioco, come si comincia a giocare, come funziona la classificata. Fino al
 * 27/10/2026 la terza era la guida allo Steam Next Fest (finito il 26/10); lo slug di play-the-demo resta per i link.
 */
const START_GUIDES = ["origins-tcg-explained", "play-the-demo", "origins-tcg-ranked"] as const;

/** Una delle tre in evidenza, news o fumetto, con quello che serve a disegnarla (le carte e le guide solo dalle news). */
type Featured = {
  key: string;
  href: string;
  /** giorno, AAAA-MM-GG */
  day: string;
  /** data intera, per la freschezza del post-it */
  date: string;
  title: string;
  titleLang?: Locale;
  summary: string;
  summaryLang?: Locale;
  image: string | null;
  postit: PostitKind;
  byline?: string;
  item?: NewsItem;
};

/** Cornice celeste delle copertine: è l'unica cornice della notizia, il testo sta sul feltro (12/11/2026) */
const COVER_LG = "rounded-xl! border-[3px]! border-sky!";
const COVER_SM = "rounded-[10px]! border-2! border-sky!";
/** Etichetta piccola sopra un gruppo (carte, guide): testo normale, non più il kicker in maiuscolo spaziato */
const LABEL = "mb-2 text-[12.5px] font-bold text-pale-muted";

/** Titolo di sezione della home: il titolo e, a destra, un link di testo. Niente sottotitolo che ripete il titolo, niente freccia. */
function HomeHead({ id, title, link, className = "mb-5" }: { id?: string; title: string; link?: { href: string; label: string }; className?: string }) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${className}`}>
      <h2 id={id} className="t-section">
        {title}
      </h2>
      {link ? (
        <Link href={link.href} className="link-mint text-sm font-bold">
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}

/* Freccia tirata a penna accanto a un buff o a un nerf: tre tratti diversi, così tre righe vicine non sembrano fotocopie */
const PEN_ARROWS = [
  "M8.2 20.5C7.6 15 8.6 9.5 7.9 3.2M2.4 8.6C4.6 6.6 6.2 4.6 7.9 2.2 9.6 4.4 11.6 6.4 13.8 8.2",
  "M7.6 20.6C8.4 14.6 7.2 9 8.1 3M2.2 8.9C4.2 7 6.4 4.9 8.1 2.3 9.5 4.7 11.9 6.6 13.9 8.6",
  "M8 20.4C7.5 15.2 8.8 8.8 7.8 3.4M2.6 8.2C4.8 6.9 6 4.4 7.8 2.4 9.8 4.2 11.2 6.8 13.6 8.4",
] as const;
const PEN_TONE: Record<ChangeKind, string> = { buff: "text-mint", nerf: "text-crimson-soft", rework: "text-gold", deck: "text-pale" };

/** Esito di una modifica scritto a penna: la freccia in su o in giù e la parola, al posto della pastiglia piena */
function PenMark({ kind, label, n }: { kind: ChangeKind; label: string; n: number }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[12.5px] font-bold ${PEN_TONE[kind]}`}>
      {kind === "buff" || kind === "nerf" ? (
        <svg viewBox="0 0 16 22" className={`pen-arrow${kind === "nerf" ? " rotate-180" : ""}`} aria-hidden="true">
          <path d={PEN_ARROWS[n % PEN_ARROWS.length]} />
        </svg>
      ) : null}
      {label}
    </span>
  );
}

/**
 * Ordine della home (note 7.0 del 16/09/2026, rivisto il 21 e il 22/09/2026): slider, calendario, subito le prime
 * tre news "aperte" con i post-it, i video dei creator, il blocco "Fai la tua mossa" (costruisci, pubblica, organizza),
 * la tier list a striscia, MetaShifting a striscia della stessa misura, poi la bacheca con le altre news (patch note
 * comprese), tre guide per chi inizia e lo stato del gioco. La sezione con i mazzi della community è stata tolta
 * (ridondante).
 *
 * Blocco titolo tolto il 22/09/2026 (note sulla demo, decisione di Pierluigi): titolo visibile, sottotitolo,
 * "Costruisci il tuo mazzo" (ridondante con "Fai la tua mossa") e i tasti Steam e Discord (Steam resta nello
 * slider, Discord nel footer). Così le news salgono attaccate al calendario. L'H1 resta per i motori e per i
 * lettori di schermo, nascosto alla vista (`sr-only`), con la parola chiave "Origins TCG": uno solo per pagina.
 *
 * Scala dei titoli (21/09/2026): .t-section per i titoli di sezione (gesso, non più celesti), .t-item per i nomi
 * degli elementi (news, guide, carte), così sezione ed elemento non hanno più lo stesso colore. Tier list e
 * MetaShifting hanno invece l'etichetta a penna su post-it (22/09/2026).
 *
 * Ricomposta il 12/11/2026 (Pierluigi, sul prototipo design/home/01-pulizia: stessa identità, senza le abitudini che si
 * ripetevano in ogni blocco). Stesse sezioni nello stesso ordine e stessi testi dei dizionari, ma:
 * - in evidenza una notizia grande con il testo accanto e due piccole sotto, al posto di tre schede uguali; la cornice
 *   celeste resta solo sulla copertina e il testo sta sul feltro; le carte citate sono una mano di carte (`CardHand`);
 * - niente kicker in maiuscolo sopra i titoli, niente freccine in fondo a tasti e link, niente sottotitoli che ripetono
 *   il titolo della sezione (`HomeHead`);
 * - un solo livello di cornice: nei pannelli (mossa, strisce) non ci sono più riquadri col bordo;
 * - nella striscia della tier list le fasce vere con le carte e la data scritta a penna; in MetaShifting la freccia a
 *   penna al posto della pastiglia; bacheca e stato del gioco sono righe, "Parti da qui" è numerata a penna.
 * Gli aloni dello sfondo e il gradiente dei tasti restano (scelta di Pierluigi dello stesso giorno).
 */
export default async function Home({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // MetaShifting in home: le tre modifiche più importanti dell'ultima patch (non di sempre, che erano sempre quelle della 0.6.3)
  const top = movers(latestPatch).slice(0, 3);
  const startGuides = START_GUIDES.map((s) => getGuide(locale, s)).filter((g): g is Guide => g !== undefined);
  const economyGuide = getGuide(locale, "collector-economy");
  // News del sito e fumetti in un solo elenco, dal più recente (mergeFeed in comics.ts): tre in evidenza, con al massimo
  // un fumetto (splitHomeFeed, 19/10/2026), e sei in bacheca
  const feed = mergeFeed(newsInLocale(locale), comicFeedCards(await listPublishedComics(9), locale, supabaseUrl, authorName));
  const { featured, board } = splitHomeFeed(feed);
  const C = comicLabels[locale];
  // Video dei creator sotto le news in evidenza (08/10/2026): dai feed YouTube dei profili vetrina, cache di mezz'ora
  const VL = creatorVideoLabels[locale];
  const railVideos: RailVideo[] = (await loadCreatorVideos()).map((v) => ({
    id: v.id,
    title: v.title,
    date: formatDateShort(locale, v.published.slice(0, 10)),
    name: v.name,
    profileHref: href(locale, `/u/${v.username}`),
  }));
  const comicHref = (c: ComicFeedCard) => href(locale, c.path);
  const sectionTitle = { decks: d.tier.sections.decks.title, legendaries: d.tier.sections.legendaries.title, cards: d.tier.sections.cards.title } as const;
  const rankedIn = (s: (typeof tierList.sections)[number]) => tierIds.reduce((acc, t) => acc + s.tiers[t].length, 0);
  /* la promessa datata resta finché nessuna sezione ha una fascia: sparisce da sola alla prima classifica */
  const nothingRanked = tierList.sections.every((s) => rankedIn(s) === 0);
  // Le fasce che la striscia fa vedere: quelle delle Leggendarie, la prima sezione classificata (09/11/2026). Mazzi e carte
  // base, quando avranno le loro fasce, restano un link: sono troppi per una striscia.
  const legendarySection = tierList.sections.find((s) => s.id === "legendaries");
  const legendaryTiers = legendarySection ? tierIds.filter((t) => legendarySection.tiers[t].length > 0) : [];
  // Invito a salvare la propria tier list (Ondata 3, TOOL-01): dal 12/10/2026 solo la frase senza numeri (mai il numero di
  // persone). Con la community spenta (NEXT_PUBLIC_COMMUNITY=off) non si salva niente: la riga non c'è.
  const ti = d.home.tierInvite;
  const sl = d.home.slides;
  const mv = d.home.moves;
  // Testo alternativo delle slide: sta nel dizionario (campo `alt`), così segue la lingua della pagina.
  const ks = kickstarterLabels[locale].slide;
  const ksBar = kickstarterLabels[locale].bar;
  const now = new Date();
  const kickstarterPromo = kickstarterPromoActive(now);
  // Dal 27/10/2026 lo slider resta fermo sulla prima slide, quella del Kickstarter (KICKSTARTER_SLIDER_PINNED_UNTIL)
  const sliderPinned = kickstarterSliderPinned(now);
  const slides: Slide[] = [
    // Prima slide dal 26/10/2026, finché dura la promozione (KICKSTARTER_PROMO_UNTIL): il Kickstarter della Alpha Edition,
    // verso la landing /kickstarter (Tim Jooste di Koin, 26/10/2026: "make it the front page of Origins Meta"). Immagine:
    // la key art di Goldi del media kit, l'eroina della copertina dei pacchetti di Myths & Legends.
    ...(kickstarterPromo
      ? [{ src: "/media/keyart-goldi.webp", alt: ks.alt, kicker: ks.kicker, title: ks.title, text: ks.text, cta: ks.cta, href: href(locale, "/kickstarter"), event: "kickstarter_landing_open" }]
      : []),
    // Prima slide dal 12/10/2026 al 26/10/2026: OriginsMeta Tracker 0.4.0 per tutti, verso la pagina dell'app. Immagine: uno screenshot
    // dell'app sopra una partita (contenuto, mai design; è la copertina della news upgrade-meta-1011, qui non è una news). È nostra: niente credito "Immagini ufficiali © Koin Games" (`ownImage`, 12/10/2026).
    { src: "/media/analytics/tracker-cover.webp", ...sl.tracker, href: href(locale, "/tracker"), ownImage: true },
    // Dal 30/09 all'11/10/2026 era la prima:
    // Prima slide dal 30/09/2026 (richiesta di Pierluigi): la copertina ufficiale della patch 0.7 con il tasto verso l'articolo.
    // Quando esce la patch successiva si sostituisce o si toglie.
    { src: "/media/news-patch-07.webp", ...sl.patch07, href: href(locale, "/news/patch-0-7") },
    { src: "/media/hero-1920.webp", ...sl.keyArt, href: officialLinks.steam, external: true },
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

  /* Le tre in evidenza in una forma sola: la prima è la notizia grande, le altre due stanno sotto */
  const featuredItems: Featured[] = featured.map((entry) =>
    entry.kind === "comic"
      ? {
          key: `comic-${entry.comic.slug}`,
          href: comicHref(entry.comic),
          day: entry.comic.date.slice(0, 10),
          date: entry.comic.date,
          title: entry.comic.title,
          titleLang: entry.comic.titleLang,
          summary: entry.comic.summary,
          summaryLang: entry.comic.summaryLang,
          image: entry.comic.image,
          postit: "comic",
          byline: fillLabel(C.by, { name: entry.comic.author.name }),
        }
      : {
          key: entry.item.slug,
          href: newsHref(entry.item),
          day: entry.item.date,
          date: entry.item.date,
          title: entry.item.title[locale],
          summary: entry.item.summary[locale],
          image: entry.item.image,
          postit: postitOf(entry.item),
          item: entry.item,
        },
  );
  const [lead, ...seconds] = featuredItems;
  const leadGuides = (lead?.item?.guides ?? []).map((s) => getGuide(locale, s)).filter((g): g is Guide => g !== undefined);

  return (
    <>
      {/* Slider a tutta larghezza con le immagini ufficiali del media kit: fa da hero */}
      {/* Quando il canale ufficiale di Origins TCG è in diretta su Twitch, al posto dello slider c'è la diretta (18/10/2026,
          OfficialLiveHero: lo decide il browser con /api/live, la home resta ISR e nell'HTML c'è sempre lo slider) */}
      <OfficialLiveHero locale={locale} labels={officialLiveLabels[locale]} playerLabels={creatorLabels[locale].liveNow.page} privacyHref={`${href(locale, "/privacy")}#video`}>
        <HeroSlider slides={slides} labels={d.home.slider} interval={4500} autoplay={!sliderPinned} />
      </OfficialLiveHero>
      {/* La barra del Kickstarter della Alpha Edition: in home sotto lo slider, non sopra il menu (Pierluigi, 27/10/2026) */}
      {kickstarterPromo ? (
        <KickstarterBar placement="home" landingHref={href(locale, "/kickstarter")} text={ksBar.text} cta={ksBar.cta} closeLabel={ksBar.close} />
      ) : null}
      <EventTicker locale={locale} dict={d} />
      <main id="main" className="flex-1">
        {/* Unico H1 della pagina: invisibile, ma letto dai motori e dagli screen reader (il blocco titolo visibile è stato tolto il 22/09/2026) */}
        <h1 className="sr-only">{d.home.h1}</h1>
        {/*
          pt-10 e non meno: il post-it grande sporge sopra la copertina (14 px, più il nastro adesivo, la rotazione e il
          bollino "Nuovo") e non deve toccare la striscia del calendario.
          `div` e non `section`: il contenitore raggruppa più sezioni con i loro titoli, non ne ha uno suo.
        */}
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          {/* Le prime tre news subito sotto il calendario (note 7.0 e 22/09/2026): una grande e due piccole, ognuna con il suo post-it */}
          <section aria-labelledby="home-featured" data-om-placement="home_featured">
            <h2 id="home-featured" className="sr-only">
              {d.home.featured}
            </h2>
            {lead ? (
              <article className="grid grid-cols-1 items-start gap-x-11 gap-y-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)]">
                {/* Il post-it è figlio diretto del contenitore `relative` (contratto di .postit in globals.css), a cavallo
                    dell'angolo in alto a sinistra della copertina: lontano dal soggetto e dai crediti, che stanno in basso */}
                <div className="relative">
                  <Postit kind={lead.postit} label={d.home.postit[lead.postit as keyof typeof d.home.postit]} date={lead.date} size="lg" tilt={-6} className="postit-corner [--flap-dur:2.6s]" />
                  {lead.image ? (
                    <Link href={lead.href} tabIndex={-1} aria-hidden="true" className="block">
                      <NewsCover src={lead.image} className={COVER_LG} />
                    </Link>
                  ) : (
                    <div className={`aspect-[16/9] bg-night ${COVER_LG}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-pale-muted">
                    <time dateTime={lead.day}>{formatDate(locale, lead.day)}</time>
                  </p>
                  <h3 className="t-item mt-1.5 sm:text-[1.45rem]" lang={lead.titleLang}>
                    <Link href={lead.href} className="hover:underline">
                      {lead.title}
                    </Link>
                  </h3>
                  {lead.byline ? <p className="mt-1.5 text-sm text-pale-muted">{lead.byline}</p> : null}
                  {/* Riassunto a quattro righe (08/10/2026, Pierluigi: "in home le news hanno un anteprima troppo lunga"): il
                      testo intero resta nell'HTML e nell'articolo */}
                  <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-pale" lang={lead.summaryLang}>
                    {lead.summary}
                  </p>
                  {/* UX-2: il mazzo si apre subito, non dopo tutte le carte (per le altre news non rende nulla) */}
                  {lead.item ? <NewsDeckButton item={lead.item} locale={locale} dict={d} className="mt-4 text-xs" /> : null}
                  {lead.item?.cards?.length || leadGuides.length ? (
                    <div className="mt-5 grid gap-4 border-t-2 border-felt-line pt-4">
                      {lead.item?.cards?.length ? (
                        <div>
                          <p className={LABEL}>{newsCardsLabel(lead.item, d)}</p>
                          <CardHand slugs={lead.item.cards} locale={locale} max={8} />
                        </div>
                      ) : null}
                      {leadGuides.length ? (
                        <div>
                          <p className={LABEL}>{d.common.relatedGuides}</p>
                          <ul className="space-y-1 text-[13.5px]">
                            {leadGuides.map((g) => (
                              <li key={g.slug}>
                                <Link href={href(locale, `/guides/${g.slug}`)} className="link-mint">
                                  {g.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {/* sui mazzi il tasto "Apri il mazzo" sta già sopra: qui resta solo la fonte delle altre news */}
                  {lead.item && !isDeckNews(lead.item) ? (
                    <p className="mt-4 text-[13px]">
                      <NewsSourceLink item={lead.item} locale={locale} dict={d} plain className="link-mint" />
                    </p>
                  ) : null}
                </div>
              </article>
            ) : null}
            {seconds.length ? (
              <div className="mt-9 grid grid-cols-1 gap-x-14 gap-y-9 border-t-2 border-felt-line pt-9 lg:grid-cols-2">
                {seconds.map((f, i) => (
                  <article key={f.key} className="grid grid-cols-[7.4rem_minmax(0,1fr)] items-start gap-x-4 sm:grid-cols-[13.25rem_minmax(0,1fr)] sm:gap-x-6">
                    <div className="relative">
                      <Postit
                        kind={f.postit}
                        label={d.home.postit[f.postit as keyof typeof d.home.postit]}
                        date={f.date}
                        tilt={i % 2 ? -3 : 4}
                        className={`postit-corner [--nudge-x:-24px] ${i % 2 ? "[--delay:-2.1s] [--flap-dur:2.3s] [--sway-dur:6.4s]" : "[--delay:-1.3s] [--flap-dur:2.9s] [--sway-dur:8.8s]"}`}
                      />
                      {f.image ? (
                        <Link href={f.href} tabIndex={-1} aria-hidden="true" className="block">
                          <NewsCover src={f.image} className={COVER_SM} />
                        </Link>
                      ) : (
                        <div className={`aspect-[16/9] bg-night ${COVER_SM}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-pale-muted">
                        <time dateTime={f.day}>{formatDate(locale, f.day)}</time>
                      </p>
                      <h3 className="t-item mt-1 text-[0.86rem] sm:text-[0.97rem]" lang={f.titleLang}>
                        <Link href={f.href} className="hover:underline">
                          {f.title}
                        </Link>
                      </h3>
                      {f.byline ? <p className="mt-1 text-[13px] text-pale-muted">{f.byline}</p> : null}
                      <p className="mt-2 line-clamp-3 text-[13.5px] leading-normal text-pale max-sm:hidden" lang={f.summaryLang}>
                        {f.summary}
                      </p>
                      {f.item?.cards?.length ? (
                        <div className="mt-3">
                          <CardHand slugs={f.item.cards} locale={locale} max={6} small />
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            <p className="mt-7 text-right text-sm font-bold">
              <Link href={href(locale, "/news")} className="link-mint">
                {d.common.viewAll}
              </Link>
            </p>
          </section>

          {/*
            Video dei creator (08/10/2026, Pierluigi: "sotto le news vorrei creare uno slider di video di youtube dei
            nostri influencer che si popola dei video ogni volta che lo pubblicano"): gli ultimi video su Origins TCG dei
            canali YouTube dei profili vetrina (src/lib/creatorVideos.ts). Senza video la sezione non c'è.
          */}
          {railVideos.length ? (
            <section className="mt-14" aria-labelledby="home-creator-videos" data-om-placement="home_creator_videos">
              <HomeHead id="home-creator-videos" title={VL.title} link={{ href: href(locale, "/creators"), label: VL.all }} className="mb-0" />
              <CreatorVideoRail videos={railVideos} labels={VL} player={videoLabels[locale].player} privacyHref={`${href(locale, "/privacy")}#video`} />
            </section>
          ) : null}

          {/*
            Fai la tua mossa (UX-1, 21/09/2026): la home non conteneva un solo invito a costruire, pubblicare o
            organizzare. Tre colonne (una sul telefono) in un pannello solo, divise da un filo: un verbo, una riga e un
            link di testo. Dal 12/11/2026 senza i tre riquadri, le icone e i tasti (era lo stampo "tre schede uguali").
          */}
          <section className="card-night mt-12 px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6" aria-labelledby="home-moves" data-om-placement="home_moves">
            {/* Il titolo resta "Fai la tua mossa" e accanto, a destra, un pezzo di scotch di carta storto con
                "Unisciti!" scritto con la penna dei post-it (Pierluigi, 23/09/2026). Lo scotch è un segno, non un
                titolo: aria-hidden, così chi ascolta la pagina sente solo il nome della sezione. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 id="home-moves" className="t-section">
                {mv.title}
              </h2>
              <span className="tape-note" aria-hidden="true">
                {mv.tape}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-3">
              {moves.map((m, i) => (
                <li key={m.id} className={`py-4 md:px-8 md:py-1 md:first:pl-0 md:last:pr-0 ${i ? "border-t-2 border-sky/30 md:border-l-2 md:border-t-0" : ""}`}>
                  <h3 className="t-item">
                    <Link href={href(locale, m.to)} className="hover:underline">
                      {m.title}
                    </Link>
                  </h3>
                  <p className="mt-2 max-w-[36ch] text-sm text-pale">{m.text}</p>
                  <Link href={href(locale, m.to)} className="link-mint mt-3 inline-block text-sm font-bold">
                    {m.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/*
            Tier list: striscia a tutta larghezza (note 7.0). Il titolo è un post-it grande attaccato al bordo sinistro
            della striscia, che la invade sopra e sotto (disegno di Pierluigi del 22/09/2026: "TIER" a penna, nastro
            adesivo in cima). È l'H2 stesso: le parole a penna sono decorative (aria-hidden) e il nome intero della
            sezione resta per i lettori di schermo.
            Dal 12/11/2026 dentro la striscia ci sono le fasce vere delle Leggendarie con le carte (prima tre riquadri
            con il nome delle sezioni) e la data dell'ultimo aggiornamento scritta a penna.
          */}
          <section className="strip-labeled card-night mt-10 flex flex-col justify-center" aria-labelledby="home-tier" data-om-placement="home_tier">
            <h2 id="home-tier" className="strip-postit strip-postit-pink strip-postit-tape" style={{ "--tilt": "-5deg", "--scrawl": "-3deg" } as CSSProperties}>
              <span className="strip-postit-text" aria-hidden="true">{d.home.tierPostit1} {d.home.tierPostit2}</span>
              <span className="sr-only">{d.home.tierTitle}</span>
            </h2>
            {legendarySection && legendaryTiers.length ? (
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label={sectionTitle.legendaries}>
                {legendaryTiers.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className={`tier-letter ${tierTone[t]}`} title={d.tier.tiers[t]}>
                      {t}
                    </span>
                    <CardHand slugs={legendarySection.tiers[t]} locale={locale} max={6} fan={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-pale-muted">{d.home.tierSub}</p>
            )}
            {nothingRanked ? <p className="mt-2 text-xs font-semibold text-chalk">{d.home.tierStatus}</p> : null}
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link href={href(locale, "/tier-list")} className="btn btn-primary text-xs">
                {d.common.viewAll}
              </Link>
              {/* Le sezioni senza fasce portano alla loro parte di "Le più giocate" (24/09/2026) */}
              {tierList.sections
                .filter((s) => rankedIn(s) === 0)
                .map((s) => (
                  <Link key={s.id} href={href(locale, `/tier-list/most-played#${s.id}`)} className="link-mint font-bold">
                    {sectionTitle[s.id]} · {d.home.tierSoon}
                  </Link>
                ))}
              <Link href={href(locale, "/tier-list/create")} className="link-mint font-bold">
                {d.tier.makerCta}
              </Link>
              {nothingRanked ? null : <span className="pen-note">{d.tier.sourceOfficialUpdated.replace("{date}", formatDate(locale, tierList.updated))}</span>}
            </p>
            {/* Invito a salvare la propria tier list (Ondata 3, TOOL-01), senza conteggi dal 12/10/2026 */}
            {supabaseEnabled ? <TierInvite text={ti.intro.replace(/\{min\}/g, String(COMMUNITY_MIN_LISTS))} cta={ti.cta} href={href(locale, "/tier-list/create")} /> : null}
          </section>

          {/* MetaShifting: striscia della stessa misura e dello stesso stile della tier list (note 7.0), con il post-it
              grande "META" ruotato dall'altra parte, così le due etichette non sembrano fotocopie (disegno del 22/09/2026) */}
          <section className="strip-labeled card-night mt-8 flex flex-col justify-center" aria-labelledby="home-metashift" data-om-placement="home_metashift">
            <h2 id="home-metashift" className="strip-postit strip-postit-mint strip-postit-bang" style={{ "--tilt": "4deg", "--scrawl": "-1.5deg" } as CSSProperties}>
              <span className="strip-postit-text" aria-hidden="true">{d.home.metaPostit1} {d.home.metaPostit2}</span>
              <span className="postit-smile" aria-hidden="true" />
              <span className="sr-only">{d.common.metashift}</span>
            </h2>
            <p className="text-sm text-pale">
              {d.home.metashiftSub}{" "}
              <span className="text-pale-muted">
                ({d.common.patch} {patchLabel(latestPatch, locale)})
              </span>
            </p>
            {/* Leggendarie per prime con la stella gialla, poi le altre (note del 22/09/2026: "★ Dorothy, ★ Wicked Stepmother, poi carte normali") */}
            <ol className="mt-3 flex flex-wrap gap-x-9 gap-y-4">
              {legendaryFirst(top, (x) => Boolean(x.card.legendary)).map(({ card, change }, i) => {
                const src = card.thumb ?? card.image;
                return (
                  <li key={`${card.slug}-${change.patch}`}>
                    <Link href={href(locale, `/cards/${card.slug}`)} className="group flex items-center gap-3">
                      <span className={`card-hand-card shrink-0 ${card.legendary ? "is-legendary" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-sm font-extrabold text-sky group-hover:underline">
                          <CardName name={card.name} legendary={card.legendary} legendaryLabel={d.common.legendary} />
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2">
                          <StatDelta from={change.from} to={change.to} />
                          <PenMark kind={change.kind} label={changeLabel(change.kind, locale, d.common)} n={i} />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {/* Il tasto promette il tracker delle patch: dal 24/09/2026 ha una pagina sua, /metashifting */}
            <p className="mt-4">
              <Link href={href(locale, "/metashifting")} className="btn btn-primary text-xs">
                {d.tier.trackerTitle}
              </Link>
            </p>
          </section>
        </div>

        {/* Bacheca news (patch note comprese): un elenco a righe, senza riquadro, con la data in testa a ogni riga */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="home-board" data-om-placement="home_news">
          <HomeHead id="home-board" title={d.home.newsBoardTitle} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
          <ul className="border-b-2 border-felt-line">
            {board.map((entry) => {
              const comic = entry.kind === "comic" ? entry.comic : null;
              const item = entry.kind === "comic" ? null : entry.item;
              const day = comic ? comic.date.slice(0, 10) : item!.date;
              const image = comic ? comic.image : item!.image;
              return (
                <li key={comic ? `comic-${comic.slug}` : item!.slug} className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t-2 border-felt-line py-4 sm:grid-cols-[4rem_8.25rem_minmax(0,1fr)] sm:gap-x-5">
                  <p className="col-span-2 font-mono text-[13px] text-mint sm:col-span-1 sm:pt-0.5">
                    <time dateTime={day}>{formatDateShort(locale, day)}</time>
                  </p>
                  {image ? <NewsCover src={image} className={COVER_SM} /> : <span aria-hidden="true" />}
                  <div className="min-w-0">
                    {/* Il titolo porta all'articolo; la fonte resta il link piccolo sotto il riassunto */}
                    <h3 className="t-item text-[0.86rem] sm:text-[0.94rem]" lang={comic?.titleLang}>
                      <Link href={comic ? comicHref(comic) : newsHref(item!)} className="hover:underline">
                        {comic ? comic.title : item!.title[locale]}
                      </Link>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-chalk-muted max-sm:hidden" lang={comic?.summaryLang}>
                      {comic ? comic.summary : item!.summary[locale]}
                    </p>
                    {comic ? (
                      <p className="mt-1 text-xs text-pale-muted">{fillLabel(C.by, { name: comic.author.name })}</p>
                    ) : (
                      <NewsSourceLink item={item!} locale={locale} dict={d} plain className="link-mint mt-1 inline-block text-xs" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Parti da qui: tre guide per chi arriva adesso, in ordine di lettura, numerate a penna */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="home-start" data-om-placement="home_guides">
          <HomeHead id="home-start" title={d.home.guidesTitle} link={{ href: href(locale, "/guides"), label: d.common.viewAll }} />
          <ol className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3">
            {startGuides.map((g, i) => (
              <li key={g.slug}>
                {g.image ? (
                  <Link href={href(locale, `/guides/${g.slug}`)} tabIndex={-1} aria-hidden="true" className="block">
                    <Image src={g.image} alt="" width={1200} height={675} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full rounded-xl border-[3px] border-sky object-cover" />
                  </Link>
                ) : null}
                <div className="mt-3.5 grid grid-cols-[2.1rem_minmax(0,1fr)] gap-x-1.5">
                  <span className="pen-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-pale-muted">
                      {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime}
                    </p>
                    <h3 className="t-item mt-0.5 text-base">
                      <Link href={href(locale, `/guides/${g.slug}`)} className="hover:underline">
                        {g.title}
                      </Link>
                    </h3>
                    <p className="mt-1.5 text-sm text-pale">{g.excerpt}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Stato del gioco + collezionismo */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="home-status" data-om-placement="home_status">
          <HomeHead id="home-status" title={d.home.statusTitle} />
          <div className="grid grid-cols-1 items-start gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div>
              {/* In breve (decisione di Pierluigi del 25/09/2026, piano SEO/GEO): due frasi visibili su che cos'è il gioco
                  e che cos'è il sito, per chi arriva cercando "origins tcg" e per le risposte degli assistenti. Sta
                  dentro Stato del gioco, piccolo, così l'ordine della home non cambia. */}
              <p className="text-[13px] font-bold text-chalk">{d.news.inBrief}</p>
              <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-pale">{d.home.inBrief}</p>
              {/* Ogni dato porta alla guida che lo spiega (analisi SEO del 25/09/2026): la home è la pagina più
                  linkata del sito e le guide evergreen avevano 2–5 link interni. Dal 12/11/2026 una scheda a righe,
                  non più sette riquadri. */}
              <dl className="mt-5 border-t-2 border-felt-line">
                {(
                  [
                    [d.home.status.demo, d.home.status.demoValue, "/guides/play-the-demo"],
                    [d.home.status.reviews, d.home.status.reviewsValue],
                    [d.home.status.matches, d.home.status.matchesValue],
                    [d.home.status.launch, d.home.status.launchValue, "/guides/roadmap-and-dates"],
                    [d.home.status.mobile, d.home.status.mobileValue, "/guides/roadmap-and-dates"],
                    // le lingue hanno la risposta primaria in /faq (C30, Ondata 3): Steam, demo e testi di gioco nella stessa voce
                    [d.home.status.languages, d.home.status.languagesValue, "/faq#languages"],
                    [d.home.status.kickstarter, d.home.status.kickstarterValue, "/guides/origins-tcg-kickstarter"],
                  ] as [string, string, string?][]
                ).map(([k, v, to]) => (
                  <div key={k} className="grid grid-cols-1 gap-x-4 gap-y-0.5 border-b-2 border-felt-line py-2.5 sm:grid-cols-[13rem_minmax(0,1fr)]">
                    <dt className="text-[13.5px] text-pale-muted">{k}</dt>
                    <dd className="min-w-0 break-words text-sm font-bold text-chalk">
                      {to ? (
                        <Link href={href(locale, to)} className="link-mint">
                          {v}
                        </Link>
                      ) : (
                        v
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-chalk-muted/80">{d.home.statusNote}</p>
            </div>
            {economyGuide ? (
              <div>
                {/* Copertina della guida: decorativa, il titolo e il riassunto sotto dicono già tutto */}
                <Link href={href(locale, "/guides/collector-economy")} tabIndex={-1} aria-hidden="true" className="block">
                  <Image src="/media/ls-two-ways.webp" alt="" width={1600} height={900} sizes="(max-width: 1024px) 90vw, 40vw" className="w-full rounded-xl border-[3px] border-sky" />
                </Link>
                <p className="mt-3.5 text-[12.5px] text-pale-muted">{d.guides.title}</p>
                <h3 className="t-item mt-0.5 text-base">
                  <Link href={href(locale, "/guides/collector-economy")} className="hover:underline">
                    {economyGuide.title}
                  </Link>
                </h3>
                <p className="mt-1.5 text-sm text-pale">{economyGuide.excerpt}</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
