import Link from "next/link";

/*
  Una partita del tabellone dei playoff della Crimson Cup (25/10/2026), uguale nella pagina (server) e nell'esploratore
  (client): due righe con nome e punteggio, il vincitore in verde, chi perde in grigio, la partita aperta con la cornice
  menta, quella da definire tratteggiata. Accanto al nome il segno OriginsMeta per i creator del sito (link al profilo).
  Stili `.po-*` in fondo a globals.css.
*/

/** [id, lato (0 vincenti, 1 perdenti, 2 gran finale), turno, a, b, sa, sb, vincitore], 0 = nessuno (come `compact`). */
export type PoTuple = [number, 0 | 1 | 2, number, number, number, number, number, number];
export type PoNames = Record<number, string>;
/** posto → nome utente su OriginsMeta (solo creator, autori, pro e staff) */
export type PoOm = Record<number, string>;
export type PoMarkText = { label: string; title: string; userBase: string };

export function OmMark({ username, name, mark }: { username: string; name: string; mark: PoMarkText }) {
  const title = mark.title.replace("{name}", name);
  return (
    <Link href={`${mark.userBase}${username}`} prefetch={false} className="po-om" title={title} aria-label={title}>
      {mark.label}
    </Link>
  );
}

export function PlayerName({ seat, names, om, mark }: { seat: number; names: PoNames; om: PoOm; mark: PoMarkText }) {
  const name = names[seat] ?? "?";
  const u = om[seat];
  return (
    <span className="po-name">
      <span className="po-name-text">{name}</span>
      {u ? <OmMark username={u} name={name} mark={mark} /> : null}
    </span>
  );
}

export function PlayoffMatchCard({
  m,
  names,
  om,
  mark,
  label,
  highlight,
  tbd,
  as = "li",
}: {
  m: PoTuple;
  names: PoNames;
  om: PoOm;
  mark: PoMarkText;
  label?: string;
  highlight?: number | null;
  tbd: string;
  as?: "li" | "div";
}) {
  const [id, , , a, b, sa, sb, w] = m;
  const open = w === 0 && a !== 0 && b !== 0;
  const mine = Boolean(highlight) && (a === highlight || b === highlight);
  const row = (seat: number, score: number) => {
    const cls = w === 0 ? "" : w === seat ? " is-win" : " is-lose";
    return (
      <p className={`po-row${cls}${mine && seat === highlight ? " is-me" : ""}`}>
        {seat ? <PlayerName seat={seat} names={names} om={om} mark={mark} /> : <span className="po-name-text an-muted">{tbd}</span>}
        <span className="po-score">{w === 0 && !open ? "" : w === 0 ? "–" : score}</span>
      </p>
    );
  };
  const Tag = as;
  return (
    <Tag className={`po-match${open ? " is-open" : ""}${mine ? " is-mine" : ""}`}>
      <p className="po-match-head">
        <span>{label ?? ""}</span>
        <span>#{id}</span>
      </p>
      {row(a, sa)}
      <div className="po-sep" aria-hidden="true" />
      {row(b, sb)}
    </Tag>
  );
}

/** Una partita ancora da definire (nessuno dei due giocatori noto). */
export function PlayoffTbdCard({ text, as = "li" }: { text: string; as?: "li" | "div" }) {
  const Tag = as;
  return (
    <Tag className="po-match is-tbd">
      <p className="po-row">
        <span className="po-name-text an-muted">{text}</span>
      </p>
      <div className="po-sep" aria-hidden="true" />
      <p className="po-row">
        <span className="po-name-text an-muted">{text}</span>
      </p>
    </Tag>
  );
}
