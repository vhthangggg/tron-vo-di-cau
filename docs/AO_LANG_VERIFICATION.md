# Ao Làng verification — 2026-10-07

The reviewed PR #2 head was `d02c468d0d51f50eb8de4c0672a78287e17f9f32`.
Vercel reported READY even though GitHub's gameplay validation failed: 30 of
34 tests failed and the browser could not construct `FishingGame`.

## Fixed

- Populate the actual number of map spots instead of always accessing three.
- Update the old Ao Làng starter rig depth without resetting progress.
- Convert pointer coordinates through the rotated phone layout and 16:9 video
  cover crop. Use the same projection for the cast flight, line and float.
- Use local canvas dimensions after rotation; remove the duplicate video float.
- Clear cast targets when switching banks/maps or beginning a new session.
- Allow retrieval, pause/exit confirmation and deadline recovery during casting.
- Reference the native `window.screen.orientation` API rather than the app's
  screen-name string; keep the portrait fallback within the viewport.
- Require gameplay tests in the Vercel build and check that both MP4s are packaged.

## Evidence

- `npm test`: **42/42 pass**, including the existing 50-seed starter catch test,
  all 50 species, save compatibility, cast cancellation and projection regressions.
- `npm run build`: passes with both video files and the PNG overview present.
- `npm run test:browser:spots`: **9 browser groups pass** at 1280×720,
  844×390 and 390×844. Both banks play their video; water taps place the float
  correctly; near floats are larger; casting exits require confirmation;
  two simultaneous touch inputs land and release a naturally selected fish;
  pause freezes the game clock. No application exceptions or HTTP asset errors.
- The three new map assets were byte-verified against the repository blob SHAs.

The browser run used Chromium 153 with Playwright. Native device orientation-lock
support depends on the browser; the rotated CSS fallback was exercised. This
report does not claim a physical Android/iOS device test or successful access to
Vercel runtime logs (that endpoint returned HTTP 403).

Existing legacy browser scripts are separate from the new spot-specific run;
the nine-group result above is specifically `test:browser:spots`.
