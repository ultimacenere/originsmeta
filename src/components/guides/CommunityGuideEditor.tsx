"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCommunityGuide, type GuideActionState } from "@/lib/community/guideActions";
import {
  DEFAULT_GUIDE_COVER,
  GUIDE_COVER_MAX_BYTES,
  GUIDE_COVER_MIN,
  GUIDE_COVER_PRESETS,
  GUIDE_COVER_SIZE,
  GUIDE_LIMITS,
  COMMUNITY_GUIDE_MIN_WORDS,
  codePoints,
  communityGuideWords,
  coverPathOk,
  sectionFields,
  type CommunityGuideStatus,
  type GuideCoverImage,
  type GuideCoverPreset,
  type GuideSectionText,
} from "@/lib/community/guides";
import { PROFILE_MEDIA_BUCKET, mediaPublicUrl } from "@/lib/community/profileMedia";
import { supabaseUrl } from "@/lib/supabase/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MediaError, encodeImage, uploadMedia } from "../showcase/mediaUpload";
import { fillLabel } from "@/lib/community/deckQuality";
import type { GuideEditorLabels } from "@/lib/communityGuideLabels";
import { MEDIA_FIELD_NAMES, fillVideoLabel, mediaFieldRow, type DeckLink, type StoredVideo } from "@/lib/videos";
import type { VideoFormLabels } from "@/lib/videoLabels";
import { trackEvent } from "@/lib/analytics";
import { useMounted } from "@/lib/useMounted";
import { DeckMediaFields } from "../DeckMediaFields";
import { GuideCover } from "./GuideCover";

/** Una carta che si può collegare alla guida (attive e create: le guide citano anche le carte generate). */
export type GuidePoolCard = { slug: string; name: string; legendary: boolean };

export type GuideEditorInitial = {
  id: string;
  status: CommunityGuideStatus;
  lang: string;
  title: string;
  summary: string;
  sections: GuideSectionText[];
  category: string;
  cards: string[];
  cover_preset: GuideCoverPreset;
  /** copertina caricata (29/09/2026): percorso nel bucket, `<id>/guide/<file>` */
  cover_path?: string | null;
  /** proprietario della guida: solo lui carica la copertina (lo staff che corregge una guida altrui no) */
  owner?: string;
  videos: StoredVideo[];
  links: DeckLink[];
};

type Props = {
  locale: string;
  mode: "create" | "edit";
  initial?: GuideEditorInitial;
  labels: GuideEditorLabels;
  mediaLabels: VideoFormLabels;
  /** [id, etichetta] delle categorie e delle lingue, nella lingua della pagina */
  categories: [string, string][];
  langs: [string, string][];
  pool: GuidePoolCard[];
  /** la pagina di modifica dopo un salvataggio della bozza (?saved=1) */
  justSaved?: boolean;
  /** chi modifica è dello staff: può correggere anche una guida nascosta (che resta nascosta) */
  staff?: boolean;
};

/** Bozza locale del modulo (solo in creazione): un'interruzione (accesso, telefono che si blocca) non cancella il testo. */
const DRAFT_KEY = "originsmeta.guide.draft.v1";
type Row = GuideSectionText & { key: number };
type Draft = { title?: string; summary?: string; lang?: string; category?: string; cover?: string; coverPath?: string | null; cards?: string[]; sections?: GuideSectionText[]; media?: Record<string, string> };

/** Una copertina caricata come immagine da mostrare (anteprima del modulo): indirizzo pubblico del bucket, 16:9. */
const uploadedCover = (path: string): GuideCoverImage => ({ src: mediaPublicUrl(supabaseUrl, path), ...GUIDE_COVER_SIZE, remote: true });
/** Il percorso di una copertina caricata, senza sapere ancora chi è l'utente (bozza locale): `<id>/guide/<file>`. */
const looksLikeCover = (p: unknown): p is string => typeof p === "string" && coverPathOk(p, p.slice(0, 36));

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const d = raw ? (JSON.parse(raw) as Draft) : null;
    return d && typeof d === "object" && (d.title || d.summary || d.sections?.some((s) => s.heading || s.body)) ? d : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage non disponibile */
  }
}

