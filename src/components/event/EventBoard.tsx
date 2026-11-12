"use client";

import Link from "next/link";
import { deckByPlayer, deckByPlayerAt, drawOf, lastRound, playersOf, spinsOfDraw } from "@/lib/event/engine";
import { pct, standings } from "@/lib/event/swiss";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { twitchUrl } from "@/lib/event/codes";
import { isHidden, type PublicTalent, type Talent, type TalentRole } from "@/lib/event/types";
import { talentOfRole } from "@/lib/event/view";
import { trackNamedEvent } from "@/lib/analytics";
import { FaceImg, faceOf, useEventData, useFaces, type LiveEvent } from "./EventLive";

/**
 * Sezioni della pagina di un evento che cambiano durante la diretta (10/11/2026): chi gioca (con il bollino LIVE),
 * i giocatori di ogni mazzo dopo la ruota, la classifica svizzera e gli abbinamenti. Tutte leggono gli stessi dati in
 * diretta (EventLiveProvider), arrivati con l'HTML della pagina e riletti ogni 10 secondi.
 */

const revealFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

function revealText(iso?: string): string {
  if (!iso) return L.talent.revealSoon;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? L.talent.revealSoon : fillEvent(L.talent.revealAt, { date: revealFmt.format(t) });
}

function TalentCard({ t, data }: { t: PublicTalent; data: LiveEvent }) {
  if (isHidden(t)) {
    return (
      <li className="ev-talent is-hidden card-night flex min-w-0 items-center gap-3 p-3" aria-label={L.talent.hidden}>
        <span aria-hidden className="ev-face ev-face--hidden h-16 w-16 shrink-0 rounded-full border-2 border-sky bg-[radial-gradient(circle_at_50%_38%,var(--color-pale-muted)_0_22%,transparent_23%),radial-gradient(ellipse_at_50%_100%,var(--color-pale-muted)_0_45%,transparent_46%)] bg-night-3 opacity-60 blur-[2px]" />
        <div className="ev-talent-info min-w-0">
          <p className="ev-talent-name font-display text-base font-bold text-pale-muted blur-[3px] select-none" aria-hidden>
            ??????????
          </p>
          <p className="text-sm text-pale">{L.talent.hidden}</p>
          <p className="text-xs text-pale-muted">{revealText(t.revealAt)}</p>
        </div>
      </li>
    );
  }
  const face = faceOf(t, data.avatars, data.live, t.name);
  return (
    <li className={`ev-talent card-night flex min-w-0 flex-col gap-2 p-3${face.live ? " is-live" : ""}`}>
      <div className="ev-talent-top flex min-w-0 items-center gap-3">
        <FaceImg face={face} size={64} className="ev-face" />
        <div className="ev-talent-info min-w-0">
          <p className="ev-talent-name truncate font-display text-base font-bold text-sky">{t.name}</p>
          {face.live && t.twitch ? (
            <a
              href={twitchUrl(t.twitch)}
              target="_blank"
              rel="noopener noreferrer"
              className="live-badge mt-1 px-2 py-1 text-[10px]"
              onClick={() => trackNamedEvent("event_channel_click", { placement: "talent", channel: t.twitch ?? "" })}
            >
              <span className="live-dot" aria-hidden />
              {L.talent.live}
            </a>
          ) : t.twitch ? (
            <a href={twitchUrl(t.twitch)} target="_blank" rel="noopener noreferrer" className="ev-talent-link link-mint text-xs">
              twitch.tv/{t.twitch}
            </a>
          ) : null}
        </div>
      </div>
      {t.bio ? <p className="ev-talent-bio whitespace-pre-line text-sm text-pale">{t.bio}</p> : null}
      {t.links?.length || t.user ? (
        <ul className="ev-talent-links flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {t.user ? (
            <li>
              <Link href={`/it/u/${t.user}`} className="link-mint">
                {L.talent.profile}
              </Link>
            </li>
          ) : null}
          {t.links?.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="link-mint">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

const GROUPS: { role: TalentRole; title: string }[] = [
  { role: "host", title: L.talent.host },
  { role: "caster", title: L.talent.casters },
  { role: "player", title: L.talent.players },
  { role: "guest", title: L.talent.guests },
];

export function TalentSection() {
  const data = useEventData();
  const any = data.config.talent.length > 0;
  return (
    <div className="space-y-6">
      {!any ? <p className="ev-empty text-pale">{L.talent.empty}</p> : null}
      {GROUPS.map(({ role, title }) => {
        const list = talentOfRole(data.config.talent, role);
        if (!list.length) return null;
        return (
          <div key={role} className={`ev-group ev-group--${role}`}>
            <h3 className="ev-group-title t-item text-chalk">{title}</h3>
            <ul className={`ev-talent-grid mt-3 grid grid-cols-1 gap-3 ${role === "player" || role === "guest" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
              {list.map((t) => (
                <TalentCard key={t.id} t={t} data={data} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Le facce dei giocatori nella testata (prove di grafica dell'11/11/2026): ognuna porta al canale Twitch; chi non è
 * ancora svelato è un "?". `--i` e `--n` servono alle animazioni a turno (il cursore dell'arcade).
 */
export function HeroCast({ label }: { label: string }) {
  const data = useEventData();
  const players = talentOfRole(data.config.talent, "player");
  if (!players.length) return null;
  return (
    <div className="ev-cast">
      <p className="ev-cast-label">{label}</p>
      <ul className="ev-cast-list" style={{ "--n": players.length } as React.CSSProperties}>
        {players.map((t, i) => {
          const f = faceOf(t, data.avatars, data.live, L.talent.hidden);
          const img = <FaceImg face={f} size={56} className="ev-face" />;
          return (
            <li key={`${t.id}-${i}`} className={`ev-cast-item${f.hidden ? " is-hidden" : ""}${f.live ? " is-live" : ""}`} style={{ "--i": i } as React.CSSProperties} title={f.name}>
              {f.twitch ? (
                <a
                  href={twitchUrl(f.twitch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={fillEvent(L.hero.onTwitch, { name: f.name })}
                  onClick={() => trackNamedEvent("event_channel_click", { placement: "hero", channel: f.twitch ?? "" })}
                >
                  {img}
                </a>
              ) : (
                <span role="img" aria-label={f.name}>
                  {img}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * I giocatori di un mazzo (dopo la ruota), nella striscia del mazzo scritta dal server: due foto piccole e i nomi, o
 * "Da assegnare con la ruota" prima del giro. Con più estrazioni conta quella in corso: quando i caster ne aprono una
 * nuova i mazzi tornano "da assegnare" e si riempiono a ogni giro.
 */
export function DeckFaces({ deck }: { deck: string }) {
  const data = useEventData();
  const face = useFaces();
  const a = spinsOfDraw(data.state, drawOf(data.state)).find((x) => x.deck === deck);
  if (!a) return <span className="ev-deck-wait block truncate text-xs text-pale-muted">{L.decks.toAssign}</span>;
  const faces = a.players.map((p) => face(p));
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="flex shrink-0 -space-x-1.5">
        {faces.map((f, i) => (
          // un giocatore ancora da svelare arriva come "hidden-<n>": la chiave tiene anche la posizione
          <FaceImg key={`${f.id}-${i}`} face={f} size={22} />
        ))}
      </span>
      <span className="truncate text-xs text-pale">{faces.map((f) => f.name).join(" · ")}</span>
    </span>
  );
}

/** Dalla seconda estrazione: quale estrazione è in corso e la regola del mazzo sempre nuovo. */
export function DrawNote() {
  const data = useEventData();
  const draw = drawOf(data.state);
  if (draw < 2) return null;
  return (
    <p className="ev-note ev-draw-note mt-3 text-sm text-pale-muted">
      <b className="text-gold">{fillEvent(L.decks.draw, { n: draw })}</b> · {L.decks.redraw}
    </p>
  );
}

function DeckDot({ color, name }: { color: string | undefined; name: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border border-chalk/40" style={{ background: color ?? "transparent" }} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function StandingsTable() {
  const data = useEventData();
  const face = useFaces();
  const players = playersOf({ talent: data.config.talent.filter((t): t is Talent => !isHidden(t)) }).map((p) => p.id);
  const decks = deckByPlayer(data.state);
  const deckOf = new Map(data.config.decks.map((d) => [d.id, d]));
  if (!data.state.matches.length || !players.length) return <p className="ev-empty text-pale">{L.standings.empty}</p>;
  const rows = standings(players, data.state.matches);
  return (
    <div className="ev-standings overflow-x-auto rounded-xl border-2 border-sky">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="bg-night-3 text-xs uppercase tracking-wider text-pale-muted">
          <tr>
            <th className="px-3 py-2">{L.standings.rank}</th>
            <th className="px-3 py-2">{L.standings.player}</th>
            <th className="px-3 py-2">{L.standings.deck}</th>
            <th className="px-3 py-2 text-right" title={L.standings.winsLong}>
              {L.standings.wins}
            </th>
            <th className="px-3 py-2 text-right" title={L.standings.lossesLong}>
              {L.standings.losses}
            </th>
            <th className="px-3 py-2 text-right">{L.standings.points}</th>
            <th className="px-3 py-2 text-right">{L.standings.omw}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const f = face(r.player);
            const d = deckOf.get(decks.get(r.player) ?? "");
            return (
              <tr key={r.player} data-rank={r.rank} className="border-t border-night-3 bg-night/60">
                <td className="px-3 py-2 font-mono text-pale-muted">{r.rank}</td>
                <td className="px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <FaceImg face={f} size={28} />
                    <span className="truncate font-display font-bold text-sky">{f.name}</span>
                  </span>
                </td>
                <td className="max-w-[10rem] px-3 py-2 text-pale">{d ? <DeckDot color={d.color} name={d.name} /> : "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-chalk">{r.wins}</td>
                <td className="px-3 py-2 text-right font-mono text-chalk">{r.losses}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-mint">{r.points}</td>
                <td className="px-3 py-2 text-right font-mono text-pale">{r.played ? `${pct(r.omw)}%` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PairingsList() {
  const data = useEventData();
  const face = useFaces();
  const deckOf = new Map(data.config.decks.map((d) => [d.id, d]));
  const last = lastRound(data.state);
  if (!last) return <p className="ev-empty text-pale">{L.pairings.empty}</p>;
  const rounds = Array.from({ length: last }, (_, i) => last - i);
  // con più estrazioni ogni turno mostra il mazzo che il giocatore aveva in quel turno
  const decksAt = new Map(rounds.map((r) => [r, deckByPlayerAt(data.state, r)]));
  const side = (id: string, won: boolean, round: number) => {
    const f = face(id);
    const d = deckOf.get(decksAt.get(round)?.get(id) ?? "");
    return (
      <div className={`ev-side flex min-w-0 flex-1 items-center gap-2 rounded-lg border-2 p-2 ${won ? "is-won border-mint bg-mint/10" : "border-night-3"}`}>
        <FaceImg face={f} size={32} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-sky">{f.name}</p>
          {d ? (
            <p className="text-xs text-pale-muted">
              <DeckDot color={d.color} name={d.name} />
            </p>
          ) : null}
        </div>
        {won ? <span className="ev-won ml-auto shrink-0 font-mono text-[11px] font-bold uppercase text-mint">{L.pairings.winner}</span> : null}
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <div key={round}>
          <h3 className="ev-round-title t-item text-chalk">{fillEvent(L.pairings.round, { n: round })}</h3>
          <ul className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.state.matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.table - b.table)
              .map((m) => (
                <li key={m.id} className={`ev-match card-night p-3${m.winner ? " is-done" : ""}`}>
                  <p className="ev-match-top mb-2 flex items-center justify-between text-xs text-pale-muted">
                    <span>{m.b ? fillEvent(L.pairings.table, { n: m.table }) : L.pairings.bye}</span>
                    {m.b && !m.winner ? <span className="ev-playing font-mono uppercase text-gold">{L.pairings.playing}</span> : null}
                  </p>
                  {m.b ? (
                    <div className="ev-match-row flex flex-col gap-2 sm:flex-row sm:items-center">
                      {side(m.a, m.winner === m.a, m.round)}
                      <span className="ev-vs text-center text-xs text-pale-muted">{L.pairings.vs}</span>
                      {side(m.b, m.winner === m.b, m.round)}
                    </div>
                  ) : (
                    side(m.a, true, m.round)
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
