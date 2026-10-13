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

  // ---------- disegno ----------
  function render() {
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
  function apply(state, at) {
    if (at && at < lastAt) return; // più vecchio dell'ultimo: si ignora
    if (at) lastAt = at;
    lastUpdate = Date.now();
    current = state;
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
          if (s) apply(s, OM.timeOf(r.at));
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
      loadState();
    });
    ext.listen("broadcast", function (_target, _contentType, message) {
      var m = OM.parseMessage(message);
      if (m) apply(m.state, m.at);
    });
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
