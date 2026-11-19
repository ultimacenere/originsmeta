"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { MarkdownToolbar } from "@/components/MarkdownToolbar";
import { deleteAnnouncement, editAnnouncement, postAnnouncement, type AnnouncementActionState } from "@/lib/tournament/announcementActions";
import { ANNOUNCEMENT_BODY_MAX, ANNOUNCEMENT_LINK_MAX, ANNOUNCEMENT_TITLE_MAX } from "@/lib/tournament/announcements";
import type { AnnouncementLabels } from "@/lib/tournament/announcementLabels";

/**
 * Comandi della bacheca per lo staff del torneo (19/11/2026): il modulo per pubblicare e, su ogni annuncio, modifica ed
 * eliminazione. Le etichette arrivano dal server (solo la lingua della pagina finisce nel bundle). Dopo ogni scrittura
 * la pagina si rilegge (`router.refresh`); il database ricontrolla chi può fare cosa.
 */

type Compose = AnnouncementLabels["compose"];
type Errors = AnnouncementLabels["errors"];
export type AnnouncementTarget = { id: string; slug: string; name: string; checked: boolean };

const field = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale placeholder:text-pale-muted/80 focus:border-mint";
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

function useRefreshOnOk(state: AnnouncementActionState, after?: () => void) {
  const router = useRouter();
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state.ok || state.at === seen.current) return;
    seen.current = state.at;
    after?.();
    router.refresh();
  }, [state, router, after]);
}

function Fields({ L, locale, idp, initial, maxBody }: { L: Compose; locale: Locale; idp: string; initial?: { title: string; body: string; link: string; pinned: boolean }; maxBody: number }) {
  const [body, setBody] = useState(initial?.body ?? "");
  const n = [...body].length;
  return (
    <>
      <label htmlFor={`${idp}-title`} className="mt-3 block text-sm font-bold text-pale">
        {L.titleLabel}
      </label>
      <input id={`${idp}-title`} name="title" required minLength={3} maxLength={ANNOUNCEMENT_TITLE_MAX} defaultValue={initial?.title ?? ""} placeholder={L.titlePlaceholder} className={field} />
      <label htmlFor={`${idp}-body`} className="mt-3 block text-sm font-bold text-pale">
        {L.bodyLabel}
      </label>
      <MarkdownToolbar target={`${idp}-body`} locale={locale} headings={false} className="mt-1" />
      <textarea id={`${idp}-body`} name="body" rows={5} maxLength={maxBody + 200} value={body} onChange={(e) => setBody(e.target.value)} className={field} />
      <p className={`mt-1 text-xs ${n > maxBody ? "text-bad" : "text-pale-muted"}`}>
        {fill(L.bodyHint, { max: maxBody })} <span className="font-mono">{n}/{maxBody}</span>
      </p>
      <label htmlFor={`${idp}-link`} className="mt-3 block text-sm font-bold text-pale">
        {L.linkLabel}
      </label>
      <input id={`${idp}-link`} name="link" type="url" inputMode="url" pattern="https://.+" maxLength={ANNOUNCEMENT_LINK_MAX} defaultValue={initial?.link ?? ""} placeholder="https://" className={field} />
      <label className="mt-3 flex items-center gap-2 text-sm text-pale">
        <input type="checkbox" name="pinned" defaultChecked={initial?.pinned ?? false} className="h-4 w-4 accent-mint" />
        {L.pinnedLabel}
      </label>
    </>
  );
}

/** Il modulo per pubblicare un annuncio. */
export function AnnouncementComposer({ locale, L, errors, targets, open = false }: { locale: Locale; L: Compose; errors: Errors; targets: AnnouncementTarget[]; open?: boolean }) {
  const idp = useId();
  const [key, setKey] = useState(0);
  const [state, action, pending] = useActionState(postAnnouncement, {});
  useRefreshOnOk(state, () => setKey((k) => k + 1));
  const sent = state.ok ? (state.recipients === 1 ? L.sentOne : state.recipients ? fill(L.sent, { n: state.recipients.toLocaleString(locale) }) : L.sentNone) : null;
  return (
    <details className="card-night mt-4 p-4" open={open}>
      <summary className="cursor-pointer font-display text-base font-bold text-mint">{L.heading}</summary>
      <form action={action} key={key} className="mt-1">
        <Fields L={L} locale={locale} idp={idp} maxBody={ANNOUNCEMENT_BODY_MAX} />
        {targets.map((t) => (
          <input key={`s-${t.id}`} type="hidden" name="slug" value={t.slug} />
        ))}
        <fieldset className="mt-3">
          <legend className="text-sm font-bold text-pale">{L.targetsLabel}</legend>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {targets.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm text-pale">
                <input type="checkbox" name="tid" value={t.id} defaultChecked={t.checked} className="h-4 w-4 accent-mint" />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-3 text-xs text-pale-muted">{L.notifyNote}</p>
        <p className="mt-1 text-xs text-pale-muted">{L.publicNote}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary text-sm" disabled={pending}>
            {pending ? L.submitting : L.submit}
          </button>
        </div>
      </form>
      {sent ? (
        <p className="mt-2 text-sm text-good" role="status">
          {sent}
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-2 text-sm text-bad" role="alert">
          {errors[state.error] ?? errors.generic}
        </p>
      ) : null}
    </details>
  );
}

/** Modifica ed eliminazione di un annuncio. */
export function AnnouncementItemControls({
  locale,
  L,
  errors,
  item,
  slugs,
}: {
  locale: Locale;
  L: Compose;
  errors: Errors;
  item: { id: number; title: string; body: string; link_url: string | null; pinned: boolean };
  slugs: string[];
}) {
  const idp = useId();
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editPending] = useActionState(editAnnouncement, {});
  const [delState, delAction, delPending] = useActionState(deleteAnnouncement, {});
  useRefreshOnOk(editState, () => setEditing(false));
  useRefreshOnOk(delState);
  const error = editState.error ?? delState.error;
  const hidden = (
    <>
      <input type="hidden" name="id" value={item.id} />
      {slugs.map((s) => (
        <input key={s} type="hidden" name="slug" value={s} />
      ))}
    </>
  );
  return (
    <div className="mt-3">
      {editing ? (
        <form action={editAction} className="rounded-lg border border-sky p-3">
          {hidden}
          <Fields L={L} locale={locale} idp={idp} maxBody={ANNOUNCEMENT_BODY_MAX} initial={{ title: item.title, body: item.body, link: item.link_url ?? "", pinned: item.pinned }} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary text-xs" disabled={editPending}>
              {editPending ? L.saving : L.save}
            </button>
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing(false)}>
              {L.cancel}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing(true)}>
            {L.edit}
          </button>
          <form
            action={delAction}
            onSubmit={(e) => {
              if (!window.confirm(L.confirmRemove)) e.preventDefault();
            }}
          >
            {hidden}
            <button type="submit" className="btn btn-ghost text-xs text-bad" disabled={delPending}>
              {delPending ? L.removing : L.remove}
            </button>
          </form>
        </div>
      )}
      {error ? (
        <p className="mt-2 text-xs text-bad" role="alert">
          {errors[error] ?? errors.generic}
        </p>
      ) : null}
    </div>
  );
}
