# SU7 Ultra 3D 拆解页 · 独立验收报告

- 任务：task-4（独立 QA 验收，只读产品文件）
- 测试对象：`F:\LearnSpace\前端与Web\su7-ultra-3d\index.html`（`file://` 直接打开）
- 测试时间：2026-10-27 · 真实 Chrome（Playwright headless）· 环境：Win + NVIDIA GTX 1650 / ANGLE D3D11 / WebGL 2.0 / three r169（本地 vendor）
- 视口：**1600×1000**、**1366×768**、**390×844**（isMobile + touch）
- 证据：`qa/review/*.png` 16 张；逐项结果：`qa/review/results.json`；脚本：`run-qa.mjs`、`verify-interactions.mjs`

## 结论

**通过，可以交付。P0 = 0，P1 = 0，P2 = 6（均为建议/低危，不阻塞）。**

- 加载：桌面 1600 首帧就绪约 **3.3s**（1366 约 1.1s、移动端约 1.9s），无卡死；WebGL2 正常（硬件 ANGLE，非 SwiftShader）；**console error / pageerror / requestfailed = 0**；**无任何外部请求**（6 个请求全部 `file://`，无 CDN/外部模型/图片/字体）。
- 18 个部件：逐一从左侧清单真实点击，**18/18 全部通过**——右侧标题、序号、CAT/EN、规格行数（6 或 7 行）、清单高亮、选中光晕（glow≈1）、相机飞行位移全部正确，无异常与坏文案。
- 交互：一键拆解/组装、空格、复位（按钮+R）、标注开关（按钮+L）、自动旋转、自动视角、操作指南（按钮/`?`/ESC/遮罩）、整机规格 tab、EXPLODE PROGRESS（00%↔100%）、3D 射线点击选中、hover 悬浮标签、空白点击取消选中、ESC 取消选中、滚轮缩放、拖拽环绕、F 全屏 —— 全部可用。
- 移动端 390×844：默认视图完整、无横向溢出；部件抽屉与详情抽屉开合正常、选中部件自动出详情、底部 dock 不被遮挡；标注按设计隐藏（`<680px` 不渲染）。
- 内容：官方已知参数全部一致（见下），**媒体口径/估算逐项标注**，无 `undefined / NaN / null / 占位符`，用户可见区域无 DJI/Osmo/Action 4 残留。
- 视觉：三个视口均无模型裁切；标注 18/18 可见且**互不重叠（自动检测 overlap=0）、不压面板**；UI 无溢出。

## P0（阻塞）

无。

## P1（严重）

无。

## P2（建议 / 低危，附复现步骤）

| # | 问题 | 复现步骤 | 影响/建议 |
|---|------|----------|-----------|
| P2-1 | 操作指南关闭后 `body.style.overflow` 仍为 `hidden`（滚动锁未恢复） | 打开页面 → 右上「操作指南」→ ESC（或遮罩/×）关闭 → 控制台执行 `document.body.style.overflow`，返回 `"hidden"`（应为 `""`）。复测：`"" → "hidden" → "hidden"` | 当前页面 100vh 无滚动，用户无感；复用到可滚动页面会无法滚动。`closeGuide()` 增加 `document.body.style.overflow=''` |
| P2-2 | 源码残留 DJI/Osmo 品牌痕迹（用户不可见） | `css/style.css` 第 2 行注释 `DJI Osmo Action 4 · 3D Teardown Lab`；全局搜索 `brand-dji`（6 处）、`window.DJI`（10 处） | 模板残留、品牌误用风险。建议改 `MI`/`window.MI`/`.brand-mi` |
| P2-3 | 拆解态「自动视角」聚焦时，其他爆炸件占据近景/遮挡所选部件 | 一键拆解 → 依次点「碳陶瓷制动」「21" 锻造轮毂」「碳纤维尾翼」「座舱与座椅」→ 镜头与选中件之间常被大幅面车门/车身板挡住（截图 06/07/10/11） | 聚焦可读性下降。建议聚焦时对非选中部件降低不透明度/收拢，或加大聚焦距离 |
| P2-4 | 1600×1000 组装默认视图车体距右侧面板余量过小 | 1600×1000 打开页面等 intro 结束：车头右缘≈1210px，右侧面板左缘=1220px，余量≈10px；轻微放大/旋转后车头滑入半透明面板下（截图 01） | 易有「模型被面板压住」观感。建议默认相机 `r: 12.6 → 13.2` 或整体左移 10–15px |
| P2-5 | 尾翼标注「固定大尾翼 · 285kg」下压力归属易误读 | 拆解后看 09 碳纤维尾翼的 3D 标注/清单短标；285kg 实为整车 @350km/h 最大下压力（详情规格行已正确写「整车最高 285 kg @ 350 km/h」） | 建议标注改为「整车 285kg」或去掉数字 |
| P2-6 | 拆解 toast 与顶部 3D 标注短时重叠 | 点「一键拆解」后 2.6s 内观察：顶部 toast「拆解完成…」与「02 碳纤维车顶」等标注卡重叠（截图 02 可见） | 瞬态遮挡、不影响操作。建议 toast 下移或标注安全区 top 96→150 |

