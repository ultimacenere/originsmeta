// Testi e dati ufficiali delle carte letti nei file del gioco installato, in sola lettura (11/11/2026, Accesso anticipato
// 0.8.2). Serve alla verifica da rifare dopo ogni patch: il gioco scarica i dati delle carte quando lo si apre, quindi
// prima va aperto almeno una volta. Procedura in docs/testi-di-gioco.md.
//
//   node scripts/game-texts.mjs              scrive docs/testi-ufficiali/<lingua>.tsv (it, es, fr, pt, de, ru, zh-cn) per le
//                                            carte della collezione
//   node scripts/game-texts.mjs --json <f>   scrive anche tutti i dati letti (costo, statistiche, rarità, testi in otto lingue
//                                            e potere leggendario, carte create e rimosse comprese) in <f>, per confrontarli
//   --gioco <cartella>  installazione del gioco (predefinita quella di Steam)
//   --dati <cartella>   cartella CardBaseData (predefinita la build più recente scaricata dal gioco)
//
// Da dove leggono: i dati delle carte (costo, statistiche, rarità, testo inglese con i segnaposto) stanno in
// %USERPROFILE%\AppData\LocalLow\Koin Games\Origins TCG\Data\production\<id>\<versione>\CardBaseData, un JSON per carta; i
// testi nelle altre lingue nelle tabelle di Unity Localization dentro StreamingAssets\aa\StandaloneWindows64 della
// cartella del gioco (bundle UnityFS compressi con LZ4: le chiavi in localization-assets-shared, i testi in
// localization-string-tables-<lingua>). Il testo si porta nella notazione del sito: segnaposto risolti ({kw_OnReveal} col
// nome della parola chiave nella lingua, {DescriptionDamage} col valore della carta), icone delle statistiche come ⚔️ e ❤️,
// niente tag. Dopo: `node scripts/official-texts.mjs <lingua>` confronta la trascrizione con i file dei testi del sito.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const GAME = path.resolve(opt("--gioco") ?? "C:/Program Files (x86)/Steam/steamapps/common/Origins TCG");
const BUNDLES = path.join(GAME, "OriginsTCG_Data", "StreamingAssets", "aa", "StandaloneWindows64");
const PROD = path.join(homedir(), "AppData", "LocalLow", "Koin Games", "Origins TCG", "Data", "production");
// lingua del sito → tabella del gioco
const LANGS = { en: "en", it: "it", es: "es", fr: "fr", pt: "pt-br", de: "de", ru: "ru", "zh-cn": "zh-hans" };
const NAMES = { it: "ITALIANO", es: "SPAGNOLO", fr: "FRANCESE", pt: "PORTOGHESE DEL BRASILE", de: "TEDESCO", ru: "RUSSO", "zh-cn": "CINESE SEMPLIFICATO" };
const NBSP = String.fromCharCode(0xa0);

// ---------- bundle UnityFS ----------

function lz4Block(src, outSize) {
  const out = Buffer.alloc(outSize);
  let i = 0, o = 0;
  while (i < src.length) {
    const token = src[i++];
    let lit = token >> 4;
    if (lit === 15) for (let b = 255; b === 255; ) { b = src[i++]; lit += b; }
    src.copy(out, o, i, i + lit);
    i += lit;
    o += lit;
    if (i >= src.length) break;
    const off = src[i] | (src[i + 1] << 8);
    i += 2;
    let len = token & 15;
    if (len === 15) for (let b = 255; b === 255; ) { b = src[i++]; len += b; }
    len += 4;
    for (let from = o - off, k = 0; k < len; k++) out[o++] = out[from++];
  }
  if (o !== outSize) throw new Error(`lz4: ${o} byte invece di ${outSize}`);
  return out;
}

const decompress = (buf, size, type) => {
  if (type === 0) return buf;
  if (type === 2 || type === 3) return lz4Block(buf, size);
  throw new Error(`compressione ${type} non gestita`);
};

