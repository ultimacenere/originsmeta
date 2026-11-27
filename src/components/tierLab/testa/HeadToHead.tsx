"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { GameCardFace } from "@/components/GameCard";
import { tierTone } from "@/lib/tiercode";
import type { Locale } from "@/lib/i18n";
import { daySeed, higher, pickChallenge, utcDay, yourRanking, type Duel, type DuelLeg, type Source } from "./duels";
import "./testa.css";

/*
  «Testa a testa» (prototipo 2 della tier list, 27/11/2026): otto duelli fra Leggendarie con la schermata VS del gioco.
  Tocchi la carta che secondo te vince più spesso, la rivelazione mostra il dato vero dello scontro dal Tracker e i tre
  verdetti (tier list ufficiale, community, voti 1–10). Alla fine la tua classifica accanto a quella ufficiale.
  Sfida del giorno: stesso seme per tutti nella stessa data (UTC). Sfida casuale: seme nell'indirizzo (#s=…).
*/

type Props = {
  locale: Locale;
  legs: DuelLeg[];
  pool: Duel[];
  /** il giorno del server (AAAA-MM-GG, UTC): il browser lo ricontrolla al montaggio */
  initialDay: string;
  /** la patch degli scontri, per esteso («4 novembre») */
  patchLabel: string;
  pagePath: string;
};

type Seed = { value: number; daily: boolean; day: string };

const SOURCES: { id: Source; label: string }[] = [
  { id: "official", label: "Tier list ufficiale" },
  { id: "community", label: "Community" },
  { id: "votes", label: "Voti 1-10" },
];

const N = 8;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** porta in vista un elemento solo se non lo è già (sul telefono il risultato sta sotto il palco) */
function bringIntoView(el: HTMLElement | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top < 70 || r.bottom > window.innerHeight) el.scrollIntoView({ block: r.height > window.innerHeight - 80 ? "start" : "nearest", behavior: reduced() ? "auto" : "smooth" });
}

