"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { supabaseEnabled } from "@/lib/supabase/env";
import { trackEvent } from "@/lib/analytics";
import { badgeStyle } from "@/lib/cardArt";
import { shownBadge } from "@/lib/community/badges";
import { COMMENTS_ANCHOR, COMMENTS_SHOWN, COMMENT_LIMITS, commentPermissions, threadComments, visibleCount, type CommentError, type CommentTarget, type CommentView } from "@/lib/community/deckComments";
import { addDeckComment, deleteDeckComment, editDeckComment, hideDeckComment, reportDeckComment } from "@/lib/community/deckCommentActions";
import { fillComment, type DeckCommentLabels } from "@/lib/deckCommentLabels";
import { Avatar } from "../AccountMenu";
import { InboxTime } from "../inbox/InboxTime";
import { CardMentionEdges } from "../CardMentionEdges";
import { MarkdownToolbar } from "../MarkdownToolbar";
import { RichText } from "../RichText";

type Viewer = { id: string; staff: boolean } | null;
type Load = "idle" | "loading" | "ready" | "unavailable" | "error";

/**
 * Sezione "Commenti" sotto un mazzo singolo o un mazzo torneo (22/10/2026, Pierluigi: "possiamo fare in modo che i mazzi
 * si possano commentare"). La scheda è ISR: i commenti li chiede il browser a /api/deck-comments quando la sezione si
 * avvicina (o subito, se l'indirizzo porta a #comments, come i link degli avvisi), con la sessione di chi guarda. Il
 * testo arriva già letto, con i nomi delle carte collegati, e lo disegna `RichText`; chi scrive usa la barra di
 * formattazione (senza titoletti). Le azioni sono Server Action (deckCommentActions.ts); il database decide chi può.
 * Senza Supabase non disegna niente; prima della migrazione dice che i commenti non sono ancora attivi.
 */
