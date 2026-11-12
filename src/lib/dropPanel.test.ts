/**
 * Test dell'altezza dei pannelli delle tendine dell'header (12/11/2026): `node --test src/lib/dropPanel.test.ts`.
 * La tendina "Menu" del telefono era più alta dello schermo e non scorreva (ultime voci irraggiungibili): qui il conto
 * dello spazio (`panelRoom`) e i controlli sui sorgenti, perché un menu nuovo senza `.drop-fit` uscirebbe di nuovo
 * dallo schermo senza che nessun altro test se ne accorga.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { DROP_MAX_H_VAR, PANEL_BOTTOM_MARGIN, PANEL_GAP, PANEL_MIN_HEIGHT, panelRoom } from "./dropPanel.ts";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

/** Tutti i .tsx sotto una cartella del repo (percorsi dalla radice). */
function tsxFiles(dir: string): string[] {
  return readdirSync(new URL(`${dir}/`, root), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tsxFiles(`${dir}/${e.name}`) : e.name.endsWith(".tsx") ? [`${dir}/${e.name}`] : []));
}

describe("spazio per il pannello", () => {
  test("telefono da 667 px: con la barra del Kickstarter sopra l'header e con l'header già in cima", () => {
    // il tasto Menu finisce a 118 px con la barra (73 px) sopra l'header, a 45 px quando l'header è fisso in cima
    assert.equal(panelRoom({ innerHeight: 667, visualHeight: 667, summaryBottom: 118 }), 667 - 118 - PANEL_GAP - PANEL_BOTTOM_MARGIN);
    assert.equal(panelRoom({ innerHeight: 667, visualHeight: 667, summaryBottom: 45 }), 602);
    // la tendina di prima era alta 923 px: nei due casi lo spazio è meno, quindi il pannello scorre
    assert.ok(panelRoom({ innerHeight: 844, visualHeight: 844, summaryBottom: 45 }) < 923);
  });
  test("vale lo schermo più piccolo fra innerHeight e quello visibile; senza visualViewport basta innerHeight", () => {
    assert.equal(panelRoom({ innerHeight: 667, visualHeight: 611, summaryBottom: 45 }), 611 - 45 - 20, "barra degli indirizzi del telefono in vista");
    assert.equal(panelRoom({ innerHeight: 611, visualHeight: 667, summaryBottom: 45 }), 611 - 45 - 20);
    assert.equal(panelRoom({ innerHeight: 800, summaryBottom: 45 }), 735);
    assert.equal(panelRoom({ innerHeight: 800, visualHeight: null, summaryBottom: 45 }), 735);
    assert.equal(panelRoom({ innerHeight: 800, visualHeight: Number.NaN, summaryBottom: 45 }), 735);
  });
  test("mai sotto il minimo: telefono in orizzontale, pagina ingrandita, numeri che non tornano", () => {
    assert.equal(panelRoom({ innerHeight: 375, visualHeight: 375, summaryBottom: 45 }), 310, "telefono in orizzontale: lo spazio c'è, il pannello scorre");
    assert.equal(panelRoom({ innerHeight: 375, visualHeight: 180, summaryBottom: 45 }), PANEL_MIN_HEIGHT, "pagina ingrandita con le dita");
    assert.equal(panelRoom({ innerHeight: 667, visualHeight: 667, summaryBottom: 900 }), PANEL_MIN_HEIGHT, "tasto sotto il fondo dello schermo");
    assert.equal(panelRoom({ innerHeight: Number.NaN, summaryBottom: 45 }), PANEL_MIN_HEIGHT);
    assert.equal(panelRoom({ innerHeight: 667, summaryBottom: Number.NaN }), PANEL_MIN_HEIGHT);
    assert.equal(panelRoom({ innerHeight: 0, visualHeight: 0, summaryBottom: 0 }), PANEL_MIN_HEIGHT);
  });
  test("sempre un numero intero di pixel", () => {
    const room = panelRoom({ innerHeight: 667.5, visualHeight: 666.75, summaryBottom: 44.4 });
    assert.equal(room, Math.floor(666.75 - 44.4 - 20));
    assert.ok(Number.isInteger(room));
  });
});

