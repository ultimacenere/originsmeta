"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { deckPeekOf, sharedPeeks } from "@/lib/cardPeek";
import { CardPeek, hasPeek } from "./CardPeek";
import { trackEvent } from "@/lib/analytics";
import { bumpDeckStat } from "@/lib/community/deckStatsClient";

type DeckCard = {
  name: string;
  thumb?: string;
  /** carta intera (480 px): serve al riquadro della Leggendaria e all anteprima al passaggio del mouse */
  image?: string;
  art?: string;
  mana?: number;
  power?: number;
  health?: number;
  legendary?: boolean;
  typeLabel?: string;
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
  ability?: string;
};

export type ExplorerDeck = {
  slug: string;
  /** slug del mazzo della community in Supabase: la copia del codice conta anche nelle statistiche dell'autore (pacchetto STATS) */
  statsSlug?: string;
  name: string;
  href: string;
  tagline: string;
  /** `href` = scheda della carta, quando la Leggendaria è nel nostro database */
  legendary?: { slug: string; name: string; href?: string; cover?: string; thumb?: string; image?: string; mana?: number };
  archetype: string;
  archetypeLabel: string;
  creator: string;
  source: string;
  sourceLabel: string;
  /** nomi delle carte, per la ricerca */
  cardNames: string[];
  /** carte del mazzo con miniatura e costo, già ordinate per costo */
  cardArt: DeckCard[];
  /** codice del gioco (KGBLDC…) del mazzo, da copiare senza aprire la scheda; assente se una carta non ha l'ID ufficiale */
  code?: string;
  updated: string;
  /**
   * Data di creazione (aaaa-mm-gg) e versione del gioco di quel giorno (Pierluigi, 23/09/2026: "sui mazzi del
   * sito deve essere specificato la data di creazione e la versione del gioco o patch"). La patch non la sceglie
   * chi pubblica: si ricava dalla data con `patchAt` (src/lib/data/cards.ts), cioè dal calendario ufficiale.
   */
  created?: string;
  /** data già scritta nella lingua della pagina, per non portare l'intera formattazione nel browser */
  createdLabel?: string;
  patchId?: string;
  patchLabel?: string;
  /** media e numero dei voti (solo mazzi della community) */
  rating?: { avg: number; votes: number };
  /** voto pesato sul numero di voti (weightedRating): l'ordine "Più votati", lo stesso della classifica di /decks */
  score?: number;
  /** tipo di mazzo e tag autore (solo mazzi della community) */
  deckTypeLabels?: string[];
  creatorBadge?: string;
  /** id del tag autore (community, creator, influencer, pro, staff); "community" non si mostra */
  creatorBadgeId?: string;
};

type Labels = {
  legendary: string;
  archetype: string;
  creator: string;
  /** filtro per tag autore (diretta del 23/09/2026): etichetta e voci [id, nome] nell'ordine in cui compaiono */
  authorType: string;
  authorTypes: [string, string][];
  /** tasto che rimette tutti i filtri su "Tutti" */
  clear: string;
  card: string;
  all: string;
  /** "Tutti" in italiano, per archetipo, tipo di autore e creator ("Tutte" resta a Leggendaria e versione) */
  allMasculine: string;
  results: string;
  noResults: string;
  votes: string;
  vote: string;
  viewBlocks: string;
  viewList: string;
  copyCode: string;
  copied: string;
  /** riga che sostituisce "N risultati" quando i mazzi sono pochi (es. "I primi mazzi della community") */
  firstDecks: string;
  /* filtro per versione del gioco e ordinamento (23/09/2026) */
  patch: string;
  patchFilter: string;
  sortBy: string;
  sortNewest: string;
  sortRated: string;
  createdOn: string;
};

/** Tessera "il tuo mazzo qui": primo elemento della griglia finché i mazzi sono pochi. */
export type ExplorerInvite = { href: string; title: string; text: string; cta: string };

/**
 * Sotto questa soglia "2 risultati" dice "qui non viene nessuno" (UX-13): finché nessun filtro è attivo il
 * conteggio diventa una riga di benvenuto e il primo posto della griglia è un invito a pubblicare.
 * I filtri invece si vedono sempre (diretta Twitch del 23/09/2026): con 9 mazzi online il pannello era nascosto e
 * in diretta sembrava che i filtri per Leggendaria e archetipo non esistessero.
 */
const FEW_DECKS = 12;

/** Tag autore di un mazzo per il filtro: i mazzi della community senza tag sono "community", quelli editoriali non ne hanno. */
function authorOf(d: ExplorerDeck): string | undefined {
  return d.creatorBadgeId ?? (d.source === "community" ? "community" : undefined);
}

