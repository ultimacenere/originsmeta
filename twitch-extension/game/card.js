/* OriginsMeta Deck tracker: la carta del gioco (generato da tracker/scripts/twitch-panels.mjs da src/game-card/, non modificare a mano) */
"use strict";
(() => {
  // ../src/game-card/model.ts
  var ALIGN_LABEL = {
    en: { good: "Good", evil: "Evil" },
    it: { good: "Buono", evil: "Malvagio" },
    es: { good: "Bueno", evil: "Malvado" },
    fr: { good: "Bon", evil: "Mauvais" },
    pt: { good: "Bom", evil: "Maligno" },
    de: { good: "Gut", evil: "B\xF6se" },
    ru: { good: "\u0414\u043E\u0431\u0440\u044B\u0439", evil: "\u0417\u043B\u043E\u0439" },
    "zh-cn": { good: "\u5584\u826F", evil: "\u90AA\u6076" }
  };
  var KEYWORDS = [
    ...["On Reveal", "On Death", "On Kill", "Ongoing", "First Strike", "Double Attack", "Deathtouch", "Defender", "Discard", "Rebirth"],
    ...["Shield", "Snipe", "Stun", "Summon", "Trample", "Vanilla", "Relentless"],
    ...["Alla rivelazione", "Alla morte", "All'uccisione", "Primo colpo", "Doppio attacco", "Tocco letale", "Difensore", "Rinascita"],
    ...["Scudo", "Tiro di precisione", "Stordisci", "Travolgere"],
    ...["Al revelar", "Al morir", "Al matar", "Primer golpe", "Ataque doble", "Toque mortal", "Defensor", "Renacer", "Escudo"],
    ...["Disparo certero", "Aturde", "Arrollar"],
    ...["\xC0 la r\xE9v\xE9lation", "\xC0 la mort", "\xC0 l'\xE9limination", "Premi\xE8re frappe", "Double attaque", "Contact mortel", "D\xE9fenseur", "Renaissance"],
    ...["Bouclier", "Tir de pr\xE9cision", "\xC9tourdissez", "Pi\xE9tinement"],
    ...["Ao revelar", "Ao morrer", "Ao matar", "Primeiro golpe", "Ataque duplo", "Toque mort\xEDfero", "Renascimento"],
    ...["Tiro certeiro", "Atordoa", "Atropelar"],
    ...["Beim Aufdecken", "Bei Tod", "Bei Vernichtung", "Erstschlag", "Doppelangriff", "Todesber\xFChrung", "Verteidiger", "Wiedergeburt"],
    ...["Schild", "Pr\xE4zisionsschuss", "Bet\xE4ube", "\xDCberrennen"]
  ];
  var KEYWORDS_RU = [
    ...["\u041F\u0440\u0438 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u0438\u0438", "\u041F\u0440\u0438 \u0441\u043C\u0435\u0440\u0442\u0438", "\u041F\u0440\u0438 \u0443\u0431\u0438\u0439\u0441\u0442\u0432\u0435", "\u041F\u0435\u0440\u0432\u044B\u0439 \u0443\u0434\u0430\u0440", "\u041F\u0435\u0440\u0432\u044B\u043C \u0443\u0434\u0430\u0440\u043E\u043C", "\u041F\u0435\u0440\u0432\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430"],
    ...["\u0414\u0432\u043E\u0439\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430", "\u0414\u0432\u043E\u0439\u043D\u0443\u044E \u0430\u0442\u0430\u043A\u0443", "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u0430\u0442\u0430\u043A\u043E\u0439", "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u0430\u0442\u0430\u043A\u0438"],
    ...["\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u0430\u0441\u0430\u043D\u0438\u0435", "\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u043A\u0430\u0441\u0430\u043D\u0438\u0435\u043C", "\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043A\u0430\u0441\u0430\u043D\u0438\u044F", "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A", "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A\u0430", "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A\u043E\u043C"],
    ...["\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u0435", "\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u0435\u043C", "\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F", "\u0429\u0438\u0442", "\u0429\u0438\u0442\u0430", "\u0429\u0438\u0442\u043E\u043C"],
    ...["\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u043E\u0439 \u0443\u0434\u0430\u0440", "\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u044B\u043C \u0443\u0434\u0430\u0440\u043E\u043C", "\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430"],
    ...["\u041C\u0435\u0442\u043A\u0438\u0439 \u0432\u044B\u0441\u0442\u0440\u0435\u043B", "\u041C\u0435\u0442\u043A\u0438\u043C \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u043E\u043C", "\u041C\u0435\u0442\u043A\u043E\u0433\u043E \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u0430", "\u041E\u0433\u043B\u0443\u0448\u0430\u0435\u0442", "\u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u0435", "\u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u044F"]
  ];
  var KEYWORDS_ZH = ["\u5C55\u793A\u65F6", "\u63ED\u793A\u65F6", "\u6B7B\u4EA1\u65F6", "\u51FB\u6740\u65F6", "\u5148\u653B", "\u8FDE\u51FB", "\u53CC\u91CD\u653B\u51FB", "\u6B7B\u89E6", "\u5B88\u62A4\u8005", "\u5B88\u536B", "\u91CD\u751F", "\u62A4\u76FE", "\u8DF5\u8E0F", "\u72D9\u51FB", "\u7729\u6655", "\u6301\u7EED"];
  var escRe = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var longFirst = (a, b) => b.length - a.length;
  var KW = [
    ...[...KEYWORDS].sort(longFirst).map(escRe),
    `(?<![\u0410-\u042F\u0401\u0430-\u044F\u0451])(?:${[...KEYWORDS_RU].sort(longFirst).map(escRe).join("|")})(?![\u0410-\u042F\u0401\u0430-\u044F\u0451])`,
    ...[...KEYWORDS_ZH].sort(longFirst).map(escRe)
  ].join("|");
  var ATK = "(?:\u2694\uFE0F|\u2694)";
  var HP = "(?:\u2764\uFE0F|\u2764|\u2665)";
  var DAMAGE = "(?:damage|danni|danno|de da\xF1o|de dano|d\xE9g\xE2ts|d\xE9g\xE2t|Schaden)";
  var ANY = "\\bANY\\b|\\bQUALSIASI\\b|\\bCUALQUIER\\b|\\bQUALQUER\\b|\\bBELIEBIGE[NMRS]?\\b|N'IMPORTE QUELLE?|(?<![\u0410-\u042F\u0401\u0430-\u044F\u0451])\u041B\u042E\u0411(?:\u041E\u0419|\u0423\u042E|\u041E\u0415|\u041E\u0413\u041E|\u041E\u041C\u0423|\u041E\u041C|\u042B\u0415|\u042B\u0425|\u042B\u041C|\u042B\u041C\u0418)(?![\u0410-\u042F\u0401\u0430-\u044F\u0451])|\u4EFB\u610F";
  var HEAL = "\\b(?:[Hh]eal|[Cc]ura|[Ss]oignez|[Ss]oigne|[Hh]eilt?|[Cc]ure) \\d+\\b";
  var TOKEN = new RegExp(
    `(\\[[+-]?\\d+ ?${ATK}/[+-]?\\d+ ?${HP}\\]|[+-]?\\d+ ?${ATK}/[+-]?\\d+ ?${HP}|(?:${KW}):?|[+-]?\\d+ ?(?:${ATK}|${HP})|\\b\\d+ ${DAMAGE}\\b|\\b\\d+ (?:\u0435\u0434\\. )?\u0443\u0440\u043E\u043D\u0430?(?![\u0410-\u042F\u0401\u0430-\u044F\u0451])|\\d+ ?\u70B9\u4F24\u5BB3|${HEAL}|${ANY}|${ATK}|${HP})`,
    "g"
  );
  var el = (tag, cls, kids, extra) => ({ tag, cls, kids, ...extra });
  var txt = (text) => ({ text });
  var svgEl = (tag, attrs, style, kids) => ({ tag, svg: true, attrs, style, kids });
  function icon(kind) {
    return svgEl("svg", { class: `omg-ico omg-ico--${kind}`, viewBox: kind === "atk" ? "0 0 40 72" : "0 0 60 52", "aria-hidden": "true" }, void 0, [
      svgEl("path", {
        d: kind === "atk" ? "M20 1 L31 13 L31 46 L9 46 L9 13 Z M1.5 45 H38.5 V54 H1.5 Z M14.5 53 H25.5 V65 H14.5 Z" : "M30 50 C22 42 4 31 4 17 C4 8 11 3 18 3 C24 3 28 7 30 11 C32 7 36 3 42 3 C49 3 56 8 56 17 C56 31 38 42 30 50 Z"
      })
    ]);
  }
  function abilityNodes(text) {
    return String(text || "").split("\n").map((line) => {
      const kids = [];
      line.split(TOKEN).forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 0) {
          kids.push(txt(part));
          return;
        }
        const pair = part.match(new RegExp(`^(\\[?)([+-]?\\d+) ?${ATK}/([+-]?\\d+) ?${HP}(\\]?)$`));
        if (pair) {
          kids.push(el("span", "omg-nowrap", [txt(pair[1] + pair[2]), icon("atk"), txt("/" + pair[3]), icon("hp"), ...pair[4] ? [txt(pair[4])] : []]));
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
      return el("p", void 0, kids);
    });
  }
  function textSize(text) {
    const n = String(text || "").length;
    return n > 160 ? "is-xxlong" : n > 115 ? "is-xlong" : n > 80 ? "is-long" : "";
  }
  function nameSize(name) {
    return name.length > 19 ? "is-xlong" : name.length > 14 ? "is-long" : "";
  }
  var idOf = (slug, part) => `omg-${slug.replace(/[^a-z0-9-]/g, "")}-${part}`;
  var stop = (offset, color) => svgEl("stop", { offset }, { "stop-color": color });
  function grad(id, colors) {
    return svgEl("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, void 0, [stop("0", colors[0]), stop("0.5", colors[1]), stop("1", colors[2])]);
  }
  function gem(c) {
    const id = idOf(c.slug, c.legendary ? "gold" : "gem");
    const w = c.legendary ? 212 : 100;
    const cx = w / 2;
    const hex = (r, ry) => [[0, -ry], [r, -ry / 2], [r, ry / 2], [0, ry], [-r, ry / 2], [-r, -ry / 2]].map(([x, y]) => `${(cx + x).toFixed(1)},${(54 + y).toFixed(1)}`).join(" ");
    const ring = { fill: `url(#${id})` };
    const edge = { stroke: "var(--omg-shadow)" };
    const kids = [
      svgEl("defs", {}, void 0, [
        grad(id, c.legendary ? ["var(--omg-gem-gold-hi)", "var(--omg-gem-gold)", "var(--omg-gem-gold-lo)"] : ["var(--omg-gem-ring-hi)", "var(--omg-gem-ring)", "var(--omg-gem-ring-lo)"])
      ])
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
    return el("span", "omg-gem", [svgEl("svg", { viewBox: `0 0 ${w} 108`, preserveAspectRatio: "xMidYMid meet" }, void 0, kids), el("span", "omg-gem-num", [txt(c.cost === null ? "\u2013" : String(c.cost))])], { attrs: { "aria-hidden": "true" } });
  }
  function sword(slug) {
    const id = idOf(slug, "atk");
    const a = { fill: `url(#${id})`, class: "omg-stat-fill", "stroke-width": "3.2" };
    return svgEl("svg", { class: "omg-sword", viewBox: "0 0 40 72", "aria-hidden": "true" }, void 0, [
      svgEl("defs", {}, void 0, [grad(id, ["var(--omg-stat-hi)", "var(--omg-stat)", "var(--omg-stat-lo)"])]),
      svgEl("path", { d: "M20 1 L31 13 L31 46 L9 46 L9 13 Z", ...a }),
      svgEl("path", { d: "M20 9 L20 43", "stroke-width": "2.4", "stroke-linecap": "round" }, { stroke: "rgba(255,255,255,.55)" }),
      svgEl("rect", { x: "1.5", y: "45", width: "37", height: "9", rx: "3", ...a }),
      svgEl("rect", { x: "14.5", y: "53", width: "11", height: "12", rx: "2", ...a }),
      svgEl("circle", { cx: "20", cy: "67", r: "5", ...a })
    ]);
  }
  function heart(slug) {
    const id = idOf(slug, "hp");
    return svgEl("svg", { class: "omg-heart", viewBox: "0 0 60 52", "aria-hidden": "true" }, void 0, [
      svgEl("defs", {}, void 0, [grad(id, ["var(--omg-stat-hi)", "var(--omg-stat)", "var(--omg-stat-lo)"])]),
      svgEl("path", { d: "M30 50 C22 42 4 31 4 17 C4 8 11 3 18 3 C24 3 28 7 30 11 C32 7 36 3 42 3 C49 3 56 8 56 17 C56 31 38 42 30 50 Z", fill: `url(#${id})`, class: "omg-stat-fill", "stroke-width": "3.4" }),
      svgEl("path", { d: "M11 15 C11 11 14 8 19 8", fill: "none", "stroke-width": "2.6", "stroke-linecap": "round" }, { stroke: "rgba(255,255,255,.6)" })
    ]);
  }
  var num = (v) => el("span", "omg-num", [txt(v === null ? "\u2013" : String(v))]);
  function gameCardTree(c, lang, className = "") {
    const spell = c.type === "spell";
    const body = [
      el("div", "omg-art" + (c.art ? "" : " is-noimg"), c.art ? [el("img", void 0, void 0, { attrs: { src: c.art, alt: "", decoding: "async", loading: "lazy", draggable: "false" } })] : []),
      el("div", "omg-plate"),
      el("p", ("omg-name " + nameSize(c.name)).trim(), [txt(c.name)])
    ];
    if (!spell && (c.alignment === "good" || c.alignment === "evil")) {
      body.push(el("p", "omg-band", [txt(ALIGN_LABEL[lang][c.alignment])], { attrs: { "data-align": c.alignment } }));
    } else {
      body.push(el("span", "omg-dash" + (spell ? "" : " is-neutral")));
    }
    body.push(el("div", ("omg-text " + textSize(c.text)).trim(), abilityNodes(c.text)));
    const kids = [el("div", "omg-frame"), el("div", "omg-body", body)];
    if (!spell && (c.power !== null || c.health !== null)) {
      kids.push(el("div", "omg-stats", [el("span", "omg-stat", [num(c.power), sword(c.slug)]), el("span", "omg-stat", [heart(c.slug), num(c.health)])]));
    }
    kids.push(gem(c));
    return el("div", `omg-card omg-card--${spell ? "spell" : "unit"}${c.legendary ? " is-leg" : ""}${className ? " " + className : ""}`, kids, { attrs: { lang } });
  }
  function gameCardLabel(c, words) {
    const out = [c.name];
    if (c.cost !== null) out.push(`${words.cost} ${c.cost}`);
    if (c.power !== null) out.push(`${words.power} ${c.power}`);
    if (c.health !== null) out.push(`${words.health} ${c.health}`);
    return out.join(", ");
  }

  // ../src/game-card/dom.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
  function make(n) {
    if (!n.tag) return document.createTextNode(n.text ?? "");
    const e = n.svg ? document.createElementNS(SVG_NS, n.tag) : document.createElement(n.tag);
    if (n.cls) e.setAttribute("class", n.cls);
    for (const [k, v] of Object.entries(n.attrs ?? {})) e.setAttribute(k, v);
    for (const [k, v] of Object.entries(n.style ?? {})) e.style.setProperty(k, v);
    if (n.text !== void 0) e.textContent = n.text;
    for (const k of n.kids ?? []) e.appendChild(make(k));
    return e;
  }
  function fit(card) {
    const box = card.querySelector(".omg-text");
    if (!box || !box.isConnected || !box.clientHeight) return;
    box.style.fontSize = "";
    const w = card.clientWidth || 1;
    let size = parseFloat(getComputedStyle(box).fontSize) / w * 100;
    for (let i = 0; i < 12 && box.scrollHeight > box.clientHeight + 1 && size > 3.6; i++) {
      size *= 0.94;
      box.style.fontSize = `${size.toFixed(2)}cqw`;
    }
  }
  function build(c, lang, className = "") {
    const card = make(gameCardTree(c, lang, className));
    card.querySelector(".omg-art img")?.addEventListener("error", (e) => e.target.parentElement?.classList.add("is-noimg"));
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => fit(card));
    if (typeof document !== "undefined" && document.fonts) void document.fonts.ready.then(() => fit(card));
    return card;
  }

  // ../src/game-card/browser.ts
  window.OMGameCard = { build, fit, label: gameCardLabel };
})();
