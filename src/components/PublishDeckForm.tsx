"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isLocale, localeNames, locales, type Dictionary } from "@/lib/i18n";
import { GAME_PREFIX, OM_PREFIX, baseKey, decodeGameCode, decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { RULES, validateDeck, type DeckState } from "@/lib/deckrules";
import { publishDeck, updateDeck, type ActionState } from "@/lib/community/actions";
import { BUILDER_STORAGE_KEY, GUIDE_DRAFT_KEY, PENDING_PUBLISH_KEY, deckTypes, guideSections, type Guide } from "@/lib/community/types";
import { suggestArchetype } from "@/lib/archetype";
import { guideFormWords, guideMeter } from "@/lib/community/deckQuality";
import { legendaryParam, trackEvent, type EventParams } from "@/lib/analytics";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";
import { LoginPanel } from "./LoginPanel";
import type { LoginLabels } from "@/lib/loginLabels";
import { MEDIA_FIELD_NAMES, fillVideoLabel, mediaFieldRow, type DeckLink, type StoredVideo } from "@/lib/videos";
import type { VideoFormLabels } from "@/lib/videoLabels";
import { DeckMediaFields } from "./DeckMediaFields";

/** Carta del database per l'anteprima e per l'import dei codici del gioco (`key` = ID ufficiale, se noto). */
export type PoolCard = { slug: string; name: string; legendary: boolean; key?: string };
/** Mazzo da modificare. `videos` e `links` dal 26/09/2026 (pacchetto VIDEO): al posto del vecchio campo `video`. */
export type InitialDeck = { id: string; code: string; name: string; archetype: string; deckTypes: string[]; videos?: StoredVideo[]; links?: DeckLink[]; guide: Guide };

type Labels = Dictionary["community"];

type Props = {
  locale: string;
  mode: "create" | "edit";
  pool: PoolCard[];
  archetypes: [string, string][];
  initial?: InitialDeck;
  labels: Labels;
  /** etichette di video e risorse nella lingua della pagina (`videoFormLabels`, pacchetto VIDEO del 26/09/2026) */
  mediaLabels: VideoFormLabels;
  loginLabels: LoginLabels;
  builderHref: string;
  /** percorso della pagina di pubblicazione, usato come ritorno dopo l'accesso */
  publishPath: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";

/** Campi di testo salvati nella bozza locale della guida (le caselle e i menu si rifanno in un attimo). */
const DRAFT_FIELDS = ["name", "lang", "summary", ...guideSections, ...MEDIA_FIELD_NAMES] as const;
type DraftValues = Partial<Record<(typeof DRAFT_FIELDS)[number], string>>;

/**
 * Mazzo da pubblicare, in ordine:
 * 1. `?deck=<codice OM1>` nel link. È la prima fonte perché sopravvive al giro di accesso anche quando il link
 *    via email si apre in un altro contesto (la webview di Gmail, un altro browser) dove localStorage è vuoto:
 *    per questo il ritorno dopo l'accesso porta sempre con sé il codice (vedi `loginNext`).
 * 2. hash del link (#OM1…), come lo apre il deck builder;
 * 3. mazzo in attesa (salvato qui prima dell'accesso);
 * 4. mazzo attivo del builder in questo browser.
 * Un codice del gioco (KGBLDC…) in `?deck=` lo converte `importDeckCode`, che è asincrono.
 * `deckParam` arriva da `useSearchParams()`, non da window.location: in una navigazione lato client (il tasto
 * "Pubblica" di /account) il primo render vede ancora l'indirizzo della pagina di prima.
 */
function detectCode(deckParam: string | null): string | null {
  try {
    const q = deckParam?.trim();
    if (q && q.includes(OM_PREFIX)) return q.slice(q.indexOf(OM_PREFIX));
    // il codice del gioco lo converte l'effetto apposito: intanto niente mazzo, piuttosto che uno sbagliato
    if (q && q.includes(GAME_PREFIX)) return null;
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

/** Chiavi ufficiali che il deck builder ha imparato in questo browser importando codici del gioco. */
function learnedKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as { keyMap?: unknown }).keyMap : null;
    return map && typeof map === "object" ? (map as Record<string, string>) : {};
  } catch {
    return {};
  }
}

type Imported = { ok: true; code: string; unknown: number } | { ok: false };

/**
 * Codice incollato (o arrivato in `?deck=`) → codice OM1. Accetta il codice OriginsMeta e quello del gioco
 * (KGBLDC…): le carte del secondo si riconoscono dall'ID ufficiale (`key`); quelle che non conosciamo ancora
 * si contano per dirlo all'utente, come fa l'import del deck builder.
 */
async function importDeckCode(text: string, pool: PoolCard[]): Promise<Imported> {
  const t = text.trim();
  if (t.includes(OM_PREFIX)) {
    const d = decodeOmCode(t);
    return d ? { ok: true, code: encodeOmCode(d), unknown: 0 } : { ok: false };
  }
  if (!t.includes(GAME_PREFIX)) return { ok: false };
  const res = await decodeGameCode(t);
  if ("error" in res) return { ok: false };
  const byKey = new Map<string, PoolCard>();
  for (const c of pool) if (c.key) byKey.set(baseKey(c.key), c);
  for (const [k, slug] of Object.entries(learnedKeys())) {
    const c = pool.find((x) => x.slug === slug);
    if (c) byKey.set(baseKey(k), c);
  }
  let legendary: string | null = null;
  const cards: string[] = [];
  const unknown = new Set<string>();
  for (const k of res.keys) {
    const c = byKey.get(baseKey(k));
    if (!c) unknown.add(baseKey(k));
    else if (c.legendary) legendary ??= c.slug;
    else if (!cards.includes(c.slug)) cards.push(c.slug);
  }
  if (!legendary && !cards.length) return { ok: false };
  return { ok: true, code: encodeOmCode({ name: "", legendary, cards: cards.slice(0, RULES.distinctCards), customCards: [] }), unknown: unknown.size };
}

/** Bozza locale della guida, solo se è stata scritta per un mazzo con la stessa Leggendaria. */
function readGuideDraft(legendary: string | null): DraftValues | null {
  try {
    const raw = localStorage.getItem(GUIDE_DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { legendary?: string | null; values?: DraftValues };
    if (!p || p.legendary !== legendary || !p.values || typeof p.values !== "object") return null;
    // nome e lingua hanno sempre un valore: la bozza conta solo se c'è del testo della guida, un video o un link
    const written = (["summary", ...guideSections, ...MEDIA_FIELD_NAMES] as const).some((k) => {
      const v = p.values?.[k];
      return typeof v === "string" && v.trim().length > 0;
    });
    return written ? p.values : null;
  } catch {
    return null;
  }
}

function clearLocalDrafts() {
  try {
    localStorage.removeItem(PENDING_PUBLISH_KEY);
    localStorage.removeItem(GUIDE_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Modulo "Pubblica sul sito": mazzo (da `?deck=`, dall'hash #OM1…, dal salvataggio del browser o incollato),
 * guida e video. Se l'utente non è loggato mostra l'accesso e conserva il mazzo per dopo, anche nel link.
 * Il modulo è volutamente corto: in vista c'è solo il piano di gioco (obbligatorio); le sezioni facoltative
 * stanno in un <details> chiuso, e il testo scritto resta in una bozza locale finché non si pubblica.
 */
export function PublishDeckForm({ locale, mode, pool, archetypes, initial, labels, mediaLabels, loginLabels, builderHref, publishPath }: Props) {
  const router = useRouter();
  const mounted = useMounted();
  // ?deck e ?draft dal router: sempre quelli della pagina che si sta aprendo, anche con un <Link>
  const searchParams = useSearchParams();
  const deckParam = searchParams.get("deck");
  const draftParam = searchParams.get("draft") ?? "";
  const ready = mode === "edit" || mounted;
  const detected = useMemo(() => (mode === "edit" ? (initial?.code ?? null) : mounted ? detectCode(deckParam) : null), [mode, initial, mounted, deckParam]);
  /* mazzo incollato nella casella del ramo "nessun mazzo": ha la precedenza su quello trovato */
  const [pasted, setPasted] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  const code = mode === "edit" ? detected : (pasted ?? detected);
  /* mazzo privato da cui si parte (tasto "Pubblica" di /account): dopo la pubblicazione la copia privata sparisce */
  const draftId = mode === "create" && /^[0-9a-f-]{36}$/i.test(draftParam) ? draftParam : "";
  const [user, setUser] = useState<{ id: string } | null | undefined>(mode === "edit" ? { id: "owner" } : supabaseEnabled ? undefined : null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(mode === "edit" ? updateDeck : publishDeck, {});
  const [, startSubmit] = useTransition();
  /* "Ricomincia da capo" sulla bozza ripristinata: cambia la chiave dei campi e li rimonta vuoti */
  const [draftReset, setDraftReset] = useState(0);
  /* parole della guida mentre si scrive (DECKS-02): sotto la soglia la pagina del mazzo non va su Google; in modifica
     si parte dalla guida salvata, in creazione dalla prima battuta */
  const [guideWords, setGuideWords] = useState<number | null>(() => (initial ? guideFormWords((k) => initial.guide[k]) : null));
  /* misura: il mazzo inviato, per l'evento deck_published quando l'azione risponde "fatto" (solo in creazione) */
  const sent = useRef<EventParams["deck_published"] | null>(null);
  /* il modulo, per risalvare la bozza quando si toglie una riga di video o di link (DeckMediaFields) */
  const formRef = useRef<HTMLFormElement>(null);

  /* errore su un video o un link: la Server Action dice quale campo (`field`), che si apre e riceve il fuoco */
  useEffect(() => {
    if (!state.field) return;
    const el = document.getElementById(`pub-${state.field}`);
    const det = el?.closest("details");
    if (det) det.open = true;
    el?.focus();
  }, [state]);

  /* il mazzo resta in attesa nel browser: sopravvive al giro di accesso (Discord o link via email) */
  useEffect(() => {
    if (mode !== "create" || !code) return;
    try {
      localStorage.setItem(PENDING_PUBLISH_KEY, code);
    } catch {
      /* ignore */
    }
  }, [mode, code]);

  /* codice del gioco arrivato nel link (?deck=KGBLDC…): la decodifica è asincrona (checksum SHA-256) */
  useEffect(() => {
    if (mode !== "create" || !mounted) return;
    const q = deckParam;
    if (!q || !q.includes(GAME_PREFIX)) return;
    let alive = true;
    // un "+" del base64 non codificato nel link arriva come spazio
    importDeckCode(q.replace(/ /g, "+"), pool).then((r) => {
      if (!alive || !r.ok) return;
      setPasted(r.code);
      setImportNote(r.unknown ? labels.pasteUnknown.replace("{n}", String(r.unknown)) : null);
    });
    return () => {
      alive = false;
    };
  }, [mode, mounted, deckParam, pool, labels.pasteUnknown]);

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
      // solo la prima pubblicazione è un evento (deck_published): una modifica non crea un mazzo nuovo
      if (mode === "create") {
        clearLocalDrafts();
        if (sent.current) {
          trackEvent("deck_published", sent.current);
          sent.current = null;
        }
      }
      router.push(state.href);
    }
  }, [state, router, mode]);

  const deck = useMemo(() => (code ? decodeOmCode(code) : null), [code]);
  /* archetipo: suggerito dalla composizione, ma l'utente può cambiarlo */
  const suggested = useMemo(() => (deck ? suggestArchetype(deck) : null), [deck]);
  const [archetypeChoice, setArchetypeChoice] = useState<string | null>(null);
  const archetypeValue = archetypeChoice ?? initial?.archetype ?? suggested ?? "midrange";
  const errors = deck ? validateDeck(deck).filter((i) => i.level === "error") : [];
  const nameOf = (slug: string) => pool.find((c) => c.slug === slug)?.name ?? deck?.customCards.find((c) => c.slug === slug)?.name ?? slug;
  const hasCustom = Boolean(deck && [deck.legendary, ...deck.cards].some((s) => s?.startsWith("custom:")));
  /* bozza della guida scritta in precedenza per questo mazzo (solo in creazione) */
  const restored = useMemo(() => (mode === "create" && mounted && deck && draftReset === 0 ? readGuideDraft(deck.legendary) : null), [mode, mounted, deck, draftReset]);

  const onPaste = async (text: string): Promise<string | null> => {
    const r = await importDeckCode(text, pool);
    if (!r.ok) return labels.pasteError;
    setPasted(r.code);
    setImportNote(r.unknown ? labels.pasteUnknown.replace("{n}", String(r.unknown)) : null);
    return null;
  };

  if (!supabaseEnabled) return <p className="card-night p-6 text-pale-muted">{labels.errors.disabled}</p>;
  if (!ready || user === undefined) return <p className="card-night p-6 text-pale-muted" aria-busy="true">…</p>;
  if (!deck || errors.length) {
    /* nessun mazzo (o incompleto): niente vicolo cieco, si torna al builder oppure si incolla un codice */
    return (
      <div className="card-night p-6 sm:p-8">
        <p className="text-pale">{deck ? labels.incomplete : labels.noDeck}</p>
        {importNote ? <p className="mt-2 text-sm text-pale-muted">{importNote}</p> : null}
        <p className="mt-4">
          <Link href={deck && code ? `${builderHref.split("#")[0]}#${code}` : builderHref} className="btn btn-ink">
            {labels.backToBuilder}
          </Link>
        </p>
        {mode === "create" ? <PasteCode labels={labels} onImport={onPaste} /> : null}
      </div>
    );
  }
  if (!user) {
    /* il ritorno dopo l'accesso porta il mazzo nel link: vale anche se il link via email si apre altrove */
    const loginNext = `${publishPath}?deck=${encodeURIComponent(code ?? "")}${draftId ? `&draft=${draftId}` : ""}`;
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <DeckPreview deck={deck} nameOf={nameOf} hasCustom={hasCustom} labels={labels} />
        <div className="min-w-0">
          <p className="mb-4 text-chalk">{labels.loginFirst}</p>
          <LoginPanel next={loginNext} labels={loginLabels} locale={locale} />
        </div>
      </div>
    );
  }

  const g = initial?.guide;
  const meter = guideWords === null ? null : guideMeter(guideWords, isLocale(locale) ? locale : "en");
  const v = (k: (typeof DRAFT_FIELDS)[number], fallback?: string) => restored?.[k] ?? fallback;
  /* il <details> parte aperto se c'è già qualcosa di scritto nelle sezioni facoltative, nei video o nei link */
  const hasOptional =
    guideSections.some((k) => Boolean(restored?.[k] || g?.[k])) || MEDIA_FIELD_NAMES.some((k) => Boolean(restored?.[k])) || Boolean(initial?.videos?.length || initial?.links?.length);
  /* errori di video e link (videoLabels.ts, con il numero della riga) prima di quelli del dizionario */
  const mediaError = state.error ? (mediaLabels.errors as Record<string, string>)[state.error] : undefined;
  const errorText = state.error
    ? mediaError
      ? fillVideoLabel(mediaError, { n: mediaFieldRow(state.field) })
      : ((labels.errors as Record<string, string>)[state.error] ?? labels.errors.db)
    : null;
  const busyLabel = mode === "edit" ? labels.updating : labels.submitting;
  const submitLabel = mode === "edit" ? labels.update : labels.submit;
  const ph = labels.placeholders;

  /* bozza della guida a ogni modifica: un'interruzione (accesso, telefono che si blocca) non cancella il testo */
  const saveDraftOf = (form: HTMLFormElement) => {
    if (mode !== "create") return;
    const fd = new FormData(form);
    const values: DraftValues = {};
    for (const k of DRAFT_FIELDS) {
      const val = fd.get(k);
      if (typeof val === "string" && val.trim()) values[k] = val;
    }
    try {
      localStorage.setItem(GUIDE_DRAFT_KEY, JSON.stringify({ legendary: deck.legendary, values }));
    } catch {
      /* ignore */
    }
  };
  const saveDraft = (e: FormEvent<HTMLFormElement>) => saveDraftOf(e.currentTarget);

  return (
    <form
      ref={formRef}
      // invio a mano invece di <form action>: React 19 svuota i campi non controllati quando l'azione finisce,
      // anche se torna un errore, e chi ha scritto la guida la perderebbe. La validazione del browser resta.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (mode === "create") sent.current = { locale, legendary: legendaryParam(deck.legendary), source: draftId ? "private_draft" : "builder" };
        startSubmit(() => formAction(fd));
      }}
      onChange={(e) => {
        saveDraft(e);
        const fd = new FormData(e.currentTarget);
        setGuideWords(guideFormWords((k) => fd.get(k)));
      }}
      // un campo non valido dentro il <details> chiuso non si può mettere a fuoco: prima lo apriamo
      onInvalidCapture={(e) => {
        const det = (e.target as HTMLElement).closest("details");
        if (det) det.open = true;
      }}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="code" value={code ?? ""} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      {draftId ? <input type="hidden" name="draft" value={draftId} /> : null}

      <DeckPreview deck={deck} nameOf={nameOf} hasCustom={hasCustom} labels={labels} />

      <section key={`fields-${draftReset}`} className="card-night min-w-0 p-5 sm:p-6">
        {restored ? (
          <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-night-3 px-3 py-2 text-sm text-pale" role="status">
            <span>{labels.draftRestored}</span>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(GUIDE_DRAFT_KEY);
                } catch {
                  /* ignore */
                }
                setDraftReset((n) => n + 1);
                setGuideWords(null); // campi di nuovo vuoti: l'indicatore riparte dalla prima battuta
              }}
              className="text-mint underline underline-offset-2 hover:text-sky"
            >
              {labels.draftClear}
            </button>
          </p>
        ) : null}
        {importNote ? <p className="mb-4 text-sm text-pale-muted">{importNote}</p> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="kicker text-pale-muted">{labels.name}</span>
            <input id="pub-name" name="name" required minLength={3} maxLength={60} defaultValue={v("name", initial?.name ?? deck.name)} className={inputCls} />
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
          <label className="block">
            <span className="kicker text-pale-muted">{labels.guideLang}</span>
            <select id="pub-lang" name="lang" defaultValue={v("lang", g?.lang ?? locale)} className={inputCls} aria-describedby="pub-lang-hint">
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeNames[l]}
                </option>
              ))}
            </select>
            {/* la guida si scrive in una lingua sola: le altre le fa il sito (traduzione automatica, 25/09/2026) */}
            <span id="pub-lang-hint" className="mt-1 block text-xs text-pale-muted">
              {labels.guideLangHint}
            </span>
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
        </div>

        <Field id="summary" label={labels.summary} hint={labels.summaryHint} placeholder={ph.summary} required minLength={20} maxLength={600} rows={4} defaultValue={v("summary", g?.summary)} />
        {meter ? (
          <p className={`mt-2 text-xs ${meter.ok ? "text-good" : "text-pale-muted"}`} aria-live="polite">
            {meter.text}
          </p>
        ) : null}

        {/* Le sei sezioni facoltative e il video: chiuse, così il modulo non sembra un compito in classe */}
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
          <Field id="strengths" label={labels.strengths} placeholder={ph.strengths} rows={3} defaultValue={v("strengths", g?.strengths)} />
          <Field id="weaknesses" label={labels.weaknesses} placeholder={ph.weaknesses} rows={3} defaultValue={v("weaknesses", g?.weaknesses)} />
          <Field id="mulligan" label={labels.mulligan} hint={labels.mulliganHint} placeholder={ph.mulligan} rows={3} defaultValue={v("mulligan", g?.mulligan)} />
          <Field id="combos" label={labels.combos} placeholder={ph.combos} rows={3} defaultValue={v("combos", g?.combos)} />
          <Field id="matchups" label={labels.matchups} hint={labels.matchupsHint} placeholder={ph.matchups} rows={3} defaultValue={v("matchups", g?.matchups)} />
          <Field id="notes" label={labels.notes} placeholder={ph.notes} rows={2} defaultValue={v("notes", g?.notes)} />
          {/* fino a 3 video (YouTube, Twitch) e 5 risorse, con l'anteprima di ciò che il sito riconosce (26/09/2026) */}
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
          <button type="submit" disabled={pending} className="btn btn-primary">
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
  placeholder,
  rows,
  defaultValue,
  required,
  minLength,
  maxLength = 2000,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
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
      <textarea id={`pub-${id}`} name={id} rows={rows} required={required} minLength={minLength} maxLength={maxLength} placeholder={placeholder} defaultValue={defaultValue} className={inputCls} />
      {hint ? <span className="mt-1 block text-xs text-pale-muted">{hint}</span> : null}
    </label>
  );
}

