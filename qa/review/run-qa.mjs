/* Independent QA harness — SU7 Ultra 3D teardown page.
   Read-only against product files; writes only under qa/review/. */
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('F:/LearnSpace/前端与Web/dsh大肥鱼/qq-bot/node_modules/playwright-core');
const PROJECT = 'F:/LearnSpace/前端与Web/su7-ultra-3d';
const OUT = path.join(PROJECT, 'qa', 'review');
const LOGS = path.join(OUT, '_logs');
fs.mkdirSync(LOGS, { recursive: true });
const PAGE_URL = pathToFileURL(path.join(PROJECT, 'index.html')).href;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const results = [];
const details = {};
function rec(id, ok, detail) {
  results.push({ id, ok: !!ok, detail: String(detail) });
  console.log((ok ? 'PASS ' : 'FAIL ') + id + ' — ' + detail);
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name) });

function track(page) {
  const logs = { errors: [], warnings: [], failed: [], requests: [] };
  page.on('console', m => {
    if (m.type() === 'error') logs.errors.push(m.text());
    else if (m.type() === 'warning') logs.warnings.push(m.text());
  });
  page.on('pageerror', e => logs.errors.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('requestfailed', r => logs.failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
  page.on('request', r => logs.requests.push(r.url()));
  return logs;
}

async function bootPage(browser, ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const logs = track(page);
  const t0 = Date.now();
  await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => window.SU7_APP && window.SU7_APP.state.ready === true, null, { timeout: 45000 });
  const bootMs = Date.now() - t0;
  return { ctx, page, logs, bootMs };
}

const layoutJs = () => {
  const box = el => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const cs = el => getComputedStyle(el);
  const panels = ['panelParts', 'panelInfo'].map(id => document.getElementById(id));
  return {
    vw: innerWidth, vh: innerHeight,
    scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    left: box(panels[0]), right: box(panels[1]),
    leftOpen: panels[0].classList.contains('is-open'), rightOpen: panels[1].classList.contains('is-open'),
    leftDisplay: cs(panels[0]).display, rightDisplay: cs(panels[1]).display,
    leftTransform: cs(panels[0]).transform, rightTransform: cs(panels[1]).transform,
    dock: box(document.getElementById('dock')),
    topbar: box(document.querySelector('.topbar')),
    statusDisplay: cs(document.getElementById('topStatus')).display,
    mobilePartsDisplay: cs(document.getElementById('btnMobileParts')).display,
    mobileInfoDisplay: cs(document.getElementById('btnMobileInfo')).display,
    labelsDisplay: cs(document.getElementById('btnLabels')).display,
    labelVisible: document.querySelectorAll('.part-label.is-visible').length,
    partItems: document.querySelectorAll('.part-item').length,
    bootGone: document.getElementById('boot').classList.contains('is-done'),
    bootDisplay: cs(document.getElementById('boot')).display,
    fallbackHidden: document.getElementById('fallback').hidden,
    active: document.activeElement ? document.activeElement.tagName : null
  };
};

const viewJs = () => {
  const app = window.SU7_APP, THREE = window.THREE_BUNDLE.THREE;
  const model = app.getModel(), cam = app.getCamera(), w = innerWidth, h = innerHeight;
  const bbox = new THREE.Box3().setFromObject(model.root);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const v = new THREE.Vector3();
  for (const x of [bbox.min.x, bbox.max.x]) for (const y of [bbox.min.y, bbox.max.y]) for (const z of [bbox.min.z, bbox.max.z]) {
    v.set(x, y, z).project(cam);
    const px = (v.x * 0.5 + 0.5) * w, py = (-v.y * 0.5 + 0.5) * h;
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  const panelL = document.getElementById('panelParts').getBoundingClientRect();
  const panelR = document.getElementById('panelInfo').getBoundingClientRect();
  const top = document.querySelector('.topbar').getBoundingClientRect();
  const dock = document.getElementById('dock').getBoundingClientRect();
  const mobile = innerWidth <= 960;
  const free = mobile ? { x0: 8, x1: w - 8, y0: top.bottom, y1: dock.top } : { x0: panelL.right, x1: panelR.left, y0: top.bottom, y1: dock.top };
  return {
    car: { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) },
    free,
    fitsFree: x0 >= free.x0 - 2 && x1 <= free.x1 + 2 && y0 >= free.y0 - 2 && y1 <= free.y1 + 2,
    cam: cam.position.toArray().map(n => +n.toFixed(2)),
    target: app.getControls().target.toArray().map(n => +n.toFixed(2)),
    distance: +cam.position.distanceTo(app.getControls().target).toFixed(2),
    bbox: { min: bbox.min.toArray().map(n => +n.toFixed(2)), max: bbox.max.toArray().map(n => +n.toFixed(2)) }
  };
};

const labelOverlapJs = () => {
  const els = [...document.querySelectorAll('.part-label.is-visible')];
  const rects = els.map(e => ({ id: e.dataset.id, r: e.getBoundingClientRect() }));
  let overlaps = 0; const pairs = [];
  const panels = ['panelParts', 'panelInfo'].map(id => ({ id, r: document.getElementById(id).getBoundingClientRect() }))
    .filter(p => getComputedStyle(document.getElementById(p.id)).display !== 'none' && p.r.right > 0 && p.r.left < innerWidth);
  let underPanels = 0;
  for (const p of rects) {
    for (const pan of panels) {
      const x = Math.max(0, Math.min(p.r.right, pan.r.right) - Math.max(p.r.left, pan.r.left));
      const y = Math.max(0, Math.min(p.r.bottom, pan.r.bottom) - Math.max(p.r.top, pan.r.top));
      if (x > 4 && y > 4) { underPanels++; pairs.push(p.id + '@' + pan.id); }
    }
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i].r, b = rects[j].r;
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    if (x > 6 && y > 4) { overlaps++; pairs.push(rects[i].id + '<>' + rects[j].id); }
  }
  return { visible: els.length, overlaps, underPanels, pairs: pairs.slice(0, 20) };
};

