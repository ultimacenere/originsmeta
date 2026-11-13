/**
 * Test del tracker su Linux (linux.ts, 13/11/2026): cartelle del gioco nel prefisso di Proton, gioco aperto da /proc,
 * voci dei desktop (avvio con il gioco e menu) e ripartenza in X11. I percorsi dei test sono quelli di Linux anche quando
 * i test girano su Windows; quelli che usano il disco vero con i collegamenti girano solo su Linux (GitHub Actions).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { autostartFile, desktopEntry, desktopExecArg, DESKTOP_ID, gameRunningLinux, isGameProcess, libraryPaths, linuxAutostartOff, linuxGameDirs, menuFile, menuIconFile, protonUserDir, steamRoots, writeIfChanged, x11Relaunch, type DirsIo } from "./linux";
import { gameDirs, PRODUCTS } from "./paths";

const HOME = "/home/gio";
const NATIVE = "/home/gio/.local/share/Steam";
const CACHE = (lib: string, id = "4429430", product = "Origins TCG") => `${protonUserDir(lib, id)}/AppData/LocalLow/Koin Games/${product}/beamable/cache`;

const VDF = `"libraryfolders"
{
	"0"
	{
		"path"		"/home/gio/.local/share/Steam"
		"label"		""
		"apps"
		{
			"228980"		"1234"
			"4429430"		"2400000000"
		}
	}
	"1"
	{
		"path"		"/mnt/giochi/SteamLibrary"
		"label"		"Giochi"
	}
	"2"
	{
		"path"		"/run/media/deck/SD \\"veloce\\""
	}
}
`;

/** Un disco finto: i collegamenti ~/.steam/steam e ~/.steam/root portano allo Steam nativo, il Flatpak non c'è. */
function fakeIo(files: Record<string, string>, links: Record<string, string>): DirsIo {
  return {
    read: (f) => files[f] ?? null,
    real: (d) => links[d] ?? (Object.keys(files).some((f) => f.startsWith(`${d}/`)) || Object.values(links).includes(d) ? d : null),
  };
}

