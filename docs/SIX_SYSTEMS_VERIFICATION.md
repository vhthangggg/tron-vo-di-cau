# Six-system acceptance — 2026-10-08

This report covers the runtime integration in PR #4, rather than the earlier
isolated foundation. The final PR commit is the version to review. Main and
production remain unchanged.

## Automated acceptance

`npm test` passes **138/138** tests. Focused suites cover migration/storage,
atomic transactions, inventory conservation, physical rigs, bait lifecycle,
catch capacity, tutorial outcome validation and integrated recovery. Existing
natural-catch, all-50-species, controls, scene geometry and expansion tests pass.

| Gate | Assertions |
| --- | --- |
| Old and malformed saves | Preserve money, all owned items and stock, journal, pending/kept catches and prior rewards. Back up migration input, protect corrupt/future saves and handle unavailable storage. |
| Inventory | Purchases stay home until packed/equipped. Overflow and invalid bank actions leave assets intact. Changing bags cannot silently delete excess. Transfers and stale duplicate actions conserve exact ownership and quantities. |
| Shop | Finite numeric stats and current-item comparison for rods, bait, every accessory slot and bags. Mainline diameter/strength, hook windows, float capacity/stability, reel speed/power and net threshold match shared catalog ratings. |
| Bait | Casting/retrieving/reloading preserves an intact mount. Actual bite, loss and replacement debit exactly one natural portion from carried stock. No compatible fish does not expire the cast or repeatedly debit bait. Free gathering recovers zero-money/zero-stock players. |
| Rig | Float choice, hook/bait mass, lead, current and bottom contact change computed marks/sensitivity. Presets restore atomically or reject without partial swaps. Lure/bottom rigs remain playable without floats. |
| Tutorial | Invalid clicks/payloads do not complete lessons. A full real-game round completes ten results; the total 3,020 xu is claimable once and survives reload. Existing quiz rewards remain protected. |
| Catch | Count and kilogram limits are enforced; full storage preserves the pending fish. Kept fish survive bank setup/reload and reach home. Sale, gift and cooking each remove the fish once; stale actions cannot issue another reward. |
| Recovery | Zero stock, full containers, wrong calibration, incompatible/stored gear, failed presets, deadline, snag loss and reload all have a usable path forward without losing unrelated assets. |

## Browser gates — all six suites pass (73 grouped checks)

The suites run the rendered production UI on local HTTP, including a repository
subpath. Chromium **155.0.8059.39** decodes the real Ao Làng H.264 videos; these
are not a stubbed video element or replacement image. Natural-catch checks use
the real fish simulation and held mouse/keyboard or CDP simultaneous touch.
Some system/expansion scenarios supply initial currency, legacy progress or
resumed catches through saved-state fixtures; all tested actions use the UI.

| Command | Scope |
| --- | --- |
| `npm run test:browser` | Seven screens, natural catch/reload/home sale, quiz reward, shop, free bait, calibration, keyboard, touch sizes, pause, zoom and reduced motion; 19 grouped checks. |
| `npm run test:browser:expansion` | Legacy migration, purchases, all ten maps, decoded backgrounds/videos, bottom/lure rigs, reusable bait and 50-species journal; eight grouped checks. |
| `npm run test:browser:two-hands` | Mouse/keyboard and independent simultaneous fingers; analog force, both release orders, capture loss, pause, real landing, home sale, snag recovery and orientation; 19 grouped checks. |
| `npm run test:browser:spots` | Both Ao Làng banks at desktop, landscape and portrait; decoded video, cast flight, water coordinates, perspective and natural two-touch catch; nine grouped checks. |
| `npm run test:browser:experience` | Arrival/loading/error/retry, audio persistence, compact phase controls, full keepnet recovery and home handling; four grouped checks. |
| `npm run test:browser:systems` | Fourteen desktop/mobile groups for migration, bag limits, numeric comparisons, mounted bait, float tuning/presets, tutorial and replay-safe home fish outcomes. |

Viewport checks include 1440×980, 1280×720, 768×1024, 375×812, 390×844,
844×390 and 640×360. Independent review also verifies bank setup on 375×812,
1440×980 and 640×360, all shop categories and accessible home fish controls.
Final successful suites report no application exceptions, failed asset requests
or horizontal overflow. Screenshots and JSON reports are generated in the
ignored `test-results/` directory.

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run test:browser:expansion
npm run test:browser:two-hands
npm run test:browser:spots
npm run test:browser:experience
npm run test:browser:systems
npm run build
git diff --check
```

If Chromium is already installed, set `CHROMIUM_EXECUTABLE` and optionally
`CHROMIUM_ARGS` (a JSON array). The review environment used the official Chrome
headless shell with `--no-sandbox`, `--disable-dev-shm-usage`, `--no-zygote`.
Physical Android/iOS performance and native orientation-lock support have not
been measured. These results demonstrate browser behavior and emulated touch.

## Build and deployment boundary

`npm run build` packages all runtime modules and existing assets, including both
MP4 files. GitHub's existing `Check game` workflow runs Node tests and the static
build. Vercel's build command also requires both before packaging.

The packaged `dist/` build also passes the six-check smoke script at 390×844
on local HTTP: decoded scene, natural bite, simultaneous touches, pause,
saved bait after reload and clean viewport/requests. This validates the build
output; it is not an external deployment test.

The Vercel connector cannot inspect this project's team: the deployment-list
request returned HTTP 403, and a Vercel CLI is not installed in the review
environment. A successful local run is not evidence of a successful live
deployment. GitHub CI and the Git integration's preview status are checked on
the pushed PR commit; the PR records the actual result. No production release
is claimed by this report.
