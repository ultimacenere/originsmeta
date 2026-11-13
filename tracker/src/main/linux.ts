/**
 * OriginsMeta Tracker su Linux (0.6.0, 13/11/2026; Pierluigi: "ci hanno richiesto il tracker per linux"; guida in
 * docs/tracker.md, "Linux"). Su Steam Origins TCG esiste per Windows e Mac, non per Linux: chi gioca su Linux lo apre
 * con Proton, cioè Wine dentro un prefisso che Steam tiene per il gioco. Qui le funzioni pure (test in linux.test.ts) e
 * le poche letture e scritture del disco che servono, solo nelle cartelle dell'utente.
 *
 * - **File del gioco**: dentro il prefisso di Proton, `<libreria di Steam>/steamapps/compatdata/<appid>/pfx/drive_c/
 *   users/steamuser/AppData/LocalLow/Koin Games/<prodotto>/…`. Le librerie sono quelle di `libraryfolders.vdf` di ogni
 *   Steam installato (nativo, Flatpak, Snap), contate una volta sola anche quando ~/.steam/steam è un collegamento.
 * - **Gioco aperto**: un processo che si chiama `OriginsTCG.exe` (Wine dà al processo il nome dell'eseguibile di
 *   Windows), letto da /proc senza lanciare programmi.
 * - **Avvio con il gioco**: una voce in `~/.config/autostart` (lo standard dei desktop Linux) con `--hidden --wait-game`,
 *   come la voce "Esegui all'avvio" di Windows.
 * - **Voce nel menu delle applicazioni**: l'AppImage non si installa, quindi l'app scrive da sé la sua voce in
 *   `~/.local/share/applications` (con l'icona): si riapre dal menu anche dove l'icona nella barra non c'è (GNOME senza
 *   l'estensione AppIndicator).
 * - **X11**: Proton disegna il gioco in X11 (XWayland nelle sessioni Wayland) e l'app deve partire anche lei in X11. In
 *   Wayland Electron non vede le altre finestre (la ripresa passerebbe ogni volta dal selettore del sistema) e non sa
 *   mettere i pannelli in un punto preciso né tenerli sopra il gioco. Lo fa il lanciatore dell'AppImage (AppRun,
 *   scripts/package-linux.mjs), che toglie anche la sandbox di Chromium dove il sistema vieta i namespace utente;
 *   `x11Relaunch` è la riserva per chi apre l'eseguibile senza AppRun.
 */
import fs from "node:fs";
import path from "node:path";
import type { GameDirs } from "./paths";

const P = path.posix;

/** Gli appid di Steam: il gioco completo e l'app della demo, il cui ramo `communityplaytest` era il playtest. */
export const STEAM_APP_IDS = ["4429430", "4756630"] as const;

/**
 * L'identità dell'app sui desktop Linux, in stile reverse-DNS come chiede Electron (`desktopName` in package.json):
 * nome dei file .desktop e dell'icona e, in X11, `WM_CLASS` delle finestre, che lega le finestre alla voce del menu.
 */
export const DESKTOP_ID = "com.originsmeta.tracker";

type Env = Record<string, string | undefined>;

const unique = (list: string[]) => [...new Set(list)];
const absOr = (value: string | undefined, fallback: string) => (value && P.isAbsolute(value) ? value : fallback);

export const xdgConfigHome = (home: string, env: Env = {}) => absOr(env.XDG_CONFIG_HOME, P.join(home, ".config"));
export const xdgDataHome = (home: string, env: Env = {}) => absOr(env.XDG_DATA_HOME, P.join(home, ".local", "share"));

/* ---------- file del gioco nel prefisso di Proton ---------- */

/** Le cartelle di Steam possibili: nativo (anche i collegamenti ~/.steam/steam e ~/.steam/root), Flatpak, Snap. */
export function steamRoots(home: string, env: Env = {}): string[] {
  return unique([
    P.join(xdgDataHome(home, env), "Steam"),
    P.join(home, ".local", "share", "Steam"),
    P.join(home, ".steam", "steam"),
    P.join(home, ".steam", "root"),
    P.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam"),
    P.join(home, ".var", "app", "com.valvesoftware.Steam", "data", "Steam"),
    P.join(home, "snap", "steam", "common", ".local", "share", "Steam"),
  ]);
}

/** I percorsi delle librerie scritti in `libraryfolders.vdf` (`"path" "…"`; nel formato la barra rovesciata è raddoppiata). */
export function libraryPaths(vdf: string): string[] {
  const out: string[] = [];
  for (const m of vdf.matchAll(/"path"\s+"((?:[^"\\]|\\.)*)"/gi)) out.push(m[1].replace(/\\(.)/g, "$1"));
  return out.filter((p) => P.isAbsolute(p));
}

