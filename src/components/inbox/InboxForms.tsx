"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replyToConversation, staffStartConversation, startConversation, type InboxActionState } from "@/lib/community/inboxActions";
import { CONVERSATIONS_PER_DAY, MESSAGES_PER_HOUR, MESSAGE_MAX, SUBJECT_MAX, fillInbox, textLength, type InboxErrorCode } from "@/lib/community/messages";
import { trackEvent } from "@/lib/analytics";
import type { InboxLabels } from "@/lib/inboxLabels";
import { announceInboxChange } from "./InboxIndicator";

/**
 * Moduli della casella messaggi (26/09/2026, pacchetto INBOX): risposta in una conversazione e conversazione nuova
 * ("Scrivi allo staff" per l'utente, "Nuovo messaggio a un utente" per lo staff). Testo semplice, con il contatore.
 *
 * Invio a mano (onSubmit + transizione) invece di <form action>, come PublishDeckForm: React 19 svuota i campi quando
 * l'azione finisce anche se torna un errore, e chi ha scritto perderebbe il messaggio. Qui il testo si svuota solo
 * dopo un invio riuscito. Le etichette arrivano dal server, già nella lingua della pagina.
 */

/** Campo di testo: cornice gesso e segnaposto gesso pieno, come il riquadro dei feedback (contrasti WCAG verificati lì). */
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-chalk-muted bg-felt-deep px-3 py-2.5 text-base text-chalk placeholder:text-chalk-muted focus:border-mint aria-[invalid=true]:border-bad";

type ErrorLabels = InboxLabels["errors"];

function errorText(errors: ErrorLabels, code: InboxErrorCode | undefined): string | null {
  if (!code) return null;
  return fillInbox(errors[code] ?? errors.db, { max: code === "subjectTooLong" ? SUBJECT_MAX : MESSAGE_MAX });
}

/** Contatore sotto il campo del messaggio: suggerimento a sinistra, caratteri usati a destra. */
function Counter({ id, hint, value }: { id: string; hint: string; value: string }) {
  return (
    <p id={id} className="mt-1 flex justify-between gap-3 text-xs text-chalk-muted">
      <span>{fillInbox(hint, { max: MESSAGE_MAX })}</span>
      <span className="font-mono tabular-nums" aria-hidden="true">
        {textLength(value)}/{MESSAGE_MAX}
      </span>
    </p>
  );
}

type ReplyProps = {
  id: string;
  locale: string;
  view: "user" | "staff";
  labels: InboxLabels["thread"];
  hint: string;
  errors: ErrorLabels;
};

/** Risposta in una conversazione (utente o staff: lo decide il database). La pagina si ridisegna con il messaggio nuovo. */
export function ReplyForm({ id, locale, view, labels, hint, errors }: ReplyProps) {
  const [text, setText] = useState("");
  const [sentNote, setSentNote] = useState(false);
  const [, startSubmit] = useTransition();
  const fieldId = useId();
  const hintId = useId();
  const [state, action, pending] = useActionState<InboxActionState, FormData>(async (prev, fd) => {
    const res = await replyToConversation(prev, fd);
    if (res.sent) {
      setText("");
      setSentNote(true);
      trackEvent("message_sent", { placement: view === "staff" ? "staff_area" : "account", kind: "reply" });
      announceInboxChange();
    }
    return res;
  }, {});
  const error = errorText(errors, state.error);
  const invalid = state.error === "empty" || state.error === "tooLong";

  return (
    <form
      noValidate
      className="card-night mt-6 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startSubmit(() => action(fd));
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor={fieldId} className="block text-base font-bold text-chalk">
        {labels.replyLabel}
      </label>
      <textarea
        id={fieldId}
        name="body"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSentNote(false);
        }}
        rows={5}
        maxLength={MESSAGE_MAX}
        required
        aria-describedby={hintId}
        aria-invalid={invalid ? true : undefined}
        placeholder={labels.replyPlaceholder}
        className={`${fieldCls} resize-y`}
      />
      <Counter id={hintId} hint={hint} value={text} />
      {/* esito ed errori: contenitori sempre presenti, così i lettori di schermo annunciano il testo quando compare */}
      <div role="alert">{error ? <p className="alert-bad mt-3 text-sm">{error}</p> : null}</div>
      <div aria-live="polite">{sentNote && !pending && !error ? <p className="alert-good mt-3 text-sm">{labels.sent}</p> : null}</div>
      <button type="submit" disabled={pending || !text.trim()} aria-busy={pending} className="btn btn-primary mt-4 cursor-pointer">
        {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}

