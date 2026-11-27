import Link from "next/link";
import type { CSSProperties } from "react";
import { formatDate, getDictionary, href, type Locale } from "@/lib/i18n";
import type { ProtoData } from "@/lib/profileProto/load";
import { getCard, patchLabel, type Card } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getProfileByUsername } from "@/lib/community/queries";
import { twitchLogin } from "@/lib/community/profileLinks";
import { ACCENT_HEX } from "@/lib/community/showcase";
import { creatorLabels } from "@/lib/creatorLabels";
import { deckGameCode } from "@/lib/deckGameCode";
import { axisFor, fmtInt, pct } from "@/lib/tracker/snapshot";
import { Avatar } from "@/components/AccountMenu";
import { FollowButton } from "@/components/follow/FollowButton";
import { LiveBadge } from "@/components/LiveBadge";
import { ChannelLinks } from "@/components/ChannelLinks";
import { GameCard } from "@/components/GameCard";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { CardArt, Interval, Star } from "@/components/analytics/parts";
import { OndaStandings, type StandRow } from "./OndaStandings";
import { MASTERY_STEPS, exampleLegendaries, inForm, mostUsedLegendary, playedDecks, scoreOf, vsMeta } from "./data";
import "./onda.css";

/*
  Prototipo 2 «In onda» (27/11/2026): il profilo di un giocatore come la grafica di un torneo in diretta, con il
  linguaggio di /analytics («Meta Snapshot v2.0»): sottopancia, scoreboard, classifica dei suoi mazzi nel ladder,
  le sue Leggendarie contro il meta. Dati veri di ProtoData; l'unica fascia di esempio (le partite personali) lo dice.
*/

const games = (n: number, locale: Locale) => (n === 1 ? "1 partita" : `${fmtInt(n, locale)} partite`);
/** il nome corto dell'archetipo ("Swarm", "Midrange"): la parte prima della barra */
const arch = (id: string, locale: Locale) => (archetypeLabels[id]?.[locale] ?? archetypeLabels[id]?.en ?? id).split(" / ")[0];

function SecHead({ num, id, title, meta }: { num: number; id: string; title: string; meta?: string }) {
  return (
    <div className="an-sec-head">
      <span className="an-sec-num" aria-hidden="true">
        {String(num).padStart(2, "0")}
      </span>
      <h2 id={id} className="an-h2 onda-h2">
        {title}
      </h2>
      {meta ? <span className="an-sec-meta">{meta}</span> : null}
    </div>
  );
}

