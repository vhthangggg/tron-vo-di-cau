# Mobile fishing experience — 2026-10-07

This update builds on the verified PR #2 snapshot `54812df`.

## Changes

- One Ao Làng overview replaces the duplicated map hero/spot selector. The same
  image has two selected-state, keyboard-accessible bank markers.
- One compact top bar holds location, clock, audio, information and pause.
  Two-hand pads stay hidden while waiting and appear at nibble/bite/fight/snag.
  Their geometry stays fixed from hookset through landing. The signal close-up
  appears when useful and can be pinned from the information dialog.
- Original Web Audio arrangements cover the home screen and all ten maps, with
  nylon/piano, warm sustained tones and distinct tempos/keys. Casting, splash,
  nibble, bite, hookset, reel, snag, tension warning and catch decisions have
  separate cues. First gesture unlocks audio; master mute and separate music/
  effects levels persist. Music stops on pause/background; voices and PCM cache
  are bounded and completed sources disconnect.
- Catch choices are **bring home**, **keep**, and **release**, with short comic
  previews and a contextual remark after choosing. Keepnet, bucket and box are
  persistent containers. Stored fish can later be sold, gifted or released;
  sales credit the wallet only once. The collection is retained for every fate.
  Existing pending sales remain supported by the engine and save migration.
- The arrival screen downloads the complete selected MP4 with byte-based
  progress, then waits for decode/play readiness. Controls and the session clock
  stay blocked until ready. Failed/slow downloads allow retry or departure.
  The scene uses the downloaded blob without refetching on catch resolution.
  Leaving releases its blob and aborts an unfinished request.
- Rotated phone dialogs are centered on the viewport. All three catch choices
  fit without scrolling at the tested phone dimensions.

## Verification

- `npm test`: **50/50 pass**. New regressions cover all three fates, atomic sales,
  full-container recovery, old save migration, map arrangements, complete-byte
  loading, decode failure, cancellation and timeout.
- `npm run build` and `git diff --check`: pass.
- `npm run test:browser:spots`: **9 groups pass** across 1280×720, 844×390 and
  390×844, including both video banks and naturally selected two-touch catches.
- `npm run test:browser:experience`: **5 groups pass**, including a held video
  request/frozen clock, failed request/retry, one overview, 44px controls,
  clear waiting HUD, gesture audio unlock, persisted mix and every catch choice.
  A kept bucket fish survives reload and sells once. A catch never reloads video.
- 375×812 portrait fallback and 844×390 landscape are checked. The waiting HUD
  leaves over 77% of the scene clear in the measured landscape fixture. Catch
  dialogs fit their viewport and all three choices are fully visible.

Browser checks used Chromium 153 with Playwright. They are not physical-device
or speaker-quality tests. The protected Vercel preview still requires the user's
normal authentication; no sharing/authentication settings are changed.
