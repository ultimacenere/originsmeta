"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { initials } from "@/lib/cardArt";
import { RULES, emptyDeck, isComplete, manaCurve, sharedCards, differentCards, validateConquest, validateDeck, type BuilderCard, type DeckState } from "@/lib/deckrules";
import { GAME_PREFIX, OM_PREFIX, baseKey, decodeGameCode, decodeOmCode, encodeGameCode, encodeOmCode, parseTextList, toTextList } from "@/lib/deckcode";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";

type Issues = {
  missingLegendary: string;
  tooFewCards: string;
  tooManyCards: string;
  duplicateCard: string;
  hasCustom: string;
  duplicateLegendary: string;
  tooSimilar: string;
};

export type BuilderLabels = {
  modeSingle: string;
  modeTournament: string;
  deckName: string;
  deckNamePlaceholder: string;
  legendarySlot: string;
  pickLegendary: string;
  slots: string;
  slotsHint: string;
  pool: string;
  poolHint: string;
  searchPool: string;
  all: string;
  cost: string;
  add: string;
  remove: string;
  inDeck: string;
  full: string;
  curve: string;
  valid: string;
  invalid: string;
  issues: Issues;
  customTitle: string;
  customHint: string;
  customName: string;
  customCost: string;
  customLegendary: string;
  customAdd: string;
  actions: string;
  copyLink: string;
  copied: string;
  exportText: string;
  exportGame: string;
  exportGameMissing: string;
  importTitle: string;
  importHint: string;
  importButton: string;
  importOk: string;
  importUnknown: string;
  importError: string;
  teachTitle: string;
  teachHint: string;
  teachSend: string;
  save: string;
  saved: string;
  clear: string;
  submit: string;
  submitHint: string;
  publish: string;
  publishHint: string;
  publishLocked: string;
  lockedHint: string;
  tournamentTitle: string;
  tournamentHint: string;
  minDifferent: string;
  diffTable: string;
  shared: string;
  deckLabel: string;
  ok: string;
  restored: string;
  typeUnit: string;
  typeSpell: string;
  legendary: string;
  unit: string;
  spell: string;
};

type Persisted = { mode: "single" | "tournament"; active: number; decks: DeckState[]; keyMap: Record<string, string> };

const STORAGE_DEFAULT = "originsmeta.deckbuilder.v1";
const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** Regole imposte da un torneo (Tournament Organizer): modalità, numero di mazzi e carte diverse non modificabili, memoria separata. */
export type BuilderPreset = { mode: "single" | "tournament"; deckCount: number; minDifferent: number; storageKey: string };
export type SubmitLabels = { submit: string; submitting: string; saved: string; incomplete: string; errors: Record<string, string> };

