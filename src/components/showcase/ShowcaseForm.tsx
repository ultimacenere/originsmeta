"use client";

import { useActionState, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseUrl } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";
import type { Locale } from "@/lib/i18n";
import {
  ACCENTS,
  ACCENT_HEX,
  COVER_MAX_BYTES,
  COVER_MAX_SIDE,
  COVER_PRESETS,
  DEFAULT_COVER_PRESET,
  DURATION_MAX,
  DURATION_MIN,
  SCHEDULE_MAX,
  TAGLINE_MAX,
  TIMEZONES,
  coverStyle,
  isTimeZone,
  mediaPublicUrl,
  timeZoneName,
  weekdayName,
  type Accent,
  type CoverPreset,
  type ScheduleEntry,
  type ShowcaseFormErrors,
} from "@/lib/community/showcase";
import { saveShowcase, type ShowcaseActionState } from "@/lib/community/showcaseActions";
import { fillShowcase, type ShowcaseEditorLabels } from "@/lib/showcaseLabels";
import { MediaError, cleanupMedia, encodeImage, uploadMedia } from "./mediaUpload";

/** Valori iniziali del modulo (la vetrina salvata, in forma serializzabile). */
export type ShowcaseInitial = {
  coverPreset: CoverPreset | null;
  coverPath: string | null;
  accent: Accent | null;
  tagline: string | null;
  favoriteLegendary: string | null;
  featuredDeck: string | null;
  featuredVideo: string | null;
  schedule: ScheduleEntry[];
  scheduleTz: string | null;
};

type Row = { key: number; day: string; time: string; minutes: string };

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";
const tileCls =
  "relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-sky bg-night text-xs text-pale has-[:checked]:border-mint has-[:checked]:ring-2 has-[:checked]:ring-mint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint";

let nextKey = 1;
const toRows = (entries: readonly ScheduleEntry[]): Row[] => entries.map((e) => ({ key: nextKey++, day: String(e.day), time: e.time, minutes: e.minutes ? String(e.minutes) : "" }));

/** Il fuso di chi apre il modulo, se è fra quelli dell'elenco; altrimenti quello più probabile per la lingua. */
function guessTimeZone(locale: Locale): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isTimeZone(tz)) return tz;
  } catch {
    // niente: si sceglie per lingua
  }
  return locale === "it" ? "Europe/Rome" : locale === "es" ? "Europe/Madrid" : "Europe/London";
}

/**
 * Modulo "Personalizza la vetrina" di /account (pacchetto VETRINA, 27/09/2026), solo per Creator, Autore, Pro e Staff:
 * copertina (8 sfondi o un'immagine caricata dal browser nello Storage), colore d'accento, frase, Leggendaria del
 * cuore, mazzo e video in evidenza, orari delle dirette con il fuso. I controlli veri li fa il server (`saveShowcase`)
 * e poi il database; qui c'è l'aiuto. Si monta solo nel browser (il fuso predefinito è quello di chi guarda).
 */
export function ShowcaseForm(props: Props) {
  const mounted = useMounted();
  if (!mounted) return <div className="card-night mt-4 min-h-[28rem] p-6" aria-busy="true" />;
  return <ShowcaseFormInner {...props} />;
}

type Props = {
  userId: string;
  locale: Locale;
  labels: ShowcaseEditorLabels;
  presetNames: Record<CoverPreset, string>;
  accentNames: Record<Accent, string>;
  initial: ShowcaseInitial;
  legendaries: { slug: string; name: string }[];
  decks: { id: string; name: string }[];
  publicHref?: string;
};

