import { formatDateShort, type Locale } from "@/lib/i18n";
import type { Chapter } from "./logic";

/*
  Timbri di patch, come i timbri di un passaporto: uno per ogni patch vissuta, disegnati qui in SVG (niente materiale
  Koin). Pieno = in quella patch ha fatto qualcosa; vuoto = la patch c'era ma lui no. Inchiostro irregolare con un filtro
  SVG (turbolenza + spostamento + buchi), rotazione fissa ricavata dal nome della patch.
*/

const INKS = ["#31e3bd", "#3fc4e8"];

function hash(s: string): number {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Il nome della patch su due righe: "EA · 4 nov" → EA / 4 nov; "0.7" → 0.7 / la data. */
function lines(ch: Chapter, locale: Locale): [string, string] {
  const parts = ch.patch.label.split(" · ");
  if (parts.length === 2) return [parts[0], parts[1]];
  return [ch.patch.label, formatDateShort(locale, ch.patch.startDay)];
}

export function InkDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
      <defs>
        <filter id="patch-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="moved" />
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="9" result="grain" />
          <feComponentTransfer in="grain" result="holes">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 0.4 1 1 1 1" />
          </feComponentTransfer>
          <feComposite in="moved" in2="holes" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

export function Stamp({ ch, index, locale, size = 76 }: { ch: Chapter; index: number; locale: Locale; size?: number }) {
  const [top, bottom] = lines(ch, locale);
  const h = hash(ch.patch.id);
  const rot = (h % 19) - 9;
  const shape = h % 3;
  const ink = ch.stamped ? INKS[index % INKS.length] : "currentColor";
  const dash = ch.stamped ? undefined : "4 3";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`patch-stamp ${ch.stamped ? "is-full" : "is-empty"}`}
      style={{ rotate: `${rot}deg`, animationDelay: `${index * 70}ms` }}
    >
      <g filter={ch.stamped ? "url(#patch-ink)" : undefined} fill="none" stroke={ink} strokeDasharray={dash}>
        {shape === 0 ? (
          <>
            <circle cx="50" cy="50" r="44" strokeWidth="5" />
            <circle cx="50" cy="50" r="35" strokeWidth="2" />
          </>
        ) : shape === 1 ? (
          <>
            <rect x="7" y="17" width="86" height="66" rx="10" strokeWidth="5" />
            <rect x="15" y="25" width="70" height="50" rx="5" strokeWidth="2" />
          </>
        ) : (
          <>
            <polygon points="50,5 89,27 89,73 50,95 11,73 11,27" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" strokeWidth="2" strokeLinejoin="round" />
          </>
        )}
        <g fill={ink} stroke="none" textAnchor="middle" className="patch-stamp-text">
          <text x="50" y={bottom ? 50 : 57} fontSize={top.length > 4 ? 17 : 22} fontWeight="800">
            {top}
          </text>
          {bottom ? (
            <text x="50" y="67" fontSize="13" fontWeight="700">
              {bottom}
            </text>
          ) : null}
        </g>
      </g>
    </svg>
  );
}