type NewProps = {
  /** "user": Scrivi allo staff; "staff": Nuovo messaggio a un utente (con il nome utente) */
  mode: "user" | "staff";
  locale: string;
  /** nome utente già scritto (link "Scrivi a questo utente" della pagina /u/<nome>) */
  defaultTo?: string;
  labels: InboxLabels["form"];
  sending: string;
  errors: ErrorLabels;
};

/** Conversazione nuova. Dopo l'invio porta alla conversazione appena creata. */
export function NewConversationForm({ mode, locale, defaultTo = "", labels, sending, errors }: NewProps) {
  const router = useRouter();
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [, startSubmit] = useTransition();
  const baseId = useId();
  const [state, action, pending] = useActionState<InboxActionState, FormData>(async (prev, fd) => {
    const res = await (mode === "staff" ? staffStartConversation : startConversation)(prev, fd);
    if (res.href) {
      trackEvent("message_sent", { placement: mode === "staff" ? "staff_area" : "account", kind: "new" });
      announceInboxChange();
      router.push(res.href);
    }
    return res;
  }, {});
  const error = errorText(errors, state.error);
  const bad = (codes: InboxErrorCode[]) => (state.error && codes.includes(state.error) ? true : undefined);

  return (
    <form
      noValidate
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startSubmit(() => action(fd));
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {mode === "staff" ? (
        <>
          <label htmlFor={`${baseId}-to`} className="block text-sm font-bold text-pale">
            {labels.to}
          </label>
          <input
            id={`${baseId}-to`}
            name="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            maxLength={61}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-describedby={`${baseId}-to-hint`}
            aria-invalid={bad(["badUsername", "userNotFound", "self"])}
            placeholder={labels.toPlaceholder}
            className={fieldCls}
          />
          <p id={`${baseId}-to-hint`} className="mt-1 text-xs text-chalk-muted">
            {labels.toHint}
          </p>
        </>
      ) : null}
      <label htmlFor={`${baseId}-subject`} className={`${mode === "staff" ? "mt-4 " : ""}block text-sm font-bold text-pale`}>
        {labels.subject}
      </label>
      <input
        id={`${baseId}-subject`}
        name="subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={SUBJECT_MAX}
        required
        aria-invalid={bad(["emptySubject", "subjectTooLong"])}
        placeholder={labels.subjectPlaceholder}
        className={fieldCls}
      />
      <label htmlFor={`${baseId}-body`} className="mt-4 block text-sm font-bold text-pale">
        {labels.message}
      </label>
      <textarea
        id={`${baseId}-body`}
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        maxLength={MESSAGE_MAX}
        required
        aria-describedby={`${baseId}-hint`}
        aria-invalid={bad(["empty", "tooLong"])}
        placeholder={labels.messagePlaceholder}
        className={`${fieldCls} resize-y`}
      />
      <Counter id={`${baseId}-hint`} hint={labels.hint} value={body} />
      {mode === "user" ? <p className="mt-2 text-xs text-chalk-muted">{fillInbox(labels.limits, { hour: MESSAGES_PER_HOUR, day: CONVERSATIONS_PER_DAY })}</p> : null}
      <div role="alert">{error ? <p className="alert-bad mt-3 text-sm">{error}</p> : null}</div>
      <button type="submit" disabled={pending || !body.trim() || !subject.trim() || (mode === "staff" && !to.trim())} aria-busy={pending} className="btn btn-primary mt-4 cursor-pointer">
        {pending ? sending : mode === "staff" ? labels.sendToUser : labels.send}
      </button>
    </form>
  );
}