export function DeckComments({
  target,
  ownerId,
  locale,
  loginHref,
  placement,
  labels: L,
  badgeLabels,
}: {
  target: CommentTarget;
  ownerId: string;
  locale: Locale;
  loginHref: string;
  placement: "deck_page" | "deck_set_page";
  labels: DeckCommentLabels;
  badgeLabels: Record<string, string>;
}) {
  const [load, setLoad] = useState<Load>("idle");
  const [comments, setComments] = useState<CommentView[]>([]);
  const [viewer, setViewer] = useState<Viewer>(null);
  const [shown, setShown] = useState(COMMENTS_SHOWN);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const jumpRef = useRef(false);

  // "Carico i commenti…" lo mostra già lo stato iniziale; dopo un errore lo rimette il tasto "Riprova". Lo stato cambia
  // solo nel callback della richiesta, mai dentro l'effetto che la fa partire.
  const fetchComments = useCallback(() => {
    void readComments(target, locale).then((r) => {
      if (r === "error" || r === "unavailable") {
        setLoad(r);
        return;
      }
      setViewer(r.viewer);
      setComments(r.comments);
      setLoad("ready");
    });
  }, [target, locale]);

  // si carica quando la sezione è a meno di uno schermo, o subito se l'indirizzo porta qui (link degli avvisi)
  useEffect(() => {
    if (!supabaseEnabled) return;
    const hash = window.location.hash;
    if (hash === `#${COMMENTS_ANCHOR}` || hash.startsWith("#comment-")) {
      jumpRef.current = true;
      fetchComments();
      return;
    }
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      fetchComments();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          fetchComments();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchComments]);

  // arrivati da un avviso: dopo il caricamento la pagina scende ai commenti (prima la sezione era più corta)
  useEffect(() => {
    if (load !== "ready" || !jumpRef.current) return;
    jumpRef.current = false;
    const id = window.location.hash.slice(1);
    (document.getElementById(id) ?? sectionRef.current)?.scrollIntoView({ block: "start" });
  }, [load]);

  if (!supabaseEnabled) return null;

  const threads = threadComments(comments);
  const total = visibleCount(comments);
  const upsert = (c: CommentView) => setComments((list) => (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]));
  const removed = (id: number, how: "emptied" | "deleted" | "gone") =>
    setComments((list) => {
      if (how === "emptied") return list.map((x) => (x.id === id ? { ...x, status: "deleted" as const, author: null, blocks: [], body: undefined } : x));
      const gone = list.find((x) => x.id === id);
      let next = list.filter((x) => x.id !== id);
      // il posto eliminato a cui rispondeva, rimasto senza risposte, se ne va con lui (come nel database)
      if (gone?.parent != null && !next.some((x) => x.parent === gone.parent)) next = next.filter((x) => !(x.id === gone.parent && x.status === "deleted"));
      return next;
    });

  return (
    <section id={COMMENTS_ANCHOR} ref={sectionRef} className="mt-10 scroll-mt-24" aria-labelledby={`${COMMENTS_ANCHOR}-title`}>
      <h2 id={`${COMMENTS_ANCHOR}-title`} className="t-section">
        {L.title}
        {load === "ready" && total > 0 ? <span className="ml-2 font-mono text-sm font-normal text-pale-muted">{total === 1 ? L.countOne : fillComment(L.countMany, { n: total })}</span> : null}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-pale-muted">{L.intro}</p>

      {load === "idle" || load === "loading" ? (
        <p className="mt-4 text-sm text-pale-muted" aria-live="polite">
          {L.loading}
        </p>
      ) : load === "unavailable" ? (
        <p className="card-night mt-4 p-4 text-sm text-pale-muted">{L.unavailable}</p>
      ) : load === "error" ? (
        <p className="card-night mt-4 flex flex-wrap items-center gap-3 p-4 text-sm text-pale-muted">
          {L.loadError}
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => {
              setLoad("loading");
              fetchComments();
            }}
          >
            {L.retry}
          </button>
        </p>
      ) : (
        <>
          {viewer ? (
            <Composer
              id={`comment-new-${target.id}`}
              locale={locale}
              labels={L}
              placeholder={L.placeholder}
              submitLabel={L.send}
              onSubmit={async (text) => {
                const r = await addDeckComment(target, null, text, locale);
                if (!r.ok) return r.error;
                if (r.comment) upsert(r.comment);
                trackEvent("deck_comment", { placement, kind: "comment" });
                return null;
              }}
            />
          ) : (
            <p className="mt-4">
              <Link href={loginHref} className="btn btn-ink text-xs" prefetch={false}>
                {L.loginToComment}
              </Link>
            </p>
          )}

          {threads.length === 0 ? (
            <p className="mt-4 text-sm text-pale-muted">{L.empty}</p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-4">
              {threads.slice(0, shown).map(({ comment, replies }) => (
                <li key={comment.id}>
                  <CommentCard
                    c={comment}
                    viewer={viewer}
                    ownerId={ownerId}
                    locale={locale}
                    labels={L}
                    badgeLabels={badgeLabels}
                    onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    onChange={upsert}
                    onRemoved={removed}
                  />
                  {replies.length || replyTo === comment.id ? (
                    <ul className="ml-4 mt-2 grid grid-cols-1 gap-2 border-l-2 border-sky/40 pl-3 sm:ml-8">
                      {replies.map((r) => (
                        <li key={r.id}>
                          <CommentCard c={r} viewer={viewer} ownerId={ownerId} locale={locale} labels={L} badgeLabels={badgeLabels} onChange={upsert} onRemoved={removed} />
                        </li>
                      ))}
                      {replyTo === comment.id && viewer ? (
                        <li>
                          <Composer
                            id={`comment-reply-${comment.id}`}
                            locale={locale}
                            labels={L}
                            placeholder={L.replyPlaceholder}
                            submitLabel={L.reply}
                            autoFocus
                            onCancel={() => setReplyTo(null)}
                            onSubmit={async (text) => {
                              const r = await addDeckComment(target, comment.id, text, locale);
                              if (!r.ok) return r.error;
                              if (r.comment) upsert(r.comment);
                              setReplyTo(null);
                              trackEvent("deck_comment", { placement, kind: "reply" });
                              return null;
                            }}
                          />
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {threads.length > shown ? (
            <p className="mt-4">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setShown((n) => n + COMMENTS_SHOWN)}>
                {fillComment(L.showMore, { n: threads.length - shown })}
              </button>
            </p>
          ) : null}
          <CardMentionEdges />
        </>
      )}
    </section>
  );
}

/** I commenti di un mazzo dalla rotta /api/deck-comments: "unavailable" prima della migrazione, "error" con un errore. */
async function readComments(target: CommentTarget, locale: Locale): Promise<{ viewer: Viewer; comments: CommentView[] } | "unavailable" | "error"> {
  try {
    const q = new URLSearchParams({ [target.kind]: target.id, locale });
    const res = await fetch(`/api/deck-comments?${q}`, { cache: "no-store" });
    if (!res.ok) return "error";
    const data = (await res.json()) as { available?: boolean; viewer?: Viewer; comments?: CommentView[] };
    if (!data.available) return "unavailable";
    return { viewer: data.viewer ?? null, comments: Array.isArray(data.comments) ? data.comments : [] };
  } catch {
    return "error";
  }
}

/** Casella per scrivere un commento o una risposta, con la barra di formattazione e il contatore. */
function Composer({
  id,
  locale,
  labels: L,
  placeholder,
  submitLabel,
  initial = "",
  autoFocus,
  onSubmit,
  onCancel,
}: {
  id: string;
  locale: Locale;
  labels: DeckCommentLabels;
  placeholder: string;
  submitLabel: string;
  initial?: string;
  autoFocus?: boolean;
  /** null = riuscito (la casella si svuota), altrimenti il codice d'errore */
  onSubmit: (text: string) => Promise<CommentError | null>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState<CommentError | null>(null);
  const [pending, start] = useTransition();
  const length = Array.from(text.trim()).length;
  const lines = text.trim() ? text.trim().split("\n").length : 0;
  const tooLong = length > COMMENT_LIMITS.max || lines > COMMENT_LIMITS.maxLines;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || tooLong || pending) return;
    setError(null);
    start(async () => {
      const err = await onSubmit(text);
      if (err) setError(err);
      else if (!initial) setText("");
    });
  };
  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <MarkdownToolbar target={id} locale={locale} headings={false} />
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={initial ? 4 : 3}
        maxLength={COMMENT_LIMITS.max + 200}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale placeholder:text-pale-muted/80 focus:border-mint"
      />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary text-xs" disabled={pending || !text.trim() || tooLong}>
          {pending ? (initial ? L.saving : L.sending) : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-ghost text-xs" onClick={onCancel}>
            {L.cancel}
          </button>
        ) : null}
        <span className={`ml-auto font-mono text-xs ${tooLong ? "text-bad" : "text-pale-muted"}`}>{fillComment(L.counter, { n: length, max: COMMENT_LIMITS.max })}</span>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-bad" role="alert">
          {L.errors[error] ?? L.errors.db}
        </p>
      ) : null}
    </form>
  );
}

/** Un commento: firma, testo, comandi per chi può (rispondi, modifica, elimina, nascondi, segnala). */
function CommentCard({
  c,
  viewer,
  ownerId,
  locale,
  labels: L,
  badgeLabels,
  onReply,
  onChange,
  onRemoved,
}: {
  c: CommentView;
  viewer: Viewer;
  ownerId: string;
  locale: Locale;
  labels: DeckCommentLabels;
  badgeLabels: Record<string, string>;
  onReply?: () => void;
  onChange: (c: CommentView) => void;
  onRemoved: (id: number, how: "emptied" | "deleted" | "gone") => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "report">("view");
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<CommentError | null>(null);
  const [pending, start] = useTransition();
  const can = commentPermissions({ status: c.status, parent: c.parent, authorId: c.author?.id ?? null }, viewer, ownerId);

  if (c.status === "deleted") {
    return (
      <article id={`comment-${c.id}`} className="scroll-mt-24 rounded-lg border-2 border-dashed border-sky/30 px-3 py-2 text-sm italic text-pale-muted">
        {L.deleted}
      </article>
    );
  }

  const a = c.author;
  const name = (a?.display_name || a?.username || "player").trim();
  const badge = shownBadge(a?.badge);
  const run = (job: () => Promise<{ ok: true } | { ok: false; error: CommentError }>) => {
    setError(null);
    start(async () => {
      const r = await job();
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <article id={`comment-${c.id}`} className={`scroll-mt-24 rounded-lg border-2 p-3 ${c.status === "hidden" ? "border-dashed border-crimson/60 bg-night-2/40" : "border-sky/50 bg-night-2/70"}`}>
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Avatar profile={a} name={name} size={24} />
        {a?.username ? (
          <Link href={`/${locale}/u/${a.username}`} className="font-bold text-pale hover:text-mint hover:underline" prefetch={false}>
            {name}
          </Link>
        ) : (
          <strong className="text-pale">{name}</strong>
        )}
        {badge ? <span className={`stat-pill text-[10px] font-semibold uppercase ${badgeStyle[badge] ?? ""}`}>{badgeLabels[badge] ?? badge}</span> : null}
        {a?.id === ownerId ? <span className="stat-pill border border-mint text-[10px] font-semibold uppercase text-mint">{L.publisherTag}</span> : null}
        <span className="font-mono text-xs text-pale-muted">
          <InboxTime iso={c.created_at} locale={locale} utcLabel={L.utcLabel} />
          {c.edited_at ? ` · ${L.edited}` : ""}
        </span>
      </header>
      {c.status === "hidden" ? <p className="mt-1 text-xs font-semibold text-crimson">{L.hiddenNote}</p> : null}

      {mode === "edit" ? (
        <Composer
          id={`comment-edit-${c.id}`}
          locale={locale}
          labels={L}
          placeholder={L.placeholder}
          submitLabel={L.save}
          initial={c.body ?? ""}
          autoFocus
          onCancel={() => setMode("view")}
          onSubmit={async (text) => {
            const r = await editDeckComment(c.id, text, locale);
            if (!r.ok) return r.error;
            if (r.comment) onChange(r.comment);
            setMode("view");
            return null;
          }}
        />
      ) : (
        <RichText blocks={c.blocks} className="mt-2 text-sm text-pale" />
      )}

      {mode === "report" ? (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await reportDeckComment(c.id, reason);
              if (r.ok) {
                setReported(true);
                setMode("view");
              }
              return r;
            });
          }}
        >
          <label htmlFor={`comment-report-${c.id}`} className="block text-xs text-pale-muted">
            {L.reportReason}
          </label>
          <textarea
            id={`comment-report-${c.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={COMMENT_LIMITS.reasonMax}
            className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale focus:border-mint"
          />
          <div className="mt-1 flex flex-wrap gap-2">
            <button type="submit" className="btn btn-ink text-xs" disabled={pending}>
              {L.reportSend}
            </button>
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setMode("view")}>
              {L.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {mode === "view" ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {can.reply && onReply ? <Action label={L.reply} onClick={onReply} /> : null}
          {can.edit ? <Action label={L.edit} onClick={() => setMode("edit")} /> : null}
          {can.remove ? (
            <Action
              label={L.delete}
              disabled={pending}
              onClick={() => {
                if (!window.confirm(L.confirmDelete)) return;
                run(async () => {
                  const r = await deleteDeckComment(c.id);
                  if (r.ok) onRemoved(c.id, r.removed ?? "deleted");
                  return r;
                });
              }}
            />
          ) : null}
          {can.hide || can.unhide ? (
            <Action
              label={can.hide ? L.hide : L.unhide}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const r = await hideDeckComment(c.id, can.hide, locale);
                  if (r.ok && r.comment) onChange(r.comment);
                  return r;
                })
              }
            />
          ) : null}
          {can.report && !reported ? <Action label={L.report} onClick={() => setMode("report")} /> : null}
          {reported ? <span className="text-good">{L.reported}</span> : null}
        </div>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-bad" role="alert">
          {L.errors[error] ?? L.errors.db}
        </p>
      ) : null}
    </article>
  );
}

function Action({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="font-semibold text-pale-muted underline-offset-2 hover:text-mint hover:underline disabled:opacity-50">
      {label}
    </button>
  );
}