/** I file serializzati contenuti in un bundle UnityFS. */
function readBundle(file) {
  const b = readFileSync(file);
  let p = 0;
  const str = () => { const e = b.indexOf(0, p); const s = b.toString("utf8", p, e); p = e + 1; return s; };
  if (str() !== "UnityFS") throw new Error(`${file}: non è un bundle UnityFS`);
  const version = b.readUInt32BE(p); p += 4;
  str(); str();
  p += 8;
  const cSize = b.readUInt32BE(p); p += 4;
  const uSize = b.readUInt32BE(p); p += 4;
  const flags = b.readUInt32BE(p); p += 4;
  if (version >= 7) p = (p + 15) & ~15;
  let info;
  if (flags & 0x80) info = b.subarray(b.length - cSize);
  else { info = b.subarray(p, p + cSize); p += cSize; }
  info = decompress(info, uSize, flags & 0x3f);
  if (flags & 0x200) p = (p + 15) & ~15;
  let q = 16;
  const blocks = [];
  for (let k = info.readInt32BE((q += 4) - 4); k > 0; k--, q += 10) blocks.push({ u: info.readUInt32BE(q), c: info.readUInt32BE(q + 4), f: info.readUInt16BE(q + 8) });
  const nodes = [];
  for (let k = info.readInt32BE((q += 4) - 4); k > 0; k--) {
    const off = Number(info.readBigInt64BE(q)), size = Number(info.readBigInt64BE(q + 8));
    q += 20;
    q = info.indexOf(0, q) + 1;
    nodes.push({ off, size });
  }
  const parts = [];
  for (const bl of blocks) { parts.push(decompress(b.subarray(p, p + bl.c), bl.u, bl.f & 0x3f)); p += bl.c; }
  const data = Buffer.concat(parts);
  return nodes.map((n) => data.subarray(n.off, n.off + n.size));
}

/**
 * Le voci (id a 64 bit, testo) delle tabelle di Unity Localization: [int64 id][int32 lunghezza][UTF-8][allineamento a 4]
 * [int32 numero di metadati][int64 per metadato]. Valgono solo sequenze di almeno tre voci consecutive.
 */
function scanEntries(data) {
  const found = [];
  const at = (p) => {
    if (p + 16 > data.length) return null;
    const id = data.readBigInt64LE(p);
    const len = data.readInt32LE(p + 8);
    if (id === 0n || len < 0 || len > 20000 || p + 16 + len > data.length) return null;
    const text = data.toString("utf8", p + 12, p + 12 + len);
    if (Buffer.byteLength(text) !== len || text.includes("\uFFFD")) return null;
    const e = (p + 12 + len + 3) & ~3;
    const meta = data.readInt32LE(e);
    if (meta < 0 || meta > 16) return null;
    return { id, text, next: e + 4 + meta * 8 };
  };
  for (let p = 0; p + 16 <= data.length; ) {
    const run = [];
    let q = p;
    for (let r = at(q); r; r = at(q)) { run.push(r); q = r.next; }
    if (run.length >= 3) { found.push(...run); p = q; } else p += 4;
  }
  return found;
}

// ---------- dati e testi ----------

function cardDir() {
  if (opt("--dati")) return path.resolve(opt("--dati"));
  const all = [];
  for (const id of readdirSync(PROD))
    for (const v of readdirSync(path.join(PROD, id))) {
      const d = path.join(PROD, id, v, "CardBaseData");
      if (existsSync(path.join(d, "Version.json"))) all.push({ d, t: statSync(path.join(d, "Version.json")).mtimeMs });
    }
  if (!all.length) throw new Error(`nessun dato delle carte in ${PROD}: aprire il gioco una volta`);
  return all.sort((a, b) => b.t - a.t)[0].d;
}

const shared = new Map();
for (const data of readBundle(path.join(BUNDLES, "localization-assets-shared_assets_all.bundle")))
  for (const e of scanEntries(data)) if (/^[A-Za-z0-9_.-]+$/.test(e.text)) shared.set(e.text, e.id);
