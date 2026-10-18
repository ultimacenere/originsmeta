"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodeGameCode } from "@/lib/deckcode";
import type { BroadcastCard, PeekLabels } from "@/lib/broadcast/catalog";
import { demoState } from "@/lib/broadcast/demo";
import { fillLabel, overlayLabels, regiaLabels, type RegiaLang } from "@/lib/broadcast/labels";
import {
  BEST_OF,
  BROADCAST_LANGS,
  LIMITS,
  MAX_DECKS,
  MAX_SPONSORS,
  SPONSOR_FORMATS,
  isUploadedImage,
  SPONSOR_SECONDS,
  SCORE_SECONDS,
  bumpScore,
  clampScore,
  cyclePlayed,
  decodeState,
  preferStored,
  STORED_STATE_MAX,
  withoutUploads,
  deckFromKeys,
  cleanUrl,
  emptyDeck,
  emptySponsor,
  emptyState,
  encodeState,
  phaseOf,
  stateFromHash,
  type BroadcastBestOf,
  type BroadcastDeck,
  type BroadcastLang,
  type BroadcastPlayer,
  type BroadcastState,
  type BroadcastTournamentResponse,
  type ListSide,
  type BroadcastSponsor,
} from "@/lib/broadcast/state";
import { BROADCAST_BACKGROUNDS, backgroundSrc, openChannel, readStored, writeStored } from "@/lib/broadcast/sync";
import { BroadcastOverlay } from "./BroadcastOverlay";
import { sponsorImage } from "./sponsorImage";

/**
 * Broadcasting OM, la regia (/broadcast, prototipo del 16/10/2026): chi trasmette il torneo prepara qui quello che il
 * pubblico vede sopra la partita (torneo, punteggio, giocatori, mazzi, copie giocate) e lo manda all'overlay.
 * Fonti dei dati: il Tournament Organizer del sito (tag OM-XXXX: nome, formato, partite, punteggi e le liste che chi è
 * collegato può vedere), i Mazzi torneo pubblicati, i codici del gioco incollati, o tutto a mano.
 * Lo stato vive nel browser (hash dell'indirizzo e localStorage) e passa all'overlay con `sync.ts`.
 */
const UI_KEY = "originsmeta.broadcast.ui.v1";

type Notice = { kind: "ok" | "error"; text: string } | null;

