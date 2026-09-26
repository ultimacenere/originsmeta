"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  MAX_DECK_LINKS,
  MAX_DECK_VIDEOS,
  allowedSiteNames,
  formatStart,
  linkFields,
  parseLink,
  parseStartInput,
  parseVideoUrl,
  videoFields,
  type DeckLink,
  type StoredVideo,
} from "@/lib/videos";
import { fillVideoLabel, videoLabels } from "@/lib/videoLabels";

type VideoRow = { url: string; start: string };
type LinkRow = { label: string; url: string };
type Draft = Partial<Record<string, string>> | null | undefined;

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";

/** Righe iniziali: la bozza locale se ne ha, altrimenti quel che è salvato; sempre almeno una riga vuota. */
function videoRows(initial: StoredVideo[], draft: Draft): VideoRow[] {
  const fromDraft = Array.from({ length: MAX_DECK_VIDEOS }, (_, i) => ({ url: draft?.[videoFields(i).url] ?? "", start: draft?.[videoFields(i).start] ?? "" })).filter((r) => r.url || r.start);
  const rows = fromDraft.length ? fromDraft : initial.map((v) => ({ url: v.url, start: v.start ? formatStart(v.start) : "" }));
  return rows.length ? rows.slice(0, MAX_DECK_VIDEOS) : [{ url: "", start: "" }];
}

function linkRows(initial: DeckLink[], draft: Draft): LinkRow[] {
  const fromDraft = Array.from({ length: MAX_DECK_LINKS }, (_, i) => ({ label: draft?.[linkFields(i).label] ?? "", url: draft?.[linkFields(i).url] ?? "" })).filter((r) => r.url || r.label);
  const rows = fromDraft.length ? fromDraft : initial.map((l) => ({ label: l.label, url: l.url }));
  return rows.length ? rows.slice(0, MAX_DECK_LINKS) : [{ label: "", url: "" }];
}

