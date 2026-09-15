"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { OM_PREFIX, decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { RULES, validateDeck, type DeckState } from "@/lib/deckrules";
import { publishDeck, updateDeck, type ActionState } from "@/lib/community/actions";
import { BUILDER_STORAGE_KEY, PENDING_PUBLISH_KEY, deckTypes, type Guide } from "@/lib/community/types";
import { suggestArchetype } from "@/lib/archetype";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";
import { LoginPanel, type LoginLabels } from "./LoginPanel";

export type PoolCard = { slug: string; name: string; legendary: boolean };
export type InitialDeck = { id: string; code: string; name: string; archetype: string; deckTypes: string[]; video: string; guide: Guide };

type Props = {
  locale: string;
  mode: "create" | "edit";
  pool: PoolCard[];
  archetypes: [string, string][];
  initial?: InitialDeck;
  labels: Dictionary["community"];
  loginLabels: LoginLabels;
  builderHref: string;
  /** percorso della pagina di pubblicazione, usato come ritorno dopo l'accesso */
  publishPath: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale focus:border-mint";

/** Mazzo da pubblicare: hash del link (#OM1…), poi mazzo in attesa (salvato prima dell'accesso), poi mazzo attivo del builder. */
function detectCode(): string | null {
  try {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith(OM_PREFIX)) return hash;
    const pending = localStorage.getItem(PENDING_PUBLISH_KEY);
    if (pending?.startsWith(OM_PREFIX)) return pending;
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { active?: number; decks?: DeckState[] };
      const d = p.decks?.[p.active ?? 0];
      if (d && d.legendary) return encodeOmCode({ name: d.name ?? "", legendary: d.legendary, cards: d.cards ?? [], customCards: d.customCards ?? [] });
    }
  } catch {
    /* storage non disponibile */
  }
  return null;
}

/**
 * Modulo "Pubblica sul sito": mazzo (dal deck builder, via hash #OM1… o dal salvataggio del browser),
 * guida e video. Se l'utente non è loggato mostra l'accesso e conserva il mazzo per dopo.
 */