const DOM_SCAN = /\b(undefined|NaN|null|Lorem|placeholder|TODO|xxx)\b/;
const OFFICIAL = [
  ['5115', '车身长'], ['1970', '车宽'], ['1465', '车高'], ['3000', '轴距'], ['2360', '整备质量'],
  ['1548', '综合功率 PS'], ['1.98', '0-100'], ['350', '极速'], ['93.7', '电池'], ['285', '下压力'],
  ['21 英寸', '21 英寸轮毂'], ['碳陶', '碳陶制动'], ['前六后四', '前六后四卡钳'],
  ['0.2 Cd', '风阻媒体口径标注'], ['52.99', '售价'], ['16.1 英寸', '中控屏'], ['25 扬声器', '音响']
];

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--ignore-gpu-blocklist']
});

try {
  /* ================= DESKTOP 1600x1000 ================= */
  const d = await bootPage(browser, { viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = d.page, logs = d.logs;
  details.desktopBootMs = d.bootMs;
  await sleep(3400); // boot fade + intro camera fly

  const env = await page.evaluate(() => {
    const app = window.SU7_APP, r = app.getRenderer(), gl = r.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const model = app.getModel();
    return {
      ready: app.state.ready,
      threeRevision: window.THREE_BUNDLE.THREE.REVISION,
      vendorLoaded: !!window.THREE_BUNDLE,
      drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      dpr: window.devicePixelRatio,
      webgl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext,
      glVersion: gl.getParameter(gl.VERSION),
      glRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '(unmasked info unavailable)',
      parts: model.parts.length,
      pickables: model.pickables.length,
      rootMeshes: (() => { let n = 0; model.root.traverse(o => { if (o.isMesh) n++; }); return n; })(),
      statusCode: document.getElementById('statusCode').textContent,
      statusMeta: document.getElementById('statusMeta').textContent,
      bootStatus: document.getElementById('bootStatus').textContent,
      overviewHasBad: /\b(undefined|NaN)\b/.test(document.body.innerText)
    };
  });
  details.env = env;
  await shot(page, '01-desktop-1600-assembled.png');

  const layout1600 = await page.evaluate(layoutJs);
  const view1600 = await page.evaluate(viewJs);
  details.layout1600 = layout1600;
  details.view1600 = view1600;

  rec('desktop-load-1600x1000', env.ready && env.vendorLoaded && layout1600.bootGone && layout1600.fallbackHidden,
    `ready in ${d.bootMs}ms; boot overlay gone=${layout1600.bootGone}; status="${env.statusCode}"`);
  rec('desktop-webgl', env.webgl2 && !/swiftshader/i.test(env.glRenderer),
    `${env.glVersion}; renderer=${env.glRenderer}; three r${env.threeRevision}; drawbuffer=${env.drawingBuffer.join('x')} dpr=${env.dpr}`);
  rec('desktop-model-count', env.parts === 18 && env.pickables > 0 && env.rootMeshes > 50,
    `parts=${env.parts}, pickables=${env.pickables}, meshes=${env.rootMeshes}`);
  rec('desktop-layout-1600', !layout1600.overflowX && view1600.fitsFree,
    `overflowX=${layout1600.overflowX}; car px=[${view1600.car.x0},${view1600.car.x1}]x[${view1600.car.y0},${view1600.car.y1}]; free=[${view1600.free.x0},${view1600.free.x1}]x[${view1600.free.y0},${view1600.free.y1}]; fits=${view1600.fitsFree}`);
  rec('desktop-assembled-view', layout1600.labelVisible === 0,
    `assembled: label visible=${layout1600.labelVisible} (labels only in exploded); distance=${view1600.distance}`);

  /* ---- real user: click explode button ---- */
  const preExplodeErr = logs.errors.length;
  await page.click('#btnExplode');
  await sleep(2100);
  const exploded = await page.evaluate(() => ({
    exploded: window.SU7_APP.state.exploded,
    pct: document.getElementById('explodePct').textContent,
    meterW: document.getElementById('explodeMeter').style.width,
    btnLabel: document.getElementById('explodeLabel').textContent,
    btnPressed: document.getElementById('btnExplode').getAttribute('aria-pressed'),
    labelVisible: document.querySelectorAll('.part-label.is-visible').length,
    statusMeta: document.getElementById('statusMeta').textContent,
    toast: document.getElementById('toast').textContent
  }));
  details.exploded = exploded;
  await shot(page, '02-desktop-1600-exploded.png');
  const viewExploded = await page.evaluate(viewJs);
  const labelsExploded = await page.evaluate(labelOverlapJs);
  details.viewExploded = viewExploded;
  details.labelsExploded = labelsExploded;
  rec('desktop-explode-button', exploded.exploded && exploded.pct === '100%' && exploded.btnLabel === '一键组装' && exploded.btnPressed === 'true' && logs.errors.length === preExplodeErr,
    `exploded=${exploded.exploded}, pct=${exploded.pct}, button="${exploded.btnLabel}", aria-pressed=${exploded.btnPressed}, toast="${exploded.toast}"`);
  rec('desktop-labels-on-explode', exploded.labelVisible > 10,
    `visible labels=${exploded.labelVisible}/18; overlap pairs=${labelsExploded.overlaps}; underPanels=${labelsExploded.underPanels}; viewExplodedFits=${viewExploded.fitsFree}`);
  rec('desktop-exploded-view-fits', viewExploded.fitsFree,
    `car px=[${viewExploded.car.x0},${viewExploded.car.x1}]x[${viewExploded.car.y0},${viewExploded.car.y1}] free=[${viewExploded.free.x0},${viewExploded.free.x1}]x[${viewExploded.free.y0},${viewExploded.free.y1}]`);

  /* ---- 18 parts via the left list, one by one ---- */
  const meta = await page.evaluate(() => {
    const m = window.SU7_APP.getModel();
    return m.parts.map(p => ({ id: p.id, index: p.index, name: p.meta.name, en: p.meta.en, cat: p.meta.cat, labelSpec: p.meta.labelSpec, specs: p.meta.specs, tags: p.meta.tags, desc: p.meta.desc, note: p.meta.note }));
  });
  fs.writeFileSync(path.join(LOGS, 'part-meta.json'), JSON.stringify(meta, null, 2));

  const keyShots = {
    body: '04-part-body.png', frontFascia: '05-part-frontFascia.png', wheels: '06-part-wheels.png',
    brakes: '07-part-brakes.png', battery: '08-part-battery.png', motors: '09-part-motors.png',
    interior: '10-part-interior.png', rearWing: '11-part-rearWing.png'
  };
  const perPart = [];
  let prevCam = await page.evaluate(() => window.SU7_APP.getCamera().position.toArray());
  for (const p of meta) {
    const err0 = logs.errors.length;
    const loc = page.locator(`.part-item[data-id="${p.id}"]`);
    await loc.scrollIntoViewIfNeeded();
    await loc.click();
    await sleep(keyShots[p.id] ? 1500 : 700);
    const st = await page.evaluate(id => {
      const app = window.SU7_APP, part = app.getModel().byId[id];
      const body = document.getElementById('infoBody');
      const rows = [...body.querySelectorAll('.spec-row')].map(r => [r.querySelector('.sk')?.textContent || '', r.querySelector('.sv')?.textContent || '']);
      const active = document.querySelector('.part-item.is-active');
      const visibleLabels = document.querySelectorAll('.part-label.is-visible').length;
      return {
        selected: app.state.selected,
        title: body.querySelector('.detail h2')?.textContent || null,
        indexText: body.querySelector('.detail-index')?.textContent || null,
        cat: body.querySelector('.detail-kicker')?.textContent || null,
        en: body.querySelector('.detail-en')?.textContent || null,
        rowCount: rows.length, rows,
        activeId: active ? active.dataset.id : null,
        glow: part ? +part.glow.toFixed(2) : null,
        cam: app.getCamera().position.toArray(),
        labelVisible: visibleLabels,
        hasBad: /\b(undefined|NaN|null)\b/.test(body.innerText),
        panelText: body.innerText
      };
    }, p.id);
    const moved = Math.hypot(st.cam[0] - prevCam[0], st.cam[1] - prevCam[1], st.cam[2] - prevCam[2]);
    prevCam = st.cam;
    if (keyShots[p.id]) await shot(page, keyShots[p.id]);
    const ok = st.selected === p.id && st.title === p.name && st.indexText === String(p.index) &&
      st.activeId === p.id && st.rowCount === p.specs.length && st.glow > 0.35 && moved > 0.05 &&
      !st.hasBad && logs.errors.length === err0;
    const row = {
      id: p.id, index: p.index, ok,
      detail: `title="${st.title}", index=${st.indexText}, rows=${st.rowCount}/${p.specs.length}, active=${st.activeId}, glow=${st.glow}, camMove=${moved.toFixed(2)}, errors+${logs.errors.length - err0}, badText=${st.hasBad}`,
      panelText: st.panelText
    };
    perPart.push(row);
    rec('part-' + String(p.index).padStart(2, '0') + '-' + p.id, ok, row.detail);
  }
  details.parts = perPart;
  rec('desktop-all-18-parts', perPart.every(p => p.ok), `${perPart.filter(p => p.ok).length}/${perPart.length} parts fully OK`);

  /* ---- specs tab ---- */
  await page.click('.info-tab[data-tab="specs"]');
  await sleep(500);
  const specsText = await page.evaluate(() => document.getElementById('infoBody').innerText);
  const tabState = await page.evaluate(() => ({
    active: document.querySelector('.info-tab.is-active')?.dataset.tab,
    aria: [...document.querySelectorAll('.info-tab')].map(b => b.dataset.tab + ':' + b.getAttribute('aria-selected')),
    sections: document.querySelectorAll('.spec-section').length
  }));
  await shot(page, '12-specs-tab.png');
  const missingOfficial = OFFICIAL.filter(([needle]) => !specsText.includes(needle)).map(x => x[1]);
  details.specsText = specsText;
  details.officialMissing = missingOfficial;
  rec('desktop-specs-tab', tabState.active === 'specs' && tabState.sections === 6 && missingOfficial.length === 0,
    `active=${tabState.active}, aria=${tabState.aria.join(',')}, sections=${tabState.sections}, missingOfficial=${JSON.stringify(missingOfficial)}`);

  // back to detail tab
  await page.click('.info-tab[data-tab="detail"]');
  await sleep(400);
  const backDetail = await page.evaluate(() => ({
    active: document.querySelector('.info-tab.is-active')?.dataset.tab,
    title: document.querySelector('#infoBody .detail h2')?.textContent || null
  }));
  rec('desktop-tab-switch-back', backDetail.active === 'detail' && backDetail.title === meta[meta.length - 1].name,
    `active=${backDetail.active}, detail title="${backDetail.title}", expected="${meta[meta.length - 1].name}"`);

  // clear selection via panel × button
  await page.click('[data-detail-close]');
  await sleep(400);
  const cleared = await page.evaluate(() => ({ selected: window.SU7_APP.state.selected, overview: !!document.querySelector('#infoBody .overview') }));
  rec('desktop-clear-selection', cleared.selected === null && cleared.overview,
    `selected=${cleared.selected}, overview=${cleared.overview}`);

  /* ---- dock interactions ---- */
  // assemble via button
  await page.click('#btnExplode');
  await sleep(1700);
  const assembled = await page.evaluate(() => ({
    exploded: window.SU7_APP.state.exploded,
    pct: document.getElementById('explodePct').textContent,
    btnLabel: document.getElementById('explodeLabel').textContent,
    labels: document.querySelectorAll('.part-label.is-visible').length
  }));
  rec('desktop-assemble-button', !assembled.exploded && assembled.pct === '00%' && assembled.btnLabel === '一键拆解' && assembled.labels === 0,
    `exploded=${assembled.exploded}, pct=${assembled.pct}, button="${assembled.btnLabel}", labels=${assembled.labels}`);

  // space to explode
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const spaceErr0 = logs.errors.length;
  await page.keyboard.press('Space');
  await sleep(1700);
  const spaceState = await page.evaluate(() => ({ exploded: window.SU7_APP.state.exploded, pct: document.getElementById('explodePct').textContent }));
  rec('desktop-space-toggle', spaceState.exploded && spaceState.pct === '100%' && logs.errors.length === spaceErr0,
    `after Space: exploded=${spaceState.exploded}, pct=${spaceState.pct}`);

  // labels toggle L
  const labelsBefore = await page.evaluate(() => ({ on: window.SU7_APP.state.labelsOn, visible: document.querySelectorAll('.part-label.is-visible').length, pressed: document.getElementById('btnLabels').getAttribute('aria-pressed') }));
  await page.keyboard.press('l');
  await sleep(500);
  const labelsOff = await page.evaluate(() => ({ on: window.SU7_APP.state.labelsOn, visible: document.querySelectorAll('.part-label.is-visible').length, pressed: document.getElementById('btnLabels').getAttribute('aria-pressed') }));
  await page.click('#btnLabels');
  await sleep(500);
  const labelsOn = await page.evaluate(() => ({ on: window.SU7_APP.state.labelsOn, visible: document.querySelectorAll('.part-label.is-visible').length, pressed: document.getElementById('btnLabels').getAttribute('aria-pressed') }));
  rec('desktop-labels-toggle', labelsBefore.on && !labelsOff.on && labelsOff.visible === 0 && labelsOn.on && labelsOn.visible > 10,
    `before(on=${labelsBefore.on},visible=${labelsBefore.visible}) → L(on=${labelsOff.on},visible=${labelsOff.visible}) → click(on=${labelsOn.on},visible=${labelsOn.visible},pressed=${labelsOn.pressed})`);

  // auto rotate
  await page.click('#btnAutoRotate');
  const arOn = await page.evaluate(() => ({ state: window.SU7_APP.state.autoRotate, ctrl: window.SU7_APP.getControls().autoRotate, pressed: document.getElementById('btnAutoRotate').getAttribute('aria-pressed') }));
  const az0 = await page.evaluate(() => window.SU7_APP.getControls().getAzimuthalAngle());
  await sleep(800);
  const az1 = await page.evaluate(() => window.SU7_APP.getControls().getAzimuthalAngle());
  await page.click('#btnAutoRotate');
  const arOff = await page.evaluate(() => ({ state: window.SU7_APP.state.autoRotate, ctrl: window.SU7_APP.getControls().autoRotate, pressed: document.getElementById('btnAutoRotate').getAttribute('aria-pressed') }));
  rec('desktop-autorotate', arOn.state && arOn.ctrl && arOn.pressed === 'true' && Math.abs(az1 - az0) > 0.02 && !arOff.state && !arOff.ctrl,
    `on(state=${arOn.state},ctrl=${arOn.ctrl},pressed=${arOn.pressed}) azimuth Δ=${(az1 - az0).toFixed(3)}; off(state=${arOff.state})`);

  // auto focus toggle
  const af0 = await page.evaluate(() => ({ v: window.SU7_APP.state.autoFocus, pressed: document.getElementById('btnFocusCam').getAttribute('aria-pressed') }));
  await page.click('#btnFocusCam');
  const af1 = await page.evaluate(() => ({ v: window.SU7_APP.state.autoFocus, pressed: document.getElementById('btnFocusCam').getAttribute('aria-pressed') }));
  await page.click('#btnFocusCam');
  const af2 = await page.evaluate(() => window.SU7_APP.state.autoFocus);
  rec('desktop-autofocus-toggle', af0.v === true && af1.v === false && af2 === true, `initial=${af0.v} → off=${af1.v} → on=${af2}`);

  // reset view R / button
  const resetErr0 = logs.errors.length;
  await page.keyboard.press('r');
  await sleep(1500);
  await page.click('#btnReset');
  await sleep(1600);
  const resetState = await page.evaluate(() => ({
    dist: +window.SU7_APP.getCamera().position.distanceTo(window.SU7_APP.getControls().target).toFixed(1),
    cam: window.SU7_APP.getCamera().position.toArray().map(n => +n.toFixed(1)),
    toast: document.getElementById('toast').textContent,
    exploded: window.SU7_APP.state.exploded
  }));
  rec('desktop-reset-view', resetState.toast === '视角已复位' && resetState.dist > 10 && resetState.dist < 26 && logs.errors.length === resetErr0,
    `toast="${resetState.toast}", distance=${resetState.dist}, cam=${JSON.stringify(resetState.cam)}, exploded=${resetState.exploded}`);

  /* ---- guide modal ---- */
  const gErr0 = logs.errors.length;
  await page.click('#btnGuide');
  await sleep(400);
  const guideOpen = await page.evaluate(() => ({
    hidden: document.getElementById('guideModal').hidden,
    visible: getComputedStyle(document.getElementById('guideModal')).display !== 'none',
    cards: document.querySelectorAll('.guide-item').length,
    bodyOverflow: document.body.style.overflow,
    text: document.getElementById('guideModal').innerText
  }));
  await shot(page, '13-guide-modal.png');
  await page.keyboard.press('Escape');
  await sleep(350);
  const guideClosed = await page.evaluate(() => document.getElementById('guideModal').hidden);
  // open with '?' and close backdrop
  await page.keyboard.press('?');
  await sleep(350);
  const guideOpen2 = await page.evaluate(() => document.getElementById('guideModal').hidden);
  await page.click('.modal-backdrop', { position: { x: 10, y: 10 } });
  await sleep(300);
  const guideClosed2 = await page.evaluate(() => document.getElementById('guideModal').hidden);
  rec('desktop-guide-modal', !guideOpen.hidden && guideOpen.cards === 6 && guideOpen.text.includes('操作指南') && guideClosed && !guideOpen2 && guideClosed2 && logs.errors.length === gErr0,
    `open(display=${guideOpen.visible}, cards=${guideOpen.cards}, bodyOverflow=${guideOpen.bodyOverflow}); ESC closed=${guideClosed}; "?" opened=${!guideOpen2}; backdrop closed=${guideClosed2}`);
  const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
  rec('desktop-guide-scroll-unlock', bodyOverflowAfter === '', `after closing guide: body.style.overflow="${bodyOverflowAfter}" (expected empty)`);

  /* ---- hover tooltip + real raycast click ---- */
  // label chips also receive pointer events, so switch labels off for a clean canvas pick
  const labelsWereOn = await page.evaluate(() => window.SU7_APP.state.labelsOn);
  if (labelsWereOn) { await page.click('#btnLabels'); await sleep(400); }
  const pick = await page.evaluate(() => {
    const app = window.SU7_APP, THREE = window.THREE_BUNDLE.THREE;
    const ids = ['battery', 'motors', 'chassis', 'wheels', 'interior'];
    for (const id of ids) {
      const part = app.getModel().byId[id];
      const box = new THREE.Box3().setFromObject(part.content);
      const c = box.getCenter(new THREE.Vector3());
      c.project(app.getCamera());
      const x = (c.x * 0.5 + 0.5) * innerWidth, y = (-c.y * 0.5 + 0.5) * innerHeight;
      if (x > 340 && x < 1210 && y > 100 && y < 880) {
        const el = document.elementFromPoint(x, y);
        if (el && el.id === 'scene') return { x: +x.toFixed(1), y: +y.toFixed(1), id };
      }
    }
    return null;
  });
  let hover = { skipped: true }, clickSel = { skipped: true };
  if (pick) {
    await page.mouse.move(pick.x, pick.y, { steps: 10 });
    await sleep(600);
    hover = await page.evaluate(() => ({
      visible: document.getElementById('hoverTag').classList.contains('is-visible'),
      name: document.getElementById('hoverName').textContent,
      index: document.getElementById('hoverIndex').textContent,
      cursor: document.getElementById('scene').style.cursor
    }));
    await page.mouse.click(pick.x, pick.y);
    await sleep(1000);
    clickSel = await page.evaluate(() => ({
      selected: window.SU7_APP.state.selected,
      title: document.querySelector('#infoBody .detail h2')?.textContent || null
    }));
  }
  rec('desktop-hover-tooltip', !!pick && hover.visible && !!hover.name && hover.name !== 'undefined',
    pick ? `probe part=${pick.id} @ (${pick.x},${pick.y}); hover visible=${hover.visible}, name="${hover.name}", index=${hover.index}, cursor=${hover.cursor}` : 'no unobstructed canvas point found');
  rec('desktop-raycast-click', !!pick && clickSel.selected !== null && clickSel.title !== null && (!hover.name || clickSel.title === hover.name),
    pick ? `click (${pick.x},${pick.y}) → selected=${clickSel.selected}, panel title="${clickSel.title}", hover matched="${hover.name}"` : 'skipped: no canvas point');
  if (labelsWereOn) { await page.click('#btnLabels'); await sleep(300); }

  // ESC deselect
  await page.keyboard.press('Escape');
  await sleep(500);
  const escState = await page.evaluate(() => ({ selected: window.SU7_APP.state.selected, exploded: window.SU7_APP.state.exploded }));
  rec('desktop-escape-deselect', escState.selected === null, `after ESC: selected=${escState.selected}, exploded=${escState.exploded}`);

  // click empty canvas deselects
  const emptyPoint = await page.evaluate(() => {
    const top = document.querySelector('.topbar').getBoundingClientRect().bottom;
    for (const y of [top + 40, top + 80, innerHeight * 0.5]) {
      for (const x of [innerWidth * 0.5, innerWidth * 0.62]) {
        if (document.elementFromPoint(x, y)?.id === 'scene') return { x, y };
      }
    }
    return null;
  });
  let emptyRes = { skipped: true };
  if (emptyPoint) {
    await page.evaluate(() => window.SU7_APP.selectPart('body'));
    await sleep(300);
    await page.mouse.click(emptyPoint.x, emptyPoint.y);
    await sleep(500);
    emptyRes = await page.evaluate(() => ({ selected: window.SU7_APP.state.selected }));
  }
  rec('desktop-click-empty-deselect', emptyRes.skipped || emptyRes.selected === null,
    emptyRes.skipped ? 'no empty canvas point found' : `click empty (${Math.round(emptyPoint.x)},${Math.round(emptyPoint.y)}) → selected=${emptyRes.selected}`);

  // wheel zoom + drag orbit (1600x1000 viewport; 800,550 is open canvas)
  const beforeWheel = await page.evaluate(() => window.SU7_APP.getCamera().position.distanceTo(window.SU7_APP.getControls().target));
  await page.mouse.move(800, 550);
  await page.mouse.wheel(0, -600);
  await sleep(700);
  const afterWheel = await page.evaluate(() => window.SU7_APP.getCamera().position.distanceTo(window.SU7_APP.getControls().target));
  const azBefore = await page.evaluate(() => window.SU7_APP.getControls().getAzimuthalAngle());
  await page.mouse.move(800, 550);
  await page.mouse.down();
  await page.mouse.move(960, 590, { steps: 12 });
  await page.mouse.up();
  await sleep(700);
  const azAfter = await page.evaluate(() => window.SU7_APP.getControls().getAzimuthalAngle());
  rec('desktop-orbit-zoom', Math.abs(afterWheel - beforeWheel) > 0.2 && Math.abs(azAfter - azBefore) > 0.02,
    `wheel distance ${beforeWheel.toFixed(2)} → ${afterWheel.toFixed(2)}; drag azimuth Δ=${(azAfter - azBefore).toFixed(3)}`);

  /* ---- text sweep + error gate ---- */
  const sweep = await page.evaluate(() => {
    const txt = document.body.innerText;
    return { bad: /\b(undefined|NaN|null|Lorem|placeholder)\b/.test(txt), hits: (txt.match(/\b(undefined|NaN|null|Lorem|placeholder)\b/g) || []).slice(0, 10) };
  });
  const allPartText = perPart.map(p => p.panelText).join('\n') + '\n' + specsText + '\n' + guideOpen.text;
  const contentHits = (allPartText.match(/\b(undefined|NaN|null)\b/g) || []).slice(0, 10);
  const djiVisible = /DJI|Osmo|Action 4/.test(await page.evaluate(() => document.body.innerText));
  details.contentHits = contentHits;
  details.djiVisible = djiVisible;
  rec('desktop-text-sanity', !sweep.bad && contentHits.length === 0 && !djiVisible,
    `visible body bad tokens=${JSON.stringify(sweep.hits)}; panel/specs/guide bad=${JSON.stringify(contentHits)}; visible DJI/Osmo/Action4=${djiVisible}`);

  const extReqs = logs.requests.filter(u => !u.startsWith('file:'));
  rec('desktop-network', logs.failed.length === 0 && extReqs.length === 0,
    `requests=${logs.requests.length} (all file://=${logs.requests.length - extReqs.length}); external=${JSON.stringify(extReqs.slice(0, 5))}; failed=${JSON.stringify(logs.failed.slice(0, 5))}`);
  rec('desktop-console-clean', logs.errors.length === 0,
    `console errors=${logs.errors.length}${logs.errors.length ? ' :: ' + JSON.stringify(logs.errors.slice(0, 5)) : ''}; warnings=${logs.warnings.length}`);
  details.desktopLogs = { errors: logs.errors.slice(0, 20), warnings: logs.warnings.slice(0, 20), failed: logs.failed, requests: logs.requests };
  await d.ctx.close();

  /* ================= DESKTOP 1366x768 ================= */
  const m = await bootPage(browser, { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const page2 = m.page, logs2 = m.logs;
  await sleep(3000);
  await shot(page2, '03-desktop-1366-assembled.png');
  const layout1366 = await page2.evaluate(layoutJs);
  const view1366 = await page2.evaluate(viewJs);
  details.layout1366 = layout1366;
  details.view1366 = view1366;
  // quick 18-part title pass
  let quickOk = 0; const quickBad = [];
  for (const p of meta) {
    const loc2 = page2.locator(`.part-item[data-id="${p.id}"]`);
    await loc2.scrollIntoViewIfNeeded();
    await loc2.click();
    await sleep(250);
    const t = await page2.evaluate(() => document.querySelector('#infoBody .detail h2')?.textContent || null);
    if (t === p.name) quickOk++; else quickBad.push(p.id + ':' + t);
  }
  rec('desktop-load-1366x768', layout1366.bootGone && layout1366.fallbackHidden && logs2.errors.length === 0,
    `booted in ${m.bootMs}ms; boot gone=${layout1366.bootGone}; console errors=${logs2.errors.length}`);
  rec('desktop-layout-1366', !layout1366.overflowX && view1366.fitsFree,
    `overflowX=${layout1366.overflowX}; car px=[${view1366.car.x0},${view1366.car.x1}]x[${view1366.car.y0},${view1366.car.y1}]; free=[${view1366.free.x0},${view1366.free.x1}]x[${view1366.free.y0},${view1366.free.y1}]; fits=${view1366.fitsFree}; statusHidden=${layout1366.statusDisplay === 'none'}`);
  rec('desktop-1366-part-titles', quickOk === 18 && quickBad.length === 0, `${quickOk}/18 titles match (${quickBad.join(';')})`);
  await m.ctx.close();

  /* ================= MOBILE 390x844 ================= */
  const mob = await bootPage(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page3 = mob.page, logs3 = mob.logs;
  await sleep(3400);
  await shot(page3, '14-mobile-default.png');
  const mobLayout = await page3.evaluate(layoutJs);
  const mobView = await page3.evaluate(viewJs);
  details.mobLayout = mobLayout;
  details.mobView = mobView;
  const mobLabels = await page3.evaluate(labelOverlapJs);
  rec('mobile-load', mobLayout.bootGone && mobLayout.fallbackHidden && logs3.errors.length === 0, `booted in ${mob.bootMs}ms; errors=${logs3.errors.length}`);
  rec('mobile-default-view', !mobLayout.overflowX && mobView.fitsFree && mobLayout.mobilePartsDisplay !== 'none' && mobLayout.mobileInfoDisplay !== 'none' && !mobLayout.leftOpen && !mobLayout.rightOpen,
    `overflowX=${mobLayout.overflowX}; car px=[${mobView.car.x0},${mobView.car.x1}]x[${mobView.car.y0},${mobView.car.y1}]; vw=${mobLayout.vw}x${mobLayout.vh}; fits=${mobView.fitsFree}; drawersOpen=(left=${mobLayout.leftOpen},right=${mobLayout.rightOpen}); mobileBtns=${mobLayout.mobilePartsDisplay}/${mobLayout.mobileInfoDisplay}`);
  rec('mobile-labels-hidden', mobLayout.labelVisible === 0,
    `visible part labels=${mobLayout.labelVisible}; labels button display=${mobLayout.labelsDisplay}; w=390<680 threshold`) ;

  // parts drawer
  await page3.click('#btnMobileParts');
  await sleep(500);
  const drawer = await page3.evaluate(() => ({
    open: document.getElementById('panelParts').classList.contains('is-open'),
    rect: (r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }))(document.getElementById('panelParts').getBoundingClientRect()),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    items: document.querySelectorAll('.part-item').length,
    infoOpen: document.getElementById('panelInfo').classList.contains('is-open')
  }));
  await shot(page3, '15-mobile-parts-drawer.png');
  rec('mobile-parts-drawer', drawer.open && !drawer.infoOpen && drawer.items === 18 && !drawer.overflowX && drawer.rect.x >= 0 && drawer.rect.x + drawer.rect.w <= 390,
    `open=${drawer.open}, items=${drawer.items}, rect=${JSON.stringify(drawer.rect)}, overflowX=${drawer.overflowX}`);

  // select a part from drawer -> detail drawer opens
  const batItem = page3.locator('.part-item[data-id="battery"]');
  await batItem.scrollIntoViewIfNeeded();
  await batItem.click();
  await sleep(1800);
  const detailDrawer = await page3.evaluate(() => ({
    infoOpen: document.getElementById('panelInfo').classList.contains('is-open'),
    partsOpen: document.getElementById('panelParts').classList.contains('is-open'),
    title: document.querySelector('#infoBody .detail h2')?.textContent || null,
    selected: window.SU7_APP.state.selected,
    rect: (r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }))(document.getElementById('panelInfo').getBoundingClientRect()),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    dockOverlap: (() => {
      const a = document.getElementById('panelInfo').getBoundingClientRect(), b = document.getElementById('dock').getBoundingClientRect();
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return Math.round(x * y);
    })()
  }));
  await shot(page3, '16-mobile-detail-drawer.png');
  rec('mobile-detail-drawer', detailDrawer.infoOpen && !detailDrawer.partsOpen && detailDrawer.title === '93.7kWh 电池' && detailDrawer.selected === 'battery' && !detailDrawer.overflowX && detailDrawer.rect.x >= 0 && detailDrawer.rect.x + detailDrawer.rect.w <= 390,
    `infoOpen=${detailDrawer.infoOpen}, partsOpen=${detailDrawer.partsOpen}, title="${detailDrawer.title}", selected=${detailDrawer.selected}, rect=${JSON.stringify(detailDrawer.rect)}, overflowX=${detailDrawer.overflowX}`);
  // close via 收起详情
  await page3.click('#btnCloseInfo');
  await sleep(500);
  const closedDrawer = await page3.evaluate(() => ({
    parts: document.getElementById('panelParts').classList.contains('is-open'),
    info: document.getElementById('panelInfo').classList.contains('is-open'),
    exploded: window.SU7_APP.state.exploded
  }));
  rec('mobile-close-drawer', !closedDrawer.parts && !closedDrawer.info,
    `after 收起详情: partsOpen=${closedDrawer.parts}, infoOpen=${closedDrawer.info}, exploded=${closedDrawer.exploded}`);
  // ESC closes mobile drawer too
  await page3.keyboard.press('Escape');
  await sleep(300);
  const mobErr = logs3.errors.length;
  rec('mobile-console-clean', mobErr === 0 && logs3.failed.length === 0,
    `console errors=${mobErr}${mobErr ? ' :: ' + JSON.stringify(logs3.errors.slice(0, 5)) : ''}; failed=${logs3.failed.length}; external=${logs3.requests.filter(u => !u.startsWith('file:')).length}`);
  details.mobileLogs = { errors: logs3.errors.slice(0, 10), failed: logs3.failed };
  await mob.ctx.close();

  /* ================= FILE / DEPENDENCY CHECK ================= */
  const files = ['index.html', 'css/style.css', 'js/app.js', 'js/lib/model.js', 'js/lib/textures.js', 'js/vendor/three-bundle.min.js', 'THIRD-PARTY-NOTICES.md'];
  const missing = files.filter(f => !fs.existsSync(path.join(PROJECT, f)));
  const html = fs.readFileSync(path.join(PROJECT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(PROJECT, 'css/style.css'), 'utf8');
  const js = ['js/app.js', 'js/lib/model.js', 'js/lib/textures.js'].map(f => fs.readFileSync(path.join(PROJECT, f), 'utf8')).join('\n');
  const extRefs = [...(html + css + js).matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(x => x[0]);
  const cdnHints = /cdn\.|unpkg|jsdelivr|fonts\.googleapis|fonts\.gstatic/.test(html + css + js);
  const vendorOk = fs.statSync(path.join(PROJECT, 'js/vendor/three-bundle.min.js')).size > 500000;
  rec('file-structure', missing.length === 0 && vendorOk, `missing=${JSON.stringify(missing)}; vendor bundle=${(fs.statSync(path.join(PROJECT, 'js/vendor/three-bundle.min.js')).size / 1024).toFixed(0)}KB`);
  rec('no-external-deps', !cdnHints, `http(s) refs found=${extRefs.length}${extRefs.length ? ' :: ' + JSON.stringify([...new Set(extRefs)].slice(0, 6)) : ''}; cdn/font hints=${cdnHints}`);
  // source-level DJI residue (not user-visible)
  const cssHead = css.split('\n').slice(0, 8).join('\n');
  const djiSource = (cssHead.match(/DJI[^\n]*/g) || []);
  const djiClasses = (html.match(/brand-dji/g) || []).length + (css.match(/brand-dji/g) || []).length;
  const djiNs = (js.match(/window\.DJI/g) || []).length;
  details.djiSource = { cssHeader: djiSource, djiClasses, djiNs };
  rec('no-dji-residue-source', djiSource.length === 0 && djiClasses === 0,
    `css header comment=${JSON.stringify(djiSource)}; brand-dji class refs=${djiClasses}; window.DJI namespace refs=${djiNs} (source-only, not user-visible)`);

  /* ================= SUMMARY ================= */
  const failed = results.filter(r => !r.ok);
  const summary = {
    generatedAt: new Date().toISOString(),
    page: PAGE_URL,
    desktopBootMs: d.bootMs,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.map(r => r.id + ': ' + r.detail),
    labelsExploded: labelsExploded,
    env,
    view1600, viewExploded, layout1600, mobLayout, mobView,
    officialMissing: missingOfficial,
    djiSource: details.djiSource,
    perPart: perPart.map(p => ({ id: p.id, ok: p.ok, detail: p.detail })),
    results
  };
  fs.writeFileSync(path.join(LOGS, 'details.json'), JSON.stringify(details, null, 2));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ summary: { total: results.length, passed: results.length - failed.length, failed: failed.length }, checks: results }, null, 2));
  console.log('\n===== SUMMARY =====');
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.map(f => f.id) }, null, 2));
} catch (err) {
  console.error('HARNESS ERROR', err);
  fs.writeFileSync(path.join(LOGS, 'harness-error.txt'), String(err && err.stack || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