const tables = {};
for (const [site, game] of Object.entries(LANGS)) {
  const m = new Map();
  for (const data of readBundle(path.join(BUNDLES, `localization-string-tables-${game}_assets_all.bundle`))) for (const e of scanEntries(data)) m.set(e.id, e.text);
  tables[site] = m;
}
const raw = (lang, key) => (key && shared.has(key) ? tables[lang].get(shared.get(key)) : undefined);

/** Il testo del gioco nella notazione del sito. */
function render(lang, text, args) {
  if (text == null) return undefined;
  return text
    .replace(/\{kw_([A-Za-z]+)\}/g, (m, k) => raw(lang, `StringKey_Keyword_${k}_Name`) ?? m)
    .replace(/\{(Description[A-Za-z0-9]*)\}/g, (m, k) => (args[k] !== undefined ? String(args[k]) : m))
    .replace(/<sprite name=power>/g, "⚔️")
    .replace(/<sprite name=health>/g, "❤️")
    .replace(/<sprite name="?[A-Za-z]+"?>\s*/g, "")
    .replace(/<\/?(?:nobr|b|i|u)>|<\/?color(?:=[^>]+)?>|<\/?size(?:=[^>]+)?>/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
}
const french = (s) => s.replace(/ ([:;?!])/g, `${NBSP}$1`).replace(/« /g, `«${NBSP}`).replace(/ »/g, `${NBSP}»`);

const dir = cardDir();
const version = path.basename(path.dirname(dir));
const cards = [];
for (const f of readdirSync(dir)) {
  if (!f.startsWith("GameData_CardBase_Data_")) continue;
  const j = JSON.parse(readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, ""));
  const args = j.DescriptionArguments ?? {};
  const c = { key: j.Key, name: j.Name, status: j.Status, collectible: j.IsCollectible, type: j.Type, rarity: j.Rarity, legendary: j.Trait === "Legendary", alignment: j.SubType, mana: j.ManaCost, power: j.Power, health: j.Health, text: {}, legendaryPower: {} };
  for (const l of Object.keys(LANGS)) {
    c.text[l] = j.AbilityDescription ? render(l, raw(l, j.AbilityDescriptionLocKey) ?? (l === "en" ? j.AbilityDescription : undefined), args) : "";
    // il potere leggendario come lo mostra la finestra della carta nella collezione
    const power = render(l, raw(l, `StringKey_Keyword_LegendaryPower_${j.Key}_Description`), args);
    if (power) c.legendaryPower[l] = power;
  }
  cards.push(c);
}
const collection = cards
  .filter((c) => c.status === "Active" && c.collectible && c.type !== "Commander" && !/^H\d/.test(c.key))
  .sort((a, b) => a.mana - b.mana || a.name.localeCompare(b.name));

const today = new Date().toISOString().slice(0, 10).split("-").reverse().join("/");
for (const [lang, label] of Object.entries(NAMES)) {
  const lines = [
    `# Testi ufficiali delle carte in ${label}, dati del gioco ${version}, letti in data ${today} dalle tabelle delle traduzioni del gioco (cartella d'installazione, sola lettura) con scripts/game-texts.mjs: tutte le ${collection.length} carte della collezione.`,
    "# Formato: Nome carta<TAB>testo, \\n = a capo nella carta; statistiche nella notazione del sito (⚔️ ❤️); le carte senza testo hanno solo il nome.",
    "# Il testo è trascritto com'è, anche dove il gioco non è coerente. Si rigenera dai file del gioco (procedura in docs/testi-di-gioco.md).",
  ];
  for (const c of collection) {
    const t = lang === "fr" ? french(c.text[lang] ?? "") : (c.text[lang] ?? "");
    lines.push(t ? `${c.name}\t${t.split("\n").join("\\n")}` : c.name);
  }
  writeFileSync(path.join(ROOT, "docs", "testi-ufficiali", `${lang}.tsv`), lines.join("\n") + "\n");
}
if (opt("--json")) writeFileSync(path.resolve(opt("--json")), JSON.stringify({ version, cards }, null, 1));
console.log(`Dati del gioco ${version}: ${collection.length} carte della collezione, ${cards.length} in tutto. Trascrizioni scritte in docs/testi-ufficiali/.`);