export function DeckBuilder({
  pool,
  labels,
  contactEmail,
  shareBase,
  publishHref,
  preset,
  onSubmit,
  submitLabels,
}: {
  pool: BuilderCard[];
  labels: BuilderLabels;
  contactEmail: string;
  shareBase: string;
  /** pagina "Pubblica sul sito": riceve il mazzo nell'hash (#OM1…) */
  publishHref: string;
  preset?: BuilderPreset;
  /** consegna dei codici al torneo (Server Action): sostituisce il bottone "Pubblica" */
  onSubmit?: (codes: string[]) => Promise<{ error?: string; ok?: boolean }>;
  submitLabels?: SubmitLabels;
}) {
  const count = preset?.deckCount ?? 3;
  const locked = Boolean(preset);
  const storageKey = preset?.storageKey ?? STORAGE_DEFAULT;
  const indices = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  const [mode, setMode] = useState<"single" | "tournament">(preset?.mode ?? "single");
  const [active, setActive] = useState(0);
  const [decks, setDecks] = useState<DeckState[]>(() => Array.from({ length: count }, () => emptyDeck()));
  const [keyMap, setKeyMap] = useState<Record<string, string>>({});
  const [minDifferent, setMinDifferent] = useState<number>(preset?.minDifferent ?? RULES.conquestMinDifferent);
  const [submitState, setSubmitState] = useState<"idle" | "saved" | string>("idle");
  const [submitting, startSubmit] = useTransition();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "unit" | "spell">("all");
  const [costFilter, setCostFilter] = useState<"all" | string>("all");
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState<string>("");
  const [unknownKeys, setUnknownKeys] = useState<string[]>([]);
  const [teach, setTeach] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState("");
  const [customCost, setCustomCost] = useState("");
  const [customLegendary, setCustomLegendary] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const deck = decks[active];

  /* Accesso: "pubblica sul sito" è riservato agli utenti registrati (lucchetto); builder, link e codici restano liberi. */
  const [loggedIn, setLoggedIn] = useState<boolean | null>(supabaseEnabled ? null : false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setLoggedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setLoggedIn(Boolean(session));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const lookup = useCallback(
    (slug: string): BuilderCard | undefined => pool.find((c) => c.slug === slug) ?? decks.flatMap((d) => d.customCards).find((c) => c.slug === slug),
    [pool, decks],
  );

  /* --- ripristino da link o da browser (una volta, dopo l'idratazione: sul server non c'è storage) --- */
  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum di hash e localStorage al montaggio */
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith(OM_PREFIX)) {
        const d = decodeOmCode(hash);
        if (d) {
          setDecks([d, ...Array.from({ length: Math.max(0, count - 1) }, () => emptyDeck())]);
          setNotice(labels.restored);
          setHydrated(true);
          return;
        }
      }
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        if (Array.isArray(p.decks) && p.decks.length) setDecks(Array.from({ length: count }, (_, i) => ({ ...emptyDeck(), ...(p.decks[i] ?? {}) })));
        if (!locked && (p.mode === "single" || p.mode === "tournament")) setMode(p.mode);
        if (typeof p.active === "number") setActive(Math.min(count - 1, Math.max(0, p.active)));
        if (p.keyMap && typeof p.keyMap === "object") setKeyMap(p.keyMap);
      }
    } catch {
      /* storage non disponibile */
    }
    setHydrated(true);
  }, [labels.restored, storageKey, count, locked]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persist = useCallback(
    (next: Partial<Persisted>) => {
      try {
        const cur: Persisted = { mode, active, decks, keyMap, ...next };
        localStorage.setItem(storageKey, JSON.stringify(cur));
      } catch {
        /* ignore */
      }
    },
    [mode, active, decks, keyMap, storageKey],
  );

  const updateDeck = (fn: (d: DeckState) => DeckState) => {
    setDecks((prev) => prev.map((d, i) => (i === active ? fn(d) : d)));
  };

  /* --- pool filtrato --- */
  const visiblePool = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool
      .filter((c) => c.type !== "token")
      // scelta la Leggendaria, le altre spariscono dalla lista
      .filter((c) => !c.legendary || !deck.legendary || c.slug === deck.legendary)
      .filter((c) => (typeFilter === "all" ? true : c.type === typeFilter))
      .filter((c) => (costFilter === "all" ? true : costFilter === "8" ? (c.mana ?? 0) >= 8 : String(c.mana ?? "?") === costFilter))
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.sagaLabel.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.legendary) - Number(a.legendary) || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
  }, [pool, q, typeFilter, costFilter, deck.legendary]);

  const addCard = (c: BuilderCard) => {
    updateDeck((d) => {
      if (c.legendary) return { ...d, legendary: c.slug };
      if (d.cards.includes(c.slug) || d.cards.length >= RULES.distinctCards) return d;
      return { ...d, cards: [...d.cards, c.slug] };
    });
  };
  const removeCard = (slug: string) => {
    updateDeck((d) => ({ ...d, legendary: d.legendary === slug ? null : d.legendary, cards: d.cards.filter((s) => s !== slug) }));
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const slug = `custom:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const card: BuilderCard = { slug, name, type: "unit", legendary: customLegendary, mana: customCost ? Number(customCost) : undefined, sagaLabel: "custom", custom: true };
    updateDeck((d) => {
      const customCards = d.customCards.some((c) => c.slug === slug) ? d.customCards : [...d.customCards, card];
      if (card.legendary) return { ...d, customCards, legendary: slug };
      if (d.cards.includes(slug) || d.cards.length >= RULES.distinctCards) return { ...d, customCards };
      return { ...d, customCards, cards: [...d.cards, slug] };
    });
    setCustomName("");
    setCustomCost("");
    setCustomLegendary(false);
  };

  /* --- import --- */
  const doImport = async () => {
    const text = importText.trim();
    setUnknownKeys([]);
    if (!text) return;
    if (text.includes(GAME_PREFIX)) {
      const res = await decodeGameCode(text);
      if ("error" in res) {
        setNotice(labels.importError);
        return;
      }
      const byKey = new Map<string, BuilderCard>();
      for (const c of pool) if (c.key) byKey.set(baseKey(c.key), c);
      for (const [k, slug] of Object.entries(keyMap)) {
        const c = pool.find((x) => x.slug === slug);
        if (c) byKey.set(baseKey(k), c);
      }
      const matched: BuilderCard[] = [];
      const unknown: string[] = [];
      for (const k of res.keys) {
        const c = byKey.get(baseKey(k));
        if (c) matched.push(c);
        else unknown.push(baseKey(k));
      }
      applyCards(matched);
      setUnknownKeys(unknown);
      setNotice(unknown.length ? `${fmt(labels.importOk, { n: matched.length })} ${fmt(labels.importUnknown, { list: unknown.join(", ") })}` : fmt(labels.importOk, { n: matched.length }));
      return;
    }
    if (text.includes(OM_PREFIX)) {
      const d = decodeOmCode(text);
      if (!d) {
        setNotice(labels.importError);
        return;
      }
      updateDeck(() => d);
      setNotice(fmt(labels.importOk, { n: d.cards.length + (d.legendary ? 1 : 0) }));
      return;
    }
    const entries = parseTextList(text);
    const matched: BuilderCard[] = [];
    const unknown: string[] = [];
    for (const e of entries) {
      const c = pool.find((x) => x.name.toLowerCase() === e.name.toLowerCase());
      if (c) matched.push(c);
      else unknown.push(e.name);
    }
    applyCards(matched);
    setNotice(unknown.length ? `${fmt(labels.importOk, { n: matched.length })} ${fmt(labels.importUnknown, { list: unknown.join(", ") })}` : fmt(labels.importOk, { n: matched.length }));
  };

  const applyCards = (cards: BuilderCard[]) => {
    if (cards.length === 0) return; // niente di riconosciuto: il mazzo resta com'è
    updateDeck((d) => {
      const legendary = cards.find((c) => c.legendary)?.slug ?? d.legendary;
      const base = Array.from(new Set(cards.filter((c) => !c.legendary).map((c) => c.slug))).slice(0, RULES.distinctCards);
      return { ...d, legendary, cards: base };
    });
  };

  /* --- export --- */
  const copy = async (text: string, okLabel = labels.copied) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(okLabel);
    } catch {
      setNotice(text);
    }
  };
  const missingKeys = useMemo(() => {
    const slugs = [deck.legendary, ...deck.cards].filter(Boolean) as string[];
    return slugs.filter((s) => {
      const c = lookup(s);
      if (!c) return true;
      if (c.key) return false;
      return !Object.entries(keyMap).some(([, v]) => v === s);
    });
  }, [deck, lookup, keyMap]);

  const exportGame = async () => {
    const slugs = [deck.legendary, ...deck.cards].filter(Boolean) as string[];
    const keys = slugs.map((s) => lookup(s)?.key ?? Object.entries(keyMap).find(([, v]) => v === s)?.[0]).filter(Boolean) as string[];
    if (keys.length !== slugs.length) {
      setNotice(fmt(labels.exportGameMissing, { n: missingKeys.length }));
      return;
    }
    copy(await encodeGameCode(keys));
  };

  const shareLink = `${shareBase}#${encodeOmCode(deck)}`;
  const textList = toTextList(deck, lookup);
  const issues = validateDeck(deck);
  const complete = isComplete(deck);
  const curve = manaCurve(deck, lookup);
  const maxCurve = Math.max(1, ...curve);
  const conquestIssues = mode === "tournament" ? validateConquest(decks, minDifferent) : [];
  /* consegna al torneo: tutti i mazzi richiesti completi e regole Conquest rispettate */
  const submittable = mode === "tournament" ? decks.slice(0, count).every((d) => isComplete(d)) && conquestIssues.length === 0 : complete;

  const sendTeach = () => {
    const lines = Object.entries(teach)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} = ${v}`);
    if (!lines.length) return;
    setKeyMap((m) => {
      const next = { ...m, ...Object.fromEntries(Object.entries(teach).filter(([, v]) => v)) };
      persist({ keyMap: next });
      return next;
    });
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Origins TCG card keys")}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  const issueText = (code: string) => (labels.issues as Record<string, string>)[code] ?? code;

  const slotCard = (slug: string) => lookup(slug);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ---------- mazzo ---------- */}
      <section className="card-night p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {locked ? (
            <span className="rounded-full border border-sky px-3 py-1 font-display text-xs font-bold text-sky">{mode === "single" ? labels.modeSingle : labels.modeTournament}</span>
          ) : (
            <div className="flex gap-1 rounded-full border border-sky p-0.5">
              {(["single", "tournament"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    persist({ mode: m });
                  }}
                  className={`rounded-full px-3 py-1 font-display text-xs font-bold ${mode === m ? "bg-night-3 text-sky" : "text-pale-muted hover:text-sky"}`}
                >
                  {m === "single" ? labels.modeSingle : labels.modeTournament}
                </button>
              ))}
            </div>
          )}
          {mode === "tournament" ? (
            <div className="flex gap-1">
              {indices.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActive(i);
                    persist({ active: i });
                  }}
                  className={`rounded-lg px-3 py-1 font-display text-xs font-bold ${active === i ? "bg-mint text-ink" : "border border-sky text-pale-muted"}`}
                >
                  {labels.deckLabel} {String.fromCharCode(65 + i)} {isComplete(decks[i]) ? "✓" : ""}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className="kicker text-pale-muted">{labels.deckName}</span>
          <input
            id={`deck-name-${active}`}
            value={deck.name}
            onChange={(e) => updateDeck((d) => ({ ...d, name: e.target.value.slice(0, 60) }))}
            placeholder={labels.deckNamePlaceholder}
            className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale"
          />
        </label>

        <div className="mt-4 flex items-center justify-between">
          <span className={`stat-pill font-bold ${complete ? "bg-mint-deep text-chalk" : "bg-crimson/15 text-crimson"}`}>{complete ? labels.valid : labels.invalid}</span>
          <span className="font-mono text-sm text-pale-muted">
            {(deck.legendary ? 1 : 0) + deck.cards.length * RULES.copiesPerCard} / {RULES.deckSize}
          </span>
        </div>
        {issues.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {issues.map((i) => (
              <li key={i.code} className={i.level === "error" ? "text-crimson" : "text-pale-muted"}>
                • {issueText(i.code)}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Leggendaria */}
        <h3 className="mt-5 text-lg font-extrabold text-sky">{labels.legendarySlot}</h3>
        {deck.legendary && slotCard(deck.legendary) ? (
          <DeckRow card={slotCard(deck.legendary)!} copies={1} onRemove={() => removeCard(deck.legendary!)} removeLabel={labels.remove} />
        ) : (
          <p className="mt-1 rounded-lg border border-dashed border-sky px-3 py-3 text-sm text-pale-muted">{labels.pickLegendary}</p>
        )}

        {/* Carte base */}
        <h3 className="mt-5 text-lg font-extrabold text-sky">
          {labels.slots} <span className="font-mono text-sm font-normal text-pale-muted">{deck.cards.length}/{RULES.distinctCards} · {labels.slotsHint}</span>
        </h3>
        <ul className="mt-2 space-y-1.5">
          {deck.cards.map((s) => {
            const c = slotCard(s);
            return c ? (
              <li key={s}>
                <DeckRow card={c} copies={RULES.copiesPerCard} onRemove={() => removeCard(s)} removeLabel={labels.remove} />
              </li>
            ) : null;
          })}
          {Array.from({ length: Math.max(0, RULES.distinctCards - deck.cards.length) }).map((_, i) => (
            <li key={`empty-${i}`} className="h-9 rounded-lg border border-dashed border-sky" aria-hidden="true" />
          ))}
        </ul>

        {/* Curva */}
        <h3 className="mt-5 text-lg font-extrabold text-sky">{labels.curve}</h3>
        <div className="mt-2 flex h-24 items-end gap-1">
          {curve.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-pale-muted">{n || ""}</span>
              <div className="w-full rounded-t bg-mint-deep" style={{ height: `${(n / maxCurve) * 64}px` }} />
              <span className="font-mono text-[10px] text-pale-muted">{i === 8 ? "8+" : i}</span>
            </div>
          ))}
        </div>

        {/* Azioni */}
        <h3 className="mt-5 text-lg font-extrabold text-sky">{labels.actions}</h3>
        {loggedIn === false && !onSubmit ? <p className="mt-1 text-xs text-pale-muted">{labels.lockedHint}</p> : null}
        {submitLabels && submitState !== "idle" ? (
          <p role="status" className={`mt-1 text-sm ${submitState === "saved" ? "font-semibold text-good" : "text-bad"}`}>
            {submitState === "saved" ? submitLabels.saved : submitState}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {onSubmit && submitLabels ? (
            /* Tournament Organizer: consegna dei mazzi al torneo al posto di "Pubblica" */
            <button
              type="button"
              className="btn btn-mint text-xs"
              disabled={submitting || !submittable}
              title={submittable ? undefined : submitLabels.incomplete}
              onClick={() =>
                startSubmit(async () => {
                  setSubmitState("idle");
                  const codes = decks.slice(0, mode === "tournament" ? count : 1).map((d) => encodeOmCode(d));
                  const r = await onSubmit(codes);
                  setSubmitState(r.error ? (submitLabels.errors[r.error] ?? submitLabels.errors.db ?? r.error) : "saved");
                })
              }
            >
              {submitting ? submitLabels.submitting : submitLabels.submit}
            </button>
          ) : complete ? (
            <a className="btn btn-mint text-xs" href={`${publishHref}#${encodeOmCode(deck)}`} title={loggedIn === false ? labels.publishLocked : labels.publishHint}>
              {loggedIn === false ? <LockIcon /> : null}
              {labels.publish}
            </a>
          ) : (
            <span className="btn cursor-not-allowed border border-sky text-xs text-pale-muted" title={labels.publishHint} aria-disabled="true">
              {loggedIn === false ? <LockIcon /> : null}
              {labels.publish}
            </span>
          )}
          <button type="button" className="btn btn-ink text-xs" onClick={() => copy(shareLink)}>
            {labels.copyLink}
          </button>
          <button type="button" className="btn btn-ink text-xs" onClick={() => copy(textList)}>
            {labels.exportText}
          </button>
          <button type="button" className="btn btn-ink text-xs" onClick={exportGame} title={missingKeys.length ? fmt(labels.exportGameMissing, { n: missingKeys.length }) : undefined}>
            {labels.exportGame}
            {missingKeys.length ? ` (${missingKeys.length}?)` : ""}
          </button>
          <button
            type="button"
            className="btn btn-mint text-xs"
            onClick={() => {
              persist({ decks });
              setNotice(labels.saved);
            }}
          >
            {labels.save}
          </button>
          <a
            className="btn border border-sky text-xs text-pale"
            href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Deck OriginsMeta: ${deck.name || "senza nome"}`)}&body=${encodeURIComponent(`${textList}\n\n${shareLink}\n\n`)}`}
            title={labels.submitHint}
          >
            {labels.submit}
          </a>
          <button
            type="button"
            className="btn border border-sky text-xs text-pale hover:text-crimson"
            onClick={() => updateDeck((d) => ({ ...emptyDeck(d.name), customCards: [] }))}
          >
            {labels.clear}
          </button>
        </div>
        {notice ? (
          <p className="mt-3 break-all rounded-lg bg-chalk/5 px-3 py-2 font-mono text-xs text-pale" aria-live="polite">
            {notice}
          </p>
        ) : null}

        {/* Import */}
        <h3 className="mt-5 text-lg font-extrabold text-sky">{labels.importTitle}</h3>
        <p className="mt-1 text-xs text-pale-muted">{labels.importHint}</p>
        <textarea
          id="deck-import"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-sky bg-night px-3 py-2 font-mono text-xs text-pale"
        />
        <button type="button" className="btn btn-ink mt-2 text-xs" onClick={doImport}>
          {labels.importButton}
        </button>

        {unknownKeys.length ? (
          <div className="mt-4 rounded-lg border border-gold bg-gold/15 p-3">
            <h4 className="font-display text-sm font-bold text-sky">{labels.teachTitle}</h4>
            <p className="mt-1 text-xs text-pale-muted">{labels.teachHint}</p>
            <ul className="mt-2 space-y-1">
              {unknownKeys.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <code className="font-mono text-xs">{k}</code>
                  <select
                    value={teach[k] ?? ""}
                    onChange={(e) => setTeach((t) => ({ ...t, [k]: e.target.value }))}
                    className="flex-1 rounded border border-sky bg-night px-2 py-1 text-xs"
                  >
                    <option value="">—</option>
                    {pool.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ink mt-2 text-xs" onClick={sendTeach}>
              {labels.teachSend}
            </button>
          </div>
        ) : null}

        {/* Conquest */}
        {mode === "tournament" ? (
          <div className="mt-6 rounded-lg border border-sky p-4">
            <h3 className="text-lg font-extrabold text-sky">{labels.tournamentTitle}</h3>
            <p className="mt-1 text-xs text-pale-muted">{fmt(labels.tournamentHint, { min: minDifferent })}</p>
            <label className="mt-2 flex items-center gap-2 text-xs text-pale-muted">
              {labels.minDifferent}
              <input
                id="conquest-min"
                type="number"
                min={1}
                max={25}
                value={minDifferent}
                readOnly={locked}
                onChange={(e) => setMinDifferent(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
                className="w-16 rounded border border-sky bg-night px-2 py-1 font-mono text-pale"
              />
            </label>
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left text-pale-muted">
                  <th className="py-1">{labels.diffTable}</th>
                  {indices.map((i) => (
                    <th key={i} className="py-1">
                      {String.fromCharCode(65 + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indices.map((i) => (
                  <tr key={i} className="border-t border-sky">
                    <td className="py-1 font-bold">
                      {labels.deckLabel} {String.fromCharCode(65 + i)}
                    </td>
                    {indices.map((j) => {
                      if (i === j) return <td key={j} className="py-1 font-mono text-pale-muted">—</td>;
                      const diff = differentCards(decks[i], decks[j]);
                      const ok = diff >= minDifferent;
                      return (
                        <td key={j} className={`py-1 font-mono ${ok ? "text-mint" : "text-crimson"}`} title={`${labels.shared}: ${sharedCards(decks[i], decks[j]).map((s) => lookup(s)?.name ?? s).join(", ") || "—"}`}>
                          {diff} {ok ? "✓" : "✗"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {conquestIssues.length ? (
              <ul className="mt-2 space-y-1 text-sm text-crimson">
                {conquestIssues.map((c, i) => (
                  <li key={i}>
                    • {c.code === "tooSimilar" && c.decks ? fmt(labels.issues.tooSimilar, { a: String.fromCharCode(65 + c.decks[0]), b: String.fromCharCode(65 + c.decks[1]), n: c.value ?? 0, min: minDifferent }) : issueText(c.code)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-bold text-mint">{labels.ok} ✓</p>
            )}
          </div>
        ) : null}
      </section>

      {/* ---------- pool ---------- */}
      <section className="felt-panel p-5">
        <h3 className="text-lg font-extrabold text-sky">{labels.pool}</h3>
        <p className="mt-1 text-xs text-chalk-muted">{labels.poolHint}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr]">
          <input
            id="pool-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.searchPool}
            className="rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk"
          />
          <select id="pool-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk">
            <option value="all">{labels.all}</option>
            <option value="unit">{labels.typeUnit}</option>
            <option value="spell">{labels.typeSpell}</option>
          </select>
          <select id="pool-cost" value={costFilter} onChange={(e) => setCostFilter(e.target.value)} className="rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk">
            <option value="all">
              {labels.cost}: {labels.all}
            </option>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
              <option key={c} value={String(c)}>
                {c}
              </option>
            ))}
            <option value="8">8+</option>
          </select>
        </div>
        <ul className="mt-3 max-h-[640px] space-y-1 overflow-y-auto pr-1">
          {visiblePool.map((c) => {
            const inDeck = deck.legendary === c.slug || deck.cards.includes(c.slug);
            const full = !c.legendary && deck.cards.length >= RULES.distinctCards;
            return (
              <li
                key={c.slug}
                role="button"
                tabIndex={0}
                aria-pressed={inDeck}
                onClick={() => (inDeck ? removeCard(c.slug) : full ? undefined : addCard(c))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (inDeck) removeCard(c.slug);
                    else if (!full) addCard(c);
                  }
                }}
                className={`builder-row deck-card-wrap has-peek ${c.legendary ? "is-legendary" : ""} ${inDeck ? "is-in-deck" : ""}`}
                title={c.name}
                style={c.thumb ? ({ ["--row-art" as string]: `url(${c.thumb})` } as React.CSSProperties) : undefined}
              >
                <BuilderArt card={c} />
                <span className="builder-row-text">
                  <span className="builder-row-name">
                    {c.legendary ? "★ " : ""}
                    {c.name}
                  </span>
                  <span className="builder-row-stats">
                    {c.mana ?? "?"} · {c.type === "unit" ? `${c.power ?? "?"}/${c.health ?? "?"}` : labels.spell} · {c.sagaLabel}
                  </span>
                </span>
                <BuilderPeek card={c} />
                {inDeck ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(c.slug);
                    }}
                    className="stat-pill bg-night-3 text-chalk text-[10px]"
                  >
                    {labels.inDeck} ✕
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addCard(c);
                    }}
                    disabled={full}
                    className={`stat-pill text-[10px] font-bold ${full ? "bg-chalk/10 text-pale-muted" : "bg-mint text-ink"}`}>
                    {full ? labels.full : `+ ${labels.add}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-lg border border-felt-line p-3">
          <h4 className="font-display text-sm font-bold text-sky">{labels.customTitle}</h4>
          <p className="mt-1 text-xs text-chalk-muted">{labels.customHint}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1.6fr_0.6fr_auto]">
            <input id="custom-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={labels.customName} className="rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk" />
            <input id="custom-cost" type="number" min={0} max={12} value={customCost} onChange={(e) => setCustomCost(e.target.value)} placeholder={labels.customCost} className="rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk" />
            <label className="flex items-center gap-2 text-xs text-chalk-muted">
              <input id="custom-legendary" type="checkbox" checked={customLegendary} onChange={(e) => setCustomLegendary(e.target.checked)} />
              {labels.customLegendary}
            </label>
          </div>
          <button type="button" className="btn btn-ghost mt-2 text-xs" onClick={addCustom}>
            {labels.customAdd}
          </button>
        </div>
        {!hydrated ? <span className="sr-only">…</span> : null}
      </section>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="-ml-0.5">
      <path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zm-8 0V7a3 3 0 0 1 6 0v2H9z" />
    </svg>
  );
}

/** Riquadro della carta nel builder: si usa la finestra d'illustrazione, non la carta intera, perché in un
 *  riquadro così piccolo la carta rimpicciolita è illeggibile mentre il volto del personaggio si riconosce.
 *  Iniziali sulle carte che il materiale non copre e su quelle inserite a mano. Lazy: nel pool sono decine. */
function BuilderArt({ card }: { card: BuilderCard }) {
  const src = card.art ?? card.thumb;
  return (
    <span className={`card-chip-art !h-11 !w-9 shrink-0 text-[10px] ${card.legendary ? "is-legendary" : ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        initials(card.name)
      )}
    </span>
  );
}

/** Anteprima al passaggio del mouse, come nell'elenco dei mazzi: nome, costo, statistiche e testo dell'abilità.
 *  Su touch non esiste (`hover: none`) e resta il nome nel `title`. */
function BuilderPeek({ card }: { card: BuilderCard }) {
  if (!card.ability && card.power === undefined) return null;
  return (
    <span className="deck-peek" aria-hidden="true">
      <span className={`deck-peek-panel ${card.legendary ? "is-legendary" : ""}`}>
        {card.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="deck-peek-art" src={card.thumb} alt="" loading="lazy" decoding="async" />
        ) : null}
        <span className="deck-peek-body">
          <span className="deck-peek-name">
            {card.legendary ? "★ " : ""}
            {card.name}
          </span>
          <span className="deck-peek-tags">
            {card.mana !== undefined ? <span className="deck-peek-mana">{card.mana}</span> : null}
            {card.power !== undefined ? (
              <span className="deck-peek-stats">
                {card.power} / {card.health}
              </span>
            ) : null}
            {card.typeLabel ? <span className="deck-peek-type">{card.typeLabel}</span> : null}
            {card.alignmentLabel ? <span className={`deck-peek-align is-${card.alignment}`}>{card.alignmentLabel}</span> : null}
          </span>
          {card.ability ? <span className="deck-peek-text">{card.ability}</span> : null}
        </span>
      </span>
    </span>
  );
}

function DeckRow({ card, copies, onRemove, removeLabel }: { card: BuilderCard; copies: number; onRemove: () => void; removeLabel: string }) {
  return (
    <div
      className={`builder-row is-in-deck deck-card-wrap has-peek ${card.legendary ? "is-legendary" : ""}`}
      title={card.name}
      style={card.thumb ? ({ ["--row-art" as string]: `url(${card.thumb})` } as React.CSSProperties) : undefined}
    >
      <span className="builder-row-copies">{copies}×</span>
      <BuilderArt card={card} />
      <span className="builder-row-text">
        <span className="builder-row-name">
          {card.legendary ? "★ " : ""}
          {card.name}
          {card.custom ? " *" : ""}
        </span>
        <span className="builder-row-stats">
          {card.mana ?? "?"} · {card.type === "unit" ? `${card.power ?? "?"}/${card.health ?? "?"}` : "spell"}
        </span>
      </span>
      <button type="button" onClick={onRemove} className="builder-row-x" aria-label={`${removeLabel} ${card.name}`}>
        ✕
      </button>
      <BuilderPeek card={card} />
    </div>
  );
}
