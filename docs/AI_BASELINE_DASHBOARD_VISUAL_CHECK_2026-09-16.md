# AI Baseline Dashboard Visual Check — 2026-09-16

## Preview findings

The first preview of `/admin/ai-baseline` returned the existing 404 page because the route was initially registered only inside the nested admin router. The route was then changed to an explicit top-level route wrapped by `AdminLayout`.

The second preview of `/admin/ai-baseline` reached the existing Owner-only access boundary and displayed `权限不足 / 仅限项目 Owner 访问此系统`. This confirms that the explicit route is registered and that the dashboard remains protected by the project's administrator access policy. The dashboard content itself requires an authenticated project Owner session for visual inspection.

## Test scope

The dashboard component is covered by jsdom tests for overview rendering, evidence-boundary messaging, status filtering, search filtering, and empty-state behavior. Recharts is supported in tests with a lightweight `ResizeObserver` polyfill in `vitest.setup.ts`.
