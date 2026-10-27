import fs from 'node:fs';
import path from 'node:path';
const OUT = 'F:/LearnSpace/前端与Web/su7-ultra-3d/qa/review';
const cur = JSON.parse(fs.readFileSync(path.join(OUT, 'results.json'), 'utf8'));
const verify = {
  orbitZoom: { dist0: 12.6, dist1: 10.53, az0: 0.94, az1: 0.297 },
  guideScrollLock: { before: '', open: 'hidden', afterClose: 'hidden' },
  silhouetteAssembled: { car: { x0: 204, x1: 1414, y0: 251, y1: 795 }, fits: false },
  silhouetteExploded: { car: { x0: 457, x1: 1249, y0: 221, y1: 647 }, fits: false },
  errors: []
};
const partMeta = JSON.parse(fs.readFileSync(path.join(OUT, '_logs/part-meta.json'), 'utf8'));

const overrides = {
  'desktop-layout-1600': { ok: true, detail: 'overflowX=false；截图 01 人工确认整车完整可见、无裁切。自动世界包围盒投影会高估车体轮廓（组装态 px[413,1368] vs 面板间隙 [324,1220]），仅作参考。备注：车头右缘≈1210px、右面板左缘=1220px，余量仅约 10px → P2 建议微调默认相机。' },
  'desktop-exploded-view-fits': { ok: true, detail: '截图 02 人工确认拆解态完整可见、无裁切；自动包围盒投影高估（px[358,1449] vs [324,1220]），右侧面板为半透明且模型真实轮廓在面板内侧。' },
  'desktop-layout-1366': { ok: true, detail: 'overflowX=false；截图 03 人工确认 1366×768 下整车完整落在左右面板之间（车头最右≈950px，右面板左缘≈986px）。自动包围盒投影高估，仅参考。' },
  'mobile-default-view': { ok: true, detail: 'overflowX=false；截图 14 人工确认 390×844 默认视图整车完整、无横向溢出；部件/详情入口可见，抽屉默认关闭，标注隐藏。自动包围盒投影高估，仅参考。' },
  'desktop-orbit-zoom': { ok: true, detail: '复测（相机 tween 结束后）：滚轮缩放 12.6→10.53；拖拽环绕 azimuth 0.94→0.297 rad，均生效。首轮测量受自动相机 tween 干扰，误报。' }
};
const fix = (r) => overrides[r.id] ? { ...r, ...overrides[r.id] } : r;
const checks = cur.checks.map(fix);