/** Mette il fuoco sul campo appena aggiunto (dopo il render che lo crea). */
function focusSoon(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/**
 * Video e risorse nel modulo di pubblicazione e modifica di un mazzo (pacchetto VIDEO, 26/09/2026): fino a 3 video con
 * il minuto di partenza e fino a 5 link, righe aggiunte a mano. Sotto ogni riga si vede subito che cosa il sito ha
 * riconosciuto (stesse funzioni della Server Action, src/lib/videos.ts), così un link sbagliato si corregge prima di
 * pubblicare. I nomi dei campi (`video_url_0`, `link_label_0`…) li legge `readDeckMedia`; la bozza locale del modulo li
 * salva come gli altri campi (`MEDIA_FIELD_NAMES`).
 */
export function DeckMediaFields({ locale, initialVideos = [], initialLinks = [], draft }: { locale: Locale; initialVideos?: StoredVideo[]; initialLinks?: DeckLink[]; draft?: Draft }) {
  const all = videoLabels[locale];
  const L = all.form;
  const [videos, setVideos] = useState<VideoRow[]>(() => videoRows(initialVideos, draft));
  const [links, setLinks] = useState<LinkRow[]>(() => linkRows(initialLinks, draft));

  const setVideo = (i: number, patch: Partial<VideoRow>) => setVideos((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setLink = (i: number, patch: Partial<LinkRow>) => setLinks((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const dropVideo = (i: number) => setVideos((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ url: "", start: "" }]));
  const dropLink = (i: number) => setLinks((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ label: "", url: "" }]));

  return (
    <>
      <fieldset className="mt-5 min-w-0">
        <legend className="kicker text-pale-muted">{L.videosTitle}</legend>
        <p className="mt-1 text-xs text-pale-muted">{L.videosHint}</p>
        {videos.map((row, i) => {
          const f = videoFields(i);
          const parsed = row.url.trim() ? parseVideoUrl(row.url) : null;
          const start = parseStartInput(row.start);
          const at = start.ok ? (start.value ?? parsed?.start) : undefined;
          const statusId = `pub-${f.url}-status`;
          let status: { text: string; ok: boolean } | null = null;
          if (row.url.trim() && !parsed) status = { text: L.notRecognized, ok: false };
          else if (!start.ok) status = { text: L.startInvalid, ok: false };
          else if (parsed) {
            const what = fillVideoLabel(L.recognized, { provider: all.player.providers[parsed.provider], kind: all.player.kinds[parsed.kind] });
            const when = parsed.kind === "clip" ? (row.start.trim() ? L.clipNoStart : "") : at ? fillVideoLabel(L.recognizedFrom, { time: formatStart(at) }) : "";
            status = { text: [what, when].filter(Boolean).join(" · "), ok: true };
          }
          return (
            <div key={i} className="mt-3 rounded-lg bg-night-3/40 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-pale">{fillVideoLabel(L.videoUrl, { n: i + 1 })}</span>
                  <input
                    id={`pub-${f.url}`}
                    name={f.url}
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={500}
                    value={row.url}
                    onChange={(e) => setVideo(i, { url: e.target.value })}
                    placeholder={L.videoPlaceholder}
                    aria-describedby={statusId}
                    aria-invalid={status && !status.ok ? true : undefined}
                    className={`${inputCls} font-mono text-xs`}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-pale">{L.start}</span>
                  <input
                    id={`pub-${f.start}`}
                    name={f.start}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    value={row.start}
                    onChange={(e) => setVideo(i, { start: e.target.value })}
                    placeholder={L.startPlaceholder}
                    aria-describedby={`${statusId} pub-video-start-hint`}
                    className={`${inputCls} font-mono text-xs`}
                  />
                </label>
              </div>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <p id={statusId} className={`min-w-0 text-xs ${status ? (status.ok ? "text-good" : "text-bad") : "text-pale-muted"}`} aria-live="polite">
                  {status ? `${status.ok ? "✓ " : ""}${status.text}` : ""}
                </p>
                {row.url || row.start || videos.length > 1 ? (
                  <button type="button" onClick={() => dropVideo(i)} className="text-xs text-pale-muted underline underline-offset-2 hover:text-pale" aria-label={fillVideoLabel(L.removeRow, { n: i + 1 })}>
                    {L.remove}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        <p id="pub-video-start-hint" className="mt-2 text-xs text-pale-muted">
          {L.startHint}
        </p>
        {videos.length < MAX_DECK_VIDEOS ? (
          <button
            type="button"
            onClick={() => {
              setVideos((rows) => [...rows, { url: "", start: "" }]);
              focusSoon(`pub-${videoFields(videos.length).url}`);
            }}
            className="btn btn-ghost mt-2 text-xs"
          >
            {L.addVideo}
          </button>
        ) : null}
      </fieldset>

      <fieldset className="mt-5 min-w-0 pb-1">
        <legend className="kicker text-pale-muted">{L.linksTitle}</legend>
        <p className="mt-1 text-xs text-pale-muted">{fillVideoLabel(L.linksHint, { sites: allowedSiteNames().join(", ") })}</p>
        {links.map((row, i) => {
          const f = linkFields(i);
          const parsed = row.url.trim() ? parseLink(row.url) : null;
          const statusId = `pub-${f.url}-status`;
          const status = parsed ? (parsed.ok ? { text: fillVideoLabel(L.linkOk, { host: parsed.host }), ok: true } : { text: parsed.reason === "host" ? L.linkHost : L.linkInvalid, ok: false }) : null;
          return (
            <div key={i} className="mt-3 rounded-lg bg-night-3/40 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-pale">{L.linkLabel}</span>
                  <input
                    id={`pub-${f.label}`}
                    name={f.label}
                    type="text"
                    autoComplete="off"
                    maxLength={40}
                    value={row.label}
                    onChange={(e) => setLink(i, { label: e.target.value })}
                    placeholder={L.linkLabelPlaceholder}
                    className={`${inputCls} text-sm`}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-pale">{L.linkUrl}</span>
                  <input
                    id={`pub-${f.url}`}
                    name={f.url}
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={500}
                    value={row.url}
                    onChange={(e) => setLink(i, { url: e.target.value })}
                    placeholder="https://"
                    aria-describedby={statusId}
                    aria-invalid={status && !status.ok ? true : undefined}
                    className={`${inputCls} font-mono text-xs`}
                  />
                </label>
              </div>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <p id={statusId} className={`min-w-0 break-all text-xs ${status ? (status.ok ? "text-good" : "text-bad") : "text-pale-muted"}`} aria-live="polite">
                  {status ? `${status.ok ? "✓ " : ""}${status.text}` : ""}
                </p>
                {row.url || row.label || links.length > 1 ? (
                  <button type="button" onClick={() => dropLink(i)} className="text-xs text-pale-muted underline underline-offset-2 hover:text-pale" aria-label={fillVideoLabel(L.removeRow, { n: i + 1 })}>
                    {L.remove}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {links.length < MAX_DECK_LINKS ? (
          <button
            type="button"
            onClick={() => {
              setLinks((rows) => [...rows, { label: "", url: "" }]);
              focusSoon(`pub-${linkFields(links.length).label}`);
            }}
            className="btn btn-ghost mt-2 text-xs"
          >
            {L.addLink}
          </button>
        ) : null}
      </fieldset>
    </>
  );
}
