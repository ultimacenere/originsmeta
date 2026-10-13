/*
 * Finto window.Twitch.ext per le prove locali (dev/, fuori dallo zip). Simula onAuthorized, onContext e listen
 * ("broadcast") e intercetta fetch verso https://originsmeta.com/api/twitch/*: carte da dev/cards-en.json (node
 * dev/make-cards.mjs), stato d'esempio, collegamento (ABCD-EFGH riesce, NOPE-NOPE = forbidden, DOWN-DOWN = unavailable,
 * il resto invalid_code). Le immagini delle carte arrivano davvero da originsmeta.com.
 * Comandi in window.Mock (anche dalla barra di prova di mock.html).
 */
(function () {
  "use strict";

  var listeners = [];
  var contextCbs = [];
  var authCbs = [];
  var realFetch = window.fetch.bind(window);

  var state = {
    v: 1,
    deck: {
      name: "Mulan Tempo",
      legendary: "C00115_MC",
      cards: [
        ["C00115_MC", 1, 0, 0],
        ["C00245_MB", 2, 1, 1],
        ["C00013_SB", 2, 1, 0],
        ["C00029_MB", 2, 0, 0],
        ["C00202_MB", 2, 2, 1],
        ["C00015_SB", 2, 0, 0],
        ["C00064_MB", 2, 0, 0],
        ["C00021_MB", 2, 1, 1],
        ["C00109_MB", 2, 0, 0],
        ["C00006_MB", 2, 0, 0],
        ["C00173_MB", 2, 0, 0],
        ["C00125_MB", 2, 0, 0],
        ["C00258_MB", 2, 0, 0]
      ]
    },
    live: { inMatch: true, round: 3, deckLeft: 19, opp: { legendary: "C00118_MC", deckLeft: 18, seen: [["C00029_MB", 1], ["C00028_SB", 2], ["C00032_MB", 1]] } }
  };
  var at = Date.now();

  function iso(ms) {
    return new Date(ms).toISOString();
  }
  function json(body, status) {
    return Promise.resolve(new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json" } }));
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input.url;
    if (url.indexOf("https://originsmeta.com/api/twitch/cards/") === 0) {
      return realFetch("/dev/cards-en.json");
    }
    if (url.indexOf("https://originsmeta.com/api/twitch/state") === 0) {
      return json(window.Mock.noState ? { state: null } : { state: state, at: iso(at) });
    }
    if (url === "https://originsmeta.com/api/twitch/link") {
      var body = {};
      try {
        body = JSON.parse((init && init.body) || "{}");
      } catch (e) {
        /* niente */
      }
      var auth = (init && init.headers && (init.headers.authorization || init.headers.Authorization)) || "";
      console.log("[mock] POST /api/twitch/link", body, auth ? "con token" : "SENZA token");
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (body.code === "ABCD-EFGH") resolve(json({ username: "pierluigi" }));
          else if (body.code === "NOPE-NOPE") resolve(json({ error: "forbidden" }, 401));
          else if (body.code === "DOWN-DOWN") resolve(json({ error: "unavailable" }, 503));
          else resolve(json({ error: "invalid_code" }, 400));
        }, 400);
      });
    }
    return realFetch(input, init);
  };

  function send(message) {
    listeners.forEach(function (cb) {
      cb("broadcast", "application/json", message);
    });
  }
  function push() {
    at = Date.now();
    send(JSON.stringify({ t: "state", at: iso(at), s: state }));
  }

  window.Mock = {
    noState: false,
    state: function () {
      return state;
    },
    draw: function () {
      if (!state.deck) return;
      var options = state.deck.cards.filter(function (c) {
        return c[2] < c[1];
      });
      if (!options.length) return;
      var c = options[Math.floor(Math.random() * options.length)];
      c[2]++;
      if (state.live && state.live.deckLeft) state.live.deckLeft--;
      push();
    },
    play: function () {
      if (!state.deck) return;
      var options = state.deck.cards.filter(function (c) {
        return c[3] < c[2];
      });
      if (!options.length) return;
      options[Math.floor(Math.random() * options.length)][3]++;
      push();
    },
    round: function () {
      if (!state.live) return;
      state.live.round = (state.live.round || 0) + 1;
      push();
    },
    oppCard: function () {
      if (!state.live) return;
      var pool = ["C00147_MB", "C00009_MB", "C00162_SB", "C00180_MB", "C00267_MB", "C00160_MB", "C00261_MB", "C00054_MB"];
      var key = pool[Math.floor(Math.random() * pool.length)];
      var hit = state.live.opp.seen.filter(function (s) {
        return s[0] === key;
      })[0];
      if (hit) hit[1]++;
      else state.live.opp.seen.push([key, 1]);
      if (state.live.opp.deckLeft) state.live.opp.deckLeft--;
      push();
    },
    endMatch: function () {
      state.live = state.live ? { inMatch: false, round: null, deckLeft: null, opp: { legendary: null, deckLeft: null, seen: [] } } : null;
      push();
    },
    newMatch: function () {
      if (state.deck) state.deck.cards.forEach(function (c) { c[2] = 0; c[3] = 0; });
      state.live = { inMatch: true, round: 1, deckLeft: 25, opp: { legendary: "C00175_MC", deckLeft: 25, seen: [] } };
      push();
    },
    noDeck: function () {
      state.deck = null;
      state.live = null;
      push();
    },
    restoreDeck: function () {
      window.location.reload();
    },
    oldMessage: function () {
      // più vecchio dell'ultimo: l'estensione lo deve ignorare
      var copy = JSON.parse(JSON.stringify(state));
      copy.deck.name = "IGNORAMI (vecchio)";
      send(JSON.stringify({ t: "state", at: iso(at - 60000), s: copy }));
    },
    badMessage: function () {
      send(JSON.stringify({ t: "state", at: iso(Date.now()), s: { v: 1, deck: { name: "<img src=x onerror=alert(1)>", legendary: null, cards: [["<b>x</b>", 2, 0, 0]] }, live: null } }));
      send("{non è JSON");
      send(JSON.stringify({ t: "state", at: iso(Date.now()), s: { v: 1, deck: { name: "<img src=x onerror=alert(1)>", legendary: null, cards: [["C00245_MB", 2, 0, 0]] }, live: null } }));
    }
  };

  window.Twitch = {
    ext: {
      version: "mock",
      onAuthorized: function (cb) {
        authCbs.push(cb);
        setTimeout(function () {
          cb({ channelId: "123456789", clientId: "mockclientid", token: "mock.header.signature", helixToken: "", userId: "U123456789" });
        }, 60);
      },
      onContext: function (cb) {
        contextCbs.push(cb);
        setTimeout(function () {
          cb({ mode: "viewer", isFullScreen: false, displayResolution: window.innerWidth + "x" + window.innerHeight }, ["mode"]);
        }, 80);
      },
      listen: function (target, cb) {
        if (target === "broadcast") listeners.push(cb);
      },
      unlisten: function () {},
      onError: function () {},
      onVisibilityChanged: function () {},
      rig: { log: function () { console.log.apply(console, arguments); } }
    }
  };
})();
