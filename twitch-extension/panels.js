/* OriginsMeta Deck tracker: i pannelli dell'app OriginsMeta Tracker (generato da tracker/scripts/twitch-panels.mjs, non modificare a mano) */
"use strict";
(() => {
  // ../src/lib/tracker/live.ts
  var KEY_RE = /^C\d{5}_[A-Z]{2}$/;
  var LIVE_STATE_VERSION = 1;
  var LIVE_LIMITS = { deckCards: 13, seen: 30, name: 40, copies: 3 };
  var LIVE_TEMPLATES = ["classic", "strips", "columns", "custom"];
  var BOARD_SIZE = 18;
  var clean = (s) => {
    const t = (s ?? "").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").trim().slice(0, LIVE_LIMITS.name);
    return t || null;
  };
  var int = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  var bool = (b) => typeof b === "boolean";
  function readLiveCustom(raw) {
    const c = raw;
    if (!c || typeof c !== "object") return null;
    const me = c.me;
    const opp = c.opp;
    if (c.orientation !== "vertical" && c.orientation !== "horizontal") return null;
    if (c.cards !== "art" && c.cards !== "names") return null;
    if (!int(c.perRow, 1, 13) || !int(c.opacity, 0, 100) || !bool(c.hideOut)) return null;
    if (!me || typeof me !== "object" || !bool(me.legendary) || !bool(me.deckLeft) || !bool(me.life)) return null;
    if (!opp || typeof opp !== "object" || !bool(opp.legendary) || !bool(opp.deckLeft) || !bool(opp.life) || !bool(opp.mana)) return null;
    return {
      orientation: c.orientation,
      cards: c.cards,
      perRow: c.perRow,
      opacity: c.opacity,
      hideOut: c.hideOut,
      me: { legendary: me.legendary, deckLeft: me.deckLeft, life: me.life },
      opp: { legendary: opp.legendary, deckLeft: opp.deckLeft, life: opp.life, mana: opp.mana }
    };
  }
  var readRect = (raw) => {
    const r = raw;
    return r && typeof r === "object" && int(r.x, -2e4, 4e4) && int(r.y, -2e4, 4e4) && int(r.w, 1, 2e4) && int(r.h, 1, 2e4) ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
  };
  function readLiveUi(raw) {
    const u = raw;
    if (!u || typeof u !== "object" || !LIVE_TEMPLATES.includes(u.template) || !bool(u.hidden) || !bool(u.scanner)) return null;
    const screen = u.screen;
    if (!screen || typeof screen !== "object" || !int(screen.w, 100, 2e4) || !int(screen.h, 100, 2e4)) return null;
    const panels = u.panels;
    if (!panels || typeof panels !== "object") return null;
    const custom = u.custom === null ? null : readLiveCustom(u.custom);
    if (u.custom !== null && !custom) return null;
    return { template: u.template, custom, hidden: u.hidden, scanner: u.scanner, screen: { w: screen.w, h: screen.h }, panels: { deck: readRect(panels.deck), opp: readRect(panels.opp) } };
  }
  var readMana = (raw) => {
    if (raw === null) return null;
    const m = raw;
    return m && typeof m === "object" && int(m.max, 1, 20) && int(m.current, 0, m.max) ? { current: m.current, max: m.max } : void 0;
  };
  var lifeOk = (n) => n === null || int(n, 0, 2);
  function parseLiveState(raw) {
    if (!raw || typeof raw !== "object") return null;
    const s = raw;
    if (s.v !== LIVE_STATE_VERSION) return null;
    const key = (k) => typeof k === "string" && KEY_RE.test(k);
    let deck = null;
    if (s.deck !== null) {
      const d = s.deck;
      if (!d || typeof d !== "object" || !Array.isArray(d.cards) || d.cards.length > LIVE_LIMITS.deckCards) return null;
      if (d.name !== null && typeof d.name !== "string") return null;
      if (d.legendary !== null && !key(d.legendary)) return null;
      const cards = [];
      for (const c of d.cards) {
        if (!Array.isArray(c) || c.length !== 4 || !key(c[0]) || !int(c[1], 0, LIVE_LIMITS.copies) || !int(c[2], 0, LIVE_LIMITS.copies) || !int(c[3], 0, LIVE_LIMITS.copies)) return null;
        cards.push([c[0], c[1], c[2], c[3]]);
      }
      deck = { name: clean(d.name), legendary: d.legendary ?? null, cards };
    }
    let live = null;
    if (s.live !== null) {
      const l = s.live;
      if (!l || typeof l !== "object" || typeof l.inMatch !== "boolean") return null;
      if (l.round !== null && !int(l.round, 0, 50)) return null;
      if (l.deckLeft !== null && !int(l.deckLeft, 0, 60)) return null;
      const o = l.opp;
      if (!o || typeof o !== "object" || !Array.isArray(o.seen) || o.seen.length > LIVE_LIMITS.seen) return null;
      if (o.legendary !== null && !key(o.legendary)) return null;
      if (o.deckLeft !== null && !int(o.deckLeft, 0, 60)) return null;
      const seen = [];
      for (const c of o.seen) {
        if (!Array.isArray(c) || c.length !== 2 || !key(c[0]) || !int(c[1], 1, 20)) return null;
        seen.push([c[0], c[1]]);
      }
      live = { inMatch: l.inMatch, round: l.round, deckLeft: l.deckLeft, opp: { legendary: o.legendary, deckLeft: o.deckLeft, seen } };
      const life = l.life;
      if (life && typeof life === "object" && lifeOk(life.me) && lifeOk(life.opp)) live.life = { me: life.me, opp: life.opp };
      const mana = l.mana;
      if (mana && typeof mana === "object") {
        const me = readMana(mana.me);
        const opp = readMana(mana.opp);
        if (me !== void 0 && opp !== void 0) live.mana = { me, opp };
      }
      if (l.direction === "left" || l.direction === "right" || l.direction === null) live.direction = l.direction;
      if (Array.isArray(l.board) && l.board.length === BOARD_SIZE && l.board.every((k) => k === null || key(k))) live.board = l.board;
      if (Array.isArray(l.hand) && l.hand.length <= 12 && l.hand.every((c) => Array.isArray(c) && c.length === 2 && key(c[0]) && typeof c[1] === "number" && c[1] >= 0 && c[1] <= 1))
        live.hand = l.hand.map(([k, x]) => [k, x]);
    }
    const ui = s.ui === void 0 ? null : readLiveUi(s.ui);
    return { v: LIVE_STATE_VERSION, deck, live, ...ui ? { ui } : {} };
  }
  var PUBSUB_MAX_BYTES = 5 * 1024;

  // src/overlay/deckRender.ts
  var shapeOf = (layout, view) => layout === "classic" ? view === "opp" ? "strips" : "columns" : layout;
  var LABELS = {
    en: {
      choose: "Choose a deck in the game",
      round: (n) => `Round ${n}`,
      opponent: "Opponent",
      oppWaiting: "The opponent's cards show up here, one by one, during the match.",
      oppTitle: "OriginsMeta \xB7 Opponent",
      cardState: (left, hand, played) => [`${left} in deck`, hand ? `${hand} in hand` : "", played ? `${played} played` : ""].filter(Boolean).join(" \xB7 "),
      ofDeck: (n) => `of ${n}`,
      deckLeft: "In deck",
      life: "Barriers",
      oppLeft: "Cards left",
      resize: "Drag to resize",
      spot: (opp) => opp ? "Opponent panel" : "Deck tracker",
      oppLeftTip: "Estimate: cards the opponent drew, counted from the face-down cards in their hand",
      mana: "Mana",
      you: "You",
      combat: "Combat",
      dir: (d) => d === "left" ? "right to left" : "left to right",
      noScanner: "Turn on the screen scanner in the app for live updates.",
      close: "Close",
      legendary: "Legendary",
      brand: "Tracker \xB7 not affiliated with Koin Games"
    },
    it: {
      choose: "Scegli un mazzo nel gioco",
      round: (n) => `Round ${n}`,
      opponent: "Avversario",
      oppWaiting: "Durante la partita qui compaiono, una alla volta, le carte dell'avversario.",
      oppTitle: "OriginsMeta \xB7 Avversario",
      cardState: (left, hand, played) => [`${left} nel mazzo`, hand ? `${hand} in mano` : "", played ? `${played} giocat${played === 1 ? "a" : "e"}` : ""].filter(Boolean).join(" \xB7 "),
      ofDeck: (n) => `su ${n}`,
      deckLeft: "Nel mazzo",
      life: "Barriere",
      oppLeft: "Carte rimanenti",
      resize: "Trascina per allargare",
      spot: (opp) => opp ? "Pannello dell'avversario" : "Deck tracker",
      oppLeftTip: "Stima: carte pescate dall'avversario, contate dalle carte coperte nella sua mano",
      mana: "Mana",
      you: "Tu",
      combat: "Combattimento",
      dir: (d) => d === "left" ? "da destra a sinistra" : "da sinistra a destra",
      noScanner: "Accendi lo scanner dello schermo nell'app per gli aggiornamenti dal vivo.",
      close: "Chiudi",
      legendary: "Leggendaria",
      brand: "Tracker \xB7 non affiliato a Koin Games"
    },
    es: {
      choose: "Elige un mazo en el juego",
      round: (n) => `Ronda ${n}`,
      opponent: "Rival",
      oppWaiting: "Durante la partida aqu\xED aparecen, una a una, las cartas del rival.",
      oppTitle: "OriginsMeta \xB7 Rival",
      cardState: (left, hand, played) => [`${left} en el mazo`, hand ? `${hand} en la mano` : "", played ? `${played} jugada${played === 1 ? "" : "s"}` : ""].filter(Boolean).join(" \xB7 "),
      ofDeck: (n) => `de ${n}`,
      deckLeft: "En el mazo",
      life: "Barreras",
      oppLeft: "Cartas restantes",
      resize: "Arrastra para cambiar el ancho",
      spot: (opp) => opp ? "Panel del rival" : "Deck tracker",
      oppLeftTip: "Estimaci\xF3n: cartas robadas por el rival, contadas por las cartas boca abajo de su mano",
      mana: "Man\xE1",
      you: "T\xFA",
      combat: "Combate",
      dir: (d) => d === "left" ? "de derecha a izquierda" : "de izquierda a derecha",
      noScanner: "Activa el esc\xE1ner de pantalla en la app para las actualizaciones en vivo.",
      close: "Cerrar",
      legendary: "Legendaria",
      brand: "Tracker \xB7 sin afiliaci\xF3n con Koin Games"
    }
  };
  var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function createDeckRenderer(opts) {
    const { view, inWindow } = opts;
    const L = LABELS[opts.lang];
    const keyAttr = (c) => c && /^C\d{5}_[A-Z]{2}$/.test(c.key) ? ` data-key="${c.key}"` : "";
    const cardImg = (c) => c?.slug ? `<span class="cardimg${c.legendary ? " is-legendary" : ""}"><img src="https://originsmeta.com/cards/${esc(c.slug)}.webp" alt="${esc(c.name)}" draggable="false" /><span class="cname">${esc(c.name)}</span></span>` : `<span class="cardimg empty" aria-hidden="true"></span>`;
    function myCard(c, live, cls = "") {
      const left = live ? Math.max(0, c.copies - c.drawn) : c.copies;
      const inHand = live ? Math.max(0, c.drawn - c.played) : 0;
      const state = left === 0 ? " out" : "";
      const hand = inHand > 0 ? " inhand" : "";
      const tip = live ? `${c.name} \xB7 ${L.cardState(left, inHand, c.drawn - inHand)}` : c.name;
      const count = left > 0 ? `<span class="left" aria-hidden="true">${left}</span>` : "";
      return `<li class="gc${state}${hand}${cls}" title="${esc(tip)}"${keyAttr(c)}>${cardImg(c)}${count}</li>`;
    }
    const lifePips = (n) => `<span class="pips" aria-label="${esc(L.life)} ${n ?? "?"}/2">${[0, 1].map((i) => `<i class="${n === null ? "unk" : i < n ? "on" : "lost"}"></i>`).join("")}</span>`;
    const stat = (value, label, tip = "") => `<div class="stat"${tip ? ` title="${esc(tip)}"` : ""}><b>${value}</b><span>${esc(label)}</span></div>`;
    function deckLeftStat(left, total) {
      if (left === null) return stat("\u2013", L.deckLeft);
      const pct = total > 0 ? Math.round(Math.min(left, total) / total * 100) : 0;
      return `<div class="stat deckleft"><b>${left}<small> ${esc(L.ofDeck(total))}</small></b><span class="bar" aria-hidden="true"><i data-w="${pct}"></i></span><span>${esc(L.deckLeft)}</span></div>`;
    }
    const manaText = (m) => m ? `${m.current}<small>/${m.max}</small>` : "\u2013";
    const arrowSvg = (d) => `<svg class="arrow${d === "left" ? " is-left" : ""}${d ? "" : " is-unknown"}" viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h8M14 8h8M26 8h18" /><path d="M42 2l12 6-12 6z" /></svg>`;
    function manaBox(live) {
      const dir = live?.direction ?? null;
      return `<div class="manabox" aria-label="${esc(L.mana)}">
        <div class="mrow is-opp"><i class="tick"></i><b>${manaText(live?.mana.opp ?? null)}</b><span>${esc(L.opponent)}</span></div>
        <div class="dir" title="${esc(dir ? `${L.combat}: ${L.dir(dir)}` : L.combat)}">${arrowSvg(dir)}<span>${esc(L.combat)}</span></div>
        <div class="mrow is-me"><i class="tick"></i><b>${manaText(live?.mana.me ?? null)}</b><span>${esc(L.you)}</span></div>
      </div>`;
    }
    const seenCard = (c) => `<li class="gc" title="${esc(c.name)}"${keyAttr(c)}>${cardImg(c)}${c.copies > 1 ? `<span class="left">\xD7${c.copies}</span>` : ""}</li>`;
    const miniLogo = `<img class="mini-logo" src="${esc(opts.logo ?? "logo-originsmeta-sm.webp")}" alt="OriginsMeta" width="48" height="15" draggable="false" />`;
    function myCards(v, zoom) {
      const leg = v.deck?.legendary ?? null;
      const live = Boolean(v.live);
      return `${leg ? myCard(leg, live, ` leg${zoom}`) : `<li class="gc leg">${cardImg(null)}</li>`}${(v.deck?.cards ?? []).map((c) => myCard(c, live)).join("")}`;
    }
    function oppCards(v) {
      const leg = v.live?.opponent.legendary ?? null;
      return `<li class="gc leg"${keyAttr(leg)}>${leg ? cardImg(leg) : `<span class="cardimg back" aria-hidden="true">?</span>`}</li>${(v.live?.opponent.seen ?? []).map(seenCard).join("")}`;
    }
    function tabContent() {
      const x = inWindow ? `<button type="button" class="tab-x" id="close" title="${esc(L.close)}" aria-label="${esc(L.close)}">\xD7</button>` : "";
      return view === "opp" ? `${miniLogo}${x}` : `${x}${miniLogo}`;
    }
    function stripPanel(v, zoom, grip, fine) {
      const seen = v.live?.opponent.seen.length ?? 0;
      const row = view === "opp" ? `${oppCards(v)}${seen ? "" : `<li class="swait">${esc(L.oppWaiting)}</li>`}` : v.deck ? myCards(v, zoom) : `<li class="swait">${esc(L.choose)}</li>`;
      return `<div class="tab stab">${tabContent()}</div><ul class="srow">${row}</ul>${fine}${grip}`;
    }
    function legBand(c, mine, live, zoom = "") {
      if (!c) return `<div class="legband unknown"><span class="ngem">?</span><span class="lb-name">${esc(L.legendary)}</span></div>`;
      const left = mine ? live ? Math.max(0, c.copies - c.drawn) : c.copies : 0;
      const inHand = mine && live ? Math.max(0, c.drawn - c.played) : 0;
      const state = `${mine && left === 0 ? " out" : ""}${inHand > 0 ? " inhand" : ""}${zoom}`;
      return `<div class="legband${state}"${c.slug ? ` data-art="${esc(c.slug)}"` : ""}${keyAttr(c)} title="${esc(c.name)}"><span class="ngem">${c.mana ?? "\u2013"}</span><span class="lb-name">\u2605 ${esc(c.name)}</span>${mine && left > 0 ? `<span class="lb-count">${left}</span>` : ""}</div>`;
    }
    function columnPanel(v, zoom, grip, fine) {
      const live = v.live;
      let body;
      if (view === "opp") {
        const left = live?.opponent.deckLeft;
        const seen = live?.opponent.seen ?? [];
        body = `${legBand(live?.opponent.legendary ?? null, false, Boolean(live))}${seen.length ? `<ul class="cgrid">${seen.map(seenCard).join("")}</ul>` : `<p class="muted cwait">${esc(L.oppWaiting)}</p>`}
      ${stat(left !== null && left !== void 0 ? String(left) : "\u2013", L.oppLeft, L.oppLeftTip)}
      ${manaBox(live)}`;
      } else if (v.deck) {
        const total = (v.deck.legendary?.copies ?? 0) + v.deck.cards.reduce((n, c) => n + c.copies, 0);
        body = `${v.deck.legendary ? legBand(v.deck.legendary, true, Boolean(live), zoom) : ""}<ul class="cgrid">${v.deck.cards.map((c) => myCard(c, Boolean(live))).join("")}</ul>${deckLeftStat(live?.deckLeft ?? null, total)}`;
      } else body = `<p class="muted pad">${esc(L.choose)}</p>`;
      return `<div class="tab ctab">${tabContent()}</div>${body}${fine}${grip}`;
    }
    function nameRow(c, mine, live, cls = "") {
      const left = mine ? live ? Math.max(0, c.copies - c.drawn) : c.copies : c.copies;
      const inHand = mine && live ? Math.max(0, c.drawn - c.played) : 0;
      const state = `${mine && left === 0 ? " out" : ""}${inHand > 0 ? " inhand" : ""}${c.legendary ? " is-leg" : ""}${cls}`;
      const count = mine ? left > 0 ? String(left) : "" : c.copies > 1 ? `\xD7${c.copies}` : "";
      const tip = mine && live ? `${c.name} \xB7 ${L.cardState(left, inHand, c.drawn - inHand)}` : c.name;
      return `<li class="nrow${state}" title="${esc(tip)}"${keyAttr(c)}><span class="ngem">${c.mana ?? "\u2013"}</span><span class="nname">${c.legendary ? "\u2605 " : ""}${esc(c.name)}</span><span class="ncount">${count}</span></li>`;
    }
    function customPanel(v, c, zoom, close, grip, fine) {
      const live = v.live;
      const names = c.cards === "names";
      const items = [];
      const stats = [];
      let waiting = "";
      if (view === "opp") {
        const leg = live?.opponent.legendary ?? null;
        if (c.opp.legendary) {
          if (leg) items.push(names ? nameRow(leg, false, Boolean(live), " leg") : `<li class="gc leg"${keyAttr(leg)}>${cardImg(leg)}</li>`);
          else if (!names) items.push(`<li class="gc leg"><span class="cardimg back" aria-hidden="true">?</span></li>`);
        }
        const seen = live?.opponent.seen ?? [];
        items.push(...seen.map((x) => names ? nameRow(x, false, Boolean(live)) : seenCard(x)));
        if (!seen.length) waiting = `<p class="muted cwait">${esc(L.oppWaiting)}</p>`;
        const left = live?.opponent.deckLeft;
        if (c.opp.deckLeft) stats.push(stat(left !== null && left !== void 0 ? String(left) : "\u2013", L.oppLeft, L.oppLeftTip));
        if (c.opp.life) stats.push(stat(lifePips(live ? live.life.opp : null), L.life));
        if (c.opp.mana) stats.push(manaBox(live));
      } else if (v.deck) {
        const leg = v.deck.legendary;
        const list2 = [...c.me.legendary && leg ? [[leg, ` leg${zoom}`]] : [], ...v.deck.cards.map((x) => [x, ""])];
        const shown = c.hideOut && live ? list2.filter(([x]) => x.copies - x.drawn > 0) : list2;
        items.push(...shown.map(([x, cls]) => names ? nameRow(x, true, Boolean(live), cls) : myCard(x, Boolean(live), cls)));
        const total = (leg?.copies ?? 0) + v.deck.cards.reduce((n, x) => n + x.copies, 0);
        if (c.me.deckLeft) stats.push(deckLeftStat(live?.deckLeft ?? null, total));
        if (c.me.life) stats.push(stat(lifePips(live ? live.life.me : null), L.life));
      } else waiting = `<p class="muted pad">${esc(L.choose)}</p>`;
      const list = items.length ? `<ul class="${names ? "nlist" : "cgrid"} ccards">${items.join("")}</ul>` : "";
      return `<div class="chead">${miniLogo}${close}</div><div class="cust or-${c.orientation === "horizontal" ? "h" : "v"}"><div class="cmain">${list}${waiting}</div>${stats.length ? `<div class="cstats">${stats.join("")}</div>` : ""}</div>${fine}${grip}`;
    }
    function paint(root, layout, v, zoom) {
      const shape = shapeOf(layout, view);
      const close = inWindow ? `<button type="button" class="x" id="close" title="${esc(L.close)}" aria-label="${esc(L.close)}">\xD7</button>` : "";
      const fine = `${v.scanner ? "" : `<p class="fine">${esc(L.noScanner)}</p>`}${inWindow ? "" : `<footer class="brand">${esc(L.brand)}</footer>`}`;
      const grip = inWindow ? `<span class="grip" id="grip" title="${esc(L.resize)}" aria-hidden="true"></span>` : "";
      root.classList.add("panel-x");
      root.classList.remove("has-tab", "tab-below", "tab-right");
      if (shape === "custom" && v.custom) {
        root.style.setProperty("--per-row", String(v.custom.perRow));
        root.style.setProperty("--bg-alpha", String(v.custom.opacity / 100));
        root.innerHTML = customPanel(v, v.custom, zoom, close, grip, fine);
      } else if (shape === "strips") {
        root.classList.add(view === "opp" ? "tab-below" : "has-tab");
        root.innerHTML = stripPanel(v, zoom, grip, fine);
      } else {
        root.classList.add("has-tab");
        if (view === "opp") root.classList.add("tab-right");
        root.innerHTML = columnPanel(v, zoom, grip, fine);
      }
      for (const el of root.querySelectorAll("[data-w]")) el.style.width = `${Number(el.dataset.w)}%`;
      for (const el of root.querySelectorAll("[data-art]")) if (/^[a-z0-9-]+$/.test(el.dataset.art ?? "")) el.style.setProperty("--row-art", `url("https://originsmeta.com/cards/art/${el.dataset.art}.webp")`);
    }
    return { L, paint };
  }

  // src/shared/recognize.ts
  var VEC = 20;
  var VEC_LEN = VEC * VEC * 3;
  var ART_IN_CARD = { x: 40 / 480, y: 62 / 690, w: 395 / 480, h: 303 / 690 };
  var SW = 2e3;
  var SH = 1125;
  var LANE_X = {
    opp: [[335, 465], [475, 605], [615, 745], [793, 922], [935, 1065], [1077, 1207], [1258, 1385], [1397, 1525], [1537, 1665]],
    me: [[297, 440], [447, 588], [595, 735], [785, 925], [935, 1065], [1080, 1215], [1265, 1405], [1412, 1552], [1557, 1697]]
  };
  var ROW_Y = { opp: [275, 430], me: [543, 712] };
  var BOARD_SLOTS = ["opp", "me"].flatMap(
    (side) => LANE_X[side].map(([x0, x1], i) => ({
      side,
      lane: Math.floor(i / 3) + 1,
      slot: i % 3 + 1,
      rect: { x: x0 / SW, y: ROW_Y[side][0] / SH, w: (x1 - x0) / SW, h: (ROW_Y[side][1] - ROW_Y[side][0]) / SH }
    }))
  );
  var VS_CARDS = {
    me: [
      { x: 717 / SW, y: 828 / SH, w: 178 / SW, h: 260 / SH },
      { x: 706 / SW, y: 806 / SH, w: 204 / SW, h: 293 / SH }
    ],
    opp: [
      { x: 1105 / SW, y: 828 / SH, w: 178 / SW, h: 260 / SH },
      { x: 1094 / SW, y: 806 / SH, w: 204 / SW, h: 293 / SH }
    ]
  };
  var BOARD_SCALE = [
    // [rapporto larghezza/altezza dell'area interna, S/H]
    [1160 / 869, 1221 / 869],
    [16 / 9, 16 / 9],
    [2042 / 853, 1759 / 853]
  ];
  function boardScale(r) {
    const pts = BOARD_SCALE.map(([a, k]) => [Math.log(a), Math.log(k)]);
    const x = Math.log(r);
    let i = 0;
    while (i < pts.length - 2 && x > pts[i + 1][0]) i++;
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    return Math.exp(y0 + (y1 - y0) * (x - x0) / (x1 - x0));
  }
  function layoutFor(content) {
    const cx = content.x + content.w / 2;
    const cy = content.y + content.h / 2;
    const centered = (w) => ({ x: cx - w / 2, y: cy - w * 9 / 32, w, h: w * 9 / 16 });
    const vsW = Math.min(content.w, content.h * 16 / 9);
    const vs = { x: cx - vsW / 2, y: content.y + content.h - vsW * 9 / 16, w: vsW, h: vsW * 9 / 16 };
    return { content, board: centered(content.h * boardScale(content.w / content.h)), ui: centered(content.h * 16 / 9), vs };
  }
  function inside(outer, inner) {
    return { x: outer.x + inner.x * outer.w, y: outer.y + inner.y * outer.h, w: inner.w * outer.w, h: inner.h * outer.h };
  }
  var MANA_TEXT = { x: 1800 / SW, y: 578 / SH, w: 100 / SW, h: 36 / SH };
  var GLYPHS = [
    ["/", 0.52, "....####|...#####|...####.|...####.|..####..|..####..|..####..|.####...|.####...|####....|####....|####...."],
    ["0", 1, "..####..|.#####..|#######.|###.###.|###..###|###..###|###..###|###..###|###..###|.#######|.######.|..#####."],
    ["1", 0.68, "#######.|#######.|#######.|..#####.|..#####.|...####.|...#####|...#####|...#####|...#####|...#####|...#####"],
    ["2", 1.04, ".####...|.######.|#######.|.##.###.|....###.|....###.|...####.|..####..|..###...|.#######|.#######|.#######"],
    ["3", 0.96, "#######.|#######.|#######.|...###..|..####..|..#####.|..######|.....###|.....###|.#######|########|.######."],
    ["4", 1.16, "..###...|..###...|..###...|.###....|.###....|.######.|###.###.|########|########|########|....###.|....###."],
    ["5", 0.96, "#######.|#######.|#######.|###.....|######..|#######.|########|....####|.....###|########|#######.|#######."],
    ["6", 1, "..#####.|.######.|.######.|####....|###.....|#######.|########|###..###|###..###|.###.###|.#######|..#####."],
    ["7", 1, "########|########|########|###.####|###.###.|....###.|....###.|....###.|...####.|...###..|...###..|...###.."],
    ["8", 1.04, ".####...|.######.|#######.|###.###.|###.###.|.######.|.######.|###..###|###..###|####.###|.######.|.######."],
    ["9", 1, ".####...|######..|#######.|###.###.|###..###|########|.#######|..##.###|.....###|.######.|.######.|.#####.."]
  ];
  var GLYPH_BITS = GLYPHS.map(([ch, aspect, rows]) => ({ ch, aspect, bits: rows.replace(/\|/g, "").split("").map((c) => c === "#" ? 1 : 0) }));
  var OPP_MANA_TEXT = { x: 1775 / SW, y: 396 / SH, w: 130 / SW, h: 36 / SH };
  var COMBAT_ARROW = { x: 1770 / SW, y: 470 / SH, w: 130 / SW, h: 32 / SH };
  var OPP_HAND = { x: 300 / SW, y: 15 / SH, w: 1400 / SW, h: 60 / SH };
  var ART_IN_HAND = { x: ART_IN_CARD.x, y: ART_IN_CARD.y, w: ART_IN_CARD.w * 0.6, h: ART_IN_CARD.h };
  var HAND_SHAPE = [
    // [rapporto dell'area interna, larghezza della carta / H, distanza del bordo alto della carta dal fondo / H]
    [1160 / 869, 98 / 869, 201 / 869],
    [16 / 9, 213.8 / 1440, 343 / 1440],
    [2042 / 853, 137 / 853, 196 / 853]
  ];
  function interpLog(table, col, r) {
    const x = Math.log(r);
    let i = 0;
    while (i < table.length - 2 && x > Math.log(table[i + 1][0])) i++;
    const [x0, y0] = [Math.log(table[i][0]), Math.log(table[i][col])];
    const [x1, y1] = [Math.log(table[i + 1][0]), Math.log(table[i + 1][col])];
    return Math.exp(y0 + (y1 - y0) * (x - x0) / (x1 - x0));
  }
  function handGeometry(content) {
    const r = content.w / content.h;
    const w = content.h * interpLog(HAND_SHAPE, 1, r);
    return { w, h: w * 690 / 480, top: content.y + content.h - content.h * interpLog(HAND_SHAPE, 2, r) };
  }
  var LIFE_RINGS = {
    // l'anello è un'ellisse vista di sbieco: per i due archi frontali va meglio un cerchio più piccolo e più in basso
    // (ricerca dell'11/10 nelle tre forme: centro +1% dell'altezza, raggio × 0,9)
    me: { x: 219.6 / 2560, y: 992.9 / 1440, r: 91.8 / 2560 },
    opp: { x: 2274 / 2560, y: 314.4 / 1440, r: 94.5 / 2560 }
  };
  var ART_IN_PREVIEW = { x: 40 / 480, y: 30 / 690, w: 395 / 480, h: 245 / 690 };
  var SPELL_PANEL = { x: 82 / SW, y: 168 / SH, w: 253 / SW, h: 150 / SH };
  var SPELL_SHIFTS = [-50, -40, -30, -20, -10, 0].flatMap((dx) => [-5, 5].map((dy) => [dx, dy]));
  var ROUND_BUTTON = { x: 1730 / SW, y: 870 / SH, w: 245 / SW, h: 215 / SH };

  // src/overlay/twitchPanels.ts
  function deckCard(table, key, copies, drawn, played) {
    const c = table[key];
    return { key, name: c?.[0] ?? key, slug: c?.[1] ?? null, mana: c?.[3] ?? null, spell: c?.[2] === "spell", legendary: c?.[6] === 1, copies, played, drawn };
  }
  function viewFromState(s, table) {
    const legKey = s.deck?.legendary ?? null;
    const all = s.deck?.cards ?? [];
    const leg = all.find((c) => c[0] === legKey) ?? null;
    const live = s.live;
    return {
      deck: s.deck ? { name: s.deck.name, legendary: leg ? deckCard(table, leg[0], leg[1], leg[2], leg[3]) : null, cards: all.filter((c) => c[0] !== legKey).map((c) => deckCard(table, c[0], c[1], c[2], c[3])) } : null,
      record: null,
      scanner: s.ui?.scanner ?? true,
      live: live ? {
        inMatch: live.inMatch,
        round: live.round,
        deckLeft: live.deckLeft,
        life: live.life ?? { me: null, opp: null },
        mana: live.mana ?? { me: null, opp: null },
        direction: live.direction ?? null,
        opponent: {
          deckLeft: live.opp.deckLeft,
          legendary: live.opp.legendary ? deckCard(table, live.opp.legendary, 1, 1, 1) : null,
          seen: live.opp.seen.map(([k, n]) => deckCard(table, k, n, n, n))
        }
      } : null,
      custom: s.ui?.custom ?? null,
      hidden: s.ui?.hidden ?? false,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function create(host, view, lang, logo) {
    const { L, paint } = createDeckRenderer({ view, lang, inWindow: false, logo });
    const root = document.createElement("div");
    root.className = "dt";
    root.setAttribute("aria-label", L.spot(view === "opp"));
    host.appendChild(root);
    root.addEventListener(
      "error",
      (e) => {
        if (e.target instanceof HTMLImageElement) e.target.closest(".cardimg")?.classList.add("noimg");
      },
      true
    );
    let drawnKey = "";
    let legendaryWasOut = false;
    return {
      root,
      update(layout, v) {
        const key = JSON.stringify({ layout, v: { ...v, updatedAt: null } });
        if (key === drawnKey) return;
        drawnKey = key;
        for (const s of ["strips", "columns", "custom"]) host.classList.toggle(`layout-${s}`, shapeOf(layout, view) === s);
        host.classList.toggle("is-opp", view === "opp");
        const leg = v.deck?.legendary ?? null;
        const legOut = Boolean(v.live && leg && leg.drawn >= 1);
        const zoom = view === "me" && legOut && !legendaryWasOut ? " just" : "";
        legendaryWasOut = legOut;
        paint(root, layout, v, zoom);
      }
    };
  }
  function boardRects(video) {
    const board = layoutFor(video).board;
    return BOARD_SLOTS.map((s) => ({ side: s.side, ...inside(board, s.rect) }));
  }
  function handRects(video, xs) {
    const g = handGeometry(video);
    return xs.map((x, i) => {
      const left = video.x + x * video.w;
      const next = i + 1 < xs.length ? video.x + xs[i + 1] * video.w : left + g.w;
      return { x: left, y: g.top, w: Math.max(8, Math.min(g.w, next - left)), h: g.h };
    });
  }
  window.OMPanels = { viewFromState, create, parseLiveState, boardRects, handRects };
})();
