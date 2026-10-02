"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DRAFT_FORMATS, applyAction, createDraft, isSeed, newSeed, type DraftAction, type DraftFormat, type DraftState, type Seat } from "@/lib/draft/engine";
import { botAction, botKit } from "@/lib/draft/bot";
import { normalizeRoomCode } from "@/lib/draft/online";
import { createDraftRoom } from "@/lib/draft/onlineActions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import type { DraftLabels } from "@/lib/draftLabels";
import { CopyButton } from "@/components/CopyButton";
import { DraftBoard, stageLabel, type DraftUiCard } from "./DraftBoard";

export type { DraftUiCard } from "./DraftBoard";

const HUMAN: Seat = 0;
const BOT: Seat = 1;
/** draft in corso nel browser: si riprende dopo un ricaricamento (solo comodità, la pagina regge senza) */
const STORE = "originsmeta.draft.v1";
const BOT_DELAY = 650;

/**
 * La pagina /draft (02/10/2026): scelta del formato e dell'avversario. Contro il Cervello (`bot.ts`) tutto gira nel
 * browser: il motore (`engine.ts`) è puro e deterministico dal seme, quindi un link con `?f=<formato>&s=<seme>`
 * ripropone lo stesso draft. Contro un amico (fase 2) si crea una stanza (`createDraftRoom`) e si passa a /draft/r/<codice>,
 * dove le mosse le convalida il server (DraftRoom).
 */
export function DraftTable({
  cards,
  labels: L,
  builderHref,
  pageUrl,
  roomBase,
  loginHref,
}: {
  cards: DraftUiCard[];
  labels: DraftLabels;
  builderHref: string;
  pageUrl: string;
  /** /<lingua>/draft/r: le stanze online stanno sotto */
  roomBase: string;
  loginHref: string;
}) {
  const kit = useMemo(() => botKit(cards), [cards]);
  const bySlug = useMemo(() => new Map(cards.map((c) => [c.slug, c])), [cards]);
  const [format, setFormat] = useState<DraftFormat>("exchange");
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [shared, setShared] = useState<{ format: DraftFormat; seed: number } | null>(null);
  const [saved, setSaved] = useState<DraftState | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);

  // link condiviso e draft in corso: una volta, dopo l'idratazione (sul server non ci sono indirizzo né storage)
  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum di indirizzo e localStorage al montaggio */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("f") as DraftFormat | null;
    const s = Number(params.get("s"));
    if (f && DRAFT_FORMATS.includes(f) && isSeed(s)) {
      setShared({ format: f, seed: s });
      setFormat(f);
      return;
    }
    try {
      const raw = localStorage.getItem(STORE);
      const st = raw ? (JSON.parse(raw) as DraftState) : null;
      if (st && st.v === 1 && DRAFT_FORMATS.includes(st.format) && st.phase !== "done" && st.seats?.length === 2) setSaved(st);
    } catch {
      // storage non disponibile: si parte da zero
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!draft) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(draft));
    } catch {
      // storage pieno o bloccato: il draft continua lo stesso
    }
  }, [draft]);

  // il Cervello muove quando tocca a lui, con una piccola pausa per lasciar vedere la mossa
  useEffect(() => {
    if (!draft || draft.phase === "done" || !draft.seats[BOT].pending) return;
    const t = setTimeout(() => {
      setDraft((cur) => {
        if (!cur || !cur.seats[BOT].pending) return cur;
        const res = applyAction(cur, botAction(cur, BOT, kit));
        return "state" in res ? res.state : cur;
      });
    }, draft.phase === "build" ? 200 : BOT_DELAY);
    return () => clearTimeout(t);
  }, [draft, kit]);

  const start = (f: DraftFormat, seed: number) => {
    const st = createDraft(f, seed, cards);
    setDraft(st);
    setSaved(null);
    setConfirmRestart(false);
    trackEvent("draft_start", { format: f, opponent: "bot" });
    try {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState(null, "", url.pathname);
    } catch {
      // niente
    }
  };

  const act = (action: DraftAction) => {
    setDraft((cur) => {
      if (!cur) return cur;
      const res = applyAction(cur, action);
      return "state" in res ? res.state : cur;
    });
  };

  const reset = () => {
    setDraft(null);
    setConfirmRestart(false);
    try {
      localStorage.removeItem(STORE);
    } catch {
      // niente
    }
  };

  if (!draft) {
    return (
      <Setup
        L={L}
        format={format}
        setFormat={setFormat}
        shared={shared}
        saved={saved}
        roomBase={roomBase}
        loginHref={loginHref}
        onStart={() => start(format, shared && shared.format === format ? shared.seed : newSeed())}
        onResume={() => saved && setDraft(saved)}
        onDiscard={() => {
          setSaved(null);
          try {
            localStorage.removeItem(STORE);
          } catch {
            // niente
          }
        }}
      />
    );
  }

  const fmt = L.formats[draft.format];
  const challenge = `${pageUrl}?f=${draft.format}&s=${draft.seed}`;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="kicker text-mint">
          {fmt.name} · {stageLabel(L, draft)}
        </p>
        <p className="text-xs text-chalk-muted">{fmt.tagline}</p>
        <div className="ml-auto flex items-center gap-2">
          {confirmRestart ? (
            <>
              <span className="text-sm text-chalk">{L.play.restartConfirm}</span>
              <button type="button" className="btn btn-ghost text-xs" onClick={reset}>
                {L.play.yes}
              </button>
              <button type="button" className="btn btn-ink text-xs" onClick={() => setConfirmRestart(false)}>
                {L.play.no}
              </button>
            </>
          ) : draft.phase !== "done" ? (
            <button type="button" className="btn btn-ink text-xs" onClick={() => setConfirmRestart(true)}>
              {L.play.restart}
            </button>
          ) : null}
        </div>
      </div>
      <DraftBoard
        L={L}
        view={draft}
        me={HUMAN}
        oppName={L.botName}
        oppDeckTitle={L.result.botDeck}
        bySlug={bySlug}
        kit={kit}
        builderHref={builderHref}
        onAct={act}
        resultActions={
          <>
            <button type="button" className="btn btn-primary" onClick={reset}>
              {L.result.newDraft}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => start(draft.format, draft.seed)}>
              {L.result.replay}
            </button>
            <CopyButton text={challenge} label={L.result.challenge} copied={L.result.challengeCopied} className="btn btn-ghost" />
            <p className="basis-full text-xs text-chalk-muted">{L.result.challengeHint}</p>
          </>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ scelta del formato e dell'avversario */

