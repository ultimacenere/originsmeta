"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { textLength } from "@/lib/community/messages";
import {
  COMMENTS_ANCHOR,
  COMMENTS_PAGE,
  COMMENT_MAX,
  buildThreads,
  commentAnchor,
  commentAuthorName,
  commentErrorCode,
  isCommentRow,
  type CommentErrorCode,
  type CommentRow,
  type CommentThread,
} from "@/lib/community/comments";
import { addDeckComment, deleteDeckComment, editDeckComment, moderateDeckComment, reportDeckComment, type CommentResult } from "@/lib/community/commentActions";
import { isShowcaseBadge, normalizeBadge } from "@/lib/community/badges";
import { badgeStyle } from "@/lib/cardArt";
import { fillComment, type CommentLabels } from "@/lib/commentLabels";
import { trackEvent } from "@/lib/analytics";
import { Avatar } from "@/components/AccountMenu";
import { InboxTime } from "@/components/inbox/InboxTime";

/**
 * Sezione "Commenti" della scheda di un mazzo della community (02/10/2026). La pagina è ISR: i commenti si leggono qui,
 * nel browser, con la chiave pubblica (RLS: i commenti non nascosti dei mazzi pubblicati; in più i propri nascosti e,
 * per lo staff, tutti), e dopo ogni scrittura si rileggono, così un commento appena scritto si vede subito. Le scritture
 * passano dalle Server Action di commentActions.ts, che chiamano le funzioni deck_comment_* del database.
 * Risposte a un livello: "Rispondi" c'è solo sotto i commenti, mai sotto le risposte. Prima della migrazione la sezione
 * dice che i commenti non sono disponibili.
 */

const COLUMNS = "id, deck_id, user_id, parent_id, body, status, created_at, edited_at, author:profiles!deck_comments_user_id_fkey(username, display_name, avatar_url, badge)";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-chalk-muted bg-felt-deep px-3 py-2.5 text-base text-chalk placeholder:text-chalk-muted focus:border-mint aria-[invalid=true]:border-bad resize-y";

type Props = {
  deckId: string;
  ownerId: string;
  locale: string;
  loginHref: string;
  labels: CommentLabels;
  /** nomi dei ruoli nella lingua della pagina (dizionari: community.badges) */
  badges: Record<string, string>;
};

type Viewer = { uid: string | null; staff: boolean } | undefined;
type State = { status: "loading" } | { status: "unavailable" } | { status: "ready"; threads: CommentThread[]; more: boolean; count: number };

/**
 * I primi `n` commenti del mazzo (dal più recente) con le loro risposte e il numero dei commenti visibili; null senza
 * Supabase. Una tabella che manca (migrazione non ancora applicata) o un errore = "non disponibili".
 */
