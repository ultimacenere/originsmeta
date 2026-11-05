/*
 * Broadcasting OM, estensione Twitch (05/11/2026): la pagina di chi guarda, sopra il video (Video - Fullscreen).
 *
 * Nel video c'è già l'overlay di Broadcasting OM messo in OBS (targhette dei giocatori "Clicca per il mazzo", punteggio,
 * liste): l'estensione lo rende cliccabile. Zone invisibili sopra le due targhette (stesse misure di broadcast.css, su
 * un palco di 1920 × 1080 scalato al video) e una linguetta sul bordo sinistro, sempre raggiungibile anche quando i
 * controlli del player coprono la parte alta. Un clic apre il pannello: i due giocatori, i loro mazzi (Mazzo 1, 2, 3,
 * con il pallino su quello in campo), la lista con le copie rimaste, l'anteprima della carta passandoci sopra e il tasto
 * "Copia mazzo" con il codice del gioco.
 *
 * Dati: le carte una volta da /api/broadcast/ext/cards/<lingua>; lo stato della regia collegata al canale da
 * /api/broadcast/ext/state?channel=<id> all'apertura, poi con l'Extension PubSub ("broadcast"). Gli aggiornamenti si
 * applicano con il ritardo del video (latenza di chi trasmette, onContext), così le copie giocate cambiano quando si
 * vedono giocare. Senza stato con dei mazzi non si mostra niente.
 *
 * Regole di Twitch come il Deck tracker: niente sotto 500 × 340, 75 px liberi a destra per la barra delle estensioni,
 * il pannello fuori dalle fasce dei controlli (70 px in alto, 90 in basso), tastiera (Tab, Invio, Esc), niente HTML
 * dalla rete, l'unico link esterno porta alla scheda della carta su originsmeta.com in una nuova scheda.
 */