/**
 * Carta del mazzo: illustrazione ufficiale con il costo in mana, o le iniziali se non ce l'abbiamo.
 * Al passaggio del mouse si apre la carta in grande con nome, costo, statistiche e testo dell'abilità (`CardPeek`,
 * la stessa anteprima di chip e deck builder), così si legge il mazzo senza aprirlo. Su touch il pannello non
 * esiste (`hover: none`) e resta il nome nel `title`. Il pannello nasce al primo passaggio del mouse (GEO-01,
 * 25/09/2026): nell'HTML di /decks c'è solo il segnaposto con i dati in `data-peek`, non più il testo delle tredici
 * carte di ogni mazzo, che era il 69% delle parole della pagina. `shared`: i dati di una carta ripetuta in più mazzi
 * li porta solo la prima copia mostrata (vedi `peekShares` sotto).
 */
function DeckCardArt({ card, size, legendary = false, shared }: { card: DeckCard; size: "xs" | "sm" | "md"; legendary?: boolean; shared?: "first" | "copy" }) {
  const isLeg = legendary || card.legendary;
  const peek = { ...card, legendary: isLeg };
  return (
    <span className={`deck-card-wrap ${hasPeek(peek) ? "has-peek" : ""}`}>
      <span className={`deck-card deck-card-${size} ${isLeg ? "is-legendary" : ""}`} title={card.name}>
        {/* oltre gli 80 px la miniatura da 160 px si vede sgranata sugli schermi densi: lì va la carta intera */}
        {card.thumb || card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(size === "md" ? card.image : undefined) ?? card.thumb ?? card.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="deck-card-initials" aria-hidden="true">
            {card.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        {card.mana !== undefined ? <span className="deck-card-mana">{card.mana}</span> : null}
      </span>
      <CardPeek card={peek} shared={shared} />
    </span>
  );
}

function CopyCode({ code, labels, statsSlug }: { code: string; labels: Labels; statsSlug?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard?.writeText(code).then(
          () => {
            trackEvent("game_code_copy", { placement: "decks_list" });
            // statistiche dell'autore (pacchetto STATS): lo slug non va nei parametri di GA4
            if (statsSlug) bumpDeckStat(statsSlug, "code");
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          },
          () => {},
        );
      }}
      className="stat-pill border-2 border-sky text-[11px] text-pale hover:bg-night-3"
      title={labels.copyCode}
    >
      {done ? labels.copied : labels.copyCode}
    </button>
  );
}

