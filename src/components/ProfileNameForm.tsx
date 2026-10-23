"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveNames, type NameActionState } from "@/lib/community/profileNameActions";
import {
  checkDisplayName,
  checkUsername,
  cleanDisplayName,
  cleanUsername,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  USERNAME_CHANGE_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
} from "@/lib/community/profileNames";
import { fillName, type ProfileNameLabels } from "@/lib/profileNameLabels";
import { useMounted } from "@/lib/useMounted";

/**
 * Modulo "Nome e nome utente" di /account/profile (23/10/2026). I controlli veri li fa il server (`saveNames`, poi la
 * funzione `profile_set_names` del database); qui c'è l'aiuto: l'indirizzo della pagina con il nome scritto, i messaggi
 * campo per campo e, prima di cambiare il nome utente, la conferma con i giorni d'attesa. I campi sono controllati
 * (React 19 svuota i moduli dopo un'azione riuscita). Dopo un salvataggio la pagina si rilegge (header, link alla
 * pagina pubblica, link breve).
 */

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";

const limits = { min: DISPLAY_NAME_MIN, max: DISPLAY_NAME_MAX };
const userLimits = { min: USERNAME_MIN, max: USERNAME_MAX, days: USERNAME_CHANGE_DAYS };

export function ProfileNameForm({
  initial,
  labels,
  locale,
  siteHost,
  staff,
  locked,
  nextChange,
}: {
  initial: { displayName: string; username: string };
  labels: ProfileNameLabels;
  /** lingua dell'HTML (per le date) */
  locale: string;
  /** "originsmeta.com": l'indirizzo mostrato sotto il nome utente */
  siteHost: string;
  staff: boolean;
  /** il nome utente è scritto nel codice del sito: solo lo staff lo cambia */
  locked: boolean;
  /** da quando si potrà cambiare di nuovo il nome utente (ISO), se c'è un'attesa */
  nextChange: string | null;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [saved, setSaved] = useState(initial);
  const [wait, setWait] = useState<string | null>(nextChange);
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState<NameActionState, FormData>(async (prev, fd) => {
    const res = await saveNames(prev, fd);
    if (res.nextChange !== undefined) setWait(res.nextChange);
    if (res.ok && res.value) {
      setDisplayName(res.value.displayName);
      setUsername(res.value.username);
      setSaved(res.value);
      setDirty(false);
      router.refresh();
    }
    return res;
  }, {});

  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "long", ...(mounted ? {} : { timeZone: "UTC" }) }).format(new Date(iso));
  const cleanUser = cleanUsername(username);
  const userChanged = cleanUser !== saved.username;
  const displayChanged = cleanDisplayName(displayName) !== saved.displayName;
  // aiuto mentre si scrive: solo la forma (riservati, presi e attese li dice il server)
  const liveUser = userChanged && cleanUser ? checkUsername(cleanUser, staff) : "ok";
  const liveDisplay = displayChanged ? checkDisplayName(cleanDisplayName(displayName), staff) : "ok";
  // `wait` c'è solo se l'attesa non è finita: lo calcolano il server (nextUsernameChange) e il database
  const userWaiting = !staff && wait !== null;
  const userDisabled = locked || userWaiting;

  const displayError = state.display ?? (dirty && liveDisplay !== "ok" ? liveDisplay : undefined);
  const usernameError = state.username ?? (dirty && liveUser !== "ok" ? liveUser : undefined);
  const displayMsg = displayError ? fillName(labels.errors.display[displayError], limits) : null;
  const usernameMsg = usernameError ? fillName(labels.errors.username[usernameError], { ...userLimits, date: wait ? date(wait) : "" }) : null;
  const topError =
    state.error === "locked"
      ? labels.locked
      : state.error === "missing"
        ? labels.missing
        : state.error
          ? labels.errors[state.error]
          : null;
  const pageUrl = `${siteHost}/u/${cleanUser || "…"}`;
  // "La tua pagina: {url}": solo l'indirizzo in carattere a spaziatura fissa
  const [previewBefore, previewAfter = ""] = labels.preview.split("{url}");

  return (
    <form
      action={formAction}
      className="card-night mt-4 space-y-6 p-5 sm:p-6"
      onSubmit={(e) => {
        if (userChanged && !userDisabled && !window.confirm(fillName(labels.confirmUsername, userLimits))) e.preventDefault();
      }}
    >
      <label className="block">
        <span className="kicker text-chalk-muted">{labels.displayLabel}</span>
        <input
          name="display_name"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setDirty(true);
          }}
          maxLength={DISPLAY_NAME_MAX * 2}
          autoComplete="nickname"
          aria-describedby="profile-name-display-hint"
          aria-invalid={displayMsg ? true : undefined}
          className={`${inputCls} ${displayMsg ? "!border-bad" : ""}`}
        />
        <span id="profile-name-display-hint" className={`mt-1 block text-xs ${displayMsg ? "text-bad" : "text-pale-muted"}`}>
          {displayMsg ?? fillName(labels.displayHint, limits)}
        </span>
      </label>

      <label className="block">
        <span className="kicker text-chalk-muted">{labels.usernameLabel}</span>
        <span className="mt-1 flex items-stretch">
          <span aria-hidden="true" className="flex items-center rounded-l-lg border border-r-0 border-sky bg-night-2 px-3 font-mono text-pale-muted">
            @
          </span>
          <input
            name="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setDirty(true);
            }}
            readOnly={userDisabled}
            maxLength={USERNAME_MAX * 2}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby="profile-name-username-hint"
            aria-invalid={usernameMsg ? true : undefined}
            className={`${inputCls} !mt-0 min-w-0 rounded-l-none font-mono ${usernameMsg ? "!border-bad" : ""} ${userDisabled ? "opacity-70" : ""}`}
          />
        </span>
        <span id="profile-name-username-hint" className="mt-1 block space-y-0.5 text-xs">
          {usernameMsg ? <span className="block text-bad">{usernameMsg}</span> : null}
          {locked ? (
            <span className="block text-pale">{labels.locked}</span>
          ) : userWaiting && wait ? (
            <span className="block text-pale">{fillName(labels.nextChange, { date: date(wait) })}</span>
          ) : usernameMsg ? null : (
            <span className="block text-pale-muted">{fillName(labels.usernameHint, userLimits)}</span>
          )}
          <span className="block break-all text-pale-muted">
            {previewBefore}
            <span className="font-mono text-pale">{pageUrl}</span>
            {previewAfter}
          </span>
          {!locked && !userWaiting ? <span className="block text-pale-muted">{labels.redirectNote}</span> : null}
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || (!userChanged && !displayChanged)} aria-busy={pending} className="btn btn-primary text-xs">
          {pending ? labels.saving : labels.save}
        </button>
        <p aria-live="polite" className="text-sm">
          {pending ? null : topError ? (
            <span className="text-bad">{topError}</span>
          ) : state.ok && !dirty ? (
            <span className="text-good">{state.usernameChanged ? fillName(labels.savedUsername, { url: `${siteHost}/u/${saved.username}` }) : labels.saved}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