/** La cartella dell'utente di Windows dentro il prefisso di Proton di un gioco, in una libreria di Steam. */
export function protonUserDir(library: string, appId: string): string {
  return P.join(library, "steamapps", "compatdata", appId, "pfx", "drive_c", "users", "steamuser");
}

/** Le letture del disco di `linuxGameDirs` (finte nei test). */
export type DirsIo = { read(file: string): string | null; real(dir: string): string | null };

export const diskIo: DirsIo = {
  read: (file) => {
    try {
      return fs.readFileSync(file, "utf8");
    } catch {
      return null;
    }
  },
  real: (dir) => {
    try {
      return fs.realpathSync(dir);
    } catch {
      return null;
    }
  },
};

/**
 * Le cartelle del gioco su Linux: per ogni libreria di Steam e ogni appid, la cache e i replay di ogni prodotto nel
 * prefisso di Proton. Le librerie si contano una volta sola (percorso vero): lo stesso file letto da due percorsi
 * diversi sembrerebbe al watcher un cambio di build e la partita in corso andrebbe persa (`rebase` di watcher.ts). Una
 * libreria che oggi non c'è (scheda SD tolta) resta, con il percorso scritto in `libraryfolders.vdf`.
 */
export function linuxGameDirs(home: string, products: readonly string[], env: Env = {}, io: DirsIo = diskIo): GameDirs {
  const libraries: string[] = [];
  const add = (dir: string) => {
    const real = io.real(dir) ?? dir;
    if (!libraries.includes(real)) libraries.push(real);
  };
  for (const root of steamRoots(home, env)) {
    const real = io.real(root);
    if (!real) continue; // questo Steam non c'è
    add(real); // la libreria principale è la cartella di Steam
    for (const file of [P.join(real, "steamapps", "libraryfolders.vdf"), P.join(real, "config", "libraryfolders.vdf")]) {
      const text = io.read(file);
      if (text) for (const lib of libraryPaths(text)) add(lib);
    }
  }
  const users = libraries.flatMap((lib) => STEAM_APP_IDS.map((id) => protonUserDir(lib, id)));
  return {
    cacheRoots: users.flatMap((u) => products.map((p) => P.join(u, "AppData", "LocalLow", "Koin Games", p, "beamable", "cache"))),
    replayDirs: users.flatMap((u) => products.map((p) => P.join(u, "Documents", "My Games", p, "Replays"))),
  };
}

/* ---------- gioco aperto ---------- */

/** L'eseguibile del gioco (completo e playtest), mai la demo: lo stesso `OriginsTCG*.exe` di startup.ts. */
const GAME_EXE = /^originstcg(?!demo)[a-z0-9_]*\.exe$/i;
/** Il nome del processo in /proc (`comm`) è tagliato a 15 caratteri: "OriginsTCGPlaytest.exe" diventa "OriginsTCGPlayt". */
const GAME_COMM = /^originstcg(?!demo)[a-z0-9_.]*$/i;

/** Un processo è il gioco: dal nome (`comm`) o dall'eseguibile della riga di comando (Wine ci scrive il percorso di Windows). */
export function isGameProcess(comm: string, cmdline: string): boolean {
  if (GAME_COMM.test(comm.trim())) return true;
  const argv0 = cmdline.split("\0")[0] ?? "";
  return GAME_EXE.test(argv0.split(/[\\/]/).pop() ?? "");
}

/** Il gioco è aperto: un processo di /proc è Origins TCG. Solo letture di `comm` e `cmdline`, nessun programma lanciato. */
export function gameRunningLinux(procRoot = "/proc"): boolean {
  let names: string[];
  try {
    names = fs.readdirSync(procRoot);
  } catch {
    return false;
  }
  for (const pid of names) {
    if (!/^\d+$/.test(pid)) continue;
    let comm: string;
    try {
      comm = fs.readFileSync(path.join(procRoot, pid, "comm"), "utf8");
    } catch {
      continue; // processo finito nel frattempo
    }
    if (GAME_COMM.test(comm.trim())) return true;
    try {
      if (isGameProcess(comm, fs.readFileSync(path.join(procRoot, pid, "cmdline"), "latin1"))) return true;
    } catch {
      // processo finito nel frattempo
    }
  }
  return false;
}

/* ---------- voci dei desktop: avvio con il gioco e menu delle applicazioni ---------- */

/**
 * Un argomento della riga `Exec` di un file .desktop (specifica Desktop Entry, "The Exec key"): fra virgolette se ha
 * caratteri riservati, con `"`, `` ` ``, `$` e `\` preceduti da una barra rovesciata; poi la regola delle stringhe del
 * file, che vale prima delle virgolette, raddoppia le barre rovesciate (una barra vera diventa quattro). `%` → `%%`.
 */