export function PublishDeckForm({ locale, mode, pool, archetypes, initial, labels, loginLabels, builderHref, publishPath }: Props) {
  const router = useRouter();
  const mounted = useMounted();
  const ready = mode === "edit" || mounted;
  const code = useMemo(() => (mode === "edit" ? (initial?.code ?? null) : mounted ? detectCode() : null), [mode, initial, mounted]);
  const [user, setUser] = useState<{ id: string } | null | undefined>(mode === "edit" ? { id: "owner" } : supabaseEnabled ? undefined : null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(mode === "edit" ? updateDeck : publishDeck, {});

  /* il mazzo resta in attesa nel browser: sopravvive al giro di accesso (Discord o link via email) */
  useEffect(() => {
    if (mode !== "create" || !code) return;
    try {
      localStorage.setItem(PENDING_PUBLISH_KEY, code);
    } catch {
      /* ignore */
    }
  }, [mode, code]);

  useEffect(() => {
    if (mode === "edit") return;
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setUser(data.session ? { id: data.session.user.id } : null);
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setUser(session ? { id: session.user.id } : null);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [mode]);

  useEffect(() => {
    if (state.ok && state.href) {
      try {
        localStorage.removeItem(PENDING_PUBLISH_KEY);
      } catch {
        /* ignore */
      }
      router.push(state.href);
    }
  }, [state, router]);

  const deck = useMemo(() => (code ? decodeOmCode(code) : null), [code]);
  /* archetipo: suggerito dalla composizione, ma l'utente può cambiarlo */
  const suggested = useMemo(() => (deck ? suggestArchetype(deck) : null), [deck]);
  const [archetypeChoice, setArchetypeChoice] = useState<string | null>(null);
  const archetypeValue = archetypeChoice ?? initial?.archetype ?? suggested ?? "midrange";
  const errors = deck ? validateDeck(deck).filter((i) => i.level === "error") : [];
  const nameOf = (slug: string) => pool.find((c) => c.slug === slug)?.name ?? deck?.customCards.find((c) => c.slug === slug)?.name ?? slug;
  const hasCustom = Boolean(deck && [deck.legendary, ...deck.cards].some((s) => s?.startsWith("custom:")));

  if (!supabaseEnabled) return <p className="card-night p-6 text-pale-muted">{labels.errors.disabled}</p>;
  if (!ready || user === undefined) return <p className="card-night p-6 text-pale-muted" aria-busy="true">…</p>;
  if (!deck || errors.length) {
    return (
      <div className="card-night p-6 sm:p-8">
        <p className="text-pale">{deck ? labels.incomplete : labels.noDeck}</p>
        <p className="mt-4">
          <Link href={builderHref} className="btn btn-ink">
            {labels.backToBuilder}
          </Link>
        </p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <DeckPreview deck={deck} nameOf={nameOf} hasCustom={hasCustom} labels={labels} />
        <div>
          <p className="mb-4 text-chalk">{labels.loginFirst}</p>
          <LoginPanel next={publishPath} labels={loginLabels} />
        </div>
      </div>
    );
  }

  const g = initial?.guide;
  const errorText = state.error ? ((labels.errors as Record<string, string>)[state.error] ?? labels.errors.db) : null;
  const busyLabel = mode === "edit" ? labels.updating : labels.submitting;
  const submitLabel = mode === "edit" ? labels.update : labels.submit;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="code" value={code ?? ""} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <DeckPreview deck={deck} nameOf={nameOf} hasCustom={hasCustom} labels={labels} />

      <section className="card-night p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="kicker text-pale-muted">{labels.name}</span>
            <input id="pub-name" name="name" required minLength={3} maxLength={60} defaultValue={initial?.name ?? deck.name} className={inputCls} />
          </label>
          <label className="block">
            <span className="kicker text-pale-muted">{labels.archetype}</span>
            <select id="pub-archetype" name="archetype" required value={archetypeValue} onChange={(e) => setArchetypeChoice(e.target.value)} className={inputCls}>
              {archetypes.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            {mode === "create" && suggested && !archetypeChoice ? <span className="mt-1 block text-xs text-pale-muted">{labels.archetypeSuggested}</span> : null}
          </label>
          <fieldset className="block sm:col-span-2">
            <legend className="kicker text-pale-muted">{labels.deckType}</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {deckTypes.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky bg-night px-2.5 py-1.5 text-sm text-pale">
                  <input id={`pub-deck-type-${t}`} type="checkbox" name="deck_types" value={t} defaultChecked={(initial?.deckTypes ?? ["ladder"]).includes(t)} className="accent-mint" />
                  {labels.deckTypes[t]}
                </label>
              ))}
            </div>
            <span className="mt-1 block text-xs text-pale-muted">{labels.deckTypeHint}</span>
          </fieldset>
          <label className="block">
            <span className="kicker text-pale-muted">{labels.guideLang}</span>
            <select id="pub-lang" name="lang" defaultValue={g?.lang ?? locale} className={inputCls}>
              <option value="en">English</option>
              <option value="it">Italiano</option>
            </select>
          </label>
        </div>

        <Field id="summary" label={labels.summary} hint={labels.summaryHint} required minLength={20} maxLength={600} rows={4} defaultValue={g?.summary} />
        <Field id="strengths" label={labels.strengths} rows={3} defaultValue={g?.strengths} />
        <Field id="weaknesses" label={labels.weaknesses} rows={3} defaultValue={g?.weaknesses} />
        <Field id="mulligan" label={labels.mulligan} hint={labels.mulliganHint} rows={3} defaultValue={g?.mulligan} />
        <Field id="combos" label={labels.combos} rows={3} defaultValue={g?.combos} />
        <Field id="matchups" label={labels.matchups} hint={labels.matchupsHint} rows={3} defaultValue={g?.matchups} />
        <Field id="notes" label={labels.notes} rows={2} defaultValue={g?.notes} />

        <label className="mt-4 block">
          <span className="kicker text-pale-muted">{labels.video}</span>
          <input id="pub-video" name="video" type="url" maxLength={300} placeholder="https://www.youtube.com/watch?v=…" defaultValue={initial?.video} className={inputCls} />
          <span className="mt-1 block text-xs text-pale-muted">{labels.videoHint}</span>
        </label>

        <p className="mt-5 text-xs text-pale-muted">{labels.consent}</p>
        {errorText ? (
          <p className="mt-3 rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson" role="alert">
            {errorText}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="btn btn-mint disabled:opacity-60">
            {pending ? busyLabel : submitLabel}
          </button>
          <Link href={builderHref} className="text-sm text-pale-muted underline underline-offset-2 hover:text-sky">
            {labels.backToBuilder}
          </Link>
        </div>
      </section>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  rows,
  defaultValue,
  required,
  minLength,
  maxLength = 2000,
}: {
  id: string;
  label: string;
  hint?: string;
  rows: number;
  defaultValue?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="mt-4 block">
      <span className="kicker text-pale-muted">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea id={`pub-${id}`} name={id} rows={rows} required={required} minLength={minLength} maxLength={maxLength} defaultValue={defaultValue} className={inputCls} />
      {hint ? <span className="mt-1 block text-xs text-pale-muted">{hint}</span> : null}
    </label>
  );
}

function DeckPreview({ deck, nameOf, hasCustom, labels }: { deck: DeckState; nameOf: (s: string) => string; hasCustom: boolean; labels: Dictionary["community"] }) {
  const isCustom = (s: string) => s.startsWith("custom:");
  return (
    <aside className="card-night h-fit p-5">
      <p className="kicker text-pale-muted">{labels.deckPreview}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-sky">{deck.name || "—"}</p>
      <ul className="mt-3 space-y-1 text-sm text-pale">
        {deck.legendary ? (
          <li className="rounded-lg bg-gold/40 px-2 py-1 font-display text-xs font-bold">
            ★ {nameOf(deck.legendary)}
            {isCustom(deck.legendary) ? " *" : ""}
          </li>
        ) : null}
        {deck.cards.map((s) => (
          <li key={s} className="flex items-center gap-2 rounded-lg bg-night-2/70 px-2 py-1">
            <span className="font-mono text-xs text-pale-muted">{RULES.copiesPerCard}×</span>
            <span className="font-display text-xs font-bold">
              {nameOf(s)}
              {isCustom(s) ? " *" : ""}
            </span>
          </li>
        ))}
      </ul>
      {hasCustom ? <p className="mt-3 text-xs text-pale-muted">{labels.customMark}</p> : null}
    </aside>
  );
}
