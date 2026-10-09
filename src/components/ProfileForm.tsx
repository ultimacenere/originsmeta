"use client";

import { useActionState, useState } from "react";
import { saveProfile, type ProfileActionState } from "@/lib/community/profileActions";
import { BIO_MAX, BIO_MAX_BREAKS, CONTENT_LANGS, bioLineCount, detectLinkKind, LINK_KINDS, LINK_KIND_NAMES, MAX_LINKS, type ContentLang, type LinkKind, type ProfileFormErrors, type ProfileLink } from "@/lib/community/profileLinks";
import { fillCreator, type ProfileFormLabels } from "@/lib/creatorLabels";

/**
 * Modulo "Il tuo profilo pubblico" di /account (pacchetto CREATOR, 26/09/2026): bio, lingue dei contenuti e fino a
 * otto canali, ognuno con la sua piattaforma. I controlli veri li fa il server (`saveProfile`, poi i vincoli del
 * database); qui c'è solo l'aiuto: righe da aggiungere, togliere e riordinare, i messaggi riga per riga e, dopo il
 * salvataggio, gli indirizzi nella forma in cui sono stati salvati ("coachcrono" diventa l'indirizzo del canale).
 * Tutti i campi sono controllati: React 19 svuota i moduli dopo un'azione riuscita, e qui il modulo deve restare pieno.
 */

/**
 * `kind` vuoto = piattaforma non ancora scelta. Fino all'08/10/2026 la riga nuova partiva su Twitch (e la seconda su
 * YouTube): un nome scritto lì senza cambiare la tendina diventava un canale Twitch ("mi mette Twitch", Nicolò).
 * Ora si parte senza piattaforma e un indirizzo incollato la sceglie da solo (`detectLinkKind`, la stessa regola del server).
 */
type Row = { key: number; kind: LinkKind | ""; url: string };

const PLACEHOLDER: Record<LinkKind, string> = {
  twitch: "https://www.twitch.tv/…",
  youtube: "https://www.youtube.com/@…",
  x: "https://x.com/…",
  tiktok: "https://www.tiktok.com/@…",
  instagram: "https://www.instagram.com/…",
  kick: "https://kick.com/…",
  bluesky: "https://bsky.app/profile/…",
  discord: "https://discord.gg/…",
  website: "https://…",
};

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-pale-muted/80 focus:border-mint";

/** I limiti della bio nei testi del modulo (600 caratteri e 13 righe dal 27/09/2026): i numeri vengono dal codice, non dalle etichette. */
const bioLimits = { max: BIO_MAX, lines: BIO_MAX_BREAKS + 1 };

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, kind: "", url: "" });
const toRows = (links: readonly ProfileLink[]): Row[] => (links.length ? links.map((l) => ({ key: nextKey++, kind: l.kind, url: l.url })) : [emptyRow()]);

