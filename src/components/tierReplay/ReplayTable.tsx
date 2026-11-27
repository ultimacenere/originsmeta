import { fmtPct, gamesText, noun, type Replay } from "./frames";
import "./replay.css";

/**
 * La tabella Leggendaria × fotogramma, scritta dal server: fascia, win rate e partite. Serve a chi non vuole animazioni
 * e a chi legge l'HTML (motori di ricerca, assistenti).
 */
export function ReplayTable({ replay }: { replay: Replay }) {
  const { frames, cards, locale } = replay;
  const words = noun(replay);
  return (
    <div className="tlr-table-wrap">
      <table className="tlr-table">
        <caption className="sr-only">
          {replay.kind === "card" ? replay.l.table.captionCard : replay.l.table.captionLegendary}
        </caption>
        <thead>
          <tr>
            <th scope="col">{words.col}</th>
            {frames.map((f) => (
              <th key={f.key} scope="col">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.slug}>
              <th scope="row">
                <a href={c.href}>{c.name}</a>
              </th>
              {c.cells.map((cell, i) => (
                <td key={frames[i].key}>
                  <span className={`tlr-chip tlr-t-${cell.tier === "unranked" ? "n" : cell.tier}`}>
                    {cell.tier === "unranked" ? "–" : cell.tier}
                    {cell.tier === "unranked" ? <span className="sr-only">{replay.l.unrankedWord}</span> : null}
                  </span>{" "}
                  <span className="tlr-table-wr">{fmtPct(locale, cell.r)}</span>
                  {cell.games ? <span className="tlr-table-games"> · {gamesText(replay.l, locale, cell.games)}</span> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
