"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { localeNames, locales, type Dictionary, type Locale } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { BEST_OF_OPTIONS, CONQUEST_DECKS_RANGE, COVER_BUCKET, COVER_PRESETS, DEFAULT_COVER, TOURNAMENT_SIZES, VISIBILITIES, bestOfLabel, fill, type DeckMode, type Visibility } from "@/lib/tournament/types";
import { createTournament, updateTournament, type TournamentActionState } from "@/lib/tournament/actions";
import { useMounted } from "@/lib/useMounted";
import { RULES } from "@/lib/deckrules";
import { shrinkImage } from "@/lib/shrinkImage";
import { trackEvent, type EventParams } from "@/lib/analytics";

/** Valori attuali per la modifica (pagina di gestione). */
export type TournamentInitial = {
  id: string;
  status: string;
  name: string;
  cover_url: string | null;
  starts_at: string;
  size: number;
  deck_mode: DeckMode;
  conquest_decks: number;
  conquest_min_different: number;
  best_of: number;
  lang: Locale;
  description: string;
  rules: string;
  discord_url: string | null;
  listed: boolean;
  visibility: Visibility;
};

type Props = {
  locale: Locale;
  userId: string;
  /** Influencer, Pro, Staff o admin: possono pubblicare sul calendario e caricare una copertina propria */
  canList: boolean;
  labels: Dictionary["tournaments"];
  loginHref: string;
  /** "edit" con `initial`: stesso modulo nella pagina di gestione; data, posti e regole bloccati se il torneo non è più aperto */
  mode?: "create" | "edit";
  initial?: TournamentInitial;
  /** indirizzo dello staff: a chi non può pubblicare sul calendario diciamo come chiedere il tag */
  contactEmail?: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale focus:border-mint";
/** Opzione di un gruppo (radio nascosto dentro l'etichetta): cornice di focus visibile anche da tastiera. */
const choiceCls = "btn btn-choice text-xs cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint";
const MAX_UPLOAD = 1024 * 1024;
/** Copertine mostrate prima di "Mostra tutte": le 20 del media kit insieme erano un muro di immagini. */
const COVERS_SHOWN = 8;
/** Errori che riguardano campi dentro "Altre opzioni": quando arrivano, il blocco si apre da solo. */
const MORE_ERRORS = new Set(["discord", "cover", "listing", "listing_not_allowed", "visibility", "lang", "private_not_listed"]);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Valore per <input type="datetime-local"> nell'ora locale del browser. */
function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  return toLocalInput(d);
}

/**
 * Modulo "Organizza un torneo". L'ora di inizio è scelta nell'ora locale e inviata in ISO (campo nascosto);
 * la copertina è un'immagine del media kit oppure, per chi ha il tag giusto, un file caricato dal browser
 * direttamente nello Storage (le policy del bucket controllano tag, cartella, dimensione e tipo): al server
 * arriva solo l'URL, che viene verificato. Il modulo si monta solo nel browser (valori di default locali).
 *
 * Struttura (21/09/2026): prima erano 12 decisioni tutte aperte quando serve solo il nome. Ora il blocco
 * "L'essenziale" (nome, data, posti, regole dei mazzi, durata degli incontri) è sempre aperto e ha il tasto
 * Crea subito sotto; copertina, testi, Discord, lingua, visibilità e calendario stanno in un <details> chiuso,
 * che si apre da solo se l'errore riguarda uno di quei campi. I campi chiusi viaggiano comunque con il modulo.
 */
export function TournamentForm(props: Props) {
  const mounted = useMounted();
  if (!mounted) return <div className="card-night min-h-[24rem] p-6" aria-busy="true" />;
  return <TournamentFormInner {...props} />;
}

