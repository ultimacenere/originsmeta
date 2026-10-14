/*
 * OriginsMeta Deck tracker, estensione Twitch: pagina di configurazione dello streamer (config.html, usata anche come
 * Live Config). Tre passi e il collegamento del canale: il codice creato su originsmeta.com/<lingua>/account/tracker
 * (riquadro "Estensione Twitch", vale 10 minuti, una volta) va a POST https://originsmeta.com/api/twitch/link con il
 * token che Twitch dà all'estensione (onAuthorized). Il sito accetta solo il ruolo "broadcaster" del canale.
 *
 * Dal 14/10/2026 anche la scelta di come gli spettatori vedono il mazzo (Pierluigi: "sì procedi, con la scelta nella
 * configurazione"): "come l'app" (i pannelli di OriginsMeta Tracker negli stessi punti, overlay.js) o "linguetta". Si
 * salva nel Configuration Service di Twitch, segmento "broadcaster", versione MODE_VERSION: {"view": "app" | "tab"}.
 */
(function () {
  "use strict";

  var OM = window.OM;
  var t = OM.t;
  var el = OM.el;

  var token = null;
  var busy = false;

  // ---------- struttura ----------
  var step2 = el("li", null, [
    t("cfgStep2a"),
    OM.siteLink("/account/tracker", "originsmeta.com/" + OM.lang + "/account/tracker", "om-link om-link--inline"),
    t("cfgStep2b")
  ]);

  var input = el("input", {
    cls: "cfg-input",
    attrs: {
      id: "cfg-code",
      type: "text",
      inputmode: "text",
      autocomplete: "off",
      autocapitalize: "characters",
      spellcheck: "false",
      maxlength: "12",
      placeholder: "ABCD-EFGH",
      "aria-describedby": "cfg-status"
    }
  });
  var button = el("button", { cls: "cfg-button", text: t("cfgButton"), attrs: { type: "submit" } });
  var status = el("p", { cls: "cfg-status", attrs: { id: "cfg-status", role: "status", "aria-live": "polite" } });
  var form = el("form", { cls: "cfg-form", attrs: { novalidate: "" } }, [
    el("label", { cls: "cfg-label", text: t("cfgLabel"), attrs: { for: "cfg-code" } }),
    el("div", { cls: "cfg-field" }, [input, button]),
    status
  ]);

  // ---------- come gli spettatori vedono il mazzo (14/10/2026) ----------
  var MODE_VERSION = "1";
  var modeStatus = el("p", { cls: "cfg-status", attrs: { role: "status", "aria-live": "polite" } });
  function modeOption(value, label, hint) {
    var radio = el("input", { attrs: { type: "radio", name: "om-mode", value: value, id: "om-mode-" + value } });
    return {
      radio: radio,
      node: el("label", { cls: "cfg-mode", attrs: { for: "om-mode-" + value } }, [radio, el("span", { cls: "cfg-mode-text" }, [el("b", { text: label }), el("span", { text: hint })])])
    };
  }
  var optApp = modeOption("app", t("cfgModeApp"), t("cfgModeAppHint"));
  var optTab = modeOption("tab", t("cfgModeTab"), t("cfgModeTabHint"));
  optTab.radio.checked = true;
  var modeBox = el("fieldset", { cls: "cfg-modes" }, [el("legend", { cls: "cfg-label", text: t("cfgModeTitle") }), optApp.node, optTab.node, modeStatus]);

  var main = el("main", { cls: "cfg" }, [
    el("h1", { cls: "cfg-title" }, [el("span", { cls: "om-tab-mark", attrs: { "aria-hidden": "true" } }), " ", t("cfgTitle")]),
    el("p", { cls: "cfg-intro", text: t("cfgIntro") }),
    el("ol", { cls: "cfg-steps" }, [el("li", { text: t("cfgStep1") }), step2, el("li", { text: t("cfgStep3") })]),
    form,
    modeBox,
    el("p", { cls: "cfg-note", text: t("cfgNote") }),
    el("p", { cls: "om-foot cfg-foot", text: t("footer") })
  ]);
  document.body.appendChild(main);

  // ---------- comportamento ----------
  function setStatus(text, kind) {
    status.textContent = text || "";
    status.className = "cfg-status" + (kind ? " is-" + kind : "");
  }

  /** "abcd efgh", "ABCD-EFGH" → "ABCD-EFGH"; null se non sono 8 lettere e numeri. */
  function normalize(value) {
    var raw = String(value || "").slice(0, 40).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return raw.length === 8 ? raw.slice(0, 4) + "-" + raw.slice(4) : null;
  }

  function errorText(code) {
    var known = ["invalid_code", "forbidden", "unavailable", "error"];
    return t("cfgErr_" + (known.indexOf(code) >= 0 ? code : "error"));
  }

  input.addEventListener("input", function () {
    var pos = input.selectionStart;
    input.value = input.value.toUpperCase();
    try {
      input.setSelectionRange(pos, pos);
    } catch (e) {
      /* alcuni tipi di campo non lo permettono */
    }
    if (status.classList.contains("is-error")) setStatus("", null);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var code = normalize(input.value);
    if (!code) {
      setStatus(t("cfgFormat"), "error");
      input.focus();
      return;
    }
    if (!token) {
      setStatus(t("cfgNotReady"), "error");
      return;
    }
    busy = true;
    button.disabled = true;
    button.textContent = t("cfgBusy");
    setStatus("", null);

    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    fetch(OM.BASE + "/api/twitch/link", {
      method: "POST",
      credentials: "omit",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify({ code: code }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            return { ok: res.ok, status: res.status, body: body && typeof body === "object" ? body : {} };
          });
      })
      .then(function (r) {
        if (r.ok && !r.body.error) {
          var user = typeof r.body.username === "string" ? r.body.username.replace(/[^\w.-]/g, "").slice(0, 40) : "";
          setStatus(user ? t("cfgDone", { user: user }) : t("cfgDoneNoUser"), "ok");
          input.value = "";
          return;
        }
        var err = typeof r.body.error === "string" ? r.body.error : r.status === 503 ? "unavailable" : r.status === 401 ? "forbidden" : "error";
        setStatus(errorText(err), "error");
      })
      .catch(function () {
        setStatus(errorText("unavailable"), "error");
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
        busy = false;
        button.disabled = false;
        button.textContent = t("cfgButton");
      });
  });

  var ext = window.Twitch && window.Twitch.ext;
  if (ext) {
    ext.onAuthorized(function (auth) {
      token = auth && typeof auth.token === "string" && auth.token.length < 4096 ? auth.token : null;
    });
    // la scelta salvata nel segmento "broadcaster" del Configuration Service di Twitch
    if (ext.configuration) {
      ext.configuration.onChanged(function () {
        var seg = ext.configuration.broadcaster;
        var view = "tab";
        try {
          var c = seg && typeof seg.content === "string" ? JSON.parse(seg.content) : null;
          if (c && c.view === "app") view = "app";
        } catch (e) {
          /* contenuto illeggibile: resta la linguetta */
        }
        optApp.radio.checked = view === "app";
        optTab.radio.checked = view !== "app";
      });
      [optApp.radio, optTab.radio].forEach(function (radio) {
        radio.addEventListener("change", function () {
          if (!radio.checked) return;
          try {
            ext.configuration.set("broadcaster", MODE_VERSION, JSON.stringify({ view: radio.value === "app" ? "app" : "tab" }));
            modeStatus.textContent = t("cfgModeSaved");
            modeStatus.className = "cfg-status is-ok";
          } catch (e) {
            modeStatus.textContent = t("cfgModeError");
            modeStatus.className = "cfg-status is-error";
          }
        });
      });
    }
  }
})();
