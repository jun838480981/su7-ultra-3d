/* ============================================================
   app.js — scene, lighting, camera, explosion animation and UI
   ============================================================ */
(function () {
  'use strict';

  const B = window.THREE_BUNDLE;
  const THREE = B.THREE;
  const OrbitControls = B.OrbitControls;
  const EffectComposer = B.EffectComposer;
  const RenderPass = B.RenderPass;
  const UnrealBloomPass = B.UnrealBloomPass;
  const OutputPass = B.OutputPass;
  const T = window.SU7.textures;

  const $ = function (id) { return document.getElementById(id); };
  const clamp = THREE.MathUtils.clamp;
  const deg = THREE.MathUtils.degToRad;

  const DEFAULT_POSE = { az: 0.94, el: 0.22, r: 13.2, ty: 0.98 };
  const EXPLODED_POSE = { az: 1.0, el: 0.3, r: 21.0, ty: 1.45, tx: 0 };
  const INTRO_POSE = { az: 1.16, el: 0.34, r: 16.8, ty: 1.0 };
  const MOBILE_DEFAULT_POSE = { az: 0.94, el: 0.22, r: 17.2, ty: 0.98 };
  const MOBILE_EXPLODED_POSE = { az: 1.0, el: 0.3, r: 28.5, ty: 1.45, tx: 0 };
  const MOBILE_INTRO_POSE = { az: 1.16, el: 0.3, r: 22.0, ty: 1.0 };
  const MOBILE_BREAKPOINT = 960;

  const state = {
    exploded: false,
    explodeVisual: 0,
    explodeStart: performance.now(),
    explodeFrom: 0,
    selected: null,
    hovered: null,
    labelsOn: true,
    autoFocus: true,
    autoRotate: false,
    tab: 'detail',
    intro: true,
    ready: false,
    mobile: window.innerWidth <= MOBILE_BREAKPOINT,
    dragging: false,
    focusHidden: [],
    fpsSamples: [],
    qualityDropped: false
  };

  let renderer = null;
  let scene = null;
  let camera = null;
  let controls = null;
  let composer = null;
  let bloomPass = null;
  let model = null;
  let clock = null;
  let raycaster = null;
  let pointerNDC = null;
  let animFrame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let camTween = null;
  let bootHidden = false;
  let toastTimer = 0;
  let lastMeterPct = -1;
  let hoverPickAt = 0;
  let pendingPointer = null;
  let hoverRaf = 0;
  let pointerDown = null;
  let labelEls = {};
  let labelCacheW = 0;
  let introFlyTimer = 0;
  const tmpV = new THREE.Vector3();
  const tmpV2 = new THREE.Vector3();
  const camForward = new THREE.Vector3();
  const customColors = {};

  const dom = {};

  function cacheDom() {
    [
      'scene', 'boot', 'bootBar', 'bootStatus', 'fallback', 'statusCode', 'statusMeta',
      'btnGuide', 'btnFullscreen', 'btnMobileParts', 'btnMobileInfo', 'panelParts',
      'partList', 'partCount', 'panelInfo', 'infoBody', 'explodePct', 'explodeMeter',
      'btnCloseInfo', 'btnFocusSelected', 'labelsLayer', 'leaderSvg', 'labelNodes',
      'hoverTag', 'hoverIndex', 'hoverName', 'btnExplode', 'explodeLabel', 'btnReset',
      'btnAutoRotate', 'btnLabels', 'btnFocusCam', 'toast', 'guideModal', 'tabUnderline',
      'dock'
    ].forEach(function (id) { dom[id] = $(id); });
    dom.tabs = Array.prototype.slice.call(document.querySelectorAll('.info-tab'));
    dom.closeGuide = Array.prototype.slice.call(document.querySelectorAll('[data-close="guide"]'));
    dom.guideOpeners = [dom.btnGuide];
  }

  /* ============================================================
     boot helpers
     ============================================================ */
  function boot(pct, text) {
    if (dom.bootBar) dom.bootBar.style.width = pct + '%';
    if (dom.bootStatus && text) dom.bootStatus.textContent = text;
  }
  function hideBoot() {
    if (bootHidden) return;
    bootHidden = true;
    boot(100, '系统就绪');
    setTimeout(function () {
      if (dom.boot) dom.boot.classList.add('is-done');
      afterBoot();
    }, 520);
  }
  function afterBoot() {
    state.ready = true;
    flyToPose(getDefaultPose(), 2.2);
    setTimeout(function () {
      if (!state.selected) showToast('点击任意部件开始拆解 · 拖拽环绕车身', 5200);
    }, 1000);
  }
  function showFallback(message) {
    if (dom.boot) dom.boot.classList.add('is-done');
    dom.fallback.hidden = false;
    if (message) {
      const p = dom.fallback.querySelector('.fallback-tip');
      if (p) p.textContent = '错误信息：' + message;
    }
  }

  /* ============================================================
     renderer / scene / environment
     ============================================================ */
  function initRenderer() {
    const canvas = dom.scene;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false
      });
    } catch (err) {
      showFallback(err && err.message ? err.message : 'WebGL 初始化失败');
      throw err;
    }
    const dprCap = state.mobile ? 1.6 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.shadowMap.enabled = false;
  }

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04070d);
    scene.fog = new THREE.FogExp2(0x04070d, 0.008);

    camera = new THREE.PerspectiveCamera(state.mobile ? 48 : 38, window.innerWidth / window.innerHeight, 0.05, 220);
    const introPose = state.mobile ? MOBILE_INTRO_POSE : INTRO_POSE;
    const p = sphericalToVec(introPose.az, introPose.el, introPose.r, introPose.ty, new THREE.Vector3());
    camera.position.copy(p);
    camera.lookAt(0, introPose.ty, 0);

    clock = new THREE.Clock();
    lastTime = performance.now();
    raycaster = new THREE.Raycaster();
    pointerNDC = new THREE.Vector2(0, 0);
  }

  function initEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x020407);

    const room = new THREE.Mesh(
      new THREE.BoxGeometry(60, 60, 60),
      new THREE.MeshBasicMaterial({ color: 0x070b11, side: THREE.BackSide })
    );
    envScene.add(room);

    function panel(w, h, rgb, pos, rotX, rotY) {
      const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      mat.color.setRGB(rgb[0], rgb[1], rgb[2]);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      if (rotX) mesh.rotation.x = rotX;
      if (rotY) mesh.rotation.y = rotY;
      mesh.lookAt(0, 0, 0);
      if (rotX || rotY) mesh.rotation.set(rotX || 0, rotY || 0, 0);
      envScene.add(mesh);
      return mesh;
    }

    // large soft box above
    panel(16, 12, [4.8, 4.8, 4.8], [0, 14, 1]);
    // neutral key front
    panel(10, 7, [3.2, 3.2, 3.2], [2, 4, 12]);
    // cool rim left
    panel(9, 5, [0.35, 2.3, 3.2], [-12, 5, 3]);
    // subtle warm rim right/back
    panel(6, 3, [1.7, 0.85, 0.4], [11, 0, -5]);
    // cyan back strip
    panel(5, 8, [0.35, 1.8, 2.7], [-1, 3, -13]);
    // faint floor bounce
    panel(18, 18, [0.35, 0.48, 0.66], [0, -9, 0], -Math.PI / 2);

    const envRT = pmrem.fromScene(envScene, 0.035);
    scene.environment = envRT.texture;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.82;

    envScene.traverse(function (o) {
      if (o.isMesh) {
        o.geometry.dispose();
        if (o.material) o.material.dispose();
      }
    });
    pmrem.dispose();
  }

  function initLights() {
    scene.add(new THREE.HemisphereLight(0x7a9dba, 0x02050a, 0.38));

    const key = new THREE.DirectionalLight(0xfff1dc, 1.35);
    key.position.set(7, 10, 9);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x7fc9ff, 0.72);
    fill.position.set(-10, 3, 7);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x79e9ff, 0.95);
    rim.position.set(-4, 6, -10);
    scene.add(rim);

    const warm = new THREE.DirectionalLight(0xffa46a, 0.62);
    warm.position.set(9, 1, -7);
    scene.add(warm);

    const bottomGlow = new THREE.PointLight(0xffb03a, 5.5, 12, 2);
    bottomGlow.position.set(0, 0.18, 2.2);
    scene.add(bottomGlow);

    const lensGlow = new THREE.PointLight(0xbfe9ff, 2.8, 8, 2);
    lensGlow.position.set(3.6, 1.0, 0.2);
    scene.add(lensGlow);

    // broad, distant fill instead of point lights close to the wheels: close
    // lights blow the tyre sidewalls out to white when the wheels explode.
    const wheelFill = new THREE.DirectionalLight(0xffd7a8, 0.32);
    wheelFill.position.set(3, 2.5, 7);
    scene.add(wheelFill);
  }

  /* ============================================================
     stage: floor grid, rings, particles
     ============================================================ */
  const stage = {};

  function initStage() {
    const floorY = (model && model.floorY) || -5.3;

    // radial tech grid
    const gridMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0x3ed8ff) },
        uTime: { value: 0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform vec3 uColor;',
        'uniform float uTime;',
        'float gridLine(vec2 uv, float scale){',
        '  vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);',
        '  return 1.0 - min(min(g.x, g.y), 1.0);',
        '}',
        'void main(){',
        '  vec2 p = vUv * 2.0 - 1.0;',
        '  float d = length(p);',
        '  float fade = smoothstep(1.0, 0.12, d);',
        '  float g1 = gridLine(vUv, 22.0);',
        '  float g2 = gridLine(vUv, 110.0);',
        '  float pulse = 0.78 + 0.22 * sin(uTime * 1.1 - d * 9.0);',
        '  vec3 col = uColor * (g1 * 0.22 + g2 * 0.055) * fade * pulse;',
        '  float alpha = (g1 * 0.34 + g2 * 0.09) * fade;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = floorY + 0.005;
    grid.renderOrder = 1;
    scene.add(grid);
    stage.grid = grid;
    stage.gridMat = gridMat;

    // glow disc
    const glowMat = new THREE.MeshBasicMaterial({
      map: T.floorGlow(), transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = floorY + 0.012;
    glow.renderOrder = 2;
    scene.add(glow);
    stage.glow = glow;

    // soft shadow under the floating camera
    const shadowMat = new THREE.MeshBasicMaterial({
      map: T.shadow(), transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = floorY + 0.02;
    shadow.scale.set(1.08, 0.46, 1);
    shadow.renderOrder = 3;
    scene.add(shadow);
    stage.shadow = shadow;

    // concentric rings on the floor
    const ringGroup = new THREE.Group();
    [3.2, 4.35, 5.35].forEach(function (r, i) {
      const mat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x7defff : 0x2ea9c9, transparent: true,
        opacity: [0.22, 0.13, 0.08][i], blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false, side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 160), mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = floorY + 0.03;
      ring.renderOrder = 4;
      ringGroup.add(ring);
    });
    scene.add(ringGroup);
    stage.floorRings = ringGroup;

    // HUD halo rings around the car
    const hud = new THREE.Group();
    hud.position.y = 1.15;
    const ringMatA = new THREE.MeshBasicMaterial({
      color: 0x55e5ff, transparent: true, opacity: 0.065,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
    });
    const ringMatB = new THREE.MeshBasicMaterial({
      color: 0x9ad9ff, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
    });
    const flatRing = new THREE.Mesh(new THREE.RingGeometry(5.15, 5.17, 200), ringMatA);
    flatRing.rotation.x = -Math.PI / 2;
    hud.add(flatRing);

    const arc1 = new THREE.Mesh(new THREE.RingGeometry(4.55, 4.6, 120, 1, 0.4, 1.1), ringMatA);
    arc1.rotation.x = -Math.PI / 2;
    hud.add(arc1);

    const vRing1 = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.009, 6, 220), ringMatB);
    vRing1.rotation.set(0.35, 0.2, 0.25);
    hud.add(vRing1);

    const vRing2 = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.008, 6, 220), ringMatB);
    vRing2.rotation.set(-0.4, 0.9, 0.15);
    hud.add(vRing2);

    // tick marks
    const tickPositions = [];
    const tickRadius = 5.35;
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const len = i % 15 === 0 ? 0.34 : (i % 5 === 0 ? 0.18 : 0.09);
      tickPositions.push(
        Math.cos(a) * tickRadius, 0, Math.sin(a) * tickRadius,
        Math.cos(a) * (tickRadius + len), 0, Math.sin(a) * (tickRadius + len)
      );
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPositions, 3));
    const ticks = new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({
      color: 0x6fe6ff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    hud.add(ticks);
    scene.add(hud);
    stage.hud = hud;

    // ambient backdrop sprites
    function bgSprite(color, opacity, scale, pos) {
      const mat = new THREE.SpriteMaterial({
        map: T.softGlow(), color: color, transparent: true, opacity: opacity,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      });
      const s = new THREE.Sprite(mat);
      s.position.set(pos[0], pos[1], pos[2]);
      s.scale.set(scale, scale, 1);
      scene.add(s);
      return s;
    }
    stage.backA = bgSprite(0x1b7e9c, 0.22, 20, [-8, 4.2, -13]);
    stage.backB = bgSprite(0x9c5a1b, 0.16, 16, [9, 1.2, -14]);

    // dust particles
    stage.dust = buildParticles(700, 9, 30, 0x74ddff, 0.09, 0.7);
    stage.dustBig = buildParticles(90, 7, 22, 0xffc37a, 0.2, 0.4);
    scene.add(stage.dust);
    scene.add(stage.dustBig);
  }

  function buildParticles(count, rMin, rMax, color, size, opacity) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = rMin + Math.random() * (rMax - rMin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.55;
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: size, map: T.particle(), transparent: true, opacity: opacity,
      color: color, blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true, toneMapped: false
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return points;
  }

  /* ============================================================
     model + halo / selection effects
     ============================================================ */
  const halos = {};

  function initModel() {
    boot(45, '生成车身与碳纤维部件…');
    model = window.SU7.createModel();
    model.root.position.y = model.deviceY;
    scene.add(model.root);

    const spotLight = new THREE.PointLight(0xffd7a0, 3.2, 9, 2);
    spotLight.position.set(1.2, 2.2, 2.6);
    scene.add(spotLight);

    model.parts.forEach(function (part) {
      const meta = part.meta;
      const color = new THREE.Color(meta.accent);
      customColors[part.id] = color;

      const haloMat = new THREE.SpriteMaterial({
        map: T.softGlow(), color: color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false
      });
      const halo = new THREE.Sprite(haloMat);
      halo.visible = false;
      scene.add(halo);

      const ringMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
        side: THREE.DoubleSide, toneMapped: false
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 72), ringMat);
      ring.visible = false;
      scene.add(ring);

      part.glow = 0;
      part.glowTarget = 0;
      halos[part.id] = { halo: halo, ring: ring, haloMat: haloMat, ringMat: ringMat };
    });
  }

  /* ============================================================
     camera / controls
     ============================================================ */
  function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.98, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.rotateSpeed = 0.58;
    controls.zoomSpeed = 0.7;
    controls.panSpeed = 0.5;
    controls.screenSpacePanning = true;
    controls.minDistance = 4.4;
    controls.maxDistance = state.mobile ? 46 : 30;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.08;
    controls.autoRotateSpeed = 0.42;
    controls.enablePan = true;
    controls.addEventListener('start', function () {
      camTween = null;
      state.dragging = true;
      hideHover();
    });
    controls.addEventListener('end', function () {
      state.dragging = false;
    });
    controls.update();
  }

  function sphericalToVec(az, el, r, ty, out) {
    out = out || new THREE.Vector3();
    const ce = Math.cos(el);
    out.set(
      Math.sin(az) * ce * r,
      (ty || 0) + Math.sin(el) * r,
      Math.cos(az) * ce * r
    );
    return out;
  }

  function getDefaultPose() {
    return state.mobile ? MOBILE_DEFAULT_POSE : DEFAULT_POSE;
  }
  function getExplodedPose() {
    return state.mobile ? MOBILE_EXPLODED_POSE : EXPLODED_POSE;
  }

  function poseToPosition(pose, out) {
    out = out || new THREE.Vector3();
    const ty = pose.ty === undefined ? 0.6 : pose.ty;
    sphericalToVec(pose.az, pose.el, pose.r, 0, out);
    out.x += pose.tx || 0;
    out.z += pose.tz || 0;
    out.y = ty + Math.sin(pose.el) * pose.r;
    return out;
  }

  function flyToPose(pose, duration) {
    if (!controls || !camera) return;
    const dur = (duration === undefined ? 1.15 : duration) * 1000;
    const toPos = poseToPosition(pose, new THREE.Vector3());
    const floorY = model ? model.floorY : -0.035;
    if (!pose.ignoreFloor && toPos.y < floorY + 0.42) {
      toPos.y = floorY + 0.42;
    }
    camTween = {
      start: performance.now(),
      dur: Math.max(240, dur),
      fromPos: camera.position.clone(),
      toPos: toPos,
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(pose.tx || 0, pose.ty === undefined ? 0.6 : pose.ty, pose.tz || 0)
    };
  }

  function updateCameraTween(now) {
    if (!camTween) return;
    const t = clamp((now - camTween.start) / camTween.dur, 0, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
    camera.lookAt(controls.target);
    if (t >= 1) camTween = null;
  }

  function focusPart(part) {
    if (!part) return;
    const targetLocal = explodedPoseFor(part, part.id).pos;
    if (part.subParts && part.subParts.length) {
      const avg = new THREE.Vector3();
      part.subParts.forEach(function (sp) { avg.add(sp.offset); });
      avg.multiplyScalar(1 / part.subParts.length);
      targetLocal.add(avg);
    }
    const view = part.meta.view || { az: 1.0, el: 0.25 };
    const radius = clamp(view.r || 12, 7.0, 19.0) * (state.mobile ? 1.28 : 1);
    const pose = {
      az: view.az,
      el: view.el,
      r: radius,
      tx: targetLocal.x,
      ty: targetLocal.y + model.root.position.y,
      tz: targetLocal.z,
      ignoreFloor: view.el < 0.05 || !!view.ignoreFloor
    };
    flyToPose(pose, 1.25);
  }

  /* ============================================================
     part animation / selection
     ============================================================ */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function animatePart(part, targetPos, targetQuat, duration, delay, ease) {
    part.anim = {
      fromPos: part.pivot.position.clone(),
      toPos: targetPos.clone(),
      fromQuat: part.pivot.quaternion.clone(),
      toQuat: targetQuat.clone(),
      start: performance.now() + (delay || 0) * 1000,
      duration: Math.max(80, (duration || 0.9) * 1000),
      ease: ease || easeOutCubic
    };
    // Four identical sub-assemblies (wheels / brakes / suspension) fan out
    // from their assembled corners while the part pivot itself stays centred.
    if (part.subParts && part.subParts.length) {
      const exploded = state.exploded;
      const dur = Math.max(80, (duration || 0.9) * 1000);
      const start = performance.now() + (delay || 0) * 1000;
      part.subAnim = {
        start: start,
        duration: dur,
        ease: ease || easeOutCubic,
        entries: part.subParts.map(function (sp) {
          return {
            obj: sp.obj,
            fromPos: sp.obj.position.clone(),
            toPos: (exploded ? sp.base.clone().add(sp.offset) : sp.base.clone())
          };
        })
      };
    }
  }

  function updatePartAnims(now) {
    if (!model) return;
    model.parts.forEach(function (part) {
      const a = part.anim;
      if (a) {
        if (now >= a.start) {
          const raw = clamp((now - a.start) / a.duration, 0, 1);
          const k = a.ease(raw);
          part.pivot.position.lerpVectors(a.fromPos, a.toPos, k);
          part.pivot.quaternion.slerpQuaternions(a.fromQuat, a.toQuat, k);
          if (raw >= 1) part.anim = null;
        }
      }
      const sa = part.subAnim;
      if (sa) {
        if (now >= sa.start) {
          const raw = clamp((now - sa.start) / sa.duration, 0, 1);
          const k = sa.ease(raw);
          sa.entries.forEach(function (entry) {
            entry.obj.position.lerpVectors(entry.fromPos, entry.toPos, k);
          });
          if (raw >= 1) part.subAnim = null;
        }
      }
    });
  }

  function explodedPoseFor(part, selectedId) {
    const meta = part.meta;
    const off = new THREE.Vector3(meta.explode[0], meta.explode[1], meta.explode[2]);
    const selected = selectedId === part.id;
    const grouped = !!(part.subParts && part.subParts.length);
    if (selected && !grouped) {
      if (off.lengthSq() > 0.001) {
        off.add(off.clone().normalize().multiplyScalar(0.45));
      } else {
        off.set(0, 0.4, 0.6);
      }
    }
    const pos = part.center.clone().add(off);
    const mult = selected ? 1.16 : 1;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      deg(meta.explodeRot[0] * mult),
      deg(meta.explodeRot[1] * mult),
      deg(meta.explodeRot[2] * mult)
    ));
    return { pos: pos, quat: q };
  }

  function setExploded(on, opts) {
    opts = opts || {};
    if (!model) return;
    if (state.exploded === on && !opts.force) return;
    state.exploded = on;
    state.explodeFrom = state.explodeVisual;
    state.explodeStart = performance.now();
    const selectedId = on ? state.selected : null;
    const stagger = on ? 0.028 : 0.022;
    const duration = on ? 1.05 : 0.9;
    model.parts.forEach(function (part, i) {
      const target = on
        ? explodedPoseFor(part, selectedId)
        : { pos: part.center.clone(), quat: new THREE.Quaternion() };
      animatePart(part, target.pos, target.quat, duration, i * stagger, on ? easeOutCubic : easeInOutCubic);
    });
    if (!on) {
      restoreFocusHidden();
      state.selected = null;
      updateSelectionUI();
      hideAllLabels();
      updateStatusMeta();
    }
    updateExplodeButton();
    if (opts.fly !== false) {
      flyToPose(on ? getExplodedPose() : getDefaultPose(), on ? 1.35 : 1.15);
    }
    if (!opts.silent) {
      showToast(on ? '拆解完成 · 点击任意部件查看详情' : '已重新组装 · 点击部件再次拆解', 2600);
    }
  }

  function restoreFocusHidden() {
    if (!model) return;
    state.focusHidden.forEach(function (id) {
      const p = model.byId[id];
      if (p) p.pivot.visible = true;
    });
    state.focusHidden = [];
  }

  function selectPart(id) {
    if (!model) return;
    const part = model.byId[id];
    if (!part) return;
    hideHover();
    if (state.selected === id) {
      if (state.exploded) { deselect(); return; }
    }
    restoreFocusHidden();
    const prev = state.selected;
    state.selected = id;
    // cut-away helpers for parts that sit under the glass/doors
    if (part.meta.hideWhileSelected) {
      part.meta.hideWhileSelected.forEach(function (otherId) {
        const other = model.byId[otherId];
        if (other && other.id !== id) {
          other.pivot.visible = false;
          state.focusHidden.push(otherId);
        }
      });
    }
    if (!state.exploded) {
      setExploded(true, { fly: false, silent: true });
    } else {
      if (prev && model.byId[prev]) {
        const oldPart = model.byId[prev];
        const oldTarget = explodedPoseFor(oldPart, id);
        animatePart(oldPart, oldTarget.pos, oldTarget.quat, 0.55, 0, easeOutCubic);
      }
      const target = explodedPoseFor(part, id);
      animatePart(part, target.pos, target.quat, 0.55, 0, easeOutCubic);
    }
    updateSelectionUI();
    updateStatusMeta();
    if (state.autoFocus) focusPart(part);
    if (state.mobile) openMobilePanel('info');
    showToast(part.index + ' · ' + part.meta.name + ' 已选中', 1800);
  }

  function deselect() {
    if (!state.selected) return;
    const prev = state.selected;
    state.selected = null;
    restoreFocusHidden();
    if (state.exploded && model.byId[prev]) {
      const part = model.byId[prev];
      const target = explodedPoseFor(part, null);
      animatePart(part, target.pos, target.quat, 0.55, 0, easeOutCubic);
    }
    updateSelectionUI();
    updateStatusMeta();
    if (state.autoFocus && state.exploded) flyToPose(getExplodedPose(), 1.1);
  }

  function toggleExplode() {
    setExploded(!state.exploded, {});
  }

  function updateExplodeButton() {
    if (!dom.btnExplode) return;
    dom.explodeLabel.textContent = state.exploded ? '一键组装' : '一键拆解';
    dom.btnExplode.classList.toggle('is-assembling', state.exploded);
    dom.btnExplode.setAttribute('aria-pressed', String(state.exploded));
  }

  /* ============================================================
     glow + halos
     ============================================================ */
  function updateGlow(dt) {
    if (!model) return;
    const pulse = 0.84 + 0.16 * Math.sin(elapsed * 4.4);
    model.parts.forEach(function (part) {
      const isSel = state.selected === part.id;
      const isHov = state.hovered === part.id;
      part.glowTarget = isSel ? 1 : (isHov ? 0.32 : 0);
      part.glow += (part.glowTarget - part.glow) * Math.min(1, dt * 8.5);
      if (part.glow < 0.006 && part.glowTarget === 0) {
        if (part._glowApplied) {
          part.glowMats.forEach(function (m) {
            m.emissive.copy(m.userData.baseEmissive || new THREE.Color(0x000000));
            m.emissiveIntensity = m.userData.baseEmissiveIntensity === undefined ? 1 : m.userData.baseEmissiveIntensity;
          });
          part._glowApplied = false;
        }
      } else if (part.glowMats.length) {
        part._glowApplied = true;
        const col = customColors[part.id];
        const strength = part.glow * (isSel ? 0.3 : 0.18) * (isSel ? pulse : 1);
        part.glowMats.forEach(function (m) {
          m.emissive.copy(col);
          m.emissiveIntensity = strength;
        });
      }
      // focus ring
      const h = halos[part.id];
      if (h) {
        const visible = part.glow > 0.02;
        h.halo.visible = false;
        h.ring.visible = visible;
        if (visible) {
          part.pivot.getWorldPosition(tmpV);
          const ringSize = clamp(Math.max(part.size.x, part.size.y) * 0.28, 0.7, 4.0);
          h.ring.position.copy(tmpV);
          h.ring.scale.set(ringSize, ringSize, 1);
          h.ring.lookAt(camera.position);
          h.ring.rotation.z += dt * 0.5;
          h.ringMat.opacity = part.glow * 0.13;
        }
      }
    });
  }

  /* ============================================================
     UI: part list, details, specs
     ============================================================ */
  const MODEL_SPECS = [
    {
      title: '巅峰性能', key: 'PERFORMANCE',
      rows: [
        ['综合功率', '1548 PS / 1138 kW'], ['0–100 km/h', '1.98 s（不含起步）'],
        ['0–200 km/h', '5.86 s（媒体口径）'], ['最高车速', '350 km/h'],
        ['纽北量产版', '7:04.957'], ['纽北原型车', '6:46.874'],
        ['驱动形式', '三电机四驱 + 扭矩矢量控制'],
        ['轮胎条件', '0–100 成绩需 TROFEO RS 半热熔轮胎']
      ]
    },
    {
      title: '超级三电', key: 'POWERTRAIN',
      rows: [
        ['电机布局', '前 V6s + 后双 V8s'], ['V8s 单机', '425 kW'],
        ['电池容量', '93.7 kWh · 宁德时代麒麟 II'],
        ['峰值放电', '1330 kW'], ['高压平台', '897 V（媒体口径）'],
        ['充电倍率', '5.2C（媒体口径）'], ['10–80% 充电', '约 11 min（媒体口径）'],
        ['CLTC 续航', '630 / 600 / 555 / 520 km']
      ]
    },
    {
      title: '底盘与制动', key: 'CHASSIS & BRAKES',
      rows: [
        ['制动系统', '碳陶制动盘 · 前六后四活塞固定卡钳'],
        ['前盘尺寸', '约 430 mm（媒体口径）'], ['轮毂', '21 英寸 U 型锻造'],
        ['前胎 / 后胎', '265/35 ZR21 / 305/30 ZR21'],
        ['轮胎', '倍耐力 P ZERO 第五代高性能轮胎'],
        ['悬架', '闭式双腔空气弹簧 + CDC'],
        ['结构', '前双叉臂 / 后多连杆'], ['赛道选装', '倍适登 EVO R 绞牙减振器']
      ]
    },
    {
      title: '车身与空气动力学', key: 'BODY & AERO',
      rows: [
        ['尺寸', '5115 × 1970 × 1465 mm'], ['轴距', '3000 mm'], ['整备质量', '2360 kg'],
        ['最大下压力', '285 kg @ 350 km/h'], ['风阻系数', '约 0.2 Cd（媒体口径）'],
        ['碳纤维部件', '全车 17 处'], ['固定尾翼', '碳纤维 · 3 挡可调可选'],
        ['车身颜色', '闪电黄 / 太空银 / 鹦鹉绿 / 曜石黑 / 珍珠白']
      ]
    },
    {
      title: '座舱与智能', key: 'CABIN & TECH',
      rows: [
        ['中控屏', '16.1 英寸'], ['仪表', '7.1 英寸翻转仪表'],
        ['内饰材质', '约 5 m² Alcantara + 碳纤维'],
        ['方向盘', '碳纤维运动方向盘 · 黄色回中标识'],
        ['音响', '25 扬声器'], ['车机', 'Xiaomi HyperOS'],
        ['玻璃', '四门隔音隔热玻璃'], ['前备箱', '电动前备箱（碳纤盖选装后取消）']
      ]
    },
    {
      title: '车型与价格', key: 'MODEL & PRICE',
      rows: [
        ['上市时间', '2025 年 2 月 27 日'], ['官方指导价', '52.99 万元起'],
        ['纽北限量版', '81.49 万元 · 限量 100 台'],
        ['车身形式', '四门五座高性能轿车'],
        ['智能驾驶', 'Xiaomi HAD 端到端辅助驾驶'],
        ['数据说明', '官方参数优先；媒体口径与估算已单独标注']
      ]
    }
  ];

  function buildPartList() {
    if (!dom.partList) return;
    dom.partList.innerHTML = '';
    dom.partCount.textContent = model.parts.length;
    model.parts.forEach(function (part) {
      const meta = part.meta;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'part-item';
      btn.dataset.id = meta.id;
      btn.setAttribute('role', 'listitem');
      btn.style.setProperty('--accent', meta.accent);
      const shortSpec = meta.labelSpec.split(' · ')[0];
      btn.innerHTML =
        '<span class="pi-index">' + part.index + '</span>' +
        '<span class="pi-copy">' +
        '<span class="pi-name">' + meta.name + '<em>' + shortSpec + '</em></span>' +
        '<span class="pi-en">' + meta.en + '</span>' +
        '</span>' +
        '<span class="pi-arrow">›</span>';
      btn.addEventListener('click', function () { selectPart(meta.id); });
      btn.addEventListener('mouseenter', function () { state.hovered = meta.id; });
      btn.addEventListener('mouseleave', function () {
        if (state.hovered === meta.id) state.hovered = null;
      });
      dom.partList.appendChild(btn);
    });
  }

  function setActiveListItem(id) {
    Array.prototype.forEach.call(dom.partList.children, function (child) {
      child.classList.toggle('is-active', child.dataset.id === id);
    });
  }

  function renderOverview() {
    if (!state.ready) {
      dom.infoBody.innerHTML = '<div class="overview"><div class="ov-eyebrow">SYSTEM BOOT</div><h2>Loading <span>...</span></h2></div>';
      return;
    }
    const partTotal = model ? model.parts.length : 18;
    dom.infoBody.innerHTML =
      '<div class="overview">' +
        '<div class="ov-eyebrow">VEHICLE OVERVIEW / 整车概览</div>' +
        '<h2>SU7 <span>Ultra</span></h2>' +
        '<p>一台面向赛道与公路的高性能四门轿车。1548 PS 三电机、碳陶制动与全车空气动力学套件，纽北量产电动车圈速纪录保持者。点击任意部件，逐层拆解它的性能结构。</p>' +
        '<div class="ov-grid">' +
          '<div class="ov-stat"><b>1548</b><span>PS 综合功率</span></div>' +
          '<div class="ov-stat"><b>1.98</b><span>s 0–100 km/h</span></div>' +
          '<div class="ov-stat"><b>350</b><span>km/h 极速</span></div>' +
          '<div class="ov-stat"><b>93.7</b><span>kWh 电池</span></div>' +
          '<div class="ov-stat"><b>285</b><span>kg 最大下压力</span></div>' +
          '<div class="ov-stat"><b>' + partTotal + '</b><span>可拆解部件</span></div>' +
        '</div>' +
        '<div class="ov-hint">' +
          '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h9M9 5l5 5-5 5"/></svg>' +
          '<span>点击画面中的车身、三电或底盘部件，或从左侧清单选择，开始逐层拆解与参数查看。</span>' +
        '</div>' +
        '<ul class="ov-points">' +
          '<li>拆解时部件沿三维方向展开，四轮、制动与悬架会按四角独立分离。</li>' +
          '<li>右侧面板提供关键参数、材质与拆解说明；「整车规格」页可查看完整参数。</li>' +
          '<li>车身、灯组与空气动力学布局依据官方产品图；内部结构为示意级还原。</li>' +
          '<li>底部操作坞支持一键拆解 / 组装、自动旋转、标注开关与自动视角切换。</li>' +
        '</ul>' +
      '</div>';
  }

  function renderDetail(part) {
    const meta = part.meta;
    const specs = meta.specs.map(function (s) {
      return '<div class="spec-row"><span class="sk">' + s[0] + '</span><b class="sv">' + s[1] + '</b></div>';
    }).join('');
    const tags = meta.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    dom.infoBody.innerHTML =
      '<div class="detail" style="--accent:' + meta.accent + '">' +
        '<div class="detail-top">' +
          '<div class="detail-index">' + part.index + '</div>' +
          '<div class="detail-heading">' +
            '<div class="detail-kicker">' + meta.cat + '</div>' +
            '<h2>' + meta.name + '</h2>' +
            '<div class="detail-en">' + meta.en + '</div>' +
          '</div>' +
          '<button class="detail-clear" type="button" data-detail-close aria-label="取消选中">×</button>' +
        '</div>' +
        '<p class="detail-desc">' + meta.desc + '</p>' +
        '<div class="block-title">关键参数<span>SPECIFICATIONS</span></div>' +
        '<div class="spec-grid">' + specs + '</div>' +
        '<div class="block-title">材质 / 工艺<span>MATERIALS &amp; CRAFT</span></div>' +
        '<div class="chips">' + tags + '</div>' +
        '<div class="detail-note"><span>TEARDOWN NOTE</span><p>' + meta.note + '</p></div>' +
        '<div class="detail-footnote">部件 ' + part.index + ' / ' + String(model.parts.length).padStart(2, '0') + ' · ' +
          (state.exploded ? '已拆解' : '已组装') + ' · 点击空白处取消选中</div>' +
      '</div>';
    dom.infoBody.scrollTop = 0;
  }

  function renderSpecs() {
    const hero =
      '<div class="spec-hero"><b>1548 PS</b><span>TRI-MOTOR AWD · 1.98s · 350km/h</span></div>';
    const sections = MODEL_SPECS.map(function (sec) {
      const rows = sec.rows.map(function (r) {
        return '<div class="spec-row"><span class="sk">' + r[0] + '</span><b class="sv">' + r[1] + '</b></div>';
      }).join('');
      return '<div class="spec-section"><h3><i></i>' + sec.title +
        '<span style="margin-left:auto;font-family:var(--mono);font-size:8px;color:var(--dim);letter-spacing:.14em">' + sec.key + '</span></h3>' +
        rows + '</div>';
    }).join('');
    dom.infoBody.innerHTML =
      '<div class="spec-tab">' + hero + sections +
      '<div class="detail-footnote">数据来源于小米汽车官方资料与公开媒体 · 媒体口径及估算已在规格中标注 · 内部结构为可视化示意</div></div>';
    dom.infoBody.scrollTop = 0;
  }

  function updateSelectionUI() {
    if (!state.ready && !model) return;
    const id = state.selected;
    setActiveListItem(id);
    const has = !!id;
    dom.btnFocusSelected.disabled = !has;
    if (id && model.byId[id]) {
      const meta = model.byId[id].meta;
      dom.panelInfo.style.setProperty('--accent', meta.accent);
      if (state.tab !== 'detail') setTab('detail', true);
      renderDetail(model.byId[id]);
    } else {
      dom.panelInfo.style.removeProperty('--accent');
      if (state.tab === 'detail') renderOverview();
    }
    if (dom.labelsLayer) dom.labelsLayer.classList.toggle('has-selection', !!id);
    Object.keys(labelEls).forEach(function (k) {
      labelEls[k].el.classList.toggle('is-selected', k === id);
    });
  }

  function setTab(tab, silent) {
    state.tab = tab;
    dom.tabs.forEach(function (btn) {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    if (dom.tabUnderline) {
      dom.tabUnderline.style.transform = tab === 'specs' ? 'translateX(100%)' : 'translateX(0)';
    }
    if (!silent && state.ready) {
      if (tab === 'specs') renderSpecs();
      else if (state.selected && model.byId[state.selected]) renderDetail(model.byId[state.selected]);
      else renderOverview();
    }
  }

  function updateStatusMeta() {
    if (!dom.statusMeta) return;
    if (state.selected && model && model.byId[state.selected]) {
      const part = model.byId[state.selected];
      dom.statusMeta.textContent = 'PART ' + part.index + ' / ' + String(model.parts.length).padStart(2, '0') + ' · ' + part.meta.en;
    } else {
      dom.statusMeta.textContent = '18 PARTS · 1548PS TRI-MOTOR';
    }
  }

  /* ============================================================
     labels
     ============================================================ */
  function buildLabels() {
    if (!dom.labelNodes || !dom.leaderSvg) return;
    const NS = 'http://www.w3.org/2000/svg';
    model.parts.forEach(function (part) {
      const meta = part.meta;
      const el = document.createElement('div');
      el.className = 'part-label';
      el.dataset.id = meta.id;
      el.style.setProperty('--accent', meta.accent);
      el.innerHTML =
        '<i class="pl-dot"></i>' +
        '<div class="pl-body">' +
          '<span class="pl-name"><span class="pl-label">' + part.index + '</span>' + meta.name + '</span>' +
          '<span class="pl-spec">' + meta.labelSpec + '</span>' +
        '</div>';
      el.addEventListener('click', function (ev) {
        ev.stopPropagation();
        selectPart(meta.id);
      });
      dom.labelNodes.appendChild(el);

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'leader-g');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('stroke', meta.accent);
      path.setAttribute('stroke-opacity', '0.5');
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('r', '2.2');
      circle.setAttribute('fill', meta.accent);
      circle.setAttribute('fill-opacity', '0.9');
      g.appendChild(path);
      g.appendChild(circle);
      dom.leaderSvg.appendChild(g);

      labelEls[meta.id] = { el: el, g: g, path: path, circle: circle, w: 0, h: 0 };
    });
  }

  function hideAllLabels() {
    Object.keys(labelEls).forEach(function (k) {
      labelEls[k].el.classList.remove('is-visible');
      labelEls[k].g.classList.remove('is-visible');
    });
  }

  function getSafeArea() {
    const w = window.innerWidth, h = window.innerHeight;
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      return { left: 12, right: w - 12, top: 74, bottom: h - 92 };
    }
    const leftPanel = dom.panelParts ? dom.panelParts.getBoundingClientRect() : null;
    const rightPanel = dom.panelInfo ? dom.panelInfo.getBoundingClientRect() : null;
    let left = leftPanel ? leftPanel.right + 16 : 30;
    let right = rightPanel ? rightPanel.left - 16 : w - 30;
    if (right - left < 340) {
      left = Math.min(left, w * 0.18);
      right = Math.max(right, w * 0.82);
    }
    return { left: left, right: right, top: 96, bottom: h - 108 };
  }

  function updateLabels() {
    if (!model || !state.ready) return;
    if (!dom.labelNodes) return;
    const w = window.innerWidth, h = window.innerHeight;
    const live = state.exploded && state.labelsOn && w > 680 && state.tab !== 'specs';
    const safe = getSafeArea();
    const entries = [];
    camera.getWorldDirection(camForward);

    model.parts.forEach(function (part) {
      const L = labelEls[part.id];
      if (!L) return;
      if (!live) {
        L.el.classList.remove('is-visible');
        L.g.classList.remove('is-visible');
        return;
      }
      part.anchor.getWorldPosition(tmpV);
      tmpV2.copy(tmpV).sub(camera.position);
      if (tmpV2.dot(camForward) <= 0.3) {
        L.el.classList.remove('is-visible');
        L.g.classList.remove('is-visible');
        return;
      }
      tmpV.project(camera);
      if (tmpV.z < -1 || tmpV.z > 1) {
        L.el.classList.remove('is-visible');
        L.g.classList.remove('is-visible');
        return;
      }
      const ax = (tmpV.x * 0.5 + 0.5) * w;
      const ay = (-tmpV.y * 0.5 + 0.5) * h;
      if (ax < -120 || ax > w + 120 || ay < -120 || ay > h + 120) {
        L.el.classList.remove('is-visible');
        L.g.classList.remove('is-visible');
        return;
      }
      if (!L.w) {
        L.w = L.el.offsetWidth || 120;
        L.h = L.el.offsetHeight || 34;
      }
      entries.push({ part: part, L: L, ax: ax, ay: ay });
    });

    entries.forEach(function (e) {
      const dir = e.part.meta.labelDir;
      e.cx = clamp(e.ax + dir[0], safe.left + e.L.w / 2, safe.right - e.L.w / 2);
      e.cy = clamp(e.ay + dir[1], safe.top + e.L.h / 2, safe.bottom - e.L.h / 2);
    });

    // simple collision resolution (top to bottom)
    const sorted = entries.slice().sort(function (a, b) { return a.cy - b.cy; });
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      for (let j = 0; j < i; j++) {
        const b = sorted[j];
        const overlapX = Math.abs(a.cx - b.cx) < (a.L.w + b.L.w) / 2 + 10;
        const overlapY = Math.abs(a.cy - b.cy) < (a.L.h + b.L.h) / 2 + 7;
        if (overlapX && overlapY) {
          a.cy = b.cy + (a.L.h + b.L.h) / 2 + 7;
          a.cy = Math.min(a.cy, safe.bottom - a.L.h / 2);
          a.cx = clamp(a.cx, safe.left + a.L.w / 2, safe.right - a.L.w / 2);
        }
      }
    }

    entries.forEach(function (e) {
      e.L.el.style.transform = 'translate3d(' + e.cx.toFixed(1) + 'px,' + e.cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
      e.L.el.classList.add('is-visible');
      e.L.el.classList.toggle('is-selected', state.selected === e.part.id);

      const edgeX = e.cx >= e.ax ? e.cx - e.L.w / 2 : e.cx + e.L.w / 2;
      const elbowX = e.ax + (edgeX - e.ax) * 0.45;
      e.L.path.setAttribute('d',
        'M ' + e.ax.toFixed(1) + ' ' + e.ay.toFixed(1) +
        ' L ' + elbowX.toFixed(1) + ' ' + e.ay.toFixed(1) +
        ' L ' + edgeX.toFixed(1) + ' ' + e.cy.toFixed(1));
      e.L.circle.setAttribute('cx', e.ax.toFixed(1));
      e.L.circle.setAttribute('cy', e.ay.toFixed(1));
      e.L.g.classList.add('is-visible');
      e.L.g.classList.toggle('is-selected-g', state.selected === e.part.id);
    });
  }

  /* ============================================================
     interaction: picking, hover, keyboard
     ============================================================ */
  function raycastPart(clientX, clientY) {
    if (!model) return null;
    const rect = dom.scene.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(model.pickables, false);
    if (hits.length) return hits[0].object.userData.partId || null;
    return null;
  }

  function hideHover() {
    if (state.hovered) state.hovered = null;
    if (dom.hoverTag) dom.hoverTag.classList.remove('is-visible');
    if (dom.scene) dom.scene.style.cursor = 'grab';
  }

  function showHover(id, x, y) {
    if (!id || !model || !model.byId[id]) { hideHover(); return; }
    state.hovered = id;
    const part = model.byId[id];
    dom.hoverIndex.textContent = part.index;
    dom.hoverName.textContent = part.meta.name;
    const w = window.innerWidth;
    const tagW = 230;
    let tx = x + 18, ty = y + 16;
    if (tx + tagW > w - 10) tx = x - tagW - 10;
    if (ty + 40 > window.innerHeight - 10) ty = y - 46;
    dom.hoverTag.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
    dom.hoverTag.classList.add('is-visible');
    if (dom.scene) dom.scene.style.cursor = 'pointer';
  }

  function updateHover(clientX, clientY) {
    if (!state.ready || state.dragging) return;
    const id = raycastPart(clientX, clientY);
    if (id) showHover(id, clientX, clientY);
    else hideHover();
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) {
      hideHover();
      return;
    }
    pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  function onPointerUp(e) {
    const down = pointerDown;
    pointerDown = null;
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    if (dx * dx + dy * dy > 36) return;
    if (performance.now() - down.t > 900) return;
    const id = raycastPart(e.clientX, e.clientY);
    if (id) {
      selectPart(id);
    } else {
      deselect();
      if (state.mobile) closeMobilePanels();
    }
    hideHover();
  }

  function onPointerMove(e) {
    pendingPointer = { x: e.clientX, y: e.clientY };
    if (state.dragging) { hideHover(); return; }
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(function () {
      hoverRaf = 0;
      if (pendingPointer) updateHover(pendingPointer.x, pendingPointer.y);
    });
  }

  function openGuide() {
    if (!dom.guideModal) return;
    dom.guideModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeGuide() {
    if (!dom.guideModal) return;
    dom.guideModal.hidden = true;
    document.body.style.overflow = '';
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        const r = req.call(el);
        if (r && r.catch) r.catch(function () {});
      }
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  }
  function openMobilePanel(which) {
    if (!state.mobile) return;
    hideToast();
    if (which === 'parts') {
      dom.panelParts.classList.add('is-open');
      dom.panelInfo.classList.remove('is-open');
    } else {
      dom.panelInfo.classList.add('is-open');
      dom.panelParts.classList.remove('is-open');
    }
  }
  function closeMobilePanels() {
    dom.panelParts.classList.remove('is-open');
    dom.panelInfo.classList.remove('is-open');
  }
  function anyMobilePanelOpen() {
    return state.mobile && (
      dom.panelParts.classList.contains('is-open') ||
      dom.panelInfo.classList.contains('is-open')
    );
  }

  function initUI() {
    buildPartList();
    buildLabels();
    updateSelectionUI();
    updateExplodeButton();
    updateStatusMeta();

    dom.tabs.forEach(function (btn) {
      btn.addEventListener('click', function () { setTab(btn.dataset.tab); });
    });

    dom.btnExplode.addEventListener('click', toggleExplode);
    dom.btnReset.addEventListener('click', function () {
      flyToPose(state.exploded ? getExplodedPose() : getDefaultPose(), 1.2);
      if (state.autoRotate) {
        state.autoRotate = false;
        controls.autoRotate = false;
        dom.btnAutoRotate.classList.remove('is-on');
        dom.btnAutoRotate.setAttribute('aria-pressed', 'false');
      }
      showToast('视角已复位', 1800);
    });
    dom.btnAutoRotate.addEventListener('click', function () {
      state.autoRotate = !state.autoRotate;
      controls.autoRotate = state.autoRotate;
      dom.btnAutoRotate.classList.toggle('is-on', state.autoRotate);
      dom.btnAutoRotate.setAttribute('aria-pressed', String(state.autoRotate));
      showToast(state.autoRotate ? '自动旋转已开启' : '自动旋转已关闭', 1600);
    });
    dom.btnLabels.addEventListener('click', function () {
      state.labelsOn = !state.labelsOn;
      dom.btnLabels.classList.toggle('is-on', state.labelsOn);
      dom.btnLabels.setAttribute('aria-pressed', String(state.labelsOn));
      if (!state.labelsOn) hideAllLabels();
      showToast(state.labelsOn ? '部件标注已开启' : '部件标注已关闭', 1600);
    });
    dom.btnFocusCam.addEventListener('click', function () {
      state.autoFocus = !state.autoFocus;
      dom.btnFocusCam.classList.toggle('is-on', state.autoFocus);
      dom.btnFocusCam.setAttribute('aria-pressed', String(state.autoFocus));
      showToast(state.autoFocus ? '自动视角已开启' : '自动视角已关闭', 1600);
    });

    dom.btnGuide.addEventListener('click', openGuide);
    dom.closeGuide.forEach(function (el) { el.addEventListener('click', closeGuide); });
    dom.btnFullscreen.addEventListener('click', toggleFullscreen);
    dom.btnMobileParts.addEventListener('click', function () {
      if (dom.panelParts.classList.contains('is-open')) closeMobilePanels();
      else openMobilePanel('parts');
    });
    dom.btnMobileInfo.addEventListener('click', function () {
      if (dom.panelInfo.classList.contains('is-open')) closeMobilePanels();
      else openMobilePanel('info');
    });
    dom.btnCloseInfo.addEventListener('click', function () {
      if (state.mobile) { closeMobilePanels(); return; }
      deselect();
    });
    dom.btnFocusSelected.addEventListener('click', function () {
      if (state.selected && model.byId[state.selected]) focusPart(model.byId[state.selected]);
      else showToast('请先选中一个部件', 1800);
    });

    dom.infoBody.addEventListener('click', function (e) {
      if (e.target.closest('[data-detail-close]')) deselect();
    });

    dom.scene.addEventListener('pointerdown', onPointerDown);
    dom.scene.addEventListener('pointerup', onPointerUp);
    dom.scene.addEventListener('pointermove', onPointerMove);
    dom.scene.addEventListener('pointerleave', function () { pointerDown = null; hideHover(); });
    dom.scene.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    window.addEventListener('keydown', function (e) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.code === 'Space') {
        if (tag === 'BUTTON') return;
        e.preventDefault();
        if (!dom.guideModal.hidden) return;
        toggleExplode();
      } else if (e.key === 'r' || e.key === 'R') {
        flyToPose(state.exploded ? getExplodedPose() : getDefaultPose(), 1.2);
      } else if (e.key === 'l' || e.key === 'L') {
        dom.btnLabels.click();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (!dom.guideModal.hidden) closeGuide();
        else if (state.selected) deselect();
        else if (state.mobile) closeMobilePanels();
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        if (!dom.guideModal.hidden) closeGuide(); else openGuide();
      }
    });

    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', function () {
      // no-op; button works as a toggle
    });
  }

  /* ============================================================
     resizing / adaptive quality
     ============================================================ */
  function onResize() {
    if (!renderer || !camera) return;
    const w = window.innerWidth, h = window.innerHeight;
    state.mobile = w <= MOBILE_BREAKPOINT;
    camera.aspect = w / h;
    camera.fov = state.mobile ? 48 : 38;
    camera.updateProjectionMatrix();
    if (controls) controls.maxDistance = state.mobile ? 46 : 30;
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
      if (bloomPass) bloomPass.setSize(w, h);
    }
    labelCacheW = 0;
    Object.keys(labelEls).forEach(function (k) { labelEls[k].w = 0; labelEls[k].h = 0; });
    if (dom.leaderSvg) {
      dom.leaderSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      dom.leaderSvg.setAttribute('width', w);
      dom.leaderSvg.setAttribute('height', h);
    }
    if (!state.mobile) closeMobilePanels();
  }

  function updateAdaptiveQuality(dt) {
    if (state.qualityDropped) return;
    const fps = dt > 0 ? 1 / dt : 60;
    state.fpsSamples.push(fps);
    if (state.fpsSamples.length > 90) state.fpsSamples.shift();
    if (state.fpsSamples.length === 90) {
      const avg = state.fpsSamples.reduce(function (a, b) { return a + b; }, 0) / state.fpsSamples.length;
      if (avg < 26 && (window.devicePixelRatio || 1) > 1.05) {
        state.qualityDropped = true;
        renderer.setPixelRatio(1);
        if (composer) composer.setPixelRatio(1);
        onResize();
        showToast('已自动优化渲染分辨率', 2200);
      }
    }
  }

  /* ============================================================
     toast / meter
     ============================================================ */
  function hideToast() {
    if (!dom.toast) return;
    clearTimeout(toastTimer);
    dom.toast.classList.remove('is-visible');
  }

  function showToast(text, duration) {
    if (!dom.toast) return;
    // On phones the drawers cover nearly the whole viewport; a toast on top of
    // an open drawer would only add visual noise. Panel content is the feedback.
    if (anyMobilePanelOpen()) return;
    clearTimeout(toastTimer);
    dom.toast.textContent = text;
    dom.toast.classList.add('is-visible');
    toastTimer = setTimeout(function () {
      dom.toast.classList.remove('is-visible');
    }, duration || 2600);
  }

  function updateMeter(now) {
    const target = state.exploded ? 1 : 0;
    const t = clamp((now - state.explodeStart) / 1150, 0, 1);
    const e = easeOutCubic(t);
    state.explodeVisual = state.explodeFrom + (target - state.explodeFrom) * e;
    const pct = Math.round(state.explodeVisual * 100);
    if (pct !== lastMeterPct) {
      lastMeterPct = pct;
      if (dom.explodePct) dom.explodePct.textContent = String(pct).padStart(2, '0') + '%';
      if (dom.explodeMeter) dom.explodeMeter.style.width = pct + '%';
    }
  }

  /* ============================================================
     main loop
     ============================================================ */
  function animate(now) {
    animFrame = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    elapsed += dt;

    updateCameraTween(now);

    if (state.intro) {
      // gentle drift during boot
      if (!bootHidden) {
        camera.position.x += Math.sin(now * 0.0002) * 0.001;
        camera.lookAt(0, 1.0, 0);
      }
    }

    controls.update();
    updatePartAnims(now);
    updateGlow(dt);
    updateLabels();
    updateMeter(now);

    // the car sits on the platform when assembled; the whole exploded
    // assembly lifts off the platform to make room for the lower layers.
    if (model) {
      const lift = state.explodeVisual * (model.explodedLift || 0);
      const bob = model.grounded ? 0 : Math.sin(elapsed * 0.85) * 0.045;
      model.root.position.y = model.deviceY + lift + bob;
      model.root.rotation.y = 0;
    }

    // stage motion
    if (stage.hud) {
      stage.hud.rotation.y += dt * 0.03;
      stage.hud.position.y = 1.15 + Math.sin(elapsed * 0.5) * 0.025;
    }
    if (stage.floorRings) {
      stage.floorRings.rotation.y += dt * 0.01;
    }
    if (stage.dust) {
      stage.dust.rotation.y += dt * 0.004;
      stage.dust.rotation.x = Math.sin(elapsed * 0.05) * 0.02;
    }
    if (stage.dustBig) stage.dustBig.rotation.y -= dt * 0.003;
    if (stage.gridMat) stage.gridMat.uniforms.uTime.value = elapsed;
    if (stage.shadow) {
      stage.shadow.material.opacity = 0.5 * (1 - state.explodeVisual * 0.55);
      stage.shadow.scale.set(1.08 * (1 + state.explodeVisual * 0.35), 0.46 * (1 + state.explodeVisual * 0.35), 1);
    }
    if (stage.backA) stage.backA.material.opacity = 0.2 + Math.sin(elapsed * 0.5) * 0.03;
    if (stage.backB) stage.backB.material.opacity = 0.13 + Math.sin(elapsed * 0.4 + 1.7) * 0.02;

    updateAdaptiveQuality(dt);

    composer.render();
    if (state.ready && !bootHidden) hideBoot();
    if (state.ready) updateHoverCursor();
  }

  function updateHoverCursor() {
    if (!dom.scene) return;
    if (state.dragging) return;
    if (!dom.hoverTag.classList.contains('is-visible') && dom.scene.style.cursor !== 'grab') {
      dom.scene.style.cursor = 'grab';
    }
  }

  /* ============================================================
     init
     ============================================================ */
  function initComposer() {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.24, 0.5, 0.9
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
  }

  function init() {
    cacheDom();
    boot(10, '初始化渲染管线…');
    initRenderer();
    initScene();
    boot(24, '生成环境光照与后处理…');
    initEnvironment();
    initLights();
    boot(38, '构建车漆与碳纤维材质…');
    initModel();
    initStage();
    boot(64, '装配 18 个可拆解部件…');
    initControls();
    initComposer();
    boot(82, '连接交互与标注系统…');
    initUI();
    onResize();
    setTab('detail', true);
    renderOverview();
    boot(94);
    updateStatusMeta();
    state.ready = true;
    renderOverview();
    // first frame
    composer.render();
    boot(100, '系统就绪');
    hideBoot();
    animate(performance.now());

    // expose a small debug / automation API
    window.SU7_APP = {
      state: state,
      selectPart: selectPart,
      deselect: deselect,
      setExploded: setExploded,
      toggleExplode: toggleExplode,
      focusPart: focusPart,
      flyToPose: flyToPose,
      getModel: function () { return model; },
      getCamera: function () { return camera; },
      getControls: function () { return controls; },
      getRenderer: function () { return renderer; }
    };
  }

  function start() {
    cacheDom();
    window.setTimeout(function () {
      try {
        init();
      } catch (err) {
        console.error(err);
        showFallback(err && err.message ? err.message : '未知错误');
      }
    }, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
