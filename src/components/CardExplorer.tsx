"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { alignStyle, changeStyle, initials, sagaHue } from "@/lib/cardArt";

export type ExplorerCard = {
  slug: string;
  name: string;
  href: string;
  type: "unit" | "spell" | "token";
  typeLabel: string;
  legendary: boolean;
  sagaId: string;
  sagaLabel: string;
  image?: string;
  /** carta ufficiale a 480 px, per gli schermi ad alta densità */
  imageLarge?: string;
  /** testo dell abilità nella lingua della pagina, mostrato nel pannello al passaggio del mouse */
  ability?: string;
  mana?: number;
  power?: number;
  health?: number;
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
  rarity?: string;
  rarityLabel?: string;
  keywords: string[];
  lastKind?: "buff" | "nerf" | "rework" | "deck";
  lastKindLabel?: string;
  removed: boolean;
  removedLabel: string;
};

type Labels = {
  search: string;
  all: string;
  type: string;
  saga: string;
  alignment: string;
  rarity: string;
  sort: string;
  sortName: string;
  sortMana: string;
  sortPower: string;
  sortHealth: string;
  results: string;
  noResults: string;
  legendary: string;
  unknownStats: string;
  showRemoved: string;
};

type Option = { id: string; label: string };

// I colori delle pastiglie dei cambi stanno in `changeStyle` (cardArt.ts): gli stessi di ChangeChip nelle altre pagine.
const MAX_KEYWORDS = 4;

/* La ricerca dell'header arriva come ?q=…: letta dal browser dopo l'idratazione (sul server vale ""),
   così la pagina resta statica e le schede stanno nell'HTML iniziale, senza useSearchParams. */
const noSubscribe = () => () => {};
const readQueryQ = () => (new URLSearchParams(window.location.search).get("q") ?? "").slice(0, 60);
const emptyQ = () => "";