describe("i menu dell'header usano il pannello che scorre", () => {
  test(".drop-fit: altezza dalla variabile, riserva senza JavaScript, scorrimento solo in verticale", () => {
    const css = read("src/app/globals.css");
    const block = /\n  \.drop-fit \{([^}]*)\}/.exec(css)?.[1] ?? "";
    assert.equal(DROP_MAX_H_VAR, "--drop-max-h");
    assert.match(block, /max-height: var\(--drop-max-h, calc\(100vh - 4\.5rem\)\);/);
    assert.match(block, /overflow-y: auto;/);
    assert.match(block, /overflow-x: hidden;/);
    assert.match(block, /overscroll-behavior: contain;/);
    // dove il browser conosce dvh (barra degli indirizzi del telefono) la riserva usa quello
    assert.match(css, /@supports \(height: 100dvh\) \{\s*\.drop-fit \{\s*max-height: var\(--drop-max-h, calc\(100dvh - 4\.5rem\)\);/);
  });
  test("AutoCloseDetails calcola lo spazio prima di aprirsi e lo scrive nella variabile", () => {
    const src = read("src/components/AutoCloseDetails.tsx");
    assert.match(src, /el\.style\.setProperty\(DROP_MAX_H_VAR, `\$\{room\}px`\)/);
    assert.match(src, /<summary [^>]*onClick=\{fit\}/, "il conto parte al clic sul tasto, prima dell'apertura");
    assert.match(src, /window\.addEventListener\("scroll", onChange, \{ passive: true \}\)/, "a menu aperto segue lo scorrimento della pagina");
    assert.match(src, /visual\?\.addEventListener\("resize", onChange\)/);
    assert.match(src, /if \(ref\.current\?\.open\) fit\(\);/, "una tendina aperta prima che la pagina fosse pronta si corregge al montaggio");
  });
  test("con una tendina aperta l'header sta sopra i riquadri fissi in basso; le lingue del telefono stanno su una riga", () => {
    const header = read("src/components/Header.tsx");
    // tasto dei feedback (z-40, dopo l'header nel documento), banner dei cookie e invito dopo la copia (z-50)
    assert.match(header, /<header className="sticky top-0 z-40 [^"]*has-\[details\[open\]\]:z-\[60\]"/);
    assert.match(read("src/components/FeedbackWidget.tsx"), /className=\{`btn btn-ink fixed right-4 z-40 /);
    assert.match(read("src/components/CookieBanner.tsx"), /fixed inset-x-0 bottom-0 z-50 /);
    // sotto i 640 px la tendina è larga quanto serve alla fila delle lingue, mai più dello schermo; da 640 px resta di 240
    assert.match(header, /<nav className="drop-fit absolute right-0 mt-2 w-76 max-w-\[calc\(100vw-1\.5rem\)\] [^"]* sm:w-60"/);
    const pills = read("src/components/LocaleSwitcher.tsx");
    assert.match(pills, /flex flex-wrap items-center gap-0\.5 rounded-2xl border/, "se non ci stanno, le lingue vanno a capo dentro il riquadro");
    assert.match(pills, /className=\{`whitespace-nowrap rounded-full px-1\.5 py-1 font-mono/, "zh-cn non si spezza sul trattino");
  });
  test("ogni tendina fatta con AutoCloseDetails ha il pannello con .drop-fit", () => {
    const users = [...tsxFiles("src/components"), ...tsxFiles("src/app")].filter((f) => !f.endsWith("/AutoCloseDetails.tsx") && /<AutoCloseDetails\b/.test(read(f)));
    assert.deepEqual(users.sort(), ["src/components/AccountMenu.tsx", "src/components/Header.tsx", "src/components/LocaleSwitcher.tsx"]);
    for (const file of users) {
      const src = read(file);
      const menus = src.match(/<AutoCloseDetails\b/g)?.length ?? 0;
      const panels = src.match(/<nav [^>]*className="drop-fit absolute /g)?.length ?? 0;
      assert.equal(panels, menus, `${file}: ${menus} tendine, ${panels} pannelli con .drop-fit`);
    }
  });
});
