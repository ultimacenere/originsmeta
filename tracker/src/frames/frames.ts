/**
 * Finestra nascosta dello scanner (main/frames.ts): riprende la finestra del gioco che le indica il processo principale
 * e, ogni `FRAME_MS`, solo se lo schermo è cambiato:
 * - legge il fotogramma con il riconoscitore (carte dei 18 spazi, Leggendarie della schermata VS, mana) e manda il
 *   risultato al processo principale (`scan`): poche decine di byte, i pixel restano qui;
 * - nella modalità cattura (`--frames`) manda anche il JPEG, che il processo principale salva sul PC.
 */
import type { FramesApi } from "../shared/types";
import { FRAME_MS, frameSignature, SAME_FRAME_DIFF, SIGNATURE_H, SIGNATURE_W, signatureDiff } from "../shared/frames";
import { loadRefs, readBoard, readMana, readResult, readVersus, type Img } from "../shared/recognize";
import cardArt from "../card-art.json";

declare global {
  interface Window {
    framesApi: FramesApi;
  }
}

const api = window.framesApi;
const refs = loadRefs(cardArt as Record<string, string>);
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

async function start(sourceId: string, opts: { save: boolean }) {
  stop();
  save = opts.save;
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
    const vs = readVersus(img, refs);
    const mana = readMana(img);
    api.scan({ ms, board: readBoard(img, refs).map((m) => m.key), vs: vs.me.key && vs.opp.key ? { me: vs.me.key, opp: vs.opp.key } : null, maxMana: mana ? mana.max : null, result: readResult(img) });
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
