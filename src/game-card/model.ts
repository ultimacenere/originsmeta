/**
 * La carta di Origins TCG come la mostra il gioco (13/11/2026: via libera di Koin Games alla grafica del gioco;
 * Pierluigi, lo stesso giorno: "le carte sul sito, sul tracker e sull'overlay devono risultare identiche a quelle in
 * gioco"). Un solo modello per tre posti:
 *
 * - il sito (src/components/GameCard.tsx) lo disegna con React;
 * - l'app OriginsMeta Tracker e l'estensione Twitch lo disegnano nel DOM con ./dom.ts (per l'estensione compilato in
 *   twitch-extension/game/card.js da tracker/scripts/twitch-panels.mjs);
 * - l'aspetto sta in ./theme.css (font e colori, l'unico file da toccare quando Koin manda i suoi asset) e ./card.css.
 *
 * Qui solo funzioni pure: dai dati della carta a un albero di nodi (tag, classi, testo, attributi). Niente HTML in
 * ingresso: i testi diventano sempre nodi di testo.
 */

export type GameCardLang = "en" | "it" | "es" | "fr" | "pt" | "de" | "ru" | "zh-cn";

export type GameCardInput = {
  /** per gli id dei gradienti SVG: lo slug della carta */
  slug: string;
  name: string;
  type: "unit" | "spell" | "token";
  cost: number | null;
  power: number | null;
  health: number | null;
  legendary: boolean;
  alignment: "good" | "evil" | "neutral" | null;
  /** testo dell'abilità nella lingua della carta (righe separate da \n) */
  text: string;
  /** indirizzo della sola finestra d'arte (/cards/art/<slug>.webp) o null */
  art: string | null;
};

/** Un nodo dell'albero: elemento HTML, elemento SVG (`svg: true`) o testo (`text` senza `tag`). */
export type GcNode = {
  tag?: string;
  svg?: boolean;
  cls?: string;
  text?: string;
  attrs?: Record<string, string>;
  /** proprietà CSS (i colori del tema nell'SVG: var(--omg-…) non vale come attributo) */
  style?: Record<string, string>;
  kids?: GcNode[];
};

/** Nome dell'allineamento sulla fascia, come lo scrive il gioco (glossari in docs/; il gioco non mostra Neutral). */
export const ALIGN_LABEL: Record<GameCardLang, { good: string; evil: string }> = {
  en: { good: "Good", evil: "Evil" },
  it: { good: "Buono", evil: "Malvagio" },
  es: { good: "Bueno", evil: "Malvado" },
  fr: { good: "Bon", evil: "Mauvais" },
  pt: { good: "Bom", evil: "Maligno" },
  de: { good: "Gut", evil: "Böse" },
  ru: { good: "Добрый", evil: "Злой" },
  "zh-cn": { good: "善良", evil: "邪恶" },
};

/**
 * Parole chiave in grassetto, nelle lingue del gioco (glossari in docs/testi-di-gioco.md, francese.md, portoghese.md,
 * tedesco.md, russo.md, cinese.md). Il russo declina anche le parole chiave: ci sono le forme più comuni, cercate come
 * parole intere; il cinese senza confini di parola.
 */
const KEYWORDS = [
  ...["On Reveal", "On Death", "On Kill", "Ongoing", "First Strike", "Double Attack", "Deathtouch", "Defender", "Discard", "Rebirth"],
  ...["Shield", "Snipe", "Stun", "Summon", "Trample", "Vanilla", "Relentless"],
  ...["Alla rivelazione", "Alla morte", "All'uccisione", "Primo colpo", "Doppio attacco", "Tocco letale", "Difensore", "Rinascita"],
  ...["Scudo", "Tiro di precisione", "Stordisci", "Travolgere"],
  ...["Al revelar", "Al morir", "Al matar", "Primer golpe", "Ataque doble", "Toque mortal", "Defensor", "Renacer", "Escudo"],
  ...["Disparo certero", "Aturde", "Arrollar"],
  ...["À la révélation", "À la mort", "À l'élimination", "Première frappe", "Double attaque", "Contact mortel", "Défenseur", "Renaissance"],
  ...["Bouclier", "Tir de précision", "Étourdissez", "Piétinement"],
  ...["Ao revelar", "Ao morrer", "Ao matar", "Primeiro golpe", "Ataque duplo", "Toque mortífero", "Renascimento"],
  ...["Tiro certeiro", "Atordoa", "Atropelar"],
  ...["Beim Aufdecken", "Bei Tod", "Bei Vernichtung", "Erstschlag", "Doppelangriff", "Todesberührung", "Verteidiger", "Wiedergeburt"],
  ...["Schild", "Präzisionsschuss", "Betäube", "Überrennen"],
];
const KEYWORDS_RU = [
  ...["При раскрытии", "При смерти", "При убийстве", "Первый удар", "Первым ударом", "Первого удара"],
  ...["Двойная атака", "Двойную атаку", "Двойной атакой", "Двойной атаки"],
  ...["Смертельное касание", "Смертельным касанием", "Смертельного касания", "Защитник", "Защитника", "Защитником"],
  ...["Возрождение", "Возрождением", "Возрождения", "Щит", "Щита", "Щитом"],
  ...["Пробивной удар", "Пробивным ударом", "Пробивного удара"],
  ...["Меткий выстрел", "Метким выстрелом", "Меткого выстрела", "Оглушает", "Оглушение", "Оглушения"],
];
const KEYWORDS_ZH = ["展示时", "揭示时", "死亡时", "击杀时", "先攻", "连击", "双重攻击", "死触", "守护者", "守卫", "重生", "护盾", "践踏", "狙击", "眩晕", "持续"];

