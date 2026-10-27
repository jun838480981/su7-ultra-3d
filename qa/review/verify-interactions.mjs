/* Focused re-tests: orbit/zoom on settled camera, guide scroll-lock bug,
   tighter projected-silhouette check (per-mesh, not whole-model bbox). */
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('F:/LearnSpace/前端与Web/dsh大肥鱼/qq-bot/node_modules/playwright-core');
const PROJECT = 'F:/LearnSpace/前端与Web/su7-ultra-3d';
const url = pathToFileURL(path.join(PROJECT, 'index.html')).href;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = {};
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.SU7_APP && window.SU7_APP.state.ready === true, null, { timeout: 45000 });
await sleep(4200); // intro fly 2.2s + settle

// settled wheel zoom
const dist0 = await page.evaluate(() => window.SU7_APP.getCamera().position.distanceTo(window.SU7_APP.getControls().target));
await page.mouse.move(800, 560);
await page.mouse.wheel(0, -500);
await sleep(900);
const dist1 = await page.evaluate(() => window.SU7_APP.getCamera().position.distanceTo(window.SU7_APP.getControls().target));
// settled drag orbit
const az0 = await page.evaluate(() => window.SU7_APP.getControls().getAzimuthalAngle());
await page.mouse.move(800, 560);
await page.mouse.down();
await page.mouse.move(980, 610, { steps: 15 });
await page.mouse.up();
await sleep(900);
const az1 = await page.evaluate(() => window.SU7_APP.getControls().getAzimuthalAngle());
out.orbitZoom = { dist0: +dist0.toFixed(2), dist1: +dist1.toFixed(2), az0: +az0.toFixed(3), az1: +az1.toFixed(3) };

// guide scroll-lock: body.style.overflow state transitions
const lock = async () => page.evaluate(() => document.body.style.overflow);
const ov0 = await lock();
await page.click('#btnGuide'); await sleep(300);
const ov1 = await lock();
await page.keyboard.press('Escape'); await sleep(300);
const ov2 = await lock();
out.guideScrollLock = { before: ov0, open: ov1, afterClose: ov2 };

// tighter projected silhouette: per-mesh world bbox corners (assembled default view)
const silhouette = await page.evaluate(() => {
  const app = window.SU7_APP, THREE = window.THREE_BUNDLE.THREE;
  const cam = app.getCamera(), w = innerWidth, h = innerHeight;
  const v = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const box = new THREE.Box3();
  app.getModel().root.traverse(o => {
    if (!o.isMesh) return;
    box.setFromObject(o);
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      v.set(x, y, z).project(cam);
      const px = (v.x * 0.5 + 0.5) * w, py = (-v.y * 0.5 + 0.5) * h;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
  });
  const pr = document.getElementById('panelInfo').getBoundingClientRect();
  const pl = document.getElementById('panelParts').getBoundingClientRect();
  const top = document.querySelector('.topbar').getBoundingClientRect();
  const dock = document.getElementById('dock').getBoundingClientRect();
  return { car: { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) },
    free: { x0: Math.round(pl.right), x1: Math.round(pr.left), y0: Math.round(top.bottom), y1: Math.round(dock.top) },
    fits: x0 >= pl.right - 2 && x1 <= pr.left + 2 && y0 >= top.bottom - 2 && y1 <= dock.top + 2 };
});
out.silhouetteAssembled = silhouette;

// exploded silhouette
await page.click('#btnExplode'); await sleep(2400);
const silhouetteEx = await page.evaluate(() => {
  const app = window.SU7_APP, THREE = window.THREE_BUNDLE.THREE;
  const cam = app.getCamera(), w = innerWidth, h = innerHeight;
  const v = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const box = new THREE.Box3();
  app.getModel().root.traverse(o => {
    if (!o.isMesh) return;
    box.setFromObject(o);
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      v.set(x, y, z).project(cam);
      const px = (v.x * 0.5 + 0.5) * w, py = (-v.y * 0.5 + 0.5) * h;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
  });
  const pr = document.getElementById('panelInfo').getBoundingClientRect();
  const pl = document.getElementById('panelParts').getBoundingClientRect();
  const top = document.querySelector('.topbar').getBoundingClientRect();
  const dock = document.getElementById('dock').getBoundingClientRect();
  return { car: { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) },
    free: { x0: Math.round(pl.right), x1: Math.round(pr.left), y0: Math.round(top.bottom), y1: Math.round(dock.top) },
    fits: x0 >= pl.right - 2 && x1 <= pr.left + 2 && y0 >= top.bottom - 2 && y1 <= dock.top + 2 };
});
out.silhouetteExploded = silhouetteEx;
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await browser.close();
