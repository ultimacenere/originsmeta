// Media kit di OriginsMeta per i creator (30/10/2026), scaricabile dalla pagina /for-creators.
// Richiesta di Dav (vocale del 29/10: un ragazzo che fa video e dirette con le nostre Analytics chiede "banner, loghi o
// altro da mettere sul mio stream o sui miei video") e di Pierluigi ("una landing page dedicata ai creators, con le
// spiegazioni dei nostri servizi, dei nostri tool ed infine un mediakit").
//
// Solo materiale di OriginsMeta, mai di Koin Games (il materiale Koin non si usa per l'identità del sito): la scritta del
// sito (public/media/logo-originsmeta.webp), il simbolo "OM." della foto del canale Twitch e del Discord (Montserrat
// Black, O gesso, M menta, punto rosa) e la palette del sito. Chrome o Edge headless disegnano ogni pagina HTML e ne
// salvano lo screenshot, come scripts/make-favicon.mjs e le grafiche del canale Twitch (60_Twitch sul Drive).
//
// Uso (i file si tengono nel repo, in public/media/creator-kit/; serve la rete per i font di Google):
//   node scripts/creator-kit.mjs
//   CHROME_PATH=<eseguibile> node scripts/creator-kit.mjs    se Chrome o Edge non stanno nei percorsi soliti
//
// La scritta esiste solo a 640 px (l'originale di Pierluigi era 1024 × 1024, ritagliato a 991 × 305 e mai messo nel
// repo): con un file più grande basta sostituire LOGO e rilanciare lo script.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "public/media/creator-kit");
const LOGO = path.join(root, "public/media/logo-originsmeta.webp");
const LOGO_SIZE = { w: 640, h: 197 };
const ZIP = "originsmeta-media-kit.zip";
const LOCALES = ["en", "it", "es", "fr", "pt", "de", "ru"];

const browser = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));
if (!browser) throw new Error("Chrome o Edge non trovati: CHROME_PATH=<eseguibile>");

/** I colori del sito (src/app/globals.css) e del simbolo "OM." (grafiche del canale Twitch). */
const C = {
  ink: "#05061a",
  felt: "#150c2c",
  chalk: "#e2e2e6",
  sub: "#b9c3d6",
  mint: "#31e3bd",
  sky: "#3fc4e8",
  pink: "#ff4da6",
};

