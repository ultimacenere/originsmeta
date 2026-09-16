"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { BEST_OF_OPTIONS, CONQUEST_DECKS_RANGE, COVER_BUCKET, COVER_PRESETS, DEFAULT_COVER, TOURNAMENT_SIZES, type DeckMode } from "@/lib/tournament/types";
import { createTournament, updateTournament, type TournamentActionState } from "@/lib/tournament/actions";
import { useMounted } from "@/lib/useMounted";
import { shrinkImage } from "@/lib/shrinkImage";

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
  lang: "en" | "it";
  description: string;
  rules: string;
  discord_url: string | null;
  listed: boolean;
};

type Props = {
  locale: "en" | "it";
  userId: string;
  /** Influencer, Pro, Staff o admin: possono pubblicare sul calendario e caricare una copertina propria */
  canList: boolean;
  labels: Dictionary["tournaments"];
  loginHref: string;
  /** "edit" con `initial`: stesso modulo nella pagina di gestione; data, posti e regole bloccati se il torneo non è più aperto */
  mode?: "create" | "edit";
  initial?: TournamentInitial;
};

const inputCls = "mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale focus:border-mint";
const MAX_UPLOAD = 1024 * 1024;

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
 */
export function TournamentForm(props: Props) {
  const mounted = useMounted();
  if (!mounted) return <div className="card-night min-h-[32rem] p-6" aria-busy="true" />;
  return <TournamentFormInner {...props} />;
}

function TournamentFormInner({ locale, userId, canList, labels, loginHref, mode = "create", initial }: Props) {
  const x = labels;
  const c = x.create;
  const edit = mode === "edit" && Boolean(initial);
  const lockRules = edit && initial?.status !== "open";
  const router = useRouter();
  const [state, formAction, pending] = useActionState<TournamentActionState, FormData>(edit ? updateTournament : createTournament, {});
  const [deckMode, setDeckMode] = useState<DeckMode>(initial?.deck_mode ?? "free");
  const [startLocal, setStartLocal] = useState<string>(() => (initial ? toLocalInput(new Date(initial.starts_at)) : defaultStart()));
  const [cover, setCover] = useState<string>(initial?.cover_url ?? DEFAULT_COVER);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  useEffect(() => {
    if (!state.ok || !state.href) return;
    if (edit) router.refresh();
    else router.push(state.href);
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

  return (
    <form action={formAction} className="card-night grid gap-6 p-6 sm:p-8">
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

      <label className="block text-sm">
        <span className="kicker text-mint">{c.name}</span>
        <input name="name" required minLength={3} maxLength={60} defaultValue={initial?.name ?? ""} className={inputCls} autoComplete="off" />
      </label>

      <fieldset>
        <legend className="kicker text-mint">{c.cover}</legend>
        <p className="mt-1 text-xs text-pale-muted">{c.coverHint}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COVER_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCover(p)}
              className={`relative aspect-[16/7] overflow-hidden rounded-lg border-2 ${cover === p ? "border-mint shadow-mint" : "border-sky"}`}
              aria-pressed={cover === p}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        {canList ? (
          <div className="mt-4 rounded-lg border border-sky bg-night-2/70 p-3">
            <p className="text-sm font-semibold text-pale">{c.coverUpload}</p>
            <p className="mt-1 text-xs text-pale-muted">{c.coverSpecs}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {/* input file nascosto: il bottone è l'etichetta, così si vede anche sul fondo notte */}
              <label className={`btn btn-mint text-xs ${uploading ? "opacity-60" : "cursor-pointer"}`}>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
                {uploading ? c.coverUploading : c.coverUploadButton}
              </label>
              {uploaded && !uploading ? (
                <>
                  <span className="text-xs text-good">{c.coverUploaded}</span>
                  <button type="button" onClick={() => setCover(DEFAULT_COVER)} className="btn btn-ghost !px-2 !py-1 text-[11px]">
                    {c.coverRemove}
                  </button>
                </>
              ) : null}
              {uploadError ? (
                <span role="alert" className="text-xs text-bad">
                  {x.errors.uploadFailed}
                </span>
              ) : null}
            </div>
            {uploaded ? (
              <div className="mt-3 aspect-[16/7] max-w-sm overflow-hidden rounded-lg border-2 border-mint">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs text-pale-muted">{c.coverLocked}</p>
        )}
      </fieldset>

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

      <fieldset>
        <legend className="kicker text-mint">{c.deckMode}</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-pale">
          {(["free", "conquest"] as const).map((m) => (
            <label key={m} className={`btn text-xs ${deckMode === m ? "btn-mint" : "btn-ink"}`}>
              <input type="radio" name="deck_mode" value={m} checked={deckMode === m} onChange={() => setDeckMode(m)} disabled={lockRules} className="sr-only" />
              {x.deckModes[m]}
            </label>
          ))}
        </div>
        {deckMode === "conquest" ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-pale-muted">{c.conquestDecks}</span>
              <input type="number" name="conquest_decks" min={CONQUEST_DECKS_RANGE.min} max={CONQUEST_DECKS_RANGE.max} defaultValue={initial?.conquest_decks ?? CONQUEST_DECKS_RANGE.default} disabled={lockRules} className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="text-pale-muted">{c.conquestMin}</span>
              <input type="number" name="conquest_min_different" min={0} max={25} defaultValue={initial?.conquest_min_different ?? 9} disabled={lockRules} className={inputCls} />
            </label>
          </div>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="kicker text-mint">{c.bestOf}</span>
          <select name="best_of" defaultValue={initial?.best_of ?? 1} disabled={lockRules} className={inputCls}>
            {BEST_OF_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {x.bestOf.replace("{n}", String(b))}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="kicker text-mint">{c.lang}</span>
          <select name="lang" defaultValue={initial?.lang ?? locale} className={inputCls}>
            <option value="en">English</option>
            <option value="it">Italiano</option>
          </select>
        </label>
      </div>

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
      <label className="block text-sm">
        <span className="kicker text-mint">{c.discord}</span>
        <input name="discord_url" type="url" placeholder="https://discord.gg/…" maxLength={200} defaultValue={initial?.discord_url ?? ""} className={inputCls} />
        <span className="mt-1 block text-xs text-pale-muted">{c.discordHint}</span>
      </label>

      {canList ? (
        <label className="flex items-start gap-3 text-sm text-pale">
          <input type="checkbox" name="listed" defaultChecked={initial?.listed ?? false} className="mt-1 h-4 w-4 accent-mint" />
          <span>
            <span className="font-semibold">{c.listed}</span>
            <span className="block text-xs text-pale-muted">{c.listedHint}</span>
          </span>
        </label>
      ) : (
        <p className="rounded-lg border border-sky bg-night-2/70 p-3 text-xs text-pale-muted">{c.listedLocked}</p>
      )}

      {!edit ? <p className="text-xs text-pale-muted">{c.consent}</p> : null}
      {errorText ? (
        <p role="alert" className="text-sm text-bad">
          {errorText}{" "}
          {state.error === "notLoggedIn" ? (
            <Link href={loginHref} className="link-mint">
              →
            </Link>
          ) : null}
        </p>
      ) : null}
      <div>
        <button type="submit" disabled={pending || uploading || !startIso} className="btn btn-mint">
          {pending ? c.submitting : edit ? x.manage.saveDetails : c.submit}
        </button>
        {edit && state.ok && !pending ? <span className="ml-3 text-sm text-good">{x.manage.saved}</span> : null}
      </div>
    </form>
  );
}
