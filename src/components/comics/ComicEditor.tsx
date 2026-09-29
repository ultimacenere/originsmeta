"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveComic, type ComicActionState } from "@/lib/community/comicActions";
import {
  COMIC_COVER_MIN,
  COMIC_COVER_SIZE,
  COMIC_FILE_MAX_BYTES,
  COMIC_LIMITS,
  COMIC_PAGE_BOX,
  COMIC_SOURCE_MAX_BYTES,
  type ComicPage,
  type ComicStatus,
} from "@/lib/community/comics";
import { codePoints } from "@/lib/community/guides";
import { PROFILE_MEDIA_BUCKET, mediaPublicUrl } from "@/lib/community/profileMedia";
import { fillLabel } from "@/lib/community/deckQuality";
import { supabaseUrl } from "@/lib/supabase/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import type { ComicLabels } from "@/lib/comicLabels";
import { MediaError, encodeImage, encodeImageSized, uploadMedia } from "../showcase/mediaUpload";

/** Il fumetto da modificare, come lo legge la pagina (tavole già ricontrollate con `storedPages`). */
export type ComicEditorInitial = { id: string; status: ComicStatus; lang: string; title: string; summary: string; pages: ComicPage[]; cover_path: string | null };

type Props = {
  locale: string;
  mode: "create" | "edit";
  initial?: ComicEditorInitial;
  labels: Pick<ComicLabels, "editor" | "errors">;
  /** [id, nome] delle lingue, nella lingua della pagina */
  langs: [string, string][];
  /** la pagina di modifica dopo un salvataggio della bozza (?saved=1) */
  justSaved?: boolean;
};

type Row = ComicPage & { key: number };
let nextKey = 1;
const withKeys = (pages: readonly ComicPage[]): Row[] => pages.map((p) => ({ ...p, key: nextKey++ }));
const imageUrl = (path: string) => mediaPublicUrl(supabaseUrl, path);

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";

/**
 * Modulo dei fumetti (pacchetto FUMETTI, 29/09/2026): titolo, lingua dei testi, presentazione, copertina 16:9 e tavole
 * (fino a 10, riordinabili, ognuna con il suo testo). Le immagini le riduce e ricodifica il browser (tavole intere entro
 * 1080 × 1920, copertina ritagliata al centro in 16:9, WebP senza EXIF) e le carica nello Storage, cartella
 * `<id>/comic/` di chi pubblica: alla Server Action arrivano solo i percorsi (`pages` in JSON, `cover_path`). Le prove
 * caricate e poi tolte prima di salvare si cancellano subito; quelle già salvate e poi tolte le cancella la Server Action
 * dopo il salvataggio. Invio a mano (niente `<form action>`), come le guide: React 19 svuoterebbe i campi anche con un
 * errore. Le regole sono quelle di `readComicForm` (comics.ts), che la Server Action applica di nuovo; il database per terzo.
 */
