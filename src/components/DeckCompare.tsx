"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { decodeGameCode, decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { RULES } from "@/lib/deckrules";
import { compareDecks, deckFromKeys, deckInputKind, type CompareDeck } from "@/lib/deckCompare";
import type { DeckCompareLabels } from "@/lib/deckCompareLabels";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Carta del catalogo per il confronto: quel che serve a riconoscerla e a mostrarla. */
export type CompareCatalogCard = { slug: string; key?: string; legendary: boolean; name: string; mana?: number; thumb?: string };

type Loaded = { name: string; deck: CompareDeck; code: string; unknown: number };
type Side = { input: string; loaded: Loaded | null; error: string | null };

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

/**
 * Confronto fra due mazzi (/decks/compare, 30/09/2026). La pagina è statica: i mazzi si leggono nel browser dal link,
 * dal codice OriginsMeta o da quello del gioco; un mazzo della community si legge da Supabase con la chiave pubblica
 * (solo i pubblicati). `?a=` e `?b=` precompilano i due campi (il tasto "Confronta con un altro mazzo" della scheda
 * passa lo slug del mazzo in `a`).
 */
export function DeckCompare({ catalog, labels, locale }: { catalog: CompareCatalogCard[]; labels: DeckCompareLabels; locale: string }) {
  const [sides, setSides] = useState<[Side, Side]>([
    { input: "", loaded: null, error: null },
    { input: "", loaded: null, error: null },
  ]);
  const [pending, start] = useTransition();
  const bySlug = new Map(catalog.map((c) => [c.slug, c]));

  const load = async (raw: string): Promise<Loaded | string> => {
    const kind = deckInputKind(raw);
    if (kind.kind === "invalid") return labels.errors.invalid;
    if (kind.kind === "om") {
      const d = decodeOmCode(kind.code);
      if (!d) return labels.errors.unreadable;
      return { name: d.name || labels.unnamed, deck: { legendary: d.legendary, cards: d.cards }, code: encodeOmCode(d), unknown: 0 };
    }
    if (kind.kind === "game") {
      const res = await decodeGameCode(kind.code);
      if ("error" in res) return labels.errors.unreadable;
      const { deck, unknown } = deckFromKeys(res.keys, catalog);
      if (!deck.legendary && !deck.cards.length) return labels.errors.unreadable;
      return { name: labels.unnamed, deck, code: encodeOmCode({ name: "", legendary: deck.legendary, cards: deck.cards, customCards: [] }), unknown };
    }
    const sb = supabaseBrowser();
    if (!sb) return labels.errors.network;
    const { data, error } = await sb.from("community_decks").select("name, legendary, cards, custom_cards, code_om").eq("slug", kind.slug).eq("status", "published").maybeSingle();
    if (error) return labels.errors.network;
    if (!data) return labels.errors.notFound;
    const row = data as { name: string; legendary: string | null; cards: string[]; custom_cards: never[]; code_om: string | null };
    return {
      name: row.name,
      deck: { legendary: row.legendary, cards: row.cards },
      code: row.code_om ?? encodeOmCode({ name: row.name, legendary: row.legendary, cards: row.cards, customCards: row.custom_cards }),
      unknown: 0,
    };
  };

  const run = (inputs: [string, string]) =>
    start(async () => {
      const results = await Promise.all(inputs.map((t) => (t.trim() ? load(t) : Promise.resolve(null))));
      setSides(
        results.map((r, i) => ({
          input: inputs[i],
          loaded: r && typeof r !== "string" ? r : null,
          error: typeof r === "string" ? r : null,
        })) as [Side, Side],
      );
    });

  /* precompilazione da ?a= e ?b= (una volta, dopo il montaggio: la pagina resta statica) */
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (prefilled) return;
    setPrefilled(true);
    const q = new URLSearchParams(window.location.search);
    const a = (q.get("a") ?? "").slice(0, 400);
    const b = (q.get("b") ?? "").slice(0, 400);
    if (a || b) run([a, b]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilled]);

  const setInput = (i: 0 | 1, v: string) => setSides((s) => s.map((x, j) => (j === i ? { ...x, input: v } : x)) as [Side, Side]);
  const [A, B] = sides;
  const both = A.loaded && B.loaded ? compareDecks(A.loaded.deck, B.loaded.deck) : null;

  const cardRow = (slug: string, tone: "shared" | "a" | "b") => {
    const c = bySlug.get(slug);
    return (
      <li key={slug} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${tone === "shared" ? "bg-night-3 text-pale" : "bg-night-2 text-pale"}`}>
        <span className="w-5 shrink-0 text-center font-mono text-xs text-mint">{c?.mana ?? "?"}</span>
        {c ? (
          <Link href={`/${locale}/cards/${slug}`} className="min-w-0 truncate hover:text-sky hover:underline">
            {c.name}
          </Link>
        ) : (
          <span className="min-w-0 truncate">{slug}</span>
        )}
      </li>
    );
  };
  const byCost = (xs: string[]) => [...xs].sort((x, y) => (bySlug.get(x)?.mana ?? 99) - (bySlug.get(y)?.mana ?? 99) || x.localeCompare(y));
  const inputCls = "w-full rounded-lg border border-felt-line bg-felt-deep px-3 py-2 font-mono text-xs text-chalk focus:border-mint";

  return (
    <div>
      <form
        className="felt-panel grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          run([A.input, B.input]);
        }}
      >
        {([0, 1] as const).map((i) => (
          <label key={i} className="flex min-w-0 flex-col gap-1">
            <span className="kicker text-chalk-muted">{i === 0 ? labels.deckA : labels.deckB}</span>
            <input value={sides[i].input} onChange={(e) => setInput(i, e.target.value)} placeholder={labels.placeholder} className={inputCls} spellCheck={false} autoComplete="off" />
            {sides[i].error ? (
              <span className="text-error text-xs" role="alert">
                {sides[i].error}
              </span>
            ) : null}
          </label>
        ))}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending || !(A.input.trim() && B.input.trim())}>
            {pending ? labels.loading : labels.compare}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSides([B, A])} disabled={pending}>
            {labels.swap}
          </button>
        </div>
      </form>

      {both && A.loaded && B.loaded ? (
        <section className="mt-6" aria-live="polite">
          <div className="grid gap-3 md:grid-cols-2">
            {[A.loaded, B.loaded].map((d, i) => (
              <div key={i} className="card-night p-4">
                <p className="kicker text-pale-muted">{i === 0 ? labels.deckA : labels.deckB}</p>
                <p className="t-item mt-1">{d.name}</p>
                <p className="mt-2 text-sm">
                  <span className="stat-pill bg-gold text-ink">
                    ★ {d.deck.legendary ? (bySlug.get(d.deck.legendary)?.name ?? d.deck.legendary) : "—"}
                  </span>
                </p>
                <p className="mt-2 font-mono text-xs text-pale-muted">{fill(labels.different, { name: d.name, n: String(i === 0 ? both.differentA : both.differentB) })}</p>
                {d.unknown ? <p className="mt-1 text-xs text-pale-muted">{fill(labels.unknownCards, { n: String(d.unknown) })}</p> : null}
                <p className="mt-3">
                  <a href={`/${locale}/deck-builder#${d.code}`} className="btn btn-ink text-xs">
                    {labels.openBuilder}
                  </a>
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 font-display text-lg font-bold text-chalk">
            {fill(labels.sharedCount, { n: String(both.shared.length) })}
            {both.sameLegendary ? <span className="ml-3 stat-pill bg-gold align-middle text-xs text-ink">{labels.sameLegendary}</span> : null}
          </p>
          <p className={`mt-1 text-sm ${Math.min(both.differentA, both.differentB) >= RULES.conquestMinDifferent ? "text-mint" : "text-pale-muted"}`}>
            {fill(Math.min(both.differentA, both.differentB) >= RULES.conquestMinDifferent ? labels.conquestOk : labels.conquestNo, { min: String(RULES.conquestMinDifferent) })}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { title: fill(labels.onlyIn, { name: A.loaded.name }), list: both.onlyA, tone: "a" as const },
              { title: labels.shared, list: both.shared, tone: "shared" as const },
              { title: fill(labels.onlyIn, { name: B.loaded.name }), list: both.onlyB, tone: "b" as const },
            ].map((col) => (
              <div key={col.title} className="min-w-0">
                <p className="kicker text-mint">
                  {col.title} <span className="font-mono text-pale-muted">({col.list.length})</span>
                </p>
                {col.list.length ? <ul className="mt-2 space-y-1">{byCost(col.list).map((s) => cardRow(s, col.tone))}</ul> : <p className="mt-2 text-sm text-pale-muted">{labels.none}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