(function () {
  "use strict";

  var BO = window.BO;
  var t = BO.t;
  var el = BO.el;

  var MIN_W = 500;
  var MIN_H = 340;
  var TOP_BAND = 70;
  var BOTTOM_BAND = 90;
  var RIGHT_BAND = 75;
  var STAGE_W = 1920;
  // targhette dei due giocatori nell'overlay di OBS (broadcast.css: .bc-plate-0, .bc-plate-1, nome e linguette dei mazzi)
  var PLATES = [
    { x: 396, y: 12, w: 206, h: 118 },
    { x: 1552, y: 12, w: 206, h: 118 }
  ];
  var STALE_MS = 5 * 60 * 1000;

  var table = null; // {labels, cards}
  var state = null; // ExtState
  var liveId = null;
  var version = -1;
  var channelId = null;
  var delayMs = 0;
  var lastUpdate = Date.now();

  var open = false;
  var player = 0;
  var viewing = [null, null]; // mazzo guardato per giocatore (null = quello in campo)
  var pinned = null; // carta fissata con un tocco o con Invio
  var codeShown = null; // codice mostrato quando la copia non riesce

  // ---------- struttura ----------
  var root = el("div", { cls: "bo-root" });
  var tab = el("button", { cls: "bo-tab", attrs: { type: "button", "aria-expanded": "false", "aria-controls": "bo-panel", "aria-label": t("tabAria"), hidden: "" } }, [
    el("span", { cls: "bo-tab-mark", text: "OM", attrs: { "aria-hidden": "true" } }),
    el("span", { cls: "bo-tab-text", text: t("tab") })
  ]);
  var hots = [0, 1].map(function (i) {
    return el("button", { cls: "bo-hot", attrs: { type: "button", "data-p": String(i), hidden: "" } });
  });
  var panel = el("section", { cls: "bo-panel", attrs: { id: "bo-panel", hidden: "", "aria-label": t("tabAria") } });
  var peek = el("div", { cls: "bo-peek", attrs: { hidden: "" } });
  root.appendChild(tab);
  hots.forEach(function (h) {
    root.appendChild(h);
  });
  root.appendChild(panel);
  root.appendChild(peek);
  document.body.appendChild(root);

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function card(slug) {
    return (table && table.cards[slug]) || null;
  }
  function hasDecks() {
    return (
      !!state &&
      state.p.some(function (p) {
        return p.d.some(function (d) {
          return d.l || d.c.length;
        });
      })
    );
  }
  function copiesOf(deck, slug) {
    if (deck.l === slug) return 1;
    return deck.c.indexOf(slug) >= 0 ? 2 : 0;
  }
  function leftOf(deck, slug) {
    return Math.max(copiesOf(deck, slug) - (deck.p[slug] || 0), 0);
  }
  /** Le carte del mazzo da mostrare: Leggendaria in testa, poi per costo e nome (come l'overlay di OBS). */
  function rowsOf(deck) {
    var base = deck.c.map(card).filter(Boolean);
    base.sort(function (a, b) {
      var ca = a.cost === null ? 99 : a.cost;
      var cb = b.cost === null ? 99 : b.cost;
      return ca - cb || a.name.localeCompare(b.name);
    });
    var leg = deck.l ? card(deck.l) : null;
    return leg ? [leg].concat(base) : base;
  }
  function deckIndexOf(p) {
    var pl = state.p[p];
    var v = viewing[p];
    return v !== null && v < pl.d.length ? v : pl.a;
  }
  function keysOf(deck) {
    var slugs = [deck.l].concat(deck.c).filter(Boolean);
    if (!slugs.length) return null;
    var keys = slugs.map(function (s) {
      var c = card(s);
      return c ? c.key : null;
    });
    return keys.every(Boolean) ? keys : null;
  }

  // ---------- posizioni ----------
  /** Il rettangolo del video nel player: 16:9 al centro (con le bande se il player ha un'altra forma). */
  function videoRect() {
    var W = window.innerWidth;
    var H = window.innerHeight;
    var scale = Math.min(W / 16, H / 9);
    var w = 16 * scale;
    var h = 9 * scale;
    return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h, k: w / STAGE_W };
  }

  function visible() {
    return !!table && hasDecks() && window.innerWidth >= MIN_W && window.innerHeight >= MIN_H;
  }

  function place() {
    var show = visible();
    tab.hidden = !show;
    hots.forEach(function (h) {
      h.hidden = !show;
    });
    if (!show) {
      panel.hidden = true;
      peek.hidden = true;
      return;
    }
    var W = window.innerWidth;
    var H = window.innerHeight;
    var v = videoRect();
    var tabTop = Math.round(v.y + v.h * 0.42);
    tab.style.left = Math.round(Math.max(v.x, 0)) + "px";
    tab.style.top = Math.min(tabTop, H - BOTTOM_BAND - 80) + "px";
    PLATES.forEach(function (r, i) {
      var h = hots[i];
      h.style.left = Math.round(v.x + r.x * v.k) + "px";
      h.style.top = Math.round(v.y + r.y * v.k) + "px";
      h.style.width = Math.round(r.w * v.k) + "px";
      h.style.height = Math.round(r.h * v.k) + "px";
      var name = state.p[i].n || "—";
      h.setAttribute("aria-label", t("plateAria", { name: name }));
      h.setAttribute("title", t("plateAria", { name: name }));
    });
    var left = Math.round(Math.max(v.x, 0) + 44);
    var top = Math.round(Math.max(v.y + 10, TOP_BAND + 6));
    var bottom = Math.round(Math.min(v.y + v.h - 10, H - BOTTOM_BAND));
    var width = Math.round(Math.min(330, Math.max(250, v.w * 0.22)));
    panel.style.left = left + "px";
    panel.style.top = top + "px";
    panel.style.width = width + "px";
    panel.style.maxHeight = Math.max(180, bottom - top) + "px";
    // anteprima a destra del pannello; se non c'è posto (player piccolo) sopra il pannello
    var room = W - RIGHT_BAND - (left + width + 12);
    var pw = Math.min(380, room);
    if (pw >= 240) {
      peek.style.left = left + width + 12 + "px";
      peek.style.width = pw + "px";
    } else {
      peek.style.left = left + "px";
      peek.style.width = width + "px";
    }
    peek.style.top = top + "px";
    peek.style.maxHeight = Math.max(180, bottom - top) + "px";
  }

  // ---------- pannello ----------
  function render() {
    place();
    tab.setAttribute("aria-expanded", open && visible() ? "true" : "false");
    tab.classList.toggle("is-open", open && visible());
    if (!visible() || !open) {
      panel.hidden = true;
      hidePeek(true);
      return;
    }
    var keepFocus = document.activeElement && panel.contains(document.activeElement) ? document.activeElement.getAttribute("data-focus") : null;
    clear(panel);
    panel.hidden = false;
    var pl = state.p[player];
    var di = deckIndexOf(player);
    var deck = pl.d[di];

    // giocatori
    var who = el("div", { cls: "bo-players", attrs: { role: "tablist" } });
    state.p.forEach(function (p, i) {
      who.appendChild(
        el(
          "button",
          { cls: "bo-player", attrs: { type: "button", role: "tab", "aria-selected": i === player ? "true" : "false", "data-player": String(i), "data-focus": "p" + i } },
          [el("span", { cls: "bo-player-name", text: p.n || "—" }), p.t ? el("span", { cls: "bo-player-title", text: p.t }) : null]
        )
      );
    });
    var x = el("button", { cls: "bo-x", text: "×", attrs: { type: "button", "aria-label": t("close"), title: t("close"), "data-close": "", "data-focus": "x" } });
    panel.appendChild(el("header", { cls: "bo-head" }, [who, x]));

    // mazzi del giocatore
    var decks = el("div", { cls: "bo-decks", attrs: { role: "tablist" } });
    pl.d.forEach(function (d, i) {
      var leg = d.l ? card(d.l) : null;
      decks.appendChild(
        el("button", {
          cls: "bo-deck" + (i === pl.a ? " is-inplay" : ""),
          text: t("deck", { n: i + 1 }),
          attrs: { type: "button", role: "tab", "aria-selected": i === di ? "true" : "false", "data-deck": String(i), "data-focus": "d" + i, title: [d.n, leg ? leg.name : ""].filter(Boolean).join(" · ") || null }
        })
      );
    });
    panel.appendChild(decks);

    // titolo del mazzo
    var sub = [];
    if (pl.n) sub.push(el("span", { text: pl.n }));
    if (deck.n) sub.push(el("span", { text: t("deck", { n: di + 1 }) }));
    if (di === pl.a) sub.push(el("span", { cls: "bo-inplay", text: t("inPlay") }));
    panel.appendChild(el("div", { cls: "bo-title" }, [el("span", { cls: "bo-title-name", text: deck.n || t("deck", { n: di + 1 }) }), el("span", { cls: "bo-title-sub" }, sub)]));

    // lista
    var list = el("ul", { cls: "bo-rows" });
    rowsOf(deck).forEach(function (c) {
      var total = copiesOf(deck, c.slug);
      var left = leftOf(deck, c.slug);
      var row = el(
        "button",
        {
          cls: "bo-row" + (c.legendary ? " is-legendary" : "") + (c.spell ? " is-spell" : "") + (left === 0 ? " is-out" : "") + (pinned === c.slug ? " is-pinned" : ""),
          attrs: { type: "button", "data-slug": c.slug, "data-focus": "r" + c.slug, "aria-label": c.name + ", " + t("left", { left: left, total: total }) }
        },
        [
          el("span", { cls: "bo-mana", text: c.cost === null ? "?" : String(c.cost), attrs: { "aria-hidden": "true" } }),
          el("span", { cls: "bo-name" }, [c.legendary ? el("span", { cls: "bo-star", text: "★ ", attrs: { "aria-hidden": "true" } }) : null, c.name]),
          el("span", { cls: "bo-copies", text: left + "/" + total, attrs: { "aria-hidden": "true" } })
        ]
      );
      if (c.art) row.style.setProperty("--art", 'url("' + c.art + '")');
      list.appendChild(el("li", null, [row]));
    });
    panel.appendChild(list);

    // copia mazzo
    var keys = keysOf(deck);
    var copy = el("button", { cls: "bo-copy", text: keys ? t("copy") : t("noCode"), attrs: { type: "button", "data-copy": "", "data-focus": "c" } });
    if (!keys) copy.disabled = true;
    var actions = el("div", { cls: "bo-actions" }, [copy]);
    if (codeShown) {
      var input = el("input", { cls: "bo-code", attrs: { type: "text", readonly: "", "aria-label": t("codeLabel"), value: codeShown } });
      input.addEventListener("focus", function () {
        input.select();
      });
      actions.appendChild(input);
    }
    panel.appendChild(actions);
    panel.appendChild(el("p", { cls: "bo-foot", text: t("footer") }));

    if (keepFocus) {
      var again = panel.querySelector('[data-focus="' + keepFocus.replace(/"/g, "") + '"]');
      if (again) again.focus();
    }
    if (pinned && !deck.c.concat(deck.l ? [deck.l] : []).some(function (s) { return s === pinned; })) hidePeek(true);
  }

  function setOpen(value, p) {
    open = value;
    if (typeof p === "number") player = p;
    if (!open) {
      pinned = null;
      codeShown = null;
    }
    render();
    if (open) {
      var first = panel.querySelector('[aria-selected="true"][data-player]');
      if (first) first.focus();
    }
  }

  // ---------- anteprima della carta ----------
  function showPeek(slug, isPinned) {
    var c = card(slug);
    if (!c) return;
    if (isPinned) pinned = slug;
    clear(peek);
    var L = table.labels;
    var close = isPinned ? el("button", { cls: "bo-x bo-peek-x", text: "×", attrs: { type: "button", "aria-label": t("closeCard"), title: t("closeCard") } }) : null;
    if (close)
      close.addEventListener("click", function () {
        hidePeek(true);
      });
    var tags = [];
    if (!c.spell && c.power !== null) tags.push(el("span", { cls: "bo-stats", text: c.power + " / " + (c.health === null ? "?" : c.health) }));
    tags.push(el("span", { cls: "bo-type", text: c.spell ? L.spell : L.unit }));
    if (c.alignment) tags.push(el("span", { cls: "bo-align is-" + c.alignment, text: L[c.alignment] }));
    if (c.legendary) tags.push(el("span", { cls: "bo-leg", text: t("legendary") }));
    var body = el("div", { cls: "bo-peek-body" }, [
      el("div", { cls: "bo-peek-head" }, [el("span", { cls: "bo-mana", text: c.cost === null ? "?" : String(c.cost) }), el("span", { cls: "bo-peek-name", text: (c.legendary ? "★ " : "") + c.name })]),
      el("div", { cls: "bo-tags" }, tags),
      c.text ? el("p", { cls: "bo-peek-text", text: c.text }) : null,
      BO.siteLink("/cards/" + c.slug, t("cardPage"), "bo-link")
    ]);
    var img = c.image ? el("img", { cls: "bo-peek-img", attrs: { src: c.image, alt: c.name, loading: "lazy", decoding: "async" } }) : null;
    if (img)
      img.addEventListener("error", function () {
        img.remove();
      });
    peek.appendChild(el("div", { cls: "bo-peek-card" + (c.legendary ? " is-legendary" : "") }, [close, img, body]));
    peek.hidden = false;
    markPinned();
  }
  function hidePeek(force) {
    if (pinned && !force) return;
    pinned = null;
    peek.hidden = true;
    clear(peek);
    markPinned();
  }
  function markPinned() {
    Array.prototype.forEach.call(panel.querySelectorAll(".bo-row"), function (r) {
      r.classList.toggle("is-pinned", r.getAttribute("data-slug") === pinned);
    });
  }

  // ---------- eventi ----------
  tab.addEventListener("click", function () {
    setOpen(!open);
  });
  hots.forEach(function (h, i) {
    h.addEventListener("click", function () {
      viewing[i] = null;
      setOpen(!(open && player === i), i);
    });
  });
  panel.addEventListener("click", function (e) {
    var target = e.target instanceof Element ? e.target.closest("button") : null;
    if (!target) return;
    if (target.hasAttribute("data-close")) return setOpen(false);
    if (target.hasAttribute("data-player")) {
      player = Number(target.getAttribute("data-player")) === 1 ? 1 : 0;
      codeShown = null;
      hidePeek(true);
      return render();
    }
    if (target.hasAttribute("data-deck")) {
      viewing[player] = Number(target.getAttribute("data-deck")) || 0;
      codeShown = null;
      hidePeek(true);
      return render();
    }
    if (target.hasAttribute("data-copy")) return copyDeck(target);
    var slug = target.getAttribute("data-slug");
    if (slug) {
      if (pinned === slug) hidePeek(true);
      else showPeek(slug, true);
    }
  });
  panel.addEventListener("pointerover", function (e) {
    var row = e.target instanceof Element ? e.target.closest(".bo-row") : null;
    if (row && !pinned && e.pointerType !== "touch") showPeek(row.getAttribute("data-slug"), false);
  });
  panel.addEventListener("pointerleave", function () {
    hidePeek(false);
  });
  panel.addEventListener("focusin", function (e) {
    var row = e.target instanceof Element ? e.target.closest(".bo-row") : null;
    if (row && !pinned) showPeek(row.getAttribute("data-slug"), false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!peek.hidden) {
      hidePeek(true);
      e.preventDefault();
    } else if (open) {
      setOpen(false);
      tab.focus();
      e.preventDefault();
    }
  });
  window.addEventListener("resize", render);

  function writeClipboard(text) {
    var fallback = function () {
      var area = el("textarea", { attrs: { readonly: "", "aria-hidden": "true" } });
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return fallback();
        }
      );
    }
    return Promise.resolve(fallback());
  }

  function copyDeck(button) {
    var deck = state.p[player].d[deckIndexOf(player)];
    var keys = keysOf(deck);
    if (!keys) return;
    BO.encodeGameCode(keys)
      .then(function (code) {
        return writeClipboard(code).then(function (ok) {
          if (ok) {
            button.textContent = t("copied");
            button.classList.add("is-done");
            setTimeout(function () {
              if (!button.isConnected) return;
              button.textContent = t("copy");
              button.classList.remove("is-done");
            }, 1800);
          } else {
            // niente appunti (iframe di Twitch, browser che li blocca): il codice in vista, da copiare a mano
            codeShown = code;
            render();
            var input = panel.querySelector(".bo-code");
            if (input) input.focus();
          }
        });
      })
      .catch(function () {
        button.textContent = t("noCode");
      });
  }

  // ---------- dati ----------
  function apply(id, v, next) {
    if (id && liveId && id === liveId && v < version) return; // più vecchio dell'ultimo della stessa diretta
    liveId = id || liveId;
    version = v;
    state = next;
    lastUpdate = Date.now();
    if (state) {
      [0, 1].forEach(function (i) {
        if (viewing[i] !== null && viewing[i] >= state.p[i].d.length) viewing[i] = null;
      });
    } else {
      open = false;
    }
    render();
  }

  var cardsTries = 0;
  function loadCards() {
    BO.getJson("/api/broadcast/ext/cards/" + BO.lang, 15000)
      .then(function (raw) {
        var parsed = BO.parseCards(raw);
        if (!Object.keys(parsed.cards).length) throw new Error("empty");
        table = parsed;
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
    BO.getJson("/api/broadcast/ext/state?channel=" + encodeURIComponent(channelId), 10000)
      .then(function (r) {
        if (!r || typeof r !== "object" || typeof r.v !== "number") return;
        var id = BO.liveIdOk(r.id) ? r.id : null;
        if (r.s === null) return apply(id, r.v, null);
        var s = BO.parseState(r.s);
        if (s) apply(id, r.v, s);
      })
      .catch(function () {
        /* niente stato: si aspetta PubSub o il prossimo controllo */
      })
      .finally(function () {
        stateLoading = false;
      });
  }

  // un messaggio di PubSub può perdersi: se per 5 minuti non arriva niente si rilegge lo stato
  setInterval(function () {
    if (Date.now() - lastUpdate > STALE_MS) {
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
      if (!BO.channelOk(id) || id === channelId) return;
      channelId = id;
      loadState();
    });
    ext.listen("broadcast", function (_target, _contentType, message) {
      var m = BO.parseMessage(message);
      if (!m) return;
      // tutti gli spettatori rileggono insieme: un po' di attesa a caso, la cache del CDN fa il resto
      if (m.refetch) return void setTimeout(loadState, delayMs + Math.floor(Math.random() * 2000));
      setTimeout(function () {
        apply(m.id, m.v, m.state);
      }, delayMs);
    });
    if (typeof ext.onContext === "function") {
      var lastSize = "";
      ext.onContext(function (ctx) {
        // ritardo del video di chi trasmette: gli aggiornamenti arrivano insieme al video (al massimo 15 secondi)
        var lat = ctx && typeof ctx.hlsLatencyBroadcaster === "number" && isFinite(ctx.hlsLatencyBroadcaster) ? ctx.hlsLatencyBroadcaster : 0;
        delayMs = Math.min(Math.max(Math.round(lat * 1000), 0), 15000);
        var size = window.innerWidth + "x" + window.innerHeight;
        if (size === lastSize) return;
        lastSize = size;
        render();
      });
    }
  }
})();