export function ComicEditor({ locale, mode, initial, labels, langs, justSaved }: Props) {
  const router = useRouter();
  const L = labels.editor;
  const E = labels.errors;
  const CL = COMIC_LIMITS;
  const [state, formAction, pending] = useActionState<ComicActionState, FormData>(saveComic, {});
  const [, startSubmit] = useTransition();
  const [lang, setLang] = useState(initial?.lang ?? locale);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [rows, setRows] = useState<Row[]>(() => withKeys(initial?.pages ?? []));
  const [coverPath, setCoverPath] = useState<string | null>(initial?.cover_path ?? null);
  /** i file salvati nel database: non si cancellano qui (lo fa la Server Action quando non servono più) */
  const saved = useRef(new Set([...(initial?.pages ?? []).map((p) => p.path), ...(initial?.cover_path ? [initial.cover_path] : [])]));
  const [progress, setProgress] = useState<{ n: number; total: number } | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const pagesInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const hidden = initial?.status === "hidden";
  const published = initial?.status === "published";

  /* esito della Server Action: evento alla prima pubblicazione, poi la pagina successiva */
  useEffect(() => {
    if (!state.ok || !state.href) return;
    if (state.firstPublish) trackEvent("comic_published", { comic_lang: state.lang ?? lang });
    router.push(state.href);
    // solo quando cambia l'esito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router]);

  /* errore su un campo: lo si mette a fuoco (id `cm-…`) */
  useEffect(() => {
    if (!state.field) return;
    requestAnimationFrame(() => document.getElementById(`cm-${state.field}`)?.focus());
  }, [state]);

  /** Toglie dallo Storage un file caricato qui e non ancora salvato (quelli salvati li toglie la Server Action). */
  const dropUnsaved = (path: string | null) => {
    if (!path || saved.current.has(path)) return;
    const sb = supabaseBrowser();
    if (sb) void sb.storage.from(PROFILE_MEDIA_BUCKET).remove([path]);
  };

  const uploadCode = (err: unknown) => (err instanceof MediaError ? err.code : "upload");

  /** Il client del browser e chi ha fatto l'accesso: senza, il caricamento non parte. */
  async function uploader() {
    const sb = supabaseBrowser();
    if (!sb) throw new MediaError("upload");
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new MediaError("upload");
    return { sb, userId: data.user.id };
  }

  /** Tavole scelte dal computer: una alla volta, nell'ordine scelto, finché c'è posto. */
  const onPages = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (pagesInput.current) pagesInput.current.value = "";
    if (!list.length) return;
    setUploadError(null);
    const room = CL.pagesMax - rows.length;
    if (room <= 0) {
      setUploadError(fillLabel(L.uploadErrors.full, { max: String(CL.pagesMax) }));
      return;
    }
    const todo = list.slice(0, room);
    try {
      const { sb, userId } = await uploader();
      for (let i = 0; i < todo.length; i++) {
        setProgress({ n: i + 1, total: todo.length });
        const file = todo[i];
        if (file.size > COMIC_SOURCE_MAX_BYTES) {
          setUploadError(L.uploadErrors.source);
          break;
        }
        const { blob, width, height } = await encodeImageSized(file, { box: COMIC_PAGE_BOX, maxBytes: COMIC_FILE_MAX_BYTES });
        const path = await uploadMedia(sb, userId, "comic", blob);
        setRows((rs) => [...rs, { key: nextKey++, path, width, height, text: "" }]);
      }
      if (list.length > room) setUploadError(fillLabel(L.uploadErrors.full, { max: String(CL.pagesMax) }));
    } catch (err) {
      setUploadError(L.uploadErrors[uploadCode(err)]);
    } finally {
      setProgress(null);
    }
  };

  /** Copertina: ritaglio al centro in 16:9, lato lungo a 1600 px. */
  const onCover = async (file: File | undefined) => {
    if (coverInput.current) coverInput.current.value = "";
    if (!file) return;
    setCoverError(null);
    if (file.size > COMIC_SOURCE_MAX_BYTES) {
      setCoverError(L.uploadErrors.source);
      return;
    }
    setCoverBusy(true);
    try {
      const { sb, userId } = await uploader();
      const blob = await encodeImage(file, { aspect: COMIC_COVER_SIZE.width / COMIC_COVER_SIZE.height, maxSide: COMIC_COVER_SIZE.width, maxBytes: COMIC_FILE_MAX_BYTES });
      const path = await uploadMedia(sb, userId, "comic", blob);
      dropUnsaved(coverPath);
      setCoverPath(path);
    } catch (err) {
      setCoverError(L.uploadErrors[uploadCode(err)]);
    } finally {
      setCoverBusy(false);
    }
  };

  const setText = (i: number, text: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, text } : r)));
  const move = (i: number, by: -1 | 1) =>
    setRows((rs) => {
      const j = i + by;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => {
    dropUnsaved(rows[i]?.path ?? null);
    setRows((rs) => rs.filter((_, j) => j !== i));
  };

  const counter = (n: number, max: number) => fillLabel(L.counter, { n: String(n), max: String(max) });
  const errorText = (() => {
    if (!state.error) return null;
    const text = (E as Record<string, string>)[state.error] ?? E.db;
    const n = state.error === "tooFast" ? String(state.retryIn ?? 10) : String((state.index ?? 0) + 1);
    const limits: Record<string, [number, number]> = { title: [CL.titleMin, CL.titleMax], summary: [CL.summaryMin, CL.summaryMax], pages: [1, CL.pagesMax] };
    const [min, max] = limits[state.error] ?? [0, 0];
    return fillLabel(text, { n, min: String(min), max: String(max) });
  })();
  const status = hidden ? L.statusHidden : published ? L.statusPublished : mode === "edit" ? L.statusDraft : null;
  const busy = pending || progress !== null || coverBusy;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        startSubmit(() => formAction(new FormData(e.currentTarget, submitter)));
      }}
      className="grid grid-cols-1 gap-6"
    >
      <input type="hidden" name="locale" value={locale} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="cover_path" value={coverPath ?? ""} />
      <input type="hidden" name="pages" value={JSON.stringify(rows.map(({ path, width, height, text }) => ({ path, width, height, text })))} />

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

      <section className="card-night min-w-0 p-5 sm:p-6">
        <label className="block">
          <span className="kicker text-pale-muted">{L.title} *</span>
          <input id="cm-title" name="title" maxLength={CL.titleMax} value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} font-display font-bold`} />
          <span className="mt-1 block text-right font-mono text-xs text-pale-muted">{counter(codePoints(title), CL.titleMax)}</span>
        </label>
        <label className="mt-2 block max-w-sm">
          <span className="kicker text-pale-muted">{L.lang}</span>
          <select id="cm-lang" name="lang" value={lang} onChange={(e) => setLang(e.target.value)} className={inputCls} aria-describedby="cm-lang-hint">
            {langs.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p id="cm-lang-hint" className="mt-1 text-xs text-pale-muted">
          {L.langHint}
        </p>
        <label className="mt-4 block">
          <span className="kicker text-pale-muted">{L.summary} *</span>
          <textarea id="cm-summary" name="summary" rows={3} maxLength={CL.summaryMax} value={summary} onChange={(e) => setSummary(e.target.value)} aria-describedby="cm-summary-hint" className={inputCls} />
          <span id="cm-summary-hint" className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-pale-muted">
            <span>{fillLabel(L.summaryHint, { min: String(CL.summaryMin), max: String(CL.summaryMax) })}</span>
            <span className="font-mono">{counter(codePoints(summary), CL.summaryMax)}</span>
          </span>
        </label>
      </section>

      <fieldset id="cm-cover" tabIndex={-1} className="card-night min-w-0 p-5 sm:p-6">
        <legend className="sr-only">{L.cover}</legend>
        <p className="t-item">{L.cover} *</p>
        <p className="mt-1 text-xs text-pale-muted">
          {fillLabel(L.coverHint, { minw: String(COMIC_COVER_MIN.width), minh: String(COMIC_COVER_MIN.height), w: String(COMIC_COVER_SIZE.width), h: String(COMIC_COVER_SIZE.height) })}
        </p>
        {coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(coverPath)} alt={L.coverAlt} width={COMIC_COVER_SIZE.width} height={COMIC_COVER_SIZE.height} className="mt-3 aspect-[16/9] w-full max-w-md rounded-lg border-2 border-sky object-cover" />
        ) : null}
        <label className={`btn btn-ink mt-3 text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${coverBusy ? "opacity-60" : "cursor-pointer"}`}>
          <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={coverBusy} onChange={(e) => onCover(e.target.files?.[0])} />
          {coverBusy ? L.uploading : coverPath ? L.coverReplace : L.coverUpload}
        </label>
        {coverError ? (
          <p className="alert-bad mt-3" role="alert">
            {coverError}
          </p>
        ) : null}
      </fieldset>

      <section className="card-night min-w-0 p-5 sm:p-6" aria-labelledby="cm-pages-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p id="cm-pages-title" className="t-item">
            {L.pages} *
          </p>
          <span className="font-mono text-xs text-pale-muted">{fillLabel(L.pagesCount, { n: String(rows.length), max: String(CL.pagesMax) })}</span>
        </div>
        <p className="mt-1 text-xs text-pale-muted">{fillLabel(L.pagesHint, { w: String(COMIC_PAGE_BOX.width), h: String(COMIC_PAGE_BOX.height), max: String(CL.pagesMax) })}</p>
        <ol id="cm-pages" tabIndex={-1} className="mt-4 grid grid-cols-1 gap-4">
          {rows.map((r, i) => (
            <li key={r.key} className="grid grid-cols-1 gap-3 rounded-xl bg-night-2/80 p-3 sm:grid-cols-[140px_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(r.path)} alt={fillLabel(L.pageLabel, { n: String(i + 1) })} width={r.width} height={r.height} className="h-auto w-[140px] rounded-lg border-2 border-sky" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold text-sky">{fillLabel(L.pageLabel, { n: String(i + 1) })}</p>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-ghost px-2 py-1 text-xs" aria-label={`${L.pageUp} · ${fillLabel(L.pageLabel, { n: String(i + 1) })}`}>
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="btn btn-ghost px-2 py-1 text-xs" aria-label={`${L.pageDown} · ${fillLabel(L.pageLabel, { n: String(i + 1) })}`}>
                    ↓
                  </button>
                  <button type="button" onClick={() => remove(i)} className="text-xs text-bad underline underline-offset-2">
                    {L.pageRemove}
                  </button>
                </div>
                <label className="mt-2 block">
                  <span className="kicker text-pale-muted">{fillLabel(L.pageText, { n: String(i + 1) })}</span>
                  <textarea id={`cm-page-${i}`} rows={4} maxLength={CL.pageTextMax} value={r.text} onChange={(e) => setText(i, e.target.value)} className={inputCls} />
                  <span className="mt-1 block text-right font-mono text-xs text-pale-muted">{counter(codePoints(r.text), CL.pageTextMax)}</span>
                </label>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-pale-muted">{L.pageTextHint}</p>
        <label className={`btn btn-ink mt-4 text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${progress || rows.length >= CL.pagesMax ? "opacity-60" : "cursor-pointer"}`}>
          <input
            ref={pagesInput}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={progress !== null || rows.length >= CL.pagesMax}
            onChange={(e) => onPages(e.target.files)}
          />
          {progress ? fillLabel(L.pagesUploading, { n: String(progress.n), total: String(progress.total) }) : L.pagesAdd}
        </label>
        {uploadError ? (
          <p className="alert-bad mt-3" role="alert">
            {uploadError}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-pale-muted">{L.rights}</p>
      </section>

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
              {/* un fumetto nascosto non si modifica: lo rimette online lo staff */}
              <button type="submit" name="intent" value="publish" disabled={busy || hidden} className="btn btn-primary">
                {pending ? L.saving : L.update}
              </button>
              {published ? (
                <button type="submit" name="intent" value="draft" disabled={busy} className="btn btn-ink">
                  {L.unpublish}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button type="submit" name="intent" value="publish" disabled={busy} className="btn btn-primary">
                {pending ? L.saving : L.publish}
              </button>
              <button type="submit" name="intent" value="draft" disabled={busy} className="btn btn-ink">
                {L.saveDraft}
              </button>
            </>
          )}
        </div>
      </section>
    </form>
  );
}
