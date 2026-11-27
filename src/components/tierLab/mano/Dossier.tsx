import type { LabLegendary, LabMatchup, LabTierOrNone } from "@/lib/tierLab/types";
import { avg, bestWorst, changeKind, num, pct, tierLetter, tierName, tierReason } from "./text";

/**
 * Il fascicolo di una Leggendaria («La mano del meta»): il retro della carta nell'ispezione e, uguale, il testo
 * nell'HTML del server (archivio in fondo alla pagina). Componente puro, senza stato: lo usano server e browser.
 */

export type DossierPeer = { name: string; thumb?: string; href: string };

export type DossierCtx = {
  locale: string;
  /** "9 novembre": il giorno delle fasce pubblicate */
  readDay: string;
  officialPatch: string;
  /** le patch del Tracker, dalla più vecchia, con il giorno già scritto */
  patches: { id: string; day: string }[];
  peers: Record<string, DossierPeer>;
  trackerMissing: boolean;
  /** quante Leggendarie in tutto */
  total: number;
};

const STAT: Record<string, string> = { mana: "mana", power: "forza", health: "salute" };

/** Barra dell'intervallo al 95%: la scala va dal 20% all'80%, con le zone delle fasce e la linea del 50%. */
export function RateBar({ lo, hi, r, locale }: { lo: number; hi: number; r: number; locale: string }) {
  const min = 0.2;
  const span = 0.6;
  const x = (v: number) => `${(Math.min(Math.max((v - min) / span, 0), 1) * 100).toFixed(2)}%`;
  return (
    <div
      className="tlm-bar"
      role="img"
      aria-label={`Intervallo al 95% da ${pct(locale, lo)} a ${pct(locale, hi)}, win rate ${pct(locale, r)}`}
    >
      <div className="tlm-bar-track">
        <span className="tlm-bar-zone tlm-bar-zone--d" style={{ left: x(0.2), width: `calc(${x(0.4)} - ${x(0.2)})` }} />
        <span className="tlm-bar-zone tlm-bar-zone--c" style={{ left: x(0.4), width: `calc(${x(0.45)} - ${x(0.4)})` }} />
        <span className="tlm-bar-zone tlm-bar-zone--b" style={{ left: x(0.45), width: `calc(${x(0.5)} - ${x(0.45)})` }} />
        <span className="tlm-bar-zone tlm-bar-zone--a" style={{ left: x(0.5), width: `calc(${x(0.8)} - ${x(0.5)})` }} />
        <span className="tlm-bar-range" style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }} />
        <span className="tlm-bar-dot" style={{ left: x(r) }} />
        <span className="tlm-bar-half" style={{ left: x(0.5) }} />
      </div>
      <p className="tlm-bar-legend" aria-hidden="true">
        caso peggiore <b>{pct(locale, lo)}</b> · win rate <b>{pct(locale, r)}</b> · caso migliore <b>{pct(locale, hi)}</b>
      </p>
    </div>
  );
}

export function TierChip({ tier }: { tier: LabTierOrNone }) {
  return (
    <span className={`tlm-chip tlm-tone--${tier}`} aria-label={tierName(tier)}>
      {tierLetter(tier)}
    </span>
  );
}

