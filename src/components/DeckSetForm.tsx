"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { localeNames, locales } from "@/lib/i18n";
import { encodeOmCode } from "@/lib/deckcode";
import { RULES, validateDeck, type DeckState } from "@/lib/deckrules";
import { suggestArchetype } from "@/lib/archetype";
import { BUILDER_STORAGE_KEY } from "@/lib/community/types";
import { publishDeckSet, updateDeckSet, type DeckSetActionState } from "@/lib/community/deckSetActions";
import {
  DECK_SET_DRAFT_KEY,
  DECK_SET_GUIDE_LIMITS,
  DECK_SET_MIN_DIFFERENT,
  DECK_SET_PENDING_KEY,
  DECK_SET_SIZE,
  deckSetFormWords,
  deckSetIssue,
  decodeSetCodes,
  joinSetCodes,
  type DeckSetGuide,
} from "@/lib/community/deckSets";
import { GUIDE_MIN_WORDS } from "@/lib/community/deckQuality";
import type { DeckSetLabels } from "@/lib/deckSetLabels";
import { trackEvent } from "@/lib/analytics";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";
import { MEDIA_FIELD_NAMES, fillVideoLabel, mediaFieldRow, type DeckLink, type StoredVideo } from "@/lib/videos";
import type { VideoFormLabels } from "@/lib/videoLabels";
import type { LoginLabels } from "@/lib/loginLabels";
import { DeckMediaFields } from "./DeckMediaFields";
import { LoginPanel } from "./LoginPanel";

/** Carta del database per mostrare i nomi dei tre mazzi. */
export type SetPoolCard = { slug: string; name: string };

/** Mazzo torneo da modificare: i tre codici, nomi e archetipi dei mazzi, nome, guida, video e link. */
export type InitialDeckSet = {
  id: string;
  codes: string;
  names: string[];
  archetypes: string[];
  name: string;
  guide: DeckSetGuide;
  videos?: StoredVideo[];
  links?: DeckLink[];
};

type Props = {
  locale: string;
  mode: "create" | "edit";
  pool: SetPoolCard[];
  archetypes: [string, string][];
  initial?: InitialDeckSet;
  labels: DeckSetLabels["form"];
  deckLetterLabel: string;
  mediaLabels: VideoFormLabels;
  loginLabels: LoginLabels;
  builderHref: string;
  publishPath: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (Object.hasOwn(v, k) ? v[k] : m));
const letter = (i: number) => String.fromCharCode(65 + i);

const GUIDE_FIELDS = ["deck_1", "deck_2", "deck_3", "strengths", "weaknesses", "matchups", "notes"] as const;
const DRAFT_FIELDS = ["name", "lang", "summary", ...GUIDE_FIELDS, "deck_name_0", "deck_name_1", "deck_name_2", ...MEDIA_FIELD_NAMES] as const;
type DraftValues = Partial<Record<(typeof DRAFT_FIELDS)[number], string>>;

/** I tre mazzi della modalità Torneo del deck builder di questo browser, se sono tutti e tre con la Leggendaria. */
function builderSetCodes(): string | null {
  try {
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { decks?: DeckState[] };
    const decks = (p.decks ?? []).slice(0, DECK_SET_SIZE);
    if (decks.length < DECK_SET_SIZE || decks.some((d) => !d?.legendary)) return null;
    return joinSetCodes(decks.map((d) => encodeOmCode({ name: d.name ?? "", legendary: d.legendary, cards: d.cards ?? [], customCards: d.customCards ?? [] })));
  } catch {
    return null;
  }
}

/** I tre codici da pubblicare: `?decks=`, l'hash del link del deck builder, quelli in attesa dell'accesso, il deck builder. */
function detectCodes(param: string | null): string | null {
  if (param && decodeSetCodes(param)) return param;
  try {
    const hash = window.location.hash.slice(1);
    if (decodeSetCodes(hash)) return hash;
    const pending = localStorage.getItem(DECK_SET_PENDING_KEY);
    if (pending && decodeSetCodes(pending)) return pending;
  } catch {
    /* storage non disponibile */
  }
  return builderSetCodes();
}