const escRe = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const longFirst = (a: string, b: string) => b.length - a.length;
const KW = [
  ...[...KEYWORDS].sort(longFirst).map(escRe),
  `(?<![А-ЯЁа-яё])(?:${[...KEYWORDS_RU].sort(longFirst).map(escRe).join("|")})(?![А-ЯЁа-яё])`,
  ...[...KEYWORDS_ZH].sort(longFirst).map(escRe),
].join("|");

const ATK = "(?:⚔️|⚔)";
const HP = "(?:❤️|❤|♥)";
const DAMAGE = "(?:damage|danni|danno|de daño|de dano|dégâts|dégât|Schaden)";
const ANY = "\\bANY\\b|\\bQUALSIASI\\b|\\bCUALQUIER\\b|\\bQUALQUER\\b|\\bBELIEBIGE[NMRS]?\\b|N'IMPORTE QUELLE?|(?<![А-ЯЁа-яё])ЛЮБ(?:ОЙ|УЮ|ОЕ|ОГО|ОМУ|ОМ|ЫЕ|ЫХ|ЫМ|ЫМИ)(?![А-ЯЁа-яё])|任意";
const HEAL = "\\b(?:[Hh]eal|[Cc]ura|[Ss]oignez|[Ss]oigne|[Hh]eilt?|[Cc]ure) \\d+\\b";

/** "[6⚔/6♥]" e "+1⚔/+1♥" (una riga sola con le icone), parole chiave, numeri con icona, danni, cure, "qualsiasi". */
const TOKEN = new RegExp(
  `(\\[[+-]?\\d+ ?${ATK}/[+-]?\\d+ ?${HP}\\]|[+-]?\\d+ ?${ATK}/[+-]?\\d+ ?${HP}` +
    `|(?:${KW}):?` +
    `|[+-]?\\d+ ?(?:${ATK}|${HP})` +
    `|\\b\\d+ ${DAMAGE}\\b|\\b\\d+ (?:ед\\. )?урона?(?![А-ЯЁа-яё])|\\d+ ?点伤害` +
    `|${HEAL}|${ANY}|${ATK}|${HP})`,
  "g",
);

const el = (tag: string, cls?: string, kids?: GcNode[], extra?: Partial<GcNode>): GcNode => ({ tag, cls, kids, ...extra });
const txt = (text: string): GcNode => ({ text });
const svgEl = (tag: string, attrs: Record<string, string>, style?: Record<string, string>, kids?: GcNode[]): GcNode => ({ tag, svg: true, attrs, style, kids });

/** Le icone nel testo: la spada d'oro e il cuore rosso. */
function icon(kind: "atk" | "hp"): GcNode {
  return svgEl("svg", { class: `omg-ico omg-ico--${kind}`, viewBox: kind === "atk" ? "0 0 40 72" : "0 0 60 52", "aria-hidden": "true" }, undefined, [
    svgEl("path", {
      d: kind === "atk" ? "M20 1 L31 13 L31 46 L9 46 L9 13 Z M1.5 45 H38.5 V54 H1.5 Z M14.5 53 H25.5 V65 H14.5 Z" : "M30 50 C22 42 4 31 4 17 C4 8 11 3 18 3 C24 3 28 7 30 11 C32 7 36 3 42 3 C49 3 56 8 56 17 C56 31 38 42 30 50 Z",
    }),
  ]);
}

