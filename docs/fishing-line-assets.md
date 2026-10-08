# Fishing line asset integration

Branch: feat/fishing-line-assets

## Upload
Each folder in `public/assets/items/lines/` has a README placeholder. Upload `icon.webp` (256x192) and `detail.webp` (1024x768) to the matching folder. Use WebP quality 82-85. Preserve 4:3; avoid stretching. Source images should be kept outside deployed `public/` when possible.

## Catalog
`data/fishing-lines.catalog.json` is a **staging catalog**, not wired into runtime. All stats are provisional balancing values, NOT verified manufacturer ratings. The PE #1.0 designation is not a diameter in mm. Sewing thread is intentionally weak. Before enabling gameplay, map catalog IDs to existing item IDs and check saves, store, bag, rod setup, line break and abrasion calculations.

## Acceptance
Check missing-image fallback, asset dimensions, browser caching, mobile UI, no changes to existing inventory saves, and unit/browser tests. Do not merge until these pass.