function readDraft(codes: string): DraftValues | null {
  try {
    const raw = localStorage.getItem(DECK_SET_DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { codes?: string; values?: DraftValues };
    return p?.codes === codes && p.values && typeof p.values === "object" ? p.values : null;
  } catch {
    return null;
  }
}

/**
 * Modulo dei Mazzi torneo (04/10/2026): i tre mazzi (dal deck builder, dal link o incollati), un nome e una guida per il
 * trio, il ruolo di ogni mazzo, sezioni facoltative, video e link. Le regole Conquest si controllano qui prima di
 * inviare (deckSets.ts), poi nella Server Action e nel database. In modifica i mazzi si possono riprendere dal deck
 * builder di questo browser.
 */
export function DeckSetForm({ locale, mode, pool, archetypes, initial, labels, deckLetterLabel, mediaLabels, loginLabels, builderHref, publishPath }: Props) {
  const router = useRouter();
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const decksParam = searchParams.get("decks");
  const detected = useMemo(() => (mode === "edit" ? (initial?.codes ?? null) : mounted ? detectCodes(decksParam) : null), [mode, initial, mounted, decksParam]);
  const [override, setOverride] = useState<string | null>(null);
  const [builderNote, setBuilderNote] = useState<string | null>(null);
  const codes = override ?? detected;
  const decks = useMemo(() => (codes ? decodeSetCodes(codes) : null), [codes]);
  const [user, setUser] = useState<{ id: string } | null | undefined>(mode === "edit" ? { id: "owner" } : supabaseEnabled ? undefined : null);
  const [state, formAction, pending] = useActionState<DeckSetActionState, FormData>(mode === "edit" ? updateDeckSet : publishDeckSet, {});
  const [, startSubmit] = useTransition();
  const [words, setWords] = useState<number | null>(() => (initial ? deckSetFormWords((k) => initial.guide[k as keyof DeckSetGuide]) : null));
  const formRef = useRef<HTMLFormElement>(null);
  const sentLegendaries = useRef<string | null>(null);

  /* i tre codici restano in attesa nel browser: sopravvivono al giro dell'accesso */
  useEffect(() => {
    if (mode !== "create" || !codes) return;
    try {
      localStorage.setItem(DECK_SET_PENDING_KEY, codes);
    } catch {
      /* ignore */
    }
  }, [mode, codes]);

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
    if (!state.field) return;
    const el = document.getElementById(`set-${state.field}`);
    const det = el?.closest("details");
    if (det) det.open = true;
    el?.focus();
  }, [state]);

  useEffect(() => {
    if (!state.ok || !state.href) return;
    if (mode === "create") {
      try {
        localStorage.removeItem(DECK_SET_PENDING_KEY);
        localStorage.removeItem(DECK_SET_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      if (state.created && sentLegendaries.current) trackEvent("deck_set_published", { locale, legendary: sentLegendaries.current });
      sentLegendaries.current = null;
    }
    router.push(state.href);
  }, [state, router, mode, locale]);

  const nameOf = (slug: string, d: DeckState) => pool.find((c) => c.slug === slug)?.name ?? d.customCards.find((c) => c.slug === slug)?.name ?? slug;
  const incomplete = decks ? decks.some((d) => validateDeck(d).some((i) => i.level === "error")) : true;
  const issue = decks && !incomplete ? deckSetIssue(decks) : null;
  const restored = useMemo(() => (mode === "create" && mounted && codes ? readDraft(codes) : null), [mode, mounted, codes]);

  if (!supabaseEnabled) return <p className="card-night p-6 text-pale-muted">{labels.errors.disabled}</p>;
  if ((mode === "create" && !mounted) || user === undefined) return <p className="card-night p-6 text-pale-muted" aria-busy="true">…</p>;

  const issueText = !decks
    ? labels.noDecks
    : incomplete
      ? labels.issues.incomplete
      : issue?.code === "legendaries"
        ? labels.issues.legendaries
        : issue?.code === "similar"
          ? fill(labels.issues.similar, { a: letter(issue.decks[0]), b: letter(issue.decks[1]), n: String(issue.value), min: String(DECK_SET_MIN_DIFFERENT) })
          : issue
            ? labels.issues.count
            : null;

  if (issueText && mode === "create") {
    return (
      <div className="card-night p-6 sm:p-8">
        <p className="text-pale">{issueText}</p>
        <p className="mt-4 flex flex-wrap gap-3">
          <Link href={codes ? `${builderHref}#${codes}` : `${builderHref}?mode=tournament`} className="btn btn-ink">
            {labels.backToBuilder}
          </Link>
        </p>
        <PasteCodes labels={labels} onUse={(c) => setOverride(c)} />
      </div>
    );
  }

  if (!user) {
    const next = `${publishPath}?decks=${encodeURIComponent(codes ?? "")}`;
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        {decks ? <SetPreview decks={decks} nameOf={nameOf} deckLetterLabel={deckLetterLabel} /> : null}
        <div className="min-w-0">
          <p className="mb-4 text-chalk">{labels.loginFirst}</p>
          <LoginPanel next={next} labels={loginLabels} locale={locale} />
        </div>
      </div>
    );
  }

  const g = initial?.guide;
  const v = (k: (typeof DRAFT_FIELDS)[number], fallback?: string) => restored?.[k] ?? fallback;
  const mediaError = state.error ? (mediaLabels.errors as Record<string, string>)[state.error] : undefined;
  const errorText = state.error
    ? mediaError
      ? fillVideoLabel(mediaError, { n: mediaFieldRow(state.field) })
      : fill((labels.errors as Record<string, string>)[state.error] ?? labels.errors.db, { min: String(DECK_SET_MIN_DIFFERENT) })
    : null;
  const hasOptional = ["strengths", "weaknesses", "matchups", "notes"].some((k) => Boolean(restored?.[k as keyof DraftValues] || g?.[k as keyof DeckSetGuide])) || Boolean(initial?.videos?.length || initial?.links?.length);
  const meter = words === null ? null : { ok: words >= GUIDE_MIN_WORDS, text: fill(words >= GUIDE_MIN_WORDS ? labels.words.ok : labels.words.below, { n: String(words), min: String(GUIDE_MIN_WORDS) }) };

  const saveDraftOf = (form: HTMLFormElement) => {
    if (mode !== "create" || !codes) return;
    const fd = new FormData(form);
    const values: DraftValues = {};
    for (const k of DRAFT_FIELDS) {
      const val = fd.get(k);
      if (typeof val === "string" && val.trim()) values[k] = val;
    }
    try {
      localStorage.setItem(DECK_SET_DRAFT_KEY, JSON.stringify({ codes, values }));
    } catch {
      /* ignore */
    }
  };

  return (
    <form
      ref={formRef}
      // invio a mano: React 19 svuota i campi non controllati quando l'azione finisce, anche con un errore
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (mode === "create" && decks) sentLegendaries.current = decks.map((d) => d.legendary ?? "").join("|");
        startSubmit(() => formAction(fd));
      }}
      onChange={(e) => {
        saveDraftOf(e.currentTarget);
        const fd = new FormData(e.currentTarget);
        setWords(deckSetFormWords((k) => fd.get(k)));
      }}
      onInvalidCapture={(e) => {
        const det = (e.target as HTMLElement).closest("details");
        if (det) det.open = true;
      }}
      className="grid grid-cols-1 gap-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="codes" value={codes ?? ""} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <section className="card-night min-w-0 p-5 sm:p-6">
        <h2 className="t-section">{labels.decksTitle}</h2>
        {mode === "edit" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`${builderHref}#${codes ?? ""}`} className="btn btn-ink text-xs">
              {labels.openInBuilder}
            </Link>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => {
                const fromBuilder = builderSetCodes();
                const parsed = fromBuilder ? decodeSetCodes(fromBuilder) : null;
                if (!fromBuilder || !parsed || parsed.some((d) => validateDeck(d).some((i) => i.level === "error"))) {
                  setBuilderNote(labels.fromBuilderEmpty);
                  return;
                }
                setOverride(fromBuilder);
                setBuilderNote(labels.fromBuilderDone);
              }}
            >
              {labels.fromBuilder}
            </button>
            {builderNote ? (
              <span role="status" className="text-xs text-pale">
                {builderNote}
              </span>
            ) : null}
          </div>
        ) : null}
        {issueText ? (
          <p className="alert-bad mt-3" role="alert">
            {issueText}
          </p>
        ) : null}
        {decks ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {decks.map((d, i) => (
              <fieldset key={`${i}-${codes}`} className="min-w-0 rounded-xl border-2 border-sky bg-night-2/70 p-4">
                <legend className="px-1 font-display text-sm font-bold text-sky">{fill(deckLetterLabel, { letter: letter(i) })}</legend>
                <p className="rounded-lg bg-gold px-2 py-1 font-display text-xs font-bold text-ink">★ {d.legendary ? nameOf(d.legendary, d) : "—"}</p>
                <ul className="mt-2 space-y-0.5 text-xs text-pale">
                  {d.cards.map((s) => (
                    <li key={s}>
                      <span className="font-mono text-pale-muted">{RULES.copiesPerCard}×</span> {nameOf(s, d)}
                    </li>
                  ))}
                </ul>
                <label className="mt-3 block">
                  <span className="kicker text-pale-muted">{labels.deckName}</span>
                  <input
                    id={`set-deck_name_${i}`}
                    name={`deck_name_${i}`}
                    maxLength={60}
                    defaultValue={v(`deck_name_${i}` as `deck_name_${0 | 1 | 2}`, initial?.names[i] ?? d.name)}
                    className={inputCls}
                  />
                </label>
                <label className="mt-3 block">
                  <span className="kicker text-pale-muted">{labels.archetype}</span>
                  <select name={`archetype_${i}`} defaultValue={initial?.archetypes[i] ?? suggestArchetype(d)} className={inputCls}>
                    {archetypes.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block">
                  <span className="kicker text-pale-muted">{fill(labels.deckRole, { deck: fill(deckLetterLabel, { letter: letter(i) }) })}</span>
                  <textarea
                    id={`set-deck_${i + 1}`}
                    name={`deck_${i + 1}`}
                    rows={4}
                    maxLength={DECK_SET_GUIDE_LIMITS.sectionMax}
                    placeholder={labels.deckRolePlaceholder}
                    defaultValue={v(GUIDE_FIELDS[i], g?.[GUIDE_FIELDS[i]])}
                    className={inputCls}
                  />
                </label>
              </fieldset>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card-night min-w-0 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="kicker text-pale-muted">{labels.name} *</span>
            <input id="set-name" name="name" required minLength={3} maxLength={60} placeholder={labels.namePlaceholder} defaultValue={v("name", initial?.name)} className={inputCls} />
          </label>
          <label className="block">
            <span className="kicker text-pale-muted">{labels.lang}</span>
            <select name="lang" defaultValue={v("lang", g?.lang ?? locale)} className={inputCls} aria-describedby="set-lang-hint">
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeNames[l]}
                </option>
              ))}
            </select>
            <span id="set-lang-hint" className="mt-1 block text-xs text-pale-muted">
              {labels.langHint}
            </span>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="kicker text-pale-muted">{labels.summary} *</span>
          <textarea
            id="set-summary"
            name="summary"
            rows={4}
            required
            minLength={DECK_SET_GUIDE_LIMITS.summaryMin}
            maxLength={DECK_SET_GUIDE_LIMITS.summaryMax}
            placeholder={labels.summaryPlaceholder}
            defaultValue={v("summary", g?.summary)}
            className={inputCls}
          />
          <span className="mt-1 block text-xs text-pale-muted">{labels.summaryHint}</span>
        </label>
        {meter ? (
          <p className={`mt-2 text-xs ${meter.ok ? "text-good" : "text-pale-muted"}`} aria-live="polite">
            {meter.text}
          </p>
        ) : null}

        <details className="group mt-5 rounded-xl bg-night-2/80 px-4 py-3" open={hasOptional}>
          <summary className="cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 font-display text-sm font-bold text-sky">
              <span aria-hidden="true" className="inline-block transition group-open:rotate-90">
                ▸
              </span>
              {labels.moreDetails}
            </span>
            <span className="mt-1 block text-xs text-pale-muted">{labels.moreDetailsHint}</span>
          </summary>
          {(["strengths", "weaknesses", "matchups", "notes"] as const).map((k) => (
            <label key={k} className="mt-4 block">
              <span className="kicker text-pale-muted">{labels[k]}</span>
              <textarea id={`set-${k}`} name={k} rows={3} maxLength={DECK_SET_GUIDE_LIMITS.sectionMax} defaultValue={v(k, g?.[k])} className={inputCls} />
            </label>
          ))}
          <DeckMediaFields
            labels={mediaLabels}
            initialVideos={initial?.videos}
            initialLinks={initial?.links}
            draft={restored}
            onRowsChange={() => {
              if (formRef.current) saveDraftOf(formRef.current);
            }}
          />
        </details>

        <p className="mt-5 text-xs text-pale-muted">{labels.consent}</p>
        {errorText ? (
          <p className="alert-bad mt-3" role="alert">
            {errorText}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending || Boolean(issueText)} className="btn btn-primary">
            {pending ? (mode === "edit" ? labels.updating : labels.submitting) : mode === "edit" ? labels.update : labels.submit}
          </button>
          <Link href={`${builderHref}#${codes ?? ""}`} className="text-sm text-pale-muted underline underline-offset-2 hover:text-sky">
            {labels.backToBuilder}
          </Link>
        </div>
      </section>
    </form>
  );
}