export function DeckExplorer({ decks, labels, invite }: { decks: ExplorerDeck[]; labels: Labels; invite?: ExplorerInvite }) {
  const [legendary, setLegendary] = useState("all");
  const [archetype, setArchetype] = useState("all");
  const [author, setAuthor] = useState("all");
  const [creator, setCreator] = useState("all");
  const [patch, setPatch] = useState("all");
  const [card, setCard] = useState("");
  const [view, setView] = useState<"blocks" | "list">("blocks");
  /* Ordine di partenza: dal più recente al più vecchio (Pierluigi, 23/09/2026). Prima i mazzi erano ordinati per
     voto medio, e con due soli voti la classifica diceva poco; chi arriva vuole vedere l'ultimo mazzo uscito. */
  const [sort, setSort] = useState<"new" | "rated">("new");
  const firstFilter = useRef<HTMLSelectElement>(null);

  const legendaries = useMemo(() => Array.from(new Map(decks.filter((d) => d.legendary).map((d) => [d.legendary!.slug, d.legendary!.name])).entries()), [decks]);
  const archetypes = useMemo(() => Array.from(new Map(decks.map((d) => [d.archetype, d.archetypeLabel])).entries()), [decks]);
  const creators = useMemo(() => Array.from(new Set(decks.map((d) => d.creator))), [decks]);
  /* versioni presenti nei mazzi, dalla più recente: l'ordine è quello delle date, non quello alfabetico degli id */
  const patchesInUse = useMemo(
    () =>
      Array.from(new Map(decks.filter((d) => d.patchId && d.patchLabel).map((d) => [d.patchId!, { label: d.patchLabel!, date: d.created ?? "" }])).entries()).sort((a, b) =>
        b[1].date.localeCompare(a[1].date),
      ),
    [decks],
  );

  const list = useMemo(() => {
    const needle = card.trim().toLowerCase();
    const filtered = decks.filter((d) => {
      if (legendary !== "all" && d.legendary?.slug !== legendary) return false;
      if (archetype !== "all" && d.archetype !== archetype) return false;
      if (author !== "all" && authorOf(d) !== author) return false;
      if (creator !== "all" && d.creator !== creator) return false;
      if (patch !== "all" && d.patchId !== patch) return false;
      if (needle && !d.cardNames.some((c) => c.toLowerCase().includes(needle)) && !d.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    // "più recenti": la data di creazione, con quella di aggiornamento come ripiego per i mazzi editoriali
    const when = (d: ExplorerDeck) => d.created ?? d.updated;
    return filtered.sort((a, b) =>
      sort === "new"
        ? when(b).localeCompare(when(a))
        : // prima i mazzi votati, poi il voto pesato; a pari voto pesato l'ordine è per nome, come briefOrder (tierstats.ts);
          // i mazzi senza voti restano dal più recente, come in loadTierData (tierData.ts)
          Number((b.rating?.votes ?? 0) > 0) - Number((a.rating?.votes ?? 0) > 0) ||
          (Math.abs((b.score ?? 0) - (a.score ?? 0)) > 1e-9 ? (b.score ?? 0) - (a.score ?? 0) : 0) ||
          ((a.rating?.votes ?? 0) > 0 ? a.name.localeCompare(b.name, "en") : 0) ||
          when(b).localeCompare(when(a)),
    );
  }, [decks, legendary, archetype, author, creator, patch, card, sort]);

  /* Anteprime delle carte base: la stessa carta torna in molti mazzi e nell'HTML i suoi dati bastano una volta (RIV-09:
     su 16 mazzi 208 anteprime e 84 carte diverse). Si calcola sulla lista già filtrata e ordinata, perché la copia che
     porta i dati deve essere fra quelle mostrate; le carte base ci sono in tutte e due le viste, le Leggendarie (una per
     mazzo, con pochi dati) portano i loro. */
  const peekShares = useMemo(
    () =>
      sharedPeeks(
        list.flatMap((d) => d.cardArt),
        (c) => c.name,
        (c) => JSON.stringify(deckPeekOf(c)),
      ),
    [list],
  );

  const few = decks.length < FEW_DECKS;
  // con un filtro attivo contano i risultati, non il benvenuto: e l'invito a pubblicare non deve sembrare un risultato
  const filtering = legendary !== "all" || archetype !== "all" || author !== "all" || creator !== "all" || patch !== "all" || card.trim() !== "";
  const showInvite = Boolean(invite) && few && !filtering;
  const clearFilters = () => {
    setLegendary("all");
    setArchetype("all");
    setAuthor("all");
    setCreator("all");
    setPatch("all");
    setCard("");
    // il tasto sparisce con i filtri: il focus va sul primo filtro, non si perde in cima alla pagina
    firstFilter.current?.focus();
  };

  const selectCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-mint";
  const viewBtn = (active: boolean) => `rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${active ? "bg-mint text-ink" : "text-pale hover:bg-night-3"}`;

  /** Riga dei tag comune alle due viste: tag autore, provenienza, archetipo, tipi di mazzo, voto. */
  const tags = (d: ExplorerDeck) => (
    <>
      {d.creatorBadgeId && d.creatorBadgeId !== "community" && d.creatorBadge ? <span className={`${badgePill} ${badgeStyle[d.creatorBadgeId] ?? badgeStyle.community}`}>{d.creatorBadge}</span> : null}
      {d.source === "community" && d.creatorBadgeId === "staff" ? null : (
        <span className={`stat-pill text-[11px] font-semibold uppercase ${d.source === "community" ? "bg-mint text-ink" : "bg-night-3 text-chalk"}`}>{d.sourceLabel}</span>
      )}
      {/* pastiglie a fondo pieno con testo ink scuro: menta scuro + testo chiaro faceva 2,3:1 */}
      <span className="stat-pill bg-sky text-[11px] text-ink">{d.archetypeLabel}</span>
      {d.deckTypeLabels?.map((t) => (
        <span key={t} className="stat-pill bg-night-3 text-[11px] text-pale">
          {t}
        </span>
      ))}
      {d.rating && d.rating.votes > 0 ? (
        <span className="stat-pill bg-night-3 font-mono text-[11px] text-mint">
          ★ {d.rating.avg.toFixed(1)} · {d.rating.votes} {d.rating.votes === 1 ? labels.vote : labels.votes}
        </span>
      ) : null}
    </>
  );

  /* Tessera invito, nelle due viste: segnaposto della carta con il "+", titolo, testo e tasto verso il builder */
  const inviteBlock = invite ? (
    <li className="card-night border-dashed p-4 sm:p-5">
      <div className="flex gap-4">
        <div className="w-[140px] shrink-0" aria-hidden="true">
          <span className="deck-card deck-card-md">
            <span className="deck-card-initials text-mint">+</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-item">{invite.title}</p>
          <p className="mt-2 text-sm text-pale">{invite.text}</p>
          <p className="mt-4">
            <Link href={invite.href} className="btn btn-primary text-xs">
              {invite.cta} →
            </Link>
          </p>
        </div>
      </div>
    </li>
  ) : null;
  const inviteRow = invite ? (
    <li className="card-night flex flex-wrap items-center gap-x-4 gap-y-3 border-dashed p-3 sm:flex-nowrap">
      <span className="w-6 shrink-0 text-right font-display text-lg font-bold text-mint" aria-hidden="true">
        +
      </span>
      <span className="min-w-0 flex-1 basis-56">
        <span className="t-item block">{invite.title}</span>
        <span className="mt-1 block text-sm text-pale">{invite.text}</span>
      </span>
      <Link href={invite.href} className="btn btn-primary shrink-0 text-xs">
        {invite.cta} →
      </Link>
    </li>
  ) : null;

  return (
    <div>
      <div className="felt-panel mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.legendary}</span>
          <select ref={firstFilter} id="deck-legendary" value={legendary} onChange={(e) => setLegendary(e.target.value)} className={selectCls}>
            <option value="all">{labels.all}</option>
            {legendaries.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.archetype}</span>
          <select id="deck-archetype" value={archetype} onChange={(e) => setArchetype(e.target.value)} className={selectCls}>
            <option value="all">{labels.allMasculine}</option>
            {archetypes.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {/* Tutti i tag, anche quelli che oggi non hanno mazzi: in diretta sono stati chiesti Staff, Influencer e
            Community, e la voce vuota dice "Nessun mazzo" invece di sparire. */}
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.authorType}</span>
          <select id="deck-author" value={author} onChange={(e) => setAuthor(e.target.value)} className={selectCls}>
            <option value="all">{labels.allMasculine}</option>
            {labels.authorTypes.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.creator}</span>
          <select id="deck-creator" value={creator} onChange={(e) => setCreator(e.target.value)} className={selectCls}>
            <option value="all">{labels.allMasculine}</option>
            {creators.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.card}</span>
          <input id="deck-card" type="search" value={card} onChange={(e) => setCard(e.target.value)} placeholder="Merlin…" className={selectCls} />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* con pochi mazzi e nessun filtro niente "2 risultati": una riga che li presenta come i primi della community */}
          <p className="kicker text-chalk-muted" aria-live="polite">
            {few && !filtering ? (decks.length ? labels.firstDecks : null) : `${list.length} ${labels.results}`}
          </p>
          {filtering ? (
            <button type="button" onClick={clearFilters} className="btn btn-ghost text-xs">
              {labels.clear}
            </button>
          ) : null}
        </div>
        {/* Ordinamento e versione del gioco stanno sulla riga del conteggio (nati quando il pannello dei filtri con
            pochi mazzi non si vedeva): dicono in che ordine e di che epoca sono i mazzi, non che cosa contengono. */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-chalk-muted">
            {labels.sortBy}
            <select value={sort} onChange={(e) => setSort(e.target.value === "rated" ? "rated" : "new")} className={selectCls}>
              <option value="new">{labels.sortNewest}</option>
              <option value="rated">{labels.sortRated}</option>
            </select>
          </label>
          {patchesInUse.length > 1 ? (
            <label className="flex items-center gap-2 text-xs text-chalk-muted">
              {labels.patchFilter}
              <select value={patch} onChange={(e) => setPatch(e.target.value)} className={selectCls}>
                <option value="all">{labels.all}</option>
                {patchesInUse.map(([id, { label }]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="flex gap-1 rounded-lg border border-felt-line bg-felt-deep p-1">
          <button type="button" onClick={() => setView("blocks")} className={viewBtn(view === "blocks")} aria-pressed={view === "blocks"}>
            {labels.viewBlocks}
          </button>
          <button type="button" onClick={() => setView("list")} className={viewBtn(view === "list")} aria-pressed={view === "list"}>
            {labels.viewList}
          </button>
        </div>
      </div>

      {list.length === 0 && !showInvite ? (
        <p className="card-night p-6 text-pale-muted">{labels.noResults}</p>
      ) : view === "blocks" ? (
        /* Blocchi: la Leggendaria in grande accanto al mazzo, le dodici carte in griglia. */
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {showInvite ? inviteBlock : null}
          {list.map((d) => (
            <li key={d.slug} className="card-night p-4 sm:p-5">
              <div className="flex gap-4">
                <div className="w-[140px] shrink-0">
                  <Link href={d.href} className="block">
                    {d.legendary?.thumb ? (
                      <DeckCardArt card={{ name: d.legendary.name, thumb: d.legendary.thumb, image: d.legendary.image, mana: d.legendary.mana }} size="md" legendary />
                    ) : (
                      <span className="deck-card deck-card-md">
                        <span className="deck-card-initials" aria-hidden="true">
                          {(d.legendary?.name ?? d.name).slice(0, 2).toUpperCase()}
                        </span>
                      </span>
                    )}
                  </Link>
                  {/* Nome della Leggendaria: stella gialla davanti, stesso colore degli altri testi, link alla scheda carta */}
                  {d.legendary ? (
                    <p className="mt-1 text-center text-[11px] leading-tight text-pale">
                      <span className="legendary-star" aria-hidden="true">
                        ★
                      </span>
                      {d.legendary.href ? (
                        <Link href={d.legendary.href} className="hover:text-mint hover:underline">
                          {d.legendary.name}
                        </Link>
                      ) : (
                        d.legendary.name
                      )}
                      <span className="sr-only"> ({labels.legendary})</span>
                    </p>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">{tags(d)}</div>
                  <Link href={d.href} className="t-item mt-2 block leading-tight hover:text-mint">
                    {d.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-pale-muted">{d.tagline}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-pale-muted">
                    <span>
                      {labels.creator}: <strong className="text-pale">{d.creator}</strong>
                    </span>
                    {/* Quando è stato costruito e con quale versione del gioco: un mazzo di tre patch fa vale
                        un'altra cosa, e chi legge deve poterlo capire senza aprire la scheda. */}
                    {d.createdLabel ? (
                      <span>
                        {labels.createdOn} <time dateTime={d.created}>{d.createdLabel}</time>
                      </span>
                    ) : null}
                    {d.patchLabel ? (
                      <span className="stat-pill bg-night-3 text-[11px] text-pale">
                        {labels.patch} {d.patchLabel}
                      </span>
                    ) : null}
                    {d.code ? <CopyCode code={d.code} labels={labels} statsSlug={d.statsSlug} /> : null}
                  </p>
                </div>
              </div>
              <Link href={d.href} className="mt-4 flex flex-wrap gap-1.5 border-t border-sky pt-4">
                {d.cardArt.map((c, i) => (
                  <DeckCardArt key={`${c.name}-${i}`} card={c} size="sm" shared={peekShares.get(c)} />
                ))}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        /* Lista: una riga per mazzo, con tutte le carte in fila. */
        <ul className="flex flex-col gap-2">
          {showInvite ? inviteRow : null}
          {list.map((d, i) => (
            <li key={d.slug} className="card-night flex flex-wrap items-center gap-x-4 gap-y-3 p-3 sm:flex-nowrap">
              <span className="w-6 shrink-0 text-right font-mono text-sm text-chalk-muted">{i + 1}.</span>
              <span className="min-w-0 basis-56 sm:shrink-0">
                <Link href={d.href} className="t-item block truncate text-base leading-tight hover:text-mint">
                  {d.name}
                </Link>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">{tags(d)}</span>
              </span>
              {/* Le tredici carte in fila; a schermo stretto vanno a capo. Niente overflow: taglierebbe
                  l'anteprima che si apre sopra la carta. */}
              <Link href={d.href} className="flex min-w-0 flex-1 flex-wrap gap-1">
                {d.legendary ? <DeckCardArt card={{ name: d.legendary.name, thumb: d.legendary.thumb, image: d.legendary.image, mana: d.legendary.mana }} size="xs" legendary /> : null}
                {d.cardArt.map((c, k) => (
                  <DeckCardArt key={`${c.name}-${k}`} card={c} size="xs" shared={peekShares.get(c)} />
                ))}
              </Link>
              <span className="flex shrink-0 items-center gap-2 text-xs text-pale-muted">
                <span className="truncate">{d.creator}</span>
                {d.createdLabel ? <time dateTime={d.created}>{d.createdLabel}</time> : null}
                {d.patchLabel ? <span className="stat-pill bg-night-3 text-[11px] text-pale">{d.patchLabel}</span> : null}
                {d.code ? <CopyCode code={d.code} labels={labels} statsSlug={d.statsSlug} /> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