export function desktopExecArg(arg: string): string {
  if (/[\r\n]/.test(arg)) throw new Error("argomento con un a capo");
  const quoted = /^[A-Za-z0-9_\-./=:+,@]+$/.test(arg) ? arg : `"${arg.replace(/[\\"`$]/g, (c) => `\\${c}`)}"`;
  return quoted.replace(/\\/g, "\\\\").replace(/%/g, "%%");
}

/** I testi delle voci, nelle lingue dell'app (il desktop sceglie quella dell'utente). */
const COMMENT = {
  en: "Records your Origins TCG matches. Unofficial fan project, not affiliated with Koin Games.",
  it: "Registra le tue partite di Origins TCG. Progetto fan non ufficiale, non affiliato a Koin Games.",
  es: "Registra tus partidas de Origins TCG. Proyecto fan no oficial, no afiliado a Koin Games.",
};
const AUTOSTART_COMMENT = {
  en: "Waits for Origins TCG and records your matches.",
  it: "Aspetta Origins TCG e registra le tue partite.",
  es: "Espera a Origins TCG y registra tus partidas.",
};

/** Un file .desktop: la voce del menu (`kind: "menu"`) o quella dell'avvio con il gioco (`kind: "autostart"`). */
export function desktopEntry(kind: "menu" | "autostart", exec: readonly string[]): string {
  const comment = kind === "menu" ? COMMENT : AUTOSTART_COMMENT;
  const lines = [
    "[Desktop Entry]",
    "Type=Application",
    "Version=1.0",
    "Name=OriginsMeta Tracker",
    `Comment=${comment.en}`,
    `Comment[it]=${comment.it}`,
    `Comment[es]=${comment.es}`,
    `Exec=${exec.map(desktopExecArg).join(" ")}`,
    `Icon=${DESKTOP_ID}`,
    "Terminal=false",
    `StartupWMClass=${DESKTOP_ID}`,
  ];
  // una sola categoria principale (con due, alcuni menu mostrano l'app due volte)
  if (kind === "menu") lines.push("Categories=Game;", "Keywords=Origins;TCG;tracker;deck;overlay;");
  else lines.push("X-GNOME-Autostart-enabled=true");
  return lines.join("\n") + "\n";
}

/**
 * La voce dell'avvio tolta o spenta dal giocatore nelle impostazioni del desktop (GNOME e KDE scrivono `Hidden=true` o
 * `X-GNOME-Autostart-enabled=false`): l'app non la riaccende da sola, come su Windows con Gestione attività.
 */
export function linuxAutostartOff(text: string | null): boolean {
  return text === null || /^[ \t]*(?:Hidden[ \t]*=[ \t]*true|X-GNOME-Autostart-enabled[ \t]*=[ \t]*false)[ \t]*$/im.test(text);
}

export const autostartFile = (home: string, env: Env = {}) => P.join(xdgConfigHome(home, env), "autostart", `${DESKTOP_ID}.desktop`);
export const menuFile = (home: string, env: Env = {}) => P.join(xdgDataHome(home, env), "applications", `${DESKTOP_ID}.desktop`);
export const menuIconFile = (home: string, env: Env = {}) => P.join(xdgDataHome(home, env), "icons", "hicolor", "256x256", "apps", `${DESKTOP_ID}.png`);

/** Scrive un file solo se il contenuto è diverso (true se l'ha scritto). */
export function writeIfChanged(file: string, content: string | Buffer): boolean {
  const data = typeof content === "string" ? Buffer.from(content, "utf8") : content;
  try {
    if (fs.readFileSync(file).equals(data)) return false;
  } catch {
    // non c'è ancora
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
  return true;
}

/* ---------- X11 ---------- */

/**
 * Gli argomenti per ripartire in X11, o null se non serve: l'app è già in X11 (lanciatore dell'AppImage, sessione X11)
 * o X11 non c'è (niente `DISPLAY`: senza XWayland non c'è nemmeno il gioco di Proton). `ORIGINSMETA_KEEP_WAYLAND=1` la
 * lascia in Wayland (prove). Chromium sceglie la piattaforma prima che parta main.js, quindi serve un nuovo avvio.
 */
export function x11Relaunch(argv: readonly string[], env: Env): string[] | null {
  if (argv.some((a) => a.startsWith("--ozone-platform=")) || env.ORIGINSMETA_KEEP_WAYLAND === "1") return null;
  if (!env.WAYLAND_DISPLAY || !env.DISPLAY) return null;
  return [...argv.slice(1), "--ozone-platform=x11"];
}
