#!/usr/bin/env bash
# Prove dell'AppImage di OriginsMeta Tracker su Linux (0.6.0, 13/11/2026), per GitHub Actions
# (.github/workflows/tracker-linux.yml), dopo `npm run package:linux`. Su un X11 virtuale (Xvfb) con un window manager
# (openbox), come una sessione desktop:
#   1. l'AppImage aperto da una sessione Wayland (finta) parte lo stesso: il lanciatore lo porta in X11 (schermata di
#      collegamento, screenshot in out/ci/);
#   2. "con il gioco": l'app aspetta senza fare niente finché non c'è un processo OriginsTCG.exe, poi parte e scrive la
#      voce dell'avvio, quella del menu con l'icona e la cartella dei dati ~/.config/OriginsMeta Tracker;
#   3. Electron in X11 vede e riprende una finestra "Origins TCG" (scripts/linux-capture-check.cjs);
#   4. la pagina Setup con i testi di Linux (app di sviluppo sbloccata, screenshot).
# Il gioco vero con Proton qui non c'è: la prova sul gioco la fa un giocatore su Linux.
set -euo pipefail
cd "$(dirname "$0")/.."
APP="$PWD/out/OriginsMeta-Tracker-linux-x86_64.AppImage"
OUT="$PWD/out/ci"
ID="com.originsmeta.tracker"
mkdir -p "$OUT"
[ -x "$APP" ] || { echo "::error::manca $APP (npm run package:linux)"; exit 1; }

# un errore diventa un'annotazione del job con la coda dei registri (i registri di Actions si leggono solo con l'accesso)
fail() {
  local msg="$1" logs=""
  msg="${msg//'%'/'%25'}"
  msg="${msg//':'/'%3A'}"
  msg="${msg//','/'%2C'}"
  # prima i risultati delle prove, poi i registri dell'app; quelli di Xvfb e openbox sono solo rumore
  for f in "$OUT"/*.json "$OUT"/*.log; do
    case "$(basename "$f")" in xvfb.log | openbox.log) continue ;; esac
    [ -s "$f" ] && logs="$logs--- $(basename "$f")"$'\n'"$(grep -v 'dbus/' "$f" | tail -n 25)"$'\n'
  done
  logs="${logs//'%'/'%25'}"
  logs="${logs//$'\r'/}"
  logs="${logs//$'\n'/'%0A'}"
  echo "::error title=$msg::${logs:0:3500}"
  exit 1
}

echo "namespace utente vietati da AppArmor: $(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null || echo 'n/d')"

export DISPLAY=:99
Xvfb :99 -screen 0 1600x900x24 +extension Composite >"$OUT/xvfb.log" 2>&1 &
XVFB=$!
sleep 2
openbox >"$OUT/openbox.log" 2>&1 &
WM=$!
sleep 1
export ORIGINSMETA_NO_UPDATE=1
PIDS=()
cleanup() {
  for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
  kill "$WM" "$XVFB" 2>/dev/null || true
}
trap cleanup EXIT

echo "1) AppImage aperto da una sessione Wayland: parte in X11"
H1="$(mktemp -d)"
env HOME="$H1" XDG_SESSION_TYPE=wayland WAYLAND_DISPLAY=wayland-finto ORIGINSMETA_TRACKER_DATA="$H1/dati" \
  timeout 120 "$APP" --appimage-extract-and-run --capture="$OUT/collegamento.png" --capture-delay=1500 >"$OUT/collegamento.log" 2>&1 \
  || fail "l'AppImage non si apre (o non si chiude dopo lo screenshot)"
[ -s "$OUT/collegamento.png" ] || fail "manca lo screenshot della schermata di collegamento"
echo "   ok ($(stat -c %s "$OUT/collegamento.png") byte)"

echo "2) Con il gioco: aspetta OriginsTCG.exe, poi parte e scrive le voci del desktop"
H2="$(mktemp -d)"
AUTO="$H2/.config/autostart/$ID.desktop"
MENU="$H2/.local/share/applications/$ID.desktop"
env HOME="$H2" XDG_CONFIG_HOME="$H2/.config" XDG_DATA_HOME="$H2/.local/share" \
  "$APP" --appimage-extract-and-run --hidden --wait-game >"$OUT/con-il-gioco.log" 2>&1 &
PIDS+=($!)
sleep 15
[ ! -e "$AUTO" ] || fail "l'app è partita senza il gioco"
pgrep -f "usr/lib/originsmeta-tracker/originsmeta-tracker" >/dev/null || fail "l'app in attesa del gioco si è chiusa"
ELECTRON="$(pgrep -o -f "usr/lib/originsmeta-tracker/originsmeta-tracker")"
echo "   riga di comando: $(tr '\0' ' ' < "/proc/$ELECTRON/cmdline")"
tr '\0' '\n' < "/proc/$ELECTRON/cmdline" | grep -qx -- "--ozone-platform=x11" || fail "l'app non è partita in X11"
cp /bin/sleep "$H2/OriginsTCG.exe"
"$H2/OriginsTCG.exe" 300 &
PIDS+=($!)
for _ in $(seq 1 40); do [ -e "$AUTO" ] && [ -e "$MENU" ] && break; sleep 1; done
[ -e "$AUTO" ] || fail "l'app non è partita con il gioco (manca la voce dell'avvio)"
[ -e "$MENU" ] || fail "manca la voce del menu"
grep -qxF "Exec=$APP --hidden --wait-game" "$AUTO" || { cat "$AUTO"; fail "voce dell'avvio con l'eseguibile sbagliato"; }
grep -qxF "Exec=$APP" "$MENU" || { cat "$MENU"; fail "voce del menu con l'eseguibile sbagliato"; }
[ -s "$H2/.local/share/icons/hicolor/256x256/apps/$ID.png" ] || fail "manca l'icona della voce del menu"
[ -d "$H2/.config/OriginsMeta Tracker" ] || fail "manca la cartella dei dati ~/.config/OriginsMeta Tracker"
cp "$AUTO" "$OUT/autostart.desktop"
cp "$MENU" "$OUT/menu.desktop"
echo "   ok"

echo "3) Ripresa di una finestra \"Origins TCG\" in X11"
set +e
timeout 90 npx --no-install electron --ozone-platform=x11 --no-sandbox scripts/linux-capture-check.cjs >"$OUT/ripresa.json" 2>"$OUT/ripresa.log"
code=$?
set -e
cat "$OUT/ripresa.json"
# il risultato si vede sempre fra le annotazioni, anche quando la prova passa
r="$(cat "$OUT/ripresa.json")"
echo "::notice title=Ripresa della finestra::${r//$'\n'/'%0A'}"
[ "$code" -eq 0 ] || fail "Electron in X11 non vede o non riprende la finestra del gioco"

echo "4) Setup con i testi di Linux (app di sviluppo sbloccata)"
H4="$(mktemp -d)"
env HOME="$H4" ORIGINSMETA_TRACKER_DATA="$H4/dati" \
  timeout 120 npx --no-install electron --ozone-platform=x11 --no-sandbox . --capture="$OUT/setup.png" --capture-unlocked --capture-setup --capture-delay=1500 >"$OUT/setup.log" 2>&1 \
  || fail "l'app di sviluppo non si apre"
[ -s "$OUT/setup.png" ] || fail "manca lo screenshot di Setup"
echo "   ok"
echo "Prove dell'AppImage: tutte passate"
