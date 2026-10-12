import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { TIER_ORDER } from "@/lib/tierstats";
import { CARD_RANKED_MIN_VOTES, CARD_VOTES_MIN_VOTERS, SCORE_TIERS, fillVoteText, ratingOrder, votesStage, votesWord } from "@/lib/cardVotes";
import { cardVoteLabels } from "@/lib/cardVoteLabels";
import { loadTierData } from "@/lib/tierData";
import { tierExplorerLabels, tierSourceState } from "@/lib/tierLabels";
import { TierListHeader, TierSectionNotes, TierSourceLine } from "@/components/TierListHeader";
import { PageNotes } from "@/components/PageNotes";
import { TierExplorer } from "@/components/TierExplorer";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  Tier list dei voti alle carte (06/10/2026, richiesta di Pierluigi: "la possibilità per gli utenti di votare le carte
  da 1 (scarsa) a 10 (ottima) e sulla base delle votazioni si generasse una tierlist"). Ogni iscritto vota ogni carta
  da 1 a 10 (dalla scheda carta o dal dettaglio qui); la carta finisce nella fascia della sua media (soglie in
  src/lib/cardVotes.ts) da CARD_RANKED_MIN_VOTES voti in su, e la pagina si chiama "tier list dei voti" da
  CARD_VOTES_MIN_VOTERS votanti in su: sotto è un'anteprima dichiarata, come /tier-list/community sotto le 5 liste.
  È una fonte diversa dalla tier list della community (media delle liste intere salvate con lo strumento): qui ogni
  carta ha il suo punteggio. Legge Supabase (funzioni card_ratings e card_vote_totals): ISR come le altre pagine della
  sezione, e la Server Action voteCard la rigenera dopo ogni voto. Prima della migrazione (cardVotes null) dice che i
  voti non sono ancora attivi. I testi stanno in fondo (PageNotes, 29/09/2026), sotto la testata subito le fasce.
*/
export const revalidate = 300;

const loadData = cache(loadTierData);

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const p = cardVoteLabels[locale].page;
  const data = await loadData(locale);
  const stage = data.cardVotes ? votesStage(data.cardVotes.totals.voters, data.cardVotes.totals.votes) : "empty";
  // "anteprima" nel titolo solo con i voti attivi e sotto la soglia di votanti (come l'H1 della pagina)
  const preview = data.cardVotes !== null && stage !== "live";
  return pageMeta(locale, "/tier-list/votes", preview ? p.titlePreview : p.title, p.description);
}

