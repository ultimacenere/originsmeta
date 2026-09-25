import type { CSSProperties, ReactNode } from "react";
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
import { CardChipList, CardName, legendaryFirst } from "@/components/CardChip";
import { officialLinks } from "@/components/Footer";
import { HeroSlider, type Slide } from "@/components/HeroSlider";
import { EventTicker } from "@/components/EventTicker";
import { NewsCover } from "@/components/NewsCover";
import { Postit, type PostitKind } from "@/components/Postit";
import { NewsDeckButton, NewsGuideLinks, NewsSourceLink, isDeckNews, newsCardsLabel } from "@/components/NewsLinks";
import { changeLabel } from "@/lib/linkLabels";
import { supabaseEnabled } from "@/lib/supabase/env";
import { listPublishedTierLists } from "@/lib/community/tierlists";
import { COMMUNITY_MIN_LISTS, communityStage, tierListCounts } from "@/lib/tierstats";

/*
  Dall'Ondata 3 (TOOL-01) la home legge quante tier list sono state salvate, per l'invito nella striscia della tier
  list: è in ISR come /decks e le pagine della tier list (la lettura è la stessa di `loadTierData` e ne condivide la
  cache dei dati di Next). Il layout resta statico: la lettura sta solo in questa pagina. Con un errore del database la
  lettura lancia (DECKS-12) e resta la home di prima.
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
 * - tutto il resto → "News" (viola).
 * Colori, forma e animazioni stanno nelle classi .postit di globals.css (testo ink su carta piena, contrasti
 * misurati); il componente `Postit` sceglie misura, rotazione e, dalla data, se la news è fresca (72 ore).
 */
type NewsPostit = Extract<PostitKind, "deck" | "patch" | "news">;
const PATCH_NEWS = new Set(Object.values(patches).flatMap((p) => (p.news ? [p.news] : [])));
function postitOf(item: NewsItem): NewsPostit {
  if (isDeckNews(item)) return "deck";
  return item.slug.startsWith("patch") || PATCH_NEWS.has(item.slug) ? "patch" : "news";
}

/**
 * Post-it grandi delle tre news in evidenza (note del 22/09/2026: "più grandi, storti, un po' invasivi
 * sull'immagine, disordinati"): rotazioni diverse e non allineate, e ognuno appoggiato in un punto un po' diverso
 * dell'angolo della copertina (uno sull'angolo destro), così sembrano attaccati a mano. La copertina comincia 24 px
 * sotto il bordo interno della scheda (p-6): con top fra -6 e 0 px il post-it sborda appena dalla scheda e copre
 * 20-30 px dell'angolo in alto della copertina, lontano dal soggetto e dai crediti (che stanno in basso).
 * Ogni posizione ha anche fase e durate sue (--delay, --flap-dur, --sway-dur): due post-it dello stesso tipo
 * affiancati non si muovono all'unisono. Le classi sono utility Tailwind, che vincono su `.postit-corner` e sulle
 * varianti (layer components); scritte per intero perché Tailwind le trovi nel sorgente.
 */
