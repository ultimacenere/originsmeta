"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { CardPeek, hasPeek } from "./CardPeek";

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
  /** media e numero dei voti (solo mazzi della community) */
  rating?: { avg: number; votes: number };
  /** tipo di mazzo e tag autore (solo mazzi della community) */
  deckTypeLabels?: string[];
  creatorBadge?: string;
  /** id del tag autore (community, influencer, pro, staff); "community" non si mostra */
  creatorBadgeId?: string;
};

type Labels = {
  legendary: string;
  archetype: string;
  creator: string;
  card: string;
  all: string;
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
};

/** Tessera "il tuo mazzo qui": primo elemento della griglia finché i mazzi sono pochi. */
export type ExplorerInvite = { href: string; title: string; text: string; cta: string };

/**
 * Sotto questa soglia quattro filtri e "2 risultati" dicono "qui non viene nessuno" (UX-13): i filtri spariscono,
 * il conteggio diventa una riga di benvenuto e il primo posto della griglia è un invito a pubblicare.
 */
const FEW_DECKS = 12;

/**
 * Carta del mazzo: illustrazione ufficiale con il costo in mana, o le iniziali se non ce l'abbiamo.
 * Al passaggio del mouse si apre la carta in grande con nome, costo, statistiche e testo dell'abilità (`CardPeek`,
 * la stessa anteprima di chip e deck builder), così si legge il mazzo senza aprirlo. Su touch il pannello non
 * esiste (`hover: none`) e resta il nome nel `title`.
 */
function DeckCardArt({ card, size, legendary = false }: { card: DeckCard; size: "xs" | "sm" | "md"; legendary?: boolean }) {
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
      <CardPeek card={peek} />
    </span>
  );
}

function CopyCode({ code, labels }: { code: string; labels: Labels }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard?.writeText(code).then(
          () => {
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
  const [creator, setCreator] = useState("all");
  const [card, setCard] = useState("");
  const [view, setView] = useState<"blocks" | "list">("blocks");

  const legendaries = useMemo(() => Array.from(new Map(decks.filter((d) => d.legendary).map((d) => [d.legendary!.slug, d.legendary!.name])).entries()), [decks]);
  const archetypes = useMemo(() => Array.from(new Map(decks.map((d) => [d.archetype, d.archetypeLabel])).entries()), [decks]);
  const creators = useMemo(() => Array.from(new Set(decks.map((d) => d.creator))), [decks]);

  const list = useMemo(() => {
    const needle = card.trim().toLowerCase();
    return decks.filter((d) => {
      if (legendary !== "all" && d.legendary?.slug !== legendary) return false;
      if (archetype !== "all" && d.archetype !== archetype) return false;
      if (creator !== "all" && d.creator !== creator) return false;
      if (needle && !d.cardNames.some((c) => c.toLowerCase().includes(needle)) && !d.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [decks, legendary, archetype, creator, card]);

  const few = decks.length < FEW_DECKS;
  const showInvite = Boolean(invite) && few;

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
      {few ? null : (
        <div className="felt-panel mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.legendary}</span>
            <select id="deck-legendary" value={legendary} onChange={(e) => setLegendary(e.target.value)} className={selectCls}>
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
              <option value="all">{labels.all}</option>
              {archetypes.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.creator}</span>
            <select id="deck-creator" value={creator} onChange={(e) => setCreator(e.target.value)} className={selectCls}>
              <option value="all">{labels.all}</option>
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
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* con pochi mazzi niente "2 risultati": una riga che li presenta come i primi della community */}
        <p className="kicker text-chalk-muted">{few ? (decks.length ? labels.firstDecks : null) : `${list.length} ${labels.results}`}</p>
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
                    {d.code ? <CopyCode code={d.code} labels={labels} /> : null}
                  </p>
                </div>
              </div>
              <Link href={d.href} className="mt-4 flex flex-wrap gap-1.5 border-t border-sky pt-4">
                {d.cardArt.map((c, i) => (
                  <DeckCardArt key={`${c.name}-${i}`} card={c} size="sm" />
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
                  <DeckCardArt key={`${c.name}-${k}`} card={c} size="xs" />
                ))}
              </Link>
              <span className="flex shrink-0 items-center gap-2 text-xs text-pale-muted">
                <span className="truncate">{d.creator}</span>
                {d.code ? <CopyCode code={d.code} labels={labels} /> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