export default async function CardVotesTierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.tier;
  const l = cardVoteLabels[locale];
  const p = l.page;
  const data = await loadData(locale);
  const votes = data.cardVotes;
  const totals = votes?.totals ?? { votes: 0, voters: 0, cards: 0 };
  const stage = votes ? votesStage(totals.voters, totals.votes) : "empty";
  const labels = tierExplorerLabels(d);
  const state = tierSourceState(d, {
    lists: Math.max(data.lists.legendaries, data.lists.cards),
    people: data.lists.people,
    decks: data.decks.length,
    cardVotes: votes ? totals.votes : null,
  });
  const path = href(locale, "/tier-list/votes");
  // le soglie nei testi con i decimali della lingua ("8,5" in italiano e spagnolo, "8.5" in inglese)
  const num = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  const thresholds = { min: CARD_RANKED_MIN_VOTES, tierS: num(SCORE_TIERS.S), tierA: num(SCORE_TIERS.A), tierB: num(SCORE_TIERS.B), tierC: num(SCORE_TIERS.C) };
  // "anteprima" solo con i voti attivi e sotto la soglia di votanti; prima della migrazione il titolo resta quello pieno
  const preview = votes !== null && stage !== "live";
  const kinds = [
    { id: "legendaries" as const, title: p.sections.legendaries.title, text: p.sections.legendaries.text, entries: data.cards.filter((x) => x.legendary) },
    { id: "cards" as const, title: p.sections.cards.title, text: p.sections.cards.text, entries: data.cards.filter((x) => !x.legendary) },
  ];
  // il widget nel dettaglio di ogni carta: testi, ritorno dall'accesso a questa pagina, soglia, stato della migrazione
  const explorerVotes = {
    labels: l.explorer,
    widget: l.widget,
    loginHref: `${href(locale, "/login")}?next=${encodeURIComponent(path)}`,
    minVotes: CARD_RANKED_MIN_VOTES,
  };
  // ItemList vera (come /tier-list/community) solo a regime: le carte in fascia, fascia per fascia, nell'ordine visibile
  const ranked = stage === "live" ? kinds.flatMap((k) => TIER_ORDER.flatMap((tier) => k.entries.filter((e) => e.rating?.tier === tier).sort(ratingOrder))) : [];
  const oneDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const listItems = ranked.length
    ? ranked.map((e) => ({ name: e.name, path: e.href, description: `${e.rating!.tier} · ${oneDecimal.format(e.rating!.avg)}/10 (${e.rating!.votes})` }))
    : kinds.map((k) => ({ name: k.title, path: `${path}#${k.id}` }));
  const sample = fillVoteText(p.sample, {
    votes: votesWord({ one: p.votesOne, many: p.votesMany }, totals.votes),
    cards: votesWord({ one: p.cardsOne, many: p.cardsMany }, totals.cards),
    voters: votesWord({ one: p.votersOne, many: p.votersMany }, totals.voters),
  });
  const updated = totals.latest ? formatDate(locale, totals.latest.slice(0, 10)) : undefined;
  const previewText = (s: string) => fillVoteText(s, { min: CARD_VOTES_MIN_VOTERS, n: totals.voters });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: t.title, path: href(locale, "/tier-list") },
            { name: p.h1, path },
          ]),
          collectionPage({ locale, path, name: preview ? p.titlePreview : p.title, description: p.description, items: listItems, about: videoGameId }),
        ]}
      />
      <CardMentionEdges />
      <TierListHeader
        locale={locale}
        dict={d}
        current="votes"
        title={preview ? p.h1Preview : p.h1}
        state={state}
        sections={votes ? kinds.map((k) => ({ id: k.id, label: k.title, count: k.entries.length })) : undefined}
      />

      {!votes ? (
        /* migrazione non ancora applicata (o community spenta): niente da votare, lo si dice */
        <p className="felt-panel-mint mt-8 max-w-3xl p-6 text-pale">{p.unavailable}</p>
      ) : (
        <>
          {stage === "empty" ? <p className="tier-ribbon mt-8">{p.empty}</p> : stage === "preview" ? <p className="tier-ribbon mt-8">{previewText(p.preview)}</p> : null}
          {kinds.map((k, i) => (
            <section key={k.id} id={k.id} className={`${i === 0 ? "mt-8" : "mt-10"} scroll-mt-32`} aria-labelledby={`${k.id}-title`}>
              <h2 id={`${k.id}-title`} className="t-section">
                {k.title}
              </h2>
              <div className="mt-4">
                <TierExplorer
                  locale={locale}
                  id={`votes-${k.id}`}
                  mode="tiers"
                  source="votes"
                  entries={k.entries}
                  deckCount={data.decks.length}
                  labels={labels}
                  filters={k.id === "cards"}
                  table={k.id === "cards"}
                  votes={explorerVotes}
                />
              </div>
            </section>
          ))}
        </>
      )}

      {/* I testi della pagina, dopo il contenuto (Pierluigi, 29/09/2026) */}
      <PageNotes>
        <p className="max-w-3xl text-chalk-muted">{fillVoteText(p.intro, thresholds)}</p>
        <TierSourceLine
          items={[
            { label: t.lineSource, text: p.sourceText },
            // il campione solo con i voti attivi: prima della migrazione "0 voti su 0 carte" non direbbe niente
            ...(votes ? [{ label: t.lineSample, text: `${sample}${updated ? `, ${fillVoteText(p.updatedText, { date: updated })}` : ""}` }] : []),
            ...(stage === "preview" ? [{ label: p.previewBadge, text: previewText(p.previewShort), warn: true }] : []),
          ]}
        />
        {votes ? <TierSectionNotes items={kinds.map((k) => ({ title: `${k.title} (${k.entries.length})`, text: k.text }))} /> : null}
        <p className="mt-3 max-w-3xl text-sm text-chalk-muted">{fillVoteText(p.rankedRule, thresholds)}</p>
        <details className="card-night mt-6 max-w-3xl p-5">
          <summary className="t-item cursor-pointer">{p.howTitle}</summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-pale">
            {p.how.map((step) => (
              <li key={step}>{fillVoteText(step, thresholds)}</li>
            ))}
          </ol>
        </details>
        <p className="mt-4 max-w-3xl text-sm text-chalk-muted">{p.disclaimer}</p>
        {/* Link nel testo verso la tier list principale (SEO) e verso la tier list della community, la fonte "cugina" */}
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-chalk-muted">
          <span>
            {t.mainText}{" "}
            <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
              {t.mainAnchor} →
            </Link>
          </span>
          <span>
            {p.communityText}{" "}
            <Link href={href(locale, "/tier-list/community")} className="link-mint font-bold">
              {p.communityAnchor} →
            </Link>
          </span>
        </p>
      </PageNotes>
    </div>
  );
}
