// wave-bg.js
// ─── ambient animated background · ported from a 21st.dev React/canvas component ───
//
// The original component (dynamic-wave-canvas-background.tsx) was built for a
// shadcn + Tailwind + TypeScript/React project. This site is plain static
// HTML/CSS/JS hosted from S3 — there's no React tree, no JSX, no build step —
// so pulling in React/Tailwind/shadcn just to run one <canvas> would mean
// standing up an entire framework for a single visual effect. The component
// itself doesn't actually use any React state or context beyond a ref and a
// one-time useEffect, so it ports to plain JS with no loss of behavior.
//
// Changes from the original demo:
//  - No React — just a <canvas id="wave-bg"> grabbed by id.
//  - Palette retuned from purple/blue to the dashboard's navy/teal theme
//    (var(--bg) #071624 / var(--accent) #22e3d4) so it reads as part of the
//    existing design instead of a generic hero background.
//  - Dimmed intensity so panels/cards laid on top stay readable.
//  - Frame rate capped (~30fps) and paused when the tab isn't visible —
//    this is a monitoring dashboard people may leave open for hours, so an
//    uncapped full-viewport per-pixel animation isn't a reasonable default.
//  - Respects prefers-reduced-motion by rendering a single static frame.

(function () {
  const canvas = document.getElementById('wave-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // higher SCALE = fewer pixels computed per frame = cheaper on CPU/battery.
  // the upscale blur softens the blockiness so it still looks smooth.
  const SCALE = 4;
  const TARGET_FPS = 30;
  const FRAME_MS = 1000 / TARGET_FPS;

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, imageData, data;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = Math.max(1, Math.floor(canvas.width / SCALE));
    height = Math.max(1, Math.floor(canvas.height / SCALE));
    imageData = ctx.createImageData(width, height);
    data = imageData.data;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const startTime = Date.now();

  // lookup tables instead of calling Math.sin/cos per-pixel — this loop runs
  // width*height*4 times a frame, so table lookups matter for perf.
  const TABLE_SIZE = 1024;
  const SIN_TABLE = new Float32Array(TABLE_SIZE);
  const COS_TABLE = new Float32Array(TABLE_SIZE);
  for (let i = 0; i < TABLE_SIZE; i++) {
    const angle = (i / TABLE_SIZE) * Math.PI * 2;
    SIN_TABLE[i] = Math.sin(angle);
    COS_TABLE[i] = Math.cos(angle);
  }
  function fastSin(x) {
    const index = Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * TABLE_SIZE) & (TABLE_SIZE - 1);
    return SIN_TABLE[index];
  }
  function fastCos(x) {
    const index = Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * TABLE_SIZE) & (TABLE_SIZE - 1);
    return COS_TABLE[index];
  }

  // ─── palette — matches design tokens in the page CSS ───
  // base: var(--bg) #071624   accent: var(--accent) #22e3d4
  const BASE_R = 7 / 255, BASE_G = 22 / 255, BASE_B = 36 / 255;
  const ACC_R = 34 / 255, ACC_G = 227 / 255, ACC_B = 212 / 255;

  function paintFrame(time) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u_x = (2 * x - width) / height;
        const u_y = (2 * y - height) / height;

        let a = 0, d = 0;
        for (let i = 0; i < 4; i++) {
          a += fastCos(i - d + time * 0.35 - a * u_x);
          d += fastSin(i * u_y + a);
        }

        const wave = (fastSin(a) + fastCos(d)) * 0.5;
        // dimmer than the original demo so text/cards on top stay legible
        const mix = Math.max(0, Math.min(1, 0.22 + 0.20 * wave));

        const r = BASE_R + (ACC_R - BASE_R) * mix * 0.55;
        const g = BASE_G + (ACC_G - BASE_G) * mix * 0.55;
        const b = BASE_B + (ACC_B - BASE_B) * mix * 0.55;

        const index = (y * width + x) * 4;
        data[index] = r * 255;
        data[index + 1] = g * 255;
        data[index + 2] = b * 255;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true; // soft upscale, not the blocky pixel look
    ctx.drawImage(canvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
  }

  if (reduceMotion) {
    paintFrame(0);
    return; // no animation loop — respect the user's OS-level setting
  }

  let running = !document.hidden;
  let lastFrameTime = 0;

  function render(now) {
    if (!running) return;
    if (now - lastFrameTime >= FRAME_MS) {
      lastFrameTime = now;
      paintFrame((Date.now() - startTime) * 0.001);
    }
    requestAnimationFrame(render);
  }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(render);
  });

  requestAnimationFrame(render);
})();