function Setup({
  L,
  format,
  setFormat,
  shared,
  saved,
  roomBase,
  loginHref,
  onStart,
  onResume,
  onDiscard,
}: {
  L: DraftLabels;
  format: DraftFormat;
  setFormat: (f: DraftFormat) => void;
  shared: { format: DraftFormat; seed: number } | null;
  saved: DraftState | null;
  roomBase: string;
  loginHref: string;
  onStart: () => void;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const router = useRouter();
  const O = L.online;
  // l'accesso si legge nel browser: la pagina resta statica (il server ricontrolla comunque a ogni mossa)
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => alive && setSignedIn(Boolean(data.session?.user)));
    return () => {
      alive = false;
    };
  }, []);

  const createRoom = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await createDraftRoom(format);
      if (res.ok) {
        router.push(`${roomBase}/${res.code}`);
        return;
      }
      setError((O.errors as Record<string, string>)[res.error] ?? O.errors.generic);
    } catch {
      setError(O.errors.generic);
    }
    setBusy(false);
  };

  const joinCode = (e: React.FormEvent) => {
    e.preventDefault();
    const c = normalizeRoomCode(code);
    if (!c) {
      setError(O.notFound);
      return;
    }
    router.push(`${roomBase}/${c}`);
  };

  return (
    <div className="space-y-5">
      {saved ? (
        <div className="felt-panel-mint flex flex-wrap items-center gap-3 p-4">
          <p className="text-sm text-chalk">
            {L.setup.resumeHint} <span className="text-chalk-muted">({L.formats[saved.format].name})</span>
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={onResume}>
              {L.setup.resume}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onDiscard}>
              {L.setup.discard}
            </button>
          </div>
        </div>
      ) : null}
      <fieldset>
        <legend className="t-section">{L.setup.chooseFormat}</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {DRAFT_FORMATS.map((f) => {
            const on = f === format;
            return (
              <label key={f} className={`card-night card-night-hover block cursor-pointer p-4 ${on ? "!border-mint shadow-[var(--shadow-mint)]" : ""}`}>
                <input type="radio" name="draft-format" value={f} checked={on} onChange={() => setFormat(f)} className="sr-only" />
                <span className="flex items-center justify-between gap-2">
                  <span className="t-item text-sky">{L.formats[f].name}</span>
                  <span aria-hidden="true" className={`h-4 w-4 rounded-full border-2 ${on ? "border-mint bg-mint" : "border-sky"}`} />
                </span>
                <span className="mt-2 block text-sm text-chalk">{L.formats[f].tagline}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="felt-panel flex flex-col gap-3 p-4">
          <h2 className="t-panel text-sky">{O.vsBot}</h2>
          <p className="text-sm text-chalk">{O.vsBotHint}</p>
          <p className="text-xs text-chalk-muted">{L.setup.opponent}</p>
          {shared && shared.format === format ? <p className="text-sm text-mint">{L.setup.shared}</p> : null}
          <button type="button" className="btn btn-primary mt-auto self-start" onClick={onStart}>
            {L.setup.start}
          </button>
        </div>
        <div className="felt-panel flex flex-col gap-3 p-4">
          <h2 className="t-panel text-sky">{O.vsFriend}</h2>
          <p className="text-sm text-chalk">{O.vsFriendHint}</p>
          {signedIn === false ? (
            <p className="text-sm text-chalk">
              {O.signinNeeded}{" "}
              <a href={loginHref} className="font-bold text-mint hover:underline">
                {O.signin} →
              </a>
            </p>
          ) : (
            <button type="button" className="btn btn-mint self-start" onClick={createRoom} disabled={busy || signedIn === null}>
              {O.createRoom}
            </button>
          )}
          <form onSubmit={joinCode} className="mt-auto flex flex-wrap items-center gap-2">
            <label htmlFor="draft-room-code" className="text-xs text-chalk-muted">
              {O.haveCode}
            </label>
            <input
              id="draft-room-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={O.codePlaceholder}
              maxLength={12}
              autoCapitalize="characters"
              autoComplete="off"
              className="w-36 rounded-lg border border-felt-line bg-felt px-3 py-2 font-mono text-sm uppercase text-chalk"
            />
            <button type="submit" className="btn btn-ghost text-xs" disabled={!code.trim()}>
              {O.join}
            </button>
          </form>
          {error ? (
            <p className="text-sm text-crimson-soft" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
