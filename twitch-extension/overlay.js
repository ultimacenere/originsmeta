/*
 * OriginsMeta Deck tracker, estensione Twitch: il mazzo dello streamer sopra il video (video_overlay.html) e nella
 * versione per il telefono (mobile.html, body data-view="mobile").
 *
 * Dati: le carte da https://originsmeta.com/api/twitch/cards/<lingua> una volta sola; lo stato dal vivo da
 * /api/twitch/state?channel=<id> alla prima autorizzazione di Twitch, poi dai messaggi dell'Extension PubSub (target
 * "broadcast", {t: "state", at, s}). I messaggi più vecchi dell'ultimo si ignorano; se in partita non arriva niente per
 * 10 minuti lo stato si rilegge. Tutto passa dai controlli di common.js e il DOM si costruisce con OM.el (niente HTML).
 *
 * Overlay: una linguetta al bordo sinistro, a metà altezza, che apre il pannello del mazzo; fasce libere in alto (70 px)
 * e in basso (90 px) per i controlli del player; sotto i 500 px di larghezza (o 340 di altezza) non si mostra niente.
 * Passando sopra una carta (o col focus) si vede l'anteprima accanto al pannello; un clic o un tocco la fissa, un
 * secondo tocco o Esc la chiude.
 */
(function () {
  "use strict";

  var OM = window.OM;
  var t = OM.t;
  var el = OM.el;

  var MOBILE = document.body.getAttribute("data-view") === "mobile";
  var MIN_W = 500;
  var MIN_H = 340;
  var STALE_MS = 10 * 60 * 1000;

  var cards = null; // tabella delle carte controllata
  var current = null; // ultimo stato {deck, live}
  var lastAt = 0; // ora (ms) dell'ultimo stato accettato
  var lastUpdate = 0; // Date.now() dell'ultimo aggiornamento ricevuto
  var channelId = null;
  var open = MOBILE; // pannello aperto
  var pinned = null; // {key, side} dell'anteprima fissata
  var shown = null; // {key, side} dell'anteprima mostrata

  // ---------- struttura ----------
  var stage = el("div", { cls: "om-stage", attrs: { hidden: "" } });

  var tab = el("button", {
    cls: "om-tab",
    attrs: { type: "button", "aria-expanded": "false", "aria-controls": "om-panel", "aria-label": t("tabAria") }
  }, [
    el("span", { cls: "om-tab-logo", attrs: { "aria-hidden": "true" } }, [el("span", { cls: "om-tab-mark" }), "OriginsMeta"]),
    el("span", { cls: "om-tab-label", text: t("tab") })
  ]);

  var title = el("h2", { cls: "om-title", text: t("deckTitle") });
  var closeBtn = el("button", { cls: "om-close", text: "×", attrs: { type: "button", "aria-label": t("close"), title: t("close") } });
  var meta = el("p", { cls: "om-meta" });
  var deckList = el("ul", { cls: "om-list", attrs: { "aria-label": t("deckTitle") } });
  var legend = el("p", { cls: "om-legend", attrs: { "aria-hidden": "true" } }, [
    el("i", { cls: "om-pip is-on" }), t("legendLeft"),
    el("i", { cls: "om-pip is-drawn" }), t("legendDrawn"),
    el("i", { cls: "om-pip is-played" }), t("legendPlayed")
  ]);
  var oppTitle = el("h3", { cls: "om-subtitle" });
  var oppList = el("ul", { cls: "om-list om-list--opp", attrs: { "aria-label": t("opponent") } });
  var oppEmpty = el("p", { cls: "om-empty", text: t("noSeen") });
  var oppBox = el("div", { cls: "om-opp" }, [oppTitle, oppList, oppEmpty]);
  var waiting = el("p", { cls: "om-waiting", text: t("waiting") });
  var scroll = el("div", { cls: "om-scroll" }, [waiting, deckList, legend, oppBox]);
  var hint = el("p", { cls: "om-hint", text: t("hint") });
  var foot = el("p", { cls: "om-foot", text: t("footer") });

  var panel = el("section", { cls: "om-panel", attrs: { id: "om-panel", tabindex: "-1", "aria-label": t("deckTitle") } }, [
    el("div", { cls: "om-head" }, MOBILE ? [title] : [title, closeBtn]),
    meta,
    scroll,
    hint,
    foot
  ]);

  var preview = el("aside", { cls: "om-preview", attrs: { hidden: "", "aria-live": "polite" } });

  if (!MOBILE) stage.appendChild(tab);
  stage.appendChild(panel);
  stage.appendChild(preview);
  document.body.appendChild(stage);

  // ---------- utilità ----------
  function card(key) {
    return (cards && cards[key]) || null;
  }
  function nameOf(key) {
    var c = card(key);
    return c ? c.name : t("unknown");
  }
  function costText(c) {
    return c && c.cost !== null ? String(c.cost) : "–";
  }
  function hasDeck() {
    return !!(cards && current && current.deck && current.deck.cards.length > 0);
  }
  function inMatch() {
    return !!(current && current.live && current.live.inMatch);
  }
  function legendaryKeyOf(deck) {
    if (deck.legendary) return deck.legendary;
    for (var i = 0; i < deck.cards.length; i++) {
      var c = card(deck.cards[i].key);
      if (c && c.legendary) return deck.cards[i].key;
    }
    return null;
  }
  function gem(c, extra) {
    return el("span", { cls: "om-gem" + (extra ? " " + extra : ""), text: costText(c), attrs: { "aria-hidden": "true" } });
  }
  function nameNode(key, isLeg) {
    return el("span", { cls: "om-name" }, [isLeg ? el("span", { cls: "om-star", text: "★", attrs: { "aria-hidden": "true" } }) : null, nameOf(key)]);
  }

  // ---------- righe ----------
  function myRow(entry, isLeg) {
    var c = card(entry.key);
    var drawn = Math.min(entry.drawn, entry.copies);
    var played = Math.min(entry.played, drawn);
    var left = Math.max(0, entry.copies - drawn);
    var pips = el("span", { cls: "om-pips", attrs: { "aria-hidden": "true" } });
    for (var i = 0; i < entry.copies; i++) {
      var kind = i < left ? "is-on" : i < entry.copies - played ? "is-drawn" : "is-played";
      pips.appendChild(el("i", { cls: "om-pip " + kind }));
    }
    var label = [nameOf(entry.key)];
    if (isLeg) label.push(t("legendary"));
    label.push(t("cost") + " " + costText(c));
    label.push(t("rowLeft", { left: left, copies: entry.copies }));
    if (played > 0) label.push(t("rowPlayed", { n: played }));
    var btn = el("button", {
      cls: "om-row" + (isLeg ? " is-leg" : "") + (left === 0 ? " is-out" : ""),
      attrs: { type: "button", "data-key": entry.key, "data-side": "me", "aria-label": label.join(", ") }
    }, [gem(c), nameNode(entry.key, isLeg), pips]);
    return el("li", null, [btn]);
  }

  function oppRow(key, n, isLeg) {
    var c = card(key);
    var label = [nameOf(key)];
    if (isLeg) label.push(t("legendary"));
    label.push(t("cost") + " " + costText(c));
    if (n) label.push(n === 1 ? t("seenOnce") : t("seenCopies", { n: n }));
    var btn = el("button", {
      cls: "om-row om-row--opp" + (isLeg ? " is-leg" : ""),
      attrs: { type: "button", "data-key": key, "data-side": "opp", "aria-label": label.join(", ") }
    }, [gem(c), nameNode(key, isLeg), n ? el("span", { cls: "om-count", text: "×" + n, attrs: { "aria-hidden": "true" } }) : null]);
    return el("li", null, [btn]);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }


  // ---------- modalità "come l'app" (14/10/2026) ----------
  // Pierluigi: "non possiamo renderlo identico come visuale alla versione del tracker scelto dall'utente?". Se lo
  // streamer la sceglie nella configurazione (segmento "broadcaster": {"view": "app"}) e l'app manda lo stile dei
  // pannelli (ui, dalla 0.4.3), i pannelli di OriginsMeta Tracker si disegnano sopra il video con panels.js (lo stesso
  // codice e lo stesso CSS dell'app), nelle stesse proporzioni dello schermo dello streamer. Il video sta nel player in
  // proporzione (bande nere se il player ha un'altra forma); i pannelli restano fuori dalle fasce dei controlli del
  // player (in alto e in basso) e chi guarda li può nascondere. Senza stile (app più vecchia) resta la linguetta.
  // Dal 14/10/2026 i pannelli stanno esattamente dove li vede lo streamer, anche sopra le fasce dei controlli.
  var PANEL_LANG = OM.lang === "it" || OM.lang === "es" ? OM.lang : "en";
  var mode = "tab";
  var fullState = null; // lo stato con lo stile dei pannelli (parseLiveState del sito, in panels.js)
  var appHidden = false; // chi guarda ha nascosto i pannelli
  var appLayer = el("div", { cls: "om-applayer", attrs: { hidden: "" } });
  var appToggle = el("button", { cls: "om-apptoggle", attrs: { type: "button", "aria-pressed": "false" } }, [
    el("span", { cls: "om-tab-mark", attrs: { "aria-hidden": "true" } }),
    el("span", { cls: "om-apptoggle-text", text: t("appHide") })
  ]);
  var appHosts = {}; // "me" | "opp" → {host, panel}
  // la posizione scelta da chi guarda trascinando un pannello dalla sua linguetta (14/10/2026, come la lista di
  // Hearthstone): frazioni del video, per canale, nel browser di chi guarda; doppio clic sulla linguetta = di nuovo al
  // posto dello streamer
  var moved = {};
  function movedKey() {
    return "om.panels." + (channelId || "x");
  }
  function loadMoved() {
    try {
      var raw = JSON.parse(window.localStorage.getItem(movedKey()) || "{}");
      moved = {};
      ["me", "opp"].forEach(function (side) {
        var m = raw && raw[side];
        if (m && typeof m.x === "number" && typeof m.y === "number" && m.x >= 0 && m.x <= 1 && m.y >= 0 && m.y <= 1) moved[side] = { x: m.x, y: m.y };
      });
    } catch (e) {
      moved = {};
    }
  }
  function saveMoved() {
    try {
      window.localStorage.setItem(movedKey(), JSON.stringify(moved));
    } catch (e) {
      /* niente memoria nel browser: la posizione vale fino alla chiusura */
    }
  }
  document.body.appendChild(appLayer);
  document.body.appendChild(appToggle);
  appToggle.hidden = true;

  function readMode(seg) {
    try {
      var c = seg && typeof seg.content === "string" ? JSON.parse(seg.content) : null;
      return c && c.view === "app" ? "app" : "tab";
    } catch (e) {
      return "tab";
    }
  }

  function appReady() {
    return !MOBILE && mode === "app" && !!window.OMPanels && !!cards && !!fullState && !!fullState.ui && !!fullState.deck;
  }

  function appHost(side) {
    if (appHosts[side]) return appHosts[side];
    var host = el("div", { cls: "om-app", attrs: { "data-side": side } });
    appLayer.appendChild(host);
    var raw = {};
    Object.keys(cards).forEach(function (k) {
      var c = cards[k];
      raw[k] = [c.name, c.slug, c.type, c.cost, c.power, c.health, c.legendary ? 1 : 0, c.text, null];
    });
    appHosts[side] = { host: host, panel: window.OMPanels.create(host, side, PANEL_LANG), table: raw };
    if (appResize) appResize.observe(host);
    // trascinamento dalla linguetta del pannello (scritta OriginsMeta)
    host.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || !e.target.closest || !e.target.closest(".tab, .chead")) return;
      e.preventDefault();
      var start = { px: e.clientX, py: e.clientY, left: host.offsetLeft, top: host.offsetTop };
      host.setPointerCapture(e.pointerId);
      host.classList.add("is-dragging");
      function move(ev) {
        host.style.left = Math.round(start.left + ev.clientX - start.px) + "px";
        host.style.top = Math.round(start.top + ev.clientY - start.py) + "px";
      }
      function end() {
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerup", end);
        host.removeEventListener("pointercancel", end);
        host.classList.remove("is-dragging");
        var v = videoRect();
        var ui = fullState && fullState.ui;
        if (ui) {
          moved[side] = { x: Math.min(1, Math.max(0, (host.offsetLeft - v.x) / v.w)), y: Math.min(1, Math.max(0, (host.offsetTop - v.y) / v.h)) };
          saveMoved();
        }
        placeApp();
      }
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerup", end);
      host.addEventListener("pointercancel", end);
    });
    host.addEventListener("dblclick", function (e) {
      if (!e.target.closest || !e.target.closest(".tab, .chead")) return;
      delete moved[side];
      saveMoved();
      placeApp();
    });
    return appHosts[side];
  }

  /**
   * La posizione dei pannelli: esattamente gli stessi punti e la stessa misura, in proporzione, dello schermo dello
   * streamer (14/10/2026, prova in diretta di Pierluigi: "la posizione di quelli di Twitch non è la stessa"; prima i
   * pannelli si spostavano fuori dalle fasce dei controlli del player). Un pannello più alto del video si rimpicciolisce,
   * attaccato al bordo più vicino.
   */
  function placeApp() {
    if (!fullState || !fullState.ui) return;
    var ui = fullState.ui;
    var W = window.innerWidth;
    var H = window.innerHeight;
    var scale = Math.min(W / ui.screen.w, H / ui.screen.h);
    var vx = (W - ui.screen.w * scale) / 2;
    var vy = (H - ui.screen.h * scale) / 2;
    var avail = Math.max(60, ui.screen.h * scale);
    ["me", "opp"].forEach(function (side) {
      var h = appHosts[side];
      var rect = ui.panels[side === "me" ? "deck" : "opp"];
      if (!h || h.host.hidden || !rect) return;
      var natural = h.host.offsetHeight || rect.h;
      var s = Math.min(scale, avail / natural);
      var height = natural * s;
      var width = rect.w * s;
      var right = rect.x + rect.w / 2 > ui.screen.w / 2;
      var left = right ? vx + (rect.x + rect.w) * scale - width : vx + rect.x * scale;
      var bottomAnchored = rect.y + rect.h / 2 > ui.screen.h / 2;
      var top = bottomAnchored ? vy + (rect.y + rect.h) * scale - height : vy + rect.y * scale;
      top = Math.min(Math.max(top, vy), vy + ui.screen.h * scale - height);
      if (moved[side]) {
        left = vx + moved[side].x * ui.screen.w * scale;
        top = vy + moved[side].y * ui.screen.h * scale;
      }
      h.host.style.left = Math.round(Math.max(0, Math.min(left, W - width))) + "px";
      h.host.style.top = Math.round(Math.max(0, Math.min(top, H - height))) + "px";
      h.host.style.transform = "scale(" + s.toFixed(4) + ")";
    });
  }

  /** I pannelli sopra il video: disegnati con panels.js (lo stesso codice dell'app), poi messi al loro posto. */
  function renderApp() {
    var ui = fullState.ui;
    var view = null;
    ["me", "opp"].forEach(function (side) {
      var rect = ui.panels[side === "me" ? "deck" : "opp"];
      var existing = appHosts[side];
      if (!rect || ui.hidden || appHidden) {
        if (existing) existing.host.hidden = true;
        return;
      }
      var h = appHost(side);
      if (!view) view = window.OMPanels.viewFromState(fullState, h.table);
      h.host.hidden = false;
      h.host.style.width = rect.w + "px";
      h.panel.update(ui.template, view);
    });
    placeApp();
    appToggle.querySelector(".om-apptoggle-text").textContent = appHidden ? t("appShow") : t("appHide");
    appToggle.setAttribute("aria-pressed", appHidden ? "true" : "false");
  }

  // le immagini delle carte arrivano dopo il disegno e cambiano l'altezza dei pannelli: si rimettono a posto
  var appResize = typeof ResizeObserver === "function" ? new ResizeObserver(function () { placeApp(); }) : null;

  appToggle.addEventListener("click", function () {
    appHidden = !appHidden;
    hidePreview(true);
    render();
  });

  // l'anteprima della carta dai pannelli dell'app: dall'altra parte del video rispetto al pannello
  function appCardOf(node) {
    var n = node && node.closest ? node.closest("[data-key]") : null;
    return n && appLayer.contains(n) ? n : null;
  }
  // l'anteprima sempre a destra (14/10/2026, Pierluigi: "il puntatore del mouse è uno per persona, non ha senso sta
  // divisione, ogni carta appare sempre sulla destra, che sia deck o sia campo")
  function placePreviewNear() {
    stage.style.left = "auto";
    stage.style.right = "0";
  }
  function placePreview(node) {
    placePreviewNear(node.closest(".om-app"));
  }
  appLayer.addEventListener("pointerover", function (e) {
    var n = appCardOf(e.target);
    if (!n || pinned) return;
    placePreview(n);
    showPreview(n.getAttribute("data-key"), n.closest(".om-app").getAttribute("data-side") === "opp" ? "opp" : "me", false);
  });
  appLayer.addEventListener("pointerleave", function () {
    if (!pinned) hidePreview(false);
  });
  appLayer.addEventListener("click", function (e) {
    var n = appCardOf(e.target);
    if (!n) return;
    var key = n.getAttribute("data-key");
    var side = n.closest(".om-app").getAttribute("data-side") === "opp" ? "opp" : "me";
    if (pinned && pinned.key === key && pinned.side === side) {
      hidePreview(true);
      return;
    }
    placePreview(n);
    pinned = { key: key, side: side };
    showPreview(key, side, true);
  });


  // ---------- le carte del tabellone (14/10/2026) ----------
  // Come l'estensione di Hearthstone: sopra le carte in gioco nel video ci sono zone invisibili, e chi guarda ci passa
  // sopra per leggerle. Le carte vengono dallo scanner dell'app (`live.board`, dalla 0.4.5), le posizioni dalle stesse
  // misure con cui lo scanner legge il tabellone (OMPanels.boardRects). Solo in partita, non sul telefono.
  var zoneLayer = el("div", { cls: "om-zones", attrs: { hidden: "" } });
  document.body.appendChild(zoneLayer);
  var zoneKey = "";

  /** Il rettangolo del video nel player: le proporzioni dello schermo dello streamer (16:9 se non si sanno), al centro. */
  function videoRect() {
    var W = window.innerWidth;
    var H = window.innerHeight;
    var sw = fullState && fullState.ui ? fullState.ui.screen.w : 16;
    var sh = fullState && fullState.ui ? fullState.ui.screen.h : 9;
    var scale = Math.min(W / sw, H / sh);
    return { x: (W - sw * scale) / 2, y: (H - sh * scale) / 2, w: sw * scale, h: sh * scale, scale: scale };
  }

  function renderZones() {
    var live = fullState && fullState.live && fullState.live.inMatch ? fullState.live : null;
    var board = live && live.board ? live.board : null;
    var hand = live && live.hand ? live.hand : [];
    var show = !MOBILE && (!!board || hand.length > 0) && !!window.OMPanels && !!cards && !(window.innerWidth < MIN_W || window.innerHeight < MIN_H);
    zoneLayer.hidden = !show;
    if (!show) {
      if (zoneKey) {
        clear(zoneLayer);
        zoneKey = "";
      }
      return;
    }
    var v = videoRect();
    var key = JSON.stringify([board, hand, Math.round(v.w), Math.round(v.h)]);
    if (key === zoneKey) return;
    zoneKey = key;
    clear(zoneLayer);
    function addZone(k, r, side) {
      var zone = el("button", {
        cls: "om-zone",
        attrs: { type: "button", "data-key": k, "data-side": side, "aria-label": nameOf(k) }
      });
      zone.style.left = Math.round(r.x) + "px";
      zone.style.top = Math.round(r.y) + "px";
      zone.style.width = Math.round(r.w) + "px";
      zone.style.height = Math.round(r.h) + "px";
      zoneLayer.appendChild(zone);
    }
    // le carte in mano dello streamer (dall'app 0.4.6), sopra le zone del tabellone nell'ordine
    if (hand.length) {
      var hr = window.OMPanels.handRects(v, hand.map(function (c) { return c[1]; }));
      hand.forEach(function (c, i) {
        if (card(c[0])) addZone(c[0], hr[i], "me");
      });
    }
    if (!board) return;
    var rects = window.OMPanels.boardRects(v);
    board.forEach(function (k, i) {
      if (!k || !card(k)) return;
      var r = rects[i];
      var zone = el("button", {
        cls: "om-zone",
        attrs: { type: "button", "data-key": k, "data-side": r.side === "opp" ? "opp" : "me", "aria-label": nameOf(k) }
      });
      zone.style.left = Math.round(r.x) + "px";
      zone.style.top = Math.round(r.y) + "px";
      zone.style.width = Math.round(r.w) + "px";
      zone.style.height = Math.round(r.h) + "px";
      zoneLayer.appendChild(zone);
    });
  }

  zoneLayer.addEventListener("pointerover", function (e) {
    var z = e.target && e.target.closest ? e.target.closest(".om-zone") : null;
    if (!z || pinned) return;
    placePreviewNear(z);
    showPreview(z.getAttribute("data-key"), z.getAttribute("data-side"), false);
  });
  zoneLayer.addEventListener("pointerleave", function () {
    if (!pinned) hidePreview(false);
  });
  zoneLayer.addEventListener("click", function (e) {
    var z = e.target && e.target.closest ? e.target.closest(".om-zone") : null;
    if (!z) return;
    var key = z.getAttribute("data-key");
    var side = z.getAttribute("data-side");
    if (pinned && pinned.key === key && pinned.side === side) {
      hidePreview(true);
      return;
    }
    placePreviewNear(z);
    pinned = { key: key, side: side };
    showPreview(key, side, true);
  });
  zoneLayer.addEventListener("focusin", function (e) {
    var z = e.target && e.target.closest ? e.target.closest(".om-zone") : null;
    if (!z || pinned) return;
    placePreviewNear(z);
    showPreview(z.getAttribute("data-key"), z.getAttribute("data-side"), false);
  });

  // ---------- disegno ----------
  function render() {
    renderZones();
    var app = appReady();
    document.body.classList.toggle("om-mode-app", app);
    appLayer.hidden = !app;
    appToggle.hidden = !app;
    if (app) {
      if (open) setOpen(false, false);
      stage.hidden = false;
      renderApp();
      return;
    }
    stage.style.left = "";
    stage.style.right = "";
    var smallPlayer = !MOBILE && (window.innerWidth < MIN_W || window.innerHeight < MIN_H);
    var show = hasDeck() && !smallPlayer;
    document.body.classList.toggle("om-small", smallPlayer);

    if (!MOBILE && !show) {
      stage.hidden = true;
      if (open) setOpen(false, false);
      hidePreview(true);
      return;
    }
    stage.hidden = false;

    // il focus su una riga torna sulla stessa riga dopo il ridisegno
    var active = document.activeElement;
    var focusKey = active && active.classList && active.classList.contains("om-row") ? active.getAttribute("data-key") + "|" + active.getAttribute("data-side") : null;

    clear(deckList);
    clear(oppList);
    clear(meta);

    if (!hasDeck()) {
      // solo mobile: niente mazzo, il messaggio d'attesa
      waiting.hidden = false;
      deckList.hidden = true;
      legend.hidden = true;
      oppBox.hidden = true;
      meta.hidden = true;
      hint.hidden = true;
      title.textContent = t("deckTitle");
      hidePreview(true);
      return;
    }
    waiting.hidden = true;
    deckList.hidden = false;
    legend.hidden = false;
    hint.hidden = false;

    var deck = current.deck;
    title.textContent = deck.name || t("deckTitle");
    title.title = deck.name || "";

    var live = current.live;
    var parts = [];
    if (inMatch()) {
      if (live.round !== null) parts.push(t("round", { n: live.round }));
      if (live.deckLeft !== null) parts.push(live.deckLeft === 1 ? t("deckLeftOne") : t("deckLeft", { n: live.deckLeft }));
    }
    meta.hidden = parts.length === 0;
    parts.forEach(function (p, i) {
      if (i > 0) meta.appendChild(el("span", { cls: "om-dot", text: " · ", attrs: { "aria-hidden": "true" } }));
      meta.appendChild(el("span", { text: p }));
    });

    var legKey = legendaryKeyOf(deck);
    var legEntry = null;
    var rest = [];
    deck.cards.forEach(function (entry) {
      if (!legEntry && entry.key === legKey) legEntry = entry;
      else rest.push(entry);
    });
    if (legEntry) deckList.appendChild(myRow(legEntry, true));
    rest.forEach(function (entry) {
      deckList.appendChild(myRow(entry, false));
    });

    if (inMatch()) {
      oppBox.hidden = false;
      var opp = live.opp;
      clear(oppTitle);
      oppTitle.appendChild(el("span", { text: t("opponent") }));
      if (opp.deckLeft !== null) oppTitle.appendChild(el("span", { cls: "om-subtitle-meta", text: t("oppDeckLeft", { n: opp.deckLeft }) }));
      if (opp.legendary) oppList.appendChild(oppRow(opp.legendary, 0, true));
      var seen = opp.seen.filter(function (s) {
        return s.key !== opp.legendary;
      });
      seen.sort(function (a, b) {
        var ca = card(a.key);
        var cb = card(b.key);
        var ka = ca && ca.cost !== null ? ca.cost : 99;
        var kb = cb && cb.cost !== null ? cb.cost : 99;
        return ka - kb || nameOf(a.key).localeCompare(nameOf(b.key));
      });
      seen.forEach(function (s) {
        oppList.appendChild(oppRow(s.key, s.n, false));
      });
      oppEmpty.hidden = seen.length > 0;
      oppList.hidden = oppList.childNodes.length === 0;
    } else {
      oppBox.hidden = true;
    }

    if (focusKey) {
      var parts2 = focusKey.split("|");
      var again = panel.querySelector('.om-row[data-key="' + parts2[0] + '"][data-side="' + parts2[1] + '"]');
      if (again) again.focus({ preventScroll: true });
    }
    // un'anteprima di una carta che non c'è più si chiude
    if (shown && !panel.querySelector('.om-row[data-key="' + shown.key + '"]')) hidePreview(true);
    else markRows();
  }

  // ---------- pannello ----------
  function setOpen(value, moveFocus) {
    if (MOBILE) return;
    open = value;
    tab.setAttribute("aria-expanded", value ? "true" : "false");
    document.body.classList.toggle("om-open", value);
    if (!value) hidePreview(true);
    if (moveFocus) {
      if (value) {
        var first = panel.querySelector(".om-row") || closeBtn;
        first.focus({ preventScroll: true });
      } else {
        tab.focus({ preventScroll: true });
      }
    }
  }

  tab.addEventListener("click", function (e) {
    // da tastiera (detail 0) il focus va sulla prima carta; col mouse sul pannello, senza aprire anteprime
    var keyboard = e.detail === 0;
    setOpen(!open, keyboard);
    if (!keyboard && open) panel.focus({ preventScroll: true });
  });
  closeBtn.addEventListener("click", function () {
    setOpen(false, true);
  });

  // ---------- anteprima ----------
  function typeLabel(c) {
    return c.type === "spell" ? t("spell") : c.type === "token" ? t("token") : t("unit");
  }

  function fillPreview(key, side, isPinned) {
    var c = card(key);
    clear(preview);
    preview.classList.toggle("is-pinned", isPinned);
    preview.classList.toggle("is-opp", side === "opp");
    var isLeg = !!(c && c.legendary);
    if (isPinned || MOBILE) {
      var x = el("button", { cls: "om-preview-close", text: "×", attrs: { type: "button", "aria-label": t("closeCard"), title: t("closeCard") } });
      x.addEventListener("click", function () {
        var back = pinned;
        hidePreview(true);
        refocusRow(back);
      });
      preview.appendChild(x);
    }

    // la carta intera, mai ritagliata né coperta (crediti stampati); senza immagine, una scheda di testo
    var art = el("div", { cls: "om-art" + (isLeg ? " is-leg" : "") });
    var textCard = el("div", { cls: "om-textcard", attrs: { "aria-hidden": "true" } }, [
      gem(c, "om-gem--big"),
      el("span", { cls: "om-textcard-name", text: c ? c.name : t("unknown") }),
      el("span", { cls: "om-textcard-type", text: c ? typeLabel(c) : "" })
    ]);
    art.appendChild(textCard);
    if (c && c.image) {
      var img = el("img", { attrs: { src: c.image, alt: c.name, width: "480", height: "690", decoding: "async" } });
      img.addEventListener("error", function () {
        art.classList.add("is-noimg");
      });
      img.addEventListener("load", function () {
        art.classList.add("is-loaded");
      });
      art.appendChild(img);
    } else {
      art.classList.add("is-noimg");
    }
    preview.appendChild(art);

    var info = el("div", { cls: "om-info" });
    info.appendChild(el("h3", { cls: "om-info-name" + (isLeg ? " is-leg" : "") }, [isLeg ? el("span", { cls: "om-star", text: "★ ", attrs: { "aria-hidden": "true" } }) : null, c ? c.name : t("unknown")]));
    if (c) {
      info.appendChild(el("p", { cls: "om-info-type", text: typeLabel(c) + (isLeg ? " · " + t("legendary") : "") }));
      var stats = el("p", { cls: "om-stats" });
      if (c.cost !== null) stats.appendChild(el("span", { cls: "om-stat om-stat--cost" }, [t("cost") + " ", el("b", { text: String(c.cost) })]));
      if (c.power !== null) stats.appendChild(el("span", { cls: "om-stat" }, [t("power") + " ", el("b", { text: String(c.power) })]));
      if (c.health !== null) stats.appendChild(el("span", { cls: "om-stat" }, [t("health") + " ", el("b", { text: String(c.health) })]));
      if (stats.childNodes.length) info.appendChild(stats);
      if (c.text) info.appendChild(el("p", { cls: "om-text", text: c.text }));
      if (OM.slugOk(c.slug)) info.appendChild(OM.siteLink("/cards/" + c.slug, t("cardPage"), "om-link"));
    }
    preview.appendChild(info);
  }

  function showPreview(key, side, isPinned) {
    if (!OM.isKey(key)) return;
    if (shown && shown.key === key && shown.side === side && preview.classList.contains("is-pinned") === isPinned && !preview.hidden) return;
    fillPreview(key, side, isPinned);
    shown = { key: key, side: side };
    preview.hidden = false;
    document.body.classList.add("om-has-preview");
    markRows();
  }

  function hidePreview(force) {
    if (pinned && !force) {
      showPreview(pinned.key, pinned.side, true);
      return;
    }
    pinned = null;
    shown = null;
    preview.hidden = true;
    clear(preview);
    document.body.classList.remove("om-has-preview");
    markRows();
  }

  function markRows() {
    var rows = panel.querySelectorAll(".om-row");
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var on = !!(pinned && r.getAttribute("data-key") === pinned.key && r.getAttribute("data-side") === pinned.side);
      r.classList.toggle("is-pinned", on);
      r.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function refocusRow(target) {
    if (!target) return;
    var row = panel.querySelector('.om-row[data-key="' + target.key + '"][data-side="' + target.side + '"]');
    if (row) row.focus({ preventScroll: true });
  }

  function rowOf(node) {
    return node && node.closest ? node.closest(".om-row") : null;
  }

  // mouse e penna: passando sopra; il tocco passa solo dal clic (primo tocco apre, secondo chiude)
  panel.addEventListener("pointerover", function (e) {
    if (MOBILE || e.pointerType === "touch") return;
    var row = rowOf(e.target);
    if (row) showPreview(row.getAttribute("data-key"), row.getAttribute("data-side"), !!(pinned && pinned.key === row.getAttribute("data-key") && pinned.side === row.getAttribute("data-side")));
  });
  panel.addEventListener("pointerleave", function (e) {
    if (MOBILE || e.pointerType === "touch") return;
    // fissata: torna quella; altrimenti resta solo quella della riga col focus da tastiera
    var row = rowOf(document.activeElement);
    if (!pinned && row && panel.contains(row) && row.matches(":focus-visible")) showPreview(row.getAttribute("data-key"), row.getAttribute("data-side"), false);
    else hidePreview(false);
  });
  panel.addEventListener("click", function (e) {
    var row = rowOf(e.target);
    if (!row) return;
    var key = row.getAttribute("data-key");
    var side = row.getAttribute("data-side");
    if (pinned && pinned.key === key && pinned.side === side) {
      hidePreview(true);
    } else {
      pinned = { key: key, side: side };
      shown = null;
      showPreview(key, side, true);
      // sul telefono la carta copre l'elenco: il focus va sul tasto per chiuderla
      if (MOBILE) {
        var x = preview.querySelector(".om-preview-close");
        if (x) x.focus({ preventScroll: true });
      }
    }
  });
  panel.addEventListener("focusin", function (e) {
    var row = rowOf(e.target);
    if (row && !MOBILE && !pinned && e.target.matches(":focus-visible")) showPreview(row.getAttribute("data-key"), row.getAttribute("data-side"), false);
  });
  panel.addEventListener("focusout", function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (pinned) return;
      if (a && (preview.contains(a) || rowOf(a))) return;
      hidePreview(true);
    }, 0);
  });

  // un tocco fuori da pannello e anteprima chiude l'anteprima fissata
  document.addEventListener("pointerdown", function (e) {
    if (!pinned) return;
    if (panel.contains(e.target) || preview.contains(e.target)) return;
    hidePreview(true);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" && e.key !== "Esc") return;
    if (!preview.hidden) {
      var back = pinned || shown;
      hidePreview(true);
      refocusRow(back);
      e.preventDefault();
    } else if (open && !MOBILE) {
      setOpen(false, true);
      e.preventDefault();
    }
  });

  window.addEventListener("resize", render);

  // ---------- dati ----------
  function apply(state, at, raw) {
    if (at && at < lastAt) return; // più vecchio dell'ultimo: si ignora
    if (at) lastAt = at;
    lastUpdate = Date.now();
    current = state;
    // lo stato completo, con lo stile dei pannelli, per la modalità "come l'app"
    fullState = raw && window.OMPanels ? window.OMPanels.parseLiveState(raw) : null;
    render();
  }

  var cardsTries = 0;
  function loadCards() {
    OM.getJson("/api/twitch/cards/" + OM.lang, 15000)
      .then(function (raw) {
        var table = OM.parseCards(raw);
        if (!Object.keys(table).length) throw new Error("empty");
        cards = table;
        render();
      })
      .catch(function () {
        cardsTries++;
        setTimeout(loadCards, Math.min(15000 * cardsTries, 300000));
      });
  }

  var stateLoading = false;
  function loadState() {
    if (!channelId || stateLoading) return;
    stateLoading = true;
    OM.getJson("/api/twitch/state?channel=" + encodeURIComponent(channelId), 10000)
      .then(function (r) {
        if (!r || typeof r !== "object") return;
        if (r.state) {
          var s = OM.parseState(r.state);
          if (s) apply(s, OM.timeOf(r.at), r.state);
        } else if (r.state === null && lastAt === 0) {
          apply(null, 0);
        }
      })
      .catch(function () {
        /* niente stato: si aspetta PubSub o il prossimo controllo */
      })
      .finally(function () {
        stateLoading = false;
      });
  }

  // in partita, se per 10 minuti non arriva niente, si rilegge lo stato (un messaggio PubSub può perdersi)
  setInterval(function () {
    if (inMatch() && Date.now() - lastUpdate > STALE_MS) {
      lastUpdate = Date.now();
      loadState();
    }
  }, 60 * 1000);

  loadCards();
  render();

  var ext = window.Twitch && window.Twitch.ext;
  if (ext) {
    ext.onAuthorized(function (auth) {
      var id = auth && typeof auth.channelId === "string" ? auth.channelId : null;
      if (!OM.channelOk(id) || id === channelId) return;
      channelId = id;
      loadMoved();
      loadState();
    });
    ext.listen("broadcast", function (_target, _contentType, message) {
      var m = OM.parseMessage(message);
      if (m) apply(m.state, m.at, m.raw);
    });
    // la scelta dello streamer (configurazione dell'estensione): "come l'app" o linguetta
    if (ext.configuration) {
      ext.configuration.onChanged(function () {
        mode = readMode(ext.configuration.broadcaster);
        render();
      });
    }
    if (typeof ext.onContext === "function") {
      // il contesto arriva spesso (latenza, bitrate…): si ridisegna solo se teatro o schermo intero cambiano le misure
      var lastSize = "";
      ext.onContext(function () {
        var size = window.innerWidth + "x" + window.innerHeight;
        if (size === lastSize) return;
        lastSize = size;
        render();
      });
    }
  }
})();