describe("tracker su Linux: cartelle del gioco nel prefisso di Proton", () => {
  test("le cartelle di Steam: nativo, collegamenti, Flatpak e Snap; XDG_DATA_HOME vale se è un percorso assoluto", () => {
    const roots = steamRoots(HOME);
    assert.equal(roots[0], NATIVE);
    assert.ok(roots.includes("/home/gio/.steam/steam"));
    assert.ok(roots.includes("/home/gio/.var/app/com.valvesoftware.Steam/.local/share/Steam"));
    assert.ok(roots.includes("/home/gio/snap/steam/common/.local/share/Steam"));
    assert.equal(new Set(roots).size, roots.length, "niente doppioni");
    assert.equal(steamRoots(HOME, { XDG_DATA_HOME: "/dati" })[0], "/dati/Steam");
    assert.equal(steamRoots(HOME, { XDG_DATA_HOME: "relativo" })[0], NATIVE);
  });

  test("libraryfolders.vdf: i percorsi delle librerie, con le virgolette scritte come nel formato", () => {
    assert.deepEqual(libraryPaths(VDF), ["/home/gio/.local/share/Steam", "/mnt/giochi/SteamLibrary", '/run/media/deck/SD "veloce"']);
    assert.deepEqual(libraryPaths('"path" "C:\\\\Program Files (x86)\\\\Steam"'), [], "un percorso di Windows non è una libreria di Linux");
    assert.deepEqual(libraryPaths(""), []);
  });

  test("cache e replay in ogni libreria, per il gioco completo e il playtest; ogni libreria una volta sola", () => {
    const io = fakeIo({ [`${NATIVE}/steamapps/libraryfolders.vdf`]: VDF }, { "/home/gio/.steam/steam": NATIVE, "/home/gio/.steam/root": NATIVE });
    const dirs = linuxGameDirs(HOME, PRODUCTS, {}, io);
    assert.ok(dirs.cacheRoots.includes(CACHE(NATIVE)), "il gioco nella libreria principale");
    assert.ok(dirs.cacheRoots.includes(CACHE("/mnt/giochi/SteamLibrary")), "il gioco in un'altra libreria");
    assert.ok(dirs.cacheRoots.includes(CACHE(NATIVE, "4756630", "Origins TCG Playtest")), "il playtest");
    // 3 librerie (lo Steam nativo letto da tre percorsi conta una volta) × 2 appid × 2 prodotti
    assert.equal(dirs.cacheRoots.length, 12);
    assert.equal(new Set(dirs.cacheRoots).size, 12);
    assert.ok(dirs.replayDirs.includes(`${protonUserDir(NATIVE, "4429430")}/Documents/My Games/Origins TCG/Replays`));
  });

  test("Steam Flatpak senza Steam nativo; nessuno Steam: nessuna cartella", () => {
    const flatpak = "/home/gio/.var/app/com.valvesoftware.Steam/.local/share/Steam";
    const dirs = linuxGameDirs(HOME, ["Origins TCG"], {}, fakeIo({ [`${flatpak}/steamapps/libraryfolders.vdf`]: `"path" "${flatpak}"` }, {}));
    assert.deepEqual(dirs.cacheRoots, [CACHE(flatpak), CACHE(flatpak, "4756630")]);
    assert.deepEqual(linuxGameDirs(HOME, PRODUCTS, {}, fakeIo({}, {})), { cacheRoots: [], replayDirs: [] });
  });

  test("le cartelle scelte a mano (prove) valgono anche su Linux", () => {
    const dirs = gameDirs(HOME, "/home/gio/Documenti", { ORIGINSMETA_TRACKER_CACHE: "/prova/cache", ORIGINSMETA_TRACKER_REPLAYS: "/prova/replay" }, "linux");
    assert.deepEqual(dirs, { cacheRoots: ["/prova/cache"], replayDirs: ["/prova/replay"] });
  });

  test("sul disco vero, con ~/.steam/steam collegamento allo Steam nativo", { skip: process.platform !== "linux" }, () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "om-linux-home-"));
    try {
      const native = path.join(home, ".local", "share", "Steam");
      const cache = CACHE(native);
      fs.mkdirSync(cache, { recursive: true });
      fs.mkdirSync(path.join(home, ".steam"), { recursive: true });
      fs.symlinkSync(native, path.join(home, ".steam", "steam"));
      const dirs = gameDirs(home, path.join(home, "Documenti"), {}, "linux");
      assert.ok(dirs.cacheRoots.includes(cache));
      assert.equal(dirs.cacheRoots.filter((d) => d.endsWith("/4429430/pfx/drive_c/users/steamuser/AppData/LocalLow/Koin Games/Origins TCG/beamable/cache")).length, 1, "il collegamento non raddoppia la libreria");
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});

