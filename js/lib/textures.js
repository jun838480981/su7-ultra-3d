/* ============================================================
   textures.js — 100% runtime-generated textures for Xiaomi SU7 Ultra
   No external image / model / font assets.
   ============================================================ */
(function () {
  'use strict';
  const { THREE } = window.THREE_BUNDLE;
  window.SU7 = window.SU7 || {};

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function makeTexture(canvas, opts) {
    opts = opts || {};
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    t.needsUpdate = true;
    return t;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ============================================================
     Carbon fibre twill weave
     ============================================================ */
  function carbonFiberTexture() {
    const S = 512;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = '#101215';
    ctx.fillRect(0, 0, S, S);
    const cell = 16;
    for (let y = 0; y < S; y += cell) {
      for (let x = 0; x < S; x += cell) {
        const alt = ((x / cell) + (y / cell)) % 4;
        if (alt === 0 || alt === 3) {
          const g = ctx.createLinearGradient(x, y, x + cell, y + cell);
          g.addColorStop(0, '#2e3338');
          g.addColorStop(0.45, '#16191c');
          g.addColorStop(0.55, '#202428');
          g.addColorStop(1, '#0b0d0f');
          ctx.fillStyle = g;
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = 'rgba(150,160,170,.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 2);
          ctx.lineTo(x + cell - 2, y + cell - 2);
          ctx.stroke();
        } else {
          const g = ctx.createLinearGradient(x + cell, y, x, y + cell);
          g.addColorStop(0, '#292e33');
          g.addColorStop(0.5, '#121417');
          g.addColorStop(1, '#090b0d');
          ctx.fillStyle = g;
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = 'rgba(140,150,160,.07)';
          ctx.beginPath();
          ctx.moveTo(x + cell - 2, y + 2);
          ctx.lineTo(x + 2, y + cell - 2);
          ctx.stroke();
        }
      }
    }
    // sheen
    const sheen = ctx.createLinearGradient(0, 0, S, S);
    sheen.addColorStop(0, 'rgba(255,255,255,.045)');
    sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.55, 'rgba(255,255,255,.025)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, S, S);
    return makeTexture(c, { repeat: [3, 3] });
  }

  /* ============================================================
     Metallic paint roughness / flake map
     ============================================================ */
  function paintFlakeTexture() {
    const S = 256;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = 150 + Math.random() * 90;
      d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + Math.random() * 0.3).toFixed(2) + ')';
      ctx.fillRect(x, y, 1, 1);
    }
    return makeTexture(c, { srgb: false, repeat: [4, 4] });
  }

  /* ============================================================
     Tyre tread bump map
     ============================================================ */
  function tyreTreadTexture() {
    const W = 1024, H = 128;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, W, H);
    // four circumferential grooves
    [0.2, 0.4, 0.6, 0.8].forEach(function (v) {
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, H * v - 3, W, 6);
    });
    // lateral sipes
    for (let x = 0; x < W; x += 22) {
      ctx.fillStyle = 'rgba(20,20,20,.85)';
      ctx.fillRect(x, 8, 3, H * 0.36);
      ctx.fillRect(x + 11, H * 0.56, 3, H * 0.36);
      ctx.fillStyle = 'rgba(200,200,200,.35)';
      ctx.fillRect(x + 4, 8, 1, H * 0.36);
      ctx.fillRect(x + 15, H * 0.56, 1, H * 0.36);
    }
    return makeTexture(c, { srgb: false, repeat: [2, 1] });
  }

  /* ============================================================
     Carbon-ceramic brake disc face
     ============================================================ */
  function brakeDiscTexture() {
    const S = 512;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const cx = S / 2, cy = S / 2;
    ctx.clearRect(0, 0, S, S);
    const g = ctx.createRadialGradient(cx, cy, S * 0.1, cx, cy, S * 0.5);
    g.addColorStop(0, '#3d3f42');
    g.addColorStop(0.35, '#54585c');
    g.addColorStop(0.72, '#3b3d40');
    g.addColorStop(1, '#181a1c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, S * 0.5, 0, Math.PI * 2); ctx.fill();
    // radial machining
    for (let i = 0; i < 130; i++) {
      const a = (i / 130) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(255,255,255,.035)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * S * 0.18, cy + Math.sin(a) * S * 0.18);
      ctx.lineTo(cx + Math.cos(a) * S * 0.49, cy + Math.sin(a) * S * 0.49);
      ctx.stroke();
    }
    // drilled holes
    const rows = [0.27, 0.34, 0.41];
    const counts = [24, 30, 36];
    rows.forEach(function (r, ri) {
      for (let i = 0; i < counts[ri]; i++) {
        const a = (i / counts[ri]) * Math.PI * 2 + ri * 0.12;
        const x = cx + Math.cos(a) * S * r;
        const y = cy + Math.sin(a) * S * r;
        ctx.fillStyle = '#070809';
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(210,220,230,.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    // outer rim / hat
    ctx.strokeStyle = 'rgba(220,228,236,.35)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, S * 0.472, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1b1e21';
    ctx.beginPath(); ctx.arc(cx, cy, S * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,180,120,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, S * 0.17, 0, Math.PI * 2); ctx.stroke();
    return makeTexture(c);
  }

  /* ============================================================
     HyperOS centre display (16.1")
     ============================================================ */
  function drawCarSilhouette(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffd23f');
    g.addColorStop(1, '#b98800');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.03, h * 0.72);
    ctx.lineTo(w * 0.08, h * 0.48);
    ctx.quadraticCurveTo(w * 0.13, h * 0.38, w * 0.26, h * 0.34);
    ctx.quadraticCurveTo(w * 0.4, h * 0.16, w * 0.55, h * 0.16);
    ctx.quadraticCurveTo(w * 0.7, h * 0.18, w * 0.8, h * 0.34);
    ctx.lineTo(w * 0.93, h * 0.44);
    ctx.quadraticCurveTo(w * 0.99, h * 0.48, w * 0.98, h * 0.66);
    ctx.lineTo(w * 0.95, h * 0.76);
    ctx.lineTo(w * 0.03, h * 0.76);
    ctx.closePath();
    ctx.fill();
    // glass
    ctx.fillStyle = 'rgba(10,18,24,.85)';
    ctx.beginPath();
    ctx.moveTo(w * 0.27, h * 0.35);
    ctx.quadraticCurveTo(w * 0.4, h * 0.2, w * 0.54, h * 0.2);
    ctx.quadraticCurveTo(w * 0.68, h * 0.21, w * 0.78, h * 0.35);
    ctx.quadraticCurveTo(w * 0.55, h * 0.3, w * 0.27, h * 0.35);
    ctx.fill();
    // wheels
    ctx.fillStyle = '#0a0b0c';
    [0.23, 0.79].forEach(function (v) {
      ctx.beginPath(); ctx.arc(w * v, h * 0.75, h * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2e32'; ctx.beginPath(); ctx.arc(w * v, h * 0.75, h * 0.075, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0b0c';
    });
    // light streak
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.5); ctx.lineTo(w * 0.25, h * 0.48); ctx.stroke();
    ctx.restore();
  }

  function centerScreenTexture() {
    const W = 1024, H = 600;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070b0f');
    bg.addColorStop(0.6, '#0a0e13');
    bg.addColorStop(1, '#05070a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // ambient glow
    let g = ctx.createRadialGradient(W * 0.54, H * 0.5, 10, W * 0.54, H * 0.5, H * 0.75);
    g.addColorStop(0, 'rgba(255,196,0,.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const mono = '"Cascadia Code", Consolas, monospace';
    const sans = '"Segoe UI", Arial, sans-serif';
    // status bar
    ctx.fillStyle = 'rgba(235,245,255,.9)';
    ctx.font = '600 20px ' + mono;
    ctx.textAlign = 'left';
    ctx.fillText('20:36', 34, 42);
    ctx.font = '400 16px ' + sans;
    ctx.fillStyle = 'rgba(235,245,255,.5)';
    ctx.fillText('周四晚上 · 2/27', 128, 42);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd23f';
    ctx.font = '600 16px ' + mono;
    ctx.fillText('P  R  N  D', W - 34, 42);
    ctx.fillStyle = 'rgba(235,245,255,.45)';
    ctx.font = '400 15px ' + mono;
    ctx.fillText('93%  ·  630 km', W - 34, 68);

    // left info column
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd23f';
    ctx.font = '700 54px ' + mono;
    ctx.fillText('SU7', 34, 150);
    ctx.fillStyle = 'rgba(235,245,255,.9)';
    ctx.font = '300 42px ' + mono;
    ctx.fillText('Ultra', 34, 196);
    ctx.strokeStyle = 'rgba(255,210,63,.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(34, 215); ctx.lineTo(160, 215); ctx.stroke();
    ctx.fillStyle = 'rgba(235,245,255,.4)';
    ctx.font = '400 14px ' + mono;
    ctx.fillText('XIAOMI HYPEROS', 34, 245);

    // main car visual card
    const cx = W * 0.54, cy = H * 0.46, cw = W * 0.4, ch = H * 0.42;
    ctx.fillStyle = 'rgba(255,255,255,.028)';
    roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.stroke();
    drawCarSilhouette(ctx, cx - cw * 0.44, cy - ch * 0.36, cw * 0.88, ch * 0.75);

    // speed gauge left-bottom
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '700 96px ' + mono;
    ctx.textAlign = 'center';
    ctx.fillText('0', 170, 400);
    ctx.fillStyle = 'rgba(235,245,255,.4)';
    ctx.font = '400 16px ' + mono;
    ctx.fillText('km/h', 170, 430);
    ctx.strokeStyle = 'rgba(255,210,63,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(170, 385, 86, Math.PI * 0.72, Math.PI * 1.45); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.beginPath(); ctx.arc(170, 385, 86, Math.PI * 0.72, Math.PI * 2.15); ctx.stroke();

    // bottom nav
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    roundRect(ctx, 28, H - 92, W - 56, 62, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = '400 17px ' + sans;
    const items = ['导航', '音乐', '电话', '车辆', '应用'];
    items.forEach(function (it, i) {
      ctx.fillStyle = i === 0 ? '#ffd23f' : 'rgba(255,255,255,.55)';
      ctx.fillText(it, 64 + i * 150, H - 53);
    });
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '400 15px ' + mono;
    ctx.fillText('23.5°C', W - 64, H - 52);
    return makeTexture(c);
  }

  function clusterTexture() {
    const W = 640, H = 280;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#05080b';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.5);
    g.addColorStop(0, 'rgba(255,210,63,.07)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,210,63,.35)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.58, 94, Math.PI * 0.75, Math.PI * 1.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.beginPath(); ctx.arc(W / 2, H * 0.58, 94, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5fbff';
    ctx.font = '700 92px "Cascadia Code", Consolas, monospace';
    ctx.fillText('0', W / 2, H * 0.58 + 30);
    ctx.fillStyle = 'rgba(235,245,255,.45)';
    ctx.font = '400 16px "Cascadia Code", Consolas, monospace';
    ctx.fillText('km/h', W / 2, H * 0.58 + 58);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '600 22px "Cascadia Code", Consolas, monospace';
    ctx.fillText('P', 58, 52);
    ctx.fillStyle = 'rgba(235,245,255,.65)';
    ctx.font = '400 16px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('93%  ·  630 km', W - 40, 52);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    roundRect(ctx, 46, H - 36, W - 92, 5, 3);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    roundRect(ctx, 46, H - 36, (W - 92) * 0.62, 5, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(235,245,255,.35)';
    ctx.font = '400 12px "Cascadia Code", Consolas, monospace';
    ctx.fillText('READY  ·  SPORT+', 46, H - 52);
    return makeTexture(c);
  }

  /* ============================================================
     Badges / silk print / plate
     ============================================================ */
  function xiaomiWordmarkTexture() {
    const W = 1024, H = 160;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(242,238,226,.9)';
    ctx.font = '600 88px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // letter-spaced XIAOMI
    const text = 'XIAOMI';
    const widths = [];
    let total = 0;
    for (let i = 0; i < text.length; i++) {
      const w = ctx.measureText(text[i]).width;
      widths.push(w); total += w + 14;
    }
    total -= 14;
    let x = (W - total) / 2;
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x + widths[i] / 2, H / 2 + 4);
      x += widths[i] + 14;
    }
    return makeTexture(c);
  }

  function miBadgeTexture() {
    const S = 256;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#ffcf3a');
    g.addColorStop(1, '#c99600');
    ctx.fillStyle = g;
    roundRect(ctx, 8, 8, S - 16, S - 16, 44);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#1a1300';
    ctx.font = '800 130px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('mi', S / 2, S / 2 + 10);
    return makeTexture(c);
  }

  function ultraBadgeTexture() {
    const W = 640, H = 180;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(242,238,226,.92)';
    ctx.font = '700 72px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SU7', 18, H / 2);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'italic 300 82px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Ultra', 228, H / 2 + 6);
    return makeTexture(c);
  }

  function ultraScriptTexture() {
    const W = 512, H = 256;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(238,238,232,.9)';
    ctx.font = 'italic 300 150px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ultra', W / 2, H / 2 + 8);
    return makeTexture(c);
  }

  function plateTexture() {
    const W = 640, H = 160;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f2f2ee');
    g.addColorStop(1, '#d8d8d2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1b1d20';
    ctx.font = '600 62px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SU7 Ultra', W / 2, H / 2 + 4);
    ctx.fillStyle = '#c50000';
    ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText('XIAOMI', W / 2, 24);
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    return makeTexture(c);
  }

  function batteryLabelTexture() {
    const W = 768, H = 384;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, W, H);
    // orange strip
    ctx.fillStyle = '#ff8a1e';
    ctx.fillRect(0, 0, W, 12);
    ctx.fillRect(0, H - 54, W, 54);
    // carbon-ish grid
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.fillStyle = '#f2efe4';
    ctx.font = '600 34px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('XIAOMI SU7 ULTRA', 40, 64);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '300 92px "Cascadia Code", Consolas, monospace';
    ctx.fillText('93.7 kWh', 40, 180);
    ctx.fillStyle = 'rgba(240,245,250,.8)';
    ctx.font = '400 26px "Cascadia Code", Consolas, monospace';
    ctx.fillText('KIRIN II  ·  897 V  ·  CTB STRUCTURE', 40, 232);
    ctx.fillStyle = 'rgba(240,245,250,.45)';
    ctx.font = '400 20px "Cascadia Code", Consolas, monospace';
    ctx.fillText('PEAK DISCHARGE 1330 kW  /  HIGH VOLTAGE', 40, 274);
    ctx.fillStyle = '#101216';
    ctx.font = '700 22px "Cascadia Code", Consolas, monospace';
    ctx.fillText('⚠  HIGH VOLTAGE  ·  DO NOT DISASSEMBLE', 40, H - 18);
    // warning stripes
    ctx.save();
    ctx.translate(W - 150, 0);
    ctx.rotate(-0.4);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#ffd23f' : '#1a1b1d';
      ctx.fillRect(i * 30, 0, 30, H);
    }
    ctx.restore();
    return makeTexture(c);
  }

  function motorLabelTexture() {
    const W = 512, H = 160;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f2efe4';
    ctx.font = '600 40px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V8s', W / 2, 50);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '400 24px "Cascadia Code", Consolas, monospace';
    ctx.fillText('425 kW  ·  27,200 rpm', W / 2, 104);
    return makeTexture(c);
  }

  /* ============================================================
     Privacy glass tint with soft reflection streaks
     ============================================================ */
  function glassTintTexture() {
    const W = 1024, H = 512;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, '#31485a');
    g.addColorStop(0.3, '#152530');
    g.addColorStop(0.58, '#0a1117');
    g.addColorStop(0.82, '#101c26');
    g.addColorStop(1, '#1c2b38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // broad diagonal reflection
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const rg = ctx.createLinearGradient(W * (0.1 + i * 0.15), 0, W * (0.45 + i * 0.15), H);
      rg.addColorStop(0, 'rgba(210,235,255,0)');
      rg.addColorStop(0.42, 'rgba(170,210,235,' + (0.1 - i * 0.025) + ')');
      rg.addColorStop(0.5, 'rgba(235,248,255,' + (0.15 - i * 0.035) + ')');
      rg.addColorStop(0.58, 'rgba(150,200,230,0)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(0, H * (0.15 + i * 0.18));
      ctx.lineTo(W, H * (0.02 + i * 0.18));
      ctx.lineTo(W, H * (0.13 + i * 0.18));
      ctx.lineTo(0, H * (0.3 + i * 0.18));
      ctx.closePath();
      ctx.fill();
    }
    // fine rain speckle
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      ctx.fillStyle = 'rgba(190,225,245,' + (0.02 + Math.random() * 0.06) + ')';
      ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
    }
    ctx.restore();
    return makeTexture(c);
  }

  /* ============================================================
     Misc effects textures (reused from the previous build)
     ============================================================ */
  function brushedMetalTexture() {
    const W = 512, H = 512;
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    const base = ctx.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, '#3a3f44');
    base.addColorStop(0.5, '#23272b');
    base.addColorStop(1, '#15181b');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) {
      const y = Math.random() * H;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.008 + Math.random() * 0.03).toFixed(3) + ')';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
    return makeTexture(c, { srgb: false, repeat: [2, 1] });
  }

  function particleTexture() {
    const S = 64;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,235,200,.8)');
    g.addColorStop(0.6, 'rgba(255,200,120,.18)');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return makeTexture(c);
  }

  function softGlowTexture() {
    const S = 256;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,.85)');
    g.addColorStop(0.22, 'rgba(255,255,255,.38)');
    g.addColorStop(0.55, 'rgba(255,255,255,.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return makeTexture(c);
  }

  function shadowTexture() {
    const S = 256;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.06, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,0,.78)');
    g.addColorStop(0.45, 'rgba(0,0,0,.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return makeTexture(c);
  }

  function floorGlowTexture() {
    const S = 512;
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,210,63,.42)');
    g.addColorStop(0.18, 'rgba(255,180,40,.2)');
    g.addColorStop(0.42, 'rgba(120,90,20,.08)');
    g.addColorStop(0.7, 'rgba(40,30,8,.025)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(255,210,80,.3)';
    [0.2, 0.32, 0.48, 0.62].forEach(function (r, i) {
      ctx.lineWidth = i === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S * r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255,220,120,.35)';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = S * 0.355, r2 = S * (i % 5 === 0 ? 0.39 : 0.372);
      ctx.lineWidth = i % 5 === 0 ? 1.6 : 0.8;
      ctx.beginPath();
      ctx.moveTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1);
      ctx.lineTo(S / 2 + Math.cos(a) * r2, S / 2 + Math.sin(a) * r2);
      ctx.stroke();
    }
    return makeTexture(c);
  }

  /* ---------- lazy registry ---------- */
  const cache = {};
  function lazy(name, fn) {
    return function () {
      if (!cache[name]) cache[name] = fn();
      return cache[name];
    };
  }

  window.SU7.textures = {
    carbon: lazy('carbon', carbonFiberTexture),
    paintFlake: lazy('paintFlake', paintFlakeTexture),
    tyreTread: lazy('tyreTread', tyreTreadTexture),
    brakeDisc: lazy('brakeDisc', brakeDiscTexture),
    centerScreen: lazy('centerScreen', centerScreenTexture),
    clusterScreen: lazy('clusterScreen', clusterTexture),
    xiaomiWordmark: lazy('xiaomiWordmark', xiaomiWordmarkTexture),
    miBadge: lazy('miBadge', miBadgeTexture),
    ultraBadge: lazy('ultraBadge', ultraBadgeTexture),
    ultraScript: lazy('ultraScript', ultraScriptTexture),
    plate: lazy('plate', plateTexture),
    glassTint: lazy('glassTint', glassTintTexture),
    batteryLabel: lazy('batteryLabel', batteryLabelTexture),
    motorLabel: lazy('motorLabel', motorLabelTexture),
    brushedMetal: lazy('brushedMetal', brushedMetalTexture),
    particle: lazy('particle', particleTexture),
    softGlow: lazy('softGlow', softGlowTexture),
    shadow: lazy('shadow', shadowTexture),
    floorGlow: lazy('floorGlow', floorGlowTexture)
  };
})();
