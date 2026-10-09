# Six-system runtime integration

The six systems are implemented in `feat/realistic-fishing-systems`, connected to
the engine, saved state and playable UI. PR #4 is the review boundary. Main and
production have not been changed by this implementation.

| System | Playable behavior | Modules |
| --- | --- | --- |
| Inventory and bags | Separate home storage from carried rods, bait and accessories; four bag sizes; validate departure and reject overflow without deleting assets. Equipped parts do not consume spare slots. At the bank, only carried items can equip. | `inventory.js`, `save.js`, `engine.js`, `ui.js` |
| Shop and equipment | Purchases enter home storage; structured stats compare candidates with current gear. Wallet, ownership, transfers and rewards commit atomically with persistent replay receipts. | `economy.js`, `equipment.js`, `engine.js`, `ui.js` |
| Bait and gathering | Mount one portion without spending it on cast; intact bait survives waiting, retrieval and reload. Eating, loss and replacement consume natural bait once. Reusable bait survives bites/retrieval and is consumed on actual loss. v0.4 replaces instant gathering with daily garden care: corn needs 72 healthy hours, worms recover in moist organic soil with rolling 24h digging, and leaf compost permits delayed recovery from zero money/stock. See GARDEN.md. | `bait-system.js`, `engine.js` |
| Rig and float | Adjust leader diameter/length, hook size, lead, bait depth and sinker spacing; save up to 12 presets. Buoyancy follows submerged ellipsoid/tapered-tip volume, apparent loads, bottom support and current. Bad calibration affects sensitivity; bottom/lure setups do not require a float. | `equipment.js`, `rig-physics.js`, `engine.js`, `ui.js` |
| Practical tutorial | Ten optional lessons record successful gameplay outcomes rather than button clicks; progress and each one-time reward survive reload. The three existing quiz lessons remain available. | `tutorial.js`, `engine.js`, `ui.js` |
| Catch lifecycle | Landed fish can be kept or released; keepnet, bucket and box enforce count and weight limits. Full containers preserve the pending fish. Return transfers kept fish home; sale, cooking and gifting are mutually exclusive and replay safe. | `catch-inventory.js`, `engine.js`, `app.js` |

## Save compatibility

The original `tron-vo-di-cau.v01` key and `version: 1` marker remain readable.
Additive `schemaVersion: 2` stores inventory, mounted bait, presets, trip,
home fish, tutorial and transaction receipts. Existing currency, owned gear,
stock, catch records, journal, settings and rewards are preserved. Legacy kept
fish become fish at home; migration never truncates them to a smaller capacity.

Before the first migrated write, the original payload is backed up. Corrupt or
unsupported future saves remain protected against overwrite; a usable backup
can be played without erasing the original. Failed storage writes do not commit
normalized state to the active player.

## Controls and scene regression boundary

The two-hand input module, scene geometry, fish/world movement, video loader,
audio module and existing assets are unchanged. Integration preserves cast
flight, water targeting, float perspective, pointer cancellation, orientation,
pause, audio settings and natural fish selection. Opening bank setup preserves
the trip, selected bank and kept fish; only choosing home ends the trip.

Each subsystem has an additive flag under `systems.flags`: `inventory`,
`economy`, `bait`, `rig`, `tutorial`, `catch`. All are enabled for new and
migrated saves. Engine regression tests also exercise all flags disabled.

## Verification and limits

Acceptance evidence, reproducible commands and deployment status are in
[SIX_SYSTEMS_VERIFICATION.md](SIX_SYSTEMS_VERIFICATION.md). Node, real Chromium
and independent review cover the integrated behavior and old-save recovery.
Mobile checks use browser touch emulation, not a physical Android/iOS device.

The game still owns one instance of each rod/accessory definition. Stable IDs,
locations and durability are persisted, but wear, repair and duplicate copies
are future capabilities. Float geometry and strength values are authored game
ratings, not measurements or guarantees for real fishing equipment. Gathering
uses stock caps; cooldowns are not required to recover free bait.