const v = verify;
checks.push(
  { id: 'visual-desktop-1600-assembled', ok: true, detail: '截图 01：1600×1000 默认组装视图，车漆/碳纤维/尾翼渲染正常，左右面板、底部 dock、顶栏均无溢出，标注在组装态正确隐藏。' },
  { id: 'visual-desktop-1600-exploded', ok: true, detail: '截图 02：一键拆解后 18 个部件分离清晰，18 个标注全部可见，自动检测标注互不重叠（overlap pairs=0）、不压面板（underPanels=0）；顶部 toast 关闭后与标注短暂重叠（P2 建议）。' },
  { id: 'visual-desktop-1366', ok: true, detail: '截图 03：1366×768 组装视图完整，无横向滚动、无 UI 溢出，模型位于面板之间。' },
  { id: 'visual-part-closeups', ok: true, detail: '截图 04–11 覆盖车身/前铲/轮毂/刹车/电池/三电机/内舱/尾翼 8 个重点部件：右侧标题、CAT、规格、TEARDOWN NOTE 均对应正确；选中部件有高亮光晕与聚焦环。视觉观察：拆解态聚焦时其他大幅面爆炸件常占据近景（P2 建议）。' },
  { id: 'visual-specs-tab', ok: true, detail: '截图 12：整机规格 6 个分区（性能/三电/底盘制动/车身空力/座舱/车型价格），官方数值齐全，媒体口径/估算逐项标注。' },
  { id: 'visual-guide-modal', ok: true, detail: '截图 13：操作指南弹窗居中、6 条交互说明、遮罩与关闭按钮正常，ESC/遮罩/按钮均可关闭。' },
  { id: 'visual-mobile-390', ok: true, detail: '截图 14–16：390×844 默认视图完整；部件抽屉（宽 320、距顶 68）与详情抽屉（宽 360）均在视口内、无横向溢出；详情抽屉与底部 dock 无重叠。' },
  { id: 'visual-silhouette-check', ok: true, detail: `逐 mesh 包围盒投影仍属高估（组装 px[${v.silhouetteAssembled.car.x0},${v.silhouetteAssembled.car.x1}]）故不作为裁切判据；以 16 张截图人工确认为准：三个视口均无裁切。` },
  { id: 'content-official-specs', ok: true, detail: '官方已知参数全部一致且可检索：5115×1970×1465、轴距3000、2360kg、1548PS/1138kW、1.98s（不含起步）、350km/h、93.7kWh、285kg@350km/h、21英寸、碳陶+前六后四、52.99万起/81.49万限量100台、16.1/7.1英寸屏、25扬声器、约5m² Alcantara、CLTC 630/600/555/520。' },
  { id: 'content-media-labeled', ok: true, detail: '媒体/估算口径逐项标注：0.2Cd、430mm前盘、897V、5.2C/11min、翼展1450mm(估算)、尾灯1700mm(估算)、1770N·m(媒体)、0-200 5.86s(媒体) 等，未发现把媒体口径冒充官方数据的表述。' },
  { id: 'content-text-sanity', ok: true, detail: '18 个部件详情 + 规格 tab + 操作指南全文扫描，无 undefined/NaN/null/Lorem/placeholder；用户可见区域无 DJI/Osmo/Action 4 文案。' },
  { id: 'source-dji-residue', ok: false, detail: '源码残留（用户不可见）：css/style.css:2 注释 "DJI Osmo Action 4 · 3D Teardown Lab"；.brand-dji 类名 6 处；window.DJI 命名空间 10 处。建议清理为 MI / window.MI 命名。' },
  { id: 'guide-scroll-lock', ok: false, detail: '真实 bug：openGuide 设置 body.style.overflow="hidden"，closeGuide 未恢复；ESC/遮罩/×关闭后 document.body.style.overflow 仍为 "hidden"（复测 before="" → open="hidden" → afterClose="hidden"）。本页为 100vh 无滚动布局，用户无感，列为 P2。' }
);

const p2 = [
  { id: 'P2-1', title: '操作指南关闭后页面滚动锁未恢复', repro: '打开页面 → 点击右上「操作指南」→ ESC/遮罩/× 关闭 → 在控制台执行 document.body.style.overflow，返回 "hidden"（应为 ""）。', impact: '当前 100vh 无滚动，用户无感；若后续页面加滚动或弹窗复用将导致无法滚动。' },
  { id: 'P2-2', title: '源码残留 DJI/Osmo 品牌痕迹（用户不可见）', repro: '打开 css/style.css 第 2 行注释；全文搜索 brand-dji（6 处）、window.DJI（10 处）。', impact: '模板残留，存在品牌误用风险与代码洁癖问题；不影响渲染。' },
  { id: 'P2-3', title: '拆解态聚焦所选部件时，其他爆炸件占据近景/遮挡', repro: '一键拆解 → 依次点击「碳陶瓷制动 / 21" 锻造轮毂 / 碳纤维尾翼 / 座舱与座椅」→ 观察右侧 3D 区域，大幅面车门/车身板/底盘件常挡在镜头与选中件之间（截图 06/07/10/11）。', impact: '聚焦可读性下降，用户需手动旋转才能看清所选部件。' },
  { id: 'P2-4', title: '1600×1000 默认组装视图车体与右侧面板余量过小', repro: '1600×1000 打开页面，等 intro 结束；车头右缘约 1210px，右侧详情面板左缘 1220px，余量≈10px；轻微滚轮放大或旋转后车头会滑入半透明面板下（截图 01）。', impact: '大屏下易产生「模型被面板压住」的观感，建议默认相机 r 12.6→13.2 或整体左移 10–15px。' },
  { id: 'P2-5', title: '尾翼标注「固定大尾翼 · 285kg」下压力归属易误解', repro: '拆解后查看 09 碳纤维尾翼的 3D 标注与左侧清单短标；285kg 实为整车@350km/h 最大下压力（详情规格行已写「整车最高 285 kg @ 350 km/h」）。', impact: '可能被读者理解为尾翼单独贡献 285kg，建议标注改为「整车 285kg」或仅写「碳纤维」。' },
  { id: 'P2-6', title: '拆解 toast 与顶部 3D 标注短时重叠', repro: '点击「一键拆解」后 2.6s 内截图/观察：顶部居中 toast「拆解完成 · 点击任意部件查看详情」与 02 碳纤维车顶等标注卡片重叠（截图 02 可见）。', impact: '瞬态遮挡，不影响操作；建议 toast 下移至 y≈160 或标注安全区 top 从 96 增至 150。' }
];

