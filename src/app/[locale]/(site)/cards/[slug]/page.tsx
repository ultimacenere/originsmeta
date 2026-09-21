import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales, siteUrl, type Dictionary, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { cards, cardSource, getCard, lastChange, patches, relatedFrom, sagas, statLine, type Card } from "@/lib/data/cards";
import { archetypeLabels, decksWithCard } from "@/lib/data/decks";
import { tierOf } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardArt, CardChipList } from "@/components/CardChip";
import { GameCard } from "@/components/GameCard";
import { alignStyle } from "@/lib/cardArt";
import { SteamButton } from "@/components/SteamButton";
import { JsonLd, breadcrumbs, videoGameId } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => cards.map((c) => ({ locale, slug: c.slug })));
}

/** Testo su una riga sola: nel database delle carte gli a capo sono frequenti. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Taglio a parola intera, con i puntini di sospensione al posto della parola spezzata.
 * Fa quello che fa `cleanDescription` di `src/lib/page.ts`, ma il risultato sta sempre entro `max`
 * (ellissi compresa): qui i pezzi vengono incastrati uno dopo l'altro e un carattere di troppo
 * per pezzo farebbe sforare il totale.
 */
function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const hard = text.slice(0, max - 1);
  const space = hard.lastIndexOf(" ");
  const kept = space > max * 0.6 ? hard.slice(0, space) : hard;
  return `${kept.replace(/[\s,.;:·—–-]+$/, "")}…`;
}

const DESC_MIN = 120;
const DESC_MAX = 158;
const DESC_SEP = " · ";

/**
 * Meta description della scheda carta: solo dati che la pagina ha già (tipo, rarità, allineamento, saga,
 * statistiche, testo di abilità, origine della leggenda, ultimo bilanciamento), con le etichette nella
 * lingua della pagina. I fatti stanno sempre in testa; i testi lunghi si aggiungono finché la
 * descrizione non arriva a 120 caratteri e non superano mai i 158.
 */
function cardDescription(card: Card, locale: Locale, d: Dictionary): string {
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;

  const facts = [card.name, typeLabel[card.type]];
  if (card.legendary) facts.push(d.common.legendary);
  else if (card.rarity) facts.push(rarityLabel[card.rarity]);
  if (card.alignment) facts.push(alignLabel[card.alignment]);
  facts.push(sagas[card.saga][locale]);
  const stats = statLine(card);
  if (stats) facts.push(`${d.common.mana} ${stats}`);
  if (card.status === "removed") facts.push(d.common.removed);

  const last = lastChange(card);
  const extras = [
    card.ability?.[locale],
    card.origin?.[locale],
    last ? `${d.common[last.kind === "deck" ? "rework" : last.kind]} ${d.common.patch.toLowerCase()} ${last.patch}` : undefined,
    card.keywords?.length ? card.keywords.join(", ") : undefined,
    // Riserva sempre vera per le carte senza testo: porta comunque la descrizione oltre i 120 caratteri.
    d.common.asOf,
  ];

  let out = cut(facts.join(DESC_SEP), DESC_MAX);
  for (const extra of extras) {
    if (out.length >= DESC_MIN) break;
    const piece = oneLine(extra ?? "");
    if (!piece) continue;
    const room = DESC_MAX - out.length - DESC_SEP.length;
    // Sotto i 24 caratteri resterebbe un moncone: meglio fermarsi.
    if (room < 24) break;
    out += DESC_SEP + cut(piece, room);
  }
  return out;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) return {};
  // Il titolo è il solo nome della carta: la parola chiave e il marchio li compone `pageTitle`
  // (src/lib/page.ts), unico punto di verità. Aggiungerli qui li raddoppierebbe.
  // Le carte ufficiali non hanno tutte la stessa altezza (480×690, 480×660, 480×650): si legge dal file.
  const opts = card.image ? { imageAlt: `${dict.cards.collectible}: ${card.name}`, imageSize: imageSizeOf(card.image) } : {};
  return pageMeta(locale, `/cards/${card.slug}`, card.name, cardDescription(card, locale, dict), card.image, opts);
}

