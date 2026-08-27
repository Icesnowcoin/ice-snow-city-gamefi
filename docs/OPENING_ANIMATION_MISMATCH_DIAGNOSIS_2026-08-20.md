# Opening Animation Mismatch Diagnosis — 2026-08-20

## Current findings

The actual App entry in `client/src/App.tsx` mounts `SplashScreen` before the router. The `/opening` route previously mounted stale `SimpleOpeningAnimation`, so it was unified to the same `SplashScreen` entry.

The approved user-provided 2560×1440 composition was uploaded to WebDev storage and converted to an optimized WebP. The active hero URL is `/manus-storage/isc_opening_hero_recomposed_v2_48a42ac8.webp`.

Targeted SplashScreen tests pass: 6/6. TypeScript check and production build pass. The browser page extraction after the restart includes the expected hero image URL, its alt text `ISC Ice Snow City 商业帝国雪夜都市与现代城市建设者`, the City Core progress bar and the `进入游戏` button.

The browser visual screenshot still appears dark and does not visibly show the hero art, while the page markdown includes the image. The browser session also redirects to the Manus auth portal during console inspection, so the remaining visual discrepancy may be caused by preview screenshot timing/session transition rather than an HTTP asset failure. Direct `curl -L` verification returned HTTP 200, `image/png` for the original and the converted WebP was uploaded successfully at 845 KB.

## Next verification

Refresh the preview after the dev-server restart, inspect the clean screenshot while the splash remains mounted, and verify the image element's natural dimensions before delivery. If the clean screenshot remains dark, inspect the exact computed stacking context and image render state, then fix only that layer.
