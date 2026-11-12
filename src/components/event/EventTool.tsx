import type { CSSProperties, ReactNode } from "react";
import { splitEventName } from "@/lib/event/looks";
import "./event-show.css";
import "./event-look-a.css";
import "./event-tools.css";

/*
  Pezzi comuni di regia e pannello del mod (11/11/2026, Pierluigi sulla Locandina: "seguendo lo stile della prima
  rifammi anche le altre due"): le due pagine di lavoro dell'evento hanno la stessa grafica della pagina pubblica
  (testata a manifesto con il nome dell'evento, numeri a contorno, pannelli con l'ombra piena), più raccolta perché
  sono strumenti. Stili in event-tools.css, appesi alle classi `ev ev--a ev-tool`.
*/

/** Guscio per i messaggi a pagina vuota ("Carico la regia…", link non valido). */
export function ToolShell({ children }: { children: ReactNode }) {
  return (
    <div className="ev ev--a ev-tool">
      <div className="ev-wrap ev-tool-msg">{children}</div>
    </div>
  );
}

/** Testata: la riga piccola dice che pagina è (e per chi), il titolo è il nome dell'evento come sul manifesto. */
export function ToolHero({ kicker, aside, name, children }: { kicker: string; aside?: string; name: string; children?: ReactNode }) {
  const [first, tail] = splitEventName(name);
  return (
    <header className="ev-hero">
      <div className="ev-wrap ev-hero-in">
        <p className="ev-kicker">
          <i aria-hidden />
          <span>{kicker}</span>
          {aside ? <span className="ev-kicker-live">{aside}</span> : null}
        </p>
        <div className="ev-title-row">
          <h1 className="ev-title" style={{ "--ev-len": Math.max(first.length, Math.ceil(tail.length * 0.45), 5) } as CSSProperties}>
            <span className="ev-title-1">{first}</span>
            {tail ? (
              <>
                {" "}
                <span className="ev-title-2">{tail}</span>
              </>
            ) : null}
          </h1>
        </div>
        {children}
      </div>
    </header>
  );
}

/** Titolo di un pannello: numero a contorno (solo dove l'ordine è quello della serata), riga piccola, titolo. */
export function ToolHead({ id, n, k, children }: { id: string; n?: string; k: string; children: ReactNode }) {
  return (
    <div className="ev-head">
      {n ? (
        <span className="ev-head-n" aria-hidden>
          {n}
        </span>
      ) : null}
      <div className="ev-head-t">
        <p className="ev-head-k">{k}</p>
        <h2 id={id} className="ev-h2">
          {children}
        </h2>
      </div>
    </div>
  );
}
