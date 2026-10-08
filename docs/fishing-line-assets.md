# Fishing line integration

The four uploaded WebP pairs are connected to stable equipment IDs:

| Asset key | Equipment ID | Game rating | Displayed size |
| --- | --- | --- | --- |
| sewing-thread | line_basic | 0.5 kg | 0.15 mm |
| nylon | line18 | 3.5 kg | 0.20 mm |
| pe | braid | 7.5 kg | PE #1.0; no mm measurement |
| copolymer | line_copolymer | 4.2 kg | 0.20 mm |

Existing ownership, equipment IDs and prices remain compatible. The shop shows current-to-new comparisons and opens full detail images on demand. Icons load lazily, retain their square aspect and fall back to the detail image, then a readable label if both files are missing. Shop and rig specifications agree with `data/fishing-lines.catalog.json`.

Ratings and scores are provisional game balance values, not verified manufacturer claims. Fighting retains the calibrated power/grace model; persistent line wear and repair are outside this release. PE's dimensionless current-drag rating is distinct from a measured diameter.

Validation: `npm test`, `npm run test:browser:lines`, built asset checks and production smoke. Original uploaded WebPs remain available in `public/assets/items/lines/<asset-key>/`.
