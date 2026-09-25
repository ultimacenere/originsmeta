import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, pageTitle, resolveLocale } from "@/lib/page";
import { cardDescription, cardTitle, textOutdated } from "@/lib/cardTitles";
import { cardLastmod, cardTextSource } from "@/lib/cardDates";
import { todayUtc } from "@/lib/lastmod";
import { changeLabel } from "@/lib/linkLabels";
import { cards, cardSource, getCard, patchLabel, patches, sagas, statLine } from "@/lib/data/cards";
import { tierOf } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { keywordLabel } from "@/lib/keywordLabels";
import { alignStyle } from "@/lib/cardArt";
import { cardDeckSlugs, cardPageDeckDays, cardPageLastmod, cardRelations, companions, decksByCard, deckRoots, listedDecks } from "@/lib/cardSynergy";
import {
  asOfLine,
  cardBrief,
  cardImageAlt,
  cardImageSize,
  cardLabels,
  cardLdTexts,
  cardLead,
  cardStatusLd,
  fill,
  kindWord,
  legendaryPowers,
  partsText,
  sourceNote,
  type CardFacts,
} from "@/lib/cardPage";
import { loadCommunityScores, loadDeckRefs } from "@/lib/community/decksByCard";
import { cardJsonLd } from "@/lib/jsonld/card";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardName, legendaryFirst } from "@/components/CardChip";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { GameCard } from "@/components/GameCard";
import { SteamButton, newTabProps } from "@/components/SteamButton";
import { JsonLd } from "@/components/JsonLd";
import { RemovedArchiveLink } from "@/components/RemovedCardsArchive";
import { CardParts } from "@/components/card/CardParts";
import { CardText } from "@/components/card/CardText";
import { CardCompanions, CardDecks, CardRootDecks } from "@/components/card/CardDecks";
import { CardRelations, CardRootCta } from "@/components/card/CardRelations";
import { CardBrief, CardCommunityScore } from "@/components/card/CardBrief";
import { CardCollectible } from "@/components/card/CardCollectible";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Scheda carta, modello dell'Ondata 2 del piano SEO/GEO (schede carta, Leggendarie e mazzi), uno per tipo di carta:
 * - Leggendarie e carte base della Demo 2.0: frase d'attacco dai dati, "Mazzi guidati da {Leggendaria}" / "Mazzi con
 *   {carta}", "Spesso nello stesso mazzo", carte che genera, storico, "In breve", tier list della community (dietro la
 *   soglia), invito al deck builder, guide, stessa saga;
 * - carte create: prima riga con chi le genera (catena dai testi), "Come si ottiene", il conto dei mazzi con la carta
 *   che le genera (con il link alla sua sezione dei mazzi, non la stessa lista ripetuta), e al posto del deck builder,
 *   che non le accetta, l'invito a costruire un mazzo con quella carta;
 * - carte rimosse: prima riga "non è nella Demo 2.0, quindi non si può aggiungere nel deck builder", niente mazzi né
 *   tier list, rimando all'archivio delle carte non nella demo.
 * Mazzi e tier list della community vengono da Supabase: la pagina resta generata in build per tutte le 690 URL
 * (generateStaticParams) e diventa ISR. La lettura è una sola per tutte le schede (`src/lib/community/decksByCard.ts`,
 * cache condivisa con etichetta) e le Server Action dei mazzi rigenerano le schede quando un mazzo viene pubblicato,
 * modificato, nascosto o eliminato; `revalidate` è la riserva, un'ora, la stessa della cache dei dati.
 * Con la pagina in ISR nessun dato si legge dal disco a runtime (su Vercel la funzione non ha `public/`): le misure
 * della carta ufficiale vengono da `card-art.json` (`cardImageSize`).
 * Title e description restano quelli di `cardTitles.ts` (Ondata 1).
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.flatMap((locale) => cards.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) return {};
  // Title e description per tipo di carta e per lingua (Ondata 1 SEO/GEO, 25/09/2026): "Merlin: carta Leggendaria di
  // Origins TCG", "Garlic: carta creada de Origins TCG"… e una frase fatta dei soli dati della scheda, con "Origins TCG"
  // e "Koin Games". Il title contiene già la parola chiave: `pageTitle` aggiunge solo " · OriginsMeta" se ci sta.
  // L'H1 resta il nome della carta. Modelli e test in src/lib/cardTitles.ts. Un testo che una patch ha superato
  // (`textOutdated`, come Silver Bullet: il database dice ancora 3 danni, la 0.6.2 li ha portati a 1) non va nella
  // description.
  // Le carte ufficiali non hanno tutte la stessa altezza (480×690, 480×660, 480×650): la misura viene da card-art.json,
  // non dal file, perché la scheda è ISR e su Vercel la rigenerazione non vede `public/`. L'alt descrive la carta
  // (nome, tipo, gioco, illustratore, © Koin Games), come sulla pagina (CARDS-16).
  const opts = card.image ? { imageAlt: cardImageAlt(card, locale), imageSize: cardImageSize(card) } : {};
  return pageMeta(locale, `/cards/${card.slug}`, cardTitle(card, locale), cardDescription(card, locale, cards, cardTextSource), card.image, opts);
}