function ShowcaseFormInner({ userId, locale, labels, presetNames, accentNames, initial, legendaries, decks, publicHref }: Props) {
  const L = labels;
  const [cover, setCover] = useState<string>(initial.coverPath ? "image" : (initial.coverPreset ?? DEFAULT_COVER_PRESET));
  const [coverPath, setCoverPath] = useState<string | null>(initial.coverPath);
  const [accent, setAccent] = useState<Accent>(initial.accent ?? "sky");
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [legendary, setLegendary] = useState(initial.favoriteLegendary ?? "");
  const [deck, setDeck] = useState(initial.featuredDeck ?? "");
  const [video, setVideo] = useState(initial.featuredVideo ?? "");
  const [rows, setRows] = useState<Row[]>(() => toRows(initial.schedule));
  const [tz, setTz] = useState<string>(() => (initial.scheduleTz && isTimeZone(initial.scheduleTz) ? initial.scheduleTz : guessTimeZone(locale)));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ShowcaseFormErrors | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState<ShowcaseActionState, FormData>(async (prev, fd) => {
    const res = await saveShowcase(prev, fd);
    setErrors(res.fields ?? null);
    if (res.ok && res.value) {
      const v = res.value;
      setCover(v.cover_path ? "image" : (v.cover_preset ?? DEFAULT_COVER_PRESET));
      setCoverPath(v.cover_path);
      setAccent(v.accent ?? "sky");
      setTagline(v.tagline ?? "");
      setLegendary(v.favorite_legendary ?? "");
      setDeck(v.featured_deck ?? "");
      setVideo(v.featured_video ?? "");
      setRows(toRows(v.schedule));
      if (v.schedule_tz) setTz(v.schedule_tz);
      setDirty(false);
      // le copertine caricate e non più in uso (o mai salvate) si cancellano
      const sb = supabaseBrowser();
      if (sb) await cleanupMedia(sb, userId, "cover", v.cover_path);
    }
    return res;
  }, {});

  const touch = () => {
    setDirty(true);
  };

  const onCoverFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new MediaError("upload");
      const blob = await encodeImage(file, { maxSide: COVER_MAX_SIDE, maxBytes: COVER_MAX_BYTES });
      const path = await uploadMedia(sb, userId, "cover", blob);
      setCoverPath(path);
      setCover("image");
      touch();
    } catch (err) {
      const code = err instanceof MediaError ? err.code : "upload";
      setUploadError(L.errors[code]);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: weekdayName(locale, d) }));
  const rowError = (i: number) => errors?.schedule?.find((x) => x.index === i)?.error;
  const rowErrorText = (code: "day" | "time" | "duration") =>
    code === "day" ? L.errors.scheduleDay : code === "time" ? L.errors.scheduleTime : fillShowcase(L.errors.scheduleDuration, { min: DURATION_MIN, max: DURATION_MAX });
  const topError = state.error && state.error !== "invalid" ? L.errors[state.error] : errors ? L.errors.invalid : null;
  const fieldError = (text: string | null) => (text ? <span className="mt-1 block text-xs text-bad">{text}</span> : null);

  return (
    <form action={formAction} className="card-night mt-4 space-y-7 p-5 sm:p-6" onChange={touch}>
      {/* copertina: 8 sfondi disegnati con la palette del sito, oppure l'immagine caricata */}
      <fieldset>
        <legend className="kicker text-chalk-muted">{L.cover}</legend>
        <p className="mt-1 text-xs text-pale-muted">{L.coverHint}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COVER_PRESETS.map((p) => (
            <label key={p} className={tileCls}>
              <input type="radio" name="cover" value={p} checked={cover === p} onChange={() => setCover(p)} className="sr-only" />
              <span aria-hidden="true" className="block h-14 w-full" style={coverStyle(p)} />
              <span className="px-2 py-1.5">{presetNames[p]}</span>
            </label>
          ))}
          {coverPath ? (
            <label className={tileCls}>
              <input type="radio" name="cover" value="image" checked={cover === "image"} onChange={() => setCover("image")} className="sr-only" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaPublicUrl(supabaseUrl, coverPath)} alt="" className="block h-14 w-full object-cover" />
              <span className="px-2 py-1.5">{L.coverImage}</span>
            </label>
          ) : null}
        </div>
        <input type="hidden" name="cover_path" value={cover === "image" && coverPath ? coverPath : ""} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className={`btn btn-ink text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${uploading ? "opacity-60" : "cursor-pointer"}`}>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(e) => onCoverFile(e.target.files?.[0])} />
            {uploading ? L.coverUploading : L.coverUpload}
          </label>
          <span className="text-xs text-pale-muted">{fillShowcase(L.coverImageHint, { size: COVER_MAX_SIDE })}</span>
        </div>
        {fieldError(uploadError ?? (errors?.cover === "image" ? L.errors.coverImage : errors?.cover ? L.errors.cover : null))}
      </fieldset>

      {/* colore d'accento: contrasto almeno 4,5:1 sul blu notte (showcase.test.ts) */}
      <fieldset>
        <legend className="kicker text-chalk-muted">{L.accent}</legend>
        <p className="mt-1 text-xs text-pale-muted">{L.accentHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-sky bg-night px-2.5 py-1.5 text-sm text-pale has-[:checked]:border-mint has-[:checked]:ring-2 has-[:checked]:ring-mint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint"
            >
              <input type="radio" name="accent" value={a} checked={accent === a} onChange={() => setAccent(a)} className="sr-only" />
              <span aria-hidden="true" className="h-4 w-4 rounded-full" style={{ backgroundColor: ACCENT_HEX[a] }} />
              <span style={{ color: ACCENT_HEX[a] }}>{accentNames[a]}</span>
            </label>
          ))}
        </div>
        {fieldError(errors?.accent ? L.errors.accent : null)}
      </fieldset>

      <label className="block">
        <span className="kicker text-chalk-muted">{L.tagline}</span>
        <input
          type="text"
          name="tagline"
          value={tagline}
          maxLength={TAGLINE_MAX * 2}
          onChange={(e) => setTagline(e.target.value)}
          placeholder={L.taglinePlaceholder}
          aria-invalid={errors?.tagline ? true : undefined}
          className={inputCls}
        />
        <span className={`mt-1 block text-xs ${errors?.tagline || [...tagline].length > TAGLINE_MAX ? "text-bad" : "text-pale-muted"}`}>
          {fillShowcase(errors?.tagline ? L.errors.tagline : L.taglineHint, { max: TAGLINE_MAX })} ({[...tagline].length}/{TAGLINE_MAX})
        </span>
      </label>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="block min-w-0">
          <span className="kicker text-chalk-muted">{L.legendary}</span>
          <select name="favorite_legendary" value={legendary} onChange={(e) => setLegendary(e.target.value)} className={inputCls} aria-invalid={errors?.legendary ? true : undefined}>
            <option value="">{L.legendaryNone}</option>
            {legendaries.map((c) => (
              <option key={c.slug} value={c.slug}>
                ★ {c.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-pale-muted">{L.legendaryHint}</span>
          {fieldError(errors?.legendary ? L.errors.legendary : null)}
        </label>

        <label className="block min-w-0">
          <span className="kicker text-chalk-muted">{L.deck}</span>
          {decks.length ? (
            <select name="featured_deck" value={deck} onChange={(e) => setDeck(e.target.value)} className={inputCls} aria-invalid={errors?.deck ? true : undefined}>
              <option value="">{L.deckNone}</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="featured_deck" value="" />
              <span className="mt-1 block rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale-muted">{L.noDecks}</span>
            </>
          )}
          <span className="mt-1 block text-xs text-pale-muted">{L.deckHint}</span>
          {fieldError(errors?.deck ? L.errors.deck : null)}
        </label>
      </div>

      <label className="block">
        <span className="kicker text-chalk-muted">{L.video}</span>
        <input
          type="url"
          name="featured_video"
          value={video}
          inputMode="url"
          maxLength={2048}
          onChange={(e) => setVideo(e.target.value)}
          placeholder={L.videoPlaceholder}
          aria-invalid={errors?.video ? true : undefined}
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-pale-muted">{L.videoHint}</span>
        {fieldError(errors?.video ? L.errors.video : null)}
      </label>

      {/* orari delle dirette: nel fuso del creator; su /u ognuno li vede nel suo */}
      <fieldset>
        <legend className="kicker text-chalk-muted">{L.schedule}</legend>
        <p className="mt-1 text-xs text-pale-muted">{L.scheduleHint}</p>
        <ul className="mt-3 space-y-3">
          {rows.map((row, i) => {
            const err = rowError(i);
            const set = (patch: Partial<Row>) => setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, ...patch } : r)));
            return (
              <li key={row.key} className="flex flex-wrap items-end gap-2 rounded-lg border border-felt-line p-2.5">
                <label className="min-w-0 flex-1 basis-32">
                  <span className="text-xs text-pale-muted">{L.day}</span>
                  <select name="slot_day" value={row.day} onChange={(e) => set({ day: e.target.value })} className={inputCls}>
                    {days.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-28">
                  <span className="text-xs text-pale-muted">{L.time}</span>
                  <input type="time" name="slot_time" value={row.time} step={60} onChange={(e) => set({ time: e.target.value })} className={`${inputCls} [color-scheme:dark]`} required />
                </label>
                <label className="w-28">
                  <span className="text-xs text-pale-muted">
                    {L.duration} <span className="sr-only">({fillShowcase(L.durationHint, { min: DURATION_MIN, max: DURATION_MAX })})</span>
                  </span>
                  <input
                    type="number"
                    name="slot_minutes"
                    value={row.minutes}
                    min={DURATION_MIN}
                    max={DURATION_MAX}
                    step={15}
                    inputMode="numeric"
                    placeholder="—"
                    onChange={(e) => set({ minutes: e.target.value })}
                    className={inputCls}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-ink text-xs"
                  onClick={() => {
                    setRows((cur) => cur.filter((r) => r.key !== row.key));
                    touch();
                  }}
                >
                  {L.removeSlot}
                </button>
                {err ? <span className="basis-full text-xs text-bad">{rowErrorText(err)}</span> : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-1 text-xs text-pale-muted">
          {L.duration}: {fillShowcase(L.durationHint, { min: DURATION_MIN, max: DURATION_MAX })}
        </p>
        {rows.length < SCHEDULE_MAX ? (
          <button
            type="button"
            className="btn btn-ink mt-3 text-xs"
            onClick={() => {
              setRows((cur) => [...cur, { key: nextKey++, day: "0", time: "21:00", minutes: "" }]);
              touch();
            }}
          >
            {L.addSlot}
          </button>
        ) : null}
        {fieldError(errors?.scheduleTooMany ? fillShowcase(L.errors.scheduleTooMany, { max: SCHEDULE_MAX }) : null)}
        <label className="mt-4 block max-w-sm">
          <span className="text-xs text-pale-muted">{L.timezone}</span>
          <select name="timezone" value={tz} onChange={(e) => setTz(e.target.value)} className={inputCls} aria-invalid={errors?.timezone ? true : undefined}>
            {TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {timeZoneName(z)}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-pale-muted">{L.timezoneHint}</span>
          {fieldError(errors?.timezone === "required" ? L.errors.timezoneRequired : errors?.timezone ? L.errors.timezone : null)}
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending || uploading}>
          {pending ? L.saving : L.save}
        </button>
        {publicHref ? (
          <a href={publicHref} className="link-mint text-sm font-bold">
            {L.viewPage} →
          </a>
        ) : null}
        <p role="status" aria-live="polite" className={`min-h-[1.25rem] text-sm ${topError ? "text-bad" : "text-mint"}`}>
          {topError ?? (state.ok && !dirty ? L.saved : "")}
        </p>
      </div>
    </form>
  );
}