function Matchups({ list, ctx, kind }: { list: LabMatchup[]; ctx: DossierCtx; kind: "beats" | "suffers" }) {
  if (!list.length) return <p className="tlm-file-empty">{kind === "beats" ? "Nessuno scontro vinto con margine." : "Nessuno scontro perso con margine."}</p>;
  return (
    <ul className="tlm-mu">
      {list.map((m) => {
        const p = ctx.peers[m.opponent];
        return (
          <li key={m.opponent} className="tlm-mu-row">
            {/* miniatura ufficiale da collezione, già piccola (160 px) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p?.thumb ? <img className="tlm-mu-thumb" src={p.thumb} alt="" width={30} height={42} loading="lazy" decoding="async" /> : <span className="tlm-mu-thumb" />}
            <span className="tlm-mu-name">{p?.name ?? m.opponent}</span>
            <span className="tlm-mu-num">
              <span className={kind === "beats" ? "is-good" : "is-bad"}>{pct(ctx.locale, m.r, 0)}</span> · {num(ctx.locale, m.games)} partite
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Dossier({ l, ctx, level = 2 }: { l: LabLegendary; ctx: DossierCtx; level?: 2 | 3 }) {
  const H = `h${level}` as "h2" | "h3";
  const H2 = `h${level + 1}` as "h3" | "h4";
  const o = l.official;
  const locale = ctx.locale;
  const officialDay = ctx.patches.find((p) => p.id === ctx.officialPatch)?.day;
  const { beats, suffers } = bestWorst(l.patches[ctx.officialPatch]?.matchups);
  const later = ctx.patches.filter((p) => p.id !== ctx.officialPatch);
  const laterIds = new Set(later.map((p) => p.id));
  const laterChanges = l.changes.filter((c) => laterIds.has(c.patch)).reverse();

  return (
    <div className="tlm-file">
      <div className="tlm-file-head">
        <H className="tlm-file-name">{l.name}</H>
        <span className={`tlm-stamp tlm-stamp--sm tlm-tone--${o.tier}`} aria-hidden="true">
          {tierLetter(o.tier)}
        </span>
      </div>
      <p className="tlm-file-tier">
        <strong>{tierName(o.tier)}</strong>
        {o.rank ? <> · {o.rank}ª su {ctx.total}</> : null}
      </p>
      {tierReason(locale, l).map((s) => (
        <p key={s} className="tlm-file-why">
          {s}
        </p>
      ))}
      <RateBar lo={o.rate.lo} hi={o.rate.hi} r={o.rate.r} locale={locale} />

      {ctx.trackerMissing ? (
        <p className="tlm-file-empty">Il Tracker oggi non risponde: scontri e numeri dopo il {ctx.readDay} tornano alla prossima lettura.</p>
      ) : (
        <>
          <div className="tlm-file-block">
            <div className="tlm-file-cols">
              <div>
                <H2 className="tlm-file-h">Batte</H2>
                <Matchups list={beats} ctx={ctx} kind="beats" />
              </div>
              <div>
                <H2 className="tlm-file-h">Soffre</H2>
                <Matchups list={suffers} ctx={ctx} kind="suffers" />
              </div>
            </div>
            {officialDay ? <p className="tlm-file-note">Scontri della patch del {officialDay}, la stessa delle fasce.</p> : null}
          </div>

          <div className="tlm-file-block">
            <H2 className="tlm-file-h">Dopo il {ctx.readDay}</H2>
            <p className="tlm-file-note">La regola applicata ai numeri di oggi, non pubblicata.</p>
            <ul className="tlm-after">
              {later.map((p) => {
                const s = l.patches[p.id];
                return (
                  <li key={p.id} className="tlm-after-row">
                    <span className="tlm-after-day">Patch del {p.day}</span>
                    {s ? (
                      <>
                        <TierChip tier={s.ruleTier} />
                        <span className="tlm-after-num">
                          {pct(locale, s.r)} · {num(locale, s.games)} partite
                        </span>
                      </>
                    ) : (
                      <span className="tlm-after-num">non giocata</span>
                    )}
                  </li>
                );
              })}
            </ul>
            {laterChanges.length ? (
              <ul className="tlm-changes">
                {laterChanges.map((c) => (
                  <li key={`${c.patch}-${c.note}`} className={`tlm-change is-${c.kind}`}>
                    <span className="tlm-change-kind">
                      {changeKind[c.kind]} · {c.patchLabel}
                    </span>
                    <span className="tlm-change-note">{c.note}</span>
                    {c.from && c.to ? (
                      <span className="tlm-change-stats">
                        {Object.keys(STAT)
                          .filter((k) => c.from?.[k as "mana"] !== undefined && c.to?.[k as "mana"] !== undefined && c.from[k as "mana"] !== c.to[k as "mana"])
                          .map((k) => `${STAT[k]} ${c.from?.[k as "mana"]} → ${c.to?.[k as "mana"]}`)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tlm-file-note">Nessuna modifica ufficiale alla carta dopo il {ctx.readDay}.</p>
            )}
          </div>
        </>
      )}

      <dl className="tlm-crowd">
        <div>
          <dt>La community</dt>
          <dd>{l.community ? <><TierChip tier={l.community.tier} /> media {avg(locale, l.community.avg)} su 5</> : "non ancora classificata"}</dd>
        </div>
        <div>
          <dt>I voti</dt>
          <dd>
            {l.votes ? (
              <>
                {l.votes.tier ? <TierChip tier={l.votes.tier} /> : null} media {avg(locale, l.votes.avg)} su 10
              </>
            ) : (
              "ancora nessun voto"
            )}
          </dd>
        </div>
      </dl>
      <p className="tlm-file-link">
        <a href={l.href}>La scheda di {l.name}</a>
      </p>
    </div>
  );
}