describe("tracker su Linux: gioco aperto", () => {
  test("il processo del gioco: nome tagliato a 15 caratteri o eseguibile di Windows nella riga di comando", () => {
    assert.equal(isGameProcess("OriginsTCG.exe\n", ""), true);
    assert.equal(isGameProcess("OriginsTCGPlayt\n", ""), true, "il playtest, nome tagliato");
    assert.equal(isGameProcess("wine64-preloade", "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Origins TCG\\OriginsTCG.exe\0"), true);
    assert.equal(isGameProcess("wine-preloader", "Z:\\home\\gio\\.local\\share\\Steam\\steamapps\\common\\Origins TCG\\OriginsTCG.exe\0-screen-fullscreen\0"), true);
    // la demo non fa partire l'app, come su Windows
    assert.equal(isGameProcess("OriginsTCGDemo.", ""), false);
    assert.equal(isGameProcess("wine64-preloade", "C:\\Giochi\\OriginsTCGDemo.exe\0"), false);
    // l'app stessa, il lanciatore di Steam (il gioco è un suo argomento, non il programma) e il resto
    assert.equal(isGameProcess("originsmeta-tra", "/tmp/.mount_Origin/usr/lib/originsmeta-tracker/originsmeta-tracker\0--hidden\0"), false);
    assert.equal(isGameProcess("reaper", "/home/gio/.local/share/Steam/ubuntu12_32/reaper\0SteamLaunch\0AppId=4429430\0--\0/home/gio/.local/share/Steam/steamapps/common/Origins TCG/OriginsTCG.exe\0"), false);
    assert.equal(isGameProcess("UnityCrashHandl", "C:\\Giochi\\Origins TCG\\UnityCrashHandler64.exe\0"), false);
    assert.equal(isGameProcess("", ""), false);
  });

  test("/proc: solo le cartelle dei processi, nome e riga di comando", () => {
    const proc = fs.mkdtempSync(path.join(os.tmpdir(), "om-linux-proc-"));
    const pid = (n: string, comm: string, cmdline = "") => {
      fs.mkdirSync(path.join(proc, n), { recursive: true });
      fs.writeFileSync(path.join(proc, n, "comm"), `${comm}\n`);
      fs.writeFileSync(path.join(proc, n, "cmdline"), cmdline);
    };
    try {
      pid("1", "systemd", "/sbin/init\0");
      pid("self", "OriginsTCG.exe"); // non è un processo: si salta
      fs.mkdirSync(path.join(proc, "77")); // processo finito mentre si leggeva
      assert.equal(gameRunningLinux(proc), false);
      pid("4242", "wine64-preloade", "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Origins TCG\\OriginsTCG.exe\0");
      assert.equal(gameRunningLinux(proc), true, "dalla riga di comando");
      fs.rmSync(path.join(proc, "4242"), { recursive: true });
      pid("4243", "OriginsTCG.exe");
      assert.equal(gameRunningLinux(proc), true, "dal nome");
      assert.equal(gameRunningLinux(path.join(proc, "manca")), false);
    } finally {
      fs.rmSync(proc, { recursive: true, force: true });
    }
  });
});

