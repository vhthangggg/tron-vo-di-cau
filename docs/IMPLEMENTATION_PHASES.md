# Six-system integration — work in progress

Branch: feat/realistic-fishing-systems. Main and production must remain unchanged until reviewed.

## Foundation delivered
Pure modules: inventory bag limits, economy replay-safe transactions, bait lifecycle, catch storage limits, tutorial event progress. Unit tests are in tests/systems.test.mjs.

## Not integrated yet
These modules do NOT change the running game until src/save.js, src/engine.js, src/app.js and src/ui.js are adapted. Do not advertise these systems as playable.

## Safe integration order
1. Add versioned, lossless migration from v1 player saves. Preserve original localStorage key until migrated save has been verified; back up raw payload.
2. Introduce inventory as an additive projection of legacy rods, accessories, baits. Reconcile old fields during transition and avoid double ownership.
3. Wire bag UI, stock transfers, store purchases and worm gathering through a single transaction path.
4. Introduce mounted bait state, only consuming on loss/eating/replacement. Update old tests that assert per-cast consumption.
5. Introduce technique-aware rig setup and buoyancy calibration. Do not change lure or bottom rigs to require floats.
6. Convert catch dialog to release/keep only; move sale/gift/cook to home. Preserve existing pending catches.
7. Add tutorial event adapter, mobile UI, browser regression and save fixtures.
8. Run npm test, browser suites and production smoke on preview before PR merge.

## Non-regression invariants
Preserve two-hand pointers, map videos, cast target geometry, float perspective, fish movement, line tension, screen orientation, current audio and local saves.
