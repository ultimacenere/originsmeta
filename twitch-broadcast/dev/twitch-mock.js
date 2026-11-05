/*
 * Finto window.Twitch.ext per le prove locali di Broadcasting OM (dev/, fuori dallo zip). onAuthorized dà un canale
 * (?channel=, 123456789 se manca) e un token (?token=, oppure un JWT firmato qui con ?secret=<base64>, lo stesso
 * TWITCH_BCAST_EXT_SECRET di .env.development.local, per provare il collegamento vero); onContext dà la latenza
 * (?latency=<secondi>). PubSub si simula: ogni secondo e mezzo si rilegge /api/broadcast/ext/state del canale e,
 * quando la versione cambia, si chiama listen("broadcast") con lo stesso messaggio che manderebbe il sito.
 */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var channelId = params.get("channel") || "123456789";
  var latency = Number(params.get("latency") || 0);
  var listeners = [];
  var last = null;

  function b64url(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  function signJwt(secretB64, claims) {
    var enc = new TextEncoder();
    var head = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
    var body = b64url(enc.encode(JSON.stringify(claims)));
    var raw = Uint8Array.from(atob(secretB64), function (c) {
      return c.charCodeAt(0);
    });
    return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]).then(function (key) {
      return crypto.subtle.sign("HMAC", key, enc.encode(head + "." + body)).then(function (sig) {
        return head + "." + body + "." + b64url(new Uint8Array(sig));
      });
    });
  }
  function token() {
    var secret = params.get("secret");
    if (!secret) return Promise.resolve(params.get("token") || "dev");
    return signJwt(secret, { exp: Math.floor(Date.now() / 1000) + 3600, channel_id: channelId, opaque_user_id: "U" + channelId, user_id: channelId, role: "broadcaster" });
  }

  function poll() {
    fetch("/api/broadcast/ext/state?channel=" + channelId, { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (r) {
        if (!r || typeof r.v !== "number") return;
        var sig = r.id + ":" + r.v;
        if (last !== null && sig !== last && r.id) {
          var message = JSON.stringify({ t: "bc", id: r.id, v: r.v, at: r.at, s: r.s });
          listeners.forEach(function (cb) {
            cb("broadcast", "application/json", message);
          });
        }
        last = sig;
      })
      .catch(function () {
        /* sito in sviluppo spento: si riprova */
      })
      .finally(function () {
        setTimeout(poll, 1500);
      });
  }

  window.Twitch = {
    ext: {
      onAuthorized: function (cb) {
        token().then(function (tk) {
          setTimeout(function () {
            cb({ channelId: channelId, clientId: "dev", token: tk, userId: "U" + channelId });
          }, 50);
        });
      },
      onContext: function (cb) {
        setTimeout(function () {
          cb({ hlsLatencyBroadcaster: latency, arePlayerControlsVisible: false, mode: "viewer" });
        }, 60);
      },
      listen: function (target, cb) {
        if (target === "broadcast") listeners.push(cb);
      },
      configuration: { onChanged: function () {}, set: function () {}, broadcaster: null }
    }
  };
  poll();
})();
