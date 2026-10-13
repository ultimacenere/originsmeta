/**
 * Finestra nascosta dello scanner (main/frames.ts): riprende la finestra del gioco che le indica il processo principale
 * e, ogni `FRAME_MS`, solo se lo schermo è cambiato:
 * - legge il fotogramma con il riconoscitore (carte dei 18 spazi, Leggendarie della schermata VS, mana, dall'11/10/2026
 *   anche la mano e la vita degli eroi) e manda il
 *   risultato al processo principale (`scan`): poche decine di byte, i pixel restano qui;
 * - nella modalità cattura (`--frames`) manda anche il JPEG, che il processo principale salva sul PC.
 */
import type { FramesApi } from "../shared/types";
import { FRAME_MS, frameSignature, SAME_FRAME_DIFF, SIGNATURE_H, SIGNATURE_W, signatureDiff } from "../shared/frames";
import { OPP_MANA_TEXT, layoutFor, loadRefs, readBoard, readDirection, readOppHand, readHandAt, readLife, readMana, readPhase, readResult, readSpell, readVersus, windowContent, type Img, type Layout } from "../shared/recognize";
import cardArt from "../card-art.json";
import cardArtExtra from "../card-art-extra.json";
import cardArtHand from "../card-art-hand.json";
import cardArtPreview from "../card-art-preview.json";

declare global {
  interface Window {
    framesApi: FramesApi;
  }
}

const api = window.framesApi;
// le immagini del sito più le versioni ALPHA viste in partita (12/10/2026, `EXTRA_ART` in recognize.ts)
const refs = loadRefs(cardArt as Record<string, string>, cardArtExtra as Record<string, string[]>);
const handRefs = loadRefs(cardArtHand as Record<string, string>);
// il riquadro delle magie in alto a sinistra (13/10/2026, `readSpell` in recognize.ts)
const previewRefs = loadRefs(cardArtPreview as Record<string, string>);
// la mano con le posizioni delle carte (14/10/2026, zone dell'estensione Twitch)
const handOf = (h: { key: string; x: number }[]) => ({ hand: h.map((c) => c.key), handX: h.map((c) => c.x) });
const video = document.createElement("video");
video.muted = true;
const full = document.createElement("canvas");
const fullCtx = full.getContext("2d", { willReadFrequently: true })!;
const small = document.createElement("canvas");
small.width = SIGNATURE_W;
small.height = SIGNATURE_H;
const smallCtx = small.getContext("2d", { willReadFrequently: true })!;

let stream: MediaStream | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let last: Uint8Array | null = null;
let busy = false;
let save = false;
let screens: [number, number][] = [];
/**
 * L'area interna della finestra e le aree del gioco (11/10/2026): la barra del titolo si cerca in ogni fotogramma e vale
 * l'area più vista negli ultimi `LAYOUT_VOTES` (un fotogramma ingannevole, come una dissolvenza uniforme in alto, non
 * sposta tutto); si riparte quando la ripresa cambia misura.
 */
const LAYOUT_VOTES = 15;
let layout: { w: number; h: number; votes: string[]; at: Layout; key: string } | null = null;

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  stream?.getTracks().forEach((t) => {
    t.onended = null;
    t.stop();
  });
  stream = null;
  video.srcObject = null;
  last = null;
}

async function start(sourceId: string, opts: { save: boolean; screens: [number, number][] }) {
  stop();
  save = opts.save;
  screens = opts.screens;
  layout = null;
  try {
    // la vecchia forma di Chromium per riprendere una finestra precisa: niente scelta dell'utente né gesto richiesto
    const constraints = {
      audio: false,
      video: { mandatory: { chromeMediaSource: "desktop", chromeMediaSourceId: sourceId, maxWidth: 3840, maxHeight: 2160, maxFrameRate: 10 } },
    } as unknown as MediaStreamConstraints;
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch {
    api.ended();
    return;
  }
  const track = stream.getVideoTracks()[0];
  if (track)
    track.onended = () => {
      stop();
      api.ended();
    };
  video.srcObject = stream;
  await video.play().catch(() => {});
  timer = setInterval(grab, FRAME_MS);
}

function grab() {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (busy || !w || !h) return;
  smallCtx.drawImage(video, 0, 0, SIGNATURE_W, SIGNATURE_H);
  const sig = frameSignature(smallCtx.getImageData(0, 0, SIGNATURE_W, SIGNATURE_H).data);
  if (signatureDiff(last, sig) < SAME_FRAME_DIFF) return;
  last = sig;
  if (full.width !== w || full.height !== h) {
    full.width = w;
    full.height = h;
  }
  fullCtx.drawImage(video, 0, 0, w, h);
  const ms = Date.now();
  try {
    const img: Img = { data: fullCtx.getImageData(0, 0, w, h).data, width: w, height: h, channels: 4 };
    // a schermo intero la ripresa è grande come lo schermo (a meno di un pixel o due: la scala di Windows arrotonda)
    const fullscreen = screens.some(([sw, sh]) => Math.abs(sw - w) <= 3 && Math.abs(sh - h) <= 3);
    if (!layout || layout.w !== w || layout.h !== h) layout = { w, h, votes: [], at: layoutFor({ x: 0, y: 0, w, h }), key: "" };
    layout.votes = [...layout.votes, JSON.stringify(windowContent(img, fullscreen))].slice(-LAYOUT_VOTES);
    const tally = new Map<string, number>();
    for (const v of layout.votes) tally.set(v, (tally.get(v) ?? 0) + 1);
    const best = [...tally].sort((a, b) => b[1] - a[1])[0][0];
    if (best !== layout.key) layout = { ...layout, key: best, at: layoutFor(JSON.parse(best)) };
    const { board, ui } = layout.at;
    const vs = readVersus(img, refs, layout.at.vs);
    const mana = readMana(img, board);
    const cards = readBoard(img, refs, board).map((m) => m.key);
    // la mano e la vita solo sul tabellone (mana letto): nei menu e nelle schermate di passaggio non ci sono
    const onBoard = mana !== null;
    api.scan({
      ms,
      board: cards,
      vs: vs.me.key && vs.opp.key ? { me: vs.me.key, opp: vs.opp.key } : null,
      maxMana: mana ? mana.max : null,
      result: readResult(img, ui),
      // dall'11/10/2026 sera anche il mana dell'avversario e la freccia del combattimento (pannello a L degli overlay)
      ...(onBoard ? { ...handOf(readHandAt(img, handRefs, layout.at.content).slice(0, 12)), life: readLife(img, board), mana: { me: mana, opp: readMana(img, board, OPP_MANA_TEXT) }, direction: readDirection(img, board), oppHand: readOppHand(img, ui), spell: readSpell(img, previewRefs, ui), phase: readPhase(img, ui) } : {}),
    });
  } catch {
    // un fotogramma che non si legge si salta
  }
  if (!save) return;
  busy = true;
  full.toBlob(
    (blob) => {
      if (!blob) {
        busy = false;
        return;
      }
      void blob
        .arrayBuffer()
        .then((buf) => api.save(new Uint8Array(buf)))
        .finally(() => {
          busy = false;
        });
    },
    "image/jpeg",
    0.9,
  );
}

api.onStart((id, opts) => void start(id, opts));
api.onStop(stop);
