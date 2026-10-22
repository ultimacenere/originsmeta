/**
 * Finestra nascosta dello scanner (main/frames.ts): riprende la finestra del gioco che le indica il processo principale
 * e, ogni `FRAME_MS`, solo se lo schermo è cambiato:
 * - legge il fotogramma con il riconoscitore (carte dei 18 spazi, Leggendarie della schermata VS, mana, dall'11/10/2026
 *   anche la mano e la vita degli eroi) e manda il
 *   risultato al processo principale (`scan`): poche decine di byte, i pixel restano qui;
 * - nella schermata VS (dal 14/10/2026) ritaglia il nome dell'avversario e lo manda al processo principale (`name`),
 *   che lo legge con l'OCR di Windows solo per riconoscere i bot (shared/botNames.ts) e non lo salva;
 * - nella schermata VS (dal 22/10/2026) ritaglia anche la zona sopra il mio ritratto, nera su bianco (`league`): se il
 *   processo principale ci legge una lega, la partita è una classificata (src/lib/tracker/queue.ts);
 * - nella modalità cattura (`--frames`) manda anche il JPEG, che il processo principale salva sul PC.
 */
import type { FramesApi } from "../shared/types";
import { SAME_VERSUS_MS } from "../shared/botNames";
import { FRAME_MS, frameSignature, SAME_FRAME_DIFF, SIGNATURE_H, SIGNATURE_W, signatureDiff } from "../shared/frames";
import { inkOnWhite, LEAGUE_TEXT_H, OPP_MANA_TEXT, VS_MY_LEAGUE, VS_NAME_SCALE, VS_NAME_SHEAR, VS_OPP_NAME, inside, layoutFor, loadRefs, readBoard, readDirection, readOppHand, readHandAt, readLife, readMana, readPhase, readResult, readSpell, readVersus, windowContent, type Img, type Layout } from "../shared/recognize";
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

/**
 * Il nome dell'avversario nella schermata VS (14/10/2026): fino a `NAME_SHOTS` ritagli per schermata, ad almeno
 * `NAME_GAP_MS` l'uno dall'altro (la schermata dura qualche secondo e il primo fotogramma può essere a metà
 * dell'animazione); una schermata VS nuova dopo `SAME_VERSUS_MS` senza.
 */
const NAME_SHOTS = 3;
const NAME_GAP_MS = 700;
let nameShots = { lastVs: 0, lastShot: 0, count: 0 };
const nameCanvas = document.createElement("canvas");

function shootName(vsArea: Layout["vs"], ms: number) {
  if (ms - nameShots.lastVs > SAME_VERSUS_MS) nameShots = { lastVs: ms, lastShot: 0, count: 0 };
  nameShots.lastVs = ms;
  if (nameShots.count >= NAME_SHOTS || ms - nameShots.lastShot < NAME_GAP_MS) return;
  nameShots.count++;
  nameShots.lastShot = ms;
  const r = inside(vsArea, VS_OPP_NAME);
  const w = Math.round(r.w * VS_NAME_SCALE);
  const h = Math.round(r.h * VS_NAME_SCALE);
  if (w < 20 || h < 8) return;
  nameCanvas.width = w;
  nameCanvas.height = h;
  const g = nameCanvas.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  // il nome è in corsivo: lo si raddrizza inclinando il ritaglio al contrario intorno alla riga di mezzo
  g.setTransform(1, 0, VS_NAME_SHEAR, 1, (-VS_NAME_SHEAR * h) / 2, 0);
  g.drawImage(full, r.x, r.y, r.w, r.h, 0, 0, w, h);
  g.setTransform(1, 0, 0, 1, 0, 0);
  nameCanvas.toBlob((blob) => {
    if (blob) void blob.arrayBuffer().then((buf) => api.name(new Uint8Array(buf)));
  }, "image/png");
}

/**
 * La lega sopra il mio ritratto nella schermata VS (22/10/2026, coda della partita: src/lib/tracker/queue.ts): fino a
 * `LEAGUE_SHOTS` ritagli per schermata, ad almeno `LEAGUE_GAP_MS`, perché la scritta entra con un'animazione e nel primo
 * fotogramma della schermata a volte non c'è ancora. Il ritaglio è alto `LEAGUE_TEXT_H` pixel e nero su bianco: così
 * l'OCR di Windows la legge (vedi `VS_MY_LEAGUE`). Il processo principale smette di leggere al primo "sì".
 */
const LEAGUE_SHOTS = 4;
const LEAGUE_GAP_MS = 600;
let leagueShots = { lastVs: 0, lastShot: 0, count: 0 };
const leagueCanvas = document.createElement("canvas");

function shootLeague(vsArea: Layout["vs"], ms: number) {
  if (ms - leagueShots.lastVs > SAME_VERSUS_MS) leagueShots = { lastVs: ms, lastShot: 0, count: 0 };
  leagueShots.lastVs = ms;
  if (leagueShots.count >= LEAGUE_SHOTS || ms - leagueShots.lastShot < LEAGUE_GAP_MS) return;
  leagueShots.count++;
  leagueShots.lastShot = ms;
  const r = inside(vsArea, VS_MY_LEAGUE);
  const h = LEAGUE_TEXT_H;
  const w = Math.round((r.w * h) / r.h);
  if (r.w < 20 || r.h < 8) return;
  leagueCanvas.width = w;
  leagueCanvas.height = h;
  const g = leagueCanvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(full, r.x, r.y, r.w, r.h, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h);
  inkOnWhite(px.data);
  g.putImageData(px, 0, 0);
  leagueCanvas.toBlob((blob) => {
    if (blob) void blob.arrayBuffer().then((buf) => api.league(new Uint8Array(buf)));
  }, "image/png");
}

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
    if (vs.me.key && vs.opp.key) {
      shootName(layout.at.vs, ms);
      shootLeague(layout.at.vs, ms);
    }
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