async function fetchComments(deckId: string, n: number): Promise<State | null> {
  const sb = supabaseBrowser();
  if (!sb) return null;
  const top = await sb
    .from("deck_comments")
    .select(COLUMNS)
    .eq("deck_id", deckId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(n + 1);
  if (top.error) {
    if (commentErrorCode(top.error) !== "unavailable") console.error("[comments] lettura:", top.error.message);
    return { status: "unavailable" };
  }
  const rows = ((top.data ?? []) as unknown[]).filter(isCommentRow);
  const shown = rows.slice(0, n);
  const ids = shown.map((r) => r.id);
  const [replies, count] = await Promise.all([
    ids.length ? sb.from("deck_comments").select(COLUMNS).in("parent_id", ids).order("created_at", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    sb.from("deck_comments").select("id", { count: "exact", head: true }).eq("deck_id", deckId).neq("status", "deleted"),
  ]);
  if (replies.error) console.error("[comments] risposte:", replies.error.message);
  const threads = buildThreads(shown, ((replies.data ?? []) as unknown[]).filter(isCommentRow));
  const total = typeof count.count === "number" ? count.count : threads.reduce((t, c) => t + (c.status === "deleted" ? 0 : 1) + c.replies.length, 0);
  return { status: "ready", threads, more: rows.length > n, count: total };
}

export function DeckComments({ deckId, ownerId, locale, loginHref, labels: L, badges }: Props) {
  const [viewer, setViewer] = useState<Viewer>(supabaseEnabled ? undefined : { uid: null, staff: false });
  // senza la community (NEXT_PUBLIC_COMMUNITY=off) non c'è niente da leggere: lo stato lo dice da subito
  const [state, setState] = useState<State>(supabaseEnabled ? { status: "loading" } : { status: "unavailable" });
  const [limit, setLimit] = useState(COMMENTS_PAGE);
  const scrolled = useRef(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const uid = session?.user.id ?? null;
      const staff = uid ? (await sb.rpc("is_staff")).data === true : false;
      if (alive) setViewer({ uid, staff });
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchComments(deckId, limit).then((next) => {
      if (alive && next) setState(next);
    });
    return () => {
      alive = false;
    };
  }, [deckId, limit]);

  // un link a un commento preciso (#comment-12) arriva prima dei commenti: si scorre lì appena ci sono
  useEffect(() => {
    if (state.status !== "ready" || scrolled.current) return;
    scrolled.current = true;
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    if (/^#comment-\d+$/.test(hash)) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [state]);

  // dopo una scrittura: si rilegge quello che c'è sullo schermo (la stessa quantità di commenti)
  const reload = useCallback(async () => {
    const next = await fetchComments(deckId, limit);
    if (next) setState(next);
  }, [deckId, limit]);
  const ctx: Ctx = { viewer, ownerId, deckId, locale, L, badges, reload };

  return (
    <section id={COMMENTS_ANCHOR} className="mt-10 scroll-mt-24" aria-labelledby={`${COMMENTS_ANCHOR}-title`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${COMMENTS_ANCHOR}-title`} className="t-section">
          {L.title}
        </h2>
        {state.status === "ready" && state.count > 0 ? (
          <span className="font-mono text-xs text-pale-muted">{state.count === 1 ? L.countOne : fillComment(L.countMany, { n: state.count })}</span>
        ) : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-pale-muted">
        {L.intro}{" "}
        <Link href={`/${locale}/privacy#deck-comments`} prefetch={false} className="underline underline-offset-2 hover:text-pale">
          {L.privacyLink}
        </Link>
      </p>

      {state.status === "unavailable" ? (
        <p className="card-night mt-4 p-5 text-sm text-pale-muted">{L.unavailable}</p>
      ) : (
        <>
          {viewer === undefined ? null : viewer.uid ? (
            <CommentForm
              ctx={ctx}
              parentId={null}
              label={L.label}
              placeholder={L.placeholder}
              onDone={(id) => {
                trackEvent("deck_comment", { kind: "comment" });
                void reload().then(() => document.getElementById(commentAnchor(id))?.scrollIntoView({ block: "center" }));
              }}
            />
          ) : (
            <p className="mt-4">
              <Link href={loginHref} className="btn btn-ghost text-xs">
                {L.loginToComment}
              </Link>
            </p>
          )}

          {state.status === "loading" ? (
            <p className="mt-6 text-sm text-pale-muted" aria-live="polite">
              {L.loading}
            </p>
          ) : state.threads.length === 0 ? (
            <p className="mt-6 text-sm text-pale-muted">{L.empty}</p>
          ) : (
            <ol className="mt-6 grid grid-cols-1 gap-4">
              {state.threads.map((t) => (
                <li key={t.id}>
                  <Thread thread={t} ctx={ctx} />
                </li>
              ))}
            </ol>
          )}
          {state.status === "ready" && state.more ? (
            <p className="mt-4">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setLimit((n) => n + COMMENTS_PAGE)}>
                {L.loadMore}
              </button>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

type Ctx = {
  viewer: Viewer;
  ownerId: string;
  deckId: string;
  locale: string;
  L: CommentLabels;
  badges: Record<string, string>;
  reload: () => Promise<void>;
};

function errorText(L: CommentLabels, code: CommentErrorCode | undefined): string | null {
  return code ? fillComment(L.errors[code] ?? L.errors.db, { max: COMMENT_MAX }) : null;
}

/** Un commento con le sue risposte e, a richiesta, il modulo per rispondere. */
function Thread({ thread, ctx }: { thread: CommentThread; ctx: Ctx }) {
  const [replying, setReplying] = useState(false);
  const canReply = Boolean(ctx.viewer?.uid) && thread.status === "visible";
  return (
    <div className="card-night p-4 sm:p-5">
      <Comment row={thread} ctx={ctx} onReply={canReply ? () => setReplying((v) => !v) : undefined} />
      {thread.replies.length || replying ? (
        <ol className="mt-4 grid grid-cols-1 gap-4 border-l-2 border-sky/60 pl-3 sm:pl-5">
          {thread.replies.map((r) => (
            <li key={r.id}>
              <Comment row={r} ctx={ctx} />
            </li>
          ))}
          {replying ? (
            <li>
              <CommentForm
                ctx={ctx}
                parentId={thread.id}
                label={ctx.L.replyLabel}
                placeholder={ctx.L.replyPlaceholder}
                autoFocus
                onCancel={() => setReplying(false)}
                onDone={(id) => {
                  setReplying(false);
                  trackEvent("deck_comment", { kind: "reply" });
                  void ctx.reload().then(() => document.getElementById(commentAnchor(id))?.scrollIntoView({ block: "center" }));
                }}
              />
            </li>
          ) : null}
        </ol>
      ) : null}
    </div>
  );
}

/** Una riga: chi, quando, il testo e i tasti che chi guarda può usare. */
function Comment({ row, ctx, onReply }: { row: CommentRow; ctx: Ctx; onReply?: () => void }) {
  const { L, viewer } = ctx;
  const [mode, setMode] = useState<"view" | "edit" | "report">("view");
  const [error, setError] = useState<CommentErrorCode | undefined>();
  const [reported, setReported] = useState(false);
  const [pending, start] = useTransition();
  const anchor = commentAnchor(row.id);

  if (row.status === "deleted") {
    return (
      <p id={anchor} className="scroll-mt-24 text-sm italic text-pale-muted">
        {L.deleted}
      </p>
    );
  }

  const name = commentAuthorName(row.author, L.someone);
  const badge = normalizeBadge(row.author?.badge);
  const own = Boolean(viewer?.uid) && viewer?.uid === row.user_id;
  const staff = Boolean(viewer?.staff);
  const visible = row.status === "visible";
  const run = (job: () => Promise<CommentResult>, then?: () => void) => {
    setError(undefined);
    start(async () => {
      const r = await job();
      if (r.error) return setError(r.error);
      then?.();
      await ctx.reload();
    });
  };

  return (
    <article id={anchor} className="scroll-mt-24">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Avatar profile={row.author} name={name} size={32} />
        {row.author?.username ? (
          <Link href={`/${ctx.locale}/u/${row.author.username}`} prefetch={false} className="font-bold text-pale hover:text-mint hover:underline">
            {name}
          </Link>
        ) : (
          <strong className="text-pale">{name}</strong>
        )}
        {isShowcaseBadge(badge) ? <span className={`stat-pill px-1.5 py-0 text-[10px] font-extrabold uppercase ${badgeStyle[badge] ?? badgeStyle.community}`}>{ctx.badges[badge] ?? badge}</span> : null}
        {row.user_id === ctx.ownerId ? <span className="stat-pill bg-mint px-1.5 py-0 text-[10px] font-extrabold uppercase text-ink">{L.deckOwner}</span> : null}
        <span className="font-mono text-xs text-pale-muted">
          <InboxTime iso={row.created_at} locale={ctx.locale} utcLabel={L.utcLabel} />
          {row.edited_at ? ` · ${L.edited}` : ""}
        </span>
      </header>

      {row.status === "hidden" ? <p className="alert-bad mt-2 text-xs">{L.hiddenNote}</p> : null}

      {mode === "edit" ? (
        <EditForm
          row={row}
          L={L}
          onCancel={() => setMode("view")}
          onSave={(text) => run(() => editDeckComment(row.id, text), () => setMode("view"))}
          pending={pending}
          error={error}
        />
      ) : (
        <p className={`mt-2 whitespace-pre-line break-words ${row.status === "hidden" ? "text-pale-muted" : "text-pale"}`}>{row.body}</p>
      )}

      {mode !== "edit" ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {onReply ? (
            <button type="button" className="link-mint font-bold" onClick={onReply}>
              {L.reply}
            </button>
          ) : null}
          {own && visible ? (
            <button type="button" className="text-pale-muted hover:text-pale" onClick={() => setMode("edit")}>
              {L.edit}
            </button>
          ) : null}
          {own || staff ? (
            <button
              type="button"
              className="text-pale-muted hover:text-pale"
              disabled={pending}
              onClick={() => {
                if (window.confirm(L.confirmDelete)) run(() => deleteDeckComment(row.id));
              }}
            >
              {L.delete}
            </button>
          ) : null}
          {staff ? (
            <button type="button" className="text-pale-muted hover:text-pale" disabled={pending} onClick={() => run(() => moderateDeckComment(row.id, visible))}>
              {visible ? L.hide : L.unhide}
            </button>
          ) : null}
          {viewer?.uid && !own && visible && !reported ? (
            <button type="button" className="text-pale-muted hover:text-pale" onClick={() => setMode((m) => (m === "report" ? "view" : "report"))} aria-expanded={mode === "report"}>
              {L.report}
            </button>
          ) : null}
          {reported ? <span className="text-good">{L.reportDone}</span> : null}
        </div>
      ) : null}

      {mode === "report" ? (
        <ReportForm
          L={L}
          pending={pending}
          onCancel={() => setMode("view")}
          onSend={(reason) => {
            setError(undefined);
            start(async () => {
              const r = await reportDeckComment(row.id, reason);
              if (r.error && r.error !== "duplicate") return setError(r.error);
              setReported(true);
              setMode("view");
              if (!r.error) trackEvent("deck_comment_report", {});
            });
          }}
        />
      ) : null}
      {mode !== "edit" ? <div role="alert">{error ? <p className="alert-bad mt-2 text-xs">{errorText(L, error)}</p> : null}</div> : null}
    </article>
  );
}

/** Contatore sotto un campo: suggerimento a sinistra, caratteri usati a destra. */
function Counter({ id, hint, value }: { id: string; hint: string; value: string }) {
  const n = textLength(value);
  return (
    <p id={id} className="mt-1 flex justify-between gap-3 text-xs text-chalk-muted">
      <span>{fillComment(hint, { max: COMMENT_MAX })}</span>
      <span className={`font-mono tabular-nums ${n > COMMENT_MAX ? "text-bad" : ""}`} aria-hidden="true">
        {n}/{COMMENT_MAX}
      </span>
    </p>
  );
}

/** Commento nuovo (parentId nullo) o risposta. */
function CommentForm({
  ctx,
  parentId,
  label,
  placeholder,
  autoFocus = false,
  onCancel,
  onDone,
}: {
  ctx: Ctx;
  parentId: number | null;
  label: string;
  placeholder: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  onDone: (id: number) => void;
}) {
  const { L } = ctx;
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<CommentErrorCode | undefined>();
  const [pending, start] = useTransition();
  const invalid = error === "empty" || error === "tooLong";
  return (
    <form
      noValidate
      className={parentId === null ? "card-night mt-4 p-4 sm:p-5" : ""}
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        start(async () => {
          const r = await addDeckComment(ctx.deckId, text, parentId);
          if (r.error || typeof r.id !== "number") return setError(r.error ?? "db");
          setText("");
          onDone(r.id);
        });
      }}
    >
      <label htmlFor={`${id}-body`} className="block text-sm font-bold text-chalk">
        {label}
      </label>
      <textarea
        id={`${id}-body`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={parentId === null ? 3 : 2}
        maxLength={COMMENT_MAX * 2}
        autoFocus={autoFocus}
        aria-describedby={`${id}-hint`}
        aria-invalid={invalid ? true : undefined}
        placeholder={placeholder}
        className={fieldCls}
      />
      <Counter id={`${id}-hint`} hint={L.hint} value={text} />
      <div role="alert">{error ? <p className="alert-bad mt-2 text-sm">{errorText(L, error)}</p> : null}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={pending || !text.trim()} aria-busy={pending} className="btn btn-primary cursor-pointer text-xs">
          {pending ? L.sending : L.send}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-ghost text-xs" onClick={onCancel}>
            {L.cancel}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function EditForm({
  row,
  L,
  pending,
  error,
  onCancel,
  onSave,
}: {
  row: CommentRow;
  L: CommentLabels;
  pending: boolean;
  error: CommentErrorCode | undefined;
  onCancel: () => void;
  onSave: (text: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(row.body);
  return (
    <form
      noValidate
      className="mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(text);
      }}
    >
      <label htmlFor={`${id}-body`} className="sr-only">
        {L.edit}
      </label>
      <textarea
        id={`${id}-body`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={COMMENT_MAX * 2}
        autoFocus
        aria-describedby={`${id}-hint`}
        aria-invalid={error === "empty" || error === "tooLong" ? true : undefined}
        className={fieldCls}
      />
      <Counter id={`${id}-hint`} hint={L.hint} value={text} />
      <div role="alert">{error ? <p className="alert-bad mt-2 text-sm">{errorText(L, error)}</p> : null}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={pending || !text.trim()} aria-busy={pending} className="btn btn-primary cursor-pointer text-xs">
          {pending ? L.saving : L.save}
        </button>
        <button type="button" className="btn btn-ghost text-xs" onClick={onCancel}>
          {L.cancel}
        </button>
      </div>
    </form>
  );
}

function ReportForm({ L, pending, onCancel, onSend }: { L: CommentLabels; pending: boolean; onCancel: () => void; onSend: (reason: string) => void }) {
  const id = useId();
  const [reason, setReason] = useState("");
  return (
    <form
      noValidate
      className="mt-2 rounded-lg border-2 border-crimson/60 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSend(reason);
      }}
    >
      <label htmlFor={`${id}-reason`} className="block text-xs font-bold text-chalk">
        {L.reportLabel}
      </label>
      <input
        id={`${id}-reason`}
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        className={fieldCls.replace(" resize-y", "")}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-ink cursor-pointer text-xs">
          {L.reportSend}
        </button>
        <button type="button" className="btn btn-ghost text-xs" onClick={onCancel}>
          {L.cancel}
        </button>
      </div>
    </form>
  );
}
