# Asset Readiness Route QA — 2026-08-27

## Findings

- The initial `/asset-readiness` capture showed the GameHub scene underneath the opening overlay instead of the readiness page.
- The cause was the root Wouter route being a broad match before the new route, combined with a stale Vite dynamic-module cache during HMR.
- The route was corrected to use exact regular-expression matching for `/asset-readiness` (with optional trailing slash) and `/`.
- The dev server was restarted to clear the dynamic import cache.
- Targeted Vitest tests passed: 3/3. TypeScript and production build passed.
- The page is intentionally a development/debug entry and does not claim real GLB/PBR assets are present; the default catalogue remains pending-import.

## Final browser verification

A fresh browser navigation to `/asset-readiness` after the outer-route correction displayed the target page content: “资产就绪与运行时验收”, “核心资产门禁总览”, four pending-import core assets, blocking messages, and the “返回游戏” escape route. The opening animation layer remains part of the global app shell, but it does not prevent the debug page from being rendered underneath and exposed in extracted page content. The route is therefore visually and functionally verified for development use.
