// Compila l'APK di prova dell'app Android (firma di debug) e lo copia in mobile/out/.
// Prima `cap sync android` (configurazione e pagina offline dentro il progetto), poi Gradle: test Java e APK.
//
// Uso, dalla cartella mobile/:
//   npm run apk
// Serve Java 21 e l'Android SDK: JAVA_HOME e ANDROID_HOME, o le cartelle dove li ha messi l'installazione del
// 20/10/2026 (%LOCALAPPDATA%\Programs\jdk-21 e %LOCALAPPDATA%\Android\Sdk). La versione di Google Play (AAB firmato
// con la chiave di rilascio) non si fa da qui: vedi mobile/README.md.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const android = path.join(mobile, "android");
const { version } = JSON.parse(readFileSync(path.join(mobile, "package.json"), "utf8"));
const win = process.platform === "win32";

function firstExisting(...dirs) {
  return dirs.find((d) => d && existsSync(d));
}

const local = process.env.LOCALAPPDATA;
const javaHome = firstExisting(process.env.JAVA_HOME, local && path.join(local, "Programs/jdk-21"));
const sdk = firstExisting(process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, local && path.join(local, "Android/Sdk"));
if (!javaHome) throw new Error("Java 21 non trovato: imposta JAVA_HOME");
if (!sdk) throw new Error("Android SDK non trovato: imposta ANDROID_HOME");

// local.properties (fuori da git) dice a Gradle dov'è l'SDK.
const props = path.join(android, "local.properties");
if (!existsSync(props)) writeFileSync(props, `sdk.dir=${sdk.replace(/\\/g, "/")}\n`);

const env = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk };
/** Su Windows cap e gradlew sono .cmd/.bat e partono solo da una shell: una riga sola, percorso fra virgolette. */
function run(cmd, args, cwd) {
  const line = `"${cmd}" ${args.join(" ")}`;
  console.log(`> ${line}`);
  const r = win ? spawnSync(line, { cwd, env, stdio: "inherit", shell: true }) : spawnSync(cmd, args, { cwd, env, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(path.join(mobile, "node_modules/.bin/cap"), ["sync", "android"], mobile);
run(path.join(android, win ? "gradlew.bat" : "gradlew"), ["testDebugUnitTest", "assembleDebug"], android);

const apk = path.join(android, "app/build/outputs/apk/debug/app-debug.apk");
const outDir = path.join(mobile, "out");
mkdirSync(outDir, { recursive: true });
const dest = path.join(outDir, `OriginsMeta-${version}-debug.apk`);
copyFileSync(apk, dest);
console.log(`APK: ${dest}`);