describe("tracker su Linux: voci dei desktop", () => {
  test("argomenti della riga Exec: virgolette e barre rovesciate come nella specifica", () => {
    assert.equal(desktopExecArg("--wait-game"), "--wait-game");
    assert.equal(desktopExecArg("/home/gio/Applicazioni/OriginsMeta-Tracker-linux-x86_64.AppImage"), "/home/gio/Applicazioni/OriginsMeta-Tracker-linux-x86_64.AppImage");
    assert.equal(desktopExecArg("/home/gio/Giochi e app/Tracker.AppImage"), '"/home/gio/Giochi e app/Tracker.AppImage"');
    assert.equal(desktopExecArg("/home/gio/$soldi"), '"/home/gio/\\\\$soldi"', "il dollaro: \\\\$ nel file");
    assert.equal(desktopExecArg("/home/gio/a\\b"), '"/home/gio/a\\\\\\\\b"', "una barra rovesciata: quattro nel file");
    assert.equal(desktopExecArg('/home/gio/"x"'), '"/home/gio/\\\\"x\\\\""');
    assert.equal(desktopExecArg("/home/gio/100%"), '"/home/gio/100%%"');
    assert.equal(desktopExecArg("~/x"), '"~/x"', "la tilde è riservata");
    assert.throws(() => desktopExecArg("a\nb"));
  });

  test("voce del menu e voce dell'avvio con il gioco", () => {
    const app = "/home/gio/Giochi e app/OriginsMeta-Tracker-linux-x86_64.AppImage";
    const menu = desktopEntry("menu", [app]);
    assert.match(menu, /^\[Desktop Entry\]\n/);
    assert.match(menu, /\nExec="\/home\/gio\/Giochi e app\/OriginsMeta-Tracker-linux-x86_64\.AppImage"\n/);
    assert.match(menu, new RegExp(`\\nIcon=${DESKTOP_ID}\\n`));
    assert.match(menu, new RegExp(`\\nStartupWMClass=${DESKTOP_ID}\\n`));
    assert.match(menu, /\nCategories=Game;\n/);
    assert.match(menu, /not affiliated with Koin Games/);
    assert.match(menu, /\nComment\[it\]=.*non affiliato a Koin Games/);
    assert.doesNotMatch(menu, /Autostart/);
    const auto = desktopEntry("autostart", [app, "--hidden", "--wait-game"]);
    assert.match(auto, /\nExec="[^"]+\.AppImage" --hidden --wait-game\n/);
    assert.match(auto, /\nX-GNOME-Autostart-enabled=true\n/);
    assert.doesNotMatch(auto, /Categories/);
    assert.ok(menu.endsWith("\n"));
  });

  test("voce dell'avvio tolta o spenta dalle impostazioni del desktop: l'app non la riaccende", () => {
    const auto = desktopEntry("autostart", ["/home/gio/Tracker.AppImage", "--hidden", "--wait-game"]);
    assert.equal(linuxAutostartOff(auto), false);
    assert.equal(linuxAutostartOff(null), true, "tolta");
    assert.equal(linuxAutostartOff(auto.replace("X-GNOME-Autostart-enabled=true", "X-GNOME-Autostart-enabled=false")), true, "spenta da GNOME");
    assert.equal(linuxAutostartOff(`${auto}Hidden=true\n`), true, "spenta da KDE");
    assert.equal(linuxAutostartOff(`${auto}Hidden=false\n`), false);
  });

  test("dove stanno le voci: cartelle XDG, con le variabili solo se assolute", () => {
    assert.equal(autostartFile(HOME), `/home/gio/.config/autostart/${DESKTOP_ID}.desktop`);
    assert.equal(autostartFile(HOME, { XDG_CONFIG_HOME: "/cfg" }), `/cfg/autostart/${DESKTOP_ID}.desktop`);
    assert.equal(menuFile(HOME), `/home/gio/.local/share/applications/${DESKTOP_ID}.desktop`);
    assert.equal(menuIconFile(HOME, { XDG_DATA_HOME: "/dati" }), `/dati/icons/hicolor/256x256/apps/${DESKTOP_ID}.png`);
    assert.equal(menuFile(HOME, { XDG_DATA_HOME: "dati" }), `/home/gio/.local/share/applications/${DESKTOP_ID}.desktop`);
  });

  test("un file si riscrive solo se cambia", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "om-linux-write-"));
    try {
      const file = path.join(dir, "autostart", "voce.desktop");
      assert.equal(writeIfChanged(file, "uno\n"), true);
      assert.equal(writeIfChanged(file, "uno\n"), false);
      assert.equal(writeIfChanged(file, "due\n"), true);
      assert.equal(fs.readFileSync(file, "utf8"), "due\n");
      assert.deepEqual(fs.readdirSync(path.dirname(file)), ["voce.desktop"], "niente file temporanei");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("tracker su Linux: X11", () => {
  test("riparte in X11 solo in una sessione Wayland con XWayland, e una volta sola", () => {
    const argv = ["/opt/om/originsmeta-tracker", "--hidden"];
    assert.deepEqual(x11Relaunch(argv, { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" }), ["--hidden", "--ozone-platform=x11"]);
    assert.equal(x11Relaunch([...argv, "--ozone-platform=x11"], { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" }), null, "già ripartita");
    assert.equal(x11Relaunch(argv, { DISPLAY: ":0" }), null, "sessione X11");
    assert.equal(x11Relaunch(argv, { WAYLAND_DISPLAY: "wayland-0" }), null, "senza XWayland resta in Wayland");
    assert.equal(x11Relaunch(argv, { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0", ORIGINSMETA_KEEP_WAYLAND: "1" }), null);
  });
});
