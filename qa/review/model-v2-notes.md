# Model v2 — procedural body revision

This note records the second procedural pass on the SU7 Ultra model. The original independent QA audit (`review-report.md`) and evidence in this folder refer to the first shipped build; the interaction contract is unchanged.

## What changed

- **Body plan / ends** — 20+ cross-sections; wider, more vertical front and rear sections; double-sided end caps close the body; no giant rectangular closure panels.
- **Wheel arches** — paint material now discards fragments inside the four wheel-arch circles, so the body has real openings instead of “wheels bolted outside” or oversized fender rings. Dark wheel-well discs sit behind the tires; a thin black arch lip frames each opening.
- **Front fascia** — body-colour nose retained; slim LED headlights enlarged and set into the face; wide lower intake with vertical slats, centre body-colour blade, side intakes, carbon splitter/canards, front plate and badge.
- **Rear fascia** — body-colour tail; compact black lower bumper and carbon diffuser; slim taillight housing, XIAOMI wordmark, Ultra badge, plate, reflectors and ducktail lip.
- **Livery / trim** — grey racing stripes over the yellow hood and carbon roof; dark 21″ U-spoke rims with gold ring; dark glazing with tapered A/C-pillar window shapes; shoulder crease, door shut lines, fender vent and Ultra side script.
- **Interior focus** — cockpit selection becomes an isolated cut-away (other parts temporarily hidden, restored on deselect), so the seats/dashboard are not buried under the body.

## Automated smoke check (after revision)

- 18/18 parts selectable, no exceptions.
- 0 console errors / page errors during final capture.
- `body.style.overflow` restored after guide.
- 0 visible labels on the specs tab; no `undefined` / `NaN` text.
- 390 px viewport: no horizontal overflow, single-row dock.
- Interior cut-away hides/restores parts correctly.

## Honest limitation

This is still a **procedural, stylised low-poly reconstruction**. It uses official dimensions and photo references, but it is not an official CAD/surface model. Curvature, lamp internals, bumper transitions and greenhouse surfacing remain approximations. A 1:1 match would require an authorised GLB/STEP/CAD asset; the GitHub SU7 Ultra assets found during research have no reusable license, so they were not imported.