function TournamentFormInner({ locale, userId, canList, labels, loginHref, mode = "create", initial, contactEmail }: Props) {
  const x = labels;
  const c = x.create;
  const edit = mode === "edit" && Boolean(initial);
  const lockRules = edit && initial?.status !== "open";
  const router = useRouter();
  const [state, formAction, pending] = useActionState<TournamentActionState, FormData>(edit ? updateTournament : createTournament, {});
  const [, startSubmit] = useTransition();
  /* misura: il torneo inviato, per l'evento tournament_create quando l'azione risponde "fatto" (solo in creazione) */
  const sent = useRef<EventParams["tournament_create"] | null>(null);
  const [deckMode, setDeckMode] = useState<DeckMode>(initial?.deck_mode ?? "free");
  const [startLocal, setStartLocal] = useState<string>(() => (initial ? toLocalInput(new Date(initial.starts_at)) : defaultStart()));
  const [cover, setCover] = useState<string>(initial?.cover_url ?? DEFAULT_COVER);
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "public");
  // chi può pubblicare sul calendario lo trova già spuntato (in creazione); in modifica vale quello salvato
  const [listed, setListed] = useState<boolean>(initial ? initial.listed : canList);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [moreOpen, setMoreOpen] = useState<boolean>(edit);
  const [allCovers, setAllCovers] = useState<boolean>(() => (COVER_PRESETS as readonly string[]).indexOf(initial?.cover_url ?? DEFAULT_COVER) >= COVERS_SHOWN);

  // un errore su un campo di "Altre opzioni" apre il blocco (stato aggiornato durante il render, senza effetto)
  const [seenState, setSeenState] = useState<TournamentActionState>(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.error && MORE_ERRORS.has(state.error)) setMoreOpen(true);
  }

  useEffect(() => {
    if (!state.ok || !state.href) return;
    if (edit) router.refresh();
    else {
      if (sent.current) trackEvent("tournament_create", sent.current);
      sent.current = null;
      router.push(state.href);
    }
  }, [state, router, edit]);

  const startDate = new Date(startLocal);
  const startIso = Number.isNaN(startDate.getTime()) ? "" : startDate.toISOString();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(false);
    setUploading(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error("disabled");
      const blob = await shrinkImage(file);
      if (blob.size > MAX_UPLOAD) throw new Error("too_big");
      const path = `${userId}/${crypto.randomUUID()}.webp`;
      const { error } = await sb.storage.from(COVER_BUCKET).upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      setCover(sb.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const errorText = state.error ? (x.errors[state.error as keyof typeof x.errors] ?? x.errors.db) : null;
  const uploaded = !(COVER_PRESETS as readonly string[]).includes(cover);
  const shownCovers = allCovers ? COVER_PRESETS : COVER_PRESETS.filter((p, i) => i < COVERS_SHOWN || p === cover);
  const [howToBefore, howToAfter] = c.listedHowTo.split("{email}");

  /** Errore e tasto di invio; `withAlert` solo sul primo, così un lettore di schermo non annuncia l'errore due volte. */
  const submitRow = (withAlert: boolean) => (
    <div className="grid gap-3">
      {errorText ? (
        <p role={withAlert ? "alert" : undefined} className="alert-bad">
          {errorText}{" "}
          {state.error === "notLoggedIn" ? (
            <Link href={loginHref} className="link-mint">
              →
            </Link>
          ) : null}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || uploading || !startIso} className="btn btn-primary">
          {pending ? c.submitting : edit ? x.manage.saveDetails : c.submit}
        </button>
        {edit && state.ok && !pending ? <span className="alert-good !inline-block">{x.manage.saved}</span> : null}
      </div>
    </div>
  );

  return (
    <form
      // invio a mano invece di <form action>: React 19 riporta i campi non controllati al valore iniziale quando
      // l'azione finisce, anche se torna un errore, e l'organizzatore perderebbe nome, descrizione, regole e link
      // (come in PublishDeckForm). La validazione del browser resta.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (!edit) sent.current = { visibility, deck_mode: deckMode };
        startSubmit(() => formAction(fd));
      }}
      // un campo non valido dentro "Altre opzioni" chiuso non si può mettere a fuoco: prima si apre il blocco
      // (subito nel DOM, così il browser trova il campo già in questo invio, e nello stato)
      onInvalidCapture={(e) => {
        const det = (e.target as HTMLElement).closest("details");
        if (det) {
          det.open = true;
          setMoreOpen(true);
        }
      }}
      className="card-night grid gap-6 p-6 sm:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="cover_url" value={cover} />
      <input type="hidden" name="starts_at" value={startIso} />
      {edit && initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      {lockRules && initial ? (
        <>
          {/* a torneo avviato posti e regole non cambiano: i controlli sono disabilitati e i valori viaggiano qui */}
          <input type="hidden" name="size" value={initial.size} />
          <input type="hidden" name="deck_mode" value={initial.deck_mode} />
          <input type="hidden" name="conquest_decks" value={initial.conquest_decks} />
          <input type="hidden" name="conquest_min_different" value={initial.conquest_min_different} />
          <input type="hidden" name="best_of" value={initial.best_of} />
        </>
      ) : null}

      {/* ---------- L'essenziale: sempre aperto ---------- */}
      <fieldset>
        <legend className="font-display text-lg font-extrabold text-chalk">{c.essentials}</legend>
        <div className="mt-1 grid gap-5">
          <p className="text-sm text-pale-muted">{c.essentialsHint}</p>

          <label className="block text-sm">
            <span className="kicker text-mint">{c.name}</span>
            <input name="name" required minLength={3} maxLength={60} defaultValue={initial?.name ?? ""} className={inputCls} autoComplete="off" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="kicker text-mint">{c.startsAt}</span>
              <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} required readOnly={lockRules} className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="kicker text-mint">{c.size}</span>
              <select name="size" defaultValue={initial?.size ?? 8} disabled={lockRules} className={inputCls}>
                {TOURNAMENT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-pale-muted">{c.sizeHint}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="kicker text-mint">{c.deckMode}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["free", "conquest"] as const).map((m) => (
                  <label key={m} className={`${choiceCls} ${deckMode === m ? "is-on" : ""}`}>
                    <input type="radio" name="deck_mode" value={m} checked={deckMode === m} onChange={() => setDeckMode(m)} disabled={lockRules} className="sr-only" />
                    {deckMode === m ? "✓ " : ""}
                    {x.deckModes[m]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm">
              <span className="kicker text-mint">{c.bestOf}</span>
              <select name="best_of" defaultValue={initial?.best_of ?? 1} disabled={lockRules} className={inputCls}>
                {BEST_OF_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {bestOfLabel(x, b)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {deckMode === "conquest" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-pale-muted">{c.conquestDecks}</span>
                <input type="number" name="conquest_decks" min={CONQUEST_DECKS_RANGE.min} max={CONQUEST_DECKS_RANGE.max} defaultValue={initial?.conquest_decks ?? CONQUEST_DECKS_RANGE.default} disabled={lockRules} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-pale-muted">{c.conquestMin}</span>
                <input type="number" name="conquest_min_different" min={0} max={13} defaultValue={initial?.conquest_min_different ?? RULES.conquestMinDifferent} disabled={lockRules} className={inputCls} />
              </label>
            </div>
          ) : null}
        </div>
      </fieldset>

      {!edit ? (
        <div className="grid gap-3 border-t border-sky/40 pt-5">
          {canList && listed && visibility === "public" ? <p className="text-xs text-pale">{c.listedDefault}</p> : null}
          <p className="text-xs text-pale-muted">{c.consent}</p>
          {submitRow(true)}
        </div>
      ) : null}

      {/* ---------- Altre opzioni: chiuse (aperte in modifica) ---------- */}
      <details open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)} className="group rounded-xl border-2 border-sky bg-night-2/50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-display text-base font-extrabold text-chalk">{c.more}</span>
            <span className="mt-0.5 block text-xs text-pale-muted">{c.moreHint}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 font-mono text-lg text-sky transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="grid gap-6 border-t border-sky/40 p-4 sm:p-5">
          <fieldset>
            <legend className="kicker text-mint">{c.cover}</legend>
            <p className="mt-1 text-xs text-pale-muted">{c.coverHint}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {shownCovers.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCover(p)}
                  className={`relative aspect-[16/7] overflow-hidden rounded-lg border-2 ${cover === p ? "border-mint shadow-mint" : "border-sky"}`}
                  aria-pressed={cover === p}
                  aria-label={`${c.cover} ${i + 1}`}
                >
                  {/* miniature ridimensionate da next/image: prima si scaricavano le 20 immagini a piena risoluzione */}
                  <Image src={p} alt="" fill sizes="(min-width: 640px) 200px, 45vw" className="object-cover" />
                  {cover === p ? <span className="absolute right-1 top-1 rounded bg-mint px-1.5 font-mono text-[11px] font-bold text-ink">✓</span> : null}
                </button>
              ))}
            </div>
            {COVER_PRESETS.length > COVERS_SHOWN ? (
              <button type="button" onClick={() => setAllCovers((v) => !v)} className="link-mint mt-2 text-sm" aria-expanded={allCovers}>
                {allCovers ? c.showFewerCovers : fill(c.showAllCovers, { n: COVER_PRESETS.length })}
              </button>
            ) : null}
            {canList ? (
              <div className="mt-4 rounded-lg border border-sky bg-night-2/70 p-3">
                <p className="text-sm font-semibold text-pale">{c.coverUpload}</p>
                <p className="mt-1 text-xs text-pale-muted">{c.coverSpecs}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {/* input file nascosto: il bottone è l'etichetta, così si vede anche sul fondo notte */}
                  <label className={`btn btn-ink text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${uploading ? "opacity-60" : "cursor-pointer"}`}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
                    {uploading ? c.coverUploading : c.coverUploadButton}
                  </label>
                  {uploaded && !uploading ? (
                    <>
                      <span className="text-xs text-good">✓ {c.coverUploaded}</span>
                      <button type="button" onClick={() => setCover(DEFAULT_COVER)} className="btn btn-ghost !px-2 !py-1 text-[11px]">
                        {c.coverRemove}
                      </button>
                    </>
                  ) : null}
                  {uploadError ? (
                    <span role="alert" className="text-xs text-error">
                      {x.errors.uploadFailed}
                    </span>
                  ) : null}
                </div>
                {uploaded ? (
                  <div className="mt-3 aspect-[16/7] max-w-sm overflow-hidden rounded-lg border-2 border-mint">
                    {/* copertina caricata nello Storage (dominio esterno): immagine semplice */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-pale-muted">{c.coverLocked}</p>
            )}
          </fieldset>

          <label className="block text-sm">
            <span className="kicker text-mint">{c.description}</span>
            <textarea name="description" rows={5} maxLength={2000} defaultValue={initial?.description ?? ""} className={inputCls} />
            <span className="mt-1 block text-xs text-pale-muted">{c.descriptionHint}</span>
          </label>
          <label className="block text-sm">
            <span className="kicker text-mint">{c.rules}</span>
            <textarea name="rules" rows={5} maxLength={2000} defaultValue={initial?.rules ?? ""} className={inputCls} />
            <span className="mt-1 block text-xs text-pale-muted">{c.rulesHint}</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="kicker text-mint">{c.discord}</span>
              <input name="discord_url" type="url" placeholder="https://discord.gg/…" maxLength={200} defaultValue={initial?.discord_url ?? ""} className={inputCls} />
              <span className="mt-1 block text-xs text-pale-muted">{c.discordHint}</span>
            </label>
            <label className="block text-sm">
              <span className="kicker text-mint">{c.lang}</span>
              <select name="lang" defaultValue={initial?.lang ?? locale} className={inputCls}>
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {localeNames[l]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="kicker text-mint">{c.visibility}</legend>
            {/* chi ha il tag trova in cima la casella del calendario, già spuntata */}
            {canList && visibility === "public" ? (
              <label className="mt-2 flex items-start gap-3 rounded-lg border border-sky bg-night/60 p-3 text-sm text-pale">
                <input type="checkbox" name="listed" checked={listed} onChange={(e) => setListed(e.target.checked)} className="mt-1 h-4 w-4 accent-mint" />
                <span>
                  <span className="font-semibold text-chalk">{c.listed}</span>
                  <span className="block text-xs text-pale-muted">{c.listedHint}</span>
                </span>
              </label>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {VISIBILITIES.map((v) => (
                <label key={v} className={`${choiceCls} ${visibility === v ? "is-on" : ""}`}>
                  <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)} className="sr-only" />
                  {visibility === v ? "✓ " : ""}
                  {x.visibilities[v]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-pale-muted">{c.visibilityHint}</p>
            {visibility === "private" ? (
              <p className="mt-3 rounded-lg border border-sky bg-night-2/70 p-3 text-xs text-pale-muted">{c.listedPrivate}</p>
            ) : !canList ? (
              <p className="mt-3 rounded-lg border border-sky bg-night-2/70 p-3 text-xs text-pale-muted">
                {c.listedLocked}{" "}
                {contactEmail ? (
                  <>
                    {howToBefore}
                    <a className="link-mint" href={`mailto:${contactEmail}?subject=${encodeURIComponent("OriginsMeta tag")}`}>
                      {contactEmail}
                    </a>
                    {howToAfter ?? ""}
                  </>
                ) : null}
              </p>
            ) : null}
          </fieldset>

          {/* in creazione un secondo tasto in fondo, per chi ha compilato le opzioni e non vuole risalire */}
          {!edit ? submitRow(false) : null}
        </div>
      </details>

      {edit ? submitRow(true) : null}
    </form>
  );
}