export default async function CardPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) notFound();
  const l = cardLabels[locale];
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;

  const token = card.type === "token";
  const removed = card.status === "removed";
  /** carta della collezione della Demo 2.0: la sola che il deck builder accetta (stesso filtro del pool in builderLabels.ts) */
  const playable = !removed && !token;

  // Legami con le altre carte, dai testi (cardSynergy.ts): chi la genera, che cosa genera, collegate da World of Origins.
  const rel = cardRelations(card, cards);
  // Una carta creata non si aggiunge nel deck builder: si contano i mazzi con la carta della demo che la genera
  // (`cardDeckSlugs`). Le rimosse non ne mostrano.
  const roots = token ? deckRoots(rel.createdBy) : [];
  const deckSlugs = cardDeckSlugs(card, cards);

  // Mazzi pubblicati e tier list della community, dalla cache condivisa fra tutte le schede. Le rimosse (e le create
  // che nessun testo della demo genera) non ne mostrano: non leggono niente.
  const [allDecks, scores] = await Promise.all([deckSlugs.length ? loadDeckRefs() : Promise.resolve(null), playable ? loadCommunityScores() : Promise.resolve(null)]);
  const withCard = allDecks ? decksByCard(allDecks, deckSlugs) : [];
  // Elenco, JSON-LD e date guardano gli stessi mazzi (`listedDecks`): indicizzabili in questa lingua, al massimo 12.
  const { listed, others } = allDecks && playable ? listedDecks(allDecks, card.slug, locale) : { listed: [], others: 0 };
  const count = allDecks && playable ? { n: withCard.length, total: allDecks.length } : undefined;
  const together = allDecks && playable ? companions(allDecks, card.slug) : [];

  const facts: CardFacts = {
    decks: count,
    companions: together.flatMap((c) => {
      const other = getCard(c.slug);
      return other ? [{ card: other, together: c.together }] : [];
    }),
    ...rel,
  };
  const lead = cardLead(card, facts, locale);
  const brief = cardBrief(card, facts, locale);

  const related = legendaryFirst(
    cards.filter((c) => c.saga === card.saga && c.slug !== card.slug && c.status === "active"),
    (c) => Boolean(c.legendary),
  );
  const guides = getGuides(locale).filter((g) => g.tags?.cards?.includes(card.slug));
  // Guida al mazzo della Leggendaria, in cima alla scheda (mappa delle query, C22): la guida il cui mazzo è guidato da lei.
  const deckGuide = card.legendary ? guides.find((g) => g.category === "decks" && g.deckList?.[0] === card.slug) : undefined;
  // Solo una fascia vera della tier list di OriginsMeta: la pastiglia "Non ancora classificata" era un blocco ripetuto
  // su tutte le Leggendarie senza dire niente (TECH-04, CARDS-06).
  const tier = playable ? tierOf(card.legendary ? "legendaries" : "cards", card.slug) : undefined;
  const power = card.legendary && playable ? legendaryPowers[card.slug]?.[locale] : undefined;
  const outdated = textOutdated(card, cardTextSource);
  const asOf = asOfLine(card, locale, cardSource) ?? d.common.asOf;

  const path = href(locale, `/cards/${card.slug}`);
  const today = todayUtc();
  // Lo stesso giorno del `lastmod` della sitemap, con le stesse due funzioni: le date della scheda (`cardLastmod`:
  // patch, verifica sul gioco, testi letti nel gioco, guide) più quelle dei mazzi che la scheda elenca
  // (`cardPageDeckDays`; la sitemap le deve contare allo stesso modo: note dell'Ondata 2).
  const dateModified = cardPageLastmod(cardLastmod(card, locale, today), locale, cardPageDeckDays(card, locale, allDecks), today);
  const decksTitle = fill(token ? l.decksCreating : card.legendary ? l.decksLed : l.decksWith, { name: card.name });
  const ld = cardJsonLd({
    card,
    locale,
    path,
    title: pageTitle(cardTitle(card, locale)),
    description: cardDescription(card, locale, cards, cardTextSource),
    lead: partsText(lead),
    texts: cardLdTexts(card, outdated),
    dateModified,
    crumbs: [
      { name: "OriginsMeta", path: href(locale) },
      { name: d.cards.title, path: href(locale, "/cards") },
      { name: card.name, path },
    ],
    keywords: [kindWord(card, locale), ...(card.rarity && card.rarity !== "legendary" ? [rarityLabel[card.rarity]] : []), ...(card.keywords ?? []).map((k) => keywordLabel(k, locale))],
    status: cardStatusLd(card, rel),
    image: card.image
      ? { ...cardImageSize(card), alt: cardImageAlt(card, locale), credit: card.credit?.illus ? fill(l.creditText, { illus: card.credit.illus }) : "© Koin Games" }
      : undefined,
    decks: { title: decksTitle, items: listed.map((deck) => ({ name: deck.name, path: href(locale, `/decks/community/${deck.slug}`) })) },
  });

  const decksSection = token ? (
    <CardRootDecks locale={locale} title={decksTitle} roots={roots} decks={withCard.length} />
  ) : (
    <CardDecks locale={locale} dict={d} title={decksTitle} listed={listed} others={others} />
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={ld} />
      {/* Una volta per pagina: tiene dentro la finestra le anteprime delle carte collegate (CardChip) */}
      <CardMentionEdges />
      <p className="text-sm">
        <Link href={href(locale, "/cards")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.cards.title}
        </Link>
      </p>

      <article className="card-night mt-6 grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[230px_minmax(0,1fr)_240px]">
        <div className="flex flex-col items-center gap-4">
          {/* A sinistra la carta come si legge in partita (disegnata da noi, dati nostri), sotto l'oggetto
              da collezione ufficiale con i crediti impressi: il gioco è anche collezionismo. */}
          <GameCard card={card} locale={locale} priority className="w-full max-w-[230px]" />
          {card.image ? (
            <div className="flex items-start gap-3">
              <CardCollectible card={card} alt={cardImageAlt(card, locale)} className="!h-[112px] !w-[80px] shrink-0 text-base" />
              <div className="text-[11px] leading-relaxed text-pale-muted">
                <p className="text-chalk-muted">{d.cards.collectible}</p>
                {/* Il nome dell'illustratore è stampato sulla carta: va reso, non solo il copyright. */}
                {card.credit ? (
                  <p>
                    {d.common.illustratedBy} <span className="text-pale">{card.credit.illus}</span>
                  </p>
                ) : null}
                {card.credit?.num ? <p className="font-mono">M&amp;L #{card.credit.num}</p> : null}
                <p>{d.common.imageCredit}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-[11px] text-pale-muted">{d.common.noImage}</p>
          )}
        </div>
        <div>
          <p className="kicker text-mint">
            {d.cards.detailKicker} · {sagas[card.saga][locale]}
          </p>
          {/* La stella della Leggendaria resta visibile ma fuori dall'H1 (SCHEDE-17): prima i crawler leggevano "★Merlin".
              Il contenitore ha la stessa misura del titolo, perché la stella (1,15em) resti grande come prima. */}
          <div className="t-page mt-2 flex items-baseline leading-tight">
            {card.legendary ? (
              <span className="legendary-star" aria-hidden="true">
                ★
              </span>
            ) : null}
            <h1 className="t-page min-w-0 leading-tight">{card.name}</h1>
          </div>
          {card.formerName ? (
            <p className="mt-1 text-sm text-pale-muted">
              {d.common.formerName}: {card.formerName}
            </p>
          ) : null}
          {/* Frase d'attacco dai dati (CARDS-05, GEO-07): che cos'è la carta, stato e mazzi, senza giudizi. Sulle carte
              create la prima cosa è chi le genera, sulle rimosse che non sono nella Demo 2.0. */}
          <p className="mt-4 max-w-2xl text-pale">
            <CardParts parts={lead} locale={locale} self={card.slug} />
          </p>
          {deckGuide ? (
            <p className="mt-3 text-sm">
              <span className="kicker mr-2 text-mint">{l.deckGuide}</span>
              <Link href={href(locale, `/guides/${deckGuide.slug}`)} className="link-mint font-bold">
                {deckGuide.title} →
              </Link>
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="stat-pill bg-night-3 text-chalk">{typeLabel[card.type]}</span>
            {card.legendary ? <span className="stat-pill bg-gold font-bold text-ink">★ {d.common.legendary}</span> : null}
            {card.rarity && card.rarity !== "legendary" ? <span className="stat-pill bg-night-3 text-pale">{rarityLabel[card.rarity]}</span> : null}
            {/* Pastiglie leggibili: allineamento dalla mappa condivisa (tinte tenui, testo scuro, come nel database
                carte); "Rimossa" chalk sul magenta scuro 6,1:1 (sul magenta pieno faceva 3,99:1). */}
            {card.alignment ? <span className={`stat-pill font-bold ${alignStyle[card.alignment]}`}>{alignLabel[card.alignment]}</span> : null}
            {removed ? <span className="stat-pill bg-crimson-deep font-bold text-chalk">{d.common.removed}</span> : null}
            {tier && tier !== "unranked" ? (
              <span className="stat-pill bg-night-3 text-pale">
                {d.common.tierPosition}: {tier}
              </span>
            ) : null}
          </div>
          {/* Testo della carta con l'etichetta: testo ufficiale del gioco o traduzione nostra, e l'inglese del gioco
              sulle pagine italiane e spagnole, con lang="en" (SCHEDE-07). */}
          <CardText card={card} locale={locale} outdated={outdated} />
          {card.keywords?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {card.keywords.map((k) => (
                <span key={k} className="rounded border-2 border-sky px-2 py-0.5 text-[11px] text-pale-muted">
                  {keywordLabel(k, locale)}
                </span>
              ))}
            </div>
          ) : null}
          {/* Potere leggendario (SCHEDE-13): compare quando `legendaryPowers` in cardPage.ts ha il testo letto nel gioco.
              Oggi è vuoto: niente testo copiato da altri siti né scritto a memoria. */}
          {power ? (
            <>
              <h2 className="t-section mt-8">{l.legendaryPower}</h2>
              <p className="mt-2 whitespace-pre-line text-pale">{power}</p>
            </>
          ) : null}
          {card.origin ? (
            <>
              <h2 className="t-section mt-8">{d.cards.sagaTitle}</h2>
              <p className="mt-2 text-pale-muted">{card.origin[locale]}</p>
            </>
          ) : null}
        </div>

        <aside className="felt-panel self-start p-5 text-chalk">
          <p className="kicker text-chalk-muted">{d.common.stats}</p>
          {card.mana === undefined && card.power === undefined ? (
            <p className="mt-2 text-sm text-chalk-muted">{d.common.unknownStats}</p>
          ) : (
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="kicker text-chalk-muted">{d.common.mana}</dt>
                <dd className="font-display text-3xl font-extrabold text-mint tabular">{card.mana ?? "–"}</dd>
              </div>
              <div>
                <dt className="kicker text-chalk-muted">{d.common.power}</dt>
                <dd className="font-display text-3xl font-extrabold text-sky tabular">{card.power ?? "–"}</dd>
              </div>
              <div>
                <dt className="kicker text-chalk-muted">{d.common.health}</dt>
                <dd className="font-display text-3xl font-extrabold text-sky tabular">{card.health ?? "–"}</dd>
              </div>
            </dl>
          )}
          {card.key ? <p className="mt-3 font-mono text-[11px] text-chalk-muted/80">ID {card.key}</p> : null}
          {/* Le carte create e rimosse non stanno nella collezione della demo: la riga non dice più che sono state
              verificate nel gioco (CARDS-09). */}
          <p className="mt-4 text-[11px] leading-snug text-chalk-muted/80">{asOf}</p>
        </aside>
      </article>

      {/* Carte create: prima come si ottengono, poi i mazzi con la carta che le genera */}
      {token ? <CardRelations card={card} locale={locale} rel={rel} /> : null}

      {!removed ? decksSection : null}

      {playable ? <CardCompanions card={card} locale={locale} list={together} decks={withCard.length} min={2} /> : null}

      {!token ? <CardRelations card={card} locale={locale} rel={rel} /> : null}

      {card.history.length ? (
        <section className="mt-10">
          <h2 className="t-section">{d.cards.changesTitle}</h2>
          <ol className="mt-4 space-y-3">
            {[...card.history].reverse().map((ch, i) => {
              const patch = patches[ch.patch];
              const label = `${d.common.patch} ${patchLabel(ch.patch, locale)}`;
              return (
                <li key={i} className="card-night p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* "Cambio di mazzo" per gli scambi nei mazzi del playtest: la carta non cambia (`changeLabel`) */}
                    <ChangeChip kind={ch.kind} label={changeLabel(ch.kind, locale, d.common)} />
                    {/* La patch porta al nostro articolo, che racconta il perché delle modifiche (campo `news` della
                        patch in cards.ts); il post Steam resta accanto come fonte ufficiale (Ondata 1, 25/09/2026). */}
                    <span className="font-mono text-sm text-pale-muted">
                      {patch.news ? (
                        <Link href={href(locale, `/news/${patch.news}`)} className="link-mint">
                          {label}
                        </Link>
                      ) : (
                        label
                      )}{" "}
                      · {formatDate(locale, patch.date)}
                    </span>
                    <SteamButton href={patch.url} variant="dark" size="sm" className="ml-auto">
                      {d.common.steamNews}
                    </SteamButton>
                  </div>
                  <div className="mt-3">
                    <StatDelta from={ch.from} to={ch.to} />
                  </div>
                  <p className="mt-2 text-pale">{ch.note[locale]}</p>
                </li>
              );
            })}
          </ol>
          {/* Tutte le patch in una pagina: MetaShifting non è nel menu, le schede carta sono la sua porta più frequente */}
          <p className="mt-4 text-sm">
            <Link href={href(locale, "/metashifting")} className="link-mint font-bold">
              {d.metashifting.h1} →
            </Link>
          </p>
        </section>
      ) : null}

      <CardBrief card={card} locale={locale} items={brief} />

      {playable ? <CardCommunityScore card={card} locale={locale} scores={scores} /> : null}

      {/* Invito al deck builder solo sulle carte che il builder accetta (attive e non create: stesso filtro del pool in
          builderLabels.ts). Sulle carte create l'invito è a costruire un mazzo con la carta che le genera; le rimosse
          rimandano all'archivio delle carte non nella demo in fondo a /cards (SCHEDE-04). */}
      {playable ? (
        <section className="card-night mt-10 p-6 sm:p-8">
          <h2 className="t-section">{d.cards.buildTitle}</h2>
          <p className="mt-2 max-w-2xl text-pale">{d.cards.buildText}</p>
          <Link href={href(locale, "/deck-builder")} className="btn btn-primary mt-5 inline-flex">
            {d.nav.builder}
          </Link>
        </section>
      ) : token ? (
        <CardRootCta card={card} locale={locale} roots={roots} builderLabel={d.nav.builder} />
      ) : (
        <RemovedArchiveLink locale={locale} />
      )}

      {guides.length ? (
        <section className="mt-10">
          <h2 className="t-section">{d.common.relatedGuides}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="btn btn-ghost text-xs">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-12">
          <h2 className="t-section">{removed ? `${l.sameSagaDemo}: ${sagas[card.saga][locale]}` : `${d.cards.relatedTitle}: ${sagas[card.saga][locale]}`}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-ghost text-xs">
                  <span>
                    <CardName name={c.name} legendary={c.legendary} legendaryLabel={d.common.legendary} />
                  </span>
                  {statLine(c) ? <span className="font-mono text-chalk-muted">{statLine(c)}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-xs text-chalk-muted/70">
        {d.cards.sourceBefore}{" "}
        <a href={cardSource.url} {...newTabProps} className="link-mint">
          {cardSource.name}
        </a>{" "}
        ({sourceNote(locale, cardSource)}){d.cards.sourceAfter}
      </p>
    </div>
  );
}