/** Il testo dell'abilità con le evidenziazioni del gioco: un paragrafo per riga. */
export function abilityNodes(text: string): GcNode[] {
  return String(text || "")
    .split("\n")
    .map((line) => {
      const kids: GcNode[] = [];
      line.split(TOKEN).forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 0) {
          kids.push(txt(part));
          return;
        }
        const pair = part.match(new RegExp(`^(\\[?)([+-]?\\d+) ?${ATK}/([+-]?\\d+) ?${HP}(\\]?)$`));
        if (pair) {
          kids.push(el("span", "omg-nowrap", [txt(pair[1] + pair[2]), icon("atk"), txt("/" + pair[3]), icon("hp"), ...(pair[4] ? [txt(pair[4])] : [])]));
          return;
        }
        const one = part.match(new RegExp(`^([+-]?\\d+) ?(${ATK}|${HP})$`));
        if (one) {
          kids.push(el("span", "omg-nowrap", [txt(one[1]), icon(/⚔/.test(one[2]) ? "atk" : "hp")]));
          return;
        }
        if (new RegExp(`^${ATK}$`).test(part)) return void kids.push(icon("atk"));
        if (new RegExp(`^${HP}$`).test(part)) return void kids.push(icon("hp"));
        if (new RegExp(`^(?:${ANY})$`).test(part)) return void kids.push(el("i", "omg-any", [txt(part)]));
        if (new RegExp(`^${HEAL}$`).test(part)) return void kids.push(el("b", "omg-heal", [txt(part)]));
        if (/^\d/.test(part)) return void kids.push(el("b", "omg-dmg", [txt(part)]));
        kids.push(el("b", "omg-kw", [txt(part)]));
      });
      return el("p", undefined, kids);
    });
}

/** Misura del testo: le soglie in caratteri (il DOM poi rimpicciolisce ancora se serve, dom.ts `fit`). */
export function textSize(text: string): "" | "is-long" | "is-xlong" | "is-xxlong" {
  const n = String(text || "").length;
  return n > 160 ? "is-xxlong" : n > 115 ? "is-xlong" : n > 80 ? "is-long" : "";
}
export function nameSize(name: string): "" | "is-long" | "is-xlong" {
  return name.length > 19 ? "is-xlong" : name.length > 14 ? "is-long" : "";
}

