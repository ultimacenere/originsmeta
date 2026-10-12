import type { Metadata } from "next";
import Link from "next/link";
import { cache, type ReactNode } from "react";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard, getCardByKey, latestPatch, patchLabel } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { listPublishedDecks } from "@/lib/community/queries";
import { authorName } from "@/lib/community/util";
import { dropHreflang } from "@/lib/community/deckQuality";
import { readWinrate } from "@/lib/community/trackerStatsQueries";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { deckListKey, isEarly, percent } from "@/lib/tracker/stats";
import { TierSectionNotes, TierSourceLine } from "@/components/TierListHeader";
import { PageNotes } from "@/components/PageNotes";
import { CardName } from "@/components/CardChip";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  Analytics (12/10/2026, Pierluigi: "non si chiama più win rate ma si chiama analytics" e le statistiche "solo sotto
  Analytics"): la pagina delle statistiche, che fino al 12/10/2026 stava in /tier-list/win-rate (ora un 308 verso qui) come
  scheda della tier list; da qui fuori dalla tier list, con una testata sua. La pagina dell'app è /tracker.
  Storia. Win rate (30/09/2026; Pierluigi: i win rate di mazzi e carte "sono molto importanti e dobbiamo averli", poi "fai 1 e
  2"): una scheda della tier list. Tolta il 02/10/2026 (la patch 0.7 aveva tolto i replay: 308 verso /analytics) e
  riaperta il 10/10/2026, quando l'app ha ricominciato a leggere le carte giocate dallo schermo (Pierluigi: "la pagina
  del tracker e tutte le stat le avevamo nascoste, vanno riaperte"); in cima e in fondo il rimando a /analytics, la
  pagina dell'app con il download e la guida all'installazione. In prova dal 10/10/2026 (Pierluigi: "visibile solo ai
  creators e top players"): con ANALYTICS_PUBLIC spento solo Creator, Autore, Pro, Staff e admin con l'accesso fatto (gli altri
  ricevono un 404), sempre noindex e fuori da hreflang e sitemap; la sessione letta rende la pagina dinamica. Aperta a
  tutti il 12/10/2026 (ANALYTICS_PUBLIC acceso): statica e ISR. I numeri vengono dalle partite registrate con l'app e li
  calcola il database (funzioni tracker_stats_* del blocco TRACKER di supabase/schema.sql): solo totali anonimi di una
  patch, ogni numero mostrato appena supera la soglia di stats.ts; sotto le 100 partite la pagina è noindex (dal 12/10/2026 nessuna
  etichetta "prime stime", Pierluigi: "nessuna prima stima"). Dal
  12/10/2026 (Pierluigi: "statistica libera e rimuovi gli allert gialli e soprattutto il numero di giocatori che hanno
  contribuito o hanno fatto cose, è un dato privato e non deve interessare a nessuno") niente riquadri gialli e mai il
  numero di giocatori, solo le partite. Patch in corso, oppure la precedente finché quella in corso non ha numeri (e lo
  dice, in una riga grigia).
  Noindex (e fuori da sitemap e hreflang) finché la patch mostrata ha meno di 100 partite: una pagina quasi vuota non si
  indicizza. Prima della migrazione, e finché nessun numero supera la soglia, la pagina spiega da dove arriveranno.
  Legge Supabase: ISR (revalidate 300).
*/
export const revalidate = 300;

const loadWinrate = cache(readWinrate);

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const w = dict.tier.winrate;
  const read = await loadWinrate();
  const indexable = ANALYTICS_PUBLIC && read.status === "ok" && !isEarly(read.data.overview.games);
  const meta = pageMeta(locale, "/analytics", w.title, w.description, undefined, { noindex: !indexable });
  return indexable ? meta : dropHreflang(meta);
}

/**
 * Una riga con la barra: nome, riga sotto con partite e vittorie, valore a destra. I pezzi della riga sotto non si
 * spezzano al loro interno ("12–10", "34 partite"): vanno a capo solo fra un pezzo e l'altro.
 */
function RateRow({
  label,
  sub,
  value,
  note,
  bar,
}: {
  label: ReactNode;
  sub: string[];
  value: string;
  /** che cosa misura il valore, sotto di lui (per le quote, che non sono win rate) */
  note?: string;
  bar: number;
}) {
  return (
    <li className="tier-arch">
      <span className="min-w-0">
        <span className="block font-bold text-chalk">{label}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-chalk-muted">
          {sub.map((part, i) => (
            <span key={i} className="whitespace-nowrap">
              {i > 0 ? <span aria-hidden="true">· </span> : null}
              {part}
            </span>
          ))}
        </span>
      </span>
      <span className="tier-usage-bar" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, bar))}%` }} />
      </span>
      <span className="tier-usage-val">
        {value}
        {note ? <span className="block text-[11px] font-normal text-chalk-muted">{note}</span> : null}
      </span>
    </li>
  );
}

/** Nome di una carta dalla chiave del gioco, con la stella delle Leggendarie e il link alla scheda. */
function KeyCard({ cardKey, locale, legendaryLabel }: { cardKey: string; locale: Locale; legendaryLabel: string }) {
  const card = getCardByKey(cardKey);
  if (!card) return <span>{cardKey}</span>;
  return (
    <Link href={href(locale, `/cards/${card.slug}`)} prefetch={false} className="hover:text-sky hover:underline">
      <CardName name={card.name} legendary={card.legendary} legendaryLabel={legendaryLabel} />
    </Link>
  );
}

export default async function AnalyticsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const t = d.tier;
  const w = t.winrate;
  const [read, published] = await Promise.all([loadWinrate(), listPublishedDecks()]);
  const appHref = href(locale, "/tracker");
  const data = read.status === "ok" ? read.data : null;

  const nf = (n: number) => n.toLocaleString(locale === "en" ? "en-GB" : locale);
  const pct = (wins: number, games: number) => `${percent(wins, games) ?? 0}%`;
  // singolare per 1 (con la soglia di prova del 01/10/2026 i numeri partono da una partita di un giocatore)
  const games = (n: number) => (n === 1 ? w.gamesOne : w.games.replace("{n}", nf(n)));
  const wl = (wins: number, all: number) => `${wins}–${all - wins}`;
  const legendaryLabel = d.common.legendary;
  const patchName = (id: typeof latestPatch) => patchLabel(id, locale);

  // mazzi della community la cui lista esatta (13 carte) ha un win rate sopra la soglia
  const listStats = new Map((data?.lists ?? []).map((l) => [l.list, l]));
  const decks = published
    .flatMap((deck) => {
      const stat = listStats.get(deckListKey({ legendary: deck.legendary, cards: deck.cards }, (slug) => getCard(slug)?.key) ?? "");
      return stat ? [{ deck, stat }] : [];
    })
    .sort((a, b) => b.stat.games - a.stat.games || (percent(b.stat.wins, b.stat.games) ?? 0) - (percent(a.stat.wins, a.stat.games) ?? 0));
  const byRate = <T extends { wins: number; games: number }>(a: T, b: T) => b.wins / b.games - a.wins / a.games || b.games - a.games;
  const legendaries = [...(data?.legendaries ?? [])].sort(byRate);
  const archetypes = [...(data?.archetypes ?? [])].sort(byRate);
  const cards = [...(data?.cards ?? [])].sort((a, b) => (b.deck?.games ?? 0) - (a.deck?.games ?? 0) || (b.played?.games ?? 0) - (a.played?.games ?? 0));
  const matchups = data?.matchups ?? [];
  const opponents = data?.opponents ?? [];
  const withOpponent = data?.overview.withOpponent ?? null;

  const sections = [
    { id: "legendaries", label: w.sections.legendaries.title, count: legendaries.length },
    { id: "decks", label: w.sections.decks.title, count: decks.length },
    { id: "archetypes", label: w.sections.archetypes.title, count: archetypes.length },
    { id: "cards", label: w.sections.cards.title, count: cards.length },
    { id: "matchups", label: w.sections.matchups.title, count: matchups.length },
    { id: "opponents", label: w.sections.opponents.title, count: opponents.length },
  ];
  const none = <p className="mt-3 text-sm text-pale-muted">{w.noneYet}</p>;
  const th = "kicker px-3 py-2 text-left text-chalk-muted";
  const td = "border-t border-night-3 px-3 py-2 align-middle";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: w.h1, path: href(locale, "/analytics") },
          ]),
        ]}
      />
      {/* testata propria dal 12/10/2026 (la pagina non è più una scheda della tier list), con l'indice delle sezioni */}
      <header>
        <p className="kicker text-mint">{d.nav.analytics}</p>
        <h1 className="t-page mt-2">{w.h1}</h1>
      </header>
      {data ? (
        <nav aria-label={t.onThisPage} className="tier-onpage">
          <span className="tier-onpage-label">{t.onThisPage}</span>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
              <span className="tier-onpage-count">{s.count}</span>
            </a>
          ))}
        </nav>
      ) : null}

      {/* Da dove arrivano i numeri, subito sotto la testata: l'app che li registra, da scaricare (10/10/2026); dal 12/10/2026
          il tasto porta a /tracker, la pagina dell'app (anche chi arriva da un vecchio link /analytics#install lo trova qui) */}
      <p className="mt-6 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-sky bg-night-2/80 p-3 text-sm text-pale">
        <span className="min-w-0 flex-1 basis-60">{w.app.text}</span>
        <Link href={appHref} prefetch={false} className="btn btn-primary text-xs">
          {w.app.cta} →
        </Link>
      </p>

      {!data ? (
        <div className="felt-panel-mint mt-8 max-w-3xl p-6">
          <p className="text-pale">{w.empty}</p>
        </div>
      ) : (
        <>
          {/* il ripiego sulla patch precedente si dice, ma in una riga grigia, non in un riquadro giallo (12/10/2026) */}
          {data.fallback ? (
            <p className="mt-4 max-w-3xl text-sm text-pale-muted">
              {w.fallback.replace("{current}", patchName(latestPatch)).replace("{patch}", patchName(data.patch))}
            </p>
          ) : null}

          <section id="legendaries" className="mt-8 scroll-mt-32" aria-labelledby="wr-legendaries">
            <h2 id="wr-legendaries" className="t-section">
              {w.sections.legendaries.title}
            </h2>
            {legendaries.length ? (
              <ol className="mt-4 grid gap-1.5">
                {legendaries.map((s) => (
                  <RateRow
                    key={s.legendary}
                    label={<KeyCard cardKey={s.legendary} locale={locale} legendaryLabel={legendaryLabel} />}
                    sub={[games(s.games), wl(s.wins, s.games)]}
                    value={pct(s.wins, s.games)}
                    bar={percent(s.wins, s.games) ?? 0}
                  />
                ))}
              </ol>
            ) : (
              none
            )}
          </section>

          <section id="decks" className="mt-12 scroll-mt-32" aria-labelledby="wr-decks">
            <h2 id="wr-decks" className="t-section">
              {w.sections.decks.title}
            </h2>
            {decks.length ? (
              <ol className="mt-4 grid gap-1.5">
                {decks.map(({ deck, stat }) => {
                  const leg = deck.legendary ? getCard(deck.legendary) : undefined;
                  return (
                    <RateRow
                      key={deck.slug}
                      label={
                        <Link href={href(locale, `/decks/community/${deck.slug}`)} prefetch={false} className="hover:text-sky hover:underline">
                          {deck.name}
                        </Link>
                      }
                      sub={[...(leg ? [`★ ${leg.name}`] : []), authorName(deck.profile), games(stat.games), wl(stat.wins, stat.games)]}
                      value={pct(stat.wins, stat.games)}
                      bar={percent(stat.wins, stat.games) ?? 0}
                    />
                  );
                })}
              </ol>
            ) : (
              none
            )}
          </section>

          <section id="archetypes" className="mt-12 scroll-mt-32" aria-labelledby="wr-archetypes">
            <h2 id="wr-archetypes" className="t-section">
              {w.sections.archetypes.title}
            </h2>
            {archetypes.length ? (
              <ol className="mt-4 grid gap-1.5">
                {archetypes.map((s) => (
                  <RateRow
                    key={s.archetype}
                    label={archetypeLabels[s.archetype]?.[locale] ?? s.archetype}
                    sub={[games(s.games), wl(s.wins, s.games)]}
                    value={pct(s.wins, s.games)}
                    bar={percent(s.wins, s.games) ?? 0}
                  />
                ))}
              </ol>
            ) : (
              none
            )}
          </section>

          <section id="cards" className="mt-12 scroll-mt-32" aria-labelledby="wr-cards">
            <h2 id="wr-cards" className="t-section">
              {w.sections.cards.title}
            </h2>
            {cards.length ? (
              <div className="card-night mt-4 overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={th}>
                        {w.cols.card}
                      </th>
                      <th scope="col" className={`${th} text-right`}>
                        {w.cols.inDeck}
                      </th>
                      <th scope="col" className={`${th} text-right`}>
                        {w.cols.played}
                      </th>
                      <th scope="col" className={`${th} text-right`}>
                        {w.cols.avgRound}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((s) => (
                      <tr key={s.card}>
                        <td className={`${td} font-semibold text-pale`}>
                          <KeyCard cardKey={s.card} locale={locale} legendaryLabel={legendaryLabel} />
                        </td>
                        <td className={`${td} whitespace-nowrap text-right font-mono`}>
                          {s.deck ? (
                            <>
                              <b className="text-chalk">{pct(s.deck.wins, s.deck.games)}</b> <span className="text-xs text-pale-muted">{games(s.deck.games)}</span>
                            </>
                          ) : (
                            <span className="text-pale-muted">—</span>
                          )}
                        </td>
                        <td className={`${td} whitespace-nowrap text-right font-mono`}>
                          {s.played ? (
                            <>
                              <b className="text-chalk">{pct(s.played.wins, s.played.games)}</b> <span className="text-xs text-pale-muted">{games(s.played.games)}</span>
                            </>
                          ) : (
                            <span className="text-pale-muted">—</span>
                          )}
                        </td>
                        <td className={`${td} text-right font-mono`}>{s.played?.avgTurn != null ? s.played.avgTurn.toLocaleString(locale === "en" ? "en-GB" : locale, { maximumFractionDigits: 1 }) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              none
            )}
          </section>

          <section id="matchups" className="mt-12 scroll-mt-32" aria-labelledby="wr-matchups">
            <h2 id="wr-matchups" className="t-section">
              {w.sections.matchups.title}
            </h2>
            {matchups.length ? (
              <ol className="mt-4 grid gap-1.5">
                {matchups.map((s) => (
                  <RateRow
                    key={`${s.legendary}|${s.opponent}`}
                    label={
                      <>
                        <KeyCard cardKey={s.legendary} locale={locale} legendaryLabel={legendaryLabel} /> <span className="font-normal text-pale-muted">{w.vs}</span>{" "}
                        <KeyCard cardKey={s.opponent} locale={locale} legendaryLabel={legendaryLabel} />
                      </>
                    }
                    sub={[games(s.games), wl(s.wins, s.games)]}
                    value={pct(s.wins, s.games)}
                    bar={percent(s.wins, s.games) ?? 0}
                  />
                ))}
              </ol>
            ) : (
              none
            )}
          </section>

          <section id="opponents" className="mt-12 scroll-mt-32" aria-labelledby="wr-opponents">
            <h2 id="wr-opponents" className="t-section">
              {w.sections.opponents.title}
            </h2>
            {opponents.length && withOpponent ? (
              <ol className="mt-4 grid gap-1.5">
                {opponents.map((s) => {
                  const share = Math.round((s.games / withOpponent) * 100);
                  return (
                    <RateRow
                      key={s.opponent}
                      label={<KeyCard cardKey={s.opponent} locale={locale} legendaryLabel={legendaryLabel} />}
                      sub={[games(s.games), w.winsAgainst.replace("{p}", pct(s.wins, s.games))]}
                      value={`${share}%`}
                      note={w.shareNote}
                      bar={share}
                    />
                  );
                })}
              </ol>
            ) : (
              none
            )}
          </section>
        </>
      )}

      {/* I testi della pagina, dopo il contenuto (come le altre pagine della tier list, 29/09/2026) */}
      <PageNotes>
        <p className="max-w-3xl text-chalk-muted">{w.intro}</p>
        <TierSourceLine
          items={[
            { label: t.lineSource, text: w.sourceText.replace("{patch}", patchName(data?.patch ?? latestPatch)) },
            ...(data ? [{ label: t.lineSample, text: games(data.overview.games) }] : []),
            { label: t.lineMeasure, text: w.measureText },
          ]}
        />
        <TierSectionNotes items={[w.sections.legendaries, w.sections.decks, w.sections.archetypes, w.sections.cards, w.sections.matchups, w.sections.opponents]} />
        <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5 text-sm text-chalk-muted">
          {w.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-chalk-muted">
          <span>
            {t.mainText}{" "}
            <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
              {t.mainAnchor} →
            </Link>
          </span>
          <span>
            {t.decksText}{" "}
            <Link href={href(locale, "/decks")} className="link-mint font-bold">
              {t.decksAnchor} →
            </Link>
          </span>
          <span>
            {w.app.notesText}{" "}
            <Link href={appHref} className="link-mint font-bold">
              {w.app.notesAnchor} →
            </Link>
          </span>
        </p>
      </PageNotes>
    </div>
  );
}