/** Casella per incollare un codice mazzo (del gioco o di OriginsMeta) quando nel browser non c'è nessun mazzo. */
function PasteCode({ labels, onImport }: { labels: Labels; onImport: (text: string) => Promise<string | null> }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const err = await onImport(text);
        setBusy(false);
        setError(err);
      }}
    >
      <label className="block">
        <span className="kicker text-pale-muted">{labels.pasteLabel}</span>
        <textarea
          id="pub-paste"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="KGBLDC… · https://originsmeta.com/…/deck-builder#…"
          className={`${inputCls} font-mono text-xs`}
        />
        <span className="mt-1 block text-xs text-pale-muted">{labels.pasteHint}</span>
      </label>
      {error ? (
        <p className="text-error mt-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy || !text.trim()} className="btn btn-primary mt-3">
        {labels.pasteSubmit}
      </button>
    </form>
  );
}

function DeckPreview({ deck, nameOf, hasCustom, labels }: { deck: DeckState; nameOf: (s: string) => string; hasCustom: boolean; labels: Labels }) {
  const isCustom = (s: string) => s.startsWith("custom:");
  return (
    <aside className="card-night h-fit min-w-0 p-5">
      <p className="kicker text-pale-muted">{labels.deckPreview}</p>
      <p className="t-item mt-1">{deck.name || "—"}</p>
      <ul className="mt-3 space-y-1 text-sm text-pale">
        {deck.legendary ? (
          <li className="rounded-lg bg-gold px-2 py-1 font-display text-xs font-bold text-ink">
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