let nextKey = 1;
const toRows = (sections: readonly GuideSectionText[]): Row[] => (sections.length ? sections : [{ heading: "", body: "" }]).map((s) => ({ heading: s.heading, body: s.body, key: nextKey++ }));

/** Cerca per nome, senza maiuscole né accenti. */
const fold = (s: string) => s.normalize("NFKD").replace(/[\u{300}-\u{36f}]/gu, "").toLowerCase();

/**
 * Modulo di scrittura delle guide della community (pacchetto GUIDE, 27/09/2026): titolo, lingua, categoria, riassunto,
 * sezioni aggiungibili e riordinabili (su, giù, togli), carte scelte dal database, video e risorse con le regole dei
 * mazzi (`DeckMediaFields`), copertina dal media kit, contatori e parole verso la soglia di Google, anteprima. Due tasti:
 * "Salva bozza" e "Pubblica" (in modifica di una guida pubblicata: "Salva le modifiche" e "Riporta tra le bozze").
 * Le regole sono quelle di `readGuideForm` (guides.ts), che la Server Action applica di nuovo; il database per terzo.
 * Invio a mano (niente `<form action>`), come il modulo dei mazzi: React 19 svuoterebbe i campi anche con un errore.
 */
export function CommunityGuideEditor(props: Props) {
  const mounted = useMounted();
  // In creazione il modulo parte dalla bozza locale, che c'è solo nel browser: si disegna dopo il montaggio, così lo stato
  // iniziale la legge subito (niente setState in un effetto, niente differenze fra server e browser).
  const draft = useMemo(() => (props.mode === "create" && mounted ? readDraft() : null), [props.mode, mounted]);
  if (props.mode === "create" && !mounted) {
    return (
      <p className="card-night p-6 text-pale-muted" aria-busy="true">
        …
      </p>
    );
  }
  return <EditorForm {...props} draft={draft} />;
}