export function HeadToHead({ locale, legs, pool, initialDay, patchLabel, pagePath }: Props) {
  const bySlug = useMemo(() => new Map(legs.map((l) => [l.slug, l])), [legs]);
  const pct = useMemo(() => new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  const pct0 = useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale]);
  const num = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dec = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale]);
  const dayLabel = (day: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

  const [seed, setSeed] = useState<Seed>({ value: daySeed(initialDay), daily: true, day: initialDay });
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<(string | null)[]>([]);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const bouts = useMemo(() => pickChallenge(pool, seed.value, N), [pool, seed.value]);

  const resultRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLButtonElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum dell'indirizzo e della data del browser al montaggio */
  useEffect(() => {
    const m = /(?:^#|&)s=(\d{1,10})/.exec(window.location.hash);
    if (m) {
      setSeed({ value: Number(m[1]) >>> 0, daily: false, day: initialDay });
      return;
    }
    const today = utcDay();
    if (today !== initialDay) setSeed({ value: daySeed(today), daily: true, day: today });
  }, [initialDay]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const done = bouts.length > 0 && idx >= bouts.length;
  const bout = bouts[idx];
  const picked = picks[idx] ?? null;
  const revealed = picked !== null;

  const results = picks.map((p, i) => (p === null || !bouts[i] ? null : p === bouts[i].duel.a));
  const score = results.filter(Boolean).length;
  let streak = 0;
  let best = 0;
  for (const r of results) {
    if (r === null) continue;
    streak = r ? streak + 1 : 0;
    best = Math.max(best, streak);
  }

  const choose = useCallback(
    (slug: string) => {
      if (revealed || done) return;
      setPicks((ps) => {
        const next = [...ps];
        next[idx] = slug;
        return next;
      });
    },
    [revealed, done, idx],
  );

  const advance = useCallback(() => {
    if (!revealed) return;
    setIdx((i) => i + 1);
  }, [revealed]);

  // dopo la scelta: il risultato in vista e il fuoco sul tasto per andare avanti (Invio funziona da lì)
  useEffect(() => {
    if (!revealed) return;
    const t = window.setTimeout(() => {
      nextRef.current?.focus({ preventScroll: true });
      bringIntoView(resultRef.current);
    }, reduced() ? 0 : 420);
    return () => window.clearTimeout(t);
  }, [revealed, idx]);

  // duello nuovo: la carta di sinistra col fuoco, il palco in vista; a fine sfida il riepilogo
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      return;
    }
    if (done) {
      bringIntoView(finalRef.current);
      finalRef.current?.focus({ preventScroll: true });
    } else {
      leftRef.current?.focus({ preventScroll: true });
      bringIntoView(stageRef.current);
    }
  }, [idx, done, seed.value]);

  // tastiera: ← e → scelgono, Invio va avanti (sui tasti e sui link vale il loro clic)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !bout || done) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (e.key === "ArrowLeft" && !revealed) {
        e.preventDefault();
        choose(bout.left);
      } else if (e.key === "ArrowRight" && !revealed) {
        e.preventDefault();
        choose(bout.right);
      } else if (e.key === "Enter" && revealed && tag !== "BUTTON" && tag !== "A") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bout, done, revealed, choose, advance]);

  const restart = (s: Seed) => {
    setSeed(s);
    setIdx(0);
    setPicks([]);
    setCopied("");
    const url = s.daily ? window.location.pathname : `${window.location.pathname}#s=${s.value}`;
    window.history.replaceState(null, "", url);
  };
  const playRandom = () => restart({ value: Math.floor(Math.random() * 2 ** 31), daily: false, day: seed.day });
  const playToday = () => {
    const day = utcDay();
    restart({ value: daySeed(day), daily: true, day });
  };

  const title = seed.daily ? `La sfida del ${dayLabel(seed.day)}` : "Sfida casuale";

  return (
    <section className="tlv" aria-labelledby="tlv-title">
      <div className="tlv-top">
        <h2 id="tlv-title" className="t-section text-sky">
          {title}
        </h2>
        <ol className="tlv-pips" aria-label="Duelli">
          {Array.from({ length: bouts.length || N }, (_, i) => {
            const r = results[i];
            const state = r === true ? "is-right" : r === false ? "is-wrong" : i === idx ? "is-now" : "";
            const word = r === true ? "giusto" : r === false ? "sbagliato" : i === idx ? "in corso" : "da giocare";
            return <li key={i} className={`tlv-pip ${state}`} aria-label={`Duello ${i + 1}: ${word}`} />;
          })}
        </ol>
        <p className="tlv-score">
          <span>
            Punti <b>{score}</b>
          </span>
          <span>
            Serie <b>{streak}</b>
          </span>
        </p>
      </div>

      {!done && bout ? (
        <Bout
          key={`${seed.value}-${idx}`}
          bout={bout}
          idx={idx}
          total={bouts.length}
          legs={bySlug}
          picked={picked}
          locale={locale}
          onPick={choose}
          onNext={advance}
          isLast={idx === bouts.length - 1}
          stageRef={stageRef}
          resultRef={resultRef}
          nextRef={nextRef}
          leftRef={leftRef}
          fmt={{ pct, num, dec }}
          patchLabel={patchLabel}
        />
      ) : null}

      {done ? (
        <Final
          ref={finalRef}
          bouts={bouts}
          picks={picks}
          legs={bySlug}
          score={score}
          best={best}
          seed={seed}
          title={seed.daily ? `nella sfida del ${dayLabel(seed.day)}` : "in una sfida casuale"}
          locale={locale}
          pct0={pct0}
          copied={copied}
          onShare={async () => {
            const marks = results.map((r) => (r ? "✓" : "✗")).join("");
            const url = `${window.location.origin}${pagePath}${seed.daily ? "" : `#s=${seed.value}`}`;
            const text = `${score}/${bouts.length} ${seed.daily ? `nella sfida del ${dayLabel(seed.day)}` : "in una sfida casuale"} della tier list di OriginsMeta ${marks}\n${url}`;
            try {
              await navigator.clipboard.writeText(text);
              setCopied("ok");
            } catch {
              setCopied("fail");
            }
          }}
          shareText={`${score}/${bouts.length} ${seed.daily ? `nella sfida del ${dayLabel(seed.day)}` : "in una sfida casuale"} della tier list di OriginsMeta`}
          onRandom={playRandom}
          onToday={playToday}
        />
      ) : null}
    </section>
  );
}