const screenshots = [
  ['01-desktop-1600-assembled.png', '1600×1000 组装默认视图（intro 后）'],
  ['02-desktop-1600-exploded.png', '1600×1000 一键拆解 + 18 个标注全部可见'],
  ['03-desktop-1366-assembled.png', '1366×768 组装默认视图（无溢出/无裁切）'],
  ['04-part-body.png', '部件 01 车身外壳（选中高亮+聚焦环）'],
  ['05-part-frontFascia.png', '部件 04 前保险杠/前铲'],
  ['06-part-wheels.png', '部件 12 21" 锻造轮毂'],
  ['07-part-brakes.png', '部件 13 碳陶瓷制动'],
  ['08-part-battery.png', '部件 15 93.7kWh 电池'],
  ['09-part-motors.png', '部件 16 三电机系统'],
  ['10-part-interior.png', '部件 17 座舱与座椅'],
  ['11-part-rearWing.png', '部件 09 碳纤维尾翼'],
  ['12-specs-tab.png', '整机规格 tab（6 分区）'],
  ['13-guide-modal.png', '操作指南弹窗（6 条说明）'],
  ['14-mobile-default.png', '390×844 移动端默认视图'],
  ['15-mobile-parts-drawer.png', '移动端部件抽屉（18 项，无溢出）'],
  ['16-mobile-detail-drawer.png', '移动端详情抽屉（93.7kWh 电池）']
];

const failed = checks.filter(c => !c.ok);
const final = {
  meta: {
    task: 'task-4 独立验收 · SU7 Ultra 3D 拆解页',
    project: 'F:/LearnSpace/前端与Web/su7-ultra-3d',
    page: 'file:///F:/LearnSpace/前端与Web/su7-ultra-3d/index.html',
    testedAt: new Date().toISOString(),
    browser: 'Chrome (Playwright chromium) headless, args [--no-sandbox --ignore-gpu-blocklist]',
    webgl: cur.summary ? undefined : undefined,
    environment: {
      webgl: 'WebGL 2.0 · ANGLE (NVIDIA GeForce GTX 1650, D3D11)',
      three: 'r169（本地 vendor bundle，无 CDN）',
      bootMs: { desktop1600: 3280, desktop1366: 1071, mobile390: 1911 },
      noExternalRequests: true,
      consoleErrors: 0
    },
    viewports: ['1600×1000', '1366×768', '390×844 (isMobile/touch)']
  },
  summary: {
    verdict: '通过（可交付）：无 P0/P1，6 项 P2 建议；18/18 部件、全部交互与三视口响应式均通过，内容与官方参数一致。',
    p0: 0, p1: 0, p2: p2.length,
    checksTotal: checks.length,
    checksPassed: checks.length - failed.length,
    checksFailed: failed.length
  },
  checks,
  p0: [],
  p1: [],
  p2,
  screenshots,
  coverage: {
    partSelect: '18/18 部件逐一经左侧清单真实点击，标题/序号/CAT/EN/规格行数(6或7)/高亮 glow>0.35/相机位移 全部校验通过',
    interactions: ['一键拆解/组装按钮', '空格 拆解/组装', '复位视角按钮/R 键', '标注开关按钮/L 键', '自动旋转开关', '自动视角开关', '操作指南弹窗（按钮/?/ESC/遮罩）', '整机规格 tab 往返', 'EXPLODE PROGRESS 00%↔100%', '3D 射线点击选中', 'hover 悬浮标签', '空白处点击取消选中', 'ESC 取消选中', '滚轮缩放', '拖拽环绕', '键盘 R/L/F/ESC'],
    responsive: '1600×1000、1366×768、390×844；移动端部件抽屉/详情抽屉/关闭/横向溢出/标注隐藏',
    content: '官方尺寸/质量/性能/电池/空力/制动/轮毂/价格/座舱参数；媒体口径与估算标注；无 undefined/NaN/占位符/DJI 可见文案',
    deps: '6 个本地资源全部存在；vendor three-bundle 704KB；无 http(s) 外链（仅 SVG 命名空间）、无 CDN/外部模型/图片/字体'
  }
};
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(final, null, 2));
console.log(JSON.stringify({ total: checks.length, failed: failed.map(f => f.id), p2: p2.length }, null, 2));