export default async function CardPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) notFound();
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;
  const related = cards.filter((c) => c.saga === card.saga && c.slug !== card.slug && c.status === "active");
  const linked = (card.related ?? []).filter((s) => getCard(s));
  const linkedFrom = relatedFrom(card.slug);
  const inDecks = decksWithCard(card.slug);
  const guides = getGuides(locale).filter((g) => g.tags?.cards?.includes(card.slug));
  const tier = tierOf(card.legendary ? "legendaries" : "cards", card.slug);

  // Nodo della carta per i motori e per le risposte generative: solo campi che la scheda mostra davvero.
  const path = href(locale, `/cards/${card.slug}`);
  const url = `${siteUrl}${path}`;
  const last = lastChange(card);
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
  const ldText = card.ability?.[locale] ?? card.origin?.[locale];
  if (ldText) cardLd.description = oneLine(ldText);
  if (card.image) cardLd.image = `${siteUrl}${card.image}`;
  // L'illustratore è stampato sulla carta ufficiale: va reso anche nei dati strutturati.
  if (card.credit?.illus) cardLd.creator = { "@type": "Person", name: card.credit.illus };
  if (last) cardLd.dateModified = patches[last.patch].date;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.cards.title, path: href(locale, "/cards") }, { name: card.name, path }]),
          cardLd]}
      />
      <p className="text-sm">
        <Link href={href(locale, "/cards")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.cards.title}
        </Link>
      </p>

      <article className="card-night mt-6 grid gap-8 p-6 sm:p-8 md:grid-cols-[230px_1fr_240px]">
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
          <p className="kicker text-pale-muted">
            {d.cards.detailKicker} · {sagas[card.saga][locale]}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-sky sm:text-5xl">
            {card.legendary ? <span className="text-gold">★ </span> : null}
            {card.name}
          </h1>
          {card.formerName ? (
            <p className="mt-1 text-sm text-pale-muted">
              {d.common.formerName}: {card.formerName}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="stat-pill bg-night-3 text-chalk">{typeLabel[card.type]}</span>
            {card.legendary ? <span className="stat-pill bg-gold text-ink font-bold">★ {d.common.legendary}</span> : null}
            {card.rarity && card.rarity !== "legendary" ? <span className="stat-pill bg-night-3 text-pale">{rarityLabel[card.rarity]}</span> : null}
            {card.alignment ? <span className={`stat-pill ${alignStyle[card.alignment]}`}>{alignLabel[card.alignment]}</span> : null}
            {card.status === "removed" ? <span className="stat-pill bg-crimson text-chalk">{d.common.removed}</span> : null}
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
                <span key={k} className="rounded border border-sky px-2 py-0.5 text-[11px] text-pale-muted">
                  {k}
                </span>
              ))}
            </div>
          ) : null}
          {card.origin ? (
            <>
              <h2 className="mt-8 text-xl font-extrabold text-sky">{d.cards.sagaTitle}</h2>
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
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {linked.length ? (
            <div>
              <h2 className="text-2xl font-extrabold text-sky">{d.common.related}</h2>
              <div className="mt-4">
                <CardChipList slugs={linked} locale={locale} />
              </div>
            </div>
          ) : null}
          {linkedFrom.length ? (
            <div>
              <h2 className="text-2xl font-extrabold text-sky">{d.common.relatedFrom}</h2>
              <div className="mt-4">
                <CardChipList slugs={linkedFrom.map((c) => c.slug)} locale={locale} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {card.history.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{d.cards.changesTitle}</h2>
          <ol className="mt-4 space-y-3">
            {[...card.history].reverse().map((ch, i) => (
              <li key={i} className="card-night p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <ChangeChip kind={ch.kind} label={d.common[ch.kind === "deck" ? "rework" : ch.kind]} />
                  <span className="font-mono text-sm text-pale-muted">
                    {d.common.patch} {ch.patch} · {formatDate(locale, patches[ch.patch].date)}
                  </span>
                  <SteamButton href={patches[ch.patch].url} variant="dark" size="sm" className="ml-auto">
                    {d.common.steamNews}
                  </SteamButton>
                </div>
                <div className="mt-3">
                  <StatDelta from={ch.from} to={ch.to} />
                </div>
                <p className="mt-2 text-pale">{ch.note[locale]}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {inDecks.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{d.common.decksWithCard}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {inDecks.map((deck) => (
              <li key={deck.slug}>
                <Link href={href(locale, `/decks/${deck.slug}`)} className="btn btn-mint text-xs">
                  {deck.name} <span className="font-mono font-normal opacity-70">{archetypeLabels[deck.archetype][locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Invito sempre presente: senza i mazzi ufficiali la scheda carta finirebbe in un vicolo cieco. */}
      <section className="card-night mt-10 p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold text-sky">{d.cards.buildTitle}</h2>
        <p className="mt-2 max-w-2xl text-pale">{d.cards.buildText}</p>
        <Link href={href(locale, "/deck-builder")} className="btn btn-mint mt-5 inline-flex">
          {d.nav.builder}
        </Link>
      </section>

      {guides.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{d.common.relatedGuides}</h2>
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
          <h2 className="text-2xl font-extrabold text-sky">
            {d.cards.relatedTitle}: {sagas[card.saga][locale]}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-ghost text-xs">
                  {c.name}
                  {statLine(c) ? <span className="font-mono text-chalk-muted">{statLine(c)}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-xs text-chalk-muted/70">
        {d.cards.sourceBefore}{" "}
        <a href={cardSource.url} rel="noopener" className="link-mint">
          {cardSource.name}
        </a>{" "}
        ({d.common.patch} {cardSource.patch}){d.cards.sourceAfter}
      </p>
    </div>
  );
}
