# Post-QA fixes & re-verification

The independent QA run in this folder (`review-report.md`) recorded **P0 = 0, P1 = 0, P2 = 6**. The following low-risk items were addressed after that report, followed by a fresh automated smoke test and a new screenshot pass.

| QA item | Status | Change |
|---|---|---|
| P2-1 操作指南关闭后 `body.style.overflow` 未恢复 | Fixed | `closeGuide()` now restores `document.body.style.overflow = ''`. |
| P2-2 源码残留 DJI/Osmo 品牌命名 | Fixed | Removed `window.DJI` namespace / `DJI_APP` compatibility alias / `.brand-dji` class and DJI source comments. Runtime debug API is now `window.SU7_APP`; QA scripts were updated accordingly. |
| P2-3 拆解聚焦时其他部件遮挡 | Improved (not fully removed) | Cockpit selection now enters a small cut-away (roof/glass/doors hidden until deselect); selected-part extra offset reduced so focus cameras stay outside the part cloud. Large door/body slabs can still appear behind some focus views (程序化低模表现力限制). |
| P2-4 1600 默认视图车头贴右面板 | Fixed | Desktop default camera radius increased `12.6 → 13.2`. |
| P2-5 尾翼「285kg」归属易误读 | Fixed | Wing label is now `固定大尾翼 · 碳纤维`; tag/note explicitly state 285 kg is the whole-car aero figure at 350 km/h. |
| P2-6 拆解 toast 与顶部标注重叠 | Fixed | Toast moved from top HUD to above the bottom dock (desktop and mobile breakpoints). |

Additional polish:

- Specs tab now suppresses the 3D labels so the right panel and stage stay readable.
- Mobile ≤680 px dock reduced to two primary actions (一键拆解 / 复位视角) with no overflow; toggles stay available on wider screens.
- Cockpit no longer uses the emissive selection tint (keeps Alcantara/carbon/screens legible); focus view hides roof/glass/doors as a cut-away.
- Final product screenshots re-captured in `../../screenshots/`.

## Re-verification (automated, after fixes)

- `file://` load: 18 parts, `window.SU7_APP` ready, **0 console errors / pageerrors**.
- 18/18 `selectPart` calls: no exceptions.
- Interior cut-away hides and restores `carbonRoof / glassCanopy / leftDoors / rightDoors` correctly.
- Guide open/close: `body.style.overflow` returns to `""`.
- Specs tab: visible 3D label count = 0.
- No `undefined` / `NaN` rendered text.
- Mobile 390×844: dock bounds `left 8 → right 382` (no horizontal overflow), `.dock-toggles` hidden as designed.
- Final screenshots: `screenshots/01…19-*.png`; 0 console errors during capture.

*Fix note prepared by the project lead; the original independent QA report is preserved above as the audit trail.*
