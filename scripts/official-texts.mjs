// Confronta i testi ufficiali delle carte letti nel gioco con quelli di `src/lib/data/card-lore.ts` e, a richiesta,
// li scrive nel file. Serve alla verifica da rifare dopo ogni patch (procedura in docs/testi-di-gioco.md).
//
//   node scripts/official-texts.mjs <it|es>            elenca le carte il cui testo è diverso da quello del gioco
//   node scripts/official-texts.mjs <it|es> --apply    scrive in card-lore.ts il testo del gioco
//   --file <percorso>                                  trascrizione da usare (predefinita: docs/testi-ufficiali/<lingua>.tsv)
//
// La trascrizione ha una riga per carta: "Nome<TAB>testo", con \n letterale per gli a capo; le carte senza testo
// hanno solo il nome, le righe che iniziano con # sono commenti. Devono esserci tutte le carte attive della Demo.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "package.json"));
const ts = require("typescript");

const args = process.argv.slice(2);
const lang = args[0];
if (!["it", "es"].includes(lang)) {
  console.error("Uso: node scripts/official-texts.mjs <it|es> [--apply] [--file <trascrizione>]");
  process.exit(1);
}
const apply = args.includes("--apply");
const fileArg = args.indexOf("--file");
const source = fileArg >= 0 ? path.resolve(args[fileArg + 1]) : path.join(ROOT, "docs", "testi-ufficiali", `${lang}.tsv`);

const official = new Map();
for (const line of fs.readFileSync(source, "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const tab = line.indexOf("\t");
  const name = (tab < 0 ? line : line.slice(0, tab)).trim();
  official.set(name, tab < 0 ? "" : line.slice(tab + 1).trim().split("\\n").join("\n"));
}

const woo = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/data/woo-cards.json"), "utf8"));
const active = woo.cards.filter((c) => c.status === "active" && c.type !== "token" && !c.tokenOnly);
const file = path.join(ROOT, "src/lib/data/card-lore.ts");
const src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);

const lore = new Map();
sf.forEachChild(function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(sf) === "cardLore") {
    for (const p of node.initializer.properties) lore.set(p.name.text ?? p.name.getText(sf), p.initializer);
  }
  ts.forEachChild(node, visit);
});

const template = (s) => "`" + s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
const literal = (s) => (s.includes("\n") ? template(s) : JSON.stringify(s));
const value = (n) => n.text.replace(/\r\n/g, "\n");

const edits = [];
const problems = [];
const diffs = [];
let same = 0;
for (const card of active) {
  const text = official.get(card.name);
  if (text === undefined) {
    problems.push(`${card.name}: manca nella trascrizione`);
    continue;
  }
  if (!text) continue; // carta senza testo
  const entry = lore.get(card.slug);
  const props = entry ? new Map(entry.properties.filter(ts.isPropertyAssignment).map((p) => [p.name.getText(sf), p])) : new Map();
  const prop = props.get(lang);
  if (!prop) {
    problems.push(`${card.name}: nessun campo ${lang} in card-lore.ts`);
    continue;
  }
  const en = props.get("en") ? value(props.get("en").initializer) : card.ability ?? "";
  if (en.split("\n").length !== text.split("\n").length) {
    problems.push(`${card.name}: ${en.split("\n").length} righe in inglese, ${text.split("\n").length} nella trascrizione`);
  }
  const ours = value(prop.initializer);
  if (ours === text) {
    same++;
    continue;
  }
  diffs.push(`${card.name}\n  sito:  ${ours.replace(/\n/g, " ⏎ ")}\n  gioco: ${text.replace(/\n/g, " ⏎ ")}`);
  edits.push({ start: prop.initializer.getStart(sf), end: prop.initializer.getEnd(), text: literal(text) });
}

if (diffs.length) console.log(diffs.join("\n"));
console.log(`\n${lang}: ${same} testi uguali al gioco, ${edits.length} diversi (${path.relative(ROOT, source)})`);
if (problems.length) console.log(`Da controllare:\n- ${problems.join("\n- ")}`);
if (apply) {
  if (problems.length) {
    console.error("Niente scritto: prima vanno risolti i punti da controllare.");
    process.exit(1);
  }
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text.replace(/\r?\n/g, eol) + out.slice(e.end);
  fs.writeFileSync(file, out);
  console.log(`card-lore.ts aggiornato (${edits.length} testi).`);
}