## 内容一致性核对（官方参数）

全部一致，且检索到：**5115×1970×1465 mm、轴距 3000 mm、2360 kg、1548 PS / 1138 kW、1.98 s（不含起步）、350 km/h、93.7 kWh、285 kg @350km/h、21 英寸锻造、碳陶盘 + 前六后四活塞、52.99 万起 / 81.49 万限量 100 台、16.1″ 中控 + 7.1″ 仪表、25 扬声器、约 5 m² Alcantara、CLTC 630/600/555/520、纽北量产 7:04.957 / 原型车 6:46.874**。
媒体/估算均有标注：0.2 Cd、430 mm 前盘、897 V、5.2C/约 11 min、翼展 1450 mm（估算）、尾灯 1700 mm（估算）、1770 N·m（媒体）、0–200 5.86 s（媒体）。未发现明显不准确/自造官方口径。

## 截图索引（`qa/review/`）

| 文件 | 内容 |
|------|------|
| 01-desktop-1600-assembled.png | 1600×1000 组装默认视图 |
| 02-desktop-1600-exploded.png | 1600×1000 一键拆解（18 标注全可见） |
| 03-desktop-1366-assembled.png | 1366×768 组装视图 |
| 04-part-body.png | 01 车身外壳 |
| 05-part-frontFascia.png | 04 前保险杠/前铲 |
| 06-part-wheels.png | 12 21" 锻造轮毂 |
| 07-part-brakes.png | 13 碳陶瓷制动 |
| 08-part-battery.png | 15 93.7kWh 电池 |
| 09-part-motors.png | 16 三电机系统 |
| 10-part-interior.png | 17 座舱与座椅 |
| 11-part-rearWing.png | 09 碳纤维尾翼 |
| 12-specs-tab.png | 整机规格 tab（6 分区） |
| 13-guide-modal.png | 操作指南弹窗 |
| 14-mobile-default.png | 390×844 默认视图 |
| 15-mobile-parts-drawer.png | 移动端部件抽屉 |
| 16-mobile-detail-drawer.png | 移动端详情抽屉（电池） |

## 测试说明 / 已知测试假阳性

- 自动「包围盒投影是否落在面板之间」指标会高估模型轮廓（世界 AABB 角点透视投影），首轮 4 条 `desktop-layout-1600 / exploded-view-fits / layout-1366 / mobile-default-view` 因此 `ok=false`；经 16 张截图人工复核**三个视口均无裁切**，results.json 已改为视觉确认通过并保留测量值说明。
- 首轮 `desktop-orbit-zoom` 因自动相机 tween 未结束误报；隔离复测：滚轮 12.6→10.53、拖拽 azimuth 0.94→0.297 rad，均正常。
- 视觉观察（非缺陷）：门板/前铲等大平板近景略显「低模」；门板在爆炸态呈大面积纯色平板，属程序化低模表现力，可作为后续打磨项。

## 交付清单

- `qa/review/results.json` — 72 项检查（ok/detail）+ P2 清单 + 截图索引 + 覆盖度
- `qa/review/review-report.md` — 本报告
- `qa/review/01…16-*.png` — 16 张证据截图
- 复跑脚本：`qa/review/run-qa.mjs`、`qa/review/verify-interactions.mjs`、`qa/review/build-results.mjs`（node 路径见任务说明）