const idOf = (slug: string, part: string) => `omg-${slug.replace(/[^a-z0-9-]/g, "")}-${part}`;
const stop = (offset: string, color: string) => svgEl("stop", { offset }, { "stop-color": color });
function grad(id: string, colors: [string, string, string]): GcNode {
  return svgEl("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, undefined, [stop("0", colors[0]), stop("0.5", colors[1]), stop("1", colors[2])]);
}

/** L'esagono del mana, con le ali d'oro per le Leggendarie come nel gioco. */
function gem(c: GameCardInput): GcNode {
  const id = idOf(c.slug, c.legendary ? "gold" : "gem");
  const w = c.legendary ? 212 : 100;
  const cx = w / 2;
  const hex = (r: number, ry: number) =>
    [[0, -ry], [r, -ry / 2], [r, ry / 2], [0, ry], [-r, ry / 2], [-r, -ry / 2]].map(([x, y]) => `${(cx + x).toFixed(1)},${(54 + y).toFixed(1)}`).join(" ");
  const ring = { fill: `url(#${id})` };
  const edge = { stroke: "var(--omg-shadow)" };
  const kids: GcNode[] = [
    svgEl("defs", {}, undefined, [
      grad(id, c.legendary ? ["var(--omg-gem-gold-hi)", "var(--omg-gem-gold)", "var(--omg-gem-gold-lo)"] : ["var(--omg-gem-ring-hi)", "var(--omg-gem-ring)", "var(--omg-gem-ring-lo)"]),
    ]),
  ];
  if (c.legendary) {
    for (const side of [-1, 1])
      [[0, 0], [8, 15], [14, 30]].forEach(([dx, dy], i) => {
        const x0 = cx + side * 40;
        const x1 = cx + side * (98 - dx);
        const y0 = 30 + dy;
        kids.push(svgEl("path", { d: `M${x0},${y0 + 18} L${x1},${y0 - 8 + i * 2} L${x1 - side * 10},${y0 + 10} L${x0},${y0 + 30} Z`, ...ring, "stroke-width": "4", "stroke-linejoin": "round" }, edge));
      });
  }
  kids.push(svgEl("polygon", { points: hex(46, 52), ...ring, "stroke-width": "4", "stroke-linejoin": "round" }, edge));
  kids.push(svgEl("polygon", { points: hex(35, 40), "stroke-width": "2" }, { fill: "var(--omg-gem-fill)", stroke: "rgba(0,0,0,.45)" }));
  return el("span", "omg-gem", [svgEl("svg", { viewBox: `0 0 ${w} 108`, preserveAspectRatio: "xMidYMid meet" }, undefined, kids), el("span", "omg-gem-num", [txt(c.cost === null ? "–" : String(c.cost))])], { attrs: { "aria-hidden": "true" } });
}

function sword(slug: string): GcNode {
  const id = idOf(slug, "atk");
  const a = { fill: `url(#${id})`, class: "omg-stat-fill", "stroke-width": "3.2" };
  return svgEl("svg", { class: "omg-sword", viewBox: "0 0 40 72", "aria-hidden": "true" }, undefined, [
    svgEl("defs", {}, undefined, [grad(id, ["var(--omg-stat-hi)", "var(--omg-stat)", "var(--omg-stat-lo)"])]),
    svgEl("path", { d: "M20 1 L31 13 L31 46 L9 46 L9 13 Z", ...a }),
    svgEl("path", { d: "M20 9 L20 43", "stroke-width": "2.4", "stroke-linecap": "round" }, { stroke: "rgba(255,255,255,.55)" }),
    svgEl("rect", { x: "1.5", y: "45", width: "37", height: "9", rx: "3", ...a }),
    svgEl("rect", { x: "14.5", y: "53", width: "11", height: "12", rx: "2", ...a }),
    svgEl("circle", { cx: "20", cy: "67", r: "5", ...a }),
  ]);
}
function heart(slug: string): GcNode {
  const id = idOf(slug, "hp");
  return svgEl("svg", { class: "omg-heart", viewBox: "0 0 60 52", "aria-hidden": "true" }, undefined, [
    svgEl("defs", {}, undefined, [grad(id, ["var(--omg-stat-hi)", "var(--omg-stat)", "var(--omg-stat-lo)"])]),
    svgEl("path", { d: "M30 50 C22 42 4 31 4 17 C4 8 11 3 18 3 C24 3 28 7 30 11 C32 7 36 3 42 3 C49 3 56 8 56 17 C56 31 38 42 30 50 Z", fill: `url(#${id})`, class: "omg-stat-fill", "stroke-width": "3.4" }),
    svgEl("path", { d: "M11 15 C11 11 14 8 19 8", fill: "none", "stroke-width": "2.6", "stroke-linecap": "round" }, { stroke: "rgba(255,255,255,.6)" }),
  ]);
}
const num = (v: number | null) => el("span", "omg-num", [txt(v === null ? "–" : String(v))]);

/** La carta intera: `className` in più sul contenitore (il sito ci aggiunge le sue classi). */
export function gameCardTree(c: GameCardInput, lang: GameCardLang, className = ""): GcNode {
  const spell = c.type === "spell";
  const body: GcNode[] = [
    el("div", "omg-art" + (c.art ? "" : " is-noimg"), c.art ? [el("img", undefined, undefined, { attrs: { src: c.art, alt: "", decoding: "async", loading: "lazy", draggable: "false" } })] : []),
    el("div", "omg-plate"),
    el("p", ("omg-name " + nameSize(c.name)).trim(), [txt(c.name)]),
  ];
  if (!spell && (c.alignment === "good" || c.alignment === "evil")) {
    body.push(el("p", "omg-band", [txt(ALIGN_LABEL[lang][c.alignment])], { attrs: { "data-align": c.alignment } }));
  } else {
    // magie e personaggi neutrali: la riga a trattini (il gioco non scrive Neutral)
    body.push(el("span", "omg-dash" + (spell ? "" : " is-neutral")));
  }
  body.push(el("div", ("omg-text " + textSize(c.text)).trim(), abilityNodes(c.text)));
  const kids: GcNode[] = [el("div", "omg-frame"), el("div", "omg-body", body)];
  if (!spell && (c.power !== null || c.health !== null)) {
    kids.push(el("div", "omg-stats", [el("span", "omg-stat", [num(c.power), sword(c.slug)]), el("span", "omg-stat", [heart(c.slug), num(c.health)])]));
  }
  kids.push(gem(c));
  return el("div", `omg-card omg-card--${spell ? "spell" : "unit"}${c.legendary ? " is-leg" : ""}${className ? " " + className : ""}`, kids, { attrs: { lang } });
}

/** Il testo per i lettori di schermo (gemma, spada e cuore sono disegni). */
export function gameCardLabel(c: GameCardInput, words: { cost: string; power: string; health: string }): string {
  const out = [c.name];
  if (c.cost !== null) out.push(`${words.cost} ${c.cost}`);
  if (c.power !== null) out.push(`${words.power} ${c.power}`);
  if (c.health !== null) out.push(`${words.health} ${c.health}`);
  return out.join(", ");
}