function EditorForm({ locale, mode, initial, labels, mediaLabels, categories, langs, pool, justSaved, staff = false, draft }: Props & { draft: Draft | null }) {
  const router = useRouter();
  const mounted = useMounted();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<GuideActionState, FormData>(saveCommunityGuide, {});
  const [, startSubmit] = useTransition();
  const L = labels;
  const GL = GUIDE_LIMITS;
  const [restoredAt, setRestoredAt] = useState<Draft | null>(draft);
  const [title, setTitle] = useState(draft?.title ?? initial?.title ?? "");
  const [summary, setSummary] = useState(draft?.summary ?? initial?.summary ?? "");
  const [lang, setLang] = useState(draft?.lang ?? initial?.lang ?? locale);
  const [category, setCategory] = useState(draft?.category ?? initial?.category ?? "decks");
  const [cover, setCover] = useState<GuideCoverPreset>(() =>
    draft?.cover && (GUIDE_COVER_PRESETS as readonly string[]).includes(draft.cover) ? (draft.cover as GuideCoverPreset) : (initial?.cover_preset ?? DEFAULT_GUIDE_COVER),
  );
  // Copertina caricata (29/09/2026): il percorso nel bucket e se è quella scelta (altrimenti vale la preimpostata `cover`)
  const [coverPath, setCoverPath] = useState<string | null>(() => (looksLikeCover(draft?.coverPath) ? draft.coverPath : (initial?.cover_path ?? null)));
  const [useUpload, setUseUpload] = useState<boolean>(() => Boolean(looksLikeCover(draft?.coverPath) ? draft.coverPath : initial?.cover_path));
  // la copertina salvata nel database: l'unica da tenere quando se ne carica un'altra (le prove non salvate si tolgono)
  const savedCoverPath = useRef<string | null>(initial?.cover_path ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>(() =>
    toRows(
      Array.isArray(draft?.sections)
        ? draft.sections.filter((s) => s && typeof s.heading === "string" && typeof s.body === "string").slice(0, GL.sectionsMax)
        : (initial?.sections ?? []),
    ),
  );
  const [cards, setCards] = useState<string[]>(() => (Array.isArray(draft?.cards) ? draft.cards.filter((s) => typeof s === "string").slice(0, GL.cardsMax) : (initial?.cards ?? [])));
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  const [mediaKey, setMediaKey] = useState(0);
  const hidden = initial?.status === "hidden";
  const published = initial?.status === "published";

  const saveDraft = () => {
    if (mode !== "create" || !formRef.current) return;
    const fd = new FormData(formRef.current);
    const media: Record<string, string> = {};
    for (const k of MEDIA_FIELD_NAMES) {
      const v = fd.get(k);
      if (typeof v === "string" && v.trim()) media[k] = v;
    }
    const draft: Draft = { title, summary, lang, category, cover, coverPath: useUpload ? coverPath : null, cards, sections: rows.map(({ heading, body }) => ({ heading, body })), media };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage pieno o spento */
    }
  };
  /* ogni modifica dello stato risalva la bozza (i campi dei video la risalvano con onChange del modulo) */
  const saveRef = useRef(saveDraft);
  useEffect(() => {
    saveRef.current = saveDraft;
  });
  useEffect(() => {
    if (mounted) saveRef.current();
  }, [mounted, title, summary, lang, category, cover, coverPath, useUpload, cards, rows]);

  /* esito della Server Action: evento, bozza locale tolta, immagini caricate e non più usate tolte, pagina successiva */
  useEffect(() => {
    if (state.ok && state.href) {
      clearDraft();
      if (state.firstPublish) trackEvent("guide_published", { guide_lang: state.lang ?? lang, category: state.category ?? category });
      // la copertina caricata che la guida aveva prima, sostituita o tolta, non serve più: si cancella ora che la guida non
      // la usa (le prove non salvate si tolgono già quando se ne carica un'altra; i file rimasti li toglie la pulizia dei
      // file non usati). Solo quel file: le copertine delle altre guide restano dove sono.
      const keep = useUpload ? coverPath : null;
      const before = savedCoverPath.current;
      savedCoverPath.current = keep;
      if (before && before !== keep) {
        const sb = supabaseBrowser();
        if (sb) void sb.storage.from(PROFILE_MEDIA_BUCKET).remove([before]);
      }
      router.push(state.href);
    }
    // solo quando cambia l'esito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router]);

  /**
   * Caricamento della copertina (29/09/2026): ritaglio al centro in 16:9 e lato lungo a 1600 px nel browser (WebP), poi
   * lo Storage, nella cartella delle guide di chi carica. Solo il proprietario della guida: lo staff che ne corregge una
   * altrui la caricherebbe nella propria cartella, e la Server Action la rifiuterebbe.
   */
  const onCoverFile = async (file: File | undefined) => {
    if (!file) return;
    const E = L.coverUploadErrors;
    setUploadError(null);
    setUploading(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new MediaError("upload");
      const { data } = await sb.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new MediaError("upload");
      if (initial?.owner && initial.owner !== userId) {
        setUploadError(L.coverUploadOwner);
        return;
      }
      const blob = await encodeImage(file, { aspect: GUIDE_COVER_SIZE.width / GUIDE_COVER_SIZE.height, maxSide: GUIDE_COVER_SIZE.width, maxBytes: GUIDE_COVER_MAX_BYTES });
      const path = await uploadMedia(sb, userId, "guide", blob);
      // la prova precedente, se non era salvata, non serve più
      const previous = coverPath;
      setCoverPath(path);
      setUseUpload(true);
      if (previous && previous !== savedCoverPath.current && previous !== path) void sb.storage.from(PROFILE_MEDIA_BUCKET).remove([previous]);
    } catch (err) {
      const code = err instanceof MediaError ? err.code : "upload";
      setUploadError(E[code]);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const coverImage = useUpload && coverPath ? uploadedCover(coverPath) : undefined;

  /* errore su un campo: lo si mette a fuoco (le sezioni hanno id `gd-…`, i video e le risorse `pub-…`) */
  useEffect(() => {
    if (!state.field) return;
    requestAnimationFrame(() => (document.getElementById(`gd-${state.field}`) ?? document.getElementById(`pub-${state.field}`))?.focus());
  }, [state]);

  const words = useMemo(() => communityGuideWords({ summary, sections: rows }), [summary, rows]);
  const byName = useMemo(() => new Map(pool.map((c) => [c.slug, c])), [pool]);
  const matches = useMemo(() => {
    const q = fold(query.trim());
    if (q.length < 2) return [];
    return pool.filter((c) => !cards.includes(c.slug) && fold(c.name).includes(q)).slice(0, 8);
  }, [query, pool, cards]);

  const setRow = (i: number, patch: Partial<GuideSectionText>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, by: -1 | 1) =>
    setRows((rs) => {
      const j = i + by;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const drop = (i: number) => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{ heading: "", body: "", key: nextKey++ }]));
  const add = () => {
    if (rows.length >= GL.sectionsMax) return;
    const n = rows.length;
    setRows((rs) => [...rs, { heading: "", body: "", key: nextKey++ }]);
    requestAnimationFrame(() => document.getElementById(`gd-${sectionFields(n).heading}`)?.focus());
  };

  const errorText = (() => {
    if (!state.error) return null;
    // `tooFast`: {n} sono i secondi da aspettare; negli altri errori il numero della sezione o della riga
    const n = state.error === "tooFast" ? String(state.retryIn ?? 10) : String((state.index ?? 0) + 1);
    const media = (mediaLabels.errors as Record<string, string>)[state.error];
    if (media) return fillVideoLabel(media, { n: mediaFieldRow(state.field) });
    const text = (L.errors as Record<string, string>)[state.error] ?? L.errors.db;
    const max = { title: GL.titleMax, summary: GL.summaryMax, heading: GL.headingMax, body: GL.bodyMax, cards: GL.cardsMax }[state.error as "title"] ?? 0;
    const min = { title: GL.titleMin, summary: GL.summaryMin }[state.error as "title"] ?? 0;
    return fillLabel(text, { n, max: String(max), min: String(min) });
  })();

  const meterOk = words >= COMMUNITY_GUIDE_MIN_WORDS;
  const meter = fillLabel(meterOk ? L.meterOk : L.meterBelow, { n: String(words), min: String(COMMUNITY_GUIDE_MIN_WORDS) });
  const counter = (n: number, max: number) => fillLabel(L.counter, { n: String(n), max: String(max) });
  const status = hidden ? L.statusHidden : published ? L.statusPublished : mode === "edit" ? L.statusDraft : null;

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const fd = new FormData(e.currentTarget, submitter);
        // si torna ai campi: se la Server Action trova un errore, il campo da correggere è in vista
        setPreview(false);
        startSubmit(() => formAction(fd));
      }}
      onChange={() => saveRef.current()}
      className="grid grid-cols-1 gap-6"
    >
      <input type="hidden" name="locale" value={locale} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="cover_preset" value={cover} />
      <input type="hidden" name="cover_path" value={useUpload && coverPath ? coverPath : ""} />
      {cards.map((s) => (
        <input key={s} type="hidden" name="cards" value={s} />
      ))}

      {status ? (
        <p className={`rounded-lg border-2 p-3 text-sm text-pale ${hidden ? "border-bad bg-bad/10" : "border-sky bg-sky/10"}`} role="status">
          {status}
        </p>
      ) : null}
      {justSaved && !state.error ? (
        <p className="text-sm text-good" role="status">
          ✓ {L.saved}
        </p>
      ) : null}
      {restoredAt ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-night-3 px-3 py-2 text-sm text-pale" role="status">
          <span>{L.restored}</span>
          <button
            type="button"
            className="text-mint underline underline-offset-2 hover:text-sky"
            onClick={() => {
              clearDraft();
              setRestoredAt(null);
              setTitle("");
              setSummary("");
              setCards([]);
              setRows(toRows([]));
              setMediaKey((k) => k + 1);
            }}
          >
            {L.restoreClear}
          </button>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2" role="group">
        <button type="button" className={`btn text-xs ${preview ? "btn-ghost" : "btn-ink"}`} aria-pressed={!preview} onClick={() => setPreview(false)}>
          {L.edit}
        </button>
        <button type="button" className={`btn text-xs ${preview ? "btn-ink" : "btn-ghost"}`} aria-pressed={preview} onClick={() => setPreview(true)}>
          {L.preview}
        </button>
      </div>

      {preview ? (
        <section className="min-w-0" aria-label={L.preview}>
          <p className="mb-3 text-xs text-pale-muted">{L.previewNote}</p>
          <GuideCover preset={cover} src={coverImage} />
          <p className="kicker mt-4 text-mint">{categories.find(([id]) => id === category)?.[1]}</p>
          <h2 className="t-page mt-2 break-words leading-tight">{title || "…"}</h2>
          {summary ? <p className="mt-4 whitespace-pre-line break-words rounded-xl border-2 border-sky bg-night-2/80 p-5 text-lg text-pale">{summary}</p> : null}
          {rows
            .filter((r) => r.heading || r.body)
            .map((r) => (
              <section key={r.key} className="mt-8">
                <h3 className="t-section break-words">{r.heading}</h3>
                <p className="mt-2 whitespace-pre-line break-words text-pale">{r.body}</p>
              </section>
            ))}
          {cards.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {cards.map((s) => (
                <li key={s} className="stat-pill border-2 border-sky text-pale">
                  {byName.get(s)?.legendary ? "★ " : ""}
                  {byName.get(s)?.name ?? s}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {/* i campi restano montati durante l'anteprima (nascosti): la FormData e i video non si perdono */}
      <div className={preview ? "hidden" : "grid grid-cols-1 gap-6"}>
        <section className="card-night min-w-0 p-5 sm:p-6">
          <label className="block">
            <span className="kicker text-pale-muted">{L.title} *</span>
            <input
              id="gd-title"
              name="title"
              maxLength={GL.titleMax}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={L.titlePlaceholder}
              aria-describedby="gd-title-hint"
              className={`${inputCls} font-display font-bold`}
            />
            <span id="gd-title-hint" className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-pale-muted">
              <span>{fillLabel(L.titleHint, { min: String(GL.titleMin), max: String(GL.titleMax) })}</span>
              <span className="font-mono">{counter(codePoints(title), GL.titleMax)}</span>
            </span>
          </label>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className="kicker text-pale-muted">{L.lang}</span>
              <select id="gd-lang" name="lang" value={lang} onChange={(e) => setLang(e.target.value)} className={inputCls} aria-describedby="gd-lang-hint">
                {langs.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <span id="gd-lang-hint" className="mt-1 block text-xs text-pale-muted">
                {L.langHint}
              </span>
            </label>
            <label className="block min-w-0">
              <span className="kicker text-pale-muted">{L.category}</span>
              <select id="gd-category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="kicker text-pale-muted">{L.summary} *</span>
            <textarea
              id="gd-summary"
              name="summary"
              rows={4}
              maxLength={GL.summaryMax + 50}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={L.summaryPlaceholder}
              aria-describedby="gd-summary-hint"
              className={inputCls}
            />
            <span id="gd-summary-hint" className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-pale-muted">
              <span>{fillLabel(L.summaryHint, { min: String(GL.summaryMin), max: String(GL.summaryMax) })}</span>
              <span className={`font-mono ${codePoints(summary.trim()) > GL.summaryMax ? "text-bad" : ""}`}>{counter(codePoints(summary.trim()), GL.summaryMax)}</span>
            </span>
          </label>
        </section>

        <section className="card-night min-w-0 p-5 sm:p-6" aria-labelledby="gd-sections-title">
          <h2 id="gd-sections-title" className="t-item">
            {L.sections}
          </h2>
          <p className="mt-1 text-xs text-pale-muted">{L.sectionsHint}</p>
          <ol className="mt-4 space-y-4">
            {rows.map((r, i) => {
              const f = sectionFields(i);
              const n = String(i + 1);
              return (
                <li key={r.key} className="rounded-lg bg-night-3/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="kicker text-mint">{fillLabel(L.sectionN, { n })}</p>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={() => move(i, -1)} disabled={i === 0} aria-label={fillLabel(L.moveUp, { n })} title={fillLabel(L.moveUp, { n })}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost px-2 py-1 text-xs"
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1}
                        aria-label={fillLabel(L.moveDown, { n })}
                        title={fillLabel(L.moveDown, { n })}
                      >
                        ↓
                      </button>
                      <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={() => drop(i)} aria-label={fillLabel(L.removeSection, { n })}>
                        {L.remove}
                      </button>
                    </div>
                  </div>
                  <label className="mt-2 block">
                    <span className="text-xs font-semibold text-pale">{L.heading}</span>
                    <input
                      id={`gd-${f.heading}`}
                      name={f.heading}
                      maxLength={GL.headingMax}
                      value={r.heading}
                      onChange={(e) => setRow(i, { heading: e.target.value })}
                      placeholder={L.headingPlaceholder}
                      className={`${inputCls} font-semibold`}
                    />
                  </label>
                  <label className="mt-2 block">
                    <span className="text-xs font-semibold text-pale">{L.body}</span>
                    <textarea
                      id={`gd-${f.body}`}
                      name={f.body}
                      rows={6}
                      maxLength={GL.bodyMax + 200}
                      value={r.body}
                      onChange={(e) => setRow(i, { body: e.target.value })}
                      placeholder={L.bodyPlaceholder}
                      aria-describedby={`gd-${f.body}-count`}
                      className={inputCls}
                    />
                    <span id={`gd-${f.body}-count`} className={`mt-1 block text-right font-mono text-xs ${codePoints(r.body.trim()) > GL.bodyMax ? "text-bad" : "text-pale-muted"}`}>
                      {counter(codePoints(r.body.trim()), GL.bodyMax)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
          {rows.length < GL.sectionsMax ? (
            <button type="button" className="btn btn-ghost mt-3 text-xs" onClick={add}>
              {L.addSection}
            </button>
          ) : null}
          <p className={`mt-4 text-xs ${meterOk ? "text-good" : "text-pale-muted"}`} aria-live="polite">
            {meter}
          </p>
        </section>

        <section className="card-night min-w-0 p-5 sm:p-6" aria-labelledby="gd-cards-title">
          <h2 id="gd-cards-title" className="t-item">
            {L.cards}
          </h2>
          <p className="mt-1 text-xs text-pale-muted">{fillLabel(L.cardsHint, { max: String(GL.cardsMax) })}</p>
          {cards.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {cards.map((s) => {
                const name = byName.get(s)?.name ?? s;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => setCards((cs) => cs.filter((x) => x !== s))}
                      className="stat-pill border-2 border-sky text-pale hover:border-bad"
                      aria-label={fillLabel(L.cardRemove, { name })}
                    >
                      {byName.get(s)?.legendary ? <span className="legendary-star" aria-hidden="true">★</span> : null}
                      {name} <span aria-hidden="true">×</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {cards.length < GL.cardsMax ? (
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-pale">{L.cardSearch}</span>
              <input
                id="gd-card_search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (matches[0]) {
                      setCards((cs) => [...cs, matches[0].slug]);
                      setQuery("");
                    }
                  }
                }}
                placeholder={L.cardSearchPlaceholder}
                autoComplete="off"
                aria-describedby="gd-card-results"
                className={inputCls}
              />
            </label>
          ) : null}
          <div id="gd-card-results" aria-live="polite">
            {query.trim().length >= 2 ? (
              matches.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {matches.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        className="btn btn-ink text-xs"
                        onClick={() => {
                          setCards((cs) => (cs.length < GL.cardsMax && !cs.includes(c.slug) ? [...cs, c.slug] : cs));
                          setQuery("");
                          document.getElementById("gd-card_search")?.focus();
                        }}
                        aria-label={fillLabel(L.cardAdd, { name: c.name })}
                      >
                        {c.legendary ? <span className="legendary-star" aria-hidden="true">★</span> : null}
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-pale-muted">{L.cardNoMatch}</p>
              )
            ) : null}
          </div>
        </section>

        <section className="card-night min-w-0 p-5 sm:p-6">
          {/* fino a 3 video (YouTube, Twitch) e 5 risorse, con le regole e l'anteprima dei mazzi (pacchetto VIDEO) */}
          <DeckMediaFields
            key={mediaKey}
            labels={mediaLabels}
            initialVideos={initial?.videos}
            initialLinks={initial?.links}
            draft={restoredAt?.media}
            onRowsChange={() => saveRef.current()}
          />
        </section>

        <section className="card-night min-w-0 p-5 sm:p-6">
          <fieldset>
            <legend className="t-item">{L.cover}</legend>
            <p className="mt-1 text-xs text-pale-muted">{L.coverHint}</p>
            {/* la tua immagine (29/09/2026): caricata dal browser nello Storage, ritagliata in 16:9, con le misure accanto */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className={`btn btn-ink text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${uploading ? "opacity-60" : "cursor-pointer"}`}>
                <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(e) => onCoverFile(e.target.files?.[0])} />
                {uploading ? L.coverUploading : coverPath ? L.coverUploadReplace : L.coverUpload}
              </label>
              <span className="min-w-0 flex-1 basis-56 text-xs text-pale-muted">
                {fillLabel(L.coverUploadHint, {
                  minw: String(GUIDE_COVER_MIN.width),
                  minh: String(GUIDE_COVER_MIN.height),
                  w: String(GUIDE_COVER_SIZE.width),
                  h: String(GUIDE_COVER_SIZE.height),
                })}
              </span>
            </div>
            {uploadError ? (
              <p className="mt-2 text-xs text-bad" role="alert">
                {uploadError}
              </p>
            ) : null}
            <div id="gd-cover_preset" tabIndex={-1} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {coverPath ? (
                <label className={`block min-w-0 cursor-pointer rounded-xl p-1 ${useUpload ? "bg-mint/20 ring-2 ring-mint" : ""}`}>
                  <input type="radio" name="cover_choice" value="image" checked={useUpload} onChange={() => setUseUpload(true)} className="sr-only" />
                  <GuideCover src={uploadedCover(coverPath)} />
                  <span className="mt-1 block text-center text-xs text-pale">
                    {useUpload ? "✓ " : ""}
                    {L.coverImage}
                  </span>
                </label>
              ) : null}
              {GUIDE_COVER_PRESETS.map((p) => {
                const on = !useUpload && cover === p;
                return (
                  <label key={p} className={`block min-w-0 cursor-pointer rounded-xl p-1 ${on ? "bg-mint/20 ring-2 ring-mint" : ""}`}>
                    <input
                      type="radio"
                      name="cover_choice"
                      value={p}
                      checked={on}
                      onChange={() => {
                        setCover(p);
                        setUseUpload(false);
                      }}
                      className="sr-only"
                    />
                    <GuideCover preset={p} sizes="(max-width: 640px) 45vw, 260px" />
                    <span className="mt-1 block text-center text-xs text-pale">
                      {on ? "✓ " : ""}
                      {L.covers[p]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>
      </div>

      <section className="min-w-0">
        <p className="text-xs text-pale-muted">{L.consent}</p>
        {errorText ? (
          <p className="alert-bad mt-3" role="alert">
            {errorText}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {published || hidden ? (
            <>
              {/* una guida nascosta la corregge solo lo staff (e resta nascosta: la rimette online "Rimetti online") */}
              <button type="submit" name="intent" value="publish" disabled={pending || (hidden && !staff)} className="btn btn-primary">
                {pending ? L.saving : L.update}
              </button>
              {published ? (
                <button type="submit" name="intent" value="draft" disabled={pending} formNoValidate className="btn btn-ink">
                  {L.unpublish}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button type="submit" name="intent" value="publish" disabled={pending} className="btn btn-primary">
                {pending ? L.saving : L.publish}
              </button>
              <button type="submit" name="intent" value="draft" disabled={pending} formNoValidate className="btn btn-ink">
                {L.saveDraft}
              </button>
            </>
          )}
        </div>
      </section>
    </form>
  );
}
