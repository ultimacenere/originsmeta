"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { matchesSearch, searchHaystack, searchTerms } from "@/lib/cardSearch";
import { FlipCard, type FlipCardData } from "./FlipCard";

/**
 * Carta del database: i dati della carta che si gira (`FlipCard`, la stessa della scheda di un mazzo, costruiti
 * da `flipOf` in CardChip.tsx) più i campi che servono ai filtri e alla ricerca.
 */
export type ExplorerCard = FlipCardData & {
  type: "unit" | "spell" | "token";
  legendary: boolean;
  sagaId: string;
  sagaLabel: string;
  rarity?: string;
  keywords: string[];
  /** testo inglese del gioco, solo sulle pagine non inglesi: la ricerca trova "draw" anche dove c'è "Pesca" */
  abilityEn?: string;
  removed: boolean;
};

type Labels = {
  search: string;
  /** segnaposto: esempi di nome e di testo della carta */
  searchHint: string;
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
  /** per il nome del link di ogni carta letto dai lettori di schermo */
  mana: string;
  power: string;
  health: string;
};

type Option = { id: string; label: string };

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

  /* Si cerca in nome, saga, parole chiave e testo della carta (anche inglese sulle pagine non inglesi): la stessa
     ricerca del deck builder (`cardSearch.ts`, 24/09/2026), più le parole chiave, che qui c'erano già e portano
     anche categorie che nel testo non ci sono ("Buff", "Vanilla"). */
  const haystacks = useMemo(() => new Map(cards.map((c) => [c.slug, searchHaystack([c.name, c.sagaLabel, ...c.keywords, c.ability, c.abilityEn])])), [cards]);
  const list = useMemo(() => {
    const terms = searchTerms(q);
    const out = cards.filter((c) => {
      if (c.removed && !showRemoved) return false;
      if (type !== "all" && (type === "legendary" ? !c.legendary : c.type !== type)) return false;
      if (saga !== "all" && c.sagaId !== saga) return false;
      if (alignment !== "all" && c.alignment !== alignment) return false;
      if (rarity !== "all" && c.rarity !== rarity) return false;
      if (!matchesSearch(haystacks.get(c.slug) ?? "", terms)) return false;
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
  }, [cards, haystacks, q, type, saga, alignment, rarity, showRemoved, sort]);

  const selectCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-mint";
  const removedCount = cards.filter((c) => c.removed).length;
  const flipLabels = { legendary: labels.legendary, mana: labels.mana, power: labels.power, health: labels.health };

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
              placeholder={labels.searchHint}
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
           (su touch restano nome e statistiche sotto la carta, e la scheda è a un tocco). Stessa carta della
           scheda di un mazzo (`FlipCard`); qui il piede con nome e statistiche c'è sempre. */
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((c) => (
            <li key={c.slug} className="min-w-0">
              <FlipCard card={c} labels={flipLabels} sizes="(min-width: 1280px) 190px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 44vw" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
