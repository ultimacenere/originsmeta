/**
 * Finestra nascosta della modalità cattura (main/frames.ts): riprende la finestra del gioco che le indica il processo
 * principale e gli manda un JPEG ogni `FRAME_MS`, solo se lo schermo è cambiato rispetto all'ultimo fotogramma salvato.
 */
import type { FramesApi } from "../shared/types";
import { FRAME_MS, frameSignature, SAME_FRAME_DIFF, SIGNATURE_H, SIGNATURE_W, signatureDiff } from "../shared/frames";

declare global {
  interface Window {
    framesApi: FramesApi;
  }
}

const api = window.framesApi;
const video = document.createElement("video");
video.muted = true;
const full = document.createElement("canvas");
const small = document.createElement("canvas");
small.width = SIGNATURE_W;
small.height = SIGNATURE_H;
const smallCtx = small.getContext("2d", { willReadFrequently: true })!;

let stream: MediaStream | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let last: Uint8Array | null = null;
let saving = false;

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

async function start(sourceId: string) {
  stop();
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
  if (track) track.onended = () => {
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
  if (saving || !w || !h) return;
  smallCtx.drawImage(video, 0, 0, SIGNATURE_W, SIGNATURE_H);
  const sig = frameSignature(smallCtx.getImageData(0, 0, SIGNATURE_W, SIGNATURE_H).data);
  if (signatureDiff(last, sig) < SAME_FRAME_DIFF) return;
  if (full.width !== w || full.height !== h) {
    full.width = w;
    full.height = h;
  }
  full.getContext("2d")!.drawImage(video, 0, 0, w, h);
  saving = true;
  full.toBlob(
    (blob) => {
      if (!blob) {
        saving = false;
        return;
      }
      void blob
        .arrayBuffer()
        .then((buf) => api.save(new Uint8Array(buf)))
        .then((ok) => {
          if (ok) last = sig;
        })
        .finally(() => {
          saving = false;
        });
    },
    "image/jpeg",
    0.9,
  );
}

api.onStart((id) => void start(id));
api.onStop(stop);