export function CardExplorer({
  cards,
  labels,
  sagas,
  alignments,
  rarities,
}: {
  cards: ExplorerCard[];
  labels: Labels;
  sagas: Option[];
  alignments: Option[];
  rarities: Option[];
}) {
  const initialQ = useSyncExternalStore(noSubscribe, readQueryQ, emptyQ);
  const [qEdit, setQEdit] = useState<string | null>(null);
  const q = qEdit ?? initialQ;
  const [type, setType] = useState("all");
  const [saga, setSaga] = useState("all");
  const [alignment, setAlignment] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [showRemoved, setShowRemoved] = useState(false);
  const [sort, setSort] = useState<"name" | "mana" | "power" | "health">("mana");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = cards.filter((c) => {
      if (c.removed && !showRemoved) return false;
      if (type !== "all" && (type === "legendary" ? !c.legendary : c.type !== type)) return false;
      if (saga !== "all" && c.sagaId !== saga) return false;
      if (alignment !== "all" && c.alignment !== alignment) return false;
      if (rarity !== "all" && c.rarity !== rarity) return false;
      if (needle && !c.name.toLowerCase().includes(needle) && !c.keywords.some((k) => k.toLowerCase().includes(needle)) && !c.sagaLabel.toLowerCase().includes(needle)) return false;
      return true;
    });
    const num = (v?: number) => (v === undefined ? 99 : v);
    out.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "mana") return num(a.mana) - num(b.mana) || a.name.localeCompare(b.name);
      if (sort === "power") return num(b.power === undefined ? -99 : -b.power) - num(a.power === undefined ? -99 : -a.power) || a.name.localeCompare(b.name);
      return num(b.health === undefined ? -99 : -b.health) - num(a.health === undefined ? -99 : -a.health) || a.name.localeCompare(b.name);
    });
    return out;
  }, [cards, q, type, saga, alignment, rarity, showRemoved, sort]);

  const selectCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-mint";
  const removedCount = cards.filter((c) => c.removed).length;

  return (
    <div>
      <div className="felt-panel mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <label className="flex flex-col gap-1 xl:col-span-2">
            <span className="kicker text-chalk-muted">{labels.search}</span>
            <input
              id="card-search"
              type="search"
              value={q}
              onChange={(e) => setQEdit(e.target.value)}
              placeholder="Merlin, On Reveal…"
              className={selectCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.type}</span>
            <select id="card-type" value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
              <option value="all">{labels.all}</option>
              <option value="legendary">{labels.legendary}</option>
              {["unit", "spell", "token"].map((t) => {
                const sample = cards.find((c) => c.type === t);
                return sample ? (
                  <option key={t} value={t}>
                    {sample.typeLabel}
                  </option>
                ) : null;
              })}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.saga}</span>
            <select id="card-saga" value={saga} onChange={(e) => setSaga(e.target.value)} className={selectCls}>
              <option value="all">{labels.all}</option>
              {sagas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.alignment}</span>
            <select id="card-alignment" value={alignment} onChange={(e) => setAlignment(e.target.value)} className={selectCls}>
              <option value="all">{labels.all}</option>
              {alignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.rarity}</span>
            <select id="card-rarity" value={rarity} onChange={(e) => setRarity(e.target.value)} className={selectCls}>
              <option value="all">{labels.all}</option>
              {rarities.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="kicker text-chalk-muted">{labels.sort}</span>
            <select id="card-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectCls}>
              <option value="mana">{labels.sortMana}</option>
              <option value="name">{labels.sortName}</option>
              <option value="power">{labels.sortPower}</option>
              <option value="health">{labels.sortHealth}</option>
            </select>
          </label>
        </div>
        {removedCount > 0 ? (
          <label className="mt-3 flex items-center gap-2 text-sm text-chalk-muted">
            <input id="card-show-removed" type="checkbox" checked={showRemoved} onChange={(e) => setShowRemoved(e.target.checked)} className="accent-mint" />
            {labels.showRemoved} <span className="font-mono text-xs">({removedCount})</span>
          </label>
        ) : null}
      </div>

      <p className="kicker mb-4 text-chalk-muted">
        {list.length} {labels.results}
      </p>

      {list.length === 0 ? (
        <p className="card-night p-6 text-pale-muted">{labels.noResults}</p>
      ) : (
        /* Griglia di illustrazioni: l'immagine è il contenuto, i dettagli si scoprono al passaggio del mouse
           (su touch restano nome e statistiche sotto la carta, e la scheda è a un tocco). */
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((c) => (
            <li key={c.slug}>
              <Link href={c.href} className={`card-tile ${c.legendary ? "is-legendary" : ""} ${c.removed ? "is-removed" : ""}`}>
                <span className="card-tile-art" style={c.image ? undefined : { background: sagaHue[c.sagaId] ?? sagaHue.other }}>
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} srcSet={c.imageLarge ? `${c.image} 160w, ${c.imageLarge} 480w` : undefined} sizes="(min-width: 1280px) 190px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 44vw" alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="card-tile-initials" aria-hidden="true">
                      {initials(c.name)}
                    </span>
                  )}
                  {c.mana !== undefined ? <span className="card-tile-mana">{c.mana}</span> : null}
                  {c.legendary ? <span className="card-tile-star" aria-hidden="true">★</span> : null}

                  <span className="card-tile-info">
                    <span className="kicker block text-mint">{c.sagaLabel}</span>
                    {/* Pastiglie sempre a fondo pieno e testo sopra i 4,5:1 (prima Leggendaria pale su oro al 40% e
                        Rimossa magenta su magenta tenue restavano sotto soglia). */}
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="stat-pill bg-night-3 text-[11px] text-pale">{c.typeLabel}</span>
                      {c.alignmentLabel && c.alignment ? <span className={`stat-pill text-[11px] ${alignStyle[c.alignment]}`}>{c.alignmentLabel}</span> : null}
                      {c.legendary ? (
                        <span className="stat-pill bg-gold text-[11px] font-bold text-ink">{labels.legendary}</span>
                      ) : c.rarityLabel ? (
                        <span className="stat-pill bg-night-3 text-[11px] text-pale">{c.rarityLabel}</span>
                      ) : null}
                      {c.removed ? <span className="stat-pill bg-bad text-[11px] font-bold text-ink">{c.removedLabel}</span> : null}
                      {c.lastKind && c.lastKindLabel ? <span className={`stat-pill text-[11px] font-bold uppercase ${changeStyle[c.lastKind]}`}>{c.lastKindLabel}</span> : null}
                    </span>
                    {c.ability ? <span className="card-tile-text">{c.ability}</span> : null}
                    {c.keywords.length ? (
                      <span className="mt-2 flex flex-wrap gap-1">
                        {c.keywords.slice(0, MAX_KEYWORDS).map((k) => (
                          <span key={k} className="rounded bg-night-3 px-1.5 py-0.5 text-[10px] font-semibold text-pale">
                            {k}
                          </span>
                        ))}
                        {c.keywords.length > MAX_KEYWORDS ? <span className="px-1 text-[10px] font-semibold text-pale">+{c.keywords.length - MAX_KEYWORDS}</span> : null}
                      </span>
                    ) : null}
                  </span>
                </span>

                <span className="card-tile-foot">
                  {/* Nome della carta: ruolo .t-item (celeste, bold), misura ridotta per la griglia fitta */}
                  <span className="t-item min-w-0 flex-1 truncate text-sm leading-tight">
                    {c.legendary ? "★ " : ""}
                    {c.name}
                  </span>
                  {/* Solo le statistiche: il tipo della carta si legge nel pannello e sulla carta stessa. */}
                  {c.power !== undefined ? <span className="shrink-0 font-mono text-xs tabular text-pale">{`${c.power}/${c.health}`}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
