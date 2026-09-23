import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, siteUrl, type Dictionary, type Locale } from "@/lib/i18n";
import { cleanDescription, defaultOgImage, DESCRIPTION_MAX, pageMeta, pageTitleWith, resolveLocale, type PageMetaOptions } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getCard, patchAt, patchLabel } from "@/lib/data/cards";
import { RULES } from "@/lib/deckrules";
import { encodeOmCode } from "@/lib/deckcode";
import { deckGameCode } from "@/lib/deckGameCode";
import { getCommunityDeck, listPublishedDecks } from "@/lib/community/queries";
import { guideSections, type CommunityDeck } from "@/lib/community/types";
import { getGuides } from "@/lib/content/guides";
import { authorHandle, authorName, youtubeId } from "@/lib/community/util";
import { CardArt, DeckCardGrid } from "@/components/CardChip";
import { CardMentions } from "@/components/CardMentions";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { StarRating } from "@/components/StarRating";
import { CopyButton } from "@/components/CopyButton";
import { OwnerActions } from "@/components/OwnerActions";
import { Avatar } from "@/components/AccountMenu";
import { contactEmail, officialLinks } from "@/components/Footer";
import { NewDeckBanner } from "@/components/NewDeckBanner";
import { DeckCharts } from "@/components/DeckCharts";
import { deckStats } from "@/lib/deckstats";
import { JsonLd, breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

/** Punti di forza in verde e punti deboli in rosso, su sfondo "lavagna" (richiesta di Davdas, 15/09/2026). */
const sectionStyle: Record<string, { box: string; title: string }> = {
  strengths: { box: "border-good bg-good/10", title: "text-good" },
  weaknesses: { box: "border-bad bg-bad/10", title: "text-bad" },
};

/**
 * Pagine generate alla prima richiesta e rigenerate al massimo ogni minuto (voti e modifiche).
 * generateStaticParams vuoto + dynamicParams: senza di esso Next renderizzerebbe la pagina a ogni richiesta.
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

/** Nome della Leggendaria del mazzo, anche quando è una carta fuori dal nostro database. */
function legendaryName(deck: CommunityDeck): string | undefined {
  return (deck.legendary ? getCard(deck.legendary)?.name : undefined) ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name;
}

/**
 * Descrizione del mazzo nella lingua della pagina. Prima era un taglio grezzo del testo dell'autore: su /en
 * usciva in italiano, spezzata a metà parola e a volte con un trattino di elenco in testa. Qui la costruiamo
 * con le etichette del dizionario e i dati del mazzo; il testo dell'autore si aggiunge in coda solo quando è
 * scritto nella lingua della pagina, perché il sito non traduce i testi della community.
 * La usano sia i metadati sia il JSON-LD, così dicono la stessa cosa.
 */
function deckDescription(deck: CommunityDeck, locale: Locale, dict: Dictionary, max: number = DESCRIPTION_MAX): string {
  const star = legendaryName(deck);
  const facts = [
    `${deck.name} · ${dict.community.kicker} ${dict.community.by} ${authorName(deck.profile)}`,
    star ? `${dict.common.legendary}: ${star}` : "",
    `${dict.common.archetype}: ${archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}`,
  ]
    .filter(Boolean)
    .join(". ");
  const own = deck.guide.lang === locale ? cleanDescription(deck.guide.summary, max) : "";
  const text = cleanDescription(own ? `${facts}. ${own}` : `${facts}.`, max);
  // Senza il testo dell'autore (guida scritta nell'altra lingua) restano i soli fatti, una novantina
  // di caratteri: troppo pochi per uno snippet. La coda dice che cosa si trova nella pagina.
  return text.length < 120 ? cleanDescription(`${text} ${dict.community.metaTail}`, max) : text;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const deck = await getCommunityDeck(slug);
  if (!deck) return {};
  // Copertina del mazzo: l'illustrazione della sua Leggendaria, senza che l'autore debba sceglierne una.
  const cover = deck.legendary ? getCard(deck.legendary)?.cover : undefined;
  const star = legendaryName(deck);
  // Le copertine in public/cards/cover sono 1200×675: lo dichiariamo perché l'anteprima social non venga ritagliata a caso.
  const art: PageMetaOptions = cover ? { imageSize: { width: 1200, height: 675 }, imageAlt: star ? `${star} · ${deck.name}` : deck.name } : {};
  return pageMeta(locale, `/decks/community/${deck.slug}`, pageTitleWith(deck.name, dict.community.kicker), deckDescription(deck, locale, dict), cover, art);
}

export default async function CommunityDeckPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const deck = await getCommunityDeck(slug);
  if (!deck) notFound();

  const legendary = deck.legendary ? getCard(deck.legendary) : undefined;
  const customLegendary = !legendary ? deck.custom_cards.find((x) => x.slug === deck.legendary) : undefined;
  const knownCards = deck.cards.filter((s) => getCard(s));
  const customCards = deck.cards.filter((s) => !getCard(s)).map((s) => deck.custom_cards.find((x) => x.slug === s)?.name ?? s);
  const yt = youtubeId(deck.video_url);
  const path = href(locale, `/decks/community/${deck.slug}`);
  const pageUrl = `${siteUrl}${path}`;
  const author = authorName(deck.profile);
  /** versione del gioco in vigore quando il mazzo è stato creato (dal calendario delle patch, non dichiarata) */
  const deckPatch = patchAt(deck.created_at);
  const handle = authorHandle(deck.profile);
  const others = (await listPublishedDecks(40)).filter((x) => x.slug !== deck.slug).slice(0, 8);
  // Il builder si apre già caricato dal link (`#OM1.…`, formato interno che l'utente non vede più): se il codice
  // salvato manca lo si ricava dal mazzo, così il tasto c'è sempre.
  const builderHref = `${href(locale, "/deck-builder")}#${deck.code_om ?? encodeOmCode({ name: deck.name, legendary: deck.legendary, cards: deck.cards, customCards: deck.custom_cards })}`;
  // Codice del gioco (KGBLDC…), l'unico da copiare (note del 22/09/2026): null se una carta non ha l'ID ufficiale.
  const gameCode = await deckGameCode(deck);
  const sections = guideSections.filter((k) => deck.guide[k]);
  // Guide editoriali che trattano questo mazzo (tags.communityDecks in src/lib/content/guides.ts)
  const guides = getGuides(locale).filter((g) => g.tags?.communityDecks?.some((x) => x.slug === deck.slug));

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: deck.name,
    description: deckDescription(deck, locale, d, 200),
    // Lingua del documento, non del testo dell'autore: la pagina /en resta una pagina inglese.
    inLanguage: locale,
    datePublished: deck.created_at,
    dateModified: deck.updated_at,
    // `image` è obbligatoria per i rich result: la copertina della Leggendaria, altrimenti l'immagine social del sito.
    image: legendary?.cover ? `${siteUrl}${legendary.cover}` : `${siteUrl}${defaultOgImage}`,
    author: { "@type": "Person", name: author },
    publisher: { "@id": organizationId },
    mainEntityOfPage: pageUrl,
    // Rimando all'entità unica del gioco, che il layout radice emette su ogni pagina: una copia
    // in linea creerebbe un secondo "Origins TCG" e dividerebbe il segnale fra due entità.
    about: { "@id": videoGameId },
  };
  // Sotto i 3 voti la media non dice niente (un 5/5 su un voto solo) e Google non genera comunque lo snippet per un Article.
  if ((deck.rating?.votes ?? 0) >= 3) article.aggregateRating = { "@type": "AggregateRating", ratingValue: deck.rating?.avg, ratingCount: deck.rating?.votes, bestRating: 5, worstRating: 1 };
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[article, breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.decks.title, path: href(locale, "/decks") }, { name: deck.name, path }])]}
      />
      <p className="text-sm">
        <Link href={href(locale, "/decks")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.decks.title}
        </Link>
      </p>

      {/* Subito dopo la pubblicazione (?new=1, solo per il proprietario): link da copiare e tasto Discord */}
      <NewDeckBanner
        ownerId={deck.owner}
        url={pageUrl}
        discordHref={officialLinks.discord}
        labels={{ title: c.newDeckTitle, text: c.newDeckText, copyLink: c.copyLink, copied: c.copied, discord: d.common.discord, close: c.newDeckClose }}
      />

      <article className="card-night mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          {legendary ? (
            <Link href={href(locale, `/cards/${legendary.slug}`)} className="shrink-0" title={legendary.name}>
              <CardArt card={legendary} full className="!h-[168px] !w-[120px] text-2xl" />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1 basis-64">
            {/* Quando è nato il mazzo e con quale versione del gioco (Pierluigi, 23/09/2026): la versione non la
                dichiara l'autore, si ricava dalla data con `patchAt`, cioè dal calendario delle patch ufficiali.
                L'aggiornamento resta accanto, perché un mazzo ritoccato dopo una patch non è più quello di prima. */}
            <p className="kicker text-mint">
              {c.kicker} · {d.common.createdOn} {formatDate(locale, deck.created_at.slice(0, 10))}
              {deckPatch ? ` · ${d.common.patch} ${patchLabel(deckPatch, locale)}` : ""}
              {deck.updated_at.slice(0, 10) !== deck.created_at.slice(0, 10) ? ` · ${d.common.updated} ${formatDate(locale, deck.updated_at.slice(0, 10))}` : ""}
            </p>
            <h1 className="t-page mt-2 leading-tight">{deck.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-pale-muted">
              <Avatar profile={deck.profile} name={author} size={32} />
              <span>
                {c.by}{" "}
                {/* il nome porta alla pagina pubblica dell'autore: i suoi mazzi e le sue tier list (23/09/2026) */}
                {deck.profile?.username ? (
                  <Link href={href(locale, `/u/${deck.profile.username}`)} className="font-bold text-pale hover:text-mint hover:underline">
                    {author}
                  </Link>
                ) : (
                  <strong className="text-pale">{author}</strong>
                )}
                {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {deck.profile?.badge && deck.profile.badge !== "community" ? (
            <span className={`${badgePill} ${badgeStyle[deck.profile.badge] ?? badgeStyle.community}`}>{c.badges[deck.profile.badge as keyof typeof c.badges] ?? deck.profile.badge}</span>
          ) : null}
          {/* pastiglie a fondo pieno con testo ink scuro (prima menta scuro con testo chiaro, 2,3:1) */}
          {deck.profile?.badge === "staff" ? null : <span className="stat-pill bg-mint text-[11px] font-semibold uppercase text-ink">{d.common.community}</span>}
          <span className="stat-pill bg-sky text-ink">
            {d.common.archetype}: {archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}
          </span>
          {deck.deck_types.map((t) => (
            <span key={t} className="stat-pill bg-night-3 text-pale">
              {c.deckTypes[t as keyof typeof c.deckTypes] ?? t}
            </span>
          ))}
          {/* Tag della Leggendaria: porta alla scheda della carta quando è nel nostro database */}
          {legendary ? (
            <Link href={href(locale, `/cards/${legendary.slug}`)} className="stat-pill bg-gold text-ink hover:underline">
              ★ {legendary.name}
            </Link>
          ) : customLegendary ? (
            <span className="stat-pill bg-gold text-ink">★ {customLegendary.name}</span>
          ) : null}
          <span className="stat-pill bg-night-3 text-pale font-mono">{deck.guide.lang.toUpperCase()}</span>
        </div>

        {/* Testi della guida: i nomi ufficiali delle carte diventano link con anteprima (CardMentions, richiesta di Davdas) */}
        {deck.guide.lang !== locale ? (
          /* la guida è nella lingua dell'autore: il sito non traduce i testi della community (nota per chi cambia lingua) */
          <p className="mt-6 rounded-lg border-2 border-gold bg-gold/10 p-3 text-xs text-pale">{c.guideLangNote.replace("{lang}", c.langNames[deck.guide.lang] ?? deck.guide.lang)}</p>
        ) : null}
        <div className="mt-6 rounded-xl border-2 border-sky bg-night-2/80 p-5">
          <p className="kicker text-mint">{c.summary}</p>
          <p className="mt-2 whitespace-pre-line text-lg text-pale">
            <CardMentions text={deck.guide.summary} locale={locale} dict={d} id="cm-summary" />
          </p>
        </div>

        <div className="mt-6">
          <StarRating
            deckId={deck.id}
            ownerId={deck.owner}
            avg={deck.rating?.avg ?? 0}
            votes={deck.rating?.votes ?? 0}
            path={path}
            loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
            labels={{
              rating: c.rating,
              votes: c.votes,
              vote: c.vote,
              noVotes: c.noVotes,
              yourVote: c.yourVote,
              rate: c.rate,
              loginToVote: c.loginToVote,
              ownDeck: c.ownDeck,
              voted: c.voted,
              voteError: c.voteError,
            }}
          />
        </div>

        <OwnerActions
          deckId={deck.id}
          ownerId={deck.owner}
          status={deck.status}
          locale={locale}
          editHref={`${path}/edit`}
          labels={{ edit: c.edit, hide: c.hide, unhide: c.unhide, delete: c.delete, confirmDelete: c.confirmDelete }}
        />

        {yt ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-sky bg-felt-deep" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${yt}`}
              title={deck.name}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : deck.video_url ? (
          <p className="mt-6">
            <a className="btn btn-ink text-xs" href={deck.video_url} rel="noopener nofollow" target="_blank">
              ▶ {d.common.video}
            </a>
          </p>
        ) : null}

        {/* Carte intere che si girano al passaggio del mouse, come nel database /cards (FlipCard, richiesta di
            Pierluigi del 22/09/2026): la Leggendaria per prima, poi le 12 carte per costo, con il mana sempre in vista. */}
        <h2 className="t-section mt-8">{d.common.legendary}</h2>
        {legendary ? (
          <div className="mt-3">
            <DeckCardGrid slugs={[legendary.slug]} locale={locale} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-pale">
            <span className="legendary-star" aria-hidden="true">
              ★
            </span>
            {customLegendary?.name ?? deck.legendary} *<span className="sr-only"> ({d.common.legendary})</span>
          </p>
        )}

        <h2 className="t-section mt-8">
          {d.builder.slots} <span className="font-mono text-sm font-normal text-pale-muted">{RULES.distinctCards} × {RULES.copiesPerCard}</span>
        </h2>
        {knownCards.length ? (
          <div className="mt-3">
            {/* niente "×2" sulle carte (riunione del 23/09/2026): in un mazzo le carte base sono sempre due */}
            <DeckCardGrid slugs={knownCards} locale={locale} />
          </div>
        ) : null}
        {customCards.length ? (
          <div className="mt-3">
            <p className="kicker text-pale-muted">{c.customCards}</p>
            <ul className="mt-1 flex flex-wrap gap-2 text-sm text-pale">
              {customCards.map((n) => (
                <li key={n} className="stat-pill border border-dashed border-sky">
                  {RULES.copiesPerCard}× {n} *
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DeckCharts stats={deckStats({ legendary: deck.legendary, cards: deck.cards }, locale)} labels={d.stats} />

        {/* Due tasti soli (note del 22/09/2026): il builder e il codice del gioco, quello che si incolla in Origins.
            Il codice OriginsMeta e "Copia link" non ci sono più. Senza gli ID ufficiali di tutte le carte, al posto
            del secondo tasto c'è una frase (un tasto disabilitato non riceve il focus e da tastiera non si trova). */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link href={builderHref} className="btn btn-ink text-xs">
            {c.openInBuilder}
          </Link>
          {gameCode.code ? (
            <CopyButton text={gameCode.code} label={c.copyGameCode} copied={c.copied} className="btn btn-ink text-xs" />
          ) : (
            <p className="text-xs text-pale-muted">{c.gameCodeMissing}</p>
          )}
        </div>

        {sections.length ? (
          <>
            <h2 className="t-section mt-10">{c.guide}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {sections.map((k) => (
                <section key={k} className={`rounded-lg border-2 p-4 ${sectionStyle[k]?.box ?? "border-sky bg-night-2/70"} ${k === "matchups" || k === "notes" ? "md:col-span-2" : ""}`}>
                  <h3 className={`kicker ${sectionStyle[k]?.title ?? "text-mint"}`}>{c[k]}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-pale">
                    <CardMentions text={deck.guide[k] ?? ""} locale={locale} dict={d} id={`cm-${k}`} />
                  </p>
                </section>
              ))}
            </div>
          </>
        ) : null}
        <CardMentionEdges />
      </article>

      {guides.length ? (
        <section className="mt-10">
          <h2 className="t-section">{d.common.relatedGuides}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover block p-5">
                  <p className="kicker text-pale-muted">{d.guides.categories[g.category]}</p>
                  <h3 className="t-item mt-1">{g.title}</h3>
                  <p className="mt-1 text-sm text-pale-muted">{g.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {others.length ? (
        <section className="mt-10">
          <h2 className="t-section">{c.others}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((x) => (
              <li key={x.slug}>
                <Link href={href(locale, `/decks/community/${x.slug}`)} className="btn btn-ghost text-xs">
                  {x.name}
                  <span className="font-mono font-normal text-chalk-muted">
                    {x.rating?.votes ? ` ★ ${x.rating.avg.toFixed(1)}` : ""} · {authorName(x.profile)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* La segnalazione resta, ma in fondo e in piccolo: non è un'azione da mettere accanto ai due tasti del mazzo */}
      <p className="mt-12 text-right text-xs text-pale-muted">
        <a className="underline underline-offset-2 hover:text-pale" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Report deck ${deck.slug}`)}&body=${encodeURIComponent(pageUrl)}`}>
          {c.report}
        </a>
      </p>
    </div>
  );
}
