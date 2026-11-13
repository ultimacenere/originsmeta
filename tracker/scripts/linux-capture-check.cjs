// Prova della ripresa della finestra del gioco su Linux (0.6.0, 13/11/2026), solo per GitHub Actions
// (.github/workflows/tracker-linux.yml, su un X11 virtuale con un window manager). Fa quello che fa lo scanner
// (src/main/frames.ts e src/frames/frames.ts): un altro processo apre una finestra finta "Origins TCG" tutta di un
// colore (come il gioco, che è un altro programma), questo la cerca fra le finestre con desktopCapturer per titolo
// esatto, la riprende con getUserMedia come la finestra nascosta dello scanner e controlla il colore al centro del
// fotogramma. Stampa il risultato in JSON ed esce con 0 se la vede e la riprende, altrimenti con 1.
//
//   npx electron --ozone-platform=x11 --no-sandbox scripts/linux-capture-check.cjs
//
// Solo su Linux: su un altro sistema esce subito, senza aprire finestre.
const { spawn } = require("node:child_process");
const { app, BrowserWindow, desktopCapturer, session } = require("electron");

const TITLE = "Origins TCG";
const COLOR = [200, 30, 140];
const FAKE = process.argv.includes("--fake-game");

if (process.platform !== "linux") {
  console.log(JSON.stringify({ ok: true, why: "solo su Linux" }));
  process.exit(0);
}

app.on("window-all-closed", () => {});

if (FAKE) {
  // il "gioco": una finestra tutta di un colore con il titolo esatto, finché la prova non chiude il processo; con una
  // cartella dei dati sua, come un programma diverso
  app.setPath("userData", require("node:path").join(require("node:os").tmpdir(), "om-fake-game"));
  app.whenReady().then(async () => {
    const game = new BrowserWindow({ width: 960, height: 540, title: TITLE, backgroundColor: `rgb(${COLOR.join(",")})` });
    game.on("page-title-updated", (e) => e.preventDefault());
    await game.loadURL(`data:text/html,<body style="margin:0;background:rgb(${COLOR.join(",")})"></body>`);
    game.setTitle(TITLE);
  });
  setTimeout(() => app.exit(0), 60_000);
} else {
  const result = { stage: "avvio", listed: false, titles: [], captured: false, size: null, center: null };
  let child = null;
  const finish = (code, why) => {
    console.log(JSON.stringify({ ok: code === 0, why, ...result }));
    try {
      child?.kill();
    } catch {
      // già chiuso
    }
    app.exit(code);
  };
  setTimeout(() => finish(2, "tempo scaduto"), 45_000);

  app.whenReady().then(async () => {
    try {
      result.stage = "gioco finto";
      const flags = process.argv.filter((a) => a.startsWith("--ozone-platform=") || a === "--no-sandbox");
      child = spawn(process.execPath, [...flags, __filename, "--fake-game"], { stdio: "ignore" });
      // la finestra deve essere sullo schermo, sistemata dal window manager
      let source = null;
      result.stage = "elenco delle finestre";
      for (let i = 0; i < 30 && !source; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const sources = await desktopCapturer.getSources({ types: ["window"], thumbnailSize: { width: 0, height: 0 } });
        result.titles = sources.map((s) => s.name);
        source = sources.find((s) => s.name === TITLE) ?? null;
      }
      result.listed = Boolean(source);
      if (!source) return finish(1, "la finestra del gioco non è fra quelle che Electron vede");
      await new Promise((r) => setTimeout(r, 1000));

      result.stage = "ripresa";
      const ses = session.fromPartition("capture-check");
      ses.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === "media"));
      ses.setPermissionCheckHandler((_wc, perm) => perm === "media");
      const grabber = new BrowserWindow({ show: false, width: 320, height: 180, webPreferences: { partition: "capture-check", backgroundThrottling: false } });
      await grabber.loadURL("data:text/html,<body></body>");
      const shot = await grabber.webContents.executeJavaScript(`(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { mandatory: { chromeMediaSource: "desktop", chromeMediaSourceId: ${JSON.stringify(source.id)}, maxWidth: 3840, maxHeight: 2160, maxFrameRate: 10 } } });
        const video = document.createElement("video");
        video.muted = true;
        video.srcObject = stream;
        await video.play();
        for (let i = 0; i < 50 && !video.videoWidth; i++) await new Promise((r) => setTimeout(r, 100));
        await new Promise((r) => setTimeout(r, 800));
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const g = canvas.getContext("2d", { willReadFrequently: true });
        g.drawImage(video, 0, 0);
        const px = g.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
        stream.getTracks().forEach((t) => t.stop());
        return { w: canvas.width, h: canvas.height, center: [px[0], px[1], px[2]] };
      })()`);
      result.size = [shot.w, shot.h];
      result.center = shot.center;
      result.captured = shot.w > 0 && shot.h > 0 && shot.center.every((v, i) => Math.abs(v - COLOR[i]) <= 12);
      finish(result.captured ? 0 : 1, result.captured ? "finestra vista e ripresa" : "ripresa senza il colore della finestra");
    } catch (e) {
      finish(1, e instanceof Error ? e.message : String(e));
    }
  });
}