/** I tre mazzi in anteprima accanto all'accesso. */
function SetPreview({ decks, nameOf, deckLetterLabel }: { decks: DeckState[]; nameOf: (s: string, d: DeckState) => string; deckLetterLabel: string }) {
  return (
    <aside className="card-night h-fit min-w-0 p-5">
      <ul className="space-y-3">
        {decks.map((d, i) => (
          <li key={i}>
            <p className="kicker text-pale-muted">{fill(deckLetterLabel, { letter: letter(i) })}</p>
            <p className="mt-1 rounded-lg bg-gold px-2 py-1 font-display text-xs font-bold text-ink">★ {d.legendary ? nameOf(d.legendary, d) : "—"}</p>
            <p className="mt-1 text-xs text-pale">{d.cards.map((s) => nameOf(s, d)).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Casella per incollare i tre codici quando nel browser non c'è un trio. */
function PasteCodes({ labels, onUse }: { labels: DeckSetLabels["form"]; onUse: (codes: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  return (
    <form
      className="mt-6"
      onSubmit={(e) => {
        e.preventDefault();
        const decks = decodeSetCodes(text);
        if (!decks) {
          setError(true);
          return;
        }
        setError(false);
        onUse(joinSetCodes(decks.map((d) => encodeOmCode(d))));
      }}
    >
      <label className="block">
        <span className="kicker text-pale-muted">{labels.pasteLabel}</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoComplete="off" placeholder="OM1.… / https://originsmeta.com/…/deck-builder#OM1.…" className={`${inputCls} font-mono text-xs`} />
        <span className="mt-1 block text-xs text-pale-muted">{labels.pasteHint}</span>
      </label>
      {error ? (
        <p className="text-error mt-2 text-sm" role="alert">
          {labels.pasteError}
        </p>
      ) : null}
      <button type="submit" disabled={!text.trim()} className="btn btn-primary mt-3">
        {labels.pasteSubmit}
      </button>
    </form>
  );
}