export function ProfileForm({
  initial,
  labels,
  websiteLabel,
  langNames,
  publicHref,
}: {
  initial: { bio: string | null; links: ProfileLink[]; contentLangs: ContentLang[] };
  labels: ProfileFormLabels;
  websiteLabel: string;
  langNames: Record<ContentLang, string>;
  /** la pagina pubblica dell'utente, se ha un nome utente */
  publicHref?: string;
}) {
  const [bio, setBio] = useState(initial.bio ?? "");
  const [langs, setLangs] = useState<ContentLang[]>(initial.contentLangs);
  const [rows, setRows] = useState<Row[]>(() => toRows(initial.links));
  const [errors, setErrors] = useState<ProfileFormErrors | null>(null);
  /* modifiche non ancora salvate: "Profilo salvato." sparisce appena si cambia qualcosa */
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(async (prev, fd) => {
    const res = await saveProfile(prev, fd);
    setErrors(res.fields ?? null);
    if (res.ok && res.value) {
      // quello che è stato salvato davvero, nella forma canonica
      setBio(res.value.bio ?? "");
      setLangs(res.value.content_langs);
      setRows(toRows(res.value.links));
      setDirty(false);
    }
    return res;
  }, {});

  const kindName = (k: LinkKind | "") => (k === "" ? labels.kind : k === "website" ? websiteLabel : LINK_KIND_NAMES[k]);
  const edit = (next: Row[]) => {
    setRows(next);
    setErrors(null);
    setDirty(true);
  };
  const rowError = (i: number) => errors?.links?.find((e) => e.index === i);
  const errorText = (err: NonNullable<ReturnType<typeof rowError>>, kind: LinkKind | "") => {
    const e = labels.errors;
    switch (err.error) {
      case "http":
        return e.http;
      case "shortener":
        return e.shortener;
      case "redirect":
        return e.redirect;
      case "long":
        return e.long;
      case "kind":
        return e.kind;
      case "platform":
        return fillCreator(e.platform, { platform: err.platform ? LINK_KIND_NAMES[err.platform] : kindName(kind) });
      default:
        return kind === "website" ? e.invalidWebsite : fillCreator(e.invalid, { platform: kindName(kind) });
    }
  };
  const topError = state.error && state.error !== "invalid" ? labels.errors[state.error] : errors?.tooMany ? labels.errors.tooMany : null;

  return (
    <form action={formAction} className="card-night mt-4 space-y-6 p-5 sm:p-6">
      <label className="block">
        <span className="kicker text-chalk-muted">{labels.bio}</span>
        <textarea
          name="bio"
          rows={5}
          maxLength={BIO_MAX * 2}
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setDirty(true);
            setErrors((x) => (x?.bio ? { ...x, bio: undefined } : x));
          }}
          placeholder={labels.bioPlaceholder}
          aria-describedby="profile-bio-hint"
          aria-invalid={errors?.bio ? true : undefined}
          className={inputCls}
        />
        <span id="profile-bio-hint" className={`mt-1 block text-xs ${errors?.bio || [...bio].length > BIO_MAX ? "text-bad" : "text-pale-muted"}`}>
          {fillCreator(errors?.bio ? labels.errors.bioLong : labels.bioHint, bioLimits)} ({[...bio].length}/{BIO_MAX})
          {/* oltre le 13 righe il salvataggio unisce quelle in più all'ultima (cleanBio): si dice prima, non dopo */}
          {bioLineCount(bio) > bioLimits.lines ? <span className="mt-0.5 block text-pale">{fillCreator(labels.bioLinesOver, bioLimits)}</span> : null}
        </span>
      </label>

      <fieldset>
        <legend className="kicker text-chalk-muted">{labels.langs}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTENT_LANGS.map((l) => (
            <label key={l} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky bg-night px-2.5 py-1.5 text-sm text-pale">
              <input
                type="checkbox"
                name="lang"
                value={l}
                checked={langs.includes(l)}
                onChange={(e) => {
                  const on = e.target.checked;
                  setLangs((cur) => (on ? CONTENT_LANGS.filter((x) => x === l || cur.includes(x)) : cur.filter((x) => x !== l)));
                  setDirty(true);
                }}
                className="accent-mint"
              />
              {langNames[l]}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-pale-muted">{labels.langsHint}</p>
      </fieldset>

      <fieldset>
        <legend className="kicker text-chalk-muted">{labels.channels}</legend>
        <p className="mt-1 max-w-2xl text-xs text-pale-muted">{labels.channelsHint}</p>
        <ol className="mt-3 space-y-3">
          {rows.map((row, i) => {
            const err = rowError(i);
            return (
              <li key={row.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start">
                <label className="block">
                  <span className="sr-only">
                    {labels.kind} {i + 1}
                  </span>
                  <select
                    name="link_kind"
                    value={row.kind}
                    onChange={(e) => edit(rows.map((r) => (r.key === row.key ? { ...r, kind: e.target.value as LinkKind | "" } : r)))}
                    className={`${inputCls} !mt-0`}
                  >
                    <option value="">{labels.kind}…</option>
                    {LINK_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {kindName(k)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="sr-only">
                    {labels.url} {i + 1}
                  </span>
                  <input
                    name="link_url"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={300}
                    value={row.url}
                    onChange={(e) => {
                      // un indirizzo di una piattaforma nota sceglie la piattaforma della riga, come farà il server
                      const url = e.target.value;
                      edit(rows.map((r) => (r.key === row.key ? { ...r, url, kind: detectLinkKind(url) ?? r.kind } : r)));
                    }}
                    placeholder={row.kind ? PLACEHOLDER[row.kind] : PLACEHOLDER.website}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? `profile-link-err-${row.key}` : undefined}
                    className={`${inputCls} !mt-0 font-mono text-sm ${err ? "!border-bad" : ""}`}
                  />
                  {err ? (
                    <span id={`profile-link-err-${row.key}`} className="mt-1 block text-xs text-bad">
                      {errorText(err, row.kind)}
                    </span>
                  ) : null}
                </label>
                <span className="flex gap-2">
                  {i > 0 ? (
                    <button type="button" onClick={() => edit([...rows.slice(0, i - 1), row, rows[i - 1], ...rows.slice(i + 1)])} className="btn btn-ink text-xs" aria-label={`${labels.moveUp} (${i + 1})`}>
                      ↑
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => edit(rows.length > 1 ? rows.filter((r) => r.key !== row.key) : toRows([]))}
                    className="btn btn-ink text-xs"
                    aria-label={`${labels.remove} (${i + 1})`}
                  >
                    {labels.remove}
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
        {rows.length < MAX_LINKS ? (
          <button type="button" onClick={() => edit([...rows, emptyRow()])} className="btn btn-ink mt-3 text-xs">
            + {labels.add}
          </button>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary text-xs">
          {pending ? labels.saving : labels.save}
        </button>
        {publicHref ? (
          <a href={publicHref} className="link-mint text-sm font-bold">
            {labels.viewPage} →
          </a>
        ) : null}
        <p aria-live="polite" className="text-sm">
          {pending ? null : topError ? <span className="text-bad">{topError}</span> : state.ok && !errors && !dirty ? <span className="text-good">{labels.saved}</span> : null}
        </p>
      </div>
    </form>
  );
}