export function BroadcastRegia({ catalog: list, peekLabels, initialUi }: { catalog: BroadcastCard[]; peekLabels: PeekLabels; initialUi: RegiaLang }) {
  const catalog = useMemo(() => new Map(list.map((c) => [c.slug, c])), [list]);
  const byKey = useMemo(() => new Map(list.filter((c) => c.key).map((c) => [c.key as string, { slug: c.slug, legendary: c.legendary }])), [list]);
  const isCard = useCallback((slug: string) => catalog.has(slug), [catalog]);

  const [ui, setUi] = useState<RegiaLang>(initialUi);
  const L = regiaLabels[ui];
  const [state, setState] = useState<BroadcastState>(() => demoState(initialUi === "it" ? "it" : "en"));
  const [ready, setReady] = useState(false);
  const [bgId, setBgId] = useState<string>("reveals");
  // "Mostra lo sponsor adesso": a ogni clic l'anteprima passa subito allo sponsor (senza aspettare i secondi del punteggio)
  const [sponsorNow, setSponsorNow] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);

  // primo avvio: lo stato dell'indirizzo, altrimenti l'ultimo di questo browser, altrimenti la partita di prova
  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum di indirizzo e localStorage al montaggio */
  useEffect(() => {
    const saved = preferStored(decodeState(stateFromHash(window.location.hash), isCard), decodeState(readStored(), isCard, STORED_STATE_MAX));
    if (saved) setState(saved);
    try {
      const u = window.localStorage.getItem(UI_KEY);
      if (u === "it" || u === "en") setUi(u);
    } catch {
      /* niente preferenze salvate */
    }
    channel.current = openChannel();
    setReady(true);
    return () => channel.current?.close();
  }, [isCard]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ogni modifica va all'overlay (canale + localStorage) e nell'indirizzo della regia
  // `full` va all'overlay nel browser (con le immagini caricate degli sponsor), `code` negli indirizzi (senza)
  const full = useMemo(() => encodeState(state), [state]);
  const code = useMemo(() => encodeState(withoutUploads(state)), [state]);
  useEffect(() => {
    if (!ready) return;
    writeStored(full);
    channel.current?.postMessage(full);
    window.history.replaceState(null, "", `#s=${code}`);
  }, [full, code, ready]);

  const changeUi = (u: RegiaLang) => {
    setUi(u);
    try {
      window.localStorage.setItem(UI_KEY, u);
    } catch {
      /* resta per questa visita */
    }
  };

  const setTournament = (patch: Partial<BroadcastState["tournament"]>) =>
    setState((s) => {
      const tournament = { ...s.tournament, ...patch };
      const players = s.players.map((p) => ({ ...p, score: clampScore(p.score, tournament.bestOf) })) as BroadcastState["players"];
      return { ...s, tournament, players };
    });
  const setPlayer = (i: 0 | 1, patch: Partial<BroadcastPlayer>) =>
    setState((s) => {
      const players = [...s.players] as BroadcastState["players"];
      players[i] = { ...players[i], ...patch };
      return { ...s, players };
    });
  const setDeck = (i: 0 | 1, d: number, deck: BroadcastDeck) =>
    setState((s) => {
      const players = [...s.players] as BroadcastState["players"];
      const decks = [...players[i].decks];
      decks[d] = deck;
      players[i] = { ...players[i], decks };
      return { ...s, players };
    });
  const setSide = (i: 0 | 1, side: ListSide) =>
    setState((s) => {
      const players = [...s.players] as BroadcastState["players"];
      players[i] = { ...players[i], list: side };
      const other = (1 - i) as 0 | 1;
      // due liste dallo stesso lato si coprirebbero: l'altra passa dal lato libero
      if (side !== "off" && players[other].list === side) players[other] = { ...players[other], list: side === "left" ? "right" : "left" };
      return { ...s, players };
    });
  const swap = () =>
    setState((s) => ({
      ...s,
      players: [
        { ...s.players[1], list: s.players[0].list },
        { ...s.players[0], list: s.players[1].list },
      ],
    }));
  const resetCopies = () =>
    setState((s) => ({ ...s, players: s.players.map((p) => ({ ...p, decks: p.decks.map((d) => ({ ...d, played: {} })) })) as BroadcastState["players"] }));
  const resetSeries = () =>
    setState((s) => ({ ...s, players: s.players.map((p) => ({ ...p, score: 0, decks: p.decks.map((d) => ({ ...d, played: {} })) })) as BroadcastState["players"] }));

  const onCardClick = (p: 0 | 1, slug: string) =>
    setState((s) => {
      const players = [...s.players] as BroadcastState["players"];
      const pl = players[p];
      const decks = [...pl.decks];
      // la lista mostrata in anteprima è quella del mazzo in campo
      decks[pl.active] = cyclePlayed(decks[pl.active], slug);
      players[p] = { ...pl, decks };
      return { ...s, players };
    });

  const liveUrl = typeof window === "undefined" ? `/broadcast/live#s=${code}` : `${window.location.origin}/broadcast/live#s=${code}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      window.prompt(L.copyLink, liveUrl);
    }
  };
  const openWindow = () => window.open(`/broadcast/live#s=${code}`, "originsmeta-broadcast-live", "popup,width=1280,height=720");

  return (
    <div className="bcr">
      <header className="bcr-head">
        <div className="bcr-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo piccolo, già in WebP */}
          <img src="/media/logo-originsmeta-sm.webp" alt="OriginsMeta" width={130} height={40} className="bcr-logo" />
          <div>
            <h1 className="bcr-h1">
              Broadcasting OM <span>· {L.title}</span>
            </h1>
            <p className="bcr-intro">{L.intro}</p>
          </div>
        </div>
        <div className="bcr-head-tools">
          <label className="bcr-inline">
            <span>{L.uiLang}</span>
            <select value={ui} onChange={(e) => changeUi(e.target.value as RegiaLang)}>
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </label>
          <button type="button" className="bcr-btn" onClick={() => setState(demoState(state.lang))}>
            {L.demo}
          </button>
          <button type="button" className="bcr-btn bcr-btn-ghost" onClick={() => setState(emptyState(state.lang))}>
            {L.clear}
          </button>
        </div>
      </header>

      <div className="bcr-grid">
        <div className="bcr-controls">
          <TournamentBox L={L} state={state} setTournament={setTournament} setState={setState} isCard={isCard} />

          <section className="bcr-box">
            <div className="bcr-box-head">
              <h2>{L.players}</h2>
              <button type="button" className="bcr-btn bcr-btn-ghost" onClick={swap}>
                ⇅ {L.swap}
              </button>
            </div>
            <div className="bcr-players">
              {([0, 1] as const).map((p) => (
                <PlayerBox
                  key={p}
                  p={p}
                  L={L}
                  state={state}
                  byKey={byKey}
                  catalog={catalog}
                  setPlayer={setPlayer}
                  setDeck={setDeck}
                  setSide={setSide}
                  bump={(delta) => setState((s) => bumpScore(s, p, delta))}
                />
              ))}
            </div>
            <div className="bcr-row">
              <button type="button" className="bcr-btn" onClick={resetCopies}>
                {L.nextGame}
              </button>
              <button type="button" className="bcr-btn bcr-btn-ghost" onClick={resetSeries}>
                {L.resetSeries}
              </button>
            </div>
          </section>

          <SponsorsBox L={L} sponsors={state.sponsors} onChange={(sponsors) => setState((s) => ({ ...s, sponsors }))} />

          <section className="bcr-box">
            <h2>{L.output}</h2>
            <p className="bcr-note">{L.outputText}</p>
            <input className="bcr-url" readOnly value={liveUrl} onFocus={(e) => e.currentTarget.select()} aria-label={L.copyLink} />
            <div className="bcr-row">
              <button type="button" className="bcr-btn bcr-btn-primary" onClick={copyLink}>
                {linkCopied ? L.linkCopied : L.copyLink}
              </button>
              <button type="button" className="bcr-btn" onClick={openWindow}>
                {L.openWindow}
              </button>
              <a className="bcr-btn bcr-btn-ghost" href={`/broadcast/live?bg=${bgId || "reveals"}#s=${code}`} target="_blank" rel="noopener">
                {L.viewerDemo} ↗
              </a>
            </div>
          </section>
        </div>

        <div className="bcr-preview">
          <div className="bcr-box-head">
            <h2>{L.preview}</h2>
            {state.sponsors.on ? (
              <button type="button" className="bcr-btn bcr-btn-ghost" onClick={() => setSponsorNow((n) => n + 1)}>
                {L.showSponsorNow}
              </button>
            ) : null}
            <label className="bcr-inline">
              <span>{L.background}</span>
              <select value={bgId} onChange={(e) => setBgId(e.target.value)}>
                {BROADCAST_BACKGROUNDS.map((b, i) => (
                  <option key={b.id} value={b.id}>
                    {fillLabel(L.screen, { n: i + 1 })}
                  </option>
                ))}
                <option value="">{L.noBackground}</option>
              </select>
            </label>
          </div>
          <div className="bcr-stage" data-transparent={bgId ? undefined : ""}>
            <BroadcastOverlay state={state} catalog={catalog} peekLabels={peekLabels} mode="regia" onCardClick={onCardClick} background={backgroundSrc(bgId)} sponsorNow={sponsorNow} />
          </div>
          <p className="bcr-note">{L.previewHint}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- torneo ---------------- */

function TournamentBox({
  L,
  state,
  setTournament,
  setState,
  isCard,
}: {
  L: (typeof regiaLabels)[RegiaLang];
  state: BroadcastState;
  setTournament: (patch: Partial<BroadcastState["tournament"]>) => void;
  setState: React.Dispatch<React.SetStateAction<BroadcastState>>;
  isCard: (slug: string) => boolean;
}) {
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [data, setData] = useState<BroadcastTournamentResponse | null>(null);
  const t = state.tournament;

  const load = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/broadcast/tournament?tag=${encodeURIComponent(tag)}`, { cache: "no-store" });
      if (res.status === 400) setNotice({ kind: "error", text: L.errors.tag });
      else if (res.status === 404) setNotice({ kind: "error", text: L.errors.missing });
      else if (!res.ok) setNotice({ kind: "error", text: L.errors.network });
      else {
        const body = (await res.json()) as BroadcastTournamentResponse;
        setData(body);
        setTournament({ name: body.name.slice(0, LIMITS.tournament), tag: body.tag });
        setNotice({ kind: "ok", text: body.matches.length ? L.loaded : L.matchesNone });
      }
    } catch {
      setNotice({ kind: "error", text: L.errors.network });
    } finally {
      setBusy(false);
    }
  };

  const playerName = (id: string | null) => data?.players.find((p) => p.id === id)?.name ?? "—";
  const phases = overlayLabels[state.lang].phases;

  const applyMatch = (id: string) => {
    const m = data?.matches.find((x) => x.id === id);
    if (!data || !m) return;
    const isFinal = m.round === data.totalRounds;
    const bestOf = ((isFinal && data.finalBestOf) || data.bestOf) as BroadcastBestOf;
    const decksOf = (uid: string | null): BroadcastDeck[] => {
      const list = uid ? data.decks[uid] : undefined;
      if (!list?.length) return [emptyDeck(), emptyDeck(), emptyDeck()];
      return list.slice(0, MAX_DECKS).map((d) => ({ name: d.name.slice(0, LIMITS.player), legendary: d.legendary && isCard(d.legendary) ? d.legendary : null, cards: d.cards.filter(isCard).slice(0, 12), played: {} }));
    };
    const hidden = [m.a, m.b].some((uid) => !uid || !data.decks[uid]?.length);
    setState((s) => ({
      ...s,
      tournament: { ...s.tournament, name: data.name.slice(0, LIMITS.tournament), tag: data.tag, bestOf: BEST_OF.includes(bestOf) ? bestOf : 3, phase: phaseOf(m.round, data.totalRounds, phases) },
      players: [
        { ...s.players[0], name: playerName(m.a).slice(0, LIMITS.player), score: clampScore(m.scoreA ?? 0, bestOf), decks: decksOf(m.a), active: 0 },
        { ...s.players[1], name: playerName(m.b).slice(0, LIMITS.player), score: clampScore(m.scoreB ?? 0, bestOf), decks: decksOf(m.b), active: 0 },
      ],
    }));
    setNotice(hidden ? { kind: "error", text: L.decksHidden } : { kind: "ok", text: L.loaded });
  };

  return (
    <section className="bcr-box">
      <h2>{L.tournament}</h2>
      <div className="bcr-row">
        <input className="bcr-input bcr-grow" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="OM-XXXX" aria-label={L.tag} onKeyDown={(e) => e.key === "Enter" && load()} />
        <button type="button" className="bcr-btn" onClick={load} disabled={busy || !tag.trim()}>
          {busy ? L.loading : L.load}
        </button>
      </div>
      {data && data.matches.length ? (
        <label className="bcr-field">
          <span>{L.pickMatch}</span>
          <select defaultValue="" onChange={(e) => applyMatch(e.target.value)}>
            <option value="" disabled>
              —
            </option>
            {data.matches
              .filter((m) => m.a && m.b)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {phaseOf(m.round, data.totalRounds, phases)} · {playerName(m.a)} {m.scoreA ?? 0}–{m.scoreB ?? 0} {playerName(m.b)}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      {notice ? <p className={`bcr-notice bcr-notice-${notice.kind}`}>{notice.text}</p> : null}
      <div className="bcr-fields">
        <label className="bcr-field bcr-span2">
          <span>{L.name}</span>
          <input className="bcr-input" value={t.name} maxLength={LIMITS.tournament} onChange={(e) => setTournament({ name: e.target.value })} />
        </label>
        <label className="bcr-field">
          <span>{L.number}</span>
          <input className="bcr-input" value={t.number} maxLength={LIMITS.number} onChange={(e) => setTournament({ number: e.target.value })} placeholder="#1" />
        </label>
        <label className="bcr-field">
          <span>{L.phase}</span>
          <input className="bcr-input" value={t.phase} maxLength={LIMITS.phase} onChange={(e) => setTournament({ phase: e.target.value })} list="bcr-phases" />
          <datalist id="bcr-phases">
            {Object.values(phases).filter((x) => !x.includes("{n}")).map((x) => <option key={x} value={x} />)}
          </datalist>
        </label>
        <label className="bcr-field">
          <span>{L.bestOf}</span>
          <select value={t.bestOf} onChange={(e) => setTournament({ bestOf: Number(e.target.value) as BroadcastBestOf })}>
            {BEST_OF.map((n) => (
              <option key={n} value={n}>
                Bo{n}
              </option>
            ))}
          </select>
        </label>
        <label className="bcr-field">
          <span>{L.overlayLang}</span>
          <select value={state.lang} onChange={(e) => setState((s) => ({ ...s, lang: e.target.value as BroadcastLang }))}>
            {BROADCAST_LANGS.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

/* ---------------- sponsor ---------------- */

/**
 * Spazio sponsor (idea di Davdas del 19/10/2026): acceso o spento, fino a 3 sponsor, secondi per sponsor. Ogni sponsor
 * ha un nome, un formato (logo o bannerino, con le misure scritte accanto: `SPONSOR_FORMATS`), l'immagine caricata dal
 * computer (ricodificata alle misure del formato, `sponsorImage`) oppure il suo indirizzo https, e il sito facoltativo.
 * Gli indirizzi entrano nello stato solo se sono https (`cleanUrl`): finché non lo sono, la regia lo dice.
 */
function SponsorsBox({ L, sponsors, onChange }: { L: (typeof regiaLabels)[RegiaLang]; sponsors: BroadcastState["sponsors"]; onChange: (s: BroadcastState["sponsors"]) => void }) {
  // testo scritto nei campi degli indirizzi, anche quando non è ancora valido (lo stato tiene solo quelli validi)
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const setItem = (i: number, patch: Partial<BroadcastSponsor>) => onChange({ ...sponsors, items: sponsors.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const urlField = (i: number, field: "logo" | "url", label: string) => {
    const id = `${i}-${field}`;
    const value = drafts[id] ?? sponsors.items[i][field];
    const bad = value.trim() !== "" && !cleanUrl(value);
    return (
      <label className="bcr-field">
        <span>{label}</span>
        <input
          className="bcr-input bcr-mono"
          value={value}
          inputMode="url"
          placeholder="https://"
          aria-invalid={bad || undefined}
          onChange={(e) => {
            const v = e.target.value;
            setDrafts((d) => ({ ...d, [id]: v }));
            setItem(i, { [field]: cleanUrl(v) });
          }}
        />
        {bad ? <span className="bcr-notice bcr-notice-error">{L.badUrl}</span> : null}
      </label>
    );
  };
  const upload = async (i: number, file: File | undefined) => {
    if (!file) return;
    setBusy(i);
    setErrors((e) => ({ ...e, [i]: "" }));
    const res = await sponsorImage(file, sponsors.items[i].kind);
    setBusy(null);
    if (!res.ok) {
      setErrors((e) => ({ ...e, [i]: L.imageErrors[res.error] }));
      return;
    }
    setDrafts((d) => ({ ...d, [`${i}-logo`]: "" }));
    setItem(i, { logo: res.src });
  };

  return (
    <section className="bcr-box">
      <div className="bcr-box-head">
        <h2>{L.sponsors}</h2>
        <label className="bcr-switch">
          <input type="checkbox" checked={sponsors.on} onChange={(e) => onChange({ ...sponsors, on: e.target.checked })} />
          <span>{L.sponsorsOn}</span>
        </label>
      </div>
      <p className="bcr-note">{L.sponsorsText}</p>
      <div className="bcr-decks" data-off={sponsors.on ? undefined : ""}>
        {sponsors.items.map((item, i) => {
          const uploaded = isUploadedImage(item.logo);
          const spec = SPONSOR_FORMATS[item.kind];
          return (
            <div key={i} className="bcr-deck">
              <div className="bcr-deck-head">
                <strong>Sponsor {i + 1}</strong>
                <span className="bcr-deck-sum" />
                {sponsors.items.length > 1 ? (
                  <button
                    type="button"
                    className="bcr-link"
                    onClick={() => {
                      setDrafts({});
                      setErrors({});
                      onChange({ ...sponsors, items: sponsors.items.filter((_, j) => j !== i) });
                    }}
                  >
                    {L.removeDeck}
                  </button>
                ) : null}
              </div>
              <label className="bcr-field">
                <span>{L.sponsorName}</span>
                <input className="bcr-input" value={item.name} maxLength={LIMITS.sponsor} onChange={(e) => setItem(i, { name: e.target.value })} />
              </label>
              <div className="bcr-field">
                <span>{L.sponsorKind}</span>
                <div className="bcr-seg">
                  {(["logo", "banner"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={item.kind === k}
                      onClick={() => {
                        // un'immagine caricata per l'altro formato ha le misure sbagliate: si toglie
                        setItem(i, { kind: k, ...(uploaded && k !== item.kind ? { logo: "" } : {}) });
                        setErrors((e) => ({ ...e, [i]: "" }));
                      }}
                    >
                      {L.kinds[k]} · {SPONSOR_FORMATS[k].width} × {SPONSOR_FORMATS[k].height}
                    </button>
                  ))}
                </div>
              </div>
              <p className="bcr-spec">{fillLabel(L.specs[item.kind], { w: spec.width, h: spec.height, mw: spec.shown.width, mh: spec.shown.height })}</p>
              <div className="bcr-upload">
                <div className={`bcr-upload-preview bcr-upload-${item.kind}`} style={{ aspectRatio: `${spec.shown.width} / ${spec.shown.height}` }}>
                  {item.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- anteprima di un file scelto dal computer o di un indirizzo https
                    <img src={item.logo} alt={item.name} referrerPolicy="no-referrer" />
                  ) : (
                    <span>
                      {spec.width} × {spec.height}
                    </span>
                  )}
                </div>
                <div className="bcr-upload-actions">
                  <label className="bcr-btn">
                    {busy === i ? L.loading : uploaded ? L.replaceFile : L.uploadFile[item.kind]}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={busy !== null}
                      onChange={(e) => {
                        upload(i, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {item.logo ? (
                    <button
                      type="button"
                      className="bcr-link"
                      onClick={() => {
                        setDrafts((d) => ({ ...d, [`${i}-logo`]: "" }));
                        setItem(i, { logo: "" });
                      }}
                    >
                      {L.removeImage}
                    </button>
                  ) : null}
                </div>
              </div>
              {errors[i] ? <p className="bcr-notice bcr-notice-error">{errors[i]}</p> : null}
              {uploaded ? <p className="bcr-note">{L.uploadedNote}</p> : urlField(i, "logo", L.sponsorLogo)}
              {urlField(i, "url", L.sponsorUrl)}
            </div>
          );
        })}
        <div className="bcr-row">
          {sponsors.items.length < MAX_SPONSORS ? (
            <button type="button" className="bcr-btn bcr-btn-ghost" onClick={() => onChange({ ...sponsors, items: [...sponsors.items, emptySponsor()] })}>
              + {L.addSponsor}
            </button>
          ) : null}
        </div>
        <div className="bcr-row">
          {(
            [
              ["scoreSeconds", L.scoreSeconds, SCORE_SECONDS],
              ["seconds", L.sponsorSeconds, SPONSOR_SECONDS],
            ] as const
          ).map(([field, label, lim]) => (
            <label key={field} className="bcr-inline">
              <span>{label}</span>
              <input
                className="bcr-input bcr-num"
                type="number"
                min={lim.min}
                max={lim.max}
                value={sponsors[field]}
                onChange={(e) => {
                  const n = Math.trunc(Number(e.target.value));
                  if (Number.isFinite(n)) onChange({ ...sponsors, [field]: Math.min(Math.max(n, lim.min), lim.max) });
                }}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- giocatore ---------------- */

function PlayerBox({
  p,
  L,
  state,
  byKey,
  catalog,
  setPlayer,
  setDeck,
  setSide,
  bump,
}: {
  p: 0 | 1;
  L: (typeof regiaLabels)[RegiaLang];
  state: BroadcastState;
  byKey: Map<string, { slug: string; legendary: boolean }>;
  catalog: Map<string, BroadcastCard>;
  setPlayer: (i: 0 | 1, patch: Partial<BroadcastPlayer>) => void;
  setDeck: (i: 0 | 1, d: number, deck: BroadcastDeck) => void;
  setSide: (i: 0 | 1, side: ListSide) => void;
  bump: (delta: 1 | -1) => void;
}) {
  const player = state.players[p];
  const [setSlug, setSetSlug] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const loadSet = async () => {
    setNotice(null);
    const slug = setSlug.trim().replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "";
    try {
      const res = await fetch(`/api/broadcast/deck-set?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (res.status === 404 || res.status === 400) return setNotice({ kind: "error", text: L.errors.missing });
      if (!res.ok) return setNotice({ kind: "error", text: L.errors.network });
      const body = (await res.json()) as { decks: { name: string; legendary: string | null; cards: string[] }[] };
      const decks = body.decks.slice(0, MAX_DECKS).map((d) => ({
        name: d.name.slice(0, LIMITS.player),
        legendary: d.legendary && catalog.has(d.legendary) ? d.legendary : null,
        cards: [...new Set(d.cards)].filter((s) => catalog.has(s)).slice(0, 12),
        played: {},
      }));
      if (decks.length) setPlayer(p, { decks, active: 0 });
      setNotice({ kind: "ok", text: L.loaded });
    } catch {
      setNotice({ kind: "error", text: L.errors.network });
    }
  };

  return (
    <div className="bcr-player">
      <div className="bcr-player-head">
        <span className="bcr-pos">{p === 0 ? L.top : L.bottom}</span>
        <div className="bcr-score" aria-label={L.score}>
          <button type="button" onClick={() => bump(-1)} aria-label="−1">
            −
          </button>
          <strong>{player.score}</strong>
          <button type="button" onClick={() => bump(1)} aria-label="+1">
            +
          </button>
        </div>
      </div>
      <label className="bcr-field">
        <span>{L.playerName}</span>
        <input className="bcr-input" value={player.name} maxLength={LIMITS.player} onChange={(e) => setPlayer(p, { name: e.target.value })} />
      </label>
      <label className="bcr-field">
        <span>{L.playerTitle}</span>
        <input className="bcr-input" value={player.title} maxLength={LIMITS.title} onChange={(e) => setPlayer(p, { title: e.target.value })} />
      </label>
      <div className="bcr-field">
        <span>{L.inPlay}</span>
        <div className="bcr-seg">
          {player.decks.map((_, i) => (
            <button key={i} type="button" aria-pressed={player.active === i} onClick={() => setPlayer(p, { active: i })}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="bcr-field">
        <span>{L.list}</span>
        <div className="bcr-seg">
          {(["left", "right", "off"] as const).map((side) => (
            <button key={side} type="button" aria-pressed={player.list === side} onClick={() => setSide(p, side)}>
              {L.sides[side]}
            </button>
          ))}
        </div>
      </div>

      <div className="bcr-decks">
        {player.decks.map((deck, d) => (
          <DeckEditor
            key={d}
            L={L}
            index={d}
            deck={deck}
            active={player.active === d}
            catalog={catalog}
            byKey={byKey}
            onChange={(next) => setDeck(p, d, next)}
            onRemove={
              player.decks.length > 1
                ? () => {
                    const decks = player.decks.filter((_, i) => i !== d);
                    setPlayer(p, { decks, active: Math.min(player.active >= d && player.active > 0 ? player.active - 1 : player.active, decks.length - 1) });
                  }
                : undefined
            }
          />
        ))}
        {player.decks.length < MAX_DECKS ? (
          <button type="button" className="bcr-btn bcr-btn-ghost" onClick={() => setPlayer(p, { decks: [...player.decks, emptyDeck()] })}>
            + {L.addDeck}
          </button>
        ) : null}
      </div>

      <label className="bcr-field">
        <span>{L.deckSet}</span>
        <div className="bcr-row">
          <input className="bcr-input bcr-grow" value={setSlug} onChange={(e) => setSetSlug(e.target.value)} placeholder="originsmeta.com/decks/tournament/…" />
          <button type="button" className="bcr-btn" onClick={loadSet} disabled={!setSlug.trim()}>
            {L.load}
          </button>
        </div>
      </label>
      {notice ? <p className={`bcr-notice bcr-notice-${notice.kind}`}>{notice.text}</p> : null}
    </div>
  );
}

function DeckEditor({
  L,
  index,
  deck,
  active,
  catalog,
  byKey,
  onChange,
  onRemove,
}: {
  L: (typeof regiaLabels)[RegiaLang];
  index: number;
  deck: BroadcastDeck;
  active: boolean;
  catalog: Map<string, BroadcastCard>;
  byKey: Map<string, { slug: string; legendary: boolean }>;
  onChange: (deck: BroadcastDeck) => void;
  onRemove?: () => void;
}) {
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const legendary = deck.legendary ? catalog.get(deck.legendary)?.name : null;
  const played = Object.values(deck.played).reduce((a, b) => a + b, 0);

  const paste = async (raw: string) => {
    setCode(raw);
    if (!raw.trim()) return setNotice(null);
    const res = await decodeGameCode(raw);
    if ("error" in res) return setNotice({ kind: "error", text: L.errors.code });
    const { deck: next, unknown } = deckFromKeys(res.keys, (k) => byKey.get(k));
    onChange({ ...next, name: deck.name });
    setCode("");
    setNotice(unknown ? { kind: "error", text: fillLabel(L.errors.unknown, { n: unknown }) } : { kind: "ok", text: L.loaded });
  };

  return (
    <div className="bcr-deck" data-active={active ? "" : undefined}>
      <div className="bcr-deck-head">
        <strong>{fillLabel(L.deck, { n: index + 1 })}</strong>
        <span className="bcr-deck-sum">
          {legendary ? `★ ${legendary} · ` : ""}
          {deck.cards.length ? fillLabel(L.cards, { n: 1 + deck.cards.length * 2 - (deck.legendary ? 0 : 1) }) : L.empty}
        </span>
        {played ? (
          <button type="button" className="bcr-link" onClick={() => onChange({ ...deck, played: {} })}>
            {L.resetCopies}
          </button>
        ) : null}
        {onRemove ? (
          <button type="button" className="bcr-link" onClick={onRemove}>
            {L.removeDeck}
          </button>
        ) : null}
      </div>
      <input className="bcr-input" value={deck.name} maxLength={LIMITS.player} placeholder={L.deckName} aria-label={L.deckName} onChange={(e) => onChange({ ...deck, name: e.target.value })} />
      <input className="bcr-input bcr-mono" value={code} placeholder={L.pasteCode} aria-label={L.pasteCode} onChange={(e) => paste(e.target.value)} />
      {notice ? <p className={`bcr-notice bcr-notice-${notice.kind}`}>{notice.text}</p> : null}
    </div>
  );
}