// Barlow Semi Condensed non ha il cirillico: per il russo ripiega su Roboto Condensed.
const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Barlow+Semi+Condensed:wght@600;700&family=Roboto+Condensed:wght@600;700&display=block" rel="stylesheet">';

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent;overflow:hidden}
body{font-family:"Barlow Semi Condensed","Roboto Condensed",sans-serif;color:${C.chalk}}
.om{font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:-.01em;line-height:1;white-space:nowrap;display:inline-flex;align-items:baseline}
.om .o{color:${C.chalk}}
.om .m{color:${C.mint}}
.om .d{display:inline-block;border-radius:50%;background:${C.pink}}
.night{background:radial-gradient(120% 160% at 0% 0%, #163d52 0%, rgba(22,61,82,0) 60%),linear-gradient(135deg,#15193a,#22133a)}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.075) 1.1px,transparent 1.4px)}
`;

function om(size) {
  const dot = Math.round(size * 0.23);
  return `<span class="om" style="font-size:${size}px"><span class="o">O</span><span class="m">M</span><span class="d" style="width:${dot}px;height:${dot}px;margin-left:${Math.round(size * 0.04)}px"></span></span>`;
}

function page(body, css = "") {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

const logoUrl = pathToFileURL(LOGO).href;

/** Testi del badge per OBS e del pannello Twitch, una riga per lingua (corti: stanno in 480 e 232 px). */
const COPY = {
  en: { badge: "Decks & stats on", panel: "My decks", panelSub: "on originsmeta.com" },
  it: { badge: "Mazzi e statistiche su", panel: "I miei mazzi", panelSub: "su originsmeta.com" },
  es: { badge: "Mazos y estadísticas en", panel: "Mis mazos", panelSub: "en originsmeta.com" },
  fr: { badge: "Decks et statistiques sur", panel: "Mes decks", panelSub: "sur originsmeta.com" },
  pt: { badge: "Decks e estatísticas no", panel: "Meus decks", panelSub: "no originsmeta.com" },
  de: { badge: "Decks und Statistiken auf", panel: "Meine Decks", panelSub: "auf originsmeta.com" },
  ru: { badge: "Колоды и статистика на", panel: "Мои колоды", panelSub: "на originsmeta.com" },
};

/** Badge da mettere in un angolo della diretta o del video: 480 × 120 a schermo, disegnato al doppio (960 × 240). */
function badge(locale) {
  return page(
    `<div class="b night"><div class="dots"></div>
      <div class="sym">${om(46)}</div>
      <div class="txt"><div class="k">${COPY[locale].badge}</div><div class="u">originsmeta.com</div></div>
    </div>`,
    `.b{position:relative;width:480px;height:120px;border-radius:22px;border:3px solid ${C.sky};overflow:hidden;display:flex;align-items:center;gap:18px;padding:0 22px}
     .b .dots{background-size:16px 16px}
     .sym{position:relative;flex:none;width:118px;height:84px;border-radius:16px;border:2.5px solid ${C.mint};background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center}
     .txt{position:relative;min-width:0}
     .k{font-weight:700;font-size:16px;letter-spacing:.12em;text-transform:uppercase;color:${C.sub};white-space:nowrap}
     .u{margin-top:4px;font-family:Montserrat,sans-serif;font-weight:900;font-size:29px;letter-spacing:-.01em;color:${C.mint};white-space:nowrap}`,
  );
}

/** Pannello sotto il player di Twitch (320 × 100, angoli trasparenti), da collegare a originsmeta.com/@<nome>. */
function panel(locale) {
  const label = COPY[locale].panel;
  return page(
    `<div class="p night"><div class="dots"></div><div class="acc"></div>
      <div class="tile">${om(22)}</div>
      <div class="lbl" style="font-size:${label.length > 11 ? 21 : 24}px">${label}</div><div class="sub">${COPY[locale].panelSub}</div>
    </div>`,
    `.p{position:relative;width:320px;height:100px;border-radius:16px;border:3px solid ${C.mint};overflow:hidden}
     .p .dots{background-size:16px 16px}
     .tile{position:absolute;left:16px;top:19px;width:56px;height:56px;border-radius:14px;border:2.5px solid ${C.mint};background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center}
     .lbl{position:absolute;left:88px;top:22px;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;color:${C.chalk}}
     .sub{position:absolute;left:89px;top:56px;font-weight:600;font-size:16px;letter-spacing:.04em;color:${C.sub};white-space:nowrap}
     .acc{position:absolute;right:-18px;top:-26px;width:64px;height:88px;border:2.5px solid ${C.mint};border-radius:12px;opacity:.28;transform:rotate(18deg)}`,
  );
}

const ASSETS = {
  // La scritta del sito su fondo trasparente, alla sua misura (contorno bianco: si legge su fondi chiari e scuri).
  "originsmeta-logo": {
    w: LOGO_SIZE.w,
    h: LOGO_SIZE.h,
    transparent: true,
    html: page(`<img src="${logoUrl}" width="${LOGO_SIZE.w}" height="${LOGO_SIZE.h}" style="display:block">`),
  },
  // La scritta su un fondo pieno del sito, 2:1, per miniature, schermate e post.
  "originsmeta-logo-dark": {
    w: 1280,
    h: 640,
    html: page(
      `<div class="s night"><div class="dots"></div><img src="${logoUrl}" width="${LOGO_SIZE.w}" height="${LOGO_SIZE.h}"></div>`,
      `.s{position:relative;width:1280px;height:640px;display:flex;align-items:center;justify-content:center}.s .dots{background-size:24px 24px}
       .s img{position:relative;display:block;filter:drop-shadow(0 12px 28px rgba(0,0,0,.45))}`,
    ),
  },
  // Il simbolo "OM." come la foto del canale Twitch e del Discord: fondo pieno fino ai bordi (le piattaforme lo
  // ritagliano in un cerchio) e il simbolo nel 60% centrale.
  "originsmeta-symbol": {
    w: 1024,
    h: 1024,
    html: page(
      `<div class="a">${om(320)}</div>`,
      `.a{width:1024px;height:1024px;display:flex;align-items:center;justify-content:center;background:radial-gradient(closest-side, #0d1030 0%, ${C.ink} 100%)}`,
    ),
  },
  "originsmeta-symbol-transparent": {
    w: 1024,
    h: 1024,
    transparent: true,
    html: page(`<div class="a">${om(320)}</div>`, `.a{width:1024px;height:1024px;display:flex;align-items:center;justify-content:center}`),
  },
};
for (const l of LOCALES) {
  ASSETS[`originsmeta-badge-${l}`] = { w: 480, h: 120, dpr: 2, transparent: true, html: badge(l) };
  ASSETS[`originsmeta-twitch-panel-${l}`] = { w: 320, h: 100, transparent: true, html: panel(l) };
}

const README = `OriginsMeta media kit for creators
==================================

Everything here is made by OriginsMeta, the fan-run meta site for Origins TCG: use it freely in your streams,
videos, thumbnails and posts when you show or mention OriginsMeta. Guides for every tool:
https://originsmeta.com/en/for-creators

FILES
- originsmeta-logo.png               the logo, transparent background (640 x 197)
- originsmeta-logo-dark.png          the logo on our dark background (1280 x 640)
- originsmeta-symbol.png             the "OM." symbol on dark, for avatars and watermarks (1024 x 1024)
- originsmeta-symbol-transparent.png the "OM." symbol, transparent background (1024 x 1024)
- originsmeta-badge-<language>.png   "Decks & stats on originsmeta.com" for a corner of your stream or video
                                     (960 x 240: in OBS set it to 480 x 120); en, it, es, fr, pt, de, ru
- originsmeta-twitch-panel-<lang>.png a 320 x 100 panel for your Twitch channel: link it to
                                     https://originsmeta.com/@<your username>

COLOURS
- Mint   #31E3BD  accent, "Origins" in the logo, the M of the symbol
- Sky    #3FC4E8  frames and titles
- Night  #150C2C  backgrounds
- Pink   #FF4DA6  the dot of the symbol
- Chalk  #E2E2E6  text on dark, the O of the symbol

FONTS (free on Google Fonts)
- Montserrat Black: the "OM." symbol
- Unbounded: titles on the site
- Manrope: text on the site

PLEASE
- Do not stretch, recolour, crop or redraw the logo and the symbol; leave some space around them.
- Do not present OriginsMeta as official: it is a fan site, not affiliated with Koin Games.
- This kit has no Koin Games material: for the game's art and logos, follow Koin Games' own rules.

Questions: staff@originsmeta.com or the "Write to the staff" box on originsmeta.com.
`;

mkdirSync(OUT, { recursive: true });
const work = mkdtempSync(path.join(tmpdir(), "om-creator-kit-"));
const made = [];
try {
  for (const [name, a] of Object.entries(ASSETS)) {
    const file = path.join(work, `${name}.html`);
    writeFileSync(file, a.html);
    const png = path.join(OUT, `${name}.png`);
    rmSync(png, { force: true });
    const r = spawnSync(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--allow-file-access-from-files",
        `--force-device-scale-factor=${a.dpr ?? 1}`,
        ...(a.transparent ? ["--default-background-color=00000000"] : []),
        `--window-size=${a.w},${a.h}`,
        "--virtual-time-budget=10000",
        `--screenshot=${png}`,
        pathToFileURL(file).href,
      ],
      { encoding: "utf8" },
    );
    if (r.status !== 0 || !existsSync(png)) {
      console.error("ERRORE", name, r.status, r.stderr);
      process.exitCode = 1;
    } else {
      made.push(`${name}.png`);
      console.log("ok", name, `${Math.round(statSync(png).size / 1024)} KB`);
    }
  }
  writeFileSync(path.join(OUT, "README.txt"), README.replace(/\n/g, "\r\n"));

  // Lo zip con tutto: il tar di Windows (bsdtar) scrive lo zip da sé con -a; quello di Git Bash no, quindi il percorso
  // di System32 viene prima.
  const tar = [process.env.SystemRoot && path.join(process.env.SystemRoot, "System32/tar.exe"), "tar"].find((p) => p === "tar" || existsSync(p));
  const zip = path.join(OUT, ZIP);
  rmSync(zip, { force: true });
  const z = spawnSync(tar, ["-a", "-c", "-f", zip, "-C", OUT, ...made, "README.txt"], { encoding: "utf8" });
  if (z.status !== 0 || !existsSync(zip)) {
    console.error("ERRORE zip", z.status, z.stderr);
    process.exitCode = 1;
  } else console.log("ok", ZIP, `${Math.round(statSync(zip).size / 1024)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