export async function OndaView({ data, locale }: { data: ProtoData; locale: Locale }) {
  const d = getDictionary(locale).community;
  const profile = await getProfileByUsername(data.username);
  const accent = data.vetrina?.accent ? ACCENT_HEX[data.vetrina.accent] : null;
  const live = data.showcase && data.channels !== null && twitchLogin(data.channels.links) !== null;

  // la carta della testata: la Leggendaria del cuore della vetrina, altrimenti quella che usa di più
  const heart = data.vetrina?.favoriteLegendary ? (getCard(data.vetrina.favoriteLegendary) ?? null) : null;
  const heroCard: Card | null = heart ?? mostUsedLegendary(data.decks);
  const heroCaption = heart ? "La Leggendaria del cuore" : "La Leggendaria che usa di più";

  const score = scoreOf(data);
  const patch = data.meta ? patchLabel(data.meta.patch, locale) : null;
  const played = playedDecks(data.decks);
  const idle = data.decks.filter((x) => !x.winrate || x.winrate.games <= 0);
  const codes = await Promise.all(played.map((x) => deckGameCode({ legendary: x.legendary?.slug ?? null, cards: x.cards.map((c) => c.slug) })));
  const rows: StandRow[] = played.map((x, i) => ({
    id: x.id,
    name: x.name,
    href: href(locale, `/decks/community/${x.slug}`),
    legendary: x.legendary ? { name: x.legendary.name, src: x.legendary.thumb ?? x.legendary.image ?? null } : null,
    archetype: { id: x.archetype, label: arch(x.archetype, locale) },
    games: x.wr.games,
    lo: x.wr.lo,
    hi: x.wr.hi,
    r: x.wr.r,
    wrText: pct(x.wr.r, locale),
    loText: pct(x.wr.lo, locale),
    gamesText: games(x.wr.games, locale),
    votes: x.rating?.votes ?? 0,
    avgText: x.rating?.votes ? x.rating.avg.toLocaleString(locale, { maximumFractionDigits: 2 }) : null,
    inForm: inForm(x.wr),
    code: codes[i]?.code ?? null,
    cards: x.cards.map((c) => ({ slug: c.slug, name: c.name, src: c.thumb ?? c.image ?? null, href: href(locale, `/cards/${c.slug}`) })),
    patchText: x.patch ? patchLabel(x.patch, locale) : null,
  }));
  const axis = axisFor(played.flatMap((x) => [x.wr.lo, x.wr.hi]));
  const anyForm = rows.some((r) => r.inForm);

  const vs = vsMeta(data);
  const vsAxis = axisFor(vs.flatMap((v) => [v.mine.lo, v.mine.hi, v.meta.lo, v.meta.hi]));
  const example = exampleLegendaries(data);
  const exGames = example.reduce((s, x) => s + x.games, 0);
  const exWins = example.reduce((s, x) => s + x.wins, 0);

  type Cell = { key: string; label: string; value: string; unit?: string; sub?: string };
  const cells: Cell[] = [];
  if (score.decks > 0) cells.push({ key: "decks", label: "Mazzi pubblicati", value: fmtInt(score.decks, locale) });
  if (score.games > 0) cells.push({ key: "games", label: "Partite con le sue liste", value: fmtInt(score.games, locale) });
  if (score.wr) cells.push({ key: "wr", label: "Win rate", value: pct(score.wr.r, locale), sub: `prudente ${pct(score.wr.lo, locale)}` });
  if (score.votes > 0) cells.push({ key: "votes", label: "Voti ricevuti", value: fmtInt(score.votes, locale) });
  if (data.publicStats?.views) cells.push({ key: "views", label: "Visite ai mazzi", value: fmtInt(data.publicStats.views, locale), sub: "stime" });
  if (data.publicStats?.codeCopies) cells.push({ key: "copies", label: "Codici copiati", value: fmtInt(data.publicStats.codeCopies, locale), sub: "stime" });

  const memberSince = data.createdAt ? `Iscritto dal ${formatDate(locale, data.createdAt.slice(0, 10))}` : null;
  const blurb = data.vetrina?.tagline ?? data.channels?.bio ?? null;
  let sec = 0;

  return (
    <div className="an-page onda" style={accent ? ({ "--onda-accent": accent } as CSSProperties) : undefined}>
      {/* ---------- 1. sottopancia e scoreboard ---------- */}
      <section className="an-band an-band--stage is-top onda-hero" aria-labelledby="onda-name">
        <div className="an-wrap">
          <div className="onda-hero-grid">
            <div className="onda-hero-main">
              <div className="onda-lt">
                <span className="onda-lt-photo">
                  <Avatar profile={profile ? { ...profile, avatar_path: data.vetrina?.avatarPath ?? null } : null} name={data.name} size={84} />
                </span>
                <div className="onda-lt-text">
                  <h1 id="onda-name" className="onda-lt-name">
                    {data.name}
                  </h1>
                  <p className="onda-lt-strip">
                    <span>@{data.username}</span>
                    {memberSince ? <span>{memberSince}</span> : null}
                  </p>
                </div>
              </div>
              {blurb ? <p className="onda-blurb">{blurb}</p> : null}
              <div className="onda-hero-tags">
                {data.badge !== "community" ? <span className={`${badgePill} ${badgeStyle[data.badge]}`}>{d.badges[data.badge]}</span> : null}
                {live ? <LiveBadge username={data.username} labels={creatorLabels[locale].live} placement="profile" size="lg" /> : null}
                {data.showcase && profile ? <FollowButton profileId={profile.id} name={data.name} badge={profile.badge} locale={locale} placement="profile" /> : null}
              </div>
              {data.channels?.links.length ? (
                <ChannelLinks links={data.channels.links} labels={creatorLabels[locale].channels} ownerName={data.name} placement="profile" me className="mt-4" />
              ) : null}
            </div>
            {heroCard ? (
              <figure className="onda-heart">
                <Link href={href(locale, `/cards/${heroCard.slug}`)} prefetch={false} aria-label={`${heroCaption}: ${heroCard.name}`}>
                  <GameCard card={heroCard} locale={locale} className="onda-heart-card" priority />
                </Link>
                <figcaption className="pen-note is-quiet">{heroCaption}</figcaption>
              </figure>
            ) : null}
          </div>

          {cells.length > 1 ? (
            <div className="an-panel an-snapshot onda-score">
              {patch && score.games > 0 ? (
                <div className="an-snap-top">
                  <span className="an-snap-patch">Patch {patch}</span>
                  <span className="onda-score-src">OriginsMeta Tracker</span>
                </div>
              ) : null}
              <div className="an-snap-grid">
                {cells.map((c, i) => (
                  <div key={c.key} className={`an-cell-slot${cells.length % 2 === 1 && i === cells.length - 1 ? " is-full" : ""}`}>
                    <div className="an-cell">
                      <span className="an-cell-label onda-cell-label">{c.label}</span>
                      <span className="an-cell-value">{c.value}</span>
                      {c.sub ? <span className="an-cell-sub">{c.sub}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {score.games > 0 && patch ? (
            <p className="an-quiet onda-note">
              Partite giocate da chi usa le sue liste esatte, patch {patch}. Prudente: il caso peggiore, con l&apos;intervallo al 95%.
            </p>
          ) : null}
          {data.decks.length === 0 ? <p className="onda-empty">Nessun mazzo in campo per ora.</p> : null}
        </div>
      </section>

      {/* ---------- 2. i suoi mazzi in campo ---------- */}
      {data.decks.length > 0 ? (
        <section className="an-band an-band--deep" aria-labelledby="onda-decks">
          <div className="an-wrap">
            <SecHead num={++sec} id="onda-decks" title="I suoi mazzi in campo" meta={patch && rows.length ? `Patch ${patch}` : undefined} />
            {rows.length ? (
              <div className="mt-6">
                <OndaStandings rows={rows} axis={axis} />
                {anyForm ? <p className="an-hint">Provvisorio: «In forma» quando anche il win rate prudente supera il 50%.</p> : null}
              </div>
            ) : null}
            {idle.length ? (
              <div className="onda-idle">
                <p className="onda-idle-label">{rows.length ? "Ancora nessuna partita registrata:" : "Ancora nessuna partita registrata con queste liste:"}</p>
                <ul className="onda-idle-list">
                  {idle.map((x) => (
                    <li key={x.id}>
                      <Link href={href(locale, `/decks/community/${x.slug}`)} prefetch={false} className="onda-idle-link">
                        <ArchetypeIcon id={x.archetype} size="xs" />
                        <span>{x.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ---------- 3. contro il meta ---------- */}
      {vs.length && patch ? (
        <section className="an-band an-band--felt" aria-labelledby="onda-vs">
          <div className="an-wrap">
            <SecHead num={++sec} id="onda-vs" title="Contro il meta" meta={`Patch ${patch}`} />
            <ul className="onda-vs">
              {vs.map((v) => {
                const name = v.card.name;
                const line =
                  v.verdict === "thin"
                    ? "Ancora poche partite."
                    : v.verdict === "better"
                      ? `Le sue liste di ${name} vanno meglio della media.`
                      : v.verdict === "worse"
                        ? `Le sue liste di ${name} restano sotto la media.`
                        : `Le sue liste di ${name} sono in linea con la media.`;
                return (
                  <li key={v.card.slug} className="onda-vs-row">
                    <Link href={href(locale, `/cards/${v.card.slug}`)} prefetch={false} className="onda-vs-card" aria-label={name}>
                      <CardArt src={v.card.image} thumb={v.card.thumb} name={name} width={64} />
                    </Link>
                    <div className="onda-vs-body">
                      <h3 className="an-h3">
                        <Star label="Leggendaria" />
                        {name}
                      </h3>
                      <div className="onda-vs-bars">
                        <span className="onda-vs-lbl">Le sue liste</span>
                        <Interval lo={v.mine.lo} hi={v.mine.hi} r={v.mine.r} axis={vsAxis} label={`Le sue liste: ${pct(v.mine.r, locale)} su ${games(v.mine.games, locale)}`} />
                        <span className="onda-vs-num">
                          <b>{pct(v.mine.r, locale)}</b> {games(v.mine.games, locale)}
                        </span>
                        <span className="onda-vs-lbl">Meta</span>
                        <Interval lo={v.meta.lo} hi={v.meta.hi} r={v.meta.r} axis={vsAxis} label={`Meta della patch: ${pct(v.meta.r, locale)} su ${games(v.meta.games, locale)}`} />
                        <span className="onda-vs-num">
                          <b>{pct(v.meta.r, locale)}</b> {games(v.meta.games, locale)}
                        </span>
                      </div>
                      <p className="onda-vs-line">
                        {v.thin ? null : (
                          <span className={`onda-vs-diff is-${v.diff > 0 ? "up" : v.diff < 0 ? "down" : "even"}`}>
                            {v.diff > 0 ? "+" : v.diff < 0 ? "−" : ""}
                            {Math.abs(v.diff).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pt
                          </span>
                        )}
                        {line}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="an-hint">
              Provvisorio: le sue liste contano il lato di chi le gioca con il Tracker, il meta conta tutti e due i lati. Sotto 20 partite niente verdetto.
            </p>
          </div>
        </section>
      ) : null}

      {/* ---------- 4. le tue partite: esempio ---------- */}
      {example.length ? (
        <section className="an-band an-band--deep" aria-labelledby="onda-mine">
          <div className="an-wrap">
            <SecHead num={++sec} id="onda-mine" title="Le tue partite (esempio)" />
            <div className="onda-ex">
              <p className="onda-ex-warn">
                <span className="an-plate">
                  <span>Esempio</span>
                </span>
                Esempio: oggi le partite del Tracker non sono pubbliche. Si vedrebbero solo se le accendi tu.
              </p>
              <div className="onda-ex-top">
                <span>
                  <b>{exGames}</b> partite della patch
                </span>
                <span>
                  <b>{exWins}</b> vinte
                </span>
              </div>
              <ol className="onda-ex-list">
                {example.map((x) => (
                  <li key={x.card.slug} className="onda-ex-row">
                    <CardArt src={x.card.image} thumb={x.card.thumb} name={x.card.name} width={52} />
                    <div className="min-w-0">
                      <p className="onda-ex-name">
                        <Star label="Leggendaria" />
                        {x.card.name}
                      </p>
                      <p className="onda-ex-sub">
                        {games(x.games, locale)} · {x.wins} vinte
                      </p>
                    </div>
                    <div className="onda-mastery" role="img" aria-label={`Maestria ${x.level} su 7`}>
                      <span className="onda-mastery-lvl">
                        <span className="pen-num">{x.level}</span>
                        <span>/7</span>
                      </span>
                      <span className="onda-pips" aria-hidden="true">
                        {MASTERY_STEPS.map((s, i) => (
                          <i key={s} className={i < x.level ? "is-on" : ""} />
                        ))}
                      </span>
                      <span className="onda-mastery-next">{x.next === null ? "Livello massimo" : `${x.next} al prossimo`}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="an-hint">Provvisorio: maestria da 1 a 7 con le partite giocate (1, 5, 12, 25, 40, 60, 100), mai con il win rate.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
