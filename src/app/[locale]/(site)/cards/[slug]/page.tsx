import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { cardDescription, cardTitle, textOutdated } from "@/lib/cardTitles";
import { cardLastmod, cardTextSource } from "@/lib/cardDates";
import { todayUtc } from "@/lib/lastmod";
import { changeLabel } from "@/lib/linkLabels";
import { cards, cardSource, getCard, patchLabel, patches, relatedFrom, sagas, statLine } from "@/lib/data/cards";
import { archetypeLabels, decksWithCard } from "@/lib/data/decks";
import { tierOf } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardArt, CardChipList, CardName, legendaryFirst } from "@/components/CardChip";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { GameCard } from "@/components/GameCard";
import { alignStyle } from "@/lib/cardArt";
import { keywordLabel } from "@/lib/keywordLabels";
import { SteamButton, newTabProps } from "@/components/SteamButton";
import { JsonLd, breadcrumbs, videoGameId } from "@/components/JsonLd";
import { RemovedArchiveLink } from "@/components/RemovedCardsArchive";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => cards.map((c) => ({ locale, slug: c.slug })));
}

/** Testo su una riga sola: nel database delle carte gli a capo sono frequenti. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) return {};
  // Title e description per tipo di carta e per lingua (Ondata 1 SEO/GEO, 25/09/2026): "Merlin: carta Leggendaria di
  // Origins TCG", "Garlic: carta creada de Origins TCG"… e una frase fatta dei soli dati della scheda, con "Origins TCG"
  // e "Koin Games". Il title contiene già la parola chiave: `pageTitle` aggiunge solo " · OriginsMeta" se ci sta.
  // L'H1 resta il nome della carta. Modelli e test in src/lib/cardTitles.ts. Un testo che una patch ha superato
  // (`textOutdated`, come Silver Bullet dopo la patch della demo del 21/09) non va nella description.
  // Le carte ufficiali non hanno tutte la stessa altezza (480×690, 480×660, 480×650): si legge dal file.
  const opts = card.image ? { imageAlt: `${dict.cards.collectible}: ${card.name}`, imageSize: imageSizeOf(card.image) } : {};
  return pageMeta(locale, `/cards/${card.slug}`, cardTitle(card, locale), cardDescription(card, locale, cards, cardTextSource), card.image, opts);
}

export default async function CardPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) notFound();
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;
  // Stessa saga: Leggendarie per prime, con la stella davanti al nome (regola del 22/09/2026)
  const related = legendaryFirst(
    cards.filter((c) => c.saga === card.saga && c.slug !== card.slug && c.status === "active"),
    (c) => Boolean(c.legendary),
  );
  const linked = (card.related ?? []).filter((s) => getCard(s));
  const linkedFrom = relatedFrom(card.slug);
  const inDecks = decksWithCard(card.slug);
  const guides = getGuides(locale).filter((g) => g.tags?.cards?.includes(card.slug));
  const tier = tierOf(card.legendary ? "legendaries" : "cards", card.slug);

  // Nodo della carta per i motori e per le risposte generative: solo campi che la scheda mostra davvero.
  const path = href(locale, `/cards/${card.slug}`);
  const url = `${siteUrl}${path}`;
  const cardLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#card`,
    name: card.name,
    url,
    inLanguage: locale,
    // La carta fa parte del nostro database e parla del gioco: le due entità sono dichiarate qui sotto.
    isPartOf: { "@id": `${siteUrl}${href(locale, "/cards")}#collection` },
    about: { "@id": videoGameId },
  };
  // Come nella description: un testo superato da una patch non si dichiara, resta l'origine della leggenda.
  const ldText = (textOutdated(card, cardTextSource) ? undefined : card.ability?.[locale]) ?? card.origin?.[locale];
  if (ldText) cardLd.description = oneLine(ldText);
  if (card.image) cardLd.image = `${siteUrl}${card.image}`;
  // L'illustratore è stampato sulla carta ufficiale: va reso anche nei dati strutturati.
  if (card.credit?.illus) cardLd.creator = { "@type": "Person", name: card.credit.illus };
  // Lo stesso giorno del `lastmod` della sitemap (`cardLastmod`): patch, verifica sul gioco, testi italiani e spagnoli
  // letti nel gioco, guide e tier list; prima qui c'era solo l'ultima patch e le due date non coincidevano.
  cardLd.dateModified = cardLastmod(card, locale, todayUtc());

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.cards.title, path: href(locale, "/cards") }, { name: card.name, path }]),
          cardLd]}
      />
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
              <CardArt card={card} full className="!h-[112px] !w-[80px] shrink-0 text-base" />
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
          {/* Nell'H1 solo la stella (nascosta ai lettori di schermo) e il nome: "Leggendaria" lo dice già la pastiglia
              oro accanto alle statistiche, e il titolo letto dai motori resta il nome della carta */}
          <h1 className="t-page mt-2 leading-tight">
            {card.legendary ? (
              <span className="legendary-star" aria-hidden="true">
                ★
              </span>
            ) : null}
            {card.name}
          </h1>
          {card.formerName ? (
            <p className="mt-1 text-sm text-pale-muted">
              {d.common.formerName}: {card.formerName}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="stat-pill bg-night-3 text-chalk">{typeLabel[card.type]}</span>
            {card.legendary ? <span className="stat-pill bg-gold font-bold text-ink">★ {d.common.legendary}</span> : null}
            {card.rarity && card.rarity !== "legendary" ? <span className="stat-pill bg-night-3 text-pale">{rarityLabel[card.rarity]}</span> : null}
            {/* Pastiglie leggibili: allineamento dalla mappa condivisa (tinte tenui, testo scuro, come nel database
                carte); "Rimossa" chalk sul magenta scuro 6,1:1 (sul magenta pieno faceva 3,99:1). */}
            {card.alignment ? <span className={`stat-pill font-bold ${alignStyle[card.alignment]}`}>{alignLabel[card.alignment]}</span> : null}
            {card.status === "removed" ? <span className="stat-pill bg-crimson-deep font-bold text-chalk">{d.common.removed}</span> : null}
            {tier ? (
              <span className="stat-pill bg-night-3 text-pale">
                {d.common.tierPosition}: {tier === "unranked" ? d.common.unranked : tier}
              </span>
            ) : null}
          </div>
          {card.ability ? <p className="mt-6 whitespace-pre-line text-lg text-pale">{card.ability[locale]}</p> : null}
          {card.ability && locale !== "en" ? <p className="mt-2 whitespace-pre-line text-sm text-pale-muted">{card.ability.en}</p> : null}
          {card.keywords?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {card.keywords.map((k) => (
                <span key={k} className="rounded border-2 border-sky px-2 py-0.5 text-[11px] text-pale-muted">
                  {keywordLabel(k, locale)}
                </span>
              ))}
            </div>
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
          <p className="mt-4 text-[11px] leading-snug text-chalk-muted/80">{d.common.asOf}</p>
        </aside>
      </article>

      {linked.length || linkedFrom.length ? (
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {linked.length ? (
            <div>
              <h2 className="t-section">{d.common.related}</h2>
              <div className="mt-4">
                <CardChipList slugs={linked} locale={locale} />
              </div>
            </div>
          ) : null}
          {linkedFrom.length ? (
            <div>
              <h2 className="t-section">{d.common.relatedFrom}</h2>
              <div className="mt-4">
                <CardChipList slugs={linkedFrom.map((c) => c.slug)} locale={locale} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

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

      {inDecks.length ? (
        <section className="mt-10">
          <h2 className="t-section">{d.common.decksWithCard}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {inDecks.map((deck) => (
              <li key={deck.slug}>
                <Link href={href(locale, `/decks/${deck.slug}`)} className="btn btn-ink text-xs">
                  {deck.name} <span className="font-mono font-normal text-pale-muted">{archetypeLabels[deck.archetype][locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Invito al deck builder solo sulle carte che il builder accetta (attive e non create: stesso filtro del pool in
          builderLabels.ts). Su carte create e fuori dalla demo prometteva una cosa che non funziona (SCHEDE-04): le
          rimosse rimandano invece all'archivio delle carte non nella demo in fondo a /cards; le create hanno già il
          riquadro "Richiamata da" qui sopra. */}
      {card.status === "active" && card.type !== "token" ? (
        <section className="card-night mt-10 p-6 sm:p-8">
          <h2 className="t-section">{d.cards.buildTitle}</h2>
          <p className="mt-2 max-w-2xl text-pale">{d.cards.buildText}</p>
          <Link href={href(locale, "/deck-builder")} className="btn btn-primary mt-5 inline-flex">
            {d.nav.builder}
          </Link>
        </section>
      ) : card.status === "removed" ? (
        <RemovedArchiveLink locale={locale} />
      ) : null}

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
          <h2 className="t-section">
            {d.cards.relatedTitle}: {sagas[card.saga][locale]}
          </h2>
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
        ({d.common.patch} {cardSource.patch}){d.cards.sourceAfter}
      </p>
    </div>
  );
}