const FEATURED_POSTITS = [
  { tilt: -6, place: "postit-corner -top-1 left-3 [--delay:-0.4s] [--flap-dur:2.6s] [--sway-dur:7.5s]" },
  { tilt: 4, place: "postit-corner top-0 left-auto right-4 [--delay:-1.3s] [--flap-dur:2.9s] [--sway-dur:8.8s]" },
  { tilt: -3, place: "postit-corner -top-1.5 left-7 [--delay:-2.1s] [--flap-dur:2.3s] [--sway-dur:6.4s]" },
] as const;

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
 * Ordine della home (note 7.0 del 16/09/2026, rivisto il 21 e il 22/09/2026): slider, calendario, subito le prime
 * tre news "aperte" con i post-it grandi, il blocco "Fai la tua mossa" (costruisci, pubblica, organizza), la tier
 * list a striscia, MetaShifting a striscia della stessa misura, poi la bacheca con le altre news (patch note
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
 * MetaShifting hanno invece l'etichetta a penna su post-it (`.postit-label`, 22/09/2026).
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
  // Invito a salvare la propria tier list (Ondata 3, TOOL-01): quante liste mancano alla tier list della community,
  // con lo stesso conto e la stessa soglia di /tier-list/community (`tierListCounts`, `communityStage`). Con la
  // community spenta (NEXT_PUBLIC_COMMUNITY=off) non si salva niente: la riga non c'è.
  let tierInvite: string | null = null;
  if (supabaseEnabled) {
    const counts = tierListCounts(await listPublishedTierLists());
    const { stage, lists } = communityStage(counts);
    const people = counts.people === 1 ? d.tier.sourceCommunityPeopleOne : d.tier.sourceCommunityPeopleMany.replace("{n}", String(counts.people));
    tierInvite = d.home.tierInvite[stage].replace(/\{min\}/g, String(COMMUNITY_MIN_LISTS)).replace("{n}", String(lists)).replace("{people}", people);
  }
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
        {/* Unico H1 della pagina: invisibile, ma letto dai motori e dagli screen reader (il blocco titolo visibile è stato tolto il 22/09/2026) */}
        <h1 className="sr-only">{d.home.h1}</h1>
        {/*
          pt-7 e non meno: i post-it grandi sporgono appena sopra le schede (pochi px, più il nastro adesivo, la
          rotazione e il bollino "Nuovo") e non devono toccare la striscia del calendario.
          `div` e non `section`: il contenitore raggruppa quattro sezioni con i loro titoli, non ne ha uno suo.
        */}
        <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6">
          {/* Le prime tre news "aperte" subito sotto il calendario (note 7.0 e 22/09/2026), ciascuna con il suo post-it grande */}
          <section aria-labelledby="home-featured" data-om-placement="home_featured">
            <h2 id="home-featured" className="sr-only">
              {d.home.featured}
            </h2>
            <div className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3">
              {featured.map((item, i) => {
                const kind = postitOf(item);
                const deck = isDeckNews(item);
                const note = FEATURED_POSTITS[i % FEATURED_POSTITS.length];
                return (
                  <article key={item.slug} className="card-night relative flex flex-col p-6">
                    {/*
                      Figlio diretto della scheda (contratto di .postit in globals.css), a cavallo del bordo e sopra
                      l'angolo della copertina. Con la data della news: nelle prime 72 ore il post-it diventa "isterico".
                    */}
                    <Postit kind={kind} label={d.home.postit[kind]} date={item.date} size="lg" tilt={note.tilt} className={note.place} />
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
          <section className="card-night mt-8 p-5 sm:p-7" aria-labelledby="home-moves" data-om-placement="home_moves">
            <p className="kicker text-mint">{mv.kicker}</p>
            {/* Il titolo resta "Fai la tua mossa" e accanto, a destra, un pezzo di scotch di carta storto con
                "Unisciti!" scritto con la penna dei post-it (Pierluigi, 23/09/2026). Lo scotch è un segno, non un
                titolo: aria-hidden, così chi ascolta la pagina sente solo il nome della sezione. */}
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 id="home-moves" className="t-section">
                {mv.title}
              </h2>
              <span className="tape-note" aria-hidden="true">
                {mv.tape}
              </span>
            </div>
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
            Il titolo è un post-it grande attaccato al bordo sinistro della striscia, che la invade sopra e sotto
            (disegno di Pierluigi del 22/09/2026: "TIER" a penna, nastro adesivo in cima). È l'H2 stesso: le parole a
            penna sono decorative (aria-hidden) e il nome intero della sezione resta per i lettori di schermo.
          */}
          <section className="strip-labeled card-night mt-8 flex flex-wrap items-center gap-4" aria-labelledby="home-tier" data-om-placement="home_tier">
            <h2 id="home-tier" className="strip-postit strip-postit-pink strip-postit-tape" style={{ "--tilt": "-5deg", "--scrawl": "-3deg" } as CSSProperties}>
              <span className="strip-postit-text" aria-hidden="true">{d.home.tierPostit1} {d.home.tierPostit2}</span>
              <span className="sr-only">{d.home.tierTitle}</span>
            </h2>
            <div className="min-w-[220px] flex-1">
              <p className="text-sm text-pale-muted">{d.home.tierSub}</p>
              {nothingRanked ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-chalk">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-none stroke-mint stroke-[1.6]" aria-hidden="true">
                    <rect x="2" y="3" width="12" height="11" rx="2" />
                    <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" strokeLinecap="round" />
                  </svg>
                  {d.home.tierStatus}
                </p>
              ) : null}
              {/* Invito con il conteggio vero (Ondata 3, TOOL-01): la tier list della community parte da 5 liste */}
              {tierInvite ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-chalk">
                  <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0 fill-none stroke-mint stroke-[1.6]" aria-hidden="true">
                    <circle cx="6" cy="5" r="2.25" />
                    <path d="M1.75 13.5c.4-2.4 2.1-3.75 4.25-3.75s3.85 1.35 4.25 3.75" strokeLinecap="round" />
                    <path d="M10.75 3.25a2.25 2.25 0 0 1 0 4.25M12.25 9.9c1.1.55 1.8 1.75 2 3.6" strokeLinecap="round" />
                  </svg>
                  <span>
                    {tierInvite}{" "}
                    <Link href={href(locale, "/tier-list/create")} className="whitespace-nowrap text-mint hover:underline">
                      {d.home.tierInvite.cta} →
                    </Link>
                  </span>
                </p>
              ) : null}
            </div>
            <ul className="flex flex-wrap gap-2">
              {tierList.sections.map((s) => {
                const ranked = rankedIn(s);
                return (
                  <li key={s.id}>
                    {/* Finché le fasce sono vuote ogni riquadro porta alla sua sezione di "Le più giocate" (24/09/2026):
                        prima prometteva "dopo il Next Fest" e portava a una pagina senza classifica */}
                    <Link
                      href={href(locale, ranked > 0 ? `/tier-list#${s.id}` : `/tier-list/most-played#${s.id}`)}
                      className="block rounded-lg border-2 border-sky px-3 py-2 text-pale hover:bg-night-3 hover:text-chalk"
                    >
                      <span className="t-item block text-sm">{sectionTitle[s.id]}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">{ranked > 0 ? `${ranked} ${d.common.ranked}` : d.home.tierSoon}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Tasti delle due strisce col gradiente come il resto del sito (note del 22/09/2026), non più "ghost";
                accanto, la tier list personalizzabile, che finché le fasce sono vuote è l'unica cosa da fare qui */}
            <p className="flex flex-wrap gap-2">
              <Link href={href(locale, "/tier-list")} className="btn btn-primary text-xs">
                {d.common.viewAll} →
              </Link>
              <Link href={href(locale, "/tier-list/create")} className="btn btn-ghost text-xs">
                {d.tier.makerCta} →
              </Link>
            </p>
          </section>

          {/* MetaShifting: striscia della stessa misura e dello stesso stile della tier list (note 7.0), con il post-it
              grande "META" ruotato dall'altra parte, così le due etichette non sembrano fotocopie (disegno del 22/09/2026) */}
          <section className="strip-labeled card-night mt-8 flex flex-wrap items-center gap-4" aria-labelledby="home-metashift" data-om-placement="home_metashift">
            <h2 id="home-metashift" className="strip-postit strip-postit-mint strip-postit-bang" style={{ "--tilt": "4deg", "--scrawl": "-1.5deg" } as CSSProperties}>
              <span className="strip-postit-text" aria-hidden="true">{d.home.metaPostit1} {d.home.metaPostit2}</span>
              <span className="postit-smile" aria-hidden="true" />
              <span className="sr-only">{d.common.metashift}</span>
            </h2>
            <div className="min-w-[220px] max-w-xs flex-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-chalk-muted">
                {d.common.patch} {patchLabel(latestPatch, locale)}
              </span>
              <p className="mt-2 text-sm text-pale-muted">{d.home.metashiftSub}</p>
            </div>
            {/* Leggendarie per prime con la stella gialla, poi le altre (note del 22/09/2026: "★ Dorothy, ★ Wicked Stepmother, poi carte normali") */}
            <ol className="flex basis-full flex-wrap gap-2 xl:basis-auto xl:flex-1">
              {legendaryFirst(top, (x) => Boolean(x.card.legendary)).map(({ card, change }) => (
                <li key={`${card.slug}-${change.patch}`}>
                  {/* sm:whitespace-nowrap: da 640 px ogni chip resta su una riga (nome, statistiche, esito) e se lo spazio
                      manca va a capo il chip intero; sul telefono può andare a capo dentro, per non sbordare dallo schermo */}
                  <Link href={href(locale, `/cards/${card.slug}`)} className="flex items-center gap-2 rounded-lg border-2 border-sky px-2.5 py-1.5 text-xs hover:bg-night-3 sm:whitespace-nowrap">
                    <span className="t-item text-xs">
                      <CardName name={card.name} legendary={card.legendary} legendaryLabel={d.common.legendary} />
                    </span>
                    <StatDelta from={change.from} to={change.to} />
                    <ChangeChip kind={change.kind} label={changeLabel(change.kind, locale, d.common)} />
                  </Link>
                </li>
              ))}
            </ol>
            {/* Il tasto promette il tracker delle patch: dal 24/09/2026 ha una pagina sua, /metashifting */}
            <Link href={href(locale, "/metashifting")} className="btn btn-primary text-xs">
              {d.tier.trackerTitle} →
            </Link>
          </section>
        </div>

        {/* Bacheca news (patch note comprese) */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" data-om-placement="home_news">
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
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" data-om-placement="home_guides">
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
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" data-om-placement="home_status">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <SectionHead title={d.home.statusTitle} />
              {/* In breve (decisione di Pierluigi del 25/09/2026, piano SEO/GEO): due frasi visibili su che cos'è il gioco
                  e che cos'è il sito, per chi arriva cercando "origins tcg" e per le risposte degli assistenti. Sta
                  dentro Stato del gioco, piccolo, così l'ordine della home non cambia. */}
              <p className="-mt-2 mb-5 max-w-2xl text-sm leading-relaxed text-pale">
                <span className="kicker mr-2 text-mint">{d.news.inBrief}</span>
                {d.home.inBrief}
              </p>
              <dl className="grid grid-cols-2 gap-3">
                {/* Ogni dato porta alla guida che lo spiega (analisi SEO del 25/09/2026): la home è la pagina più
                    linkata del sito e le guide evergreen avevano 2–5 link interni. L'ultima riga, se dispari, va a
                    tutta larghezza. */}
                {(
                  [
                    [d.home.status.demo, d.home.status.demoValue, "/guides/play-the-demo"],
                    [d.home.status.reviews, d.home.status.reviewsValue],
                    [d.home.status.matches, d.home.status.matchesValue],
                    [d.home.status.launch, d.home.status.launchValue, "/guides/roadmap-and-dates"],
                    [d.home.status.mobile, d.home.status.mobileValue, "/guides/roadmap-and-dates"],
                    [d.home.status.languages, d.home.status.languagesValue, "/guides/play-the-demo"],
                    [d.home.status.kickstarter, d.home.status.kickstarterValue, "/guides/origins-tcg-kickstarter"],
                  ] as [string, string, string?][]
                ).map(([k, v, to], i, all) => (
                  <div key={k} className={`felt-panel p-4${i === all.length - 1 && all.length % 2 ? " col-span-2" : ""}`}>
                    <dt className="kicker text-chalk-muted">{k}</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-sky">
                      {to ? (
                        <Link href={href(locale, to)} className="underline decoration-mint/50 underline-offset-4 hover:text-mint">
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