type Fmt = { pct: Intl.NumberFormat; num: Intl.NumberFormat; dec: Intl.NumberFormat };

function Bout({
  bout,
  idx,
  total,
  legs,
  picked,
  locale,
  onPick,
  onNext,
  isLast,
  stageRef,
  resultRef,
  nextRef,
  leftRef,
  fmt,
  patchLabel,
}: {
  bout: { duel: Duel; left: string; right: string };
  idx: number;
  total: number;
  legs: Map<string, DuelLeg>;
  picked: string | null;
  locale: Locale;
  onPick: (slug: string) => void;
  onNext: () => void;
  isLast: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  resultRef: RefObject<HTMLDivElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
  leftRef: RefObject<HTMLButtonElement | null>;
  fmt: Fmt;
  patchLabel: string;
}) {
  const { duel } = bout;
  const L = legs.get(bout.left) as DuelLeg;
  const R = legs.get(bout.right) as DuelLeg;
  const W = legs.get(duel.a) as DuelLeg;
  const Lo = legs.get(duel.b) as DuelLeg;
  const revealed = picked !== null;
  const right = picked === duel.a;
  // il win rate di ognuna delle due nello scontro (sinistra e destra), con l'intervallo della sinistra
  const rateOf = (slug: string) => (slug === duel.a ? duel.r : 1 - duel.r);
  const leftLo = bout.left === duel.a ? duel.lo : 1 - duel.hi;
  const leftHi = bout.left === duel.a ? duel.hi : 1 - duel.lo;

  const tops = SOURCES.map((s) => ({ ...s, top: higher(s.id, L, R) }));
  const hook = hookLine(tops, W, Lo, legs);

  const side = (leg: DuelLeg, pos: "left" | "right") => {
    const isWin = revealed && leg.slug === duel.a;
    const isPick = picked === leg.slug;
    const cls = ["tlv-side", `tlv-side--${pos}`, revealed ? (isWin ? "is-win" : "is-lose") : "", isPick ? "is-picked" : ""].join(" ");
    return (
      <button
        ref={pos === "left" ? leftRef : undefined}
        type="button"
        className={cls}
        onClick={() => onPick(leg.slug)}
        aria-disabled={revealed || undefined}
        aria-label={revealed ? `${leg.name}: ${fmt.pct.format(rateOf(leg.slug))} degli scontri vinti` : `Scegli ${leg.name}`}
      >
        <span className="tlv-card">
          <GameCardFace input={leg.game} lang={locale} />
        </span>
        <span className={`tlv-pct ${revealed ? "is-on" : ""}`} aria-hidden>
          {revealed ? fmt.pct.format(rateOf(leg.slug)) : "?"}
        </span>
        {isPick ? <span className="tlv-mine">La tua scelta</span> : null}
      </button>
    );
  };

  return (
    <>
      <div ref={stageRef} className={`tlv-stage ${revealed ? "is-revealed" : ""}`}>
        <span className="tlv-rays" aria-hidden />
        <span className="tlv-flash" aria-hidden />
        <p className="tlv-q">
          <span className="tlv-count">
            Duello {idx + 1} di {total}
          </span>
          Quando si incontrano, chi vince più spesso?
        </p>
        <div className="tlv-arena">
          {side(L, "left")}
          <span className="tlv-vs" aria-hidden>
            VS
          </span>
          {side(R, "right")}
        </div>
        <p className="tlv-keys" aria-hidden>
          ← → per scegliere · Invio per andare avanti
        </p>
      </div>

      <div ref={resultRef} className={`tlv-result ${revealed ? "is-on" : ""}`} aria-live="polite">
        {revealed ? (
          <>
            <p className={`tlv-verdict ${right ? "is-right" : "is-wrong"}`}>{right ? "Giusto" : `No: vince ${W.name}`}</p>
            <p className="tlv-line">
              <b>{W.name}</b> vince il {fmt.pct.format(duel.r)} degli scontri con {Lo.name} su {fmt.num.format(duel.games)} partite (intervallo{" "}
              {fmt.pct.format(duel.lo)}–{fmt.pct.format(duel.hi)}).
            </p>
            <div className="tlv-bar" role="img" aria-label={`${L.name} ${fmt.pct.format(rateOf(L.slug))}, ${R.name} ${fmt.pct.format(rateOf(R.slug))}`}>
              <span className="tlv-bar-l" style={{ width: `${rateOf(L.slug) * 100}%` }} />
              <span className="tlv-bar-band" style={{ left: `${leftLo * 100}%`, width: `${(leftHi - leftLo) * 100}%` }} />
              <span className="tlv-bar-mid" />
            </div>
            <p className="tlv-bar-names" aria-hidden>
              <span>{L.name}</span>
              <span>{R.name}</span>
            </p>
            {duel.close ? <p className="tlv-close">Scontro tirato: l&apos;intervallo comprende il 50%, il vantaggio è piccolo.</p> : null}

            <table className="tlv-verdicts">
              <caption className="sr-only">Chi sta più in alto secondo le tre classifiche</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Classifica</span>
                  </th>
                  <th scope="col">{L.name}</th>
                  <th scope="col">{R.name}</th>
                </tr>
              </thead>
              <tbody>
                {tops.map((t) => (
                  <tr key={t.id}>
                    <th scope="row">{t.label}</th>
                    {[L, R].map((leg) => (
                      <td key={leg.slug} className={t.top === leg.slug ? "is-top" : ""}>
                        <SourceValue src={t.id} leg={leg} dec={fmt.dec} />
                        {t.top === leg.slug ? <span className="tlv-up">sopra</span> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {hook ? <p className="tlv-hook">{hook}</p> : null}
            <p className="tlv-src">Scontri dal Tracker nella patch del {patchLabel}, contando tutti e due i lati.</p>
            <button ref={nextRef} type="button" className="btn-primary tlv-next" onClick={onNext}>
              {isLast ? "Vedi la tua classifica" : "Prossimo duello"}
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

function SourceValue({ src, leg, dec }: { src: Source; leg: DuelLeg; dec: Intl.NumberFormat }) {
  if (src === "official") {
    return leg.tier === "unranked" ? <span className="tlv-val">senza fascia</span> : <Letter t={leg.tier} />;
  }
  const v = src === "community" ? leg.community : leg.votes;
  if (!v) return <span className="tlv-val">—</span>;
  return (
    <span className="tlv-val">
      {v.tier ? <Letter t={v.tier} /> : null} {dec.format(v.avg)}
    </span>
  );
}

function Letter({ t }: { t: keyof typeof tierTone }) {
  return <span className={`tier-letter is-small ${tierTone[t]}`}>{t}</span>;
}

/** La riga che fa discutere: quando una delle classifiche mette sopra chi negli scontri perde. */
function hookLine(tops: { id: Source; top: string | null }[], W: DuelLeg, Lo: DuelLeg, legs: Map<string, DuelLeg>): string | null {
  const get = (id: Source) => tops.find((t) => t.id === id)?.top ?? null;
  const name = (slug: string) => legs.get(slug)?.name ?? slug;
  const com = get("community");
  const vot = get("votes");
  const off = get("official");
  if (com && com !== W.slug) return `La community mette sopra ${name(com)}, i dati dicono il contrario.`;
  if (vot && vot !== W.slug) return `Nei voti sta sopra ${name(vot)}, ma testa a testa vince ${W.name}.`;
  if (off && off !== W.slug) return `Nella tier list ufficiale sta sopra ${name(off)}: la fascia conta tutti gli scontri, non solo questo con ${Lo.name}.`;
  if (com === W.slug && vot === W.slug && off === W.slug) return "Dati, tier list, community e voti sono d'accordo.";
  return null;
}

function Final({
  ref,
  bouts,
  picks,
  legs,
  score,
  best,
  title,
  locale,
  pct0,
  copied,
  onShare,
  shareText,
  onRandom,
  onToday,
  seed,
}: {
  ref: RefObject<HTMLDivElement | null>;
  bouts: { duel: Duel; left: string; right: string }[];
  picks: (string | null)[];
  legs: Map<string, DuelLeg>;
  score: number;
  best: number;
  title: string;
  locale: Locale;
  pct0: Intl.NumberFormat;
  copied: "" | "ok" | "fail";
  onShare: () => void;
  shareText: string;
  onRandom: () => void;
  onToday: () => void;
  seed: Seed;
}) {
  const mine = yourRanking(bouts, picks, legs);
  const official = [...mine].sort((a, b) => a.leg.rank - b.leg.rank);
  const agree = (src: Source | "data") => {
    let yes = 0;
    let all = 0;
    bouts.forEach((b, i) => {
      const top = src === "data" ? b.duel.a : higher(src, legs.get(b.left) as DuelLeg, legs.get(b.right) as DuelLeg);
      if (!top || !picks[i]) return;
      all += 1;
      if (picks[i] === top) yes += 1;
    });
    return all ? yes / all : null;
  };
  const meters: { label: string; v: number | null }[] = [
    { label: "con i dati degli scontri", v: agree("data") },
    { label: "con la tier list ufficiale", v: agree("official") },
    { label: "con la community", v: agree("community") },
    { label: "con i voti 1-10", v: agree("votes") },
  ];

  return (
    <div ref={ref} className="tlv-final" tabIndex={-1}>
      <p className="tlv-big">
        <b>
          {score}/{bouts.length}
        </b>{" "}
        {title}
      </p>
      <p className="tlv-best">Serie migliore: {best}</p>

      <div className="tlv-agree">
        <h3 className="t-item text-sky">Quanto sei d&apos;accordo</h3>
        <ul>
          {meters
            .filter((m) => m.v !== null)
            .map((m) => (
              <li key={m.label}>
                <span className="tlv-agree-v">{pct0.format(m.v as number)}</span>
                <span className="tlv-agree-l">{m.label}</span>
                <span className="tlv-agree-bar" aria-hidden>
                  <span style={{ width: `${(m.v as number) * 100}%` }} />
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div className="tlv-ranks">
        <div>
          <h3 className="t-item text-sky">La tua classifica</h3>
          <ol>
            {mine.map((e, i) => (
              <li key={e.slug}>
                <span className="tlv-rank-n">{i + 1}</span>
                <span className="tlv-rank-card" aria-hidden>
                  <GameCardFace input={e.leg.game} lang={locale} />
                </span>
                <span className="tlv-rank-name">
                  <a href={e.leg.href}>{e.leg.name}</a>
                  <small>
                    scelta {e.won} {e.won === 1 ? "volta" : "volte"} su {e.seen}
                  </small>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="t-item text-sky">Nella tier list ufficiale</h3>
          <ol>
            {official.map((e) => (
              <li key={e.slug}>
                <span className="tlv-rank-n">{e.leg.rank}</span>
                {e.leg.tier === "unranked" ? <span className="tlv-val">—</span> : <Letter t={e.leg.tier} />}
                <span className="tlv-rank-name">
                  <a href={e.leg.href}>{e.leg.name}</a>
                  <small>
                    {mine.findIndex((m) => m.slug === e.slug) + 1}ª nella tua
                  </small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="tlv-actions">
        <button type="button" className="btn-primary tlv-btn" onClick={onShare}>
          Condividi
        </button>
        <button type="button" className="tlv-btn tlv-btn--quiet" onClick={onRandom}>
          Rigioca con una sfida casuale
        </button>
        {!seed.daily ? (
          <button type="button" className="tlv-btn tlv-btn--quiet" onClick={onToday}>
            Torna alla sfida di oggi
          </button>
        ) : null}
      </div>
      <p className="tlv-copied" aria-live="polite">
        {copied === "ok" ? "Testo copiato: incollalo dove vuoi." : copied === "fail" ? `Copia a mano: ${shareText}` : ""}
      </p>
    </div>
  );
}
